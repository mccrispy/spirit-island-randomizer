import type { AppData } from "./data/types";
import { TriState } from "./engine/types";
import type { SelectionState } from "./engine/types";

export interface SettingsState {
    expansionBranchClaw: boolean;
    expansionJaggedEarth: boolean;
    expansionNatureIncarnate: boolean;
    numSpirits: number;
    includeAdditionalBoard: boolean;
    useThematicBoards: boolean;
    useAdversaries: boolean;
    useScenarios: boolean;
    useEvents: boolean;
    strictBoardCompatibility: boolean;
    spiritTreeExpanded: boolean;
    localLaunch: boolean;
    preferredLayouts: Record<string, string>;
    selectedLayouts: Record<string, string>;
}

const DEFAULT_SETTINGS: SettingsState = {
    expansionBranchClaw: true,
    expansionJaggedEarth: true,
    expansionNatureIncarnate: true,
    numSpirits: 1,
    includeAdditionalBoard: false,
    useThematicBoards: false,
    useAdversaries: true,
    useScenarios: false,
    useEvents: true,
    strictBoardCompatibility: true,
    spiritTreeExpanded: true,
    localLaunch: true,
    preferredLayouts: {},
    selectedLayouts: {},
};

// Returns the expansions[] array matching the PRM's 3 client-launch expansion flags.
// Not used to gate local engine eligibility (that's per-item tri-state only); kept for
// engine-level expansion-filter test coverage and potential launch-URL use.
// An empty result means no filter (all loaded data is eligible).
export function settingsToExpansions(settings: SettingsState): string[] {
    const active: string[] = [];
    if (settings.expansionBranchClaw) active.push("Branch & Claw");
    if (settings.expansionJaggedEarth) active.push("Jagged Earth");
    if (settings.expansionNatureIncarnate) active.push("Nature Incarnate");
    // Base Game is always included when any expansion is enabled.
    if (active.length) active.unshift("Base Game");
    return active;
}

export interface SavedSet {
    selectionState: SelectionState;
    settings: SettingsState;
}

const KEYS = {
    selectionState: "sirpy-web.selectionState",
    settingsState: "sirpy-web.settingsState",
    savedSets: "sirpy-web.savedSets",
} as const;

// localStorage is user-editable (devtools, extensions, other scripts on the origin), so every
// value read back from it is treated as untrusted input and validated below before use.

// Reject absurdly large stored values before JSON.parse to avoid wasting CPU/memory on tampered data.
const MAX_RAW_LENGTH = 100_000;

function readRaw(key: string): string | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || raw.length > MAX_RAW_LENGTH) return null;
        return raw;
    } catch {
        return null;
    }
}

function isTriState(value: unknown): value is TriState {
    return typeof value === "string" && (Object.values(TriState) as string[]).includes(value);
}

function buildValidNames(data: AppData): Set<string> {
    const names = new Set<string>();
    for (const spirit of data.spirits) names.add(spirit.canonicalName);
    for (const aspect of data.aspects) names.add(aspect.canonicalName);
    for (const board of data.boards) names.add(board.canonicalName);
    for (const adversary of data.adversaries) names.add(adversary.canonicalName);
    for (const scenario of data.scenarios) names.add(scenario.canonicalName);
    return names;
}

// Drops any key not present in validNames and any value that isn't a real TriState member.
// Uses Object.fromEntries (CreateDataProperty) rather than bracket assignment so a "__proto__"
// key from untrusted JSON can never mutate the object prototype.
export function sanitizeSelectionState(
    raw: unknown,
    validNames: Set<string>,
): SelectionState {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
    const entries = Object.entries(raw as Record<string, unknown>).filter(
        ([key, value]) => validNames.has(key) && isTriState(value),
    ) as [string, TriState][];
    return Object.fromEntries(entries);
}

function sanitizeStringRecord(value: unknown): Record<string, string> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
    const entries = Object.entries(value as Record<string, unknown>).filter(
        ([key, val]) =>
            typeof key === "string" &&
            key.length <= 100 &&
            typeof val === "string" &&
            val.length <= 100,
    ) as [string, string][];
    return Object.fromEntries(entries);
}

// Validates every field independently and falls back to that field's default on bad type/range,
// rather than discarding the whole settings object for one corrupted field.
export function sanitizeSettingsState(raw: unknown): SettingsState {
    const base = defaultSettings();
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return base;
    const value = raw as Record<string, unknown>;
    const bool = (key: keyof SettingsState, fallback: boolean): boolean =>
        typeof value[key] === "boolean" ? (value[key] as boolean) : fallback;
    const numSpirits =
        typeof value.numSpirits === "number" &&
            Number.isInteger(value.numSpirits) &&
            value.numSpirits >= 1 &&
            value.numSpirits <= 6
            ? value.numSpirits
            : base.numSpirits;
    return {
        expansionBranchClaw: bool("expansionBranchClaw", base.expansionBranchClaw),
        expansionJaggedEarth: bool("expansionJaggedEarth", base.expansionJaggedEarth),
        expansionNatureIncarnate: bool("expansionNatureIncarnate", base.expansionNatureIncarnate),
        numSpirits,
        includeAdditionalBoard: bool("includeAdditionalBoard", base.includeAdditionalBoard),
        useThematicBoards: bool("useThematicBoards", base.useThematicBoards),
        useAdversaries: bool("useAdversaries", base.useAdversaries),
        useScenarios: bool("useScenarios", base.useScenarios),
        useEvents: bool("useEvents", base.useEvents),
        strictBoardCompatibility: bool("strictBoardCompatibility", base.strictBoardCompatibility),
        spiritTreeExpanded: bool("spiritTreeExpanded", base.spiritTreeExpanded),
        localLaunch: bool("localLaunch", base.localLaunch),
        preferredLayouts: sanitizeStringRecord(value.preferredLayouts),
        selectedLayouts: sanitizeStringRecord(value.selectedLayouts),
    };
}

// Letters/numbers/spaces/hyphen/underscore only, 1-50 chars after trimming.
const PROFILE_NAME_PATTERN = /^[\p{L}\p{N} _-]{1,50}$/u;

export function isValidProfileName(name: unknown): name is string {
    return typeof name === "string" && PROFILE_NAME_PATTERN.test(name.trim());
}

export function buildDefaultSelectionState(data: AppData): SelectionState {
    const defaultExpansions = new Set([
        "Base Game",
        "Branch & Claw",
        "Feather & Flame",
        "Jagged Earth",
    ]);
    const isDefaultExpansion = (expansion: string) => defaultExpansions.has(expansion);
    const entries: [string, TriState][] = [
        ...data.spirits.map((spirit) => [
            spirit.canonicalName,
            isDefaultExpansion(spirit.expansion)
                ? TriState.CHECKED
                : TriState.UNCHECKED,
        ] as [string, TriState]),
        ...data.aspects.map((aspect) => [aspect.canonicalName, TriState.UNCHECKED] as [string, TriState]),
        ...data.boards.map((b) => [b.canonicalName, TriState.CHECKED] as [string, TriState]),
        ...data.adversaries.map((adversary) => [
            adversary.canonicalName,
            isDefaultExpansion(adversary.expansion)
                ? TriState.CHECKED
                : TriState.UNCHECKED,
        ] as [string, TriState]),
        ...data.scenarios.map((scenario) => [
            scenario.canonicalName,
            isDefaultExpansion(scenario.expansion)
                ? TriState.CHECKED
                : TriState.UNCHECKED,
        ] as [string, TriState]),
    ];
    return Object.fromEntries(entries);
}

export function loadSelectionState(data: AppData): SelectionState | null {
    const raw = readRaw(KEYS.selectionState);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        const sanitized = sanitizeSelectionState(parsed, buildValidNames(data));
        return Object.keys(sanitized).length > 0 ? sanitized : null;
    } catch {
        return null;
    }
}

export function saveSelectionState(state: SelectionState): void {
    localStorage.setItem(KEYS.selectionState, JSON.stringify(state));
}

export function loadSettingsState(): SettingsState | null {
    const raw = readRaw(KEYS.settingsState);
    if (!raw) return null;
    try {
        return sanitizeSettingsState(JSON.parse(raw));
    } catch {
        return null;
    }
}

export function saveSettingsState(state: SettingsState): void {
    localStorage.setItem(KEYS.settingsState, JSON.stringify(state));
}

export function defaultSettings(): SettingsState {
    return { ...DEFAULT_SETTINGS };
}

// Stored as an array of [name, SavedSet] pairs (Map-serializable) rather than a plain object
// keyed by user input, so a "__proto__" name can never be (re-)interpreted as a prototype key.
export function loadSavedSets(data: AppData): Map<string, SavedSet> {
    const raw = readRaw(KEYS.savedSets);
    if (!raw) return new Map();
    try {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return new Map();
        const validNames = buildValidNames(data);
        const result = new Map<string, SavedSet>();
        for (const entry of parsed) {
            if (!Array.isArray(entry) || entry.length !== 2) continue;
            const [name, savedSet] = entry as [unknown, unknown];
            if (!isValidProfileName(name)) continue;
            if (typeof savedSet !== "object" || savedSet === null) continue;
            const candidate = savedSet as Record<string, unknown>;
            result.set(name.trim(), {
                selectionState: sanitizeSelectionState(candidate.selectionState, validNames),
                settings: sanitizeSettingsState(candidate.settings),
            });
        }
        return result;
    } catch {
        return new Map();
    }
}

function persistSavedSets(savedSets: Map<string, SavedSet>): void {
    localStorage.setItem(
        KEYS.savedSets,
        JSON.stringify(Array.from(savedSets.entries())),
    );
}

export function saveSavedSet(
    savedSets: Map<string, SavedSet>,
    name: string,
    selectionState: SelectionState,
    settings: SettingsState,
): Map<string, SavedSet> {
    if (!isValidProfileName(name)) {
        throw new Error("Invalid profile name.");
    }
    const next = new Map(savedSets);
    next.set(name.trim(), { selectionState, settings });
    persistSavedSets(next);
    return next;
}

export function deleteSavedSet(
    savedSets: Map<string, SavedSet>,
    name: string,
): Map<string, SavedSet> {
    const next = new Map(savedSets);
    next.delete(name);
    persistSavedSets(next);
    return next;
}
