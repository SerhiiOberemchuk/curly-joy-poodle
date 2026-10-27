"use client";

import {
  mergeAttribution,
  parseStored,
  parseTouch,
  toCrmAttribution,
  type CrmAttribution,
} from "./attribution";

const STORAGE_KEY = "cjp-attribution";

/** Runs on a landing page: remembers the tagged visit. Storage may throw. */
export function captureAttribution(): void {
  try {
    const stored = parseStored(window.localStorage.getItem(STORAGE_KEY));
    const next = mergeAttribution(
      stored,
      parseTouch(window.location.search),
      Date.now(),
    );
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Private mode or blocked storage: the order is simply not attributed. */
  }
}

/** The block for the CRM, or undefined when there is nothing to send. */
export function readAttribution(): CrmAttribution | undefined {
  try {
    return toCrmAttribution(
      parseStored(window.localStorage.getItem(STORAGE_KEY)),
      Date.now(),
    );
  } catch {
    return undefined;
  }
}
