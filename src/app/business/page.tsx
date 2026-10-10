import type { Metadata } from "next";

import { B2bRequestForm } from "@/features/business/components/b2b-request-form";
import { site } from "@/lib/site";

import styles from "./business.module.css";

export const metadata: Metadata = {
  title: "Для бізнесу (B2B)",
  description:
    "Оптові ціни Curly Joy для зоомагазинів, грумерів, ветклінік і розплідників. Залиште запит — відкриємо кабінет партнера.",
};

// The partner cabinet is hosted by the shop's CRM (Obriym): orders from the
// price list, documents, balance and repeat orders for an approved company.
const partnerPortalUrl = (
  process.env.PARTNER_PORTAL_URL ?? "https://obriym-crm.com/portal"
).replace(/\/+$/, "");

const BENEFITS = [
  {
    title: "Оптові ціни",
    text: "Окремий прайс для партнерів і знижки від обсягу.",
  },
  {
    title: "Кабінет партнера",
    text: "Замовлення з прайсу, рахунки, накладні й баланс в одному місці.",
  },
  {
    title: "Повторні замовлення",
    text: "Попереднє замовлення повторюється в один клік за актуальними цінами.",
  },
  {
    title: "Доставка вашим клієнтам",
    text: "Можемо відправити замовлення напряму вашому покупцю.",
  },
] as const;

export default function Page() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Для бізнесу (B2B)</p>
        <h1>Співпраця з Curly Joy</h1>
        <p>
          Для зоомагазинів, грумінг-салонів, ветклінік, розплідників та
          інтернет-магазинів. Залиште запит — менеджер узгодить умови й відкриє
          вам кабінет партнера.
        </p>
      </header>

      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby="b2b-request">
          <h2 id="b2b-request" className={styles.panelTitle}>
            Запит на оптовий доступ
          </h2>
          <B2bRequestForm />
        </section>

        <div className={styles.aside}>
          <section aria-labelledby="b2b-benefits" className={styles.panel}>
            <h2 id="b2b-benefits" className={styles.panelTitle}>
              Що отримують партнери
            </h2>
            <ul className={styles.benefits}>
              {BENEFITS.map((benefit) => (
                <li key={benefit.title}>
                  <strong>{benefit.title}</strong>
                  <span>{benefit.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="b2b-partners" className={styles.panel}>
            <h2 id="b2b-partners" className={styles.panelTitle}>
              Вже партнер?
            </h2>
            <p className={styles.muted}>
              Вхід до кабінету партнера — за кодом, який приходить на email,
              вказаний у договорі.
            </p>
            <a className={styles.link} href={partnerPortalUrl}>
              Увійти до кабінету партнера
            </a>
            <p className={styles.muted}>
              Отримали від нас код підключення?{" "}
              <a className={styles.link} href={`${partnerPortalUrl}/join`}>
                Ввести код
              </a>
            </p>
          </section>

          <address className={styles.contacts}>
            <span>Питання щодо співпраці:</span>
            <a href={site.phoneHref}>{site.phone}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </address>
        </div>
      </div>
    </div>
  );
}
