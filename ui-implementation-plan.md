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

## Phase 0 — Foundation & Tooling — COMPLETE

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

## Phase 1 — MVP Functional Selection UI — COMPLETE

5. `src/components/TriStateCheckbox.tsx` — reusable tri-state control (Unchecked/Checked/Forced cycle), used by
   all pool items.
6. `src/components/tabs/SpiritPoolTab.tsx` — tree of base spirits (from `data.baseSpiritMap`) each with nested
   aspects, `TriStateCheckbox` per node, using Radix `Accordion`/`Collapsible` for expand-collapse per base
   spirit.
7. `src/components/tabs/BoardsAdversariesScenariosTab.tsx` — boards (grid), adversaries (list), scenarios
   (list), each row using `TriStateCheckbox`. *Parallel with step 6.*
8. `src/components/tabs/AboutTab.tsx` — simple static info tab (port relevant text from Python's
   `about_tab.py`, no license file wiring needed). *Parallel with 6/7.*
9. `src/components/OptionsPanel.tsx` — expansion toggles, play options
   (use events/adversaries/scenarios), board options (additional board, strict compatibility, thematic boards,
   num spirits control — **Radix `Slider` (1-6) + numeric readout, matching Python parity**), all bound to
   `settings` from context and calling `saveSettingsState` on change.

   **Correction (verified against the RPM source after initial implementation):** the RPM has exactly **3**
   expansion checkboxes (Branch & Claw, Jagged Earth, Nature Incarnate), not 5 — Feather & Flame/Horizons have
   no checkbox and are usable only via per-item tri-state selection. The RPM's expansion checkboxes affect only
   the launch URL (`useExpansions`/`useTokens`), never local engine eligibility (that's per-item tri-state only
   for all 6 expansions). An initial 5-flag design that also gated local eligibility was implemented, found to
   diverge from the RPM, and corrected. Also implemented per RPM: Nature Incarnate requires Jagged Earth;
   Use Events requires any expansion checkbox (both disable + force-uncheck when their requirement isn't met);
   Strict Board Compatibility (default on, auto-disables past 4 total boards, restores prior value when the
   count drops back); Thematic Boards checkbox (default off).
10. `src/components/ResultsPanel.tsx` — Generate button + structured result display (spirits/boards/
    adversary/scenario/launch URLs), replacing the raw JSX currently in `App.tsx`; always visible per
    `AppShell` layout. Includes PRM-format spirit/aspect/board labels, expansion abbreviations, forced-item
    highlighting (pulled forward from Phase 2 step 14 below), and the thematic-mode additional-board-dropped
    warning (`EngineResult.additionalBoardDroppedWarning`).
11. Wire `SpiritPoolTab`/`BoardsAdversariesScenariosTab` selection changes to update `selectionState` in context
    and call `saveSelectionState` (already implemented) on every change.

*Depends on Phase 0 completion. Steps 5-8 can proceed in parallel once step 5 (`TriStateCheckbox`) exists; 9-10
depend on `AppShell` (step 3) and context (step 2).*

## Phase 2 — Polish & Parity Features

**Step 14 (forced-item highlighting) is already done** — see step 10 above; `SelectedSpirit`/`SelectedBoard`'s
existing `forced: boolean` fields (plus `adversaryForced`/`scenarioForced`) proved sufficient end-to-end,
including for the additional board. No further engine change is needed for this item.

12. Add a filter row to `SpiritPoolTab`: expansion dropdown, complexity dropdown, name search, "Clear All
    Filters" (Radix `Select` for dropdowns).
13. Add Select All/Deselect All buttons to the boards section; sortable adversary/scenario lists (by name,
    adversary also by difficulty) in `BoardsAdversariesScenariosTab`.
15. Board layout template dropdown + "Preferred" checkbox in `OptionsPanel`, wired to
    `settings.preferredLayouts`.

*Depends on Phase 1. Steps 12, 13, 15 are independent of each other, can be done in any order.*

## Phase 3 — PWA Support

16. Add `vite-plugin-pwa`, configure manifest (name, icons, theme color) and service worker (cache app shell +
    `public/data/*.json`) in `vite.config.ts`.
17. Add icon assets, test offline load via browser devtools "Offline" mode.

*Depends on Phase 1 (needs a working app to cache). Independent of Phase 2.*

## Relevant files

- `src/App.tsx` — replaced with provider + `AppShell` mount (Phase 0 step 4, done)
- `src/persistence.ts` — reuses existing `SettingsState`, `loadSelectionState`/`saveSelectionState`/
  `loadSettingsState`/`saveSettingsState`/`buildDefaultSelectionState`/`defaultSettings`/`settingsToExpansions`;
  `SettingsState` trimmed to the RPM's 3 expansion flags (see Phase 1 step 9 correction above)
- `src/engine/randomizer.ts`, `src/engine/types.ts` — consume `generateSetup`/`createSeededRng`;
  `TriState`/`SelectionState`/`EngineOptions`/`EngineResult` types; forced-metadata fields
  (`adversaryForced`/`scenarioForced`/per-item `forced`) and `additionalBoardDroppedWarning` are implemented
  and test-covered
- `src/data/loader.ts`, `src/data/types.ts` — consume `AppData`, `baseSpiritMap`, `BaseSpirit` for tree
  structure
- `src/launchUrl.ts` — reused via `buildWebLaunchUrl`/`buildSteamLaunchUrl` in `ResultsPanel`
- `vite.config.ts` — Tailwind plugin wired (Phase 0, done); PWA plugin still pending (Phase 3)
- `src/styles.css` — Tailwind directives + app styling
- `src/state/AppStateContext.tsx`, `src/components/layout/AppShell.tsx`,
  `src/components/TriStateCheckbox.tsx`, `src/components/tabs/SpiritPoolTab.tsx`,
  `src/components/tabs/BoardsAdversariesScenariosTab.tsx`, `src/components/tabs/AboutTab.tsx`,
  `src/components/OptionsPanel.tsx`, `src/components/ResultsPanel.tsx` — all implemented

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
