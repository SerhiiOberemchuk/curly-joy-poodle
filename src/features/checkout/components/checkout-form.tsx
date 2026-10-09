"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useId } from "react";
import {
  useForm,
  FormProvider,
  useWatch,
  type FieldError,
  type SubmitHandler,
  type UseFormRegisterReturn,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

import { initialCheckoutState } from "../action-state";
import { placeOrderAction } from "../actions";
import { availableDeliveries, availablePayments } from "../options";
import type { CrmCapabilities } from "../crm/types";
import { DESTINATION_FIELDS, NovaPoshtaFields } from "./nova-poshta-fields";
import {
  checkoutSchema,
  type CheckoutFormValues,
  FIELD_LIMITS,
  type CheckoutField,
} from "../validation";
import styles from "./checkout-form.module.css";

const defaultValues: CheckoutFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  city: "",
  cityRef: "",
  citySearch: "",
  branchRef: "",
  streetRef: "",
  streetSearch: "",
  building: "",
  flat: "",
  destination: "",
  comment: "",
  delivery: "np-branch",
  payment: "card",
};

export function CheckoutForm({
  total,
  capabilities,
}: {
  total: number;
  capabilities: CrmCapabilities;
}) {
  const deliveryOptions = availableDeliveries(capabilities);
  const paymentOptions = availablePayments(capabilities);
  const [state, formAction, isPending] = useActionState(
    placeOrderAction,
    initialCheckoutState,
  );
  const form = useForm<CheckoutFormValues>({
    defaultValues: {
      ...defaultValues,
      delivery: deliveryOptions[0]?.value,
      payment: paymentOptions[0]?.value,
    },
    resolver: zodResolver(checkoutSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    control,
    formState: { errors },
  } = form;

  const delivery = useWatch({ control, name: "delivery" });
  const payment = useWatch({ control, name: "payment" });

  // Server-side errors are handed to react-hook-form so they behave like any
  // other field error: they focus the first offender and clear as it is fixed.
  useEffect(() => {
    const entries = Object.entries(state.errors) as [CheckoutField, string][];
    entries.forEach(([field, message], index) => {
      setError(
        field,
        { type: "server", message },
        { shouldFocus: index === 0 },
      );
    });
  }, [state, setError]);

  const submit: SubmitHandler<CheckoutFormValues> = (values) => {
    const data = new FormData();
    for (const [name, value] of Object.entries(values)) data.set(name, value);
    startTransition(() => formAction(data));
  };

  const hasErrors = Object.keys(errors).length > 0;
  const hasServerError =
    state.status === "error" &&
    (!Object.keys(state.errors).length || hasErrors);

  return (
    <FormProvider {...form}>
      <form
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
              registration={register("firstName")}
              error={errors.firstName}
              autoComplete="given-name"
              maxLength={FIELD_LIMITS.firstName}
            />
            <Field
              label="Прізвище"
              registration={register("lastName")}
              error={errors.lastName}
              autoComplete="family-name"
              maxLength={FIELD_LIMITS.lastName}
            />
          </div>

          <div className={`${styles.row} ${styles.rowTwo}`}>
            <Field
              label="Телефон"
              registration={register("phone")}
              error={errors.phone}
              type="tel"
              inputMode="tel"
              placeholder="+380 67 440 43 94"
              autoComplete="tel"
            />
            <Field
              label="Email"
              registration={register("email")}
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
                  {...register("delivery", {
                    onChange: () => {
                      for (const name of DESTINATION_FIELDS) setValue(name, "");
                      clearErrors([...DESTINATION_FIELDS]);
                    },
                  })}
                />
                <span className={styles.optionBody}>
                  <span className={styles.optionLabel}>{option.label}</span>
                  <span className={styles.optionHint}>{option.hint}</span>
                </span>
              </label>
            ))}
          </div>

          <NovaPoshtaFields method={delivery} disabled={isPending} />
          {delivery === "np-courier" ? (
            <div className={`${styles.row} ${styles.rowTwo}`}>
              <Field
                label="Будинок"
                registration={register("building")}
                error={errors.building}
                maxLength={11}
                autoComplete="address-line2"
              />
              <Field
                label="Квартира — необов’язково"
                registration={register("flat")}
                error={errors.flat}
                maxLength={35}
              />
            </div>
          ) : null}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="checkout-comment">
              Коментар <span className={styles.optional}>— необов’язково</span>
            </label>
            <textarea
              id="checkout-comment"
              className={styles.textarea}
              placeholder="Порода й заміри собаки, побажання до відправлення"
              maxLength={FIELD_LIMITS.comment}
              aria-invalid={!!errors.comment}
              aria-describedby={
                errors.comment ? "checkout-comment-error" : undefined
              }
              {...register("comment")}
            />
            {errors.comment?.message ? (
              <span id="checkout-comment-error" className={styles.error}>
                {errors.comment.message}
              </span>
            ) : null}
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
                  {...register("payment")}
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
              Після підтвердження відкриється захищена сторінка Monobank. Дані
              картки вводяться там — магазин їх не бачить і не зберігає.
            </p>
          ) : null}
        </fieldset>

        {!isPending && (hasServerError || hasErrors) ? (
          <p className={styles.formError} role="alert">
            {hasServerError ? state.message : "Перевірте виділені поля."}
          </p>
        ) : null}

        <noscript>
          <p className={styles.formError}>
            Для вибору адреси Нової пошти увімкніть JavaScript або зверніться до
            нас для оформлення.
          </p>
        </noscript>
        <Button
          type="submit"
          className={styles.submit}
          size="lg"
          block
          disabled={
            isPending || !deliveryOptions.length || !paymentOptions.length
          }
        >
          {isPending
            ? "Оформлюємо…"
            : `${payment === "card" ? "Перейти до оплати" : "Підтвердити замовлення"} · ${formatMoney(total)}`}
        </Button>

        <p className={styles.consent}>
          Натискаючи кнопку, ви погоджуєтесь з{" "}
          <Link href="/info/terms">публічною офертою</Link> та обробкою
          персональних даних.
        </p>
      </form>
    </FormProvider>
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
