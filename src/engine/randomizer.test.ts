import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { createSeededRng, generateSetup } from "./randomizer";
import { loadAllData } from "../data/loader";
import { TriState } from "./types";
import { mapPythonSelectionState, mapPythonSettingsState } from "../fixtures/python_state_adapter";
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
    ],
    scenarios: [
        {
            name: "Test Scenario",
            canonicalName: "test-scenario",
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
        const first = runWithTrace(sampleData, { expansions: ["Base Game"] }, rng);
        const second = runWithTrace(sampleData, { expansions: ["Base Game"] }, createSeededRng(12345));

        expect(first.selectedBoards[0].board.canonicalName).toBe(second.selectedBoards[0].board.canonicalName);
        expect(first.selectedSpirits[0].spirit.canonicalName).toBe(second.selectedSpirits[0].spirit.canonicalName);
        expect(first.adversary.canonicalName).toBe(second.adversary.canonicalName);
        expect(first.scenario.canonicalName).toBe(second.scenario.canonicalName);
        expect(first.layout?.canonicalName).toBe(second.layout?.canonicalName);
    });

    it("does not choose an aspect when requireSpiritAspects is disabled", () => {
        const result = runWithTrace(
            sampleData,
            { expansions: ["Base Game"], requireSpiritAspects: false },
            createSeededRng(42)
        );

        expect(result.selectedSpirits[0].spirit.canonicalName).toBe("test-spirit");
        expect(result.selectedSpirits[0].aspect).toBeUndefined();
    });

    it("chooses an aspect when requireSpiritAspects is enabled", () => {
        const result = runWithTrace(
            sampleData,
            { expansions: ["Base Game"], requireSpiritAspects: true },
            createSeededRng(42)
        );

        expect(result.selectedSpirits[0].aspect).toBeDefined();
        expect(result.selectedSpirits[0].aspect?.canonicalName).toBe("test-aspect");
    });

    it("filters by expansions when options.expansions is set", () => {
        const result = runWithTrace(sampleData, { expansions: ["Base Game"] }, createSeededRng(101));
        expect(result.selectedBoards[0].board.expansions).toContain("Base Game");
        expect(result.selectedSpirits[0].spirit.expansion).toBe("Base Game");
        expect(result.adversary.expansion).toBe("Base Game");
        expect(result.scenario.expansion).toBe("Base Game");
    });

    it("selects a layout template when a layout is present", () => {
        const result = runWithTrace(sampleData, { expansions: ["Base Game"] }, createSeededRng(7));
        expect(result.layout).not.toBeNull();
        expect(result.layoutTemplate).not.toBeNull();
        expect(result.layoutTemplate?.pairs).toBe("1-2");
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

    it("runs with the Python persisted selection/settings files using loaded game data", async () => {
        const data = await loadAllData();
        const selectionState = mapPythonSelectionState(selectionStateFixture);
        const options = mapPythonSettingsState(settingsStateFixture);
        const result = runWithTrace(data, { ...options, selectionState }, createSeededRng(99));

        expect(result.options.numSpirits).toBe(5);
        expect(result.options.expansions).toContain("Branch & Claw");
        expect(result.options.expansions).toContain("Jagged Earth");
        expect(result.selectedSpirits.length).toBeGreaterThan(0);
        expect(result.selectedBoards.length).toBeGreaterThan(0);
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
});
