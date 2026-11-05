// @vitest-environment node
import { existsSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/react/container-renderer";
import Roundup from "../../src/views/Roundup.astro";
import enCopy from "../../src/i18n/en";
import esCopy from "../../src/i18n/es";
import { COMPARE_PATHS, DEFAULT_TEAM, TOOLS, formatUsd, planLabel, planRange, quotePlans, type ToolId } from "../../src/data/competitors";

const PATH = "/best-scheduling-apps-nyc-restaurants";
const ORDER: ToolId[] = ["wiz", "7shifts", "deputy", "homebase", "wheniwork"];
const users = DEFAULT_TEAM.locations * DEFAULT_TEAM.employeesPerLocation;
const helpArticle = TOOLS.deputy.sources.find((s) => s.label.en === "Deputy Fair Workweek")!.href;

const L = {
  en: {
    locale: "en" as const,
    prefix: "",
    bestForWiz: "best for teams that want employees to have a say",
    settings: "Company Settings",
    assumption: "counting one user per employee",
    usersWord: "users",
    perLocation: `${DEFAULT_TEAM.employeesPerLocation} employees per location`,
    beta: "beta",
    fast: "30 or more locations nationwide",
    retail: "20 or more employees",
    notLegal: "not legal advice",
    monthly: "monthly billing",
    excluded: "taxes, add-ons and annual discounts",
    cheapest: "cheapest plan with auto-scheduling",
    stronger: "Deputy",
    farStronger: "far stronger",
    limits: "no notice tracking and no premium tracking",
    promo: "not counted",
  },
  es: {
    locale: "es" as const,
    prefix: "/es",
    bestForWiz: "ideal para equipos que quieren que los empleados tengan voz en su horario",
    settings: "Configuración de la empresa",
    assumption: "si contamos un usuario por empleado",
    usersWord: "usuarios",
    perLocation: `${DEFAULT_TEAM.employeesPerLocation} empleados por ubicación`,
    beta: "beta",
    fast: "30 o más ubicaciones en todo el país",
    retail: "20 o más empleados",
    notLegal: "no es asesoría legal",
    monthly: "facturación mensual",
    excluded: "impuestos, complementos ni descuentos anuales",
    cheapest: "plan más barato con programación automática",
    stronger: "Deputy",
    farStronger: "mucho más completo",
    limits: "sin seguimiento de avisos ni de primas",
    promo: "no se cuenta",
  },
};

const html: Record<string, string> = {};
beforeAll(async () => {
  const renderers = await loadRenderers([getContainerRenderer()]);
  const c = await AstroContainer.create({ renderers });
  for (const l of ["en", "es"] as const) html[l] = await c.renderToString(Roundup, { props: { locale: l } });
});

function visible(h: string): string {
  return h.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, "");
}
function plain(h: string): string {
  return visible(h).replace(/<[^>]+>/g, " ").replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");
}
function section(h: string, id: string): string {
  const m = h.match(new RegExp(`<section[^>]*data-tool="${id}"[^>]*>([\\s\\S]*?)</section>`));
  expect(m, `section for ${id} missing`).not.toBeNull();
  return m![1];
}
function faq(h: string): { name: string; text: string }[] {
  const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(m, "FAQPage JSON-LD missing").not.toBeNull();
  const data = JSON.parse(m![1]);
  expect(data["@type"]).toBe("FAQPage");
  return data.mainEntity.map((e: any) => ({ name: e.name, text: e.acceptedAnswer.text }));
}
const sentences = (s: string) => s.split(/(?<=[.!?])\s+/);
const total = (id: ToolId) => formatUsd(quotePlans(TOOLS[id], DEFAULT_TEAM).find((q) => q.highlighted)!.monthlyUsd!);
const planName = (id: ToolId, locale: "en" | "es" = "en") =>
  planLabel(quotePlans(TOOLS[id], DEFAULT_TEAM).find((q) => q.highlighted)!.plan, locale);

describe("roundup page files", () => {
  it("exist in en and es and are listed in COMPARE_PATHS", () => {
    expect(existsSync("src/pages/best-scheduling-apps-nyc-restaurants.astro")).toBe(true);
    expect(existsSync("src/pages/es/best-scheduling-apps-nyc-restaurants.astro")).toBe(true);
    expect(COMPARE_PATHS).toContain(PATH);
  });
});

for (const l of Object.values(L)) {
  describe(`roundup (${l.locale})`, () => {
    const page = () => html[l.locale];

    it("lists all five tools in the decided order", () => {
      const idx = ORDER.map((id) => page().indexOf(`data-tool="${id}"`));
      for (const i of idx) expect(i).toBeGreaterThan(-1);
      expect([...idx].sort((a, b) => a - b)).toEqual(idx);
      for (const id of ORDER) expect(section(page(), id)).toContain(TOOLS[id].name);
    });

    it("gives every tool a best-for line, and never calls one the best overall", () => {
      for (const id of ORDER) expect(section(page(), id)).toMatch(/data-best-for/);
      expect(plain(section(page(), "wiz"))).toContain(l.bestForWiz);
      expect(plain(page())).not.toMatch(/the best (overall|scheduling app)|la mejor (opción|app) (en general|de todas)/i);
    });

    it("qualifies the Wiz Scheduler 'say' with managers entering preferences and Company Settings", () => {
      const wiz = plain(section(page(), "wiz"));
      expect(wiz).toContain(l.settings);
      expect(wiz).toMatch(l.locale === "en" ? /managers can enter preferences for everyone/i : /gerentes pueden ingresar las preferencias de todos/i);
    });

    it("shows each tool's highlighted plan and monthly total from the data", () => {
      for (const id of ORDER) {
        const s = plain(section(page(), id));
        expect(s).toContain(planName(id, l.locale));
        expect(s).toContain(total(id));
      }
      const table = page().match(/<table[^>]*data-price-table[^>]*>([\s\S]*?)<\/table>/);
      expect(table, "price table missing").not.toBeNull();
      for (const id of ORDER) expect(plain(table![1])).toContain(total(id));
      const caption = plain(table![1].match(/<caption[^>]*>([\s\S]*?)<\/caption>/)?.[1] ?? "");
      expect(caption).toContain(l.assumption);
      expect(caption).toContain(`${users} ${l.usersWord}`);
      const rows = table![1].match(/<tr[\s\S]*?<\/tr>/g)!.map(plain);
      for (const id of ["deputy", "wheniwork"] as const) {
        const row = rows.find((x) => x.includes(total(id)));
        expect(row, `${id} row`).toBeDefined();
        expect(caption).toContain(TOOLS[id].name);
      }
    });

    it("lists every plan of every tool with its range, price and fit, marking the highlighted plan", () => {
      const table = page().match(/<table[^>]*data-price-table[^>]*>([\s\S]*?)<\/table>/)![1];
      const rows = table.match(/<tr[^>]*data-fits[\s\S]*?<\/tr>/g)!;
      expect(rows).toHaveLength(ORDER.reduce((n, id) => n + TOOLS[id].plans.length, 0));
      const highlightedLabel = (l.locale === "en" ? enCopy : esCopy).calculator.highlightedLabel;
      let at = 0;
      for (const id of ORDER) {
        const quotes = quotePlans(TOOLS[id], DEFAULT_TEAM);
        TOOLS[id].plans.forEach((plan, i) => {
          const q = quotes[i];
          const row = rows[at++];
          const text = plain(row);
          expect(text, `${id} ${plan.name}`).toContain(`${TOOLS[id].name} ${planLabel(plan.name, l.locale)}`);
          const range = planRange(plan, l.locale);
          if (range) expect(text).toContain(range);
          expect(row).toContain(`data-fits="${q.fits}"`);
          const shown = q.fits ? q.monthlyUsd : q.wouldBeUsd;
          if (shown !== null) expect(text).toContain(formatUsd(shown));
          if (!q.fits) expect(text).toContain((l.locale === "en" ? enCopy : esCopy).calculator.doesNotFit);
          if (q.highlighted) expect(text).toContain(highlightedLabel);
          else expect(text).not.toContain(highlightedLabel);
        });
      }
    });

    it("states the 7shifts headcount per location and that its auto-scheduler is a beta", () => {
      const s = plain(section(page(), "7shifts"));
      expect(s).toContain(l.perLocation);
      expect(s).toContain(l.beta);
    });

    it("attaches the one-user-per-employee assumption to every user count and total, page text and JSON-LD", () => {
      const text = plain(page());
      const withCount = sentences(text).filter((x) => x.includes(`${users} ${l.usersWord}`));
      expect(withCount.length).toBeGreaterThanOrEqual(2); // Deputy and When I Work
      for (const x of withCount) expect(x).toContain(l.assumption);
      for (const id of ["deputy", "wheniwork"] as const) {
        const own = sentences(plain(section(page(), id))).filter((x) => x.includes(total(id)));
        expect(own.length).toBeGreaterThan(0);
        for (const x of own) expect(x).toContain(l.assumption);
      }
      for (const e of faq(page())) {
        const parts = e.text.split(/;|(?<=[.!?])\s+/);
        for (const x of parts.filter((y) => y.includes(`${users} ${l.usersWord}`) || y.includes(total("deputy")) || y.includes(total("wheniwork"))))
          expect(x).toContain(l.assumption);
      }
    });

    it("states the price assumptions", () => {
      const text = plain(page());
      expect(text).toContain(l.monthly);
      expect(text).toContain(l.excluded);
      expect(text).toContain(l.cheapest);
      expect(text).toContain(`${DEFAULT_TEAM.locations}`);
    });

    it("ties the Homebase $0 promotion to Plus and does not count it", () => {
      const hb = sentences(plain(section(page(), "homebase"))).filter((x) => x.includes("$0"));
      expect(hb.length).toBeGreaterThan(0);
      for (const x of hb) {
        expect(x).toContain("Plus");
        expect(x).toContain(l.promo);
      }
    });

    it("states Deputy's thresholds, links its help article, and says to check your own rules", () => {
      const text = plain(page());
      expect(text).toContain(l.fast);
      expect(text).toContain(l.retail);
      expect(text).toContain(l.notLegal);
      expect(page()).toContain(`href="${helpArticle}"`);
    });

    it("presents Wiz Scheduler's Fair Workweek limits and says Deputy is far stronger", () => {
      const wiz = plain(section(page(), "wiz"));
      expect(wiz).toContain(l.limits);
      expect(wiz).toContain(l.stronger);
      expect(wiz).toContain(l.farStronger);
      expect(plain(section(page(), "deputy"))).toMatch(l.locale === "en" ? /strongest/ : /más (fuerte|completo)/);
    });

    it("links the NYC Fair Workweek page and each tool's compare page in its own locale", () => {
      expect(page()).toContain(`href="${l.prefix}/nyc-fair-workweek-scheduling"`);
      const paths: Record<string, string> = { "7shifts": "/compare/7shifts", deputy: "/compare/deputy", homebase: "/compare/homebase", wheniwork: "/compare/when-i-work" };
      for (const [id, p] of Object.entries(paths)) {
        expect(COMPARE_PATHS).toContain(p);
        expect(section(page(), id)).toContain(`href="${l.prefix}${p}"`);
      }
    });

    it("has a FAQPage with at least 3 self-contained entries", () => {
      const items = faq(page());
      expect(items.length).toBeGreaterThanOrEqual(3);
      for (const e of items) {
        expect(e.name.length).toBeGreaterThan(10);
        if (e.text.includes("$")) {
          expect(e.text).toContain(l.monthly);
          expect(e.text).toContain(l.excluded);
        }
      }
    });

    it("shows the earliest checked-on date, a CTA, metadata and en/es alternates", () => {
      const date = ORDER.map((id) => TOOLS[id].checkedOn).sort()[0];
      expect(page()).toContain(`datetime="${date}"`);
      expect(page()).toContain('href="https://app.wizscheduler.com/register"');
      expect(page()).toMatch(/<title>[^<]*Wiz Scheduler/);
      expect(page()).toMatch(/<meta name="description" content="[^"]{40,}/);
      expect(page()).toContain(`hreflang="en" href="https://wizscheduler.com${PATH}"`);
      expect(page()).toContain(`hreflang="es" href="https://wizscheduler.com/es${PATH}"`);
      expect(page()).not.toMatch(/hreflang="fr"/);
    });

    it("leaves no unfilled {placeholder} and no customer quotes", () => {
      expect(visible(page())).not.toMatch(/\{[a-zA-Z0-9]+\}/);
      expect(plain(page())).not.toMatch(/customers (told|say)|testimonial/i);
    });
  });
}
