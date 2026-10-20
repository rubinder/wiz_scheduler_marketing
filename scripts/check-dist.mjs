// Asserts the built site serves home and features in every locale, with the
// right lang/dir/hreflang, and that en/es-only pages stayed en/es-only.
// Run after `npm run build`: npm run check:dist
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LOCALES, dir, localePath } from "../src/lib/links.ts";

const DIST = resolve(process.cwd(), "dist");
const page = (url) => {
  const file = resolve(DIST, url.replace(/^\//, ""), "index.html");
  assert.ok(existsSync(file), `missing ${file}`);
  return readFileSync(file, "utf8");
};
const htmlTag = (html) => html.match(/<html[^>]*>/)?.[0] ?? "";
const hreflangs = (html) => [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((m) => m[1]);

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

console.log(`check:dist OK — ${checked} localized pages`);
