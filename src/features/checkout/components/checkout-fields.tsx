"use client";

import { useId, type FocusEventHandler } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

import styles from "./checkout-form.module.css";

const stepTitles = { 1: "Контактні дані", 2: "Доставка", 3: "Оплата" } as const;

export function CheckoutStepLegend({ step }: { step: keyof typeof stepTitles }) {
  return <legend className={styles.legend}><span className={styles.step}>{step}</span> {stepTitles[step]}</legend>;
}

/** Shared markup for a ready field and its disabled, data-independent shell. */
export function Field({ label, registration, error, onBlur, ...inputProps }: {
  label: string;
  registration?: UseFormRegisterReturn;
  error?: FieldError;
  disabled?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: "tel" | "email" | "numeric";
  maxLength?: number;
  required?: boolean;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
}) {
  const id = useId();
  const message = error?.message;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <input
        {...inputProps}
        {...registration}
        onBlur={(event) => {
          onBlur?.(event);
          return registration?.onBlur(event);
        }}
        id={id}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${id}-error` : undefined}
        className={message ? styles.inputInvalid : styles.input}
      />
      {message ? <span id={`${id}-error`} className={styles.error}>{message}</span> : null}
    </div>
  );
}
