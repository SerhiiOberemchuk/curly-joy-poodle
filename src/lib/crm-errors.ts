import "server-only";
import { z } from "zod";
import { CrmApiError } from "./crm-client";

/** What a server log needs to explain a failed CRM call; never request data. */
export function crmFailureDetails(error: unknown): Record<string, unknown> {
  if (error instanceof CrmApiError)
    return { status: error.status, code: error.code, reason: error.reason };
  if (error instanceof z.ZodError)
    return { invalidFields: error.issues.map((issue) => issue.path.join(".")) };
  return { error };
}
