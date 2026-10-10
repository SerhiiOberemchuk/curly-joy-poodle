import type { B2bRequestField } from "./validation";

// A `"use server"` module may only export async functions, so state lives here.
// React resets a form after its action runs, so a rejected submission hands
// back what was typed: each field's default value restores it.
export interface B2bRequestState {
  status: "idle" | "error" | "sent";
  message: string;
  errors: Partial<Record<B2bRequestField, string>>;
  values?: Partial<Record<B2bRequestField, string>>;
}

export const initialB2bRequestState: B2bRequestState = {
  status: "idle",
  message: "",
  errors: {},
};
