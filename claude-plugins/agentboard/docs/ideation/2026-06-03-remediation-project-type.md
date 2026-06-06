# Remediation Project Type — Ideation Working Doc

- **Status:** WORKING / ideation scratchpad — **not** the final spec. Captures the forensic-investigation methodology and running decisions for a new AgentBoard **post-completion remediation** project type.
- **Eventual output:** an architecturally-silent spec to hand to an agent in the AgentBoard app repo.
- **Related work:** the (separate) correction-loop skill; the command→skill migration (PR #28); deferred findings F-1/F-2/F-3 in `docs/plans/2026-06-03-command-to-skill-migration-plan.md`.

---

## 1. What we're building (one paragraph)

A new **custom-phase, human-gated AgentBoard project type** for post-completion remediation. It is triggered when a single investigation session unravels a stack of mixed-origin problems in work that was marked **"complete"** but was never really verified (and whose evidence was often **fabricated**). It runs a **forensic process-audit** over the failed work — anchored on reperformance and objective records, treating agent narratives as claims to verify — produces per-phase `claimed | actual | required` reconstructions and gate-failure root-causes, then fixes issues at their origin behind **evidence gates** and emits corrections to the AgentBoard workflow itself. Dual mandate (fix issues + fix the gates that let them slip), origin-agnostic, evidence-over-claims.

---

## 2. Core principle — reliability is *inverted*

The standard pipeline's gates operate on the agents' own narratives — the reviewer *reads* the plan, the auditor *reads* the implementation_note and the "passing" tests. **That narrative layer is exactly the layer that gets fabricated.** So in this investigation, **agent self-reports are the *weakest* evidence**, and the methodology anchors on **reperformance + objective records**, treating every agent claim as a *hypothesis to verify*, never a fact.

Motivating case: a phase 5 (Electron app) was marked fully complete with **zero verification by any agent**; when pressed, agents **fabricated** hundreds of fake tests and a false "headless / no-GUI" excuse. The app didn't run at all. Investigation also surfaced mismatched package specs and more. It unraveled fast, within one session.

---

## 3. Two braided investigations

- **Outcome forensics** — is the work actually correct? Does it build/run? Are the tests real? Does it meet the contract?
- **Process forensics** — was the *workflow* actually followed? Did agents really verify? Were output contracts produced/followed? Did the orchestrator over-feed inputs the workflow says to withhold (declared-input discipline)?

The whole thing is **comparative**:
- Outcome forensics = **A (ground truth)** vs **C2/D3 (claimed / required)**.
- Process forensics = **B (what agents actually did)** vs **D (what they were told to do)**.
- A "gate failure" is *proven* when B/transcript shows the reviewer/auditor never reperformed, yet C2 shows a PASS.

---

## 4. Evidence-type taxonomy (grounded in audit-evidence theory + RCA + forensics)

**By nature** (the act that produces it):
- **Reperformance** — we re-run it (build, launch, run tests, re-derive). Strongest.
- **Inspection** — examine an existing record/artifact (code, git diff, transcript, config). Strong for originals; weak for entity-produced narratives.
- **Recomputation** — re-derive a claimed number (e.g., re-run a blast-radius the agent cited).
- **Observation** — watch a process happen (limited here unless we re-run the workflow under watch).
- **Inquiry / Testimonial** — the agents' own statements. **Weakest**; the fabricated layer; never sufficient alone.

**By reliability:**

| Tier | What | Why |
|---|---|---|
| **1 — anchor on this** | Reperformance + original objective artifacts: actually run the build/app, git diffs, real code/tests/configs, and **transcript tool-call records** (what was actually invoked) | Produced outside the agents' narrative control; reproducible |
| **2 — corroborating** | System-recorded metadata: activity log, timestamps, status-transition history, superseded-artifact history | System-recorded, hard to fake, but indirect |
| **3 — claims only** | Agent-authored narratives: plan / review_note / implementation_note / audit_report prose, card notes, "tests pass" | Evidence of what was *claimed*, never of what is *true* |

**RCA layering** every finding is sorted into: **symptom** (the surfaced issue) → **contributing factor** (the gate that should have caught it) → **root cause** (why that gate structurally cannot catch it).

---

## 5. Evidence-source map

| # | Source | Nature | Tier | What it answers |
|---|---|---|---|---|
| **A. Ground truth** ||||
| A1 | Produced code (tree at "completion") | Inspection (original) | 1 | What was actually built |
| A2 | Build / run **reperformance** | Reperformance | 1 | Does it actually work (the check they skipped) |
| A3 | Test suite — read **and** run | Inspection + Reperformance | 1 | Are tests real or fake; do they truly pass |
| A4 | Git history (commits, diffs, timestamps) | Inspection (original) | 1 | What changed, when, in what order |
| A5 | Package specs / lockfiles / configs | Inspection | 1 | Spec mismatches |
| **B. Execution records (transcripts)** ||||
| B1 | Orchestrator session transcript | Inspection (original) | 1 | What the orchestrator did; **the prompts it fed each subagent** (over-specification check); checkpoint handling |
| B2 | Per-subagent transcripts | Inspection (original) | 1 | What each agent *actually* did vs. its profile |
| B3 | Tool-call records inside B1/B2 | Inspection (original) | 1 | Actual vs. claimed tool use — did the impl agent really run build? did the auditor run *anything*? |
| B4 | `file-history-snapshot` records in transcripts | Inspection (original) | 1 | Second, git-independent record of what files changed |
| **C. AgentBoard records** ||||
| C1 | Cards (slice, notes, files_touched, status history, depends_on) | Inspection | 2–3 | Declared scope; claimed files; progression |
| C2 | Artifacts incl. **superseded** (plan/review/impl/audit/bundles) | Inspection | 3 | What each wave *claimed*; verdicts; loop churn |
| C3 | Activity log | Inspection (system) | 2 | The event timeline with actors + timestamps |
| C4 | Board/project config (auto_transitions, blocking) | Inspection | 1 | Were the gates even **on**; was `--auto` used |
| **D. The declared process (the baseline / "expected")** ||||
| D1 | Agent profiles (output contracts, declared inputs, halt rules) | Inspection | 1 | What each agent was *supposed* to produce/consume |
| D2 | Workflow defs (orchestrate / architecture skills) | Inspection | 1 | What the orchestrator was *supposed* to pass each agent |
| D3 | Spec + architecture document | Inspection | 1 | The contract the output had to satisfy |

---

## 5.1 B-layer retrieval — confirmed viable, with three preconditions

A forensic pass over the real on-disk data confirms transcripts exist, are richer than assumed, and the AgentBoard→transcript join is reconstructable. B keeps its Tier-1 anchor.

**On-disk layout**
```
~/.claude/projects/<cwd-slug>/
   <sessionId>.jsonl                            <- main orchestrator session
   <sessionId>/subagents/agent-<agentId>.jsonl  <- one per Task subagent (i.e. per card-agent)
```
- `<cwd-slug>` = cwd with `\ / :` flattened to `-`. Deterministic from cwd but **not reversible** (no slug→path index) — a retriever must **scan all of `projects/`**, not compute one path.
- Every AgentBoard card-agent (plan-compose/review/implementation/audit) is a Task subagent, so **card-level granularity is preserved** — one `agent-*.jsonl` per card's work.

**Records are self-describing** (JSONL, append-only, one record/line): `sessionId`, `agentId`, `isSidechain`, `parentUuid` (causal chain), `timestamp`, `cwd`, `gitBranch`, `version`, per-turn `model` + token `usage`, and crucially **`attributionAgent`/`attributionPlugin`** (the agent *type*, e.g. `feature-dev:code-reviewer`) — which gives the **B→D join (transcript → which agent profile) for free**. Also a **`file-history-snapshot`** record: a second, git-independent "what changed" anchor. **Append-only = compaction-proof** — the on-disk record survives in-context compaction, so forensics sees what the live session forgot.

**The join (solved by content, not metadata):** AgentBoard (cloud MCP) stores its own UUIDs, not the Claude Code sessionId/agentId — so there is no API handshake card→transcript. But the orchestrator passes `board_id`/`card_id` into agent prompts as text and they land in the transcript verbatim (confirmed: 189 agentboard tool-call records across 8 files in one project). Retrieval algorithm:
  1. Take the `board_id` (and/or `card_id`s) of the run under investigation.
  2. `grep` the literal UUID across `~/.claude/projects/**/*.jsonl` → hits identify the orchestrator session(s).
  3. Read `sessionId` from those → open `<sessionId>/subagents/` for the per-card transcripts.
  4. Corroborate with `cwd` + `gitBranch` + activity-log timestamp window.
The join key is intrinsic to the payload, not a fragile external table.

**Three preconditions — first-class in the spec, not assumed away:**
1. **Retention horizon.** `cleanupPeriodDays` (default ≈30; not set → default applies; oldest observed transcript at 33 days). B has a TTL.
2. **Machine-locality.** Transcripts live only on the host where the session ran. Cloud/remote agents, `/code-review ultra`, scheduled routines → **zero B-coverage**. Remediation must run on (or have fs access to) the originating host.
3. **Reconstructed join.** grep-on-embedded-ID → handle near-empty/aborted session stubs and ID collisions across re-runs; disambiguate via the activity-log timestamp window.

**The insurance mechanism (and why it matters here):** at *orchestration end*, copy the run's `<sessionId>.jsonl` + `subagents/` into the board's durable artifact store (or a durable path). This converts B from "best-effort, time-boxed" to **guaranteed**, killing retention AND machine-locality risk in one move. It is itself a **forward-looking workflow correction** — it belongs in the *orchestrate* workflow, not the remediation type. So B-retrieval splits:
- **Guaranteed path** (runs orchestrated after the insurance step exists): read the snapshotted transcripts from the board.
- **Best-effort path** (legacy runs, incl. the current phase-5 disaster): the disk-grep algorithm above, subject to the three preconditions.

Open on the snapshot step: transcripts can be large and may contain **secrets** (e.g. the auth callback URL the skill says never to persist) — needs size handling (artifact ≤500k chars vs durable path) and **secret scrubbing**.

---

## 6. The evidence graph

```mermaid
graph LR
  D3[Spec + Arch doc] -->|provenance| C1[Cards]
  C1 -->|provenance| C2[Plan/Review/Impl/Audit artifacts]
  C2 -->|provenance| A1[Produced code]
  A1 --> A2[Build/run reperformance]
  C3[Activity log] -. timeline spine .-> C1 & C2 & B1
  B1[Orchestrator transcript] -->|prompts vs declared inputs| D2[Workflow defs]
  B2[Subagent transcripts] -->|actuals vs contract| D1[Agent profiles]
  B3[Tool-call records] -->|refutes/confirms| C2
  A2 -->|refutes/confirms| C2
  A4[Git] -->|refutes/confirms| C2
  A3[Tests read+run] -->|refutes/confirms| C2
  classDef truth fill:#cfc; classDef claim fill:#fcc;
  class A1,A2,A3,A4,A5,B1,B2,B3,C4,D1,D2,D3 truth;
  class C2,C1 claim;
```

Two structural features:
- **Provenance chain:** spec → arch → cards → artifacts → code → run. Every link is a comparison point.
- **Triangulation triads:** e.g. *"impl_note claims build passes"* (C2 / Tier-3) is corroborated or refuted by *actually running it* (A2 / Tier-1) **and** *the transcript showing whether build was ever invoked* (B3 / Tier-1). A finding needs ≥2 independent sources of different nature; a Tier-3 claim alone is never a finding.

---

## 7. What rigorous investigation adds beyond the map

- **Triangulation rule** — ≥2 independent, different-nature sources per finding.
- **Contradiction-hunting** as the primary method — diff claims (C2) against reality (A) and behavior (B); the contradictions *are* the findings.
- **Timeline reconstruction** (C3 + transcripts) — e.g., a verdict timestamped seconds after submission is a rubber-stamp, not a review.
- **Chain of custody / reproducibility** — every finding cites its source and can be re-opened/re-run.
- **Bias control** — the agents' narrative is the *suspect*, not the witness; never let it drive the conclusion.
- **Coverage / sufficiency** — sample *every* phase/card, not just the one that broke (the case: all of phase 5 was unverified).

---

## 8. How this feeds the remediation phases

The evidence model **is** the methodology for the front of the type. (NOTE: the 7-item first cut below is **superseded** by the standards-grounded 10-phase outline in §9–§10.) Original first cut:

1. **Inventory** — capture the unraveled issues; each anchored to the *concrete observation* that exposed it (the crash, the fake test), never a vague description.
2. **Origin classification** — trace each issue to its lifecycle origin (spec / architecture / plan / code / **process-gate**). Reuses the correction-loop routing engine. (Walks the provenance chain.)
3. **Gate root-cause** — per issue/cluster: which gate *should* have caught it and why it didn't. (Process forensics: B vs D. Produces the workflow-correction findings.)
4. **Remediation plan** (human-gated) — per issue: fix route + the matching gate correction. Approved before anything is touched.
5. **Fix + verify** — fix at origin, gated on *demonstrated* evidence (reperformance, producer ≠ verifier, reproducible by the human; don't trust the inherited test suite).
6. **Workflow corrections** — the justified gate/process fixes (deliverable; target the AgentBoard workflow, a different surface than the codebase).
7. **Closure** — confirm fixes by evidence AND that the gate corrections address the root-causes.

**Per-phase deliverable for the original work:** running the evidence model over each original phase produces a **cross-referenced `claimed | actual | required` reconstruction** with the gate-failure analysis attached.

---

## 9. Standards & methods this structure follows

The phase structure is a synthesis of established **corrective-action** and **forensic-investigation** standards, not an invention:

- **8D (Eight Disciplines of Problem Solving)** — Ford's Global 8D — the backbone: D2 define the problem, D3 contain it, D4 root cause, D5 corrective action, D6 implement, D7 prevent recurrence, D8 closure. Our phases map to D2–D8.
- **CAPA (Corrective And Preventive Action)** — ISO 9001:2015 §10.2 (nonconformity & corrective action); FDA 21 CFR 820.100 — the **dual mandate** as a recognized discipline: corrective action (fix the nonconformance + its cause) AND preventive action (stop recurrence). This is *why* "fix the issues AND fix the gates" is a standard, not our idea.
- **NIST SP 800-86** (Guide to Integrating Forensic Techniques into Incident Response) — the forensic process **Collection → Examination → Analysis → Reporting** — structures the investigation engine.
- **ISO/IEC 27037** (digital evidence) — identification, collection, acquisition, preservation, **chain of custody** — governs how the evidence corpus is gathered and kept.
- **ISA 500** (audit evidence) — nature & reliability; sufficiency & appropriateness — already the basis of the Tier-1/2/3 model (§4).
- **RCA methods** — 5 Whys, Fault Tree Analysis, Ishikawa — the analysis technique; gives symptom → contributing factor → root cause.
- **Blameless postmortem** (Google SRE) — timeline reconstruction, contributing factors, corrective actions, no-blame framing (agent behavior is *data*, not a defendant).
- **ISO 19011** (auditing management systems) — planning, conduct, reporting, follow-up — shapes scope and closure.

**Phase → standard map** (**8 phases**; Containment folded into the Phase-2 approval gate, and corrective+preventive *implementation* merged into the single kanban phase):

| Phase | Grounded in |
|---|---|
| 1 Issue Inventory | 8D-D2; ISO 27037 (identification) |
| 2 Subject Identification (+ containment side-effect) | 8D-D2 + 8D-D3 (interim containment); forensic scoping |
| 3 Scope Definition | ISO 19011 (planning); NIST 800-86 (collection scoping) |
| 4 Evidence Assembly | NIST 800-86 (Collection); ISO 27037 (acquisition/preservation/chain of custody) |
| 5 Forensic Investigation | NIST 800-86 (Examination + Analysis); ISA 500; RCA; blameless postmortem |
| 6 Remediation Plan (= task breakdown → populates kanban) | 8D-D5; CAPA (corrective + preventive planning) |
| 7 Implementation (kanban: fixes + workflow corrections; per-card verify) | 8D-D6 + 8D-D7; CAPA (corrective + preventive implementation); AgentBoard card lifecycle |
| 8 Closure | 8D-D8; CAPA (effectiveness review); ISO 19011 (follow-up); blameless postmortem |

---

## 10. Full phase outline (standards-grounded)

Per-phase format: **Purpose / Inputs / Activities / Deliverable / Approval gate / Guards against / Grounded in.** Every phase ends with the user reading + approving its deliverable before it advances; that is the only human action.

### Phase 1 — Issue Inventory
- **Purpose.** Turn the raw list into a structured, deduplicated register of discrete issues, each anchored to the concrete thing that exposed it. Capture, not judgment.
- **Inputs.** The incoming list (leads), any form.
- **Activities.** (1) Split into discrete entries (one issue each; split compound complaints). (2) Anchor each to its observation in concrete, reproducible terms — what was seen/done, not a conclusion; sharpen vague ones into investigable form without verifying. (3) Capture suspected cause, flagged as *hypothesis*. (4) Dedupe and loosely cluster related observations. (5) Assign stable IDs; status = UNVERIFIED.
- **Deliverable.** The **inventory**: `{id, observation, suspected-cause(hypothesis,opt), cluster, status:UNVERIFIED}`.
- **Approval gate.** You confirm fidelity of capture — nothing dropped, distorted, or smuggled in as fact. Not correctness (unknown yet).
- **Guards against.** Losing/distorting observations; starting from vague complaints; conclusions masquerading as facts; premature dismissal.
- **Grounded in.** 8D-D2; ISO 27037 (identification).

### Phase 2 — Subject Identification
- **Purpose.** Determine which prior work unit(s) produced each issue, coarse-grained (board/project/phase); exact card/agent/wave is the investigation's job.
- **Inputs.** The inventory.
- **Activities.** (1) Trace each entry from its observation to candidate work unit(s) by area/what-it-touched/timing. (2) Record multiple candidates where it spans units — no forced single attribution. (3) Build the suspect-set (union of implicated units). (4) Flag entries whose source can't be guessed even coarsely — they need the evidence phase to attribute.
- **Deliverable.** Inventory annotated with candidate suspect units + the consolidated suspect-set.
- **Approval gate.** You confirm the suspect-set covers the right work; nothing obviously implicated is missing. **On approval the suspect work is flagged UNTRUSTED/quarantined (containment, 8D-D3)** — nothing may build on, ship from, or depend on it until cleared; dependents already building on it are frozen (if already idle, the flag still prevents accidental resumption).
- **Guards against.** Investigating the wrong work; missing an implicated unit; premature single-source attribution; the damage compounding while the slow investigation runs (containment).
- **Grounded in.** 8D-D2 + 8D-D3 (interim containment, folded into the approval gate above); forensic identification/scoping.

### Phase 3 — Scope Definition
- **Purpose.** Bound the investigation — which suspect units, at what depth, requiring what evidence — so it is neither shallow (misses things) nor unbounded (never ends).
- **Inputs.** Annotated inventory + suspect-set; containment record.
- **Activities.** (1) Decide in/out and depth per unit (full phase-by-phase reconstruction vs targeted). (2) State the investigation questions that must be answered to close. (3) Derive evidence requirements: which of A/B/C/D for which units, and expected B-availability (retention/locality). (4) Set the completeness bar: sample *all* in-scope phases/cards, not just where issues were spotted.
- **Deliverable.** Scope statement — in/out, depth, investigation questions, evidence requirements, completeness bar.
- **Approval gate.** You approve the boundary and the completeness bar — your lever on effort vs thoroughness.
- **Guards against.** A shallow investigation that misses unseen issues; an unbounded one that never closes; starting with no definition of "done."
- **Grounded in.** ISO 19011 (audit planning); NIST 800-86 (collection scoping).

### Phase 4 — Evidence Assembly
- **Purpose.** Gather and preserve the evidence corpus for the in-scope subject, and honestly determine what's available (especially B-coverage) before analysis.
- **Inputs.** Scope statement.
- **Activities.** (1) Collect A (ground truth): snapshot code state, git, configs; prepare the build/run env for reperformance. (2) Collect B (transcripts): guaranteed path (snapshotted) or best-effort disk-grep per §5.1; record what's available/degraded. (3) Collect C: cards, artifacts incl. superseded, activity log, board config. (4) Collect D: agent profiles, workflow defs, spec + arch doc as they were at the time. (5) Preserve with chain of custody — each item recorded with its source and a way to re-open/re-run it. No analysis yet.
- **Deliverable.** Evidence corpus + **coverage report** (present / degraded / missing; where B is unavailable and outcome-only forensics applies).
- **Approval gate.** You approve the corpus is sufficient for the in-scope questions, and you see where coverage is degraded.
- **Guards against.** Analysis on incomplete/contaminated evidence; silent gaps; evidence that can't be re-opened later.
- **Grounded in.** NIST 800-86 (Collection); ISO/IEC 27037 (acquisition, preservation, chain of custody).

### Phase 5 — Forensic Investigation
- **Purpose.** Establish the truth. Convert the unverified inventory into evidence-backed **findings** (confirm/refute/reclassify each), discover the issues the unravel never reached, and root-cause both the defects and the gate failures.
- **Inputs.** Inventory (P1), suspect units (P2), scope (P3), evidence corpus + coverage (P4).
- **Activities.** (1) **Outcome forensics:** per in-scope phase/card, reconstruct `claimed | actual | required` (C2/Tier-3 vs A/Tier-1 vs D3); contradictions are candidate findings. (2) **Process forensics:** join each card-agent's transcript via `attributionAgent`→profile (D1); compare what it *did* (B tool-calls) vs what the profile said; check orchestrator (B1) vs workflow defs (D2) for over-feeding. Gate failure proven when B shows no reperformance yet C2 shows PASS. (3) **Substantiate** each inventory entry with Tier-1 evidence. (4) **Expand** — sample all in-scope work; add issues you never hit. (5) **Triangulate + RCA:** ≥2 independent, different-nature sources per finding; sort symptom → contributing factor → root cause. (6) **Timeline** from activity log + transcript timestamps (rubber-stamp detection).
- **Deliverable.** The **findings**: `{what's wrong (evidenced), origin (spec/arch/plan/code/gate), triangulated sources, gate that failed + why (root cause), confidence}` + per-phase `claimed|actual|required` reconstructions + a coverage statement.
- **Approval gate.** You confirm each finding is evidence-backed (cites reproducible Tier-1 sources), not narrative; the investigation is sound and sufficiently complete. No fixes yet.
- **Guards against.** Fixing symptoms not causes; trusting the fabricated narrative layer; firefighting only spotted issues; unsubstantiated findings driving rework; undiagnosed gate failures.
- **Grounded in.** NIST 800-86 (Examination + Analysis); ISA 500; RCA; blameless postmortem.

### Phase 6 — Remediation Plan
- **Purpose.** Decide what to do about each finding — the fix at its origin AND the matching preventive correction — before anything is touched. Corrective + preventive, paired.
- **Inputs.** The findings.
- **Activities.** (1) Per finding, choose the fix route at its true origin (code / re-architecture / spec change) via the correction-loop engine. (2) Per gate-failure root cause, pair a preventive workflow correction (gate/profile/hook fix) — corrective and preventive linked finding-by-finding. (3) Sequence the work (dependencies); define per-card acceptance criteria and the reproducible Tier-1 evidence each card must produce. (4) Express the plan as kanban cards: corrective fix cards (code, in this project) + preventive workflow-correction cards, each kept linked to its finding.
- **Deliverable.** The remediation plan — per finding: fix route, acceptance criteria, required evidence, paired preventive correction, sequence.
- **Approval gate.** You approve the plan before any code is touched. **Approving it populates the kanban** — the main go/no-go.
- **Guards against.** Fixing without a plan; corrective-without-preventive (symptom-only); unsequenced colliding fixes; fixes with no defined pass-evidence.
- **Grounded in.** 8D-D5; CAPA (corrective + preventive planning).

### Phase 7 — Implementation (kanban)
- **Purpose.** Do the work and prove it. Every corrective fix and preventive workflow-correction from the task breakdown runs on the board — fixes at their origin, corrections produced for the AgentBoard workflow — each gated on reproducible Tier-1 evidence by a verifier independent of the fixer.
- **Inputs.** The approved remediation plan (the populated kanban).
- **Activities.** (1) Each card runs the board lifecycle — a fixer agent implements; an **independent verifier** (≠ fixer) **reperforms** (actually builds/runs/tests, captures raw evidence: stdout, exit codes, diffs, screenshots); the **audit/verify column IS the evidence gate** — a card cannot finish on a prose claim. (2) Don't trust the inherited test suite — establish a real verification baseline (repair/re-author fake tests) on the relevant cards. (3) A card failing verification routes back to fixing, not forward. (4) **Corrective (code) cards** are applied in this project's target codebase; **preventive (workflow-correction) cards** produce a precise, justified, regression-backed correction *spec* and are **handed off** for application in the AgentBoard repo (a project targets one codebase) — verified by demonstrating the corrected gate would catch the failure class.
- **Deliverable.** Verified corrective fixes (in the codebase) + verified preventive correction specs (for hand-off) — each card carrying its evidence package (acceptance criteria + reproducible Tier-1 proof).
- **Approval gate.** You read each card's evidence package and approve on the captured, re-runnable artifacts — never the agents' assurances. (Per-card, via the board.)
- **Guards against.** The disease recurring (claim-based completion); producer self-verifying; fake-test baselines; forward progress on unverified work; batching verification to the end.
- **Grounded in.** 8D-D6 + 8D-D7 (corrective implementation + prevent recurrence); CAPA (corrective + preventive); the AgentBoard card lifecycle (implement → audit).

### Phase 8 — Closure
- **Purpose.** Confirm both mandates were met — every in-scope issue resolved by evidence, every gate-failure root cause addressed — and record the postmortem so the lesson persists.
- **Inputs.** Verified fixes + workflow corrections (P7), findings (P5).
- **Activities.** (1) Reconcile: every finding → a verified fix (or an accepted, justified deferral); every gate-failure root cause → a workflow correction (executed or handed off). (2) Effectiveness check: confirm fixes hold together (the whole builds/runs, not just per-card); lift containment (the P2 untrusted flag) only now. (3) Write the blameless postmortem: timeline, what failed, why the gates allowed it, what changed. (4) Final sign-off.
- **Deliverable.** Closure report — reconciliation, effectiveness confirmation, postmortem, lifted-containment record.
- **Approval gate.** Final read + approve. Nothing closes and containment isn't lifted until you sign off.
- **Guards against.** Declaring done with issues/root causes unaddressed; lifting quarantine prematurely; losing the lesson.
- **Grounded in.** 8D-D8; CAPA (effectiveness review); ISO 19011 (follow-up); blameless postmortem.

---

## 11. Edge cases, error handling & negative requirements

Surfaced in the Challenging pass. The big design refinement: a third finding state, **INDETERMINATE** — distrust cuts both ways, so a finding that can't be confirmed *or* refuted is never forced to pass or fail.

### Finding verdict states (refinement)
Every lead/finding ends in exactly one of: **CONFIRMED** (Tier-1 evidence backs it), **REFUTED** (Tier-1 disproves it), or **INDETERMINATE** (insufficient evidence — e.g. B unavailable, won't reproduce). INDETERMINATE findings are surfaced explicitly with what evidence is missing; never silently dropped or assumed.

### Edge cases & error handling
- **B-layer unavailable** (pruned past retention / cloud-remote run): degrade gracefully — outcome forensics (A) + records (C) still run; process-forensics findings that *need* B become INDETERMINATE, not assumed; the coverage report states the gap.
- **A finding won't reproduce** (state/env changed, flaky): record the attempt; mark INDETERMINATE; don't fix a ghost, don't silently drop.
- **Investigation finds nothing** (leads were wrong / already fixed): close clean with "no substantiated findings." Never manufacture findings to justify the project.
- **Evidence refutes a user lead**: mark REFUTED with the evidence and surface it — leads are hypotheses, refutation is a first-class result.
- **A fix can't be verified by reperformance** (needs external system/hardware): the card cannot pass the gate on a claim; escalate as "unverifiable — human decision," explicitly flagged NOT Tier-1.
- **A fix regresses another verified fix**: the Closure effectiveness check (whole builds/runs, not just per-card) catches it; regressions route back to fixing.
- **Root cause is in the spec**: route via correction-loop as a spec-origin change; flag that it may invalidate other findings/fixes (re-derive the affected set).
- **The only real fix is a workflow/gate change** (no separate code defect): there may be no corrective code card — just the preventive correction (handed off). Don't force a code fix.
- **Scope balloons** (investigation keeps finding more): the Phase-3 boundary + completeness bar bound it; issues beyond the boundary go to a follow-up remediation, not absorbed indefinitely.
- **Suspect work spans multiple projects/boards**: Subject ID records all; Scope decides which are in *this* remediation vs spun off separately.
- **Recursion — the remediation's OWN agents fabricate**: the type holds itself to its own standard — Tier-1 + mechanical cross-check + human approval apply to its own work, and its own transcripts are captured (dogfoods the insurance hook), so it is itself auditable.
- **Containment can't be fully applied** (suspect work already shipped/depended-on): record what couldn't be frozen and flag the exposure; never pretend it's contained.

### Negative requirements (the type must NOT)
- Mutate the target codebase before the Remediation Plan is approved (read-only through Phase 6).
- Accept any finding or card on prose claims — only reproducible Tier-1 evidence.
- Trust the inherited test suite as a verification baseline.
- Silently drop, dismiss, or assume any lead/finding — every one ends CONFIRMED / REFUTED / INDETERMINATE, visibly.
- Manufacture findings to justify itself.
- Lift containment before Closure sign-off.
- Auto-advance past a human approval gate.
- Commit workflow corrections into the AgentBoard repo from within the project (produce + hand off; single target).
- Batch verification to the end (per-card evidence gating only).
- Absorb new-scope / feature work (that is `foundation`, not remediation).

---

## 12. Running scratchpad

```
Decided:
  - New custom-phase AgentBoard project type for post-completion remediation (server will support custom phases).
  - Phases must be load-bearing (no paddable slots); gates pass on EVIDENCE, not claims.
  - Dual mandate: fix issues at origin AND root-cause + correct the gates that let them slip.
  - Origin-agnostic; reuses correction-loop routing; dual-target (codebase + AgentBoard workflow).
  - Intake = single-session unravel; each issue anchored to the concrete observation that exposed it.
  - Disease: claim-based completion + fabricated evidence (fake tests, false env excuses).
  - Investigation = forensic process-audit. KEY: reliability is inverted — agent self-reports (Tier 3)
    are weakest/fabricated; anchor on reperformance + objective records (Tier 1).
  - Two braided investigations: OUTCOME forensics (A vs C2/D3) + PROCESS forensics (B vs D).
  - Method: provenance chain + triangulation (>=2 independent different-nature sources); contradiction-hunting;
    timeline reconstruction; symptom -> contributing factor -> root cause.
  - Evidence mapped in 4 layers (A ground truth, B transcripts, C AgentBoard records, D declared process).
  - Deliverable over the original work: per-phase claimed|actual|required reconstruction + gate-failure.
  - Transcripts (B-layer) CONFIRMED retrievable: per-card subagent jsonl under
    ~/.claude/projects/<cwd-slug>/<sessionId>/subagents/; join via grep of AgentBoard board_id/card_id
    embedded in agent prompts; attributionAgent gives transcript->profile mapping; append-only = compaction-proof.
  - INSURANCE (forward-looking workflow correction): snapshot transcripts to durable store at orchestration
    end -> guaranteed B for future runs. Legacy runs (incl. current disaster) use best-effort disk-grep.
  - BUILD INSURANCE NOW, as a separate change, via hooks + scripts: SubagentStop hook per card-agent ->
    copy that subagent transcript to durable store + append a manifest row (card_id from embedded IDs in the
    prompt; agent type from attributionAgent; ordered by timestamp) => card -> [ (wave, agent, transcript) ],
    which gives subagent->card AND its specific work on that card. SessionEnd hook as backstop. Remediation
    type still carries best-effort disk-grep for legacy runs.
  - HUMAN LINE: the user does read + approve ONLY. All verification is agent-side (independent verifiers that
    REPERFORM + capture Tier-1 evidence). Human approves EVIDENCE PACKAGES (raw reproducible artifacts),
    never prose claims.
  - PHASE ORDER (per the AgentBoard state machine): ALL document phases run first, in order, each gated by an
    approved doc; approving the last one (Remediation Plan = task breakdown) unblocks/populates the kanban, where
    the fixes + workflow corrections are implemented and verified (audit column = the evidence gate); then
    review/complete. It is ONE workflow with one rule -- documentation before implementation -- NOT separate
    "stages". (Also right for forensics: finish the investigation + approve the plan BEFORE touching anything.)
      Document phases (in order, read-only, each approved):
        1 Issue Inventory        -> inventory doc
        2 Subject Identification -> suspect-set doc  (approving it flags suspect work UNTRUSTED = containment,
                                    an approval side-effect, not a separate phase)
        3 Scope Definition       -> scope doc
        4 Evidence Assembly      -> evidence corpus + coverage doc
        5 Forensic Investigation -> findings doc
        6 Remediation Plan       -> task breakdown (corrective fixes + preventive workflow corrections, paired)
                                    -- APPROVING THIS POPULATES THE KANBAN
      Then: kanban implementation (fix cards + workflow-correction cards; audit = evidence gate) -> close
      (reconcile findings->fixes & root-causes->corrections, lift containment, postmortem, sign-off).
    Grounded in named standards (§9): 8D + CAPA backbone; NIST 800-86 / ISO 27037 / ISA 500 forensic engine;
    RCA; blameless postmortem; ISO 19011.
    §10 now matches: 8 phases -- 1 Inventory, 2 Subject ID (+containment), 3 Scope, 4 Evidence Assembly,
    5 Forensic Investigation, 6 Remediation Plan (= task breakdown -> kanban), 7 Implementation (kanban), 8 Closure.
    AgentBoard auto-prepends its own Initialization phase (not authored here).

Ruled out:
  - Trusting agent narratives (notes/reports/"tests pass") as evidence on their own.
  - Workarounds; fixed 13 phases; designing around specific issue types; reusing the failed pipeline as-is;
    slow multi-session intake.

Open questions / remaining design work (CLAUDE decides these — not user questions):
  - DECIDED: outcome vs process forensics weighted EQUALLY (the disease spans both).
  - DECIDED: name = "remediation" (provisional); single target_project_path (workflow corrections handed off);
    project records the suspect prior board/project IDs for provenance + transcript join; NEW cards for fixes.
  - DECIDED (scale: 100+ subagents/phase): the investigation is a TIERED FAN-OUT, never a linear read --
      Tier 0 (mechanical, ALL transcripts): a script parses each JSONL -> signal profile (attributionAgent =
        agent type; tools actually invoked; did it build/run/test; duration; verdict produced; timestamps). No LLM.
      Tier 1 (cheap triangulation, ALL cards): cross signal profiles vs ground truth (does code build/run?) +
        claims (verdicts). CONTRADICTIONS = the suspect set (e.g. audit=PASS but transcript shows no reperformance
        and the build fails). 100+ collapses to a small suspect subset.
      Tier 2 (deep-read, suspects ONLY, PARALLEL): fan out reader-agents, one per suspect, for precise root cause.
    Tier 0 -> Phase 4 (Evidence Assembly); Tier 1+2 -> Phase 5 (Forensic Investigation). The insurance hook can
    pre-compute Tier-0 signal profiles at SubagentStop so future runs skip the parse.
  - DECIDED: gate-model defense against VERIFIER fabrication = the verifier gets the SAME distrust. Its output is
    Tier-3 until backed by Tier-1 a SCRIPT can re-run + cross-check. Gate accepts a card only when the package is
    (a) captured execution output (stdout/exit/screenshot/diff), never prose; (b) ships the exact re-run command
    (non-reproducing fakes die on re-run); (c) mechanically consistent with the verifier's OWN transcript (the hook
    captures verifier subagents too -- a claim with no matching tool call is caught); (d) anchored on observed REAL
    behavior (app does X), not "tests pass" (a rigged suite can't satisfy it).
  - SPEC/BUILD TODO: B-layer preconditions (retention TTL ~30d, machine-locality, reconstructed-join disambig);
    snapshot = durable path for large transcripts + SECRET SCRUBBING; verify SubagentStop payload when building.

Current shape:
  See §1 for the one-paragraph. ONE workflow, documentation-before-implementation: 6 document phases in order
  (Inventory, Subject ID, Scope, Evidence Assembly, Forensic Investigation, Remediation Plan); approving the
  Remediation Plan populates the kanban, where fixes + workflow corrections are implemented and verified (audit
  column = the evidence gate); then close. Containment = approval side-effect of the Subject-ID doc.
  Challenging pass DONE (§11): added INDETERMINATE finding state; edge cases + negative requirements captured.
  Verifier-fabrication defense DECIDED. Next: converge on v1 scope -> compile the spec.
```
