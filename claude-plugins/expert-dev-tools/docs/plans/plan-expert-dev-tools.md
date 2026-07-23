# Plan — expert-dev-tools plugin

**Inputs:** `docs/specs/spec-expert-dev-tools.md` (owner-approved),
`docs/arch/architecture-expert-dev-tools.md` (owner-approved, commit `60fdd37`).
**Produced under:** the expert-plan process; output-contract §16 sections;
testing-standards. **Date:** 2026-07-22.

---

## 1. Goal

Build the `expert-dev-tools` Claude Code plugin as the architecture specifies:
package the nine Expert-series skills (repaired to load), and add the
lifecycle system — a thin `/expert` command, one deterministic
`expert-lifecycle.js` workflow, nine typed agents, two standalone scripts and
a ledger schema, MCP declarations and a manifest — then prove it against a
fixture project through acceptance criteria A-1..A-9. Success: the plugin
installs and loads; the standalone scripts pass unit tests; the orchestration
passes integration/system tests including the forced-failure cases that prove
the anti-fabrication, diagnosis, and feedback layers actually fire.

## 2. Scope

**In scope:** every component in architecture §Components (C1–C8, C7a) plus the
nine packaged skills and the fixture test suite. **Out of scope** (spec §2,
owner-approved — register Q1): governance/enforcement hooks, marketplace
publication, orchestration lifecycles for the non-chain skills, and any change
to `skills/Expert-Skills/` sources (the plugin carries its own repaired
copies). **This plan ends** at a fixture-verified plugin on the working
branch; **after** it: independent review, then the owner merges.

**Coverage reconciliation** — every requested element → its step(s):

| Requested element (spec) | Step(s) |
|---|---|
| C5 nine skills packaged + R-1 repairs | S1 (7 loadable, 2 flattened), S2 (2 unescaped) |
| C7a ledger schema | S3 |
| C7 ledger validator | S4 |
| C8 transcript reader (F-14) | S5 |
| C4 nine agents | S6 |
| C3 workflow / F-1,F-3,F-4,F-5,F-6,F-8,F-11,F-12,F-13,F-14 | S7 |
| C2 command / F-2,F-7,F-9,F-10, STATUS.md (D12) | S8 |
| C1 manifest | S9 |
| C6 .mcp.json (D8) | S10 |
| Ledger `.claude/expert/` (D-6), defect stores (D15) | S3 (schema), S7/S8 (writes) |
| Testing architecture A-1..A-9 | S11 (fixture), S12 (suite) |
| Correction doctrine (5 rules) | S7 (router enforces) |
| Escalation set §3.4 (six gate types) | S7 (SEGMENT_REPORT), S8 (presentation) |

No requested element maps to nothing; no exclusion lacks the Q1 approval.

## 3. Standards that govern this plan

Inherited from the architecture's standards table (each already drove a design
decision there; here each governs the corresponding build step):

- **SOLID / single responsibility** — component boundaries (S6, S7, S8 keep
  work/orchestration/IO separate).
- **Workflow tool determinism contract** (in-session + vetted
  `skills/workflow-creator/`) — governs S7: no `require`/`fs`/`process`/`Date`/
  `Math.random` in the orchestrator; `meta` pure-literal first statement;
  `agent()`/`parallel()`/`pipeline()`/`budget`/`args`; schema-forced returns;
  `scriptPath`/`resumeFromRunId`.
- **Claude Code plugin reference** (Context7 `/websites/code_claude`) — governs
  S1/S6/S9/S10: plugin layout, `plugin.json` (`name` required, kebab-case),
  agent frontmatter (`name`+`description` required; `tools`/`model` optional),
  `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PLUGIN_DATA}`.
- **OWASP ASVS V1/V7/V8 (applicable subset)** — governs S6 tool-scoping
  (least privilege; no CORE-ingest tool on any agent), S7/S8 single-writer
  ledger + hash integrity.
- **IEEE 1028 review independence** — governs S6 reviewer agent + S7 blinded
  dispatch.
- **ISO/IEC/IEEE 29119 (levels + design techniques) + SWE-at-Google + Meszaros
  + Fowler** (testing-standards, read this session) — governs S12: test level
  selection, real-default/justified-double discipline, the two-tier
  architecture, technique-named case sets.
- **Root-cause-before-correction (systematic debugging; ISO 9001 §10.2)** —
  governs S7 diagnostic layer + correction doctrine.
- **Single source of truth** — governs S5/S7 (read transcripts, don't copy).
- **JSON Schema (draft 2020-12)** — governs S3 ledger schema.

## 4. Spec issues

None. Planning surfaced no contradiction between the spec, the architecture,
and the observed platform. The one nuance found — `commands/` is documented as
"legacy: use skills/ instead" — does not contradict the architecture's C2
choice (see Decision D-P4) and is not a spec conflict.

## 5. Files affected

All **created** (greenfield — verified §11-C1 that only `docs/` exists; no
dependents, no collisions). Root `claude-plugins/expert-dev-tools/`:

- `.claude-plugin/plugin.json` (S9)
- `.mcp.json` (S10)
- `commands/expert.md` (S8)
- `workflows/expert-lifecycle.js` (S7)
- `agents/expert-spec-writer.md`, `expert-architect.md`, `expert-planner.md`,
  `expert-implementer.md`, `expert-reviewer.md`, `expert-verifier.md`,
  `expert-acceptance.md`, `expert-diagnostician.md`, `expert-closeout.md` (S6)
- `scripts/ledger.schema.json` (S3), `scripts/validate-ledger.mjs` (S4),
  `scripts/extract-owner-turns.mjs` (S5)
- `skills/<nine>/…` (S1, S2) — copied from `skills/Expert-Skills/` with the
  R-1 transformations
- `tests/fixture/…` and `tests/…` (S11, S12)

No existing file is modified or deleted. `codegraph_find_related_docs` is not
run against a change set because there is no change set to existing code — the
work is additive (§11-C1). Documentation for the plugin (spec, arch, and this
plan) already exists under `docs/` and is not touched by build steps.

## 6. Foundation corrections

The two escaped skills (`expert-spec`, `expert-review`) are the only
"foundation" issue, and they are inside this plan's own deliverable (packaged
copies), not in a dependency the build stands on. They are corrected at S2 as
first-class steps, not deferred. No pre-existing external code is corrected —
the plugin builds on the platform, not on repo code (§11-C1).

## 7. Plan

Ordered by the dependency topology (Decision D-P1): skills → standalone
scripts → agents → workflow → command → wiring → tests.

---

### S1 — Package the seven loadable skills (flattening the two nested)

**What changes:** create `claude-plugins/expert-dev-tools/skills/` and copy,
verbatim, seven skills that already parse: `expert-standard`, `expert-plan`
(with its `references/`), `expert-architecture`, `expert-implement` (with its
`references/`), `frontend-standards` (with its `references/`), and — flattened
from their double-nested source — `expert-architecture-portable`
(from `expert-architecture-portable/expert-architecture-portable/`) and
`expert-mcp-overhaul` (from `expert-mcp-overhaull/expert-mcp-overhaul/`, with
its `references/`; note the source-dir misspelling `overhaull` is dropped —
the packaged skill is `expert-mcp-overhaul`). Exclude
`expert-architecture-portable.zip`.
**Source:** spec R-1, C5; architecture §Components C5.
**Why this approach:**
1. *Decision:* copy the seven into the plugin `skills/`, flattening the two
   nested dirs and dropping the `overhaull` misspelling.
2. *Standard:* spec R-1 + Context7 plugin skill layout (`skills/<name>/SKILL.md`).
3. *Why here:* auto-discovery expects a flat `skills/<name>/SKILL.md`
   (§11-C6); a double-nested dir would not be discovered, so the skill would
   silently not load.
4. *NOT — and why:* NOT referencing the source skills in place (the plugin must
   be self-contained and the source copies stay untouched per spec §2); NOT
   copying the nested structure as-is (undiscoverable); NOT including
   `expert-architecture-portable.zip` (a stray artifact, not a skill).
**Dependencies:** none (independent root of the topology). Unblocks S6 (agents
reference these skills).
**Verification:** T-A1 (each packaged skill's frontmatter parses and the skill
loads); plus a byte-identical check that each copied `SKILL.md` matches its
source except for path relocation (no content change).
**Impact if wrong:** an agent's `skills:` reference resolves to a missing or
mis-discovered skill → the agent runs without its Expert frame → the whole
quality premise fails silently. Contained to packaging; caught by T-A1.

### S2 — Repair and package the two escaped skills

**What changes:** copy `expert-spec` and `expert-review` into
`skills/expert-spec/` and `skills/expert-review/`, applying one deterministic
transformation: for each backslash-escaped markdown metacharacter in the
observed set — `\#`→`#`, `\*`→`*`, `\-`→`-`, `\[`→`[`, `\&`→`&`, `\_`→`_` —
drop the backslash. No other transformation.
**Source:** spec R-1 ("unescape the corrupted markdown"); architecture §R-1.
**Why this approach:**
1. *Decision:* a targeted metacharacter unescape, not a blanket backslash
   strip.
2. *Standard:* CommonMark backslash-escaping — a backslash is only an escape
   before an ASCII punctuation metacharacter; before any other character it is
   a literal.
3. *Why here:* the census (§11-C3) shows both files contain **zero**
   backslashes before a letter, digit, or space — every backslash present is a
   metacharacter escape — so dropping the backslash before exactly the six
   observed metacharacters is provably lossless and restores valid Markdown
   with a parseable `---` frontmatter fence.
4. *NOT — and why:* NOT a blanket `s/\\//g` (would corrupt any legitimate
   `\n`, path, or regex — here there are none, but the blanket rule is unsafe
   as a specified transformation and would fail review on a file that did have
   one); NOT a hand-retype of the 362/630-line files (error-prone, and R-1
   requires verbatim content — a retype cannot prove verbatim).
**Dependencies:** none. Unblocks S6.
**Verification:** T-A1 (both load); plus a diff of repaired-vs-source proving
the only changes are backslash removals before the six metacharacters (the
diff has no line whose non-backslash content changed), and a post-transform
scan confirming zero residual `\<metacharacter>` sequences.
**Impact if wrong:** an over-broad strip alters the owner's skill content
(R-1 violation); an under-broad one leaves the skill unloadable. Both caught
by the diff + load verification.

### S3 — Ledger JSON Schema (`scripts/ledger.schema.json`)

**What changes:** author a JSON Schema (draft 2020-12) for the ledger, fields
per architecture §Components + D9 + D15: `revision` (integer, monotonic),
`task`, `phase`, `artifact_index[]` `{role, path, sha256, approved_by_owner,
approval_segment}`, `gate_history[]` `{gate, round, verdict, findings_count,
tokens}`, `amendments[]`, `escalations[]`, `budget`, `feedback_marker`
`{session_file, line}`, and the project-scoped `signature_history[]`
`{signature, description, responsible_component, occurrences[] {project,
session_file, date, plugin_version}, state, correction}`.
**Source:** architecture §Components (ledger), D6, D9, D15.
**Why this approach:**
1. *Decision:* one JSON Schema file, strict enough to reject each malformed
   ledger class (missing required field, wrong type, bad enum,
   non-monotonic `revision`).
2. *Standard:* JSON Schema draft 2020-12; single source of truth.
3. *Why here:* both the validator (S4) and the tests consume this one file, so
   ledger shape can't drift between writer and checker; strictness is what
   makes the T3 integrity control real.
4. *NOT — and why:* NOT a permissive/partial schema (would let a malformed
   ledger through preflight and weaken T3); NOT duplicating the shape as inline
   checks in the validator (two definitions that drift — the schema is the one
   definition, the validator reads it).
**Dependencies:** none. Unblocks S4, S7, S8.
**Verification:** T-U1 (schema is itself valid draft-2020-12 and accepts a
known-good ledger, rejects known-bad ones — exercised via S4).
**Impact if wrong:** a permissive schema lets a malformed ledger through → T3
integrity control weakened. Caught by T-U1's negative cases.

### S4 — Ledger validator (`scripts/validate-ledger.mjs`)

**What changes:** a dependency-free Node ESM script that loads
`ledger.schema.json` and validates a ledger file against it (structural +
type + required-field + enum checks the schema expresses), exiting non-zero
with a diagnostic on any violation.
**Source:** architecture §Components C7; spec F-2 (preflight validates ledger),
T3 controls.
**Why this approach (D-P2):** hand-written validation against the fixed, small
schema rather than bundling AJV — avoids adding an npm dependency and a
`${CLAUDE_PLUGIN_DATA}` install step, keeping the plugin self-contained with no
`node_modules`. Node v22.16.0 provides everything needed (§11-C7).
**Dependencies:** S3. Unblocks S8 (command preflight calls it).
**Verification:** T-U1.
**Impact if wrong:** preflight passes an invalid ledger → the workflow runs on
corrupt state. Caught by T-U1.

### S5 — Transcript reader (`scripts/extract-owner-turns.mjs`)

**What changes:** a dependency-free Node ESM script: given a transcript
directory and a `{session_file, line}` marker, stream the project's `*.jsonl`
transcripts (newest-appended semantics), extract `type:"user"` entries after
the marker with a bounded surrounding-context window, and print the extracted
turns plus the advanced marker as JSON.
**Source:** architecture §Components C8, D14; spec F-14.
**Why this approach:** reads the existing transcript system of record (D14) —
no capture layer. Streaming with a marker keeps each sweep incremental
(architecture Limitations: sweep cost).
**Dependencies:** none (reads platform transcripts, verified present §11-C9).
Unblocks S7 (the feedback-sweep agent runs it).
**Verification:** T-U2.
**Impact if wrong:** missed owner turns → repeat complaints undetected; wrong
marker → re-processing or skips. Caught by T-U2.

### S6 — The nine agent definitions

**What changes:** create `agents/<name>.md` for each of the nine agents
(architecture §Components C4), each with `name`+`description` frontmatter, a
`tools` allowlist scoped to its phase, an optional `model`, a `skills:` preload
naming its packaged Expert skill (e.g. `expert-planner` preloads
`expert-dev-tools:expert-plan`), and a system prompt stating its role and that
its return is consumed as structured data. Tool scoping per architecture D11:
reviewer/verifier/acceptance/diagnostician = read-only tools + `Skill`
(+ `Bash` for acceptance/verifier to execute checks); implementer = full edit
tools; closeout = `Bash` (git) — and **no agent** carries a CORE-ingest tool
(T2 control). The per-dispatch output **schemas live in the workflow** (S7),
not here (architecture C4/D11: `agent(prompt,{agentType,schema})`).
**Source:** architecture §Components C4, D11; spec F-4.
**Why this approach:**
1. *Decision:* one plugin agent definition per phase, dispatched by
   `agentType`, skill preloaded via `skills:` frontmatter.
2. *Standard:* least privilege (ASVS V1) + documented plugin-agent frontmatter.
3. *Why here:* tool scoping makes "the reviewer is read-only" and "no agent can
   ingest memory" capability boundaries, not instructions (D11); `skills:`
   preload is the verified-deterministic way to load the Expert frame (§11-C11).
4. *NOT — and why:* NOT generic prompt-only agents (no capability enforcement —
   a "read-only" reviewer that can Write is a review that can rewrite the code
   it judges); NOT loading the skill by in-prompt instruction only (preload is
   deterministic; instruction is best-effort).
**Dependencies:** S1, S2 (the `skills:` references must resolve to packaged,
loadable skills). Unblocks S7.
**Verification:** T-A2b (every agent frontmatter parses, `skills:` names a
packaged skill, tool allowlist matches D11, no CORE-ingest tool present).
**Impact if wrong:** an over-broad allowlist breaks an isolation guarantee
(e.g. reviewer independence); a wrong `skills:` name loads no Expert frame.
Caught by T-A2b.

### S7 — The orchestrator (`workflows/expert-lifecycle.js`)

**What changes:** author the single workflow script. Structure (all inline —
Decision D-P1 forbids extraction): `meta` pure-literal first; an entry that
reads `args` (ledger snapshot + task) and routes from `args.phase`; a
phase-dispatch map (`agentType` + inline output `schema` per phase, schemas per
architecture C4); a review-loop function (fresh reviewer per round, single lens
for document gates, three-lens `parallel` panel on the implementation-PASS
round, cap 5 → non_convergence); the deterministic spot-re-run sampler
(`max(2, ceil(0.1·n))`, index stride from `args.ledger.revision`); the
diff-vs-plan and reconciliation dispatches (expert-verifier); the ground-truth
dispatch (expert-acceptance); the **failure router** (seven classes →
expert-diagnostician → `machine_applicable` into amend→review, `owner_owned`
attaches to the gate) enforcing the five correction-doctrine rules; the
**feedback sweep** (runs S5 via the diagnostician in feedback-sweep mode;
signature clustering against both stores; `course_correction` /
`systemic_defect` / `failed_correction` / `stale_deployment` verdicts,
version-compared); budget capture via `budget.spent()` per phase; the agent
retry-once-then-escalate policy; and the `SEGMENT_REPORT` builder (the six
gate types + optional `diagnosis`/`correction_draft`). Returns a
`SEGMENT_REPORT`. No filesystem/Date/random; the script never writes the
ledger (S8 does).
**Source:** architecture C3, D2, D4, D5, D6, D8, D13, D14, D15; the correction
doctrine; spec F-1,F-3,F-4,F-5,F-6,F-8,F-11,F-12,F-13,F-14.
**Why this approach:**
1. *Decision:* one segment-per-invocation deterministic orchestrator, all gate
   and routing logic inline.
2. *Standard:* Workflow determinism contract; SOLID (this file is the sole
   owner of orchestration policy).
3. *Why here:* the architecture's D2 multi-criteria analysis settled
   segment-per-invocation; owner gates must be run boundaries and the
   `SEGMENT_REPORT` return is that boundary.
4. *NOT — and why:* NOT extracting the decision helpers into an imported module
   (the runtime forbids `require` in the orchestrator, and a parallel copy for
   testing would be a doubled subject — D-P1); NOT per-phase scripts
   (architecture D2 rejected, 0.68 vs 0.895).
**Dependencies:** S3 (schema the report deltas conform to), S6 (agents to
dispatch), S4/S5 contracts. Unblocks S8, S12.
**Verification:** T-A2a (passes `validate-workflow.mjs`); T-S1..T-S6
(integration/system runs exercise routing, gates, sampling, diagnosis,
feedback, cross-project/failed-correction — the A-3..A-9 behaviors).
**Impact if wrong:** the orchestrator is the whole product; a routing defect
silently mis-gates every future task. This is the highest-impact step; its
checkpoint (CP2) gates everything after it.

### S8 — The `/expert` command (`commands/expert.md`)

**What changes:** author the operator command: F-2 preflight (required MCPs
answer; `validate-ledger.mjs` passes; repo workable); read + hash-check the
ledger (re-hash `artifact_index` entries, mark drift as amended per D9);
invoke `Workflow({scriptPath:"${CLAUDE_PLUGIN_ROOT}/workflows/expert-lifecycle.js",
args:<snapshot>})`; on return, write the ledger once (single writer, D3),
persist advanced feedback marker + signature history, regenerate `STATUS.md`
from the ledger (D12); present any `SEGMENT_REPORT.gate` in plain language
(F-9) or report completion. Contains no lifecycle routing.
**Source:** architecture C2, D3, D9, D12; spec F-2,F-7,F-9,F-10, §3.4.
**Why this approach:**
1. *Decision:* a slash command as the single IO/owner-facing operator.
2. *Standard:* separation of presentation/IO (C2) from policy (C3); documented
   command mechanics (bash execution, `${CLAUDE_PLUGIN_ROOT}`).
3. *Why here:* `/expert` is an explicit owner-invoked entry point — the command
   use case; it needs bash (preflight, node scripts, git) and `Workflow`.
4. *NOT — and why:* NOT putting routing in the command (that is C3's job and
   the command tier is non-deterministic — architecture Limitations); NOT a
   skill instead of a command (D-P4: a command fits explicit-invocation
   operator UX; the "legacy" note does not remove command support).
**Dependencies:** S7, S4, S5, S3. Unblocks S11/S12 (A-3 drives via `/expert`).
**Verification:** T-A3 (the command drives a full fixture lifecycle;
STATUS.md generated; single ledger write per segment observed).
**Impact if wrong:** a mis-written ledger (the one non-deterministic tier) —
bounded by S4 validation + D9 hashing; caught by T-A5 (resume) and T-A3.

### S9 — Plugin manifest (`.claude-plugin/plugin.json`)

**What changes:** `{name:"expert-dev-tools", version:"0.1.0", description, author,
keywords}`. `name` kebab-case (namespaces components as `expert-dev-tools:*`).
Do **not** declare `hooks` in the manifest (there are none this version;
architecture removed the capture hook — and re-declaring auto-discovered hooks
is the duplicate-load error observed in this environment, §11-C-obs).
**Source:** architecture C1; Context7 plugin manifest (§11-C5).
**Why this approach:** `name` is the only required field; `version` present
from the start because D15's failed_correction/stale_deployment split compares
against it (architecture D15).
**Dependencies:** S1,S2,S6,S7,S8,S10 exist (manifest namespaces them).
Unblocks T-A1/T-A2 (discovery).
**Verification:** T-A2c (plugin-validator agent passes; components discovered
under the `expert-dev-tools:` namespace).
**Impact if wrong:** nothing loads. Caught immediately by T-A1.

### S10 — MCP declarations (`.mcp.json`)

**What changes:** declare the two npm-runnable servers the phase skills
hard-require — Context7 and Clear Thought (`clear-thought` via
`npx @waldzellai/clear-thought`, matching the environment's working config).
Do **not** declare CodeGraph or codebase-rag (D8: CodeGraph is a local server
verified by preflight, not declared; codebase-rag likewise local). Server
names chosen to match what the skills call.
**Source:** architecture C6, D8; spec constraint (expert-plan/-architecture
halt without these MCPs).
**Why this approach:** declare what is portable so the plugin brings its own
Context7/Clear-Thought (D8); preflight (S8) verifies the local CodeGraph.
Declaring is safe — same-named servers coexist namespaced by source (D-P6,
§11-C14), so there is no collision with any the owner already has.
**Dependencies:** none. Unblocks S8 preflight semantics.
**Verification:** T-A2d (`.mcp.json` parses; declared servers start in a probe
session; the skills' required tools resolve).
**Impact if wrong:** a phase halts mid-run for a missing MCP — but preflight
(S8) turns that into an up-front, diagnosed stop (F-2), not a silent failure.

### S11 — Fixture project + forced-failure fixture agents

**What changes:** create `tests/fixture/` — a small real codebase + a toy task
whose lifecycle is short — and, under `tests/fixture/`, alternate
"forced-failure" agent definitions used only by the test harness: an
implementer variant that touches an unauthorized file (A-4a), a phase variant
that emits a fabricated verification entry at a sampled index (A-4b), a fixture
spec carrying a seeded contradiction (A-4c), a reviewer variant pinned to
NEEDS_FIXES (A-4d), and fixture transcripts carrying a planted repeated
complaint and a corrected-then-recurring signature (A-8, A-9). These live in
the test tree, never in the shipped plugin (architecture Testing).
**Source:** architecture §Traceability (Testing architecture); spec A-3..A-9.
**Why this approach:** forced-failure agents make the anti-fabrication,
diagnosis, and feedback controls testable against known-answer inputs — the
A-4b plant is placed at a deterministically-sampled index so the sampler must
catch it (architecture Testing).
**Dependencies:** S1–S10 (the suite exercises the whole plugin). Unblocks S12.
**Verification:** consumed by S12's tests.
**Impact if wrong:** a mis-placed plant makes a forced-failure test vacuously
pass. Guarded by T-S* asserting the plant is at a sampled index and the control
fired *because* of it.

### S12 — The A-1..A-9 test suite

**What changes:** author the two-tier suite (Decision D-P1): **unit** tests for
the standalone modules (T-U1 validator, T-U2 transcript reader) and **integration/
system** tests driving real workflow runs against fixture agents (T-A1 skill
loads, T-A2 structure/validators, T-A3 end-to-end, T-A4a–d forced failures,
T-A5 resume, T-A6 owner-language, T-A9 cross-project + failed-correction), each
mapped to its acceptance criterion. A-7 (diagnosis quality) is asserted as a
property of the A-4 runs' diagnosis outputs.
**Source:** spec A-1..A-9; testing-standards (levels, doubles, techniques).
**Why this approach:** see Test specifications (§12) and Decision D-P1.
**Dependencies:** S11 and all prior. Unblocks nothing (terminal).
**Verification:** the suite is the verification; its own green run plus the
forced-failure runs failing-then-being-caught.
**Impact if wrong:** a fake test (testing-standards anti-pattern catalog)
reports coverage that never happened. Guarded by writing each test's failure
condition first (§12) and the catalog audit.

## 8. Divergences from existing patterns

One, recorded: the plugin does **not** re-declare its auto-discovered
`hooks/hooks.json` in the manifest (S9), diverging from the agentboard plugin's
pattern in this repo. Standard: the plugin reference states auto-discovered
hooks load once; re-declaring them produced the duplicate-load error observed
live (§11-C-obs). Introduced at S9. (This plugin ships no hooks at all this
version, so the divergence is moot in practice but recorded because agentboard
is the nearest in-repo template and a builder might copy its manifest shape.)

## 9. Checkpoints

- **CP1 — after S5** (standalone scripts): T-U1 and T-U2 pass before any
  component builds on the validator or reader contracts. Trigger:
  foundation-before-dependents.
- **CP2 — after S7** (orchestrator): a happy-path fixture run (T-A3 precursor,
  driven directly via `Workflow({scriptPath})` before the command exists)
  reaches completion with correct gate sequencing, before the command layers
  on. Trigger: the integration point / hardest-to-reverse step.
- **CP3 — after S12** (full acceptance): all A-1..A-9 green, forced failures
  caught. Trigger: structural-to-behavioral completion boundary.

## 10. Decisions made during planning

- **D-P1 — Two-tier test architecture; no extracted-logic unit layer.** The
  orchestrator can't `import` (Workflow determinism), so its routing logic is
  inline. Unit-testing an *extracted copy* would be a doubled-subject
  anti-pattern (testing-standards #2) — the verdict wouldn't transfer to the
  real inline logic. Therefore: unit tests only for the genuinely-standalone
  modules used as-is (validator, transcript reader); orchestration verified at
  integration/system level via real workflow runs with scripted fixture agents,
  asserting observable outcomes (state, not interactions). Reasoning:
  sequentialthinking `arch-…` continuation, thought 1 this session.
- **D-P2 — Dependency-free validator.** `validate-ledger.mjs` hand-validates
  against the schema rather than bundling AJV, so the plugin needs no
  `node_modules`/`${CLAUDE_PLUGIN_DATA}` install. Justified by the schema being
  small and fixed; revisit only if the schema grows complex enough that
  hand-validation becomes the error-prone option.
- **D-P3 — Targeted metacharacter unescape (S2), proven lossless.** Grounded in
  the census showing zero at-risk backslashes (§11-C3) + CommonMark escaping
  semantics. A blanket strip was rejected as an unsafe *specified*
  transformation even though it happens to be harmless on these two files.
- **D-P4 — `/expert` stays a command, not a skill.** The plugin reference flags
  `commands/` as "legacy: use skills/ instead," but an explicit owner-invoked
  operator that runs bash and invokes Workflow is the command use case, and the
  architecture settled C2 as a command. The legacy note is a preference for
  autonomously-triggered behaviors (which skills model better), not a
  deprecation of commands. Recorded so a reviewer doesn't read the divergence
  from the doc's preference as an oversight.
- **D-P6 — The plugin declares Context7 + Clear-Thought; no collision with any
  the owner already has.** Resolved by direct observation (§11-C14): Claude Code
  namespaces MCP servers by source, and multiple same-named servers coexist in
  the current session without deduping or erroring. So declaring them in the
  plugin (D8's portability choice — the plugin brings its own npm-runnable
  servers) is safe; the agents receive them under the plugin's own namespace.
  Consequence for S6: an agent uses whichever Context7/Clear-Thought/CodeGraph
  tool is in its toolset; the Expert skills' example tool-names
  (`mcp__claude_ai_Context7__…`) are illustrative, and an agent adapts to the
  namespaced tool it actually has. T-A2d is therefore a routine smoke check
  (servers start, tools resolve), not an approach-selector.
- **D-P5 — `version` present from 0.1.0.** D15's failed_correction vs
  stale_deployment split compares the running version to `fixed_in_version`;
  the mechanism needs a real version from the first release, so `version` is
  not omitted despite being optional.

## 11. Verification of factual claims

- **C1 — The plugin tree is greenfield; only `docs/` exists; the build is
  additive with no dependents.** Evidence: `find claude-plugins/expert-dev-tools
  -type f` (this session, 2026-07-22) → only `docs/specs/…` and `docs/arch/…`.
  Steps depending: all; §5; §6.
- **C2 — Nine skill sources exist with the named directory names.** Evidence:
  `ls skills/Expert-Skills/` (this session) → the nine dirs + one `.zip`.
  Steps: S1, S2.
- **C3 — `expert-spec` and `expert-review` begin `\---` and contain escaped
  metachars {`#`,`*`,`-`,`[`,`&`,`_`} with ZERO backslashes before any
  letter/digit/space.** Evidence: Python census (this session) — expert-spec
  `[('#',13),('*',128),('-',16),('[',1)]`, expert-review adds `('&',2),('_',4)`,
  both `first line: '\\---'`, both "at-risk escapes: NONE". Steps: S2; D-P3.
- **C4 — The other seven `SKILL.md` files have a clean `---` frontmatter fence
  (first line) and load.** Evidence: `head -1` check (this session) → "clean"
  for expert-standard/plan/architecture/implement (and the two nested + are
  read as clean-fenced). Note: `expert-architecture` has 13 cosmetic body
  escapes (clean fence, still loads) — recorded in Gaps. Steps: S1.
- **C5 — `plugin.json` requires only `name` (kebab-case); `version` optional.**
  Evidence: Context7 `/websites/code_claude` plugins-reference "Required
  fields" + Quickstart manifest (2026-07-22). Steps: S9; D-P5.
- **C6 — Plugin agent files use `name`+`description` (required) frontmatter,
  `tools`/`model`/`effort`/`maxTurns`/`disallowedTools` optional; plugin skill
  layout is `skills/<name>/SKILL.md`.** Evidence: Context7 plugins-reference
  "Plugin Agent Configuration Markdown" + sub-agents "Supported frontmatter
  fields" + claude-directory `agents/`/`skills/` (2026-07-22). Steps: S1, S6.
- **C7 — Node v22.16.0 is available.** Evidence: `node --version` (this
  session). Steps: S4, S5, S12.
- **C8 — `${CLAUDE_PLUGIN_DATA}` = `~/.claude/plugins/data/{id}/`, per-user,
  update-surviving.** Evidence: Context7 plugins-reference "Persistent data
  directory"/"Environment variables" (2026-07-21). Steps: S7 (defect store).
- **C9 — Transcripts live per project at `~/.claude/projects/<sanitized-cwd>/
  *.jsonl` with typed `user` entries.** Evidence: direct read (2026-07-21) —
  two files, 216 and 10 `user` entries. Steps: S5.
- **C10 — `plugin.json` carries `version`; `installed_plugins.json` records
  version + `gitCommitSha` per install.** Evidence: direct read (2026-07-22).
  Steps: S9; D15 mechanism.
- **C11 — A workflow-dispatched agent can load a plugin skill via `Skill`.**
  Evidence: workflow probe run `wf_91f2a210-c0b` (2026-07-21) →
  `{skill_tool_available:true, load_succeeded:true}`. Steps: S6.
- **C12 — The Workflow API/determinism facts the orchestrator relies on**
  (`agent`/`parallel`/`pipeline`/`budget`/`args`/schema-forced returns;
  no `require`/`fs`/`Date`/`Math.random`; `scriptPath`; `resumeFromRunId`).
  Evidence: `skills/workflow-creator/references/api-reference.md` +
  `patterns.md` (vetted and imported this session) + the in-session Workflow
  tool contract. Steps: S7.
- **C13 — The workflow linter exists and runs.** Evidence:
  `skills/workflow-creator/scripts/validate-workflow.mjs` executed successfully
  on an example this session. Steps: S7 (T-A2a).
- **C-obs — Re-declaring an auto-discovered `hooks/hooks.json` in the manifest
  causes a duplicate-load error.** Evidence: observed live in this environment
  when agentboard's manifest referenced its own `hooks/hooks.json`
  (`/reload-plugins` reported the duplicate, 2026-07-20). Steps: S9; §8.
- **C14 — Claude Code namespaces MCP servers by source; same-named servers from
  different sources coexist without collision.** Evidence: observed in the
  current session — Context7 present as both `mcp__claude_ai_Context7__*` and
  `mcp__plugin_context7_context7__*`; Clear-Thought present as both
  `mcp__clear-thought__*` and `mcp__plugin_agentboard_clear-thought__*` — all
  live simultaneously (2026-07-22). Steps: S10; D-P6.

No claim the plan depends on lacks a read-level entry above. Search tools were
used only to locate; every entry cites the read/execution that observed the
fact.

## 12. Test specifications

- **T-U1 — ledger validator (unit).** *Behavior:* `validate-ledger.mjs` accepts
  a schema-valid ledger and rejects each schema violation (missing required
  field, wrong type, bad enum, non-monotonic `revision`). *Level:* unit (one
  module, public CLI contract). *Real/double:* all real — the script + a set of
  fixture ledger files; no double (the module is the subject; files are data).
  *Data:* one known-good ledger built to the schema, plus one file per
  violation class, each hand-authored to violate exactly one rule (forward-
  derived from the schema, not from the assertion). *Must NOT assert / fail
  condition:* must not assert on internal function calls; fails if a bad ledger
  exits 0 or a good ledger exits non-zero. *Technique:* equivalence
  partitioning over violation classes + boundary (revision monotonicity).
- **T-U2 — transcript reader (unit).** *Behavior:* given a marker and fixture
  transcripts, `extract-owner-turns.mjs` returns exactly the `user` turns after
  the marker, with context, and the correct advanced marker. *Level:* unit.
  *Real/double:* all real — script + fixture `.jsonl` files. *Data:* fixture
  transcripts with a known set of user turns at known positions; markers at the
  start, mid-file, and end. *Must NOT / fail:* must not assert on read order
  internals; fails if any post-marker user turn is missing, any pre-marker turn
  leaks, or the returned marker is wrong. *Technique:* boundary value (marker at
  first/middle/last line) + equivalence (single vs multi-file).
- **T-A1 — skills load (integration).** *Behavior:* with the plugin installed,
  all nine packaged skills' frontmatter parses and each is invocable. *Level:*
  integration (plugin loader + skill files). *Real/double:* real loader, real
  skill files. *Data:* the packaged skills from S1/S2. *Must NOT / fail:* fails
  if any skill (esp. repaired expert-spec/expert-review) does not load or its
  frontmatter lacks name/description.
- **T-A2 — structure & validators (integration).** (a) `expert-lifecycle.js`
  passes `validate-workflow.mjs`; (b) each agent frontmatter parses, `skills:`
  resolves to a packaged skill, tool allowlist matches D11, no CORE-ingest
  tool; (c) plugin-validator agent passes and components appear under the
  `expert-dev-tools:` namespace; (d) `.mcp.json` parses and declared servers
  start. *Level:* integration. *Real/double:* real validators/loaders. *Fail:*
  any validator non-zero, any allowlist mismatch, any missing namespace.
- **T-A3 — end-to-end (system).** *Behavior:* `/expert <toy task>` on the
  fixture runs the full lifecycle — spec produced, intent gate presented,
  post-approval phases advance through review loops to PASS, ground truth
  executed, closeout artifacts produced (report, STATUS.md, commit prepared, PR
  prepared, CORE draft presented). *Level:* system/E2E (few, high-value —
  Fowler). *Real/double:* real command, real workflow runtime, real agents;
  double only the toy task's external nothing (none). *Data:* the fixture
  project + toy task. *Must NOT / fail:* must not assert on internal dispatch
  counts; fails if any phase is skipped, the intent gate does not fire, or
  closeout runs before ground-truth PASS.
- **T-A4 — forced failures (system).** (a) planted out-of-plan file change →
  diff-vs-plan catches it and the phase does not PASS; (b) planted fabricated
  verification at a sampled index → spot re-run catches it and fails the phase;
  (c) seeded spec contradiction discovered at plan time → spec_traceable gate
  fires to the owner, no machine resolution; (d) reviewer pinned NEEDS_FIXES →
  round cap breached → non_convergence gate. *Level:* system. *Real/double:*
  real runtime; the forced-failure *agents* are not doubles of the system —
  they are real agent definitions supplying adversarial inputs (the system
  under test is the orchestrator, which runs real). *Data:* S11 plants. *Must
  NOT / fail:* each asserts the control fired *because of* the plant (remove the
  plant → control does not fire); fails if any control passes the planted defect
  through.
- **T-A5 — resume (system).** *Behavior:* a run killed mid-segment resumes from
  the ledger with no repeated completed phase. *Real/double:* real ledger +
  run journal. *Fail:* any completed phase re-executes (journal shows a repeat).
- **T-A6 — owner-language (integration).** *Behavior:* each gate's owner-facing
  text carries what-happened/options/recommendation and no unexplained jargon.
  *Fail:* a gate output that is a raw record or contains unexplained internal
  identifiers.
- **T-A7 — diagnosis quality (property over T-A4 runs).** *Behavior:* each A-4
  diagnosis names the planted defect (not a symptom restatement) and its
  correction draft would remove it; the A-4d escalation carries diagnosis +
  correction draft. *Fail:* a diagnosis whose root_cause is a symptom, or a
  correction that would not remove the planted defect.
- **T-A9 — cross-project + failed correction (system).** (a) a shared-machinery
  signature recorded while running the fixture in project X is visible running
  it in project Y — one occurrence each is a repeat; (b) a `corrected`
  signature recurring on version ≥ its fix version → `failed_correction`,
  escalates, no remediation dispatched (journal); (c) same signature on version
  < fix version → `stale_deployment`, no correction. *Real/double:* real
  `${CLAUDE_PLUGIN_DATA}` store; two real fixture project dirs. *Fail:* Y does
  not see X's signature; a failed correction re-enters the correction path; a
  stale deployment is misclassified as a failed correction.

No test asserts only on double interactions; no data is backward-fabricated
(the A-4b plant is forward-placed at a sampled index and the test proves the
control fires *because* of it, then that removing it stops the firing).

## 13. Risks

- **R1 — Orchestration tests cost model tokens.** No mock-agent injection
  exists for the Workflow runtime (D-P1), so T-A3/T-A4/T-A9 spend tokens per
  run. Bounded (small forced-failure set); the biggest single risk to test
  turnaround, not to correctness. Mitigate: keep the toy task minimal; reuse
  `resumeFromRunId` caching across iterations.
- **R2 — S7 is the hardest step and the highest blast radius.** A routing or
  gate defect mis-gates every future task. Mitigate: CP2 verifies a happy-path
  run before the command layers on; T-A4 forces each control.
- **R3 — The command tier is non-deterministic (architecture Limitation).** A
  confused main agent could mis-write the ledger. Mitigate: S4 validation +
  D9 hashing bound the damage; T-A5 proves resume integrity.
- **R4 — Retired.** The duplicate-MCP-declaration concern is resolved:
  same-named servers coexist namespaced by source (§11-C14, D-P6). No residual
  risk; T-A2d remains only as a routine smoke check.
- **R5 — Fixture realism.** A toy task too trivial exercises gates shallowly.
  Mitigate: the fixture task must reach every phase and force at least one
  real review round; T-A3 asserts phase coverage.

## 14. Question register

- **Q1 (bin-2, user-decision) — scope exclusions** (governance hooks,
  marketplace, non-chain lifecycles, source-skill edits). *Disposition:*
  approved by the owner in the spec (§2), carried into this plan's Scope; not
  re-opened. Closed.
- **Q2 (bin-1, engineering) — testability of inline orchestration logic.**
  *Disposition:* answered — two-tier architecture, no extracted copy (D-P1;
  §12). Closed.
- **Q3 (bin-1) — build ordering.** *Disposition:* topological order derived
  (S1→S12; D-P1 reasoning); §7 order + §9 checkpoints. Closed.
- **Q4 (bin-1) — safe unescape of the two broken skills.** *Disposition:*
  census proved zero at-risk backslashes; targeted metachar unescape (D-P3,
  S2, §11-C3). Closed.
- **Q5 (bin-1) — validator dependency.** *Disposition:* dependency-free
  hand-validation (D-P2). Closed.
- **Q6 (bin-1) — command vs skill for `/expert`.** *Disposition:* command,
  per D-P4 and architecture C2. Closed.
- **Q7 (bin-1, engineering) — duplicate MCP-server handling across plugins.**
  *Disposition:* answered by direct observation — Claude Code namespaces MCP
  servers by source and same-named servers coexist (§11-C14); declaring is
  safe (D-P6). Not a gap.
- **Q8 (bin-3, gap) — `expert-architecture` residual body escapes.**
  *Disposition:* the file loads (clean fence); its 13 cosmetic body escapes are
  outside R-1's load-repair scope; closed into Gaps (G1).

**Reconciliation sweep:** two passes performed. Pass 1 surfaced Q1–Q8. Pass 2
walked every step, decision, test spec, and the coverage table and added zero
new entries. Sweep complete; zero open bin-1/bin-2 entries; the two bin-3
entry (Q8) is in Gaps with attempt evidence; Q7 is answered by observation, not a gap.

## 15. Gaps acknowledged

- **G1 — `expert-architecture` body cosmetic escapes.** 13 backslash-escaped
  metacharacters remain in its body (§11-C4). Attempt: censused; confirmed the
  frontmatter fence is clean so the skill loads. Not repaired because R-1's
  mandate is "make skills load/discoverable," and rewriting a loading skill's
  body is an unrequested content change to the owner's file. Left verbatim; the
  owner may request a cosmetic pass separately. What would resolve it: an
  explicit owner instruction to normalize body markdown across all packaged
  skills.
No other gaps — every decision in this plan is grounded in a named standard
from §3, and every factual claim carries a §11 entry. (The former G2 —
cross-plugin MCP-server collision — is resolved by observation, not deferred;
see D-P6 and §11-C14.)

## 16. Post-completion

- Run the independent review (neutral subagent, mechanical inputs) against this
  plan — the lifecycle's own review gate — before the owner merges.
- `codegraph_diff_surface` is **not** applicable (no pre-existing exported
  surface is modified; the plugin adds files with no code dependents — §11-C1).
  The equivalent completeness check is T-A2c: the plugin-validator confirms the
  discovered component set matches exactly the components S1–S10 create, with
  nothing extra and nothing missing.
- Follow-up this plan may create: G1 (cosmetic skill normalization), if the
  owner requests it. (The former G2 is resolved — D-P6 — and creates no
  follow-up.)
- Nothing deferred to a later version. Out-of-band governance hooks are out of
  scope by owner decision (spec §2), not a pending item.
