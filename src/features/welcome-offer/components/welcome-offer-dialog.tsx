"use client";

import { useActionState, useCallback, useEffect, useId, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { requestWelcomeOfferAction } from "../actions";
import { initialOfferState, type WelcomeOffer } from "../types";
import styles from "../welcome-offer.module.css";

export function WelcomeOfferDialog({ offer }: { offer: WelcomeOffer }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const overflow = useRef<string | null>(null);
  const id = useId();
  const [state, action, pending] = useActionState(
    requestWelcomeOfferAction,
    initialOfferState,
  );
  const show = useCallback(() => {
    if (!dialog.current || dialog.current.open) return;
    overflow.current = document.body.style.overflow;
    dialog.current.showModal();
    document.body.style.overflow = "hidden";
  }, []);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!window.sessionStorage.getItem(`welcome-offer:${offer.id}`))
        timer = setTimeout(() => {
          try {
            if (window.sessionStorage.getItem(`welcome-offer:${offer.id}`))
              return;
          } catch {
            return;
          }
          if (
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement
          )
            return;
          show();
        }, 20000);
    } catch {
      /* The manual button still works if session storage is blocked. */
    }
    return () => {
      clearTimeout(timer);
      if (overflow.current !== null) {
        document.body.style.overflow = overflow.current;
        overflow.current = null;
      }
    };
  }, [offer.id, show]);
  function closed() {
    if (overflow.current !== null) {
      document.body.style.overflow = overflow.current;
      overflow.current = null;
    }
    try {
      window.sessionStorage.setItem(`welcome-offer:${offer.id}`, "dismissed");
    } catch {
      /* Optional dismissal persistence. */
    }
  }
  return (
    <>
      <button type="button" className={styles.button} onClick={show}>
        Пропозиція для першого замовлення
        <Icon name="arrow" />
      </button>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        onClose={closed}
      >
        <button
          type="button"
          className={styles.close}
          aria-label="Закрити пропозицію"
          onClick={() => dialog.current?.close()}
        >
          <Icon name="close" />
        </button>
        <div className={styles.dialogArt} aria-hidden="true">
          <Icon name="paw" />
          <span>
            hello,
            <br />
            new friend ♡
          </span>
        </div>
        <div className={styles.dialogCopy}>
          <span className={styles.eyebrow}>Для першого знайомства</span>
          <h2 id={`${id}-title`}>{offer.title}</h2>
          <p id={`${id}-description`}>{offer.description}</p>
          {state.status === "sent" ? (
            <p className={styles.success} role="status">
              {state.message}
            </p>
          ) : (
            <form action={action} className={styles.form}>
              <input type="hidden" name="offerId" value={offer.id} />
              <p className={styles.hint}>
                Залиште email або телефон — зв’яжемося щодо пропозиції.
              </p>
              {(
                [
                  {
                    name: "email",
                    label: "Email",
                    type: "email",
                    autoComplete: "email",
                  },
                  {
                    name: "phone",
                    label: "Телефон",
                    type: "tel",
                    autoComplete: "tel",
                  },
                ] as const
              ).map((field) => (
                <div className={styles.field} key={field.name}>
                  <label htmlFor={`${id}-${field.name}`}>{field.label}</label>
                  <input
                    id={`${id}-${field.name}`}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    maxLength={field.name === "email" ? 120 : 20}
                    disabled={pending}
                    defaultValue={state.values?.[field.name] ?? ""}
                    aria-invalid={Boolean(state.errors[field.name])}
                    aria-describedby={
                      state.errors[field.name]
                        ? `${id}-${field.name}-error`
                        : undefined
                    }
                  />
                  {state.errors[field.name] ? (
                    <p
                      id={`${id}-${field.name}-error`}
                      className={styles.error}
                    >
                      {state.errors[field.name]}
                    </p>
                  ) : null}
                </div>
              ))}
              <div className={styles.honeypot} aria-hidden="true">
                <label htmlFor={`${id}-website`}>Website</label>
                <input
                  id={`${id}-website`}
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  name="consent"
                  required
                  disabled={pending}
                  defaultChecked={state.values?.consent === "on"}
                  aria-describedby={
                    state.errors.consent ? `${id}-consent-error` : undefined
                  }
                />
                <span>
                  Погоджуюся на обробку контакту та зв’язок щодо цієї
                  пропозиції.
                </span>
              </label>
              {state.errors.consent ? (
                <p className={styles.error} id={`${id}-consent-error`}>
                  {state.errors.consent}
                </p>
              ) : null}
              <button
                type="submit"
                className={styles.button}
                disabled={pending}
              >
                {pending ? "Надсилаємо…" : "Отримати пропозицію"}
                <Icon name="arrow" />
              </button>
              {state.status === "error" ? (
                <p className={styles.error} role="alert">
                  {state.message}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
