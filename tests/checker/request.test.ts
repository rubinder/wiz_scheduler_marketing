import { describe, expect, it, vi } from "vitest";
import { buildRequest, checkSchedule, MAX_SHIFTS } from "../../src/lib/checker/request";
import type { CheckResponse, ShiftRow } from "../../src/lib/checker/types";

const row = (i: number): ShiftRow => ({ employee: `E${i}`, start: "2026-10-05 09:00", end: "2026-10-05 17:00" });
const ok: CheckResponse = { totals: { employees: 1, clopenings: 0, short_notice: 0 }, employees: [] };
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("buildRequest", () => {
  it("applies NYC defaults and the given timezone", () => {
    const r = buildRequest([row(1)], { timezone: "America/New_York" });
    expect(r).toEqual({
      ok: true,
      request: { timezone: "America/New_York", min_rest_hours: 11, notice_days: 14, shifts: [row(1)] },
    });
  });
  it("includes published_at only when given", () => {
    const r = buildRequest([row(1)], { timezone: "UTC", publishedAt: "2026-09-28" });
    expect(r.ok && r.request.published_at).toBe("2026-09-28T00:00:00");
    const none = buildRequest([row(1)], { timezone: "UTC", publishedAt: "  " });
    expect(none.ok && "published_at" in none.request).toBe(false);
  });
  it("rejects empty and oversized inputs before any request", () => {
    expect(buildRequest([], { timezone: "UTC" })).toEqual({ ok: false, reason: "empty" });
    const big = Array.from({ length: MAX_SHIFTS + 1 }, (_, i) => row(i));
    expect(buildRequest(big, { timezone: "UTC" })).toEqual({ ok: false, reason: "too_many" });
  });
});

describe("checkSchedule", () => {
  const req = { timezone: "UTC", min_rest_hours: 11, notice_days: 14, shifts: [row(1)] };

  it("posts JSON to the public endpoint and returns the body", async () => {
    const fetchImpl = vi.fn(async () => json(200, ok)) as unknown as typeof fetch;
    const out = await checkSchedule("https://x/api/v1", req, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith("https://x/api/v1/public/compliance-check", expect.objectContaining({ method: "POST" }));
    expect(out).toEqual({ ok: true, data: ok });
  });
  it("maps 429 to busy and other failures to unavailable", async () => {
    expect(await checkSchedule("https://x", req, vi.fn(async () => json(429, {})) as unknown as typeof fetch)).toEqual({ ok: false, reason: "busy" });
    expect(await checkSchedule("https://x", req, vi.fn(async () => json(500, {})) as unknown as typeof fetch)).toEqual({ ok: false, reason: "unavailable" });
    expect(
      await checkSchedule(
        "https://x",
        req,
        vi.fn(async () => {
          throw new Error("net");
        }) as unknown as typeof fetch,
      ),
    ).toEqual({ ok: false, reason: "unavailable" });
  });
});
