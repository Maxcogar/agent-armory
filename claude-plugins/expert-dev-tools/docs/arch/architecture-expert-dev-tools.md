# Architecture — expert-dev-tools plugin

**Input spec:** `claude-plugins/expert-dev-tools/docs/specs/spec-expert-dev-tools.md` (owner-approved 2026-07-20)
**Status:** Draft — pending delivery-gate confirmation (see Status section)

## Goal — what this architecture serves

Turn the approved spec's twelve lifecycle functions into an implementable
three-part system — a thin `/expert` command, one deterministic workflow
script, and a set of typed agents — such that a planner can write file-level
steps without making a single architectural call inline. Correct means: every
owner gate is a structural run boundary that cannot be skipped, every quality
control operates on observed data rather than agent self-report, and any
session can resume from durable state without repeating paid work. The
local-optimum trap that threatens it most directly: pushing orchestration
logic into prose (command instructions, agent prompts) where it becomes
advisory — the entire point is that gates and routing live in deterministic
code.

## Scope

**In scope:** component decomposition, contracts (agent output schemas, ledger
schema, workflow args/return protocol, gate report protocol), control flow for
all twelve spec functions, packaging layout, security controls mapped to
threats, testing architecture for the spec's acceptance criteria.

**Plan and implementation scope (not architecture's to decide, so not
deferred):** the exact JSON Schema syntax for the ledger fields named above,
the prose of each agent's system prompt, the fixture project's content, and
per-file implementation order. Architecture fixes the design contracts — the
component boundaries, the ledger's fields and their meaning, the agent output
schemas' shape. Rendering those into exact syntax, prompt prose, and build
order is the plan's and implementer's normal work, carrying no cross-component
design consequence. Naming them here is a scope boundary, not a punt: there is
nothing architecture owed here and held back.

**Out of scope:** governance hooks (spec §2), marketplace publication,
orchestration of expert-mcp-overhaul/frontend-standards lifecycles (spec §2),
modification of source skills in `skills/Expert-Skills/` (spec R-1).

## Components and structure

```
claude-plugins/expert-dev-tools/
├── .claude-plugin/plugin.json      C1  manifest
├── commands/expert.md              C2  /expert — the operator
├── workflows/expert-lifecycle.js   C3  the orchestrator (NOT auto-discovered;
│                                       invoked via scriptPath — see D10)
├── agents/                         C4  typed phase agents
│   ├── expert-spec-writer.md
│   ├── expert-architect.md
│   ├── expert-planner.md
│   ├── expert-implementer.md
│   ├── expert-reviewer.md
│   ├── expert-verifier.md              (spot re-runs + diff-vs-plan + reconciliation)
│   ├── expert-acceptance.md            (ground truth)
│   ├── expert-diagnostician.md         (F-13: root cause + correction draft)
│   └── expert-closeout.md
├── skills/                         C5  nine Expert skills (repaired copies, R-1)
├── scripts/extract-owner-turns.mjs C8  transcript reader — owner turns since a marker
├── .mcp.json                       C6  Context7 + Clear Thought declarations
├── scripts/ledger.schema.json      C7a ledger JSON Schema (single source of truth for ledger shape)
├── scripts/validate-ledger.mjs     C7  ledger validator — validates against C7a (used by C2 and tests)
└── docs/{specs,arch,plans}/            lifecycle artifacts for the plugin itself
```

**C2 — `/expert` command (the operator).** Sole owner of IO and owner-facing
language. Per invocation: (1) F-2 preflight — required MCPs answer, ledger
valid (C7), repo workable; (2) read + hash-check the ledger (D9); (3) invoke
`Workflow({scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/expert-lifecycle.js",
args: <ledger snapshot + task input>})`; (4) receive the structured
gate/completion report; (5) write the ledger (single writer, D3), regenerate
STATUS.md; (6) present the gate in plain language (F-9) or report completion.
The command contains no lifecycle logic — it cannot decide to skip a gate
because it never routes phases.

**C3 — `expert-lifecycle.js` (the orchestrator).** One script, one invocation
per segment (D2). Reads state exclusively from `args`; owns intake routing
(F-1), context-package assembly (F-3), phase dispatch (F-4), review-loop gates
with round caps (F-5), quality enforcement dispatches (F-6), amendment
re-validation ordering (F-8), budget capture via `budget.spent()` per phase
(F-11), and agent-failure policy (F-12: one retry on null, then structured
escalation). Every return value is a `SEGMENT_REPORT` (protocol below). No
filesystem, no Date, no randomness — per the Workflow determinism contract.

**C4 — agents.** Each phase agent declares its Expert skill in the agent
definition's `skills` preload field, so the skill is loaded into its context
at launch deterministically (documented AgentDefinition behavior; the Skill
tool remains available for on-demand loads and is verified working in
subagents — see D11 premise). Each returns a schema-forced structured output.
Load-bearing schema fields:

- All agents: `status: "completed" | "halted"`, `halt` (typed halt object),
  `artifact_path`, `evidence[]` `{claim_type, tool, citation, result}`.
- expert-implementer: adds `stop_report {category, step, asserted, observed,
  options, recommendation}` (mirrors the skill's STOP REPORT verbatim),
  `steps_completed[]`, `files_changed[]`.
- expert-reviewer: `verdict: "PASS" | "NEEDS_FIXES"`, `findings[]`
  `{classification, standard, premise_evidence, location}`, `round`,
  `lens`. No other verdict values exist in the schema — the middle-verdict
  ban is a type, not an instruction.
- expert-acceptance: `criteria[]` `{criterion_id, method, action, observed,
  verdict, evidence}` where `method` is an enum excluding any
  document-citation value (D7).
- expert-verifier: `checks[]` `{cited_claim, re_execution, match: boolean}`.
- expert-diagnostician: `diagnosis {problem, evidence[], root_cause,
  correction_draft {target_artifact, change, why_it_removes_root_cause},
  classification: "machine_applicable" | "owner_owned", blast_radius}`.
  Read-only tools plus run-journal access; it changes nothing itself. When
  invoked in feedback-sweep mode it additionally returns
  `feedback_dispositions[] {signature, occurrences, verdict:
  "course_correction" | "systemic_defect", responsible_component}`.
- expert-closeout: `report_path, status_path, commit, pr_url, core_draft`.

**Data flow.** Artifacts stay at the skills' own locations (`docs/specs/`,
`docs/arch/`, `docs/plans/` in the target project). The ledger at
`.claude/expert/ledger.json` (spec D-6, locked) holds: `revision` (monotonic),
`task`, `phase`, `artifact_index[]` `{role, path, sha256, approved_by_owner,
approval_segment}`, `gate_history[]` `{gate, round, verdict, findings_count,
tokens}`, `amendments[]`, `escalations[]`, `budget`. STATUS.md is generated
from the ledger by C2 every segment — never hand-maintained.

**Failure router (F-13).** All non-routine failure classes — round-cap
breach, spot-check fabrication catch, ground-truth criterion failure,
ENVIRONMENT-BLOCKED, ledger-integrity halt, blast-radius stop, post-amendment
chain incoherence — flow through one router in C3: dispatch
expert-diagnostician with the failure record + ledger snapshot + journal
excerpt → receive DIAGNOSIS → `machine_applicable` routes into the standard
amend → review path automatically (the correction draft becomes the
remediation input); `owner_owned` attaches the diagnosis to the escalation.
Routine review findings bypass the router — the review loop is its own
diagnosis-and-remediation cycle, and double-diagnosing it would add a dispatch
per round for no coverage gain.

**Correction doctrine (binding rules the router enforces on every correction):**
1. *No informal application.* Every correction — machine-applicable included —
   becomes a remediation plan under expert-plan discipline, is implemented
   under expert-implement, and re-enters review to PASS at zero findings.
   There is no lower-bar "quick fix" tier.
2. *Fix where the cause lives.* The correction targets the artifact containing
   the root cause (`correction_draft.target_artifact`); artifacts downstream
   of it are re-validated per F-8, never patched around. Code hacks
   compensating for a wrong plan, or plan edits compensating for a wrong
   architecture decision, are classified as misdirected corrections and
   rejected by the router.
3. *Never weaken the ruler.* A correction may not relax the mechanism that
   caught the failure: tests, acceptance criteria, output schemas, gate
   thresholds, round caps, and verification commands are measurement
   instruments, not fix targets. Any correction draft whose target is a
   verification mechanism or an acceptance criterion is automatically
   `owner_owned` and spec-traceable — the machine can never decide the test
   was too strict.
4. *Prove the kill.* Post-correction verification must re-execute the exact
   originally-failing check (the criterion, the spot re-run, the reconciliation)
   and show it passing — in addition to the standard review. A correction is
   closed against the original failure, not against a fresh green run.
5. *Recurrence tripwire.* The ledger records each failure's signature
   (class + location + criterion). The same signature recurring after its
   correction was applied means the first diagnosis was shallow — the router
   does not re-enter the correction path; it escalates with both diagnoses
   side by side. One retry of a diagnosis is a loop; the doctrine forbids it.

**C8 — transcript reader (F-14).** A plain script the feedback-sweep agent
runs: given the project's transcript directory and a read-position marker
`{session_file, line}`, it streams the JSONL transcripts, extracts `type:
"user"` entries after the marker with a bounded window of surrounding context,
and emits them plus the new marker. No hook, no capture step, nothing in the
owner's prompt path. Verified 2026-07-21: transcripts exist per project at
`~/.claude/projects/<sanitized-cwd>/*.jsonl` (this project: 2 sessions, 893
and 71 lines, 216 and 10 typed `user` entries — read directly).

**Defect history — two stores, by blast radius (D15).** Signatures whose
`responsible_component` is the plugin's own shared machinery (an agent
definition, a packaged skill, the command, routing logic) are recorded in the
**plugin-scoped store** at `${CLAUDE_PLUGIN_DATA}/defect-history.json`
(= `~/.claude/plugins/data/expert-dev-tools-<marketplace>/`, per-user,
surviving plugin updates — verified 2026-07-21); signatures scoped to one
project's work are recorded in that project's ledger. Read-position markers
are always per project (they index that project's transcripts). Each record:
`{signature, description, responsible_component, occurrences[] {project,
session_file, date, plugin_version}, state: "open" | "corrected",
correction {artifact, change, fixed_in_version, commit} | null}`. No
transcript text is copied into either store.

**Machinery corrections are versioned source changes (D15).** When the
`responsible_component` is one of the plugin's own files, the correction is
not applied to the running installed copy (the cache under
`~/.claude/plugins/cache/…`, which any update replaces). It is applied to the
plugin **source** in `claude-plugins/expert-dev-tools/`, through the same
reviewed amend path as any change, and lands as a committed change with a
bumped `plugin.json` version. The signature is recorded `corrected` with that
`fixed_in_version` and `commit`. The fix therefore travels *with* the plugin:
a later update to a version ≥ `fixed_in_version` carries it forward by
definition — updates cannot silently drop it, because it is part of what is
being updated.

**Feedback sweep.** At each segment boundary (never mid-phase), C3 dispatches
expert-diagnostician in feedback-sweep mode; the agent runs C8, reads the new
owner turns *with their surrounding context*, and identifies statements where
the owner flagged a problem — most turns are not complaints and are discarded
here. Surviving statements are clustered by signature against **both** stores,
so a repeat is detected across sessions, across projects (for shared-machinery
defects), and across differing phrasings. Verdicts:

- `course_correction` — first occurrence of the signature. Recorded `open`,
  no action.
- `systemic_defect` — second or later occurrence while `open`. Enters the
  F-13 pipeline with `responsible_component` as the diagnosis target.
- `failed_correction` — an occurrence of a `corrected` signature **on a
  plugin version ≥ its `fixed_in_version`** (the running plugin already
  contains the fix, yet the defect recurred). Does **not** enter the
  correction path. Escalates immediately with the original diagnosis, the
  correction that was applied, and the new evidence — a fix that did not hold.
- `stale_deployment` — an occurrence of a `corrected` signature on a plugin
  version **<** its `fixed_in_version` (the fix exists but this install
  predates it). Not a failed correction and not a new defect: the disposition
  is "update the plugin to ≥ `fixed_in_version`," surfaced once, no
  correction dispatched. This is why occurrences carry `plugin_version`.

Corrections targeting the plugin's own components are `owner_owned` by
classification, so they surface attached to a gate the owner was already
receiving rather than as a new interruption; on owner approval and once the
source change is committed with its version bump, C2 records the signature
`corrected` with `fixed_in_version` and `commit`. C2 is the sole writer of both
stores, at ledger-write time — same single-writer discipline as D3.

**SEGMENT_REPORT protocol (C3 → C2).** `{outcome: "owner_gate" | "complete" |
"failed", gate?: {type: intent | spec_traceable | business | risk_override |
non_convergence | core_approval, what_happened, diagnosis?, correction_draft?,
options[], recommendation},
ledger_delta: {phase, artifacts[], gate_history[], amendments[], budget},
completion?: {report_path, pr_url, core_draft}}`. The six gate types are
exactly the spec §3.4 escalation list; the script has no other path to the
owner.

**Control flow per segment:** route from `args.phase` → dispatch phase agent →
review loop (fresh reviewer per round; single lens for document gates;
three-lens panel — correctness, security, faithfulness-to-plan — on the round
that would grant implementation PASS; cap = 5 rounds, breach → non_convergence
gate) → spot re-runs on sampled evidence (deterministic index stride,
`max(2, ceil(0.1·n))` per phase) → next phase, until an owner gate fires or
closeout completes. Implementation additionally passes the diff-vs-plan check
and, before closeout, whole-chain reconciliation (both dispatched to
expert-verifier with mechanical inputs).

## Quality characteristics addressed (ISO/IEC 25010:2023)

| Characteristic | Spec source | How advanced | Decisions |
|---|---|---|---|
| Functional suitability | F-1..F-12 | Every function has exactly one owning component (synthesis trace, Design decisions) | D1, D2 |
| Reliability — recoverability | §8 Resumability | Ledger + segment topology + resumeFromRunId for intra-segment crashes | D2, D3, D9 |
| Reliability — fault tolerance | F-13 (spec D-10) | Non-routine failures are diagnosed and corrected through the reviewed amend path instead of halting undiagnosed or retrying blind | D13 |
| Security — integrity | §3.4, threat model | Observed-data controls, single-writer state, hash anchoring, draft-only CORE | D3, D5, D7, D8, D9, T1–T3 controls |
| Maintainability — modularity | §5 components | Three tiers with single responsibilities; agents replaceable per phase | D1, D11 |
| Usability — owner-legibility | §8, F-9 | All owner-facing text produced by C2 from typed gate reports; STATUS.md generated | D1, D12 |
| Usability — freedom from interruption | F-14 (spec D-11) | Nothing runs in the owner's prompt path at all; detection reads existing transcripts at segment boundaries only | D14 |
| Performance efficiency — resource use | F-11, §8 | budget.spent() captured per phase into ledger; caps escalate instead of burn | D2 |
| Portability | not required by spec | Not addressed: single-owner tool on declared MCP stack; spec scopes portability out (§2) | — |

## Design decisions

**Knowledge-state baseline** (metacognitivemonitoring `arch-expert-dev-tools-001`):
proficient domain knowledge; four uncertainties flagged — plugin workflow
shipping, in-workflow `Skill()` invocation, args handoff, agentboard-precedent
status. All four resolved during Phases 4–6 (see D10, D11, premise entries).
Biases monitored: pattern-cloning from agentboard's pipeline; recency bias
toward workflow-creator examples. Mitigation applied: every structural element
below cites a spec requirement, not a precedent (trap audit, Status section).

**Inherited locked decisions (spec §6, honored, not re-derived):** D-1
workflow-centric orchestration; D-2 implementer as dispatched agent; D-3
intent gate; D-4 closeout ownership with draft-only CORE; D-5 STOP standing
policy; D-6 ledger location; D-7 verbatim skill packaging + R-1 repairs; D-8
MCP split; D-9 review-loop engine. Architecture decisions below carry
implementation-shaping choices the spec left open.

---

**D1 — Three-tier decomposition: thin command / deterministic orchestrator / typed agents.**
(1) *Decision:* C2 owns IO + owner language; C3 owns all routing and gate
logic; C4 agents own all work and all filesystem effects. Applies to every
function F-1..F-12 (ownership map in Components).
(2) *Standard:* Single Responsibility Principle (SOLID) applied at component
level; separation of policy (C3) from mechanism (C4) from presentation (C2).
(3) *Why here:* the system's central failure mode is orchestration logic
living where it is advisory (prose) or unauditable (agent context). SRP forces
gates into the one tier that is deterministic and diffable.
(4) *NOT:* a "guided procedure" the main agent follows (rejected — that is the
pre-plugin status quo whose failure the spec documents §1); NOT logic split
across six per-phase scripts (rejected — decisionframework hd1-run-topology,
option B scored 0.68 vs 0.895: routing smears across scripts and command).
(5) *Premise verification:* workflow scripts have no fs/Node access — Workflow
tool contract (in-session, corroborated by `skills/workflow-creator/references/api-reference.md`);
plugins may ship commands/agents/scripts — Context7 `/websites/code_claude`
plugins-reference, 2026-07-20.

**D2 — Segment-per-invocation run topology (decisionframework hd1-run-topology).**
(1) One `expert-lifecycle.js`; each invocation receives the ledger snapshot as
`args`, runs from the current phase through all machine gates to the next
owner gate or completion, returns a SEGMENT_REPORT. `resumeFromRunId` only for
intra-segment crash recovery.
(2) *Standard:* state-machine design with persisted checkpoints (first
principles via multi-criteria analysis; no formal external standard governs
run topology — the mentalmodel articulation: goal = gates that cannot be run
through; shortcut = one long run with early exits, which satisfies "looks
orchestrated" but couples gate integrity to cache alignment; chosen path makes
each owner decision a hard process boundary).
(3) *Why here:* owner gates are the one non-negotiable correctness property
(spec §3.2); segment topology makes them unbypassable by construction.
(4) *NOT:* option A (whole-lifecycle resume — cache replay across gates risks
gate skips, cross-session resume degrades); NOT option B (per-phase scripts —
moves machine-gate control into the non-deterministic command). Full
multi-criteria matrix: scores A 0.71 / B 0.68 / C 0.895 on owner-gate
correctness (.30), resume economics (.20), logic cohesion (.25), determinism
compliance (.15), escalation clarity (.10).
(5) *Premise:* args passes live JSON values (Workflow contract; corrected
preview-era claim documented in `skills/workflow-creator/SKILL.md` — vetted
2026-07-20); no factual premise about existing repo source — greenfield.

**D3 — Single-writer ledger: only the /expert command writes state.**
(1) Agents never touch `.claude/expert/`; C3 cannot (no fs); C2 writes once
per segment from the SEGMENT_REPORT's ledger_delta.
(2) *Standard:* least privilege + single-writer principle (OWASP ASVS V1
architecture: enforced trust boundaries); sequentialthinking trace thought 1.
(3) *Why here:* an agent recording its own compliance evidence is self-grading
— the trust failure F-6 exists to eliminate. One writer makes every state
transition attributable.
(4) *NOT:* per-agent ledger appends (self-grading, write races); NOT a
dedicated recorder agent (adds a dispatch per transition and still yields
mid-segment partial states the command must reconcile — complexity without an
integrity gain over segment-granular writes, since the workflow journal
already records intra-segment detail).
(5) *Premise:* workflow journal + resumeFromRunId cover intra-segment
granularity — Workflow tool contract (journal.jsonl per run); no repo-source
premise.

**D4 — Every agent output is schema-forced; free text is a dispatch defect.**
(1) All C4 dispatches pass `schema`; C3 logic reads typed fields only.
(2) *Standard:* design-by-contract; the Workflow tool's schema option
(AJV-validated with retry) is the platform's contract mechanism.
(3) *Why here:* F-4 requires outputs the orchestrator can act on; parsing
prose in deterministic code is a contradiction in terms.
(4) *NOT:* prompt-instructed JSON without schema enforcement (no validation,
no retry — the platform provides enforcement, refusing it is unforced error);
NOT post-hoc parsing by another agent (adds a model inference where a
validator suffices).
(5) *Premise:* schema option forces validated objects with retry — Workflow
contract + workflow-creator api-reference (read 2026-07-20).

**D5 — Reviewer blinding is structural: fixed dispatch template + typed verdict.**
(1) expert-reviewer dispatches are built by string concatenation from ledger
fields (artifact paths, upstream paths, round, lens) — no upstream agent prose
can reach the reviewer; verdict enum is `PASS | NEEDS_FIXES` only; document
gates run one reviewer per round; the implementation-PASS round is a
three-lens parallel panel (correctness / security / faithfulness-to-plan), all
lenses must PASS.
(2) *Standard:* review independence per IEEE 1028 (inspections require
independence of the producer); expert-review's own middle-verdict ban and
expert-implement's mechanical-facts-only handoff rule, made type-level.
(3) *Why here:* the spec's §3.3 requires blinded, identical-shape dispatch;
making it code removes the possibility of steering language drifting in.
(4) *NOT:* letting the implementer compose the review dispatch (violates the
neutrality rule its own skill states); NOT N identical redundant reviewers on
the final round (redundancy shares blind spots; lens diversity catches failure
modes redundancy cannot — perspective-diverse verify pattern).
(5) *Premise:* expert-review defines the binary verdict and anti-exhaustion
rules — read `skills/Expert-Skills/expert-review/SKILL.md` (verdict sections,
lines 513–545) 2026-07-20. Round cap = 5 (owner's empirical 3–5 rounds, spec
D-9), configurable via `.claude/expert-dev-tools.local.md` per the documented
plugin-settings pattern.

**D6 — STOP REPORT routing table (deterministic, two escalation exits).**
(1) `PREMISE-FALSE`, `BLAST-RADIUS-EXCEEDS-PLAN` → auto-route to remediation
planning → plan review loop → resume implementation. `ENVIRONMENT-BLOCKED` →
one preflight retry → owner gate. `HARD-RULE-CONFLICT` → owner gate always.
Override (option B) exists only inside an owner gate.
(2) *Standard:* fail-safe defaults (fail toward the plan-amendment path, never
toward risk acceptance) — OWASP secure-design principle; spec D-5 locked.
(3) *Why here:* converts expert-implement's human-facing A/B/C protocol into
routing a script can execute while preserving its semantics exactly
(sequentialthinking thought 2).
(4) *NOT:* auto-retry of the failed step (a STOP is evidence-backed by the
skill's own self-check; retrying without amendment re-executes a false
premise); NOT escalating every STOP (defeats zero-touch for the ~majority that
are mechanical plan amendments).
(5) *Premise:* the four categories and their semantics — read
`skills/Expert-Skills/expert-implement/SKILL.md` Step 4, 2026-07-20.

**D7 — Ground-truth acceptance: observed-evidence-only schema.**
(1) expert-acceptance executes each spec acceptance criterion against the
running system; `method` enum excludes document citation; C3 rejects entries
without observed output.
(2) *Standard:* dynamic testing over static inspection for behavioral claims —
ISO/IEC/IEEE 29119 test-execution levels; the owner's own bar ("works ≠
correct": correct = right answer against ground truth or unmistakable
failure).
(3) *Why here:* document-consistency gates structurally cannot catch
plausible-but-wrong behavior (spec F-6, ground-truth clause).
(4) *NOT:* trusting the implementer's own verification runs (producer
evidence; independence lost); NOT re-reviewing documents harder (category
error — no amount of document review observes behavior).
(5) *Premise:* no factual premises — pure design choice.

**D8 — Deterministic index-stride sampling for spot re-runs.**
(1) Sample `max(2, ceil(0.1·n))` cited verifications per phase output at fixed
stride; expert-verifier re-executes each and compares.
(2) *Standard:* audit sampling (verification by re-performance); determinism
constraint of the Workflow runtime (Math.random banned).
(3) *Why here:* full re-verification doubles phase cost; zero re-verification
is the fabrication hole; a deterministic sample the agent cannot predict-around
(stride computed from ledger revision, unknown at authoring time) is the
budget-bounded middle.
(4) *NOT:* random sampling (banned by runtime; also unreproducible on resume);
NOT reviewer-chosen samples (reintroduces judgment where the point is
mechanism).
(5) *Premise:* Math.random/Date banned in scripts — Workflow contract +
workflow-creator gotchas (read 2026-07-20).

**D9 — Hash-anchored artifact index drives both amendments and integrity.**
(1) C2 hashes every registered artifact at write; at segment start it
re-hashes: mismatch ⇒ artifact marked amended ⇒ C3 re-validates all downstream
gates in dependency order; spec-hash changes raise the spec_traceable owner
gate; approvals are invalidated when their artifact's hash drifts.
(2) *Standard:* content-addressed integrity (hash-anchored consistency);
threat model T3 controls.
(3) *Why here:* one mechanism serves F-8 (amendment propagation) and T3
(tamper/staleness) — tampering becomes indistinguishable from amendment and is
handled by the same re-validation, adding no new machinery.
(4) *NOT:* mtime-based change detection (misses content-identical touches and
is trivially wrong across git operations); NOT trusting ledger status fields
over disk reality (T3's exact failure).
(5) *Premise:* no repo-source premises — pure design choice grounded in T3.

**D10 — Workflow ships in the plugin; invoked by scriptPath, not auto-discovery.**
(1) `workflows/expert-lifecycle.js` inside the plugin; C2 invokes
`Workflow({scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/expert-lifecycle.js"})`.
(2) *Standard:* platform-documented mechanism (`${CLAUDE_PLUGIN_ROOT}` for
plugin-bundled files).
(3) *Why here:* verified that plugins have NO workflows auto-discovery — the
documented plugin layout (skills/commands/agents/hooks/bin/scripts) contains
no workflows/; `.claude/workflows/` is project/personal only. scriptPath is
the one documented path that keeps the script versioned inside the plugin.
(4) *NOT:* install-step copying into the project's `.claude/workflows/`
(creates drift between plugin version and copied script; violates the spec's
no-template-bootstrap standing rule for project trees); NOT inlining the
script into the command markdown (unversionable, unlintable).
(5) *Premise:* plugin directory reference and Workflow input schema — Context7
`/websites/code_claude` (plugins-reference; agent-sdk/typescript WorkflowInput)
queried 2026-07-20.

**D11 — Phase agents are plugin agent definitions dispatched via agentType.**
(1) Each C4 agent is `agents/*.md` with tool allowlists scoped to its phase
(reviewer/verifier: read-only tools + Skill; implementer: full edit tools;
closeout: git via Bash — and no CORE ingest tool anywhere, T2 control);
C3 dispatches with `agent(prompt, {agentType, schema})`.
(2) *Standard:* least privilege per agent (ASVS V1 trust boundaries);
platform-documented plugin agents.
(3) *Why here:* tool scoping turns "the reviewer is read-only" and "no agent
can ingest memory" from instructions into capability boundaries.
(4) *NOT:* generic workflow agents differentiated only by prompt (no
capability enforcement); NOT the agentboard pipeline's agents (different
problem — board/card orchestration — and different pattern; fails both family
criteria, so it is reference material, not precedent; no Inheritance section
exists in this document for that reason).
(5) *Premise:* plugin `agents/` documented (Context7, 2026-07-20); `agentType`
option in Workflow contract; skill access in subagents verified two ways
(2026-07-20): Claude Code features-overview states subagents "can still
discover and invoke unlisted project, user, and plugin skills using the Skill
tool," and AgentDefinition documents a `skills` preload field (Context7
`/websites/code_claude`); confirmed empirically by a live probe subagent that
invoked `Skill(agentboard:expert-standards)` successfully in this environment.

**D13 — Diagnosis precedes routing for every non-routine failure (spec D-10, F-13).**
(1) One failure router in C3 (component section) sends all seven non-routine
failure classes through expert-diagnostician before any routing decision;
escalations 2–5 carry `diagnosis` + `correction_draft`; machine-applicable
corrections feed the amend → review path directly.
(2) *Standard:* root-cause analysis before corrective action (systematic
debugging discipline: diagnose before fixing — the same rule the owner's
systematic-debugging skill enforces for humans and agents; ISO 9001-family
corrective-action logic: nonconformity → cause analysis → correction).
(3) *Why here:* the owner cannot and will not diagnose failures ("go figure
it out" is the standing response); an escalation without a diagnosis
delegates root-cause work to the least-positioned participant. Symmetrically,
auto-routing a fix *without* diagnosis re-runs the failure — A/B/C history:
retrying non-converging loops without asking why they don't converge.
(4) *NOT:* diagnosing routine review findings (the review loop already pairs
findings with remediation planning; double-diagnosis adds cost, no coverage);
NOT letting the diagnostician apply its own correction (diagnosis and change
execution stay separated — the correction goes through the same reviewed
amend path as any other change, preserving D5 independence); NOT free-text
incident reports (the DIAGNOSIS schema forces root_cause and a correction
draft that names its target artifact — a diagnosis that can't say what to
change hasn't found the cause).
(5) *Premise verification:* no factual premises about existing source — pure
design choice grounded in spec D-10 (owner-directed 2026-07-21) and threat
model T1/T3 failure classes.

**D14 — Repeat detection reads the existing transcript record; no capture layer (spec D-11, F-14).**
(1) The feedback sweep reads the project's session transcripts from a
persisted `{session_file, line}` marker via C8, with surrounding context;
signatures accumulate in the ledger so repeats are detected across sessions;
≥2 occurrences become systemic defects in the F-13 pipeline. Nothing runs in
the owner's prompt path.
(2) *Standard:* do not duplicate a system of record (single source of truth).
Transcripts are the authoritative, durable, per-project record of what the
owner said; a parallel store is a second copy that can diverge and must be
synchronized.
(3) *Why here:* the requirement is cross-session repeat *detection*, not
storage — and the data already exists on disk, permanently, with the context
that makes clustering accurate. Reading it satisfies the requirement with one
script and a marker instead of a hook, a register file, and a
capture-to-processing contract.
(4) *NOT:* a `UserPromptSubmit` capture hook writing a feedback register
(rejected on review — it produces a strictly poorer copy of the transcript:
isolated statements without the surrounding exchange, plus a component and a
sync burden, for zero information gain); NOT a blocking or prompting hook
(that IS the interruption the owner forbade); NOT mid-phase processing
(interrupts the work); NOT relying on the agent to notice repetition from its
own context (session-scoped and memory-based — precisely the failure this
exists to fix, since the owner's evidence is repeats that survive across
sessions); NOT auto-applying corrections to the plugin's own components
(self-modifying machinery without owner sight-line; classification forces
`owner_owned`).
(5) *Premise verification:* transcripts are stored per project as JSONL with
typed `user` entries — read directly 2026-07-21 at
`C:\Users\maxco\.claude\projects\C--Users-maxco-Documents-agent-armory\`:
two session files (893 lines / 216 user entries; 71 lines / 10 user entries),
parsed successfully. Transcript retention is governed by
`cleanupPeriodDays` (default 30, settings reference) — see Limitations.

**D15 — Defect history is scoped to the blast radius of the defect, and carries correction state (spec D-11/F-14).**
(1) Shared-machinery signatures live in `${CLAUDE_PLUGIN_DATA}`
(cross-project, update-surviving); project-work signatures live in the
project ledger; every signature carries `state` and, once fixed, its
`correction` with the `fixed_in_version` the fix landed in. Machinery
corrections are applied to the plugin *source* and versioned — never to the
replaceable cache copy — so an update carries the fix forward rather than
dropping it. A recurrence is classified by version: `failed_correction` when
the running version already contains the fix (the fix did not hold),
`stale_deployment` when it predates the fix (update needed). Both are barred
from the automatic correction path.
(2) *Standard:* state co-located with the scope it describes (data locality
to blast radius); corrective-action effectiveness review — ISO 9001 §10.2
requires reviewing whether a correction actually eliminated the
nonconformity, which is precisely what a post-correction recurrence answers
in the negative; the correction doctrine's own recurrence tripwire (rule 5),
here extended from pipeline failures to owner feedback.
(3) *Why here:* the defects most worth catching live in machinery shared by
every project, so a per-project history would require the owner to hit the
same defect twice *per project* before detection — reproducing the failure
the feature exists to remove. And a recurrence after a fix is categorically
different from a repeat: retrying the correction path would re-apply thinking
already proven insufficient.
(4) *NOT:* one global store for everything (project-scoped complaints would
leak across unrelated projects and pollute clustering); NOT per-project only
(the gap above); NOT treating a post-correction recurrence as just another
occurrence (that is the auto-retry loop the doctrine forbids); NOT storing
transcript text in either store (duplicating the record — the mistake already
corrected in D14; signatures and pointers only).
(5) *Premise verification:* `${CLAUDE_PLUGIN_DATA}` resolves to
`~/.claude/plugins/data/{plugin-id}/`, is per-user, and persists across
plugin updates — Context7 `/websites/code_claude` plugins-reference
("Persistent data directory", "Environment variables"), queried 2026-07-21.

**D12 — STATUS.md generated, never authored.**
(1) C2 renders STATUS.md from the ledger each segment: phase, gate history,
verdicts, open escalations, budget, next action.
(2) *Standard:* single source of truth — derived views are regenerated, not
maintained (DRY applied to state).
(3) *Why here:* satisfies the repo's mandatory handoff discipline as a
byproduct (spec F-7) and keeps human-readable state incapable of drifting from
machine state.
(4) *NOT:* hand-edited status docs (the drift they suffer is documented in the
owner's own repo history); NOT exposing the raw ledger as the human view
(owner-legibility NFR).
(5) *Premise:* no factual premises — pure design choice.

**Sequentialthinking attestation (Phase 8):** applied to HD2–HD5 (5-thought
trace; conclusions in D3, D5, D6, D7/D8 and the F-1..F-12 ownership synthesis).
decisionframework applied to HD1 (D2). No other decisions met the trigger
criteria — remaining choices had one clear correct approach under the named
standards (recorded briefly above as parts 4 of each decision).

**Codebase survey record (Phases 3–4).** codegraph_scan force:true on repo
root: 490 code files, 549 doc files, graph built 2026-07-20; codegraph_get_stats:
all coupling hotspots in unrelated subsystems (PowerMill-MCP, archived ctxpack,
codegraph-mcp) — the plugin's footprint imports no existing code file; blast
radius into existing source: none. rag_search queries and result counts:
"expert lifecycle spec architecture plan review skills" (3 constraints, 3 code) —
surfaced `hooks/plan-delivery-gate.py` and `hooks/pre-planning-advisory.py`
(existing plan-discretion enforcement, treated as prior art for gate semantics,
not cloned); "lifecycle orchestration phase state machine gates enforcement…"
(5 constraints, 5 code) — surfaced the ARCHIVED ctxpack agent-harness
GatePhase machine (owner-declared dead; deliberately not inherited);
"durable state ledger session handoff resume…" (5 constraints, 5 code) —
surfaced ctxpack session-state JSON and `mcp-servers/agents` DispatchResult
typing as reference shapes; "neutral review dispatch subagent verdict…"
(3 constraints, 3 code) — surfaced ctxpack review-finding `passed: boolean`
gate shape. No same-family architecture exists (agentboard pipeline fails both
family criteria — different problem, different pattern), so no Inheritance
section appears in this document.

**Pre-delivery multi-perspective review (Gate A, collaborativereasoning
`gateA-expert-dev-tools`):** planner surfaced one gap — the ledger JSON Schema
artifact had no named location; fixed (C7a `scripts/ledger.schema.json`).
Reviewer and stakeholder perspectives found no further gaps; the Skill()-probe
limitation stands flagged with its fallback. All three perspectives pass
post-fix.

## Threat model

Structured per scientificmethod; full inquiry records: T1
`threat-T1-gate-gaming`, T2 `threat-T2-durable-writes`, T3
`threat-T3-ledger-trust` (2026-07-20).

| Threat | Attacker/failure | Target | Blast radius | Controls (decisions) |
|---|---|---|---|---|
| T1 gate gaming | Lazy/fallible phase agents asserting unearned compliance | Gate verdicts | Defective work certified PASS; every downstream task inherits it | D4 typed evidence; D8 spot re-runs; diff-vs-plan (F-6); D5 blinded multi-lens review; D3 no self-recorded state |
| T2 durable-write contamination | Erroneous output reaching git/CORE | Repository, knowledge graph | Poisoned main branch; corrupted memory in all future sessions | State-machine ordering (closeout unreachable pre-PASS); branch+PR only; plan-scoped commit validation; CORE ingest tool absent from all agents — draft returned to owner only (D11) |
| T3 ledger corruption | Accidental edit, agent misbehavior, stale state | Lifecycle state | Skipped gates, false approvals, desynced artifacts | Schema validation on read (C7); D9 hash cross-check; approval invalidation on drift; revision counter; single writer (D3) |

Out of scope: hostile local attacker with filesystem access (owns the machine
regardless); network attack surface (no network services introduced; MCP
servers are pre-existing local/declared services).

## ASVS verification mapping

OWASP ASVS 4.x is web-application-centric; the applicable subset for a local
orchestration system is mapped honestly rather than decoratively:

| ASVS area | Applicability | Decision |
|---|---|---|
| V1 Architecture — trust boundaries defined and enforced | Applicable | D1, D3, D11 (tier boundaries; per-agent tool scoping) |
| V1 Architecture — enforcement at trusted layer | Applicable | D2/D5 (gates in deterministic code, not prompts) |
| V8 Data integrity | Applicable | D9 (hash anchoring), D3 (single writer) |
| V7 Error handling & logging | Applicable | F-12 structured halts; ledger gate_history as audit log |
| V2–V6, V9–V14 (authn, sessions, crypto, network, API, config) | Not applicable — no network service, no user authentication surface, no cryptographic protocol introduced | — (recorded, not silently omitted) |

## Traceability matrix

| Spec item | Resolution |
|---|---|
| F-1 intake/routing | C3 route-from-args + artifact presence; D2 |
| F-2 preflight | C2 step 1; C7 validator; D10 premise (MCP list from spec D-8) |
| F-3 context provisioning | C3 package assembly from ledger paths; D5 (reviewer packages) |
| F-4 phase execution | C4 agents + D4 schemas + D11 dispatch |
| F-5 gate operation | C3 review loops; D5; cap=5 (D5.5) |
| F-6 quality enforcement | D4 evidence entries; D8 spot re-runs; expert-verifier diff-vs-plan + reconciliation; D7 ground truth |
| F-7 state/records | Ledger schema (Components); D3; D12 STATUS.md |
| F-8 amendment propagation | D9 |
| F-9 escalation language | C2 translation of typed SEGMENT_REPORT gates |
| F-10 closeout | expert-closeout agent; T2 controls; SEGMENT_REPORT.completion |
| F-11 budget | C3 budget.spent() per phase → ledger.budget; gate reports carry spend |
| F-12 failure handling | C3 retry-once policy; C2 run-level recovery (resumeFromRunId); T3 halt-on-invalid-ledger |
| F-13 diagnosis & correction drafting | Failure router + expert-diagnostician + enriched SEGMENT_REPORT; D13 |
| F-14 repeat-complaint detection | C8 transcript reader + feedback sweep at segment boundaries; D14 |
| F-14 defect-history scope + failed corrections | Two-store defect history (`${CLAUDE_PLUGIN_DATA}` / project ledger), signature `state` + `failed_correction` verdict; D15 |
| §3.4 escalations 1–6 | SEGMENT_REPORT.gate.type enum — exactly six values |
| §8 NFRs (honesty, resumability, legibility, budget) | D12, D2+D9, C2/F-9, F-11 rows above |
| A-1..A-9 acceptance | Testing architecture (below); A-7 asserts each A-4 forced failure yields a diagnosis naming the planted defect with a correction draft that would remove it; A-8 asserts repeat-complaint detection with uninterrupted phase execution; A-9 asserts cross-project signature visibility and the failed-correction escalation path |
| R-1 repairs | C5 packaging step; exact transformation is plan/implementation scope (the decision — unescape to load — is made here) |
| D-1..D-9 (spec-locked) | Inherited verbatim (Design decisions preamble) |

**Testing architecture (A-1..A-6).** A fixture project under
`claude-plugins/expert-dev-tools/tests/fixture/` (small real codebase + toy
task). A-1: skill-load check via a session listing skills. A-2: C3 passes
`skills/workflow-creator/scripts/validate-workflow.mjs`; plugin passes
plugin-dev's validator agent. A-3: full lifecycle run on the fixture. A-4
forced failures: (a) implementer agent variant that touches an unauthorized
file → diff-vs-plan must catch; (b) planted fabricated evidence entry → D8
sample must catch (plant placed at a sampled index — deterministic stride
makes the test constructible); (c) fixture spec with a seeded contradiction →
spec_traceable gate must fire; (d) reviewer variant pinned to NEEDS_FIXES →
cap breach → non_convergence gate. A-5: kill mid-segment, resume, assert no
repeated completed phases (ledger + journal). A-6: owner-language check on
gate outputs. The forced-failure variants live in the fixture's test harness
as alternate agent definitions, not in the shipped plugin.

## Limitations and trade-offs

- **Spot re-runs sample; they do not exhaust.** A fabricated citation outside
  the sample survives that specific control (T1 residual); compensated by the
  reviewer's premise re-derivation duty, accepted as a cost/coverage trade-off.
- **Segment-granular ledger.** Intra-segment state lives only in the workflow
  journal; a crash after an owner gate report but before the command's ledger
  write loses the segment's delta and re-runs it (cache-mitigated). Accepted:
  simpler single-writer model over two-phase commit machinery.
- **Round cap and sampling rate are set by judgment** (5 rounds; 10% floor 2)
  from the owner's empirical range — no external standard governs these
  constants; both are settings-file configurable, and this entry is the
  gap acknowledgment for that grounding.
- **Skill access in workflow-dispatched agents: closed — verified by
  execution.** One-agent workflow probe (run `wf_91f2a210-c0b`, 2026-07-20)
  returned `{skill_tool_available: true, load_succeeded: true}` with the
  skill's opening content, from an agent dispatched by the Workflow runtime
  itself. Combined with the docs statement and the AgentDefinition `skills`
  preload field (D11 premise), this premise carries no residual risk and no
  longer requires a plan-phase verification step.
- **Complaint-signature clustering is model judgment, not a hash.** Two
  phrasings of the same complaint must cluster; two different complaints must
  not. Misclustering fails in a bounded way (a missed repeat is re-detectable
  on any later occurrence, since signature history persists; a false repeat
  produces an owner-owned diagnosis the owner rejects), and A-8 tests both the
  detect and the don't-detect paths — but the detector's precision is not
  otherwise characterized. No external standard governs the threshold; ≥2
  occurrences is the owner's stated trigger ("repeatedly having to say
  something") and this entry is its grounding acknowledgment.
- **Transcript retention bounds the detection window.** Transcripts are
  cleaned up per `cleanupPeriodDays` (default 30). A repeat whose first
  occurrence has aged out is not detectable from transcripts — mitigated
  because the defect history (both stores) is not subject to transcript
  cleanup: once a complaint has been seen and recorded, a later recurrence
  still matches. Only complaints never swept before their transcript expired
  are lost, which requires the project to go unswept for the full retention
  period.
- **Cross-project detection requires the plugin to have run in both projects.**
  The shared-machinery store accumulates only from sweeps; a complaint made in
  a project where the lifecycle never ran leaves no signature. Accepted: the
  plugin observes the work it runs, and a project with no lifecycle runs has
  no segment boundaries at which to sweep.
- **Version-awareness depends on an accurate running-version read.** The
  `failed_correction` vs `stale_deployment` split relies on comparing the
  running plugin version against `fixed_in_version`. The running version comes
  from the plugin's install record; if that read is wrong or unavailable, the
  sweep degrades to the conservative side — it treats an ambiguous recurrence
  as `failed_correction` (escalate, don't auto-retry) rather than assuming the
  fix is present. A wrongly-escalated stale deployment costs the owner one
  glance; a wrongly-suppressed real failure would cost silently, so the bias
  is deliberate. (Machinery corrections cannot be "silently overwritten" by an
  update — they are versioned source changes an update carries forward; that
  earlier-considered failure mode does not exist and is not listed.)
- **Sweep cost grows with transcript volume.** The marker keeps each sweep
  incremental (only new turns), but a first sweep on a long-lived project
  reads its whole history. Bounded by the reader's context window per
  session-file chunk; the reader emits owner turns with a bounded context
  window rather than whole transcripts, which is what keeps this tractable.
- **The command tier (C2) is a markdown-instructed main agent** — the one tier
  that is not deterministic code. Its duties are deliberately minimal (IO,
  presentation), but a sufficiently confused main agent could mis-write the
  ledger; C7 validation and D9 hashing bound the damage. Accepted: the
  platform offers no deterministic host for this role.

## Standards governing this architecture

| Standard | Source | What it governed |
|---|---|---|
| SOLID — Single Responsibility | industry consensus (Martin) | D1 tier decomposition |
| OWASP ASVS V1/V7/V8 (applicable subset) | OWASP ASVS 4.x | D3, D5 trust boundaries; D9/D3 integrity; F-12 audit trail; ASVS mapping table |
| OWASP secure-design fail-safe defaults | OWASP | D6 STOP routing |
| IEEE 1028 review independence | IEEE 1028 | D5 reviewer blinding |
| ISO/IEC/IEEE 29119 (dynamic test execution) | ISO/IEC/IEEE 29119 | D7 ground-truth acceptance |
| ISO/IEC 25010:2023 | ISO | Quality characteristics table (10a) |
| Root-cause-before-correction (systematic debugging; ISO 9001-family corrective action) | industry consensus / ISO 9001 §10.2 logic | D13 diagnostic layer |
| Workflow tool determinism contract | Claude Code platform (in-session contract + vetted `skills/workflow-creator/`) | D2, D8, C3 constraints |
| Claude Code plugin reference | Context7 `/websites/code_claude`, 2026-07-20 | D10, D11, C1–C6 layout |
| Single source of truth (no duplicate system of record) | industry consensus | D14 transcript-reading design |
| Corrective-action effectiveness review | ISO 9001 §10.2 logic | D15 failed-correction classification |
| `${CLAUDE_PLUGIN_DATA}` persistent-data semantics | Context7 `/websites/code_claude` plugins-reference, 2026-07-21 | D15 store location |
| Owner-locked spec decisions D-1..D-9 | spec-expert-dev-tools.md §6 | Inherited constraints preamble |

## Status of this architecture

**Gate A — PASS** (post-fix; record in Design decisions). **Gate B — PASS:**
every audit question answers by pointing at a section — standards table;
decision elements 2/4/5; structured-reasoning trace IDs
(hd1-run-topology, 5-thought sequentialthinking, T1–T3 scientificmethod,
arch-expert-dev-tools-001, gateA-expert-dev-tools); Limitations carries the
ungrounded constants; traceability covers every spec item; ASVS table present
with explicit N/A rows. **Gate C — PASS:** all twelve decisions carry five
parts; Context7 citations name library and date; CodeGraph and RAG queries
cited with results (survey record); threat model and ASVS sections present
(security in scope); no scratchpad artifacts; scope section complete.
**Trap audit — clean:** no codebase-mirroring justifications; agentboard and
ctxpack shapes explicitly rejected rather than cloned; reasoning traces in the
document; every named standard drives cited decisions; no choice deferred to
the implementer with cross-component consequences.

**Amendment 2026-07-21 (owner-directed, spec D-10/F-13):** diagnostic and
correction layer added — expert-diagnostician agent, failure router in C3,
correction doctrine (five binding rules), enriched SEGMENT_REPORT gate fields,
D13, A-7 test row. Gates re-checked against the delta: D13 carries all five
parts; the new standard drives D13 (table row); traceability covers F-13 and
A-7; no new unverified premises (D13 is a pure design choice); trap audit
unchanged — the diagnostician executes no changes, so no decision moved to a
downstream phase.

**Amendment 2026-07-21b (owner-directed, spec D-11/F-14):** repeat-complaint
detection added — C8 transcript reader, segment-boundary feedback sweep,
diagnostician feedback-sweep mode, ledger signature history + read marker,
D14, A-8 test row, three Limitations entries. *Revised within the same session
on owner challenge:* the first draft introduced a `UserPromptSubmit` capture
hook writing a parallel feedback register; the owner identified it as a poorer
duplicate of the session transcript, and it was removed — the sweep now reads
the existing transcripts, which carry the same statements plus their context.
Net effect on the plugin: one script instead of a hook, a script, and a data
file. Gates re-checked after the revision: D14 carries all five parts with its
premise verified by direct read of this project's transcript files
(2026-07-21); the single-source-of-truth standard appears in the standards
table driving D14; traceability covers F-14 and A-8; ISO 25010 keeps the
freedom-from-interruption row, now satisfied more strongly (nothing at all in
the prompt path). Trap audit: no deferred decision (threshold, sweep timing,
and marker semantics fixed here); no pattern-cloning (the task-observer skill
in this environment observes for skill improvement — different problem, and it
was not used as a template).

**Amendment 2026-07-21c (owner-challenge, spec D-11/F-14):** the owner asked
how a problem fixed in one session would be recognized when a *different*
session or project hits it again. Two gaps found and closed: (1) the signature
history was project-scoped, so defects in the plugin's shared machinery —
the ones that recur across projects by construction — would have required
detection twice per project; the history is now split by blast radius, with
shared-machinery signatures in `${CLAUDE_PLUGIN_DATA}` (cross-project,
update-surviving, verified against the plugins reference). (2) A recurrence
*after* a correction was treated as an ordinary repeat and would have
re-entered the correction path; it is now a distinct `failed_correction`
verdict that escalates with the original diagnosis and applied fix, and is
barred from automatic correction. Added D15, acceptance criterion A-9, three
Limitations entries, two standards rows. Gates re-checked: D15 carries all
five parts with its store-location premise verified via Context7 2026-07-21;
traceability covers both F-14 rows and A-9; trap audit clean — no decision
deferred (store split, record schema, and verdict semantics are fixed here).

**Amendment 2026-07-22 (owner-challenge, spec D-11/F-14):** the owner
challenged the "a correction could be silently lost when an update overwrites
an agent definition" limitation — correctly, since machinery corrections are
changes to the plugin source and are versioned, so an update carries them
forward rather than overwriting them; the scenario only arises from applying a
fix to the ephemeral cache copy, which is now explicitly prohibited. Design
made version-aware: `correction` records `fixed_in_version`+`commit`,
occurrences record `plugin_version`, and a recurrence on a `corrected`
signature splits into `failed_correction` (running version ≥ fix — the fix
failed) vs `stale_deployment` (running version < fix — update the plugin). The
bogus limitation was removed and replaced with the real residual (version-read
accuracy, conservative-escalation bias). Premise verified 2026-07-22:
`plugin.json` carries `version` and `installed_plugins.json` records
version + `gitCommitSha` per install. Gates re-checked: D15 still five-part
and now more precise; A-9 unchanged in intent; trap audit clean.

**Amendment 2026-07-23 (round-1 remediation, owner-directed).** Three
implementation-driven refinements landed during round-1 remediation
(`docs/plans/plan-expert-dev-tools-remediation-r1.md`):

- **Agent tool scoping is a hybrid, not a uniform allowlist (refines D11).**
  Verified against the Claude Code plugin/sub-agents/permissions reference
  (Context7 `/websites/code_claude`, 2026-07-23): plugin-bundled MCP tools are
  named `mcp__plugin_<plugin>_<server>__<tool>`, and a `tools` allowlist's server
  segment must be specific and glob-free (there is no all-MCP wildcard on the
  allow side). The three agents whose skills use the host-provided
  CodeGraph/codebase-RAG servers (`expert-reviewer`, `expert-architect`,
  `expert-planner`) therefore cannot name those servers in an allowlist, and
  codebase-RAG cannot be bundled (a local Python/sentence-transformers server,
  not npm-launchable). They use hardened `disallowedTools` denylists that retain
  full host MCP; the other six agents, whose complete toolset is nameable, use
  `tools` allowlists. D11's intent (least privilege as a capability boundary) is
  preserved: no agent can CORE-ingest, and none can spawn sub-agents (Agent/Task
  denied on the denylist agents; absent from the allowlists).
- **The reviewer retains Bash (refines D5/D11).** D5/D11 specified the reviewer
  as "pure read-only, no Bash." The reviewer's own skill (expert-review) lists a
  test runner among its verification instruments, so denying Bash degrades it.
  Per owner directive, the reviewer keeps Bash and its full MCP toolset; review
  independence is enforced instead by denying Write/Edit/NotebookEdit — it cannot
  edit the artifact it judges; the nameable WebFetch/WebSearch, outside its instrument roster, are also denied.
- **Review results are persisted and surfaced (RV, refines D12).** Each review
  round's findings are written by the command as a `role:"review"` artifact under
  `.claude/expert/reviews/<phase>.md` and surfaced in STATUS.md — not reduced to a
  bare finding count. The `artifact_index` `role` enum gains `"review"`.

Gates re-checked against the delta: the scoping change is grounded in the verified
Context7 facts; the RV change reuses the D9 artifact machinery; no new unverified
premise; trap audit clean (no decision deferred downstream).

**Design → Build gate: PASS.** Next: `/expert-plan` consumes this document
plus the spec. The formerly-open `Skill()` premise is closed by executed
probe (Limitations).
