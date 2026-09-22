import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RotaHero from "../../src/islands/RotaHero";
import en from "../../src/i18n/en";

const rota = { shifts: en.home.rotaShifts, people: en.home.rotaPeople, violations: en.home.rotaViolations };

describe("RotaHero", () => {
  it("renders the headline, highlighted accent and the register link", () => {
    render(<RotaHero copy={en.landing} registerUrl="https://app.example.com/register" rota={rota} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.landing.heroTitle);
    expect(screen.getByText(en.landing.heroTitleAccent)).toHaveClass("bg-marker");
    expect(screen.getByRole("link", { name: en.landing.getStarted })).toHaveAttribute(
      "href",
      "https://app.example.com/register",
    );
  });

  it("keeps the decorative rota out of the accessibility tree", () => {
    const { container } = render(<RotaHero copy={en.landing} registerUrl="/r" rota={rota} />);
    expect(container.querySelector('[aria-hidden="true"] [data-total="shifts"]')).not.toBeNull();
  });
});
