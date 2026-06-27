# PowerMill MCP — Program Requirements (Define Phase)

> Date: 2026-06-22
> Phase: **Define** (problem → requirements). Per the project-lifecycle skill,
> this precedes Design (architecture). No architecture or implementation is
> decided here — only *what must be true* of any acceptable solution.
> Status: **Owner answers recorded (2026-06-27) — OQ-1/2/3 resolved; gate to Design cleared.** OQ-4/5 remain (scoped to subsystem B and posting).
> Method: ISO/IEC/IEEE 29148 requirements discipline as prescribed by
> `skills/project-lifecycle/references/phase-define.md` — every requirement is a
> property (not a recipe), traces to a source, is testable, unambiguous, and
> ranked; the threat model precedes the security requirements; judgment calls and
> open gaps are surfaced in this document.

---

## 1. The need (the problem, stated from need — not from existing code)

The owner runs a CNC shop and is **not** a PowerMill expert; PowerMill is, in his
words, "a major pain." The goal is a system where an **AI agent driving an MCP**
lets a non-expert get the **full range** of real CNC machining programmed in
PowerMill — safely — because the *tool and agent carry the machining expertise the
user does not have.*

Two facts shape every requirement below:

- **Expertise must live in the system, not the user.** The user should not have
  to know PowerMill to get correct output.
- **Breadth is mandatory, by construction.** The system must not be narrow to any
  one part, feature, or workflow. Overfitting to an example is a *failure*, not a
  risk to manage.

## 2. What "great" means (success definition)

A great PowerMill MCP is one where **an agent driving it can reliably accomplish
what a skilled machinist would accomplish, without guessing, improvising, or
dropping into raw command strings.** This decomposes into the quality bar the
requirements below enforce: no cliffs in a real job; tools at the altitude of
intent; safety enforced not hoped for; rich feedback for self-correction; real
shop judgment encoded; and built to grow without rotting.

## 3. Scope

This is a **program**, not a single deliverable. This document defines the
program's requirements. The program decomposes into subsystems, each of which
will get its **own** Define → Design → Build cycle after this document and the
program architecture are approved:

- **A. Capability core** — complete, typed, safe MCP coverage of the in-scope
  machining space (the current 46-tool server is the seed; see the coverage
  audit at `PowerMillMcpServer/docs/COVERAGE-AUDIT.md`).
- **B. Shop knowledge base** — curated, authoritative data (tools, holders,
  materials, machines, feeds/speeds, conventions), synced from Fusion 360.
- **C. Judgment layer** — the machining-expertise skill system.
- **D. Learning loop** — improvement grounded in *verified* outcomes.
- **E. Verification/feedback** — the ground-truth signal D depends on.
- **F. Lifecycle/governance harness** — how capability, skills, and learnings are
  added, tested, versioned, and promoted.

**Non-goals (this program, for now):** replacing Fusion 360 for CAD/CAM
authoring; GUI/visual simulation playback; DNC/machine connectivity; turning or
mill-turn unless shop scope (OQ-1) includes it. Non-goals may be revisited in a
later cycle but are explicitly out of this one.

## 3.1 Shop profile (resolves OQ-1)

The in-scope machining space is bounded by the owner's actual shop:

- **Machine:** 3/4-axis milling machine; ~20 hp, 12,000 rpm Kessler spindle;
  Renishaw part and tool probes.
- **Multi-orientation via a high-speed angle head — positional only.** A
  CAT40-held, coolant-driven high-speed angle head (ER32 coolant-sealed collet)
  provides off-axis machining: the **tilt off Z is set manually** at the head's
  joint and locked (mostly 90°, sometimes arbitrary), while the **clocking — which
  wall the tilted tool points at — is set by a commanded spindle orientation** that
  rotates and holds. Both are **positional/indexed only**; neither the head nor the
  spindle is usable as a continuous/interpolating cutting axis. Consequences:
  - Tool-axis support = **positional 3+2-style multi-orientation at arbitrary fixed
    angles**, programmed via workplanes. **No continuous simultaneous 5-axis**
    (lead/lean/swarf tool-axis control) is in scope.
  - The angle head is a **distinct tooling concept** the system must model: its
    geometry (tilt + gauge-line-to-cutter offset) for correct toolpaths and
    collision checks, and a **decoupled speed regime** (cutter RPM comes from
    coolant pressure, not the machine's commanded spindle RPM).
  - NC output for angle-head ops is **workplane-oriented 3-axis plus an emitted
    spindle-orient command** for the clocking; the machine is otherwise unaware of
    the head.
- **Materials:** aluminum (various alloys), mild/carbon steel, stainless (304,
  17-4 hardened, 316), chromoly, AR steel — a wide hardness/toughness range. This
  makes **material-aware strategy/feeds/speeds a core requirement** (subsystem B
  keyed by material; adaptive/trochoidal roughing for the hard/tough end).
- **Work type:** prototypes, single parts, **and** full production runs — both
  ad-hoc and repeatable/templated workflows are in scope.
- **Renishaw probing:** present; whether probing cycles are emitted in CAM output
  or handled at the control is deferred (a later clarification, not blocking).

## 4. Actors

- **Owner / operator** — a non-PowerMill-expert who states intent and approves at
  gates.
- **Agent(s)** — AI that drives the MCP and applies the judgment layer.
- **PowerMill** — the CAM engine, driven via its .NET API (primary) and
  macro/parameter layer (contained fallback).
- **Fusion 360** — the system of record for tooling and where the owner does most
  CAM today.

## 5. Governing standards (named, with what each governs)

- **ISO/IEC/IEEE 29148** — requirements quality (this document's discipline).
- **Expert Standard Development Methodology** (repo standing rule + project-
  lifecycle skill) — evidence-bearing phases, named-standard framing, verified
  premises.
- **OWASP (injection, input validation, integrity)** — governs the security
  requirements in §8, since the system executes commands against PowerMill,
  ingests external data (Fusion), writes machine-control output (NC), and
  persists memory.
- **SemVer** — versioning of the capability core, skills, and knowledge schema
  (governs R-GOV-2).
- **Separation of concerns / SOLID** (applied at Design) — anticipated by the
  modularity requirements in §7.7.

---

## 6. Requirements

Ranking: **Must** (the program fails without it) · **Should** (strongly wanted;
omission must be justified) · **Could** (desirable; defer freely). Each
requirement is a property of an acceptable solution, with its source and a
verification note.

### 6.1 Capability completeness — no cliffs

- **R-CAP-1 (Must).** For any machining job within the declared scope, an agent
  can complete the whole workflow — stock to verified NC — using typed tools,
  without hand-authoring raw macros for any *routine* step.
  *Source:* core need (non-expert usability; raw macros are unsafe/unreliable for
  an LLM). *Verify:* for each in-scope job class, trace the workflow; every step
  maps to a typed tool; routine-step macro authoring is zero.
- **R-CAP-2 (Must).** Typed capability covers the full breadth of the in-scope
  machining taxonomy (operations, feature types, setup configurations); coverage
  is enumerated and any gap is explicit and justified.
  *Source:* breadth-is-mandatory need. *Verify:* a coverage matrix against the
  taxonomy shows no unjustified gap.
- **R-CAP-3 (Must).** A request outside declared scope fails loudly with an
  explanation; the system never silently produces wrong output or silently falls
  back to raw macros to cover a gap.
  *Source:* correctness; safety. *Verify:* out-of-scope request returns an
  explicit "unsupported, because…" result.

### 6.2 Tools at the altitude of intent

- **R-INT-1 (Must).** Capabilities are expressed at the altitude of machining
  intent, so an agent accomplishes a recognizable machining action with a small
  number of calls — not by correctly orchestrating many low-level primitives.
  *Source:* non-expert usability; agent reliability. *Verify:* representative
  actions are achievable without the agent sequencing raw API primitives to be
  correct.
- **R-INT-2 (Should).** Inputs use machining vocabulary and explicit units a
  machinist recognizes; the system translates to PowerMill internals.
  *Source:* usability. *Verify:* tool inputs are expressible in shop terms.

### 6.3 Safety and correctness enforced

- **R-SAFE-1 (Must).** No toolpath can be presented as ready or posted without
  passing the verification appropriate to its setup (gouge, holder/shank
  collision, and machine collision where applicable).
  *Source:* correctness; physical-damage/injury risk. *Verify:* posting a
  toolpath that has not passed verification is refused.
- **R-SAFE-2 (Must).** The system never silently substitutes a default for a
  *safety-relevant* unspecified input; it either requires the value or applies an
  explicit, recorded, shop-approved default.
  *Source:* correctness. *Verify:* no safety-relevant parameter is defaulted
  without an auditable record of the default's source.
- **R-SAFE-3 (Should).** Verification results are structured (what failed, where),
  not merely pass/fail, so the agent can act on them.
  *Source:* agent self-correction. *Verify:* failed verification returns located,
  typed findings.

### 6.4 Observability — feedback for self-correction

- **R-OBS-1 (Must).** Every tool returns structured, machine-readable results and
  actionable errors (what went wrong, why, what to try) sufficient for an agent
  to self-correct without human help.
  *Source:* agent reliability. *Verify:* error outputs name cause and remedy in a
  parseable form.
- **R-OBS-2 (Must).** Project/toolpath/tool/stock state is queryable in typed,
  structured form (not raw strings), so an agent can inspect before and after
  acting.
  *Source:* agent reliability; the audit found inspection is currently thin.
  *Verify:* typed read tools exist for the entities agents act on.

### 6.5 Curated shop knowledge + Fusion 360 consistency

- **R-KNOW-1 (Must).** Tools, holders, and tool assemblies originate from the
  owner's Fusion 360 tool library and are represented so identifiers and geometry
  match across Fusion, the system, and PowerMill.
  *Source:* confirmed need (cross-software consistency). *Verify:* a tool defined
  in Fusion appears with matching geometry and a stable identity in the system.
- **R-KNOW-2 (Must).** Shop knowledge (tools, holders, materials, machines,
  feeds/speeds, conventions) is stored as **authoritative, curated, editable
  data — explicitly recorded, never inferred.**
  *Source:* correctness; memory-separation rule. *Verify:* the knowledge store
  contains no entry whose origin is "learned/inferred."
- **R-KNOW-3 (Must).** Units and coordinate conventions are explicit and
  consistent end-to-end (Fusion source → system → PowerMill output); no silent
  unit assumptions.
  *Source:* correctness (the audit found real unit ambiguity in PowerMill).
  *Verify:* every dimensional value carries/derives an explicit unit; a
  unit-mismatch is an error, not a guess.
- **R-KNOW-4 (Should).** Fusion → system sync is one-directional source-of-truth
  by default; conflicts are surfaced, not silently merged. *(Judgment call JC-1.)*
  *Source:* correctness; simplicity. *Verify:* a conflicting tool definition
  produces a surfaced conflict, not a silent overwrite.

### 6.6 Learning — verified-feedback-only

- **R-LEARN-1 (Must).** A learned heuristic influences future decisions **only
  after** the outcome it rests on is verified (simulation result, human sign-off,
  and/or real machining result). Unverified agent runs never become defaults.
  *Source:* correctness (avoid a confident-wrong amplifier). *Verify:* no
  heuristic enters the trusted set without an attached verified-outcome record.
- **R-LEARN-2 (Must).** Learned heuristics are distinct from curated knowledge,
  labeled as learned, and carry their evidence and confidence — inspectable,
  overridable, and reversible.
  *Source:* memory-separation rule. *Verify:* every learned item is
  distinguishable from curated data and can be rolled back.
- **R-LEARN-3 (Must).** *(Resolved by OQ-2; confirms ADR-0004.)* The system never
  auto-promotes. It **proposes** candidate defaults to the owner, each tagged with
  an evidence tier — (1) owner approved the result, (2) also simulation-verified,
  (3) backed by a real machining result (good part, no crash, acceptable tool
  life) — and a learned heuristic becomes a default **only on the owner's explicit
  approval.** The owner can review "what the system wants to learn" and accept or
  reject.
  *Source:* correctness; owner control. *Verify:* promotion to default requires
  recorded human approval; no default exists without it.
- **R-LEARN-4 (Must).** Learning is auditable: each learned item records origin,
  evidence, and time.
  *Source:* governance. *Verify:* audit trail exists per learned item.

### 6.7 Memory and continuity

- **R-MEM-1 (Must).** Continuity holds across sessions: an agent resuming work
  recovers prior decisions, curated knowledge, and learned heuristics without
  re-deriving them.
  *Source:* cross-cutting continuity concern. *Verify:* a fresh session can read
  prior state and act on it.
- **R-MEM-2 (Must).** The two memory kinds — curated knowledge vs. learned
  heuristics — are structurally separated so one cannot corrupt the other.
  *Source:* correctness; memory-separation rule. *Verify:* the stores are
  distinct with no path by which learned data is written as curated.

### 6.8 Judgment layer (skills) architecture

- **R-SKILL-1 (Must).** Machining judgment (strategy selection, parameters,
  ordering) lives in a skills/knowledge layer **separate** from the MCP
  capability layer: the MCP carries "can do safely," the skills carry "should do,
  this way."
  *Source:* separation of concerns; maintainability. *Verify:* capability and
  judgment are in distinct layers with a defined interface.
- **R-SKILL-2 (Must).** The skill system supports high information density and
  must scale to many focused skills (potentially one per toolpath strategy)
  without becoming unusable.
  *Source:* confirmed need (anticipated information density). *Verify:* the design
  admits 50+ skills without degrading agent usability.
- **R-SKILL-3 (Must).** Skills load progressively / on demand (a broad router
  skill plus deep specialized skills surfaced when relevant) so adding skill #51
  does not bloat always-on context.
  *Source:* efficiency; usability. *Verify:* only relevant skills are loaded for a
  given task; baseline context cost is bounded as skill count grows.
- **R-SKILL-4 (Should).** Skills follow a consistent template and index so adding
  one is mechanical, not bespoke.
  *Source:* maintainability ("beautifully simple"). *Verify:* a new skill can be
  added by following a template without redesign.
- **R-SKILL-5 (Should).** Skills reference capability (MCP) contracts rather than
  duplicating tool documentation, to prevent drift.
  *Source:* maintainability. *Verify:* skills cite, not copy, tool contracts.

### 6.9 Lifecycle / governance harness

- **R-GOV-1 (Must).** There is a defined, repeatable process for extending the
  system — adding a capability, a skill, or promoting a learned heuristic — that
  includes tests and review, so growth does not become patches-on-patches.
  *Source:* confirmed need; correctness-over-speed. *Verify:* an extension
  procedure exists and is followed for each addition.
- **R-GOV-2 (Must).** The system is versioned (SemVer), and changes are
  regression-tested against a set of known-good reference jobs before release.
  *Source:* maintainability; correctness. *Verify:* a release runs the regression
  set and records results.
- **R-GOV-3 (Should).** The governance harness is itself documented and
  tool-supported (skills/workflows) so the lifecycle is executable, not folklore.
  *Source:* maintainability. *Verify:* lifecycle steps are encoded as runnable
  skills/workflows.

### 6.10 Modularity / maintainability / extensibility

- **R-MOD-1 (Must).** The system is decomposed into modules with single
  responsibilities and well-defined interfaces (capability core, knowledge base,
  skills, learning, verification, governance), each independently understandable
  and testable.
  *Source:* maintainability; correctness-over-speed. *Verify:* each module has a
  stated responsibility and interface; each is testable in isolation.
- **R-MOD-2 (Should).** Capability definitions are data/parametric where that
  reduces duplication and error (e.g., strategy/parameter definitions driven by a
  schema), **provided** it serves correctness and does not over-abstract (YAGNI
  guardrail).
  *Source:* efficiency; with explicit anti-gold-plating guardrail. *Verify:*
  repetitive definitions are schema-driven; no speculative abstraction without a
  present need.
- **R-MOD-3 (Must).** Adding a new toolpath strategy or tool type does not require
  changing unrelated modules.
  *Source:* extensibility. *Verify:* a strategy/tool addition is local to its
  module(s).

### 6.11 Platform path

- **R-PLAT-1 (Must).** The primary capability path is the typed PowerMill .NET
  API; the macro/parameter layer is a **contained fallback**, never the primary
  mechanism for routine operations exposed to the agent.
  *Source:* safety (injection surface); reliability. *Verify:* routine tools use
  typed API; macro use is wrapped and bounded.
- **R-PLAT-2 (Should).** Where the .NET API lacks a capability the breadth
  requirement demands, the gap is documented and the fallback is wrapped in a
  typed, validated tool — not exposed to the agent as raw macro.
  *Source:* safety; reliability. *Verify:* every macro-backed capability presents
  a typed, validated tool surface.

### 6.12 Plan and approval checkpoints (resolves OQ-3)

- **R-PLAN-1 (Must).** Before building any toolpaths, the agent presents a
  **machining plan** and waits for owner approval. The plan must contain, as an
  output contract (not "looks done"): an approach summary in plain language; the
  setups and orientations (incl. angle-head tilt + spindle-orient clocking and
  which features each reaches); an ordered operation scaffold where **each**
  operation states what it does and where, the strategy and *why*, the tool from
  the library and *why*, the orientation it runs in, and the stock left for the
  next op; an explicit **areas-of-concern / risk** section (thin walls, reach, hard
  material, collision-prone zones, angle-head reach, uncertainties); and the
  assumptions plus anything needing an owner decision.
  *Source:* owner control; non-expert supervisability (OQ-3). *Verify:* the plan
  contains every listed element; building is blocked until the owner approves.
- **R-PLAN-2 (Must).** After programming and verification, the agent presents the
  **verified result** and holds the NC output as not-ready-to-run until the owner
  approves; the first physical cut is always the owner's call. Work *between* the
  two checkpoints (creating toolpaths, dialing parameters, running checks, retrying
  failures) is autonomous; the agent returns only when stuck or when a check will
  not pass.
  *Source:* owner control; physical-damage risk (OQ-3). *Verify:* no NC is marked
  ready without owner approval at this gate (ties to R-SAFE-1 / R-SEC-5).
- **R-PLAN-3 (Should).** Checkpoint strictness is adjustable per job (a hard 17-4
  part may warrant more gates than an aluminum bracket) and may be loosened over
  time as trust builds; the conservative two-gate model above is the default.
  *Source:* usability. *Verify:* checkpoint policy is configurable per job.

---

## 7. Threat model (precedes the security requirements)

**Assets:** the live PowerMill session and project files; the shop knowledge
store; the learning store; NC output (G-code that drives a physical machine); the
Fusion sync ingest; local file system access.

| ID | Threat | Impact |
|---|---|---|
| T1 | **Macro injection** — agent or upstream input injects PowerMill commands via string parameters | Arbitrary command execution in PowerMill |
| T2 | **Path traversal** — path-taking tools read/write outside allowed roots | Unauthorized file read/write |
| T3 | **Learning-store poisoning** — unverified/bad data becomes a trusted default | Scrap parts, tool/machine crash |
| T4 | **Fusion ingest integrity** — malformed/hostile tool library corrupts the knowledge base | Wrong tooling → bad/unsafe toolpaths |
| T5 | **NC output integrity** — wrong or unverified G-code reaches the machine | Physical damage, injury |
| T6 | **Memory/continuity tampering** — corrupted memory misleads later sessions | Silent, compounding wrong decisions |

## 8. Security requirements (derived from §7)

- **R-SEC-1 (Must) [T1].** All agent-provided strings interpolated into PowerMill
  commands are validated (allowlist/escaping); no tool passes unvalidated input
  into a macro. *Verify:* every command-bearing input has a validation step;
  injection attempts are rejected.
- **R-SEC-2 (Must) [T2].** All file path inputs/outputs are containment-checked
  against explicitly allowed roots. *Verify:* a path outside allowed roots is
  rejected.
- **R-SEC-3 (Must) [T3].** Data entering the learning store carries a
  verified-outcome record; the trusted-defaults set derives only from verified
  entries. *Verify:* an unverified entry cannot become a default.
- **R-SEC-4 (Must) [T4].** Fusion-sourced data is schema-validated on ingest
  before entering the knowledge base; invalid input is rejected with a report.
  *Verify:* malformed input is rejected, not partially ingested.
- **R-SEC-5 (Must) [T5].** No NC output is presented as ready-to-run without
  passing the verification gate; first run on a new machine/job requires explicit
  human confirmation. *Verify:* unverified output cannot be marked ready; first
  run prompts for sign-off.
- **R-SEC-6 (Should) [T6].** Memory stores have integrity protection and are
  auditable; corruption is detectable. *Verify:* tampering/corruption is
  detectable on read.

---

## 9. Judgment calls (surfaced, with reasoning)

- **JC-1.** Fusion → system sync is one-way (source of truth) by default rather
  than bidirectional. *Reason:* Fusion is where tooling is authored; one-way
  avoids merge-conflict complexity. Revisit if a real need for write-back appears.
- **JC-2.** The work is defined as a 6-subsystem program with per-subsystem specs,
  not one giant spec. *Reason:* a single spec for everything cannot be precise;
  matches the lifecycle (assembly drawing + part drawings).
- **JC-3.** Primary path is the .NET API; macros are a contained fallback.
  *Reason:* safety and agent reliability.
- **JC-4.** "Verified outcome" floor = simulation pass **plus** human sign-off;
  real-machining result is the gold tier when available. *Reason:* real cuts are
  not always available, but sim + human is a defensible minimum bar for learning.
- **JC-5.** Learning (D) and Fusion sync (B) are ranked core (Must), not later
  add-ons. *Reason:* they are central to "the system carries the expertise and
  stays consistent with how the owner already works."

## 10. Open questions — owner decisions needed (these BOUND the scope; they do not narrow it)

These bound our target so we cover *all* the owner's space. OQ-1/2/3 are answered
(2026-06-27) and recorded in the requirements above; OQ-4/5 remain open, scoped to
subsystem B and the posting end, and do not block program-level Design.

- **OQ-1 — ANSWERED.** Shop profile recorded in §3.1: 3/4-axis ~20 hp / 12k Kessler
  mill with Renishaw probing; positional-only multi-orientation via a manual-tilt +
  commanded-spindle-orient high-speed angle head (no continuous 5-axis); aluminum
  through hard/tough steels (17-4 H, AR, chromoly, 316); prototypes, one-offs, and
  production runs.
- **OQ-2 — ANSWERED.** Verified-outcome + promotion policy recorded in R-LEARN-3:
  the system proposes candidates with evidence tiers; nothing becomes a default
  without the owner's explicit approval.
- **OQ-3 — ANSWERED.** Autonomy/checkpoints recorded in §6.12 (R-PLAN-1/2/3):
  plan-approval before building (with a full plan output contract), then
  verified-output approval before run; autonomous in between.
- **OQ-4 (open).** Fusion 360 tooling — is the tool library exportable, and roughly
  how many tools/holders? *(Confirms R-KNOW-1 feasibility; needed for subsystem B,
  not for program Design.)*
- **OQ-5 (open).** Which machine controls / post-processors are actually posted to?
  *(Sets the posting/verification target; needed for the posting end.)*

## 11. Gaps and pending items

- The in-scope machining space is now bounded by §3.1 (OQ-1 answered).
- The "verified outcome" + promotion policy is fixed by R-LEARN-3 (OQ-2 answered).
- Machine-collision verification (R-SAFE-1) depends on whether a machine model
  exists for the owner's mill — still pending OQ-5 / subsystem E.
- Fusion tool-library shape (subsystem B) pending OQ-4.

## 12. Quality gate to Design (self-check)

- [x] Every requirement is a property, not a mechanism (abstraction test).
- [x] Every requirement traces to a named source (need/constraint/standard).
- [x] Every requirement is testable (verification note present).
- [x] Requirements are ranked (Must/Should/Could).
- [x] Threat model precedes security requirements.
- [x] Judgment calls and open gaps surfaced in this document.

**Gate status (2026-06-27): CLEARED for Design.** The blocking owner decisions
OQ-1, OQ-2, OQ-3 are answered (§10) and recorded in §3.1, R-LEARN-3, and §6.12.
OQ-4 and OQ-5 remain open but are scoped to subsystem B and the posting end, not
program-level Design.
