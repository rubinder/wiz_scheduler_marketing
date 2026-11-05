// @vitest-environment node
// Compiles the real Tailwind config and global.css: every element a guide body may render has an
// article style, and guide markdown is never scanned for class names.
import { afterAll, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import config from "../tailwind.config";

const tmp = mkdtempSync(join(tmpdir(), "article-styles-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

// The config's content globs, rebased from the repo root onto `root`.
const rebased = (root: string) => (config.content as string[]).map((g) => g.replace(/^(!?)\.\//, `$1${root}/`));

async function compile(css: string, files: Record<string, string>): Promise<postcss.Root> {
  const root = mkdtempSync(join(tmp, "src-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  const out = await postcss([tailwindcss({ ...config, content: rebased(root) })]).process(css, { from: undefined });
  return postcss.parse(out.css);
}

function declarations(ast: postcss.Root, selector: string): Record<string, string> {
  const out: Record<string, string> = {};
  ast.walkRules((r) => {
    if (r.selectors.includes(selector) && r.parent?.type === "root") r.walkDecls((d) => void (out[d.prop] = d.value));
  });
  return out;
}

describe("article styles", async () => {
  const globalCss = readFileSync("src/styles/global.css", "utf8").replace(/^@import .*$/gm, "");
  // Component rules are emitted only for classes the content uses.
  const ast = await compile(globalCss, { "src/views/x.astro": "<article class=\"prose-rota\"></article>" });

  it("numbers ordered lists, with logical padding", () => {
    expect(declarations(ast, ".prose-rota ol")).toMatchObject({ "list-style-type": "decimal", "padding-inline-start": "1.5rem" });
  });
  it("styles blockquotes on the inline-start side", () => {
    const d = declarations(ast, ".prose-rota blockquote");
    expect(d["border-inline-start-width"]).toBe("2px");
    expect(d["padding-inline-start"]).toBe("1rem");
  });
  it("styles rules, h4 to h6 and code blocks", () => {
    expect(declarations(ast, ".prose-rota hr")["margin-top"]).toBeDefined();
    for (const h of ["h4", "h5", "h6"]) expect(declarations(ast, `.prose-rota ${h}`)["font-weight"] ?? declarations(ast, `.prose-rota ${h}`)["font-size"], h).toBeDefined();
    const pre = declarations(ast, ".prose-rota pre");
    expect(pre["margin-top"]).toBe("1.5rem");
    expect(pre["overflow-x"]).toBe("auto");
  });
  it("scrolls a wide table at phone width instead of widening the page", () => {
    expect(declarations(ast, ".prose-rota table")).toMatchObject({ display: "block", "overflow-x": "auto", "max-width": "100%" });
    let sm = "";
    ast.walkAtRules("media", (m) => {
      m.walkRules((r) => {
        if (r.selectors.includes(".prose-rota table")) r.walkDecls("display", (d) => void (sm = d.value));
      });
    });
    expect(sm).toBe("table");
  });
  it("uses no physical-direction properties", () => {
    const physical: string[] = [];
    ast.walkRules((r) => {
      if (!r.selector.includes(".prose-rota")) return;
      r.walkDecls((d) => {
        if (/^(?:margin|padding|border)-(?:left|right)|^(?:left|right)$/.test(d.prop) || /^text-align$/.test(d.prop) && /left|right/.test(d.value)) physical.push(`${r.selector} ${d.prop}`);
      });
    });
    expect(physical).toEqual([]);
  });
});

describe("tailwind content scan", () => {
  it("builds classes named in pages and compare markdown, never in guide markdown", async () => {
    const ast = await compile("@tailwind utilities;", {
      "src/pages/x.astro": '<p class="rotate-[13deg]">x</p>',
      "src/content/compare/en/x.md": "rotate-[19deg]",
      "src/content/guides/en/x.md": "---\ntitle: a\n---\n\nhidden fixed inset-0 rotate-[17deg]",
    });
    const css = ast.toString();
    expect(css).toContain("rotate-\\[13deg\\]");
    expect(css).toContain("rotate-\\[19deg\\]");
    expect(css).not.toContain("rotate-\\[17deg\\]");
  });
});
