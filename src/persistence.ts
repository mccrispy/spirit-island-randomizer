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

const KEYS = {
    selectionState: "sirpy-web.selectionState",
    settingsState: "sirpy-web.settingsState",
} as const;

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
