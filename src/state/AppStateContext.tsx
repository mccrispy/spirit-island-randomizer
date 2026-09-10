import { createContext, useContext, useEffect, useReducer } from "react";
import { loadAllData } from "../data/loader";
import type { AppData } from "../data/types";
import { createSeededRng, generateSetup } from "../engine/randomizer";
import type { EngineResult, SelectionState } from "../engine/types";
import {
  buildDefaultSelectionState,
  defaultSettings,
  deleteSavedSet,
  loadSavedSets,
  loadSelectionState,
  loadSettingsState,
  saveSavedSet,
  saveSelectionState,
  saveSettingsState,
} from "../persistence";
import type { SavedSet, SettingsState } from "../persistence";

interface AppState {
  data: AppData | null;
  selectionState: SelectionState | null;
  settings: SettingsState | null;
  savedSets: Map<string, SavedSet>;
  result: EngineResult | null;
  error: string | null;
  running: boolean;
}

type Action =
  | {
      type: "loaded";
      data: AppData;
      selectionState: SelectionState;
      settings: SettingsState;
      savedSets: Map<string, SavedSet>;
    }
  | { type: "selectionChanged"; selectionState: SelectionState }
  | { type: "settingsChanged"; settings: SettingsState }
  | { type: "savedSetsChanged"; savedSets: Map<string, SavedSet> }
  | { type: "generationStarted" }
  | { type: "generationSucceeded"; result: EngineResult }
  | { type: "failed"; error: string };

const initialState: AppState = {
  data: null,
  selectionState: null,
  settings: null,
  savedSets: new Map(),
  result: null,
  error: null,
  running: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "loaded":
      return { ...state, ...action, type: undefined } as AppState;
    case "selectionChanged":
      return { ...state, selectionState: action.selectionState };
    case "settingsChanged":
      return { ...state, settings: action.settings };
    case "savedSetsChanged":
      return { ...state, savedSets: action.savedSets };
    case "generationStarted":
      return { ...state, running: true, error: null };
    case "generationSucceeded":
      return { ...state, running: false, result: action.result };
    case "failed":
      return { ...state, running: false, error: action.error, result: null };
  }
}

interface AppStateContextValue extends AppState {
  setSelection: (selectionState: SelectionState) => void;
  setSettings: (settings: SettingsState) => void;
  generate: () => void;
  saveNamedSet: (name: string) => void;
  loadNamedSet: (name: string) => void;
  deleteNamedSet: (name: string) => void;
  resetToDefault: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    loadAllData()
      .then((data) => {
        const savedSelection = loadSelectionState(data);
        const savedSettings = loadSettingsState();
        const selectionState =
          savedSelection ?? buildDefaultSelectionState(data);
        const settings = savedSettings ?? defaultSettings();
        const savedSets = loadSavedSets(data);
        if (!savedSelection) saveSelectionState(selectionState);
        if (!savedSettings) saveSettingsState(settings);
        dispatch({
          type: "loaded",
          data,
          selectionState,
          settings,
          savedSets,
        });
      })
      .catch((error: unknown) =>
        dispatch({
          type: "failed",
          error: `Failed to load game data: ${error}`,
        }),
      );
  }, []);

  useEffect(() => {
    if (state.selectionState) saveSelectionState(state.selectionState);
  }, [state.selectionState]);

  useEffect(() => {
    if (state.settings) saveSettingsState(state.settings);
  }, [state.settings]);

  const value: AppStateContextValue = {
    ...state,
    setSelection: (selectionState) =>
      dispatch({ type: "selectionChanged", selectionState }),
    setSettings: (settings) => dispatch({ type: "settingsChanged", settings }),
    saveNamedSet: (name) => {
      if (!state.selectionState || !state.settings) return;
      const savedSets = saveSavedSet(
        state.savedSets,
        name,
        state.selectionState,
        state.settings,
      );
      dispatch({ type: "savedSetsChanged", savedSets });
    },
    loadNamedSet: (name) => {
      const savedSet = state.savedSets.get(name);
      if (!savedSet) return;
      dispatch({
        type: "selectionChanged",
        selectionState: savedSet.selectionState,
      });
      dispatch({ type: "settingsChanged", settings: savedSet.settings });
    },
    deleteNamedSet: (name) => {
      const savedSets = deleteSavedSet(state.savedSets, name);
      dispatch({ type: "savedSetsChanged", savedSets });
    },
    resetToDefault: () => {
      if (!state.data) return;
      dispatch({
        type: "selectionChanged",
        selectionState: buildDefaultSelectionState(state.data),
      });
      dispatch({ type: "settingsChanged", settings: defaultSettings() });
    },
    generate: () => {
      if (!state.data || !state.selectionState || !state.settings) {
        dispatch({ type: "failed", error: "Data not loaded yet." });
        return;
      }
      dispatch({ type: "generationStarted" });
      try {
        // PRM parity: expansion checkboxes never gate local eligibility, only per-item tri-state does.
        const options = {
          ...state.settings,
          selectionState: state.selectionState,
        };
        const result = generateSetup(
          state.data,
          options,
          createSeededRng((Math.random() * 0x100000000) >>> 0),
        );
        dispatch({ type: "generationSucceeded", result });
      } catch (error) {
        dispatch({ type: "failed", error: String(error) });
      }
    },
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context)
    throw new Error("useAppState must be used within AppStateProvider");
  return context;
}
