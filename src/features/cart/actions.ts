"use server";

import { refresh } from "next/cache";

import { findVariant } from "@/features/catalog/queries";
import { clamp, readInt, readString } from "@/lib/form";

import type { CartActionState } from "./action-state";
import { readCartCookie, writeCartCookie } from "./cart-cookie";
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "./constants";
import type { StoredCartLine } from "./types";

function failure(message: string): CartActionState {
  return { status: "error", message };
}

/** Untracked stock (`null`) is limited only by the per-line cap. */
function ceilingFor(stock: number | null): number {
  return Math.min(stock ?? MAX_LINE_QUANTITY, MAX_LINE_QUANTITY);
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

  const match = await findVariant(variantId);
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
  const ceiling = ceilingFor(variant.stock);

  if (existing) {
    const next = clamp(existing.q + requested, 1, ceiling);
    if (next === existing.q) {
      return failure(`У кошику вже максимальна доступна кількість (${next} шт.).`);
    }
    existing.q = next;
  } else {
    if (lines.length >= MAX_CART_LINES) {
      return failure("У кошику забагато позицій. Оформіть поточне замовлення.");
    }
    lines.push({ p: variantId, q: clamp(requested, 1, ceiling) });
  }

  await writeCartCookie(lines);
  refresh();

  return { status: "success", message: `${name} — у кошику` };
}

export async function setLineQuantityAction(formData: FormData): Promise<void> {
  const variantId = readString(formData, "variantId");
  const quantity = readInt(formData, "quantity", 1);

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
  if (!match) {
    return lines.filter((item) => item.p !== variantId);
  }

  const ceiling = ceilingFor(match.variant.stock);
  return lines.map((item) =>
    item.p === variantId ? { ...item, q: clamp(quantity, 1, ceiling) } : item,
  );
}
