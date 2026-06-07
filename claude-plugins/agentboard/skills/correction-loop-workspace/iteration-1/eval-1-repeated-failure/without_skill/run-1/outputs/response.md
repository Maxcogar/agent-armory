# When a card's plan fails review three times in a row

Three consecutive failures on the same plan is a signal, not a setback. It almost never means the plan is "one more tweak" away from passing. It means one of the inputs the plan rests on is wrong, and you are editing the wrong layer. Stop iterating on the plan and diagnose *why* it keeps failing first.

Here is the concrete sequence I recommend.

## Step 1 — Stop. Declare a correction loop and freeze plan edits.

Do not attempt a fourth revision in the same shape. A fourth pass that tweaks the same plan against the same reviewer almost always fails the same way, because the third failure already told you the problem isn't in the words of the plan. Continuing to edit burns time and erodes signal. Explicitly mark this card as "in correction" so it is treated differently from a normal first-pass review.

## Step 2 — Read the three reviews side by side and classify the failure.

Lay the three rejection write-ups next to each other and ask one question: **are they failing for the same reason or for different reasons?**

- **Same finding each time (the reviewer keeps flagging the same gap).** The plan revisions never actually addressed the root objection — they edited around it. The objection is real and load-bearing. Go to Step 3, branch A.
- **A new, different finding each time (you fix one thing, a new one appears).** This is "whack-a-mole" and is the classic symptom of a plan that is too large or whose scope is ambiguous — every revision moves a boundary and exposes a new soft spot. Go to Step 3, branch B.
- **Vague or shifting findings ("not quite right," "could be cleaner," no concrete acceptance test).** The *reviewer* lacks a crisp pass/fail bar, or the card's acceptance criteria are themselves underspecified. Go to Step 3, branch C.

This classification is the whole game. Do not skip it. The right correction is completely different for each case, and three failures usually means you have been applying the wrong one.

## Step 3 — Apply the correction that matches the failure class.

**Branch A — Same objection repeating.** The plan is not the problem; one of its *upstream inputs* is. The objection is correct and the plan cannot satisfy it as currently scoped. Escalate the fix one level up the pipeline:

1. Re-read the card's slice of the **architecture document**. The plan is trying to honor an architecture decision that is wrong, infeasible, or contradicts another card. Fix the architecture, not the plan.
2. If the architecture is sound, re-read the **spec** requirement this card traces to. A spec that is internally contradictory or asks for something impossible will produce a plan that can never pass. Correct the spec and let the change flow back down.
3. Only if both are sound is the objection genuinely a plan-shaping constraint you must design around — and now you know exactly what to design around, which you did not before.

**Branch B — New objection each time (whack-a-mole).** The card is doing too much. **Split it.** Take the current card and the union of all three findings, and cut the work along the seam where the findings cluster. Two or three smaller cards, each with a single coherent responsibility and its own narrow acceptance criteria, will each pass cleanly where one large card thrashed. This is the single most effective move for a card that "just won't pass" — oversized scope is the most common hidden cause. Re-run those smaller cards through the normal pipeline.

**Branch C — Vague/shifting findings.** The failure is in the *review contract*, not the plan. Pin down the acceptance criteria before any further attempt:
- Rewrite the card's acceptance criteria as concrete, testable pass/fail statements ("X must do Y, verified by Z").
- Require the reviewer to phrase every finding as "fails criterion N because…". A finding that cannot be tied to a criterion is not a valid blocker — it is either a missing criterion (add it) or noise (drop it).
- Once the bar is explicit, do one more plan pass against the *fixed* bar.

## Step 4 — Bring the human in. This is the right moment, not a failure.

Three failures is precisely when a human decision is warranted, and asking now is correct — not an escalation you should feel bad about. Put a tight, decision-ready summary in front of the owner:

- The card, what it is for, and the spec/architecture requirement it traces to.
- The three reviews, and your classification (same / new / vague).
- Your diagnosis of the real blocker (the upstream input, the oversized scope, or the missing criteria).
- A specific recommended action with the trade-offs, not an open-ended "what should I do?"

Give them a clear set of choices, for example:

1. **Fix upstream** — amend the architecture or spec, then regenerate this card's plan. (Use when Branch A points at a real upstream defect.)
2. **Split the card** — break it into N smaller cards. (Use for Branch B.)
3. **Re-scope or descope** — narrow the card's acceptance criteria, or defer part of the work to a follow-up. (Use for Branch C, or when the requirement is genuinely too big to land safely.)
4. **Accept with a waiver** — if the remaining objection is real but the owner judges it acceptable for now, record it as a known, documented limitation on the card and let it pass with that exception attached. (Use only when the objection is understood and deliberately accepted — never to silence a finding you don't understand.)
5. **Cut it** — if review keeps failing because the work shouldn't be done this way at all, dropping or replacing the card is a legitimate outcome.

## What NOT to do

- **Do not lower the review bar to force a pass.** Weakening the reviewer or deleting the failing criterion makes the symptom disappear and ships the defect downstream into implementation, where it is far more expensive. The review is doing its job; a repeated failure is information, not an obstacle.
- **Do not blindly try a fourth, fifth, sixth revision of the same plan.** If the first three didn't move the verdict, the seventh won't either. Change the input, the scope, or the contract — not the wording.
- **Do not "split the difference"** by half-addressing the objection to placate the reviewer. That produces a plan that is both unfaithful to the original intent and still failing.

## The one-line answer

Treat the third failure as a hard stop: classify *why* it keeps failing (same objection, new objection each time, or vague findings), then fix the matching root cause — repair the upstream spec/architecture, split the oversized card, or pin down the acceptance criteria — and bring the owner a decision-ready choice (fix upstream / split / re-scope / waive / cut). Do not edit the plan a fourth time, and do not lower the bar to make it pass.
