import assert from "node:assert/strict";
import test from "node:test";
import { hasDependencyChanges, prepareRelease } from "./prepare-release.mjs";

const packageJson = {
  name: "spirit-island-randomizer",
  version: "1.9.0",
  dependencies: { react: "^19.3.1" },
};

const lockfile = {
  name: "spirit-island-randomizer",
  version: "1.9.0",
  lockfileVersion: 3,
  packages: {
    "": { name: "spirit-island-randomizer", version: "1.9.0" },
    "node_modules/react": { version: "19.3.1" },
  },
};

const changelog = `# Changelog

## [Unreleased]
### Added
- Add the requested setup behavior.

## [1.9.0] - 2026-11-20
### Changed
- Previous release notes.
`;

function prepare(impact, overrides = {}) {
  return prepareRelease({
    impact,
    baseVersion: "1.9.0",
    baseLockVersion: "1.9.0",
    baseLockRootVersion: "1.9.0",
    currentPackage: packageJson,
    currentLockfile: lockfile,
    changedPaths: ["src/App.tsx"],
    basePackage: packageJson,
    baseLockfile: lockfile,
    baseChangelog: changelog,
    changelog,
    date: "2026-11-25",
    ...overrides,
  });
}

test("detects when a dry run needs the candidate dependency lockfile installed", () => {
  assert.equal(hasDependencyChanges(packageJson, lockfile, packageJson, lockfile), false);
  assert.equal(
    hasDependencyChanges(
      packageJson,
      lockfile,
      { ...packageJson, devDependencies: { vitest: "^5.1.1" } },
      lockfile,
    ),
    true,
  );
  assert.equal(
    hasDependencyChanges(packageJson, lockfile, packageJson, {
      ...lockfile,
      packages: {
        ...lockfile.packages,
        "node_modules/react": { version: "19.4.0" },
      },
    }),
    true,
  );
});

test("prepares patch, minor, and major versions with matching changelog sections", () => {
  for (const [impact, version] of [
    ["patch", "1.9.1"],
    ["minor", "1.10.0"],
    ["major", "2.0.0"],
  ]) {
    const result = prepare(impact);
    assert.equal(result.version, version);
    assert.equal(JSON.parse(result.packageJson).version, version);
    const preparedLockfile = JSON.parse(result.packageLock);
    assert.equal(preparedLockfile.version, version);
    assert.equal(preparedLockfile.packages[""].version, version);
    assert.match(result.changelog, new RegExp(`^## \\[${version}\\] - 2026-11-25$`, "m"));
    assert.match(result.changelog, /^## \[Unreleased\]\n\n## \[/m);
    assert.match(result.changelog, /- Add the requested setup behavior\./);
    assert.match(result.changelog, /## \[1\.9\.0\] - 2026-11-20/);
    assert.ok(result.changelog.endsWith("\n"));
    assert.ok(!result.changelog.endsWith("\n\n"));
  }
});

test("prepares a catch-up release when product changes already exist in the base", () => {
  const result = prepare("minor", {
    catchUp: true,
    changedPaths: ["README.md"],
  });
  assert.equal(result.version, "1.10.0");
  assert.equal(JSON.parse(result.packageJson).version, "1.10.0");
  const preparedLockfile = JSON.parse(result.packageLock);
  assert.equal(preparedLockfile.version, "1.10.0");
  assert.equal(preparedLockfile.packages[""].version, "1.10.0");
  assert.match(result.changelog, /^## \[1\.10\.0\] - 2026-11-25$/m);
  assert.match(result.changelog, /- Add the requested setup behavior\./);
  assert.ok(result.changelog.endsWith("\n"));
  assert.ok(!result.changelog.endsWith("\n\n"));
});

test("does not alter release metadata for a no-impact decision", () => {
  assert.deepEqual(prepare("none"), { changed: false, version: "1.9.0" });
});

test("requires product changes and release notes before preparing a version", () => {
  assert.throws(() => prepare("patch", { changedPaths: ["README.md"] }), /no product-impacting changes/);
  assert.throws(
    () => prepare("minor", { catchUp: true, changedPaths: ["src/App.tsx"] }),
    /only for product changes that are already present in the base branch/,
  );
  assert.throws(
    () => prepare("none", { catchUp: true, changedPaths: ["README.md"] }),
    /requires a major, minor, or patch release impact/,
  );
  assert.throws(
    () => prepare("patch", { changelog: "# Changelog\n\n## [Unreleased]\n\n## [1.9.0] - 2026-11-20\n" }),
    /Add the approved release notes/,
  );
  assert.throws(
    () => prepare("patch", { changelog: "# Changelog\n\n## [1.9.0] - 2026-11-20\n" }),
    /must start its release history with ## \[Unreleased\]/,
  );
});

test("refuses a stale or already-versioned worktree and invalid dates", () => {
  assert.throws(() => prepare("patch", { currentPackage: { ...packageJson, version: "1.9.1" } }), /must match the selected base version/);
  assert.throws(() => prepare("patch", { date: "2026-02-30" }), /valid calendar date/);
});
