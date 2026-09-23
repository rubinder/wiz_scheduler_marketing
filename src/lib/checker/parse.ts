import { read, utils } from "xlsx";
import type { ColumnMapping, ParsedTable, ShiftRow } from "./types";

function finish(rows: string[][]): ParsedTable {
  const clean = rows.map((r) => r.map((f) => f.trim())).filter((r) => r.some((f) => f !== ""));
  if (clean.length === 0) return { headers: [], rows: [] };
  const [headers, ...body] = clean;
  return { headers, rows: body };
}

/** RFC 4180 parser for one delimiter: quoted fields, doubled quotes, embedded newlines, CRLF, BOM. */
export function parseDelimited(text: string, delimiter: "," | "\t"): ParsedTable {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return finish(rows);
}

export const parseCsv = (text: string): ParsedTable => parseDelimited(text, ",");
export const parseTsv = (text: string): ParsedTable => parseDelimited(text, "\t");

/** Pasted spreadsheet rows are tab-separated; fall back to commas. */
export function parsePasted(text: string): ParsedTable {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return firstLine.includes("\t") ? parseTsv(text) : parseCsv(text);
}

export function parseXlsx(data: ArrayBuffer): ParsedTable {
  const wb = read(data, { type: "array", cellDates: true });
  const name = wb.SheetNames[0];
  if (!name) return { headers: [], rows: [] };
  const aoa = utils.sheet_to_json<unknown[]>(wb.Sheets[name], {
    header: 1,
    raw: false,
    dateNF: "yyyy-mm-dd hh:mm",
    defval: "",
  });
  return finish(aoa.map((r) => r.map((v) => String(v ?? ""))));
}

const SYNONYMS: Record<keyof ColumnMapping, string[]> = {
  employee: ["employee", "name", "staff", "worker", "person", "empleado", "nombre"],
  start: ["start", "shift start", "in", "begin", "from", "clock in", "inicio", "entrada"],
  end: ["end", "shift end", "out", "finish", "to", "clock out", "fin", "salida"],
};

function pick(norm: string[], words: string[], taken: Set<number>): number {
  for (const w of words) {
    const i = norm.findIndex((h, idx) => !taken.has(idx) && h === w);
    if (i !== -1) return i;
  }
  for (const w of words) {
    const i = norm.findIndex((h, idx) => !taken.has(idx) && h.includes(w));
    if (i !== -1) return i;
  }
  return -1;
}

/** Exact header matches win over substring matches; a column is used once. */
export function guessMapping(headers: string[]): ColumnMapping {
  const norm = headers.map((h) => h.trim().toLowerCase());
  const taken = new Set<number>();
  const employee = pick(norm, SYNONYMS.employee, taken);
  if (employee !== -1) taken.add(employee);
  const start = pick(norm, SYNONYMS.start, taken);
  if (start !== -1) taken.add(start);
  const end = pick(norm, SYNONYMS.end, taken);
  return { employee, start, end };
}

export function toShiftRows(table: ParsedTable, mapping: ColumnMapping): { rows: ShiftRow[]; skipped: number } {
  const { employee, start, end } = mapping;
  if (employee < 0 || start < 0 || end < 0) return { rows: [], skipped: table.rows.length };
  const rows: ShiftRow[] = [];
  let skipped = 0;
  for (const r of table.rows) {
    const row = { employee: r[employee] ?? "", start: r[start] ?? "", end: r[end] ?? "" };
    if (!row.employee || !row.start || !row.end) {
      skipped++;
      continue;
    }
    rows.push(row);
  }
  return { rows, skipped };
}
