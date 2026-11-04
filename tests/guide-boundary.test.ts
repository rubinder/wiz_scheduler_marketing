import { describe, expect, it } from "vitest";
import { contentProblems, outsideBoundary } from "../scripts/check-guide-boundary.mjs";

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
});

describe("guide markdown content", () => {
  it("passes plain prose with relative and same-site links", () => {
    const md = [
      "---\ntitle: Rota tips\n---\n",
      "See [pricing](/pricing) and [the app](https://app.wizscheduler.com/login) or [home](https://wizscheduler.com/).",
      "Autolink: <https://wizscheduler.com/features>",
      "Ref: [x][1]\n\n[1]: /features/scheduling",
      "Use data: carefully, and 2 < 3 is fine.",
    ].join("\n");
    expect(contentProblems(md)).toEqual([]);
  });

  it("flags raw HTML tags, comments and closing tags", () => {
    for (const md of ["<script>alert(1)</script>", "x <IMG src=x onerror=1>", "a </div>", "<!-- hidden -->", "<a href='/x'>x</a>"]) {
      expect(contentProblems(md), md).not.toEqual([]);
    }
  });

  it("ignores HTML inside fenced code blocks only", () => {
    expect(contentProblems("```html\n<div>ok</div>\n```\n")).toEqual([]);
    expect(contentProblems("~~~\n<div>ok</div>\n~~~\n")).toEqual([]);
    expect(contentProblems("```\ncode\n```\n<div>bad</div>")).not.toEqual([]);
    expect(contentProblems("`<div>` inline")).not.toEqual([]);
  });

  it("flags javascript: and data: URLs in any case or with hidden characters", () => {
    for (const md of [
      "[x](javascript:alert(1))",
      "[x](JaVaScRiPt:alert(1))",
      "[x](java\tscript:alert(1))",
      "[x]: javascript:alert(1)",
      "[x](data:text/html;base64,AAAA)",
      "[x](DATA:text/html,hi)",
      "[x](&#106;avascript:alert(1))",
      "<javascript:alert(1)>",
      "[x](vbscript:msgbox)",
    ]) {
      expect(contentProblems(md), md).not.toEqual([]);
    }
  });

  it("flags off-site absolute links, including bypass attempts", () => {
    for (const md of [
      "[x](https://evil.com/a)",
      "[x](HTTPS://EVIL.COM)",
      "[x](http://evil.com)",
      "[x](//evil.com)",
      "[x]( //evil.com/path)",
      "[x]: //evil.com",
      "[x](https://wizscheduler.com.evil.com/)",
      "[x](https://evil.com/wizscheduler.com)",
      "[x](https://wizscheduler.com@evil.com/)",
      "[x](https:\\\\evil.com)",
      "[x](https://notwizscheduler.com)",
      "<https://evil.com>",
      "<ftp://wizscheduler.com/x>",
      "bare https://evil.com text",
    ]) {
      expect(contentProblems(md), md).not.toEqual([]);
    }
  });

  it("allows same-site absolute links in any case, and protocol-relative same-site links", () => {
    for (const md of ["[x](HTTPS://WizScheduler.com/a)", "<https://app.wizscheduler.com>", "[x](//wizscheduler.com/a)"]) {
      expect(contentProblems(md), md).toEqual([]);
    }
  });
});
