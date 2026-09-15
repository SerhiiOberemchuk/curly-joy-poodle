import { site } from "@/lib/site";

import styles from "./home.module.css";

const services = [
  {
    title: "Швидка доставка",
    text: "Новою Поштою по всій Україні",
    path: "m12 3 9 5v10l-9 5-9-5V8l9-5Zm0 10 9-5M12 13 3 8m9 5v10M7.5 5.5l9 5",
  },
  {
    title: "Служба підтримки",
    text: "Працюємо з понеділка по п’ятницю",
    path: "M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2Z",
  },
  {
    title: "Завжди на зв’язку",
    text: site.phone,
    href: site.phoneHref,
    path: "M3 5h18v14H3V5Zm0 0 9 8 9-8",
  },
  {
    title: "Зручна оплата",
    text: "Накладений платіж або рахунок",
    path: "M5 9h14v12H5V9Zm3 0V6a4 4 0 0 1 8 0v3m-4 5v3",
  },
] as const;

export function ValueProps() {
  return (
    <div className="container">
      <ul className={styles.valueStrip}>
        {services.map((service) => (
          <li key={service.title} className={styles.valueItem}>
            <svg
              className={styles.valueIcon}
              viewBox="0 0 24 26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={service.path} />
            </svg>
            <span className={styles.valueTitle}>{service.title}</span>
            <span className={styles.valueText}>
              {"href" in service ? (
                <a href={service.href}>{service.text}</a>
              ) : (
                service.text
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
