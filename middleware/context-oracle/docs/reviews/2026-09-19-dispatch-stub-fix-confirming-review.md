# Confirming review — the dispatch-stub-at-Step-1 fix and its three follow-up fixes

**Date.** 2026-09-19
**Reviewer.** Independent confirming reviewer. I authored none of the change set,
the plan, or any prior round (collapse-hunt, expert-review, or the corrector).
Every claim below is re-derived from the current working-tree source and from
mechanical execution in this session — not imported from the diff's own prose,
from `docs/STATUS.md`, or from the two prior 2026-09-19 review files (which I
treated as evidence to verify against, not as authority).

**Working tree.** `/home/user/agent-armory`, branch `claude/serene-noether-8betiq`.
Gate commands run from `middleware/context-oracle/`.

**Change set under review (all uncommitted, confirmed by `git status`).**
- Modified: `docs/plans/plan-phase-a.md`, `docs/STATUS.md`, `docs/collapse-log.md`
- New: `docs/plans/plan-phase-a.probes/27_tsc_preserves_shebang.sh`,
  `docs/plans/plan-phase-a.probes/expected/27_tsc_preserves_shebang.txt`,
  `docs/reviews/2026-09-19-dispatch-stub-fix-collapse-hunt.md`,
  `docs/reviews/2026-09-19-dispatch-stub-fix-expert-review.md`

---

## Verdict

**PASS.** No findings at any severity.

The core fix (create `dispatch.ts` at Step 1 as an inert stub; Step 28
`create`→`modify`) is internally consistent across §5.1, the S1/S28/S31–S35
step-decls and prose, dependency order, and `T-1-1`'s spec. My own independent
sweep of all 40 steps / 124 §12 specs against §5.1 confirms `T-1-1`/`dispatch.ts`
is the **only** instance of the "a step's Verification asserts the existence of an
artifact a later step creates" class. All three follow-up fixes are correctly and
completely applied and introduce no new inconsistency. `docs/STATUS.md` and the
`docs/collapse-log.md` 2026-09-19 entry are factually accurate and policy-compliant.
All four mechanical gates pass.

---

## 1. The core fix is internally consistent

Traced from the current file (not the diff's prose):

- **§5.1** (`plan:456-457`): `src/cli/dispatch.ts | create | S1`;
  `| modify | S28, S31, S32, S33, S34, S35`.
- **S1 step-decl** (`plan:833-841`): `create:` lists `.../src/cli/dispatch.ts`;
  `depends_on: []`; `tests: [T-1-1, T-1-2, T-1-3]`.
- **S28 step-decl** (`plan:3522-3531`): `dispatch.ts` removed from `create:`,
  present in `modify:` alongside the CI workflow; `depends_on` includes `S1`
  (so `modify`-after-`create` is legal).
- **S31–S35 step-decls** (`plan:3953, 4094, 4179, 4291, 4352`): each declares
  `modify: [...src/cli/dispatch.ts]`. Unchanged by this diff; already matched the
  corrected table.
- **T-1-1 spec** (`plan:7475-7491`, unchanged by this diff): "Verifies. Step 1 —
  … `dist/src/cli/dispatch.js` and `dist/test/**` exist afterwards"; "**Fails
  when** … `dist/src/cli/dispatch.js` is absent." Independently grounded the
  defect: the committed `HEAD` (5b83fdd, via PR #90) plan has
  `dispatch.ts | create | S28` (verified with `git show
  HEAD:…/plan-phase-a.md | grep`), while the same committed plan's `T-1-1` asserts
  that file exists from Step 1 — so the merged, "converged" plan really would have
  run red for Steps 1–27 and at Checkpoint 1 (after Step 12, `plan` §9).
- **Dependency/creator uniqueness**: single creator (S1); gate 1 "regions
  current" and gate 2's "later dependency rejected" / "duplicate creator
  rejected" negatives pass.

### Completeness sweep — my own method and result

**Class.** A test whose §12 spec asserts the *existence* of a source or `dist/`
file artifact that, per §5.1, is created by a step *later* than the step from
which the test runs. (Unit/build/convention tests run on every `npm test` /
Checkpoint / CI run from their creating step onward.)

**Method.**
1. Extracted the §5.1 generated file→create-step table (`plan:438-714`).
2. Located the §12 tiers (§12.1 `plan:7473`, §12.2 `8594`, §12.3 `8966`, §12.4
   `9467`) and swept the whole §12 region (7406–9527) for existence language
   (`exist`, `absent`, `present`, `missing`, `afterwards`, `is built`, `ships`)
   and file-path tokens (`dist/`, `.sql`, `.wasm`, `test/build/fixtures`,
   `grammar`, `node_modules`), then **read each hit's spec block with judgment**
   (grep locates; reading classifies).
3. Classified each assertion into (a) file-artifact existence [the class],
   (b) upper-bound convention/whitelist import-or-token scan [passes on a
   subset], (c) DB-row / table / type / env assertion, (d) transcript- or
   response-shape assertion.
4. For every class-(a) hit, compared the asserted file's §5.1 create step to the
   test's run step. Separately confirmed each must-fail build fixture is
   co-created with its consuming compile test.

**Result — `T-1-1` is the sole class-(a) instance; no other remains.**
- `T-1-1` (`test/unit/package_build.test.ts`, runs from S1): `dist/src/cli/
  dispatch.js` existence — the fixed case. Its companion `dist/test/**` is
  satisfied at S1 by S1's three test files.
- Every other `dist/`-referencing test is class-(b), verified by reading its
  operative **Fails when**, not its title: `T-3-2` (`Fails when` the clean build
  reports a *second* importer, `plan:7561-7562`), `T-5-3/4`, `T-10-3` (`Fails
  when` … an importer *outside the allow-list*, `7795-7797`), `T-24-2` (title
  reads "imported by exactly one module," but operative `Fails when` is a
  *second* importer, `8443-8444` — passes vacuously before `answer_drift.js`, S25,
  exists), `T-28-2`, `T-36-1`, and the `no_network_modules` token scan. Each is an
  upper bound satisfied by a subset.
- Must-fail compile fixtures assert compile-*failure*, not existence, and are
  co-created with their tests (§5.1): `missing_provenance.ts`/`typecheck_
  provenance.test.ts` at S9; `trust_out_of_set.ts`/`typecheck_trust.test.ts` at
  S11; `verdict_updated_*`/`deny_literal_outside.ts` with their typecheck tests
  at S24. No temporal gap.
- Migrations `001/001b.sql` (S7) and `002.sql` (S8) are first referenced by
  `T-7-1`/`T-8-1` at those same steps.
- `T-31-1` *invokes* `dist/src/cli/dispatch.js` (`plan:8751`) at S31 — the file
  exists from S1 (create) / S28 (extend); an invocation of an already-existing
  file, not an existence assertion of a later-created one.
- `T-38-33` grammar-inventory (`test/build_time/…`, S38) checks `node_modules`
  grammars present/loadable — dependency artifacts installed at S1, not a
  later-created source/`dist` file.
- All other §12 existence phrases are class-(c) DB rows/tables (`_fts5_probe`,
  `cochange_pairs`, `symbols`, `session_log`, `schema_meta.store_created_at`, …)
  or class-(d) response/transcript shapes.

## 2. The three follow-up fixes are correctly applied

**(a) Stale attribution — fixed.** Step 31 now reads "Register the `init` verb in
**Step 1's** `dispatch.ts` switch (created at Step 1, first given verbs at Step
28)" (`plan:3961-3962`). I grepped every `dispatch` mention in the plan (27 hits)
and read each creation-attribution context: `plan:880`/`939`/`956` (Step 1
creates), `3559`/`3687` ("Extend Step 1's" / "Step 1's … stub, extended here"),
`3961` (fixed). No remaining "Step 28's `dispatch.ts`" or any other wrong-origin
attribution. Path-only references (`5159`, `5900`, `7054`, patterns at
`3996-4009`) name the `dispatch.js` path, never a creation step.

**(b) tsc-shebang claim — genuinely grounded.** I read
`27_tsc_preserves_shebang.sh`, its expected file, the §11.4 entry
(`plan:7326-7340`), and the Step 1 citation (`plan:884-886`), then executed:
- Prepared the probe layout independently and confirmed `npx tsc --version` →
  **5.9.3** (the pin the claim names; layout `package.json`/lockfile pin
  `typescript` 5.9.3).
- Ran the probe against that layout **3×** with `--repeat 3`: `ok
  27_tsc_preserves_shebang (3 runs)` — deterministic.
- The probe tests exactly the claimed property: it compiles a
  `#!/usr/bin/env node`-led `.ts` with the Step 1 compiler options
  (`--strict --target ES2022 --module NodeNext --moduleResolution NodeNext
  --verbatimModuleSyntax --types node`), checks the emitted `.js` first line is
  the shebang verbatim, and checks non-zero exit both shebang-invoked and
  `node`-invoked. It cleans its own scratch dirs before and after (no
  cross-probe contamination), and prints only the stable properties (compiler
  version/paths go to stderr, which the runner does not compare) — so the
  recorded expectation is environment-independent.
- Recorded expectation matches actual output (three `… : true` lines).
- The §11.4 entry uses the same **Claim. / Steps. / Evidence.** form, with an
  executed date and a `probe:` citation, as every other executed tool-behavior
  claim in §11.4 (e.g. `probe:24_git_numstat_z`, `probe:25_git_rev_parse_nongit`);
  the Step 1 prose cites it as "executed 2026-09-19, §11.4," matching the plan's
  convention. (Both prior reviewers had reached the true result with tsc 6.0.2;
  this fix grounds it with the pinned 5.9.3 through the reproducible harness.)

**(c) Stub behavior minimized — done.** The reviewed-diff wording "prints a
plain-language usage line to stderr and exits non-zero" is gone. The stub is now
specified as "registers no verbs, does no work, and exits non-zero on any
invocation" (`plan:882`). All sibling mentions are aligned: Step 1 Creates line
(`939`, "does no work, exits non-zero on invocation"), Step 1 Gate-3 (`957`,
"does no work and exits non-zero on invocation"), and Step 28 (`3559-3562`, "the
Step 1 stub registered no verbs and exited non-zero on invocation"). A grep for
`usage line` / `unknown verb` / `invalid verb` / `unrecognized` returns no
CLI-stub specification anywhere (the `unrecognized_user_entry` hits are the
unrelated transcript-parsing fault). The one remaining behavioral property —
"exits non-zero" — is minimal and is now itself grounded by probe 27, so the
previously-untested specification is both reduced and covered.

## 3. `docs/STATUS.md` accurately reflects reality

- It no longer presents "zero Moderate-or-above findings" as the whole truth: it
  quotes the round-14 convergence but immediately frames it as "**not the whole
  story**," and records that "the first build attempt caught a real,
  Checkpoint-1-breaking defect the entire review series had missed"
  (`STATUS:29-35`).
- It honestly records the defect and the fix (`STATUS:31-42`), pointing to the
  collapse-log and the two review files for full history — a summary-plus-pointer,
  which the information policy allows.
- Every checkable historical claim is accurate: round 14 both PASS (round-14
  expert-review "returns PASS"; round-14 collapse-hunt "all three edits are
  correct and complete"; commit messages `65fc8cb`/`75b9dd4`); the pre-fix
  committed plan really carried the defect (§1 above); 27 probes / 124 specs / 34
  checks match the gate outputs I ran (§5).
- Next steps are confined to the "What to do next" section ("Build Phase A"); the
  changed paragraph adds none. No handoff document, and no git-mechanics
  violation — no branch names, no fetch/checkout, no merge-state hedging (the PR
  reference lives only in the collapse-log, where a historical Event belongs).
- **Transparency note (not a finding).** `STATUS:36-39` lists "a confirming
  review" as an element of the completed fix workflow. That is this review, which
  had not finished when STATUS was written — but STATUS asserts no *outcome* for
  it, and this is exactly the project's mandated "write from the post-merge
  reality" handoff convention (CLAUDE.md, the handoff-writing rule): the future
  reader sees a `main` that already contains this review. My PASS verdict makes
  the description true; had I found a blocking defect, the whole uncommitted
  bundle (STATUS included) would be revised before merge, which is the safeguard.

## 4. The collapse-log 2026-09-19 entry is accurate and OL-C7-compliant

Every claim checked against source:
- "round 14 … both PASS, all mechanical gates green, merged to main (PR #90)" —
  round-14 verdicts confirmed; PR #90 is current `HEAD` (5b83fdd); all four gates
  green now (§5).
- STATUS previously said "zero Moderate-or-above findings" — matches the pre-fix
  STATUS text in the diff.
- `T-1-1`/`package_build.test.ts` asserts `dist/src/cli/dispatch.js` and "Fails
  when … dispatch.js is absent" — verified (`plan:7476, 7478, 7491`).
- `scripts/run-tests.mjs` enumerates and runs every `test/unit/**` on each `npm
  test` — verified (`plan:914-927`).
- `dispatch.ts` created only at Step 28 pre-fix; Checkpoint 1 after Step 12; the
  manifest's `bin` pointed at an unbuilt file for 27 steps — all verified.
- The `derive --check` characterization ("checks that references *resolve* /
  declared *consumption* ordering, not *test-asserted existence* ordering") is
  accurate to what the gate's self-check enforces.
- The 2026-08-01 analogy is accurate: that entry literally reads "Resolution is
  not support" and is Class: **wrong-check** (`collapse-log:302-308`), the same
  class this entry assigns itself.
- "every other `dist/`-referencing test is a convention/whitelist scan … or
  asserts DB rows / response shapes, not file existence" — matches my §1 sweep.

**OL-C7.** The entry carries full situational specifics (exact plan, test, test
file, runner, step range 1–27, Checkpoint 1, PR, the fix, and the two-reviewer
sweep); it is not a bare verdict; and its "Standing lesson" is scoped to the
temporal-existence class and to "convergence is not proof of executability,"
grounded in this incident with rationale — it does not over-generalize into a
broad project rule. Its note that the class "is currently invisible to `derive
--check` … a candidate gate extension" is a lesson observation about
catchability, not a next-step directive, so it does not usurp STATUS's
next-steps role.

## 5. Mechanical gates — actual output (run from `middleware/context-oracle/`)

```
$ node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs docs/plans/plan-phase-a.md --check
OK: 40 steps, 13 elements, 124 test specs, 27 probes cited, regions current
EXIT=0

$ node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --self-check
[34 ok lines]
self-check passed: 34 checks
EXIT=0

$ node .claude/skills/expert-plan/scripts/run-plan-probes.mjs docs/plans/plan-phase-a.md
ok 01_node_test_empty_glob … ok 27_tsc_preserves_shebang
all probes match their recorded expectations
EXIT=0

$ python3 tools/check_docs.py
context-oracle doc-consistency check passed.
EXIT=0
```

All four pass. Gate 1's "regions current" is load-bearing: it confirms the
generated §5.1 table matches the amended S1/S28 step-decls. Probe 27 is the 27th
probe (up from 26), consistent with the §5.1/STATUS "27 probes cited" figure.

## 6. What I did to establish this verdict

- Read CLAUDE.md (three dominating rules, OL-C7, information policy, lifecycle);
  the full change-set diffs; Step 1 (`plan:830-1017`), Step 28 (`3519-3719`),
  Step 31 (`3946-3975`), §5.1 dispatch rows, the `T-1-1` spec, and the new §11.4
  entry — from the current tree.
- Ran all four gates and recorded their output; ran probe 27 in isolation ×3 on a
  layout I prepared, and confirmed the resolved compiler is tsc 5.9.3.
- Performed my own 40-step / 124-spec completeness sweep (method and result in
  §1), reading every existence/path hit rather than trusting a grep.
- Independently grounded the defect against committed `HEAD` (`git show
  HEAD:…/plan-phase-a.md`), so the "would have been red" claim rests on source,
  not on the diff's prose.
- Grepped all 27 `dispatch` mentions for stale attributions and all stub-behavior
  phrasings for leftover untested specifications.
- Verified the collapse-log's cross-references (round-14 verdicts, PR #90,
  run-tests enumeration, Checkpoint placement, the 2026-08-01 analogy).
