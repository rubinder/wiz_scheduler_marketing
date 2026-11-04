import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CostCalculator from "../../src/islands/CostCalculator";
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
});
