# SIRPY Web — Staged UI Implementation Plan

This document is the authoritative staged plan for building the full selection/options/results UI on top of the
already-complete engine, data loader, and persistence layers (see [plan.md](plan.md) and [README.md](README.md)
for their status). It supersedes the "Next steps" section of `plan.md` for UI work specifically.

## Goal

Port the PyQt6 Python reference UI (`SIRPYv4`, at `C:\Users\mccri\Python Projects\SIRPYv4`) to a responsive,
web-native React UI, built in stages: (0) foundation/tooling, (1) MVP functional selection UI, (2) polish/parity
features, (3) PWA support.

## Decisions

- **Layout**: responsive, web-native layout (not a literal desktop port), structured as **tabbed sections**
  (Spirits / Boards & Adversaries & Scenarios / About) with a **persistent Results panel** always visible (side
  panel on wide viewports, bottom panel/sheet on narrow), avoiding deep scrolling to reach Generate/Results.
- **Styling**: **Tailwind CSS v4** via the official `@tailwindcss/vite` plugin (no `postcss.config` needed) +
  **Radix UI primitives** (Tabs, Checkbox, Accordion/Collapsible, Select, Slider) for accessible unstyled building
  blocks. Pure npm dependencies, no native installs required.
- **State management**: React Context + `useReducer` for `selectionState`/`settings`/`data`/`result`, replacing
  the monolithic state currently in `src/App.tsx`. Avoids prop-drilling across tab components.
- **Tri-state control**: custom `TriStateCheckbox` wrapping Radix `Checkbox.Root`, cycling
  Unchecked → Checked → Forced (INDETERMINATE) → Unchecked on click, red styling for Forced (matches Python's
  `#E74C3C`).
- **Num Spirits control**: Radix `Slider` (1-6) with numeric readout, for Python parity — built directly in
  Phase 1. The `<select>` currently in `App.tsx` was throwaway test scaffolding and is not carried forward.
- **Forced-item highlighting**: a Python-parity requirement (Phase 2). Engine changes to `EngineResult` /
  `src/engine/randomizer.ts` to fully expose forced state (spirits/boards/additional board/adversary/scenario)
  are pre-authorized if the existing `forced: boolean` fields on `SelectedSpirit`/`SelectedBoard` prove
  insufficient.
- **Staging**: MVP-first — get all pools functionally selectable and Generate working end-to-end before layering
  filters/sorting/highlighting/PWA polish.
- **Persistence**: `localStorage` auto-save only (already implemented in `src/persistence.ts`). No file-dialog
  based profile save/load (Python's Save/Load Setup) in this plan.
- **Board layout SVG/image rendering**: skipped for now — Results panel shows text/data only.
- **PWA support**: included as its own final stage (manifest + service worker + offline caching of data JSON +
  app shell).

## Phase 0 — Foundation & Tooling

1. Add dependencies: `tailwindcss`, `@tailwindcss/vite`, `@radix-ui/react-tabs`, `@radix-ui/react-checkbox`,
   `@radix-ui/react-accordion`, `@radix-ui/react-select`, `@radix-ui/react-slider`. Wire `@tailwindcss/vite` into
   `vite.config.ts`. Replace/extend `src/styles.css` with Tailwind directives (or a new `src/index.css`).
2. Create `src/state/AppStateContext.tsx`: Context + reducer wrapping `data`, `selectionState`, `settings`,
   `result`, `error`, `running`, exposing actions (`setSelection`, `setSettings`, `generate`, etc.). Port the
   existing load/save logic from `src/App.tsx` (uses `src/persistence.ts` functions `loadSelectionState`,
   `loadSettingsState`, `buildDefaultSelectionState`, `defaultSettings`, `saveSelectionState`,
   `saveSettingsState`, `settingsToExpansions`) into this provider, with save-on-change wired via
   reducer/effect.
3. Create `src/components/layout/AppShell.tsx`: responsive shell — header, `Tabs.Root` (Radix) for section
   navigation, main content area, and a Results panel region (CSS grid/flex: side panel on wide viewports,
   stacked below on narrow, each independently scrollable to avoid whole-page scroll).
4. Rewrite `src/App.tsx` to just mount the `AppStateContext` provider + `AppShell` (remove existing inline
   monolithic markup/logic).

*Depends on: nothing (can start immediately). Steps 2-4 depend on step 1.*

## Phase 1 — MVP Functional Selection UI

5. `src/components/TriStateCheckbox.tsx` — reusable tri-state control (Unchecked/Checked/Forced cycle), used by
   all pool items.
6. `src/components/tabs/SpiritPoolTab.tsx` — tree of base spirits (from `data.baseSpiritMap`) each with nested
   aspects, `TriStateCheckbox` per node, using Radix `Accordion`/`Collapsible` for expand-collapse per base
   spirit.
7. `src/components/tabs/BoardsAdversariesScenariosTab.tsx` — boards (grid), adversaries (list), scenarios
   (list), each row using `TriStateCheckbox`. *Parallel with step 6.*
8. `src/components/tabs/AboutTab.tsx` — simple static info tab (port relevant text from Python's
   `about_tab.py`, no license file wiring needed). *Parallel with 6/7.*
9. `src/components/OptionsPanel.tsx` — expansion toggles (5 flags incl. Feather & Flame/Horizons), play options
   (use events/adversaries/scenarios), board options (additional board, strict compatibility, thematic boards,
   num spirits control — **Radix `Slider` (1-6) + numeric readout, matching Python parity**), all bound to
   `settings` from context and calling `saveSettingsState` on change.
10. `src/components/ResultsPanel.tsx` — Generate button + structured result display (spirits/boards/
    adversary/scenario/launch URLs), replacing the raw JSX currently in `App.tsx`; always visible per
    `AppShell` layout.
11. Wire `SpiritPoolTab`/`BoardsAdversariesScenariosTab` selection changes to update `selectionState` in context
    and call `saveSelectionState` (already implemented) on every change.

*Depends on Phase 0 completion. Steps 5-8 can proceed in parallel once step 5 (`TriStateCheckbox`) exists; 9-10
depend on `AppShell` (step 3) and context (step 2).*

## Phase 2 — Polish & Parity Features

12. Add a filter row to `SpiritPoolTab`: expansion dropdown, complexity dropdown, name search, "Clear All
    Filters" (Radix `Select` for dropdowns).
13. Add Select All/Deselect All buttons to the boards section; sortable adversary/scenario lists (by name,
    adversary also by difficulty) in `BoardsAdversariesScenariosTab`.
14. Forced-item highlighting (Python parity requirement — engine changes are in scope if needed): red styling
    (Tailwind class, matching Python's `#E74C3C`) applied wherever a `TriStateCheckbox` is in Forced state, and
    in `ResultsPanel` for forced spirits/boards/adversary/scenario. `SelectedSpirit`/`SelectedBoard` already
    expose a `forced: boolean` field in `src/engine/types.ts` — first verify this is populated correctly
    end-to-end (including additional board, adversary, scenario forced-state, since Python separately tracks
    `forced_spirit_canonical_names`/`forced_board_canonical_names` plus adversary/scenario forcing per
    [randomizer-reference-analysis.md](randomizer-reference-analysis.md)'s known gap). If adversary/scenario
    forced flags are missing from `EngineResult`, add them in `src/engine/randomizer.ts`/`types.ts` (with test
    coverage) before wiring the UI highlighting — this is an authorized engine change, not just a UI task.
15. Board layout template dropdown + "Preferred" checkbox in `OptionsPanel`, wired to
    `settings.preferredLayouts`.

*Depends on Phase 1. Steps 12-15 are independent of each other, can be done in any order.*

## Phase 3 — PWA Support

16. Add `vite-plugin-pwa`, configure manifest (name, icons, theme color) and service worker (cache app shell +
    `public/data/*.json`) in `vite.config.ts`.
17. Add icon assets, test offline load via browser devtools "Offline" mode.

*Depends on Phase 1 (needs a working app to cache). Independent of Phase 2.*

## Relevant files

- `src/App.tsx` — replace monolithic logic with provider + `AppShell` mount (Phase 0 step 4)
- `src/persistence.ts` — reuse existing `SettingsState`, `loadSelectionState`/`saveSelectionState`/
  `loadSettingsState`/`saveSettingsState`/`buildDefaultSelectionState`/`defaultSettings`/`settingsToExpansions`
  (no changes expected)
- `src/engine/randomizer.ts`, `src/engine/types.ts` — consume `generateSetup`/`createSeededRng`;
  `TriState`/`SelectionState`/`EngineOptions`/`EngineResult` types; possible forced-metadata addition in
  Phase 2 step 14
- `src/data/loader.ts`, `src/data/types.ts` — consume `AppData`, `baseSpiritMap`, `BaseSpirit` for tree
  structure
- `src/launchUrl.ts` — reuse `buildWebLaunchUrl`/`buildSteamLaunchUrl` in `ResultsPanel`
- `vite.config.ts` — add Tailwind plugin (Phase 0), PWA plugin (Phase 3)
- `src/styles.css` (or new `src/index.css`) — Tailwind directives
- New: `src/state/AppStateContext.tsx`, `src/components/layout/AppShell.tsx`,
  `src/components/TriStateCheckbox.tsx`, `src/components/tabs/SpiritPoolTab.tsx`,
  `src/components/tabs/BoardsAdversariesScenariosTab.tsx`, `src/components/tabs/AboutTab.tsx`,
  `src/components/OptionsPanel.tsx`, `src/components/ResultsPanel.tsx`

## Verification

1. `npm test` (vitest) stays green throughout — no engine/data/persistence regressions.
2. `npm run dev` manual check after each phase: Phase 0 → app loads with empty tab shell, no console errors;
   Phase 1 → every spirit/aspect/board/adversary/scenario is tri-state toggleable, Generate produces a result
   honoring selections (forced items always appear, unchecked never appear), settings/selections persist across
   page reload (localStorage).
3. Resize browser to mobile width (devtools responsive mode) to confirm tabs/results layout doesn't require
   awkward full-page scrolling.
4. Phase 3: use devtools Network "Offline" toggle after one online visit to confirm app shell + data still
   load.
