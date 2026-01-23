import { z } from 'zod';

/**
 * Enums matching Database Types
 */
export const ProductTypeEnum = z.enum([
  'Core Rulebook',
  'Adventure',
  'Supplement',
  'Zine',
  'Quickstart',
  'Other',
]);

export const ProductLangEnum = z.enum(['fi', 'sv', 'en']);

/**
 * Core Entity Schemas
 */

export const PublisherSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().nullable().optional(),
});

export const CreatorSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/),
});

export const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  title: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/),
  publisher_id: z.string().uuid().nullable().optional(),
  product_type: ProductTypeEnum.default('Other'),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  isbn: z.string().max(20).nullable().optional(),
  description: z.string().nullable().optional(),
  lang: ProductLangEnum.default('fi'),
});

export const ProductCreatorSchema = z.object({
  product_id: z.string().uuid(),
  creator_id: z.string().uuid(),
  role: z.string().min(1).max(100),
});

/**
 * Inferred Types
 */
export type Publisher = z.infer<typeof PublisherSchema>;
export type Creator = z.infer<typeof CreatorSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductCreator = z.infer<typeof ProductCreatorSchema>;
export type ProductType = z.infer<typeof ProductTypeEnum>;
export type ProductLang = z.infer<typeof ProductLangEnum>;
