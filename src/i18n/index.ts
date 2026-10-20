import en, { type Copy } from "./en";
import es from "./es";
import { HOME_COPY, type HomeCopy } from "./home";
import type { Locale, SiteLocale } from "../lib/links";

const SITE: Record<SiteLocale, Copy> = { en, es };

/** Copy for home, features, the nav and the footer, in any of the 19 locales. */
export function getCopy(locale: Locale): HomeCopy {
  return HOME_COPY[locale];
}

/** Full copy for pages that exist only in en/es. */
export function getSiteCopy(locale: SiteLocale): Copy {
  return SITE[locale];
}

export type { Copy, HomeCopy };
