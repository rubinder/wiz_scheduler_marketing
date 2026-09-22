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
