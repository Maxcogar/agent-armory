# Diagnosis: role-boundary-violations in review loop

Defect signature (defect-history.json:90-103): "role-boundary-violations in
review loop: reviewer prescribing fixes / orchestrator transcribing findings
or writing dispatch instructions the workflow owns" — 5 occurrences,
2026-08-17, plugin_version 0.2.1, state open, verdict systemic_defect.
Responsible component: expert-review skill + expert-lifecycle dispatch
contract.

## 1. Failure characterization (from evidence)

Two sub-modes, both live in the 2026-08 session transcript
`C:\Users\maxco\.claude\projects\C--Users-maxco-Documents-agent-armory\5071adeb-79e9-4b22-a2ab-fc4f5e03565a.jsonl`:

- **(b) Orchestrator doing artifact-persistence the agents own.** Owner turn
  at transcript line 494: `SO WHY WERE YOU WRITING OUT THE REVIEW
  FINDINGS????` — the main-session orchestrator hand-transcribed ~65KB of
  reviewer findings from chat payloads into files. The reviewer had emitted
  free-prose review documents into its final message; no structured channel
  or designated persistence owner existed, so the orchestrator improvised
  one by copying.
- **(b') Orchestrator authoring dispatch instructions the workflow owns.**
  Owner turn at transcript line 522: `why are you writing dispatch
  instrucitons????? doesnt the workflow do all of that??` — the orchestrator
  composed reviewer/corrector dispatch prompts by hand instead of the
  workflow's own dispatch assembly doing it.
- **(a) Reviewer prescribing fixes.** The reviewer's free-prose returns
  carried fix instructions alongside findings. Downstream this couples
  directly to the sibling open signature "patching-instead-of-rederivation"
  (defect-history.json:75-88): a corrector handed a prescribed fix patches
  the prescribed sentence instead of re-deriving the section from sources.

Standing owner rules established from this episode (auto-memory,
2026-08): agents persist their own artifacts and return verdict-only
summaries; reviewer dispatches are pointers-only; author-written review
checklists contaminate the review.

## 2. Audit of current v0.3.0 source

### What v0.3.0 already fixed (verified, not assumed)

- **Dispatch authoring is workflow-owned.** Every reviewer and corrector
  dispatch prompt is a literal inside
  `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js` —
  `reviewFn` sites at lines 528, 559, 582, 621 and `remediateFn` sites
  adjacent. `commands/expert.md:6-9` pins the command tier to I/O and
  owner-facing language: "all lifecycle routing and gating lives in the
  workflow". Structural check T-2b
  (`tests/structural/check-structure.mjs:140-163`) already asserts every
  dispatch site names a known AGENT key and every agent is dispatched from
  the workflow.
- **Findings are structured, not prose.** The reviewer returns
  `VERDICT_SCHEMA` (`expert-lifecycle.js:170-186`): verdict, round, lens,
  and findings each `{classification, standard, premise_evidence,
  location}`. `agents/expert-reviewer.md:29-39` states the final message is
  structured data for the orchestrator, locations in a parseable grammar.
- **Persistence is mechanical, not improvised.** `commands/expert.md:96-103`
  (step 4, "Persist review records") has the command tier append the
  report's `review_records` — the four named fields per finding — to
  `.claude/expert/reviews/<phase>.md`. This is deliberate design, not the
  defect recurring: the reviewer is Write/Edit-denied for independence
  (frontmatter `disallowedTools`, enforced by structural check T-A2b at
  `check-structure.mjs:85`), and the workflow sandbox has no filesystem
  access (zero `fs`/`import` in `expert-lifecycle.js` — verified by grep),
  so the command tier is the only possible writer and it writes from
  bounded structured data, not from chat prose.

### What is NOT enforced (the residual root cause)

1. **The findings payload is structurally open.** `VERDICT_SCHEMA`'s
   findings items (lines 177-184) set no `additionalProperties: false` and
   no `maxLength` on any string. A reviewer can attach a `fix` /
   `recommendation` / `remediation` field, or carry a full prescription (or
   a 65KB review document) inside `premise_evidence`, and validation
   passes. Schema validation is performed by the Workflow harness's
   `agent()` primitive (no local definition in the workflow — verified by
   grep), so its strictness is outside the plugin's control; the plugin
   itself checks nothing about the returned shape.
2. **Nothing bars fix-prescription.** `skills/expert-review/SKILL.md`
   contains no rule against prescribing fixes (grep for prescrib/fix/
   remediation/suggest: no such rule). It in fact requires prescriptive
   report elements — "what correct looks like" per systemic pattern
   (SKILL.md:403) and a "Recommended Priority" section (SKILL.md:489).
   `agents/expert-reviewer.md` is likewise silent. So sub-mode (a) is
   unmitigated by prose AND by structure.
3. **Prescriptions flow straight into the corrector.** Every `remediateFn`
   inlines `JSON.stringify(findings)` into the corrector's dispatch prompt
   (e.g. `expert-lifecycle.js:529`). An unbarred prescription in a finding
   becomes dispatch text the corrector reads — recreating both the
   role-boundary violation and the patching-instead-of-rederivation
   failure in one step.
4. **The command-tier field list is hand-maintained.** `expert.md:100-101`
   enumerates the four finding fields by hand; nothing keeps it in sync
   with `VERDICT_SCHEMA`. Drift here is how mechanical persistence decays
   back into interpretive transcription (measured pattern: hand-maintained
   derived tables become the regression engine).

**Root cause (current form):** the review-loop role contract is stated in
prose but the one channel that crosses every role boundary — the reviewer's
returned findings payload — has no structural bound on shape or size, so
prescriptions and prose-bloat can ride it unimpeded through validation,
into the corrector's dispatch, and into the persisted review record.

## 3. Correction draft — classification: machine_applicable

Three coordinated edits, executable/structural per the project's measured
constraint (prose discipline has not converged here):

**C1 — Close the schema (workflows/expert-lifecycle.js).** In
`VERDICT_SCHEMA`, findings items gain `additionalProperties: false` and
per-field bounds: `classification` maxLength 40, `standard` maxLength 300,
`premise_evidence` maxLength 700, `location` already pattern-pinned. A fix
prescription physically does not fit, and a `fix`/`recommendation` field is
rejected at validation.

**C2 — Runtime findings-shape guard in the workflow (belt to C1's
braces, since harness validator strictness is not plugin-controlled).** Add
`const FINDING_KEYS = ...; function findingShapeFault(findings)` that
checks every returned finding for (i) unknown keys, (ii) field lengths over
the C1 bounds, (iii) prescription markers in `premise_evidence` (a compact
denylist: `/\b(fix by|should (change|be changed)|replace .* with|instead
use|recommended fix)\b/i` — a heuristic tripwire, not the primary control;
C1 sizing is). `runGate` calls it on each round's findings before
`remediateFn`; a fault returns the existing `control_fault` owner-gate
shape ("the reviewer return violated the findings contract; re-run the
round") instead of passing the payload onward. Fail-closed, mirroring the
under-covered-verifier precedent at `expert-lifecycle.js:465-471`.

**C3 — Name the rule where the roles read it.**
`agents/expert-reviewer.md`: add one paragraph — findings state the
standard, the violation, the location, and the premise evidence; never the
fix; the corrector re-derives from sources, and a prescribed fix
contaminates re-derivation. `skills/expert-review/SKILL.md`: scope the
"what correct looks like" clause to *stating the standard's requirement*,
explicitly not a patch instruction, when the review is consumed by a
correction loop. `commands/expert.md` step 4: replace the hand-enumerated
field list with "every property named by the workflow's VERDICT_SCHEMA
findings items" so the persistence step tracks the schema instead of a
copy of it.

Sub-mode (b) needs no new mechanism — dispatch ownership and mechanical
persistence are already structural in v0.3.0; C1/C2 remove the payload
openness that could still smuggle role-crossing content through them, and
the structural checks below pin the arrangement against regression.

## 4. Verification (structural tier, tests/structural/check-structure.mjs)

- **T-RB1:** parse `VERDICT_SCHEMA` out of the workflow source (the
  existing `braced()` helper); assert findings items declare
  `additionalProperties: false` and a `maxLength` on every string property.
- **T-RB2:** assert `findingShapeFault` is defined in the workflow AND
  called inside `runGate` before the `remediateFn` invocation (two greps on
  the source, same technique as T-12's call-site check at line 183).
- **T-RB3:** assert `agents/expert-reviewer.md` contains the
  no-prescription sentence (anchor on a stable phrase, e.g. "never the
  fix"), and that the reviewer remains Write/Edit-denied (already T-A2b:85
  — unchanged).
- **T-RB4:** assert `commands/expert.md` step 4 no longer hand-enumerates
  finding field names (grep that the literal list is gone and the
  schema-reference phrase is present) — the derived-list drift check.
- **Unit (tests/unit/run-unit-tests.mjs):** feed `findingShapeFault` a
  fixture finding carrying a `fix` key, an oversized `premise_evidence`,
  and a prescription phrase; assert each faults; assert a clean four-field
  finding passes. This gives the guard a negative test, matching the
  project's the-gate-can-fail convention (T-A2a-neg).

## Evidence index

- defect-history.json:90-103 (signature record)
- Transcript 5071adeb…jsonl lines 494, 522 (owner turns)
- expert-lifecycle.js:170-186 (open schema), 529/559/582/621 (dispatch
  literals, findings inlined to corrector), 465-471 (fail-closed
  precedent), no fs/import (grep)
- agents/expert-reviewer.md:6, 29-39 (Write-denied, structured return)
- skills/expert-review/SKILL.md:403, 489 (prescriptive elements; no
  no-prescription rule anywhere — grep)
- commands/expert.md:6-9, 96-103, 151-171 (command-tier boundary and
  persistence step)
- tests/structural/check-structure.mjs:85, 140-163, 183 (existing pins)
