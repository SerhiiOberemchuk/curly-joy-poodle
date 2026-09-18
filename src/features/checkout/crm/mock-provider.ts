import "server-only";

import type { Order } from "../types";
import type { CrmProvider, CrmSubmission } from "./types";

/**
 * Stands in for SalesDrive while the real integration is not connected.
 *
 * It does no network call and stores nothing. What it does do is build the
 * payload a real submission would send and log it, so the shape can be checked
 * against the CRM account before the live adapter is written — and so the
 * whole checkout can be demonstrated end to end without an account.
 *
 * Field names below follow SalesDrive's order API as documented; confirm them
 * against the target account before using them in anger.
 */
function buildPayload(order: Order) {
  return {
    form: process.env.CRM_FORM_ID ?? "<form-id>",
    externalId: order.number,
    contacts: [
      {
        firstName: order.customer.firstName,
        lastName: order.customer.lastName,
        phone: [order.customer.phone],
        email: [order.customer.email],
      },
    ],
    shipping: {
      method: order.delivery.method,
      city: order.delivery.city,
      destination: order.delivery.destination,
    },
    comment: order.delivery.comment,
    paymentMethod: order.payment,
    paymentStatus: order.paymentStatus,
    products: order.items.map((item) => ({
      sku: item.sku,
      name: item.title,
      parameter: item.size,
      amount: item.quantity,
      // SalesDrive works in hryvnia, the shop in kopiyky.
      price: item.unitPrice / 100,
    })),
    total: order.subtotal / 100,
  };
}

export const mockCrmProvider: CrmProvider = {
  id: "mock",

  async createOrder(order: Order): Promise<CrmSubmission> {
    const payload = buildPayload(order);
    console.info(
      `[crm:mock] order ${order.number} would be sent to SalesDrive:\n` +
        JSON.stringify(payload, null, 2),
    );

    return {
      // Mirrors SalesDrive's own numbering closely enough to be recognisable.
      reference: `SD-${order.number.replace(/^CJ-/, "")}`,
      acceptedAt: new Date().toISOString(),
    };
  },
};
