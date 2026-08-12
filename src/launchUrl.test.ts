import { describe, expect, it } from "vitest";
import { buildWebLaunchUrl, buildSteamLaunchUrl } from "./launchUrl";
import { defaultSettings } from "./persistence";
import type { EngineResult } from "./engine/types";
import type { SettingsState } from "./persistence";

function makeResult(overrides: Partial<EngineResult> = {}): EngineResult {
    return {
        selectedSpirits: [
            {
                spirit: {
                    name: "River Surges In Sunlight",
                    canonicalName: "RiverSurgesInSunlight",
                    spiritType: "Base Spirit",
                    expansion: "Base Game",
                },
                forced: false,
            },
        ],
        selectedBoards: [
            {
                board: {
                    name: "Board A",
                    canonicalName: "BoardA",
                    sides: [],
                    expansions: ["Base Game"],
                    incompatibleBoards: [],
                },
                boardSide: {
                    sideType: "standard",
                    identifier: "A",
                    canonicalName: "BoardA-standard",
                    lands: [],
                },
                forced: false,
            },
        ],
        selectedAdditionalBoard: null,
        adversary: null,
        adversaryForced: false,
        scenario: null,
        scenarioForced: false,
        layout: null,
        layoutTemplate: null,
        boardPositions: null,
        layoutUrlString: null,
        options: {},
        generatedAt: "2026-08-12T00:00:00.000Z",
        ...overrides,
    };
}

describe("buildWebLaunchUrl", () => {
    it("includes base spirit and board canonical names", () => {
        const url = buildWebLaunchUrl(makeResult(), defaultSettings());
        expect(url).toContain("spirits=RiverSurgesInSunlight");
        expect(url).toContain("boards=BoardA");
    });

    it("puts aspect canonical name in aspects= and base spirit in spirits=", () => {
        const result = makeResult({
            selectedSpirits: [
                {
                    spirit: {
                        name: "Spreading Aspect",
                        canonicalName: "SpreadingAspect",
                        spiritType: "Aspect",
                        expansion: "Jagged Earth",
                        baseSpiritName: "ASpreadOfRampantGreen",
                    },
                    forced: false,
                },
            ],
        });
        const url = buildWebLaunchUrl(result, defaultSettings());
        expect(url).toContain("spirits=ASpreadOfRampantGreen");
        expect(url).toContain("aspects=SpreadingAspect");
    });

    it("includes adversary canonical name when present", () => {
        const result = makeResult({
            adversary: { name: "England", canonicalName: "England", expansion: "Base Game", levels: [] },
        });
        expect(buildWebLaunchUrl(result, defaultSettings())).toContain("adversary=England");
    });

    it("includes scenario canonical name when present", () => {
        const result = makeResult({
            scenario: { name: "Blitz", canonicalName: "Blitz", expansion: "Base Game" },
        });
        expect(buildWebLaunchUrl(result, defaultSettings())).toContain("scenario=Blitz");
    });

    it("includes layout url string when present", () => {
        const result = makeResult({ layoutUrlString: "BoardA0:BoardB2" });
        expect(buildWebLaunchUrl(result, defaultSettings())).toContain("layout=BoardA0:BoardB2");
    });

    it("adds useExpansions sorted when expansion flags are set", () => {
        const settings: SettingsState = {
            ...defaultSettings(),
            expansionBranchClaw: true,
            expansionJaggedEarth: true,
            expansionNatureIncarnate: false,
        };
        const url = buildWebLaunchUrl(makeResult(), settings);
        expect(url).toContain("useExpansions=BranchAndClaw,JaggedEarth");
    });

    it("adds useTokens=1 when Branch & Claw is enabled via settings", () => {
        const settings: SettingsState = { ...defaultSettings(), expansionBranchClaw: true };
        expect(buildWebLaunchUrl(makeResult(), settings)).toContain("useTokens=1");
    });

    it("adds useTokens=1 when result contains Branch & Claw content", () => {
        const result = makeResult({
            selectedSpirits: [{
                spirit: {
                    name: "Sharp Fangs",
                    canonicalName: "SharpFangsBehindTheLeaves",
                    spiritType: "Base Spirit",
                    expansion: "Branch & Claw",
                },
                forced: false,
            }],
        });
        expect(buildWebLaunchUrl(result, defaultSettings())).toContain("useTokens=1");
        expect(buildWebLaunchUrl(result, defaultSettings())).toContain("useExpansions=BranchAndClaw");
    });

    it("adds useTokens=1 when Jagged Earth is enabled via settings", () => {
        const settings: SettingsState = { ...defaultSettings(), expansionJaggedEarth: true };
        expect(buildWebLaunchUrl(makeResult(), settings)).toContain("useTokens=1");
    });

    it("omits useTokens when no token-bearing expansions are present in settings or result", () => {
        expect(buildWebLaunchUrl(makeResult(), defaultSettings())).not.toContain("useTokens");
    });

    it("adds useEvents=1 when useEvents is true, regardless of expansion state", () => {
        const settings: SettingsState = { ...defaultSettings(), useEvents: true };
        expect(buildWebLaunchUrl(makeResult(), settings)).toContain("useEvents=1");
    });

    it("omits useEvents when useEvents is false", () => {
        const settings: SettingsState = { ...defaultSettings(), useEvents: false };
        expect(buildWebLaunchUrl(makeResult(), settings)).not.toContain("useEvents");
    });

    it("uses thematic side canonical name for boards in thematic mode", () => {
        const result = makeResult({
            selectedBoards: [
                {
                    board: {
                        name: "Board NE",
                        canonicalName: "BoardNE",
                        sides: [],
                        expansions: ["Base Game"],
                        incompatibleBoards: [],
                    },
                    boardSide: {
                        sideType: "thematic",
                        identifier: "North East",
                        canonicalName: "NorthEast",
                        lands: [],
                    },
                    forced: false,
                },
            ],
        });
        const settings: SettingsState = { ...defaultSettings(), useThematicBoards: true };
        const url = buildWebLaunchUrl(result, settings);
        expect(url).toContain("boards=NorthEast");
        expect(url).not.toContain("boards=BoardNE");
    });

    it("respects parameter order: spirits before boards before layout before adversary before scenario", () => {
        const result = makeResult({
            layoutUrlString: "A0:B2",
            adversary: { name: "England", canonicalName: "England", expansion: "Base Game", levels: [] },
            scenario: { name: "Blitz", canonicalName: "Blitz", expansion: "Base Game" },
        });
        const url = buildWebLaunchUrl(result, defaultSettings());
        const spiritsPos = url.indexOf("spirits=");
        const boardsPos = url.indexOf("boards=");
        const layoutPos = url.indexOf("layout=");
        const adversaryPos = url.indexOf("adversary=");
        const scenarioPos = url.indexOf("scenario=");
        expect(spiritsPos).toBeLessThan(boardsPos);
        expect(boardsPos).toBeLessThan(layoutPos);
        expect(layoutPos).toBeLessThan(adversaryPos);
        expect(adversaryPos).toBeLessThan(scenarioPos);
    });
});

describe("buildSteamLaunchUrl", () => {
    it("wraps the web URL in the Steam launcher format", () => {
        const url = buildSteamLaunchUrl(makeResult(), defaultSettings());
        expect(url).toMatch(/^steam:\/\/run\/1236720\/\?url=/);
    });

    it("encodes a spiritisland:// protocol URL as the url param", () => {
        const url = buildSteamLaunchUrl(makeResult(), defaultSettings());
        expect(url).toContain(encodeURIComponent("spiritisland://screen/NewGame?"));
    });
});
