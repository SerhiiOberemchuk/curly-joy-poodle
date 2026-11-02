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
      // Exclude edge contact: compact exactly once the marker has scrolled past.
      rootMargin: "-1px 0px 0px 0px",
    });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Outside the header: a marker inside it would be held at the top with it. */}
      <span ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <header
        className={styles.header}
        data-sticky={compact !== null || undefined}
        data-compact={compact || undefined}
      >
        <div className={styles.topbar}>
          <div className={styles.topbarInner}>{topbar}</div>
        </div>
        <div className={styles.headerBar}>
          <div className={styles.headerInner}>{children}</div>
        </div>
      </header>
    </>
  );
}
