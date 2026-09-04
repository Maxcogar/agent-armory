# Collapse hunt — the AD-9 answer-drift rework (2026-09-04)

*Independent collapse-tester. I did not write the work under review. This is a
hollowness hunt (`CLAUDE.md` dominating rule 2), not an expert review: for each
load-bearing decision in the reworked `AD-9` I take its stated collapse-test
answer and attack it as a mission-literate skeptic, checking that each cited
spec line actually says what the answer claims, in context. The phase goal
governs (rule 3): an honest deterministic foundation that **measures its own
floor** with clean seams, never fake completeness — and Phase A is the build's
test bed whose data Phase B is designed from.*

---

## Verdict

**DOES NOT SURVIVE — 1 collapse / 3 partial / 3 notes.**

The **taxonomy drop itself is sound** and is a genuine honesty gain, not a new
flavor of slop — that core decision survives its hardest question cleanly. But
the decision *underneath* it — **to wire the recognizer to live `PreToolUse`
denies at all**, rather than run it in the discovery-mode replay the spec itself
names — is defended by a premise the project's **own `docs/IDEAS.md` #14
refutes**, and its real warrant is stated nowhere. Because that unexamined
choice is what imposes the over-fire cost on Max Cogar's real sessions, three
further load-bearing pieces (the "rarely denies a compliant agent" concession,
the rhetorical stoplist, the clear-all-prior recognizer) inherit a tension the
rework tolerates rather than resolves. None of this is the *old* slop — the
rework is loud and honest about its costs — but "honest about a cost" is not the
same as "the cost is warranted," and the warrant is where this collapses.

The empty-round warning applies in reverse here: the rework earns real credit
for killing the classifier, and a hunt that only rubber-stamped that would have
missed that the *enforce-or-measure* decision beneath it was never actually made.

---

## C1 — COLLAPSE — Live enforcement vs. discovery-mode replay (the decision beneath the rework)

**Job (mission sentence).** Choose the honest minimum that measures the model-free
block's floor on Max Cogar's real repos, so Phase B is designed from real
discovery data — spending no more of Max's live sessions than the measurement
requires.

**Hardest question.** `§11.5`'s floor is measured by **discovery-mode replay**
(`§11.5` line 755, `IDEAS.md` #14): the recognizer's boundary behaviour against
real phrasings is, in #14's own words, replay's *"highest-value use,"* and replay
needs **no live denies**. Every Phase-A plumbing acceptance criterion (AC-2a,
AC-2a-i, AC-2c, AC-8a, AC-12) is **fixture-state-controlled**, not live. So why
wire the recognizer to live `PreToolUse` denies that fall on Max's real
fix-edits at all — rather than run the identical recognizer logic in
replay/discovery mode (the strong "no live recognizer" pole) and reserve live
denials for the small number of closed-loop sessions #14 says outcome data
actually needs?

**Attack.** The doc rejects the "no recognizer" pole in Chain 2 step 1
(architecture lines 1852–1857): *"§11.5's Phase A exit requires the block to run
on the owner's real repos and measure how little it catches — so some recognizer
must fire on real transcripts. This rules out (B) no recognizer at all
(plumbing-only, fixture-tested state): nothing would fire on a real repo, so
there is no floor to measure."*

That premise is **false, and refuted by the project's own governing idea-ledger.**
`IDEAS.md` #14 (lines 110–116) lists *"classifier/recognizer boundary behaviour
against real phrasings"* as the thing replay measures **best** — *"Highest-value
use."* Replay runs the recognizer logic over recorded real transcripts and counts
what it would open and what it would deny; the catch-vs-over-fire split is then
labelled offline (by Max or a Phase-B model reviewing the recording). **No live
deny is required to measure the recognizer's floor.** Chain 2 step 1 conflates
"no *live-enforcing* recognizer" with "no recognizer logic to evaluate at all,"
and only rejects the second — a strawman. The strong pole (recognizer logic run
in `IDEAS.md` #14 discovery mode, not wired to live denials) is never considered,
yet it satisfies the exit *measurement* and every fixture AC **without denying a
single one of Max's real fix-edits.**

The **real** warrant for live enforcement exists — but the doc never states it.
`IDEAS.md` #14 lines 130–142 name the *off-policy limit*: replay **cannot** measure
*"the value of the two blocks"* or the agent's reaction to a deny, because *"a
block … would rewrite the trajectory, so the replayed remainder is fiction from
the block onward."* Measuring whether the agent answers, retries, or bypasses a
**real** deny is the one thing replay structurally cannot do — and it is exactly
what AD-9's own `deny_bypass_suspect` / `deny_loop` / FR-M4 detectors are built to
observe. So the correct justification for live enforcement is sitting inside
AD-9's own machinery, and the doc justifies the choice by the *wrong* (refuted)
reason instead. This is the collapse: the load-bearing decision's stated citation
does not survive contact with a project document, and no valid citation is offered
in its place.

Worse for the *magnitude* of enforcement: #14 line 141 says outcome/reaction data
needs *"a small number of real closed-loop sessions; replay is a pre-filter, not
a substitute."* A **small number** of closed-loop sessions — not always-on
enforcement on every session Max runs — is the minimum that buys the off-policy
data. Always-on live denial therefore exceeds even the correct warrant, and the
excess is precisely the wrongful-deny cost C2 is about.

**Citation check.** Chain 2 step 1 cites `§11.5`'s exit ("measure how little it
catches"). The exit line (`§11.5` lines 751–753) says *"producing measured
whisper/block + false-fire and regret data on a real repo — including how little
the conservative recognizer catches"* — a **measurement** requirement, which #14
shows is replay-satisfiable for the recognizer-firing axis. The line does not say
"the block must fire live." The citation is real but does not say what Chain 2
uses it to say.

**Verdict: COLLAPSES** (justification, repairable). The taxonomy drop is right;
the *enforce-vs-measure* decision under it was never actually made on the merits.
**Fix:** (1) delete the false "nothing would fire / no floor to measure" premise;
(2) add the strong pole (recognizer in `IDEAS.md` #14 discovery/replay mode, no
live denials) to the alternatives; (3) if live enforcement is kept, justify it by
the **off-policy limit** (#14 lines 130–142) — the block-value / reaction-to-deny
data replay cannot produce — and weigh that specific benefit against C2's
wrongful-deny cost; (4) reconsider **always-on** live denial against #14's *"small
number of real closed-loop sessions,"* since a bounded closed-loop mode may buy
the same data at a fraction of the cost.

---

## C2 — PARTIAL — The over-fire concedes `§11.5`'s "rarely denies a compliant agent," on a stretched citation

**Job.** Deny only moves the spec's Phase-A recognizer is meant to deny, so a
compliant agent is (in `§11.5`'s words) "rarely denied."

**Hardest question.** Max Cogar's most common ask shape is an action request
("can you fix X?") — it ends in `?`, so the opener arms a deny, and the skeleton
then denies the fix-edit that *is* the compliant fulfilment. `§11.5` line 748
says the Phase-A recognizer *"errs hard toward not-firing — safe (it rarely denies
a compliant agent)"* and line 745 says it *"fires only on a move clearly not
directed at answering."* `FR-B5` (spec line 438) says the recognizer *"errs toward
not denying (… a move that plausibly is answer-directed, is not denied)."* A
fulfilment edit plausibly **is** answer-directed. How is denying it — on the
single most common request shape — compatible with three spec lines that say
don't?

**Attack.** The rework's answer (AD-9 lines 768–781) is that the classifier's
request-exemption was *fake* precision a model-free parse cannot deliver, so the
residual over-fire is `FR-B5`'s *"trivially escaped"* wrongful deny, one-turn
escapable and measured. Two problems.

First, the answer **concedes the clause rather than satisfying it.** It does not
argue the skeleton "rarely denies a compliant agent"; it argues the *old* safety
was fake and measured-floor honesty is the real goal. That is a coherent trade,
but it means `§11.5`'s "rarely denies a compliant agent" and "fires only on a move
clearly not directed at answering," and `FR-B5`'s "a move that plausibly is
answer-directed is not denied," are all **left unsatisfied** — a fulfilment edit
is not "clearly not directed at answering," yet it is denied. The doc's own
hardest-question text (line 1868) admits this is the "can you fix X?" case
"violating 'rarely denies a compliant agent'."

Second, the `FR-B5` "trivially escaped" citation is **stretched.** In context
(spec lines 438–441) that clause tolerates the recognizer *occasionally erring*
while it "errs toward not denying." It does not authorize a recognizer that
**systematically** denies an entire class of plausibly-answer-directed moves as
its core predicate. AD-9 denies *every* repo mutation while any question is open
(lines 858–868) — not an occasional error but the design. "Trivially escaped"
was written for the former and is being used to license the latter.

The over-fire is also **not rare in the regime the block is for.** The skeleton's
"rarely fires" holds only because the *opener* is conservative (few questions). But
the block exists precisely because Max asks questions frequently (OL-C3). When a
question is open (common) and the agent edits to fulfil it (common), it denies. So
"rarely denies a compliant agent" holds only if questions are rare — which they are
not.

**What saves it from a full collapse.** A genuine trilemma is at work: model-free,
you cannot simultaneously (a) not fake, (b) catch/measure something, and (c) rarely
deny a compliant agent — pick two. `§11.5` makes (a) the whole point of the rework
and (b) the exit gate, so conceding (c) is the spec-prioritised corner, and it is
the only corner with a mitigation (one-turn escape). The over-fire is disclosed
loudly (AD-9 lines 893–908, L1 lines 2107–2130) — the opposite of the hidden 2026-09-04
slop. So the *decision* is defensible; the *argument* has a real gap.

**Verdict: PARTIAL.** **Fix:** (1) state plainly that Phase A **concedes** `§11.5`'s
"rarely denies a compliant agent" as the forced corner of the model-free trilemma,
rather than pivoting to "the old safety was fake"; (2) stop citing `FR-B5`'s
"trivially escaped" as authority for *systematic* denial — it authorizes occasional
error only; (3) surface the concession to Max Cogar for acknowledgment. This is
not a settled derivation: OL-C3's own words are *"just dont make a convoluted
fucked up way that its done"* — "your fix-edit is denied until you narrate first"
is exactly the sensibility that may read as convoluted to him, and STATUS only
blessed the *principle* (honest skeleton), not this specific consequence on the
common case. (Note this depends on C1: the cost is only worth paying if live
enforcement is warranted at all.)

---

## C3 — PARTIAL — The rhetorical stoplist pre-seeds the exact "imagined-phrasing" pattern `§11.5` forbids

**Job.** Keep genuine rhetorical/idiom `?`-sentences from arming a deny, with the
smallest honest mechanism.

**Hardest question.** The opener suppresses any `?`-sentence matched by a *"small
rhetorical/idiom stoplist"* (AD-9 line 807; L1 lines 2123–2125), *"shrunk by tending
it."* That list is populated by the architect **imagining** which `?`-sentences are
rhetorical ("ugh, why is CI always so flaky??") **before any real-repo
measurement.** How is a hand-seeded imagined-phrasing list not a miniature of the
very thing `§11.5` names as the disease — *"never by reviewing an imagined-phrasing
classifier into apparent completeness"* — and the accreting "N member shapes" list
the collapse-log (2026-09-04) identified as the symptom?

**Attack.** Three ways the stoplist shares the abandoned classifier's species:
1. **Same measurement-corruption direction.** Suppressing rhetorical `?`s from
   opening means those cases never arm a deny, so they never appear in the
   over-fire count — the stoplist makes the false-fire rate look **lower than the
   pure-`?` baseline**, exactly as the classifier made the wrongful-deny rate look
   lower than the real mechanism's (AD-9 line 771). Phase A's job is to *measure*
   that rate honestly; a pre-seeded suppressor shapes the number it is supposed to
   report.
2. **It is an accreting enumeration**, "shrunk by tending it" (L1 line 2124) — you
   add entries as you find rhetorical phrasings. Yet L1 (lines 2114–2116) insists the
   over-fire residual is *"one class, not an enumeration — a new phrasing is the
   same class, never a new member."* The doc claims non-enumeration for the
   residual while relying on an enumeration (the stoplist) to mitigate it.
3. **It is not monotone-safe.** A too-broad entry ("why") suppresses a *genuine*
   question ("why is the test failing?") — Max's question dying silently, `FR-B5`'s
   named worst case. So growing the stoplist to cut over-fire risks the exact harm
   the block exists to prevent.

**Steelman.** The stoplist has one output (suppress / not), not the classifier's
info/request/artifact taxonomy driving deny behaviour; it acts only on the opener,
in the safe (not-arming) direction; it is tunable and owned fallible (L1). It is a
lesser thing than the abandoned lexicons. Granted — but the *principle* the rework
stands on (don't pre-seed imagined phrasings before the measurement grounds them)
cuts against seeding it at all.

**Verdict: PARTIAL.** **Fix:** ship the opener with an **empty** stoplist, open on
every `?`, and make the stoplist a Phase-A **output** (populate it only from
measured over-fires on real transcripts) rather than a hand-imagined input — which
is precisely `§11.5`'s "gotten right by running it on real transcripts." That also
removes the C3-point-1 measurement bias: the pure-`?` opener reports the true
rhetorical-over-fire rate the stoplist would otherwise hide.

---

## C4 — PARTIAL — Clear-all-prior clears on non-answer narration, so the block is largely inert (and the exit measurement is confounded)

**Job.** Mark a question answered when — and only when — the agent has actually
answered it.

**Hardest question.** The clear recognizer marks **all** open questions answered on
*any* substantive assistant text turn that is not a content-free deferral (AD-9
lines 881–891). But "substantive text" includes pure **planning narration** about
*other* work: Max asks "why is X broken?", the agent says "I'll refactor the parser,
add tests, and update the docs" — substantive, not a deferral — and the question
**clears**, though nothing about "why is X broken?" was answered. Per OL-C5 that
agent has drifted (its move is neither a direct answer nor an action to provide
one) and **should** be corrected — yet the block just released. How is a block that
clears on non-answers doing the OL-C3 job at all?

**Attack.** The consequence is that the block **holds only** in the narrow window
where an open question coexists with a repo mutation and **no** intervening
substantive text. Modern coding agents narrate constantly, so in the common flow
the block **clears on narration and does nothing** — occasionally over-firing (the
silent-edit case, C2) and occasionally catching (the silent drift-edit case). L2
(lines 2131–2135) discloses only the *multi-question* limitation ("two questions,
one answer clears both"); it does **not** disclose the sharper fact that a single
question clears on text that answers *nothing*, letting a narrating drifter escape
entirely.

This also **confounds the exit measurement** C1 and the phase goal turn on:
narration-clearing depresses **both** the catch rate **and** the over-fire rate
(a narrated fix-edit is allowed, so it is neither a catch nor a counted over-fire).
Phase B is designed from a "floor" that is artificially low on both axes for a
reason (narration) that has nothing to do with the recognizer's real
discriminating power. A number read as "how little the recognizer catches" that is
actually "how often the agent happened to narrate first" is a misleading design
input.

**Steelman.** Clearing-on-substance is `FR-B5`'s sanctioned safe direction ("errs
toward clearing … only an empty deferral fails to clear," spec line 439), and
"is this text an answer or mere narration?" is the comprehension judgment D-41
defers to Phase B (AC-2a-ii). So the *lean* is spec-correct. The gap is disclosure
and measurement-validity, not the lean.

**Verdict: PARTIAL.** **Fix:** state in L2 (and in `status`'s methodology note)
that clear-all-prior clears on **non-answer narration**, so the Phase-A block is
largely inert whenever the agent narrates, and that the exit false-fire/catch
numbers are **confounded by narration-clearing** — so Phase B reads them as a lower
bound shaped by agent verbosity, not as the recognizer's discriminating floor.

---

## Notes

**N1 — "Measure the floor" is real for firing, a slogan for *block value*; scope
the claim.** `IDEAS.md` #14 (lines 130–138) is explicit that replay — and by
extension any Phase-A run of a block that "rewrites the trajectory" — **cannot**
measure *"the value of the two blocks."* The recognizer-firing / false-fire floor
is genuinely measurable (#14 "highest-value use"); whether the block *helps* is
off-policy and, per #14, needs real closed-loop sessions and even then "replay is
a pre-filter, not a substitute." `§11.5`'s exit phrase *"measured … block …
data"* (line 751) conflates the two. The architecture should scope it: Phase A
measures the recognizer's **firing distribution and wrongful-deny rate**, not the
block's **value** — the latter is a Phase-B/closed-loop quantity. Otherwise "measure
the floor" over-promises exactly where OL-C3's interest (does blocking work?) lives.

**N2 — Two accreting enumerations sit beside a "not an enumeration" claim.** The
rhetorical stoplist (C3) and `deny_bypass_suspect`'s shell-write-idiom list
(*"redirection, tee, in-place edit, copy/move,"* AD-9 lines 972–976) are both
hand-enumerated lists that grow by accretion — the same shape the collapse-log
(2026-09-04) flagged as the classifier's symptom. L1 (lines 2114–2116) asserts the
over-fire residual is "one class, not an enumeration." The claim is true of the
*residual class* but the two *mitigations* are enumerations, and the doc should own
that symmetry rather than let "not an enumeration" imply the mechanism is free of
accreting lists. (`deny_bypass_suspect` otherwise **earns its place** — see N3.)

**N3 — `deny_bypass_suspect` is not retained bloat; it is the (unstated) evidence
for C1's real warrant.** The mandate flagged it as possible retained machinery once
the taxonomy is gone. It is the opposite: measuring whether a denied `Edit` is
retried as a file-writing `Bash` command (AD-9 lines 969–985) is precisely the
**agent-reaction-to-a-live-deny** signal that `IDEAS.md` #14 says replay
structurally cannot produce — i.e., the one measurement that would actually justify
live enforcement (C1). Its path-matching narrowing is justified (a coarser
"any deny then any Bash write" correlation would be pure noise, since agents write
files via Bash constantly). It earns its place — but the doc never connects it to
the warrant it serves, which is the C1 fix. The other retained detectors
(`deny_after_answer_lag`, `deny_despite_answer_text`, the FR-M4 done-claim counter)
each guard a real error direction of the skeleton and are mandated by OL-10
self-observability; they survive.

**N4 — The intake / catch-up / voiding subsystem survives, with one honest tension
noted.** The transcript reader is required for the clear axis regardless (answers
arrive in the transcript), so opening-on-catch-up adds only resume-recovery, whose
marginal cost is reconciliation (content-hash + adjacency + backfill, AD-9 lines
839–850) — modest, and it serves AC-5 session boundaries. The intake-row voiding
guard defends an **unverified** contract behaviour (whether platform-injected turns
fire `UserPromptSubmit`, L11) but is cheap (a marker check) and honestly bounded (a
marker-*absent* synthetic turn evades it, owned in L11). Not hollow. One tension
worth a line: recovering pre-resume questions via catch-up is *precision* recovery,
whereas losing them would be the safe under-fire direction the skeleton elsewhere
embraces — a small inconsistency in how aggressively the design pursues coverage,
harmless because the reader exists anyway.

---

## What genuinely survives (defended, not rubber-stamped)

- **The taxonomy drop.** Removing the info/request classifier, the
  communicative/information/artifact lexicons, the base-noun-phrase head
  extraction, and the wh-complement/coordinated-ask machinery is correctly
  grounded in `§11.5`'s honesty mandate (lines 757–762, quoted verbatim and
  accurately in AD-9) and is a real improvement: a model-free parse cannot
  deliver the request-exemption the classifier asserted, and asserting it
  corrupted the very false-fire measurement Phase B reads. This is the honest
  move, and the collapse-test block's *diagnosis* of the old slop is correct.
  The problem is not that the rework dropped too much — it is that it did not
  examine whether the *replacement* (live-enforcing `?`+mutation) needed to be
  live at all (C1).
- **AD-10 deny confinement.** One `blocks/verdict.ts` producer, one Phase-A
  caller, structural test by import graph + built-output grep, `updatedInput`
  unrepresentable. This is the correct realisation of `FR-B3`/AC-2's "exactly two
  blocks" absolute and inherits the 2026-08-25 lesson properly. Untouched by the
  AD-9 rework and sound.
- **The Phase B seam** (`qa/state.ts` read-only deny path; `classify.ts`
  recognizer swap). The claim that Phase B replaces the *writer* while the deny
  path keeps reading the same tables (AD-9 lines 1005–1017) is consistent with
  `§11.5`'s "model updates cached state between actions; the deny stays
  synchronous." The seam is real and is the part of the pre-rework design worth
  keeping.

---

## For the caller — the one thing to act on first

C1 is the load-bearing collapse and the other three partials hang off it. The
decision to wire the recognizer to **live denials** — the thing that puts a wrongful
deny on Max Cogar's real fix-edits — was justified by a premise `IDEAS.md` #14
refutes, and its real warrant (the off-policy block-value / reaction-to-deny data,
which `deny_bypass_suspect` already targets) is stated nowhere. Resolve C1 first —
decide *on the merits*, with #14's off-policy limit cited, whether Phase A enforces
live at all, and if so whether always-on or a bounded closed-loop is the minimum —
and C2/C3/C4 either dissolve (if the recognizer runs in replay/discovery mode, it
denies nothing live) or reduce to disclosure fixes (if live enforcement is kept and
its cost is now explicitly warranted).
