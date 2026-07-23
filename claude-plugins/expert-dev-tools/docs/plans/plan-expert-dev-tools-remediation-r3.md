# Plan — expert-dev-tools round-3 remediation

**Inputs:** the round-3 independent review (verdict NEEDS FIXES; relayed in session),
`docs/plans/plan-expert-dev-tools-remediation-r2.md`, `docs/specs/spec-expert-dev-tools.md`,
`scripts/ledger.schema.json`, `workflows/expert-lifecycle.js` (all read this session).
**Produced under:** the expert-plan process; output-contract §16; testing-standards.
**Date:** 2026-07-23. **Clear-Thought trace:** `sequentialthinking` thoughtHistoryLength 17–18 (Finding-A predicate).

---

## 1. Goal

Close the four findings the round-3 independent review returned against
`plan-...-r2.md`, so a round-4 review passes at zero findings. Three were introduced by the round-2
fixes (RR1, RR4); one is an F2 residual. The four: (A, Serious) the STATUS "open feedback signatures"
filter keys on `state` values (`systemic_defect`/`failed_correction`) that the schema never stores, so
the F-14 durable-visibility guarantee is dead; (B, Moderate) an intent gate answered with "request
changes" is never resolved and lingers as a false-open escalation; (C, Minor) a mislabeled data field
in the RR1 presentation instruction; (D, Minor) plan-r1 D-R2's reviewer enumeration omits
WebFetch/WebSearch. Success: STATUS surfaces open feedback signatures by a predicate over stored
fields (`state === "open"`, or `corrected` with a recurrence occurrence at/after the fix version);
every answered intent escalation is resolved; the field label is accurate; D-R2 matches the reviewer's
denylist — all verifiable against source, with the automated suites staying green. The review's yellow
flag (count ticked 3→4) means this round must strictly decrease; the plan specifies each fix exactly to
avoid introducing new defects.

## 2. Scope

**In scope:** findings A, B, C, D and the two files they touch — `commands/expert.md` (A, B, C) and
`docs/plans/plan-expert-dev-tools-remediation-r1.md` (D).

**Out of scope, with authority:**
- **The closed findings** — F1's live presentation + A-9(b) content, F2's approval path, F3, and the
  nine round-1 findings + RV — verified closed by the round-2/round-3 reviews; not re-opened
  (register Q-1, review-directed).
- **Any schema change** — Finding A is satisfiable from the existing `signature_record` fields
  (`state`, `occurrences[].plugin_version`, `correction.fixed_in_version`), §11 X2/X3; no schema
  change (register Q-2).
- **The behavioral tier (A-3…A-9 live runs)** — owner-gated; the A/B runtime behaviors are confirmed
  there (A-9(b), A-5). Register Q-3.

**Coverage reconciliation:**

| Finding | Step(s) |
|---|---|
| A STATUS predicate over stored fields + recurrence-occurrence persistence | RRR1 |
| B resolve intent escalation on any answer + all prior | RRR2 |
| C field-label fix | RRR3 |
| D D-R2 reviewer enumeration | RRR4 |

## 3. Standards that govern this plan

- **Internal schema-contract consistency** (the ledger schema is the authority the command must
  conform to) — governs RRR1: the STATUS predicate must reference only fields/values the schema
  actually stores.
- **Spec F-14** (a feedback escalation must stay visible) + **spec §8 honesty-of-state** (STATUS never
  claims more/other than the evidence shows) — govern RRR1 and RRR2.
- **Spec acceptance A-9(b)** — governs RRR1: a `failed_correction` is a `corrected` signature recurring
  on a plugin version ≥ its fix version.
- **First-principles field-reference accuracy** — governs RRR3.
- **Design-record accuracy** (the standard F3/RR4 invoked) — governs RRR4.

## 4. Spec issues

None. No spec/standard conflict surfaced; all four are conformance defects against the spec and the
ledger schema.

## 5. Files affected

Both **modified**. No new/deleted files. Neither is a graph-tracked code file
(`commands/expert.md` and a plan `.md` are documents); the round-1 blast-radius survey established 0
dependents on the plugin's code files (§11 X-blast).

- `commands/expert.md` (RRR1, RRR2, RRR3)
- `docs/plans/plan-expert-dev-tools-remediation-r1.md` (RRR4)

**Documentation sync:** none beyond RRR4 itself — no code file changes, so `codegraph_find_related_docs`
returns nothing new to review.

## 6. Foundation corrections

None separate from the findings. Findings A and C are regressions the round-2 RR1 fix introduced; they
are corrected here inside the same command bullets.

## 7. Plan

Independent steps; command edits first, then the plan-doc edit.

---

### RRR1 — STATUS feedback-signature predicate over stored fields + recurrence-occurrence persistence (Finding A)

**What changes** in `commands/expert.md`:
- **Step 4 STATUS bullet (currently lines 106–109)** — replace the "state is a live complaint
  (`systemic_defect` / `failed_correction`)" filter with a predicate over **stored** fields: STATUS
  surfaces a `signature_history` entry (and the read-only shared-machinery defect-store entries) as an
  **open feedback item** when **either** its `state` is `"open"`, **or** its `state` is `"corrected"`
  and it has an `occurrences[]` entry whose `plugin_version` is **at or above** its
  `correction.fixed_in_version` (compare as semantic versions) — the second case is exactly a
  `failed_correction` (spec A-9(b)). State that the transient sweep verdicts are never stored, so the
  predicate keys on `state` + `occurrences` + `correction`.
- **Step 4 feedback-persistence bullet (currently lines 94–100)** — make explicit that when a report
  `feedback` disposition or `feedback_escalation` reports a recurrence of an existing signature, the
  command **appends the recurrence as a new `occurrences[]` entry** (with its `plugin_version`) on the
  matched signature record in the store that holds it — so the corrected-recurrence case above is
  detectable from stored data.

**Source:** spec F-14 / §8; spec A-9(b); internal schema-contract consistency; the RR1 STATUS goal.
**Why this approach — Gate 3:**
1. *Decision:* STATUS's open-feedback predicate is `state === "open"` OR (`state === "corrected"` AND
   an occurrence's `plugin_version` ≥ `correction.fixed_in_version`), computed from stored fields; and
   the command persists each recurrence as an occurrence.
2. *Standard:* internal schema-contract consistency + spec A-9(b) — the schema stores `state` (enum
   `open`/`corrected`) and `occurrences[].plugin_version` and `correction.fixed_in_version`; A-9(b)
   defines `failed_correction` precisely as a corrected signature recurring on version ≥ fix version.
3. *Why here:* STATUS is regenerated from the stored ledger/defect records, which never hold the
   transient verdict tokens the round-2 filter tested — so the filter matched nothing; the durable
   F-14 visibility must be derived from what the records actually contain.
4. *NOT — and why:* NOT filtering on `state === systemic_defect/failed_correction` (those are not in
   the `state` enum, §11 X2 — the Finding-A defect); NOT adding a schema field to persist the verdict
   (the failed-correction condition is already computable from `occurrences` + `correction`, §11 X3 —
   a schema change is unnecessary and would reopen the schema); NOT string-comparing versions (semver
   `0.10.0 < 0.2.0` as strings — the command must compare semantically).
**Dependencies:** none. Unblocks nothing.
**Verification:** content review — the STATUS bullet references only stored fields (`state`,
`occurrences[].plugin_version`, `correction.fixed_in_version`) and no `state` value outside
`open`/`corrected`; the persistence bullet appends the recurrence occurrence. Runtime confirmation is
the deferred A-9(b)/A-8 behavioral run.
**Impact if wrong:** the F-14 durable-visibility guarantee stays broken (a failed correction invisible
in STATUS); bounded to the command tier, recoverable.

---

### RRR2 — Resolve the intent escalation on any answer, and all prior on approval (Finding B)

**What changes** in `commands/expert.md` step 5:
- In the **intent-advance bullet (currently lines 155–163)**: resolve the intent escalation whenever
  the owner answers the intent gate — on **approval** *and* on **request changes** — and, on approval,
  mark **all** prior unresolved `intent` `escalations` entries for this lifecycle `resolved: true`
  (not only the latest segment's entry), since a multi-round intent flow leaves earlier intent
  escalations open.
- Keep the existing "any other gate → resolve" rule for non-intent gates (currently lines 165–167).

**Source:** spec §8 honesty-of-state; the `escalations.resolved` field (§11 X7).
**Why this approach — Gate 3:**
1. *Decision:* every answered intent escalation is resolved (both answer paths), and approval resolves
   all prior unresolved intent entries for the lifecycle.
2. *Standard:* spec §8 honesty-of-state — STATUS renders `resolved === false` entries as open; an
   answered gate that stays `false` misrepresents state.
3. *Why here:* the workflow returns the intent gate on every spec PASS, so a request-changes → re-run
   → approve flow produces multiple intent escalations; resolving only the latest on approval leaves
   the earlier one falsely open — the exact class RR2 exists to close.
4. *NOT — and why:* NOT resolving only on approval (the Finding-B defect — request-changes leaves it
   open); NOT resolving only the latest segment's entry (leaves earlier intent escalations open across
   a multi-round intent flow).
**Dependencies:** none. Unblocks nothing.
**Verification:** content review — the intent bullet resolves on both answer paths and, on approval,
all prior unresolved intent entries. Runtime confirmation is the deferred A-5 behavioral run.
**Impact if wrong:** STATUS keeps showing answered intent gates as open; bounded, recoverable.

---

### RRR3 — Fix the mislabeled evidence field (Finding C)

**What changes** in `commands/expert.md` step 5 (currently line 152): reword "the new evidence is the
recurrence occurrence in `disposition.occurrences`" to "the new evidence is the most recent entry in
the matched signature record's `occurrences` array (the recurrence); `disposition.occurrences` is the
recurrence **count**."
**Source:** first-principles field-reference accuracy; FEEDBACK_SCHEMA (§11 X9) vs `signature_record`
(§11 X10).
**Why this approach:** trivial — `disposition.occurrences` is a FEEDBACK_SCHEMA integer count (§11 X9);
the occurrence records live in `signature_record.occurrences` (§11 X10), the record the command
already looks up. An owner-facing instruction must name the field that holds the described content.
**Dependencies:** none. Unblocks nothing.
**Verification:** content review — line 152 names `signature_record.occurrences` for the evidence
records and `disposition.occurrences` as the count.
**Impact if wrong:** an inaccurate field reference in an operator instruction; negligible, doc-only.

---

### RRR4 — Complete D-R2's reviewer enumeration (Finding D)

**What changes** in `docs/plans/plan-expert-dev-tools-remediation-r1.md` D-R2 (currently line 495):
add `WebFetch`/`WebSearch` to the reviewer's stripped-capabilities enumeration, so it reads
"(reviewer: edit power + WebFetch/WebSearch + Agent/Task/CORE-ingest, keeping Bash; …)" — matching §8
(updated in RR4) and the `expert-reviewer.md` frontmatter (§11 X13).
**Source:** design-record accuracy (the standard F3/RR4 invoked).
**Why this approach:** trivial — RR3 added WebFetch/WebSearch to the reviewer's denylist, so D-R2's
"strip only … (reviewer: edit power + Agent/Task/CORE-ingest)" is now an incomplete, inconsistent
enumeration; the record must match the code.
**Dependencies:** none. Unblocks nothing.
**Verification:** the D-R2 enumeration includes WebFetch/WebSearch, matching §8 and the frontmatter.
**Impact if wrong:** a stale design record; documentation-only.

## 8. Divergences from existing patterns

None. All four extend or correct existing `commands/expert.md` / plan-r1 text to conform to the
ledger schema, the spec, and the reviewer's actual denylist.

## 9. Checkpoints

- **CP1 — after RRR4:** run `node tests/structural/check-structure.mjs` and
  `node tests/unit/run-unit-tests.mjs`. Expect structural all-pass and unit 17/17 **unchanged** — this
  round touches only `commands/expert.md` (markdown, no test oracle) and a plan doc, so the suites must
  stay green (a regression would mean an unintended edit). Trigger: confirm no collateral change.

## 10. Decisions made during planning

- **D-RRR1 — STATUS open-feedback predicate over stored fields, no schema change.** Reasoning: the
  round-2 filter keyed on transient sweep verdicts (`systemic_defect`/`failed_correction`) that are
  never persisted (§11 X4); the schema stores `state` (`open`/`corrected`), `occurrences[].plugin_version`,
  and `correction.fixed_in_version` (§11 X2/X3), which are exactly what A-9(b) needs to compute a
  failed_correction — so the predicate is `state === "open"` OR (`corrected` with a recurrence
  occurrence at/after the fix version), and the command persists each recurrence as an occurrence.
  `sequentialthinking` thoughtHistoryLength 17–18.
- **D-RRR2 — approval resolves all prior unresolved intent escalations, not only the latest.**
  Reasoning: the workflow emits an intent escalation on every spec PASS, so a request-changes/re-run
  flow accumulates multiple; resolving only the latest leaves earlier ones falsely open (spec §8).

## 11. Verification of factual claims

Read-level evidence, this session (2026-07-23):
- **X1** — the STATUS bullet filters on "state is a live complaint (`systemic_defect` /
  `failed_correction`)". Read `commands/expert.md:106–109`. RRR1.
- **X2** — `signature_record.state` enum is `["open","corrected"]`. Read `scripts/ledger.schema.json:172–175`. RRR1.
- **X3** — `occurrences[].plugin_version` (`string|null`) and `correction.fixed_in_version` (`string`)
  are stored. Read `scripts/ledger.schema.json:157–187`. RRR1, D-RRR1.
- **X4** — `systemic_defect`/`failed_correction` are FEEDBACK_SCHEMA disposition `verdict` enum values
  computed at sweep time, not persisted on the record. Read `workflows/expert-lifecycle.js:162–180`. RRR1.
- **X5** — step 4's feedback-persistence bullet says "Persist … signature updates" without specifying
  occurrence appends. Read `commands/expert.md:94–100`. RRR1.
- **X6** — step 5 resolves the intent escalation only on approval (162–163); request-changes (159–161)
  re-runs without resolving; "any other gate → resolve" (165–167) is scoped to non-intent. Read
  `commands/expert.md:155–167`. RRR2.
- **X7** — `escalations[]` items are `{gate_type, segment, resolved}`. Read
  `scripts/ledger.schema.json:102–117`. RRR2.
- **X8** — step 5 line 152 says "the new evidence is the recurrence occurrence in
  `disposition.occurrences`". Read `commands/expert.md:152`. RRR3.
- **X9** — FEEDBACK_SCHEMA disposition `occurrences` is `{type:"integer"}` (a count). Read
  `workflows/expert-lifecycle.js:170–176`. RRR3.
- **X10** — the occurrence records (`{project, session_file, date, plugin_version}`) live in
  `signature_record.occurrences`. Read `scripts/ledger.schema.json:157–171`. RRR3, D-RRR1.
- **X11** — plan-r1 D-R2 (line 495) reviewer enumeration is "edit power + Agent/Task/CORE-ingest,
  keeping Bash" — omits WebFetch/WebSearch. Read `docs/plans/plan-expert-dev-tools-remediation-r1.md:491–498`. RRR4.
- **X12** — spec A-9(b): a `failed_correction` is a signature marked `corrected` recurring on a plugin
  version ≥ its fix version. Read `docs/specs/spec-expert-dev-tools.md:392–402`. RRR1, D-RRR1.
- **X13** — `expert-reviewer.md` `disallowedTools` now includes `WebFetch, WebSearch`. Read
  `agents/expert-reviewer.md:6`. RRR4.
- **X-blast** — the plugin's code files have 0 dependents (plan-r1 §11 V26); `commands/expert.md` and
  the plan `.md` are documents (not graph-tracked). §5.

No claim a step depends on lacks an entry.

## 12. Test specifications

No new or modified tests. RRR1/RRR2/RRR3 edit command markdown (an LLM-operator instruction with no
automated oracle; their runtime behavior is the deferred behavioral tier — A-9(b)/A-8 for RRR1, A-5
for RRR2). RRR4 edits a plan document. The existing suites (unit T-U1/T-U2 = 17; structural T-A1/T-A2)
are **unchanged** and are re-run at CP1 only to confirm no collateral regression — a green run there is
a regression check, not a new specification. This is not a behavior-changing code plan for which a test
would be expected; the behavior changes are in the deferred behavioral tier already specified in
`tests/ACCEPTANCE.md`.

## 13. Risks

- **R-1 — RRR1/RRR2 runtime behavior is not confirmed by the automated tier** (command markdown). The
  A-9(b)/A-8 (feedback visibility) and A-5 (resolution) behavioral runs are owner-gated. Mitigate: the
  predicate and resolution rules are stated exactly and derive only from stored fields.
- **R-2 — semver comparison in RRR1** is a command (LLM) operation, not code; a naive string compare
  would be wrong. Mitigate: the step states "compare as semantic versions" explicitly.
- **R-3 — convergence yellow flag** (count 3→4). Mitigate: this plan is four localized, exactly-specified
  fixes in two documents with no new code paths, minimizing the chance of a new defect; CP1 confirms no
  collateral regression.

## 14. Question register

- **Q-1 (bin-1) — re-open closed findings?** *Disposition:* no — verified closed; scope is A/B/C/D (§2).
  Closed.
- **Q-2 (bin-1) — does Finding A need a schema change to persist the verdict?** *Disposition:* no — the
  failed_correction condition is computable from `occurrences` + `correction` (§11 X3/X12); the command
  persists the recurrence occurrence (RRR1). Closed.
- **Q-3 (bin-1) — confirm A/B runtime now?** *Disposition:* no — deferred behavioral tier
  (A-9(b)/A-8/A-5); §13. Closed.
- **Q-4 (bin-1) — how does STATUS compute a failed_correction from stored data?** *Disposition:*
  `state === "corrected"` with an occurrence `plugin_version` ≥ `correction.fixed_in_version` (semver),
  = A-9(b) (D-RRR1). Closed.
- **Q-5 (bin-1) — resolve only the latest intent escalation on approval?** *Disposition:* no — resolve
  all prior unresolved intent entries for the lifecycle (D-RRR2). Closed.

**Reconciliation sweep:** two passes. Pass 1 surfaced Q-1…Q-5. Pass 2 walked every step, decision, and
verification entry and added zero. Zero open bin-1/bin-2 items.

## 15. Gaps acknowledged

No gaps — every decision is grounded in a named standard from §3, and every factual claim carries a
§11 read-level entry.

## 16. Post-completion

- Run `node tests/structural/check-structure.mjs` and `node tests/unit/run-unit-tests.mjs`; expect
  structural all-pass and unit 17/17 unchanged (CP1).
- Dispatch the round-4 independent review (neutral general-purpose subagent, expert-review) against the
  remediated branch and loop to PASS before the owner merges.
- After PASS, the owner-gated behavioral tier (A-3…A-9, incl. A-9(b)/A-8 for RRR1, A-5 for RRR2) is the
  remaining verification (install + tokens).
- `codegraph_diff_surface`: not applicable — no exported code surface changes (command markdown + one
  plan-doc edit).
- Follow-up: none beyond the standing deferred behavioral tier.
