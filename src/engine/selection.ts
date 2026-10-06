import type { BaseSpirit } from "../data/types";
import { TriState, type SelectionState } from "./types";

export function normalizeForcedSpiritSelections(
  selectionState: SelectionState,
  baseSpiritMap: Record<string, BaseSpirit>,
  preferredForcedName?: string,
): SelectionState {
  const normalized = { ...selectionState };

  for (const { spirit, aspects } of Object.values(baseSpiritMap)) {
    const familyMembers = [spirit, ...aspects];
    const forcedMembers = familyMembers.filter(
      ({ canonicalName }) =>
        normalized[canonicalName] === TriState.INDETERMINATE,
    );

    if (forcedMembers.length < 2) continue;

    const retainedForcedMember =
      forcedMembers.find(
        ({ canonicalName }) => canonicalName === preferredForcedName,
      ) ?? forcedMembers[0];

    for (const member of forcedMembers) {
      if (member.canonicalName !== retainedForcedMember.canonicalName) {
        normalized[member.canonicalName] = TriState.CHECKED;
      }
    }
  }

  return normalized;
}
