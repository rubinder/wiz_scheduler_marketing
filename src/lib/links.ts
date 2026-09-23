export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

/** "/features" for en, "/es/features" for es; "/" and "/es" for home. No trailing slash. */
export function localePath(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : path.replace(/\/+$/, "");
  if (locale === DEFAULT_LOCALE) return clean || "/";
  return `/${locale}${clean}`;
}

export function alternates(path: string): { locale: Locale; href: string }[] {
  return LOCALES.map((locale) => ({ locale, href: localePath(locale, path) }));
}
