import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(1).max(255),
    summary: z.string().min(1).max(500),
    lang: z.enum(['fi', 'sv', 'en']).default('fi'),
    draft: z.boolean().default(false),
    publishedAt: z.coerce.date(),
    authorName: z.string().optional(),
  }),
});

export const collections = { articles };
