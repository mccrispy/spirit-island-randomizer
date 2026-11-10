# Development and release workflow

Production is hosted on GitHub Pages at
<https://mccrispy.github.io/spirit-island-randomizer/>. Pushing to `main`
automatically runs the **Deploy to GitHub Pages** workflow. It installs
dependencies, runs the tests, builds the site, and deploys `dist/` only if the
checks pass. A version tag by itself does not deploy the site.

Use this playbook for the complete change cycle: everyday development and pull
requests first, then the additional steps for a production release. The
[local-update exception](./LOCAL-REPO-UPDATE.md) is only for bringing a feature
branch up to date when you have uncommitted work you cannot checkpoint yet.

## Protecting `main`

Import [`.github/rulesets/protect-main.json`](../.github/rulesets/protect-main.json)
from **Settings → Rules → Rulesets → New branch ruleset → Import a ruleset**.
It requires changes to `main` to arrive through pull requests, allows squash
merges without requiring an approval, and blocks force-pushes and branch
deletion. It also requires the **Validate pull request** status check, which
runs the test suite and production build.

## Everyday development and pull requests

Always do development on a feature or maintenance branch, not local `main`.
The normal cycle is: update `main`, create a branch, work and make local commits
as needed, push the branch, open a pull request, and squash-merge it.

### Start a change

For new work, start with a clean working tree. Check it before switching
branches:

```powershell
git status --short --branch
```

If there are uncommitted changes on a feature branch, finish a local commit
before switching branches. Do not switch branches with changes you do not
intend to carry over.

Update local `main` and create a descriptive branch from it:

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c maintenance/short-description
git status --short --branch
```

Use a prefix such as `feature/`, `fix/`, or `maintenance/` as appropriate.
Confirm the new branch name and that the working tree is clean before starting.
If `git pull --ff-only` fails, stop and resolve the branch history rather than
forcing the update.

If work was accidentally started on local `main`, create the new branch
directly without stashing; `git switch -c maintenance/short-description`
preserves staged, unstaged, and untracked changes. Check the branch and status
afterward. The local-update exception is for preserving work while updating a
feature branch, not for moving normal work back onto `main`.

### Work and commit checkpoints

Review the staged and unstaged changes before each commit:

```powershell
git status --short --branch
git diff --cached --check
git diff --cached
git diff
```

Stage only the files for the phase you are ready to checkpoint. For example:

```powershell
git add -- src\example.ts
```

Use `git add -A` only when every changed, deleted, and untracked file belongs
in this commit. Review what is staged, then commit it locally:

```powershell
git diff --cached --check
git diff --cached
git commit -m "Describe this phase"
git status --short --branch
```

A local commit saves the staged snapshot in your repository; it does not push
anything to GitHub. In VS Code, **Commit** also makes a local commit. Push is
separate. If the tree is clean after the commit, you can start another phase
on the same branch. Each commit on that branch will be part of its pull
request. If changes remain, review them; they were not included in the commit.

### Push and merge the pull request

Push your branch to GitHub when you want a backup. When the work is ready to merge into main, open a pull request targeting `main`:

```powershell
git push -u origin maintenance/short-description
gh pr create --base main --head maintenance/short-description --title "Describe the change"
```

For later pushes to the same branch, `git push` is sufficient. Alternatively,
open the PR on GitHub. Confirm it targets `main`; wait for **Validate pull
request** to pass, then choose **Squash and merge**. Do not push directly to
`main`. Avoid VS Code's **Commit & Push** or **Commit & Sync** actions while
`main` is checked out.

If the validation check requires the feature branch to include recent `main`
changes, first commit or otherwise save your work so the tree is clean, then
update the feature branch:

```powershell
git switch maintenance/short-description
git fetch origin
git merge origin/main
```

Resolve conflicts, rerun checks, and push the updated branch. If you cannot
checkpoint your current work first, use the [local-update exception](./LOCAL-REPO-UPDATE.md).

### After the pull request is merged

After GitHub confirms the squash-merge, update local `main` before starting
another change:

```powershell
git status --short --branch
git switch main
git pull --ff-only origin main
git status --short --branch
```

Switch only when the working tree is clean. Confirm `main` tracks
`origin/main` and is up to date. You may then delete the old local feature
branch after verifying the merge:

```powershell
git branch -d maintenance/short-description
```

GitHub may delete the remote branch automatically. Start the next change with
a new feature or maintenance branch.

## Dependency update pull requests

The [Dependabot configuration](../.github/dependabot.yml) checks npm dependencies
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

1. Start a release branch from up-to-date `main`, following
   [Start a change](#start-a-change) above and using `release/vX.Y.Z` as the
   branch name. The working tree must be clean so the release contains only
   intended release changes. Release fixes and features should already have
   been merged through their own pull requests; do not stash or cherry-pick
   unrelated work onto the release branch.

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

3. Update `CHANGELOG.md`: keep a fresh, empty `[Unreleased]` section at the
   top, and move the completed items below it into a new
   `## [X.Y.Z] - YYYY-MM-DD` section. Use the release date and the same version
   you will use in the next step. This records what users should expect from
   the release and keeps future work separate. Choose the version according to
   Semantic Versioning: patch for compatible fixes, minor for
   backward-compatible features, and major for breaking changes.

4. Set the application version in `package.json` and `package-lock.json` to
   the same `X.Y.Z`. Use npm to update both files and their root version
   entries together; do not edit just one of them:

   ```bash
   npm version X.Y.Z --no-git-tag-version
   ```

   Replace `X.Y.Z` with the exact version used in the changelog (without the
   leading `v`). `--no-git-tag-version` prevents npm from making its own Git
   commit or tag; you will review and commit the release changes together in
   step 5. Vite reads the version from `package.json` and injects it into the
   page footer and the heading on the About tab. Build after changing the
   version, then preview that build and confirm both places display the
   expected version (for example, `v1.8.0`):

   ```bash
   npm run build
   npm run preview
   ```

   `npm run preview` serves the existing `dist/` output; it does not rebuild
   it. Open the local URL printed by the command, check the footer, then open
   the About tab and check its heading. Stop the preview server with `Ctrl+C`
   when finished.

5. Commit the release changes using [Work and commit checkpoints](#work-and-commit-checkpoints).
   Stage only the changelog and version files for this release, then use the
   commit message `chore: release vX.Y.Z`. Review the staged diff carefully;
   do not include unrelated changes.

   ```bash
   git add -- CHANGELOG.md package.json package-lock.json
   git diff --cached --check
   git diff --cached
   git commit -m "chore: release vX.Y.Z"
   ```

6. Follow [Push and merge the pull request](#push-and-merge-the-pull-request)
   above, using `release/vX.Y.Z` as the branch and
   `chore: release vX.Y.Z` as the PR title. Include the release summary and
   validation details in the PR description. Wait for **Validate pull
   request**, then squash-merge the PR. The merge—not the tag—triggers
   production deployment.

7. After GitHub confirms the PR is merged, follow
   [After the pull request is merged](#after-the-pull-request-is-merged) to
   update local `main`. Confirm the latest commit is the release PR merge:

   ```bash
   git log -1 --oneline
   ```

   If the latest commit is not the release PR merge, stop and investigate
   before tagging. An annotated version tag is a durable marker for the exact
   release revision. Create and publish it:

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
   expected. If the workflow fails, inspect its logs and fix the issue on a
   follow-up feature or maintenance branch, then use the everyday pull request
   workflow above. Do not move or overwrite a published tag.

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
