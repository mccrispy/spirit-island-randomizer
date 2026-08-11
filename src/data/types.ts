export interface Spirit {
  name: string;
  canonicalName: string;
  spiritType: "Base Spirit" | "Aspect";
  expansion: string;
  complexityRating?: string;
  hasAspects?: boolean;
  hasIncarna?: boolean;
  baseSpiritName?: string;
  complexityModifier?: string;
}

export interface BoardLand {
  number: number;
  terrainType: string;
  isCoastal?: boolean;
  setupComponents?: string[];
}

export interface BoardSide {
  sideType: string;
  identifier: string;
  canonicalName: string;
  lands: BoardLand[];
  incompatibleBoards?: string[];
}

export interface Board {
  name: string;
  canonicalName: string;
  sides: BoardSide[];
  expansions: string[];
  incompatibleBoards: string[];
}

export interface Adversary {
  name: string;
  canonicalName: string;
  expansion: string;
  levels: Array<Record<string, unknown>>;
}

export interface Scenario {
  name: string;
  canonicalName: string;
  expansion: string;
}

export interface LayoutTemplate {
  boardCounts: number[];
  pairs: string;
}

export interface BoardLayout {
  name: string;
  canonicalName: string;
  validBoardCounts: number[];
  templates: LayoutTemplate[];
  svgFile: string;
  description: string;
}

export interface AppData {
  spirits: Spirit[];
  aspects: Spirit[];
  boards: Board[];
  adversaries: Adversary[];
  scenarios: Scenario[];
  baseSpiritMap: Record<string, BaseSpirit>;
  layouts: BoardLayout[];
}

export interface BaseSpirit {
  spirit: Spirit;
  aspects: Spirit[];
}
