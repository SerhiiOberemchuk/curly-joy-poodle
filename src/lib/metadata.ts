import type { Metadata } from "next";

import { site } from "./site";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** The site-wide share card: 1200×630, cut from the home hero. */
export const shareImage = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Чотири кучеряві пуделі в м’якій лежанці — Curly Joy",
};

/**
 * Next merges metadata shallowly: a page's `openGraph` replaces the layout's
 * whole object. Every page builds its card here, so the site name, locale and
 * image survive while the title, description and URL are the page's own.
 */
export function openGraph(page: {
  title: string;
  description?: string;
  url?: string;
  images?: OpenGraph["images"];
}): OpenGraph {
  return {
    type: "website",
    locale: site.locale,
    siteName: site.name,
    title: page.title,
    description: page.description,
    url: page.url,
    images: page.images ?? [shareImage],
  };
}
