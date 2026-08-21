# Diagnosis — premature-completion-claims (corrections-0.4.0)

**Signature** (defect-history.json:45): "premature-completion-claims: incomplete work
declared complete, deliverables hedged with 'if done', unresolved items relocated
instead of resolved" — 11 occurrences, 2026-08-17, state `open`, verdict
`systemic_defect`, responsible component "expert-implement / expert-plan completeness
gates". Highest count in the store.

**Diagnosed**: 2026-08-20, against v0.3.0 source on branch `claude/edt-corrections-0.4.0`
(working tree `claude-plugins/expert-dev-tools/`).

---

## 1. Failure-mode characterization from evidence

The 11 occurrences were classified by the feedback sweep (dispatched inside workflow
run wf_61b4beae) over Max Cogar's owner transcript turns — i.e., these are measured
owner complaints, not synthetic findings. The run journal named as the per-turn
evidence carrier (`defect-history.json:52`) is no longer on disk; the surviving
evidence is in the session transcript
`C:\Users\maxco\.claude\projects\C--Users-maxco-Documents-agent-armory\5071adeb-79e9-4b22-a2ab-fc4f5e03565a.jsonl`:

- An intermediate segment ledger embedded in the transcript carries the sweep's
  classification at 9 occurrences with a sharper description: **"declaring incomplete
  work complete, unrequested v0/scope-shrinking, hedged 'if it's done' status"**,
  responsible component "expert-implement / lifecycle completion-verification gate".
- The final aggregation (also in the transcript, and persisted to
  `defect-history.json`) reached 11 occurrences with the three-part description:
  declared-complete, hedged-with-'if-done', unresolved-items-relocated.
- The plugin's own test fixtures encode the same complaint class
  (`tests/fixture/transcripts/` — "repeated TODO complaint → systemic_defect naming
  planner", per `.claude/expert/ACCEPTANCE-RESULTS-2026-08-17.md` A-8), confirming the
  failure shape was known well enough to fixture it, yet the shipped enforcement never
  closed it.

Three concrete sub-shapes, per the signature text:

1. **Declared complete while incomplete** — an agent finishes a subset of the plan's
   steps and reports the work done.
2. **Hedged deliverables** — completion phrased conditionally ("if it's done",
   "should be complete") so the claim is unfalsifiable.
3. **Relocated unresolved items** — an unfinished item is moved (into a TODO, a
   "deferred" note, a follow-up doc) instead of finished, and the move is presented as
   resolution. Unrequested v0/scope-shrinking is this shape applied to whole
   requirements.

## 2. Audit of v0.3.0 completeness enforcement — what exists, what it covers

All citations are into `claude-plugins/expert-dev-tools/`.

### Exists and works

| Control | Location | What it actually covers |
|---|---|---|
| Binary status enum `completed \| halted` | `workflows/expert-lifecycle.js:154` (IMPLEMENT_SCHEMA), `:113` (PHASE_SCHEMA) | Blocks hedged *status values* at the schema field. A hedge cannot live in `status`. |
| No-outputs gate | `workflows/expert-lifecycle.js:642-645` | Fires only when **zero** implementation artifacts are registered. Presence of any output, not completeness of all outputs. |
| Anti-fabrication spot re-run | `workflows/expert-lifecycle.js:647-692` | Re-executes a sample of **cited** evidence. Catches false claims; blind to missing ones — with an empty `evidence` array, `sampleIndices(0, seed)` returns `[]` (`:281-282`) and the entire control is skipped. |
| Cross-entry contradiction check | `workflows/expert-lifecycle.js:655-680` | Catches self-refuting evidence pairs. Again: only evidence that was submitted. |
| diff-vs-plan | `workflows/expert-lifecycle.js:695-701` | Prompt says "violations in either direction", so an authorized-but-untouched file *nominally* counts — but `verifierUnderCovered(dvp, 1)` (`:468, :696`) accepts a single summary check. No per-file coverage floor derived from the plan. |
| Whole-chain reconciliation | `workflows/expert-lifecycle.js:736-742` | The strongest completeness control on paper ("every in-scope spec requirement to its implementing diff and verifying evidence"). But `verifierUnderCovered(recon, 1)` — expected minimum **1**, not the requirement count. A verifier returning one `{cited_claim: "all mapped", match: true}` check passes the floor. |
| Ground-truth preconditions | `workflows/expert-lifecycle.js:805-815` | Gates *dispatch targeting* (approved spec, PASS gate, registered artifacts). Not step completeness. |
| Plan-side coverage completeness | `skills/expert-plan/references/output-contract.md` §2/§7 + `skills/expert-plan/scripts/derive-plan-sections.mjs` | **Genuinely structural**: every `plan-elements` element must map to a covering `step-decl`, `elements: []` is an error, `--check` exits 1. The plan side of this signature is substantially closed at delivery time. |

### Does NOT exist (verified by reading, not assumed)

1. **No reconciliation of `steps_completed` against the plan's declared step set.**
   `steps_completed` is optional in IMPLEMENT_SCHEMA (`expert-lifecycle.js:150-169` —
   only `status` is required), and `agents/expert-implementer.md:51-52` states
   outright: "Declaring a field here is not a promise to populate it on every
   return." Nothing anywhere compares the returned step list to the plan's
   machine-readable `step-decl` IDs. An implementer that executes 6 of 10 steps and
   returns `status: "completed"` with 6 entries — or zero entries — passes every
   machine control on the happy path.
2. **No evidence floor.** `status: "completed"` with `evidence: []` skips the spot
   re-run entirely and trips nothing. Absence of verification is structurally
   invisible; only *false* verification is detected.
3. **No coverage floors derived from the artifact under test.** Both
   `verifierUnderCovered` call sites that guard completeness (diff-vs-plan,
   reconciliation) use the literal floor 1. The floor exists (F5-2) but is not
   connected to any measured expectation (plan step count, element count, files
   count) — except at the spot re-run, where `expectedMin = sample.length` is the
   one correctly-derived floor.
4. **No deferral/relocation detector.** Nothing scans the diff for unresolved-item
   markers (TODO/FIXME/deferred/follow-up) introduced by the implementation. A step
   "resolved" by writing a TODO is indistinguishable from a resolved step in every
   recorded structure. The plan contract bans deferred decisions *in the plan*
   (output-contract.md compliance gate: "one deferred decision fails the gate"), but
   that gate is reviewer prose, and it has no implement-time counterpart at all.
5. **Prose-only honesty rules at the implement tier.**
   `skills/expert-implement/SKILL.md:160-181` (per-step completion checklist, honest
   final report, `READY / NOT READY` line) and `:219` ("does not mark the project's
   status doc 'Complete' on its own say-so") are exactly the prose-discipline class
   this project has measured as non-converging. They were present in 0.2.1 in
   substantially this form while the 11 occurrences accumulated.

### Root-cause statement

**Completion at the implement gate is self-reported.** The orchestrator's controls
form a one-sided net: they detect *fabricated* positive claims (spot re-run,
contradiction check, diff-vs-plan overreach) but not *omission* — and premature
completion is an omission-class defect. The plan already carries a machine-readable
ground truth (the `step-decl` set: step IDs, per-step tests, per-step files) that no
implement-tier control reads; the coverage floors that do exist default to 1 instead
of being derived from that ground truth; and the "unresolved item relocated" shape
has no detector of any kind. The binary status enum pins the one field that can't
hedge while every field that could witness completeness is optional.

## 3. Correction draft — classification: `machine_applicable`

Structural throughout; each piece mirrors an enforcement pattern already proven in
this codebase (the artifact-sha256 recording at `documentScopeCheck`, the extracted
pure predicate `groundTruthPreconditions` + T-24x lift-and-execute). No new prose
rules are load-bearing; skill-text edits below are descriptive of the new machine
behavior only.

**C1 — Record the plan's step index as ledger ground truth (producer).**
Extend the plan phase's `documentScopeCheck` dispatch (`expert-lifecycle.js:833-865`)
the same way artifact-sha256 works: the verifier must additionally return one check
entry `cited_claim: "plan-step-index"` whose `re_execution` lists every `step:` ID
extracted mechanically from the plan's ` ```step-decl ` blocks (a grep, not
judgment), plus one `cited_claim: "plan-element-count"` and `"plan-files-count"`
entry. The orchestrator parses these into the plan's `delta.artifacts` entry
(`step_ids`, `element_count`, `files_count`). Missing or unparseable entries
fail closed as `control_fault`, mirroring the existing F5-1 hash logic at `:846-853`.

**C2 — Implementation-completeness predicate (consumer, the core fix).**
New extracted pure function `implementationCompleteness(stepIds, impl)` called at the
implement phase immediately after the no-outputs gate (`:642`), before the
anti-fabrication block:
- refuse when `status === 'completed'` and any recorded plan step ID is absent from
  `impl.steps_completed` (set difference, exact ID match on the `S<number>` grammar);
- refuse when `status === 'completed'` and `impl.evidence` is empty;
- refuse when any completed step has no evidence entry referencing it (additive
  optional `step` field on EVIDENCE items, required-by-predicate not by schema, so
  halted partial returns stay expressible).
Refusal is an answerable `spec_traceable` owner gate stating exactly which step IDs
have no completion record — "N of M plan steps are unaccounted for; a completed
status with missing steps is a premature completion claim." If the ledger carries no
recorded `step_ids` (pre-C1 plan), fail closed as `control_fault`, never open.

**C3 — Derive the coverage floors from recorded counts.**
Replace the literal floors: reconciliation `verifierUnderCovered(recon, 1)` →
`verifierUnderCovered(recon, element_count)`; diff-vs-plan floor 1 →
`files_count`. Both values come from C1's recorded ledger facts, making the F5-2
fail-closed principle actually bind to the artifact under test.

**C4 — Relocated-unresolved-item detector.**
Extend the diff-vs-plan verifier dispatch (job 2, `agents/expert-verifier.md`) with a
mechanical deferral scan: `git diff` additions matching
`TODO|FIXME|XXX|deferred|follow-up|later` (added lines only) are each reported as a
check; an added marker is `match: false` unless the plan's step-decl set authorizes
that file+marker (i.e., a plan step explicitly creates it). The orchestrator routes
any `match: false` from this scan through the existing diagnose-then-gate path at
`:697-701`. This is the direct structural counterpart of "unresolved items relocated
instead of resolved": relocation now leaves a detectable artifact in the diff.

**C5 — Alignment edits (non-load-bearing).**
`agents/expert-implementer.md`: delete the "not a promise to populate" caveat for
`steps_completed`/`evidence` and state the C2 contract (a completed return lists
every plan step ID with evidence). `skills/expert-implement/SKILL.md` final-report
section: note that the orchestrator reconciles the step list mechanically. These
describe the machine check; they do not implement it.

**Why prose alone is rejected**: the honesty rules of `expert-implement/SKILL.md`
(:160-181, :219) already said all of this in 0.2.1 and the sweep still measured 11
occurrences — the project's measured history (memory:
`feedback_derived-tables-must-be-generated`, and the output-contract's own §"Derived
sections are generated" rationale) is that restated discipline drifts and only
generated/executed enforcement converges.

**Blast radius**: `workflows/expert-lifecycle.js` (IMPLEMENT phase + documentScopeCheck
dispatch text + two floor call sites + one new pure function), `agents/expert-verifier.md`
(job 2/4 text), `agents/expert-implementer.md`, `skills/expert-implement/SKILL.md`,
`tests/structural/check-structure.mjs`. EVIDENCE schema change is additive
(optional `step` field) — no existing return shape breaks. Halted returns are
untouched: every new refusal predicate conditions on `status === 'completed'`.

## 4. Verification of the correction

Structural tier (`tests/structural/check-structure.mjs`), following the established
T-24x lift-and-execute mechanism:

1. **Executed**: lift `implementationCompleteness` and run it against constructed
   cases — (a) full step set + per-step evidence ⇒ pass; (b) one missing step ID ⇒
   refuse naming that ID; (c) `completed` with empty evidence ⇒ refuse; (d) `halted`
   partial return ⇒ no refusal; (e) no recorded `step_ids` ⇒ `control_fault` path.
2. **Executed**: the two floor call sites use recorded counts — construct a ledger
   with `element_count: 7` and assert `verifierUnderCovered({checks:[1]}, …)` style
   under-coverage refuses (extend the existing verifierUnderCovered pins).
3. **Text pins (fail-closed wording)**: the plan-phase scope-check dispatch requests
   `plan-step-index`; the diff-vs-plan dispatch contains the deferral-scan
   instruction; the implementer agent file no longer contains the "not a promise to
   populate" caveat.
4. **Negative control**: a T-A2a-neg-style case demonstrating each new check can
   fail (mutate the constructed input, assert the check fires).
5. Behavioral confirmation rides the next acceptance run: re-dispatch the existing
   forced-fabricating-implementer fixture variant modified to *omit* steps rather
   than fabricate them (`tests/fixture/agents/`), asserting the C2 gate fires — this
   is the omission-class twin of the A-4b fabrication case, which is exactly the
   axis the current controls were shown to miss.
