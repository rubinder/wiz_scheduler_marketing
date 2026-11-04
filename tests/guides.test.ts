import { describe, expect, it } from "vitest";
import { guideAlternates, guideLocales, guidePath, guideSchema, splitId } from "../src/lib/guides";

const entries = [{ id: "en/shift-swaps" }, { id: "ar/shift-swaps" }, { id: "ja/shift-swaps" }, { id: "en/other" }];

describe("guides", () => {
  it("paths", () => {
    expect(guidePath("en", "shift-swaps")).toBe("/guides/shift-swaps");
    expect(guidePath("ar", "shift-swaps")).toBe("/ar/guides/shift-swaps");
  });
  it("only existing locales, in LOCALES order", () => {
    expect(guideLocales(entries, "shift-swaps")).toEqual(["en", "ar", "ja"]);
  });
  it("alternates skip dropped locales", () => {
    expect(guideAlternates(entries, "shift-swaps").map((a) => a.href)).toEqual(["/guides/shift-swaps", "/ar/guides/shift-swaps", "/ja/guides/shift-swaps"]);
  });
  it("splits glob ids", () => {
    expect(splitId("pcm/shift-swaps")).toEqual({ locale: "pcm", slug: "shift-swaps" });
    expect(splitId("pcm/shift-swaps.md")).toEqual({ locale: "pcm", slug: "shift-swaps" });
  });
});

describe("guides validation", () => {
  it("splitId rejects unknown locales and bad slugs", () => {
    for (const id of ["xx/a", "en", "en/", "en/a/b", "en/A", "en/-a", "en/a-", "en/a--b", "en/../x", "/en/a", "en/a b"]) {
      expect(() => splitId(id), id).toThrow();
    }
  });
  it("guidePath rejects unknown locales and bad slugs", () => {
    expect(() => guidePath("xx" as never, "a")).toThrow();
    for (const slug of ["", "A", "a/b", "../x", "a b", "a--b", "-a", "a?x=1", "a#h"]) {
      expect(() => guidePath("en", slug), slug).toThrow();
    }
  });
  it("guideLocales and guideAlternates reject a bad slug", () => {
    expect(() => guideLocales(entries, "../x")).toThrow();
    expect(() => guideAlternates(entries, "A")).toThrow();
  });
});

describe("guideSchema", () => {
  const ok = {
    title: "Shift swaps", description: "How swaps work.", targetKeyword: "shift swap",
    sourceLocale: "en", publishedOn: "2026-11-01", updatedOn: "2026-11-02", related: ["other-guide"],
  };
  const bad = (over: Record<string, unknown>) => guideSchema.safeParse({ ...ok, ...over }).success;
  it("accepts a valid guide and defaults related", () => {
    expect(guideSchema.parse(ok).related).toEqual(["other-guide"]);
    const rest: Record<string, unknown> = { ...ok };
    delete rest.related;
    expect(guideSchema.parse(rest).related).toEqual([]);
  });
  it("rejects extra keys, including URL-shaped ones", () => {
    expect(bad({ canonicalUrl: "https://x.test" })).toBe(false);
    expect(bad({ image: "/a.png" })).toBe(false);
  });
  it("rejects empty, blank and over-long text", () => {
    expect(bad({ title: "" })).toBe(false);
    expect(bad({ description: "   " })).toBe(false);
    expect(bad({ targetKeyword: "" })).toBe(false);
    expect(bad({ title: "a".repeat(121) })).toBe(false);
    expect(bad({ description: "a".repeat(301) })).toBe(false);
    expect(bad({ targetKeyword: "a".repeat(121) })).toBe(false);
    expect(bad({ title: "a".repeat(120), description: "a".repeat(300), targetKeyword: "a".repeat(120) })).toBe(true);
  });
  it("trims text", () => {
    expect(guideSchema.parse({ ...ok, title: "  Hi  " }).title).toBe("Hi");
  });
  it("rejects bad locales, dates and ordering", () => {
    expect(bad({ sourceLocale: "xx" })).toBe(false);
    expect(bad({ publishedOn: "2026-02-30" })).toBe(false);
    for (const d of ["2026-13-01", "2026-00-10"]) {
      expect(() => bad({ publishedOn: d, updatedOn: d }), d).not.toThrow();
      expect(bad({ publishedOn: d, updatedOn: d }), d).toBe(false);
    }
    expect(bad({ updatedOn: "11/02/2026" })).toBe(false);
    expect(bad({ publishedOn: "2026-11-03" })).toBe(false);
    expect(bad({ publishedOn: "2026-11-02" })).toBe(true);
  });
  it("rejects non-slug related entries", () => {
    expect(bad({ related: ["Other"] })).toBe(false);
    expect(bad({ related: ["a/b"] })).toBe(false);
    expect(bad({ related: ["https://x.test"] })).toBe(false);
  });
});
