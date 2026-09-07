# Expert review (round 10, re-review) — `docs/plans/plan-phase-a.md`

**Date:** 2026-09-07
**Reviewer:** fresh independent `/expert-review` pass; not the plan-writer, not
the author of any of the eighteen prior review documents on this artifact, no
prior context on this session.
**Artifact:** `/home/user/agent-armory/middleware/context-oracle/docs/plans/plan-phase-a.md`
at its current state on branch `claude/plan-correction-strategy-57ot28` —
commit `ed9f917` ("context-oracle: fix round-9 collapse-hunt and expert-review
findings") and later, confirmed via `git log --oneline -3` and `git status`
(clean tree) this session; 7196 lines, read end to end this session across
sequential `Read` calls with no gaps (1–900, 901–1800, 1801–2700, 2701–3600,
3601–4500, 4501–5200, 5201–6100, 6101–7000, 7001–7196), per the Re-Review
Protocol in `middleware/context-oracle/.claude/commands/expert-review.md` (the
project-scoped copy, read first, in full, before any other file).
**Round:** 10 (re-review of round 9's collapse-hunt and round 9's
expert-review, both landed in commit `ed9f917`). Rounds 1–9 history (from
`docs/STATUS.md` and the eighteen prior review documents in `docs/reviews/`):
round 1, 3 collapses/4 partials/6 missed decisions + 10 expert-review
findings; round 2, 1 collapse/3 partials/1 procedural gap + 9 expert-review
findings incl. an overclaim (S3); round 3, 2 collapses/2 partials + 1
Systemic×2 + 2 Moderate + 1 Minor; round 4, 2 collapses/0 partials + 1
Systemic×2; round 5, 2 collapses (one incomplete) + 1 Systemic×2 at 6 sites +
1 Minor; round 6, 1 collapse + 2 Moderate/2 Minor; round 7, 1 Critical + 1
Moderate (expert-review) + 1 collapse + 3 Minor (collapse-hunt); round 8, 1
Serious + 1 Moderate (expert-review) + 2 collapses (collapse-hunt); round 9,
2 Serious (expert-review) + 1 collapse + 2 findings (collapse-hunt). **This
round independently re-derives round 9's two closure claims (Step 20's
two-step brace/plain rename detector; Step 37's lock acquire/release/
staleness sequence) by implementing them as literal code and executing them
against real `git log --numstat -M` output and real `node:fs` calls — both
are genuinely closed, more robustly than round 9's own scenarios required.
Full-document regression scan then found ONE new Critical finding — a
load-bearing dependency-compatibility premise (`web-tree-sitter@^0.26.13` +
`tree-sitter-wasms@0.1.13`, inherited from architecture V14 and re-cited
across all ten review rounds without ever being executed) is false: direct
execution proves `Language.load()` throws for every single grammar file in
`tree-sitter-wasms@0.1.13` under `web-tree-sitter@0.26.13`, because the
former's WASM files carry an old-format `dylink` custom section and the
latter's loader unconditionally requires the newer `dylink.0` section —
verified across six sampled grammars, corroborated by confirming an earlier
`web-tree-sitter@0.25.9` loads the identical file successfully, and by
confirming the officially-recommended per-language `tree-sitter-javascript`
npm package (new-format WASM) loads and parses correctly under 0.26.13. This
breaks Step 22 (the tree-sitter frontend) and, by extension, every whisper
genre that depends on precise symbol/import extraction. A second, smaller
Moderate finding — the new `reindex.lock_stale_ms` default introduced by
round 9's own fix is asserted as "well beyond any real index run's duration"
with zero measurement anywhere in the plan or architecture — is also
delivered, disclosed honestly as only partially execution-verifiable
(Phase A's indexer does not exist yet to time directly).**

---

## Scope and Inventory

### Tool-plan disclosure

`ToolSearch` for CodeGraph/Clear Thought was not re-invoked this round —
consistent with every prior round's disposition (§15 Q-gap-1/Q-gap-2 in the
plan itself); no finding below depends on either tool. Every claim below is
verified by Read (file:line, this session), Grep (query + result count, this
session), or direct executable checks (git 2.43.0, Node v22.22.2, npm 10.9.7,
all run fresh this session in scratch directories under `/tmp/oracle_r10/`,
none reused from any prior round's transcript) — never memory, never trust in
a prior review's or the plan's own attestation.

### Scope 1 — Round 9's finding-groups, as closure items

- [x] **Round-9 expert-review Serious Finding 1 (Step 20's round-8
  brace-expansion fix cited a regex that does not expand braces — reproduces
  the corruption on the fix's own cited example).** Read current lines
  1868–1926 (Step 20, "What changes"): the algorithm now specifies a two-step
  detector — (1) `^(.*)\{(.*) => (.*)\}(.*)$` for the brace-abbreviated form,
  reconstructing `prefix+oldPart+suffix` / `prefix+newPart+suffix`; (2) only
  if that fails, `^(.*) => (.*)$` for the plain-rename form; (3) otherwise a
  plain path. **Independently implemented this exact algorithm as literal
  JavaScript** (not copied from any prior round's transcript) and ran it
  against **freshly-constructed real git output**, not the plan's or round
  9's cited strings: built a repository in `/tmp/oracle_r10/full-repo/` with
  three real renames — a cross-directory move (`src/utils/c.txt` →
  `src/other/c.txt`), a plain dissimilar-name rename (`aaa_file.txt` →
  `bbb_file.txt`), and a same-directory rename (`src/foo.ts` → `src/bar.ts`)
  — and ran `git log --no-merges --numstat -M` for real. Actual git output:
  `src/{utils => other}/c.txt`, `aaa_file.txt => bbb_file.txt`,
  `src/{foo.ts => bar.ts}` respectively. Feeding all three through the
  literal two-step detector: `src/{utils => other}/c.txt` → `old:
  "src/utils/c.txt", new: "src/other/c.txt"` (correct); `aaa_file.txt =>
  bbb_file.txt` → `old: "aaa_file.txt", new: "bbb_file.txt"` (correct, via
  the plain-form fallback); `src/{foo.ts => bar.ts}` → `old: "src/foo.ts",
  new: "src/bar.ts"` (correct). Additionally constructed a fourth scenario
  the task explicitly named as a variant to try — a shared-prefix-**and**-
  suffix rename (`docs/report.md` → `docs/summary.md`, which git compacts to
  `docs/{report.md => summary.md}`) — and confirmed the same two-step
  detector reconstructs `docs/report.md` / `docs/summary.md` correctly. **All
  four scenarios pass. Genuinely closed** — not merely closed for the
  scenarios round 9 named, but for every rename shape tested this round,
  including one round 9 did not construct.
- [x] **Round-9 expert-review Serious Finding 2 (Step 37's round-8
  lock-file replacement specified acquisition but no release, permanently
  breaking self-refresh after one successful run).** Read current lines
  2915–2951 (Step 37, "In `src/index/indexer.ts`" bullet): now specifies (1)
  an explicit `fs.unlinkSync(lockPath)` in a `finally`-equivalent on
  completion (success or failure) before the process exits, and (2) on
  `EEXIST`, a staleness check against `reindex.lock_stale_ms` (default
  600000ms), unlinking and retrying once if the existing lock's mtime is
  older than the threshold, else skipping silently. **Independently
  implemented this exact acquire/release/staleness-reclaim sequence as
  literal Node.js code** (`/tmp/oracle_r10/lock.js`, using real
  `fs.openSync`/`fs.statSync`/`fs.unlinkSync`/`fs.utimesSync` — no mocks) and
  ran all three scenarios `T37-3` specifies against a real filesystem: (a) a
  completed acquire→release cycle — lock file confirmed **absent**
  afterward; (b) a lock file manually created with mtime set older than the
  600000ms threshold — the next acquisition attempt correctly **unlinked and
  reclaimed** it; (c) a lock file with a fresh mtime (younger than the
  threshold) — the next acquisition attempt correctly **failed** (`EEXIST`,
  lock file still present, not stolen). All three match T37-3's spec
  (`docs/plans/plan-phase-a.md:5242–5266`) exactly. **Genuinely closed.**
- [x] **Round-9 collapse-hunt Finding 2 (round 8's two collapse-hunt
  findings — the git-invocation distinction, the rename-detection fact —
  were fixed at their primary sites but never logged in §11's claims
  registry).** Read current lines 4452–4482 (§11.4): both entries are now
  present, each with direct-execution evidence matching what I independently
  re-derived above (the `git rev-parse --is-inside-work-tree` exit-128-vs-
  printed-`'false'` distinction; the `git log --numstat -M` brace-compaction
  fact, including the same-directory-triggers-brace observation). **Genuinely
  closed** — re-verified the underlying git-command facts by direct execution
  this session (see Scope 2 below) and confirmed both §11.4 entries state
  them accurately.
- [x] **Round-9 collapse-hunt Finding 3 (Minor — Step 37's new "mtime/PID
  staleness check" sub-claim was unspecified and untested).** Read current
  lines 2114–2120, 2936–2951, and `T37-3`'s spec (lines 5242–5266): the
  staleness threshold now has a concrete named `tuning` key
  (`reindex.lock_stale_ms`, default `600000`), an explicit mtime-only
  algorithm (no PID check — reasoned as unnecessary for a single-host tool),
  and a dedicated test (`T37-3`) exercising exactly the three states above.
  **Genuinely closed as a specification-completeness matter** — see Moderate
  Finding 1 below for a distinct, new gap in the *value itself* that this
  closure did not address (the round-9 fix specified the mechanism
  completely; it did not verify the 600000ms default against any measurement).

**Scope 1 result: all four of round 9's finding-groups are genuinely closed
against current source, independently re-verified this round by
re-implementing each fix's own literal mechanism from scratch (not reusing
round 9's code or transcript) and executing it against freshly-constructed
scenarios, including one scenario (shared-prefix-and-suffix rename) beyond
what round 9 itself tested.**

### Scope 2 — Fix-diff regression scan

**Fix-diff** (`git diff 7696367 ed9f917 -- middleware/context-oracle/docs/plans/plan-phase-a.md`,
235 lines, read in full this session before drawing any conclusion): confirms
the diff touches exactly the sites round 9's own review already enumerated —
Step 20's rename-detector rewrite, Step 23/Step 37's `reindex.lock_stale_ms`
addition and lock release/staleness logic, two new §11.4 entries, `T20-1`'s
fixture-shape correction, and the new `T37-3` spec plus its `Step→T-ID`
table entry. No other plan content changed between round 8's and round 9's
commits.

- [x] Front matter + §1 Goal + §2.1–§2.4 (lines 1–258) — Read in full. No
  regression.
- [x] §3 Standards registry (lines 179–244) — Read in full. No defect.
- [x] §4/§5/§5.1–§5.5 (lines 245–600) — Read in full, including the new
  `reindex_lock.test.ts # T37-3 — added round 9` skeleton entry (line 425),
  cross-checked against the constructing step (Step 37) and the test spec
  (§12.1 `T37-3`). No defect.
- [x] §6, §8 (lines 582–600, 3389–3405) — Read in full. No defect.
- [x] §7 Steps 1–43 + Step 2.5, every step body in full (lines 601–3405, read
  across nine sequential `Read` calls with no gaps) — **this is where the
  Critical finding below originates** (Step 1's dependency pin and Step 22's
  tree-sitter frontend, lines 636–685 and 2005–2049). Every other step read
  and cross-checked; no other new defect found in step bodies.
- [x] §9 Checkpoints (lines 3407–3451) — Read in full. No defect; no
  checkpoint currently gates on an actual tree-sitter parse succeeding
  (Checkpoint 3's "pipeline complete" check is whisper-content-level, not a
  dependency-compatibility gate) — see Critical Finding 1's "why no
  checkpoint or test catches this."
- [x] §10 Decisions D-plan-1..8 (lines 3453–3601) — Read in full, including
  D-plan-2's dependency-floor rationale (lines 3483–3498), which is the
  decision the Critical finding falsifies the premise of. No new textual
  defect in the decision's own wording — the defect is in the premise the
  decision correctly describes ("the architecture verified exactly these
  versions"), not in the decision's internal consistency.
- [x] §10A collapse-tests, every D-plan-* and N1–N6 entry in full (lines
  3602–4184) — Read in full. D-plan-2's own collapse-test (lines 3679–3714)
  re-verifies the semver claim (still correct, re-confirmed this session —
  see Upstream Contract Verification) but never asks whether the two pinned
  packages actually interoperate — the hardest question it poses is about
  the caret range's *semver* behavior, not about *functional compatibility*
  between the two packages, which is the axis the Critical finding sits on.
  No other stale field found.
- [x] §11.1–§11.6 (lines 4186–4531) — Read in full. Confirmed (Read at
  4318–4326) that V14's own citation is reproduced verbatim: "web-tree-sitter
  (0.26.13) and tree-sitter-wasms (0.1.13) are current, pure-WASM (no native
  toolchain), with no install scripts" — an npm-registry-metadata claim,
  never a functional-load claim. Neither the plan nor the architecture
  contains a §11 entry asserting `Language.load()` was ever executed against
  these two packages together. This absence is grep-confirmed (see Critical
  Finding 1).
- [x] §12.1 Unit tier, T1-1 through T43-1 (lines 4545–5315) — Read in full,
  cross-checked each `Verifies`/`File`/`Data` field. `T22-1`
  (`docs/plans/plan-phase-a.md:5108–5122`, read this session) specifies:
  "Real `web-tree-sitter` + real `tree-sitter-wasms/out/typescript.wasm`. No
  doubles... Fails when the parse loses a symbol, emits a wrong span, or the
  import edge does not resolve" — it does not anticipate `Language.load`
  itself throwing before any parse is attempted, which is what direct
  execution shows happens on the very first invocation. `T37-3`'s spec
  (lines 5242–5266) matches my independent re-implementation exactly (Scope
  1, above).
- [x] §12.2–§12.4, T16-1 through T40-6 (lines 5316–6154) — Read in full. No
  new defect.
- [x] §12.5 Coverage attestation, both mapping tables (lines 6155–6260) —
  Read in full; every AC→T-ID row and Step→T-ID row cross-checked, including
  confirming `T37-3` correctly appears in the Step→T-ID table (line 6247)
  and correctly does *not* appear in the AC→T-ID table (it is a structural/
  mechanism test with no corresponding Phase A acceptance criterion, the
  same pattern as `T2.5-1`, `T21-2`, `T18-3`, `T41-1d` — verified by grep,
  none of those four appear in the AC table either). No new defect.
- [x] §13 Risks R1–R10 (lines 6263–6376) — Read in full; no risk entry
  discloses the dependency-incompatibility finding below, nor the
  reindex-lock-staleness-value finding — both are undisclosed residuals, not
  already-accepted ones. R9 (SQLite `busy_timeout` aggressiveness) is the
  closest existing precedent for *how* the plan discloses a "is this
  threshold actually right" residual, and neither new finding below has an
  equivalent entry.
- [x] §14.1 Bin 1 (lines 6384–6488), §14.2 Bin 2 (lines 6489–6538), §14.3
  Bin 3 (lines 6540–6591), §14.4 Reconciliation sweep (lines 6592–6756) —
  all Read in full. Q1's disposition (§14.1, retracted to D-plan-2, "version
  selection is not the planner's to make... the architecture verified
  exactly these versions") is the exact place where the false premise
  Critical Finding 1 identifies is relied upon. No new textual defect beyond
  that reliance itself.
- [x] §15 Gaps acknowledged, Q-gap-1 through Q-gap-6 in full (lines
  6759–7125) — Read in full. No new defect; neither new finding below is an
  already-disclosed gap.
- [x] §16 Post-completion (lines 7128–7196, end of document) — Read in full.
  No defect.
- [x] `docs/reviews/2026-09-07-round-9-plan-collapse-hunt.md` (744 lines)
  and `2026-09-07-round-9-plan-expert-review.md` (766 lines) — both Read in
  full, first, before touching the plan.
- [x] `docs/specs/spec-context-oracle.md` §14 (lines 908–1131, read this
  session in full). No regression in the AC↔T-ID mapping; AC-17 ("language
  breadth... nothing is hardcoded to a fixed three") is the acceptance
  criterion Critical Finding 1 most directly threatens in practice, since
  the generic-frontend-only fallback (if the crash-vs-degrade question
  resolves in the safer direction) still satisfies AC-17's literal text
  (languages remain indexable, just never via the tree-sitter path) but not
  its evident intent (precise, import-graph-aware indexing across languages).
- [x] `docs/architecture-phase-a.md` AD-2 (325–364), AD-3 (366–415), AD-5
  (568–645, spot-checked), AD-9 (736–922), AD-10 (924–946), AD-13
  (1043–1071), AD-14 (1073–1128), AD-20 (1377–1412), AD-24 (1513–1629),
  AD-25 (1630–1649), AD-26 (1650–1674) — all Read in full or spot-checked
  this session, per the task's explicit list. **Additionally read the full
  V1–V19 premise table (lines 123–145)** — this is what surfaced Critical
  Finding 1: V14's own "How verified" column (line 138) reads "npm registry
  metadata fetched 2026-08-29," the *only* row among V1–V19 that names a
  metadata-only verification method rather than direct execution or a
  documentation quote (every other row was Read and compared; see Systemic
  Patterns below for the full enumeration). AD-13/AD-26 remain
  mechanism-agnostic on rename-handling and lock-release respectively
  (confirmed again this session, matching round 9's own finding) — the
  round-9 fixes are plan-original elaborations, not architecture
  transcriptions, and do not contradict either AD.
- [x] `docs/STATUS.md` (current, post-round-9, ~518 lines) — Read in full.
- [x] `OWNER-LEDGER.md` (81 lines) — Read in full.
- [x] `docs/collapse-log.md` — the full 2026-09-07 entry set (rounds 3
  through 9, read in full; earlier entries 2026-07 through 2026-09-04
  sampled for pattern-history context, consistent with round 9's own scope).
- [x] `middleware/context-oracle/CLAUDE.md` — Read in full.
- [x] `middleware/context-oracle/.claude/commands/expert-review.md` (226
  lines) — Read in full, first.
- [x] `git log --no-merges --numstat -M` — executed against a freshly
  constructed repository (not reused from any prior round) exercising a
  cross-directory rename, a plain dissimilar-name rename, a same-directory
  rename, and a shared-prefix-and-suffix rename (Scope 1).
- [x] `node:fs`'s `O_CREAT|O_EXCL` acquire, `fs.unlinkSync` release, and
  `fs.utimesSync`-backed staleness reclaim/non-reclaim — executed directly
  against Node v22.22.2 in a fresh scratch directory (Scope 1).
- [x] `npm install --package-lock-only` + `npm ci` against a package.json
  matching Step 1's exact dependency block — executed fresh this session;
  confirms round 7's fix still holds (a round-7-flagged claim, re-checked
  opportunistically this round; not itself a new finding).
- [x] **`web-tree-sitter@0.26.13` `Language.load()` against every sampled
  `tree-sitter-wasms@0.1.13` grammar** (`javascript`, `typescript`, `python`,
  `go`, `java`, `c_sharp`) — executed fresh this session; all six throw
  identically. **`web-tree-sitter@0.25.9`** against the identical
  `tree-sitter-javascript.wasm` file — executed fresh; loads successfully,
  isolating the break to the 0.26.x line. **The officially-recommended
  `tree-sitter-javascript` npm package's own WASM file** under
  `web-tree-sitter@0.26.13` — executed fresh; loads and parses successfully
  (Critical Finding 1).
- [x] `npm view web-tree-sitter versions` / `npm view tree-sitter-wasms
  versions` — executed this session; confirms `0.26.13` is what `^0.26.13`
  resolves to today (matching round 6/7/9's semver re-checks) and that
  `0.1.13` is genuinely `tree-sitter-wasms`'s latest and only recent release
  (no newer version exists that might already fix the format mismatch).

**Rigor waivers:** none. **Instrument unavailability:** CodeGraph/Clear
Thought were not re-invoked this round; disclosed, non-gating, unchanged
from every prior round's disposition. The exact real-world duration of a
full Phase A index run (relevant to Moderate Finding 1) could not be
measured because Phase A's indexer does not exist yet (greenfield) — this
gap is disclosed in Moderate Finding 1 itself rather than silently dropped.

---

## Summary

**This review returns NEEDS FIXES.** Round 9's fix pass genuinely closed all
four of its own finding-groups — independently re-verified this round by
re-implementing each fix's exact mechanism from scratch (not reusing round
9's code) and executing it against freshly-constructed scenarios, including
one rename shape (shared prefix and suffix) beyond what round 9 itself
tested. The prescribed method from `docs/STATUS.md`'s "what to do next" —
re-execute round 9's own fix mechanisms rather than trust the corrected prose
— was followed to the letter and both fixes hold up completely. Full-document
regression scan then surfaced one new, previously-undiscovered **Critical**
finding: the plan's foundational dependency pin — `web-tree-sitter@^0.26.13`
paired with `tree-sitter-wasms@0.1.13`, inherited from architecture premise
V14 (2026-08-29) and re-cited without further verification across ten
architecture-review rounds and all nine prior plan-review rounds — is
functionally false. Direct execution this session shows `Language.load()`
throws unconditionally for every grammar file in `tree-sitter-wasms@0.1.13`
when loaded under `web-tree-sitter@0.26.13`, because the WASM files in that
package carry an old-format `dylink` custom section while the loader
requires the newer `dylink.0` section name introduced somewhere in the
0.26.x line (confirmed: `web-tree-sitter@0.25.9` loads the identical file
successfully; the officially-recommended `tree-sitter-javascript` npm
package's WASM file, built in the new format, loads and parses correctly
under 0.26.13). V14's own "How verified" column candidly states its method
was "npm registry metadata fetched" — the only premise among V1 through V19
verified by metadata rather than execution or a documentation quote — and
that gap survived undetected because every round's verification of D-plan-2
addressed the *semver range's* behavior (correctly, per rounds 6, 7, and 9's
own re-checks), never whether the two packages actually work together. This
breaks Step 22 (the tree-sitter frontend) entirely as literally specified,
threatening every whisper genre whose accuracy depends on precise
symbol/import extraction (Orientation's `entry_score`, Reuse's dominance
comparison, and Coupling/Consequence indirectly via the indexer they share).
A second, smaller **Moderate** finding is delivered against round 9's own
new content: the `reindex.lock_stale_ms` default (600000ms) that round 9
introduced is asserted twice as "well beyond any real index run's duration"
with zero measurement anywhere in the plan or architecture to support it —
disclosed honestly here as only partially verifiable, since Phase A's
indexer does not exist yet to time directly. Per the skill's mechanical
rule, the Critical finding alone forces NEEDS FIXES regardless of the
Moderate finding's own weight.

---

## Upstream Contract Verification

**Spec §14 acceptance criteria.** Re-read spec §14 (lines 908–1131) this
session in full. Critical Finding 1 does not change any AC↔T-ID mapping row,
but it directly threatens the *substance* AC-17 ("language breadth... adding
a language is configuration, not a redesign; nothing is hardcoded to a fixed
three") is meant to certify: as literally specified, no language is
tree-sitter-indexed at all, so AC-17's fixture (`T40-3`, "an unlisted
language becomes indexable... uses tree-sitter frontend" per its own Data
field, `docs/plans/plan-phase-a.md:6091–6104`) would need the tree-sitter
path to work for its own positive assertion to mean what it currently reads
as meaning.

**Architecture design decisions this task explicitly named for spot-check:**

| AD | What it decides | Verification method | Verdict |
|---|---|---|---|
| AD-2 | Runtime/store engine floor: Node ≥22.16.0, `node:sqlite` with FTS5 | Read `docs/architecture-phase-a.md:325–364` this session | **Honored** — no regression |
| AD-3 | Repository identity resolver | Read `docs/architecture-phase-a.md:366–415`; re-executed the git scenarios directly | **Honored** — no regression |
| AD-5 | Global-store schema and fact routing | Spot-checked against Step 8/23's corrected seeding split, including the new `reindex.lock_stale_ms` entry | **Honored** — no regression |
| AD-9 | Question intake, recognizers, deny decision | Read `docs/architecture-phase-a.md:736–922`; compared against Steps 14/16/18/33 | **Honored** — no regression |
| AD-10 | Deny confinement: one producer, structurally | Read `docs/architecture-phase-a.md:924–946`; compared against Step 15/T15-2 | **Honored** — no regression |
| AD-13 | Co-change miner: `git log --numstat -M`, hygiene filters, canonical pairs | Read `docs/architecture-phase-a.md:1043–1071` in full — mechanism-agnostic on rename handling | **Honored; rename-handling remains plan-original, correctly so, and is genuinely closed (Scope 1)** |
| AD-14 | The relevance bar | Read `docs/architecture-phase-a.md:1073–1128`; compared against Step 23/24 | **Honored** — no regression |
| AD-20 | `init`/`deinit` CLI spec | Read `docs/architecture-phase-a.md:1377–1412`; compared against Step 31 | **Honored** — no regression |
| AD-24 | Test/fixture architecture | Read `docs/architecture-phase-a.md:1513–1629` in full this session (not merely spot-checked); `T22-1`'s scope matches AD-24's own tree-sitter-fixture description | **Honored as a tier structure; `T22-1`'s own premise (that the tree-sitter frontend can load a grammar at all) is false per Critical Finding 1 — a defect in what the tier tests, not in the tier's architecture** |
| AD-25 | Packaging: two deps, no postinstall, no native code, `tsc` build | Read `docs/architecture-phase-a.md:1630–1649` in full | **Honored on dependency *count*; the two deps chosen do not functionally interoperate — see Critical Finding 1. AD-25 itself does not name the specific packages, only the count/shape constraint, so this is not an AD-25 transcription failure** |
| AD-26 | Concurrency: WAL + busy_timeout + retry-once; directory lock (mechanism-agnostic) | Read `docs/architecture-phase-a.md:1650–1674` in full; re-confirmed 0 hits for `flock`/`O_EXCL`/`unlink` | **Honored — the release/staleness elaboration remains plan-original and is genuinely closed (Scope 1)** |
| **V14** (full V1–V19 table read, lines 123–145) | `web-tree-sitter`/`tree-sitter-wasms` "current, pure-WASM, no install scripts" | **Read the "How verified" column for all 19 premises — V14 is the only one verified by registry metadata alone, never execution.** Independently executed `Language.load()` against both packages this session | **NOT HONORED as a functional premise — see Critical Finding 1. The registry-metadata claim itself (versions current, no install scripts) remains true; the inference drawn from it ("C-3-compatible parser runtime exists") is false** |

---

## Critical Findings

### Critical Finding 1 — `web-tree-sitter@^0.26.13` cannot load any grammar from `tree-sitter-wasms@0.1.13`; Step 22's tree-sitter frontend is non-functional exactly as pinned, a false premise inherited unexecuted across ten architecture-review rounds and all nine prior plan-review rounds

**What the plan says.** `docs/plans/plan-phase-a.md:636–638` (Step 1, "What
changes"): `package.json` dependencies "exactly `{"web-tree-sitter":
"^0.26.13", "tree-sitter-wasms": "0.1.13"}`." `docs/plans/plan-phase-a.md:2005–2023`
(Step 22, "What changes"): "Create `src/index/tree_sitter_frontend.ts`
implementing `LanguageFrontend` by loading the appropriate WASM grammar from
`tree-sitter-wasms/out/<lang>.wasm` (path resolved dynamically), parsing via
`web-tree-sitter`... Grammar loading is lazy per `(lang, first-use)` and
cached." `docs/plans/plan-phase-a.md:3483–3498` (D-plan-2): "Not a plan
decision — the architecture's V14 verified exactly these versions on
2026-08-29 and signed off (`OL-C6`). The plan uses what the architecture
verified." `docs/architecture-phase-a.md:138` (V14): "`web-tree-sitter`
(0.26.13) and `tree-sitter-wasms` (0.1.13) are current, pure-WASM (no native
toolchain), with no install scripts in the published manifest" — "How
verified": **"npm registry metadata fetched 2026-08-29."**

**How this was verified — and found false, by direct execution.** Installed
both exact packages fresh this session (`npm install web-tree-sitter@0.26.13
tree-sitter-wasms@0.1.13` in `/tmp/oracle_r10/treesitter_bench/`) and ran the
plan's own documented usage pattern (`Language.load(path)`, matching both
Step 22's text and `web-tree-sitter`'s own README "Basic Usage" section,
read this session):

```
$ node -e "
const {Parser, Language} = require('web-tree-sitter');
(async () => {
  await Parser.init();
  const lang = await Language.load(
    'node_modules/tree-sitter-wasms/out/tree-sitter-typescript.wasm');
})().catch(e => console.log(e.stack));
"
Error
    at failIf (.../web-tree-sitter.cjs:442:34)
    at getDylinkMetadata (.../web-tree-sitter.cjs:459:13)
    at Object.loadWebAssemblyModule (.../web-tree-sitter.cjs:783:26)
    at Language.load (.../web-tree-sitter.cjs:3177:25)
```

Traced the failure to source: `web-tree-sitter@0.26.13`'s
`loadWebAssemblyModule` unconditionally calls `getDylinkMetadata(binary)` as
its first step for every language load (this is how 0.26.x's Emscripten
`MAIN_MODULE`/side-module architecture dynamically links a grammar into the
runtime). `getDylinkMetadata` requires the WASM binary's custom section to be
named exactly `"dylink.0"` (`failIf(name2 !== "dylink.0")`, line 459, with no
fallback and no second code path). Directly inspected the actual WASM bytes:

```
$ node -e "
const buf = require('fs').readFileSync(
  'node_modules/tree-sitter-wasms/out/tree-sitter-javascript.wasm');
WebAssembly.compile(buf).then(mod => {
  console.log('dylink.0:', WebAssembly.Module.customSections(mod,'dylink.0').length);
  console.log('dylink (old):', WebAssembly.Module.customSections(mod,'dylink').length);
});
"
dylink.0: 0
dylink (old): 1
```

Every `tree-sitter-wasms@0.1.13` grammar file uses the **old** `"dylink"`
custom section name, not the `"dylink.0"` name `web-tree-sitter@0.26.13`
requires. Repeated this exact check against six sampled grammars
(`javascript`, `typescript`, `python`, `go`, `java`, `c_sharp` — the plan's
own §22 body cites `tree-sitter-wasms/out/<lang>.wasm` generically, and
`T22-1` specifically names `typescript.wasm`) — **all six** show `dylink.0:
0, dylink (old): 1`, and all six throw the identical `Language.load()`
error. This is not a corrupted download or a one-off file: it is the
package's own build format, uniform across its grammar inventory.

**Isolated the break to the `web-tree-sitter` 0.26.x line, and confirmed the
officially-recommended alternative works.** Installed
`web-tree-sitter@0.25.9` (the release immediately preceding 0.26.0) fresh and
loaded the **identical** `tree-sitter-javascript.wasm` file from
`tree-sitter-wasms@0.1.13`: **loaded successfully.** This confirms the
incompatibility is a genuine breaking change introduced in `web-tree-sitter`
0.26.x, not a general staleness of `tree-sitter-wasms` that any current
`web-tree-sitter` would also reject. Separately, installed the
officially-recommended per-language package
(`npm install tree-sitter-javascript`, per `web-tree-sitter`'s own README
"Getting the `.wasm` language files → From npmjs.com" section, read this
session) and confirmed its bundled WASM file carries the new `"dylink.0"`
section (`dylink.0: 1`) and **loads and parses correctly** under
`web-tree-sitter@0.26.13`:

```
$ node -e "... Language.load('node_modules/tree-sitter-javascript/tree-sitter-javascript.wasm') ..."
SUCCESS: parsed, root type: program
```

Also confirmed via `npm view tree-sitter-wasms versions` that `0.1.13` is
genuinely the package's current and only recent release (`dist-tags:
{latest: '0.1.13'}`) — there is no newer `tree-sitter-wasms` release already
rebuilt in the new format that a version bump would silently fix — and via
`npm view "web-tree-sitter@^0.26.13" version` that the plan's own caret range
resolves to exactly `0.26.13` today, the version tested.

**Why V14's own text discloses exactly the gap that let this survive.**
Read the full V1–V19 premise table (`docs/architecture-phase-a.md:123–145`)
in this session. Every other premise's "How verified" column names either
direct execution against a live instrument (V6–V9, V12, V13, V17) or a
verbatim quote from the current hooks documentation (V1–V5, V10, V11, V15,
V16, V18, V19). V14 alone reads "npm registry metadata fetched 2026-08-29" —
a check of publish dates and the absence of install scripts, which is a real
and correctly-executed check of a *different* claim (no native toolchain
required, C-3 compliance) than the one the plan's D-plan-2 and Step 1 build
on top of it (that the parser can actually load these grammars). The
architecture's own "Result" column for V14 hedges accordingly — "C-3-
compatible parser runtime **exists**" — but that hedge was never carried
forward into the plan with its actual scope; D-plan-2 and every citing
review round since have treated V14 as having established functional
viability, when its own text never claimed that.

**Why this was never caught in ten architecture-review rounds or nine
plan-review rounds.** Rounds 6, 7, and 9 each independently re-verified
D-plan-2's *semver* claim (whether `^0.26.13` "accepts 0.27.0 anyway" — false,
corrected round 6; re-confirmed round 9) — a real, valuable check, but one
that only ever interrogates the **version-range** axis of the dependency
pin, never the **functional-compatibility** axis. Every review pass that
touched D-plan-2 or V14 inherited "these are the versions the architecture
verified" as settled and moved on to checking whether the *range* was
written correctly, never whether the *pinned combination actually works
together* — the exact "verify a familiar-enough-to-not-check claim by
execution" blind spot rounds 6 through 9 progressively generalized to git
commands, `node:fs`, and `node:sqlite`, but never yet to a cross-package
integration test. This is one level beyond every prior execute-don't-assume
finding in this document's history: rounds 6–9 executed a single library's
or tool's own documented behavior; this finding required executing **two**
pinned packages **together**, which is precisely the kind of check `CLAUDE.md`'s
"Spikes before design-freeze: a spec-§13 assumption that gates the phase
being architected is validated with a cheap throwaway experiment first"
rule exists to force — a rule this specific pairing never received, in the
architecture, in the plan, or in any of the eighteen review passes since.

**Why this is not merely self-revealing in a way that makes it low-priority.**
An implementer following Step 22 literally would discover this the first
time `T22-1` runs — a loud, immediate `Error` with no message text, thrown
before a single grammar is ever loaded, for every language the plan's
default ext→grammar table names. That makes it self-revealing in the same
sense round 7's `npm ci` finding was (an implementer cannot miss it) — but
unlike a missing lockfile, the *fix* is not mechanical. Step 21's text
("resolves language via the ext→grammar config... calls the matching
frontend or `generic_frontend` fallback") does not specify what happens when
the matching frontend's grammar **load** throws rather than the **parse**
failing on bad input — there is no stated per-file try/catch that would
demote a load failure to the generic fallback. As literally specified, the
first file `runIndex` attempts to index via any configured grammar could
throw an uncaught exception that aborts the entire indexing pass for the
whole repository, not merely disable the tree-sitter path gracefully — this
downstream behavior is genuinely undetermined by the plan's current text,
which is itself a second-order consequence of the primary defect (an
implementer would have to invent error-handling the plan never specifies,
violating `expert-plan`'s "no single decision made on the fly" standard a
second time). Either way — total indexing failure, or a silent, permanent
fallback to the generic frontend for every language in every repo — Step 22
as literally written does not deliver what it promises, and no plan step,
checkpoint, or test currently exercises the actual `Language.load()` call
against the actual pinned `tree-sitter-wasms` package to catch it before
Step 42's exit run would.

**What correct disposition looks like.** This is an architecture-level
dependency-pairing defect, not a one-line plan text fix, and needs to be
resolved before Step 1/Step 22 are built:
1. **Re-run V14 as an actual execution, not a registry-metadata check** —
   `Parser.init()` + `Language.load()` against a real grammar from whichever
   package is chosen, for at least one language, before any version is
   re-pinned.
2. **Most direct fix: replace `tree-sitter-wasms` with the officially-
   documented per-language packages** (`tree-sitter-javascript`,
   `tree-sitter-typescript`, `tree-sitter-python`, etc. — confirmed this
   session to carry the new-format WASM and load/parse correctly under
   `web-tree-sitter@0.26.13`). This is the path `web-tree-sitter`'s own
   README recommends and is the one verified working. It changes the
   dependency count from exactly two to one-per-supported-language, which
   requires revisiting AD-25/`D-plan-3`'s "exactly two runtime dependencies"
   invariant and Step 41's `T41-*` convention tests that may assume a fixed
   dependency count — an architecture-level decision, not a plan patch.
3. **Alternative: floor `web-tree-sitter` at a version in the `0.25.x` line**
   (confirmed working with the existing `tree-sitter-wasms@0.1.13` pin this
   session) — keeps the two-dependency count but requires re-running V14 at
   the new floor and re-checking every other premise (V7's Node-floor
   reasoning, any 0.26.x-specific API surface Step 1/22 might rely on) that
   assumed `0.26.13`.
4. Whichever path is chosen, add an actual `Language.load()` + `parser.parse()`
   execution to `T1-1` or a new dedicated dependency-smoke-test, run in CI,
   so a future version bump (the bin-2 `web-tree-sitter` floor question
   already flagged at §14.2) cannot reintroduce this exact class of silent
   incompatibility without a red build.

**Silent or self-revealing.** Self-revealing at implementation time (a loud,
immediate thrown error) but silent across the review process that was
supposed to catch it before implementation — it survived ten architecture-
review rounds and nine plan-review rounds specifically because every
verification of D-plan-2/V14 checked the *version-range* axis (semver,
registry presence) and never the *cross-package functional* axis, exactly
the blind spot this review's own Systemic Patterns section below scans for.

---

## Serious Findings

No Serious findings — the full inventory was Read or Grep-verified per
Compliance Gate B; the one defect found at Serious-or-above severity
(Critical Finding 1) is classified Critical, not Serious, because it
constitutes a fundamental, total, and immediately-reproducible failure of a
load-bearing Phase A component (Step 22) rather than a compounding-over-time
standards violation.

---

## Systemic Patterns

**Proactive scan run before classifying.** Checked whether Critical Finding
1's shape — a claim inherited from the architecture and re-cited across many
review rounds without ever being executed — recurs elsewhere in the plan's
Standards registry (§3) or Claims registry (§11).

- **Enumeration attempted.** Read the full V1–V19 table
  (`docs/architecture-phase-a.md:123–145`) and classified each premise's
  "How verified" column into "executed against a live instrument" (V6, V7,
  V8, V9, V12, V13, V17 — 7 premises) or "quoted from current hooks
  documentation, read this session per the architecture's own citation" (V1,
  V2, V3, V4, V5, V10, V11, V15, V16, V18, V19 — 11 premises) or "registry
  metadata only, no execution" (**V14 — 1 premise**). **Result: V14 is the
  only metadata-only-verified premise among nineteen.** This is not a
  systemic pattern across the architecture's premise table — it is an
  isolated gap, verified by reading the same table an independent reviewer
  would read, not by extrapolation from a sample of two.
- **Checked whether any other plan-level claim beyond D-plan-2 rests on V14
  without further scrutiny.** Grepped `V14` across the full plan — 4 hits
  (§3 Standards registry, D-plan-2's heading, D-plan-2's Reasoning, Step 22's
  Source field). All four correctly attribute the same underlying claim; none
  independently re-verifies it beyond what D-plan-2 already does (the semver
  range). No second, independently-drifted citation of V14 exists to check
  for the "fix landed at primary site, not swept everywhere" pattern this
  document's history is otherwise full of — this is a single load-bearing
  citation with a false premise, not a citation-drift instance.
- **Conclusion: no Systemic finding delivered.** The defect is confined to
  one premise (V14) and its two direct consumers (D-plan-2, Step 22) — a
  Critical finding on its own terms, but not a pattern recurring across
  multiple independent sites the way rounds 2 through 5's citation-drift
  Systemic findings were.

No other systemic patterns beyond those already tracked and closed in prior
rounds — verified by the scans above plus the full read of §1–§16 described
in Scope 2.

---

## Moderate & Minor Findings

### Moderate Finding 1 — `reindex.lock_stale_ms`'s 600000ms default is asserted as "well beyond any real index run's duration" with zero measurement anywhere in the plan or architecture to support it

**What the plan says.** `docs/plans/plan-phase-a.md:2114–2120` (Step 23):
"`reindex.lock_stale_ms` = `"600000"` (10 minutes) — **not sourced**... well
beyond any real index run's duration, a plan-level judgment with no external
or owner grounding, calibrated by the exit-run like the other unsourced
values below." Repeated at `docs/plans/plan-phase-a.md:2940` (Step 37): "10
minutes — well beyond any real index run, plan-judgment default, not
architecture-sourced."

**How this was verified.** Grepped the full 7196-line document and the
2058-line architecture document for any measurement of full-index duration
(`runIndex`, `--full`, index timing, or a `ms`/`seconds`/`minutes` figure
tied to indexing) — **zero hits** anywhere naming an actual measured or
estimated duration for a full `runIndex` pass on a real repository. The only
adjacent timing figure in the entire architecture is V8's "45–54 ms full
process wall time" for the **per-event handler** (a single hook invocation:
process start + store open + a few queries) — an entirely different
operation from a full structural + co-change re-index of a real repository's
complete file tree and commit history, which Steps 20–22 describe as
walking every file (subject to `.gitignore`), parsing each with tree-sitter
or the generic fallback, and streaming `git log --numstat -M` over up to
10,000 commits. Attempted to establish an independent empirical bound this
session by benchmarking `web-tree-sitter`'s real parse throughput against a
synthetic multi-megabyte TypeScript corpus — this attempt was inconclusive
for an unrelated reason: it hit the same `Language.load()` incompatibility
documented in Critical Finding 1, so no parse-throughput figure could be
obtained via this specific path. **Because Phase A's own indexer (Steps
20–22) does not exist yet (architecture `L8`, greenfield), the claim's truth
cannot be settled by executing the actual mechanism the claim is about** —
this is disclosed as a genuine verification gap, not glossed over.

**Why this is Moderate, not Serious or Critical.** Unlike Critical Finding
1, this claim has not been proven false — only proven **unverified**, the
same "claim about a familiar-enough-to-not-check magnitude, asserted as
settled fact" shape rounds 6 and 7's collapse-log entries name, but here
the magnitude in question (how long a real full-repo index might take) is
about code that does not exist yet, which genuinely bounds how far execution
can settle it this round. The consequence if the assumption is wrong is also
bounded: `reindex.lock_stale_ms` governs only the **automatic**
self-refresh path (Step 32's manual `ctxoracle index` bypasses the lock
entirely, confirmed by re-reading `docs/plans/plan-phase-a.md:2650–2653` this
session); a too-short threshold would cause a second `refreshIfStale`
trigger to reclaim a lock still held by a legitimately-running (not crashed)
reindex, producing at worst a redundant concurrent reindex attempt — the
underlying SQLite writes remain safe under AD-26's WAL + busy_timeout +
retry-once discipline (a genuinely separate mechanism from the filesystem
lock), so this would manifest as wasted work and possibly transient
`store_busy` faults, not data corruption, and it self-heals once either
reindex completes. This differs from round 9's own Serious findings (which
were *proven*, by execution, to fail 100% of the time with permanent or
data-corrupting consequences); this is a *plausible but unverified* residual
that could occur only on repositories large enough that a full index
genuinely exceeds ten minutes, which the plan does not know the frequency of.

**Why this is a genuinely new finding, not a re-opening of round 9's own
Minor Finding 3.** Round 9's collapse-hunt (Finding 3, now closed per Scope
1 above) flagged that the staleness check was *unspecified and untested* —
a specification-completeness gap round 9's own fix (this same commit)
closed by naming a concrete value and adding `T37-3`. This finding is
different in kind: the mechanism is now fully specified and tested exactly
as designed, but the **value itself** (600000ms) that round 9's fix chose
was never checked against anything, and the confident framing ("well beyond
any real index run's duration") reads as a verified fact rather than the
same honest "plan-seeded, calibrated by the exit-run" framing every other
unsourced numeric default in Step 23 correctly carries. Unlike those other
unsourced defaults (`bar.reuse_dominance_k`, `bar.clear_length_floor`),
which only affect whisper *quality* (a wrong value produces a worse-but-safe
whisper, correctable via `tune`), `reindex.lock_stale_ms` is *safety-
relevant* — it governs the correctness of a mutual-exclusion mechanism
AD-26 explicitly describes as providing "single writer discipline" for the
detached reindex — and unlike R9's SQLite-busy-timeout residual (which
carries its own §13 risk entry with an explicit "in practice contention is
low" argument and a stated mitigation), this new safety-relevant threshold
has no §13 risk entry disclosing that its magnitude is a guess.

**What correct disposition looks like.** Either (a) reframe the "well beyond
any real index run's duration" claim to match the honest, calibration-
pending framing the plan already uses for its sibling unsourced values (drop
the confident magnitude claim; state plainly that the threshold is a starting
guess pending Step 42's real-repo exit-run data), and add a §13 risk entry
(alongside R8/R9, the plan's existing concurrency-residual risks) naming the
specific failure mode (a legitimately-long reindex on a large real repo could
have its lock reclaimed by a concurrent trigger, causing redundant work
rather than corruption); or (b) once Step 20–22 are implemented, measure an
actual full-index duration on the largest of Max Cogar's real repos before
Step 42's exit run and set the threshold from that data, the same discipline
the plan already applies to its bar-tier defaults.

**Silent or self-revealing.** Silent — if the threshold is too short, the
symptom (redundant concurrent reindex attempts, occasional `store_busy`
faults) would not be attributed to the lock-staleness value without deducing
it from first principles; there is no diagnostic that names "lock reclaimed
while original holder was still legitimately running" as a distinct fault
class.

No other Moderate findings, and no Minor findings — verified by the full
read of §1–§16, the T-ID cross-checks in §12.1–§12.5, and the targeted grep
scans described in Scope 2 and Systemic Patterns above. Every citation-drift
class rounds 2–9 found (step-number misattribution, stale collapse-test
fields, malformed table rows, duplicated paragraphs) was re-checked at its
previously-fixed site and found to still be fixed; no new instance of any of
those specific defect classes was found anywhere in this round's full read.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per
Compliance Gate B to the extent execution allowed. Moderate Finding 1's
residual verification gap (whether a real full-index run could exceed the
600000ms threshold) is disclosed inline within that finding itself, per the
skill's guidance to name the specific gap rather than hide an unresolved
question inside a confirmed-findings section — it is delivered as a
confirmed Moderate finding (the *unverified-and-unsupported claim* is itself
the defect, independently of which direction the true duration turns out to
be), not held back as tentative, because the absence of any grounding
whatsoever is itself grep-confirmed, not speculative.

---

## What's Actually Good

- **Round 9's Step 20 brace-expansion fix is a genuinely correct, general
  algorithm, not merely patched to the specific example round 9 happened to
  cite.** Independently re-implementing the two-step detector from the
  plan's own prose (not copying round 9's code) and running it against four
  freshly-constructed rename scenarios — including a shared-prefix-**and**-
  suffix case round 9 itself never tested — produced correct real-path
  reconstruction in every case. **Verified by:** direct execution, this
  session, against newly-constructed git repositories (Scope 1). **Standard:**
  the same execute-don't-assume discipline this review applies to its own
  new findings, credited here because the fix generalizes correctly beyond
  its own test coverage, not merely to it.
- **Round 9's Step 37 lock release/staleness fix is a complete, correctly-
  reasoned state machine** — acquire, release-on-completion, and
  staleness-gated reclaim-without-clobbering-a-live-lock are all present and
  each independently verified against a real filesystem to behave exactly as
  specified, including the important negative case (a fresh lock must NOT be
  reclaimed). **Verified by:** direct execution, this session, of the full
  acquire/release/reclaim/non-reclaim sequence against real `fs` calls
  (Scope 1). **Standard:** the same discipline, credited as a positive
  finding because all three T37-3 scenarios were independently reproduced,
  not merely re-read.
- **§11.4's claims-registry discipline continues to hold under scrutiny** —
  both new round-9 entries (the git-invocation-outcome distinction, the
  rename-collapse fact) state their evidence in a form that is itself
  directly re-executable, and re-executing them this session reproduced the
  identical facts they claim. **Verified by:** direct execution matching
  the §11.4 entries' own stated evidence, this session. **Standard:** the
  registry's own stated purpose (a complete, re-derivable index of externally
  verified claims) — met for the entries added this round.

---

## Recommended Priority

1. **Critical Finding 1 (the `web-tree-sitter`/`tree-sitter-wasms`
   incompatibility).** Resolve before Step 1 is built — this blocks Step 22
   entirely and is upstream of every genre depending on precise indexing.
   Requires an architecture-level decision (per-language packages vs. a
   `web-tree-sitter` downgrade), not a plan-text patch, and should be
   accompanied by an actual `Language.load()` execution added to CI so the
   next dependency-version question (already flagged at §14.2) cannot
   reintroduce this silently.
2. **Moderate Finding 1 (`reindex.lock_stale_ms`'s unverified magnitude).**
   Reframe the claim honestly now (cheap, textual); measure and calibrate
   once Step 20–22 exist and before Step 42's exit run, consistent with how
   the plan already treats its other unsourced numeric defaults.
3. **Log both in §11.4 / §13** as part of either fix, per the plan's own
   stated discipline, and add a collapse-log entry generalizing this round's
   lesson: **a claim inherited from the architecture and re-verified only
   along the axis a prior finding already checked (here: the semver *range*,
   re-checked three separate times) can still harbor a false premise on a
   different, uninspected axis (here: functional cross-package
   compatibility) — re-verifying the same axis a fourth time is not the same
   as checking a new one, and a claim's own "How verified" column is worth
   reading for what it does *not* say it checked, not only for what it says
   it did.**

---

## Verdict

Verdict: NEEDS FIXES (2 findings: 1 Critical, 1 Moderate)
