# Review record — Step 13, the co-change miner (commit `57bdd4a`)

*Point-in-time review record. Written once, never edited. Independent reviewer:
wrote neither the tests nor the code under review. Scope: `git diff
277b0a2..57bdd4a -- ctxoracle/` and the implementation-log's Step 13 entry,
judged against plan Step 13 as amended at `277b0a2`, §7's conventions, §9's
row "Step 13's skeleton caller", §12 T-13-1…T-13-6, and architecture AD-13,
AD-15, AD-26 and AD-4's tables.*

## Verdict

**Conforms to the plan's text, with one Serious defect and five Moderate
findings open.** I found no sentence of plan Step 13 that the code
contradicts. The parser, the two labels, the exactly-two-cases full/incremental
rule, the purge set, the chunk watermark, the already-mined skip, the final
transaction and the re-point DAO all do what the plan says. The §9 skeleton
caller change is the one the row names. The suite's pass count overstated what
it checks: **26 of 57 non-equivalent hand mutations survived the builder's
T-13 tests** (the horizon-commit cap, the horizon and size boundaries, the
half-life re-mine, the merge-base exit 128, the incremental range, the
already-mined skip, `prov_ref`, the injection flag, the corpus-floor boundary,
the revert-chain window, the spawn option and a failing `git log` were not
asserted anywhere). This review added 19 tests, and all 57 are now killed.

The Serious defect is outside the plan's text but inside its goal. The
miner's `git log` runs under the user's own git configuration. With
`log.showSignature = true` and signed commits, a common pairing for people
who sign, git writes signature-check text into stdout inside the `-z` stream.
The pass then mines nothing. It records a fault for every field, and it still
sets `last_mined_commit` to `HEAD`, so no later pass ever recovers the history.
The same shape (nothing mined, fault flood, watermark at `HEAD`) happens on a
SHA-256 repository, which the builder reported but under-described (M1).

Phase-goal check (CLAUDE.md rule 3): S1, M1 and M2 are the phase goal's own
failure. On a real repository the history genres go silent while the store
reads fresh and mined. That is faked machinery that poisons the discovery
data Phase B reads. M3 is an integrity fault in the evidence weights. M4 is
a test that cannot fail on the defect it names. None of these is review polish.

## Findings

### Serious

**S1 — The `git log` stream depends on the user's git configuration. With
`log.showSignature = true` on signed commits it mines nothing, floods faults,
and still claims `HEAD`.** `ctxoracle/src/miner/cochange.ts:443-447` (the
argument list) with `:524` (the final watermark). The child inherits the
user's environment and global config (`src/util/spawn.ts:66-73`, `childEnv`).
- *Standard / evidence.* `git log` is porcelain, and its output honours user
  configuration. git-config(1) documents `log.showSignature` ("show GPG
  signature verification" as if `--show-signature` were passed) and
  `log.showRoot` ("if true, the initial commit will be shown as a big
  creation event"; false omits its diff). A machine consumer must pin every
  config that changes the bytes it parses. Executed here on git 2.43.0 against
  the built `57bdd4a` code (`dist/`), repository of 5 signed commits, config
  injected via `GIT_CONFIG_COUNT`/`KEY_0`/`VALUE_0` exactly as a user's
  `~/.gitconfig` would reach the child:
  `plain {"commitsSeen":5,"included":5,…} pairs 1 unparsed faults 0 watermark=HEAD true`
  `showSignature {"commitsSeen":0,"included":0,…,"chunks":0} pairs 0 unparsed faults 35 watermark=HEAD true`.
  `od -c` of the stream shows `N o   s i g n a t u r e \n 036 <hash>`: the
  text lands inside the header field, so no header is ever recognised. The
  next incremental pass mines only `HEAD..HEAD`, so the history stays lost.
  With `log.showRoot = false` (executed): the root commit's entries vanish, so
  a 2-commit pair reads `pair_count [ 1 ]`, where 2 is expected.
- *Fix (plan + code).* Add `--no-show-signature --root --no-textconv
  --no-ext-diff` to the plan's one stream and to `cochange.ts:445`, or pass
  the same overrides as `-c` settings. `--no-textconv` also stops a repository's
  `.gitattributes` from selecting a user's textconv program to run on every
  binary file during mining. Executed: with `-c log.showSignature=true -c log.showRoot=false`
  on the signed repository, the stream with these four flags is byte-identical
  at its head to the plain stream (`036 <hash> \0 <ts> \0 one \0 \0 \0 \n 1 \t 0 \t a`). Add a T-13-1 case that runs the miner with
  `GIT_CONFIG_COUNT` setting `log.showSignature=true` over a signed-commit
  fixture and `log.showRoot=false`, and requires the same store as a plain mine.
  M2's guard would also have contained this failure.
- *Owning layer.* Plan (it fixes the command line verbatim), then code.

### Moderate

**M1 — SHA-256 repositories (builder finding 1): holds, and its consequence is
worse than reported.** `cochange.ts:73-80` (`isHeader`, 41 bytes),
`labels.ts:10` (trailer `{40}`); plan Step 13 and AD-15 both say "40 hex".
- *Evidence.* Executed against `dist/`: `git init --object-format=sha256`,
  4 commits → `{"commitsSeen":0,…} pairs 0 faults
  [{"code":"miner_unparsed_numstat","n":28}] watermark=HEAD? true`. So the pass
  writes one fault per stream field, not "nothing mined" quietly. Then M2 makes
  the loss permanent.
- *Fix (plan).* Read `git rev-parse --show-object-format` once per pass. Accept
  a header of `\x1e` + 40 or 64 lower-case hex to match it, and a trailer of
  the same length. For an unsupported format, record one fault and do not
  advance the watermark.
- *Owning layer.* Plan (Step 13's framing sentence) and architecture (AD-15's
  trailer text).

**M2 — The final transaction claims `HEAD` whatever the stream yielded.**
`cochange.ts:524` sets `last_mined_commit = head` unconditionally, including
when the stream yielded fewer commits than `rev-list --count` said the range
holds (S1: 0 of 5; M1: 0 of 4).
- *Standard / evidence.* The plan's own invariant: "a crash never leaves the
  watermark ahead of its data". A pass whose parse lost commits has not mined
  to `HEAD`. The check is free: `result.commitsSeen` against `rangeCount`
  (`:397`), which the pass already computes.
- *Fix (code, with a plan sentence).* When `commitsSeen !== rangeCount`,
  record one fault (for example `miner_unparsed_numstat` with `{expected,
  seen}`), keep the last chunk watermark, and skip the final `HEAD`
  assignment. This also bounds S1 and M1 to a visible, recoverable fault.
- *Owning layer.* Code, with the plan stating the rule.

**M3 — A future-dated author timestamp overflows the AD-13 weight (IEEE-754),
and the result reads back as NULL.** `cochange.ts:468` (`w = 2 ** ((c.ts − T0)
/ (h × 86400))`, `c.ts` = `%at`, author-controlled and untrusted repository
content).
- *Standard / evidence.* IEEE-754 binary64 overflows at 2^1024. AD-13's bound
  ("`tune` refuses `h` below 37 days, which keeps every commit before 2100 in
  range") assumes honest dates. git accepts any author date (`GIT_AUTHOR_DATE`,
  `--date`), and date-art and clock-skewed commits exist in public
  histories. Executed against `dist/`: one commit with author date
  `@40000000000` (year 3237) at the seed `h` = 365 →
  `change_weight: null`, `pair_weight: null` for both files. At `h` = 37, a
  2103 date gives `2.248e306`, which swamps every other commit's weight, so
  a second such commit overflows. A NULL weight makes the confidence ratio
  NULL for that file until a re-mine.
- *Fix (architecture, then code).* Clamp the exponent's time to
  `min(c.ts, refTs)`: a commit cannot carry more recency than `HEAD`. That
  bounds `(ts − T0)/h` by `(refTs − T0)/h`, which the existing 37-day floor
  keeps finite up to 2100. Count the clamped commits in a fault detail.
- *Owning layer.* Architecture (AD-13's bound), then plan Step 13 and code.

**M4 — T-13-6(b) cannot detect a missing already-mined skip.** Mutation C4
(delete `cochange.ts:408`) survived all of T-13-1…T-13-6.
- *Evidence.* T-13-6(b)'s stopped pass is the store's first mine, so it is a
  full pass and sets `mining_in_progress = '1'`. Its resume is therefore a
  crash continuation: purged and re-mined in full (plan Step 13, "a full pass
  that crashed"). It counts every commit once with or without the skip. The
  skip matters only to an *incremental* continuation, and no T-13 case stops one
  on a branching history.
- *Fix (plan).* Amend T-13-6(b)'s Data: first mine the store to the fork
  point, then run the stopped pass (so it is incremental), resume it, and
  compare with an uninterrupted mine. This review added exactly that as
  T-13-6d, which kills C4.
- *Owning layer.* Plan (§12 T-13-6).

**M5 — The builder's memory claim is false. The aggregate is O(range), not
bounded by `miner.horizon_commits`.** Implementation log, Step 13, last
plan-silence bullet: "horizon-excluded commits keep only their row fields, so
memory is bounded by `miner.horizon_commits`". `cochange.ts:399`, `:433-440`:
`pending` holds one `PendingCommit` for every commit in the range, horizon-
excluded ones included, until the stream ends. It also holds every
horizon-included commit's decoded paths.
- *Evidence.* Executed on Node 22: an array of `PendingCommit`-shaped objects
  (40-hex hash, `paths: []`) costs 168–170 B per commit: 100,000 → 16.2 MiB,
  1,300,000 → 208.4 MiB (a Linux-kernel-sized history's non-merge count). This
  is tolerable. But the claim was written as verified, and no check backed it.
  The plan asks only that the history is never one buffer, and that holds.
- *Fix.* Correct the record. If a bound is wanted, write each chunk as soon
  as the aggregated tail reaches it. A synchronous chunk transaction run
  between `data` events holds no transaction across a git read (AD-26). Then
  memory is bounded by a chunk.
- *Owning layer.* Code (the record); plan if a bound is wanted.

### Minor

**m1 — `HEAD` is resolved once, but every later git command re-reads the
symbolic `HEAD`** (`cochange.ts:357` resolves `head`; `:361`, `:370`, `:394`,
`:397`, `:445` all pass `'HEAD'`). The detached reindex runs while the agent is
committing, so `HEAD` can move between the reads. The already-mined skip and
the rewrite check make this self-healing. Still, `ref_ts`, the horizon count
and the stream can each describe a different commit than the watermark the
final transaction writes. *Fix (code):* use the resolved `head` hash in all
five places (snapshot consistency).

**m2 — git's stderr is inherited (builder finding 2): holds.** In addition,
the rejection at `:323` carries only the exit code. No fault is recorded for a
failed mine. Under the hook's detached reindex (`stdio: 'ignore'`,
`src/hook/handler.ts:164`) the reason is lost entirely. *Fix (plan):* pipe
stderr, keep its first bounded bytes, and put them in the error or a fault.
*Owning layer:* plan (the amended option says "stderr inherited").

**m3 — One malformed record becomes one fault per field.** In the `header`
state (`:164-167`) every non-header field is reported, and a non-integer `%at`
(`:170-174`, builder decision 4) sends the parser back to `header`, so the
record's subject, body, separator and each entry are reported one by one.
The plan's unit is "the record" ("detail: the record's escaped first 80
bytes"). *Fix (code):* after a malformed field in `header` state, stay silent
until the next valid header, and cap `miner_unparsed_numstat` per pass the way
`path_not_utf8` is capped.

**m4 — The parser re-concatenates and re-scans the partial field on every
chunk** (`:108-119`: `Buffer.concat([this.rest, chunk])`, then a byte loop from
0). A field spanning k chunks (a large commit body) costs O(k²) copying and
scanning. *Fix (code):* keep a list of pending pieces, and find NULs with
`chunk.indexOf(0, from)` (native memchr) in the new chunk only.

**m5 — `%at` parsing accepts non-digit forms** (`:169`: `Number(f)` accepts
`''` → 0, `' 12'`, `'1e3'`, `'0x10'`). git never emits these. The guard exists
for format drift, so it should be exact. *Fix (code):* `/^[0-9]+$/` before
`Number`.

**m6 — T-13-5(d)'s range clause is not asserted.** The plan's Fails-when
includes "the completing mine re-reads a commit at or before the killed pass's
watermark (its `git log` range is `<watermark>..HEAD`)". The test compares
only the final store, and the skip hides a whole-history re-read (mutation C5
survived). *Closed here* by R-8 (`commitsSeen` of an incremental pass).
*Owning layer:* tests.

## The builder's plan-silence decisions — judged

| Decision (implementation log) | Holds? | Evidence |
|---|---|---|
| A repository with no `HEAD` writes nothing and returns a zero result (`:357-358`) | **Holds** | Nothing exists to mine, and no watermark is written, so the first commit triggers a full pass. Note: `rev-parse --verify -q HEAD` also fails outside any repository. The pass then returns silently with no fault, and the indexer's non-git handling (Step 14) is what must report that. |
| Commit row written immediately before its own paths (`:464`) | **Holds** | The property the plan's sentence exists for (the first-naming commit is in `commits` when `repointStaleCommitProv` checks) holds per commit inside the same chunk transaction. T-13-6c and mutation D3 exercise it. |
| A non-empty separator field is read as an entry (`:191`) | **Holds** | A shape-less one is reported, and a well-formed one is not lost. git always writes it empty (`od -c` here: `one \0 \0 \0 \n 1 \t 0 \t a`, and an empty commit writes `empty \0 \0 \0 036…`). |
| A non-integer `%at` is malformed and the commit dropped (`:169-174`) | **Holds, but its aftermath does not** | Dropping is right. The per-field fault flood that follows is m3, and `Number` is too permissive (m5). |
| `lexicon.fix_keywords` members compared lower-cased (`labels.ts:35`) | **Holds** | AD-15: "as a whole token, case-insensitively". |
| A size-excluded revert creates its files' history rows but adds no counts (`:432`, `:476`) | **Holds** | `labelled_touches.file_id` needs the row. The sweep keeps it through the `labelled_touches` reference. Now pinned by T-13-4f (mutation Z4). |
| `entity_count` = distinct raw paths, rejected ones included (`:424`) | **Holds** | The plan says the commit's `entity_count` "still counts it". A rename counts both identities, which follows from the plan's "both identities added to the touched set". So a pure move of 16 files (32 entities) is size-excluded, which fits the refactor-sweep intent. Now pinned by R-4 (Z2). |
| Faults: one `miner_unparsed_numstat` per malformed record, one capped `path_not_utf8` per pass, both written outside any transaction | **Partly** | `path_not_utf8` holds (R-4). The unparsed faults are per field in the resync paths, not per record, and they are uncapped (m3, S1, M1). |
| `merge-base` exiting other than 0/1/128 throws (`:376-378`) | **Holds** | No other exit status is documented for `--is-ancestor`. A fatal error must not be read as "ancestor". |
| Stream aggregated in memory before the chunk writes; memory "bounded by `miner.horizon_commits`" | **The design holds; the claim does not** | No transaction spans the stream (AD-26). The memory claim is false (M5). |

## The builder's reported findings — judged

1. **SHA-256 repositories are not mined.** *Holds* (executed, M1). The report
   understates the effect: every field becomes a fault, and the watermark is
   set to `HEAD` (M2), so the loss is silent to history-staleness checks and
   permanent.
2. **`git log`'s stderr is inherited.** *Holds* (m2). The amended plan chose
   it. The cost is a reason-less rejection, and under the detached reindex a
   lost one.

Neither finding is a code defect against the plan's text. Both are plan-level
items for the plan's owner, recorded above.

## Other checks against established practice (no finding)

- **git's `-z` contract.** The parser splits on NUL only, consumes subject,
  body and rename identities positionally, and treats a field as a header only
  where one is expected. T-13-1e/f/g/k plus the three parser cases added here
  (T-13-1l/m/n) cover each rule. `diff.relative` (executed) changes paths only
  when the working directory is a subdirectory. The miner runs at the repository
  root, so it is not listed under S1, but the same flag list should carry
  `--no-relative` if `repoPath` can ever be a subdirectory.
- **SQLite transactions.** The purge, each chunk and the final transaction are
  separate `BEGIN IMMEDIATE` units. `ensureHistoryRow` and `rebuildMinerKinds`
  nest as savepoints. The crash cases (T-13-5a/d, T-13-6b/d) show that the
  watermark never passes its rows.
- **Child-process handling.** `error` and `close` both settle the promise (a
  second `reject` is a no-op). A parser throw kills the child and rejects with
  the original error. A non-zero exit rejects, and that is now pinned by R-10
  (mutation S3).
- **SZZ keyword matching.** Whole-token, Unicode-aware split; `fixture`,
  `prefix` and `suffix` are unlabelled (T-13-4a).

## Hand mutation testing

Method: one textual mutation per run to `src/`, then `npm run build && npm
test`. A mutation counts as killed on a non-zero exit. Every mutation compiled.
The harness restored each file with `git checkout -- <file>`, and afterwards
`git diff --stat -- ctxoracle/src` was empty. The "Test that kills it" column
names the first non-`todo` failure of the after-run. (The `skeleton_e2e`
`# TODO SKELETON: 1R` case reports `not ok` on every run by design and is
ignored.)

**Score.** 59 mutations: parser ×7, labels ×6, horizon ×6, size ×4, weights ×3,
chunking/watermark ×5, full/purge ×6, rewrite ×3, final transaction ×12,
re-point ×3, spawn/stream ×4. Two are equivalent (below).
- **Before this review's tests:** 31 killed / 57 non-equivalent (54.4%).
- **After:** 57 / 57 (100%).

Equivalent mutants:
- **W3** (a revert also computes `fix`): `label` is `revert ? 'revert' : fix ?
  'fix' : null` (`:431`), and `fix` has no other reader, so the stored label
  cannot change.
- **S4** (a parser exception is swallowed as `failed = null`): the
  `child.kill()` that follows still ends the child by signal. `close` then
  sees `code === null`, and the pass rejects (`:323`). Only the error text
  differs, and the plan states none.

| # | Mutation | File:line | Before | After | Test that kills it (after) |
|---|---|---|---|---|---|
| P1 | parser rescans the body field for a header | `src/miner/cochange.ts:185` | killed | killed | T-13-1k |
| P2 | rename contributes only the new identity | `src/miner/cochange.ts:206` | killed | killed | T-13-1d |
| P3 | truncated rename at end of stream not reported | `src/miner/cochange.ts:130` | killed | killed | T-13-1j |
| P4 | a rename cut after its first identity keeps that partial identity | `src/miner/cochange.ts:129` | survived | killed | T-13-1l |
| P5 | an empty count field is accepted as a count | `src/miner/cochange.ts:84` | survived | killed | T-13-1m |
| P6 | the first entry keeps its leading \n | `src/miner/cochange.ts:218` | killed | killed | T-13-1a |
| P7 | a header is any field starting 0x1e (loose framing) | `src/miner/cochange.ts:193` | survived | killed | T-13-1n |
| L1 | trailer regex without the multiline flag | `src/miner/labels.ts:10` | survived | killed | T-13-4d |
| L2 | Reapply subject fallback dropped | `src/miner/labels.ts:22` | survived | killed | T-13-4d |
| L3 | subject fallback dropped entirely | `src/miner/labels.ts:22` | killed | killed | T-13-4a |
| L4 | substring keyword matching | `src/miner/labels.ts:37` | killed | killed | T-13-4a |
| L5 | tokens split on whitespace only | `src/miner/labels.ts:36` | killed | killed | T-13-4a |
| L6 | trailer only recognised on the body's first line | `src/miner/labels.ts:21` | survived | killed | T-13-4d |
| H1 | horizon_commits off by one | `src/miner/cochange.ts:425` | survived | killed | R-1 |
| H2 | horizon_commits ignored | `src/miner/cochange.ts:425` | survived | killed | R-1 |
| H3 | range count includes merges (positions misaligned) | `src/miner/cochange.ts:397` | survived | killed | R-1 |
| H4 | horizon years of 365 days | `src/miner/cochange.ts:37` | survived | killed | R-2 |
| H5 | horizon instant boundary inclusive | `src/miner/cochange.ts:425` | survived | killed | R-2 |
| H6 | reference instant = wall clock | `src/miner/cochange.ts:361` | killed | killed | T-13-1c |
| Z1 | size threshold inclusive | `src/miner/cochange.ts:426` | survived | killed | R-3 |
| Z2 | entity_count omits rejected paths | `src/miner/cochange.ts:424` | survived | killed | R-4 |
| Z3 | revert detection after the size exclusion | `src/miner/cochange.ts:429` | killed | killed | T-13-4a |
| Z4 | a size-excluded revert also bumps counts and pairs | `src/miner/cochange.ts:476` | survived | killed | T-13-4f |
| W1 | weight relative to refTs instead of T0 | `src/miner/cochange.ts:468` | killed | killed | T-13-2 |
| W2 | change_weight unweighted | `src/miner/cochange.ts:478` | killed | killed | T-13-2 |
| W3 | a revert is also fix-labelled (label precedence flipped) | `src/miner/cochange.ts:430` | survived | survived | — (equivalent; see note) |
| C1 | chunk watermark ahead of its data | `src/miner/cochange.ts:493` | killed | killed | T-13-5a |
| C2 | chunks never advance the watermark | `src/miner/cochange.ts:493` | killed | killed | T-13-5a |
| C3 | one transaction for the whole pass | `src/miner/cochange.ts:491` | killed | killed | T-13-6b |
| C4 | already-mined skip removed | `src/miner/cochange.ts:408` | survived | killed | T-13-6d |
| C5 | incremental pass streams the whole history | `src/miner/cochange.ts:394` | survived | killed | R-8 |
| F1 | half-life change does not force a full re-mine | `src/miner/cochange.ts:368` | survived | killed | R-6 |
| F2 | crashed full pass continues incrementally | `src/miner/cochange.ts:366` | killed | killed | T-13-5a |
| F3 | purge keeps labelled_touches | `src/miner/cochange.ts:386` | killed | killed | T-13-3 |
| F4 | purge keeps change counts | `src/miner/cochange.ts:387` | killed | killed | T-13-3 |
| F5 | purge deletes human_stated too | `src/miner/cochange.ts:388` | killed | killed | T-13-3 |
| F6 | purge does not record the mined half-life | `src/miner/cochange.ts:390` | killed | killed | T-13-5d |
| R1 | exit 128 (watermark object gone) not a rewrite | `src/miner/cochange.ts:371` | survived | killed | R-7 |
| R2 | no history_rewritten fault | `src/miner/cochange.ts:375` | killed | killed | T-13-3 |
| R3 | rewrite detected but pass stays incremental | `src/miner/cochange.ts:373` | killed | killed | T-13-3 |
| T1 | final watermark not set to the mined HEAD | `src/miner/cochange.ts:524` | killed | killed | T-13-6a |
| T2 | evidence oldest first | `src/miner/cochange.ts:504` | killed | killed | T-13-4a |
| T3 | landmine prov_ref = oldest counted hash | `src/miner/cochange.ts:513` | survived | killed | T-13-4e |
| T4 | landmine ignores the path injection flag | `src/miner/cochange.ts:515` | survived | killed | R-9 |
| T5 | revert_chain window = fix window | `src/miner/cochange.ts:520` | survived | killed | R-9 |
| T6 | revert_chain at 1 revert | `src/miner/cochange.ts:520` | killed | killed | T-13-4a |
| T7 | fix_chatter window = horizon | `src/miner/cochange.ts:521` | killed | killed | T-13-4a |
| T8 | corpus floor strict | `src/miner/cochange.ts:526` | survived | killed | R-5 |
| T9 | mining_in_progress never cleared | `src/miner/cochange.ts:527` | killed | killed | T-13-3 |
| T10 | no sweep | `src/miner/cochange.ts:528` | killed | killed | T-13-6c |
| T11 | ref_ts not written | `src/miner/cochange.ts:525` | killed | killed | T-13-1i |
| T12 | rebuild per row (only the last row survives) | `src/miner/cochange.ts:521` | killed | killed | T-13-1c |
| D1 | repoint call removed | `src/miner/cochange.ts:472` | killed | killed | T-13-6c |
| D2 | repoint ignores prov_kind | `src/stores/dao/files.ts:141` | survived | killed | R-12 |
| D3 | repoint ignores whether prov_ref is still in commits | `src/stores/dao/files.ts:142` | killed | killed | T-13-6c |
| S1 | stderr piped (and never drained) | `src/util/spawn.ts:82` | survived | killed | R-11 |
| S2 | pipe becomes the default for every caller | `src/util/spawn.ts:82` | survived | killed | R-11 |
| S3 | a failing git log is taken as complete | `src/miner/cochange.ts:323` | survived | killed | R-10 |
| S4 | a parser exception is swallowed | `src/miner/cochange.ts:316` | survived | survived | — (equivalent; see note) |

## Tests added (19)

Each was written from the plan sentence quoted in its body. Each passes on
`57bdd4a`'s code and fails on the mutation(s) named, shown by the after-run
above.

- `test/unit/miner.test.ts` (T-13-1, the parser fed synthetic records):
  - T-13-1l — a rename cut after its first identity is one malformed record,
    and no partial identity is kept (P4).
  - T-13-1m — an entry with an empty added or deleted count lacks the shape
    (P5).
  - T-13-1n — `\x1e` + 40 non-hex is not a header (P7).
- `test/unit/miner_landmines.test.ts` (T-13-4):
  - T-13-4d — `isRevertLabelled`: the trailer as git writes it
    (newline-terminated) with a non-`Revert` subject, the trailer after an
    explanation, the `Reapply "` fallback, a non-line mention (L1, L2, L6).
  - T-13-4e — each miner landmine is `commit`/`untrusted_repo` with `prov_ref`
    = `evidence[0]` (T3).
  - T-13-4f — the size-excluded `big/` commit and its size-excluded revert add
    no `change_count`, `change_weight` or pair (Z4).
- `test/unit/miner_branches.test.ts` (T-13-6):
  - T-13-6d — an incremental pass over the merge shape, stopped after the m2
    chunk by T-13-5's worker and resumed, equals one uninterrupted mine (C4;
    M4).
- `test/unit/miner_review.test.ts` (new; real git, real store, no doubles):
  - R-1 — `miner.horizon_commits` = 3 over c1, c2, s1, c3, c4 plus a merge
    excludes exactly c1, c2 (H1, H2, H3).
  - R-2 — a commit exactly at `refTs − 5 × 365.25 d` is included; one second
    earlier is excluded (H4, H5).
  - R-3 — 30 entities included, 31 size-excluded (Z1).
  - R-4 — 30 valid paths plus one `\xff` path: `entity_count` 31, size-
    excluded, one `path_not_utf8` fault with writer `miner` (Z2).
  - R-5 — `corpus_floor_met` at the floor boundary (T8).
  - R-6 — a changed half-life forces a purged full re-mine at the new `h`
    (F1).
  - R-7 — a watermark whose object was garbage-collected (merge-base exit
    128) is a rewrite: fault, purge, full re-mine (R1).
  - R-8 — an incremental pass streams only `<watermark>..HEAD` (C5; m6).
  - R-9 — a landmine carries the path's injection flag (`jailbreak.txt`), and
    `revert_chain` counts reverts 150 and 200 days old over the horizon, not
    the 90-day fix window (T4, T5).
  - R-10 — a `git log` that exits 128 mid-stream (a deleted blob) fails the
    pass, and the watermark is not `HEAD` (S3). git's own `fatal: unable to
    read …` line appears in the test output because stderr is inherited (m2).
  - R-11 — `oracleSpawn({stdout: 'pipe'})`: `stdin` and `stderr` are `null`,
    `stdout` is piped, and the default stays inherit (S1, S2).
  - R-12 — an indexed `repo_span` row touched by the miner keeps its
    `prov_ref` (D2).

Not added: tests for S1, M1, M2 and M3. They are defects, and a test for any
of them would fail until the fix lands. The executed reproductions are in each
finding (the S1/M1/M3 script drove `dist/` with `GIT_CONFIG_COUNT` overrides, a
`--object-format=sha256` repository, and `@40000000000` / `@4200000000` author
dates).

## Verification actually run (2026-09-26)

- `cd ctxoracle && npm run build && npm test` →
  - build: `tsc -p tsconfig.json`, no diagnostics;
  - test: `# tests 210`, `# pass 209`, `# fail 0`, `# cancelled 0`,
    `# skipped 0`, `# todo 1`. The one `todo` is the pre-existing
    `skeleton_e2e` `SKELETON: 1R` mark. Before this review the run was
    `# tests 191`, `# pass 190`, `# todo 1`.
- The miner test files (`node --test dist/test/unit/miner*.test.js`), 3 more
  runs: `# tests 42 # pass 42 # fail 0` each time.
- `node middleware/context-oracle/.claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check middleware/context-oracle/docs/plans/plan-phase-a.md`
  → `OK: 40 steps, 13 elements, 158 test specs, 27 probes cited, regions current`.
- `(cd middleware/context-oracle && python3 tools/check_docs.py)` →
  `context-oracle doc-consistency check passed.`
- `git diff --stat -- ctxoracle/src` → empty (every mutation reverted; no
  source change).
