import { beforeEach, describe, expect, it } from "vitest";
import type { AppData, Spirit } from "./data/types";
import { TriState } from "./engine/types";
import {
    buildDefaultSelectionState,
    defaultSettings,
    deleteSavedSet,
    isValidProfileName,
    loadSavedSets,
    loadSelectionState,
    loadSettingsState,
    sanitizeSelectionState,
    sanitizeSettingsState,
    saveSavedSet,
    saveSelectionState,
} from "./persistence";

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

describe("isValidProfileName", () => {
    it("accepts ordinary names", () => {
        expect(isValidProfileName("My Setup 1")).toBe(true);
        expect(isValidProfileName("solo_run-2")).toBe(true);
    });

    it("rejects empty, whitespace-only, and over-length names", () => {
        expect(isValidProfileName("")).toBe(false);
        expect(isValidProfileName("   ")).toBe(false);
        expect(isValidProfileName("a".repeat(51))).toBe(false);
    });

    it("rejects disallowed characters", () => {
        expect(isValidProfileName("<img src=x onerror=alert(1)>")).toBe(false);
        expect(isValidProfileName("a/b")).toBe(false);
    });

    it("rejects non-string input", () => {
        expect(isValidProfileName(123)).toBe(false);
        expect(isValidProfileName(null)).toBe(false);
        expect(isValidProfileName(undefined)).toBe(false);
    });
});

describe("sanitizeSelectionState", () => {
    const validNames = new Set(["base-spirit", "branch-adversary"]);

    it("keeps only known names with valid TriState values", () => {
        const result = sanitizeSelectionState(
            {
                "base-spirit": TriState.CHECKED,
                "unknown-spirit": TriState.CHECKED,
                "branch-adversary": "not-a-tristate",
            },
            validNames,
        );
        expect(result).toEqual({ "base-spirit": TriState.CHECKED });
    });

    it("ignores a __proto__ key instead of polluting the object prototype", () => {
        const raw = JSON.parse('{"__proto__": {"polluted": true}}');
        const result = sanitizeSelectionState(raw, validNames);
        expect(result).toEqual({});
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("returns an empty object for non-object input", () => {
        expect(sanitizeSelectionState(null, validNames)).toEqual({});
        expect(sanitizeSelectionState("bad", validNames)).toEqual({});
        expect(sanitizeSelectionState([1, 2, 3], validNames)).toEqual({});
    });
});

describe("sanitizeSettingsState", () => {
    it("falls back to defaults per-field on bad type or out-of-range values", () => {
        const result = sanitizeSettingsState({
            numSpirits: 999,
            useAdversaries: "yes",
            expansionBranchClaw: false,
            preferredLayouts: { "3": "layout-a", bad: 123 },
        });
        expect(result.numSpirits).toBe(defaultSettings().numSpirits);
        expect(result.useAdversaries).toBe(defaultSettings().useAdversaries);
        expect(result.expansionBranchClaw).toBe(false);
        expect(result.preferredLayouts).toEqual({ "3": "layout-a" });
    });

    it("returns defaults for non-object input", () => {
        expect(sanitizeSettingsState(null)).toEqual(defaultSettings());
        expect(sanitizeSettingsState("bad")).toEqual(defaultSettings());
    });
});

describe("localStorage-backed persistence", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("loadSelectionState drops unknown keys and returns null when nothing valid remains", () => {
        localStorage.setItem(
            "sirpy-web.selectionState",
            JSON.stringify({ "unknown-spirit": TriState.CHECKED }),
        );
        expect(loadSelectionState(data)).toBeNull();

        saveSelectionState({ "base-spirit": TriState.CHECKED });
        expect(loadSelectionState(data)).toEqual({ "base-spirit": TriState.CHECKED });
    });

    it("loadSelectionState returns null for corrupted JSON", () => {
        localStorage.setItem("sirpy-web.selectionState", "{not json");
        expect(loadSelectionState(data)).toBeNull();
    });

    it("loadSettingsState sanitizes a stored value with a bad field", () => {
        localStorage.setItem(
            "sirpy-web.settingsState",
            JSON.stringify({ ...defaultSettings(), numSpirits: "six" }),
        );
        expect(loadSettingsState()?.numSpirits).toBe(defaultSettings().numSpirits);
    });

    it("saveSavedSet/loadSavedSets/deleteSavedSet round-trip through localStorage", () => {
        const selectionState = buildDefaultSelectionState(data);
        const settings = defaultSettings();

        const afterSave = saveSavedSet(new Map(), "My Profile", selectionState, settings);
        expect(afterSave.get("My Profile")).toEqual({ selectionState, settings });

        const reloaded = loadSavedSets(data);
        expect(reloaded.get("My Profile")).toEqual({ selectionState, settings });

        const afterDelete = deleteSavedSet(reloaded, "My Profile");
        expect(afterDelete.has("My Profile")).toBe(false);
        expect(loadSavedSets(data).has("My Profile")).toBe(false);
    });

    it("saveSavedSet rejects a name with disallowed characters", () => {
        expect(() =>
            saveSavedSet(new Map(), "a/b", buildDefaultSelectionState(data), defaultSettings()),
        ).toThrow();
    });

    it("stores a __proto__-named profile as an ordinary Map entry without polluting Object.prototype", () => {
        const afterSave = saveSavedSet(
            new Map(),
            "__proto__",
            buildDefaultSelectionState(data),
            defaultSettings(),
        );
        expect(afterSave.get("__proto__")).toBeDefined();
        expect(({} as Record<string, unknown>).selectionState).toBeUndefined();

        const reloaded = loadSavedSets(data);
        expect(reloaded.get("__proto__")).toBeDefined();
        expect(({} as Record<string, unknown>).selectionState).toBeUndefined();
    });

    it("loadSavedSets drops entries with a malformed shape instead of throwing", () => {
        localStorage.setItem(
            "sirpy-web.savedSets",
            JSON.stringify([
                ["Good", { selectionState: {}, settings: defaultSettings() }],
                "not-a-pair",
                ["Bad shape", "not-an-object"],
            ]),
        );
        const result = loadSavedSets(data);
        expect(result.has("Good")).toBe(true);
        expect(result.has("Bad shape")).toBe(false);
        expect(result.size).toBe(1);
    });
});