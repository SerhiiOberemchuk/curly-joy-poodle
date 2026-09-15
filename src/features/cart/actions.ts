"use server";

import { refresh } from "next/cache";

import { findVariant } from "@/features/catalog/queries";
import type { SizeCode } from "@/features/catalog/types";
import { clamp, readInt, readString } from "@/lib/form";

import type { CartActionState } from "./action-state";
import { readCartCookie, writeCartCookie } from "./cart-cookie";
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "./constants";
import type { StoredCartLine } from "./types";

function failure(message: string): CartActionState {
  return { status: "error", message };
}

export async function addToCartAction(
  _state: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const productId = readString(formData, "productId");
  const size = readString(formData, "size") as SizeCode;
  const requested = readInt(formData, "quantity", 1);

  if (!productId || !size) {
    return failure("Оберіть розмір, щоб додати товар у кошик.");
  }

  const match = await findVariant(productId, size);
  if (!match) {
    return failure("Цей товар більше недоступний.");
  }
  if (match.variant.stock === 0) {
    return failure(`Розмір ${size} тимчасово відсутній.`);
  }

  const lines = await readCartCookie();
  const existing = lines.find((item) => item.p === productId && item.s === size);

  if (existing) {
    const next = clamp(existing.q + requested, 1, Math.min(match.variant.stock, MAX_LINE_QUANTITY));
    if (next === existing.q) {
      return failure(`У кошику вже максимальна доступна кількість (${next} шт.).`);
    }
    existing.q = next;
  } else {
    if (lines.length >= MAX_CART_LINES) {
      return failure("У кошику забагато позицій. Оформіть поточне замовлення.");
    }
    lines.push({
      p: productId,
      s: size,
      q: clamp(requested, 1, Math.min(match.variant.stock, MAX_LINE_QUANTITY)),
    });
  }

  await writeCartCookie(lines);
  refresh();

  return { status: "success", message: `${match.product.title} (${size}) — у кошику` };
}

export async function setLineQuantityAction(formData: FormData): Promise<void> {
  const productId = readString(formData, "productId");
  const size = readString(formData, "size") as SizeCode;
  const quantity = readInt(formData, "quantity", 1);

  const lines = await readCartCookie();
  const next = await applyQuantity(lines, productId, size, quantity);

  await writeCartCookie(next);
  refresh();
}

export async function removeLineAction(formData: FormData): Promise<void> {
  const productId = readString(formData, "productId");
  const size = readString(formData, "size") as SizeCode;

  const lines = await readCartCookie();
  await writeCartCookie(lines.filter((item) => !(item.p === productId && item.s === size)));
  refresh();
}

export async function clearCartAction(): Promise<void> {
  await writeCartCookie([]);
  refresh();
}

async function applyQuantity(
  lines: StoredCartLine[],
  productId: string,
  size: SizeCode,
  quantity: number,
): Promise<StoredCartLine[]> {
  if (quantity < 1) {
    return lines.filter((item) => !(item.p === productId && item.s === size));
  }

  const match = await findVariant(productId, size);
  if (!match) {
    return lines.filter((item) => !(item.p === productId && item.s === size));
  }

  const ceiling = Math.min(match.variant.stock, MAX_LINE_QUANTITY);
  return lines.map((item) =>
    item.p === productId && item.s === size ? { ...item, q: clamp(quantity, 1, ceiling) } : item,
  );
}
