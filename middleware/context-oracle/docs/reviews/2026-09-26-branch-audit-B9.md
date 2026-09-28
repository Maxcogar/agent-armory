# Branch audit — batch 9 (Step 15, the language frontends): first audit

This file audits batch 9, the last batch, of the branch audit of
`claude/context-oracle-vkho4p`: commits 62–70 of `git rev-list --reverse de66831..HEAD`, in
order — `059dc86` (AD-12/L6: 31 usable grammars, `lua` excluded; architecture), `42653ae` (Step
15 plan fixes raised by its test writer, 26 plan hunks and the grammar probe), `bfe963f` (the
Step 15 build, "unreviewed; Python resolver flaw open"), `d616f1f` (Python resolver follows a
`sys.path[0]` ancestor lookup; plan), `115d176` (`RepoFiles.hasTopLevelModule`; plan), `f22ce6b`
(fix of the plan check `115d176` broke), `feb37c9` (the Python resolver code), `ff99487` (the
independent review of the Step 15 build, with hand mutation tests) and `64f46fd` (AD-12 generic
frontend scope and AD-19 identifier redaction; architecture). It covers the 66 units listed in
`B9.txt`. The test applied is the auditor brief
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`.
The auditor made none of these changes.

Settled and not re-litigated: the B1–B7 verification files, the batch 8 first audits (B8a, B8b;
provisional), and the coordinator rulings of 2026-09-28. The rulings that govern here: batch 4
correction item 5 (resolvers — TypeScript tries `.ts`/`.tsx`/`.d.ts` before the written `.js`;
a Python absolute name found nowhere in the repository is external only if standard library or
a declared distribution, otherwise unresolved; workspace packages are in-repo), batch 5 ruling 3
(search storage), and B8b's rulings on frontend `version` (a content digest, not a hand string)
and on the fallback being a specified, visible degraded mode.

**How the work was done.**
- `HEAD` is `0e7ad2c`. `git diff --stat 64f46fd HEAD -- middleware/context-oracle/ctxoracle`
  prints nothing, and `git diff --stat feb37c9 64f46fd -- middleware/context-oracle/ctxoracle`
  lists only `test/unit/frontends_review.test.ts`. So `HEAD`'s ctxoracle source is `feb37c9`'s,
  and every code defect below that is present at `feb37c9` is present at `HEAD`.
- Scratch extractions of `bfe963f`, `feb37c9` and `ff99487` (`git archive <commit>
  middleware/context-oracle/ctxoracle | tar -x`), this checkout's `ctxoracle/node_modules`
  symlinked in, each built with `npx tsc -p tsconfig.json`, in
  `/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/b9/`
  (called `$S` below). Tests run with every `GIT_*` variable removed from the environment.
- Planted faults: `$S/mut.py BUILD FILE OLD NEW TESTS…` copies the built tree, replaces one exact
  string in one compiled file, and runs the named compiled tests. KILLED means a subtest failed.
  Baseline on `ff99487` over the nine Step 15 test files: `SURVIVED pass=52 fail=0`.
- Library behaviour was settled from source: the tree-sitter C library shipped inside
  `web-tree-sitter` 0.25.10 (`ctxoracle/node_modules/web-tree-sitter/lib/parser.c`, the same file
  as tag `v0.25.10` upstream), the `tree-sitter-lua` 2.1.3 package that `tree-sitter-wasms`
  0.1.13 builds its `lua` grammar from (`devDependencies` `"tree-sitter-lua": "^2.1.3"`), and
  official documentation fetched with `curl`.

### E-1
**Units:** B9-62-059dc86-docs/architecture-phase-a.md#h1, B9-62-059dc86-docs/architecture-phase-a.md#h2, B9-62-059dc86-docs/architecture-phase-a.md#h3
**Question:** The Step 15 test writer found that the `lua` grammar returns ERROR trees for valid source after its first parse in a process, without throwing. `059dc86` responds by excluding `lua` from AD-12's tree-sitter set (32 → 31 grammars) and redefining a usable grammar as one that "parses correctly on repeated parses", so `.lua` files take the generic frontend. Was the defect real, was its root cause found, and is the exclusion the correct fix or a patch — and is it visible (recorded and reported)?
**Facts:**
- The architecture now says 31 of 36 and records the symptom only. [[middleware/context-oracle/docs/architecture-phase-a.md@059dc86:L1385-L1390]] "`lua` loads but, after its first parse in a process, returns ERROR trees for valid source without throwing"
- L6 turns the symptom into a usability rule and routes `lua` to the generic frontend. [[middleware/context-oracle/docs/architecture-phase-a.md@059dc86:L2942-L2945]] "falls to the generic frontend too; a usable grammar is one that parses valid source correctly on repeated parses, not once."
- The same L6 paragraph says the table can take a separately shipped grammar without redesign. [[middleware/context-oracle/docs/architecture-phase-a.md@059dc86:L2946-L2947]] "the ext→grammar config absorbs individually-shipped grammar WASMs without redesign (C-6)"
- The defect is real and depends on the order of parses, not on the parser object. [[ran]] `cd $S && node lua3.mjs` (one `Parser`, `web-tree-sitter` 0.25.10, `tree-sitter-wasms` 0.1.13 `lua`) → `"print(1)\n" ok` / `"-- x\nprint(1)\n" ok` / `"print(1)\n" ERROR` / `"s = \"a\"\nprint(1)\n" ERROR` / `"print(1)\n" ERROR`. A fresh `Parser` after the first parse also errs (`lua1.mjs` → `newparser true`).
- The `lua` scanner's `create` allocates its state with `malloc` and never initialises it. [[https://raw.githubusercontent.com/Azganoth/tree-sitter-lua/master/src/scanner.c]] "return malloc(sizeof(struct ScannerState));"
- Its `deserialize` restores nothing unless exactly two bytes are passed, so a call with length 0 leaves whatever the memory held. [[https://raw.githubusercontent.com/Azganoth/tree-sitter-lua/master/src/scanner.c]] "if (length == 2)"
- The 0.25.10 runtime creates the external scanner at the start of every parse and destroys it at the end, so each parse after the first gets a reused, freed heap block. [[https://raw.githubusercontent.com/tree-sitter/tree-sitter/v0.25.10/lib/src/parser.c]] "ts_parser__external_scanner_create(self);" and [[https://raw.githubusercontent.com/tree-sitter/tree-sitter/v0.25.10/lib/src/parser.c]] "void ts_parser_reset(TSParser *self) { ts_parser__external_scanner_destroy(self);"
- tree-sitter's scanner contract says `deserialize` should clear state before restoring it. [[https://raw.githubusercontent.com/tree-sitter/tree-sitter/master/docs/src/creating-parsers/4-external-scanners.md]] "It is good practice to explicitly erase your scanner state variables at the start of this function, before restoring their values from the byte buffer."
- The failing pattern matches uninitialised `started` state: a file whose first scan is a comment (which sets `started`) parses cleanly; one whose first scan hits the `if (state->started)` branch with garbage returns a zero-width `STRING_START` and errs (the `lua3.mjs` rows above).
- A correct Lua grammar exists and works under the pinned runtime. `@tree-sitter-grammars/tree-sitter-lua` 0.4.1's scanner allocates with `ts_calloc(1, sizeof(Scanner))`, and its shipped WASM parses clean every time. [[ran]] `cd $S && node lua4.mjs` → `abi 15` / `ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok` (7 sources × 3 fresh parsers, including the probe's own `lua` sample).
- As built, a `.lua` file is recorded as language `unknown` with no fault. If the table kept `.lua=lua`, the same file would be recorded as `lua` with frontend `generic`. [[ran]] `cd $S && node luavis.mjs $S/build-ff99487/middleware/context-oracle/ctxoracle` → `table has .lua=lua: false; m.lua lang={"lang":"unknown"} … faults=[]` and `table has .lua=lua: true; m.lua lang={"lang":"lua"} … caps={"lua":{"frontend":"generic",…}}`.
- The language of a file with no table row is `unknown`. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L417]] "return extToLang.get(path.posix.extname(p).toLowerCase()) ?? 'unknown';"
- The frontend loads grammars only from the `tree-sitter-wasms` package path, so no configuration row can point at another grammar's WASM. [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@HEAD:L304]] "import.meta.resolve(`tree-sitter-wasms/out/tree-sitter-${lang}.wasm`)"
**Standard:** Fail fast and visibly: a system that fails fast, "when a problem occurs", fails at once, and [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "sounds like it would make your software more fragile, but it actually makes it more robust." A degraded mode is legitimate only when it is specified and visible (brief). C-6: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L542]] "adding a language is a configuration/extension act, not a redesign." OL-10: [[middleware/context-oracle/OWNER-LEDGER.md@HEAD:L48]] "it could fail a hundred ways in front of me"
**Reasoning:**
1. The problem is real: executed, and it is silent (no throw), so Step 15's throw fallback cannot see it.
2. The root cause was not looked for. The plan's probe even recorded that the failure "depends on heap state" (E-3), the classic sign of uninitialised memory. Reading the 315-line scanner and the runtime's `parser.c` gives the cause: the scanner reads memory it never wrote, and the runtime's create-per-parse lifecycle gives it a reused block from the second parse on.
3. So the defect is in one grammar build (`tree-sitter-lua` 2.1.3 as packaged by `tree-sitter-wasms`), not in "Lua under this runtime". A working grammar for the same language loads and parses repeatedly under the same pin (executed).
4. Excluding the language routes around the symptom. Lua loses structural symbols for good, and the one-parse-then-ERROR rule stays a symptom test in place of a cause.
5. Visibility fails. The decision is recorded in the architecture, but at run time a Lua file is `unknown` with no fault. It is mixed in with Markdown and other untabled files, so `status` cannot show that a language lost its grammar. Keeping the table row would at least show `lua` with frontend `generic` (executed).
6. The architecture's own promise, that the config "absorbs individually-shipped grammar WASMs", is what the right fix needs. The code does not yet deliver it: the path is fixed to the `tree-sitter-wasms` package.
**Alternatives:**
- Root cause (preferred): ship the `lua` grammar from `@tree-sitter-grammars/tree-sitter-lua` (its scanner zero-allocates; executed clean), through a grammar-source column or a per-grammar WASM path in the table. That is the C-6 extension act. Lua stays a tree-sitter language.
- Or rebuild `tree-sitter-lua` 2.1.3's WASM with `calloc` and a length-0 reset, and send the fix upstream.
- Minimum if neither can be done at once: keep `.lua=lua` in the table, give it no tree-sitter frontend, and record the exclusion and its cause in `lang_capabilities` and `status`, so the gap is reported rather than read as `unknown`.
- The chosen exclusion loses to all three. It keeps the defect, removes a language, and hides the removal.
**Consequences:** `42653ae` carries this exclusion through §4, the Step 12 seed, Step 15's table, D-plan-2, T-38-33, §11.4 and R6 (E-2, E-3). `bfe963f` removes `.lua=lua` from the seed (E-18) and adds a Lua regex to the generic frontend. The "usable = repeated parses error-free" rule becomes T-38-33's check. The runtime ERROR-tree gap for every other grammar is the review's m9 (E-37), and it is open at `HEAD`. Still present at `HEAD`: the exclusion, the `unknown` recording, and the fixed grammar path.
**Verdict:** replace — keep the finding, record its root cause (uninitialised scanner state in `tree-sitter-lua` 2.1.3's `create`/`deserialize` under 0.25.10's create-per-parse lifecycle), and keep Lua structural by loading a correct Lua grammar WASM through the table; until then, report the exclusion per language instead of recording `unknown`.
**Would be wrong if:** the `@tree-sitter-grammars/tree-sitter-lua` 0.4.1 WASM also produced ERROR trees for valid source on repeated or interleaved parses under 0.25.10, or its licence or ABI made it unusable here.

### E-2
**Units:** B9-63-42653ae-docs/plans/plan-phase-a.md#h1, B9-63-42653ae-docs/plans/plan-phase-a.md#h2, B9-63-42653ae-docs/plans/plan-phase-a.md#h5, B9-63-42653ae-docs/plans/plan-phase-a.md#h8, B9-63-42653ae-docs/plans/plan-phase-a.md#h9, B9-63-42653ae-docs/plans/plan-phase-a.md#h13, B9-63-42653ae-docs/plans/plan-phase-a.md#h14, B9-63-42653ae-docs/plans/plan-phase-a.md#h15, B9-63-42653ae-docs/plans/plan-phase-a.md#h16, B9-63-42653ae-docs/plans/plan-phase-a.md#h25, B9-63-42653ae-docs/plans/plan-phase-a.md#h26
**Question:** `42653ae` carries `059dc86`'s Lua exclusion into the plan: §4's parser-runtime paragraph (h1, h2), Step 12's seed sentence (h5), Step 15's extension table and exclusion text (h8, h9), T-38-33's build check (h13, h25), D-plan-2 (h14), the §11.4 premise row for probe 20 (h15, h16), and R6 (h26). Is this plan text correct, given E-1?
**Facts:**
- §4 makes the exclusion the default table's rule. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L428-L429]] "is the 31 usable grammars, with `elm`, `ql`, `yaml`, `bash` and `lua` excluded by cause and their extensions falling to the generic frontend"
- Step 15 says why an ERROR tree matters: it is silent. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L4189-L4191]] "so a `lua` file would be indexed from a broken tree with no `frontend_parse_failed` and no visible signal"
- The §11.4 row records the clue that points at the cause, and uses it only to word the probe's output. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L10355-L10358]] "err depends on heap state — its first is clean when it is parsed right after its own load early in a process — so the probe names the outcome, never the parse number"
- T-38-33 fails if `lua` is in the table. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L7119-L7120]] "or on an excluded grammar (§4: `elm`, `ql`, `yaml`, `bash`, `lua`) appearing in the table"
- R6's mitigation is the generic frontend. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L14404-L14405]] "five shipped grammars are already excluded by executed cause"
- The cause is uninitialised scanner state in the packaged `tree-sitter-lua` 2.1.3, and a correct Lua grammar parses cleanly under the same pin (E-1, executed `lua3.mjs` and `lua4.mjs`).
- The same repeated-parse check passes all 31 remaining grammars over 40 interleaved random-order parses each. [[ran]] `cd $S && node stress.mjs` → `parses per grammar 40; grammars with any ERROR/MISSING: []`
**Standard:** The brief's test, criterion 4: a crash (here a silent ERROR tree) backs "there is a defect", not "drop the language". Fail fast (Shore, IEEE Software 2004): [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on." C-6 (spec L540–L544): coverage is broad and extensible.
**Reasoning:**
1. Each hunk restates the same decision E-1 judged: exclude `lua` because of a symptom whose cause was not sought. Its backing is the executed symptom, which backs a defect, not an exclusion.
2. §11.4's "depends on heap state" line shows the executed evidence already pointed at uninitialised memory. The plan wrote it down as a formatting note instead of a lead.
3. What in these hunks stands on its own: counting an ERROR/MISSING tree as a failure, and re-parsing in fresh parsers and after other grammars. Those are real improvements on the 2026-09-11 one-parse probe. They are the probe's claims, judged in E-3.
4. T-38-33 and R6 then pin `lua` as excluded. After the root-cause fix (a correct Lua grammar through the table), both would fail or mislead.
**Alternatives:** Write §4 and Step 15 around the root cause. `tree-sitter-lua` 2.1.3's scanner reads uninitialised state; Lua takes a working grammar WASM through the table (E-1). T-38-33 keeps its repeated-parse and ERROR/MISSING check and drops `lua` from the excluded list. R6 lists four exclusions, each with its cause. If the swap cannot land in Step 15, record the exclusion per language (`lua`, frontend `generic`, a reason), not as `unknown`.
**Consequences:** Builds on E-1 (`replace`). Drives the seed removal (E-18) and T-15-6's table assertion (E-21), both of which pin the exclusion. The ERROR/MISSING rule is applied to the table at build time only. At run time no grammar's ERROR tree is signalled (review m9, E-37, open at `HEAD`).
**Verdict:** replace — keep the repeated-parse, ERROR/MISSING-counting rule; replace the Lua exclusion with the root-cause statement and a working Lua grammar (or, at minimum, a reported per-language exclusion), in §4, Step 12, Step 15, D-plan-2, §11.4, T-38-33 and R6.
**Would be wrong if:** no Lua grammar that the pinned runtime parses cleanly on repeated parses could be loaded through the table without a C-3 violation (a native binding or install script).

### E-3
**Units:** B9-63-42653ae-docs/plans/plan-phase-a.probes/20_grammar_inventory.mjs, B9-63-42653ae-docs/plans/plan-phase-a.probes/expected/20_grammar_inventory.txt
**Question:** Probe 20 (the plan-time check behind §4's grammar table) changes from one parse of `"\n"` per grammar to a valid sample per grammar, parsed three times with fresh parsers and once more after all the others, with an ERROR/MISSING tree counted as a failure. Its expected output changes from "32 … failed: none" to "31 … not usable: lua". Is the probe correct, and do its claims hold?
**Facts:**
- The probe's own comment records that the failure depends on heap state. [[middleware/context-oracle/docs/plans/plan-phase-a.probes/20_grammar_inventory.mjs@42653ae:L95]] "Which parses of `lua` err depends on the process's heap state (executed: its" and [[middleware/context-oracle/docs/plans/plan-phase-a.probes/20_grammar_inventory.mjs@42653ae:L97]] "so a failing grammar is reported by its distinct outcomes, never by"
- The exclusion set the probe starts from is fixed by cause for four grammars; `lua` is found, not assumed. [[middleware/context-oracle/docs/plans/plan-phase-a.probes/20_grammar_inventory.mjs@42653ae:L89]] "const excluded = new Set([\"elm\", \"ql\", \"yaml\", \"bash\"]);"
- The expected output is reproduced exactly. [[ran]] `cd $S && git -C /home/user/agent-armory show 42653ae:middleware/context-oracle/docs/plans/plan-phase-a.probes/20_grammar_inventory.mjs > probe20.mjs && PROBE_LAYOUT=$PWD node probe20.mjs` → last two lines `candidates (32 grammars; …): error-free on every parse: 31; not usable: lua (ERROR/MISSING)` and `default table (31 grammars): c c_sharp … vue zig`, in 9.9 s.
- The expected file states the conclusion. [[middleware/context-oracle/docs/plans/plan-phase-a.probes/expected/20_grammar_inventory.txt@42653ae:L8]] "error-free on every parse: 31; not usable: lua (ERROR/MISSING)"
- The heap-state dependence is explained by the scanner's uninitialised `malloc` state and the runtime's create-per-parse lifecycle (E-1).
**Standard:** The collapse-log's own standing lesson for this probe (2026-09-11): a plan step that rests on a dependency's behaviour executes that behaviour at plan time and never inherits "verified" from a check of a different property. [[middleware/context-oracle/docs/collapse-log.md@HEAD:L67-L69]] "A plan step that rests on a dependency's behaviour executes that behaviour at plan time as a probe beside the plan (the load, the parse, the compile, the install)" — here the property is correct parsing, and its cause is in the scanner source.
**Reasoning:**
1. The new probe is a real improvement. It tests the property Step 15 rests on (an error-free tree for valid source), not just "did not throw". Its output is reproducible.
2. But it stops at the symptom. The comment names the clue ("heap state") and concludes only that parse numbers should not be printed. The expected output then fixes `lua` as unusable, and §4 and the seed are built on that.
3. A repeated-parse sample shows that a grammar failed on one sample in one heap state. It cannot show that the others are clean in every heap state. The discriminating check is whether each grammar's external scanner initialises its state in `create` and resets it in `deserialize` with length 0. That can be read from each grammar's source (or tested by a first-parse-after-garbage harness).
4. So the probe should keep its checks, name the cause, and test the replacement Lua grammar (E-1) rather than conclude "not usable: lua".
**Alternatives:** Keep the three-plus-one parses and ERROR/MISSING counting. Add the cause to the comment. Add a line that loads the replacement Lua WASM and reports it clean. Optionally add a source-level scanner check for the table grammars that have external scanners. Leaving it as is keeps a symptom test as the grammar-usability criterion.
**Consequences:** §4, §11.4, T-38-33 and the seed cite this output (E-2, E-18). The 40-round interleaved stress on the 31 (E-2) found no second failure, so the 31 are not in question on this evidence; only the Lua conclusion is.
**Verdict:** replace — keep the repeated-parse and ERROR/MISSING checks; record the root cause the heap-state clue points to, and test the replacement Lua grammar instead of concluding "not usable: lua".
**Would be wrong if:** the `lua` failure were shown to come from the runtime (a heap-state bug that also breaks a correctly initialising scanner), which `lua4.mjs`'s clean run of `@tree-sitter-grammars/tree-sitter-lua` contradicts.

### E-4
**Units:** B9-63-42653ae-docs/plans/plan-phase-a.md#h3, B9-63-42653ae-docs/plans/plan-phase-a.md#h4, B9-63-42653ae-docs/plans/plan-phase-a.md#h6
**Question:** Step 15's `files.modify` gains `src/index/indexer.ts` (the generic fallback lives there) and `src/stores/dao/tuning_seeds.ts` (the grammar table's seed). h3 and h4 are the matching rows of the generated files table. Is the bookkeeping correct?
**Facts:**
- The step declaration now names both files. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L4154]] "modify: [middleware/context-oracle/ctxoracle/src/index/indexer.ts, middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts"
- h3 and h4 sit inside the generator's region. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L513]] "<!-- generated:files begin -->" and [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L881]] "<!-- generated:files end -->"; the row itself: [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L640]] "| middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts | modify | S15 |"
- The build changes both files (`git show bfe963f --stat`: `src/index/indexer.ts | 43 +-`, `src/stores/dao/tuning_seeds.ts | 9 +-`).
**Standard:** The plan's own step-declaration contract: every file a step changes is in its `files` list, and the files table is generated from those lists (the `derive-plan-sections` generator; the review's executed `--check` reports `regions current`).
**Reasoning:**
1. The generic fallback (E-6) is an indexer change, so `indexer.ts` belongs in the list. Leaving it out was a real gap, which the test writer found.
2. Step 15 owns the default grammar table, and the seed is where the table lives. It is edited under any version of the Lua fix: to remove the row (as built), to keep it with a recorded exclusion, or to point it at a replacement grammar (E-1).
3. h3 and h4 are generated from h6 by the generator. The decision under test is h6, which is correct.
**Alternatives:** None better. A missing `modify` entry would let the build change a file the plan does not declare.
**Consequences:** The contents of the seed change are judged in E-18, and the fallback in E-6 and E-16.
**Verdict:** keep — the declaration names the two files Step 15 changes, and the table rows are generated from it.
**Would be wrong if:** a corrected Lua decision left `tuning_seeds.ts` untouched by Step 15 and every other Step 15 seed need went away.

### E-5
**Units:** B9-63-42653ae-docs/plans/plan-phase-a.md#h7
**Question:** The grammar path is corrected from `tree-sitter-wasms/out/<lang>.wasm` to `tree-sitter-wasms/out/tree-sitter-<lang>.wasm`. Is the new path right?
**Facts:**
- Before: [[middleware/context-oracle/docs/plans/plan-phase-a.md@059dc86:L4146]] "`LanguageFrontend` by loading the grammar `tree-sitter-wasms/out/<lang>.wasm`"
- After: [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L4164]] "`LanguageFrontend` by loading the grammar `tree-sitter-wasms/out/tree-sitter-<lang>.wasm`"
- Every shipped file has the `tree-sitter-` prefix. [[ran]] `ls ctxoracle/node_modules/tree-sitter-wasms/out | wc -l` → `36`; `ls … | grep -vc '^tree-sitter-.*\.wasm$'` → `0`.
**Standard:** Library behaviour from the installed package (brief: "source in `node_modules/`").
**Reasoning:** The old path names no file that exists, so every `Language.load` would have failed. The new path matches all 36 shipped files. It is a factual correction, and it names its evidence.
**Alternatives:** None; any other name fails to load.
**Consequences:** The path is fixed to one package. Loading a grammar from another package (the Lua fix, E-1) needs a table-driven path; that is a separate gap in the loader, not in this correction.
**Verdict:** keep — the corrected file name matches every shipped grammar.
**Would be wrong if:** `tree-sitter-wasms` 0.1.13 shipped a grammar file without the `tree-sitter-` prefix.

### E-6
**Units:** B9-63-42653ae-docs/plans/plan-phase-a.md#h10
**Question:** The test writer found that the fallback Step 15 requires (a failed tree-sitter parse re-parsed by the generic frontend) lives in `indexer.ts`, which the step did not name. h10 specifies it: the file gets generic symbols, no edges, and exactly one `frontend_parse_failed`. Is this degraded mode specified completely enough to be correct and visible?
**Facts:**
- The fallback as specified. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L4241-L4248]] "such a file is parsed by the generic frontend (`lang === '*'`; its `init()` is awaited before the first parse whenever the frontend list holds it, since any tree-sitter parse can fail), its generic symbols are stored, it contributes no `import_edges` (the generic frontend declares `imports: false`), and exactly one `frontend_parse_failed` is recorded for it, naming its language and path."
- A fallback file's imports count nowhere: its language still reads `imports: true` with 0 resolved and 0 unresolved. [[ran]] `cd $S && node m1.mjs $S/build-ff99487/middleware/context-oracle/ctxoracle` (one non-UTF-8 `x.py` with two imports) → `{"python":{"frontend":"tree-sitter","symbols":true,"imports":true,"resolved":0,"unresolved":0,"files":1}}` and one `frontend_parse_failed` fault.
- The review found the same and names the fix. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L125-L126]] "A file that fell back to the generic frontend is counted nowhere in its language's unresolved share"
- A fallback file is not re-parsed on later passes, because the unchanged test matches its content hash; the review executed this ("Pass 2 … `filesWritten 0`"). [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L50-L51]] "every later parse of every grammar fails, and the files that fell back are never re-parsed"
- AD-12's unresolved count exists to tell "observed zero" from "never counted" (architecture L1407–L1419 at `059dc86`; CH H4).
**Standard:** A degraded mode is legitimate only when it is specified as correct behaviour and visible, recorded and reported (brief). Fail fast (Shore): [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on."
**Reasoning:**
1. The fallback itself is backed. AD-12 makes the generic frontend the floor, so no file is invisible. The fault makes the failure recorded at the pass where it happens. B8b judged the same shape a specified, visible degraded mode.
2. Two things are left unspecified, and both make the result look more complete than it is.
   - A fallback file of an `imports: true` language adds nothing to that language's unresolved share, so a language whose parses fail reads as "observed zero" (executed). That is the exact failure AD-12's count exists to expose.
   - The file is never retried. The fault appears once, and later passes judge the file unchanged, so a grammar that recovers (or a poisoned module, S1) leaves the gap in place.
3. "Exactly one `frontend_parse_failed`" is the right rule, but nothing tests it (E-27: a duplicate fault survives every test).
**Alternatives:** Keep the fallback. Add two rules: a fallback-parsed file of an `imports: true` language counts in its language's share (for example a `parse_failed` count added to the numerator), and a fallback-parsed file's stored content hash is marked so the next pass retries it. Both are the review's M1 and S1(c) fixes.
**Consequences:** Built as written in `bfe963f` (E-16), so both gaps are in the code and present at `HEAD`. T-15-4 (E-27) does not test "exactly one".
**Verdict:** replace — keep the fallback and its one fault per file; add that a fallback file counts in its language's unresolved share and is retried on the next pass.
**Would be wrong if:** `lang_capabilities` or `status` already reported fallback-parsed files per language elsewhere, so the share's silence was not the only signal.

### E-7
**Units:** B9-63-42653ae-docs/plans/plan-phase-a.md#h11
**Question:** The test writer found that Step 15's unconditional "the written path if it exists" contradicted T-15-5's `./py.py → unresolved` cell. h11 limits the written path to TS/JS extensions and makes every other specifier try appended extensions only. Is the rule now what TypeScript does?
**Facts:**
- The amended rule. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L4252-L4255]] "when the specifier's extension is a TS/JS extension (`.ts` `.tsx` `.js` `.jsx` `.mjs` `.cjs` `.mts` `.cts`), the written path if it exists, and a `.js`/`.jsx`/`.mjs`/`.cjs` specifier also tries its source `.ts`/`.tsx`/`.mts`/`.cts`"
- Its stated premise. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L4261]] "TypeScript NodeNext resolves only to TS/JS files"
- The handbook's rule: TypeScript first tries an implementation file or a declaration file. [[https://www.typescriptlang.org/docs/handbook/modules/reference.html]] "TypeScript will first try to find a TypeScript implementation file or type declaration file with the same name and analagous file extension."
- The settled batch 4 ruling. [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L130]] "TypeScript tries `.ts`/`.tsx`/`.d.ts` before the written `.js`, following"
- The review executed TypeScript 5.9.3's resolver: `./types.js` with only `types.d.ts` present resolves to it, and `./data.json` resolves under `resolveJsonModule`; the plan's rule gives `unresolved` for both. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L255-L256]] "try `.d.ts` after `.tsx` (and for a `.js` specifier), and resolve a present `.json` written path; add T-15-5 cells."
- Re-executed here with TypeScript 5.9.3 (`NodeNext`, an ESM importer `tsr/src/a.ts`, only `tsr/src/types.d.ts` present). [[ran]] `cd $S && node tsr.cjs` → `5.9.3 tsr/src/types.d.ts`
- h11 does not state the order of the written `.js` and its source, and no test pins it. Mutation D (written path before source) survives every Step 15 test and every review test. [[ran]] `cd $S && python3 mut.py $S/build-ff99487 dist/src/index/resolvers.js "[...(SOURCE_FOR[ext] ?? []).map((e) => stem + e), base]" "[base, ...(SOURCE_FOR[ext] ?? []).map((e) => stem + e)]" <nine Step 15 test files>` → `SURVIVED pass=52 fail=0 []`
**Standard:** The TypeScript handbook's module-resolution reference (quoted above) and the settled batch 4 ruling on resolvers.
**Reasoning:**
1. The problem was real: the old sentence resolved `./py.py` to a Python file, a cross-language edge. Limiting the written path to TS/JS extensions fixes that.
2. The premise the fix states is false. TypeScript also resolves declaration files, and JSON when enabled (review m2, executed there). The handbook's extension-substitution table puts `.d.ts` before the written `.js`, and batch 4 settled exactly that.
3. So the rule still misses `.d.ts`/`.d.mts`/`.d.cts` in both branches, and it leaves the source-before-written order to the builder (who happened to choose TypeScript's order).
**Alternatives:** Follow the handbook's table: for a written `.js`, try `.ts`, `.tsx`, `.d.ts`, then `.js` (and the `.mjs`/`.cjs` rows likewise); for an extensionless specifier, append `.ts`, `.tsx`, `.d.ts`, `.js`, `.jsx`. Resolve a present written `.json` path, or state its exclusion with a reason. Keep "no other language's extensions". The chosen rule is narrower than TypeScript with no stated reason.
**Consequences:** Built in `bfe963f` (E-17) and still at `HEAD`. T-15-5 (E-23) has no `.d.ts` cell and no order cell. The bare-specifier sentence that follows is unchanged here; its workspace-package gap (batch 4) is in E-17.
**Verdict:** replace — keep the TS/JS-only written path; add `.d.ts`/`.d.mts`/`.d.cts` in the handbook's order, state source-before-written, and settle `.json`.
**Would be wrong if:** TypeScript's `NodeNext` resolution, executed, did not resolve `./x.js` to a present `x.d.ts` when no `x.ts` exists.

### E-8
**Units:** B9-63-42653ae-docs/plans/plan-phase-a.md#h12, B9-63-42653ae-docs/plans/plan-phase-a.md#h20, B9-63-42653ae-docs/plans/plan-phase-a.md#h21, B9-63-42653ae-docs/plans/plan-phase-a.md#h22
**Question:** T-15-3 is amended by the test writer. It gains the `indexer-walk` alias case (`@/util` counted unresolved in the TypeScript share: h12, h20, h22) and the three `.py` files (h21). It drops a clause that asserted hits for tokens with no fixture file (h22). It records the `.sh` file's language as `unknown` because `bash` is excluded (h20). Are these right?
**Facts:**
- The alias case. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L4328]] "`@/util` import is counted unresolved in the typescript share"
- The `.sh` expectation. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12337-L12338]] "`imports: true`, and the `.sh` file's recorded language (`unknown`, since `bash` is excluded from the default table) with frontend"
- The dropped clause and its home. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12360]] "former clause here was dropped (Step 15 test writer, 2026-09-26)). **Fails when** an expected"
- The data. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12352]] "the three `.py` files (`tool.py`, `pkg/mod.py`, `pkg/use.py`), 1 `.sh`,"
- AD-12 counts an alias as unresolved (architecture L1413–L1414 at `059dc86`: "`@/util`" as the example of *unresolved*).
- A file whose grammar is out of the table is recorded as `unknown`, beside every other untabled file; with a table row and no tree-sitter frontend it would be recorded under its language with frontend `generic` (executed for `lua`, E-1, `luavis.mjs`).
- The test built from this spec pins `unknown`. [[middleware/context-oracle/ctxoracle/test/unit/indexer_frontends.test.ts@HEAD:L239]] "assert.equal(shLang, 'unknown', `${INDEXER_SMALL.markerPath}'s recorded language is not unknown`);"
**Standard:** AD-12's unresolved count (CH H4) for the alias clauses. For `unknown`: OL-10 self-observability and the brief's rule that an exclusion is legitimate only when visible, recorded and reported.
**Reasoning:**
1. The alias clauses and the `.py` data are correct. They test AD-12's stated external/unresolved split and the Python package case the step adds, and the share clause ties per-file counts to the per-language sum.
2. Dropping the `help`/`schem` hit clause is correct. No fixture file produces those tokens, so the clause could only fail or pass by accident; T-14-5 covers them positively.
3. The `.sh → unknown` expectation pins the invisible way an excluded grammar is recorded. `bash`'s exclusion has an executed cause (scanner imports the runtime does not export; B8a E-8's settled note that `.sh` takes the generic frontend only while `bash` is excluded). Visibility is the problem, not the exclusion: shell files are lumped with Markdown and data files as `unknown`, so `status` cannot show that shell lost its grammar.
**Alternatives:** Record an excluded grammar's files under its language (`bash`), with frontend `generic` and the exclusion's cause. That needs an explicit exclusion set, because `QUERIES` has a `bash` entry and a table row alone would re-enable the throwing grammar. T-15-3 then expects `bash`/`generic`.
**Consequences:** The same representation applies to `lua` (E-1, E-2) and `yaml`. T-15-3's code (E-24) asserts `unknown`.
**Verdict:** replace — keep the alias, share, data and dropped-clause amendments; replace the `.sh`→`unknown` expectation with the file's own language, frontend `generic` and the recorded exclusion cause.
**Would be wrong if:** `status` reported excluded grammars and their file counts by some other channel, so that `unknown` in `lang_capabilities` hid nothing.

### E-9
**Units:** B9-63-42653ae-docs/plans/plan-phase-a.md#h17
**Question:** T-15-1's Data is amended to define a symbol's span as its declaration node's byte span, while the test asserts only that the span lies within the file and covers the name, and "NOT asserts … a span's exact end byte". Does the test, as specified, fail when the span is wrong?
**Facts:**
- The definition and the weaker assertion. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12275-L12278]] "A symbol's span is its declaration node's byte span — from the start of the declaration to its end — which contains the name; the test asserts each span lies within the file's bytes and covers the bytes of the symbol's name"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12279]] "**NOT asserts.** Every symbol kind; a span's exact end byte."
- A build whose span starts at the name, not the declaration, passes every Step 15 test (it is caught only by the later review's RV15-1/12/18). [[ran]] `cd $S && python3 mut.py $S/build-ff99487 dist/src/index/tree_sitter_frontend.js "const spanStart = toByte(def.node.startIndex);" "const spanStart = toByte(name.startIndex);" <eight T-15/T-14 files>` → `SURVIVED pass=32 fail=0 []`; with `frontends_review` added → `KILLED … "RV15-1: …", "RV15-12: …", "RV15-18: …"`.
- The fixture files are fixed text (`src/util.ts`, `src/app.ts` in `indexer-small`, `test/fixtures/generate.ts`), so each declaration's start and end byte is known before the test runs.
**Standard:** A test's "Fails when" must fail when the behaviour is wrong (brief: "would it fail if the behavior were wrong, or could it pass anyway?").
**Reasoning:**
1. Defining the span as the declaration node's span is right: the rumor rule re-resolves spans on disk (AD-15), and a declaration span gives it the whole definition.
2. The assertion is weaker than the definition. "Covers the name" accepts the name's own span, a span starting at the name, or any wider range. The executed mutant shows a wrong start passes.
3. The stated reason not to assert the end byte does not hold: the fixture's text fixes both bytes (`export function util(): number {…}` begins and ends at known offsets). So the test can assert the exact span at no cost.
**Alternatives:** Assert the exact `[start, end)` of each declaration from the fixture text (for example `content.indexOf('export function util')` to the byte after the closing `}`). This is what RV15-1 later did for non-ASCII files; T-15-1 should do it for its own fixture.
**Consequences:** T-15-1's code (E-26) implements the weak check. RV15-1, RV15-12 and RV15-18 (E-36) close the gap in the review's file, so the property is covered at `HEAD`, but not by T-15-1.
**Verdict:** replace — keep the declaration-span definition; make T-15-1 assert each span's exact start and end, which the fixture text fixes, and drop "NOT asserts a span's exact end byte".
**Would be wrong if:** the declaration node's byte span in the fixture could vary between grammar builds in a way the test could not pin (it cannot: the version pin fixes the grammar).

### E-10
**Units:** B9-63-42653ae-docs/plans/plan-phase-a.md#h18, B9-63-42653ae-docs/plans/plan-phase-a.md#h19
**Question:** T-15-4's setup is written out: `bash` is out of the default table, so the test adds `.sh=bash` through Step 12's `tuning.addToList` on a real seeded global store (before the caching reader is built), and asserts that the `bash` frontend was actually used. Is that right?
**Facts:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12304]] "`node:sqlite` and a real global store; no doubles."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12311-L12312]] "`index.ext_to_grammar` through the tuning list writer on a real seeded global store"
- The reader caches list values for its lifetime, so a member added after it is built is not seen. [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@bfe963f:L121-L123]] "function list(key: string): string[] { const cached = lists.get(key); if (cached !== undefined) return [...cached];"
- The throwing input is executed: a `case … esac` parse under `bash` throws `TypeError: resolved is not a function` (probe 20's expected output line 5, reproduced in E-3's run).
**Standard:** The brief's test for a test: it must fail when the behaviour is wrong. A setup that bypasses the path under test lets every clause pass without exercising it.
**Reasoning:**
1. Without the table row, `.sh` maps to no grammar, so the `bash` frontend would never run and the fallback would be bypassed. The row is needed.
2. Writing it through the real list writer on a real store, before the reader, is the only way to get it through the cached `TuningReader`. The precondition assertion (`lang_capabilities.bash.frontend = 'tree-sitter'`) proves the path was taken.
3. Using a grammar with a known, executed throw is legitimate error guessing.
**Alternatives:** A fake frontend that throws would test the indexer but not the real runtime's dead-parser behaviour, which is the premise the step rests on. The chosen setup is better.
**Consequences:** T-15-4's other clauses are judged in E-27: "exactly one fault" is untested and the reuse clause cannot fail (review m10). The same `.sh=bash` configuration crosses the 75-throw module poisoning (review S1) with enough shell files (E-37).
**Verdict:** keep — the setup makes the test exercise the real fallback path, and the precondition proves it.
**Would be wrong if:** the `TuningReader` read list members uncached, making the ordering requirement false (it caches, L121–L123).

### E-11
**Units:** B9-63-42653ae-docs/plans/plan-phase-a.md#h23
**Question:** T-15-5's Python cell "`pkg/sub/m.ts` present but `.m2` absent" is changed so the present file is `pkg/sub/m2.ts`, because the old cell could not catch a resolver that tries `.ts` for Python. Is the new cell discriminating?
**Facts:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12384-L12387]] "`pkg/sub/m2.ts` present but `.m2` absent (unresolved, never `.ts` — the present file is `m2.ts`, so a resolver that tried `.ts` would resolve it and the cell would catch it"
- The built test uses exactly that repository. [[middleware/context-oracle/ctxoracle/test/unit/import_resolvers.test.ts@HEAD:L54]] "const PY_REPO = repoFiles(['pkg/sub/u.py', 'pkg/sub/m.py', 'pkg/n/__init__.py', 'pkg/sub/m2.ts'], []);"
**Standard:** The brief's test for a test (it must fail when the behaviour is wrong); the step's no-cross-language rule (review G12).
**Reasoning:** With `m.ts` present, a resolver trying `.m2` + `.ts` would look for `m2.ts`, find nothing, and return `unresolved`, so the old cell passed for the wrong resolver too. With `m2.ts` present, the same wrong resolver returns `resolved`, and the cell fails. The fix turns a cell that could not fail into one that can.
**Alternatives:** None better; this is the minimal discriminating datum.
**Consequences:** None beyond T-15-5 (E-23).
**Verdict:** keep — the cell now fails for the cross-language resolver it exists to catch.
**Would be wrong if:** the resolver's `.ts` probe used a different stem than the specifier's last segment (it would then need a different file).

### E-12
**Units:** B9-63-42653ae-docs/plans/plan-phase-a.md#h24
**Question:** T-15-6 needs, per frontend, a sample with a definition and a relative import. SystemRDL's sample gets no import, because its only inclusion form (`` `include ``) is not parsed by the shipped grammar. Is the exception correct?
**Facts:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12400]] "shipped grammar cannot parse it (an ERROR node, executed) (Step 15 test writer, 2026-09-26). Technique:"
- Re-executed: [[ran]] `cd $S && node -e "…Language.load('node_modules/tree-sitter-wasms/out/tree-sitter-systemrdl.wasm')… p.parse('\`include \"sibling.rdl\"\naddrmap answer {\n  reg { field {} f; } r;\n};\n')…"` → `hasError true`
- `systemrdl` declares `imports: false` (it has no resolver in `RESOLVERS`, `tree_sitter_frontend.ts` L285–L290 at `bfe963f`), so T-15-6 requires only that it yields no import.
**Standard:** The brief's test for a test; T-15-6's own clause that a sample must parse in its grammar.
**Reasoning:** A sample with an ERROR node would test a broken tree, not the frontend. SystemRDL declares no imports, so an import in its sample adds nothing T-15-6 checks. Leaving the import out keeps the sample valid and loses nothing.
**Alternatives:** Keep the `include` and accept an ERROR tree: worse, since T-15-6 is about declared behaviour on valid input.
**Consequences:** None.
**Verdict:** keep — the exception is executed and loses no assertion.
**Would be wrong if:** the pinned `systemrdl` grammar parsed `` `include `` without an ERROR node.

### E-13
**Units:** B9-64-bfe963f-ctxoracle/src/cli/index.ts, B9-64-bfe963f-ctxoracle/src/cli/init.ts
**Question:** The `index` and `init` verbs change their call from `defaultFrontends(r.global, diag)` to `defaultFrontends(tuning)`, the reader each verb already built. Is the change what the plan says, and does it reach further?
**Facts:**
- [[middleware/context-oracle/ctxoracle/src/cli/index.ts@bfe963f:L31]] "frontends: defaultFrontends(tuning),"
- [[middleware/context-oracle/ctxoracle/src/cli/init.ts@bfe963f:L48]] "frontends: defaultFrontends(tuning),"
- The plan's signature and its two callers. [[middleware/context-oracle/docs/plans/plan-phase-a.md@bfe963f:L4214]] "exporting `defaultFrontends(tuning: TuningReader): LanguageFrontend[]` — one" and [[middleware/context-oracle/docs/plans/plan-phase-a.md@bfe963f:L4217]] "(Step 28) and `init` (Step 31) pass to `runIndex` (D-plan-29)."
- `git show bfe963f -- …/src/cli/index.ts …/src/cli/init.ts` changes only these two lines and adds a two-line comment in each.
**Standard:** The plan step (the signature and D-plan-29's callers); interface change applied at every call site so the build compiles.
**Reasoning:** Step 15 changes the export's signature, so every caller must change or the build breaks. The new argument is the reader the plan names (G8: the table is read through the `TuningReader`). Nothing else in either verb changed, and their `SKELETON: 14` marks for Steps 28 and 31 stay. The builder flagged that no §9 row names this edit, and the review confirmed Steps 28 and 31 state that call.
**Alternatives:** Leaving the old overload would keep two signatures for one function. The change is the minimal correct one.
**Consequences:** Both verbs still carry the batch 6 and 8 defects that are theirs (init wires hooks before indexing; the `index` verb's missing `catch`), untouched here.
**Verdict:** keep — the minimal call-site change the new signature requires, as the plan states it.
**Would be wrong if:** Steps 28 or 31 named a different argument for this call.

### E-14
**Units:** B9-64-bfe963f-ctxoracle/src/index/frontends.ts
**Question:** `defaultFrontends(tuning)` returns one tree-sitter frontend per grammar that is both in `index.ext_to_grammar` and in `QUERIES`, sorted, then the generic frontend. Does it follow the plan, and what happens to a table member it cannot read?
**Facts:**
- A member without `=` in a valid position is skipped with no record. [[middleware/context-oracle/ctxoracle/src/index/frontends.ts@bfe963f:L18]] "if (eq <= 0) continue;"
- A grammar with no query is left out, which the plan requires and which `lang_capabilities` then shows as `generic` (G13). [[middleware/context-oracle/ctxoracle/src/index/frontends.ts@bfe963f:L20]] "if (Object.hasOwn(QUERIES, lang)) langs.add(lang);"
- The indexer reads the same list with the same silent skip (Step 14 code): [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@bfe963f:L497-L498]] "const eq = member.indexOf('='); if (eq > 0) extToLang.set(member.slice(0, eq).toLowerCase(), member.slice(eq + 1));"
- The list writer takes any string: `tuning.addToList(store, key, value, source)` inserts the value as given (`src/stores/dao/tuning.ts` L50–L60 at `bfe963f`), so a member such as `.lua` or `=lua` can be stored.
- The review's RV15-16 pins the list against the seeded table (mutation M71 killed).
**Standard:** Fail fast (Shore): [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on." A skip is legitimate only when specified and visible (brief).
**Reasoning:**
1. The list rule matches the plan: queried table grammars, sorted, generic last. The `Object.hasOwn` check keeps prototype names out.
2. The malformed-member skip is an unbacked special case. A member the owner wrote wrong (`.lua` without `=lua`) vanishes, the extension falls to `unknown`, and nothing says why. No plan sentence specifies it.
3. A table typo is a configuration error. The fix is to record a fault naming the member, or to refuse it where it is written.
**Alternatives:** Validate list members at write time (the batch 6 tuning corrections already refuse scalar writes to list keys), and record a `tuning_invalid`-class fault for a malformed member at read time. Both are better than a silent skip.
**Consequences:** The indexer's matching skip (Step 14, not in this batch) needs the same fix. Still present at `HEAD` (`frontends.ts` unchanged since `bfe963f`).
**Verdict:** replace — keep the list rule; record a fault (or refuse at write time) for a malformed `index.ext_to_grammar` member instead of skipping it silently.
**Would be wrong if:** every path that writes `index.ext_to_grammar` validated the `<ext>=<grammar>` shape, so a malformed member could not be stored.

### E-15
**Units:** B9-64-bfe963f-ctxoracle/src/index/generic_frontend.ts
**Question:** The generic frontend extracts definition-shaped lines with regexes (JS/TS, Python/Ruby, Rust, Lua, both shell forms), declares `imports: false`, decodes non-UTF-8 as latin1 so spans stay byte offsets, and returns `{ok: false}` on any throw. It runs on every file no tree-sitter frontend takes. Is it correct and bounded?
**Facts:**
- Scope, as built. [[middleware/context-oracle/ctxoracle/src/index/generic_frontend.ts@bfe963f:L10]] "It covers every file no tree-sitter frontend takes — an extension outside"
- It extracts "definitions" from prose and from binary content. [[ran]] `cd $S/build-ff99487/middleware/context-oracle/ctxoracle && node -e "…genericFrontend.parse('docs/guide.md', <a Markdown file with a fenced js function and a prose line 'class Example extends Thing'>)…; …parse('x.bin', <NUL bytes + 'function listProjects() {'>)…"` → `["fetchData","Example"]` and `["listProjects"]`.
- The review measured the same on this repository: 317 of 424 generic symbols from `.md` files and 4 from a binary file. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L170-L171]] "Three quarters of the generic frontend's symbols in this repository are false: definition-shaped lines in Markdown code blocks and in binary files."
- The latin1 decode keeps spans on disk bytes for non-UTF-8 input. [[middleware/context-oracle/ctxoracle/src/index/generic_frontend.ts@bfe963f:L48]] "return { text: content.toString('latin1'), encoding: 'latin1' };"
- A Lua regex was added because `lua` left the tree-sitter table. [[middleware/context-oracle/ctxoracle/src/index/generic_frontend.ts@bfe963f:L30]] "// Lua (`function M.name(`, `local function name(`; lua is excluded from the tree-sitter table, §4)."
- The architecture later (`64f46fd`, E-38) restricts symbol extraction to code files; the code is unchanged at `HEAD`.
**Standard:** P4 in AD-12's rationale ("false symbols poison pointers"); CLAUDE.md rule 3: [[middleware/context-oracle/CLAUDE.md@HEAD:L144]] "never fake completeness dressed to look like a working product."
**Reasoning:**
1. The shell and JS/Python/Rust patterns, the byte-exact spans and `imports: false` do what the plan says. The review's mutation set pins them (RV15-2, RV15-9, RV15-18).
2. The latin1 decode is not error hiding. It is how a line heuristic reads bytes that are not UTF-8, and spans stay exact.
3. The scope is wrong. Running definition regexes over Markdown and binary files produces false symbols (executed), which Reuse and Orientation would present as code. That is the P4 failure the frontend's own weakness was supposed to avoid.
4. The code matches the plan at this commit ("everything else"). The defect is the plan's, and the code inherits it.
5. The Lua regex is a compensation for E-1's exclusion. It is harmless as a generic pattern, but it is only there because the root cause was not fixed.
6. Names are unbounded in length (review m6). ASVS-style input bounds apply before storage.
**Alternatives:** Apply `64f46fd`'s scope: no symbols from a file with a NUL byte in its head, or from prose and data extensions. Bound name length. Either an allow-list of code extensions or the architecture's deny-list; E-38 judges that choice.
**Consequences:** Still present at `HEAD`: symbols from prose and binary files, unbounded names.
**Verdict:** replace — keep the regexes, spans, encoding and capability; stop symbol extraction for binary and prose/data files (per E-38's corrected rule) and bound name length.
**Would be wrong if:** the indexer already skipped the generic frontend for Markdown and binary files before calling it (it does not: the review's 317 `.md` symbols are the indexer's output).

### E-16
**Units:** B9-64-bfe963f-ctxoracle/src/index/indexer.ts
**Question:** The indexer gains the generic fallback: a file whose frontend returns `{ok: false}` or throws gets one `frontend_parse_failed`, then is parsed by the generic frontend and keeps generic symbols and no edges. The generic frontend's `init` is awaited whenever the list holds it. Does the code do what h10 says, and does every catch and fallback pass the fail-fast test?
**Facts:**
- The fallback branch. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@bfe963f:L680]] "if (fe !== generic && generic !== undefined && !disabled.has(generic)) {"
- A frontend that throws despite the "never throws" contract becomes `{ok: false}`, which is recorded as a fault. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@bfe963f:L669]] "return { ok: false, error: e instanceof Error ? e.message : String(e) };"
- The fallback file's language still reads `imports: true` with 0/0 (review M1). [[ran]] `cd $S && node m1.mjs $S/build-ff99487/middleware/context-oracle/ctxoracle` → `{"python":{"frontend":"tree-sitter","symbols":true,"imports":true,"resolved":0,"unresolved":0,"files":1}}`
- Symbol names are redacted with the redactor's built-in thresholds, not the tuned ones. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@bfe963f:L690]] "pf.symbols = parsed.symbols.map((s) => ({ ...s, name: redact(s.name).redacted }));" Executed: [[ran]] `cd $S/build-ff99487/middleware/context-oracle/ctxoracle && node -e "import('./dist/src/security/redact.js').then(m=>…m.redact('T11_DiscoveryWorkflowTests')…)"` → `T11_DiscoveryWorkflowTests "[redacted:high_entropy]"`
- The redactor's own header says production callers pass the tuned values, and it falls back to a literal otherwise. [[middleware/context-oracle/ctxoracle/src/security/redact.ts@HEAD:L4]] "entropy thresholds are explicit parameters — production callers pass the" [[middleware/context-oracle/ctxoracle/src/security/redact.ts@HEAD:L5]] "`security.entropy_*` tuning rows (Step 12); the unit tests pass literals." and [[middleware/context-oracle/ctxoracle/src/security/redact.ts@HEAD:L51]] "const bits = opts.entropyBitsPerChar ?? 4.0;"
- The injection flag is tested on the raw name, which never has the whitespace its patterns need (review M5). [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@bfe963f:L794]] "pf.symbols.some((s) => isSuspect(s.name))"; executed: [[ran]] `… import('./dist/src/security/injection.js') … isSuspect(…)` → `ignore previous instructions true` / `ignore_previous_instructions false` / `ignorePreviousInstructions false`
- A file that fell back is judged unchanged on later passes and never retried (review S1, executed there: "Pass 2 … `filesWritten 0`").
**Standard:** The plan's Step 15 fallback (h10, E-6) and §7's tuning convention ("carries no fallback literal", as the review quotes it at L204–L206 of its file); AD-19's injection flag over ingested spans; fail fast (Shore).
**Reasoning:**
1. The fallback does what h10 says: one fault per failed file, generic symbols, no edges (T-15-4 and the review's mutations M48b, M49, M69 pin it). Catching a throwing `parse` into `{ok: false}` is not hiding: the fault is recorded.
2. Awaiting the generic `init` whenever anything is walked is the plan's text. It is a no-op for this frontend.
3. It inherits h10's two gaps: the fallback file is missing from the unresolved share (executed), and it is never retried.
4. Redacting names without the tuned thresholds is a fallback literal, so `tune` cannot reach it, and the entropy rule deletes real identifiers (executed).
5. The injection check cannot fire on any identifier-shaped name (executed).
**Alternatives:** Keep the fallback. Add the fallback file to its language's share and mark its content hash for retry (E-6). Pass `security.entropy_*` from `opts.tuning` to `redact`, and give declaration names the pattern rules only (E-39). Split names into words before `isSuspect` (review M5).
**Consequences:** All four gaps are still present at `HEAD` (`feb37c9` only added `hasTopLevelModule` to this file). T-15-4 does not test "exactly one" (E-27).
**Verdict:** replace — keep the fallback and its fault; count fallback files in the share and retry them, pass the tuned entropy values (identifiers get pattern rules only), and word-split names before the injection check.
**Would be wrong if:** the redactor read `security.entropy_*` from the store itself, so no caller needed to pass them.

### E-17
**Units:** B9-64-bfe963f-ctxoracle/src/index/resolvers.ts
**Question:** `resolvers.ts` is new: `resolveTsImport` (NodeNext-style relative rules, `package.json` dependencies and Node builtins for bare specifiers) and `resolvePythonImport` (PEP 328 relative levels; an absolute name against the repository root, otherwise external). Does it do what the plan says, and does it meet the settled batch 4 resolver ruling?
**Facts:**
- A written `.js` tries `.ts`, `.tsx`, then itself; no declaration file is tried. [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@bfe963f:L52-L57]] "const SOURCE_FOR: Record<string, readonly string[]> = { '.js': ['.ts', '.tsx'], '.jsx': ['.tsx'], '.mjs': ['.mts'], '.cjs': ['.cts'], };"
- Extensionless specifiers append four extensions, no `.d.ts`. [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@bfe963f:L59]] "const APPENDED = ['.ts', '.tsx', '.js', '.jsx'];"
- A bare specifier is external when a `package.json` declares it, including a workspace package that lives in this repository. [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@bfe963f:L95]] "return repo.nearestPackageJsonDeps(fromPath).has(name) ? EXTERNAL : UNRESOLVED;"
- A Python absolute name not at the root is external, whatever it is. [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@bfe963f:L127-L128]] "const found = firstPresent(moduleCandidates('.', rest), repo); return found.kind === 'resolved' ? found : EXTERNAL;"
- The settled ruling. [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L130]] "TypeScript tries `.ts`/`.tsx`/`.d.ts` before the written `.js`, following" [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L133-L135]] "it is standard library or a declared distribution; otherwise it is unresolved (AD-12's own definition). - Workspace packages are in-repo."
- AD-12's external class is a builtin or a declared dependency. [[middleware/context-oracle/docs/architecture-phase-a.md@059dc86:L1402]] "platform builtin, or a package the repository declares as a dependency — for"
- The builder measured the Python rule on this repository: 589 of 591 imports external, 116 of them in-repo modules (implementation log, E-28).
- The review executed TypeScript 5.9.3: `.` and `..` resolve to a directory's `index.ts`, where this code tries `src.ts` (m1).
**Standard:** The TypeScript handbook's extension substitution (quoted in E-7); Python's `sys.stdlib_module_names`: [[https://docs.python.org/3/library/sys.html]] "A frozenset of strings containing the names of standard library modules." The batch 4 ruling.
**Reasoning:**
1. The code does what the plan said at this commit. The plan's rules are the defect: they diverge from the handbook (`.d.ts`) and from the settled ruling (Python externals, workspace packages).
2. Python: calling every non-root absolute name external hides unresolved in-repo imports as "external", so the share reads 0.000 (the builder's PLAN-FLAW, real). It also classes an undeclared, misspelt or vendored name as external. The ruling's test is decidable at index time: the standard library's names (`sys.stdlib_module_names`) plus the distributions the repository declares.
3. TypeScript: a declared workspace package that is in the repository is classed external, so its edges are lost silently instead of resolved in-repo.
4. What holds: the NodeNext relative rules for `.ts`/`.tsx`/`.mts`/`.cts`, trailing-slash-as-directory, builtins including subpaths, scoped package names, no cross-language extensions (review mutation set).
**Alternatives:** As the ruling states: `.d.ts` in the handbook's order; workspace packages resolved to their in-repo `package.json` entry or counted in-repo; Python external only for a standard-library name or a declared distribution, else unresolved. `feb37c9` replaced the Python rule with a different one (E-33).
**Consequences:** At `HEAD` the TypeScript rules are unchanged (no `.d.ts`, no workspace rule, `.`/`..` as files), and the Python rule is `feb37c9`'s, which still classes an undeclared non-standard name external (E-33).
**Verdict:** replace — keep the NodeNext relative rules and builtin handling; add `.d.ts` per the handbook, treat workspace packages as in-repo, resolve `.`/`..` as directories, and apply the ruling's Python external test.
**Would be wrong if:** the batch 4 ruling had been reversed by a later settled verdict (none of B5–B7 does).

### E-18
**Units:** B9-64-bfe963f-ctxoracle/src/stores/dao/tuning_seeds.ts
**Question:** The build removes `.lua=lua` from the seeded `index.ext_to_grammar` table and rewrites its comment to 31 grammars. Is the seed change right?
**Facts:**
- Before: [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts@059dc86:L82]] "['.lua', 'lua'],"
- After, the row is gone (L83 is now `.kt`), and the comment gives the symptom as the cause. [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts@bfe963f:L67]] "// (lua: ERROR trees for valid source after its first parse in a process, with"
- With the row removed, a `.lua` file is recorded as `unknown` with no fault; with the row kept and no `lua` query, it would be `lua`/`generic` (E-1, `luavis.mjs`, executed).
- A store seeded before this change keeps its `.lua=lua` member, because seeding writes only an absent list. [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@HEAD:L75]] "if (tuning.list(store, l.key).length === 0) {" Since `QUERIES` has no `lua` entry, such a store records `lua`/`generic` (the executed second row of `luavis.mjs`), so the stale seed is harmless.
**Standard:** As E-1: the brief's fallback test (specified and visible) and the root cause over the symptom.
**Reasoning:**
1. The code follows the plan (E-2), and the review's M54 pins it.
2. The decision it implements is E-1's exclusion, which is a patch. Removing the row is also the less visible form of that patch: it turns `lua` into `unknown`, where keeping the row would have left the language named.
**Alternatives:** Keep `.lua=lua` and load a working Lua grammar through the table (E-1). At minimum, keep the row and record the exclusion's cause in `lang_capabilities`.
**Consequences:** T-15-6 asserts the 31-grammar seed (E-21). Still present at `HEAD`.
**Verdict:** replace — restore `.lua=lua` with a working Lua grammar (E-1), or at minimum keep the row and report the exclusion; do not drop the language to `unknown`.
**Would be wrong if:** E-1's verdict fell (a correct Lua grammar could not be loaded under the pin).

### E-19
**Units:** B9-64-bfe963f-ctxoracle/src/index/tree_sitter_frontend.ts
**Question:** The tree-sitter frontend gets definition queries for 25 of the 31 table grammars (plus `bash`), import queries and resolvers for four, UTF-16→byte span conversion, a per-process grammar cache, a `version` built from package versions, the query hash and a hand resolver tag, and a `parse` that returns `{ok: false}` and discards its parser on any throw. Does it do what the plan says, and does each catch and fallback pass the fail-fast test?
**Facts:**
- The parse returns a result whatever the tree holds; there is no ERROR-node check. [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@bfe963f:L420]] "tree = parser.parse(text);" … [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@bfe963f:L445]] "return { ok: true, symbols, imports: captured };"
- The review executed this on the repository: 1 of 391 TypeScript files and 1 of 109 JavaScript files return partial trees, stored with no signal (m9). [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L312-L313]] "A tree with ERROR nodes that does not throw is stored with no signal."
- An unreadable package version becomes the string `unknown` inside `version`. [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@bfe963f:L323]] "return 'unknown';"
- `version` is hand-assembled; the extraction code is not in it (review M2). [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@bfe963f:L404]] "version: `tree-sitter:${lang}:${runtimeVersions()}:query=${sha256Short(queryText)}${imports ? `:${RESOLVER_RULES_VERSION}` : ''}`,"
- B8b settled what `version` must be. [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B8b.md@HEAD:L139]] "define `version` as a content digest of the grammar, query, and frontend/resolver code rather than a hand-maintained string"
- On a throw only the `Parser` is discarded. From the 75th throw in one process the whole module is corrupt, and every grammar's parse fails. [[ran]] `cd $S && node s1.mjs $S/build-ff99487/middleware/context-oracle/ctxoracle` → `bash throw 75 bash: TypeError: resolved is not a function | ts: RuntimeError: memory access out of bounds` / `first ts failure after bash throw # 75`
- A rejected `Parser.init()` is cached for the process, while a rejected `Language.load` is not (review m8). [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@bfe963f:L302]] "parserInit ??= Parser.init();"
- Discarding the parser is not what makes the next parse work: removing the discard survives all 52 tests, because `setLanguage` before each parse resets a parser that threw (review m10). [[ran]] `cd $S && python3 mut.py $S/build-ff99487 dist/src/index/tree_sitter_frontend.js "                discardParser();\n" "" <nine test files>` → `SURVIVED pass=52 fail=0 []`
**Standard:** Fail fast (Shore): [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "The program continues working right after an error but fails in strange ways later on." AD-12 (coverage "measured, not claimed"); B8b's `version` ruling; CLAUDE.md rule 3 (no output that looks more complete than it is).
**Reasoning:**
1. What holds, with the review's mutation set behind it: the queries capture what the plan names, spans are converted to bytes (the runtime reports UTF-16 indices), capabilities follow `QUERIES`/`RESOLVERS`, a grammar with no query gets no frontend, trees are deleted in `finally`.
2. The ERROR-tree gap is the same silent failure that got `lua` excluded (E-1), left open for every other grammar on every file. A partial tree yields partial symbols with nothing recorded, so coverage looks complete.
3. `'unknown'` in `version` is a silent fallback. If a package's `package.json` is unreadable, two different installs can share one `version`, and the fingerprint misses the change. The code should fail or record a fault there, not continue.
4. `version` is not a digest of what shapes the rows (settled in B8b), so a fix to span conversion or `isModuleBinding` re-parses nothing (review M2).
5. The throw handling rests on "the parser that threw is dead; a fresh one is used next". That holds for one throw; from 75 the module is poisoned (executed), and the files that fell back are never retried. The recovery is incomplete (review S1).
6. The `Parser.init()` caching disagrees with the stated reason for not caching a rejected load (m8).
**Alternatives:** Record `rootNode.hasError` per file (a count in `lang_capabilities`, or a fault) so partial coverage is measured. Fail or fault on an unreadable package version. Derive `version` from a digest of the grammar WASM, the query and the frontend and resolver code. Disable a grammar for the rest of the pass on its first throw (bounding throws well under 75), and retry fallback files. Do not cache a rejected `Parser.init()`.
**Consequences:** All still present at `HEAD` (`tree_sitter_frontend.ts` unchanged since `bfe963f`). T-15-4's "exhausted parser not reused" clause cannot fail (E-27).
**Verdict:** replace — keep the queries, span conversion and capability rules; signal ERROR trees per file, fail on an unreadable package version, make `version` a content digest, bound throws per grammar per pass (the 75-throw poisoning), and stop caching a rejected `Parser.init()`.
**Would be wrong if:** web-tree-sitter 0.25.10 recovered its module state after a JavaScript exception unwound through a parse, so that the 75-throw result were an artefact of the script (the same result is the review's, on the built frontend).

### E-20
**Units:** B9-64-bfe963f-ctxoracle/test/fixtures/generate.ts
**Question:** The fixtures gain `pkg/mod.py` and `pkg/use.py` (both PEP 328 forms) in `indexer-small`, and `src/alias.ts` (an `@/util` alias with no `package.json`) in `indexer-walk`, as the plan's "Fixtures built out (G6)" requires. Do they plant what the tests need?
**Facts:**
- [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@bfe963f:L359]] "{ path: 'pkg/use.py', content: 'from .mod import f\nfrom . import mod\n\n\ndef use():\n    return f() + mod.f()\n' },"
- [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@bfe963f:L396]] "{ path: 'src/alias.ts', content: \"import { h } from '@/util';\n\nexport function alias(): number {\n  return h();\n}\n\" },"
- A resolver off by one parent for relative imports fails T-15-3 on these files. [[ran]] `cd $S && python3 mut.py $S/build-ff99487 dist/src/index/resolvers.js "for (let i = 1; i < dots; i++)" "for (let i = 0; i < dots; i++)" indexer_frontends` → `KILLED pass=4 fail=3 ["T-15-3 (fts: true): …", "T-15-3 (fts: false): …", "T-15-3: pkg/use.py’s two import forms are each captured and each resolve to pkg/mod.py"]`
**Standard:** The plan step's fixture text (Step 15, "Fixtures built out (G6)"); the brief's test for a test.
**Reasoning:** Both Python forms the review G12/N8 case names are present, and the relative-level rule is killed on them (executed). The alias file has no `package.json`, so `@/util` can only be unresolved, which is AD-12's alias example. The fixtures are plain text with no ambiguity.
**Alternatives:** None needed.
**Consequences:** B7's settled fixture-isolation defect (the generator inheriting `GIT_*`, 7a E-21) is in this file but not in this commit's diff; it is fixed at `HEAD` per B8.
**Verdict:** keep — the fixtures plant exactly the cases the step names, and a wrong resolver fails on them.
**Would be wrong if:** T-15-3 passed with `pkg/use.py`'s imports resolved to the wrong file.

### E-21
**Units:** B9-64-bfe963f-ctxoracle/test/unit/frontend_capabilities.test.ts
**Question:** T-15-6: for every frontend `defaultFrontends` returns, a sample parses, and declared `symbols`/`imports` match what it yields; the seeded table must be exactly the 31 grammars. Does it fail when behaviour is wrong?
**Facts:**
- The header claims each sample is error-free, but the test never checks it. [[middleware/context-oracle/ctxoracle/test/unit/frontend_capabilities.test.ts@bfe963f:L9]] "// Every sample parses without an ERROR node under its pinned grammar" … [[middleware/context-oracle/ctxoracle/test/unit/frontend_capabilities.test.ts@bfe963f:L108]] "const r = fe.parse(file, Buffer.from(text));"
- A TypeScript sample with a syntax error (`return helper(;;;`, which parses with `hasError true`) still passes. [[ran]] `cd $S && python3 mut.py $S/build-ff99487 dist/test/unit/frontend_capabilities.test.js "export function answer(): number {\\n  return helper();\\n}\\n" "export function answer(): number {\\n  return helper(;;;\\n}\\n" frontend_capabilities` → `SURVIVED pass=1 fail=0 []`
- It pins the Lua exclusion. [[middleware/context-oracle/ctxoracle/test/unit/frontend_capabilities.test.ts@bfe963f:L90]] "assert.deepEqual(seeded, [...TABLE_GRAMMARS].sort(), 'the seeded index.ext_to_grammar table is not the 31-grammar table (lua excluded)');"
- The review's mutations M08, M52, M54 are killed by T-15-6.
**Standard:** The brief's test for a test; AD-12 ("coverage is measured, not claimed").
**Reasoning:**
1. The capability clauses do what the plan's Fails-when says, and they fail on a capability lie (review M08).
2. The header's "no ERROR node" premise is what makes a missing symbol "the frontend's, not a malformed sample's". It is not asserted, so a grammar or runtime regression that turns a sample into an ERROR tree can still pass when the query captures something (executed with a broken sample).
3. The 31-grammar assertion pins E-1's exclusion, which is to be replaced.
**Alternatives:** Assert `!rootNode.hasError` for each sample through web-tree-sitter directly. Assert the table E-1's correction produces.
**Consequences:** Present at `HEAD`.
**Verdict:** replace — keep the capability clauses; assert each sample's tree is error-free, and follow E-1 for the table.
**Would be wrong if:** the frontend returned `{ok: false}` for any tree with an ERROR node (it does not, E-19).

### E-22
**Units:** B9-64-bfe963f-ctxoracle/test/unit/generic_frontend.test.ts
**Question:** T-15-2: a `.sh` file with one POSIX and one keyword-form function yields both symbols and no import, and the frontend declares `{symbols: true, imports: false}`. Does it fail when behaviour is wrong?
**Facts:**
- [[middleware/context-oracle/ctxoracle/test/unit/generic_frontend.test.ts@bfe963f:L29]] "for (const expected of ['greet', 'farewell']) assert.ok(names.includes(expected), `symbol ${expected} is missing (got ${JSON.stringify(names)})`);"
- Removing the keyword-form regex kills it, and so does declaring `imports: true`. [[ran]] `cd $S && python3 mut.py $S/build-ff99487 dist/src/index/generic_frontend.js '<the function-keyword SH_NAME regex line>' '' generic_frontend` → `KILLED pass=1 fail=1 ["T-15-2: a .sh file with two functions yields both function-shape symbols and no import"]`; `… "capabilities: { symbols: true, imports: false }," "capabilities: { symbols: true, imports: true }," generic_frontend` → `KILLED pass=1 fail=1 ["T-15-2: genericFrontend declares {symbols: true, imports: false}"]`
- The implementation log records that T-15-2 passed on the skeleton, so it pins behaviour the skeleton already had. [[middleware/context-oracle/docs/implementation-log.md@bfe963f:L1542]] "**Pinned before the build, as §7's contract requires.** `T-15-2` passed on the"
**Standard:** The plan's T-15-2 spec (symbols present, no `import_edge`, the capability) and the brief's test for a test.
**Reasoning:** Each of the spec's three failure conditions has a clause, and each clause is killed by the matching fault (executed, and the review's M21, M22, M24, M70). Spans are not part of T-15-2's spec; RV15-9/18 cover them.
**Alternatives:** None required by the spec.
**Consequences:** None.
**Verdict:** keep — each Fails-when clause is present and killed by its fault.
**Would be wrong if:** the spec required T-15-2 to assert spans.

### E-23
**Units:** B9-64-bfe963f-ctxoracle/test/unit/import_resolvers.test.ts
**Question:** T-15-5: the TypeScript and Python classification tables over a `RepoFiles` fake. Does each cell fail when the rule is wrong, and does the table cover the rules the resolvers must follow?
**Facts:**
- A typical cell. [[middleware/context-oracle/ctxoracle/test/unit/import_resolvers.test.ts@bfe963f:L24]] "['./b.js', { kind: 'resolved', dst: 'src/b.ts' }],"
- The Python external cell uses a standard-library name. [[middleware/context-oracle/ctxoracle/test/unit/import_resolvers.test.ts@bfe963f:L45]] "['os', { kind: 'external' }],"
- No cell holds two candidates at once, so the order of the written `.js` and its source is unpinned. Mutation D (written path first) survives all nine test files (E-7). A `.js` specifier that no longer tries `.tsx` also survives: [[ran]] `cd $S && python3 mut.py $S/build-ff99487 dist/src/index/resolvers.js "'.js': ['.ts', '.tsx']," "'.js': ['.ts']," <nine test files>` → `SURVIVED pass=52 fail=0 []`
- The table has no `.d.ts` cell, no workspace-package cell and no undeclared non-standard Python name (for example `requests` with nothing declared), the three rules batch 4 settled (E-17).
- The review's mutations M29–M35 and M44 are killed by T-15-5.
**Standard:** The brief's test for a test; the batch 4 resolver ruling; the TypeScript handbook's extension substitution (E-7).
**Reasoning:**
1. Each existing cell discriminates its own rule (the review's kills; E-11 for `.m2`).
2. The table leaves out the cases where the resolvers diverge from the handbook and the ruling. So it passes the defective rules of E-17, and it cannot catch an order change or a lost `.tsx` source.
3. At this commit it also passes the root-only Python rule the builder then found wrong: no cell has an in-repo module under an ancestor directory.
**Alternatives:** Add cells: `./x.js` with `x.ts` and `x.js` both present (source first); `./j.js` with only `j.tsx`; `./t.js` with only `t.d.ts`; a declared workspace package present in the tree; `requests` undeclared and absent (unresolved); a nearer and a farther Python candidate for the same name (nearest first).
**Consequences:** `feb37c9` adds four ancestor cells (E-34). The gaps above are still present at `HEAD`.
**Verdict:** replace — keep the cells; add the order, `.tsx`-source, `.d.ts`, workspace and undeclared-Python cells so the table covers the settled rules.
**Would be wrong if:** another test at `HEAD` pinned source-before-written order or `.d.ts` (none does: mutations C and D survive the whole Step 15 set).

### E-24
**Units:** B9-64-bfe963f-ctxoracle/test/unit/indexer_frontends.test.ts
**Question:** T-15-3: `runIndex` with `defaultFrontends` on `indexer-small` populates every table, the two FTS states agree, `fts_symbols` matches `symbols`, `lang_capabilities` holds the stated entries, and the `indexer-walk` alias counts as unresolved. Does it fail when behaviour is wrong?
**Facts:**
- It asserts the excluded grammar's file as `unknown`. [[middleware/context-oracle/ctxoracle/test/unit/indexer_frontends.test.ts@bfe963f:L220]] "assert.equal(shLang, 'unknown', `${INDEXER_SMALL.markerPath}'s recorded language is not unknown`);"
- Relative-import faults are killed by it (E-20, `KILLED pass=4 fail=3`).
- The review's mutations M03, M04, M05, M17, M39, M51 are killed by T-15-3.
**Standard:** The brief's test for a test; E-8's ruling on how an excluded grammar is recorded.
**Reasoning:** The test implements its spec, and its clauses are killed by the faults they name. The one clause to change is the `unknown` expectation, which pins the invisible recording E-8 replaces.
**Alternatives:** Expect `bash`/`generic` with the exclusion recorded, per E-8.
**Consequences:** Present at `HEAD` (`feb37c9` only added a fake `hasTopLevelModule`, E-34).
**Verdict:** replace — keep every clause; change the `.sh` expectation from `unknown` to its language with frontend `generic`, per E-8.
**Would be wrong if:** E-8's verdict fell.

### E-25
**Units:** B9-64-bfe963f-ctxoracle/test/unit/indexer_walk.test.ts, B9-64-bfe963f-ctxoracle/test/unit/search_semantics.test.ts
**Question:** Step 14 left three subtests marked `todo` until Step 15's frontends existed. The build removes the `todo` marks and the typed `defaultFrontendsFromTuning` alias, leaving the assertions unchanged. Is the retirement faithful?
**Facts:**
- `git show bfe963f -- …/indexer_walk.test.ts …/search_semantics.test.ts` removes the `todo: TODO` options, the alias and its imports, and changes the header comments; no assertion line changes.
- The retired subtests fail on a real fault. [[ran]] `cd $S && python3 mut.py $S/build-ff99487 dist/src/index/tree_sitter_frontend.js "    python: resolvePythonImport," "" indexer_walk search_semantics` → `KILLED pass=11 fail=1 ["T-14-3 (Step 15): test_map holds the import_edge rows of the TypeScript and Python test files"]`
- The plan requires the retirement at this step. [[middleware/context-oracle/docs/plans/plan-phase-a.md@bfe963f:L4331-L4332]] "— `T-14-3`'s two `import_edge` `test_map` rows (its TypeScript and Python"
**Standard:** Node's test runner `todo` option marks a pending test; the plan says Step 15's build is not complete while any of the three is `todo` or red.
**Reasoning:** Removing the marks makes the three subtests count, and they pass on the build and fail on a planted fault (executed; the review's M01, M06, M09 also). The alias was a stand-in for the old signature and has no other use.
**Alternatives:** None.
**Consequences:** These files still carry B8a's settled defects (the ignore-as-`generated` assertion in `indexer_walk.test.ts`, the missing decomposed-accent case in `search_semantics.test.ts`); they are not in this commit's diff.
**Verdict:** keep — the retirement is faithful, and the retired subtests fail on a real fault.
**Would be wrong if:** an assertion in the three subtests had been weakened in the same diff (none was).

### E-26
**Units:** B9-64-bfe963f-ctxoracle/test/unit/tree_sitter_frontend.test.ts
**Question:** T-15-1: the TypeScript frontend's capabilities, each fixture file's symbol with a span that "covers the name", the captured `./util.js`, and the stored rows and the `src/app.ts → src/util.ts` edge. Does it fail when the span is wrong?
**Facts:**
- The span check. [[middleware/context-oracle/ctxoracle/test/unit/tree_sitter_frontend.test.ts@bfe963f:L52]] "assert.ok(s.spanStart <= at && nameEnd <= s.spanEnd, `${file} ${s.name}: span [${s.spanStart}, ${s.spanEnd}) does not cover the name at [${at}, ${nameEnd})`);"
- A span that starts at the name instead of the declaration passes all of T-15-1…T-15-6 and the retired Step 14 subtests (E-9: `SURVIVED pass=32 fail=0`).
- The edge and capability clauses are killed by their faults (review M01, M03, M28).
**Standard:** T-15-1's own Data definition, "A symbol's span is its declaration node's byte span" (plan L12275 at `42653ae`); the brief's test for a test.
**Reasoning:** The test implements the weak assertion E-9 finds wrong in the spec. The capability, capture and edge clauses are sound; the span clause cannot tell a declaration span from a name-start span.
**Alternatives:** Assert the exact byte range of each declaration from the fixture text (E-9).
**Consequences:** RV15-1/12/18 cover the property at `HEAD` in another file; T-15-1 itself is unchanged at `HEAD`.
**Verdict:** replace — assert each declaration's exact span instead of "covers the name".
**Would be wrong if:** the fixture's declaration bytes could not be computed from its text.

### E-27
**Units:** B9-64-bfe963f-ctxoracle/test/unit/tree_sitter_frontend_fallback.test.ts
**Question:** T-15-4: with `.sh=bash`, a throwing `case` file falls back to generic symbols with a fault naming its path and language; the next file indexes cleanly, which is meant to show the exhausted parser was not reused. Does each clause fail when behaviour is wrong?
**Facts:**
- The fault clause accepts any number of matching faults. [[middleware/context-oracle/ctxoracle/test/unit/tree_sitter_frontend_fallback.test.ts@bfe963f:L85]] "faults.some((d) => d.path === CASE_FILE && d.lang === 'bash'),"
- A build that records two faults per failed file passes every Step 15 test. [[ran]] `cd $S && python3 mut.py $S/build-ff99487 dist/src/index/indexer.js "parseFailures.push({ lang, path: p, error: redact(parsed.error).redacted.slice(0, ERROR_MAX_CHARS) });" "<the same line> parseFailures.push({ lang, path: p, error: 'dup' });" <nine test files>` → `SURVIVED pass=52 fail=0 []`
- The reuse clause. [[middleware/context-oracle/ctxoracle/test/unit/tree_sitter_frontend_fallback.test.ts@bfe963f:L94]] "`${PLAIN_FILE}'s parse threw — the exhausted parser instance was reused; faults: ${JSON.stringify(faults)}`"
- A build that never discards the parser passes it, because `setLanguage` before each parse resets a parser that threw (E-19: `SURVIVED pass=52`; review m10).
- The fallback's generic symbols and the fault are killed (review M48b, M49, M69).
**Standard:** The plan's rule, "exactly one `frontend_parse_failed` is recorded for it" (h10, E-6), and the brief's test for a test.
**Reasoning:**
1. The fallback and fault-presence clauses discriminate.
2. "Exactly one" is the plan's rule and is not asserted: duplicates survive.
3. The reuse clause cannot fail under this frontend, since the runtime resets the parser anyway. It asserts a premise that is not what makes the next parse work. The discriminating case is the deleted-instance reuse the review's M64 kills.
4. It also does not assert that the fallback file counts in its language's share (E-6's missing rule).
**Alternatives:** Assert exactly one matching fault per failed file; replace the reuse clause with the deleted-instance case; add the share clause once E-6's rule exists; add the review's many-throws case (80 throwing files, then a TypeScript edge that must exist) for S1.
**Consequences:** Present at `HEAD`.
**Verdict:** replace — assert exactly one fault, replace the reuse clause that cannot fail, and add the share and many-throws cases.
**Would be wrong if:** `recordFault` de-duplicated identical faults (it does not; each `parseFailures` item is recorded, `indexer.ts` L835 at `ff99487`).

### E-28
**Units:** B9-64-bfe963f-docs/implementation-log.md#h1
**Question:** The implementation log's Step 15 entry records what was built, the plan silences the builder decided, the verification run, and a PLAN-FLAW in the Python resolver. What does it assert, and is each assertion true and backed?
**Facts:**
- The heading calls the work uncommitted in the commit that commits it. [[middleware/context-oracle/docs/implementation-log.md@bfe963f:L1532]] "BUILT (2026-09-26, uncommitted, pending independent review; one PLAN-FLAW raised, below)"
- It asserts the tests were untouched by the build. [[middleware/context-oracle/docs/implementation-log.md@bfe963f:L1539]] "both skeleton overloads. No asserted test value was changed and no test was"; the tests and the code arrive in the same commit, so history cannot show a red-first state or an unchanged test.
- The PLAN-FLAW. [[middleware/context-oracle/docs/implementation-log.md@bfe963f:L1702]] "116 of the 589 external imports name an in-repo module under an ancestor"
- The proposed fix calls the ancestor walk Python's rule. [[middleware/context-oracle/docs/implementation-log.md@bfe963f:L1714-L1715]] "directories, nearest first, then the repository root, as Python's `sys.path[0]` rule does;"
- Python's documentation: `sys.path[0]` is one directory, the script's own (or the working directory for `-m`/`-c`). [[https://docs.python.org/3/library/sys.html]] "python script.py command line: prepend the script’s directory."
- The review reproduced the builder's per-language numbers on this repository for the later `feb37c9` state (review L29–L32).
- Decisions in the code that the entry does not list: the `'unknown'` package-version fallback in `version` (E-19), the silent skip of a malformed table member (E-14), the absence of any ERROR-tree signal (E-19), the Lua regex added to the generic frontend (E-15), and the fallback file's absence from the unresolved share (E-16).
**Standard:** CLAUDE.md dominating rule 1: [[middleware/context-oracle/CLAUDE.md@HEAD:L104-L106]] "Never claim something works without having run it — paste the actual command and its output." The brief: a record's decision is what it asserts; it must be true and backed.
**Reasoning:**
1. The PLAN-FLAW is real and was correctly routed rather than built around. The root-only rule hid in-repo imports as external; it also contradicted the settled batch 4 ruling, which the entry does not mention.
2. "As Python's `sys.path[0]` rule does" is false. `sys.path[0]` is a single directory; walking every ancestor is a heuristic for unknown project roots. The false premise was carried into the plan (E-29).
3. "Uncommitted" is stale in a committed record, and "no asserted value changed" is not checkable from history. Both need qualifying.
4. The listed plan silences are recorded honestly, but five choices that shape stored rows or hide failures are missing, so a reader cannot find them from the log.
**Alternatives:** State the flaw with the batch 4 ruling as its governing rule; call the ancestor walk a heuristic; list the five omitted decisions; mark the red-first account as unverifiable from history; drop "uncommitted".
**Consequences:** The false `sys.path[0]` premise reaches `d616f1f` (E-29), the code comment (E-33) and the second log entry (E-35).
**Verdict:** replace — keep the build account and the PLAN-FLAW; correct the `sys.path[0]` premise, cite the batch 4 ruling, list the omitted decisions, and qualify "uncommitted" and the unverifiable red-first claim.
**Would be wrong if:** Python's documentation defined `sys.path[0]` as including the script directory's ancestors.

### E-29
**Units:** B9-65-d616f1f-docs/plans/plan-phase-a.md#h1
**Question:** After the builder's PLAN-FLAW (116 in-repo Python imports classed external), the plan's Python rule becomes: look an absolute name up in the importer's directory and every ancestor to the root, nearest first; with no hit it is external only when no in-repo module or package has its top-level name, otherwise unresolved. Is this the correct fix?
**Facts:**
- The rule and its claimed basis. [[middleware/context-oracle/docs/plans/plan-phase-a.md@d616f1f:L4275-L4279]] "an absolute dotted name is looked up the way Python's `sys.path[0]` rule does for a script — against the importing file's own directory, then each ancestor directory in turn, nearest first, up to and including the repository root"
- The external test. [[middleware/context-oracle/docs/plans/plan-phase-a.md@d616f1f:L4280-L4282]] "hit it is `external` only when no in-repo module or package with the same top-level name (`a`) exists anywhere in the repository (then it is the standard library or an installed distribution); otherwise it is"
- `sys.path[0]` is one directory. [[https://docs.python.org/3/library/sys.html]] "python script.py command line: prepend the script’s directory." A top-level import searches `sys.path`. [[https://docs.python.org/3/reference/import.html]] "If the path argument is None , this indicates a top level import and sys.path is used."
- The standard library's names are available as data. [[https://docs.python.org/3/library/sys.html]] "A frozenset of strings containing the names of standard library modules."
- The settled ruling. [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L133-L134]] "it is standard library or a declared distribution; otherwise it is unresolved (AD-12's own definition)."
- The rule classes an undeclared, absent name as external and a standard-library name as unresolved when some directory shares its name. [[ran]] `cd $S/build-feb37c9/middleware/context-oracle/ctxoracle && node $S/py1.mjs` → `requests, not declared, not in repo -> external` / `reqeusts (typo) -> external` / `logging (stdlib), repo has tools/logging/setup.py -> unresolved` / `config from a/b/x.py with a/config.py -> {"kind":"resolved","dst":"a/config.py"}`
- The builder's own measurement names the case the rule cannot see: a `src/` layout package (implementation log at `feb37c9`, L1811: "lives under that project's `src/` (a src layout, reached only through").
**Standard:** Python's import system and `sys.path` documentation (quoted); the batch 4 ruling; AD-12's external class (a builtin or a declared dependency, architecture L1402 at `059dc86`).
**Reasoning:**
1. The problem was real: root-only lookup hid about one import in five as external.
2. The ancestor walk is not "Python's `sys.path[0]` rule". It stands for project roots that `-m`, pytest or an installed package put on `sys.path`, which the resolver cannot see. As a heuristic it is reasonable, but the plan states it as Python's semantics, and a nearest-first hit it cannot verify is recorded as a certain edge.
3. The external test contradicts the ruling in both directions (executed). An undeclared or misspelt name is called external, so a missing dependency is hidden. A standard-library name matching any directory in the repository is called unresolved, so the share rises for nothing.
4. The ruling's test is available at index time (`sys.stdlib_module_names`, and the distributions the repository declares in `pyproject.toml`/`requirements*.txt`/`setup.cfg`), so there is no reason to approximate it by name collisions.
5. The root-cause fix for the roots problem is to read the repository's declared Python roots (the directory of each `pyproject.toml`/`setup.py`, and a declared `src/` layout's `package-dir`) and search them, plus the importer's own directory, which is Python's rule for a script.
**Alternatives:** Resolve against the importer's directory plus the declared project roots; keep the ancestor walk only as a stated heuristic if roots cannot be read, and state its false-edge direction. External only for a standard-library name or a declared distribution; otherwise unresolved. The chosen rule loses on both counts: a false premise, and an external test the ruling already rejected.
**Consequences:** `115d176` adds `hasTopLevelModule` to answer this external test (E-32), `feb37c9` builds it (E-33), and T-15-5 pins it (E-30, E-34). Still present at `HEAD`.
**Verdict:** replace — keep the finding and the importer's-directory lookup; call the ancestor walk a heuristic (or replace it with declared project roots), and apply the ruling's external test (standard library or declared distribution, else unresolved).
**Would be wrong if:** a later settled verdict reversed batch 4's Python external rule.

### E-30
**Units:** B9-65-d616f1f-docs/plans/plan-phase-a.md#h2
**Question:** T-15-5 gains four ancestor-lookup cells: `helpers.x` found at an ancestor, `local` in the importer's directory, `json` external, `tools.missing` unresolved. Do the cells pin the rule, and the right rule?
**Facts:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@d616f1f:L12405-L12407]] "directory first); `json` with no in-repo `json` module → external; `tools.missing` with `tools/` present but no `missing` module under any ancestor → unresolved (the top-level name is the repository's own)."
- No cell holds two candidates for one name, so nearest-first is unpinned. A build that looks at the root first passes every Step 15 test and every review test. [[ran]] `cd $S && python3 mut.py $S/build-ff99487 dist/src/index/resolvers.js "<the ancestor loop head>" "<a root lookup inserted before it>" <nine test files>` → `SURVIVED pass=52 fail=0 []`
- `json` is external under both the plan's rule and the ruling, but for different reasons (a standard-library name, not "no in-repo `json`").
**Standard:** The brief's test for a test; the batch 4 ruling (E-29).
**Reasoning:** The cells check the rule's two branches in the cases where only one candidate exists. They cannot fail on a wrong order, which is half the rule ("nearest first"). The `json` cell's stated reason is the rule E-29 replaces. No cell covers an undeclared non-standard name, where the plan's rule and the ruling disagree.
**Alternatives:** Add a cell with both `tools/sub/util.py` and `tools/util.py` present (nearest wins), and `requests` undeclared and absent (unresolved under the ruling). Restate `json`'s reason as a standard-library name.
**Consequences:** Built as E-34's cells; present at `HEAD`.
**Verdict:** replace — keep the four cells; add a nearest-first cell and an undeclared-name cell, and give `json`'s reason as the standard library.
**Would be wrong if:** another test pinned nearest-first (the root-first mutant survives all 52).

### E-31
**Units:** B9-66-115d176-docs/plans/plan-phase-a.md#h1, B9-67-f22ce6b-docs/plans/plan-phase-a.md#h1
**Question:** `src/index/frontend.ts` (the `RepoFiles` interface) is added to Step 15's `modify` list (`115d176` h1), and `f22ce6b` h1 regenerates the files-table row it had left stale. Is the bookkeeping right?
**Facts:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@115d176:L4154]] "middleware/context-oracle/ctxoracle/src/index/frontend.ts, middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts"
- The generated row, added by `f22ce6b`. [[middleware/context-oracle/docs/plans/plan-phase-a.md@f22ce6b:L592]] "| middleware/context-oracle/ctxoracle/src/index/frontend.ts | modify | S15 |"
- `f22ce6b`'s message records that the plan check failed after `115d176` and that the failure was hidden by piping it through `tail`; the review's run of `derive-plan-sections --check` at `feb37c9` reports `regions current`.
- `feb37c9` changes `frontend.ts` (`git show feb37c9 --stat`: `src/index/frontend.ts | 6 ++++`).
**Standard:** The plan's step-declaration contract (every changed file is declared; the files table is generated).
**Reasoning:** Step 15 changes the `RepoFiles` interface, so `frontend.ts` belongs in its list. Under the corrected Python rule (E-29) the interface still changes (it needs the declared distributions or project roots), so the entry stands whichever rule is built. The regenerated row is the generator's output. The broken-then-fixed check is a process failure `f22ce6b` records honestly; the end state is correct.
**Alternatives:** None.
**Consequences:** None beyond E-32.
**Verdict:** keep — `frontend.ts` is a file Step 15 changes, and the table row is generated from the declaration.
**Would be wrong if:** the corrected Python rule could be built without changing `RepoFiles`.

### E-32
**Units:** B9-66-115d176-docs/plans/plan-phase-a.md#h2, B9-67-f22ce6b-docs/plans/plan-phase-a.md#h2
**Question:** The test writer found that `RepoFiles` had no way to answer "does an in-repo module have this top-level name". `115d176` adds `hasTopLevelModule(name)`, true when some present path is `<dir>/<name>.py` or has a directory segment `<name>` with a `.py` file beneath it. `f22ce6b` h2 rewords one phrase for the plan checker. Is the member correct?
**Facts:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@115d176:L4286-L4287]] "`hasTopLevelModule(name): boolean` — true when some present in-tree path is `<dir>/<name>.py`, or has a directory segment `<name>` with a `.py` file"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@f22ce6b:L4290]] "set (the interface offered only a single-path membership check; raised by the Step 15 test"
- Any directory named like a standard-library module makes that module's imports unresolved. Executed in E-29: `logging (stdlib), repo has tools/logging/setup.py -> unresolved`.
- The review found the same breadth. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L285]] "- **m4 — `hasTopLevelModule` counts any directory segment above a `.py` file**"
**Standard:** The batch 4 ruling (external = standard library or declared distribution), E-29.
**Reasoning:**
1. The gap the test writer raised was real: the rule `d616f1f` wrote could not be answered through the interface.
2. The member answers the wrong question. It exists to serve the external test E-29 replaces, and its "any directory segment" breadth turns standard-library imports unresolved on unrelated directory names (executed).
3. Under the ruling, `RepoFiles` needs the repository's declared Python distributions (and, for the roots fix, its declared project roots), not a name-collision test.
4. The `f22ce6b` rewording changes no meaning; it only keeps the plan checker from reading a backticked `has(path)` as a cross-step interface.
**Alternatives:** Replace the member with `declaredPythonDistributions(fromPath)` (nearest `pyproject.toml`/`requirements*.txt`/`setup.cfg`), used with the standard-library name list; optionally `pythonRoots()`. If a collision test is kept at all, limit it to directories the importer's lookup could import from (the review's m4 fix).
**Consequences:** Built in `feb37c9`'s indexer (E-33) and pinned by RV15-6 (E-36). Present at `HEAD`.
**Verdict:** replace — keep the gap finding; replace `hasTopLevelModule` with the declared-distribution (and project-root) inputs the ruling's external test needs.
**Would be wrong if:** the ruling's external test could not be computed from repository files (it can: the standard-library list is fixed per Python version and declarations are files in the tree).

### E-33
**Units:** B9-68-feb37c9-ctxoracle/src/index/frontend.ts, B9-68-feb37c9-ctxoracle/src/index/indexer.ts, B9-68-feb37c9-ctxoracle/src/index/resolvers.ts
**Question:** `feb37c9` builds `d616f1f`/`115d176`: the ancestor lookup in `resolvePythonImport`, `hasTopLevelModule` on the interface and in the indexer (built once per pass from the present set), and a bumped `RESOLVER_RULES_VERSION`. Does the code do what the plan says, and is what it does correct?
**Facts:**
- The comment repeats the false premise. [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@feb37c9:L124]] "// An absolute name is looked up the way Python's `sys.path[0]` rule does for"
- The external test. [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@feb37c9:L139]] "return repo.hasTopLevelModule(rest.split('.')[0] as string) ? UNRESOLVED : EXTERNAL;"
- Every directory above a `.py` file counts as a top-level name. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@feb37c9:L739]] "for (const d of segs.slice(0, -1)) pyTopLevel.add(d);"
- The interface member. [[middleware/context-oracle/ctxoracle/src/index/frontend.ts@feb37c9:L35]] "hasTopLevelModule(name: string): boolean;"
- The version is bumped by hand. [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@feb37c9:L22]] "export const RESOLVER_RULES_VERSION = 'resolvers-s15.2';"
- Executed on this build (E-29): `requests` undeclared and absent → `external`; `logging` with `tools/logging/setup.py` present → `unresolved`.
- The code at `HEAD` equals this code (`git diff --stat feb37c9 64f46fd -- …/ctxoracle` lists only the review's test file).
**Standard:** Python's import documentation and the batch 4 ruling (E-29); B8b's `version` ruling (a content digest, E-19).
**Reasoning:**
1. The code does what `d616f1f` and `115d176` say, and the review's mutations M40–M43, M46 and M47 pin it.
2. It inherits both defects of E-29 and E-32: a rule presented as Python's semantics that is a heuristic, and an external test that contradicts the ruling in both directions (executed).
3. The hand-bumped version tag did its job here, but only because a person remembered. B8b settled that `version` must be a digest.
**Alternatives:** Build E-29's corrected rule: the importer's directory plus declared project roots; external only for `sys.stdlib_module_names` members and declared distributions; `RepoFiles` exposes declared distributions instead of `hasTopLevelModule`; `version` a digest of the resolver code.
**Consequences:** Present at `HEAD`. Python's share on this repository (0.273, above the 0.05 seed) makes Reuse treat Python as `imports: false` (E-35); with the corrected rule the share would move again, and the log should say which way.
**Verdict:** replace — build the ruling's external test and a stated heuristic (or declared-roots) lookup, replace `hasTopLevelModule`, and derive `version` from the code.
**Would be wrong if:** the batch 4 ruling were reversed, making "no in-repo top-level name" the settled external test.

### E-34
**Units:** B9-68-feb37c9-ctxoracle/test/unit/import_resolvers.test.ts, B9-68-feb37c9-ctxoracle/test/unit/indexer_frontends.test.ts
**Question:** `feb37c9` adds the four ancestor cells to T-15-5 and a `hasTopLevelModule` implementation to both test fakes (T-15-5 and T-15-3). Do they fail when the rule is wrong?
**Facts:**
- The cells, as in E-30. [[middleware/context-oracle/ctxoracle/test/unit/import_resolvers.test.ts@feb37c9:L74]] "['json', { kind: 'external' }], // no in-repo json module"
- The root-first mutant survives (E-30: `SURVIVED pass=52 fail=0`); the review's M40–M43 and M66 are killed by these cells.
- The T-15-3 change only adds `hasTopLevelModule: (name) => hasTopLevelModuleIn(present, name)` to its `RepoFiles` object so the file compiles against the new interface.
**Standard:** The brief's test for a test; the batch 4 ruling.
**Reasoning:** The cells pin the rule's branches but not its order, and they pin an external test the ruling replaces. The fakes copy the rule, so they change with it. The T-15-3 edit is mechanical.
**Alternatives:** E-30's added cells (nearest-first; undeclared name unresolved), with fakes exposing declared distributions instead.
**Consequences:** Present at `HEAD`.
**Verdict:** replace — add the nearest-first and undeclared-name cells, restate `json`'s reason, and move the fakes to the corrected interface.
**Would be wrong if:** as E-30.

### E-35
**Units:** B9-68-feb37c9-docs/implementation-log.md#h1
**Question:** The log records the Python fix: the chosen option, the build, the verification, and the repository's new Python numbers. What does it assert, and is it true?
**Facts:**
- The heading again says uncommitted. [[middleware/context-oracle/docs/implementation-log.md@feb37c9:L1734]] "## Step 15 — the Python resolver's ancestor lookup and `RepoFiles.hasTopLevelModule` — BUILT (2026-09-26, uncommitted, pending independent review)"
- It states the heuristic as Python's rule. [[middleware/context-oracle/docs/implementation-log.md@feb37c9:L1756-L1757]] "the repository root. The first hit is `resolved`. This is Python's `sys.path[0]` rule."
- It notes the case the heuristic cannot see. [[middleware/context-oracle/docs/implementation-log.md@feb37c9:L1811]] "lives under that project's `src/` (a src layout, reached only through"
- It states the consequence for Reuse. [[middleware/context-oracle/docs/implementation-log.md@feb37c9:L1817]] "will treat Python as it treats an `imports: false` language, as AD-12"
- The review reproduced python 112 edges / 42 unresolved on this repository (review L29–L31).
- `sys.path[0]` is the script's directory only (E-28, Python's `sys` documentation).
**Standard:** CLAUDE.md dominating rule 1 (report what was run, and nothing more); the batch 4 ruling.
**Reasoning:**
1. The numbers are reproduced by the review, and the Reuse consequence is stated honestly, which is what AD-12's share is for.
2. "This is Python's `sys.path[0]` rule" is false (E-28, E-29).
3. The entry does not say the external test disagrees with the batch 4 ruling, so its 431 "external" imports include names that are neither standard library nor declared, and the share it reports is computed under a rule already rejected.
4. The `src/`-layout observation points at the root-cause fix (declared roots) and is recorded only as an example.
5. "Uncommitted" is stale.
**Alternatives:** Call the walk a heuristic; state the ruling conflict and that the 431 external count is under the plan's rule; name the `src/` layout as the case declared roots would resolve; drop "uncommitted".
**Consequences:** The review record (E-37) accepted "the `sys.path[0]` ancestor lookup" as holding.
**Verdict:** replace — keep the numbers and the Reuse consequence; correct the `sys.path[0]` premise, state the ruling conflict, and drop "uncommitted".
**Would be wrong if:** Python's documentation defined `sys.path[0]` to include ancestors.

### E-36
**Units:** B9-69-ff99487-ctxoracle/test/unit/frontends_review.test.ts
**Question:** The review adds 20 cases (RV15-1…RV15-18) to kill the mutants the T-15 tests let survive: byte spans for 2/3/4-byte, Latin-1 and BOM text; non-UTF-8 fallback spans; `version` inputs; the no-query guard; package names, trailing slash and source extensions; the real `hasTopLevelModule`; name redaction; `require`/dynamic/re-export/import-require/aliased edges; C# kinds; the appended order; `.`/`..` in Python; `defaultFrontends`' list. Do they fail when behaviour is wrong, and do any pin a decision that is being replaced?
**Facts:**
- The span cases kill a name-start span that every T-15 test passes. [[ran]] `cd $S && python3 mut.py $S/build-ff99487 dist/src/index/tree_sitter_frontend.js "const spanStart = toByte(def.node.startIndex);" "const spanStart = toByte(name.startIndex);" <nine files incl. frontends_review>` → `KILLED pass=49 fail=3 ["RV15-1: …", "RV15-12: …", "RV15-18: …"]`
- RV15-3 pins the hand-kept resolver tag inside `version`. [[middleware/context-oracle/ctxoracle/test/unit/frontends_review.test.ts@ff99487:L160]] "assert.ok(treeSitterFrontend(lang).version.includes(RESOLVER_RULES_VERSION), `${lang}: version does not carry the resolver rules identity ${RESOLVER_RULES_VERSION}`);"
- The file notes an unpinned order and leaves it unpinned. [[middleware/context-oracle/ctxoracle/test/unit/frontends_review.test.ts@ff99487:L359]] "candidates at once, so the order is unpinned there." The review calls the surviving source-order mutant a plan silence. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L429]] "- M60 is a plan silence (m11)."
- Three mutants of behaviour the code gets right survive this file too: written path before source (E-7), root-first Python lookup (E-30), a duplicate fault per failed file (E-27); each `SURVIVED pass=52 fail=0`.
- The whole set passes on `ff99487` (baseline `pass=52 fail=0`).
**Standard:** The brief's test for a test; the batch 4 ruling (source before the written `.js`); B8b's `version` ruling (a content digest).
**Reasoning:**
1. The cases are sound. Each names the plan sentence it pins, and the executed span mutant confirms the kill pattern the review reports.
2. The source-before-written order is not a plan silence: the handbook and batch 4 settle it. A test for it would pass on this code, so leaving it out left a correct behaviour unguarded. The same holds for nearest-first (the plan says it) and "exactly one fault" (the plan says it).
3. RV15-3's resolver-tag clause and RV15-13's package-version clause pin the hand-assembled `version` that B8b settled should be a digest. They will need restating when the digest lands.
4. RV15-6 asserts outcomes (`helpers.missing`, `solo.missing` unresolved, `json` external) that also hold under the ruling, but its title gives the replaced reason ("its top-level name is an in-repo directory or module").
**Alternatives:** Add three passing cases (source-before-written `.js`, nearest-first Python lookup, exactly one `frontend_parse_failed`). Restate RV15-3 and RV15-13 as "version changes when the grammar, query or frontend/resolver code changes". Retitle RV15-6 to the ruling's reason.
**Consequences:** Present at `HEAD` unchanged.
**Verdict:** replace — keep all 20 cases; add the source-order, nearest-first and exactly-one-fault cases, and restate RV15-3, RV15-13 and RV15-6's title to the settled rules.
**Would be wrong if:** the plan's own text left the source-before-written order open and no settled ruling fixed it (batch 4 item 5 fixes it).

### E-37
**Units:** B9-69-ff99487-docs/reviews/2026-09-26-step-15-build-review.md
**Question:** The independent review of the Step 15 build (`bfe963f`, `feb37c9`) reports one Serious, five Moderate and eleven Minor findings, a judged table of the builder's decisions, and a 75-mutation run. Is each finding real, and what happened to each one? No fix commit follows the review on this branch, so which are still open at `HEAD`?
**Facts:**
- S1 is real, reproduced exactly on the built frontend. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L68]] "**S1 — From the 75th throwing parse in one process the web-tree-sitter module" [[ran]] `cd $S && node s1.mjs $S/build-ff99487/middleware/context-oracle/ctxoracle` → `bash throw 75 … ts: RuntimeError: memory access out of bounds` / `first ts failure after bash throw # 75`
- M1 is real (E-6, `m1.mjs`: `imports: true, resolved: 0, unresolved: 0` for a fallback file with two imports).
- M2 is real by reading: `version` omits the extraction code (E-19), and B8b settled the digest fix. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L146]] "**M2 — A frontend's `version` covers its queries, the package versions and a"
- M3 is real (E-15: `["fetchData","Example"]` from Markdown, `["listProjects"]` from a binary).
- M4 is real. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L192]] "**M4 — The redactor's high-entropy rule deletes real identifiers: 70 symbol" Executed: `T11_DiscoveryWorkflowTests "[redacted:high_entropy]"` (E-16).
- M5 is real. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L219]] "**M5 — The injection-suspect flag cannot fire on any symbol name.**" Executed: `ignore_previous_instructions false` (E-16).
- m4 is real (E-29: `logging` → `unresolved`); m10 is real (E-19: removing the discard survives all 52 tests); m9 is real by reading (E-19: no ERROR-tree check); m1, m2 (E-7, `.d.ts` re-executed: `5.9.3 tsr/src/types.d.ts`), m3, m5–m8, m11 rest on the review's executions and on code that is unchanged at `HEAD`.
- The review judged the Python rule as holding, including its external test. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L349]] "| `resolvePythonImport`: PEP 328 levels; the ancestor lookup; `external` only when no in-repo top-level name | **Holds** |"
- It judged the Lua seed removal as holding. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L356]] "| `.lua=lua` removed from the seed; 31 grammars | **Holds** | T-15-6 compares the seeded table with the 31 (M54). |"
- It noticed the `sys.path[0]` misnaming and still called the rule sound. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L274-L277]] "The plan calls the ancestor walk \"Python's `sys.path[0]` rule\". `sys.path[0]` is the script's own directory only; the ancestors stand for project roots placed on `sys.path` by `-m`, pytest or an installed package. The rule is a sound heuristic, but the sentence should say so."
- What followed on the branch: `64f46fd` changes the architecture for M3 and M4 only (its message names only "M3" and "M4"). No later commit touches `ctxoracle/src` (`git diff --stat 64f46fd HEAD -- middleware/context-oracle/ctxoracle` is empty), and `docs/STATUS.md` was last rewritten at `fbb9052`, before Step 15: [[middleware/context-oracle/docs/STATUS.md@HEAD:L328]] "`SKELETON:` marks — next is Step 15 (the language frontends). For each step:"
**Standard:** CLAUDE.md: [[middleware/context-oracle/CLAUDE.md@HEAD:L228-L230]] "When a review surfaces findings, apply every finding that holds up. Check each against the source first; a finding you find wrong is rejected with the evidence, on the record — never silently dropped, never a convenient subset." A review record is written once, never edited (CLAUDE.md routing table).
**Reasoning:**
1. Every finding checked here holds. The review's executions reproduce, and its S1 and M1 are the most serious defects in the Step 15 code.
2. Disposition at `HEAD`, finding by finding:
   - S1 (module poisoning at 75 throws; fallback files never retried): open. Not applied, not rejected on the record.
   - M1 (fallback files missing from the unresolved share): open, not addressed.
   - M2 (`version` misses the extraction code): open, not addressed.
   - M3 (false generic symbols): applied in the architecture only (`64f46fd`, E-38). Plan and code unchanged, so open in the code.
   - M4 (entropy rule strips identifiers; tuned thresholds ignored): applied in the architecture only (E-39). Code open.
   - M5 (injection flag cannot fire on names): open, not addressed.
   - m1–m11: all open, none applied or rejected on the record.
3. So S1, M1, M2, M5 and all eleven minor findings (fifteen of seventeen) are silently dropped at `HEAD`: no record rejects them, STATUS does not list them, and no fix exists. Only M3 and M4 moved, and only in the architecture.
4. The review itself has three misses:
   - It judged the Python external test as holding when it contradicts AD-12's external class and the batch 4 ruling (E-29, executed).
   - It judged the Lua exclusion as holding without asking for its cause (E-1).
   - It saw that `sys.path[0]` is misnamed and kept "sound heuristic" without a false-edge analysis.
5. Its M60 "plan silence" is settled by the handbook and batch 4 (E-7, E-36).
**Alternatives:** The correct follow-up was a record that takes each finding: applied (with the fix and its test), or rejected with evidence. That did not happen for fifteen of seventeen.
**Consequences:** The open findings are listed as still present at `HEAD` in E-6, E-15, E-16, E-19, E-27 and E-29. The review file is not edited; a later review record must state its three misses and the dispositions.
**Verdict:** replace — the findings are real and stand; a later review record must correct the two "Holds" rows (Python external test, Lua exclusion) and the M60 classification, and every finding except M3 and M4 needs an on-record disposition, since none was applied or rejected.
**Would be wrong if:** a commit or record on this branch after `ff99487` applied or rejected S1, M1, M2, M5 or m1–m11 (none touches `ctxoracle/src`, and STATUS predates the review).

### E-38
**Units:** B9-70-64f46fd-docs/architecture-phase-a.md#h1
**Question:** In response to the review's M3 (three quarters of the generic frontend's symbols came from Markdown and binary files), AD-12 now limits generic symbol extraction to code: a file with a NUL byte in its first 8 KB is binary, and prose and data formats listed in a new tuning row `index.generic_no_symbol_exts` get path tokens only. Is the rule correct and complete?
**Facts:**
- The rule. [[middleware/context-oracle/docs/architecture-phase-a.md@64f46fd:L1393-L1397]] "It extracts symbols only from text files that are code: a file with a NUL byte in its first 8 KB is binary and gets path tokens only, and prose and data formats (Markdown, reStructuredText, plain text, JSON, YAML, CSV and similar, listed in the tuning row `index.generic_no_symbol_exts`) get path tokens only."
- The inserted text breaks the paragraph's following sentence. [[middleware/context-oracle/docs/architecture-phase-a.md@64f46fd:L1401-L1402]] "code (P4). The rule means (C-6: adding a language = adding a grammar file or a config row, never a redesign)."
- git's binary test reads the first 8000 bytes, not 8 KB. [[https://raw.githubusercontent.com/git/git/master/xdiff-interface.c]] "#define FIRST_FEW_BYTES 8000"
- The problem is real (E-15, executed; the review's count on this repository).
- The list is a deny-list ("and similar"): an unlisted text extension (for example `.log`, `.ini`, `.xml`, `.svg`) still gets symbols. The alternative the review offered, an allow-list of extensions the generic frontend extracts from, is not discussed.
**Standard:** P4 (false symbols poison pointers); C-6 (no language invisible; adding one is configuration); the brief's criterion 5 (why this choice beats the alternatives); CLAUDE.md engineering standard, "Numbers without sources don't go in."
**Reasoning:**
1. The finding was real and the direction is right: prose and binary files must not produce code symbols.
2. The NUL-byte test is the established binary heuristic (git's), but the 8 KB figure has no source and differs from git's 8000. It should cite git and use its number, or give its own reason.
3. The deny-list serves C-6 (an unlisted code language, such as `.ps1`, still gets generic symbols). But it leaves false symbols from every unlisted prose or markup format. The trade-off between the two lists is the decision, and it is not stated. "And similar" leaves the list's contents to the plan writer.
4. The sentence after the insertion no longer reads ("The rule means (C-6: …)"), so the C-6 statement it carried is garbled.
**Alternatives:** State the list's contents and why a deny-list beats an allow-list (C-6's no-invisible-language reason), with the miss direction (unlisted prose formats still produce symbols). Cite git's 8000-byte test. Repair the broken sentence.
**Consequences:** No plan or code change follows on this branch, so the generic frontend at `HEAD` still extracts from prose and binary files (E-15).
**Verdict:** replace — keep the rule's direction and the NUL-byte test; source the byte count (git's 8000), enumerate the deny-list and state why it beats an allow-list, and repair the broken C-6 sentence.
**Would be wrong if:** the plan or a later architecture line already enumerated `index.generic_no_symbol_exts` and compared it with an allow-list (none does on this branch).

### E-39
**Units:** B9-70-64f46fd-docs/architecture-phase-a.md#h2, B9-70-64f46fd-docs/architecture-phase-a.md#h3
**Question:** In response to the review's M4 (the entropy heuristic redacted 70 real declaration names; the indexer ignored the tuned thresholds), AD-19 now says a captured declaration name gets the pattern rules only, and the entropy heuristic runs with the tuned `security.entropy_*` values wherever it runs. L5 records the residual risk. Is this correct?
**Facts:**
- [[middleware/context-oracle/docs/architecture-phase-a.md@64f46fd:L2123-L2126]] "**An identifier is not free text:** a symbol name the parser captured as a declaration name gets the pattern rules only, never the entropy heuristic, and the entropy heuristic runs with the tuned `security.entropy_*` values wherever it runs."
- The residual risk. [[middleware/context-oracle/docs/architecture-phase-a.md@64f46fd:L2952-L2954]] "A secret written as a declaration name gets only the pattern rules (AD-19: identifiers are not free text)."
- The problem is real: `T11_DiscoveryWorkflowTests` → `[redacted:high_entropy]` (E-16, executed), and the redactor falls back to the literal 4.0 when no threshold is passed (`redact.ts` L51 at `HEAD`).
- Established practice applies entropy to string literals, not identifiers. Yelp's `detect-secrets` high-entropy plugin: [[https://raw.githubusercontent.com/Yelp/detect-secrets/master/detect_secrets/plugins/high_entropy_strings.py]] "We require quoted strings to reduce noise."
- The spec's requirement is redaction before storage (FR-X1, spec L310); it names no entropy rule.
**Standard:** FR-X1 and T3; established secret-scanner practice (quoted); §7's tuning convention (no fallback literal in a consumer).
**Reasoning:**
1. The problem was real, and it silenced facts about real code.
2. The fix follows established practice: high-entropy detection is a string-literal heuristic, because identifiers are high-entropy by nature. The named-pattern rules still run on names, so a key-shaped identifier is still caught.
3. Requiring the tuned values wherever entropy runs removes the hidden literal fallback the review found.
4. The residual (a secret used as a declaration name) is stated in L5, bounded by pointer-only composition. That meets FR-X1's intent without false positives on code.
5. Both backings (the executed defect and the scanner's documented practice) support this decision, not a neighbouring one, and it conflicts with no spec line.
**Alternatives:** Word-splitting identifiers before measuring entropy (the review's other option) keeps a heuristic that still misfires on long compound names, with no source that it is better. The chosen rule is simpler and matches practice.
**Consequences:** Architecture only. The indexer at `HEAD` still calls `redact(s.name)` with no options (E-16), so the defect is present in the code until the plan and build follow.
**Verdict:** keep — identifiers get the pattern rules, entropy uses the tuned values, and the residual is stated; backed by the executed defect and secret-scanner practice.
**Would be wrong if:** a secret-scanning standard were shown to require entropy checks on identifiers, or a planted secret in the spec's adversarial fixture (FR-X8) were identifier-shaped and unpatterned.

