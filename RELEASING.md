# Releasing to production

Production is hosted on GitHub Pages at
<https://mccrispy.github.io/spirit-island-randomizer/>. Pushing to `main`
automatically runs the **Deploy to GitHub Pages** workflow. It installs
dependencies, runs the tests, builds the site, and deploys `dist/` only if the
checks pass. A version tag by itself does not deploy the site.

## Release steps

1. Start from an up-to-date `main` branch with a clean working tree. Review all
   changes intended for release, and ensure unrelated or generated files are
   not included.

   ```bash
   git switch main
   git pull --ff-only origin main
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

6. Create an annotated version tag and push it together with `main`:

   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin main vX.Y.Z
   ```

   The `main` push starts the production deployment. The tag records the
   release but does not trigger deployment on its own.

7. Confirm the **Deploy to GitHub Pages** run for the release commit completes
   successfully in the repository's GitHub Actions tab. Open the production
   URL and verify the released version and key changes. If the workflow fails,
   inspect its logs, fix the issue in a follow-up commit, and push to `main`
   again; do not move or overwrite a published tag.

## Manual deployment fallback

If a `main` push did not start the workflow, open **Actions** → **Deploy to
GitHub Pages** → **Run workflow**, select `main`, and start it. Confirm the run
finishes successfully and verify the production URL as in step 7.
