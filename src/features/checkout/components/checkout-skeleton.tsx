"use client";

import { useSyncExternalStore } from "react";

import pageStyles from "@/app/checkout/checkout.module.css";
import { Bone } from "@/components/ui/skeleton";
import { browserCartLineCount, subscribeBrowserCart } from "@/features/cart/cart-cookie.client";
import cartStyles from "@/features/cart/components/cart-view.module.css";

import { deliveryOptions, paymentOptions } from "../options";
import styles from "./checkout-form.module.css";
import skeleton from "./checkout-skeleton.module.css";

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
    <div className={styles.options}>
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

/** A numbered section's legend: the 28 px step badge and its name. */
function StepLegend() {
  return (
    <legend className={styles.legend}>
      <Bone className={skeleton.step} />
      <Bone line className={skeleton.legendText} />
    </legend>
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
      <div className={pageStyles.formPanel} aria-hidden="true">
        <Bone className={skeleton.back} />
        <div className={styles.form}>
          <fieldset className={styles.fieldset} disabled>
            <StepLegend />
            <div className={`${styles.row} ${styles.rowTwo}`}>
              <FieldBone />
              <FieldBone />
            </div>
            <div className={`${styles.row} ${styles.rowTwo}`}>
              <FieldBone />
              <FieldBone />
            </div>
          </fieldset>
          <fieldset className={styles.fieldset} disabled>
            <StepLegend />
            <OptionsBone options={deliveryOptions} />
            <FieldBone hint />
            <div className={styles.field}>
              <Bone line className={`${styles.label} ${skeleton.label}`} />
              <Bone className={skeleton.textarea} />
            </div>
          </fieldset>
          <fieldset className={styles.fieldset} disabled>
            <StepLegend />
            <OptionsBone options={paymentOptions} />
          </fieldset>
          <fieldset className={styles.fieldset} disabled>
            <legend className={styles.legend}>
              <Bone line className={skeleton.legendText} />
            </legend>
            <Bone line className={`${styles.label} ${skeleton.label}`} />
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
      </div>
      <div className={cartStyles.summary} aria-hidden="true">
        <div className={cartStyles.summaryTitle}>
          <Bone line className={skeleton.summaryTitle} />
        </div>
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
      </div>
    </div>
  );
}
