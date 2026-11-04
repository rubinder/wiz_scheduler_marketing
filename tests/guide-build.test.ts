// @vitest-environment node
// Builds the site in a temporary copy with throwaway fixture guides (quoted dates, as the boundary
// check requires) and runs check:dist's guide checks against the result. Nothing is written to this
// checkout: the copy gets its own node_modules folder of symlinks, so Astro's content cache
// (node_modules/.astro) stays out of the real one.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { contentProblems } from "../scripts/check-guide-boundary.mjs";
import { guideDistProblems, guideFiles } from "../scripts/check-dist.mjs";

const ROOT = resolve(__dirname, "..");
const SKIP = new Set(["node_modules", "dist", ".git", ".astro"]);

const fm = (title: string, sourceLocale: string, related: string[] = []) =>
  `---\ntitle: "${title}"\ndescription: "A fixture guide for the build test."\ntargetKeyword: "fixture ${title}"\n` +
  `sourceLocale: ${sourceLocale}\npublishedOn: "2026-11-04"\nupdatedOn: "2026-11-05"\nrelated: [${related.join(", ")}]\n---\n\n`;

// en + ar share a slug (ar is rtl); es has a guide with no en version (so no x-default); a second en
// guide links to the first, the homepage, sign-up and a public/guides image.
const FIXTURES: Record<string, string> = {
  "en/factory-fixture.md": fm("Factory fixture", "en") + "Intro prose.\n\n## A section\n\nSee [home](/) and [sign up](https://app.wizscheduler.com/register).\n",
  "ar/factory-fixture.md": fm("دليل تجريبي", "en") + "نص تمهيدي.\n\n## قسم\n\nراجع [الرئيسية](/ar) والسعر ‏25‏.\n",
  "es/solo-espanol.md": fm("Solo en español", "es") + "Texto.\n\n## Sección\n\nVer [inicio](/es/).\n",
  "en/second-guide.md":
    fm("Second guide", "en", ["factory-fixture"]) +
    "More prose, linking [the first guide](/guides/factory-fixture).\n\n![A chart](/guides/factory-fixture/chart.png)\n\n| a | b |\n|-|-|\n| 1 | 2 |\n",
};
// A 1x1 PNG.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAwS2OUAAAAABJRU5ErkJggg==", "base64");

let tmp = "";
let dist = "";
const read = (url: string) => readFileSync(join(dist, url, "index.html"), "utf8");
// Applies `edit` to one built page, runs the guide checks, and restores the page.
const problemsAfter = (url: string, edit: (html: string) => string | null) => {
  const file = join(dist, url, "index.html");
  const original = readFileSync(file, "utf8");
  const next = edit(original);
  if (next === null) unlinkSync(file);
  else writeFileSync(file, next);
  try {
    return guideDistProblems(dist, guideFiles(join(tmp, "src/content/guides")));
  } finally {
    writeFileSync(file, original);
  }
};

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), "guide-build-"));
  cpSync(ROOT, tmp, { recursive: true, filter: (src) => !SKIP.has(src.slice(ROOT.length + 1).split("/")[0]) });
  mkdirSync(join(tmp, "node_modules"));
  for (const name of readdirSync(join(ROOT, "node_modules"))) {
    if (name === ".astro" || name === ".vite") continue;
    symlinkSync(join(ROOT, "node_modules", name), join(tmp, "node_modules", name));
  }
  for (const [path, body] of Object.entries(FIXTURES)) {
    mkdirSync(join(tmp, "src/content/guides", path.split("/")[0]), { recursive: true });
    writeFileSync(join(tmp, "src/content/guides", path), body);
  }
  mkdirSync(join(tmp, "public/guides/factory-fixture"), { recursive: true });
  writeFileSync(join(tmp, "public/guides/factory-fixture/chart.png"), PNG);
  execFileSync(process.execPath, ["node_modules/astro/bin/astro.mjs", "build"], {
    cwd: tmp,
    env: { ...process.env, LEGAL_SOURCE: "fixture" },
    stdio: "pipe",
  });
  dist = join(tmp, "dist");
}, 300_000);

afterAll(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

describe("guide fixtures build and pass check:dist", () => {
  it("the fixtures pass the boundary check", async () => {
    for (const [path, body] of Object.entries(FIXTURES)) {
      expect(await contentProblems(body, { file: `src/content/guides/${path}` }), path).toEqual([]);
    }
  });

  it("the build has every guide and index, and the guide checks pass", () => {
    expect(guideFiles(join(tmp, "src/content/guides"))).toHaveLength(4);
    expect(guideDistProblems(dist, guideFiles(join(tmp, "src/content/guides")))).toEqual([]);
    expect(read("/ar/guides/factory-fixture")).toMatch(/<html[^>]*dir="rtl"/);
    expect(read("/ja/guides")).toContain('<meta name="robots" content="noindex"');
    expect(read("/guides")).not.toContain('content="noindex"');
  });

  it("npm run check:dist passes on the build", () => {
    const out = execFileSync(process.execPath, ["--experimental-strip-types", "scripts/check-dist.mjs"], { cwd: tmp, encoding: "utf8", stdio: "pipe" });
    expect(out).toMatch(/check:dist OK .* 4 guide files/);
  });
});

describe("check:dist guide checks catch a broken build", () => {
  const fails = (url: string, edit: (h: string) => string | null, why: RegExp) => {
    const problems = problemsAfter(url, edit);
    expect(problems.join("\n"), url).toMatch(why);
  };

  it("a guide file without a page", () => fails("/ar/guides/factory-fixture", () => null, /no built page for src\/content\/guides\/ar\/factory-fixture\.md/));
  it("a missing locale index", () => fails("/ja/guides", () => null, /\/ja\/guides: guide index not built/));
  it("a wrong canonical", () =>
    fails("/guides/factory-fixture", (h) => h.replace('rel="canonical" href="https://wizscheduler.com/guides/factory-fixture"', 'rel="canonical" href="https://wizscheduler.com/guides"'), /canonical/));
  it("hreflang for a locale without the guide", () =>
    fails("/guides/factory-fixture", (h) => h.replace("</head>", '<link rel="alternate" hreflang="ja" href="https://wizscheduler.com/ja/guides/factory-fixture"></head>'), /hreflang/));
  it("x-default when en does not exist", () =>
    fails("/es/guides/solo-espanol", (h) => h.replace("</head>", '<link rel="alternate" hreflang="x-default" href="https://wizscheduler.com/es/guides/solo-espanol"></head>'), /hreflang/));
  it("a missing x-default when en exists", () => fails("/ar/guides/factory-fixture", (h) => h.replace(/<link rel="alternate" hreflang="x-default"[^>]*>/, ""), /hreflang/));
  it("JSON-LD that does not parse", () => fails("/guides/second-guide", (h) => h.replace('"@type":"Article"', '"@type":"Article",,'), /JSON-LD does not parse/));
  it("an internal link to nothing", () => fails("/guides/second-guide", (h) => h.replace("</main>", '<a href="/guides/no-such-guide">x</a></main>'), /does not resolve/));
  it("a missing image", () => fails("/guides/second-guide", (h) => h.replace("/guides/factory-fixture/chart.png", "/guides/factory-fixture/gone.png"), /gone\.png does not resolve/));
  it("an empty index left indexable", () => fails("/ja/guides", (h) => h.replace('<meta name="robots" content="noindex">', ""), /missing noindex/));
  it("a noindexed index in the sitemap", () => {
    const file = join(dist, "sitemap-0.xml");
    const original = readFileSync(file, "utf8");
    writeFileSync(file, original.replace("</urlset>", "<url><loc>https://wizscheduler.com/ja/guides</loc></url></urlset>"));
    try {
      expect(guideDistProblems(dist, guideFiles(join(tmp, "src/content/guides"))).join("\n")).toMatch(/sitemap: https:\/\/wizscheduler.com\/ja\/guides listed though noindex/);
    } finally {
      writeFileSync(file, original);
    }
  });
  it("an index that does not list its guide", () => fails("/es/guides", (h) => h.replaceAll('href="/es/guides/solo-espanol"', 'href="/es"'), /does not list solo-espanol/));
});
