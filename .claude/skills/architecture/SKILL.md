---
name: architecture
description: How the WizScheduler marketing site is put together — copy sourced from the app, locales from src/lib/links.ts, content collections, and the guides boundary. Read before changing or reviewing anything here.
---

# Architecture

The marketing site is a static Astro site (`astro ^7`). It holds little logic
of its own: the copy comes from the app repo, the locale rules live in one
file, and long-form content lives in content collections. The pattern ids
below are the only vocabulary architecture findings may use.

## 1. How to use this skill

**Implementers.** Find the section your change touches, follow its rule, and
walk the pattern list (section 8) before you finish.

**Reviewers.** Every architecture finding cites exactly one pattern id, then
the place, then what is wrong. These two are hypothetical; the paths are
placeholders:

```
[copy-from-app] src/i18n/generated/<locale>.ts:<line> was edited by hand; change the app's locale file and run npm run port:copy
[guides-boundary] src/components/<File>.astro is touched by a content/guide-* PR; guide PRs may touch only src/content/guides/** and public/guides/**
```

A finding that cannot name a pattern is not an architecture finding. Flag
violations on changed lines only; existing code is not precedent.

## 2. Copy comes from the app (`copy-from-app`)

`src/i18n/generated/<locale>.ts` (19 files) is written by `npm run port:copy`
(`scripts/port-copy.mjs`) from the app repo's `frontend/src/i18n/<locale>.ts`.
The header of each file says "Do not edit by hand". To change generated copy,
change it in the app repo, then re-run `port:copy` (`APP_REPO` overrides the
sibling-checkout default `../wiz_scheduler`). The script keeps a subset
(`landing`, `features`, `gdpr` fields, and a few common strings); to ship a
new key, extend `pick()` in the script.

Hand-written copy exists only where the app has none: `src/i18n/en.ts` and
`es.ts` (pages that exist in en/es only), `src/i18n/home.ts`, and
`src/i18n/chrome/`. Pages read copy through `getCopy(locale)` (home,
features, nav, footer: any locale) or `getSiteCopy(locale)` (en/es pages).
Never hardcode user-facing text in a page.

## 3. Locales (`locales-single-source`)

`src/lib/links.ts` is the only source of truth:

- `LOCALES`: the 19 locales the app ships.
- `ALL_LOCALE_PATHS`: `/`, `/features` and `/guides` (the guide index), which exist in every locale. Guide pages themselves exist only in the locales that have the guide's file.
- `SITE_LOCALES`: `en` and `es`; every other page exists only in these.
- `RTL_LOCALES`: `ar`, `ur`.

`localePath`, `alternates`, `hasPage` and `dir` decide URLs, hreflang and
text direction. Never build a locale URL by string concatenation. A path
missing in a locale resolves to its English URL.

Two mirrors exist because they cannot import the TS module: the `LOCALES`
array in `astro.config.mjs` and in `scripts/port-copy.mjs`, each marked by a
comment. Changing `LOCALES` means changing all three, and
`tests/locale-parity.test.ts` plus `npm run check:dist` hold the result.

## 4. Content collections (`content-collections`)

`src/content.config.ts` defines the collections:

- `compare` (`src/content/compare/<locale>/*.md`): competitor comparison
  pages, schema-checked (`title`, `description`, `competitor`,
  `competitorUrl`, `checkedOn`).
- `guides` (`src/content/guides/<locale>/<slug>.md`): the daily guides,
  schema-checked by `guideSchema` in `src/lib/guides.ts` (dates are quoted
  `"YYYY-MM-DD"` strings). Pages live under `src/pages/guides/` and
  `src/pages/[locale]/guides/`, rendered by `src/views/Guide.astro` and
  `GuideIndex.astro`; `npm run check:dist` verifies the built pages.

Legal text is not a collection. `src/content/legal/fixture.json` is a
snapshot of the app's public GDPR endpoints, refreshed with
`npm run snapshot:legal`, and read through `src/lib/legal.ts` (CI builds with
`LEGAL_SOURCE=fixture`). Never hand-edit the snapshot and never write legal
wording elsewhere: it is protected.

## 5. Guides boundary (`guides-boundary`)

Daily guide PRs (branches `content/guide-*`) may touch only
`src/content/guides/**` and `public/guides/**`. Anything else in such a PR
(components, layouts, `src/lib`, `src/content.config.ts`, `.github`,
`.claude`, `src/content/legal`) is out of bounds.

The boundary is enforced twice: by CI (`scripts/check-guide-boundary.mjs`,
on pull_request runs and on push runs of `content/guide-*` branches) and
again at merge time by the factory. Do not rely on either; stay inside it.
Both use one name policy: `src/content/guides/<locale>/<slug>.md` and
`public/guides/<seg>/.../<name>.<png|jpg|jpeg|webp|avif>`, every segment
lowercase-hyphenated, extensions lowercase.

Guide markdown also may not contain raw HTML or script, an `h1`, invisible
characters, or links other than `https://` to `wizscheduler.com` and
`app.wizscheduler.com`. Images go in `public/guides/**`. Tailwind does not
scan `src/content/guides/**`, so guide text never becomes CSS. Changing how guides render is a normal feature PR on a
`feat/` branch, never a guide PR.

## 6. Styling (`logical-direction`)

Logical-direction Tailwind only: `text-start`, `ms-*`, `pe-*`, `border-s`,
`rounded-e`, `start-0`; never `text-left`, `ml-*`, `pr-*`, `border-l`,
`rounded-r`, `left-0` and kin. `ar` and `ur` render right-to-left, and
physical utilities break there. `tests/logical-direction.test.ts` scans
`src/**/*.{astro,tsx,ts,css}` (skipping `src/i18n/generated/`) and fails on any
offender.

## 7. Claims (`claims-backed`)

Any product claim (price, limit, feature, integration, compliance) must be
backed by the app repo's code or config; the app is the source of truth.
Check the claim against the app before writing it, and cite where. A claim
that cannot be found there does not ship, however plausible. This holds for
guides too: a guide may explain, but not promise what the app does not do.
It is checked by reviewers and the factory's copy-truth gate, not by a test
in this repo.

## 8. Pattern ids

| id | Rule | Backed by |
|---|---|---|
| `copy-from-app` | Generated copy is never hand-edited; change the app and re-port | `scripts/port-copy.mjs` |
| `locales-single-source` | Locale lists and URL logic come from `src/lib/links.ts` only | `tests/links.test.ts`, `tests/locale-parity.test.ts`, `scripts/check-dist.mjs` |
| `content-collections` | Long-form content lives in `src/content/*` collections declared in `src/content.config.ts`; legal is a protected snapshot | `src/content.config.ts`, `tests/legal.test.ts` |
| `guides-boundary` | Guide PRs touch only `src/content/guides/**` and `public/guides/**`; no raw HTML, script, or off-site links | `scripts/check-guide-boundary.mjs` (CI), factory merge gate |
| `logical-direction` | Logical-direction Tailwind utilities only | `tests/logical-direction.test.ts` |
| `claims-backed` | Every product claim is backed by the app repo | review, copy-truth gate |
