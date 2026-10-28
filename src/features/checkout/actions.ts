"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { CheckoutActionState } from "./action-state";
import { retryCheckoutPayment, submitCheckout } from "./checkout.server";
import { settleCheckoutReturn } from "./payment/settlement";

export async function placeOrderAction(
  _state: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const result = await submitCheckout(formData);
  if (!result.ok) {
    if (result.stale) refresh();
    return result.state;
  }
  redirect(result.redirectTo);
}

/**
 * `shown` is the status the waiting page displays. The poll runs every few
 * seconds, so the page is re-rendered (another CRM read) only when the status
 * actually changed; the "Оновити статус" button passes none and always refreshes.
 */
export async function checkPaymentStatusAction(
  token: string,
  shown?: string,
): Promise<void> {
  await syncPaymentStatusAction(token, shown);
}

/** Returns only the revision of the purchased basket, never a cart mutation. */
export async function syncPaymentStatusAction(
  token: string,
  shown?: string,
): Promise<{ cartRevision?: string }> {
  if (typeof token !== "string" || !token) return {};
  let current = "unavailable";
  let cartRevision: string | undefined;
  try {
    const receipt = await settleCheckoutReturn(token);
    current = receipt?.status ?? "unavailable";
    if (receipt?.status === "paid" || receipt?.payment === "cod")
      cartRevision = receipt.cartRevision;
  } catch {
    // The refreshed page reports an unavailable status; never infer a successful payment.
  }
  if (current !== shown) refresh();
  return { cartRevision };
}

export async function retryPaymentAction(token: string): Promise<void> {
  if (typeof token !== "string" || !token) redirect("/checkout");
  redirect(await retryCheckoutPayment(token));
}
