#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const EXPECTED_SHA = "20be4b18d4c57487f8993d2762bace129f0cf7c6";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const baselineDir = resolve(scriptDir, "..");
const repoDir = resolve(baselineDir, "..");
const checks = [];

function check(name, fn) {
	try {
		fn();
		checks.push({ name, status: "PASS" });
	} catch (error) {
		checks.push({
			name,
			status: "FAIL",
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

function command(args, cwd = repoDir) {
	const result = spawnSync(args[0], args.slice(1), {
		cwd,
		encoding: "utf8",
		env: { ...process.env, NO_COLOR: "1" },
	});
	if (result.error) throw result.error;
	assert.equal(
		result.status,
		0,
		`${args.join(" ")} exited ${result.status}\n${result.stdout}${result.stderr}`,
	);
	return result.stdout.trim();
}

function json(name) {
	return JSON.parse(readFileSync(join(baselineDir, name), "utf8"));
}

function source(path) {
	return readFileSync(join(repoDir, path), "utf8");
}

check("git branch descends from the locked release", () => {
	assert.equal(command(["git", "rev-parse", "v0.81.1^{commit}"]), EXPECTED_SHA);
	assert.equal(command(["git", "branch", "--show-current"]), "baseline-v0");
	assert.equal(command(["git", "remote", "get-url", "origin"]), "https://github.com/KilianThe14/pi.git");
	command(["git", "merge-base", "--is-ancestor", EXPECTED_SHA, "HEAD"]);
});

check("upstream lock matches repository runtime facts", () => {
	const lock = json("pi-upstream.lock.json");
	const rootPackage = JSON.parse(source("package.json"));
	const packageLock = JSON.parse(source("package-lock.json"));
	assert.equal(lock.release.commit_sha, EXPECTED_SHA);
	assert.equal(lock.fork_lock.upstream_base_commit, EXPECTED_SHA);
	assert.equal(lock.release.tag, "v0.81.1");
	assert.equal(lock.release.published_at, "2026-07-21T16:45:17Z");
	assert.equal(
		lock.release.source_archive.sha256,
		"fb9bb7d7e8887e890824a08de588124350045da2cce763c5e6fd98d7141af31c",
	);
	assert.equal(lock.upstream_main_snapshot.commit_sha, "fc85bdd88be93b1e9a6b6bcfa41c684282ec79cc");
	assert.equal(rootPackage.engines.node, lock.runtime.node_requirement);
	assert.equal(packageLock.lockfileVersion, lock.lockfile.lockfile_version);
	assert.equal(packageLock.requires, lock.lockfile.requires);
	assert.equal(Object.hasOwn(rootPackage, "packageManager"), lock.lockfile.root_package_manager_field_present);
});

check("PRD synchronization lock is exact", () => {
	const lock = json("prd-sync.lock.json");
	assert.equal(lock.authority.baseline.revision, 83);
	assert.equal(
		lock.authority.baseline.markdown_sha256,
		"5bb9350707cb70909c501bdd39da943250590d57d4c802b25ca93f4897da606b",
	);
	assert.equal(lock.authority.upstream.revision, 290);
	assert.equal(
		lock.authority.upstream.markdown_sha256,
		"1763bd9c63f6e99afb996bb2ea64a5cba4fa479a9aca988897e8464f9418b2da",
	);
	assert.deepEqual(lock.sync_state.synced_decisions, [
		"Q33",
		"Q36",
		"Q40",
		"Q41",
		"Q45",
		"Q48",
		"Q52",
		"Q53",
	]);
	assert.deepEqual(
		lock.sync_state.pending_non_blocking.map(({ decision, status, blocks_b0 }) => ({
			decision,
			status,
			blocks_b0,
		})),
		[
			{ decision: "Q42", status: "pending", blocks_b0: false },
			{ decision: "Q46", status: "pending", blocks_b0: false },
		],
	);
});

check("Mock artifact and approval locks are exact", () => {
	const lock = json("mock-artifacts.lock.json");
	const approval = readFileSync(join(baselineDir, "approval-conditions.md"));
	assert.equal(lock.status, "mock_only_not_run");
	assert.equal(lock.validation.exit_code, 0);
	assert.equal(lock.validation.counts.cal_tasks, 8);
	assert.equal(lock.validation.counts.diagnostic_tasks, 35);
	assert.equal(lock.validation.counts.holdout_tasks, 15);
	assert.equal(lock.validation.counts.judge_readiness_samples, 12);
	assert.equal(lock.validation.counts.cal_slots, 24);
	assert.equal(lock.validation.counts.diagnostic_slots, 105);
	assert.equal(lock.validation.counts.holdout_slots, 45);
	assert.equal(lock.isolation.three_way_card_fixture_evidence_failure_state_intersections, 0);
	assert.equal(lock.isolation.holdout_content_in_public_pi_fork, false);
	assert.equal(
		createHash("sha256").update(approval).digest("hex"),
		lock.source_records.approval_conditions.sha256,
	);
});

check("capability statuses and required capability ids are complete", () => {
	const manifest = json("pi-capabilities.json");
	const allowed = new Set([
		"upstream_verified",
		"adapter_verified",
		"engineering_debug_required",
		"unsupported",
	]);
	const required = new Set([
		"tool_calling_and_events",
		"single_action_per_response",
		"parallel_tool_calls_false",
		"disable_coding_tools",
		"dedicated_agent_dir",
		"no_context_files",
		"system_prompt_override",
		"provider_request_observability",
		"usage_observability",
		"context_window",
		"session_isolation",
	]);
	for (const capability of manifest.capabilities) {
		assert.equal(allowed.has(capability.status), true, `${capability.id}: invalid status`);
		assert.equal(Array.isArray(capability.source_evidence), true);
		assert.equal(Array.isArray(capability.verification), true);
		assert.equal(typeof capability.boundary, "string");
		required.delete(capability.id);
	}
	assert.deepEqual([...required], []);
});

check("verification results contain successful required runs", () => {
	const results = json("pi-verification-results.json");
	assert.equal(results.release_commit, EXPECTED_SHA);
	assert.match(results.status, /^pass/);
	assert.equal(results.environment.credentials_used, false);
	assert.equal(typeof results.completed_at, "string");

	const passedCommands = results.commands.filter(({ exit_code }) => exit_code === 0).map(({ command }) => command);
	assert.equal(passedCommands.includes("node harness-baseline/scripts/verify.mjs"), true);
	assert.equal(passedCommands.some((value) => value.includes("test/agent-loop.test.ts")), true);
	assert.equal(passedCommands.some((value) => value.includes("noContextFiles is true")), true);
	assert.equal(passedCommands.some((value) => value.includes("test/sdk-session-manager.test.ts")), true);
});

check("pinned upstream source contracts still exist", () => {
	const agentLoop = source("packages/agent/src/agent-loop.ts");
	const codexProvider = source("packages/ai/src/api/openai-codex-responses.ts");
	const aiTypes = source("packages/ai/src/types.ts");
	const loader = source("packages/coding-agent/src/core/resource-loader.ts");
	const sdk = source("packages/coding-agent/src/core/sdk.ts");
	const sessions = source("packages/coding-agent/src/core/session-manager.ts");

	assert.match(agentLoop, /message\.content\.filter\(\(c\) => c\.type === "toolCall"\)/);
	assert.match(agentLoop, /if \(config\.beforeToolCall\)/);
	assert.match(agentLoop, /type: "tool_execution_end"/);
	assert.match(codexProvider, /parallel_tool_calls: true/);
	assert.match(aiTypes, /onPayload\?: \(payload: unknown/);
	assert.match(aiTypes, /onResponse\?: \(response: ProviderResponse/);
	assert.match(aiTypes, /contextWindow: number/);
	assert.match(loader, /agentsFiles: this\.noContextFiles\s*\?\s*\[\]/);
	assert.match(loader, /this\.systemPromptOverride \? this\.systemPromptOverride\(baseSystemPrompt\)/);
	assert.match(sdk, /options\.noTools === "all" \? \[\]/);
	assert.match(sessions, /static inMemory\(/);
});

check("neutral adapter tests pass", () => {
	const testFiles = readdirSync(join(baselineDir, "tests"))
		.filter((name) => name.endsWith(".test.mjs"))
		.map((name) => join(baselineDir, "tests", name));
	assert.ok(testFiles.length > 0, "no adapter tests found");
	command([process.execPath, "--test", ...testFiles]);
});

for (const result of checks) {
	const detail = result.error ? `: ${result.error}` : "";
	console.log(`${result.status} ${result.name}${detail}`);
}

const failed = checks.filter((result) => result.status === "FAIL");
if (failed.length > 0) {
	console.error(`FAIL ${failed.length}/${checks.length} verification checks failed`);
	process.exitCode = 1;
} else {
	console.log(`PASS ${checks.length}/${checks.length} verification checks passed`);
}
