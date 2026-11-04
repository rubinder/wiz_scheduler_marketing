import { z } from "astro/zod";
import { LOCALES, type Locale, isLocale } from "./links";

/** The one slug shape: scripts/check-guide-boundary.mjs enforces the same pattern on file names and `related`. */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertSlug(slug: string): void {
  if (!SLUG.test(slug)) throw new Error(`guide slug ${JSON.stringify(slug)} is not lowercase-hyphenated`);
}

function assertLocale(locale: string): asserts locale is Locale {
  if (!isLocale(locale)) throw new Error(`guide locale ${JSON.stringify(locale)} is not a site locale`);
}

/** Glob loader ids are `<locale>/<slug>`; anything else throws. */
export function splitId(id: string): { locale: Locale; slug: string } {
  const [locale, ...rest] = id.replace(/\.md$/, "").split("/");
  assertLocale(locale);
  if (rest.length !== 1) throw new Error(`guide ${JSON.stringify(id)} is not <locale>/<slug>`);
  assertSlug(rest[0]);
  return { locale, slug: rest[0] };
}

export function guidePath(locale: Locale, slug: string): string {
  assertLocale(locale);
  assertSlug(slug);
  return locale === "en" ? `/guides/${slug}` : `/${locale}/guides/${slug}`;
}

export function guideLocales(entries: { id: string }[], slug: string): Locale[] {
  assertSlug(slug);
  const have = new Set(entries.map((e) => splitId(e.id)).filter((e) => e.slug === slug).map((e) => e.locale));
  return LOCALES.filter((l) => have.has(l));
}

export function guideAlternates(entries: { id: string }[], slug: string): { locale: Locale; href: string }[] {
  return guideLocales(entries, slug).map((locale) => ({ locale, href: guidePath(locale, slug) }));
}

const DATE = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().startsWith(v), "not a real calendar date");
const TEXT = (max: number) => z.string().trim().min(1).max(max);

/**
 * Front matter of a guide. Strict: no URL-shaped or other extra fields. This is the looser layer
 * (it loads what the site can render); scripts/check-guide-boundary.mjs is the strict PR guard.
 */
export const guideSchema = z
  .object({
    title: TEXT(120),
    description: TEXT(300),
    targetKeyword: TEXT(120),
    sourceLocale: z.enum(LOCALES),
    publishedOn: DATE,
    updatedOn: DATE,
    related: z.array(z.string().regex(SLUG)).default([]),
  })
  .strict()
  .refine((g) => g.publishedOn <= g.updatedOn, { message: "publishedOn must not be after updatedOn", path: ["updatedOn"] });
