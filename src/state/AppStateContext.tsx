import { createContext, useContext, useEffect, useReducer } from "react";
import { loadAllData } from "../data/loader";
import type { AppData } from "../data/types";
import { createSeededRng, generateSetup } from "../engine/randomizer";
import type { EngineResult, SelectionState } from "../engine/types";
import {
  buildDefaultSelectionState,
  defaultSettings,
  loadSelectionState,
  loadSettingsState,
  saveSelectionState,
  saveSettingsState,
} from "../persistence";
import type { SettingsState } from "../persistence";

interface AppState {
  data: AppData | null;
  selectionState: SelectionState | null;
  settings: SettingsState | null;
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
    }
  | { type: "selectionChanged"; selectionState: SelectionState }
  | { type: "settingsChanged"; settings: SettingsState }
  | { type: "generationStarted" }
  | { type: "generationSucceeded"; result: EngineResult }
  | { type: "failed"; error: string };

const initialState: AppState = {
  data: null,
  selectionState: null,
  settings: null,
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
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    loadAllData()
      .then((data) => {
        const savedSelection = loadSelectionState();
        const savedSettings = loadSettingsState();
        const selectionState =
          savedSelection ?? buildDefaultSelectionState(data);
        const settings = savedSettings ?? defaultSettings();
        if (!savedSelection) saveSelectionState(selectionState);
        if (!savedSettings) saveSettingsState(settings);
        dispatch({ type: "loaded", data, selectionState, settings });
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
