import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Button, buttonStyles } from "@/components/ui/button";
import { checkPaymentStatusAction, retryPaymentAction } from "@/features/checkout/actions";
import { paymentLabel } from "@/features/checkout/options";
import { findOrder } from "@/features/checkout/order-repository";
import { readReceiptCookie } from "@/features/checkout/receipt-cookie";
import type { OrderReceipt, PaymentStatus } from "@/features/checkout/types";
import { formatMoney } from "@/lib/money";

import styles from "./success.module.css";

export const metadata: Metadata = {
  title: "Статус замовлення",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className={styles.page}>
      <Suspense fallback={<div className={styles.loading}>Готуємо підтвердження…</div>}>
        <Receipt />
      </Suspense>
    </div>
  );
}

async function Receipt() {
  const receipt = await readReceiptCookie();
  if (!receipt) notFound();

  // The order log is the source of truth for the money; the cookie only carries
  // what to show. If the order has aged out, fall back to what was ordered.
  const order = await findOrder(receipt.number);
  const status: PaymentStatus =
    order?.paymentStatus ?? (receipt.payment === "cod" ? "not-required" : "pending");
  const awaitingCard = receipt.payment === "card" && status === "pending";
  const cardFailed = receipt.payment === "card" && status === "failed";

  return (
    <section className={styles.card}>
      <span className={styles.glyph} aria-hidden="true">
        {cardFailed ? "!" : awaitingCard ? "…" : "✓"}
      </span>
      <p className={styles.eyebrow}>
        {cardFailed ? "Оплата не пройшла" : awaitingCard ? "Майже готово" : "Дякуємо за довіру"}
      </p>
      <h1>
        {cardFailed
          ? "Оплату не завершено"
          : awaitingCard
            ? "Очікуємо підтвердження"
            : "Замовлення прийнято"}
      </h1>
      <p className={styles.number}>№ {receipt.number}</p>
      <p className={styles.text}>{receipt.note}</p>

      {order?.paymentDetails.failureReason ? (
        <p className={styles.reason}>Відповідь банку: {order.paymentDetails.failureReason}</p>
      ) : null}

      <Details receipt={receipt} status={status} />

      {cardFailed ? (
        <FailedActions />
      ) : awaitingCard ? (
        <PendingActions />
      ) : (
        <div className={styles.actions}>
          <Link href="/catalog" className={buttonStyles({ size: "lg" })}>
            До каталогу
          </Link>
          <Link href="/" className={buttonStyles({ variant: "outline", size: "lg" })}>
            На головну
          </Link>
        </div>
      )}
    </section>
  );
}

/** Ordinary forms, so both work with JavaScript switched off. */
function PendingActions() {
  return (
    <div className={styles.actions}>
      <form action={checkPaymentStatusAction}>
        <Button type="submit" size="lg">
          Оновити статус
        </Button>
      </form>
      <Link href="/catalog" className={buttonStyles({ variant: "outline", size: "lg" })}>
        До каталогу
      </Link>
    </div>
  );
}

function FailedActions() {
  return (
    <div className={styles.actions}>
      <form action={retryPaymentAction}>
        <Button type="submit" size="lg">
          Спробувати оплатити ще раз
        </Button>
      </form>
      <Link href="/checkout" className={buttonStyles({ variant: "outline", size: "lg" })}>
        Змінити замовлення
      </Link>
    </div>
  );
}

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: "Оплачено",
  pending: "Очікує оплати",
  "not-required": "При отриманні",
  failed: "Не пройшла",
};

function Details({ receipt, status }: { receipt: OrderReceipt; status: PaymentStatus }) {
  return (
    <div className={styles.details}>
      <Detail label="Сума" value={formatMoney(receipt.total)} />
      <Detail label="Оплата" value={paymentLabel(receipt.payment)} />
      <Detail label="Статус оплати" value={PAYMENT_STATUS_LABEL[status]} />
      <Detail label="Доставка" value={`${receipt.city}, ${receipt.destination}`} />
      <Detail label="Контакт" value={receipt.phone || receipt.email} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </p>
  );
}
