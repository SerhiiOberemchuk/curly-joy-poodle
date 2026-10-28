"use client";

import Clarity from "@microsoft/clarity";
import { useEffect } from "react";

const PROJECT_ID = "z4ho5gc47t";

function isCheckoutPath(pathname: string) {
  return pathname === "/checkout" || pathname.startsWith("/checkout/");
}

/**
 * Microsoft Clarity heatmaps and recordings. Mounted once in the root layout;
 * renders nothing. Clarity follows client navigations by itself.
 *
 * Clarity records every URL, and checkout URLs carry the order access token
 * (`/checkout/success?token=…`), so a document opened on checkout never loads
 * it. Checkout itself is only reached by a document navigation (the plain cart
 * link, the bank return), so a recorded document never gets there either.
 */
export function ClarityAnalytics() {
  useEffect(() => {
    if (!isCheckoutPath(window.location.pathname)) Clarity.init(PROJECT_ID);
  }, []);
  return null;
}
