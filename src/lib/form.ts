/** Narrow helpers for reading `FormData`, which is always `unknown` at the edge. */

export function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function readInt(formData: FormData, name: string, fallback: number): number {
  const parsed = Number.parseInt(readString(formData, name), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
