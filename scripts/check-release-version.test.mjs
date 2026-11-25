import assert from "node:assert/strict";
import test from "node:test";
import {
  hasProductChanges,
  isDependabotBranch,
  readReleaseCatchUp,
  readReleaseImpact,
  validateReleaseVersion,
} from "./check-release-version.mjs";

const basePackage = {
  version: "1.9.0",
  dependencies: { react: "^19.3.1" },
};

const baseLockfile = {
  packages: {
    "": { version: "1.9.0" },
    "node_modules/react": { version: "19.3.1" },
    "node_modules/typescript": { version: "7.0.2", dev: true },
  },
};

function validate(overrides = {}) {
  return validateReleaseVersion({
    isDependabot: false,
    releaseImpact: "patch",
    hasProductChanges: true,
    baseVersion: "1.9.0",
    currentVersion: "1.9.1",
    lockVersion: "1.9.1",
    lockRootVersion: "1.9.1",
    changelog: "## [1.9.1] - 2026-11-25\n",
    ...overrides,
  });
}

test("parses exactly one release impact declaration from the PR body", () => {
  assert.equal(readReleaseImpact("Summary\nRelease-impact: PATCH\n"), "patch");
  assert.equal(readReleaseImpact("Release-impact: patch\nRelease-impact: minor"), undefined);
  assert.equal(readReleaseImpact("Release-impact: none-ish"), undefined);
});

test("parses one explicit catch-up declaration", () => {
  assert.equal(readReleaseCatchUp("Release-catch-up: true"), true);
  assert.equal(readReleaseCatchUp("Release-catch-up: false"), false);
  assert.equal(readReleaseCatchUp("Release-catch-up: true\nRelease-catch-up: true"), false);
});

test("identifies Dependabot branches for local release commands", () => {
  assert.equal(isDependabotBranch("dependabot/npm_and_yarn/vite-7.0.0"), true);
  assert.equal(isDependabotBranch("feature/release-vite-7"), false);
});

test("requires release metadata for application changes", () => {
  assert.deepEqual(validate(), []);
  assert.match(validate({ currentVersion: "1.9.0" }).join(" "), /Increase the app version/);
});

test("does not require a release for documentation, tests, or fixtures", () => {
  const noProductChanges = hasProductChanges({
    changedPaths: [
      "README.md",
      "src/App.test.tsx",
      "src/fixtures/python_state_fixture.json",
      "src/test-setup.ts",
    ],
    basePackage,
    currentPackage: basePackage,
    baseLockfile,
    currentLockfile: baseLockfile,
  });

  assert.equal(noProductChanges, false);
  assert.deepEqual(validate({ hasProductChanges: false, currentVersion: "1.9.0" }), []);
  assert.match(validate({ hasProductChanges: false }).join(" "), /same PR/);
});

test("allows an explicit no-release decision for path-classified internal changes", () => {
  assert.deepEqual(
    validate({
      releaseImpact: "none",
      currentVersion: "1.9.0",
      lockVersion: "1.9.0",
      lockRootVersion: "1.9.0",
    }),
    [],
  );
});

test("detects application source, public assets, and build configuration", () => {
  for (const path of ["src/App.tsx", "public/data/spirits.json", "index.html", "vite.config.ts"]) {
    assert.equal(
      hasProductChanges({
        changedPaths: [path],
        basePackage,
        currentPackage: basePackage,
        baseLockfile,
        currentLockfile: baseLockfile,
      }),
      true,
      path,
    );
  }
});

test("detects production dependency changes but ignores development-only changes", () => {
  const currentPackage = {
    ...basePackage,
    dependencies: { react: "^19.4.0" },
  };
  assert.equal(
    hasProductChanges({
      changedPaths: ["package.json"],
      basePackage,
      currentPackage,
      baseLockfile,
      currentLockfile: baseLockfile,
    }),
    true,
  );

  const currentLockfile = {
    packages: {
      ...baseLockfile.packages,
      "node_modules/typescript": { version: "7.0.3", dev: true },
    },
  };
  assert.equal(
    hasProductChanges({
      changedPaths: ["package-lock.json"],
      basePackage,
      currentPackage: basePackage,
      baseLockfile,
      currentLockfile,
    }),
    false,
  );

  const updatedProductionLockfile = {
    packages: {
      ...baseLockfile.packages,
      "node_modules/react": { version: "19.4.0" },
    },
  };
  assert.equal(
    hasProductChanges({
      changedPaths: ["package-lock.json"],
      basePackage,
      currentPackage: basePackage,
      baseLockfile,
      currentLockfile: updatedProductionLockfile,
    }),
    true,
  );
});

test("requires package lock and changelog to match the new version", () => {
  assert.match(validate({ lockVersion: "1.9.0" }).join(" "), /package-lock\.json/);
  assert.match(validate({ lockRootVersion: "1.9.0" }).join(" "), /package-lock\.json/);
  assert.match(validate({ changelog: "## [Unreleased]\n" }).join(" "), /CHANGELOG\.md/);
});

test("rejects a downgrade and accepts SemVer numeric ordering", () => {
  assert.match(validate({ currentVersion: "1.8.9", lockVersion: "1.8.9" }).join(" "), /Increase/);
  assert.deepEqual(
    validate({
      releaseImpact: "minor",
      currentVersion: "1.10.0",
      lockVersion: "1.10.0",
      lockRootVersion: "1.10.0",
      changelog: "## [1.10.0] - 2026-11-25\n",
    }),
    [],
  );
  assert.match(validate({ currentVersion: "01.9.1" }).join(" "), /stable X\.Y\.Z SemVer/);
});

test("enforces the declared SemVer impact", () => {
  assert.match(validate({ releaseImpact: "minor" }).join(" "), /does not match/);
  assert.match(validate({ releaseImpact: "major" }).join(" "), /does not match/);
  assert.match(validate({ releaseImpact: undefined }).join(" "), /Release-impact line/);
  assert.deepEqual(
    validate({
      releaseImpact: "major",
      currentVersion: "2.0.0",
      lockVersion: "2.0.0",
      lockRootVersion: "2.0.0",
      changelog: "## [2.0.0] - 2026-11-25\n",
    }),
    [],
  );
});

test("allows a catch-up release only when it releases base Unreleased notes", () => {
  const baseChangelog = `## [Unreleased]
### Changed
- Randomize the Extra Board layout position.
`;
  const versionedChangelog = `## [Unreleased]

## [1.10.0] - 2026-11-25
### Changed
- Randomize the Extra Board layout position.
`;
  assert.deepEqual(
    validate({
      isCatchUpRelease: true,
      releaseImpact: "minor",
      hasProductChanges: false,
      currentVersion: "1.10.0",
      lockVersion: "1.10.0",
      lockRootVersion: "1.10.0",
      baseChangelog,
      changelog: versionedChangelog,
    }),
    [],
  );
  assert.match(
    validate({
      isCatchUpRelease: true,
      releaseImpact: "minor",
      hasProductChanges: false,
      currentVersion: "1.10.0",
      lockVersion: "1.10.0",
      lockRootVersion: "1.10.0",
      baseChangelog,
      changelog: "## [1.10.0] - 2026-11-25\n- Different notes.\n",
    }).join(" "),
    /base branch's existing \[Unreleased\] notes/,
  );
  assert.match(
    validate({
      isCatchUpRelease: true,
      hasProductChanges: true,
      baseChangelog,
      changelog: versionedChangelog,
    }).join(" "),
    /only valid when this PR changes release metadata but no product files/,
  );
  assert.match(
    validate({
      hasProductChanges: false,
      currentVersion: "1.10.0",
      releaseImpact: "minor",
    }).join(" "),
    /version bump must accompany product-impacting changes/,
  );
});

test("exempts Dependabot deployments", () => {
  assert.deepEqual(
    validate({
      isDependabot: true,
      currentVersion: "1.9.0",
      lockVersion: "1.9.0",
      lockRootVersion: "1.9.0",
      changelog: "## [Unreleased]\n",
    }),
    [],
  );
});
