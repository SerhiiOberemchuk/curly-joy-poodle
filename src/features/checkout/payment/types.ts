import type { Order } from "../types";

export interface PaymentIntent {
  /** Where the customer continues payment; `null` when nothing else is needed now. */
  redirectUrl: string | null;
  status: "pending" | "not-required";
  /** Customer-facing explanation of the next step. */
  note: string;
}

export interface PaymentProvider {
  readonly id: string;
  createPayment(order: Order): Promise<PaymentIntent>;
}
