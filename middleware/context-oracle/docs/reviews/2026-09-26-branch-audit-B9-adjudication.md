# Branch audit — batch 9 (Step 15, the language frontends): adjudication

This file adjudicates batch 9 of the branch audit, commits 62–70: `059dc86` (AD-12/L6,
31 usable grammars, `lua` excluded), `42653ae` (plan fixes), `bfe963f` (the build),
`d616f1f`, `115d176`, `f22ce6b` (the Python resolver plan), `feb37c9` (the Python
resolver code), `ff99487` (the independent review) and `64f46fd` (AD-12 generic
frontend scope, AD-19 identifier redaction). Its inputs are the first audit
`2026-09-26-branch-audit-B9.md` (E-1 … E-39: 11 keep, 28 replace) and the second
opinion `2026-09-26-branch-audit-B9-second-opinion.md` (17 entries). The adjudicator
made none of the changes and wrote neither review. The test applied is the auditor
brief `/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md`.

Settled and not re-litigated: the B1–B8 verification files and the coordinator
rulings of 2026-09-28. Those that govern here:
- batch 4 correction item 5 (resolvers);
- B8's settled `version` rule (a content digest, not a hand string);
- the fallback test (a degraded mode must be specified and visible).

Coordinator-verified facts taken as given:
- `tree-sitter-lua` 2.1.3 (`gitHead` `6b02dfd`): `scanner.c` L53 is `malloc` with no
  initialisation, and `deserialize` restores only when `length == 2` (L71).
- `tree-sitter-swift` 0.4.3 (`gitHead` `47abc88`): `scanner.c` L232 is
  `calloc(0, sizeof(struct ScannerState))`.
- `HEAD`'s ctxoracle source equals `64f46fd`'s. Re-checked:
  [[ran]] `git diff --stat 64f46fd HEAD -- middleware/context-oracle/ctxoracle` → empty
  (`HEAD` is `9707cd8`). The architecture and the Step 15 review file are also the same
  at `HEAD` as at `64f46fd` and `ff99487`.

**How the work was done.** All execution is in my own scratch folder
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/b9adj`,
called `$A` below. Node 22, `web-tree-sitter` 0.25.10, `tree-sitter-wasms` 0.1.13.
- `$B` = `$A/b64/middleware/context-oracle/ctxoracle`, made with `git archive 64f46fd
  middleware/context-oracle/ctxoracle | tar -x -C $A/b64`, this checkout's
  `ctxoracle/node_modules` symlinked in, and built with `npx tsc -p tsconfig.json`
  (exit 0). Its source is `HEAD`'s, so a defect shown on `$B` is present at `HEAD`.
- `$O` is this checkout's `ctxoracle/node_modules/web-tree-sitter`.
- `$W` = `$A/wts/web-tree-sitter` is my copy of that package with two patches in
  `tree-sitter.js`, and the original was never modified:
  - In the side-module import proxy, when `globalThis.__ALLOC_HOOK` is a function at
    grammar load, the grammar's `malloc`/`calloc` imports are wrapped. The wrapper
    calls the hook with the call's arguments, the returned pointer and `HEAPU8`.
  - `globalThis.__SP` is set to the module's `___stack_pointer` global.
- `$A/bz` is a copy of `$B`'s `dist` whose `node_modules/web-tree-sitter` is `$W`. It
  runs the built frontend under the hooked runtime.
- `$A/plant.py BUILD FILE OLD NEW TESTS…` copies the build tree, replaces one exact
  string (it must occur once) in one compiled file, and runs the named compiled tests
  with `node --test`, every `GIT_*` variable removed. KILLED means a subtest failed.
- Harnesses that index a throwaway repository (`share.mjs`, `pyjson.mjs`) make it with
  `git init` and run `runIndex` with `defaultFrontends` over a seeded global store,
  every `GIT_*` variable removed.
- Web quotes are from `curl`-fetched text, each matched with `webquote.py`.
- The grammar tarballs were fetched with `npm pack` into `$A/gr/`.
- This repository was never checked out or modified. The only file written in it is
  this one.

**Which `tree-sitter-swift` `tree-sitter-wasms` 0.1.13 packaged.** Its `package.json`
says `^0.4.0`. The build is pinned by the lockfile at the published commit, and the
WASM itself shows the defect's allocation:
- [[ran]] `npm view tree-sitter-wasms@0.1.13 gitHead` → `3e88dc9e36b4e8bf752ce53bea61e4b67282a2bb`.
- The lockfile at that commit resolves swift to 0.4.3:
  [[https://raw.githubusercontent.com/Gregoor/tree-sitter-wasms/3e88dc9e36b4e8bf752ce53bea61e4b67282a2bb/pnpm-lock.yaml]] "tree-sitter-swift: specifier: ^0.4.0 version: 0.4.3"
  and lua to 2.1.3:
  [[https://raw.githubusercontent.com/Gregoor/tree-sitter-wasms/3e88dc9e36b4e8bf752ce53bea61e4b67282a2bb/pnpm-lock.yaml]] "tree-sitter-lua: specifier: ^2.1.3 version: 2.1.3"
- The locked integrity matches the published tarball:
  [[ran]] `npm pack tree-sitter-swift@0.4.3 tree-sitter-lua@2.1.3 --json` → `tree-sitter-swift-0.4.3.tgz sha512-UYwtnhaZo0/VIykY/vJlaH5sj+EqLsHkeVSHUNMC+4McdtVpVyNqq96HB4Djvg9QyirwiwErFn9EXc2oyEo8Qw==` and `tree-sitter-lua-2.1.3.tgz sha512-BmRSRI0Y4J47cE2cODyXsPiueDSAnIrFLJqOP/gKIJhGa4HoGpvEccmNuhAEVGtCrgaHGhaIkWeqiMGCgQ0cfw==`.
  These are the `resolution` integrities at lockfile L1479 and L1397.
- The shipped WASMs make exactly those scanners' allocations, one per parse (24 parses):
  [[ran]] `node $A/alloc.mjs $W swift log` → `swift mode=log allocs=24 kinds=["calloc(0,4)"]`;
  [[ran]] `node $A/alloc.mjs $W lua log` → `lua mode=log allocs=24 kinds=["malloc(8)"]`.
  `calloc(0, 4)` is `calloc(0, sizeof(struct ScannerState))` with a 4-byte
  `uint32_t` state.
- Every `tree-sitter-swift` release in or beyond the range has the same line:
  [[ran]] `for f in tree-sitter-swift-{0.4.0,0.4.2,0.4.3,0.5.0,0.7.1}.tgz; do tar -xzOf $f package/src/scanner.c | grep -n calloc; done`
  → `206:` (0.4.0), `232:` (0.4.2, 0.4.3, 0.5.0) and `237:` (0.7.1), each
  `return calloc(0, sizeof(struct ScannerState));`.

So the packaged swift grammar is 0.4.3, and no published swift release fixes it.

### E-1
**Ruling:** Replace is upheld. The second opinion's three corrections are upheld, each
re-verified here.
1. **The cause is now proven, not inferred.** The first audit read the cause from the
   scanner source. Its control was a different grammar. I isolated the cause in
   2.1.3 itself, changing nothing else:
   - 19 of 24 parses err as shipped;
   - 0 of 24 err with the scanner's allocation zeroed;
   - 20 of 24 err with it filled with `0xff`.

   Each run made one `malloc(8)` per parse, which is the create-per-parse lifecycle,
   observed. The C standard says a `malloc` block's value "is indeterminate", so the
   scanner's first `switch (state->started)` reads a value the program never set.
2. **"The defect is in one grammar build" is false.** `swift`, a default-table grammar,
   has the same defect class, and its version is 0.4.3 (above). Its `create` asks for
   zero bytes and then writes a 4-byte state. C11 says a zero-size allocation's
   pointer "shall not be used to access an object". The same isolation experiment
   gives:
   - 15 of 24 parses err as shipped;
   - 0 of 24 with the block zeroed;
   - 16 of 24 with it filled with `0xff`.

   At `HEAD` the built frontend returns `ok: true` for those trees, and it silently
   loses symbols:
   - `func f() { print(##"a"#b"##) }` / `protocol P {}` / `func g() {}` yields `[]`,
     and `["f","P","g"]` with the block zeroed;
   - a raw string inside `func a()` yields `["a"]`, not `["a","b","C"]`.

   So the 31-grammar table is not "error-free on every repeated parse". The probe says
   so only because its swift sample has no raw string. With a raw-string sample it
   reports "not usable: lua; swift", which I re-ran.
3. **The preferred alternative, as written, breaks C-3 and AD-25.**
   `@tree-sitter-grammars/tree-sitter-lua` 0.4.1 as an npm dependency brings an
   `install` script (`node-gyp-build`), two native-build dependencies and six prebuilt
   `.node` binaries. AD-25 forbids all three and fixes the runtime dependencies at
   two. Its shipped `tree-sitter-lua.wasm` must be vendored instead. The WASM is:
   - MIT, with a `LICENSE.md` in the package;
   - ABI 15, and it loads under 0.25.10;
   - clean on 24 of 24 repeated parses interleaved with another grammar, even with
     its `calloc(1,2)` block overwritten with `0xff` after allocation.

   The first audit's second alternative, a rebuilt 2.1.3, stays valid but loses to
   this one (see the correction).

On the length-0 reset in `deserialize`:
- The second opinion is right that zeroing at `create` alone removes every ERROR tree
  under 0.25.10 (executed).
- The reset is still required in a rebuilt scanner. The scanner contract says `create`
  runs once each time the language is set on a parser (quoted below). A runtime that
  keeps that promise reuses the scanner across parses. There, a `deserialize` of
  length 0 that restores nothing would carry the last parse's state into the next.
- The contract also names the reset as good practice (quoted below).

**Evidence:**
- The architecture records the symptom only. [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1387-L1388]] "`lua` loads but, after its first parse in a process, returns ERROR trees for valid source without throwing"
- The usability rule. [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L2964-L2966]] "31 of 36 — `lua` parses once and then silently returns ERROR trees, so it falls to the generic frontend too; a usable grammar is one that parses valid source correctly on repeated parses, not once."
- The promise the fix needs. [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L2967-L2968]] "the ext→grammar config absorbs individually-shipped grammar WASMs without redesign (C-6)"
- The loader cannot take such a WASM today. [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@HEAD:L304]] "const wasm = fileURLToPath(import.meta.resolve(`tree-sitter-wasms/out/tree-sitter-${lang}.wasm`));"
- The packaged lua scanner. [[ran]] `tar -xzOf $A/gr/tree-sitter-lua-2.1.3.tgz package/src/scanner.c | sed -n '53p;71p'` → `  return malloc(sizeof(struct ScannerState));` / `  if (length == 2)`
- The packaged swift scanner. [[ran]] `tar -xzOf $A/gr/tree-sitter-swift-0.4.3.tgz package/src/scanner.c | sed -n '232p;259p'` → `    return calloc(0, sizeof(struct ScannerState));` / `    if (length < 4) {`
- The C standard (C11 committee draft N1570, §7.22.3): [[https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf]] "The malloc function allocates space for an object whose size is specified by size and whose value is indeterminate." and [[https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf]] "If the size of the space requested is zero, the behavior is implementation-defined: either a null pointer is returned, or the behavior is as if the size were some nonzero value, except that the returned pointer shall not be used to access an object." and [[https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf]] "The calloc function allocates space for an array of nmemb objects, each of whose size is size."
- The scanner contract. [[https://raw.githubusercontent.com/tree-sitter/tree-sitter/master/docs/src/creating-parsers/4-external-scanners.md]] "It will only be called once anytime your language is set on a parser." and [[https://raw.githubusercontent.com/tree-sitter/tree-sitter/master/docs/src/creating-parsers/4-external-scanners.md]] "It is good practice to explicitly erase your scanner state variables at the start of this function, before restoring their values from the byte buffer."
- Lua isolated. `alloc.mjs` runs 4 fresh `Parser`s × 6 valid sources. `zero` and `fill255` overwrite each block the grammar allocates.
  - [[ran]] `node $A/alloc.mjs $O lua none` → `error trees 19 of 24`
  - [[ran]] `node $A/alloc.mjs $W lua zero` → `lua mode=zero allocs=24 kinds=["malloc(8)"]` / `error trees 0 of 24`
  - [[ran]] `node $A/alloc.mjs $W lua fill255` → `error trees 20 of 24`
- Swift isolated. The sources are three copies of `let r = #"raw text"#`, a raw-string `func`, and two plain lines.
  - [[ran]] `node $A/alloc.mjs $O swift none` → `error trees 15 of 24`
  - [[ran]] `node $A/alloc.mjs $W swift zero` → `swift mode=zero allocs=24 kinds=["calloc(0,4)"]` / `error trees 0 of 24`
  - [[ran]] `node $A/alloc.mjs $W swift fill255` → `error trees 16 of 24`
- The built frontend at `HEAD` (`$B`'s `dist` under `$W`, `zero` 1 zeroing the scanner block). Each line is one file's symbols on its first and second parse.
  - [[ran]] `node $A/swfe4.mjs $A/bz 0` → `["a"] ["a"]` / `["d","E"] ["d","E"]` / `[] []`
  - [[ran]] `node $A/swfe4.mjs $A/bz 1` → `["a","b","C"] ["a","b","C"]` / `["d","E"] ["d","E"]` / `["f","P","g"] ["f","P","g"]`
  - `r.ok` is true in every case: the script prints `false` for a failed parse.
- The probe's conclusion depends on its swift sample (probe 20 at `42653ae`; the copy changes only swift's sample to `func answer() -> String { return #"forty-two"# }`).
  - [[ran]] `PROBE_LAYOUT=$A/layout node $A/probe20.mjs | tail -2` → `… error-free on every parse: 31; not usable: lua (ERROR/MISSING)`
  - [[ran]] `PROBE_LAYOUT=$A/layout node $A/probe20_swiftraw.mjs | tail -2` → `… error-free on every parse: 30; not usable: lua (ERROR/MISSING); swift (ERROR/MISSING)`
- Only these two are state-dependent on probe 20's samples. `allgr.mjs` parses each of probe 20's 32 samples, plus a raw-string swift sample, 3 times in fresh `Parser`s. It sets every block the C standard leaves indeterminate to `0x00` (clean) or `0xff` (garbage): a `malloc` block, or a zero-size `calloc`.
  - [[ran]] `node $A/allgr.mjs clean` → `mode clean; samples 33; erring: none`
  - [[ran]] `node $A/allgr.mjs garbage` → `mode garbage; samples 33; erring: lua:3/3 swift#raw:3/3`
  - Allocations seen: `cpp calloc(1,68); html calloc(1,12)|malloc(8)|malloc(128); kotlin calloc(1,12); lua malloc(8); ocaml calloc(1,16); php calloc(1,16); python calloc(1,28)|malloc(16); rescript malloc(8); ruby calloc(1,28); swift calloc(0,4); tlaplus malloc(44); vue calloc(1,12)|calloc(1,17)`.
  - The second opinion read the other scanners at their locked versions. I spot-read two: `rescript`'s `create` does `malloc` then `memset(state, 0, sizeof(ScannerState))`, and `tlaplus`'s calls `nested_scanner_init(scanner)`.
- The replacement package. [[ran]] `npm pack @tree-sitter-grammars/tree-sitter-lua@0.4.1 --json` → `sha512-EwagFaU6ZveVk18/Y8qUhZkkiBKnQ7dSCHbm//TUroLVKy3i1rOYGy/cNHtSkAb1eDvS1HhCLybH2S541Cya/g==`
  - Its manifest: `scripts {'install': 'node-gyp-build', …}`, `deps {'node-addon-api': '^8.5.0', 'node-gyp-build': '^4.8.4'}`, `peer {'tree-sitter': '^0.22.4'}` and `license MIT`.
  - Its tarball lists six `prebuilds/*/@tree-sitter-grammars+tree-sitter-lua.node` files, plus `package/tree-sitter-lua.wasm` and `package/LICENSE.md`.
  - Its `create`: `55:  Scanner *scanner = ts_calloc(1, sizeof(Scanner));`
- Its WASM under the pin (4 rounds × 6 Lua sources, a TypeScript parse between rounds).
  - [[ran]] `node $A/lua041.mjs $O $A/gr/tsglua/package/tree-sitter-lua.wasm none` → `abi 15 mode none …` / `error trees 0 of 24`
  - [[ran]] `node $A/lua041.mjs $W $A/gr/tsglua/package/tree-sitter-lua.wasm fill255` → `abi 15 mode fill255 allocs seen ["calloc(1,2)"]` / `error trees 0 of 24`
  - The shipped 2.1.3 WASM in the same harness: [[ran]] `node $A/lua041.mjs $O <ctxoracle>/node_modules/tree-sitter-wasms/out/tree-sitter-lua.wasm none` → `abi 13 …` / `error trees 15 of 24`.
- No fixed `tree-sitter-lua` release exists. [[ran]] `npm view tree-sitter-lua@latest version` → `2.1.3`
- The packaging rule. [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L2547-L2549]] "runtime deps exactly `web-tree-sitter` + `tree-sitter-wasms`, **no postinstall scripts, no native code, no prebuilt-binary downloads**" and C-3 [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L530-L532]] "install + first index with no native toolchain beyond the chosen SQLite path, no prebuilt-binary download, no network beyond the harness's."

**Final verdict:** replace.

**Correction:**
- **Record the cause** in AD-12 and L6, in place of the symptom:
  - the packaged `tree-sitter-lua` 2.1.3 scanner reads a `malloc` block it never
    initialised;
  - the packaged `tree-sitter-swift` 0.4.3 scanner writes a 4-byte state into a
    zero-byte `calloc`;
  - the 0.25.10 runtime creates the scanner at every parse, so each parse after the
    first starts from reused heap.

  Replace L6's "a usable grammar is one that parses valid source correctly on repeated
  parses" with a cause-level rule: a grammar is usable when its scanner initialises its
  state in `create` and resets it in `deserialize` at length 0 (read from the packaged
  source), and its samples parse error-free. A sample check alone cannot show that.
- **Lua fix, within C-3 and AD-25.** Vendor `tree-sitter-lua.wasm` from
  `@tree-sitter-grammars/tree-sitter-lua` 0.4.1 as a file inside the `ctxoracle`
  package, with no npm dependency on it. Record:
  - the package, version and tarball integrity;
  - the WASM's sha256, checked at load;
  - the MIT notice.

  Add a `lua` `QUERIES` entry written against that grammar's node types (`HEAD` has
  none). Keep `.lua=lua` in the seed. Rebuilding 2.1.3 with an initialising `create`
  and a length-0 reset also works, but it loses: it adds a local build and a patch to
  a grammar whose last release is 2.1.3, where the maintained grammar already ships a
  clean WASM.
- **Swift fix, within C-3 and AD-25.** No release is fixed, and the npm package has
  `install` and `postinstall` scripts that run `tree-sitter generate` and `node-gyp`.
  So:
  - rebuild `tree-sitter-swift` 0.4.3's WASM with `create` as
    `calloc(1, sizeof(struct ScannerState))` and `deserialize` resetting the state when
    `length < 4`;
  - build it once at vendoring time with the tree-sitter CLI's WASM build. That is not
    at install, so C-3 holds, and the package build stays `tsc` only;
  - vendor it with the patch, the build command, the sha256 and the MIT notice, and
    report the defect upstream.

  Until it lands, `swift` stays in the table and the per-file ERROR-tree signal (E-19)
  reports its failures.
- **Loader and AD-25.** The loader takes a per-grammar WASM path from the table in place
  of the fixed `tree-sitter-wasms/out/` path. That is the C-6 extension act L6 promises.
  AD-25 is amended to allow vendored grammar WASMs under these provenance and checksum
  rules. The runtime dependencies stay two. B8's `version` digest covers the WASM
  bytes.
- **Interim for any grammar still excluded.** Keep its table row, give it the generic
  frontend, and record the exclusion and its cause per language in `lang_capabilities`
  and `status`, never as `unknown`.

**Still at HEAD:** yes: the exclusion, the `unknown` recording of `.lua`, the fixed
grammar path, and swift's silent ERROR trees with lost symbols (executed on `$B`).

**Owner question:** none. Keeping Lua and swift structural serves C-6 as written; the
sourcing and packaging are engineering decisions.

### E-2
**Ruling:** Replace is upheld. So is the second opinion's correction of what the plan
should keep.
- The first audit kept the repeated-parse, ERROR/MISSING rule as the grammar-usability
  criterion. It supported that with a 40-round stress run in which the 31 passed.
- Both show only that the chosen samples parse. Swift is in the 31, and it errs on
  valid raw strings (E-1, executed). So the plan's sentence that the 31 parse "valid
  source error-free on every repeated parse" is false, and it is still at `HEAD`.
- T-38-33 fails only on its own samples' trees, so it would pass the table as it is.

The correction therefore needs two parts beyond the first audit's:
- a cause-level check of each packaged scanner's `create` and `deserialize` (E-1);
- the per-file runtime ERROR-tree signal (review m9, E-19). No sample set proves a
  grammar clean for every file it will meet.

**Evidence:**
- The plan's claim, at the commit. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L4180-L4181]] "31 grammars the pinned runtime loads and parses valid source error-free on every repeated parse"
- The same claim at `HEAD`. [[middleware/context-oracle/docs/plans/plan-phase-a.md@HEAD:L4181-L4182]] "31 grammars the pinned runtime loads and parses valid source error-free on every repeated parse (§4, `probe:20_grammar_inventory`)."
- T-38-33's failure conditions at `HEAD`. [[middleware/context-oracle/docs/plans/plan-phase-a.md@HEAD:L7138-L7139]] "returning a tree with an ERROR/MISSING node, or on an excluded grammar (§4: `elm`, `ql`, `yaml`, `bash`, `lua`) appearing in the table"
- R6 at `HEAD`. [[middleware/context-oracle/docs/plans/plan-phase-a.md@HEAD:L14431-L14432]] "five shipped grammars are already excluded by executed cause — §4; `lua` the fifth"
- The clue recorded and not followed. [[middleware/context-oracle/docs/plans/plan-phase-a.md@42653ae:L10355-L10357]] "err depends on heap state — its first is clean when it is parsed right after its own load early in a process"
- The probe's swift sample has no raw string. [[middleware/context-oracle/docs/plans/plan-phase-a.probes/20_grammar_inventory.mjs@HEAD:L76]] "swift: 'import Sibling\n\nfunc answer() -> Int {\n    return 42\n}\n',"
- A raw-string sample drops swift. [[ran]] `PROBE_LAYOUT=$A/layout node $A/probe20_swiftraw.mjs | tail -2` → `… error-free on every parse: 30; not usable: lua (ERROR/MISSING); swift (ERROR/MISSING)` (E-1).
- The cause, isolated. [[ran]] `node $A/alloc.mjs $W swift zero` → `error trees 0 of 24`, against 15 of 24 as shipped (E-1).

**Final verdict:** replace.

**Correction:** Apply it in §4, Step 12, Step 15, D-plan-2, §11.4, T-38-33 and R6.
- State the cause of `lua`'s ERROR trees, and swift's (E-1).
- Load a working Lua grammar and a rebuilt swift grammar through the table (E-1). An
  exclusion that remains is recorded per language, not as `unknown`.
- Strike the claim that the 31 grammars parse error-free on every repeated parse.
  Name the usability rule:
  the packaged scanner initialises in `create` and resets at length 0, checked at plan
  time from source, and the samples parse error-free.
- Keep the repeated-parse, ERROR/MISSING sample check as a build check (T-38-33), not
  as proof of usability. Give swift a raw-string sample.
- Add the per-file runtime ERROR-tree signal (E-19).
- T-38-33 and R6 drop `lua` from the excluded list.

**Still at HEAD:** yes: L4181–L4182, L7138–L7139 and L14431–L14432 as quoted.

**Owner question:** none.

### E-3
**Ruling:** Replace stands. It was not second-opinioned as an entry, but a verified fact
changes it. The first audit's Consequences say "the 31 are not in question on this
evidence", resting on its 40-round stress run over the 31. That sentence is wrong:
- The packaged `tree-sitter-swift` is 0.4.3 (lockfile and the WASM's own `calloc(0,4)`
  call, above).
- Its scanner has the same defect class as `lua`'s.
- The probe passes swift only because swift's sample has no raw string. With one, the
  same probe reports "not usable: lua; swift" (executed).

So the probe's conclusion "error-free on every parse: 31" is a sample artefact, and so
is the expected file's line 8.

The first audit's point 3 is right, and now executed. A repeated-parse sample cannot
certify a grammar. The discriminating check is at the cause, in two forms:
- **Source:** does each packaged scanner initialise in `create` and reset in
  `deserialize` at length 0?
- **Dynamic:** fill every block the standard leaves indeterminate (a `malloc` block, a
  zero-size `calloc`) with garbage, and with zero, and compare the trees. On probe 20's
  samples plus a raw-string swift sample, only `lua` and swift change.

The dynamic check is still bound to its samples. The plain swift sample does not change
under garbage, so the source read is the check that does not depend on samples.

**Evidence:**
- The expected output at `HEAD`, unchanged since `42653ae`. [[middleware/context-oracle/docs/plans/plan-phase-a.probes/expected/20_grammar_inventory.txt@HEAD:L8]] "error-free on every parse: 31; not usable: lua (ERROR/MISSING)"
- The probe's own heap-state clue. [[middleware/context-oracle/docs/plans/plan-phase-a.probes/20_grammar_inventory.mjs@HEAD:L95]] "Which parses of `lua` err depends on the process's heap state (executed: its"
- The start set. [[middleware/context-oracle/docs/plans/plan-phase-a.probes/20_grammar_inventory.mjs@HEAD:L89]] "const excluded = new Set([\"elm\", \"ql\", \"yaml\", \"bash\"]);"
- The swift sample. [[middleware/context-oracle/docs/plans/plan-phase-a.probes/20_grammar_inventory.mjs@HEAD:L76]] "swift: 'import Sibling\n\nfunc answer() -> Int {\n    return 42\n}\n',"
- [[ran]] `git diff --stat 42653ae HEAD -- middleware/context-oracle/docs/plans/plan-phase-a.probes/` → empty.
- The probe, as shipped and with a raw-string swift sample (E-1): [[ran]] `PROBE_LAYOUT=$A/layout node $A/probe20.mjs | tail -2` → `… error-free on every parse: 31; not usable: lua (ERROR/MISSING)` and [[ran]] `PROBE_LAYOUT=$A/layout node $A/probe20_swiftraw.mjs | tail -2` → `… error-free on every parse: 30; not usable: lua (ERROR/MISSING); swift (ERROR/MISSING)` / `default table (30 grammars): c c_sharp … rust scala solidity systemrdl …` (swift absent).
- The cause-level dynamic check (E-1): [[ran]] `node $A/allgr.mjs clean` → `erring: none`; [[ran]] `node $A/allgr.mjs garbage` → `erring: lua:3/3 swift#raw:3/3`.
- Swift's cause, isolated: [[ran]] `node $A/alloc.mjs $W swift zero` → `error trees 0 of 24` (15 of 24 as shipped).

**Final verdict:** replace.

**Correction:**
- Keep the three-plus-one fresh-`Parser` parses and ERROR/MISSING counting.
- Give swift a valid raw-string sample.
- Replace the comment's heap-state note with the cause (E-1).
- Add a cause-level section that prints, for each table grammar with an external
  scanner, whether its trees change when the blocks the standard leaves indeterminate
  are filled with garbage. Record the packaged scanner source read (version from the
  lockfile) beside it in §11.4.
- Add a line that loads the vendored Lua WASM and the rebuilt swift WASM (E-1) and
  reports them clean.
- Regenerate the expected output from an executed run after the E-1 fixes land, and
  record what it prints. The fixes aim at 32 usable (`lua` restored, swift rebuilt)
  and no ERROR-tree grammar; the run, not this aim, is what the plan cites.
- The first audit's "the 31 are not in question on this evidence" does not stand. The
  audit file is not edited; this ruling supersedes the sentence.

**Still at HEAD:** yes: the probe and its expected output are unchanged since
`42653ae`, and swift's defect is live (E-1).

**Owner question:** none.

### E-16
**Ruling:** Replace is upheld. So is the second opinion's timeline correction.
- **What `bfe963f` decided**, and what the verdict rests on: the fallback. It does what
  h10 says, one fault and generic symbols with no edges, and it has two gaps, both
  re-executed at `HEAD`:
  - a fallback file of an `imports: true` language is counted nowhere in its share
    (`python` reads `resolved 0, unresolved 0` for a file with two imports);
  - it is never retried. Pass 2 writes nothing, and the fault is not re-recorded, so
    the gap outlives its single fault.
- **Not `bfe963f` decisions**: the untuned name redaction and the raw-name `isSuspect`
  check.
  - Both lines are in the parent commit `42653ae`, at L675 and L779.
  - `git log -S` puts the redaction in the walking skeleton `0e457c7` and the
    `isSuspect` check in the Step 14 build `177e59f`.
  - `bfe963f`'s only change to either is renaming `fe` to `used` on the first.
  - The fault text's `redact(parsed.error)` (L676) is likewise `177e59f`'s.
- They are real defects (review M4, M5; the first audit executed both). They belong to
  the commits that introduced them. No earlier batch's file records them (the
  searches, and my reading of every hit, are under Evidence). So they go to the correction pass as
  unrecorded findings of `0e457c7` and `177e59f`. They are not re-litigations of a
  settled verdict.
- They still matter to Step 15. The fallback sends every fallback file's generic names
  through the same untuned `redact`, and E-39's rule must reach those names too.

**Evidence:**
- The fallback branch this commit added, unchanged at `HEAD`. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L680]] "if (fe !== generic && generic !== undefined && !disabled.has(generic)) {"
- The two inherited lines in the parent. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@42653ae:L675]] "if (fe.capabilities.symbols) pf.symbols = parsed.symbols.map((s) => ({ ...s, name: redact(s.name).redacted }));" and [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@42653ae:L779]] "const symProv = repoSpanProv(pf.path, pf.pathSuspect || pf.symbols.some((s) => isSuspect(s.name)));"
- [[ran]] `git log --oneline -S "name: redact(s.name).redacted" -- middleware/context-oracle/ctxoracle/src/index/indexer.ts` → `0e457c7 context-oracle: walking skeleton Steps 14-15 (indexer, frontends, search) + gaps G11-G16`; [[ran]] `git log --oneline -S "isSuspect(s.name)" -- middleware/context-oracle/ctxoracle/src/index/indexer.ts` → `177e59f context-oracle: build Step 14, the structural indexer (unreviewed)`; [[ran]] `git log --oneline -S "redact(parsed.error)" -- middleware/context-oracle/ctxoracle/src/index/indexer.ts` → `177e59f context-oracle: build Step 14, the structural indexer (unreviewed)`
- `bfe963f`'s own edit of them. [[ran]] `git show bfe963f -- middleware/context-oracle/ctxoracle/src/index/indexer.ts | grep -n "^[-+].*\(redact(s.name)\|isSuspect(s.name)\)"` → `90:-        if (fe.capabilities.symbols) …` / `92:+        if (used.capabilities.symbols) …` (no `isSuspect` line).
- At `HEAD`. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L690]] "if (used.capabilities.symbols) pf.symbols = parsed.symbols.map((s) => ({ ...s, name: redact(s.name).redacted }));" and [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L809]] "const symProv = repoSpanProv(pf.path, pf.pathSuspect || pf.symbols.some((s) => isSuspect(s.name)));" and [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L676]] "parseFailures.push({ lang, path: p, error: redact(parsed.error).redacted.slice(0, ERROR_MAX_CHARS) });"
- No earlier record. [[ran]] `grep -ln "isSuspect(s.name)\|redact(s.name)" middleware/context-oracle/docs/reviews/2026-09-2*-branch-audit-*` → the B9 first audit, its second opinion and this file only. A wider search of the B2 and B8 files for `entropy`, `isSuspect`, `suspect` and `injection flag` (case-insensitive) returns two lines, B8a L48 (git's `is_git_directory(const char *suspect)`) and B8b L148 (RV-13's zone assertions, which hold an `evidenceSuspect` field). I read both: neither concerns symbol names.
- The share gap and no retry, on `HEAD`'s build. `share.mjs` indexes one Python file twice. The file has a `0xff` byte in a comment, `import alpha_mod`, `from beta_pkg import z` and `def keep()`. [[ran]] `env -u GIT_… node $A/share.mjs $B $A/work` → `pass 1 filesWritten=1 python={"frontend":"tree-sitter","symbols":true,"imports":true,"resolved":0,"unresolved":0,"files":1} parse_failed_faults=1 symbols=["keep"]` / `pass 2 filesWritten=0 python={…same…} parse_failed_faults=1 symbols=["keep"]`

**Final verdict:** replace.

**Correction:**
- Keep the fallback and its one fault per failed file.
- Count a fallback file of an `imports: true` language in that language's share (a
  `parse_failed` count beside `resolved`/`unresolved`, so the share cannot read as an
  observed zero).
- Mark a fallback file's stored content hash so the next pass in which its grammar is
  available re-parses it (the review's S1(c)).
- Record the untuned `redact(s.name)` (`0e457c7`), the untuned `redact(parsed.error)`
  and the raw-name `isSuspect` (`177e59f`) as correction-pass findings of their origin
  commits. Their fixes: pass `security.entropy_*` from the tuning reader; apply E-39's
  identifier rule to every frontend's names; word-split names before `isSuspect`.

**Still at HEAD:** yes: the share gap and the missing retry (executed on `$B`), and the
three inherited lines (L676, L690, L809).

**Owner question:** none.

### E-18
**Ruling:** Replace stands. It was not second-opinioned, but the swift fact changes it.
The seed's comment certifies its table as "the 31 grammars the pinned runtime loads and
parses error-free on every repeated parse", and names only `lua`'s ERROR trees as a
cause for exclusion. The table keeps `.swift=swift`. The packaged swift grammar (0.4.3)
returns ERROR trees for valid raw strings and loses symbols at `HEAD` with no signal
(E-1, executed). So the comment's certification is false.

The correction must cover the swift row as well as the lua row. The swift row stays,
because removing it would repeat E-1's patch. Its grammar source changes, and until
then its failures are reported per file.

**Evidence:**
- The seed comment at `HEAD`. [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts@HEAD:L64-L65]] "The ext -> grammar table (the 31 grammars the pinned runtime loads and parses // error-free on every repeated parse, plan §4 and Step 15; AD-12/L6)."
- The lua exclusion's stated cause. [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts@HEAD:L67-L68]] "(lua: ERROR trees for valid source after its first parse in a process, with // no throw — Step 15) and fall to the generic frontend."
- The swift row. [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts@HEAD:L93]] "['.swift', 'swift'],"
- Swift's silent symbol loss at `HEAD` (E-1): [[ran]] `node $A/swfe4.mjs $A/bz 0` → third file `[] []`; [[ran]] `node $A/swfe4.mjs $A/bz 1` → `["f","P","g"] ["f","P","g"]`.

**Final verdict:** replace.

**Correction:**
- Restore `.lua=lua`, served by the vendored `@tree-sitter-grammars/tree-sitter-lua`
  0.4.1 WASM (E-1). Until it lands, keep the row and record the exclusion per language.
- Keep `.swift=swift`, served by the rebuilt 0.4.3 WASM (E-1).
- Rewrite the comment to state each remaining exclusion's cause (`elm`, `ql`: ABI;
  `yaml`, `bash`: missing runtime exports) and the scanner-initialisation rule. Drop
  the "error-free on every repeated parse" certification.

**Still at HEAD:** yes: L64–L68 and the missing `.lua` row. `.swift=swift` is served by
the defective packaged grammar.

**Owner question:** none.

### E-19
**Ruling:** Replace is upheld. So are the second opinion's three corrections, each
re-verified here.
1. **The poisoning is a per-process stack leak, and the bound must be per process.**
   - The module's `__stack_pointer` falls 864 bytes on every throw and is never
     restored. It is 77360 after throw 1 and 12560 after throw 76. The next TypeScript
     parse then fails with `RuntimeError: table index is out of bounds`.
   - The pointer is a global of the one `web-tree-sitter` module instance a process
     loads, so the budget is spent per process and carries across passes in it.
   - The review's own end-to-end run shows a second pass in the same process.
   - My count (76) differs from the review's (75) because stack depth at each throw
     differs, so the fix must not rest on a fixed count. Disabling a grammar for the
     life of the process on its first throw bounds throws at one per loaded grammar:
     31 in the default table, 36 shipped plus vendored at most. That stays under
     the measured budget of about 76.
   - Disabling for the rest of the pass, as the first audit and the review say, does
     not bound a multi-pass process.
2. **The ERROR-tree gap is live in the default table now, not only for rare partial
   trees.** On swift raw strings the frontend returns `ok: true` and drops symbols:
   `[]` in place of `["f","P","g"]`, executed at `HEAD` (E-1).
3. **The empty `catch` blocks are swallowed errors with an unverified reason.** There
   are two: around `tree?.delete()` in `finally`, and around `dead?.delete()` in
   `discardParser`. Their comments say an object from a parser that threw "may not
   delete cleanly". Executed: after a throwing `bash` parse, `Parser.delete()`
   succeeds, and so does `Tree.delete()`. The first audit counted the `finally`
   block as holding. Under the brief's fallback test each needs an executed reason,
   or it should let the error surface (or record a fault).

The first audit's remaining gaps stand as it gave them, and are not in dispute:
- the `'unknown'` package-version fallback;
- the hand-assembled `version` (B8's settled digest rule);
- the cached rejected `Parser.init()`;
- the discard that no test needs. Re-planted: removing it survives all nine Step 15
  test files, 52 of 52 passing.

**Evidence:**
- No tree check. [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@HEAD:L420]] "tree = parser.parse(text);" and [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@HEAD:L445]] "return { ok: true, symbols, imports: captured };"
- The two empty catches. [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@HEAD:L394-L397]] "try { dead?.delete(); } catch { // A parser that threw may not delete cleanly; it is unreachable either way." and [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@HEAD:L452-L455]] "try { tree?.delete(); } catch { // A tree from a parser that then threw may not delete cleanly."
- The stack leak. `sp.mjs` runs rounds on `$W`, which exposes `___stack_pointer`. Each round throws the `bash` `case` parse in a fresh `Parser`, reads the pointer, then parses a TypeScript line in a fresh `Parser`.
  - [[ran]] `node $A/sp.mjs $W` → `throw 1 threw sp 77360` / `throw 2 threw sp 76496 delta 864` / `throw 25 threw sp 56624 delta 864` / `throw 50 threw sp 35024 delta 864` / `throw 75 threw sp 13424 delta 864` / `throw 76 threw sp 12560 delta 864` / `typescript parse fails after throw 76 RuntimeError: table index is out of bounds`
  - The unpatched package: [[ran]] `node $A/sp.mjs $O | tail -1` → `typescript parse fails after throw 76 RuntimeError: table index is out of bounds`
- A second pass in the same process is a case the review itself ran. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L99]] "`runIndex`, same process): `filesWritten 0`, `import_edges 0`; every file is"
- The review's wording, now measured. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L89]] "which fits a fixed per-process budget (inference; the count is what was"
- The delete calls do not throw. [[ran]] `node $A/del.mjs` → `parse threw TypeError: resolved is not a function` / `parser.delete after throw: ok` / `tree.delete: ok`
- The discard mutant, over the nine Step 15 test files. [[ran]] `python3 $A/plant.py $B src/index/tree_sitter_frontend.js "export const QUERIES = {" "export const QUERIES = {" <the nine>` → `SURVIVED pass=52 fail=0 []` (baseline); [[ran]] `python3 $A/plant.py $B src/index/tree_sitter_frontend.js "                discardParser();\n" "" <the nine>` → `SURVIVED pass=52 fail=0 []`
- Swift at `HEAD` (E-1): [[ran]] `node $A/swfe4.mjs $A/bz 0` → `["a"] ["a"]` / `["d","E"] ["d","E"]` / `[] []`
- B8's `version` rule. [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B8b.md@HEAD:L139]] "define `version` as a content digest of the grammar, query, and frontend/resolver code rather than a hand-maintained string"

**Final verdict:** replace.

**Correction:**
- Keep the queries, the span conversion and the capability rules.
- Signal ERROR trees per file: a `hasError` count per language in `lang_capabilities`,
  and a fault naming the file. This is required now, for swift.
- Fail, or record a fault, on an unreadable package version. No `'unknown'` in
  `version`.
- Make `version` a content digest of the grammar WASM, the query and the frontend and
  resolver code.
- On a grammar's first throw, disable it for the life of the process. Its remaining
  files take the generic frontend, each with its fault, and are marked for retry
  (E-16).
- Remove both empty `catch` blocks around `delete()`, or record a fault in them. The
  stated reason is not observed.
- Do not cache a rejected `Parser.init()`.
- T-15-4 gains the many-throws case, with a same-process second pass (E-27).

**Still at HEAD:** yes: every gap listed (L302, L323, L394–L398, L420–L445, L451–L456),
executed where marked.

**Owner question:** none.

### E-21
**Ruling:** Replace stands. It was not second-opinioned, but the swift fact changes it.
The first audit found that T-15-6 never asserts its samples are error-free. It is right,
and the swift fact shows the cost.
- T-15-6's swift sample has no raw string.
- With a valid raw-string sample whose symbol survives the ERROR tree, T-15-6 still
  passes.
- It fails only when the defect removes every symbol.

So T-15-6 cannot see swift's defect. Its 31-grammar assertion pins a table that
includes a grammar that errs silently. The header's premise, that every sample parses
without an ERROR node, is true only for the samples chosen.

**Evidence:**
- The unchecked premise. [[middleware/context-oracle/ctxoracle/test/unit/frontend_capabilities.test.ts@HEAD:L9-L10]] "Every sample parses without an ERROR node under its pinned grammar // (executed 2026-09-26, web-tree-sitter 0.25.10)"
- The swift sample. [[middleware/context-oracle/ctxoracle/test/unit/frontend_capabilities.test.ts@HEAD:L59]] "swift: ['Sample.swift', 'import Sibling\n\nfunc answer() -> Int {\n    return 42\n}\n'],"
- The table assertion. [[middleware/context-oracle/ctxoracle/test/unit/frontend_capabilities.test.ts@HEAD:L90]] "assert.deepEqual(seeded, [...TABLE_GRAMMARS].sort(), 'the seeded index.ext_to_grammar table is not the 31-grammar table (lua excluded)');"
- Baseline: [[ran]] `python3 $A/plant.py $B test/unit/frontend_capabilities.test.js "swift: ['Sample.swift'" "swift: ['Sample.swift'" frontend_capabilities` → `SURVIVED pass=1 fail=0 []`.
- A raw string that keeps its symbol: [[ran]] `python3 $A/plant.py $B test/unit/frontend_capabilities.test.js 'func answer() -> Int {\n    return 42\n}\n' 'func answer() -> String {\n    return #"forty-two"#\n}\n' frontend_capabilities` → `SURVIVED pass=1 fail=0 []`. That exact sample's tree has an ERROR node, parsed in fresh `Parser`s after the original sample: [[ran]] `node $A/swsample.mjs` → `orig:false raw:true raw:true raw:true`. The frontend reports success on such a tree: [[ran]] `node $A/swfe.mjs $B` → `frontend parse 1 {"ok":true,"symbols":["g","h"]}` … `hasError 1 true`.
- A raw string the defect strips: [[ran]] `python3 $A/plant.py $B test/unit/frontend_capabilities.test.js "swift: ['Sample.swift', 'import Sibling\n\nfunc answer() -> Int {\n    return 42\n}\n']" "swift: ['Sample.swift', 'import Sibling\n\nfunc f() { print(##\"a\"#b\"##) }\nprotocol P {}\nfunc g() {}\n']" frontend_capabilities` → `KILLED pass=0 fail=1 ['T-15-6: every frontend defaultFrontends returns declares what it does']`.

**Final verdict:** replace.

**Correction:**
- Keep the capability clauses.
- Assert `!rootNode.hasError` for each sample through `web-tree-sitter` directly, on
  every one of repeated fresh-`Parser` parses, not one.
- Give swift a valid raw-string sample. At `HEAD` that assertion fails, which is
  correct: it exposes the defect until the rebuilt swift WASM lands.
- Add a Lua sample, and assert the table E-1's correction produces (`.lua=lua`
  restored).

**Still at HEAD:** yes.

**Owner question:** none.

### E-29
**Ruling:** Replace is upheld. The second opinion adds a case and two qualifications. All
three are upheld, and each was re-verified on `HEAD`'s real indexer, not only on the
resolver.
1. **The `lib/util/json.py` case.** The indexer's `hasTopLevelModule` adds every `.py`
   file's stem at any depth, as well as every directory segment above one. So one
   `lib/util/json.py` makes `import json` in `app/main.py` unresolved. Python would
   import the standard library there: `lib/util` is on no search path Python builds for
   that script.
   - Without that file, `app/main.py` records 0 unresolved imports; with it, 1.
   - `import requests` (undeclared, absent) counts as neither in both runs, so it is
     classed external.
   - That is the ruling's conflict in both directions, in one repository.
2. **The standard-library list must be vendored and version-stated.**
   `sys.stdlib_module_names` is a value inside a Python interpreter, "Added in version
   3.10". A Node resolver cannot read it at index time. The set changes between
   releases (executed): 303 names in 3.10, 305 in 3.11, 300 in 3.12 and 290 in 3.13.
   `distutils` and `imp` are gone in 3.12 and `cgi` in 3.13. So the ruling's test
   needs:
   - a list vendored from a named Python version, updated deliberately;
   - a stated rule for names that exist in only some versions.
3. **The false-edge direction.** The ancestor walk records its first hit as a certain
   edge, and it can be one Python would never make. On `HEAD`'s indexer, `import
   config` in `a/b/x.py` with `a/config.py` present is stored as the edge
   `a/b/x.py → a/config.py`, while `python3 a/b/x.py` fails with
   `ModuleNotFoundError`. The replacement must state this direction, or remove it with
   declared project roots.

**Evidence:**
- The rule and its claimed basis. [[middleware/context-oracle/docs/plans/plan-phase-a.md@d616f1f:L4275-L4277]] "an absolute dotted name is looked up the way Python's `sys.path[0]` rule does for a script — against the importing file's own directory, then each ancestor directory in turn, nearest first"
- The external test. [[middleware/context-oracle/docs/plans/plan-phase-a.md@d616f1f:L4280-L4282]] "hit it is `external` only when no in-repo module or package with the same top-level name (`a`) exists anywhere in the repository (then it is the standard library or an installed distribution)"
- AD-12's external class at the time. [[middleware/context-oracle/docs/architecture-phase-a.md@059dc86:L1401-L1402]] "*external* (a platform builtin, or a package the repository declares as a dependency"
- The settled ruling. [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L133-L134]] "it is standard library or a declared distribution; otherwise it is unresolved (AD-12's own definition)."
- The indexer's breadth. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L738-L739]] "pyTopLevel.add((segs[segs.length - 1] as string).slice(0, -'.py'.length)); for (const d of segs.slice(0, -1)) pyTopLevel.add(d);"
- `sys.path[0]`. [[https://docs.python.org/3/library/sys.html]] "python script.py command line: prepend the script’s directory." and [[https://docs.python.org/3/library/sys.html]] "python -m module command line: prepend the current working directory."
- The standard-library list. [[https://docs.python.org/3/library/sys.html]] "A frozenset of strings containing the names of standard library modules." and [[https://docs.python.org/3/library/sys.html]] "Added in version 3.10."
- The list by version. [[ran]] `for v in 3.10 3.11 3.12 3.13; do /usr/bin/python$v -c "import sys; s=sys.stdlib_module_names; print(sys.version.split()[0], len(s), 'distutils' in s, 'imp' in s, 'cgi' in s)"; done` → `3.10.20 303 True True True` / `3.11.15 305 True True True` / `3.12.3 300 False False True` / `3.13.12 290 False False False`
- The `json` case on `HEAD`'s indexer. `pyjson.mjs` indexes `app/main.py` (`import json`, `import requests`), with and without `lib/util/json.py`. [[ran]] `env -u GIT_… node $A/pyjson.mjs $B $A/work 0` → `lib/util/json.py present=0 app/main.py unresolved_imports=0 python={"frontend":"tree-sitter","symbols":true,"imports":true,"resolved":0,"unresolved":0,"files":1}`; [[ran]] `… 1` → `lib/util/json.py present=1 app/main.py unresolved_imports=1 python={"frontend":"tree-sitter","symbols":true,"imports":true,"resolved":0,"unresolved":1,"files":2}`
- The false edge. [[ran]] `env -u GIT_… node $A/pyedge.mjs $B $A/work` → `edges [{"src":"a/b/x.py","dst":"a/config.py"}]` / `python3 a/b/x.py exit 1 ModuleNotFoundError: No module named 'config'`

**Final verdict:** replace.

**Correction:**
- Keep the finding (root-only lookup hid in-repo imports) and the importer's-directory
  lookup.
- Replace the ancestor walk with the repository's declared Python roots: the directory
  of each `pyproject.toml`/`setup.py`, and a declared `src/` layout's `package-dir`.
  Alternatively keep the walk, call it a heuristic (not "Python's `sys.path[0]` rule"),
  and state its false-edge direction.
- `external` only for a name in a vendored, version-stated standard-library list, or a
  distribution the repository declares (`pyproject.toml`, `requirements*.txt`,
  `setup.cfg`). Everything else is `unresolved`.
- `hasTopLevelModule` goes (E-32), taking the stem-at-any-depth breadth with it.
- T-15-5 gains the `json` with `lib/util/json.py` case, `requests` undeclared (then
  `unresolved`), and the nearest-first case (E-30).

**Still at HEAD:** yes, executed on `$B`.

**Owner question:** none.

### E-37
**Ruling:** Replace is upheld. So are the second opinion's three added misses, each
checked here against the review text and, where it rests on behaviour, executed. The
review record that must correct this one should state six misses, not three:
1. It judged the Python external test "Holds" (first audit).
2. It judged the Lua seed removal "Holds" without the cause (first audit).
3. It kept "sound heuristic" for the `sys.path[0]` walk without a false-edge analysis
   (first audit). The false edge is executed in E-29.
4. **It certified "the 31-grammar table" while swift errs silently on raw strings.**
   - Its swift fuzzing counted throws only ("gave 0 throws").
   - Its m9 scan covered this repository's files only, and the repository tracks no
     swift file at all (`git ls-files '*.swift' | wc -l` → `0`).
   - Swift's ERROR trees and lost symbols are executed at `HEAD` (E-1).
5. **It judged `defaultFrontends` "Holds"** while the function skips a malformed
   `index.ext_to_grammar` member silently (E-14). Executed: members `.py` and
   `=python` vanish, with no error and no fault channel.
6. **Its S1 fix (b) contradicts itself.** It says "per process" and then disables a
   grammar "for the rest of the pass". The leak is per process (E-19: 864 bytes per
   throw, never restored), and the review ran a second pass in the same process
   itself. So a pass-scoped disable does not bound it.

The disposition finding stands. After `ff99487` the only non-audit file changed is the
architecture (`64f46fd`: M3, M4), and STATUS was last written at `fbb9052`, before Step
15. So S1, M1, M2, M5 and m1–m11, fifteen of seventeen, have no disposition on the
record. M60's "plan silence" is settled by the TypeScript handbook and batch 4, as the
first audit says.

**Evidence:**
- [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L24]] "The 31-grammar table, the `QUERIES` coverage rule,"
- [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L107-L108]] "3,000 mutated inputs for each of `cpp`, `php`, `python`, `ruby`, `tlaplus`, `kotlin`, `typescript`, `c_sharp`, `rust` and `swift` gave 0 throws"
- [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L314-L315]] "Executed over this repository (`errtrees.mjs`): 1 of 391 TypeScript files"
- [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L353]] "| `defaultFrontends`: one frontend per queried table grammar, sorted, then generic | **Holds** |"
- The silent skip. [[middleware/context-oracle/ctxoracle/src/index/frontends.ts@HEAD:L18]] "if (eq <= 0) continue;" and [[ran]] `cd $B && node -e "import('./dist/src/index/frontends.js').then(m => { const t = { list: () => ['.py', '=python', '.ts=typescript'] }; console.log(JSON.stringify(m.defaultFrontends(t).map((f) => f.lang))); })"` → `["typescript","*"]`
- [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L113-L115]] "(b) Bound throws per process well under the measured 75: disable a grammar's frontend for the rest of the pass on its first throw"
- [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L99]] "`runIndex`, same process): `filesWritten 0`, `import_edges 0`; every file is"
- The rows the first audit named. [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L349]] "| `resolvePythonImport`: PEP 328 levels; the ancestor lookup; `external` only when no in-repo top-level name | **Holds** |" and [[middleware/context-oracle/docs/reviews/2026-09-26-step-15-build-review.md@ff99487:L356]] "| `.lua=lua` removed from the seed; 31 grammars | **Holds** |"
- History. [[ran]] `git log --format='%h %s' ff99487..HEAD --name-only -- middleware/context-oracle | grep "^middleware" | grep -v "branch-audit" | sort -u` → `middleware/context-oracle/docs/architecture-phase-a.md`; [[ran]] `git log --oneline -1 -- middleware/context-oracle/docs/STATUS.md` → `fbb9052 context-oracle: STATUS — Step 14 built and reviewed; next is Step 15`
- [[middleware/context-oracle/CLAUDE.md@HEAD:L228-L230]] "When a review surfaces findings, apply every finding that holds up. Check each against the source first; a finding you find wrong is rejected with the evidence, on the record — never silently dropped, never a convenient subset."

**Final verdict:** replace.

**Correction:** The review file is not edited. A later review record:
- corrects the two "Holds" rows (Python external test; Lua exclusion) and the M60
  classification;
- states misses 3–6 above: the `sys.path[0]` false edge, swift and the 31-grammar
  claim, the `defaultFrontends` skip, and the pass-scoped bound;
- gives S1, M1, M2, M5 and m1–m11 each an on-record disposition (applied with fix and
  test, or rejected with evidence). S1's disposition uses the per-process bound
  (E-19).

**Still at HEAD:** yes: no disposition record exists, and every open finding's code is
unchanged (ctxoracle source at `HEAD` equals `64f46fd`'s).

**Owner question:** none.

### E-39
**Ruling:** The second opinion's overturn, keep → replace, is upheld. The substance
stands, and both reviews agree on it:
- identifiers get the pattern rules and not the entropy heuristic, which matches
  secret-scanner practice;
- the tuned `security.entropy_*` values are required wherever entropy runs;
- the residual is stated in L5.

The keep fails on scope. The rule covers "a symbol name the parser captured as a
declaration name".
- In the architecture, "parser" names only the tree-sitter runtime (V14) and this line.
  AD-12 calls the generic frontend "line-based definition heuristics".
- The generic frontend is the frontend for shell, `.ps1`, every untabled code file, and
  every fallback file (E-16).
- Read literally, its names stay under the entropy rule, so M4's false positive
  survives for all of those languages. Executed at `HEAD`: a shell function
  `T11_DiscoveryWorkflowTests` captured by the generic frontend is redacted to
  `[redacted:high_entropy]`.
- The indexer redacts every frontend's names through one call.

A plan writer would have to guess which reading is meant. That is "too unclear to act on
without guessing", a flaw under the project's raise-flaws rule, and an engineering one,
so it is corrected here.

**Evidence:**
- [[middleware/context-oracle/docs/architecture-phase-a.md@64f46fd:L2123-L2126]] "**An identifier is not free text:** a symbol name the parser captured as a declaration name gets the pattern rules only, never the entropy heuristic, and the entropy heuristic runs with the tuned `security.entropy_*` values wherever it runs."
- The generic frontend is described as heuristics, not a parser. [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1391-L1392]] "a **generic frontend** (line-based definition heuristics + path/word tokens into FTS)"
- "parser" elsewhere. [[ran]] `git show 64f46fd:middleware/context-oracle/docs/architecture-phase-a.md | grep -n -i -w "parser\|parsers" | cut -c1-60` → `138:| V14 | \`web-tree-sitter\` (0.26.13) and \`tree-sitter-was` / `2123:     **An identifier is not free text:** a symbol name`
- One redaction call for every frontend. [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L690]] "if (used.capabilities.symbols) pf.symbols = parsed.symbols.map((s) => ({ ...s, name: redact(s.name).redacted }));"
- [[ran]] `cd $B && node -e "Promise.all([import('./dist/src/index/generic_frontend.js'), import('./dist/src/security/redact.js')]).then(([g, r]) => { const out = g.genericFrontend.parse('t.sh', Buffer.from('T11_DiscoveryWorkflowTests() {\n  echo ok\n}\n')); for (const s of out.symbols) console.log(s.name, JSON.stringify(r.redact(s.name).redacted)); });"` → `T11_DiscoveryWorkflowTests "[redacted:high_entropy]"`
- Practice. [[https://raw.githubusercontent.com/Yelp/detect-secrets/master/detect_secrets/plugins/high_entropy_strings.py]] "We require quoted strings to reduce noise."
- The residual. [[middleware/context-oracle/docs/architecture-phase-a.md@64f46fd:L2952-L2954]] "A secret written as a declaration name gets only the pattern rules (AD-19: identifiers are not free text)."

**Final verdict:** replace.

**Correction:**
- Keep the rule, the tuned-values clause and L5.
- Change the scope from "a symbol name the parser captured as a declaration name" to "a
  symbol name any frontend (tree-sitter or generic) records as a declaration name".
- The indexer applies it at L690 for both, with the tuned values (E-16).

**Still at HEAD:** yes. The wording is unchanged (the architecture at `HEAD` equals
`64f46fd`'s), and the code redacts every name with the untuned entropy rule.

**Owner question:** none.

## Entries not re-ruled

Neither second-opinioned into dispute nor changed by a verified fact here. The first
audit's verdict stands.

- **Judged by both reviews, agreed keep, no new fact changes them:** E-4, E-5, E-10,
  E-11, E-12, E-13, E-20, E-22, E-25, E-31.
  - E-10: the second opinion's wording correction is accepted. "The only way" is too
    strong: any writer that stores the member before the reader is built works. Its
    plants confirm the ordering both ways, and the verdict is unchanged.
  - E-4: `tuning_seeds.ts` is edited under the corrected Lua and swift decisions too
    (E-18), so the declaration stands.
- **Judged by the first audit only, replace stands:** E-6, E-7, E-8, E-9, E-14, E-15,
  E-17, E-23, E-24, E-26, E-27, E-28, E-30, E-32, E-33, E-34, E-35, E-36, E-38. The
  rulings above add to some corrections without changing any verdict:
  - E-6: "retried on the next pass" means the next pass in which the file's grammar is
    enabled. Under E-19's per-process disable, that can be a later process.
  - E-14: its silent skip is also a miss of the review record (E-37, miss 5).
  - E-15: the Lua regex in the generic frontend is a compensation that goes once Lua is
    structural again (E-1).
  - E-27: the many-throws case must include a second `runIndex` in the same process.
    The leak is per process (E-19), and a per-pass bound passes a one-pass test.
  - E-30 and E-34: T-15-5 gains the `json` with `lib/util/json.py` cell (E-29).
  - E-32: `hasTopLevelModule`'s breadth covers `.py` stems at any depth, not only
    directory segments (E-29). It is replaced either way.

## Summary

| Entry | First audit | Second opinion | Final verdict | Ruled here |
|---|---|---|---|---|
| E-1 | replace | replace | replace | yes |
| E-2 | replace | replace | replace | yes |
| E-3 | replace | — | replace | yes (swift fact) |
| E-4 | keep | keep | keep | no |
| E-5 | keep | keep | keep | no |
| E-6 | replace | — | replace | no |
| E-7 | replace | — | replace | no |
| E-8 | replace | — | replace | no |
| E-9 | replace | — | replace | no |
| E-10 | keep | keep | keep | no |
| E-11 | keep | keep | keep | no |
| E-12 | keep | keep | keep | no |
| E-13 | keep | keep | keep | no |
| E-14 | replace | — | replace | no |
| E-15 | replace | — | replace | no |
| E-16 | replace | replace | replace | yes |
| E-17 | replace | — | replace | no |
| E-18 | replace | — | replace | yes (swift fact) |
| E-19 | replace | replace | replace | yes |
| E-20 | keep | keep | keep | no |
| E-21 | replace | — | replace | yes (swift fact) |
| E-22 | keep | keep | keep | no |
| E-23 | replace | — | replace | no |
| E-24 | replace | — | replace | no |
| E-25 | keep | keep | keep | no |
| E-26 | replace | — | replace | no |
| E-27 | replace | — | replace | no |
| E-28 | replace | — | replace | no |
| E-29 | replace | replace | replace | yes |
| E-30 | replace | — | replace | no |
| E-31 | keep | keep | keep | no |
| E-32 | replace | — | replace | no |
| E-33 | replace | — | replace | no |
| E-34 | replace | — | replace | no |
| E-35 | replace | — | replace | no |
| E-36 | replace | — | replace | no |
| E-37 | replace | replace | replace | yes |
| E-38 | replace | — | replace | no |
| E-39 | keep | replace | replace | yes |

Counts, recounted from the sections and the table above:
- Ruled here: 10 entries (E-1, E-2, E-3, E-16, E-18, E-19, E-21, E-29, E-37, E-39),
  each replace.
  - 1 changed from the first audit, keep → replace: E-39.
  - 9 replaces stand with their corrections amended: E-1, E-2, E-3, E-16, E-18, E-19,
    E-21, E-29, E-37.
- Final verdicts across all 39 entries:
  - keep 10: E-4, E-5, E-10, E-11, E-12, E-13, E-20, E-22, E-25, E-31;
  - replace 29: E-1, E-2, E-3, E-6 … E-9, E-14 … E-19, E-21, E-23, E-24, E-26 … E-30,
    E-32 … E-39;
  - remove 0; undetermined 0.
- Where this adjudication departs from, or adds to, the second opinion:
  - The swift version is established from the published commit's lockfile (0.4.3,
    integrity matched), and from the shipped WASM's own `calloc(0,4)` per parse. No
    swift release from 0.4.0 to 0.7.1 fixes it.
  - Swift loses symbols at `HEAD`, not only ERROR trees: `[]` in place of
    `["f","P","g"]` on the built frontend.
  - A cause-level dynamic check over probe 20's samples finds only `lua` and swift
    state-dependent.
  - The length-0 `deserialize` reset stays required in a rebuilt scanner, on the
    scanner contract's create-once lifecycle, although 0.25.10 does not need it.
  - Swift's fix is a rebuilt, vendored WASM. Its npm package has `install` and
    `postinstall` scripts, and no fixed release exists.
  - Two empty `catch` blocks in `tree_sitter_frontend.ts`, not one. The stated reason
    for both is not observed.
  - E-18 and E-21 carry the swift row and a raw-string T-15-6 sample.
- New defects, each re-verified on my own `64f46fd` build (`HEAD`'s source):
  - swift's silent ERROR trees and lost symbols;
  - the `lib/util/json.py` case, end to end on the indexer;
  - the false `a/config.py` edge, against `python3`;
  - the 864-byte per-throw stack leak;
  - the unobserved delete-failure reason;
  - the `defaultFrontends` silent skip;
  - T-15-6 passing a swift ERROR tree.
  Also recorded as unrecorded origin-commit findings: the untuned `redact(s.name)`
  (`0e457c7`) and `redact(parsed.error)`, and the raw-name `isSuspect` (`177e59f`).
- Still at `HEAD` (`9707cd8`): every defect ruled here.
- Owner questions: none.
