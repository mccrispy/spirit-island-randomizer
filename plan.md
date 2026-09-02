# SIRPY Web Migration Plan

## Overview
This project is a static web port of the SIRPYv4 Spirit Island randomizer, built in React + Vite + TypeScript. The web app mirrors the Python reference behavior at the engine and UI levels, while keeping browser-local persistence and a lightweight static deployment model.

The design follows the Python PRM behavior closely, with the key corrected assumptions captured in the current project documentation:
- exactly three expansion checkboxes are exposed in the UI
- expansion settings do not gate local engine eligibility
- bulk actions are visibility-aware and respect active filters
- result formatting and forced highlighting follow the Python reference

## Current status
- Core engine and data layer are complete and validated.
- The UI shell, tabs, filters, bulk actions, grouped options panel, and results panel are all implemented.
- Browser-local persistence is complete and saves the selection/settings state across reloads.
- Launch URL generation for web launch and Steam launch is implemented and verified.
- The remaining scope is Phase 4 PWA support, which is the only major functional item left before final packaging.

## Project structure
- `public/` — static game data and app assets
- `src/` — application source
- `src/data/` — loader, data types, and parsing logic
- `src/engine/` — randomizer and engine rules
- `src/state/` — app state and reducer/provider
- `src/components/` — UI components and tab views
- `src/persistence.ts` — settings/selection save and restore logic
- `plan.md` — current project plan and status
- `README.md` — user-facing summary and setup instructions
- `ui-implementation-plan.md` — detailed staged implementation plan

## Completed work
- React/Vite project scaffold and app shell
- Game data loading and normalization for spirits, boards, adversaries, scenarios, and layouts
- Engine parity for randomization rules, compatibility checks, thematic boards, and additional board logic
- Tri-state selection model and UI across spirit, board, adversary, and scenario pools
- Options panel with board-generation settings and layout preference controls
- Results panel with forced highlighting, warnings, launch URL generation, a live pre-generation layout preview,
  and per-board "Position N" badges tied to the layout diagram's numbered slots
- Persistence sync for settings and selection state
- Project verification via Vitest with the current suite passing

## Remaining work
- Add PWA support: manifest, service worker, offline caching, and installability checks

## Milestone status
- Browser-local persistence: complete
- User can configure spirits, boards, adversaries, scenarios, and options: complete
- App can generate and display a valid setup: complete
- Launch URL generation: complete
- Test coverage remains green: complete in the current project state
- Board layout selection/display parity: complete
- PWA support: remaining

## Verification
- Latest test run: `npm test -- --run`
- Result: 5 test files passed, 64 tests passed

## Next steps
- Implement the PWA phase in `vite.config.ts` and related assets.
- Validate offline app shell/data loading in a browser after the installable build is configured.
