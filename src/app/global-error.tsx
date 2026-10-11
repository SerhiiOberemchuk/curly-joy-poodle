"use client";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { site } from "@/lib/site";

import "./globals.css";

/**
 * Replaces the root layout when the layout itself fails (the header reads the
 * cart and the CRM on every page), so the buyer still gets a Ukrainian page
 * with a way back instead of the framework's bare error screen.
 */
export default function GlobalError({ retry }: { error: Error; retry: () => void }) {
  return (
    <html lang="uk">
      <body>
        <title>{`Помилка · ${site.name}`}</title>
        <main>
          <Section
            headingLevel={1}
            title="Щось пішло не так"
            description={`Сайт тимчасово не завантажився. Спробуйте ще раз або зателефонуйте нам: ${site.phone}.`}
          >
            <Button size="lg" onClick={retry}>
              Спробувати ще раз
            </Button>
          </Section>
        </main>
      </body>
    </html>
  );
}
