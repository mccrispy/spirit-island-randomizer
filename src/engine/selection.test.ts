import { describe, expect, it } from "vitest";
import type { BaseSpirit } from "../data/types";
import { TriState } from "./types";
import { normalizeForcedSpiritSelections } from "./selection";

const family: Record<string, BaseSpirit> = {
  base: {
    spirit: {
      canonicalName: "base",
      name: "Base",
      spiritType: "Base Spirit",
      expansion: "Base Game",
    },
    aspects: [
      {
        canonicalName: "aspect-a",
        name: "Aspect A",
        spiritType: "Aspect",
        expansion: "Base Game",
        baseSpiritName: "base",
      },
      {
        canonicalName: "aspect-b",
        name: "Aspect B",
        spiritType: "Aspect",
        expansion: "Base Game",
        baseSpiritName: "base",
      },
    ],
  },
};

describe("normalizeForcedSpiritSelections", () => {
  it("moves the forced state to the preferred family member", () => {
    const result = normalizeForcedSpiritSelections(
      {
        base: TriState.CHECKED,
        "aspect-a": TriState.INDETERMINATE,
        "aspect-b": TriState.INDETERMINATE,
      },
      family,
      "aspect-b",
    );

    expect(result).toEqual({
      base: TriState.CHECKED,
      "aspect-a": TriState.CHECKED,
      "aspect-b": TriState.INDETERMINATE,
    });
  });

  it("demotes conflicting saved forced states while preserving other selections", () => {
    const result = normalizeForcedSpiritSelections(
      {
        base: TriState.INDETERMINATE,
        "aspect-a": TriState.INDETERMINATE,
        "aspect-b": TriState.INDETERMINATE,
      },
      family,
    );

    expect(result).toEqual({
      base: TriState.INDETERMINATE,
      "aspect-a": TriState.CHECKED,
      "aspect-b": TriState.CHECKED,
    });
  });

  it("does not change a family with zero or one forced member", () => {
    const selection = {
      base: TriState.UNCHECKED,
      "aspect-a": TriState.CHECKED,
      "aspect-b": TriState.INDETERMINATE,
    };

    expect(normalizeForcedSpiritSelections(selection, family)).toEqual(selection);
  });
});
