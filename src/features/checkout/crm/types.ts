import type { Order } from "../types";

export interface CrmSubmission {
  /** The reference the CRM assigned to the order. */
  reference: string;
  acceptedAt: string;
}

export interface CrmProvider {
  readonly id: string;
  /** Returns `null` when the CRM refused the order; the order still stands. */
  createOrder(order: Order): Promise<CrmSubmission | null>;
}
