import "server-only";
import { sealData, unsealData } from "iron-session";
import { z } from "zod";
import { getCheckoutSessionPassword } from "../session";

const TTL = 24 * 60 * 60;
const proofSchema = z.object({
  purpose: z.literal("payment-return"),
  number: z.string().min(1).max(160),
});

export async function createPaymentReturnToken(
  number: string,
): Promise<string> {
  return sealData(proofSchema.parse({ purpose: "payment-return", number }), {
    password: getCheckoutSessionPassword(),
    ttl: TTL,
  });
}

export async function readPaymentReturnToken(
  token: string,
): Promise<string | null> {
  if (token.length > 2048) return null;
  const parsed = proofSchema.safeParse(
    await unsealData<unknown>(token, {
      password: getCheckoutSessionPassword(),
      ttl: TTL,
    }),
  );
  return parsed.success ? parsed.data.number : null;
}
