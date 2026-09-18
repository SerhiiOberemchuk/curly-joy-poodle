import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { buttonStyles } from "@/components/ui/button";
import { paymentLabel } from "@/features/checkout/options";
import { readReceiptCookie } from "@/features/checkout/receipt-cookie";
import { formatMoney } from "@/lib/money";

import styles from "./success.module.css";

export const metadata: Metadata = {
  title: "Замовлення прийнято",
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

  return (
    <section className={styles.card}>
      <span className={styles.glyph} aria-hidden="true">✓</span>
      <p className={styles.eyebrow}>Дякуємо за довіру</p>
      <h1>Замовлення прийнято</h1>
      <p className={styles.number}>№ {receipt.number}</p>
      <p className={styles.text}>{receipt.note}</p>

      <div className={styles.details}>
        <Detail label="Сума" value={formatMoney(receipt.total)} />
        <Detail label="Оплата" value={paymentLabel(receipt.payment)} />
        <Detail label="Доставка" value={`${receipt.city}, ${receipt.destination}`} />
        <Detail label="Контакт" value={receipt.phone || receipt.email} />
      </div>

      <div className={styles.actions}>
        <Link href="/catalog" className={buttonStyles({ size: "lg" })}>До каталогу</Link>
        <Link href="/" className={buttonStyles({ variant: "outline", size: "lg" })}>На головну</Link>
      </div>
    </section>
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
