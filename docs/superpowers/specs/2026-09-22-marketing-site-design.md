# WizScheduler marketing site — design

Date: 2026-09-22
Status: approved 2026-09-22; amended during planning (Astro 7, legal documents
fetched from the app API, NYC retail notice corrected to 72 hours)

## Purpose

WizScheduler's public pages (home, features, legal) currently ship inside the
app's Vite/React bundle at https://wizscheduler.com. Search engines see an
empty root element, so no content or comparison page can rank. The GTM plan
(1,200 paying ownership groups, NYC Fair Workweek wedge, PLG free tier)
depends on indexable pages and a free lead-magnet tool.

This repo holds a static marketing site that takes over the apex domain.
The app moves to `app.wizscheduler.com`. The app repo keeps signup, login,
invites, verification and everything behind auth.

## Decisions taken

| Question | Decision |
|---|---|
| Locales at launch | English (default, at `/`) and Spanish (at `/es/`) |
| Hosting | Same AWS account: new private S3 bucket + new CloudFront distribution at apex and www |
| Design | Port the app's current landing look, theme, fonts and copy; extend in that style |
| Generator | Astro 7 with the React integration, Tailwind 3 via PostCSS, TypeScript 5 strict |
| Pages in first release | Home, Features, Privacy, Terms, DPA, NYC Fair Workweek, Compare 7shifts, Free schedule checker |
| Compare target | 7shifts first (NYC restaurant incumbent, app has a 7shifts importer); Deputy later on the same template |
| Checker lead capture | None. Results shown immediately; single sign-up CTA below them |
| Compliance evaluation | Never in the browser. The island only parses and renders; the app's public API (wiz_scheduler issue #116) evaluates |

## 1. Toolchain, layout, locales

### Toolchain

- Astro 7, `@astrojs/react`, `@astrojs/sitemap`, `@astrojs/check`,
  TypeScript 5.9 (`@astrojs/check` does not accept TypeScript 7). Node 24
  pinned in `.nvmrc`; Astro 7 needs Node 22.12+.
- Tailwind 3.4 wired through `postcss.config.cjs`, not `@astrojs/tailwind`
  (that integration stops at Astro 5). Astro picks PostCSS up automatically.
- `tailwind.config.ts` copied from `wiz_scheduler/frontend`: palette
  (cream, sage, accent, ink, newsprint, paper, rule, marker, clear), font
  families (`display`, `body`, `data` via CSS variables) and the `wiz-glow`
  keyframes. Classes from the app port unchanged.
- Fonts copied to `public/fonts` (Archivo, Source Sans 3, IBM Plex Mono
  woff2 subsets) with the same preload tags the app's `index.html` uses.
- `motion` is a dependency for `RotaHero` and `SectionRule` only.
- `xlsx` (SheetJS community build) is a dependency for the checker island
  only, installed from the SheetJS CDN tarball
  (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`); the npm registry
  copy is frozen at 0.18.5 with open advisories.
- Vitest for unit tests. Playwright optional for pre-cutover checks; not
  part of CI in this release.

### Layout

```
wiz_scheduler_marketing/
  .nvmrc
  astro.config.mjs               i18n: locales [en, es], defaultLocale en, prefixDefaultLocale false
  tailwind.config.ts
  src/
    layouts/Base.astro           <head> (fonts, meta, OG/Twitter, canonical, hreflang), Nav, Footer
    components/
      Nav.astro                  ported from MarketingNav; language links, app links
      Footer.astro               ported from MarketingFooter
      SectionRule.astro          static version; motion variant only where the app animates it
      Seo.astro                  meta tags from page frontmatter
    islands/
      RotaHero.tsx               ported from the app (client:load)
      Checker.tsx                the free schedule checker (client:visible)
    pages/
      index.astro
      features.astro
      privacy-policy.astro
      terms.astro
      dpa.astro
      nyc-fair-workweek-scheduling.astro
      compare/7shifts.astro
      free-schedule-checker.astro
      404.astro
      es/                        same files, Spanish
    content/
      legal/fixture.json         snapshot of the app API's three legal documents
      compare/{en,es}/7shifts.md
    i18n/
      en.ts, es.ts               typed copy objects (subset of the app's locale files: landing, features, gdpr, nav)
      index.ts                   getCopy(locale) + t helper
    lib/
      site.ts                    APP_URL, API_URL, SITE_URL constants
      legal.ts                   build-time fetch of /gdpr/{privacy-policy,terms,dpa}, fixture fallback
      checker/
        parse.ts                 CSV / TSV / XLSX -> rows; header guessing
        request.ts               rows -> API payload; caps; timezone default
        types.ts
    theme.ts                     the `marketing` class-name object from the app
  public/
    fonts/, favicon.svg, og-image.png, robots.txt, sample-schedule.csv
  tests/
    locale-parity.test.ts
    logical-direction.test.ts
    checker/*.test.ts
  .github/workflows/
    ci.yml                       PR: install, typecheck, test, build
    deploy.yml                   main: build, s3 sync --delete, cloudfront invalidation
  docs/superpowers/specs/
```

### Locales

- Astro built-in i18n routing. English at `/`, Spanish at `/es/`. Every
  page emits `<link rel="alternate" hreflang>` for both plus `x-default`,
  and a locale-specific canonical.
- The language control in the nav is two links, not a runtime switch. No
  client-side locale state, no flash of English on Spanish pages.
- Copy for template-driven pages lives in typed objects (`i18n/en.ts`,
  `i18n/es.ts`) sharing one `Copy` type. A missing Spanish key is a
  TypeScript build error. Compare pages are Markdown per locale. Legal documents are
  English only because the app API serves a single version; Spanish routes
  show the English text inside Spanish page chrome with a one-line note.
- Spanish copy for ported sections comes from the app's `es.ts`. New pages
  get new Spanish copy written alongside the English.
- Other locales (including RTL `ar` and `ur`) are out of scope. Adding one
  later = one i18n file + one folder under `pages/` + Markdown per page.
- `document.dir` is not set; both launch locales are LTR. Logical direction
  utilities are still required (see Testing) so a future RTL locale is a
  copy task, not a CSS audit.

## 2. Pages and content sources

### Ported from the app (both locales)

- **Home** (`/`): rota hero; three principal features; nine supporting
  features; strategies; "what the scheduler considers" (from wiz_scheduler
  PR #114, so the site does not regress once that merges); GDPR compliance
  block; pricing tile; sign-up CTA. Copy from the app's `landing.*` keys.
- **Features** (`/features`): ported as is.
- **Privacy policy** (`/privacy-policy`), **Terms** (`/terms`),
  **DPA** (`/dpa`): the app does not hold these as static text; it serves
  them from public, unauthenticated API endpoints (`GET
  /api/v1/gdpr/{privacy-policy,terms,dpa}`, hardcoded in
  `backend/routers/gdpr.py`, version 1.0, effective 2026-04-05, DPA carries a
  processors table). Consent records in the app reference that version, so
  the API stays the single source. The site fetches the three documents at
  build time (`LEGAL_SOURCE=api`, used by the deploy workflow) and falls
  back to a committed snapshot `content/legal/fixture.json`
  (`LEGAL_SOURCE=fixture`, the default for local and PR builds). A script
  refreshes the snapshot. Paths are identical to the app's so existing
  emails and the app footer keep working after cutover.

### New pages

- **NYC Fair Workweek scheduling** (`/nyc-fair-workweek-scheduling`).
  Sections: who the law covers (fast food establishments that are part of a
  chain of 30 or more nationally; retail employers with 20 or more employees
  in NYC); the fast food rules in plain words (14-day advance notice;
  11 hours between shifts or a $100 clopening premium with written consent;
  schedule-change premiums of $10 to $75 by notice window; offer hours to
  existing staff before hiring) and the retail rules (72 hours' notice, no
  on-call shifts, no additions or cancellations inside 72 hours without
  consent); fines of $500 per violation per worker, $750 for a second within
  two years, $1,000 after that; how WizScheduler enforces
  each today — the 11-hour rule is enforced in generation and validation,
  notice tracking and premiums are roadmap and are labelled as such, never
  implied as shipped; CTA to the checker; CTA to sign up. Legal facts cite
  the NYC Department of Consumer and Worker Protection Fair Workweek page
  and carry a visible "reviewed on <date>" line.
- **Compare: 7shifts** (`/compare/7shifts`). Markdown page from a
  template: positioning, pricing model (flat rate vs per-location tiers),
  feature table, "switching" section that names the 7shifts importer, CTA.
  Rules: only facts checkable on 7shifts' public pricing and feature pages;
  every competitor claim carries a "checked on <date>" note; no
  superlatives about the competitor; no invented quotes or testimonials.
- **Free schedule checker** (`/free-schedule-checker`). See section 3.
- **404** (`/404`): served with a real 404 status for unknown paths.

### Shared

- Per-page frontmatter drives title, description, OG/Twitter tags,
  canonical and hreflang through `Seo.astro`. `og-image.png` reused from the
  app; per-page images are out of scope.
- `sitemap-index.xml` and `robots.txt` generated at build. The app's copies
  are removed from the app repo at cutover.
- Sign-in and sign-up links use `APP_URL` from `lib/site.ts`
  (`https://app.wizscheduler.com`). One constant, one place to change at
  cutover.
- Sign-up links from the NYC page and the checker append
  `?preset=nyc-fair-workweek`. The app's register page may read it later to
  preselect an 11-hour rest default; until then it is ignored. This repo
  makes no assumption beyond appending the parameter.

### Out of scope (this release)

Blog, per-city pages beyond NYC, Deputy compare page, a standalone pricing
page, per-page OG images, cookie banner (no cookies are set by this site).

## 3. Free schedule checker

### User flow

1. Visitor picks a `.csv` or `.xlsx` file, or pastes tab-separated rows
   from a spreadsheet into a textarea. Required columns: employee, start,
   end. A downloadable `sample-schedule.csv` (initials, not names) shows
   the expected shape.
2. The island guesses the three columns from the headers and shows them in
   three dropdowns for confirmation. An optional "schedule posted on" date
   field enables the 14-day notice check.
3. On "Check", results render on the same page: totals (employees checked,
   clopenings, short-notice shifts), then one card per employee listing
   each finding with the measured rest hours or notice days and the two
   shifts involved.
4. Below results: one CTA, "Fix this schedule automatically — sign up
   free", to `APP_URL/register?preset=nyc-fair-workweek`.

### Implementation

- `islands/Checker.tsx` (React, `client:visible`) owns UI state only.
- `lib/checker/parse.ts`: CSV parsed by a small hand-written RFC-4180
  parser (quoted fields, embedded commas, CRLF); TSV paste split on tabs;
  XLSX via SheetJS reading the first sheet. Output: `{ headers, rows }`.
  Header guessing matches case-insensitively against a short synonym list
  (employee/name/staff; start/in/begin; end/out/finish).
- `lib/checker/request.ts`: rows + mapping + options -> API payload
  matching wiz_scheduler issue #116: `timezone` (browser zone via
  `Intl.DateTimeFormat().resolvedOptions().timeZone`, default
  `America/New_York` if unavailable), `min_rest_hours` 11,
  `notice_days` 14, optional `published_at`, `shifts[{employee,start,end}]`.
  Datetimes are passed through as parsed strings; the API interprets naive
  values in `timezone`. The island does not compute rest or notice itself.
- Payload cap enforced client-side before any request (same limit as the
  API, 2,000 shifts) with an inline message.
- `API_URL` is `https://app.wizscheduler.com/api/v1`; the endpoint is
  `POST /public/compliance-check`. CORS is the API's responsibility (the
  API reads its allowed origin from settings; production sets it to the
  apex).
- Privacy line next to the button: rows are sent to WizScheduler's API for
  evaluation and are not stored; employee names can be replaced with
  initials first.

### Failure handling

| Case | Behaviour |
|---|---|
| Unparseable file / no rows / mapping incomplete | Inline message under the picker; no request |
| More than the payload cap | Inline message with the cap; no request |
| API 429 | "The checker is busy, try again in a minute"; results area empty |
| API 4xx other / 5xx / network | "Couldn't check right now"; results area empty; never a fabricated result |
| API not yet deployed | Island renders a "coming soon" state behind a build-time flag `PUBLIC_CHECKER_ENABLED`; the page and its SEO ship regardless |

### Dependency

The checker goes live only after wiz_scheduler issue #116 is deployed to
production. Until then `PUBLIC_CHECKER_ENABLED=false` in the deploy
workflow.

## 4. Deployment and cutover

### This repo

- `ci.yml` on pull requests: `npm ci`, typecheck, `vitest run`,
  `astro build`. No deploy.
- `deploy.yml` on push to `main`: build, `aws s3 sync dist/ s3://$BUCKET
  --delete`, `aws cloudfront create-invalidation --paths "/*"`.
- Credentials: a dedicated IAM user (or OIDC role) scoped to
  `s3:PutObject/DeleteObject/ListBucket` on the marketing bucket and
  `cloudfront:CreateInvalidation` on the marketing distribution only. Not
  the app's CI user. Repository secrets `AWS_ACCESS_KEY_ID`,
  `AWS_SECRET_ACCESS_KEY`; repository variables `MARKETING_BUCKET`,
  `MARKETING_DISTRIBUTION_ID`, `PUBLIC_CHECKER_ENABLED`.
- Static routing: Astro emits `features/index.html`. CloudFront with an S3
  origin does not resolve directory indexes, so the marketing distribution
  carries a viewer-request CloudFront Function that appends `index.html`
  to paths without a file extension (and `/index.html` to paths ending in
  `/`). `404.html` is mapped as the custom error page with status 404.

### App repo terraform (human-owned; agents may not edit `terraform/**`)

1. New private S3 bucket + OAC + second `aws_cloudfront_distribution`
   using the existing wildcard ACM cert, aliases `[apex, www]`, the
   index-rewrite function above, and the existing `www_to_apex` function
   moved onto it.
2. Existing app distribution: aliases become `["app.<domain>"]`. S3
   origin, `/api/*` behavior and error responses unchanged.
3. Route53: apex and www A/AAAA aliases -> new distribution; new `app`
   record -> existing distribution.
4. New variable `app_domain` (default `app.<domain_name>`). `FRONTEND_URL`,
   the CORS allowed origin, `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL`
   in `ecs.tf` derive from it instead of `domain_name`, so invite,
   verification and reset emails link to the app host. The compliance
   API's allowed origin (issue #116) is set to `https://<domain_name>`.
5. Google sign-in: add `https://app.<domain>` to the OAuth client's
   authorized JavaScript origins in the Google console.

### Cutover order

1. Deploy the site to its bucket; verify every route on the distribution's
   `*.cloudfront.net` hostname before touching DNS.
2. One terraform apply: new distribution, alias change, Route53 records,
   `app_domain` wiring. Quiet hour; the app alias change causes a brief
   window of certificate/alias propagation.
3. App repo follow-up PR: root path redirects to `/login`; `/features`,
   `/privacy-policy`, `/terms`, `/dpa` redirect to the apex equivalents;
   `sitemap.xml`/`robots.txt` removed from the app; marketing components
   deleted in a later cleanup.
4. Old apex bookmarks land on marketing home, which links to login and
   sign-up.

### Rollback

Revert the Route53 records and the alias change in one terraform apply.
The marketing bucket and distribution can remain.

## 5. Testing and verification

### CI on every pull request

- TypeScript strict build (typed copy objects make missing Spanish keys a
  compile error).
- `tests/locale-parity.test.ts`: `en` and `es` copy objects have identical
  deep key sets.
- `tests/logical-direction.test.ts`: ported from the app; rejects physical
  Tailwind utilities (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`,
  `text-left`, `text-right`, `border-l`, `border-r`, `rounded-l`,
  `rounded-r`) in `src/**`.
- `astro build` validates internal links (via `astro check` and the build's
  route resolution).

### Unit tests (Vitest)

- `parse.ts`: CSV with quoted fields and embedded commas, CRLF, TSV paste,
  XLSX first sheet, header guessing hits and misses, blank cells, file with
  none of the expected columns.
- `request.ts`: naive datetimes pass through with the browser timezone,
  NYC defaults applied, `published_at` omitted when blank, cap exceeded
  short-circuits.
- `Checker.tsx` rendering: totals and per-employee cards from a fixed API
  response; empty result; 429 state; network failure state; coming-soon
  state.

### Pre-cutover (manual or Playwright)

- Every route in both locales returns 200 from the CloudFront hostname;
  an unknown path returns 404 with the 404 page.
- View-source of `/` contains the full page HTML.
- Login/sign-up links resolve to `https://app.wizscheduler.com/...`.
- Lighthouse mobile on `/` and `/nyc-fair-workweek-scheduling`:
  Performance and SEO >= 90.
- Checker end-to-end against production with `sample-schedule.csv` once
  issue #116 is deployed.

### Post-cutover

- Google Search Console: sitemap submitted; apex pages crawled within a
  week.
- Invite, verification and password-reset emails carry app-subdomain
  links.
- Google sign-in succeeds on the app subdomain.

## Dependencies on wiz_scheduler

| Item | Where | Owner |
|---|---|---|
| Public compliance-check API + CORS setting | issue #116 | agent pipeline |
| Activation funnel (attributes checker/NYC signups) | issue #115 | agent pipeline |
| Legal documents (public GDPR endpoints, already live) | `backend/routers/gdpr.py` | none |
| Terraform: bucket, distribution, aliases, Route53, `app_domain` | `terraform/**` | human |
| Google OAuth origin | Google console | human |
| App redirects + marketing component removal | follow-up PR | either |
