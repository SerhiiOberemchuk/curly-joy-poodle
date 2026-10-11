"use client";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

// `retry` re-requests the segment from the server: after a CRM outage the page
// comes back with fresh data, which `reset` alone would not fetch.
export default function AppError({ retry }: { error: Error; retry: () => void }) {
  return (
    <Section
      headingLevel={1}
      title="Щось пішло не так"
      description="Сталася помилка під час завантаження сторінки. Спробуйте ще раз — якщо не допоможе, зателефонуйте нам."
    >
      <Button size="lg" onClick={retry}>
        Спробувати ще раз
      </Button>
    </Section>
  );
}
