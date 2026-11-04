// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  contentProblems,
  diffProblems,
  frontMatterProblems,
  htmlProblems,
  outsideBoundary,
  parseRawDiff,
  symlinks,
} from "../scripts/check-guide-boundary.mjs";
import { LOCALES } from "../src/lib/links";

// js-yaml is astro's own front matter parser (a transitive dependency without type declarations here).
const JS_YAML: string = "js-yaml";
const { load: loadYaml } = (await import(JS_YAML)) as { load: (text: string) => unknown };

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

const FM = "---\ntitle: Rota tips\ndescription: How to plan a rota\ntargetKeyword: rota tips\nsourceLocale: en\npublishedOn: 2026-11-04\nupdatedOn: 2026-11-04\nrelated: []\n---\n\n";
// Bodies get valid front matter, so a failure can only come from the rendered body.
const fails = async (body: string) => expect(await contentProblems(FM + body), body).not.toEqual([]);
const passes = async (body: string) => expect(await contentProblems(FM + body), body).toEqual([]);

describe("guide markdown content (rendered output)", () => {
  it("passes plain prose, formatting, tables, code and same-site links", async () => {
    await passes("# Heading\n\nSee [pricing](/pricing), [frag](#top), [rel](../x) and [app](https://app.wizscheduler.com/login) or [home](HTTPS://WizScheduler.com/).\n\n**bold** *em* ~~del~~ `code`\n\n- a\n- b\n\n1. one\n\n> quote\n\n---\n\n|a|b|\n|-|-|\n|1|2|\n\n![alt](/guides/x/hero.webp)\n\n<https://wizscheduler.com/features>\n\n```html\n<script>alert(1)</script>\n```\n");
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

describe("guide file layout", () => {
  it("takes markdown only at src/content/guides/<locale>/<slug>.md", () => {
    const bad = ["src/content/guides/x.md", "src/content/guides/en/sub/x.md", "src/content/guides/en/X.md", "src/content/guides/en/a_b.md", "src/content/guides/english/x.md"];
    expect(outsideBoundary(bad)).toEqual(bad);
    expect(outsideBoundary(["src/content/guides/pcm/shift-swaps-101.md"])).toEqual([]);
  });

  it("rejects a guide folder that is not a site locale", async () => {
    expect(await contentProblems(FM + "Hi", { file: "src/content/guides/xx/a.md" })).not.toEqual([]);
    expect(await contentProblems(FM + "Hi", { file: "src/content/guides/ja/a.md" })).toEqual([]);
  });
});

describe("heading ids (item 5)", () => {
  it("accepts Unicode slugs the renderer produces", async () => {
    await passes("# مرحبا بكم\n\n### 日本語の見出し\n\n#### Café résumé\n\n## हिन्दी शीर्षक\n\n## What's new — C++ & 50% off?\n");
  });

  it("rejects ids with spaces, quotes or on non-headings", () => {
    expect(htmlProblems('<h2 id="a b">x</h2>')).not.toEqual([]);
    expect(htmlProblems("<h2 id='x\"y'>x</h2>")).not.toEqual([]);
    expect(htmlProblems('<h2 id="a&#x20;b">x</h2>')).not.toEqual([]);
    expect(htmlProblems('<p id="top">x</p>')).not.toEqual([]);
    expect(htmlProblems('<h2 id="日本語">x</h2>')).toEqual([]);
  });
});

describe("front matter (item 6)", () => {
  const locales = [...LOCALES];
  const fm = (lines: string) => `---\n${lines}\n---\n\nBody`;
  const ok = (lines: string) => expect(frontMatterProblems(fm(lines), locales), lines).toEqual([]);
  const bad = (lines: string) => expect(frontMatterProblems(fm(lines), locales), lines).not.toEqual([]);

  it("accepts the plain shape", () => {
    expect(frontMatterProblems(FM + "Body", locales)).toEqual([]);
    ok('title: "Rota tips: how to plan"\ndescription: \'Quoted, plainly\'\nrelated: [shift-swaps, "rota-basics"]');
    ok("title: 'it''s fine: really'"); // single quotes escape only by doubling
    ok("title: جدول المناوبات\ndescription: シフト表の作り方\ntargetKeyword: café résumé\nsourceLocale: ar");
    ok("title: हिन्दी\u200d पाठ"); // ZWJ is needed by Indic scripts
    ok("updatedOn: 2024-02-29");
  });

  it("rejects every other shape", async () => {
    for (const lines of [
      "author: me", // key not allowed
      "title: a\ntitle: b", // duplicate
      "title: a <b>",
      "title: {a}",
      "title: a `b`",
      "title: \"a\\u003cb\"", // escape sequence
      "description: javascript:alert(1)",
      "description: see https://evil.com",
      "description: ok #comment", // YAML comment changes the value
      "publishedOn: 2026-13-01",
      "publishedOn: 2026-02-30",
      "publishedOn: 26-11-04",
      "sourceLocale: xx",
      "related: [Shift_Swaps]",
      "related: [a,,b]",
      "related: a, b",
      "related: [../x]",
      "title: >\n  folded",
      "title: |",
      "title: &anchor a",
      "title: *alias",
      "title: !!binary aGk=",
      "title: [a]",
      "  title: indented",
      "title:no-space",
      "title:",
      "- item",
      "? complex",
      "title: 'it's'", // lone quote inside single quotes
      "title: \"say \"hi\"\"", // unescaped double quote inside double quotes
      "title: \"open",
      "title: a\u202eb", // bidi override
      "title: a\u200bb", // zero-width space
      "title: a\u0007b",
    ]) bad(lines);
  });

  it("rejects missing, unterminated, BOM, CRLF and odd delimiters", () => {
    for (const md of [
      "No front matter",
      "---\ntitle: a\n",
      "\ufeff---\ntitle: a\n---\n",
      "\n---\ntitle: a\n---\n",
      "---\r\ntitle: a\r\n---\r\n",
      "+++\ntitle = 'a'\n+++\n",
      "---\ntitle: a\n+++\n",
      "---\ntitle: a\n---x\n",
      "--- \ntitle: a\n---\n",
    ]) expect(frontMatterProblems(md, locales), JSON.stringify(md)).not.toEqual([]);
  });

  it("fails the content check when front matter is bad, and judges the body Astro renders", async () => {
    expect(await contentProblems("---\ntitle: <b>x</b>\n---\n\nHi")).not.toEqual([]);
    expect(await contentProblems("Hi, no front matter")).not.toEqual([]);
    // the renderer would silently drop a second block at the top of the body: refuse it
    expect(await contentProblems(FM + "---\nx: <script>alert(1)</script>\n---\n")).not.toEqual([]);
    expect(await contentProblems(FM + "+++\nx = 1\n+++\n\nHi")).not.toEqual([]);
  });
});

describe("YAML scalar rules (items 14, 15)", () => {
  const locales = [...LOCALES];
  const fm = (lines: string) => `---\n${lines}\n---\n\nBody`;
  // Each case is also loaded with js-yaml (what Astro uses), so the rule is checked against the real parser.
  const loaded = (lines: string) => {
    try {
      return loadYaml(lines) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  it("fails unquoted values that YAML reads as a mapping or a comment, passes them quoted", () => {
    for (const lines of ["title: Rota tips: how to plan", "description: Note:", "targetKeyword: rota #1 tips", "description: a:\tb"]) {
      expect(frontMatterProblems(fm(lines), locales), lines).not.toEqual([]);
    }
    for (const lines of ['title: "Rota tips: how to plan"', "title: 'Rota tips: how to plan'", 'targetKeyword: "rota #1 tips"', "description: 'Rota tips: it''s easy'"]) {
      expect(frontMatterProblems(fm(lines), locales), lines).toEqual([]);
      expect(typeof loaded(lines)?.[lines.split(":")[0]], lines).toBe("string");
    }
    expect(loaded("title: Rota tips: how to plan")).toBeNull(); // js-yaml throws: the build would break
  });

  it("fails string fields that YAML would type as numbers, booleans, null or dates", () => {
    const values = ["123", "-1.5", ".5", "1e3", "0x1F", "0o17", "1_000", ".inf", "-.Inf", ".NaN", "true", "False", "yes", "No", "on", "OFF", "y", "null", "Null", "~", "2026-11-04", "2026-11-04T10:00:00Z", "1:30"];
    for (const key of ["title", "description", "targetKeyword"]) {
      for (const v of values) {
        expect(frontMatterProblems(fm(`${key}: ${v}`), locales), `${key}: ${v}`).not.toEqual([]);
        expect(frontMatterProblems(fm(`${key}: "${v}"`), locales), `${key}: "${v}"`).toEqual([]);
      }
    }
    for (const v of ["123", "true", "null", "~", "2026-11-04", ".5"]) expect(typeof loaded(`title: ${v}`)?.title, v).not.toBe("string");
    for (const lines of ["related: [123]", "related: [true, rota-basics]", "related: [null]"]) {
      expect(frontMatterProblems(fm(lines), locales), lines).not.toEqual([]);
    }
    expect(frontMatterProblems(fm('related: ["123", rota-basics]'), locales)).toEqual([]);
  });

  it("keeps strings that only start like a number, and real dates in date fields", () => {
    for (const lines of ["title: 10 rota tips", "title: 2026 rota guide", "description: Plan 24/7 cover", "title: Yesterday", "title: Online rotas", "publishedOn: 2026-11-04"]) {
      expect(frontMatterProblems(fm(lines), locales), lines).toEqual([]);
    }
    for (const lines of ["title: 10 rota tips", "title: 2026 rota guide", "title: Online rotas"]) expect(typeof loaded(lines)?.title, lines).toBe("string");
  });
});

describe("table alignment (item 7)", () => {
  it("passes the renderer's alignment styles", async () => {
    await passes("| a | b | c |\n|:-|:-:|-:|\n| 1 | 2 | 3 |\n");
  });

  it("rejects any other table style", () => {
    for (const html of [
      '<table><tbody><tr><td style="color:red">x</td></tr></tbody></table>',
      '<table><tbody><tr><td style="text-align:left;position:fixed">x</td></tr></tbody></table>',
      '<table><tbody><tr><td style="text-align: left;">x</td></tr></tbody></table>',
      '<table><tbody><tr><td style="text-align: justify">x</td></tr></tbody></table>',
    ]) expect(htmlProblems(html), html).not.toEqual([]);
    expect(htmlProblems('<table><tbody><tr><td style="text-align: center">x</td></tr></tbody></table>')).toEqual([]);
  });
});

describe("cloaking styles (item 8)", () => {
  it("passes real highlighted code, including diff markers", async () => {
    await passes("```js\n// a comment\nconst x = 1;\n```\n\n```diff\n- old\n+ new\n```\n\n```md\n*i* **b** ~~s~~ [l](u)\n```\n");
  });

  it("rejects hidden or low-contrast text, inside or outside a code block", () => {
    const pre = (style: string, inner: string) => `<pre class="astro-code github-dark" style="${style}" tabindex="0"><code>${inner}</code></pre>`;
    const dark = "background-color:#24292e;color:#e1e4e8; overflow-x: auto;";
    for (const html of [
      '<p><span style="color:transparent">x</span></p>',
      '<p style="color:#fff">x</p>',
      '<span style="color:#000">raw span outside a pre</span>',
      pre(dark, '<span style="color:transparent">x</span>'),
      pre(dark, '<span style="color:rgba(0,0,0,0)">x</span>'),
      pre(dark, '<span style="color:#24292e">x</span>'), // same as background
      pre(dark, '<span style="color:#2a2f34">x</span>'), // near background
      pre(dark, '<span style="background-color:#e1e4e8;color:#e1e4e8">x</span>'), // span background
      pre(dark, '<span style="opacity:0">x</span>'),
      pre(dark, '<span style="font-size:0">x</span>'),
      pre("background-color:#ffffff;color:#fefefe", "x"), // forged pre, unreadable
      pre("background-color:#ffffff", "x"), // forged pre without a text colour
      pre("color:#000000", '<span style="color:#000">x</span>'), // no background to judge against
      '<pre><code><span style="color:#ffffff">x</span></code></pre>', // unstyled pre, coloured span
      '<pre class="evil" style="background-color:#000;color:#fff"><code>x</code></pre>',
    ]) expect(htmlProblems(html), html).not.toEqual([]);
  });
});

describe("highlighter classes (item 13)", () => {
  const dark = "background-color:#24292e;color:#e1e4e8; overflow-x: auto;";
  const block = (preClass: string, spanClass = "line") =>
    `<pre class="${preClass}" style="${dark}" tabindex="0" data-language="js"><code><span class="${spanClass}"><span style="color:#F97583">const</span></span></code></pre>`;

  it("accepts exactly the classes the renderer emits", () => {
    expect(htmlProblems(block("astro-code github-dark"))).toEqual([]);
  });

  it("fails any extra or substituted class token, on the pre or a span", () => {
    for (const probe of ["hidden", "sr-only", "opacity-0", "text-transparent"]) {
      for (const html of [
        block(`astro-code github-dark ${probe}`),
        block(`astro-code ${probe}`),
        block(`${probe} astro-code github-dark`),
        block("astro-code github-dark", `line ${probe}`),
        block("astro-code github-dark", probe),
        `<p><code class="${probe}">x</code></p>`,
        `<p><span class="${probe}">x</span></p>`,
        `<ul><li class="${probe}">x</li></ul>`,
      ]) expect(htmlProblems(html), html).not.toEqual([]);
    }
    for (const html of [block("astro-code"), block("astro-code github-light"), block("astro-code  github-dark"), block("astro-code github-dark", "")]) {
      expect(htmlProblems(html), html).not.toEqual([]);
    }
  });

  it("fails the probes written as raw markdown HTML", async () => {
    for (const probe of ["hidden", "sr-only", "opacity-0", "text-transparent"]) {
      await fails(`<pre class="astro-code github-dark ${probe}" style="${dark}"><code>x</code></pre>`);
    }
  });

  it("passes real fenced code in js, ts, diff, bash, json and plain text", async () => {
    await passes(
      "```js\nconst x = 1; // c\n```\n\n```ts\nconst n: number = 1;\n```\n\n```diff\n- old\n+ new\n```\n\n" +
        "```bash\necho \"$HOME\" | grep x\n```\n\n```json\n{\"k\": [true, null, 1]}\n```\n\n```text\nplain text\n```\n\n```\nno language\n```\n",
    );
  });
});

describe("tag balance (item 9)", () => {
  it("rejects stray, mismatched and unclosed tags", () => {
    for (const html of ["<p>x</p></p>", "</div>", "<p>x</em></p>", "<p><em>x</p></em>", "<ul><li>x</ul>", "<p>x", "<span/>x", "<br></br>"]) {
      expect(htmlProblems(html), html).not.toEqual([]);
    }
  });

  it("passes the renderer's own nesting", async () => {
    await passes("- a\n  - b\n    1. c\n\n> q\n> > nested\n> - item\n\n| a |\n|-|\n| *b* |\n\nLine  \nbreak\n\n---\n");
  });
});

describe("relative images (item 10)", () => {
  it("passes images inside the guide folders or public/guides", async () => {
    await passes("![a](./a.webp)\n\n![b](../ar/b.png)\n\n![c](/guides/x/c.webp)\n\n![d](../../../../public/guides/x/d.avif)\n");
  });

  it("fails images that leave them or carry a query", async () => {
    for (const md of [
      "![a](/etc/a.png)",
      "![a](../../../../src/pages/a.png)",
      "![a](../../a.png)",
      "![a](//evil.com/a.png)",
      "![a](./a.webp?raw)",
      "![a](./a.webp#x)",
      "![a](./a.svg)",
      "![a](%2e%2e/%2e%2e/%2e%2e/%2e%2e/src/pages/a.png)",
      "![a](./a%20b.png)",
    ]) await fails(md);
  });

  it("checks the image marker itself", () => {
    const marker = (json: string) => `<p><img __ASTRO_IMAGE_="${json.replace(/"/g, "&quot;")}"></p>`;
    expect(htmlProblems(marker('{"alt":"a","src":"./a.webp","index":0}'))).toEqual([]);
    expect(htmlProblems('<p><img __ASTRO_IMAGE_="{&#34;src&#34;:&#34;./a.webp&#34;,&#34;index&#34;:0}"></p>')).toEqual([]);
    for (const json of [
      '{"src":"/x","index":0}',
      '{"src":"../../../../src/pages/a.png","index":0}',
      '{"src":"./a.webp","index":0,"onerror":"x"}',
      '{"src":"./a.webp","index":0,"inferSize":true}',
      '{"src":"./a.webp"}',
      '{"src":"./a.webp?url","index":0}',
      '["./a.webp"]',
      "not json",
    ]) expect(htmlProblems(marker(json)), json).not.toEqual([]);
    expect(htmlProblems('<p><img src="./a.webp" __ASTRO_IMAGE_="{&quot;src&quot;:&quot;./a.webp&quot;,&quot;index&quot;:0}"></p>')).not.toEqual([]);
    expect(htmlProblems('<p><img __ASTRO_IMAGE_="{&quot;src&quot;:&quot;./a.webp&quot;,&quot;index&quot;:0}&#x26;"></p>')).not.toEqual([]);
  });
});

describe("diff structure (item 11)", () => {
  const sha = (c: string) => c.repeat(40);
  const entry = (oldMode: string, newMode: string, status: string, path: string) =>
    `:${oldMode} ${newMode} ${sha("a")} ${sha("b")} ${status}\0${path}\0`;

  it("parses git's raw -z output", () => {
    expect(parseRawDiff(entry("000000", "100644", "A", "src/content/guides/en/x.md") + entry("100644", "100644", "M", "public/guides/x/a.png"))).toEqual([
      { oldMode: "000000", newMode: "100644", status: "A", path: "src/content/guides/en/x.md" },
      { oldMode: "100644", newMode: "100644", status: "M", path: "public/guides/x/a.png" },
    ]);
    expect(parseRawDiff("")).toEqual([]);
  });

  it("throws on output it cannot parse", () => {
    expect(() => parseRawDiff("garbage\0path\0")).toThrow();
    expect(() => parseRawDiff(entry("000000", "100644", "A", "x").slice(0, -3))).toThrow();
    expect(() => parseRawDiff(`:000000 100644 ${sha("a")} ${sha("b")} R100\0old\0new\0`)).toThrow();
  });

  it("allows only added or modified regular files", () => {
    expect(diffProblems(parseRawDiff(entry("000000", "100644", "A", "src/content/guides/en/x.md") + entry("100644", "100644", "M", "src/content/guides/en/y.md")))).toEqual([]);
    for (const raw of [
      entry("100644", "000000", "D", "src/content/guides/en/x.md"), // deletion (also how --no-renames shows a rename away)
      entry("000000", "160000", "A", "src/content/guides/en/sub"), // submodule added
      entry("160000", "100644", "T", "public/guides/x/a.png"), // submodule replaced
      entry("000000", "120000", "A", "public/guides/x/a.png"), // symlink
      entry("100644", "100644", "U", "src/content/guides/en/x.md"), // unmerged
    ]) expect(diffProblems(parseRawDiff(raw)), raw).not.toEqual([]);
  });
});

describe("renderer pin (item 12)", () => {
  it("fails closed when the renderer cannot be loaded", async () => {
    const problems = await contentProblems(FM + "Hi", { load: () => Promise.reject(new Error("Cannot find package")) });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/renderer unavailable/);
    expect(await contentProblems(FM + "Hi", { load: (async () => ({})) as never })).toEqual([expect.stringMatching(/renderer unavailable/)]);
  });

  it("uses the satteri version astro pins, from the only installed copy", () => {
    const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
    const installed = JSON.parse(readFileSync(new URL("../package.json", import.meta.resolve("@astrojs/markdown-satteri")), "utf8"));
    const copies = Object.keys(lock.packages).filter((k) => k.endsWith("node_modules/@astrojs/markdown-satteri"));
    expect(copies).toEqual(["node_modules/@astrojs/markdown-satteri"]);
    expect(installed.version).toBe(lock.packages["node_modules/@astrojs/markdown-satteri"].version);
    expect(installed.version).toBe(lock.packages["node_modules/astro"].dependencies["@astrojs/markdown-satteri"]);
  });
});
