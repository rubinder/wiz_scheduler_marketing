# Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static WizScheduler marketing site (English + Spanish) in this repo, ported from the app's landing look, with the NYC Fair Workweek page, the 7shifts comparison page and the free schedule checker, deployable to S3 + CloudFront.

**Architecture:** Astro 7 renders every page to static HTML at build time; one `src/views/*.astro` component per page takes a `locale` prop and thin files under `src/pages/` and `src/pages/es/` instantiate it. Copy lives in typed objects (`src/i18n`), the ported part generated from the app repo by a script. Two React islands carry the only client JavaScript: the animated rota hero and the checker form, which calls the app's public compliance API and never evaluates rules itself.

**Tech Stack:** Astro 7, @astrojs/react 7 (React 19), @astrojs/sitemap, Tailwind 3.4 via PostCSS, motion 13, SheetJS 0.20.3 (CDN tarball), TypeScript 5.9, Vitest 5 + Testing Library, GitHub Actions, AWS CLI.

**Spec:** `docs/superpowers/specs/2026-09-22-marketing-site-design.md`

## Global Constraints

- Node 24 (`.nvmrc`); Astro 7 requires Node >= 22.12.
- TypeScript pinned to `~5.9.3`: `@astrojs/check` rejects TypeScript 7.
- Tailwind 3.4 through `postcss.config.cjs`; do **not** add `@astrojs/tailwind` (it supports Astro <= 5 only).
- `xlsx` only from `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, never the npm registry copy.
- Locales: `en` at `/`, `es` at `/es/...`. No other locale. Every user-facing string comes from `src/i18n`; no copy literals in `.astro` or `.tsx` files.
- Logical Tailwind direction utilities only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`, `border-s`, `border-e`); `tests/logical-direction.test.ts` enforces this.
- The checker island parses and renders only. Clopening and notice evaluation happen in the app API (wiz_scheduler issue #116).
- Legal documents come from the app API (`GET /api/v1/gdpr/{privacy-policy,terms,dpa}`) at build time when `LEGAL_SOURCE=api`, otherwise from `src/content/legal/fixture.json`. Never hand-edit legal text here.
- Competitor facts on the compare page carry a `checkedOn` date and come only from 7shifts' public pages.
- All links into the app use `appLink()` from `src/lib/site.ts`; the app host is one constant.
- Commit after every task with a conventional message ending in `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- The app repo is a sibling checkout at `../wiz_scheduler` (override with `APP_REPO`). Tasks that copy assets read from there; nothing in this repo writes to it.

## File Structure

| Path | Responsibility |
|---|---|
| `astro.config.mjs`, `tsconfig.json`, `postcss.config.cjs`, `tailwind.config.ts`, `vitest.config.ts` | Toolchain |
| `src/styles/global.css`, `src/styles/fonts.css`, `src/styles/type.css` | Tailwind entry, self-hosted font faces, type roles (copied from the app) |
| `src/theme.ts` | The `marketing` class-name object from the app, exported as `m` |
| `src/lib/site.ts` | `SITE_URL`, `APP_URL`, `API_URL`, `CHECKER_ENABLED`, `appLink()` |
| `src/lib/links.ts` | `Locale`, `LOCALES`, `localePath()`, `alternates()` |
| `src/lib/legal.ts` | `getLegal(kind)` build-time fetch with fixture fallback |
| `src/lib/checker/{types,parse,request}.ts` | Checker contract, file parsing, request building and API call |
| `src/i18n/generated/{en,es}.ts` | Ported copy, written by `scripts/port-copy.mjs` |
| `src/i18n/{en,es,index}.ts` | Full copy objects (generated + new sections), `Copy` type, `getCopy()` |
| `src/layouts/Base.astro` | HTML shell: head, fonts, `Seo`, `Nav`, `Footer` |
| `src/components/{Seo,Nav,Footer,SectionRule}.astro` | Shared chrome |
| `src/islands/{RotaHero,Checker}.tsx`, `src/islands/rotaData.ts` | React islands |
| `src/views/{Home,Features,Legal,Nyc,Compare,CheckerPage}.astro` | One per page, `locale` prop |
| `src/pages/**` | Route files that instantiate views |
| `src/content.config.ts`, `src/content/compare/{en,es}/7shifts.md` | Compare page content collection |
| `src/content/legal/fixture.json` | Snapshot of the API's legal documents |
| `scripts/port-copy.mjs`, `scripts/snapshot-legal.mjs` | Generators |
| `public/` | fonts, favicon, og-image, screenshots, robots.txt, sample-schedule.csv |
| `tests/**` | Vitest suites |
| `.github/workflows/{ci,deploy}.yml` | PR checks, main deploy |
| `README.md` | Local dev, env vars, cutover checklist |

---

### Task 1: Toolchain scaffold, site constants and locale paths

**Files:**
- Create: `.nvmrc`, `.gitignore`, `package.json`, `astro.config.mjs`, `tsconfig.json`, `postcss.config.cjs`, `tailwind.config.ts`, `vitest.config.ts`
- Create: `src/env.d.ts`, `src/styles/global.css`, `src/styles/fonts.css`, `src/styles/type.css`, `public/fonts/*.woff2`, `public/favicon.svg`, `public/og-image.png`
- Create: `src/lib/site.ts`, `src/lib/links.ts`, `src/pages/index.astro` (scaffold page, replaced in Task 4)
- Test: `tests/setup.ts`, `tests/links.test.ts`

**Interfaces:**
- Produces: `SITE_URL: string`, `APP_URL: string`, `API_URL: string`, `CHECKER_ENABLED: boolean`, `NYC_PRESET: string`, `appLink(path: string, preset?: string): string` from `src/lib/site.ts`
- Produces: `type Locale = "en" | "es"`, `LOCALES`, `DEFAULT_LOCALE`, `isLocale(x): x is Locale`, `localePath(locale, path): string`, `alternates(path): {locale, href}[]` from `src/lib/links.ts`

- [ ] **Step 1: Write the project files**

`.nvmrc`
```
24
```

`.gitignore`
```
node_modules/
dist/
.astro/
.env
.env.*
```

`package.json`
```json
{
  "name": "wiz-scheduler-marketing",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "port:copy": "node --experimental-strip-types scripts/port-copy.mjs",
    "snapshot:legal": "node scripts/snapshot-legal.mjs"
  },
  "dependencies": {
    "@astrojs/react": "^7.0.0",
    "@astrojs/sitemap": "^3.7.4",
    "astro": "^7.3.4",
    "motion": "^13.4.1",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.10",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "autoprefixer": "^10.4.20",
    "jsdom": "^29.1.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.19",
    "typescript": "~5.9.3",
    "vitest": "^5.0.1"
  }
}
```

`astro.config.mjs`
```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://wizscheduler.com",
  trailingSlash: "never",
  build: { format: "directory" },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    sitemap({
      i18n: { defaultLocale: "en", locales: { en: "en-US", es: "es-US" } },
      filter: (page) => !page.endsWith("/404"),
    }),
  ],
});
```

`tsconfig.json`
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

`postcss.config.cjs`
```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`tailwind.config.ts` (palette, fonts and keyframes copied from the app; only `content` differs)
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{astro,html,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        data: ["var(--font-data)"],
      },
      colors: {
        cream: "#FFF8E7",
        sage: { DEFAULT: "#A8B5A0", light: "#C5CEBF", dark: "#7E8C76" },
        accent: {
          DEFAULT: "#C4A265",
          light: "#D4B87E",
          dark: "#A6864A",
          50: "rgba(196, 162, 101, 0.05)",
          100: "rgba(196, 162, 101, 0.10)",
          150: "rgba(196, 162, 101, 0.15)",
          200: "rgba(196, 162, 101, 0.20)",
        },
        ink: "#1A1815",
        newsprint: "#E9E4D8",
        paper: "#F5F2EA",
        rule: "#C9C0B0",
        marker: "#FF5A1F",
        clear: "#1D7357",
      },
      animation: { "wiz-glow": "wiz-glow 1.2s ease-in-out infinite" },
      keyframes: {
        "wiz-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 4px rgba(196, 162, 101, 0.6))" },
          "50%": { filter: "drop-shadow(0 0 12px rgba(196, 162, 101, 1))" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

`vitest.config.ts`
```ts
/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
  },
});
```

`tests/setup.ts`
```ts
import "@testing-library/jest-dom/vitest";
```

`src/env.d.ts`
```ts
interface ImportMetaEnv {
  readonly PUBLIC_APP_URL?: string;
  readonly PUBLIC_API_URL?: string;
  readonly PUBLIC_CHECKER_ENABLED?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

`src/styles/global.css`
```css
@import "./fonts.css";
@import "./type.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply bg-newsprint;
  }
  body {
    @apply bg-newsprint text-ink font-body;
  }
}

/* Markdown bodies (compare pages). No typography plugin: the rules are few. */
@layer components {
  .prose-rota h2 { @apply font-display text-3xl font-semibold leading-[1.05] mt-16 mb-4; }
  .prose-rota h3 { @apply font-display text-2xl font-semibold mt-10 mb-3; }
  .prose-rota p { @apply font-body text-ink/70 leading-relaxed max-w-[62ch] mb-4; }
  .prose-rota ul { @apply list-disc ps-6 mb-6 max-w-[62ch]; }
  .prose-rota li { @apply font-body text-ink/70 leading-relaxed mb-1; }
  .prose-rota a { @apply underline underline-offset-4 decoration-rule hover:decoration-marker; }
  .prose-rota table { @apply w-full font-data text-sm tabular-nums my-8; }
  .prose-rota th { @apply font-data text-ink/70 uppercase tracking-[0.14em] text-xs text-start pb-3 border-b border-rule; }
  .prose-rota td { @apply py-2.5 text-start border-b border-rule/70 align-top; }
}
```

`src/lib/site.ts`
```ts
export const SITE_URL = "https://wizscheduler.com";
export const APP_URL: string = import.meta.env.PUBLIC_APP_URL ?? "https://app.wizscheduler.com";
export const API_URL: string = import.meta.env.PUBLIC_API_URL ?? `${APP_URL}/api/v1`;
export const CHECKER_ENABLED: boolean = import.meta.env.PUBLIC_CHECKER_ENABLED === "true";
export const NYC_PRESET = "nyc-fair-workweek";

/** Absolute link into the app, optionally tagged with a signup preset. */
export function appLink(path: string, preset?: string): string {
  const url = new URL(path, APP_URL);
  if (preset) url.searchParams.set("preset", preset);
  return url.toString();
}
```

`src/lib/links.ts`
```ts
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
```

`src/pages/index.astro` (scaffold only; Task 4 replaces it)
```astro
---
import "../styles/global.css";
---
<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Wiz Scheduler</title></head>
  <body><h1 class="font-display text-3xl">Wiz Scheduler</h1></body>
</html>
```

- [ ] **Step 2: Copy fonts and static assets from the app**

```bash
APP=${APP_REPO:-../wiz_scheduler}/frontend
mkdir -p public/fonts src/styles
cp "$APP"/public/fonts/*.woff2 public/fonts/
cp "$APP"/src/styles/fonts.css "$APP"/src/styles/type.css src/styles/
cp "$APP"/public/favicon.svg "$APP"/public/og-image.png public/
ls public/fonts | wc -l   # expect 25
```

- [ ] **Step 3: Install**

Run: `npm install`
Expected: no errors; `node_modules/xlsx/package.json` shows `"version": "0.20.3"`.

- [ ] **Step 4: Write the failing links test**

`tests/links.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { alternates, isLocale, localePath } from "../src/lib/links";
import { appLink } from "../src/lib/site";

describe("localePath", () => {
  it("leaves the default locale unprefixed", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/features")).toBe("/features");
  });
  it("prefixes other locales and strips trailing slashes", () => {
    expect(localePath("es", "/")).toBe("/es");
    expect(localePath("es", "/features/")).toBe("/es/features");
  });
  it("lists both alternates for a path", () => {
    expect(alternates("/terms")).toEqual([
      { locale: "en", href: "/terms" },
      { locale: "es", href: "/es/terms" },
    ]);
  });
  it("recognises locales", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
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

- [ ] **Step 5: Run the test, then the build**

Run: `npx vitest run tests/links.test.ts`
Expected: 5 tests pass.

Run: `npm run build && ls dist`
Expected: `dist/index.html` exists and contains `Wiz Scheduler`.

If `getViteConfig` fails under Vitest 5, replace `vitest.config.ts` with a plain Vite config that adds `@vitejs/plugin-react` (add it as a devDependency) and keep the same `test` block. Note the swap in the commit message.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro 7 site with Tailwind, fonts, site constants and locale paths

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Copy port and the typed i18n layer

**Files:**
- Create: `scripts/port-copy.mjs`, `src/i18n/generated/en.ts`, `src/i18n/generated/es.ts` (generated), `src/i18n/en.ts`, `src/i18n/es.ts`, `src/i18n/index.ts`
- Test: `tests/locale-parity.test.ts`

**Interfaces:**
- Consumes: `Locale` from `src/lib/links.ts`
- Produces: `getCopy(locale: Locale): Copy`, `type Copy` (= `typeof en`) from `src/i18n/index.ts`. Sections: `common.appName`, `login.signIn`, `register.registerBtn`, `landing.*` (the app's 119 landing keys), `features.*` (incl. `features.pages[slug].{title,desc}`), `gdpr.*`, plus new `nav`, `notFound`, `legal`, `nyc`, `compare`, `checker`.

- [ ] **Step 1: Write the generator**

`scripts/port-copy.mjs`
```js
// Regenerates src/i18n/generated/{en,es}.ts from the app repo's locale files.
// Run: npm run port:copy      (APP_REPO overrides the sibling-checkout default)
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const APP_REPO = process.env.APP_REPO ?? resolve(process.cwd(), "../wiz_scheduler");
const LOCALES = ["en", "es"];
const OUT_DIR = resolve(process.cwd(), "src/i18n/generated");

function pick(t) {
  return {
    common: { appName: t.common.appName },
    login: { signIn: t.login.signIn },
    register: { registerBtn: t.register.registerBtn },
    landing: t.landing,
    features: t.features,
    gdpr: {
      privacyPolicy: t.gdpr.privacyPolicy,
      termsOfService: t.gdpr.termsOfService,
      dpa: t.gdpr.dpa,
      version: t.gdpr.version,
      effectiveDate: t.gdpr.effectiveDate,
      processors: t.gdpr.processors,
      processorName: t.gdpr.processorName,
      processorPurpose: t.gdpr.processorPurpose,
      processorLocation: t.gdpr.processorLocation,
    },
  };
}

mkdirSync(OUT_DIR, { recursive: true });
for (const locale of LOCALES) {
  const file = resolve(APP_REPO, `frontend/src/i18n/${locale}.ts`);
  const mod = await import(pathToFileURL(file).href);
  const subset = pick(mod.default);
  const body =
    `// Generated by scripts/port-copy.mjs from the app repo's ${locale}.ts. Do not edit by hand.\n` +
    `export default ${JSON.stringify(subset, null, 2)};\n`;
  writeFileSync(resolve(OUT_DIR, `${locale}.ts`), body);
  console.log(`wrote src/i18n/generated/${locale}.ts`);
}
```

- [ ] **Step 2: Run it**

Run: `npm run port:copy`
Expected: two files written; `grep -c '"' src/i18n/generated/en.ts` is in the hundreds; `grep inputsTitle src/i18n/generated/es.ts` finds the key (the app repo must be on a branch that has PR #114's `landing.inputs*` keys; `main` after that PR merges, or the `feat/landing-scheduler-inputs` branch until then).

- [ ] **Step 3: Write the full copy objects**

`src/i18n/en.ts`
```ts
import generated from "./generated/en";

const en = {
  ...generated,
  nav: {
    features: "Features",
    nyc: "NYC Fair Workweek",
    checker: "Free schedule checker",
    compare: "Compare with 7shifts",
    language: "Language",
    english: "English",
    spanish: "Español",
  },
  notFound: {
    title: "Page not found",
    desc: "That link doesn't go anywhere. The home page does.",
    home: "Back to home",
  },
  legal: {
    englishOnly: "This document is published in English. The English text is the binding version.",
    backHome: "Back to home",
  },
  nyc: {
    metaTitle: "NYC Fair Workweek scheduling software",
    metaDesc:
      "Schedule fast food and retail shifts in New York City with 14-day notice, 11 hours between shifts and change premiums in mind. Free schedule checker included.",
    eyebrow: "New York City",
    title: "Fair Workweek scheduling,",
    titleAccent: "without the fines",
    intro:
      "New York City's Fair Workweek Law sets rules for how fast food and retail employers schedule staff. WizScheduler enforces the rest rule while it builds the schedule and flags the rest.",
    reviewedOn: "Legal summary reviewed on",
    source: "Source: NYC Department of Consumer and Worker Protection (DCWP)",
    sourceUrl: "https://www.nyc.gov/site/dca/workers/workersrights/fastfood-retail-workers.page",
    coveredEyebrow: "01 — Who is covered",
    coveredTitle: "Two industries, two rule sets",
    fastFoodTitle: "Fast food",
    fastFoodDesc:
      "Establishments that serve food or drink for immediate consumption, take orders at a counter, and belong to a chain of 30 or more establishments nationally. Franchisees count.",
    retailTitle: "Retail",
    retailDesc: "Retail businesses with 20 or more employees at retail establishments in New York City.",
    rulesEyebrow: "02 — The rules",
    fastFoodRulesTitle: "Fast food",
    fastFoodRules: [
      { title: "14 days' notice", desc: "Written schedules must be given 14 days before the first shift on them." },
      {
        title: "11 hours between shifts",
        desc: "A closing shift followed by an opening shift with fewer than 11 hours in between is a clopening. It needs the worker's written consent and a $100 premium each time.",
      },
      {
        title: "Change premiums",
        desc: "Changes with less than 14 days' notice cost $10 to $75 per change, depending on how late the change is and whether hours are lost.",
      },
      { title: "Offer hours to current staff first", desc: "Open shifts go to existing employees before new hires." },
    ],
    retailRulesTitle: "Retail",
    retailRules: [
      { title: "72 hours' notice", desc: "Schedules must be given 72 hours before the first shift on them." },
      { title: "No on-call shifts", desc: "Employees cannot be scheduled on call." },
      {
        title: "No late changes",
        desc: "Shifts cannot be cancelled or added with less than 72 hours' notice unless the employee agrees.",
      },
    ],
    premiumsEyebrow: "03 — Change premiums",
    premiumsTitle: "What a late change costs in fast food",
    premiumsNotice: "Notice given",
    premiumsAdded: "Hours added or moved",
    premiumsReduced: "Hours reduced",
    premiums: [
      { notice: "Less than 14 days, at least 7", added: "$10", reduced: "$20" },
      { notice: "Less than 7 days, at least 24 hours", added: "$15", reduced: "$45" },
      { notice: "Less than 24 hours", added: "$15", reduced: "$75" },
    ],
    finesTitle: "Fines",
    finesDesc:
      "$500 per violation per worker for a first violation, up to $750 for a second within two years, and up to $1,000 after that, on top of premiums and damages owed to the worker.",
    productEyebrow: "04 — What WizScheduler does",
    productTitle: "Enforced today, and what is next",
    productRows: [
      {
        title: "11 hours between shifts",
        status: "enforced",
        desc: "Set a minimum rest of 11 hours on a location and every generated schedule, algorithmic or AI, respects it across locations. Same-day split shifts are allowed.",
      },
      {
        title: "Availability, roles and hour caps",
        status: "enforced",
        desc: "Schedules only use hours staff said they can work, in roles they hold, under weekly and daily limits.",
      },
      {
        title: "14-day notice tracking",
        status: "roadmap",
        desc: "Not built yet. The free checker flags shifts inside the notice window today; in-app tracking is planned.",
      },
      {
        title: "Change premium flagging",
        status: "roadmap",
        desc: "Not built yet. Edits to a posted schedule are not costed automatically.",
      },
    ],
    enforced: "Enforced",
    roadmap: "Roadmap",
    ctaEyebrow: "05 — Start",
    ctaTitle: "Check a schedule you already have",
    ctaDesc: "Upload last week's schedule and see every clopening and short-notice shift in seconds. No account needed.",
    ctaChecker: "Open the free checker",
    ctaSignup: "Sign up free",
  },
  compare: {
    checkedOn: "Competitor details checked on",
    ctaSignup: "Sign up free",
    ctaHome: "Back to home",
  },
  checker: {
    metaTitle: "Free NYC Fair Workweek schedule checker",
    metaDesc:
      "Upload a shift schedule and find every clopening and short-notice shift under NYC's Fair Workweek Law. Free, no account, nothing stored.",
    eyebrow: "Free tool",
    title: "Check a schedule for",
    titleAccent: "clopenings",
    intro:
      "Upload a CSV or spreadsheet, or paste rows from one. We check for fewer than 11 hours between shifts and, if you tell us when the schedule was posted, for shifts inside the 14-day notice window.",
    comingSoonTitle: "Almost ready",
    comingSoonDesc: "The checker opens shortly. Sign up free and generate a compliant schedule in the app now.",
    upload: "Choose a file",
    uploadHint: "CSV or XLSX with employee, start and end columns.",
    pasteLabel: "Or paste rows from a spreadsheet",
    pastePlaceholder: "Employee\tStart\tEnd\nA.B.\t2026-10-05 16:00\t2026-10-06 00:00",
    sample: "Download a sample file",
    mappingTitle: "Confirm the columns",
    colEmployee: "Employee",
    colStart: "Shift start",
    colEnd: "Shift end",
    colUnset: "— choose —",
    publishedLabel: "Schedule posted on (optional)",
    publishedHint: "Enables the 14-day notice check.",
    timezoneLabel: "Timezone",
    check: "Check schedule",
    privacy:
      "Rows are sent to WizScheduler's API for evaluation and are not stored. You can replace names with initials first.",
    errNoRows: "No shift rows found. The file needs a header row plus at least one shift.",
    errMapping: "Pick a column for employee, start and end.",
    errParse: "Couldn't read that file. Export it as CSV or XLSX and try again.",
    errTooMany: "That's more than {max} shifts. Split the file and check each part.",
    errBusy: "The checker is busy. Try again in a minute.",
    errUnavailable: "Couldn't check right now. Try again later.",
    checking: "Checking…",
    resultsTitle: "Results",
    totalEmployees: "employees checked",
    totalClopenings: "clopenings",
    totalShortNotice: "short-notice shifts",
    noFindings: "No clopenings or short-notice shifts found.",
    clopening: "Clopening",
    shortNotice: "Short notice",
    restHours: "hours of rest",
    noticeDays: "days' notice",
    fixTitle: "Fix this schedule automatically",
    fixDesc: "WizScheduler builds schedules that respect the 11-hour rule from the start.",
    fixCta: "Sign up free",
  },
};

export default en;
export type Copy = typeof en;
```

`src/i18n/es.ts`
```ts
import generated from "./generated/es";
import type { Copy } from "./en";

const es: Copy = {
  ...generated,
  nav: {
    features: "Funciones",
    nyc: "Fair Workweek NYC",
    checker: "Verificador de horarios gratis",
    compare: "Comparar con 7shifts",
    language: "Idioma",
    english: "English",
    spanish: "Español",
  },
  notFound: {
    title: "Página no encontrada",
    desc: "Ese enlace no lleva a ninguna parte. La página de inicio sí.",
    home: "Volver al inicio",
  },
  legal: {
    englishOnly: "Este documento se publica en inglés. El texto en inglés es la versión vinculante.",
    backHome: "Volver al inicio",
  },
  nyc: {
    metaTitle: "Software de horarios para la ley Fair Workweek de NYC",
    metaDesc:
      "Programa turnos de comida rápida y comercio en Nueva York respetando los 14 días de aviso, las 11 horas entre turnos y las primas por cambios. Incluye un verificador gratuito.",
    eyebrow: "Nueva York",
    title: "Horarios Fair Workweek,",
    titleAccent: "sin multas",
    intro:
      "La ley Fair Workweek de la Ciudad de Nueva York fija reglas para cómo los empleadores de comida rápida y comercio programan a su personal. WizScheduler aplica la regla de descanso mientras construye el horario y señala el resto.",
    reviewedOn: "Resumen legal revisado el",
    source: "Fuente: Departamento de Protección al Consumidor y al Trabajador de NYC (DCWP)",
    sourceUrl: "https://www.nyc.gov/site/dca/workers/workersrights/fastfood-retail-workers.page",
    coveredEyebrow: "01 — A quién aplica",
    coveredTitle: "Dos industrias, dos conjuntos de reglas",
    fastFoodTitle: "Comida rápida",
    fastFoodDesc:
      "Establecimientos que sirven comida o bebida para consumo inmediato, toman pedidos en mostrador y forman parte de una cadena de 30 o más establecimientos a nivel nacional. Los franquiciados cuentan.",
    retailTitle: "Comercio minorista",
    retailDesc: "Negocios minoristas con 20 o más empleados en establecimientos de la Ciudad de Nueva York.",
    rulesEyebrow: "02 — Las reglas",
    fastFoodRulesTitle: "Comida rápida",
    fastFoodRules: [
      { title: "14 días de aviso", desc: "Los horarios escritos deben entregarse 14 días antes del primer turno." },
      {
        title: "11 horas entre turnos",
        desc: "Un turno de cierre seguido de uno de apertura con menos de 11 horas entre ambos es un «clopening». Requiere el consentimiento escrito del trabajador y una prima de $100 cada vez.",
      },
      {
        title: "Primas por cambios",
        desc: "Los cambios con menos de 14 días de aviso cuestan de $10 a $75 por cambio, según lo tarde que se hagan y si se pierden horas.",
      },
      { title: "Ofrecer horas primero al personal actual", desc: "Los turnos abiertos van a los empleados existentes antes que a nuevas contrataciones." },
    ],
    retailRulesTitle: "Comercio minorista",
    retailRules: [
      { title: "72 horas de aviso", desc: "Los horarios deben entregarse 72 horas antes del primer turno." },
      { title: "Sin turnos de guardia", desc: "No se puede programar a los empleados en modalidad de guardia («on call»)." },
      {
        title: "Sin cambios de última hora",
        desc: "No se pueden cancelar ni añadir turnos con menos de 72 horas de aviso salvo que el empleado acepte.",
      },
    ],
    premiumsEyebrow: "03 — Primas por cambios",
    premiumsTitle: "Lo que cuesta un cambio tardío en comida rápida",
    premiumsNotice: "Aviso dado",
    premiumsAdded: "Horas añadidas o movidas",
    premiumsReduced: "Horas reducidas",
    premiums: [
      { notice: "Menos de 14 días, al menos 7", added: "$10", reduced: "$20" },
      { notice: "Menos de 7 días, al menos 24 horas", added: "$15", reduced: "$45" },
      { notice: "Menos de 24 horas", added: "$15", reduced: "$75" },
    ],
    finesTitle: "Multas",
    finesDesc:
      "$500 por infracción y por trabajador la primera vez, hasta $750 por una segunda en dos años y hasta $1,000 después, además de las primas y daños debidos al trabajador.",
    productEyebrow: "04 — Qué hace WizScheduler",
    productTitle: "Lo que se aplica hoy y lo que viene",
    productRows: [
      {
        title: "11 horas entre turnos",
        status: "enforced",
        desc: "Fija un descanso mínimo de 11 horas en una ubicación y cada horario generado, algorítmico o con AI, lo respeta entre ubicaciones. Se permiten turnos partidos el mismo día.",
      },
      {
        title: "Disponibilidad, roles y límites de horas",
        status: "enforced",
        desc: "Los horarios solo usan las horas que el personal indicó, en los roles que tiene, bajo límites semanales y diarios.",
      },
      {
        title: "Seguimiento del aviso de 14 días",
        status: "roadmap",
        desc: "Aún no está construido. El verificador gratuito señala hoy los turnos dentro del plazo de aviso; el seguimiento dentro de la app está planificado.",
      },
      {
        title: "Señalización de primas por cambios",
        status: "roadmap",
        desc: "Aún no está construido. Las ediciones a un horario publicado no se costean automáticamente.",
      },
    ],
    enforced: "Se aplica",
    roadmap: "En desarrollo",
    ctaEyebrow: "05 — Empezar",
    ctaTitle: "Verifica un horario que ya tienes",
    ctaDesc: "Sube el horario de la semana pasada y ve cada clopening y cada turno con poco aviso en segundos. Sin cuenta.",
    ctaChecker: "Abrir el verificador gratis",
    ctaSignup: "Regístrate gratis",
  },
  compare: {
    checkedOn: "Datos del competidor verificados el",
    ctaSignup: "Regístrate gratis",
    ctaHome: "Volver al inicio",
  },
  checker: {
    metaTitle: "Verificador gratuito de horarios Fair Workweek NYC",
    metaDesc:
      "Sube un horario de turnos y encuentra cada clopening y cada turno con poco aviso según la ley Fair Workweek de NYC. Gratis, sin cuenta, sin almacenar nada.",
    eyebrow: "Herramienta gratuita",
    title: "Revisa un horario en busca de",
    titleAccent: "clopenings",
    intro:
      "Sube un CSV o una hoja de cálculo, o pega filas de una. Buscamos menos de 11 horas entre turnos y, si nos dices cuándo se publicó el horario, turnos dentro del plazo de aviso de 14 días.",
    comingSoonTitle: "Casi listo",
    comingSoonDesc: "El verificador abre en breve. Regístrate gratis y genera ya un horario conforme en la app.",
    upload: "Elegir archivo",
    uploadHint: "CSV o XLSX con columnas de empleado, inicio y fin.",
    pasteLabel: "O pega filas desde una hoja de cálculo",
    pastePlaceholder: "Empleado\tInicio\tFin\nA.B.\t2026-10-05 16:00\t2026-10-06 00:00",
    sample: "Descargar un archivo de ejemplo",
    mappingTitle: "Confirma las columnas",
    colEmployee: "Empleado",
    colStart: "Inicio del turno",
    colEnd: "Fin del turno",
    colUnset: "— elegir —",
    publishedLabel: "Horario publicado el (opcional)",
    publishedHint: "Activa la verificación del aviso de 14 días.",
    timezoneLabel: "Zona horaria",
    check: "Verificar horario",
    privacy:
      "Las filas se envían a la API de WizScheduler para evaluarlas y no se almacenan. Puedes reemplazar los nombres por iniciales antes.",
    errNoRows: "No se encontraron turnos. El archivo necesita una fila de encabezado y al menos un turno.",
    errMapping: "Elige una columna para empleado, inicio y fin.",
    errParse: "No se pudo leer ese archivo. Expórtalo como CSV o XLSX e inténtalo de nuevo.",
    errTooMany: "Son más de {max} turnos. Divide el archivo y verifica cada parte.",
    errBusy: "El verificador está ocupado. Inténtalo en un minuto.",
    errUnavailable: "No se pudo verificar ahora. Inténtalo más tarde.",
    checking: "Verificando…",
    resultsTitle: "Resultados",
    totalEmployees: "empleados revisados",
    totalClopenings: "clopenings",
    totalShortNotice: "turnos con poco aviso",
    noFindings: "No se encontraron clopenings ni turnos con poco aviso.",
    clopening: "Clopening",
    shortNotice: "Poco aviso",
    restHours: "horas de descanso",
    noticeDays: "días de aviso",
    fixTitle: "Corrige este horario automáticamente",
    fixDesc: "WizScheduler construye horarios que respetan la regla de 11 horas desde el inicio.",
    fixCta: "Regístrate gratis",
  },
};

export default es;
```

`src/i18n/index.ts`
```ts
import en, { type Copy } from "./en";
import es from "./es";
import type { Locale } from "../lib/links";

const COPY: Record<Locale, Copy> = { en, es };

export function getCopy(locale: Locale): Copy {
  return COPY[locale];
}

export type { Copy };
```

- [ ] **Step 4: Write the parity test**

`tests/locale-parity.test.ts`
```ts
import { describe, expect, it } from "vitest";
import en from "../src/i18n/en";
import es from "../src/i18n/es";

type Tree = { [k: string]: string | Tree | Tree[] };

function leaves(node: Tree | Tree[] | string, prefix = ""): string[] {
  if (typeof node === "string") return [prefix];
  if (Array.isArray(node)) return node.flatMap((n, i) => leaves(n, `${prefix}[${i}]`));
  return Object.entries(node).flatMap(([k, v]) => leaves(v as Tree, prefix ? `${prefix}.${k}` : k));
}

describe("locale parity", () => {
  it("en and es have identical leaf paths", () => {
    expect(leaves(es as unknown as Tree).sort()).toEqual(leaves(en as unknown as Tree).sort());
  });

  it("no leaf is empty in either locale", () => {
    const empties = (t: Tree) =>
      leaves(t).filter((path) => {
        const value = path
          .replace(/\[(\d+)\]/g, ".$1")
          .split(".")
          .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], t);
        return typeof value !== "string" || value.trim() === "";
      });
    expect(empties(en as unknown as Tree)).toEqual([]);
    expect(empties(es as unknown as Tree)).toEqual([]);
  });
});
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run tests/locale-parity.test.ts`
Expected: 2 tests pass. A failure lists the exact leaf path that differs.

Run: `npm run check`
Expected: 0 errors. (A missing Spanish key in `es.ts` is reported here as a type error against `Copy`.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(i18n): port app copy for en/es and add copy for the new pages

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Theme, base layout, nav, footer, section rule, 404, direction guard

**Files:**
- Create: `src/theme.ts`, `src/components/Seo.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`, `src/components/SectionRule.astro`, `src/layouts/Base.astro`, `src/pages/404.astro`
- Modify: `src/pages/index.astro` (use the layout; still replaced in Task 4)
- Test: `tests/logical-direction.test.ts`

**Interfaces:**
- Consumes: `getCopy`, `localePath`, `alternates`, `appLink`, `SITE_URL`
- Produces: `m` (theme object) from `src/theme.ts`; `Base.astro` props `{ locale: Locale; title: string; description: string; path: string; noindex?: boolean }` with a default slot and a `head` named slot; `SectionRule.astro` props `{ eyebrow?: string; title?: string; id?: string }`

- [ ] **Step 1: Write the theme**

`src/theme.ts` — the `marketing` object from the app's `frontend/src/theme.ts`, verbatim, exported as `m`:
```ts
/**
 * Marketing surface tokens ("The Rota"). Copied from the app's theme.ts
 * `marketing` export so classes port unchanged. Keep in sync by hand.
 */
export const m = {
  page: "bg-newsprint text-ink",
  surface: "bg-paper",
  inverse: "bg-ink text-newsprint",
  text: {
    display: "font-display text-ink",
    body: "font-body text-ink",
    muted: "font-body text-ink/70",
    meta: "font-data text-ink/70 uppercase tracking-[0.14em] text-xs",
    data: "font-data tabular-nums text-ink",
    clear: "text-clear",
  },
  mark: "bg-marker text-ink px-1.5 -mx-0.5 box-decoration-clone",
  rule: { line: "border-rule", heavy: "border-ink/25", grid: "border-rule/70" },
  btn: {
    primary:
      "inline-flex items-center justify-center font-display uppercase " +
      "tracking-wide px-6 py-3 bg-ink text-newsprint border border-ink " +
      "hover:bg-marker hover:border-marker hover:text-ink transition-colors " +
      "focus-visible:outline focus-visible:outline-2 " +
      "focus-visible:outline-offset-2 focus-visible:outline-ink " +
      "disabled:opacity-40 disabled:pointer-events-none",
    secondary:
      "inline-flex items-center justify-center font-display uppercase " +
      "tracking-wide px-6 py-3 bg-transparent text-ink border border-ink/40 " +
      "hover:border-ink transition-colors " +
      "focus-visible:outline focus-visible:outline-2 " +
      "focus-visible:outline-offset-2 focus-visible:outline-ink " +
      "disabled:opacity-40 disabled:pointer-events-none",
    link:
      "font-body underline underline-offset-4 decoration-rule " +
      "hover:decoration-marker transition-colors " +
      "focus-visible:outline focus-visible:outline-2 " +
      "focus-visible:outline-offset-2 focus-visible:outline-ink",
  },
  input:
    "w-full font-body bg-paper text-ink border border-rule px-3 py-2 " +
    "placeholder:text-ink/40 focus:outline-none focus:border-ink " +
    "focus-visible:outline focus-visible:outline-2 " +
    "focus-visible:outline-offset-1 focus-visible:outline-ink " +
    "transition-colors",
  label: "block font-data text-xs uppercase tracking-[0.14em] text-ink/70 mb-1.5",
  alert: {
    error: "border-s-2 border-marker bg-marker/5 text-ink px-4 py-3 font-body text-sm",
    success: "border-s-2 border-clear bg-clear/5 text-ink px-4 py-3 font-body text-sm",
    info: "border-s-2 border-rule bg-ink/[0.03] text-ink px-4 py-3 font-body text-sm",
  },
} as const;
```

- [ ] **Step 2: Write the chrome components**

`src/components/Seo.astro`
```astro
---
import { SITE_URL } from "../lib/site";
import { alternates, localePath, type Locale } from "../lib/links";

interface Props {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}
const { locale, title, description, path, noindex = false } = Astro.props;
const canonical = `${SITE_URL}${localePath(locale, path)}`;
const ogLocale = locale === "es" ? "es_US" : "en_US";
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
{noindex && <meta name="robots" content="noindex" />}
{alternates(path).map((a) => <link rel="alternate" hreflang={a.locale} href={`${SITE_URL}${a.href}`} />)}
<link rel="alternate" hreflang="x-default" href={`${SITE_URL}${localePath("en", path)}`} />
<meta property="og:type" content="website" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:site_name" content="Wiz Scheduler" />
<meta property="og:locale" content={ogLocale} />
<meta property="og:image" content={`${SITE_URL}/og-image.png`} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
```

`src/components/Nav.astro`
```astro
---
import { m } from "../theme";
import { getCopy } from "../i18n";
import { appLink } from "../lib/site";
import { LOCALES, localePath, type Locale } from "../lib/links";

interface Props {
  locale: Locale;
  path: string;
}
const { locale, path } = Astro.props;
const t = getCopy(locale);
const langName: Record<Locale, string> = { en: t.nav.english, es: t.nav.spanish };
const links = [
  { href: localePath(locale, "/nyc-fair-workweek-scheduling"), label: t.nav.nyc },
  { href: localePath(locale, "/free-schedule-checker"), label: t.nav.checker },
  { href: localePath(locale, "/features"), label: t.nav.features },
];
---
<nav class={`sticky top-0 z-50 bg-newsprint border-b ${m.rule.line}`}>
  <div class="max-w-[92rem] mx-auto px-6 h-16 flex items-center justify-between gap-6">
    <a href={localePath(locale, "/")} class="flex items-center gap-3 min-w-0 shrink-0">
      <img src="/favicon.svg" alt="" class="w-7 h-7 shrink-0" />
      <span class={`${m.text.display} font-display text-lg font-semibold uppercase tracking-[0.06em] hidden sm:inline truncate`}>
        {t.common.appName}
      </span>
    </a>
    <div class="hidden lg:flex items-center gap-6">
      {links.map((l) => <a href={l.href} class={`${m.btn.link} text-sm`}>{l.label}</a>)}
    </div>
    <div class="flex items-center gap-3 sm:gap-5 shrink-0">
      <ul class="flex items-center gap-1" aria-label={t.nav.language}>
        {LOCALES.map((l) => (
          <li>
            <a
              href={localePath(l, path)}
              hreflang={l}
              lang={l}
              title={langName[l]}
              aria-current={l === locale ? "page" : undefined}
              class={`${m.text.meta} px-2 py-1 border transition-colors ${
                l === locale ? "border-ink !text-ink" : `${m.rule.line} hover:!text-ink`
              }`}
            >
              {l.toUpperCase()}
            </a>
          </li>
        ))}
      </ul>
      <a href={appLink("/login")} class={`${m.btn.link} text-sm hidden sm:inline`}>{t.login.signIn}</a>
      <a href={appLink("/register")} class={`${m.btn.primary} !px-4 !py-2 text-sm`}>{t.register.registerBtn}</a>
    </div>
  </div>
</nav>
```

`src/components/Footer.astro`
```astro
---
import { m } from "../theme";
import { getCopy } from "../i18n";
import { localePath, type Locale } from "../lib/links";

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const t = getCopy(locale);
const links = [
  { to: "/features", label: t.landing.featuresLink },
  { to: "/nyc-fair-workweek-scheduling", label: t.nav.nyc },
  { to: "/free-schedule-checker", label: t.nav.checker },
  { to: "/compare/7shifts", label: t.nav.compare },
  { to: "/privacy-policy", label: t.gdpr.privacyPolicy },
  { to: "/terms", label: t.gdpr.termsOfService },
  { to: "/dpa", label: t.gdpr.dpa },
];
---
<footer class={`border-t ${m.rule.heavy} mt-24`}>
  <div class="max-w-[92rem] mx-auto px-6 py-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="" class="w-5 h-5" />
      <span class={`${m.text.meta} !text-ink`}>{t.common.appName}</span>
    </div>
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
      {links.map((l) => <a href={localePath(locale, l.to)} class={`${m.btn.link} text-sm`}>{l.label}</a>)}
    </div>
    <span class={m.text.meta}>Suggestival LLC</span>
  </div>
</footer>
```

`src/components/SectionRule.astro`
```astro
---
import { m } from "../theme";

interface Props {
  eyebrow?: string;
  title?: string;
  id?: string;
}
const { eyebrow, title, id } = Astro.props;
---
<div id={id} class="scroll-mt-20">
  <div class={`border-t ${m.rule.heavy}`}></div>
  {(eyebrow || title) && (
    <div class="pt-6 pb-10 flex flex-col gap-3 md:flex-row md:items-baseline md:gap-8">
      {eyebrow && <span class={`${m.text.meta} shrink-0 md:w-40`}>{eyebrow}</span>}
      {title && (
        <h2 class={`${m.text.display} font-display text-3xl md:text-5xl font-semibold leading-[1.05]`}>{title}</h2>
      )}
    </div>
  )}
</div>
```

`src/layouts/Base.astro`
```astro
---
import "../styles/global.css";
import Seo from "../components/Seo.astro";
import Nav from "../components/Nav.astro";
import Footer from "../components/Footer.astro";
import type { Locale } from "../lib/links";

interface Props {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}
const { locale, title, description, path, noindex } = Astro.props;
---
<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/Archivo-2.woff2" />
    <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/SourceSans3-6.woff2" />
    <Seo locale={locale} title={title} description={description} path={path} noindex={noindex} />
    <slot name="head" />
  </head>
  <body>
    <div class="min-h-screen bg-newsprint text-ink font-body">
      <Nav locale={locale} path={path} />
      <slot />
      <Footer locale={locale} />
    </div>
  </body>
</html>
```

`src/pages/404.astro`
```astro
---
import Base from "../layouts/Base.astro";
import { getCopy } from "../i18n";
import { m } from "../theme";

const t = getCopy("en");
---
<Base locale="en" title={`${t.notFound.title} | ${t.common.appName}`} description={t.notFound.desc} path="/404" noindex>
  <main class="max-w-[92rem] mx-auto px-6 py-24">
    <p class={`${m.text.meta} mb-6`}>404</p>
    <h1 class={`${m.text.display} font-display text-5xl font-semibold mb-4`}>{t.notFound.title}</h1>
    <p class={`${m.text.muted} mb-8 max-w-[50ch]`}>{t.notFound.desc}</p>
    <a href="/" class={m.btn.primary}>{t.notFound.home}</a>
  </main>
</Base>
```

`src/pages/index.astro` (interim, exercises the layout)
```astro
---
import Base from "../layouts/Base.astro";
import { getCopy } from "../i18n";

const t = getCopy("en");
---
<Base locale="en" title={t.common.appName} description={t.landing.heroDesc} path="/">
  <main class="max-w-[92rem] mx-auto px-6 py-24">
    <h1 class="font-display text-5xl font-semibold">{t.landing.heroTitle} {t.landing.heroTitleAccent}</h1>
  </main>
</Base>
```

- [ ] **Step 3: Write the direction guard test**

`tests/logical-direction.test.ts`
```ts
/**
 * RTL guard ported from the app (frontend/src/utils/logicalDirection.test.ts).
 * Both launch locales are LTR, but the app's rule keeps a future RTL locale a
 * copy task rather than a CSS audit.
 */
import { describe, expect, it } from "vitest";

const SOURCES = import.meta.glob("../src/**/*.{astro,tsx,ts}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const BANNED: [RegExp, string][] = [
  [/\btext-left\b/, "text-start"],
  [/\btext-right\b/, "text-end"],
  [/\bml-(?:auto|px|full|\d+(?:\.\d+)?|\[[^\]]*\])\b/, "ms-*"],
  [/\bmr-(?:auto|px|full|\d+(?:\.\d+)?|\[[^\]]*\])\b/, "me-*"],
  [/\bpl-(?:auto|px|full|\d+(?:\.\d+)?|\[[^\]]*\])\b/, "ps-*"],
  [/\bpr-(?:auto|px|full|\d+(?:\.\d+)?|\[[^\]]*\])\b/, "pe-*"],
  [/\bborder-l\b/, "border-s"],
  [/\bborder-r\b/, "border-e"],
  [/\brounded-l\b/, "rounded-s"],
  [/\brounded-r\b/, "rounded-e"],
  [/\bleft-0\b/, "start-0"],
  [/\bright-0\b/, "end-0"],
];

describe("logical direction utilities", () => {
  it("no source file uses a physical-direction utility", () => {
    const offenders: string[] = [];
    for (const [file, source] of Object.entries(SOURCES)) {
      if (file.includes("/i18n/generated/")) continue;
      source.split("\n").forEach((line, i) => {
        for (const [pattern, fix] of BANNED) {
          if (pattern.test(line)) offenders.push(`${file}:${i + 1}: use ${fix} — ${line.trim()}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it("does not flag colour classes that merely start with a banned prefix", () => {
    const decoys = ['class="border border-red-300"', 'class="border-rule text-ink"', 'class="ms-2 text-start"'];
    for (const decoy of decoys) expect(BANNED.some(([p]) => p.test(decoy))).toBe(false);
  });
});
```

- [ ] **Step 4: Run tests, typecheck, build**

Run: `npx vitest run`
Expected: all green (links, parity, direction).

Run: `npm run check && npm run build`
Expected: 0 errors; `dist/index.html` contains `<link rel="canonical" href="https://wizscheduler.com/">`, `hreflang="es"`, and `href="https://app.wizscheduler.com/register"`; `dist/404.html` exists.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(layout): theme, base layout with SEO head, nav, footer, section rule and 404

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Rota hero island and the home page

**Files:**
- Create: `src/islands/rotaData.ts`, `src/islands/RotaHero.tsx`, `src/views/Home.astro`, `src/pages/es/index.astro`
- Modify: `src/pages/index.astro` (replace the interim page)
- Test: `tests/islands/RotaHero.test.tsx`

**Interfaces:**
- Consumes: `m`, `getCopy`, `appLink`, `localePath`, `Base.astro`, `SectionRule.astro`
- Produces: `RotaHero` React component with props `{ copy: RotaCopy; registerUrl: string }` where `RotaCopy = Pick<Copy["landing"], "badge" | "heroTitle" | "heroTitleAccent" | "heroDesc" | "getStarted" | "viewPricing" | "viewDemo">`; `Home.astro` with props `{ locale: Locale }`

- [ ] **Step 1: Copy the rota data and write the failing island test**

```bash
cp ${APP_REPO:-../wiz_scheduler}/frontend/src/components/marketing/rotaData.ts src/islands/rotaData.ts
```

`tests/islands/RotaHero.test.tsx`
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RotaHero from "../../src/islands/RotaHero";
import en from "../../src/i18n/en";

describe("RotaHero", () => {
  it("renders the headline, highlighted accent and the register link", () => {
    render(<RotaHero copy={en.landing} registerUrl="https://app.example.com/register" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.landing.heroTitle);
    expect(screen.getByText(en.landing.heroTitleAccent)).toHaveClass("bg-marker");
    expect(screen.getByRole("link", { name: en.landing.getStarted })).toHaveAttribute(
      "href",
      "https://app.example.com/register",
    );
  });

  it("keeps the decorative rota out of the accessibility tree", () => {
    const { container } = render(<RotaHero copy={en.landing} registerUrl="/r" />);
    expect(container.querySelector('[aria-hidden="true"] [data-total="shifts"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/islands/RotaHero.test.tsx`
Expected: FAIL, cannot resolve `../../src/islands/RotaHero`.

- [ ] **Step 3: Write the island**

`src/islands/RotaHero.tsx` — the app's `RotaHero.tsx` with `useLanguage` replaced by a `copy` prop and `Link` replaced by `<a>`:
```tsx
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { m } from "../theme";
import { BANDS, CELLS, DAYS, TOTALS } from "./rotaData";
import type { Copy } from "../i18n/en";

export type RotaCopy = Pick<
  Copy["landing"],
  "badge" | "heroTitle" | "heroTitleAccent" | "heroDesc" | "getStarted" | "viewPricing" | "viewDemo"
>;

interface Props {
  copy: RotaCopy;
  registerUrl: string;
}

export default function RotaHero({ copy, registerUrl }: Props) {
  const reduce = useReducedMotion();

  const cellAt = (day: number, band: number) => CELLS.find((c) => c.day === day && c.band === band);
  const cellDelay = (day: number, band: number) => 0.4 + (day + band) * 0.024;

  const cellAnim = (c: { day: number; band: number; retried: boolean }) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, scale: 0.94 },
          animate: {
            opacity: 1,
            scale: 1,
            backgroundColor: c.retried
              ? ["rgba(255,90,31,0)", "rgba(255,90,31,0.28)", "rgba(255,90,31,0)"]
              : undefined,
          },
          transition: {
            duration: 0.28,
            delay: cellDelay(c.day, c.band),
            backgroundColor: { duration: 0.5, delay: 0.9, times: [0, 0.4, 1] },
          },
        };

  const Count = ({ to }: { to: number }) => {
    const [n, setN] = useState(reduce ? to : 0);
    useEffect(() => {
      if (reduce || to === 0) {
        setN(to);
        return;
      }
      let raf = 0;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start - 1050) / 350);
        if (p >= 0) setN(Math.round(to * p));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [to]);
    return <>{n}</>;
  };

  return (
    <section className="max-w-[92rem] mx-auto px-6 pt-16 pb-20 grid gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16 lg:items-center">
      <div>
        <p className={`${m.text.meta} mb-6`}>{copy.badge}</p>
        <h1 className={`${m.text.display} font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[0.95] mb-6`}>
          {copy.heroTitle} <span className={m.mark}>{copy.heroTitleAccent}</span>
        </h1>
        <p className={`${m.text.muted} text-lg leading-relaxed mb-9 max-w-[46ch]`}>{copy.heroDesc}</p>
        <div className="flex flex-wrap items-center gap-4">
          <a href={registerUrl} className={m.btn.primary}>
            {copy.getStarted}
          </a>
          <a href="#pricing" className={m.btn.link}>
            {copy.viewPricing}
          </a>
          <a href="#demo" className={m.btn.link}>
            {copy.viewDemo}
          </a>
        </div>
      </div>

      {/* Decorative rota: day/band labels and cell contents are not localized, so it is hidden from AT. */}
      <div aria-hidden="true" className={`${m.surface} border ${m.rule.heavy}`}>
        <div
          className="grid [--label-w:2.25rem] sm:[--label-w:4.5rem]"
          style={{ gridTemplateColumns: `var(--label-w) repeat(${DAYS.length}, minmax(0, 1fr))` }}
        >
          <div className={`border-b ${m.rule.grid}`} />
          {DAYS.map((d, i) => (
            <motion.div
              key={d}
              initial={reduce ? undefined : { opacity: 0 }}
              animate={reduce ? undefined : { opacity: 1 }}
              transition={reduce ? undefined : { delay: 0.2 + i * 0.03 }}
              className={`${m.text.meta} border-b border-s ${m.rule.grid} px-1 py-2.5 sm:px-2 text-center`}
            >
              <span className="sm:hidden">{d.charAt(0)}</span>
              <span className="hidden sm:inline">{d}</span>
            </motion.div>
          ))}

          {BANDS.map((band, b) => (
            <div key={band} className="contents">
              <div className={`${m.text.meta} border-b ${m.rule.grid} px-1 py-3 sm:px-2 flex items-center justify-center sm:justify-start`}>
                <span className="sm:hidden">{band.charAt(0)}</span>
                <span className="hidden sm:inline">{band}</span>
              </div>
              {DAYS.map((_, d) => {
                const cell = cellAt(d, b);
                return (
                  <motion.div
                    key={`${band}-${d}`}
                    {...(cell ? cellAnim(cell) : {})}
                    className={`border-b border-s ${m.rule.grid} px-1.5 py-2 sm:px-2 sm:py-3 min-h-[2.75rem] sm:min-h-[4.25rem] transition-colors ${
                      cell ? "bg-ink/[0.06] hover:bg-marker/10 sm:bg-transparent" : ""
                    }`}
                  >
                    {cell && (
                      <>
                        <div className={`${m.text.body} text-xs sm:text-sm font-medium leading-tight truncate`}>{cell.role}</div>
                        <div className={`${m.text.data} hidden sm:block text-xs text-ink/70 mt-1`}>{cell.hours}</div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-4 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className={`${m.text.data} text-sm`}>
            <span data-total="shifts">
              <Count to={TOTALS.shifts} />
            </span>{" "}
            <span className="text-ink/70">shifts</span>
          </span>
          <span className={`${m.text.data} text-sm`}>
            <span data-total="people">
              <Count to={TOTALS.people} />
            </span>{" "}
            <span className="text-ink/70">people</span>
          </span>
          <span className={`${m.text.data} text-sm ${m.text.clear}`}>
            <span data-total="violations">{TOTALS.violations}</span> rest violations
          </span>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the island test**

Run: `npx vitest run tests/islands/RotaHero.test.tsx`
Expected: 2 tests pass.

- [ ] **Step 5: Write the home view and both route files**

`src/views/Home.astro` — the app's `Landing.tsx`, section for section:
```astro
---
import Base from "../layouts/Base.astro";
import SectionRule from "../components/SectionRule.astro";
import RotaHero from "../islands/RotaHero";
import { m } from "../theme";
import { getCopy } from "../i18n";
import { appLink } from "../lib/site";
import { localePath, type Locale } from "../lib/links";

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const t = getCopy(locale);
const L = (p: string) => localePath(locale, p);

const principalFeatures = [
  { title: t.landing.featAITitle, desc: t.landing.featAIDesc },
  { title: t.landing.featStrategiesTitle, desc: t.landing.featStrategiesDesc },
  { title: t.landing.featMultiLocTitle, desc: t.landing.featMultiLocDesc },
];
const supportingFeatures = [
  { title: t.landing.featHourCapsTitle, desc: t.landing.featHourCapsDesc },
  { title: t.landing.featDayRulesTitle, desc: t.landing.featDayRulesDesc },
  { title: t.landing.featSelfServiceTitle, desc: t.landing.featSelfServiceDesc },
  { title: t.landing.feat7shiftsTitle, desc: t.landing.feat7shiftsDesc },
  { title: t.landing.featDeputyTitle, desc: t.landing.featDeputyDesc },
  { title: t.landing.featGDPRTitle, desc: t.landing.featGDPRDesc },
  { title: t.landing.featAffinitiesTitle, desc: t.landing.featAffinitiesDesc },
  { title: t.landing.featRoleEquivTitle, desc: t.landing.featRoleEquivDesc },
  { title: t.landing.featLangsTitle, desc: t.landing.featLangsDesc },
];
const strategies = [
  { name: t.landing.stratRotation, tag: t.landing.stratRotationTag, desc: t.landing.stratRotationDesc },
  { name: t.landing.stratRotationHistory, tag: t.landing.stratRotationHistoryTag, desc: t.landing.stratRotationHistoryDesc },
  { name: t.landing.stratMaxHours, tag: t.landing.stratMaxHoursTag, desc: t.landing.stratMaxHoursDesc },
];
const aiStrategy = { name: t.landing.stratAI, tag: t.landing.stratAITag, desc: t.landing.stratAIDesc };
const hardInputs = [
  { title: t.landing.inputAvailabilityTitle, desc: t.landing.inputAvailabilityDesc },
  { title: t.landing.inputRolesTitle, desc: t.landing.inputRolesDesc },
  { title: t.landing.inputHourRestrictionsTitle, desc: t.landing.inputHourRestrictionsDesc },
  { title: t.landing.inputDayRulesTitle, desc: t.landing.inputDayRulesDesc },
  { title: t.landing.inputMinRestTitle, desc: t.landing.inputMinRestDesc },
  { title: t.landing.inputAssociationTitle, desc: t.landing.inputAssociationDesc },
];
const softInputs = [
  { title: t.landing.inputDayPrefsTitle, desc: t.landing.inputDayPrefsDesc },
  { title: t.landing.inputHourRangeTitle, desc: t.landing.inputHourRangeDesc },
  { title: t.landing.inputFreqCapsTitle, desc: t.landing.inputFreqCapsDesc },
];
const compliance = [
  { title: t.landing.compDataExportTitle, desc: t.landing.compDataExportDesc },
  { title: t.landing.compErasureTitle, desc: t.landing.compErasureDesc },
  { title: t.landing.compConsentTitle, desc: t.landing.compConsentDesc },
  { title: t.landing.compNoNamesTitle, desc: t.landing.compNoNamesDesc },
];
const exampleRows = [
  { item: t.landing.exampleSchedules, usage: t.landing.exampleSchedulesUsage, cost: t.landing.exampleSchedulesCost },
  { item: t.landing.exampleAI, usage: t.landing.exampleAIUsage, cost: t.landing.exampleAICost },
  { item: t.landing.exampleStorage, usage: t.landing.exampleStorageUsage, cost: t.landing.exampleStorageCost },
  { item: t.landing.exampleEmployees, usage: t.landing.exampleEmployeesUsage, cost: t.landing.exampleEmployeesCost },
];
const meters = [
  { tag: "AI", title: t.landing.aiScheduling, included: t.landing.aiCredits, includedValue: "$10 · $25 · $50", overage: "Cost x 130%", note: t.landing.aiOverageNote },
  { tag: "RUNS", title: t.landing.schedules, included: t.landing.included, includedValue: "50 / month", overage: "$0.10 / 50", note: t.landing.schedulesOverageNote },
  { tag: "DATA", title: t.landing.storage, included: t.landing.included, includedValue: "0.5 GB", overage: "$0.50 / GB", note: t.landing.storageOverageNote },
  { tag: "TEAM", title: t.landing.employees, included: t.landing.included, includedValue: "1,000", overage: "$1.00 / 1K", note: t.landing.employeesOverageNote },
];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Wiz Scheduler",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: t.landing.heroDesc,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};
const title = `${t.common.appName} — ${t.landing.badge}`;
---
<Base locale={locale} title={title} description={t.landing.heroDesc} path="/">
  <script slot="head" type="application/ld+json" is:inline set:html={JSON.stringify(jsonLd)} />

  <RotaHero client:load copy={t.landing} registerUrl={appLink("/register")} />

  <main class="max-w-[92rem] mx-auto px-6">
    <SectionRule eyebrow="01 — Capability" title={t.landing.featuresTitle} />
    <p class={`${m.text.muted} max-w-[60ch] mb-10`}>{t.landing.featuresDesc}</p>
    <div class="grid gap-10 md:grid-cols-3 mb-16">
      {principalFeatures.map((f) => (
        <div>
          <h3 class={`${m.text.display} font-display text-2xl font-semibold mb-3`}>{f.title}</h3>
          <p class={`${m.text.muted} leading-relaxed`}>{f.desc}</p>
        </div>
      ))}
    </div>
    <dl class={`border-t ${m.rule.line} mb-24`}>
      {supportingFeatures.map((f) => (
        <div class={`border-b ${m.rule.line} py-4 grid gap-1 md:grid-cols-[18rem_1fr] md:gap-8`}>
          <dt class={`${m.text.body} font-medium`}>{f.title}</dt>
          <dd class={`${m.text.muted} text-sm leading-relaxed`}>{f.desc}</dd>
        </div>
      ))}
    </dl>

    <div id="demo" class={`${m.inverse} -mx-6 px-6 py-20 mb-24 scroll-mt-20`}>
      <div class="max-w-5xl mx-auto">
        <p class={`${m.text.meta} !text-newsprint/60 mb-4`}>02 — Proof</p>
        <h2 class="font-display text-3xl md:text-5xl font-semibold leading-[1.05] mb-4">{t.landing.demoTitle}</h2>
        <p class="text-newsprint/70 font-body max-w-[60ch] mb-10">{t.landing.demoDesc}</p>
        <div class="relative w-full" style="padding-bottom: 56.25%">
          <iframe
            class="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/t1FblchNbb8"
            title={t.landing.demoTitle}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
        <div class="mt-10">
          <a href={L("/features")} class={`${m.btn.secondary} !border-newsprint/40 !text-newsprint hover:!border-newsprint`}>
            {t.landing.exploreDashboard}
          </a>
        </div>
      </div>
    </div>

    <SectionRule eyebrow="03 — Method" title={t.landing.strategiesTitle} />
    <p class={`${m.text.muted} max-w-[60ch] mb-10`}>{t.landing.strategiesDesc}</p>
    <div class={`${m.surface} border ${m.rule.heavy} p-6 md:p-10 mb-10`}>
      <p class={`${m.text.meta} mb-3`}><span class={m.mark}>{aiStrategy.tag}</span></p>
      <h3 class={`${m.text.display} font-display text-3xl font-semibold mb-4`}>{aiStrategy.name}</h3>
      <p class={`${m.text.muted} leading-relaxed max-w-[62ch]`}>{aiStrategy.desc}</p>
    </div>
    <div class={`grid gap-px md:grid-cols-3 bg-rule border ${m.rule.line} mb-24`}>
      {strategies.map((s) => (
        <div class="bg-newsprint p-6">
          <p class={`${m.text.meta} mb-2`}>{s.tag}</p>
          <h3 class={`${m.text.body} font-medium mb-2`}>{s.name}</h3>
          <p class={`${m.text.muted} text-sm leading-relaxed`}>{s.desc}</p>
        </div>
      ))}
    </div>

    <SectionRule eyebrow="04 — Inputs" title={t.landing.inputsTitle} />
    <p class={`${m.text.muted} max-w-[60ch] mb-10`}>{t.landing.inputsDesc}</p>
    <div class="grid gap-10 md:grid-cols-2 mb-8">
      <div>
        <p class={`${m.text.meta} mb-4`}>{t.landing.inputsHardHeading}</p>
        <dl class="space-y-4">
          {hardInputs.map((i) => (
            <div>
              <dt class={`${m.text.body} font-medium`}>{i.title}</dt>
              <dd class={`${m.text.muted} text-sm leading-relaxed`}>{i.desc}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <p class={`${m.text.meta} mb-4`}>{t.landing.inputsSoftHeading}</p>
        <dl class="space-y-4">
          {softInputs.map((i) => (
            <div>
              <dt class={`${m.text.body} font-medium`}>{i.title}</dt>
              <dd class={`${m.text.muted} text-sm leading-relaxed`}>{i.desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
    <p class={`${m.text.muted} text-sm max-w-[60ch] mb-2`}>{t.landing.inputsTemplatesNote}</p>
    <p class={`${m.text.meta} mb-24`}>{t.landing.inputsNotYet}</p>

    <SectionRule id="pricing" eyebrow="05 — Cost" title={t.landing.pricingTitle} />
    <p class={`${m.text.muted} max-w-[60ch] mb-10`}>{t.landing.pricingDesc}</p>
    <div class={`${m.surface} border ${m.rule.heavy} p-6 md:p-10 max-w-3xl mb-10`}>
      <p class={`${m.text.meta} mb-6`}>{t.landing.exampleTitle}</p>
      <div class="overflow-x-auto">
        <table class="w-full font-data text-sm tabular-nums">
          <thead>
            <tr class={`border-b ${m.rule.line}`}>
              <th class={`${m.text.meta} text-start pb-3`}>{t.landing.exampleItem}</th>
              <th class={`${m.text.meta} text-start pb-3`}>{t.landing.exampleUsage}</th>
              <th class={`${m.text.meta} text-end pb-3`}>{t.landing.exampleCost}</th>
            </tr>
          </thead>
          <tbody>
            <tr class={`border-b ${m.rule.grid}`}>
              <td class="py-2.5 text-start">{t.landing.exampleBase}</td>
              <td class="py-2.5 text-start"></td>
              <td class="py-2.5 text-end">$18.00</td>
            </tr>
            {exampleRows.map((r) => (
              <tr class={`border-b ${m.rule.grid}`}>
                <td class="py-2.5 text-start">{r.item}</td>
                <td class="py-2.5 text-start">{r.usage}</td>
                <td class={`py-2.5 text-end ${m.text.clear}`}>{r.cost}</td>
              </tr>
            ))}
            <tr class="border-t-2 border-ink font-semibold">
              <td class="py-4">{t.landing.exampleTotal}</td>
              <td></td>
              <td class="py-4 text-end text-lg">$22.25</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class={`border ${m.rule.line} p-6 md:p-8 mb-10`}>
      <p class={`${m.text.meta} mb-3`}>{t.landing.allInOnePlan}</p>
      <div class={`${m.text.display} font-display text-5xl font-semibold mb-2`}>
        $18<span class={`${m.text.muted} text-xl font-normal`}> {t.landing.pricePerMonth}</span>
      </div>
      <p class={`${m.text.clear} mb-3 max-w-[60ch]`}>{t.landing.normalStrategiesNote}</p>
      <p class={`${m.text.muted} mb-8 max-w-[60ch]`}>{t.landing.basePlanDesc}</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl">
        <div><div class={`${m.text.data} text-2xl font-semibold`}>{t.landing.aiPackFrom}</div><div class={`${m.text.meta} mt-1`}>{t.landing.aiCredits}</div></div>
        <div><div class={`${m.text.data} text-2xl font-semibold`}>50</div><div class={`${m.text.meta} mt-1`}>{t.landing.compSchedules}</div></div>
        <div><div class={`${m.text.data} text-2xl font-semibold`}>0.5 GB</div><div class={`${m.text.meta} mt-1`}>{t.landing.storageIncluded}</div></div>
        <div><div class={`${m.text.data} text-2xl font-semibold`}>1K</div><div class={`${m.text.meta} mt-1`}>{t.landing.employeesIncluded}</div></div>
      </div>
    </div>

    <div class={`grid gap-px md:grid-cols-4 bg-rule border ${m.rule.line} mb-24`}>
      {meters.map((x) => (
        <div class="bg-newsprint p-5">
          <p class={`${m.text.meta} mb-2`}>{x.tag}</p>
          <h3 class={`${m.text.body} font-medium mb-3`}>{x.title}</h3>
          <div class="space-y-2 text-sm">
            <div class={`flex justify-between ${m.text.muted}`}><span>{x.included}</span><span class={m.text.data}>{x.includedValue}</span></div>
            <div class={`border-t ${m.rule.grid} pt-2 flex justify-between ${m.text.muted}`}><span>{t.landing.overage}</span><span class={m.text.data}>{x.overage}</span></div>
            <p class={`${m.text.muted} text-xs pt-1`}>{x.note}</p>
          </div>
        </div>
      ))}
    </div>

    <SectionRule eyebrow="06 — Assurance" title={t.landing.complianceTitle} />
    <p class={`${m.text.muted} max-w-[60ch] mb-10`}>{t.landing.complianceDesc}</p>
    <dl class={`grid gap-px sm:grid-cols-2 lg:grid-cols-4 bg-rule border ${m.rule.line} mb-10`}>
      {compliance.map((c) => (
        <div class="bg-newsprint p-5">
          <dt class={`${m.text.body} text-sm font-medium mb-1`}>{c.title}</dt>
          <dd class={`${m.text.muted} text-xs leading-relaxed`}>{c.desc}</dd>
        </div>
      ))}
    </dl>
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mb-24">
      <a href={L("/privacy-policy")} class={m.btn.link}>{t.gdpr.privacyPolicy}</a>
      <a href={L("/terms")} class={m.btn.link}>{t.gdpr.termsOfService}</a>
      <a href={L("/dpa")} class={m.btn.link}>{t.gdpr.dpa}</a>
    </div>

    <div class="max-w-2xl mb-24">
      <h2 class={`${m.text.display} font-display text-4xl font-semibold mb-4`}>{t.landing.ctaTitle}</h2>
      <p class={`${m.text.muted} text-lg mb-8 max-w-[55ch]`}>{t.landing.ctaDesc}</p>
      <div class="flex flex-wrap items-center gap-6">
        <a href={appLink("/register")} class={m.btn.primary}>{t.landing.ctaBtn}</a>
        <a href={appLink("/login")} class={m.btn.link}>{t.login.signIn}</a>
      </div>
    </div>
  </main>
</Base>
```

`src/pages/index.astro`
```astro
---
import Home from "../views/Home.astro";
---
<Home locale="en" />
```

`src/pages/es/index.astro`
```astro
---
import Home from "../../views/Home.astro";
---
<Home locale="es" />
```

- [ ] **Step 6: Typecheck, test, build and inspect**

Run: `npm run check && npx vitest run && npm run build`
Expected: green. Then:
```bash
grep -c 'application/ld+json' dist/index.html          # 1
grep -o 'lang="es"' dist/es/index.html                  # lang="es"
grep -o 'href="/es/features"' dist/es/index.html | head -1
grep -o 'hreflang="x-default"' dist/es/index.html       # present
```
Run `npm run dev`, open `http://localhost:4321/` and `/es`: the rota animates, the highlighter fills the accent word, the pricing table is intact, and the Spanish page shows Spanish copy end to end.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(home): port the landing page with the rota hero island, en and es

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Features page

**Files:**
- Create: `src/views/Features.astro`, `src/pages/features.astro`, `src/pages/es/features.astro`, `public/screenshots/*.png`

**Interfaces:**
- Consumes: `Base.astro`, `m`, `getCopy`, `appLink`, `localePath`; copy `t.features.{pageTitle,pageIntro,tocTitle,ctaTitle,ctaDesc,ctaBtn,backToHome,pages[slug].{title,desc}}`

- [ ] **Step 1: Copy screenshots**

```bash
mkdir -p public/screenshots
cp ${APP_REPO:-../wiz_scheduler}/frontend/public/screenshots/*.png public/screenshots/
ls public/screenshots | wc -l    # 15
```

- [ ] **Step 2: Write the view and routes**

`src/views/Features.astro`
```astro
---
import Base from "../layouts/Base.astro";
import { m } from "../theme";
import { getCopy } from "../i18n";
import { appLink } from "../lib/site";
import { localePath, type Locale } from "../lib/links";

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const t = getCopy(locale);

const PAGE_SLUGS = [
  "dashboard", "company", "regions", "locations", "roles", "role-equivalents", "employees",
  "hour-restrictions", "day-blackouts", "employee-onboarding", "employee-association",
  "shift-templates", "schedule", "export-schedules", "data-privacy",
] as const;
type Slug = (typeof PAGE_SLUGS)[number];
const pages = t.features.pages as Record<Slug, { title: string; desc: string }>;
const ordinal = (i: number) => String(i + 1).padStart(2, "0");
const tocLink =
  `flex items-baseline gap-2 border-b ${m.rule.line} border-s-2 border-transparent py-2 ${m.text.meta} ` +
  "transition-colors hover:!text-ink hover:border-marker focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-ink";
---
<Base locale={locale} title={`${t.features.pageTitle} | ${t.common.appName}`} description={t.features.pageIntro} path="/features">
  <main class="max-w-[92rem] mx-auto px-6">
    <section class="pt-12 lg:pt-20 pb-12">
      <div class="max-w-[62ch] text-start">
        <h1 class={`${m.text.display} font-display text-5xl lg:text-6xl font-semibold leading-[0.95] mb-6`}>{t.features.pageTitle}</h1>
        <p class={`${m.text.muted} text-lg leading-relaxed max-w-[62ch]`}>{t.features.pageIntro}</p>
      </div>
    </section>

    <section class="pb-20">
      <div class="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        <aside class="hidden lg:block">
          <div class="sticky top-20">
            <h2 class={`${m.text.meta} mb-3`}>{t.features.tocTitle}</h2>
            <nav class="flex flex-col">
              {PAGE_SLUGS.map((slug, idx) => (
                <a href={`#${slug}`} class={tocLink}>
                  <span class="shrink-0">{ordinal(idx)}</span>
                  <span class="normal-case tracking-normal">{pages[slug].title}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div class="flex flex-col gap-10">
          {PAGE_SLUGS.map((slug, idx) => (
            <article
              id={slug}
              class={`${m.surface} border ${m.rule.heavy} p-6 lg:p-10 scroll-mt-24 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center ${
                idx % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div class={`${m.surface} border ${m.rule.line} overflow-hidden aspect-[16/10]`}>
                <img
                  src={`/screenshots/${slug}.png`}
                  alt={pages[slug].title}
                  loading="lazy"
                  width="1600"
                  height="1000"
                  class="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <p class={`${m.text.meta} mb-2`}>{ordinal(idx)}</p>
                <h3 class={`${m.text.display} font-display text-2xl font-semibold mb-3`}>{pages[slug].title}</h3>
                <p class={`${m.text.muted} max-w-[62ch] leading-relaxed`}>{pages[slug].desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section class="pb-24">
      <div class="max-w-2xl">
        <h2 class={`${m.text.display} font-display text-4xl font-semibold mb-4`}>{t.features.ctaTitle}</h2>
        <p class={`${m.text.muted} text-lg mb-8 max-w-[55ch]`}>{t.features.ctaDesc}</p>
        <div class="flex flex-wrap items-center gap-6">
          <a href={appLink("/register")} class={m.btn.primary}>{t.features.ctaBtn}</a>
          <a href={localePath(locale, "/")} class={m.btn.link}>{t.features.backToHome}</a>
        </div>
      </div>
    </section>
  </main>
</Base>
```

`src/pages/features.astro`
```astro
---
import Features from "../views/Features.astro";
---
<Features locale="en" />
```

`src/pages/es/features.astro`
```astro
---
import Features from "../../views/Features.astro";
---
<Features locale="es" />
```

- [ ] **Step 3: Verify**

Run: `npm run check && npx vitest run && npm run build`
Expected: green; `dist/features/index.html` and `dist/es/features/index.html` exist; `grep -c '<article' dist/features/index.html` prints 15.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(features): port the manager tour page, en and es

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Legal pages from the app API

**Files:**
- Create: `scripts/snapshot-legal.mjs`, `src/content/legal/fixture.json`, `src/lib/legal.ts`, `src/views/Legal.astro`, `src/pages/{privacy-policy,terms,dpa}.astro`, `src/pages/es/{privacy-policy,terms,dpa}.astro`
- Test: `tests/legal.test.ts`

**Interfaces:**
- Produces: `type LegalKind = "privacy-policy" | "terms" | "dpa"`, `interface LegalDoc { version: string; effective_date: string; content: string; processors?: Processor[] }`, `interface Processor { name: string; purpose: string; location: string; data_processed?: string; safeguards?: string }`, `legalSource(env?): "api" | "fixture"`, `getLegal(kind, opts?): Promise<LegalDoc>` from `src/lib/legal.ts`

- [ ] **Step 1: Write the snapshot script and take the snapshot**

`scripts/snapshot-legal.mjs`
```js
// Refreshes src/content/legal/fixture.json from the app API's public GDPR endpoints.
// Run: npm run snapshot:legal    (API_URL overrides the default)
// Before the domain cutover the API still lives at the apex:
//   API_URL=https://wizscheduler.com/api/v1 npm run snapshot:legal
import { writeFileSync } from "node:fs";

const API_URL = process.env.API_URL ?? "https://app.wizscheduler.com/api/v1";
const KINDS = ["privacy-policy", "terms", "dpa"];
const out = {};
for (const kind of KINDS) {
  const res = await fetch(`${API_URL}/gdpr/${kind}`);
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.includes("application/json")) {
    throw new Error(`${kind}: HTTP ${res.status} ${type} — if this is HTML you are on a network that hijacks DNS for wizscheduler.com; retry from another network.`);
  }
  out[kind] = await res.json();
}
out.fetched_at = new Date().toISOString();
writeFileSync("src/content/legal/fixture.json", JSON.stringify(out, null, 2) + "\n");
console.log(`snapshot written for ${KINDS.join(", ")}`);
```

Run: `mkdir -p src/content/legal && API_URL=https://wizscheduler.com/api/v1 npm run snapshot:legal`
Expected: `src/content/legal/fixture.json` written; `grep -c '"version": "1.0"' src/content/legal/fixture.json` prints 3. If the fetch returns HTML, run from a network that does not hijack DNS for the domain (a phone hotspot works).

- [ ] **Step 2: Write the failing test**

`tests/legal.test.ts`
```ts
import { describe, expect, it, vi } from "vitest";
import { getLegal, legalSource } from "../src/lib/legal";
import fixture from "../src/content/legal/fixture.json";

const doc = { version: "9.9", effective_date: "2030-01-01", content: "api text" };
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("legalSource", () => {
  it("defaults to the fixture and only reads 'api' explicitly", () => {
    expect(legalSource({})).toBe("fixture");
    expect(legalSource({ LEGAL_SOURCE: "api" })).toBe("api");
    expect(legalSource({ LEGAL_SOURCE: "anything-else" })).toBe("fixture");
  });
});

describe("getLegal", () => {
  it("returns the fixture document without any network call", async () => {
    const fetchImpl = vi.fn();
    const result = await getLegal("terms", { source: "fixture", fetchImpl });
    expect(result.content).toBe(fixture.terms.content);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fetches from the API when asked", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, doc));
    const result = await getLegal("privacy-policy", { source: "api", apiUrl: "https://x/api/v1", fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith("https://x/api/v1/gdpr/privacy-policy");
    expect(result).toEqual(doc);
  });

  it("throws on a non-OK response so the build fails", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(503, {}));
    await expect(getLegal("dpa", { source: "api", apiUrl: "https://x/api/v1", fetchImpl })).rejects.toThrow(/503/);
  });

  it("names the document when the network call itself fails", async () => {
    const fetchImpl = vi.fn(async () => { throw new TypeError("fetch failed"); });
    await expect(getLegal("terms", { source: "api", apiUrl: "https://x/api/v1", fetchImpl })).rejects.toThrow(/legal terms: TypeError: fetch failed/);
  });

  it("throws on an unexpected shape", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { nope: true }));
    await expect(getLegal("dpa", { source: "api", apiUrl: "https://x/api/v1", fetchImpl })).rejects.toThrow(/shape/);
  });
});
```

Run: `npx vitest run tests/legal.test.ts`
Expected: FAIL, cannot resolve `../src/lib/legal`.

- [ ] **Step 3: Write the loader**

`src/lib/legal.ts`
```ts
import fixture from "../content/legal/fixture.json";
import { API_URL } from "./site";

export type LegalKind = "privacy-policy" | "terms" | "dpa";

export interface Processor {
  name: string;
  purpose: string;
  location: string;
  data_processed?: string;
  safeguards?: string;
}

export interface LegalDoc {
  version: string;
  effective_date: string;
  content: string;
  processors?: Processor[];
}

export type LegalSource = "api" | "fixture";

/** `LEGAL_SOURCE=api` fetches at build time; anything else uses the committed snapshot. */
export function legalSource(env: Record<string, string | undefined> = process.env): LegalSource {
  return env.LEGAL_SOURCE === "api" ? "api" : "fixture";
}

interface Options {
  source?: LegalSource;
  apiUrl?: string;
  fetchImpl?: typeof fetch;
}

export async function getLegal(kind: LegalKind, opts: Options = {}): Promise<LegalDoc> {
  const source = opts.source ?? legalSource();
  if (source === "fixture") return fixture[kind] as LegalDoc;

  const apiUrl = opts.apiUrl ?? API_URL;
  const fetchImpl = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await fetchImpl(`${apiUrl}/gdpr/${kind}`);
  } catch (err) {
    throw new Error(`legal ${kind}: ${String(err)}`);
  }
  if (!res.ok) throw new Error(`legal ${kind}: HTTP ${res.status}`);
  const doc = (await res.json()) as Partial<LegalDoc>;
  if (typeof doc.content !== "string" || typeof doc.version !== "string" || typeof doc.effective_date !== "string") {
    throw new Error(`legal ${kind}: unexpected shape`);
  }
  return doc as LegalDoc;
}
```

Run: `npx vitest run tests/legal.test.ts`
Expected: 6 tests pass.

- [ ] **Step 4: Write the view and six routes**

`src/views/Legal.astro`
```astro
---
import Base from "../layouts/Base.astro";
import { m } from "../theme";
import { getCopy } from "../i18n";
import { getLegal, type LegalKind } from "../lib/legal";
import { localePath, type Locale } from "../lib/links";

interface Props {
  locale: Locale;
  kind: LegalKind;
}
const { locale, kind } = Astro.props;
const t = getCopy(locale);
const titles: Record<LegalKind, string> = {
  "privacy-policy": t.gdpr.privacyPolicy,
  terms: t.gdpr.termsOfService,
  dpa: t.gdpr.dpa,
};
const title = titles[kind];
const doc = await getLegal(kind);
const description = doc.content.replace(/\s+/g, " ").slice(0, 155);
---
<Base locale={locale} title={`${title} | ${t.common.appName}`} description={description} path={`/${kind}`}>
  <main class="max-w-4xl mx-auto px-6 py-16">
    <article class={`${m.surface} border ${m.rule.line} p-8`}>
      <h1 class={`${m.text.display} font-display text-2xl font-semibold text-center mb-2`}>{title}</h1>
      <div class={`flex justify-between text-sm ${m.text.muted} mb-6`}>
        <span>{t.gdpr.version}: {doc.version}</span>
        <span>{t.gdpr.effectiveDate}: {doc.effective_date}</span>
      </div>
      {locale !== "en" && <p class={`${m.alert.info} mb-6`}>{t.legal.englishOnly}</p>}
      <div class="max-w-[68ch]" lang="en">
        <p class={`${m.text.body} whitespace-pre-wrap`}>{doc.content}</p>
      </div>

      {doc.processors && doc.processors.length > 0 && (
        <div class="mt-6" lang="en">
          <h2 class={`${m.text.display} font-display text-lg font-semibold mb-3`}>{t.gdpr.processors}</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-start">
              <thead>
                <tr class={`border-b ${m.rule.line}`}>
                  <th class={`py-2 px-3 ${m.text.meta} font-medium text-start`}>{t.gdpr.processorName}</th>
                  <th class={`py-2 px-3 ${m.text.meta} font-medium text-start`}>{t.gdpr.processorPurpose}</th>
                  <th class={`py-2 px-3 ${m.text.meta} font-medium text-start`}>{t.gdpr.processorLocation}</th>
                </tr>
              </thead>
              <tbody>
                {doc.processors.map((p) => (
                  <tr class={`border-b ${m.rule.line}`}>
                    <td class={`py-2 px-3 ${m.text.body}`}>{p.name}</td>
                    <td class={`py-2 px-3 ${m.text.body}`}>{p.purpose}</td>
                    <td class={`py-2 px-3 ${m.text.body}`}>{p.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div class="mt-6 text-center">
        <a href={localePath(locale, "/")} class={`${m.btn.link} text-sm`}>{t.legal.backHome}</a>
      </div>
    </article>
  </main>
</Base>
```

Six route files, each two lines of frontmatter. English:

`src/pages/privacy-policy.astro`
```astro
---
import Legal from "../views/Legal.astro";
---
<Legal locale="en" kind="privacy-policy" />
```
`src/pages/terms.astro` — same with `kind="terms"`; `src/pages/dpa.astro` — `kind="dpa"`.

Spanish, importing `../../views/Legal.astro` with `locale="es"`:
`src/pages/es/privacy-policy.astro`, `src/pages/es/terms.astro`, `src/pages/es/dpa.astro`.

- [ ] **Step 5: Verify both sources**

Run: `npm run check && npx vitest run && npm run build`
Expected: green; `grep -c 'Anthropic' dist/dpa/index.html` >= 1 (processor table rendered); `dist/es/terms/index.html` contains the `englishOnly` sentence.

Run: `LEGAL_SOURCE=api PUBLIC_API_URL=https://wizscheduler.com/api/v1 npm run build`
Expected: builds (from a network without the DNS hijack). Then `LEGAL_SOURCE=api PUBLIC_API_URL=https://127.0.0.1:9/api/v1 npm run build` must **fail** with `legal privacy-policy:` in the error, proving a dead API fails the deploy build instead of shipping stale text.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(legal): privacy, terms and DPA pages sourced from the app API with a committed snapshot

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: NYC Fair Workweek page

**Files:**
- Create: `src/views/Nyc.astro`, `src/pages/nyc-fair-workweek-scheduling.astro`, `src/pages/es/nyc-fair-workweek-scheduling.astro`

**Interfaces:**
- Consumes: `Base.astro`, `SectionRule.astro`, `m`, `getCopy` (`t.nyc.*`), `appLink`, `NYC_PRESET`, `localePath`

- [ ] **Step 1: Write the view**

`src/views/Nyc.astro`
```astro
---
import Base from "../layouts/Base.astro";
import SectionRule from "../components/SectionRule.astro";
import { m } from "../theme";
import { getCopy } from "../i18n";
import { appLink, NYC_PRESET } from "../lib/site";
import { localePath, type Locale } from "../lib/links";

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const t = getCopy(locale);
const n = t.nyc;
/** Date the legal summary below was last checked against DCWP material. Update when the copy changes. */
const REVIEWED_ON = "2026-09-22";
const statusLabel = (s: string) => (s === "enforced" ? n.enforced : n.roadmap);
const statusClass = (s: string) => (s === "enforced" ? `${m.text.clear}` : "text-ink/60");
---
<Base locale={locale} title={`${n.metaTitle} | ${t.common.appName}`} description={n.metaDesc} path="/nyc-fair-workweek-scheduling">
  <main class="max-w-[92rem] mx-auto px-6">
    <section class="pt-16 pb-16 max-w-[62ch]">
      <p class={`${m.text.meta} mb-6`}>{n.eyebrow}</p>
      <h1 class={`${m.text.display} font-display text-5xl sm:text-6xl font-semibold leading-[0.95] mb-6`}>
        {n.title} <span class={m.mark}>{n.titleAccent}</span>
      </h1>
      <p class={`${m.text.muted} text-lg leading-relaxed mb-9`}>{n.intro}</p>
      <div class="flex flex-wrap items-center gap-4">
        <a href={localePath(locale, "/free-schedule-checker")} class={m.btn.primary}>{n.ctaChecker}</a>
        <a href={appLink("/register", NYC_PRESET)} class={m.btn.link}>{n.ctaSignup}</a>
      </div>
    </section>

    <SectionRule eyebrow={n.coveredEyebrow} title={n.coveredTitle} />
    <div class={`grid gap-px md:grid-cols-2 bg-rule border ${m.rule.line} mb-24`}>
      <div class="bg-newsprint p-6">
        <h3 class={`${m.text.display} font-display text-2xl font-semibold mb-3`}>{n.fastFoodTitle}</h3>
        <p class={`${m.text.muted} leading-relaxed`}>{n.fastFoodDesc}</p>
      </div>
      <div class="bg-newsprint p-6">
        <h3 class={`${m.text.display} font-display text-2xl font-semibold mb-3`}>{n.retailTitle}</h3>
        <p class={`${m.text.muted} leading-relaxed`}>{n.retailDesc}</p>
      </div>
    </div>

    <SectionRule eyebrow={n.rulesEyebrow} />
    <div class="grid gap-10 md:grid-cols-2 mb-24">
      <div>
        <p class={`${m.text.meta} mb-4`}>{n.fastFoodRulesTitle}</p>
        <dl class={`border-t ${m.rule.line}`}>
          {n.fastFoodRules.map((r) => (
            <div class={`border-b ${m.rule.line} py-4`}>
              <dt class={`${m.text.body} font-medium`}>{r.title}</dt>
              <dd class={`${m.text.muted} text-sm leading-relaxed`}>{r.desc}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <p class={`${m.text.meta} mb-4`}>{n.retailRulesTitle}</p>
        <dl class={`border-t ${m.rule.line}`}>
          {n.retailRules.map((r) => (
            <div class={`border-b ${m.rule.line} py-4`}>
              <dt class={`${m.text.body} font-medium`}>{r.title}</dt>
              <dd class={`${m.text.muted} text-sm leading-relaxed`}>{r.desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>

    <SectionRule eyebrow={n.premiumsEyebrow} title={n.premiumsTitle} />
    <div class={`${m.surface} border ${m.rule.heavy} p-6 md:p-10 max-w-3xl mb-10`}>
      <div class="overflow-x-auto">
        <table class="w-full font-data text-sm tabular-nums">
          <thead>
            <tr class={`border-b ${m.rule.line}`}>
              <th class={`${m.text.meta} text-start pb-3`}>{n.premiumsNotice}</th>
              <th class={`${m.text.meta} text-end pb-3`}>{n.premiumsAdded}</th>
              <th class={`${m.text.meta} text-end pb-3`}>{n.premiumsReduced}</th>
            </tr>
          </thead>
          <tbody>
            {n.premiums.map((p) => (
              <tr class={`border-b ${m.rule.grid}`}>
                <td class="py-2.5 text-start">{p.notice}</td>
                <td class="py-2.5 text-end">{p.added}</td>
                <td class="py-2.5 text-end">{p.reduced}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div class={`border ${m.rule.line} p-6 md:p-8 max-w-3xl mb-24`}>
      <p class={`${m.text.meta} mb-3`}>{n.finesTitle}</p>
      <p class={`${m.text.muted} max-w-[60ch]`}>{n.finesDesc}</p>
    </div>

    <SectionRule eyebrow={n.productEyebrow} title={n.productTitle} />
    <dl class={`border-t ${m.rule.line} mb-24`}>
      {n.productRows.map((r) => (
        <div class={`border-b ${m.rule.line} py-4 grid gap-1 md:grid-cols-[18rem_8rem_1fr] md:gap-8`}>
          <dt class={`${m.text.body} font-medium`}>{r.title}</dt>
          <dd class={`${m.text.meta} ${statusClass(r.status)}`}>{statusLabel(r.status)}</dd>
          <dd class={`${m.text.muted} text-sm leading-relaxed`}>{r.desc}</dd>
        </div>
      ))}
    </dl>

    <SectionRule eyebrow={n.ctaEyebrow} title={n.ctaTitle} />
    <div class="max-w-2xl mb-16">
      <p class={`${m.text.muted} text-lg mb-8 max-w-[55ch]`}>{n.ctaDesc}</p>
      <div class="flex flex-wrap items-center gap-6">
        <a href={localePath(locale, "/free-schedule-checker")} class={m.btn.primary}>{n.ctaChecker}</a>
        <a href={appLink("/register", NYC_PRESET)} class={m.btn.link}>{n.ctaSignup}</a>
      </div>
    </div>

    <p class={`${m.text.meta} mb-2`}>{n.reviewedOn} <time datetime={REVIEWED_ON}>{REVIEWED_ON}</time></p>
    <p class={`${m.text.muted} text-sm mb-8`}>
      <a href={n.sourceUrl} rel="noopener" target="_blank" class={m.btn.link}>{n.source}</a>
    </p>
  </main>
</Base>
```

`src/pages/nyc-fair-workweek-scheduling.astro`
```astro
---
import Nyc from "../views/Nyc.astro";
---
<Nyc locale="en" />
```

`src/pages/es/nyc-fair-workweek-scheduling.astro`
```astro
---
import Nyc from "../../views/Nyc.astro";
---
<Nyc locale="es" />
```

- [ ] **Step 2: Verify the facts against the source before building**

Open `https://www.nyc.gov/site/dca/workers/workersrights/fastfood-retail-workers.page` and the DCWP fast food FAQ PDF linked from it. Confirm each figure in `t.nyc` (30-establishment chain; 14 days; 11 hours; $100; $10/$20, $15/$45, $15/$75; 72 hours for retail; 20 employees; $500/$750/$1,000). If any differs, correct **both** locale files and set `REVIEWED_ON` to today. The figures above were checked on 2026-09-22 against the DCWP FAQ (dated 2023-09-15).

- [ ] **Step 3: Build and inspect**

Run: `npm run check && npx vitest run && npm run build`
Expected: green; `dist/nyc-fair-workweek-scheduling/index.html` contains `$100` and `72`; the Spanish page contains `Comercio minorista`; the sign-up link contains `preset=nyc-fair-workweek`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(nyc): Fair Workweek page with rules, premiums, fines and product status, en and es

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Compare page (7shifts) as a content collection

**Files:**
- Create: `src/content.config.ts`, `src/content/compare/en/7shifts.md`, `src/content/compare/es/7shifts.md`, `src/views/Compare.astro`, `src/pages/compare/7shifts.astro`, `src/pages/es/compare/7shifts.astro`

**Interfaces:**
- Produces: content collection `compare` with entry ids `en/7shifts` and `es/7shifts`, frontmatter `{ title, description, competitor, competitorUrl, checkedOn }`; `Compare.astro` props `{ locale: Locale; slug: string }`

- [ ] **Step 1: Define the collection**

`src/content.config.ts`
```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

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

export const collections = { compare };
```

- [ ] **Step 2: Check the competitor facts, then write the content**

Open `https://www.7shifts.com/pricing` in a browser (the page needs JavaScript; a plain fetch returns an empty shell). Compare with the table below, correct any figure, and set `checkedOn` in both files to today's date. The figures below were read from 7shifts' live pricing page on 2026-09-22 (monthly billing; the page's Team Size selector switches between the 1–30 and 31+ tiers).

`src/content/compare/en/7shifts.md`
```md
---
title: "WizScheduler vs 7shifts"
description: "A flat $18 a month for every location versus per-location plans. What 7shifts does better, what WizScheduler does differently, and how to switch with your data."
competitor: "7shifts"
competitorUrl: "https://www.7shifts.com/pricing"
checkedOn: "2026-09-22"
---

7shifts is the scheduling tool most New York restaurants already know. It is a good product with a big feature set. This page is for the operator asking whether a smaller, flat-priced tool would do the job.

## Pricing

7shifts prices per location. WizScheduler prices per company, with every location included.

| | 7shifts | WizScheduler |
| --- | --- | --- |
| Free plan | Comp: 1 location, up to 15 employees | 1 location, 5 employees, 5 schedule generations a month |
| Teams of 1 to 30 | Essentials $49.99 per location per month (up to 30 employees); Premium $149.99 | $18 per month for all locations |
| Teams of 31 or more | Pro $99.99 per location per month (up to 60 employees); Premium $199.99 | Same $18 plan |
| Annual billing | 10% off | No discount |
| Labor compliance tools | Premium plan | 11-hour rest rule on every plan |

A three-location restaurant group on 7shifts Pro pays about $300 a month. On WizScheduler it pays $18, plus whatever AI credits it chooses to buy.

## Where 7shifts is stronger

- **POS integrations.** Toast, Square, Clover and others feed sales into labor forecasts. WizScheduler has no POS integration.
- **Time clock and tip pooling.** 7shifts includes punch-in, tip pooling and payroll on its paid plans. WizScheduler has QR check-in on the paid plan and no tip or payroll features today; payroll export is on the roadmap.
- **Task management and manager logbook.** Not in WizScheduler.

If those are the reasons you pay for 7shifts, keep paying for it.

## Where WizScheduler is different

- **One flat price.** Every location, every manager, every employee up to 1,000, for $18 a month.
- **Generation, not just drag and drop.** Rotation, rotation-with-history and max-hours strategies build the week from availability, roles, skill levels and hour limits. AI generation layers preferences and interpersonal constraints on top.
- **11-hour rest enforced while scheduling.** Set the minimum rest on a location and no generated schedule, algorithmic or AI, breaks it across locations. See the [NYC Fair Workweek page](/nyc-fair-workweek-scheduling).
- **Nineteen languages** for the employee self-service pages, including Spanish, Bengali, Chinese and Arabic.
- **GDPR tooling.** Data export, erasure and consent records, built in.

## Switching from 7shifts

The paid plan includes a 7shifts importer. Connect your 7shifts account and it imports companies, locations, roles, employees and their availability. Nothing is typed in by hand.

1. Sign up free and confirm your email.
2. Upgrade to the $18 plan.
3. Open Import and choose 7shifts.
4. Generate your first week.
```

`src/content/compare/es/7shifts.md`
```md
---
title: "WizScheduler vs 7shifts"
description: "Una tarifa fija de $18 al mes para todas las ubicaciones frente a planes por ubicación. Qué hace mejor 7shifts, qué hace distinto WizScheduler y cómo cambiar con tus datos."
competitor: "7shifts"
competitorUrl: "https://www.7shifts.com/pricing"
checkedOn: "2026-09-22"
---

7shifts es la herramienta de horarios que la mayoría de los restaurantes de Nueva York ya conoce. Es un buen producto con muchas funciones. Esta página es para el operador que se pregunta si una herramienta más pequeña, de precio fijo, le bastaría.

## Precios

7shifts cobra por ubicación. WizScheduler cobra por empresa, con todas las ubicaciones incluidas.

| | 7shifts | WizScheduler |
| --- | --- | --- |
| Plan gratuito | Comp: 1 ubicación, hasta 15 empleados | 1 ubicación, 5 empleados, 5 generaciones de horario al mes |
| Equipos de 1 a 30 | Essentials $49.99 por ubicación al mes (hasta 30 empleados); Premium $149.99 | $18 al mes para todas las ubicaciones |
| Equipos de 31 o más | Pro $99.99 por ubicación al mes (hasta 60 empleados); Premium $199.99 | El mismo plan de $18 |
| Facturación anual | 10% de descuento | Sin descuento |
| Herramientas de cumplimiento laboral | Plan Premium | Regla de 11 horas de descanso en todos los planes |

Un grupo de tres restaurantes en 7shifts Pro paga unos $300 al mes. En WizScheduler paga $18, más los créditos de AI que decida comprar.

## Dónde 7shifts es más fuerte

- **Integraciones con POS.** Toast, Square, Clover y otros alimentan las ventas a las previsiones de personal. WizScheduler no tiene integración con POS.
- **Reloj de fichaje y reparto de propinas.** 7shifts incluye fichaje, reparto de propinas y nómina en sus planes de pago. WizScheduler tiene fichaje por QR en el plan de pago y hoy no tiene funciones de propinas ni nómina; la exportación a nómina está en desarrollo.
- **Gestión de tareas y bitácora del gerente.** No existen en WizScheduler.

Si pagas 7shifts por esas razones, sigue pagándolo.

## Dónde WizScheduler es distinto

- **Un solo precio fijo.** Cada ubicación, cada gerente, cada empleado hasta 1,000, por $18 al mes.
- **Generación, no solo arrastrar y soltar.** Las estrategias de rotación, rotación con historial y horas máximas construyen la semana a partir de disponibilidad, roles, niveles de habilidad y límites de horas. La generación con AI añade preferencias y restricciones entre personas.
- **Descanso de 11 horas aplicado al programar.** Fija el descanso mínimo en una ubicación y ningún horario generado, algorítmico o con AI, lo rompe entre ubicaciones. Consulta la [página de Fair Workweek NYC](/es/nyc-fair-workweek-scheduling).
- **Diecinueve idiomas** en las páginas de autoservicio del empleado, incluidos español, bengalí, chino y árabe.
- **Herramientas GDPR.** Exportación de datos, borrado y registros de consentimiento, integrados.

## Cambiar desde 7shifts

El plan de pago incluye un importador de 7shifts. Conecta tu cuenta de 7shifts e importa empresas, ubicaciones, roles, empleados y su disponibilidad. Nada se escribe a mano.

1. Regístrate gratis y confirma tu correo.
2. Pasa al plan de $18.
3. Abre Importar y elige 7shifts.
4. Genera tu primera semana.
```

- [ ] **Step 3: Write the view and routes**

`src/views/Compare.astro`
```astro
---
import { getEntry, render } from "astro:content";
import Base from "../layouts/Base.astro";
import { m } from "../theme";
import { getCopy } from "../i18n";
import { appLink } from "../lib/site";
import { localePath, type Locale } from "../lib/links";

interface Props {
  locale: Locale;
  slug: string;
}
const { locale, slug } = Astro.props;
const t = getCopy(locale);
const entry = await getEntry("compare", `${locale}/${slug}`);
if (!entry) throw new Error(`compare entry missing: ${locale}/${slug}`);
const { Content } = await render(entry);
const d = entry.data;
---
<Base locale={locale} title={`${d.title} | ${t.common.appName}`} description={d.description} path={`/compare/${slug}`}>
  <main class="max-w-[92rem] mx-auto px-6">
    <section class="pt-16 pb-10 max-w-[62ch]">
      <p class={`${m.text.meta} mb-6`}>{t.nav.compare}</p>
      <h1 class={`${m.text.display} font-display text-5xl sm:text-6xl font-semibold leading-[0.95] mb-6`}>{d.title}</h1>
      <p class={`${m.text.muted} text-lg leading-relaxed`}>{d.description}</p>
    </section>
    <article class="prose-rota max-w-4xl">
      <Content />
    </article>
    <p class={`${m.text.meta} mt-12`}>
      {t.compare.checkedOn} <time datetime={d.checkedOn}>{d.checkedOn}</time> ·
      <a href={d.competitorUrl} rel="noopener nofollow" target="_blank" class={m.btn.link}>{d.competitor}</a>
    </p>
    <div class="flex flex-wrap items-center gap-6 mt-12 mb-16">
      <a href={appLink("/register")} class={m.btn.primary}>{t.compare.ctaSignup}</a>
      <a href={localePath(locale, "/")} class={m.btn.link}>{t.compare.ctaHome}</a>
    </div>
  </main>
</Base>
```

`src/pages/compare/7shifts.astro`
```astro
---
import Compare from "../../views/Compare.astro";
---
<Compare locale="en" slug="7shifts" />
```

`src/pages/es/compare/7shifts.astro`
```astro
---
import Compare from "../../../views/Compare.astro";
---
<Compare locale="es" slug="7shifts" />
```

- [ ] **Step 4: Build and inspect**

Run: `npm run check && npx vitest run && npm run build`
Expected: green; `dist/compare/7shifts/index.html` contains a `<table` and `checkedOn`'s date inside `<time`; the Spanish page links to `/es/nyc-fair-workweek-scheduling`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(compare): 7shifts comparison page from a content collection, en and es

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Checker library: parsing, mapping, request building, API call

**Files:**
- Create: `src/lib/checker/types.ts`, `src/lib/checker/parse.ts`, `src/lib/checker/request.ts`
- Test: `tests/checker/parse.test.ts`, `tests/checker/request.test.ts`

**Interfaces:**
- Produces (`types.ts`): `ShiftRow { employee; start; end }`, `ParsedTable { headers: string[]; rows: string[][] }`, `ColumnMapping { employee: number; start: number; end: number }` (−1 = unset), `CheckRequest`, `CheckResponse`, `Finding`, `EmployeeResult`
- Produces (`parse.ts`): `parseCsv(text)`, `parseTsv(text)`, `parsePasted(text)`, `parseXlsx(data: ArrayBuffer)`, `guessMapping(headers)`, `toShiftRows(table, mapping): { rows: ShiftRow[]; skipped: number }`
- Produces (`request.ts`): `MAX_SHIFTS = 2000`, `NYC_DEFAULTS`, `defaultTimezone()`, `buildRequest(rows, opts): BuildResult`, `checkSchedule(apiUrl, request, fetchImpl?): Promise<CheckOutcome>`

This is the API contract the island depends on. It is posted on wiz_scheduler issue #116 so the backend matches it.

- [ ] **Step 1: Write the types**

`src/lib/checker/types.ts`
```ts
/** One scheduled shift as sent to the API. `start`/`end` are ISO-8601 strings,
 *  naive values interpreted by the API in `CheckRequest.timezone`. */
export interface ShiftRow {
  employee: string;
  start: string;
  end: string;
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

/** Column indexes into ParsedTable.headers; -1 means not chosen. */
export interface ColumnMapping {
  employee: number;
  start: number;
  end: number;
}

// ---- Contract with wiz_scheduler `POST /api/v1/public/compliance-check` (issue #116) ----

export interface CheckRequest {
  timezone: string;
  min_rest_hours: number;
  notice_days: number;
  published_at?: string;
  shifts: ShiftRow[];
}

export interface ShiftWindow {
  start: string;
  end: string;
}

export type Finding =
  | { kind: "clopening"; first: ShiftWindow; second: ShiftWindow; rest_hours: number }
  | { kind: "short_notice"; shift: ShiftWindow; notice_days: number };

export interface EmployeeResult {
  employee: string;
  findings: Finding[];
}

export interface CheckResponse {
  totals: { employees: number; clopenings: number; short_notice: number };
  employees: EmployeeResult[];
}
```

- [ ] **Step 2: Write the failing parse tests**

`tests/checker/parse.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { utils, write } from "xlsx";
import { guessMapping, parseCsv, parsePasted, parseTsv, parseXlsx, toShiftRows } from "../../src/lib/checker/parse";

describe("parseCsv", () => {
  it("splits headers and rows, trimming cells", () => {
    const t = parseCsv("Employee,Start,End\nA.B., 2026-10-05 16:00 ,2026-10-06 00:00\n");
    expect(t.headers).toEqual(["Employee", "Start", "End"]);
    expect(t.rows).toEqual([["A.B.", "2026-10-05 16:00", "2026-10-06 00:00"]]);
  });

  it("handles quoted fields with embedded commas, quotes and CRLF", () => {
    const t = parseCsv('Name,Start,End\r\n"Lee, Sam",2026-10-05 09:00,"2026-10-05 ""17:00"""\r\n');
    expect(t.rows[0]).toEqual(["Lee, Sam", "2026-10-05 09:00", '2026-10-05 "17:00"']);
  });

  it("drops blank lines and a BOM", () => {
    const t = parseCsv("﻿a,b,c\n\n1,2,3\n , , \n");
    expect(t.rows).toEqual([["1", "2", "3"]]);
  });

  it("returns an empty table for empty input", () => {
    expect(parseCsv("")).toEqual({ headers: [], rows: [] });
  });
});

describe("parseTsv / parsePasted", () => {
  it("splits on tabs", () => {
    const t = parseTsv("Employee\tStart\tEnd\nA.B.\t2026-10-05 16:00\t2026-10-06 00:00");
    expect(t.rows[0][0]).toBe("A.B.");
  });
  it("picks tabs when the first line has any, otherwise commas", () => {
    expect(parsePasted("a\tb\n1\t2").headers).toEqual(["a", "b"]);
    expect(parsePasted("a,b\n1,2").headers).toEqual(["a", "b"]);
  });
});

describe("parseXlsx", () => {
  it("reads the first sheet as strings", () => {
    const ws = utils.aoa_to_sheet([
      ["Employee", "Start", "End"],
      ["A.B.", "2026-10-05 16:00", "2026-10-06 00:00"],
      ["", "", ""],
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Week");
    const buf = write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const t = parseXlsx(buf);
    expect(t.headers).toEqual(["Employee", "Start", "End"]);
    expect(t.rows).toEqual([["A.B.", "2026-10-05 16:00", "2026-10-06 00:00"]]);
  });
});

describe("guessMapping", () => {
  it("matches exact headers first", () => {
    expect(guessMapping(["Employee", "Shift Start", "Shift End"])).toEqual({ employee: 0, start: 1, end: 2 });
  });
  it("matches short synonyms without letting 'in' steal 'finish'", () => {
    expect(guessMapping(["Name", "In", "Out"])).toEqual({ employee: 0, start: 1, end: 2 });
    expect(guessMapping(["Staff", "Begin", "Finish"])).toEqual({ employee: 0, start: 1, end: 2 });
  });
  it("matches Spanish headers", () => {
    expect(guessMapping(["Empleado", "Entrada", "Salida"])).toEqual({ employee: 0, start: 1, end: 2 });
  });
  it("leaves unknown columns unset", () => {
    expect(guessMapping(["Date", "Amount"])).toEqual({ employee: -1, start: -1, end: -1 });
  });
});

describe("toShiftRows", () => {
  it("builds rows and counts skipped incomplete ones", () => {
    const table = { headers: ["e", "s", "x", "f"], rows: [["A", "1", "z", "2"], ["B", "", "z", "2"], ["C", "3", "z", ""]] };
    const out = toShiftRows(table, { employee: 0, start: 1, end: 3 });
    expect(out.rows).toEqual([{ employee: "A", start: "1", end: "2" }]);
    expect(out.skipped).toBe(2);
  });
  it("returns nothing when the mapping is incomplete", () => {
    expect(toShiftRows({ headers: ["a"], rows: [["1"]] }, { employee: 0, start: -1, end: -1 })).toEqual({ rows: [], skipped: 1 });
  });
});
```

Run: `npx vitest run tests/checker/parse.test.ts`
Expected: FAIL, cannot resolve `../../src/lib/checker/parse`.

- [ ] **Step 3: Write parse.ts**

`src/lib/checker/parse.ts`
```ts
import { read, utils } from "xlsx";
import type { ColumnMapping, ParsedTable, ShiftRow } from "./types";

function finish(rows: string[][]): ParsedTable {
  const clean = rows.map((r) => r.map((f) => f.trim())).filter((r) => r.some((f) => f !== ""));
  if (clean.length === 0) return { headers: [], rows: [] };
  const [headers, ...body] = clean;
  return { headers, rows: body };
}

/** RFC 4180 parser for one delimiter: quoted fields, doubled quotes, embedded newlines, CRLF, BOM. */
export function parseDelimited(text: string, delimiter: "," | "\t"): ParsedTable {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return finish(rows);
}

export const parseCsv = (text: string): ParsedTable => parseDelimited(text, ",");
export const parseTsv = (text: string): ParsedTable => parseDelimited(text, "\t");

/** Pasted spreadsheet rows are tab-separated; fall back to commas. */
export function parsePasted(text: string): ParsedTable {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return firstLine.includes("\t") ? parseTsv(text) : parseCsv(text);
}

export function parseXlsx(data: ArrayBuffer): ParsedTable {
  const wb = read(data, { type: "array", cellDates: true });
  const name = wb.SheetNames[0];
  if (!name) return { headers: [], rows: [] };
  const aoa = utils.sheet_to_json<unknown[]>(wb.Sheets[name], {
    header: 1,
    raw: false,
    dateNF: "yyyy-mm-dd hh:mm",
    defval: "",
  });
  return finish(aoa.map((r) => r.map((v) => String(v ?? ""))));
}

const SYNONYMS: Record<keyof ColumnMapping, string[]> = {
  employee: ["employee", "name", "staff", "worker", "person", "empleado", "nombre"],
  start: ["start", "shift start", "in", "begin", "from", "clock in", "inicio", "entrada"],
  end: ["end", "shift end", "out", "finish", "to", "clock out", "fin", "salida"],
};

function pick(norm: string[], words: string[], taken: Set<number>): number {
  for (const w of words) {
    const i = norm.findIndex((h, idx) => !taken.has(idx) && h === w);
    if (i !== -1) return i;
  }
  for (const w of words) {
    const i = norm.findIndex((h, idx) => !taken.has(idx) && h.includes(w));
    if (i !== -1) return i;
  }
  return -1;
}

/** Exact header matches win over substring matches; a column is used once. */
export function guessMapping(headers: string[]): ColumnMapping {
  const norm = headers.map((h) => h.trim().toLowerCase());
  const taken = new Set<number>();
  const employee = pick(norm, SYNONYMS.employee, taken);
  if (employee !== -1) taken.add(employee);
  const start = pick(norm, SYNONYMS.start, taken);
  if (start !== -1) taken.add(start);
  const end = pick(norm, SYNONYMS.end, taken);
  return { employee, start, end };
}

export function toShiftRows(table: ParsedTable, mapping: ColumnMapping): { rows: ShiftRow[]; skipped: number } {
  const { employee, start, end } = mapping;
  if (employee < 0 || start < 0 || end < 0) return { rows: [], skipped: table.rows.length };
  const rows: ShiftRow[] = [];
  let skipped = 0;
  for (const r of table.rows) {
    const row = { employee: r[employee] ?? "", start: r[start] ?? "", end: r[end] ?? "" };
    if (!row.employee || !row.start || !row.end) {
      skipped++;
      continue;
    }
    rows.push(row);
  }
  return { rows, skipped };
}
```

Run: `npx vitest run tests/checker/parse.test.ts`
Expected: all pass. If `xlsx` types are missing, add `declare module "xlsx";` to `src/env.d.ts` (the CDN tarball ships types, so this should not be needed).

- [ ] **Step 4: Write the failing request tests**

`tests/checker/request.test.ts`
```ts
import { describe, expect, it, vi } from "vitest";
import { buildRequest, checkSchedule, MAX_SHIFTS } from "../../src/lib/checker/request";
import type { CheckResponse, ShiftRow } from "../../src/lib/checker/types";

const row = (i: number): ShiftRow => ({ employee: `E${i}`, start: "2026-10-05 09:00", end: "2026-10-05 17:00" });
const ok: CheckResponse = { totals: { employees: 1, clopenings: 0, short_notice: 0 }, employees: [] };
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("buildRequest", () => {
  it("applies NYC defaults and the given timezone", () => {
    const r = buildRequest([row(1)], { timezone: "America/New_York" });
    expect(r).toEqual({
      ok: true,
      request: { timezone: "America/New_York", min_rest_hours: 11, notice_days: 14, shifts: [row(1)] },
    });
  });
  it("includes published_at only when given", () => {
    const r = buildRequest([row(1)], { timezone: "UTC", publishedAt: "2026-09-28" });
    expect(r.ok && r.request.published_at).toBe("2026-09-28T00:00:00");
    const none = buildRequest([row(1)], { timezone: "UTC", publishedAt: "  " });
    expect(none.ok && "published_at" in none.request).toBe(false);
  });
  it("rejects empty and oversized inputs before any request", () => {
    expect(buildRequest([], { timezone: "UTC" })).toEqual({ ok: false, reason: "empty" });
    const big = Array.from({ length: MAX_SHIFTS + 1 }, (_, i) => row(i));
    expect(buildRequest(big, { timezone: "UTC" })).toEqual({ ok: false, reason: "too_many" });
  });
});

describe("checkSchedule", () => {
  const req = { timezone: "UTC", min_rest_hours: 11, notice_days: 14, shifts: [row(1)] };

  it("posts JSON to the public endpoint and returns the body", async () => {
    const fetchImpl = vi.fn(async () => json(200, ok));
    const out = await checkSchedule("https://x/api/v1", req, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith("https://x/api/v1/public/compliance-check", expect.objectContaining({ method: "POST" }));
    expect(out).toEqual({ ok: true, data: ok });
  });
  it("maps 429 to busy and other failures to unavailable", async () => {
    expect(await checkSchedule("https://x", req, vi.fn(async () => json(429, {})))).toEqual({ ok: false, reason: "busy" });
    expect(await checkSchedule("https://x", req, vi.fn(async () => json(500, {})))).toEqual({ ok: false, reason: "unavailable" });
    expect(await checkSchedule("https://x", req, vi.fn(async () => { throw new Error("net"); }))).toEqual({ ok: false, reason: "unavailable" });
  });
});
```

Run: `npx vitest run tests/checker/request.test.ts`
Expected: FAIL, cannot resolve `../../src/lib/checker/request`.

- [ ] **Step 5: Write request.ts**

`src/lib/checker/request.ts`
```ts
import type { CheckRequest, CheckResponse, ShiftRow } from "./types";

/** Same cap as the API; enforced here so oversized files never leave the browser. */
export const MAX_SHIFTS = 2000;
export const NYC_DEFAULTS = { min_rest_hours: 11, notice_days: 14 } as const;
const FALLBACK_TZ = "America/New_York";

export function defaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TZ;
  } catch {
    return FALLBACK_TZ;
  }
}

export type BuildResult = { ok: true; request: CheckRequest } | { ok: false; reason: "empty" | "too_many" };

export function buildRequest(rows: ShiftRow[], opts: { timezone?: string; publishedAt?: string } = {}): BuildResult {
  if (rows.length === 0) return { ok: false, reason: "empty" };
  if (rows.length > MAX_SHIFTS) return { ok: false, reason: "too_many" };
  const request: CheckRequest = { timezone: opts.timezone ?? defaultTimezone(), ...NYC_DEFAULTS, shifts: rows };
  const published = opts.publishedAt?.trim();
  if (published) request.published_at = published.length === 10 ? `${published}T00:00:00` : published;
  return { ok: true, request };
}

export type CheckOutcome = { ok: true; data: CheckResponse } | { ok: false; reason: "busy" | "unavailable" };

export async function checkSchedule(
  apiUrl: string,
  request: CheckRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<CheckOutcome> {
  let res: Response;
  try {
    res = await fetchImpl(`${apiUrl}/public/compliance-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  if (res.status === 429) return { ok: false, reason: "busy" };
  if (!res.ok) return { ok: false, reason: "unavailable" };
  try {
    return { ok: true, data: (await res.json()) as CheckResponse };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
```

Run: `npx vitest run tests/checker`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(checker): file parsing, column guessing and the compliance-check request layer

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Checker island and page

**Files:**
- Create: `src/islands/Checker.tsx`, `src/views/CheckerPage.astro`, `src/pages/free-schedule-checker.astro`, `src/pages/es/free-schedule-checker.astro`, `public/sample-schedule.csv`
- Test: `tests/islands/Checker.test.tsx`

**Interfaces:**
- Consumes: everything from Task 9; `m`; copy `t.checker`
- Produces: `Checker` React component with props `{ copy: Copy["checker"]; apiUrl: string; enabled: boolean; registerUrl: string; sampleUrl: string }`

- [ ] **Step 1: Write the sample file**

`public/sample-schedule.csv`
```
Employee,Start,End
A.B.,2026-10-05 16:00,2026-10-06 00:00
A.B.,2026-10-06 06:00,2026-10-06 14:00
C.D.,2026-10-05 09:00,2026-10-05 17:00
C.D.,2026-10-06 09:00,2026-10-06 17:00
E.F.,2026-10-07 15:00,2026-10-07 23:00
E.F.,2026-10-08 07:00,2026-10-08 15:00
```
(A.B. and E.F. each have a clopening; C.D. is clean.)

- [ ] **Step 2: Write the failing island tests**

`tests/islands/Checker.test.tsx`
```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Checker from "../../src/islands/Checker";
import en from "../../src/i18n/en";
import type { CheckResponse } from "../../src/lib/checker/types";

const props = { copy: en.checker, apiUrl: "https://x/api/v1", enabled: true, registerUrl: "/r", sampleUrl: "/s.csv" };
const TSV = "Employee\tStart\tEnd\nA.B.\t2026-10-05 16:00\t2026-10-06 00:00\nA.B.\t2026-10-06 06:00\t2026-10-06 14:00";
const response: CheckResponse = {
  totals: { employees: 1, clopenings: 1, short_notice: 0 },
  employees: [
    {
      employee: "A.B.",
      findings: [
        {
          kind: "clopening",
          first: { start: "2026-10-05T16:00:00", end: "2026-10-06T00:00:00" },
          second: { start: "2026-10-06T06:00:00", end: "2026-10-06T14:00:00" },
          rest_hours: 6,
        },
      ],
    },
  ],
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function pasteAndCheck(text = TSV) {
  fireEvent.change(screen.getByLabelText(en.checker.pasteLabel), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: en.checker.check }));
}

describe("Checker", () => {
  it("shows the coming-soon state when disabled", () => {
    render(<Checker {...props} enabled={false} />);
    expect(screen.getByText(en.checker.comingSoonTitle)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.checker.check })).toBeNull();
  });

  it("guesses the columns from pasted rows", () => {
    render(<Checker {...props} />);
    fireEvent.change(screen.getByLabelText(en.checker.pasteLabel), { target: { value: TSV } });
    expect(screen.getByLabelText(en.checker.colEmployee)).toHaveValue("0");
    expect(screen.getByLabelText(en.checker.colStart)).toHaveValue("1");
    expect(screen.getByLabelText(en.checker.colEnd)).toHaveValue("2");
  });

  it("renders totals and findings from the API response", async () => {
    const fetchImpl = vi.fn(async () => json(200, response));
    render(<Checker {...props} fetchImpl={fetchImpl} />);
    pasteAndCheck();
    await waitFor(() => expect(screen.getByText(en.checker.resultsTitle)).toBeInTheDocument());
    expect(screen.getByTestId("total-clopenings")).toHaveTextContent("1");
    expect(screen.getByText("A.B.")).toBeInTheDocument();
    expect(screen.getByText(/6 hours of rest/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.checker.fixCta })).toHaveAttribute("href", "/r");
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.shifts).toHaveLength(2);
    expect(body.min_rest_hours).toBe(11);
  });

  it("shows the busy message on 429 and the unavailable message on failure, never a result", async () => {
    const { unmount } = render(<Checker {...props} fetchImpl={vi.fn(async () => json(429, {}))} />);
    pasteAndCheck();
    await waitFor(() => expect(screen.getByText(en.checker.errBusy)).toBeInTheDocument());
    expect(screen.queryByText(en.checker.resultsTitle)).toBeNull();
    unmount();

    render(<Checker {...props} fetchImpl={vi.fn(async () => { throw new Error("net"); })} />);
    pasteAndCheck();
    await waitFor(() => expect(screen.getByText(en.checker.errUnavailable)).toBeInTheDocument());
  });

  it("refuses oversized input before calling the API", () => {
    const fetchImpl = vi.fn();
    render(<Checker {...props} fetchImpl={fetchImpl} />);
    const rows = Array.from({ length: 2001 }, (_, i) => `E${i}\t2026-10-05 09:00\t2026-10-05 17:00`).join("\n");
    pasteAndCheck(`Employee\tStart\tEnd\n${rows}`);
    expect(screen.getByText(en.checker.errTooMany.replace("{max}", "2000"))).toBeInTheDocument();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("asks for a mapping when columns are unknown", () => {
    render(<Checker {...props} />);
    pasteAndCheck("Foo\tBar\tBaz\n1\t2\t3");
    expect(screen.getByText(en.checker.errMapping)).toBeInTheDocument();
  });
});
```

Run: `npx vitest run tests/islands/Checker.test.tsx`
Expected: FAIL, cannot resolve `../../src/islands/Checker`.

- [ ] **Step 3: Write the island**

`src/islands/Checker.tsx`
```tsx
import { useId, useState } from "react";
import { m } from "../theme";
import type { Copy } from "../i18n/en";
import { guessMapping, parseCsv, parsePasted, parseXlsx, toShiftRows } from "../lib/checker/parse";
import { buildRequest, checkSchedule, defaultTimezone, MAX_SHIFTS } from "../lib/checker/request";
import type { CheckResponse, ColumnMapping, Finding, ParsedTable } from "../lib/checker/types";

type CheckerCopy = Copy["checker"];

interface Props {
  copy: CheckerCopy;
  apiUrl: string;
  enabled: boolean;
  registerUrl: string;
  sampleUrl: string;
  /** Test seam; production uses the global fetch. */
  fetchImpl?: typeof fetch;
}

type ErrorKey = "errNoRows" | "errMapping" | "errParse" | "errTooMany" | "errBusy" | "errUnavailable";

const EMPTY: ParsedTable = { headers: [], rows: [] };
const UNSET: ColumnMapping = { employee: -1, start: -1, end: -1 };

function fmt(iso: string): string {
  return iso.replace("T", " ").slice(0, 16);
}

export default function Checker({ copy: c, apiUrl, enabled, registerUrl, sampleUrl, fetchImpl }: Props) {
  const ids = { paste: useId(), file: useId(), emp: useId(), start: useId(), end: useId(), pub: useId(), tz: useId() };
  const [table, setTable] = useState<ParsedTable>(EMPTY);
  const [mapping, setMapping] = useState<ColumnMapping>(UNSET);
  const [publishedAt, setPublishedAt] = useState("");
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResponse | null>(null);

  if (!enabled) {
    return (
      <div className={`${m.surface} border ${m.rule.heavy} p-8 max-w-2xl`}>
        <h2 className={`${m.text.display} font-display text-2xl font-semibold mb-3`}>{c.comingSoonTitle}</h2>
        <p className={`${m.text.muted} mb-6`}>{c.comingSoonDesc}</p>
        <a href={registerUrl} className={m.btn.primary}>{c.fixCta}</a>
      </div>
    );
  }

  const load = (t: ParsedTable) => {
    setTable(t);
    setMapping(t.headers.length ? guessMapping(t.headers) : UNSET);
    setResult(null);
    setError(null);
  };

  const onPaste = (text: string) => load(text.trim() ? parsePasted(text) : EMPTY);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const lower = file.name.toLowerCase();
      load(lower.endsWith(".xlsx") || lower.endsWith(".xls") ? parseXlsx(await file.arrayBuffer()) : parseCsv(await file.text()));
    } catch {
      load(EMPTY);
      setError("errParse");
    }
  };

  const onCheck = async () => {
    setResult(null);
    if (table.rows.length === 0) return setError("errNoRows");
    if (mapping.employee < 0 || mapping.start < 0 || mapping.end < 0) return setError("errMapping");
    const { rows } = toShiftRows(table, mapping);
    const built = buildRequest(rows, { timezone, publishedAt });
    if (!built.ok) return setError(built.reason === "too_many" ? "errTooMany" : "errNoRows");
    setError(null);
    setBusy(true);
    const out = await checkSchedule(apiUrl, built.request, fetchImpl);
    setBusy(false);
    if (!out.ok) return setError(out.reason === "busy" ? "errBusy" : "errUnavailable");
    setResult(out.data);
  };

  const errorText = error ? c[error].replace("{max}", String(MAX_SHIFTS)) : null;

  const select = (id: string, label: string, key: keyof ColumnMapping) => (
    <div>
      <label htmlFor={id} className={m.label}>{label}</label>
      <select
        id={id}
        className={m.input}
        value={String(mapping[key])}
        onChange={(e) => setMapping({ ...mapping, [key]: Number(e.target.value) })}
      >
        <option value="-1">{c.colUnset}</option>
        {table.headers.map((h, i) => (
          <option key={i} value={String(i)}>{h}</option>
        ))}
      </select>
    </div>
  );

  const findingLine = (f: Finding, i: number) =>
    f.kind === "clopening" ? (
      <li key={i} className={`${m.text.body} text-sm py-2 border-b ${m.rule.grid}`}>
        <span className={`${m.text.meta} !text-marker me-2`}>{c.clopening}</span>
        <span className={m.text.data}>{fmt(f.first.start)}–{fmt(f.first.end)}</span>
        <span className="text-ink/60"> → </span>
        <span className={m.text.data}>{fmt(f.second.start)}–{fmt(f.second.end)}</span>
        <span className="text-ink/70"> · {f.rest_hours} {c.restHours}</span>
      </li>
    ) : (
      <li key={i} className={`${m.text.body} text-sm py-2 border-b ${m.rule.grid}`}>
        <span className={`${m.text.meta} !text-marker me-2`}>{c.shortNotice}</span>
        <span className={m.text.data}>{fmt(f.shift.start)}–{fmt(f.shift.end)}</span>
        <span className="text-ink/70"> · {f.notice_days} {c.noticeDays}</span>
      </li>
    );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
      <form
        className={`${m.surface} border ${m.rule.heavy} p-6 md:p-8 flex flex-col gap-6`}
        onSubmit={(e) => { e.preventDefault(); void onCheck(); }}
      >
        <div>
          <label htmlFor={ids.file} className={m.label}>{c.upload}</label>
          <input id={ids.file} type="file" accept=".csv,.xlsx,.xls,text/csv" className={`${m.input} file:me-3`} onChange={(e) => void onFile(e.target.files?.[0])} />
          <p className={`${m.text.muted} text-xs mt-1.5`}>{c.uploadHint} <a href={sampleUrl} className={m.btn.link}>{c.sample}</a></p>
        </div>
        <div>
          <label htmlFor={ids.paste} className={m.label}>{c.pasteLabel}</label>
          <textarea id={ids.paste} rows={5} className={`${m.input} font-data text-sm`} placeholder={c.pastePlaceholder} onChange={(e) => onPaste(e.target.value)} />
        </div>

        {table.headers.length > 0 && (
          <fieldset className="grid gap-4 sm:grid-cols-3">
            <legend className={`${m.text.meta} mb-3`}>{c.mappingTitle}</legend>
            {select(ids.emp, c.colEmployee, "employee")}
            {select(ids.start, c.colStart, "start")}
            {select(ids.end, c.colEnd, "end")}
          </fieldset>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={ids.pub} className={m.label}>{c.publishedLabel}</label>
            <input id={ids.pub} type="date" className={m.input} value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
            <p className={`${m.text.muted} text-xs mt-1.5`}>{c.publishedHint}</p>
          </div>
          <div>
            <label htmlFor={ids.tz} className={m.label}>{c.timezoneLabel}</label>
            <input id={ids.tz} type="text" className={m.input} value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>
        </div>

        {errorText && <p role="alert" className={m.alert.error}>{errorText}</p>}

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className={m.btn.primary} disabled={busy}>{busy ? c.checking : c.check}</button>
        </div>
        <p className={`${m.text.muted} text-xs`}>{c.privacy}</p>
      </form>

      <section aria-live="polite">
        {result && (
          <>
            <h2 className={`${m.text.display} font-display text-3xl font-semibold mb-6`}>{c.resultsTitle}</h2>
            <div className={`grid gap-px sm:grid-cols-3 bg-rule border ${m.rule.line} mb-8`}>
              <div className="bg-newsprint p-5"><div className={`${m.text.data} text-2xl font-semibold`} data-testid="total-employees">{result.totals.employees}</div><div className={`${m.text.meta} mt-1`}>{c.totalEmployees}</div></div>
              <div className="bg-newsprint p-5"><div className={`${m.text.data} text-2xl font-semibold`} data-testid="total-clopenings">{result.totals.clopenings}</div><div className={`${m.text.meta} mt-1`}>{c.totalClopenings}</div></div>
              <div className="bg-newsprint p-5"><div className={`${m.text.data} text-2xl font-semibold`} data-testid="total-short-notice">{result.totals.short_notice}</div><div className={`${m.text.meta} mt-1`}>{c.totalShortNotice}</div></div>
            </div>
            {result.employees.every((e) => e.findings.length === 0) ? (
              <p className={m.alert.success}>{c.noFindings}</p>
            ) : (
              <div className="flex flex-col gap-6">
                {result.employees.filter((e) => e.findings.length > 0).map((e) => (
                  <div key={e.employee} className={`${m.surface} border ${m.rule.line} p-5`}>
                    <h3 className={`${m.text.body} font-medium mb-2`}>{e.employee}</h3>
                    <ul>{e.findings.map(findingLine)}</ul>
                  </div>
                ))}
              </div>
            )}
            <div className={`border ${m.rule.line} p-6 mt-10`}>
              <h3 className={`${m.text.display} font-display text-2xl font-semibold mb-2`}>{c.fixTitle}</h3>
              <p className={`${m.text.muted} mb-6 max-w-[50ch]`}>{c.fixDesc}</p>
              <a href={registerUrl} className={m.btn.primary}>{c.fixCta}</a>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
```

Run: `npx vitest run tests/islands/Checker.test.tsx`
Expected: 6 tests pass.

- [ ] **Step 4: Write the page view and routes**

`src/views/CheckerPage.astro`
```astro
---
import Base from "../layouts/Base.astro";
import Checker from "../islands/Checker";
import { m } from "../theme";
import { getCopy } from "../i18n";
import { API_URL, appLink, CHECKER_ENABLED, NYC_PRESET } from "../lib/site";
import type { Locale } from "../lib/links";

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const t = getCopy(locale);
const c = t.checker;
---
<Base locale={locale} title={`${c.metaTitle} | ${t.common.appName}`} description={c.metaDesc} path="/free-schedule-checker">
  <main class="max-w-[92rem] mx-auto px-6">
    <section class="pt-16 pb-12 max-w-[62ch]">
      <p class={`${m.text.meta} mb-6`}>{c.eyebrow}</p>
      <h1 class={`${m.text.display} font-display text-5xl sm:text-6xl font-semibold leading-[0.95] mb-6`}>
        {c.title} <span class={m.mark}>{c.titleAccent}</span>
      </h1>
      <p class={`${m.text.muted} text-lg leading-relaxed`}>{c.intro}</p>
    </section>
    <section class="pb-24">
      <Checker
        client:visible
        copy={c}
        apiUrl={API_URL}
        enabled={CHECKER_ENABLED}
        registerUrl={appLink("/register", NYC_PRESET)}
        sampleUrl="/sample-schedule.csv"
      />
    </section>
  </main>
</Base>
```

`src/pages/free-schedule-checker.astro`
```astro
---
import CheckerPage from "../views/CheckerPage.astro";
---
<CheckerPage locale="en" />
```

`src/pages/es/free-schedule-checker.astro`
```astro
---
import CheckerPage from "../../views/CheckerPage.astro";
---
<CheckerPage locale="es" />
```

- [ ] **Step 5: Verify both flag states**

Run: `npm run check && npx vitest run && npm run build`
Expected: green; `dist/free-schedule-checker/index.html` contains the coming-soon title (flag unset).

Run: `PUBLIC_CHECKER_ENABLED=true npm run build && grep -c 'Choose a file' dist/free-schedule-checker/index.html`
Expected: at least 1 (the form is server-rendered by the island, then hydrated on scroll).

Run `PUBLIC_CHECKER_ENABLED=true npm run dev`, open `/free-schedule-checker`, load `public/sample-schedule.csv`: the three selects fill in as Employee/Start/End. Pressing Check against production before issue #116 ships shows the unavailable message, not a crash.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(checker): free schedule checker island and page behind PUBLIC_CHECKER_ENABLED, en and es

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: robots, workflows, README and the cutover checklist

**Files:**
- Create: `public/robots.txt`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `README.md`

- [ ] **Step 1: robots**

`public/robots.txt`
```
User-agent: *
Allow: /

Sitemap: https://wizscheduler.com/sitemap-index.xml
```

- [ ] **Step 2: CI workflow**

`.github/workflows/ci.yml`
```yaml
name: CI

on:
  pull_request:
  push:
    branches-ignore: [main]

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    env:
      LEGAL_SOURCE: fixture
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm test
      - run: npm run build
```

- [ ] **Step 3: Deploy workflow**

`.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: deploy-marketing
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      LEGAL_SOURCE: api
      PUBLIC_CHECKER_ENABLED: ${{ vars.PUBLIC_CHECKER_ENABLED }}
      AWS_REGION: us-east-1
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      - name: Upload hashed assets (immutable)
        run: |
          aws s3 sync dist/_astro "s3://${{ vars.MARKETING_BUCKET }}/_astro" \
            --cache-control "public, max-age=31536000, immutable"
      - name: Upload everything else (short cache) and prune
        run: |
          aws s3 sync dist "s3://${{ vars.MARKETING_BUCKET }}" \
            --exclude "_astro/*" \
            --cache-control "public, max-age=300" \
            --delete
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id "${{ vars.MARKETING_DISTRIBUTION_ID }}" \
            --paths "/*"
```

Repository configuration this needs (GitHub → Settings): secrets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` for the IAM identity below; variables `MARKETING_BUCKET`, `MARKETING_DISTRIBUTION_ID`, `PUBLIC_CHECKER_ENABLED` (`false` until issue #116 is live).

- [ ] **Step 4: README**

`README.md`
```md
# WizScheduler marketing site

Static site for https://wizscheduler.com. Astro 7, Tailwind 3, two React islands.
Design: `docs/superpowers/specs/2026-09-22-marketing-site-design.md`.

## Develop

    nvm use          # Node 24
    npm install
    npm run dev      # http://localhost:4321

    npm test         # vitest
    npm run check    # astro check (TypeScript)
    npm run build    # dist/

## Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `PUBLIC_APP_URL` | `https://app.wizscheduler.com` | Where login/sign-up links go |
| `PUBLIC_API_URL` | `${PUBLIC_APP_URL}/api/v1` | Public API base for the checker and legal fetch |
| `PUBLIC_CHECKER_ENABLED` | unset (off) | `true` renders the checker form; otherwise "coming soon" |
| `LEGAL_SOURCE` | `fixture` | `api` fetches legal documents at build time and fails the build if the API is down |

## Generated content

- `npm run port:copy` regenerates `src/i18n/generated/*.ts` from the app repo (`APP_REPO`, default `../wiz_scheduler`). Run after landing/features copy changes in the app.
- `npm run snapshot:legal` refreshes `src/content/legal/fixture.json` from the API (`API_URL` override). Production builds use the API directly.

## Deploy

Push to `main` runs `.github/workflows/deploy.yml`: build with `LEGAL_SOURCE=api`, sync to S3, invalidate CloudFront. Needs the secrets and variables listed in that file.

## Cutover checklist (app repo, human-owned)

Terraform in `wiz_scheduler/terraform/**`:

1. New private S3 bucket + OAC + a second CloudFront distribution for it, aliases `wizscheduler.com` and `www.wizscheduler.com`, existing wildcard ACM cert, default root `index.html`, custom error 404 → `/404.html` (status 404). Attach the existing `www_to_apex` function and this viewer-request function:

       function handler(event) {
         var request = event.request;
         var uri = request.uri;
         if (uri.endsWith('/')) {
           request.uri = uri + 'index.html';
         } else if (!uri.includes('.')) {
           request.uri = uri + '/index.html';
         }
         return request;
       }

2. Existing app distribution: aliases become `["app.wizscheduler.com"]`. Nothing else changes.
3. Route53: apex + www → new distribution; new `app` record → existing distribution.
4. New variable `app_domain` (default `app.wizscheduler.com`); derive `FRONTEND_URL`, the CORS origin, `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` from it. Set the compliance API's allowed origin (issue #116) to `https://wizscheduler.com`.
5. IAM user or role for this repo's deploy: `s3:ListBucket` on the bucket, `s3:PutObject`/`s3:DeleteObject` on `bucket/*`, `cloudfront:CreateInvalidation` on the new distribution.

Outside terraform:

6. Google OAuth client: add `https://app.wizscheduler.com` to authorized JavaScript origins.
7. Set this repo's GitHub secrets/variables; push to `main`; verify every route on the distribution's `*.cloudfront.net` hostname.
8. Apply terraform at a quiet hour. Verify: home HTML in view-source, `/es`, 404 status on a junk path, login/sign-up links reach the app host, invite/reset emails link to the app host, Google sign-in works there.
9. App repo follow-up PR: `/` → `/login`; `/features`, `/privacy-policy`, `/terms`, `/dpa` → apex equivalents; remove `sitemap.xml`/`robots.txt` and, later, the marketing components.
10. Google Search Console: submit `https://wizscheduler.com/sitemap-index.xml`.

Rollback: revert the Route53 records and the alias change in one apply.
```

- [ ] **Step 5: Final verification**

Run: `npm run check && npx vitest run && npm run build`
Expected: green. Then confirm the build output:
```bash
find dist -name index.html | sort
```
Expected exactly these, plus `dist/404.html`, `dist/sitemap-index.xml`, `dist/sitemap-0.xml`, `dist/robots.txt`, `dist/sample-schedule.csv`:
```
dist/compare/7shifts/index.html
dist/dpa/index.html
dist/es/compare/7shifts/index.html
dist/es/dpa/index.html
dist/es/features/index.html
dist/es/free-schedule-checker/index.html
dist/es/index.html
dist/es/nyc-fair-workweek-scheduling/index.html
dist/es/privacy-policy/index.html
dist/es/terms/index.html
dist/features/index.html
dist/free-schedule-checker/index.html
dist/index.html
dist/nyc-fair-workweek-scheduling/index.html
dist/privacy-policy/index.html
dist/terms/index.html
```
`grep -c '<loc>' dist/sitemap-0.xml` prints 16 and `grep -c 'hreflang' dist/sitemap-0.xml` is greater than 0.

Run `npm run preview` and check Lighthouse (Chrome DevTools, mobile) on `/` and `/nyc-fair-workweek-scheduling`: Performance and SEO >= 90. If Performance is below, the usual cause is the YouTube iframe on home; confirm `loading="lazy"` is present before looking further.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: robots, CI and deploy workflows, README with the cutover checklist

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Handoff after Task 11

Not part of this plan; tracked elsewhere:

| Item | Where |
| --- | --- |
| Compliance-check API and CORS origin | wiz_scheduler issue #116 (contract in Task 9 `types.ts`) |
| Activation funnel | wiz_scheduler issue #115 |
| Terraform split, IAM identity, Google OAuth origin | README cutover checklist, human-owned |
| App redirects and marketing component removal | app repo follow-up PR after cutover |
| Deputy compare page, per-city pages, blog | later releases |
