// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/react/container-renderer";
import Compare from "../../src/views/Compare.astro";
import enCopy from "../../src/i18n/en";
import esCopy from "../../src/i18n/es";
import { compareSchema } from "../../src/lib/compareSchema";
import { COMPARE_PATHS, DEFAULT_TEAM, TOOLS, formatUsd, planRange, quotePlans } from "../../src/data/competitors";

let en = "";
let es = "";

// Content collections need a synced data store, which `npm test` can't count on,
// so the entry comes through Astro's own markdown import and the collection schema.
const MARKDOWN = import.meta.glob("../../src/content/compare/*/*.md", { eager: true }) as Record<
  string,
  { frontmatter: unknown; compiledContent: () => string | Promise<string> }
>;
async function entry(locale: string, slug: string) {
  const md = MARKDOWN[`../../src/content/compare/${locale}/${slug}.md`];
  if (!md) throw new Error(`no markdown for ${locale}/${slug}`);
  return { data: compareSchema.parse(md.frontmatter), html: await md.compiledContent() };
}

beforeAll(async () => {
  const renderers = await loadRenderers([getContainerRenderer()]);
  const c = await AstroContainer.create({ renderers });
  en = await c.renderToString(Compare, { props: { locale: "en", slug: "7shifts", entry: await entry("en", "7shifts") } });
  es = await c.renderToString(Compare, { props: { locale: "es", slug: "7shifts", entry: await entry("es", "7shifts") } });
});

/** Page markup without scripts, styles or the island's serialized props. */
function visible(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, "")
    .replace(/<astro-island[^>]*>/g, "<astro-island>");
}

/** The calculator island's server-rendered markup only. */
function island(html: string): string {
  const m = html.match(/<astro-island[^>]*>([\s\S]*?)<\/astro-island>/);
  expect(m, "calculator island missing").not.toBeNull();
  return m![1];
}

/** The page without the calculator, so a price check can't pass on the island alone. */
function outsideIsland(html: string): string {
  return visible(html).replace(/<astro-island>[\s\S]*?<\/astro-island>/g, "");
}

/** The data-driven pricing table. */
function pricing(html: string): string {
  const m = html.match(/<table[^>]*data-pricing-table[^>]*>([\s\S]*?)<\/table>/);
  expect(m, "pricing table missing").not.toBeNull();
  return m![1];
}

/** FAQ questions and answers as published in the FAQPage JSON-LD. */
function faqText(html: string): string {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(m, "FAQPage JSON-LD missing").not.toBeNull();
  const data = JSON.parse(m![1]) as { "@type": string; mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
  expect(data["@type"]).toBe("FAQPage");
  return data.mainEntity.map((e) => `${e.name}\n${e.acceptedAnswer.text}`).join("\n");
}

const s7 = TOOLS["7shifts"];
const pro = s7.plans.find((p) => p.name === "Pro")!;
const pick = quotePlans(s7, DEFAULT_TEAM).find((q) => q.highlighted)!;
const wizProUsd = TOOLS.wiz.plans.find((x) => x.name === "Pro")!.monthlyUsd!;
/** Each 7shifts tier with its total for DEFAULT_TEAM: the price if it fits, else what the tier would cost. */
const s7Totals = quotePlans(s7, DEFAULT_TEAM).map((q, i) => ({
  plan: s7.plans[i],
  fits: q.fits,
  total: q.fits ? q.monthlyUsd : q.wouldBeUsd,
}));

/** The worked-example paragraph in the markdown body. */
function exampleParagraph(html: string, lead: string): string {
  const para = [...outsideIsland(html).matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]).find((x) => x.startsWith(lead));
  expect(para, "worked example paragraph missing").toBeDefined();
  return para!.replaceAll("&#39;", "'");
}

const pages = [
  {
    locale: "en" as const,
    html: () => en,
    qualifier: enCopy.alternatives.heroQualifier,
    settings: "Company Settings",
    oldRest: "11-hour rest rule on every plan",
    alternatives: 'href="/compare/7shifts-alternatives"',
    fairWorkweek: "7shifts and Deputy do more",
    notImported: "Preferences and coworker relationships are not imported",
    perLocationRange: "31–60 per location",
    exampleLead: "Take 3 locations with 13 employees each.",
  },
  {
    locale: "es" as const,
    html: () => es,
    qualifier: esCopy.alternatives.heroQualifier,
    settings: "Configuración de la empresa",
    oldRest: "Regla de 11 horas de descanso en todos los planes",
    alternatives: 'href="/es/compare/7shifts-alternatives"',
    fairWorkweek: "7shifts y Deputy hacen más",
    notImported: "Las preferencias y las relaciones entre compañeros no se importan",
    perLocationRange: "31–60 por ubicación",
    exampleLead: "Pongamos 3 ubicaciones con 13 empleados cada una.",
  },
];

for (const p of pages) {
  describe(`/compare/7shifts (${p.locale})`, () => {
    it("names the product Wiz Scheduler, never WizScheduler", () => {
      expect(p.html()).toContain("Wiz Scheduler");
      expect(p.html()).not.toContain("WizScheduler");
    });

    it("targets 7shifts pricing in the title", () => {
      const title = p.html().match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
      expect(title.toLowerCase()).toMatch(/7shifts (pricing|precios)|precios de 7shifts/);
    });

    it("has FAQPage JSON-LD with at least five questions, and the hero qualifier", () => {
      expect(p.html()).toContain('"@type":"FAQPage"');
      expect(faqText(p.html()).split("\n").length).toBeGreaterThanOrEqual(10);
      expect(visible(p.html())).toContain(p.qualifier);
      expect(p.qualifier).toContain(p.settings);
    });

    it("answers how employees send preferences with the Company Settings wording", () => {
      expect(faqText(p.html())).toContain(p.settings);
    });

    it("server-renders the calculator, showing a static $149.97", () => {
      expect(island(p.html())).toContain("$149.97");
      expect(island(p.html())).toContain(">7shifts</caption>");
      expect(island(p.html())).toContain(">Wiz Scheduler</caption>");
    });

    it("prices the per-location example in the copy from the data module", () => {
      const body = outsideIsland(p.html());
      expect(body).toContain(formatUsd(pick.monthlyUsd!)); // $149.97 on Essentials
      expect(body).toContain(formatUsd(pro.monthlyUsd! * DEFAULT_TEAM.locations)); // $299.97 on Pro
      expect(body).toContain(p.perLocationRange);
    });

    it("names every 7shifts tier in the worked example with its total for 3 locations", () => {
      const para = exampleParagraph(p.html(), p.exampleLead);
      const paid = s7Totals.filter((x) => x.total !== null && x.total > 0);
      expect(paid.map((x) => x.total)).toEqual([149.97, 449.97, 299.97, 599.97]);
      expect(paid.filter((x) => x.fits).map((x) => x.total)).toEqual([149.97, 449.97]);
      for (const x of paid) {
        expect(para).toContain(x.plan.name);
        expect(para).toContain(formatUsd(x.total!));
      }
      expect(para).toContain("Comp");
      expect(para).toContain(`$${wizProUsd} `);
      const faq = faqText(p.html());
      for (const x of paid) expect(faq).toContain(formatUsd(x.total!));
    });

    it("links Wiz Scheduler's /pricing page (same href in every locale) next to the pricing table", () => {
      const m = p.html().match(/<p[^>]*data-pricing-sources[^>]*>([\s\S]*?)<\/p>/);
      expect(m, "pricing sources missing").not.toBeNull();
      expect(m![1]).toContain('href="/pricing"');
      expect(m![1]).toContain(`href="${s7.pricingUrl}"`);
      expect(p.html()).not.toContain('href="/es/pricing"');
    });

    it("formats Wiz Pro's price one way outside the calculator", () => {
      expect(pricing(p.html())).toContain(`$${wizProUsd} `);
      expect(outsideIsland(p.html())).not.toContain(formatUsd(wizProUsd));
    });

    it("lists every 7shifts tier with its headcount range and price, plus Wiz Scheduler's plans", () => {
      const table = pricing(p.html());
      for (const plan of s7.plans) {
        expect(table).toContain(planRange(plan, p.locale)!);
        if (plan.monthlyUsd) expect(table).toContain(formatUsd(plan.monthlyUsd));
      }
      const rows = [...table.matchAll(/<tr[^>]*data-plan[^>]*>/g)];
      expect(rows).toHaveLength(s7.plans.length + TOOLS.wiz.plans.length);
      expect(table).toContain(`$${wizProUsd} `);
    });

    it("drops the old every-plan rest claim and is honest about Fair Workweek", () => {
      expect(p.html()).not.toContain(p.oldRest);
      expect(visible(p.html())).toContain(p.fairWorkweek);
    });

    it("says what the 7shifts importer leaves behind", () => {
      expect(visible(p.html())).toContain(p.notImported);
    });

    it("links the other compare pages in its own locale", () => {
      expect(p.html()).toContain(p.alternatives);
      for (const path of COMPARE_PATHS.filter((x) => x !== "/compare/7shifts")) {
        const href = p.locale === "en" ? path : `/es${path}`;
        expect(p.html()).toContain(`href="${href}"`);
      }
    });

    it("leaves no unfilled {placeholder}", () => {
      expect(visible(p.html())).not.toMatch(/\{[a-zA-Z0-9]+\}/);
      expect(faqText(p.html())).not.toMatch(/[{}]/);
      expect(p.html().match(/<title>([^<]*)<\/title>/)?.[1]).not.toMatch(/[{}]/);
      expect(p.html()).not.toMatch(/<meta name="description" content="[^"]*[{}]/);
    });
  });
}

describe("placeholder filling", () => {
  it("fails the render on a placeholder the data module can't fill", async () => {
    const renderers = await loadRenderers([getContainerRenderer()]);
    const c = await AstroContainer.create({ renderers });
    const base = await entry("en", "7shifts");
    const broken = { ...base, data: { ...base.data, title: "7shifts {noSuchField}" } };
    await expect(c.renderToString(Compare, { props: { locale: "en", slug: "7shifts", entry: broken } })).rejects.toThrow(
      "no value for {noSuchField}",
    );
  });
});

describe("/compare/7shifts (es)", () => {
  it("is Spanish and links English pricing (there is no /es/pricing)", () => {
    expect(es).toMatch(/<html[^>]*lang="es"/);
    expect(es).not.toContain('href="/es/pricing"');
  });
});

const deputy = TOOLS.deputy;
/** Each Deputy plan with its total for DEFAULT_TEAM (Deputy charges per user). */
const deputyTotals = quotePlans(deputy, DEFAULT_TEAM).map((q, i) => ({ ...q, plan: deputy.plans[i] }));
const deputyMinimum = deputy.plans[0].minimumMonthlyUsd!;

const deputyPages = [
  {
    locale: "en" as const,
    qualifier: enCopy.alternatives.heroQualifier,
    settings: "Company Settings",
    eyebrow: "Compare with Deputy",
    alternatives: 'href="/compare/deputy-alternatives"',
    fairWorkweek: "Deputy has the most complete NYC Fair Workweek support",
    threshold: "30 or more locations",
    retail: "20 or more employees",
    skill: "skill level 1",
    adjust: "roles and skill levels before you generate",
    notImported: "Preferences and coworker relationships are not imported",
    minimum: `${usd(deputyMinimum)} monthly minimum`,
    exampleLead: "Take 3 locations with 13 employees each.",
    assumption: "counting one user per employee",
  },
  {
    locale: "es" as const,
    qualifier: esCopy.alternatives.heroQualifier,
    settings: "Configuración de la empresa",
    eyebrow: "Comparar con Deputy",
    alternatives: 'href="/es/compare/deputy-alternatives"',
    fairWorkweek: "Deputy tiene el soporte de Fair Workweek de Nueva York más completo",
    threshold: "30 o más ubicaciones",
    retail: "20 o más empleados",
    skill: "nivel de habilidad 1",
    adjust: "ajusta los roles y los niveles de habilidad de cada empleado",
    notImported: "Las preferencias y las relaciones entre compañeros no se importan",
    minimum: `mínimo de ${usd(deputyMinimum)} al mes`,
    exampleLead: "Pongamos 3 ubicaciones con 13 empleados cada una.",
    assumption: "si contamos un usuario por empleado",
  },
];

function usd(n: number): string {
  return Number.isInteger(n) ? `$${n}` : formatUsd(n);
}

for (const p of deputyPages) {
  describe(`/compare/deputy (${p.locale})`, () => {
    let html = "";
    beforeAll(async () => {
      const renderers = await loadRenderers([getContainerRenderer()]);
      const c = await AstroContainer.create({ renderers });
      html = await c.renderToString(Compare, {
        props: { locale: p.locale, slug: "deputy", entry: await entry(p.locale, "deputy") },
      });
    });

    it("names the product Wiz Scheduler and targets Deputy pricing in the title", () => {
      expect(html).toContain("Wiz Scheduler");
      expect(html).not.toContain("WizScheduler");
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
      expect(title.toLowerCase()).toMatch(/deputy pricing|precios de deputy/);
    });

    it("has its own hero eyebrow, not the 7shifts one", () => {
      const hero = visible(html).match(/<section[^>]*>([\s\S]*?)<\/section>/)![1];
      expect(hero).toContain(p.eyebrow);
      expect(hero).not.toContain("7shifts");
    });

    it("has FAQPage JSON-LD with at least five questions, the hero qualifier and the Company Settings wording", () => {
      expect(html).toContain('"@type":"FAQPage"');
      expect(faqText(html).split("\n").length).toBeGreaterThanOrEqual(10);
      expect(visible(html)).toContain(p.qualifier);
      expect(faqText(html)).toContain(p.settings);
    });

    it("prices every Deputy plan for 3 locations from the data module, $282.75 on Core", () => {
      expect(deputyTotals.map((x) => x.monthlyUsd)).toEqual([214.5, 282.75, 390]);
      expect(deputyTotals.find((x) => x.highlighted)?.plan.name).toBe("Core");
      const para = exampleParagraph(html, p.exampleLead);
      const faq = faqText(html);
      for (const x of deputyTotals) {
        expect(para).toContain(x.plan.name);
        expect(para).toContain(usd(x.monthlyUsd!)); // $214.50, $282.75, $390: one format outside the calculator
        expect(faq).toContain(usd(x.monthlyUsd!));
      }
      expect(outsideIsland(html)).toContain("$282.75");
    });

    it("lists Lite, Core and Pro per user with auto-scheduling marked and the $30 minimum", () => {
      const table = pricing(html);
      const rows = [...table.matchAll(/<tr[^>]*data-plan[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => r[1]);
      expect(rows).toHaveLength(deputy.plans.length + TOOLS.wiz.plans.length);
      const copy = p.locale === "en" ? enCopy : esCopy;
      const label = { yes: copy.calculator.autoYes, no: copy.calculator.autoNo, beta: copy.calculator.autoBeta };
      for (const plan of deputy.plans) {
        const row = rows.find((r) => r.includes(`Deputy ${plan.name}`));
        expect(row, plan.name).toBeDefined();
        expect(row).toContain(usd(plan.monthlyUsd!));
        expect(row).toContain(p.minimum);
        expect(row).toContain(`<td>${label[plan.autoScheduling]}</td>`);
      }
      expect(table).not.toContain(copy.compare.allLocations.replace("{price}", usd(deputy.plans[0].monthlyUsd!)));
    });

    it("server-renders the calculator with Deputy at $282.75", () => {
      expect(island(html)).toContain("$282.75");
      expect(island(html)).toContain(">Deputy</caption>");
    });

    it("links Wiz Scheduler's and Deputy's pricing pages, and every Deputy source", () => {
      const m = html.match(/<p[^>]*data-pricing-sources[^>]*>([\s\S]*?)<\/p>/);
      expect(m![1]).toContain('href="/pricing"');
      expect(m![1]).toContain(`href="${deputy.pricingUrl}"`);
      for (const s of deputy.sources) expect(html).toContain(`href="${s.href}"`);
      expect(html).not.toContain('href="/es/pricing"');
    });

    it("says plainly that Deputy is stronger on Fair Workweek, with its 30-location fast-food threshold", () => {
      const text = visible(html);
      expect(text).toContain(p.fairWorkweek);
      expect(text).toContain(p.threshold);
      expect(text).toContain(p.retail);
    });

    it("explains the Deputy importer: every role at skill level 1, then adjust", () => {
      const text = visible(html);
      expect(text).toContain(p.skill);
      expect(text).toContain(p.adjust);
      expect(text).toContain(p.notImported);
    });

    it("links the other compare pages in its own locale", () => {
      expect(html).toContain(p.alternatives);
      for (const path of COMPARE_PATHS.filter((x) => x !== "/compare/deputy")) {
        const href = p.locale === "en" ? path : `/es${path}`;
        expect(html).toContain(`href="${href}"`);
      }
    });

    it("states the one-user-per-employee assumption wherever the FAQ JSON-LD gives a Deputy user count", () => {
      const users = DEFAULT_TEAM.locations * DEFAULT_TEAM.employeesPerLocation;
      const word = p.locale === "en" ? "users" : "usuarios";
      const answers = faqText(html).split("\n").filter((line) => line.includes(`${users} ${word}`));
      expect(answers.length).toBeGreaterThan(0);
      for (const a of answers) expect(a).toContain(p.assumption);
    });

    it("leaves no unfilled {placeholder}", () => {
      expect(visible(html)).not.toMatch(/\{[a-zA-Z0-9]+\}/);
      expect(faqText(html)).not.toMatch(/[{}]/);
      expect(html).not.toMatch(/<meta name="description" content="[^"]*[{}]/);
    });
  });
}

describe("compare paths", () => {
  it("lists the Deputy pages", () => {
    expect(COMPARE_PATHS).toContain("/compare/deputy");
    expect(COMPARE_PATHS).toContain("/compare/deputy-alternatives");
  });
});

const homebase = TOOLS.homebase;
const wheniwork = TOOLS.wheniwork;
const homebaseQuotes = quotePlans(homebase, DEFAULT_TEAM).map((q, i) => ({ ...q, plan: homebase.plans[i] }));
const wiwQuotes = quotePlans(wheniwork, DEFAULT_TEAM).map((q, i) => ({ ...q, plan: wheniwork.plans[i] }));
const defaultUsers = DEFAULT_TEAM.locations * DEFAULT_TEAM.employeesPerLocation;

const shortPages = [
  {
    slug: "homebase",
    tool: homebase,
    quotes: homebaseQuotes,
    locale: "en" as const,
    titleRe: /homebase pricing/,
    eyebrow: "Compare with Homebase",
    settings: "Company Settings",
    qualifier: enCopy.alternatives.heroQualifier,
    marketing: "Homebase's marketing says",
    marketingFull: "uses availability and preferred shifts",
    essentialsNoAuto: "Essentials has no auto-scheduling",
    promo: "$0 promotion",
    assumption: null as string | null,
  },
  {
    slug: "homebase",
    tool: homebase,
    quotes: homebaseQuotes,
    locale: "es" as const,
    titleRe: /precios de homebase/,
    eyebrow: "Comparar con Homebase",
    settings: "Configuración de la empresa",
    qualifier: esCopy.alternatives.heroQualifier,
    marketing: "publicidad de Homebase dice",
    marketingFull: "usa la disponibilidad y los turnos preferidos",
    essentialsNoAuto: "Essentials no tiene programación automática",
    promo: "promoción de $0",
    assumption: null as string | null,
  },
  {
    slug: "when-i-work",
    tool: wheniwork,
    quotes: wiwQuotes,
    locale: "en" as const,
    titleRe: /when i work pricing/,
    eyebrow: "Compare with When I Work",
    settings: "Company Settings",
    qualifier: enCopy.alternatives.heroQualifier,
    marketing: "70%",
    marketingFull: "preferred availability",
    essentialsNoAuto: "no coworker preferences",
    promo: "",
    assumption: "counting one user per employee",
  },
  {
    slug: "when-i-work",
    tool: wheniwork,
    quotes: wiwQuotes,
    locale: "es" as const,
    titleRe: /precios de when i work/,
    eyebrow: "Comparar con When I Work",
    settings: "Configuración de la empresa",
    qualifier: esCopy.alternatives.heroQualifier,
    marketing: "70%",
    marketingFull: "disponibilidad preferida",
    essentialsNoAuto: "no tiene preferencias de compañeros",
    promo: "",
    assumption: "si contamos un usuario por empleado",
  },
];

for (const p of shortPages) {
  describe(`/compare/${p.slug} (${p.locale})`, () => {
    let html = "";
    beforeAll(async () => {
      const renderers = await loadRenderers([getContainerRenderer()]);
      const c = await AstroContainer.create({ renderers });
      html = await c.renderToString(Compare, {
        props: { locale: p.locale, slug: p.slug, entry: await entry(p.locale, p.slug) },
      });
    });

    it("names the product Wiz Scheduler, targets the pricing search and has its own eyebrow", () => {
      expect(html).toContain("Wiz Scheduler");
      expect(html).not.toContain("WizScheduler");
      expect((html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "").toLowerCase()).toMatch(p.titleRe);
      expect(visible(html).match(/<section[^>]*>([\s\S]*?)<\/section>/)![1]).toContain(p.eyebrow);
    });

    it("has FAQPage JSON-LD with at least three questions, the hero qualifier and the Company Settings wording", () => {
      expect(html).toContain('"@type":"FAQPage"');
      expect(faqText(html).split("\n").length).toBeGreaterThanOrEqual(6);
      expect(visible(html)).toContain(p.qualifier);
      expect(faqText(html)).toContain(p.settings);
    });

    it("shows every plan with its range, the fitting ones priced and the highlighted one auto-scheduling", () => {
      const rows = [...pricing(html).matchAll(/<tr[^>]*data-plan[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => r[1]);
      expect(rows).toHaveLength(p.tool.plans.length + TOOLS.wiz.plans.length);
      for (const plan of p.tool.plans) {
        const row = rows.find((r) => r.includes(`${p.tool.name} ${plan.name}`));
        expect(row, plan.name).toBeDefined();
        const range = planRange(plan, p.locale);
        if (range) expect(row).toContain(range);
        else expect(row).toMatch(/<td>[^<]+<\/td>\s*<td>/); // never an empty size cell
        if (plan.monthlyUsd) expect(row).toContain(usd(plan.monthlyUsd));
      }
      expect(p.quotes.filter((q) => q.highlighted)).toHaveLength(1);
    });

    it("server-renders the calculator for this tool", () => {
      expect(island(html)).toContain(`>${p.tool.name}</caption>`);
      const hl = p.quotes.find((q) => q.highlighted)!;
      expect(island(html)).toContain(formatUsd(hl.monthlyUsd!));
    });

    it("leaves no unfilled {placeholder} and links the other compare pages in its own locale", () => {
      expect(visible(html)).not.toMatch(/\{[a-zA-Z0-9]+\}/);
      expect(faqText(html)).not.toMatch(/[{}]/);
      for (const path of COMPARE_PATHS.filter((x) => x !== `/compare/${p.slug}`)) {
        expect(html).toContain(`href="${p.locale === "en" ? path : `/es${path}`}"`);
      }
    });

    it("states the one-user-per-employee assumption wherever any copy or FAQ answer gives a user count", () => {
      const word = p.locale === "en" ? "users" : "usuarios";
      const lines = [
        ...faqText(html).split("\n"),
        ...[...outsideIsland(html).matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]),
      ].filter((l) => l.includes(`${defaultUsers} ${word}`));
      if (!p.assumption) return expect(lines).toHaveLength(0);
      expect(lines.length).toBeGreaterThan(0);
      for (const l of lines) expect(l).toContain(p.assumption);
    });
  });
}

describe("/compare/homebase", () => {
  const find = (n: string) => homebaseQuotes.find((q) => q.plan.name === n)!;
  it("prices Plus at $210.00 for the default team and highlights it; Basic does not fit", () => {
    expect(find("Plus").monthlyUsd).toBe(210);
    expect(find("Plus").highlighted).toBe(true);
    expect(find("Basic").fits).toBe(false);
  });

  for (const [locale, p] of [["en", shortPages[0]], ["es", shortPages[1]]] as const) {
    describe(locale, () => {
      let html = "";
      beforeAll(async () => {
        const renderers = await loadRenderers([getContainerRenderer()]);
        const c = await AstroContainer.create({ renderers });
        html = await c.renderToString(Compare, { props: { locale, slug: "homebase", entry: await entry(locale, "homebase") } });
      });

      it("shows every plan's total for 3 locations in the copy and the FAQ, Plus at $210.00", () => {
        const body = outsideIsland(html);
        expect(body).toContain("$210.00");
        expect(faqText(html)).toContain("$210.00");
        const para = exampleParagraph(html, locale === "en" ? "Take 3 locations" : "Pongamos 3 ubicaciones");
        for (const n of ["Essentials", "Plus", "All-in-One"]) expect(para).toContain(n);
        expect(para).toContain("$90.00");
        expect(para).toContain("$360.00");
        expect(para).toContain("Basic");
        expect(para).toContain(`$${wizProUsd} `);
      });

      it("says Essentials has no auto-scheduling and mentions the $0 promo without counting it", () => {
        const text = visible(html).replaceAll("&#39;", "'");
        expect(text).toContain(p.essentialsNoAuto);
        expect(text).toContain(p.promo);
        expect(faqText(html)).toContain(p.essentialsNoAuto);
      });

      it("attributes the availability-and-preferred-shifts claim to Homebase's marketing", () => {
        const sentences = (visible(html) + "\n" + faqText(html)).replaceAll("&#39;", "'").replaceAll("’", "'").split(/(?<=[.!?])\s+/);
        const hits = sentences.filter((s) => s.includes(p.marketingFull));
        expect(hits.length).toBeGreaterThan(0);
        for (const s of hits) expect(s).toContain(p.marketing);
      });
    });
  }
});

describe("/compare/when-i-work", () => {
  it("prices Multiple locations at $195.00 for the default team (39 users) and highlights it", () => {
    const multi = wiwQuotes.find((q) => q.plan.name === "Multiple locations")!;
    expect(multi.monthlyUsd).toBe(195);
    expect(multi.highlighted).toBe(true);
  });

  for (const [locale, p] of [["en", shortPages[2]], ["es", shortPages[3]]] as const) {
    describe(locale, () => {
      let html = "";
      beforeAll(async () => {
        const renderers = await loadRenderers([getContainerRenderer()]);
        const c = await AstroContainer.create({ renderers });
        html = await c.renderToString(Compare, { props: { locale, slug: "when-i-work", entry: await entry(locale, "when-i-work") } });
      });

      it("prices the default team at $195.00 outside the calculator and in the FAQ, with the per-user assumption beside it", () => {
        expect(outsideIsland(html)).toContain("$195.00");
        const line = faqText(html).split("\n").find((l) => l.includes("$195.00"))!;
        expect(line).toContain(p.assumption!);
      });

      it("says it uses preferred availability (70% overlap, max hours) but has no coworker preferences", () => {
        const text = visible(html).replaceAll("&#39;", "'");
        expect(text).toContain("70%");
        expect(text).toContain(p.marketingFull);
        expect(text.toLowerCase()).toContain(p.essentialsNoAuto);
        expect(faqText(html).toLowerCase()).toContain(p.essentialsNoAuto);
      });
    });
  }
});

describe("compare paths (Homebase and When I Work)", () => {
  it("lists the Homebase and When I Work pages, each labelled in en and es", () => {
    for (const path of ["/compare/homebase", "/compare/when-i-work"]) {
      expect(COMPARE_PATHS).toContain(path);
      expect((enCopy.compare.pages as Record<string, string>)[path]).toBeTruthy();
      expect((esCopy.compare.pages as Record<string, string>)[path]).toBeTruthy();
    }
  });
});
