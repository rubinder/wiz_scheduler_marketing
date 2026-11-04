// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contentProblems, outsideBoundary, symlinks } from "../scripts/check-guide-boundary.mjs";

describe("guide PR boundary", () => {
  it("allows guide content and guide assets", () => {
    expect(outsideBoundary(["src/content/guides/en/x.md", "src/content/guides/ar/x.md", "public/guides/x/hero.webp"])).toEqual([]);
  });
  it("flags anything else", () => {
    expect(outsideBoundary(["src/content/guides/en/x.md", "src/components/Footer.astro", "src/i18n/chrome/en.ts"]))
      .toEqual(["src/components/Footer.astro", "src/i18n/chrome/en.ts"]);
  });
  it("flags look-alike paths", () => {
    expect(outsideBoundary(["src/content/guides-old/x.md", "public/guidesx/a.png"])).toEqual(["src/content/guides-old/x.md", "public/guidesx/a.png"]);
  });
  it("flags traversal, backslashes, control characters and absolute paths", () => {
    const bad = [
      "src/content/guides/../../src/pages/index.astro",
      "src/content/guides\\en\\x.md",
      "src/content/guides/en/x\n.md",
      "src/content/guides/en/x\u0000.md",
      "/src/content/guides/en/x.md",
    ];
    expect(outsideBoundary(bad)).toEqual(bad);
  });
  it("accepts only .md in content and raster images in assets", () => {
    expect(outsideBoundary(["src/content/guides/en/x.md", "public/guides/x/a.png", "public/guides/x/a.jpg", "public/guides/x/a.jpeg", "public/guides/x/a.avif"])).toEqual([]);
    const bad = ["src/content/guides/en/x.mdx", "src/content/guides/en/x.mdoc", "src/content/guides/en/x.html", "public/guides/x/a.svg", "public/guides/x/a.html", "public/guides/x/a.js", "public/guides/x/a"];
    expect(outsideBoundary(bad)).toEqual(bad);
  });
  it("detects symlinks", () => {
    const dir = mkdtempSync(join(tmpdir(), "guide-"));
    mkdirSync(join(dir, "d"));
    writeFileSync(join(dir, "real.md"), "x");
    symlinkSync(join(dir, "real.md"), join(dir, "link.md"));
    expect(symlinks([join(dir, "real.md"), join(dir, "link.md"), join(dir, "missing.md")])).toEqual([join(dir, "link.md")]);
  });
});

const fails = async (md: string) => expect(await contentProblems(md), md).not.toEqual([]);
const passes = async (md: string) => expect(await contentProblems(md), md).toEqual([]);

describe("guide markdown content (rendered output)", () => {
  it("passes plain prose, formatting, tables, code and same-site links", async () => {
    await passes("---\ntitle: Rota tips\n---\n\n# Heading\n\nSee [pricing](/pricing), [frag](#top), [rel](../x) and [app](https://app.wizscheduler.com/login) or [home](HTTPS://WizScheduler.com/).\n\n**bold** *em* ~~del~~ `code`\n\n- a\n- b\n\n1. one\n\n> quote\n\n---\n\n|a|b|\n|-|-|\n|1|2|\n\n![alt](/guides/x/hero.webp)\n\n<https://wizscheduler.com/features>\n\n```html\n<script>alert(1)</script>\n```\n");
  });

  it("does not trip on prose that merely looks risky", async () => {
    await passes("Learn JavaScript: the basics. Use data: carefully. 2 < 3 and 5 > 4.");
    await passes("Don&#8217;t panic &amp; carry on &mdash; really.");
  });

  it("passes disguises the renderer turns into inert text or same-site paths", async () => {
    await passes("[x](java\tscript:alert(1))"); // tab in a destination: not a link, plain text
    await passes("[x](https:\\\\evil.com)"); // renders href="https:%5Cevil.com", a same-site path
  });

  it("fails raw HTML, comments and styles", async () => {
    for (const md of ["<script>alert(1)</script>", "x <IMG src=x onerror=1>", "a <b>bold</b>", "<!-- hidden -->", "<style>p{}</style>", "<iframe src='https://wizscheduler.com'></iframe>", "<div>x</div>", "<p style=\"position:fixed\">x</p>", "<p class=\"fixed inset-0\">x</p>", "<a href=\"/x\" onclick=\"1\">x</a>"]) await fails(md);
  });

  it("fails script-ish URLs however they are disguised", async () => {
    for (const md of [
      "[x](javascript:alert(1))",
      "[x](JaVaScRiPt:alert(1))",
      "[x]: javascript:alert(1)\n\n[x]",
      "[x](data:text/html;base64,AAAA)",
      "[x](&#106;avascript:alert(1))",
      "[x](javascript&colon;alert(1))",
      "[x](javascript\\:alert(1))",
      "[x](vbscript:msgbox)",
      "<javascript:alert(1)>",
      "![x](javascript:alert(1))",
    ]) await fails(md);
  });

  it("fails off-site links, including every bypass probe", async () => {
    for (const md of [
      "[x](https://evil.com/a)",
      "[x](HTTPS://EVIL.COM)",
      "[x](http://evil.com)",
      "[x](//evil.com)",
      "[x]( //evil.com/path)",
      "[x]: //evil.com\n\n[x]",
      "[x](https://wizscheduler.com.evil.com/)",
      "[x](https://evil.com/wizscheduler.com)",
      "[x](https://wizscheduler.com@evil.com/)",
      "[x](https://notwizscheduler.com)",
      "[x](https://wizscheduler.com:8080/)",
      "<https://evil.com>",
      "<ftp://wizscheduler.com/x>",
      "[x](ftp://evil.com/x)",
      "bare https://evil.com text",
      "bare www.evil.com text",
      "[x](https:&sol;&sol;evil.com)",
      "[x](https&colon;//evil.com)",
      "[x](https\\://evil.com)",
      "```` `\n<script>alert(1)</script>\n```` ",
      "``` `x`\n<script>alert(1)</script>\n",
      "> [x]: javascript:alert(1)\n\n[x]",
      "> [x]: https://evil.com\n\n[x]",
      "[x]:\n  https://evil.com\n\n[x]",
      "[x]\n\n[x]:\nhttps://evil.com",
      "[x](\nhttps://evil.com)",
      "![x](https://evil.com/p.png)",
    ]) await fails(md);
  });
});
