import { liqPayPaymentProvider } from "./liqpay";
import type { PaymentCheckout, PaymentIntent, PaymentProvider } from "./types";

/** The acquirer currently wired up. */
export const paymentProvider: PaymentProvider = liqPayPaymentProvider;

export type { PaymentCheckout, PaymentIntent, PaymentProvider };
