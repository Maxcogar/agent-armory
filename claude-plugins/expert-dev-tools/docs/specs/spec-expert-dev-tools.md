# Spec: expert-dev-tools plugin

**Status:** Draft — pending owner approval
**Date:** 2026-07-20
**Owner:** Max Cogar
**Repo:** Maxcogar/agent-armory, `claude-plugins/expert-dev-tools/`

---

## 1. Problem and goal

The Expert-series skills (`skills/Expert-Skills/`) define six phase procedures —
spec, architecture, plan, implement, review, plus the ambient expert-standard
frame — and a prose description of their order. No mechanism connects them.
Every transition, every approval, every routing decision, and all lifecycle
state is currently executed by the owner, by hand, every session: he notices a
phase has ended, ratifies its output, invokes the next skill, supplies the file
paths, runs 3–5 rounds of expert-review per phase, routes verdicts, resolves
STOP REPORTs, and maintains handoff documents so the next session knows where
things stand. The owner is the workflow.

The owner is not a developer. His answer to engineering questions is, by his
own standing statement, "go figure it out." The gates he operates by hand exist
only because agents have repeatedly skipped steps, added unrequested work,
removed requested work, and delivered low-quality output — and he was the only
enforcement available.

**Goal:** a Claude Code plugin that packages the Expert skills and adds the
missing piece — an end-to-end lifecycle workflow that runs the phases, operates
the quality gates mechanically, and involves the owner only where his input is
irreplaceable: confirming intent, deciding business trade-offs, accepting risk,
and approving memory ingestion.

**Success looks like:** the owner states a task; the machine runs the lifecycle
gated by independent reviews looping to a binary PASS; the owner is interrupted
only at the defined escalation points; the finished work arrives verified
against ground truth, reconciled against the spec end-to-end, committed and
PR'd, with status documentation and a drafted CORE ingestion awaiting his
approval.

## 2. Scope

**In scope:**
- One plugin: `expert-dev-tools`, at `claude-plugins/expert-dev-tools/`.
- Packaging the nine Expert-series skills with mechanical repairs only
  (§5, R-1).
- The lifecycle workflow (native Claude Code Workflow script) implementing the
  twelve functions in §4.
- The `/expert` entry command, phase agent definitions, MCP declaration and
  preflight.
- Testing per §9.

**Out of scope, with reasons:**
- Rewriting or improving the content of any Expert skill. The skills' content
  is the owner's; this plugin delivers it. (Exception: the single approved
  amendment D-2.)
- Marketplace publication and installs outside the owner's machines. Not
  requested; portability beyond declared MCP handling is not a v1 requirement.
- Hard-gating hooks that block tool use outside the lifecycle (the "governance
  layer"). Out of scope — owner decision 2026-07-22: the workflow's own
  deterministic gates enforce lifecycle order for all work run through
  `/expert`, and global hard-gating of edits made outside the workflow was
  judged unwanted friction. This is not a deferral; out-of-band enforcement is
  simply not this plugin's job.
- Changes to other plugins, marketplace configs, or `skills/Expert-Skills/`
  (the source copies stay untouched; the plugin carries its own repaired
  copies). Per repo standing rules.
- The `expert-mcp-overhaul` and `frontend-standards` skills participating in
  lifecycle *orchestration*. They are packaged and available as skills, but the
  lifecycle state machine covers the five-phase chain plus expert-standard;
  domain-specific lifecycles are follow-on work.

## 3. The lifecycle model

### 3.1 Phases and artifacts

```
task → SPEC → [intent gate: owner] → ARCHITECTURE → PLAN → IMPLEMENT
     → IMPLEMENTATION REVIEW → GROUND TRUTH → CLOSEOUT
```

- Every phase output is gated by an independent review loop (§3.3) before the
  next phase consumes it.
- Routing variant: spec → plan directly when architecture is already fixed
  (per expert-spec's own rule); the router (§4, F-1) makes this call and
  records its reasoning in the ledger.
- Artifacts live where the skills already put them: `docs/specs/spec-*.md`,
  `docs/arch/`, `docs/plans/plan-*.md` in the target project.

### 3.2 Runs and gates

A Workflow run cannot pause for user input mid-script. The lifecycle is
therefore a series of workflow runs between owner gates:

- **Run 1:** intake → preflight → spec → spec review loop → halt at the
  **intent gate**.
- **Run 2..n:** advance through every machine gate — architecture → review
  loop → plan → review loop → implement → implementation review loop → ground
  truth → closeout — halting early only when an owner escalation (§3.4) fires.

The `/expert` command operates the runs: it invokes the workflow, receives its
structured outcome, presents any gate to the owner in plain language (what
happened, options, recommendation), and resumes on his answer.

### 3.3 The review-loop gate (the engine)

At every gate: a fresh-context reviewer agent runs expert-review on the
artifact with blinded, mechanical-only inputs. Verdict is binary — PASS
requires zero findings of any severity (per expert-review; no middle verdicts).
NEEDS FIXES routes back: for documents, the authoring phase revises against the
findings; for implementation, findings go through a remediation plan, then
re-implementation, then post-fix review — never informal fixes. Each round uses
a fresh reviewer. The round that would grant PASS on the implementation gate is
a multi-lens panel (correctness, security, faithfulness-to-plan); PASS requires
all lenses. Round counts are tracked; breaching the round cap escalates to the
owner with the ledger as the record (never acceptance-by-exhaustion — this
implements expert-review's own anti-exhaustion rule mechanically).

### 3.4 Owner escalation policy (exhaustive list)

The owner is interrupted for exactly these, and nothing else:

1. **Intent gate** — approve the spec: "is this what you meant?"
2. **Spec-traceable issues** — any downstream contradiction, ambiguity, gap,
   or unsettled trade-off that traces back to the spec. Machine resolution
   forbidden.
3. **Business trade-offs** — genuine bin-2 decisions (spend, scope, product
   choices with multiple defensible answers).
4. **Risk overrides** — a STOP REPORT where amend-plan is not viable and the
   only path forward is accepting a risk. Standing policy: STOP REPORTs route
   to amend-plan automatically; override is never chosen by the machine.
5. **Non-convergence** — a review loop breaches its round cap, or amendment
   propagation cycles.
6. **CORE ingestion approval** — the drafted ingestion message. Never
   auto-ingested. No exceptions, ever.
7. **Control faults** — a mechanical control (a verifier dispatch) could not
   run, or returned less than it was asked to check. The phase is
   **unverified** — not failed, and not non-convergent: no review loop ran to
   a cap, and nothing traces to spec intent. Re-running the phase is the
   usual answer. *(Amended 2026-08-19 by owner decision, corrections-0.3.0
   round-7 finding F7-2: the acceptance run surfaced control failures —
   empty verifier returns, a mis-targeted ground-truth dispatch — that fit
   none of the six original types; typing them honestly beats stretching
   `non_convergence` or `spec_traceable`. Evidence and review records:
   docs/reviews/corrections-0.3.0-round-05.md through -07.md.)*

Engineering questions are never escalated. They are bin-1: the phase agent's
job, per expert-plan's own rule.

**Every escalation arrives diagnosed.** No gate reaches the owner as a bare
problem report: per F-13, escalations 2–5 carry the root-cause diagnosis and
a drafted correction, so the owner approves or rejects a proposed fix rather
than researching a failure. (Gate 1 carries the spec itself; gate 6 carries
the drafted ingestion — both are already draft-shaped.)

## 4. Functional requirements — the twelve functions

- **F-1 Intake and routing.** Classify the task: new work, resume, or
  amendment of prior work; full lifecycle or spec→plan short path. Decision by
  rule, recorded with reasoning in the ledger.
- **F-2 Environment preflight.** Before any phase: required MCPs answer
  (CodeGraph, Clear Thought, Context7), target repo workable, skills and
  reference files present, project rules readable. Failure reports exactly
  what is missing. No phase spends tokens on a doomed environment.
- **F-3 Context provisioning.** The workflow assembles each agent's complete
  input package: governing artifacts, project rules, amendment history,
  decisions. Reviewer packages are blinded and mechanical-only, identical in
  shape every dispatch.
- **F-4 Phase execution.** Each phase dispatched with its Expert skill loaded
  and structured output enforced by schema: artifact path, halt report,
  questions raised, evidence index. Free-text returns are a dispatch defect.
- **F-5 Gate operation.** The review loop per §3.3: fresh reviewers, parsed
  verdicts, round tracking, routing, caps.
- **F-6 Quality enforcement beyond gates.**
  - Evidence captured mechanically to the ledger (tool outputs, not agent
    summaries).
  - Spot re-runs: the workflow re-executes a sample of each phase's cited
    verifications; a mismatch is a finding against the phase agent.
  - Mechanical diff-vs-plan check after implementation: any touched file
    outside the plan's list is a violation, both directions.
  - Whole-chain reconciliation at closeout: every spec requirement → the diff
    implementing it → the evidence verifying it; every diff hunk → the plan
    step authorizing it. Unmapped items in either direction are findings.
  - Ground-truth acceptance (§3.1): spec acceptance criteria executed against
    the running system, per-criterion pass/fail with captured evidence.
    Document review is never accepted as proof of behavior.
- **F-7 State and record keeping.** Durable ledger at
  `.claude/expert/ledger.json` in the target project: phase, artifact versions,
  verdicts, rounds, amendments, escalations, approvals, evidence index, budget.
  Human-readable `STATUS.md` generated from the ledger (satisfying the repo's
  handoff-documentation rule mechanically). Any session resumes from the
  ledger exactly.
- **F-8 Amendment propagation.** Any artifact amended mid-lifecycle triggers
  re-validation of all downstream artifacts. Amendment recorded in the ledger
  with cause. Spec-touching amendments escalate (§3.4.2).
- **F-9 Escalation and communication.** Gates presented in plain language:
  what happened, the options, the recommendation and why. No engineering
  jargon in owner-facing output.
- **F-10 Closeout.** Final report against the spec; STATUS.md updated; work
  committed and PR'd per repo conventions; CORE ingestion message drafted in
  the exact protocol format and presented for approval (§3.4.6).
- **F-11 Budget stewardship.** Token spend tracked per phase and per round in
  the ledger; reported at every gate; runaway loops escalate rather than burn.
- **F-12 Failure handling.** Structured halts routed by standing policy;
  dead/stalled agents retried once then escalated; MCP loss mid-phase is a
  structured halt, not silent degradation; recovery always from the ledger
  plus workflow-native run resume so paid work never repeats.
- **F-13 Diagnosis and correction drafting.** Every non-routine failure —
  review-loop non-convergence, a caught fabricated verification, a
  ground-truth criterion failure, an environment block, a ledger integrity
  failure, a blast-radius stop, chain incoherence after an amendment — is
  diagnosed before it is routed: a dedicated diagnostic pass gathers the
  evidence (ledger, run journal, artifacts, the failing output), identifies
  the root cause with evidence rather than restating the symptom, and drafts
  the specific correction that removes it. Corrections are classified:
  machine-applicable ones route automatically through the normal
  amend → review path; owner-owned ones (spec-traceable, business, risk,
  environment) escalate. Routine review findings are not double-diagnosed —
  the review loop already carries its own findings-to-remediation path.
  Corrections are bound by doctrine: applied only through the planned,
  reviewed amend path (no quick-fix tier); applied at the artifact where the
  root cause lives, never patched downstream; never permitted to weaken the
  mechanism that caught the failure (tests, criteria, schemas, gates — any
  such change is owner-owned by definition); verified by re-executing the
  exact originally-failing check; and a recurring failure signature after a
  correction escalates with both diagnoses rather than retrying.
- **F-14 Systemic-defect detection from owner feedback.** At segment
  boundaries — never mid-phase, never in the owner's prompt path — the
  diagnostic layer reads the project's existing session transcripts from the
  last processed position forward, and identifies statements where the owner
  flagged a problem. Statements are clustered by complaint signature across
  the whole transcript history; a signature occurring more than once
  (including across sessions) is a systemic defect: it enters the F-13
  pipeline with the responsible plugin/process component as the diagnosis
  target, and its correction follows the full correction doctrine.

  **Scope of the defect history.** Complaints about the plugin's own shared
  machinery (agent definitions, packaged skills, the command, routing) recur
  across *projects*, because the machinery is shared. The signature history
  for those is therefore plugin-scoped and persistent across projects and
  plugin updates, not stored per project. Complaints scoped to one project's
  work stay in that project's ledger. Read-position markers are per project.
  No transcript content is copied into either store — only signatures,
  occurrence records, and dispositions.

  **Correction state, versioning, and failed corrections.** Corrections to
  the plugin's own machinery are changes to the plugin source, applied through
  the reviewed amend path and released as a committed, version-bumped change —
  never patched into the replaceable installed copy. Every signature carries
  its state: `open`, or `corrected` with the plugin version the fix landed in.
  A signature recurring after it was corrected is classified by the running
  plugin's version: if the running version already contains the fix, it is a
  **failed correction** — the strongest defect signal the system produces,
  escalated immediately with the original diagnosis and the applied fix, never
  re-entering the automatic correction path; if the running version predates
  the fix, it is a **stale deployment** — the disposition is "update the
  plugin," not a new correction. Versioning is what makes this distinction
  exact and is why an update can never silently lose a fix: the fix is part of
  the version being installed. This is the correction doctrine's recurrence
  tripwire applied to owner feedback.

  Only a read-position marker and these signature records are persisted; no
  separate feedback store is created, because transcripts already contain the
  statements plus the surrounding context that makes clustering accurate.
  Nothing about this function touches the owner's turn: no hook, no capture
  step, no added latency. Dispositions surface in STATUS.md and, when
  owner-owned, attach to gates the owner was already going to see.

## 5. Plugin components and repairs

```
claude-plugins/expert-dev-tools/
  .claude-plugin/plugin.json
  skills/            ← nine Expert skills, repaired copies
  commands/expert.md ← /expert entry point (F-1, F-2 front door; run operator)
  agents/            ← spec-writer, architect, planner, implementer, reviewer
  workflows/expert-lifecycle.js  ← the orchestrator (invoked by scriptPath)
  .mcp.json          ← Context7 + Clear Thought declared; CodeGraph preflighted
  docs/specs/        ← this document
```

**R-1 Skill repairs (mechanical only, content verbatim):**
- Unescape the corrupted markdown in `expert-spec` and `expert-review`
  (`\---` → `---`, `\##` → `##`, etc.) so they parse as skills.
- Flatten `expert-architecture-portable/expert-architecture-portable/` and
  `expert-mcp-overhaull/expert-mcp-overhaul/`; fix the `overhaull` misspelling.
- Carry `references/` directories with their skills (expert-plan:
  output-contract.md, testing-standards.md; expert-implement:
  verification-taxonomy.md, review-handoff.md).
- Source copies in `skills/Expert-Skills/` are not modified.

## 6. Decisions made during this design

- **D-1 Workflow-centric orchestration.** The lifecycle's connective tissue is
  a native Workflow script, not a guided procedure the main agent follows.
  Rationale: the missing piece is deterministic orchestration — transitions,
  state, gates — which is exactly what the Workflow tool provides and what
  prose instructions have repeatedly failed to enforce. Owner-directed from
  the first message.
- **D-2 Implementation runs as a dispatched agent** *(owner-approved
  amendment)*. expert-implement's text says "as the main agent with no
  subagent" — written for interactive sessions to prevent delegation drift.
  The plugin copy amends this wording: one dedicated fresh-context agent owns
  the entire plan execution, delegates nothing further, and review remains
  independent — the rule's intent preserved. Approved by the owner 2026-07-20.
- **D-3 The intent gate stays.** One owner approval at the spec. Rationale:
  it is the single question only the owner can answer, and a wrong intent
  poisons every downstream phase at full token cost.
- **D-4 Closeout owned by the workflow** including commit, PR, and CORE
  ingestion draft. Ingestion itself always requires owner approval.
  Owner-approved 2026-07-20.
- **D-5 STOP REPORT standing policy.** Route to amend-plan automatically;
  never auto-override; option B (risk acceptance) always escalates.
  Rationale: override is the only STOP option that is an ownership decision
  rather than an engineering one.
- **D-6 Ledger at `.claude/expert/`** (machine state) with generated
  `STATUS.md` (human state). Rationale: machine state does not belong in
  `docs/`; humans should never need to read JSON to know where work stands.
- **D-7 Skills packaged verbatim + R-1 repairs only.** Rationale: the content
  is the owner's held standard; the plugin's job is delivery, not editing.
- **D-8 MCP handling split.** Context7 and Clear Thought are npm-runnable and
  declared in `.mcp.json`; CodeGraph is a local server whose presence is
  verified by preflight with an exact report when missing. Rationale: declare
  what is portable, verify what is not, never let a phase discover a missing
  tool mid-flight.
- **D-9 The owner's review-loop practice is the gate engine.** 3–5 rounds to
  PASS is expected behavior, now machine-operated with fresh reviewers,
  round caps, and a multi-lens final round. Rationale: the practice is proven;
  its cost was the owner's manual operation, which is what this removes.
- **D-11 Repeat-complaint detection reads existing transcripts** *(owner-directed
  addition, 2026-07-21; revised same day)*. The owner having to say the same
  thing twice is itself a defect signal the system must consume. Detection
  runs only at segment boundaries and reads the project's session transcripts
  from a persisted read-position marker. Rationale: transcripts already hold
  every owner statement plus the context around it, permanently and per
  project — a capture hook writing a parallel register would duplicate that
  data in a strictly poorer form (isolated statements, no context) while
  adding a component and a synchronization burden. Reading the existing
  record satisfies the requirement with less machinery, and processing at
  boundaries honors the owner's requirement that primary work is never
  interrupted or distracted by the correction process.
- **D-10 Diagnostic and correction layer** *(owner-directed addition,
  2026-07-21)*. Non-routine failures are root-caused and arrive with drafted
  corrections; machine-applicable corrections apply automatically through
  amend → review. Rationale: the owner is not a developer and his standing
  response to problems is "go figure it out" — a system that escalates
  undiagnosed problems is delegating its diagnosis to the one participant
  least positioned to do it. Problems must arrive solved-pending-approval or
  not arrive at all.

## 7. Constraints

- Workflow scripts are deterministic: no `Date.now()`, `Math.random()`,
  filesystem, or Node APIs in the orchestrator; all real work happens inside
  dispatched agents. (Per the Workflow tool contract and the vetted
  workflow-creator guide at `skills/workflow-creator/`.)
- No mid-run user input: every owner gate is a run boundary (§3.2).
- expert-plan and expert-architecture halt without their required MCPs — this
  is skill behavior the plugin honors, surfaced early by F-2 rather than
  worked around.
- Repo standing rules apply: no template files written by passive bootstrap;
  no touching other plugins or marketplace configs; CORE ingestion protocol
  exactly as specified in the project CLAUDE.md.

## 8. Non-functional requirements

- **Honesty of state.** The ledger and STATUS.md never claim more than the
  evidence shows: "code-complete, pending independent review" until PASS;
  failed criteria reported as failed.
- **Resumability.** Any interruption at any point is recoverable from the
  ledger without repeating completed paid work.
- **Owner-legibility.** Everything owner-facing (gates, STATUS.md, final
  report) is readable by a non-developer.
- **Budget transparency.** Spend visible per phase at every gate.

## 9. Acceptance criteria

- **A-1** All nine skills load in a session with the plugin installed
  (frontmatter parses; skills invocable), including repaired expert-spec and
  expert-review.
- **A-2** `expert-lifecycle.js` passes the workflow-creator linter; plugin
  structure passes plugin-dev's validator.
- **A-3 End-to-end fixture run:** on a small fixture project with a toy task,
  `/expert` runs the full lifecycle — spec produced, intent gate presented,
  post-approval phases advance through review loops to PASS, ground truth
  executed, closeout artifacts produced (report, STATUS.md, commit, PR
  prepared, CORE draft presented).
- **A-4 Forced failures caught:** (a) a planted out-of-plan file change is
  caught by the diff-vs-plan check; (b) a planted fabricated verification
  claim is caught by spot re-run; (c) a planted spec contradiction discovered
  at plan time escalates to the owner rather than being machine-resolved;
  (d) a review loop with a forced never-PASS reviewer breaches the round cap
  and escalates.
- **A-5 Resume:** a run killed mid-lifecycle resumes from the ledger without
  repeating completed phases (verified by run journal).
- **A-8 Feedback loop:** a repeated owner complaint present in two fixture
  transcripts is detected at the next segment boundary, produces a
  systemic-defect diagnosis naming the responsible component, and does not
  interrupt the in-flight phase (verified by the run journal showing
  uninterrupted phase execution). A single-occurrence complaint in the same
  fixture is correctly classified as a course correction, not a defect.
- **A-9 Cross-project recurrence and failed corrections:** (a) a signature
  recorded against the plugin's shared machinery while running the fixture in
  one project is visible when the fixture is run in a second, different
  project — one occurrence in each is detected as a repeat; (b) a signature
  marked `corrected` recurring on a plugin version ≥ its fix version is
  classified as a failed correction, escalates with the original diagnosis
  plus the applied correction, and does **not** re-enter the automatic
  correction path (verified by the run journal showing no remediation
  dispatch); (c) the same signature recurring on a plugin version older than
  its fix version is classified as a stale deployment ("update the plugin"),
  not a failed correction and not a new defect.
- **A-7 Diagnosis quality:** each A-4 forced failure produces a diagnosis
  whose root cause names the planted defect (not a symptom restatement) and
  whose correction draft, if applied, would remove it; the A-4d
  non-convergence escalation reaches the owner carrying diagnosis and drafted
  correction.
- **A-6** Escalation messages contain what/options/recommendation and no
  unexplained engineering jargon (owner spot-check).

## 10. What comes after

Architecture document for the plugin (component design of the workflow script,
schemas, agent contracts, ledger format), then plan, then build — per the
lifecycle this plugin itself enforces. There is no pending governance-hook
layer: out-of-band enforcement is out of scope (§2), not deferred.
