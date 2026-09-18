import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { Order, PaymentStatus } from "./types";

/**
 * Order log. It exists to keep the rest of the checkout honest about its
 * boundaries: when the SalesDrive CRM is connected, only this module changes
 * — `saveOrder` posts the order and `findOrder` reads it back.
 *
 * Until then orders are mirrored to a JSON file per order, because a LiqPay
 * callback arrives in a request of its own and must still find the order after
 * a dev-server reload. The in-memory map stays in front of it as a cache; if
 * the filesystem is unavailable the store degrades to memory only, which is
 * enough for a single process but not for production (see docs/liqpay.md).
 */
const orders = new Map<string, Order>();

/** Also the filename shape, so a hostile `order_id` can never escape the directory. */
const ORDER_NUMBER_PATTERN = /^CJ-\d{6}-\d{4}$/;

const storeDir =
  process.env.ORDER_STORE_DIR ?? join(process.cwd(), ".tmp", "orders");

let fileStoreAvailable = true;

function warnOnce(error: unknown): void {
  if (!fileStoreAvailable) return;
  fileStoreAvailable = false;
  console.warn(
    "[checkout] order file store unavailable, falling back to memory only:",
    error instanceof Error ? error.message : error,
  );
}

function orderPath(number: string): string {
  return join(storeDir, `${number}.json`);
}

async function persist(order: Order): Promise<void> {
  if (!fileStoreAvailable) return;

  try {
    await mkdir(storeDir, { recursive: true });
    // Write beside the target and rename, so a reader never sees half a file.
    const temporary = `${orderPath(order.number)}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(order), "utf8");
    await rename(temporary, orderPath(order.number));
  } catch (error) {
    warnOnce(error);
  }
}

async function restore(number: string): Promise<Order | null> {
  if (!fileStoreAvailable) return null;

  try {
    const raw = await readFile(orderPath(number), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const order = parsed as Order;
    orders.set(order.number, order);
    return order;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") warnOnce(error);
    return null;
  }
}

export async function saveOrder(order: Order): Promise<void> {
  orders.set(order.number, order);
  await persist(order);
}

/**
 * The file is read first, not the map. A page render, a Server Action and a
 * route handler each get their own module instance of this store, so a map
 * populated when the order was placed is already stale by the time the
 * acquirer's callback has moved the payment on. The map is only the fallback
 * for when there is no filesystem to share.
 */
export async function findOrder(number: string): Promise<Order | null> {
  if (!ORDER_NUMBER_PATTERN.test(number)) return null;
  return (await restore(number)) ?? orders.get(number) ?? null;
}

export interface PaymentUpdate {
  status: PaymentStatus;
  /** Acquirer transaction reference, when the provider sends one. */
  reference?: string | null;
  /** Why the payment failed, in the acquirer's words. */
  failureReason?: string | null;
}

/**
 * Serialises read-modify-write per order: the callback and the customer's own
 * return can land together. It only covers this process — one more reason the
 * file store is a stopgap and not a production order log.
 */
const pending = new Map<string, Promise<unknown>>();

function withOrderLock<T>(number: string, task: () => Promise<T>): Promise<T> {
  const next = (pending.get(number) ?? Promise.resolve()).then(task, task);
  pending.set(
    number,
    next.catch(() => undefined).finally(() => {
      if (pending.get(number) === next) pending.delete(number);
    }),
  );
  return next;
}

/**
 * Applies an acquirer status. LiqPay may send the same callback more than once
 * and in any order, so `paid` is terminal: a late `pending` or a duplicate
 * `failure` can never un-pay an order that the bank already settled.
 */
export async function updateOrderPaymentStatus(
  number: string,
  update: PaymentUpdate,
): Promise<Order | null> {
  return withOrderLock(number, async () => {
    const order = await findOrder(number);
    if (!order) return null;
    if (order.paymentStatus === "paid") return order;

    const updated: Order = {
      ...order,
      paymentStatus: update.status,
      paymentDetails: {
        status: update.status,
        reference: update.reference ?? order.paymentDetails.reference ?? null,
        failureReason: update.failureReason ?? null,
        updatedAt: new Date().toISOString(),
      },
    };

    await saveOrder(updated);
    return updated;
  });
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

/** Four digits collide about once in ten thousand — cheap to just try again. */
export async function reserveOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const number = generateOrderNumber();
    if (!(await findOrder(number))) return number;
  }
  throw new Error("Could not allocate a free order number.");
}
