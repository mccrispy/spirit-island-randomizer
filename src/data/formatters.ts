import type { Spirit } from "./types";

const EXPANSION_ABBREVIATIONS: Record<string, string> = {
  "Base Game": "BG",
  "Branch & Claw": "BC",
  "Feather & Flame": "FF",
  "Horizons of Spirit Island": "Ho",
  "Jagged Earth": "JE",
  "Nature Incarnate": "NI",
};

const COMPLEXITY_ABBREVIATIONS: Record<string, string> = {
  Low: "L",
  Moderate: "M",
  High: "H",
  "Very High": "VH",
};

export function getExpansionAbbreviation(expansion: string): string {
  return EXPANSION_ABBREVIATIONS[expansion] ?? expansion;
}

export function getExpansionIndicator(expansions: string | string[]) {
  const expansionNames = (Array.isArray(expansions) ? expansions : [expansions])
    .map((expansion) => expansion.trim())
    .filter(Boolean);

  if (expansionNames.length === 0) return null;

  return {
    label: `[${expansionNames.map(getExpansionAbbreviation).join(", ")}]`,
    title: `${expansionNames.length === 1 ? "Expansion" : "Expansions"}: ${expansionNames.join(", ")}`,
  };
}

export function getComplexityAbbreviation(complexity: string): string {
  return COMPLEXITY_ABBREVIATIONS[complexity] ?? complexity;
}

export function formatSpiritPoolLabel(spirit: Spirit): string {
  const complexity =
    spirit.spiritType === "Aspect"
      ? spirit.complexityModifier
      : spirit.complexityRating;

  return `${spirit.name}${complexity ? ` (${complexity})` : ""} [${getExpansionAbbreviation(spirit.expansion)}]`;
}
