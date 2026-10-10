"use client";

import { startTransition, useEffect, useState, type ReactNode } from "react";
import useSWR from "swr";
import { checkPaymentStatusAction } from "../actions";
import styles from "./payment-status-poller.module.css";

const CHECK_INTERVAL = 5000;
const CHECK_WINDOW = 60_000;

function syncPayment(token?: string) {
  return new Promise<boolean>((resolve, reject) => {
    startTransition(async () => {
      try {
        await checkPaymentStatusAction(token);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export function PaymentStatusPoller({
  active,
  orderId,
  token,
  children,
}: {
  active: boolean;
  orderId: string;
  token?: string;
  children?: ReactNode;
}) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setTimedOut(true), CHECK_WINDOW);
    return () => clearTimeout(timer);
  }, [active]);

  useSWR(["checkout-payment", orderId, token], () => syncPayment(token), {
    refreshInterval: active && !timedOut ? CHECK_INTERVAL : 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    errorRetryCount: 0,
  });
  if (!active) return null;
  return (
    <div className={styles.progress}>
      <div role="status" aria-live="polite">
        {timedOut ? (
          <p>
            Перевірка займає більше часу. Якщо ви вже оплатили, не сплачуйте
            повторно. Натисніть «Оновити статус» трохи пізніше.
          </p>
        ) : (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            <p>Перевіряємо оплату…</p>
            <p>
              Підтвердження від банку може зайняти трохи часу. Оновлюємо статус
              кожні 5 секунд.
            </p>
          </>
        )}
      </div>
      {timedOut ? children : null}
    </div>
  );
}
