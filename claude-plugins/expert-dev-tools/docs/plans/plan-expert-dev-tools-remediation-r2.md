# Plan — expert-dev-tools round-2 remediation

**Inputs:** the round-2 independent review (verdict NEEDS FIXES; relayed in session),
`docs/plans/plan-expert-dev-tools-remediation-r1.md`, `docs/specs/spec-expert-dev-tools.md`,
`docs/arch/architecture-expert-dev-tools.md` (owner-approved).
**Produced under:** the expert-plan process; output-contract §16; testing-standards.
**Date:** 2026-07-23. **Clear-Thought trace:** `sequentialthinking` thoughtHistoryLength 13–15 (Finding-1 design).

---

## 1. Goal

Close the three findings the round-2 independent review returned against
`plan-expert-dev-tools-remediation-r1.md`, so a round-3 review passes at zero findings. The nine
round-1 findings and RV are already closed and verified (green test tier) and are **not** re-opened.
The three: (F1, Serious) the command never surfaces `report.feedback_escalation` to the owner and the
`failed_correction` escalation lacks its A-9(b) content; (F2, Moderate regression) recorded
`escalations` are never marked `resolved`, so STATUS "open escalations" misrepresents state; (F3,
Minor) the reviewer inherits `WebFetch`/`WebSearch`, which are nameable and outside its instrument
roster. Success: the command presents feedback escalations with real content and no remediation
dispatch; STATUS shows only unresolved escalations; the reviewer denies `WebFetch`/`WebSearch`; and the
structural suite asserts the reviewer's denial — all verifiable against source and a green test run.

## 2. Scope

**In scope:** F1, F2, F3 and every artifact they touch — `commands/expert.md`,
`agents/expert-reviewer.md`, `tests/structural/check-structure.mjs`, and wording in
`docs/plans/plan-expert-dev-tools-remediation-r1.md` + `docs/arch/architecture-expert-dev-tools.md`
(F3 "tightest expressible boundary" → "tightest over the nameable tool set").

**Out of scope, with authority:**
- **The nine closed round-1 findings + RV** — verified closed by the round-2 review; not re-opened
  (register Q-1, review-directed).
- **Denying `WebFetch`/`WebSearch` on `expert-architect`/`expert-planner`** — the review's *tentative*
  suggestion, rejected on evidence (§4 / D-R2): expert-plan uses WebSearch+WebFetch as its documented
  Context7 doc-fallback (§11 W9), so denying there would degrade it. Register Q-4.
- **The behavioral tier (A-3…A-9 live runs), incl. Tentative T-a** (`transcript_dir` `~`/Windows
  resolution) — owner-gated; T-a is a runtime property already flagged as risk R-4 of plan-r1,
  confirmed at the deferred A-8 run (register Q-3). No code change.
- **The FEEDBACK_SCHEMA / ledger schema** — F1 is satisfiable from the existing `signature_record`
  fields (§11 W6); no schema change (register Q-2).

**Coverage reconciliation:**

| Finding | Step(s) |
|---|---|
| F1 command surfaces feedback escalation + A-9(b) content | RR1 |
| F2 escalations `resolved` flag | RR2 |
| F3 reviewer denies WebFetch/WebSearch | RR3 (agent+test), RR4 (wording) |
| T-a | out of scope (Q-3), noted §13 |

## 3. Standards that govern this plan

- **Spec F-14 / acceptance A-9(b)** — governs RR1: a `failed_correction` "escalates … with the
  original diagnosis and the applied fix … dispatches no remediation."
- **Spec §8 honesty-of-state NFR** — governs RR2: a `resolved` flag with no code path to flip it,
  feeding an "open escalations" view, misrepresents state.
- **OWASP ASVS V1 least privilege** — governs RR3: deny the nameable role-inappropriate tools.
- **Claude Code sub-agents reference** (Context7 `/websites/code_claude`, 2026-07-23) — governs RR3:
  `disallowedTools` accepts nameable tool names (§11 W11).
- **Architecture D3 single-writer / D15 two-store defect history** — governs RR1's capability split
  (only the command reads both signature stores).
- **ISO/IEC/IEEE 29119** (testing-standards, read this session) — governs the RR3 structural assertion.

## 4. Spec issues

None. One review suggestion vs. reality, closed (§2 / D-R2): the review tentatively suggested denying
`WebFetch`/`WebSearch` on architect/planner; expert-plan's own Step 4 uses them as the Context7
doc-fallback (§11 W9), so denying there degrades the agent. Resolved by scoping F3 to the reviewer,
whose roster excludes them (§11 W10). Not an open item.

## 5. Files affected

All **modified** (no new files, no deletions). Blast radius of the one graph-tracked changed file
(`tests/structural/check-structure.mjs`) is **0 dependents** (§11 W14; unchanged since the plan-r1
scan). `commands/expert.md` and `agents/expert-reviewer.md` are non-code documents.

- `commands/expert.md` (RR1, RR2)
- `agents/expert-reviewer.md` (RR3)
- `tests/structural/check-structure.mjs` (RR3)
- `docs/plans/plan-expert-dev-tools-remediation-r1.md` (RR4 — wording)
- `docs/arch/architecture-expert-dev-tools.md` (RR4 — wording)

**Documentation sync:** `codegraph_find_related_docs` is not re-run — the only graph-tracked change
(`check-structure.mjs`) has 0 dependents, and the two docs that reference the tool-scoping design
(plan-r1, the arch amendment) are themselves edited in RR4.

## 6. Foundation corrections

None separate from the findings. F2 is a regression introduced by plan-r1's own S-4 escalation
recording; it is corrected here (RR2), inside the same command.

## 7. Plan

Independent steps; ordered command-edits first, then agent+test, then wording.

---

### RR1 — Command surfaces the feedback escalation with A-9(b) content (F1)

**What changes** in `commands/expert.md`:
- **Step 5 — present `report.feedback_escalation`** (a new bullet, parallel to the gate presentation).
  When the report carries `feedback_escalation`:
  - `kind: "systemic_defect"` → present the attached `diagnosis` (root cause + correction draft) to
    the owner as an owner-owned item alongside whatever gate/completion the segment produced.
  - `kind: "failed_correction"` → present the **original diagnosis, the applied correction, and the
    new evidence, and dispatch NO remediation.** Assemble the content by looking up the escalation's
    `disposition.signature` in the store that holds it — the ledger `signature_history` for
    project-scoped signatures, or `${CLAUDE_PLUGIN_DATA}/defect-history.json` for shared-machinery
    signatures — and reading that record's `description` (the original diagnosis/problem) and
    `correction` (`{change, fixed_in_version, commit}` = the applied fix); the new evidence is the
    recurrence occurrence in `disposition.occurrences`. State plainly that the fix did not hold and
    that no automatic correction is being attempted (spec F-14).
- **Step 4 — STATUS renders open feedback signatures.** In the STATUS.md regeneration, render open
  `signature_history` entries and (read-only) the shared-machinery defect-store entries whose `state`
  is a live complaint (`systemic_defect`/`failed_correction`) as owner-facing items, so a feedback
  escalation is visible in STATUS, not only at the moment it is presented.

**Source:** spec F-14 / acceptance A-9(b); architecture D13/D15; the plan-r1 §2 coverage assigning S-3
to "R4 (workflow), R5 (command surfaces)."
**Why this approach — Gate 3:**
1. *Decision:* the command (not the workflow) presents and assembles the feedback-escalation content,
   from whichever signature store holds the matched signature.
2. *Standard:* architecture D3 single-writer + D15 two-store defect history — only the command has
   filesystem access, and shared-machinery corrections live in `${CLAUDE_PLUGIN_DATA}` which the
   sandboxed workflow cannot read.
3. *Why here:* the workflow already builds `feedbackEsc` and threads it via `report()` (§11 W4), but a
   `failed_correction`'s "original diagnosis + applied fix" lives in a stored signature record the
   workflow cannot reach for shared-machinery signatures — so the command must do the lookup and the
   presentation.
4. *NOT — and why:* NOT re-running the diagnostician on a `failed_correction` to regenerate the
   diagnosis (correction-doctrine rule 5 forbids re-entering the correction path — "one retry of a
   diagnosis is a loop"); NOT forcing the feedback escalation into the ledger `escalations` array (its
   `gate_type` enum is the six §3.4 gate types only, §11 W7 — a feedback escalation is none of them);
   NOT extending FEEDBACK_SCHEMA or the ledger schema (the `signature_record` already carries
   `description` + `correction`, §11 W6 — the content is assemblable without a schema change); NOT
   leaving it as a passive report field (the F1 defect — the owner never sees it).
**Dependencies:** none. Unblocks nothing.
**Verification:** content review — step 5 presents `feedback_escalation` for both kinds, the
`failed_correction` branch assembles description+correction+new-occurrence and dispatches no
remediation, and step 4 renders open feedback signatures in STATUS. Runtime confirmation is the
deferred A-9(b) behavioral run.
**Impact if wrong:** the F-14 owner-facing safety mechanism stays undelivered; bounded to the command
tier, recoverable. No code coupling (markdown instruction).

---

### RR2 — Escalations are marked resolved on owner answer (F2)

**What changes** in `commands/expert.md`:
- **Step 5 — resolve on answer.** When the owner answers a gate (intent approval in the S-5 advance
  bullet, and on each `/expert resume` that consumes a prior gate), set the matching
  `escalations` entry's `resolved: true` before the next ledger write (the entry appended in step 4
  for that segment's `gate_type`).
- **Step 4 — STATUS shows only open.** In the STATUS.md regeneration, render under "open escalations"
  **only** entries with `resolved === false`.

**Source:** spec §8 honesty-of-state NFR; the ledger `escalations.resolved` field (§11 W3).
**Why this approach — Gate 3:**
1. *Decision:* the command flips `resolved: true` when the owner answers the gate, and STATUS filters
   to `resolved === false`.
2. *Standard:* honesty of state (spec §8) — a state view must not claim more than is true; a
   `resolved` flag that is never set makes every answered gate read as still-open.
3. *Why here:* plan-r1's S-4 fix began recording `escalations` (round 1 left the array empty), so the
   never-resolved flag is a *new* misrepresentation this remediation introduced; it must be closed
   where it was opened.
4. *NOT — and why:* NOT dropping the `resolved` field (it is in the ledger schema and is the natural
   state marker); NOT resolving in the workflow (the workflow does not write the ledger — D3); NOT
   rendering all escalations in STATUS (that is the misrepresentation).
**Dependencies:** none (same file as RR1; independent bullets). Unblocks nothing.
**Verification:** content review — step 5 sets `resolved: true` on owner answer; step 4's STATUS
render filters to `resolved === false`. Runtime confirmation is the deferred A-5 behavioral run.
**Impact if wrong:** STATUS keeps misrepresenting escalation state; bounded, recoverable.

---

### RR3 — Reviewer denies WebFetch/WebSearch (F3)

**What changes:**
- `agents/expert-reviewer.md`: add `WebFetch, WebSearch` to `disallowedTools`, making it
  `disallowedTools: Write, Edit, NotebookEdit, WebFetch, WebSearch, Agent, Task, mcp__claude_ai_CORE_Memory__memory_ingest`.
- `tests/structural/check-structure.mjs`: in the `expert-reviewer` branch of T-A2b, add an assertion
  that `disallowedTools` includes `WebFetch` and `WebSearch`.

**Source:** OWASP ASVS V1 least privilege (plan-r1 §3); Claude Code sub-agents `disallowedTools`
semantics (§11 W11); expert-review instrument roster (§11 W10).
**Why this approach — Gate 3:**
1. *Decision:* deny `WebFetch`/`WebSearch` on the reviewer only, and assert it in the structural test.
2. *Standard:* OWASP ASVS V1 least privilege — deny every nameable capability the role does not need.
3. *Why here:* `WebFetch`/`WebSearch` are nameable and are **not** in expert-review's instrument
   roster (grep/Read/Context7/CodeGraph/RAG/test-runner/Clear-Thought, §11 W10), so denying them on
   the reviewer is zero capability loss — tightening the boundary the plan-r1 amendment claimed.
4. *NOT — and why:* NOT denying them on `expert-architect`/`expert-planner` — expert-plan Step 4 uses
   WebSearch (find the doc URL) + WebFetch (fetch it) as its documented Context7 fallback (§11 W9), so
   denying there degrades a real instrument (the exact degradation the owner directed against); NOT a
   `tools` allowlist on the reviewer (it still needs the un-nameable host CodeGraph/RAG — the plan-r1
   D-R2 constraint stands).
**Dependencies:** none. Unblocks CP1.
**Verification:** `node tests/structural/check-structure.mjs` — the reviewer's new denial assertion
passes; the full suite stays green.
**Impact if wrong:** an over-broad reviewer surface persists (minor) or a mis-asserted test; caught by
the suite.

---

### RR4 — Soften the "tightest expressible boundary" wording (F3 doc-sync)

**What changes:** in `docs/plans/plan-expert-dev-tools-remediation-r1.md` (§8 Divergences and the D-R2
decision) and `docs/arch/architecture-expert-dev-tools.md` (the 2026-07-23 amendment), replace the
claim that the denylist is "the tightest expressible boundary" with "the tightest boundary over the
**nameable** tool set (the un-nameable host MCP namespace cannot be enumerated to deny)," and note
that `WebFetch`/`WebSearch` are denied on the reviewer.
**Source:** F3; accuracy of the design record (the round-2 review flagged the wording as overclaiming).
**Why this approach:** trivial — a design record must not overclaim; "tightest expressible" was false
while `WebFetch`/`WebSearch` remained nameable-but-undenied.
**Dependencies:** RR3 (records RR3's tightening). Unblocks nothing.
**Verification:** the two docs state the softened wording and the reviewer's WebFetch/WebSearch denial.
**Impact if wrong:** a stale record overclaims least-privilege; documentation-only.

## 8. Divergences from existing patterns

None new. RR1/RR2 extend `commands/expert.md`'s existing single-writer pattern; RR3 tightens the
existing reviewer denylist; RR4 corrects wording. The plan-r1 divergences (hybrid scoping; reviewer
keeps Bash; RV) are unchanged and not re-opened.

## 9. Checkpoints

- **CP1 — after RR3:** run `node tests/structural/check-structure.mjs` and
  `node tests/unit/run-unit-tests.mjs`. Expect structural all-pass (incl. the reviewer's new
  WebFetch/WebSearch denial) and unit 17/17 unchanged. Trigger: structural-to-behavioral boundary.
  RR1/RR2 are command-markdown edits whose oracle is content review (their Verification fields); RR4
  is documentation.

## 10. Decisions made during planning

- **D-R1 — Finding 1 is command-only; the command assembles the failed_correction content from the
  signature store; no schema or workflow change.** Reasoning: the workflow already builds and threads
  `feedbackEsc`, but the "original diagnosis + applied fix" lives in a stored `signature_record`
  (`description` + `correction`) that, for shared-machinery signatures, sits in
  `${CLAUDE_PLUGIN_DATA}` which the sandboxed workflow cannot read (D3/D15). Only the command reads
  both stores, so it does the lookup and presentation. The existing `signature_record` fields suffice
  (§11 W6), so no schema change. `sequentialthinking` thoughtHistoryLength 13–15.
- **D-R2 — F3 is reviewer-scoped, not architect/planner.** Reasoning: expert-plan Step 4 uses
  WebSearch+WebFetch as its documented Context7 doc-fallback (§11 W9), so denying them there degrades
  a real instrument — contrary to the owner's standing "do not degrade an agent" directive; the
  reviewer's roster excludes them (§11 W10), so denying there is zero-loss. The review's "consider
  architect/planner" was tentative; verified and rejected.
- **D-R3 — the feedback escalation is surfaced via `report.feedback_escalation` + STATUS signatures,
  not the ledger `escalations` array.** Reasoning: the `escalations.gate_type` enum is the six §3.4
  gate types only (§11 W7); a feedback escalation is owner_owned and rides a gate rather than being
  one, so it is presented and rendered from `signature_history`/defect-store, keeping the F2
  `escalations`-resolved fix cleanly separate.

## 11. Verification of factual claims

Read-level evidence, this session (2026-07-23):
- **W1** — `commands/expert.md` step 5 (108–146) presents the gate, `findings`, and the S-5 intent
  advance, but **not** `feedback_escalation`. Read `commands/expert.md:108–146`. RR1.
- **W2** — step 4 mentions `feedback_escalation` only to persist signature updates (94–95), not to
  surface it. Read `commands/expert.md:94–95`. RR1.
- **W3** — step 4 appends `escalations` `{gate_type, segment, resolved: false}` (89–91); step 5 has no
  resolution instruction. Read `commands/expert.md:89–91, 108–146`. RR2.
- **W4** — the workflow builds `feedbackEsc` (failed_correction / systemic_defect) and threads it via
  `report()` onto every terminal report. Read `workflows/expert-lifecycle.js` (feedbackEsc block ~304–311; `report()` ~266–271). RR1.
- **W5** — `FEEDBACK_SCHEMA` disposition items are `{signature, occurrences, verdict,
  responsible_component}` — no diagnosis/correction fields. Read `workflows/expert-lifecycle.js:162–180`. RR1.
- **W6** — `ledger.schema.json` `$defs.signature_record` has `description` and `correction`
  `{artifact, change, fixed_in_version, commit}`. Read `scripts/ledger.schema.json:148–189`. RR1, D-R1.
- **W7** — `escalations[].gate_type` enum is exactly `[intent, spec_traceable, business,
  risk_override, non_convergence, core_approval]`. Read `scripts/ledger.schema.json:108–114`. D-R3.
- **W8** — `expert-reviewer.md` `disallowedTools` = `Write, Edit, NotebookEdit, Agent, Task,
  <CORE-ingest>` — no WebFetch/WebSearch. Read `agents/expert-reviewer.md:5`. RR3.
- **W9** — expert-plan verifies libraries via "Context7 … or direct fetch-and-read of the
  authoritative documentation (search permitted only to find the URL, fetch that page)" — i.e.
  WebSearch + WebFetch. Read `skills/expert-plan/SKILL.md:210–211` (+ Step 4 direct-fetch path). §4, D-R2.
- **W10** — expert-review's instrument roster is "grep, Read, Context7, CodeGraph, codebase RAG, test
  runner, Clear Thought" — WebFetch/WebSearch absent. Read `skills/expert-review/SKILL.md:247`. RR3, D-R2.
- **W11** — `disallowedTools` accepts nameable tool names (built-ins named directly). Context7
  `/websites/code_claude` /sub-agents "Available tools" (this session, plan-r1 §11 V5). RR3.
- **W12** — shared-machinery signatures live in `${CLAUDE_PLUGIN_DATA}/defect-history.json`; the
  orchestrator is sandboxed (no fs). Architecture D15; `workflows/expert-lifecycle.js` (no fs;
  plan-r1 §11 V25). D-R1.
- **W13** — plan-r1 §8 and D-R2, and the arch 2026-07-23 amendment, use the phrase "tightest
  expressible boundary." Read `docs/plans/plan-expert-dev-tools-remediation-r1.md` §8/§10 (D-R2);
  `docs/arch/architecture-expert-dev-tools.md` (amendment, first bullet). RR4.
- **W14** — blast radius of `tests/structural/check-structure.mjs` is 0 dependents (plan-r1 §11 V26;
  no import change since). RR3.

No claim a step depends on lacks an entry.

## 12. Test specifications

- **T-RR3 — reviewer WebFetch/WebSearch denial (integration/structural).** *Behavior:* the reviewer
  agent's `disallowedTools` denies `WebFetch` and `WebSearch` (in addition to the plan-r1 assertions).
  Traces RR3, OWASP ASVS V1. *Level:* structural (real frontmatter read; no tokens). *Real/double:*
  all real; no double. *Data:* the edited `expert-reviewer.md`. *Must NOT / fail:* must not assert on
  the other agents' WebFetch (they legitimately keep it); **fails** if the reviewer's `disallowedTools`
  omits `WebFetch` or `WebSearch`. *Technique:* the existing T-A2b per-agent assertion set, extended.
- **RR1/RR2 have no automated test** — they are command-markdown instructions whose runtime behavior
  is the deferred behavioral tier (A-9(b) for RR1; A-5 for RR2). Their build-time verification is the
  content review named in each step. The unit and structural suites are otherwise unchanged (unit
  17/17; structural all-pass + T-RR3).

## 13. Risks

- **R-1 — RR1/RR2 runtime behavior is not confirmed by the automated tier.** They are command
  instructions; A-9(b) (feedback escalation presented, no remediation) and A-5/resume (resolved flag)
  are the deferred owner-gated runs. Mitigate: each step states the exact expected behavior.
- **R-2 — Tentative T-a (transcript_dir `~`/Windows resolution)** remains a runtime property (plan-r1
  risk R-4), confirmed at the deferred A-8 run. Not addressed here (out of scope, Q-3).
- **R-3 — No coupling risk:** the one graph-tracked change (`check-structure.mjs`) has 0 dependents.

## 14. Question register

- **Q-1 (bin-1) — re-open the nine closed findings?** *Disposition:* no — the round-2 review verified
  them closed; scope is F1/F2/F3 only (§2). Closed.
- **Q-2 (bin-1) — does F1 need a FEEDBACK_SCHEMA / ledger schema change?** *Disposition:* no — the
  `signature_record` already carries `description` + `correction` (§11 W6); the command assembles from
  them (D-R1). Closed.
- **Q-3 (bin-1) — address Tentative T-a now?** *Disposition:* no — runtime property, already risk R-4,
  confirmed at the deferred A-8 run (§13). Closed.
- **Q-4 (bin-1) — deny WebFetch/WebSearch on architect/planner too (review's tentative suggestion)?**
  *Disposition:* no — expert-plan uses them as its Context7 doc-fallback (§11 W9); denying degrades it;
  reviewer-only (D-R2). Closed.
- **Q-5 (bin-1) — surface the feedback escalation via the ledger `escalations` array?** *Disposition:*
  no — enum mismatch (§11 W7); surfaced via `report.feedback_escalation` + STATUS signatures (D-R3).
  Closed.
- **Q-6 (bin-1) — does F1 require a workflow change?** *Disposition:* no — the workflow already builds
  and threads `feedbackEsc` (§11 W4); the gap is command-side presentation + content lookup (RR1).
  Closed.

**Reconciliation sweep:** two passes. Pass 1 surfaced Q-1…Q-6. Pass 2 walked every step, decision,
test spec, and verification entry and added zero new entries. Zero open bin-1/bin-2 items.

## 15. Gaps acknowledged

No gaps — every decision is grounded in a named standard from §3, and every factual claim carries a
§11 read-level entry.

## 16. Post-completion

- Run `node tests/structural/check-structure.mjs` and `node tests/unit/run-unit-tests.mjs`; expect
  structural all-pass (incl. T-RR3) and unit 17/17 (CP1).
- Dispatch the round-3 independent review (neutral general-purpose subagent, expert-review) against the
  remediated branch and loop to PASS before the owner merges.
- After PASS, the owner-gated behavioral tier (A-3…A-9, incl. A-9(b) for RR1, A-5 for RR2, A-8 for
  T-a) is the remaining verification (install + tokens).
- `codegraph_diff_surface`: not applicable — no exported code surface changes (the changes are
  markdown instructions + one agent frontmatter + one test assertion).
- Follow-up: none beyond the standing deferred behavioral tier.
