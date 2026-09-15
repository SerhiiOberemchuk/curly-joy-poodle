"use client";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Section
      title="Щось пішло не так"
      description="Сталася помилка під час завантаження сторінки. Спробуйте ще раз — якщо не допоможе, зателефонуйте нам."
    >
      <Button size="lg" onClick={reset}>
        Спробувати ще раз
      </Button>
    </Section>
  );
}
