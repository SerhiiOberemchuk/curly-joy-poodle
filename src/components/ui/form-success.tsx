"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The message that replaces a form after it was sent. The focused submit button
 * goes away with the form, so the focus moves here and the message is read out
 * instead of the focus falling back to the page.
 */
export function FormSuccess({
  className,
  id,
  children,
}: {
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div ref={ref} id={id} className={className} role="status" tabIndex={-1}>
      {children}
    </div>
  );
}
