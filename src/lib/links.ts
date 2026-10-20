/** Every locale the app ships; home and features are served in all of them. */
export const LOCALES = [
  "en", "es", "fr", "de", "pt", "ru", "tr", "ar", "ur", "hi",
  "bn", "mr", "ta", "te", "pcm", "id", "vi", "ja", "zh",
] as const;
export type Locale = (typeof LOCALES)[number];

/** Locales every page exists in. Other locales get only ALL_LOCALE_PATHS. */
export const SITE_LOCALES = ["en", "es"] as const satisfies readonly Locale[];
export type SiteLocale = (typeof SITE_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const RTL_LOCALES: readonly Locale[] = ["ar", "ur"];

/** Paths that exist in every Locale; every other path exists only in SITE_LOCALES. */
export const ALL_LOCALE_PATHS = ["/", "/features"] as const;

/** Each language in its own name, as the app's LANGUAGES[].nativeLabel. */
export const ENDONYMS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ru: "Русский",
  tr: "Türkçe",
  ar: "العربية",
  ur: "اردو",
  hi: "हिन्दी",
  bn: "বাংলা",
  mr: "मराठी",
  ta: "தமிழ்",
  te: "తెలుగు",
  pcm: "Naijá Píjin",
  id: "Bahasa Indonesia",
  vi: "Tiếng Việt",
  ja: "日本語",
  zh: "中文",
};

export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US", es: "es_US", fr: "fr_FR", de: "de_DE", pt: "pt_BR", ru: "ru_RU", tr: "tr_TR",
  ar: "ar_AR", ur: "ur_PK", hi: "hi_IN", bn: "bn_BD", mr: "mr_IN", ta: "ta_IN", te: "te_IN",
  pcm: "en_NG", id: "id_ID", vi: "vi_VN", ja: "ja_JP", zh: "zh_CN",
};

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

export function isSiteLocale(x: unknown): x is SiteLocale {
  return typeof x === "string" && (SITE_LOCALES as readonly string[]).includes(x);
}

function clean(path: string): string {
  return path === "/" ? "" : path.replace(/\/+$/, "");
}

export function localesFor(path: string): readonly Locale[] {
  const p = clean(path) || "/";
  return (ALL_LOCALE_PATHS as readonly string[]).includes(p) ? LOCALES : SITE_LOCALES;
}

export function hasPage(locale: Locale, path: string): boolean {
  return localesFor(path).includes(locale);
}

/**
 * "/features" for en, "/ja/features" for ja; "/" and "/ja" for home. No trailing
 * slash. A path that does not exist in `locale` resolves to its English URL.
 */
export function localePath(locale: Locale, path: string): string {
  const target = hasPage(locale, path) ? locale : DEFAULT_LOCALE;
  const p = clean(path);
  if (target === DEFAULT_LOCALE) return p || "/";
  return `/${target}${p}`;
}

/** Only the locales the page actually exists in. */
export function alternates(path: string): { locale: Locale; href: string }[] {
  return localesFor(path).map((locale) => ({ locale, href: localePath(locale, path) }));
}

export function dir(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}
