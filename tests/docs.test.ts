// @vitest-environment node
// The architecture skill and CLAUDE.md are what agents read before touching this repo; keep the
// facts they state about locales and guides in step with the code.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ALL_LOCALE_PATHS } from "../src/lib/links";

const skill = readFileSync(".claude/skills/architecture/SKILL.md", "utf8");
const claude = readFileSync("CLAUDE.md", "utf8");

describe("agent docs", () => {
  it("the architecture skill names every ALL_LOCALE_PATHS path", () => {
    const line = skill.split("\n").find((l) => l.includes("`ALL_LOCALE_PATHS`")) ?? "";
    for (const p of ALL_LOCALE_PATHS) expect(line, p).toContain(`\`${p}\``);
  });
  it("CLAUDE.md says [locale] serves guides", () => {
    const line = claude.split("\n").find((l) => l.includes("`src/pages/[locale]/`")) ?? "";
    expect(line).toMatch(/guides/);
  });
  it("neither refers to this PR or the factory plan's task numbers", () => {
    for (const text of [skill, claude]) expect(text).not.toMatch(/added by (?:this|the guides-line) PR|Task \d+ of the factory plan/);
  });
});
