import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./section.module.css";

export function Section({
  eyebrow,
  title,
  description,
  action,
  tight = false,
  children,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: { href: string; label: string };
  tight?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className={`${styles.section} ${tight ? styles.tight : ""}`}>
      <div className="container">
        {title ? (
          <header className={styles.head}>
            <div>
              {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
              <h2 className={styles.title}>{title}</h2>
              {description ? <p className={styles.description}>{description}</p> : null}
            </div>
            {action ? (
              <Link href={action.href} className={styles.action}>
                {action.label} →
              </Link>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}
