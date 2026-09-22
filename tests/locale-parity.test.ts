import { describe, expect, it } from "vitest";
import en from "../src/i18n/en";
import es from "../src/i18n/es";

type Tree = { [k: string]: string | Tree | Tree[] };

function leaves(node: Tree | Tree[] | string, prefix = ""): string[] {
  if (typeof node === "string") return [prefix];
  if (Array.isArray(node)) return node.flatMap((n, i) => leaves(n, `${prefix}[${i}]`));
  return Object.entries(node).flatMap(([k, v]) => leaves(v as Tree, prefix ? `${prefix}.${k}` : k));
}

describe("locale parity", () => {
  it("en and es have identical leaf paths", () => {
    expect(leaves(es as unknown as Tree).sort()).toEqual(leaves(en as unknown as Tree).sort());
  });

  it("no leaf is empty in either locale", () => {
    const empties = (t: Tree) =>
      leaves(t).filter((path) => {
        const value = path
          .replace(/\[(\d+)\]/g, ".$1")
          .split(".")
          .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], t);
        return typeof value !== "string" || value.trim() === "";
      });
    expect(empties(en as unknown as Tree)).toEqual([]);
    expect(empties(es as unknown as Tree)).toEqual([]);
  });
});
