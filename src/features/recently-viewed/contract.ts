import { z } from "zod";

export const VIEWED_PRODUCTS_LIMIT = 12;
export const VIEWED_PRODUCTS_KEY = "curly-joy-viewed-products";
export const viewedProductIdSchema = z.string().trim().min(1).max(128);
