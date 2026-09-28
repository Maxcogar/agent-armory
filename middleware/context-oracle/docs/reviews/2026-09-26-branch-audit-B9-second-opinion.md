# Branch audit — batch 9 (Step 15, the language frontends): second opinion

This file is the second opinion on
`middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B9.md` (E-1 to E-39). It judges
the eleven keeps (E-4, E-5, E-10, E-11, E-12, E-13, E-20, E-22, E-25, E-31, E-39) and six of
the replaces (E-1, E-2, E-16, E-19, E-29, E-37). The test applied is the auditor brief
(`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`).
This auditor wrote neither the changes nor the first audit. Settled and not re-litigated: the
B1–B7 verification files, the coordinator rulings of 2026-09-28, and the batch 8 files
(provisional). The coordinator verified that `tree-sitter-lua` 2.1.3's npm `gitHead` is
`6b02dfd7f07f36c223270e97eb0adf84e15a4cef`, that its `src/scanner.c` is byte-identical to
master, and that `HEAD`'s ctxoracle source equals `64f46fd`'s.

**How the work was done.**
- `$W` = `/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/b9so`,
  this auditor's own scratch. `$B` = `$W/b-ff99487/middleware/context-oracle/ctxoracle`, made
  with `git archive ff99487 middleware/context-oracle/ctxoracle | tar -x -C $W/b-ff99487`, this
  checkout's `ctxoracle/node_modules` symlinked in, built with `npx tsc -p tsconfig.json`.
  (`ff99487`'s ctxoracle source is `feb37c9`'s plus the review's test file.) A second
  extraction of `bfe963f` was built the same way.
- Planted faults: `$W/mutn.py $B <edits.json> <tests>` copies `$B`, applies each exact string
  replacement (each must match once), and runs the named compiled test files with `node --test`,
  every `GIT_*` variable removed. KILLED means a subtest failed. Baseline over the nine Step 15
  test files (`tree_sitter_frontend`, `tree_sitter_frontend_fallback`, `generic_frontend`,
  `import_resolvers`, `indexer_frontends`, `frontend_capabilities`, `indexer_walk`,
  `search_semantics`, `frontends_review`; "the nine" below): `SURVIVED pass=52 fail=0 []`.
- Grammar sources are the packaged versions, not master. `tree-sitter-wasms` 0.1.13's npm
  `gitHead` is `3e88dc9e36b4e8bf752ce53bea61e4b67282a2bb`. Its `pnpm-lock.yaml` at that commit,
  fetched with `curl`, gives the version each WASM was built from. Each npm grammar was fetched
  with `npm pack <name>@<locked version>` into `$W/gr/`. The three GitHub-pinned grammars
  (`dart`, `rescript`, `vue`) were fetched from `raw.githubusercontent.com` at the locked commit.
- `web-tree-sitter` 0.25.10: `ctxoracle/node_modules/web-tree-sitter/lib/parser.c` is
  byte-identical to upstream tag `v0.25.10` (`cmp` of the `curl`ed
  `lib/src/parser.c` → `IDENTICAL`). For the causal experiments the package was copied to
  `$W/wts/web-tree-sitter/`. Its `tree-sitter.js` was patched in one place, the side-module
  import proxy. With a global flag set, it hands the grammar being loaded a `malloc` (or
  `calloc`) wrapper that fills the returned block with a chosen byte. A second patch exposes
  the module's `__stack_pointer` global. The original package was never modified.
- Web sources were fetched with `curl` and read as text; every quote below is from that text.

### E-1
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that the defect is real, that it
is silent, that the exclusion routes around it, and that recording `.lua` as `unknown` hides it.
Disagree on three points.
1. The root cause was inferred, not proven. It was read from the scanner and supported by a
   control that is a different grammar (`@tree-sitter-grammars/tree-sitter-lua` 0.4.1 has a
   different grammar, lexer and scanner). That control shows a Lua grammar can work. It does not
   show that the uninitialised state is what breaks 2.1.3. The experiment that isolates the cause
   is to zero the scanner's allocation in 2.1.3 itself and change nothing else. Done here: 19 of
   24 parses err as shipped and 0 of 24 with the allocation zeroed. The cause now stands as
   proven.
2. Reasoning step 3, "the defect is in one grammar build", is false. `tree-sitter-swift` 0.4.3, a
   table grammar, has the same defect class: its `create` is `calloc(0, sizeof(struct
   ScannerState))`, a zero-byte request, so its 4-byte state is never initialised. It shows the
   same symptom: a valid raw string (`#"text"#`) parses clean first and returns an ERROR tree from
   the second parse on. Zeroing the block removes it, and a garbage byte brings it back. The same
   probe-20 rule, with only swift's sample changed to a valid raw string, reports "not usable:
   lua; swift". So the usability rule the exclusion rests on depends on which sample was chosen,
   and the 31-grammar table the architecture states is not error-free on repeated parses. Every
   other table grammar with an external scanner initialises its state at the packaged version
   (19 read; `dart`, `c_sharp`, `css`, `elixir`, `javascript`, `rust`, `scala`, `toml`,
   `typescript` and `tsx` keep no state).
3. The preferred alternative, as written, conflicts with C-3 and AD-25. That alternative is to
   "ship the `lua` grammar from `@tree-sitter-grammars/tree-sitter-lua`". As an npm dependency,
   0.4.1 brings three conflicts:
   - an `install` script (`node-gyp-build`);
   - two native-build dependencies;
   - six prebuilt `.node` binaries.
   AD-25 fixes the runtime dependencies at exactly two. The corrected alternative is to vendor
   its `tree-sitter-lua.wasm` (MIT, 49,488 bytes; ABI 15 and `dylink.0`, and both load under
   0.25.10), which needs an AD-25 amendment and a licence notice. Or rebuild 2.1.3 with an
   initialising `create`. The length-0 reset in `deserialize` that the first audit also asks for
   is good practice, but the experiment shows it is not needed for this defect: zeroing at
   `create` alone removes every ERROR tree. The "Would be wrong if" line also misses the
   packaging constraint.

Minor: the scanner facts cite master. The coordinator verified master byte-identical to 2.1.3,
so the quotes hold, but the backing belongs on the packaged source.
**Evidence:**
- The architecture records the symptom only. [[middleware/context-oracle/docs/architecture-phase-a.md@059dc86:L1387-L1388]] "`lua` loads but, after its first parse in a process, returns ERROR trees for valid source without throwing"
- The usability rule and the promise the fix needs. [[middleware/context-oracle/docs/architecture-phase-a.md@059dc86:L2944-L2945]] "a usable grammar is one that parses valid source correctly on repeated parses, not once." and [[middleware/context-oracle/docs/architecture-phase-a.md@059dc86:L2946-L2947]] "the ext→grammar config absorbs individually-shipped grammar WASMs without redesign (C-6)"
- The WASM is built from 2.1.3, and swift's from 0.4.3. [[ran]] `npm view tree-sitter-wasms@0.1.13 gitHead` → `3e88dc9e36b4e8bf752ce53bea61e4b67282a2bb`; [[https://raw.githubusercontent.com/Gregoor/tree-sitter-wasms/3e88dc9e36b4e8bf752ce53bea61e4b67282a2bb/pnpm-lock.yaml]] "tree-sitter-lua: specifier: ^2.1.3 version: 2.1.3" and [[https://raw.githubusercontent.com/Gregoor/tree-sitter-wasms/3e88dc9e36b4e8bf752ce53bea61e4b67282a2bb/pnpm-lock.yaml]] "tree-sitter-swift: specifier: ^0.4.0 version: 0.4.3"
- The packaged 2.1.3 scanner allocates without initialising and restores only on length 2. [[ran]] `tar -xzOf $W/gr/tree-sitter-lua-2.1.3.tgz package/src/scanner.c | sed -n '53p;71p'` → `  return malloc(sizeof(struct ScannerState));` / `  if (length == 2)`
- The runtime creates the scanner inside every parse. For a grammar loaded into web-tree-sitter the non-WASM-store path runs, which calls the scanner's own `create`/`destroy`. [[https://raw.githubusercontent.com/tree-sitter/tree-sitter/v0.25.10/lib/src/parser.c]] "ts_parser__external_scanner_create(self);" and [[https://raw.githubusercontent.com/tree-sitter/tree-sitter/v0.25.10/lib/src/parser.c]] "void ts_parser_reset(TSParser *self) { ts_parser__external_scanner_destroy(self);" and [[https://raw.githubusercontent.com/tree-sitter/tree-sitter/v0.25.10/lib/src/wasm_store.c]] "bool ts_language_is_wasm(const TSLanguage *self) { (void)self; return false; }"
- The scanner documentation promises one `create` per `setLanguage`, which is not what 0.25.10 does. [[https://raw.githubusercontent.com/tree-sitter/tree-sitter/master/docs/src/creating-parsers/4-external-scanners.md]] "It will only be called once anytime your language is set on a parser."
- Reproduced, and the cause isolated. `$W/luaexp.mjs` loads a grammar through the given `web-tree-sitter` directory. It parses six valid sources with one `Parser`, then the same six with three fresh `Parser`s (24 parses). With flag `1` the patched runtime zeroes every block `malloc` returns to this grammar. [[ran]] `node $W/luaexp.mjs <ctxoracle>/node_modules/web-tree-sitter <ctxoracle>/node_modules/tree-sitter-wasms/out/tree-sitter-lua.wasm 0` → `first ERROR tree: "print(1)\n" (chunk (call function: (variable name: (identifier)) (ERROR (number)) arguments: (argument_list (string (MISSING _string_end)))))` / `ok ok ERROR ERROR ERROR ERROR ERROR ok ERROR ERROR ERROR ERROR ERROR ok ERROR ERROR ERROR ERROR ERROR ok ERROR ERROR ERROR ERROR` / `errors 19 of 24`; `node $W/luaexp.mjs $W/wts/web-tree-sitter <same wasm> 0` → `errors 19 of 24` (control); `node $W/luaexp.mjs $W/wts/web-tree-sitter <same wasm> 1` → `abi 13 zero 1 mallocCallsThroughWrapper 24` / `errors 0 of 24`. That is one `malloc` per parse, which is the create-per-parse lifecycle, observed.
- The replacement grammar is clean under the pin. [[ran]] `node $W/luaexp.mjs <ctxoracle>/node_modules/web-tree-sitter $W/gr/tree-sitter-grammars-tree-sitter-lua-0.4.1/package/tree-sitter-lua.wasm 0` → `abi 15 zero 0 mallocCallsThroughWrapper n/a` / `errors 0 of 24`
- Swift carries the same defect. [[ran]] `tar -xzOf $W/gr/tree-sitter-swift-0.4.3.tgz package/src/scanner.c | grep -n "length < 4\|calloc(0"` → `232:    return calloc(0, sizeof(struct ScannerState));` / `259:    if (length < 4) {`
- Swift's symptom. [[ran]] `node $W/sw1.mjs` (one `Parser`, the shipped `tree-sitter-swift.wasm`) → `"let r = #\"raw text\"#\n" ok` / `"let r = #\"raw text\"#\n" ERROR (source_file (property_declaration [trimmed] (ERROR (UNEXPECTED '"')) value: (line_string_literal [trimmed])) (ERROR (UNEXPECTED '\n')))` / `"let a = \"x\"\n" ok` / `"let r = #\"raw text\"#\n" ERROR [trimmed]`
- Swift's cause. `$W/swexp.mjs` runs 200 swift parses of 5 sources, a different grammar parsed before each; with an argument, the patched runtime fills the first 4 bytes of each `calloc` block with that byte. [[ran]] `node $W/swexp.mjs <ctxoracle>/node_modules/web-tree-sitter` → `swift parses 200 ERROR trees 80` (both raw-string sources); `node $W/swexp.mjs $W/wts/web-tree-sitter 0` → `calloc calls via wrapper 200 swift parses 200 ERROR trees 0`; `[trimmed] 1` → `ERROR trees 80`; `[trimmed] 255` → `ERROR trees 80`
- The usability rule depends on the sample. [[ran]] `PROBE_LAYOUT=$W/layout node $W/probe20.mjs` (probe 20 at `42653ae`) → `[trimmed] error-free on every parse: 31; not usable: lua (ERROR/MISSING)`; `PROBE_LAYOUT=$W/layout node $W/probe20_swiftraw.mjs` (the same probe, swift's sample only changed to `func answer() -> String {\n    return #"forty-two"#\n}`) → `[trimmed] error-free on every parse: 30; not usable: lua (ERROR/MISSING); swift (ERROR/MISSING)`
- The other table scanners initialise their state at the packaged version. [[ran]] `tar -xzOf $W/gr/<pkg>.tgz <scanner> | grep -A3 _external_scanner_create` over the locked versions → `cpp` `calloc(1, sizeof(Scanner))`, `html` `ts_calloc(1, [trimmed])`, `kotlin` `ts_calloc(1, sizeof(Stack))`, `python` `calloc(1, sizeof(Scanner))`, `ruby` `calloc(1, [trimmed])`, `ocaml` `calloc(1, [trimmed])`, `php` `ts_calloc(1, [trimmed])`, `vue` `calloc(1, [trimmed])`, `rescript` `malloc` then `memset(state, 0, [trimmed])`, and `tlaplus` sets every field in `scanner_create`; `c_sharp`, `css`, `elixir`, `javascript`, `rust`, `scala`, `toml`, `typescript`, `tsx` and `dart` `return NULL`.
- Keeping the row names the language. [[ran]] `node $W/luarow.mjs $B $W/work` → `row .lua=lua: false | files.lang: unknown | caps keys: unknown | caps.lua: undefined | faults: 0` / `row .lua=lua: true | files.lang: lua | caps keys: lua | caps.lua: {"frontend":"generic","symbols":true,"imports":false,"resolved":0,"unresolved":0,"files":1} | faults: 0`
- The replacement's npm package breaks the packaging rules. [[ran]] `tar -xzOf $W/gr/tree-sitter-grammars-tree-sitter-lua-0.4.1.tgz package/package.json | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['scripts']['install'], d['dependencies'], d['license'])"` → `node-gyp-build {'node-addon-api': '^8.5.0', 'node-gyp-build': '^4.8.4'} MIT`; `tar -tzf $W/gr/tree-sitter-grammars-tree-sitter-lua-0.4.1.tgz | grep -c "\.node$"` → `6`. [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L2547-L2549]] "runtime deps exactly `web-tree-sitter` + `tree-sitter-wasms`, **no postinstall scripts, no native code, no prebuilt-binary downloads**"
**Correct verdict:** replace. Record the cause, now proven: the scanner reads state it never initialised, and the 0.25.10 runtime creates a scanner per parse. Keep Lua structural through a vendored `@tree-sitter-grammars/tree-sitter-lua` WASM (with an AD-25 amendment) or a rebuilt, initialising 2.1.3. Treat `swift` the same way. Report any exclusion per language, never as `unknown`.

### E-2
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree that each hunk restates E-1's
exclusion, and that §11.4's "depends on heap state" line was a lead the plan did not follow.
Disagree on two points.
1. What the plan should "keep". The first audit keeps the repeated-parse, ERROR/MISSING rule as
   the grammar-usability criterion, and cites its own 40-round stress run in which "all 31
   remaining grammars" pass. Both only show that the chosen samples parse. They cannot certify a
   grammar. Swift is in the 31. It errs on the second and later parses of any valid raw string,
   and the same probe with a raw-string sample drops it (E-1). So the plan's sentence that the 31
   parse "valid source error-free on every repeated parse" is false as stated, and T-38-33 would
   pass a defective table.
2. The correction needs two more parts than the first audit lists:
   - A cause-level check at plan time: read each shipped scanner's `create` and `deserialize`
     for uninitialised state, as E-1 does.
   - The per-file runtime ERROR-tree signal (review m9), because no sample set proves a grammar
     clean.

The rest of the replacement stands: drop `lua` from T-38-33's excluded list and R6, and record
any exclusion per language.
**Evidence:**
- The plan's claim about the 31. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L4180-L4181]] "31 grammars the pinned runtime loads and parses valid source error-free on every repeated parse"
- T-38-33 fails only on an ERROR tree for its own samples, or on an excluded grammar in the table. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L7119-L7120]] "returning a tree with an ERROR/MISSING node, or on an excluded grammar (§4: `elm`, `ql`, `yaml`, `bash`, `lua`) appearing in the table"
- The clue the plan recorded and did not follow. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L10355-L10357]] "err depends on heap state — its first is clean when it is parsed right after its own load early in a process"
- The probe's swift sample has no raw string. [[ran]] `grep -n "swift" $W/probe20.mjs` (probe 20 at `42653ae`) → `76:  swift: 'import Sibling\n\nfunc answer() -> Int {\n    return 42\n}\n',`
- With a valid raw-string sample the same probe rejects swift. [[ran]] `PROBE_LAYOUT=$W/layout node $W/probe20_swiftraw.mjs` → `candidates (32 grammars; all loaded, then each valid sample parsed 3 times with a fresh Parser each and once more after every other grammar has parsed): error-free on every parse: 30; not usable: lua (ERROR/MISSING); swift (ERROR/MISSING)`
- The swift cause, isolated (E-1): [[ran]] `node $W/swexp.mjs $W/wts/web-tree-sitter 0` → `ERROR trees 0`; `node $W/swexp.mjs <ctxoracle>/node_modules/web-tree-sitter` → `ERROR trees 80`
**Correct verdict:** replace. Replace the Lua exclusion with the cause and a working grammar, as the first audit says. Also correct the claim that the 31 grammars are error-free on every repeated parse (swift is not), add a plan-time scanner-initialisation check, and add the runtime per-file ERROR-tree signal. The sample check stays as a build check only, not as proof that a grammar is usable.

### E-4
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. The build changes both files, the
declaration names both, and the table rows sit inside the generator's region. My attempt to
break the keep was to run the generator's own check on the plan at this commit. A stale region
or an undeclared file would fail it, and it passes. `tuning_seeds.ts` is edited under any
correct Lua decision, whether the row is removed, kept with a recorded exclusion, or pointed at
a replacement grammar. The same holds for swift (E-1).
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L4154]] "modify: [middleware/context-oracle/ctxoracle/src/index/indexer.ts, middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L513]] "<!-- generated:files begin -->" and [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L881]] "<!-- generated:files end -->"; [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L640]] "| middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts | modify | S15 |"
- [[ran]] `git archive 42653ae middleware/context-oracle/docs/plans middleware/context-oracle/.claude/skills/expert-plan/scripts | tar -x -C $W/pc/42653ae && cd $W/pc/42653ae/middleware/context-oracle && node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check docs/plans/plan-phase-a.md` → `OK: 40 steps, 13 elements, 165 test specs, 27 probes cited, regions current`, exit 0
- [[ran]] `git show bfe963f --stat | grep -E "indexer.ts|tuning_seeds"` → `.../context-oracle/ctxoracle/src/index/indexer.ts  |  43 +-` / `.../ctxoracle/src/stores/dao/tuning_seeds.ts       |   9 +-`
**Correct verdict:** keep. The declaration names the two files Step 15 changes, and the generated rows follow from it.

### E-5
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. The old name matches no shipped file,
and the new one matches all 36. My attempt was to plant the old path in the built frontend. The
tree-sitter tests then fail, so the path is load-bearing and the correction is what makes it
load. The first audit's note that the path is fixed to one package is a separate loader gap
(E-1's fix needs a per-grammar path). It is not a flaw in this correction.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@059dc86:L4146]] "`LanguageFrontend` by loading the grammar `tree-sitter-wasms/out/<lang>.wasm`" and [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L4164]] "`LanguageFrontend` by loading the grammar `tree-sitter-wasms/out/tree-sitter-<lang>.wasm`"
- [[ran]] `ls ctxoracle/node_modules/tree-sitter-wasms/out | wc -l` → `36`; `ls ctxoracle/node_modules/tree-sitter-wasms/out | grep -vc '^tree-sitter-.*\.wasm$'` → `0`
- [[ran]] `python3 $W/mutn.py $B $W/plants/e5_oldpath.json tree_sitter_frontend frontend_capabilities` (in `dist/src/index/tree_sitter_frontend.js`, `tree-sitter-wasms/out/tree-sitter-${lang}.wasm` → `tree-sitter-wasms/out/${lang}.wasm`) → `KILLED pass=1 fail=3 ["T-15-6: every frontend defaultFrontends returns declares what it does", "T-15-1: parse yields each file’s symbol with a span that addresses it, and captures ./util.js", "T-15-1: runIndex with the TypeScript frontend writes the symbols rows with their spans and an import_edges row src/app.ts → src/util.ts"]`
**Correct verdict:** keep. The corrected file name is the one every shipped grammar has.

### E-10
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree, with one overstatement that does not
change the verdict. "The only way" is too strong: any writer that stores the member before the
reader exists would do. What matters is the ordering, and my plants confirm it on both sides:
- the member added after the reader has read the list is not seen, and the precondition fails;
- removing the row, or disabling the fallback, also fails the test.

So the setup exercises the real fallback path, and its preconditions catch a bypass. The
defects E-27 finds (no "exactly one" check, a reuse clause that cannot fail) are in other
clauses, not in this setup.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12304]] "`node:sqlite` and a real global store; no doubles."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12314-L12315]] "only reads, and caches for its lifetime, so the member is added before the reader `runIndex` uses is built)"
- The reader caches lists. [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@bfe963f:L121-L123]] "function list(key: string): string[] { const cached = lists.get(key); if (cached !== undefined) return [...cached];"
- [[ran]] `MSG=1 python3 $W/mutn.py $B $W/plants/e10_rowAfterReader.json tree_sitter_frontend_fallback` (in the compiled test, the `addToList` call moved after `tuningReader(global, 'fallback', () => { })` and one `t.list('index.ext_to_grammar')` read) → `["'precondition: the table maps .sh to bash'"]` / `KILLED pass=0 fail=1 ["T-15-4: a throwing parse falls back to the generic frontend with frontend_parse_failed; the next file gets a fresh parser"]`
- [[ran]] `python3 $W/mutn.py $B $W/plants/e10_noRow.json tree_sitter_frontend_fallback` (the `addToList` line removed) → `KILLED pass=0 fail=1`
- [[ran]] `MSG=1 python3 $W/mutn.py $B $W/plants/e10_noFallback.json tree_sitter_frontend_fallback` (in `dist/src/index/indexer.js`, `if (fe !== generic && generic !== undefined && !disabled.has(generic))` → `if (false)`) → `["'a_case.sh lacks its generic-frontend symbols row (first); has []'"]` / `KILLED pass=0 fail=1`
**Correct verdict:** keep. The setup makes T-15-4 exercise the real fallback path, and its preconditions fail when that path is bypassed.

### E-11
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree, and confirmed both ways by planting.
A Python resolver that also tries `.ts` is caught by the new cell (`m2.ts` present). The same
resolver passes when the old datum (`m.ts`) is put back. So the old cell could not fail, and
the new one can.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12384-L12387]] "`pkg/sub/m2.ts` present but `.m2` absent (unresolved, never `.ts` — the present file is `m2.ts`, so a resolver that tried `.ts` would resolve it and the cell would catch it"
- [[middleware/context-oracle/ctxoracle/test/unit/import_resolvers.test.ts@HEAD:L54]] "const PY_REPO = repoFiles(['pkg/sub/u.py', 'pkg/sub/m.py', 'pkg/n/__init__.py', 'pkg/sub/m2.ts'], []);"
- [[ran]] `python3 $W/mutn.py $B $W/plants/e11_pyTriesTs.json import_resolvers` (in `dist/src/index/resolvers.js`, `return [`${mod}.py`, `${mod}/__init__.py`];` → the same plus `` `${mod}.ts` ``) → `KILLED pass=5 fail=1 ["T-15-5: resolvePythonImport from pkg/sub/u.py classifies every cell of the table (never a .ts file)"]`
- [[ran]] `python3 $W/mutn.py $B $W/plants/e11_oldCell_pyTriesTs.json import_resolvers` (the same resolver fault, and the test's `'pkg/sub/m2.ts'` put back to `'pkg/sub/m.ts'`) → `SURVIVED pass=6 fail=0 []`
**Correct verdict:** keep. The cell now fails for the cross-language resolver it exists to catch; the old datum could not.

### E-12
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. Re-executed: the shipped grammar
turns `` `include `` into an ERROR node, and the sample without it parses clean. My attempt to
break the keep was to ask whether dropping the import leaves T-15-6 unable to fail for
`systemrdl`. Two answers:
- SystemRDL has no import form the grammar parses, so no query could capture one. The "yields
  no import" check loses nothing it could ever see.
- T-15-6 still fails if `systemrdl` declared `imports: true`. I planted a resolver for it, and
  T-15-6 fails.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L12398-L12400]] "file inclusion is the `` `include `` preprocessor directive and the shipped grammar cannot parse it (an ERROR node, executed)"
- [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@bfe963f:L285-L290]] "const RESOLVERS: Record<string, ImportResolver> = { typescript: resolveTsImport, tsx: resolveTsImport, javascript: resolveTsImport, python: resolvePythonImport, };"
- [[ran]] `node $W/rdl.mjs` → `` "`include \"sibling.rdl\"\na" hasError true (source_file (ERROR (UNEXPECTED '`') `` (trimmed) / `"addrmap answer {\n  reg {" hasError false`
- [[ran]] `python3 $W/mutn.py $B $W/plants/e12_rdlImports.json frontend_capabilities` (`systemrdl: resolvePythonImport,` added to the compiled `RESOLVERS`) → `KILLED pass=0 fail=1 ["T-15-6: every frontend defaultFrontends returns declares what it does"]`
**Correct verdict:** keep. The exception is executed, and T-15-6 still fails on a `systemrdl` capability lie.

### E-13
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. The diff changes only the call and
adds a comment in each verb. The argument is the reader each verb already builds, which is the
signature the plan states. My attempt was to plant the old two-argument call into
`cli/index.ts` of the `bfe963f` extraction: `tsc` rejects it. So the edit is the minimal one the
new signature forces, and it reaches no further.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/cli/index.ts@bfe963f:L31]] "frontends: defaultFrontends(tuning)," and [[middleware/context-oracle/ctxoracle/src/cli/init.ts@bfe963f:L48]] "frontends: defaultFrontends(tuning),"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@bfe963f:L4214]] "exporting `defaultFrontends(tuning: TuningReader): LanguageFrontend[]` — one" and [[middleware/context-oracle/docs/plans/plan-phase-a.md@bfe963f:L4217]] "(Step 28) and `init` (Step 31) pass to `runIndex` (D-plan-29)."
- [[ran]] `git show bfe963f -- middleware/context-oracle/ctxoracle/src/cli/index.ts middleware/context-oracle/ctxoracle/src/cli/init.ts` → in each file, one `-      frontends: defaultFrontends(r.global, diag),` line replaced by `+      frontends: defaultFrontends(tuning),` plus two `+` comment lines; nothing else.
- [[ran]] `cd $W/b-bfe963f/middleware/context-oracle/ctxoracle && npx tsc -p tsconfig.json` → exit 0; with `src/cli/index.ts` L31 changed to `defaultFrontends(r.global, diag)` → `src/cli/index.ts(31,45): error TS2554: Expected 1 arguments, but got 2.`
**Correct verdict:** keep. It is the minimal call-site change the new signature requires, as the plan states it.

### E-16
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree on what this commit decided.
- The fallback does what h10 says.
- A fallback file of an `imports: true` language is counted nowhere in its share.
- It is never retried. Re-executed here: pass 2 writes nothing, and the fault is not
  re-recorded, so the gap outlives its one fault.

Disagree on the timeline for two of the four listed gaps. Untuned name redaction (L690) and the
raw-name `isSuspect` check (L794) are not `bfe963f` decisions:
- the same `redact(s.name)` call is at L675 of the parent, `42653ae`, and dates from the walking
  skeleton `0e457c7`;
- the same `isSuspect(s.name)` is at L779 of the parent, and dates from the Step 14 build
  `177e59f`, batch 8;
- `bfe963f` only renamed `fe` to `used` on the first line, and left the second untouched.

Both are real defects (review M4, M5; executed by the first audit). They are inherited Step 14
code, and belong in this entry's Consequences, not its verdict. No batch 8 file records them, so
they go to the correction pass as Step 14 findings.
**Evidence:**
- The fallback branch this commit added. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@bfe963f:L680]] "if (fe !== generic && generic !== undefined && !disabled.has(generic)) {"
- The two inherited lines, already in the parent commit. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@42653ae:L675]] "if (fe.capabilities.symbols) pf.symbols = parsed.symbols.map((s) => ({ ...s, name: redact(s.name).redacted }));" and [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@42653ae:L779]] "const symProv = repoSpanProv(pf.path, pf.pathSuspect || pf.symbols.some((s) => isSuspect(s.name)));"
- Where they came from. [[ran]] `git log --oneline -S "name: redact(s.name).redacted" -- middleware/context-oracle/ctxoracle/src/index/indexer.ts` → `0e457c7 context-oracle: walking skeleton Steps 14-15 (indexer, frontends, search) + gaps G11-G16`; `git log --oneline -S "isSuspect(s.name)" -- middleware/context-oracle/ctxoracle/src/index/indexer.ts` → `177e59f context-oracle: build Step 14, the structural indexer (unreviewed)`
- The share gap and no retry. `$W/fb.mjs` indexes one non-UTF-8 `y.py` (two imports, one `def`) twice with `defaultFrontends`. [[ran]] `env -u GIT_DIR node $W/fb.mjs $B $W/work` → `pass 1 result {[trimmed] "filesWritten":1 [trimmed]}` / `  lang_capabilities.python {"frontend":"tree-sitter","symbols":true,"imports":true,"resolved":0,"unresolved":0,"files":1}` / `  faults 1 symbols ["g"]` / `pass 2 result {[trimmed] "filesWritten":0 [trimmed]}` / `  lang_capabilities.python {"frontend":"tree-sitter","symbols":true,"imports":true,"resolved":0,"unresolved":0,"files":1}` / `  faults 1 symbols ["g"]`
- The fault text is also redacted with the built-in thresholds, on a line this commit left as it was. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@bfe963f:L676]] "parseFailures.push({ lang, path: p, error: redact(parsed.error).redacted.slice(0, ERROR_MAX_CHARS) });"
**Correct verdict:** replace. Keep the fallback and its fault. Count a fallback file in its language's share, and retry it on the next pass. Move the untuned `redact(s.name)` and raw-name `isSuspect` gaps to the Step 14 (skeleton/`177e59f`) findings where they originate.

### E-19
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree with every listed gap:
- no ERROR-tree signal;
- the `'unknown'` version fallback;
- a hand-assembled `version`;
- throw handling that fails at scale;
- a cached rejected `Parser.init()`;
- a discard that no test needs.

Each was re-checked here, and the discard mutant was re-planted: it survives all nine test
files. Disagree on three points.
1. The poisoning mechanism is now measured, and it changes the bound the fix needs. The module's
   `__stack_pointer` falls 864 bytes on every throw and is never restored: from 78224 at start
   to 12560 at the 76th throw, when the TypeScript parse fails. So the budget is spent per
   process, and it carries across passes in the process. "Bound throws per grammar per pass" is
   not enough; the bound must be per process. The number of throws also depends on the stack
   depth at each throw (76 in this script, 75 in the review's), so the fix must not rest on a
   fixed count. The review called its stack-pointer explanation "inference"; this measurement
   confirms it.
2. The ERROR-tree gap is live for a default-table grammar today, not only for partial trees.
   Swift returns an ERROR tree for every valid raw string after its first parse in a process
   (E-1), and the frontend returns `ok: true` with nothing recorded.
3. The `finally` block's empty `catch` around `tree?.delete()` is a swallowed error that the
   first audit counted as holding ("trees are deleted in `finally`"). It fires only after a
   parse that threw. It still needs a stated reason, or a fault, under the brief's fallback
   test.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@bfe963f:L420]] "tree = parser.parse(text);" and [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@bfe963f:L445]] "return { ok: true, symbols, imports: captured };"
- [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@bfe963f:L323]] "return 'unknown';" and [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@bfe963f:L302]] "parserInit ??= Parser.init();"
- The swallowed delete. [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@bfe963f:L452-L455]] "try { tree?.delete(); } catch { // A tree from a parser that then threw may not delete cleanly."
- [[ran]] `python3 $W/mut.py $B dist/src/index/tree_sitter_frontend.js "                discardParser();\n" "" <the nine>` → `SURVIVED pass=52 fail=0 []`
- The stack leak, measured. `$W/poison_sp.mjs` loads `bash` and `typescript` through `$W/wts/web-tree-sitter`, whose only extra patch exposes `___stack_pointer`. It throws the bash `case` parse once per round, each in a fresh `Parser`, then parses a TypeScript line in a fresh `Parser`. [[ran]] `node $W/poison_sp.mjs` → `initial stack_pointer 78224` / `after throw 1 stack_pointer 77360` / `after throw 2 stack_pointer 76496` / `after throw 25 stack_pointer 56624` / `after throw 50 stack_pointer 35024` / `after throw 75 stack_pointer 13424` / `after throw 76 stack_pointer 12560` / `first bash throw: TypeError: resolved is not a function` / `ts parse fails after bash throw # 76 RuntimeError: table index is out of bounds`; the unpatched package (`node $W/poison.mjs`) → `ts parse fails after bash throw # 76 RuntimeError: table index is out of bounds`
- The review's own wording. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L86]] "not help. The runtime saves and restores the wasm stack pointer only inside" and [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L89]] "which fits a fixed per-process budget (inference; the count is what was"
- The frontend reports success on swift's ERROR tree. [[ran]] `node $W/sw2.mjs` → `false (source_file (function_declaration [trimmed]` then `true (source_file (function_declaration [trimmed] (ERROR (UNEXPECTED '"')) [trimmed]` for the same source; `node $W/swfe.mjs $B` (the built `treeSitterFrontend('swift')`, same source) → `parse 1 {"ok":true,"symbols":["g","h"]}` / `parse 2 {"ok":true,"symbols":["g","h"]}` / `parse 3 {"ok":true,"symbols":["g","h"]}`
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B8b.md@HEAD:L139]] "define `version` as a content digest of the grammar, query, and frontend/resolver code rather than a hand-maintained string"
**Correct verdict:** replace. As the first audit says, with these changes:
- the throw budget is bounded per process (disable a grammar on its first throw for the life of the process, and retry its fallback files in a later process);
- the per-file ERROR-tree signal is required now (swift);
- the empty `catch` around `tree.delete()` gets a stated reason or a fault.

### E-20
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. My attempt used two faults of my own
beside the first audit's off-by-one. Both are killed by T-15-3 on these fixtures:
- dropping the imported name from `from . import mod`;
- classing the `@/util` alias external instead of unresolved.

A first alias plant, on the final `package.json` line, survived T-15-3. That does not weaken
the fixture: `@/util` never reaches that line, because `packageName` returns `null` for it and
the earlier branch returns `unresolved`. Planting that branch kills the alias clause.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@bfe963f:L359]] "{ path: 'pkg/use.py', content: 'from .mod import f\nfrom . import mod\n\n\ndef use():\n    return f() + mod.f()\n' },"
- [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@bfe963f:L396]] "{ path: 'src/alias.ts', content: \"import { h } from '@/util';\n\nexport function alias(): number {\n  return h();\n}\n\" },"
- [[ran]] `python3 $W/mutn.py $B $W/plants/e20_dropFromName.json indexer_frontends` (in `dist/src/index/tree_sitter_frontend.js`, `real.map((n) => prefix + n)` → `real.map((n) => prefix)`) → `KILLED pass=6 fail=1 ["T-15-3: pkg/use.py’s two import forms are each captured and each resolve to pkg/mod.py"]`
- [[ran]] `python3 $W/mutn.py $B $W/plants/e20_aliasBranchExternal.json indexer_frontends` (in `dist/src/index/resolvers.js`, ``        return UNRESOLVED; // e.g. `@/util` `` → `return EXTERNAL;`) → `KILLED pass=6 fail=1 ["T-15-3: on indexer-walk, the @/util alias import is counted unresolved in the typescript share"]`
- [[ran]] `python3 $W/mutn.py $B $W/plants/e20_aliasExternal.json indexer_frontends` (`? EXTERNAL : UNRESOLVED;` → `? EXTERNAL : EXTERNAL;`) → `SURVIVED pass=7 fail=0 []`; the branch it misses: `grep -n "e.g. \`@/util\`" $B/dist/src/index/resolvers.js` → `90:        return UNRESOLVED; // e.g. \`@/util\`, a tsconfig path alias` (line 90, before the final `package.json` line at 93)
**Correct verdict:** keep. The fixtures plant both PEP 328 forms and the alias, and wrong resolvers or captures fail on them.

### E-22
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. I planted four faults of my own; each
of T-15-2's failure conditions has a clause that kills one:
- the POSIX-form regex removed;
- the keyword-form regex removed;
- an import emitted;
- `symbols: false` declared.
**Evidence:**
- [[middleware/context-oracle/ctxoracle/test/unit/generic_frontend.test.ts@bfe963f:L29]] "for (const expected of ['greet', 'farewell']) assert.ok(names.includes(expected), `symbol ${expected} is missing (got ${JSON.stringify(names)})`);"
- [[ran]] `python3 $W/mutn.py $B $W/plants/e22_noPosixForm.json generic_frontend` (the `^\s*(${SH_NAME})\s*\(\s*\)\s*\{` pattern line removed) → `KILLED pass=1 fail=1 ["T-15-2: a .sh file with two functions yields both function-shape symbols and no import"]`
- [[ran]] `python3 $W/mutn.py $B $W/plants/e22_noKeywordForm.json generic_frontend` (the `^\s*function\s+(${SH_NAME})` pattern line removed) → `KILLED pass=1 fail=1 ["T-15-2: a .sh file with two functions yields both function-shape symbols and no import"]`
- [[ran]] `python3 $W/mutn.py $B $W/plants/e22_emitsImport.json generic_frontend` (`imports: []` → one `{ specifier: 'x', kind: 'import' }`) → `KILLED pass=1 fail=1 ["T-15-2: a .sh file with two functions yields both function-shape symbols and no import"]`
- [[ran]] `python3 $W/mutn.py $B $W/plants/e22_symbolsFalse.json generic_frontend` (`capabilities: { symbols: true, imports: false }` → `symbols: false`) → `KILLED pass=1 fail=1 ["T-15-2: genericFrontend declares {symbols: true, imports: false}"]`
**Correct verdict:** keep. Each Fails-when clause is present and fails on its fault.

### E-25
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. The diff removes only:
- the `todo` options;
- the typed alias and its two type imports;
- header wording.

No assertion changes. My two plants hit the three retired subtests from different sides, and
they fail: no TypeScript resolver kills T-14-3's `test_map` subtest, and no tree-sitter symbols
kills both the `src/k.ts` precondition and T-14-5.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@bfe963f:L4331-L4332]] "— `T-14-3`'s two `import_edge` `test_map` rows (its TypeScript and Python"
- [[ran]] `git show bfe963f -- middleware/context-oracle/ctxoracle/test/unit/indexer_walk.test.ts middleware/context-oracle/ctxoracle/test/unit/search_semantics.test.ts | grep "^[-+]" | grep -v "^+++\|^---"` → only comment lines, the two `import type` lines and the `defaultFrontendsFromTuning` alias removed; `defaultFrontendsFromTuning(tuning)` → `defaultFrontends(tuning)`; `{ todo: TODO }` / `{ todo: 'needs Step 15 frontends; retired by Step 15' }` removed from the three `test(` lines; no `assert` line.
- [[ran]] `python3 $W/mutn.py $B $W/plants/e25_noTsResolver.json indexer_walk search_semantics` (`    typescript: resolveTsImport,` removed from the compiled `RESOLVERS`) → `KILLED pass=11 fail=1 ["T-14-3 (Step 15): test_map holds the import_edge rows of the TypeScript and Python test files"]`
- [[ran]] `python3 $W/mutn.py $B $W/plants/e25_noTsSymbols.json indexer_walk search_semantics` (`symbols.push({ name: name.text` → `void ({ name: name.text`) → `KILLED pass=10 fail=2 ["T-14-3 (Step 15): src/k.ts has symbols rows before its deletion", "T-14-5 (Step 15): symbolSearch hit sets agree under both stores and meet the symbol clauses"]`
**Correct verdict:** keep. The retirement is faithful, and all three retired subtests fail on a real fault.

### E-29
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree:
- the root-only flaw was real;
- the ancestor walk is not Python's `sys.path[0]` rule: `sys.path[0]` is the script's directory
  for `python script.py` and the working directory for `-m`;
- the external test contradicts AD-12's own external class, which the architecture already
  stated at this commit (before the batch 4 ruling restated it), in both directions.

Re-executed with my own cases, including one the first audit did not show. Because the
indexer's `hasTopLevelModule` also counts every `.py` file stem at any depth, one
`lib/util/json.py` makes every `import json` in the repository `unresolved`. Two small
qualifications to the reasoning, neither of which changes the verdict:
1. `sys.stdlib_module_names` is Python-side data. A Node resolver needs a vendored,
   version-stated list (the set changes between Python releases), not a call at index time.
2. The ancestor walk records its first hit as a certain edge (`config` from `a/b/x.py` →
   `a/config.py`) where Python, running `a/b/x.py` as a script, would not find it. That is the
   false-edge direction the replacement must state.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@d616f1f:L4275-L4277]] "an absolute dotted name is looked up the way Python's `sys.path[0]` rule does for a script — against the importing file's own directory, then each ancestor directory in turn, nearest first"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@d616f1f:L4280-L4282]] "hit it is `external` only when no in-repo module or package with the same top-level name (`a`) exists anywhere in the repository (then it is the standard library or an installed distribution)"
- AD-12's external class at the time. [[middleware/context-oracle/docs/architecture-phase-a.md@059dc86:L1401-L1402]] "*external* (a platform builtin, or a package the repository declares as a dependency"
- [[https://docs.python.org/3/library/sys.html]] "python -m module command line: prepend the current working directory." and [[https://docs.python.org/3/library/sys.html]] "python script.py command line: prepend the script’s directory."
- [[https://docs.python.org/3/reference/import.html]] "this indicates a top level import"
- [[https://docs.python.org/3/library/sys.html]] "A frozenset of strings containing the names of standard library modules."
- The indexer's breadth. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@feb37c9:L738-L739]] "pyTopLevel.add((segs[segs.length - 1] as string).slice(0, -'.py'.length)); for (const d of segs.slice(0, -1)) pyTopLevel.add(d);"
- `$W/py.mjs` calls the built `resolvePythonImport` with a `RepoFiles` whose `hasTopLevelModule` copies `indexer.ts@feb37c9` L732–L742. [[ran]] `node $W/py.mjs $B` → `requests from app/main.py with [app/main.py] -> {"kind":"external"}` / `reqeusts from app/main.py with [app/main.py] -> {"kind":"external"}` / `logging from app/main.py with [app/main.py, tools/logging/setup.py] -> {"kind":"unresolved"}` / `json from app/main.py with [app/main.py, lib/util/json.py] -> {"kind":"unresolved"}` / `config from a/b/x.py with [a/b/x.py, a/config.py] -> {"kind":"resolved","dst":"a/config.py"}` / `util from a/b/x.py with [a/b/x.py, a/b/util.py, util.py] -> {"kind":"resolved","dst":"a/b/util.py"}`
- The review found two more import-system gaps. Re-executed: [[ran]] `cd $W/pyt && python3 -c "import mod, sys; print(sys.version.split()[0], mod.X); import tools.helper; print('namespace ok', tools.helper.Y)"` (with `mod.py`, `mod/__init__.py` and `tools/helper.py`, no `tools/__init__.py`) → `3.11.15 package` / `namespace ok 1`. The package wins over the module, which the resolver tries second. The namespace package imports, and the resolver never counts one.
**Correct verdict:** replace. Keep the finding and the importer's-directory lookup. Replace the ancestor walk with declared project roots, or state it as a heuristic and name its false-edge direction. Make `external` only a standard-library name (a vendored, version-stated list) or a declared distribution, else `unresolved`.

### E-31
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. My attempt was to run the plan
checker at both commits. At `115d176` it fails (exit 1, on the backticked `has(`). At `f22ce6b`
it passes with regions current. So the regenerated row and the reworded phrase are what the
generator requires. Under the corrected Python rule (E-29, E-32) the resolver still needs a new
`RepoFiles` input (declared distributions or roots), so `frontend.ts` stays a file Step 15
changes.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@115d176:L4154]] "middleware/context-oracle/ctxoracle/src/index/frontend.ts, middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@f22ce6b:L592]] "| middleware/context-oracle/ctxoracle/src/index/frontend.ts | modify | S15 |"
- [[ran]] `cd $W/pc/115d176/middleware/context-oracle && node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check docs/plans/plan-phase-a.md` (the plan and generator from `git archive 115d176`) → `ERROR: identifier `has(` is named by steps S9, S15 but no step's provides: declares it — an interface between steps must be provided by the step that creates it`, exit 1; the same at `f22ce6b` → `OK: 40 steps, 13 elements, 165 test specs, 27 probes cited, regions current`, exit 0
- [[ran]] `git show feb37c9 --stat | grep frontend.ts` → ` .../context-oracle/ctxoracle/src/index/frontend.ts |  6 ++`
**Correct verdict:** keep. `frontend.ts` is a file Step 15 changes, and the row is the generator's output from that declaration.

### E-37
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree:
- the findings I re-executed are real: S1, M1, m1/m2 (TypeScript's order and `.d.ts`), m3
  (package over module, namespace packages), m4, m9 and m10;
- M3 and M4 moved only in the architecture;
- the other fifteen findings have no disposition on the record.

I checked the last point against history. No commit after `ff99487` touches a non-audit
file except `64f46fd`'s architecture, and STATUS was last written at `fbb9052`. Also agree on
the review's three misses (the Python "Holds", the Lua "Holds", `sys.path[0]` without a
false-edge analysis) and on M60 being settled by the handbook. That last is re-executed: tsc
5.9.3 resolves `./both.js` to `both.ts` when both exist, and `./types.js` to `types.d.ts` after
trying `.ts` and `.tsx`.

The first audit leaves out three more misses. A later record must state them too:
1. The review certified "the 31-grammar table" while swift errs silently on raw strings (E-1).
   Its swift fuzzing counted only throws, and its m9 scan covered only this repository's files.
2. It judged `defaultFrontends` as "Holds". But the silent skip of a malformed
   `index.ext_to_grammar` member (E-14) is in that function, and the review did not raise it.
3. Its S1 fix (b) is internally inconsistent. It says "per process", but its mechanism disables a
   grammar "for the rest of the pass". The leak is per process (E-19: `__stack_pointer` falls 864
   bytes per throw and is never restored), so a pass-scoped disable does not bound it.
**Evidence:**
- [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L349]] "| `resolvePythonImport`: PEP 328 levels; the ancestor lookup; `external` only when no in-repo top-level name | **Holds** |" and [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L356]] "| `.lua=lua` removed from the seed; 31 grammars | **Holds** |"
- [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L24]] "The 31-grammar table, the `QUERIES` coverage rule,"
- [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L107-L108]] "3,000 mutated inputs for each of `cpp`, `php`, `python`, `ruby`, `tlaplus`, `kotlin`, `typescript`, `c_sharp`, `rust` and `swift` gave 0 throws"
- [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L353]] "| `defaultFrontends`: one frontend per queried table grammar, sorted, then generic | **Holds** |"
- [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L113-L115]] "(b) Bound throws per process well under the measured 75: disable a grammar's frontend for the rest of the pass on its first throw"
- [[ran]] `node $W/poison_sp.mjs` → `after throw 75 stack_pointer 13424` / `after throw 76 stack_pointer 12560` / `ts parse fails after bash throw # 76 RuntimeError: table index is out of bounds` (E-19)
- [[ran]] `cd $W/tsr && node <ctxoracle>/node_modules/typescript/bin/tsc -p tsconfig.json --traceResolution` (`NodeNext`, ESM package, `src/a.ts` importing `./types.js` with only `types.d.ts`, and `./both.js` with `both.ts` and `both.js`) → `Version 5.9.3` / `File '$W/tsr/src/types.ts' does not exist.` / `File '$W/tsr/src/types.tsx' does not exist.` / `File '$W/tsr/src/types.d.ts' exists - use it as a name resolution result.` / `File '$W/tsr/src/both.ts' exists - use it as a name resolution result.` (`$W` expanded in the real output)
- [[https://www.typescriptlang.org/docs/handbook/modules/reference.html]] "TypeScript will first try to find a TypeScript implementation file or type declaration file with the same name and analagous file extension."
- [[ran]] `git log --format='%h %s' ff99487..HEAD --name-only -- middleware/context-oracle | grep -v "branch-audit" | grep "^middleware" | sort -u` → `middleware/context-oracle/docs/architecture-phase-a.md` (from `64f46fd` only); `git log --oneline -1 -- middleware/context-oracle/docs/STATUS.md` → `fbb9052 context-oracle: STATUS — Step 14 built and reviewed; next is Step 15`
- [[middleware/context-oracle/CLAUDE.md@HEAD:L228-L230]] "When a review surfaces findings, apply every finding that holds up. Check each against the source first; a finding you find wrong is rejected with the evidence, on the record — never silently dropped, never a convenient subset."
**Correct verdict:** replace. The findings stand. A later review record must correct the two "Holds" rows and M60, and must add the three misses above (swift and the 31-grammar claim, the `defaultFrontends` skip, the per-pass bound). S1, M1, M2, M5 and m1–m11 each need an on-record disposition.

### E-39
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: agree with the substance:
- the defect is real;
- running entropy on string literals and not on identifiers matches secret-scanner practice
  (detect-secrets' high-entropy plugin requires quotes);
- requiring the tuned values wherever entropy runs removes the hidden literal;
- the residual is stated in L5.

The keep does not survive one check: the rule's scope is "a symbol name *the parser* captured
as a declaration name". AD-12 has two frontends. The tree-sitter one is the only parser, and the
architecture uses "parser" elsewhere only for the tree-sitter runtime (V14). The generic
frontend's names come from regex heuristics, and it is the frontend for `.sh`, `.ps1`, `.lua`
and every untabled code file. Under the literal reading those declaration names still get the
entropy rule, so M4's false positive stays for every generic-frontend language. Executed: a
shell function named `T11_DiscoveryWorkflowTests`, captured by the generic frontend, is
redacted to `[redacted:high_entropy]`. A plan writer has to guess which reading is meant, and
that is a flaw under the raise-flaws rule ("too unclear to act on without guessing"). The fix is
one phrase: "a symbol name any frontend (tree-sitter or generic) records as a declaration name".
**Evidence:**
- [[middleware/context-oracle/docs/architecture-phase-a.md@64f46fd:L2123-L2126]] "**An identifier is not free text:** a symbol name the parser captured as a declaration name gets the pattern rules only, never the entropy heuristic, and the entropy heuristic runs with the tuned `security.entropy_*` values wherever it runs."
- [[middleware/context-oracle/docs/architecture-phase-a.md@64f46fd:L2952-L2954]] "A secret written as a declaration name gets only the pattern rules (AD-19: identifiers are not free text)."
- "parser" elsewhere in the architecture. [[ran]] `git show 64f46fd:middleware/context-oracle/docs/architecture-phase-a.md | grep -n -i "\bparser\b" | cut -c1-60` → `138:| V14 | \`web-tree-sitter\` (0.26.13) and \`tree-sitter-was` / `2123:     **An identifier is not free text:** a symbol name`
- A generic-frontend declaration name meets the same entropy rule. [[ran]] `cd $B && node -e "Promise.all([import('./dist/src/index/generic_frontend.js'), import('./dist/src/security/redact.js')]).then(([g, r]) => { const out = g.genericFrontend.parse('t.sh', Buffer.from('T11_DiscoveryWorkflowTests() {\n  echo ok\n}\nfunction Deploy_BlueGreen_Rollback_Check {\n  :\n}\n')); for (const s of out.symbols) console.log(s.name, JSON.stringify(r.redact(s.name).redacted)); });"` → `T11_DiscoveryWorkflowTests "[redacted:high_entropy]"` / `Deploy_BlueGreen_Rollback_Check "Deploy_BlueGreen_Rollback_Check"`
- The indexer redacts every frontend's names the same way. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L690]] "if (used.capabilities.symbols) pf.symbols = parsed.symbols.map((s) => ({ ...s, name: redact(s.name).redacted }));"
- [[https://raw.githubusercontent.com/Yelp/detect-secrets/master/detect_secrets/plugins/high_entropy_strings.py]] "We require quoted strings to reduce noise."
- [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L310]] "**FR-X1 — Secret redaction (T3)** before any content enters a whisper, store, or log."
**Correct verdict:** replace. Keep the rule, the tuned-values clause and L5. Change the scope from "a symbol name the parser captured" to a declaration name recorded by any frontend, tree-sitter or generic.

## Tally (recounted from the sections above)

- Judged: 17 entries. Correct verdicts: **keep 10** (E-4, E-5, E-10, E-11, E-12, E-13, E-20,
  E-22, E-25, E-31), **replace 7** (E-1, E-2, E-16, E-19, E-29, E-37, E-39), remove 0,
  undetermined 0.
- Verdict agreement with the first audit: 16 of 17. The one disagreement is E-39 (keep →
  replace: "the parser" leaves generic-frontend names under the entropy rule).
- Reasoning corrected on E-1, E-2, E-16, E-19, E-29 and E-37 (and one overstatement in E-10).
- Consequences outside this file's scope, for the adjudicator:
  - `tree-sitter-swift` 0.4.3 carries the Lua defect class, which bears on E-3 (probe 20's
    conclusion), E-18 (the seed) and E-21 (T-15-6's 31-grammar assertion). The first audit's
    statement in E-3 that "the 31 are not in question on this evidence" does not hold.
  - The per-process stack leak bears on E-27's many-throws case.
