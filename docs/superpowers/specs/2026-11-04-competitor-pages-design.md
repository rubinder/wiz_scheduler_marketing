# Competitor pages: 7shifts, Deputy and neighbours — design

Date: 2026-11-04. Status: approved in conversation, pending builder check.

## Intent

Make wizscheduler.com rank for the searches people run when they are
thinking of leaving 7shifts or Deputy ("7shifts pricing", "7shifts
alternatives", "Deputy pricing", "Deputy alternatives", "7shifts vs …"),
and convert those readers.

Search Console on 2026-11-04: "7shifts pricing" sits at position ~92, the
site is about four weeks old and has almost no backlinks. Third-party pricing
aggregators that rank for these searches show stale prices, so a page with
current, sourced prices has a real opening.

### The message (decided by the owner, in this order)

1. **Employees get a say in their schedule.** This is the headline. With
   7shifts or Deputy the manager builds the week, or the tool drafts it from
   sales history or labor cost, and staff live with the result. In
   WizScheduler employees state preferred days, preferred hours, a weekly hour
   limit, and who they work well with or should be kept apart from, and the
   generator builds the week around that. Working headline: *"The schedule
   your team had a say in."*
2. **So managers fix less.** Customers told the owner they still had to make
   many adjustments to schedules 7shifts and Deputy produced. Preferences are
   already in the draft, and every compromise is marked.
3. **Price.** $18 a month for every location, against 7shifts' per-location
   and Deputy's per-user pricing.

Ties to the homepage hero (app PR #233, marketing #14): staff retention and
manager time.

## Goals

- Rewrite `/compare/7shifts` around the message above.
- New `/compare/deputy`, same structure.
- New `/compare/deputy-alternatives`, a sister to the existing
  `/compare/7shifts-alternatives` (rebuilt in PR #17).
- New shorter `/compare/homebase` and `/compare/when-i-work`.
- New roundup: best scheduling apps for NYC restaurants. Slug is the builder's
  call (suggest `/best-scheduling-apps-nyc-restaurants`).
- Every page above in **English and Spanish**, matching the existing compare
  pages (`SITE_LOCALES = ["en", "es"]`).
- Titles and meta descriptions aimed at the searches listed under Intent.
- FAQ section on each compare page, with `FAQPage` JSON-LD.
- A cost calculator on the 7shifts and Deputy pages: the reader enters
  locations and employees and sees each tool's monthly list price.
- A step-by-step "switching" section on the 7shifts and Deputy pages, based
  on the importers.
- Internal links: every compare page links to the others; footer and homepage
  link to the compare pages (at minimum the two alternatives pages and the
  NYC roundup).
- Directory-listing copy, ready to paste, for G2, Capterra, GetApp and
  AlternativeTo (a markdown file in `docs/`, not a page). The owner creates
  the accounts and submits.

## Non-goals

- Translating compare pages into the other 17 locales.
- Changing the app. In particular **employee preference requests stay off by
  default** (owner's decision); the pages tell readers how to turn them on.
- Submitting directory listings or creating accounts on third-party sites.
- Paid ads on competitor brand terms.

## Anti-goals (would make this a failure even if it ships)

- **Any claim that is not true.** The previous alternatives page invented
  competitor facts and overstated ours; PR #17 had to remove them. Every
  competitor fact must come from the vendor's own pricing page or help center
  and be dated. Every WizScheduler claim must match the app as shipped (facts
  below).
- Promising "a schedule you never have to fix". The app reduces fixing; it
  does not eliminate it.
- Competing on Fair Workweek. Deputy (and 7shifts) do more there; say so.
- Disparaging tone. Each page keeps a fair "where they are stronger" section.

## Constraints: WizScheduler facts the copy must respect

Source: `wiz_scheduler` repo, verified 2026-11-04.

- **Preferences.** Managers can set, per employee: preferred days (up to 3),
  preferred time ranges, weekly max hours, frequency caps ("at most N shifts
  in this time range a week"), unavailable times, and coworker relationships
  (work with / keep apart / never together, limited to people who share a
  location). Employees can request these themselves only when an admin turns
  on employee preference requests in **Company Settings**; a manager approves
  each request and sets its weight. Off by default.
- **How preferences act.** Weight 1.0 is a firm rule: the employee is not
  considered; if nobody else qualifies the shift is left **open**. Lower
  weights are soft: the employee is a less likely pick. A shift assigned
  against a soft preference gets a visible marker (asterisk). Applies to both
  Normal Generate and AI Generate.
- **Manager priority weights** (seniority, pay rate, overtime) affect Normal
  Generate only. AI Generate uses fixed weights. Don't claim managers tune AI.
- **Strategies (Normal Generate):** random, rotation, rotation with ~3 months
  of history, max hours. Nothing "learns".
- **Hard rules on every generation:** role, availability and unavailability,
  weekly max hours, minimum rest between shifts (per-location setting, **off
  until set**, e.g. 11 hours), never-together pairs.
- **Fair Workweek:** only the minimum-rest rule. No advance-notice tracking,
  no predictability/premium pay, no change log. The free public checker
  (`/free-schedule-checker`) checks rest and 14-day notice on an uploaded
  schedule; it is not part of the scheduling product.
- **Pricing:** Free: 2 locations, 25 employees, 1 schedule per location a
  month, 2 attempts, no AI Generate. Pro: $18/month base, unlimited locations;
  includes 500 employees ($1 per extra 500), 50 manager seats ($5 per extra
  50), 25 schedule generations ($0.10 per extra 25), 0.5 GB storage ($0.50/GB).
  AI Generate is not included: paid from prepaid credit packs ($10/$25/$50).
  No annual discount. No employee cap.
- **Importers** (paid plan only, API token pasted by the user, no OAuth/CSV):
  - 7shifts: companies, locations, departments, roles, employees and their
    assignments; separate availability import (weekly availability,
    unavailability, approved time off).
  - Deputy: locations, roles, employees with email (every employee gets all
    roles at their location at skill level 1), unavailability as blackouts;
    separate availability import.
  - Neither imports preferences or coworker relationships.
- **Other:** QR check-in on paid plan; no POS integration, sales forecasting,
  tip pooling or payroll processing. Employee pages in 19 languages. Employee
  names are pseudonymized before anything is sent to the AI model.

## Constraints: competitor facts

Checked 2026-11-04 from vendor sources. These already back
`src/views/Compare7shifts.astro` (PR #17); the builder re-checks each before
publishing and records the date.

- **7shifts** (https://www.7shifts.com/pricing/): per location per month.
  Comp free (1 location, 15 employees). 1–30 employees: Essentials $49.99,
  Premium $149.99. 31+: Pro $99.99 (up to 60), Premium $199.99. 10% annual
  discount. Payroll add-on $39.99/location + $6/employee. Auto-scheduler is a
  beta rolling out to selected accounts; drafts from ≥6 weeks of sales and
  schedule history, checks availability; docs don't mention shift or coworker
  preferences. Fair Workweek alerts on paid plans (clopens, <14-day changes,
  premiums).
- **Deputy** (https://www.deputy.com/pricing): per user per month. Lite
  $5/$5.50, Core $6.50/$7.25, Pro $9/$10 (annual/monthly). $30/month minimum
  on monthly plans. No free plan. Auto-scheduling on Core and Pro; auto-fill
  by cost, equal hours, or "learn from me"; docs don't mention preferences.
  Strongest NYC Fair Workweek support of the set (consent, premiums, notice,
  rest). Deputy's own docs say NYC fast-food Fair Workweek applies to chains
  with 30+ locations nationwide and NYC retail to employers with 20+ employees.
- **Homebase** (https://www.joinhomebase.com/pricing): per location. Basic
  free (1 location, 10 employees); Essentials $30/$24, Plus $70/$56, All-in-One
  $120/$96 (monthly/annual). AI scheduling assistant from Plus; marketing says
  it uses availability and preferred shifts. No NYC Fair Workweek features
  found.
- **When I Work** (https://wheniwork.com/pricing): $2.50/user (one location),
  $5/user (multiple). No free plan. Auto-assign on every plan; can require
  70% overlap with preferred availability and respect max hours; no coworker
  preferences. No NYC Fair Workweek features found.

## Decided parts of the how

- **Product name is "Wiz Scheduler"** (two words; owner, 2026-11-04) in
  titles, copy and directory listings. Replace "WizScheduler" in the compare
  content files as they are rewritten.

- **One shared competitor data module** (e.g. `src/data/competitors.ts`)
  holding each tool's prices, plan names, feature cells, sources and
  `checkedOn`. The alternatives pages, compare pages, calculator and roundup
  all read from it, so a price change is one edit. Move the data now inline
  in `Compare7shifts.astro` into it.
- **Calculator** is a small React island, consistent with the existing
  islands (`src/islands/`). It must render a sensible static default (the
  3-location, 40-employee example) without JavaScript so crawlers see real
  numbers. List prices only; label taxes, add-ons and annual discounts as
  excluded.
- **Spanish** pages are real translations, written to the same standard as
  `src/content/compare/es/7shifts.md`.
- **hreflang**: `alternates()` in `src/lib/links.ts` advertises an `es`
  alternate for every non-home path. `/compare/7shifts-alternatives` currently
  has no Spanish page, so its `es` alternate 404s. Shipping the Spanish
  alternatives pages fixes it; every new page must exist in both locales.
- **Wording about the preference toggle:** "Turn on preference requests in
  Company Settings and your employees can send their preferences for you to
  approve."
- Follow the repo's conventions in `CLAUDE.md`: logical Tailwind utilities
  (`ms-`, `pe-`, `text-start`), and run `npm run check`, `npm test`,
  `npm run build` and `npm run check:dist` before each PR.

## Calls made after the builder check (author's calls, owner may override)

- **Pricing comparisons never overstate a competitor.** When a vendor's
  pricing is ambiguous, use the reading that makes the competitor cheaper,
  and say which reading was used.
- **Show each competitor's plan options, not one number** (owner,
  2026-11-04). Wherever we price a competitor (calculator, worked examples,
  tables), list every published plan that fits the reader's size with its
  price and what it adds or lacks (e.g. 7shifts Essentials vs Premium,
  Deputy Lite vs Core vs Pro, Homebase Essentials vs Plus vs All-in-One),
  and mark which ones include auto-scheduling. The cheapest plan with
  auto-scheduling is the one highlighted for the comparison, not the only
  one shown. Plans sold only by quote are listed as "contact sales".
- **7shifts' tier depends on headcount per location** (owner, 2026-11-04):
  its caps ("up to 30" Essentials, "up to 60" Pro) sit inside the
  per-location price, so a location with 1–30 employees is on Essentials and
  one with 31–60 on Pro. Every 7shifts price we show must state the
  per-location headcount it assumes, and the calculator asks for employees
  **per location** (not a company total) so it can pick the tier. The worked
  example on `/compare/7shifts-alternatives` currently prices 3 locations /
  40 employees at Pro ($299.97); about 13 per location is Essentials,
  3 × $49.99 = $149.97. Fix it in the first PR by stating the per-location
  headcount and showing the matching tier. Same check for the "about $300"
  sentence on `/compare/7shifts` (it says "on 7shifts Pro", so it must say
  the locations have 31–60 employees each).
- **Every size tier stays visible** (owner, 2026-11-04). In worked examples
  and the calculator, list every plan of a competitor, including tiers that
  don't fit the reader's team, each labelled with its headcount (and location)
  range, e.g. 7shifts Essentials "1–30 per location", Pro "31–60 per
  location", Premium "31+ per location". Plans that don't fit show what they
  would cost for that number of locations, clearly marked as not fitting
  (e.g. "for 31–60 per location"); only the fitting tiers are compared, and
  the highlighted plan is still the cheapest fitting one with auto-scheduling.
- **Calculator baseline:** each tool's cheapest plan that includes
  auto-scheduling, because that is what these pages compare. 7shifts: the
  tier for the per-location headcount (its auto-scheduler is a beta; say so).
  Deputy: Core. Homebase: Plus ($70/location monthly; note the $0 promo
  shown on its site without counting it). When I Work: single- or
  multi-location rate. WizScheduler: Pro $18 (the free plan's 1 schedule a
  month is not a fair comparison). Monthly billing; taxes, add-ons and annual
  discounts excluded and labelled.
- **No customer claims** (owner, 2026-11-04: no attributable quote exists).
  Message 2 is argued from how the product works: preferences are in the
  draft, compromises are marked.
- **Headline qualifier:** wherever "your team had a say" appears in a hero,
  the line under it says managers can enter preferences for everyone, and
  employees can send their own once preference requests are turned on in
  Company Settings. FAQ includes the same.
- **Internal links in 19 locales:** add compare links only where the label
  already exists in every locale (`t.nav.compare`), or only on en/es pages.
  No new strings in the 17 other chrome locale files.
- **Existing copy:** the rewrite of `/compare/7shifts` replaces any claim that
  conflicts with the facts above (e.g. "11-hour rest on every plan" becomes
  the opt-in per-location rule). Retitling `/compare/7shifts-alternatives` is
  allowed if it serves the target searches.

## Left to the builder

- Page layouts and visual design, within the site's existing theme
  (`src/theme.ts`, `SectionRule`, `prose-rota`). Whether the compare pages
  stay as markdown content entries or become views.
- Exact headlines, titles, meta descriptions and FAQ questions, within the
  message and the facts above.
- The roundup's slug, selection criteria and ordering. It includes
  WizScheduler, 7shifts, Deputy, Homebase and When I Work at minimum, judged
  fairly; noting Deputy's Fair Workweek strength and the 30-location
  fast-food threshold is required.
- Which homepage section gets the compare links.
- Splitting the work into PRs (suggested: data module + 7shifts page;
  Deputy pages; Homebase / When I Work / roundup; listing copy).
