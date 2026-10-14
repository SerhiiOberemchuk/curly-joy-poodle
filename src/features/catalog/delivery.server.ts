import "server-only";
import { cacheLife } from "next/cache";
import { getCapabilities } from "@/features/checkout/crm";
import { hryvniaCartTerms } from "@/features/checkout/options";

/** Display-only terms shared across product views; checkout still reads fresh. */
export async function getProductFreeShippingThreshold(): Promise<
  number | null
> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 60 });
  return hryvniaCartTerms(await getCapabilities()).freeShippingThreshold;
}
