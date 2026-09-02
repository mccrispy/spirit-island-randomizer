import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { createSeededRng, generateSetup } from "./randomizer";
import { loadAllData } from "../data/loader";
import { TriState } from "./types";
import { mapPythonSelectionState, mapPythonSettingsState } from "../fixtures/python_state_adapter";
import { buildDefaultSelectionState, settingsToExpansions } from "../persistence";
import selectionStateFixture from "../fixtures/python_state/selection_state.json";
import settingsStateFixture from "../fixtures/python_state/settings_state.json";
import type { AppData } from "../data/types";

const sampleData: AppData = {
    spirits: [
        {
            name: "Test Spirit",
            canonicalName: "test-spirit",
            spiritType: "Base Spirit",
            expansion: "Base Game",
            hasAspects: true,
        },
        {
            name: "Optional Spirit",
            canonicalName: "optional-spirit",
            spiritType: "Base Spirit",
            expansion: "Base Game",
            hasAspects: true,
        },
    ],
    aspects: [
        {
            name: "Test Aspect",
            canonicalName: "test-aspect",
            spiritType: "Aspect",
            expansion: "Base Game",
            baseSpiritName: "test-spirit",
        },
        {
            name: "Optional Aspect",
            canonicalName: "optional-aspect",
            spiritType: "Aspect",
            expansion: "Base Game",
            baseSpiritName: "optional-spirit",
        },
    ],
    boards: [
        {
            name: "Test Board",
            canonicalName: "test-board",
            sides: [
                {
                    sideType: "A",
                    identifier: "A",
                    canonicalName: "test-board-a",
                    lands: [],
                    incompatibleBoards: [],
                },
            ],
            expansions: ["Base Game"],
            incompatibleBoards: [],
        },
        {
            name: "Optional Board",
            canonicalName: "optional-board",
            sides: [
                {
                    sideType: "A",
                    identifier: "A",
                    canonicalName: "optional-board-a",
                    lands: [],
                    incompatibleBoards: [],
                },
            ],
            expansions: ["Base Game"],
            incompatibleBoards: [],
        },
    ],
    adversaries: [
        {
            name: "Test Adversary",
            canonicalName: "test-adversary",
            expansion: "Base Game",
            levels: [{ Easy: {} }],
        },
        {
            name: "Optional Adversary",
            canonicalName: "optional-adversary",
            expansion: "Base Game",
            levels: [{ Easy: {} }],
        },
    ],
    scenarios: [
        {
            name: "Test Scenario",
            canonicalName: "test-scenario",
            expansion: "Base Game",
        },
        {
            name: "Optional Scenario",
            canonicalName: "optional-scenario",
            expansion: "Base Game",
        },
    ],
    baseSpiritMap: {
        "test-spirit": {
            spirit: {
                name: "Test Spirit",
                canonicalName: "test-spirit",
                spiritType: "Base Spirit",
                expansion: "Base Game",
                hasAspects: true,
            },
            aspects: [
                {
                    name: "Test Aspect",
                    canonicalName: "test-aspect",
                    spiritType: "Aspect",
                    expansion: "Base Game",
                    baseSpiritName: "test-spirit",
                },
            ],
        },
        "optional-spirit": {
            spirit: {
                name: "Optional Spirit",
                canonicalName: "optional-spirit",
                spiritType: "Base Spirit",
                expansion: "Base Game",
                hasAspects: true,
            },
            aspects: [
                {
                    name: "Optional Aspect",
                    canonicalName: "optional-aspect",
                    spiritType: "Aspect",
                    expansion: "Base Game",
                    baseSpiritName: "optional-spirit",
                },
            ],
        },
    },
    layouts: [
        {
            name: "Test Layout",
            canonicalName: "test-layout",
            validBoardCounts: [1, 2],
            templates: [
                {
                    boardCounts: [1, 2],
                    pairs: "1-2",
                },
            ],
            svgFile: "test.svg",
            description: "A single-board layout",
        },
    ],
};

const runWithTrace = (...args: Parameters<typeof generateSetup>) => {
    const [data, options, rng] = args;
    const result = generateSetup(data, options, rng);
    if (process.env.ENGINE_TRACE) {
        console.log("ENGINE_TRACE INPUT:", JSON.stringify({ data, options }, null, 2));
        console.log("ENGINE_TRACE OUTPUT:", JSON.stringify(result, null, 2));
    }
    return result;
};

const defaultSelectionState = {
    "test-spirit": TriState.CHECKED,
    "optional-spirit": TriState.CHECKED,
    "test-aspect": TriState.CHECKED,
    "optional-aspect": TriState.CHECKED,
    "test-board": TriState.CHECKED,
    "optional-board": TriState.CHECKED,
    "test-adversary": TriState.CHECKED,
    "optional-adversary": TriState.CHECKED,
    "test-scenario": TriState.CHECKED,
    "optional-scenario": TriState.CHECKED,
};

describe("randomizer engine", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", async (input: RequestInfo) => {
            const url = typeof input === "string" ? input : input.url;
            if (!url.startsWith("/data/")) {
                throw new Error(`Unexpected fetch URL: ${url}`);
            }

            const filename = decodeURIComponent(url.slice("/data/".length));
            const path = resolve(process.cwd(), "public", "data", filename);
            const body = readFileSync(path, "utf-8");
            return new Response(body, {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        });
    });
    it("returns deterministic output with a seeded RNG", () => {
        const rng = createSeededRng(12345);
        const first = runWithTrace(sampleData, { expansions: ["Base Game"], selectionState: defaultSelectionState }, rng);
        const second = runWithTrace(
            sampleData,
            { expansions: ["Base Game"], selectionState: defaultSelectionState },
            createSeededRng(12345)
        );

        expect(first.selectedBoards[0].board.canonicalName).toBe(second.selectedBoards[0].board.canonicalName);
        expect(first.selectedSpirits[0].spirit.canonicalName).toBe(second.selectedSpirits[0].spirit.canonicalName);
        expect(first.adversary?.canonicalName).toBe(second.adversary?.canonicalName);
        expect(first.scenario?.canonicalName).toBe(second.scenario?.canonicalName);
        expect(first.layout?.canonicalName).toBe(second.layout?.canonicalName);
    });

    it("does not return an aspect when only the base spirit is selected", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                selectionState: {
                    ...defaultSelectionState,
                    "test-aspect": TriState.UNCHECKED,
                    "optional-aspect": TriState.UNCHECKED,
                },
            },
            createSeededRng(42)
        );

        expect(["test-spirit", "optional-spirit"]).toContain(result.selectedSpirits[0].spirit.canonicalName);
        expect(result.selectedSpirits[0].aspect).toBeUndefined();
    });

    it("can select an aspect when the aspect is checked in selectionState", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 1,
                selectionState: {
                    "test-spirit": TriState.UNCHECKED,
                    "test-aspect": TriState.CHECKED,
                    "optional-spirit": TriState.UNCHECKED,
                    "optional-aspect": TriState.UNCHECKED,
                },
            },
            createSeededRng(42)
        );

        expect(result.selectedSpirits[0].spirit.canonicalName).toBe("test-aspect");
        expect(result.selectedSpirits[0].aspect).toBeUndefined();
    });

    it("filters by expansions when options.expansions is set", () => {
        const result = runWithTrace(
            sampleData,
            { expansions: ["Base Game"], selectionState: defaultSelectionState },
            createSeededRng(101)
        );
        expect(result.selectedBoards[0].board.expansions).toContain("Base Game");
        expect(result.selectedSpirits[0].spirit.expansion).toBe("Base Game");
        expect(result.adversary?.expansion).toBe("Base Game");
        expect(result.scenario?.expansion).toBe("Base Game");
    });

    it("selects a layout template when a layout is present", () => {
        const result = runWithTrace(
            sampleData,
            { expansions: ["Base Game"], selectionState: defaultSelectionState },
            createSeededRng(7)
        );
        expect(result.layout).not.toBeNull();
        expect(result.layoutTemplate).not.toBeNull();
        expect(result.layoutTemplate?.pairs).toBe("1-2");
    });

    it("honors a preferred layout for the resolved board count instead of picking randomly", () => {
        const twoLayoutData: AppData = {
            ...sampleData,
            layouts: [
                { ...sampleData.layouts[0], canonicalName: "layout-a" },
                { ...sampleData.layouts[0], canonicalName: "layout-b" },
            ],
        };

        for (const seed of [1, 2, 3, 4, 5]) {
            const result = runWithTrace(
                twoLayoutData,
                {
                    expansions: ["Base Game"],
                    numSpirits: 2,
                    selectionState: defaultSelectionState,
                    preferredLayouts: { "2": "layout-b" },
                },
                createSeededRng(seed)
            );
            expect(result.layout?.canonicalName).toBe("layout-b");
        }
    });

    it("falls back to random selection when the preferred layout isn't valid for the resolved board count", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 2,
                selectionState: defaultSelectionState,
                preferredLayouts: { "2": "layout-that-does-not-exist" },
            },
            createSeededRng(7)
        );
        expect(result.layout?.canonicalName).toBe("test-layout");
    });

    it("never selects a layout in thematic mode, even when a preferred layout is set (PRM parity)", async () => {
        const data = await loadAllData();
        const selectionState = buildDefaultSelectionState(data);
        const result = runWithTrace(
            data,
            {
                numSpirits: 1,
                useThematicBoards: true,
                selectionState,
                preferredLayouts: { "1": "standard" },
            },
            createSeededRng(305)
        );
        expect(result.layout).toBeNull();
        expect(result.boardPositions).toBeNull();
        expect(result.layoutUrlString).toBeNull();
    });

    it("throws when selectionState is missing to match strict Python parity", () => {
        expect(() =>
            runWithTrace(
                sampleData,
                {
                    expansions: ["Base Game"],
                    numSpirits: 1,
                },
                createSeededRng(5)
            )
        ).toThrow("selectionState is required for spirit selection parity with Python");
    });

    it("drops the additional board and sets a warning when thematic mode reaches 7 total boards (PRM parity)", async () => {
        const data = await loadAllData();
        const selectionState = buildDefaultSelectionState(data);
        const result = runWithTrace(
            data,
            {
                numSpirits: 6,
                includeAdditionalBoard: true,
                useThematicBoards: true,
                strictBoardCompatibility: false,
                selectionState,
            },
            createSeededRng(303)
        );

        expect(result.selectedBoards).toHaveLength(6);
        expect(result.selectedAdditionalBoard).toBeNull();
        expect(result.additionalBoardDroppedWarning).toBe(true);
    });

    it("does not set the additional-board-dropped warning when thematic mode has 6 or fewer total boards", async () => {
        const data = await loadAllData();
        const selectionState = buildDefaultSelectionState(data);
        const result = runWithTrace(
            data,
            {
                numSpirits: 1,
                includeAdditionalBoard: false,
                useThematicBoards: true,
                selectionState,
            },
            createSeededRng(304)
        );

        expect(result.additionalBoardDroppedWarning).toBe(false);
    });

    it("marks forced spirits as forced and optional spirits as not forced", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 2,
                selectionState: {
                    "test-spirit": TriState.UNCHECKED,
                    "test-aspect": TriState.INDETERMINATE,
                    "optional-spirit": TriState.CHECKED,
                    "optional-aspect": TriState.UNCHECKED,
                },
            },
            createSeededRng(88)
        );

        const forcedSpirit = result.selectedSpirits.find((s) => s.spirit.canonicalName === "test-aspect");
        const optionalSpirit = result.selectedSpirits.find((s) => s.spirit.canonicalName === "optional-spirit");
        expect(forcedSpirit?.forced).toBe(true);
        expect(optionalSpirit?.forced).toBe(false);
    });

    it("marks forced boards as forced and optional boards as not forced", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 1,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                    "test-board": TriState.CHECKED,
                    "optional-board": TriState.INDETERMINATE,
                },
            },
            createSeededRng(17)
        );

        expect(result.selectedBoards[0].board.canonicalName).toBe("optional-board");
        expect(result.selectedBoards[0].forced).toBe(true);
    });

    it("marks forced adversary as forced", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 1,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                    "optional-adversary": TriState.INDETERMINATE,
                },
            },
            createSeededRng(23)
        );

        expect(result.adversary?.canonicalName).toBe("optional-adversary");
        expect(result.adversaryForced).toBe(true);
    });

    it("marks randomly selected adversary as not forced", () => {
        const result = runWithTrace(
            sampleData,
            { expansions: ["Base Game"], selectionState: defaultSelectionState },
            createSeededRng(23)
        );

        expect(result.adversaryForced).toBe(false);
    });

    it("marks forced scenario as forced", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 1,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                    "optional-scenario": TriState.INDETERMINATE,
                },
            },
            createSeededRng(31)
        );

        expect(result.scenario?.canonicalName).toBe("optional-scenario");
        expect(result.scenarioForced).toBe(true);
    });

    it("populates board positions and layout URL string for templated layouts", () => {
        const layoutData: AppData = {
            ...sampleData,
            layouts: [
                {
                    name: "Coastline",
                    canonicalName: "coastline",
                    validBoardCounts: [2],
                    templates: [
                        {
                            boardCounts: [2],
                            pairs: "1.0:2.2",
                        },
                    ],
                    svgFile: "coastline.svg",
                    description: "",
                },
            ],
        };

        const result = runWithTrace(
            layoutData,
            {
                expansions: ["Base Game"],
                numSpirits: 2,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                    "optional-spirit": TriState.CHECKED,
                },
            },
            createSeededRng(13)
        );

        expect(result.boardPositions).not.toBeNull();
        expect(Object.keys(result.boardPositions ?? {})).toHaveLength(2);
        expect(["test-board0:optional-board2", "optional-board0:test-board2"]).toContain(result.layoutUrlString);
    });

    it("sets board positions but empty layout URL for standard layout template", () => {
        const standardLayoutData: AppData = {
            ...sampleData,
            layouts: [
                {
                    name: "Standard",
                    canonicalName: "standard",
                    validBoardCounts: [2],
                    templates: [
                        {
                            boardCounts: [2],
                            pairs: "",
                        },
                    ],
                    svgFile: "standard.svg",
                    description: "",
                },
            ],
        };

        const result = runWithTrace(
            standardLayoutData,
            {
                expansions: ["Base Game"],
                numSpirits: 2,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                    "optional-spirit": TriState.CHECKED,
                },
            },
            createSeededRng(13)
        );

        expect(result.boardPositions).not.toBeNull();
        expect(Object.keys(result.boardPositions ?? {})).toHaveLength(2);
        expect(result.layoutUrlString).toBe("");
    });

    it("honors forced spirit selection state and selects exactly one spirit per family", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 1,
                selectionState: {
                    "test-spirit": TriState.UNCHECKED,
                    "test-aspect": TriState.INDETERMINATE,
                    "optional-spirit": TriState.UNCHECKED,
                    "optional-aspect": TriState.CHECKED,
                },
            },
            createSeededRng(12)
        );

        expect(result.selectedSpirits).toHaveLength(1);
        expect(result.selectedSpirits[0].spirit.canonicalName).toBe("test-aspect");
        expect(result.selectedSpirits[0].aspect).toBeUndefined();
    });

    it("selects one spirit per family when multiple families are available", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 2,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                    "optional-spirit": TriState.CHECKED,
                },
            },
            createSeededRng(21)
        );

        expect(result.selectedSpirits).toHaveLength(2);
        const selectedNames = result.selectedSpirits.map((choice) => choice.spirit.canonicalName);
        expect(selectedNames).toContain("test-spirit");
        expect(selectedNames).toContain("optional-spirit");
    });

    it("maps wrapped Python selection state fixtures", () => {
        const mapped = mapPythonSelectionState(selectionStateFixture as any);

        expect(mapped.RiverSurgesInSunlight).toBe(TriState.CHECKED);
        expect(mapped.LightningsSwiftStrike).toBe(TriState.CHECKED);
        expect(mapped.ASpreadOfRampantGreen).toBe(TriState.CHECKED);
        expect(mapped.DancesUpEarthquakes).toBe(TriState.CHECKED);
        expect(mapped).not.toHaveProperty("selection_state");
    });

    it("runs with the Python persisted selection/settings files using loaded game data", async () => {
        const data = await loadAllData();
        const selectionState = mapPythonSelectionState(selectionStateFixture as any);
        const settings = mapPythonSettingsState(settingsStateFixture as any);
        const options = { ...settings, expansions: settingsToExpansions(settings), selectionState };
        const result = runWithTrace(data, options, createSeededRng(99));

        expect(result.options.numSpirits).toBe(settingsStateFixture.num_spirits);
        expect(result.options.expansions).toContain("Branch & Claw");
        expect(result.options.expansions).toContain("Jagged Earth");
        expect(result.options.useScenarios).toBe(settingsStateFixture.use_scenarios);
        expect(result.options.useAdversaries).toBe(settingsStateFixture.use_adversaries);
        expect(result.selectedSpirits.length).toBeGreaterThan(0);
        expect(result.selectedBoards.length).toBeGreaterThan(0);
        expect(result.adversary === null).toBe(settingsStateFixture.use_adversaries === false);
        expect(result.scenario === null).toBe(settingsStateFixture.use_scenarios === false);
    });

    it("selects one spirit when both a base spirit and its aspect are optionally selected", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 1,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                    "test-aspect": TriState.CHECKED,
                    "optional-spirit": TriState.UNCHECKED,
                    "optional-aspect": TriState.UNCHECKED,
                },
            },
            createSeededRng(53)
        );

        expect(result.selectedSpirits).toHaveLength(1);
        expect(["test-spirit", "test-aspect"]).toContain(result.selectedSpirits[0].spirit.canonicalName);
    });

    it("throws when too many spirits are forced for the selected spirit count", () => {
        expect(() =>
            runWithTrace(
                sampleData,
                {
                    expansions: ["Base Game"],
                    numSpirits: 1,
                    selectionState: {
                        "test-aspect": TriState.INDETERMINATE,
                        "optional-aspect": TriState.INDETERMINATE,
                    },
                },
                createSeededRng(31)
            )
        ).toThrow("Too many forced spirits");
    });

    it("throws when selectionState leaves too few eligible spirit families", () => {
        expect(() =>
            runWithTrace(
                sampleData,
                {
                    expansions: ["Base Game"],
                    numSpirits: 2,
                    selectionState: {
                        "test-aspect": TriState.INDETERMINATE,
                        "optional-spirit": TriState.UNCHECKED,
                    },
                },
                createSeededRng(11)
            )
        ).toThrow("Not enough spirit families available");
    });

    it("honors forced board selection state", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 1,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                    "test-board": TriState.CHECKED,
                    "optional-board": TriState.INDETERMINATE,
                },
            },
            createSeededRng(17)
        );

        expect(result.selectedBoards).toHaveLength(1);
        expect(result.selectedBoards[0].board.canonicalName).toBe("optional-board");
    });

    it("throws when too many boards are forced for the selected spirit count", () => {
        expect(() =>
            runWithTrace(
                sampleData,
                {
                    expansions: ["Base Game"],
                    numSpirits: 1,
                    selectionState: {
                        "test-spirit": TriState.CHECKED,
                        "test-board": TriState.INDETERMINATE,
                        "optional-board": TriState.INDETERMINATE,
                    },
                },
                createSeededRng(19)
            )
        ).toThrow("Too many forced boards");
    });

    it("honors forced adversary selection state", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 1,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                    "test-adversary": TriState.CHECKED,
                    "optional-adversary": TriState.INDETERMINATE,
                },
            },
            createSeededRng(23)
        );

        expect(result.adversary?.canonicalName).toBe("optional-adversary");
    });

    it("throws when multiple adversaries are forced", () => {
        expect(() =>
            runWithTrace(
                sampleData,
                {
                    expansions: ["Base Game"],
                    numSpirits: 1,
                    selectionState: {
                        "test-spirit": TriState.CHECKED,
                        "test-adversary": TriState.INDETERMINATE,
                        "optional-adversary": TriState.INDETERMINATE,
                    },
                },
                createSeededRng(29)
            )
        ).toThrow("Too many forced adversaries");
    });

    it("honors forced scenario selection state", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 1,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                    "test-scenario": TriState.CHECKED,
                    "optional-scenario": TriState.INDETERMINATE,
                },
            },
            createSeededRng(31)
        );

        expect(result.scenario?.canonicalName).toBe("optional-scenario");
    });

    it("omits adversary when useAdversaries is disabled", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 1,
                useAdversaries: false,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                },
            },
            createSeededRng(73)
        );

        expect(result.adversary).toBeNull();
    });

    it("omits scenario when useScenarios is disabled", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 1,
                useScenarios: false,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                },
            },
            createSeededRng(79)
        );

        expect(result.scenario).toBeNull();
    });

    it("throws when multiple scenarios are forced", () => {
        expect(() =>
            runWithTrace(
                sampleData,
                {
                    expansions: ["Base Game"],
                    numSpirits: 1,
                    selectionState: {
                        "test-spirit": TriState.CHECKED,
                        "test-scenario": TriState.INDETERMINATE,
                        "optional-scenario": TriState.INDETERMINATE,
                    },
                },
                createSeededRng(37)
            )
        ).toThrow("Too many forced scenarios");
    });

    it("selects an additional board when includeAdditionalBoard is enabled", () => {
        const result = runWithTrace(
            sampleData,
            {
                expansions: ["Base Game"],
                numSpirits: 1,
                includeAdditionalBoard: true,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                },
            },
            createSeededRng(41)
        );

        expect(result.selectedAdditionalBoard).toBeDefined();
        expect(result.selectedAdditionalBoard).not.toBeNull();
        expect(result.selectedAdditionalBoard?.board.canonicalName).not.toBe(
            result.selectedBoards[0].board.canonicalName
        );
    });

    it("throws when strict compatibility cannot find a compatible additional board", () => {
        const strictData: AppData = {
            ...sampleData,
            boards: [
                {
                    ...sampleData.boards[0],
                    canonicalName: "strict-board-a",
                    incompatibleBoards: ["strict-board-b"],
                },
                {
                    ...sampleData.boards[1],
                    canonicalName: "strict-board-b",
                    incompatibleBoards: ["strict-board-a"],
                },
            ],
        };

        expect(() =>
            runWithTrace(
                strictData,
                {
                    expansions: ["Base Game"],
                    numSpirits: 1,
                    includeAdditionalBoard: true,
                    strictBoardCompatibility: true,
                    selectionState: {
                        "test-spirit": TriState.CHECKED,
                    },
                },
                createSeededRng(43)
            )
        ).toThrow("Could not find a compatible additional board");
    });

    it("uses fixed thematic board combinations", () => {
        const thematicData: AppData = {
            ...sampleData,
            boards: [
                {
                    name: "Board NW",
                    canonicalName: "board-nw",
                    sides: [
                        {
                            sideType: "standard",
                            identifier: "A",
                            canonicalName: "board-nw-a",
                            lands: [],
                            incompatibleBoards: [],
                        },
                        {
                            sideType: "thematic",
                            identifier: "North West",
                            canonicalName: "NorthWest",
                            lands: [],
                            incompatibleBoards: [],
                        },
                    ],
                    expansions: ["Base Game"],
                    incompatibleBoards: [],
                },
                {
                    name: "Board NE",
                    canonicalName: "board-ne",
                    sides: [
                        {
                            sideType: "standard",
                            identifier: "B",
                            canonicalName: "board-ne-b",
                            lands: [],
                            incompatibleBoards: [],
                        },
                        {
                            sideType: "thematic",
                            identifier: "North East",
                            canonicalName: "NorthEast",
                            lands: [],
                            incompatibleBoards: [],
                        },
                    ],
                    expansions: ["Base Game"],
                    incompatibleBoards: [],
                },
                {
                    name: "Board West",
                    canonicalName: "board-west",
                    sides: [
                        {
                            sideType: "standard",
                            identifier: "C",
                            canonicalName: "board-west-c",
                            lands: [],
                            incompatibleBoards: [],
                        },
                        {
                            sideType: "thematic",
                            identifier: "West",
                            canonicalName: "West",
                            lands: [],
                            incompatibleBoards: [],
                        },
                    ],
                    expansions: ["Base Game"],
                    incompatibleBoards: [],
                },
                {
                    name: "Board East",
                    canonicalName: "board-east",
                    sides: [
                        {
                            sideType: "standard",
                            identifier: "D",
                            canonicalName: "board-east-d",
                            lands: [],
                            incompatibleBoards: [],
                        },
                        {
                            sideType: "thematic",
                            identifier: "East",
                            canonicalName: "East",
                            lands: [],
                            incompatibleBoards: [],
                        },
                    ],
                    expansions: ["Base Game"],
                    incompatibleBoards: [],
                },
            ],
        };

        const result = runWithTrace(
            thematicData,
            {
                expansions: ["Base Game"],
                numSpirits: 2,
                useThematicBoards: true,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                    "optional-spirit": TriState.CHECKED,
                },
            },
            createSeededRng(47)
        );

        const boardIdentifiers = result.selectedBoards.map((choice) => choice.boardSide.identifier);
        expect(boardIdentifiers).toEqual(["West", "East"]);
    });

    it("throws when thematic combination cannot be satisfied", () => {
        const missingThematicData: AppData = {
            ...sampleData,
            boards: [sampleData.boards[0]],
        };

        expect(() =>
            runWithTrace(
                missingThematicData,
                {
                    expansions: ["Base Game"],
                    numSpirits: 1,
                    useThematicBoards: true,
                    selectionState: {
                        "test-spirit": TriState.CHECKED,
                    },
                },
                createSeededRng(53)
            )
        ).toThrow("Could not find board with thematic side");
    });

    it("throws when strict thematic boards are incompatible", () => {
        const incompatibleThematicData: AppData = {
            ...sampleData,
            boards: [
                {
                    name: "Board West",
                    canonicalName: "board-west",
                    sides: [
                        {
                            sideType: "standard",
                            identifier: "C",
                            canonicalName: "board-west-c",
                            lands: [],
                            incompatibleBoards: ["board-east"],
                        },
                        {
                            sideType: "thematic",
                            identifier: "West",
                            canonicalName: "West",
                            lands: [],
                            incompatibleBoards: ["board-east"],
                        },
                    ],
                    expansions: ["Base Game"],
                    incompatibleBoards: ["board-east"],
                },
                {
                    name: "Board East",
                    canonicalName: "board-east",
                    sides: [
                        {
                            sideType: "standard",
                            identifier: "D",
                            canonicalName: "board-east-d",
                            lands: [],
                            incompatibleBoards: ["board-west"],
                        },
                        {
                            sideType: "thematic",
                            identifier: "East",
                            canonicalName: "East",
                            lands: [],
                            incompatibleBoards: ["board-west"],
                        },
                    ],
                    expansions: ["Base Game"],
                    incompatibleBoards: ["board-west"],
                },
            ],
        };

        expect(() =>
            runWithTrace(
                incompatibleThematicData,
                {
                    expansions: ["Base Game"],
                    numSpirits: 2,
                    useThematicBoards: true,
                    strictBoardCompatibility: true,
                    selectionState: {
                        "test-spirit": TriState.CHECKED,
                        "optional-spirit": TriState.CHECKED,
                    },
                },
                createSeededRng(59)
            )
        ).toThrow("Selected thematic boards are not compatible");
    });

    it("uses standard board sides when thematic mode is disabled", () => {
        const mixedSidesData: AppData = {
            ...sampleData,
            boards: [
                {
                    name: "Mixed Board A",
                    canonicalName: "mixed-board-a",
                    sides: [
                        {
                            sideType: "standard",
                            identifier: "A",
                            canonicalName: "mixed-board-a-standard",
                            lands: [],
                            incompatibleBoards: [],
                        },
                        {
                            sideType: "thematic",
                            identifier: "North East",
                            canonicalName: "mixed-board-a-thematic",
                            lands: [],
                            incompatibleBoards: [],
                        },
                    ],
                    expansions: ["Base Game"],
                    incompatibleBoards: [],
                },
                {
                    name: "Mixed Board B",
                    canonicalName: "mixed-board-b",
                    sides: [
                        {
                            sideType: "standard",
                            identifier: "B",
                            canonicalName: "mixed-board-b-standard",
                            lands: [],
                            incompatibleBoards: [],
                        },
                        {
                            sideType: "thematic",
                            identifier: "West",
                            canonicalName: "mixed-board-b-thematic",
                            lands: [],
                            incompatibleBoards: [],
                        },
                    ],
                    expansions: ["Base Game"],
                    incompatibleBoards: [],
                },
            ],
        };

        const result = runWithTrace(
            mixedSidesData,
            {
                expansions: ["Base Game"],
                numSpirits: 2,
                useThematicBoards: false,
                selectionState: {
                    "test-spirit": TriState.CHECKED,
                    "optional-spirit": TriState.CHECKED,
                },
            },
            createSeededRng(71)
        );

        expect(result.selectedBoards.every((selected) => selected.boardSide.sideType === "standard")).toBe(true);
    });

    it("enforces strict board compatibility even with fewer than five eligible boards", () => {
        const strictSmallPoolData: AppData = {
            ...sampleData,
            boards: [
                {
                    name: "Board One",
                    canonicalName: "board-one",
                    sides: [
                        {
                            sideType: "standard",
                            identifier: "A",
                            canonicalName: "board-one-a",
                            lands: [],
                            incompatibleBoards: ["board-two", "board-three"],
                        },
                    ],
                    expansions: ["Base Game"],
                    incompatibleBoards: ["board-two", "board-three"],
                },
                {
                    name: "Board Two",
                    canonicalName: "board-two",
                    sides: [
                        {
                            sideType: "standard",
                            identifier: "B",
                            canonicalName: "board-two-b",
                            lands: [],
                            incompatibleBoards: ["board-one", "board-three"],
                        },
                    ],
                    expansions: ["Base Game"],
                    incompatibleBoards: ["board-one", "board-three"],
                },
                {
                    name: "Board Three",
                    canonicalName: "board-three",
                    sides: [
                        {
                            sideType: "standard",
                            identifier: "C",
                            canonicalName: "board-three-c",
                            lands: [],
                            incompatibleBoards: ["board-one", "board-two"],
                        },
                    ],
                    expansions: ["Base Game"],
                    incompatibleBoards: ["board-one", "board-two"],
                },
            ],
        };

        expect(() =>
            runWithTrace(
                strictSmallPoolData,
                {
                    expansions: ["Base Game"],
                    numSpirits: 2,
                    strictBoardCompatibility: true,
                    selectionState: {
                        "test-spirit": TriState.CHECKED,
                        "optional-spirit": TriState.CHECKED,
                    },
                },
                createSeededRng(61)
            )
        ).toThrow("Could not find 2 compatible boards");
    });

    it("filters selected spirit families by expansions", () => {
        const expansionSpiritData: AppData = {
            ...sampleData,
            spirits: [
                {
                    ...sampleData.spirits[0],
                    canonicalName: "base-only-spirit",
                    expansion: "Base Game",
                },
                {
                    ...sampleData.spirits[1],
                    canonicalName: "je-only-spirit",
                    expansion: "Jagged Earth",
                },
            ],
            baseSpiritMap: {
                "base-only-spirit": {
                    spirit: {
                        ...sampleData.baseSpiritMap["test-spirit"].spirit,
                        canonicalName: "base-only-spirit",
                        expansion: "Base Game",
                    },
                    aspects: [],
                },
                "je-only-spirit": {
                    spirit: {
                        ...sampleData.baseSpiritMap["optional-spirit"].spirit,
                        canonicalName: "je-only-spirit",
                        expansion: "Jagged Earth",
                    },
                    aspects: [],
                },
            },
        };

        expect(() =>
            runWithTrace(
                expansionSpiritData,
                {
                    expansions: ["Base Game"],
                    numSpirits: 1,
                    selectionState: {
                        "base-only-spirit": TriState.UNCHECKED,
                        "je-only-spirit": TriState.CHECKED,
                    },
                },
                createSeededRng(67)
            )
        ).toThrow("Not enough spirit families available");
    });
});
