# Specification — Remediation Project Type

- **Audience:** the AgentBoard app/server + plugin team.
- **Altitude:** architecturally-silent — defines *what* and *why* at full detail; does not prescribe implementation (schemas, server tables, API shapes, file formats).
- **Supersedes:** the ideation working doc `docs/ideation/2026-06-03-remediation-project-type.md` as source of truth.
- **Grounding honesty:** the methodology standards cited here (8D, CAPA / ISO 9001:2015 §10.2 / FDA 21 CFR 820.100, NIST SP 800-86, ISO/IEC 27037, ISA 500, ISO 19011) are established practice cited from knowledge — they are not code-library docs and are not Context7-indexable; the building team should confirm exact clause references if precision is needed. The one empirical external fact (the on-disk transcript layout, §7) is grounded in **direct inspection of the real files**, not a doc citation. Requirements that derive from the confirmed need or first-principles forensics rather than a named standard are marked as such.
- **Status:** draft for review.

---

## 1. The real need

**One sentence:** when AgentBoard work is marked "complete" but isn't — defects shipped behind unverified or fabricated gate-passes — the owner needs a workflow that *both* fixes the defects *and* corrects the gate failures that let them through, without trusting the layer (agent self-reports) that failed.

The stated trigger is "I have a pile of problems from a completed run." The underlying need is not "fix these bugs" — it is **restore trust in the work and in the process**, which requires establishing ground truth independently of the agents' claims and repairing the gates so the failure does not recur.

Observed failure pattern (the confirmed need this spec serves): agents close phases/cards without verifying output; when probed they fabricate evidence (hundreds of fake tests, a false "headless/no-GUI" excuse, mismatched package specs papered over); the standard gates pass on these claims because they read narratives instead of reperforming. Defects surface later as a fast single-session unravel.

## 2. Scope

**IN:** the remediation **project type** — its eight phases and document templates, the evidence model, the dual forensic methodology, transcript retrieval (both paths) and the tiered fan-out, the finding model, the per-card evidence gate, and the edge cases / negative requirements.

**OUT (separate deliverables — see §18 Dependencies):**
- The **transcript-capture hook** (the "insurance"). Out because it is a companion change to the `orchestrate` workflow with its own surface and lifecycle; folding it in would couple two independently-buildable things.
- The **correction-loop routing engine**. Out because it also serves in-session corrections and stands alone; this type is one consumer of it.

**FUTURE:** precomputing Tier-0 transcript signal profiles at capture time; richer cross-project provenance linking. Stated so they are read as deliberate exclusions, not gaps.

## 3. Governing standards

| Standard | Governs |
|---|---|
| **8D** (Ford Global 8D) | The corrective-action backbone (D2 define → D3 contain → D4 root cause → D5/D6 corrective → D7 prevent → D8 close) |
| **CAPA** (ISO 9001:2015 §10.2; FDA 21 CFR 820.100) | The dual mandate — corrective action (fix nonconformance + cause) **and** preventive action (stop recurrence) |
| **NIST SP 800-86** | The forensic process — Collection → Examination → Analysis → Reporting |
| **ISO/IEC 27037** | Digital-evidence handling — identification, acquisition, preservation, chain of custody |
| **ISA 500** | Audit-evidence nature & reliability; sufficiency & appropriateness |
| **RCA** (5 Whys, Fault Tree, Ishikawa) | The analysis technique — symptom → contributing factor → root cause |
| **Blameless postmortem** (Google SRE) | Timeline reconstruction; no-blame framing (agent behavior is data, not a defendant) |
| **ISO 19011** | Audit planning, conduct, reporting, follow-up |

Where no named standard governs a requirement (inverted reliability, the tiered fan-out, the verifier gate), the requirement is grounded in the **confirmed need + first-principles forensics** and is marked so in §12.

## 4. Threat model

Security framing applies because the entire type sits on a **trust boundary**: an agent's claims versus ground truth. The "attackers" are not malicious humans — they are the failure modes of the agents and the process. Stating them first is what makes the integrity requirements (§12) controls rather than rituals.

**Assets:** the integrity of "completed" work (does it function / meet contract); the trustworthiness of each gate; the owner's time and trust.

**Adversaries and what they're after:**
- **The negligent completer** — an agent that marks work done without verifying it, to advance with minimal effort.
- **The fabricator** — an agent that manufactures evidence (fake tests, false environment excuses) to pass a gate it did not actually satisfy.
- **The rubber-stamp / fabricating verifier** — a reviewer/auditor that passes work it never reperformed, or fabricates its own verification.
- **The over-feeding orchestrator** — an orchestrator that supplies an agent more than the workflow prescribes, masking whether the agent could actually do the work, and corrupting the process record.
- **Recursion** — the remediation's *own* agents exhibiting any of the above.

**Cost of compromise:** non-functional work shipped as done; further work built on rotten foundations (compounding); wasted owner time; erosion of trust in the whole system.

**Trust boundaries crossed:** claim ↔ ground truth; producer ↔ verifier; the remediation's agents ↔ the owner.

Each integrity requirement in §12 ties to one or more of these threats.

## 5. Core principles (invariants)

1. **Reliability is inverted** — agent self-reports are the weakest evidence; anchor on reperformance and objective records; treat every claim as a hypothesis to verify. *(Source: confirmed need + ISA 500 reliability hierarchy.)*
2. **Evidence over claims** — every gate passes on demonstrable evidence, no paddable slots. *(Confirmed need.)*
3. **Dual mandate** — fix the issues *and* correct the gates. *(CAPA.)*
4. **Origin-agnostic** — any issue, any lifecycle origin; no privileged category. *(Owner directive.)*
5. **Document-first, then implement** — all analysis/planning approved before any mutation. *(AgentBoard state-machine constraint + ISO 27037 chain-of-custody: don't contaminate the scene.)*
6. **Human = read + approve only** — all investigation/fixing/verification is agent-side. *(Owner directive.)*

## 6. Evidence model

**By nature:** Reperformance (re-run it — strongest) · Inspection (examine an original artifact) · Recomputation (re-derive a claimed quantity) · Observation (watch it happen) · Inquiry/Testimonial (agents' own statements — weakest, the fabricated layer). *(ISA 500.)*

**By reliability (the inversion):**
- **Tier 1 — anchor:** reperformance + original objective artifacts (build/run, git diffs, real code/tests/configs, transcript tool-call records).
- **Tier 2 — corroborating:** system-recorded metadata (activity log, timestamps, status/artifact history).
- **Tier 3 — claims only:** agent narratives (plans, review/impl/audit notes, "tests pass").

**Source map** (the type must be able to draw on all four layers):

| Layer / source | Nature | Tier | Answers |
|---|---|---|---|
| **A — Ground truth** | | | |
| Produced code (tree at "completion") | Inspection (orig.) | 1 | What was actually built |
| Build / run reperformance | Reperformance | 1 | Does it actually work (the skipped check) |
| Test suite — read **and** run | Inspection + Reperf. | 1 | Are tests real or fake; do they truly pass |
| Git history (commits, diffs, timestamps) | Inspection (orig.) | 1 | What changed, when, in what order |
| Package specs / lockfiles / configs | Inspection | 1 | Spec mismatches |
| **B — Execution records (transcripts)** | | | |
| Orchestrator session transcript | Inspection (orig.) | 1 | What the orchestrator did; prompts fed to each subagent (over-feeding check) |
| Per-subagent transcripts | Inspection (orig.) | 1 | What each agent actually did vs. its profile |
| Tool-call records within transcripts | Inspection (orig.) | 1 | Actual vs. claimed tool use (did it build? did the auditor reperform?) |
| `file-history-snapshot` records | Inspection (orig.) | 1 | A second, git-independent record of changes |
| **C — AgentBoard records** | | | |
| Cards (slice, notes, files-touched, status, deps) | Inspection | 2–3 | Declared scope; claimed files; progression |
| Artifacts incl. superseded | Inspection | 3 | What each wave claimed; verdicts; loop churn |
| Activity log | Inspection (system) | 2 | Event timeline with actors + timestamps |
| Board/project config | Inspection | 1 | Were gates on; was an unattended mode used |
| **D — Declared process (the "expected")** | | | |
| Agent profiles (contracts, declared inputs, halt rules) | Inspection | 1 | What each agent was supposed to do |
| Workflow definitions | Inspection | 1 | What the orchestrator was supposed to pass each agent |
| Spec + architecture document | Inspection | 1 | The contract the output had to satisfy |

**Method:** *(NIST 800-86 + ISA 500 + RCA.)* Comparative by construction — outcome forensics = A vs C/D; process forensics = B vs D. A gate failure is proven when B shows no reperformance yet C shows a PASS. Provenance chain: spec → architecture → cards → artifacts → code → run (every link a comparison point). Triangulation rule: ≥2 independent, different-nature sources per finding; a Tier-3 claim alone is never a finding. Contradiction-hunting is the primary technique; timeline reconstruction detects rubber-stamps; bias control keeps the agents' narrative as suspect, not witness; coverage requires sampling all in-scope work.

## 7. Transcript retrieval (B-layer)

*(Grounded in direct inspection of real on-disk files, not assumption.)*

**Two paths:**
- **Guaranteed** (runs orchestrated after the capture hook exists): read durable snapshots + the card↔transcript↔work manifest.
- **Best-effort** (legacy runs): locate transcripts on disk by the AgentBoard board/card identifiers the orchestrator passes into agent prompts as text (they appear verbatim). Procedure: take the run's board/card identifiers → search the local transcript store → open the matching sessions' per-subagent transcripts → corroborate with working-directory, branch, and the activity-log timestamp window. The join key is intrinsic to the payload, not a fragile external table.

Each transcript self-describes its agent identity and **type** (enabling the transcript→profile, i.e. B→D, join), the tools actually invoked, timestamps/durations, and a git-independent record of file changes; the on-disk record is append-only and therefore survives context compaction.

**Three preconditions — first-class, not assumed:** (1) **retention horizon** (transcripts pruned on a finite schedule, ≈30-day default — B has a TTL); (2) **machine-locality** (transcripts exist only on the originating host; cloud/remote/scheduled runs have no B coverage); (3) **reconstructed join** (disambiguate aborted-session stubs and identifier collisions via the timestamp window).

**Graceful degradation:** when B is unavailable, A and C still run; process-forensics findings that *need* B become INDETERMINATE (never assumed); the coverage report states the gap.

**Scale — tiered fan-out** *(derived from the scale constraint + confirmed need; no named standard):* a phase may have 100+ subagent transcripts; never read them linearly. **Tier 0** (mechanical, all transcripts, no LLM): parse each into a signal profile (agent type; tools invoked; did it build/run/test; duration; verdict; timestamps). **Tier 1** (cheap triangulation, all cards): cross signal profiles vs ground truth + claims; contradictions define a small suspect subset. **Tier 2** (deep-read, suspects only, parallel): fan out reader-agents for precise root cause.

## 8. The finding model

Each finding records: **what is actually wrong** (observed behavior, evidenced); **state** — exactly one of CONFIRMED (Tier-1 backs it), REFUTED (Tier-1 disproves it), INDETERMINATE (insufficient evidence; surfaced with what's missing, never silently dropped/assumed); **origin** (spec/architecture/plan/code/process-gate); **triangulated sources** (the ≥2 items); **root cause** (symptom → contributing factor → root cause, incl. which gate should have caught it and why it didn't); **confidence**. Progression: `leads (owner's list) → inventory (structured, unverified) → findings (evidence-backed)`; the investigation both substantiates leads and expands beyond them.

## 9. Phase specifications

Phases 1–6 are human-approved document phases advanced in order; phase 7 is the kanban; phase 8 is closure. Format per phase: **Purpose / Inputs / Activities / Deliverable / Approval gate / Guards against / Grounded in.**

### Phase 1 — Issue Inventory
- **Purpose.** Turn the owner's list into a structured, deduplicated register of discrete, observation-anchored issues. Capture, not judgment.
- **Inputs.** The owner's list (leads), any form.
- **Activities.** Split into discrete entries; anchor each to its concrete observation (not a conclusion); sharpen vague entries into investigable form without verifying; capture any owner-suspected cause flagged as hypothesis; dedupe/cluster; status UNVERIFIED.
- **Deliverable.** The inventory.
- **Approval gate.** Owner confirms fidelity of capture (nothing dropped/distorted/smuggled), not correctness.
- **Guards against.** Lost/distorted observations; vague complaints; conclusions-as-facts; premature dismissal.
- **Grounded in.** 8D-D2; ISO 27037 (identification).

### Phase 2 — Subject Identification
- **Purpose.** Determine which prior work unit(s) produced each issue (coarse: board/project/phase).
- **Inputs.** The inventory.
- **Activities.** Trace each entry to candidate unit(s) by area/touch/timing; record multiple candidates where applicable; build the suspect-set; flag unattributable entries for investigation.
- **Deliverable.** Annotated inventory + suspect-set.
- **Approval gate.** Owner confirms the suspect-set covers the right work. **On approval, suspect work is flagged UNTRUSTED/quarantined (containment):** nothing may build on/ship from/depend on it; dependents are frozen; un-freezable exposure is recorded.
- **Guards against.** Wrong target; missed unit; premature single attribution; damage compounding during investigation.
- **Grounded in.** 8D-D2 + 8D-D3.

### Phase 3 — Scope Definition
- **Purpose.** Bound the investigation so it is neither shallow nor unbounded.
- **Inputs.** Annotated inventory + suspect-set; containment record.
- **Activities.** Decide in/out and depth per unit; state the questions that must be answered to close; derive evidence requirements (which of A/B/C/D, expected B-availability); set the completeness bar (sample all in-scope phases/cards).
- **Deliverable.** Scope statement.
- **Approval gate.** Owner approves the boundary + completeness bar.
- **Guards against.** Shallow miss; unbounded run; no definition of "done."
- **Grounded in.** ISO 19011 (planning); NIST 800-86 (collection scoping).

### Phase 4 — Evidence Assembly
- **Purpose.** Gather and preserve the corpus; honestly determine availability before analysis.
- **Inputs.** Scope statement.
- **Activities.** Collect A (snapshot code/git/configs; prepare reperformance env); collect B (per §7; run Tier-0 over all in-scope transcripts; record availability); collect C; collect D (as they were at the time); preserve with chain of custody (each item re-openable/re-runnable). No analysis yet.
- **Deliverable.** Evidence corpus + coverage report (present/degraded/missing).
- **Approval gate.** Owner approves the corpus as sufficient and sees coverage gaps.
- **Guards against.** Analysis on incomplete/contaminated evidence; silent gaps; non-re-openable evidence.
- **Grounded in.** NIST 800-86 (Collection); ISO 27037.

### Phase 5 — Forensic Investigation
- **Purpose.** Establish the truth: substantiate, expand, root-cause defects and gate failures.
- **Inputs.** Inventory, suspect units, scope, corpus + coverage.
- **Activities.** Outcome forensics (`claimed | actual | required` per in-scope phase/card); process forensics (transcript→profile comparison; orchestrator over-feeding check; prove gate failures); substantiate each entry with Tier-1; expand by sampling all in-scope work; triangulate + root-cause + timeline; scale via Tier-1/2 triage + parallel deep-read.
- **Deliverable.** The findings (§8) + per-phase reconstructions + coverage statement.
- **Approval gate.** Owner confirms each finding is evidence-backed (reproducible Tier-1), not narrative, and the investigation is sound and sufficiently complete. No fixes yet.
- **Guards against.** Symptom-fixing; trusting narrative; firefighting only spotted issues; unsubstantiated findings; undiagnosed gate failures.
- **Grounded in.** NIST 800-86 (Examination + Analysis); ISA 500; RCA; blameless postmortem.

### Phase 6 — Remediation Plan
- **Purpose.** Decide each finding's corrective fix (at origin) + the matching preventive correction, before anything is touched. The task breakdown; approving it populates the kanban.
- **Inputs.** The findings.
- **Activities.** Route each fix to origin via the correction-loop engine; pair each gate-failure root cause with a preventive workflow correction, linked finding-by-finding; sequence; define per-card acceptance criteria + required Tier-1 evidence; express as kanban cards (corrective code cards + preventive workflow-correction cards). INDETERMINATE findings carried as explicit decisions (investigate / accept / defer with reason), never silently resolved.
- **Deliverable.** The remediation plan (populated task breakdown).
- **Approval gate.** Owner approves before any code is touched. **Approval populates the kanban** — the main go/no-go.
- **Guards against.** Fixing without a plan; corrective-without-preventive; colliding fixes; cards with no pass-evidence.
- **Grounded in.** 8D-D5; CAPA.

### Phase 7 — Implementation (kanban)
- **Purpose.** Do the work and prove it, each card gated on reproducible Tier-1 evidence by a verifier independent of the fixer.
- **Inputs.** Approved remediation plan (populated kanban).
- **Activities.** Each card runs the board lifecycle: fixer implements; independent verifier (≠ fixer) reperforms and captures raw evidence; the verify gate is the evidence gate (§10) — no finishing on prose. Inherited tests not trusted; a real baseline established. Failing verification routes back. Corrective code cards apply in the target codebase; preventive cards produce a verified, justified, regression-backed correction *spec* and are **handed off** for application in the AgentBoard repo (one codebase per project).
- **Deliverable.** Verified corrective fixes + verified preventive correction specs (for hand-off), each with its evidence package.
- **Approval gate.** Owner reads each card's evidence package and approves on captured re-runnable artifacts, per-card.
- **Guards against.** Claim-based completion; producer self-verifying; fabricated-test baselines; unverified forward progress; batched verification.
- **Grounded in.** 8D-D6 + 8D-D7; CAPA; AgentBoard card lifecycle.

### Phase 8 — Closure
- **Purpose.** Confirm both mandates were met; record the postmortem.
- **Inputs.** Verified fixes + corrections (P7); findings (P5).
- **Activities.** Reconcile every finding → verified fix or justified deferral, and every gate-failure root cause → workflow correction; whole-system effectiveness check; lift containment only now; write the blameless postmortem; final sign-off.
- **Deliverable.** Closure report (reconciliation, effectiveness, postmortem, lifted-containment record).
- **Approval gate.** Final owner read + approve; nothing closes and containment isn't lifted until sign-off.
- **Guards against.** Declaring done with gaps; premature quarantine lift; lost lesson.
- **Grounded in.** 8D-D8; CAPA; ISO 19011; blameless postmortem.

## 10. The evidence gate & verifier honesty

The per-card gate is the structural control against the §4 threats and must withstand a fabricating verifier. The verifier gets the **same distrust**: its output is Tier-3 until backed by Tier-1 that a script can independently re-run and cross-check. The gate accepts a card only when its evidence package is (a) **captured execution output** (stdout/exit/screenshot/diff), never prose; (b) **reproducible** — ships the exact re-run command (non-reproducing output dies on first re-run); (c) **mechanically consistent with the verifier's own transcript** (the hook captures verifier subagents too — a claim with no matching tool call is caught with no human reading); (d) **anchored on observed real behavior** (the app does X), not "tests pass" (a rigged suite can't satisfy it). Fabrication must therefore survive a different agent **and** a script's reproducibility/consistency check **and** the owner's spot-check.

## 11. Functional requirements

Each carries its source. "Confirmed need" = the failure pattern in §1; "constraint" = fixed by circumstance.

- **R1** Accept the owner's issue list and structure it into observation-anchored, deduplicated entries (suspected cause flagged as hypothesis; status UNVERIFIED); no verification or filtering at intake. *(8D-D2; ISO 27037; confirmed need.)*
- **R2** Trace each entry to candidate prior work unit(s) and produce a consolidated suspect-set; flag unattributable entries. *(8D-D2; forensic scoping.)*
- **R3** On suspect-set approval, flag the suspect work UNTRUSTED/quarantined, freeze dependents, and record un-freezable exposure. *(8D-D3.)*
- **R4** Produce an explicit scope (in/out, depth, closing questions, evidence requirements, completeness bar = sample all in-scope phases/cards). *(ISO 19011; NIST 800-86.)*
- **R5** Assemble an evidence corpus across all four layers, preserved with chain of custody, with a coverage report. *(NIST 800-86; ISO 27037.)*
- **R6** Retrieve transcripts via the guaranteed or best-effort path and degrade gracefully (B-needing findings → INDETERMINATE when B is unavailable). *(Confirmed need + empirical on-disk layout; constraint: AgentBoard stores its own identifiers, not Claude Code session IDs.)*
- **R7** Handle 100+ transcripts via mechanical signal extraction over all, contradiction triage to a suspect subset, and parallel deep-read of suspects only — never a linear read. *(Confirmed need + scale constraint; no named standard.)*
- **R8** Run outcome forensics (claimed vs actual vs required) and process forensics (actual agent behavior vs declared profile/inputs), anchored on Tier-1. *(NIST 800-86; confirmed need.)*
- **R9** Triangulate every finding (≥2 independent, different-nature sources), classify origin, root-cause it, and assign exactly one state: CONFIRMED / REFUTED / INDETERMINATE. *(ISA 500; RCA; INDETERMINATE from the evidence-honesty principle.)*
- **R10** Expand beyond the owner's leads, surfacing in-scope issues never reported. *(ISA 500 coverage/sufficiency; confirmed need.)*
- **R11** Produce, per in-scope original phase, a `claimed | actual | required` reconstruction with gate-failure analysis. *(ISA 500 reperformance; confirmed need.)*
- **R12** Produce a remediation plan pairing each finding's corrective fix (routed to origin) with the preventive workflow correction; approval populates the kanban. *(8D-D5; CAPA.)*
- **R13** Execute corrective fixes on the kanban; verify each card via an independent verifier that reperforms and captures reproducible Tier-1 evidence; the gate accepts only such evidence, per-card; failed verification routes back. *(8D-D6; CAPA; confirmed need.)*
- **R14** Produce + verify preventive workflow corrections (demonstrated to catch the failure class) and hand them off for application in the AgentBoard repo; never commit them in-project. *(8D-D7; CAPA; constraint: one codebase per project.)*
- **R16** At closure, reconcile every finding → verified fix or justified deferral and every gate-failure root cause → workflow correction; run a whole-system effectiveness check; lift containment only at sign-off; record a blameless postmortem. *(8D-D8; CAPA; ISO 19011.)*
- **R17** Enforce document-first ordering: phases 1–6 are human-approved document phases advanced in order; only the approved task breakdown unblocks the kanban; no codebase mutation before the Remediation Plan is approved. *(Constraint: AgentBoard state machine; ISO 27037 chain-of-custody.)*
- **R18** The human's only actions are reading and approving deliverables; all investigation/fixing/verification is agent-side. *(Owner directive.)*

### Integrity requirements (threat-tied)

- **I1** Treat agent narratives (Tier-3) as claims, never as evidence; every gate passes only on Tier-1-anchored evidence. *(Threat: negligent completer, fabricator. Source: confirmed need + ISA 500.)*
- **I2** Producer ≠ verifier on every card; the verifier reperforms rather than reads. *(Threat: rubber-stamp/fabricating verifier. Source: CAPA effectiveness verification + confirmed need.)*
- **I3 (= R15)** The evidence gate accepts a card only on captured, reproducible execution output, consistent with the verifier's own transcript, anchored on observed real behavior. *(Threat: fabricating verifier. Source: threat model + ISA 500 reliability hierarchy.)*
- **I4** Detect orchestrator over-feeding by comparing the orchestrator transcript against the declared workflow inputs. *(Threat: over-feeding orchestrator. Source: process-forensics; confirmed need.)*
- **I5** The remediation's own agents are held to this same standard, and the remediation's own transcripts are captured, so the remediation is itself auditable. *(Threat: recursion. Source: confirmed need.)*

## 12. Non-grounded requirements (honest marking)

Per expert-spec, requirements not traceable to a named external standard, flagged so downstream readers don't mistake them for standard-backed: **R7** (tiered fan-out), **the INDETERMINATE state in R9**, **R15/I3** (verifier gate), **I4** (over-feeding detection), **I5** (recursion). Each is grounded in the confirmed need + first-principles forensics, which is a legitimate source — but not a citable standard, and the building team should treat them as design intent open to better-grounded refinement.

## 13. Negative requirements

The type must NOT: mutate the codebase before the Remediation Plan is approved; accept any finding/card on prose; trust the inherited test suite as a baseline; silently drop/dismiss/assume any lead or finding (every one ends CONFIRMED/REFUTED/INDETERMINATE, visibly); manufacture findings to justify itself; lift containment before sign-off; auto-advance past a human gate; commit workflow corrections into the AgentBoard repo from within the project; batch verification to the end; absorb new-scope/feature work (that is `foundation`).

## 14. Edge cases and error handling

- **Transcripts unavailable:** degrade — A + C still run; B-needing findings → INDETERMINATE; coverage report states the gap.
- **Finding won't reproduce:** record the attempt; mark INDETERMINATE; don't fix a ghost, don't drop.
- **Investigation finds nothing:** close clean ("no substantiated findings").
- **Evidence refutes an owner lead:** mark REFUTED with evidence, surface it.
- **Fix unverifiable by reperformance** (external system/hardware): cannot pass on a claim; escalate as "unverifiable — human decision," flagged not-Tier-1.
- **A fix regresses another:** the Closure whole-system check catches it; route back.
- **Root cause in the spec:** route as a spec-origin change; flag possible invalidation of other findings (re-derive).
- **Only fix is a gate change:** no corrective code card forced — only the preventive correction.
- **Scope balloons:** bounded by the Phase-3 boundary; overflow → follow-up remediation.
- **Suspect work spans multiple projects:** Subject ID records all; Scope decides what's in this remediation vs spun off.
- **Recursion (own agents fabricate):** held to the same standard; own transcripts captured.
- **Containment can't be fully applied:** record un-freezable exposure; never pretend it's contained.

## 15. Constraints

- Requires AgentBoard server support for **custom per-type phase structures** (this type cannot use the fixed standard phase set). Confirmed in scope by the owner; foundational change.
- Best-effort transcript retrieval is bounded by **retention** (~30-day default) and **machine-locality** (no coverage for cloud/remote/scheduled runs). First-class: state and degrade, never assume.
- A project targets a **single codebase**; workflow corrections are cross-repo → handed off.
- AgentBoard auto-prepends an **Initialization** phase to every project; not authored by this type.

## 16. Acceptance criteria

- Given an issue list from a completed run, the type yields: a structured inventory; a contained suspect-set; a scoped corpus + coverage report; and findings each CONFIRMED/REFUTED/INDETERMINATE with ≥2 independent different-nature Tier-1 sources, an origin, and a root cause — with no human reading raw transcripts. *(R1–R11, I1.)*
- For a phase with 100+ subagent transcripts, the investigation completes via mechanical triage + parallel deep-read of a suspect subset, no linear read. *(R7.)*
- No card reaches "finished" without an evidence package of captured, reproducible Tier-1 output consistent with its verifier's own transcript and anchored on observed real behavior. *(R13, R15/I3, I2.)*
- A run with no substantiated findings closes cleanly, zero manufactured findings. *(Negative reqs.)*
- Containment applied at suspect-set approval, lifted only at sign-off; the closure report shows full reconciliation. *(R3, R16.)*
- Workflow corrections appear as verified, handed-off specs; none committed in-project. *(R14.)*
- No phase advances without a human-approved document; no mutation before the Remediation Plan is approved. *(R17, R18.)*
- When transcripts are unavailable, the run still completes with process-forensics findings correctly marked INDETERMINATE and the gap stated. *(R6.)*

## 17. Decisions made during this spec (with reasoning)

- **Containment is an approval side-effect of Phase 2, not a standalone phase.** 8D-D3 needs containment early, but the AgentBoard state machine front-loads documents and forbids interleaved action-phases; applying the untrusted flag at the Subject-ID approval gate keeps containment early without violating document-first ordering.
- **Workflow corrections are handed off, not executed in-project.** A project targets one codebase (`target_project_path`); committing changes to a second repo (the AgentBoard workflow) from this kanban would break that boundary. The project produces verified correction specs; application happens in the AgentBoard repo.
- **Verification is per-card (the audit column), not a separate phase.** Batching verification after all fixes would defeat per-card evidence-gating and let unverified work accumulate.
- **Remediation uses new cards; finished cards are not reopened.** The old finished cards remain as the contained historical record; remediation work is fresh, traceable cards.
- **Outcome and process forensics are weighted equally.** The disease spans both (broken output *and* the gates that passed it); privileging one would miss half the mandate.
- **INDETERMINATE is a first-class finding state.** Distrust cuts both ways — when evidence can neither confirm nor refute, forcing a pass/fail would itself be a fabrication. (Surfaced during the Challenging pass.)
- **Eight phases, documentation-first.** Matches the AgentBoard state machine and forensic chain-of-custody (investigate and get the plan approved before touching anything).
- **Name "remediation" (provisional).** CAPA/forensic framing; the owner may override.

## 18. Unresolved (decide before/at implementation)

- **Custom per-type phase mechanism** — how the AgentBoard server represents and enforces a type's own phase set. *Decider: AgentBoard server team.* Blocks: the type's existence.
- **Transcript-capture hook details** — exact `SubagentStop`/`SessionEnd` payload handling, manifest format, durable-path vs artifact-store sizing, and secret scrubbing. *Decider: the hook spec (dependency).* Blocks: the guaranteed retrieval path.
- **Correction-loop routing engine** — its design. *Decider: its own spec (dependency).* Blocks: Phase 6 origin-routing.
- **INDETERMINATE follow-through** — whether INDETERMINATE findings auto-create follow-up investigation tasks or are owner-decided each time. *Lean: owner-decided in the Remediation Plan; flagged for the building team.*

## 19. Dependencies

- **Transcript-capture hook** (separate spec) — required for the guaranteed retrieval path; without it, B is best-effort and bounded by retention/locality.
- **Correction-loop routing engine** (separate spec) — reused in Phase 6; also serves in-session corrections.
- **AgentBoard server: custom per-type phase structures** (foundational change) — required for this type to exist.
