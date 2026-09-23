import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Checker from "../../src/islands/Checker";
import en from "../../src/i18n/en";
import type { CheckResponse } from "../../src/lib/checker/types";

const props = { copy: en.checker, apiUrl: "https://x/api/v1", enabled: true, registerUrl: "/r", sampleUrl: "/s.csv" };
const TSV = "Employee\tStart\tEnd\nA.B.\t2026-10-05 16:00\t2026-10-06 00:00\nA.B.\t2026-10-06 06:00\t2026-10-06 14:00";
const response: CheckResponse = {
  totals: { employees: 1, clopenings: 1, short_notice: 0 },
  employees: [
    {
      employee: "A.B.",
      findings: [
        {
          kind: "clopening",
          first: { start: "2026-10-05T16:00:00", end: "2026-10-06T00:00:00" },
          second: { start: "2026-10-06T06:00:00", end: "2026-10-06T14:00:00" },
          rest_hours: 6,
        },
      ],
    },
  ],
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function pasteAndCheck(text = TSV) {
  fireEvent.change(screen.getByLabelText(en.checker.pasteLabel), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: en.checker.check }));
}

describe("Checker", () => {
  it("shows the coming-soon state when disabled", () => {
    render(<Checker {...props} enabled={false} />);
    expect(screen.getByText(en.checker.comingSoonTitle)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.checker.check })).toBeNull();
  });

  it("guesses the columns from pasted rows", () => {
    render(<Checker {...props} />);
    fireEvent.change(screen.getByLabelText(en.checker.pasteLabel), { target: { value: TSV } });
    expect(screen.getByLabelText(en.checker.colEmployee)).toHaveValue("0");
    expect(screen.getByLabelText(en.checker.colStart)).toHaveValue("1");
    expect(screen.getByLabelText(en.checker.colEnd)).toHaveValue("2");
  });

  it("renders totals and findings from the API response", async () => {
    const fetchImpl = vi.fn(async () => json(200, response));
    render(<Checker {...props} fetchImpl={fetchImpl} />);
    pasteAndCheck();
    await waitFor(() => expect(screen.getByText(en.checker.resultsTitle)).toBeInTheDocument());
    expect(screen.getByTestId("total-clopenings")).toHaveTextContent("1");
    expect(screen.getByText("A.B.")).toBeInTheDocument();
    expect(screen.getByText(/6 hours of rest/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.checker.fixCta })).toHaveAttribute("href", "/r");
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.shifts).toHaveLength(2);
    expect(body.min_rest_hours).toBe(11);
  });

  it("surfaces skipped rows alongside the results", async () => {
    const fetchImpl = vi.fn(async () => json(200, response));
    render(<Checker {...props} fetchImpl={fetchImpl} />);
    pasteAndCheck("Employee\tStart\tEnd\nA.B.\t2026-10-05 16:00\t2026-10-06 00:00\nC.D.\t\t2026-10-06 14:00");
    await waitFor(() => expect(screen.getByText(en.checker.resultsTitle)).toBeInTheDocument());
    expect(screen.getByText(/1 rows skipped/)).toBeInTheDocument();
  });

  it("shows the busy message on 429 and the unavailable message on failure, never a result", async () => {
    const { unmount } = render(<Checker {...props} fetchImpl={vi.fn(async () => json(429, {}))} />);
    pasteAndCheck();
    await waitFor(() => expect(screen.getByText(en.checker.errBusy)).toBeInTheDocument());
    expect(screen.queryByText(en.checker.resultsTitle)).toBeNull();
    unmount();

    render(<Checker {...props} fetchImpl={vi.fn(async () => { throw new Error("net"); })} />);
    pasteAndCheck();
    await waitFor(() => expect(screen.getByText(en.checker.errUnavailable)).toBeInTheDocument());
  });

  it("refuses oversized input before calling the API", () => {
    const fetchImpl = vi.fn();
    render(<Checker {...props} fetchImpl={fetchImpl} />);
    const rows = Array.from({ length: 2001 }, (_, i) => `E${i}\t2026-10-05 09:00\t2026-10-05 17:00`).join("\n");
    pasteAndCheck(`Employee\tStart\tEnd\n${rows}`);
    expect(screen.getByText(en.checker.errTooMany.replace("{max}", "2000"))).toBeInTheDocument();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("asks for a mapping when columns are unknown", () => {
    render(<Checker {...props} />);
    pasteAndCheck("Foo\tBar\tBaz\n1\t2\t3");
    expect(screen.getByText(en.checker.errMapping)).toBeInTheDocument();
  });

  it("resets the file input after reading so the same file can be re-checked", async () => {
    render(<Checker {...props} />);
    const input = screen.getByLabelText(en.checker.upload) as HTMLInputElement;
    const file = new File(["Employee,Start,End\nA.B.,2026-10-05 16:00,2026-10-06 00:00"], "sample.csv", {
      type: "text/csv",
    });
    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);
    await waitFor(() => expect(screen.getByLabelText(en.checker.colEmployee)).toBeInTheDocument());
    expect(input.value).toBe("");
  });
});
