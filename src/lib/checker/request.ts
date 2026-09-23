import type { CheckRequest, CheckResponse, ShiftRow } from "./types";

/** Same cap as the API; enforced here so oversized files never leave the browser. */
export const MAX_SHIFTS = 2000;
export const NYC_DEFAULTS = { min_rest_hours: 11, notice_days: 14 } as const;
const FALLBACK_TZ = "America/New_York";

export function defaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TZ;
  } catch {
    return FALLBACK_TZ;
  }
}

export type BuildResult = { ok: true; request: CheckRequest } | { ok: false; reason: "empty" | "too_many" };

export function buildRequest(rows: ShiftRow[], opts: { timezone?: string; publishedAt?: string } = {}): BuildResult {
  if (rows.length === 0) return { ok: false, reason: "empty" };
  if (rows.length > MAX_SHIFTS) return { ok: false, reason: "too_many" };
  const request: CheckRequest = { timezone: opts.timezone ?? defaultTimezone(), ...NYC_DEFAULTS, shifts: rows };
  const published = opts.publishedAt?.trim();
  if (published) request.published_at = published.length === 10 ? `${published}T00:00:00` : published;
  return { ok: true, request };
}

export type CheckOutcome = { ok: true; data: CheckResponse } | { ok: false; reason: "busy" | "unavailable" };

export async function checkSchedule(
  apiUrl: string,
  request: CheckRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<CheckOutcome> {
  let res: Response;
  try {
    res = await fetchImpl(`${apiUrl}/public/compliance-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  if (res.status === 429) return { ok: false, reason: "busy" };
  if (!res.ok) return { ok: false, reason: "unavailable" };
  try {
    return { ok: true, data: (await res.json()) as CheckResponse };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
