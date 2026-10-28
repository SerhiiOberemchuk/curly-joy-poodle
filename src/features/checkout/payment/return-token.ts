import "server-only";
import { sealData, unsealData } from "iron-session";
import { z } from "zod";
import { getCheckoutSessionPassword } from "../session";
import type { PaymentMethod } from "../types";

const TTL = 24 * 60 * 60;
const proofSchema = z.object({
  purpose: z.literal("payment-return"),
  number: z.string().min(1).max(160),
  payment: z.enum(["card", "cod"]).default("card"),
  cartRevision: z.uuid().optional(),
});

export async function createPaymentReturnToken(
  number: string,
  payment: PaymentMethod = "card",
  cartRevision?: string,
): Promise<string> {
  return sealData(
    proofSchema.parse({ purpose: "payment-return", number, payment, cartRevision }),
    { password: getCheckoutSessionPassword(), ttl: TTL },
  );
}

export async function readPaymentReturnToken(
  token: string,
): Promise<string | null> {
  return (await readPaymentReturnProof(token))?.number ?? null;
}

export async function readPaymentReturnProof(token: string) {
  if (typeof token !== "string" || token.length > 2048) return null;
  const parsed = proofSchema.safeParse(
    await unsealData<unknown>(token, {
      password: getCheckoutSessionPassword(),
      ttl: TTL,
    }),
  );
  return parsed.success ? parsed.data : null;
}
