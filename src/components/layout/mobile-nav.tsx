"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

import type { NavLink } from "@/lib/navigation";
import styles from "./mobile-nav.module.css";

export function MobileNav({ links }: { links: readonly NavLink[] }) {
  const pathname = usePathname();
  const panelId = useId();

  // The panel belongs to the route it was opened on. Cache Components keeps
  // routes mounted across navigations, so deriving `open` from the path closes
  // the menu on every navigation — including browser back — without an effect.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const open = openedFor === pathname;

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Закрити меню" : "Відкрити меню"}
        onClick={() => setOpenedFor(open ? null : pathname)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none">
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open ? (
        <nav id={panelId} className={styles.panel} aria-label="Мобільне меню">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}
