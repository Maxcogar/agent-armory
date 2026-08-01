# Collapse log

Cumulative, cross-session record of **hollow decisions** caught in this project
— a decision that was sourced and lifecycle-clean but collapsed the moment
someone asked what mission-need it served. Mandated by `CLAUDE.md` ("no hollow
decisions — and the owner never catches them").

**Read this before designing.** Add an entry whenever a collapse is found, by
anyone. The point is that recurring traps become visible across sessions
instead of rediscovered each time — and that the pattern of *how* this project
goes hollow is itself data.

**Class legend:**
- **reduction** — collapsed a deliberately broad requirement into one narrow function.
- **wrong-check** — checked an easy property instead of the one that matters.
- **posture** — adopted a stance the tool forbids (gate / safety-net / policing instead of guide).
- **unverified** — asserted a capability or behavior without checking it against source.
- **mechanism-not-mission** — justified by how it works, not by the mission-need it serves.

---

## 2026-07-17 — architecture session

Every collapse below was found by the **owner**, not by any safeguard — the
citation gates, the Expert Standard pass, and an independent 16-finding review
all missed them. That is the exact failure `CLAUDE.md`'s collapse test now
exists to prevent: the adversarial collapse-hunt must catch the next one before
it reaches him.

1. **Judgment send-gate = "verify the claim exists in the store."**
   Collapsed by: *"why is existence the right check? a true-but-irrelevant fact
   is worse than silence."*
   Class: **wrong-check**. Existence verifies the oracle's own honesty (it
   didn't hallucinate), not whether the whisper serves the agent's decision.
   Fix: the send-gate is materiality + non-obviousness + evidence floor +
   confidence×impact + honest uncertainty (FR-A1/A5/D5, P4/P5); existence is the
   anti-fabrication floor *beneath* the gate, never the gate itself.
   → `docs/judgment-layer-corrected-foundation.md`.

2. **Model "selects from a generated candidate list; does not author text."**
   Collapsed by: *"if none of the candidates are relevant, the tool just doesn't
   work — then what? and it's harder to get data on a tool that never works."*
   Class: **reduction**. Select-only cannot answer a question or articulate a
   specific contradiction, and caps the tool at what a deterministic query can
   pre-compute — starving the learning loop of the data it needs.
   Fix: grounded generation — the model composes; every factual claim is verified
   against store provenance before delivery; output validated to informative,
   non-imperative form (FR-J5/X2).

3. **Judgment as "detect divergence between the agent's trajectory and what the
   code requires, and prevent the bad outcome."**
   Collapsed by: *"that's a safety net for something already derailing; the tool
   is a guide, and you can't predict far enough ahead to correct anyway."*
   Class: **posture**. Reintroduced the gatekeeper stance the whole rethink
   removed — this time at the reasoning layer instead of the tool layer.
   Fix: the judgment is FR-A1 — "do I know something material it doesn't" — which
   informs the decision without predicting or policing it.

4. **Overcorrection: "the tool is a guide, so it never corrects."**
   Collapsed by: *"correcting is literally part of the tool; why do you keep
   making it 100% one thing?"*
   Class: **reduction**. The twelve genres (FR-A2) include correcting genres
   (assumption-check, steering).
   Fix: guiding and correcting are one judgment (FR-A1) in different shapes — the
   material fact either adds to, or conflicts with, the agent's current picture.

5. **Tool-disallowed model call asserted but never verified** (independent
   review finding F1).
   Collapsed by: *"the invocation carries no tool-restriction flag — where is
   it?"*
   Class: **unverified**. The recursion-guard/security claim rested on a flag
   never confirmed to exist.
   Fix: verify the actual flag against `claude --help` and add it, or redesign so
   tools are structurally absent.

**Pattern this session:** the recurring shape is *reduction* — repeatedly
collapsing a deliberately broad, owner-approved requirement (the twelve genres;
the mission) into a single narrow function that is easier to design, then
defending the collapse. The owner's repeated correction was always the same:
stop narrowing what the spec made wide. Future agents: when a design feels clean
and unified, check whether you achieved that cleanliness by quietly dropping
part of what the tool is meant to do.

---

## 2026-07-22 — architecture rebuild collapse-hunt (independent subagent + expert-review)

The rebuilt architecture was attacked by an **independent adversarial
collapse-hunt** (mission-fidelity only) and a parallel **expert-review**
(premise + standards). Both were dispatched before any finding was applied, per
`CLAUDE.md`. This is the mechanism working as designed: the collapses below were
found by the peer passes, **not** by the owner. All were applied to
`architecture-context-oracle.md`. New collapse-questions the author had not
written are recorded so the traps are inherited.

1. **`decision-impact` — the bar's own heart — was left undefined, and the
   learning loop can only ratchet toward silence.**
   Collapsed by: *"your D10 'Survives' box says the bar is confidence × decision-
   impact and the loop tunes it from data — but impact is never defined (the
   Move-B schema has `confidence`, no `impact`), and the only down-signal
   (regret) is unmeasurable for a non-programmer owner. So the tool can converge
   to near-total silence and measure as healthy."*
   Class: **mechanism-not-mission** (impact) + **wrong-check** (regret metric
   asserted, no source). This is collapse-log item 2 (2026-07-17) resurfacing.
   Fix: operationally defined `decision-impact` = model-emitted `materiality`
   (new Move-B field, so the intent read enters the bar) × structural weight
   (genre × edit-vs-read × blast-radius × zone); added an **explore budget** (a
   sampled fraction of below-bar candidates delivered and measured) and a
   concrete **regret proxy** the distiller can compute (same-region re-edit/revert
   across sessions; post-edit verify-command failure) as real up-signals → D10,
   D12, D21.

2. **The Answer genre re-collapsed to "nicely-phrased FTS": deterministic
   retrieval is the unacknowledged author.**
   Collapsed by: *"the model may only assert facts that bind to a pre-built,
   un-expandable retrieval set; for the Answer/discovery genre that is the exact
   cap that made select-only unusable — the model can't answer if FTS didn't
   surface the file."* (Assumption-check/Steering survive — articulation is real
   composition; Answer/discovery does not.)
   Class: **reduction** (Answer breadth narrowed to FTS-phrasing) +
   **decision-hiding** (retrieval, the real author, was unspecified).
   Fix: Move-A retrieval promoted to a first-class component with a bounded,
   tool-free **retrieval-shaping sub-turn** (the model proposes query terms that
   only parameterize a deterministic store query, never free text); and the
   honest cap is now stated — Answer quality is bounded by retrieval reach → D10,
   D12.

3. **Conduct genres — the collapse-hunt's "policing posture" framing was itself an
   OVERCORRECTION, and Max Cogar overturned it.** The hunt argued a Process/
   answer-drift whisper "reports things already in the agent's context — a
   supervisor's nag, the posture the rethink removed." The author (this session)
   accepted that framing, scoped the genres down, and asked the owner whether to
   ship them *off by default*. **Max Cogar corrected this on 2026-07-22:** "why
   would you disable part of this? what's wrong with supervising? … I want this
   feature specifically."
   **Why the framing was wrong (the durable lesson):** (a) the rethink removed
   **gates** — *blocking*, deny paths, plan firewalls (RETHINK §2.2, §9) — **not
   observation**; a conduct whisper blocks nothing (P2) and advisory conduct
   observation is the *sanctioned replacement* for a gate, not the gate. (b) These
   genres are **owner-added and explicitly in scope (OWNER-9)** — flagging an
   owner-approved feature as a "mission tension" to hand back is the exact reflexive
   overcorrection Max Cogar has repeatedly rejected. (c) The FR-A1 argument was also
   wrong: "in the token window" ≠ "known." An agent that claims completion without
   verifying, or drops the user's question, has *not registered* the conflict — the
   erroneous action **is** the evidence — so an external cross-check surfacing that
   specific conflict at the decision moment *is* a material fact it doesn't know
   (the same logic by which FR-M has the oracle watch its own conduct). Defaulting
   it off would gut an owner-approved capability that surfaces mistakes neither
   he nor the agent catches. *(Phrase corrected 2026-08-01: this read "the
   owner's core problem." The tool has no core problem — see the 2026-08-01
   entry below.)*
   **The one genuinely valid residual (kept):** don't *nag* — speak the specific
   conflict with its pointer, not a step-by-step checklist recital; that is
   noise-calibration governed by the §9.2 false-fire ladder, and per spec §14 the
   owner reviews measured false-fire rates *after* instrumented sessions. That is
   the only checkpoint, and it is post-measurement, not a design-time on/off doubt.
   Class of the author's error: **overcorrection/reduction** (narrowing an
   owner-approved capability and inverting to "maybe off" under a pushback reflex).
   Fix applied: D14 reframed — conduct genres are advisory, mission-aligned, **enabled
   by default**; STATUS's misframed yes/no removed. → D14, FR-A8/A9.
   **Meta-lesson for future agents:** an independent collapse-hunt can *itself*
   collapse a decision in the wrong direction. A "posture" collapse must distinguish
   *blocking* (removed) from *observing/informing* (the mission), and must never
   convert an owner-approved feature into an owner-facing "should we keep it?"
   question — that makes the owner the substance-reviewer again, the exact failure
   this mechanism exists to prevent.

4. **The FR-X6 audit log was put in the droppable "bookkeeping" class.**
   Collapsed by: *"D24 drops event-path writes on contention 'fail-open applies
   to bookkeeping' — but that set includes `whisper_log`, the one oversight
   control the security model cannot lose; a dropped audit write is an
   un-auditable whisper, invisible to the owner."* (Both passes found this.)
   Class: **wrong-check** (fail-open is right for latency, wrong for the audit
   control). Fix: `whisper_log` + `suppressions` made non-droppable — *if a
   whisper cannot be logged, it is not sent* (auditability true by construction)
   → D24.

5. **T1 overclaimed "bounded by construction"; grounding does not inspect fact
   text.** Collapsed by: *"an injection living inside a legitimately-grounded,
   non-suspect fact (a landmine `evidence` string, a `zone_evidence` marker)
   passes the grounding check (the fact resolves) and is quotable — grounding
   verifies existence, not that the text is instruction-free; the real control is
   the heuristic deny-lexicon, same evasion surface as the input flagger. And P3
   means an oracle-unaware agent gets delimited injections it was never taught to
   distrust."* Class: **unverified/overclaim**. Fix: T1 conclusion corrected to
   defense-in-depth (heuristic input+output), not elimination; **default
   pointer-only for all repo-derived spans**, inline quotation only for
   mechanically-generated content → T1, D13.

6. **The `Unknown` genre (FR-A2) was neither mechanized nor deferred — and the
   grounding-id rule structurally precluded it** (an Unknown whisper asserts the
   *absence* of a determining fact; there is no presence-fact to bind to). Class:
   **reduction** (mandated breadth silently dropped). Fix: mechanized via a
   **negative-evidence fact** — a bounded determining-query that returns empty
   becomes a bindable fact whose pointer is the query + its empty result (P4
   satisfied: re-run the query) → D12, D6.

**Also caught by expert-review (premise/standards axis, applied):**
- **CRITICAL — `Stop`/`SubagentStop` delivery is a continuation control** (F1;
  **omitted from the first version of this entry — added 2026-07-30 per round-3
  R3-11**). Collapsed by the current hooks contract, verbatim: *"It keeps the
  conversation going through the same loop protections as `decision: \"block\"`,
  namely the `stop_hook_active` input and the 8-consecutive-continuation cap."*
  So a whisper at `Stop` does not cost a wasted sentence (P2) — it costs the
  agent a turn it was trying to end, and AC-3 could not see it because AC-3
  scanned for deny *fields* and continuation carries none.
  Class: **unverified/overclaim** — a channel the design classified as inert is
  a control-flow axis.
  Resolution: put to the owner with the evidence; **Max Cogar ruled the
  capability a must-have** and accepted the cost bounded — `RETHINK.md` §12
  addendum decision **OWNER-12**, spec §6.1, FR-O4a, AC-3 widened.
  **Residual, and the reason this omission mattered:** the ruling landed in the
  spec and `RETHINK.md` and **not in the architecture** — round 3 found the
  artifact still specifying a design that could not implement it (no
  `stop_hook_active` in the event contract, so the bound was unimplementable
  rather than merely unstated). Fixed in D8/D10/D6/D21/D26 on 2026-07-30.
  **Standing lesson: when a finding produces an owner ruling, the ruling lands
  in every artifact the lifecycle consumes — not only in the one where the
  question was raised.** A requirement that arrives between rounds inherits no
  reviewer.
- **CRITICAL — `--bare` breaks the piggyback.** The D11 model command used
  `--bare`, whose help states "OAuth and keychain are never read"; verified live
  in this credential-less host-managed environment (3/3 Authentication error),
  while the same command **without** `--bare` succeeds. The Spike-1 re-run had
  omitted `--bare`, so it never exercised the design's real command — the exact
  "asserted, not established" failure the rebuild existed to end. Fix: `--bare`
  removed; recursion guard re-derived on cwd-isolation + `CTXORACLE_INTERNAL`
  env-guard + fresh session-id + env-scrub; AC-11 must assert zero oracle-hook
  firings for the **non-`--bare`** child. This is logged here because it is the
  same *class* as a collapse (a load-bearing premise self-certified but never
  actually run) even though the collapse-hunt is a mission-fidelity axis.
- False Phase-8/Gate-C attestation of a "collapse test on D24" that did not
  exist; `--json-schema` takes inline JSON not a file path; `so_what` not named
  in Move-C validation. All corrected.

**Pattern this session:** the 2026-07-17 collapses were *reduction at the
model's role*; the rebuild fixed that but moved the hard part into **unspecified
deterministic components** (Move-A retrieval; the `decision-impact` score) that
the document referenced but never designed — reduction relocated from "the model
only selects" to "an undefined deterministic step decides what the model may see
or send." And the one premise treated as *settled* (piggyback works) was the one
that failed, while the flagged-uncertain ones were handled well — the lesson
being that a re-run spike must exercise the **actual** design command, flags and
all. Future agents: when cleanliness feels earned, check whether it was bought by
pushing the hard part into a step labeled "deterministic" and left unbuilt, and
never trust a premise whose validating command differs from the design's.

---

## 2026-07-30 — round-2 review of the rebuilt architecture (independent collapse-hunt + expert-review)

Both mandatory passes were dispatched blind to each other, neither told what the
author suspected. **The architecture did not survive.** The collapse-hunt found
five collapses and four partial; the expert-review returned NEEDS FIXES with ten
findings, two Critical. All were applied. Two were caught by **Max Cogar**, not
by any safeguard, and are logged as process failures below.

**Class legend addition:** **decision-hiding** — the real deciding step is named
but never designed, so no one can review it.

1. **The send bar had no term for "could the agent have got this itself?"**
   Collapsed by: *"`decision-impact` is materiality × structural_weight — every
   term measures how much a fact MATTERS. Point at the term that measures how
   cheaply the agent could have got it. RETHINK §2.3 says marginal value over the
   agent's own abilities is the only relevance metric that matters."*
   Class: **reduction**. `non-obvious` — criterion 2 of the corrected foundation's
   five — appeared twice in the document, both times in prose, computed nowhere;
   the traceability matrix answered P5 with a design intent plus a term meaning
   something else. Fix: `self_serve_cost` as a third factor, the consumer's
   read/search set supplied to Move A, `non_obviousness` in the Move-B schema,
   combined by minimum; AC-16a fixtures it. → D10.5a, D12.

2. **The two owner-added conduct genres were structurally undeliverable.**
   Collapsed by: *"AC-19 needs a whisper naming a skill step and the absent tool
   call. Name the store fact it binds to. Skill text lives in the transcript;
   Tier 3 is in-memory; D6 has no table. And 'no matching tool call observed' is
   an absence claim — the exact shape that precluded Unknown last round."*
   Class: **decision-hiding + reduction**. Fix: session-evidence fact class with
   a transcript-offset resolver, `skill_expectations` in D6, and the Process
   detector specified to its mechanically decidable subset. → D14, D6, D12, D13.

3. **Lane 2 spends the same subscription the agent is spending, unbounded.**
   Collapsed by: *"the piggyback reuses the host credential, therefore the host's
   rate limits. Where is the number bounding calls per session? If the oracle
   exhausts the quota, it has not wasted a sentence — it has stopped the work,
   through the one channel NF-1 structurally cannot see."*
   Class: **mechanism-not-mission**. Fix: intent queue designed (coalescing, not
   dropping), per-session call budget, announced degradation, and `StopFailure`
   (`error: rate_limit`) as the detector for the case the budget cannot prevent.
   → D10.8a/8b.

4. **Which agent gets helped was decided by arrival order.** In a six-way
   fan-out, consumers 5+ received zero budget. Class: **reduction**. Fix:
   reservation with reclamation, ceiling scaling with active consumers,
   cross-consumer warn preemption, FR-M2 finding on budget-denial. → D15.

5. **The injection defence didn't cover paraphrase, which is what composition
   IS.** Collapsed by: *"pointer-only is a rule about quotation; Move B exists to
   reword. An instruction inside a flagger-missed fact's `claim_text` binds to
   the very fact whose text carried it."* The document's own collapse answer was
   backwards. Class: **unverified/overclaim**. Fix: trust-conditioned composition
   — `untrusted_repo` facts supply no `claim_text`. → D12, D13, T1.

6. **Move C checked reference, not entailment** — and the document concluded from
   the reference check that the model "never invents what counts as true."
   **Reproduced live**: given one fact stating two files co-changed 16/20 times,
   the model returned claims that the coupling is *"stable"*, *"a standard
   pattern, not accidental"*, and that a change *"would improve modularity"* —
   all bound to that fact, all passing. Class: **wrong-check**, and the second
   recurrence of item 1 of 2026-07-17: existence was moved beneath the *send*
   gate and reappeared as the *claim* gate. → D12 Move C.

**Also caught by expert-review (premise/standards axis, applied):**
- **SERIOUS — the shipped model command was unreliable** *(graded CRITICAL in
  the first version of this entry; round 2 classified it SERIOUS — corrected
  2026-07-30 per R3-11, and its substance corrected too: see below).* **The lesson: a premise
  certified from a command that differs from the shipped one will be wrong, and
  will be wrong repeatedly.** This single premise was stated three ways across
  three rounds — "fails always", then "depends on the system prompt", then
  "depends on the tool flag" — and each version was measured, plausible, and
  superseded. Only the last survives. *Measurements live in the architecture's
  Spike 1, not here; this entry deliberately holds no numbers, because the two
  earlier versions of it went stale in place while the architecture was
  corrected.*
  Same class as round 1's `--bare` bug, from the same cause: the validating
  command was not the shipped command — the lesson round 1 wrote into *this file*
  and the spike section did not apply.
- **CRITICAL — `--disallowedTools` left eight tools available**, so T4's "empty
  by flag" was false and the rationale ("denies new tool names by default") was
  inverted. `--tools ""` returns `NONE` and costs one fewer turn.
- Repo identity: six root commits on this repository, two contradictory selection
  rules, and shallow clones silently key a different store.
- `SessionEnd`'s 1.5 s budget breaks the global shim deadline.
- Round 1's `so_what` fix created a whole-whisper drop path that fires 4/4 on
  real output — a regression introduced by a fix.

**Process failures — the owner was the one who caught these (log per `CLAUDE.md`):**
- **A dispatch brief asserted a required tool was unavailable**, sending the
  reviewer straight to a fallback. Self-fulfilling: an agent told a tool is absent
  never attempts it and cannot discover the claim is false. The claim was also
  unverified — inferred from the dispatcher's own tool list, about a subagent's
  roster. Durable rule: *a brief states the requirement, never the availability.*
  (`skill-observations/log.md` observation 13.)
- **Grep was used as verification.** Two greps in one turn produced a false
  negative (a verbatim RETHINK quote missed because the sentence wraps a line)
  and a false positive (`quota` matching inside `quotation` — the evidence the
  collapse-hunt used to claim "quota appears nowhere"). Durable rule: **search
  locates, reading verifies**; absence is established by reading the region.
  This is a defect in `expert-review`'s own SKILL.md, which mandates grep
  evidence for absence claims in Gate B. (Observation 14.)

**Pattern this round.** 2026-07-17 was *reduction at the model's role*; 2026-07-22
was *the hard part relocated into an unspecified deterministic step*; this round
the shape moved once more: **the hard part is a named noun with no producer, and
every place it is claimed to be handled points at a different place that also
does not handle it.** `non-obvious` is a criterion, a word in prose, and a matrix
row that resolves to a design intent — and a computation nowhere. `uptake` is a
schema column driving automatic genre retirement with no detection rules. The
`intent queue` is two mentions in a list, and it decides what the model may see.
The cross-consumer budget is a default with no allocator. The tell is cheap:
**a citation that lands on a design intent, a schema column, or a component name
rather than on a per-candidate computation with named inputs is an unfilled
requirement wearing a reference.** For every principle and every column ask *who
writes this, in which decision, from what inputs.*

**Two structural lessons for the next round.**
1. **Everything the previous round touched got a real mechanism; everything it
   did not touch stayed prose.** Every collapse above sits in a criterion that
   was never contested. A hunt that starts from the previous hunt's findings will
   find nothing. Start from the *anchor documents' own enumerated criteria* — the
   corrected foundation's five conditions, RETHINK §2.3, the twelve genres.
2. **Every collapse this round lived BETWEEN decisions**, and the collapse test
   is written per decision, so it structurally cannot see them: conduct genres
   designed in D14 and gated in D12/D13; budget set in D10 and divided in D15;
   injection claimed in T1 and implemented in D12/D13 with contradictory rules.
   **Countermeasure, now required:** in addition to the per-decision test, write
   **one collapse test per genre that traverses the whole pipeline** — trigger →
   retrieval → grounding → bar → budget → assembly → delivery → audit → learning
   — and require each of the twelve FR-A2 genres to survive end to end.

---

## 2026-07-31 — the owner collapsed the document structure; logged as a process failure

**Caught by Max Cogar, not by any safeguard**, across four rounds of adversarial
review that had all the evidence and never asked the question. Logged per
`CLAUDE.md` ("the owner is never the collapse-tester … log it").

**The collapse question, his:** *"3 phases in one spec. WHY?"*

**What it collapsed.** Spec §12 stages the build into three phases whose exits are
**measurements, not tests**: Phase 0 exits on *"the owner runs it on a real project
without incident"*; Phase 1 on *"measured silence and hit rates reviewed against the
bar"*; Phase 2 on *"a demonstrated case of the oracle measurably improving between
sessions."* Each phase's design is therefore gated on data only the previous phase
can produce.

But the spec specifies all three phases' requirements now, and `CLAUDE.md`'s
lifecycle then requires **one** architecture document resolving Phase 1 design
questions (it names judgment-prompt construction and the recursion-guard mechanism)
before *any* implementation. So the governance mandates specifying and architecting
Phase 1 and Phase 2 **twice**: once now against nothing, and once later against
measurements. Only the second can be real.

**Class: mechanism-not-mission**, at the governance layer rather than in a decision.

**The evidence that was present the whole time and never interrogated.** Across
rounds 1–4 the Phase 0 material (stores, event contract, shim, indexer, miner,
security scanner, repo identity, audit ordering) survived every pass and several
decisions re-derived *exactly* under re-execution. The Phase 1/2 material (judgment
core, conduct genres, the materiality half of the bar, uptake ladder, learning loop)
collapsed in **every** round — 2026-07-17 items 1–4, round 2's C1/C2, round 3's
C1/C2/C6–C9, round 4's R4-1 through R4-4 and C1–C16. The split is almost perfectly
clean along the phase boundary. Four review rounds reported the pattern; none asked
why the pattern existed.

**Why the reviews could not catch it.** Both passes review *the architecture against
the spec*. This defect is in the relationship between the spec's own §12 and the
lifecycle that consumes it — above the artifact under review, so in-scope for
neither pass. A reviewer told to check an architecture will not ask whether the
architecture should exist yet.

**Standing lesson.** When one half of an artifact fails every round and the other
half survives every round, the split is the finding. Ask what separates them before
applying a fifth batch of fixes to the failing half. A defect that reproduces along
a boundary already named in the spec is a structural defect, not a quality one.

## 2026-08-01 — "the core problem the tool exists to solve" — a superlative that became authority

**Caught by Max Cogar**, again, and logged per `CLAUDE.md` ("the owner is never
the collapse-tester … log it"). This one had been sitting in the highest-authority
document in the project since 2026-07-30 and was read by every session since,
including the one that logged the 2026-07-31 structural collapse.

**What collapsed.** `RETHINK.md` §12 decision 12 recorded the owner's ruling on
speaking at a completion claim. His actual words were: *"having the oracle speak
when an agent claims it's done is a must-have feature in my mind."* Wrapped
around that quote, an agent wrote: *"the completion claim is the single
highest-value moment the oracle has … and it is the core problem the tool exists
to solve."* Neither clause is his. Both are rankings.

**His correction, verbatim in substance:** *that is not the "core problem". there
is no core problem.* He has stated this repeatedly; agents keep making the tool
revolve around one single thing, and doing so guarantees what gets built is not
the tool he asked for. **This is the second full remake of this tool caused by
that pattern.**

**Class: reduction** — the project's dominant class, in its most durable form yet.
Every prior reduction narrowed a decision. This one narrowed the *mission
statement*, in the document that outranks the spec, where it then reads as
owner-authorized ground truth.

**How it propagated, and why that is the real finding.** A superlative written
into RETHINK becomes citable authority. It had already reached:
- `docs/specs/spec-context-oracle.md` [OWNER-12] — "the highest-value moment the
  oracle has";
- `docs/collapse-log.md` (2026-07-30 entry) — "the owner's core problem";
- round-4's collapse-hunt, which *quoted it back as the standard* it was reviewing
  against;
- and this session: the agent evaluating the Phase 0 genre scope cited it as the
  decisive argument for keeping the Completeness genre in Phase 0. The scope of
  the first buildable phase was about to be set by a sentence the owner never said.

That is the mechanism to inherit: a reduction inside a *rationale* is more durable
than one inside a decision, because reviewers check decisions against sources and
treat rationale as prose. Four review rounds read this line and none flagged it.

**Standing lesson — no unattributed superlatives.** A ranking claim about this
tool's purposes, genres, triggers or moments — "the core problem", "the single
highest-value X", "the whole point", "the reason it exists" — does not enter any
document unless the owner stated it in those words, quoted and attributed. The
mission is `RETHINK.md` §1 plus the mission sentence, and the twelve FR-A2 genres
are co-equal expressions of it. When recording an owner ruling, record the ruling
and the quote; do not supply a rationale that ranks it above what it was not
compared to.

**Fix applied 2026-08-01.** Ranking language removed from `RETHINK.md` §12
decision 12 and from spec [OWNER-12], each with an in-place correction note; the
2026-07-30 entry above corrected in place; the Phase 0 scoping recommendation
re-derived without it (see `docs/STATUS.md`).

## 2026-08-01 — the Phase 0 genre cut: filtering a bar's job through the build plan

**Caught by the independent collapse-hunt, not by the owner** — the mechanism
working as designed, one turn after the entry above records it failing. Fourteen
findings; the proposal did not survive.

**What collapsed.** A proposal to cut Phase 0's genre set from five (spec §12's
reference to FR-J3) to three — coupling, generated-file warning, completeness —
deferring orientation and verification to "a later phase."

**The question that killed it (F9):** *"R4-4 says Phase 0's bar has no
`self_serve_cost` term. Your orientation deferral argues its structural arm is
'trivially self-serveable' — a `self_serve_cost` argument. So either R4-4 is
fixed, and the bar filters that arm per candidate at runtime, making the deferral
unnecessary; or R4-4 is not fixed, and Phase 0 has no term that can express your
argument at all. Both branches remove the deferral."*

**Class: reduction**, with **wrong-check** underneath.

**The generalisable lesson — a bar suppresses, a build plan deletes.**
`decision-impact = materiality × structural_weight × self_serve_cost`
(architecture D10, verified at `docs/architecture-context-oracle.md:1098`), and
`self_serve_cost` is *"deterministic and derived from the fact's own provenance
class"* — it needs no model, so it is fully available in Phase 0. Every cut in
the proposal was a materiality judgment: this content is too easy for the agent
to get itself. That is exactly what the bar computes, **per candidate, at
runtime, tunably**. Making it at build-plan level instead makes it permanent,
per-genre, and — worst — unmeasurable, because a genre that never ships produces
no data with which to revisit the call. R4-C2 already collapsed the per-genre
reading of `self_serve_class`; this proposal committed the same error one layer
up, where the consequence does not expire.

**Standing lesson.** *When the argument for excluding something is that it isn't
worth saying, that is a bar argument, not a scope argument.* Route it to the
mechanism that decides worth per instance and can be re-tuned from measurement.
Cutting at build-plan level converts a tunable runtime judgment into an
irreversible one and destroys the evidence needed to revisit it. **The tool
getting quieter is not the tool getting smaller.**

**Three further errors worth inheriting:**

1. **A false premise that had already been caught once (F7).** The proposal
   deferred orientation on the grounds that D18's landmine writer is
   unspecified. D18 names it: *"v1's only writers are `human_facts` promotion
   … and the literal-match landmine path for orientation"*
   (`architecture-context-oracle.md:2169`), and Lane 1 carries *"prompt →
   structural entry points + literal landmine matches (orientation)"* (`:1037`).
   `STATUS.md` records this exact error being made, caught, and corrected on
   2026-07-31 — and the author had read that correction earlier in the same
   session before restating the error. **Reading a correction is not inheriting
   it.** Re-derive from the source the correction points at, not from the
   memory of having read the correction.
2. **A deferral with no destination is a descope (F1).** Spec §12's Phase 1 and
   Phase 2 lists contain neither orientation nor verification, so "defer to a
   later phase" named a phase that does not exist. D10a's standard for an honest
   gap is a live genre with deferred *content* and a named filling condition
   (`:1363`). Sequencing is the agent's call; scope is the owner's — a deferral
   without a destination silently converts one into the other.
3. **Acceptance-criterion coverage was used to define scope (F2).** Only AC-1
   and AC-5 name a genre among Phase 0's nine exits — true, and verified. But
   criteria verify requirements; requirements define scope. Thin AC coverage is
   a finding against the AC set. The proposal also applied the rule
   asymmetrically, keeping completeness, which fails the same test.

**What survived the hunt, and is now better evidenced.** Phase 0 is **not**
degraded mode. Degraded mode is a runtime fallback for an unreachable model path
(FR-J3, D20); Phase 0 is a build stage where the model layer does not exist yet.
Spec §12 fuses them (*"Degraded mode is the product at this phase"*) while
placing AC-10, the criterion that verifies degraded mode, in Phase 2. The
architecture's own build order corroborates the split: all Lane 1 genres complete
at step 7 and the Phase 0 exit falls at step 8, while D20's degraded state
machine is step 9 — *after* the exit (`:2704`–`:2709`). The consequence to settle
is F8's: de-equating them leaves FR-J3's air-gap guarantee (RETHINK §12 decision
2) with no phase assigned.

## 2026-08-01 — crediting the owner with an answer the documents already contained

**Caught by Max Cogar.** Small, and worth logging because of what it does to the
record rather than what it did to the design.

**What happened.** Asked what the purpose of Phase 0 is, the agent could not
state one, drafted a new sentence, and then — when the owner pointed at the
measurement framing — wrote it into spec §12 and a commit message as *"his
framing, adopted."* It was not his. Spec §12's own "How to read this section"
paragraph, added 2026-07-31, states *"each phase is gated on evidence only the
previous phase can produce by actually running,"* and `docs/STATUS.md` of the
same date states *"everything still undecided is waiting on measurements only a
running Phase 0 can produce."* The agent had quoted the STATUS line back to the
owner earlier in the same session. His actual question was why the written
purpose was not being followed.

**Class: unverified** — a claim about what the documents contain, stated without
reading them. The second-order effect is the reason for this entry.

**Why it matters more than a misattribution.** Two records were falsified in
opposite directions. The spec gained a note saying the purpose statement was
*missing*, one paragraph below the paragraph that contained it. And an agent's
failure to read the documents it was working from was filed as an **owner
contribution** — which converts a process failure into a feature request in the
project's memory. A later session reading that would conclude the owner supplies
the framing when the agent gets stuck, which is exactly the dependency this
project's rules exist to remove (`CLAUDE.md`: the owner is never the
collapse-tester; do not hand him a decision already written).

**Standing lesson.** *Before recording that something was missing, read the file
you are about to say it was missing from.* And when the owner points at
something, establish whether he is **supplying** it or **citing** it — those
produce opposite entries in the record. The default assumption should be citing:
he has read these documents, and the agent-led rule means the answer is far more
often already written than newly supplied.

**What was genuinely absent**, and remains the real contribution of the change:
the **membership test** — a rule that decides what belongs in Phase 0 by what the
phase must yield. The purpose was stated; nothing had ever been derived from it.

## 2026-08-01 — the Phase 0 purpose block: a purpose the phase cannot serve

**Caught by the independent collapse-hunt** (`docs/reviews/2026-08-01-collapse-hunt-phase0-purpose.md`,
17 findings). Second killed proposal from the same session; the block was removed
from spec §12 the day it was written.

**What collapsed.** A block at the head of §12 declaring that Phase 0 exists to
*"produce the answers Phases 1 and 2 cannot be designed without"*, with a
membership test derived from it.

**The finding that matters most, and it is not about the block.** *No Phase 0
component computes either metric Phase 1's exit names.* §9.2's metrics are
*"Measured from the FR-X6 log by the distiller"*; uptake detection is the
distiller's; the distiller is **Phase 2**. Phase 1's exit — *"measured silence and
hit rates reviewed against the bar"* — therefore depends on a Phase 2 component.
That contradiction predates the block and survives its removal. It means the
question "which measurements must Phase 0 produce" currently has no answer, and
every membership rule derived from it rests on nothing.

**Class of the block itself: reduction**, on four independent counts.

**Standing lessons:**

1. **A purpose sentence is a claim about what a thing can do, and it needs the
   same verification as any other claim.** The block asserted Phase 0's purpose
   without ever checking whether Phase 0 can serve it. An unfilled requirement can
   wear a *purpose*, not just a reference — and a purpose in the spec is the most
   load-bearing sentence in the document.
2. **"X is necessary for Y" is not "X exists for Y."** The block cited two prior
   statements of a phase *dependency* as prior statements of a *purpose*. The note
   written to correct a misattribution committed a fresh false-provenance claim of
   the same class, one turn later.
3. **A criterion that cannot exclude is not a test; a criterion that can exclude at
   build-plan level is the previous collapse wearing new clothes.** Both readings
   were available here — the test admitted all twelve genres under one and cut a
   co-equal genre under the other. State inclusion criteria only; exclusion routes
   to the bar (per candidate, tunable) or to the owner (scope).
4. **The spec does not cite numbered architecture decisions as authority.** The
   block grounded a spec obligation in architecture D10 — the only such citation in
   the spec, pointing at a demoted document, in the half that collapsed in every
   review round. That inverts the lifecycle the project runs on.

**Rate of recurrence worth noting.** Three proposals were written this session and
two were killed by the hunt; the third (this one) was killed after the same
session had already logged the lesson it violated. The mechanism is working — both
kills came from the adversarial pass, not from Max Cogar — but the authoring side
is not learning within a session from entries it wrote hours earlier. Dispatch the
hunt *before* writing into the spec, not after.

## 2026-08-01 — a separate Phase 0 spec: solving the half that was never broken

**Caught by the independent collapse-hunt** (`docs/reviews/2026-08-01-collapse-hunt-phase0-spec-draft.md`,
19 findings, 6 structural). Third killed artifact in one session. The file was
deleted the day it was written.

**What collapsed.** A new `docs/specs/spec-context-oracle-phase0.md`, justified by
the claim that the 2026-07-31 fix was half-applied — the collapse log named
*"specifying and architecting"* Phases 1 and 2 twice, and only the architecting
half was fixed.

**The question that killed it:** *"Name the file from which a Phase 1 requirement
was removed."* None. The defect the 2026-07-31 entry names is **specifying Phases 1
and 2 against nothing** — a defect located entirely in the Phase 1/2 material.
Re-stating **Phase 0** in a second file does not touch it. Net movement against the
defect: zero. Net duplication: one full requirement set, of the half that survived
every review round.

**Class: wrong-check.** The quote was accurate and the inference from it was
backwards.

**The remedy was already written, and had been read.** `STATUS.md`, step 1 of the
2026-07-31 entry: *"Work out which requirements belong to Phase 0 … Write those
tags into the spec, so the boundary is settled once, in the spec, and can be
checked."* The killed document's own requirements section **is** a phase-tag list —
exported to a separate file that then needs a precedence rule it does not have. The
agent had read that STATUS step at the start of the session and summarised it to
Max Cogar.

**Standing lessons:**

1. **When a defect is named as "X was done twice", the remedy removes one of the
   two — it never adds a third.** Before writing a new document, name what the
   existing documents lose. If the answer is "nothing", the new document is a
   duplicate no matter how well it is written.
2. **A new spec needs a precedence rule against the old one, in writing, before its
   first sentence.** This draft said "the parent text governs" in one section and
   overrode the parent in two others. `CLAUDE.md`'s information policy predicted
   exactly this ("the two diverge and nothing tells you which is current"); it took
   one document to arrive.
3. **Reading a lesson is not inheriting it, and the interval is now hours.** The
   draft declared a bar term missing without reading the line that defines it
   (`architecture:1059–1060` — *"For the mechanical Lane 1 genres (no model)
   `materiality` defaults to the genre's base weight"*), which is the standing
   lesson logged **earlier the same day** for the same failure. Same for the
   measurement contradiction: §9.2's *"by the distiller"* was read; §6.3's
   *"`status` (health metrics §9.2…)"* and NF-2's *"measured and reported by
   `ctxoracle status`"* were not, and `status` is Phase 0.
4. **An "open questions" heading does not launder a decision.** The draft stated
   *"Phase 0 ships the full bar"* in bold inside the section headed "Open questions
   this spec cannot close."

**What survived and is kept:** Phase 0 is not degraded mode (re-verified). And
FR-X6 is Phase 0 by necessity, because Phase 0 emits whispers and FR-X6 applies to
every whisper — which **corrects a finding of record** in the preceding hunt, whose
closing section stated Phase 0's component list has no FR-X6 whisper log.

**Session tally, recorded because the rate is the finding.** Three artifacts
written, three killed, all by the adversarial pass rather than by Max Cogar. The
mechanism is working. The authoring side is not learning within the session from
entries it wrote hours earlier — twice it declared something missing without
reading the file, after writing the lesson against exactly that. The dispatch-first
order was adopted only on the third attempt.

## 2026-08-01 — a true premise, and everything built on it in the same commit

**Caught by the independent collapse-hunt**
(`docs/reviews/2026-08-01-collapse-hunt-phase-table.md`, 23 findings, 8
structural). Fourth pass of the day. Unlike the three before it, the **premise
survived** — the failure moved downstream of it.

**What survived.** FR-L1's subject is the session service, §12 places the session
service in Phase 0, and FR-L1 is absent from §12's Phase 2 bullet. So the per-event
log including uptake evidence is Phase 0 work, and §9.2's *"Measured … by the
distiller"* was an over-broad attribution. Read correctly, from source.

**What collapsed, and the lesson.** Everything built on that premise in the same
commit, without the same discipline: a per-requirement phase table whose
"Verified by" column was false in twelve of forty-one rows against §13's own
mapping; two summary attestations, one demonstrably false; a genre section whose
heading orphaned the phase bullets beneath it; and a row reinstating a claim
killed eight hours earlier.

**Standing lesson — a verified premise does not confer verification on its
consequences.** Getting one hard read right produces exactly the conditions for
the next error: the premise is checked, so the structure built on it feels
checked, and the same commit ships forty rows nobody read against source. The
discipline is per claim, not per commit. Specifically:

1. **A table is not a summary; every cell is a claim.** The "Verified by" column
   was written from memory of what each AC probably covers. §13 states its
   mapping explicitly and it takes one pass to check. Twelve rows were wrong,
   including the one row the entire change existed to establish — FR-L1, which
   has **no** acceptance criterion at all.
2. **Asserting more verification than exists is the project's worst failure
   mode, and a phase table is a machine for doing it at scale.** `CLAUDE.md`
   calls a falsely reported success strictly worse than no work at all; a table
   commits forty of them in one edit and each one reads as checked.
3. **Never insert a heading above content you did not intend to adopt.** The new
   `### 12.2` re-parented §12's canonical phase bullets under a heading that
   declared the matter open — and fifteen table rows cited `[§12]` as their
   basis, resolving into it.
4. **The falsifiable column is the one that gets dropped.** Both prior hunts
   prescribed the same remedy, naming the **store row** each measurement lands
   in. It was the one column omitted — and its absence is exactly what let a
   non-existent component ("FR-A3 budget accounting") pass as a recorder. A store
   row cannot be invented; a component name can.
5. **"Every X is Y" written under a table is an attestation, and the standing
   instruction is to treat it as a defect on sight.** Both such sentences here
   were false: §9.2 lists six metrics and the table listed six *different* ones,
   silently dropping regret rate and ceremony count, and no row corresponded to
   Phase 2's exit at all.

**Also recurring, fourth and fifth instance in one day:** lifecycle inversion
(architecture decisions and a review-finding ID cited as spec authority, plus
"Lane 1"/"Lane 2" — architecture vocabulary with no referent in the spec), and a
contested membership settled by silence (the consequence genre, which STATUS names
as one of exactly two).

**Applied.** §12.1 and §12.2 removed; §9.2's three corrections made; the
measurement table rebuilt with a store-row column, its scope stated, its
attestations deleted, and its false-fire row narrowed to the outcome arm. The
seven open items were moved to **§14**, which is the section whose one job that
is and which none of the four artifacts had updated.

**What is now honestly known:** Phase 0 emits silence rate, latency and
continuation count. **Hit rate is not established** — FR-L1 records uptake
*evidence*, the architecture assigns uptake *detection* to the distiller, and
those are different acts in different phases. That question, not the genre set, is
what Phase 1's exit currently rests on.

## 2026-08-01 — the same key, the same sentence, opposite tests

**Caught by the independent collapse-hunt, before a word was written into any
document.** Fifth pass of the day and the first run in the right order: the claim
was attacked as a proposition, so nothing had to be deleted afterwards.

**The proposition.** That uptake detection is already a Phase 0 obligation, because
FR-A4 forbids repeating what the agent has *"visibly acted on"*, and the
architecture's own uptake decision notes in passing that *"the subject key already
exists for FR-A4 dedup"*. If true, hit rate would be available in Phase 0 and
Phase 1's exit would be unblocked.

**The question that killed it:** *"Step 9b names FR-L1's detector by its clauses
and rejects it. FR-A4's 'visibly acted on' is that same clause list, from the same
RETHINK sentence. So which predicate does Phase 0 already have — the one 9b
rejected, or the one 9b specified?"*

The rejected one. FR-A4's arm resolves through its `[RETHINK §5]` citation to
*"opened the pointed file, used the named helper"* — verbatim the detector the
architecture threw out because it *"scores the tool's best outcome as a failure:
an agent told there is a second write-site, which then edits it directly … never
opens the file the pointer named."* The replacement is *"subject … edited, tested,
or referenced by any route … **not only the pointer being followed**"* — an
explicit rejection of the very arm the proposition offered as its machinery.

**Class: wrong-check.**

**Standing lesson.** *A requirement and a metric can share a predicate's name, a
subject key, and the same source sentence, and still be opposite tests* — because
one asks **"has the agent already got this?"** (and suppresses) while the other
asks **"did the agent take this?"** (and scores). Sharing the key is not sharing
the detector, and the detector one of them **rejects** may be exactly the detector
the other **requires**. When a derivation turns on two requirements "using the same
machinery", check the direction of the test, not just the identifier.

**Two corollaries worth inheriting:**

1. **A stated limitation is a bound only when it is independent of the decision it
   feeds; otherwise it is a hedge.** "Hit rate, in-session uptake only" sounds
   honest. But in-session detection systematically undercounts exactly the
   stop-class genres — Completeness and Verification fire at the last observable
   moment — and the number's declared use is *per-genre admission*. A limitation
   correlated with the decision it informs is the hollowness `CLAUDE.md` warns a
   hedge carries to the owner.
2. **A nullable column is evidence about write ordering, not about which phase
   writes it.** `whisper_log.uptake` is null at insert because the row is written
   before delivery and uptake is unknowable at that instant. The previous hunt
   read it as "the shape of a deferred writer" and this one corrected that. What
   *is* real evidence: the write has no durability class in D24 at all, which is
   open finding R4-C6.

**What the hunt established, and it is worth having.** Phase 0 can detect,
in-session, that this consumer opened a pointed file or used a named helper — a
derivation, not a spec statement, whose only acceptance criterion is a Phase 1
exit. That is a **pointer-followed rate**, not hit rate, and naming it correctly is
the whole point.

**The larger finding, which nothing recorded.** Phase 1's exit — *"measured
silence and hit rates reviewed against the bar"* — states **no pass condition**:
no threshold, no genre scope, no observation window, no named reviewer. Every
other phase exit resolves to acceptance criteria; AC-2 shows what a real condition
looks like. Settling uptake's phase would not unblock Phase 1's exit, because
there is nothing there to satisfy. Recorded in §14.

**Process note.** This was the fifth artifact of the day aimed at the same
conclusion, and the fourth hunt had predicted it in writing: *"if detection is
Phase 2, hit rate is still behind a Phase 2 component, and the headline conclusion
is false the same way its two predecessors were, one layer down."* It was. The
difference is that this time the hunt ran before the writing, so the cost was one
subagent instead of a commit, a revert and a correction.
