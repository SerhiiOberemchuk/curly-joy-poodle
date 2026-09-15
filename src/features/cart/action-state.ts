/**
 * Lives outside `actions.ts` because a `"use server"` module may only export
 * async functions.
 */
export interface CartActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export const initialCartActionState: CartActionState = { status: "idle", message: "" };
