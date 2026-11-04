import { describe, expect, it } from "vitest";
import { rngFrom, traceStreamlines } from "../src/islands/flowField";

const opts = { width: 300, height: 200, dSep: 8, dTest: 4, step: 1.5, maxSteps: 200, randomSeeds: 200 };
const inCircle = (x: number, y: number) => Math.hypot(x - 150, y - 100) < 40;

describe("traceStreamlines", () => {
  const curves = traceStreamlines((x, y) => Math.sin(x * 0.02) + Math.cos(y * 0.03), inCircle, rngFrom(7), opts);

  it("fills the field with curves", () => {
    expect(curves.length).toBeGreaterThan(50);
  });

  it("never enters a void", () => {
    for (const c of curves) for (let i = 0; i < c.pts.length; i += 2) expect(inCircle(c.pts[i], c.pts[i + 1])).toBe(false);
  });

  it("stops each curve before it touches another", () => {
    // Every point of a curve stays at least dTest from every earlier curve.
    const seen: number[] = [];
    let minGap = Infinity;
    for (const c of curves) {
      for (let i = 0; i < c.pts.length; i += 6) {
        for (let j = 0; j < seen.length; j += 2) {
          minGap = Math.min(minGap, Math.hypot(c.pts[i] - seen[j], c.pts[i + 1] - seen[j + 1]));
        }
      }
      for (let i = 0; i < c.pts.length; i += 2) seen.push(c.pts[i], c.pts[i + 1]);
    }
    expect(minGap).toBeGreaterThanOrEqual(opts.dTest - 1e-3);
  });

  it("is reproducible from its seed", () => {
    const again = traceStreamlines((x, y) => Math.sin(x * 0.02) + Math.cos(y * 0.03), inCircle, rngFrom(7), opts);
    expect(again.length).toBe(curves.length);
    expect(Array.from(again[0].pts)).toEqual(Array.from(curves[0].pts));
  });
});
