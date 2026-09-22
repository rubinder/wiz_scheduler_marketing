/** One scheduled shift as sent to the API. `start`/`end` are ISO-8601 strings,
 *  naive values interpreted by the API in `CheckRequest.timezone`. */
export interface ShiftRow {
  employee: string;
  start: string;
  end: string;
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

/** Column indexes into ParsedTable.headers; -1 means not chosen. */
export interface ColumnMapping {
  employee: number;
  start: number;
  end: number;
}

// ---- Contract with wiz_scheduler `POST /api/v1/public/compliance-check` (issue #116) ----

export interface CheckRequest {
  timezone: string;
  min_rest_hours: number;
  notice_days: number;
  published_at?: string;
  shifts: ShiftRow[];
}

export interface ShiftWindow {
  start: string;
  end: string;
}

export type Finding =
  | { kind: "clopening"; first: ShiftWindow; second: ShiftWindow; rest_hours: number }
  | { kind: "short_notice"; shift: ShiftWindow; notice_days: number };

export interface EmployeeResult {
  employee: string;
  findings: Finding[];
}

export interface CheckResponse {
  totals: { employees: number; clopenings: number; short_notice: number };
  employees: EmployeeResult[];
}
