import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { siteOrigin } from "@/lib/origin";

import type { Order, PaymentStatus } from "../types";
import { LIQPAY_API_URL, LIQPAY_CHECKOUT_URL } from "./liqpay-constants";
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
  rro_info?: LiqPayRroInfo;
}

/**
 * Fiscalisation data. LiqPay only acts on it when the shop has ПРРО enabled in
 * its account, which is why it is opt-in: sending it to an account without
 * fiscalisation buys nothing and risks a rejected payment.
 */
interface LiqPayRroInfo {
  items: {
    id: string;
    amount: number;
    /** Hryvnia, not kopiyky — LiqPay works in major units here. */
    price: number;
    cost: number;
  }[];
  delivery_emails?: string[];
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

/**
 * Reads the envelope LiqPay uses for both the callback and the status reply.
 * A record without a usable amount is not a payment — it is an API error such
 * as `payment_not_found` — and is reported as "no information" rather than as
 * a failed payment.
 */
function readPayment(payload: Record<string, unknown>): LiqPayCallback | null {
  const orderId = readText(payload.order_id);
  const amount = Number(payload.amount);
  if (!orderId || !Number.isFinite(amount)) return null;

  return {
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
  };
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

  const value = readPayment(decoded as Record<string, unknown>);
  return value ? { ok: true, value } : { ok: false, reason: "payload" };
}

/**
 * Asks LiqPay what happened to a payment. The server callback stays the
 * primary signal — this is the way out of the gap where the customer is back
 * on the site before the callback has landed, or where it never arrives at all.
 *
 * Returns `null` whenever LiqPay has nothing to report; the caller keeps
 * whatever status it already had rather than inventing a failure.
 */
export async function requestLiqPayStatus(
  orderNumber: string,
): Promise<LiqPayCallback | null> {
  if (readMode() === "mock") return null;

  try {
    const { publicKey, privateKey } = credentials();
    const data = Buffer.from(
      JSON.stringify({
        version: 3,
        public_key: publicKey,
        action: "status",
        order_id: orderNumber,
      }),
      "utf8",
    ).toString("base64");

    const response = await fetch(LIQPAY_API_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data, signature: sign(data, privateKey) }),
      // A confirmation screen must not hang on a slow acquirer.
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const decoded: unknown = await response.json();
    if (typeof decoded !== "object" || decoded === null) return null;
    return readPayment(decoded as Record<string, unknown>);
  } catch (error) {
    console.error(
      "[liqpay] status request failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
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
export interface LiqPayLineItem {
  sku: string;
  title: string;
  size: string;
  quantity: number;
  /** Minor units. */
  unitPrice: number;
  /** Minor units. */
  lineTotal: number;
}

export interface LiqPayPayable {
  number: string;
  /** Minor units. */
  subtotal: number;
  /** Prefills LiqPay's receipt field and receives the fiscal receipt with ПРРО on. */
  email?: string;
  items?: readonly LiqPayLineItem[];
}

function rroEnabled(): boolean {
  return process.env.LIQPAY_RRO === "true";
}

/** Long enough to list a normal basket, short enough to stay one readable line. */
const MAX_DESCRIPTION_LENGTH = 420;

/**
 * What the customer reads on the LiqPay page and in the emailed receipt. The
 * basket is spelled out so the payment is recognisable months later on a bank
 * statement, and trimmed rather than truncated mid-word.
 */
function buildDescription(order: LiqPayPayable): string {
  const head = `Curly Joy · замовлення ${order.number}`;
  const items = order.items ?? [];
  if (items.length === 0) return head;

  const parts: string[] = [];
  let used = head.length + 3;

  for (const [index, item] of items.entries()) {
    const part = `${item.title} (${item.size}) ×${item.quantity}`;
    const remaining = items.length - index;
    if (used + part.length + 2 > MAX_DESCRIPTION_LENGTH) {
      parts.push(`та ще ${remaining} поз.`);
      break;
    }
    parts.push(part);
    used += part.length + 2;
  }

  return `${head} · ${parts.join(", ")}`;
}

function buildRroInfo(order: LiqPayPayable): LiqPayRroInfo | undefined {
  if (!rroEnabled()) return undefined;
  const items = order.items ?? [];
  if (items.length === 0) return undefined;

  return {
    items: items.map((item) => ({
      id: item.sku,
      amount: item.quantity,
      price: item.unitPrice / 100,
      cost: item.lineTotal / 100,
    })),
    ...(order.email ? { delivery_emails: [order.email] } : {}),
  };
}

export function createLiqPayCheckout(order: LiqPayPayable): PaymentCheckout {
  const mode = readMode();
  if (mode === "mock") {
    return { provider: "liqpay", mock: true, data: "", signature: "" };
  }

  const { publicKey, privateKey } = credentials();
  const rroInfo = buildRroInfo(order);
  const payload: LiqPayCheckoutPayload = {
    version: 3,
    public_key: publicKey,
    action: "pay",
    amount: (order.subtotal / 100).toFixed(2),
    currency: "UAH",
    description: buildDescription(order),
    order_id: order.number,
    result_url: liqPayResultUrl(order.number),
    server_url: `${siteOrigin()}/api/payments/liqpay/callback`,
    language: "uk",
    ...(mode === "sandbox" ? { sandbox: 1 as const } : {}),
    ...(rroInfo ? { rro_info: rroInfo } : {}),
  };
  const data = encode(payload);

  return { provider: "liqpay", mock: false, data, signature: sign(data, privateKey) };
}

/**
 * Asks LiqPay to email the payment receipt to the customer. LiqPay calls this
 * action `ticket`; the address is the one the customer typed at checkout.
 *
 * Returns whether LiqPay accepted the request. A refusal is logged and
 * otherwise ignored — a missing receipt email must never break the order.
 */
export async function sendLiqPayReceipt(
  orderNumber: string,
  email: string,
): Promise<boolean> {
  if (readMode() === "mock") return false;

  try {
    const { publicKey, privateKey } = credentials();
    const data = Buffer.from(
      JSON.stringify({
        version: 3,
        public_key: publicKey,
        action: "ticket",
        order_id: orderNumber,
        email,
        language: "uk",
      }),
      "utf8",
    ).toString("base64");

    const response = await fetch(LIQPAY_API_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data, signature: sign(data, privateKey) }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    const decoded: unknown = await response.json().catch(() => null);
    const result =
      typeof decoded === "object" && decoded !== null
        ? (decoded as Record<string, unknown>)
        : null;

    if (result?.result === "ok") return true;

    console.error(
      `[liqpay] receipt for ${orderNumber} was not sent:`,
      readText(result?.err_description) ?? readText(result?.status) ?? "unknown",
    );
    return false;
  } catch (error) {
    console.error(
      "[liqpay] receipt request failed:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
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
          checkout: createLiqPayCheckout({
            number: order.number,
            subtotal: order.subtotal,
            email: order.customer.email,
            items: order.items,
          }),
        };
    }
  },
};
