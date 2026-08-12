import type {
    Adversary,
    AppData,
    Board,
    BoardLayout,
    BoardSide,
    LayoutTemplate,
    Scenario,
    Spirit,
} from "../data/types";

export type RNG = () => number;

export enum TriState {
    UNCHECKED = "UNCHECKED",
    CHECKED = "CHECKED",
    INDETERMINATE = "INDETERMINATE",
}

export type SelectionState = Record<string, TriState>;

export interface EngineOptions {
    expansions?: string[];
    numSpirits?: number;
    includeAdditionalBoard?: boolean;
    useThematicBoards?: boolean;
    useAdversaries?: boolean;
    useScenarios?: boolean;
    strictBoardCompatibility?: boolean;
    selectionState?: SelectionState;
}

export interface SelectedSpirit {
    spirit: Spirit;
    aspect?: Spirit;
}

export interface SelectedBoard {
    board: Board;
    boardSide: BoardSide;
}

export interface EngineResult {
    selectedSpirits: SelectedSpirit[];
    selectedBoards: SelectedBoard[];
    selectedAdditionalBoard?: SelectedBoard | null;
    adversary: Adversary | null;
    scenario: Scenario | null;
    layout: BoardLayout | null;
    layoutTemplate?: LayoutTemplate | null;
    boardPositions?: Record<number, Board> | null;
    layoutUrlString?: string | null;
    options: EngineOptions;
    generatedAt: string;
}
