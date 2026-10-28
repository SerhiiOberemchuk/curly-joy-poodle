"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useState,
  useTransition,
} from "react";
import {
  useForm,
  FormProvider,
  useWatch,
  type FieldError,
  type SubmitHandler,
  type UseFormRegisterReturn,
} from "react-hook-form";

import type { Cart } from "@/features/cart/types";
import { CartSummary } from "@/features/cart/components/cart-summary";
import { quotePromotionAction } from "../promotions.actions";
import {
  promotionCartKey,
  promotionInputKey,
  type PromotionResult,
} from "../promotions";
import pageStyles from "@/app/checkout/checkout.module.css";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

import { initialCheckoutState } from "../action-state";
import { placeOrderAction } from "../actions";
import { readAttribution } from "@/lib/attribution.client";
import { forgetCheckoutToken, tabCheckoutToken } from "../checkout-token.client";
import {
  availableDeliveries,
  availablePayments,
  shippingTermsKey,
} from "../options";
import { ensureBrowserCartRevision } from "@/features/cart/cart-cookie.client";
import type { CrmCapabilities, NpCity } from "../crm/types";
import { DESTINATION_FIELDS, NovaPoshtaFields } from "./nova-poshta-fields";
import {
  checkoutSchema,
  type CheckoutFormValues,
  FIELD_LIMITS,
  type CheckoutField,
} from "../validation";
import { MARKETING_CONSENT_TEXT } from "../marketing-consent";
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
  branchSearch: "",
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
  cart,
  capabilities,
  checkoutToken,
  stockAdjusted = false,
  offerMarketingConsent = false,
}: {
  cart: Cart;
  capabilities: CrmCapabilities;
  checkoutToken: string;
  /** The cart shown here was fitted to current stock, unlike the saved one. */
  stockAdjusted?: boolean;
  /** Server flag: show the unticked newsletter checkbox. */
  offerMarketingConsent?: boolean;
}) {
  const [marketingConsent, setMarketingConsent] = useState(false);
  const total = cart.subtotal;
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
  const email = useWatch({ control, name: "email" });
  const availableDelivery =
    deliveryOptions.find((option) => option.value === delivery)?.value ??
    deliveryOptions[0]?.value;
  const availablePayment =
    paymentOptions.find((option) => option.value === payment)?.value ??
    paymentOptions[0]?.value;
  const methodsReady =
    delivery === availableDelivery && payment === availablePayment;
  useEffect(() => {
    if (availableDelivery && delivery !== availableDelivery) {
      setValue("delivery", availableDelivery);
      for (const name of DESTINATION_FIELDS) setValue(name, "");
      clearErrors(["delivery", ...DESTINATION_FIELDS]);
    }
    if (availablePayment && payment !== availablePayment) {
      setValue("payment", availablePayment);
      clearErrors("payment");
    }
  }, [delivery, payment, availableDelivery, availablePayment, setValue, clearErrors]);
  const [code, setCode] = useState("");
  const [quoteState, setQuoteState] = useState<{
    key: string;
    result: PromotionResult;
  } | null>(null);
  const [quoting, startQuote] = useTransition();
  const cartKey = promotionCartKey(cart.lines);
  const shippingKey = shippingTermsKey(cart);
  const inputKey = promotionInputKey(
    { code, email, delivery },
    `${cartKey}:${shippingKey}`,
  );
  const currentResult = quoteState?.key === inputKey ? quoteState.result : null;
  const quote = currentResult?.ok ? currentResult.quote : undefined;
  const payable = quote ? Math.round(Number(quote.totalAmount) * 100) : total;
  const needsQuote = Boolean(code.trim()) && !quote;
  const promoId = useId();
  function applyCode() {
    const input = { code, email, delivery };
    startQuote(async () => {
      const result = await quotePromotionAction({ ...input, cartKey });
      // A changed cart arrives refreshed with the refusal; key it to that cart.
      setQuoteState({
        key: promotionInputKey(
          input,
          `${!result.ok && result.cartKey ? result.cartKey : cartKey}:${shippingKey}`,
        ),
        result,
      });
    });
  }

  // Nova Poshta lists settlements it does not deliver to an address in (front-
  // line villages). Courier delivery is then switched off for that city rather
  // than offered and refused at checkout; the server checks it again.
  const [courierBlocked, setCourierBlocked] = useState(false);
  const courierOffered = deliveryOptions.some(
    (option) => option.value === "np-courier",
  );
  const branchOffered = deliveryOptions.some(
    (option) => option.value === "np-branch",
  );
  function handleCityChange(city: NpCity | null) {
    const blocked = city?.courierAvailable === false;
    setCourierBlocked(blocked);
    if (blocked && delivery === "np-courier" && branchOffered) {
      setValue("delivery", "np-branch");
    }
  }

  // Server-side errors are handed to react-hook-form so they behave like any
  // other field error: they focus the first offender and clear as it is fixed.
  useEffect(() => {
    if (state.tokenRejected) forgetCheckoutToken();
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
    if (quoting || needsQuote || !methodsReady) return;
    ensureBrowserCartRevision(
      cart.lines.map((line) => ({ p: line.variantId, q: line.quantity })),
    );
    const data = new FormData();
    if (quote) {
      data.set("promotionCode", quote.code);
      data.set("promotionTotal", String(payable));
      data.set("promotionCartKey", cartKey);
    }
    for (const [name, value] of Object.entries(values)) data.set(name, value);
    data.set("expectedSubtotal", String(total));
    data.set("expectedShipping", shippingKey);
    data.set("cartKey", cartKey);
    data.set("checkoutToken", tabCheckoutToken(checkoutToken));
    const attribution = readAttribution();
    if (attribution) data.set("attribution", JSON.stringify(attribution));
    if (offerMarketingConsent && marketingConsent)
      data.set("marketingConsent", "1");
    startTransition(() => formAction(data));
  };

  const hasErrors = Object.keys(errors).length > 0;
  const hasServerError =
    state.status === "error" &&
    (!Object.keys(state.errors).length || hasErrors);

  return (
    <FormProvider {...form}>
      <div className={pageStyles.layout}>
        <section className={pageStyles.formPanel} aria-label="Дані замовлення">
          {stockAdjusted ? (
            <p className={styles.stockNotice}>
              Наявність змінилася: ми оновили кількість товарів у замовленні.
              Перевірте підсумок перед підтвердженням.
            </p>
          ) : null}
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
                  required
                  registration={register("firstName")}
                  error={errors.firstName}
                  autoComplete="given-name"
                  maxLength={FIELD_LIMITS.firstName}
                />
                <Field
                  label="Прізвище"
                  required
                  registration={register("lastName")}
                  error={errors.lastName}
                  autoComplete="family-name"
                  maxLength={FIELD_LIMITS.lastName}
                />
              </div>

              <div className={`${styles.row} ${styles.rowTwo}`}>
                <Field
                  label="Телефон"
                  required
                  registration={register("phone")}
                  error={errors.phone}
                  type="tel"
                  inputMode="tel"
                  placeholder="+380 67 440 43 94"
                  autoComplete="tel"
                />
                <Field
                  label="Email"
                  required
                  registration={register("email")}
                  error={errors.email}
                  type="email"
                  inputMode="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  maxLength={FIELD_LIMITS.email}
                />
              </div>
              {offerMarketingConsent ? (
                <label className={styles.consent}>
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(event) =>
                      setMarketingConsent(event.target.checked)
                    }
                  />
                  <span>{MARKETING_CONSENT_TEXT}</span>
                </label>
              ) : null}
            </fieldset>

            <fieldset className={styles.fieldset} disabled={isPending}>
              <legend className={styles.legend}>
                <span className={styles.step}>2</span> Доставка
              </legend>

              <div className={styles.options}>
                {deliveryOptions.map((option) => {
                  const unavailable =
                    option.value === "np-courier" && courierBlocked;
                  return (
                    <label key={option.value} className={styles.option}>
                      <input
                        type="radio"
                        value={option.value}
                        // Only when another way remains: a disabled checked radio
                        // would submit no delivery method at all.
                        disabled={unavailable && branchOffered}
                        {...register("delivery", {
                          onChange: () => {
                            for (const name of DESTINATION_FIELDS)
                              setValue(name, "");
                            clearErrors([...DESTINATION_FIELDS]);
                          },
                        })}
                      />
                      <span className={styles.optionBody}>
                        <span className={styles.optionLabel}>
                          {option.label}
                        </span>
                        <span className={styles.optionHint}>
                          {unavailable
                            ? "Недоступно: Нова пошта не доставляє кур’єром в обраний населений пункт."
                            : option.hint}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <NovaPoshtaFields
                method={delivery}
                disabled={isPending}
                courierOffered={courierOffered}
                onCityChange={handleCityChange}
              />
              {delivery === "np-courier" ? (
                <div className={`${styles.row} ${styles.rowTwo}`}>
                  <Field
                    label="Будинок"
                    required
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
                  Коментар{" "}
                  <span className={styles.optional}>— необов’язково</span>
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
                  Після підтвердження відкриється захищена сторінка Monobank.
                  Дані картки вводяться там — магазин їх не бачить і не
                  зберігає.
                </p>
              ) : null}
            </fieldset>

            <fieldset
              className={styles.fieldset}
              disabled={isPending || quoting}
            >
              <legend className={styles.legend}>Є промокод?</legend>
              <label className={styles.label} htmlFor={promoId}>
                Промокод
              </label>
              <div className={styles.promoRow}>
                <input
                  id={promoId}
                  className={styles.input}
                  value={code}
                  maxLength={64}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby={`${promoId}-status`}
                  onChange={(event) => setCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (code.trim() && !quoting) applyCode();
                    }
                  }}
                />
                <Button
                  type="button"
                  disabled={!code.trim()}
                  onClick={applyCode}
                >
                  {quoting ? "Перевіряємо…" : "Застосувати"}
                </Button>
              </div>
              {code ? (
                <button
                  type="button"
                  className={styles.removePromo}
                  onClick={() => {
                    setCode("");
                    setQuoteState(null);
                  }}
                >
                  Прибрати промокод
                </button>
              ) : null}
              <p
                id={`${promoId}-status`}
                role={currentResult && !currentResult.ok ? "alert" : "status"}
                className={
                  currentResult && !currentResult.ok
                    ? styles.error
                    : styles.paymentNotice
                }
              >
                {quoting
                  ? "Перевіряємо умови промокоду…"
                  : quote
                    ? `Промокод застосовано. Ваша знижка — ${formatMoney(Math.round(Number(quote.discountAmount) * 100))}.`
                    : currentResult && !currentResult.ok
                      ? currentResult.message
                      : needsQuote
                        ? "Вкажіть email у контактних даних і застосуйте промокод. Після зміни контактів чи доставки перевірте його ще раз."
                        : "Введіть код із листа. Персональний промокод діє з email, на який його отримали."}
              </p>
            </fieldset>

            {!isPending && (hasServerError || hasErrors) ? (
              <p className={styles.formError} role="alert">
                {hasServerError ? state.message : "Перевірте виділені поля."}
              </p>
            ) : null}

            <noscript>
              <p className={styles.formError}>
                Для вибору адреси Нової пошти увімкніть JavaScript або
                зверніться до нас для оформлення.
              </p>
            </noscript>
            <Button
              type="submit"
              className={styles.submit}
              size="lg"
              block
              disabled={
                isPending ||
                quoting ||
                needsQuote ||
                !methodsReady ||
                !deliveryOptions.length ||
                !paymentOptions.length
              }
            >
              {isPending
                ? "Оформлюємо…"
                : `${payment === "card" ? "Перейти до оплати" : "Підтвердити замовлення"} · ${formatMoney(payable)}`}
            </Button>

            <p className={styles.consent}>
              Натискаючи кнопку, ви погоджуєтесь з{" "}
              <Link href="/info/terms">публічною офертою</Link> та обробкою
              персональних даних.
            </p>
          </form>
        </section>
        <CartSummary cart={cart} action="none" promotion={quote}>
          <ul className={pageStyles.items} aria-label="Товари в замовленні">
            {cart.lines.map((line) => (
              <li className={pageStyles.item} key={line.variantId}>
                <span className={pageStyles.itemName}>
                  {line.title}
                  {line.option ? ` · ${line.option}` : ""} × {line.quantity}
                </span>
                <strong>{formatMoney(line.lineTotal)}</strong>
              </li>
            ))}
          </ul>
        </CartSummary>
      </div>
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
  required?: boolean;
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
