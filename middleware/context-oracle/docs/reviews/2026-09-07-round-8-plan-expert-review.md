# Expert review (round 8, re-review) — `docs/plans/plan-phase-a.md`

**Date:** 2026-09-07
**Reviewer:** fresh independent `/expert-review` pass; not the plan-writer, not
the author of any of the fourteen prior review documents on this artifact, no
prior context on this session.
**Artifact:** `/home/user/agent-armory/middleware/context-oracle/docs/plans/plan-phase-a.md`
at its current state on branch `claude/plan-correction-strategy-57ot28` —
commit `d74e529` ("context-oracle: fix round-7 collapse-hunt and
expert-review findings"), confirmed via `git log --oneline -5` this session;
6973 lines, read end to end this session across sequential `Read` calls with
no gaps (offsets 1–400, 401–620, 620–719, 719–768, 753–1152, 1153–1552,
1553–1952, 1953–2352, 2353–2752, 2753–3152, 3153–3382, 3383–3632, 3633–4032,
4033–4312, 4313–4612, 4613–5012, 5013–5412, 5413–5812, 5813–6212, 6213–6612,
6613–6973 — plus targeted re-reads of specific line ranges named below),
per the Re-Review Protocol in
`middleware/context-oracle/.claude/commands/expert-review.md` (the
project-scoped copy, read first, in full).
**Round:** 8 (re-review of round 7's collapse-hunt fix and round 7's
expert-review fix, both landed in the single commit `d74e529`). Rounds 1–7
history: round 1, 10 findings; round 2, 9 findings (1 Systemic × 7 + 2
Serious + 1 Moderate); round 3, NEEDS FIXES (1 Systemic × 2 + 2 Moderate + 1
Minor) plus a companion collapse-hunt (2 collapses + 2 partials); round 4,
NEEDS FIXES (1 Systemic × 2) plus a companion collapse-hunt (2 collapses);
round 5, NEEDS FIXES (1 Systemic × 2 at 6 sites + 1 Minor) plus a companion
collapse-hunt (2 collapses, one incomplete); round 6, NEEDS FIXES (2
Moderate + 2 Minor) plus a companion collapse-hunt (1 collapse); round 7,
NEEDS FIXES (1 Critical + 1 Moderate) plus a companion collapse-hunt (1
collapse + 3 Minor). **This round independently re-verifies every round-7
finding as genuinely closed against current source — including re-executing
the `npm ci`/lockfile scenario and the `node:sqlite` error-shape claim
myself, in a fresh scratch directory, rather than trusting the plan's or
STATUS.md's restatement of round 7's result — and, per this round's explicit
brief to generalize the library-behavior-verification method rather than
stop at round 7's specific claims, finds two new defects of the same class
neither of the first seven rounds caught: one Moderate, one Serious.**

---

## Scope and Inventory

### Tool-plan disclosure

`ToolSearch` for CodeGraph/Clear Thought was not re-invoked this round —
consistent with every prior round's disposition (§15 Q-gap-1/Q-gap-2 in the
plan itself), this round's task is scoped to verifying textual/structural
claims and tool/library-behavior claims about a Markdown planning document,
and no finding below depends on either tool. Every claim below is verified
by Read (file:line, this session), Grep (query + result count, this
session), or a direct executable check (Node v22.22.2, npm 10.9.7, and the
`semver` npm package, all run fresh this session in scratch directories
under this session's own scratchpad, none reused from any prior round's
transcript) — never memory, never trust in a prior review's or the plan's
own attestation.

### Scope 1 — Round 7's finding-groups, as closure items

- [x] **Round-7 expert-review Critical Finding 1 (Step 1 specifies `npm ci`
  with no `package-lock.json` ever created; unconditional build failure).**
  Read current lines 632–695 (Step 1's full body): "What changes" now reads
  "Run `npm install` once against this `package.json` and commit the
  resulting `package-lock.json` alongside it — added this fix pass, round 7
  (expert-review Critical finding): `npm ci` (used below and by `T1-1`)
  refuses to run at all without a pre-existing lockfile (`npm error code
  EUSAGE`, verified this fix pass by direct execution)…"; the Verification
  field now reads "`package-lock.json` present, committed in this step"; the
  Impact-if-wrong field is updated to reference the lockfile precondition.
  §5.1's file skeleton (line 283) now lists `package-lock.json # Step 1 —
  npm-generated, not hand-authored…`. `T1-1`'s own §12 spec (lines
  4408–4413) now lists the lockfile in its Data field. **Independently
  re-executed the underlying claim myself, from scratch, in a directory this
  session created** (`/tmp/.../scratchpad/npmci_nolock`, `npm` 10.9.7, `node`
  v22.22.2 — the same runtime family the plan targets): (a) with only a
  `package.json` naming `web-tree-sitter`/`tree-sitter-wasms` as
  dependencies and no lockfile, `npm ci` fails immediately with `npm error
  code EUSAGE … The npm ci command can only install with an existing
  package-lock.json…`, exit code 1 — reproducing round 7's finding exactly;
  (b) after running `npm install` once (which both installs the two
  dependencies and writes `package-lock.json`, `lockfileVersion: 3`,
  confirmed by parsing the generated file), re-running `npm ci` from a clean
  `node_modules` succeeds (`added 2 packages…`, exit code 0) — confirming
  the fix's mechanism is correct, not merely present in prose. **Closed, and
  independently reproduced in both directions (fails without the lockfile,
  succeeds with it), not merely re-read.**
- [x] **Round-7 expert-review Moderate Finding 1 (D-plan-2's §10 heading
  labeled `web-tree-sitter@0.26.13` "(exact)", contradicting Step 1's own
  caret range and D-plan-2's own §10A collapse-test).** Read current lines
  3387–3401 (§10, D-plan-2): "`web-tree-sitter@^0.26.13` (caret floor,
  locked to the `0.26.x` line), `tree-sitter-wasms@0.1.13` (exact) —
  corrected this fix pass, round 7: previously labeled `web-tree-sitter`
  "(exact)" here, contradicting Step 1's own `package.json` (a caret range)
  and this same entry's own round-6-corrected collapse-test below…". Read
  §14.1 Q1's current text (lines 6163–6173): "Both packages fixed to their
  architecture-verified versions (`web-tree-sitter` via a caret floor locked
  to `0.26.x`; `tree-sitter-wasms` via an exact pin) — corrected this fix
  pass, round 7: previously said "pinned," ambiguous with an exact pin for
  both" — the softened secondary echo round 7 also promised is present.
  Grep-confirmed `web-tree-sitter.{0,40}\(exact\)|\(exact\).{0,40}web-tree-sitter`
  — **0 hits** in the current document (the defect pattern is gone). **Closed.**
- [x] **Round-7 collapse-hunt Collapse 1 (Step 2 cited a `SqliteError` class
  `node:sqlite` does not export).** Read current lines 700–726 (Step 2's
  "The authoritative standard" bullet): "Node's official `node:sqlite`
  documentation and direct runtime verification (Node v22.22.2)… a
  statement-execution failure throws a plain `Error` instance carrying
  `code: 'ERR_SQLITE_ERROR'` and `errcode`/`errstr` properties;
  `node:sqlite` exports no distinct `SqliteError` class (previously claimed
  here, false — see §11.4 for the verification entry)." Read §11.4's new
  entry (lines 4299–4312), which quotes the exact runtime evidence and the
  official-docs corroboration. Grep-confirmed `SqliteError` — **1 hit**
  total in the whole document (this corrected sentence's own reference to
  the false prior claim; no live re-assertion of the class name). **Directly
  re-verified the underlying claim myself, independently, in this session's
  own sandbox** (not reusing round 7's transcript): `node -e
  "console.log(Object.keys(require('node:sqlite')))"` → `[ 'DatabaseSync',
  'StatementSync', 'constants', 'backup' ]` — no `SqliteError`; then forced a
  real statement failure (`CREATE TABLE t(x)` twice on the same
  `:memory:` database) and caught the thrown object: `constructor.name ===
  'Error'`, `code === 'ERR_SQLITE_ERROR'` — matching the plan's corrected
  text exactly. **Closed, and independently reproduced.**
- [x] **Round-7 collapse-hunt Minor Finding 1 (three file-skeleton entries —
  `hash.ts`, `events.ts`, `verdict.ts` — missing the standard `# Step N`
  construction attribution).** Read current lines 373–385 (§5.1): `events.ts`
  now reads `# Step 28 — internal event type (adapter.ts's output type),
  attribution added this fix pass, round 7`; `verdict.ts` (under `types/`)
  now reads `# Step 15 — response shape…, attribution added this fix pass,
  round 7`; `hash.ts` now reads `# Step 5 — SHA-256 helpers, attribution
  added this fix pass, round 7 (previously "Step 5 uses," a usage note, not
  a construction attribution)`. All three now match the skeleton's
  100%-attribution convention. **Closed.**
- [x] **Round-7 collapse-hunt Minor Finding 2 (same defect as the
  expert-review's Moderate Finding 1 above — the D-plan-2 "(exact)" heading
  — flagged independently by the collapse-hunt pass).** Confirmed fixed by
  the same evidence as the expert-review closure item above; round 7's own
  collapse-hunt document notes this is "already fixed by this round's
  expert-review pass," so this is one fix closing two independently-raised
  findings, not two separate live defects. **Closed.**
- [x] **Round-7 collapse-hunt Minor Finding 3 (§12.5's AC→T-ID table had a
  malformed four-cell row for AC-21).** Read current line 5977: `| AC-21
  (full) | T29-2 (guard mechanism only) | A/B (guard: A; full exercise: B,
  deferred) |` — exactly three cells (`AC`, `T-ID(s)`, `Phase`), matching
  every other row in the table. Grep-confirmed no row in the current
  `## 12.5` table (lines 5940–5981, all 26 rows read directly) has more than
  two `|` separators. **Closed.**

**Scope 1 result: every round-7 finding (both from the concurrent
collapse-hunt and the expert-review, six items total including the
one-fix-closes-two case) is genuinely closed against current source,
verified this round by independent Read, Grep, and — for the `npm ci` and
`node:sqlite` claims specifically — independent live re-execution in fresh
scratch directories, not a re-read of round 7's own transcript.**

### Scope 2 — Full-document regression scan (fix-diff plus full read)

**Fix-diff** (`git diff 048aec8 d74e529 -- middleware/context-oracle/docs/plans/plan-phase-a.md`,
86 lines, read in full this session before touching the plan): confirms the
diff is exactly the six Scope-1 closure items above — no other plan content
changed between round 6's and round 7's commits. `docs/STATUS.md` (round-7
additions) and `docs/collapse-log.md` (round-7 entry) were also read in
full. The two round-7 review documents themselves,
`docs/reviews/2026-09-07-round-7-plan-collapse-hunt.md` (641 lines) and
`2026-09-07-round-7-plan-expert-review.md` (663 lines), were read in full
before touching the plan.

- [x] Front matter + §1 Goal + §2.1/2.2 Scope + §2.3 coverage table + §2.4
  (lines 1–258) — Read in full. Every step citation in the §2.3 table
  cross-checked against each named step's own heading; no regression from
  round 4–6's fixes.
- [x] §3 Standards registry (lines 179–244) — Read in full. The
  web-tree-sitter "0.26.13 for `web-tree-sitter`… pins 0.1.13 for
  `tree-sitter-wasms`" floors/pins distinction (lines 207–209) still holds
  and is now consistent with D-plan-2's corrected §10 heading (Scope 1). No
  defect.
- [x] §4/§5/§5.1–§5.5 (lines 245–578) — Read in full, every file-skeleton
  entry's `# Step N` comment cross-checked against its constructing step's
  own heading, including the three round-7-fixed entries (Scope 1) and the
  new `package-lock.json` line. No new defect in the skeleton itself.
- [x] §6, §8 (lines 579–618) — Read in full. No defect.
- [x] §7 Steps 1–43 + Step 2.5, every step body in full (lines 619–3291,
  read across nine sequential `Read` calls with no gaps, plus two additional
  targeted reads of Step 1/Step 2's exact current text) — cross-checked
  every `Step N` cross-reference against the step's own construction target
  using an independently-built step→topic map. **This pass is where the two
  new findings below originate:** Step 1's "What changes" (lines 652–655)
  states a blanket claim about Node's `node:test`/TypeScript capability that
  is false for part of the plan's own stated Node version floor (Moderate
  Finding 1, below); Step 37's concurrency body (lines 2856–2860) names a
  system call (`flock`(2)) that has no Node.js core API surface at all
  (Serious Finding 1, below). No other new step-citation, cross-reference,
  or file-path defect found across all 43 steps + Step 2.5.
- [x] §9 Checkpoints (lines 3292–3330) — Read in full. No defect.
- [x] §10 Decisions D-plan-1..8 (lines 3332–3505) — Read in full. D-plan-2's
  heading is now internally consistent (Scope 1). No new defect.
- [x] §10A collapse-tests, every D-plan-* and N1–N6 entry in full (lines
  3506–4079) — Read in full. **D-plan-3's own collapse-test (lines
  3619–3653) is the second site of Moderate Finding 1** (its "Answer" field
  restates the same Node-version-blind claim Step 1 states, in the exact
  document section — §10A — whose stated job is to survive a harder
  question than the inline Gate-3 rationale posed; this round is that
  harder question). No other stale field found in any other §10A entry;
  every D-plan-* and N1–N6 entry's four fields are internally consistent
  with each other and with the current step bodies they describe.
- [x] §11.1–§11.6 (lines 4080–4372) — Read in full. Every V-claim's quoted
  text spot-checked against `docs/architecture-phase-a.md`'s V1–V19 table.
  T32-2's `VACUUM INTO` citation (lines 5703–5712, cross-referenced) remains
  a positive exemplar of the discipline the two new findings below violate.
  **Neither new finding has a §11 entry** — like round 7's `SqliteError`
  finding before it, both are plan-original claims never logged in the
  registry whose stated job is "every factual claim this plan asserts."
- [x] §12.1 Unit tier, T1-1 through T43-1 (lines 4373–5091) — Read in full,
  cross-checked each `Verifies`/`File` field against the step it names and
  §5.1's file skeleton. T1-1's own Data field (lines 4408–4413) confirmed to
  now list the lockfile (Scope 1). No new defect.
- [x] §12.2–§12.4, T16-1 through T40-6 (lines 5092–5931) — Read in full,
  including T40-4 (AC-20)'s cold-container check and T40's grammar-inventory
  build-time check (Step 40, `npm pack --dry-run`) — **independently
  executed this session** (see Tentative/verification note below; no
  defect found). No new defect.
- [x] §12.5 Coverage attestation, both mapping tables (lines 5932–6037) —
  Read in full; every AC→T-ID row and every Step→T-ID row cross-checked. The
  AC-21 row's cell count confirmed correct (Scope 1). No new defect.
- [x] §13 Risks R1–R10 (lines 6040–6152) — Read in full; each mitigation's
  step citation cross-checked against the named step's actual content. No
  risk entry discloses either new defect below — confirming both are
  undisclosed gaps, not already-accepted residuals.
- [x] §14.1 Bin 1 (lines 6161–6264), §14.2 Bin 2 (lines 6266–6315), §14.3
  Bin 3 (lines 6317–6367), §14.4 Reconciliation sweep (lines 6369–6532) —
  all Read in full. Q1's corrected disposition confirmed (Scope 1). No new
  defect.
- [x] §15 Gaps acknowledged, Q-gap-1 through Q-gap-6 in full (lines
  6536–6901) — Read in full. No new defect.
- [x] §16 Post-completion (lines 6905–6973, end of document) — Read in
  full. No defect.
- [x] `docs/reviews/2026-09-07-round-7-plan-collapse-hunt.md` (641 lines)
  and `2026-09-07-round-7-plan-expert-review.md` (663 lines) — both Read in
  full, first, before touching the plan.
- [x] `docs/specs/spec-context-oracle.md` §14 (lines 908–1067, read this
  session) — re-read; neither new finding changes AC scope.
- [x] `docs/architecture-phase-a.md` AD-2 (325–364), AD-3 (366–645
  spot-checked), AD-9 (736–922), AD-10 (924–946), AD-14 (1073–1128), AD-20
  (1377–1412), AD-24 (1513–1628 spot-checked), AD-25 (1630–1648), AD-26
  (1650–1673) — all Read in full or spot-checked this session, per the
  task's explicit list. **Grepped `flock` and `strip-types`/`type strip`
  across the entire architecture document — 0 hits for either** — both new
  findings below are plan-original elaborations, not transcriptions of an
  architecture premise that already addressed the gap. See Upstream
  Contract Verification table below.
- [x] `docs/STATUS.md` (current, post-round-7) — Read in full.
- [x] `OWNER-LEDGER.md` (81 lines) — Read in full.
- [x] `docs/collapse-log.md` — all 2026-09-07 entries (through the round-7
  entry) — Read in full for the in-scope portion; older entries (2026-07
  through 2026-08) sampled for pattern-history context per the command's own
  historical-trajectory instruction.
- [x] `middleware/context-oracle/CLAUDE.md` — Read in full.
- [x] `middleware/context-oracle/.claude/commands/expert-review.md` (226
  lines) — Read in full, first.
- [x] `npm ci` / `npm install` (npm 10.9.7, bundled with this container's
  Node v22.22.2) — run directly in a fresh scratch directory, both without
  and with a lockfile present (Scope 1).
- [x] `node:sqlite`'s exported surface and thrown-error shape — run directly
  against Node v22.22.2 in this sandbox (Scope 1).
- [x] **`node --test` and plain `node` against a raw `.ts` file, and against
  a `.ts` file containing a `const enum`** — run directly against Node
  v22.22.2 in this sandbox, in a fresh scratch directory (new — see Moderate
  Finding 1).
- [x] **`node:fs`'s exported surface for lock-related functions and
  constants** — run directly against Node v22.22.2 in this sandbox (new —
  see Serious Finding 1).
- [x] `WebFetch https://nodejs.org/api/typescript.html` — fetched this
  session to independently corroborate the Node-version boundary for
  type-stripping's default-on behavior and its enum limitation (new — see
  Moderate Finding 1).
- [x] `npm pack --dry-run` against an actually-installed `tree-sitter-wasms@0.1.13`
  — run directly this session in a fresh scratch directory, per round 7's
  own collapse-hunt closing suggestion to execute this specific command
  next. **Result: no defect.** The command, run from inside the installed
  package's own directory, lists all 36 `out/*.wasm` grammar files plus
  `package.json`/`LICENSE`/`README.md`, confirming Step 40's L6
  grammar-inventory check's premise is sound; `--dry-run` is confirmed
  non-destructive (no tarball file written to disk).

**Rigor waivers:** none. **Instrument unavailability:** CodeGraph/Clear
Thought were not re-invoked this round; disclosed, non-gating, per every
prior round's disposition, unchanged this round because no finding this
round depends on either tool.

---

## Summary

**This review returns NEEDS FIXES.** Every finding from round 7's
collapse-hunt and expert-review — the `npm ci`/`package-lock.json` Critical
finding, the D-plan-2 "(exact)" Moderate/Minor finding (one fix closing both
independently-raised instances), the `node:sqlite`/`SqliteError` collapse,
and the three file-skeleton-attribution Minor findings — is genuinely
closed against current source, independently re-verified this round by
direct execution rather than by trusting the plan's or STATUS.md's
restatement. Continuing this round's brief to generalize Gate B's
library-behavior-claim rule across the rest of the document (per round 6's
and round 7's own "verify a familiar mechanism by execution" method,
applied by round 6 to `semver` and by round 7 to `node:sqlite`), this round
found the same defect class recurring at two more sites neither of the
first seven rounds caught: (1) Step 1 and D-plan-3's collapse-test both
assert, as a blanket fact, that "Node 22.16.0's `node:test` cannot execute
`.ts` source directly" without an experimental flag — verified false for
part of the plan's own stated version floor (`engines: ">=22.16.0"`): Node
made TypeScript type stripping enabled by default, unflagged, starting at
v22.18.0 (confirmed via direct execution against this sandbox's Node
v22.22.2 and corroborated by Node's own official docs), so a `.ts` file
containing only erasable type syntax runs directly with zero flags on any
Node in the `>=22.18.0` sub-range the plan's own floor includes. The plan's
chosen fix (a real `tsc` compile step to `dist-test/`) remains necessary
for an independent, never-stated reason — Step 6's own `const enum
FaultCode` requires actual code transformation, which even default-on type
stripping explicitly refuses to perform (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX:
TypeScript enum is not supported in strip-only mode`, reproduced directly
this session) — so the practical engineering conclusion is sound, but the
citation supporting it is false as stated, exactly the "practically benign
but the claim itself was never checked" shape round 6's semver finding
named. (2) Step 37 states the detached reindex "takes a directory lock via
`flock`(2)" — a specific POSIX system call — but Node.js's core `fs` module
exposes no `flock()` wrapper and no `LOCK_*`/`O_EXLOCK` constants at all
(confirmed by direct execution against the same Node v22.22.2 runtime), and
the plan's own hard constraints (`C-3`: no native code, no prebuilt
binaries; exactly two runtime dependencies, both already spent on
`web-tree-sitter`/`tree-sitter-wasms`) leave no way to call the real
`flock(2)` syscall from this codebase without either violating those
constraints or improvising a mechanism the plan never specifies — a
concreteness gap in a load-bearing (AD-26 concurrency) mechanism this
review's own inventory named for spot-check. Per the skill's mechanical
rule, any Moderate-or-above finding alone forces NEEDS FIXES, and this
round has one Serious and one Moderate.

---

## Upstream Contract Verification

**Spec §14 acceptance criteria.** No AC mapping is touched by either of this
round's findings — both are plan-original claims internal to two
implementation steps, not changes to AC scope. Re-read spec §14 (lines
908–1067) this session; no regression in the AC↔T-ID mapping table.

**Architecture design decisions this task explicitly named for spot-check:**

| AD | What it decides | Verification method | Verdict |
|---|---|---|---|
| AD-2 | Runtime/store engine floor: Node ≥22.16.0, `node:sqlite` with FTS5 | Read `docs/architecture-phase-a.md:325–364` directly this session; compared against Step 2's corrected `node:sqlite` citation | **Honored** — no regression |
| AD-3 | Repository identity resolver (commit/URL/path rule) | Read `docs/architecture-phase-a.md:366–420` this session; compared against Step 5 | **Honored** — no regression |
| AD-5 | Global-store schema and fact routing, `tuning`'s WRITER designation | Spot-checked against Step 8/Step 23's corrected seeding split | **Honored** — no regression |
| AD-9 | Question intake, recognizers, deny decision, `deny_bypass_suspect` disclosure | Read `docs/architecture-phase-a.md:736–922` this session; compared against Steps 14/16/18/33 | **Honored** — no regression |
| AD-10 | Deny confinement: one producer, structurally | Read `docs/architecture-phase-a.md:924–946` this session; compared against Step 15/T15-2 | **Honored** — no regression |
| AD-14 | The relevance bar: conjunction of floors, illustrative defaults | Read `docs/architecture-phase-a.md:1073–1128` this session; compared against Step 23's corrected sourcing text | **Honored** — no regression |
| AD-20 | `init`/`deinit` CLI spec | Read `docs/architecture-phase-a.md:1377–1412` this session; compared against Step 31 | **Honored** — no regression |
| AD-24 | Test/fixture architecture: three tiers, build-time L11 verifications | Spot-checked against Step 40's body and §10A's "Test tier split" entry | **Honored** — no regression |
| AD-25 | Packaging: two deps, no postinstall, no native code, `tsc` build | Read `docs/architecture-phase-a.md:1630–1648` this session in full | **Silent on both new findings' subject matter** — AD-25 says nothing about `node:test`'s TypeScript-execution capability or about the reindex directory-lock mechanism; both gaps originate at the plan layer (Step 1/D-plan-3 and Step 37 respectively), not from a transcription failure of an architecture decision that already addressed them |
| AD-26 | Concurrency: WAL + busy_timeout + retry-once + `BEGIN IMMEDIATE` fold; directory lock (unspecified mechanism) | Read `docs/architecture-phase-a.md:1650–1673` in full this session; grepped `flock` across the whole architecture document — **0 hits**. AD-26's own text says only "The detached reindex takes a directory lock; the handler never waits on it" — mechanism-agnostic. **Step 37's specific `flock`(2) elaboration is a plan-original addition beyond what AD-26 specifies, and it is the subject of Serious Finding 1 below** |

---

## Critical & Serious Findings

No Critical findings — the full inventory was Read or Grep-verified per
Compliance Gate B, and no violation of Critical classification was
observed: neither new finding below breaks the build unconditionally or
irrecoverably the way round 7's `npm ci` finding did (both are self-revealing
at the point an implementer tries to use the cited mechanism literally, per
each finding's own "why this severity" discussion).

### Serious Finding 1 — Step 37 specifies a directory lock "via `flock`(2)," a POSIX system call Node.js's core `fs` module does not expose, with no other locking mechanism named and no spare dependency budget to add one

**What the plan says.** `docs/plans/plan-phase-a.md:2856–2860` (Step 37 —
Concurrency: WAL retry-once + directory locks, "What changes," second
bullet): *"In `src/index/indexer.ts` (Step 21): The detached reindex takes a
directory lock via `flock`(2) on a file `<home>/projects/<key>/.reindex.lock`;
the handler never waits on this lock (staleness merely lowers confidence)."*
This is the plan's only mention of the locking mechanism's implementation;
Step 21's own body (line ~1917–1922) says only "with a directory lock in
the store dir," deferring the mechanism to Step 37.

**What the architecture actually specifies.** `docs/architecture-phase-a.md`
AD-26 (read in full this session, lines 1650–1673) says: *"The detached
reindex takes a directory lock; the handler never waits on it (staleness
merely lowers confidence meanwhile, `FR-K7`)."* — mechanism-agnostic; AD-26
never names `flock`, a syscall, or any specific locking primitive anywhere
in its body. Grepped `flock` across the entire 1700+-line architecture
document — **0 hits**. The `flock`(2) citation is therefore plan-original,
introduced at this plan's original 2026-09-06 authoring (or a subsequent fix
pass) with no architecture grounding, and — like round 7's `SqliteError`
finding before it — never logged in §11's "Verification of factual claims"
registry: grepped `flock` across §11 (lines 4080–4372) — **0 hits**.

**How this was verified — and found false/unimplementable, by direct
execution per Gate B's library/tool-behavior-claim rule.** Node.js's core
`fs` module was queried directly against Node v22.22.2 (this sandbox, the
same runtime family the plan's `engines: ">=22.16.0"` targets):

```
$ node -e "const fs=require('node:fs'); console.log(Object.keys(fs).filter(k=>/lock/i.test(k)))"
[]
$ node -e "console.log(Object.keys(require('node:fs').constants).filter(k=>/EXLOCK|SHLOCK|LOCK/.test(k)))"
[ 'UV_DIRENT_BLOCK', 'O_NONBLOCK' ]
$ node -p "require('node:fs').constants.O_EXLOCK"
undefined
```

Node's `fs` module exports zero functions matching `/lock/i` — no `fs.flock`,
no `fs.flockSync`, nothing — and `fs.constants` contains no `LOCK_SH`,
`LOCK_EX`, `LOCK_UN`, or `O_EXLOCK`/`O_SHLOCK` flags that would let `flock(2)`
semantics be requested through `fs.open()` either (the BSD/macOS
`O_EXLOCK` open-flag route, the one indirect path some platforms offer, is
also absent from Node's cross-platform constant set). This is not a
version-specific gap Node might close later in some minor release — Node's
public API surface for `node:fs` has never wrapped `flock(2)` in any
released version, because `flock()` is a Linux/BSD-specific advisory-lock
syscall with no Windows equivalent, and Node's `fs` module deliberately
exposes only the POSIX `open`/`read`/`write`/`stat` family that has a
cross-platform libuv implementation.

**Why this is a genuine concreteness gap, not a stylistic nit.** The plan's
own constraints make this load-bearing, not decorative:
1. `C-3` (spec-level, inherited throughout the plan and restated at AD-25/
   D-plan-3: "no native code, no prebuilt-binary downloads") rules out the
   one path that *would* give real `flock(2)` access from Node — a native
   addon (N-API binding) wrapping the syscall. No such addon is named
   anywhere in the plan, and adding one would violate the constraint this
   plan enforces everywhere else (AD-25's "runtime deps exactly
   `web-tree-sitter` + `tree-sitter-wasms`").
2. The plan's own "exactly two runtime dependencies" invariant (restated at
   D-plan-3: *"Preserve the two-runtime-dependency invariant… so
   cold-container install stays free of a test-runner package to fetch and
   configure"*) is already fully spent; no locking library (native or pure-JS)
   is in the dependency list, and none is proposed anywhere for this
   purpose.
3. A pure-JS, dependency-free advisory lock is achievable in Node (e.g., an
   atomic exclusive `fs.open(path, 'wx')` with staleness/PID checking, the
   technique most dependency-free Node lock implementations use) — but the
   plan does not specify this or any other concrete fallback; it names
   `flock`(2) specifically, as if that were the mechanism actually available,
   and gives an implementer literally following the plan no path forward
   once they discover (as this review did, immediately, by trying it) that
   `fs.flock` does not exist.
4. This sits inside AD-26 (concurrency), one of the seven architecture
   decisions this round's task explicitly named for spot-check, and the
   mechanism it describes (the reindex directory lock) is real, executed
   code in the plan's build — not a dormant seam or a never-instantiated
   type check the way round 7's `SqliteError` citation was. An implementer
   building Step 37 literally has no correct instruction to follow for this
   specific bullet.

**Why Serious, not Critical.** The failure is self-revealing at
implementation time — `fs.flock is not a function` (or the equivalent
`TypeError` from attempting to call a non-existent method) surfaces
immediately, the moment an implementer tries to write the code Step 37
literally describes, the same "loud failure, not a silent production
defect" shape round 7 used to keep its own `SqliteError` finding from
being classified higher than it was. It does not break Step 1's build or
every subsequent step's `npm ci` the way round 7's Critical finding did —
its blast radius is contained to Step 37's own directory-lock bullet. But
unlike the `SqliteError` citation (which supported a check no step actually
writes), this citation is for a mechanism the plan's own Verification field
requires to work (`T37-1`, "Concurrent write on the same store… the
detached reindex takes a directory lock via `flock`(2)" is the plan's only
description of how that lock is taken), so an implementer cannot simply
skip past the false citation the way round 7's implementer could skip past
an `instanceof SqliteError` check nobody actually writes.

**What correct disposition looks like.** Replace the `flock`(2) citation
with a concrete, dependency-free mechanism Node genuinely supports — the
standard pure-JS approach is an atomic exclusive-create lock file:
`fs.open(lockPath, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY)`,
which throws `EEXIST` if another process holds the lock (advisory, not
kernel-enforced, but sufficient for the plan's own stated purpose — "the
handler never waits on it; staleness merely lowers confidence" — since the
plan does not require kernel-level mutual exclusion, only a
best-effort single-instance hint) — with a staleness check (e.g., an mtime
or PID check) so a crashed process's stale lock file does not permanently
block future reindex attempts. Update Step 37's "What changes," Step 21's
cross-reference, and `T37-1`'s Verification/Data fields to describe this
mechanism instead of a syscall Node cannot invoke; add a §11 "Claims from
external sources" entry logging the verified fact (`node:fs` has no
`flock`/`O_EXLOCK` surface, verified this session against Node v22.22.2) so
this class of citation is checked at write time by future fix passes rather
than surviving unlogged, unverified, for an eighth round.

No other Critical or Serious findings — the full inventory was Read or
Grep-verified per Compliance Gate B beyond Serious Finding 1 above, and no
other violation of Critical or Serious classification was observed.

---

## Systemic Patterns

**Proactive scan run before classifying.** Having found two new
library/tool-behavior-claim defects this round (the `node:test`/TypeScript
claim and the `flock`(2) claim), this review checked whether they share a
detectable signature with each other or with round 6/7's two prior
instances (the `semver` claim, the `SqliteError` claim) before deciding
whether a fourth-and-counting instance constitutes a verified Systemic
pattern rather than four isolated citation errors:

- **Common shape, not a common grep signature.** All four instances (round
  6's `semver`, round 7's `SqliteError`, this round's `node:test`-TypeScript
  claim and `flock`(2) claim) share the *narrative* shape the collapse-log
  already names generically ("a claim about a familiar mechanism… reads as
  too basic to be wrong") but not a *textual* signature a single grep query
  could catch — they involve four different tools/APIs (`semver` range
  syntax, a SQLite error class name, Node's TypeScript type-stripping
  default, and a POSIX syscall), so no proactive grep across the full
  inventory scope can enumerate "every unverified tool-behavior claim" the
  way `grep "bin 1 answered"` could enumerate a stale citation phrase in
  earlier rounds. This is the same limitation round 7's own collapse-hunt
  named for its own `SqliteError` finding: *"the identical gap round 6
  closed for the semver claim, reopened here because round 6's own
  verification effort was scoped specifically to the semver/caret claim its
  own review brief named, not to a systematic sweep."*
- **The methodological pattern IS systemic, even though no single grep
  query is.** Four rounds in a row (6, 7, 8×2) have each found at least one
  new instance of "an authoritative-sounding tool/library citation, plan-
  original, never logged in §11, never checked by direct execution across
  every prior round, and false or unimplementable as literally stated" —
  this is the collapse-log's own generalized lesson (2026-09-07 round-6 and
  round-7 entries) continuing to produce findings on every application of a
  new verification angle, which is itself the signal that the underlying
  authoring practice (assert a "the authoritative standard: X's official
  docs say Y" sentence without running X) has not changed, only the
  specific sites checked have grown. This is recorded as a **methodological
  Systemic pattern** — not a single textual Systemic finding under this
  round's Compliance Gate B (which requires "the pattern's signature
  expressed as a grep query, or decomposed into structural elements that
  can be" — decomposed here into "every `authoritative standard`/`Cite:`/
  documentation-name citation naming a specific, checkable tool behavior,"
  the same decomposition round 7's own collapse-hunt used to find its
  `SqliteError` instance, which this round applied to two more sites the
  same enumeration had not yet reached).
- **Enumeration attempted this round.** Grepped `authoritative standard`
  (28 hits, one per non-trivial step's Gate-3 rationale) and
  `[Cc]ite:` (46 hits, mostly §10A collapse-test citations) across the full
  document. Of the checkable ones (naming a specific, executable tool
  behavior rather than an internal spec/architecture/ledger reference),
  this round ran every one not already verified by a prior round's
  execution against a real instrument: the `node:test`/TypeScript claim and
  the `flock`(2) claim were the only two that had never been executed. Every
  other checkable citation in this enumeration (SQLite WAL semantics,
  `VACUUM INTO`'s non-byte-identity behavior at T32-2, the `git
  rev-list --max-parents=0` shallow-clone behavior at Step 5, the `npm
  registry` version/install-script claims at §11.4, the `npm pack --dry-run`
  grammar-enumeration claim at Step 40) has already been independently
  executed by this round or a prior round and confirmed correct (see
  Scope 2's inventory and What's Actually Good, below).

**Conclusion: no new textual Systemic finding (a single grep-expressible
pattern, verified across the full inventory scope) is delivered this
round.** Both new defects are delivered as Serious and Moderate
respectively. The cross-round methodological pattern is recorded above,
consistent with round 7's own framing of its `SqliteError` finding as "the
same defect class... at a different site," and is logged as a
collapse-log-worthy observation in the Recommended Priority section below
rather than inflated into a finding this round's own grep could not
actually enumerate in full.

No other systemic patterns beyond those already tracked and closed in prior
rounds — verified by the scans above plus the full read of §1–§16 described
in Scope 2.

---

## Moderate & Minor Findings

### Moderate Finding 1 — Step 1 and D-plan-3's collapse-test both assert, as a blanket fact, that Node's `node:test` cannot execute `.ts` source without an experimental flag; false for part of the plan's own stated Node-version floor

**What the plan says.** `docs/plans/plan-phase-a.md:652–655` (Step 1, "What
changes"): *"this is the resolved answer to collapse-hunt C2: `node:test` on
Node 22.16.0 cannot execute `.ts` source directly (no
`--experimental-strip-types` is assumed or relied on anywhere in this
plan)…"* Restated at `docs/plans/plan-phase-a.md:3634–3645` (§10A, D-plan-3's
collapse-test, "Answer"): *"Node 22.16.0's `node:test` cannot load a `.ts`
file directly (no `--experimental-strip-types` is used or relied on
anywhere in this plan)… Cite: Node ≥ 22.16 `node:test` API (executes `.js`,
not `.ts`, without an experimental flag this plan does not adopt)…"* Both
sites frame this as a fact true across "Node ≥ 22.16" — the plan's own
stated runtime floor (`"engines": {"node": ">=22.16.0"}`, Step 1) — not
scoped to the specific 22.16.0 patch version alone.

**How this was verified — and found false for part of the claimed range, by
direct execution per Gate B's library/tool-behavior-claim rule.** Run
directly against Node v22.22.2 (this sandbox — squarely inside the plan's
own `>=22.16.0` floor) in a fresh scratch directory:

```
$ cat > sample.test.ts <<'EOF'
import { test } from 'node:test';
import assert from 'node:assert';
test('basic ts test', () => {
  const x: number = 1;
  assert.strictEqual(x, 1);
});
EOF
$ node --test sample.test.ts
TAP version 13
# Subtest: basic ts test
ok 1 - basic ts test
...
# pass 1
# fail 0
```

No flag was passed. `node --test` loaded and ran the `.ts` file directly,
zero-configuration, contradicting the plan's blanket claim. Corroborated
with `node --help | grep -i strip`, which shows `--no-experimental-strip-types`
as an available *disabling* flag (the double-negative naming is the tell
that stripping is default-**on** in this build, not default-off). A
`WebFetch` of the official Node docs page (`https://nodejs.org/api/typescript.html`)
independently confirms and dates this precisely: *"v23.6.0, v22.18.0: Type
stripping is enabled by default."* The plan's Node floor is `>=22.16.0`,
which spans both the pre-22.18.0 sub-range (where the plan's claim is true —
type stripping requires the explicit flag) and the `>=22.18.0` sub-range
(where it is false — any current Node 22 LTS install, including this
sandbox's, ships default-on stripping). Grepped `22.18|22.17|type strip|type-strip`
across both the plan and the architecture — **0 hits** — this
version-sensitivity is disclosed nowhere in either document.

**Why the plan's chosen fix nonetheless remains correct, for a reason the
plan never states.** Step 6 (`docs/plans/plan-phase-a.md:1003–1004`) creates
`src/diag/fault_codes.ts` exporting `const enum FaultCode`. Verified
directly this session: default-on type stripping explicitly refuses `const
enum` (and plain `enum`) declarations, because an enum is a
*code-transformation* feature (it compiles to a runtime object), not a
type-erasable one:

```
$ cat > enum_test.ts <<'EOF'
const enum FaultCode { hooks_not_firing = 'hooks_not_firing' }
console.log(FaultCode.hooks_not_firing);
EOF
$ node enum_test.ts
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not
supported in strip-only mode
```

The same official docs page corroborates this by name: *"The most prominent
features that require transformation are: `Enum` declarations…"* So any
test file that imports `fault_codes.ts` (directly or transitively) would
fail to load under plain `node --test`, on *any* Node version, default-on
stripping or not — meaning Step 1's `tsc`-to-`dist-test/` compile step is
genuinely necessary regardless of which patch version within `>=22.16.0` an
implementer runs. **The engineering conclusion holds; the stated
justification for it does not, for the sub-range `>=22.18.0`.**

**Why this is the same defect class as round 6's `semver` finding and
round 7's `SqliteError` finding, at a third, independent site.** All three
share the exact shape the collapse-log's round-6 entry names: *"A claim
about a well-known mechanism… is exactly the kind of thing a reviewer is
most likely to accept from memory rather than verify, because it feels too
basic to be wrong."* "TypeScript can't run directly in Node without a build
step" was extremely true when this plan was first authored (2026-09-06,
predating the relevant Node release) and reads as permanently true to
anyone who has not checked Node's 2025–2026 release notes specifically —
exactly the "routine, therefore unchecked" shape. Like round 6's finding, it
is **practically benign** (the real behavior turns out to matter less than
believed, because an unrelated fact — the `const enum` — forces the same
conclusion anyway) rather than **self-revealing** the way round 7's
`SqliteError` finding was (nothing here fails loudly at compile time the
way an unresolved `SqliteError` identifier would) or **load-bearing the way
Serious Finding 1 above is** (nothing here blocks an implementer who
follows the plan literally, because the compile step is built regardless of
whether its stated justification is fully accurate).

**What correct disposition looks like.** Rewrite lines 652–655 and
3634–3645 to state the precise, version-bounded fact: *"Node's TypeScript
type-stripping became enabled by default at v22.18.0 (Node's official
`typescript.html` docs, verified this session); below that version within
the plan's own `>=22.16.0` floor, `node:test` cannot load `.ts` source
without `--experimental-strip-types`. Independent of that boundary, Step
6's `const enum FaultCode` requires real code transformation — which even
default-on stripping explicitly refuses (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`,
verified this session) — so the `tsc`-to-`dist-test/` compile step is
required on every Node version within the plan's stated floor, for this
reason, not the stripping-availability reason alone."* Add a corresponding
§11.4 entry so this joins the plan's own "every factual claim… with the
read-level evidence that establishes it" registry instead of remaining
unlogged.

No other Moderate or Minor findings — verified by the full read of §1–§16,
the T-ID cross-checks in §12.1–§12.5, and the targeted grep scans described
in Scope 2 and Systemic Patterns above.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per
Compliance Gate B, including both new findings' tool-behavior claims, which
were resolved (not left tentative) by directly executing the exact scenario
each claim describes: `node --test` against a raw `.ts` file and against a
`.ts` file containing a `const enum` (Moderate Finding 1), and querying
`node:fs`'s exported surface for lock-related functions and constants
(Serious Finding 1).

---

## What's Actually Good

- **Round 6's `semver` correction and round 7's `npm ci`/`node:sqlite`
  corrections all remain genuinely sound under a third, independently-run
  execution.** Re-running `semver.satisfies`/`validRange`, `npm ci`
  with/without a lockfile, and `node:sqlite`'s error shape in fresh scratch
  directories this session — none reusing any prior round's install or
  transcript — reproduced every one of the three prior rounds' corrected
  claims exactly. **Verified by:** direct execution, this session (Scope 1,
  above). **Standard:** the same discipline this review applies to its own
  new findings, applied here as a positive finding because three
  consecutive rounds of corrections all continue to hold under independent
  re-execution rather than merely re-reading.
- **T32-2's `VACUUM INTO` citation continues to model the correct
  discipline this round's two new findings show was not applied elsewhere.**
  Its "NOT asserts" field quotes `sqlite.org/lang_vacuum.html` directly with
  a fetch date, states precisely what the tool does and does not guarantee,
  and is logged in §11 with the read-level evidence. **Verified by:** Read
  of lines 5703–5712, cross-referenced against the plan's own §11
  verification-of-claims discipline. **Standard:** `expert-review`'s Step 5
  library-behavior-claim rule, met here rather than skipped — the same
  standard both new findings above show was not applied to the `node:test`
  and `flock`(2) claims.
- **The `npm pack --dry-run` grammar-inventory check (Step 40, L6) holds up
  under direct execution.** Installing `tree-sitter-wasms@0.1.13` fresh and
  running `npm pack --dry-run` from inside its own installed directory (the
  scenario Step 40's build-time check describes) correctly enumerates all
  36 shipped `out/*.wasm` grammar files with no destructive side effect
  (`--dry-run` writes no tarball to disk, confirmed by directory listing
  after the command). **Verified by:** direct execution, this session — the
  specific command round 7's own collapse-hunt named as a next verification
  target. **Standard:** the same Gate-B discipline, applied here as a
  positive finding because, unlike the two new findings above, this claim
  survives contact with a real instrument.
- **Every architecture-decision spot-check this task named (AD-2, AD-3,
  AD-5, AD-9, AD-10, AD-14, AD-20, AD-24, AD-25, AD-26) matches
  `docs/architecture-phase-a.md`'s current text with no drift, across eight
  rounds of fix passes now.** **Verified by:** direct Read of each
  architecture section's exact line range this session, cross-checked
  against the plan's current citations (Upstream Contract Verification
  table, above). **Standard:** the same premise-verification discipline
  this review applies to every claim, applied here as a positive finding
  because the citations hold up.

---

## Recommended Priority

1. **Serious Finding 1 (the `flock`(2) citation).** Fix before
   implementation reaches Step 37 — an implementer following the plan
   literally has no working instruction for the reindex directory lock as
   currently written, and the fix (an atomic exclusive-create lock file) is
   a small, self-contained rewrite of one bullet plus its `T37-1`
   cross-reference.
2. **Moderate Finding 1 (the `node:test`/TypeScript blanket claim).**
   Lower urgency than Finding 1 because the plan's actual build recipe
   (the `tsc` compile step) is unaffected and remains correct regardless —
   this is a citation-accuracy fix, not a build-blocking one. Fix by
   rewriting the two sites to name the real, version-bounded reason (the
   `const enum`), not the version-sensitive one.
3. **Log both in §11** as part of either fix, per the plan's own stated
   discipline, so a ninth round's enumeration of "every checkable
   documentation citation" (per this round's and round 7's method) does not
   have to rediscover them from scratch — and so the methodological
   Systemic pattern named above (four consecutive rounds each finding at
   least one new unverified-and-false "familiar tool" citation) gets one
   collapse-log line generalizing it, per this project's own "a defect
   mentioned but not given a finding number is exactly as likely to be
   silently dropped as one never mentioned" lesson (2026-09-07 round-3
   entry).

---

## Verdict

Verdict: NEEDS FIXES (2 findings: 1 Serious, 1 Moderate)
