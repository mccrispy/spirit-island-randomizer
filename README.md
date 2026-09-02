# SIRPY Web

GitHub Pages port of the SIRPYv4 Spirit Island randomizer (React + Vite + TypeScript).

The engine and behavior are derived from the Python SIRPYv4 source at `C:\Users\mccri\Python Projects\SIRPYv4`.

## Current status
- React + Vite application shell: complete
- Data loader and types: implemented (`src/data/loader.ts`, `src/data/types.ts`); `aspect.baseSpiritName` normalized to canonical name at load time
- Engine port: implemented (`src/engine/randomizer.ts`) and validated with deterministic tests
- Randomizer parity steps 1-6 from the RPM are implemented (forced selections, additional board, thematic mode, compatibility gating, layout rendering, expansion-aware family selection)
- Strict Python parity enforced: engine requires explicit `selectionState` and throws otherwise
- Aspect linkage from source JSON is fixed (aspects are correctly attached to base spirit families)
- `use_adversaries`, `use_scenarios`, and expansion filtering are wired end-to-end
- Browser-local persistence implemented (`src/persistence.ts`): `selectionState` and `settingsState` are saved to and restored from `localStorage` on app load
- `SettingsState` covers all RPM settings keys including `useEvents`, `spiritTreeExpanded`, `localLaunch`, `preferredLayouts`, and exactly the RPM's 3 expansion checkboxes (Branch & Claw, Jagged Earth, Nature Incarnate) — Feather & Flame/Horizons content is fully usable via per-item tri-state selection only, with no dedicated checkbox, matching the RPM exactly
- App-load initialization: defaults are written to storage on first run; saved state is restored on subsequent loads
- Launch URL generation implemented (`src/launchUrl.ts`): `buildWebLaunchUrl` and `buildSteamLaunchUrl` produce the Handelabra canonical-parameter-order URL; expansion IDs are derived from both settings flags and result content; `useEvents` is a standalone game-behavior flag
- Both Web Launch and Steam Launch URLs are shown with full text in the result view
- Responsive tabbed selection UI: MVP complete, including tri-state spirit/aspect/board/adversary/scenario controls, options, and structured results
- RPM parity fixes verified against the Python reference source and implemented: expansion checkboxes only affect the launch URL (never local engine eligibility, which is per-item tri-state only); Nature Incarnate requires Jagged Earth; Use Events requires any expansion checkbox and auto-unchecks otherwise; Strict Board Compatibility defaults on and auto-disables/restores past 4 total boards; Thematic Boards toggle; thematic mode silently drops the additional board (with an on-screen warning) when 6 spirits + an additional board reach 7 total
- Forced-item highlighting in results (Python parity) is implemented ahead of schedule from the Phase 2 plan
- Tests: 56/56 passing via `vitest`

## Outstanding work
See [ui-implementation-plan.md](ui-implementation-plan.md) for the staged plan covering the remaining UI work.
- Phase 2: exact RPM UI polish for the spirit tab (filter row + bulk-action toolbar: expansion/complexity/name filters, Clear All Filters, Collapse/Expand All, Base Only, Aspects Only, Select All, Deselect All), board bulk actions, adversary/scenario sorting, and preferred board-layout controls (forced-item highlighting is already done, see above)
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
