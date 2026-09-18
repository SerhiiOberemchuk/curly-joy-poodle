import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { siteOrigin } from "@/lib/origin";

import type { Order, PaymentStatus } from "../types";
import { LIQPAY_CHECKOUT_URL } from "./liqpay-constants";
import type { PaymentCheckout, PaymentIntent, PaymentProvider } from "./types";

export { LIQPAY_CHECKOUT_URL };

export type LiqPayMode = "mock" | "sandbox" | "live";

export const LIQPAY_PENDING_NOTE =
  "Очікуємо підтвердження оплати від LiqPay. Щойно банк відповість, ми надішлемо деталі замовлення на email.";
export const LIQPAY_PAID_NOTE =
  "Оплату підтверджено. Деталі замовлення надішлемо на email найближчим часом.";
export const LIQPAY_FAILED_NOTE =
  "Банк не підтвердив оплату. Замовлення збережене — спробуйте оплатити ще раз або оберіть інший спосіб оплати.";

interface LiqPayCheckoutPayload {
  version: 3;
  public_key: string;
  action: "pay";
  amount: string;
  currency: "UAH";
  description: string;
  order_id: string;
  result_url: string;
  server_url: string;
  language: "uk";
  sandbox?: 1;
}

/**
 * Terminal success. `wait_compensation` is a settled payment that is merely
 * waiting to be transferred to the merchant account, so the customer is done.
 */
const PAID_STATUSES = new Set(["success", "sandbox", "wait_compensation"]);

/** Terminal failure — the money is not, and will not be, taken. */
const FAILED_STATUSES = new Set(["failure", "error", "reversed", "expired"]);

function readMode(): LiqPayMode {
  const value = process.env.LIQPAY_MODE;
  if (value === "mock" || value === "sandbox" || value === "live") return value;
  return process.env.NODE_ENV === "production" ? "live" : "mock";
}

function credentials(): { publicKey: string; privateKey: string } {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error(
      "LiqPay is enabled, but LIQPAY_PUBLIC_KEY or LIQPAY_PRIVATE_KEY is missing.",
    );
  }

  return { publicKey, privateKey };
}

function sign(data: string, privateKey: string): string {
  return createHash("sha1")
    .update(`${privateKey}${data}${privateKey}`)
    .digest("base64");
}

function encode(payload: LiqPayCheckoutPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function liqPayMode(): LiqPayMode {
  return readMode();
}

/** The URL LiqPay sends the customer back to. Also used by the mock provider. */
export function liqPayResultUrl(orderNumber: string): string {
  return `${siteOrigin()}/api/payments/liqpay/result?order=${encodeURIComponent(orderNumber)}`;
}

export function verifyLiqPaySignature(data: string, signature: string): boolean {
  const { privateKey } = credentials();
  const expected = Buffer.from(sign(data, privateKey));
  const received = Buffer.from(signature);

  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function paymentStatusFromLiqPay(status: unknown): PaymentStatus {
  if (typeof status !== "string") return "pending";
  if (PAID_STATUSES.has(status)) return "paid";
  if (FAILED_STATUSES.has(status)) return "failed";
  // Everything else — 3ds_verify, otp_verify, processing, wait_accept … — is a
  // payment still in flight. LiqPay will send another callback when it settles.
  return "pending";
}

export interface LiqPayCallback {
  orderId: string;
  status: PaymentStatus;
  /** The raw LiqPay status, worth keeping in logs when something looks off. */
  rawStatus: string;
  /** Minor units, to compare with the order without floating-point drift. */
  amount: number;
  currency: string;
  reference: string | null;
  failureReason: string | null;
}

export type LiqPayCallbackResult =
  | { ok: true; value: LiqPayCallback }
  | { ok: false; reason: "signature" | "payload" };

/**
 * Verifies the signature first, then reads the payload. Anything that does not
 * verify is never parsed, so an unsigned `data` cannot reach the order log.
 */
export function parseLiqPayCallback(data: string, signature: string): LiqPayCallbackResult {
  if (!verifyLiqPaySignature(data, signature)) return { ok: false, reason: "signature" };

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
  } catch {
    return { ok: false, reason: "payload" };
  }
  if (typeof decoded !== "object" || decoded === null) return { ok: false, reason: "payload" };

  const payload = decoded as Record<string, unknown>;
  const orderId = readText(payload.order_id);
  const amount = Number(payload.amount);
  if (!orderId || !Number.isFinite(amount)) return { ok: false, reason: "payload" };

  return {
    ok: true,
    value: {
      orderId,
      status: paymentStatusFromLiqPay(payload.status),
      rawStatus: typeof payload.status === "string" ? payload.status : "unknown",
      amount: Math.round(amount * 100),
      currency: typeof payload.currency === "string" ? payload.currency : "",
      reference:
        readText(payload.payment_id) ??
        readText(payload.transaction_id) ??
        readText(payload.liqpay_order_id),
      failureReason: readText(payload.err_description) ?? readText(payload.err_code),
    },
  };
}

/** Guards against a callback that verifies but describes a different payment. */
export function callbackMatchesOrder(order: Order, callback: LiqPayCallback): boolean {
  return (
    callback.orderId === order.number &&
    callback.currency === "UAH" &&
    callback.amount === order.subtotal
  );
}

/**
 * Builds the signed pair the browser posts to LiqPay. The private key is used
 * here and nowhere else; only `data` and `signature` ever reach the client.
 */
export function createLiqPayCheckout(order: Order): PaymentCheckout {
  const mode = readMode();
  if (mode === "mock") {
    return { provider: "liqpay", mock: true, data: "", signature: "" };
  }

  const { publicKey, privateKey } = credentials();
  const payload: LiqPayCheckoutPayload = {
    version: 3,
    public_key: publicKey,
    action: "pay",
    amount: (order.subtotal / 100).toFixed(2),
    currency: "UAH",
    description: `Оплата замовлення ${order.number} Curly Joy`,
    order_id: order.number,
    result_url: liqPayResultUrl(order.number),
    server_url: `${siteOrigin()}/api/payments/liqpay/callback`,
    language: "uk",
    ...(mode === "sandbox" ? { sandbox: 1 as const } : {}),
  };
  const data = encode(payload);

  return { provider: "liqpay", mock: false, data, signature: sign(data, privateKey) };
}

export const liqPayPaymentProvider: PaymentProvider = {
  id: "liqpay",

  async createPayment(order: Order): Promise<PaymentIntent> {
    switch (order.payment) {
      case "cod":
        return {
          redirectUrl: null,
          status: "not-required",
          note: "Оплата при отриманні у відділенні. Комісія перевізника — за тарифами Нової Пошти.",
        };
      case "invoice":
        return {
          redirectUrl: null,
          status: "pending",
          note: "Рахунок від ФОП 3 групи без ПДВ надішлемо на email протягом робочого дня.",
        };
      case "card":
        return {
          redirectUrl: "/checkout/pay",
          status: "pending",
          note: LIQPAY_PENDING_NOTE,
          checkout: createLiqPayCheckout(order),
        };
    }
  },
};
