// Daily guide PRs (branch content/guide-*) may change only guide content and guide assets,
// and the markdown they ship must render to inert HTML: guide text is shaped by untrusted
// Search Console input and auto-merges. We judge the RENDERED output (same processor the
// site uses), never the markdown source, so entity/escape/refdef tricks cannot slip past.
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const CONTENT_PREFIX = "src/content/guides/";
const ASSET_PREFIX = "public/guides/";
const ASSET_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".avif"];
const ALLOWED_HOSTS = new Set(["wizscheduler.com", "app.wizscheduler.com"]);
// The collection is `src/content/guides/<locale>/<slug>.md`; relative image checks rely on that depth.
const GUIDE_FILE = /^src\/content\/guides\/([a-z]{2,3})\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

function pathIsSuspect(f) {
  // eslint-disable-next-line no-control-regex
  return f.includes("..") || f.includes("\\") || /[\u0000-\u001f\u007f]/.test(f) || f.startsWith("/");
}

function allowedFile(f) {
  if (f.startsWith(CONTENT_PREFIX)) return GUIDE_FILE.test(f);
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

// ---- front matter ---------------------------------------------------------------------

const FM_KEYS = new Set(["title", "description", "targetKeyword", "sourceLocale", "publishedOn", "updatedOn", "related"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Markup, template and escape characters, a `scheme:` prefix, and invisible characters (controls,
// bidi overrides, zero-width marks; ZWNJ/ZWJ stay allowed because Indic and Urdu text needs them).
const BAD_STRING = /[<>{}`\\]|(?:^|[^a-zA-Z0-9+.-])[a-zA-Z][a-zA-Z0-9+.-]*:(?=\S)|(?![\u200c\u200d])[\p{Cc}\p{Cf}\p{Co}\p{Cn}\u2028\u2029]/u;

// Plain (unquoted) scalars that YAML would type as something other than a string: null, booleans
// (YAML 1.1's yes/no/on/off/y/n too, in case a stricter parser ever reads the file), numbers in
// any base or sexagesimal form, and timestamps. Quote the value to keep it a string.
const NON_STRING_PLAIN = [
  /^(?:~|null)$/i,
  /^(?:true|false|yes|no|on|off|y|n)$/i,
  /^[-+]?(?:[0-9][0-9_:]*(?:\.[0-9_]*)?|\.[0-9][0-9_]*)(?:e[-+]?[0-9]+)?$/i,
  /^[-+]?(?:0x[0-9a-f_]+|0o[0-7_]+|0b[01_]+|\.inf|\.nan)$/i,
];
const TIMESTAMP = /^\d{4}-\d{1,2}-\d{1,2}(?:$|[Tt\s])/;

// One YAML scalar, restricted to forms a plain parser reads the same way js-yaml does:
//   "double quoted" with no `"` or `\` inside (so no escape sequences),
//   'single quoted' whose only escape is `''`,
//   or plain, with no `: `, trailing `:` or ` #` (a mapping or comment would change the value).
// Returns { value, quoted }, or null when the text is outside that subset.
function scalar(raw) {
  const v = raw.trim();
  if (v === "" || /^[-?:](?:\s|$)/.test(v) || /^[&*!|>%@#,\[\]{}]/.test(v)) return null;
  if (v[0] === '"') return /^"[^"\\]*"$/.test(v) ? { value: v.slice(1, -1), quoted: true } : null;
  if (v[0] === "'") return /^'(?:[^']|'')*'$/.test(v) ? { value: v.slice(1, -1).replace(/''/g, "'"), quoted: true } : null;
  if (/:(?:\s|$)/.test(v) || /\s#/.test(v)) return null;
  return { value: v, quoted: false };
}

const isNonStringPlain = (s) => !s.quoted && NON_STRING_PLAIN.some((re) => re.test(s.value));

// Splits front matter exactly where Astro does (@astrojs/internal-helpers/frontmatter: the block
// ends at the first line starting with --- or +++), but accepts only the plain shape: the file
// starts with `---\n`, and the closing delimiter is a line of its own. `body` is what Astro renders.
export function splitFrontMatter(markdown) {
  if (!markdown.startsWith("---\n")) return null;
  const m = /^---([\s\S]*?\n)(---|\+\+\+)/.exec(markdown);
  if (!m || m[2] !== "---") return null;
  const rest = markdown.slice(m[0].length);
  if (rest !== "" && !rest.startsWith("\n")) return null;
  return { lines: m[1].split("\n").slice(1, -1), body: rest.trim() };
}

function frontMatterLineProblems(lines, locales) {
  const problems = [];
  const seen = new Set();
  for (const line of lines) {
    if (line === "") continue;
    const m = line.match(/^([A-Za-z][A-Za-z0-9]*):[ ]+(\S.*)$/);
    if (!m) {
      problems.push(`front matter: cannot parse line: ${JSON.stringify(line.slice(0, 40))}`);
      continue;
    }
    const [, key, rawValue] = m;
    if (!FM_KEYS.has(key)) {
      problems.push(`front matter: key ${key} not allowed`);
      continue;
    }
    if (seen.has(key)) problems.push(`front matter: duplicate key ${key}`);
    seen.add(key);
    if (key === "related") {
      const l = rawValue.trim().match(/^\[(.*)\]$/);
      const items = l ? (l[1].trim() === "" ? [] : l[1].split(",").map(scalar)) : null;
      if (!items || items.some((i) => i === null || isNonStringPlain(i) || !SLUG.test(i.value))) {
        problems.push("front matter: related must be a list of slugs");
      }
      continue;
    }
    const s = scalar(rawValue);
    const value = s?.value;
    if (s === null) {
      problems.push(`front matter: cannot parse ${key} (quote a value containing ": " or " #")`);
    } else if (key === "publishedOn" || key === "updatedOn") {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().startsWith(value);
      if (!ok) problems.push(`front matter: ${key} must be YYYY-MM-DD`);
    } else if (key === "sourceLocale") {
      if (!locales.includes(value)) problems.push("front matter: sourceLocale is not a site locale");
    } else if (isNonStringPlain(s) || (!s.quoted && TIMESTAMP.test(value))) {
      problems.push(`front matter: ${key} would not load as a string; quote it`);
    } else if (BAD_STRING.test(value)) {
      problems.push(`front matter: ${key} contains markup, a URL or invisible characters`);
    }
  }
  return problems;
}

// A strict subset of YAML: `key: scalar` and `key: [a, b]`, one per line. Anything else fails closed.
export function frontMatterProblems(markdown, locales) {
  if (markdown.includes("\r")) return ["front matter: carriage return in file"];
  const fm = splitFrontMatter(markdown);
  if (!fm) return ["front matter: missing or not a plain --- block at the very start"];
  return frontMatterLineProblems(fm.lines, locales);
}

// ---- rendered-HTML policy -------------------------------------------------------------

const ELEMENTS = new Set([
  "p", "a", "img", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "pre", "code", "blockquote",
  "em", "strong", "del", "table", "thead", "tbody", "tr", "th", "td", "hr", "br", "span",
]);
const VOID = new Set(["img", "hr", "br"]);
// Every class the renderer emits for this site's configuration (shiki, github-dark theme), observed by
// rendering fenced code in many languages. Exact values only: Tailwind scans .md files, so an extra
// token such as `hidden`, `sr-only`, `opacity-0` or `text-transparent` would get real CSS.
const CLASSES = { pre: "astro-code github-dark", span: "line" };
const COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
// Highlighter styles: opaque hex colours and a few enumerated values, nothing that can hide text.
// Backgrounds only on the <pre>; spans get a foreground that must contrast with it.
const PRE_STYLE = {
  color: (v) => COLOR.test(v),
  "background-color": (v) => COLOR.test(v),
  "overflow-x": (v) => v === "auto",
};
const SPAN_STYLE = {
  color: (v) => COLOR.test(v),
  "font-style": (v) => v === "italic" || v === "normal",
  "font-weight": (v) => /^(?:bold|normal|[1-9]00)$/.test(v),
  "text-decoration": (v) => v === "underline" || v === "line-through" || v === "none",
  "user-select": (v) => v === "none", // diff markers
};
// github-dark's dimmest token (comments, #6a737d) is 3.05:1 on its background.
const MIN_CONTRAST = 2.5;

function parseStyle(v, allowed) {
  const decls = v.split(";").map((d) => d.trim()).filter(Boolean);
  if (!decls.length) return null;
  const out = {};
  for (const d of decls) {
    const m = d.match(/^([a-z-]+)\s*:\s*([#a-zA-Z0-9 .%-]+)$/);
    if (!m || !Object.hasOwn(allowed, m[1]) || !allowed[m[1]](m[2].trim()) || m[1] in out) return null;
    out[m[1]] = m[2].trim().toLowerCase();
  }
  return out;
}

function luminance(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const BASE = "https://wizscheduler.com/";
const isRelative = (v) => !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(v) && !/^[\\/]{2}/.test(v);
const IMAGE_PATH = /^[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|avif)$/;

// A relative image resolves against the guide file (as Astro does) and must stay inside the
// guide folders or public/guides, with a plain path: no query (`?raw`), fragment or escapes.
function relativeImageOk(v, file) {
  if (!isRelative(v) || !IMAGE_PATH.test(v)) return false;
  try {
    const p = new URL(v, `https://wizscheduler.com/${file}`).pathname;
    return p.startsWith("/guides/") || p.startsWith("/public/guides/") || p.startsWith("/src/content/guides/");
  } catch {
    return false;
  }
}

function urlProblem(raw, el, file) {
  // Only `&amp;` is a legitimate entity in an emitted URL; any other `&` could hide a scheme.
  const v = raw.replace(/&amp;/g, "&");
  if (/&[#a-zA-Z]/.test(v)) return "entity in URL";
  let u;
  try {
    u = new URL(v.trim(), BASE);
  } catch {
    return "unparseable URL";
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return `scheme ${u.protocol}`;
  if (u.username || u.password) return "credentials in URL";
  if (!ALLOWED_HOSTS.has(u.hostname)) return `off-site host ${u.hostname}`;
  if (u.port) return "port in URL";
  if (el === "img" && isRelative(v.trim()) && !relativeImageOk(v, file)) return "relative image outside guide folders";
  return null;
}

// Astro's image marker: JSON describing a local image, which Astro swaps for the processed asset.
function imageMarkerProblem(raw, srcAttr, file) {
  if (/&(?!(?:amp|quot|#34|#x22);)/i.test(raw)) return "entity in image marker";
  let o;
  try {
    o = JSON.parse(raw.replace(/&(?:quot|#34|#x22);/gi, '"').replace(/&amp;/g, "&"));
  } catch {
    return "unparseable image marker";
  }
  if (o === null || typeof o !== "object" || Array.isArray(o)) return "bad image marker";
  if (Object.keys(o).some((k) => !["src", "alt", "title", "index"].includes(k))) return "unexpected image marker key";
  if (!Number.isInteger(o.index) || ["alt", "title"].some((k) => k in o && typeof o[k] !== "string")) return "bad image marker";
  if (typeof o.src !== "string" || !relativeImageOk(o.src, file)) return "image marker src outside guide folders";
  if (srcAttr !== undefined) return "image marker next to a src";
  return null;
}

const TAG = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z_:][-\w:.]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/;
const ATTR = /\s+([a-zA-Z_:][-\w:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/y;

function attrProblem(el, name, value, ctx) {
  switch (name) {
    case "href": return el === "a" ? null : "not allowed here";
    case "src":
    case "alt": return el === "img" ? null : "not allowed here";
    case "title": return null;
    case "id": return /^h[1-6]$/.test(el) && /^[\p{L}\p{N}\p{M}_-]+$/u.test(value) ? null : "bad id";
    case "class":
      if (el === "span" && !ctx.inPre) return "bad class";
      return Object.hasOwn(CLASSES, el) && value === CLASSES[el] ? null : "bad class";
    case "tabindex": return el === "pre" && value === "0" ? null : "bad tabindex";
    case "data-language": return el === "pre" && /^[\w+#.-]{1,40}$/.test(value) ? null : "bad data-language";
    case "__astro_image_": return el === "img" ? null : "not allowed here"; // value checked separately
    case "style":
      // Exactly what the renderer emits for table alignment.
      if (el === "th" || el === "td") return /^text-align: (?:left|center|right)$/.test(value) ? null : "bad table style";
      // Other styles exist only inside a highlighter <pre class="astro-code github-dark">; anywhere else they could cloak text.
      if (el === "pre") return ctx.attrs.class === CLASSES.pre && parseStyle(value, PRE_STYLE) ? null : "bad style";
      if (el === "span" && ctx.inPre) return parseStyle(value, SPAN_STYLE) ? null : "bad style";
      return "style not allowed here";
    default: return "attribute not allowed";
  }
}

const DEFAULT_FILE = "src/content/guides/en/guide.md";

// The renderer escapes `<` in text, so every `<` in its output must open a well-formed tag.
// Anything else (comments, doctype, CDATA, a malformed tag) cannot be classified: fail closed.
// `file` is the guide's path, against which relative images resolve.
export function htmlProblems(html, file = DEFAULT_FILE) {
  const problems = [];
  const stack = [];
  const preBg = []; // background colour of each open <pre> (null when it has no highlighter style)
  let i = 0;
  while ((i = html.indexOf("<", i)) !== -1) {
    const m = TAG.exec(html.slice(i));
    if (!m) {
      problems.push(`unclassifiable markup: ${html.slice(i, i + 30).replace(/\s+/g, " ")}`);
      return problems;
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
      if (stack[stack.length - 1] !== el) problems.push(`unbalanced closing </${el}>`);
      else {
        stack.pop();
        if (el === "pre") preBg.pop();
      }
      continue;
    }
    const attrs = {};
    ATTR.lastIndex = 0;
    let a;
    let ok = true;
    while (ATTR.lastIndex < attrText.length && (a = ATTR.exec(attrText)) !== null) {
      const name = a[1].toLowerCase();
      if (name in attrs) {
        problems.push(`duplicate attribute ${name} on <${el}>`);
        ok = false;
      }
      attrs[name] = a[2] ?? a[3] ?? a[4] ?? "";
    }
    if (ATTR.lastIndex !== attrText.length) {
      problems.push(`unparseable attributes on <${el}>`);
      ok = false;
    }
    const inPre = stack.includes("pre");
    const ctx = { inPre, attrs };
    for (const [name, value] of Object.entries(attrs)) {
      const why = attrProblem(el, name, value, ctx);
      if (why) {
        problems.push(`attribute ${name} on <${el}>: ${why}`);
        ok = false;
      } else if (name === "href" || name === "src") {
        const u = urlProblem(value, el, file);
        if (u) problems.push(`${name} on <${el}>: ${u}`);
      } else if (name === "__astro_image_") {
        const u = imageMarkerProblem(value, attrs.src, file);
        if (u) problems.push(`${name}: ${u}`);
      }
    }
    if (el === "pre") {
      // A styled <pre> (real or forged) must set both colours, readable on each other.
      const st = ok && attrs.style ? parseStyle(attrs.style, PRE_STYLE) : null;
      if (st && (!st.color || !st["background-color"] || contrast(st.color, st["background-color"]) < MIN_CONTRAST)) {
        problems.push("highlighted block text is not readable on its background");
      }
      preBg.push(st?.["background-color"] ?? null);
    }
    if (ok && el === "span" && inPre && attrs.style) {
      const c = parseStyle(attrs.style, SPAN_STYLE)?.color;
      const bg = preBg[preBg.length - 1];
      if (c && !bg) problems.push("coloured text in a block without a background");
      else if (c && contrast(c, bg) < MIN_CONTRAST) problems.push("highlighted text is not readable on its background");
    }
    if (!VOID.has(el)) stack.push(el);
  }
  if (stack.length) problems.push(`unclosed <${stack[stack.length - 1]}>`);
  return problems;
}

// Both modules are transitive or local; tests pin the renderer version (see guide-boundary.test.ts).
const defaultLoad = async () => {
  const { createSatteriMarkdownProcessor } = await import("@astrojs/markdown-satteri");
  const { LOCALES } = await import("../src/lib/links.ts");
  return { processor: await createSatteriMarkdownProcessor({}), locales: [...LOCALES] };
};

let loaded;
// Fails closed: if the renderer (or the locale list) cannot be loaded, that is itself a problem.
// The body is split off the front matter the way Astro does, and rendered on its own, as Astro renders it.
export async function contentProblems(markdown, { file = DEFAULT_FILE, load = defaultLoad } = {}) {
  let env;
  try {
    env = load === defaultLoad ? (loaded ??= await load()) : await load();
    if (typeof env?.processor?.render !== "function" || !Array.isArray(env.locales) || !env.locales.length) {
      throw new Error("renderer or locales missing");
    }
  } catch (e) {
    return [`renderer unavailable: ${e instanceof Error ? e.message : String(e)}`];
  }
  const problems = frontMatterProblems(markdown, env.locales);
  const folder = GUIDE_FILE.exec(file)?.[1];
  if (!folder || !env.locales.includes(folder)) problems.push(`guide path ${file} is not src/content/guides/<locale>/<slug>.md`);
  const fm = splitFrontMatter(markdown);
  if (!fm) return problems; // nothing reliable to render; the front matter problem already fails the check
  // The renderer strips a front matter block of its own at the top of the body, unseen by this check.
  if (/^(?:---|\+\+\+)/.test(fm.body)) problems.push("body starts with a second front matter delimiter");
  let html;
  try {
    html = (await env.processor.render(fm.body)).code;
  } catch (e) {
    return [...problems, `markdown failed to render: ${e instanceof Error ? e.message : String(e)}`];
  }
  return [...problems, ...htmlProblems(html, file)];
}

// ---- CLI -------------------------------------------------------------------------------

const SUBMODULE = "160000";
const SYMLINK = "120000";

// Parses `git diff --raw -z --no-renames --no-abbrev`: ":<old mode> <new mode> <old sha> <new sha> <status>\0<path>\0".
export function parseRawDiff(out) {
  const parts = out.split("\0");
  if (parts[parts.length - 1] === "") parts.pop();
  if (parts.length % 2) throw new Error("unparseable git diff output");
  const entries = [];
  for (let i = 0; i < parts.length; i += 2) {
    const m = parts[i].match(/^:(\d{6}) (\d{6}) [0-9a-f]+ [0-9a-f]+ ([A-Z])\d*$/);
    if (!m) throw new Error(`unparseable git diff entry: ${parts[i]}`);
    entries.push({ oldMode: m[1], newMode: m[2], status: m[3], path: parts[i + 1] });
  }
  return entries;
}

export function diffProblems(entries) {
  const problems = [];
  for (const e of entries) {
    if (e.status === "D") problems.push(`${e.path}: deletes or renames away an existing file`);
    else if (!["A", "M", "T"].includes(e.status)) problems.push(`${e.path}: unsupported change ${e.status}`);
    if (e.newMode === SUBMODULE || e.oldMode === SUBMODULE) problems.push(`${e.path}: submodule entry`);
    if (e.newMode === SYMLINK) problems.push(`${e.path}: symlink`);
  }
  return problems;
}

function gitDiff() {
  const out = execFileSync("git", ["diff", "--raw", "--no-renames", "--no-abbrev", "-z", "origin/main...HEAD"], { encoding: "utf8" });
  return parseRawDiff(out);
}

// The branch under check: a pull_request run names it in GITHUB_HEAD_REF; a push run leaves that
// empty and names the pushed branch in GITHUB_REF_NAME. Any other event checks nothing.
export function headRef(env) {
  return env.GITHUB_HEAD_REF || (env.GITHUB_EVENT_NAME === "push" ? env.GITHUB_REF_NAME || "" : "");
}

async function main() {
  const head = headRef(process.env);
  if (!head.startsWith("content/guide-")) {
    console.log(`not a guide PR (${head || "no head ref"}); skipping`);
    return 0;
  }
  const entries = gitDiff();
  const files = entries.map((e) => e.path);
  const bad = outsideBoundary(files);
  if (bad.length) {
    console.error(
      "Guide PRs may only touch src/content/guides/<locale>/<slug>.md and public/guides/** images (png, jpg, jpeg, webp, avif):\n" +
        bad.join("\n"),
    );
    return 1;
  }
  const structural = diffProblems(entries);
  if (structural.length) {
    console.error("Guide PRs may only add or modify regular files:\n" + structural.join("\n"));
    return 1;
  }
  const live = entries.filter((e) => ["A", "M", "T"].includes(e.status)).map((e) => e.path);
  const links = symlinks(live);
  if (links.length) {
    console.error("Guide PRs may not contain symlinks:\n" + links.join("\n"));
    return 1;
  }
  const failures = [];
  for (const f of live) {
    if (!f.startsWith(CONTENT_PREFIX)) continue;
    for (const p of await contentProblems(readFileSync(f, "utf8"), { file: f })) failures.push(`${f}: ${p}`);
  }
  if (failures.length) {
    console.error("Guide markdown must have plain front matter and render to plain HTML linking only to wizscheduler.com:\n" + failures.join("\n"));
    return 1;
  }
  console.log(`guide boundary ok (${files.length} files)`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main());
}
