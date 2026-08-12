# Randomizer Parity Analysis (SIRPYv4 -> sirpy-web)

Date: 2026-08-12
Reference Python model: C:/Users/mccri/Python Projects/SIRPYv4

## Scope
This document captures the reference behavior of the Python randomizer engine and the current parity status of the web TypeScript engine. Use this as the source of truth for future randomizer implementation work in this repo.

## Reference Files Analyzed
- randomizer/engine.py
- models/selection_model.py
- models/data_models.py
- ui/main_window.py (_on_generate flow)
- tests/test_forced_items.py
- tests/test_one_per_base_constraint.py
- tests/test_aspects_in_results.py
- tests/test_e2e_user_scenarios.py
- tests/test_functionality.py
- tests/test_board_layouts.py

## Reference Engine Behavior (Python)

### 1) Tri-state semantics
- TriState values are integer based:
  - 0 = UNCHECKED
  - 1 = CHECKED (optional candidate)
  - 2 = INDETERMINATE (forced inclusion)
- Eligible means CHECKED or INDETERMINATE.
- This applies to spirits, boards, adversaries, and scenarios.

### 2) Spirit-family selection model
- Input spirit pool is base spirit families (BaseSpirit wrappers), not flat spirit records.
- A family is eligible if:
  - base spirit is CHECKED/INDETERMINATE, or
  - at least one aspect is CHECKED/INDETERMINATE.
- For each family, options are split into:
  - forced options (INDETERMINATE)
  - optional options (CHECKED)
- Selection is two-pass:
  - Pass 1: include all forced (one pick max per family output)
  - Pass 2: pick remaining families randomly, then one option inside each selected family
- Constraint errors:
  - forced count > requested spirit count -> error
  - optional families < remaining slots -> error
- Guarantee: one selected spirit per base family.

### 3) Board selection behavior
- Compatibility checks are used when strict compatibility is active and total boards in play is below 5.
- Supports forced boards (INDETERMINATE), including pre-validation that forced boards are mutually compatible.
- Supports additional board slot and compatibility-aware additional board search.
- Supports thematic board mode with fixed directional combinations and dedicated constraints.

### 4) Adversary/scenario behavior
- Supports forced adversary/scenario (at most one forced each).
- If exactly one forced item exists, it is chosen.
- If multiple forced adversaries or scenarios are selected, generation errors.
- Otherwise selects randomly from eligible pool.

### 5) Layout behavior
- Can assign board positions for selected layout templates.
- Can render layout URL string from template pair definitions.
- Standard/no-layout cases are handled separately.

### 6) Result semantics and formatting
- Result tracks forced metadata for:
  - spirits
  - boards
  - adversary
  - scenario
- Selected spirits and selected boards are shuffled independently to avoid deterministic forced pairing.
- Aspect display preserves base spirit context in formatted output.

## Current sirpy-web Status (TypeScript)

### Implemented / close to parity
- Spirit one-per-family core behavior exists.
- Forced spirit handling exists.
- Optional spirit family fill behavior exists.
- Selection fixture adapter supports wrapped and flat fixture shapes.
- Boards/adversaries/scenarios now honor tri-state eligibility and forced-item constraints.
- Settings toggles `use_adversaries` and `use_scenarios` are wired and honored by engine output.
- Additional board selection now exists with uniqueness and compatibility-aware selection.
- Thematic board mode now uses fixed directional combinations.
- Layout board positions and layout URL string rendering now exist.
- Strict board compatibility gating now uses total boards in play (< 5) and no longer uses a small-pool bypass.
- Spirit family options now honor expansion filtering in selection-state flow.
- Non-thematic runs now always use standard board sides; thematic side selection is confined to thematic mode.
- Loader now resolves aspect family linkage from source schema (`BaseSpirit`/`BaseSpiritName`) so aspect selections are actually selectable.
- Engine now requires explicit `selectionState` and throws when it is absent (strict Python parity).
- App-load restore of `selectionState` and `settingsState` from `localStorage` is implemented; defaults are initialized and persisted on first run.
- `SettingsState` covers all RPM settings keys (`useEvents`, `spiritTreeExpanded`, `localLaunch`, `preferredLayouts`) plus per-expansion boolean flags matching RPM structure.
- `requireSpiritAspects` removed: aspect selection is a `selectionState` concern only, matching RPM behavior.
- `aspect.baseSpiritName` normalized to canonical name in the loader so all callers receive a canonical key without further resolution.
- Launch URL generation implemented (`src/launchUrl.ts`); parameter order, canonical name usage, expansion ID mapping, `useTokens` logic, and `useEvents` as a standalone flag all match RPM behavior.

### Remaining known divergence
1. Result-level forced metadata fields (forced spirit/board/adversary/scenario markers) are tracked in the RPM result model but not yet emitted by the web engine. Needed if the UI needs to distinguish forced vs randomly-selected items in the result display.

## Recommended Porting Order
1. Add result-level forced metadata fields if the UI needs to distinguish forced vs random items.

## Working Rule For This Repo
When implementing or reviewing randomizer behavior, use this document first, then verify against SIRPYv4 source if needed. Avoid re-deriving the same baseline analysis unless reference code changes.
