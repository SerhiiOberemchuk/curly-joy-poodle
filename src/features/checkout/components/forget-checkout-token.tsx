"use client";

import { useEffect } from "react";
import { forgetCheckoutToken } from "../checkout-token.client";

/** Rendered on the confirmation page: the order this tab placed is settled. */
export function ForgetCheckoutToken() {
  useEffect(forgetCheckoutToken, []);
  return null;
}
