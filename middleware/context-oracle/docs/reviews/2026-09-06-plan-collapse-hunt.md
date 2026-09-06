# Independent collapse-hunt — Phase A implementation plan (2026-09-06)

**Artifact:** `docs/plans/plan-phase-a.md` at current HEAD of branch
`claude/context-oracle-1evnd9` (5493 lines; §7 has 43 steps, §10A has 11
collapse-tests, §12 has ~60 test entries). Same commit series the author's
compliance review (`docs/reviews/2026-09-06-author-gates-review.md`) and the
meta-check (`docs/reviews/2026-09-06-meta-check-skipped-steps.md`) attacked;
the fix-pass commits (`bbcd55f`, `6cb00ce`, `107673c`, `e60293b`, `99be60a`,
`7290549`, `5f94682`) landed most of those findings before this review.

**Axis:** mission-fidelity only. Not standards-conformance, not doc quality
— those axes are the author's compliance review and the meta-check
respectively. This review's single question is `CLAUDE.md` dominating rule
3: *does each load-bearing decision serve the Phase A goal — "an honest
deterministic foundation, running on the owner's real repos, that measures
its own floor — how little it catches — with clean seams the later phases
plug into; never fake completeness dressed to look like a working
product"?*

**Reviewer:** independent subagent, not the author of the plan, the
architecture, or any prior review. Blind to the author's other reviewers
except by the transcript-visible fact that both landed.

**Read in full before the attack:** `docs/collapse-log.md` in full (the
2026-09-04 fake-completeness entry first, then 2026-09-03 rounds 6–9
reduction-inverted lineage, 2026-08-29 review-repair-carries-its-own-defect,
2026-08-25 convergence definition and its item 3 "self-graded homework"),
`OWNER-LEDGER.md` CONFIRMED rows only, `middleware/context-oracle/CLAUDE.md`
(the three dominating rules, especially rule 2), spec §8, §11.5, §12, §13,
§14, architecture-phase-a.md AD-9 / AD-10 / AD-14 / AD-15 / AD-18 / AD-21 /
AD-24, the two prior reviews on this plan, then the plan end-to-end.

**Method (per `CLAUDE.md` dominating rule 2 and coordinator brief).** For
each of the 11 §10A collapse-tests: read the author's step-2 question, form
a **more-hostile** step-2 question the author would not have picked (a
skeptic attacks the framing not the frame), and test the author's step-3
answer against the harder question, using only spec / architecture / ledger
/ collapse-log as ground. Then hunt for NEW load-bearing decisions §10A
missed — any §7 step that introduces a plan-level judgment beyond
transcribing an architecture decision, and any cross-step interaction the
per-decision collapse-test structurally cannot see (the 2026-07-30
between-decisions lesson). Search locates; **reads verify** — every claim
about the plan or its sources is grounded in a read of the file, not a
grep alone (the 2026-07-30 grep-as-verification defect). Not manufactured
to avoid an empty report: repairs that survive their hardest question are
recorded by name at the end.

## Verdict: DOES NOT SURVIVE

- **Collapses: 3** (C1 build-order framing; C2 D-plan-3 "features for free" answered against a fantasy runner; C3 exit-run repo set = one-and-that-one)
- **Partial collapses: 4** (P1 lag-window heuristic; P2 D-plan-6 "design-safe either way"; P3 D-plan-8 marker discipline holes at init's own write; P4 seam interface fixed narrower than Phase B needs)
- **New load-bearing decisions §10A missed: 6** (N1–N6, each introducing plan-level judgment or a cross-decision hazard the per-decision collapse-test cannot see)
- **Survived with note: 3** (S1 D-plan-4; S2 D-plan-7; S3 D-plan-2 as a *floor*, though the reproducibility framing is thin)

The plan's `CLAUDE.md` rule 2 self-attestation ("Steps 1–43 in §7 are
transcriptions of architecture decisions AD-1..AD-26, each of which passed
its own collapse-test in the architecture document; the plan's §7 does not
re-litigate those and does not require re-doing their collapse-tests" —
§10A closing paragraph) is itself the strongest instance of the shape it
declares immune: the plan makes plan-level judgments at Steps 5, 14, 15,
17, 18, 23, 24, 26, 28–29, 40, 42 that no architecture collapse-test could
have exercised because they did not exist before this plan. Two of those
(Steps 14 and 42) sit directly on the 2026-09-04 fake-completeness
collapse's re-strike surface. Passing the plan through this review with the
§10A framing unchanged would repeat the collapse-log 2026-08-25 item 3
lesson at the process level: *"an in-document self-test never discharges
the mandatory independent hunt; when you find yourself writing both the
question and a passing answer, you are the substance-reviewer again."*

**Trajectory note.** This is round 1 of independent adversarial review on
the plan (a prior subagent was dispatched but against a stale commit; the
meta-check `H3` records that). The finding count is not the round-N
convergence trajectory (5 → 6 → 1 → 1 → 0 → 0 → 0 → 0 → 0) that terminated
the architecture-review series after nine rounds; this is a fresh series on
a new artifact. Under the terminal-state definition in the collapse-log's
2026-08-25 entry ("*every remaining limit is an irreducible truth about the
problem*"), the plan is not close to terminal — nearly half its
load-bearing plan-level decisions carry framing defects the mission
attacks land on.

---

## Collapses

### C1 — D-plan-1 build-order collapse-test picked the friendlier framing; the harder framing exposes it as attention-management theater, and the 2026-09-04 collapse's re-strike surface is exactly the deny path that D-plan-1 sequences to build FIRST

**Where:** `docs/plans/plan-phase-a.md` §10A "D-plan-1 (build order)"
step-2 (*"Building the deny path before the whisper genres optimizes
attention for the block, not for the mission of speaking a decision-changing
fact"*) and step-3 (the answer names topological-dependency framing and
cites spec §8 opening + `P9`). Cross-read: §7 Step 14 verification note
(*"the temptation to elaborate them into 'correctness' is exactly the
2026-09-04 collapse"*), §13 R1, and the collapse-log 2026-09-04 entry.

**Harder collapse question.** *The 2026-09-04 collapse — the standing
warning that made this plan restart the architecture layer for `AD-9` —
happened because ten review rounds "closed the last round's findings and
adding machinery, until it looked like a working answer-drift block." What
protects Phase A's build against exactly the same disease at the build
layer? D-plan-1 sequences the deny path FIRST (Steps 13–19, after the
schema substrate), and Steps 14–18 are then followed by Checkpoint 2 which
gates the deny path on "every AC-2\* fixture" passing (§9). A build that
runs deny-path fixtures at the earliest possible moment, and gates the
whole build on them passing, IS the review treadmill the collapse-log
warns about — every fixture-failure has to be fixed before the whisper
path even starts, so every fix lands on the recognizer with no whisper-path
context to constrain it. Cite the mechanism in the plan that keeps the
Step-14 recognizer minimal WHEN Checkpoint 2 demands the AC-2\* fixtures
pass green.*

**Why the plan's answer fails.** The step-3 answer names `P9` ("no feature
is primary") and topological dependency — both true, both irrelevant to
the harder question. The plan's own §13 R1 concedes exactly this: *"the
recognizers are small — but because the temptation to elaborate them into
'correctness' is exactly the 2026-09-04 collapse. The step is hardest
because it requires restraint, and restraint is not testable."* The
mitigation offered — Checkpoint 5's "suspiciously-high coverage number is
a finding, not a success" — fires at Step 42, after 27 steps have been
built on top of an elaborated recognizer, and after every AC-2\* fixture
has been made to pass green through those 27 steps. The plan's answer to
"who prevents padding" is the collapse-log's own reviewer + a
report-format rule; both are downstream of the moment the padding happens.
The plan's build-order structurally invites the padding by making the
deny-path fixtures the *first* correctness gate — before the whisper path
exists to distract the build from optimizing the recognizer further.

**What the mission needs (spec §11.5, verbatim):** *"a **conservative
deterministic recognizer** … Phase A's recognizer errs hard toward
not-firing — safe (it rarely denies a compliant agent) but low-coverage:
a skeleton, not 'the block working.'"* A build order that sequences the
whisper path first — starting from the substrate, going through miner /
indexer / genres / bar / compose — would leave the recognizer as the
*last* Phase A component to build, with 25 steps of accumulated substrate
context around it. The recognizer's restraint would then be forced by the
build's own attention allocation, not by an out-of-band rule ("cut the
elaboration"). D-plan-1's rationale (correctness risk, dependency
topology) is real but the mission-fidelity axis is the one 2026-09-04
lost, and D-plan-1 is on the wrong side of it.

**Precedent for the class.** Collapse-log 2026-09-04, verbatim: *"The
architecture over-reached its own spec into a coverage-maximizing
classifier. The defect was the architecture, not the spec. … Both passes
check the artifact for correctness, consistency, standards-conformance,
and citation integrity. Neither asks 'does this mechanism serve the Phase
A goal, or is it machinery that only passes review?'"* The 2026-09-03
round-9 entry sharpens it: *"a model-free / heuristic component that keeps
failing a new way each round is over-claiming — the convergence-forcing
fix is to demote the claim to what the spec actually mandates, not to
patch the next input."* Build-order that puts the fallible recognizer's
fixtures as the first correctness gate is the review-treadmill shape at
the build layer.

**"Steers toward" check (step 4).** The plan says the order steers the
implementer toward *"exercising the deny path against its own AC-2\*
fixtures before whisper genres complicate failure diagnosis."* Under the
harder framing, that steering is precisely what invites the collapse:
*fixture failures with nothing else to distract you* is what elaborates a
model-free recognizer into padded correctness. Guide is not gate, but a
guide that steers toward the collapse pattern is not a good guide — it is
the collapse-pattern's runway.

---

### C2 — D-plan-3 collapse-test's step-3 answer (*"node:test has everything the plan needs"*) is answered against a fantasy in which the tests actually run; the plan runs `node --test test/unit/**/*.test.ts` against `.ts` files under Node 22.16 without a TypeScript loader, and the tests do not execute

**Where:** `docs/plans/plan-phase-a.md` §10A D-plan-3 step-3 (*"node:test
has describe/it, parallel execution, subtest reporting, mock/spy
primitives, and a JSON reporter — enough for the plan's §12 unit tier as
specified"*); Step 1's CI job command (line ~586: *"npm ci && npx tsc
--noEmit && node --test test/unit/\*\*/\*.test.ts"*); Step 39 verification
(*"All T*-\* unit tests in §12 pass under `node --test test/unit/\*\*/
\*.test.ts`"*); §5.1 test/unit/ file list (every unit test named as
`.test.ts`).

**Harder collapse question.** *Node 22.16.0's `node:test` runner cannot
execute a `.ts` file as-is; TypeScript type-stripping is behind
`--experimental-strip-types` (introduced Node 22.6, stabilized in Node 23,
still experimental in the 22.x line), and Node without the flag reports a
`SyntaxError` on the first `type` or `interface` token. The plan's CI
command uses no such flag, its `tsc` invocation is `--noEmit` (no `dist/`
generated), and Step 39's verification names the same command against
`.ts` files. If the tests do not execute, `node --test` exits 0 with "0
tests found" (a passing exit code Step 1 already accepts explicitly as
Step 1's own verification). Every T-ID's "Fails when" clause the plan
records is inert if the runner does not load the test file. Which line of
the plan actually compiles the TypeScript tests to executable JavaScript,
and where does the runner load them from?*

**Why the plan's answer fails.** There is no such line. The plan pins
`tsconfig.json` with `"noEmit"` implicit (never emits at Step 1's build);
the only tsc invocation the plan schedules is Step 1's typecheck
(`--noEmit`). §12's unit-tier tests are all under `test/unit/*.test.ts`;
`test/build/` uses `tsc` fixtures (a different mechanism); `test/replay/`
uses a spawned real handler binary. Nowhere is the source-and-tests
compilation from `.ts` to `.js` orchestrated for `node --test` to
consume. Under Node 22.16 without `--experimental-strip-types`, the
tests error at parse time; under Node 22.16 *with* the flag, the flag is
experimental and its behavior with source imports (test importing
`../src/qa/state.ts` etc.) is not exercised by the plan or verified in
§11. Either way the plan's "all T-IDs pass under `node --test`" claim
is asserted against a runner configuration the plan does not build. This
is the same *unverified-premise* class the 2026-08-01 round-4 finding
names ("*"Every X is Y" under a table is an attestation, and the standing
instruction is to treat one as a defect on sight*").

**Mission-fidelity consequence.** Every §12 T-ID's "Fails when" clause is
the plan's mechanical falsifier — the mechanism the plan uses to make the
build's correctness auditable. If the runner does not execute the tests,
the T-IDs are documentation only; the collapse-log 2026-08-29 lesson 2
(*"a fix that names a location must land at that exact location, not one
decision away"*) applies: naming a runner in D-plan-3 that cannot load
the plan's test files is a fix landing one decision away from where the
tests actually need to run. The AC-2 structural test (T15-2, greps
`dist/**/*.js` for `permissionDecision`) compounds the defect: if
`dist/` is never generated (Step 1 is `--noEmit`), the grep finds
nothing to grep, and the confinement test passes vacuously — the exact
"wrong-check" class the collapse-log 2026-08-25 item 4 names ("*an
absolute silently broken by a second use of the primitive*"), here
silently broken by an absent primitive.

**"Steers toward" check (step 4).** The plan says D-plan-3 steers an
implementer toward *"running `node --test test/unit/\*\*/\*.test.ts` and
getting the same result CI gets"* — which under the current spec is *0
tests found*, and CI happily accepts it as green. Guide, not gate: yes, no
mechanism gates against the vacuous pass; but the guide steers toward the
vacuous pass by construction.

**What resolves it.** Either an explicit `tsc && node --test dist/test/
\*\*/\*.test.js` two-step (with `dist/test/` a real emit target), or
`--import tsx/esm` (a tsx or similar loader — which the plan rejects as
a dependency at D-plan-3), or Node's `--experimental-strip-types`
explicitly named with a verified premise that the source imports work. The
plan's current text names none of the three.

---

### C3 — Step 42's exit-run repo set is stated as *"this one `Maxcogar/agent-armory` at minimum"*, and the "at minimum" hedge is the whole set; running the Phase A measurement on the tool's own repo (which contains the tool's plan, spec, and architecture as commits) is not the "owner's real repos" the phase goal names

**Where:** `docs/plans/plan-phase-a.md` §7 Step 42 (*"Enumerate a small
set of Max Cogar's real repositories (this one `Maxcogar/agent-armory` at
minimum; owner supplies others via a `.ctxoracle-exit-repos` file)"*);
§10A "Plan-level: Exit-run report shape" (whose collapse-test attacks the
report format, not the repo set); §13 R7 (which lists "real-repo set too
small to be informative" but rates it middle-order and says *"Phase B
design consumes what exists and asks for more data where needed"*); the
Phase A goal in `CLAUDE.md` dominating rule 3 and spec §11.5 (*"running
on the owner's real repos"*, *"measured whisper/block + false-fire and
regret data on a real repo — including how little the conservative
recognizer catches"*).

**Harder collapse question.** *`Maxcogar/agent-armory` is the tool's own
repository. Its git history is dominated by spec revisions, architecture
review rounds, plan iterations, and this very collapse-hunt — not by
application code development the tool is designed to help. The co-change
miner (Step 20) running on this repo will find that `spec-context-oracle.md`
and `OWNER-LEDGER.md` co-change at every session (they do — the ledger
records every owner decision the spec then encodes), and that
`docs/architecture-phase-a.md` and `docs/collapse-log.md` co-change
across every round of review. Those are real coupling pairs, but they are
documentation coupling, not code coupling — and the whisper genres
(Consequence, Warning, Completeness) generate against those doc pairs
what real-code repos would not exhibit. The exit report's per-genre
numbers will be measurement of the tool on its own reflection, which is
exactly the kind of self-observation that the mission's "at the moment of
that decision" test never asked for. What in the exit-report format
distinguishes "measured the deterministic core on real code repositories"
from "measured the deterministic core on the tool's own documentation
history"?*

**Why the plan's answer fails.** Neither Step 42 nor §10A's exit-run
report-shape entry addresses the composition of the repo set. The `.ctxoracle-exit-repos` file is described as owner-supplied, but Max Cogar
is a non-programmer (OL-11) who has already declined to make design-tier
scope decisions on the plan — expecting him to name a distinct set of code
repositories is precisely the "over-asking failure" the 2026-08-25 entry
item 6 warns about, dressed in a config-file. R7's mitigation ("Phase B
design consumes what exists") accepts that a bad exit measurement will
propagate through Phase B — but Phase A's goal per spec §11.5 is *"an
honest deterministic foundation, running on the owner's real repos, that
measures its own floor"*, and a floor measured on the tool's own docs
history is not the honest floor of what the tool does on the *"owner's
real repos"* the phase names. This is not a small measurement flaw; the
whole point of Phase A per the goal is that this measurement is the
substrate Phase B and the `AD-24` regression fixtures are designed from
(spec §11.5, verbatim). A biased substrate biases both descendants.

**Class.** *fake-completeness at the measurement layer*, the exact
process-layer twin of the mechanism-layer 2026-09-04 collapse. That
collapse produced a padded recognizer; this one would produce a padded
measurement of what the (unpadded) recognizer catches. The report's
per-genre numbers pass every mandatory-shape check (they exist, they are
labeled) while the numbers themselves reflect a set the phase goal
excluded.

**What resolves it.** The plan must (a) state the exit-report is invalid
until the repo set contains at least one repo that is *not* the tool's
own; (b) name a concrete way to obtain it (e.g. the same `Maxcogar/*`
repositories the tool is designed to help, per OL-11 the owner's own
programming projects); (c) if none are available in the environment the
build runs in, declare the exit-run as a bin-2 owner decision — accept a
provisional measurement labeled as biased, or halt Phase A closure until
a real repo set exists. What the plan cannot do is what the plan currently
does: label the tool's own repo as "the owner's real repo" and proceed.

---

## Partial collapses

### P1 — Step 17's lag-window heuristic ("bookmark position < transcript file size") is TOCTOU-shaped, and the plan carries the shape as an approximation without stating the safe-error direction under the failure mode the approximation opens

**Where:** `docs/plans/plan-phase-a.md` §7 Step 17 (verbatim: *"when the
bookmark shows the transcript has not yet been read past the newest
expected assistant text turn (approximated by: the last thing recognized
in catch-up was a `PreToolUse` on the main consumer's transcript from
this same batch, i.e. the bookmark position is < the transcript file
size)"*). Architecture AD-9 says only *"When the newest assistant text
has not reached the file yet (V1's documented lag), the state still says
`open` and a deny-eligible move is denied — the block holds rather than
pre-clears"* — the plan is where the operationalization becomes
"bookmark < file size."

**Harder collapse question.** *The transcript file is being written to
asynchronously (V1). The bookmark is read at time t1; the file size is
read at time t2; the block's decision is made at time t3; the emit
happens at time t4. Between t1 and t4 the file can grow (transcript
writer flushes an assistant turn), can shrink (never — transcripts are
append-only, so this is safe), or can be stable. Under a "bookmark < file
size" comparison: (a) if the file grew between t1 and t2 with a
partial-line write, the bookmark is < size and hold is chosen, safe; (b)
if the file grew with a complete assistant text turn that clears the
question, the bookmark is < size, hold is chosen, and the deny fires on a
move the caught-up state would have allowed — wrongful deny; (c) if the
file did not grow, and the bookmark equals size, no hold, deny decides
normally. Case (b) is a race: the moment between "assistant turn was
written but not yet consumed by catch-up" and "catch-up runs on this
event." The plan's "self-recovers in one round-trip" claim from D-plan-1's
adjacent framing does not save case (b) — the wrongful deny already
fired, the model has already been told "answer Max's question first" for
a question the model already answered. What is the frequency estimate for
case (b), and how does the plan distinguish it in the FR-M4 counters from
a genuine drifter?*

**Why the plan's answer is partial.** Step 17 names the
`deny_after_answer_lag` detector — but that detector "records" the case
post-hoc; the wrongful deny still landed. The plan says *"a wrongful
lag-hold self-recovers on the next event and surfaces via a self-detected
fault"* — self-recovery yes, but only for the *next* move; the specific
deny that fired is un-recoverable. This is not a small window: on a
typical narrated session where the model writes a long text answer
followed immediately by an `Edit`, the transcript file grows with a
partial-line during the write and completes just before the `PreToolUse`
fires. Case (b) is the common case, not a corner. The plan does not
estimate its frequency and does not state the safe-error direction: is a
wrongful lag-hold better than a missed drifter here? FR-B5 says yes on
the steady-state axis, but the lag window inverts precisely because the
asymmetry has to be re-derived for the not-yet-consistent regime (spec
§8, verbatim: *"in the lag window (newest turn unclassified) the lean
reverses to hold"*). The plan implements the lean-reversal but does not
state — as either a design or a measurement — what the wrongful-hold
rate is expected to be on real transcripts, and R5 in §13 ("silent
under-fire in a marker-less transcript mode") addresses the marker miss,
not the file-size TOCTOU.

**Partial not full.** The design direction is correct (hold in lag window
is what spec §8/D-41 mandate); the mechanism as sketched is defensible.
The partial-collapse is that the operationalization ("bookmark < file
size") is a heuristic the plan does not verify — no §11 evidence entry
grounds it — and the frequency of case (b) is not measured or estimated.
This lands in Phase A's honest-floor deliverable: if the exit report
under-reports lag-hold wrongful denies because the case they mostly
happen in is un-instrumented, the measurement is padded on the "quiet"
axis.

### P2 — D-plan-6's "L11(b) is design-safe either way" answer assumes both the intake voiding guard and the transcript catch-up run in the same tick as the PreToolUse; under the transcript lag they can run one tick later and the intake row stays open for a full move, producing a wrongful deny the plan attributes to Phase A's owned residual but that is a distinct hazard

**Where:** `docs/plans/plan-phase-a.md` §10A D-plan-6 step-3 (*"if
UserPromptSubmit fires for a platform-injected turn, intake opens a
question row from the prompt field and the transcript-catch-up voiding
guard immediately closes it when the matching turn's origin.kind is not
'human' … Either way no wrongful deny is emitted"*); §15 Q-gap-4 second
half (same design-safety claim); architecture AD-9 (intake opens on
`UserPromptSubmit.prompt`; catch-up reconciles/voids on the next event).

**Harder collapse question.** *A platform-injected turn (say, a wake
notification) fires `UserPromptSubmit` with a prompt field containing
"please continue with X?" (ends with `?`, outside code fence, not in
stoplist — Step 14's recognizer opens a row). The next event is a
`PreToolUse` on `Edit`. The catch-up (per the plan's pipeline, Step 28
order (5)) runs BEFORE the block check (order (6)) — but the catch-up
reads `transcript_path` from the file, and V1 documents `transcript_path`
as written asynchronously and may lag. If the injected turn's transcript
line has not been flushed to the file yet at the moment catch-up runs,
`getBookmark()` returns the offset from before the injection, the
`readFrom` call finds nothing new, the voiding guard has no entry to run
against, and the block sees `open` for a row that intake opened from the
injected prompt. `decideDeny` returns a `DenyVerdict` — wrongful, because
the "question" was never Max Cogar's. The plan attributes this class to
Phase A's owned "documented low coverage" (L1 in AD-9), but L1 is about
*intake missing indirect questions*; this is a *wrongful intake from an
injected turn*, opposite direction, un-owned. Which spec-level residual
covers it, and cite the residual by ID?*

**Why the plan's answer is partial.** L1 lists intake's low coverage
(what it misses); the intake overreach case (what it wrongly opens) is
not in L1's or AD-9's stated residuals. The catch-up voiding guard is
described as the closer of this case — but the guard runs on the next
event's transcript catch-up, and V1's async lag can put the injected
turn's transcript line past the current event's catch-up horizon. The
"either way no wrongful deny" claim rests on the catch-up seeing the
injected turn's non-human marker; if the marker has not arrived at the
file, the catch-up sees nothing to void, the row stays open, and the
next `PreToolUse` deny fires — wrongfully. Self-recovers on a subsequent
catch-up, yes; the specific wrongful deny already fired. This is the
same shape as P1 above but at intake rather than clear-axis.

**Partial not full.** The design has a real self-recovery mechanism, so
the case does not repeat forever. And L11(b) does not have to be
resolved in Phase A per D-plan-6's retraction ("resolves naturally on
first real install"). But the plan's declaration that Phase A is design-
safe either way is stronger than the mechanism warrants — a "design-safe"
claim is a totality claim (collapse-log 2026-09-03 round 7 lesson 2), and
this one has a hole. The honest wording is: *"L11(b) is design-safe
against a persistent wrongful deny; it is not design-safe against a
transient wrongful deny, and Phase A's exit report will measure the
transient rate on real transcripts."*

### P3 — D-plan-8's marker-discipline collapse-test does not survive the concrete case where `init` writes settings.json directly (not through the AD-6 adapter), and the author's own compliance review flagged the same hole under the "attacked, plausibly holds" tag; the collapse-test claims the AD-6 adapter is the mitigation, but init runs before the adapter and needs no adapter

**Where:** `docs/plans/plan-phase-a.md` §10A D-plan-8 step-3 (*"a future
strict-validating harness would be a hooks-contract drift, and the plan's
response to that class of drift is the AD-6 single-adapter discipline"*);
§7 Step 31 (`init`'s direct write to `.claude/settings.json`); the
author's own review at `docs/reviews/2026-09-06-author-gates-review.md`
"No findings — attacks that hit nothing" bullet on D-plan-8, which
explicitly says *"the init verb writes settings.json directly (not
through hook/adapter.ts), so the AD-6 adapter mitigation doesn't apply
to init's own write. This is a real hole"* and marks it "attacked,
plausibly holds under current harness, worth watching if the harness
changes. Not a finding for this pass, but if the independent reviewer
finds this too, it becomes S6."

**Harder collapse question.** *`init` writes JSON into a schema the harness
consumes; the marker field ("comment": "installed by ctxoracle" or
similar) is arbitrary. If the harness later validates schema strictly
(rejecting unknown fields), `init` will write a file the harness rejects
— and `init` is BEFORE the adapter file exists in the code path for
recovery. The plan's collapse-test names the AD-6 adapter as the
mitigation, but AD-6 mediates hook input parsing, not settings.json
writes; init's write is direct. The author's own review flagged this and
deferred it to "if the independent reviewer finds this too." So: it is
found. What is the plan's actual mitigation for this case, and does it
depend on the harness accepting unknown fields (which is a factual claim
about a moving contract, not a design property)?*

**Why the plan's answer is partial.** The step-3 answer is factually
wrong on the mitigation locus: AD-6's adapter mediates hook input
parsing, not settings.json writes. The real mitigation would be either
(a) marker as a comment field that a JSON validator would tolerate — but
JSON has no comment syntax so this is a JSON-with-comments dialect the
harness may not accept, or (b) marker as a distinct JSON field the
harness ignores because it's not on the schema — which works only under
lax validation. The plan's Step 31 chooses (b) (*"marked with 'ctxoracle'
in a comment or a marker field"*) without saying which. The current
harness is factually lax about extra fields (§10A D-plan-8's answer
implicitly asserts this from harness knowledge); the plan does not
verify this in §11.

**Partial not full.** The current harness likely accepts extra fields
(D-plan-8's soft-ground claim), so the plan works today. The collapse
question is what happens when the harness changes — a scenario the
project explicitly models (spec §9 "the hooks contract has drifted
before and will again"; §13 R3 lists it as Phase A's third-highest
risk). The mitigation the plan names does not cover this exact failure
mode, and the author's own review named the hole but deferred it. The
resolution: either (a) verify the marker convention against the current
Claude Code settings schema in §11 (a documented tolerance for extra
fields), or (b) redesign the marker to be a value inside a known field
(e.g. a distinctive command prefix the deinit greps for), which
survives strict validation because the extra content is inside a schema-
valid field.

### P4 — Step 38's Phase B model-invocation seam interface (`ModelInvocation.invoke(prompt, opts?)`) is fixed as a single-method single-call shape; Phase B needs streaming, tool-use in responses, per-invocation cost accounting, and multi-turn — none of which the interface admits, and "fixing the shape now" per AD-21 to prevent Phase B redesign is undercut if Phase B has to widen the interface anyway

**Where:** `docs/plans/plan-phase-a.md` §7 Step 38 (verbatim interface:
*"invoke(prompt: string, opts?: {maxTurns?: number}): Promise<{ok: true,
text: string} | {ok: false, reason: string}>"*); AD-21 (piggyback seam
fixed now); §10A does not include Step 38 in the collapse-test set.

**Harder collapse question.** *Phase B's model-in-the-loop genres run
Assumption-check, Steering, Answer, and the model-assisted maintenance of
qa-state — the last of which needs to classify multiple transcript
entries per activation and cache verdicts. The verified V9 invocation is
`claude -p --model <small> --tools "" --max-turns 1 --output-format json`
— which returns a JSON blob with metadata (cost, usage, model name, stop
reason), not a bare text string. The seam interface returns
`{ok:true,text}` — the metadata Phase B needs for cost accounting is
discarded at the interface. Phase B also needs per-invocation opts for
model name (small/large trade-off), system prompt (the classifier prompt
differs per genre), timeout override, and cache control. The plan fixes
opts to `{maxTurns?: number}` — none of the others expressible. If Phase
B has to widen the interface, the AD-21 "fix the shape now to prevent
redesign" claim is falsified. Cite the Phase B design document that
verifies this interface is sufficient for the classifier-maintenance
workflow, and if none exists, defend the seam shape against the workflow
requirements.*

**Why the plan's answer is partial.** No such document exists — Phase B
is not architected yet (spec §11.5, per the per-phase-architecture rule).
The Step 38 collapse-test-absent seam interface is a guess at what Phase
B will need, made from Phase A. That guess is likely wrong along the
axes above (metadata, model selection, per-genre prompts). If Phase B
widens the interface, Phase A callers of this interface (there are none
today, per Step 38) don't break — but the *reason* AD-21 fixes the seam
now (*"leaving the seam to Phase B invites the redesign §11.5 forbids;
committing the interface now forces the shape"*) is undercut: a shape
that has to be widened is not the shape Phase B builds against.

**Partial not full.** The Phase A build survives Phase B's interface
widening because Phase A has no callers. The mission-fidelity concern is
smaller: fixing the interface too narrow does not corrupt Phase A's
measurement, only wastes the AD-21 investment. But the collapse-test
should exist: what makes this interface "the shape Phase B builds
against" rather than "Phase A's guess at Phase B's shape"?

---

## New load-bearing decisions §10A missed

These are plan-level judgments made in §7 that were not tested by §10A
because the plan's closing paragraph ("*Steps 1–43 in §7 are transcriptions
of architecture decisions AD-1..AD-26*") deemed them out of scope. Each
one is a decision the architecture did not decide and did not test, and
each is load-bearing on the Phase A goal.

### N1 — Step 5's URL normalization for shallow-repo key derivation ("lowercasing scheme+host, stripping trailing `.git`, stripping user info") does not normalize SSH vs HTTPS, port numbers, GitHub Enterprise, or path case-sensitivity; a repo cloned via SSH and then re-cloned via HTTPS silently keys to two different stores in shallow mode, splitting the owner's own knowledge

**Where:** `docs/plans/plan-phase-a.md` §7 Step 5 (URL normalization
rule). AD-3 in the architecture names the deterministic rule as "root-
commit / URL / realpath" — it does NOT specify the URL normalization
algorithm. That is a plan-level judgment.

**Impact if wrong.** Cross-decision. `FR-K9`'s export/import cannot
repair a mis-key: the exports would be against different keys. Step 5's
own "impact if wrong" says as much ("systemic within one repo — a wrong
key silently splits data"), and mitigates by having `status` display the
key + mode. But `status` shows the mode ("url"), not the normalized
input, so the owner sees "url mode" for both stores and does not know
they differ. This is the collapse-log 2026-09-03 round 6 lesson 1 shape:
*"A fix that names a location must land at that exact location, not one
decision away"* — the shallow-clone URL fallback is here to survive the
one-repo-two-clones case, and the normalization gaps re-open it.

**What needs saying.** Either (a) enumerate the normalization axes the
plan controls (scheme, host, port, path, case, user-info) with each
axis's rule and its choice, or (b) declare the class open ("shallow-clone
key stability across clone-URL variants is not guaranteed in Phase A;
diagnostic surfaces the raw URL to `status`, owner reconciles manually").
Silent normalization gaps that split stores are exactly what §11.5
disqualifies as "fake completeness."

### N2 — Step 18's `deny_bypass_suspect` predicate list (`>`, `>>`, `tee`, `sed -i`, `perl -i`, `cp`, `mv`, `install`) is materially incomplete; the list omits `dd`, `cat > file` via variants, `xargs cp/mv`, `git add && git commit`, language interpreters as writers (`python -c 'open().write()'`, `node -e 'fs.writeFileSync()'`), `rsync`, `ln -sf`, and every language-native writer invoked from bash — so the L3 Bash-drift residual's diagnostic under-detects by design and the exit-report cannot honestly measure the residual

**Where:** `docs/plans/plan-phase-a.md` §7 Step 18 (predicate list);
architecture L3 (Bash-drift is a documented residual, owned via the
diagnostic). AD-9's L3 says *"a proxy, not a measurement — it over-
counts an unrelated same-file shell rewrite and under-counts a bypass to
a different path; both directions stated in `status`"* — the under-count
direction is disclosed as a property, but the concrete under-count size
is not bounded.

**Impact if wrong.** Directly on Phase A's goal. The mission-fidelity
question is: *does the exit-report's `deny_bypass_suspect` count
honestly measure how much the answer-drift block is bypassable via
`Bash`?* With this predicate list, the count under-measures by an
unknown factor. Phase A's phase-goal, per §11.5, is *"honest deterministic
foundation … that measures its own floor"* — a floor measured by a
detector whose blind spot is not enumerated is not the honest floor.

**What needs saying.** Either (a) enumerate every reachable file-writing
Bash pattern the plan intends the detector to catch, or (b) declare the
detector's coverage as "the enumerated pattern set only; other write
paths are known unmeasured and will be listed in `status`'s residuals
section." The plan currently declares the detector without stating its
coverage bound.

### N3 — Step 23's seeded defaults (`bar.confidence_floor = "0.6"`, `bar.support_min = "3"`, `bar.noise_floor_support_min = "2"`, `bar.impact_read_min_coupled = "2"`, `bar.reuse_dominance_k = "3"`, `deny.despite_answer_text_threshold = "3"`) are unsourced numbers doing load-bearing work on the exit measurement; the plan says "verified against AD-14 and AD-9" but AD-14 says the operating point is architect-tunable and Phase A calibration input is the human channel — no source, no measurement, just judgment

**Where:** `docs/plans/plan-phase-a.md` §7 Step 23 (default values);
architecture AD-14 (*"defaults from tuning so calibration is a tune
operation, not a recompile"*, but no defaults specified there); no §11
evidence entry backs any of these numbers.

**Impact if wrong.** Every whisper genre's fire/silence decision is
gated on these numbers. The exit-report's per-genre counts are directly
determined by them. If `bar.confidence_floor = 0.6` is too high, every
genre reads as silent (measured coverage = 0, `docs/collapse-log.md`
2026-07-22 #1 recurrence); too low, every genre reads as noisy
(false-fire rate elevated). The plan seeds the numbers as if they were
architecture-verified; they are architect-tunable by explicit design,
which means the *defaults* are a plan-level judgment. That judgment
has no §11 evidence — and per the plan's own §3 standards, *"numbers
without sources don't go in."*

**What needs saying.** Either (a) source each default to a document that
grounds it (ROSE for the confidence base rate, an owner-approved
number for the threshold), or (b) mark them explicitly as
"plan-seeded starting values, to be calibrated by the exit-run" — with
the caveat that the exit-run's per-genre measurements are therefore
themselves conditional on these starting values, and Phase B's design
input is a moving target until the first real-repo tune. This is
`docs/collapse-log.md` 2026-08-13 item 3 recurring: *"the replacement,
'fits the per-trigger token budget,' rested on a per-trigger number that
had no value and no source."*

### N4 — Step 14's clearing recognizer's `lengthFloor` parameter is unspecified — the plan says "length + a negative stoplist" and "substance length above the length floor" but never states the default; a load-bearing threshold whose value is unspecified is the same shape as N3, with the mission-cost concentrated on the highest-risk mechanism (the deny path's clear-axis)

**Where:** `docs/plans/plan-phase-a.md` §7 Step 14 (length floor is
tunable, no default); Step 23 seeds several defaults but not this one.

**Impact if wrong.** The clear recognizer's `lengthFloor` decides
whether an assistant text turn clears an open question. Too high, and a
substantive short answer ("no — the null check does not fix it")
fails to clear, the block wrongfully denies the next move (over-fire).
Too low, and a single-token deferral outside the deferral stoplist
("noted") clears the question, letting a drifter through (under-fire).
Both directions are mission-costly and the length floor sits between
them; the plan omits the value.

**What needs saying.** Seed the default in Step 23 with an explicit
source (or an explicit "plan judgment, tuned at exit-run"), and add the
FR-M2 detector already in Step 18 (`deny_despite_answer_text`) as a
paired sanity check that the value chosen produces an observable
false-fire rate. The current plan has the detector but not the
threshold it detects against.

### N5 — Steps 28 and 29's recursion-guard mechanism (`CTXORACLE_INTERNAL` env-var checked first in the handler) requires that "all processes the oracle spawns set this env var"; the plan does not specify HOW that is enforced in code, so a future Phase B / Phase C spawn (e.g. the model piggyback call from `model/invoke.ts`) that forgets to set the env var silently breaks the recursion protection

**Where:** `docs/plans/plan-phase-a.md` §7 Step 29 (guard mechanism);
architecture AD-21 (*"All processes the oracle spawns … set this env
var"*). Step 38's model-invocation seam stub is the first future
spawner named; §7 Step 38 does not include a "spawn must set
CTXORACLE_INTERNAL" as an interface constraint.

**Impact if wrong.** The recursion guard is what keeps a piggybacked
model call from itself firing the oracle's hooks (which would recurse
until stack blow or watchdog fire, and either would land the block-path
in an unpredictable state). Losing the guard turns the piggyback into
a fork bomb the harness eventually cuts off, but the semantics of the
denies that fire in the meantime are undefined.

**What needs saying.** Either (a) a wrapper function `oracleSpawn(cmd,
env, opts)` that all spawns MUST go through — with the wrapper setting
`CTXORACLE_INTERNAL=1` — plus a Step 41 convention grep that asserts
every `child_process.spawn`/`execFile`/etc. in `dist/**` calls this
wrapper, or (b) at Step 38, make setting the env var part of the
`ModelInvocation` interface contract (a runtime check the interface
performs, throwing if not set). The plan currently relies on
implementer discipline for a property AD-21 declares as structural.

### N6 — Step 15's grep-based confinement test greps `dist/**/*.js` for the string `permissionDecision`; the test scope excludes `test/**` and `node_modules/**` by omission, but Step 39's tests would run against a `dist/test/` if compiled there — the grep would then include test files that legitimately construct a deny for testing, producing false positives — OR Step 39's tests are compiled elsewhere (not `dist/`) in which case they never grep-check against production code paths, producing false negatives

**Where:** `docs/plans/plan-phase-a.md` §7 Step 15 (grep target
`dist/**/*.js`); Step 39 (unit tests under `test/unit/**/*.test.ts`, no
compile step specified); §5.1 skeleton (no `dist/test/` output
directory).

**Impact if wrong.** T15-2 is AC-2's structural assertion made
mechanical — the load-bearing check for FR-B1's "exactly two blocks"
absolute. If the grep target or the compile emit is unspecified, the
check silently passes for the wrong reason (see C2 above for a related
vacuous-pass hazard). This is the collapse-log 2026-08-25 lesson 4
recurring: *"an absolute silently broken by a second use of the
primitive."*

**What needs saying.** Enumerate the grep's exact scope: which files
are included, which are excluded, and the compile flow that produces
them. State whether tests that construct denies for testing (T15-1
does — the compile-fixture attempts a mutation-field response) live in
`test/build/fixtures/` (excluded from grep) or elsewhere. Verify that
the confinement test fails on a seeded violation *and* passes on a
current codebase — the current spec says the former without stating the
latter.

---

## Attacks that hit nothing / survive with note

- **S1 — D-plan-4 (`sqlite3` shell for AC-19 dump comparison).** The
  author's answer names a Node fallback and cites T32-2. Attack: two
  `VACUUM INTO` copies of the same source can differ in freelist state
  and page ordering — a dump-and-diff-by-record is the right form; a
  byte-diff is not, and the plan says so (the author's own review S4
  extracts this). The design does not rest on `sqlite3` being present;
  the fallback covers the case cleanly. **Survives.**
- **S2 — D-plan-7 (CI unit-tier every PR; fixture-tier on demand).** The
  author's answer names the reviewer as the gate on fixture-tier runs
  before merge, and cites Step 42's exit-run as an external gate. Attack:
  the reviewer for an agent-led project is another agent — self-graded
  homework. Counter: this is real, but it is not the plan's defect to
  fix; the whole project runs on independent-reviewer discipline, and the
  fixture-tier is one artifact among many that this discipline covers.
  **Survives with note** — worth watching if the review-treadmill
  process fails.
- **S3 — D-plan-2 (dependency floor pin).** The author's answer is a
  reproducibility claim: the pin makes it possible to install the
  architecture-tested version by name. Attack: the caret accepts any
  semver-compatible version, so lockfile behavior across environments is
  what actually determines reproducibility, not the pin's value. Counter:
  the pin does add value as documentation of what was tested; the caret
  is a soft commitment the ecosystem has agreed on. **Survives as a
  floor** — the reproducibility framing in step-4 ("Install times
  matching V14's tested surface by default") is a slight overclaim but
  not enough to reopen.

---

## Mission-fidelity cross-trace

The plan claims Phase A serves *"an honest deterministic foundation … that
measures its own floor — how little it catches — with clean seams the
later phases plug into."* Read against §11.5's own words:

- **"Honest deterministic foundation."** The recognizers (Step 14) are
  minimal, per the collapse-log 2026-09-04 lesson. Holds — this is the
  plan's clearest mission-alignment.
- **"Running on the owner's real repos."** Fails per C3 — the exit-run
  runs on the tool's own repo by default. Not honest against §11.5.
- **"Measures its own floor — how little it catches."** Partially fails
  per N2 (Bash-bypass detector under-measures by unspecified amount), N4
  (clearing threshold unspecified so the "how little" is a moving
  target), and P1 (lag-window wrongful-hold rate un-instrumented). The
  exit-report can carry the numbers; the numbers are not the floor.
- **"Clean seams the later phases plug into."** Fails per P4 — Step 38's
  seam interface is Phase A's guess at Phase B's needs, not a shape
  Phase B has architected against.
- **"Never fake completeness dressed to look like a working product."**
  This is the whole 2026-09-04 collapse-log entry. The plan avoids the
  recognizer over-elaboration at Step 14 (survives well). It does not
  avoid the report over-honesty (C3, N2, N4, P1) which is the same
  disease at the measurement layer instead of the mechanism layer. The
  process-layer twin of the collapse-log 2026-09-04 mechanism-layer
  lesson: *a padded measurement of an unpadded recognizer is the same
  fake-completeness the recognizer restraint was supposed to prevent.*

---

## Attestation

- **What I read in full this session (2026-09-06).**
  `docs/collapse-log.md` (all 1157 lines); `OWNER-LEDGER.md` (all 80 lines);
  `middleware/context-oracle/CLAUDE.md` (all 239 lines); `docs/STATUS.md`
  (all 109 lines); the two prior reviews on this plan
  (`2026-09-06-author-gates-review.md`, 386 lines;
  `2026-09-06-meta-check-skipped-steps.md`, 564 lines);
  `docs/reviews/2026-09-03-round-9-collapse-hunt-architecture-phase-a.md`
  (first 150 lines, for format precedent).
- **What I read in part.** `docs/plans/plan-phase-a.md` — lines 1–400
  (§1–§5), 400–475 (§5.1 skeleton), 574–860 (Steps 1–7), 1046–1220
  (Steps 11–13), 1221–1568 (Steps 14–19), 1571–1620 (Step 20), 1770–2270
  (Steps 24–32), 2410–2530 (Steps 36–38), 2585–2740 (Steps 40–43),
  2781–2825 (§9 Checkpoints), 2827–3240 (§10 + §10A), 3459–3520 (§11.5,
  §11.6), 3540–3970 (§12 test spec samples for T15/T20/T21), 4948–5250
  (§13 R1–R10, §14, §15). File is 5493 lines; the sections not opened
  are §7 Steps 8–10, 21–23, 33–35 (mid-range CLI/DAO/tuning) and the
  bulk of §12 test entries (T2–T14, T16–T40 not opened line-by-line —
  sampled selectively per the harder-question they inform).
- **What I did not attack.** Standards-conformance (the author's
  compliance review's axis); process-compliance with the skill (the
  meta-check's axis); the individual step file-references vs §5.1 (the
  author's C3/C4/C5 fixes' axis); the plan's §12 test-spec
  five-field coverage (the author's C1); factual claims that require
  fetching external documents (Node's `--experimental-strip-types`
  status was reasoned from memory of Node 22.x release notes but not
  fetched — C2 rests on that framing being right; if `node --test` in
  22.16 has since gained default TypeScript support without a flag,
  C2 downgrades to a partial or falls entirely).
- **What I did fetch or re-verify this session.** None. The mission-
  fidelity axis reasons from the spec / architecture / ledger / collapse-
  log / plan alone; every claim here is grounded in a read of one of
  those, cited inline.
- **Confidence.**
  - **High** on C1 (the framing critique lands on the plan's own §13 R1
    admission); C3 (Step 42's repo set is textually one-and-that-one);
    P1, P2 (the TOCTOU / lag mechanics are visible on close reading of
    Steps 16–17); P3 (the author's own review flagged the same hole);
    N1, N3, N4 (thresholds unspecified, textually verified); N2 (list
    incompleteness, textually verified against Step 18 body); N5 (env-var
    enforcement mechanism absent from the plan).
  - **Medium** on C2 (Node's TypeScript-loading behavior in the 22.x
    series is a fast-moving contract; the framing is right but the exact
    flag state may have shifted since my knowledge cutoff — a fresh
    Context7 fetch of the Node docs would confirm the direction of the
    finding, not the finding itself); P4 (interface too narrow is
    speculation about Phase B's needs, and Phase B is not yet
    architected); N6 (the grep scope framing is right; the exact scope
    the plan intends may be recoverable from a closer read of §12).
  - **Low** on S3 (the pin's reproducibility framing is real but thin;
    reasonable people could rate it either way).
- **How long.** Approximately 55 minutes of reviewer wall-clock,
  2026-09-06T~19:20Z–~20:15Z, across two passes: the first over §10A and
  §7 selectively; the second (after the coordinator's expanded-scope
  message) over the collapse-log, the ledger, the two prior reviews,
  spec §8/§11.5, and architecture AD-9/AD-10, then a re-read of §7
  Steps 14–19 and §10A end-to-end against the harder-question discipline.
- **What would make me revise the verdict up.** Any of C1/C2/C3 refuted
  by evidence in the plan I missed; specifically for C2, a citation to
  the compile step that produces the JS the tests load, and for C3, a
  Step 42 sentence naming the repo set beyond `Maxcogar/agent-armory`.
- **What would make me revise down.** A concrete demonstration that P1's
  wrongful-lag-hold case (b) is empirically rare on real Claude Code
  transcripts, and that N3's default-value drift is bounded such that
  the exit-run's per-genre numbers are within a plan-stated tolerance.
  Neither would move the aggregate verdict; both would remove a partial.

*End of collapse-hunt. The plan's §10A carried 11 self-attested collapse-
tests plus a closing paragraph exempting §7 from re-testing. This review
opened three of the eleven to full collapse (C1, C2, C3), left four
partial (P1, P2, P3, P4), and enumerated six load-bearing plan-level
decisions §10A's exemption structurally could not see (N1–N6). The
finding trajectory for round 1 of this artifact's review series is what
it is; per the collapse-log 2026-08-25 convergence discipline, terminal
requires the round's collapse count to be zero, and this round is not
zero.*
