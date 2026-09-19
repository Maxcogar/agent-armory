# Independent expert-review — the dispatch-stub-at-Step-1 fix to `docs/plans/plan-phase-a.md`

**Date:** 2026-09-19
**Reviewer:** independent fresh session. I did not author this fix, the plan, or
any prior round. Every claim below is re-derived from the current source in this
working tree and from mechanical execution in this session, not imported from
the diff's own prose or from `docs/STATUS.md`'s narrative.

**Artifact under review:** the sole uncommitted change in this working tree —
`git -C /home/user/agent-armory diff -- middleware/context-oracle/docs/plans/plan-phase-a.md`
(confirmed via `git status`: exactly one modified file, nothing staged). The
diff moves the creation of `src/cli/dispatch.ts` from Step 28 to Step 1 (as a
minimal unknown-verb stub that Step 28 and Steps 31–35 then `modify`/extend),
and updates the §5.1 generated table, Step 1's body/Creates/Gate-3 "What this is
NOT" list, and Step 28's body/Creates/Gate-3 "The decision" to match.

**Nature:** first-time review of this specific fix (no prior round addressed
it — see Finding 3's evidence).

**Standards evaluated against:** the plan's own D-plan-1 invariant ("no
Verification field names a test that cannot run at its step," `plan:5074-5075`);
`AD-25` (packaging: `tsc`-only build, `bin` target) and `PA-12`
(`plan:179`, "Packaging (AD-25)"); the plan's own §11 "Verification of factual
claims" citation convention (every tool/library-behavior claim in this plan
carries a dated, executed primary-source citation); `CLAUDE.md`'s "Verify
before you assert" standing rule and its engineering-standard bullet ("Verify
external facts … against current primary sources before building on them");
`CLAUDE.md` dominating rule 2 (no hollow decisions) and the mandatory
session-end/doc-sync protocol (`docs/STATUS.md` rewritten whenever the project
changes; `tools/check_docs.py` check 6).

**Environment:** git repository at `/home/user/agent-armory`, branch
`claude/serene-noether-8betiq`; Node v22.22.2; TypeScript 6.0.2 (global,
used only for my own independent verification below, not the plan's pinned
5.9.3 — noted where it matters).

---

## 1. Correctness — cross-reference consistency

I traced every cross-reference the task named and read each one from the
current file (not from the diff's own prose):

- **§5.1 generated table** (`plan:456-457`, current working tree):
  `src/cli/dispatch.ts | create | S1` and `| modify | S28, S31, S32, S33, S34,
  S35`.
- **Step 1 step-decl** (`plan:833-841`): `create:` now lists
  `middleware/context-oracle/ctxoracle/src/cli/dispatch.ts` alongside the other
  Step-1 artifacts; `tests: [T-1-1, T-1-2, T-1-3]` unchanged.
- **Step 28 step-decl** (`plan:3519-3529`): `create:` no longer lists
  `dispatch.ts`; `modify:` now lists
  `.github/workflows/context-oracle-ctxoracle.yml,
  middleware/context-oracle/ctxoracle/src/cli/dispatch.ts`; `depends_on:`
  already included `S1` (unchanged by this diff — it needed `S1` anyway for
  `package.json`/`tsconfig.json`).
- **Steps 31–35 step-decls** (`plan:3946-3950`, `4086-4090`, `4171-4175`,
  `4283-4287`, `4344-4348`): each already declared `modify:
  [...src/cli/dispatch.ts]` and `depends_on` chains that reach `S28`
  transitively (S31→S28; S32→S28,S31; S33→S28; S34→S30,S33→…→S28; S35→S31→S28).
  These five step-decls were **not touched** by this diff — they already
  matched the corrected table, so the diff needed to fix only Step 1 and Step
  28 to make the whole chain consistent. Verified by direct `grep`/`Read`, not
  inferred.
- **Step 1 body** (`plan:880-891`): the new paragraph correctly describes the
  stub ("a manual verb switch that registers no verbs at this step: any
  argument is an unknown verb … imports nothing") and states the reason
  precisely: "so `T-1-1`'s `dist/src/cli/dispatch.js` assertion holds at Step
  1, on every CI run, and at Checkpoint 1, instead of being red until Step
  28."
- **Step 1 Gate-3, "What this is NOT"** (`plan:992-999`): states the
  counterfactual explicitly — a `bin` pointing at a file `T-1-1` requires but
  that doesn't exist until Step 28 "would be red for Steps 1–27." I
  independently confirmed this counterfactual is exactly what the
  pre-fix, currently-committed plan does (§2 below) — the claim is not
  rhetorical, it describes the actual prior defect.
- **Step 28 body** (`plan:3557-3568`): now reads "Extend Step 1's
  `src/cli/dispatch.ts` — its `bin` entry stub (…, unknown verbs errored at
  Step 1) — registering, at this step, the internal verbs…" — consistent with
  Step 1's stub description and with the step-decl's `modify:` (not
  `create:`).
- **Step 28 Gate-3, "The decision"** (`plan:3683-3686`): "The CLI `bin` entry
  is Step 1's `src/cli/dispatch.ts` stub, extended here … not re-created —
  its creation is Step 1's packaging decision (AD-25)." Consistent with
  `AD-25` (`docs/architecture-phase-a.md:1630-1648`, packaging/install: one
  npm package, `bin`, `tsc`-only build) and `PA-12` (`plan:179`, "Packaging
  (AD-25)") — both citations resolve to real, on-point sources.
- **Step 1 / Step 28 "Creates" lines** (`plan:937`, `plan:3673`): Step 1's
  list now includes `` `src/cli/dispatch.ts` — the `bin` target stub …,
  extended by Steps 28 and 31–35 (AD-25) ``; Step 28's list no longer
  mentions `dispatch.ts`. Mutually exclusive and correct.

**Verdict on correctness: the change is internally consistent.** Every
cross-reference named in the task (step-decls, §5.1 table, dependency order,
`T-1-1`'s spec, Step 28's prose) agrees on the same fact: `dispatch.ts` is
created once, at Step 1, as a minimal stub, and extended (never re-created) at
Steps 28, 31, 32, 33, 34, 35.

## 2. The defect this fixes is real, not hypothetical

I did not take the diff's own "would be red for Steps 1–27" claim on faith. I
checked it against the last **committed** state of the plan (`git show
5b83fdd:middleware/context-oracle/docs/plans/plan-phase-a.md`, `5b83fdd` being
current `HEAD` / `origin/main`):

```
456:| middleware/context-oracle/ctxoracle/src/cli/dispatch.ts | create | S28 |
```

and its `T-1-1` spec, committed, unchanged:

```
- **T-1-1 — Package skeleton builds cleanly.**
  - **Verifies.** Step 1 — `npm ci` + `npm run build` succeed from a fresh
    checkout; no install-phase script executes; `dist/src/cli/dispatch.js`
    and `dist/test/**` exist afterwards.
```

So the **committed, merged** plan — the one `docs/STATUS.md` currently
describes as "converged" and ready to build — has `T-1-1` (created and run
from Step 1 onward) asserting a file that, per the same committed plan's own
§5.1 table, is not created until Step 28. Combined with Checkpoint 1
(`plan:4962-4966`, "After Step 12 … Run `T-1-1` – `T-12-1` (`npm test` at this
point: every unit/build/convention test written so far …)"), this is a direct,
mechanically-checkable violation of the plan's own D-plan-1 invariant ("no
Verification field names a test that cannot run at its step," `plan:5074-5075`)
and would have failed `npm test` — and Checkpoint 1 — for every commit from
Step 1 through Step 27 had the plan been built as committed. This is exactly
the defect shape named in the task, it is real, and the diff under review
fixes it correctly and completely (§1 above).

## 3. Completeness sweep — is any other instance of this defect shape still present?

**Method.** I did not rely on a keyword grep alone (a grep only finds strings
I thought to search for). I:

1. Extracted the full §5.1 generated table (`plan:438-714`) and built a
   file→creation-step map from it.
2. Read every step's `**Verification.**` line across all 40 steps (`S1`
   through `S40`) and cross-checked the test IDs against §12.
3. Grepped the entire test-specification section (§12.1–§12.4,
   `plan:7454-9508`) for every filesystem-existence-shaped phrase —
   `dist/`, `is absent`, `does not exist`, `exists afterwards`, `exists
   after`, `target exists`, `still exists afterwards` — and read the full
   spec block around every hit, classifying each as (a) the fixed `T-1-1`
   case, (b) a convention/whitelist import-scan ("imported only by {allowed
   set}"), (c) a DB-row/table/env/transcript-shape assertion, or (d) a
   genuine forward-reference to a source/`dist/` artifact from a later step.
4. For every convention/whitelist test found (`T-3-2`, `T-5-3`, `T-10-3`,
   `T-24-2`, plus the model/invoke, network-module, and hook-field-name
   scans at Steps 26, 28, 32, 36), I read the actual **Fails when** clause,
   not just its title: each one asserts an *upper bound* ("no importer
   outside the allow-list … OR the seeded one is not detected"), never a
   *lower bound* ("the allowed importer is present"). A module that doesn't
   exist yet contributes zero importers, which trivially satisfies "no
   disallowed importer" — so these tests pass vacuously before their
   allowed-importer module exists and continue to pass once it does. This
   matches the task's explicit exclusion ("convention/whitelist tests that
   pass on a subset … are NOT the class") and I verified it by reading the
   test body description, not by assuming the exclusion applied.
5. Cross-checked every step's `depends_on` list (`grep -n "depends_on"`,
   all 40 entries) for `modify`-before-`create` ordering; checked every
   `create`/`modify` pair for the same file in §5.1 (only `dispatch.ts`,
   `answer_drift.ts`, `handler.ts`, `indexer.ts`, and the CI workflow file
   are modified after creation, and in every case `modify` step numbers are
   all greater than the `create` step number).
6. Read Checkpoint 1's full test range (`T-1-1` through `T-12-1`,
   `plan:7456-7859`) end to end, since that is the checkpoint the fixed
   defect broke, to confirm no sibling defect sits in the same range.

**Result.** Beyond the fixed `T-1-1`/`dispatch.ts` case, I found **no other
instance** of a test whose spec asserts the existence of a source or `dist/`
file that §5.1 shows is created by a later step. Every other `dist/`-existence
phrase in §12 is either (a) part of the now-fixed `T-1-1` case itself, (b) a
convention/whitelist import-scan of the excluded shape, or (c) a reference to
a file created at or before the step the referencing test/step belongs to
(e.g., `T-31-1`'s `dist/src/cli/dispatch.js` invocation at Step 31, long after
Step 1's creation and Step 28's extension; the `large-store` fixture,
correctly deferred to Step 29 because "nothing before Step 7 can create its
tables," `plan:5145-5148`). I am reporting this as the result of the
sweep described above, not as an assumption that the fix is exhaustive.

## 4. Soundness of the approach and accuracy of the added prose

The approach — create the `bin` target as an inert, import-free stub at
Step 1 and let every later step `modify:` the same file — is sound
engineering: it is the standard "stub the entry point first, wire it up
later" packaging pattern, it does not pull any later step's types or logic
backward (the stub "imports nothing," so it creates no dependency Step 1
doesn't already have), and it is the same shape as the plan's other three
multi-step-modified files (`answer_drift.ts`, `handler.ts`, `indexer.ts`),
so it is not a new pattern introduced ad hoc.

I checked the two new factual/behavioral claims the diff adds, rather than
accepting them as written:

- **"`tsc` preserves the shebang in emit" (`plan:884`).** This plan cites a
  dated, executed, primary-source check for every comparable tool-behavior
  claim (§11, `plan:6502-6560` and throughout, e.g. "executed 2026-09-07,
  §11.4"). This one does not — I grepped the whole plan, the architecture
  document, and the spec for `shebang` and found only this one, uncited,
  occurrence. I independently verified the underlying claim by execution
  rather than leaving it unchecked: with TypeScript 6.0.2 in this sandbox, I
  compiled a `.ts` file starting with `#!/usr/bin/env node` and confirmed by
  byte-inspection (`od -c`) that the emitted `.js` file's first line is
  `#!/usr/bin/env node` verbatim, then `chmod +x`'d and ran the compiled file
  directly (no `node` prefix) and confirmed it executes via the shebang. **The
  claim is true.** The finding is not that the plan states something false —
  it's that it states a library-behavior fact this plan's own convention
  requires to carry a dated citation, and this one doesn't. See Finding 1.
- **"any argument is an unknown verb, for which it prints a plain-language
  usage line to stderr and exits non-zero" (`plan:881-883`).** I grepped
  the entire test-specification section (and the whole plan) for `unknown
  verb`, `usage line`, `invalid verb`, `unrecognized` — this new behavior is
  specified but I found no test anywhere in §12 that exercises it. See
  Finding 2.

Neither issue affects the correctness of the fix itself (§1–§3 above); both
are documentation-rigor gaps in the newly added prose, judged against this
plan's own established practice of pairing every stated behavior with a test
and every external-tool claim with a dated citation — not against a generic
external standard the plan doesn't claim to follow.

## 5. Mechanical gates — actual output

Run from `middleware/context-oracle/` as instructed.

```
$ node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs docs/plans/plan-phase-a.md --check
OK: 40 steps, 13 elements, 124 test specs, 26 probes cited, regions current
$ echo $?
0
```

```
$ node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --self-check
ok: contract examples parse, cross-check, and reach a fixed point
ok: fixture valid-plan.md checks clean (2 steps, 3 elements, 2 specs, 1 probe(s))
[... 32 more "ok: negative/positive: …" lines ...]
self-check passed: 34 checks
$ echo $?
0
```

```
$ node .claude/skills/expert-plan/scripts/run-plan-probes.mjs docs/plans/plan-phase-a.md
ok 01_node_test_empty_glob
[... probes 02 through 25 ...]
ok 26_reindex_claim_row_race
all probes match their recorded expectations
$ echo $?
0
```

```
$ python3 tools/check_docs.py
context-oracle doc-consistency check passed.
$ echo $?
0
```

All four gates pass. **Gate-relevance caveat, stated for accuracy rather than
presenting four green checkmarks as equally probative:** `tools/check_docs.py`
never reads `docs/plans/plan-phase-a.md` at all (confirmed by `grep -n
"plan-phase-a" tools/check_docs.py` → no matches; its content checks (1–3)
only touch `CLAUDE.md`, `OWNER-LEDGER.md`, `docs/STATUS.md`, the spec, and
`docs/architecture-phase-*.md`, none of which this diff touches). Its git-based
checks (4–6, including the STATUS-rewrite check) only run when `--base` is
passed, and even when I re-ran it with `--base origin/main` it still passed
— because check 6 diffs `merge-base..HEAD` (committed history only) and this
change is uncommitted, so it is structurally invisible to that check either
way (see Finding 3). So gate 4's pass is not evidence about this diff's
content; gates 1 and 3 (which parse and execute against the plan file
directly) are the ones actually exercising it, and both confirm structural
consistency. Gate 2 tests the checker script itself, not the plan.

## 6. Findings

### Finding 1 (Minor) — new tool-behavior claim added without this plan's mandated citation

**Evidence.** `plan:884`: "(`tsc` preserves the shebang in emit)" — new prose
in this diff, cited nowhere in §11 (`grep -n shebang` across
`plan-phase-a.md`, `architecture-phase-a.md`, `spec-context-oracle.md` →
exactly this one occurrence, no dated/executed companion entry, unlike every
comparable claim in §3/§11, e.g. `plan:237-245`'s Node.js-documentation entry
or the `probe:22_tsc_web_tree_sitter_import` pattern used elsewhere for
TypeScript-compiler-adjacent facts).
**Impact.** None on correctness — I independently executed the check (TypeScript
6.0.2: compiled a shebang-led `.ts` file, confirmed via `od -c` that
`#!/usr/bin/env node` is the literal first line of the emitted `.js`, then ran
the compiled file directly and confirmed it executes via the shebang). The
claim is true; the gap is process/citation rigor, not content.
**Recommendation.** Add a §11 entry (or a `probe:` addition) citing this
compiler behavior the same way every other tool-behavior claim in this plan
is grounded, before treating the plan as fully re-converged.

### Finding 2 (Minor) — new CLI behavior specified with zero test coverage

**Evidence.** `plan:881-883`: the unknown-verb stub is specified to "print a
plain-language usage line to stderr and exit non-zero." Grepped `unknown
verb`, `usage line`, `invalid verb`, `unrecognized` across the whole plan —
no test in §12 exercises this. Every other behavior this plan specifies,
including comparably small ones (e.g. `T-1-2`'s runner-guard behavior), is
paired with a verifying test.
**Impact.** Low — this is a two-line, low-risk CLI stub, not a
correctness-load-bearing mechanism. But it is a real gap against the plan's
own stated rigor (every specification in §12 is meant to cover "test
behaviors not methods," per the plan's own Google-testing-standard citation,
`plan:273-276`).
**Recommendation.** Either add a one-line unit test for the unknown-verb
path at Step 1, or drop the specific "usage line + exit non-zero" behavioral
detail from the prose and leave it to Step 28's actual verb dispatch (which
is tested).

### Finding 3 (Moderate) — `docs/STATUS.md` is now stale relative to this fix, and the staleness is not a hypothetical

**Evidence.** `docs/STATUS.md:27-31` (unchanged by this diff) currently
states: "The Phase A implementation plan … is converged and is the build
contract. The next step is to build it. … the final round's two independent
passes — an expert-review and a collapse-hunt — both returned PASS with zero
Moderate-or-above findings." I checked this against the last **committed**
state of the plan rather than assuming it was accurate: `git show
5b83fdd:middleware/context-oracle/docs/plans/plan-phase-a.md` (current
`HEAD`/`origin/main`, the state that round-14's collapse-hunt and every prior
round actually reviewed) already contains `src/cli/dispatch.ts | create |
S28` in its §5.1 table and the same `T-1-1` spec asserting
`dist/src/cli/dispatch.js` at Step 1 — i.e., the exact defect this diff
fixes was present in the plan `docs/STATUS.md` currently calls converged
with zero Moderate-or-above findings, and per §2 above it is a real defect
that would have broken Checkpoint 1 and every CI run for Steps 1–27, not a
cosmetic one. So the "zero Moderate-or-above findings" claim, as currently
worded in `docs/STATUS.md`, is not accurate about the plan it describes.
**Impact.** `CLAUDE.md`'s mandatory session-end protocol ("STATUS.md
rewritten … the whole state plus what to do next") and `tools/check_docs.py`
check 6 ("STATUS.md rewritten whenever the project changed") exist
specifically to prevent a stale convergence claim from surviving into the
next session. I confirmed check 6 cannot currently catch this: it diffs
`merge-base..HEAD` (`tools/check_docs.py:154-155`), which only sees committed
history, so an uncommitted fix to `plan-phase-a.md` — exactly this diff's
state — is invisible to it even when invoked with `--base origin/main` (I
verified this by running it that way; it still passed). Nothing currently
in this repository will stop this fix from being committed, or even merged,
without `docs/STATUS.md` ever being corrected.
**Recommendation.** Before this fix is treated as a finished unit of work,
rewrite `docs/STATUS.md` to (a) drop or correct the "zero Moderate-or-above
findings" claim for the round that missed this defect, and (b) record this
fix (what was wrong, what changed, why) so the next session doesn't start
from an inaccurate "converged, nothing to check" premise. This finding is
about the overall session state the diff sits in, not a defect in the diff's
own text — the plan-phase-a.md changes themselves are correct as reviewed in
§1–§4.

## 7. What's actually good

- The fix is minimal, targeted, and does not touch any file's behavior beyond
  what's needed to relocate `dispatch.ts`'s creation — no scope creep.
- It reuses the existing multi-step-`modify` pattern already used for
  `answer_drift.ts`, `handler.ts`, and `indexer.ts`, rather than inventing a
  new mechanism.
- The new prose in both Step 1 and Step 28 explains *why* (with the specific
  CI/Checkpoint consequence), not just *what changed* — it names the exact
  test (`T-1-1`), the exact step range that would have been red (1–27), and
  the exact checkpoint it would have broken (Checkpoint 1), which is what let
  me independently verify the claim against the committed plan in §2 rather
  than take it on faith.
- All structural cross-references (step-decls, §5.1, `depends_on`, Gate-3
  prose in both steps) were updated together and agree.

## 8. Verdict

**NEEDS FIXES** — one Moderate finding (Finding 3) and two Minor findings
(Findings 1, 2). None of the three bears on the correctness or completeness
of the `plan-phase-a.md` fix itself: the fix correctly and completely
resolves the named defect class (§1–§3), the approach is sound (§4), and all
four mechanical gates pass (§5). The Moderate finding is about the state
`docs/STATUS.md` leaves this fix in, not about the fix's text; the two Minor
findings are documentation-rigor gaps in the newly added prose (an uncited
but verified-true tool-behavior claim, and an untested new behavioral
specification). Apply all three before treating this as closed, per this
project's own standing rule that a review's findings are all applied, not a
prioritized subset.
