import type { Metadata } from "next";

import { NotFoundContent } from "@/components/layout/not-found-content";
import { PageTransition } from "@/components/layout/page-transition";

export const metadata: Metadata = {
  title: "Сторінку не знайдено",
};

export default function NotFound() {
  return (
    <PageTransition>
      <NotFoundContent />
    </PageTransition>
  );
}
