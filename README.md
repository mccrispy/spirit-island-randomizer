# SIRPY Web

GitHub Pages port of the SIRPYv4 Spirit Island randomizer (React + Vite + TypeScript).

The engine and behavior are derived from the Python SIRPYv4 source at `C:\Users\mccri\Python Projects\SIRPYv4`.

## Current status
- React + Vite scaffold: complete
- Data loader and types: implemented (`src/data/loader.ts`, `src/data/types.ts`)
- Engine port: implemented (`src/engine/randomizer.ts`) and validated with deterministic tests
- Randomizer parity steps 1-6 from the RPM are implemented (forced selections, additional board, thematic mode, compatibility gating, layout rendering, expansion-aware family selection)
- Strict Python parity enforced: engine requires explicit `selectionState` and throws otherwise
- Aspect linkage from source JSON is fixed (aspects are correctly attached to base spirit families)
- `use_adversaries`, `use_scenarios`, and expansion filtering are wired end-to-end
- Browser-local persistence implemented (`src/persistence.ts`): `selectionState` and `settingsState` are saved to and restored from `localStorage` on app load
- `SettingsState` covers all RPM settings keys including `useEvents`, `spiritTreeExpanded`, `localLaunch`, `preferredLayouts`, and individual per-expansion boolean flags
- App-load initialization: defaults are written to storage on first run; saved state is restored on subsequent loads
- Tests: 33/33 passing via `vitest` (`src/engine/randomizer.test.ts`, `src/data/loader.test.ts`)

## Outstanding work
- Build the full selection UI (tri-state spirit tree, board/adversary/scenario selectors, expansion and option controls)
- Wire save-on-change for `settingsState` and `selectionState` to `localStorage`
- Add launch URL generation and launch actions in the results UI
- Split `App.tsx` into focused components (`SpiritSelection`, `OptionsPanel`, `BoardSelection`, `ResultPanel`)

## How to run
1. Install dependencies:

```bash
npm install
```

2. Run tests:

```bash
npm test
```

3. Start the dev server and open the app in your browser:

```bash
npm run dev
```

Click "Generate" on the home page to run the engine with the current persisted state and view the generated setup.

## Fixtures for testing
- Fixture files are stored at `src/fixtures/python_state/selection_state.json` and `src/fixtures/python_state/settings_state.json`.
- These are used in integration tests (`randomizer.test.ts`) to validate the engine against real Python-persisted state. They are not wired to the live UI.
