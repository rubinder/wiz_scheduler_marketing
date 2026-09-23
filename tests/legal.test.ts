import { describe, expect, it, vi } from "vitest";
import { getLegal, legalSource } from "../src/lib/legal";
import { LEGAL_API_URL } from "../src/lib/site";
import fixture from "../src/content/legal/fixture.json";

const doc = { version: "9.9", effective_date: "2030-01-01", content: "api text" };
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("legalSource", () => {
  it("defaults to the fixture and only reads 'api' explicitly", () => {
    expect(legalSource({})).toBe("fixture");
    expect(legalSource({ LEGAL_SOURCE: "api" })).toBe("api");
    expect(legalSource({ LEGAL_SOURCE: "anything-else" })).toBe("fixture");
  });
});

describe("getLegal", () => {
  it("returns the fixture document without any network call", async () => {
    const fetchImpl = vi.fn();
    const result = await getLegal("terms", { source: "fixture", fetchImpl });
    expect(result.content).toBe(fixture.terms.content);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fetches from the API when asked", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, doc));
    const result = await getLegal("privacy-policy", { source: "api", apiUrl: "https://x/api/v1", fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith("https://x/api/v1/gdpr/privacy-policy");
    expect(result).toEqual(doc);
  });

  it("defaults to LEGAL_API_URL when no apiUrl is given", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, doc));
    await getLegal("terms", { source: "api", fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith(`${LEGAL_API_URL}/gdpr/terms`);
  });

  it("throws on a non-OK response so the build fails", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(503, {}));
    await expect(getLegal("dpa", { source: "api", apiUrl: "https://x/api/v1", fetchImpl })).rejects.toThrow(/503/);
  });

  it("names the document when the network call itself fails", async () => {
    const fetchImpl = vi.fn(async () => { throw new TypeError("fetch failed"); });
    await expect(getLegal("terms", { source: "api", apiUrl: "https://x/api/v1", fetchImpl })).rejects.toThrow(/legal terms: TypeError: fetch failed/);
  });

  it("throws on an unexpected shape", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { nope: true }));
    await expect(getLegal("dpa", { source: "api", apiUrl: "https://x/api/v1", fetchImpl })).rejects.toThrow(/shape/);
  });
});
