/**
 * RTL guard ported from the app (frontend/src/utils/logicalDirection.test.ts).
 * Both launch locales are LTR, but the app's rule keeps a future RTL locale a
 * copy task rather than a CSS audit.
 */
import { describe, expect, it } from "vitest";

const SOURCES = import.meta.glob("../src/**/*.{astro,tsx,ts}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const BANNED: [RegExp, string][] = [
  [/\btext-left\b/, "text-start"],
  [/\btext-right\b/, "text-end"],
  [/\bml-(?:auto|px|full|\d+(?:\.\d+)?|\[[^\]]*\])\b/, "ms-*"],
  [/\bmr-(?:auto|px|full|\d+(?:\.\d+)?|\[[^\]]*\])\b/, "me-*"],
  [/\bpl-(?:auto|px|full|\d+(?:\.\d+)?|\[[^\]]*\])\b/, "ps-*"],
  [/\bpr-(?:auto|px|full|\d+(?:\.\d+)?|\[[^\]]*\])\b/, "pe-*"],
  [/\bborder-l\b/, "border-s"],
  [/\bborder-r\b/, "border-e"],
  [/\brounded-l\b/, "rounded-s"],
  [/\brounded-r\b/, "rounded-e"],
  [/\bleft-0\b/, "start-0"],
  [/\bright-0\b/, "end-0"],
];

describe("logical direction utilities", () => {
  it("no source file uses a physical-direction utility", () => {
    const offenders: string[] = [];
    for (const [file, source] of Object.entries(SOURCES)) {
      if (file.includes("/i18n/generated/")) continue;
      source.split("\n").forEach((line, i) => {
        for (const [pattern, fix] of BANNED) {
          if (pattern.test(line)) offenders.push(`${file}:${i + 1}: use ${fix} — ${line.trim()}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it("does not flag colour classes that merely start with a banned prefix", () => {
    const decoys = ['class="border border-red-300"', 'class="border-rule text-ink"', 'class="ms-2 text-start"'];
    for (const decoy of decoys) expect(BANNED.some(([p]) => p.test(decoy))).toBe(false);
  });
});
