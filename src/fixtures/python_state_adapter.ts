import { TriState } from "../engine/types";
import type { SelectionState } from "../engine/types";
import type { SettingsState } from "../persistence";

export interface PythonSelectionState {
    [canonicalName: string]: 0 | 1 | 2;
}

type SelectionStateContainer =
    | PythonSelectionState
    | {
        selection_state?: PythonSelectionState;
        selectionState?: PythonSelectionState;
    };

export interface PythonSettingsState {
    num_spirits?: number;
    additional_board?: boolean;
    strict_board_compatibility?: boolean;
    thematic_boards?: boolean;
    spirit_tree_expanded?: boolean;
    local_launch?: boolean;
    expansion_branch_claw?: boolean;
    expansion_jagged_earth?: boolean;
    expansion_nature_incarnate?: boolean;
    use_events?: boolean;
    use_adversaries?: boolean;
    use_scenarios?: boolean;
    preferred_layouts?: Record<string, string>;
    [key: string]: unknown;
}

type SettingsStateContainer =
    | PythonSettingsState
    | {
        settings_state?: PythonSettingsState;
        settingsState?: PythonSettingsState;
    };

function unwrapSelectionState(input: SelectionStateContainer): PythonSelectionState {
    if ("selection_state" in input && input.selection_state) {
        return input.selection_state as PythonSelectionState;
    }
    if ("selectionState" in input && input.selectionState) {
        return input.selectionState as PythonSelectionState;
    }
    return input as PythonSelectionState;
}

function unwrapSettingsState(input: SettingsStateContainer): PythonSettingsState {
    if ("settings_state" in input && input.settings_state) {
        return input.settings_state as PythonSettingsState;
    }
    if ("settingsState" in input && input.settingsState) {
        return input.settingsState as PythonSettingsState;
    }
    return input as PythonSettingsState;
}

export function mapPythonSelectionState(input: SelectionStateContainer): SelectionState {
    const rawSelectionState = unwrapSelectionState(input);
    const output: SelectionState = {};

    for (const [name, value] of Object.entries(rawSelectionState)) {
        if (value === 0) {
            output[name] = TriState.UNCHECKED;
        } else if (value === 1) {
            output[name] = TriState.CHECKED;
        } else if (value === 2) {
            output[name] = TriState.INDETERMINATE;
        }
    }

    return output;
}

export function mapPythonSettingsState(input: SettingsStateContainer): SettingsState {
    const rawSettingsState = unwrapSettingsState(input);

    return {
        expansionBranchClaw: Boolean(rawSettingsState.expansion_branch_claw),
        expansionJaggedEarth: Boolean(rawSettingsState.expansion_jagged_earth),
        expansionNatureIncarnate: Boolean(rawSettingsState.expansion_nature_incarnate),
        // F&F and Horizons have no flag in the Python model; default to false.
        expansionFeatherFlame: false,
        expansionHorizons: false,
        numSpirits: rawSettingsState.num_spirits ?? 1,
        includeAdditionalBoard: Boolean(rawSettingsState.additional_board),
        useThematicBoards: Boolean(rawSettingsState.thematic_boards),
        useAdversaries: rawSettingsState.use_adversaries ?? true,
        useScenarios: rawSettingsState.use_scenarios ?? true,
        useEvents: rawSettingsState.use_events ?? true,
        strictBoardCompatibility: rawSettingsState.strict_board_compatibility ?? true,
        spiritTreeExpanded: rawSettingsState.spirit_tree_expanded ?? true,
        localLaunch: rawSettingsState.local_launch ?? true,
        preferredLayouts: rawSettingsState.preferred_layouts ?? {},
    };
}
