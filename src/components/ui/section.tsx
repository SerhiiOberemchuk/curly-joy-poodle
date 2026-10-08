import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./section.module.css";

export function Section<HrefType extends string>({
  eyebrow,
  title,
  description,
  action,
  tight = false,
  headingLevel = 2,
  children,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: { href: Route<HrefType>; label: string };
  tight?: boolean;
  /** 1 when the section is the page itself, e.g. the 404 page. */
  headingLevel?: 1 | 2;
  children?: ReactNode;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section className={`${styles.section} ${tight ? styles.tight : ""}`}>
      <div className="container">
        {title ? (
          <header className={styles.head}>
            <div>
              {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
              <Heading className={styles.title}>{title}</Heading>
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
