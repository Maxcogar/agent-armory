# Round 2 — adversarial collapse-hunt (mission-fidelity axis)

**Artifact:** `docs/architecture-context-oracle.md` (2,249 lines, D1–D26, T1–T4,
build order, traceability matrix) as of 2026-07-30.
**Axis:** mission fidelity only — *"deliver the fact that would change the
agent's next decision, at the moment of that decision, without being asked."*
Premise/standards review ran concurrently and blind (separate file).
**Protocol:** `CLAUDE.md` collapse test, steps 2–4. The document's own written
collapse tests (D10, D12, D24) are the floor and were **not graded**; every
question below is new.
**Inherited traps:** `docs/collapse-log.md` (2026-07-17 and 2026-07-22 entries,
including the standing caution in item 3 of the 2026-07-22 entry, read in full
before any posture-class finding was considered — none was filed).

**Verdict: the document does not survive.** Five collapses (three of them
mission-critical), four partial collapses, four decisions attacked and survived.

---

## Summary

| # | Decision(s) | Class | Verdict |
|---|---|---|---|
| C1 | D10, D12 | reduction | **COLLAPSES** — non-obviousness (P5), the anchor's own send-criterion #2, has no mechanism anywhere in the bar |
| C2 | D14, D12, D13, D6 | decision-hiding + reduction | **COLLAPSES** — the two owner-added conduct genres are structurally undeliverable through the grounding gates |
| C3 | D10, D11, D20 | mechanism-not-mission | **COLLAPSES** — Lane 2 has no model-call budget, and it spends the same subscription the agent is spending |
| C4 | D15, D10 | reduction | **COLLAPSES** — cross-consumer token allocation is arrival-order; in fan-out workflows most subagents get zero |
| C5 | T1, D12, D13 | unverified / overclaim | **COLLAPSES** — the pointer-only default does not cover model paraphrase, which is Move B's entire purpose |
| C6 | D10, D7, D21 | wrong-check | **COLLAPSES (partial)** — the auto-suppression ladder scores the tool's best outcome as failure |
| C7 | D7, D20 | wrong-check | **COLLAPSES (partial)** — degraded-mode statistics tune the rows the model-mode product will use |
| C8 | D10 step 9 | mechanism-not-mission | **COLLAPSES (partial)** — the anti-ratchet excludes exactly the genres whose floors only ever move up |
| C9 | D14, D10 | decision-hiding | **COLLAPSES (partial)** — the "lag contract" is measured for the reader and asserted for the whisper |
| S1 | D11 (recursion guard) | — | SURVIVES |
| S2 | D24 (audit durability) | — | SURVIVES, one minor correction |
| S3 | D9 / FR-O4 (no deny path) | — | SURVIVES |
| S4 | D19 (ingress choke-point) | — | SURVIVES |

---

## C1 — D10 / D12: the bar measures how much a fact *matters* and never how *cheaply the agent could have got it itself*

**Collapse question (new).**
> Your own anchor — `docs/judgment-layer-corrected-foundation.md`, "What 'worth
> sending' actually means" — lists five conditions a candidate must meet, and
> the second is **non-obvious**: *"something a cold checkout can't reveal and
> the agent can't trivially self-serve (P5)."* Point at the term in the bar that
> computes it. The bar is `confidence × (materiality × structural_weight)` plus
> evidence floors, cold-start floor, first-N clamp and ladder state — and
> `materiality` is defined in D12 as *"the model's intent-derived estimate of
> how much this fact bears on this decision."* Every one of those terms measures
> how much the fact **matters**; none measures how **cheaply the agent could
> have got it itself**. And the model you ask FR-A1's *"do I know something it
> almost certainly doesn't"* is handed `{intent, recent_narration, facts}` — it
> is never told what this consumer has read, searched, or already been told. So
> what stops the coupling genre's *"canonical helper for the thing you
> grepped for"* and the consequence genre's *"14 call sites"* — both one grep
> away, one of them literally a restatement of the search the agent just ran —
> from becoming the tool's most frequent output?

**Verdict: COLLAPSES. Class: reduction.**

**Where it collapses.** Grep the document: `non-obvious` occurs twice, in D20's
prose and in the Phase-8 attestation. It is never a computed quantity. The
traceability matrix answers `P5` with *"Lane 1 genres keyed to non-discoverable
knowledge (D10, D17), D12 materiality judgment"* — which is a **genre-level
design intent plus a term that means something else**, not a per-candidate
check. Follow it and the citation circles: D12 defines materiality as
intent-bearing, D10's bar has no discoverability term, D17 is the co-change
miner. The only surviving fragment of criterion #2 is FR-A4 dedup — subject-key
matching against files already seen — which catches *"I already told you"* and
*"you already opened that file,"* and catches nothing about *"you could get this
in one tool call."*

This is not a technicality. RETHINK §2.3 is categorical: **"Marginal value over
the agent's own abilities is the only relevance metric that matters."** The one
metric the rethink names as the only one that matters is the one metric absent
from the send bar. Spec P5 restates it as a product principle. The
2026-07-17 collapse log records that the send-gate was rebuilt precisely
*because* it checked the wrong property; the rebuilt gate now checks four of the
five properties the rebuild specified, and the missing one is the one that
distinguishes an oracle from a linter. RETHINK §2.3 also names the failure this
produces by name: *"Handing them thousands of tokens of material they could
surface themselves in three tool calls is noise that crowds out the signal."*

Note the asymmetry that made this invisible to the last round: everything the
round-1 hunt *added* got a mechanism (decision-impact defined, negative-evidence
facts, the audit spool). Criterion #2 was never contested, so it stayed prose.

**What it steers the agent toward.** Toward being told true, moment-relevant,
structurally-important things it could have found itself — the wallpaper
outcome RETHINK §3 and spec P1 exist to prevent. Wrong direction.

**Concrete fix.**
1. Add a third factor to `decision-impact`: `self_serve_cost ∈ (0,1]`,
   deterministic, derived from the fact's own provenance class — git-history
   co-change, learned records, landmines, cross-file invariants and human facts
   are cold-checkout-invisible (high); single-file static structure that a
   `Grep` for the same symbol returns (call-site counts, "there is a helper at
   Z") is low; and it drops further when Tier 3 shows the consumer has *already
   run* a search whose result set contains the fact's location.
2. Put the consumer's Tier 3 read/search set (paths and search terms, capped and
   secret-scanned) into the Move-A data field, and add `non_obviousness` to the
   Move-B verdict schema beside `materiality`, so the model is asked *both*
   halves of FR-A1 and given evidence for the second. Today it is asked one half
   of FR-A1 and the document calls the answer FR-A1.
3. Add an acceptance criterion: in a replay where the agent greps for a symbol
   and the store holds the "canonical helper" fact for it, **no whisper is
   emitted** — and the same fact *is* emitted when the agent has not searched.
   Without a fixture, criterion #2 will drift back to prose.

---

## C2 — D14 / D12 / D13 / D6: the two owner-added conduct genres cannot pass the grounding gates

**Collapse question (new).**
> AC-19 requires a Process whisper that says *"completion claimed at turn T;
> loaded skill X requires verification at line L; no matching tool call
> observed."* AC-20 requires a drift whisper naming a question *"verbatim, with
> its location."* Name the store fact each of those claims binds to. D12 Move C
> drops any whisper whose `claims[].grounding_id` does not reference a supplied
> fact *"whose pointer resolves against the current store (file exists at
> indexed hash / commit exists)"*; D13 says **both** composition paths pass a
> final gate where *"every pointer must resolve against the store at assembly
> time or the whisper is dropped."* A loaded skill's text lives in the
> transcript. The observed-activity gap lives in Tier 3, which D15 states is
> **in-memory**. D6's schema has no table for skill expectations at all. So
> under the rules as written, the two genres the owner said "I want this feature
> specifically" about are **structurally undeliverable** — and the last round
> already caught this exact shape once, when the grounding-id rule silently
> precluded the `Unknown` genre.

**Verdict: COLLAPSES. Class: decision-hiding + reduction.** (This is *not* a
posture finding. The genres are owner-approved, advisory, mission-aligned and
must ship enabled; the finding is that the document does not make them
buildable, which is a stronger obligation than keeping them, not a way of
dropping them.)

**Where it collapses.** Three separate holes, all in the same seam:

- **No store home.** D6's table list is complete and contains no
  `skill_expectations`. D14 says expectations "become session-scoped
  expectations in Tier 3"; D15 confirms Tier 3 is an in-memory map. A Move-B
  claim can only bind to a *supplied fact*, and Move A's retrieval enumerates
  store sources (FTS, co-change, exemplars, landmines/invariants, open
  questions). Process has nothing to bind to.
- **No resolver for the pointers that do exist.** `open_questions` *is* a store
  table, so drift has a row — but its pointer is `asked_loc`, a transcript
  location, and the only resolver the document specifies is "file exists at
  indexed hash / commit exists." A transcript offset resolves under neither.
- **The load-bearing claim is negative.** "No matching tool call observed" is an
  absence claim about the session, exactly the shape that killed `Unknown` last
  round. The fix applied then — the negative-evidence fact — is defined *only*
  for a bounded determining **store query** returning empty. It was not
  generalized to session observations, so the trap it closed is open again one
  decision over.

Beyond bindability, the Process detector itself is a named noun with no design:
"Process expectations are extracted by Lane 2" is the entire specification for
turning arbitrary prose skill documents into checkable required steps with
line pointers, and for deciding what counts as a "completion claim" and what
counts as "matching tool activity." Compare answer-drift, which is fully
specified (deterministic bookkeeping, 2 turns, [spec D-17]). The document
designs the easy half of OWNER-9 and names the hard half. That is the round-1
pattern — the hard part relocated into a step that is named but not built —
recurring inside the feature the owner cares most about.

**What it steers the agent toward.** Toward a build in which the two genres are
implemented last, discovered undeliverable at fixture time, and quietly
descoped or hacked past the gate by an implementer inventing a grounding
exception inline — the lifecycle failure `CLAUDE.md` names as the reason the
architecture stage exists.

**Concrete fix.**
1. Generalize the negative-evidence mechanism into a **session-evidence fact
   class**: `prov_kind='session'`, `prov_ref='transcript:<session>:<offset>'`,
   `trust='mechanical'`, with a resolver that re-reads that offset (the pointer
   is checkable in the P4 sense — the owner can go look). Add the resolver to
   D13's assembly gate explicitly, alongside file-hash and commit resolution.
2. Add `skill_expectations(session, consumer, skill_ref, step_text,
   required_activity, prov_*)` to D6, written by the narration reader, so
   Process has a bindable, auditable, evictable fact — and so the whisper's
   evidence appears in the FR-X6 audit log like every other whisper's.
3. Specify the Process detector: the expectation schema (step text → required
   activity signature → governing line pointer), the match rule against
   observed tool events, and the definition of a completion claim. If any part
   is genuinely research-shaped, say which part and design a v1 that only fires
   on the mechanically decidable subset (e.g. a step whose required activity is
   a named command or tool, claimed complete with zero matching events) —
   narrower is fine; undesigned is not.
4. Add the conduct genres to AC-7's coverage: skill text is untrusted transcript
   content and now enters the model prompt (see C5).

---

## C3 — D10 / D11 / D20: Lane 2 has no model-call budget, and it spends the agent's own subscription

**Collapse question (new).**
> D11's own premise note says a spawned `claude -p` *"draws from your
> subscription's usage limits"* — **the same limits the agent it is helping is
> drawing from**. Lane 2 fires a judgment per transcript delta, per loaded
> skill, per open question, **per consumer, including every subagent of the
> fan-out workflows OWNER-8 put subagents in scope for**, at ~5.7 s measured and
> a 20 s ceiling each, plus a *second* call for the A0 shaping sub-turn on every
> discovery intent. Where is the number that bounds calls per session? Grep the
> document: "rate limit," "usage limit," "quota" appear nowhere; NF-2 budgets
> *injected tokens*, not model calls; D10 step 8 bounds the candidate **pool**
> (64/consumer), not the call rate; and the "intent queue" — the component that
> decides what the model may see — occurs exactly twice, both times as a name in
> a list, never with a dequeue policy, a coalescing rule, or an admission
> budget. If the oracle throttles or exhausts the owner's model access, it has
> stopped the agent's real work — *"a hook that slows the agent is a gate by
> another name"* (RETHINK §5) — and it will have done so through the one channel
> NF-1 structurally cannot see, because Lane 2 is off the hook path.

**Verdict: COLLAPSES. Class: mechanism-not-mission.**

**Where it collapses.** The document's entire latency argument is that moving
the model off the hook path makes its cost invisible to the agent. That is true
for *wall-clock on the turn* and false for *the shared resource the piggyback
consumes*. The piggyback is the design's central move (§6.2, OWNER-2, OWNER-7)
precisely *because* it reuses the host's credentials — which means it also
reuses the host's budget. Nowhere does the document acknowledge that the oracle
and the agent are drawing on one pool, let alone bound it.

The consequence is not hypothetical. The intent queue is fed by transcript
deltas from every consumer; a busy agent emits events every few seconds while
each judgment costs 5.7–20 s; the queue therefore either backs up without bound
or drops, and **the drop policy is the thing that decides what the model may
see** — the exact suspect the collapse-log's 2026-07-22 "Pattern this session"
paragraph tells future agents to hunt. Drop oldest and the oracle judges only
stale narration; drop newest and it never sees the current one. Neither is
chosen; neither is measured; neither is diagnosable, because no diagnostic
counts model calls, tokens spent, or queue depth.

Also missing at the same seam: D20's degraded-mode transitions are defined for
*failure* (3 consecutive Lane 2 failures, binary absent, probe failure) but not
for *exhaustion*. A rate-limited environment produces failures that look like
transient errors, so the oracle will thrash rather than degrade — and the owner
sees nothing, because FR-M2's self-check list has no model-economy check.

**What it steers the agent toward.** Toward a tool whose worst case is not "a
wasted sentence" (P2, OWNER-3) but "the agent's own model access degraded by the
thing that was supposed to help it." That inverts the mission's safety property.

**Concrete fix.**
1. Design the intent queue in D10 as a real component: **one in-flight judgment
   per consumer**; new deltas for a consumer **coalesce** into the pending
   intent (newest narration wins, superseded content merged, never silently
   dropped); explicit overflow policy with a diagnostic; queue depth exported.
2. Add per-session and per-consumer **model-call budgets** as `tuning` rows with
   stated defaults and derivation, and a session-level call ceiling that
   dominates both. Budget exhaustion is an explicit transition to degraded mode
   with a `systemMessage` notice and an FR-M2 finding
   (`model_budget_exhausted`) — visible, not silent starvation.
3. Add model economy to D21's self-checks and to `ctxoracle status` in plain
   language: calls made, tokens spent, calls declined by budget, queue drops.
   The owner cannot be the detector (OWNER-10); today nothing else is either.
4. State in Limitations that Lane 2 consumes the host's subscription budget, and
   that this — not latency — is the true ceiling on Lane 2 frequency.

---

## C4 — D15 / D10: which consumer gets to be helped is decided by arrival order

**Collapse question (new).**
> FR-A3's session token budget defaults to 2,000 ([spec D-10]) and D15 gives
> each consumer `min(600, session remainder)`. Run the arithmetic on the case
> OWNER-8 exists for — *"the owner's real work runs through workflows that fan
> out to subagents"*: consumers one through three take 600 each, consumer four
> gets 200, consumers five and up get **zero**. The oracle then goes silent for
> most of the session's subagents not because it has nothing material to say to
> them, but because three earlier consumers spent the budget on coupling notes.
> Name the allocator. The mission says deliver the fact that would change *the
> agent's* next decision — which agent gets served is currently decided by a
> scheduling accident.

**Verdict: COLLAPSES. Class: reduction.**

**Where it collapses.** The budget is a session-wide pool with a per-consumer
cap and no reservation, no reclamation at `subagent_stop`, no cross-consumer
priority, and no scaling with consumer count. Warning priority exists *within* a
consumer's spend but is never described as preempting across consumers. So the
single highest-impact whisper of a session — a ⚠ warning to the sixth subagent,
about to hand-edit build output — loses to a coupling suggestion the first
consumer received an hour earlier. OWNER-8's stated reason for pulling subagents
into v1 was that *"a main-agent-only oracle misses most of the decisions that
matter"*; a first-come-first-served pool reproduces that miss with extra steps.

Note this is the same class as C1 and C2: a deterministic step that decides what
may be sent, named and defaulted but never designed.

**What it steers the agent toward.** Toward silence concentrated on late
consumers, i.e. the deepest and usually most task-specific work in a fan-out.

**Concrete fix.** Specify the allocator in D10/D15: (a) reserve a per-consumer
floor at consumer creation, reclaim unspent reservation at `subagent_stop`;
(b) scale the session ceiling with the number of *active* consumers (or make the
budget per-consumer with a ceiling on concurrent spend), with the default and
its derivation stated; (c) let warn-grade candidates preempt across consumers,
not just within one; (d) emit an FR-M2 finding when a consumer is denied by
budget rather than by the bar — "silent because broke" must be distinguishable
from "silent because correct," which is D10's own stated standard for the
attention engine. Add a replay AC over a six-consumer fan-out asserting every
consumer with an above-bar candidate is served.

---

## C5 — T1 / D12 / D13: the pointer-only default does not cover paraphrase, and paraphrase is what Move B is *for*

**Collapse question (new).**
> T1 now concludes that a repo injection reaches the agent *"only via a flagger
> miss **and** a quote decision the design does not make for repo text."* But
> Move A hands the model a facts array whose elements carry `claim_text` — and
> for a landmine record that string **is** raw repo text, and for an exemplar or
> an invariant description it may be too. Move B's entire purpose is to
> re-express supplied facts in the agent's own terms. A paraphrase is neither a
> quotation nor a pointer, so D13's pointer-only default never engages; the
> grounding check passes, because the landmine record genuinely exists and its
> pointer genuinely resolves; and the only remaining control is the imperative
> deny-lexicon, which is the same class of heuristic you just conceded the
> flagger is. So D12's collapse answer — *"a hostile instruction reworded by the
> model has no provenanced fact to bind to"* — is exactly backwards: the
> reworded instruction binds to the very fact whose text it came from.

**Verdict: COLLAPSES. Class: unverified / overclaim.** This is collapse-log
2026-07-22 item 5 one level deeper: that round corrected "grounding eliminates
injection" to "defense-in-depth," and made the pointer-only default the
load-bearing text-level control. The pointer-only default is a rule about
*spans and quotations*. Free composition routes around it by construction.

**Secondary defect at the same seam:** D12 Move C permits *"delimited quotations
that trace to a supplied, non-suspect fact"*; D13 forbids inline quotation of
**all** repo-derived spans regardless of suspect status. These are contradictory
rules for the same output, in adjacent decisions, and an implementer will pick
one. Whichever is picked, the paraphrase path stays open.

**What it steers the agent toward.** Toward a whisper channel whose stated
trust property ("the channel carries data, not instructions," FR-D2, and T1's
"cannot pass through a model-composed whisper") is stronger than what the design
actually delivers. The mission's whole delivery model rests on the agent being
able to trust the channel enough to act on it without verification cost; an
overstated safety claim in the threat model is the most expensive kind of
hollowness here, because it is the claim nobody re-tests.

**Concrete fix.**
1. **Condition composition on the trust label the schema already carries.**
   Facts with `trust='untrusted_repo'` supply the model with numbers, genre,
   location pointers and oracle-computed metadata — **not** `claim_text`.
   Whispers whose only grounding is untrusted-repo facts render through the
   deterministic template path (D13) rather than model prose. The articulation
   genres keep full composition over `mechanical`- and `human`-trust facts
   (co-change ratios, call-site counts, zone classifications, human statements),
   which is where their value actually lives — this costs the design little and
   closes the carrier.
2. Reconcile D12 Move C and D13 into one stated rule, in one place, cited from
   the other.
3. Restate T1's conclusion to name **model paraphrase of untrusted fact text**
   as the carrier that the pointer-only default does *not* cover, and to name
   the trust-conditioned composition rule as the control that does.
4. Add an AC-7 carrier: an imperative planted in a landmine `evidence` string
   with the suspect flagger **configured to miss it**, asserting the emitted
   whisper contains no re-expression of it. Today AC-7's carriers all assume the
   flagger works, so the fixture cannot fail in the way the residual describes.

---

## C6 — D10 / D7 / D21: the auto-suppression ladder scores the tool's best outcome as failure

**Collapse question (new).**
> Spec §9.2 adopts Tricorder's *effective false positive* — anything the
> consumer does not act on — and FR-L1 detects "acting on" as *pointed file
> opened, named helper used, suggested command run*. Now take the best possible
> outcome of a coupling whisper: the agent, now knowing there is a second
> write-site, edits it directly, or simply does not make the mistake it was
> about to make. It never opens the file you pointed at. Which column
> distinguishes *influenced and silent* from *ignored*? At 25% the ladder
> **auto-suppresses the genre**. The mission is influence, and the metric that
> can retire a genre without anyone's approval measures compliance with a
> pointer.

**Verdict: COLLAPSES (partial). Class: wrong-check.** Partial because the
underlying vocabulary is spec-inherited (§9.2, [TRICORDER-15]) — but the
architecture is where a metric becomes a mechanism, and here it becomes an
automatic, unsupervised retirement mechanism built on a proxy the document never
validates. `uptake` appears in the document only as a schema column and a
statistic; **no decision names its producer or its detection rules.** Another
named noun with no writer.

**Concrete fix.** (a) Specify uptake detection in D10/D21: the whisper's
*subject* being subsequently edited, tested, or referenced by **any** route
counts, not only the pointer being followed; the subject key already exists for
dedup. (b) Restrict **auto-suppression** to explicitly contradicted warnings —
FR-L3's first clause (narration correction, or outcome contradiction). Silent
non-uptake may raise a genre's bar, reversibly, and must be reported in
`status`; it must never auto-retire a genre. (c) Report hit rate with its
detection method named in `status`, so an owner reading "hit rate 12%" is not
reading an artifact of the detector.

---

## C7 — D7 / D20: degraded-mode statistics tune the rows the model-mode product will use

**Collapse question (new).**
> D20 states honestly that degraded mode has no intent signal, cannot do FR-A1
> materiality, and that its restraint is a *"raised-bar rarity knob."* Phase 0
> **is** degraded mode, is the thing the owner runs on a real project, and is
> where AC-2's silence rate and the first false-fire numbers are measured. Now
> read D7: `whisper_stats(genre, project_key, …)` and `genre_state(genre,
> project_key, …)`. There is no mode dimension. So a genre put on probation
> because a *structure-keyed* whisper missed carries that probation into the
> *intent-keyed* lane where the same genre behaves differently — and the bar the
> learning loop hands Phase 1 was tuned by a system that could not judge
> materiality. Which key separates them?

**Verdict: COLLAPSES (partial). Class: wrong-check.** Partial because the fix is
small; it is filed because the consequence is not — the ladder is automatic, and
[COVERITY-10]'s first-impression effect (which the spec adopts in FR-A7) means
the earliest, least-informed measurements are also the most durable.

**Concrete fix.** Add `mode ∈ {model, degraded}` to the primary keys of
`whisper_stats` and `genre_state`; apply ladder state and bar tuning per mode;
show both in `status`. State in D20 that Phase 0's measured silence and hit
rates are evidence about the deterministic lane only, and are not a basis for
Phase 1's bar. This also gives the owner's §14 conduct-genre review the right
denominator.

---

## C8 — D10 step 9: the anti-silence-ratchet excludes exactly the genres whose floors only move up

**Collapse question (new).**
> The explore budget is the only mechanism that applies downward pressure to the
> bar, and it is *"never on warn-grade genres."* Warn-grade is where the floors
> are strictest — support ≥ 3, confidence ≥ 0.9 — and those are human-derived
> numbers applied to an agent consumer, which [spec D-8] explicitly flags as a
> calibrated guess, not a measurement. Within warn-grade, the ladder's only
> automatic movement is upward (probation at 10%, suppression at 25%). If those
> defaults are wrong *for this repo*, name the signal that ever lowers them.

**Verdict: COLLAPSES (partial). Class: mechanism-not-mission.** The document has
a partial answer — the regret proxy (same-region re-edit / revert / post-edit
verify failure "where the store *held* a coupling/landmine fact it did not
speak"). But as written the proxy only inspects facts the store **held**, and
a fact below the support/confidence floor is held-but-unrankable; nothing
records that a below-floor fact *would have* covered the regret. So the strictest
floors receive no evidence in either direction and can only ratchet up. The
document's own hedge — *"where neither signal is available the loop is
documented as silence-biased"* — is precisely the hedge `CLAUDE.md` step 3
forbids in a load-bearing place, since this is the loop that decides whether the
tool ever speaks at warn grade.

**Concrete fix.** Log every candidate that failed **only** an evidence floor
(genre, subject, support, confidence) to `session_log`, so the distiller can
compute *how often a below-floor fact coincided with a regret event*. Permit
floor **lowering** only from that measured evidence — never from explore
delivery of a warn-grade whisper, which stays correctly excluded. Report the
below-floor near-miss count in `status`; it is the only number that can tell the
owner "this tool is silent because it is calibrated for someone else's repo."

---

## C9 — D14 / D10: the lag contract is measured for the reader and asserted for the whisper

**Collapse question (new).**
> D14's lag contract says *"at event N the freshest narration is turn N−1,"* and
> the recommendation to the owner is that narration genres are *"a beat late,
> never wrong."* That is the **reading** lag, and it is measured. A Lane 2
> whisper about turn N−1 additionally needs: queue wait, ~5.7 s (ceiling 20 s)
> for the judgment, and a **second** model call before it when the A0 shaping
> sub-turn runs on a discovery intent. What is the contract for **delivery**?
> State the number of event boundaries between the narration that motivated a
> candidate and the earliest event it can be spoken on — and state what fraction
> of assumption-check candidates survive D10.7's supersession re-check at that
> distance. "A beat late, never wrong" is a promise the document makes to the
> owner about a delay it never computed, and the supersession re-check is
> designed to *drop* exactly the candidates that arrive too late, so the failure
> mode is invisible: it presents as correct silence.

**Verdict: COLLAPSES (partial). Class: decision-hiding.** The reading lag is
honestly measured and the supersession re-check is correct engineering. What is
hidden is that the two numbers were merged: a one-boundary reading lag is
presented as the whisper's lag, and the ship/no-ship recommendation the owner is
being asked to accept rests on the merged figure. The mission fixes not just the
fact but **the moment**; a genre that is structurally always past its moment is
a genre that does not work, and nothing in the design would reveal that.

**Concrete fix.** (a) State the delivery-lag contract explicitly, as a quantity
to be **measured** in D26's replay layer: inter-event interval distribution,
motivation-to-delivery boundary count, and candidate survival rate through the
supersession re-check, per genre. (b) Make supersession-drop rate an FR-M2
self-check with a finding code — a narration genre whose candidates are almost
always superseded is a capability that has silently gone dark, which is the
OWNER-10 failure D14 itself invokes for the subagent-transcript case. (c) Rebase
D14's ship-enabled recommendation on the delivery figure rather than the reading
figure, or state plainly that the recommendation is provisional pending that
measurement.

---

## Decisions attacked that survived

**S1 — D11, the recursion guard. SURVIVES.**
*Question:* "Your three layers assume the only recursion risk is the child
inheriting the observed repo's hooks. What about the reverse — the observed
agent spawning a nested `claude` of its own, whose events the oracle then treats
as the parent's?" *Answer:* the consumer key is `(session_id, agent_id)` from
the hook envelope (D8/D15) and the guard is keyed on `CTXORACLE_INTERNAL`, not
on process ancestry; an agent-initiated nested session is a different session
with its own service, which is correct behavior rather than recursion. The three
layers are independent, individually justified, and — unusually for this
document — verified against the exact shipped command (D11 element 5, AC-11
targets the non-`--bare` invocation). The economic dimension of the model call
is a real gap and is filed as C3, not against this decision.

**S2 — D24, audit durability. SURVIVES with one correction.**
*Question:* "Logged-before-sent proves the *service* logged what it *returned*.
The shim may still fail to print it, and the delivery ack is fire-and-forget —
so the audit trail over-reports, and self-check #6 cannot distinguish a lost ack
from an undelivered whisper." *Answer:* FR-X6 requires that every whisper be
logged with its evidence; over-reporting is the safe direction for an oversight
control, and the collapse-log's own correction (an un-loggable whisper is not
sent) holds. *Correction:* mark audit records `delivery_confirmed` from the ack,
render unconfirmed records distinctly in `ctxoracle log`, and retry the ack once
— otherwise self-check #6 generates findings the owner cannot act on.

**S3 — D9 / FR-O4, the structural absence of a deny path. SURVIVES.**
*Question:* "'No deny field exists' is a check on the response type. RETHINK
§2.2's actual objection is that gates make every move conditional — and a shim
that spends its full 2,500 ms hard deadline on every event taxes the agent
without ever denying anything. Is field-absence the right check for 'never a
gate'?" *Answer:* no, and the document does not rely on it alone — NF-1's p95
budget, the deadline governor, the Lane-1-reads-only rule (D24) and D26's replay
measurement under load are the latency-side controls, and they are mechanically
asserted rather than asserted in prose. Both halves of "never a gate" are
covered.

**S4 — D19, the ingress choke-point. SURVIVES.**
*Question:* "A single module with enumerated call sites is only as good as the
enumeration; the last round found a missed boundary (`zone_evidence`). What
makes the *list* complete rather than the *module* correct?" *Answer:* D19
element 3 makes completeness a reviewable claim (grep the call sites), the build
order places the scanner before the first ingester (element 4), and AC-12 tests
the property end-to-end rather than the enumeration. That is the right shape:
the list can still be wrong, but being wrong is detectable by a mechanical
check. Note C2 and C5 each add an ingress (skill text; untrusted `claim_text`
into the prompt) that must join the enumeration.

---

## Pattern this session

The 2026-07-17 collapses were *reduction at the model's role*; the 2026-07-22
collapses were *the hard part relocated into an unspecified deterministic step*.
This round the shape has moved once more: **the hard part is now a named noun
with no producer, and every place it is claimed to be handled points at a
different place that also does not handle it.** `non-obvious` is a criterion in
the anchor document, a word in D20's prose, and a row in the traceability matrix
that resolves to a genre-level design intent plus a term (`materiality`) defined
to mean something else — and is a computation nowhere. `uptake` is a schema
column and a statistic with no detection rules, yet it drives automatic genre
retirement. The `intent queue` is two mentions in a component list, yet it
decides what the model may see. The cross-consumer budget is a default with no
allocator, yet it decides which agent gets helped. Skill expectations are "in
Tier 3," which is memory, yet a whisper must bind to a store fact to be
delivered at all. The tell is uniform and cheap to check: **a citation that
lands on a design intent, a schema column, or a component name rather than on a
per-candidate computation with named inputs is an unfilled requirement wearing a
reference.** For every principle and every column, ask *who writes this, in
which decision, from what inputs* — and treat "it's in the traceability matrix"
as the beginning of the check, not the end.

Two structural lessons follow. First, **everything the previous round touched
got a real mechanism; everything it did not touch stayed prose.** The round-1
fixes (decision-impact, negative-evidence facts, the audit spool, the A0
sub-turn) are all genuinely built. The collapses found this round are, without
exception, in criteria that were never contested — which means a hunt that
starts from the previous hunt's findings will find nothing, and a hunt that
starts from the *anchor documents' own enumerated criteria* (the corrected
foundation's five conditions; RETHINK §2.3's "only relevance metric that
matters"; the twelve genres) will find these in an hour. Start there.

Second, **this document's collapse tests are written per decision, and every
collapse above lives between decisions.** The conduct genres are designed in
D14 and gated in D12/D13; the budget is set in D10 and divided in D15; the
injection control is claimed in T1 and implemented in D12/D13 with contradictory
rules. A per-decision collapse test structurally cannot see any of these,
because each decision is locally coherent. The durable countermeasure: in
addition to the per-decision test, write **one collapse test per genre that
traverses the whole pipeline** — trigger → retrieval → grounding → bar → budget
→ assembly → delivery → audit → learning — and require each of the twelve
FR-A2 genres to survive it end to end. Three of the twelve (Process, Answer-
drift, Unknown before its round-1 fix) fail that traversal today, and all three
failed at the same joint.
