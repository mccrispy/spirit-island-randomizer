import { describe, expect, it } from "vitest";
import type { AppData, Spirit } from "./data/types";
import { TriState } from "./engine/types";
import { buildDefaultSelectionState, defaultSettings } from "./persistence";

function item(
    canonicalName: string,
    expansion: string,
    spiritType: Spirit["spiritType"] = "Base Spirit",
): Spirit {
    return { name: canonicalName, canonicalName, expansion, spiritType };
}

const data: AppData = {
    spirits: [
        item("base-spirit", "Base Game"),
        item("branch-spirit", "Branch & Claw"),
        item("feather-spirit", "Feather & Flame"),
        item("jagged-spirit", "Jagged Earth"),
        item("horizons-spirit", "Horizons of Spirit Island"),
        item("nature-spirit", "Nature Incarnate"),
    ],
    aspects: [item("base-aspect", "Base Game", "Aspect")],
    boards: [],
    adversaries: [
        { canonicalName: "branch-adversary", name: "Branch", expansion: "Branch & Claw", levels: [] },
        { canonicalName: "nature-adversary", name: "Nature", expansion: "Nature Incarnate", levels: [] },
    ],
    scenarios: [
        { canonicalName: "jagged-scenario", name: "Jagged", expansion: "Jagged Earth" },
        { canonicalName: "horizons-scenario", name: "Horizons", expansion: "Horizons of Spirit Island" },
    ],
    baseSpiritMap: {},
    layouts: [],
};

describe("first-run defaults", () => {
    it("selects the requested game content and leaves all aspects unchecked", () => {
        const selection = buildDefaultSelectionState(data);

        expect(selection["base-spirit"]).toBe(TriState.CHECKED);
        expect(selection["branch-spirit"]).toBe(TriState.CHECKED);
        expect(selection["feather-spirit"]).toBe(TriState.CHECKED);
        expect(selection["jagged-spirit"]).toBe(TriState.CHECKED);
        expect(selection["horizons-spirit"]).toBe(TriState.UNCHECKED);
        expect(selection["nature-spirit"]).toBe(TriState.UNCHECKED);
        expect(selection["base-aspect"]).toBe(TriState.UNCHECKED);
        expect(selection["branch-adversary"]).toBe(TriState.CHECKED);
        expect(selection["nature-adversary"]).toBe(TriState.UNCHECKED);
        expect(selection["jagged-scenario"]).toBe(TriState.CHECKED);
        expect(selection["horizons-scenario"]).toBe(TriState.UNCHECKED);
    });

    it("uses the requested first-run settings", () => {
        expect(defaultSettings()).toMatchObject({
            numSpirits: 1,
            includeAdditionalBoard: false,
            useThematicBoards: false,
            useAdversaries: true,
            useScenarios: false,
            useEvents: true,
            strictBoardCompatibility: true,
            expansionBranchClaw: true,
            expansionJaggedEarth: true,
            expansionNatureIncarnate: true,
            preferredLayouts: {},
            selectedLayouts: {},
        });
    });
});