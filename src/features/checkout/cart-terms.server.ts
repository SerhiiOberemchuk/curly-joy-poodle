import "server-only";

import { cacheLife } from "next/cache";

import { getCapabilities } from "./crm";
import { hryvniaCartTerms } from "./options";

/** Display-only CRM terms; cart and checkout still read the current rules. */
export async function getDisplayCartTerms() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 60 });
  return hryvniaCartTerms(await getCapabilities());
}
