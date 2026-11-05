// Runs against dist/ built from a fixture guide (see the Task 24 brief): the "built" block is
// skipped when no fixture page exists, so a normal build with no guides still passes.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const dist = (p: string) => `dist${p}/index.html`;
const has = (p: string) => existsSync(dist(p));
const html = (p: string) => readFileSync(dist(p), "utf8");

describe.runIf(existsSync("dist/guides/factory-fixture/index.html"))("guide pages (built)", () => {
  it("renders every existing locale and skips missing ones", () => {
    expect(has("/guides/factory-fixture")).toBe(true);
    expect(has("/ar/guides/factory-fixture")).toBe(true);
    expect(has("/ja/guides/factory-fixture")).toBe(false);
  });
  it("hreflang lists only existing versions", () => {
    const h = html("/guides/factory-fixture");
    expect(h).toContain('hreflang="ar"');
    expect(h).not.toContain('hreflang="ja"');
  });
  it("has Article JSON-LD, canonical, rtl", () => {
    const h = html("/ar/guides/factory-fixture");
    expect(h).toContain('"@type":"Article"');
    expect(h).toContain('rel="canonical" href="https://wizscheduler.com/ar/guides/factory-fixture"');
    expect(h).toMatch(/<html[^>]*dir="rtl"/);
  });
  it("index exists in every locale and footer links to it", () => {
    expect(has("/guides")).toBe(true);
    expect(has("/ja/guides")).toBe(true);
    expect(html("/ja")).toContain('href="/ja/guides"');
  });
});
