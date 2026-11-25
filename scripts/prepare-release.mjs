import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";
import {
  hasProductChanges,
  isDependabotBranch,
  validateReleaseVersion,
} from "./check-release-version.mjs";
import { runReleasePreview } from "./release-preview.mjs";

const impacts = new Set(["major", "minor", "patch", "none"]);

function parseOptions(args) {
  const options = { dryRun: false, catchUp: false };
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === "--help") {
      options.help = true;
      continue;
    }
    if (option === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (option === "--catch-up") {
      options.catchUp = true;
      continue;
    }
    if (!["--base", "--impact", "--date"].includes(option)) {
      throw new Error(`Unsupported option: ${option}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${option} requires a value.`);
    }
    options[option.slice(2)] = value;
    index += 1;
  }
  return options;
}

function readGitFile(revision, path) {
  return execFileSync("git", ["show", `${revision}:${path}`], { encoding: "utf8" });
}

function nextVersion(version, impact) {
  const [major, minor, patch] = version.split(".").map(BigInt);
  if (impact === "major") {
    return `${major + 1n}.0.0`;
  }
  if (impact === "minor") {
    return `${major}.${minor + 1n}.0`;
  }
  return `${major}.${minor}.${patch + 1n}`;
}

function updateChangelog(changelog, version, date) {
  const lines = changelog.split(/\r?\n/);
  const unreleasedIndex = lines.findIndex((line) => line.trim() === "## [Unreleased]");
  if (unreleasedIndex === -1) {
    throw new Error("CHANGELOG.md must start its release history with ## [Unreleased].");
  }

  const nextSectionIndex = lines.findIndex(
    (line, index) => index > unreleasedIndex && line.startsWith("## ["),
  );
  const contentEnd = nextSectionIndex === -1 ? lines.length : nextSectionIndex;
  const unreleasedContent = lines.slice(unreleasedIndex + 1, contentEnd).join("\n").trim();
  if (!unreleasedContent) {
    throw new Error("Add the approved release notes under ## [Unreleased] before preparing a version.");
  }

  if (new RegExp(`^## \\[${version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\](?:\\s|$)`, "m").test(changelog)) {
    throw new Error(`CHANGELOG.md already has a section for [${version}].`);
  }

  const prefix = lines.slice(0, unreleasedIndex + 1).join("\n");
  const followingSections = lines.slice(contentEnd).join("\n").trim();
  const releaseSection = `## [${version}] - ${date}\n${unreleasedContent}`;
  return `${prefix}\n\n${releaseSection}${followingSections ? `\n\n${followingSections}` : ""}\n`;
}

function validateDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("--date must use YYYY-MM-DD.");
  }
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error("--date must be a valid calendar date.");
  }
}

function dependencyState(packageJson, lockfile) {
  return {
    dependencies: packageJson.dependencies ?? {},
    devDependencies: packageJson.devDependencies ?? {},
    optionalDependencies: packageJson.optionalDependencies ?? {},
    peerDependencies: packageJson.peerDependencies ?? {},
    overrides: packageJson.overrides ?? {},
    lockfile,
  };
}

export function hasDependencyChanges(basePackage, baseLockfile, currentPackage, currentLockfile) {
  return !isDeepStrictEqual(
    dependencyState(basePackage, baseLockfile),
    dependencyState(currentPackage, currentLockfile),
  );
}

export function prepareRelease({
  impact,
  catchUp = false,
  baseVersion,
  baseLockVersion,
  baseLockRootVersion,
  currentPackage,
  currentLockfile,
  changedPaths,
  basePackage,
  baseLockfile,
  baseChangelog,
  changelog,
  date,
}) {
  if (!impacts.has(impact)) {
    throw new Error("--impact must be major, minor, patch, or none.");
  }
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(baseVersion)) {
    throw new Error("The base app version must use stable X.Y.Z SemVer.");
  }
  if (
    !currentLockfile.packages?.[""] ||
    currentPackage.version !== baseVersion ||
    currentLockfile.version !== baseLockVersion ||
    currentLockfile.packages?.[""]?.version !== baseLockRootVersion ||
    baseLockVersion !== baseVersion ||
    baseLockRootVersion !== baseVersion
  ) {
    throw new Error("The current package and lockfile versions must match the selected base version.");
  }

  const productChanges = hasProductChanges({
    changedPaths,
    basePackage,
    currentPackage,
    baseLockfile,
    currentLockfile,
  });
  if (catchUp && productChanges) {
    throw new Error("--catch-up is only for product changes that are already present in the base branch.");
  }
  if (catchUp && impact === "none") {
    throw new Error("--catch-up requires a major, minor, or patch release impact.");
  }
  if (impact === "none") {
    return { changed: false, version: baseVersion };
  }
  if (!productChanges && !catchUp) {
    throw new Error("There are no product-impacting changes to version.");
  }
  validateDate(date);

  const version = nextVersion(baseVersion, impact);
  const nextPackage = { ...currentPackage, version };
  const nextLockfile = {
    ...currentLockfile,
    version,
    packages: {
      ...currentLockfile.packages,
      "": { ...currentLockfile.packages[""], version },
    },
  };
  const nextChangelog = updateChangelog(changelog, version, date);
  const errors = validateReleaseVersion({
    isDependabot: false,
    isCatchUpRelease: catchUp,
    releaseImpact: impact,
    hasProductChanges: productChanges,
    baseVersion,
    currentVersion: version,
    lockVersion: nextLockfile.version,
    lockRootVersion: nextLockfile.packages[""].version,
    baseChangelog,
    changelog: nextChangelog,
  });
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return {
    changed: true,
    version,
    packageJson: `${JSON.stringify(nextPackage, null, 2)}\n`,
    packageLock: `${JSON.stringify(nextLockfile, null, 2)}\n`,
    changelog: nextChangelog,
  };
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: npm run release:prepare -- [--base <git-ref>] --impact <major|minor|patch|none> [--catch-up] [--date YYYY-MM-DD] [--dry-run]");
    console.log("--dry-run prints the release diff and runs tests/build in an isolated temporary copy.");
    console.log("--catch-up permits a version-only release when base already contains its Unreleased notes.");
    return;
  }
  const baseRef = options.base ?? "origin/main";
  const impact = options.impact;
  const releaseDate = options.date ?? new Date().toISOString().slice(0, 10);
  if (!impact || !impacts.has(impact)) {
    throw new Error("--impact must be major, minor, patch, or none.");
  }

  const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
  if (!branch || branch === "main") {
    throw new Error("Prepare releases on a feature or maintenance branch, not main or detached HEAD.");
  }
  if (isDependabotBranch(branch)) {
    throw new Error("Dependabot branches are excluded from release versioning.");
  }
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", baseRef, "HEAD"], { stdio: "ignore" });
  } catch (error) {
    if (error.status === 1) {
      throw new Error(`The branch must include ${baseRef}; update it before preparing the release.`);
    }
    throw error;
  }

  const changedPaths = execFileSync(
    "git",
    ["diff", "--name-only", `${baseRef}...HEAD`],
    { encoding: "utf8" },
  )
    .split(/\r?\n/)
    .filter(Boolean);
  const basePackage = JSON.parse(readGitFile(baseRef, "package.json"));
  const baseLockfile = JSON.parse(readGitFile(baseRef, "package-lock.json"));
  const baseChangelog = readGitFile(baseRef, "CHANGELOG.md");
  const currentPackage = JSON.parse(readFileSync("package.json", "utf8"));
  const currentLockfile = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const result = prepareRelease({
    impact,
    catchUp: options.catchUp,
    baseVersion: basePackage.version,
    baseLockVersion: baseLockfile.version,
    baseLockRootVersion: baseLockfile.packages?.[""]?.version,
    currentPackage,
    currentLockfile,
    changedPaths,
    basePackage,
    baseLockfile,
    baseChangelog,
    changelog: readFileSync("CHANGELOG.md", "utf8"),
    date: releaseDate,
  });

  if (!result.changed) {
    if (options.dryRun) {
      runReleasePreview({
        root: process.cwd(),
        version: result.version,
        candidateFiles: {},
        installDependencies: hasDependencyChanges(
          basePackage,
          baseLockfile,
          currentPackage,
          currentLockfile,
        ),
      });
    } else {
      console.log("No release metadata changes: the selected impact is none.");
    }
    return;
  }
  if (options.dryRun) {
    runReleasePreview({
      root: process.cwd(),
      version: result.version,
      candidateFiles: {
        "package.json": result.packageJson,
        "package-lock.json": result.packageLock,
        "CHANGELOG.md": result.changelog,
      },
      installDependencies: hasDependencyChanges(
        basePackage,
        baseLockfile,
        currentPackage,
        currentLockfile,
      ),
    });
    return;
  }

  writeFileSync("package.json", result.packageJson);
  writeFileSync("package-lock.json", result.packageLock);
  writeFileSync("CHANGELOG.md", result.changelog);
  console.log(`Prepared version ${result.version}. No files were staged, committed, pushed, or tagged.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
