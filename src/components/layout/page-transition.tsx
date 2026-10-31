"use client";

import { usePathname } from "next/navigation";
import { Suspense, ViewTransition, type ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>{children}</div>}>
      <RouteTransition>{children}</RouteTransition>
    </Suspense>
  );
}

function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ViewTransition
      key={pathname}
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
