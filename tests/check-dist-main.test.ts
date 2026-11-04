// @vitest-environment node
// check-dist.mjs must run as a script even when reached through a symlink (argv[1] unresolved).
import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve(__dirname, "../scripts/check-dist.mjs");
let tmp = "";
afterAll(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

describe("check-dist main-module detection", () => {
  it("exits non-zero via a symlinked path when dist/ is missing", () => {
    tmp = mkdtempSync(join(tmpdir(), "check-dist-link-"));
    const link = join(tmp, "link.mjs");
    symlinkSync(SCRIPT, link);
    const r = spawnSync(process.execPath, ["--experimental-strip-types", link], { cwd: tmp, encoding: "utf8" });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/dist|ENOENT|assert/i);
  });
});
