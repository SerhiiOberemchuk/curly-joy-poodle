"use server";

import { refresh } from "next/cache";

import { findVariant } from "@/features/catalog/queries";
import { clamp, readInt, readString } from "@/lib/form";

import type { CartActionState } from "./action-state";
import { readCartCookie, writeCartCookie } from "./cart-cookie";
import { MAX_CART_LINES } from "./constants";
import { maxQuantityForVariant } from "./quantity";
import type { StoredCartLine } from "./types";

function failure(message: string): CartActionState {
  return { status: "error", message };
}

export async function addToCartAction(
  _state: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const variantId = readString(formData, "variantId");
  const requested = readInt(formData, "quantity", 1);

  if (!variantId) {
    return failure("Оберіть варіант, щоб додати товар у кошик.");
  }

  if (!Number.isSafeInteger(requested) || requested < 1) {
    return failure("Вкажіть коректну кількість товару.");
  }
  let match: Awaited<ReturnType<typeof findVariant>>;
  try {
    match = await findVariant(variantId);
  } catch {
    return failure("Не вдалося перевірити наявність товару. Спробуйте ще раз.");
  }
  refresh();
  if (!match) {
    return failure("Цей товар більше недоступний.");
  }
  const { product, variant } = match;
  const name = variant.label ? `${product.title} (${variant.label})` : product.title;
  if (!variant.inStock) {
    return failure(`${name} — тимчасово немає в наявності.`);
  }

  const lines = await readCartCookie();
  const existing = lines.find((item) => item.p === variantId);
  const ceiling = maxQuantityForVariant(variant);
  const nextQuantity = requested + (existing?.q ?? 0);
  if (!Number.isSafeInteger(nextQuantity)) return failure("Вкажіть коректну кількість товару.");
  if (ceiling !== null && nextQuantity > ceiling) {
    return failure(`Максимально доступно до замовлення ${ceiling} шт. цього товару.`);
  }

  if (existing) {
    existing.q = nextQuantity;
  } else {
    if (lines.length >= MAX_CART_LINES) {
      return failure("У кошику забагато позицій. Оформіть поточне замовлення.");
    }
    lines.push({ p: variantId, q: requested });
  }

  await writeCartCookie(lines);
  refresh();

  return { status: "success", message: `${name} — у кошику` };
}

export async function setLineQuantityAction(formData: FormData): Promise<void> {
  const variantId = readString(formData, "variantId");
  const quantity = readInt(formData, "quantity", 1);
  if (!Number.isSafeInteger(quantity)) return;

  const lines = await readCartCookie();
  const next = await applyQuantity(lines, variantId, quantity);

  await writeCartCookie(next);
  refresh();
}

export async function removeLineAction(formData: FormData): Promise<void> {
  const variantId = readString(formData, "variantId");

  const lines = await readCartCookie();
  await writeCartCookie(lines.filter((item) => item.p !== variantId));
  refresh();
}

export async function clearCartAction(): Promise<void> {
  await writeCartCookie([]);
  refresh();
}

async function applyQuantity(
  lines: StoredCartLine[],
  variantId: string,
  quantity: number,
): Promise<StoredCartLine[]> {
  if (quantity < 1) {
    return lines.filter((item) => item.p !== variantId);
  }

  const match = await findVariant(variantId);
  if (!match || !match.variant.inStock) {
    return lines.filter((item) => item.p !== variantId);
  }

  const ceiling = maxQuantityForVariant(match.variant);
  return lines.map((item) =>
    item.p === variantId ? { ...item, q: ceiling === null ? quantity : clamp(quantity, 1, ceiling) } : item,
  );
}
