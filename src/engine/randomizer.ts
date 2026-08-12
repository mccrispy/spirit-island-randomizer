import type { AppData, BaseSpirit, Board, Spirit } from "../data/types";
import type {
    EngineOptions,
    EngineResult,
    RNG,
    SelectedBoard,
    SelectedSpirit,
    SelectionState,
} from "./types";
import { TriState } from "./types";

const DEFAULT_ENGINE_OPTIONS: EngineOptions = {
    numSpirits: 1,
    useAdversaries: true,
    useScenarios: true,
    strictBoardCompatibility: true,
};

const THEMATIC_BOARD_COMBINATIONS: Record<number, string[]> = {
    1: ["North East"],
    2: ["West", "East"],
    3: ["North East", "West", "East"],
    4: ["North West", "North East", "West", "East"],
    5: ["North West", "North East", "West", "East", "South East"],
    6: ["North West", "North East", "West", "East", "South West", "South East"],
};

export function createSeededRng(seed: number): RNG {
    let state = seed >>> 0;
    return () => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) / 0x100000000;
    };
}

export function pickRandom<T>(items: T[], rng: RNG): T | null {
    if (!items.length) {
        return null;
    }
    const index = Math.floor(rng() * items.length);
    return items[index] ?? null;
}

function shuffleArray<T>(items: T[], rng: RNG): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function getItemExpansions(item: { expansion?: string; expansions?: string[] }): string[] {
    if (Array.isArray(item.expansions) && item.expansions.length) {
        return item.expansions;
    }
    if (typeof item.expansion === "string" && item.expansion.length) {
        return [item.expansion];
    }
    return [];
}

function filterByExpansion<T extends { expansion?: string; expansions?: string[] }>(
    items: T[],
    expansions?: string[]
): T[] {
    if (!expansions || !expansions.length) {
        return items;
    }
    return items.filter((item) => {
        const itemExpansions = getItemExpansions(item);
        return itemExpansions.some((expansion) => expansions.includes(expansion));
    });
}

function isSelectedState(state: TriState | undefined): boolean {
    return state === TriState.CHECKED || state === TriState.INDETERMINATE;
}

function isForcedState(state: TriState | undefined): boolean {
    return state === TriState.INDETERMINATE;
}

function filterEligibleBySelectionState<T extends { canonicalName: string }>(
    items: T[],
    selectionState?: SelectionState
): T[] {
    if (!selectionState) {
        return items;
    }

    const hasCategorySelections = items.some((item) => selectionState[item.canonicalName] !== undefined);
    if (!hasCategorySelections) {
        return items;
    }

    return items.filter((item) => isSelectedState(selectionState[item.canonicalName]));
}

function getSpiritFamilyName(spirit: Spirit): string {
    return spirit.spiritType === "Base Spirit" ? spirit.canonicalName : spirit.baseSpiritName || spirit.canonicalName;
}

function isSpiritInSelectedExpansions(spirit: Spirit, expansions?: string[]): boolean {
    if (!expansions || !expansions.length) {
        return true;
    }
    return expansions.includes(spirit.expansion);
}

function buildSpiritOptionsPerFamily(
    data: AppData,
    selectionState?: SelectionState,
    expansions?: string[]
): Record<string, { forced: Spirit[]; optional: Spirit[] }> {
    const optionsPerFamily: Record<string, { forced: Spirit[]; optional: Spirit[] }> = {};

    for (const baseSpirit of Object.values(data.baseSpiritMap)) {
        const familyName = baseSpirit.spirit.canonicalName;
        const options: Spirit[] = [];

        const baseState = selectionState?.[baseSpirit.spirit.canonicalName];
        if (isSelectedState(baseState) && isSpiritInSelectedExpansions(baseSpirit.spirit, expansions)) {
            options.push(baseSpirit.spirit);
        }

        for (const aspect of baseSpirit.aspects) {
            const aspectState = selectionState?.[aspect.canonicalName];
            if (isSelectedState(aspectState) && isSpiritInSelectedExpansions(aspect, expansions)) {
                options.push(aspect);
            }
        }

        if (!options.length) {
            continue;
        }

        optionsPerFamily[familyName] = {
            forced: options.filter((option) => isForcedState(selectionState?.[option.canonicalName])),
            optional: options.filter((option) => !isForcedState(selectionState?.[option.canonicalName])),
        };
    }

    return optionsPerFamily;
}

function selectOneSpiritPerFamily(
    optionsPerFamily: Record<string, { forced: Spirit[]; optional: Spirit[] }>,
    numSpirits: number,
    rng: RNG
): Spirit[] {
    const selected: Spirit[] = [];
    const selectedFamilies = new Set<string>();

    for (const [familyName, options] of Object.entries(optionsPerFamily)) {
        if (options.forced.length) {
            selected.push(options.forced[0]);
            selectedFamilies.add(familyName);
        }
    }

    if (selected.length > numSpirits) {
        throw new Error(
            `Too many forced spirits (${selected.length}) for spirit count (${numSpirits}).`
        );
    }

    const numRemaining = numSpirits - selected.length;
    const optionalFamilies = Object.entries(optionsPerFamily).filter(
        ([familyName, options]) => !selectedFamilies.has(familyName) && options.optional.length > 0
    );

    if (optionalFamilies.length < numRemaining) {
        throw new Error(
            `Not enough optional spirit families to fill ${numRemaining} remaining slot(s).`
        );
    }

    const selectedOptionalFamilies = shuffleArray(optionalFamilies, rng).slice(0, numRemaining);

    for (const [, options] of selectedOptionalFamilies) {
        const spirit = pickRandom(options.optional, rng);
        if (!spirit) {
            throw new Error("Failed to select a spirit from optional options.");
        }
        selected.push(spirit);
    }

    return selected;
}

function areBoardsCompatible(boardA: Board, boardB: Board): boolean {
    return !boardA.incompatibleBoards.includes(boardB.canonicalName) && !boardB.incompatibleBoards.includes(boardA.canonicalName);
}

function isCompatibleWithList(board: Board, boards: Board[]): boolean {
    return boards.every((other) => areBoardsCompatible(board, other));
}

function getThematicSide(board: Board) {
    return board.sides.find((side) => side.sideType.toLowerCase() === "thematic") ?? board.sides[1] ?? null;
}

function getStandardSide(board: Board) {
    return board.sides.find((side) => side.sideType.toLowerCase() === "standard") ?? board.sides[0] ?? null;
}

function selectThematicBoards(
    numBoards: number,
    eligibleBoards: Board[],
    strictCompatibility: boolean
): Board[] {
    const requiredIdentifiers = THEMATIC_BOARD_COMBINATIONS[numBoards];
    if (!requiredIdentifiers) {
        throw new Error(`Thematic board mode is not defined for ${numBoards} boards.`);
    }

    const boardsByThematicIdentifier = new Map<string, Board>();
    for (const board of eligibleBoards) {
        const thematicSide = getThematicSide(board);
        if (thematicSide?.identifier) {
            boardsByThematicIdentifier.set(thematicSide.identifier, board);
        }
    }

    const selectedBoards: Board[] = [];
    for (const identifier of requiredIdentifiers) {
        const board = boardsByThematicIdentifier.get(identifier);
        if (!board) {
            throw new Error(`Could not find board with thematic side '${identifier}' in eligible boards.`);
        }
        selectedBoards.push(board);
    }

    if (strictCompatibility) {
        for (let i = 0; i < selectedBoards.length; i += 1) {
            for (let j = i + 1; j < selectedBoards.length; j += 1) {
                if (!areBoardsCompatible(selectedBoards[i], selectedBoards[j])) {
                    throw new Error(
                        `Selected thematic boards are not compatible: ${selectedBoards[i].name} incompatible with ${selectedBoards[j].name}.`
                    );
                }
            }
        }
    }

    return selectedBoards;
}

function findCompatibleAdditionalBoard(
    availableBoards: Board[],
    selectedBoards: Board[],
    rng: RNG
): Board | null {
    const candidates = shuffleArray(availableBoards, rng);
    for (const candidate of candidates) {
        if (isCompatibleWithList(candidate, selectedBoards)) {
            return candidate;
        }
    }
    return null;
}

function findCompatibleBoards(
    numBoards: number,
    eligibleBoards: Board[],
    rng: RNG,
    strictCompatibility: boolean,
    forcedBoards: Board[] = [],
    maxAttempts = 1000
): Board[] {
    if (forcedBoards.length > numBoards) {
        throw new Error(
            `Too many forced boards (${forcedBoards.length}) for spirit count (${numBoards}).`
        );
    }

    const forcedNames = new Set(forcedBoards.map((board) => board.canonicalName));
    const optionalBoards = eligibleBoards.filter((board) => !forcedNames.has(board.canonicalName));

    if (numBoards <= 1 || !strictCompatibility) {
        if (eligibleBoards.length < numBoards) {
            throw new Error(`Not enough boards: need ${numBoards}, have ${eligibleBoards.length}`);
        }

        const numRemaining = numBoards - forcedBoards.length;
        if (optionalBoards.length < numRemaining) {
            throw new Error(`Not enough optional boards to fill ${numRemaining} remaining slot(s).`);
        }

        const selectedOptional = shuffleArray(optionalBoards, rng).slice(0, numRemaining);
        return shuffleArray([...forcedBoards, ...selectedOptional], rng);
    }

    if (eligibleBoards.length < numBoards) {
        throw new Error(`Not enough boards: need ${numBoards}, have ${eligibleBoards.length}`);
    }

    if (forcedBoards.length > 1) {
        for (let i = 0; i < forcedBoards.length; i += 1) {
            for (let j = i + 1; j < forcedBoards.length; j += 1) {
                if (!areBoardsCompatible(forcedBoards[i], forcedBoards[j])) {
                    throw new Error(
                        `Forced boards are not compatible: ${forcedBoards[i].name} and ${forcedBoards[j].name}.`
                    );
                }
            }
        }
    }

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const candidateBoards = shuffleArray(optionalBoards, rng);
        const selected: Board[] = [...forcedBoards];

        for (const board of candidateBoards) {
            if (isCompatibleWithList(board, selected)) {
                selected.push(board);
                if (selected.length === numBoards) {
                    return selected;
                }
            }
        }
    }

    throw new Error(`Could not find ${numBoards} compatible boards after ${maxAttempts} attempts`);
}

function selectBoards(
    data: AppData,
    options: EngineOptions,
    rng: RNG
): { selectedBoards: SelectedBoard[]; selectedAdditionalBoard: SelectedBoard | null } {
    const numBoards = options.numSpirits ?? 1;
    const includeAdditionalBoard = Boolean(options.includeAdditionalBoard);
    const useThematicBoards = Boolean(options.useThematicBoards);
    const totalBoards = numBoards + (includeAdditionalBoard ? 1 : 0);
    const expansionFilteredBoards = filterByExpansion(data.boards, options.expansions);
    const boards = filterEligibleBySelectionState(expansionFilteredBoards, options.selectionState);

    if (!boards.length) {
        throw new Error("No boards available for the current selection state.");
    }

    const forcedBoards = boards.filter((board) => isForcedState(options.selectionState?.[board.canonicalName]));
    if (forcedBoards.length > numBoards) {
        throw new Error(`Too many forced boards (${forcedBoards.length}) for spirit count (${numBoards}).`);
    }

    if (boards.length < totalBoards) {
        throw new Error(`Not enough boards available for selected expansions: need ${totalBoards}, have ${boards.length}`);
    }

    const strictCompatibility = Boolean(options.strictBoardCompatibility && totalBoards < 5);

    if (useThematicBoards) {
        const selectedThematicBoards = selectThematicBoards(totalBoards, boards, strictCompatibility);
        const spiritBoards = selectedThematicBoards.slice(0, numBoards);
        const additionalBoard = includeAdditionalBoard ? selectedThematicBoards[numBoards] ?? null : null;

        return {
            selectedBoards: spiritBoards.map((board) => {
                const thematicSide = getThematicSide(board);
                if (!thematicSide) {
                    throw new Error(`Board ${board.name} does not have a thematic side.`);
                }
                return {
                    board,
                    boardSide: thematicSide,
                };
            }),
            selectedAdditionalBoard: additionalBoard
                ? {
                    board: additionalBoard,
                    boardSide: getThematicSide(additionalBoard) ?? additionalBoard.sides[0],
                }
                : null,
        };
    }

    const selectedBoards = findCompatibleBoards(numBoards, boards, rng, strictCompatibility, forcedBoards);

    let selectedAdditionalBoard: SelectedBoard | null = null;
    if (includeAdditionalBoard) {
        const selectedBoardNames = new Set(selectedBoards.map((board) => board.canonicalName));
        const availableAdditionalBoards = boards.filter((board) => !selectedBoardNames.has(board.canonicalName));

        if (!availableAdditionalBoards.length) {
            throw new Error("No additional board available after selecting spirit boards.");
        }

        const additionalBoard = strictCompatibility
            ? findCompatibleAdditionalBoard(availableAdditionalBoards, selectedBoards, rng)
            : pickRandom(availableAdditionalBoards, rng);

        if (!additionalBoard) {
            throw new Error("Could not find a compatible additional board.");
        }

        const standardAdditionalSide = getStandardSide(additionalBoard);
        if (!standardAdditionalSide) {
            throw new Error(`Board ${additionalBoard.name} has no sides available`);
        }

        selectedAdditionalBoard = {
            board: additionalBoard,
            boardSide: standardAdditionalSide,
        };
    }

    return {
        selectedBoards: selectedBoards.map((board) => {
            const boardSide = getStandardSide(board);
            if (!boardSide) {
                throw new Error(`Board ${board.name} has no sides available`);
            }
            return { board, boardSide };
        }),
        selectedAdditionalBoard,
    };
}

function selectSpirits(data: AppData, options: EngineOptions, rng: RNG): SelectedSpirit[] {
    const numSpirits = options.numSpirits ?? 1;
    const selectionState = options.selectionState;
    if (!selectionState) {
        throw new Error("selectionState is required for spirit selection parity with Python.");
    }

    const optionsPerFamily = buildSpiritOptionsPerFamily(data, selectionState, options.expansions);
    const numEligibleFamilies = Object.keys(optionsPerFamily).length;
    if (numEligibleFamilies < numSpirits) {
        throw new Error(`Not enough spirit families available: need ${numSpirits}, have ${numEligibleFamilies}`);
    }

    const selected = selectOneSpiritPerFamily(optionsPerFamily, numSpirits, rng);

    return selected.map((spirit) => {
        const baseSpirit = data.baseSpiritMap[getSpiritFamilyName(spirit)];
        return { spirit };
    });
}

function selectAdversary(data: AppData, options: EngineOptions, rng: RNG) {
    if (options.useAdversaries === false) {
        return null;
    }

    const expansionFilteredAdversaries = filterByExpansion(data.adversaries, options.expansions);
    const adversaries = filterEligibleBySelectionState(expansionFilteredAdversaries, options.selectionState);

    if (!adversaries.length) {
        throw new Error("No adversaries available for the current selection state.");
    }

    const forcedAdversaries = adversaries.filter((adversary) =>
        isForcedState(options.selectionState?.[adversary.canonicalName])
    );

    if (forcedAdversaries.length > 1) {
        throw new Error(
            `Too many forced adversaries (${forcedAdversaries.length}). Only one adversary can be selected.`
        );
    }

    if (forcedAdversaries.length === 1) {
        return forcedAdversaries[0];
    }

    const adversary = pickRandom(adversaries, rng);
    if (!adversary) {
        throw new Error("No adversaries available for the selected expansions");
    }
    return adversary;
}

function selectScenario(data: AppData, options: EngineOptions, rng: RNG) {
    if (options.useScenarios === false) {
        return null;
    }

    const expansionFilteredScenarios = filterByExpansion(data.scenarios, options.expansions);
    const scenarios = filterEligibleBySelectionState(expansionFilteredScenarios, options.selectionState);

    if (!scenarios.length) {
        throw new Error("No scenarios available for the current selection state.");
    }

    const forcedScenarios = scenarios.filter((scenario) =>
        isForcedState(options.selectionState?.[scenario.canonicalName])
    );

    if (forcedScenarios.length > 1) {
        throw new Error(
            `Too many forced scenarios (${forcedScenarios.length}). Only one scenario can be selected.`
        );
    }

    if (forcedScenarios.length === 1) {
        return forcedScenarios[0];
    }

    const scenario = pickRandom(scenarios, rng);
    if (!scenario) {
        throw new Error("No scenarios available for the selected expansions");
    }
    return scenario;
}

function selectLayout(data: AppData, options: EngineOptions, rng: RNG) {
    const boardCount = (options.numSpirits ?? 1) + (options.includeAdditionalBoard ? 1 : 0);
    const layouts = data.layouts.filter((layout) => layout.validBoardCounts.includes(boardCount));
    return pickRandom(layouts, rng);
}

function renderLayoutUrlString(
    boardPositions: Record<number, Board>,
    layout: NonNullable<EngineResult["layout"]>,
    actualCount: number
): string {
    const template = layout.templates.find((candidate) => candidate.boardCounts.includes(actualCount));
    if (!template?.pairs?.trim()) {
        return "";
    }

    const renderedPairs: string[] = [];
    for (const pairChunk of template.pairs.split(",")) {
        const pair = pairChunk.trim();
        if (!pair.includes(":")) {
            continue;
        }

        const [left, right] = pair.split(":", 2);
        const [leftPositionRaw, leftFace] = left.split(".", 2);
        const [rightPositionRaw, rightFace] = right.split(".", 2);

        const leftPosition = Number.parseInt(leftPositionRaw, 10);
        const rightPosition = Number.parseInt(rightPositionRaw, 10);
        if (!Number.isFinite(leftPosition) || !Number.isFinite(rightPosition)) {
            continue;
        }
        if (leftPosition > actualCount || rightPosition > actualCount) {
            continue;
        }

        const leftBoard = boardPositions[leftPosition];
        const rightBoard = boardPositions[rightPosition];
        if (!leftBoard || !rightBoard) {
            continue;
        }

        renderedPairs.push(`${leftBoard.canonicalName}${leftFace}:${rightBoard.canonicalName}${rightFace}`);
    }

    return renderedPairs.join(",");
}

export function generateSetup(
    data: AppData,
    options: EngineOptions = {},
    rng: RNG = Math.random
): EngineResult {
    const mergedOptions = { ...DEFAULT_ENGINE_OPTIONS, ...options };
    const engineRng = rng;

    const { selectedBoards, selectedAdditionalBoard } = selectBoards(data, mergedOptions, engineRng);
    const selectedSpirits = selectSpirits(data, mergedOptions, engineRng);
    const adversary = selectAdversary(data, mergedOptions, engineRng);
    const scenario = selectScenario(data, mergedOptions, engineRng);
    const layout = selectLayout(data, mergedOptions, engineRng);
    const totalBoards = selectedBoards.length + (selectedAdditionalBoard ? 1 : 0);
    const layoutTemplate = layout?.templates?.length
        ? layout.templates.find((template) => template.boardCounts.includes(totalBoards)) ?? null
        : null;

    let boardPositions: Record<number, Board> | null = null;
    let layoutUrlString: string | null = null;
    if (layout?.templates?.length) {
        const allBoards = [
            ...selectedBoards.map((selected) => selected.board),
            ...(selectedAdditionalBoard ? [selectedAdditionalBoard.board] : []),
        ];

        boardPositions = allBoards.reduce<Record<number, Board>>((positions, board, index) => {
            positions[index + 1] = board;
            return positions;
        }, {});
        layoutUrlString = renderLayoutUrlString(boardPositions, layout, allBoards.length);
    }

    return {
        selectedBoards,
        selectedAdditionalBoard,
        selectedSpirits,
        adversary,
        scenario,
        layout,
        layoutTemplate: layoutTemplate ?? null,
        boardPositions,
        layoutUrlString,
        options: mergedOptions,
        generatedAt: new Date().toISOString(),
    };
}
