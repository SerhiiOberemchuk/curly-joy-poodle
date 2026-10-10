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
 * The buyer account address, or null when the shop has none open. Cached like
 * the catalog (`minutes`), so the header costs no CRM request per page view.
 * Throws when the CRM cannot be reached — failures are not cached, so the next
 * request asks again. A malformed answer reads as "no account", never as a
 * link the site cannot vouch for.
 */
export async function getCustomerAccountUrl(): Promise<string | null> {
  "use cache";
  cacheLife("minutes");

  const parsed = capabilitiesSchema.safeParse(await crmRequest("/capabilities"));
  return parsed.success ? (parsed.data.data.customerAccount?.url ?? null) : null;
}
