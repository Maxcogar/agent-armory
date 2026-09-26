# Independent review — the walking-skeleton gap list (G1–G36 + the hooks-contract item)

*Review of record, written once. Reviewer: a fresh neutral subagent. The author of
the skeleton did not write this review. Run 2026-09-25/26 against the working tree
at commit `59cc05c` (the gap list's own commit). Nothing outside this file was
edited.*

## Scope, sources, and method

**Reviewed.** The "Skeleton gap list" in `docs/implementation-log.md`
(G1–G36 plus "Unverified — whispers on `PreToolUse`"), and the skeleton code it
describes under `ctxoracle/src/` (every `SKELETON:` mark, plus the modules they sit
in).

**Judged against.** `docs/specs/spec-context-oracle.md`,
`docs/architecture-phase-a.md`, `docs/plans/plan-phase-a.md`, `OWNER-LEDGER.md`,
`CLAUDE.md`, and the repository-root `.claude/rules/raise-flaws.md`; external
standards are named where each decision derives from one. The hooks contract was
re-read from the current primary source (`https://code.claude.com/docs/en/hooks.md`,
fetched 2026-09-26).

**Method.** Every behavioral claim below was checked by running the built code
(`npm run build`, then `node` scripts importing `dist/src/**`, or the real
`dist/src/cli/dispatch.js` binary with `CTXORACLE_HOME` pointed at a temp dir) on
throwaway git repositories created for the purpose. `npm test` was green before
starting (42/42). Where a claim was checked by reading code rather than running
it, the entry says so. The probe scripts lived in the session scratchpad; the
commands and their observed outputs are quoted inline so the evidence survives
the container.

**The phase goal this review judges against (CLAUDE.md rule 3).** Phase A is an
honest deterministic foundation, running on Max Cogar's real repositories, that
measures its own floor — how little it catches — with clean seams for the later
phases; never fake completeness. Several gaps below are not only correctness
defects but *measurement* defects: they make the Step 39 exit numbers wrong
without any fault saying so (G3, G4, G5, G23/G29, N1, N3). Those are called out,
because faked or mis-measured data is exactly what poisons the data Phase B is
designed from.

**Owner vs engineering, in one line for the whole list.** None of the 37 items,
and none of the missed gaps, is an owner decision. Each is either already decided
by a written source (then it is a correction) or derivable from the spec, the
architecture, or a named engineering standard (`CLAUDE.md` "Don't hand the owner a
decision that is already written"; `OL-11`). The two places where an owner
decision *bounds* the engineering choice are named in their entries (the
`PreToolUse` timing item is bounded by the owner's rejection of pre-emptive gates,
`OL-R4`/`OL-C2`; G23/G29 is bounded by `OL-C5`'s "their next move"). Where the
result is owner-visible, the entry says so; that is a plain-language line for
`docs/STATUS.md`, not a question.

**Verdict vocabulary.** *Holds* — the gap is real as stated. *Partially holds* —
real, but the evidence or framing is wrong or incomplete in a way that changes the
decision. *Does not hold* — not a gap as stated.

---

## Findings per gap

### G1 — landmine labels have no input

- **Verdict: holds.**
- **Evidence.** Plan Step 13 prescribes `--format=%x1e%H%x00%at%x00` (no message
  field); AD-15 and plan Step 13 say "revert-labelled" / "fix-labelled" and define
  neither (`grep -n 'revert-label\|fix-label'` over the architecture finds only
  AD-15 lines 1166–1167). T-13-1's fixture data ("2 revert-labelled commits…
  3 fix-labelled commits") depends on the same undefined term. Executed on git
  2.43.0: `git revert --no-edit HEAD` twice wrote the subjects `Revert "both"`
  then `Reapply "both"`, confirming the skeleton's two prefixes.
- **Also found.** The skeleton counts a revert only on *included* commits
  (`cochange.ts` line 233 returns before line 244), so a revert of a large commit
  (> `miner.max_transaction_entities`) is never counted. AD-15 bounds
  `revert_chain` by the horizon only, not by the transaction-size filter, which
  exists to keep refactor sweeps out of *pair* counts (AD-13 §3). That is an
  unmarked provisional choice.
- **Decision.** (a) *Revert-labelled* = a commit git itself generated as a revert:
  the body trailer `This reverts commit <40-hex>.` (the default message
  git-revert(1) documents), with the subject prefixes `Revert "` / `Reapply "` as
  the fallback for a trailer-less message. Read `%s` plus the body trailer only;
  never store message text (AD-19 pointer-only — the evidence stays commit
  hashes, as the skeleton already does). (b) *Fix-labelled* = a subject matching a
  keyword set held as a `lexicon.fix_keywords` `plan_seed` tuning list (members:
  the skeleton's `fix, fixes, fixed, fixing, bug, bugfix, hotfix`), printed with
  every other seed in `status` and the exit report (D-plan-7's pattern). Source:
  the SZZ keyword heuristic (Śliwerski, Zimmermann, Zeller, MSR 2005), which is
  lexical classification — not the "commit-message sentiment" AD-15 §4 excludes.
  (c) Label detection runs over every horizon-included commit *before* the
  transaction-size exclusion.
- **Layer.** Architecture: one sentence in AD-15 defining both labels as git's
  revert trailer and a tunable keyword class (reconciling AD-15 §4). Plan: Step 13
  format string and Step 12 seed row. Code: Step 13.
- **Owner or engineering.** Engineering.

### G2 — no `files` row for history-only paths

- **Verdict: partially holds.** The foreign-key need is real
  (`001_phase_a_project.sql` lines 65–67: `cochange_pairs.a/b REFERENCES
  files(id) ON DELETE CASCADE`). The entry leaves the deletion rule "still open",
  but the skeleton has already chosen one, and that choice is inconsistent.
- **Evidence (code read, `indexer.ts` lines 259–269).** A path the miner created
  a placeholder for (`content_hash = ''`) survives `runIndex`, and its pairs
  survive. A path the indexer indexed and that was later deleted from the tree is
  hard-deleted, and `ON DELETE CASCADE` removes its pairs and landmines. The same
  historical fact (a deleted file) is kept or destroyed depending on whether the
  indexer happened to see it once. The empty `content_hash` is an in-band
  sentinel standing for "not in the tree".
- **Decision.** Add an explicit `files.in_tree INTEGER NOT NULL` column. The
  indexer sets it to 1 for every listed path. `deleteMissing` sets it to 0 and
  deletes that file's `symbols`/`import_edges`/FTS rows, but never the `files` row
  while mined history references it. History-only paths get `in_tree = 0`,
  `zone = 'unknown'`. Pointers to `in_tree = 0` files are already dropped by the
  rumor rule at compose time (AD-15), so no genre points at a missing file.
  Sources: AD-13 §4 ("pruning deletes evidence"); normalization practice (no
  magic values standing for a missing attribute).
- **Layer.** Architecture: AD-4 `files` column. Plan: Steps 7, 9, 13, 14.
- **Owner or engineering.** Engineering.

### G3 — per-file change totals; the AD-4 schema flaw

- **Verdict: holds.** One correction to the framing: AD-4 §2 already names "the
  pair table's denormalized counters" as "a named read-speed trade-off", so the
  2NF breach is declared, not silent. What the entry gets right, and what matters,
  is that the declared trade-off **cannot be maintained correctly**. A commit
  touching only `a` has no pair row to increment. A pair row created later cannot
  learn `a`'s earlier total, because the total is stored nowhere else.
- **Evidence (executed).** A repo where `a.txt` changes 7 times and co-changes
  with `b.txt` in 4 of them. After `mineCochange`:
  `pairs [{"a":1,"b":2,"pair_count":4,"a_count":4,"b_count":4,…}]`. ROSE
  confidence is 4/7 = 0.57, below the 0.6 floor. The skeleton computes 1.00, so
  the pair passes. `cochange_pairs.bump` (Step 9 DAO) increments all three
  counters together, so `a_count == pair_count` always. The e2e test's
  `ratio 1.00` output is the same defect.
- **Decision.** Store support(A) once per file: `files.change_count` (or a
  `file_changes(file_id PK, change_count)` table). It is incremented for every
  *included* commit that touches the file, single-file commits included, which is
  the same population as the pair counts. Set
  `confidence(a→b) = pair_count / change_count(a)` and drop `a_count`/`b_count`
  from `cochange_pairs`. Sources: Zimmermann et al., TSE 31(6) 2005 (support(A) is
  the number of transactions containing A); 3NF (a fact that depends only on the
  file is stored with the file). Measurement consequence: until this is fixed,
  every Coupling and Completeness confidence in the Step 39 exit data is 1.0, and
  the confidence floor never filters.
- **Layer.** Architecture: AD-4 schema and AD-13 aggregation sentence. Plan:
  Steps 7, 9, 13, 16 (`pair_count / a_count` in Step 16's prose).
- **Owner or engineering.** Engineering.

### G4 — history rewrite

- **Verdict: holds.**
- **Evidence (executed).** After a first mine, `git commit --amend` made the
  watermark unreachable. The second `mineCochange` gave
  `pair_count 4 → 8` (every commit counted twice), `commits` grew from 8 to 9 rows
  (the rewritten-away commit stays), and no fault was written (`faults []`, JSONL
  directory empty). AD-13 says "full re-mine + diagnostic"; `FAULT_CODES` has no
  code for it.
- **Decision.** When the watermark is not an ancestor of `HEAD`, run inside one
  transaction: delete `commits`, `cochange_pairs`, the per-file change counts (G3),
  and the miner-sourced landmines (`revert_chain`, `fix_chatter` — never
  `human_stated`). Then run the full mine and advance the watermark. Record a new
  fault code, `history_rewritten` (detail: old watermark, new `HEAD`). This needs
  G9's nesting fix to be one transaction. Source: AD-13; correctness of a derived
  aggregate (recompute from the source of truth after invalidation).
- **Layer.** Plan: Step 6 code list, Step 13 prose. Architecture: none (AD-13
  already requires the behavior).
- **Owner or engineering.** Engineering.

### G5 — incremental landmines

- **Verdict: holds, and the defect is larger than stated.**
- **Evidence (executed).** After the base mine (4 fix commits on `a.txt`), 3 more
  `fix a N` commits and an incremental mine left **two** `fix_chatter` rows for
  the same file, `support 4` and `support 3`, instead of one row with 7. The cause
  is that `landminesDao.upsert` deduplicates on `(kind, file_id, evidence)` and
  the evidence string embeds the pass's hash list, so every pass that sees new
  labelled commits adds a row, and the Warning genre speaks once per row. After
  the G4 amend, the `revert_chain` rows still cited the rewritten-away hash
  `917b85d…`.
- **Decision.** Keep a small table of labelled touches,
  `labelled_touches(file_id, commit_hash, label, ts)`, written only for labelled
  commits. At the end of every pass, inside the pass's transaction, delete and
  rebuild the miner-kind landmine rows from it: `revert_chain` over the horizon,
  `fix_chatter` over the trailing window measured from the reference instant (so
  aged-out rows disappear). The dedup key is `(kind, file_id)`, and support is the
  count. This is not the per-commit transaction list AD-13 §4 rejects: it holds
  only the labelled subset and serves only landmines. Sources: AD-15 (both
  classes are functions of history, not of a pass); AD-4's table-creation
  criterion (Phase A writes it).
- **Layer.** Architecture: AD-4 table, AD-15 derivation sentence. Plan: Steps 7,
  9, 13.
- **Owner or engineering.** Engineering.

### G6 — Step 13's declaration

- **Verdict: holds, and it is systemic, not Step 13's alone.**
- **Evidence.** `test/fixtures/generate.ts` appears in a step declaration only as
  S1 `create` (`grep -n generate.ts` over the plan). 21 of the 26 fixture
  generators are `trivial(dir, name)` stubs (`miner-hygiene`, `indexer-small`,
  `coupling-nonobvious`, … `regret-no-inflate`). The Checkpoint-1 finding m1
  deferred them "to their consuming Steps 13–38", but no consuming step declares
  `modify: test/fixtures/generate.ts`. T-13-1 "feeds the miner's parser two
  synthetic malformed records", which needs an exported parser that S13's
  `provides: [mineCochange]` does not name.
- **Decision.** Every step whose §12 test consumes a fixture declares
  `modify: middleware/context-oracle/ctxoracle/test/fixtures/generate.ts` and names
  the fixture it builds out. S13 adds `parseNumstatZ` to `provides`. Regenerate
  §5.1 (`derive-plan-sections --check`). Source: the plan's own step-declaration
  contract (§5.1 is generated from declarations, so an undeclared modify is an
  unplanned change).
- **Layer.** Plan.
- **Owner or engineering.** Engineering.

### G7 — UTF-8 decoding of paths

- **Verdict: partially holds.** The entry's evidence is partly wrong, and "accepted
  as is" is not acceptable.
- **Evidence (executed).** Two files named `bad\xff.txt` and `bad\xfe.txt`
  committed and indexed. The **indexer dropped both silently**: `filesSeen` was 2
  (only the two `.ts` files), because `git ls-files -z` output decoded as UTF-8
  gives `bad�.txt`, and `statSync` on that string fails, so `listFiles`
  filters it out. The **miner collapsed both into one** placeholder row
  (`files: bad�.txt`). The entry also says "the indexer's `readdir`"; the
  skeleton does not use `readdir` (it uses `git ls-files`, G11).
- **Decision.** The spawn seam returns a `Buffer` for machine output. Each path is
  decoded with a fatal UTF-8 decoder. A path that is not valid UTF-8 is excluded
  from both the miner and the indexer (one rule, one place), counted, and recorded
  under a new fault code `path_not_utf8` (count plus the escaped bytes of the first
  few). No silent drop, no collapse. Sources: POSIX (a pathname is a byte string);
  the WHATWG Encoding Standard (fatal decoding); `OL-10` (no silent failure).
- **Layer.** Plan: Steps 5 (a Buffer-returning seam variant), 6 (code), 13, 14.
- **Owner or engineering.** Engineering.

### G8 — the tuning store is never passed (cross-cutting)

- **Verdict: holds.**
- **Evidence.** Migration 002 creates `tuning` in the global store. Plan
  signatures pass only the project store: Step 13 `mineCochange(store, …)`,
  Step 14 `runIndex(store, repoPath, {full, frontends})`, Step 15
  `defaultFrontends()`. The skeleton had to add `opts.global` in three places, and
  a `TuningReader` argument to `Generator.candidates`. The miner and the bar also
  carry literal fallbacks (`num(g, 'miner.max_transaction_entities', 30)`,
  `n(t, 'bar.confidence_floor', 0.6)`, …), which duplicate the seeds. Plan
  Step 12 forbids exactly this: "no consuming module carries a number of its own".
  Separately, `tuning.get` reads only the `project_key IS NULL` row, so AD-5's
  per-project override column is never resolved.
- **Decision.** Define one convention: every component that reads a threshold
  receives a `TuningReader`, never a raw global `Store`. The reader is bound to
  `(globalStore, projectKey)`, resolves the project row before the NULL row,
  re-seeds a missing key, and records `tuning_missing` (G17). No component carries
  a fallback literal. Components that also write global state (the Step 30 fold)
  receive an explicit `{ project, global }` pair. Source: AD-5 (tuning's home and
  its `project_key`); plan Step 12's single-source rule; dependency injection of a
  narrow read interface (interface segregation).
- **Layer.** Plan: signatures in Steps 13, 14, 15, 16, 18, 28. Architecture: none.
- **Owner or engineering.** Engineering.

### G9 — transactions do not nest

- **Verdict: holds.**
- **Evidence (executed).** `ps.transaction(() => ps.transaction(() => 1))` threw
  `cannot start a transaction within a transaction`. Ten DAO methods open their
  own transaction (`grep -n transaction src/stores/dao/*.ts`: landmines, tuning ×2,
  symbols, import_edges, symbol_refs, test_map, invariants, classified_turns,
  whisper_stats). So no caller can make a multi-DAO write atomic. The miner writes
  its landmines after the watermark commit, and a crash between them leaves the
  watermark advanced without its landmines.
- **Decision.** Transaction demarcation belongs to the caller (the unit of work),
  never the DAO. Make `Store.transaction` re-entrant: at depth 0 it issues
  `BEGIN IMMEDIATE` with AD-26's retry; at depth > 0 it issues
  `SAVEPOINT`/`RELEASE`/`ROLLBACK TO`. The busy-retry applies only at depth 0.
  DAO methods keep their internal atomicity through the same call, so no DAO call
  site changes. Sources: SQLite `SAVEPOINT` documentation (savepoints nest inside
  a transaction); Fowler, *PoEAA*, Unit of Work; AD-26 (which owns the transaction
  discipline).
- **Layer.** Architecture: AD-26 (a nesting rule). Plan: Step 3 (the adapter;
  Checkpoint-1 code reopens), then Steps 13 and 14 wrap their passes.
- **Owner or engineering.** Engineering.

### G10 — `node:sqlite` ExperimentalWarning on stderr

- **Verdict: does not hold as a hazard.**
- **Evidence.** (1) The current hooks reference says: "Stderr from a hook that
  exits 0 goes to the debug log only, never the transcript, and Claude never sees
  it." The handler always exits 0 (`cli/hook.ts`). (2) Observed: with
  `NODE_NO_WARNINGS` unset, the real binary's stderr was empty on `SessionStart`
  and `PostToolUse` against an initialized store, and empty on `status`. A bare
  `node -e "require('node:sqlite')"` does print the warning. The likely
  explanation — not verified — is that `dispatch.js`'s immediate `process.exit`
  ends the process before the warning is written. This is an observation on Node
  22.22.2, not a guarantee; the engines floor (22.16.0) was not run.
- **Decision.** No mechanism. Record the exit-0 stderr rule as a verified premise
  row in the architecture's V-table (source and date above), so no later step
  builds warning suppression for a hazard that does not exist.
- **Layer.** Architecture: V-table row.
- **Owner or engineering.** Engineering.

### G11 — the file walk and the unfinished index outputs

- **Verdict: partially holds.** Using git's list is the right choice for gitignore
  semantics, but the skeleton's version breaks a supported case, and one part of
  the item hides a real decision gap.
- **Evidence (executed).** `runIndex` on a plain directory threw
  `Command failed: git ls-files … fatal: not a git repository`. AD-3 rule 3
  supports non-git repositories (path-keyed mode), so indexing one must work. The
  plan's "walks the working tree respecting `.gitignore`" also conflicts with
  AD-12's zone signal "`.gitignore` membership": an ignored file is never walked,
  so that signal can never fire.
- **Decision.** (a) In a git work tree, list files with
  `git ls-files -z --cached --others --exclude-standard`. It is git's own
  implementation of gitignore(5) (negation, nested ignore files,
  `core.excludesFile`, `info/exclude`), which a re-implementation would get
  subtly wrong. (b) In a non-git directory, use a `readdir` walk with a fixed
  exclusion of `.git/` and `node_modules/`, disclosed in `status`. (c) Drop
  "`.gitignore` membership" from AD-12's zone signals, since the walk never admits
  an ignored file. (d) The unbuilt `symbol_refs` and `test_map` are
  build-remaining work, not decisions — except the undefined conventions in N13.
- **Layer.** Architecture: AD-12 (walk rule and zone-signal list). Plan: Step 14.
- **Owner or engineering.** Engineering.

### G12 — import resolution is undefined

- **Verdict: holds, and the skeleton rule fails for Python.**
- **Evidence (executed).** `pkg/use.py` containing `from .mod import f` and
  `from . import mod`, beside `pkg/mod.py`, produced `edges 0`. The captured
  specifier `.mod` is joined as the path `pkg/.mod`, and PEP 328's dotted-relative
  form is never translated. The TypeScript rule resolved correctly on this repo
  (per the log). The skeleton also tries `.py` for a TypeScript specifier and
  `.ts` for a Python one, a cross-language resolution no language performs.
- **Decision.** Import resolution is per-language and belongs to the frontend. It
  follows each language's own documented resolution: TypeScript/JavaScript per
  the compiler's `moduleResolution: NodeNext` rules, including the `.js`→`.ts`
  source mapping; Python per PEP 328 (leading dots = parent packages;
  `from . import x` resolves to `x.py` or `x/__init__.py`). Bare or package
  specifiers produce no edge, disclosed as a limitation. Every other grammar
  starts with no resolver, which makes it "no `import_edges`" for the Reuse
  comparability test (see G13). Source: the named language specifications;
  AD-12's `LanguageFrontend` seam.
- **Layer.** Plan: Step 15 (a `resolve` member on the frontend, or a per-language
  resolver table). Architecture: none beyond G13's capability rule.
- **Owner or engineering.** Engineering. (Language breadth was handed to agents by
  Max Cogar — ledger note under CONFIRMED.)

### G13 — per-language queries are not written

- **Verdict: holds, with a correctness consequence the entry misses.**
- **Evidence.** Plan Step 15 requires "per-language tree-sitter queries" for 32
  grammars and supplies none. The skeleton has four (`QUERIES` in
  `tree_sitter_frontend.ts`). AD-15's Reuse discriminator treats "grammar-covered"
  (`lang` present in the ext→grammar table) as evidence-comparable, and a
  grammar-covered count of 0 as *observed* zero. A grammar that has a table entry
  but no imports query produces 0 `import_edges` by construction. The rule would
  then read "structurally uncounted" as "observed zero" and crown a rival, which
  is the failure L6 exists to prevent.
- **Decision.** (a) A frontend declares its capabilities
  (`{ symbols: boolean, imports: boolean }`), recorded per language. (b) AD-15's
  comparability discriminator keys on `imports` capability, not on table
  membership. (c) Queries are written per grammar as the Step 15 build
  deliverable. A grammar without a written query takes the generic frontend
  (current skeleton behavior), and `status` shows per-language capability, so
  coverage is measured, not claimed. Sources: AD-15/L6's own rationale; C-6
  (extensible — a new query is a data change).
- **Layer.** Architecture: AD-15 discriminator sentence, AD-12 capability
  declaration. Plan: Step 15.
- **Owner or engineering.** Engineering.

### G14 — async grammar loading behind a synchronous `parse`

- **Verdict: holds.**
- **Evidence.** `web-tree-sitter.d.ts` (0.25.10): `static init(): Promise<void>`,
  `static load(input): Promise<Language>`, `parse(…): Tree | null`. The skeleton
  loads every tabled grammar with a query up front (not lazily). Its
  `frontend_parse_failed` goes to `recordFault(null, …)` (`frontends.ts`), which
  means JSONL only. `status` reads the store, so a parse failure does not appear
  there, contrary to plan Step 15 ("visible in `status`'s per-language counts").
- **Decision.** `runIndex` lists the files first, computes the set of languages
  present, and awaits `init()` for exactly those frontends before any `parse`
  (lazy per language present — the purpose of "lazy per first use" — without an
  async `parse`). `parse` returns a result or a typed failure. The indexer, which
  holds the store, records `frontend_parse_failed` through `recordFault(store, …)`.
  Source: the pinned library API; AD-17 (faults surface in `status`).
- **Layer.** Plan: Steps 14 and 15 (interface gains `init`; failure is a return
  value).
- **Owner or engineering.** Engineering.

### G15 — oversize files get no fault code

- **Verdict: holds.** AD-12 and plan Step 14 say "path-only with a diagnostic";
  T-14-1 asserts it; `FAULT_CODES` has no such code (read); the skeleton records
  nothing (`indexer.ts` line 231).
- **Decision.** Add `index_path_only_oversize` (detail: path, bytes, lines) to
  `FAULT_CODES`, written by `runIndex`. Source: AD-12; `FR-M2`.
- **Layer.** Plan: Step 6 list, Step 14.
- **Owner or engineering.** Engineering.

### G16 — the FTS path tokenizer makes a path one token

- **Verdict: holds.**
- **Evidence (executed).** On an indexed repo with `src/util.ts`, `fts_paths MATCH
  'util'` returned `[]`, and `pathSearch(['util'])` returned `[]`. Only the whole
  path `"src/util.ts"` matched. After switching `fts_state` to `fallback`,
  `pathSearch(['util'])` returned `src/util.ts`. The tokenizer is plan text (Step 7
  DDL, plan line 1675: `tokenchars '/_-.'`), copied into `001b_phase_a_fts.sql`.
- **Decision.** Use `tokenize = 'unicode61'` with no `tokenchars` for `fts_paths`,
  so `/ . _ -` separate tokens. Queries use prefix terms (see N6). No store has
  shipped, so editing migration 001b is correct and needs no forward migration.
  Source: SQLite FTS5 documentation (unicode61 `tokenchars` makes a character part
  of a token); T-15-3's FTS/`LIKE` agreement property.
- **Layer.** Plan: Step 7 DDL. Code: Step 7 migration (Checkpoint-1 artifact
  reopens).
- **Owner or engineering.** Engineering.

### G17 — the concrete `TuningReader` was never built

- **Verdict: holds.**
- **Evidence.** Plan Step 6 (line 1405) says "Step 12's `TuningReader` re-seeds
  the key from its seed module and records this code". Step 12's prose says
  "`seedDefaults` and the `TuningReader` both read it". Step 12's declaration is
  `provides: [seedDefaults]` only. `tuning_missing` has zero references outside
  `fault_codes.ts` (counted). Step 12 was marked done and passed the Checkpoint-1
  review without it, so this is a Step 12 implementation defect and a plan
  declaration defect.
- **Decision.** Step 12 provides `tuningReader(global, projectKey)` with the G8
  resolution order, re-seed, and `tuning_missing`, and declares it in `provides`.
  T-12-1 gains the missing-key case. Source: plan Steps 6 and 12 as written.
- **Layer.** Plan: Step 12 declaration. Code: Step 12 (reopens).
- **Owner or engineering.** Engineering.

### G18 — the bar's inputs are not on `Candidate`

- **Verdict: holds, and the skeleton fills one input with a constant.**
- **Evidence.** AD-14 and plan Step 16 name edit/read context, blast-radius band,
  zone criticality, and single/cross-file/comparative. Step 6's `Candidate` has
  none of these. In the skeleton, Coupling sets `blastRadius: 2` as a literal
  (`coupling.ts` line 120), so the read-context impact floor (≥ 2) always passes.
  The `zone` field exists but `passesBar` never reads it (read).
- **Decision.** (a) `context` is set by the handler from the event kind
  (`PreToolUse` Edit/Write, `Stop` → edit; Read/Grep/Glob → read), never by a
  genre, so no genre can raise its own impact (D-18: impact carries no genre
  term). (b) `blastRadius` is computed from data: the number of the target's
  partners whose pair clears the confidence floor, plus the target's
  `test_map` tests. (c) `zone` is the target file's `files.zone`, and the impact
  ordinal reads it. (d) `crossFile` and `comparative` are declared per genre in
  its module header and pinned by that genre's test. These fields become required
  (not optional) on `Candidate`. Source: AD-14, D-18, FR-A5.
- **Layer.** Plan: Steps 6 (type), 16, 18, 28.
- **Owner or engineering.** Engineering.

### G19 — the reference instant is never stored

- **Verdict: holds.** Plan Step 13 defines the reference instant (HEAD's committer
  time) and says why ("a fixture's fixed timestamps and a real repository's
  history are judged the same way on any day"). The miner computes `refTs`
  (`cochange.ts` line 163) and discards it. The skeleton handler uses wall-clock
  `Date.now()` (`handler.ts` line 190), which defeats that rationale.
- **Decision.** The miner writes `schema_meta.ref_ts` in the pass's transaction.
  The handler reads it once per event into `EventContext.refTs` (an indexed
  single-row read, inside AD-23's inventory). `passesBar`'s ctx gains `refTs`.
  Source: plan Step 13's own definition.
- **Layer.** Plan: Steps 6, 13, 16, 28.
- **Owner or engineering.** Engineering.

### G20 — the trust cap has no value

- **Verdict: partially holds.** "No value is written" holds. "Any cap below 0.6
  silences every history genre" is true arithmetic, but it assumes the cap must
  sit below the floor. AD-14's phrase is "can never yield **high**-confidence",
  which names a tier above the floor. The real gap is that "high-confidence" is
  undefined. The skeleton's composer hard-codes one (`confidence < 0.8` →
  `[confidence: uncertain]`, `compose.ts` line 44).
- **Decision.** Define the tier and the cap as tuning rows:
  `bar.high_confidence_min` (the composer's flag threshold, replacing the 0.8
  literal) and `bar.untrusted_confidence_cap`, strictly between
  `bar.confidence_floor` and `bar.high_confidence_min`. An `untrusted_repo` fact
  can pass the floor but is always delivered with its confidence stated as not
  high. Because every Phase A mined fact is `untrusted_repo` (Checkpoint-1 M1),
  this makes the honest property explicit: no Phase A mined whisper is presented
  as high-confidence. `injection_suspect` facts get a lower cap
  (`bar.suspect_confidence_cap`), because under M1's rule trust alone cannot
  separate suspect from ordinary repo content, and AD-19 requires suspect content
  to cap confidence. Sources: FR-X4 ("low trust lowers confidence"), AD-14, AD-19.
- **Layer.** Architecture: AD-14 (define the tier and both caps). Plan: Step 12
  seeds, Steps 16 and 19.
- **Owner or engineering.** Engineering.

### G21 — genres cannot see the tool's target

- **Verdict: holds, with two defects in the skeleton's fix.**
- **Evidence (executed).** (1) The adapter makes `targetPath` relative to the
  event's `cwd` (`adapter.ts` line 22), but store keys are relative to the repo
  root. With `cwd = <repo>/src`, a Read of `<repo>/src/api/handler.ts` produced no
  whisper, while the same Read with `cwd = <repo>` produced the coupling whisper
  (fresh store each; see N3). (2) For Grep/Glob the adapter takes `tool_input.path`
  (a directory or absent). AD-15 says Coupling fires for "the touched file" on
  Read/Grep/Glob, and for a search the touched files are the *results*, which are
  in `tool_response`, not `tool_input`.
- **Decision.** `InternalEvent` gains `targetPath` (normalized to repo-root-relative
  by the handler after it resolves `repoPath`, not by the adapter against `cwd`)
  and `searchTerm`. The adapter, the only module that names tool fields (AD-6),
  extracts both, and for Grep/Glob also extracts `resultPaths` from
  `tool_response`. Coupling's "touched file" for a search is each result path.
  Plan Step 25's `toolInput.file_path` in `decideDeny` is replaced by `targetPath`.
  Source: AD-6 (single field-naming module), AD-15 trigger table.
- **Layer.** Plan: Steps 6, 18, 25, 28.
- **Owner or engineering.** Engineering.

### G22 — no edited-file list on the reader

- **Verdict: holds, and the skeleton's substitute reads the wrong bucket.**
- **Evidence (code read).** `observedActionsDao.pathWrites` selects Edit-tool rows
  with **no `outcome` filter** (`observed_actions.ts` lines 82–91), and the handler
  appends failed edits as rows with `outcome 'failed'` (`handler.ts` line 180). So
  Completeness counts a failed Edit as an edit. AD-4's consumer filter says the
  edit-set (FR-A2f) consumes `'ok'` rows of Edit/Write only.
- **Decision.** Add `okEditedPaths(): string[]` to `ObservedActionsReader`
  (`outcome='ok'`, Edit/Write/MultiEdit/NotebookEdit, distinct). Completeness and
  Verification read only that. Source: AD-4 consumer filter.
- **Layer.** Plan: Steps 6, 9, 18.
- **Owner or engineering.** Engineering.

### G23 — dedup identity is too coarse (and G29, its source)

Reviewed together; they are one defect.

- **Verdict: holds (both).**
- **Evidence (executed, real binary).** (a) A question opened by
  `UserPromptSubmit` in session `s1` denied an Edit in session `OTHER` with a
  different transcript:
  `{"permissionDecision":"deny","permissionDecisionReason":"answer Max's question first: …"}`.
  (b) A Read that whispered Coupling in session `s1` was **silent** in session
  `s2`, and silent for a second subagent (`agent_id ag2`) after the first
  (`ag1`) had received it. (c) By code reading, `classify_state` is keyed by
  consumer role (`PRIMARY KEY(consumer)`), so session B's catch-up reads B's
  transcript from **session A's byte offset**, skipping or misreading B's turns.
  A `SessionStart startup` in one session also clears the dedup sets of every
  other live session on the repo (`reconcileDedupOnSessionStart` clears by role).
- **Decision.** The consumer key is `(session_id, agent_id | 'main')`, stored as
  one string in every consumer-keyed table (`questions`, `classify_state`,
  `consumer_state`, `observed_actions.consumer`, `whisper_audit.consumer`), as
  plan Step 28 already derives. The role (`main | subagent`) is a separate derived
  value used only for the FR-O6 allow-half (`decideDeny` returns null unless the
  role is main). The deny is scoped to the asking session: OL-C5 binds "their next
  move", meaning the agent that was asked, not another session's agent. One
  premise must be verified before this closes. On `fork` (a new `session_id`, per
  the current hooks reference: "`fork` — a new session forked from an existing
  one"), D-20's "reseed" needs the parent's state, and whether `SessionStart`
  input names the parent session is unverified. If it does not, reseed from the
  forked transcript (questions are already rebuilt from offset 0 by AD-9; the
  delivered set is rebuilt from the transcript's own oracle-injected lines). With
  sessions separated, AD-4's `q_open_dedup` index stays correct per consumer.
  Sources: FR-A4, FR-O6, OL-C5, D-20, AD-16. Measurement consequence: until this is
  fixed, the exit run's deny and delivery rates mix sessions.
- **Layer.** Architecture: AD-4 (consumer column semantics), AD-9 (bookmark and
  question scope), AD-16 (fork reseed source). Plan: Steps 6 (`Consumer` type),
  20, 22, 25, 27, 28.
- **Owner or engineering.** Engineering, bounded by OL-C5.

### G24 — no rule for the headline text

- **Verdict: partially holds.** A rule exists: AD-19 lists what a whisper may
  carry, "pointers (`path:line-span`, commit hashes), numbers, and names only".
  A headline built from paths and counts is therefore compliant. The real gap is
  the headline's *representation*. A free string lets a genre put verbatim text
  in, so the skeleton's composer ignores it. That drops the content AD-15's
  headline column requires ("17 of its last 20 changes" + commit pointer;
  Completeness's "you changed X but not Y, paired in 9 of its last 10"). The
  e2e output `[oracle] coupling: src/db/schema.ts (4 co-changes, ratio 1.00)`
  names neither the target nor a commit.
- **Decision.** Replace `headline: string` with a structured headline: a
  genre-owned fixed template (literal words written in the genre module) plus
  typed slots (`path`, `commit`, `symbol`, `count`, `ratio`). The composer
  renders only template words and slot values, so verbatim repo text is
  unrepresentable, and every AD-15 headline can be rendered. Filenames are
  repo-derived names: run them through the injection flagger at index time, and
  render a flagged name as `path#<file_id>` instead of the name. Sources: AD-19,
  AD-15 headline column, FR-D3, OWASP LLM01 (prompt injection via data).
- **Layer.** Plan: Steps 6, 18, 19. Architecture: AD-19 (the filename-injection
  sentence).
- **Owner or engineering.** Engineering.

### G25 — subject keys never line up

- **Verdict: partially holds.** The mismatch is real (`updateReadSet` adds
  `path:<file>`; candidates use `coupling:<target>:<partner>`). The implied fix —
  make reading the partner suppress the coupling fact — would be wrong. Reading
  file B does not reveal that A and B co-change: a history fact is "invisible from
  a cold checkout" (AD-14 marginal value).
- **Decision.** "Visibly incorporated" (FR-D5) is defined per fact. Each candidate
  carries the list of read-set keys that would make it self-served:
  Orientation's entry-point pointer to file X → `path:X`; Reuse's dominance
  claim → none (the agent cannot self-serve the comparison); every history fact →
  none. Dedup withholds a candidate whose subject key is in the delivered set, or
  one of whose `incorporatedBy` keys is in the read set. Source: FR-A4, FR-D5,
  AD-14 marginal-value classes.
- **Layer.** Architecture: AD-16 (one sentence defining incorporation per fact
  class). Plan: Steps 6, 18, 20.
- **Owner or engineering.** Engineering.

### G26 — a fixture contradicts the rule it tests

- **Verdict: holds.**
- **Evidence.** `test/replay/transcript_fixtures/human_markers.jsonl` line 1 has
  no `origin` field. This session's own transcript (checked 2026-09-26) has 25
  user entries with `origin.kind = "human"` and string content, 7
  `task-notification`, 7 `isMeta: true` (one of them `origin.kind = "peer"`),
  and 258 list-content entries with no origin (tool results), which supports
  the rule. Plan §11.4 records that `claude -p`
  transcripts carry no `origin` on human turns (plan lines 7032–7033): marker
  presence is mode-dependent, and that is L11(a), already open in STATUS.
- **Decision.** Add `"origin":{"kind":"human"}` to the marker-carrying fixture's
  human entries. Keep `markerless_user.jsonl` as the marker-less case (it
  exercises `rebuild_recovered_nothing`). Source: plan Step 21's rule; V12.
- **Layer.** Code: the Step 1 fixture (plan Step 1's description of it is
  already correct).
- **Owner or engineering.** Engineering.

### G27 — `decideDeny` cannot write its audit row

- **Verdict: holds.** Plan Step 25's signature
  `decideDeny(store, consumer, toolName, toolInput)` must append a
  `whisper_audit` row, whose `session` column is required. It also names
  `toolInput.file_path`, which only the adapter may name (AD-6).
- **Decision.** `decideDeny(store, ctx: EventContext)`: the context carries
  session, consumer key (G23), tool name, and `targetPath` (G21). Source: AD-6,
  AD-8 (audit-before-emit), FR-X6.
- **Layer.** Plan: Step 25.
- **Owner or engineering.** Engineering.

### G28 — the bookmark cannot be null

- **Verdict: partially holds — a wording defect, not a behavioral one.** For
  `startup`/`clear` the transcript is a new one, so "reset to null" and "reset to
  offset 0 with `bookmark_uuid` NULL" read from the same place. The schema allows
  `bookmark_uuid` NULL and defaults the offset to 0 (`classify_state` DDL). No
  behavior depends on a null offset.
- **Decision.** Plan Step 27 text: "`startup`/`clear` → bookmark reset to offset 0,
  `bookmark_uuid` NULL" (keep the schema). Under G23 the row is per session, so
  a new session starts with no row at all.
- **Layer.** Plan: Step 27.
- **Owner or engineering.** Engineering.

### G29 — see G23.

### G30 — repository lookup on the event path

- **Verdict: holds.**
- **Evidence.** `handler.ts` calls `resolveRepoKey` on every event, and
  `repo_key.ts` runs `git rev-parse --is-inside-work-tree`, `rev-parse
  --is-shallow-repository`, and `rev-list --max-parents=0 HEAD`. Measured on this
  repository: 11.2 ms average over 5 calls. The cost is not the issue:
  `rev-list --max-parents=0` walks the whole history, so it is unbounded on a
  large repository. AD-23 forbids it outright ("never a `git` subprocess on the
  event path").
- **Decision.** `init` records a path→key binding in the global store
  (`global_meta` key `repo_path:<realpath>` → repo key). The handler finds the
  repository root with a bounded upward walk for `.git` (at most one `stat` per
  path component), then does one indexed lookup. A miss means not initialized:
  fail open silent (no layout creation — see N15). `status` shows the binding. A
  moved checkout misses the lookup until `init` is re-run, which is visible, not
  silent. Source: AD-23 inventory; AD-3 (identity computed where it is safe, off
  the event path).
- **Layer.** Architecture: AD-23 inventory line and AD-20 `init` duty. Plan:
  Steps 28 and 31.
- **Owner or engineering.** Engineering.

### G31 — no fault code for a handler exception

- **Verdict: holds, and it hides a second misattribution.** A thrown `StoreBusy`
  (AD-26's give-up) is also reported as `store_corrupt`, because the handler's
  catch maps every non-deadline error to `store_corrupt` (`handler.ts` line 242),
  and `store_busy` has no writer anywhere (N9).
- **Decision.** Add `handler_exception` (detail: error class plus redacted
  message). Map `StoreBusy` → `store_busy`, and a SQLite corruption error
  (`SQLITE_CORRUPT`/`SQLITE_NOTADB`) → `store_corrupt`. Everything else →
  `handler_exception`. Source: AD-17 (a fault names what actually happened),
  AD-26, `FR-M2`.
- **Layer.** Plan: Steps 6 and 28.
- **Owner or engineering.** Engineering.

### G32 — the regret proxy has no input

- **Verdict: holds.** The schema has the column (`observed_actions.content_hash`,
  a plan column: "the edited file's hash after an ok Edit/Write, NULL when the file
  exceeds the AD-12 size cap"), and the DAO reads it (`firstHash`). No step
  assigns the write (`grep -n 'post-write'` over the plan finds only Step 30's
  reader lines), and the file read it needs is not in AD-23's inventory.
- **Decision.** On `PostToolUse` for Edit/Write/MultiEdit/NotebookEdit with
  `outcome ok`, the handler hashes the target file when it is at or under the
  AD-12 cap (one bounded read), and stores NULL above it, as the DDL comment
  already says. Add that read to AD-23's inventory, bounded by the cap. Source:
  FR-L4, AD-18, AD-23.
- **Layer.** Architecture: AD-23 inventory line. Plan: Step 28 (writer), Step 30
  (unchanged reader).
- **Owner or engineering.** Engineering.

### G33 — the `whisper_stats` window is undefined

- **Verdict: holds, and there is a missed-row race (N11).**
- **Decision.** One row per fold: `window_start` = the previous watermark,
  `window_end` = the new one. `status` sums rows for totals and can show trend.
  Corrections are attributed through `corrections.whisper_id →
  whisper_audit.genre`; a `--missed-question` or `missed` correction without a
  whisper is attributed to the genre the verb names, or to `answer_drift`.
  Watermark on the project store's monotonic `rowid` of `whisper_audit` and
  `corrections`, not wall-clock `ts` (N11). Source: AD-5 (the table and its
  watermark); FR-L4/FR-M1 (efficacy counts must not drop rows).
- **Layer.** Architecture: AD-5 (window and watermark definition). Plan: Step 30.
- **Owner or engineering.** Engineering.

### G34 — import can corrupt the store

- **Verdict: holds (a data-loss risk, now executed).**
- **Evidence (executed).** A live `store.db` held open by a second process with
  200 uncheckpointed WAL frames (`store.db-wal` = 2,472,032 bytes). Copying an
  exported database over it with `copyFileSync` (what `importVerb` does) and
  reopening: the schema shows a table present only in the stale WAL (`other`),
  and `PRAGMA integrity_check` throws `database disk image is malformed`.
  `importVerb` closes only its own handles; a concurrent hook process keeps the
  WAL alive.
- **Decision.** Import never overwrites a database file. It opens the destination
  with SQLite's online backup, `backup(sourceDb, destinationPath)` from
  `node:sqlite` (present from the 22.16.0 engines floor, per plan Step 32's own
  note), which takes the proper locks and is WAL-correct. It then runs
  `quick_check` on the result. *Executed:* the same probe with `copyFileSync`
  replaced by `await backup(new DatabaseSync(export), live)`, run while the
  holder process still had the store open, gave `integrity_check: ok`, only the
  imported table, and the imported rows. If the destination is busy past AD-26's retry, it
  refuses with `store_busy` and changes nothing. Source: SQLite "How To Corrupt
  An SQLite Database File" (overwriting a database, or pairing it with a foreign
  WAL, corrupts it); SQLite Online Backup API; FR-K9. This reverses plan Step 32's
  "Not the `sqlite.backup()` API" for import only (export via `VACUUM INTO` is
  fine), and the reason must be recorded in Step 32.
- **Layer.** Plan: Step 32. Architecture: AD-5 (the import mechanism sentence).
- **Owner or engineering.** Engineering.

### G35 — a fault before the repository is known is lost silently

- **Verdict: holds.**
- **Evidence (executed).** `{not json` on stdin to `hook PreToolUse` → exit 0,
  empty stdout (correct fail-open). JSONL faults under `CTXORACLE_HOME`: 0 before,
  0 after, and `diagnostics-orphan/` does not exist. `appendFault` opens
  `<dir>/<session>.jsonl` without creating `<dir>`, and the error is swallowed by
  the handler's inner catch.
- **Decision.** `ensureHome` (Step 4) creates `<home>/diagnostics/` (0700) as part
  of the home layout, and the handler's pre-repository fallback writes there.
  `status` reads it alongside the per-project channel. Source: OL-10 ("it could
  fail a hundred ways in front of me and I wouldn't know"), AD-17.
- **Layer.** Architecture: AD-17 (a home-level channel). Plan: Steps 4 and 28.
- **Owner or engineering.** Engineering.

### G36 — the exit run's leg 1 would count test transcripts

- **Verdict: partially holds.** The directories exist (`~/.claude/projects/`
  holds `-tmp-plan-probe-layout-N2hhY3` and `-tmp-tmp-DB12wzw05t`). But plan Step 39
  rule (a) already makes a transcript whose `cwd` is absent "path-keyed … its
  structural genres reported as not applicable", and the report splits by
  repository class. The remaining defect is that such transcripts still enter the
  QA and deny numbers, under an owner-code class they do not belong to.
- **Decision.** Define leg 1's corpus positively, not by exclusion (the lesson of
  OL-R5): a transcript is in the corpus iff its `cwd` resolves to a checkout in a
  declared repository list passed to `exit-run.sh`. The list holds the owner's
  repositories and this tool's own repository, which is its own class. Every
  other transcript is counted and listed as out of corpus with its reason.
  Source: measurement validity (a population defined by inclusion criteria);
  spec §11.5's "on a real repo".
- **Layer.** Plan: Step 39.
- **Owner or engineering.** Engineering. The declared list names the owner's
  repositories, which the implementation log already names for leg 2
  (`Maxcogar/NOVA`, `Maxcogar/Nova-Integrations`). If a repository is to be added,
  that is a scope line for Max Cogar, but the list itself needs no question now.

### Unverified item — whispers on `PreToolUse`

- **Verdict: partially holds — the field is honored, but the entry misses what
  matters, which is when the model reads it.**
- **Evidence (current hooks reference, fetched 2026-09-26).** The `PreToolUse`
  decision-control table lists `additionalContext`: "String added to Claude's
  context alongside the tool result." The "Add context for Claude" section: for
  `PreToolUse` the reminder appears "next to the tool result", and "Claude reads
  the reminder on the next model request". So the skeleton's channel is valid.
  But a Warning or Consequence on `PreToolUse` Edit is read **after the edit has
  run**, with its result, not before the model decides to edit. Spec C-4
  (spec line 478) says "injected before the tool runs"; that is true of when the
  hook executes and misleading about when the model sees it.
- **Decision.** (a) Correct spec C-4's wording to what the reference says, with
  the date. (b) Add a V-row to the architecture. (c) Write Warning and Consequence
  as facts about the edit just made ("⚠ `x.ts`, just edited, was reverted in 2
  commits: …"), so the agent's next move — revise or proceed — is the decision it
  informs. (d) Record the limitation plainly: the oracle cannot put a fact in
  front of the model *before* an edit without denying the edit, and a deny that
  does not follow a deviation is the pre-emptive gate the owner rejected (OL-R4,
  OL-C2, CLAUDE.md "No pre-emptive gate"). Keep the channel.
- **Layer.** Spec: C-4 wording (a factual correction, not a requirement change).
  Architecture: V-table, AD-15 headline wording. Plan: Step 18.
- **Owner or engineering.** Engineering, bounded by the owner's gate decision.
  Owner-visible: one plain line in STATUS ("warnings about an edit reach the agent
  right after it makes the edit, not before").

---

## Gaps the list missed

Each of these is in skeleton code or in the plan steps it implements. None is
marked `SKELETON:` in source, which also means the log's claim — "Every
provisional choice in it is marked `SKELETON: G<n>` in the source and listed
below" — does not hold (N9 lists the rest).

- **N1 — the corpus floor is not enforced (FR-A6, AC-6).** *Evidence (executed).*
  On a 4-commit repository (the floor is 30), the real binary emitted
  `[oracle] coupling: src/db/schema.ts (4 co-changes, ratio 1.00)`. The e2e test
  asserts that very whisper. The miner computes `corpusFloorMet` and returns it,
  but nothing stores it, and no genre checks it (`grep -rn corpus src`: only the
  seed row). Counting `commits` per event would be an O(store) statement, which
  AD-23 forbids. *Decision.* The miner writes `schema_meta.corpus_floor_met` in
  its transaction. History genres (Coupling, Consequence, Completeness, Warning's
  mined kinds) return no candidates while it is not `'1'`. The e2e test's repo
  gets ≥ 30 commits. *Layer.* Plan: Steps 13, 18. *Engineering.* Measurement
  consequence: exit data would include whispers from below-floor repositories.
- **N2 — the Stop-time outstanding-question line is emitted without an audit row
  (FR-X6, AD-8, AD-19 "an unlogged intervention does not exist").** *Evidence
  (executed).* After a `Stop` with a done-claim and an open question, the binary
  emitted `"additionalContext":"[oracle] still unanswered: \"what is the schema
  version?\""`. `whisper_audit` held only the coupling whisper and the deny row.
  The handler audits `texts` (genre whispers) and appends the line after them
  (`handler.ts` lines 206–221). *Decision.* The AC-8a line is a candidate
  (genre `answer_drift_backstop`) that goes through audit-then-emit like every
  whisper. *Layer.* Plan: Steps 27, 28. *Engineering.*
- **N3 — every path-keyed genre is silent when the session's cwd is a
  subdirectory.** *Evidence (executed).* See G21: with `cwd=<repo>/src` the Read
  whisper was `""`, and from the repo root the same Read whispered. *Decision.*
  G21's normalization against `repoPath`. *Layer.* Plan: Steps 6, 28.
  *Engineering.* Measurement consequence: leg 1/2 sessions started in a
  subdirectory would show zero whispers, read as "the floor is low".
- **N4 — `entry_score` grows on every incremental index.** *Evidence (executed).*
  Three `runIndex` runs on an unchanged tree gave `src/util.ts` `entry_score`
  1 → 2 → 3 (`UPDATE files SET entry_score = entry_score + ?` for every known
  file, including skipped ones, `indexer.ts` lines 255–258). That violates T-14-1
  ("a second run over an unchanged tree writes nothing") and corrupts
  Orientation's ranking over time. *Decision.* Recompute
  `entry_score = marker points + in-degree` as an assignment for every file at the
  end of each pass. *Layer.* Code: Step 14. *Engineering.*
- **N5 — duplicate and stale landmine rows.** *Evidence (executed).* See G5 (two
  `fix_chatter` rows for one file; `revert_chain` citing a rewritten-away
  commit). *Decision.* G5's rebuild with key `(kind, file_id)`. *Layer.* Plan:
  Steps 9, 13. *Engineering.*
- **N6 — FTS and `LIKE` symbol search disagree.** *Evidence (executed).*
  `symbolSearch(['help'])` returned `[]` under FTS5 and `helper` under the
  fallback. The fallback uses `name LIKE 'help%'` (prefix), while FTS quotes the
  term as an exact token. Plan Step 14 calls the fallback "token-prefix", and
  T-15-3 requires the two hit sets to agree. *Decision.* FTS terms are quoted
  prefix queries (`"help"*`), so input text still cannot inject syntax. Both paths
  use token-prefix semantics, and T-15-3 pins it for symbols and paths. Source:
  SQLite FTS5 prefix queries. *Layer.* Plan: Step 14 (state the semantics). Code:
  `search.ts`. *Engineering.*
- **N7 — indexing a non-git directory throws.** *Evidence (executed).* See G11.
  *Decision.* G11 (b). *Layer.* Plan: Step 14. *Engineering.*
- **N8 — Python relative imports never resolve.** *Evidence (executed).* See G12.
  *Decision.* G12. *Layer.* Plan: Step 15. *Engineering.*
- **N9 — unmarked omissions, and `store_busy` has no writer.** *Evidence
  (counted: references outside `fault_codes.ts`).* `hooks_not_firing` 0,
  `produced_but_undelivered` 0, `deny_despite_answer_text` 0,
  `rebuild_recovered_nothing` 0, `tuning_missing` 0, `store_busy` 0. The FR-M4
  done-claim counter (Step 27) is not built. The `ObservedActionsReader` stubs
  `firstHash: () => undefined, writtenSince: () => 0` (`handler.ts` lines
  101–102). The skeleton also skips parsing every non-`source` zone
  (`indexer.ts` line 230), which no plan step says. None of these carries a
  `SKELETON: G<n>` mark or a list entry. Omitted detectors are the self-report
  OL-10 exists for, so their absence must be explicit. *Decision.* Mark each
  omission in source and list it with the step that builds it. Decide the
  zone-parse rule explicitly: generated or vendored files get symbols but are
  excluded from Orientation and Reuse candidates by zone, because hiding their
  symbols also hides the "this is generated" fact at a search. *Layer.* Plan: the
  implementation log's list; Step 14 (the zone rule). *Engineering.*
- **N10 — hard-coded thresholds in consuming modules.** *Evidence (read).*
  Coupling's `blastRadius: 2` (G18); the composer's `0.8`
  (`compose.ts` line 44, G20); Warning's text "in the last 90 days"
  (`warning.ts` line 145), which goes wrong when `landmine.fix_chatter_window_days`
  is tuned; and the miner and bar fallback literals (G8). Plan Step 12: "no
  consuming module carries a number of its own". *Decision.* Every one reads its
  tuning key; the rendered window is the tuned value. *Layer.* Code: Steps
  13, 16, 18, 19. *Engineering.*
- **N11 — the `whisper_stats` fold can permanently skip rows.** *Evidence
  (reasoned from code, not executed — a timing race).* The fold selects
  `whisper_audit` rows with `ts > watermark AND ts <= now` and advances the
  watermark to `now` (`whisper_stats_fold.ts`). A concurrent session's
  handler that stamped `ts` before `now` but commits after the fold's read is
  never folded. `ts` is wall-clock from another process, and `whisper_audit`
  commits are not ordered by it. *Decision.* Watermark on the project store's
  `rowid` (assigned at insert under SQLite's single writer, monotonic while rows
  are never deleted — AD-4 makes `whisper_audit` non-droppable). *Layer.*
  Architecture: AD-5. Plan: Step 30. *Engineering.*
- **N12 — Completeness counts failed edits.** *Evidence (read).* See G22.
  *Decision.* G22. *Engineering.*
- **N13 — `test_map` and route-registration conventions are undefined.**
  *Evidence.* AD-12 and plan Step 14 say `test_map` is built from "path conventions
  + import edges from test files", and `entry_score` includes
  "route-registration patterns". Neither document lists a convention, and
  `test_map.region_glob` has no stated meaning (`grep` over the architecture and
  the plan). This is the same class as G12, but G11 lists it only as "not produced
  yet". Consequence and Verification (FR-A2d, FR-A2g, AC-8) depend on it. *Decision.* A
  `lexicon.test_path_patterns` `plan_seed` list (e.g. `**/*.test.*`,
  `**/*.spec.*`, `**/test_*.py`, `**/*_test.go`, `**/__tests__/**`, `test/**`,
  `tests/**`). A file matching one is a test file, and its `import_edges` targets
  are the files it covers. `region_glob` is the covered file's path (whole-file
  regions in Phase A, disclosed). Route-registration is dropped from Phase A's
  `entry_score` unless a per-language pattern is written, because an unlisted
  heuristic is not buildable. Sources: the conventions of the named test runners;
  AD-12. *Layer.* Architecture: AD-12 (the conventions are a named, tunable list).
  Plan: Steps 12, 14. *Engineering.*
- **N14 — `PreToolUse` whisper timing.** See the Unverified item above.
- **N15 — the handler creates store layout for every repository it sees.**
  *Evidence (executed).* Two `hook SessionStart` runs against an empty
  `CTXORACLE_HOME`, one from `/tmp` and one from `/home/user/agent-armory`, where
  neither was ever `init`-ed, created `projects/9a08f9c2a9d8/` and
  `projects/e9671acd2448/`. The handler calls `ensureLayout` before its "not
  initialized" check (`handler.ts` lines 84–86). mkdir is not in AD-23's
  inventory, and per-repository state should exist only after `init` (AD-20).
  *Decision.* The handler resolves the binding (G30) and, on a miss, writes
  nothing except, for a fault, the home-level channel (G35). *Layer.* Plan:
  Step 28. *Engineering.*
- **N16 — `seq` is a millisecond timestamp.** *Evidence (read).*
  `observed_actions.seq` and `session_log.seq` are `Date.now()`
  (`handler.ts` lines 176, 233). Two events in one millisecond collide, and
  concurrent processes interleave. `pathWrites(session, sinceSeq)` assumes an
  ordered sequence. *Decision.* Use the insert `rowid`, or a per-session counter
  in `classify_state`, as `seq`. *Layer.* Plan: Step 28. *Engineering.*

---

## Summary

| Item | Verdict | Owning layer(s) | Owner? |
|---|---|---|---|
| G1 | holds | architecture AD-15; plan S12/S13 | engineering |
| G2 | partially holds | architecture AD-4; plan S7/S9/S13/S14 | engineering |
| G3 | holds | architecture AD-4/AD-13; plan S7/S9/S13/S16 | engineering |
| G4 | holds | plan S6/S13 | engineering |
| G5 | holds (worse than stated) | architecture AD-4/AD-15; plan S7/S9/S13 | engineering |
| G6 | holds (systemic) | plan (step declarations) | engineering |
| G7 | partially holds | plan S5/S6/S13/S14 | engineering |
| G8 | holds | plan (signatures S13–S18, S28) | engineering |
| G9 | holds | architecture AD-26; plan S3/S13/S14 | engineering |
| G10 | does not hold | architecture V-table | engineering |
| G11 | partially holds | architecture AD-12; plan S14 | engineering |
| G12 | holds | plan S15 | engineering |
| G13 | holds (+ Reuse consequence) | architecture AD-12/AD-15; plan S15 | engineering |
| G14 | holds | plan S14/S15 | engineering |
| G15 | holds | plan S6/S14 | engineering |
| G16 | holds | plan S7; code migration 001b | engineering |
| G17 | holds | plan S12; code S12 | engineering |
| G18 | holds | plan S6/S16/S18/S28 | engineering |
| G19 | holds | plan S6/S13/S16/S28 | engineering |
| G20 | partially holds | architecture AD-14; plan S12/S16/S19 | engineering |
| G21 | holds | plan S6/S18/S25/S28 | engineering |
| G22 | holds | plan S6/S9/S18 | engineering |
| G23 + G29 | hold | architecture AD-4/AD-9/AD-16; plan S6/S20/S22/S25/S27/S28 | engineering (bounded by OL-C5) |
| G24 | partially holds | plan S6/S18/S19; architecture AD-19 | engineering |
| G25 | partially holds | architecture AD-16; plan S6/S18/S20 | engineering |
| G26 | holds | code (Step 1 fixture) | engineering |
| G27 | holds | plan S25 | engineering |
| G28 | partially holds (wording only) | plan S27 | engineering |
| G30 | holds | architecture AD-23/AD-20; plan S28/S31 | engineering |
| G31 | holds (+ `store_busy` misattributed) | plan S6/S28 | engineering |
| G32 | holds | architecture AD-23; plan S28 | engineering |
| G33 | holds | architecture AD-5; plan S30 | engineering |
| G34 | holds (data loss, executed) | plan S32; architecture AD-5 | engineering |
| G35 | holds | architecture AD-17; plan S4/S28 | engineering |
| G36 | partially holds | plan S39 | engineering |
| `PreToolUse` whisper | partially holds (timing) | spec C-4 wording; architecture V-table/AD-15; plan S18 | engineering, bounded by OL-R4/OL-C2; owner-visible |
| N1–N16 | missed; evidence above | as listed per item | engineering |

**Architecture-level changes the decisions require (to record before the full
build).** AD-4 (`files.in_tree`, per-file change count, drop pair counters,
labelled touches, consumer-key semantics), AD-5 (fold window, rowid watermark,
import via backup), AD-9/AD-16 (per-session consumer, fork reseed source,
incorporation per fact class), AD-12 (walk rule, capability declaration,
test-path conventions), AD-13 (confidence denominator), AD-14 (confidence tier
and trust caps), AD-15 (label definitions, Reuse discriminator), AD-17
(home-level diagnostics), AD-19 (filename injection rule), AD-23 (repo binding
lookup, post-write hash read), AD-26 (nested transactions), and the V-table
(exit-0 stderr; `PreToolUse` context timing). The spec needs only C-4's wording
corrected.

**Open premise to verify before G23/G29 closes.** Whether `SessionStart` with
`source: "fork"` carries the parent session's id. If it does not, the reseed comes
from the forked transcript, as the G23 decision states.
