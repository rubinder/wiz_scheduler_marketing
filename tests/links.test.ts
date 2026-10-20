import { describe, expect, it } from "vitest";
import {
  LOCALES, OG_LOCALE, ENDONYMS, alternates, dir, hasPage, isLocale, isSiteLocale, localePath, localesFor,
} from "../src/lib/links";
import { appLink } from "../src/lib/site";

describe("localePath", () => {
  it("leaves the default locale unprefixed", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/features")).toBe("/features");
  });
  it("prefixes other locales and strips trailing slashes", () => {
    expect(localePath("es", "/")).toBe("/es");
    expect(localePath("es", "/features/")).toBe("/es/features");
    expect(localePath("ja", "/")).toBe("/ja");
    expect(localePath("ar", "/features")).toBe("/ar/features");
  });
  it("keeps Spanish for pages that exist only in en/es", () => {
    expect(localePath("es", "/terms")).toBe("/es/terms");
    expect(localePath("es", "/compare/7shifts")).toBe("/es/compare/7shifts");
  });
  it("falls back to English for a page that does not exist in the locale", () => {
    expect(localePath("ja", "/terms")).toBe("/terms");
    expect(localePath("ar", "/nyc-fair-workweek-scheduling")).toBe("/nyc-fair-workweek-scheduling");
    expect(localePath("pcm", "/compare/7shifts/")).toBe("/compare/7shifts");
  });
});

describe("localesFor / hasPage / alternates", () => {
  it("home and features exist in all 19 locales", () => {
    expect(localesFor("/")).toEqual(LOCALES);
    expect(localesFor("/features/")).toEqual(LOCALES);
    expect(LOCALES).toHaveLength(19);
    expect(alternates("/")).toHaveLength(19);
    expect(alternates("/features")).toContainEqual({ locale: "zh", href: "/zh/features" });
  });
  it("other pages exist in en and es only", () => {
    expect(localesFor("/terms")).toEqual(["en", "es"]);
    expect(hasPage("ja", "/terms")).toBe(false);
    expect(hasPage("es", "/terms")).toBe(true);
    expect(alternates("/terms")).toEqual([
      { locale: "en", href: "/terms" },
      { locale: "es", href: "/es/terms" },
    ]);
  });
});

describe("locale facts", () => {
  it("recognises locales", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("xx")).toBe(false);
    expect(isSiteLocale("es")).toBe(true);
    expect(isSiteLocale("fr")).toBe(false);
  });
  it("only ar and ur are right-to-left", () => {
    expect(LOCALES.filter((l) => dir(l) === "rtl")).toEqual(["ar", "ur"]);
  });
  it("every locale has an endonym and an og:locale", () => {
    for (const l of LOCALES) {
      expect(ENDONYMS[l].length).toBeGreaterThan(0);
      expect(OG_LOCALE[l]).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    }
    expect(ENDONYMS.pcm).toBe("Naijá Píjin");
  });
});

describe("appLink", () => {
  it("points at the app host and carries a preset", () => {
    expect(appLink("/login")).toBe("https://app.wizscheduler.com/login");
    expect(appLink("/register", "nyc-fair-workweek")).toBe(
      "https://app.wizscheduler.com/register?preset=nyc-fair-workweek",
    );
  });
});
