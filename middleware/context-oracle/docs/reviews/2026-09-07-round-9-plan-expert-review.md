# Expert review (round 9, re-review) — `docs/plans/plan-phase-a.md`

**Date:** 2026-09-07
**Reviewer:** fresh independent `/expert-review` pass; not the plan-writer, not
the author of any of the prior review documents on this artifact, no prior
context on this session.
**Artifact:** `/home/user/agent-armory/middleware/context-oracle/docs/plans/plan-phase-a.md`
at its current state on branch `claude/plan-correction-strategy-57ot28` —
commit `7696367` ("context-oracle: fix round-8 collapse-hunt and expert-review
findings"), confirmed via `git log -1` and `git status --short` (clean tree)
this session; 7073 lines, read end to end this session across sequential
`Read` calls with no gaps (1–400, 400–700, 700–1050, 1050–1450, 1450–1870,
1867–1930, 1930–2000, 2000–2400, 2400–2850, 2850–3080, 3078–3310, 3305–3440,
3440–3670, 3666–3710, 3730–4060, 4059–4140, 4137–4350, 4341–4430, 4429–4570,
4564–4665, 4665–4965, 4965–5364, 5364–5764, 5763–6143, 6140–6290, 6289–6674,
6689–7073), per the Re-Review Protocol in
`middleware/context-oracle/.claude/commands/expert-review.md` (the
project-scoped copy, read first, in full, before any other file).
**Round:** 9 (re-review of round 8's collapse-hunt and round 8's
expert-review, both landed in commit `7696367`). Rounds 1–8 history (from
`docs/STATUS.md` and the sixteen prior review documents in `docs/reviews/`):
round 1, 3 collapses/4 partials/6 missed decisions + 10 expert-review
findings; round 2, 1 collapse/3 partials/1 procedural gap + 9 expert-review
findings incl. an overclaim (S3); round 3, 2 collapses/2 partials + 1
Systemic×2 + 2 Moderate + 1 Minor; round 4, 2 collapses/0 partials + 1
Systemic×2; round 5, 2 collapses (one incomplete) + 1 Systemic×2 at 6 sites +
1 Minor; round 6, 1 collapse + 2 Moderate/2 Minor; round 7, 1 collapse + 3
Minor (collapse-hunt) + 1 Critical + 1 Moderate (expert-review); round 8, 2
collapses (collapse-hunt) + 1 Serious + 1 Moderate (expert-review). **This
round independently re-derives round 8's four closure claims by direct
execution rather than trusting the plan's restated text, finds that one of
them (Collapse 2, the co-change miner's rename handling) is genuinely closed
only for the plain-rename case and remains open for the brace-abbreviated
case — the exact example the round-8 fix itself cites as handled — and finds
one further new defect in round 8's own fix-diff (the replacement lock
mechanism for the retracted `flock`(2) claim omits release logic). Both are
delivered as Serious, both silent rather than self-revealing, continuing this
document's four-round streak (6, 7, 8, 9) of finding at least one new or
incompletely-closed defect on every pass that applies the execute-don't-assume
method to a not-yet-checked site.**

---

## Scope and Inventory

### Tool-plan disclosure

`ToolSearch` for CodeGraph/Clear Thought was not re-invoked this round —
consistent with every prior round's disposition (§15 Q-gap-1/Q-gap-2 in the
plan itself); no finding below depends on either tool. Every claim below is
verified by Read (file:line, this session), Grep (query + result count, this
session), or direct executable checks (git 2.43.0, Node v22.22.2, npm 10.9.7,
all run fresh this session in scratch directories under
`/tmp/oracle_verify/`, none reused from any prior round's transcript) — never
memory, never trust in a prior review's or the plan's own attestation.

### Scope 1 — Round 8's finding-groups, as closure items

- [x] **Round-8 collapse-hunt Collapse 1 (Step 5's repo-key algorithm
  conflated a `git rev-parse --is-inside-work-tree` "succeeds and prints
  `false`" outcome with a "fails outright" outcome under one "→ false"
  label).** Read current lines 936–983 (Step 5, "What changes"): the
  algorithm now runs every `git rev-parse`/`git rev-list` invocation through
  a helper returning `{ok:true, value} | {ok:false}`, with step 1 reading
  "if it fails outright (`ok: false` — no `.git` anywhere), skip directly to
  step 4 (`mode='path'`)... If it succeeds and returns `'false'` (the
  bare-repository case), fall through to (3)". **Independently re-executed
  the underlying claim myself, from scratch**, in `/tmp/oracle_verify/`
  (git 2.43.0): a genuinely non-git directory produces `fatal: not a git
  repository (or any of the parent directories): .git`, exit 128, no stdout,
  for all three of `--is-inside-work-tree`, `--is-shallow-repository`, and
  `git rev-list --max-parents=0 HEAD`; a bare repository (`git init --bare`)
  produces stdout `false`, exit 0, for `--is-inside-work-tree`; a full-history
  repository produces `true`/`false`/a real commit hash for the three
  commands respectively. All three outcomes match the plan's current text
  exactly. `T5-1`'s spec (lines 4622–4630) now asserts fixture (d) requires
  the invocation to "fail outright, exit non-zero, not... succeed and print
  `'false'`". **Closed, independently reproduced.**

- [ ] **Round-8 collapse-hunt Collapse 2 (Step 20's co-change miner ran
  `git log --numstat -M` without accounting for `-M`'s rename-collapsed
  output syntax) — NOT genuinely closed for the case the fix itself names as
  handled.** Read current lines 1867–1893 (Step 20, "What changes"): "for
  each `--numstat` line, if the third (path) field matches `^(.*) => (.*)$`
  (a `-M`-detected rename, with or without brace-abbreviated
  shared-prefix/suffix compaction, e.g. `src/{utils => other}/c.txt`),
  expand the brace form if present into the real old and new paths and add
  both to that commit's touched-file set." **Independently re-executed
  against a constructed repository** in `/tmp/oracle_verify/full-repo/`
  (three scenarios: a plain content-diverged rename below git's similarity
  threshold — prints as two ordinary lines, no problem; a pure rename —
  collapses to `0	0	b.txt => c.txt`; a rename into a sibling
  subdirectory — collapses to the **brace-abbreviated** form
  `0	0	src/{utils => other}/e.txt`, exactly the plan's own cited
  example). Applying the plan's own stated regex, `^(.*) => (.*)$`, to that
  exact string (`node -e 'console.log("src/{utils => other}/e.txt".match(/^(.*) => (.*)$/))'`)
  yields capture groups `"src/{utils"` and `"other}/e.txt"` — **neither is a
  real file path**: one carries an unmatched `{`, the other an unmatched
  `}`, and neither resolves to `src/utils/e.txt` or `src/other/e.txt`, the
  actual pre- and post-rename paths. The plan's prose asserts "expand the
  brace form if present into the real old and new paths," but the only
  concrete mechanism the text supplies — the quoted regex — does not do
  that expansion; it is a bare `" => "` split with no brace-awareness at
  all, and no separate brace-parsing algorithm appears anywhere else in the
  document (grepped `\{.*=>.*\}|brace` across the full 7073 lines — 3 hits,
  all inside this same passage's own prose, none supplying an algorithm).
  This is the identical defect class round 8 itself found — a naive
  `--numstat`-line-to-path assumption silently producing a malformed
  compound string that would be either ingested as a literal (non-existent)
  path or dropped — surviving inside round 8's own fix, for the harder of
  the two rename shapes the same fix explicitly claims to cover. See
  **Serious Finding 1** below for the full writeup. **NOT closed — reopened
  under this round's own finding, with a narrower scope (plain renames now
  correctly handled; brace-abbreviated renames are not).**

- [x] **Round-8 expert-review Serious Finding 1 (Step 37 cited `flock`(2),
  a POSIX syscall `node:fs` does not expose) — the syscall citation itself
  is now closed; a new gap in its replacement is Serious Finding 2 below.**
  Read current lines 2893–2907 (Step 37, "detached reindex" bullet): now
  specifies an atomic exclusive-create lock file —
  `fs.open(lockPath, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY)`,
  throwing `EEXIST` if another process holds it. **Independently
  re-executed** this exact call in `/tmp/oracle_verify/`: a first
  `fs.openSync(path, O_CREAT|O_EXCL|O_WRONLY)` succeeds; a second identical
  call against the same path throws `EEXIST` — confirmed. §11.4 (lines
  4370–4382) carries the matching claims-registry entry, re-verified this
  session (`Object.keys(require('node:fs')).filter(k=>/lock/i.test(k))` →
  `[]`; `fs.constants.O_EXLOCK` → `undefined`). **The `flock`(2) citation
  itself is closed and the replacement primitive's core operation
  (EEXIST-on-second-create) is real and correctly described.** But
  `fs.closeSync(fd)` on the winning process does **not** remove the lock
  file — independently verified this session (`fs.existsSync(path)` returns
  `true` after `closeSync`) — and the plan specifies no unlink/release step
  anywhere (grepped `unlink|release.*lock|reindex` across the full document
  — the only two hits outside this passage are lines 766 and 4374, neither
  describing a release), which is a **new** defect this round found in
  round 8's own fix, not a re-opening of the original `flock`(2) finding.
  See **Serious Finding 2** below.

- [x] **Round-8 expert-review Moderate Finding 1 (Step 1/D-plan-3 stated a
  blanket "Node 22.16.0's `node:test` cannot execute `.ts` source directly"
  fact across the plan's entire `>=22.16.0` floor, false for the
  `>=22.18.0` sub-range).** Read current lines 649–664 (Step 1) and
  3677–3701 (D-plan-3's collapse-test "Answer" field): both now state the
  version-bounded fact — type stripping default-on from v22.18.0, with the
  `const enum FaultCode` transformation requirement as the real,
  version-independent reason the compile step is needed. **Independently
  re-executed** in `/tmp/oracle_verify/` on Node v22.22.2 (inside the
  plan's own floor): `node --test sample.test.ts` against a plain
  type-annotated `.ts` file ran with zero flags, 1 pass, 0 fail; `node
  enum_test.ts` against a file containing `const enum FaultCode { ... }`
  threw `SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum
  is not supported in strip-only mode` — both match the plan's corrected
  text exactly. §11.4 (lines 4384–4401) carries the matching entry.
  **Closed, independently reproduced.**

**Scope 1 result: three of round 8's four finding-groups are genuinely
closed against current source, independently re-verified this round by
direct execution in fresh scratch directories. The fourth (Collapse 2) is
closed only for the plain-rename `--numstat` shape; the brace-abbreviated
shape the same fix explicitly names as an example it handles is not actually
handled by the mechanism the fix text supplies — this is not a fresh defect
introduced since round 8, it is round 8's own fix failing to close the full
scope of what round 8 itself found.**

### Scope 2 — Fix-diff regression scan

**Fix-diff** (`git diff d74e529 7696367 -- middleware/context-oracle/docs/plans/plan-phase-a.md`,
235 lines, read in full this session before drawing any conclusion): confirms
the diff touches exactly six sites — Step 1's "What changes" (TS
type-stripping rewrite), Step 5's algorithm rewrite, Step 20's rename-handling
addition, Step 37's lock-mechanism replacement, D-plan-3's collapse-test
rewrite, two new §11.4 entries, and the `T5-1`/`T20-1` spec-field
corrections in §12. No other plan content changed between round 7's and
round 8's commits — confirmed by the diff's own boundaries.

- [x] Front matter + §1 Goal + §2.1–§2.4 (lines 1–258) — Read in full. No
  regression from round 8's fixes.
- [x] §3 Standards registry (lines 179–244) — Read in full. No defect.
- [x] §4/§5/§5.1–§5.5 (lines 245–578) — Read in full, every file-skeleton
  entry cross-checked against its constructing step. No new defect.
- [x] §6, §8 (lines 579–618, 3340–3356) — Read in full. No defect.
- [x] §7 Steps 1–43 + Step 2.5, every step body in full (lines 619–3338,
  read across eleven sequential `Read` calls with no gaps) — this is where
  both findings below originate: Step 20's rename-expansion mechanism
  (lines 1867–1893) does not correctly handle the brace-abbreviated case it
  names as an example (Serious Finding 1); Step 37's replacement lock
  mechanism (lines 2893–2907) omits release/staleness-threshold logic
  (Serious Finding 2). No other new step-citation, cross-reference, or
  file-path defect found across all 43 steps + Step 2.5 — every
  `Step N`/`T-ID` cross-reference was checked against an independently-built
  step→topic map and the citations round 4–8 already fixed remain fixed
  (fresh greps below).
- [x] §9 Checkpoints (lines 3358–3402) — Read in full. No defect.
- [x] §10 Decisions D-plan-1..8 (lines 3404–3552) — Read in full. D-plan-2's
  heading remains internally consistent (round 7 fix holds). No new defect.
- [x] §10A collapse-tests, every D-plan-* and N1–N6 entry in full (lines
  3553–4134) — Read in full. D-plan-3's own collapse-test (lines 3666–3709)
  correctly restates the version-bounded fact (Scope 1, above). No other
  stale field found.
- [x] §11.1–§11.6 (lines 4137–4462) — Read in full. Both new §11.4 entries
  (node:fs lock surface; TS stripping boundary) verified by direct execution
  this session (Scope 1, above). Neither new finding below has a §11 entry
  logging it — like round 7's `SqliteError` and round 8's own two findings
  before it, both are un-logged gaps in the very fix that was supposed to
  close the prior finding.
- [x] §12.1 Unit tier, T1-1 through T43-1 (lines 4481–5192) — Read in full,
  cross-checked each `Verifies`/`File` field. T20-1's Data field (lines
  4954–4970) names only "1 commit containing a git-detected file rename
  (partway through the planted coupling history)" with no brace-abbreviated
  sub-case named — confirming the plan's own acceptance test would not
  exercise the exact scenario Serious Finding 1 describes (a rename fixture
  built as a single top-level move, the simplest deterministic construction,
  produces the plain `old => new` form, not the brace form). T37-1/T37-2
  (lines 5117–5144) test only SQLite busy-retry and fold-serialization —
  neither test touches the reindex directory lock at all (confirming Serious
  Finding 2's "no test coverage" claim — see below).
- [x] §12.2–§12.4, T16-1 through T40-6 (lines 5193–6031) — Read in full,
  including T21-1/T21-2 (indexer skeleton + `oracleSpawn` structural check —
  neither tests lock acquire/release behavior either). No new defect beyond
  the two above.
- [x] §12.5 Coverage attestation, both mapping tables (lines 6032–6137) —
  Read in full; every AC→T-ID row and Step→T-ID row cross-checked. No new
  defect.
- [x] §13 Risks R1–R10 (lines 6140–6247) — Read in full; no risk entry
  discloses either new defect below — confirming both are undisclosed gaps,
  not already-accepted residuals.
- [x] §14.1 Bin 1 (lines 6261–6364), §14.2 Bin 2 (lines 6366–6415), §14.3
  Bin 3 (lines 6417–6467), §14.4 Reconciliation sweep (lines 6469–6632) —
  all Read in full. No new defect.
- [x] §15 Gaps acknowledged, Q-gap-1 through Q-gap-6 in full (lines
  6636–7001) — Read in full. No new defect; neither new finding below is an
  already-disclosed gap.
- [x] §16 Post-completion (lines 7005–7073, end of document) — Read in
  full. No defect.
- [x] `docs/reviews/2026-09-07-round-8-plan-collapse-hunt.md` (730 lines)
  and `2026-09-07-round-8-plan-expert-review.md` (776 lines) — both Read in
  full, first, before touching the plan.
- [x] `docs/specs/spec-context-oracle.md` §14 (lines 908–1131, read this
  session in full). No regression in the AC↔T-ID mapping.
- [x] `docs/architecture-phase-a.md` AD-2 (325–364), AD-3 (366–415), AD-5
  (568–645, spot-checked), AD-9 (736–922), AD-10 (924–946), AD-13
  (1043–1071), AD-14 (1073–1128), AD-20 (1377–1412), AD-24 (1513–?,
  spot-checked), AD-25 (1630–1648, spot-checked), AD-26 (1650–1673) — all
  Read in full or spot-checked this session, per the task's explicit list.
  **Grepped `flock` and `O_EXCL`/`unlink` across the entire architecture
  document — 0 hits for any** — Serious Finding 2 is a plan-original gap
  (the architecture's AD-26 is deliberately mechanism-agnostic: "the
  detached reindex takes a directory lock; the handler never waits on it,"
  never naming a release step either), not a transcription failure of an
  architecture premise that already addressed it. See Upstream Contract
  Verification below.
- [x] `docs/STATUS.md` (471 lines, current, post-round-8) — Read in full.
- [x] `OWNER-LEDGER.md` (81 lines) — Read in full.
- [x] `docs/collapse-log.md` — the full 2026-09-07 entry set (rounds 3
  through 8, all read in full, lines 1–415); earlier entries (2026-07
  through 2026-09-04) sampled for pattern-history context.
- [x] `middleware/context-oracle/CLAUDE.md` — Read in full.
- [x] `middleware/context-oracle/.claude/commands/expert-review.md` (226
  lines) — Read in full, first.
- [x] `git rev-parse --is-inside-work-tree`, `--is-shallow-repository`,
  `git rev-list --max-parents=0 HEAD` — each executed against three
  constructed repository states (non-git directory, bare repository,
  full-history repository) in `/tmp/oracle_verify/` (Scope 1, Collapse 1).
- [x] `git log --no-merges --numstat -M` — executed against a constructed
  repository exercising a non-rename change, a similarity-below-threshold
  edit+rename, a pure rename, and a brace-abbreviated subdirectory rename
  (Scope 1/Serious Finding 1).
- [x] `node:fs`'s exported surface for lock-related functions and
  constants, and the actual persistence of a lock file after
  `fs.closeSync` — run directly against Node v22.22.2 (Scope 1/Serious
  Finding 2).
- [x] `node --test` against a raw `.ts` file and against a `.ts` file
  containing `const enum` — run directly against Node v22.22.2 (Scope 1,
  Moderate Finding closure).
- [x] `PRAGMA journal_mode=WAL`, `PRAGMA busy_timeout`, `PRAGMA quick_check`
  — executed against both an in-memory `node:sqlite` database (WAL silently
  falls back to `memory` — expected SQLite behavior for `:memory:`
  databases, not a plan defect since the plan always opens a file-backed
  store) and a real file-backed database (WAL, busy_timeout, and
  quick_check all behave exactly as T3-1 asserts) — a round-8-flagged
  candidate for round 9 (`docs/STATUS.md` "What to do next"); **survives,
  no defect.**
- [x] `git config --get remote.origin.url` — executed against https (with
  userinfo, default port, mixed case host), scp-like, and explicit-`ssh://`
  remote forms, confirming the string is returned verbatim with no
  normalization applied by git itself — a round-8-flagged candidate for
  round 9; **survives**, corroborating N1's disclosure that the plan's own
  code, not git, must perform every normalization axis it claims.

**Rigor waivers:** none. **Instrument unavailability:** CodeGraph/Clear
Thought were not re-invoked this round; disclosed, non-gating, unchanged
from every prior round's disposition.

---

## Summary

**This review returns NEEDS FIXES.** Round 8's fix pass genuinely closed
three of its own four finding-groups (Collapse 1's repo-key conflation,
Serious Finding 1's `flock`(2) citation as a syscall claim, and Moderate
Finding 1's `node:test`/TypeScript version-boundary claim), each
independently re-verified this round by direct execution in fresh scratch
directories rather than by re-reading the plan's own corrected prose. The
fourth, Collapse 2 (the co-change miner's handling of `git log --numstat
-M`'s rename-collapsed output), is closed only for the plain `old => new`
rename shape; the brace-abbreviated shape — the exact form the fix's own
text names as an example it handles (`src/{utils => other}/c.txt`) — is not
actually expanded into real paths by the mechanism the fix supplies. Applying
the plan's own stated regex to that exact string, verified by direct
execution this session, produces two malformed strings, neither a real file
path, reproducing the identical "silent path corruption" shape round 8's own
collapse-hunt named as the most consequential defect class found on this
plan to date — because a mishandled rename does not throw, it silently
inserts or drops a garbled path in the co-change data feeding four of the
seven Phase A genres and Step 42's mission-critical exit-run measurement.
This round additionally found a second, independent gap in round 8's fix for
the `flock`(2) finding: the replacement mechanism (an atomic exclusive-create
lock file) is a real, correctly-described Node primitive, but the plan
specifies no release/unlink step and no staleness threshold anywhere, and no
test in §12 exercises the lock's acquire/release/staleness behavior at all
(T37-1/T37-2 test only SQLite busy-retry and fold serialization). Verified
by direct execution that `fs.closeSync` does not remove an `O_CREAT|O_EXCL`
lock file, this means the detached reindex's self-refresh mechanism would,
as literally specified, permanently stop refreshing after its first
successful run on every project — a silent regression in exactly the
freshness mechanism the lock exists to protect, introduced by round 8's own
fix (the original, incorrect `flock`(2) citation would have inherited
kernel-level auto-release-on-process-exit semantics for free; the
replacement primitive does not have that property, and nothing in the fix
accounts for the difference). Both new findings are delivered as Serious;
per the skill's mechanical rule, any Serious finding forces NEEDS FIXES.

---

## Upstream Contract Verification

**Spec §14 acceptance criteria.** No AC mapping is touched by either
finding — both are plan-original gaps internal to two implementation steps
(Step 20, Step 37), not changes to AC scope. Re-read spec §14 (lines
908–1131) this session; no regression in the AC↔T-ID mapping table.

**Architecture design decisions this task explicitly named for spot-check:**

| AD | What it decides | Verification method | Verdict |
|---|---|---|---|
| AD-2 | Runtime/store engine floor: Node ≥22.16.0, `node:sqlite` with FTS5 | Read `docs/architecture-phase-a.md:325–364` this session; compared against Step 2's `node:sqlite` citation | **Honored** — no regression |
| AD-3 | Repository identity resolver (commit/URL/path rule) | Read `docs/architecture-phase-a.md:366–415` this session; compared against Step 5's corrected algorithm; re-executed the three `git` scenarios directly | **Honored** — Collapse 1 genuinely closed |
| AD-5 | Global-store schema and fact routing, `tuning`'s WRITER designation | Spot-checked against Step 8/23's corrected seeding split | **Honored** — no regression |
| AD-9 | Question intake, recognizers, deny decision | Read `docs/architecture-phase-a.md:736–922` this session; compared against Steps 14/16/18/33 | **Honored** — no regression |
| AD-10 | Deny confinement: one producer, structurally | Read `docs/architecture-phase-a.md:924–946` this session; compared against Step 15/T15-2 | **Honored** — no regression |
| AD-13 | Co-change miner: `git log --no-merges --numstat -M`, hygiene filters, canonical pairs | Read `docs/architecture-phase-a.md:1043–1071` this session in full — mechanism-agnostic on rename handling (says nothing about `-M`'s output syntax); the plan's Step 20 is where rename-handling logic must live, and it is where Serious Finding 1 is found | **Architecture silent on the specific defect; the gap is plan-original, in the plan's own elaboration of AD-13** |
| AD-14 | The relevance bar | Read `docs/architecture-phase-a.md:1073–1128` this session; compared against Step 23/24's corrected sourcing text | **Honored** — no regression |
| AD-20 | `init`/`deinit` CLI spec | Read `docs/architecture-phase-a.md:1377–1412` this session; compared against Step 31 | **Honored** — no regression |
| AD-24 | Test/fixture architecture | Spot-checked against Step 40's body and §10A's "Test tier split" entry; T20-1/T37-1/T37-2's specs read directly (§12.1) — neither exercises the two new findings' failure modes | **Honored as a tier structure; the tier's own coverage has the gaps named in Serious Findings 1 and 2** |
| AD-25 | Packaging: two deps, no postinstall, no native code, `tsc` build | Read `docs/architecture-phase-a.md:1630–1648` in full this session | **Silent on both new findings' subject matter** — no transcription failure |
| AD-26 | Concurrency: WAL + busy_timeout + retry-once; directory lock (mechanism-agnostic) | Read `docs/architecture-phase-a.md:1650–1673` in full this session; grepped `flock`, `O_EXCL`, `unlink` across the whole architecture document — **0 hits for all three** | **AD-26's own text says only "the detached reindex takes a directory lock; the handler never waits on it" — mechanism-agnostic, and silent on release. Step 37's specific lock-file elaboration, and its missing release step, are both plan-original — the subject of Serious Finding 2** |

---

## Critical Findings

No Critical findings — the full inventory was Read or Grep-verified per
Compliance Gate B, and no violation of Critical classification was observed:
neither finding below breaks the build, fails a CI check, or halts an agent
the way round 7's `npm ci` finding did. Both are silent behavioral/data
defects bounded to specific subsystems (the co-change miner's touched-file
extraction; the detached reindex's self-refresh cadence), matching the
"silent, not self-revealing, but contained rather than build-breaking"
profile the skill's Critical/Serious boundary distinguishes.

---

## Serious Findings

### Serious Finding 1 — Step 20's rename-handling fix (round 8) correctly parses a plain `old => new` rename line but does not actually expand the brace-abbreviated form it names as its own worked example, silently corrupting the touched-file set for exactly the rename shape most common in real repository history

**What the plan says.** `docs/plans/plan-phase-a.md:1869–1878` (Step 20 —
Co-change miner, "What changes"): "for each `--numstat` line, if the third
(path) field matches `^(.*) => (.*)$` (a `-M`-detected rename, with or
without brace-abbreviated shared-prefix/suffix compaction, e.g.
`src/{utils => other}/c.txt`), expand the brace form if present into the
real old and new paths and add **both** to that commit's touched-file set;
otherwise the field is a plain path, added as-is."

**How this was verified — and found false as literally specified.**
Constructed a real repository in `/tmp/oracle_verify/full-repo/` and
exercised `git log --no-merges --numstat -M` against three commits: a pure
top-level rename (`git mv b.txt c.txt`) produced `0	0	b.txt => c.txt`; a
rename into a sibling subdirectory (`mkdir src/other && git mv
src/utils/e.txt src/other/e.txt`) produced the brace-abbreviated form
`0	0	src/{utils => other}/e.txt` — **the plan's own cited example,
character-for-character**. Applying the plan's own stated regex to that
exact string:

```
$ node -e 'console.log("src/{utils => other}/e.txt".match(/^(.*) => (.*)$/))'
[
  'src/{utils => other}/e.txt',
  'src/{utils',
  'other}/e.txt',
  ...
]
```

The capture groups are `"src/{utils"` and `"other}/e.txt"` — **neither is a
real file path.** The actual pre-rename path is `src/utils/e.txt`; the
actual post-rename path is `src/other/e.txt`. The regex's greedy `.*`
consumes up to the single ` => ` substring in the line and returns
everything before and after it verbatim, including the unmatched `{` and
`}` characters; it performs no brace detection, no prefix/suffix extraction,
and no reconstruction of the two real paths. The plan's prose asserts
"expand the brace form if present into the real old and new paths" as if
this were a consequence of the quoted regex, but the regex is the *entire*
mechanism the text supplies — no second regex, no brace-splitting algorithm,
and no worked-through example of the expansion appears anywhere else in the
document. Grepped `\{.*=>.*\}|brace` across the full 7073-line document — 3
hits, all inside this same passage's own three sentences, none supplying an
algorithm distinct from the one quoted above.

**Why this is not closure of round 8's Collapse 2, but a narrower reopening
of it.** Round 8's collapse-hunt demonstrated exactly this failure mode —
that `-M`'s rename-collapsed `--numstat` line is not a plain path — and
recommended: "Add explicit handling... A `--numstat` line whose third field
matches `^(.*) => (.*)$`... is parsed by expanding the brace form (if
present) into the real old and new paths." The fix pass implemented the
detection half of that recommendation (matching the line as a rename) but
not the expansion half for the brace sub-case, despite quoting the exact
brace example round 8's own collapse-hunt used. This is the identical defect
class recurring inside the fix that was supposed to close it — the same
shape collapse-log 2026-09-07's round-8 entry names as **silent, not
self-revealing**: an unhandled brace-abbreviated rename does not throw. It
either (a) inserts the garbled compound string `"src/{utils"` /
`"other}/e.txt"` as a literal "file path" into the touched-file set, which
then either matches no row in the `files` table (so the file becomes
invisibly absent from every co-change pair the commit would otherwise
contribute to) or, if an implementer's insertion path is permissive, creates
a spurious `files` row for a path that resolves to nothing on disk; or (b) if
an implementer's extraction rejects non-matching strings, silently drops
both the pre- and post-rename identity from that commit's touched-file set
entirely. Either failure mode degrades Coupling, Consequence, Completeness,
and Warning genre evidence (Step 20's own "Impact if wrong" field) for every
commit containing a directory-level rename or move — arguably the *more*
common real-world shape than a bare same-directory rename, since most
non-trivial refactors move files between directories (exactly what triggers
git's brace-abbreviation compaction in the first place).

**Why this would not be caught by the plan's own test suite.** `T20-1`'s
own fixture data (`docs/plans/plan-phase-a.md:4954–4961`) names "1 commit
containing a git-detected file rename (partway through the planted coupling
history)" with no brace-abbreviated sub-case specified. The simplest
deterministic construction of "a git-detected file rename" — a same-directory
`git mv` — produces the plain, non-brace form, which the plan's regex *does*
handle correctly; the brace form only appears for a rename that also changes
directory. Unless the fixture generator specifically constructs a
cross-directory rename, `T20-1` would pass while this defect ships
unexercised into Step 42's real-repo exit run — precisely the scenario
round 8's own collapse-hunt described for the original finding: "no fixture
catching it first... would first surface, silently, in Step 42's real-repo
exit run, on repositories that... inevitably contain real rename history."

**What correct disposition looks like.** Replace the single regex with a
two-step detector: first check for the brace-abbreviated form specifically,
e.g. `^(.*)\{(.*) => (.*)\}(.*)$` — if it matches, the real old path is
`prefix + oldPart + suffix` and the real new path is `prefix + newPart +
suffix` (both `prefix` and `suffix` may be empty strings, covering a rename
with no shared prefix or no shared suffix); only if that does *not* match,
fall back to the plain-rename regex `^(.*) => (.*)$` for the non-brace case.
Update Step 20's "What changes" with this two-step algorithm explicitly
(not merely "expand the brace form if present," which names the requirement
without supplying the mechanism), and add a cross-directory rename scenario
to `T20-1`'s fixture data (a file moved from one directory to a sibling
directory, which git's own rename-compaction logic will render in
brace-abbreviated form) so the fix is actually exercised by the plan's own
acceptance test rather than left to the exit run to discover the gap a
second time.

**Silent or self-revealing.** Silent — matches collapse-log 2026-09-07's
round-8 entry's own framing exactly: "a mishandled rename does not throw —
it generates a malformed 'file path' that gets silently absorbed or dropped,
corrupting the co-change signal... with no diagnostic, no crash."

---

### Serious Finding 2 — Step 37's replacement lock mechanism (round 8's fix for the retracted `flock`(2) citation) specifies no release step and no staleness threshold, and no test in §12 exercises the lock's acquire/release/staleness behavior at all — as literally specified, the detached reindex's self-refresh mechanism would permanently stop refreshing after its first successful run

**What the plan says.** `docs/plans/plan-phase-a.md:2893–2907` (Step 37 —
Concurrency, "In `src/index/indexer.ts` (Step 21)" bullet): "The detached
reindex takes a directory lock via an atomic exclusive-create lock file —
`fs.open(lockPath, fs.constants.O_CREAT | fs.constants.O_EXCL |
fs.constants.O_WRONLY)` on `<home>/projects/<key>/.reindex.lock`, throwing
`EEXIST` if another process already holds it, with an mtime/PID staleness
check so a crashed process's stale lock does not permanently block future
reindex attempts... The lock is advisory, not kernel-enforced, which is
sufficient here since the handler never waits on it (staleness merely
lowers confidence)." This is the plan's only description of the lock's
lifecycle — nowhere in the document (grepped `unlink|release.*lock|lock.*release|reindex`
across the full 7073 lines — the only hits outside this passage are line 766,
Step 2.5's justification for its own early placement, and line 4374, the
§11.4 claims-registry entry logging the `flock` correction, neither
describing a release step) is there any instruction for removing the lock
file after a successful reindex, nor any stated threshold (a duration, an
mtime delta) for what "stale" means to the "mtime/PID staleness check" the
same sentence promises.

**How this was verified — and found incomplete, by direct execution.**
Executed the exact primitive against Node v22.22.2 in `/tmp/oracle_verify/`:

```
$ node -e "
const fs = require('node:fs');
const p = '/tmp/oracle_verify/.reindex.lock';
const fd1 = fs.openSync(p, fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_WRONLY);
fs.closeSync(fd1);
console.log('lock file still present after close?', fs.existsSync(p));
"
lock file still present after close? true
```

`fs.closeSync` releases the file descriptor but does not delete the file —
this is standard POSIX `open`/`close` semantics and is not itself a
surprising fact, but the plan's prior (incorrect) `flock`(2) citation
happened to inherit a property this replacement primitive does not have:
`flock(2)`'s advisory lock is released automatically by the kernel when the
holding process closes the file descriptor or exits, with no explicit
release call required. An `O_CREAT | O_EXCL` lock **file** has no such
kernel-mediated release — the file persists on disk until something
explicitly unlinks it. Round 8's fix correctly identified that `node:fs`
exposes no `flock(2)` wrapper and correctly substituted a real, working
Node primitive for the *acquisition* half of the mechanism, but did not
carry forward the behavioral property the original (wrong) primitive would
have provided "for free" — and nothing in the fix's text, nor anywhere else
in the plan, supplies the missing release logic to compensate.

**Why this is load-bearing, not decorative.** Step 21's `refreshIfStale`
(`docs/plans/plan-phase-a.md:1954–1959`) is the *only* caller of this lock:
it is invoked whenever `schema_meta.index_head` drifts from `git rev-parse
HEAD` — i.e., on essentially every session where the repository has new
commits since the last index — and spawns a detached reindex child that
takes the lock before reindexing. Under the current text:
1. The first time `refreshIfStale` fires, the detached child acquires the
   lock (`O_CREAT|O_EXCL` succeeds), reindexes, and exits — with the lock
   file still on disk, since nothing removes it.
2. Every subsequent time `refreshIfStale` fires (the next session with new
   commits, and every one after that), the detached child's own
   lock-acquisition attempt hits `EEXIST` immediately, because the file
   from step 1 is still there.
3. The plan promises an "mtime/PID staleness check" that would let a
   *crashed* process's stale lock eventually be reclaimed — but that
   check's threshold and algorithm are never specified, and even if an
   implementer invents a reasonable one (e.g., "older than N minutes"), a
   lock file from a process that exited *successfully* a week ago is
   indistinguishable, under an mtime-only check, from one abandoned by a
   crash a week ago — the plan gives no way to tell "the previous run
   finished cleanly, remove me" from "the previous run is still running or
   crashed," which is precisely the distinction a release-on-success step
   would make trivial and unambiguous.
4. `manual `ctxoracle index`` (Step 32) calls `runIndex` directly, bypassing
   this lock entirely (confirmed: `docs/plans/plan-phase-a.md:2629–2631`
   names no lock interaction for the `index` verb) — so a manual reindex
   always works. Only the *automatic* self-refresh path is affected. But
   that automatic path is the mechanism `AD-12`'s "staleness merely lowers
   confidence" design depends on to keep the index fresh without the owner
   having to remember to run anything — and under the plan's own text, it
   would silently and permanently stop functioning after the very first
   time it ever ran successfully, on every project the tool is installed
   in.

**Why no test catches this.** `T37-1`/`T37-2`
(`docs/plans/plan-phase-a.md:5117–5144`) — Step 37's only cited
verification — test SQLite `SQLITE_BUSY` retry-once behavior and
`whisper_stats` fold serialization respectively; neither touches the
directory lock file at all. `T21-1`/`T21-2`
(`docs/plans/plan-phase-a.md:4972–5011`) test the indexer's symbol/import
population and that `refreshIfStale` calls `oracleSpawn` rather than
`child_process.spawn` directly — a structural check on *which function* is
called, not on what that function's target (the lock acquisition/release)
actually does. No fault code exists for "reindex lock could not be
acquired" or "reindex lock appears stuck" either (grepped the full
`FaultCode` enumeration at Step 6, lines 1028–1039 — `index_stale` is the
closest named code, but nothing in the plan connects it to this failure
mode) — so even the silent stall this defect would cause has no
self-observability path per `AD-17`'s own "the oracle must watch itself"
mandate, which `CLAUDE.md`'s OL-10 ("it could fail a hundred ways in front
of me and I wouldn't know") specifically exists to prevent.

**What correct disposition looks like.** Specify the release explicitly:
after the detached reindex completes (success or failure — a `finally`
block or equivalent), unlink the lock file via `fs.unlinkSync(lockPath)`
before the process exits, so the common case (clean completion) never
relies on the staleness check at all. Specify the staleness threshold as a
concrete, named value (e.g., a `tuning` key, following the pattern already
established for `bar.confidence_floor` etc.), and specify the staleness
check's actual algorithm (e.g., "if the lock file's mtime is older than
`tuning.reindex_lock_stale_ms` and the PID recorded inside it is not a
running process, unlink it and retry acquisition once"). Add a unit test
(alongside `T37-1`/`T37-2`, or as a new `T21-3`) that exercises: (a) a
completed reindex leaves no lock file behind; (b) a lock file from a dead
PID older than the threshold is reclaimed by the next `refreshIfStale`
attempt; (c) a lock file from a live, still-running detached reindex is
*not* reclaimed. Log the corrected mechanism in §11.4 alongside the
existing `flock`/`node:fs` entry so this class of gap is checked at future
fix-pass time rather than surviving unlogged for a tenth round.

**Silent or self-revealing.** Silent — the detached reindex fails-open by
design (`AD-26`'s posture generally), so a stuck lock produces no crash, no
error, and no diagnostic under the plan's current text; the only observable
symptom is that the index quietly stops updating itself, which an owner
with `OL-11`'s "non-programmer by design" profile has no way to notice
without already suspecting staleness and manually re-running `ctxoracle
index`.

No other Serious findings — the full inventory was Read or Grep-verified
per Compliance Gate B beyond the two above, and no other violation of
Critical or Serious classification was observed.

---

## Systemic Patterns

**Proactive scan run before classifying.** Both findings above share a
narrative shape with round 6/7/8's four prior instances (the `semver`
claim, the `SqliteError` citation, the `node:test`/TypeScript claim, and
round 8's own `flock`(2) citation): a fix or an original claim about a
"familiar enough to not check" mechanism turns out incomplete or false when
actually executed. Checked whether this round's two instances, plus the
prior four, constitute a grep-expressible Systemic pattern before
classifying:

- **Common shape, still not a common grep signature.** As round 8's own
  expert-review found for its own two instances, the six cumulative
  instances (semver, SqliteError, node:test/TS-stripping, flock,
  brace-rename-expansion, lock-release) involve six different
  tools/mechanisms with no shared textual signature a single grep query
  could enumerate. This round's two instances are additionally different
  from the prior four in kind: the prior four were each a **false factual
  claim** about a library/tool's behavior; this round's two are each an
  **incomplete mechanism** — a fix that correctly identifies and partially
  implements the right primitive but does not carry its behavior through to
  full closure of the scenario it claims to close. Decomposed into "every
  step's own fix-pass annotation claiming to close a prior round's finding,
  checked by re-deriving the finding's original scenario against the fix's
  literal text rather than trusting the annotation" — the same
  decomposition round 8 used for its citation-registry enumeration, applied
  here to fix-closure claims specifically rather than fresh claims.
- **Enumeration attempted this round.** Grepped `corrected this fix pass`
  and `Added this fix pass` across the full document — 47 hits total
  (spanning all eight fix-pass rounds' annotations). Of the two originating
  in round 8 specifically (the Step 20 rename fix and the Step 37 lock
  fix), both were checked by reconstructing the exact scenario each fix's
  own text claims to close and executing against it; both other round-8
  fix-annotations (D-plan-3's TS-stripping rewrite, the two new §11.4
  entries) were also checked (Scope 1, above) and hold.
- **Conclusion: no new textual Systemic finding is delivered this round.**
  Two instances from one round's fix-diff, of a shape (incomplete-fix
  rather than false-claim) distinct enough from the prior four that folding
  them into a single "unverified claims" Systemic label would blur two
  different failure modes worth tracking separately. Both are delivered as
  Serious findings above. The cross-round methodological observation — five
  consecutive rounds (6, 7, 8, 9 in two ways) each finding at least one
  instance of "a fix-pass annotation claiming closure that does not survive
  independent re-execution of the exact scenario the original finding
  named" — is recorded in Recommended Priority below as a collapse-log
  candidate, consistent with round 8's own handling of an analogous
  cross-round pattern.

No other systemic patterns beyond those already tracked and closed in prior
rounds — verified by the scans above plus the full read of §1–§16 described
in Scope 2.

---

## Moderate & Minor Findings

No Moderate or Minor findings — verified by the full read of §1–§16, the
T-ID cross-checks in §12.1–§12.5, and the targeted grep scans described in
Scope 2 and Systemic Patterns above. Every citation-drift class rounds 2–8
found (step-number misattribution, stale collapse-test fields, malformed
table rows, duplicated paragraphs) was re-checked at its previously-fixed
site and found to still be fixed; no new instance of any of those specific
defect classes was found anywhere in this round's full read.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per
Compliance Gate B, including both new findings' tool-behavior claims, which
were resolved (not left tentative) by directly executing the exact scenario
each claim describes: the plan's own stated regex against the plan's own
cited brace-abbreviated example string (Serious Finding 1), and
`fs.closeSync`'s actual effect (or lack of one) on an `O_CREAT|O_EXCL` lock
file (Serious Finding 2).

---

## What's Actually Good

- **Round 8's Collapse 1 fix (Step 5's repo-key algorithm) is a genuinely
  correct, fully-general fix, not merely a fix for the one scenario round 8
  happened to test.** Re-executing all three of the algorithm's git
  invocations against all three constructed repository states (non-git,
  bare, full-history) this session — a fresh construction, not a rerun of
  round 8's own transcript — produced results matching the algorithm's
  stated routing in every case, including the specific boundary (bare-repo
  success vs. no-git failure) round 8's own finding turned on. **Verified
  by:** direct execution, this session (Scope 1, Collapse 1). **Standard:**
  the same execute-don't-assume discipline this review applies to its own
  new findings, applied here as a positive finding because the fix survives
  a genuinely independent re-derivation rather than a re-read.
- **Round 8's Moderate Finding 1 fix (the TypeScript type-stripping
  version boundary) states the precise, dual-layered correct reason a
  compile step is needed — not just the corrected fact, but the
  independent, version-agnostic reason (`const enum`) that makes the
  practical engineering conclusion robust to which exact sub-version an
  implementer's Node happens to be.** Re-executed both the plain-`.ts`
  zero-flag case and the `const enum` rejection case this session,
  independently, and both match the plan's stated reasoning exactly.
  **Verified by:** direct execution, this session (Scope 1, Moderate
  Finding closure). **Standard:** the same discipline, applied as a
  positive finding because the fix is not merely factually corrected but
  reasoned to a conclusion that no longer depends on the corrected fact
  being exactly right.
- **The `node:fs` lock-surface claim and its §11.4 entry are accurate and
  correctly scoped** — the plan's corrected text does not overclaim that
  `O_CREAT|O_EXCL` is equivalent to `flock(2)`; it explicitly states "the
  lock is advisory, not kernel-enforced," which is true and is the right
  level of honesty about the primitive's actual guarantee. **Verified by:**
  direct execution confirming both the primitive's real behavior (EEXIST on
  contention) and its real limitation (no auto-release) this session.
  **Standard:** `expert-review`'s library-behavior-claim rule, met for the
  acquisition half of the mechanism even though the release half is
  incomplete (Serious Finding 2) — the claim that *is* made is not
  overstated.

---

## Recommended Priority

1. **Serious Finding 1 (Step 20's brace-abbreviated rename gap).** Fix
   before Step 42's exit run — this is the same mission-critical co-change
   miner round 8 already flagged as the highest-consequence component on
   this plan, and the specific gap is more likely to trigger on real repos
   (directory-crossing renames) than the already-fixed plain-rename case.
   The fix is small (a second regex plus prefix/suffix reconstruction) and
   should ship with a cross-directory rename fixture added to `T20-1`.
2. **Serious Finding 2 (Step 37's missing lock-release logic).** Fix before
   Step 21/37 are implemented — an implementer following the plan literally
   would ship a self-refresh mechanism that works exactly once per project
   and then silently stops, with no diagnostic. The fix is a `finally`-block
   unlink plus a named staleness threshold and a small new unit test.
3. **Log both in §11.4** as part of either fix, per the plan's own stated
   discipline, and add one collapse-log entry generalizing the pattern this
   round found across both: **a fix-pass annotation claiming a prior
   finding is "corrected" is itself an unverified claim until the exact
   scenario the original finding named is re-executed against the fix's
   literal text** — not merely re-read for plausibility. This is a sharper,
   fix-diff-specific version of the execute-don't-assume lesson rounds 6–8
   already generalized for fresh claims; round 9 shows it applies with equal
   force to a round's own closure claims about itself.

---

## Verdict

Verdict: NEEDS FIXES (2 findings: 2 Serious)
