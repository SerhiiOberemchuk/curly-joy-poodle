import { mockCrmProvider } from "./mock-provider";
import type { CrmProvider, CrmSubmission } from "./types";

export type CrmMode = "mock" | "off";

/**
 * `mock` simulates the hand-off to SalesDrive; `off` skips it entirely.
 * Production defaults to `off` so a simulated reference can never be mistaken
 * for a real one — a demo deployment opts in with `CRM_MODE=mock`.
 */
export function crmMode(): CrmMode {
  const value = process.env.CRM_MODE;
  if (value === "mock" || value === "off") return value;
  return process.env.NODE_ENV === "production" ? "off" : "mock";
}

export function crmProvider(): CrmProvider | null {
  return crmMode() === "mock" ? mockCrmProvider : null;
}

export type { CrmProvider, CrmSubmission };
