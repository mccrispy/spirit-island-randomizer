import { describe, expect, it } from "vitest";
import { reducer } from "./AppStateContext";
import { TriState } from "../engine/types";
import type { EngineResult, SelectionState } from "../engine/types";
import { defaultSettings } from "../persistence";

describe("app state reducer", () => {
  it("clears only the generated result", () => {
    const selectionState: SelectionState = { spirit: TriState.CHECKED };
    const settings = { ...defaultSettings(), numSpirits: 2 };
    const result = {} as EngineResult;
    const state = {
      data: null,
      selectionState,
      settings,
      savedSets: new Map(),
      result,
      error: null,
      running: false,
    };

    const cleared = reducer(state, { type: "resultCleared" });

    expect(cleared.result).toBeNull();
    expect(cleared.selectionState).toBe(selectionState);
    expect(cleared.settings).toBe(settings);
    expect(cleared.savedSets).toBe(state.savedSets);
    expect(cleared.error).toBeNull();
    expect(cleared.running).toBe(false);
  });
});
