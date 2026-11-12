"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import pageStyles from "@/app/checkout/checkout.module.css";
import { Bone } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { browserCartLineCount, subscribeBrowserCart } from "@/features/cart/cart-cookie.client";
import cartStyles from "@/features/cart/components/cart-view.module.css";

import { deliveryOptions, paymentOptions } from "../options";
import styles from "./checkout-form.module.css";
import skeleton from "./checkout-skeleton.module.css";
import { CheckoutStepLegend, Field } from "./checkout-fields";

function FieldBone({ hint = false }: { hint?: boolean }) {
  return (
    <div className={styles.field}>
      <Bone line className={`${styles.label} ${skeleton.label}`} />
      <Bone className={skeleton.input} />
      {hint ? <Bone className={skeleton.fieldHint} /> : null}
    </div>
  );
}

/** The ways the CRM usually offers; their own words, invisible, wrap as they will. */
function OptionsBone({ options }: { options: ReadonlyArray<{ label: string; hint: string }> }) {
  return (
    <div className={styles.options} aria-hidden="true">
      {options.map((option) => (
        <div className={styles.option} key={option.label}>
          <Bone className={skeleton.radio} />
          <div className={styles.optionBody}>
            <Bone className={`${styles.optionLabel} ${skeleton.text}`}>{option.label}</Bone>
            <Bone className={`${styles.optionHint} ${skeleton.text}`}>{option.hint}</Bone>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The order form's sections and the summary beside it while the cart is
 * checked against the CRM: contacts, delivery, payment, promo code. The
 * browser's cart cookie tells how many lines the summary lists.
 */
export function CheckoutSkeleton() {
  const lines = useSyncExternalStore(
    subscribeBrowserCart,
    () => browserCartLineCount() || 1,
    () => 1,
  );
  return (
    <div className={pageStyles.layout}>
      <p className="visually-hidden" role="status">
        Готуємо замовлення…
      </p>
      <section className={pageStyles.formPanel} aria-label="Дані замовлення" aria-busy="true">
        <Link href="/cart" className={styles.back}><Icon name="chevronLeft" />Повернутися до кошика</Link>
        <div className={styles.form}>
          <fieldset className={styles.fieldset} disabled>
            <CheckoutStepLegend step={1} />
            <div className={`${styles.row} ${styles.rowTwo}`}>
              <Field label="Ім’я" autoComplete="given-name" disabled />
              <Field label="Прізвище" autoComplete="family-name" disabled />
            </div>
            <div className={`${styles.row} ${styles.rowTwo}`}>
              <Field label="Телефон" type="tel" autoComplete="tel" disabled />
              <Field label="Email" type="email" autoComplete="email" disabled />
            </div>
          </fieldset>
          <fieldset className={styles.fieldset} disabled>
            <CheckoutStepLegend step={2} />
            <OptionsBone options={deliveryOptions} />
            <FieldBone hint />
            <div className={styles.field}>
              <span className={styles.label}>Коментар <span className={styles.optional}>— необов’язково</span></span>
              <Bone className={skeleton.textarea} />
            </div>
          </fieldset>
          <fieldset className={styles.fieldset} disabled>
            <CheckoutStepLegend step={3} />
            <OptionsBone options={paymentOptions} />
          </fieldset>
          <fieldset className={styles.fieldset} disabled>
            <legend className={styles.legend}>Є промокод?</legend>
            <span className={styles.label}>Промокод</span>
            <div className={styles.promoRow}>
              <Bone className={`${skeleton.input} ${skeleton.promoInput}`} />
              <Bone className={skeleton.promoButton} />
            </div>
            <Bone className={`${styles.hint} ${skeleton.promoHint}`} />
          </fieldset>
          <Bone className={skeleton.submit} />
          <div className={`${styles.consent} ${skeleton.consent}`}>
            <Bone line />
            <Bone line className={skeleton.consentEnd} />
          </div>
        </div>
      </section>
      <aside className={cartStyles.summary} aria-label="Підсумок замовлення" aria-busy="true">
        <h2 className={cartStyles.summaryTitle}>Разом</h2>
        <div className={pageStyles.items}>
          {Array.from({ length: lines }, (_, index) => (
            <Bone line className={pageStyles.item} key={index} />
          ))}
        </div>
        <Bone line className={cartStyles.summaryRow} />
        <Bone line className={cartStyles.summaryRow} />
        <div className={cartStyles.summaryTotal}>
          <Bone line className={skeleton.total} />
        </div>
      </aside>
    </div>
  );
}
