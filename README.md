# Spirit Island Randomizer

**[Play it live](https://mccrispy.github.io/spirit-island-randomizer/)**

A browser-based randomizer for [Spirit Island](https://greaterthangames.com/spirit-island), the cooperative
board game. Pick which expansions, spirits, boards, adversaries, and scenarios you own, set your preferences,
and generate a randomized setup for your next game — entirely client-side, with no server or account needed.

## Features
- Fine-grained selection of spirits, boards, adversaries, and scenarios, including aspect variants
- Tri-state selection per item: unchecked / included / forced (guaranteed to appear in the result)
- Full set of play and board options: player count, difficulty adjustments, thematic vs. random board layouts,
  preferred layouts, and more
- Board layout diagrams shown for the selected/generated layout, including numbered board positions
- Generates both a plain-text summary and ready-to-use launch links for
  [Spirit Island Digital](http://play.spiritislanddigital.com)
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
Spirit Island is a trademark of Greater Than Games. This project is an unofficial, fan-made tool and is not
affiliated with or endorsed by Greater Than Games.
