import { describe, expect, it } from "vitest";
import en from "../src/i18n/en";
import es from "../src/i18n/es";
import { LOCALES } from "../src/lib/links";

type Tree = { [k: string]: string | Tree | Tree[] };

const GENERATED = import.meta.glob("../src/i18n/generated/*.ts", { import: "default", eager: true }) as Record<string, Tree>;
const CHROME = import.meta.glob("../src/i18n/chrome/*.ts", { import: "default", eager: true }) as Record<string, Tree>;

function leaves(node: Tree | Tree[] | string, prefix = ""): string[] {
  if (typeof node === "string") return [prefix];
  if (Array.isArray(node)) return node.flatMap((n, i) => leaves(n, `${prefix}[${i}]`));
  return Object.entries(node).flatMap(([k, v]) => leaves(v as Tree, prefix ? `${prefix}.${k}` : k));
}

function empties(t: Tree): string[] {
  return leaves(t).filter((path) => {
    const value = path
      .replace(/\[(\d+)\]/g, ".$1")
      .split(".")
      .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], t);
    return typeof value !== "string" || value.trim() === "";
  });
}

describe("full-site copy (en/es)", () => {
  it("en and es have identical leaf paths", () => {
    expect(leaves(es as unknown as Tree).sort()).toEqual(leaves(en as unknown as Tree).sort());
  });
  it("no leaf is empty in either locale", () => {
    expect(empties(en as unknown as Tree)).toEqual([]);
    expect(empties(es as unknown as Tree)).toEqual([]);
  });
});

for (const [name, files] of [["generated", GENERATED], ["chrome", CHROME]] as const) {
  describe(`${name} copy, all 19 locales`, () => {
    it("has a file for every locale and no others", () => {
      const codes = Object.keys(files).map((p) => p.split("/").pop()!.replace(/\.ts$/, "")).sort();
      expect(codes).toEqual([...LOCALES].sort());
    });
    const reference = leaves(files[`../src/i18n/${name}/en.ts`]).sort();
    for (const locale of LOCALES) {
      it(`${locale} matches English and has no empty string`, () => {
        const t = files[`../src/i18n/${name}/${locale}.ts`];
        expect(t, `missing src/i18n/${name}/${locale}.ts`).toBeDefined();
        expect(leaves(t).sort()).toEqual(reference);
        expect(empties(t)).toEqual([]);
      });
    }
  });
}
