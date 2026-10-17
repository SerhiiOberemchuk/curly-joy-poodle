"use server";
import { refresh } from "next/cache";
import type { OfferState } from "./types";
import { submitOfferRequest } from "./offer.server";

export async function requestWelcomeOfferAction(
  _state: OfferState,
  formData: FormData,
): Promise<OfferState> {
  const result = await submitOfferRequest(formData);
  if (result.stale) refresh();
  return result.state;
}
