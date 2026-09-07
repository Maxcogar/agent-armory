# Expert review (round 7, re-review) — `docs/plans/plan-phase-a.md`

**Date:** 2026-09-07
**Reviewer:** fresh independent `/expert-review` pass; not the plan-writer,
not the author of any of the twelve prior review documents on this artifact,
no prior context on this session.
**Artifact:** `/home/user/agent-armory/middleware/context-oracle/docs/plans/plan-phase-a.md`
at its current state on branch `claude/plan-correction-strategy-57ot28` —
commit `048aec86e1fcb46486ae38247a5e4131f393dd62` ("context-oracle: fix
round-6 expert-review findings"), 6923 lines, read across sequential and
targeted `Read`/`Grep` calls covering the full document, per the Re-Review
Protocol in `middleware/context-oracle/.claude/commands/expert-review.md`
(the project-scoped copy, read first, in full).
**Round:** 7 (re-review of round 6's collapse-hunt fix (`f9f6771`) and round
6's expert-review fix (`048aec8`)). Round 1: 10 findings, all fixed. Round 2:
9 findings (1 Systemic × 7 instances, 2 Serious, 1 Moderate, plus the
Q-gap-5 overclaim), all fixed. Round 3: NEEDS FIXES (1 Systemic × 2
instances, 2 Moderate, 1 Minor), all fixed; companion collapse-hunt found 2
collapses + 2 partials, also fixed. Round 4: NEEDS FIXES (1 Systemic
spanning 2 instances), all fixed; companion collapse-hunt found 2
collapses, also fixed. Round 5: NEEDS FIXES (1 Systemic spanning 2
instances at 6 locations, 1 Minor), all fixed; companion collapse-hunt
found 2 collapses (1 fully accurate, 1 incomplete), also fixed. Round 6:
NEEDS FIXES (2 Moderate, 2 Minor — no verified multi-site Systemic
pattern), all fixed; companion collapse-hunt found 1 collapse (the Step
9/41/37 ULID citation), also fixed. **This round independently re-verifies
every round-6 finding as genuinely closed against current source — including
re-running the semver check myself rather than trusting the plan's
restatement of round 6's result — and finds one new Critical defect and one
new Moderate defect that no prior round named**, detailed below.

---

## Scope and Inventory

### Tool-plan disclosure

`ToolSearch` for CodeGraph/Clear Thought was not re-invoked this round —
this round's task, like round 6's, is scoped to verifying textual/structural
claims and tool/library-behavior claims about a Markdown planning document
(literal-content, absence, and library-behavior claims per the process
document's Step 5), the disposition every prior round recorded, and round 3
already independently reproduced the Q-gap-5 MCP protocol claim by direct
stdio invocation. Every claim below is verified by Read (file:line, this
session), Grep (query + result count, this session), or a direct executable
check (the `semver` npm package and `npm ci` itself, both installed/run
fresh this session in a scratch directory) — never memory, never trust in a
prior review's or the plan's own attestation.

### Scope 1 — Round 6's finding-groups, as closure items

- [x] **Round-6 collapse-hunt Collapse 1 (Step 9's DAO body cited "Step
  41's ULID util"; the ULID generator is built at Step 37).** Read line
  1129 (current): "returns the ULID id (Step 37's ULID util — corrected
  this fix pass, round 6: previously said 'Step 41's,' Step 41 builds only
  grep-based convention tests with no ID-generation content) synchronously
  …". Grep-confirmed `Step 41's ULID` — **0 hits** in the current document;
  `Step 37's ULID` — **1 hit** (the corrected line itself). Cross-checked
  against Step 37's own heading (line 2817, `### Step 37 — Concurrency:
  WAL retry-once + directory locks`) and the file skeleton's own
  `util/ulid.ts # Step 37 — ULID generator (AD-26)` (line 378). **Closed.**
- [x] **Round-6 expert-review Moderate Finding 1 (§3's Standards registry
  still called the web-tree-sitter version-bump question "bin 1
  answered" after reclassification to bin-2).** Read lines 207–216
  (current): "…bumping `web-tree-sitter` to 0.27.0 is a Step-1
  owner-visible choice, recorded as an open bin-2 item at §14.2 (default:
  keep the caret, per the current recommendation), with the prior bin-1
  framing of the question (§14.1 Q1) retracted as not the planner's call
  to begin with — corrected this fix pass, round 6: previously said
  'recorded in the plan's Question register as bin 1 answered,' matching
  neither register entry's actual current disposition." Grep-confirmed
  `bin 1 answered|bin-1 answered` — **1 hit**, and that hit is inside the
  corrected sentence's own "previously said" quotation, not a live claim.
  Cross-checked against §14.1 Q1 (line 6116–6123: "Disposition. Retracted
  at D-plan-2…") and §14.2's web-tree-sitter entry (lines 6223–6241, open
  bin-2 item). **Closed** — but see Moderate Finding 2 below, a related,
  previously-unflagged imprecision one field over in this exact same
  entry (§14.1 Q1's own disposition text), found during this round's
  regression scan.
- [x] **Round-6 expert-review Moderate Finding 2 (D-plan-2 and §14.2 both
  rested on an unverified, false, claim that `^0.26.13` "accepts 0.27.0
  anyway").** Read D-plan-2's current §10A entry (lines 3559–3588) — the
  Hardest question and Answer fields now correctly state `^0.26.13` is
  anchored at the minor version and excludes `0.27.0`, citing
  `semver.satisfies('0.27.0','^0.26.13') → false` and
  `semver.validRange('^0.26.13') → >=0.26.13 <0.27.0-0`. Read §14.2's
  current web-tree-sitter entry (lines 6223–6241) — same correction
  applied. **Independently re-verified the underlying claim myself,
  from scratch, rather than trusting the plan's restatement of round 6's
  result:** installed `semver@7.8.5` fresh in a new scratch directory
  (`/tmp/claude-0/.../scratchpad/semvercheck`, not reusing round 6's
  install) and ran:
  ```
  $ node -e "const s=require('semver');
    console.log(s.satisfies('0.27.0','^0.26.13'));   // false
    console.log(s.satisfies('0.26.14','^0.26.13'));  // true
    console.log(s.validRange('^0.26.13'));           // >=0.26.13 <0.27.0-0
    console.log(s.maxSatisfying(['0.26.13','0.26.14','0.27.0'],'^0.26.13')); // 0.26.14"
  ```
  All four results match the plan's corrected text exactly: `0.27.0` is
  excluded, `0.26.14` (patch-level) is included, and the range resolves
  to `>=0.26.13 <0.27.0-0`. **Closed, and independently reproduced, not
  merely re-read.**
- [x] **Round-6 expert-review Minor Finding 1 (§14.4's sweep-record
  narrative had no "Pass L" entry for round 5's fix pass).** Grep-confirmed
  `Pass L\b` — **1 hit** (line 6440: "**Pass L (fix pass, round 5 —
  independent re-review response, added this fix pass, round 6…**").
  Read the full entry (lines 6440–6465) — summarizes round 5's
  collapse-hunt (2 collapses) and expert-review (1 Systemic × 4 sites +
  Test-tier-split fix + Step 38 Minor) accurately against
  `docs/reviews/2026-09-07-round-5-plan-collapse-hunt.md` and
  `-round-5-plan-expert-review.md`, both re-read this session. **Closed.**
- [x] **Round-6 expert-review Minor Finding 2 (§14.2's garbled
  ".mcp.json-registry re-check" phrase).** Grep-confirmed
  `mcp.json.*registry|registry.*mcp.json` — **0 hits**. Read the current
  text (line 6238): "…per the npm-registry re-check at §11.4…" — correctly
  points at §11.4 (lines 4256–4269), which is where the plan's actual npm
  registry evidence (`WebFetch` of `registry.npmjs.org`) lives. **Closed.**

**Scope 1 result: every round-6 finding (both from the concurrent
collapse-hunt and the expert-review) is genuinely closed against current
source, verified this round by independent Read, Grep, and — for the
semver claim specifically — independent live re-execution in a fresh
scratch directory, not a re-read of round 6's own transcript.**

### Scope 2 — Full-document regression scan (fix-diff plus full read)

**Fix-diff files** (`git show f9f6771` and `git show 048aec8`, both read in
full this session): `docs/plans/plan-phase-a.md` (both commits — every
hunk read against the surrounding current text, not just the diff context
lines); `docs/STATUS.md` and `docs/collapse-log.md` (round-6 additions,
read in full — see below); the two round-6 review documents themselves,
`docs/reviews/2026-09-07-round-6-plan-collapse-hunt.md` (448 lines) and
`2026-09-07-round-6-plan-expert-review.md` (688 lines), both read in full
before touching the plan.

- [x] Front matter + §1 Goal + §2.1/2.2 Scope + §2.3 coverage table + §2.4
  (lines 1–178) — Read in full. Every step citation in the §2.3 table
  (Step 25; Steps 21–24, 26–28; Steps 12–15, 18, 19; Steps 3–9, 20–22;
  Step 30, 19; Steps 10, 36, 33; Step 11, 4, 22; Step 34, 35; Steps 13,
  15, 38; Step 42) cross-checked against each named step's own `###`
  heading. No defect.
- [x] §3 Standards registry (lines 179–259) — Read in full. The
  web-tree-sitter/`bin 1 answered` fix (Scope 1) confirmed closed. **New
  finding candidate investigated:** line 204–205's "npm packages —
  `web-tree-sitter` (latest 0.27.0, no runtime deps, no install scripts,
  verified 2026-09-06 via npm registry)" cross-checked against §11.4's
  `WebFetch` evidence (lines 4258–4262) — consistent, no defect (the
  registry snapshot is dated and stated as such, not asserted as
  current-at-review-time).
- [x] §4/§5/§5.1–§5.5 (lines 260–523) — Read in full, every file-skeleton
  entry's `# Step N` comment cross-checked against the constructing
  step's own heading. **This pass is where a Critical finding
  originates** — see below: the skeleton names `package.json` and
  `tsconfig.json` at Step 1 and nowhere names a `package-lock.json` or
  equivalent, anywhere in the 244-line skeleton, despite Step 1's own
  build/CI commands depending on one existing.
- [x] §6, §8 (lines 524–618) — Read in full. No defect.
- [x] §7 Steps 1–43 + Step 2.5, every step body in full (lines 620–3267,
  across nine sequential `Read` calls with no gaps) — cross-checked every
  `Step N` cross-reference inside each step's own prose against the step's
  own construction target (using an independently-built step→topic map,
  built fresh this session rather than reused from round 6's), and every
  T-ID cited in a step's Verification field against its own §12 entry.
  **New Critical finding: Step 1 (lines 625–677) specifies `npm ci` as
  the first command of both its own build verification (`T1-1`) and the
  CI workflow, with no `package-lock.json` ever created by this or any
  other step — verified by direct execution (below) that `npm ci` fails
  unconditionally without one.** No remaining "Step 41's ULID"
  instances (Scope 1). No other new step-citation defect found.
- [x] §9 Checkpoints (lines 3287–3331) — Read in full. Checkpoint 3's
  "After Step 30 (delivery)" is correct, cross-checked against Step 30's
  own heading and Step 30's Dependencies field (Steps 9, 19). No defect.
- [x] §10 Decisions D-plan-1..8 (lines 3333–3475) — Read in full. **New
  Moderate finding: D-plan-2's own heading (lines 3363–3364) labels
  `web-tree-sitter@0.26.13` "(exact)" — contradicting Step 1's own
  package.json (`^0.26.13`, a caret range) and contradicting D-plan-2's
  own round-6-corrected §10A collapse-test three sections below it,
  which is entirely about the caret's non-exact behavior — see below.**
- [x] §10A collapse-tests, every D-plan-* and N1–N6 entry in full (lines
  3477–4051) — Read in full. D-plan-2's own §10A entry (lines 3559–3588)
  confirmed internally consistent post-round-6-fix (Scope 1). No other
  stale field found in any other §10A entry.
- [x] §11.1–§11.6 (lines 4052–4344) — Read in full. Every V-claim's quoted
  text spot-checked against `docs/architecture-phase-a.md`'s V1–V19 table;
  T32-2's `VACUUM INTO` non-byte-identity claim (lines 5656–5665) verified
  against a direct quotation of `sqlite.org/lang_vacuum.html`, cited with
  a fetch date — a positive instance of the exact discipline Gate B
  requires. No defect.
- [x] §12.1 Unit tier, T1-1 through T43-1 (lines 4348–5023 approx.) — Read
  in full, cross-checked each `Verifies`/`File` field against the step it
  names and against §5.1's file skeleton. **T1-1's own "Fails when `npm
  ci` exits non-zero" clause (line 4368) is itself evidence for the
  Critical finding below — the test's own stated failure condition is met
  unconditionally, on a fresh checkout, per direct verification.**
- [x] §12.2–§12.4, T16-1 through T40-6 (remaining §12 body) — Read in full,
  including T40-4 (AC-20)'s cold-container check (lines 5836–5849), which
  correctly uses `npm install` (not `npm ci`) — noted as corroborating
  evidence that the plan's own text elsewhere already treats
  `npm install`/`npm ci` as behaviorally distinct commands, sharpening
  rather than resolving the Step 1 defect. No other new defect.
- [x] §12.5 Coverage attestation, both mapping tables — Read in full;
  every AC→T-ID row and every Step→T-ID row cross-checked against the
  T-ID's own §12 entry and the step's own Verification field. No defect.
- [x] §13 Risks R1–R10 (lines 5993–6106) — Read in full; each
  "Mitigation" step citation cross-checked against the named step's
  actual content. **No risk entry discloses the missing-lockfile /
  `npm ci` failure mode** — confirming the Critical finding below is an
  undisclosed gap, not an already-accepted, already-mitigated risk.
- [x] §14.1 Bin 1 (lines 6109–6215), §14.2 Bin 2 (lines 6216–6260 approx.),
  §14.3 Bin 3, §14.4 Reconciliation sweep — all Read in full. Q1's
  "Retracted" disposition (line 6121) and its "Both packages pinned to
  their architecture-verified versions" phrasing (lines 6122–6123) is the
  weaker, second echo of the same "exact vs. floor" imprecision named in
  the Moderate finding below — noted there as a secondary site, not
  double-counted as a separate finding. Pass L entry confirmed present
  and accurate (Scope 1).
- [x] §15 Gaps acknowledged, Q-gap-1 through Q-gap-6 in full — Read in
  full. No new defect; the "Step 2's/Step 5's/Step 8's" references inside
  Q-gap-6 (lines 6507–6510) correctly use `expert-plan` SKILL.md's own
  process-step numbering (codebase survey / foundation probes / write the
  plan), not the plan's own build-step numbering — the same disambiguation
  round 5 already investigated and confirmed as a sanctioned dual
  convention; independently re-confirmed here by reading the surrounding
  paragraph's own subject matter (CodeGraph tool capabilities), which is
  unambiguous in context.
- [x] §16 Post-completion (end of document) — Read in full. Step 43's
  "What changes" list (lines 3235–3253) does not create a
  `package-lock.json` either — confirming the gap is not deferred to
  post-completion housekeeping.
- [x] `docs/reviews/2026-09-07-round-6-plan-collapse-hunt.md` (448 lines)
  and `2026-09-07-round-6-plan-expert-review.md` (688 lines) — both Read
  in full, first, before touching the plan.
- [x] `docs/specs/spec-context-oracle.md` §14 (lines 908–1057, read this
  session) — re-read; no AC changed by round 6's fixes or this round's
  own findings (the Critical finding is a build-tooling defect, not an
  AC-scope change).
- [x] `docs/architecture-phase-a.md` AD-5 (568–645), AD-9 (736–922),
  AD-10 (924–945), AD-14 (1073–1128), AD-20 (1377–1412), AD-24
  (1513–1628), AD-26 (1650–1673) — all Read in full this session, per the
  task's explicit spot-check list, and cross-checked directly against the
  plan's current citations of each (see Upstream Contract Verification
  table below). None of the seven governs npm packaging/lockfile
  behavior — AD-25 (packaging) is the relevant architecture decision for
  the Critical finding, spot-checked separately below.
- [x] `docs/architecture-phase-a.md` AD-25 (packaging) — Read in full
  (grepped for its heading and read the full section) to check whether
  the architecture itself specifies lockfile handling that the plan
  simply failed to transcribe. It does not: AD-25 specifies "two runtime
  deps, no postinstall, no native code, `tsc` build" and says nothing
  about `npm ci` vs `npm install` or lockfile commit policy — the gap
  originates in the plan's own build-tooling choice (`npm ci` in Step 1
  and the CI workflow), not in a transcription error from an
  architecture decision that already covered it.
- [x] `docs/STATUS.md` (current, post-round-6, ~370 lines) — Read in full.
- [x] `OWNER-LEDGER.md` (81 lines) — Read in full.
- [x] `docs/collapse-log.md` — all 2026-09-07 entries (through the round-6
  entry) — Read in full for the in-scope portion.
- [x] `middleware/context-oracle/CLAUDE.md` — Read in full.
- [x] `middleware/context-oracle/.claude/commands/expert-review.md`
  (226 lines) — Read in full, first.
- [x] The `semver` npm package (v7.8.5, installed fresh this session in a
  new scratch directory, independent of round 6's install) — run directly
  to independently reproduce round 6's semver finding (Scope 1, above).
- [x] `npm ci` itself (npm 10.9.7, bundled with the container's Node
  v22.22.2 — matching the plan's own stated runtime floor family) — run
  directly in a scratch directory containing only a `package.json` with a
  non-empty `dependencies` object and no `package-lock.json`, reproducing
  exactly the scenario Step 1's `T1-1` and the CI workflow specify. Result:
  immediate `EUSAGE` failure, exit code 1 — verifying the Critical finding
  below by test reproduction, per Gate B's requirement for a
  library/tool-behavior claim.

**Rigor waivers:** none. **Instrument unavailability:** CodeGraph/Clear
Thought were not re-invoked this round; disclosed, non-gating, per every
prior round's disposition, unchanged this round because no finding this
round depends on either tool.

---

## Summary

**This review returns NEEDS FIXES.** Every finding from round 6's
collapse-hunt and expert-review — the Step 9 ULID citation, the D-plan-2
and §14.2 semver claims (independently re-verified this round by a fresh
`semver` install and execution, not by trusting the plan's restated
result), the §3 "bin 1 answered" citation, and the §14.4 Pass L entry and
the garbled `.mcp.json` phrase — is genuinely closed against current
source. This round's full-document regression scan, applying Gate B's
library-behavior-claim rule to the rest of the document exactly as round 6
applied it to the semver claim, found a **new Critical defect**: Step 1
specifies `npm ci` as the first command of both its own acceptance test
(`T1-1`) and the CI workflow that gates every pull request touching the
`ctxoracle` package, and no step anywhere in the plan — not Step 1, not any
later step, not Step 43's post-completion housekeeping — creates or commits
a `package-lock.json`. `npm ci`'s own documented behavior, which this
review verified by direct execution rather than by memory (the exact
discipline round 6's own collapse-log entry prescribes for "a claim about a
familiar mechanism that reads as too basic to be wrong"), is to refuse to
run at all without one: `npm error code EUSAGE … The npm ci command can
only install with an existing package-lock.json or npm-shrinkwrap.json`.
This means the plan's own first-step acceptance test, as literally
specified, cannot pass on a fresh checkout — which is exactly what `T1-1`
purports to test — and every CI run on every PR touching this package
would fail at its first command, before a single line of `ctxoracle` code
is even type-checked. This is not a corner case or a version-drift
question (the class round 6 examined and correctly left as a disclosed,
non-blocking residual for D-plan-2); it is an unconditional failure of the
literal build recipe the plan specifies, previously unflagged across six
rounds of review because — like round 6's semver claim — `npm ci` reads as
too routine a command to be worth actually running. This review also found
a second, Moderate defect: D-plan-2's own top-level decision heading
(§10, not §10A) labels `web-tree-sitter@0.26.13` "(exact)", which
contradicts both Step 1's actual package.json (a caret range, `^0.26.13`)
and D-plan-2's own round-6-corrected collapse-test text three sections
below it, which is now entirely about why the caret is *not* behaviorally
identical to an exact pin in the general case. Per the skill's mechanical
rule, any Critical-or-above finding alone forces NEEDS FIXES, and this
round has one Critical and one Moderate.

---

## Upstream Contract Verification

**Spec §14 acceptance criteria.** No AC mapping is touched by either of
this round's findings — both are build-tooling/citation defects internal
to the plan, not changes to AC scope. Re-read spec §14 (lines 908–1057)
this session; no regression in the AC↔T-ID mapping table.

**Architecture design decisions this task explicitly named for
spot-check, plus AD-25 (the architecture decision actually governing the
Critical finding's subject matter):**

| AD | What it decides | Verification method | Verdict |
|---|---|---|---|
| AD-5 | `tuning`'s WRITER is "seeded at init, changed via `tune`" (AD-20) | Read `docs/architecture-phase-a.md:568–645` directly this session; compared against Step 8 and Step 23 | **Honored** — no regression |
| AD-9 | Question intake, recognizers, deny decision, `deny_bypass_suspect` both-direction disclosure | Read `docs/architecture-phase-a.md:736–922` directly this session; compared against Step 14, Step 16, Step 18, Step 33 | **Honored** — no regression |
| AD-10 | Deny confinement: one producer, structurally, via built-output grep | Read `docs/architecture-phase-a.md:924–945` directly this session; compared against Step 15 (`T15-2`) and Step 41 | **Honored** — no regression |
| AD-14 | The relevance bar: conjunction of floors, ship-high illustrative defaults | Read `docs/architecture-phase-a.md:1073–1128` directly this session; compared against Step 23's own corrected sourcing text and Step 24's combinator | **Honored** — no regression |
| AD-20 | `init`/`deinit` CLI spec: environment checks, key derivation, hook wiring, first index, `tune` | Read `docs/architecture-phase-a.md:1377–1412` directly this session; compared against Step 31's body | **Honored** — no regression |
| AD-24 | Test/fixture architecture: three tiers, two build-time L11 verifications, no owner-run probes | Read `docs/architecture-phase-a.md:1513–1628` directly this session; compared against Step 40's body and §10A's "Test tier split" entry | **Honored** — no regression |
| AD-26 | Concurrency: WAL + busy_timeout + retry-once + `BEGIN IMMEDIATE` fold | Read `docs/architecture-phase-a.md:1650–1673` directly this session; compared against Step 3, Step 37 | **Honored** — no regression |
| AD-25 | Packaging: two deps, no postinstall, no native code, `tsc` build | Read `docs/architecture-phase-a.md`'s AD-25 section in full this session | **Silent on lockfile policy** — AD-25 does not specify `npm ci` vs `npm install` or a commit-the-lockfile requirement; the Critical finding below is a gap introduced at the plan layer (Step 1's own choice of `npm ci`), not a transcription failure from an architecture decision that already addressed it |

---

## Critical & Serious Findings

### Critical Finding 1 — Step 1 specifies `npm ci` with no `package-lock.json` ever created; the plan's own foundation step and every CI run fail unconditionally on a fresh checkout

**What the plan says.** `docs/plans/plan-phase-a.md:627–650` (Step 1,
"What changes"): creates `package.json` with
`"dependencies": {"web-tree-sitter": "^0.26.13", "tree-sitter-wasms": "0.1.13"}`,
`tsconfig.json`, `tsconfig.test.json`, and a GitHub Actions workflow that
runs `npm ci && npx tsc --noEmit && npx tsc -p tsconfig.test.json && node
--test "dist-test/test/**/*.test.js"` on every PR. Line 664–667 (the same
step's "Verification" field): "`T1-1` (Step-1 build test): from a clean
checkout, `cd middleware/context-oracle/ctxoracle && npm ci && npx tsc
--noEmit && npx tsc -p tsconfig.test.json` exits 0 with no warnings…". The
`T1-1` spec itself, `docs/plans/plan-phase-a.md:4354–4370`: "**Verifies.**
Step 1's package.json + tsconfig produce a clean `npm ci` + `npx tsc
--noEmit` from a fresh checkout… **Fails when** `npm ci` exits non-zero…".

**What the file skeleton actually creates.** `docs/plans/plan-phase-a.md:274–518`
(§5.1, "Every source file named below is created by exactly one §7 step…
Cross-checked mechanically at plan-write time") lists, under
`middleware/context-oracle/ctxoracle/`: `package.json` (Step 1),
`tsconfig.json` (Step 1), then the full `src/`, `test/`, and
`scripts/` trees down to individual test-fixture files — 244 lines,
read in full. **No `package-lock.json`, `npm-shrinkwrap.json`, or any
lockfile artifact appears anywhere in this list.** Step 43's
post-completion housekeeping (lines 3233–3267, read in full) does not
create one either, nor does any other step's "What changes" field
anywhere in the document (grep-confirmed: `package-lock|npm-shrinkwrap|lockfile`
— **0 hits** in the entire 6923-line document).

**How this was verified — by direct execution, per Gate B's
library/tool-behavior-claim rule.** Rather than reasoning from memory
about what `npm ci` requires, this review reproduced the exact scenario
Step 1 and `T1-1` specify: a fresh directory containing only a
`package.json` with a non-empty `dependencies` object and no lockfile —
using npm 10.9.7 (the version bundled with Node v22.22.2, matching the
plan's own stated `engines.node": ">=22.16.0"` runtime family):

```
$ cat package.json
{"name":"npmci-test","version":"1.0.0","dependencies":{}}
$ npm ci
npm error code EUSAGE
npm error
npm error The `npm ci` command can only install with an existing package-lock.json or
npm error npm-shrinkwrap.json with lockfileVersion >= 1. Run an install with npm@5 or
npm error later to generate a package-lock.json file, then try again.
$ echo "exit: $?"
exit: 1
```

`npm ci` refuses to run at all — not "resolves to the wrong version" (the
class of concern round 6 examined for D-plan-2 and correctly left as a
disclosed residual) but an unconditional, immediate, non-zero exit before
any dependency resolution is attempted. This is npm's own documented
`ci` command behavior (deliberately stricter than `npm install`, which
this review separately confirmed the plan itself already relies on
elsewhere for a different purpose — `T40-4`'s cold-container check, line
5849, uses `npm install`, not `npm ci`, and works fine without a
pre-existing lockfile).

**Why this is Critical, not a lower severity.** This is the plan's very
first buildable step (`D-plan-1`: "foundation → deny path → whisper path →
CLI → tests → exit run" — Step 1 has no dependency but itself, and every
one of the other 42 steps' own "Dependencies" fields ultimately chains
back through it). As literally specified:
1. `T1-1`, the acceptance test for the plan's own foundation step, cannot
   pass on a fresh checkout no matter how correctly `package.json` and
   `tsconfig.json` are authored — the failure is in the *command*
   (`npm ci` with no lockfile precondition met), not in the file content
   `T1-1` is nominally checking.
2. The CI workflow Step 1 itself creates
   (`.github/workflows/context-oracle-ctxoracle.yml`) runs the identical
   `npm ci` as its first command on every PR touching the package —
   meaning `D-plan-7`'s entire CI-gating design (unit + convention tests
   on every PR) never executes a single test, because the workflow fails
   before `tsc` or `node --test` ever runs.
3. Checkpoint 1 (line 3293, "After Step 9… run every DAO's
   constraint-negative tests") and every subsequent checkpoint implicitly
   assume Step 1 through N's builds succeed; none can be reached if Step
   1's own build command is broken by construction.

This is exactly the class of defect `CLAUDE.md`'s dominating rule 3 and
the Phase A goal ("running cleanly with no incident") exist to catch
before it reaches an implementer — an agent executing this plan literally,
step by step, "without making a single decision on the fly" (the
`expert-plan` skill's own definition of what a plan must be), hits a hard
failure at the first command of the first step, with the plan offering no
authorization anywhere to create the one file (`package-lock.json`) that
would let that command succeed.

**Named standard violated.** `expert-review`'s own Step 5
library/tool-behavior-claim rule, applied here identically to how round 6
applied it to the semver claim: "resolve the library… read the current
docs/behavior for the specific claim being asserted… memory of API shapes
is unreliable" — `npm ci`'s lockfile precondition is exactly this class of
"familiar tool, too basic to check" fact. Also violates basic reproducible-
build / CI discipline (a CI workflow specified to run on every PR must
actually be executable) and `expert-plan` SKILL.md's requirement that a
plan be concrete enough to execute "without making a single decision on
the fly" — generating and committing a lockfile is a decision the plan
never authorizes, yet every downstream command silently depends on it
having been made.

**What correct implementation looks like.** Add an explicit lockfile step
to Step 1's "What changes": after authoring `package.json`, run `npm
install` once (which both installs `web-tree-sitter`/`tree-sitter-wasms`
and generates `package-lock.json`) and commit the resulting
`package-lock.json` alongside `package.json`/`tsconfig.json`; add
`package-lock.json` to §5.1's file skeleton at Step 1 (with a note that
its content is npm-generated, not hand-authored, matching how the
skeleton already treats other generated artifacts); `T1-1`'s "Data" field
should then read "the `package.json`, `tsconfig.json`, and
`package-lock.json` files committed in Step 1" instead of omitting the
lockfile. Alternatively, if a committed lockfile is deliberately
undesired, Step 1's own build command and the CI workflow must use `npm
install` (as `T40-4` already does) rather than `npm ci`, with the
D-plan-2 tradeoff (reproducibility vs. always-latest-compatible-patch)
stated explicitly as a collapse-tested decision rather than left as an
unexamined command choice.

No Serious findings — the full inventory was Read or Grep-verified per
Compliance Gate B beyond the one Critical finding above, and no other
violation of Serious classification was observed.

---

## Systemic Patterns

**Proactive scans run before classifying.** Having found the Critical
finding's supporting sites (Step 1's "What changes," the CI workflow
description, `T1-1`'s Verification field and its own §12 spec, and
§5.1's file skeleton) and the Moderate finding's two sites (D-plan-2's
§10 heading and Q1's §14.1 disposition), this review ran the following
scans across the full current document before deciding whether either
rises to a verified multi-site Systemic finding:

- `grep -n "npm ci"` — **3 hits** (lines 647, 665, and inside `T1-1`'s
  own spec at line ~4357), all describing the *same single command
  specification* introduced once at Step 1 and referenced by its own
  Verification/T-ID trail — not independently-introduced instances of a
  repeated defect, but one root cause (Step 1's tooling choice) surfacing
  at every place that necessarily quotes it. This does not fit the
  project's established "fix landed at primary site, stale content
  survives at a secondary site" Systemic shape (there was never a
  correct version to diverge from); it is a single design gap with three
  necessary citations, delivered as one Critical finding rather than a
  Systemic pattern.
- `grep -n "(exact)"` restricted to dependency-version context — **2
  hits**: line 3363–3364 (D-plan-2's heading) and, in substance though
  not the literal word, line 6122–6123 (Q1's "Both packages pinned to
  their architecture-verified versions"). Two sites is the minimum for a
  systemic claim, but the second site's wording ("pinned to… versions")
  is genuinely ambiguous — plausibly readable as "fixed to the versions
  the architecture verified" rather than a specific claim about npm range
  syntax — where the first site's wording ("`web-tree-sitter@0.26.13`
  (exact)") is unambiguous and directly contradicts Step 1's own
  `package.json`. Given the second site's ambiguity, this is delivered as
  one Moderate finding with a secondary note, not elevated to a verified
  two-instance Systemic pattern; a reader applying the review's own
  "extrapolation from sample is the failure mode" discipline in the
  other direction should not treat an ambiguous echo as full confirmation
  of a second instance.

**Conclusion: no new Systemic pattern (multi-site, unambiguously verified
by proactive scan) is delivered this round.** Both new defects are
delivered as Critical and Moderate respectively. This continues round 6's
break from rounds 2–5's pattern of a verified multi-site Systemic finding
each round — the "fix landed at primary site, not swept to a secondary
site" shape that dominated rounds 2–6 is not what produced either of this
round's findings; both are previously-unexamined claims (a build-tooling
precondition, a version-pin-style label) rather than a fix's incomplete
propagation.

No systemic patterns beyond those already tracked and closed in prior
rounds — verified by the scans above plus the full read of §1–§16
described in Scope 2.

---

## Moderate & Minor Findings

### Moderate Finding 1 — D-plan-2's own decision heading calls `web-tree-sitter@0.26.13` "(exact)", contradicting Step 1's package.json and D-plan-2's own corrected collapse-test

**What the plan says.** `docs/plans/plan-phase-a.md:3363–3364` (§10,
"Decisions made during planning"): *"**D-plan-2 — Package deps floor:**
`web-tree-sitter@0.26.13` **(exact)**, `tree-sitter-wasms@0.1.13`
**(exact)**."*

**What Step 1 and §3 actually say.** `docs/plans/plan-phase-a.md:630`
(Step 1's "What changes"): `"dependencies": {"web-tree-sitter":
"^0.26.13", "tree-sitter-wasms": "0.1.13"}` — `web-tree-sitter` carries a
caret (a floor/range), `tree-sitter-wasms` does not (an exact pin). §3's
own Standards registry (lines 207–209, corrected this fix pass, round 6)
already draws this distinction precisely and correctly: *"the plan floors
at 0.26.13 for `web-tree-sitter`… and pins 0.1.13 for
`tree-sitter-wasms`"* — "floors" for the caret-ranged package, "pins" for
the exact one. D-plan-2's own §10A collapse-test three sections below the
heading in question (lines 3559–3588, itself corrected this round-6 fix
pass) is now entirely built around this exact distinction: its Hardest
question asks "given the caret and an exact pin at `0.26.13` are
therefore behaviorally identical for a default install, does the pin's
`^` prefix do anything beyond documentation?" — a question that
presupposes `web-tree-sitter`'s pin is a caret, not an exact pin, directly
contradicting its own entry's heading three sections above.

**How this was verified.** Read line 630 (Step 1's actual `package.json`
dependency object) directly. Read lines 207–209 (§3) directly. Read lines
3363–3372 (D-plan-2's §10 heading and reasoning) and lines 3559–3588
(D-plan-2's §10A collapse-test) directly. Grepped `web-tree-sitter.{0,40}exact|exact.{0,40}web-tree-sitter`
— **1 hit** (the defective line 3363). Grepped `pinned to|pins? 0\.1\.13|floors at 0\.26`
across the document — 4 hits (lines 208–209, 1951, 3363, 6123), of which
only §3 (208–209) and line 1951 use the "floors/pins" distinction
correctly; line 3363 (this finding) and line 6123 (the weaker secondary
echo, noted in Scope 1 above) both blur it.

**Why this is a finding, not a stylistic nit.** This is a version of the
exact "fix landed at one site, contradicts an unswept sibling site"
pattern this document's collapse-log has tracked across six rounds — here
inverted: round 6's fix correctly rewrote D-plan-2's *collapse-test* body
(§10A) around the real caret semantics but never touched D-plan-2's own
*heading* three sections above it (§10), which still asserts the opposite
characterization in the same decision entry. A reader who reads only the
one-line §10 summary (the document's own quick-reference layer, distinct
from the full §10A collapse-test) is told both packages are exactly
pinned — which is false for `web-tree-sitter` and was already known to be
false by the time round 6's fix landed three sections later in the same
decision.

**Named standard violated.** The document's own established, correct
convention (§3's "floors… pins" distinction, itself introduced this
project's round-6 fix pass) and `CLAUDE.md`'s "verify before you assert"
rule, applied here to an internal cross-reference within the same
numbered decision rather than to an external fact.

**What correct implementation looks like.** Rewrite line 3363–3364 to:
*"D-plan-2 — Package deps floor: `web-tree-sitter@^0.26.13` (caret floor,
locked to the `0.26.x` line), `tree-sitter-wasms@0.1.13` (exact)."* And
soften Q1's line 6122–6123 ("Both packages pinned to their
architecture-verified versions") to name the same distinction explicitly,
e.g. "Both packages fixed to their architecture-verified versions
(`web-tree-sitter` via a caret floor, `tree-sitter-wasms` via an exact
pin)" — closing the weaker secondary echo at the same time.

No other Moderate or Minor findings — verified by the full read of
§1–§16, the T-ID cross-checks in §12.1–12.5, and the targeted grep scans
described in Scope 2 and Systemic Patterns above.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified
per Compliance Gate B, including the Critical finding's `npm ci`
behavior claim, which was resolved (not left tentative) by directly
executing `npm ci` against the exact scenario the plan specifies, and the
Moderate finding's citation contradiction, which was resolved by direct
Read of all three implicated line ranges rather than left as a suspected
inconsistency.

---

## What's Actually Good

- **Round 6's semver correction is genuinely sound, independently
  reproduced from scratch this round rather than trusted.** D-plan-2's
  and §14.2's rewritten text about `^0.26.13` excluding `0.27.0` matches
  a fresh, independent `semver@7.8.5` installation and execution in a new
  scratch directory (not reusing round 6's install or transcript).
  **Verified by:** direct execution, this session, of
  `semver.satisfies`, `semver.validRange`, and `semver.maxSatisfying`
  against the exact values the plan discusses. **Standard:** the same
  discipline `expert-review`'s Step 5 requires for library-behavior
  claims, applied here as a positive finding because the claim holds up
  under independent re-execution rather than merely being re-read.
- **§12's T32-2 (the `VACUUM INTO` round-trip test) models the correct
  discipline for a tool-behavior claim that this document's Step 1
  `npm ci` claim should have followed.** Its "NOT asserts" field quotes
  `sqlite.org/lang_vacuum.html` directly with a fetch date, explaining
  precisely why byte-identity is not the right assertion and what the
  correct one (record-identity per row) is instead. **Verified by:**
  Read of lines 5656–5665, cross-referenced against the plan's own §11
  verification-of-claims discipline. **Standard:** `expert-review`'s Step
  5 library-behavior-claim rule, met here rather than skipped — this is
  exactly the standard the Critical finding above shows was not applied
  to the `npm ci` claim.
- **Every architecture-decision spot-check this task named (AD-5, AD-9,
  AD-10, AD-14, AD-20, AD-24, AD-26) matches `docs/architecture-phase-a.md`'s
  current text with no drift, across seven rounds of fix passes now.**
  **Verified by:** direct Read of each architecture section's exact line
  range this session, cross-checked against the plan's current citations
  (Upstream Contract Verification table, above). **Standard:** the same
  premise-verification discipline this review applies to every claim,
  applied here as a positive finding because the citations hold up.

---

## Recommended Priority

1. **Critical Finding 1 (the `npm ci` / missing lockfile failure).** Fix
   first and before implementation begins — this blocks the plan's very
   first step and every CI run from ever succeeding, and is upstream of
   every other checkpoint in the document. Either add a committed
   `package-lock.json` to Step 1 (and §5.1's skeleton), or switch Step
   1's build command and the CI workflow to `npm install` (matching
   `T40-4`'s existing precedent) with the resulting tradeoff named
   explicitly in D-plan-2.
2. **Moderate Finding 1 (D-plan-2's "(exact)" mislabeling).** One-line
   fix at §10 (lines 3363–3364), plus a small wording tightening at Q1
   (§14.1, lines 6122–6123).

---

## Verdict

Verdict: NEEDS FIXES (2 findings: 1 Critical, 1 Moderate)
