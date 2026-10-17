import type { Locale } from "@/lib/i18n";

/** The offer as the buyer sees it: the shop's own copy around CRM figures. */
export interface WelcomeOffer {
  id: string;
  locale: Locale;
  revision: string;
  /** Line in the home section that invites the buyer to open the offer. */
  teaser: string;
  title: string;
  description: string;
  consentText: string;
}
export interface WelcomeOfferDialogCopy {
  open: string;
  close: string;
  eyebrow: string;
  hint: string;
  email: string;
  submit: string;
  pending: string;
}
export type OfferField = "email" | "consent";
export interface OfferState {
  status: "idle" | "error" | "sent";
  message: string;
  errors: Partial<Record<OfferField, string>>;
  values?: { email: string };
}
export const initialOfferState: OfferState = {
  status: "idle",
  message: "",
  errors: {},
};
