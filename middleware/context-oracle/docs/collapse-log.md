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

## 2026-08-12 — caught by Max Cogar, logged as a process failure

**An agent-invented constraint was hardened into a rule and then handed back to
the owner as his own.** v1 FR-A3 records *"at most one whisper per event."* The
owner's actual words (`RETHINK.md:175–176`) are *"Per-trigger and per-session
whisper **budgets**. Hard caps."* — a token budget, not a count. An agent
tightened "budget" into "one," it propagated into the Phase 0 spec, and this
session it reached Max Cogar as the binding premise of an owner question — *which
of two whispers wins at an edit?* He rejected the premise outright. The invented
cap had manufactured the entire dilemma; under the real rule both whispers are
delivered within budget and nothing has to be ranked.
Class: **unverified**. The 2026-08-01 lesson was *"no ranking claim enters a
document unless the owner stated it in those words"*; this is the same failure for
a **count/limit**. Generalise it: any load-bearing number or limit attributed to
the owner must quote the owner's words, and a limit whose only citation is an
interface section (here v1 §6.1) with no `[OWNER-n]`/`[D-n]` is an agent judgment
wearing a reference — verify it against `RETHINK.md` before a decision rests on it.
This one reached the owner, which is the failure the collapse mechanism exists to
prevent.
→ `docs/specs/spec-context-oracle-phase0.md` P0-D-27.

## 2026-08-01 — the Phase 0 spec, round 4

**Facts about what a contract hands you are not facts about what it does with what
you return.** §4 recorded eleven verified hook-contract facts and every one was about
hook *input*. The genre table is entirely a claim about *output placement*, and the
sentence governing it — `PreToolUse` context is delivered *"next to the tool result"* —
sat one paragraph from text §4 already quoted twice. Three of seven genres were
specified to arrive before an action that the contract delivers them after.
Class: **unverified**. When a document's claims split into input and output, verifying
one half exhaustively is not progress on the other; enumerate both axes before
attesting to having read a contract.
→ `docs/reviews/2026-08-01-round-4-collapse-hunt-phase0-spec.md` (F1).

**A citation finding closed by adding citations nobody checked.** Nine *"Carried from
v1 :n"* pointers were added to close a finding that requirements depended on uncited
sources. Five of the nine resolved to a different source than the one they named.
Class: **unverified**. The fix for an unverified-reference finding is the one fix that
cannot be applied unverified — every pointer added to close it is a new instance of it.
→ same file (F4).

**Renumbering identifiers without re-deriving what cites them.** A rebuild renumbered
21 acceptance criteria; four clauses at three sites still named the old numbers, which
now denote different criteria. The verifying script checked that every reference
*resolves* and reported zero dangling.
Class: **wrong-check**. Resolution is not support. A reference check must compare what
the citing sentence claims against what the cited item says, or it certifies only that
no identifier is missing.
→ `docs/reviews/2026-08-01-round-4-expert-review-phase0-spec.md` (S2).

**A device that has been false in every round it has existed should be deleted, not
corrected.** §3's "unchanged" column: wrong in ten rows, then eleven, then eight,
across three rebuilds. Each rebuild fixed the rows the review named. Twelve
whole-document attestation devices were located in round 4 and seven fail; every device
with a substantive axis fails on that axis while passing its mechanical proxy, and the
five that hold are the five whose only axis is mechanical.
Class: **wrong-check**. When a claim about the whole document has been falsified in
consecutive rounds, the remedy is to remove the claim — state each fact where it cannot
drift — rather than to re-assert it more carefully. Correcting it again is choosing the
form that has already failed.
**The removal is of the claim, not of the view.** Separate what a summary device
*indexes* from what it *asserts*. §3's coverage half (all 65 accounted for exactly
once) is mechanically checkable and held every round; its sameness half duplicated the
requirement text and drifted from it. Delete the duplicate assertion and keep the
index pointing at where each fact is stated — deleting the whole device would cost the
one-page view a downstream reader genuinely needs.
→ same file (S1, Systemic 1).

## 2026-08-01 — the Phase 0 spec, round 3

**Verifying a source establishes only the claims you aimed at it.** The Phase 0 spec
downloaded the 242 KB hooks reference and string-matched every quotation it made — the
correct fix for the previous round's fabricated citation, and it worked: 27 of 27 spans
verbatim. Three of round 3's heaviest findings were nonetheless answerable from that
same file, because the method checked every *positive* claim the document made about the
contract and inherited every *negative* one. "Phase 0 cannot detect a completion claim"
was never checked against the file that contains `last_assistant_message`.
Class: **unverified**. A document's claims about what a source does *not* contain are
claims about the source, and they need the same instrument aimed at them. When a
requirement says a phase lacks a capability, grep the contract for the capability before
writing the sentence.
→ `docs/reviews/2026-08-01-collapse-hunt-phase0-spec-rebuild-2.md` (Q1, Q4, Q5).

**An owner ruling names a moment; the nearest event is not that moment, and the fix for
that is not a cap.** `[OWNER-12]` accepted the turn cost of speaking at a completion
claim. Round 2 found Phase 0 spending it at every turn boundary and the remedy taken was
to bound the volume — an honest-looking fix that implemented a blunter capability and
attributed it to the ruling. The actual remedy was a field the harness already supplies.
Class: **mechanism-not-mission**. Bounding the blast radius of a mechanism that
recognises the wrong thing is not a fix; it is the wrong thing, rationed.
→ same file (Q1).

**Three rounds running, the device installed to close a finding became the next round's
heaviest finding.** §3's disposition table (added to close a coverage gap) was wrong in
ten rows, then in eleven more. §4's source table (closed to two entries) orphaned six
source keys. §2's arm table (split to give per-arm reasons) gave a reason its own P0-1
contradicted. Each was re-checked along the axis that is cheap — arithmetic, set
membership, row presence — and not along the axis it asserts.
Class: **wrong-check**. For every whole-document attestation, write down the check that
would *falsify* the substantive claim and run that one. The mechanical proxy passing is
not evidence; it is the reason nobody looked.
→ `docs/reviews/2026-08-01-round-3-expert-review-phase0-spec.md` (S1, M1, M2, Systemic 1).

**Disclosing an unsourced claim is not removing it.** The warning-priority clause
survived three rounds: deleted once, restored for identifier fidelity, then kept with a
decision record stating the ranking is decided elsewhere. That left the requirement text
asserting a precedence two other passages denied — and an implementer builds to the
requirement.
Class: **posture**. An annotation does not neutralise normative text. Delete it, or send
it to the owner as a ranking he has not made.
→ same file (S2).

**Two instrument failures that would each have produced a confidently wrong finding.**
`pdfminer.six` interleaves the ROSE paper's two columns mid-sentence, so a verbatim
quotation fails a string match; a second engine resolved it. Two hooks quotations failed
a naive match only because of markdown link syntax in the raw source. And `file(1)`
reports that PDF as 10 pages when it has 17 — page count was used in a prior round to
confirm the right paper.
Class: **unverified**. A negative result from one extraction tool is a result about the
tool until a second one agrees.
→ same file (Instrument corrections).

## 2026-08-01 — the Phase 0 spec, rounds 1 and 2

**The fix for a finding is where the next finding is created.** In round 2 of the
Phase 0 spec, three of the four heaviest findings were false claims the document
made about *itself*, and each sat in the device installed the round before to close
an earlier finding: a disposition table added to close a coverage gap was wrong in
ten of its forty-four rows; a namespace rule added to close an identifier collision
was broken twice in the section beneath it; a source list closed to two entries
achieved that by deleting the requirements needing the others, leaving a test with
no requirement behind it.
Class: **unverified**. The generator is that a device asserting a property of the
whole document is written once and never re-checked against the document it
describes, while the individual requirement it was written to fix does get
re-checked. Treat any newly-added summary, table, partition or namespace rule as
the *first* thing the next round verifies, not the settled part.
→ `docs/reviews/2026-08-01-round-2-expert-review-phase0-spec.md` (S1, S3),
`docs/reviews/2026-08-01-collapse-hunt-phase0-spec-rebuild.md` (N2, N3, N4).

**A quotation carried from a prior project document and re-attributed to the
primary source reads as verified and is not.** The Phase 0 spec attributed a
sentence about `PreToolUse` permission behaviour to the harness documentation; the
string appears nowhere in the 242 KB reference and matched exactly one thing — the
v1 spec, where it sits under a source tag. It entered *with* the fix for a prior
round's finding about that same paragraph.
Class: **unverified**. Re-deriving a fact from source means opening the source, not
copying the sentence a sibling document attributes to it.
→ `docs/reviews/2026-08-01-round-2-expert-review-phase0-spec.md` (S1).

**A ruling about a *moment* was implemented as an *event*, and nothing recorded
that they differ.** `[OWNER-12]` accepted the turn cost of speaking when an agent
claims completion. `Stop` fires whenever the agent finishes responding; telling the
two apart needs the transcript reader, deferred to a later phase. Neither spec
recorded the contract sentence that separates them, so the accepted cost was
silently spent at every turn boundary with no per-session bound anywhere.
Class: **mechanism-not-mission**. When an owner ruling names a moment, record the
mechanism that recognises that moment — and if the phase has none, say so in the
requirement rather than letting the nearest event stand in for it.
→ `docs/reviews/2026-08-01-collapse-hunt-phase0-spec-rebuild.md` (N1).

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

## 2026-08-01 — ten collapses in one session

Ten propositions or artifacts were caught this day; nine by the independent
adversarial pass, one by Max Cogar. **Full findings for each are in
`docs/reviews/2026-08-01-*.md`** — this entry carries only the lessons, per the
information policy's one-line-plus-a-pointer rule. *(These entries originally
reproduced the review findings in full, which is the same policy violation ten
times over. Condensed the same day.)*

**Caught by Max Cogar, logged as a process failure:**

1. **"The core problem the tool exists to solve"** — an agent's superlative,
   wrapped around the owner's quoted words in `RETHINK.md`, had propagated to the
   spec, this log, a review pass that quoted it back as its standard, and a live
   scope decision. **Lesson: no ranking claim about this tool's purposes, genres,
   triggers or moments enters any document unless the owner stated it in those
   words, quoted and attributed.** A reduction inside a *rationale* is more
   durable than one inside a decision, because reviewers check decisions against
   sources and read rationale as prose.

**Caught by the adversarial pass, written after the artifact (cost: a commit, a
revert and a correction each):**

2. **The Phase 0 genre cut** (14 findings). **Lesson: when the argument for
   excluding something is that it isn't worth saying, that is a bar argument —
   per candidate, at runtime, tunable — never a scope argument. A bar suppresses;
   a build plan deletes. The tool getting quieter is not the tool getting
   smaller.**
3. **Crediting the owner with an answer the documents already contained.**
   **Lesson: before recording that something was missing, read the file you are
   about to say it was missing from. When the owner points at something,
   establish whether he is supplying it or citing it — the default is citing.**
4. **The Phase 0 purpose block** (17 findings). **Lesson: a purpose sentence is a
   claim about what a thing can do and needs the same verification as any other.
   "X is necessary for Y" is not "X exists for Y". A criterion that cannot
   exclude is not a test; one that excludes at build-plan level is the prior
   collapse in new clothes. The spec does not cite numbered architecture
   decisions as authority.**
5. **A separate Phase 0 spec** (19 findings). **Lesson: when a defect is named as
   "X was done twice", the remedy removes one of the two — it never adds a third.
   A new document needs a written precedence rule before its first sentence.**
6. **The phase-assignment table** (23 findings). **Lesson: a verified premise
   confers no verification on its consequences. A table is not a summary — every
   cell is a claim. "Every X is Y" under a table is an attestation, and the
   standing instruction is to treat one as a defect on sight. The falsifiable
   column is the one that gets dropped.**

**Caught by the adversarial pass, run before the artifact (cost: one subagent
each, nothing written or reverted):**

7. **Uptake detection under FR-A4.** **Lesson: a requirement and a metric can
   share a predicate's name, a subject key, and the same source sentence and
   still be opposite tests — one asks "has the agent already got this?"
   (suppress), the other "did the agent take this?" (score). The detector one
   rejects may be exactly the detector the other requires. A stated limitation is
   a bound only when independent of the decision it feeds; otherwise it is a
   hedge.**
8. **Phase 1's exit "has no pass condition".** **Lesson: "every other X" is a
   claim about a set and is only as good as the enumeration behind it. A real
   finding dressed past its evidence leaves the dressing for the next session to
   inherit.**
9. **An entry-gate/exit-gate conflict between the spec and `CLAUDE.md`.** There
   was none. **Lesson: when two documents appear to conflict, check whether one
   is quoting the other before deciding which wins — identical wording is
   evidence of copying, not corroboration. Ask what a question unblocks before
   ranking it.**
10. **The seven-genre Phase 0 list** (13 findings). **Lesson: a criterion that
    admits every member but one on both its conjuncts, and that one member on a
    single conjunct, was reverse-engineered from a list already chosen. And after
    a run of kills the authoring instinct learns that *inclusive* proposals
    survive — every safeguard here points at exclusion, so an inclusive error has
    nothing watching for it. Being wrong in the safe direction is still being
    wrong.**

**The thread through half of them.** Four separate failures were the same act:
declaring a mechanism missing without reading the line defining it; claiming
"every other X" without enumerating; quoting a paragraph to the em-dash where the
continuation reversed the reading; and asserting what sibling sentences contain
without opening them. **Stopping too early against a source that is right there.**

**The process lesson that changed the session.** The first six were written and
then hunted. The last four were hunted and then written. Cost of the first order:
a commit, a revert and a correction each. Cost of the second: one subagent, and
nothing to undo. **Dispatch the pass before writing into a document, not after.**
