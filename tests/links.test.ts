import { describe, expect, it } from "vitest";
import { alternates, isLocale, localePath } from "../src/lib/links";
import { appLink } from "../src/lib/site";

describe("localePath", () => {
  it("leaves the default locale unprefixed", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/features")).toBe("/features");
  });
  it("prefixes other locales and strips trailing slashes", () => {
    expect(localePath("es", "/")).toBe("/es");
    expect(localePath("es", "/features/")).toBe("/es/features");
  });
  it("lists both alternates for a path", () => {
    expect(alternates("/terms")).toEqual([
      { locale: "en", href: "/terms" },
      { locale: "es", href: "/es/terms" },
    ]);
  });
  it("recognises locales", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
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
