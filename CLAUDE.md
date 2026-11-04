# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WizScheduler Marketing Site — Static site built with Astro, featuring product information, pricing, feature documentation, and legal pages. Deployed via CloudFront + S3 with CI/CD integration.

## Tech Stack

- **Static Site Generator**: Astro 7.x (`astro ^7`)
- **Styling**: Tailwind CSS
- **Internationalization**: 19 locales (`LOCALES` in `src/lib/links.ts`); home and features in all 19, every other page in `SITE_LOCALES` (en, es)
- **Build**: Node.js, npm
- **Deployment**: CloudFront + S3
- **Testing**: Vitest (`tests/`), including the logical-direction guard

## Development Commands

```bash
npm install                    # install dependencies
npm run dev                    # dev server on :3000
npm run build                  # production build to dist/
npm run preview                # preview production build locally
npm run check                  # astro check (type check)
npm test                       # run tests (vitest)
npm run check:dist             # assert dist/ locales, lang/dir and hreflang (run after build)
npm run port:copy              # regenerate src/i18n/generated/ from the app repo (APP_REPO overrides ../wiz_scheduler)
npm run snapshot:legal         # refresh src/content/legal/fixture.json from the app's GDPR endpoints
```

## Architecture

### Directory Structure

- `src/pages/` — Astro page routes (auto-routed)
- `src/views/` — Reusable page components (Pricing.astro, Home.astro, etc.)
- `src/components/` — Reusable UI components
- `src/layouts/` — Page layout wrappers
- `src/i18n/` — Internationalization strings (`generated/` for all 19 locales, `en.ts`/`es.ts` for en/es-only pages)
- `src/lib/` — `links.ts` (locale source of truth), `legal.ts`, `checker/`
- `src/content/` — content collections (`compare`, guides) and the legal snapshot
- `src/theme.ts` — Design tokens and theme utilities

### Localization

Copy for home and features in all 19 locales lives in `src/i18n/generated/<locale>.ts`, written by `npm run port:copy` from the app repo. Never hand-edit it; change the app's locale file and re-port. Pages import `getCopy(locale)` (any locale) or `getSiteCopy(locale)` (en/es pages). Never hardcode user-facing text. Locale lists and URLs come only from `src/lib/links.ts` (`LOCALES`, `SITE_LOCALES`, `ALL_LOCALE_PATHS`, `RTL_LOCALES`, `localePath`).

### Styling

- Use **logical direction utilities** in Tailwind: `text-start` not `text-left`, `ms-2` not `ml-2`, `pe-4` not `pr-4`
- RTL languages (ar, ur) are supported; physical utilities will look wrong in those locales
- `tests/logical-direction.test.ts` enforces this convention

### Guides

Daily guides live in the guides collection (`src/content/guides`, added by the guides-line PR). Guide PRs (`content/guide-*`) may touch only `src/content/guides/**` and `public/guides/**`, with no raw HTML, script, or links outside wizscheduler.com and app.wizscheduler.com. See `.claude/skills/architecture/SKILL.md` for the boundary and the named patterns reviewers cite.

## Pricing & Product Information

- **Pricing pages**: `src/pages/pricing.astro` and `src/views/Pricing.astro`
- **Home page**: `src/pages/index.astro` and `src/views/Home.astro`
- Update pricing in both files when models change:
  1. `Pricing.astro` metering table
  2. `Home.astro` meters grid and pricing overview section
- Pricing model reference: Check `/wiz_scheduler/backend/config.py` for source of truth

## Git Workflow

**All code changes must follow this workflow:**

1. **Create a feature branch** — Never commit directly to `main`
   - Branch naming: `feat/`, `fix/`, `chore/`, `docs/` prefix
   - Example: `feat/manager-pricing`, `fix/homepage-layout`

2. **Push the feature branch** — Push to origin for CI visibility
   - `git push -u origin <branch-name>`

3. **Create a GitHub PR** — Do not merge without review
   - Use `gh pr create --base main --head <branch-name>`
   - Include summary, changes, and test plan in PR description

4. **Wait for CI to pass** — All automated checks must succeed
   - GitHub Actions must pass
   - No merge if CI fails

5. **Merge only after CI passes** — Use the PR to merge
   - Review the CI results before merging
   - Merge via GitHub PR interface, not `git merge` directly

**Exception:** Emergency hotfixes to production may skip PR review with explicit user confirmation, but must still wait for CI to pass before merging to main.

## Conventions

- All timestamps use UTC (no local timezones in marketing copy)
- Pricing information is kept in sync with backend config
- Feature descriptions never hardcode product names — use localization keys
- Legal documents (Privacy, Terms, DPA) are versioned in `src/content/legal/`
- No env-specific secrets in code; all config via environment variables

## Related Projects

- **Main app**: https://github.com/rubinder/wiz_scheduler — Source of truth for pricing, features, config
- **Live site**: https://wizscheduler.com — CloudFront-backed, auto-deploys on main merge
