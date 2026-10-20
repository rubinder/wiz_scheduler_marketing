# Home and features in the app's 19 locales

**Date:** 2026-10-20
**Branch:** `feat/home-features-19-locales`
**Depends on:** a small `wiz_scheduler` PR that translates the homepage and features strings still in English (§7)
**Status:** Design agreed in conversation; written spec awaiting review

## Goal

The home page (`/`) and `/features` are offered in the same 19 locales as
the app. A visitor who prefers one of those languages lands on a page in
it, and search engines index each language version.

Every other page stays English and Spanish only. Those pages are pricing,
about, contact, the NYC Fair Workweek page, the free schedule checker, the
7shifts comparison and the legal pages.

## Locales

| Code | Language | Script | Direction |
|------|----------|--------|-----------|
| en | English | Latin | ltr |
| es | Español | Latin | ltr |
| fr | Français | Latin | ltr |
| de | Deutsch | Latin | ltr |
| pt | Português | Latin | ltr |
| ru | Русский | Cyrillic | ltr |
| tr | Türkçe | Latin | ltr |
| ar | العربية | Arabic | **rtl** |
| ur | اردو | Arabic | **rtl** |
| hi | हिन्दी | Devanagari | ltr |
| bn | বাংলা | Bengali | ltr |
| mr | मराठी | Devanagari | ltr |
| ta | தமிழ் | Tamil | ltr |
| te | తెలుగు | Telugu | ltr |
| pcm | Naijá | Latin | ltr |
| id | Bahasa Indonesia | Latin | ltr |
| vi | Tiếng Việt | Latin | ltr |
| ja | 日本語 | Japanese | ltr |
| zh | 中文 | Han | ltr |

The codes and their order match `wiz_scheduler/frontend/src/i18n/`.

## Background

- **Pages:** `src/pages/index.astro` and `src/pages/es/index.astro` render
  `views/Home.astro` with a `locale` prop. `/features` works the same way
  through `views/Features.astro`. Every page has a copy under
  `src/pages/es/`.
- **Text:** most text on the two pages comes from `src/i18n/generated/`,
  which `scripts/port-copy.mjs` builds from the app's locale files. The
  keys are `landing.*`, `features.*`, `common.appName`, `login.signIn`,
  `register.registerBtn` and `gdpr.*`. The script reads only `en` and `es`
  today.
- **Site-only text:** written by hand in `src/i18n/en.ts` and `es.ts`. The
  two pages and the shared navigation and footer use these keys:
  - `nav.*`: 7 strings
  - `home.*`: 15 strings, such as section eyebrows, meter tags and hero
    grid labels
- **Locale type:** `src/lib/links.ts` defines `LOCALES = ["en", "es"]`,
  `localePath`, `alternates` and `isLocale`. `Nav`, `Footer`, `Seo`, `Base`
  and every view take a `Locale`.
- **Already in place:**
  - `tests/logical-direction.test.ts` enforces logical Tailwind utilities.
  - `tests/locale-parity.test.ts` checks that `en` and `es` have the same
    keys, with none empty.

## 1. Locale model (`src/lib/links.ts`)

```ts
export const LOCALES = ["en", "es", "fr", "de", "pt", "ru", "tr", "ar", "ur", "hi",
  "bn", "mr", "ta", "te", "pcm", "id", "vi", "ja", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const SITE_LOCALES = ["en", "es"] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE: Locale = "en";
export const RTL_LOCALES: readonly Locale[] = ["ar", "ur"];

/** Paths that exist in every Locale; every other path exists only in SITE_LOCALES. */
export const ALL_LOCALE_PATHS = ["/", "/features"] as const;

export function localesFor(path: string): readonly Locale[];
export function hasPage(locale: Locale, path: string): boolean;
export function localePath(locale: Locale, path: string): string;
export function alternates(path: string): { locale: Locale; href: string }[];
export function dir(locale: Locale): "ltr" | "rtl";
```

- **`localePath`:** when `hasPage(locale, path)` is false, it returns the
  English path. For example, `localePath("ja", "/terms")` returns `"/terms"`
  and `localePath("ja", "/features")` returns `"/ja/features"`.
- **`alternates(path)`:** returns only `localesFor(path)`. The pages that
  stay en/es keep exactly the two `hreflang` links they have today.
- **The 404 page and site-only views:** they keep accepting only the
  locales they render. Typing their prop as `Locale` is fine, because the
  only routes that render them are en/es.

## 2. Routes

- **New files:**
  - `src/pages/[locale]/index.astro`
  - `src/pages/[locale]/features.astro`
- **Generated pages:** each file's `getStaticPaths` returns every locale
  except `en`. That is 18 pages per file, Spanish included.
- **Removed:** `src/pages/es/index.astro` and `src/pages/es/features.astro`,
  so the Spanish home and features pages have one source.
- **Unchanged:** the other `src/pages/es/*` files. Astro ranks static
  routes above dynamic ones, so `/es/terms` and the rest keep working.
- **URLs:** `/ja`, `/ja/features`, `/ar`, `/ar/features` and so on. No
  trailing slash, matching `trailingSlash: "never"`.
- **`astro.config` changes:**
  - `i18n.locales` lists all 19.
  - The sitemap's `i18n.locales` maps each code to its `hreflang` value.
  - The home-page priority rule matches every locale's home URL, not only
    `/` and `/es`.

## 3. Text

- **`port-copy.mjs`:** `LOCALES` becomes all 19, and it writes
  `src/i18n/generated/<locale>.ts` for each.
- **Site-only text** splits in two:
  - `src/i18n/chrome/<locale>.ts`, for all 19 locales: `nav.*` (with
    `language` and an endonym list replacing `english`/`spanish`) and
    `home.*`.
  - The existing `en.ts` and `es.ts` keep the en/es-only sections
    (`nyc`, `checker`, `compare`, `legal`, `notFound`) and spread
    `chrome/<locale>` in.
- **Copy types:**
  - `getCopy(locale)` returns `HomeCopy` (generated plus chrome) for any
    locale.
  - `getSiteCopy(locale: SiteLocale)` returns the full `Copy` used by the
    pages that stay en/es.
- **Translations:** the 20 chrome strings (5 `nav.*` labels and 15 `home.*` strings; the language endonyms are the same in every locale) in each of the 17 new locales are
  translated by Claude. They follow the tone of the app's existing
  translations and are checked against that locale's `landing.*`
  terminology, such as how it already says "schedule" and "shift".
- **Numbers and prices** stay as they are in the views (`"$10 · $25 · $50"`,
  `"0.5 GB"`). They aren't translated.

## 4. Right-to-left (ar, ur)

- **Layout:** `Base.astro` sets `<html lang={locale} dir={dir(locale)}>`.
- **Styling:** `tests/logical-direction.test.ts` already forbids physical
  utilities. The work is checking the components that have only ever been
  seen left-to-right:
  - the `RotaHero` grid
  - the features table of contents (`border-s-2`)
  - the meter cards
  - arrows inside strings, such as `→` in `landing.exploreDashboard`
- **Arrows:** a directional arrow that the view itself renders is mirrored
  with `rtl:` or by a `dir`-aware glyph. An arrow inside a translated
  string is the translator's choice; Arabic and Urdu text uses `←`.

## 5. Language switcher (`Nav.astro`)

- **Control:** a `<details>`/`<summary>` menu replaces the EN/ES pills. It
  needs no JavaScript, and the site already ships without any outside its
  islands.
  - The summary shows the current locale's endonym.
  - The list shows each available locale's endonym, with
    `lang`/`hreflang` set.
- **Available locales:** `localesFor(path)`, so pages that stay en/es list
  English and Español only.
- **Fit:** the menu opens toward the inline end and must fit at 320px
  width without horizontal scroll.

## 6. Search engines and metadata (`Seo.astro`)

- **`hreflang`:** `<link rel="alternate">` for each locale in
  `localesFor(path)`. `x-default` stays English.
- **`og:locale`:** one map covers all 19:

  | Code | Value | Code | Value |
  |------|-------|------|-------|
  | en | en_US | bn | bn_BD |
  | es | es_US | mr | mr_IN |
  | fr | fr_FR | ta | ta_IN |
  | de | de_DE | te | te_IN |
  | pt | pt_BR | pcm | en_NG |
  | ru | ru_RU | id | id_ID |
  | tr | tr_TR | vi | vi_VN |
  | ar | ar_AR | ja | ja_JP |
  | ur | ur_PK | zh | zh_CN |
  | hi | hi_IN | | |

- **Sitemap:** lists all 19 versions of `/` and `/features`, each with its
  alternates.

## 7. Prerequisite: finish the app's translations (`wiz_scheduler` PR)

- **The gap:** in 16 locales, 11 `landing.*` strings are still identical to
  English:
  - `exploreDashboard`, `demoTitle`, `demoDesc`, `demoFallback`
  - `featHourCapsTitle`, `featHourCapsDesc`
  - `featDayRulesTitle`
  - `featDeputyTitle`, `featDeputyDesc`
  - `inputHourRestrictionsTitle`, `inputAssociationTitle`
- **Nigerian Pidgin:** 57 strings match English. Each one is reviewed, and
  only those that aren't natural Pidgin are changed.
- **Not changed:** `exampleSchedulesCost` and `exampleEmployeesCost` are
  numbers and stay as they are.
- **Order:** the app PR lands first, then this branch runs
  `npm run port:copy` against it.
- **Test:** an app-side test fails when a `landing.*` or `features.*`
  string longer than 12 characters is identical to English. An allowlist
  covers the numeric strings and the Pidgin strings that were deliberately
  kept.

## 8. Fonts

- **Coverage:** Archivo and Source Sans 3 cover Latin, Cyrillic and
  Vietnamese only.
- **Other scripts:** Arabic, Devanagari, Bengali, Tamil, Telugu, Japanese
  and Chinese render in the system fallback.
- **Fallback stack:** the Tailwind `fontFamily` stacks gain a system
  fallback (`system-ui, sans-serif`) after the brand fonts, so the browser
  picks the platform's font for each script.
- **Out of scope:** self-hosting Noto fonts, which would add several MB per
  script. That is a follow-up if the look matters.

## 9. Testing

- **`tests/locale-parity.test.ts`:**
  - Every `chrome/<locale>` and `generated/<locale>` has the same keys as
    English, with none empty.
  - `en.ts` and `es.ts` keep their full-site parity check.
- **`tests/links.test.ts`:**
  - `localePath` falls back to English for paths outside
    `ALL_LOCALE_PATHS`.
  - `alternates` returns 19 links for `/` and `/features` and 2 for
    `/terms`.
  - `dir` returns `"rtl"` for `ar` and `ur` only.
- **Build check:** a test runs after `astro build` and reads `dist/`:
  - 19 home pages and 19 features pages exist.
  - Each has the right `lang`, the right `dir`, and 19 `hreflang` links
    plus `x-default`.
  - `/ja/terms` does not exist, and a `ja` page's footer links to `/terms`.
- **Manual check in a browser:**
  - `/ar` and `/ar/features` at 1280px and 375px.
  - One non-Latin left-to-right locale (`/ja`).
  - The language menu on a home page and on an en/es-only page.

## Out of scope

- Translating the pages that stay en/es (pricing, about, contact, NYC,
  checker, compare, legal).
- Self-hosted fonts for non-Latin scripts.
- Detecting the browser language to redirect from `/`.
- Search Console submission of the new URLs, which needs the account
  owner.
