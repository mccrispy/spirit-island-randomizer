import { describe, expect, it } from "vitest";
import {
  formatSpiritPoolLabel,
  getComplexityAbbreviation,
  getExpansionAbbreviation,
  getExpansionIndicator,
} from "./formatters";

describe("spirit display formatters", () => {
  it("formats base spirits with complexity and expansion indicators", () => {
    expect(
      formatSpiritPoolLabel({
        name: "River Surges in Sunlight",
        canonicalName: "RiverSurgesInSunlight",
        spiritType: "Base Spirit",
        complexityRating: "Low",
        expansion: "Base Game",
      }),
    ).toBe("River Surges in Sunlight (Low) [BG]");
  });

  it("formats aspects with their complexity modifier and expansion indicator", () => {
    expect(
      formatSpiritPoolLabel({
        name: "Regrowth",
        canonicalName: "Regrowth",
        spiritType: "Aspect",
        complexityModifier: "+",
        expansion: "Nature Incarnate",
      }),
    ).toBe("Regrowth (+) [NI]");
  });

  it("falls back to the full expansion name when no abbreviation is known", () => {
    expect(getExpansionAbbreviation("Unknown Expansion")).toBe(
      "Unknown Expansion",
    );
  });

  it("formats one or multiple expansion indicators with full-name tooltips", () => {
    expect(getExpansionIndicator("Jagged Earth")).toEqual({
      label: "[JE]",
      title: "Expansion: Jagged Earth",
    });
    expect(getExpansionIndicator(["Base Game", "Jagged Earth"])).toEqual({
      label: "[BG, JE]",
      title: "Expansions: Base Game, Jagged Earth",
    });
  });

  it("abbreviates complexity labels and preserves unknown labels", () => {
    expect(getComplexityAbbreviation("Very High")).toBe("VH");
    expect(getComplexityAbbreviation("Unrated")).toBe("Unrated");
  });
});
