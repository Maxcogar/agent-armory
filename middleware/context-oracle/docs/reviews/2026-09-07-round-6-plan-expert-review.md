# Expert review (round 6, re-review) — `docs/plans/plan-phase-a.md`

**Date:** 2026-09-07
**Reviewer:** fresh independent `/expert-review` pass; not the plan-writer,
not the author of any of the ten prior review documents on this artifact,
no prior context on this session.
**Artifact:** `/home/user/agent-armory/middleware/context-oracle/docs/plans/plan-phase-a.md`
at its current state on branch `claude/plan-correction-strategy-57ot28` —
commit `ddfddc6` ("context-oracle: fix round-5 expert-review findings"),
6870 lines, read in full across sequential `Read` calls with no gaps.
**Round:** 6 (re-review of round 5's collapse-hunt fix (`c67cf8c`) and
round 5's expert-review fix (`ddfddc6`), per the Re-Review Protocol in
`middleware/context-oracle/.claude/commands/expert-review.md` — the
project-scoped copy, read first, in full, per this task's instruction).
Round 1: 10 findings, all fixed. Round 2: 9 findings (1 Systemic × 7
instances, 2 Serious, 1 Moderate, plus the Q-gap-5 overclaim), all fixed.
Round 3: NEEDS FIXES (1 Systemic × 2 instances, 2 Moderate, 1 Minor), all
fixed; companion collapse-hunt found 2 collapses + 2 partials, also fixed.
Round 4: NEEDS FIXES (1 Systemic pattern spanning 2 instances), all
fixed; companion collapse-hunt found 2 collapses, also fixed. Round 5:
NEEDS FIXES (1 Systemic pattern spanning 2 instances at 6 locations, 1
Minor), all fixed; companion collapse-hunt found 2 collapses (1 fully
accurate, 1 incomplete — the incompleteness is exactly what round 5's
expert-review caught). **This round independently re-verifies every
round-5 finding as genuinely closed against current source, and — per
this task's explicit instruction to use an independently-designed
search strategy rather than re-running round 5's exact grep patterns —
finds 4 new defects in surfaces no prior round's targeted-read scope
named**, detailed below.

---

## Scope and Inventory

### Tool-plan disclosure

`ToolSearch` for CodeGraph/Clear Thought was not re-invoked this round —
this round's task is scoped to verifying textual/structural claims about
a Markdown planning document (literal-content and absence claims, per
Step 5 of the process document), the same disposition every prior round
recorded, and round 3 already independently reproduced the Q-gap-5 MCP
protocol claim by direct stdio invocation. Every claim below is
verified by Read (file:line, this session) or Grep (query + result
count, this session) or a direct executable check (the `semver` npm
package, installed and run this session) — never memory, never trust in
a prior review's or the plan's own attestation.

### Scope 1 — Round 5's finding-groups, as closure items

- [x] **Round-5 collapse-hunt Collapse 1 (§3's Standards registry cited
  Step 32 for SQLite WAL/concurrency; concurrency is Step 37).** Read
  line 230 (current): "Governs Step 37 (concurrency) — corrected this
  fix pass, round 5..." Grep-confirmed `Governs Step 32|Step 32
  \(concurrency\)` — 0 hits in the current document. Cross-checked
  against Step 37's own heading (line 2802, `### Step 37 — Concurrency:
  WAL retry-once + directory locks`) and body (WAL/`busy_timeout`/
  retry-once/ULID content). **Closed.**
- [x] **Round-5 collapse-hunt Collapse 2 / round-5 expert-review
  Systemic Instance A (the `init` verb misattributed to "Step 30" at
  five sites: §5.3, Step 2, Step 8, Step 23, Step 29).** Grepped the
  current document for `Step 30's \`init\`|Step 30 \(the \`init\`` —
  **0 hits**. Read all five sites directly at their current line
  numbers: §5.3 (line 530: "the runtime effect of Step 31 (the `init`
  verb)"), Step 2 (lines 683–686: "Both are called from Step 31's
  `init` verb"), Step 8 (lines 1090–1094: "blocks Step 31's `init`
  entirely"), Step 23 (lines 2055–2058: "blocks Step 31's `init`
  entirely"), Step 29 (lines 2383–2384: "via Step 31's `init`"). All
  five now correctly cite Step 31 and all five carry an explicit
  "corrected this fix pass, round 5" annotation. Also grepped `Step
  30\b` (15 hits, all now correctly referring to Delivery per Step
  30's own heading at line 2421) and `Step 31\b` (17 hits, all
  correctly referring to CLI/`init`). **Closed, genuinely — this is
  the sharpest possible test of round 5's own finding, since round 5's
  entire point was that a prior sweep's "only these two were wrong"
  attestation was itself false; this round's independent grep across
  the full current document confirms zero remaining instances of the
  defect class.**
- [x] **Round-5 expert-review Systemic Instance B (§10A's "Test tier
  split" entry — Job/Steers-toward fields contradicted the
  round-4-corrected Answer field).** Read the full entry (current
  lines 3757–3797). Job (line 3763): "...build-time static records for
  the two owner-environment premises the tool cannot verify from
  inside its own process at build time (L11(a) already measured;
  L11(b) resolved by design-safety analysis plus a runtime
  counter...)". Steers toward (lines 3792–3793): "...the two L11
  static records referenced as resolved evidence, not run as pre-exit
  tasks..." Both now consistent with the Answer field (lines
  3765–3780). Grep-confirmed `"markdown probe"|"build-time probe"`
  (case-insensitive) — 2 hits remaining, both inside §10's D-plan-6
  entry (lines ~3394, ~3433), both explicitly past-tense describing
  the *retracted* design ("Prior wording proposed two owner-run
  markdown probes"), not live claims. **Closed.**
- [x] **Round-5 expert-review Minor finding (Step 38's `oracleSpawn`
  paragraph duplicated verbatim).** Read Step 38 in full (lines
  2850–2936). The paragraph appears once, in "What changes" (lines
  2883–2889). The "Impact if wrong" field (lines 2929–2936) now reads:
  "The `oracleSpawn` wrapper requirement is stated once, in 'What
  changes' above — removed a verbatim-duplicate restatement here this
  fix pass, round 5 (expert-review Minor finding)." Grep-confirmed the
  distinguishing phrase "cannot be forgotten at the first real spawn
  site this seam introduces" — 1 hit (down from round 5's finding of
  2). **Closed.**

**Scope 1 result: every round-5 finding (both from the concurrent
collapse-hunt and the expert-review) is genuinely closed against
current source, verified by direct Read and Grep rather than by
trusting the plan's own "corrected this fix pass" annotations.**

### Scope 2 — Full-document regression scan (mandatory full read, not sampled)

- [x] Front matter + §1 Goal + §2.1/2.2 Scope (lines 1–154) — Read in
  full. No defect.
- [x] §2.3 Coverage reconciliation table (lines 155–172) — Read in
  full; every cited step cross-checked against its own `###` heading
  (Step 25, Steps 21/22, Step 30/Step 19, Steps 10/36/33, Step 11,
  Steps 34/35, Steps 13/15/38, Step 42). No defect.
- [x] §2.4–§4, including §3's Standards registry (lines 173–252) —
  Read in full. **New finding: line 210–211's "(recorded in the
  plan's Question register as bin 1 answered)" is stale — see Moderate
  Finding 1, below.**
- [x] §5/§5.1–§5.5 file skeleton (lines 253–566) — Read in full,
  every `# Step N` comment cross-checked against the constructing
  step's own heading. §5.3's `init`/Step 31 citation confirmed fixed
  (Scope 1, above). No new defect.
- [x] §6, §8 (lines 567–618) — Read in full. No defect.
- [x] §7 Steps 1–43 + Step 2.5, every step body in full (lines
  620–3260, across eight sequential `Read` calls with no gaps) —
  cross-checked every `Step N` cross-reference inside each step's own
  prose against the step's own construction target, and every T-ID
  cited in a step's Verification field against its own §12 entry. No
  remaining "Step 30's `init`" instances (Scope 1). **New finding:
  D-plan-1's dependency-ordering note at Step 2.5 (line 726–731) and
  the "S1 fixed at Step 31/32" reference at line 3964 were both
  re-read in context and found accurate (historical, correctly
  worded) — not a defect, noted here because their phrasing initially
  looked similar to the Step-30/31 defect class and was independently
  re-verified as sound.**
- [x] §9 Checkpoints (lines 3262–3306) — Read in full; Checkpoint 3's
  "After Step 30 (delivery)" is correct. No defect.
- [x] §10 Decisions D-plan-1..8 (lines 3308–3450) — Read in full.
  **New finding: D-plan-2 (lines 3549–3567) rests on an unverified
  and, on direct verification, false claim about npm semver caret-range
  behavior — see Moderate Finding 2, below.**
- [x] §10A collapse-tests, every D-plan-* and N1–N6 entry in full
  (lines 3452–4000) — Read in full. Test tier split entry confirmed
  fixed (Scope 1). No other stale field found in any other §10A entry.
- [x] §11.1–§11.6 (lines 4002–4280) — Read in full. Every V-claim's
  quoted text cross-checked verbatim against `docs/architecture-phase-a.md`'s
  actual V1–V19 table (lines 124–143, Read directly this session): V1,
  V3, V5, V6, V7, V8, V12, V13, V14, V17, V19 all match verbatim. AD-2,
  AD-4, AD-10, AD-19 quotes also verified verbatim against their
  architecture sections. No defect.
- [x] §12.1 Unit tier, T1-1 through T43-1 (lines 4295–5023) — Read in
  full, cross-checked each `Verifies`/`File` field against the step it
  names and against §5.1's file skeleton. No defect.
- [x] §12.2–§12.4, T16-1 through T40-6 (lines 5024–5862) — Read in
  full. No defect.
- [x] §12.5 Coverage attestation, both mapping tables (lines
  5863–5969) — Read in full; every AC→T-ID row and every Step→T-ID row
  cross-checked against the T-ID's own §12 entry and the step's own
  Verification field. No defect.
- [x] §13 Risks R1–R10 (lines 5971–6084) — Read in full; each
  "Mitigation" step citation cross-checked against the named step's
  actual content. No defect.
- [x] §14.1 Bin 1 (lines 6092–6192), §14.2 Bin 2 (lines 6194–6240),
  §14.3 Bin 3 (lines 6242–6292), §14.4 Reconciliation sweep (lines
  6294–6428) — all Read in full. **New findings: Q1's "Retracted"
  disposition (§14.1) is inconsistent with §3's "bin 1 answered"
  citation (Moderate Finding 1); §14.2's web-tree-sitter entry
  (lines 6203–6214) repeats D-plan-2's false semver claim and adds a
  second textual defect, an apparently garbled phrase
  ("`.mcp.json`-registry re-check," line 6212 — Minor Finding 2);
  §14.4's sweep-record narrative has Pass G through Pass K (rounds
  1–4) but no entry for round 5's fix pass (Minor Finding 1).**
- [x] §15 Gaps acknowledged, Q-gap-1 through Q-gap-6 in full (lines
  6431–6791) — Read in full. No new defect; Q-gap-5's disposition
  re-read and consistent with STATUS.md and collapse-log.md's account.
- [x] §16 Post-completion (lines 6795–6870, end of document) — Read in
  full. No defect.
- [x] `docs/reviews/2026-09-07-round-5-plan-collapse-hunt.md` (356
  lines) and `2026-09-07-round-5-plan-expert-review.md` (646 lines) —
  both Read in full, first, before touching the plan.
- [x] `docs/reviews/2026-09-07-round-4-plan-collapse-hunt.md`,
  `-round-4-plan-expert-review.md`, `-round-3-plan-collapse-hunt.md`,
  `-round-3-plan-expert-review.md`, `-round-2-plan-collapse-hunt.md`,
  `-round-2-plan-expert-review.md`, `2026-09-06-plan-collapse-hunt.md`,
  `2026-09-06-plan-expert-review.md` — consulted for historical
  trajectory context per the task's instruction; the two 2026-09-06
  documents and the round-4/round-5 "meta-check" style documents were
  additionally grepped for the specific `caret`/`0.27.0`/`semver`
  phrasing (see Moderate Finding 2 — this defect has survived
  unchecked since 2026-09-06's original authoring and two intervening
  review generations).
- [x] `docs/specs/spec-context-oracle.md` §14 (lines 908–1138) — Read
  in full.
- [x] `docs/architecture-phase-a.md` AD-5 (568–645), AD-9 (736–922),
  AD-10 (924–945), AD-14 (1073–1128), AD-20 (1377–1412), AD-24
  (1513–1628), AD-26 (1650–1673) — all Read in full, per this task's
  explicit spot-check list, and cross-checked directly against the
  plan's current citations of each.
- [x] `docs/STATUS.md` (336 lines) — Read in full.
- [x] `OWNER-LEDGER.md` (81 lines) — Read in full.
- [x] `docs/collapse-log.md` — all 2026-09-07 entries (lines 1–345),
  plus a further read to line 924 for historical context. Read in
  full for the in-scope portion.
- [x] `middleware/context-oracle/CLAUDE.md` — Read in full.
- [x] `middleware/context-oracle/.claude/commands/expert-review.md`
  (226 lines) — Read in full, first.
- [x] The `semver` npm package (v7.8.5, installed this session in a
  scratch directory) — run directly (`semver.satisfies('0.27.0',
  '^0.26.13')` → `false`; `semver.validRange('^0.26.13')` →
  `>=0.26.13 <0.27.0-0`) to verify the library-behavior claim
  underlying Moderate Finding 2, per Gate B's requirement that a
  library-behavior claim be verified against a current authoritative
  source, not asserted from memory.

**Rigor waivers:** none. **Instrument unavailability:** CodeGraph/Clear
Thought were not re-invoked this round; disclosed, non-gating, per every
prior round's disposition. The `semver` package was not available
pre-installed in this environment; it was installed fresh in a scratch
directory (`/tmp/semvertest`) specifically to verify Moderate Finding
2's premise rather than asserting it from memory of semver rules — this
is exactly the "verify, don't assert" discipline Gate B requires for a
library-behavior claim.

---

## Summary

**This review returns NEEDS FIXES.** Every finding from round 5's
collapse-hunt and expert-review — the five-site "Step 30's `init`"
misattribution, the "Test tier split" entry's stale Job/Steers-toward
fields, and the Step 38 duplicated paragraph — is genuinely closed
against current source, verified this round by independent Read and
Grep rather than by trusting the plan's own "corrected this fix pass"
annotations (the exact discipline round 5's own history shows is
necessary: round 5's collapse-hunt attested "48 citations checked, only
these two were wrong" and was itself wrong). This round's full-document
regression scan, using its own independently-designed search strategy
rather than re-running round 5's grep patterns, surfaced four new
defects that no prior round named: (1) a stale cross-reference in §3
that still calls the web-tree-sitter version-bump question "bin 1
answered" after meta-check H5 reclassified that exact question to bin-2
in §14.2 and Q1's own §14.1 disposition was changed to "Retracted" — the
same "fix landed at its primary site, not swept to every
cross-referencing surface" pattern this project has tracked across five
prior rounds, now at a sixth; (2) an unverified and, on direct
verification with the `semver` npm package, factually false claim that
the caret range `^0.26.13` "accepts 0.27.0 anyway" — real npm semver
semantics resolve `^0.26.13` to `>=0.26.13 <0.27.0-0`, strictly
excluding 0.27.0, a claim this plan's own D-plan-2 collapse-test and
§14.2's owner-facing options list both repeat, and which has gone
unverified since the plan's original 2026-09-06 authoring, surviving
two intervening review generations (the 2026-09-06 meta-check and
collapse-hunt both repeated the same unchecked claim); (3) the §14.4
reconciliation-sweep narrative records a "Pass" entry for each of
rounds 1 through 4 but has no entry for round 5's fix pass, the
identical documentation-completeness gap round 4's own expert-review
found and fixed for the analogous Pass J/K omission; and (4) a Minor
textual defect in §14.2 ("this session's `.mcp.json`-registry
re-check") that appears to be a garbled reference to the npm-registry
check actually documented at §11.4. None of the four rises to Critical,
Serious, or a verified multi-site Systemic pattern in its own right —
finding 1 is a single new site of the known recurring class, and
finding 2, while appearing at two sites, is a single conceptual defect
(an unverified premise) rather than a fix-not-propagated defect — but
per the skill's mechanical rule, any Moderate-or-above finding forces
NEEDS FIXES, and this round has two.

---

## Upstream Contract Verification

**Spec §14 acceptance criteria.** No new AC mapping was touched by
round 5's fix passes or this round's own findings (all four are
citation-text or reasoning-integrity defects, not AC-scope changes).
Re-read spec §14 (lines 908–1138) in full this session; re-confirmed
AC-9 (line 5896: `T18-1, T33-1, T10-1`) and AC-2 (line 5878: `T15-2`)
are unaffected and consistent with §12.5's mapping table. No regression
in the AC↔T-ID mapping table.

**Architecture design decisions this round's own findings turn on, and
the seven this task explicitly named for spot-check:**

| AD | What it decides | Verification method | Verdict |
|---|---|---|---|
| AD-5 | `tuning`'s WRITER is "seeded at init, changed via `tune`" (AD-20) | Read `docs/architecture-phase-a.md:604–613` directly this session; compared against Step 8 (line 1078–1094) and Step 23 (line 1973–2066) | **Honored** — round 3/4's fix holds; no regression |
| AD-9 | Question intake, recognizers, deny decision, `deny_bypass_suspect` both-direction disclosure | Read `docs/architecture-phase-a.md:736–922` directly this session; compared against Step 14, Step 16, Step 18, Step 33 | **Honored** — no regression; both-direction disclosure intact at line 6626–6632 |
| AD-10 | Deny confinement: one producer, structurally, via built-output grep | Read `docs/architecture-phase-a.md:924–945` directly this session; compared against Step 15 (`T15-2`) and Step 41 | **Honored** — no regression |
| AD-14 | The relevance bar: conjunction of floors, ship-high illustrative defaults | Read `docs/architecture-phase-a.md:1073–1128` directly this session; compared against Step 23's own corrected sourcing text and Step 24's combinator | **Honored** — Step 23's four-sourced/two-unsourced split matches AD-14's own text exactly |
| AD-20 | `init`/`deinit` CLI spec: environment checks, key derivation, hook wiring, first index, `tune` | Read `docs/architecture-phase-a.md:1377–1412` directly this session; compared against Step 31's body (items 1–6) | **Honored** — `init` is unambiguously Step 31's construction target, confirming Scope 1's finding that the five remaining "Step 30's `init`" misattributions are now fully swept |
| AD-24 | Test/fixture architecture: three tiers, two build-time L11 verifications, no owner-run probes | Read `docs/architecture-phase-a.md:1513–1628` directly this session; compared against Step 40's body and §10A's "Test tier split" entry | **Honored** — the entry's Job/Steers-toward/Answer fields are now internally consistent (Scope 1) |
| AD-26 | Concurrency: WAL + busy_timeout + retry-once + `BEGIN IMMEDIATE` fold | Read `docs/architecture-phase-a.md:1650–1673` directly this session; compared against Step 3, Step 37, §3's Standards registry | **Honored** — §3's Step 32→37 citation fix (Scope 1) is accurate and complete |

---

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or
Grep-verified per Compliance Gate B, and no violation of Critical or
Serious classification was observed. The `semver`-verified premise
error (Moderate Finding 2) does not rise to Serious because its
practical effect is the opposite of harmful: the real behavior of
`^0.26.13` is more conservative (locked to the 0.26.x line) than the
plan's text believes, so no functional drift risk exists that the
plan's false premise failed to guard against — the defect is in the
plan's own stated reasoning and in what it tells Max Cogar about his
options, not in the shipped dependency behavior.

---

## Systemic Patterns

**Proactive scans run before classifying.** Having found one new
instance of the project's long-tracked "fix not swept to every
cross-referencing surface" pattern (Moderate Finding 1) and a
two-site unverified-premise defect (Moderate Finding 2), this review
ran the following scans across the full current document before
deciding whether either rises to a verified multi-site Systemic
finding this round:

- `grep -n "bin 1 answered\|bin-1 answered"` — **1 hit** (line 211,
  Moderate Finding 1's site). No second site found; this is a
  single-location defect this round, not a multi-site Systemic
  instance.
- `grep -n "accepts 0.27.0\|accepts either\|newest-compatible"` — **4
  hits**, resolving to exactly 2 conceptual sites: D-plan-2 (lines
  3553, 3555) and §14.2 (lines 6203, 6205) — both restating the same
  single false premise about caret-range semantics, not two
  independently-introduced defects one of which was "fixed" and left
  unswept elsewhere. This is a duplicated unverified premise, not the
  project's established "fix landed at primary site, stale content
  survives at a secondary site" shape — there was never a fix here to
  begin with; the claim has been wrong, identically, in both places
  since original authoring.
- `grep -n "Pass [A-K]" plan-phase-a.md` (§14.4 scope) — 11 hits
  (Pass A through Pass K), confirming the sweep-record narrative's
  own structure: one entry per round/pass, with no Pass L. This is a
  single omission (an entry never added), not stale content
  surviving after a fix — it does not fit the "fix not swept" shape
  either, though it is the identical *class* of documentation-
  completeness gap round 4's own expert-review found (and fixed) for
  the Pass J/K omission at that time.

**Conclusion: no new Systemic pattern (multi-site, verified by
proactive scan) is delivered this round.** All four findings below are
delivered as Moderate or Minor. This is a genuine break from rounds
2–5's pattern, each of which found and fixed a verified multi-site
Systemic instance — round 6's full-document scan did not reproduce
that shape this time, though finding 1 is drawn from the same root
cause (a correction applied at one site without checking every
cross-reference to the corrected fact) and should be read as a
continuation of that lineage even though it is single-site this round.

No systemic patterns beyond those already tracked and closed in prior
rounds — verified by the scans above plus the full read of §1–§16.

---

## Moderate & Minor Findings

### Moderate Finding 1 — §3's Standards registry still calls the web-tree-sitter version-bump question "bin 1 answered" after it was reclassified to bin-2

**What the plan says.** `docs/plans/plan-phase-a.md:204–211` (§3, "npm
packages"): *"Architecture V14 verified 0.26.13 / 0.1.13 on 2026-08-29
— the plan floors at 0.26.13 for `web-tree-sitter` (the architecture's
tested version) and pins 0.1.13 for `tree-sitter-wasms`; bumping
`web-tree-sitter` to 0.27.0 is a Step-1 owner-visible choice (recorded
in the plan's Question register as bin 1 answered)."*

**What the current Question register actually says.** Two entries
address this exact topic, and neither reads "bin 1 answered":

1. `docs/plans/plan-phase-a.md:6094–6101` (§14.1, Q1): *"Q1 (Step 1).
   Should the plan floor `web-tree-sitter` at V14's 0.26.13 or the
   current 0.27.0? **Bin.** Was posed as bin-1... **Disposition.**
   Retracted at D-plan-2: version selection is not the planner's to
   make."* — Q1's own disposition is **"Retracted,"** not "answered."
2. `docs/plans/plan-phase-a.md:6194–6214` (§14.2, opening this
   section): *"Two entries (corrected — meta-check H5 found these
   mis-classified as bin-1 dispositions when SKILL.md's own bin-2
   test... applies to both)"* followed by the *"web-tree-sitter
   dependency floor (Step 1, D-plan-2)"* entry itself — presented as
   an open **bin-2** (owner-decision) item, with three options and an
   explicit *"Flagged for Max Cogar"* line.

**How this was verified.** Read §3 in full (lines 179–252). Read §14.1
Q1 in full (lines 6094–6101). Read §14.2's opening frame and the
web-tree-sitter entry in full (lines 6194–6214). Grepped `bin 1
answered|bin-1 answered` across the whole current document — 1 hit,
the §3 citation itself. Grepped `web-tree-sitter dependency floor` — 1
hit, confirming the topic exists in exactly one place in the register
(§14.2) under its current bin-2 classification, with Q1 in §14.1
addressing a related-but-distinct framing of the same underlying
choice (whether the *plan* should have picked a different floor value
at all) and reaching "Retracted," not "answered," either way. §3's
parenthetical does not correctly describe either register entry's
actual current disposition.

**Why this is a finding, not a stylistic nit.** This is the identical
defect class `docs/collapse-log.md`'s five 2026-09-07 entries (rounds
2 through 5) name repeatedly: content corrected at its primary site
(here, meta-check H5's bin-1→bin-2 reclassification, landed at §14.2)
was not swept to a secondary surface that independently restates the
same fact (§3's own citation of the register). A reader who checks §3
to learn where the version-bump question sits in the register is told
"bin 1 answered" — a disposition that resolves to neither of the two
actual entries on the topic. `docs/STATUS.md`'s next rewrite should
not inherit "bin 1 answered" from §3 without checking the register
directly, which is exactly the failure this project's collapse-log
exists to prevent from propagating further.

**Named standard violated.** `expert-plan` SKILL.md's
reconciliation-sweep discipline (the same standard rounds 2–5's
Systemic findings were evaluated against), and `CLAUDE.md`'s "verify
before you assert" rule, applied here to a cross-reference rather than
a direct factual claim.

**What correct implementation looks like.** Rewrite line 211 to match
the current register, e.g.: *"bumping `web-tree-sitter` to 0.27.0 is a
Step-1 owner-visible choice, recorded as an open bin-2 item at §14.2
(default: keep the caret, per the current recommendation), with the
prior bin-1 framing of the question (§14.1 Q1) retracted as not the
planner's call to begin with."*

**Provenance.** The register was correctly updated (meta-check H5,
recorded in Pass G of §14.4) but §3's own cross-reference to it was
never revisited at that time or in any of the five subsequent review
rounds — none of which read §3's "npm packages" paragraph closely
enough to notice the stale parenthetical (the same shape round 5's own
collapse-hunt named: defects surviving in sections outside every prior
round's targeted-read scope).

---

### Moderate Finding 2 — D-plan-2 and §14.2 both rest on an unverified, and directly falsifiable, claim about npm semver caret-range behavior

**What the plan says.** `docs/plans/plan-phase-a.md:3552–3556`
(§10A, D-plan-2's collapse-test, "Hardest question"/"Answer"): *"Pinning
at the architecture-verified version is drift theater — the caret in
`^0.26.13` accepts 0.27.0 anyway, so the pin protects nothing. ...The
caret is deliberate: 0.27.0 is semver-compatible and works, but the
floor at 0.26.13 makes it possible to reproduce V14's exact-verified
surface..."* And `docs/plans/plan-phase-a.md:6203–6209` (§14.2): *"The
plan ships `^0.26.13` (accepts either). Options: (a) keep the caret as
written — current behavior, lets `npm install` resolve to whatever's
newest-compatible..."*

**How this claim was verified — and found false.** npm's own caret-range
semantics (documented at the `node-semver` specification, the reference
implementation npm itself uses) state that for a pre-1.0 version `0.y.z`
where `y` is nonzero, `^0.y.z` is anchored at the **minor** version: it
allows patch-level movement within `0.y.x` but excludes `0.(y+1).0` and
above. This session installed the `semver` npm package (v7.8.5) fresh in
a scratch directory and ran it directly against exactly the range and
version this plan discusses:

```
$ node -e "const semver=require('semver');
  console.log('0.27.0 satisfies ^0.26.13:', semver.satisfies('0.27.0','^0.26.13'));
  console.log('range:', semver.validRange('^0.26.13'));"
0.27.0 satisfies ^0.26.13: false
range: >=0.26.13 <0.27.0-0
```

`^0.26.13` **excludes** `0.27.0`. A plain `npm install` against this
plan's own `package.json` (Step 1, line 625: `"web-tree-sitter":
"^0.26.13"`) can never resolve to `0.27.0` — it is locked to the
`0.26.x` line, full stop. The plan's central premise — that the caret
"accepts 0.27.0 anyway," making the pin's protective value illusory —
is the opposite of what real npm semver semantics do.

**A related, self-contained inconsistency this exposes.** D-plan-2's
own "Steers toward" field (lines 3562–3564), two lines below the false
premise, says the correct thing without noticing the contradiction:
*"Install times matching V14's tested surface by default, with the
option to install 0.27.0 explicitly when the implementer wants its
behavior."* This is accurate — under real semver rules, a default
`npm install` stays on `0.26.x`, and reaching `0.27.0` requires an
explicit, deliberate act (an exact version install or a `package.json`
edit) — but it directly contradicts the "Hardest question"/"Answer"
pair three lines above it, which frames the caret as something that
already "accepts 0.27.0 anyway." The same entry asserts both that the
caret is porous (early) and that it isn't (later), because the false
premise was never checked against an actual semver evaluator.

**How this was verified as new, not previously caught.** Grepped
`docs/reviews/*.md` for `caret|0\.27\.0|semver` — hits in
`2026-09-06-meta-check-skipped-steps.md` and
`2026-09-06-plan-collapse-hunt.md`. Read both in context: the
2026-09-06 meta-check (lines 311–322) repeats the same unchecked
framing ("the plan resolves it by writing `^0.26.13` (accepting
either)"), and the 2026-09-06 collapse-hunt (lines 703–712) repeats
it too ("the caret accepts any semver-compatible version... the caret
is a soft commitment the ecosystem has agreed on. Survives as a
floor"). Neither ran an actual semver check; both accepted the premise
as given and reasoned about its *consequences* rather than its
*truth*. This is the first review pass in this document's six-round
history to actually execute a semver evaluator against the specific
claim.

**Why this matters, precisely.** The practical consequence is benign —
the real behavior (locked to `0.26.x`) is safer than the plan believes,
not riskier, so Phase A's actual dependency resolution is not
threatened. What is actually wrong is narrower but real: (1) D-plan-2's
own collapse-test — the mechanism `CLAUDE.md` rule 2 requires to prove a
decision isn't hollow — poses a "hardest question" that isn't real (the
caret was never actually porous) and answers it by partially conceding
a false premise, so the collapse-test does not establish what it claims
to; the *actual* hardest question this decision should answer —
"given the caret and an exact pin at `0.26.13` are behaviorally
identical for a `0.26.x` package under real semver rules, does the
pin's `^` prefix do anything beyond documentation?" — was never asked.
(2) §14.2 hands Max Cogar three options with a materially incorrect
description of option (a)'s actual behavior ("lets `npm install`
resolve to whatever's newest-compatible" implies drift risk to
`0.27.0` that cannot occur), which is exactly the kind of technically
inaccurate framing that makes an owner-facing bin-2 disclosure
misleading, even where the ultimate recommendation (keep the default)
happens to be reasonable regardless.

**Named standard violated.** `expert-review`'s own Step 5
library-behavior-claim rule ("resolve the library... and read the
current docs for the specific behavior being asserted... memory of API
shapes is unreliable") — applied here to a versioning-tool specification
rather than a runtime library, the same class of claim the rule
targets. Also `CLAUDE.md`'s "verify external facts... against current
primary sources before building on them."

**What correct implementation looks like.** Rewrite D-plan-2's Hardest
question to state the real fact (`^0.26.13` locks to `0.26.x`,
verified via `node-semver`/npm's own caret-range specification) and
re-derive the Answer around the real tradeoff (exact-pin vs. caret is a
documentation/intent distinction for a `0.y.z` package, not a
drift-risk distinction); correct §14.2's option (a) description to
state that the caret already prevents any resolution to `0.27.0`
without an explicit, separate action.

**Provenance.** Introduced at the plan's original 2026-09-06 authoring;
repeated unchecked in the 2026-09-06 meta-check and collapse-hunt;
never touched by any of rounds 1–5 of this session's review lineage,
none of which re-read §10A's individual D-plan-2 entry or §14.2's
bin-2 register closely enough, or ran an actual semver check, to catch
it.

---

### Minor Finding 1 — §14.4's reconciliation-sweep narrative has no entry for round 5's fix pass

**What the plan does.** §14.4 (lines 6294–6428) records one "Pass"
entry per fix-pass round: Pass A–F (pre-session-restructure walks),
Pass G (round 1), Pass H (round 2), Pass I (Q-gap-5 closure), Pass J
(round 3, added by round 4's own fix per its expert-review's tentative
finding that Pass J was originally missing), and Pass K (round 4).
There is no "Pass L" documenting round 5's fix pass — which applied
the collapse-hunt's two citation fixes (`c67cf8c`) and the
expert-review's four-site "Step 30's `init`" fix, the Test-tier-split
field fix, and the Step 38 duplicate-paragraph removal (`ddfddc6`).

**How this was verified.** Grepped `Pass [A-K]` across the current
§14.4 — 11 hits (Pass A through Pass K), confirming the sequence stops
at K. Read the section in full (lines 6294–6428); the narrative ends
with Pass K's summary (lines 6395–6412) and moves directly to "Final
count" (line 6416) with no round-5 entry between them.

**Named standard violated.** The section's own established convention
(one entry per round), and the identical standard round 4's
expert-review applied when it found "the sweep-record narrative...
had no entry for round 3's own substantial fix pass" (a tentative
finding at the time, fixed by adding Pass J).

**Why it matters.** Low impact — the "Final count" summary immediately
following (bin-1/bin-2/bin-3 counts) is still numerically accurate,
since round 5's fixes did not add or retire any register entry. But a
reader relying on §14.4 as the authoritative history of what each
round changed will not find round 5's work recorded there, even though
every other round back to round 1 is.

**Correct implementation.** Add a "Pass L (fix pass, round 5 —
independent re-review response)" entry summarizing the collapse-hunt's
two citation fixes and the expert-review's Systemic pattern (4-site
`init` misattribution, 2-site Test-tier-split fields) and Minor
finding (Step 38 duplicate), matching the format of Pass J/K.

---

### Minor Finding 2 — §14.2's web-tree-sitter entry contains an apparently garbled phrase

**What the plan says.** `docs/plans/plan-phase-a.md:6210–6212`:
*"the caret is a defensible engineering default (semver-compatible, no
known behavioral difference between the two versions was found in this
session's `.mcp.json`-registry re-check)..."*

**How this was verified.** Read the surrounding paragraph (lines
6201–6214) and cross-checked against §11.4 (lines 4234–4247), which is
where this plan actually documents its npm-registry evidence for
`web-tree-sitter`/`tree-sitter-wasms` (via `WebFetch` of
`registry.npmjs.org`). `.mcp.json` is a different artifact entirely —
this plan's own §5 (line 262) and §11.6 (line 4297) both correctly
describe it as "MCP client configuration," unrelated to npm package
versions.

**Named standard violated.** General technical-writing clarity — not a
correctness standard in the engineering sense, since no technical
conclusion turns on this phrase, but the phrase as written does not
parse to a coherent claim about what was actually checked.

**Why it matters.** Low impact — a reader can infer the intended
meaning ("npm registry re-check") from context and §11.4, but the
phrase as written cites the wrong artifact by name.

**Correct implementation.** Replace "`.mcp.json`-registry re-check"
with "npm-registry re-check (§11.4)."

No other Moderate or Minor findings — verified by the full read of
§1–§16, the T-ID cross-checks in §12.1–12.5, and the targeted grep
scans described in Scope and Inventory and in Systemic Patterns above.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified
per Compliance Gate B, including Moderate Finding 2's library-behavior
claim, which was resolved (not left tentative) by actually installing
and running the `semver` package rather than citing an unverifiable
gap.

---

## What's Actually Good

- **The five-site "Step 30's `init`" misattribution — the sharpest
  test yet of this project's recurring sweep-failure pattern — is now
  genuinely, completely closed.** Round 5's own collapse-hunt attested
  "48 citations checked, only these two were wrong" and was
  independently shown false by round 5's own expert-review in the same
  round; this round's independent re-grep of the fixed document (not
  a re-run of round 5's grep, but a fresh `grep -n "Step 30's
  \`init\`|Step 30 (the \`init\`"` against current source) returns
  zero hits. **Verified by:** direct grep and Read of all five sites.
  **Standard:** the exact discipline `docs/collapse-log.md`'s round-5
  entry prescribes — independent re-verification of a sweep's own
  completeness claim, not trust in the claim itself.
- **Every architecture quote this round spot-checked against
  `docs/architecture-phase-a.md` (V1, V3, V5, V6, V7, V8, V12, V13,
  V14, V17, V19, plus AD-2, AD-4, AD-5, AD-9, AD-10, AD-14, AD-20,
  AD-24, AD-26, AD-19) matches the architecture's own text verbatim,
  with no drift introduced across six rounds of fix passes.**
  **Verified by:** direct Read of the architecture document's exact
  cited line ranges, this session, compared word-for-word against the
  plan's quotations. **Standard:** the same premise-verification
  discipline this review applies to every claim, applied here as a
  positive finding because the quotes hold up rather than being
  assumed to.
- **The `init`/Step 31 citation defect, despite recurring at five
  sites across two rounds, never once reached the mechanically-checked
  test surface** — every `init`-related T-ID (`T31-1`, `T31-2`,
  `T31-3`) has correctly cited Step 31 in both its own §12 spec and
  the Step→T-ID mapping table throughout this document's entire
  history. **Verified by:** direct Read of T31-1/T31-2/T31-3's specs
  and the §12.5 Step→T-ID table, cross-checked against Step 31's own
  body. **Standard:** the construction-vs-reference distinction
  `docs/collapse-log.md`'s round-3 entry names as the harder of the
  two checks a sweep must run.

---

## Recommended Priority

1. **Moderate Finding 2 (the semver claim).** Fix first because it is
   a load-bearing collapse-test's own premise and an owner-facing
   options list — both should state the real technical fact,
   independent of the fact that the practical outcome (keep the
   default caret) is unaffected. One-line fix at D-plan-2 (lines
   3552–3556) and §14.2 (lines 6203–6209).
2. **Moderate Finding 1 (the stale "bin 1 answered" citation).**
   One-line fix at §3 (line 211) to match the current register state.
3. **Minor Finding 1 (missing Pass L).** Add the entry to §14.4
   matching the Pass J/K format.
4. **Minor Finding 2 (the garbled `.mcp.json` phrase).** One-word-level
   fix at §14.2 (line 6212).

---

## Verdict

Verdict: NEEDS FIXES (4 findings: 2 Moderate, 2 Minor)
