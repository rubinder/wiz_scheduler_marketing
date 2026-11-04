import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { faqJsonLd } from "../src/lib/faq";

describe("faqJsonLd", () => {
  it("builds a FAQPage", () => {
    expect(faqJsonLd([{ q: "A?", a: "B." }])).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "A?", acceptedAnswer: { "@type": "Answer", text: "B." } },
      ],
    });
  });

  it("returns null for an empty list", () => {
    expect(faqJsonLd([])).toBeNull();
  });
});

describe("Faq component", () => {
  const src = readFileSync("src/components/Faq.astro", "utf8");
  it("renders nothing for an empty list and emits JSON-LD otherwise", () => {
    expect(src).toMatch(/items\.length\s*>\s*0/);
    expect(src).toContain("application/ld+json");
    expect(src).toContain("faqJsonLd");
  });
});

describe("compare schema", () => {
  const cfg = readFileSync("src/content.config.ts", "utf8");
  it("declares the new frontmatter fields", () => {
    for (const f of ["faq:", "calculator:", "toolId:", "qualifier:"]) expect(cfg).toContain(f);
  });
});
