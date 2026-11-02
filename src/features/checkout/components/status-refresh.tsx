"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

/**
 * «Оновити статус» with visible feedback. The server re-reads the order from
 * the CRM and re-renders the page; when nothing has changed the page looks the
 * same, so the button says that it checked.
 */
export function StatusRefresh({
  action,
  size,
  className,
}: {
  action: () => Promise<void>;
  size?: "md" | "lg";
  /** Where the confirmation line sits beside the button. */
  className?: string;
}) {
  const [checked, formAction, pending] = useActionState(async () => {
    await action();
    return true;
  }, false);

  return (
    <form action={formAction} className={className}>
      <Button type="submit" size={size} variant="outline" disabled={pending}>
        {pending ? "Перевіряємо…" : "Оновити статус"}
      </Button>
      <p role="status" data-status-note>
        {checked && !pending ? "Статус перевірено — на сторінці актуальні дані." : ""}
      </p>
    </form>
  );
}
