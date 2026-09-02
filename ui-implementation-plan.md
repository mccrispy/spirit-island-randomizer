# SIRPY Web — Staged UI Implementation Plan

This document is the authoritative staged plan for building the full selection/options/results UI on top of the
already-complete engine, data loader, and persistence layers (see [plan.md](plan.md) and [README.md](README.md)
for their status). It supersedes the "Next steps" section of `plan.md` for UI work specifically.

## Goal

Port the PyQt6 Python reference UI (`SIRPYv4`, at `C:\Users\mccri\Python Projects\SIRPYv4`) to a responsive,
web-native React UI, built in stages: (0) foundation/tooling, (1) MVP functional selection UI, (2) polish/parity
features, (3) board layout selection/display parity, (4) PWA support.

## Decisions

- **Layout**: responsive, web-native layout (not a literal desktop port), structured as **tabbed sections**
  (Spirits / Boards & Adversaries & Scenarios / About) with a **persistent Results panel** always visible (side
  panel on wide viewports, bottom panel/sheet on narrow), avoiding deep scrolling to reach Generate/Results.
- **Reference review correction**: the PRM uses a narrower set of options than the first pass assumed. The spirit/
  options UI is aligned to the exact RPM: there are exactly 3 expansion checkboxes (Branch & Claw, Jagged Earth,
  Nature Incarnate), with Feather & Flame and Horizons remaining in the per-item pool selection rather than as
  dedicated expansion toggles. Expansion settings are metadata for launch filtering and should not be treated as a
  local engine eligibility gate.
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

## Phase 2 — Polish & Parity Features — COMPLETE

The PRM parity and polish pass is implemented and in the app:

12. The spirit-tab control set is in place: filter row, name/complexity/expansion-based filtering, clear/reset,
    collapse/expand all, base-only/aspects-only actions, and select/deselect all behavior. The bulk logic respects
    the current visible subset when filters are active, matching the Python reference UI.
13. Board bulk controls and sorted adversary/scenario lists are implemented in `BoardsAdversariesScenariosTab`.
14. Forced-item highlighting is implemented in the results view and remains aligned with the Python reference
    behavior for spirits, boards, additional board, adversary, and scenario.
15. The board layout template selector + Preferred toggle is implemented in `OptionsPanel` and wired to
    `settings.preferredLayouts`.

The remaining project work is board layout selection/display parity (Phase 3, below), then the final PWA phase
(Phase 4).

## Phase 3 — Board Layout Selection & Display Parity — COMPLETE

PWA support (previously Phase 3) is deferred to Phase 4 in favor of bringing forward this PRM-parity feature.
The engine already models layout data (`BoardLayout`, `boardPositions`, `layoutUrlString`), but source review
against the PRM (`randomizer/engine.py`, `ui/main_window.py`, `data_files_v4/board_layouts.json`,
`assets/*.svg`) found two real gaps, not just missing polish:

- **Preferred layout is a no-op today.** `settings.preferredLayouts` is captured, persisted, and editable in
  `OptionsPanel`, but `selectLayout()` in `src/engine/randomizer.ts` ignores it and always picks randomly among
  valid layouts for the board count — `EngineOptions` doesn't even declare a preferred-layout field.
- **Thematic mode doesn't suppress layout selection.** The PRM always resolves `selected_layout = None` when
  Thematic Boards is enabled (and disables the layout combo). The web engine currently still computes/attaches a
  random Standard-family layout even in thematic mode, which is meaningless since layout template pairs describe
  standard board sides, not thematic sides.
- **No visual display exists at all.** `ResultsPanel` only prints the layout name as text. The PRM renders an SVG
  diagram via a `LayoutSvgWidget`, resolving asset filenames as `{totalBoards}-{layout.svgFile}.svg`, with
  `Wild.png` as the placeholder for layouts with no SVG (e.g. Archipelago — player-defined) and
  `{totalBoards}-thematic.svg` for thematic mode. These assets don't exist yet in this repo.

18. **Engine: honor preferred layout + null it out for thematic mode.**
    - Add `preferredLayouts?: Record<string, string>` to `EngineOptions` (`src/engine/types.ts`).
    - In `selectLayout()` (`src/engine/randomizer.ts`): return `null` immediately when `options.useThematicBoards`
      is true (PRM parity). Otherwise filter valid layouts for the resolved board count; if
      `preferredLayouts[String(boardCount)]` names one of them, use it directly (no RNG call); otherwise fall
      back to the existing `pickRandom`.
    - No change needed in `AppStateContext.tsx`'s `generate()` — `state.settings` (including `preferredLayouts`)
      is already spread into `options`; this step just makes the engine actually read it.
    - Extend `randomizer.test.ts`: preferred layout is honored when valid for the resolved board count; falls
      back to random when the stored preference isn't valid for that count (e.g. board count changed since it
      was set); thematic mode always yields `layout: null`, `boardPositions: null`, `layoutUrlString: ""`
      regardless of any preferred-layout setting.
19. **Options UI: disable layout controls in thematic mode.** In `OptionsPanel.tsx`, disable the layout
    `<select>` and "Preferred" checkbox when `settings.useThematicBoards` is true (mirrors the PRM disabling its
    combo), with a disabled-note consistent with existing patterns (e.g. "requires four boards or fewer").
    Existing preference storage is untouched — no need for the PRM's separate pre-thematic-selection save/restore
    since `preferredLayouts` already persists per board count independent of the thematic toggle.
20. **Bring in layout SVG assets.** Copy the 33 layout SVGs + `Wild.png` from
    `C:\Users\mccri\Python Projects\SIRPYv4\assets` into `public/assets/layouts/` in this repo, unchanged
    filenames (`1-Standard.svg` … `6-thematic.svg`, `Wild.png`). Skip `Ocean Background - small.jpg` (decorative
    backdrop, out of scope) and `4-Standard-8.svg` (unused 8-board experimental variant, no matching engine mode).
    These are the app author's own original assets reused across the same project's two implementations — no
    third-party licensing concern.
21. **`LayoutDisplay` component.** New `src/components/LayoutDisplay.tsx`, rendered in `ResultsPanel` alongside
    the existing "Layout: {name}" text line (kept for accessibility/no-image fallback). Props: `layout:
    BoardLayout | null`, `totalBoards: number`, `useThematicBoards: boolean`. Resolve the asset path with a small
    exported pure function (unit-testable without rendering), porting `_update_layout_svg`/`_load_svg_for_layout`:
    - `useThematicBoards` → `/assets/layouts/{totalBoards}-thematic.svg`.
    - else `layout` is `null` → render nothing (guard only; shouldn't normally happen post-generation outside
      thematic mode).
    - else `layout.svgFile` is empty (e.g. Archipelago) → `/assets/layouts/Wild.png` with alt text
      "Player-defined arrangement".
    - else → `/assets/layouts/{totalBoards}-{layout.svgFile}.svg`.
    Render as a plain `<img>` (static files served from `public/`, no inline-SVG import machinery needed), with an
    `onError` fallback (hide image, keep text line) for known gaps such as 7 total boards with Standard layout
    (no `7-Standard.svg` asset exists in the PRM either).
22. **Wire into `ResultsPanel.tsx`.** Compute `totalBoards` the same way the existing additional-board-dropped
    warning logic does (`result.selectedBoards.length + (result.selectedAdditionalBoard ? 1 : 0)`) and render
    `<LayoutDisplay layout={result.layout} totalBoards={totalBoards} useThematicBoards={settings.useThematicBoards} />`
    after the "Layout:" line.
23. **Pre-generation layout preview (PRM parity).** `ResultsPanel`'s "Waiting" state (before Generate is first
    pressed) now also renders `LayoutDisplay`, resolved from current `settings` rather than a result: total
    boards from `numSpirits`/`includeAdditionalBoard`, the preferred layout for that count (or `null` for
    "Random"), and `useThematicBoards`. `LayoutDisplay` gained a `showPlaceholderWhenNoLayout` prop so the
    `Wild.png` placeholder renders for the "Random"/no-preference case pre-generation, matching the PRM's
    behavior of showing `Wild.png` before a "Random" choice resolves. This updates live as options change.
24. **Board position numbering (extends PRM parity beyond the PRM itself).** The PRM's own result *text* only
    shows sequential enumeration, never layout position numbers — but its non-thematic layout SVGs (including
    Standard) have numeric text labels (1, 2, 3…) baked into the diagram, matching `board_positions` order
    (verified by reading the actual SVG XML, not just the PRM's Python source). Added a "Position N" badge next
    to each board (main spirit/board list + additional board) in `ResultsPanel`, built from a canonicalName →
    position lookup derived from `result.boardPositions` (not from list-order assumptions), shown only when
    `!useThematicBoards` (thematic board names are already the directional slot identifier, e.g. "North East").

*Out of scope / deferred:* interactive/clickable SVGs (PRM's is display-only too); the decorative
ocean-background backdrop.

*Depends on Phase 2 (result/options plumbing already in place). Steps 18-19 (engine + options) can proceed
independently of steps 20-22 (assets + display), but step 22 depends on step 21 which depends on step 20. Steps
23-24 are follow-on refinements once 18-22 are in place.*

The remaining project work is now limited to the final PWA phase (Phase 4, below), aside from ongoing UI polish
(below), which is not phase-gated.

## UI Polish (post-Phase 3, ongoing)

Small ergonomic refinements to the shell/results layout, done opportunistically rather than as a numbered phase:

- **Generate button relocated into `ResultsPanel`.** Previously lived in the `AppShell` page header, physically
  separate from where its output appears. Now a full-width button at the top of `ResultsPanel`, always visible
  (not gated on a result existing), with a contextual label: "Generate setup" → "Regenerate setup" once a
  result exists, "Generating..." while `running`. `AppShell`'s header is now title-only.
- **Launch links restyled as buttons.** `.launch-links` anchors previously used default browser link styling
  (easy to mistake for inert text). Restyled as bordered pill-buttons (`.launch-link`) matching the app's accent
  color, with hover/focus fill state and a CSS-appended "↗" glyph to signal they open something in a new tab.
  Added a "Launch setup" heading above them for consistency with other result section headings.
- **`ResultsPanel` moved above `OptionsPanel`** in the `side-stack`. Rationale: since Generate now lives in
  Results, that panel is the primary call-to-action — leading with it keeps the CTA reachable without scrolling
  past Options first (Fitts's-law-style proximity) and keeps generated output visible closest to the action that
  produced it (visibility-of-system-status). Required removing a mobile-only `.results-panel { order: 2; }` rule
  in `styles.css` that would otherwise have silently forced Results back below Options on narrow viewports,
  contradicting the new desktop DOM order (it only reordered within `.side-stack`'s grid, not the top-level
  tabs-vs-sidebar split).

## Phase 4 — PWA Support

25. Add `vite-plugin-pwa`, configure manifest (name, icons, theme color) and service worker (cache app shell +
    `public/data/*.json`, and now `public/assets/layouts/*`) in `vite.config.ts`.
26. Add icon assets, test offline load via browser devtools "Offline" mode.

*Depends on the stable app shell and data layer already being in place, and is unaffected by Phase 3.*

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
- `vite.config.ts` — Tailwind plugin wired (Phase 0, done); PWA plugin still pending (Phase 4)
- `src/styles.css` — Tailwind directives + app styling
- `src/state/AppStateContext.tsx`, `src/components/layout/AppShell.tsx`,
  `src/components/TriStateCheckbox.tsx`, `src/components/tabs/SpiritPoolTab.tsx`,
  `src/components/tabs/BoardsAdversariesScenariosTab.tsx`, `src/components/tabs/AboutTab.tsx`,
  `src/components/OptionsPanel.tsx`, `src/components/ResultsPanel.tsx` — all implemented
- `src/components/LayoutDisplay.tsx` — new in Phase 3, resolves/renders the layout SVG asset; also used for the
  pre-generation preview (step 23) via its `showPlaceholderWhenNoLayout` prop
- `public/assets/layouts/` — new in Phase 3, copied SVG/PNG assets from the PRM's `assets/` folder
- `src/components/ResultsPanel.tsx` — also renders the pre-generation layout preview (step 23), per-board
  "Position N" badges (step 24), and (UI Polish) the relocated Generate button + restyled launch links; now
  rendered before `OptionsPanel` in `AppShell`'s side-stack

## Verification

1. `npm test` (vitest) stays green throughout — no engine/data/persistence regressions.
2. `npm run dev` manual check after each phase: Phase 0 → app loads with empty tab shell, no console errors;
   Phase 1 → every spirit/aspect/board/adversary/scenario is tri-state toggleable, Generate produces a result
   honoring selections (forced items always appear, unchecked never appear), settings/selections persist across
   page reload (localStorage).
3. Resize browser to mobile width (devtools responsive mode) to confirm tabs/results layout doesn't require
   awkward full-page scrolling.
4. Phase 3: set a preferred layout for a given board count and Generate repeatedly — confirm the same layout is
   used (not random) until board count changes or the preference is cleared; toggle Thematic Boards on — layout
   control disables and Results shows `{n}-thematic.svg`; toggle back off — control re-enables with the prior
   preference intact; pick a no-SVG layout (Archipelago) and confirm the `Wild.png` placeholder renders instead
   of a broken image; before pressing Generate, confirm the Results panel already previews the current
   preferred/thematic layout (or `Wild.png` for "Random"), updating live as options change; after Generate,
   confirm each spirit/board line and the additional board (when present) show a "Position N" badge matching
   the numbered slots drawn on the layout SVG, and that the badge is absent in thematic mode.
5. UI Polish: confirm Results renders above Options in the side-stack on both desktop and mobile widths; confirm
   the Generate button lives in Results, is always visible, and its label changes appropriately
   (Generate/Regenerate/Generating...); confirm the launch links are visually button-like with a hover state.
6. Phase 4: use devtools Network "Offline" toggle after one online visit to confirm app shell + data still
   load.
