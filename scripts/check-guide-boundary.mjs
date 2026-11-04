// Daily guide PRs (branch content/guide-*) may change only guide content and guide assets,
// and the markdown they ship must render to inert HTML: guide text is shaped by untrusted
// Search Console input and auto-merges. We judge the RENDERED output (same processor the
// site uses), never the markdown source, so entity/escape/refdef tricks cannot slip past.
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";

const CONTENT_PREFIX = "src/content/guides/";
const ASSET_PREFIX = "public/guides/";
const ASSET_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".avif"];
const ALLOWED_HOSTS = new Set(["wizscheduler.com", "app.wizscheduler.com"]);

function pathIsSuspect(f) {
  // eslint-disable-next-line no-control-regex
  return f.includes("..") || f.includes("\\") || /[\u0000-\u001f\u007f]/.test(f) || f.startsWith("/");
}

function allowedFile(f) {
  if (f.startsWith(CONTENT_PREFIX)) return f.endsWith(".md");
  if (f.startsWith(ASSET_PREFIX)) return ASSET_EXTENSIONS.some((e) => f.endsWith(e));
  return false;
}

export function outsideBoundary(files) {
  return files.filter((f) => pathIsSuspect(f) || !allowedFile(f));
}

export function symlinks(files, lstat = lstatSync) {
  return files.filter((f) => {
    try {
      return lstat(f).isSymbolicLink();
    } catch {
      return false; // a missing path is not a symlink; reading it will fail loudly later
    }
  });
}

// ---- rendered-HTML policy -------------------------------------------------------------

const ELEMENTS = new Set([
  "p", "a", "img", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "pre", "code", "blockquote",
  "em", "strong", "del", "table", "thead", "tbody", "tr", "th", "td", "hr", "br", "span",
]);
// Attributes any allowed element may carry.
const COMMON_ATTRS = new Set(["href", "src", "alt", "title"]);
// Renderer-emitted attributes, valid only on the element and value shape the highlighter/slugger
// produces. Raw author HTML with other shapes therefore fails.
const SHAPED_ATTRS = {
  id: { on: /^h[1-6]$/, value: /^[\w-]+$/ },
  class: {
    pre: /^astro-code(?: [\w-]+)*$/,
    span: /^line$/,
  },
  style: { on: /^(?:pre|span)$/, value: null }, // checked by safeStyle
  tabindex: { on: /^pre$/, value: /^0$/ },
  "data-language": { on: /^pre$/, value: /^[\w+#.-]{1,40}$/ },
};
const STYLE_PROPS = new Set(["color", "background-color", "overflow-x", "font-style", "font-weight", "text-decoration"]);

function safeStyle(v) {
  const decls = v.split(";").map((d) => d.trim()).filter(Boolean);
  if (!decls.length) return false;
  return decls.every((d) => {
    const m = d.match(/^([a-z-]+)\s*:\s*([#a-zA-Z0-9 .%-]+)$/);
    return m !== null && STYLE_PROPS.has(m[1]);
  });
}

function attrAllowed(el, name, value) {
  if (COMMON_ATTRS.has(name)) {
    if (name === "href" && el !== "a") return false;
    if (name === "src" && el !== "img") return false;
    if (name === "alt" && el !== "img") return false;
    return true;
  }
  const rule = SHAPED_ATTRS[name];
  if (!rule) return false;
  if (name === "class") return rule[el] !== undefined && rule[el].test(value);
  if (!rule.on.test(el)) return false;
  return name === "style" ? safeStyle(value) : rule.value.test(value);
}

function urlProblem(raw) {
  // Only `&amp;` is a legitimate entity in an emitted URL; any other `&` could hide a scheme.
  const v = raw.replace(/&amp;/g, "&");
  if (/&[#a-zA-Z]/.test(v)) return "entity in URL";
  let u;
  try {
    u = new URL(v.trim(), "https://wizscheduler.com/");
  } catch {
    return "unparseable URL";
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return `scheme ${u.protocol}`;
  if (u.username || u.password) return "credentials in URL";
  if (!ALLOWED_HOSTS.has(u.hostname)) return `off-site host ${u.hostname}`;
  if (u.port) return "port in URL";
  return null;
}

const TAG = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z_:][-\w:.]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/;
const ATTR = /\s+([a-zA-Z_:][-\w:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/y;

// The renderer escapes `<` in text, so every `<` in its output must open a well-formed tag.
// Anything else (comments, doctype, CDATA, a malformed tag) cannot be classified: fail closed.
export function htmlProblems(html) {
  const problems = [];
  let i = 0;
  while ((i = html.indexOf("<", i)) !== -1) {
    const m = TAG.exec(html.slice(i));
    if (!m) {
      problems.push(`unclassifiable markup: ${html.slice(i, i + 30).replace(/\s+/g, " ")}`);
      break;
    }
    i += m[0].length;
    const [, closing, rawName, attrText] = m;
    const el = rawName.toLowerCase();
    if (!ELEMENTS.has(el)) {
      problems.push(`element <${el}> not allowed`);
      continue;
    }
    if (closing) {
      if (attrText.trim()) problems.push(`attributes on closing </${el}>`);
      continue;
    }
    ATTR.lastIndex = 0;
    const seen = new Set();
    let a;
    while (ATTR.lastIndex < attrText.length && (a = ATTR.exec(attrText)) !== null) {
      const name = a[1].toLowerCase();
      const value = a[2] ?? a[3] ?? a[4] ?? "";
      if (seen.has(name)) problems.push(`duplicate attribute ${name} on <${el}>`);
      seen.add(name);
      if (!attrAllowed(el, name, value)) {
        problems.push(`attribute ${name} not allowed on <${el}>`);
        continue;
      }
      if (name === "href" || name === "src") {
        const why = urlProblem(value);
        if (why) problems.push(`${name} on <${el}>: ${why}`);
      }
    }
  }
  return problems;
}

let processor;
export async function contentProblems(markdown) {
  processor ??= await createSatteriMarkdownProcessor({});
  let html;
  try {
    html = (await processor.render(markdown)).code;
  } catch (e) {
    return [`markdown failed to render: ${e instanceof Error ? e.message : String(e)}`];
  }
  return htmlProblems(html);
}

// ---- CLI -------------------------------------------------------------------------------

function gitDiff(extraArgs) {
  const out = execFileSync("git", ["diff", "--name-only", "--no-renames", "-z", ...extraArgs, "origin/main...HEAD"], {
    encoding: "utf8",
  });
  return out.split("\0").filter(Boolean);
}

async function main() {
  const head = process.env.GITHUB_HEAD_REF ?? "";
  if (!head.startsWith("content/guide-")) {
    console.log(`not a guide PR (${head || "no head ref"}); skipping`);
    return 0;
  }
  const files = gitDiff([]);
  const bad = outsideBoundary(files);
  if (bad.length) {
    console.error(
      "Guide PRs may only touch src/content/guides/**/*.md and public/guides/** images (png, jpg, jpeg, webp, avif):\n" +
        bad.join("\n"),
    );
    return 1;
  }
  const live = gitDiff(["--diff-filter=AMT"]);
  const links = symlinks(live);
  if (links.length) {
    console.error("Guide PRs may not contain symlinks:\n" + links.join("\n"));
    return 1;
  }
  const failures = [];
  for (const f of live) {
    if (!f.startsWith(CONTENT_PREFIX)) continue;
    for (const p of await contentProblems(readFileSync(f, "utf8"))) failures.push(`${f}: ${p}`);
  }
  if (failures.length) {
    console.error("Guide markdown must render to plain HTML linking only to wizscheduler.com:\n" + failures.join("\n"));
    return 1;
  }
  console.log(`guide boundary ok (${files.length} files)`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main());
}
