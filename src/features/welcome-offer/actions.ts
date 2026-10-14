"use server";
import type { OfferState } from "./types";
import { submitOfferRequest } from "./offer.server";

export async function requestWelcomeOfferAction(
  _state: OfferState,
  formData: FormData,
): Promise<OfferState> {
  return submitOfferRequest(formData);
}
