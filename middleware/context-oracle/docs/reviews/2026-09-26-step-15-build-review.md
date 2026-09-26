# Review record — Step 15, the language frontends (commits `bfe963f`, `feb37c9`)

*Point-in-time review record. Written once, never edited. Independent reviewer:
wrote neither the tests nor the code under review. Scope: `git diff
fbb9052..feb37c9 -- ctxoracle/` and the implementation-log's two Step 15
entries, judged against plan Step 15 as amended at `42653ae`, `d616f1f` and
`f22ce6b`, §4's parser-runtime paragraph and `probe:20_grammar_inventory`, §7's
conventions, §12 T-15-1…T-15-6 and the three Step 14 subtests Step 15 retires,
the Step 14 `version` sentence Step 15 implements, and architecture AD-12
(31 usable grammars, capabilities, resolvers, the unresolved share, L6), AD-2
and AD-19 (redaction and injection flagging of symbol names).*

*An earlier reviewer run was lost when the container restarted. It left an
uncommitted draft test file, `test/unit/frontends_review.test.ts` (ten numbered cases, twelve tests),
and scratch notes. This run re-checked every draft case against the plan's
text, re-ran it on the real code, and re-killed it on its mutation before
keeping it. It re-executed every claim taken from the notes; a claim it could
not reproduce is not in this record. `git diff -- ctxoracle/src` was empty
before this run started.*

## Verdict

**The code does what the plan's sentences say, with one Serious and five
Moderate findings open.** The 31-grammar table, the `QUERIES` coverage rule,
the capability declarations, the throw-to-generic fallback, one fault per
failed file, the byte spans (web-tree-sitter reports UTF-16 indices), the
NodeNext resolver rules, PEP 328 levels, the `sys.path[0]` ancestor lookup,
`hasTopLevelModule`, `defaultFrontends` and the three retired Step 14 subtests
all do what the plan says. On this repository the builder's per-language numbers
reproduce: javascript 51 edges / 91 unresolved, python 112 / 42 and tsx 6 / 0
exactly, typescript 1,057 / 18 against the builder's 1,047 / 18 (files added
since `f22ce6b`), one `frontend_parse_failed` and eight path-only files.

The builder's suite overstated what it checks: **37 of 75 hand mutations
survived the T-15 tests and the rest of the suite** — every rule of the span
conversion, the tree-sitter decoder, the module-binding rule, all three
`version` inputs, the scoped-package, subpath and trailing-slash rules, the
TypeScript candidate order, the relative-above-root rule, the real
`hasTopLevelModule`, symbol-name redaction, the `require`, re-export,
import-require, aliased-import and dynamic-import captures, the C# method
pattern, the no-query guard, the generic span and encoding rules, the table
coverage of `defaultFrontends`, and tsx's resolver. This review keeps the
earlier run's twelve draft cases and adds eight; **72 of 75 are now killed**.
The three survivors are two equivalent mutations (M13, M38) and one plan
silence (M60).

**S1 is plan-level.** The recovery rule rests on "the parser instance that
threw is dead afterwards … a fresh one is used next", executed for one throw.
From the 75th throw in one process the whole web-tree-sitter module is corrupt:
every later parse of every grammar fails, and the files that fell back are
never re-parsed. The default table does not reach it on this repository (no
default grammar threw here, or under 30,000 fuzzed inputs), but the
configuration T-15-4 itself uses (`.sh=bash`) does.

Phase-goal check (CLAUDE.md rule 3): S1 turns a configured language into
permanent "observed zero" across every language of the pass, which is G13's
failure. M1 hides every fallback file from the unresolved share that AD-15's
Reuse reads. M2 lets extraction fixes ship without re-parsing stored rows. M3
feeds false symbols from prose and binary files to every genre that reads
symbols (P4). M4 strips the names of 70 real identifiers from this repository's symbol
table, and M5 leaves the AD-19 injection flag unable to fire on any symbol
name. None is polish.

## Findings

### Serious

**S1 — From the 75th throwing parse in one process the web-tree-sitter module
is corrupt. Every later parse of every grammar then fails, and the damage
outlives the process.** `ctxoracle/src/index/tree_sitter_frontend.ts:446-450`
(the catch discards only the `Parser`), `:295-313` (one module, one `Language`
and one `Query` per grammar for the whole process), and
`src/index/indexer.ts:603-610` (the `unchanged` test), which never re-parses a
file whose parse fell back.
- *Standard / evidence.* Plan §4 and Step 15 rest on one executed premise:
  "the parser instance that threw is dead afterwards", so the frontend
  discards it and "a fresh one is used next". That holds for one throw. It
  does not hold for many. Executed against `dist/` with the pinned 0.25.10
  (scratch `poison.mjs`): the bash parse of `f() { case x in a) ;; esac }`
  throws `TypeError: resolved is not a function`, as §4 says. After each throw
  the script re-parses `src/index/indexer.ts` (typescript) and a small Python
  file and compares both results with a baseline taken before the first
  throw. Throws 1–74: identical. After throw 75: typescript returns
  `RuntimeError: memory access out of bounds` and python `RuntimeError: table
  index is out of bounds`, and every later parse fails; a fresh `Parser` does
  not help. The runtime saves and restores the wasm stack pointer only inside
  its `invoke_*` wrappers (`node_modules/web-tree-sitter/tree-sitter.js:2876-2885`),
  not around the top-level parse call a JavaScript exception unwinds through,
  which fits a fixed per-process budget (inference; the count is what was
  measured).
- *End to end (executed, `poison_e2e.mjs`).* A repository with 80 `aNNN.sh`
  files that each contain a `case`, plus `z/app.ts` importing `./util.js` for
  `z/util.ts`, indexed with `defaultFrontends(tuning)` after
  `tuning.addToList(global, 'index.ext_to_grammar', '.sh=bash', 'owner')` —
  the configuration T-15-4 uses. Pass 1: `import_edges 0`, 82
  `frontend_parse_failed`, including `z/app.ts: RuntimeError: table index is
  out of bounds`, and `lang_capabilities.typescript = {frontend: 'tree-sitter',
  imports: true, resolved: 0, unresolved: 0, files: 2}`. Pass 2 (a new
  `runIndex`, same process): `filesWritten 0`, `import_edges 0`; every file is
  judged unchanged, so none is re-parsed. A new process does not repair it
  either, for the same reason. Only a byte change or `--full` does.
- *Exposure.* `bash` is outside the default table, but C-6 makes adding a
  language "a config row", and T-15-4 adds exactly this row. In this
  repository 21 of the 66 tracked `.sh` files throw under `bash` (executed,
  `shcount.mjs`), so a repository about four times as shell-heavy crosses the
  budget in one pass. No default-table grammar threw on this repository, and
  3,000 mutated inputs for each of `cpp`, `php`, `python`, `ruby`, `tlaplus`,
  `kotlin`, `typescript`, `c_sharp`, `rust` and `swift` gave 0 throws
  (`fuzz.mjs`); §11.4 still names eight table grammars whose scanners import
  `abort`/`__assert_fail`, and a throw from any of them counts toward the same
  budget.
- *Fix (plan + code).* (a) Correct §4's premise: a throw can poison the
  module, not only the parser. (b) Bound throws per process well under the
  measured 75: disable a grammar's frontend for the rest of the pass on its
  first throw, so that grammar's remaining files take the generic frontend,
  each with its fault (at most one throw per grammar, 32 with `bash`). (c)
  Store a fallback-parsed file's `content_hash` so the next pass cannot match
  it (for example the hash with a `#fallback` suffix), so a later process
  retries it. (d) Add a T-15-4 case: 80 throwing files, then a `.ts` pair whose
  edge must exist.
- *Owning layer.* Plan (§4's premise and Step 15's catch rule), then code.

### Moderate

**M1 — A file that fell back to the generic frontend is counted nowhere in its
language's unresolved share, so a language whose parses fail reads as
"observed zero".** `indexer.ts:677-693` (a failed file keeps `frontend = null`
and no `imports`, so `unresolved = 0`), `:972-989` (`lang_capabilities` sums
only edges and `unresolved_imports`, and takes `imports: true` from the
language's frontend).
- *Standard / evidence.* AD-12: the unresolved count exists so the share tells
  "observed zero" from "never counted" (CH H4). The generic frontend declares
  `imports: false`, but the file's language still records `imports: true`, so
  the fallback file's imports are neither resolved nor unresolved. S1's
  reproduction shows the record `{imports: true, resolved: 0, unresolved: 0}`
  over two files whose import was lost. In this repository the non-UTF-8
  `skills/api-endpoint-mapper/scripts/scan_endpoint.py` is counted the same
  way (the pass's one `frontend_parse_failed`).
- *Fix (plan sentence, then code).* A fallback-parsed file of an `imports:
  true` language counts as unresolved (for example `unresolved_imports = 1`,
  or a `parse_failed` count in the language record that the share adds to its
  numerator). Add it to T-15-4's assertions.
- *Owning layer.* Plan (Step 15's fallback paragraph is silent on the count),
  then code.

**M2 — A frontend's `version` covers its queries, the package versions and a
hand-kept resolver tag, but not the code that turns a tree into rows. A fix to
span conversion, the module-binding rule or the `from . import` expansion
re-parses nothing.** `tree_sitter_frontend.ts:404`, `generic_frontend.ts:56`
(a hash of the regex sources only), `resolvers.ts:22` (`RESOLVER_RULES_VERSION`,
"changed by hand").
- *Standard / evidence.* Plan Step 14, the interface this step implements:
  "`version` is the frontend's identity …: a string that changes whenever the
  rows `parse` or `resolve` can produce change — a grammar package version, a
  query text, or a resolver rule … a frontend whose output changes without a
  new `version` is re-parsed only by `--full`." AD-12: "'unchanged' covers
  every input". `byteOffsets`, `isModuleBinding`, `expandFromImport`, the kind
  naming and the generic decode and span arithmetic are inputs of the stored
  rows, and none reaches `version`. Mutations M10, M11, M12, M15, M16, M17,
  M25, M26, M63, M76, M78 and M79 below each change stored rows and leave
  every `version` unchanged. The resolver tag reaches `version`, but only a
  person keeps it current, and a missed bump is silent.
- *Fix (code).* Derive the version from the code: at module load, hash the
  compiled text of `tree_sitter_frontend`, `generic_frontend` and `resolvers`
  (`readFileSync(fileURLToPath(import.meta.url))` and the two siblings), in
  place of or beside the hand-kept tag. RV15-3 and RV15-13 pin the parts that
  exist today.
- *Owning layer.* Code.

**M3 — Three quarters of the generic frontend's symbols in this repository are
false: definition-shaped lines in Markdown code blocks and in binary files.**
`generic_frontend.ts:22-35` and `:58-80`, applied to every `unknown`-language
file (`indexer.ts` `frontendFor`).
- *Standard / evidence.* P4 (AD-12 §4): "false symbols poison pointers".
  Executed on this repository (`run1/p.db`): 424 generic symbols, of which
  **317 come from `.md` files** — for example `fetchData`, `getUser` and
  `handleApiError` "defined" in
  `Project-Claude-Configs/Project-Manager/skills/mcp-builder/reference/node_mcp_server.md`
  — and 4 from a binary vector file,
  `skills/codebase-rag-enforcer/test-project/.rag/collections/…/length.bin`
  (`listProjects`, `auth`, `requireRole`). Only 70 come from `.sh` and 28 from
  `.ps1`, which are real. `symbolSearch` returns them, and any genre that reads
  symbols can point at them.
- *Fix (plan, then code).* AD-12's "covers everything else" should say code.
  Either give prose and markup extensions (`.md`, `.markdown`, `.rst`,
  `.adoc`, `.txt`) no symbol extraction (they keep path and word tokens), or
  give the generic frontend a tuning list of extensions it extracts from; in
  either case a file with a NUL byte in its head is binary and gets no
  symbols.
- *Owning layer.* Plan (AD-12 / Step 15), then code.

**M4 — The redactor's high-entropy rule deletes real identifiers: 70 symbol
names in this repository are stored as `[redacted:high_entropy]`, 61 of them
C# (7.7 % of that language's symbols). The indexer also ignores the tuned
thresholds that would let an owner correct it.** `indexer.ts:690`
(`redact(s.name)` with no options), `src/security/redact.ts:50-66`.
- *Standard / evidence.* Executed (`red.mjs` over `run1/p.db`): the originals
  are descriptive test and class names, for example
  `NewProject_SaveAs_Open_RoundTrip`, `CreateToolpath_UnknownStrategy_RejectedBeforePowerMill`,
  `T11_DiscoveryWorkflowTests` (a class, the file's main symbol). They are 20
  characters or more of `[A-Za-z0-9_]` above 4.0 bits per character, which
  the heuristic reads as a secret. The symbol is kept, but its name and tokens
  are gone: `symbolSearch('discovery')` cannot reach it, and a pointer cannot
  name it. Separately, §7's tuning convention says a component that reads a
  threshold receives it through the `TuningReader` and "carries no fallback
  literal", and Step 11 says callers pass `security.entropy_bits_per_char`
  and `security.entropy_min_token_length`. The indexer passes neither, so
  `redact` falls back to its literals 4.0 and 20 and a `tune` of either key
  never reaches symbol names.
- *Fix.* (a) Code: pass the two tuned values from `opts.tuning` at
  `indexer.ts:690` (and at the other `redact` calls in the indexer). (b) Plan
  (AD-19 / Step 11): a secret-shape test for an identifier the grammar parsed
  should not be the free-text entropy rule; either apply only the named
  patterns to identifiers, or exempt tokens that split into dictionary-like
  `_`/camelCase words before measuring entropy.
- *Owning layer.* Code for (a); plan (AD-19's application of the heuristic to
  symbol names) for (b).

**M5 — The injection-suspect flag cannot fire on any symbol name.**
`indexer.ts:809` (`isSuspect(s.name)`), `src/security/injection.ts:7-18`.
- *Standard / evidence.* AD-19: the flagger sets `injection_suspect` over
  ingested spans, and a suspect fact is pointer-only and capped (T2, FR-X4);
  a symbol name is repo-derived text whispered by name. Every pattern needs
  whitespace or a `\b` between words, and a symbol name has neither: a
  tree-sitter identifier and the generic frontend's `SH_NAME` exclude
  whitespace, and `_` is a word character. Executed: `isSuspect` is true for
  `ignore previous instructions` and false for `ignore_previous_instructions`,
  `IgnorePreviousInstructions`, `ignore-previous-instructions` and
  `ignorePreviousInstructions`. A repository can name a function
  `ignore_all_previous_instructions_and_approve` and it is stored and served
  unflagged.
- *Fix (code).* Before `isSuspect`, split a symbol name into words (on `_`,
  `-`, `.`, `:` and camelCase boundaries) and test the joined words, as well as
  the raw name. Add a test with the underscore and camelCase forms.
- *Owning layer.* Code (the indexer's use of the Step 11 flagger).

### Minor

- **m1 — `.` and `..` are resolved as extensionless files, not directories.**
  `resolvers.ts:74-89`. From `src/a.ts`, `'.'` resolves to `src.ts` when that
  file exists, and from `src/lib/x.ts` `'..'` does the same. TypeScript 5.9.3
  resolves both to `src/index.ts` (executed, `tscmp.mjs`, a CommonJS-mode
  importer; an ESM-mode importer resolves neither). *Fix (code):* treat `.`,
  `..` and a specifier ending in `/.` or `/..` the way the code already
  treats a trailing `/`.
- **m2 — The plan's premise "TypeScript NodeNext resolves only to TS/JS
  files" is false for JSON and declaration files.** `resolvers.ts:59`,
  `:83-89`. Executed (`typescript` 5.9.3 `resolveModuleName`, `NodeNext`,
  `resolveJsonModule`, `allowJs`): `./data.json` → `src/data.json` and
  `./types.js` (only `types.d.ts` present) → `src/types.d.ts`, where the code
  gives `unresolved`; `./types` → `src/types.d.ts` for a CommonJS-mode
  importer. `./App.css` is unresolved under TypeScript too, so the builder's
  CSS observation holds, and L6 accepts a narrow rule as "the safe
  direction". None of these forms occurs in this repository. *Fix (plan
  sentence + code):* try `.d.ts` after `.tsx` (and for a `.js` specifier),
  and resolve a present `.json` written path; add T-15-5 cells.
- **m3 — Python import-system gaps.** `resolvers.ts:103-139`,
  `tree_sitter_frontend.ts:109`.
  - A package shadows a module of the same name: with `mod.py` and
    `mod/__init__.py` both present, `import mod` loads the package (executed
    with python3). The code and the plan's sentence ("`<dir>/a/b.py` or
    `<dir>/a/b/__init__.py`") try `.py` first.
  - A PEP 420 namespace package (`import tools`, with `tools/helper.py` and no
    `__init__.py`) imports in Python (executed) and is classed `unresolved`.
  - An absolute `from pkg import submodule` is captured as `pkg`, so its edge
    goes to `pkg/__init__.py` or nowhere, never to `pkg/submodule.py`, while the
    relative form is expanded.
  - `from . import name` whose `name` is an attribute of `__init__.py` is
    counted unresolved (the builder's observation, which holds). Python
    imports the package itself first, so falling back to its `__init__.py` on
    a miss is exact.
  - `from . mod import w` (whitespace after the dots, valid Python) is
    captured as `. mod` and rejected as unresolved.
  - The plan calls the ancestor walk "Python's `sys.path[0]` rule". `sys.path[0]`
    is the script's own directory only; the ancestors stand for project roots
    placed on `sys.path` by `-m`, pytest or an installed package. The rule is
    a sound heuristic, but the sentence should say so.

  Executed over the 98 tracked `.py` files (`pyfrom.mjs`): 289 absolute
  `from` imports, 0 of the submodule, namespace or whitespace forms, so this
  repository's 118 / 42 / 431 split is unaffected. *Fix (plan + code):* try
  `__init__.py` before `.py`; count a directory with `.py` files beneath it
  as a namespace package; add the submodule candidate for `from pkg import x`;
  fall back to `__init__.py` for `from . import name`.
- **m4 — `hasTopLevelModule` counts any directory segment above a `.py` file**
  (`indexer.ts:730-743`, the plan's rule as written). A standard-library import
  whose name matches such a directory anywhere in the repository (`types/`,
  `test/`, `email/`) becomes `unresolved`. The only overlap in this repository
  is `profile`, and nothing imports it. *Fix (plan):* count a segment only when
  it is a directory the importer's ancestor walk could import from.
- **m5 — The symbol rule is applied unevenly across grammars** (executed,
  `langs.mjs`). C# namespaces with a dotted name are never captured (`name:`
  is a `qualified_name`): 65 of this repository's 66 namespaces. File-scoped
  namespaces (`namespace A.B;`), TypeScript `namespace`, `declare const` and
  `var`, and Python and Ruby top-level constants are not captured. TS/JS `let`
  is kinded `const`; Swift `struct` and `enum` are kinded `class`; Python
  methods are kinded `function`. Functions nested in functions and Go types
  declared in a function body are captured; the builder's rule excludes only
  local *variables*, so that holds as written, but it is worth stating.
- **m6 — Symbol names have no length bound.** `SH_NAME` and tree-sitter
  identifiers accept a name as long as the file (up to the 1 MB cap). ASVS 5.0
  V5 bounds input. *Fix (code):* drop or truncate names over a fixed length
  (for example 256 characters) before storage.
- **m7 — Two common shell function styles are missed**: `foo ()` or
  `function foo` with `{` on the next line (bash grammar: `fname () compound-command`,
  and the compound command may start on the next line). This repository has
  none.
- **m8 — A rejected `Parser.init()` is cached for the life of the process**
  (`tree_sitter_frontend.ts:302`, `??=`), while a rejected `Language.load` is
  deliberately not cached "so a later pass may find the file restored". The two
  should agree.
- **m9 — A tree with ERROR nodes that does not throw is stored with no
  signal.** The plan excluded `lua` for this at grammar level, but any grammar
  can return a partial tree for a file it cannot fully parse. Executed over
  this repository (`errtrees.mjs`): 1 of 391 TypeScript files
  (`ctxoracle/test/unit/indexer_frontends.test.ts`, a labelled tuple type) and
  1 of 109 JavaScript files (a deliberately broken fixture). *Fix (plan +
  code):* count `rootNode.hasError` files per language in `lang_capabilities`
  (or as a fault), so partial coverage is measured.
- **m10 — T-15-4's "the exhausted parser instance is reused" clause cannot
  fail.** The frontend calls `setLanguage` before every parse, and executed
  (`reuse.mjs`): a parser that threw throws again on its next plain `parse`,
  but after `setLanguage` it parses cleanly. So mutation M13 (never discard
  the parser) is equivalent, and §4's "dead afterwards" is true only for a
  parser that is not reset. *Fix (plan):* state that `setLanguage` resets it,
  and let T-15-4's reuse clause rest on the deleted-instance case (M64, which
  it does kill).
- **m11 — The order of the written `.js` path and its `.ts` source is not
  stated.** The plan says "the written path if it exists, and a
  `.js`/`.jsx`/`.mjs`/`.cjs` specifier also tries its source". The builder
  tries the source first, which is TypeScript's order (executed: with both
  `decl.js` and `decl.d.ts`, TypeScript picks the declaration). Mutation M60
  (written path first) survives. *Fix (plan):* state the order.

## The builder's decisions and observations — judged

| Decision or observation (implementation log) | Holds? | Evidence |
|---|---|---|
| T-15-2 pinned before the build (it passed on the skeleton) | **Holds** | The builder recorded the skeleton's output for the test's input. T-15-2 pins behaviour, and RV15-9 and RV15-18 now pin the generic spans it does not. |
| `QUERIES` for 25 of the 31 table grammars plus `bash`; none for `css`, `html`, `json`, `toml`, `embedded_template`, `vue` | **Holds** | The four formats have no named declaration of the kind a symbol is. The `vue` and `embedded_template` grammars expose the embedded code as an opaque text node (`script_element`/`raw_text`, `code`), so a query would find nothing there. `lang_capabilities` records `generic` for them (this repository: `json`, `toml`, `html`). |
| Imports captured and resolved only for `typescript`, `tsx`, `javascript`, `python` | **Holds** | Plan's text. RV15-16 now pins the set, including tsx's resolver (M74). |
| `treeSitterFrontend` throws for a grammar with no `QUERIES` entry | **Holds** | Plan: such a grammar "is not given a tree-sitter frontend at all". RV15-4 pins it (M20). The lookup uses `Object.hasOwn`, so `__proto__`-style names cannot reach `RESOLVERS` or the `.wasm` path. |
| `Parser.init()` once per process; `Language.load` and `new Query` once per grammar per process; a rejected load not cached | **Holds, with a gap** | Queries and languages live for the process, which the plan allows (AD-1). A rejected `Parser.init()` is cached (m8). |
| `parse` never throws; any throwable → `{ok: false}` and the parser is discarded | **Holds for one throw; the premise fails at 75 (S1)** | The discard is also redundant: `setLanguage` before each parse resets a parser that threw (executed, m10), so M13 is equivalent. |
| Non-UTF-8 content → `{ok: false}`, then the generic fallback and one fault | **Holds, with M1** | RV15-2 pins the fallback's byte spans. The fault text says "content is not valid UTF-8", which names the cause. The file is not counted in the share (M1). |
| Spans converted from UTF-16 code units to bytes | **Holds** | `node_modules/web-tree-sitter/lib/tree-sitter.c:36-38` (`byte_to_code_unit` returns `byte >> 1`). RV15-1, RV15-12 and RV15-18 pin 2-, 3- and 4-byte characters, the Latin-1 range and a BOM (M10–M12, M63, M78). |
| `version` = grammar, runtime and grammar-package versions, query hash, resolver tag | **Holds for what it names; incomplete (M2)** | RV15-3 and RV15-13 pin the query, resolver and package parts (M18, M19, M65). The extraction code is not covered. |
| `resolveTsImport` rules, `.js` source tried before the written path, trailing slash → index only | **Holds** | Compared with TypeScript 5.9.3 `resolveModuleName` (NodeNext) on a scratch tree: every T-15-5 cell, the trailing slash and the source-first order agree. Exceptions: `.`/`..` (m1), `.json`/`.d.ts` (m2). The order is a plan silence (m11). |
| `resolvePythonImport`: PEP 328 levels; the ancestor lookup; `external` only when no in-repo top-level name | **Holds** | Plan text as amended at `d616f1f`. This repository reproduces the builder's numbers: python 112 edges / 42 unresolved (`run1`). Gaps against the import system are m3. |
| PLAN-FLAW: root-only lookup classed 116 in-repo imports external | **Holds** | Routed and fixed in the plan (option A), then built. The share moved from 0.000 to 0.273, the honest direction AD-12 intends. |
| `RepoFiles.hasTopLevelModule` built once per pass from the present set | **Holds** | Plan's rule, pinned by RV15-6 on the real indexer (M46, M47). Its breadth is m4. |
| Generic frontend: identifier-shape regexes, shell names as any bash word, span = the definition line without indentation, latin1 for non-UTF-8 | **Holds, with M3** | RV15-2, RV15-9 and RV15-18 pin encoding and spans (M25–M27, M79). It extracts from prose and binary files (M3); names are unbounded (m6). |
| `defaultFrontends`: one frontend per queried table grammar, sorted, then generic | **Holds** | RV15-16 pins the list against the seeded table (M71). |
| Generic fallback in the indexer: one fault, generic symbols, no edges | **Holds, with S1 and M1** | T-15-4 kills M48b, M49 and M69. |
| The generic frontend's `init` awaited whenever the list holds it and anything is walked | **Holds** | Plan's text. It is a no-op for `genericFrontend`, so the change is not observable with that frontend. |
| `.lua=lua` removed from the seed; 31 grammars | **Holds** | T-15-6 compares the seeded table with the 31 (M54). |
| Three Step 14 `todo` subtests retired | **Holds** | Read in the diff: the `todo` options and the typed alias are gone, the assertions are unchanged, and all three pass (`# todo 1` is Step 28's skeleton mark only). |
| `cli/index.ts` and `cli/init.ts` call `defaultFrontends(tuning)` | **Holds** | D-plan-29 and Steps 28 and 31 state that call; only the argument changed, and both files keep their `SKELETON: 14` marks for their owning steps. |
| Which definitions are symbols; module bindings dropped (`isModuleBinding`) | **Holds as written** | RV15-8 and RV15-17 pin the `require` and top-level `await import()` forms (M16, M76). The rule is applied unevenly across grammars (m5). |
| Python absolute `from X import y` captured as `X`; `from . import *` as `.` | **Holds for the plan's text** | RV15-15 pins `.`/`..` → the package `__init__.py` (M67). The submodule edge is lost (m3). |
| Observation: `from . import name` for an `__init__` attribute counts unresolved | **Holds** | Falling back to `__init__.py` is exact (m3). |
| Observation: a TS/JS import of `./App.css` is unresolved | **Holds** | TypeScript resolves it to nothing as well (executed). L6 accepts the narrow direction. JSON and declaration files are different (m2). |
| Observation: RV-25 (Step 14 review) still passes against the built generic frontend | **Holds** | Its assertion is the generic frontend's capabilities, which T-15-2 also pins. |

## Other checks against established practice (no finding)

- **web-tree-sitter memory.** Every `Tree` is deleted in a `finally`, including
  after a throw. The `Parser` is deleted when discarded. `Language` and `Query`
  objects are cached for the process and never deleted, which is bounded by the
  grammar count. Nodes are plain JavaScript objects in 0.25 and need no
  deletion.
- **Resource bounds.** The indexer's caps (1 MB, 20,000 lines) apply before a
  parse. Executed: 100,000 nested brackets parse in 129–359 ms for typescript,
  python and c_sharp with no throw (`deep.mjs`). `byteOffsets` allocates one
  `Uint32Array` of the text's length, at most 4 MB. `query.matches` runs with
  the runtime's default match limit and no timeout; no pathological case was
  found.
- **NodeNext.** For relative specifiers the resolver is the union of
  TypeScript's CommonJS-mode and ESM-mode rules (an ESM-mode importer resolves
  no extensionless specifier). That errs toward resolving, not toward false
  edges. Bare specifiers: `node:` and `module.builtinModules`, including a
  builtin subpath (`fs/promises`), and the package name of a scoped or subpath
  specifier (RV15-5).
- **Python captures.** `from __future__ import …` is a
  `future_import_statement` and is not captured, so the 24 such lines in this
  repository count nowhere, which is right. `import a, b.c` yields both names,
  and `import d as e` yields `d` (executed, `langs.mjs`).
- **Redaction and injection of the fault text.** A parse error is redacted
  before it is recorded and truncated to `ERROR_MAX_CHARS`. tree-sitter errors
  carry no file content.
- **Symbols on this repository** (`sample.mjs`, three random files per
  language, read against the sources): TypeScript (`coupling.ts`: the exported
  `couplingGenerator` const and its method; `tsc_fixture.ts`: interface, const,
  function), JavaScript (`server.js`: `app`, `PORT`, `start`; `User.js`:
  schema const, method, model const), Python (`connections.py`: 4 classes and
  13 methods; `profile.py`: 17), C# (`OutputCapTests.cs` and two other test
  files: class, constructor and test methods). Every stored symbol names a real
  declaration, apart from the redacted C# names (M4) and the missing dotted
  namespaces (m5).

## Hand mutation testing

Method: one textual mutation per run, applied to the real `src/` file, then
`npm run build && npm test` (the full suite, not only the frontend files). A
non-zero exit counts as killed. Every mutation compiled. The harness restored
each file from its saved text and then ran `git checkout -- <file>`, and
logged each apply and revert before and after its run, so a restart could not
leave a mutation behind. Afterwards `git diff --stat -- ctxoracle/src` was
empty. One run gives both columns: **Before** counts a mutation killed when a
test other than this review's `RV15-*` failed; **After** counts any failure.
The mutation set was seeded from the lost run's list and extended; every row
below is this run's execution. "Tests that kill it" names the failures that
decide the Before column when it is killed, and the `RV15-*` failures
otherwise.

**Score.** 75 mutations: queries ×11, capabilities and the resolver table ×3,
span conversion and the tree-sitter decoder ×6, parse error path and parser
discard ×3, module binding and `from` expansion ×3, `version` ×3, the no-query
guard ×1, generic regexes, spans and encoding ×9, `resolveTsImport` (with the
shared root-climb guard) ×15, `resolvePythonImport` ×9, `hasTopLevelModule` ×2,
the indexer's fallback ×4, `defaultFrontends` and the seed ×6.
- **Before this review's tests:** 38 killed / 75 (50.7 %).
- **After:** 72 / 75 (96.0 %). Survivors:
  - M13 is equivalent: the frontend calls `setLanguage` before every parse, and
    that resets a parser that threw (executed, m10).
  - M38 is equivalent: a normalized path that climbs above the root starts with
    `../`, and no `RepoFiles` path does, so every candidate misses either way
    (the Python climb has its own guard, M45, which is killed).
  - M60 is a plan silence (m11).

| # | Mutation | File:line | Before | After | Tests that kill it |
|---|---|---|---|---|---|
| M01 | TS defs: drop function_declaration pattern (typescript/tsx) | `src/index/tree_sitter_frontend.ts:55` | killed | killed | T-14-3 (Step 15), T-14-5 (Step 15), T-15-1 |
| M02 | JS imports: drop require() pattern | `src/index/tree_sitter_frontend.ts:79` | survived | killed | RV15-8 |
| M03 | JS imports: drop static import_statement pattern | `src/index/tree_sitter_frontend.ts:76` | killed | killed | T-14-3 (Step 15), T-15-1, T-15-3 (fts: false) |
| M04 | Python: drop relative_import-with-name pattern | `src/index/tree_sitter_frontend.ts:110` | killed | killed | T-15-3, T-15-6 |
| M05 | Python: drop @import.from (dots-only) pattern | `src/index/tree_sitter_frontend.ts:111` | killed | killed | T-15-3 |
| M06 | Python: drop plain import_statement pattern | `src/index/tree_sitter_frontend.ts:107` | killed | killed | T-14-3 (Step 15) |
| M07 | C#: drop method_declaration pattern | `src/index/tree_sitter_frontend.ts:127` | survived | killed | RV15-10 |
| M08 | capabilities: imports always true | `src/index/tree_sitter_frontend.ts:387` | killed | killed | T-15-6 |
| M09 | RESOLVERS: python has no resolver | `src/index/tree_sitter_frontend.ts:289` | killed | killed | T-14-3 (Step 15), T-15-3 (fts: false), T-15-3 (fts: true) |
| M10 | span: 2-byte UTF-8 chars counted as 1 | `src/index/tree_sitter_frontend.ts:349` | survived | killed | RV15-12, RV15-1 |
| M11 | span: surrogate pair counted as 3 bytes | `src/index/tree_sitter_frontend.ts:354` | survived | killed | RV15-1 |
| M12 | span: no UTF-16 to byte conversion | `src/index/tree_sitter_frontend.ts:342` | survived | killed | RV15-12, RV15-18, RV15-1 |
| M13 | parse error: parser not discarded after a throw | `src/index/tree_sitter_frontend.ts:449` | survived | survived | — |
| M14 | parse error: a throw returns ok with no symbols | `src/index/tree_sitter_frontend.ts:450` | killed | killed | T-15-4 |
| M15 | non-UTF-8: tree-sitter decoder not fatal | `src/index/tree_sitter_frontend.ts:339` | survived | killed | RV15-2 |
| M16 | module bindings (const x = require()) kept as symbols | `src/index/tree_sitter_frontend.ts:436` | survived | killed | RV15-17, RV15-8 |
| M17 | expandFromImport: from . import mod captured as . | `src/index/tree_sitter_frontend.ts:374` | killed | killed | T-15-3 |
| M18 | version: query hash dropped | `src/index/tree_sitter_frontend.ts:404` | survived | killed | RV15-3 |
| M19 | version: resolver rules version dropped | `src/index/tree_sitter_frontend.ts:404` | survived | killed | RV15-3 |
| M20 | no-query grammar: treeSitterFrontend guard removed (empty query) | `src/index/tree_sitter_frontend.ts:380` | survived | killed | RV15-4 |
| M21 | generic: POSIX name() { shell form removed | `src/index/generic_frontend.ts:34` | killed | killed | T-14-5 (Step 15), T-15-2, T-15-3 (fts: false) |
| M22 | generic: function name { keyword form removed | `src/index/generic_frontend.ts:33` | killed | killed | T-15-2 |
| M23 | generic: shell names restricted to identifiers | `src/index/generic_frontend.ts:19` | killed | killed | T-14-5 (Step 15) |
| M24 | generic: declares imports: true | `src/index/generic_frontend.ts:54` | killed | killed | RV-25: the skeleton generic fr, T-14-6 (m6), T-15-2 |
| M25 | generic: non-UTF-8 decoded lossy as utf8 (spans drift) | `src/index/generic_frontend.ts:48` | survived | killed | RV15-2 |
| M26 | generic: span start includes indentation | `src/index/generic_frontend.ts:72` | survived | killed | RV15-18, RV15-9 |
| M27 | generic: Python def regex removed | `src/index/generic_frontend.ts:27` | survived | killed | RV15-2, RV15-9 |
| M28 | TS: .js specifier does not try .ts source | `src/index/resolvers.ts:53` | killed | killed | T-14-3 (Step 15), T-15-1, T-15-3 (fts: false) |
| M29 | TS: .mjs does not try .mts | `src/index/resolvers.ts:55` | killed | killed | T-15-5 |
| M30 | TS: .tsx not appended | `src/index/resolvers.ts:59` | killed | killed | T-15-5 |
| M31 | TS: /index.* not tried for extensionless | `src/index/resolvers.ts:89` | killed | killed | T-15-5 |
| M32 | TS: extensionless tries written path first | `src/index/resolvers.ts:89` | killed | killed | T-15-5 |
| M33 | TS: node: prefix not external | `src/index/resolvers.ts:91` | killed | killed | T-15-5 |
| M34 | TS: builtins not external | `src/index/resolvers.ts:94` | killed | killed | T-15-5 |
| M35 | TS: undeclared bare package external | `src/index/resolvers.ts:95` | killed | killed | T-15-5 |
| M36 | TS: scoped package name truncated to @scope | `src/index/resolvers.ts:66` | survived | killed | RV15-5 |
| M37 | TS: trailing-slash specifier not directory-only | `src/index/resolvers.ts:77` | survived | killed | RV15-5 |
| M38 | TS/PY: climb above repo root not rejected | `src/index/resolvers.ts:30` | survived | survived | — |
| M39 | PY: n dots climbs n parents (off by one) | `src/index/resolvers.ts:117` | killed | killed | T-15-3 (fts: false), T-15-3 (fts: true), T-15-3 |
| M40 | PY: absolute name looked up in own directory only | `src/index/resolvers.ts:133` | killed | killed | T-14-3 (Step 15), T-15-5 (ancestor lookup cell), T-15-5 |
| M41 | PY: absolute name looked up at repo root only | `src/index/resolvers.ts:129` | killed | killed | T-15-5 (ancestor lookup cell) |
| M42 | PY: no-hit absolute name always external | `src/index/resolvers.ts:139` | killed | killed | T-15-5 (ancestor lookup cell) |
| M43 | PY: hasTopLevelModule asked the full dotted name | `src/index/resolvers.ts:139` | killed | killed | T-15-5 (ancestor lookup cell) |
| M44 | PY: package __init__.py candidate dropped | `src/index/resolvers.ts:107` | killed | killed | T-15-5 |
| M45 | PY: relative above repo root not rejected | `src/index/resolvers.ts:118` | survived | killed | RV15-5 |
| M46 | indexer hasTopLevelModule: directory segments ignored | `src/index/indexer.ts:739` | survived | killed | RV15-6 |
| M47 | indexer hasTopLevelModule: .py stems ignored | `src/index/indexer.ts:738` | survived | killed | RV15-6 |
| M49 | indexer: failed parse records no fault | `src/index/indexer.ts:676` | killed | killed | T-15-4 |
| M50 | indexer: fallback symbols not redacted | `src/index/indexer.ts:690` | survived | killed | RV15-7 |
| M51 | defaultFrontends: generic not appended | `src/index/frontends.ts:22` | killed | killed | T-14-5 (Step 15), T-15-3 (fts: false), T-15-3 (fts: true) |
| M52 | defaultFrontends: every QUERIES grammar (ignores the table) | `src/index/frontends.ts:22` | killed | killed | T-15-6 |
| M53 | defaultFrontends: table grammar without QUERIES included | `src/index/frontends.ts:20` | killed | killed | Checkpoint 1R, RV-26: the skeleton `index` ve, T-14-3 (Step 15) |
| M54 | tuning seed: .lua=lua restored | `src/stores/dao/tuning_seeds.ts:83` | killed | killed | T-15-6 |
| M55 | defaultFrontends: members parsed from the wrong side of = | `src/index/frontends.ts:19` | killed | killed | T-14-3 (Step 15), T-14-5 (Step 15), T-15-3 (fts: false) |
| M48b | indexer: no generic fallback after a failed parse (compiling form) | `src/index/indexer.ts:680` | killed | killed | T-15-4 |
| M56 | Python: aliased import (import a.b as c) pattern dropped | `src/index/tree_sitter_frontend.ts:108` | survived | killed | RV15-14 |
| M57 | JS: re-export source (export ... from) pattern dropped | `src/index/tree_sitter_frontend.ts:78` | survived | killed | RV15-14 |
| M58 | TS: import x = require() pattern dropped | `src/index/tree_sitter_frontend.ts:83` | survived | killed | RV15-14 |
| M59 | JS: dynamic import() pattern dropped | `src/index/tree_sitter_frontend.ts:80` | survived | killed | RV15-17, RV15-8 |
| M60 | TS: .js specifier tries the written path before its source | `src/index/resolvers.ts:85` | survived | survived | — |
| M61 | TS: appended order .js before .ts | `src/index/resolvers.ts:59` | survived | killed | RV15-11 |
| M62 | TS: written TS/JS path not tried (source only) | `src/index/resolvers.ts:85` | survived | killed | RV15-11, RV15-8 |
| M63 | span: Latin-1 range treated as ASCII (fast path too wide) | `src/index/tree_sitter_frontend.ts:342` | survived | killed | RV15-12 |
| M64 | parse error: discarded parser not cleared (deleted instance reused) | `src/index/tree_sitter_frontend.ts:392` | killed | killed | T-15-4 |
| M65 | version: runtime package versions dropped | `src/index/tree_sitter_frontend.ts:404` | survived | killed | RV15-13 |
| M66 | PY: dotted name not split into path segments | `src/index/resolvers.ts:106` | killed | killed | T-15-5 (ancestor lookup cell), T-15-5 |
| M67 | PY: dots-only relative (from . import *) resolves nothing | `src/index/resolvers.ts:105` | survived | killed | RV15-15 |
| M68 | TS: bare specifier name check uses the whole specifier (subpath imports unresolved) | `src/index/resolvers.ts:69` | survived | killed | RV15-5 |
| M69 | indexer: fallback file keeps no symbols (generic result discarded) | `src/index/indexer.ts:681` | killed | killed | T-15-4 |
| M70 | generic: shell keyword form requires () | `src/index/generic_frontend.ts:33` | killed | killed | T-15-2 |
| M71 | defaultFrontends: one table grammar (c_sharp) left out | `src/index/frontends.ts:20` | survived | killed | RV15-16 |
| M74 | RESOLVERS: tsx has no resolver (declares imports: false) | `src/index/tree_sitter_frontend.ts:287` | survived | killed | RV15-16, RV15-3 |
| M76 | module binding: top-level await import() binding kept as a symbol | `src/index/tree_sitter_frontend.ts:278` | survived | killed | RV15-17 |
| M78 | tree-sitter decoder strips a BOM (spans shift 3 bytes) | `src/index/tree_sitter_frontend.ts:339` | survived | killed | RV15-18 |
| M79 | generic decoder strips a BOM (spans shift 3 bytes) | `src/index/generic_frontend.ts:37` | survived | killed | RV15-18 |

## Tests added (20 cases, `test/unit/frontends_review.test.ts`)

Real `web-tree-sitter` and `tree-sitter-wasms`, real `node:sqlite`, real git
and `runIndex`. The resolver cases use the same literal-path `RepoFiles` fake
T-15-5 uses, whose contract is pure over that interface. Each case quotes the
plan sentence it pins in its comment, passes on `feb37c9`'s code, and fails on
the mutations named, as the After column shows. None changes `src/`.

- *Kept from the lost run's draft, each re-checked, re-run and re-killed:*
  RV15-1 spans with 2-, 3- and 4-byte characters (M10, M11, M12). RV15-2 a
  non-UTF-8 Python file falls back with byte-exact spans (M15, M25, M27).
  RV15-3 `version` follows the query text and names the resolver rules (M18,
  M19). RV15-4 no tree-sitter frontend for a grammar without a query (M20).
  RV15-5 (three cases) scoped and subpath packages and a builtin subpath (M36,
  M68); the trailing slash and the `.jsx`/`.cjs` sources (M37); a relative
  Python specifier above the root (M45). RV15-6 the real `hasTopLevelModule`
  (M46, M47). RV15-7 a secret-shaped symbol name is redacted (M50). RV15-8
  `require` and dynamic import edges, and a `require` binding is no symbol
  (M02, M16). RV15-9 a generic span starts at the definition (M26). RV15-10 the
  C# declaration kinds (M07). The one change: RV15-5's second case is
  retitled to name all three things it checks, and its TypeScript note now
  says the executed resolution is a CommonJS-mode importer's.
- *Added by this run:* RV15-11 the written TS/JS path and the appended order
  (M61, M62). RV15-12 Latin-1-only non-ASCII spans (M63). RV15-13 `version`
  names the installed runtime and grammar package versions (M65). RV15-14 the
  re-export, import-require and Python aliased-import edges (M56, M57, M58).
  RV15-15 `.` and `..` resolve to the package `__init__.py` (M67). RV15-16
  `defaultFrontends` is exactly the queried table grammars, generic last, with
  `imports: true` for exactly the four (M71, M74). RV15-17 a top-level `await
  import()` binding is no symbol (M76). RV15-18 BOM files keep byte-exact spans
  in both frontends (M78, M79).

Not added: tests for S1, M1–M5 and m1–m11. They are defects, and each test
would fail until its fix lands. Each finding quotes its executed reproduction;
the scratch scripts named there drove `dist/`, TypeScript 5.9.3's resolver,
python3, and this repository indexed into a scratch store (`run1`).

## Verification actually run (2026-09-26)

- `cd ctxoracle && npm run build && npm test` →
  - build: `tsc -p tsconfig.json`, exit 0, no diagnostics;
  - test: exit 0, `# tests 329`, `# pass 328`, `# fail 0`, `# cancelled 0`,
    `# skipped 0`, `# todo 1`. The one `todo` is Step 28's `skeleton_e2e`
    mark. Before this review the builder's suite was `# tests 309`,
    `# pass 308`, `# todo 1`.
- The frontend, resolver, indexer-frontend and retired-subtest files
  (`tree_sitter_frontend`, `tree_sitter_frontend_fallback`, `generic_frontend`,
  `frontend_capabilities`, `import_resolvers`, `indexer_frontends`,
  `frontends_review`, `indexer_walk`, `search_semantics`), 3 more runs: exit 0,
  `# tests 52 # pass 52 # fail 0 # todo 0` each time.
- `node middleware/context-oracle/.claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check middleware/context-oracle/docs/plans/plan-phase-a.md`
  → exit 0, `OK: 40 steps, 13 elements, 165 test specs, 27 probes cited, regions current`.
- `(cd middleware/context-oracle && python3 tools/check_docs.py)` → exit 0,
  `context-oracle doc-consistency check passed.`
- `git diff --stat -- ctxoracle/src` → empty (every mutation reverted; no
  source change). This repository indexed into a scratch store left `git
  status` unchanged apart from the new test file. git 2.43.0, Node 22.22.2,
  web-tree-sitter 0.25.10, tree-sitter-wasms 0.1.13, TypeScript 5.9.3.
