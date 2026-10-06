import { describe, expect, it } from "vitest";
import { TriState } from "../../engine/types";
import {
    applyBulkSelection,
    getAspectSelectionSummary,
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
            {
                canonicalName: "alpha-aspect-forced",
                name: "Alternate Form",
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
    it("summarizes included and forced aspects and ignores excluded aspects", () => {
        expect(
            getAspectSelectionSummary(baseSpiritMap.alpha.aspects, {
                "alpha-aspect": TriState.CHECKED,
                "alpha-aspect-forced": TriState.INDETERMINATE,
            }),
        ).toEqual({ inPool: 2, forced: 1 });
        expect(
            getAspectSelectionSummary(baseSpiritMap.alpha.aspects, {
                "alpha-aspect": TriState.INDETERMINATE,
            }),
        ).toEqual({ inPool: 1, forced: 1 });
        expect(
            getAspectSelectionSummary(baseSpiritMap.alpha.aspects, {
                "alpha-aspect": TriState.UNCHECKED,
            }),
        ).toEqual({ inPool: 0, forced: 0 });
    });

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

    it("does not bulk-change a base spirit shown only as a matching aspect's container", () => {
        const selectionState = {
            alpha: TriState.INDETERMINATE,
            "alpha-aspect": TriState.UNCHECKED,
            beta: TriState.CHECKED,
            "beta-aspect": TriState.CHECKED,
        };
        const { displayedBaseSpirits, visibleBaseSpirits, visibleAspects } =
            getVisibleSpiritCollections(baseSpiritMap, {
                expansions: new Set(),
                complexity: new Set(),
                name: "alpha aspect",
            });

        expect(displayedBaseSpirits.map(({ spirit }) => spirit.canonicalName)).toEqual([
            "alpha",
        ]);
        expect(visibleBaseSpirits).toEqual([]);
        expect(visibleAspects.map(({ canonicalName }) => canonicalName)).toEqual([
            "alpha-aspect",
        ]);

        const baseOnly = applyBulkSelection({
            selectionState,
            visibleBaseSpirits,
            visibleAspects,
            mode: "base-only",
        });
        expect(baseOnly.alpha).toBe(TriState.INDETERMINATE);
        expect(baseOnly["alpha-aspect"]).toBe(TriState.UNCHECKED);

        const aspectsOnly = applyBulkSelection({
            selectionState,
            visibleBaseSpirits,
            visibleAspects,
            mode: "aspects-only",
        });
        expect(aspectsOnly.alpha).toBe(TriState.INDETERMINATE);
        expect(aspectsOnly["alpha-aspect"]).toBe(TriState.CHECKED);

        const selectMatching = applyBulkSelection({
            selectionState,
            visibleBaseSpirits,
            visibleAspects,
            mode: "select-all",
        });
        expect(selectMatching.alpha).toBe(TriState.INDETERMINATE);
        expect(selectMatching["alpha-aspect"]).toBe(TriState.CHECKED);

        const deselectMatching = applyBulkSelection({
            selectionState,
            visibleBaseSpirits,
            visibleAspects,
            mode: "deselect-all",
        });
        expect(deselectMatching.alpha).toBe(TriState.INDETERMINATE);
        expect(deselectMatching["alpha-aspect"]).toBe(TriState.UNCHECKED);
    });
});
