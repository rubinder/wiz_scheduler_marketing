import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { compareSchema } from "./lib/compareSchema";

const compare = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/compare" }),
  schema: compareSchema,
});

export const collections = { compare };
