import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import CostCalculator from "../../src/islands/CostCalculator";
import { TOOLS } from "../../src/data/competitors";
import en from "../../src/i18n/en";
import es from "../../src/i18n/es";

const ids = ["wiz", "7shifts", "deputy"] as const;
const props = { copy: en.calculator, toolIds: [...ids], locale: "en" as const };

describe("CostCalculator", () => {
  it("shows the default-team prices on first render", () => {
    render(<CostCalculator {...props} />);
    expect(screen.getByText("$149.97")).toBeInTheDocument();
    expect(screen.getByText("$282.75")).toBeInTheDocument();
    expect(screen.getByText("$18.00")).toBeInTheDocument();
    expect(screen.getAllByRole("table")).toHaveLength(3);
  });

  it("recomputes when employees per location change", () => {
    render(<CostCalculator {...props} />);
    fireEvent.change(screen.getByLabelText(en.calculator.employeesPerLocation), { target: { value: "40" } });
    expect(screen.getByText("$299.97")).toBeInTheDocument();
  });

  it("treats empty and negative locations as 1 without NaN or negatives", () => {
    const { container } = render(<CostCalculator {...props} />);
    const input = screen.getByLabelText(en.calculator.locations);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "-3" } });
    expect(container.textContent).not.toContain("NaN");
    expect(container.textContent).not.toContain("-$");
    expect(screen.getByText("$49.99")).toBeInTheDocument(); // Essentials, 1 location
  });

  it("marks doesn't-fit plans and the beta note", () => {
    render(<CostCalculator {...props} />);
    expect(screen.getAllByText(en.calculator.doesNotFit).length).toBeGreaterThan(0);
    expect(screen.getByText(en.calculator.sevenShiftsBeta)).toBeInTheDocument();
  });

  it("fills the checked-on date into the footnote", () => {
    const { container } = render(<CostCalculator {...props} />);
    expect(container.textContent).toContain("2026-11-04");
    expect(container.textContent).not.toContain("{date}");
  });

  it("renders Spanish copy", () => {
    render(<CostCalculator {...props} copy={es.calculator} locale="es" />);
    expect(screen.getByLabelText(es.calculator.locations)).toBeInTheDocument();
    expect(screen.getByText(es.calculator.sevenShiftsBeta)).toBeInTheDocument();
  });

  it("marks exactly one plan per table as highlighted, with text", () => {
    render(<CostCalculator {...props} />);
    const expected: Record<string, string> = { "Wiz Scheduler": "Pro", "7shifts": "Essentials", Deputy: "Core" };
    for (const table of screen.getAllByRole("table")) {
      const name = within(table).getByRole("caption").textContent ?? "";
      const flagged = within(table).getAllByText(en.calculator.highlightedLabel);
      expect(flagged).toHaveLength(1);
      expect(flagged[0].closest("th")?.textContent).toContain(expected[name]);
    }
  });

  it("shows doesn't-fit for 7shifts Comp at the default team", () => {
    render(<CostCalculator {...props} toolIds={["7shifts"]} />);
    const row = screen.getByRole("row", { name: /Comp/ });
    expect(within(row).getByText(en.calculator.doesNotFit)).toBeInTheDocument();
  });

  it("shows prices and the localized footnote in Spanish", () => {
    const { container } = render(<CostCalculator {...props} copy={es.calculator} locale="es" />);
    expect(screen.getByText("$149.97")).toBeInTheDocument();
    expect(container.textContent).toContain("Precios de lista");
    expect(container.textContent).toContain("2026-11-04");
  });

  it("floors fractional input and caps huge input without NaN", () => {
    const { container } = render(<CostCalculator {...props} toolIds={["7shifts"]} />);
    const input = screen.getByLabelText(en.calculator.locations);
    fireEvent.change(input, { target: { value: "2.7" } });
    expect(screen.getByText("$99.98")).toBeInTheDocument(); // 2 x 49.99
    fireEvent.change(input, { target: { value: "100000" } });
    expect(screen.getByText("$499,900.00")).toBeInTheDocument(); // capped at 10,000
    expect(container.textContent).not.toContain("NaN");
  });

  describe("footnote date", () => {
    const orig = TOOLS["7shifts"].checkedOn;
    afterEach(() => {
      TOOLS["7shifts"].checkedOn = orig;
    });
    it("uses the earliest checkedOn among shown tools", () => {
      TOOLS["7shifts"].checkedOn = "2026-10-01";
      const { container } = render(<CostCalculator {...props} />);
      expect(container.textContent).toContain("2026-10-01");
      expect(container.textContent).not.toContain("2026-11-04");
    });
  });
});
