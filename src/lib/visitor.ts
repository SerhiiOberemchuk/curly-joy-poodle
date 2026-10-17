import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";

/**
 * Opaque per-visitor key for the CRM's rate buckets. The raw IP never leaves
 * the server; the CRM only ever sees a keyed hash. Without an IP or a usable
 * secret the header is simply omitted and the CRM falls back to its shared bucket.
 */
export async function visitorHeaders(): Promise<Record<string, string>> {
  const secret =
    process.env.CHECKOUT_SESSION_PASSWORD ?? process.env.OBRIYM_CRM_API_KEY;
  if (!secret || secret.length < 32) return {};
  const list = await headers();
  const ip =
    list.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    list.get("x-real-ip")?.trim();
  if (!ip) return {};
  return {
    "x-obriym-visitor": createHmac("sha256", secret)
      .update(`visitor:${ip}`)
      .digest("hex"),
  };
}
