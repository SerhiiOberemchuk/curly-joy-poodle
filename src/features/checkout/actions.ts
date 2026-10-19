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
  token?: string,
  shown?: string,
): Promise<void> {
  let current = "unavailable";
  try {
    current = (await settleCheckoutReturn(token))?.status ?? "unavailable";
  } catch {
    // The refreshed page reports an unavailable status; never infer a successful payment.
  }
  if (current !== shown) refresh();
}

export async function retryPaymentAction(token?: string): Promise<void> {
  redirect(await retryCheckoutPayment(token));
}
