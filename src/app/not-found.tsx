import Link from "next/link";
import type { Metadata } from "next";

import { buttonStyles } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Сторінку не знайдено",
  robots: { index: false, follow: false },
};

export default function NotFound() {
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
