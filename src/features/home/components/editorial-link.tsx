import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "../lifestyle.module.css";

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h16m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EditorialLink<HrefType extends string>({
  href,
  children,
  filled = false,
}: {
  href: Route<HrefType>;
  children: ReactNode;
  filled?: boolean;
}) {
  return (
    <Link href={href} className={filled ? styles.button : styles.textLink}>
      {children}
      <Arrow />
    </Link>
  );
}
