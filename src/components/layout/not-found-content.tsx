import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

export function NotFoundContent() {
  return (
    <Section
      headingLevel={1}
      title="Такої сторінки немає"
      description="Можливо, посилання застаріло або товар більше не продається. Подивіться, що є в каталозі зараз."
    >
      <Link href="/catalog" className={buttonStyles({ size: "lg" })}>
        Перейти до каталогу
      </Link>
    </Section>
  );
}
