# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
