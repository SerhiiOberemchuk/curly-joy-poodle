import type { Order } from "../types";

/** Signed fields the browser posts to the acquirer's hosted checkout. */
export interface PaymentCheckout {
  provider: "liqpay";
  /** Simulated locally: nothing is signed and nothing leaves the app. */
  mock: boolean;
  data: string;
  signature: string;
}

/** The pages a payment intent may hand the customer over to. */
export type CheckoutRoute = "/checkout/pay" | "/checkout/success";

export interface PaymentIntent {
  /** Where the customer continues payment; `null` when nothing else is needed now. */
  redirectUrl: CheckoutRoute | null;
  status: "pending" | "not-required" | "paid";
  /** Customer-facing explanation of the next step. */
  note: string;
  /** Present only when the customer has to be handed over to the acquirer. */
  checkout?: PaymentCheckout;
}

export interface PaymentProvider {
  readonly id: string;
  createPayment(order: Order): Promise<PaymentIntent>;
}
