"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { FormSuccess } from "@/components/ui/form-success";
import { Icon } from "@/components/ui/icon";
import { initialReviewState } from "../action-state";
import { submitReviewAction } from "../actions";
import styles from "../reviews.module.css";

/**
 * Without `requestId` the form stands in the static shell while the reviews
 * stream: the same fields, disabled until the page's own request id arrives.
 */
export function ReviewForm({ productId, requestId }: { productId: string; requestId?: string }) {
  const [state, action, pending] = useActionState(
    submitReviewAction.bind(null, productId, requestId ?? ""),
    initialReviewState,
  );
  const locked = pending || !requestId;
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  // The server's answer lands next to the fields: take the keyboard to the first.
  useEffect(() => {
    if (state.status !== "error") return;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"], fieldset[aria-describedby] input')
      ?.focus();
  }, [state]);
  const fields = [
    {
      name: "name",
      label: "Ваше ім’я",
      type: "text",
      autoComplete: "given-name",
      maxLength: 80,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      autoComplete: "email",
      maxLength: 120,
    },
  ] as const;
  if (state.status === "submitted") {
    return (
      <FormSuccess className={styles.formPanel} id="review-form">
        {state.message}
      </FormSuccess>
    );
  }
  return (
    <div className={styles.formPanel} id="review-form">
      <span className={styles.eyebrow}>Ваша історія має значення</span>
      <h3 className={styles.formTitle}>Як вам ця річ?</h3>
      <p className={styles.formIntro}>
        Поділіться враженнями — допоможіть іншим знайти свою маленьку радість.
      </p>
      {/* The server checks every field and answers next to it, in the
          shop's own words, instead of the browser's bubbles. */}
      <form ref={formRef} action={action} className={styles.form} noValidate>
        <fieldset
          className={styles.ratingField}
          disabled={locked}
          aria-describedby={
            state.errors.rating ? `${id}-rating-error` : undefined
          }
        >
          <legend>
            Ваша оцінка <span aria-hidden="true">*</span>
          </legend>
          <div className={styles.ratingOptions}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <label className={styles.ratingOption} key={rating}>
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  required
                  defaultChecked={state.values?.rating === String(rating)}
                  aria-label={`${rating} з 5`}
                />
                <span>
                  <Icon name="star" />
                  {rating}
                </span>
              </label>
            ))}
          </div>
          {state.errors.rating ? (
            <p className={styles.error} id={`${id}-rating-error`}>
              {state.errors.rating}
            </p>
          ) : null}
        </fieldset>
        <div className={styles.formRow}>
          {fields.map((field) => (
            <div className={styles.field} key={field.name}>
              <label htmlFor={`${id}-${field.name}`}>
                {field.label} <span aria-hidden="true">*</span>
              </label>
              <input
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                maxLength={field.maxLength}
                id={`${id}-${field.name}`}
                required
                disabled={locked}
                defaultValue={state.values?.[field.name] ?? ""}
                aria-invalid={Boolean(state.errors[field.name])}
                aria-describedby={
                  state.errors[field.name]
                    ? `${id}-${field.name}-error`
                    : field.name === "email"
                      ? `${id}-email-hint`
                      : undefined
                }
              />
              {state.errors[field.name] ? (
                <p className={styles.error} id={`${id}-${field.name}-error`}>
                  {state.errors[field.name]}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <p className={styles.hint} id={`${id}-email-hint`}>
          Email не відображатиметься у відгуку.
        </p>
        <div className={styles.field}>
          <label htmlFor={`${id}-comment`}>
            Ваші враження <span aria-hidden="true">*</span>
          </label>
          <textarea
            id={`${id}-comment`}
            name="comment"
            rows={4}
            minLength={10}
            maxLength={2000}
            required
            disabled={locked}
            defaultValue={state.values?.comment ?? ""}
            placeholder="Розкажіть про свій досвід із цим товаром"
            aria-invalid={Boolean(state.errors.comment)}
            aria-describedby={
              state.errors.comment ? `${id}-comment-error` : undefined
            }
          />
          {state.errors.comment ? (
            <p className={styles.error} id={`${id}-comment-error`}>
              {state.errors.comment}
            </p>
          ) : null}
        </div>
        <label className={styles.consent}>
          <input
            name="consent"
            type="checkbox"
            required
            disabled={locked}
            defaultChecked={state.values?.consent === "on"}
            aria-invalid={Boolean(state.errors.consent)}
            aria-describedby={
              state.errors.consent ? `${id}-consent-error` : undefined
            }
          />
          <span>Погоджуюся на обробку даних для публікації відгуку.</span>
        </label>
        {state.errors.consent ? (
          <p className={styles.error} id={`${id}-consent-error`}>
            {state.errors.consent}
          </p>
        ) : null}
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={locked}
        >
          {pending ? "Надсилаємо…" : "Надіслати відгук"}
          <Icon name="arrow" />
        </button>
        <p className={styles.hint}>Відгук з’явиться на сайті після перевірки.</p>
        {state.status === "error" ? (
          <p className={styles.error} role="alert">
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
