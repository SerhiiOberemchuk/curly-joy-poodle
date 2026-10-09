import { z } from "zod";

const cartRuleSchema = z.object({
  currency: z.string(),
  freeShippingThreshold: z.number().nonnegative().nullable(),
  minOrderAmount: z.number().nonnegative().nullable(),
});
const capabilitySchema = z.object({
  key: z.string(),
  status: z.string(),
  paymentLink: z.boolean().optional(),
  modes: z.array(z.string()).optional(),
});
export const capabilitiesSchema = z.object({
  cart: cartRuleSchema.extend({ byCurrency: z.array(cartRuleSchema) }),
  payments: z.array(capabilitySchema),
  shipping: z.array(capabilitySchema),
});
export type CrmCapabilities = z.infer<typeof capabilitiesSchema>;

export const npCitySchema = z.object({
  ref: z.uuid(),
  settlementRef: z.uuid(),
  label: z.string(),
});
export const npWarehouseSchema = z.object({
  ref: z.uuid(),
  label: z.string(),
  number: z.string(),
});
export const npStreetSchema = z.object({ ref: z.uuid(), label: z.string() });
export type NpCity = z.infer<typeof npCitySchema>;
export type NpWarehouse = z.infer<typeof npWarehouseSchema>;
export type NpStreet = z.infer<typeof npStreetSchema>;

const moneySchema = z.string().regex(/^\d+(\.\d{1,2})?$/).refine(
  (value) => Number.isSafeInteger(Math.round(Number(value) * 100)),
  "Amount exceeds the safe minor-unit range",
);
export const crmOrderSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  number: z.string().nullable(),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  currency: z.string(),
  totalAmount: moneySchema,
  payments: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      amount: moneySchema,
      currency: z.string(),
      refundedAmount: moneySchema.nullable(),
      createdAt: z.iso.datetime(),
    }),
  ),
  shipments: z.array(
    z.object({
      id: z.string(),
      carrier: z.string(),
      trackingNumber: z.string().nullable(),
      status: z.string(),
    }),
  ),
});
export type CrmOrder = z.infer<typeof crmOrderSchema>;

export const paymentLinkSchema = z.object({
  checkoutUrl: z.url(),
  paymentId: z.string(),
  provider: z.string().nullable(),
  returnUrl: z.string().nullable(),
  expiresAt: z.iso.datetime().nullable(),
});
export type CrmPaymentLink = z.infer<typeof paymentLinkSchema>;
export const orderAcceptedSchema = z.object({
  id: z.string(),
  number: z.string().nullable(),
});
