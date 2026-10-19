"use client";

import { useActionState, useCallback, useEffect, useId, useRef } from "react";
import { FormSuccess } from "@/components/ui/form-success";
import { Icon } from "@/components/ui/icon";
import { requestWelcomeOfferAction } from "../actions";
import {
  initialOfferState,
  type WelcomeOffer,
  type WelcomeOfferDialogCopy,
} from "../types";
import styles from "../welcome-offer.module.css";

export function WelcomeOfferDialog({
  offer,
  copy,
}: {
  offer: WelcomeOffer;
  copy: WelcomeOfferDialogCopy;
}) {
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
    // A modal that opens by itself would pull a keyboard user out of where
    // they are on the page; they open the offer with its button instead.
    let usedKeyboard = false;
    const noteKeyboard = () => {
      usedKeyboard = true;
    };
    window.addEventListener("keydown", noteKeyboard, { once: true });
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
            usedKeyboard ||
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
      window.removeEventListener("keydown", noteKeyboard);
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
        {copy.open}
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
          aria-label={copy.close}
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
          <span className={styles.eyebrow}>{copy.eyebrow}</span>
          <h2 id={`${id}-title`}>{offer.title}</h2>
          <p id={`${id}-description`}>{offer.description}</p>
          {state.status === "sent" ? (
            <FormSuccess className={styles.success}>{state.message}</FormSuccess>
          ) : (
            <form action={action} className={styles.form}>
              <input type="hidden" name="offerId" value={offer.id} />
              <input
                type="hidden"
                name="offerRevision"
                value={offer.revision}
              />
              <input type="hidden" name="locale" value={offer.locale} />
              <p className={styles.hint}>{copy.hint}</p>
              <div className={styles.field}>
                <label htmlFor={`${id}-email`}>{copy.email}</label>
                <input
                  id={`${id}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={120}
                  required
                  disabled={pending}
                  defaultValue={state.values?.email ?? ""}
                />
              </div>
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
                />
                <span>{offer.consentText}</span>
              </label>
              <button
                type="submit"
                className={styles.button}
                disabled={pending}
              >
                {pending ? copy.pending : copy.submit}
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
