import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

function trackedAndUnignoredFiles(root) {
  return execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
}

function copyWorktree(root, destination) {
  for (const relativePath of trackedAndUnignoredFiles(root)) {
    if (relativePath.split("/").includes("node_modules")) {
      continue;
    }

    const source = resolve(root, relativePath);
    if (!existsSync(source) || !statSync(source).isFile()) {
      continue;
    }
    const target = join(destination, ...relativePath.split("/"));
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
}

function printCandidateDiff(tempRoot, root, candidateFiles) {
  console.log("Release metadata changes in the candidate:");
  let hasDiff = false;
  for (const [relativePath, contents] of Object.entries(candidateFiles)) {
    const beforePath = join(tempRoot, "before", ...relativePath.split("/"));
    const afterPath = join(tempRoot, "after", ...relativePath.split("/"));
    const diffPath = relativePath.replaceAll("\\", "/");
    mkdirSync(dirname(beforePath), { recursive: true });
    mkdirSync(dirname(afterPath), { recursive: true });
    copyFileSync(join(root, relativePath), beforePath);
    writeFileSync(afterPath, contents, "utf8");

    const diff = spawnSync(
      "git",
      [
        "diff",
        "--no-index",
        "--no-ext-diff",
        "--no-color",
        "--",
        `before/${diffPath}`,
        `after/${diffPath}`,
      ],
      { cwd: tempRoot, encoding: "utf8" },
    );
    if (diff.error) {
      throw diff.error;
    }
    if (diff.status !== 0 && diff.status !== 1) {
      throw new Error(diff.stderr || `Could not compare candidate ${relativePath}.`);
    }
    if (diff.stdout) {
      hasDiff = true;
      console.log(diff.stdout.trimEnd());
    }
  }
  if (!hasDiff) {
    console.log("No release metadata changes.");
  }
}

function runNpm(args, cwd) {
  const isWindows = process.platform === "win32";
  const command = isWindows ? process.env.ComSpec ?? "cmd.exe" : "npm";
  const commandArgs = isWindows
    ? ["/d", "/s", "/c", `npm ${args.join(" ")}`]
    : args;
  const result = spawnSync(command, commandArgs, { cwd, stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`npm ${args.join(" ")} failed with exit status ${result.status ?? result.signal}.`);
  }
}

function runReleaseToolingTests(cwd) {
  const tests = [
    "scripts/check-release-version.test.mjs",
    "scripts/prepare-release.test.mjs",
    "scripts/release-workflow-docs.test.mjs",
    "scripts/release-preview.test.mjs",
  ];
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ["--test", ...tests], {
    cwd,
    env,
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Release tooling tests failed with exit status ${result.status ?? result.signal}.`);
  }
}

export function runReleasePreview({
  root = process.cwd(),
  version,
  candidateFiles,
  installDependencies = false,
}) {
  const dependencies = resolve(root, "node_modules");
  if (
    !installDependencies &&
    (!existsSync(dependencies) || !statSync(dependencies).isDirectory())
  ) {
    throw new Error("Install project dependencies before running the release dry run.");
  }

  const tempRoot = mkdtempSync(join(tmpdir(), "sirpy-release-preview-"));
  try {
    console.log(`\nDry-running release ${version} in an isolated temporary copy.`);
    printCandidateDiff(tempRoot, root, candidateFiles);

    const candidateRoot = join(tempRoot, "candidate");
    mkdirSync(candidateRoot, { recursive: true });
    copyWorktree(root, candidateRoot);
    for (const [relativePath, contents] of Object.entries(candidateFiles)) {
      const target = join(candidateRoot, ...relativePath.split("/"));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, contents, "utf8");
    }
    if (installDependencies) {
      console.log("\nInstalling dependencies from the candidate lockfile...");
      runNpm(["ci"], candidateRoot);
    } else {
      const dependencyLinkType = process.platform === "win32" ? "junction" : "dir";
      symlinkSync(dependencies, join(candidateRoot, "node_modules"), dependencyLinkType);
    }

    console.log("\nRunning release-tooling tests in the candidate...");
    runReleaseToolingTests(candidateRoot);
    console.log("\nRunning application tests in the candidate...");
    runNpm(["run", "test", "--", "--run"], candidateRoot);
    console.log("\nBuilding the production candidate...");
    runNpm(["run", "build"], candidateRoot);
    console.log(`\nDry run passed for ${version}. The repository was not modified.`);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
