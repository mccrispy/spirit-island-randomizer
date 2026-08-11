import type {
  Adversary,
  AppData,
  BaseSpirit,
  Board,
  BoardLayout,
  Scenario,
  Spirit,
} from "./types";

const expansionFiles = [
  "Base Game.json",
  "Branch and Claw.json",
  "Feather and Flame.json",
  "Horizons of Spirit Island.json",
  "Jagged Earth.json",
  "Nature Incarnate.json",
];

interface RawContentItem {
  Category?: string;
  Items?: unknown[];
}

interface RawDataFile {
  Expansion?: string;
  Contents?: RawContentItem[];
}

interface RawSpirit {
  Name?: string;
  CanonicalName?: string;
  SpiritType?: string;
  ComplexityRating?: string;
  HasAspects?: boolean;
  HasIncarna?: boolean;
  BaseSpiritName?: string;
  ComplexityModifier?: string;
}

interface RawBoardSide {
  SideType?: string;
  Identifier?: string;
  CanonicalName?: string;
  Lands?: unknown[];
  IncompatibleBoards?: string[];
}

interface RawBoard {
  Name?: string;
  Sides?: RawBoardSide[];
}

interface RawAdversary {
  Name?: string;
  CanonicalName?: string;
  Expansion?: string;
  Levels?: Array<Record<string, unknown>>;
}

interface RawScenario {
  Name?: string;
  CanonicalName?: string;
  Expansion?: string;
}

interface RawLayoutTemplate {
  BoardCounts?: number[];
  Pairs?: string;
}

interface RawLayout {
  Name?: string;
  CanonicalName?: string;
  ValidBoardCounts?: number[];
  Templates?: RawLayoutTemplate[];
  SVGFile?: string;
  Description?: string;
}

function assertString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function assertBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function assertArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeString(value: unknown): string {
  return assertString(value).trim();
}

function parseSpirit(item: unknown, expansionName: string): Spirit | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }
  const raw = item as RawSpirit;
  const name = normalizeString(raw.Name);
  const canonicalName = normalizeString(raw.CanonicalName);
  const spiritType = normalizeString(raw.SpiritType);
  if (!name || !canonicalName || !(spiritType === "Base Spirit" || spiritType === "Aspect")) {
    return null;
  }

  return {
    name,
    canonicalName,
    spiritType: spiritType === "Base Spirit" ? "Base Spirit" : "Aspect",
    expansion: expansionName,
    complexityRating: normalizeString(raw.ComplexityRating),
    hasAspects: raw.HasAspects,
    hasIncarna: raw.HasIncarna,
    baseSpiritName: normalizeString(raw.BaseSpiritName),
    complexityModifier: normalizeString(raw.ComplexityModifier),
  };
}

function parseBoard(item: unknown, expansionName: string): Board | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }
  const raw = item as RawBoard;
  const name = normalizeString(raw.Name);
  const sides = assertArray<RawBoardSide>(raw.Sides).map((side) => ({
    sideType: normalizeString(side.SideType),
    identifier: normalizeString(side.Identifier),
    canonicalName: normalizeString(side.CanonicalName),
    lands: assertArray(side.Lands).map(() => ({})),
    incompatibleBoards: assertArray(side.IncompatibleBoards),
  }));

  if (!name || !sides.length) {
    return null;
  }

  const canonicalName = sides[0].canonicalName || name;
  return {
    name,
    canonicalName,
    sides,
    expansions: [expansionName],
    incompatibleBoards: [],
  };
}

function parseAdversary(item: unknown, expansionName: string): Adversary | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }
  const raw = item as RawAdversary;
  const name = normalizeString(raw.Name);
  const canonicalName = normalizeString(raw.CanonicalName);
  if (!name || !canonicalName) {
    return null;
  }
  return {
    name,
    canonicalName,
    expansion: expansionName,
    levels: assertArray(raw.Levels),
  };
}

function parseScenario(item: unknown, expansionName: string): Scenario | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }
  const raw = item as RawScenario;
  const name = normalizeString(raw.Name);
  const canonicalName = normalizeString(raw.CanonicalName);
  if (!name || !canonicalName) {
    return null;
  }
  return {
    name,
    canonicalName,
    expansion: expansionName,
  };
}

function parseLayout(item: unknown): BoardLayout | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }
  const raw = item as RawLayout;
  const name = normalizeString(raw.Name);
  const canonicalName = normalizeString(raw.CanonicalName);
  if (!name || !canonicalName) {
    return null;
  }
  return {
    name,
    canonicalName,
    validBoardCounts: assertArray<number>(raw.ValidBoardCounts),
    templates: assertArray(raw.Templates).map((template) => ({
      boardCounts: assertArray<number>(template.BoardCounts),
      pairs: normalizeString(template.Pairs),
    })),
    svgFile: normalizeString(raw.SVGFile),
    description: normalizeString(raw.Description),
  };
}

export async function loadAllData(): Promise<AppData> {
  const spirits: Spirit[] = [];
  const boardsMap: Record<string, Board> = {};
  const adversaries: Adversary[] = [];
  const scenarios: Scenario[] = [];

  for (const filename of expansionFiles) {
    const response = await fetch(`/data/${encodeURIComponent(filename)}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}`);
    }
    const rawData = (await response.json()) as RawDataFile;
    const expansionName = normalizeString(rawData.Expansion) || filename.replace(/\.json$/i, "");

    for (const categoryItem of assertArray<RawContentItem>(rawData.Contents)) {
      const category = normalizeString(categoryItem.Category);
      const items = assertArray(categoryItem.Items);
      if (category === "Spirits") {
        for (const item of items) {
          const spirit = parseSpirit(item, expansionName);
          if (spirit) {
            spirits.push(spirit);
          }
        }
      } else if (category === "Boards") {
        for (const item of items) {
          const board = parseBoard(item, expansionName);
          if (board) {
            const existing = boardsMap[board.canonicalName];
            if (existing) {
              existing.expansions = Array.from(new Set([...existing.expansions, expansionName]));
              for (const side of board.sides) {
                if (!existing.sides.some((s) => s.canonicalName === side.canonicalName)) {
                  existing.sides.push(side);
                }
              }
            } else {
              boardsMap[board.canonicalName] = board;
            }
          }
        }
      } else if (category === "Adversaries") {
        for (const item of items) {
          const adversary = parseAdversary(item, expansionName);
          if (adversary) {
            adversaries.push(adversary);
          }
        }
      } else if (category === "Scenarios") {
        for (const item of items) {
          const scenario = parseScenario(item, expansionName);
          if (scenario) {
            scenarios.push(scenario);
          }
        }
      }
    }
  }

  const spiritsList = spirits.filter((spirit) => spirit.spiritType === "Base Spirit");
  const rawAspects = spirits.filter((spirit) => spirit.spiritType === "Aspect");

  // Deduplicate aspects by canonicalName (keep first occurrence)
  const aspectsMap = new Map<string, Spirit>();
  for (const a of rawAspects) {
    if (!aspectsMap.has(a.canonicalName)) {
      aspectsMap.set(a.canonicalName, a);
    }
  }
  const aspects = Array.from(aspectsMap.values());

  const baseSpiritMap: Record<string, BaseSpirit> = {};
  for (const baseSpirit of spiritsList) {
    baseSpiritMap[baseSpirit.canonicalName] = {
      spirit: baseSpirit,
      aspects: [],
    };
  }

  for (const aspect of aspects) {
    const baseName = aspect.baseSpiritName;
    if (baseName && baseSpiritMap[baseName]) {
      baseSpiritMap[baseName].aspects.push(aspect);
    }
  }

  const boardList = Object.values(boardsMap).map((board) => ({
    ...board,
    incompatibleBoards: Array.from(
      new Set(board.sides.flatMap((side) => side.incompatibleBoards || []))
    ),
  }));

  const layoutsResponse = await fetch("/data/board_layouts.json");
  if (!layoutsResponse.ok) {
    throw new Error("Failed to load board_layouts.json");
  }
  const layoutsData = await layoutsResponse.json();

  const layouts: BoardLayout[] = assertArray(layoutsData.Layouts).map((item) => {
    const parsed = parseLayout(item);
    if (!parsed) {
      throw new Error("Invalid board layout item");
    }
    return parsed;
  });

  return {
    spirits: spiritsList,
    aspects,
    boards: boardList,
    adversaries,
    scenarios,
    baseSpiritMap,
    layouts,
  };
}
