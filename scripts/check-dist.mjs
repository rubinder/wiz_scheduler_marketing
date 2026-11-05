// Asserts the built site serves home and features in every locale, with the
// right lang/dir/hreflang, that en/es-only pages stayed en/es-only, and that
// every guide file and the guide index built correctly (guideDistProblems).
// Run after `npm run build`: npm run check:dist
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_LOCALE, LOCALES, SITE_LOCALES, dir, localePath } from "../src/lib/links.ts";
import { COMPARE_PATHS } from "../src/data/competitors.ts";

// = src/lib/site.ts SITE_URL (that module reads import.meta.env, which plain node lacks)
const SITE = "https://wizscheduler.com";

const htmlTag = (html) => html.match(/<html[^>]*>/)?.[0] ?? "";
const hreflangs = (html) => [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((m) => m[1]);

// ---- guides ---------------------------------------------------------------------------

/** Guide sources as the collection sees them: `<contentDir>/<locale>/<slug>.md`, site locales only. */
export function guideFiles(contentDir) {
  if (!existsSync(contentDir)) return [];
  const out = [];
  for (const locale of LOCALES) {
    const d = join(contentDir, locale);
    if (!existsSync(d) || !statSync(d).isDirectory()) continue;
    for (const f of readdirSync(d).sort()) if (f.endsWith(".md")) out.push({ locale, slug: f.slice(0, -3) });
  }
  return out;
}

const guidePath = (locale, slug) => (locale === DEFAULT_LOCALE ? `/guides/${slug}` : `/${locale}/guides/${slug}`);
const decode = (v) => v.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function alternateMap(html) {
  const out = {};
  for (const m of html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]*)"/g)) {
    out[m[1]] = m[1] in out ? null : decode(m[2]); // null marks a duplicate
  }
  return out;
}

const sameMap = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

/** Where a site path is served from in dist/ (build.format "directory"), or null. */
function servedFile(distDir, pathname) {
  let p;
  try {
    p = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (p.includes("\0") || p.split("/").includes("..")) return null;
  const direct = join(distDir, p);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  const index = join(distDir, p, "index.html");
  return existsSync(index) ? index : null;
}

/** Problems with one built page: lang/dir, canonical, hreflang, robots, JSON-LD, internal links. */
function pageProblems(distDir, url, html, { locale, alternates, noindex }) {
  const problems = [];
  const tag = htmlTag(html);
  if (!tag.includes(`lang="${locale}"`) || !tag.includes(`dir="${dir(locale)}"`)) problems.push(`${url}: html tag ${tag}`);
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => decode(m[1]));
  if (canonicals.length !== 1 || canonicals[0] !== `${SITE}${url}`) problems.push(`${url}: canonical ${canonicals.join(",") || "missing"}, want ${SITE}${url}`);
  const robots = /<meta name="robots" content="noindex"/.test(html);
  if (robots !== noindex) problems.push(`${url}: ${noindex ? "missing noindex" : "unexpected noindex"}`);
  const want = {};
  if (!noindex) {
    for (const a of alternates) want[a.locale] = `${SITE}${a.href}`;
    const en = alternates.find((a) => a.locale === DEFAULT_LOCALE);
    if (en) want["x-default"] = `${SITE}${en.href}`;
  }
  const got = alternateMap(html);
  if (!sameMap(got, want)) problems.push(`${url}: hreflang ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch {
      problems.push(`${url}: JSON-LD does not parse`);
    }
  }
  for (const m of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    let u;
    try {
      u = new URL(decode(m[2]), `${SITE}${url}`);
    } catch {
      problems.push(`${url}: unparseable ${m[1]} ${m[2]}`);
      continue;
    }
    if (u.origin !== SITE) continue; // off-site (the app, fonts): not ours to resolve
    if (!servedFile(distDir, u.pathname)) problems.push(`${url}: ${m[1]} ${m[2]} does not resolve to a file in dist/`);
  }
  return problems;
}

/**
 * Checks dist/ against the guide sources: the index in every locale (noindex when that locale has
 * no guide; otherwise hreflang lists exactly the locales that have one), and for every guide file a
 * page at its path with the right canonical, hreflang only for the locales that have the slug
 * (x-default only when en does), an Article JSON-LD that parses, and internal links that resolve.
 */
export function guideDistProblems(distDir, guides) {
  const problems = [];
  const read = (url) => {
    const f = join(distDir, url.replace(/^\//, ""), "index.html");
    return existsSync(f) ? readFileSync(f, "utf8") : null;
  };
  const withGuides = LOCALES.filter((l) => guides.some((g) => g.locale === l));
  const indexAlternates = withGuides.map((l) => ({ locale: l, href: localePath(l, "/guides") }));
  for (const locale of LOCALES) {
    const url = localePath(locale, "/guides");
    const html = read(url);
    if (html === null) {
      problems.push(`${url}: guide index not built`);
      continue;
    }
    const noindex = !withGuides.includes(locale);
    problems.push(...pageProblems(distDir, url, html, { locale, alternates: indexAlternates, noindex }));
    for (const g of guides.filter((x) => x.locale === locale)) {
      if (!html.includes(`href="${guidePath(locale, g.slug)}"`)) problems.push(`${url}: does not list ${g.slug}`);
    }
  }
  // The sitemap lists exactly the indexable guide pages: noindexed indexes stay out.
  const sitemap = readdirSync(distDir)
    .filter((f) => /^sitemap-\d+\.xml$/.test(f))
    .map((f) => readFileSync(join(distDir, f), "utf8"))
    .join("");
  const listed = new Set([...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => decode(m[1]).replace(/\/$/, "")));
  for (const locale of LOCALES) {
    const loc = `${SITE}${localePath(locale, "/guides")}`.replace(/\/$/, "");
    if (listed.has(loc) !== withGuides.includes(locale)) problems.push(`sitemap: ${loc} ${withGuides.includes(locale) ? "missing" : "listed though noindex"}`);
  }
  for (const g of guides) {
    if (!listed.has(`${SITE}${guidePath(g.locale, g.slug)}`)) problems.push(`sitemap: ${guidePath(g.locale, g.slug)} missing`);
  }
  for (const g of guides) {
    const url = guidePath(g.locale, g.slug);
    const html = read(url);
    if (html === null) {
      problems.push(`${url}: no built page for src/content/guides/${g.locale}/${g.slug}.md`);
      continue;
    }
    const alternates = LOCALES.filter((l) => guides.some((x) => x.locale === l && x.slug === g.slug)).map((l) => ({ locale: l, href: guidePath(l, g.slug) }));
    problems.push(...pageProblems(distDir, url, html, { locale: g.locale, alternates, noindex: false }));
    const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => {
      try {
        return JSON.parse(m[1]);
      } catch {
        return null;
      }
    });
    if (!ld.some((o) => o?.["@type"] === "Article" && o.mainEntityOfPage === `${SITE}${url}` && o.inLanguage === g.locale)) {
      problems.push(`${url}: no Article JSON-LD for this page`);
    }
  }
  return problems;
}

// ---- compare pages --------------------------------------------------------------------

/** Default-team highlighted totals (3 locations x 13 employees) from src/data/competitors.ts. */
const COMPARE_PRICES = {
  "/compare/7shifts": "$149.97",
  "/compare/deputy": "$282.75",
  "/compare/homebase": "$210.00",
  "/compare/when-i-work": "$195.00",
};
const ROUNDUP = "/best-scheduling-apps-nyc-restaurants";
const footerOf = (html) => html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? "";
/** Text a visitor can read: no scripts, styles or tags (bundled JS and island props carry braces). */
const visibleText = (html) =>
  html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, "").replace(/<[^>]*>/g, " ");

/** Problems with the en/es-only compare, alternatives and roundup pages, and the links to them. */
export function compareDistProblems(distDir) {
  const problems = [];
  const read = (url) => {
    const f = join(distDir, url.replace(/^\//, ""), "index.html");
    return existsSync(f) ? readFileSync(f, "utf8") : null;
  };
  for (const locale of SITE_LOCALES) {
    for (const path of COMPARE_PATHS) {
      const url = localePath(locale, path);
      const html = read(url);
      if (html === null) {
        problems.push(`${url}: not built`);
        continue;
      }
      const langs = hreflangs(html);
      if (langs.length !== 3 || !["en", "es", "x-default"].every((l) => langs.includes(l))) problems.push(`${url}: hreflang ${langs.join(",")}, want en,es,x-default`);
      if (!html.includes('"@type":"FAQPage"')) problems.push(`${url}: no FAQPage JSON-LD`);
      const price = COMPARE_PRICES[path];
      if (price && !visibleText(html).includes(price)) problems.push(`${url}: missing default-team price ${price}`);
      if (path === "/compare/7shifts" && !html.includes("<table")) problems.push(`${url}: no pricing table`);
      const holes = visibleText(html).match(/\{[A-Za-z][A-Za-z0-9]*\}/g);
      if (holes) problems.push(`${url}: unfilled placeholder ${[...new Set(holes)].join(" ")}`);
    }
    const footer = footerOf(read(localePath(locale, "/")) ?? "");
    for (const path of ["/compare/7shifts-alternatives", "/compare/deputy-alternatives", ROUNDUP]) {
      if (!footer.includes(`href="${localePath(locale, path)}"`)) problems.push(`${localePath(locale, "/")}: footer does not link ${localePath(locale, path)}`);
    }
  }
  if (existsSync(join(distDir, "ja/compare"))) problems.push("dist/ja/compare must not exist");
  const jaFooter = footerOf(read("/ja") ?? "");
  if (!jaFooter.includes('href="/compare/7shifts"')) problems.push("/ja footer: lost its /compare/7shifts link");
  if (jaFooter.includes("-alternatives") || jaFooter.includes(ROUNDUP)) problems.push("/ja footer: gained compare links");
  return problems;
}

// ---- CLI ------------------------------------------------------------------------------

function main() {
  const DIST = resolve(process.cwd(), "dist");
  const page = (url) => {
    const file = resolve(DIST, url.replace(/^\//, ""), "index.html");
    assert.ok(existsSync(file), `missing ${file}`);
    return readFileSync(file, "utf8");
  };

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

  const guides = guideFiles(resolve(process.cwd(), "src/content/guides"));
  const problems = guideDistProblems(DIST, guides);
  assert.deepEqual(problems, [], `guide pages:\n${problems.join("\n")}`);

  const compareProblems = compareDistProblems(DIST);
  assert.deepEqual(compareProblems, [], `compare pages:\n${compareProblems.join("\n")}`);

  console.log(`check:dist OK — ${checked} localized pages, ${guides.length} guide files, ${LOCALES.length} guide indexes`);
}

const isMain = () => {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
};
if (isMain()) main();
