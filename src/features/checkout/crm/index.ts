import "server-only";
import { z } from "zod";

import { CrmApiError, crmRequest } from "@/lib/crm-client";
import { siteUrl } from "@/lib/origin";
import type { Order } from "../types";
import {
  capabilitiesSchema,
  crmOrderSchema,
  npCitySchema,
  npStreetSchema,
  npWarehouseSchema,
  orderAcceptedSchema,
  paymentLinkSchema,
  type CrmPaymentLink,
} from "./types";

async function requestData<T>(
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T> {
  const response = await crmRequest<{ data: unknown }>(path, body);
  return schema.parse(response.data);
}

export async function getCapabilities() {
  return requestData("/capabilities", capabilitiesSchema);
}
export async function getNpCities(query: string) {
  return requestData(
    `/carriers/nova_poshta/cities?q=${encodeURIComponent(query)}`,
    z.array(npCitySchema),
  );
}
export async function getNpWarehouses(cityRef: string) {
  return requestData(
    `/carriers/nova_poshta/warehouses?cityRef=${encodeURIComponent(cityRef)}`,
    z.array(npWarehouseSchema),
  );
}
export async function getNpStreets(cityRef: string, query: string) {
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
    items: order.items.map((item) => ({
      productName: `${item.title}${item.option ? ` · ${item.option}` : ""}`,
      ...(item.sku ? { sku: item.sku } : {}),
      quantity: item.quantity,
      unitPrice: (item.unitPrice / 100).toFixed(2),
    })),
    notes: `Оплата: ${order.payment === "card" ? "Monobank" : "накладений платіж"}.${order.freeShipping ? " Доставка коштом магазину." : " Доставка за тарифами перевізника."}`,
  };
}
export async function createCrmOrder(
  order: Order,
): Promise<{ id: string; number: string | null }> {
  return requestData("/orders", orderAcceptedSchema, orderPayload(order));
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
      data.returnUrl === (returnUrl ?? null) &&
      (!data.expiresAt || Date.parse(data.expiresAt) > Date.now())
    ) {
      return validateCheckoutUrl(data);
    }
  } catch (error) {
    if (!(error instanceof CrmApiError) || error.status !== 404) throw error;
  }
  const data = await requestData(path, paymentLinkSchema, {
    provider: "monobank",
    ...(returnUrl ? { returnUrl } : {}),
  });
  return validateCheckoutUrl(data);
}
