/**
 * Newsletter consent at checkout, sent to the CRM as `customer.marketingConsent`
 * (`{ email?, sms?, text? }`, strict). The CRM records each channel it receives
 * on the buyer's contact with the text as proof of what was agreed to.
 *
 * Only a ticked box is ever sent. An absent field means «not asked», so an
 * unticked box must not withdraw a consent given elsewhere — never `email: false`.
 */

/** The exact label the buyer sees; stored as proof, so it is one constant. */
export const MARKETING_CONSENT_TEXT =
  "Хочу отримувати новини та пропозиції Curly Joy на email";

/**
 * The CRM schema is strict and not yet deployed everywhere, so the whole
 * feature (checkbox and payload) stays off until the flag is `true`.
 */
export function marketingConsentEnabled(
  flag: string | undefined = process.env.CRM_SEND_MARKETING_CONSENT,
): boolean {
  return flag === "true";
}

export interface CrmMarketingConsent {
  email: true;
  text: string;
}

export function marketingConsentPayload(
  checked: boolean,
  enabled: boolean,
): CrmMarketingConsent | undefined {
  if (!enabled || !checked) return undefined;
  return { email: true, text: MARKETING_CONSENT_TEXT };
}
