<!-- Independent collapse-hunt output, 2026-09-11, written once and never edited (CLAUDE.md routing table). Produced by a fresh subagent with no exposure to the author session, against the proposal it quotes; scratchpad paths inside are that subagent's working directories and no longer exist. -->

# Collapse-hunt: proposed re-derivation of D-plan-2 (dependency pins)

Hunter: independent session, 2026-09-11. Inputs chosen by the hunter; every
claim below was executed in `/tmp/claude-0/-home-user-agent-armory/aecd2e03-9f0c-51c6-8a91-24394dcc5512/scratchpad/ch/`
(own `npm install`s of web-tree-sitter 0.25.9, 0.25.10, 0.26.0, 0.26.3,
0.26.8, 0.26.13, 0.27.0, each with tree-sitter-wasms 0.1.13; own scripts;
Node v22.22.2 and, where stated, real v22.16.0 via `npx -y node@22.16.0`).
Nothing under `/home/user/agent-armory` was edited.

Phase goal held against (CLAUDE.md rule 3): an honest deterministic foundation
running on the owner's real repos that measures its own floor. A pin whose
stated load property is partly false, or whose grammar coverage is asserted
against a table the plan never wrote down, fakes completeness — that is the
failure class judged here, not merely whether 0.25.10 is "a version that works".

## VERDICT: DOES NOT SURVIVE (as written)

The direction survives: 0.25.10 is the newest web-tree-sitter that loads the
grammars tree-sitter-wasms 0.1.13 ships, and every 0.26.x/0.27.0 loads none
(executed: 0.26.0, 0.26.3, 0.26.8, 0.26.13, 0.27.0 — 0 of 36 each). The
decision text does not survive: its central load claim ("loads every grammar
Step 12's default table names and parses") is asserted against a table the
plan never enumerates, is false for four shipped grammars (elm, ql, yaml, bash
— two of which the proposal counts as loading), and the package.json/tsconfig
it re-pins cannot compile a module that imports web-tree-sitter under either
the old or the new pin. The "five or more grammars" fact handed to the hunter
is wrong (cumulative side-module data size, not count). "A bump remains
architecture work" contradicts the decision's own act. Findings F1–F9 must be
absorbed before the text is written into the plan.

---

## F1 — The claim is asserted against a table the plan never writes down

**What is wrong.** The proposed text: "0.25.10 loads every grammar Step 12's
default `ext_to_grammar` table names [TO BE CONFIRMED against the table] and
parses." The plan contains no such table. Step 12 (plan:1935–1936) says the
list-valued key `index.ext_to_grammar` is "the default extension → grammar
table of Step 15"; Step 15 (plan:2213–2290) never lists a member; no line of
the plan maps an extension to a grammar.

```
$ grep -n "elm\|\.ql\b\|tree-sitter-tsx\|extension → grammar\|extension→grammar" docs/plans/plan-phase-a.md
1936:default extension → grammar table of Step 15). All list keys are
5397:  configurable extension→grammar table", so the set of frontends is an
$ grep -n "ext_to_grammar" docs/plans/plan-phase-a.md
1586, 1935, 2086, 2248, 4303, 8808, 8957, 9062   # references only; no membership anywhere
```

Probe 20 and T-38-33 ("loads each grammar the default table names … fails on
any missing or unloadable grammar", plan:4299–4304) therefore have no set to
assert against. AD-12 says the tree-sitter frontend "covers every language for
which `tree-sitter-wasms` ships a grammar" — read literally, the default table
is all 36, and under that reading T-38-33 fails by construction (F2–F4).

**What the decision must say instead.** Enumerate the default table (or name
the plan line that does) as part of this re-derivation, and state its
membership as the 32 usable grammars with the four exclusions and their reasons
(F2–F4). Probe 20 asserts against that enumerated list, prints
`shipped 36 / loadable 34 / usable 32`, and names the four exclusions by
cause, not by trap.

## F2 — elm and ql: cause is ABI, not order, not count; they are unusable under every 0.25–0.27 runtime

**What is wrong.** Proposal: "tree-sitter-elm.wasm and tree-sitter-ql.wasm
fail (reason to be established — likely grammar ABI)"; the fact handed to the
hunter: they "fail … once five or more other grammars have been loaded".
Executed cause: both grammars carry a language ABI below the runtime's
minimum — elm is ABI 12, ql is ABI 10; web-tree-sitter 0.25.10 (and 0.25.9,
0.26.x, 0.27.0 alike) has `LANGUAGE_VERSION=15`, `MIN_COMPATIBLE_VERSION=13`.
0.25.10's `Language.load` (tree-sitter.js:2028–2058) performs no version
check; the `Language` constructor (tree-sitter.js:1832–1848) immediately reads
the symbol and field tables through the ABI-15 struct layout, so from an ABI
10/12 struct it reads garbage counts (`fieldCount` 163216 for elm, 606976 for
ql) and garbage pointers, and calls `ts_language_field_name_for_id` for each.
Whether those reads fault depends on where the side module's data landed:
the trap appears once earlier side modules have consumed enough heap. The
version check lives only in `Parser.setLanguage` (tree-sitter.js:3819–3825),
which throws for both even when `load` "succeeded".

```
# alone, and after five tiny grammars: no trap (count is irrelevant)
0.25.10 elm:ok(abi12) ql:ok(abi10)
0.25.10 json:ok(abi14) embedded_template:ok(abi14) elisp:ok(abi14) toml:ok(abi13) html:ok(abi14) elm:ok(abi12) ql:ok(abi10)
# one large grammar first (objc, dylink memorySize 7,446,108 B): elm traps
(objc:7446108) 0.25.10 objc:ok(abi14) elm:FAIL[memory access out of bounds @ at tree-sitter.wasm.ts_language_field_name_for_id (wasm-function[29]:0x25fe)] ql:ok(abi10)
(ocaml:4748968) 0.25.10 ocaml:ok(abi14) elm:ok(abi12) ql:ok(abi10)        # 4.7 MB is not enough
# objc plus >= 1.1 MB more: ql traps too
0.25.10 objc:ok(abi14) bash:ok(abi14) elm:FAIL[...] ql:FAIL[memory access out of bounds @ ... ts_language_field_name_for_id ...]
# identical under real Node 22.16.0
$ npx -y node@22.16.0 ./order.mjs objc elm ql
0.25.10 objc:ok(abi14) elm:FAIL[memory access out of bounds @ ...] ql:ok(abi10)
# even when "loaded", neither can be set on a parser
elm: loaded; version=12 abiVersion=12 fieldCount=163216 nodeTypeCount=218
  setLanguage/parse threw: Incompatible language version 12. Compatibility range 13 through 15.
ql: loaded; version=10 abiVersion=10 fieldCount=606976 nodeTypeCount=182
  setLanguage/parse threw: Incompatible language version 10. Compatibility range 13 through 15.
LANGUAGE_VERSION 15 MIN_COMPATIBLE_VERSION 13     # same three numbers printed by all seven versions in ./loadall.mjs
```

Upstream: `npm view tree-sitter-elm time` → 4.5.0 published 2021-01-09
(still `latest`); `npm view tree-sitter-ql time` → 1.0.0 published
2019-06-30, last modified 2022-05-22. tree-sitter-wasms 0.1.13 packaged
their shipped `parser.c` unchanged.

The trap is a `RuntimeError` and does not poison the process: after
`objc → elm(trap)`, typescript/python/go/rust each loaded and parsed with
`hasError=false`, and after a second trap (ql) typescript parsed again
(`./contain.mjs`).

**What the decision must say instead.** "elm and ql (ABI 12 and 10) are below
0.25.10's `MIN_COMPATIBLE_VERSION` 13 and are unusable under every 0.25–0.27
runtime; they are excluded from the default table. Probe 20 asserts the
exclusion by reading `Language#version` after load and expecting 12 and 10 —
never by expecting the trap, which is memory-layout-dependent." Drop the
"five or more grammars" sentence entirely.

## F3 — yaml loads but cannot parse: unresolved C++ imports

**What is wrong.** Proposal: "34 of 36 load and parse". Only typescript was
parsed by the draft probe. Executing `setLanguage` + `parse` on all 36:
yaml loads (ABI 13), `setLanguage` succeeds, and `parse` throws
`TypeError: resolved is not a function` — Emscripten's dynamic-linker stub for
a function import the main module does not export
(tree-sitter.js:2943–2949: `stubs[prop] = (...args) => { resolved ||=
resolveSymbol(prop); return resolved(...args); }`). yaml's external scanner is
C++ and imports `_Znwm` (operator new), `_ZdlPv`, `__throw_length_error`,
`abort`, `__assert_fail`; tree-sitter.wasm 0.25.10 exports none of them (nor
do 0.26.13/0.27.0's main modules).

```
parse ok (33): bash:program c:translation_unit ... typescript:program vue:component zig:source_file
parse failed (3): elm:RuntimeError:memory access out of bounds | ql:RuntimeError:memory access out of bounds | yaml:TypeError:resolved is not a function
yaml abi 13 / setLanguage ok / parse threw: TypeError resolved is not a function
    at stubs.<computed> (.../web-tree-sitter/tree-sitter.js:2947:24)
    at wasm://wasm/000b2a62:wasm-function[9]:0x37f3
    at tree-sitter.wasm.ts_parser_parse_wasm (...)
0.25.9 yaml parse threw: resolved is not a function
function imports NOT exported by tree-sitter.wasm 0.25.10: tree-sitter-yaml.wasm -> __assert_fail,_Znwm,_ZdlPv,_ZNKSt3__220__vector_base_commonILb1EE20__throw_length_errorEv,abort
```

**What the decision must say instead.** yaml is excluded from the default
table (unresolved libc++ imports; first parse throws). Probe 20 asserts that
`parse("key: value\n")` on yaml throws `TypeError` and that yaml is not in
the table. `.yml`/`.yaml` fall to the generic frontend.

## F4 — bash parses until it meets `case … esac`, then the parser instance is dead

**What is wrong.** bash imports `isalpha`, which tree-sitter.wasm 0.25.10 does
not export. Simple scripts parse; any `case … esac` reaches the stub and
throws the same `TypeError`; the throw leaves that `Parser` instance unusable
(every later `parse` on it throws), while a new `Parser` works. Step 15 pools
parser instances — a pooled bash parser that has thrown must be discarded, or
every subsequent `.sh` file in the run silently fails.

```
--- fresh Parser per case, one process
ok    comment / shebang / regex / local / set / array / subst / pipe / redirect / heredoc-quoted / x=1 / func -> clean
THREW case -> resolved is not a function            # 'case x in a) ;; esac\n'
same parser after throw, x=1 -> THREW resolved is not a function
new parser after throw, x=1 -> program
--- fresh process per case: identical (only 'case' throws)
# the plan's own probe scripts (no case statements) parse clean on a fresh parser:
ok 01_node_test_empty_glob.sh / 03_tsc_exclude_fixture.sh / 06_argv_realpath.sh / 11_web_tree_sitter_layout.sh / 17_npm_registry_versions.optional.sh / 18_leg2_resume_protocol.optional.sh   hasError false
function imports NOT exported by tree-sitter.wasm 0.25.10: tree-sitter-bash.wasm -> __assert_fail,isalpha
```

Remaining unresolved imports are assertion-path only and were not reached in
any parse: `__assert_fail` (bash, cpp, html, php, python, ruby, tlaplus, vue),
`abort` (kotlin). Record them; they become a throw only if a scanner asserts.

**What the decision must say instead.** Either exclude bash from the default
table (`.sh` → generic; T-15-2 already describes a `.sh` file yielding
"function-shape symbols, zero import_edges", which is the generic frontend's
output), or keep it and state the failure mode: `case` statements throw
`TypeError`; the frontend catches every throwable (RuntimeError and TypeError,
not only `Error`), discards the parser instance, and falls back to generic
for that file with a per-language diagnostic count. Probe 20 asserts the
`case` throw either way. Given rule 3 (measure the floor honestly), the
exclusion is the honest choice: a frontend that works on scripts without
`case` and silently degrades on the rest fakes coverage.

## F5 — Step 1's package.json + tsconfig cannot compile a web-tree-sitter import under either pin

**What is wrong.** The re-derivation re-pins Step 1's manifest and says the
tsconfig stays. Executed with the plan's exact tsconfig (strict, ES2022,
NodeNext, verbatimModuleSyntax, no `skipLibCheck`) and a `src/frontend.ts`
that imports `{ Parser, Language, Query }`:

```
# 0.25.10 pin
node_modules/web-tree-sitter/web-tree-sitter.d.ts(136,31): error TS2304: Cannot find name 'EmscriptenModule'.
tsc exit 2
# current 0.26.13 pin — same defect, pre-existing in the plan
node_modules/web-tree-sitter/web-tree-sitter.d.ts(160,39): error TS2304: Cannot find name 'EmscriptenModule'.
tsc exit 2
```

Cause: both d.ts files reference the global `EmscriptenModule` from
`@types/emscripten`, which web-tree-sitter declares only as an *optional*
peer dependency (`peerDependencies: {"@types/emscripten": "^1.40.0"}`,
`peerDependenciesMeta: optional`) — npm does not install it
(`ls node_modules/@types` → `node`). No probe in the plan compiles a file that
imports web-tree-sitter (probes 03/04/05 compile fixtures without it), which
is why 2026-09-07's layout passed. Two fixes executed:

```
# (a) exact dev pin — the package's own declared peer; keeps lib checking
$ npm install --save-dev @types/emscripten@1.41.6   # latest, published 2026-09-01; dependencies {}; scripts {}
$ npx tsc -p tsconfig.json ; echo $?  -> 0
$ node dist/src/frontend.js  -> fn=f root=program
# (b) "skipLibCheck": true
$ npx tsc -p tsconfig.skip.json ; echo $? -> 0
```

**What the decision must say instead.** D-plan-2 dev pins become
`typescript` 5.9.3, `@types/node` 22.20.1, `@types/emscripten` 1.41.6, exact,
with the reasoning "web-tree-sitter's d.ts references the `EmscriptenModule`
global and declares `@types/emscripten` an optional peer; without it `tsc`
fails TS2304 under strict lib checking (executed 2026-09-11 for both 0.25.10
and 0.26.13)". Step 1's devDependencies, probe 11's expected line, probe 17,
§11.4 and Q1 change accordingly, and probe 20 (or a new probe) compiles a
one-file import of web-tree-sitter under the plan's tsconfig.

## F6 — The 0.26.x/0.27.0 failure has an empty message; every 0.26.x tested loads nothing

**What is wrong.** The proposal says `Language.load()` "throws" under 0.26.13
and 0.27.0 without characterising it. Executed: the error is an `Error` whose
`message` is `""`, thrown by `failIf(name2 !== "dylink.0")` in
`getDylinkMetadata` (web-tree-sitter.js:1944 in 0.26.13; 0.26.13 reads only
the `"dylink.0"` custom section at :1931, whereas 0.25.10 falls back to
`"dylink"` at tree-sitter.js:2514–2519). All 36 shipped grammars carry the
legacy `dylink` section (own inspector: `kind:"dylink"` × 36, `dylink.0` × 0).

```
0.26.13 error: name= Error message= "" String= "Error" stack head= Error | at failIf (.../web-tree-sitter.js:1927:28) | at getDylinkMetadata (.../web-tree-sitter.js:1944:7)
0.27.0 error: name= Error message= "" String= "Error"
web-tree-sitter 0.26.0 / 0.26.3 / 0.26.8 / 0.26.13 / 0.27.0: shipped 36, loaded 0   (FAIL(36) "": every grammar)
web-tree-sitter 0.25.9 / 0.25.10: shipped 36, loaded 34
```

Registry (executed `npm view web-tree-sitter time --json`): 0.26.0 published
2025-09-19, 0.25.10 published 2025-09-22 (a backport after the 0.26 line
opened), no 0.25.x since; `tree-sitter-wasms` 0.1.13 published 2025-10-07 is
the last release (`npm view tree-sitter-wasms versions time`).

**What the decision must say instead.** Name the mechanism (legacy `dylink`
section vs. `dylink.0`-only loader from 0.26.0), record that no 0.26.x loads
any shipped grammar (0.26.0, 0.26.3, 0.26.8, 0.26.13 executed), record that
0.25.10 is a post-0.26 backport with no successor in a year, and make probe
20's 0.26/0.27 expectation "throws an `Error` with empty message" — never a
message-text match. The tree-sitter changelog itself was not retrievable from
this runner (github.com 403, raw.githubusercontent.com 404, api.github.com
403 through the proxy); the cause is established from the shipped loader
source and execution, which is the stronger evidence.

## F7 — "A bump remains architecture work" contradicts the decision's own act

**What is wrong.** The architecture never decided a version. AD-25's decision
text names packages only ("runtime deps exactly `web-tree-sitter` +
`tree-sitter-wasms`", arch:1633–1635); the versions appear only in premise
row V14 (arch:138) and in the sources table (arch:2036); AD-2 (arch:325–333)
carries the Node floor, not the parser version. D-plan-2's "a bump is
architecture work" was a plan-invented rule, and this re-derivation changes
the version by plan authority while restating it. A rule the plan breaks in
the sentence that restates it is hollow.

**What the decision must say instead.** "The pin is plan-owned (D-plan-2);
it moves in either direction only with probe 20 re-executed against the
enumerated default table. V14 is a premise the architecture's next revision
updates from probe 20's output (§16 premise maintenance); the architecture
decides packages, not versions."

## F8 — Alternative (a) is rejected for the weaker reason; a fourth alternative is unscored

**What is wrong.** (a) is rejected as "one runtime dependency per grammar
against AD-25's 'exactly two'". The executed reason is stronger and is the
one AD-25/C-3 actually state: the packages web-tree-sitter's README recommends
carry `install: node-gyp-build` scripts, `node-addon-api` dependencies,
`binding.gyp` and native prebuilds — the "no postinstall scripts, no native
code, no prebuilt-binary downloads" clause of AD-25 and C-3's "no native
toolchain" both fail on install, before dependency counting matters.

```
$ npm view tree-sitter-typescript version scripts dependencies
0.23.2  scripts.install: "node-gyp-build"  dependencies: node-addon-api ^8.2.2, node-gyp-build ^4.8.2, tree-sitter-javascript ^0.23.1
$ npm view tree-sitter-python / tree-sitter-javascript / tree-sitter-go / tree-sitter-rust  -> each: scripts.install "node-gyp-build", node-addon-api + node-gyp-build deps
$ npm pack --dry-run tree-sitter-typescript@0.23.2 | grep -i "wasm\|binding.gyp\|prebuilds"
binding.gyp; prebuilds/{darwin,linux,win32}-{arm64,x64}/tree-sitter-typescript.node (6 × ~2.9 MB); tree-sitter-tsx.wasm 1.4MB; tree-sitter-typescript.wasm 1.4MB
```

Unscored alternative (d): vendor the `.wasm` files those packages ship
(they are `dylink.0`, ABI 15) as checked-in grammar files — no runtime
dependency, no install script, and §16's follow-ups already contemplate
"checked-in WASM grammar files … with no runtime dependency added". Executed:

```
$ npm pack tree-sitter-javascript@0.25.0 && tar xzf ... package/tree-sitter-javascript.wasm   # 411,770 B
{"f":"javascript","kind":"dylink.0","mem":381780,"tbl":7,...}
0.27.0:  vendored javascript wasm loads; abi 15 root program hasError false
0.26.13: vendored javascript wasm loads; abi 15 root program hasError false
0.25.10: vendored javascript wasm loads; abi 15 root program hasError false
```

**What the decision must say instead.** Rejection (a) cites the install
script and native prebuilds (AD-25 clause, C-3), with the `npm view`/`npm
pack` evidence. Add (d) and disposition it: rejected for Phase A because it
replaces AD-25's grammar source and adds a vendoring/refresh mechanism (rule
3: no machinery beyond the goal) — and recorded as the named exit if
`tree-sitter-wasms` stays unmaintained, noting it would also restore yaml,
bash, elm and ql and that vendored `dylink.0` files load under 0.25.10 as
well, so taking that exit later does not itself force a runtime bump.

## F9 — Wrong step number and drifted line references in the consequences list

**What is wrong.** The proposal's "Step 22 Source and Gate 3 item 2" and
"Step 22 lines ~2228-2265" are plan Step 15 (`step: S15`, "tree-sitter
frontend + generic fallback", plan:2213); plan Step 22 is "QA state DAO + the
Phase B seam" (plan:2736). Other references: the V14 §11.4 claim is at
plan:6328–6330 (not ~6288); the probe-17 claims at 6575–6588; the probe-11
claim at 6784–6801; Q1 is at plan:9140–9144 (not ~9083); §16 item 5 is at
plan:9544–9553; §16's grammar follow-up at 9598–9600.

**What the decision must say instead.** Consequences name Step 15 (Source
line and Gate 3 item 2, plan:2254–2265) and the corrected lines; an edit
aimed at Step 22 lands on the wrong step.

## F10 — Route (§4 entry, architecture untouched) is correct, but the entry's scope is wider than V14

**What is wrong (scope only).** The route follows the plan's one precedent
(§4 V6 entry, plan:293–316) and CLAUDE.md's classification: no owner-locked
decision names a parser version (`grep -in "tree-sitter\|wasm\|grammar"
OWNER-LEDGER.md` → nothing; the spec has no tree-sitter mention), so the
conflict is derivable and goes to §4, with §16 item 5 rewritten and the
architecture untouched — as proposed. But the executed inventory contradicts
AD-12's decision text ("covers every language for which `tree-sitter-wasms`
ships a grammar", arch AD-12 §1) and L6, not only V14: 36 shipped, 34 load,
32 usable.

**What the decision must say instead.** The §4 entry names V14 *and* AD-12/L6:
"AD-12's 'every language for which tree-sitter-wasms ships a grammar' is, by
execution, every grammar the pinned runtime can load and parse — 32 of 36;
elm, ql (ABI), yaml, bash (unresolved imports) are excluded with reasons". §16
item 5's premise-maintenance sentence carries the same numbers.

---

## Checks that found nothing (executed)

- **Node 22.16.0 floor.** `npx -y node@22.16.0 --version` → v22.16.0;
  `./loadall.mjs` under it: identical (34/36, typescript and python parse,
  `new Query(...).captures` returns `fn=f cls=K`); the tsc-compiled layout
  runs under it (`fn=f root=program`). 0.25.10 has no `engines` field
  (`engines undefined` for all seven versions installed).
- **ESM / `import.meta.resolve`.** From a module in the 0.25.10 layout:
  `import.meta.resolve('tree-sitter-wasms/out/tree-sitter-typescript.wasm')`
  ends with the expected path (`true`); `import.meta.resolve('web-tree-sitter')`
  → `.../node_modules/web-tree-sitter/tree-sitter.js`; compiled code in
  `dist/src/` locates `tree-sitter.wasm` and runs.
- **API surface Step 15/38 use.** 0.25.10 d.ts declares `Parser.init`,
  `Parser#setLanguage`, `Parser#parse`, `Language.load(string | Uint8Array)`,
  `Language#query`, `class Query` with `matches`/`captures`; executed
  `new Query(lang, src).captures(root)` on typescript and python under
  0.25.9, 0.25.10, and Node 22.16.0.
- **Manifest hygiene of 0.25.10.** `dependencies` absent; scripts are
  build/lint/test/prepack/prepublishOnly (no install-phase script); the only
  peer (`@types/emscripten`) is optional and not auto-installed; no `.node`
  files. tree-sitter-wasms 0.1.13: `files ["/out"]`, `scripts {build}`,
  self-dependency `^0.1.11`, 36 `.wasm` under `out/`.
- **Registry facts in the proposal.** 0.25.10 is the last 0.25.x and was
  published 2025-09-22; tree-sitter-wasms has no release after 0.1.13
  (2025-10-07); 0.27.0 is current (2026-08-30).
- **Plan text silently assuming 0.26.x.** `grep -n "tree-sitter\.wasm\|web-tree-sitter\.wasm\|skipLibCheck\|emscripten"` over the plan → no hits;
  the plan names no version-specific file or API beyond the four
  declarations above.
- **Every grammar is a PIC side module.** Data segments of all 36 use
  `global.get __memory_base` offsets (own parser); elm/ql are not relocation
  outliers — which is what ruled out a linking cause and pointed at ABI.
- **Process survival after traps.** Loads and parses of other grammars
  continue after elm/ql `RuntimeError`s; only the `Parser` instance that
  threw the bash/yaml `TypeError` is poisoned (F4).

## Scripts and directories (all under `.../scratchpad/ch/`)

`inspect-wasm.mjs` (custom sections, dylink sizes, imports), `datasegs.mjs`
(data-segment offset expressions, import names), `order.mjs` (ordered loads
with ABI and trap frames), `loadall.mjs` (36 loads + parse + Query per
version), `wts-0.25.10/elmql.mjs`, `contain.mjs`, `parseall.mjs`,
`bashcase.mjs`; `layout/` (plan's Step 1 manifest+tsconfig on 0.25.10) and
`layout-2613/` (same on 0.26.13); `vendored/` (tree-sitter-javascript@0.25.0
tarball and its wasm).
