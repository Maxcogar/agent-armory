# Collapse-hunt review — dispatch.ts stub-at-Step-1 fix

**Date.** 2026-09-19
**Reviewer.** Independent collapse-hunt subagent (did not author the change).
**Target.** The uncommitted working-tree edit to exactly one file,
`middleware/context-oracle/docs/plans/plan-phase-a.md`, viewed with
`git diff -- middleware/context-oracle/docs/plans/plan-phase-a.md`.
**Governing.** `middleware/context-oracle/CLAUDE.md` (three dominating rules;
the collapse test in dominating rule 2). Grounded against
`docs/plans/plan-phase-a.md` §5.1, §9, §12; `docs/architecture-phase-a.md`
AD-25; the coverage map §2.3.

---

## Verdict

**NEEDS FIXES — one Minor finding.**

The substantive fix is correct, well-grounded, and complete: it does not
collapse, the completeness sweep finds no other instance of the defect
class, and every sentence the change *adds or edits* honestly describes the
mechanism. All four mechanical gates pass. The single finding is a stale
cross-reference the edit left behind (an *unedited* sentence in Step 31 that
the change's own reframing now contradicts). It does not change any
implementer's behavior and fails no gate, but under this project's
prose-precision bar it is a real inconsistency the change introduced by not
sweeping it.

---

## What the change does

Before the edit, `src/cli/dispatch.ts` was **created at Step 28** (§5.1:
`create | S28`; `modify | S31, S32, S33, S34, S35`). But `T-1-1`
(`test/unit/package_build.test.ts`, created and run from Step 1) asserts
`dist/src/cli/dispatch.js` exists after build — and `package.json`'s
`"bin": {"ctxoracle": "dist/src/cli/dispatch.js"}` is declared at Step 1
(line 846, **unchanged** by this diff). So the manifest pointed at a file
that did not exist until Step 28, and `T-1-1` would be red for Steps 1–27.

The change:
- §5.1: `src/cli/dispatch.ts` → `create | S1`; `modify | S28, S31, S32, S33, S34, S35`.
- S1 step-decl `create`: adds `dispatch.ts`. S28 step-decl: removes it from
  `create`, adds it to `modify`.
- S1 body: adds a paragraph creating `dispatch.ts` as a `#!/usr/bin/env node`
  unknown-verb **stub** that registers no verbs and imports nothing; updates
  the "Creates.", the "Why (Gate 3)" decision bullet, the "What this is NOT"
  bullet, and the Checkpoint-1 line of the numbered rationale.
- S28 body: "Create `src/cli/dispatch.ts`" → "Extend Step 1's
  `src/cli/dispatch.ts`"; removes it from "Creates."; adds a decision-bullet
  clause stating the file is Step 1's, extended (not re-created) here.

---

## Gate outputs (all four re-run by this reviewer, from `middleware/context-oracle/`)

```
$ node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs docs/plans/plan-phase-a.md --check
OK: 40 steps, 13 elements, 124 test specs, 26 probes cited, regions current
EXIT=0

$ node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --self-check
self-check passed: 34 checks
EXIT=0

$ node .claude/skills/expert-plan/scripts/run-plan-probes.mjs docs/plans/plan-phase-a.md
ok 01_node_test_empty_glob ... ok 26_reindex_claim_row_race
all probes match their recorded expectations
EXIT=0

$ python3 tools/check_docs.py
context-oracle doc-consistency check passed.
EXIT=0
```

Gate 1's "regions current" is load-bearing here: it confirms the generated
§5.1 file table and the §12 test table were regenerated consistently with
the amended step-decls, so the `dispatch.ts` rows (`create | S1`;
`modify | S28, S31–S35`) match the S1/S28 declarations. Gate 2's
"later dependency rejected" / "duplicate creator rejected" negative checks
pass, so moving creation to S1 (which `depends_on: []`) introduces no
ordering or duplicate-creator violation.

---

## Collapse-hunt on the load-bearing decisions (dominating rule 2)

### Decision A — Create `dispatch.ts` at Step 1 as a non-functional unknown-verb stub

- **Mission sentence.** Make the package's declared `bin` target real from
  the first build, so Step 1's own verification (`T-1-1`), every CI run, and
  Checkpoint 1 reflect true state — serving Phase A's goal of "an honest
  deterministic foundation ... never fake completeness dressed to look like a
  working product."
- **Hardest skeptic question.** *Does a stub at Step 1 actually satisfy
  `T-1-1` without (a) failing to compile at Step 1, (b) violating dependency
  order or the duplicate-creator rule, (c) faking a working CLI, or (d) being
  the wrong fix versus weakening `T-1-1` or deferring the `bin` declaration?*
- **Answer with citation — no collapse.**
  - (a) `dispatch.ts` is under `src/` → included by the tsconfig
    (`"include": ["src", "test"]`, line 862) → emits `dist/src/cli/dispatch.js`.
    The stub "imports nothing", so it compiles at Step 1 with no other `src`
    module present. I verified empirically that `tsc` preserves the leading
    `#!/usr/bin/env node` as the first emitted byte sequence under the plan's
    compiler options (`target ES2022`, `module NodeNext`,
    `moduleResolution NodeNext`, `verbatimModuleSyntax`) — see Honest-prose
    §H1. So the added claim "`tsc` preserves the shebang in emit" holds and the
    emitted bin is executable.
  - (b) S1 `depends_on: []` (line 841); it is now the sole creator of
    `dispatch.ts` (gate 1 "regions current"; gate 2 duplicate-creator negative
    passes). No ordering violation.
  - (c) The stub errors on every verb and delivers no behavior; the change
    states this explicitly ("Not a functional dispatcher here ... Step 1 ships
    only the packaging bin target", lines 998–1000). This is the *opposite* of
    the collapse-log 2026-09-04 "fake working product" failure the phase goal
    forbids.
  - (d) Coherent with the pre-existing (unchanged) `bin` declaration and
    AD-25. `package.json`'s `bin` is Step 1 packaging (AD-25, arch line 1633;
    PA-12 "Packaging (AD-25)", covered by **S1 only** per §2.3). The target of
    that bin belongs in the same step; the change's phrasing "the AD-25 `bin`
    declaration and its target belong to the same packaging decision and ship
    together" (lines 997–998) is exactly right. The alternatives —
    weakening `T-1-1` or deferring the `bin` — would either make Step 1's
    verification dishonest or contradict AD-25. **Strengthening observation:**
    before the fix the bin target (a packaging artifact, PA-12) was created at
    S28, which does not even cover PA-12; the fix relocates it into the step
    that covers PA-12.

### Decision B — Step 28 *modifies* (extends) `dispatch.ts` rather than creating it

- **Mission sentence.** Keep the verb switch a single evolving file so the
  hook/index verbs (S28) and the CLI verbs (S31–35) register into one
  dispatcher, not a re-created one.
- **Hardest question.** *Does declaring `dispatch.ts` under S28 `modify:`
  match §5.1 and the downstream `modify:` chain, and does S28 still provide
  everything it claims?*
- **Answer — no collapse.** §5.1 `modify | S28, S31, S32, S33, S34, S35`
  matches S28's decl and the S31–S35 decls (all `modify: [dispatch.ts]`,
  lines 3950/4090/4175/4287/4348). S28's `provides` list
  (`ctxoracle-hook`, `hook-integrity-check`, `ctxoracle-index`,
  `toInternalEvent`, `toHookResponse`, `prepareStore`) is unaffected —
  `dispatch.ts` never carried a provided name — and gate 2's
  "shared call identifier not provided" negative passes.

---

## New-defect hunt (internal inconsistency / broken cross-reference / decl mismatch / dependency order)

**Finding 1 (Minor) — stale attribution: "Step 28's `dispatch.ts`" in Step 31.**

`docs/plans/plan-phase-a.md:3958` (Step 31 "What changes"): "Register the
`init` verb in **Step 28's** `dispatch.ts` switch."

The change's entire thesis is that `dispatch.ts` is **created at Step 1** and
merely *extended* at Step 28 — the change rewrote S28 to "Extend Step 1's
`src/cli/dispatch.ts`" (line 3557) and added "its creation is Step 1's
packaging decision (AD-25)" (line 3685), and S1 now calls it "the file Step
28 extends" (line 885). Against that reframing, "Step 28's `dispatch.ts`" is
an inaccurate origin attribution: the file is Step 1's, extended at Step 28
and again at Step 31. This is a parallel sentence the edit did not sweep.

- **Severity: Minor.** It fails no gate (gate 1/2/4 check step-decls and
  cross-document keys, not this prose; all pass). It does not change what an
  implementer does — S31's `modify: [dispatch.ts]` decl is correct and the
  implementer adds `init` to the one existing switch regardless of which step
  "owns" the file. But this project has been bitten specifically by prose
  that describes a superseded mechanism, and the change's own reframing is
  what makes this sentence wrong, so it is a real inconsistency the change
  introduced.
- **Fix.** Change "Step 28's `dispatch.ts` switch" to, e.g., "Step 1's
  `dispatch.ts` switch (extended at Step 28)".

**No other new defect found.** Checked: §5.1 vs. S1/S28 decls (gate 1
"regions current"); the S28 `modify:` chain to S31–S35 (all present and
consistent); the S28 `provides`/`depends_on` (unchanged, gate 2 clean); the
dependency direction (S28 `depends_on: [S1, …]`, so modifying an S1-created
file is legal); every other `dispatch` mention in the plan (grep of all 27
hits) — line 3624 ("this step's `index` verb") is S28 and correct; the D-plan-6
/ §11.4 references (lines 5155–5165, 5896, 7050–7058) name the `dispatch.js`
*path*, never a creation step, so they are unaffected. Line 3958 is the sole
stale attribution.

---

## Completeness sweep — is any OTHER instance of the exact defect class unfixed?

**The class.** A step's Verification names a test whose spec asserts the
*existence* of a source or `dist/` file artifact that, per §5.1 / the
step-decls, is **created by a later step** than where the test runs.

**Method.**
1. Built the test → creation-step map from the §12 generated test table
   (S1…S40) and each step-decl's `create`/`tests` lists. A `.test.ts` runs on
   every `npm test` / CI run / checkpoint from the step that creates it
   onward (§9 Checkpoint 1 is after Step 12 and runs `T-1-1`–`T-12-1`;
   `T-1-1` is created at S1).
2. Read every §12 test spec's `Verifies` / `Data` / `NOT asserts` /
   `Fails when` and classified each assertion into: **(a)** file-artifact
   existence (the class); **(b)** convention/whitelist import-or-token scan
   that passes on a subset; **(c)** DB row / table / type / env assertion;
   **(d)** transcript- or response-shape assertion. Only (a) is the class;
   (b)–(d) are the prompt's explicit exclusions.
3. Targeted-searched the §12 region for file-path tokens (`dist/`, `.js`,
   `.ts`, `.sql`, `.wasm`, `.mjs`, `package.json`, `tsconfig`, `bin`) and for
   existence language (`exist`, `absent`, `present`, `missing`, `afterwards`),
   then read each hit with judgment (grep locates; reading decides).
4. For each class-(a) assertion, located the asserted file's creator step in
   §5.1 and compared it to the test's run step.

**Result — the fixed instance was the only one; no other remains.**

- **`T-1-1`** (`test/unit/package_build.test.ts`, runs from S1) is the sole
  class-(a) test: "`dist/src/cli/dispatch.js` and `dist/test/**` exist
  afterwards" / "**Fails when** ... `dist/src/cli/dispatch.js` is absent"
  (§12.1, plan lines 7459/7472). Before the change `dispatch.ts` was created
  at S28, so this was red for Steps 1–27 and at Checkpoint 1; the change moves
  creation to S1 and fixes it. The companion `dist/test/**` assertion is
  satisfied at Step 1 by S1's three test files (`package_build`,
  `run_tests_guard`, `generator_determinism`).
- Every other `dist/`-referencing test is a **class-(b) whitelist scan that
  passes on a subset**, not an existence assertion:
  - `T-3-2` sqlite_single_importer, `T-5-4` child_process_single_importer,
    `T-10-1` fault_session_writers_only, `T-28-2` hook_field_names_isolated,
    `T-36-1` model_invoke_stub, `T-23`/`no_network_modules` — all "no importer
    outside the allow-list" / "no forbidden identifier", which pass when fewer
    modules exist.
  - `T-24-2` permission_decision_confined reads in "Verifies" as "imported by
    exactly one module", but its operative **Fails when** is "the clean build
    reports a **second** importer" (line 8425) — a whitelist that passes when
    the importer (`answer_drift.js`, S25) does not yet exist. Not the class.
- The §12.2/§12.3 **replay** tests assert DB rows and hook responses
  (class-c/d); the reader tests assert transcript shapes (class-d); the
  `build_time` tests (`T-38-32` marker-count, `T-38-33` grammar-load) assert
  behavior of `node_modules` grammars and built output, not repo file
  existence. None assert existence of a later-created source/`dist` artifact.
- Non-`dist` file artifacts checked: fixture repos (all created at S1 per
  §5.1; `T-1-3` asserts they generate, and explicitly excludes `large-store`
  which S29 builds); `.sql` migrations (created S7/S8, first referenced by
  `T-7-1`/`T-8-1` at those steps); `.wasm` grammars (in `node_modules`,
  asserted at S38). No early test asserts a later-created one.

---

## Honest-prose verification (every sentence the change adds or edits)

**H1 — "It compiles under the strict `tsconfig` above (`tsc` preserves the
shebang in emit)" (line 883–884).** Verified empirically. Compiling a
`#!/usr/bin/env node`-headed `src/cli/dispatch.ts` under `strict`,
`target ES2022`, `module NodeNext`, `moduleResolution NodeNext`,
`verbatimModuleSyntax` produced `dist/src/cli/dispatch.js` whose first line
is exactly `#!/usr/bin/env node` (`od -c` confirms the leading `# ! / u s r
/ b i n / e n v   n o d e \n`). Tested with `tsc` 6.0.2 (the only compiler
available in this environment), not the plan's pinned 5.9.3; shebang
preservation is long-standing, stable TypeScript behavior, so this confirms
the claim. Honest.

**H2 — "any argument is an unknown verb, for which it prints a plain-language
usage line to stderr and exits non-zero" / "imports nothing" (lines 881–884).**
Consistent with a stub that registers no verbs. No Step 1–27 test invokes the
binary expecting success (the replay harness is created at S28; `init` tests
at S31), so a stub that errors on all verbs breaks nothing. `T-1-1` only
checks the file exists, never runs it. Honest.

**H3 — "keeps `package.json`'s `bin` entry pointing at a file that exists
from the first build (AD-25), so `T-1-1`'s `dist/src/cli/dispatch.js`
assertion holds at Step 1, on every CI run, and at Checkpoint 1, instead of
being red until Step 28" (lines 887–891) and the parallel "What this is NOT"
sentence (lines 992–1000).** Each clause verified: `bin` entry line 846
(unchanged); `T-1-1` asserts the path (line 7472); it runs on every `npm
test` (S1 CI job, lines 927–930) and at Checkpoint 1 (after Step 12, line
4963); before the fix `dispatch.ts` was at S28 (diff). Honest and accurate.

**H4 — S28 "Extend Step 1's `src/cli/dispatch.ts` — its `bin` entry stub ...
unknown verbs errored at Step 1 — registering, at this step, the internal
verbs `hook` ... and the `index` verb" (lines 3557–3563).** Matches: S28
registers `hook`/`hook integrity-check`/`index` (verified against the S28
body and `provides`), Steps 31–35 register the rest (`init`/`deinit`/
`export`/`import`/`status`/`log`/`tune`/`correct`/`note`), consistent with
§5.1 `modify` chain and PA-11's coverage (S28, S31–35). Honest.

**H5 — S28 decision bullet "The CLI `bin` entry is Step 1's
`src/cli/dispatch.ts` stub, extended here ... not re-created — its creation
is Step 1's packaging decision (AD-25), and Steps 31–35 extend the same
switch" (lines 3683–3686).** Matches AD-25 and §5.1. Honest.

No added/edited sentence describes a wrong or abandoned mechanism. The only
prose defect is the **unedited** Step 31 sentence in Finding 1, which the
change rendered stale without updating.

---

## What I checked to establish this verdict

- Re-ran all four gates from `middleware/context-oracle/` and recorded actual
  output (all EXIT=0) — above.
- Read the full diff, plus Step 1 (830–1017), Step 28 (3517–3719), Step 31
  (3943–3997), §5.1 dispatch rows (456–457), §9 Checkpoints (4955–5016),
  §2.3 coverage (PA-10/11/12; PA-12 = Packaging/AD-25, covered by S1 only),
  and AD-25 (arch 1630–1648).
- Read the `T-1-1` spec (7456–7472) and confirmed it is unchanged by the diff
  and already asserted `dist/src/cli/dispatch.js`, establishing the defect
  independently of the change's own prose.
- Swept §12 (all 124 test specs) for the existence class by the method above,
  reading each file-path/existence hit with judgment (`T-1-1`, `T-3-2`,
  `T-5-4`, `T-10-1`, `T-24-2`, `T-28-2`, `T-31-1`, `T-36-1`, the replay and
  build_time tiers).
- Compiled a shebang-carrying stub with `tsc` and inspected the emitted bytes
  to verify the shebang-preservation claim.
- Grep-swept all 27 `dispatch` occurrences in the plan for other stale
  creation-step attributions; found exactly one (line 3958).
