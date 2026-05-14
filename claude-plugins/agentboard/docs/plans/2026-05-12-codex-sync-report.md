# Codex sync report — architecture pipeline rework (2026-05-12)

**Source tree (changes landed here):** `claude-plugins/agentboard/`
**Parallel tree (changes mirrored to):** `codex-plugins/agentboard/`
**Rework plan:** `claude-plugins/agentboard/docs/plans/2026-05-12-architecture-pipeline-rework-plan.md`
**Rework contract:** `claude-plugins/agentboard/docs/specs/2026-05-12-architecture-pipeline-rework-contract.md`
**Plugin version:** `0.3.0` (bumped from `0.1.0` in both `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`; bumped from `0.2.1` in the agent-armory marketplace entry)

This report documents the codex tree synchronization performed at the close of Session 10 of the 2026-05-12 architecture pipeline rework. The rework upgraded the architecture pipeline from V1 to V2 — research bundle now carries design facts in addition to classification fields, the auditor moved from haiku to sonnet-4.6 with extended thinking, the three compose agents lost all codebase-discovery tools (they reason from the bundle only), a design reviewer wave was added between compose and user approval, and a level-aware validation hook gates artifact submission. See the rework plan and contract above for the full design rationale.

This sync follows the prior `docs/plans/2026-05-11-codex-sync-report.md` (which covered the 2026-05-09 redesign Sessions 1–6). The two reports are complementary: 2026-05-11 documented the level-aware split, 2026-05-12 documents the V2 schema bump plus discovery removal plus design reviewer addition.

## Versions in sync

| Surface | Path | Version |
|---|---|---|
| Claude plugin manifest | `claude-plugins/agentboard/.claude-plugin/plugin.json` | `0.3.0` |
| Codex plugin manifest | `codex-plugins/agentboard/.codex-plugin/plugin.json` | `0.3.0` |
| Agent-armory marketplace | `.claude-plugin/marketplace.json` (agentboard entry) | `0.3.0` |

All three are `0.3.0`. Versions are in sync.

The codex plugin manifest had unrelated working-tree edits at the time of the bump (description / longDescription / defaultPrompt text only). The version-field change was applied without disturbing those edits.

The codex-side marketplace at `codex-plugins/.agents/plugins/marketplace.json` does not carry a version field for the agentboard plugin (only `source.path`, `policy`, `category`), so no version bump applies there. The plan's §10 specifies the agent-armory marketplace at `/.claude-plugin/marketplace.json` as the authoritative marketplace surface for version tracking; the codex marketplace is left as-is.

## File-group sync summary

For each file in the canonical sync list (plan §10), the table below records the source path, the destination path, the sync status, the line count, and any divergence. Every synced file matches the source tree byte-for-byte (verified via sha256 comparison after copy).

### Agent profiles (6 files)

| Source (claude-plugins/agentboard/) | Destination (codex-plugins/agentboard/) | Status | Lines | sha256 match |
|---|---|---|---|---|
| `agents/architecture-research-agent.md` | `agents/architecture-research-agent.md` | new | 561 | yes |
| `agents/architecture-classification-auditor.md` | `agents/architecture-classification-auditor.md` | new | 484 | yes |
| `agents/architecture-compose-l1.md` | `agents/architecture-compose-l1.md` | new | 329 | yes |
| `agents/architecture-compose-l2.md` | `agents/architecture-compose-l2.md` | new | 403 | yes |
| `agents/architecture-compose-l3.md` | `agents/architecture-compose-l3.md` | new | 469 | yes |
| `agents/architecture-design-reviewer.md` | `agents/architecture-design-reviewer.md` | new | 377 | yes |

All six profiles were authored fresh in Sessions 2–7 of the 2026-05-12 rework and replace the V1 profiles that landed in the 2026-05-11 sync. The codex `agents/` directory did not previously exist; this sync creates it.

Status of the prior V1 profiles in the codex tree: the 2026-05-11 sync report described expected V1 content for the codex tree, but the codex `agents/` directory had not yet been populated when the 2026-05-12 rework began. This sync brings the codex tree directly to V2 — no V1-to-V2 in-place upgrade is needed. The 2026-05-11 verification checklist's V1 expectations (e.g., "haiku-modeled classification auditor", "L3 with eight Clear Thought tool invocations") are superseded by the V2 profile content shipped here.

Within each profile, all `Skill(skill: "agentboard:expert-standards")` activations are preserved verbatim — the cross-cutting expert-standards activation is profile content, not a runtime-substituted reference. Codex's skill activation mechanism must resolve `agentboard:expert-standards` to the registered skill (see Codex-specific runtime checklist below).

### Command (1 file)

| Source | Destination | Status | Lines | sha256 match |
|---|---|---|---|---|
| `commands/architecture.md` | `commands/architecture.md` | new | 207 | yes |

The 21-step orchestration command from Session 9. The codex `commands/` directory did not previously exist; this sync creates it. The 2026-05-11 sync report described expected V1 command content for the codex tree, but as with `agents/`, the codex `commands/` directory had not been populated when the 2026-05-12 rework began. This sync brings codex directly to the V2 command content.

### Hooks — registration, scripts, tests (3 directories, 24 files)

| Source | Destination | Status | Lines | sha256 match |
|---|---|---|---|---|
| `hooks/hooks.json` | `hooks/hooks.json` | new | 47 | yes |
| `hooks/scripts/validate-architecture-artifact.sh` | `hooks/scripts/validate-architecture-artifact.sh` | new | 849 | yes |
| `hooks/scripts/artifact-quality-gate.sh` | `hooks/scripts/artifact-quality-gate.sh` | new | 86 | yes |
| `hooks/scripts/inject-quality-gate-prompt.sh` | `hooks/scripts/inject-quality-gate-prompt.sh` | new | 101 | yes |
| `hooks/tests/build-fixtures.py` | `hooks/tests/build-fixtures.py` | new | 567 | yes |
| `hooks/tests/run-tests.sh` | `hooks/tests/run-tests.sh` | new | 240 | yes |
| `hooks/tests/fixtures/audit_invalid_incoherent_discrepancy.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/audit_invalid_missing_verdicts.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/audit_valid_no_discrepancy.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/audit_valid_with_discrepancy.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/bundle_invalid_level_mismatch.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/bundle_invalid_malformed_json.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/bundle_valid_l2.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/doc_l1_invalid_no_level_marker.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/doc_l1_valid.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/doc_l2_invalid_broken_slice_fields.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/doc_l2_invalid_empty_slices.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/doc_l2_invalid_missing_d_ref.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/doc_l2_valid.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/doc_l3_valid.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/non_architecture_clean.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/non_architecture_with_todo.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/review_invalid_bad_severity.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/review_invalid_summary_mismatch.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/review_valid_empty_findings.json` | (same) | new | json | yes |
| `hooks/tests/fixtures/review_valid_with_findings.json` | (same) | new | json | yes |

The codex `hooks/` directory did not previously exist; this sync creates it along with `hooks/scripts/` and `hooks/tests/fixtures/`. The hook test runner (`run-tests.sh`) and the fixture builder (`build-fixtures.py`) are Session-8 artifacts; the 20 fixtures are the validation hook's synthetic test corpus (valid + invalid for each artifact type, plus L1 / L2 / L3 architecture document fixtures).

#### `hooks/hooks.json` divergence note

The hook registration shape uses `${CLAUDE_PLUGIN_ROOT}` for command paths:

```
"command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/validate-architecture-artifact.sh"
```

This is a Claude Code-specific runtime variable. The Codex runtime may not expand `${CLAUDE_PLUGIN_ROOT}`; the codex copy preserves the exact source text rather than substituting because the appropriate codex-side env var (if one exists) is unverified. The codex plugin manifest at `codex-plugins/agentboard/.codex-plugin/plugin.json` does not currently declare a `hooks` field, so the hook registration may simply be unused under codex. If codex adopts hook execution against this plugin in a later session, the codex-side `hooks.json` will need its `${CLAUDE_PLUGIN_ROOT}` references rewritten to the equivalent codex-side mechanism, and `.codex-plugin/plugin.json` will need a `hooks` field added — both out of scope for this sync.

#### Hook script Bash compatibility

The three Session-8 scripts (`validate-architecture-artifact.sh`, `artifact-quality-gate.sh`, `inject-quality-gate-prompt.sh`) and the test runner (`run-tests.sh`) are POSIX Bash scripts using `jq` and `grep` / `sed`. They run identically on any platform that supplies a Bash 4+ environment plus those utilities. Codex's hook execution surface (if and when it adopts these hooks) must provide that environment.

### Documentation — plan, contract, issues, app spec, reviewer pattern analysis (5 files)

| Source | Destination | Status | Lines | sha256 match |
|---|---|---|---|---|
| `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md` | (same) | new | 1026 | yes |
| `docs/plans/2026-05-12-architecture-pipeline-rework-issues.md` | (same) | new | 256 | yes |
| `docs/plans/2026-05-13-session-6-reviewer-pattern-analysis.md` | (same) | new | 176 | yes |
| `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md` | (same) | new | 317 | yes |
| `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md` | (same) | new | 191 | yes |

These five documents establish the authoritative rework record. The plan is the HOW document, the contract is the WHAT document, the issues file is the WHY-FROM-V1 document, the reviewer pattern analysis is a Session 6 lesson captured for future profile authoring, and the app spec scopes downstream agentboard app changes that would better support the V2 pipeline (out of scope for this rework's implementation).

The codex `docs/specs/` directory did not previously exist; this sync creates it. The codex `docs/plans/` directory already held the 2026-03-15 codebase sweep design, the 2026-05-09 redesign plan, and the 2026-05-11 sync report — those are preserved unchanged; the three new 2026-05-12 / 2026-05-13 docs are additive.

### This sync report (1 file, mirrored in both trees)

| Source | Destination | Status | Lines | sha256 match |
|---|---|---|---|---|
| `claude-plugins/agentboard/docs/plans/2026-05-12-codex-sync-report.md` | `codex-plugins/agentboard/docs/plans/2026-05-12-codex-sync-report.md` | new | (this file) | (mirrored after authoring) |

Per plan §10, this report appears in both trees verbatim.

## Files NOT touched in the codex tree

The codex tree carries several files that are unrelated to the architecture pipeline rework. Each was left untouched (no modifications, no overwrites). They include uncommitted user edits the sync deliberately preserved:

- `codex-plugins/agentboard/README.md` (modified working tree)
- `codex-plugins/agentboard/skills/agentboard/SKILL.md` (modified)
- `codex-plugins/agentboard/skills/board-status/SKILL.md` (modified)
- `codex-plugins/agentboard/skills/foundation/SKILL.md` (modified)
- `codex-plugins/agentboard/skills/orchestrate/SKILL.md` (modified)
- `codex-plugins/agentboard/skills/orchestrate/references/planning-worker.md` (modified)
- `codex-plugins/agentboard/skills/orchestrate/references/review-worker.md` (modified)
- `codex-plugins/agentboard/skills/workspace-orchestration/SKILL.md` (modified)
- `codex-plugins/agentboard/.mcp.json` (codex MCP server registrations)
- `codex-plugins/.agents/plugins/marketplace.json` (codex-side local marketplace)

These are outside the architecture pipeline rework scope (plan §14). The user (Maxcogar) will reconcile or commit them in a separate cycle.

The codex tree also has no prior architecture-pipeline agent files, command file, or hook files (the codex `agents/`, `commands/`, and `hooks/` directories did not exist before this sync). This means there is no V1 codex content being upgraded in place — the codex tree was previously a skeleton with only skills, README, plugin manifest, and MCP config. The 2026-05-11 sync report was written prospectively against an expectation that those directories would be populated; this sync delivers on that expectation directly in V2 form.

## Codex-specific runtime checklist

Before the codex-side plugin can execute the V2 architecture pipeline end-to-end, the following five runtime compatibility points must be verified. Each is a known-unverified concern at the time of this sync.

1. **Skill resolution for `agentboard:expert-standards` and other Skill activations.**
   All six agent profiles open with the cross-cutting `Skill(skill: "agentboard:expert-standards")` invocation. The research agent also invokes `agentboard:codebase-rag`. Codex's skill activation mechanism must resolve these namespaced skill names to the registered skills, with the same execution semantics as Claude Code's `Skill` tool.

2. **MCP tool surface parity.**
   The agent profiles' `tools:` frontmatter declares `mcp__agentboard__*`, `mcp__codegraph__*`, `mcp__codebase-rag__*`, `mcp__claude_ai_Context7__*`, and `mcp__clear-thought__*` tools (Clear Thought is L3-only). Codex's MCP-tool naming surface may or may not match these prefixes. The codex `.mcp.json` registers `agentboard`, `codegraph`, `codebase-rag`, and `clear-thought` servers but does not register `claude_ai_Context7` (an Anthropic-internal naming for Context7). If Codex registers Context7 under a different prefix, the L1 / L2 / L3 compose profile `tools:` lists need the prefix rewritten; if Codex does not register Context7 at all, compose's external-doc lookup capability is absent on codex.

3. **Frontmatter convention parity.**
   Each agent profile uses the keys `name`, `description`, `model`, `tools`, and (auditor + design reviewer) `extended_thinking: true`. The auditor and design reviewer use `model: claude-sonnet-4-6`; the three compose profiles use `model: claude-opus-4-7`; the research agent uses `model: claude-haiku-4-5-20251001`. Codex must accept this frontmatter shape. If codex maps model identifiers differently (e.g., requires literal `opus` / `sonnet` / `haiku` aliases instead of full IDs), every profile's `model:` value needs adapting on the codex side.

4. **Hook execution surface.**
   The codex `.codex-plugin/plugin.json` does not declare a `hooks` field. The claude-side `.claude-plugin/plugin.json` declares `"hooks": "./hooks/hooks.json"`. The hook files (validate-architecture-artifact.sh, artifact-quality-gate.sh, inject-quality-gate-prompt.sh, hooks.json, the test suite) are mirrored to the codex tree but currently unused there. If codex is to enforce the architecture validation hook, the codex plugin manifest needs a `hooks` declaration added and the hook command paths need their `${CLAUDE_PLUGIN_ROOT}` references rewritten to the codex equivalent.

5. **Plugin version semantics.**
   Both plugin manifests carry `version: 0.3.0`. The marketplace metadata reflects the same. If codex's installer enforces semver-style upgrade rules, going from `0.1.0` directly to `0.3.0` skips `0.2.x`; this is intentional (the V1 codex tree at `0.1.0` did not include the architecture pipeline at all; the V2 sync lands the full pipeline in one step). No `0.2.x` codex release exists to preserve.

## Intentional divergence summary

| File | Divergence | Reason |
|---|---|---|
| `hooks/hooks.json` | References `${CLAUDE_PLUGIN_ROOT}` verbatim | Codex env-var equivalent unverified; codex plugin manifest does not yet declare a `hooks` field, so the file is currently unused on codex |
| `.codex-plugin/plugin.json` vs `.claude-plugin/plugin.json` | Different schemas (codex-side carries `interface`, `mcpServers`, `keywords`, `screenshots`; claude-side carries `hooks`, simpler description) | Each plugin manifest is runtime-specific; only the `version` field is required to match across them |
| `codex-plugins/.agents/plugins/marketplace.json` | No version field for agentboard entry | Codex-side marketplace schema does not include version tracking for this plugin |

No content-level divergence between the synced architecture-pipeline files. Every agent profile, command file, hook script, test fixture, and documentation file is byte-identical between the two trees (verified via sha256 in this sync).

## Source-tree commit history (claude-plugins/agentboard/)

For traceability when applying or auditing this sync:

- `a182618` — Session 1: issues, contract, plan, handoff
- `5ba1dcc` — Session 2: V2 schemas + research agent rewrite
- `03113dc` — Session 3: auditor profile V2 + plan §3 sync
- `74a7518` — Session 4: compose-l3 V2 (no codebase discovery in compose)
- `0a8d982` — Session 5: compose-l2 V2 (no codebase discovery in compose)
- `542d16f` — Session 6: compose-l1 V2 (no codebase discovery in compose)
- `9504efa` — Session 7: design-reviewer profile (initial)
- `e767fc1` to `12218fa` — Session 7 rounds 2–9: design-reviewer fixes (commits `e767fc1`, `7d29ba4`, `ae8a794`, `2e4f3f8`, `6b77ba0`, `b5da130`, `1153a4d`, `12218fa`)
- `2af2282` — Session 8: hooks — V2 artifact validation, gate dispatch, synthetic tests
- `de39b12` — Session 9: /architecture orchestration rewrite + agentboard app spec
- (this session's commit) — Session 10: codex sync + version 0.3.0 + final verification report

All commits are on branch `main` in `Maxcogar/agent-armory`.

## Verification checklist

| Item | Status |
|---|---|
| All six V2 agent profiles present in `codex-plugins/agentboard/agents/` | yes |
| 21-step `/architecture` command present in `codex-plugins/agentboard/commands/` | yes |
| Hook registration + 3 scripts present in `codex-plugins/agentboard/hooks/` | yes |
| Hook test suite (runner + builder + 20 fixtures) present in `codex-plugins/agentboard/hooks/tests/` | yes |
| Plan + contract + issues + app spec + reviewer pattern analysis present in `codex-plugins/agentboard/docs/` | yes |
| `.claude-plugin/plugin.json` version is `0.3.0` | yes |
| `.codex-plugin/plugin.json` version is `0.3.0` | yes |
| `/.claude-plugin/marketplace.json` agentboard entry version is `0.3.0` | yes |
| All 38 synced files sha256-match the source tree | yes |
| Codex-side user-modified files preserved untouched | yes (10 files identified above) |
| Codex-specific runtime checklist documented | yes (5 items above) |
| This sync report mirrored to `codex-plugins/agentboard/docs/plans/2026-05-12-codex-sync-report.md` | yes (mirrored after authoring) |

The codex tree is synchronized with the claude tree for every file in scope for the 2026-05-12 architecture pipeline rework as of Session 10.
