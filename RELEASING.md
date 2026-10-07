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

1. Start from an up-to-date `main` branch with a clean working tree. Create a
   release branch and review all changes intended for release, ensuring
   unrelated or generated files are not included.

   ```bash
   git switch main
   git pull --ff-only origin main
   git switch -c release/vX.Y.Z
   git status --short
   ```

2. Run the release checks locally:

   ```bash
   npm ci
   npm test -- --run
   npm run build
   ```

   Resolve failures before continuing.

3. Update `CHANGELOG.md`: move the completed items out of `[Unreleased]` into a
   dated `## [X.Y.Z] - YYYY-MM-DD` section, then leave a fresh, empty
   `[Unreleased]` section at the top. Choose the version according to
   Semantic Versioning.

4. Set the application version in `package.json` and the root package entries
   in `package-lock.json` to the same `X.Y.Z`. Confirm the app displays the
   version from `package.json`.

5. Review the release diff and commit only intended files:

   ```bash
   git diff --check
   git diff
   git add CHANGELOG.md package.json package-lock.json
   # Add the other release files reviewed above.
   git commit -m "chore: release vX.Y.Z"
   ```

6. Push the release branch and open a pull request to `main`. Confirm the
   **Validate pull request** check passes, then merge the PR. Merging to `main`
   starts the production deployment.

   ```bash
   git push -u origin release/vX.Y.Z
   gh pr create --base main --head release/vX.Y.Z --title "chore: release vX.Y.Z"
   ```

7. After the PR is merged and the deployment starts, create an annotated
   version tag at the release commit and push the tag:

   ```bash
   git switch main
   git pull --ff-only origin main
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```

   The PR merge deploys the release. The tag records the product version but
   does not trigger deployment on its own.

8. Confirm the **Deploy to GitHub Pages** run for the release commit completes
   successfully in the repository's GitHub Actions tab. Open the production
   URL and verify the released version and key changes. If the workflow fails,
   inspect its logs, fix the issue in a follow-up commit, and push to `main`
   through a pull request; do not move or overwrite a published tag.

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
finishes successfully and verify the production URL as in step 7.
