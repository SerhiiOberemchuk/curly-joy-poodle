import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { buttonStyles } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { paymentLabel } from "@/features/checkout/options";
import { readReceiptCookie } from "@/features/checkout/receipt-cookie";
import { formatMoney } from "@/lib/money";
import { site } from "@/lib/site";

import styles from "./success.module.css";

export const metadata: Metadata = {
  title: "Замовлення прийнято",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <Section>
      <Suspense fallback={<Confirmation />}>
        <Receipt />
      </Suspense>
    </Section>
  );
}

async function Receipt() {
  const receipt = await readReceiptCookie();
  if (!receipt) return <Confirmation />;

  return (
    <div className={styles.card}>
      <span className={styles.glyph} aria-hidden="true">
        🐾
      </span>
      <h1>Замовлення прийнято</h1>
      <p className={styles.number}>№ {receipt.number}</p>
      <p className={styles.text}>{receipt.note}</p>

      <dl className={styles.details}>
        <div className={styles.detailRow}>
          <dt className={styles.detailLabel}>Сума</dt>
          <dd className={styles.detailValue}>{formatMoney(receipt.total)}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt className={styles.detailLabel}>Оплата</dt>
          <dd className={styles.detailValue}>{paymentLabel(receipt.payment)}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt className={styles.detailLabel}>Доставка</dt>
          <dd className={styles.detailValue}>
            {receipt.city}, {receipt.destination}
          </dd>
        </div>
        <div className={styles.detailRow}>
          <dt className={styles.detailLabel}>Підтвердження</dt>
          <dd className={styles.detailValue}>{receipt.email}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <Link href="/catalog" className={buttonStyles()}>
          Продовжити покупки
        </Link>
        <a href={site.phoneHref} className={buttonStyles({ variant: "outline" })}>
          {site.phone}
        </a>
      </div>
    </div>
  );
}

/** Shown in the static shell, and when the receipt cookie has already expired. */
function Confirmation() {
  return (
    <div className={styles.card}>
      <span className={styles.glyph} aria-hidden="true">
        🐾
      </span>
      <h1>Дякуємо за замовлення</h1>
      <p className={styles.text}>
        Менеджер зв’яжеться з вами найближчим часом, щоб підтвердити розмір і спосіб доставки. Якщо
        маєте питання — телефонуйте {site.phone} у робочі години.
      </p>
      <div className={styles.actions}>
        <Link href="/catalog" className={buttonStyles()}>
          Продовжити покупки
        </Link>
      </div>
    </div>
  );
}
