import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import {
  checkPaymentStatusAction,
  retryPaymentAction,
} from "@/features/checkout/actions";
import { PaymentStatusPoller } from "@/features/checkout/components/payment-status-poller";
import type { CrmOrder } from "@/features/checkout/crm/types";
import { paymentLabel } from "@/features/checkout/options";
import { currentReceipt } from "@/features/checkout/payment/settlement";
import { readReceiptCookie } from "@/features/checkout/receipt-cookie";
import type { PaymentStatus } from "@/features/checkout/types";
import { formatMoney } from "@/lib/money";
import styles from "./success.module.css";

export const metadata: Metadata = {
  title: "Статус замовлення",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <div className={styles.page}>
      <Suspense
        fallback={<div className={styles.loading}>Готуємо підтвердження…</div>}
      >
        <Receipt />
      </Suspense>
    </div>
  );
}
async function Receipt() {
  let receipt = await readReceiptCookie();
  if (!receipt) notFound();
  let order: CrmOrder | null = null;
  let unavailable = false;
  try {
    const current = await currentReceipt(receipt);
    receipt = current.receipt;
    order = current.order;
  } catch {
    unavailable = true;
  }
  const status = receipt.status;
  const canPay =
    !unavailable &&
    order?.status !== "cancelled" &&
    receipt.payment === "card" &&
    (status === "pending" || status === "failed");
  const waiting = receipt.payment === "card" && status === "pending";
  const title = unavailable
    ? "Статус тимчасово недоступний"
    : status === "cancelled" || order?.status === "cancelled"
      ? "Замовлення скасовано"
      : status === "refunded"
        ? "Кошти повернено"
        : status === "failed"
          ? "Оплату не завершено"
          : waiting
            ? "Очікуємо підтвердження"
            : "Замовлення прийнято";
  return (
    <section className={styles.card}>
      {!unavailable && !waiting ? (
        <span className={styles.glyph} aria-hidden="true">
          {status === "failed" || status === "cancelled" ? "!" : "✓"}
        </span>
      ) : null}
      <p className={styles.eyebrow}>Ваше замовлення</p>
      <h1>{title}</h1>
      <p className={styles.number}>
        № {receipt.crmReference ?? receipt.number}
      </p>
      <p className={styles.text}>
        {unavailable
          ? "Не вдалося оновити статус. Ваше замовлення збережено — спробуйте ще раз."
          : receipt.note}
      </p>
      <PaymentStatusPoller
        key={receipt.number}
        active={waiting || unavailable}
        orderId={receipt.number}
      >
        {canPay && waiting ? (
          <form action={retryPaymentAction}>
            <Button type="submit" size="lg">
              Перейти до оплати
            </Button>
          </form>
        ) : null}
      </PaymentStatusPoller>
      <dl className={styles.details}>
        <Detail label="Сума товарів" value={formatMoney(receipt.total)} />
        {order ? (
          <Detail
            label="Статус замовлення"
            value={ORDER_STATUS_LABEL[order.status]}
          />
        ) : null}
        <Detail label="Оплата" value={paymentLabel(receipt.payment)} />
        <Detail
          label="Статус оплати"
          value={
            unavailable ? "Не вдалося перевірити" : PAYMENT_STATUS_LABEL[status]
          }
        />
        <Detail
          label="Доставка"
          value={`${receipt.city}, ${receipt.destination}`}
        />
        <Detail label="Контакт" value={receipt.phone || receipt.email} />
        {order?.shipments
          .filter(
            (shipment) =>
              shipment.trackingNumber && shipment.status !== "cancelled",
          )
          .map((shipment) => (
            <Detail
              key={shipment.id}
              label={
                shipment.carrier === "nova_poshta"
                  ? "ТТН Нової пошти"
                  : "Номер відправлення"
              }
              value={shipment.trackingNumber!}
            />
          ))}
      </dl>
      <div className={styles.actions}>
        {canPay && !waiting ? (
          <form action={retryPaymentAction}>
            <Button type="submit" size="lg">
              {status === "failed"
                ? "Спробувати оплатити ще раз"
                : "Перейти до оплати"}
            </Button>
          </form>
        ) : null}
        <form action={checkPaymentStatusAction}>
          <Button type="submit" size="lg" variant="outline">
            Оновити статус
          </Button>
        </form>
        <Link
          href="/catalog"
          className={buttonStyles({ variant: "outline", size: "lg" })}
        >
          До каталогу
        </Link>
      </div>
    </section>
  );
}
const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: "Оплачено",
  pending: "Очікуємо підтвердження банку",
  "not-required": "При отриманні",
  failed: "Не пройшла",
  refunded: "Кошти повернено",
  "partially-refunded": "Частково повернено",
  cancelled: "Скасовано",
};
const ORDER_STATUS_LABEL: Record<CrmOrder["status"], string> = {
  pending: "Прийнято",
  confirmed: "Підтверджено",
  processing: "Готуємо до відправлення",
  shipped: "Відправлено",
  delivered: "Доставлено",
  cancelled: "Скасовано",
  refunded: "Кошти повернено",
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <dt className={styles.detailLabel}>{label}</dt>
      <dd className={styles.detailValue}>{value}</dd>
    </div>
  );
}
