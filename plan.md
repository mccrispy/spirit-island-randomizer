# SIRPY Web Migration Plan

## Overview
Create a static web port of the SIRPYv4 Spirit Island randomizer that can be hosted on GitHub Pages. This initial implementation will use React + Vite + TypeScript and preserve the core randomizer behavior, launch URL generation, tri-state selection model, board/adversary/scenario selection, and localStorage persistence. Persistence should remain browser-local only; it should not expose easily user-editable raw files on disk, and the persisted state should be stored in an internal browser-friendly form rather than through a user-facing JSON file.

Parity policy decision: match Python app initialization semantics. On app load, the web app will initialize selectionState and settingsState from browser persistence, and generation will use that initialized state model. If no saved state exists, defaults are initialized in-memory and then persisted in browser storage.

## Project structure
- `public/` - static assets and game data JSON files
- `src/` - application source code
- `src/data/` - data model definitions and loader logic
- `src/App.tsx` - app shell and primary user interface container
- `src/styles.css` - base app styling
- `src/main.tsx` - React entry point
- `plan.md` - this migration and implementation plan

## Current state
- React/Vite scaffold is complete.
- `public/data/` contains the game JSON files and loader file names have been corrected.
- `src/data/loader.ts` parses the JSON data and returns sanitized `spirits`, `boards`, `adversaries`, `scenarios`, `layouts`, and `baseSpiritMap`.
- Aspect deduplication is implemented and the loader returns the correct aspect count.
- Aspect linkage to base spirit families is implemented from the upstream JSON schema (`BaseSpirit` / `BaseSpiritName`) so aspect selection behaves correctly.
- `src/App.tsx` loads data and displays counts successfully.
- The randomizer engine has been ported to TypeScript in `src/engine/randomizer.ts`.
- The engine supports board compatibility, multi-spirit selection, forced/optional spirit selection, additional board logic, thematic board mode, and layout selection.
- The engine applies settings-based toggles for `use_adversaries`, `use_scenarios`, and expansion filtering.
- The engine emits board position assignments and layout URL strings.
- The engine enforces strict Python parity: `selectionState` is required; generation throws if it is missing.
- The fixture UI displays spirit-to-board assignment slots and current engine result.
- Vitest tests are passing (33/33) for engine logic and loader integration, including a real Python-persisted selection/settings JSON fixture.
- `src/persistence.ts` is implemented: `loadSelectionState`, `saveSelectionState`, `loadSettingsState`, `saveSettingsState`, `buildDefaultSelectionState`, `settingsToExpansions`.
- `SettingsState` covers all RPM settings keys (all boolean expansion flags, `useEvents`, `spiritTreeExpanded`, `localLaunch`, `preferredLayouts`) plus two web-only expansion flags (`expansionFeatherFlame`, `expansionHorizons`).
- App-load initialization is implemented: on data load, `selectionState` and `settingsState` are restored from `localStorage`; if absent, defaults are initialized and persisted.
- `requireSpiritAspects` removed — this flag has no equivalent in the RPM; aspect selection is purely a `selectionState` concern.
- Expansion settings redesigned to match RPM: individual boolean flags instead of a derived string array; `settingsToExpansions()` computes the engine-facing `expansions[]` from flags.
- TypeScript project references fixed (`tsconfig.node.json` composite), `@types/react` and `@types/react-dom` installed, all pre-existing type errors resolved.

## Objectives
1. Port data loading from the Python project’s `data_files_v4/` JSON files.
2. Port the randomizer engine logic from `randomizer/engine.py` into TypeScript.
3. Implement a responsive web UI with:
   - Spirit pool selection
   - Boards/adversaries/scenarios selection
   - Expansion and play option controls
   - Generate, Copy, Launch, Save/Load profile, Save/Load result
4. Preserve tri-state selection semantics (unchecked, checked, forced).
5. Save and restore both settingsState and selectionState to browser-local storage (e.g. localStorage or IndexedDB) in an internal format, not as a user-editable plain JSON file.
6. Provide GitHub Pages-friendly static hosting.

## Phase 1: Core implementation
### Current progress
- Scaffold React/Vite app: complete
- Copy game data JSON files to `public/data`: complete
- Build TypeScript data interfaces for spirits, boards, adversaries, scenarios, layouts: complete
- Implement `loadAllData()` to parse the JSON files into web-friendly structures: complete
- Create the main introductory UI shell: complete
- App displays counts of spirits/boards/adversaries/scenarios: complete
- Data loader fixed for aspect deduplication and counts validated: complete
- Data loader fixed for aspect-base family linkage from source schema: complete
- Implement a first pass of the randomizer engine and verify data loading: complete
- Add engine unit tests and deterministic RNG support: complete
- Add real Python-persisted selection/settings integration test: complete
- Port Python parity steps 1-6 for randomizer behavior: complete
- Add assignment display in fixture UI (spirit -> board by slot): complete
- Add browser persistence scaffolding for settingsState and selectionState: complete
- App-load restore/initialization of settingsState and selectionState: complete
- Strict selectionState requirement enforced in engine (Python parity): complete
- SettingsState aligned to full RPM settings schema: complete
- TypeScript config and type errors resolved: complete
- Add launch URL generation for web launch and Steam launch support: pending

### Tasks
- Add launch URL generation for web launch and Steam launch support
- Build tri-state selection UI controls and wire them to engine options
- Build board/adversary/scenario selection controls and sorting/filtering
- Add profile/result save-load UX over browser-local persistence
- Split current single-file demo UI into focused components

### Success criteria
- App starts in the browser
- Game data loads successfully
- App displays counts of spirits/boards/adversaries/scenarios
- Engine logic is validated with deterministic tests
- Real Python-persisted JSON state is supported in test coverage
- Launch URL generation logic is present and can later be wired to UI

## Phase 2: Full feature completion
### Tasks
- Add spirit selection tab with tri-state tree and filters
- Add board/adversary/scenario selection controls with sorting and select/deselect operations
- Add options panel for expansion toggles and board-generation flags
- Add results panel with formatted output and copy functionality
- Implement save/load profile and result JSON handling
- Implement localStorage persistence across reloads
- Add About/help content and legal disclaimers
- Add unit tests for engine and data loader
- Build GitHub Pages deployment configuration

## Engine architecture and test strategy
- Treat the engine as a pure domain library, separate from the UI. The web loader lives in `src/data/`, and the engine lives in its own module under `src/engine/`.
- Base the engine implementation on the current Python SIRPYv4 source at `C:\Users\mccri\Python Projects\SIRPYv4`. Use that project as the authoritative reference for behavior, rules, and compatibility.
- Persist this requirement for the duration of the project: all engine logic and compatibility rules are derived from the Python SIRPYv4 source.
- Define a clean, immutable engine API:
  - inputs: parsed game data, selection state/options, and an injectable RNG function
  - output: a generated setup/result object with game setup details and invariants
- Avoid DOM/browser dependencies and side effects inside engine code. The engine should not access React, `window`, or storage directly.
- Use small composable helper functions for discrete rules:
  - `pickBoard()`
  - `resolveAdversary()`
  - `filterSpirits()`
  - `mapAspects()`
  - compatibility and expansion-rule helpers
- Keep randomness injectable for deterministic testing:
  - export `generateSetup(data, options, rng)`
  - use a seeded deterministic RNG in tests
  - provide a thin random wrapper for UI use
- Test the engine directly with Vite-compatible tooling such as `vitest`:
  - loader tests for data counts, aspect deduplication, and normalized parse output
  - engine unit tests for core randomization rules, board/adversary compatibility, and expansion handling
  - invariant tests for generated setup shape and expected game rules
  - launch URL generation tests for canonical parameter mapping
- Build the UI only after the engine is validated. The first UI pass should be a thin adapter that calls `generateSetup(...)`, displays the result, and defers richer selection and persistence features until the core logic is stable.
- Use the existing loader/types domain model as the foundation for the engine port to reduce translation risk and preserve data fidelity.
- Defer full GitHub Pages deployment and rich UI polish until the engine and test coverage are stable.

## Risks and mitigations
- **Tri-state selection logic**: implement as a separate reusable hook/component and test it thoroughly.
- **Thematic board rules and compatibility checks**: begin with the engine port and add regression tests early.
- **Launch URL mapping**: preserve existing parameter order and canonical names exactly.
- **Data parsing differences from Python**: keep the web loader simple; avoid strict schema enforcement on first pass.

## Next steps
### Recommended immediate work
1. Implement the full UI selection model and tri-state spirit selection controls.
2. Add board/adversary/scenario controls and expansion/options toggles (wired to the persisted `settingsState`).
3. Add launch URL generation and connect it to the result view.
4. Wire save-on-change for `settingsState` and `selectionState` to `localStorage`.

### Mapped task list
- `src/App.tsx`: add save-on-change for settingsState + selectionState.
- `src/components/SpiritSelection.tsx`: build tri-state spirit tree UI with forced/optional states.
- `src/components/OptionsPanel.tsx`: add expansion toggles, board count, layout, and other play options.
- `src/components/BoardSelection.tsx`: add board/adversary/scenario filters and selection controls.
- `src/components/ResultPanel.tsx`: render generated setup details, copy button, and launch URL.
- `src/engine/randomizer.ts`: add result-level forced metadata fields used by Python UI if needed.
- `src/engine/randomizer.test.ts`: add regression tests for launch URL generation.
- `vite.config.ts` / GitHub Pages config: add static deployment settings once UI is stable.

### Milestone criteria
- Browser-local persistence works without exposing raw JSON files.
- User can configure spirit/board/adversary/scenario/options in the UI.
- The app can generate a setup from UI state and display it in a result panel.
- Launch URL generation is implemented and ready for wiring.
- Core engine and loader tests remain green.
