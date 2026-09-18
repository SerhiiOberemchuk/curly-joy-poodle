import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { homeRecommendations, type HomeRecommendation } from "./reference-content";

/** Read boundary for the recommendations feed. Replace this source when CRM is connected. */
export async function getHomeRecommendations(): Promise<readonly HomeRecommendation[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("home-recommendations");

  return homeRecommendations;
}
