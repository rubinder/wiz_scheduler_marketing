import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// vitest.config.ts does not set `test.globals: true`, so Testing Library's
// own auto-cleanup (which only wires up when it finds a global `afterEach`)
// never triggers. Wire it explicitly so each test starts from an empty DOM.
afterEach(() => {
  cleanup();
});
