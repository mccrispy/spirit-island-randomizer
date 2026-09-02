import { describe, expect, it } from "vitest";
import { TriState } from "../../engine/types";
import {
    applyBulkSelection,
    getVisibleSpiritCollections,
    type SpiritFilterState,
} from "./SpiritPoolTab";

const baseSpiritMap = {
    alpha: {
        spirit: {
            canonicalName: "alpha",
            name: "Alpha",
            spiritType: "Base Spirit",
            expansion: "Branch & Claw",
            complexityRating: "2",
        },
        aspects: [
            {
                canonicalName: "alpha-aspect",
                name: "Alpha Aspect",
                spiritType: "Aspect",
                expansion: "Branch & Claw",
                complexityModifier: "2",
                baseSpiritName: "alpha",
            },
        ],
    },
    beta: {
        spirit: {
            canonicalName: "beta",
            name: "Beta",
            spiritType: "Base Spirit",
            expansion: "Jagged Earth",
            complexityRating: "3",
        },
        aspects: [
            {
                canonicalName: "beta-aspect",
                name: "Beta Aspect",
                spiritType: "Aspect",
                expansion: "Jagged Earth",
                complexityModifier: "3",
                baseSpiritName: "beta",
            },
        ],
    },
} as any;

describe("SpiritPoolTab helpers", () => {
    it("filters visible spirits by expansion, complexity, and name", () => {
        const filters: SpiritFilterState = {
            expansions: new Set(["Branch & Claw"]),
            complexity: new Set(["2"]),
            name: "alp",
        };

        const { visibleBaseSpirits, visibleAspects } = getVisibleSpiritCollections(
            baseSpiritMap,
            filters,
        );

        expect(visibleBaseSpirits.map(({ spirit }) => spirit.canonicalName)).toEqual([
            "alpha",
        ]);
        expect(visibleAspects.map((aspect) => aspect.canonicalName)).toEqual([
            "alpha-aspect",
        ]);
    });

    it("base-only applies to the visible items when filters are active", () => {
        const baseSelection = {
            alpha: TriState.UNCHECKED,
            "alpha-aspect": TriState.CHECKED,
            beta: TriState.CHECKED,
            "beta-aspect": TriState.UNCHECKED,
        };

        const { visibleBaseSpirits, visibleAspects } = getVisibleSpiritCollections(
            baseSpiritMap,
            {
                expansions: new Set(["Branch & Claw"]),
                complexity: new Set(["2"]),
                name: "",
            },
        );

        const nextSelection = applyBulkSelection({
            selectionState: baseSelection,
            visibleBaseSpirits,
            visibleAspects,
            mode: "base-only",
        });

        expect(nextSelection.alpha).toBe(TriState.CHECKED);
        expect(nextSelection["alpha-aspect"]).toBe(TriState.UNCHECKED);
        expect(nextSelection.beta).toBe(TriState.CHECKED);
        expect(nextSelection["beta-aspect"]).toBe(TriState.UNCHECKED);
    });
});
