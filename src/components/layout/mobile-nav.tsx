"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import type { NavLink } from "@/lib/navigation";
import styles from "./mobile-nav.module.css";

interface MobileNavProps {
  links: readonly NavLink[];
  /** Sections without content yet: named, tagged «скоро», not linked. */
  upcoming?: readonly string[];
  /** The buyer account on the shop's CRM address, when one is open. */
  account?: { href: string; label: string } | null;
}

export function MobileNav(props: MobileNavProps) {
  const pathname = usePathname();
  return <MobileNavPanel key={pathname} {...props} />;
}

function MobileNavPanel({ links, upcoming = [], account }: MobileNavProps) {
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function closeOutside(event: Event) {
      const inside = event
        .composedPath()
        .some(
          (element) =>
            element === panelRef.current || element === toggleRef.current,
        );
      if (!inside) setOpen(false);
    }

    document.addEventListener("pointerdown", closeOutside, true);
    document.addEventListener("focusin", closeOutside, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside, true);
      document.removeEventListener("focusin", closeOutside, true);
    };
  }, [open]);

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
        <Icon name={open ? "close" : "menu"} />
      </button>

      {open ? (
        <nav
          id={panelId}
          ref={panelRef}
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
          {upcoming.map((label) => (
            <span key={label} className={styles.upcoming}>
              {label}
              <span className={styles.soonTag}>скоро</span>
            </span>
          ))}
          {account ? (
            // Another host, so a plain anchor rather than a client navigation.
            <a
              href={account.href}
              className={styles.link}
              onClick={() => setOpen(false)}
            >
              {account.label}
            </a>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
