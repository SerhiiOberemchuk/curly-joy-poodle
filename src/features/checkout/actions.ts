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
    if (result.cartChanged) refresh();
    return result.state;
  }
  redirect(result.redirectTo);
}

export async function checkPaymentStatusAction(): Promise<void> {
  try {
    await settleCheckoutReturn();
  } catch {
    // The refreshed page reports an unavailable status; never infer a successful payment.
  }
  refresh();
}

export async function retryPaymentAction(): Promise<void> {
  redirect(await retryCheckoutPayment());
}
