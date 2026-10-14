"use client";

import { useId } from "react";
import { Icon } from "@/components/ui/icon";
import { site } from "@/lib/site";
import styles from "./quick-contact.module.css";

export function QuickContact() {
  const id = useId();
  return (
    <div className={styles.widget}>
      <button
        type="button"
        popoverTarget={id}
        className={styles.trigger}
        aria-label="Зв’язатися з Curly Joy"
      >
        <Icon name="chat" />
        <span>Ми поруч</span>
      </button>
      <div
        id={id}
        popover="auto"
        className={styles.panel}
        aria-labelledby={`${id}-title`}
      >
        <div className={styles.heading}>
          <h2 id={`${id}-title`}>
            Поговоримо? <span aria-hidden="true">♡</span>
          </h2>
          <button
            type="button"
            popoverTarget={id}
            popoverTargetAction="hide"
            aria-label="Закрити контакти"
          >
            <Icon name="close" />
          </button>
        </div>
        <p>Допоможемо обрати річ для вашого хвостика.</p>
        <ul className={styles.links}>
          {site.messengers.map((contact) => (
            <li key={contact.label}>
              <a href={contact.href} target="_blank" rel="noreferrer noopener">
                {contact.label}
                <Icon name="arrow" />
              </a>
            </li>
          ))}
          <li>
            <a
              href={site.socials[0].href}
              target="_blank"
              rel="noreferrer noopener"
            >
              Написати в Instagram
              <Icon name="arrow" />
            </a>
          </li>
          <li>
            <a href={site.phoneHref}>
              Зателефонувати
              <Icon name="arrow" />
            </a>
          </li>
          <li>
            <a href={`mailto:${site.email}`}>
              Написати на пошту
              <Icon name="arrow" />
            </a>
          </li>
        </ul>
        <p className={styles.hours}>{site.workingHours}</p>
      </div>
    </div>
  );
}
