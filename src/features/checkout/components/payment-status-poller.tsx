"use client";

import { startTransition, useEffect, useState } from "react";

import { checkPaymentStatusAction } from "../actions";
import styles from "./payment-status-poller.module.css";

/**
 * Backoff in milliseconds — about a minute of watching in six requests. The
 * customer is usually back before LiqPay's callback, so the first checks are
 * quick; after that the manual button takes over rather than polling forever.
 */
const SCHEDULE = [2000, 3000, 5000, 8000, 13000, 21000] as const;

/**
 * Asks the server to re-check the payment while the confirmation screen sits
 * in "waiting". Each check re-renders the route, so once the payment settles
 * the screen swaps to its final state and this component unmounts with it.
 */
export function PaymentStatusPoller() {
  const [attempt, setAttempt] = useState(0);
  const finished = attempt >= SCHEDULE.length;

  useEffect(() => {
    const delay = SCHEDULE[attempt];
    if (delay === undefined) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        await checkPaymentStatusAction();
        setAttempt((previous) => previous + 1);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [attempt]);

  return (
    <p className={styles.poller} role="status" aria-live="polite">
      {finished ? (
        "Автоматична перевірка завершилася. Якщо ви вже оплатили, натисніть «Оновити статус»."
      ) : (
        <>
          <span className={styles.pulse} aria-hidden="true" />
          Перевіряємо оплату…
        </>
      )}
    </p>
  );
}
