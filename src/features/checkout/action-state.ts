import type { FieldErrors } from "./validation";

/** A `"use server"` module may only export async functions, so state lives here. */
export interface CheckoutActionState {
  status: "idle" | "error";
  message: string;
  errors: FieldErrors;
}

export const initialCheckoutState: CheckoutActionState = {
  status: "idle",
  message: "",
  errors: {},
};
