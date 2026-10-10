import "server-only";

import { cacheLife } from "next/cache";
import { z } from "zod";

import { crmRequest } from "@/lib/crm-client";

// The buyer account is a CRM product on the shop's own address
// (`{shop}.obriym.app/account`), not a page of this site. The CRM answers with
// its address only while the account would open, so the header never links a
// buyer to a closed one and the owner switches it on or off in the CRM with no
// site release.
const capabilitiesSchema = z.object({
  data: z.object({
    // Optional: a CRM that predates the field simply means "no account".
    customerAccount: z
      .object({ url: z.url({ protocol: /^https$/ }).nullable() })
      .optional(),
  }),
});

/**
 * The buyer account address, or null when the shop has none open. Cached for
 * five minutes, so the header costs no CRM request per page view; the header
 * is on every page, so a shorter life would make static pages regenerate
 * every minute too.
 * An unreachable CRM or a malformed answer reads as "no account", never as a
 * link the site cannot vouch for. The failure is caught INSIDE the cached
 * scope: during prerender a rejected cached call surfaces even to a caller
 * that catches it, and the header lives in the root layout.
 */
export async function getCustomerAccountUrl(): Promise<string | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3_600 });

  try {
    const parsed = capabilitiesSchema.safeParse(await crmRequest("/capabilities"));
    return parsed.success ? (parsed.data.data.customerAccount?.url ?? null) : null;
  } catch {
    return null;
  }
}
