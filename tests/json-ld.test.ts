import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "../src/lib/jsonLd";

// Characters that must never appear raw inside an inline <script type="application/ld+json">.
const UNSAFE = new RegExp("[<>&\\u2028\\u2029]");

describe("serializeJsonLd", () => {
  const hostile = "</script><script>alert(1)</script>";

  it("cannot close the script element it is embedded in", () => {
    const out = serializeJsonLd({ headline: hostile });
    expect(out).not.toMatch(UNSAFE);
    expect(out.toLowerCase()).not.toContain("</script");
    expect(out).toContain("\\u003c/script\\u003e");
  });

  it("escapes ampersands, comment openers and the JS line terminators", () => {
    const out = serializeJsonLd({ a: "Tom & Jerry <!-- x -->", b: "line\u2028para\u2029end" });
    expect(out).not.toMatch(UNSAFE);
    expect(out).toContain("\\u0026");
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
  });

  it("round-trips to the same value", () => {
    const value = { "@type": "Article", headline: hostile, x: "a & b\u2028c" };
    expect(JSON.parse(serializeJsonLd(value))).toEqual(value);
  });
});
