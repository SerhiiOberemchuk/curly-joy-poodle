"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef, useState } from "react";

import type { NavLink } from "@/lib/navigation";
import styles from "./mobile-nav.module.css";

interface MobileNavProps {
  links: readonly NavLink[];
  /** The buyer account on the shop's CRM address, when one is open. */
  account?: { href: string; label: string } | null;
}

export function MobileNav({ links, account }: MobileNavProps) {
  const pathname = usePathname();
  return <MobileNavPanel key={pathname} links={links} account={account} />;
}

function MobileNavPanel({ links, account }: MobileNavProps) {
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        ref={toggleRef}
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Закрити меню" : "Відкрити меню"}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          aria-hidden="true"
          fill="none"
        >
          {open ? (
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M3 6h14M3 10h14M3 14h14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {open ? (
        <nav
          id={panelId}
          className={styles.panel}
          aria-label="Мобільне меню"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              toggleRef.current?.focus();
            }
          }}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.link}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {account ? (
            // Another host, so a plain anchor rather than a client navigation.
            <a href={account.href} className={styles.link}>
              {account.label}
            </a>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
