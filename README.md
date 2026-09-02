# SIRPY Web

GitHub Pages port of the SIRPYv4 Spirit Island randomizer (React + Vite + TypeScript).

The engine and behavior are derived from the Python SIRPYv4 source at `C:\Users\mccri\Python Projects\SIRPYv4`.

## Current status
- React + Vite app: implemented and working end-to-end
- Data loader and types: complete (`src/data/loader.ts`, `src/data/types.ts`); aspect names are normalized and linked correctly to their base spirits
- Engine port: complete (`src/engine/randomizer.ts`) and validated in deterministic tests
- Randomizer parity: implemented for forced selections, additional board handling, thematic mode, compatibility rules, layout handling, and expansion-aware selection behavior
- Strict Python parity: enforced in engine code; generation requires explicit `selectionState`
- Browser persistence: complete (`src/persistence.ts`); `selectionState` and `settingsState` restore from and save to `localStorage`
- Settings model: matches the corrected PRM behavior with exactly three expansion checkboxes (Branch & Claw, Jagged Earth, Nature Incarnate), plus the full set of play and board options used by the reference app
- Responsive UI: complete with tabbed selection pages, grouped options controls, persistent results panel, bulk actions, filter row, sorting, and board layout preference controls
- Launch URL generation: complete (`src/launchUrl.ts`); both Web Launch and Steam Launch URLs are generated and shown in the results panel
- Forced highlighting and warnings: implemented to match the PRM result presentation, including additional-board warnings and forced item emphasis
- Project verification: the latest Vitest run completed successfully with 5 test files passing and 64 tests passing
- Board layout parity: preferred-layout settings are honored by the engine, layout selection is suppressed in
  thematic mode, and the results panel renders the PRM's SVG layout diagrams (`src/components/LayoutDisplay.tsx`,
  assets under `public/assets/layouts/`), including a live pre-generation preview of the currently selected
  layout and "Position N" badges tying each board to its numbered slot in the layout diagram (not shown in
  thematic mode, where board names are already directional slot identifiers)
- UI polish: the Generate button now lives in the results panel itself (always visible, contextual label),
  launch links are styled as clearly clickable buttons, and the results panel is positioned above the options
  panel so the primary action and its output are reachable without scrolling past configuration controls first

## Reference UI review corrections
The review against the Python PRM clarified the design in a few important ways:
- The RPM exposes exactly 3 expansion checkboxes: Branch & Claw, Jagged Earth, and Nature Incarnate.
- Feather & Flame and Horizons remain selectable through per-item tri-state selection rather than dedicated expansion switches.
- Expansion toggles are not a local engine eligibility gate; eligibility is derived from item-level selection state.
- Nature Incarnate requires Jagged Earth.
- Use Events requires an active expansion.
- Spirit bulk actions are visibility-aware: when filters are active, they operate only on the currently visible items.

## Outstanding work
- Phase 4 PWA support: installable/offline-capable app shell and data caching in the production build

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
