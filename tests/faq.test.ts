// @vitest-environment node
import { describe, expect, it } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import Faq from "../src/components/Faq.astro";
import { compareSchema } from "../src/lib/compareSchema";
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
  it("renders nothing for an empty list", async () => {
    const c = await AstroContainer.create();
    expect((await c.renderToString(Faq, { props: { items: [], title: "FAQ" } })).trim()).toBe("");
  });

  it("renders questions and escaped FAQPage JSON-LD", async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Faq, {
      props: { items: [{ q: "Why?", a: "Because </script><b>x</b>" }], title: "FAQ" },
    });
    expect(html).toContain("Why?");
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(m).not.toBeNull();
    expect(m![1]).not.toContain("<");
    const data = JSON.parse(m![1]);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity[0].acceptedAnswer.text).toBe("Because </script><b>x</b>");
  });
});

describe("compare schema", () => {
  it("defaults the new fields for legacy frontmatter", () => {
    const r = compareSchema.parse({
      title: "t",
      description: "d",
      competitor: "7shifts",
      competitorUrl: "https://www.7shifts.com",
      checkedOn: "2026-11-01",
    });
    expect(r.faq).toEqual([]);
    expect(r.calculator).toBe(false);
    expect(r.toolId).toBeUndefined();
  });
});
