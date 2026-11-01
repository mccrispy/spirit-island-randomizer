# Releasing to production

Production is hosted on GitHub Pages at
<https://mccrispy.github.io/spirit-island-randomizer/>. Pushing to `main`
automatically runs the **Deploy to GitHub Pages** workflow. It installs
dependencies, runs the tests, builds the site, and deploys `dist/` only if the
checks pass. A version tag by itself does not deploy the site.

## Protecting `main`

Import [`.github/rulesets/protect-main.json`](.github/rulesets/protect-main.json)
from **Settings → Rules → Rulesets → New branch ruleset → Import a ruleset**.
It requires changes to `main` to arrive through pull requests, allows squash
merges without requiring an approval, and blocks force-pushes and branch
deletion. It also requires the **Validate pull request** status check, which
runs the test suite and production build.

## Dependency update pull requests

The [Dependabot configuration](.github/dependabot.yml) checks npm dependencies
weekly and groups patch/minor updates. For npm, `package.json` declares direct
dependency ranges, while `package-lock.json` records the exact resolved
dependency tree installed by `npm ci`; Dependabot updates these files in its
pull requests. The configuration controls the update schedule and grouping,
not the lockfile.

Dependabot pull requests run the **Dependabot updates** workflow. It installs
from the lockfile, runs the complete test suite, and builds the production app.
After validation, identified patch and minor updates are squash-merged
automatically; major updates and updates whose version type cannot be
identified remain for manual review. A successful merge to `main` triggers the
GitHub Pages deployment workflow explicitly, because merges performed with
`GITHUB_TOKEN` do not trigger the normal `push` deployment event. These
dependency updates do not by themselves create a product release or version
tag.

## Release steps

1. Start from an up-to-date `main` branch with a clean working tree. This gives
   the release branch a current, known starting point and keeps unrelated work
   from accidentally entering the release. First inspect your current branch
   and changes. Do not discard uncommitted work: either commit it on its
   existing branch, or, if `git status` shows uncommitted changes, stash them
   (including untracked files) before switching branches:

   ```bash
   git status --short --branch
   # Run this only when there are uncommitted changes to preserve.
   git stash push --include-untracked -m "work before release"
   ```

   If the changes to release are already committed on another branch, note the
   commit hashes; you can cherry-pick the intended commits onto the release
   branch below instead of stashing them. Fetching updates Git's view of the
   remote branches. Pulling with `--ff-only` updates local `main` only when it
   can move forward without creating a merge commit; if it cannot, stop and
   investigate rather than forcing it.

   ```bash
   git fetch origin
   git switch main
   git pull --ff-only origin main
   git status --short --branch
   git switch -c release/vX.Y.Z
   git status --short
   ```

   The status after pulling should show `main` tracking `origin/main` with no
   modified or untracked files. If switching or pulling is blocked, stop and
   resolve that state without resetting or deleting work. If you stashed
   changes, restore them only after creating the release branch. `stash pop`
   reapplies and removes the stash when successful; if you prefer to keep the
   saved copy until the release is verified, use `git stash apply` and drop the
   stash later:

   ```bash
   git stash pop
   ```

   Alternatively, if the release changes are already committed on another
   branch, cherry-pick only those intended commits instead of restoring a
   stash:

   ```bash
   git cherry-pick <commit>
   ```

   Repeat for each intended commit, in order. If a cherry-pick or stash restore
   has conflicts, resolve them before continuing. Review the release branch
   with `git status --short` and `git diff` and leave unrelated or generated
   files out of the release.

2. Run the release checks locally:

   ```bash
   npm ci
   npm test -- --run
   ```

   `npm ci` checks that the lockfile can reproduce the install, and tests check
   behavior. Resolve failures before continuing. Build the production app in
   step 4, after setting its version, so the built files contain the release
   version rather than the previous one.

   On Windows, if `npm ci` fails with `EPERM` while unlinking a file under
   `node_modules`, a running Vite server may be locking it. Stop it with
   `Ctrl+C` in its terminal. If you cannot find that terminal, use PowerShell
   to inspect Node processes and identify the one whose command line points to
   this project:

   ```powershell
   Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
     Select-Object ProcessId, CommandLine
   ```

   Stop only the matching project process IDs, including the Vite child
   process, rather than all Node processes:

   ```powershell
   Stop-Process -Id <PID>
   ```

   Replace `<PID>` with each matching process ID shown above, then retry
   `npm ci`. If the error persists, another editor process or antivirus
   software may be holding the file.

3. Update `CHANGELOG.md`: move the completed items out of `[Unreleased]` into a
   dated `## [X.Y.Z] - YYYY-MM-DD` section, then leave a fresh, empty
   `[Unreleased]` section at the top. This records what users should expect
   from the release and keeps future work separate. Choose the version
   according to Semantic Versioning: patch for compatible fixes, minor for
   backward-compatible features, and major for breaking changes.

4. Set the application version in `package.json` and the root package entries
   in `package-lock.json` to the same `X.Y.Z`. Keeping these in sync ensures
   installs and the app report the same release version. Vite reads the
   version from `package.json` and injects it into the page footer and the
   heading on the About tab. Build after changing the version, then preview
   that build and confirm both places display the expected version (for
   example, `v1.8.0`):

   ```bash
   npm run build
   npm run preview
   ```

   `npm run preview` serves the existing `dist/` output; it does not rebuild
   it. Open the local URL printed by the command, check the footer, then open
   the About tab and check its heading.

5. Review the release diff and commit only intended files:

   ```bash
   git status --short
   git add CHANGELOG.md package.json package-lock.json
   # Add the other release files reviewed above.
   git diff --cached --check
   git diff --cached
   git commit -m "chore: release vX.Y.Z"
   ```

   The staged diff is the exact set of changes that the commit will contain.
   Review it after staging so accidental files or missing release files can be
   corrected before the commit.

6. Push the release branch and open a pull request to `main`. The pull request
   lets CI validate the exact proposed changes before they enter the protected
   production branch.

   ```bash
   git push -u origin release/vX.Y.Z
   gh pr create --base main --head release/vX.Y.Z --title "chore: release vX.Y.Z"
   ```

   On GitHub, open the pull request (it may be easiest to find by its title,
   `chore: release vX.Y.Z`). Once **Validate pull request** passes, choose
   **Squash and merge** and confirm. This repository permits squash merges:
   GitHub combines the PR's changes into one commit on `main`. The merge—not
   the tag—triggers the production deployment.

7. After GitHub confirms the PR is merged, update local `main` so the tag will
   point at the merged release commit. Check the latest commit before tagging:

   ```bash
   git switch main
   git pull --ff-only origin main
   git log -1 --oneline
   ```

   Confirm the latest commit is the release PR merge. An annotated version tag
   is a durable, named marker for the exact source revision of the release; it
   is useful for identifying and retrieving that version later. Create and
   publish it:

   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```

   Pushing the tag makes it available on GitHub. It does not trigger deployment
   on its own; the PR merge to `main` does that.

8. Confirm the **Deploy to GitHub Pages** run for the release commit completes
   successfully in the repository's GitHub Actions tab. Open the production
   URL and verify the released version and key changes. This confirms both
   that CI deployed the merged commit and that the live site behaves as
   expected. If the workflow fails, inspect its logs, fix the issue in a
   follow-up commit, and push to `main` through a pull request; do not move or
   overwrite a published tag.

9. For the first release that enables PWA support, verify the deployed app at
   its GitHub Pages URL in a clean browser profile and on the target
   browser/platforms:

   - Confirm the app manifest and icons load and the browser offers its native
     install option. The in-app install notice appears only in browsers that
     provide an install prompt; dismissing it should keep it hidden.
   - Install the app, then confirm it can launch offline after its first online
     visit and cache. Reload with the browser offline and verify game data,
     layout images, setup generation, and saved settings.
   - Reconnect and confirm a subsequent app release is picked up by the
     service worker. Follow the PWA section in the User Guide for manual
     installation steps in browsers without an in-app prompt.

## Manual deployment fallback

If a `main` push did not start the workflow, open **Actions** → **Deploy to
GitHub Pages** → **Run workflow**, select `main`, and start it. Confirm the run
finishes successfully and verify the production URL as in step 8. Use this
only when the normal deployment workflow did not start; manually running it
does not replace the release tag.
