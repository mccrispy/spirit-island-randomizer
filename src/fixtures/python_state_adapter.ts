import { TriState } from "../engine/types";
import type { EngineOptions, SelectionState } from "../engine/types";

export interface PythonSelectionState {
    [canonicalName: string]: 0 | 1 | 2;
}

export interface PythonSettingsState {
    num_spirits?: number;
    strict_board_compatibility?: boolean;
    expansion_branch_claw?: boolean;
    expansion_jagged_earth?: boolean;
    expansion_nature_incarnate?: boolean;
    use_events?: boolean;
    use_adversaries?: boolean;
    use_scenarios?: boolean;
    preferred_layouts?: Record<string, string>;
    [key: string]: unknown;
}

export function mapPythonSelectionState(input: PythonSelectionState): SelectionState {
    const output: SelectionState = {};

    for (const [name, value] of Object.entries(input)) {
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

export function mapPythonSettingsState(input: PythonSettingsState): EngineOptions {
    const expansions: string[] = [];

    let hasExpansion = false;

    if (input.expansion_branch_claw) {
        expansions.push("Branch & Claw");
        hasExpansion = true;
    }
    if (input.expansion_jagged_earth) {
        expansions.push("Jagged Earth");
        hasExpansion = true;
    }
    if (input.expansion_nature_incarnate) {
        expansions.push("Nature Incarnate");
        hasExpansion = true;
    }

    if (hasExpansion) {
        expansions.unshift("Base Game");
    } else {
        expansions.push("Base Game");
    }

    return {
        numSpirits: input.num_spirits,
        strictBoardCompatibility: input.strict_board_compatibility,
        expansions,
        // The Python app uses these toggles as higher-level features; the web engine currently always uses adversaries and scenarios when available.
        // Additional app-level support can be added later.
    };
}
