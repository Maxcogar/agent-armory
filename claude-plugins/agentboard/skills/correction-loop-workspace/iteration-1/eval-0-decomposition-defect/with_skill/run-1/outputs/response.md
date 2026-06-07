# How to handle this correction: design reviewer flagged overlapping card slices / wrong decomposition

Short answer: **No, you do not just edit the architecture document by hand, and you do not blindly rerun a stage either.** This is a *substantive* correction, so it goes through the correction loop. You source-trace it to its real origin, carry it as a declared input into a correction-mode re-run of the right stage, and only widen the search or involve the owner if the evidence points there. Here is the full walk-through.

## First: confirm this is a correction-loop case, not a plain edit

Overlapping card slices and a wrong decomposition are exactly the kind of work the loop exists for. A "different decomposition" and "an added or removed Card Slice" are explicitly called out as **substantive rework**. So this is *not* a one-line reword or a missed traceability row that you fix in place — it routes through this loop. Don't open the architecture document and start hand-editing slice boundaries to make the finding go away; that's the silent-edit anti-pattern the loop is built to prevent.

## Step 1 — Source-trace to the real origin (do this before touching anything)

The correction arrived from **direction 1: a validating stage caught a defect** — the design reviewer, which stands to the architecture document the way review stands to a plan. Note that, but do not stop there. The critical rule here is **judge in the moment; do not pattern-match** "decomposition problem → recompose stage." That shortcut is precisely what sends fixes to the wrong place.

So ask, from the evidence actually in front of you, *where did the overlap really come from?* For two slices overlapping there are genuinely different possible origins:

- **The architecture document itself** — the upstream facts are sound, but the compose stage drew the slice boundaries wrong, double-covered a responsibility, or reasoned the decomposition incorrectly. This is the most likely origin for a "two slices overlap" finding, because slicing is the compose stage's job and the defect is in *how the work was carved up*, not in the facts it was carved from.
- **The upstream facts** — the research/audit produced a component map or dependency picture that was itself muddled or double-counted, so any decomposition built on it would overlap. If the reviewer's finding shows the overlap is forced by bad inputs (the facts themselves don't cleanly separate the two concerns), the origin is upstream, not the compose stage.
- **The spec** — the spec defines the two concerns so vaguely, or so entangled, that no clean decomposition is possible. If you cannot draw a non-overlapping boundary because the spec never actually separated these two things, the origin is the spec.

Use the finding text, the current pipeline state, and the chosen level (L1/L2/L3) to decide which of these it is. For a typical "the decomposition is wrong, slices overlap" finding where the underlying facts still hold, the trace lands on **the architecture document**.

## Step 2 — Carry the correction as a declared, auditable input

Whichever origin you land on, hand the correction to the receiving stage as a **dedicated, explicit, declared input** — not as extra prose stuffed into a prompt, and never as a quiet edit to the document or the spec. The record must capture:

- **round** — which attempt this is on this target (start at round 1 here),
- **origin** — `validating-stage` (the design reviewer raised it),
- **target** — the stage you're routing to (the compose stage, if the trace landed on the architecture document),
- **change** — "two card slices overlap; redraw the decomposition so the boundary between them is clean and each responsibility lives in exactly one slice," carrying the specifics the reviewer gave,
- **provenance** — the design-review **finding id** that justifies it.

The exact field shape is defined where the consuming stage declares the input; what matters is that it is declared and carries those five things so the correction is reviewable later.

## Step 3 — Route to the origin you traced

- If the trace landed on **the architecture document** (most likely here): re-enter the **compose stage in correction mode** (Step 4 below). Do *not* go back to research/audit — the facts still hold; only the slicing reasoning was wrong.
- If the trace landed on **the upstream facts**: re-run the **upstream research/audit stage** for fresh facts first, then compose again on top of corrected facts.
- If the trace landed on **the spec**: this is the one case that leaves the in-flow architecture path. The spec may be changed, but **never in-flow** and **never through `/foundation`** (which only creates specs) — it routes out to the external spec-modification path, and it brings in the owner (Step 7).

The non-negotiable thread: the architecture correction flow **never edits the spec to make an architecture problem disappear**. An overlapping-slice defect that is genuinely an architecture-reasoning problem must be fixed in the architecture, not papered over by quietly rewriting the spec.

## Step 4 — Work in correction mode, not from scratch

Assuming the compose stage is the target, it runs its **correction-mode** process, which is deliberately different from generating an architecture from scratch. In correction mode the stage:

- treats your declared correction (the overlapping-slices finding) as the **authoritative statement of what must change**,
- reads the **prior architecture output** rather than starting blank,
- **re-derives only what the correction touches** — the two overlapping slices and the boundary between them — and keeps the rest of the decomposition where it's still correct,
- **re-validates the whole result**, not just the two slices it redrew (redrawing a boundary can ripple into adjacent slices and traceability),
- and **stops to report rather than guessing** if the finding is underspecified — e.g. if it's not clear which responsibility should land in which slice, it surfaces that instead of inventing an answer.

The stage's normal from-scratch inputs do not carry the correction and are not a substitute for the declared input from Step 2.

## Step 5 — If it keeps failing, the cap is a signal, not a wall

The loop allows **at most three attempts on the same target**. If you recompose the decomposition and the design reviewer keeps flagging overlap across three honest attempts, **do not grind a fourth time and do not dump it on the owner**. Reaching the cap is *information*: it means the cause probably isn't in the target you've been hammering (the compose stage). The likely real story is that the overlap is forced from **upstream** — muddled facts — or from the **spec** entangling the two concerns. So the search **widens and traces outward**, decided in the moment, and the agents do that tracing themselves.

## Step 6 — At the cap, hand off to the investigator

When the three-attempt cap is hit, the loop **automatically hands off to the external investigator** for root-cause analysis. Root-cause work is a deliberately separate job from review (so the reviewer's corrections don't sprawl past the stage it was reviewing). Note this investigator is a separate surface and **may not exist yet** — the skill defines the handoff and its trigger condition, not the investigator's internals. If it isn't available in your run, the operative point still holds: at the cap, stop hammering the compose stage and trace outward to find where the overlap is really coming from.

## Step 7 — Bring in the owner only if the trace lands on the spec

Escalate to the **owner only when the trace (or the investigation) concludes the origin is the spec** — i.e. the two concerns are entangled or underdefined in the spec such that no clean decomposition exists. That's the one thing agents can't authoritatively settle, because the spec is the owner's. **Every other origin — architecture reasoning, upstream facts, process — the agents resolve at the source themselves**, without escalating.

## On the pause

If your run was started with the optional `/architecture`-layer pause turned **on** (it's **off by default**), you'll get the chance to look at the routed correction before it's applied — that's an owner convenience, not a gate the loop requires. If the pause is off, the loop proceeds without making you babysit it. Either way, this is separate from the AgentBoard blocking-gate feature and doesn't depend on any board setting.

---

## TL;DR for your specific case

1. This is a **substantive correction** → goes through the loop, not a manual document edit.
2. **Source-trace** the overlap: most likely the **architecture document** (compose stage drew the slices wrong); possibly the upstream facts; possibly the spec if the two concerns are genuinely entangled there. Decide from the finding, not from a problem→stage table.
3. Package the fix as a **declared, auditable correction input** (round, origin=validating-stage, target, change, provenance=finding id).
4. **Re-run the traced stage in correction mode** — read prior output, re-derive only the overlapping boundary, keep the rest, re-validate the whole decomposition.
5. **3 attempts max** on the same target; the cap means trace outward (likely upstream/spec), not retry harder.
6. At the cap, **hand off to the investigator**.
7. **Involve the owner only if it traces to the spec.** Never edit the spec to make the overlap disappear.
