# Competitor Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Comparison pages for 7shifts, Deputy, Homebase and When I Work, plus two alternatives pages and an NYC roundup. All in English and Spanish, all built from one sourced competitor data module. They lead with "employees get a say" and are honest about price and Fair Workweek.

**Architecture:**
- **Data:** one typed module, `src/data/competitors.ts`, holds every competitor's plans, prices, feature cells and sources, plus Spanish text. A pure function, `quotePlans`, turns a team size into per-plan monthly prices.
- **Pages:** compare pages stay markdown entries in the `compare` collection, rendered by `src/views/Compare.astro`. That view gains a FAQ (with JSON-LD), an optional cost-calculator island and related links. The alternatives pages and the roundup are views that read the data module, with their copy in `src/i18n/en.ts` / `es.ts`.

**Tech Stack:** Astro 7, React islands, Tailwind 3 (logical utilities only), Vitest + Testing Library (jsdom), `scripts/check-dist.mjs` for checks on the built site.

**Spec:** `docs/superpowers/specs/2026-11-04-competitor-pages-design.md`. Read it first. The "Constraints" sections are the only allowed source of product and competitor facts.

## Global Constraints

- Product name is **"Wiz Scheduler"** (two words) in all new and rewritten copy, titles and listings.
- **Every competitor fact comes from the vendor's own pricing page or help center**, with its URL in `sources` and a `checkedOn` date. No fact without a source.
- **Never overstate a competitor's price.** When pricing is ambiguous, use the cheaper reading and say which one you used.
- **7shifts tier is chosen by headcount per location:** 1–30 employees → Essentials $49.99 or Premium $149.99; 31–60 → Pro $99.99; 31+ → Premium $199.99. Comp is free for 1 location with up to 15 employees.
- **Show every published plan that fits** the reader's size, and mark which include auto-scheduling. Highlight the cheapest plan with auto-scheduling. A plan sold only by quote shows "contact sales".
- **Wiz Scheduler claims must match the spec's "WizScheduler facts" list.** In particular:
  - Preference requests are off until an admin turns them on in **Company Settings**, and a manager approves each request.
  - Manager priority weights affect Normal Generate only.
  - Minimum rest is off until set per location.
  - There is no notice tracking and no premium pay.
  - Pro is $18 base for unlimited locations, with 500 employees included and $1 per extra 500. AI Generate is paid from prepaid credits.
  - The free plan is 2 locations, 25 employees and 1 schedule per location a month.
- **Hero qualifier:** wherever "your team had a say" appears in a hero, the line under it says managers can enter preferences for everyone, and employees can send their own once preference requests are turned on in Company Settings.
- **No customer claims or testimonials.** Make the "fix less" point from how the product works.
- **Don't disparage competitors.** Each compare page has a fair "where they are stronger" section. Don't compete on Fair Workweek; say Deputy and 7shifts do more.
- **Every new path exists in both `en` and `es`** (`SITE_LOCALES`). No new strings in `src/i18n/chrome/*` or `src/i18n/generated/*`.
- **Logical Tailwind utilities only** (`ms-`/`me-`/`ps-`/`pe-`/`text-start`/`text-end`), enforced by `tests/logical-direction.test.ts`.
- **Before every PR, all of these must pass:** `npm run check`, `npm test`, `npm run build`, `npm run check:dist`.
- **Merging to `main` deploys to production automatically.** One PR per milestone below. Follow the repo's `CLAUDE.md` Git workflow (branch → PR → CI green → merge).

## Review Focus

1. **Calculator input that's blank, 0, negative, fractional or huge.** Clamp to whole numbers ≥ 1 (and ≤ 10,000). Never render `NaN`, `$0.00` for a paid plan, or a negative number.
2. **Per-location headcount above a plan's cap** (e.g. 7shifts at 61+, Homebase Basic over 10, Comp over 15). The plan is shown as not fitting, never priced.
3. **Location-count edges.** At 1 location vs 2+: When I Work switches rate; 7shifts Comp and Homebase Basic stop fitting; Wiz Scheduler Free stops fitting at 3 locations or more than 25 total employees.
4. **Deputy's $30 monthly minimum** when users × rate comes to less than $30.
5. **JavaScript disabled or crawler view.** The built HTML of each page with a calculator contains the default-example prices as real text.

Each of these has a pinning test in the task that owns the code (Tasks 1, 3, 9).

---

## Milestone A (PR 1): data module, calculator, FAQ, 7shifts pages

### Task 1: Competitor data module and plan pricing

**Files:**
- Create: `src/data/competitors.ts`
- Test: `tests/data/competitors.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type ToolId = "wiz" | "7shifts" | "deputy" | "homebase" | "wheniwork";
  export type AutoScheduling = "yes" | "beta" | "no";
  export interface Plan {
    name: string;
    basis: "location" | "user" | "flat" | "quote";
    monthlyUsd: number | null;          // list price, monthly billing; null for quote
    annualMonthlyUsd?: number;          // per-month price when billed annually
    autoScheduling: AutoScheduling;
    minLocations?: number; maxLocations?: number;
    minEmployeesPerLocation?: number; maxEmployeesPerLocation?: number;
    maxTotalEmployees?: number;
    minimumMonthlyUsd?: number;         // Deputy $30
    extraPer500EmployeesUsd?: number;   // Wiz Pro: $1 per 500 above 500
  }
  export interface ToolText {           // per locale
    description: string; autoScheduling: string; preferences: string; fairWorkweek: string;
    strengths: string[]; limitations: string[];
  }
  export interface Tool {
    id: ToolId; name: string; checkedOn: string; pricingUrl: string;
    plans: Plan[];
    text: Record<SiteLocale, ToolText>;
    sources: { label: Record<SiteLocale, string>; href: string }[];
  }
  export interface Team { locations: number; employeesPerLocation: number }
  export interface PlanQuote {
    plan: string; fits: boolean; monthlyUsd: number | null;
    autoScheduling: AutoScheduling; highlighted: boolean;
  }
  export const TOOLS: Record<ToolId, Tool>;
  export const DEFAULT_TEAM: Team;                  // { locations: 3, employeesPerLocation: 13 }
  export function clampTeam(raw: { locations: unknown; employeesPerLocation: unknown }): Team;
  export function quotePlans(tool: Tool, team: Team): PlanQuote[];
  export function formatUsd(n: number): string;     // "$149.97"
  ```
- Consumes: `SiteLocale` from `src/lib/links.ts`.

- [ ] **Step 1: Write the failing tests** in `tests/data/competitors.test.ts`. Each needs the exact assertions shown.

```ts
const q = (id: ToolId, locations: number, per: number) =>
  quotePlans(TOOLS[id], { locations, employeesPerLocation: per });
const hi = (qs: PlanQuote[]) => qs.find((p) => p.highlighted);

it("7shifts: 3 locations × 13 → Essentials highlighted at $149.97", () => {
  expect(hi(q("7shifts", 3, 13))).toMatchObject({ plan: "Essentials", monthlyUsd: 149.97 });
});
it("7shifts: 3 × 40 → Pro $299.97; Essentials and 1–30 Premium don't fit", () => {
  const qs = q("7shifts", 3, 40);
  expect(hi(qs)).toMatchObject({ plan: "Pro", monthlyUsd: 299.97 });
  expect(qs.find((p) => p.plan === "Essentials")!.fits).toBe(false);
});
it("7shifts: 61 per location → only Premium (31+) fits", () => {
  expect(q("7shifts", 1, 61).filter((p) => p.fits).map((p) => p.plan)).toEqual(["Premium"]);
});
it("7shifts: Comp fits 1 location ≤15 but is never highlighted (no auto-scheduling)", () => {
  const qs = q("7shifts", 1, 15);
  expect(qs.find((p) => p.plan === "Comp")).toMatchObject({ fits: true, monthlyUsd: 0, highlighted: false });
  expect(q("7shifts", 2, 15).find((p) => p.plan === "Comp")!.fits).toBe(false);
});
it("Deputy: 3 × 13 → Core $282.75 highlighted; Lite listed, not auto", () => {
  const qs = q("deputy", 3, 13);
  expect(hi(qs)).toMatchObject({ plan: "Core", monthlyUsd: 282.75 });
  expect(qs.find((p) => p.plan === "Lite")).toMatchObject({ monthlyUsd: 214.5, autoScheduling: "no" });
});
it("Deputy: $30 monthly minimum applies", () => {
  expect(q("deputy", 1, 3).find((p) => p.plan === "Lite")!.monthlyUsd).toBe(30);
});
it("When I Work: single-location rate at 1 location, multi rate at 2+", () => {
  expect(hi(q("wheniwork", 1, 10))!.monthlyUsd).toBe(25);
  expect(hi(q("wheniwork", 2, 10))!.monthlyUsd).toBe(100);
});
it("Homebase: Plus highlighted at 3 × $70; Basic only fits 1 location ≤10", () => {
  expect(hi(q("homebase", 3, 13))).toMatchObject({ plan: "Plus", monthlyUsd: 210 });
  expect(q("homebase", 1, 11).find((p) => p.plan === "Basic")!.fits).toBe(false);
});
it("Wiz: Pro $18 highlighted; extra $1 per 500 above 500; Free fits ≤2 loc and ≤25 total", () => {
  expect(hi(q("wiz", 3, 13))).toMatchObject({ plan: "Pro", monthlyUsd: 18 });
  expect(hi(q("wiz", 3, 300))!.monthlyUsd).toBe(19);   // 900 employees
  expect(q("wiz", 2, 12).find((p) => p.plan === "Free")!.fits).toBe(true);
  expect(q("wiz", 2, 13).find((p) => p.plan === "Free")!.fits).toBe(false);
});
it("quote plans show monthlyUsd null and never highlight", () => { /* any tool with basis "quote" */ });
it("clampTeam turns junk into whole numbers 1..10000", () => {
  expect(clampTeam({ locations: "", employeesPerLocation: -4 })).toEqual({ locations: 1, employeesPerLocation: 1 });
  expect(clampTeam({ locations: "2.7", employeesPerLocation: 1e9 })).toEqual({ locations: 2, employeesPerLocation: 10000 });
  expect(clampTeam({ locations: NaN, employeesPerLocation: "abc" })).toEqual({ locations: 1, employeesPerLocation: 1 });
});
it("every tool has a pricingUrl among its sources, checkedOn as YYYY-MM-DD, and en+es text", () => { /* loop TOOLS */ });
it("formatUsd", () => { expect(formatUsd(149.97)).toBe("$149.97"); expect(formatUsd(18)).toBe("$18.00"); });
```

- [ ] **Step 2: Run** `npx vitest run tests/data/competitors.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/data/competitors.ts`.**
  - **Plans:** values copied from the spec's "Constraints: competitor facts" section.
  - **7shifts plans:**
    - Comp: free, auto "no", maxLocations 1, ≤15 per location
    - Essentials: 49.99, ≤30 per location
    - Premium: 149.99, ≤30 per location
    - Pro: 99.99, 31–60 per location
    - Premium: 199.99, ≥31 per location
    - Two plans named "Premium" with different headcount bands is intended; only one fits at a time.
    - Paid 7shifts plans are auto "beta", because the auto-scheduler is a beta and its tier isn't stated.
  - **Deputy:** Lite 5.50 (auto "no"), Core 7.25, Pro 10.00, all `minimumMonthlyUsd: 30`.
  - **Homebase:** Basic 0 (1 location, ≤10, auto "no"), Essentials 30 (auto "no"), Plus 70, All-in-One 120.
  - **When I Work:** "One location" 2.50 per user (maxLocations 1), "Multiple locations" 5.00 per user (minLocations 2).
  - **Wiz:** Free 0 (maxLocations 2, maxTotalEmployees 25, auto "yes"), Pro 18 flat with `extraPer500EmployeesUsd: 1`.
  - **Price rules:** basis "location" = price × locations; "user" = price × locations × per-location headcount; "flat" = price. Round to cents.
  - **Highlighting:**
    - Highlight the cheapest fitting plan whose auto is "yes" or "beta" and whose price is > 0.
    - For Wiz, always highlight Pro.
    - When several plans qualify, highlight exactly one.
  - **Text:** Spanish `text`/`sources` strings are real translations.
  - **Source:** port the en strings from the current `src/views/Compare7shifts.astro` `tools` array and correct them to the spec.

- [ ] **Step 4: Run** the same test. Expected: PASS.

- [ ] **Step 5: Commit** with message `feat(data): sourced competitor plans and quotePlans`.

### Task 2: FAQ block with FAQPage JSON-LD

**Files:**
- Create: `src/lib/faq.ts`, `src/components/Faq.astro`
- Modify: `src/content.config.ts` (compare schema)
- Test: `tests/faq.test.ts`

**Interfaces:**
- Produces:
  - `export interface FaqItem { q: string; a: string }`
  - `export function faqJsonLd(items: FaqItem[]): object`
  - `<Faq items={FaqItem[]} title={string} />`, which renders the visible Q&A list and a `<script type="application/ld+json">`.
  - Compare frontmatter gains:
    - `faq: z.array(z.object({ q: z.string(), a: z.string() })).default([])`
    - `calculator: z.boolean().default(false)`
    - `toolId: z.enum(["7shifts","deputy","homebase","wheniwork"]).optional()`
    - `qualifier: z.string().optional()` (the hero qualifier line)

- [ ] **Step 1: Write the failing test.**
  - `faqJsonLd([{q:"A?",a:"B."}])` equals `{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "A?", acceptedAnswer: { "@type": "Answer", text: "B." } }] }`.
  - `faqJsonLd([])` returns `null`, and `Faq` renders nothing for an empty list.
- [ ] **Step 2: Run** `npx vitest run tests/faq.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `faq.ts`, `Faq.astro` (use `SectionRule`, `m.text.*`, logical utilities) and the schema fields.
- [ ] **Step 4: Run** `npx vitest run tests/faq.test.ts && npm run check`. Expected: PASS, 0 errors. The existing 7shifts entries still validate because of the defaults.
- [ ] **Step 5: Commit** with message `feat(compare): FAQ block with FAQPage JSON-LD`.

### Task 3: Cost calculator island

**Files:**
- Create: `src/islands/CostCalculator.tsx`
- Modify: `src/i18n/en.ts`, `src/i18n/es.ts` (new `calculator` section)
- Test: `tests/islands/CostCalculator.test.tsx`

**Interfaces:**
- Consumes: `TOOLS`, `DEFAULT_TEAM`, `clampTeam`, `quotePlans`, `formatUsd`, `ToolId` (Task 1).
- Produces: `export default function CostCalculator(props: { copy: Copy["calculator"]; toolIds: ToolId[]; locale: SiteLocale })`.
  - Inputs: "Locations" and "Employees per location".
  - For each tool it shows every plan with price, or "doesn't fit" / "contact sales", plus an auto-scheduling marker. The highlighted plan is emphasised.
  - A footnote says list prices, monthly billing, taxes, add-ons and annual discounts excluded, and "checked on {date}".
  - 7shifts gets a note that its auto-scheduler is a beta.
- Copy keys under `calculator`: `title, locations, employeesPerLocation, plan, perMonth, doesNotFit, contactSales, autoYes, autoBeta, autoNo, footnote, sevenShiftsBeta`. en and es must have the same keys (enforced by `tests/locale-parity.test.ts`).

- [ ] **Step 1: Write the failing tests.**
  - The first render (no interaction) shows `$149.97` (7shifts Essentials), `$282.75` (Deputy Core) and `$18.00` (Wiz Pro) for `toolIds=["wiz","7shifts","deputy"]`.
  - Changing "Employees per location" to `40` shows `$299.97`.
  - Typing `""` then `-3` into "Locations" shows no `NaN` and no `-$`, with prices computed for 1 location.
  - The Spanish copy renders when `locale="es"`.
- [ ] **Step 2: Run** `npx vitest run tests/islands/CostCalculator.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement the island.**
  - Keep the raw input as a string in state; derive `Team` through `clampTeam` on every render.
  - Number inputs use `min=1`, `step=1` and `inputMode="numeric"`.
  - Use a `<table>` for the output.
- [ ] **Step 4: Run** the test and `npx vitest run tests/locale-parity.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(compare): per-location cost calculator island`.

### Task 4: Shared alternatives view; 7shifts alternatives in en + es with the fixed example

**Files:**
- Create: `src/views/Alternatives.astro`, `src/pages/es/compare/7shifts-alternatives.astro`
- Delete: `src/views/Compare7shifts.astro`
- Modify: `src/pages/compare/7shifts-alternatives.astro`, `src/i18n/en.ts`, `src/i18n/es.ts` (new `alternatives` section)
- Test: `tests/views/alternatives.test.ts` (render with Astro's `experimental_AstroContainer`; if the repo's Astro version can't do that, move these assertions into Task 9's `check:dist`)

**Interfaces:**
- Consumes: `TOOLS`, `quotePlans`, `DEFAULT_TEAM`, `formatUsd` (Task 1), `Faq` (Task 2), `CostCalculator` (Task 3).
- Produces: `<Alternatives locale={SiteLocale} focus={"7shifts" | "deputy"} />`. Copy lives at `alternatives[focus]`, with keys `title, metaDescription, intro, faq: FaqItem[]` and shared keys `tableHeadings, exampleTitle, exampleNote, strengths, limitations, sources, differencesTitle, differences: {title, body}[], ctaTitle, ctaBody`.

- [ ] **Step 1: Write the failing test.**
  - The en 7shifts page HTML contains `$149.97` and the words "13 employees per location".
  - It does not contain `$299.97` in the worked example.
  - It contains every tool's pricing URL, `FAQPage` and the hero qualifier text.
  - The es page has `lang="es"` and Spanish headings.
- [ ] **Step 2: Run** the test. Expected: FAIL.
- [ ] **Step 3: Implement the view.**
  - Move the layout from `Compare7shifts.astro`.
  - The table rows come from `TOOLS[*].text[locale]`.
  - The worked example comes from `quotePlans(tool, DEFAULT_TEAM)` and shows every fitting plan with the highlighted one marked, stating "3 locations, 13 employees per location".
  - Include `CostCalculator client:visible` with all five tools, then the FAQ.
  - The differences copy follows the spec's message order: a say → fix less → price → honest rest-rule paragraph → import → privacy.
  - Retitle the page for "7shifts alternatives" / "7shifts pricing" searches.
- [ ] **Step 4: Run** the test, then `npm run check && npm run build`. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(compare): data-driven alternatives view; 7shifts alternatives in es; per-location example`.

### Task 5: Rewrite /compare/7shifts (en + es) and extend the Compare view

**Files:**
- Modify: `src/views/Compare.astro`, `src/content/compare/en/7shifts.md`, `src/content/compare/es/7shifts.md`, `src/i18n/en.ts`, `src/i18n/es.ts` (`compare` section: `related`, `howToTurnOn`, `switchingTitle`)
- Test: extend `tests/views/alternatives.test.ts` (or Task 9's dist check) with compare-page assertions

**Interfaces:**
- Consumes: frontmatter fields (Task 2), `CostCalculator` (Task 3), `Faq` (Task 2).
- Produces: `Compare.astro` layout, in this order:
  1. hero (title, description)
  2. `qualifier` line
  3. the markdown body
  4. the calculator, when `calculator: true` (toolIds `["wiz", toolId]`)
  5. `Faq` from the `faq` frontmatter
  6. "checked on"
  7. related links to every other compare page plus both alternatives pages and the roundup (from a `RELATED` list in `src/data/competitors.ts`, `export const COMPARE_PATHS: string[]`)
  8. CTA

- [ ] **Step 1: Write the failing test.** The en and es `/compare/7shifts` HTML:
  - contains "Wiz Scheduler" and does not contain "WizScheduler"
  - contains `FAQPage` and the qualifier sentence
  - contains a static `$149.97`
  - does not contain "11-hour rest rule on every plan" or "Regla de 11 horas de descanso en todos los planes"
  - links to `/compare/7shifts-alternatives` (the es page to `/es/compare/7shifts-alternatives`)
- [ ] **Step 2: Run** the test. Expected: FAIL.
- [ ] **Step 3: Rewrite both markdown files.**
  - **Structure:**
    - Lead: your team had a say
    - How preferences work (firm vs soft, marked compromises, open shifts)
    - Pricing: the existing table corrected for per-location tiers, with "about $300" restated as "3 locations with 31–60 employees each on Pro"
    - Where 7shifts is stronger
    - Fair Workweek, honestly
    - Switching (importer steps from the spec, API token, paid plan, what is and isn't imported)
  - **Frontmatter:** `calculator: true`, `toolId: "7shifts"`, `checkedOn: "2026-11-04"`, at least 5 `faq` items.
    - One FAQ is "How do employees send preferences?", answered with the Company Settings wording.
  - The title targets "7shifts pricing".
- [ ] **Step 4: Run** the test, `npm test`, `npm run check`, `npm run build` and `npm run check:dist`. Expected: all PASS.
- [ ] **Step 5: Commit** with message `feat(compare): 7shifts page leads with employee preferences; FAQ and calculator`.
- [ ] **Step 6: Before opening the PR, re-check the competitor facts.** Re-open each `pricingUrl` and help-center source in `src/data/competitors.ts`. Any difference gets corrected along with `checkedOn`, then commit. Open PR 1, wait for green CI, merge, then confirm the live pages show `$149.97`.

## Milestone B (PR 2): Deputy

### Task 6: /compare/deputy and /compare/deputy-alternatives (en + es)

**Files:**
- Create: `src/content/compare/en/deputy.md`, `src/content/compare/es/deputy.md`, `src/pages/compare/deputy.astro`, `src/pages/es/compare/deputy.astro`, `src/pages/compare/deputy-alternatives.astro`, `src/pages/es/compare/deputy-alternatives.astro`
- Modify: `src/i18n/en.ts`, `src/i18n/es.ts` (`alternatives.deputy`), `COMPARE_PATHS`
- Test: Task 9's dist assertions, plus extended view tests

**Interfaces:**
- Consumes: `Compare` with `toolId: "deputy"`, and `<Alternatives focus="deputy" />`.

- [ ] **Step 1: Write the failing tests.**
  - `/compare/deputy` (en, es) contains `$282.75`, `FAQPage` and the qualifier.
  - It states Deputy's Fair Workweek strength.
  - It mentions the 30-location fast-food threshold from Deputy's docs.
  - `/compare/deputy-alternatives` (en, es) exists and contains every tool's pricing URL.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Write the page.**
  - **Structure:** same as Task 5's markdown.
  - **Pricing section:** shows Lite, Core and Pro with auto-scheduling marked, plus the $30 minimum.
  - **Switching section:** uses the Deputy importer facts. Every employee gets all roles at their location at skill level 1; say so and tell readers to adjust skills after importing.
  - **Title:** targets "Deputy pricing".
  - **Alternatives page:** the title targets "Deputy alternatives".
- [ ] **Step 4: Run** all four checks plus `npm run check:dist`. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(compare): Deputy compare and alternatives pages`. Re-check Deputy's sources (as in Task 5 Step 6), then PR → CI → merge.

## Milestone C (PR 3): Homebase, When I Work, NYC roundup, links, listings

### Task 7: /compare/homebase and /compare/when-i-work (en + es)

**Files:**
- Create: 4 markdown entries and 4 page files, following the 7shifts pattern
- Modify: `COMPARE_PATHS`

- [ ] **Step 1: Write the failing tests.**
  - The pages exist in en and es with `FAQPage`.
  - Homebase shows Plus at `$210.00` for the default team, and notes that Essentials has no auto-scheduling.
  - When I Work states it uses preferred availability but has no coworker preferences.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Write the shorter pages.** Include the lead, pricing, where they're stronger, FAQ (≥3) and `calculator: true`.
- [ ] **Step 4: Run** the checks. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(compare): Homebase and When I Work pages`.

### Task 8: NYC restaurants roundup (en + es)

**Files:**
- Create: `src/views/Roundup.astro`, `src/pages/best-scheduling-apps-nyc-restaurants.astro`, `src/pages/es/best-scheduling-apps-nyc-restaurants.astro`
- Modify: `src/i18n/en.ts`, `src/i18n/es.ts` (`roundup` section), `COMPARE_PATHS`

**Interfaces:**
- Consumes: `TOOLS`, `quotePlans`, `Faq`.
- Produces: `<Roundup locale />`.

- [ ] **Step 1: Write the failing tests.**
  - The en and es pages exist, list all five tools, and contain `FAQPage`.
  - They state Deputy's Fair Workweek strength and the 30-location fast-food / 20-employee retail thresholds, citing Deputy's help article URL.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement the roundup.**
  - Open with the selection criteria: auto-scheduling, employee preferences, Fair Workweek, price for a typical 1–3 location NYC restaurant.
  - Give one section per tool, with "best for" in each.
  - Wiz Scheduler's section is "best for teams that want employees to have a say".
- [ ] **Step 4: Run** the checks. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(guides): best scheduling apps for NYC restaurants`.

### Task 9: Internal links and built-site checks

**Files:**
- Modify: `src/components/Footer.astro`, `src/views/Home.astro` (the en/es home only; see below), `scripts/check-dist.mjs`, `src/i18n/en.ts`, `src/i18n/es.ts` (`footer.compareLinks` labels)

**Interfaces:**
- Consumes: `COMPARE_PATHS`, `isSiteLocale`.
- **Footer:** on `en`/`es` pages only, add links to both alternatives pages and the roundup, with labels from `getSiteCopy`. Other locales keep today's footer unchanged.
- **Home:** one link row to the compare pages on en/es home only (`isSiteLocale(locale)`), using site copy.

- [ ] **Step 1: Write the failing dist checks in `scripts/check-dist.mjs`:**
  - Every path in `COMPARE_PATHS` exists as `dist/<path>/index.html` and `dist/es/<path>/index.html`, each with exactly 3 hreflang links.
  - `dist/ja/compare` does not exist.
  - Each compare page and alternatives page contains `"@type":"FAQPage"`.
  - Each page with a calculator contains the default-team highlighted price as text: 7shifts `$149.97`, Deputy `$282.75`, Homebase `$210.00`. This covers Review Focus #5.
  - The `/` and `/es` footers link `/compare/7shifts-alternatives`.
  - The `/ja` footer is unchanged: it links `/compare/7shifts` and has no new labels.
- [ ] **Step 2: Run** `npm run build && npm run check:dist`. Expected: FAIL on the footer assertions.
- [ ] **Step 3: Implement the footer and home links.**
- [ ] **Step 4: Run** all four checks. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat(links): compare pages linked from footer and home; dist checks`.

### Task 10: Directory-listing copy

**Files:**
- Create: `docs/directory-listings.md`

- [ ] **Step 1: Write the copy.** For G2, Capterra, GetApp and AlternativeTo:
  - product name "Wiz Scheduler"
  - a one-line tagline
  - short (≤160 chars) and long (≤1,000 words) descriptions
  - categories to choose
  - pricing summary from the spec
  - the competitors to list it as an alternative to (7shifts, Deputy, Homebase, When I Work)
  - screenshots to capture
  - Every claim must pass the Global Constraints.
- [ ] **Step 2: Check it.** Grep the file for "WizScheduler", "1,000", "per location" next to "$18", and "export to"; there must be no matches.
- [ ] **Step 3: Commit** with message `docs: directory listing copy`. Re-check sources (as in Task 5 Step 6), then PR 3 → CI → merge, and confirm the live pages.
