"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useId, useRef } from "react";
import {
  useForm,
  type FieldError,
  type SubmitHandler,
  type UseFormRegisterReturn,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

import { initialCheckoutState } from "../action-state";
import { placeOrderAction } from "../actions";
import { deliveryOption, deliveryOptions, paymentOptions } from "../options";
import type { DeliveryMethod, PaymentMethod } from "../types";
import {
  destinationError,
  normalizePhone,
  EMAIL_PATTERN,
  FIELD_LIMITS,
  type CheckoutField,
} from "../validation";
import styles from "./checkout-form.module.css";

interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  destination: string;
  comment: string;
  delivery: DeliveryMethod;
  payment: PaymentMethod;
}

const defaultValues: CheckoutFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  city: "",
  destination: "",
  comment: "",
  delivery: "np-branch",
  payment: "card",
};

export function CheckoutForm({ total }: { total: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(placeOrderAction, initialCheckoutState);
  const {
    register,
    handleSubmit,
    setError,
    trigger,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<CheckoutFormValues>({
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const delivery = watch("delivery");
  const payment = watch("payment");
  const activeDelivery = deliveryOption(delivery);

  // Server-side errors are handed to react-hook-form so they behave like any
  // other field error: they focus the first offender and clear as it is fixed.
  useEffect(() => {
    const entries = Object.entries(state.errors) as [CheckoutField, string][];
    entries.forEach(([field, message], index) => {
      setError(field, { type: "server", message }, { shouldFocus: index === 0 });
    });
  }, [state, setError]);

  // The destination rule depends on the carrier option, so switching it has to
  // re-check a value that was already typed in.
  useEffect(() => {
    if (isSubmitted) void trigger("destination");
  }, [delivery, isSubmitted, trigger]);

  const submit: SubmitHandler<CheckoutFormValues> = () => {
    const form = formRef.current;
    if (!form) return;

    startTransition(() => formAction(new FormData(form)));
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form
      ref={formRef}
      action={formAction}
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(submit)(event);
      }}
    >
      <fieldset className={styles.fieldset} disabled={isPending}>
        <legend className={styles.legend}>
          <span className={styles.step}>1</span> Контактні дані
        </legend>

        <div className={`${styles.row} ${styles.rowTwo}`}>
          <Field
            label="Ім’я"
            registration={register("firstName", {
              required: "Вкажіть ім’я",
              minLength: { value: 2, message: "Вкажіть ім’я" },
            })}
            error={errors.firstName}
            autoComplete="given-name"
            maxLength={FIELD_LIMITS.firstName}
          />
          <Field
            label="Прізвище"
            registration={register("lastName", {
              required: "Вкажіть прізвище",
              minLength: { value: 2, message: "Вкажіть прізвище" },
            })}
            error={errors.lastName}
            autoComplete="family-name"
            maxLength={FIELD_LIMITS.lastName}
          />
        </div>

        <div className={`${styles.row} ${styles.rowTwo}`}>
          <Field
            label="Телефон"
            registration={register("phone", {
              required: "Вкажіть номер телефону",
              validate: (value) =>
                Boolean(normalizePhone(value)) || "Вкажіть номер у форматі +380 XX XXX XX XX",
            })}
            error={errors.phone}
            type="tel"
            inputMode="tel"
            placeholder="+380 67 440 43 94"
            autoComplete="tel"
          />
          <Field
            label="Email"
            registration={register("email", {
              required: "Вкажіть email",
              pattern: { value: EMAIL_PATTERN, message: "Вкажіть коректний email" },
            })}
            error={errors.email}
            type="email"
            inputMode="email"
            placeholder="name@example.com"
            autoComplete="email"
            maxLength={FIELD_LIMITS.email}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset} disabled={isPending}>
        <legend className={styles.legend}>
          <span className={styles.step}>2</span> Доставка
        </legend>

        <div className={styles.options}>
          {deliveryOptions.map((option) => (
            <label key={option.value} className={styles.option}>
              <input
                type="radio"
                value={option.value}
                {...register("delivery", { required: "Оберіть спосіб доставки" })}
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
            label="Населений пункт"
            registration={register("city", {
              required: "Вкажіть населений пункт",
              minLength: { value: 2, message: "Вкажіть населений пункт" },
            })}
            error={errors.city}
            placeholder="Київ"
            autoComplete="address-level2"
            maxLength={FIELD_LIMITS.city}
          />
          <Field
            label={activeDelivery.destinationLabel}
            registration={register("destination", {
              required: "Вкажіть відділення або адресу",
              validate: (value) => destinationError(delivery, value) ?? true,
            })}
            error={errors.destination}
            placeholder={activeDelivery.destinationPlaceholder}
            inputMode={activeDelivery.destinationKind === "number" ? "numeric" : undefined}
            autoComplete={activeDelivery.destinationKind === "address" ? "street-address" : "off"}
            maxLength={FIELD_LIMITS.destination}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="checkout-comment">
            Коментар <span className={styles.optional}>— необов’язково</span>
          </label>
          <textarea
            id="checkout-comment"
            className={styles.textarea}
            placeholder="Порода й заміри собаки, побажання до відправлення"
            maxLength={FIELD_LIMITS.comment}
            {...register("comment")}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset} disabled={isPending}>
        <legend className={styles.legend}>
          <span className={styles.step}>3</span> Оплата
        </legend>

        <div className={styles.options}>
          {paymentOptions.map((option) => (
            <label key={option.value} className={styles.option}>
              <input
                type="radio"
                value={option.value}
                {...register("payment", { required: "Оберіть спосіб оплати" })}
              />
              <span className={styles.optionBody}>
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionHint}>{option.hint}</span>
              </span>
            </label>
          ))}
        </div>

        {payment === "card" ? (
          <p className={styles.paymentNotice}>
            Після підтвердження відкриється захищена сторінка LiqPay. Дані картки
            вводяться там — магазин їх не бачить і не зберігає.
          </p>
        ) : null}
      </fieldset>

      {state.status === "error" || hasErrors ? (
        <p className={styles.formError} role="alert">
          {state.status === "error" ? state.message : "Перевірте виділені поля."}
        </p>
      ) : null}

      <Button type="submit" size="lg" block disabled={isPending}>
        {isPending
          ? "Оформлюємо…"
          : `${payment === "card" ? "Перейти до оплати" : "Підтвердити замовлення"} · ${formatMoney(total)}`}
      </Button>

      <p className={styles.consent}>
        Натискаючи кнопку, ви погоджуєтесь з <Link href="/info/terms">публічною офертою</Link> та
        обробкою персональних даних.
      </p>
    </form>
  );
}

function Field({
  label,
  registration,
  error,
  ...inputProps
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "tel" | "email" | "numeric";
  maxLength?: number;
}) {
  const id = useId();
  const message = error?.message;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        {...registration}
        id={id}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${id}-error` : undefined}
        className={message ? styles.inputInvalid : styles.input}
      />
      {message ? (
        <span id={`${id}-error`} className={styles.error}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
