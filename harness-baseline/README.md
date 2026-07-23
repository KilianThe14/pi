# Pi Fork baseline lock

This directory is the auditable Pi-side record for B0. It adds no business strategy, workflow policy, Harness intervention, or hidden evaluation logic. The upstream packages remain unchanged.

## Locked source

- Canonical upstream: `earendil-works/pi`
- Fork: `KilianThe14/pi`
- Branch: `baseline-v0`
- Stable release: `v0.81.1`
- Release/upstream base commit: `20be4b18d4c57487f8993d2762bace129f0cf7c6`
- Recorded upstream `main` snapshot: `fc85bdd88be93b1e9a6b6bcfa41c684282ec79cc` (audit only)
- Runtime: Node `>=22.19.0`, npm workspaces, `package-lock.json` v3

`pi-upstream.lock.json` is the machine-readable source record. The `baseline-v0` Git history is the authoritative exact Fork record and must remain descended from the locked upstream base. The baseline does not float with `main`.

## PRD synchronization

`prd-sync.lock.json` binds Baseline PRD revision 83 and upstream PRD revision 290 to their fetched Markdown hashes. Q33/Q36/Q40/Q41/Q45/Q48/Q52/Q53 are synchronized. Q42 and Q46 remain pending and non-blocking for B0; this directory does not resolve them.

## Mock artifacts and approval

`mock-artifacts.lock.json` records the validated Mock package counts and source hashes without publishing holdout task content in this public Fork. `approval-conditions.md` defines G0—G8, role separation, and the difference between `PASS`, `REWORK`, `BLOCKED`, and `NOT_RUN`.

The complete Mock package remains in the experiment workspace. A real frozen holdout set must move to a separate private non-submodule repository before formal evaluation.

## Neutral adapter

`src/baseline-adapter.mjs` contains only two transport/runtime guards:

1. Return a provider payload copy with `parallel_tool_calls=false`.
2. Use Pi's `beforeToolCall` hook to block every call in a response containing multiple actions.

Blocking the full multi-action batch avoids executing a partial business action. The Runner must pass these functions to the matching Pi hooks and record the observed payload/event evidence. Unit tests prove only the adapter mechanics; live Codex Provider behavior remains `engineering_debug_required`.

Formal and dev runs must separately disable Pi coding tools, context files, extensions, skills, prompts, and themes, use a dedicated `agentDir`, replace the system prompt, and create a fresh `SessionManager.inMemory()` per run. Those controls are recorded in `pi-capabilities.json`; no Runner is implemented here.

## Verification

From the repository root:

```bash
node harness-baseline/scripts/verify.mjs
```

The verifier is offline and read-only. It checks the locked HEAD/tag, runtime and lockfile facts, PRD lock, capability vocabulary, pinned source contracts, and Node built-in adapter tests.

The upstream directed tests used for this lock are:

```bash
cd packages/agent
node node_modules/vitest/dist/cli.js --run test/agent-loop.test.ts

cd ../coding-agent
node node_modules/vitest/dist/cli.js --run test/resource-loader.test.ts -t "should skip AGENTS.md and CLAUDE.md discovery when noContextFiles is true"
node node_modules/vitest/dist/cli.js --run test/sdk-session-manager.test.ts
```

Actual command results and environment facts are in `pi-verification-results.json`. They contain no credentials or tokens.

## Evidence boundary

Source presence and offline tests are not end-to-end Provider proof. Before formal B0, engineering debug must capture a redacted live request showing `parallel_tool_calls=false`, verify a live multi-action response is blocked without business side effects, reconcile Provider usage/context-window values, and confirm request callbacks for the selected Provider/API pair.

These records do not prove CAL, Judge readiness, B0 freeze, formal diagnosis, or Agent uplift.
