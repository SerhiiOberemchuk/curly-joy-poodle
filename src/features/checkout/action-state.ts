import type { FieldErrors } from "./validation";

/** A `"use server"` module may only export async functions, so state lives here. */
export interface CheckoutActionState {
  status: "idle" | "error";
  message: string;
  errors: FieldErrors;
  /** The form token was refused: the browser drops its stored copy. */
  tokenRejected?: true;
}

export const initialCheckoutState: CheckoutActionState = {
  status: "idle",
  message: "",
  errors: {},
};
