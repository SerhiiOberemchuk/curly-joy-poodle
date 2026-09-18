import { buttonStyles } from "@/components/ui/button";

import styles from "./liqpay-mock-form.module.css";

/**
 * Local stand-in for the LiqPay page, rendered only while `LIQPAY_MODE=mock`.
 * Plain buttons on a plain form: the whole point is to exercise the real
 * return flow, including the failure branch, without keys or network.
 */
export function LiqPayMockForm() {
  return (
    <form method="post" action="/api/payments/liqpay/mock" className={styles.form}>
      <p className={styles.badge}>Тестовий режим · LIQPAY_MODE=mock</p>
      <p className={styles.note}>
        Справжня сторінка LiqPay тут не відкривається. Оберіть, чим має
        завершитися оплата, — далі працює звичайний сценарій повернення.
      </p>
      <div className={styles.actions}>
        <button
          type="submit"
          name="outcome"
          value="success"
          className={buttonStyles({ size: "lg" })}
        >
          Успішна оплата
        </button>
        <button
          type="submit"
          name="outcome"
          value="failure"
          className={buttonStyles({ variant: "outline", size: "lg" })}
        >
          Відмова банку
        </button>
      </div>
    </form>
  );
}
