import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LiqPayMockForm } from "@/features/checkout/components/liqpay-mock-form";
import { LiqPayRedirectForm } from "@/features/checkout/components/liqpay-redirect-form";
import { findOrder } from "@/features/checkout/order-repository";
import { readLiqPayCheckoutCookie } from "@/features/checkout/payment/checkout-cookie";
import { formatMoney } from "@/lib/money";

import styles from "./pay.module.css";

export const metadata: Metadata = {
  title: "Перехід до оплати",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className={styles.page}>
      <Suspense fallback={<p className={styles.status}>Готуємо захищену оплату…</p>}>
        <PaymentRedirect />
      </Suspense>
    </main>
  );
}

async function PaymentRedirect() {
  const checkout = await readLiqPayCheckoutCookie();
  // No handover in progress: either it expired or the page was opened directly.
  if (!checkout) redirect("/checkout");

  // A handover left over from a payment the acquirer has already answered must
  // not be posted a second time.
  const order = await findOrder(checkout.orderId);
  if (order && order.paymentStatus !== "pending") redirect("/checkout/success");

  return (
    <section className={styles.card}>
      <p className={styles.eyebrow}>Замовлення {checkout.orderId}</p>
      <h1>{checkout.mock ? "Тестова оплата" : "Переходимо до LiqPay"}</h1>
      <p className={styles.amount}>До сплати {formatMoney(checkout.amount)}</p>

      {checkout.mock ? (
        <LiqPayMockForm />
      ) : (
        <>
          <p className={styles.status}>
            Зараз відкриється захищена сторінка оплати. Якщо перехід не почався,
            натисніть кнопку нижче.
          </p>
          <LiqPayRedirectForm data={checkout.data} signature={checkout.signature} />
        </>
      )}

      <p className={styles.footnote}>
        Дані картки вводяться на стороні LiqPay — магазин їх не бачить і не зберігає.{" "}
        <Link href="/checkout">Повернутися до замовлення</Link>
      </p>
    </section>
  );
}
