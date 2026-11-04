import { describe, it, expect } from "vitest";
import {
  TOOLS,
  DEFAULT_TEAM,
  clampTeam,
  quotePlans,
  formatUsd,
  planRange,
  type PlanQuote,
  type Tool,
  type ToolId,
} from "../../src/data/competitors";

const q = (id: ToolId, locations: number, per: number) =>
  quotePlans(TOOLS[id], { locations, employeesPerLocation: per });
const hi = (qs: PlanQuote[]) => qs.find((p) => p.highlighted);

describe("quotePlans", () => {
  it("7shifts: 3 locations x 13 -> Essentials highlighted at $149.97", () => {
    expect(hi(q("7shifts", 3, 13))).toMatchObject({ plan: "Essentials", monthlyUsd: 149.97 });
  });
  it("7shifts: 3 x 40 -> Pro $299.97; Essentials and 1-30 Premium don't fit", () => {
    const qs = q("7shifts", 3, 40);
    expect(hi(qs)).toMatchObject({ plan: "Pro", monthlyUsd: 299.97 });
    expect(qs.find((p) => p.plan === "Essentials")!.fits).toBe(false);
    expect(qs.filter((p) => p.plan === "Premium").map((p) => p.fits)).toEqual([false, true]);
  });
  it("7shifts: 61 per location -> only Premium (31+) fits", () => {
    expect(q("7shifts", 1, 61).filter((p) => p.fits).map((p) => p.plan)).toEqual(["Premium"]);
  });
  it("7shifts: Comp fits 1 location <=15 but is never highlighted (no auto-scheduling)", () => {
    const qs = q("7shifts", 1, 15);
    expect(qs.find((p) => p.plan === "Comp")).toMatchObject({ fits: true, monthlyUsd: 0, highlighted: false });
    expect(q("7shifts", 2, 15).find((p) => p.plan === "Comp")!.fits).toBe(false);
  });
  it("Deputy: 3 x 13 -> Core $282.75 highlighted; Lite listed, not auto", () => {
    const qs = q("deputy", 3, 13);
    expect(hi(qs)).toMatchObject({ plan: "Core", monthlyUsd: 282.75 });
    expect(qs.find((p) => p.plan === "Lite")).toMatchObject({ monthlyUsd: 214.5, autoScheduling: "no" });
  });
  it("Deputy: $30 monthly minimum applies", () => {
    expect(q("deputy", 1, 3).find((p) => p.plan === "Lite")!.monthlyUsd).toBe(30);
  });
  it("When I Work: single-location rate at 1 location, multi rate at 2+", () => {
    expect(hi(q("wheniwork", 1, 10))!.monthlyUsd).toBe(25);
    expect(hi(q("wheniwork", 2, 10))!.monthlyUsd).toBe(100);
  });
  it("Homebase: Plus highlighted at 3 x $70; Basic only fits 1 location <=10", () => {
    expect(hi(q("homebase", 3, 13))).toMatchObject({ plan: "Plus", monthlyUsd: 210 });
    expect(q("homebase", 1, 11).find((p) => p.plan === "Basic")!.fits).toBe(false);
  });
  it("Wiz: Pro $18 highlighted; extra $1 per 500 above 500; Free fits <=2 loc and <=25 total", () => {
    expect(hi(q("wiz", 3, 13))).toMatchObject({ plan: "Pro", monthlyUsd: 18 });
    expect(hi(q("wiz", 3, 300))!.monthlyUsd).toBe(19); // 900 employees
    expect(q("wiz", 2, 12).find((p) => p.plan === "Free")!.fits).toBe(true);
    expect(q("wiz", 2, 13).find((p) => p.plan === "Free")!.fits).toBe(false);
  });
  it("quote plans show monthlyUsd null and never highlight", () => {
    const synthetic: Tool = {
      ...TOOLS["7shifts"],
      plans: [
        { name: "Enterprise", basis: "quote", monthlyUsd: null, autoScheduling: "yes" },
        { name: "Standard", basis: "flat", monthlyUsd: 50, autoScheduling: "yes" },
      ],
    };
    const qs = quotePlans(synthetic, DEFAULT_TEAM);
    expect(qs.find((p) => p.plan === "Enterprise")).toMatchObject({ monthlyUsd: null, highlighted: false });
    expect(hi(qs)).toMatchObject({ plan: "Standard", monthlyUsd: 50 });
  });
});

describe("would-be prices for tiers that don't fit", () => {
  it("7shifts at 3 x 13: Pro and Premium (31+) don't fit but show their per-location price", () => {
    const qs = q("7shifts", 3, 13);
    const pro = qs.find((p) => p.plan === "Pro")!;
    expect(pro).toMatchObject({ fits: false, monthlyUsd: null, wouldBeUsd: 299.97, highlighted: false });
    const [small, large] = qs.filter((p) => p.plan === "Premium");
    expect(small).toMatchObject({ fits: true, monthlyUsd: 449.97, wouldBeUsd: 449.97 });
    expect(large).toMatchObject({ fits: false, monthlyUsd: null, wouldBeUsd: 599.97 });
    expect(qs.find((p) => p.plan === "Essentials")).toMatchObject({ fits: true, monthlyUsd: 149.97, wouldBeUsd: 149.97 });
  });
  it("no would-be price when the location count or company total rules the plan out", () => {
    expect(q("7shifts", 3, 13).find((p) => p.plan === "Comp")!.wouldBeUsd).toBeNull();
    expect(q("homebase", 3, 13).find((p) => p.plan === "Basic")!.wouldBeUsd).toBeNull();
    expect(q("wheniwork", 3, 13).find((p) => p.plan === "One location")).toMatchObject({ fits: false, wouldBeUsd: null });
    expect(q("wiz", 3, 13).find((p) => p.plan === "Free")).toMatchObject({ fits: false, wouldBeUsd: null });
  });
  it("no would-be price for a free tier that is over its headcount", () => {
    expect(q("7shifts", 1, 20).find((p) => p.plan === "Comp")).toMatchObject({ fits: false, wouldBeUsd: null });
  });
});

describe("planRange", () => {
  const plan = (id: ToolId, name: string, i = 0) => TOOLS[id].plans.filter((p) => p.name === name)[i];
  it("labels 7shifts tiers by employees per location", () => {
    expect(planRange(plan("7shifts", "Essentials"), "en")).toBe("1–30 per location");
    expect(planRange(plan("7shifts", "Premium", 0), "en")).toBe("1–30 per location");
    expect(planRange(plan("7shifts", "Pro"), "en")).toBe("31–60 per location");
    expect(planRange(plan("7shifts", "Premium", 1), "en")).toBe("31+ per location");
    expect(planRange(plan("7shifts", "Comp"), "en")).toBe("1 location, up to 15 employees");
    expect(planRange(plan("7shifts", "Pro"), "es")).toBe("31–60 por ubicación");
    expect(planRange(plan("7shifts", "Premium", 1), "es")).toBe("31+ por ubicación");
    expect(planRange(plan("7shifts", "Comp"), "es")).toBe("1 ubicación, hasta 15 empleados");
  });
  it("labels location and company limits", () => {
    expect(planRange(plan("homebase", "Basic"), "en")).toBe("1 location, up to 10 employees");
    expect(planRange(plan("wheniwork", "One location"), "en")).toBe("1 location");
    expect(planRange(plan("wheniwork", "Multiple locations"), "en")).toBe("2+ locations");
    expect(planRange(plan("wiz", "Free"), "en")).toBe("up to 2 locations and 25 employees");
    expect(planRange(plan("wheniwork", "Multiple locations"), "es")).toBe("2+ ubicaciones");
    expect(planRange(plan("wiz", "Free"), "es")).toBe("hasta 2 ubicaciones y 25 empleados");
  });
  it("is null for plans with no size limit", () => {
    expect(planRange(plan("wiz", "Pro"), "en")).toBeNull();
    expect(planRange(plan("deputy", "Core"), "en")).toBeNull();
    expect(planRange(plan("homebase", "Plus"), "es")).toBeNull();
  });
});

describe("clampTeam", () => {
  it("turns junk into whole numbers 1..10000", () => {
    expect(clampTeam({ locations: "", employeesPerLocation: -4 })).toEqual({ locations: 1, employeesPerLocation: 1 });
    expect(clampTeam({ locations: "2.7", employeesPerLocation: 1e9 })).toEqual({ locations: 2, employeesPerLocation: 10000 });
    expect(clampTeam({ locations: NaN, employeesPerLocation: "abc" })).toEqual({ locations: 1, employeesPerLocation: 1 });
  });
  it("default team is 3 x 13", () => {
    expect(DEFAULT_TEAM).toEqual({ locations: 3, employeesPerLocation: 13 });
  });
});

describe("TOOLS data", () => {
  it("every tool has a pricingUrl among its sources, checkedOn as YYYY-MM-DD, and en+es text", () => {
    for (const [id, tool] of Object.entries(TOOLS)) {
      expect(tool.id).toBe(id);
      expect(tool.sources.map((s) => s.href)).toContain(tool.pricingUrl);
      expect(tool.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const loc of ["en", "es"] as const) {
        const t = tool.text[loc];
        expect(t.description).not.toBe("");
        expect(t.autoScheduling).not.toBe("");
        expect(t.preferences).not.toBe("");
        expect(t.fairWorkweek).not.toBe("");
        expect(t.strengths.length).toBeGreaterThan(0);
        expect(t.limitations.length).toBeGreaterThan(0);
        for (const s of tool.sources) expect(s.label[loc]).not.toBe("");
      }
    }
  });
  it("uses the two-word product name", () => {
    const all = JSON.stringify(TOOLS);
    expect(all).not.toContain("WizScheduler");
  });
});

it("formatUsd", () => {
  expect(formatUsd(149.97)).toBe("$149.97");
  expect(formatUsd(18)).toBe("$18.00");
});
