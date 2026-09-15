import "server-only";

import type { Order } from "./types";

/**
 * In-memory order log. It exists to keep the rest of the checkout honest about
 * its boundaries: when the SalesDrive CRM is connected, only this module changes
 * — `saveOrder` posts the order and `findOrder` reads it back.
 *
 * Nothing user-facing depends on this surviving a restart: the confirmation
 * screen reads the receipt cookie written by the order action.
 */
const orders = new Map<string, Order>();

export async function saveOrder(order: Order): Promise<void> {
  orders.set(order.number, order);
}

export async function findOrder(number: string): Promise<Order | null> {
  return orders.get(number) ?? null;
}

/**
 * `CJ-YYMMDD-XXXX`. Readable over the phone, sortable by date, and unique
 * enough for the volume a single-operator store handles.
 */
export function generateOrderNumber(now: Date = new Date()): string {
  const date = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const suffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `CJ-${date}-${suffix}`;
}
