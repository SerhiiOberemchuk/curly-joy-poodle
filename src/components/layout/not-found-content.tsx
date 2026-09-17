import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

export function NotFoundContent() {
  return (
    <Section
      title="Такої сторінки немає"
      description="Зараз для перегляду доступна лише головна сторінка Curly Joy. Інші розділи ми відкриємо пізніше."
    >
      <Link href="/" className={buttonStyles({ size: "lg" })}>
        Повернутися на головну
      </Link>
    </Section>
  );
}
