"use server";

import { z } from "zod";
import { getNpCities, getNpStreets, getNpWarehouses } from "./crm";
import { carrierRefSchema, warehouseSearchSchema } from "./validation";

const querySchema = z.string().trim().min(2).max(120);
const streetQuerySchema = z.object({
  cityRef: carrierRefSchema,
  query: querySchema,
});
const warehouseQuerySchema = z.object({
  cityRef: carrierRefSchema,
  query: warehouseSearchSchema,
});
const LOOKUP_FAILED =
  "Не вдалося завантажити довідник Нової пошти. Спробуйте ще раз.";

export async function searchCitiesAction(query: string) {
  const parsed = querySchema.safeParse(query);
  if (!parsed.success)
    return { ok: false as const, error: "Введіть від 2 до 120 символів." };
  try {
    return { ok: true as const, data: await getNpCities(parsed.data) };
  } catch {
    return { ok: false as const, error: LOOKUP_FAILED };
  }
}

/** One page of the city's points matching what the buyer typed, and how many match in all. */
export async function searchWarehousesAction(cityRef: string, query: string) {
  const parsed = warehouseQuerySchema.safeParse({ cityRef, query });
  if (!parsed.success)
    return { ok: false as const, error: "Оберіть населений пункт." };
  try {
    return {
      ok: true as const,
      data: await getNpWarehouses(parsed.data.cityRef, parsed.data.query),
    };
  } catch {
    return { ok: false as const, error: LOOKUP_FAILED };
  }
}

export async function searchStreetsAction(cityRef: string, query: string) {
  const parsed = streetQuerySchema.safeParse({ cityRef, query });
  if (!parsed.success)
    return {
      ok: false as const,
      error: "Оберіть населений пункт і введіть назву вулиці.",
    };
  try {
    return {
      ok: true as const,
      data: await getNpStreets(parsed.data.cityRef, parsed.data.query),
    };
  } catch {
    return { ok: false as const, error: LOOKUP_FAILED };
  }
}
