import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { compareSchema } from "./lib/compareSchema";
import { guideSchema } from "./lib/guides";

const compare = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/compare" }),
  schema: compareSchema,
});

const guides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guides" }),
  schema: guideSchema,
});

export const collections = { compare, guides };
