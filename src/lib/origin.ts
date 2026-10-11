import "server-only";

import { site } from "./site";

/**
 * Public origin of the deployment, without a trailing slash. Payment callbacks
 * and the URLs the acquirer sends the customer back to must be absolute and
 * must not depend on the host header of an inbound proxy request.
 *
 * `SITE_URL` overrides it. Without it a production server answers for the
 * shop's canonical address — never localhost, which the CRM would refuse as a
 * bank return URL, so buyers would silently stop coming back after paying.
 */
export function siteOrigin(): string {
  const origin =
    process.env.SITE_URL ??
    (process.env.NODE_ENV === "production" ? site.url : "http://localhost:3000");
  return origin.replace(/\/$/, "");
}

export function siteUrl(path: string): string {
  return `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}
