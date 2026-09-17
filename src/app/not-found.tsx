import type { Metadata } from "next";

import { NotFoundContent } from "@/components/layout/not-found-content";

export const metadata: Metadata = {
  title: "Сторінку не знайдено",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundContent />;
}
