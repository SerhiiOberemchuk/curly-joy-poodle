"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import styles from "@/components/ui/form-fields.module.css";

import { initialB2bRequestState } from "../action-state";
import { requestB2bAccessAction } from "../actions";
import { BUSINESS_TYPES, type B2bRequestField } from "../validation";

export function B2bRequestForm() {
  const [state, formAction, isPending] = useActionState(
    requestB2bAccessAction,
    initialB2bRequestState,
  );
  // One id per form: a repeated submit returns the lead the CRM already has.
  const [requestId] = useState(() => crypto.randomUUID());
  const messageId = useId();

  if (state.status === "sent") {
    return (
      <div className={styles.form} role="status">
        <p className={styles.success}>{state.message}</p>
        <Link href="/catalog">Повернутися до каталогу</Link>
      </div>
    );
  }

  const field = (name: B2bRequestField) => ({
    name,
    defaultValue: state.values?.[name] ?? "",
    error: state.errors[name],
    disabled: isPending,
  });

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="requestId" value={requestId} />
      <div className={styles.row}>
        <Field
          {...field("companyName")}
          label="Назва компанії або ФОП"
          autoComplete="organization"
          maxLength={200}
        />
        <Field
          {...field("contactName")}
          label="Контактна особа"
          autoComplete="name"
          maxLength={120}
        />
      </div>
      <div className={styles.row}>
        <Field
          {...field("phone")}
          label="Телефон"
          type="tel"
          inputMode="tel"
          placeholder="+380 67 440 43 94"
          autoComplete="tel"
        />
        <Field
          {...field("email")}
          label="Email"
          type="email"
          inputMode="email"
          placeholder="name@example.com"
          autoComplete="email"
          maxLength={120}
        />
      </div>
      <div className={styles.row}>
        <SelectField
          {...field("businessType")}
          label="Тип бізнесу — необов’язково"
        />
        <Field
          {...field("city")}
          label="Місто — необов’язково"
          autoComplete="address-level2"
          maxLength={120}
        />
      </div>
      <Field
        {...field("website")}
        label="Сайт або сторінка в соцмережах — необов’язково"
        type="text"
        inputMode="url"
        placeholder="instagram.com/your-shop"
        maxLength={200}
      />
      <div className={styles.field}>
        <label className={styles.label} htmlFor={messageId}>
          Коментар — необов’язково
        </label>
        <textarea
          id={messageId}
          name="message"
          rows={4}
          maxLength={1000}
          placeholder="Які товари цікавлять, орієнтовні обсяги"
          defaultValue={state.values?.message ?? ""}
          disabled={isPending}
          aria-invalid={state.errors.message ? true : undefined}
          aria-describedby={
            state.errors.message ? `${messageId}-error` : undefined
          }
          className={state.errors.message ? styles.inputInvalid : styles.input}
        />
        {state.errors.message ? (
          <span id={`${messageId}-error`} className={styles.error}>
            {state.errors.message}
          </span>
        ) : null}
      </div>
      {state.status === "error" ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" size="lg" block disabled={isPending}>
        {isPending ? "Надсилаємо запит…" : "Надіслати запит"}
      </Button>
      <p className={styles.hint}>
        Натискаючи кнопку, ви погоджуєтесь на обробку персональних даних для
        відповіді на запит.
      </p>
    </form>
  );
}

type FieldProps = {
  name: B2bRequestField;
  label: string;
  defaultValue: string;
  error?: string;
  disabled: boolean;
};

function Field({
  name,
  label,
  error,
  ...inputProps
}: FieldProps & {
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "tel" | "email" | "url";
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        name={name}
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

function SelectField({ name, label, error, ...selectProps }: FieldProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <select
        {...selectProps}
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={error ? styles.inputInvalid : styles.input}
      >
        <option value="">Не вказано</option>
        {BUSINESS_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      {error ? (
        <span id={`${id}-error`} className={styles.error}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
