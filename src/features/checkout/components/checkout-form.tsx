"use client";

import Link from "next/link";
import { startTransition, useActionState, useId } from "react";
import {
  useForm,
  type FieldError,
  type SubmitHandler,
  type UseFormRegisterReturn,
} from "react-hook-form";

import { Button } from "@/components/ui/button";

import { initialCheckoutState } from "../action-state";
import { placeOrderAction } from "../actions";
import { deliveryOptions, paymentOptions } from "../options";
import type { DeliveryMethod, PaymentMethod } from "../types";
import { normalizePhone, type FieldErrors } from "../validation";
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
  payment: "cod",
};

export function CheckoutForm() {
  const [state, formAction, isPending] = useActionState(placeOrderAction, initialCheckoutState);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors: clientErrors },
  } = useForm<CheckoutFormValues>({
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const delivery = watch("delivery");
  const activeDelivery = deliveryOptions.find((option) => option.value === delivery)!;

  const submit: SubmitHandler<CheckoutFormValues> = (_values, event) => {
    const form = event?.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;

    startTransition(() => formAction(new FormData(form)));
  };

  const clientHasErrors = Object.keys(clientErrors).length > 0;

  return (
    <form
      action={formAction}
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(submit)(event);
      }}
    >
      <fieldset className={styles.fieldset}>
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
            clientError={clientErrors.firstName}
            serverError={state.errors.firstName}
            autoComplete="given-name"
          />
          <Field
            label="Прізвище"
            registration={register("lastName", {
              required: "Вкажіть прізвище",
              minLength: { value: 2, message: "Вкажіть прізвище" },
            })}
            clientError={clientErrors.lastName}
            serverError={state.errors.lastName}
            autoComplete="family-name"
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
            clientError={clientErrors.phone}
            serverError={state.errors.phone}
            type="tel"
            placeholder="+380 67 440 43 94"
            autoComplete="tel"
          />
          <Field
            label="Email"
            registration={register("email", {
              required: "Вкажіть email",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                message: "Вкажіть коректний email",
              },
            })}
            clientError={clientErrors.email}
            serverError={state.errors.email}
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
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
            clientError={clientErrors.city}
            serverError={state.errors.city}
            placeholder="Київ"
            autoComplete="address-level2"
          />
          <Field
            label={activeDelivery.destinationLabel}
            registration={register("destination", {
              required: "Вкажіть відділення або адресу",
            })}
            clientError={clientErrors.destination}
            serverError={state.errors.destination}
            placeholder={activeDelivery.destinationPlaceholder}
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
            {...register("comment")}
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
      </fieldset>

      {state.status === "error" || clientHasErrors ? (
        <p className={styles.formError} role="alert">
          {state.status === "error" ? state.message : "Перевірте виділені поля."}
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
  label,
  registration,
  clientError,
  serverError,
  ...inputProps
}: {
  label: string;
  registration: UseFormRegisterReturn;
  clientError?: FieldError;
  serverError?: FieldErrors[keyof FieldErrors];
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = useId();
  const error = clientError?.message ?? serverError;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        {...registration}
        id={id}
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
