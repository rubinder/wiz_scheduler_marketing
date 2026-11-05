import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { guideSchema } from "./lib/guides";

const compare = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/compare" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    competitor: z.string(),
    competitorUrl: z.string().url(),
    checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guides" }),
  schema: guideSchema,
});

export const collections = { compare, guides };
