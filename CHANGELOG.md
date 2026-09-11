# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-09-11
### Changed
- **Tri-state legend**: The legend icons for Excluded/In pool/Forced now visually match the actual selection checkboxes, instead of using slightly different colours.
- **Profiles reset layout**: The Reset section's description and button now sit on one line, matching the style of the other Profiles sections.
- **About tab**: The page heading now includes the app version directly, and the introductory paragraph was removed since the same information is now covered by the User Guide.
- **User Guide wording**: Clarified the explanation of Digital Game Play Options (expansion content vs. Events/Command Beasts).

### Fixed
- **Mobile layout**: Fixed an issue where the Spirit tab's filter and quick-picks panels could overlap and become unusable on narrow/mobile screens.

## [1.3.0] - 2026-09-10
### Added
- **Named profiles**: A new Profiles tab lets you save your current spirit/board selections and settings under a name, then load or delete saved profiles later, all stored locally in your browser.
- **Reset to default**: The Profiles tab also lets you reset your current selections and settings back to the app's first-run defaults (with a confirmation prompt).
- **App version display**: The app version is now shown in the page footer and on the About tab.

## [1.2.0] - 2026-09-10
### Added
- **User Guide tab**: Dedicated tab providing an in-depth guide covering the tri-state selection system, spirit filtering vs. selection scope, board layout favourites by board count, game rules, and local saving.
- **Issue reporting link**: A persistent header link now opens the project&rsquo;s GitHub Issues page for bug reports and suggestions.

### Fixed
- **Random layout favourites**: Saving Random as a layout favourite now preserves that choice for its board count instead of replacing it with the first available layout.

### Changed
- **Tri-state guidance**: The User Guide now explains left-click, right-click, and keyboard selection controls, while saved layout favourites have a clearer visual state.
- **Option grouping**: Digital Game Play Options now groups expansion ownership with Event cards, while adversary and scenario switches are clearly labelled as randomizer shortcuts.
- **First-run setup**: New users now start with Base Game, Branch & Claw, Feather & Flame, and Jagged Earth content selected, no aspects selected, and a one-spirit game configured for adversary randomization.

## [1.1.2] - 2026-09-08
### Fixed
- **Zero-seed randomization**: Seeded generation with seed `0` now produces a deterministic sequence instead of repeatedly selecting the first random candidate.
- **About-tab credits**: The About tab now identifies Lightning Heart Games LLC as the owner/licensor of Spirit Island.

## [1.1.1] - 2026-09-07
### Fixed
- About tab now credits Lightning Heart Games LLC as the owner/licensor of Spirit Island, alongside the
  existing designer and publisher credits.

## [1.1.0] - 2026-09-03
### Fixed
- Boards list now sorts alphabetically (a board was previously appearing out of order at the end of the list).
- About tab no longer shows leftover "SIRPY" branding.
- Serpent Slumbering beneath the Island's Locus aspect was missing from the spirit list due to a
  capitalization mismatch in the source data ("beneath" vs "Beneath").

### Changed
- Spirit count and layout preference options moved to the top of the Options panel.

## [1.0.0] - 2026-09-02
### Added
- Initial public release: a browser-based Spirit Island setup randomizer.
- Selection of spirits, boards, adversaries, and scenarios, including aspect variants, with tri-state
  (unchecked/included/forced) selection per item.
- Full set of play and board options: player count, difficulty adjustments, thematic vs. random board
  layouts, preferred layouts, and more.
- Board layout diagrams for the selected/generated layout, including numbered board positions.
- Generated setup output as plain text, plus ready-to-use Web and Steam launch links for Spirit Island
  Digital.
- Selections and settings are saved locally in the browser and restored on return visits.
