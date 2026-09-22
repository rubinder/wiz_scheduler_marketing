import en, { type Copy } from "./en";
import es from "./es";
import type { Locale } from "../lib/links";

const COPY: Record<Locale, Copy> = { en, es };

export function getCopy(locale: Locale): Copy {
  return COPY[locale];
}

export type { Copy };
