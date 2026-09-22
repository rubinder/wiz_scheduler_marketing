import { describe, expect, it } from "vitest";
import { utils, write } from "xlsx";
import { guessMapping, parseCsv, parsePasted, parseTsv, parseXlsx, toShiftRows } from "../../src/lib/checker/parse";

describe("parseCsv", () => {
  it("splits headers and rows, trimming cells", () => {
    const t = parseCsv("Employee,Start,End\nA.B., 2026-10-05 16:00 ,2026-10-06 00:00\n");
    expect(t.headers).toEqual(["Employee", "Start", "End"]);
    expect(t.rows).toEqual([["A.B.", "2026-10-05 16:00", "2026-10-06 00:00"]]);
  });

  it("handles quoted fields with embedded commas, quotes and CRLF", () => {
    const t = parseCsv('Name,Start,End\r\n"Lee, Sam",2026-10-05 09:00,"2026-10-05 ""17:00"""\r\n');
    expect(t.rows[0]).toEqual(["Lee, Sam", "2026-10-05 09:00", '2026-10-05 "17:00"']);
  });

  it("drops blank lines and a BOM", () => {
    const t = parseCsv("﻿a,b,c\n\n1,2,3\n , , \n");
    expect(t.rows).toEqual([["1", "2", "3"]]);
  });

  it("returns an empty table for empty input", () => {
    expect(parseCsv("")).toEqual({ headers: [], rows: [] });
  });
});

describe("parseTsv / parsePasted", () => {
  it("splits on tabs", () => {
    const t = parseTsv("Employee\tStart\tEnd\nA.B.\t2026-10-05 16:00\t2026-10-06 00:00");
    expect(t.rows[0][0]).toBe("A.B.");
  });
  it("picks tabs when the first line has any, otherwise commas", () => {
    expect(parsePasted("a\tb\n1\t2").headers).toEqual(["a", "b"]);
    expect(parsePasted("a,b\n1,2").headers).toEqual(["a", "b"]);
  });
});

describe("parseXlsx", () => {
  it("reads the first sheet as strings", () => {
    const ws = utils.aoa_to_sheet([
      ["Employee", "Start", "End"],
      ["A.B.", "2026-10-05 16:00", "2026-10-06 00:00"],
      ["", "", ""],
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Week");
    const buf = write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const t = parseXlsx(buf);
    expect(t.headers).toEqual(["Employee", "Start", "End"]);
    expect(t.rows).toEqual([["A.B.", "2026-10-05 16:00", "2026-10-06 00:00"]]);
  });
});

describe("guessMapping", () => {
  it("matches exact headers first", () => {
    expect(guessMapping(["Employee", "Shift Start", "Shift End"])).toEqual({ employee: 0, start: 1, end: 2 });
  });
  it("matches short synonyms without letting 'in' steal 'finish'", () => {
    expect(guessMapping(["Name", "In", "Out"])).toEqual({ employee: 0, start: 1, end: 2 });
    expect(guessMapping(["Staff", "Begin", "Finish"])).toEqual({ employee: 0, start: 1, end: 2 });
  });
  it("matches Spanish headers", () => {
    expect(guessMapping(["Empleado", "Entrada", "Salida"])).toEqual({ employee: 0, start: 1, end: 2 });
  });
  it("leaves unknown columns unset", () => {
    expect(guessMapping(["Date", "Amount"])).toEqual({ employee: -1, start: -1, end: -1 });
  });
});

describe("toShiftRows", () => {
  it("builds rows and counts skipped incomplete ones", () => {
    const table = { headers: ["e", "s", "x", "f"], rows: [["A", "1", "z", "2"], ["B", "", "z", "2"], ["C", "3", "z", ""]] };
    const out = toShiftRows(table, { employee: 0, start: 1, end: 3 });
    expect(out.rows).toEqual([{ employee: "A", start: "1", end: "2" }]);
    expect(out.skipped).toBe(2);
  });
  it("returns nothing when the mapping is incomplete", () => {
    expect(toShiftRows({ headers: ["a"], rows: [["1"]] }, { employee: 0, start: -1, end: -1 })).toEqual({ rows: [], skipped: 1 });
  });
});
