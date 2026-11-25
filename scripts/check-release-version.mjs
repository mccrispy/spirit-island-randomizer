import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

function isApplicationFile(path) {
  if (!/^(?:src\/|public\/|index\.html$|vite\.config\.[cm]?[jt]s$|tsconfig(?:\.node)?\.json$)/.test(path)) {
    return false;
  }

  if (
    /^src\/fixtures\//.test(path) ||
    /^src\/test-setup\.[^/]+$/.test(path) ||
    /^src\/.*(?:\.test|\.spec)\.[^/]+$/.test(path)
  ) {
    return false;
  }

  return true;
}

function productionPackages(lockfile) {
  return Object.fromEntries(
    Object.entries(lockfile.packages ?? {}).filter(
      ([path, details]) => path !== "" && details.dev !== true,
    ),
  );
}

export function hasProductChanges({
  changedPaths,
  basePackage,
  currentPackage,
  baseLockfile,
  currentLockfile,
}) {
  if (changedPaths.some(isApplicationFile)) {
    return true;
  }

  if (!isDeepStrictEqual(basePackage.dependencies ?? {}, currentPackage.dependencies ?? {})) {
    return true;
  }

  return !isDeepStrictEqual(
    productionPackages(baseLockfile),
    productionPackages(currentLockfile),
  );
}

function compareVersions(left, right) {
  const leftParts = left.split(".").map(BigInt);
  const rightParts = right.split(".").map(BigInt);

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index];
    }
  }

  return 0;
}

function isStableSemVer(version) {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version);
}

function matchesImpactIncrease(baseVersion, currentVersion, impact) {
  const [baseMajor, baseMinor, basePatch] = baseVersion.split(".").map(BigInt);
  const [currentMajor, currentMinor, currentPatch] = currentVersion.split(".").map(BigInt);

  if (impact === "major") {
    return (
      currentMajor === baseMajor + 1n &&
      currentMinor === 0n &&
      currentPatch === 0n
    );
  }

  if (impact === "minor") {
    return (
      currentMajor === baseMajor &&
      currentMinor === baseMinor + 1n &&
      currentPatch === 0n
    );
  }

  return (
    impact === "patch" &&
    currentMajor === baseMajor &&
    currentMinor === baseMinor &&
    currentPatch === basePatch + 1n
  );
}

export function readReleaseImpact(body) {
  const matches = [...body.matchAll(/^Release-impact:\s*(major|minor|patch|none)\s*$/gim)];
  return matches.length === 1 ? matches[0][1].toLowerCase() : undefined;
}

export function readReleaseCatchUp(body) {
  const matches = [...body.matchAll(/^Release-catch-up:\s*(true|false)\s*$/gim)];
  return matches.length === 1 && matches[0][1].toLowerCase() === "true";
}

export function isDependabotBranch(branch) {
  return /^dependabot\//i.test(branch);
}

function hasChangelogEntry(changelog, version) {
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^## \\[${escapedVersion}\\](?:\\s|$)`, "m").test(changelog);
}

function changelogSectionContent(changelog, matchesHeading) {
  const lines = changelog.split(/\r?\n/);
  const sectionIndex = lines.findIndex((line) => matchesHeading(line.trim()));
  if (sectionIndex === -1) {
    return "";
  }
  const nextSectionIndex = lines.findIndex(
    (line, index) => index > sectionIndex && line.startsWith("## ["),
  );
  const contentEnd = nextSectionIndex === -1 ? lines.length : nextSectionIndex;
  return lines.slice(sectionIndex + 1, contentEnd).join("\n").trim();
}

function hasCatchUpReleaseNotes(baseChangelog, changelog, version) {
  const baseNotes = changelogSectionContent(
    baseChangelog,
    (heading) => heading === "## [Unreleased]",
  );
  if (!baseNotes) {
    return false;
  }

  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const releaseNotes = changelogSectionContent(
    changelog,
    (heading) => new RegExp(`^## \\[${escapedVersion}\\](?:\\s|$)`).test(heading),
  );
  return releaseNotes.includes(baseNotes);
}

export function validateReleaseVersion({
  isDependabot,
  isCatchUpRelease = false,
  releaseImpact,
  hasProductChanges: productChanges,
  baseVersion,
  currentVersion,
  lockVersion,
  lockRootVersion,
  baseChangelog,
  changelog,
}) {
  if (isDependabot) {
    return [];
  }

  const versionChanged = currentVersion !== baseVersion;
  if (isCatchUpRelease && (productChanges || !versionChanged)) {
    return [
      "Release-catch-up: true is only valid when this PR changes release metadata but no product files.",
    ];
  }
  if (!productChanges && !versionChanged) {
    return [];
  }

  const errors = [];
  if (!productChanges && !isCatchUpRelease) {
    errors.push("A version bump must accompany product-impacting changes in the same PR.");
    return errors;
  }

  if (isCatchUpRelease && !hasCatchUpReleaseNotes(baseChangelog, changelog, currentVersion)) {
    errors.push(
      "A catch-up release must carry the base branch's existing [Unreleased] notes into the versioned changelog section.",
    );
  }

  if (!releaseImpact) {
    errors.push("The PR description must include one Release-impact line: major, minor, patch, or none.");
    return errors;
  }

  if (releaseImpact === "none") {
    if (versionChanged) {
      errors.push("Release-impact: none cannot include an app version increase.");
    }
    return errors;
  }

  if (!isStableSemVer(baseVersion) || !isStableSemVer(currentVersion)) {
    errors.push("package.json versions must use stable X.Y.Z SemVer.");
    return errors;
  }

  if (compareVersions(currentVersion, baseVersion) <= 0) {
    errors.push(`Increase the app version from ${baseVersion} for this release.`);
  } else if (!matchesImpactIncrease(baseVersion, currentVersion, releaseImpact)) {
    errors.push(`The app version increase does not match Release-impact: ${releaseImpact}.`);
  }

  if (lockVersion !== currentVersion || lockRootVersion !== currentVersion) {
    errors.push("The package-lock.json root versions must match package.json.");
  }

  if (!hasChangelogEntry(changelog, currentVersion)) {
    errors.push(`CHANGELOG.md must contain a release heading for [${currentVersion}].`);
  }

  return errors;
}

function readGitFile(revision, path) {
  return execFileSync("git", ["show", `${revision}:${path}`], { encoding: "utf8" });
}

function readJsonFile(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function parseOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === "--help") {
      options.help = true;
      continue;
    }
    if (option === "--catch-up") {
      options.catchUp = true;
      continue;
    }
    if (!["--base", "--impact"].includes(option)) {
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

function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: npm run release:check -- [--base <git-ref>] [--impact <major|minor|patch|none>] [--catch-up]");
    return;
  }

  const baseSha = options.base ?? process.env.BASE_SHA;
  if (!baseSha) {
    throw new Error("Provide --base or set BASE_SHA to the release base commit.");
  }
  const releaseImpact = options.impact ?? readReleaseImpact(process.env.PULL_REQUEST_BODY ?? "");
  if (options.impact && !["major", "minor", "patch", "none"].includes(options.impact)) {
    throw new Error("--impact must be major, minor, patch, or none.");
  }
  const isCatchUpRelease =
    options.catchUp ?? readReleaseCatchUp(process.env.PULL_REQUEST_BODY ?? "");
  const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();

  const changedPaths = execFileSync(
    "git",
    ["diff", "--name-only", `${baseSha}...HEAD`],
    { encoding: "utf8" },
  )
    .split(/\r?\n/)
    .filter(Boolean);
  const basePackage = JSON.parse(readGitFile(baseSha, "package.json"));
  const currentPackage = readJsonFile("package.json");
  const baseLockfile = JSON.parse(readGitFile(baseSha, "package-lock.json"));
  const currentLockfile = readJsonFile("package-lock.json");
  const errors = validateReleaseVersion({
    isDependabot: process.env.IS_DEPENDABOT === "true" || isDependabotBranch(branch),
    isCatchUpRelease,
    releaseImpact,
    hasProductChanges: hasProductChanges({
      changedPaths,
      basePackage,
      currentPackage,
      baseLockfile,
      currentLockfile,
    }),
    baseVersion: basePackage.version,
    currentVersion: currentPackage.version,
    lockVersion: currentLockfile.version,
    lockRootVersion: currentLockfile.packages?.[""]?.version,
    baseChangelog: readGitFile(baseSha, "CHANGELOG.md"),
    changelog: readFileSync("CHANGELOG.md", "utf8"),
  });

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`Release version check failed: ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Release version check passed.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
