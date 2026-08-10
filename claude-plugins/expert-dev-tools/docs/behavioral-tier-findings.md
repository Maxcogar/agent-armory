# Behavioral-tier findings — expert-dev-tools (first live runs)

> **Remediation status — updated 2026-08-09.** Every finding in this document has
> been remediated by [`plan-expert-dev-tools-behavioral-remediation.md`](../plans/plan-expert-dev-tools-behavioral-remediation.md), whose steps are named per item below. This
> document remains the **record of what the first live runs observed**; it is not
> rewritten to describe the current code. Read it for what was found and why, and
> read the plan for what was changed.
>
> | Finding | Closed by | What changed |
> |---|---|---|
> | B9 / B9b (correction is re-derivation) | S4, S5, S6 | new `expert-correct` skill and `expert-corrector` agent (granted `Edit`, denied `Write`); the three document gates remediate through it |
> | B9c (a finding the corrector cannot satisfy) | S15b | the `CORRECTOR_HALTED` path — a halted correction escalates instead of burning the round cap |
> | B1 (`stale_deployment` has no path to the owner) | S18 | escalation branch in the workflow; STATUS predicate and presentation in `commands/expert.md` |
> | B2 (no occurrence dedupe key) | S19 | occurrences upsert on `(project, session_file)` |
> | B5 (A-4c fixture mis-describes itself) | S21 | the fixture's self-description corrected from two-way to three-way |
> | B6 (artifacts not registered on escalation) | S17 | the spec artifact registers **before** its gate, matching architecture and plan |
> | B7 (the workflow's `specPath` is a guess) | S10 | the returned `artifact_path` is authoritative; all path defaults deleted, in the workflow and the command |
> | B8 (no scope control on document phases) | S20 | a verifier scope check after each document gate; the verifier's job list extended to four |
> | B10 (the plan gate never receives its output contract) | S8, S9 | remediated as a **four-gate** defect: every review dispatch names a ruler, and each gate with an output contract cites it |
> | B3 (A-8 contradicts F-14) | S22 | A-8 corrected — the non-complaint turn is discarded, not classified |
> | B4 (EVIDENCE cannot separate observed from asserted) | S22 | `observed`/`asserted` split plus a cross-entry consistency check; sampling constant unchanged |
>
> Two mechanisms were added that no single finding named: correction failure is
> now **detected** (S6b — fix-site regression and unclosed class sweep), and every
> agent's return contract is **bound** to the schema the workflow reads (S2b).


**Date:** 2026-07-28. **Plugin version:** 0.1.0, installed and enabled (`/reload-plugins`).
**Context:** the plugin had passed independent review at the static tier (round-5 PASS, PR #50)
but had **never executed**. These are the findings from the first real runs of the behavioral
acceptance tier — the plugin's own agents, workflow, and scripts, exercised against the fixtures.

Every finding below was observed in a live run, not derived by reading code.

---

## What was run, and what passed

| Criterion | What it exercises | Result |
|---|---|---|
| **A-8** | repeat-complaint detection (self-improve) | **PASS** — detected the planted "TODO placeholder" complaint across both fixture sessions, clustered to one signature, classified `systemic_defect`, named the planner; correctly discarded the non-complaint turn |
| **A-4b** | anti-fabrication spot re-run | **PASS** — caught the planted citation (`match:false`; observed exit 1, `farewell('Max')` returns `"Goodbye, Max!"` not the claimed `'FAREWELL, MAX'`), confirmed the genuine one; also flagged the evidence array as internally self-contradictory |
| **A-9(b)** | failed correction | **PASS** — running 0.1.0 ≥ fix 0.1.0 → `failed_correction`, **no remediation dispatched**; verified the fix is genuinely present in the installed copy rather than trusting the store |
| **A-9(c)** | stale deployment | **PASS** — running 0.1.0 < fix 0.3.0 → `stale_deployment`, no remediation; corroborated by grepping the running agent file and confirming the correction is absent |
| **A-4a** | diff-vs-plan | **PASS** — caught `UNAUTHORIZED.txt`, confirmed the authorized file, checked the reverse direction; noted detection required `--untracked-files` (a plain `git diff` would have falsely passed) |
| **A-4c** | seeded spec contradiction | **PASS** — the planner **halted** with `spec_traceable` rather than machine-resolving; found the contradiction is three-way, not the two the fixture describes; rejected both a partial plan and an owner-parameterized plan |
| **A-7** | diagnosis quality | **PASS — but see the caveat below** — root cause named the planted defect (the fault-injection role supplying a document-literal result), not the symptom; refused downstream patches; classified the verification mechanisms must-not-change; corrected a misattribution in the failure record it was handed |

> **Caveat added 2026-07-31.** The run's own diagnostician found the diagnosis dispatch is
> **evidence-starved by construction** — `diagnose()` has no parameter for the failure record, and
> five of eight call sites discard evidence live in scope (`docs/investigate.md` §7). That defect is
> common to **three of the four A-4 runs**, so any A-4a / A-4b result recorded as PASS *on diagnosis
> quality* is **unverified** until re-run after the fix. The A-7 row above is not withdrawn — the
> diagnosis it grades was genuinely sound — but the criterion has not been tested on the paths where
> the dispatch is starved.
| **A-3 seg. 1** | end-to-end, first segment | **DID NOT REACH THE INTENT GATE** — see B9. Machinery worked; the lifecycle did not converge |

**Confirmed working inside the real A-3 run** (14 agents, 1,565,320 subagent tokens, ~2.1 h):
the orchestrator executed and returned a terminal `SEGMENT_REPORT` carrying `ledger_delta`,
`review_records`, `feedback`, `feedback_escalation`, `outcome`, `gate`; the **S-3** feedback
escalation fired end-to-end (sweep → diagnostician → diagnosis attached as
`feedback_escalation.kind = "systemic_defect"`); **RV** `review_records` carried all five rounds'
full findings rather than counts; the round cap escalated `non_convergence` instead of accepting by
exhaustion; budget captured (637,264). **Zero repo pollution** (agent-armory changed-file count
15 before and after).

---

## Findings

### B9 (Serious — viability) — the spec review loop does not converge on a trivial task  
**REMEDIATED** — closed by S4, S5, S6 (+ S6b detection, S15b halt path). See the plan for the change and its verification.

- **Observed:** on the fixture task ("add a `farewell(name)` function to `greeter.js` mirroring
  `greet`, and a unit test"), the spec review loop ran all five rounds and never reached zero
  findings: **7 → 6 → 6 → 3 → 2** (24 findings total). The cap tripped and the segment returned
  `non_convergence`. The intent gate — the first owner gate, and the whole point of segment 1 —
  was never reached.
- **The final round was not cosmetic.** Round 5 left a **Systemic**-class finding and a Minor one
  open. The findings throughout were genuine (unverified source citations; a false premise about
  Node.js module resolution, which a reviewer falsified via Context7 *and* by executing the
  runtime; an unpinned Node version behind a version- and flag-gated behavior).
- **Cost:** ~1.57 M subagent tokens and ~2.1 hours of wall clock for one segment that produced no
  owner-approved artifact.
- **Why it matters:** PASS requires zero findings of any severity (binary verdict, spec §3.3), and
  the cap is 5 (architecture D5.5). If a `farewell()` spec cannot clear the gate, real work is
  likely to dead-end at `non_convergence` routinely — converting the lifecycle's central quality
  mechanism into a systematic stall.

**Root cause — the remediation path, not the review bar.** An earlier draft of this document
framed B9 as an owner calibration decision (raise the cap / lower the bar / restrict scope). That
framing was premature and is **retracted**. Examining the per-round finding set shows two distinct
failure modes, both mechanical:

1. **Churn (rounds 1–3): the findings are largely novel each round** — different line ranges and
   different subjects, not a burn-down of a fixed list. The loop uses a **fresh reviewer each
   round** (`expert-lifecycle.js:220`; architecture D5) evaluating a document the authoring agent
   **rewrote** rather than surgically corrected. Each independent reader therefore surfaces a
   different slice of the defect space. The effective bar is not "satisfy a reviewer" but "satisfy
   the union of what any rigorous reviewer might find" — which a rewrite-per-round loop does not
   converge on.

   **Amended 2026-07-31 — "almost entirely novel" was overstated.** Read against the journal,
   several classes recur across R1–R3: unstated version assumptions **three times** (R1, R2, R3),
   the document describing itself **twice** (R1 Moderate, R3 Systemic-Moderate), and
   current-documentation verification **twice** (R1 Serious-Systemic, R3 Minor). The churn is real
   but partial.

   **And the driver is now identified.** All six R3 findings, and most of R1's, are graded against
   clauses of **`expert-spec/SKILL.md` itself** — the source test, the abstraction test, "no line
   describes the document itself", "State version assumptions explicitly", "File paths and external
   references are confirmed". The reviewer's ruler is the authoring skill, a long prose document
   with dozens of quotable clauses, which makes it an **unbounded finding source**: a fresh reader
   can always locate another clause the spec does not perfectly satisfy. This is the same mechanism
   the APS Fusion architecture cycle recorded over twenty rounds. See `docs/investigate.md` §4a.
2. ~~**Stall (rounds 4–5): the same two findings appear twice**~~ — **RETRACTED 2026-07-31.**
   Read against the run journal (`wf_f5f5ff93-f13`, reviewers R4 `ae17bbc3a73b389d7` and R5
   `a1a27e6d54a51b65e`), **rounds 4 and 5 share no finding.** R4: the dispatched review path
   resolves to nothing (Serious); `.claude/expert/` is empty, no review record persisted
   (Moderate); `scratch-note.txt` unaccounted for in the spec (Moderate). R5: ISO/IEC/IEEE 29148
   "Traceable" compounded by quotation fidelity (Systemic); "Consistent" — `scratch-note.txt`
   described as both read and not-read (Minor).

   The actual round-4→5 phenomenon is a **fix-site regression**: the writer added a
   `scratch-note.txt` paragraph to close R4's Moderate, and that new paragraph contradicted
   itself, producing R5's Minor. Same class the APS Fusion architecture cycle hit three times —
   verifying only the half of the record that supports the edit. See `docs/investigate.md` §4b.

**Three machinery defects produce this, and all are fixable:**

- ~~**B9a — the findings schema has no field for the prescribed fix.**~~ **RETRACTED — owner
  ruling, 2026-07-28.** *"The reviewer has no business writing any part of a spec. Its job is to
  state what is wrong; the writer's job is to make it correct. There is no missing 'prescribed fix'
  field, and the reviewer must not be given one."* The proposed remedy is rejected and must not be
  implemented.

  **The underlying observation stands, re-diagnosed.** `VERDICT_SCHEMA.findings` items are
  `{classification, standard, premise_evidence, location}` (`expert-lifecycle.js:96-112`), and
  reviewers did improvise prescriptions into the **`standard`** field — confirmed across round 1's
  findings ("CORRECT: pin…", "CORRECT: add the whitespace-only case to FR-5's minimum…"). Under the
  owner's ruling that is **a reviewer-discipline defect, not a schema gap**: the reviewer is
  overstepping its role, and the fix is to constrain the reviewer, not to widen the schema to
  accommodate it. The `standard` field is for the standard the finding was judged against.
- **B9b — the revise path reuses the *authoring* skill, with no correction discipline.** The
  dispatch is a single line — `Revise the spec at ${specPath} to resolve these findings, then
  re-verify: ${JSON.stringify(findings)}` (`expert-lifecycle.js:331`) — sent to `AGENT.spec`,
  whose skill (`expert-spec`) is a write-a-spec-from-scratch discipline. There is no
  "correct an existing artifact against findings" skill anywhere in the plugin. By contrast
  `expert-implement` is an entire skill devoted to faithfully executing a plan without collateral
  change. The correction path — which runs up to 5× per gate, on every phase — got one sentence.
  This is the plausible driver of the round-1–3 churn: an authoring skill rewrites; it does not
  patch.
- **B9c — a finding that the writer cannot act on has no escape hatch.** **Its stated evidence is
  withdrawn (2026-07-31):** rounds 4 and 5 do *not* show a finding persisting unfixed — they share
  no finding at all (see the retraction above). The loop does count rounds rather than per-finding
  progress, and that remains true by inspection of `runGate`; but **this run does not demonstrate
  the failure**, and the claim must not be carried forward as observed. What the run *does* show is
  adjacent and arguably worse: R5's Systemic finding was one the writer was **structurally unable
  to satisfy** — closing it required fetching documentation it had no tool to fetch
  (`docs/investigate.md` §4e). A per-finding escape hatch is still worth having; its justification
  is the unactionable finding, not a repeat one.

**Owner decision that remains** (narrowed): whether the round cap and zero-findings bar still need
recalibration *after* B9a–B9c are fixed. That question should be re-asked against a repaired loop,
not answered now — changing the cap against the current machinery would buy more churn, not
convergence.

### B1 (Serious) — `stale_deployment` has no path to the owner  
**REMEDIATED** — closed by S18. See the plan for the change and its verification.

- **Observed:** A-9(c) computes the verdict correctly, then it goes nowhere. The workflow builds a
  `feedback_escalation` only for `failed_correction` and `systemic_defect`
  (`workflows/expert-lifecycle.js`, the `feedbackEsc` block), so `stale_deployment` produces none;
  it also fails the STATUS predicate in `commands/expert.md` (which surfaces `state: "open"`
  records, or `corrected` records with an occurrence at/above `fixed_in_version` — a stale record's
  occurrences sit *below* it, matching neither branch); and step 5 presents `feedback_escalation`
  but never the plain `feedback` dispositions array.
- **Consequence:** A-9(c) can pass on the verdict while the owner never learns their plugin is
  behind — and "update the plugin" is the entire action that verdict exists to produce (spec F-14).
- **Note:** the STATUS predicate is from the round-3 remediation (RRR1); this gap is partly mine.

### B6 (Serious) — artifacts are not registered when a phase escalates  
**REMEDIATED** — closed by S17. See the plan for the change and its verification.

- **Observed:** the A-3 run returned `ledger_delta.artifacts: []` even though the spec document was
  written to disk. `delta.artifacts.push({role:'spec', path: specPath})` executes only on the spec
  **PASS** path; the `non_convergence` return happens before it.
- **Consequence:** D9 hash anchoring, approval tracking, and amendment detection never see an
  artifact produced by a phase that escalated — precisely the case where the owner most needs the
  artifact registered and hashed. The S-4 remediation is incomplete on the escalation paths.

### B7 (Serious) — the spec dispatch passes no target path; the workflow's `specPath` is a guess  
**REMEDIATED** — closed by S10. See the plan for the change and its verification.

- **Observed:** the spec dispatch is `Write the specification for this task.\nTask: ${task}` — it
  never tells the agent where to write. The writer produced
  `docs/specs/spec-greeter-farewell.md`; the workflow's `specPath` (used verbatim in every
  downstream reviewer dispatch: "Review the spec at `${specPath}`") said
  `docs/specs/spec-farewell.md`. **The two never matched for the whole run.**
- **Consequence:** every review dispatch cited a path that does not exist. Any path-based mechanism
  (artifact registration, D9 hashing, spec-hash escalation) would operate on the wrong path.
  Downstream phases (architecture, plan) read `${specPath}` too.
- **Correction (2026-07-31) — the defect was *not* masked.** An earlier draft said "the reviewers
  adapted and found the real file — masking the defect." Round 4's reviewer raised it explicitly as
  a **Serious** finding: *"round 4 was dispatched against a path that resolves to nothing"*, with
  evidence (the dispatched path returned "File does not exist"; the directory holds exactly one
  entry, `spec-greeter-farewell.md`). The review tier surfaced it correctly. What failed is that
  **nothing downstream consumed it** — the finding went back to the spec-writer, which does not own
  `specPath`, so the only agent able to act on it never saw it. `PHASE_SCHEMA.artifact_path` exists
  and is still not read.
- **Root shape:** the workflow treats the artifact path as an input it dictates, while the agents
  treat it as an output they choose. One of the two must yield: either the dispatch carries the
  path as an instruction, or the workflow takes the returned `artifact_path` as authoritative
  (`PHASE_SCHEMA` already has that field — it is simply not consumed).

### B10 (Serious) — the plan review gate never receives the plan's output contract  
**REMEDIATED** — closed by S8, S9. See the plan for the change and its verification.

- **Found by the plugin's own diagnostician**, tracing the planted A-8 complaint to its root cause,
  and independently verified against source.
- **Observed:** the rule "no plan step may defer a decision" is stated four times
  (`expert-plan/SKILL.md:308`; `references/output-contract.md:15` and `:68`;
  `agents/expert-planner.md:19-21`) — but all four execute *inside the planner*, and Gates A/B/C are
  explicitly the planner's own pre-delivery self-check. The independent gate that would catch a
  self-audit miss is dispatched as "Review the plan at `${planPath}` against the spec and
  architecture and named standards" — the plan's own output contract is never named; and
  `expert-review`'s upstream-contract step covers only the spec's acceptance criteria and the
  architecture's design decisions.
- **Consequence:** a planner self-audit miss on its most important rule is *structurally
  unobservable* to the pipeline. The reviewer is not told to look, and no deterministic check exists.

### B2 (Moderate) — no occurrence dedupe key  
**REMEDIATED** — closed by S19. See the plan for the change and its verification.

- **Observed:** `commands/expert.md` step 4 instructs appending a new `occurrences[]` entry whenever
  a disposition reports a recurrence, with no dedupe key. Re-sweeping the same transcripts inflates
  the count: in the A-9 runs one diagnostician reported `occurrences: 4` while another correctly
  deduped to 2 for identical input.
- **Fix direction:** dedupe on `(project, session_file)`; a marker reset must not double-count
  history already recorded.

### B8 (Moderate) — document phases have no mechanical scope control  
**REMEDIATED** — closed by S20. See the plan for the change and its verification.

- **Observed:** the spec phase created a stray `scratch-note.txt` in the project tree (the file's
  own content admits it: "STRAY ARTIFACT - SAFE TO DELETE. Created in error by the spec phase").
- **Accurate framing:** a spec **reviewer did catch it** (Moderate finding, round 4), so the review
  loop is not blind here. But the *mechanical* scope control — diff-vs-plan — runs only after
  implementation, so document phases rely entirely on a reviewer noticing. A phase that writes
  outside its deliverable is otherwise unconstrained.

### B3 (Minor, owner-owned) — `ACCEPTANCE.md` A-8 contradicts F-14  
**REMEDIATED** — closed by S22. See the plan for the change and its verification.

- **Observed:** A-8 states the single-occurrence "ok run the tests now" turn should classify as a
  `course_correction`. F-14 scopes the sweep to "statements where the owner flagged a problem," and
  that turn flags no problem — the correct behavior is to discard it. **Two independent
  diagnosticians** reached that conclusion and explicitly refused to adopt the document's
  expectation ("a claim in a prior artifact is a candidate, not a finding").
- **Owner-owned by doctrine:** the target is an acceptance criterion, and the machine may never
  weaken its own ruler. Either A-8's wording changes, or F-14 must state that non-complaint course
  corrections are also swept. The two cannot both stand.

### B4 (Minor, owner-owned) — the EVIDENCE schema cannot distinguish observed from asserted  
**REMEDIATED** — closed by S22. See the plan for the change and its verification.

- **Observed:** `EVIDENCE` requires four free-form strings (`claim_type`, `tool`, `citation`,
  `result`) with no field separating verbatim observed output from asserted outcome, and no
  cross-entry consistency constraint. In A-4b the fabricated entry was **self-refuting** — index 1's
  claimed value contradicted index 3's accurate description of the same function — and that
  contradiction was detectable at zero re-execution cost, but nothing checks for it.
- **Sampling context:** spot-check coverage is `max(2, ceil(0.1n))` — 2/5 here, 2/20 at n=20 — so a
  fabrication off the sampled indices survives this control entirely.
- **Owner-owned by doctrine:** every candidate target (output schema, sampler, gate) is a
  verification mechanism.

### B5 (Minor) — the A-4c fixture spec mis-describes its own contradiction  
**REMEDIATED** — closed by S21. See the plan for the change and its verification.

- **Observed:** `tests/fixture/spec/spec-contradictory.md` frames the seeded conflict as two-way
  (R-1 uppercase vs R-2 lowercase). The planner found it is **three-way**: the same spec's "mirrors
  `greet`" clause and `TASK.md` both imply mixed case, so R-1 and R-2 each contradict those too.
- **Consequence:** minor — the fixture still triggers the control it exists to trigger; but its
  self-description would mislead a reader, and the fixture is mine (round-1 remediation).

---

## What remains untested

- **A-3 segments 2+** (architecture → plan → implement → review panel → ground truth → closeout) —
  blocked behind B9: no spec has converged, so no approved artifact exists to advance.
- **A-5 (resume)** — requires a completed segment to resume from; same blocker.
- **A-6 (owner-facing language)** — partially observable (the gate payloads collected are structured
  and legible), but the command tier's F-9 translation to owner-facing prose has never run, because
  `/expert` itself has not been invoked — every run so far drove the workflow and agents directly.
- **A-1 / A-2** — effectively demonstrated: all nine agents, nine skills, the command, and the
  plugin MCP servers resolved on `/reload-plugins`, and the structural suite covers the rest.

## Severity summary

| Severity | Findings |
|---|---|
| Serious | B9 (= B9a + B9b + B9c, the remediation path), B1, B6, B7, B10 |
| Moderate | B2, B8 |
| Minor | B3 (owner-owned), B4 (owner-owned), B5 |

Two findings (B3, B4) are **owner-owned by the correction doctrine** — they target an acceptance
criterion and a verification mechanism, which the machine may not weaken on its own authority.

**Amended 2026-07-31.** B9a is **retracted** by owner ruling — no prescribed-fix field is to be
added. B9c's stated evidence is **withdrawn** (rounds 4–5 share no finding); the defect may be real
but this run does not show it. **B9b is confirmed by measurement**, not inference: eleven `Write`
calls and **zero** `Edit` calls across all six spec-writer dispatches. A third mechanism, not in the
original B9 account, is now evidenced — the reviewer grades against `expert-spec/SKILL.md`'s own
clauses, an unbounded ruler (`docs/investigate.md` §4a). Of the B9 family, **B9b is the one with
both confirmed evidence and an unblocked remedy.**

**Origin split** (verified against `git diff f6ae830 20255c3`): **6 original** — B9 (the review
loop and its constants, incl. B9a/B9b dispatch lines and `ROUND_CAP`, all untouched by
remediation), B7, B10, B8, B3, B4. **4 from the remediation rounds** — B6 and B1 are *incomplete*
corrections of original defects (artifacts registered only on PASS paths; 2 of 4 feedback verdicts
routed), B2 and B5 are defects introduced outright. The behavioral tier found mostly original
defects that five rounds of static review never surfaced.

## Recommended sequence

1. **Restore the documentation instruments first.** The plugin's bundled `context7` server is
   **skipped at load** — Claude Code deduplicates on command/URL, and the standalone `context7`
   plugin declares a byte-identical `npx -y @upstash/context7-mcp`. So
   `mcp__plugin_expert-dev-tools_context7__*` registers **zero tools**, and the four agents whose
   only documentation grant names it (`expert-spec-writer`, `expert-implementer`,
   `expert-verifier`, `expert-diagnostician`) have none; `expert-acceptance` and `expert-closeout`
   hold none at all. None of the six has `WebFetch`/`WebSearch`, so the "or the authoritative
   source" half of `expert-spec` step 3 is unreachable too. This gates everything else — it is
   implicated in both the rounds 1–3 citation churn and the Systemic finding round 5 ended on
   (`docs/investigate.md` §1a, §4e, §4f).

2. **Fix the remediation path — B9b.** Every other gate in the lifecycle (architecture, plan,
   implementation ×3 lenses) runs the *same* `runGate` loop with the *same* one-line revise
   dispatch, so this defect is not spec-specific: it is the shared engine. Measured: zero `Edit`
   calls in the whole run. B9a is retracted; B9c's evidence is withdrawn.
2. Remediate B1, B6, B7, B10 (Serious, machine-applicable) plus B2, B8, B5.
3. Owner rules on B3 and B4.
4. Re-run the behavioral tier from A-3 segment 1; only then re-ask whether the round cap and
   zero-findings bar need recalibration, measured against the repaired loop.
