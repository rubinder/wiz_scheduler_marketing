import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const compare = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/compare" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    competitor: z.string(),
    competitorUrl: z.string().url(),
    checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    calculator: z.boolean().default(false),
    toolId: z.enum(["7shifts", "deputy", "homebase", "wheniwork"]).optional(),
    qualifier: z.string().optional(),
  }),
});

export const collections = { compare };
