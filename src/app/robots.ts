import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

// Personal and transactional pages also carry `noindex`; disallowing them here
// keeps crawlers from spending the shop's CRM quota on them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/checkout", "/favorites", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", site.url).href,
  };
}
