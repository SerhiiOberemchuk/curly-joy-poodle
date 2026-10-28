import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import {
  checkPaymentStatusAction,
  retryPaymentAction,
} from "@/features/checkout/actions";
import { ForgetCheckoutToken } from "@/features/checkout/components/forget-checkout-token";
import { PaymentStatusPoller } from "@/features/checkout/components/payment-status-poller";
import type { CrmOrder } from "@/features/checkout/crm/types";
import { paymentLabel } from "@/features/checkout/options";
import { currentReceipt } from "@/features/checkout/payment/settlement";
import { readPaymentReceipt } from "@/features/checkout/payment/return-receipt";
import {
  createPaymentReturnToken,
  readPaymentReturnToken,
} from "@/features/checkout/payment/return-token";
import {
  awaitsCardPayment,
  PAYMENT_SETUP_FAILED,
} from "@/features/checkout/payment/status";
import type { PaymentStatus } from "@/features/checkout/types";
import { formatMoney } from "@/lib/money";
import styles from "./success.module.css";

export const metadata: Metadata = {
  title: "Статус замовлення",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};
export default function Page({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <div className={styles.page}>
      <Suspense
        fallback={<div className={styles.loading}>Готуємо підтвердження…</div>}
      >
        <Receipt searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
async function Receipt({
  searchParams,
}: Pick<PageProps<"/checkout/success">, "searchParams">) {
  await connection();
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : undefined;
  // Set by checkout when the bank could not be opened on this attempt.
  const paymentUnavailable = query.payment === "unavailable";
  let receipt;
  try {
    receipt = await readPaymentReceipt(token);
  } catch {
    return await Recovery({ token, unavailable: true });
  }
  if (!receipt) return await Recovery({ token });
  if (!token) {
    const query = new URLSearchParams({
      token: await createPaymentReturnToken(
        receipt.number,
        receipt.payment,
        receipt.cartRevision,
      ),
    });
    if (paymentUnavailable) query.set("payment", "unavailable");
    redirect(`/checkout/success?${query}`);
  }
  // Manual checks refresh even if the payment status has not changed.
  const checkStatus = checkPaymentStatusAction.bind(null, token, undefined);
  const retryPayment = retryPaymentAction.bind(null, token);
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
  const paid = !unavailable && status === "paid";
  const takenInWork =
    paid && (order?.status === "confirmed" || order?.status === "processing");
  const canPay =
    !unavailable &&
    order?.status !== "cancelled" &&
    receipt.payment === "card" &&
    awaitsCardPayment(status);
  // Only a payment the buyer actually started is worth waiting for.
  const setupFailed = canPay && paymentUnavailable;
  const waiting =
    receipt.payment === "card" && status === "pending" && !setupFailed;
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
            : canPay
              ? "Замовлення очікує оплати"
              : "Замовлення прийнято";
  return (
    <section className={styles.card}>
      <ForgetCheckoutToken />
      {/* Kept in place across status refreshes, so a change of state is read out. */}
      <p className="visually-hidden" role="status">
        {title}
      </p>
      {!unavailable && !waiting ? (
        <span className={styles.glyph} aria-hidden="true">
          {canPay || status === "cancelled" ? "!" : "✓"}
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
          : setupFailed
            ? PAYMENT_SETUP_FAILED
            : takenInWork
              ? "Замовлення успішно оплачено та взято в роботу."
              : receipt.note}
      </p>
      <PaymentStatusPoller
        key={receipt.number}
        active={waiting || unavailable}
        orderId={receipt.number}
        token={token}
        shown={unavailable ? "unavailable" : status}
      >
        {canPay && waiting ? (
          <form action={retryPayment}>
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
        {receipt.city || receipt.destination ? (
          <Detail
            label="Доставка"
            value={[receipt.city, receipt.destination]
              .filter(Boolean)
              .join(", ")}
          />
        ) : null}
        {receipt.phone || receipt.email ? (
          <Detail label="Контакт" value={receipt.phone || receipt.email} />
        ) : null}
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
          <form action={retryPayment}>
            <Button type="submit" size="lg">
              {status === "failed"
                ? "Спробувати оплатити ще раз"
                : "Перейти до оплати"}
            </Button>
          </form>
        ) : null}
        {paid ? (
          <Button type="button" size="lg" variant="outline" disabled>
            Оплату підтверджено
          </Button>
        ) : (
          <form action={checkStatus}>
            <Button type="submit" size="lg" variant="outline">
              Оновити статус
            </Button>
          </form>
        )}
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
  unpaid: "Не оплачено",
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

async function Recovery({
  token,
  unavailable = false,
}: {
  token?: string;
  unavailable?: boolean;
}) {
  const number = token ? await readPaymentReturnToken(token) : null;
  const checkStatus = token
    ? checkPaymentStatusAction.bind(null, token, undefined)
    : undefined;
  return (
    <section className={styles.card}>
      <h1>
        {unavailable
          ? "Статус тимчасово недоступний"
          : "Не вдалося відкрити замовлення"}
      </h1>
      <p className={styles.text}>
        {unavailable
          ? "Не вдалося отримати підтвердження оплати. Якщо ви вже оплатили, не сплачуйте повторно — ми перевіряємо статус."
          : "Відкрийте посилання повернення з оплати у браузері, де оформляли замовлення. Якщо посилання застаріло, зверніться до нас — допоможемо перевірити оплату."}
      </p>
      {number && unavailable && token ? (
        <>
          <PaymentStatusPoller
            active
            orderId={number}
            token={token}
            shown="unavailable"
          />
          <form action={checkStatus}>
            <Button type="submit" variant="outline">
              Оновити статус
            </Button>
          </form>
        </>
      ) : null}
      <Link
        href="/info/contacts"
        className={buttonStyles({ variant: "outline", size: "lg" })}
      >
        Зв’язатися з нами
      </Link>
      <Link
        href="/catalog"
        className={buttonStyles({ variant: "outline", size: "lg" })}
      >
        До каталогу
      </Link>
    </section>
  );
}
