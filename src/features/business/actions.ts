"use server";

import type { B2bRequestState } from "./action-state";
import { submitB2bRequest } from "./business.server";

export async function requestB2bAccessAction(
  _state: B2bRequestState,
  formData: FormData,
): Promise<B2bRequestState> {
  return submitB2bRequest(formData);
}
