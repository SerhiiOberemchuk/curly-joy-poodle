import { z } from "zod";

const identifier = z.string().min(1);
const namedEntity = z.object({ id: identifier, name: z.string().nullable() });
const priceSchema = z.object({
  currency: z.string(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().nullable(),
});

export const crmProductSchema = priceSchema.extend({
  id: identifier,
  sku: z.string().nullable(),
  name: z.string().min(1),
  status: z.string(),
  storefrontVisible: z.boolean(),
  prices: z.array(priceSchema),
  stock: z.number().nullable(),
  availability: z.string(),
  productGroupId: z.string().nullable(),
  size: z.string().nullable(),
  color: z.string().nullable(),
  description: z.string().nullable(),
  descriptionHtml: z.string().nullable(),
  attributes: z.array(z.object({ name: z.string(), unit: z.string().nullable(), value: z.string() })),
  images: z.array(z.object({ url: z.url({ protocol: /^https?$/ }), alt: z.string().nullable() })),
  brand: namedEntity.nullable(),
  category: namedEntity.extend({ parentId: z.string().nullable() }).nullable(),
});
export const crmCategorySchema = z.object({
  id: identifier,
  name: z.string().min(1),
  slug: z.string().nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  parentId: z.string().nullable(),
});
export const crmCollectionSchema = z.object({
  id: identifier,
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  sortOrder: z.number(),
});
export const crmCollectionDetailSchema = crmCollectionSchema.extend({
  products: z.array(z.object({ id: identifier, name: z.string(), sku: z.string().nullable() })),
});
export const crmProductsPageSchema = z.object({
  data: z.array(crmProductSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    perPage: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  }),
});
export type CrmProduct = z.infer<typeof crmProductSchema>;
export type CrmCategory = z.infer<typeof crmCategorySchema>;
export type CrmCollection = z.infer<typeof crmCollectionSchema>;
export type CrmCollectionDetail = z.infer<typeof crmCollectionDetailSchema>;