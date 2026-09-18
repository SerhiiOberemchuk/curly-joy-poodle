"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { LIQPAY_CHECKOUT_URL } from "../payment/liqpay-constants";

/**
 * Hands the browser over to LiqPay's hosted checkout. The submit happens on
 * mount, and the button stays as the fallback for anyone whose browser blocked
 * it — or who came back with the back arrow.
 */
export function LiqPayRedirectForm({
  data,
  signature,
}: {
  data: string;
  signature: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form
      ref={formRef}
      method="post"
      action={LIQPAY_CHECKOUT_URL}
      onSubmit={() => setLeaving(true)}
    >
      <input type="hidden" name="data" value={data} />
      <input type="hidden" name="signature" value={signature} />
      <Button type="submit" size="lg">
        {leaving ? "Відкриваємо LiqPay…" : "Перейти до оплати LiqPay"}
      </Button>
    </form>
  );
}
