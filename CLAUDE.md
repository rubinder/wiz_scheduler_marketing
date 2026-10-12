# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WizScheduler Marketing Site — Static site built with Astro, featuring product information, pricing, feature documentation, and legal pages. Deployed via CloudFront + S3 with CI/CD integration.

## Tech Stack

- **Static Site Generator**: Astro 4.x
- **Styling**: Tailwind CSS
- **Internationalization**: i18n (en, es, ar, ur)
- **Build**: Node.js, npm
- **Deployment**: CloudFront + S3
- **Testing**: Component tests for logical direction utilities

## Development Commands

```bash
npm install                    # install dependencies
npm run dev                    # dev server on :3000
npm run build                  # production build to dist/
npm run preview                # preview production build locally
npm test                       # run tests
npm run lint                   # run linter
```

## Architecture

### Directory Structure

- `src/pages/` — Astro page routes (auto-routed)
- `src/views/` — Reusable page components (Pricing.astro, Home.astro, etc.)
- `src/components/` — Reusable UI components
- `src/layouts/` — Page layout wrappers
- `src/i18n/` — Internationalization strings (en, es, ar, ur)
- `src/theme.ts` — Design tokens and theme utilities

### Localization

All user-facing text lives in `src/i18n/generated/<locale>.ts`. Pages import `getCopy(locale)` to access localized strings. Always use translation keys, never hardcode text.

### Styling

- Use **logical direction utilities** in Tailwind: `text-start` not `text-left`, `ms-2` not `ml-2`, `pe-4` not `pr-4`
- RTL languages (ar, ur) are supported; physical utilities will look wrong in those locales
- `src/utils/logicalDirection.test.ts` enforces this convention

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
