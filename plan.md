# SIRPY Web Migration Plan

## Overview
Create a static web port of the SIRPYv4 Spirit Island randomizer that can be hosted on GitHub Pages. This initial implementation will use React + Vite + TypeScript and preserve the core randomizer behavior, launch URL generation, tri-state selection model, board/adversary/scenario selection, and localStorage persistence.

## Project structure
- `public/` - static assets and game data JSON files
- `src/` - application source code
- `src/data/` - data model definitions and loader logic
- `src/App.tsx` - app shell and primary user interface container
- `src/styles.css` - base app styling
- `src/main.tsx` - React entry point
- `plan.md` - this migration and implementation plan

## Objectives
1. Port data loading from the Python project’s `data_files_v4/` JSON files.
2. Port the randomizer engine logic from `randomizer/engine.py` into TypeScript.
3. Implement a responsive web UI with:
   - Spirit pool selection
   - Boards/adversaries/scenarios selection
   - Expansion and play option controls
   - Generate, Copy, Launch, Save/Load profile, Save/Load result
4. Preserve tri-state selection semantics (unchecked, checked, forced).
5. Save settings + selection state to localStorage.
6. Provide GitHub Pages-friendly static hosting.

## Phase 1: Core implementation
### Tasks
- Scaffold React/Vite app
- Copy game data JSON files to `public/data`
- Build TypeScript data interfaces for spirits, boards, adversaries, scenarios, layouts
- Implement `loadAllData()` to parse the JSON files into web-friendly structures
- Create the main introductory UI shell
- Implement a first pass of the randomizer engine and verify data loading
- Add launch URL generation for web launch and Steam launch support
- Add localStorage persistence scaffolding

### Success criteria
- App starts in the browser
- Game data loads successfully
- App displays counts of spirits/boards/adversaries/scenarios
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

## Risks and mitigations
- **Tri-state selection logic**: implement as a separate reusable hook/component and test it thoroughly.
- **Thematic board rules and compatibility checks**: begin with the engine port and add regression tests early.
- **Launch URL mapping**: preserve existing parameter order and canonical names exactly.
- **Data parsing differences from Python**: keep the web loader simple; avoid strict schema enforcement on first pass.

## Next steps
1. Install dependencies in `sirpy-web/`.
2. Copy the full set of game JSON files into `public/data/`.
3. Implement the randomizer engine in TypeScript.
4. Build the first UI version that confirms data loading and game counts.
5. Expand UI and persistence in a second pass.
