import type { ReactNode } from "react";

import styles from "./skeleton.module.css";

/**
 * A shimmering stand-in for content that is still streaming. Hidden from
 * assistive technology: the region it fills announces the loading itself.
 * `line` sizes it to one line of the surrounding text; `children` (kept
 * invisible) size it like the text it replaces.
 */
export function Bone({
  className,
  line = false,
  children,
}: {
  className?: string;
  line?: boolean;
  children?: ReactNode;
}) {
  return (
    <span
      className={[styles.bone, line && styles.line, className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
