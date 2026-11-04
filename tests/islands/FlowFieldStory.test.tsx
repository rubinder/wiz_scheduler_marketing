import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FlowFieldStory from "../../src/islands/FlowFieldStory";

describe("FlowFieldStory", () => {
  it("renders a decorative canvas hidden from assistive tech, even without 2D canvas support", () => {
    const { container } = render(<FlowFieldStory />);
    expect(container.querySelector('section[aria-hidden="true"] canvas')).not.toBeNull();
  });
});
