// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/react/container-renderer";
import Alternatives from "../../src/views/Alternatives.astro";
import enCopy from "../../src/i18n/en";
import esCopy from "../../src/i18n/es";
import { DEFAULT_TEAM, TOOLS, formatUsd, quotePlans } from "../../src/data/competitors";

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

/** Rows of the worked example, with the fit/highlight flags they carry. */
function exampleRows(html: string) {
  return [...example(html).matchAll(/<tr([^>]*)>([\s\S]*?)<\/tr>/g)]
    .filter((r) => r[1].includes("data-fits"))
    .map((r) => ({
      fits: r[1].includes('data-fits="true"'),
      highlighted: r[1].includes("data-highlighted"),
      html: r[2].replaceAll("&#39;", "'"),
    }));
}

/** The calculator island's server-rendered markup only. */
function island(html: string): string {
  const m = html.match(/<astro-island[^>]*>([\s\S]*?)<\/astro-island>/);
  expect(m, "calculator island missing").not.toBeNull();
  return m![1];
}

/** FAQ questions and answers as published in the FAQPage JSON-LD. */
function faqText(html: string): string {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(m, "FAQPage JSON-LD missing").not.toBeNull();
  const data = JSON.parse(m![1]) as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
  return data.mainEntity.map((e) => `${e.name}\n${e.acceptedAnswer.text}`).join("\n");
}

/** Page markup without scripts, styles or the island's serialized props (they carry the calculator's own {date}). */
function visible(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, "")
    .replace(/<astro-island[^>]*>/g, "<astro-island>");
}

const s7 = TOOLS["7shifts"].plans;
const price = (n: number | null) => (Number.isInteger(n) ? `$${n}` : formatUsd(n!));

describe("7shifts alternatives (en)", () => {
  it("prices the example per location: 13 employees each puts 7shifts on Essentials", () => {
    const ex = example(en);
    expect(ex).toContain("13 employees per location");
    expect(ex).toContain("3 locations");
    expect(ex).toContain("$149.97");
  });

  it("lists every 7shifts tier with its range; tiers that don't fit show their price, marked", () => {
    const rows = exampleRows(en).filter((r) => r.html.includes("7shifts "));
    expect(rows).toHaveLength(TOOLS["7shifts"].plans.length);
    const row = (text: string) => rows.filter((r) => r.html.includes(text));
    const essentials = row("Essentials")[0];
    expect(essentials).toMatchObject({ fits: true, highlighted: true });
    expect(essentials.html).toContain("1–30 per location");
    expect(essentials.html).toContain("$149.97");
    const [premium, premiumLarge] = row("Premium");
    expect(premium).toMatchObject({ fits: true, highlighted: false });
    expect(premium.html).toContain("$449.97");
    expect(premiumLarge).toMatchObject({ fits: false, highlighted: false });
    expect(premiumLarge.html).toContain("31+ per location");
    expect(premiumLarge.html).toContain("$599.97");
    expect(premiumLarge.html).toContain(enCopy.calculator.doesNotFit);
    const comp = row("Comp")[0];
    expect(comp.fits).toBe(false);
    expect(comp.html).toContain("1 location, up to 15 employees");
    expect(comp.html).not.toContain("$");
  });

  it("shows $299.97 only on a 7shifts Pro row marked as not fitting, never highlighted", () => {
    const with299 = exampleRows(en).filter((r) => r.html.includes("$299.97"));
    expect(with299).toHaveLength(1);
    expect(with299[0]).toMatchObject({ fits: false, highlighted: false });
    expect(with299[0].html).toContain("Pro");
    expect(with299[0].html).toContain("31–60 per location");
    expect(with299[0].html).toContain(enCopy.calculator.doesNotFit);
  });

  it("every highlighted example row fits", () => {
    const rows = exampleRows(en);
    expect(rows.filter((r) => r.highlighted)).toHaveLength(Object.keys(TOOLS).length);
    for (const r of rows.filter((r) => r.highlighted)) expect(r.fits).toBe(true);
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
    const calc = island(en);
    expect(calc).toContain("What would it cost for your team?");
    for (const tool of Object.values(TOOLS)) expect(calc).toContain(`>${tool.name}</caption>`);
  });

  it("fills every FAQ price from the data module", () => {
    const faq = faqText(en);
    for (const p of s7.filter((p) => p.monthlyUsd)) expect(faq).toContain(price(p.monthlyUsd));
    const pick = quotePlans(TOOLS["7shifts"], DEFAULT_TEAM).find((q) => q.highlighted)!;
    expect(faq).toContain(`${pick.plan}`);
    expect(faq).toContain(formatUsd(pick.monthlyUsd!));
    expect(faq).toContain(`${DEFAULT_TEAM.employeesPerLocation} employees per location`);
    expect(faq).not.toMatch(/[{}]/);
  });

  it("leaves no unfilled {placeholder} on the page", () => {
    expect(visible(en)).not.toMatch(/\{[a-zA-Z]+\}/);
    expect(visible(es)).not.toMatch(/\{[a-zA-Z]+\}/);
    expect(faqText(es)).not.toMatch(/[{}]/);
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
    expect(ex).toContain("31–60 por ubicación");
    const pro = exampleRows(es).filter((r) => r.html.includes("$299.97"));
    expect(pro).toHaveLength(1);
    expect(pro[0]).toMatchObject({ fits: false, highlighted: false });
    expect(pro[0].html).toContain(esCopy.calculator.doesNotFit);
    expect(es).toContain("Configuración de la empresa");
    expect(es).toContain('"@type":"FAQPage"');
  });

  it("links to Spanish pages where they exist, and English pricing (no /es/pricing page)", () => {
    expect(es).toContain('href="/es/compare/7shifts"');
    expect(es).toContain('href="/es/free-schedule-checker"');
    expect(es).toContain('href="/pricing"');
    expect(es).not.toContain('href="/es/pricing"');
  });
});
