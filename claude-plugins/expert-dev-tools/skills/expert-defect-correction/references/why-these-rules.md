# What each rule cost to learn

Every rule in this skill exists because skipping it produced a defect that shipped or a
review round that was wasted. The cases are recorded so the reason survives the rule — a
rule whose why is lost gets rationalized away the first time it is inconvenient.

## Verify the report before acting

A correction round in this repo was briefed with a population of "~40 instances" of a
construct, taken from a quick grep. The implementer measured it with the construct's own
recognizer and found 33, spread across trees the grep had not sampled. A separate review
called its own scan exhaustive at 3 instances of a citation defect; there were 4, and its
"two of three have rotted" undercounted the real rot, which was 6 of 8.

Three consecutive rounds each corrected a stated population that turned out wrong,
including one supplied by the orchestrator. Numbers in a report are claims.

## Establish which code is running

An owner reported a workflow as broken. The agent inspected the wrong version entirely and
then declared the workflow defective, producing the owner turns "no its at 0.4.1 youre
looking at the wrong thing" and "why are you saying the workflow is borken??? it works.
ive used it." Recorded as a systemic defect in its own right (EDT-0009).

## Reproduce by execution

A verification of a line-ending fix was attempted three times before it was valid. The
first extraction went to a POSIX temp path the Windows Node could not resolve, and *both*
the fixed and the pre-fix script reported success — the pre-fix script passing was the
only tell that the test had not run. The second attempt used `git archive`, which applied
the same line-ending normalization as the checkout and made both sides byte-identical, so
it could not distinguish them either. Only the third setup reproduced the condition.

Two plausible greens before a real test.

## Re-derive; do not patch the reported line

A `closeout` phase was exempted from a continuation gate on the reasoning that the phase
name sounded terminal. Closeout still writes the report, commits, and opens the PR — so
the exemption disabled the gate on a phase where a stall is a real stall, and it did not
even address the case it was added for. The fix was to derive the condition from what the
phase *does* rather than what it is called.

## Sweep the class

A sweep for dropped dispatch results, run because one finding named one site, found a
sibling no review had reported: the plan-amendment dispatch was the workflow's only wholly
unconsumed `agent()` call, so a halted amendment silently re-implemented against an
unamended plan.

The inverse is the more common failure. A correction for a hand-maintained count pinned
one instance. The next round found the sweep reached one directory. The round after found
it reached 7 of 24 instances while its label claimed exhaustive discovery. Three rounds,
same defect, each fix drawing a new boundary by hand.

## Do not increase hand-maintained data

The class above only closed when the drift-prone *form* was eliminated rather than guarded:
unpinned counts deleted or pinned to an executable source of truth, and bare `file:line`
citations replaced by anchors the check verifies still resolve. Hand-maintained items went
from roughly sixty to three. Six of the eight citations had already rotted, one naming a
file the plugin does not contain.

Checking derived data harder has never converged here. Generating it or removing it has.

## Every behavior change gets a check that fails on the pre-fix behavior

A correction added a unit test for a constant, and the test derived its cases from the very
constant it was pinning — so narrowing the constant narrowed the test and it still passed.
Caught only because the implementer ran the mutation rather than trusting the green.

## State exactly what a check covers

A check reported `found: none` for "no unpinned cardinality claim exists anywhere in reach"
while its recognizer saw only spelled cardinals two through ten immediately before a
terminal colon. Thirty-seven instances of the same construct sat in files inside its
declared reach. The label was doing the work of protection while the predicate was not.

The fix was not a wider regex — it was making the claim true: assert the absence of named
forms, list them, and name what is not covered. A predicate over prose can never be total,
so any check claiming to eliminate a class overclaims by construction.

## Fresh reviewer, pointers only

On a sister project, five of six review rounds were compromised by author-supplied
direction in the dispatch. In this repo the orchestrator once hand-copied roughly 65KB of
reviewer findings out of the conversation and into files, and separately wrote dispatch
instructions the workflow already owned.

The reviewer writes its own record; the orchestrator routes and records and nothing else.

## The convergence tripwire

Correction rounds in this repo have gone 6 → 4 → 3 → 4 → 3 → 2 → 1 → 2. The two conditions
exist because a loop that stops converging does not recover by running again — three
separate rounds each widened the same boundary and each produced the same finding on a new
axis. The signal to watch is not the count but whether the *class* is still generating
findings after its own foundational rework.

## Bump the version

A remediation was merged and the owner's plugin never changed, because the manifest still
declared the previous version and the updater saw no difference. The fix was live in git
and absent from every run.

## Verify against the deployed copy

Two defects shipped in 0.4.0 and surfaced within a day of deployment, both invisible to
the full review loop that preceded them:

- The deployment preflight compared raw bytes, so line-ending normalization between the
  cache and the working tree read as staleness. It would have reported STALE permanently on
  the owner's platform. Every review round had tested it against an *older* cache where
  STALE was the correct verdict — a true positive masking a spurious comparison. The defect
  could only appear once a correct deployment existed.
- Six structural checks silently depended on how recently the repository had been cloned.
  They passed for weeks and went red overnight, with no code change, when a checked-in
  fixture aged past a 24-hour window. They were measuring clone freshness, not the rule
  they named.

Both were green during review for reasons unrelated to what they claimed. Review verifies
that a property holds; only running against real deployed state, and letting time pass,
verifies that the check can see the property at all.
