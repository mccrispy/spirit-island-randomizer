import type { EngineResult } from "./engine/types";
import type { SettingsState } from "./persistence";

const BASE_URL = "http://play.spiritislanddigital.com/screen/NewGame?";

// Maps SettingsState expansion flags to Spirit Island Digital URL expansion identifiers.
const EXPANSION_FLAG_TO_URL_ID: Array<[keyof SettingsState, string]> = [
    ["expansionBranchClaw", "BranchAndClaw"],
    ["expansionJaggedEarth", "JaggedEarth"],
    ["expansionNatureIncarnate", "NatureIncarnate"],
];

// Maps data expansion names to URL expansion identifiers.
const EXPANSION_DATA_NAME_TO_URL_ID: Record<string, string> = {
    "Branch & Claw": "BranchAndClaw",
    "Jagged Earth": "JaggedEarth",
    "Nature Incarnate": "NatureIncarnate",
};

const PRACTICE_MODE_SETTINGS: Array<[keyof SettingsState, string]> = [
    ["practiceNoBlightCard", "NoBlightCard"],
    ["practiceStartOfGameGrowth", "StartOfGameGrowth"],
    ["practiceSkipInitialInvaderActions", "SkipInitialInvaderActions"],
    ["practiceUnlimitedUndo", "UnlimitedUndo"],
];

// Collects expansion IDs present in the result content (spirits, boards, adversary, scenario).
function expansionsFromResult(result: EngineResult): Set<string> {
    const ids = new Set<string>();
    const addFromName = (name: string) => {
        const id = EXPANSION_DATA_NAME_TO_URL_ID[name];
        if (id) ids.add(id);
    };
    for (const { spirit } of result.selectedSpirits) addFromName(spirit.expansion);
    for (const { board } of result.selectedBoards) board.expansions.forEach(addFromName);
    if (result.selectedAdditionalBoard) result.selectedAdditionalBoard.board.expansions.forEach(addFromName);
    if (result.adversary) addFromName(result.adversary.expansion);
    if (result.scenario) addFromName(result.scenario.expansion);
    return ids;
}

export function buildWebLaunchUrl(result: EngineResult, settings: SettingsState): string {
    const parts: string[] = [];

    // When an aspect is the selected spirit, its base spirit goes to spirits= and its own name to aspects=.
    const baseSpirits: string[] = [];
    const aspects: string[] = [];
    for (const { spirit } of result.selectedSpirits) {
        if (spirit.spiritType === "Aspect") {
            if (spirit.baseSpiritName && !baseSpirits.includes(spirit.baseSpiritName)) {
                baseSpirits.push(spirit.baseSpiritName);
            }
            aspects.push(spirit.canonicalName);
        } else {
            baseSpirits.push(spirit.canonicalName);
        }
    }

    if (baseSpirits.length) parts.push(`spirits=${baseSpirits.join(",")}`);

    // Thematic mode uses the thematic side canonical name; non-thematic uses board canonical name.
    const boardNames: string[] = [];
    const boardSideByCanonicalName = new Map<string, string>(
        [
            ...result.selectedBoards,
            ...(result.selectedAdditionalBoard ? [result.selectedAdditionalBoard] : []),
        ].map(({ board, boardSide }) => [board.canonicalName, boardSide.canonicalName] as [string, string]),
    );

    if (result.boardPositions) {
        for (let position = 1; position <= Object.keys(result.boardPositions).length; position += 1) {
            const board = result.boardPositions[position];
            if (!board) continue;
            boardNames.push(
                settings.useThematicBoards
                    ? (boardSideByCanonicalName.get(board.canonicalName) ?? board.canonicalName)
                    : board.canonicalName,
            );
        }
    } else {
        for (const { board, boardSide } of result.selectedBoards) {
            boardNames.push(settings.useThematicBoards ? boardSide.canonicalName : board.canonicalName);
        }
        if (result.selectedAdditionalBoard) {
            const { board, boardSide } = result.selectedAdditionalBoard;
            boardNames.push(settings.useThematicBoards ? boardSide.canonicalName : board.canonicalName);
        }
    }
    if (boardNames.length) parts.push(`boards=${boardNames.join(",")}`);

    if (result.layoutUrlString) parts.push(`layout=${result.layoutUrlString}`);
    if (result.adversary) parts.push(`adversary=${result.adversary.canonicalName}`);
    if (result.scenario) parts.push(`scenario=${result.scenario.canonicalName}`);

    const expansionIds = new Set(
        EXPANSION_FLAG_TO_URL_ID
            .filter(([key]) => settings[key as keyof SettingsState])
            .map(([, id]) => id)
    );

    const sortedExpansionIds = [...expansionIds].sort();
    if (sortedExpansionIds.length) parts.push(`useExpansions=${sortedExpansionIds.join(",")}`);

    // Tokens come from Branch & Claw and Jagged Earth content.
    const tokenExpansionIds = new Set([...expansionIds, ...expansionsFromResult(result)]);
    if (tokenExpansionIds.has("BranchAndClaw") || tokenExpansionIds.has("JaggedEarth")) parts.push("useTokens=1");

    const noBlightCard = settings.practiceNoBlightCard;
    if (settings.useEvents && !noBlightCard) parts.push("useEvents=1");

    const practiceModes = PRACTICE_MODE_SETTINGS
        .filter(([key]) => settings[key])
        .map(([, id]) => id);
    if (practiceModes.length) parts.push(`practiceModes=${practiceModes.join(",")}`);

    if (aspects.length) parts.push(`aspects=${aspects.join(",")}`);

    return BASE_URL + parts.join("&");
}

export function buildSteamLaunchUrl(result: EngineResult, settings: SettingsState): string {
    const webUrl = buildWebLaunchUrl(result, settings);
    const spiritIslandUrl = webUrl.replace("http://play.spiritislanddigital.com/", "spiritisland://");
    return `steam://run/1236720/?url=${encodeURIComponent(spiritIslandUrl)}`;
}
