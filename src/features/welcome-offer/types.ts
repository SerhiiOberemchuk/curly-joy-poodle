export interface WelcomeOffer {
  id: string;
  title: string;
  description: string;
}
export type OfferField = "email" | "phone" | "consent";
export interface OfferState {
  status: "idle" | "error" | "sent";
  message: string;
  errors: Partial<Record<OfferField, string>>;
  values?: { email: string; phone: string; consent: string };
}
export const initialOfferState: OfferState = {
  status: "idle",
  message: "",
  errors: {},
};
