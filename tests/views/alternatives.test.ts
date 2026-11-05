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

const deputy = TOOLS.deputy;
const deputyQuotes = quotePlans(deputy, DEFAULT_TEAM);

for (const locale of ["en", "es"] as const) {
  const copy = locale === "en" ? enCopy : esCopy;
  describe(`Deputy alternatives (${locale})`, () => {
    let html = "";
    beforeAll(async () => {
      const renderers = await loadRenderers([getContainerRenderer()]);
      const c = await AstroContainer.create({ renderers });
      html = await c.renderToString(Alternatives, { props: { locale, focus: "deputy" } });
    });

    it("targets Deputy alternatives and Deputy pricing in the title", () => {
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
      if (locale === "en") {
        expect(title).toContain("Deputy Alternatives");
        expect(title).toContain("Deputy Pricing");
      } else {
        expect(title).toContain("Alternativas a Deputy");
        expect(title).toContain("precios de Deputy");
      }
      expect(html).toMatch(new RegExp(`<html[^>]*lang="${locale}"`));
      expect(html).not.toContain("WizScheduler");
    });

    it("puts Deputy right after Wiz Scheduler", () => {
      const captions = [...example(html).matchAll(/<caption[^>]*>([^<]*)<\/caption>/g)].map((m) => m[1]);
      expect(captions.slice(0, 2)).toEqual(["Wiz Scheduler", "Deputy"]);
    });

    it("prices every Deputy plan for 39 users: Lite $214.50, Core $282.75 highlighted, Pro $390.00", () => {
      const rows = exampleRows(html).filter((r) => r.html.includes("Deputy "));
      expect(rows).toHaveLength(deputy.plans.length);
      const label = { yes: copy.calculator.autoYes, no: copy.calculator.autoNo, beta: copy.calculator.autoBeta };
      deputy.plans.forEach((plan, i) => {
        const q = deputyQuotes[i];
        const row = rows.find((r) => r.html.includes(`Deputy ${plan.name}`))!;
        expect(row).toMatchObject({ fits: true, highlighted: q.highlighted });
        expect(row.html).toContain(formatUsd(q.monthlyUsd!));
        expect(row.html).toContain(`39 ${locale === "en" ? "employees" : "empleados"} × ${formatUsd(plan.monthlyUsd!)}`);
        expect(row.html).toContain(`<td class="py-3">${label[plan.autoScheduling]}</td>`);
      });
      expect(deputyQuotes.map((q) => q.monthlyUsd)).toEqual([214.5, 282.75, 390]);
      expect(rows.find((r) => r.highlighted)!.html).toContain("Core");
      expect(rows.find((r) => r.highlighted)!.html).toContain("$282.75");
    });

    it("states Deputy's per-user pricing and $30 minimum in the example", () => {
      const ex = example(html);
      expect(ex).toContain(`$${deputy.plans[0].minimumMonthlyUsd}`);
    });

    it("links every tool's pricing page", () => {
      for (const tool of Object.values(TOOLS)) {
        const href = tool.pricingUrl.startsWith("/") ? `href="${tool.pricingUrl}"` : `href="${tool.pricingUrl}"`;
        expect(html, tool.id).toContain(href);
      }
      expect(html).not.toContain('href="/es/pricing"');
    });

    it("has FAQPage JSON-LD with Deputy prices from the data module, and the hero qualifier", () => {
      expect(html).toContain('"@type":"FAQPage"');
      expect(html).toContain(copy.alternatives.heroQualifier);
      const faq = faqText(html);
      for (const p of deputy.plans) expect(faq).toContain(price(p.monthlyUsd));
      for (const q of deputyQuotes) expect(faq).toContain(price(q.monthlyUsd)); // prose uses $390, the table $390.00
      expect(faq).toContain(locale === "en" ? "30 or more locations" : "30 o más ubicaciones");
      expect(faq).toContain(locale === "en" ? "Company Settings" : "Configuración de la empresa");
      expect(faq).not.toMatch(/[{}]/);
    });

    it("links the Deputy compare page in its own locale", () => {
      expect(html).toContain(locale === "en" ? 'href="/compare/deputy"' : 'href="/es/compare/deputy"');
    });

    it("states the one-user-per-employee assumption wherever the FAQ JSON-LD gives a Deputy user count", () => {
      const users = DEFAULT_TEAM.locations * DEFAULT_TEAM.employeesPerLocation;
      const word = locale === "en" ? "users" : "usuarios";
      const assumption = locale === "en" ? "counting one user per employee" : "si contamos un usuario por empleado";
      const answers = faqText(html).split("\n").filter((line) => line.includes(`${users} ${word}`));
      expect(answers.length).toBeGreaterThan(0);
      for (const a of answers) expect(a).toContain(assumption);
    });

    it("leaves no unfilled {placeholder}", () => {
      expect(visible(html)).not.toMatch(/\{[a-zA-Z]+\}/);
    });
  });
}

describe("alternatives data fields", () => {
  async function renderWithout(mutate: () => () => void) {
    const restore = mutate();
    try {
      const renderers = await loadRenderers([getContainerRenderer()]);
      const c = await AstroContainer.create({ renderers });
      return await c.renderToString(Alternatives, { props: { locale: "en", focus: "deputy" } });
    } finally {
      restore();
    }
  }

  it("fails the render when a Deputy field the copy needs is missing", async () => {
    const core = TOOLS.deputy.plans.find((p) => p.name === "Core")!;
    await expect(
      renderWithout(() => {
        const saved = core.minimumMonthlyUsd;
        delete core.minimumMonthlyUsd;
        return () => (core.minimumMonthlyUsd = saved);
      }),
    ).rejects.toThrow("missing Deputy minimumMonthlyUsd");
  });

  it("fails the render when a 7shifts field the copy needs is missing", async () => {
    const comp = TOOLS["7shifts"].plans.find((p) => p.name === "Comp")!;
    await expect(
      renderWithout(() => {
        const saved = comp.maxEmployeesPerLocation;
        delete comp.maxEmployeesPerLocation;
        return () => (comp.maxEmployeesPerLocation = saved);
      }),
    ).rejects.toThrow("missing 7shifts Comp maxEmployeesPerLocation");
  });
});
