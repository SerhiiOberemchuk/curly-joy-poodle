import "server-only";

/**
 * Public origin of the deployment, without a trailing slash. Payment callbacks
 * and the URLs the acquirer sends the customer back to must be absolute and
 * must not depend on the host header of an inbound proxy request.
 */
export function siteOrigin(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function siteUrl(path: string): string {
  return `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}
