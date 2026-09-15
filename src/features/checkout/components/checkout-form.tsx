"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";

import { Button } from "@/components/ui/button";

import { initialCheckoutState } from "../action-state";
import { placeOrderAction } from "../actions";
import { deliveryOptions, paymentOptions } from "../options";
import type { DeliveryMethod, PaymentMethod } from "../types";
import type { FieldErrors } from "../validation";
import styles from "./checkout-form.module.css";

export function CheckoutForm() {
  const [state, formAction, isPending] = useActionState(placeOrderAction, initialCheckoutState);
  const [delivery, setDelivery] = useState<DeliveryMethod>("np-branch");
  const [payment, setPayment] = useState<PaymentMethod>("cod");

  const activeDelivery = deliveryOptions.find((option) => option.value === delivery)!;

  return (
    <form action={formAction} className={styles.form} noValidate>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          <span className={styles.step}>1</span> Контактні дані
        </legend>

        <div className={`${styles.row} ${styles.rowTwo}`}>
          <Field
            name="firstName"
            label="Ім’я"
            autoComplete="given-name"
            errors={state.errors}
            required
          />
          <Field
            name="lastName"
            label="Прізвище"
            autoComplete="family-name"
            errors={state.errors}
            required
          />
        </div>

        <div className={`${styles.row} ${styles.rowTwo}`}>
          <Field
            name="phone"
            label="Телефон"
            type="tel"
            placeholder="+380 67 440 43 94"
            autoComplete="tel"
            errors={state.errors}
            required
          />
          <Field
            name="email"
            label="Email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            errors={state.errors}
            required
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          <span className={styles.step}>2</span> Доставка
        </legend>

        <div className={styles.options}>
          {deliveryOptions.map((option) => (
            <label key={option.value} className={styles.option}>
              <input
                type="radio"
                name="delivery"
                value={option.value}
                checked={delivery === option.value}
                onChange={() => setDelivery(option.value)}
              />
              <span className={styles.optionBody}>
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionHint}>{option.hint}</span>
              </span>
            </label>
          ))}
        </div>

        <div className={`${styles.row} ${styles.rowTwo}`}>
          <Field
            name="city"
            label="Населений пункт"
            placeholder="Київ"
            autoComplete="address-level2"
            errors={state.errors}
            required
          />
          <Field
            name="destination"
            label={activeDelivery.destinationLabel}
            placeholder={activeDelivery.destinationPlaceholder}
            errors={state.errors}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="checkout-comment">
            Коментар <span className={styles.optional}>— необов’язково</span>
          </label>
          <textarea
            id="checkout-comment"
            name="comment"
            className={styles.textarea}
            placeholder="Порода й заміри собаки, побажання до відправлення"
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          <span className={styles.step}>3</span> Оплата
        </legend>

        <div className={styles.options}>
          {paymentOptions.map((option) => (
            <label key={option.value} className={styles.option}>
              <input
                type="radio"
                name="payment"
                value={option.value}
                checked={payment === option.value}
                onChange={() => setPayment(option.value)}
              />
              <span className={styles.optionBody}>
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionHint}>{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.status === "error" ? (
        <p className={styles.formError} role="alert">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" block disabled={isPending}>
        {isPending ? "Оформлюємо…" : "Підтвердити замовлення"}
      </Button>

      <p className={styles.consent}>
        Натискаючи кнопку, ви погоджуєтесь з <Link href="/info/terms">публічною офертою</Link> та
        обробкою персональних даних.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  errors,
  required = false,
  ...inputProps
}: {
  name: keyof FieldErrors;
  label: string;
  errors: FieldErrors;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = useId();
  const error = errors[name];

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={error ? styles.inputInvalid : styles.input}
      />
      {error ? (
        <span id={`${id}-error`} className={styles.error}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
