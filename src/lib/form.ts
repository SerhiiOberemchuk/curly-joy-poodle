import { z } from "zod";

const integerSchema = z.string().regex(/^-?\d+$/).transform(Number).pipe(z.int());

export function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Missing, fractional, partial and unsafe values are refused instead of becoming a default quantity. */
export function readInt(formData: FormData, name: string): number | null {
  const parsed = integerSchema.safeParse(readString(formData, name));
  return parsed.success ? parsed.data : null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}