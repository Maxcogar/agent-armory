# Handling a Decomposition Defect from Design Review

## Short answer

Do **not** just hand-edit the architecture document. A "two card slices overlap / the decomposition is wrong" finding is a **structural defect**, not a wording defect. It means an upstream stage produced a bad result, so you have to go back to the stage that *owns decomposition*, fix the input that caused it, and re-run forward from there — then re-review. Patching the doc by hand papers over the defect and leaves every artifact derived from the bad decomposition (the cards) silently wrong.

The rest of this walks through *why*, *where to re-enter the pipeline*, and *exactly what to do*.

---

## 1. First, classify the finding correctly

Design-review findings fall into two very different buckets, and the correct handling depends entirely on which one you have:

| Class | Example | What it means | How to fix |
|---|---|---|---|
| **Cosmetic / local** | A heading is wrong, a sentence is ambiguous, a dependency note is missing, a diagram label is off | The decomposition is *sound*; the prose describing it is imperfect | Edit the architecture document in place, re-review the changed section |
| **Structural** | Two slices overlap, a slice spans two concerns, a boundary is in the wrong place, a slice has no clear owner of some behavior | The decomposition *itself* is wrong; the document is a faithful record of a bad decision | Re-run the decomposition; do **not** hand-patch |

"Two of the card slices overlap and the decomposition is wrong" is unambiguously **structural**. Overlap means the boundary between two slices was drawn in the wrong place: some behavior or responsibility is claimed by both. That is exactly the thing the compose stage is supposed to get right, so the compose stage is where the bug lives.

Why this distinction matters: a structural defect has *downstream blast radius*. The doc is not the only artifact — the pipeline produces **one card per Card Slice**. If two slices overlap, then the cards you'd create from them overlap too: two work items that both touch the same responsibility, leading to merge conflicts, double implementation, or a gap nobody owns. Editing only the document does not fix the cards, and it does not fix whatever made the composer draw the boundary wrong in the first place.

---

## 2. Why hand-editing the document is the wrong move

Three concrete reasons:

1. **It treats a symptom, not the cause.** The document is an *output* of the compose stage. If the slices overlap, the composer's boundary logic was wrong (or it was fed an ambiguous classification). Editing the rendered output leaves the faulty reasoning in place and unrecorded.

2. **It desynchronizes the artifacts.** A pipeline's value is that the document, the slice list, and the cards are all derived from one coherent decomposition. The moment you redraw slice boundaries by hand in the prose, the document says one thing and the (eventual) cards say another. The pipeline's internal consistency guarantee is broken, and nothing downstream knows it.

3. **Re-drawing a boundary by hand is genuinely hard and easy to get wrong.** Fixing an overlap isn't "delete a sentence." You have to decide where the responsibility *actually* belongs, move it cleanly to exactly one slice, check that you didn't open a *gap* (the opposite failure: behavior now owned by neither slice), and re-verify that every other slice's interfaces still line up. That is the compose stage's whole job. Doing it ad hoc in a text editor, under no checklist, is how you turn one overlap into a gap plus a new overlap.

So: the question "do I just edit the doc, or rerun something?" — the answer is **rerun**. The doc edit, if any, falls out of the rerun, not the other way around.

---

## 3. Where to re-enter the pipeline

The pipeline stages are: **research → classification audit → compose (L1/L2/L3) → design review.**

The right re-entry point is the **earliest stage whose output is implicated by the finding**, not necessarily the stage that raised it (design review) and not the very first stage (research). Walk it back:

- **Is the research wrong?** Only if the overlap exists because a whole domain area was misunderstood or missing context made the boundary unknowable. Usually not — overlap is a *boundary-drawing* error, not a *missing-facts* error. Don't blow away good research unless the finding actually points at a factual gap.

- **Is the classification wrong?** This is the **most likely real culprit.** Overlapping slices very often trace back to an ambiguous or incorrect classification: two responsibilities were classified as the same concern (so the composer reasonably bundled them and then re-split badly), or one responsibility was classified into two categories (so it landed in two slices). **Before re-composing, check the classification audit output for the two responsibilities that overlap.** If the classification is ambiguous, fix that first — re-composing on top of a bad classification will just reproduce the overlap.

- **Is it purely a compose error?** If classification is clean and unambiguous but the composer still drew the boundary wrong, re-enter at **compose** and re-run it.

**Decision rule:**
> Re-enter at **classification audit** if the overlap is rooted in how the two responsibilities were categorized. Re-enter at **compose** if classification is sound but the slicing is wrong. Re-enter at **research** only if the finding reveals the boundary was undrawable from the facts gathered.

For the case as described — "the decomposition is wrong" with no mention of missing facts — start by inspecting the classification audit, then re-run compose. Treat research as fixed unless you find a factual hole.

---

## 4. Re-run forward, don't re-run sideways

Whichever stage you re-enter, you must re-run **all stages after it**, in order, because each consumes the previous one's output:

- Re-run from **classification audit** → re-run audit, then compose, then design review.
- Re-run from **compose** → re-run compose, then design review.

The critical, non-negotiable part: **design review must run again on the new decomposition.** You do not get to fix the slices and declare victory. The whole reason you caught this was that design review is the gate. A correction that skips re-review is a correction you have not validated — and structural fixes are exactly the ones that introduce new structural problems (the overlap-becomes-a-gap failure mode). Re-running design review confirms (a) the original overlap is gone, and (b) you didn't create a new defect.

Also: **re-compose at the level the document was composed at** (L1/L2/L3). The level controls decomposition granularity. If you composed at L2, fix and re-run at L2 — don't quietly drop to L1 to make the overlap disappear, because that just hides the problem under coarser slices.

---

## 5. Feed the finding back in as input — don't make the composer rediscover the bug

When you re-run compose (or re-run the audit), pass the design-review finding *into* that stage as an explicit constraint. The composer should not be left to independently re-derive a clean boundary and hope it lands differently this time. Give it the specifics:

- which two slices overlap,
- what responsibility/behavior is double-claimed,
- and the reviewer's reasoning for why it's wrong.

That turns a blind re-run (which may reproduce the same boundary) into a *directed* correction. The composer now knows it must place the contested responsibility in exactly one slice and justify the choice.

---

## 6. Only create cards after the loop closes

The pipeline commits the architecture document and creates **one card per Card Slice**. Sequencing matters:

- **If cards have not been created yet:** good — that's the normal case for a finding raised at the design-review stage. Just complete the correction loop (re-classify if needed → re-compose → re-review → pass) *before* the document is committed and cards are generated. The bad decomposition never reaches the board.

- **If cards were already created** (e.g., this overlap was caught late, after cards existed): the corrected decomposition changes the slice set, so the cards are now stale. You must **reconcile the board**: remove/merge the cards for the two overlapping slices and create cards for the corrected slices. Do not leave the old overlapping cards sitting on the board next to the new ones — that re-introduces the exact double-ownership the fix was meant to eliminate. Cards are derived artifacts; they follow the decomposition, never lead it.

---

## 7. Record the correction

Capture, in the architecture document's decision/change record (or the equivalent rationale section):

- the design-review finding (the overlap and why it was wrong),
- the root cause (ambiguous classification vs. compose-stage slicing error),
- where you re-entered the pipeline and why,
- and the new boundary decision — which slice now owns the contested responsibility and why.

This matters because the *why* of a boundary is the part nobody can recover later by reading the slices. A future reader (or a re-run) needs to know this overlap was already adjudicated, or it risks being "fixed" back to the broken state.

---

## Walkthrough summary

1. **Classify the finding.** Overlapping slices = structural decomposition defect, not a prose defect. Hand-editing the document is the wrong tool.
2. **Find the root cause.** Inspect the classification audit for the two overlapping responsibilities. Overlap usually traces to ambiguous classification; if not, it's a compose-stage slicing error.
3. **Re-enter at the earliest implicated stage** — classification audit if the categories are the cause, otherwise compose. Leave research alone unless facts are actually missing.
4. **Feed the reviewer's finding in as an explicit constraint** so the re-run is directed, not a blind retry.
5. **Re-run forward through every later stage**, re-composing at the same level (L1/L2/L3).
6. **Re-run design review** on the new decomposition — confirm the overlap is gone and no gap was introduced. Do not skip this gate.
7. **Only then** commit the document and create one card per (corrected) slice. If cards already existed, reconcile the board to match the new slices.
8. **Record the finding, root cause, re-entry point, and new boundary decision** in the document's rationale.

Bottom line: this is a **rerun**, not an edit. The document edit is a *consequence* of re-running the stage that owns decomposition and passing design review again — never a substitute for it.
