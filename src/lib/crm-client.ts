import "server-only";
import { z } from "zod";

const errorSchema = z.object({ error: z.object({ code: z.string() }) });

export class CrmApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(`CRM request failed (${status}, ${code})`);
    this.name = "CrmApiError";
  }
}

export async function crmRequest(path: string, body?: unknown): Promise<unknown> {
  const key = process.env.OBRIYM_CRM_API_KEY;
  if (!key) throw new CrmApiError(503, "NOT_CONFIGURED");
  const base = (
    process.env.OBRIYM_CRM_API_URL ?? "https://obriym-crm.com/api/v1"
  ).replace(/\/+$/, "");
  const response = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      authorization: `Bearer ${key}`,
      accept: "application/json",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
    signal: AbortSignal.timeout(body === undefined ? 15_000 : 30_000),
  });
  if (!response.ok) {
    const error = errorSchema.safeParse(await response.json().catch(() => null));
    throw new CrmApiError(
      response.status,
      error.success ? error.data.error.code : "REQUEST_FAILED",
    );
  }
  return response.json();
}
