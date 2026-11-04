// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/react/container-renderer";
import Alternatives from "../../src/views/Alternatives.astro";
import { TOOLS } from "../../src/data/competitors";

let en = "";
let es = "";

beforeAll(async () => {
  const renderers = await loadRenderers([getContainerRenderer()]);
  const c = await AstroContainer.create({ renderers });
  en = await c.renderToString(Alternatives, { props: { locale: "en", focus: "7shifts" } });
  es = await c.renderToString(Alternatives, { props: { locale: "es", focus: "7shifts" } });
});

/** The worked-example section only, so the assertions can't pass on other copy. */
function example(html: string): string {
  const m = html.match(/<section[^>]*data-worked-example[^>]*>([\s\S]*?)<\/section>/);
  expect(m, "worked example section missing").not.toBeNull();
  return m![1];
}

describe("7shifts alternatives (en)", () => {
  it("prices the example per location: 13 employees each puts 7shifts on Essentials", () => {
    const ex = example(en);
    expect(ex).toContain("13 employees per location");
    expect(ex).toContain("3 locations");
    expect(ex).toContain("$149.97");
    expect(ex).not.toContain("$299.97");
  });

  it("marks 7shifts Essentials as the highlighted plan and lists Premium too", () => {
    const ex = example(en);
    const rows = [...ex.matchAll(/<tr[^>]*data-highlighted[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => r[1]);
    expect(rows.some((r) => r.includes("7shifts") && r.includes("Essentials") && r.includes("$149.97"))).toBe(true);
    expect(ex).toContain("$449.97"); // Premium $149.99 x 3, shown but not highlighted
    expect(ex).toContain("$18.00");
  });

  it("links every tool's pricing page", () => {
    for (const tool of Object.values(TOOLS)) {
      const href = tool.pricingUrl.startsWith("/") ? `href="${tool.pricingUrl}"` : tool.pricingUrl;
      expect(en, tool.id).toContain(href);
    }
  });

  it("has FAQPage JSON-LD, the hero qualifier and the retitled page", () => {
    expect(en).toContain('"@type":"FAQPage"');
    expect(en).toContain("Managers can enter preferences for everyone.");
    expect(en).toContain("Company Settings");
    expect(en).toMatch(/<title>[^<]*7shifts Alternatives[^<]*<\/title>/);
    expect(en).toMatch(/<title>[^<]*7shifts Pricing[^<]*<\/title>/);
    expect(en).toContain("Wiz Scheduler");
    expect(en).not.toContain("WizScheduler");
  });

  it("is honest that 7shifts and Deputy do more on Fair Workweek", () => {
    expect(en).toContain("7shifts and Deputy do more here");
  });

  it("server-renders the calculator with all five tools", () => {
    expect(en).toContain("What would it cost for your team?");
    for (const tool of Object.values(TOOLS)) expect(en).toContain(`>${tool.name}</caption>`);
  });

  it("keeps external links nofollow in a new tab", () => {
    const external = [...en.matchAll(/<a [^>]*href="https:\/\/(?!wizscheduler\.com|app\.)[^"]*"[^>]*>/g)].map((m) => m[0]);
    expect(external.length).toBeGreaterThan(0);
    for (const a of external) {
      expect(a).toContain('rel="noopener nofollow"');
      expect(a).toContain('target="_blank"');
    }
  });
});

describe("7shifts alternatives (es)", () => {
  it("is a Spanish page with Spanish headings and the per-location example", () => {
    expect(es).toMatch(/<html[^>]*lang="es"/);
    expect(es).toContain("Alternativas a 7shifts");
    expect(es).toContain("Puntos fuertes");
    expect(es).toContain("Preguntas frecuentes");
    const ex = example(es);
    expect(ex).toContain("13 empleados por ubicación");
    expect(ex).toContain("$149.97");
    expect(ex).not.toContain("$299.97");
    expect(es).toContain("configuración de la empresa");
    expect(es).toContain('"@type":"FAQPage"');
  });

  it("links to Spanish pages where they exist, and English pricing (no /es/pricing page)", () => {
    expect(es).toContain('href="/es/compare/7shifts"');
    expect(es).toContain('href="/es/free-schedule-checker"');
    expect(es).toContain('href="/pricing"');
    expect(es).not.toContain('href="/es/pricing"');
  });
});
