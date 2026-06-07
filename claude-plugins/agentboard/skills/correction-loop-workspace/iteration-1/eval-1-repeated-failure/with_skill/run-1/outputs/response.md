# Recommended handling: a card plan that has failed review three times

Short version: three failures on the same target is not a reason to keep grinding on that plan, and it is not a reason to dump it on you. Per the correction-loop, three honest attempts hitting the cap is a *signal* — the cause almost certainly lives somewhere other than the plan you've been hammering. So the correct move is to stop re-editing the plan, widen the search outward, and let the system trace to the real origin. Here is exactly how that should go.

## 1. Recognize what the cap means

The loop runs at most **three attempts on the same card / target**. You're at that cap. The skill is explicit that reaching the cap is *not* a wall that ends the loop and dumps the problem on the owner — it's the evidence that **the problem probably isn't in that target**. "A stuck loop is information." If three honest passes couldn't make the plan pass, that's telling us the defect originates upstream of the plan, not inside it. Continuing to change "what we change in the plan" is precisely the trap the loop is built to stop, because fixing a symptom at the wrong stage just reproduces the failure on the next pass.

So the first thing that should happen: **stop the in-place plan edits.** A fourth from-scratch rework of the same plan is off the table.

## 2. Hand off to the investigator for root-cause analysis (automatic)

At the cap, the loop **hands off automatically to the external investigator** for root-cause analysis. This is deliberately a different job than the design review that's been bouncing the plan — deeper root-cause work is kept separate so the reviewer's corrections don't sprawl past the stage it was reviewing. The investigator may draw on chat logs, the card's information, the prior three attempts and their findings, and whatever else is relevant, to work out where the defect *actually* originates.

One honest caveat: the external investigator is a **separate surface and may not exist yet**. The skill defines the handoff and the trigger condition, not the investigator's internals. So if that surface isn't available in your run, the *agents themselves* do the outward trace — the system does not freeze and wait for you to diagnose it. Either way, the diagnostic step is owned by the agents/investigator, not by you.

## 3. Source-trace to the real origin, then route there

The investigation (or the agents' direct trace) decides — *in the moment, from the evidence*, not from any fixed problem-to-stage table — where this correction truly originates. There are three possible destinations, and the right one is chosen by the trace:

- **The architecture document** — if the reasoning, decomposition, traceability, slice boundaries, or a review resolution is what's wrong but the upstream facts still hold. Re-enter the compose stage in **correction mode** (revise the existing output against a declared correction; don't regenerate from scratch).
- **The upstream facts** — if the research/audit facts the plan rests on are wrong or stale. Re-run the upstream stage for fresh facts *before* composing again. (This is a very common reason a plan "just won't pass no matter what we change in the plan" — the plan can't be made correct on top of wrong facts.)
- **The spec** — if the trace lands on the spec itself: vague, underdefined, or quietly drifted from what you actually meant.

Whatever the destination, the correction is carried as a **declared, auditable input** to the stage that redoes the work — capturing the round, the origin (validating-stage / owner-directed / traced-upstream-failure), the target stage, the change being asked for, and the provenance (the review finding ids from the three failures, the failure trace). It must not be dropped in as loose prose or applied as a silent file edit, so the routing decision can be reviewed later.

Critically: **the loop never edits the spec to make this architecture problem disappear.** If the origin is the architecture or the upstream facts, those get fixed at their source and the spec is left alone.

## 4. You only get pulled in if the origin is the spec

Here's the part that answers "what do I do": for most outcomes — architecture-document origin, upstream-facts origin, a process issue — **the agents resolve it at the source themselves and you don't have to do anything.** That's the whole design intent: you shouldn't have to babysit a correction loop.

You are brought in **only if** the trace concludes the origin is the **spec**. That's the one thing the agents can't authoritatively settle, because the spec is yours — you own the *what*, the agents own the *how*. If it lands there, the recommendation is concrete: the spec gets changed on that basis, but **never in-flow and never through `/foundation`** (which only creates specs). It routes out to the external spec-modification path, which is where your input is needed to say what you actually meant.

So the realistic outcomes for you are:
- **Most likely:** the investigator/agents trace the failure to the architecture or the upstream facts, fix it there, and re-run the right stage in correction mode. You're informed, not conscripted.
- **If it's a spec problem:** you'll be escalated, and the fix happens through the external spec-modification path — not by quietly editing the spec mid-run.

## What I would *not* do

- **Don't attempt a fourth direct rewrite of the plan.** Three failures is the signal to trace outward, not to try harder on the same target.
- **Don't reflexively rewrite the spec** because "it failed three times." There is no "failed N times, so edit the spec" rule — that hardcoded reflex is exactly what the loop forbids. The spec is touched only if the trace genuinely lands there.
- **Don't paper over it** by tweaking the spec to make the architecture defect vanish. Spec and architecture are separate authorities; collapsing them buries the real cause.

## The one-line recommendation

Stop editing the plan. You've hit the three-attempt cap, which means the cause is upstream of the plan — hand off to the investigator (or have the agents trace outward) to find the true origin, fix it at that origin in correction mode, and re-run the correct stage. You should only need to get personally involved if the trace concludes your **spec** is the root cause, in which case it's handled through the external spec-modification path rather than any in-flow edit.
