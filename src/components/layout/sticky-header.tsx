"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import styles from "./site-header.module.css";

export function StickyHeader({ topbar, children }: { topbar: ReactNode; children: ReactNode }) {
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [compact, setCompact] = useState<boolean | null>(null);

  useEffect(() => {
    if (!sentinelRef.current || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1);
      if (entry) setCompact(!entry.isIntersecting);
    }, {
      // Exclude edge contact so shrinking begins as soon as scrolling starts.
      rootMargin: "-1px 0px 0px 0px",
    });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={styles.header}
      data-sticky={compact !== null || undefined}
      data-compact={compact || undefined}
    >
      <span ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <div className={styles.topbar}>{topbar}</div>
      <div className={styles.headerBar}>{children}</div>
    </header>
  );
}
