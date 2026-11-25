import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runReleasePreview } from "./release-preview.mjs";

test("runs candidate checks in a temporary copy without changing the source worktree", () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "sirpy-release-preview-test-"));
  const root = join(tempRoot, "repo");
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "node_modules"));

  const packageJson = JSON.stringify(
    {
      name: "release-preview-fixture",
      version: "1.0.0",
      scripts: {
        test: `node -e "console.log('application tests passed')" --`,
        build: `node -e "console.log('production build passed')"`,
      },
    },
    null,
    2,
  ) + "\n";
  const packageLock = JSON.stringify(
    {
      name: "release-preview-fixture",
      version: "1.0.0",
      lockfileVersion: 3,
      requires: true,
      packages: {
        "": { name: "release-preview-fixture", version: "1.0.0" },
      },
    },
    null,
    2,
  ) + "\n";
  const changelog = "# Changelog\n\n## [Unreleased]\n";

  try {
    writeFileSync(join(root, "package.json"), packageJson);
    writeFileSync(join(root, "package-lock.json"), packageLock);
    writeFileSync(join(root, "CHANGELOG.md"), changelog);
    for (const script of [
      "check-release-version.test.mjs",
      "prepare-release.test.mjs",
      "release-workflow-docs.test.mjs",
      "release-preview.test.mjs",
    ]) {
      writeFileSync(join(root, "scripts", script), "");
    }

    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.name", "Release Preview Test"], { cwd: root });
    execFileSync("git", ["config", "user.email", "release-preview@example.invalid"], { cwd: root });
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-qm", "Create release preview fixture"], { cwd: root });

    const candidateFiles = {
      "package.json": packageJson.replace('"version": "1.0.0"', '"version": "1.0.1"'),
      "package-lock.json": packageLock.replaceAll('"version": "1.0.0"', '"version": "1.0.1"'),
      "CHANGELOG.md": `${changelog}\n## [1.0.1] - 2026-11-25\n- Example release.\n`,
    };
    runReleasePreview({
      root,
      version: "1.0.1",
      candidateFiles,
    });
    runReleasePreview({
      root,
      version: "1.0.1",
      candidateFiles,
      installDependencies: true,
    });

    assert.equal(readFileSync(join(root, "package.json"), "utf8"), packageJson);
    assert.equal(readFileSync(join(root, "package-lock.json"), "utf8"), packageLock);
    assert.equal(readFileSync(join(root, "CHANGELOG.md"), "utf8"), changelog);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
