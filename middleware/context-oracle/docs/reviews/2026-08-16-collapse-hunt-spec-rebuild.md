# Independent adversarial collapse-hunt — rebuilt v1 spec

**Date:** 2026-08-16
**Target:** `docs/specs/spec-context-oracle.md` (the 2026-08-16 rebuild).
**Method:** independent adversarial pass (not the author), mission-fidelity only —
the axis the citation/structure review does not cover (companion:
`2026-08-16-expert-review-spec-rebuild.md`). Weighted by the mission's asymmetry:
`[OL-3]` accepts a wasted sentence, so **false silence is the costlier error**.
**Verdict:** NEEDS FIXES — several hollow/at-risk decisions, ranked. All applied.

## Findings and disposition (all applied)

1. **The bar silenced the owner's most-feared case (the uncertain landmine).** The
   multiplicative bar + high-confidence warn-floor suppressed a real-but-uncertain
   hazard *before* FR-D1's confidence flag could fire — optimizing warning-channel
   precision against the mission. Class: wrong-check / arbitrary-number. **Applied:**
   FR-A5a — uncertain hazards are **spoken flagged**, only a noise floor remains,
   precision managed empirically by the learning loop; derived from `[OL-3, OL-C1]`,
   surfaced as owner question Q2 `[D-5, D-28]`.
2. **Learning loop was a one-way ratchet to silence** — demotion had a requirement
   (FR-L3), promotion only a principle (P7); the 2026-07-22 explore mechanism was
   absent. Class: mechanism-not-mission (re-sprung collapse-log trap). **Applied:**
   FR-L3b — promotion/re-exploration required so the loop cannot converge to silence;
   AC-17 now tests per-genre non-convergence, not just a non-zero total `[D-25]`.
3. **FR-A2l answer-drift — weakest mission tie *and* the ledger contradiction.**
   Class: mechanism-not-mission. **Applied:** deferred, raised as Q1 (same as expert
   S1) `[D-24]`.
4. **FR-A2g Verification headlined the self-serve fact** ("name the test") and
   under-covered OL-12 ("unfinished" ≠ "unverified"). Class: reduction +
   mechanism-not-mission. **Applied:** re-headlined to "claimed done, covering test
   not run"; the general *unfinished* gap stated honestly and routed to Phase B
   `[D-27]`; AC-8 asserts it does not fire to merely name a test that ran.
5. **FR-A2d Consequence headlined a grep-able fact** (call-site count), violating P5.
   Class: mechanism-not-mission. **Applied:** re-headlined to the non-obvious content
   (historically-coupled tests, zone flags); the raw count never stands alone.
6. **§5.2 was titled "the relevance test" with no relevance term.** Class:
   mechanism-not-mission. **Applied:** §5 split — §5.1 makes the *trigger* the
   relevance mechanism (the moment establishes relevance to the next decision); §5.2
   is honestly the *quality/marginal-value* bar.
7. **`decision-impact = structural_weight` looked to re-open the 2026-07-22
   "no-intent-term" collapse.** The answer existed (intent is carried by the trigger)
   but was unstated. **Applied:** `[D-18]` now states explicitly that
   decision-impact carries no intent term *because* intent enters via the moment-keyed
   trigger (§5.1) — the inherited collapse-question visibly closed.
8. **Phase A had no brake on a mis-calibrated flood and no tuning input** (cap
   forbidden, raise-to-ration forbidden, demotion is Phase C; D-12 removes uptake
   judgment). Class: mechanism-not-mission. **Applied:** the human CLI correction
   channel (FR-D4/FR-L6) is Phase A's calibration input; §5.2 distinguishes
   calibrating the bar (allowed) from rationing (forbidden); FR-M2a makes a flood
   visible.
9. **FR-M2a over-claimed** ("replaces any output cap"). Class: mechanism-not-mission.
   **Applied:** reworded — volume is *reported, not capped*; a diagnostic signal, not
   a control, making no claim of a "correct rate" `[D-29]`.
10. **FR-A2a Orientation delivered landmines at prompt-time**, violating P6 (the
    binder §1 rejects, in miniature). **Applied:** Orientation delivers entry-points
    only; task-shape landmines move to the edit moment (FR-A2e) `[D-26]`.
11. **FR-A2c Reuse headlined bare existence** (often already in the agent's search).
    **Applied:** re-headlined to the non-obvious convention/frequency ("most call
    sites use it").

## The strongest NEW owner-questions the hunt surfaced, and where they now live
- "In Phase A, what moves the bar?" → §5.2 (human correction channel) + FR-M2a.
- "How does Verification know the test was not run across a resume/fork?" → an honest
  limit in FR-A2g/D-27, recognizer routed to architecture.
- "What re-promotes a demoted genre?" → FR-L3b.
- "Is the tool thinner on young repos (the owner's common case)?" → acknowledged in
  §13, not hidden.
- "May the tool go silent on a possible disaster — is that yours to set?" → Q2 (§13).
- "Where is relevance in the bar?" → §5.1 (trigger), answered.
- "Where does OL-12's *unfinished* get caught vs *unverified*?" → D-27, Phase B.
