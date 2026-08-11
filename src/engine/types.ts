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
    strictBoardCompatibility?: boolean;
    requireSpiritAspects?: boolean;
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
    adversary: Adversary;
    scenario: Scenario;
    layout: BoardLayout | null;
    layoutTemplate?: LayoutTemplate | null;
    options: EngineOptions;
    generatedAt: string;
}
