import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const copilotInstructions = readFileSync(".github/copilot-instructions.md", "utf8");
const releaseGuide = readFileSync("playbooks/releasing-flow.md", "utf8");
const readme = readFileSync("README.md", "utf8");
const pullRequestWorkflow = readFileSync(".github/workflows/dependabot-automerge.yml", "utf8");

test("release commands stay aligned across package scripts and instructions", () => {
  assert.equal(packageJson.scripts["release:prepare"], "node scripts/prepare-release.mjs");
  assert.equal(packageJson.scripts["release:check"], "node scripts/check-release-version.mjs");
  for (const instructions of [copilotInstructions, releaseGuide]) {
    assert.match(instructions, /npm run release:prepare/);
    assert.match(instructions, /npm run release:check/);
    assert.match(instructions, /--dry-run/);
    assert.match(instructions, /--catch-up/);
    assert.match(instructions, /Release-catch-up: true/);
  }
  assert.match(copilotInstructions, /playbooks\/releasing-flow\.md/);
  assert.match(copilotInstructions, /--impact none/);
  assert.match(releaseGuide, /## Releasing with Copilot/);
  assert.match(releaseGuide, /--impact none/);
  assert.match(readme, /playbooks\/releasing-flow\.md/);
  assert.match(pullRequestWorkflow, /scripts\/release-preview\.test\.mjs/);
});

test("assistant guidance requires pre-edit and pre-publish confirmation", () => {
  assert.match(copilotInstructions, /confirm the impact and proposed changelog\/README\/User Guide\s+changes/);
  assert.match(copilotInstructions, /Ask before pushing the branch or\s+opening\/updating a PR/);
  assert.match(releaseGuide, /Ask for confirmation of the impact and proposed documentation before/);
  assert.match(releaseGuide, /Ask before pushing the branch or\s+creating\/updating its PR/);
});

test("local UI previews require desktop and mobile review", () => {
  for (const instructions of [copilotInstructions, releaseGuide]) {
    assert.match(instructions, /desktop and mobile viewport sizes/);
    assert.match(instructions, /responsive layout/);
  }
});

test("release guide names the pull request workflow", () => {
  const workflowName = pullRequestWorkflow.match(/^name: (.+)$/m)?.[1];
  assert.ok(workflowName);
  assert.ok(releaseGuide.includes(`**${workflowName}**`));
});
