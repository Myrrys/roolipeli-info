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
  publisher_id: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().uuid().nullable().optional(),
  ),
  product_type: ProductTypeEnum.default('Other'),
  year: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    return Number.isNaN(num) ? val : num;
  }, z.number().int().min(1900).max(2100).nullable().optional()),
  isbn: z.string().max(20).nullable().optional(),
  description: z.string().nullable().optional(),
  lang: ProductLangEnum.default('fi'),
  cover_image_path: z.string().nullable().optional(),
});

export const ProductCreatorSchema = z.object({
  product_id: z.string().uuid(),
  creator_id: z.string().uuid(),
  role: z.string().min(1).max(100),
});

export const ReferenceTypeEnum = z.enum(['official', 'source', 'review', 'social']);

export const CitationDetailsSchema = z.object({
  author: z.string().optional(),
  published_date: z.string().optional(),
  publication_name: z.string().optional(),
  language: z.enum(['fi', 'sv', 'en']).optional(),
});

export const ProductReferenceSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  product_id: z.string().uuid(),
  reference_type: ReferenceTypeEnum,
  label: z.string().min(1).max(255),
  url: z.string().url(),
  citation_details: CitationDetailsSchema.nullable().optional(),
});

export const SemanticLabelSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  label: z.string().min(1).max(255),
  wikidata_id: z
    .string()
    .regex(/^Q\d+$/, 'Wikidata ID must be in format Q followed by numbers (e.g., Q4686479)'),
  description: z.string().nullable().optional(),
});

export const ProductSemanticLabelSchema = z.object({
  product_id: z.string().uuid(),
  label_id: z.string().uuid(),
  idx: z.number().int().default(0),
});

export const ProductIsbnSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  product_id: z.string().uuid(),
  isbn: z.string().min(10).max(20),
  label: z.string().min(1).max(100),
});

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().max(100).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Composite schema for creating a product with nested relations.
 * Shared between ProductForm.svelte (client validation) and API routes (server validation).
 * Omits server-managed fields (id, created_at). cover_image_path is kept (nullable/optional)
 * so the API can accept it — FileUpload manages it outside Zod on the client side.
 */
export const ProductFormCreateSchema = ProductSchema.omit({
  id: true,
  created_at: true,
}).extend({
  creators: z
    .array(
      z.object({
        creator_id: z.string().uuid(),
        role: z.string().min(1).max(100),
      }),
    )
    .optional(),
  labels: z
    .array(
      z.object({
        label_id: z.string().uuid(),
      }),
    )
    .optional(),
  references: z
    .array(
      z.object({
        reference_type: ReferenceTypeEnum,
        label: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .optional(),
  isbns: z
    .array(
      z.object({
        isbn: z.string().min(1),
        label: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

/**
 * Composite schema for updating a product with nested relations.
 * All fields are optional (partial update support).
 */
export const ProductFormUpdateSchema = ProductFormCreateSchema.partial();

/**
 * Inferred Types
 */
export type Publisher = z.infer<typeof PublisherSchema>;
export type Creator = z.infer<typeof CreatorSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductCreator = z.infer<typeof ProductCreatorSchema>;
export type ProductType = z.infer<typeof ProductTypeEnum>;
export type ProductLang = z.infer<typeof ProductLangEnum>;
export type ProductReference = z.infer<typeof ProductReferenceSchema>;
export type CitationDetails = z.infer<typeof CitationDetailsSchema>;
export type SemanticLabel = z.infer<typeof SemanticLabelSchema>;
export type ProductSemanticLabel = z.infer<typeof ProductSemanticLabelSchema>;
export type ProductIsbn = z.infer<typeof ProductIsbnSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ProductFormCreate = z.infer<typeof ProductFormCreateSchema>;
export type ProductFormUpdate = z.infer<typeof ProductFormUpdateSchema>;
