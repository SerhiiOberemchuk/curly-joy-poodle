import type { ReactNode } from "react";

import styles from "./badge.module.css";

export type BadgeTone = "accent" | "mint" | "sky" | "neutral";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
