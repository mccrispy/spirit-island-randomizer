import type { AppData } from "./data/types";
import { TriState } from "./engine/types";
import type { SelectionState } from "./engine/types";

export interface SettingsState {
    expansionBranchClaw: boolean;
    expansionJaggedEarth: boolean;
    expansionNatureIncarnate: boolean;
    expansionFeatherFlame: boolean;
    expansionHorizons: boolean;
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
}

const DEFAULT_SETTINGS: SettingsState = {
    expansionBranchClaw: false,
    expansionJaggedEarth: false,
    expansionNatureIncarnate: false,
    expansionFeatherFlame: false,
    expansionHorizons: false,
    numSpirits: 3,
    includeAdditionalBoard: false,
    useThematicBoards: false,
    useAdversaries: true,
    useScenarios: true,
    useEvents: true,
    strictBoardCompatibility: true,
    spiritTreeExpanded: true,
    localLaunch: true,
    preferredLayouts: {},
};

// Returns the expansions[] array the engine expects, derived from the boolean flags.
// An empty result means no filter (all loaded data is eligible).
export function settingsToExpansions(settings: SettingsState): string[] {
    const active: string[] = [];
    if (settings.expansionBranchClaw) active.push("Branch & Claw");
    if (settings.expansionJaggedEarth) active.push("Jagged Earth");
    if (settings.expansionNatureIncarnate) active.push("Nature Incarnate");
    if (settings.expansionFeatherFlame) active.push("Feather and Flame");
    if (settings.expansionHorizons) active.push("Horizons of Spirit Island");
    // Base Game is always included when any expansion is enabled.
    if (active.length) active.unshift("Base Game");
    return active;
}

const KEYS = {
    selectionState: "sirpy-web.selectionState",
    settingsState: "sirpy-web.settingsState",
} as const;

export function buildDefaultSelectionState(data: AppData): SelectionState {
    const entries: [string, TriState][] = [
        ...data.spirits.map((s) => [s.canonicalName, TriState.CHECKED] as [string, TriState]),
        ...data.aspects.map((a) => [a.canonicalName, TriState.CHECKED] as [string, TriState]),
        ...data.boards.map((b) => [b.canonicalName, TriState.CHECKED] as [string, TriState]),
        ...data.adversaries.map((a) => [a.canonicalName, TriState.CHECKED] as [string, TriState]),
        ...data.scenarios.map((s) => [s.canonicalName, TriState.CHECKED] as [string, TriState]),
    ];
    return Object.fromEntries(entries);
}

export function loadSelectionState(): SelectionState | null {
    try {
        const raw = localStorage.getItem(KEYS.selectionState);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return null;
        return parsed as SelectionState;
    } catch {
        return null;
    }
}

export function saveSelectionState(state: SelectionState): void {
    localStorage.setItem(KEYS.selectionState, JSON.stringify(state));
}

export function loadSettingsState(): SettingsState | null {
    try {
        const raw = localStorage.getItem(KEYS.settingsState);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        return { ...DEFAULT_SETTINGS, ...parsed };
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
