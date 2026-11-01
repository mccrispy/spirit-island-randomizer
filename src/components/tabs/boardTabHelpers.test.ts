import { describe, expect, it } from "vitest";
import { TriState } from "../../engine/types";
import {
    applyBulkPoolSelection,
    getBoardCompatibilityPairClass,
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

    it("assigns the same color class to reciprocal board pairings", () => {
        for (const [firstBoard, secondBoard, className] of [
            ["A", "H", "board-pair-ah"],
            ["B", "E", "board-pair-be"],
            ["C", "G", "board-pair-cg"],
            ["D", "F", "board-pair-df"],
        ]) {
            expect(
                getBoardCompatibilityPairClass({
                    canonicalName: firstBoard,
                    name: firstBoard,
                    incompatibleBoards: [secondBoard],
                } as any),
            ).toBe(className);
            expect(
                getBoardCompatibilityPairClass({
                    canonicalName: secondBoard,
                    name: secondBoard,
                    incompatibleBoards: [firstBoard],
                } as any),
            ).toBe(className);
        }

        expect(
            getBoardCompatibilityPairClass({
                canonicalName: "A",
                name: "A",
                incompatibleBoards: [],
            } as any),
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
