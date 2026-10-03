# Review record — Step 14, the structural indexer (commit `177e59f`)

*Point-in-time review record. Written once, never edited. Independent reviewer:
wrote neither the tests nor the code under review. Scope: `git diff
7800246..177e59f -- ctxoracle/` and the implementation-log's Step 14 entry,
judged against plan Step 14 as amended at `37ea382`, `6f5ceb8` and `8a234d6`,
§7's conventions, §9's rows "Step 14's skeleton callers", "Step 14's skeleton
frontends", "Step 13's skeleton caller" and the 1R indexer/search rows, §12
T-14-1…T-14-5 and T-13-5(c), D-plan-29 and D-plan-32, and architecture AD-2,
AD-4's tables, AD-12, AD-19 (filenames), AD-23 (bounded reads) and AD-26.*

## Verdict

**Conforms to the plan's text in almost every sentence, with two Serious and
five Moderate findings open.** The walk, the tracked-and-ignored signal, the
zone precedence, the one tokenizer, both search paths, the caps, the path-only
skip key, the absent-file rule, `entry_score` as an assignment, the per-language
record, the claim and its release, `refreshIfStale`'s transition rule and all
four `HEAD` layouts do what the plan says. The §9 stand-ins are the changes the
rows name. The suite overstated what it checks: **39 of 66 hand mutations
survived the builder's T-14 tests** (the relative `gitdir:`, `--others`, the
symlink rule on both walks, `?`, the `in_tree` search filter, four of five zone
rules, both cap boundaries, the stat key, `full`, `indexing_in_progress`, every
absent-file deletion but `in_tree`, the in-degree, the stem rule, both
`symbol_refs` rules, `test_map`'s test-file exclusion, the capability counts,
`full` reaching the miner, the readdir miner skip, the owner check on release,
the `finally`, the loose-before-packed order, 64-hex `HEAD`, and both
stand-ins). The builder's tests run with an empty frontend list, so no
assertion saw a symbol or an edge. This review added 27 tests; 65 of 66 are now
killed, and the one survivor is a plan silence.

Both Serious findings are plan-level and inside the phase goal. The incremental
rule keys a file only by its bytes, so rows derived from other files or from the
frontend list go stale and stay stale: a changed frontend list re-parses nothing
while `lang_capabilities` declares the new capability over zero rows (S1), and a
branch round trip permanently deletes the import edges, `test_map` rows,
in-degree and `symbol_refs` into every file that exists on one branch only (S2,
the builder's own "known limitation", which does break a Phase A requirement).

Phase-goal check (CLAUDE.md rule 3): S1 is G13's exact failure ("observed zero"
indistinguishable from "never counted") reintroduced one level down. S2 makes
the Coupling, Consequence, Verification and Orientation inputs decay silently
under routine branch switching, which is exactly how Step 39's exit run will
exercise it, so the floor Phase A measures would be the indexer's decay, not the
genres'. M1 is a broken ASVS V5 bound. M2, M3 and M5 are wrong rows that no
check reports. M4 is a fault flood and a silently disabled staleness detector on
reftable repositories. None is polish.

## Findings

### Serious

**S1 — A change of frontend list (or of a frontend's capability) re-parses no
unchanged file, and `lang_capabilities` then declares the new capability over
rows it never produced.** `ctxoracle/src/index/indexer.ts:443-450` (the
`unchanged` predicate: `content_hash`, `lang`, `zone`, `zone_evidence` only),
`:733-743` (capabilities taken from the *current* list).
- *Standard / evidence.* AD-12 and G13: capabilities are recorded "so coverage
  is measured, not claimed". A cache key must include every input of the cached
  value; the parse's inputs are the bytes **and** the frontend. Executed against
  `dist/` (two files, `a.ts` importing `./b.js`): index with `[]`, then with a
  TypeScript frontend declaring `{symbols: true, imports: true}` on the
  unchanged tree → `filesWritten 0 symbols 0 edges 0`, and
  `lang_capabilities = {"typescript":{"frontend":"tree-sitter","symbols":true,"imports":true,"resolved":0,"unresolved":0,"files":2}}`.
  Only `--full` repairs it (`symbols 2 edges 1`). This will happen at Step 15:
  every store indexed with Step 14's list or the skeleton frontends keeps
  skeleton rows under Step 15's declared capabilities. It recurs with every
  grammar or query added later, which C-6 says is "a config change". Reuse keys
  on this record (AD-15), so a language reads as observed-zero.
- *Fix (plan + code).* Record a frontend fingerprint in the final transaction:
  `schema_meta.index_frontends` = the sorted `lang:capabilities:version` list
  (a frontend gains a `version` string). A pass whose fingerprint differs from
  the stored one runs as `full` for the affected languages, or simply as
  `full`. Add a T-14-1 case: index with `[]`, re-index the unchanged tree with a
  parsing frontend, and require its symbols.
- *Owning layer.* Plan (Step 14's incremental sentence and the `LanguageFrontend`
  interface), then code.

**S2 — Builder's known limitation: an unchanged importer is never
re-resolved. It breaks AD-12's `import_edges`, `test_map`, `entry_score` and
`symbol_refs` under routine use, not only in an edge case.**
`indexer.ts:513-521` (resolution runs only while parsing a changed file),
`:615`/`:623` (edges into an absent file are deleted, the importer's
`unresolved_imports` untouched).
- *Evidence (executed against `dist/`, a relative-resolving TypeScript
  frontend).* Branch round trip: `main` has `src/a.ts` and `src/b.test.ts`
  importing `src/b.ts`, and branch `nob` deletes `b.ts`. Index on `main` →
  edges `a->b, b.test->b`, `test_map [src/b.ts]`, `b` `entry_score 2`. Check
  out `nob` and index → `edges []`, `unresolved []` (the lost imports are not
  counted anywhere). Check out `main` again and index → **`edges []`,
  `test_map []`, `entry_score 0`, `symbol_refs 0`**, permanently, because
  neither importer changed. Test-first order: `src/foo.test.ts` importing
  `./foo.js` is indexed before `src/foo.ts` exists. After `foo.ts` is created,
  the next index gives `edges []`, `unresolved [foo.test.ts:1]`, `test_map []`.
- *Does it break a Phase A requirement?* Yes. AD-12 makes `import_edges` "what
  import extraction actually yields" and the producer of `entry_score`,
  `symbol_refs` and `test_map`. AD-17/FR-K7 make `index_head` equality mean "the
  index describes `HEAD`". After the round trip `index_head` equals `HEAD` and
  `index_stale = '0'`, yet the index is wrong, and nothing (no fault, no status
  line) says so. The unresolved share that AD-15's Reuse reads is understated
  while the target is absent.
- *The builder's stated cost is too high.* "Re-resolving would need every
  importer's specifiers stored, or a re-parse of every importer." Neither is
  needed. The pass knows exactly which importers can resolve differently: (a)
  when any path appears, the files with `unresolved_imports > 0` (an import of a
  missing file is counted unresolved at `:518`), and (b) when a path disappears,
  the `src_file`s of the edges into it (read before `:623` deletes them). Add
  those files to the parse set. For (b) alone, `unresolved_imports += edges
  dropped` is also exact.
- *Fix (plan + code).* State the rule in Step 14's incremental sentence and
  implement (a) and (b). Add T-14-3 cases for the round trip and the test-first
  order.
- *Owning layer.* Plan (the sentence was silent), then code.

### Moderate

**M1 — The byte cap is enforced on the `lstat` size, not on the read, so a
file that grows (or is swapped for a link) between the two is read and parsed
whole.** `indexer.ts:406-407` (lstat), `:464` → `readLineBounded` `:122-146`
(no byte bound, `openSync` follows symlinks), and the same `readLineBounded`
for `symbol_refs` at `:652-653`.
- *Standard / evidence.* OWASP ASVS 5.0 V5 (the plan's own cited standard for
  the caps) and AD-23: the cap bounds the bytes that are *read*. CWE-367
  (TOCTOU): a check on a path and a later use of the same path are not one
  operation. The working tree changes while the detached reindex runs (the
  agent writes files, and an untracked log is listed by `--others`). Executed:
  a frontend's `parse` of `a.ts` appends 5,000,000 bytes to `b.ts` (lstat'd at
  23 bytes). `b.ts` then reaches `parse` with **5,000,023 bytes**, and no
  `index_path_only_oversize` is recorded. Replacing the file with a symlink to
  `/dev/zero` after the `lstat` would make the read unbounded (no newline, no
  byte limit). A FIFO would block it.
- *Fix (code).* Open with `O_RDONLY | O_NOFOLLOW | O_NONBLOCK`, `fstat` the
  descriptor (regular file, and its size under the cap), and read at most
  `MAX_BYTES + 1` bytes. More than `MAX_BYTES` read means path-only `bytes`. Use
  the same helper for the `symbol_refs` read and the 2 KB head read.
- *Owning layer.* Code (the plan says "bounded read"; the text is met only on
  the stat).

**M2 — `test_map.region_glob` is the covered path written verbatim, but it is
read as a GLOB pattern, so any path holding `[`, `*` or `?` maps wrongly.**
Writer `indexer.ts:691`, `:696`; reader `src/stores/dao/test_map.ts:35`
(`WHERE ? GLOB region_glob`).
- *Standard / evidence.* SQLite `GLOB`: `*`, `?` and `[...]` are metacharacters.
  A pattern built from data must escape them. Next.js dynamic routes
  (`app/[id]/page.tsx`) make bracketed paths common. Executed:
  `app/[id]/page.test.ts` importing `./page.js` → row `region_glob =
  'app/[id]/page.ts'`; `coveringTests('app/[id]/page.ts') = []` and
  `coveringTests('app/i/page.ts') = [1]` (the test is attributed to an unrelated
  file and lost from its own).
- *Fix (code).* Escape at write time: `[` → `[[]`, `*` → `[*]`, `?` → `[?]`
  (a `region_glob` stays a glob, as its name promises, and Phase B globs keep
  working). Add a T-14-3 row for a bracketed path.
- *Owning layer.* Code (Step 14 writer; the plan's "region_glob is the covered
  file's path" should say "as a GLOB-escaped pattern").

**M3 — The generated marker matches anywhere in the head 2 KB, not as a marker
comment. Every marker hit in this repository is a false positive, including
`zone.ts` itself.** `src/index/zone.ts:31` (`/@generated|DO NOT EDIT/`), `:55`.
- *Standard / evidence.* The plan says "a marker **comment** in the head 2 KB".
  Go's published convention is a whole line matching `^// Code generated .* DO
  NOT EDIT\.$` (fetched: pkg.go.dev/cmd/go, "Generate Go files by processing
  source"), and `@generated` is a comment tag.
  Executed over every tracked file of this repository with `classifyZone`: 3
  marker classifications, all false: `ctxoracle/src/index/zone.ts` (its own
  header comment line "a generated-file marker comment in the head 2 KB
  (`@generated`, …"), `ctxoracle/test/unit/indexer.test.ts`, and
  `claude-plugins/agentboard/docs/specs/spec-chunk.md` ("# DO NOT EDIT THIS FILE
  WITHOUT DIRECT OWNER APPROVAL"). Orientation and Reuse drop non-`source` zones
  (Step 18), so a generator's own source, or any file that documents the
  convention, vanishes from both genres.
- *Fix (plan + code).* Name the patterns exactly: a line matching Go's regex, or
  a comment line whose first token is `@generated` (`^\s*(//|#|--|/?\*+)\s*@generated\b`).
  The fixture's `# @generated by scripts/gen.sh -- DO NOT EDIT …` still
  matches, and all three false positives above stop matching.
- *Owning layer.* Plan (state the patterns), code.

**M4 — `head_unresolved` is recorded on every call, and on a reftable
repository `HEAD` is never resolvable, so staleness is silently disabled there
and each event writes a fault.** `indexer.ts:228-231`.
- *Standard / evidence.* The plan made `index_stale` a transition-only fault for
  exactly this reason (expert review m3: "one fault … not one per event");
  `head_unresolved` got no such rule. Executed: 5 `refreshIfStale` calls on an
  unborn branch → 5 `head_unresolved` rows. git's reftable format (fetched,
  git-scm.com/docs/reftable, "Backward compatibility"): a reftable repository's
  `.git/HEAD` is "a regular file containing `ref: refs/heads/.invalid`", with
  refs in `reftable/`. So `resolveHead` returns `{unresolved}` forever on such
  a repository (git 2.43.0 here has no reftable backend, so this part was read,
  not executed). `refreshIfStale` then answers `{stale: false}` on every event while `HEAD`
  moves, and writes one fault per event. This conforms to the plan's text ("a
  layout the resolver does not understand"), but not to its intent.
- *Fix (plan + code).* Record `head_unresolved` only on the transition (a
  `schema_meta.head_unresolved` flag, cleared by a resolved call). Name
  reftable as a layout in `status`, and either support the reftable table read
  or document the gap in §15.
- *Owning layer.* Plan (Step 14's `refreshIfStale` sentence), then code.

**M5 — An index pass that crashes after `markAbsentExcept` commits, and before
the absent-file chunks run, leaves that file's symbols, tokens and FTS rows
forever. Neither `indexing_in_progress` nor `--full` can reach them.**
`indexer.ts:614` (the `in_tree = 0` update commits alone) then `:617-628`
(derived-row deletes in later chunks).
- *Evidence.* The next pass's `markAbsentExcept` acts only on `in_tree = 1`
  rows, so a row already at 0 is never revisited. The flag is set only when
  `pending.length > 0` (`:543`), so an absent-only pass is not flagged at all.
  Reproduced against `dist/`: the post-crash state (`in_tree = 0` set on
  `src/b.ts`, file deleted, `indexing_in_progress = '1'`), then one incremental
  and one `full` pass → `b.ts symbols 1 path_tokens 3 fts_paths 1`. Search hides
  them through the `in_tree` filter. `symbol_refs` recomputation still reads the
  dead symbols of any edge target, and the rows break the plan's invariant
  that an absent file's derived rows are deleted.
- *Fix (code).* Do the `in_tree = 0` update per file inside the same chunk
  transaction that deletes its derived rows (the plan's own "file's rows in the
  same chunk" rule, AD-26). Or, idempotently, clean the derived rows of every
  `in_tree = 0` file on each pass (one `DELETE … WHERE file_id IN (SELECT id
  FROM files WHERE in_tree = 0)` per table).
- *Owning layer.* Code.

### Minor

**m1 — git's repository-selecting environment is inherited.** `walk.ts:31`,
`:63` via `src/util/spawn.ts:72-73` (`childEnv` copies `process.env`).
`readGitPointer` decides git mode from the directory, but `git` obeys
`GIT_DIR`/`GIT_WORK_TREE`, which git exports to hooks (fetched: githooks(5),
"Environment variables, such as `GIT_DIR`, `GIT_WORK_TREE`, etc., are
exported … If your hook needs to invoke Git commands in a foreign repository …
it should clear these environment variables"). A user who wires `ctxoracle
index` into a `post-checkout` hook is the natural case.
Executed: with `GIT_DIR`/`GIT_WORK_TREE` naming repository B,
`walkRepository(A)` returned `['only-in-b.ts']`. *Fix (code):* unset the
variables `git rev-parse --local-env-vars` lists (the remedy githooks(5) gives)
for every indexer and miner git child.

**m2 — The readdir walk has no error handling.** `walk.ts:84`: one
`readdirSync` failure (a directory removed mid-walk by a build's clean step, or
an unreadable directory) throws the whole pass, where git mode treats a failed
`lstat` as absent. *Fix (code):* catch per directory, count the skipped
directories into a fault, and continue. Not executed (the container runs as
root, so permissions do not block).

**m3 — The stat key is weaker than the plan's parenthesis claims.** Plan Step
14: "(the change check git's own index uses)". git's index compares `st_mode`,
`st_mtime`, `st_ctime`, `st_uid`, `st_gid`, `st_ino` and `st_size`. It also
re-checks "racily clean" entries by content (fetched: git
`Documentation/technical/racy-git.adoc`). `stat:<size>:<mtime_ms>` misses a
same-size rewrite within one millisecond, or one that restores the mtime.
Tolerable for a path-only file (only the 2 KB head's zone marker depends on it).
*Fix (plan):* add `ctime_ms` and `ino` to the key and correct the parenthesis.

**m4 — The whole pass's parse output is held in memory before the first
write** (`indexer.ts:435-525`, `pending` with every changed file's symbols). A
full index of a large repository holds every symbol at once. The plan requires
chunked *writes*, and that holds. *Fix (code, optional):* write pass 1 in
chunks as files are parsed. Edges already wait for pass 2.

**m5 — A `resolved` result that names a non-present file, or the importing
file itself, is counted as unresolved** (`indexer.ts:517-518`). The plan says
"`resolved` → an `import_edges` row" and is silent on this case, so
mutation I25 (drop that counting) survives and no test was added. *Fix (plan):*
say which count it joins. A self-import is resolved, not unresolved.

**m6 — A frontend `init` rejection aborts the whole pass** (`indexer.ts:494`).
A parse failure is a value (`frontend_parse_failed`), but a missing grammar
file stops every language. The claim is released (pinned by RV-24).
*Fix (plan, Step 15):* record the fault and index that language path-only.

**m7 — Step 14's step-decl `files.modify` omits the four stand-in files** the
§9 rows authorize (the builder's own note to the coordinator). *Fix (plan):*
add them, so §5.1 lists them under S14.

## The builder's plan-silence decisions — judged

| Decision (implementation log) | Holds? | Evidence |
|---|---|---|
| `indexing_in_progress`: set before the first write, deleted in the final transaction; a pass that finds it set runs as `full` | **Holds, with a gap** | Confirmed into the plan at `8a234d6`. Now pinned by RV-15 (I8). The gap is M5: it is set only when `pending` is non-empty, and `full` does not revisit `in_tree = 0` rows. |
| The tree-sitter skeleton gets `resolve` (moved from the indexer), bare specifiers `external` | **Holds** | The interface requires `resolve` when `imports = true`. Stand-in only; Step 15 owns resolution (note: Python's `import b` is bare and so `external`, so T-14-3's `tests/test_b.py → b.py` todo cannot pass on the skeleton). |
| The unchanged test also compares zone, zone evidence and `lang` | **Holds, but is incomplete** | A `.gitignore` change must re-zone an unchanged file. Executed and pinned by RV-13 (I5). The frontend is a missing input (S1). |
| Symbols parsed from raw bytes; every derived string redacted before storage; specifiers never stored | **Holds** | `SymbolRow` carries only `name`, `kind` and spans, and `kind` is frontend-chosen. `redact` changes lengths, so parsing redacted text would shift spans that AD-15's rumor rule re-reads on disk. The zone evidence secret check passes (T-14-1). |
| `lstat`, not `stat` | **Holds, partly** | Pinned by RV-5 (W7). The later `openSync` still follows a link swapped in after the `lstat` (M1). |
| A non-UTF-8 directory in readdir mode is one rejected entry, not descended | **Holds** | Nothing beneath it can be decoded. Note: git mode reports each file under such a directory separately, so the two modes' counts differ. Pinned in part by RV-6. |
| No `ext_to_grammar` entry → `lang 'unknown'`, with an `unknown` capability entry | **Holds** | It makes the uncovered set visible in `lang_capabilities`, which is AD-12's purpose. |
| `frontend` label: `generic` for `'*'`, `tree-sitter` for any other, `path-only` when none | **Holds** | Plan's three values. RV-20 pins the record. |
| `symbol_refs` recompute set: every written file, plus every importer of a written file | **Holds for content changes** | Pinned by RV-18 (I17). It does not cover importer-set changes, because those never happen for unchanged importers (S2). |
| `test_map` recomputed for every present test file, written only where it differs | **Holds** | Stricter than "changed test files", which misses a same-dir sibling being added. The T-14-1 rerun proves no write on an unchanged tree. |
| Symbol provenance `injection_suspect` = path flag OR any name's flag | **Holds (conservative)** | The DAO takes one provenance per file, so one suspect name dampens the file's other symbols. It over-flags and never under-flags. |
| Lockfiles: the skeleton's five plus `Gemfile.lock`, `composer.lock` | **Holds** | AD-12 names no list. Pinned by RV-9 (Z6). |
| Miner skipped in readdir mode; `mine: null` | **Holds** | Executed: without the skip, a readdir root inside a repository mines the enclosing history. Pinned by RV-22 (I29). |
| `lines` = 20,001 in a line-cap fault (a lower bound) | **Holds** | The read stops there by design; the value is honest about being a floor. |
| Several search terms → union of hit sets | **Holds** | The plan is silent. The union is the natural reading of a term list, and Step 18 passes tokens separately. |
| **Known limitation** — unchanged importers not re-resolved | **Does not hold as a limitation; it is S2** | It breaks a Phase A requirement under branch switching and test-first work, and the fix needs no new storage. |

## Other checks against established practice (no finding)

- **`ls-files -z` / `check-ignore --stdin -z`.** NUL framing both ways, paths
  as bytes, fatal UTF-8 decoding with the BOM kept, and each unmerged path or
  rejected byte string kept once. `check-ignore` exit 0/1 is data and anything
  else throws (W4 shows the exit-1 case matters on every repository without a
  `.gitignore`). Every path `check-ignore` prints is tracked, because
  `--exclude-standard` already removed ignored untracked files.
- **FTS5.** Both tables declare their id columns `UNINDEXED`, so a digit token
  cannot match an id. A token holds only `\p{L}\p{N}`, so `"<token>"*` cannot
  carry query syntax. Every FTS row is deleted explicitly before a rewrite and
  on removal (RV-16 now pins the removal).
- **The fallback range.** `token < token || char(0x10FFFF)` is an exact byte
  prefix bound under BINARY collation, because U+10FFFF (`F4 8F BF BF`) is the
  largest UTF-8 sequence, and the index serves it.
- **`tokenize` order.** Under NFKD first, lowercasing before or after mark
  removal gives the same tokens (`İ` decomposes before it is lowercased), so
  that variant is equivalent and was not run.
- **The claim.** The check and the write sit in one `BEGIN IMMEDIATE`, and the
  50-iteration two-process race passes. A release checks the owner (RV-23), and
  the `finally` covers failures (RV-24). A reused pid holding a stale claim
  keeps it until that process exits, and `status` shows the start time
  (D-plan-32 accepted this). The `EPERM` branch could not be exercised here:
  the container runs as root, so `kill(pid, 0)` never returns `EPERM`.
- **`.git` file parsing.** git requires the file to start with `gitdir: ` and
  strips trailing CR/LF (fetched: `setup.c`, `read_gitfile_gently`). The code
  is looser (any line, optional space). A CRLF pointer resolves correctly
  (executed; JavaScript's multiline `$` stops before `\r`). No finding.

## Hand mutation testing

Method: one textual mutation per run to `src/` (two coordinated edits for W7,
Z3 and I30), then `npm run build && npm test`. A non-zero exit counts as
killed. Every mutation compiled. The harness restored each file with `git
checkout -- <file>`, and afterwards `git diff --stat -- ctxoracle/src` was
empty. "Test that kills it" names the first non-`todo` failure of the
after-run.

**Score.** 66 mutations: git_layout ×3, walk ×8, path_glob ×3, search ×8,
zone ×6, caps and skip key ×7, `full`/flag ×3, absent and sweep ×4,
`entry_score` ×3, `symbol_refs` ×2, `test_map` ×2, capabilities and faults ×3,
final transaction ×2, miner hand-off ×2, claim ×4, `refreshIfStale` and
`resolveHead` ×4, §9 stand-ins ×2. None is equivalent. W6 and I12 are masked
at the `runIndex` level (the `lstat` filter and the miner's own sweep), but
they are observable through `walkRepository` and a readdir root. I25 is a plan
silence (m5).
- **Before this review's tests:** 27 killed / 66 (40.9%).
- **After:** 65 / 66 (98.5%). I25 survives, deliberately untested.

| # | Mutation | File:line | Before | After | Test that kills it (after) |
|---|---|---|---|---|---|
| G1 | a `.git` directory counts without `HEAD` | `src/identity/git_layout.ts:64` | killed | killed | T-14-3 |
| G2 | `commondir` ignored | `src/identity/git_layout.ts:74` | killed | killed | T-14-2 |
| G3 | relative `gitdir:` resolved against the process cwd | `src/identity/git_layout.ts:71` | survived | killed | RV-1 |
| W1 | `--others` dropped | `src/index/walk.ts:31` | survived | killed | RV-4 |
| W2 | `--exclude-standard` dropped | `src/index/walk.ts:31` | killed | killed | T-14-3 |
| W3 | `check-ignore` output discarded | `src/index/walk.ts:74` | killed | killed | RV-13 |
| W4 | `check-ignore` exit 1 treated as an error | `src/index/walk.ts:69` | killed | killed | Checkpoint 1R |
| W5 | readdir enters `node_modules` | `src/index/walk.ts:92` | killed | killed | T-14-3 |
| W6 | readdir lists symlinks | `src/index/walk.ts:89` | survived | killed | RV-5 |
| W7 | git-mode presence by `stat` (follows links) | `src/index/indexer.ts:406` | survived | killed | RV-5 |
| W8 | readdir drops non-UTF-8 names without rejecting them | `src/index/walk.ts:101` | survived | killed | RV-6 |
| P1 | `**` needs at least one segment | `src/index/path_glob.ts:30` | killed | killed | T-14-4 |
| P2 | patterns not root-anchored | `src/index/path_glob.ts:38` | killed | killed | T-14-4 |
| P3 | `?` matches zero or one character | `src/index/path_glob.ts:19` | survived | killed | RV-7 |
| S1 | NFC instead of NFKD | `src/index/search.ts:37` | killed | killed | T-14-5 |
| S2 | split before mark removal | `src/index/search.ts:39` | killed | killed | T-14-5 |
| S4 | FTS query without the prefix `*` | `src/index/search.ts:57` | killed | killed | T-14-5 |
| S5 | fallback range becomes exact match | `src/index/search.ts:61` | killed | killed | T-14-5 |
| S6 | a term's tokens unioned, not intersected | `src/index/search.ts:79` | killed | killed | T-14-5 |
| S7 | `pathSearch` without `in_tree = 1` | `src/index/search.ts:106` | survived | killed | RV-8 |
| S8 | `symbolSearch` without `in_tree = 1` | `src/index/search.ts:93` | survived | killed | RV-8 |
| S9 | a token-less term matches the empty prefix | `src/index/search.ts:74` | killed | killed | T-14-5 |
| Z1 | marker checked before ignored-tracked | `src/index/zone.ts:53` | survived | killed | RV-9 |
| Z2 | `build_output` checked before `vendored` | `src/index/zone.ts:63` | survived | killed | RV-9 |
| Z3 | marker searched in the whole file | `src/index/indexer.ts:473` | survived | killed | RV-10 |
| Z4 | evidence not redacted | `src/index/zone.ts:44` | killed | killed | T-14-1 |
| Z5 | evidence not injection-flagged | `src/index/zone.ts:45` | survived | killed | RV-9 |
| Z6 | lockfiles not `build_output` | `src/index/zone.ts:68` | survived | killed | RV-9 |
| I1 | byte cap inclusive (`>=`) | `src/index/indexer.ts:455` | survived | killed | RV-11 |
| I2 | line cap one line early | `src/index/indexer.ts:133` | survived | killed | RV-11 |
| I3 | unchanged byte-cap file not skipped | `src/index/indexer.ts:459` | killed | killed | T-14-1 |
| I4 | byte-cap key without mtime | `src/index/indexer.ts:459` | survived | killed | RV-12 |
| I5 | unchanged test ignores zone and evidence | `src/index/indexer.ts:449` | survived | killed | RV-13 |
| I6 | unchanged file not skipped | `src/index/indexer.ts:473` | killed | killed | T-14-1 |
| I7 | `opts.full` ignored | `src/index/indexer.ts:384` | survived | killed | RV-14 |
| I8 | `indexing_in_progress` ignored | `src/index/indexer.ts:384` | survived | killed | RV-15 |
| I9 | `indexing_in_progress` never cleared | `src/index/indexer.ts:760` | killed | killed | T-14-1 |
| I10 | absent file keeps `path_tokens` | `src/index/indexer.ts:626` | survived | killed | RV-16 |
| I11 | absent file keeps `fts_paths` | `src/index/indexer.ts:618` | survived | killed | RV-16 |
| I12 | indexer's sweep removed | `src/index/indexer.ts:629` | survived | killed | RV-27 |
| I13 | edges into an absent file kept | `src/index/indexer.ts:623` | survived | killed | RV-16 |
| I14 | `entry_score` added, not assigned | `src/index/indexer.ts:720` | killed | killed | T-14-1 |
| I15 | stem = text before the last dot | `src/index/indexer.ts:719` | survived | killed | RV-17 |
| I16 | in-degree dropped from `entry_score` | `src/index/indexer.ts:720` | survived | killed | RV-17 |
| I17 | importers of a written file not recomputed | `src/index/indexer.ts:638` | survived | killed | RV-18 |
| I18 | `symbol_refs` substring, not whole identifier | `src/index/indexer.ts:337` | survived | killed | RV-18 |
| I20 | `test_same_dir_languages` ignored | `src/index/indexer.ts:690` | killed | killed | T-14-3 |
| I21 | a test file covers other test files | `src/index/indexer.ts:695` | survived | killed | RV-19 |
| I23 | `resolved` count always 0 | `src/index/indexer.ts:739` | survived | killed | RV-20 |
| I24 | `path_not_utf8` count fixed at 1 | `src/index/indexer.ts:748` | killed | killed | T-14-3 |
| I25 | a resolved-but-absent import not counted unresolved | `src/index/indexer.ts:518` | survived | survived | — (plan silence, m5) |
| I26 | `index_stale` not cleared | `src/index/indexer.ts:757` | killed | killed | T-14-2 |
| I27 | `index_head` not written | `src/index/indexer.ts:755` | killed | killed | T-14-2 |
| I28 | miner always incremental | `src/index/indexer.ts:767` | survived | killed | RV-21 |
| I29 | miner runs in readdir mode | `src/index/indexer.ts:767` | survived | killed | RV-22 |
| I30 | a line-cap file is parsed (fault still written) | `src/index/indexer.ts:475` | survived | killed | RV-11 |
| C1 | a live claim is taken over | `src/index/indexer.ts:260` | killed | killed | T-14-1 |
| C3 | release ignores the owner | `src/index/indexer.ts:270` | survived | killed | RV-23 |
| C4 | release only on success (no `finally`) | `src/index/indexer.ts:350` | survived | killed | RV-24 |
| C5 | refusal records no fault | `src/index/indexer.ts:347` | killed | killed | T-14-1 |
| R1 | `index_stale` fault on every stale call | `src/index/indexer.ts:234` | killed | killed | T-14-2 |
| R2 | unresolved `HEAD` reported stale | `src/index/indexer.ts:230` | killed | killed | T-14-2 |
| R3 | packed-refs read before the loose ref | `src/index/indexer.ts:210` | survived | killed | RV-2 |
| R4 | 40-hex only | `src/index/indexer.ts:151` | survived | killed | RV-3 |
| X1 | refused `index` verb exits 1, not 75 | `src/cli/index.ts:37` | survived | killed | RV-26 |
| X2 | generic stand-in declares `imports: true` | `src/index/generic_frontend.ts:21` | survived | killed | RV-25 |

## Tests added (27)

All are in the new `test/unit/indexer_review.test.ts` (real git, filesystem and
store). Each one quotes its plan sentence in the body, passes on `177e59f`'s
code, and fails on the mutations named, as the after-run above shows. Where a
sentence concerns rows only a parsing frontend produces, a case passes a
minimal frontend written to Step 14's own `LanguageFrontend` interface. That
frontend is an input under D-plan-29, not a double.

- RV-1 relative `gitdir:` joined to the checkout (G3). RV-2 a loose ref before a
  stale packed entry (R3). RV-3 a SHA-256 repository resolves symbolic and
  detached (R4).
- RV-4 an untracked, not-ignored file is indexed (W1). RV-5 symlinks are not
  followed by `walkRepository` or by git-mode presence (W6, W7). RV-6 a readdir
  non-UTF-8 name becomes one `path_not_utf8` (W8).
- RV-7 `?` is exactly one character (P3). RV-8 `pathSearch`/`symbolSearch`
  return only `in_tree = 1`, under both FTS states (S7, S8).
- RV-9 zone precedence, vendored over build, lockfiles, flagged evidence (Z1,
  Z2, Z5, Z6). RV-10 a marker past 2 KB leaves `source` (Z3).
- RV-11 caps strict at 1,000,000 bytes and 20,000 lines, with over-cap files
  never parsed (I1, I2, I30). RV-12 a same-size byte-cap rewrite with a new
  mtime is re-recorded under the key `stat:<size>:<mtime_ms>` (I4). RV-13 an
  ignore-status change re-zones an unchanged file (I5).
- RV-14 `full` re-parses (I7). RV-15 `indexing_in_progress` forces `full` and
  is cleared (I8, I9).
- RV-16 an absent file loses its path tokens, FTS rows and edges into it, and
  an unreferenced one is swept (I10, I11, I13). RV-27 the indexer's own sweep in
  a readdir root (I12).
- RV-17 `entry_score` = in-degree + points, with the first-dot stem (I15, I16).
  RV-18 `symbol_refs` whole-identifier count survives a change to the imported
  file alone (I17, I18). RV-19 `test_map` excludes test-file targets (I21).
  RV-20 `lang_capabilities` counts (I23).
- RV-21 `runIndex({full: true})` re-mines fully (I28). RV-22 readdir root
  inside a repository mines nothing (I29).
- RV-23 release never drops another process's claim (C3). RV-24 a failed run
  releases the claim (C4).
- RV-25 generic stand-in capabilities (X2). RV-26 the skeleton `index` verb
  exits 75 and writes nothing under a live claim (X1).

Not added: tests for S1, S2 and M1–M5. They are defects, and each test would
fail until its fix lands. The executed reproductions are quoted in each
finding: `dist/` driven by scratch scripts with a regex TypeScript frontend, a
branch round trip, a growing-file frontend, a bracketed-path repository, this
repository's tracked files, an unborn repository, and a planted post-crash
state.

## Verification actually run (2026-09-26)

- `cd ctxoracle && npm run build && npm test` →
  - build: `tsc -p tsconfig.json`, no diagnostics;
  - test: `# tests 270`, `# pass 266`, `# fail 0`, `# cancelled 0`,
    `# skipped 0`, `# todo 4`. The four `todo`s are the pre-existing
    `SKELETON: 1R` skeleton_e2e mark and the three Step 15 subtests. Before
    this review the run was `# tests 243`, `# pass 239`, `# todo 4`.
- The indexer test files (`indexer`, `indexer_stale`, `indexer_walk`,
  `indexer_review`, `search_semantics`, `path_glob`), 3 more runs:
  `# tests 52 # pass 49 # fail 0 # todo 3` each time.
- `node middleware/context-oracle/.claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check middleware/context-oracle/docs/plans/plan-phase-a.md`
  → `OK: 40 steps, 13 elements, 163 test specs, 27 probes cited, regions current`.
- `(cd middleware/context-oracle && python3 tools/check_docs.py)` →
  `context-oracle doc-consistency check passed.`
- `git diff --stat -- ctxoracle/src` → empty (every mutation reverted; no
  source change). git 2.43.0.
