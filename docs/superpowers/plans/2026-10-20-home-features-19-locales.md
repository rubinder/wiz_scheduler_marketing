# Home and Features in 19 Locales — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve `/` and `/features` of the marketing site in the app's 19 locales, while every other page stays English and Spanish.

**Architecture:**
- **Locale model:** `src/lib/links.ts` owns two locale sets: all 19, and the en/es "site" set. Path-aware helpers (`localesFor`, `localePath` with an English fallback, `alternates`, `dir`) live there too.
- **Routes:** two dynamic routes (`src/pages/[locale]/index.astro` and `[locale]/features.astro`) generate the 18 non-English versions.
- **Text:** the home and features text comes from the app repo via `port-copy.mjs`. The few site-only strings the two pages and the shared chrome need move into `src/i18n/chrome/<locale>.ts`.
- **Prerequisite:** Task 1 finishes the app's own translations first.

**Tech Stack:**
- **Marketing site:** Astro 7, Tailwind 3, TypeScript, vitest; Node 24 (`.nvmrc`).
- **App frontend:** React and vitest in `wiz_scheduler/frontend`.

**Spec:** `docs/superpowers/specs/2026-10-20-home-features-19-locales-design.md` (marketing repo)

## Global Constraints

**Locale codes and order:**
- **Order:** `en, es, fr, de, pt, ru, tr, ar, ur, hi, bn, mr, ta, te, pcm, id, vi, ja, zh`.
- **Right-to-left:** `ar` and `ur` only.
- **Pages in all 19 locales:** exactly `/` and `/features`.
- **Pages that stay en/es:** every other page. A link to one of them from a page in another locale goes to the English URL.

**URLs and metadata:**
- **URLs:** no trailing slash (`trailingSlash: "never"`). English is unprefixed (`/`, `/features`); every other locale is prefixed (`/ja`, `/ja/features`).
- **`x-default`:** stays English.

**Dependencies and styling:**
- **No new dependencies** in either repo.
- **Styling:** logical Tailwind utilities only (`ms-`, `pe-`, `border-s`, `start-0`, `end-0`, `text-start`). `tests/logical-direction.test.ts` enforces this.

**Text and translation:**
- **Generated files:** `src/i18n/generated/*.ts` are generated. Never edit them by hand; change the app repo and rerun `npm run port:copy`.
- **Endonyms:** each language name is the app's `nativeLabel` from `wiz_scheduler/frontend/src/i18n/types.ts`. Pidgin is `Naijá Píjin`.
- **Not translated:** prices and numbers in the views (`"$10 · $25 · $50"`, `"0.5 GB"`, `"$0.10 / 25"`).
- **Arrows in Arabic and Urdu:** a "next/forward" arrow in an `ar` or `ur` string is `←`, not `→`.

**Process:**
- **Repos:** the app repo is `/Users/robran/IdeaProjects/wiz_scheduler`; the marketing repo is `/Users/robran/IdeaProjects/wiz_scheduler_marketing`.
- **Git:** never commit to `main` in either repo. Work goes on a branch, then a PR, then CI (see each repo's `CLAUDE.md`).
- **Shared app checkout:** has uncommitted edits in `backend/main.py`, `backend/routers/manager_locations.py` and `tests/conftest.py` that belong to the user. Never touch, stage or stash them. Task 1 works in a separate git worktree for this reason.
- **Marketing `main`:** has 2 unpushed local commits (a fix and its revert). Leave them alone. The marketing branch `feat/home-features-19-locales` already exists, branched from `origin/main`, and holds the spec commit.

## Review Focus

1. **A Japanese visitor clicks a footer or nav link to a page that stays en/es** (NYC, checker, compare, legal). They should land on the English page, not a 404. Pinned by Task 2's `localePath` tests and Task 6's `/ja` footer assertion.
2. **An Arabic visitor opens `/ar`.** The page should read right-to-left, with the language menu opening toward the inline end and nothing overflowing at 375px. Pinned by Task 6's `dir` assertion and Task 7's browser check.
3. **A page that stays en/es offers only English and Español** in its language menu and its `hreflang` tags, never 19 dead links. Pinned by Task 2's `alternates("/terms")` test and Task 6's `/es/terms` assertion.
4. **The Spanish home and features pages keep their URLs** (`/es`, `/es/features`) after their static files are deleted in favour of the dynamic route. Pinned by Task 6, which checks every locale's home and features page exists.
5. **A homepage string untranslated in some locale ships as English mid-page.** Pinned by Task 1's app test and Task 3's parity test, which also rejects missing and empty strings.

---

### Task 1: Finish the app's homepage and features translations (`wiz_scheduler`)

**Where:** the app repo. Work in a new worktree so the shared checkout's uncommitted edits are never touched.

**Files:**
- Create: `frontend/src/i18n/landingTranslated.test.ts`
- Modify: `frontend/src/i18n/{ar,bn,de,fr,hi,id,ja,mr,pcm,pt,ru,ta,te,tr,ur,vi,zh}.ts`, in the `landing` section only

**Interfaces:**
- Produces: app locale files whose `landing.*` and `features.*` strings are all translated. Task 3 reads them through `APP_REPO=/Users/robran/IdeaProjects/wiz_scheduler_i18n`.

- [ ] **Step 1: Create the worktree and install**

```bash
cd /Users/robran/IdeaProjects/wiz_scheduler
git fetch origin
git worktree add ../wiz_scheduler_i18n -b fix/landing-translations origin/main
cd ../wiz_scheduler_i18n/frontend && npm ci
```

- [ ] **Step 2: Write the failing test**

Create `frontend/src/i18n/landingTranslated.test.ts`:

```ts
/**
 * The marketing site ports `landing.*` and `features.*` from these files
 * (wiz_scheduler_marketing/scripts/port-copy.mjs) and serves them in all 19
 * locales. A string left in English shows up as English in the middle of,
 * say, the Japanese home page. Strings of 12 characters or fewer are skipped:
 * brand names, "AI", "CSV", short numerics legitimately match.
 */
import { describe, expect, it } from "vitest";
import en from "./en";
import { LANGUAGES } from "./types";

const MODULES = import.meta.glob("./*.ts", { import: "default", eager: true }) as Record<string, unknown>;

type Tree = { [k: string]: string | Tree };

function flatten(node: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else Object.assign(out, flatten(v, key));
  }
  return out;
}

const ported = (t: unknown) => {
  const tree = t as { landing: Tree; features: Tree };
  return flatten({ landing: tree.landing, features: tree.features });
};

/** Identical to English in every locale on purpose: prices and arithmetic. */
const ALWAYS_KEPT = new Set(["landing.exampleSchedulesCost", "landing.exampleEmployeesCost"]);

/**
 * Per-locale strings deliberately left identical to English. Nigerian Pidgin
 * shares much of its vocabulary with English, so a natural Pidgin sentence can
 * match it word for word. Every entry here was reviewed by hand.
 */
const KEPT_IN_ENGLISH: Partial<Record<string, ReadonlySet<string>>> = {
  pcm: new Set<string>([
    // filled in Step 4: one key per line, each a string reviewed as natural Pidgin
  ]),
};

const EN = ported(en);

describe("ported marketing copy is translated", () => {
  for (const { code } of LANGUAGES.filter((l) => l.code !== "en")) {
    it(`${code} has no landing/features string left in English`, () => {
      const t = ported(MODULES[`./${code}.ts`]);
      const kept = KEPT_IN_ENGLISH[code] ?? new Set<string>();
      const untranslated = Object.keys(EN).filter(
        (k) => EN[k].length > 12 && t[k] === EN[k] && !ALWAYS_KEPT.has(k) && !kept.has(k),
      );
      expect(untranslated).toEqual([]);
    });
  }
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `cd /Users/robran/IdeaProjects/wiz_scheduler_i18n/frontend && npx vitest run src/i18n/landingTranslated.test.ts`

Expected: FAIL for 17 locales.
- 16 locales each list the same 11 keys: `landing.exploreDashboard`, `landing.demoTitle`, `landing.demoDesc`, `landing.demoFallback`, `landing.featHourCapsTitle`, `landing.featHourCapsDesc`, `landing.featDayRulesTitle`, `landing.featDeputyTitle`, `landing.featDeputyDesc`, `landing.inputHourRestrictionsTitle` and `landing.inputAssociationTitle`.
- `pcm` lists about 57 keys.
- `es` passes.

- [ ] **Step 4: Translate**

For each of the 16 locales, replace the 11 English strings in that file's `landing` section. Rules:
- **Source:** the English text is in `frontend/src/i18n/en.ts` (`landing.exploreDashboard` and the rest).
- **Terminology:** match the words the same file already uses for "schedule", "shift", "employee", "availability" and "location". Read its neighbouring `landing.feat*` strings first.
- **Arrows:** keep the trailing arrow in `exploreDashboard`: `→` for left-to-right locales, `←` for `ar` and `ur`.
- **Names:** keep "Deputy" and "Wiz Scheduler" untranslated.

For `pcm`, review each listed key in turn:
- If the string isn't how a Nigerian Pidgin speaker would write it, translate it into Pidgin.
- If it is (common for short technical phrases), add its key to `KEPT_IN_ENGLISH.pcm`.
- Always translate the 11 keys above for `pcm`, as for every other locale.

- [ ] **Step 5: Run the test and the full frontend suite**

Run: `npx vitest run src/i18n/landingTranslated.test.ts && npm test && npm run build`

Expected: all PASS and the build is clean. `npm test` already runs `logicalDirection.test.ts`.

- [ ] **Step 6: Commit, push and open the PR**

```bash
cd /Users/robran/IdeaProjects/wiz_scheduler_i18n
git add frontend/src/i18n
git commit -m "fix(i18n): translate the homepage strings still in English in 17 locales

The marketing site serves landing.* and features.* in all 19 locales.
A test now fails when one of those strings is left identical to English.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Tth1ftYwbLKMYmjgLSmWfi"
git push -u origin fix/landing-translations
gh pr create --base main --head fix/landing-translations \
  --title "fix(i18n): translate homepage strings still in English" \
  --body "Translates 11 landing.* strings left in English in 16 locales, and reviews Nigerian Pidgin's English-identical strings. Adds frontend/src/i18n/landingTranslated.test.ts so the gap can't reopen. Needed by the marketing site's 19-locale home and features pages.

## Test plan
- [x] npm test (includes the new test and logicalDirection)
- [x] npm run build

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Tth1ftYwbLKMYmjgLSmWfi"
```

Do not merge; the user merges after CI. Later tasks read the worktree directly.

---

### Task 2: Locale model (`src/lib/links.ts`)

**Files:**
- Modify: `src/lib/links.ts`, a full rewrite
- Test: `tests/links.test.ts`

**Interfaces:**
- Produces:
  - **Constants:**
    - `LOCALES` (19, in the Global Constraints order) and `type Locale`
    - `SITE_LOCALES = ["en", "es"]` and `type SiteLocale`
    - `DEFAULT_LOCALE`
    - `RTL_LOCALES`
    - `ALL_LOCALE_PATHS = ["/", "/features"]`
    - `ENDONYMS: Record<Locale, string>`
    - `OG_LOCALE: Record<Locale, string>`
  - **Functions:**
    - `isLocale(x)` and `isSiteLocale(x)`
    - `localesFor(path): readonly Locale[]`
    - `hasPage(locale, path): boolean`
    - `localePath(locale, path): string`
    - `alternates(path): { locale: Locale; href: string }[]`
    - `dir(locale): "ltr" | "rtl"`

- [ ] **Step 1: Write the failing tests**

Replace the `describe("localePath", …)` block in `tests/links.test.ts` (keep the `appLink` block) with:

```ts
import { describe, expect, it } from "vitest";
import {
  LOCALES, OG_LOCALE, ENDONYMS, alternates, dir, hasPage, isLocale, isSiteLocale, localePath, localesFor,
} from "../src/lib/links";
import { appLink } from "../src/lib/site";

describe("localePath", () => {
  it("leaves the default locale unprefixed", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/features")).toBe("/features");
  });
  it("prefixes other locales and strips trailing slashes", () => {
    expect(localePath("es", "/")).toBe("/es");
    expect(localePath("es", "/features/")).toBe("/es/features");
    expect(localePath("ja", "/")).toBe("/ja");
    expect(localePath("ar", "/features")).toBe("/ar/features");
  });
  it("keeps Spanish for pages that exist only in en/es", () => {
    expect(localePath("es", "/terms")).toBe("/es/terms");
    expect(localePath("es", "/compare/7shifts")).toBe("/es/compare/7shifts");
  });
  it("falls back to English for a page that does not exist in the locale", () => {
    expect(localePath("ja", "/terms")).toBe("/terms");
    expect(localePath("ar", "/nyc-fair-workweek-scheduling")).toBe("/nyc-fair-workweek-scheduling");
    expect(localePath("pcm", "/compare/7shifts/")).toBe("/compare/7shifts");
  });
});

describe("localesFor / hasPage / alternates", () => {
  it("home and features exist in all 19 locales", () => {
    expect(localesFor("/")).toEqual(LOCALES);
    expect(localesFor("/features/")).toEqual(LOCALES);
    expect(LOCALES).toHaveLength(19);
    expect(alternates("/")).toHaveLength(19);
    expect(alternates("/features")).toContainEqual({ locale: "zh", href: "/zh/features" });
  });
  it("other pages exist in en and es only", () => {
    expect(localesFor("/terms")).toEqual(["en", "es"]);
    expect(hasPage("ja", "/terms")).toBe(false);
    expect(hasPage("es", "/terms")).toBe(true);
    expect(alternates("/terms")).toEqual([
      { locale: "en", href: "/terms" },
      { locale: "es", href: "/es/terms" },
    ]);
  });
});

describe("locale facts", () => {
  it("recognises locales", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("xx")).toBe(false);
    expect(isSiteLocale("es")).toBe(true);
    expect(isSiteLocale("fr")).toBe(false);
  });
  it("only ar and ur are right-to-left", () => {
    expect(LOCALES.filter((l) => dir(l) === "rtl")).toEqual(["ar", "ur"]);
  });
  it("every locale has an endonym and an og:locale", () => {
    for (const l of LOCALES) {
      expect(ENDONYMS[l].length).toBeGreaterThan(0);
      expect(OG_LOCALE[l]).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    }
    expect(ENDONYMS.pcm).toBe("Naijá Píjin");
  });
});

describe("appLink", () => {
  it("points at the app host and carries a preset", () => {
    expect(appLink("/login")).toBe("https://app.wizscheduler.com/login");
    expect(appLink("/register", "nyc-fair-workweek")).toBe(
      "https://app.wizscheduler.com/register?preset=nyc-fair-workweek",
    );
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd /Users/robran/IdeaProjects/wiz_scheduler_marketing && npx vitest run tests/links.test.ts`

Expected: FAIL. The new imports (`dir`, `localesFor`, …) are not exported.

- [ ] **Step 3: Implement**

Replace `src/lib/links.ts` with:

```ts
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
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/links.test.ts`

Expected: PASS. `npm run check` will now fail in `Nav.astro` because `langName` is a `Record<Locale, …>` with only 2 keys. That is expected and is fixed in Task 5; do not patch it here.

- [ ] **Step 5: Commit**

```bash
git add src/lib/links.ts tests/links.test.ts
git commit -m "feat(i18n): 19-locale model with English fallback for en/es-only pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Tth1ftYwbLKMYmjgLSmWfi"
```

---

### Task 3: Text for 19 locales

**Files:**
- Modify: `scripts/port-copy.mjs` (`LOCALES`)
- Create (generated): `src/i18n/generated/{fr,de,pt,ru,tr,ar,ur,hi,bn,mr,ta,te,pcm,id,vi,ja,zh}.ts`
- Regenerate: `src/i18n/generated/{en,es}.ts`
- Create: `src/i18n/chrome/{en,es,fr,de,pt,ru,tr,ar,ur,hi,bn,mr,ta,te,pcm,id,vi,ja,zh}.ts` and `src/i18n/home.ts`
- Modify: `src/i18n/en.ts`, `src/i18n/es.ts` and `src/i18n/index.ts`
- Modify (switch to `getSiteCopy` and a `SiteLocale` prop):
  - `src/views/Nyc.astro`
  - `src/views/Legal.astro`
  - `src/views/CheckerPage.astro`
  - `src/views/Compare.astro`
  - `src/pages/404.astro`
- Test: `tests/locale-parity.test.ts`

**Interfaces:**
- Consumes:
  - `Locale` and `SiteLocale` from Task 2.
  - The app worktree from Task 1 at `/Users/robran/IdeaProjects/wiz_scheduler_i18n`.
- Produces:
  - `getCopy(locale: Locale): HomeCopy`, for Home, Features, Nav and Footer.
  - `getSiteCopy(locale: SiteLocale): Copy`, for the pages that stay en/es.
  - `type HomeCopy = Generated & Chrome`, which holds `common`, `login`, `register`, `landing`, `features`, `gdpr`, `nav` (`features`, `nyc`, `checker`, `compare`, `language`) and `home` (15 keys).
  - `nav.english` and `nav.spanish` are removed; Task 5's menu uses `ENDONYMS`.

- [ ] **Step 1: Write the failing parity test**

Replace `tests/locale-parity.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import en from "../src/i18n/en";
import es from "../src/i18n/es";
import { LOCALES } from "../src/lib/links";

type Tree = { [k: string]: string | Tree | Tree[] };

const GENERATED = import.meta.glob("../src/i18n/generated/*.ts", { import: "default", eager: true }) as Record<string, Tree>;
const CHROME = import.meta.glob("../src/i18n/chrome/*.ts", { import: "default", eager: true }) as Record<string, Tree>;

function leaves(node: Tree | Tree[] | string, prefix = ""): string[] {
  if (typeof node === "string") return [prefix];
  if (Array.isArray(node)) return node.flatMap((n, i) => leaves(n, `${prefix}[${i}]`));
  return Object.entries(node).flatMap(([k, v]) => leaves(v as Tree, prefix ? `${prefix}.${k}` : k));
}

function empties(t: Tree): string[] {
  return leaves(t).filter((path) => {
    const value = path
      .replace(/\[(\d+)\]/g, ".$1")
      .split(".")
      .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], t);
    return typeof value !== "string" || value.trim() === "";
  });
}

describe("full-site copy (en/es)", () => {
  it("en and es have identical leaf paths", () => {
    expect(leaves(es as unknown as Tree).sort()).toEqual(leaves(en as unknown as Tree).sort());
  });
  it("no leaf is empty in either locale", () => {
    expect(empties(en as unknown as Tree)).toEqual([]);
    expect(empties(es as unknown as Tree)).toEqual([]);
  });
});

for (const [name, files] of [["generated", GENERATED], ["chrome", CHROME]] as const) {
  describe(`${name} copy, all 19 locales`, () => {
    it("has a file for every locale and no others", () => {
      const codes = Object.keys(files).map((p) => p.split("/").pop()!.replace(/\.ts$/, "")).sort();
      expect(codes).toEqual([...LOCALES].sort());
    });
    const reference = leaves(files[`../src/i18n/${name}/en.ts`]).sort();
    for (const locale of LOCALES) {
      it(`${locale} matches English and has no empty string`, () => {
        const t = files[`../src/i18n/${name}/${locale}.ts`];
        expect(t, `missing src/i18n/${name}/${locale}.ts`).toBeDefined();
        expect(leaves(t).sort()).toEqual(reference);
        expect(empties(t)).toEqual([]);
      });
    }
  });
}
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/locale-parity.test.ts`

Expected: FAIL. Only `generated/en` and `generated/es` exist, and `chrome/` is empty.

- [ ] **Step 3: Port the 19 generated files**

In `scripts/port-copy.mjs`:
- Change the header comment to "Regenerates src/i18n/generated/<locale>.ts for all 19 locales".
- Replace the `LOCALES` line with:

```js
const LOCALES = ["en", "es", "fr", "de", "pt", "ru", "tr", "ar", "ur", "hi",
  "bn", "mr", "ta", "te", "pcm", "id", "vi", "ja", "zh"]; // = src/lib/links.ts LOCALES
```

Run: `APP_REPO=/Users/robran/IdeaProjects/wiz_scheduler_i18n npm run port:copy`

Expected: 19 `wrote src/i18n/generated/<locale>.ts` lines. `git diff src/i18n/generated/en.ts` should be empty, since Task 1 touched no English. `generated/es.ts` may change if the app's Spanish changed since the last port.

- [ ] **Step 4: Create the chrome files**

`src/i18n/chrome/en.ts`:

```ts
/** Site-only strings that home, features, the nav and the footer need in every locale. */
const chrome = {
  nav: {
    features: "Features",
    nyc: "NYC Fair Workweek",
    checker: "Free schedule checker",
    compare: "Compare with 7shifts",
    language: "Language",
  },
  home: {
    eyebrowCapability: "01 — Capability",
    eyebrowProof: "02 — Proof",
    eyebrowMethod: "03 — Method",
    eyebrowInputs: "04 — Inputs",
    eyebrowCost: "05 — Cost",
    eyebrowAssurance: "06 — Assurance",
    meterRuns: "RUNS",
    meterData: "DATA",
    meterTeam: "TEAM",
    meterAi: "AI",
    runsIncluded: "50 / month",
    aiOverage: "Cost x 130%",
    rotaShifts: "shifts",
    rotaPeople: "people",
    rotaViolations: "rest violations",
  },
};

export default chrome;
export type Chrome = typeof chrome;
```

`src/i18n/chrome/es.ts` moves the existing Spanish strings over unchanged:

```ts
import type { Chrome } from "./en";

const chrome: Chrome = {
  nav: {
    features: "Funciones",
    nyc: "Fair Workweek NYC",
    checker: "Verificador de horarios gratis",
    compare: "Comparar con 7shifts",
    language: "Idioma",
  },
  home: {
    eyebrowCapability: "01 — Capacidad",
    eyebrowProof: "02 — Prueba",
    eyebrowMethod: "03 — Método",
    eyebrowInputs: "04 — Entradas",
    eyebrowCost: "05 — Costo",
    eyebrowAssurance: "06 — Garantías",
    meterRuns: "EJECUCIONES",
    meterData: "DATOS",
    meterTeam: "EQUIPO",
    meterAi: "AI",
    runsIncluded: "50 / mes",
    aiOverage: "Costo x 130%",
    rotaShifts: "turnos",
    rotaPeople: "personas",
    rotaViolations: "infracciones de descanso",
  },
};

export default chrome;
```

Each of the other 17 files has the same shape (`import type { Chrome } from "./en"; const chrome: Chrome = { … }; export default chrome;`), with all 20 strings translated. Rules:
- **Terminology:** use the words that locale's `generated/<locale>.ts` already uses. "Shifts" must match its `landing` word for shift, and "Features" its `features.pageTitle` or nav usage.
- **`nav.nyc`:** keep "NYC" and "Fair Workweek" (a law's name), translating only the connecting words.
- **`nav.compare`:** keep "7shifts".
- **Eyebrows:** keep the `"0N — "` prefix (digits and em dash) and translate the word.
- **Meter tags:** short, one word. Uppercase only in scripts that have case (Latin, Cyrillic); keep `meterAi` as `"AI"` unless the locale's `landing.*` strings already use a local abbreviation for AI.
- **`runsIncluded`:** keep `50`.
- **`aiOverage`:** keep `x 130%`, translating "Cost".

- [ ] **Step 5: Wire the copy**

`src/i18n/home.ts`:

```ts
import type { Locale } from "../lib/links";
import type { Chrome } from "./chrome/en";
import gEn from "./generated/en";
import gEs from "./generated/es";
import gFr from "./generated/fr";
import gDe from "./generated/de";
import gPt from "./generated/pt";
import gRu from "./generated/ru";
import gTr from "./generated/tr";
import gAr from "./generated/ar";
import gUr from "./generated/ur";
import gHi from "./generated/hi";
import gBn from "./generated/bn";
import gMr from "./generated/mr";
import gTa from "./generated/ta";
import gTe from "./generated/te";
import gPcm from "./generated/pcm";
import gId from "./generated/id";
import gVi from "./generated/vi";
import gJa from "./generated/ja";
import gZh from "./generated/zh";
import cEn from "./chrome/en";
import cEs from "./chrome/es";
import cFr from "./chrome/fr";
import cDe from "./chrome/de";
import cPt from "./chrome/pt";
import cRu from "./chrome/ru";
import cTr from "./chrome/tr";
import cAr from "./chrome/ar";
import cUr from "./chrome/ur";
import cHi from "./chrome/hi";
import cBn from "./chrome/bn";
import cMr from "./chrome/mr";
import cTa from "./chrome/ta";
import cTe from "./chrome/te";
import cPcm from "./chrome/pcm";
import cId from "./chrome/id";
import cVi from "./chrome/vi";
import cJa from "./chrome/ja";
import cZh from "./chrome/zh";

export type Generated = typeof gEn;
export type HomeCopy = Generated & Chrome;

const pair = (g: Generated, c: Chrome): HomeCopy => ({ ...g, ...c });

export const HOME_COPY: Record<Locale, HomeCopy> = {
  en: pair(gEn, cEn), es: pair(gEs, cEs), fr: pair(gFr, cFr), de: pair(gDe, cDe),
  pt: pair(gPt, cPt), ru: pair(gRu, cRu), tr: pair(gTr, cTr), ar: pair(gAr, cAr),
  ur: pair(gUr, cUr), hi: pair(gHi, cHi), bn: pair(gBn, cBn), mr: pair(gMr, cMr),
  ta: pair(gTa, cTa), te: pair(gTe, cTe), pcm: pair(gPcm, cPcm), id: pair(gId, cId),
  vi: pair(gVi, cVi), ja: pair(gJa, cJa), zh: pair(gZh, cZh),
};
```

`src/i18n/en.ts`:
- Replace `import generated from "./generated/en";` with `import generated from "./generated/en"; import chrome from "./chrome/en";`.
- Replace `...generated,` with `...generated, ...chrome,`.
- Delete the `nav: { … },` and `home: { … },` blocks.
- Keep `notFound`, `legal`, `nyc`, `compare` and `checker` unchanged.

`src/i18n/es.ts`: make the same change with `./generated/es` and `./chrome/es`.

`src/i18n/index.ts`:

```ts
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
```

In `src/views/Nyc.astro`, `Legal.astro`, `CheckerPage.astro` and `Compare.astro`:
- Change `import { getCopy } from "../i18n";` to `import { getSiteCopy } from "../i18n";`.
- Change `getCopy(locale)` to `getSiteCopy(locale)`.
- Change the `locale: Locale` prop to `locale: SiteLocale`, importing `type SiteLocale` from `../lib/links` in place of (or beside) `Locale`, whichever the file still needs.

In `src/pages/404.astro`, change `getCopy("en")` to `getSiteCopy("en")` and its import to match.

- [ ] **Step 6: Run the tests and the type check**

Run: `npx vitest run tests/locale-parity.test.ts tests/logical-direction.test.ts`

Expected: PASS.

Run: `npm run check`

Expected: the only errors are in `src/components/Nav.astro` (`langName`, `t.nav.english`, `t.nav.spanish`); Task 5 fixes them. Any other error is this task's to fix.

- [ ] **Step 7: Commit**

```bash
git add scripts/port-copy.mjs src/i18n src/views/Nyc.astro src/views/Legal.astro src/views/CheckerPage.astro src/views/Compare.astro src/pages/404.astro tests/locale-parity.test.ts
git commit -m "feat(i18n): home and features copy in 19 locales; en/es-only pages use getSiteCopy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Tth1ftYwbLKMYmjgLSmWfi"
```

---

### Task 4: Routes, `<html dir>`, SEO and sitemap

**Files:**
- Create: `src/pages/[locale]/index.astro` and `src/pages/[locale]/features.astro`
- Delete: `src/pages/es/index.astro` and `src/pages/es/features.astro`
- Modify:
  - `src/layouts/Base.astro`
  - `src/components/Seo.astro`
  - `astro.config.mjs`

**Interfaces:**
- Consumes:
  - `LOCALES`, `DEFAULT_LOCALE`, `dir`, `OG_LOCALE` and `alternates` from Task 2.
  - `getCopy` from Task 3. `Home` and `Features` already call it with their `locale` prop.

- [ ] **Step 1: Add the dynamic routes**

`src/pages/[locale]/index.astro`:

```astro
---
import Home from "../../views/Home.astro";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "../../lib/links";

export function getStaticPaths() {
  return LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({ params: { locale } }));
}

const { locale } = Astro.params as { locale: Locale };
---
<Home locale={locale} />
```

`src/pages/[locale]/features.astro`:

```astro
---
import Features from "../../views/Features.astro";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "../../lib/links";

export function getStaticPaths() {
  return LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({ params: { locale } }));
}

const { locale } = Astro.params as { locale: Locale };
---
<Features locale={locale} />
```

Then: `git rm src/pages/es/index.astro src/pages/es/features.astro`. The other `src/pages/es/*` files stay; static routes outrank `[locale]`.

- [ ] **Step 2: Set `dir` and per-locale metadata**

In `src/layouts/Base.astro`:
- Change the import to `import { dir, type Locale } from "../lib/links";`.
- Change `<html lang={locale}>` to `<html lang={locale} dir={dir(locale)}>`.

In `src/components/Seo.astro`:
- Change the import to `import { OG_LOCALE, alternates, localePath, type Locale } from "../lib/links";`.
- Replace `const ogLocale = locale === "es" ? "es_US" : "en_US";` with `const ogLocale = OG_LOCALE[locale];`.

The `alternates(path)` loop and `x-default` line stay as they are. `alternates` is now path-aware.

- [ ] **Step 3: Astro config**

In `astro.config.mjs`, add after the existing imports:

```js
// = src/lib/links.ts LOCALES (astro.config.mjs cannot import the TS module)
const LOCALES = ["en", "es", "fr", "de", "pt", "ru", "tr", "ar", "ur", "hi",
  "bn", "mr", "ta", "te", "pcm", "id", "vi", "ja", "zh"];
const HOME_URLS = new Set(LOCALES.map((l) => (l === "en" ? "https://wizscheduler.com/" : `https://wizscheduler.com/${l}`)));
```

Then make these changes:
- **`i18n` block:** `locales: ["en", "es"]` becomes `locales: LOCALES`.
- **Sitemap:** `i18n: { defaultLocale: "en", locales: { en: "en", es: "es" } }` becomes `i18n: { defaultLocale: "en", locales: Object.fromEntries(LOCALES.map((l) => [l, l])) }`.
- **Home priority rule:** `if (item.url === "https://wizscheduler.com/" || item.url === "https://wizscheduler.com/es") {` becomes `if (HOME_URLS.has(item.url)) {`.

- [ ] **Step 4: Build**

Run: `npm run build`

Expected: the build succeeds, `dist/ja/index.html`, `dist/ar/features/index.html` and `dist/es/terms/index.html` exist, and `dist/ja/terms` does not. Check with:

```bash
ls dist/ja/index.html dist/ar/features/index.html dist/es/index.html dist/es/features/index.html dist/es/terms/index.html && test ! -e dist/ja/terms && echo OK
grep -o '<html[^>]*>' dist/ar/index.html
```

Expected: `OK` and `<html lang="ar" dir="rtl">`.

If the build fails in `Nav.astro` because of the Task 2/3 type gap, `astro build` doesn't type-check, so it shouldn't. If it does fail there, carry on to Task 5 and build after it.

- [ ] **Step 5: Commit**

```bash
git add -A src/pages src/layouts/Base.astro src/components/Seo.astro astro.config.mjs
git commit -m "feat(i18n): /<locale> and /<locale>/features routes for 18 locales; rtl and og:locale

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Tth1ftYwbLKMYmjgLSmWfi"
```

---

### Task 5: Language menu (`Nav.astro`)

**Files:**
- Modify: `src/components/Nav.astro`

**Interfaces:**
- Consumes: `ENDONYMS`, `localesFor`, `localePath` and `dir` (Task 2), and `t.nav.language` (Task 3).

- [ ] **Step 1: Replace the pill list**

In `src/components/Nav.astro`:
- Change the links import to `import { ENDONYMS, dir, localePath, localesFor, type Locale } from "../lib/links";`.
- Delete the `const langName …` line and add `const available = localesFor(path);`.
- Replace the whole `<ul class="flex items-center gap-1" aria-label={t.nav.language}> … </ul>` with:

```astro
<details class="relative group">
  <summary
    class={`${m.text.meta} list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none px-2 py-1 border ${m.rule.line} hover:!text-ink flex items-center gap-1.5`}
    aria-label={t.nav.language}
  >
    <span lang={locale}>{ENDONYMS[locale]}</span>
    <span aria-hidden="true" class="transition-transform group-open:rotate-180">▾</span>
  </summary>
  <ul
    class={`absolute end-0 top-full mt-1 z-50 min-w-[11rem] max-h-[70vh] overflow-y-auto bg-newsprint border ${m.rule.line} py-1 shadow-sm`}
  >
    {available.map((l) => (
      <li>
        <a
          href={localePath(l, path)}
          hreflang={l}
          lang={l}
          dir={dir(l)}
          aria-current={l === locale ? "page" : undefined}
          class={`block px-3 py-1.5 text-sm text-start ${l === locale ? "font-semibold text-ink" : "text-ink/70 hover:text-ink"}`}
        >
          {ENDONYMS[l]}
        </a>
      </li>
    ))}
  </ul>
</details>
```

- [ ] **Step 2: Type check, tests and build**

Run: `npm run check && npm test && npm run build`

Expected: all clean. `logical-direction.test.ts` passes: `end-0` and `text-start` are logical.

Check that an en/es-only page lists 2 languages and home lists 19:

```bash
grep -o 'hreflang="[a-z]*" lang=' dist/terms/index.html | wc -l
grep -o 'hreflang="[a-z]*" lang=' dist/index.html | wc -l
```

Expected: `2` and `19`.

- [ ] **Step 3: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat(i18n): language menu lists the locales the current page exists in

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Tth1ftYwbLKMYmjgLSmWfi"
```

---

### Task 6: Built-site check, wired into CI and deploy

**Files:**
- Create: `scripts/check-dist.mjs`
- Modify:
  - `package.json` (script `check:dist`)
  - `.github/workflows/ci.yml`
  - `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes:
  - `dist/` from `npm run build`.
  - `LOCALES`, `localePath` and `dir` from `src/lib/links.ts`, imported directly. Node 24 strips the types with the same flag `port:copy` uses.

- [ ] **Step 1: Write the check**

`scripts/check-dist.mjs`:

```js
// Asserts the built site serves home and features in every locale, with the
// right lang/dir/hreflang, and that en/es-only pages stayed en/es-only.
// Run after `npm run build`: npm run check:dist
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LOCALES, dir, localePath } from "../src/lib/links.ts";

const DIST = resolve(process.cwd(), "dist");
const page = (url) => {
  const file = resolve(DIST, url.replace(/^\//, ""), "index.html");
  assert.ok(existsSync(file), `missing ${file}`);
  return readFileSync(file, "utf8");
};
const htmlTag = (html) => html.match(/<html[^>]*>/)?.[0] ?? "";
const hreflangs = (html) => [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((m) => m[1]);

let checked = 0;
for (const locale of LOCALES) {
  for (const path of ["/", "/features"]) {
    const url = localePath(locale, path);
    const html = page(url);
    const tag = htmlTag(html);
    assert.match(tag, new RegExp(`lang="${locale}"`), `${url}: ${tag}`);
    assert.match(tag, new RegExp(`dir="${dir(locale)}"`), `${url}: ${tag}`);
    const langs = hreflangs(html);
    assert.equal(langs.length, LOCALES.length + 1, `${url}: hreflang ${langs.join(",")}`);
    assert.ok(langs.includes("x-default"), `${url}: no x-default`);
    checked++;
  }
}

// en/es-only pages: no ja copy, two alternates plus x-default.
assert.ok(!existsSync(resolve(DIST, "ja/terms")), "dist/ja/terms must not exist");
assert.equal(hreflangs(page("/es/terms")).length, 3, "/es/terms alternates");

// A ja page's footer links fall back to English URLs.
const ja = page("/ja");
assert.ok(ja.includes('href="/terms"'), "/ja footer should link /terms");
assert.ok(!ja.includes('href="/ja/terms"'), "/ja must not link /ja/terms");
assert.ok(ja.includes('href="/ja/features"'), "/ja should link /ja/features");

console.log(`check:dist OK — ${checked} localized pages`);
```

- [ ] **Step 2: Add the script and run it**

In `package.json` `scripts`, add after `"build"`:

```json
"check:dist": "node --experimental-strip-types scripts/check-dist.mjs",
```

Run: `npm run build && npm run check:dist`

Expected: `check:dist OK — 38 localized pages`.

- [ ] **Step 3: Prove the check can fail**

Temporarily change `<html lang={locale} dir={dir(locale)}>` in `src/layouts/Base.astro` to `<html lang={locale}>`, then run `npm run build && npm run check:dist`.

Expected: FAIL with `/: <html lang="en">`.

Revert the change with `git checkout src/layouts/Base.astro`.

- [ ] **Step 4: Run it in CI and deploy**

In `.github/workflows/ci.yml`, after `- run: npm run build`, add:

```yaml
      - run: npm run check:dist
```

In `.github/workflows/deploy.yml`, after its `- run: npm run build`, add the same line, indented to match. It must come before the AWS steps, so a broken build never deploys.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-dist.mjs package.json .github/workflows/ci.yml .github/workflows/deploy.yml
git commit -m "test(i18n): check the built site's 38 localized pages in CI and before deploy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Tth1ftYwbLKMYmjgLSmWfi"
```

---

### Task 7: Right-to-left and non-Latin browser check, then PR

**Files:**
- Modify, only if the check finds a problem: `src/views/Home.astro`, `src/views/Features.astro`, `src/islands/RotaHero.tsx` or `src/components/Nav.astro`

- [ ] **Step 1: Serve the build**

Run, in the background: `npm run build && npm run preview -- --port 4321`

- [ ] **Step 2: Check in a browser**

Use Playwright (`mcp__plugin_playwright_playwright__*`) at 1280×800 and at 375×812 for each of `/ar`, `/ar/features`, `/ja` and `/terms`.

For each one, take a screenshot and check:
- **`/ar` and `/ar/features`:**
  - Text is right-aligned.
  - The nav brand is at the inline start, which is the right edge.
  - The language menu opens toward the left edge without leaving the viewport.
  - The hero schedule grid reads right-to-left.
  - The features table of contents has its accent border on the right.
  - Nothing scrolls horizontally: `document.documentElement.scrollWidth <= innerWidth`.
- **`/ja`:** Japanese renders in a Japanese system font (no tofu boxes), and headings aren't condensed.
- **`/terms`:** the language menu lists only English and Español.
- **Menu link:** clicking 日本語 in the menu on `/features` goes to `/ja/features`.

Fix anything wrong with logical utilities or `rtl:` variants. Never add physical left/right utilities. Re-run `npm test && npm run build && npm run check:dist` after any fix, then commit:

```bash
git commit -am "fix(i18n): <what was wrong> in right-to-left layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Tth1ftYwbLKMYmjgLSmWfi"
```

- [ ] **Step 3: Full verification**

Run: `npm run check && npm test && npm run build && npm run check:dist`

Expected: all clean.

- [ ] **Step 4: Push and open the PR**

```bash
git push -u origin feat/home-features-19-locales
gh pr create --base main --head feat/home-features-19-locales \
  --title "feat: home and features in the app's 19 locales" \
  --body-file <scratchpad file with summary, depends-on link to the wiz_scheduler fix/landing-translations PR, test plan, screenshots taken in Step 2, and the attribution footer>
```

The PR body says it depends on the app PR from Task 1. After that PR merges, run `npm run port:copy` once more against the merged `wiz_scheduler` checkout. The output should match what is committed.
