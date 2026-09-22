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
| `LEGAL_API_URL` | (`API_URL`) | Where legal documents are fetched from when `LEGAL_SOURCE=api`. Set the repository variable to `https://wizscheduler.com/api/v1` until the app DNS record exists, then clear it. |

## Generated content

- `npm run port:copy` regenerates `src/i18n/generated/*.ts` from the app repo (`APP_REPO`, default `../wiz_scheduler`). Run after landing/features copy changes in the app.
- `npm run snapshot:legal` refreshes `src/content/legal/fixture.json` from the API (`API_URL` override). Production builds use the API directly.

## Deploy

Push to `main` runs `.github/workflows/deploy.yml`: build with `LEGAL_SOURCE=api`, sync to S3, invalidate CloudFront. Needs the secrets and variables listed in that file.

## Cutover checklist (app repo, human-owned)

The marketing distribution cannot carry the apex/www aliases until it has been deployed to
and verified — so terraform runs twice, with a deploy and verification pass in between.

**A. `terraform apply` #1** (app repo, `wiz_scheduler/terraform/**`):

1. New private S3 bucket + OAC + a second CloudFront distribution for it. No aliases yet
   (or a temporary `*.cloudfront.net`-only config) — the apex/www aliases still point at
   nothing until step C. Existing wildcard ACM cert, default root `index.html`. Custom
   error responses: 404 → `/404.html` (status 404) **and** 403 → `/404.html` (status 404),
   because a private bucket behind OAC answers 403 for a missing key, not 404.
2. CloudFront allows only one function per event type per behavior, so the `www_to_apex`
   redirect and the index-rewrite must be merged into one viewer-request function:

       function handler(event) {
         var request = event.request;
         var host = request.headers.host && request.headers.host.value;
         if (host === 'www.wizscheduler.com') {
           return { statusCode: 301, statusDescription: 'Moved Permanently',
                    headers: { location: { value: 'https://wizscheduler.com' + request.uri } } };
         }
         var uri = request.uri;
         if (uri.endsWith('/')) { request.uri = uri + 'index.html'; }
         else if (!uri.includes('.')) { request.uri = uri + '/index.html'; }
         return request;
       }

3. IAM user or role for this repo's deploy: `s3:ListBucket` on the bucket,
   `s3:PutObject`/`s3:DeleteObject` on `bucket/*`, `cloudfront:CreateInvalidation` on the
   new distribution.

**B. Deploy and verify** (this repo, no aliases live yet — nothing user-facing changes):

4. Set this repo's GitHub secrets/variables, including `LEGAL_API_URL=https://wizscheduler.com/api/v1`
   for now (the app DNS record doesn't exist until step C). Push to `main`.
5. Verify every route on the distribution's `*.cloudfront.net` hostname: view-source shows
   full HTML (not a client-only shell), `/es` renders, and a junk path returns the 404 page
   with a 404 status.

**C. `terraform apply` #2** (app repo):

6. Add the apex + `www` aliases to the marketing distribution. Change the existing app
   distribution's aliases to `["app.wizscheduler.com"]`. Nothing else about the app
   distribution changes.
7. Route53: apex + www A/AAAA aliases → marketing distribution; new `app` record → app
   distribution.
8. New variable `app_domain` (default `app.wizscheduler.com`); derive `FRONTEND_URL`, the
   CORS origin, `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` from it. Set the compliance
   API's allowed origin (issue #116) to `https://wizscheduler.com`.

**D. After the aliases are live:**

9. Google OAuth client: add `https://app.wizscheduler.com` to authorized JavaScript origins.
10. Verify at a quiet hour: home HTML in view-source, `/es`, 404 status on a junk path,
    login/sign-up links reach the app host, invite/reset emails link to the app host, Google
    sign-in works there. Then clear `LEGAL_API_URL` (the app DNS record now resolves, so
    `API_URL` is correct).
11. App repo follow-up PR: `/` → `/login`; `/features`, `/privacy-policy`, `/terms`, `/dpa`
    → apex equivalents; remove `sitemap.xml`/`robots.txt` and, later, the marketing
    components.
12. Google Search Console: submit `https://wizscheduler.com/sitemap-index.xml` — but do
    **not** submit `/es` until wiz_scheduler #117 (untranslated `es` keys) has merged and
    `npm run port:copy` has been re-run here.

**E. Checker enablement is its own gate**, independent of the domain cutover: set
`PUBLIC_CHECKER_ENABLED=true` only after wiz_scheduler #116 is deployed **and** its
response field names have been checked against `src/lib/checker/types.ts`.

Rollback: revert the Route53 records and the alias change in one apply.
