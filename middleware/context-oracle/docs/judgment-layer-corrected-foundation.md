# Judgment layer — corrected foundation

**Purpose of this note.** The architecture's first draft got the *core* of the
tool wrong — the judgment layer (D10/D12/D13). This note fixes the foundation,
grounded in the spec that is already approved, so the rebuild of those
decisions has a correct anchor instead of another invented theory. Every claim
here cites the spec line it comes from; nothing is re-derived from scratch.

## What was wrong

The draft reduced the judgment to **"generate candidate facts → the model
selects one → verify the fact exists in the store → send it."** Two failures:

1. **Existence is the wrong test.** Checking that a co-change edge exists in
   the store answers *"did the oracle hallucinate this?"* — a check on the
   oracle's own honesty. It does **not** answer *"is this worth putting in
   front of the agent?"* A true-but-irrelevant whisper is worse than silence.
2. **It collapsed a multi-purpose tool into one narrow function.** The draft
   swung between "the model only selects" and "the model only guides, never
   corrects." Both are wrong. The tool guides *and* corrects *and* orients
   *and* warns *and* answers — that breadth is in the spec (FR-A2, twelve
   genres) and is not negotiable.

## The anchor — it was already in the spec

**FR-A1** (spec §7.3): *"Per event the oracle answers internally: given what
the agent is doing right now, do I know something it almost certainly doesn't
that would change what it does next? Default answer: no → silence (P1)."*

That single question **is** the judgment layer. Everything below is how it is
computed and delivered — not a redefinition of it.

### Why FR-A1 holds the full breadth (it does not collapse the tool)

"Something it almost certainly doesn't know that would change what it does
next" takes different shapes — and the shapes are exactly the twelve genres of
FR-A2:

| The material fact… | …shows up as genre |
|---|---|
| **adds** context the agent lacks | Orientation, Coupling, Exemplar-reuse, Verification |
| **conflicts** with what the agent just said/assumed | Assumption-check, Steering, Process, Answer-drift |
| **flags a consequence** of what the agent is about to do | Warning, Completeness |
| **answers** something the agent asked | Answer, Unknown |

Guiding and correcting are **the same judgment**, differing only in whether the
material fact *adds to* or *contradicts* the agent's current picture. The tool
is not "a guide" or "a corrector"; it delivers the material unknown fact,
whatever shape it takes. This is the breadth the owner has repeatedly insisted
on, and FR-A1 already carries it.

### Why it needs no prediction (answers the "not buildable" concern)

FR-A1 asks whether a fact is **material and unknown to the agent right now** —
not whether the agent *will* make a mistake. The correcting genres observe a
**present conflict** between a stated assumption and recorded evidence
(assumption-check: *"narration assumes X; evidence says Y at file:line"*,
FR-A2) — they do not forecast the agent's future error. This is precisely why
the tool is **a guide that can correct, in the moment**, and not a safety net
predicting derailment. Correction-by-foresight would require knowing the
agent's plan and the right answer; the oracle has neither, and does not need
them, because FR-A1 only asks about the materiality of a fact it already holds.

## What "worth sending" actually means (replacing the existence check)

A candidate earns delivery only when all of these hold — grounded in the spec,
not invented:

1. **Material to the current decision** (P5 marginal value; FR-A1): it bears on
   what the agent is doing now, established from the agent's intent (its
   narration and the event), not from mere topical proximity to a file.
2. **Non-obvious**: something a cold checkout can't reveal and the agent can't
   trivially self-serve (P5), and that it hasn't already seen or acted on
   (FR-A4 dedup).
3. **Evidence clears the floor** (FR-A5): history-backed claims meet the ROSE
   operating point (warn-grade: support ≥ 3, confidence ≥ 0.9; suggestion-grade
   looser but never below pruned-heuristic levels) — because raw co-change
   association is ~6% precise. "It exists" is not "it is strong enough."
4. **Confidence × decision-impact clears the bar** (FR-A5): impact is how much
   the fact bears on *this* decision (genre-weighted, edit-vs-read, blast
   radius, zone criticality), not a fixed constant. This is the piece the draft
   left undefined; it is the actual heart of "when to speak."
5. **Stated with its real uncertainty and a verifiable pointer** (FR-D5, P4):
   "16 of its last 20 commits," never "you must"; every claim carries provenance
   the agent can check.

**Provenance/existence is the floor beneath this, not the criterion.** It
exists to stop the oracle fabricating (P4) — it is item 5's pointer, the last
and smallest gate, never the reason to send.

## The model's real role (replacing "select + check existence")

- The model **reads the agent's intent** and **judges materiality** — it *is*
  the thing that answers FR-A1's question, which is a language-understanding
  task, not a lookup.
- The model **composes** the whisper, grounded in store facts — so the
  open-ended genres (Answer, Assumption-check, Steering) actually work. A
  select-from-a-list design cannot answer a question or articulate a specific
  contradiction; the owner is right that it would be unusable.
- Deterministic code then **gates the output**: every factual claim must
  resolve to store provenance or the whisper is dropped (P4, anti-fabrication),
  and the output is validated to informative, non-imperative form with repo-
  derived text only as delimited data (FR-J5, FR-X2 — the injection defense
  moves to input-delimiting + output-validation, not to forbidding the model to
  write).

So the model **composes and judges** (that is where the intelligence and the
usefulness are); deterministic code **verifies and bounds** (that is where the
safety is). Neither "select-only" nor "unbounded generation" — grounded
generation.

## Why the tool is buildable

- The judgment is the spec's own FR-A1, not a research problem to invent.
- The substrate is verified to exist: git co-change mining (FR-K2, grounded in
  ROSE-05), the hooks observation/injection channel (verified 2026-07-17), and
  model access via host piggyback (Spike 1: PASS).
- Judgment **quality** does not need to be perfect at launch, because the tool
  is designed to converge it: the learning loop measures uptake, regret, and
  false-fires and tunes or suppresses per genre (P7; FR-L1–L3; the §9.2
  enforcement ladder). "We can't get the judgment perfect up front" is a
  designed-for condition, not a blocker.

## What this drives

This foundation is the anchor for rebuilding architecture decisions **D10**
(judgment pipeline — keep the async/two-lane latency mechanics, which are
grounded in the measured ~5.3 s model-spawn cost; replace the judgment
*criterion* with FR-A1 as above), **D12** (model role — grounded generation,
not select-only), and **D13** (delivery — provenance-gated, uncertainty-framed,
spanning all genres). It also resolves the independent review's findings F4
(degraded/consequence), F8 (drafting), F10 (impact undefined), and F11
(narration candidate generation) — all four dissolve once the judgment is
FR-A1 with grounded generation rather than select-plus-existence.
