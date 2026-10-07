# Spirit Island Randomizer

**[Play it live](https://mccrispy.github.io/spirit-island-randomizer/)**

A browser-based randomizer for [Spirit Island](https://greaterthangames.com/spirit-island), the cooperative
board game. Pick which expansions, spirits, boards, adversaries, and scenarios you own, set your preferences,
and generate a randomized setup for your next game — entirely client-side, with no server or account needed.

## Features
- Fine-grained selection of spirits, boards, adversaries, and scenarios, including aspect variants
- Tri-state selection per item: unchecked / included / forced (guaranteed to appear in the result), with left- and right-click controls
- Spirit Quick Picks apply only to items matching the current filters; container spirits and hidden items remain unchanged
- Collapsed spirit rows show an aspect-only summary of in-pool and forced aspects (for example,
  “Aspects: 2 in pool, 1 forced”); the base spirit is not included, and forced aspects count as in pool
- Only one base spirit or aspect per spirit family can be forced at a time; forcing another moves the previous one to In Pool
- Full set of play and board options: player count, difficulty adjustments, thematic vs. modular board layouts,
  per-board-count layout favourites and multiple layout exclusions, toggled for the selected layout; one-board
  games use the sole Standard layout
- Mobile-first action order with Results and Options before the selection tabs; desktop retains its workspace/sidebar layout
- Results can be cleared back to a live layout preview without changing saved options or pool selections
- Digital Game Play Options for expansion content and Event cards, plus shortcuts to include or skip adversary and scenario randomizers
- First-run defaults include Base Game, Branch & Claw, Feather & Flame, and Jagged Earth content, with aspects excluded until selected
- Board layout diagrams shown for the selected/generated layout, including numbered board positions
- Generates both a plain-text summary and ready-to-use launch links for
  [Spirit Island Digital](http://play.spiritislanddigital.com)
- Built-in User Guide tab with instructions on the mobile workflow, tri-state selector, filtering, aspect-family forcing, board layout favourites/exclusions, and game rules
- Profiles tab for saving, loading, and deleting named selection/settings profiles, plus a reset to first-run defaults &mdash; all stored locally in your browser, with no files to save or upload
- Header link to the project&rsquo;s GitHub Issues page for bug reports and suggestions
- Your selections and settings are saved locally in your browser and restored on your next visit — nothing is
  sent to a server

## How to run locally
1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open the printed local URL in your browser, choose your options, and click "Generate".

## Running tests

```bash
npm test
```

## Contributing / development notes
- Built with React, Vite, and TypeScript.
- `src/engine/randomizer.ts` contains the randomization logic; `src/data/loader.ts` loads and normalizes the
  game data under `public/data/`.
- Fixture files under `src/fixtures/python_state/` are used by `randomizer.test.ts` to validate the engine
  against known-good reference state; they aren't wired into the live UI.

## License
The original work in this project is licensed under the [Creative Commons
Attribution-NonCommercial-ShareAlike 4.0 International licence (CC BY-NC-SA
4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/). You may share and
adapt that work for non-commercial purposes, with attribution; adaptations must
be shared under the same licence.

This licence does not apply to Spirit Island names, artwork, game content, or
other third-party material in this project. Those remain subject to their
respective rights holders and licence terms. Spirit Island is a trademark of
Flat River Group. This project is an unofficial, fan-made tool and is not
affiliated with or endorsed by the rights holders.
