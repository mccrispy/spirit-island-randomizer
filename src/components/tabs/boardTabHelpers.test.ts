import { describe, expect, it } from "vitest";
import { TriState } from "../../engine/types";
import {
    applyBulkPoolSelection,
    getBoardIncompatibilityLabel,
    sortAdversaries,
    sortBoards,
    sortScenarios,
} from "./BoardsAdversariesScenariosTab";

describe("BoardsAdversariesScenariosTab helpers", () => {
    it("sorts adversaries by difficulty ascending when requested", () => {
        const adversaries = [
            { canonicalName: "b", name: "B", levels: [{ Difficulty: 5 }] },
            { canonicalName: "a", name: "A", levels: [{ Difficulty: 2 }] },
            { canonicalName: "c", name: "C", levels: [{ Difficulty: 4 }] },
        ] as any;

        expect(sortAdversaries(adversaries, "difficulty").map((entry) => entry.canonicalName)).toEqual([
            "a",
            "c",
            "b",
        ]);
    });

    it("sorts scenarios alphabetically", () => {
        const scenarios = [
            { canonicalName: "zeta", name: "Zeta" },
            { canonicalName: "alpha", name: "Alpha" },
        ] as any;

        expect(sortScenarios(scenarios).map((entry) => entry.canonicalName)).toEqual([
            "alpha",
            "zeta",
        ]);
    });

    it("labels incompatible boards by display name", () => {
        const boards = [
            { canonicalName: "A", name: "Board A", incompatibleBoards: ["H"] },
            { canonicalName: "H", name: "Board H", incompatibleBoards: ["A"] },
        ] as any;

        expect(
            getBoardIncompatibilityLabel(sortBoards(boards)[0]),
        ).toBe("(no H)");
        expect(
            getBoardIncompatibilityLabel(
                { ...boards[0], incompatibleBoards: [] },
            ),
        ).toBeNull();
    });

    it("selects all board items when requested", () => {
        const next = applyBulkPoolSelection(
            {
                alpha: TriState.UNCHECKED,
                beta: TriState.CHECKED,
            },
            [
                { canonicalName: "alpha", name: "Alpha" },
                { canonicalName: "beta", name: "Beta" },
            ] as any,
            TriState.CHECKED,
        );

        expect(next.alpha).toBe(TriState.CHECKED);
        expect(next.beta).toBe(TriState.CHECKED);
    });
});
