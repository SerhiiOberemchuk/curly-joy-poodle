import type { Metadata } from "next";
import Image from "next/image";

import { Icon } from "@/components/ui/icon";
import { B2bRequestForm } from "@/features/business/components/b2b-request-form";
import { openGraph } from "@/lib/metadata";
import { site } from "@/lib/site";

import styles from "./business.module.css";

export const metadata: Metadata = {
  title: "Для бізнесу (B2B)",
  description:
    "Оптові ціни Curly Joy для зоомагазинів, грумерів, ветклінік і розплідників. Залиште запит, щоб обговорити умови співпраці.",
  alternates: { canonical: "/business" },
  openGraph: openGraph({
    title: "Для бізнесу (B2B)",
    description:
      "Оптові ціни Curly Joy для зоомагазинів, грумерів, ветклінік і розплідників. Залиште запит, щоб обговорити умови співпраці.",
    url: "/business",
  }),
};

// The partner cabinet is hosted by the shop's CRM (Obriym): orders from the
// price list, documents, balance and repeat orders for an approved company.
const partnerPortalUrl = (
  process.env.PARTNER_PORTAL_URL ?? "https://obriym-crm.com/portal"
).replace(/\/+$/, "");

const BENEFITS = [
  {
    icon: "bag",
    title: "Оптові ціни",
    text: "Окремий прайс для партнерів і знижки від обсягу.",
  },
  {
    icon: "user",
    title: "Кабінет партнера",
    text: "Замовлення з прайсу, рахунки, накладні й баланс в одному місці.",
  },
  {
    icon: "check",
    title: "Повторні замовлення",
    text: "Попереднє замовлення повторюється в один клік за актуальними цінами.",
  },
  {
    icon: "truck",
    title: "Доставка вашим клієнтам",
    text: "Можемо відправити замовлення напряму вашому покупцю.",
  },
] as const;

const STEPS = [
  {
    title: "Заявка",
    text: "Заповніть коротку форму нижче: хто ви і що вас цікавить.",
  },
  {
    title: "Умови",
    text: "Менеджер зв’яжеться з вами, узгодить ціни й формат співпраці.",
  },
  {
    title: "Доступ",
    text: "Після договору ви отримаєте на email код до кабінету партнера.",
  },
  {
    title: "Замовлення",
    text: "Замовляйте з прайсу в кабінеті — документи й баланс там само.",
  },
] as const;

export default function Page() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Для бізнесу (B2B)</p>
          <h1>Співпраця з Curly Joy</h1>
          <p>
            Для зоомагазинів, грумінг-салонів, ветклінік, розплідників та
            інтернет-магазинів. Залиште запит, і ми зв’яжемося з вами, щоб
            обговорити умови співпраці.
          </p>
          <a className={styles.heroButton} href="#b2b-request">
            Залишити заявку <Icon name="arrow" />
          </a>
        </div>
        <div className={styles.heroImage}>
          <Image
            src="/images/home/hero.webp"
            alt="Кучеряві пуделі разом у м’якій лежанці"
            fill
            sizes="(max-width: 900px) 100vw, 560px"
          />
        </div>
      </header>

      <section className={styles.section} aria-labelledby="b2b-benefits">
        <h2 id="b2b-benefits" className={styles.sectionTitle}>
          Що отримують партнери
        </h2>
        <ul className={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <li key={benefit.title}>
              <span className={styles.benefitIcon} aria-hidden="true">
                <Icon name={benefit.icon} />
              </span>
              <strong>{benefit.title}</strong>
              <span>{benefit.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="b2b-steps">
        <h2 id="b2b-steps" className={styles.sectionTitle}>
          Як це працює
        </h2>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <strong>{step.title}</strong>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby="b2b-request">
          <h2 id="b2b-request" className={styles.panelTitle}>
            Запит на оптовий доступ
          </h2>
          <B2bRequestForm />
        </section>

        <div className={styles.aside}>
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
