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
      description="Можливо, товар більше не продається або в посиланні є помилка. Почніть із каталогу — там усе, що зараз у наявності."
    >
      <Link href="/catalog" className={buttonStyles({ size: "lg" })}>
        Перейти до каталогу
      </Link>
    </Section>
  );
}
