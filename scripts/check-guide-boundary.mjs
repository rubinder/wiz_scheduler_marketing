// Daily guide PRs (branch content/guide-*) may change only guide content and guide assets,
// and the markdown they add must be inert: guide text is shaped by untrusted Search Console
// input and auto-merges, so no raw HTML, script-ish URLs or off-site links.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ALLOWED_PREFIXES = ["src/content/guides/", "public/guides/"];
const ALLOWED_HOSTS = new Set(["wizscheduler.com", "app.wizscheduler.com"]);

function pathIsSuspect(f) {
  // eslint-disable-next-line no-control-regex
  return f.includes("..") || f.includes("\\") || /[\u0000-\u001f\u007f]/.test(f) || f.startsWith("/");
}

export function outsideBoundary(files) {
  return files.filter((f) => pathIsSuspect(f) || !ALLOWED_PREFIXES.some((p) => f.startsWith(p)));
}

function stripFences(markdown) {
  const out = [];
  let fence = null;
  for (const line of markdown.split(/\r\n|\r|\n/)) {
    if (fence) {
      const close = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fence.char && close[1].length >= fence.len) fence = null;
      continue;
    }
    const open = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (open) {
      fence = { char: open[1][0], len: open[1].length };
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

function hostOf(authority) {
  const afterUser = authority.slice(authority.lastIndexOf("@") + 1);
  return afterUser.replace(/:\d*$/, "").replace(/\.$/, "").toLowerCase();
}

const AUTHORITY_END = String.raw`[^\s\/\\?#)>\]<"'` + "`" + `]*`;
const SCHEME_URL = new RegExp(String.raw`(?<![a-z0-9+.-])(https?):[\/\\]*(${AUTHORITY_END})`, "gi");
const PROTO_REL = new RegExp(String.raw`(?:\]\(|^ {0,3}\[[^\]\n]*\]:)[ \t]*<?[ \t]*[\/\\]{2}(${AUTHORITY_END})`, "gim");
const SCHEME_AUTOLINK = /<([a-z][a-z0-9+.-]{1,31}):[^\s<>]*>/gi;

export function contentProblems(markdown) {
  const text = stripFences(markdown);
  const problems = [];

  // Autolinks (<https://...>) are links, not raw HTML; they are judged by the URL rules below.
  for (const m of text.matchAll(SCHEME_AUTOLINK)) {
    if (!/^https?$/i.test(m[1])) problems.push(`non-http autolink: ${m[0]}`);
  }
  const withoutAutolinks = text.replace(SCHEME_AUTOLINK, "");
  const html = withoutAutolinks.match(/<[A-Za-z\/!][^\n]{0,40}/);
  if (html) problems.push(`raw HTML: ${html[0].trim()}`);

  // Scheme letters may be split by tab/newline/control characters and still execute.
  const gap = String.raw`[\u0000- ]*`;
  const spaced = (word) => word.split("").join(gap);
  for (const scheme of ["javascript", "vbscript"]) {
    if (new RegExp(`${spaced(scheme)}${gap}:`, "i").test(text)) problems.push(`${scheme}: URL`);
  }
  if (new RegExp(String.raw`(?<![a-z0-9])${spaced("data")}${gap}:[^\s]`, "i").test(text)) problems.push("data: URL");
  if (/&#x?[0-9a-f]+;?/i.test(text)) problems.push("numeric character reference (can hide a URL scheme)");

  for (const m of text.matchAll(SCHEME_URL)) {
    const host = hostOf(m[2]);
    if (!ALLOWED_HOSTS.has(host)) problems.push(`off-site link: ${m[1].toLowerCase()}://${host || "(no host)"}`);
  }
  for (const m of text.matchAll(PROTO_REL)) {
    const host = hostOf(m[1]);
    if (!ALLOWED_HOSTS.has(host)) problems.push(`off-site protocol-relative link: //${host || "(no host)"}`);
  }
  return problems;
}

function gitDiff(extraArgs) {
  const out = execFileSync("git", ["diff", "--name-only", "--no-renames", "-z", ...extraArgs, "origin/main...HEAD"], {
    encoding: "utf8",
  });
  return out.split("\0").filter(Boolean);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const head = process.env.GITHUB_HEAD_REF ?? "";
  if (!head.startsWith("content/guide-")) {
    console.log(`not a guide PR (${head || "no head ref"}); skipping`);
    process.exit(0);
  }
  const files = gitDiff([]);
  const bad = outsideBoundary(files);
  if (bad.length) {
    console.error("Guide PRs may only touch src/content/guides/** and public/guides/**:\n" + bad.join("\n"));
    process.exit(1);
  }
  const failures = [];
  for (const f of gitDiff(["--diff-filter=AM"])) {
    if (!f.startsWith("src/content/guides/") || !f.endsWith(".md")) continue;
    for (const p of contentProblems(readFileSync(f, "utf8"))) failures.push(`${f}: ${p}`);
  }
  if (failures.length) {
    console.error("Guide markdown must be plain and link only to wizscheduler.com:\n" + failures.join("\n"));
    process.exit(1);
  }
  console.log(`guide boundary ok (${files.length} files)`);
}
