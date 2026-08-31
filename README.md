# SIRPY Web

GitHub Pages port of the SIRPYv4 Spirit Island randomizer (React + Vite + TypeScript).

The engine and behavior are derived from the Python SIRPYv4 source at `C:\Users\mccri\Python Projects\SIRPYv4`.

## Current status
- React + Vite scaffold: complete
- Data loader and types: implemented (`src/data/loader.ts`, `src/data/types.ts`); `aspect.baseSpiritName` normalized to canonical name at load time
- Engine port: implemented (`src/engine/randomizer.ts`) and validated with deterministic tests
- Randomizer parity steps 1-6 from the RPM are implemented (forced selections, additional board, thematic mode, compatibility gating, layout rendering, expansion-aware family selection)
- Strict Python parity enforced: engine requires explicit `selectionState` and throws otherwise
- Aspect linkage from source JSON is fixed (aspects are correctly attached to base spirit families)
- `use_adversaries`, `use_scenarios`, and expansion filtering are wired end-to-end
- Browser-local persistence implemented (`src/persistence.ts`): `selectionState` and `settingsState` are saved to and restored from `localStorage` on app load
- `SettingsState` covers all RPM settings keys including `useEvents`, `spiritTreeExpanded`, `localLaunch`, `preferredLayouts`, and individual per-expansion boolean flags
- App-load initialization: defaults are written to storage on first run; saved state is restored on subsequent loads
- Launch URL generation implemented (`src/launchUrl.ts`): `buildWebLaunchUrl` and `buildSteamLaunchUrl` produce the Handelabra canonical-parameter-order URL; expansion IDs are derived from both settings flags and result content; `useEvents` is a standalone game-behavior flag
- Both Web Launch and Steam Launch URLs are shown with full text in the result view
- Tests: 49/49 passing via `vitest`

## Outstanding work
See [ui-implementation-plan.md](ui-implementation-plan.md) for the staged plan covering the remaining UI work:
- Phase 0: Tailwind v4 + Radix UI tooling, Context/reducer app state, responsive `AppShell`
- Phase 1: tri-state spirit/board/adversary/scenario selection UI, options panel, results panel, save-on-change wiring
- Phase 2: filters, sorting, forced-item highlighting (Python parity), layout template preference
- Phase 3: PWA support (installable, offline-capable)

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
