import { manualPaymentProvider } from "./manual-provider";
import type { PaymentIntent, PaymentProvider } from "./types";

/** The acquirer currently wired up. */
export const paymentProvider: PaymentProvider = manualPaymentProvider;

export type { PaymentIntent, PaymentProvider };
