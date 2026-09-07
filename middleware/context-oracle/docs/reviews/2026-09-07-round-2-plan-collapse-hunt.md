# Independent collapse-hunt — Phase A implementation plan, round 2 (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` (6097 lines), read in full this
session, at the commit produced by the 2026-09-07 fix pass described in
`docs/STATUS.md`.

**Axis:** mission-fidelity only (`CLAUDE.md` dominating rule 3 and rule 2's
collapse test). Not a second standards pass — that is `/expert-review`'s
job, and this is not that review.

**Reviewer:** independent subagent, no prior context on this session, not
the author of the plan, the fix pass, or either 2026-09-06 review.

**Read in full before the attack (per the task brief, in the stated
order):** `docs/collapse-log.md` (all 1213 lines, both pages);
`OWNER-LEDGER.md` (all 80 lines); `middleware/context-oracle/CLAUDE.md`
(all 239 lines); `docs/specs/spec-context-oracle.md` §8, §11.5, §12, §13,
§14 (and enough of §1–§10 for grounding); `docs/architecture-phase-a.md`
AD-9, AD-10, AD-11 (adjacent, needed for AD-9), AD-14, AD-15, AD-18, AD-21,
AD-24; `docs/reviews/2026-09-06-plan-collapse-hunt.md` and
`docs/reviews/2026-09-06-plan-expert-review.md` in full;
`docs/STATUS.md`; `docs/plans/plan-phase-a.md` end-to-end (every section
read, most of §7's 43 steps read line-by-line, §12 sampled at every
location a prior finding or a fix-pass claim pointed to).

## Verdict: DOES NOT SURVIVE (but converging)

- **Collapses: 1** (new — N5's `oracleSpawn` structural-confinement test
  is claimed in three places and specified in none)
- **Partial collapses: 3** (P2 not fully closed — the retracted claim
  survives verbatim in two places and as a mis-titled heading in a third;
  C3 not fully closed — its own risk-register entry (§13 R7) was never
  updated and the "concrete way to obtain a repo" gap the original review
  named is still not named; C1 not fully closed — its new enforcement
  mechanism is prose-only where every parallel "make it structural"
  decision in this same plan uses a grep, and its own risk-register entry
  (§13 R1) was never updated either)
- **New defect the fix pass introduced: 1** (Step 23's "corrected"
  disclosure asserts four of its six tuning defaults have "no
  architecture-sourced" origin; they are AD-14's own stated defaults,
  quoted near-verbatim)
- **Structural gap the fix pass's own closing paragraph admits but does
  not resolve: 1** (N1, N2, N5, N6 — and N3/N4 in the four-part sense —
  have no `CLAUDE.md` rule-2 collapse-test anywhere in the document; only
  inline Gate-3 rationale and a closing paragraph that explicitly invites
  this round to do the testing the author did not)
- **Prior findings verified closed on the current text:** C2, N4, N6, S1,
  S2, S3, M1, M2, M3, M4, m1, m2 — each re-read at its fix location and
  confirmed to resolve the harder question, not merely to mention the
  finding's ID (details below).
- **Survives with note:** N1 (honestly disclosed, but the "closes the
  owner-can't-tell hole" claim overstates what a raw identity-string diff
  means to a non-programmer, `OL-11`).

**The pattern common to every open item below is the same one shape:**
the fix pass corrected the *first* place a reader or reviewer would look —
the step body, or the specific `§10A` collapse-test entry a prior finding
named — and left the *same claim, now false*, standing in a second
location the same document also uses as its record of that decision: a
`§13` Risk entry, a `§5.1` file-comment, a `§12` test specification, or a
sub-heading title. This is `docs/collapse-log.md`'s own 2026-09-03 round-6
lesson ("a fix that names a location must land at that exact location, not
one decision away") and its 2026-08-28 lesson ("a deletion/refactor pass
has the same blast radius as a writing pass") reproducing inside a single
fix pass, at the granularity of *sections of one file* rather than
separate files. Three of the four open items below are this same defect
class, independently discovered at three different decisions.

---

## Collapses

### New-1 — N5's `oracleSpawn` structural-confinement test (`T41-1d`) is asserted to exist in three places and specified in zero; the recursion guard the fix pass added specifically to make AD-21 "structural instead of implementer discipline" has no actual CI check anywhere in this plan

**Where the claim is made:**
- Step 2.5 (`docs/plans/plan-phase-a.md:754-759`): *"`T41-1d` (CI
  convention grep: `dist/**/*.js` contains no
  `child_process.spawn`/`execFile`/`fork` call outside
  `dist/proc/oracle_spawn.js` — added to Step 41's existing convention
  suite alongside `T41-1a`–`T41-1c`)."*
- Step 21 (`:1857-1859`): *"`T21-2` (`refreshIfStale`'s spawn call is
  `oracleSpawn`, not `child_process.spawn` directly — compile-time/
  structural, paired with `T41-1d`)."*
- §5.1 skeleton (`:421`): `oracle_spawn_confined.test.ts # T41-1d (N5 —
  see Step 2.5)`.

**Where it should be defined and is not:**
- Step 41's own body (`:2960-2989`) lists exactly **three**
  `test/conventions/` files (`no_direct_dao_from_handler.test.ts`,
  `hook_field_names_isolated.test.ts`,
  `permission_decision_confined.test.ts`) — no fourth file, no mention of
  `oracle_spawn_confined.test.ts` or `T41-1d` anywhere in the step. Its
  own **Dependencies** field (`:2980`) reads *"Steps 15, 28"* — not
  Step 2.5, which is the step whose output this fourth test would need to
  grep for.
- Step 41's own **Verification** field (`:2982-2983`) reads: *"`T41-1`
  (all **three** convention tests fail on a seeded violation and pass on
  the current codebase)."* Three, not four — unchanged by the fix pass.
- §12's `T41-1` specification (`:4528-4544`), the actual test
  specification a reviewer or implementer would build from, states:
  *"**File.** `test/conventions/` (**three** sub-files: …)"* — the same
  three, and its **Data** section describes two states *per convention*
  with no mention of a fourth convention or an `oracleSpawn`-confinement
  scenario.

**Why this is a collapse, not a partial.** N5's entire stated purpose
(Step 2.5, `:731-733`) is: *"a structural property needs a structural
confinement, not implementer discipline"* — explicitly generalizing
AD-10's lesson (deny confinement enforced by a CI grep, not a convention)
to the recursion guard. The fix pass built the wrapper function
(`oracleSpawn`) and wired two real callers to it (Step 21's
`refreshIfStale`, Step 38's future `ModelInvocation`) — that part is real
and well-built. But the one thing that makes this "structural" rather
than "the same implementer-discipline failure mode AD-10 already
rejected" (Step 2.5's own words) is the CI grep, and that grep is never
actually specified. As the plan stands, nothing prevents a future spawn
site — including a careless edit to `refreshIfStale` itself, or a
mis-wired Phase B `model/invoke.ts` — from calling `child_process.spawn`
directly with no test catching it, which is exactly the failure N5 was
raised against and exactly the failure the fix pass's own rhetoric claims
to have closed. This is the textbook shape the task brief asked this
round to hunt for: *a fix is where the next collapse hides* — N5's fix
introduced a new promise (`T41-1d`) into three locations and never kept
it in the fourth (the only one that matters, since it is the one that
becomes code).

**What resolves it.** Add the fourth sub-file to Step 41's own "What
changes" list and Dependencies field (Step 2.5 is a dependency), and add
a real `T41-1d` entry to §12 alongside `T41-1` — a seeded violation (a
temporary spawn call added outside `oracle_spawn.ts`) that the grep must
catch, mirroring the state-transition technique the other three
convention tests already use.

---

## Partial collapses

### P2 (2026-09-06, "L11(b) design-safe either way") — not fully closed: the retracted claim survives verbatim in two locations and as a self-contradicting heading in a third

**What was fixed, and where.** Step 18 (`:1648-1658`) adds
`checkDenyFromInjectedTurn`, honestly stating the transient wrongful-deny
case exists. §15 Q-gap-4's body (`:5941-5967`) is explicitly headed
*"(corrected — collapse-hunt P2 found the original 'either way no
wrongful deny' claim overclaimed against V1's documented async transcript
lag)"* and states the honest, narrower claim: *"design-safe against a
persistent wrongful deny, but NOT against a transient one."* This is a
genuine, correct fix at its primary location.

**What was not fixed.**
- §10, D-plan-6 (`:3267-3279`), the plan's own decision-rationale entry
  for exactly this question, still reads, unedited: *"If UPS fires for a
  platform-injected turn, intake opens a question row from the `prompt`
  field and AD-9's voiding guard closes it on the next catch-up when the
  marker is `task-notification`. If UPS does not fire, intake never sees
  the injected turn. **Either way no wrongful deny is emitted.**"* This is
  the exact sentence P2 quoted and refuted. A reader who consults §10 (the
  document's own decision log) rather than §15 (the gap register) is told
  the false, already-disproven version.
- §5.1's file skeleton (`:497`) still comments the file as: `l11_b_
  disposition.md # L11(b) — design-safe both ways (§15 Q-gap-4); no
  probe` — same overclaim, in the file map.
- §15 Q-gap-4's **own sub-heading** (`:5929-5931`) reads: *"**L11(b)** —
  whether `UserPromptSubmit` fires for platform-injected turns:
  EMPIRICALLY UNRESOLVABLE INSIDE THIS CONTAINER, **DESIGN-SAFE EITHER
  WAY.**"* — immediately followed, one paragraph later, by the corrected
  text explaining it is *not* safe either way. The heading and its own
  body contradict each other inside the same entry; a skim-reader (which
  is exactly how headings get used) walks away with the false claim.

**Why partial, not full.** The substance is fixed once (Step 18's
counter is real and correctly reasoned); the documentation of that fix
did not sweep the two other places the same sentence lives, and one of
those places is the very entry the fix pass added specifically to record
the correction.

**What resolves it.** Edit `:3276-3277` to state the corrected asymmetry
(persistent-safe, transient-not, measured by `deny_from_injected_turn`);
edit `:497`'s comment to match; retitle the Q-gap-4 sub-heading at
`:5929-5931` to something that does not contradict its own next sentence
(e.g. *"design-safe against a persistent wrongful deny; transient case
measured, not eliminated"*).

### C3 (2026-09-06, exit-run repo set) — Step 42's fix is real, but its own risk-register entry (§13 R7) still describes the pre-fix mitigation, and the fix still does not name a concrete way to obtain a non-self repo

**What was fixed.** Step 42 (`:2993-3086`) is a genuine, well-reasoned
fix: it names the exact defect (self-referential documentation coupling),
requires a `SINGLE-REPO / SELF-REFERENTIAL — NOT REPRESENTATIVE` label on
the report's first line when no non-self repo is available, and — this is
the important part C1 had asked for — instructs Step 43's hand-off to
state the real-repo floor as *unmeasured*, not to cite the self-referential
numbers as Phase A's honest floor. This is a correctly-shaped disclosure
fix, not a cosmetic label.

**What was not fixed.** §13, Risk **R7** (`:5492-5498`) — the document's
own risk register, which a reader checking "what could go wrong with the
exit run and how is it mitigated" would consult — is unedited from before
the fix pass and still reads: *"Mitigation: the exit script supports a
`.ctxoracle-exit-repos` file the owner supplies; the report explicitly
states the repo set it measured; **Phase B design consumes what exists
and asks for more data where needed**."* That last clause is the exact
sentence the 2026-09-06 collapse-hunt quoted and rejected (*"R7's
mitigation … accepts that a bad exit measurement will propagate through
Phase B"*). R7 does not mention Step 42's actual, stronger mechanism (the
mandatory label, the "not to be cited as the honest floor" instruction)
at all.

**A second, independent gap in the fix itself.** Step 42's mechanism for
obtaining a non-self repo is: check `.ctxoracle-exit-repos` for an entry
"drawn from whichever of Max Cogar's own repositories … are present in
the environment the exit run executes in" (`:3010-3013`). This states the
*check*, but not a *mechanism to make a repo present* — the plan does not
instruct the implementer to clone one, request one from Max Cogar, or
attach one via any tool available in this project's own tooling (e.g. the
session's own repo-attach affordance). Given `CLAUDE.md`'s "containers are
ephemeral" framing and that this plan's own Phase A build runs in exactly
such a container, the realistic default outcome is that no non-self repo
is ever present unless a human deliberately arranges it outside this
plan's steps — meaning the honest `SINGLE-REPO` label is not a safety net
for an edge case, it is very likely the actual, permanent outcome the
build will need to declare. That is a legitimate and acceptable Phase A
result under the honest-floor goal, but the original review's request (b)
— "name a concrete way to obtain it" — is still not answered; the plan
answers only what happens when it is not obtained.

**Why partial, not full.** The disclosure logic is sound and mission-
aligned; the register entry that should reflect it does not, and the
"obtain a real repo" half of the original ask is still open, now honestly
so rather than silently so.

**What resolves it.** Rewrite §13 R7 to state Step 42's actual mechanism
and its disclosure requirement, dropping the "Phase B design consumes
what exists" framing the review already rejected; either name a concrete
attach/clone mechanism for a second repo (even "the implementer asks Max
Cogar, in the exit-run's own summary output, to name a second repository
and re-run" is more concrete than the current silence) or explicitly
declare that no such mechanism exists in this build's environment and the
`SINGLE-REPO` label is Phase A's expected, not exceptional, outcome.

### C1 (2026-09-06, build-order review-treadmill risk) — the new write-time cap is real but unenforced by any mechanism, unlike every parallel "make it structural" decision in this same plan, and §13's own Risk R1 entry was not updated to mention it

**What was fixed.** D-plan-1's revised §10A answer (`:3332-3355`) is a
substantive improvement over the original (which the 2026-09-06 hunt
correctly called "true but irrelevant"): it introduces a **write-time
cap** — Step 14's recognizer is capped to exactly the predicate/threshold
list named in Steps 14/18/23, and any addition (even one needed to make an
AC-2* fixture pass) requires its own new §10A entry before it may be
added; Checkpoint 2 is explicitly amended to require fixing the fixture's
scenario against the existing predicate list first, never silently
widening the recognizer. This directly answers the harder question the
prior round asked ("what stops Checkpoint 2's fixture-gate from becoming
the review treadmill") with a real mechanism, not a restatement of `P9`.

**What is missing.** The cap is enforced by nothing but the implementer's
own memory of this paragraph. Every other place in this plan that makes
an equivalent "this must not silently grow" claim gets a CI-enforced
structural check: AD-10's deny confinement gets `T15-2`'s built-output
grep; N5's recursion guard gets (the still-unspecified, see New-1 above)
`T41-1d`; AD-6's adapter isolation gets `T41-1a`/`T28-2`. D-plan-1's
write-time cap is the one "make it structural, not discipline" claim in
this document that is not, in fact, made structural — it is exactly the
"implementer discipline" pattern Step 2.5 itself names as the failure
mode to avoid (`:731-733`), applied here to the single highest-risk
recognizer in the whole plan. A mechanical version is not hard to state:
a snapshot/golden test over `qa/classify.ts`'s exported predicate list
(the exact stoplists, the exact tool set, the exact length floor) that
fails on any addition not already named in Steps 14/18/23 — the same
"golden enumeration" shape AD-17's `T6-1` already uses for fault codes.

**A second gap.** §13's Risk **R1** (`:5439-5447`), the document's own
risk-register entry for this exact concern, is unedited from before the
fix pass: it still cites the *old* mitigation set ("Steps 14, 25 cite the
collapse-log explicitly … Checkpoint 5 explicitly flags a suspiciously-
high coverage number") with no mention of the new write-time cap at all.
A reader who checks §13 (rather than digging into D-plan-1's §10A entry)
would not learn the cap exists.

**Why partial, not full.** The reasoning is genuinely stronger and the
mechanism, if actually implemented as described, is a real gate at the
right point in the build. It fails only on enforceability and on the same
document-sync gap found twice above.

**What resolves it.** Either accept the cap as a documented discipline
only (and say so explicitly, rather than calling it "not a post-hoc
report flag" — `:3353`, which implies more rigor than a memory-only rule
provides) or add the golden-enumeration test described above and cite it
from Step 14's own Verification field; either way, sync §13 R1 to
whichever is chosen.

---

## New defect the fix pass introduced

### Step 23's "corrected" bar-defaults disclosure is itself inaccurate: four of its six numbers are not "unsourced plan judgment" — they are AD-14's own stated architecture defaults, quoted almost verbatim

**Where.** `docs/plans/plan-phase-a.md:1923-1938` (Step 23, "Corrected
framing (collapse-hunt N3/N4)"): *"These numbers are **plan-seeded
starting values with no external or owner source**, not standard- or
architecture-sourced constants — exactly the 'numbers without sources
don't go in' rule this plan's own §3 states, applied honestly to the
plan's own defaults instead of exempting them."* Then lists:
`bar.confidence_floor = "0.6"`, `bar.support_min = "3"`,
`bar.noise_floor_support_min = "2"`, `bar.impact_read_min_coupled = "2"`,
`bar.reuse_dominance_k = "3"`, `bar.clear_length_floor = "40"`.

**What the architecture actually says.** `docs/architecture-phase-a.md`
AD-14 (`:1104-1110`), read this session: *"Ship-high defaults, all
tunable rows in `tuning` (AD-5), all marked illustrative: non-hazard `c`
floor **0.6** with `support ≥ 3`; impact floor: speak on edit-context
always when other axes pass, on read-context require blast-radius band
**≥ 2** coupled files; noise floor `support ≥ 2`."*

**The mismatch.** Four of Step 23's six values —
`confidence_floor=0.6`, `support_min=3`, `noise_floor_support_min=2`, and
`impact_read_min_coupled=2` — are not plan inventions at all; they are
copy-pasted from AD-14's own text, which explicitly attributes them to
the architect (`D-6bar`) and grounds them, loosely, in the spec §9 ROSE
note. Step 23's blanket claim that *none* of its six numbers are
"architecture-sourced constants" is verifiably false for these four. Only
`bar.reuse_dominance_k` (a bare "tunable, stored" mention in AD-15, no
concrete number given there) and `bar.clear_length_floor` (genuinely
absent from the architecture, N4's actual finding) are new plan-level
judgments with no architecture-stated value.

**Why this matters on the mission-fidelity axis, not just as an
accuracy nit.** This project's own collapse-log (2026-08-13, 2026-08-25
item 3, and the 2026-09-07 entry read at the top of this review) treats
"asserted, not established" self-referential claims as the single most
recurring failure class in this codebase — the exact rule Step 23 invokes
("numbers without sources don't go in") to justify its own honesty. The
correction for N3/N4 overcorrected: it downgraded four numbers that
*were* already decided and reviewed-to-convergence at the architecture
layer (AD-14, itself a document that survived nine independent review
rounds) into "the plan invented these," which both (a) is false, and (b)
quietly implies the exit-run's calibration of these four values is
starting from a less-grounded place than it actually is — understating
provenance is the same class of error as overstating it, just in the
opposite direction, and it happens inside the very paragraph written to
fix the opposite-direction error.

**What resolves it.** Split Step 23's disclosure in two: state that
`confidence_floor`, `support_min`, `noise_floor_support_min`, and
`impact_read_min_coupled` are AD-14's own stated architecture defaults
(cite `AD-14`, note they are themselves labeled illustrative /
Phase-A-calibrated there, not spec-fixed), and that `reuse_dominance_k`
and `clear_length_floor` are genuinely new, unsourced plan judgments
(N4's actual finding) — rather than treating all six as one undifferentiated
class.

---

## Structural gap the closing paragraph admits but does not resolve

`CLAUDE.md` dominating rule 2 requires *"a separate four-part
collapse-test on each load-bearing decision, in writing"* — one sentence
naming the job, the single hardest question, a cited answer, and what the
decision steers toward. In this plan that four-part format lives only
under the `####` headings in §10A (`docs/plans/plan-phase-a.md:3321-3612`,
grep-verified: exactly the eight `D-plan-*` entries plus three
"Plan-level" entries, eleven headings total, unchanged in count from the
2026-09-06 review). **None of N1 (Step 5 URL normalization), N2 (Step 18
`deny_bypass_suspect` coverage bound), N3/N4 (Step 23/14's tuning
defaults), N5 (Step 2.5's `oracleSpawn` wrapper), or N6 (Step 15's grep
scope) has its own `####` collapse-test entry.**

The closing "Coverage attestation" paragraph (`:3614-3633`) is honest
about this — it does not claim these five decisions were collapse-tested;
it says their reasoning is disclosed "in the open, above and in this
section" (i.e., in the step body's own Gate-3 rationale, which is a
different, weaker discipline: Gate-3's four parts are decision / standard
/ why-it-applies / what-it's-not, never "the hardest question a skeptic
would ask"), and explicitly invites this round's hunt to test them. That
is the right thing to write when the work has not been done, rather than
fabricating a passing self-test — the collapse-log's 2026-08-25 item 3
lesson ("an in-document self-test never discharges the mandatory
independent hunt") is respected here, not violated.

But it means rule 2 is not actually satisfied for these five decisions as
of this text, and the fix pass's own framing in `docs/STATUS.md` ("all six
resolved") reads as stronger than what the document does: it resolved the
*content* of N1–N6 (a real value for the length floor, a stated coverage
bound, a stated normalization axis list, a wrapper function) without
performing the *procedure* rule 2 requires on any of them. This round
performed that procedure on N2 and N5 above (both produced real findings)
and on N1 below (survived, with a note); N6 was checked against the
concrete failure mode the 2026-09-06 review raised (a vacuous grep) and
holds — `T15-2`'s scope is `dist/` only, built via a real `tsc` emit
distinct from `dist-test/`, so the grep cannot pass vacuously the way the
prior round found it could.

### N1, tested — survives, with a note on what "closes the hole" actually means for a non-programmer owner

**Harder question.** Step 5 (`:894-901`) leaves scheme unification
(SSH vs HTTPS) explicitly out of scope and states the mitigation is that
`status` "displays the full normalized identity string (not just the
`mode` label) … closing the 'owner can't tell' hole the review named."
`OL-11` establishes Max Cogar is a non-programmer by design. Does showing
a raw normalized-identity string in `status` actually let a non-programmer
notice that two clones of the same repository silently key to two
different stores — or does it only make the information *technically
present* without making it *actionable*?

**Answer, tested against the ledger.** `OL-11` says design, diagnosis,
and interpretation are the agent's job, not his; nothing in `OWNER-LEDGER.md`
CONFIRMED establishes that Max Cogar can or would compare two opaque
identity strings across two separate `status` invocations (on two
different clones, likely run at different times, possibly by different
agents) and conclude "these are the same repo, keyed twice." The
mitigation is real in the sense that the data is not hidden, but "closing
the hole" overstates what raw data-presence does for OL-11's stated
audience. This does not rise to a collapse — the underlying limitation
(no scheme unification) is honestly declared open, not hidden, and the
architecture (`AD-3`) genuinely never decided this axis, so N1 is a
legitimate plan-level judgment, correctly disclosed as one. It survives
as a limitation whose *language* ("closing the hole") is a shade stronger
than what the mechanism delivers, not as a hollow decision.

**What would tighten it (not required to close this review).** A `status`
line that flags "N repo stores share the same root-commit history but
different keys" would be an actual closing of the hole; displaying the
raw string is a diagnostic breadcrumb an *agent* could use on Max Cogar's
behalf, which is arguably the more honest framing given `OL-11`.

---

## Attacks that hit nothing / survive with note

- **C2 (2026-09-06, `node:test` cannot execute `.ts`).** Fully resolved.
  Step 1 (`:611-626`) adds `tsconfig.test.json` compiling `src/`+`test/`
  to `dist-test/`; the CI workflow and Step 39's Verification field both
  run the compiled `.js` output; `T1-1` (`:640-648`) explicitly
  distinguishes "0 tests found because none exist yet" (Step 1) from the
  original failure mode (files exist but do not load). Cross-checked at
  `T15-1`/`T15-2` (`:4322-4351`), which correctly keep `dist/` (production,
  `T15-2`'s grep target) and `dist-test/` (compiled tests, where `T15-1`'s
  deliberately-failing fixtures live) structurally distinct so the two
  never collide. This is a real, mechanically sound fix, not a relabeling.
- **N4 (Step 14's clearing-recognizer length floor, unspecified).**
  Resolved: `bar.clear_length_floor = "40"` is now seeded (Step 23,
  `:1938-1946`), its derivation stated plainly ("the shortest canonical
  non-deferral sample in T27-1's fixture set minus margin — an
  internally-consistent starting point, not an externally sourced one"),
  and paired with `checkDenyDespiteAnswerText`'s existing detector as the
  measured sanity check the original finding asked for. Honestly framed;
  survives.
- **N6 (Step 15's grep scope ambiguity).** Resolved: `T15-2`'s scope is
  explicitly `dist/**/*.js` (production build only), `T15-1`'s
  mutation-field fixtures compile under `tsconfig.test.json` to
  `dist-test/` and are explicitly excluded from `T15-2`'s grep target
  (`:1439-1447`) — the vacuous-pass hazard the original review raised (if
  `dist/` were never populated) cannot occur because Step 1's C2 fix
  makes `dist/` a real, separately-built production emit.
- **S1 (Step 31 → Step 32 topological violation).** Resolved: Step 31
  (`:2410-2414`, `:2448-2450`) now calls `runIndex` (Step 21) directly as
  a function import, explicitly citing "not Step 32's CLI verb" and
  citing the S1 finding by review filename. Step 32's `index` verb
  (`:2471-2473`) calls the same function. Dependencies field corrected to
  cite Step 21, not Step 32. Clean resolution.
- **S2 (missing Verification-genre acceptance test).** Resolved: `T25-8`
  (`:4851`) and `T25-9` (`:4876`) exist as full test specifications (not
  just names), and Step 25's Verification field (`:2102-2113`) now
  correctly states five per-genre tests + four cross-cutting mechanism
  tests + the two new genre tests, replacing the false "one per genre"
  claim (also closes m2).
- **S3 (Q-gap-5 non-deliverability).** Resolved at its root cause rather
  than waived: the disposition (§15, `:5969-6019`) matches
  `docs/collapse-log.md`'s own 2026-09-07 entry read at the top of this
  review — CodeGraph and Clear Thought were actually built and
  registered this session (verified by that collapse-log entry
  independently, not merely asserted here), and the plan's own judgment
  calls made without them are disclosed by name rather than hidden. This
  is a genuine root-cause fix, not an escalation-avoidance move.
- **M1 (fixture repos not enumerated in §5.1).** Resolved: §5.1
  (`:468-493`) now lists every named fixture repo with its T-ID.
- **M2 (duplicate `hook_field_names_isolated.test.ts`).** Resolved:
  single file, single path (`:416-419`), with an inline note explaining
  it serves both the unit-check and CI-convention role from one location.
- **M3 (T15-1 covers only one of two mutation fields).** Resolved: two
  fixtures, `updatedInput` and `updatedToolOutput`, both named at
  `:4331-4336`.
- **M4 (Step 39's Dependencies under-specified).** Resolved: Step 39
  (`:2867-2878`) now states explicitly that it is a per-step
  consolidation, not an independent build unit, and names its real
  dependency set as "every step in §5.1's `test/unit/` listing."
- **m1 (Step 39 verification glob misses `test/build/`,
  `test/conventions/`).** Resolved: Step 39's Verification field
  (`:2880-2887`) now runs all three non-replay globs.

---

## Mission-fidelity cross-trace

Reading `docs/plans/plan-phase-a.md` against `CLAUDE.md` dominating rule 3
and spec §11.5's own words, as the round-1 review did:

- **"Honest deterministic foundation."** Holds, more strongly than
  round 1 found — the recognizers (Step 14) are still minimal, and
  D-plan-1's new write-time cap (partial collapse above notwithstanding)
  is a real, if unenforced, attempt to keep them that way through the
  build rather than only at review time.
- **"Running on the owner's real repos."** Improved but not closed — the
  Step 42 disclosure requirement is real and mission-aligned (a padded
  measurement is now structurally hard to ship silently), but the "how do
  we actually get a second repo" question the original C3 asked for
  remains unanswered, and the risk register (§13 R7) does not yet reflect
  even the improvement that exists.
- **"Measures its own floor — how little it catches."** N2's disclosure
  (the Bash-bypass detector's coverage bound, honestly enumerated) is a
  genuinely good instance of this principle — until it turns out (New-1
  above, a distinct but related finding) that the promised `status`
  rendering of that disclosure (the "residuals section") is never
  actually built anywhere in the plan's own `status` step (Step 33) or
  test spec (`T33-1`). The honest floor is written in the step's prose
  but not wired into the artifact Max Cogar actually reads.
- **"Clean seams the later phases plug into."** The `oracleSpawn`
  addition is a real seam improvement in design; its confinement test's
  absence (New-1) means the seam is not yet *closed* the way AD-10's deny
  confinement is closed.
- **"Never fake completeness dressed to look like a working product."**
  This is the axis the fix pass took most seriously and, in the main
  mechanism (Step 14's recognizer, the exit-run disclosure), earned real
  credit for. The residual failures found this round are not fake
  completeness at the mechanism layer again — they are *documentation
  consistency* failures: a real fix at one location, an unfixed
  duplicate claim at another. That is a smaller, narrower disease than
  round 1 found, but it is the same disease's cousin: a reader trusting
  the *nearest* stated claim (a heading, a risk-register line, a file
  comment) rather than tracing every mention of a decision to its most
  recently corrected version would still walk away with a false belief
  about three separate mechanisms in this document.

---

## Attestation

- **What I read in full this session (2026-09-07).**
  `docs/collapse-log.md` (1213 lines, two Read calls); `OWNER-LEDGER.md`
  (80 lines); `middleware/context-oracle/CLAUDE.md` (239 lines);
  `docs/STATUS.md` (149 lines); `docs/specs/spec-context-oracle.md`
  (1139 lines, full read); `docs/reviews/2026-09-06-plan-collapse-hunt.md`
  (823 lines) and `docs/reviews/2026-09-06-plan-expert-review.md`
  (843 lines), both in full; `docs/plans/plan-phase-a.md` — every section
  read: lines 1–600 (front matter, scope, file map), 600–1100 (Steps
  1–9), 1100–1650 (Steps 10–18), 1649–1950 (Steps 18–23), 1949–2350
  (Steps 23–30), 2349–2750 (Steps 30–38), 2748–3100 (Steps 38–43),
  3097–3400 (§8–§10A through D-plan-3), 3397–3700 (§10A D-plan-4 through
  §11.2), 3637–3916 (rest of §11 skimmed for the claims cited above),
  4322–4351, 4528–4557, 4620–4690, 4851–4900, 5119–5150 (targeted §12
  test-spec verification for every fix this review checked), 5434–5734
  (§13 Risks, §14 Question register), 5784–6097 (§15 Gaps, §16
  Post-completion, end of plan). Not read line-by-line: the bulk of §12's
  ~60 test-spec entries not named above (T2 through T14, T20–T24,
  T27–T32, T34–T40 bodies) — sampled only where a specific fix claim
  pointed there; these were spot-checked, not exhaustively re-verified,
  and a defect purely internal to one of those un-sampled entries would
  not have been caught by this round.
- **What I read from `docs/architecture-phase-a.md`.** AD-9 (lines
  736–923), AD-10 (924–946), AD-11 (947–996), AD-12–AD-13 (997–1072),
  AD-14 (1073–1129), AD-15 (1130–1178), AD-16–AD-19 (1179–1376), AD-20
  (1377–1413), AD-21 (1414–1446), AD-22–AD-23 (1447–1512), AD-24
  (1513–1602, the section's first ~90 lines; its tail past line 1602 was
  not read this session).
- **What I did not attack.** Standards-conformance and citation-format
  discipline (that is `/expert-review`'s axis, already run 2026-09-06 on
  round 1; this round did not re-invoke it); the individual §12 test
  entries not named above; anything requiring a fresh external fetch
  (Node's `--experimental-strip-types` status, `web-tree-sitter`'s
  current npm version) — this review reasons from the plan's own citation
  of those facts (§3, §11.4), not from re-fetching them, matching the
  scope the task brief set (spec/architecture/ledger/collapse-log as
  ground for the mission-fidelity axis).
- **What I fetched or re-verified this session.** None externally; every
  claim in this review is grounded in a `Read` of one of the files above,
  cited by file and line.
- **Confidence.**
  - **High** on New-1 (T41-1d absence — verified by reading Step 41's
    body and its §12 spec directly, both explicitly say "three"), P2
    (verbatim string match on the retracted sentence, confirmed present
    at three locations by direct read), C3's R7 gap (direct read of §13
    R7 shows no edit), C1's R1 gap (direct read of §13 R1 shows no edit),
    and the Step 23 / AD-14 numeric mismatch (both texts read and
    compared directly, values match exactly).
  - **Medium** on C1's "unenforced cap" framing being a genuine defect
    rather than an acceptable design choice — reasonable people could
    argue a process-only cap is adequate for a single, well-understood
    recognizer, and the plan's own §13 R1 gap is the stronger, less
    debatable part of this finding.
  - **Medium** on N1's "survives with note" — the practical value of a
    raw identity-string diff to a non-programmer owner is a judgment
    call, not a fact with a citable ground truth.
  - **Low-to-none** on anything in the ~40% of §12 not directly sampled;
    a defect purely local to one of those entries is a blind spot of
    this round, not a claim this review makes either way.
- **How long.** Full end-to-end read of the plan (6097 lines) plus both
  prior reviews, the spec, the relevant architecture sections, the full
  collapse-log, and the ledger, cross-referencing every one of the 21
  prior findings against its current fix location before writing any
  new-finding text.
- **What would make me revise the verdict up (to SURVIVES).** Evidence
  that Step 41/T41-1 was in fact updated to a fourth sub-file somewhere
  this review's Read calls missed (would resolve New-1 to a documentation
  slip rather than a collapse); a §13 sweep pass this review did not
  discover that syncs R1/R7 to their current fix locations (would resolve
  both remaining partials to "closed, just formatted differently than
  expected"). Neither Step 23's AD-14 mismatch nor P2's stale-heading
  finding would be affected by anything found in §12, since both are
  verified by direct textual comparison of two already-fully-read
  passages.
- **What would make me revise down further.** A demonstration that the
  write-time cap (C1) or the `oracleSpawn` confinement (New-1) is in fact
  routinely violated in practice once Step 14/Step 21 are actually
  implemented — this review only established that the *plan* does not
  specify the check, not that an implementer would necessarily fail to
  add one anyway.

*End of round-2 collapse-hunt. Trajectory across the two rounds on this
plan: round 1 — 3 collapses, 4 partials, 6 missed decisions, DOES NOT
SURVIVE; round 2 — 1 collapse, 3 partials, 1 new self-referential-accuracy
defect, 1 admitted-but-unresolved procedural gap (N1/N2/N5/N6's missing
formal collapse-tests), DOES NOT SURVIVE. The magnitude has shrunk by
roughly two-thirds and the surviving defects are narrower (documentation
sync within one already-fixed decision, rather than the decision itself
being hollow) — consistent with the convergence shape
`docs/collapse-log.md`'s 2026-08-25 entry describes, but not yet at the
zero-collapse round that entry defines as terminal.*
