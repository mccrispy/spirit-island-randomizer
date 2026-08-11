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
    strictBoardCompatibility: true,
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

function getSpiritFamilyName(spirit: Spirit): string {
    return spirit.spiritType === "Base Spirit" ? spirit.canonicalName : spirit.baseSpiritName || spirit.canonicalName;
}

function buildSpiritOptionsPerFamily(
    data: AppData,
    selectionState?: SelectionState
): Record<string, { forced: Spirit[]; optional: Spirit[] }> {
    const optionsPerFamily: Record<string, { forced: Spirit[]; optional: Spirit[] }> = {};

    for (const baseSpirit of Object.values(data.baseSpiritMap)) {
        const familyName = baseSpirit.spirit.canonicalName;
        const options: Spirit[] = [];

        const baseState = selectionState?.[baseSpirit.spirit.canonicalName];
        if (isSelectedState(baseState)) {
            options.push(baseSpirit.spirit);
        }

        for (const aspect of baseSpirit.aspects) {
            const aspectState = selectionState?.[aspect.canonicalName];
            if (isSelectedState(aspectState)) {
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

function findCompatibleBoards(
    numBoards: number,
    eligibleBoards: Board[],
    rng: RNG,
    strictCompatibility: boolean,
    maxAttempts = 1000
): Board[] {
    if (numBoards <= 1 || !strictCompatibility || eligibleBoards.length < 5) {
        if (eligibleBoards.length < numBoards) {
            throw new Error(`Not enough boards: need ${numBoards}, have ${eligibleBoards.length}`);
        }
        return shuffleArray(eligibleBoards, rng).slice(0, numBoards);
    }

    if (eligibleBoards.length < numBoards) {
        throw new Error(`Not enough boards: need ${numBoards}, have ${eligibleBoards.length}`);
    }

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const candidateBoards = shuffleArray(eligibleBoards, rng);
        const selected: Board[] = [];

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

function selectBoards(data: AppData, options: EngineOptions, rng: RNG): SelectedBoard[] {
    const numBoards = options.numSpirits ?? 1;
    const boards = filterByExpansion(data.boards, options.expansions);
    if (boards.length < numBoards) {
        throw new Error(`Not enough boards available for selected expansions: need ${numBoards}, have ${boards.length}`);
    }
    const strictCompatibility = Boolean(options.strictBoardCompatibility && numBoards < 5);
    const selectedBoards = findCompatibleBoards(numBoards, boards, rng, strictCompatibility);

    return selectedBoards.map((board) => {
        const boardSide = pickRandom(board.sides, rng);
        if (!boardSide) {
            throw new Error(`Board ${board.name} has no sides available`);
        }
        return { board, boardSide };
    });
}

function selectSpirits(data: AppData, options: EngineOptions, rng: RNG): SelectedSpirit[] {
    const numSpirits = options.numSpirits ?? 1;
    const selectionState = options.selectionState;
    const eligibleBaseSpirits = Object.values(data.baseSpiritMap).filter((baseSpirit) => {
        if (!selectionState) {
            return true;
        }
        const baseState = selectionState[baseSpirit.spirit.canonicalName];
        if (isSelectedState(baseState)) {
            return true;
        }
        return baseSpirit.aspects.some((aspect) => isSelectedState(selectionState[aspect.canonicalName]));
    });

    if (eligibleBaseSpirits.length < numSpirits) {
        throw new Error(`Not enough spirit families available: need ${numSpirits}, have ${eligibleBaseSpirits.length}`);
    }

    const selectedSpirits: SelectedSpirit[] = [];

    if (selectionState) {
        const optionsPerFamily = buildSpiritOptionsPerFamily(data, selectionState);
        const selected = selectOneSpiritPerFamily(optionsPerFamily, numSpirits, rng);

        return selected.map((spirit) => {
            const baseSpirit = data.baseSpiritMap[getSpiritFamilyName(spirit)];
            let aspect: Spirit | undefined;
            if (spirit.spiritType !== "Aspect" && options.requireSpiritAspects && baseSpirit?.aspects?.length) {
                aspect = pickRandom(baseSpirit.aspects, rng) ?? undefined;
            }
            return { spirit, aspect };
        });
    }

    const baseSpiritFamilies = eligibleBaseSpirits.slice();
    while (selectedSpirits.length < numSpirits && baseSpiritFamilies.length) {
        const index = Math.floor(rng() * baseSpiritFamilies.length);
        const [baseSpirit] = baseSpiritFamilies.splice(index, 1);
        const spirit = baseSpirit.spirit;
        let aspect: Spirit | undefined;
        if (options.requireSpiritAspects && baseSpirit.aspects?.length) {
            aspect = pickRandom(baseSpirit.aspects, rng) ?? undefined;
        }
        selectedSpirits.push({ spirit, aspect });
    }

    return selectedSpirits;
}

function selectAdversary(data: AppData, options: EngineOptions, rng: RNG) {
    const adversaries = filterByExpansion(data.adversaries, options.expansions);
    const adversary = pickRandom(adversaries, rng);
    if (!adversary) {
        throw new Error("No adversaries available for the selected expansions");
    }
    return adversary;
}

function selectScenario(data: AppData, options: EngineOptions, rng: RNG) {
    const scenarios = filterByExpansion(data.scenarios, options.expansions);
    const scenario = pickRandom(scenarios, rng);
    if (!scenario) {
        throw new Error("No scenarios available for the selected expansions");
    }
    return scenario;
}

function selectLayout(data: AppData, options: EngineOptions, rng: RNG) {
    const boardCount = options.boardCount ?? options.numSpirits ?? 1;
    const layouts = data.layouts.filter((layout) => layout.validBoardCounts.includes(boardCount));
    return pickRandom(layouts, rng);
}

export function generateSetup(
    data: AppData,
    options: EngineOptions = {},
    rng: RNG = Math.random
): EngineResult {
    const mergedOptions = { ...DEFAULT_ENGINE_OPTIONS, ...options };
    const engineRng = rng;

    const selectedBoards = selectBoards(data, mergedOptions, engineRng);
    const selectedSpirits = selectSpirits(data, mergedOptions, engineRng);
    const adversary = selectAdversary(data, mergedOptions, engineRng);
    const scenario = selectScenario(data, mergedOptions, engineRng);
    const layout = selectLayout(data, mergedOptions, engineRng);
    const layoutTemplate = layout?.templates?.length ? pickRandom(layout.templates, engineRng) : null;

    return {
        selectedBoards,
        selectedSpirits,
        adversary,
        scenario,
        layout,
        layoutTemplate: layoutTemplate ?? null,
        options: mergedOptions,
        generatedAt: new Date().toISOString(),
    };
}
