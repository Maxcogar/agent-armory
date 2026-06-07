# How the correction flow handles a missing offline-sync component

Short answer: this is a **substantive correction**, and the way you've described it strongly points to a **spec-origin** outcome — which is the one case the loop is built to escalate to you (the owner) rather than letting the agents quietly invent the answer. But the loop does not jump straight to that conclusion. It source-traces first, in the moment, and only lands on the spec if the evidence actually puts it there.

Here is how it should be handled, step by step, mapped to the workflow.

## 1. Confirm this is a real correction, not a plain edit

Adding "an entire component" for offline sync is a different decomposition: new Card Slice(s), reworked Design decisions, new traceability. That is squarely **substantive rework**, so it goes through this loop rather than being patched in place. (If it were a typo or a missed traceability row, it wouldn't.)

## 2. Source-trace to the real origin — do this before routing

This is the heart of it. **Do not** reflex-route on the shape of the symptom ("a component is missing → re-run compose"). The loop decides where the problem *originated* from the evidence in front of it, every time.

You've actually given two competing readings in one breath, and the trace has to settle which is true:

- "the system needs offline sync" — i.e. it's genuinely required, **and**
- "the spec never actually says that ... it got dropped or never made it in."

So the trace asks: **where does the requirement for offline sync live?**

- **If the spec, read honestly, does require offline sync** (it's stated, or it's an unavoidable consequence of something the spec does state) and the architecture simply failed to carry it through, then the origin is the **architecture document** (or possibly the upstream facts, if research/audit missed it). The upstream *what* still holds; the *how* dropped it.
- **If the spec genuinely does not say it** — it was never captured, or it drifted out — then the requirement isn't something the agents can authoritatively add. Deciding that the system *must* do offline sync is a **what** decision, and the **owner owns the what**. That makes the origin the **spec**.

Your phrasing ("the spec never actually says that ... dropped or never made it in") leans hard toward the second case. That is exactly the situation the loop singles out: *the spec is vague, underdefined, or quietly drifted from what the owner meant.*

## 3. Carry it as a declared, auditable correction input

However it routes, the correction is handed to the receiving stage as a **declared, explicit input** — never as extra prose stuffed into a prompt, and never as a silent edit to a file or the spec. The record must capture:

- **round** (this is the first attempt at this target),
- **origin** — here, most likely *traced-upstream-failure → spec*, recorded honestly once the trace lands,
- **target** stage it's routed to,
- **change** — "system requires an offline-sync component; architecture is missing it,"
- **provenance** — what surfaced it (the build-time discovery, plus the finding that the spec is silent on it).

Silent edits are precisely how the owner's intent has gone missing before, so this gets written down, not whispered.

## 4. Route to the origin the trace found

There are three possible destinations; the trace chooses, not a rule:

- **Architecture document** — if offline sync *is* required by the spec and compose just dropped it. Re-enter the **compose stage in correction mode** with the declared input; it re-derives the decomposition to include the offline-sync slice(s), keeps the rest where it's still correct, and re-validates the whole result.
- **Upstream facts** — if research/audit missed a fact that should have surfaced the need. Re-run the upstream stage for fresh facts, then compose again.
- **The spec** — if the trace concludes the spec genuinely doesn't say it (your stated case). The spec may be changed on that basis, but **never in-flow** and **never through `/foundation`** (which only creates specs). It routes out to the external spec-modification path, and **this is the destination that brings in the owner.**

The non-negotiable rule across all three: **the architecture correction flow never edits the spec to make an architecture problem disappear, and never invents a missing requirement into the architecture to avoid touching the spec.** Spec and architecture are separate authorities; collapsing them papers over the real problem. So the agents must not "just add offline sync" to the architecture if the actual fact is that nobody ever decided the system needs it — that would launder a missing *what* into an agent-made *how*.

## 5–6. Retry cap and investigator — likely not where this resolves

The three-attempts-per-target cap and the automatic handoff to the external investigator are for the case where you keep hammering a target and it won't resolve — the cap being a *signal to trace outward*, not a wall. That machinery exists, but for a clean "spec is silent on a required component" case you don't need to burn three failed compose attempts to learn that. The trace can land on the spec directly. (Note: the external investigator is a separate surface and **may not exist yet** — the loop defines the handoff condition, not the investigator.)

## 7. Bring in the owner — for the spec-origin outcome

This is the concrete recommendation. Because the most likely honest trace here is **spec-origin** — the system needs offline sync but the spec never says so — **escalate to the owner**. Whether the system must do offline sync at all is a *what*, and that's the one thing the agents can't authoritatively settle. Every other origin (architecture, upstream facts, plan, process) the agents resolve at the source themselves; this one comes to you.

What that escalation should put in front of the owner:

1. The finding: offline sync appears to be required by the system, but the spec doesn't state it.
2. The trace's read of *why* the architecture lacks it (dropped in compose vs. never in the spec).
3. The decision the owner has to make: **is offline sync actually a requirement?** If yes, the spec is corrected via the external spec-modification path (out of scope here mechanically), and *then* the corrected spec flows back through architecture so the offline-sync component is composed in with proper traceability — as a declared correction, not a bolt-on.

## On the pause

If this run had the optional `/architecture` pause turned on, the owner would get the chance to look before the routed correction is applied. But that pause is **off by default** and is an *option*, not a gate — the loop never makes it mandatory. It's also separate from the AgentBoard blocking-gate feature; this flow doesn't touch board settings. So don't treat the absence of a pause as a reason to skip the spec-origin escalation: the escalation in step 7 is driven by *where the trace lands*, not by whether a pause is enabled.

## Recommendation in one line

Source-trace it now; the evidence as described points to a **spec-origin** correction, so capture it as a declared correction input, do **not** invent offline sync into the architecture to make the gap disappear, and **escalate to the owner** to settle whether offline sync is a real requirement — then run it back through the spec-modification path and a correction-mode compose so the new component lands with proper provenance.
