# Branch audit — batch B4, part 3: second opinion

Second opinion (Opus 5.5) on `2026-09-26-branch-audit-B4-part3.md` (commit `2331baf`, hunks h234–h349 of `docs/plans/plan-phase-a.md`). Scope, as assigned: every entry the first audit kept (E-2, E-4, E-7, E-9, E-11–E-17, E-20, E-24, E-26, E-30–E-32, E-34, E-35, E-40–E-42, E-45, E-49, E-50) and the replaces E-5, E-6, E-19, E-22, E-23, E-39, E-46, E-47. Judged under the same brief (`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`), with batches 1–3 settled (`…-B1-verification.md`, `…-B2-verification.md`, `…-B3-verification.md`). Each entry was re-derived from the plan at `2331baf` and at its parent `ec3b057`, the architecture at `ec3b057` and the spec; the saved copies `plan-2331baf.md`, `plan-ec3b057.md` and `arch-ec3b057.md` in the audit folder were checked byte-identical to `git show` of each (`cmp`, no output). The plan gate was re-run on a tree extracted with `git archive 2331baf` into `scratchpad/so3/tree/`. Web quotes were fetched with `curl` and checked with `webquote.py` (exit 0). Throwaway experiments ran on Node v22.22.2 (SQLite 3.51.2) and TypeScript 5.9.3; in `[[ran]]` lines, `so3/x/fts.mjs`, `so3/x/rw.mjs`, `so3/x/like.mjs` and `so3/x/lit.ts` are scripts in the session scratchpad (`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/`), and `plan-2331baf.md` is the saved plan in its `audit/` folder. A later review record cited here is a claim I checked at source, not backing.

The coordinator's verified count stands over the first audit's own `is_error.py` numbers: across all 142 transcript files, Read/Edit/Write results never carry `is_error: false` (Read absent 617 / true 9; Edit absent 189 / true 1; Write absent 101 / true 15; Bash false 3693 / true 40). The first audit's smaller counts (79 files; "none of 67"; "0 of 67") point the same way; its conclusions that depend on them hold on the larger count.

### E-2
**Agree/Disagree:** Disagree with the verdict (keep → replace). Agree with most of the reasoning; one statement in the hunk is false.
- G6 and N1 are real at source, and the hunk declares `modify: …/generate.ts` as G6 requires. The gate passes (re-run: `OK: 40 steps, 13 elements, 156 test specs, 27 probes cited, regions current`, exit 0).
- The hunk says Step 38 builds out "every fixture only a `T-38` replay uses", and lists `pristine-tree`. That fixture is not T-38-only. `T-31-1` and `T-32-1` consume it at Steps 31–32, and Step 28's replay harness uses it as the default when a test names no fixture. Neither Step 31 nor Step 32 declares `modify: generate.ts` (the §5.1 row lists S13, S14, S15, S18, S28, S30, S38).
- So the plan does not say whether `pristine-tree` is complete as Step 1's single-commit baseline or gains a scenario at Step 38. If it gains one, the tests of Steps 28, 31 and 32 run against a different fixture after Step 38 than when they were written. No `T-38` spec states a planted scenario for it; `T-38-25` says only "`pristine-tree`". A builder would have to guess.
- The first audit did not check the list against the fixtures' consumers. Its "None better" is therefore unsupported for this one item.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L6090-L6093]] "in `test/fixtures/generate.ts` (G6) every fixture only a `T-38` replay uses:"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L6093]] "`pristine-tree`, `secret-injection` (including a planted filename that"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11238-L11239]] "**Real/doubles.** Real `ctxoracle init`; fixture `pristine-tree`; real"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11290-L11291]] "**Real/doubles.** Real CLI; fixture `pristine-tree` after init plus"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L4892]] "fixture repository the test names (`pristine-tree` when it names none);"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L643]] "| middleware/context-oracle/ctxoracle/test/fixtures/generate.ts | modify | S13, S14, S15, S18, S28, S30, S38 |"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11872-L11873]] "policy Step 38 states (the default runner network); `pristine-tree`."
- [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@ec3b057:L202-L204]] "Every step whose §12 test consumes a fixture declares `modify: middleware/context-oracle/ctxoracle/test/fixtures/generate.ts` and names the fixture it builds out."
- [[ran]] `node middleware/context-oracle/.claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check middleware/context-oracle/docs/plans/plan-phase-a.md` (in the `git archive 2331baf` tree) → `OK: 40 steps, 13 elements, 156 test specs, 27 probes cited, regions current`, exit 0
**Correct verdict:** replace. Keep the declaration, the floor rule and the planted `isSuspect` filename. Take `pristine-tree` out of the "only a `T-38` replay uses" list, or state that its Step 1 baseline is its whole scenario and that Step 38 does not change it.

### E-4
**Agree/Disagree:** Disagree with the verdict (keep → replace). Agree with the hazard derivation. The reasoning misses that the second half of the rule cannot be carried out as written.
- The hazard is real. AD-3 lets `CTXORACLE_HOME` select the home. Step 32's `--replace` import replaces the live global store, bindings included. Importing Max Cogar's export into the shared home would therefore overwrite or unbind the leg-2 data. A fresh home per export avoids this with no new mechanism. That part stands.
- The hunk then says "`status` is then read with the same `CTXORACLE_HOME`". Step 33's `status` finds its store only through Step 28's `findRepoRoot` + `lookupBinding` on the directory it runs in. With no binding it prints "this directory is not set up".
- In the fresh home the only bindings are the imported ones. They name Max Cogar's paths, and Step 32 itself says those paths do not exist on the report machine ("paths differ between machines"). A `status` run anywhere on the report machine therefore finds no binding and cannot render the imported project store. The one remedy Step 32 names is `ctxoracle init` in the repository. That writes a new binding and runs a first index in that home, which is not a read of the imported data.
- So the report-machine procedure has a step with no stated way to perform it. The builder must invent one: a `status` option naming a key or store, running under a matching path, or `init` over the import. That is the "too unclear to act on without guessing" class.
- Minor point: the first audit's fact "Home selection by environment is an existing surface" quotes D-plan-43, which does not say that. The supporting line is AD-3's `CTXORACLE_HOME` override.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L6341-L6347]] "`CTXORACLE_HOME=<a fresh directory per export> ctxoracle import <dir>` on the report machine, never into the report machine's own home"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L6347]] "same `CTXORACLE_HOME`. The report lists them separately with driver \"Max Cogar\". The"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5732-L5735]] "`status` finds the repository the way the handler does (Step 28's `findRepoRoot` + `lookupBinding`); with no binding it says \"this directory is not set up — run `ctxoracle init` here\""
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5582-L5587]] "with `--replace` the global import **replaces the live global store, bindings included** — `import` then lists every imported `repo_path:` binding whose root does not exist on this machine and tells the owner, in plain language, to run `ctxoracle init` in each repository here (a binding names a path, and paths differ between machines)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L381]] "1. **Decision.** Root `~/.ctxoracle/` (override: `CTXORACLE_HOME`), directories"
**Correct verdict:** replace. Keep the per-export home and its reason. State how the report reads an imported store that has no live binding on the report machine, for example a `status` form that names the store's key, and pin it in Step 39's procedure.

### E-5
**Agree/Disagree:** Agree with the verdict (replace). Agree with the reasoning, checked at source. I add one point the first audit did not carry into the fix.
- The claim that the adaptation is compile-only, with "no behaviour decision", is false at this commit. Step 6's delta makes `headline` a structured `Headline`, and the skeleton's `Candidate.headline` is a `string` that `coupling.ts` builds from a template string. Making the genres compile means choosing each genre's parts and slots, which is Step 16–19 work.
- None of the twelve Step 1–12 declarations names a genre, bar, compose or handler module. I counted 0 such paths across the 12 declarations at `2331baf`, so §5.1 omits every file the adaptation must touch.
- "May be red here" contradicts the checkpoint's own `npm test`, which runs the whole compiled suite through `run-tests.mjs`.
- The point I add: R15 goes further than the checkpoint and says "`npm test` is green again at Checkpoint 2 for Steps 1–20". At Checkpoint 2 the skeleton tests of Steps 21–39 are still in the suite, so a whole-suite `npm test` cannot be green "for Steps 1–20" only. R15 must change with the checkpoint. The first audit said R15 "follows"; the fix should name it.
- `T-37-1` is sound as the closing check for `SKELETON` marks in `src/`.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L6551-L6554]] "modules of Steps 13–39 are edited only as far as needed to **compile** against the new Step 3/6/9/12 signatures (argument and type renames, no behaviour decision"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1852]] "`headline: Headline`, `evidenceJson`. *`Pointer`* is `{kind: 'file', fileId,"
- [[middleware/context-oracle/ctxoracle/src/types/candidate.ts@2331baf:L25]] "headline: string;"
- [[middleware/context-oracle/ctxoracle/src/genres/coupling.ts@2331baf:L25]] "headline: `${p.path} changed together with ${target} in ${p.pairCount} of its last ${p.aCount} changes`,"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L6562-L6566]] "may be red here; each red one is listed in the implementation log with its cause and goes green, or is retired by its step's full build."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12223-L12225]] "`npm test` is green again at Checkpoint 2 for Steps 1–20 and at Checkpoint 3 for Steps 1–28."
- [[middleware/context-oracle/ctxoracle/package.json@2331baf:L14]] "\"test\": \"node scripts/run-tests.mjs\""
- [[ran]] an awk pass over every `step-decl` block of `plan-2331baf.md` whose `step:` is S1–S12, counting lines naming `src/genres`, `src/hook/handler`, `src/bar` or `src/compose` → 12 declarations matched, `0` such lines
**Correct verdict:** replace. As the first audit states: a declared adaptation, or an honest red-until-rebuilt statement with a `todo` form. Also correct R15's "green again at Checkpoint 2 for Steps 1–20" to match.

### E-6
**Agree/Disagree:** Agree with the verdict (replace). I agree with most of the reasoning; three statements need correcting.
- **Process.** Verified. §10A (plan L7476 up to §11 at L8203) names D-plan-1 to D-plan-32 and none of D-plan-33 to D-plan-44. That alone is a `replace` under `CLAUDE.md` rule 2.
- **D-plan-39.** The premise is false for the tools the rule reads. The coordinator's count over all 142 transcripts: Read/Edit/Write never carry `is_error: false`, and their failures carry `true`. I do not accept the first audit's framing that the plan "narrowed AD-16". AD-16 at `ec3b057` itself says "a result whose outcome the reader cannot establish is not admitted". D-plan-39 applies that rule faithfully, but with the wrong success signal. The defect is therefore the premise, and it is shared with AD-16's "cannot establish" rule over an undocumented layout. It should be raised against AD-16 in §16 as well as fixed in the plan. The fix "successful unless `is_error: true`" is backed by the observed failures, all of which carry `true`.
- **D-plan-36.** Agree, with a more precise statement of where the paths disagree. Step 14 lower-cases every term first. The path fallback is a range query over tokens lower-cased in JavaScript, so paths agree with FTS on non-ASCII text; `T-14-5`'s one non-ASCII item, `lib/café-x.ts`, is a path. The disagreement is in symbols only: `name LIKE` under `NOCASE` folds ASCII letters only, while unicode61 folds Unicode. `T-14-5`'s symbols (`helper`, `user_name`, `getUserName`, `$store`) are all ASCII, so the test passes. Re-executed: a symbol `Über` searched as `über` is found by FTS5 and not by `LIKE`, while `Café` searched as `café` is found by both (only the ASCII `C` differs). "Provably the same query" is false for a symbol containing a non-ASCII capital letter.
- **D-plan-37.** Liveness is written at `SessionStart` (Step 28 item 6). So "newest liveness row" means the most recently started session. The plan's claim that this is "the session Max is working in" is not established. Agree.
- **D-plan-42.** Reproduced: a missing path under `?mode=rw` throws `unable to open database file` and creates nothing, and an existing store under `dir with #?` opens.
- **D-plan-40, point (7).** The content-mode `filenames: []` case rests on the later hunt's reading of the binary. I found no Grep `toolUseResult` carrying a `mode` field in this machine's transcripts to check it against, so I record that point as not re-verified. It does not change the verdict.
- **D-plan-44.** The weight's reason "1 is the skeleton's value" is at Step 12 L2797, not in D-plan-44. The first audit's point stands.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L7375-L7376]] "were reasoned in writing in this pass, **without** the Clear Thought MCP server or CodeGraph"
- [[ran]] `sed -n 7476,8202p plan-2331baf.md | grep -o "D-plan-[0-9]*" | sort -u` → D-plan-1 to D-plan-32 only; `grep -c "D-plan-3[3-9]\|D-plan-4[0-4]"` over the same range → `0`
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L7437-L7438]] "`is_error: false` is the only success signal observed (227 of 320 results carry it)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1752-L1754]] "The tool-result layout is undocumented (V12), so a result whose outcome the reader cannot establish is not admitted."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L7416-L7417]] "make the two paths provably the same query (`T-14-5`)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10141-L10144]] "`lib/café-x.ts`; symbols `helper`, `user_name`, `getUserName`, `$store`; queries `util`, `schem`, `b`, `café`, `help`, `user`, `USER`,"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L3120-L3129]] "A term is lower-cased and must be a single token" and "paths by the indexed range `token >= ? AND token < ? || char(0x10FFFF)` over `path_tokens`, whose rows the indexer writes for every file in both states: the path's tokens split on `/[^\p{L}\p{N}\p{Co}]+/u` (unicode61's separator rule) and lower-cased."
- [[ran]] `node so3/x/fts.mjs` (Node v22.22.2; FTS5 `unicode61 remove_diacritics 0 tokenchars '_$'` versus a table indexed `COLLATE NOCASE`; rows `Über`, `user_name`, `getUserName`, `Café`, `café`) → `"über" FTS ["Über"] LIKE []` / `"user" FTS ["user_name"] LIKE ["user_name"]` / `"café" FTS ["Café","café"] LIKE ["Café","café"]` / `"CAFÉ" FTS ["Café","café"] LIKE []`
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L7422]] "working with, which is the session with the newest liveness row. *Rejected:*"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L4983-L4984]] "6. `SessionStart`: the **liveness row** (`session_log` `event_type = 'liveness'`"
- [[ran]] `node so3/x/rw.mjs` → `missing mode=rw: unable to open database file` / `missing exists after: false` / `existing via URI: [Object: null prototype] { x: 7 }`
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2797]] "weight. 1 is the skeleton's value and keeps a marker file with in-degree 0"
**Correct verdict:** replace. As the first audit states, with two changes. Also raise D-plan-39's success-signal premise against AD-16's "cannot establish" rule in §16. `T-14-5`'s missing case is a symbol containing a non-ASCII capital, for example `Über` searched as `über`. Paths agree by construction.

### E-7
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- I re-ran the parent check: `0fab6d7^` is `e20d001`, and `4e0b0b1` is not an object in this repository.
- I checked every cited range and pointer against the headings at `ec3b057`. AD-5 `:708`, AD-12 `:1253`, AD-13 `:1398`, AD-14 `:1461`, AD-15 `:1564`, AD-16 `:1692`, AD-17 `:1788`, AD-18 `:1882`, AD-20 `:2009`, AD-23 `:2117`, AD-26 `:2366` each open their decision. `:1412` is the confidence formula, `:1419` the purge, `:1957` AD-19's filename rule, and `:144`–`:146` the V20–V22 rows.
- Two ranges are loose by a line or two and mislead no one. AD-4's `:462–530` starts inside the schema block; the heading is at L431. AD-26's `:2458` runs one line past the "Numbered reasoning chain" heading at L2457.
- The block records what was read and where. Several of those decisions were later judged `replace` in batch 3; that lands in the steps and tests that consume them, not in this register.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L8449-L8450]] "(the brief's base hash `4e0b0b1` is not the parent of `0fab6d7`; `e20d001` is)"
- [[ran]] `git rev-parse --short 0fab6d7^` → `e20d001`; `git cat-file -t 4e0b0b1` → `fatal: Not a valid object name 4e0b0b1`
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L8473]] "**Evidence.** Read `:1398–1460` (`:1412`, `:1419`)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1398]] "### AD-13 — Co-change miner"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1412]] "`confidence(a→b) = pair_count / change_count(a)`; `support = pair_count`."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L431]] "### AD-4 — Project-store schema: provenance-mandatory, STRICT"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L2457]] "### Numbered reasoning chain — the decisions that met the Phase 8 trigger"
**Correct verdict:** keep. The register is true of what it records.

### E-9
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- All nine hunks (h251–h259) fall between new lines 9226 and 9261, inside the `generated:tests` markers at L9221 and L9264.
- The gate reports the regions current at `2331baf` (re-run below).
- The rows are the generator's output. The decisions are the steps' `tests:` declarations, which are judged in their own entries.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9221]] "<!-- generated:tests begin -->"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9264]] "<!-- generated:tests end -->"
- [[ran]] `git diff -U0 2331baf^ 2331baf -- middleware/context-oracle/docs/plans/plan-phase-a.md | grep "^@@" | sed -n 251,259p` → new-side starts `+9226`, `+9228,2`, `+9235,5`, `+9241,4`, `+9251`, `+9253`, `+9255`, `+9257`, `+9260,2`
- [[ran]] `derive-plan-sections.mjs --check` (the `git archive 2331baf` tree) → `OK: 40 steps, 13 elements, 156 test specs, 27 probes cited, regions current`, exit 0
**Correct verdict:** keep. These are generated rows, and the gate reports them current.

### E-11
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- Every clause of Step 4's `ensureHome` delta has a failing condition:
  - the three directories at `0o700`;
  - no `projects/` entry;
  - the returned `<home>/diagnostics`;
  - the loose-mode `diagnostics/` left unmodified and listed.
- Data (a) runs `ensureHome` alone and then `ensureLayout`, so the call order Step 4 states is exercised.
- A build that created a `projects/` entry (N15) or omitted `diagnostics/` (G35) fails.
- The disagreement with `T-28-7(e)` is that test's defect (E-33), not this one's.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9464-L9469]] "OR `ensureHome` on the empty home does not create `<home>/`, `global/`, and `diagnostics/` or creates any `projects/` entry, OR the loose-mode directory is modified, OR `looseMode` does not list it, OR `ensureHome`'s returned path is not `<home>/diagnostics`."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9461-L9463]] "(a) empty temp home — `ensureHome` alone, then `ensureLayout`; (b) temp home with a pre-existing `projects/<key>` at mode 0o755; (c) a temp home with a pre-existing `diagnostics/` at 0o755."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1471-L1473]] "— creates `<home>/`, `<home>/global/`, and `<home>/diagnostics/` at `0o700` when missing"
**Correct verdict:** keep. The test asserts Step 4's stated behaviour, and each assertion can fail.

### E-12
**Agree/Disagree:** Disagree with the verdict (keep → replace). Agree with most of the reasoning, but `T-5-4` does not fully discriminate.
- `T-5-5` is right. It pins raw bytes, a returned non-zero status and the recursion-guard variable Step 5 sets.
- `T-5-4`'s null-on-invalid and distinct-escape clauses are right too. A `fatal: false` decoder returns U+FFFD and fails. A latin-1 decoder never returns `null` and fails.
- Two data items are not tied to any failing condition:
  - **The empty buffer.** It is listed in Data, but no "Fails when" clause mentions it. `git ls-files -z` on a tree with no files prints nothing. A `splitNul` that returns `['']` for an empty buffer instead of `[]` would pass this test, and the walk would then index one empty path. The test cannot catch that.
  - **The two fields of `a\0b\0`.** They are checked by count only ("returns other than two fields"), not by content.
- The `café.txt` clause is also loose: "does not decode" is satisfied by any non-null string. The invalid-byte clauses happen to catch the realistic wrong decoders, so this one is minor.
- The first audit's "Each 'Fails when' clause would catch the corresponding wrong behaviour" is therefore not true of every datum the test lists.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9526-L9532]] "`café.txt` as UTF-8; `bad\xff.txt` and `bad\xfe.txt` as raw bytes; `a\0b\0` (two fields, trailing empty dropped); an empty buffer."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9529-L9532]] "**Fails when** `café.txt` does not decode, OR either invalid name decodes to anything but `null`, OR the two escapes are equal or differ from `bad\\xff.txt`/`bad\\xfe.txt`, OR `splitNul` returns other than two fields."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1610-L1612]] "`splitNul(buf: Buffer): Buffer[]` (fields between NULs, a trailing empty field dropped)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9542-L9544]] "**Fails when** the call throws, OR `status` ≠ 1, OR `stdout` is not exactly those three bytes, OR the echo differs from the input, OR the child lacks `CTXORACLE_INTERNAL=1`."
**Correct verdict:** replace. Keep `T-5-5` and `T-5-4`'s cases. Make `T-5-4` fail when `splitNul(a\0b\0)` is not exactly `[a, b]`, when `splitNul` of the empty buffer is not `[]`, and when `café.txt` decodes to anything but `café.txt`.

### E-13
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- I recounted AD-17's list at `ec3b057`: 19 codes, including the two reserved. With `store_busy` and the nine plan-named codes that makes 29, which matches Step 6's list and the test.
- I checked every code the plan names as a fault or code (a grep for "fault/code `x`" and "`x` fault"). All are in the 29.
- "Holds a code not in the list" makes the removed `whisper_dropped_stale` fail.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9551-L9558]] "the 19 AD-17 codes (including `repo_not_bound`, `whisper_dropped_unverifiable`, `import_rejected`, and the two reserved), `store_busy`, and the nine plan-named codes"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9560-L9562]] "**Fails when** `FAULT_CODES` holds a code not in the list OR lacks one, OR a value assignable to `FaultCode` is outside the tuple"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1834-L1836]] "and two reserved codes whose detectors belong to later phases — `model_path_down` (Phase B; Phase A has no model path and `status` says so) and `missed_skill_block` (Phase C, `FR-C4`)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1777-L1778]] "from AD-26 — `store_busy`; plan-named — `tuning_missing`, `head_unresolved`, `miner_unparsed_numstat`, `reindex_locked`, `frontend_parse_failed`, and four"
- [[ran]] a grep of `plan-2331baf.md` for backticked names after "fault"/"faults"/"code" or before "fault", each compared with the 29 → none outside the list (the only other hit is the English word `store`)
**Correct verdict:** keep. The test lists exactly the set it guards.

### E-14
**Agree/Disagree:** Agree that `T-6-3` stands. Disagree with the verdict for the hunk (keep → replace), because `T-6-4` cannot fail on a wrong role mapping.
- **`T-6-3`.** Re-executed: TypeScript 5.9.3 rejects `lit(s)` for `s: string` with TS2345 and compiles a literal and a template literal. The test pins the property, and the build's own literal calls act as the positive control.
- **`T-6-4`, encoding half.** The main key, the empty agent id, the `sub:` form and cross-session distinctness each fail when wrong.
- **`T-6-4`, role half.** Step 6 defines `consumerRole` as `main` → main and `sub:` → subagent, and says the role drives FR-O6's main-only deny. The test asserts only two things about it:
  - `('s1','main')` does not have role `main`;
  - `'garbage'` throws.
- It never asserts that `consumerRole(consumerKey('s1'))` is `main` or that `consumerRole(consumerKey('s1','ag1'))` is `subagent`. A `consumerRole` that returns `subagent` for every well-formed key passes `T-6-4`, and the main agent would then never be denied. That fails the brief's question of whether the test would fail if the behaviour were wrong. The first audit's "each clause would catch the wrong behaviour" does not hold for the role.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1800-L1803]] "`consumerRole(key): 'main' | 'subagent'` reads the part after the **first** `#` (`main` → main, `sub:` prefix → subagent; anything else throws, so a malformed key never silently reads as main). The role is used only for FR-O6's main-only deny (Step 25)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9592-L9599]] "`('s1')`, `('s1', '')`, `('s1', 'ag1')`, `('s1', 'main')`, `('s2', 'ag1')`; `consumerRole('garbage')`." and "**Fails when** the first two are not `s1#main`, OR `('s1','ag1')` is not `s1#sub:ag1`, OR `('s1','main')` has role `main`, OR `('s2','ag1')` equals `('s1','ag1')`, OR the malformed key does not throw."
- [[ran]] `tsc --noEmit --strict --target es2022 lit.ts` (TypeScript 5.9.3; `lit<const T extends string>(text: string extends T ? never : T)`; calls `lit(s)`, `lit('ok')`, `` lit(`x${s}`) ``) → `lit.ts(4,5): error TS2345: Argument of type 'string' is not assignable to parameter of type 'never'.` only, exit 2
**Correct verdict:** replace. Keep `T-6-3` and `T-6-4`'s encoding cases. Add to `T-6-4`: `consumerRole('s1#main')` is `main` and `consumerRole('s1#sub:ag1')` is `subagent`.

### E-15
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- Each 2026-09-26 case has an accepted and a rejected side, and the "Fails when" covers them all ("any 2026-09-26 case above behaves otherwise").
- One thing to rule out: the `EXPLAIN` case uses a literal `LIKE 'ab%'`, while Step 14's real query is `name LIKE ? ESCAPE '\'` with a bound prefix. If the parameter or the `ESCAPE` clause disabled SQLite's LIKE optimisation, the test would pass while the event-path query scanned. I executed it on a STRICT `symbols` table with the plan's `COLLATE NOCASE` index. All four forms (literal, parameter, parameter with `ESCAPE`, literal with `ESCAPE`) plan as `SEARCH … USING INDEX symbols_name`. So the literal case stands for the real query.
- The FTS case reproduces: `"user"*` matches `user_name` and not `getUserName`.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9628-L9631]] "`EXPLAIN QUERY PLAN` of `SELECT * FROM symbols WHERE name LIKE 'ab%'` names `symbols_name` (not `SCAN symbols`); under `fts: true` `fts_paths MATCH '\"util\"*'` matches a row with path `src/util.ts` and `fts_symbols MATCH '\"user\"*'` matches `user_name` and not `getUserName`."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L3124-L3125]] "Under `'fallback'`: symbols by `name LIKE ? ESCAPE '\'` with `<token>%` (the NOCASE index, Step 7"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9652]] "forbidden table exists, OR any 2026-09-26 case above behaves otherwise."
- [[ran]] `node so3/x/like.mjs` (Node v22.22.2, SQLite 3.51.2; STRICT `symbols`, `CREATE INDEX symbols_name ON symbols(name COLLATE NOCASE)`) → each of `LIKE 'ab%'`, `LIKE ?`, `LIKE ? ESCAPE '\'`, `LIKE 'ab%' ESCAPE '\'` → `SEARCH symbols USING INDEX symbols_name (name>? AND name<?)`
- [[ran]] `node so3/x/fts.mjs` → `"user" FTS ["user_name"] LIKE ["user_name"]`
**Correct verdict:** keep. The schema cases discriminate, and the index case holds for the query Step 14 actually runs.

### E-16
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- The test compares `PRAGMA table_info(whisper_stats)` with exactly AD-5's six columns and key. It rejects a duplicate key and fails on the superseded window columns.
- The "Fails when" names only the window columns and the key. The Data line, however, states the exact expected column list, so a test writer has the full expected value and a missing or extra column fails the comparison. Nothing is left to guess.
- `deinit --purge`'s effect on these rows (B3b E-8) is Step 32's behaviour, not this table's shape.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9660-L9663]] "`PRAGMA table_info( whisper_stats)` compared to `genre, project_key, sent, corrected_false, corrected_missed, published_at` with primary key `(genre, project_key)`; a second row with the same `(genre, project_key)` is rejected."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9665-L9667]] "**Fails when** a table is missing or a fifth Phase A table is present, OR `whisper_stats` has a `window_start`/`window_end` column or a different key."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L719-L720]] "whisper_stats(genre, project_key, sent, corrected_false, corrected_missed, published_at, PRIMARY KEY(genre, project_key))"
**Correct verdict:** keep. The test pins AD-5's replica shape.

### E-17
**Agree/Disagree:** Disagree with the verdict (keep → replace). Agree with the reasoning for most of the surface. Two new DAO cases could pass while the DAO is wrong.
- `ensureHistoryRow`, `markAbsentExcept`, `sweepUnreferenced` (with its Step 14 call site), `bump`, `rebuildMinerKinds`, `corrections.since`, `replaceForProject` and DAO composition each have a failing condition that discriminates.
- **`okEditedPaths`.** Step 9 declares it as `okEditedPaths(session, consumer)`, and the per-consumer key exists because a cross-session leak was executed (G23). The test's case is only "excludes a `failed` Edit and a Bash row". A DAO that ignores its `session` and `consumer` arguments passes. I found no other test that plants another consumer's `ok` Edit for this reader: `T-18-6` and `T-18-7`, the Completeness and Verification consumers of the change set, have no such variant. A Stop in one session could then report another session's edits as its change set, and nothing would fail.
- **`subjectKeyForText`.** It is defined as the newest row with `kind = 'whisper'` and equal text. The test has no non-whisper row (a deny row) with the same text, so a DAO that drops the `kind` filter also passes. This is minor, but it is the reseed's mapping.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2465-L2467]] "`okEditedPaths(session, consumer)` (G22 — the distinct paths of `outcome = 'ok'` rows whose tool ∈ `EDIT_TOOLS`);"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9696-L9697]] "unmatched text; `observed_actions.okEditedPaths` excludes a `failed` Edit and a Bash row;"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2451-L2453]] "`subjectKeyForText(text): string | null` (the newest `kind = 'whisper'` row whose `text` equals the argument"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9694-L9696]] "`whisper_audit.subjectKeyForText` returns the newest matching row's `subject_key` and `null` for an unmatched text"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10445-L10448]] "Four variants: no run; run `ok`; run `failed`; `make check` (class 3); plus a Go variant (`pkg/a.go` edited, `pkg/a_test.go` covering it by the same-directory rule, Step 14) with no run."
- [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@ec3b057:L523-L525]] "**Evidence (executed, real binary).** (a) A question opened by `UserPromptSubmit` in session `s1` denied an Edit in session `OTHER` with a different transcript"
**Correct verdict:** replace. Keep every case. Add an `ok` Edit by another session and by another consumer of the same session, both excluded from `okEditedPaths(s1, s1#main)`. Add a same-text deny row that `subjectKeyForText` must not return.

### E-19
**Agree/Disagree:** Agree with the verdict (replace). Agree with the reasoning; I re-derived both defects from Step 13's own text.
- **`T-13-5(b)` cannot pass on a faithful build.**
  - Step 13 commits a chunk when its transaction has spent `miner.chunk_ms` writing. It names no pause between chunks. `chunk_gap` occurs 0 times in the plan.
  - The settled measurement is 1 success in 15 with no gap and 15 in 15 with a gap of 25 ms or more.
  - The test requires none of 200 appends to raise `StoreBusy`, so it fails against the step as written. The step needs the settled yield; the test is right.
- **`T-13-5(a)` contradicts the step.**
  - A pass whose `mining_in_progress` is already `'1'` is *full*, and a full pass's `<range>` is `HEAD`. The purge runs only on the rewrite path.
  - So the continuation after the kill re-streams every commit already committed in chunks and bumps `change_count` and the pairs again.
  - Step 13 never calls `commits.exists` to skip them. The DAO provides the method, but no Step 13 text uses it.
  - The test requires the completed store to equal an uninterrupted mine. The step and the test disagree.
- `T-13-1` to `T-13-4` stand. `T-13-4` applies the settled label order: a 40-file revert labels every file, and a 40-file `fix lint` gets no fix label under the seeded `max_transaction_entities = 30`.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2875-L2876]] "`<range>` is `<watermark>..HEAD` for an incremental pass and `HEAD` for a full one."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2952-L2953]] "`schema_meta.mining_in_progress` is already `'1'` (a full pass that crashed: its continuation keeps the flag), or on a history rewrite."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2941-L2943]] "a chunk is committed as soon as its transaction has spent `miner.chunk_ms` writing (measured with `performance.now()` inside the transaction, checked after each commit's rows)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10017-L10019]] "OR the completed store differs from a single uninterrupted mine, OR any of the 200 appends raises `StoreBusy`."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2705]] "- `miner.max_transaction_entities` = `30`; `miner.horizon_years` = `5`;"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L58-L59]] "Chunked mining with no gap: the handler succeeded 1 of 15 times. With a 25 ms or 50 ms gap: 15 of 15."
- [[ran]] `grep -c chunk_gap plan-2331baf.md` → `0`; `grep -n "commits.exists"` → only the Step 9 provides list and DAO table (L2347, L2367), no Step 13 use
**Correct verdict:** replace. Add the ≥ 25 ms inter-chunk yield to Step 13, and state that a crash continuation either purges first or resumes incrementally from the watermark. Keep every test assertion.

### E-20
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- The four added clauses each fail on the defect they target:
  - "`total_changes()` unchanged" catches any write on an idempotent second run, including the cumulative `entry_score` batch 2 settled;
  - the `path_tokens` invariant catches a file without the fallback's tokens;
  - the byte-cap fault detail (`cap: 'bytes'`, `lines` null) pins AD-12's order;
  - `refreshIfStale(store, checkoutRoot)` is exercised in all four `HEAD` layouts, including a linked worktree, and in the unborn-branch case.
- How a worktree's `HEAD` is resolved (B3b E-6's symbolic-ref detail) is Step 28's rule. This test passes the worktree's root as the step states.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10038-L10043]] "the > 1 MB file is not path-only with an `index_path_only_oversize` fault (`cap: 'bytes'`, `lines` null), OR the secret appears verbatim in the store, OR the second run writes rows — including any `entry_score` update (`total_changes()` is unchanged across it — N4)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10048-L10049]] "`fts_paths` row count is not equal to the `files` row count, OR any `files` row lacks its `path_tokens` rows, OR — the"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10070-L10072]] "`refreshIfStale(store, checkoutRoot)` twice (for the worktree layout, `checkoutRoot` is the worktree's own root); then `runIndex`"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B2-verification.md@HEAD:L134]] "- Recompute `entry_score`, not accumulate it."
**Correct verdict:** keep. Each added assertion can fail, and each follows the step it tests.

### E-22
**Agree/Disagree:** Agree with the verdict (replace). Agree with the reasoning. Below I set out how Python actually resolves an absolute import, which the first audit stated in one sentence, and I narrow its proposed fix.
- **How Python resolves `import a.b`.** Per the language reference and tutorial:
  - the interpreter first looks for a built-in module;
  - it then searches `sys.path` in order;
  - `sys.path[0]` is the script's directory for `python script.py`, or the current working directory for `python -m` and `-c`;
  - `PYTHONPATH` follows;
  - the installation-dependent default comes last, conventionally `site-packages`;
  - pytest's default `prepend` import mode also inserts each test module's own directory.
  So "the repository root" is on the search path only when an entry point happens to sit there, the working directory is the root, `PYTHONPATH` says so, or the package is installed. It is not Python's rule.
- **What the plan's rule does.** It resolves against the root and classes every miss as `external`. An in-repo module the root lookup cannot find is reported as external, never unresolved. Examples: a `src/` layout imported as `pkg.mod`, or a sibling module imported by a script in a subdirectory. So the unresolved share that exists to expose missing imports cannot see these.
- **The two `T-15-5` defects.**
  - Its Python cells only pin that rule. `os` as external and `pkg.sub.m` as resolved from the root pass whether or not the rule is right. The table has no in-repo module that the root lookup misses.
  - Its TypeScript half has no workspace-package cell, which the settled B3b E-15 correction requires.
- **Narrowing the fix.** "The importing file's directory and its ancestors" (the later `d616f1f` rule) is also a heuristic, not Python's semantics. The root-cause fix is the classification: a name found nowhere in the repository is `unresolved` unless its top-level name is standard library (`sys.stdlib_module_names`) or a declared distribution. The chosen search roots are then disclosed as a heuristic.
- **Backing, not.** The owner-messages line the first audit cites is Claude's own report, quoted as context before an owner message. It corroborates the finding but is not backing; the docs are.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L3430-L3434]] "an absolute dotted name resolves against the repository root (`a.b` → `a/b.py` or `a/b/__init__.py`) → `resolved` when it exists, otherwise `external` (Python has no alias mechanism in the language; an absolute name outside the repository is the standard library or an installed distribution)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10238-L10239]] "(`pkg/sub/m.py`), `..n` (`pkg/n/__init__.py`), `.missing` (unresolved), `os` (external), `pkg.sub.m` (resolved), `pkg/sub/m.ts` present but"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10234]] "(declared → external), `node:fs` and `path` (builtins → external),"
- [[https://docs.python.org/3/tutorial/modules.html]] "When a module named spam is imported, the interpreter first searches for a built-in module with that name."
- [[https://docs.python.org/3/tutorial/modules.html]] "The directory containing the input script (or the current directory when no file is specified)."
- [[https://docs.python.org/3/tutorial/modules.html]] "The installation-dependent default (by convention including a site-packages directory, handled by the site module)."
- [[https://docs.python.org/3/library/sys.html]] "python script.py command line: prepend the script's directory"
- [[https://docs.python.org/3/library/sys.html]] "python -m module command line: prepend the current working directory."
- [[https://docs.pytest.org/en/stable/explanation/pythonpath.html]] "the directory path containing each module will be inserted into the beginning of sys.path if not already there"
- [[https://docs.python.org/3/library/sys.html]] "A frozenset of strings containing the names of standard library modules."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L142-L143]] "E-15: in-repo workspace specifiers are never external; the unsafe direction is disclosed in L6."
- [[ran]] `git log --format='%h %ad %s' --date=iso -1 d616f1f` → `d616f1f 2026-09-26 10:48:21 +0000 context-oracle: Python resolver follows sys.path[0] ancestor lookup (plan only)`; `git merge-base --is-ancestor 2331baf d616f1f` → exit 0
**Correct verdict:** replace. Keep `T-15-1`, `T-15-2`, `T-15-6`, the PEP 328 cells and the capability assertions. Classify an absolute Python name found nowhere in the repository as `unresolved` unless it is standard library or a declared distribution. Add cells for an in-repo module the root lookup misses and for a missing absolute name. Add the TypeScript workspace-package cell.

### E-23
**Agree/Disagree:** Agree with the verdict (replace). Agree with the core reasoning. The two numbers hold, derived below. Two statements need correcting.
- **Where each factor comes from.** AD-14 at `ec3b057` gives:
  - the trust composition, ratio × `bar.untrusted_trust_factor` (0.9);
  - the order: staleness and recency dampen first, then trust, then the caps;
  - the illustrative floor 0.6 and high tier 0.8.
  AD-13 requires recency to be "used as a confidence dampener", and neither decision gives its formula. The formula `0.5 ^ (age_days / bar.recency_half_life_days)`, the 365-day half-life and `bar.stale_index_factor` 0.8 are the plan's `plan_seed` rows. They were already in the parent plan (`ec3b057` plan L2111, L2594), not new in `2331baf`. So the silencing comes from AD-14's order of operations, which multiplies onto the finished confidence, combined with the plan's older half-life seeds. Both must be decided together.
- **Arithmetic.** Confidence is c = r × 0.9 × 0.5^(a/365), times 0.8 when the index is stale. The Coupling floor is 0.6 (Coupling is not a hazard, so the floor gates it) and the high tier is 0.8.
  - A 20-of-20 pair (r = 1), fresh index. It falls below the floor when 0.9 × 2^(−a/365) < 0.6, i.e. 2^(−a/365) < 2/3, i.e. a > 365 × log2(1.5) = 365 × 0.58496 = **213.5 days**. It is high only while 2^(−a/365) ≥ 0.8/0.9 = 0.8889, i.e. a ≤ 365 × log2(1.125) = 365 × 0.16993 = **62.0 days**.
  - r = 0.95 (19/20): below the floor past 365 × log2(0.855/0.6) = 186.5 days; high only until 365 × log2(0.855/0.8) = 35.0 days.
  - Stale index: the maximum is 0.9 × 0.8 = 0.72 < 0.8, so the high tier is unreachable at any age. A perfect pair falls below the floor past 365 × log2(0.72/0.6) = 96.0 days.
  - Age is measured from the pair's `last_ts` back from `HEAD`'s commit time. So a file pair that always changed together and was last touched eight months before `HEAD` is silent.
- **Correction 1.** The first audit says the recency and staleness factors "are exercised nowhere" and that `T-16-1` "checks a factor, not the product against the floor". `T-16-1` in fact has a twin two half-lives older that "sitting just above the floor when fresh, must fail it when old". So it does pin the product against the floor, for a near-floor fact. What no test pins, and no document states, is the age at which a *strong* fact goes silent or loses the high tier. `T-16-2` covers age zero only.
- **Correction 2.** The fix belongs to AD-14 and the plan's recency seed together, not to AD-14 alone.
**Evidence:**
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1466-L1468]] "**Confidence** `c`: evidence-derived. History facts: `support` and `confidence` from `cochange_pairs`, dampened by staleness (`FR-K7`) and recency, then dampened by trust"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1474-L1475]] "For an `untrusted_repo` fact, confidence = evidence ratio × `bar.untrusted_trust_factor` (seed 0.9, in (0, 1])"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1484-L1485]] "**Composition:** dampen first (staleness, recency, trust), then take the min() over every applicable cap."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1406-L1407]] "recency recorded per pair (`last_ts`) and used as a confidence dampener (recency weighting), tunable."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1533]] "illustrative:** non-hazard `c` floor 0.6 with `support ≥ 3`; high tier"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L3525-L3528]] "recency `0.5 ^ (age_days / bar.recency_half_life_days)` for a mined fact, `age_days = (ctx.refTs − candidate.lastTs) / 86400`, floored at 0; `bar.stale_index_factor` when `ctx.indexStale`"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2717]] "- `bar.recency_half_life_days` = `365`; `bar.stale_index_factor` = `0.8`"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@ec3b057:L2111]] "- `bar.recency_half_life_days` = `365`; `bar.stale_index_factor` = `0.8`"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L2703]] "- `bar.confidence_floor` = `0.6`; `bar.support_min` = `3`;"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10268-L10271]] "two half-lives older — the older must carry one quarter of the fresh confidence and, sitting just above the floor when fresh, must fail it when old)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10286-L10287]] "Mined pair candidates at `lastTs = refTs`, index fresh, `untrusted_repo`: evidence 19/20 (0.95 × 0.9 = 0.855 → high)"
- [[ran]] `python3 -c` computing 365·log2(base/0.6) and 365·log2(base/0.8) for base = 0.9, 0.855, 0.72 → `max 0.9 floor_age 213.5 high_age 62.0` / `max 0.855 floor_age 186.5 high_age 35.0` / `max 0.72 floor_age 96.0 high_age None`
**Correct verdict:** replace. Keep `T-16-1` and `T-16-2`'s age-zero table. AD-14 and the plan's recency seed must state which axis recency acts on and the age at which a strong history fact falls silent or loses the high tier. Then add aged and stale-index cases for a strong pair that pin that decision.

### E-24
**Agree/Disagree:** Disagree with the verdict (keep → replace). I agree the three cells are right. The first audit did not ask whether the cells cover the forms a runner is actually given, and one very common form breaks the rule.
- **The rule.** Step 17 takes as targets the arguments after the runner head that contain a `/` or match a test-path pattern, "normalized to a repository-relative path". Step 18 then subtracts "each test equal to or under a target".
- **The form it misses.** pytest's documented way to run one test is a node id, `pytest tests/test_mod.py::test_func`: the module path followed by `::` specifiers. That argument contains a `/`, so it becomes the target `tests/test_mod.py::test_func`.
- **The result.** The covering test `tests/test_mod.py` is neither equal to nor under that string, so it is not subtracted. The pytest segment is class 1, so the "else" run-state clause renders: `no recognized test run touched it (recognized runners: [list])`. That is false; a recognised runner ran that file. It is a checkably false headline (FR-D1), in the direction AD-15 calls unsafe.
- **Why the test cannot catch it.** `T-17-1`'s cells (a bare file, no target, a target among flags) all pass while this happens. The step needs the target's `::…` suffix stripped (and a `[…]` parametrisation), or such a target treated as unmappable ⇒ subtract all. The test needs the cell.
- **A related gap, not assessed further.** pytest takes the path relative to the working directory, and the cells never run from a subdirectory. The normalisation's base is not tested.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10307-L10309]] "targets: `pytest tests/test_a.py` → `['tests/test_a.py']`, `npm test` → `[]`, `node --test test/x.test.js -v` → `['test/x.test.js']`."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L3625-L3629]] "`targets` are the arguments after the matched runner head that contain a `/` or match a `lexicon.test_path_patterns` member (Step 14's `matchesTestPattern`), each normalized to a repository-relative path; an empty list means **unmappable ⇒ the run subtracts every covering test** (AD-15)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L3843-L3847]] "either outcome — ran (`targets` empty ⇒ all; else each test equal to or under a target); for each remaining test, one candidate: `[test] covers [changed]` + the run-state clause — `; not run this session` when every observed Bash segment is class 2 (or none ran), else `; no recognized test run touched it (recognized runners: [list])`"
- [[https://docs.pytest.org/en/stable/how-to/usage.html]] "Pass the module filename relative to the working directory, followed by specifiers like the class name and function name separated by :: characters"
- [[https://docs.pytest.org/en/stable/how-to/usage.html]] "pytest tests/test_mod.py::test_func"
**Correct verdict:** replace. Keep the three cells. Add a node-id cell (`pytest tests/test_a.py::test_x` → `['tests/test_a.py']`) and make Step 17 strip `::` and `[…]` specifiers, or treat such a target as unmappable.

### E-26
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- **The gate.** Closing `historyAvailable` makes any history candidate fail, apart from the stated `human_stated` Warning exception. That catches N1's executed below-floor whisper, and the same flag covers `mining_in_progress`.
- **The partner assertion.** It is partner-level: the `in_tree = 0` partner must not appear in any candidate, and its exclusion must be reported. The settled B3b E-11 rule removes such a partner from the fact and drops (and counts) only a candidate left with none. On the single-pair Coupling fixture, that is a counted drop. On a multi-partner genre it is a removal. Either way the assertion is satisfied, so the test does not pin the withdrawn whole-candidate drop.
- **`blastRadiusOf`.** The value is fixed by the data: 3 partners, 2 above the floor, plus 1 covering test, = 3.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10496-L10501]] "**Fails when** any history generator emits with the gate closed (a `human_stated` Warning excepted), OR the `in_tree = 0` partner appears in a candidate or is not reported with `not_in_tree`, OR `blastRadiusOf` ≠ 3"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10493-L10495]] "a partner whose row is set to `in_tree = 0`; a file with 3 partners of which 2 clear the floor and 1 covering test (`blastRadiusOf` = 3)"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3b-adjudication.md@HEAD:L64]] "a partner that is not in the tree or is masked (other than the agent's own target) is removed from the fact — its name, ratio and pointer — and a candidate left with no partner is dropped and counted as `whisper_dropped_unverifiable` with its reason"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1425-L1428]] "the history genres — Coupling, Consequence, Warning (from miner-kind landmines; a `human_stated` row is not history-derived and still fires), Completeness — produce no candidates"
**Correct verdict:** keep. The test is compatible with the settled partner rule, and each clause can fail.

### E-30
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- Each added cell is the negative of G23's executed defect, and each fails on a role-keyed build:
  - `T-22-1`: a second session's open must not be `'already_open'` and must not be listed for `s1#main`;
  - `T-25-3`: an `Edit` from `s2#main` is not denied by `s1#main`'s question, and the subagent consumer is not denied either;
  - `T-27-1`: `s2#main`'s row and bookmark are unchanged under every `source` applied to `s1#main`.
- The `detail_json.set = 'questions'` assertion pins the discriminator AD-17 added.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10673-L10674]] "turn is closed, OR the `s2#main` open is reported `'already_open'`, OR `getOpenQuestions(s1#main)` returns `s2#main`'s row"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10850-L10851]] "consumer `s1#sub:abc` (null); an `Edit` from `s2#main` while only `s1#main` has an open question (null — G23)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10899-L10900]] "`detail_json.set = 'questions'`, OR `s2#main`'s row or bookmark changes under any `source` applied to `s1#main`"
- [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@ec3b057:L523-L525]] "**Evidence (executed, real binary).** (a) A question opened by `UserPromptSubmit` in session `s1` denied an Edit in session `OTHER` with a different transcript"
**Correct verdict:** keep. The tests pin per-consumer isolation against the executed defect.

### E-31
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- The four-cell presence table is AC-8a's own conjunction (a done-claim and an open question) and fails on any mismatch.
- The key form, the one-line form (a question holding a newline), the `[oracle] still unanswered: ` prefix and the counters all follow Step 27's stated candidate exactly.
- Dedup of an unchanged open-question set rests on FR-A4 ("Never repeat"), which the spec states generally.
- The audit row is checked through the handler in `T-28-10` (E-33).
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10920-L10922]] "mismatches any cell, OR the candidate's `subjectKey` is not `backstop:` + the sorted open ids, OR its `text` is not one line starting `[oracle] still unanswered: ` quoting each open question"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L4762-L4765]] "`subjectKey = 'backstop:' + <the open question ids, sorted, joined by ','>`, `text = '[oracle] still unanswered: \"<q1>\"; \"<q2>\"'` (each question's text with whitespace runs collapsed to one space — one line"
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ec3b057:L1028-L1033]] "the completion whisper **also carries an outstanding-question line** naming the unanswered question; it is **delivery, not a block** (the stop still proceeds). Where no question is outstanding, no such line appears."
**Correct verdict:** keep. The test pins AC-8a's backstop as Step 27 builds it.

### E-32
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- The hunk changes one clause: it names the malformed-stdin fault's code and its home-level location. Before stdin is parsed there is no repository and so no project channel, so `<home>/diagnostics/` is the only place the fault can go.
- The case still requires exit 0 and empty stdout. The failure fails open and is recorded, which is the visible form the brief's fallback rule accepts.
- It would fail on the skeleton's executed silent swallow (0 faults anywhere).
**Evidence:**
- [[ran]] `git diff -U0 2331baf^ 2331baf -- middleware/context-oracle/docs/plans/plan-phase-a.md`, hunk 316 → `-    \`store_corrupt\`).` / `+    \`store_corrupt\`; the malformed-stdin line is \`handler_exception\` on the` / `+    **home-level** channel \`<home>/diagnostics/\` — G35, executed: zero faults` / `+    anywhere under the skeleton).`
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10988-L10992]] "**Fails when** any case does not yield exit 0, empty stdout, and a JSONL fault line (the truncated store's line carries `store_corrupt`; the malformed-stdin line is `handler_exception` on the **home-level** channel `<home>/diagnostics/`"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3a.md@HEAD:L92]] "`{not json` on stdin to `hook PreToolUse` → exit 0, empty stdout (correct fail-open). JSONL faults under `CTXORACLE_HOME`: 0 before, 0 after, and `diagnostics-orphan/` does not exist."
**Correct verdict:** keep. The clause pins the reporting half of the required fail-open.

### E-34
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- Every expected global row in `T-30-3` follows from Step 30's stated rules:
  - `sent` counts `kind = 'whisper'` rows only, which gives `answer_drift` `sent 0`;
  - a deny correction goes to the deny row's genre;
  - a whisper-less `missed` goes to `--genre`, to `answer_drift` for `--missed-question`, else to `unattributed`.
  A test writer can therefore derive every value from the specification.
- **The late-committer case holds.** SQLite has one writer, so a row's auto-assigned `seq` follows commit order. A `seq` watermark therefore never skips a row that commits late with an earlier `ts`, which is what the case pins (N11).
- **No trend.** Neither test asserts a per-fold trend, so batch 3's "totals hold, trends do not" is respected here.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11227-L11232]] "`coupling {sent 2, cf 1, cm 0}`, `warning {sent 1, cf 0, cm 1}`, `answer_drift {sent 0, cf 1, cm 1}`, `reuse {cm 1}`, `unattributed {cm 1}`, OR the second publish changes any row, OR the late row is not counted by the second fold"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5230]] "`whisper_audit` rows with `kind = 'whisper'` and `seq > wa` as `sent` per"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L757-L759]] "-- WATERMARK: whisper_audit.seq and -- corrections.seq (AD-4) — never -- wall-clock ts."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11205-L11209]] "**Fails when** the global `coupling` row after the concurrent folds is not `sent = 12, corrected_false = 3`, OR the sum of `stats_folds` rows differs from those, OR the two watermarks are not the largest `seq` values"
**Correct verdict:** keep. Both tests separate the replica design from the running sum it replaced.

### E-35
**Agree/Disagree:** Disagree with the verdict (keep → replace). The intent is right. The first audit judged the intent and missed that the clause as written says the opposite.
- The hunk adds two clauses to `T-31-1`'s **"Fails when"** list. The binding clause ("`global_meta` lacks `repo_path:<realpath of the fixture>`") is correctly a failure condition.
- The worktree clause reads "OR `init` run inside a `git worktree add` checkout of the fixture records the **main** root". Inside a "Fails when" list, that makes recording the main root a *failure*. AD-20 requires exactly that behaviour: a worktree's binding records the main repository's root.
- A test writer following the specification literally would assert the wrong behaviour. The only faithful build of AD-20 would then fail the test. The clause needs a negation ("records anything but the main root").
- The first audit quoted this clause as its evidence and read it as the intended requirement.
**Evidence:**
- [[ran]] `git diff -U0 2331baf^ 2331baf -- middleware/context-oracle/docs/plans/plan-phase-a.md`, hunk 319 → `+    \`schema_meta\`, OR \`global_meta\` lacks \`repo_path:<realpath of the` / `+    fixture>\` → the resolved key, OR \`init\` run inside a \`git worktree add\`` / `+    checkout of the fixture records the **main** root, OR stores are missing or not 0o700, OR the first`
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11250-L11257]] "**Fails when** the count of entries matching the Step 31 pattern ≠ 8 in any mode"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11255-L11257]] "OR `global_meta` lacks `repo_path:<realpath of the fixture>` → the resolved key, OR `init` run inside a `git worktree add` checkout of the fixture records the **main** root, OR stores are missing or not 0o700"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L2017-L2020]] "`repo_path:<realpath of the repository root>` → repo key (run inside a git worktree, the root recorded is the main repository's, the same root AD-23's lookup resolves a worktree to)"
**Correct verdict:** replace. Keep both cases. Re-word the worktree clause as a failure condition: "`init` run inside a `git worktree add` checkout records a root other than the main repository's".

### E-39
**Agree/Disagree:** Agree with the verdict (replace). Agree with the reasoning, checked at source.
- **What is written.** Liveness rows are written at `SessionStart` (Step 28 item 6). So Step 34's "the session of the newest `liveness` row" is the most recently started session, and the plan's gloss "(the session Max is working in)" is not what it measures.
- **What the test covers.** Its only two-session case makes the older session `s0` the one not armed, which is the case where start order and activity agree. A build that arms the newest-started session passes even when that session has ended or is not the one Max Cogar is talking to.
- **What nobody is told.** Step 34's printed messages cover the no-liveness case and the two collision cases. Nothing says which session was armed. For a non-programmer owner (OL-11) a wrong arming is invisible.
- `T-34-3` stands. It pins AD-18's `--genre`/`unattributed` booking and the invalid forms.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L5831-L5833]] "`<session>` is `--session` when given, else the session of the newest `liveness` row in this store (the session Max is working in); with no liveness row at all the verb opens nothing and says so."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L4983-L4984]] "6. `SessionStart`: the **liveness row** (`session_log` `event_type = 'liveness'`"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11468-L11469]] "the `Edit` (denied now); an `Edit` from session `s0` (older liveness row) after the correction"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11473-L11476]] "does not fire in `s1`, OR the `s0` `Edit` is denied, OR no `corrections` row with `verdict = 'missed'` and `genre = 'answer_drift'` exists, OR either collision case prints the wrong message, OR the no-liveness store gains a question row."
**Correct verdict:** replace. As the first audit states: choose the session by last activity, print the armed session in plain language, arm nothing (and say so) when it has ended, and add the ended-session and two-live-sessions cases.

### E-40
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- Both replays now fail on the C3 wording ("just edited") and on a missing "the file this edit targets", and `T-38-29` fails on a printed confidence number.
- One limitation, not a defect: `T-38-29`'s flag clause checks the flag against the tier the build itself computes, so on its own it would not catch a wrong tier. The tier values are pinned independently at unit level by `T-16-2` (landmine support 3 → 0.9 high, support 2 → 0.6 uncertain) and end to end by `T-38-16`. The pair of tests together catches it.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11699-L11701]] "**Fails when** the coupled tests are missing OR the headline is a raw count OR the text lacks `the file this edit targets` OR contains `just edited` (V20, L12)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11937-L11941]] "OR `[confidence: uncertain]` is absent on a tier that is not high or present on a high one, OR a confidence number is printed, OR the ⚠ subtype's fallibility note (FR-D4) is missing, OR the text is imperative, OR it lacks `the file this edit targets`."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L10291-L10292]] "0.7, uncertain); a `human` fact (1.0, no dampening); a landmine support 3 (1 × 0.9 = 0.9, high) and support 2 (0.6, uncertain); impact: read"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1588]] "worded as a fact about **the file this edit targets**"
**Correct verdict:** keep. The replays pin the corrected wording and the display rule.

### E-41
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning; I add why the note survives the dampener finding (E-23).
- The assertion is AC-3a's own: the hazard is delivered and flagged. The parenthesis is a correct derivation from D-plan-34's formula at the seeds and at age zero: min(1, 2/3) × 0.9 = 0.6. In JavaScript `Math.min(1,2/3)*0.9` prints `0.6`.
- Recency and staleness can only lower that value, so "< 0.8" and hence the flag hold at any age. The conclusion does not depend on E-23's open decision.
- "Below-floor" in the Data means the support floor (2 < `bar.support_min` 3). A hazard skips the confidence floor and needs only the noise floor, so the "whisper is suppressed" clause is the right negative.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11737-L11739]] "**Fails when** the whisper is suppressed OR `[confidence: uncertain]` is missing from the text (support 2 < `bar.support_min` 3 gives evidence 2/3 × 0.9 = 0.6 < 0.8)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L7391-L7392]] "**D-plan-34 — A miner landmine's evidence ratio is `min(1, support / bar.support_min)`.**"
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1526-L1527]] "Warning-genre candidates skip the confidence floor; they require only the **noise floor**"
- [[ran]] `node -e "console.log(Math.min(1,2/3)*0.9)"` → `0.6`
**Correct verdict:** keep. The note and the assertion are correct under the seeds and under any dampening.

### E-42
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- The hunk renames the expected fault, from `whisper_dropped_stale` to `whisper_dropped_unverifiable` with `reason = 'stale_pointer'`. It changes nothing else.
- A stale span pointer is the fact's own pointer failing verification. The settled E-11 partner rule does not touch that reason, and AD-17 at `ec3b057` lists it.
- The case's Data (a span "mutated between candidate generation and the event's compose") predates this commit and is outside the hunk.
**Evidence:**
- [[ran]] `git diff -U0 2331baf^ 2331baf -- middleware/context-oracle/docs/plans/plan-phase-a.md`, hunk 330 → `-    emitted OR \`whisper_dropped_stale\` is not recorded.` / `+    emitted OR no \`whisper_dropped_unverifiable\` fault with \`reason =` / `+    'stale_pointer'\` is recorded.`
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L11783-L11785]] "**Fails when** the whisper is emitted OR no `whisper_dropped_unverifiable` fault with `reason = 'stale_pointer'` is recorded."
- [[middleware/context-oracle/docs/architecture-phase-a.md@ec3b057:L1830-L1832]] "`whisper_dropped_unverifiable` (a candidate dropped under the rumor rule — `stale_pointer`, `not_in_tree`, or `masked_path`, AD-15/AD-19;"
**Correct verdict:** keep. It is a correct rename to AD-17's code with its reason.

### E-45
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning, with one location correction.
- The edited note is in the question register, §14.1's Q30 (L12352–L12359), not in §13 "Risks", which ends before §14 at L12228. The first audit's "§13's risk note" names the wrong section; the substance is unaffected.
- The hunk marks the plan-named `whisper_dropped_stale` superseded by AD-17's `whisper_dropped_unverifiable` and points to §14.5. The old name thus keeps its history and cannot be read as live. Step 6 (L1786) and `T-6-2` (L9558) state the removal.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12352-L12355]] "**Q30 (Step 6).** Does the fault-code set include codes the architecture names outside AD-17? **Disposition.** Answered: `store_busy` (AD-26) and the plan-named `whisper_dropped_stale` (AD-15's compose-time drop — *superseded 2026-09-26 by AD-17's `whisper_dropped_unverifiable`, §14.5*)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12228]] "## 14. Question register"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L1786]] "`whisper_dropped_stale` is **removed**: AD-15/AD-17 now name the rumor-rule"
**Correct verdict:** keep. The note is a true supersession marker.

### E-46
**Agree/Disagree:** Agree with the verdict (replace). I agree with the reasoning for Q65 and weigh Q58 and Q62 slightly differently.
- **Q65 is false on the evidence available at the time.** "Answered as far as evidence allows" rests on an aggregate. The same transcripts, split by tool, show that successful Read/Edit/Write results carry no `is_error` (coordinator count over 142 files: Read absent 617 / true 9; Edit absent 189 / true 1; Write absent 101 / true 15). The evidence allowed the opposite answer.
- **Q62 and Q58 are true as far as they go.** Q62's "by execution" refers to "not as built": the skeleton's `LIKE` did not use its index. Q58's scheduling answer (build deltas first, then Checkpoint 1R) is also true. Both, though, close the question by pointing to a decision whose own claim is false: D-plan-36's "provably the same query" (E-6) and Checkpoint 1R's "compile only" (E-5). A register entry marked "Answered" by a decision that does not hold overstates closure. They are re-worded with those decisions.
- The rest (Q59–Q61, Q63, Q64, Q66–Q72) record where each question was decided. Q64 and Q69 honestly say "raised for the architecture".
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12559-L12561]] "**Q65 (Steps 20, 21, 28).** What in a forked transcript is \"oracle-injected text\", and which tool results count as successful? **Disposition.** Answered as far as evidence allows — D-plan-39; the unobserved shape is PG-6."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12550-L12552]] "**Q62 (Steps 7, 14).** Can the fallback search satisfy N6's agreement with an index? **Disposition.** Answered by execution (§11.4): not as built; D-plan-36."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12537-L12541]] "**Disposition.** Answered: per-step \"Reopened 2026-09-26 — build delta\" paragraphs built first, then Checkpoint 1R — D-plan-33."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L7437-L7438]] "`is_error: false` is the only success signal observed (227 of 320 results carry it)."
**Correct verdict:** replace. Correct Q65 to the per-tool evidence. Re-word Q58 and Q62 when E-5's and E-6's corrections land. Keep the rest.

### E-47
**Agree/Disagree:** Agree with the verdict (replace), on PG-8. Disagree with half of the PG-6 reasoning.
- **PG-8 names the wrong variable.** It files a failure of `T-13-5` as "a finding on `miner.chunk_ms`". The settled measurement shows that chunk length does not bound the handler's wait and the inter-chunk gap does (no gap: 1 of 15; a gap of 25 ms or more: 15 of 15). It also says "a slower runner could fail it with the design correct", but the design as written has no gap (E-19). A builder following PG-8 would shorten chunks, which cannot fix it.
- **PG-6 is accurate for the case it names.** Step 21's `oracleLines` walks every string value in every entry, splits on newlines, and takes each line holding `[oracle] `. A wrapper that "breaks the line" or rewrites the text still leaves the marker on its first fragment. So `injectedLines` is non-empty, `carriedOracleText` is true, and a zero recovery is the loud `rebuild_recovered_nothing`, as PG-6 says.
- The silent case the first audit describes needs the marker itself not to survive as plain text. That is a different and narrower case than PG-6 claims, and V22 ("Claude Code saves the injected text") makes it unlikely. PG-6 could add it for completeness, but its stated claim is not false. The "fails loudly otherwise" overstatement belongs to D-plan-39's wording, which E-6 already replaces.
- **PG-5 and PG-7 are honest gap records.** PG-7's "none" for Grep/Glob `toolUseResult` in this machine's transcripts matches my own search (E-6).
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12827-L12832]] "**PG-8 — The lock-hold bound on the CI runner is a measurement.** AD-26's claim (a chunked mine keeps a concurrent handler's write under the 200 ms busy bound) is asserted by `T-13-5` on whatever machine runs it; a slower runner could fail it with the design correct."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12831-L12832]] "a failure there is a finding on `miner.chunk_ms`, not a flaky test to retry."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3-verification.md@HEAD:L58-L59]] "Chunked mining with no gap: the handler succeeded 1 of 15 times. With a 25 ms or 50 ms gap: 15 of 15."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L4143-L4145]] "`oracleLines(entries): string[]` — every string value anywhere in every entry (a recursive walk of the JSON), split on `\n`; for each line holding `[oracle] `, the substring from that marker to the line's end"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L4051]] "delivered keys admitted; `carriedOracleText` = `injectedLines.length > 0`. The"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12813-L12815]] "a wrapper that breaks the line recovers nothing, and that is the loud `rebuild_recovered_nothing` (set `delivered`)."
**Correct verdict:** replace. Re-word PG-8 to name the inter-chunk yield as the measured variable. Keep PG-5, PG-6 and PG-7; PG-6 may add the marker-not-preserved case.

### E-49
**Agree/Disagree:** Disagree with the verdict (keep → replace). Agree that every flaw raised is real at `ec3b057` and that raising rather than patching is the right form. But each item carries a *proposed fix*, and four of those fixes carry defects that this audit (E-6) replaces.
- **(e)** proposes that AD-18 name "the session `--missed-question` arms (D-plan-37)". That puts the newest-liveness-row heuristic into the architecture. It measures the most recently started session, not the active one (E-6, E-39).
- **(f)** proposes AD-5 global-import semantics of "replace, then report missing roots" (D-plan-43). That report omits the live bindings the replace deletes (E-6). Step 39's use of it also has no way to read the imported store (E-4).
- **(h)** proposes AD-2 "names the NOCASE index and a token table (D-plan-36)". That fix leaves the symbol fallback disagreeing with FTS on a symbol containing a non-ASCII capital (E-6, re-executed).
- **(d)** proposes stating D-plan-34's landmine ratio in AD-14 without its coupling to `bar.support_min` (E-6).
- **(i)** raises AD-16's reliance on V22's unobserved text shape. It omits the premise that actually disables the read-set reseed: that a successful file-tool result carries `is_error: false`, when none does.
- The first audit calls these "additional items for the correction pass, not defects of the ten as written". A raised item whose proposed fix would carry a known defect into the architecture is itself something that must change, so the unit is not a `keep`.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12891-L12893]] "(e) AD-18's \"the identical deviation is thereafter denied\" names no session now that the consumer key is per session (AD-4) — fix: AD-18 names the session `--missed-question` arms (D-plan-37)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12898-L12900]] "fix: AD-5 states global-import semantics (replace, then report missing roots)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12904-L12906]] "(h) AD-2's \"indexed `LIKE`/token-prefix\" fallback cannot be token-prefix over `symbols(name)`/`files(path)` with a plain index — executed (§11.4) — fix: AD-2 names the NOCASE index and a token table (D-plan-36)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12888-L12890]] "(d) AD-14 gives a hazard (landmine) no evidence ratio, though FR-A5a requires its confidence stated — fix: state the landmine ratio in AD-14 (D-plan-34)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12907-L12910]] "(i) AD-16 relies on V22's documented \"injected text is saved in the transcript\" without an observed shape, and AD-15/AD-6 on a Grep/Glob result list with no documented schema — PG-6, PG-7"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L12873-L12875]] "each raised here (not patched in the architecture) with its evidence and proposed fix; where the plan had to choose to stay buildable, the choice is named:"
**Correct verdict:** replace. Keep every raised flaw and the form. Correct the proposed fixes in (d), (e), (f) and (h) to E-6's corrections. Add to (i) the `is_error` success-signal premise.

### E-50
**Agree/Disagree:** Agree with the verdict (keep). Agree with the reasoning.
- The generated table's own ids for S13–S20 end at `T-20-3`, and for S21–S28 at `T-28-11`. Each range covers every id its steps declare, including the new `T-19-3`, `T-18-9` and `T-21-3`.
- The `T-38` ids some of those steps also list are created at Step 38 and are rightly outside these checkpoints.
- The ranges make no choice of their own. That tests inside them must change (`T-13-5`, `T-21-3`, `T-28-7`, `T-28-11`) is judged in their own entries.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L6572]] "`T-13-1` – `T-20-3`. Owner-visible check: none yet (no hook path exists);"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L6579]] "construction and orchestration for the block. Run `T-21-1` – `T-28-11`"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9243]] "| S20 | T-20-1, T-20-2, T-20-3, T-38-17, T-38-20, T-38-21, T-38-23, T-38-34 |"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L9251]] "| S28 | T-28-1, T-28-2, T-28-3, T-28-4, T-28-5, T-28-6, T-28-7, T-28-8, T-28-9, T-28-10, T-28-11 |"
**Correct verdict:** keep. The ranges follow mechanically from the declared test ids.
