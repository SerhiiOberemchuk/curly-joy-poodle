import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { crmRequest, CrmApiError } from "@/lib/crm-client";
import { readString } from "@/lib/form";
import { defaultLocale, hasLocale, type Locale } from "@/lib/i18n";
import { CURRENCY, formatMoney } from "@/lib/money";
import { visitorHeaders } from "@/lib/visitor";
import { welcomeOfferCopy, type OfferFigures } from "./copy";
import type { WelcomeOffer, OfferState } from "./types";

// The CRM's numeric(12,2) columns arrive as decimal strings.
const decimalSchema = z
  .string()
  .regex(/^\d{1,10}(\.\d{1,2})?$/)
  .transform(Number);

// Only the figures: the campaign's own title, terms and consent are internal
// CRM copy in one language, so the shop writes its own texts around them.
const offerSchema = z.object({
  data: z.object({
    campaignId: z.string().min(1),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: decimalSchema,
    currency: z.string(),
    maxDiscountAmount: decimalSchema.nullable(),
    minimumAmount: decimalSchema.nullable(),
    codeLifetimeHours: z.int().positive(),
    endsAt: z.iso.datetime({ offset: true }).nullable(),
    emailLocales: z.array(z.string()),
  }),
});
type CrmOffer = z.infer<typeof offerSchema>["data"];

const money = (amount: number) => formatMoney(Math.round(amount * 100));

function formatFigures(offer: CrmOffer, locale: Locale): OfferFigures {
  const hours = offer.codeLifetimeHours;
  const days = hours % 24 === 0;
  const percent = offer.discountType === "percent";
  return {
    discount: percent
      ? new Intl.NumberFormat(locale, {
          style: "percent",
          maximumFractionDigits: 2,
        }).format(offer.discountValue / 100)
      : money(offer.discountValue),
    maxDiscount:
      percent && offer.maxDiscountAmount !== null
        ? money(offer.maxDiscountAmount)
        : null,
    minimum:
      offer.minimumAmount === null ? null : money(offer.minimumAmount),
    lifetime: new Intl.NumberFormat(locale, {
      style: "unit",
      unit: days ? "day" : "hour",
      unitDisplay: "long",
    }).format(days ? hours / 24 : hours),
    // The campaign end is an exact instant, so the time is shown too.
    endsAt: offer.endsAt
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "Europe/Kyiv",
        }).format(new Date(offer.endsAt))
      : null,
  };
}

async function readOffer(
  locale: Locale,
): Promise<{ offer: WelcomeOffer; emailLocale: Locale | null } | null> {
  const id = process.env.WELCOME_OFFER_CAMPAIGN_ID?.trim();
  if (
    process.env.WELCOME_OFFER_ENABLED !== "true" ||
    !id ||
    !process.env.OBRIYM_CRM_API_KEY
  )
    return null;
  try {
    const { data } = offerSchema.parse(
      await crmRequest(`/promotions/${encodeURIComponent(id)}/capture`),
    );
    // The cart is priced in the shop currency; another one could never apply.
    if (data.campaignId !== id || data.currency !== CURRENCY) return null;
    const copy = welcomeOfferCopy[locale];
    const figures = formatFigures(data, locale);
    const title = copy.offer.title(figures);
    const description = copy.offer.terms(figures);
    const consentText = copy.offer.consent;
    return {
      offer: {
        id,
        locale,
        revision: createHash("sha256")
          .update(JSON.stringify([locale, title, description, consentText]))
          .digest("hex"),
        teaser: copy.section.offer(figures),
        title,
        description,
        consentText,
      },
      // Without the shop's language the CRM writes in the workspace's own.
      emailLocale: data.emailLocales.includes(locale) ? locale : null,
    };
  } catch {
    return null;
  }
}

export async function getWelcomeOffer(
  locale: Locale,
): Promise<WelcomeOffer | null> {
  return (await readOffer(locale))?.offer ?? null;
}

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(120));
const acceptedSchema = z.object({
  data: z.object({ status: z.literal("accepted") }),
});

export async function submitOfferRequest(
  formData: FormData,
): Promise<{ state: OfferState; stale?: boolean }> {
  const email = readString(formData, "email");
  const requested = readString(formData, "locale");
  const locale = hasLocale(requested) ? requested : defaultLocale;
  const { messages } = welcomeOfferCopy[locale];
  const fail = (message: string): OfferState => ({
    status: "error",
    message,
    errors: {},
    values: { email },
  });
  const current = await readOffer(locale);
  if (!current || readString(formData, "offerId") !== current.offer.id)
    return { state: fail(messages.unavailable) };
  const { offer, emailLocale } = current;
  // The buyer agrees only to the terms on screen; the refresh shows the new ones.
  if (readString(formData, "offerRevision") !== offer.revision)
    return { state: fail(messages.changed), stale: true };
  if (readString(formData, "website"))
    return { state: fail(messages.rejected) };
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { state: fail(messages.invalidEmail) };
  if (readString(formData, "consent") !== "on")
    return { state: fail(messages.consentRequired) };
  try {
    // The CRM answers every eligible, repeat and ineligible address identically
    // and mails the code itself, so the shop never learns who already bought.
    acceptedSchema.parse(
      await crmRequest(
        `/promotions/${encodeURIComponent(offer.id)}/capture`,
        {
          email: parsed.data,
          consent: true,
          // Stored as the consent record: exactly the text the buyer accepted.
          consentText: offer.consentText,
          ...(emailLocale ? { locale: emailLocale } : {}),
        },
        await visitorHeaders(),
      ),
    );
    return { state: { status: "sent", message: messages.sent, errors: {} } };
  } catch (error) {
    if (error instanceof CrmApiError && error.status === 429)
      return { state: fail(messages.throttled) };
    if (error instanceof CrmApiError && error.status === 404)
      return { state: fail(messages.unavailable) };
    return { state: fail(messages.failed) };
  }
}
