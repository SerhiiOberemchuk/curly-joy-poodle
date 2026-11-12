import { ViewTransition, type ReactNode } from "react";

/**
 * A page's crossfade when it replaces another. Each page wraps itself: a
 * layout persists across navigations, and keying a layout's transition by the
 * pathname put a second copy of every page into the static shell (the
 * pathname is unknown there, so the page rendered in a fallback and again in
 * the streamed content). A page mounts afresh for every new path, so its
 * transition needs no key.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      name="page-content"
      default="none"
      share="page-crossfade"
      enter="page-crossfade"
      exit="page-crossfade"
    >
      <div>{children}</div>
    </ViewTransition>
  );
}
