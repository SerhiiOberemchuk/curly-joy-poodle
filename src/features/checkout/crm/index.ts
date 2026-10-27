import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";

import { CrmApiError, crmRequest } from "@/lib/crm-client";
import type { CrmAttribution } from "@/lib/attribution";
import type { CrmMarketingConsent } from "../marketing-consent";
import { siteUrl } from "@/lib/origin";
import type { Order, OrderItem } from "../types";
import {
  createPaymentReturnToken,
  readPaymentReturnToken,
} from "../payment/return-token";
import {
  capabilitiesSchema,
  crmOrderSchema,
  npCitySchema,
  npStreetSchema,
  npWarehouseSchema,
  orderAcceptedSchema,
  paymentLinkSchema,
  type CrmPaymentLink,
  type NpWarehouse,
} from "./types";

async function requestData<T>(
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T> {
  return z.object({ data: schema }).parse(await crmRequest(path, body)).data;
}

export async function getCapabilities() {
  return requestData("/capabilities", capabilitiesSchema);
}

// Nova Poshta directories change rarely, while each buyer's keystrokes would
// otherwise all reach the CRM's per-minute carrier quota — the same quota the
// order's address check spends. So every lookup is shared across buyers and
// server instances, and checkout re-checks a choice against the very search
// that offered it. A failed lookup throws and is never cached.
export async function getNpCities(query: string) {
  "use cache: remote";
  cacheLife("hours");
  return requestData(
    `/carriers/nova_poshta/cities?q=${encodeURIComponent(query)}`,
    z.array(npCitySchema),
  );
}

/** The picker's page size: enough to scroll, small enough to type into. */
const NP_WAREHOUSE_PAGE = 100;
const npWarehousePageSchema = z.object({
  data: z.array(npWarehouseSchema),
  pagination: z.object({ total: z.number().int().nonnegative() }),
});

/**
 * A city's points matching `query` — a branch number («5», exact match first)
 * or part of the address; an empty query is the city's first page. A big city
 * has thousands of points (Kyiv over 8 000), so the CRM searches, not lists.
 */
export async function getNpWarehouses(
  cityRef: string,
  query: string,
): Promise<{ items: NpWarehouse[]; total: number }> {
  "use cache: remote";
  cacheLife("hours");
  const search = new URLSearchParams({
    cityRef,
    perPage: String(NP_WAREHOUSE_PAGE),
  });
  if (query) search.set("q", query);
  const body = npWarehousePageSchema.parse(
    await crmRequest(`/carriers/nova_poshta/warehouses?${search}`),
  );
  return { items: body.data, total: body.pagination.total };
}

export async function getNpStreets(cityRef: string, query: string) {
  "use cache: remote";
  cacheLife("hours");
  return requestData(
    `/carriers/nova_poshta/streets?cityRef=${encodeURIComponent(cityRef)}&q=${encodeURIComponent(query)}`,
    z.array(npStreetSchema),
  );
}

export function orderPayload(order: Order) {
  const { customer, delivery } = order;
  return {
    externalId: order.number,
    currency: "UAH",
    ...(order.promotion ? { promotion: order.promotion } : {}),
    customer: {
      ...customer,
      shippingAddress: {
        country: "UA",
        city: delivery.city,
        line1: delivery.destination,
      },
    },
    delivery: {
      carrier: "nova_poshta",
      method: delivery.method === "np-courier" ? "courier" : "branch",
      cityRef: delivery.cityRef,
      ...(delivery.method === "np-courier"
        ? {
            streetRef: delivery.streetRef,
            building: delivery.building,
            ...(delivery.flat ? { flat: delivery.flat } : {}),
          }
        : { branch: delivery.destination, branchRef: delivery.branchRef }),
      recipientName: `${customer.firstName} ${customer.lastName}`,
      phone: customer.phone,
      cod: order.payment === "cod",
      ...(delivery.comment ? { comment: delivery.comment } : {}),
    },
    items: orderItemsPayload(order.items),
    notes: `Оплата: ${order.payment === "card" ? "Monobank" : "накладений платіж"}.${order.promotion ? "" : order.freeShipping ? " Доставка коштом магазину." : " Доставка за тарифами перевізника."}`,
  };
}

export function orderItemsPayload(
  items: readonly Pick<
    OrderItem,
    "sku" | "title" | "option" | "quantity" | "unitPrice"
  >[],
) {
  return items.map((item) => ({
    productName: `${item.title}${item.option ? ` · ${item.option}` : ""}`,
    ...(item.sku ? { sku: item.sku } : {}),
    quantity: item.quantity,
    unitPrice: (item.unitPrice / 100).toFixed(2),
  }));
}
export async function createCrmOrder(
  order: Order,
  attribution?: CrmAttribution,
  marketingConsent?: CrmMarketingConsent,
): Promise<{ id: string; number: string | null }> {
  // Outside orderPayload on purpose: the order's idempotency key is derived from
  // that payload, and the CRM keeps attribution out of its own idempotency hash.
  const payload = orderPayload(order);
  return requestData("/orders", orderAcceptedSchema, {
    ...payload,
    ...(marketingConsent
      ? { customer: { ...payload.customer, marketingConsent } }
      : {}),
    ...(attribution ? { attribution } : {}),
  });
}
export async function getCrmOrder(externalId: string) {
  return requestData(
    `/orders/${encodeURIComponent(externalId)}`,
    crmOrderSchema,
  );
}
export function paymentReturnUrl(): string | undefined {
  const url = siteUrl("/checkout/success");
  // CRM accepts only HTTPS. Local development uses the CRM's hosted return page.
  return url.startsWith("https://") ? url : undefined;
}
export function validateCheckoutUrl(link: CrmPaymentLink): `https://${string}` {
  const url = new URL(link.checkoutUrl);
  if (
    link.provider !== "monobank" ||
    url.protocol !== "https:" ||
    url.username ||
    url.password
  ) {
    throw new CrmApiError(502, "INVALID_PAYMENT_LINK");
  }
  return url.href as `https://${string}`;
}
export async function getOrCreatePaymentLink(
  externalId: string,
): Promise<`https://${string}`> {
  const path = `/orders/${encodeURIComponent(externalId)}/payment-link`;
  const returnUrl = paymentReturnUrl();
  try {
    const data = await requestData(path, paymentLinkSchema);
    if (
      data.provider === "monobank" &&
      (await matchesReturnUrl(data.returnUrl, returnUrl, externalId)) &&
      (!data.expiresAt || Date.parse(data.expiresAt) > Date.now())
    ) {
      return validateCheckoutUrl(data);
    }
  } catch (error) {
    if (!(error instanceof CrmApiError) || error.status !== 404) throw error;
  }
  const data = await requestData(path, paymentLinkSchema, {
    provider: "monobank",
    ...(returnUrl
      ? { returnUrl: await authorizedReturnUrl(returnUrl, externalId) }
      : {}),
  });
  return validateCheckoutUrl(data);
}

async function authorizedReturnUrl(
  base: string,
  number: string,
): Promise<string> {
  const url = new URL(base);
  url.searchParams.set("token", await createPaymentReturnToken(number));
  return url.href;
}

async function matchesReturnUrl(
  stored: string | null,
  base: string | undefined,
  number: string,
): Promise<boolean> {
  if (!base) return stored === null;
  if (!stored) return false;
  const url = new URL(stored);
  const target = new URL(base);
  return (
    url.origin === target.origin &&
    url.pathname === target.pathname &&
    (await readPaymentReturnToken(url.searchParams.get("token") ?? "")) ===
      number
  );
}
