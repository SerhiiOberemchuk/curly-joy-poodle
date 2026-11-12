"use client";

import type { ReactNode } from "react";
import { syncSurfaceInteraction } from "@/components/ui/surface-interaction";
import motion from "@/components/ui/surface-motion.module.css";

/**
 * The catalog panel as a native popover: it opens from its buttons, closes on
 * Escape or a click outside and hands the focus back without waiting for
 * React. A client navigation keeps the header mounted, so a link followed in
 * the page closes the panel; one opened in a new tab leaves it open.
 */
export function CatalogMenuPopover({
  id,
  className,
  children,
}: {
  id: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      popover="auto"
      className={`${className} ${motion.layer}`}
      onBeforeToggle={syncSurfaceInteraction}
      onToggle={syncSurfaceInteraction}
      onClick={(event) => {
        if (event.nativeEvent.defaultPrevented) event.currentTarget.hidePopover();
      }}
    >
      {children}
    </div>
  );
}
