# Release requests

When asked to release, deploy, or publish the current branch, follow
[`playbooks/releasing-flow.md`](../playbooks/releasing-flow.md). Do not start
editing release files or publishing anything until the required confirmations
below have been received.

## Before editing

1. Check `git status --short --branch`. If there are unrelated or uncommitted
   changes, stop and ask how to proceed; do not overwrite or include them.
2. Fetch `origin` and confirm the branch is based on the latest `origin/main`.
   Follow the manual guide if the branch needs updating. Never push directly
   to protected `main`.
3. Inspect the commits and product diff since `origin/main`. Summarize the
   actual user-facing change and recommend the highest applicable impact:
   breaking change = major, compatible feature = minor, compatible fix = patch,
   and no product impact = none. Dependabot dependency updates are excluded.
   If the product change is already present in a successful Pages deployment
   without its version bump, treat it as a catch-up release, not as `none`.
   Confirm the deployed commit and that the base `[Unreleased]` notes describe
   the unversioned change.
4. Propose the exact changelog notes and version. Review README and the
   in-app User Guide for relevance; propose only changes needed to keep them
   accurate, and explicitly say when either needs no edit. Do not edit
   generated `README.html` or `playbooks/releasing-flow.html`.
5. Ask the user to confirm the impact and proposed changelog/README/User Guide
   changes. Do not edit these files until they approve.

## After approval

- Apply only the approved documentation edits. For a versioned release, put
  the approved release notes under `[Unreleased]` in `CHANGELOG.md`, then run
  the release dry run:

  ```powershell
  npm run release:prepare -- --base origin/main --impact patch --dry-run
  ```

  Replace `patch` with the confirmed `major` or `minor` impact. The dry run
  prints the exact release-metadata diff, applies it only in an isolated
  temporary copy, and runs release-tooling tests, app tests, and the production
  build there. If dependencies changed, it installs from the candidate
  lockfile in that copy. It must pass before applying the release metadata for
  real:

  ```powershell
  npm run release:prepare -- --base origin/main --impact patch
  ```

  For a catch-up release, use the explicit `--catch-up` commands below instead
  of these ordinary release commands.

  The real command updates the package version, lockfile, and changelog section;
  it does not stage, commit, push, create a PR, merge, deploy, or tag. If the
  dry run fails, report the failure and do not prepare or publish the release.
- For already-deployed product code that lacks its version bump, use the
  explicit catch-up path only when the base `[Unreleased]` notes describe that
  deployed change. Keep the approved SemVer impact and add `--catch-up` to
  both preparation commands:

  ```powershell
  npm run release:prepare -- --base origin/main --impact minor --catch-up --dry-run
  npm run release:prepare -- --base origin/main --impact minor --catch-up
  ```

  Replace `minor` only if the confirmed impact requires a different increase.
  The command refuses catch-up when this branch also changes product files or
  when the base release notes are missing/not carried into the versioned entry.
- For no product impact, run the dry run with `--impact none` to validate the
  current worktree without release metadata changes:

  ```powershell
  npm run release:prepare -- --base origin/main --impact none --dry-run
  ```

  Do not bump the version or create a release tag. The normal merge-to-main
  workflow may still run the existing Pages deployment.
- When opening/updating the PR, include exactly one `Release-impact: major`,
  `Release-impact: minor`, `Release-impact: patch`, or `Release-impact: none`
  line for app/source, public asset/data, build-configuration, or production
  dependency changes. For an approved catch-up, also include exactly one
  `Release-catch-up: true` line.
- Run the project tests/build and local release check:

  ```powershell
  npm test -- --run
  npm run build
  npm run release:check -- --base origin/main --impact patch
  ```

  Use the confirmed impact with `release:check`; use `none` for no-impact
  changes. Add `--catch-up` for an approved catch-up release.
- For UI or interaction changes, also serve the built app locally with
  `npm run preview -- --host 127.0.0.1` and exercise the affected user flows
  at both desktop and mobile viewport sizes before asking to push or
  open/update a PR. Check responsive layout and affected interactions in both
  sizes. If browser-based inspection is not available, state that limitation.
- Show the final diff and validation results. Ask before pushing the branch or
  opening/updating a PR. After PR checks pass, ask again before merging, since
  a merge to `main` triggers deployment. The local dry run cannot validate
  GitHub Pages itself; verify the live app's version and behavior only after
  the approved merge. Ask before creating/pushing a version tag.
- For `none`, do not make a version-only release PR. The catch-up exception is
  only for confirmed product changes already deployed without a version.
  Dependabot updates keep their existing exempt workflow.

If a command, branch check, or deployment result is unclear or fails, stop and
report the exact issue rather than guessing or silently continuing.
