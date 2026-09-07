# Expert review (round 3, re-review) — `docs/plans/plan-phase-a.md`

**Date:** 2026-09-07
**Reviewer:** fresh independent `/expert-review` pass; not the plan-writer,
not the author of any of the six prior review documents on this artifact.
**Artifact:** `/home/user/agent-armory/middleware/context-oracle/docs/plans/plan-phase-a.md`
(6644 lines at the start of this session, read in full across sequential
Read calls with no gaps in §1–§10A, §11 spot-checked, §12 read in full for
every fix-pass-touched T-ID plus a full mechanical cross-reference sweep
over all ~97 T-ID tokens, §13–§16 read in full).
**Round:** 3 (re-review of the round-2 fix pass, per the Re-Review Protocol
in `.claude/commands/expert-review.md`). Round 1 found 10 findings (3
Serious, 5 Moderate, 2 Minor) — all fixed. Round 2 found 9 findings (1
Systemic spanning 7 instances, 2 Serious, 1 Moderate) — all fixed, plus a
separate direct-MCP-protocol pass that resolved Q-gap-5 in full
(`docs/reviews/2026-09-07-clear-thought-verification-q-gap-5.md`).

---

## Scope and Inventory

### Tool-plan disclosure

`ToolSearch(query="codegraph", max_results=10)` and
`ToolSearch(query="clear-thought sequential thinking", max_results=10)` —
both returned "No matching deferred tools found" in this session. This
reproduces the same non-attachment both prior review sessions observed —
now **3 for 3** sessions in which the harness's own tool-attachment layer
never picked up the CLI-registered `codegraph`/`clear-thought` servers.
This is Q-gap-6's own disclosed residual, not a new problem, and it does
not block this review: this artifact is a Markdown planning document, so
every claim this review makes about its own text is a literal-content or
absence claim (Read/Grep), never a structural claim CodeGraph would be
needed for — matching round 1's and round 2's own tool-plan disposition.

**The one place this round's task explicitly required going further:**
whether the Q-gap-5 "resolved via direct MCP protocol invocation" claim
itself withstands Gate B (test reproduction), given the task's specific
instruction to check whether `docs/reviews/2026-09-07-clear-thought-
verification-q-gap-5.md` demonstrates a real invocation or merely asserts
one. This review reproduced the protocol directly, independent of anything
in the plan or the verification document:

- Confirmed `npm view @waldzellai/clear-thought-onepointfive` on the real
  npm registry: two published versions, `0.2.0`/`0.2.1`, both
  `2025-08-18T00:06–00:34Z`.
- Wrote a minimal Python MCP stdio client this session (not reusing any
  script from the artifact under review — none is checked into the repo;
  see Minor finding m1 below) and spoke the protocol directly to `npx -y
  @waldzellai/clear-thought-onepointfive`:
  - `initialize` → `{"protocolVersion":"2024-11-05", ...,
    "serverInfo":{"name":"clear-thought","version":"0.0.5"}}` — this
    **exactly** matches the verification document's claimed handshake
    detail (line 22 of that document), including the server's internal
    version string (`0.0.5`), which differs from the npm package version
    (`0.2.1`) and could not be guessed from the npm registry alone.
  - `tools/list` → confirmed a single `clear_thought` tool whose schema
    requires `operation` + `prompt`, with `sessionId`/`parameters`/
    `advanced` as documented fields — consistent with, though more
    detailed than, the verification document's summary.
  - `tools/call` with `operation: "sequential_thinking"`, a `prompt`
    string, and `parameters: {thoughtNumber, totalThoughts,
    nextThoughtNeeded}` → returned `{"status":"success", ...,
    "sessionContext":{"sessionId":"stdio-session-1788763255708", ...}}` —
    the exact `stdio-session-<epoch-ms>` session-ID shape the verification
    document reports (`stdio-session-1788762266748`), and the tool
    literally echoes the caller-supplied `thought` text back in its
    response, which is what makes the verification document's "the six
    chains, verbatim" section a plausible, literal reproduction of what
    each `tools/call` actually returned, not a paraphrase.

**Disposition.** This is a genuine test reproduction per Step 6 of the
process document ("Behavioral claims: trace to a test that demonstrates
it, reproduce the condition"). The specific, unusual technical fingerprint
the verification document reports (an internal server version string that
diverges from the npm package version; the exact JSON envelope shape; the
`stdio-session-<epoch>` ID format) is independently confirmed accurate
against the real running server, which would be an implausible coincidence
to fabricate. **Q-gap-5's closure is genuinely premise-verified by this
round, not merely re-asserted** — this is a closure this review confirms
by its own independent reproduction, not by trusting the artifact's
narrative. See Minor finding m1 below for the one residual gap this
reproduction surfaces: no script or raw transcript is checked into the
repo, so the verification document's content is corroborated as accurate
by this review, but not because the repo itself preserves reproducible
evidence of it.

### Scope 1 — Round 2's four findings as closure items (`docs/reviews/2026-09-07-round-2-plan-expert-review.md`)

- [x] **S3 (Q-gap-5 "resolved" claim was an overclaim)** — Read plan lines
  6419–6567 (§15 Q-gap-5, current text) and the verification document in
  full. **Closed**, verified by direct test reproduction (above), not by
  re-reading the plan's own narrative. The plan's own disposition text
  (lines 6483–6495) also correctly separates "disclosed as manual
  reasoning" from "Clear-Thought verified" — the exact distinction round
  2 found missing.
- [x] **Serious (T2.5-1, T18-2, T21-2 cited but never specified in §12)**
  — Read plan lines 4255 (T2.5-1), 4992 (T18-2), 4688 (T21-2), each a
  full six-field spec. Grep re-run: `comm -23` of every `T\d+(\.\d+)?-\d+
  [a-z]?` token (97 hits) against every `^\*\*T\d+(\.\d+)?-\d+[a-z]?`
  heading (93 hits) now returns only `T41-1a`/`T41-1b`/`T41-1c`/`T41-1d`
  — the four sub-labels inside T41-1's own combined spec (Read lines
  4842–4863: all four now named in its File/Data fields). **Closed.**
- [x] **Systemic (fix content not swept to cross-references — 7
  instances)** — each instance re-derived against current source:
  1. D-plan-6's §10A entry — Read lines 3563–3585: now correctly
     retracted, no longer defends the removed owner-probe design.
  2. D-plan-8's §10A entry — Read lines 3610–3644: now correctly
     rewritten against the `command`-field-prefix marker design.
  3. `src/proc/oracle_spawn.ts` in §5.1 — Read lines 358–360: present.
  4. T2.5-1/T18-2/T21-2 in §12 — see the Serious item above: present.
  5. T41-1's Data field for the fourth sub-file — Read lines 4842–4863:
     extended.
  6. §12.5 Step→T-ID table's Step-25 row — Read line 5789: now includes
     `T25-8, T25-9`.
  7. Step 31's `src/cli.ts` reference — Read lines 280, 2427–2429: now
     `src/cli/dispatch.ts`.
  **All 7 closed** — verified by Read at each specific location, not by
  the plan's own sweep-attestation narrative (§14.4 Pass H/I, lines
  6199–6222), consistent with the "prior document's claim is not the
  verification" discipline. **However — this round's Scope 2 regression
  scan found the identical pattern recurring at two more sites the round-2
  sweep did not reach; see Systemic Patterns below.**
- [x] **Moderate (T32-1a cited, never defined)** — Read plan lines
  5457–5470: full six-field spec now exists. §12.5's Step-32 row (line
  5796) and §5.1 (line 462) both cite it consistently. **Closed.**

**Scope 1 result: all 4 of round 2's findings verified closed against
current source.**

### Scope 2 — Fix-diff regression scan

Round 2's own account (STATUS.md, §14.4 Pass H/I) states the round-2 fix
pass touched: the Q-gap-5 disposition (§15), the D-plan-6/D-plan-8
sections (§10, §10A), the N1–N6 formal collapse-tests (§10A, newly added),
Step 23's AD-14 provenance split, §13 R1/R7, T18-3/T41-1d (Steps 18/41,
§12, §5.1), T32-1a (§12), and STATUS.md/collapse-log.md. This round's
inventory is every section of the plan, marked by how it was verified:

- [x] §1–§4 (goal, scope, coverage reconciliation, spec issues) — Read
  lines 1–250. **Finding M1 below** (§2.3's Delivery row misattributes
  Step 31).
- [x] §5/§5.1–§5.5 (file skeleton) — Read lines 251–559 in full.
- [x] §6, §8 (foundation corrections, divergences) — Read lines 561–580,
  3182–3198.
- [x] §7 Steps 1–43 + Step 2.5 — Read lines 582–3181 in full, in five
  sequential Read calls with no gaps. **Findings Instance 1 (Systemic) and M2 below.**
- [x] §9 (checkpoints) — Read lines 3200–3244; cross-checked Checkpoint 3
  ("After Step 30 (delivery)") against §2.3's Step-31 claim — confirms
  §2.3 is the stale one (Finding M1).
- [x] §10/§10A (decisions + collapse-tests, including new N1–N6) — Read
  lines 3246–3900 in full. D-plan-6/8 fixes confirmed (Scope 1); N1–N6
  each now carry a full four-part collapse-test (Read lines 3721–3899).
- [x] §11.1–§11.6 — Read lines 3903–3920 (intro) plus targeted
  spot-checks of every architecture citation the fix pass introduced or
  the task specifically named: `AD-14` (architecture-phase-a.md lines
  1104–1110, Read directly — the plan's Step-23 citation of "Ship-high
  defaults... non-hazard c floor 0.6 with support ≥ 3... noise floor
  support ≥ 2... blast-radius band ≥ 2" resolves verbatim); `tuning`'s
  schema comment (architecture-phase-a.md line 604–613, Read directly —
  "WRITER: seeded at init," the fact underlying Systemic Instance 2 below).
- [x] §12.1–§12.5 — Read in full for every T-ID the fix pass touched
  (T2.5-1 at 4255, T8-1 at 4391, T18-2 at 4992, T18-3 at 5017, T21-2 at
  4688, T23-1 at 4741, T32-1a at 5457, T41-1 at 4842); Grep-verified the
  complete T-ID cross-reference (97 mentions vs. 93 headings, zero
  unexplained orphans — see Scope 1 above); Read §12.5's both mapping
  tables in full (lines 5695–5814).
- [x] §13 (risks) — Read lines 5817–5920 in full. R1 (line 5822) and R7
  (line 5881) both now cite the round-2 mechanisms (T14-3/T18-3; the
  `SINGLE-REPO` label) — confirmed synced, closing round 2's collapse-hunt
  finding on this point.
- [x] §14.1–§14.4 — Read lines 5933–6228 in full, including the Pass
  G/H/I provenance narrative (lines 6190–6222).
- [x] §15 (Q-gap-1 through Q-gap-6) — Read lines 6229–6567 in full.
- [x] §16 (post-completion) — Read lines 6576–6644 in full.
- [x] `docs/reviews/2026-09-07-clear-thought-verification-q-gap-5.md` —
  Read in full (226 lines); its central claim independently test-
  reproduced this session (see Tool-plan disclosure above), not merely
  re-read.
- [x] `docs/reviews/2026-09-07-round-2-plan-expert-review.md` and
  `docs/reviews/2026-09-07-round-2-plan-collapse-hunt.md` — both Read in
  full, required per task.
- [x] `docs/reviews/2026-09-06-plan-expert-review.md` and
  `docs/reviews/2026-09-06-plan-collapse-hunt.md` — both Read in full,
  required per task.
- [x] `docs/specs/spec-context-oracle.md` §14 — Read lines 900–1138 in
  full (Acceptance criteria; the AD-N/AC-N citations the plan's Step 23
  and §10A N1–N6 entries make were cross-checked here).
- [x] `docs/architecture-phase-a.md` — spot-checked at the two locations
  this round's Step-23/Step-8 finding turns on (line 604–613, line
  1095–1112), plus re-verification of the AD-2 citation range (lines
  325–365, unchanged from round 1's observation) and the AD-10 confinement
  citation (lines 924–946). Not read end-to-end (2058 lines); the task's
  instruction was to spot-check AD-N citations, done at every location
  this round's findings and the fix pass's own citations turn on.
- [x] `docs/STATUS.md` — Read in full (189 lines).
- [x] `OWNER-LEDGER.md` — Read in full (80 lines).
- [x] `middleware/context-oracle/CLAUDE.md` — present in system context;
  read in full.
- [x] `.claude/skills/expert-plan/SKILL.md` — Read lines 20–290
  (targeted: the Clear Thought mandate, Step 8/9's field-accuracy
  requirements, the halt-condition/no-fallbacks language quoted by Q-gap-1/
  Q-gap-2/Q-gap-5).

**Rigor waivers:** none. **Instrument unavailability:** CodeGraph and
Clear Thought remain unattached via `ToolSearch` in this session (see
above); this is disclosed, not load-bearing on this review's own claim
category (a Markdown document's literal content), and does not gate
delivery per the same disposition round 1 and round 2 recorded.

---

## Summary

**This review returns NEEDS FIXES.** Round 2's fix pass is confirmed
sound on everything it claimed to fix: all four of round 2's own findings
— including the hardest one, S3's rejection of the Q-gap-5 "closed"
overclaim — are genuinely closed against current source, and this round
independently reproduced the Q-gap-5 verification document's central
technical claim (a real MCP protocol handshake with `@waldzellai/clear-
thought-onepointfive`) rather than trusting its narrative, confirming it
is accurate down to an obscure, unguessable detail (the server's internal
version string diverging from its npm package version). The six Clear-
Thought-verified decisions (C1, N5, C3, P3, P4, T18-3) are genuine
comparative reasoning — each frames a real alternative, compares concrete
consequences, and concludes with a citable reason — not superficial
restatement of the shipped design. But this round's Scope 2 regression
scan found the exact systemic pattern round 2 named and fixed at 7 sites
**recurring at two more sites that survived round 2's own sweep**: Step 41
(the step that builds `test/conventions/`) still does not build or count
`deny_bypass_predicates_confined.test.ts` (T18-3) even though Step 18,
§5.1, §12, and §12.5 all now assert it exists — the identical shape as the
T41-1d collapse round 2 already found and fixed for a different file, now
recurring for the next one added in the same fix pass. Separately, Step
23's own "corrected" AD-14-provenance split (round 2's fix for the
collapse-hunt's "new defect") was never swept into T8-1's or T23-1's own
§12 test specifications, both of which still assert that every seeded
tuning default traces to AD-14 — directly contradicted by Step 23's own
prose two sections earlier, and by the architecture's own "seeded at
init" WRITER designation for `tuning`, which Step 8's migration-time
seeding claim also contradicts. Two further, smaller cross-reference
errors (§2.3's Delivery-row misattribution; Step 19's wrong step-number
citation for the done-claim recognizer) round out this round's findings.

---

## Upstream Contract Verification

**Spec §14 acceptance criteria.** No new AC mapping was touched by round
2's fix pass beyond AC-8 (verified closed in round 2, re-confirmed this
round at §12.5 line 5740) and the AC-2c split (verified closed in round 2,
re-confirmed at §12.5 line 5730–5731). No regression found in the AC↔T-ID
mapping table beyond what the Systemic Patterns instances below name (which are Step-body
and test-spec defects, not AC-mapping defects — the mapping table itself,
Read in full at lines 5695–5758, is internally consistent).

**Architecture design decisions — the ones this round's findings turn
on:**

| AD | What it decides | Plan's claim | Verification method | Verdict |
|---|---|---|---|---|
| AD-14 | Bar defaults are architect-illustrative, tunable via `tuning` | Step 23 (line 1944–1996) splits 4 AD-14-sourced values from 2 plan-judgment values | Read `docs/architecture-phase-a.md:1104–1110` directly, compared word-for-word against Step 23's quotation | **Honored** in Step 23's own prose — but **not propagated** to T8-1/T23-1 (Systemic Instance 2) |
| AD-5 | `tuning`'s WRITER is "seeded at init, changed via `tune`" | Step 8 (line 1072–1074) has the migration SQL itself seed `tuning` with defaults, all labeled `source='architecture_default'` | Read `docs/architecture-phase-a.md:604–613` directly | **Violated** — Step 8 seeds at migration-apply time, not at `init`, contradicting AD-5's own WRITER designation (Systemic Instance 2) |
| AD-10 | Structural confinement via built-output grep, not implementer discipline | Applied to `permissionDecision` (Step 15/T15-2, honored — re-confirmed) and to `deny_bypass_suspect`'s predicate list (Step 18/T18-3) | Read Step 41 (lines 3007–3045) against T18-3's own spec (line 5029–5033) and §5.1's file list (line 426) | **Asserted but not delivered** for T18-3 — Step 41 never builds the file that would make this structural (Systemic Instance 1) |

---

## Critical & Serious Findings

No Critical or Serious findings as standalone items — the full inventory
was Read or Grep-verified per the tool plan above, and the two defects
this round found at Serious-equivalent severity (a missing CI-enforcement
construction step; an architecture-contradicting seeding mechanism with
un-swept test specs) share the identical signature as round 2's own
already-diagnosed Systemic pattern (content fixed in one place, not swept
to a sibling surface) and are reported together as that pattern's next
two instances, below, per the proactive-scan discipline — not
double-counted here as separate Serious findings.

---

## Systemic Patterns

### Fix-pass content still not swept to every cross-referencing surface — round 2's pattern, recurring at 2 new sites

**The proactive scan.** After finding the first of the two instances
below, this reviewer suspected a recurrence of round 2's own Systemic
finding and ran the following scans across the full §5.1/§7/§12/§13
inventory before classifying:

- `Grep "AD-14"` across the whole document (18 hits) — every hit's
  context Read; two (T8-1 line 4408/4417, T23-1 line 4759) are the
  un-swept sites (Instance 2 below); the remaining 16 are consistent
  with Step 23's corrected split.
- The full T-ID cross-reference diff (97 mentions vs. 93 headings,
  described under Scope 1) — no orphan T-IDs remain (round 2's own
  Serious finding is genuinely closed); this rules out a recurrence of
  *that* specific instance shape, but does not rule out a file existing
  in §12 with no *constructing step* — which is exactly Instance 1's
  shape below, a different failure mode the T-ID diff cannot see (a T-ID
  can have a full §12 spec, as T18-3 does, while the step that is
  supposed to build the file it specifies never does).
- `Grep "test/conventions/"` (12 hits across §5.1, Steps 18/21/41, §12,
  §12.5) — cross-checked each file named against Step 41's own four-item
  "What changes" list: `deny_bypass_predicates_confined.test.ts` is the
  one file named everywhere except Step 41's own body.
- `Grep "Step 31\b"` and `Grep "Step 26\b"` (6 hits) — both walked for
  step-attribution accuracy; produced Findings M1 and M2 below (a
  different, smaller instance of the general "cross-reference not
  swept/verified" family, but not the same specific signature as the two
  instances here, so counted separately as Moderate rather than folded
  into this Systemic entry, per the skill's own distinction between a
  systemic count and an adjacent-but-different defect).

**Instances enumerated (2, both new this round; the systemic count is
the enumerated instance count, not a sample):**

#### Instance 1 — Step 41 does not build `deny_bypass_predicates_confined.test.ts` (T18-3); the write-time predicate cap that C1/T18-3 claims is structural has no actual construction step behind it

**What the plan says.** Step 18's Verification field (line 1700–1710)
cites `T18-3` as "added this fix pass" and describes it as mechanizing
the write-time predicate cap via a built-output grep. §5.1's file
skeleton (line 426) lists `deny_bypass_predicates_confined.test.ts # T18-3
(C1's write-time cap, mechanized)` under `test/conventions/`. §12's own
T18-3 spec (line 5029–5033) states its **File** field as `test/
conventions/deny_bypass_predicates_confined.test.ts`. §13's Risk R1 (line
5829) and the Clear-Thought verification document's T18-3 chain both cite
it as the mechanism that makes the predicate cap real, not implementer
discipline.

**What Step 41 — the step that actually builds `test/conventions/` —
says.** Read in full, lines 3007–3045. Its **What changes** section lists
exactly four files: `no_direct_dao_from_handler.test.ts`,
`hook_field_names_isolated.test.ts`, `permission_decision_confined.
test.ts`, `oracle_spawn_confined.test.ts`. `deny_bypass_predicates_
confined.test.ts` / T18-3 is not mentioned anywhere in Step 41's body.
Its **Verification** field (line 3037–3039) reads: "`T41-1` (all **four**
convention tests — including the new `T41-1d` — fail on a seeded
violation and pass on the current codebase)" — four, not five. Its
**Source** field (line 3030–3031) cites `AD-10`, `AD-6`, `AD-21` — not the
`AD-9`/C1 rationale T18-3 would need.

**How this was verified.** Read plan lines 3007–3045 (Step 41, full body)
and lines 5029–5049 (T18-3's own §12 spec, full body) this session;
cross-checked against §5.1 line 426 (the file's skeleton entry) and Step
18 line 1700–1710 (the citing step). All four sources agree T18-3/`deny_
bypass_predicates_confined.test.ts` exists; only Step 41 — the step
literally responsible for creating it — omits it.

**Named standard violated.** This is the identical defect class round 2's
own collapse-hunt named a **Collapse** (its highest severity) for a
different file: *"N5's `oracleSpawn` structural-confinement test (`T41-
1d`) is asserted to exist in three places and specified in zero"* — fixed
in this same fix pass by adding `T41-1d` to Step 41's body. That fix did
not generalize to the next convention test this same fix pass introduced
(`T18-3`), which is asserted in the same number of places (Step 18, §5.1,
§12, §13) and built in zero. `expert-plan` SKILL.md Step 8's own
completeness discipline ("Every source file named below is created by
exactly one §7 step" — §5.1's own stated rule, line 267) is violated:
`deny_bypass_predicates_confined.test.ts` is named in §5.1 but created by
no step.

**Why it matters.** T18-3 is the CI-enforced mechanism that is supposed
to make the "write-time predicate cap" (C1's fix, itself created to close
a collapse-hunt finding that the cap was otherwise "unenforced by any
mechanism") actually structural rather than a written rule an implementer
can forget. Without Step 41 building the file, an implementer following
the plan step-by-step ships Step 18 with a documented-but-unbuilt CI
check — the exact "trust the implementer" failure AD-10's precedent
(cited by name in C1's own §10A entry, line 3825–3834) was invoked to
avoid. This recurs the single most consequential failure mode both prior
rounds found (a fix landing at its decision site and not at its mechanical
enforcement site) at a location — a structural confinement test for a
security/correctness-relevant predicate list — where an unbuilt check is
not cosmetic.

**Correct implementation.** Add a fifth bullet to Step 41's "What
changes" section for `deny_bypass_predicates_confined.test.ts`
(mirroring the `oracle_spawn_confined.test.ts` bullet's shape exactly);
update Step 41's Dependencies field to include Step 18 (currently "Steps
15, 28, 2.5" — line 3035 — omits 18, the step whose output this test
greps); update the Verification field to "all **five** convention tests."

**Provenance:** new (Scope 2 regression — introduced by this fix pass's
own T18-3 addition, not present before this fix pass because T18-3 did
not exist before it).

---

#### Instance 2 — Step 8's migration-time `tuning` seeding contradicts AD-5's own WRITER designation, and T8-1/T23-1's test specs still assert every seed value is AD-14-sourced after Step 23's own text corrected that claim

**What the plan says.**

- Step 8 (line 1072–1074): "Seed `tuning` with the ship-high defaults
  AD-14 names, **all** marked with `source='architecture_default'` for
  audit," performed inside the SQL migration `002_phase_a_global.sql`
  (line 1068).
- T8-1's own §12 spec (line 4391–4406, Read in full): "**Data.** Empty
  database → migration 002. ... Query `tuning` for each seeded key. ...
  **Fails when** any expected table is missing, any forbidden table is
  present, **or any seed value differs from AD-14**."
- T23-1's own §12 spec (line 4741–4753, Read in full): "**Verifies.**
  Step 23 — scalar and list-valued keys round-trip; **defaults present
  after migration**. ... **Data.** After migration: **assert every seeded
  key from AD-14 is present with its seeded value.**"
- Step 23's own corrected prose (line 1944–1996, this fix pass, twice
  corrected): explicitly splits the six seeded values into **four**
  AD-14-sourced (`confidence_floor`, `support_min`, `noise_floor_support_
  min`, `impact_read_min_coupled`) and **two genuinely unsourced,
  plan-level judgments** (`reuse_dominance_k`, `clear_length_floor` —
  "No AD-14 (or any other architecture) citation names this value").

**Two independent contradictions, both verified this session:**

1. **Step 8 contradicts the architecture's own WRITER designation.** Read
   `docs/architecture-phase-a.md:604–613` directly: `tuning(key,
   project_key NULL, value, source, updated_at) ... WRITER: seeded at
   init, changed via `ctxoracle tune` (AD-20)`. The architecture states
   seeding happens **at `init`**, not inside the raw SQL migration. Step
   8 places the seeding inside the migration file itself, applied before
   any `init` call runs (T8-1's own Data field: "Empty database →
   migration 002" — no `init` step in between). This is a plan-level
   choice the architecture does not authorize, and it duplicates Step
   23's separate "Tuning DAO + defaults seeding" step, whose own title
   and Gate-3 rationale ("the alternative, seeding nothing, blocks Step
   30's `init` entirely" — line 2023–2024) frame Step 23, not Step 8, as
   the actual seeding mechanism.
2. **T8-1 and T23-1's own "Fails when"/Data clauses were not updated when
   Step 23's prose was corrected.** Both still assert, verbatim, that
   "every seeded key" or "any seed value" is checked against "AD-14" —
   but Step 23's own corrected text (same fix pass) explicitly names two
   of the six seeded keys (`reuse_dominance_k`, `clear_length_floor`) as
   having **no AD-14 citation at all**. A test asserting "matches AD-14"
   for a key AD-14 never mentions is not a coherent assertion — either
   the test's own wording needs updating to reflect the split, or an
   implementer building `test/unit/tuning_dao.test.ts` from T23-1's
   literal text has no basis for what "the AD-14 value" for
   `reuse_dominance_k` even is.

**How this was verified.** Read plan lines 1066–1092 (Step 8, full body),
1934–2027 (Step 23, full body, twice-corrected), 4391–4406 (T8-1, full
spec), 4741–4753 (T23-1, full spec) this session; Read `docs/
architecture-phase-a.md:595–614` (the `tuning` schema comment, including
its WRITER designation) and `:1095–1112` (AD-14's own stated defaults)
directly this session.

**Named standard violated.** This is the identical failure class round
2's own Systemic finding named: *"content the fix pass added or changed
in one place was not propagated to the plan's other cross-referencing
surfaces."* Round 2's fix (Pass H, per §14.4 line 6203: "the AD-14
provenance correction") corrected Step 23's own prose but did not sweep
the correction into T8-1's and T23-1's own test specifications — the
identical shape as the 7 instances round 2 fixed, recurring at 2 more
sites the round-2 sweep did not reach. It also violates `AD-5`
(architecture design decision — the WRITER designation) at Step 8.

**Why it matters.** An implementer following Step 8 literally builds a
migration that inserts tuning rows the architecture says should be seeded
at `init`, and then Step 23 (dependent on Step 8 per its own Dependencies
field, line 2023) attempts to seed the same keys again — either a
duplicate-`INSERT` conflict at build time (a real, concrete bug an
implementer would hit and have to improvise a resolution for, exactly the
"the planner does not substitute... intuition" failure this project's
process exists to prevent) or, if Step 8's claim is simply aspirational
and never actually implemented that way, a plan whose own steps describe
two different, mutually exclusive mechanisms for the same behavior with
no stated resolution. Separately, T8-1's and T23-1's own falsifiability
("Fails when...") is now internally inconsistent with the very
correction this fix pass made to fix an *identical* class of overclaim
(Step 23's original "verified against AD-14" text, corrected twice this
session) — the test specs are the one place where this exact inaccuracy
was not corrected.

**Correct implementation.** Remove the seeding claim from Step 8 entirely
(the migration should create the empty `tuning` table only, per AD-5's
schema; seeding is Step 23's job, invoked at `init` per Step 31 item 3);
update T8-1's Data/Fails-when fields to assert only that the four tables
exist and no fifth exists (dropping the seed-value assertion, which
belongs to T23-1); update T23-1's Data field to assert the split
explicitly — "the four AD-14-sourced keys match AD-14's stated values;
`reuse_dominance_k` and `clear_length_floor` match Step 23's own
plan-seeded values (`3`, `40`), with no AD-14 comparison for either."

**Provenance:** new (Scope 2 regression — a recurrence, at 2 additional
sites, of the Systemic pattern round 2 found and fixed at 7 other sites;
the underlying Step-23 correction that exposed this gap is itself new to
this fix pass).

---

**Named standard.** The same standard round 2 cited: `expert-plan`
SKILL.md's reconciliation-sweep discipline (§14.4's own "the sweep is
complete only when an entire pass adds zero new register entries") and
`CLAUDE.md`'s "Verify before you assert" rule ("'Applied all findings'
requires re-checking that none were dropped").

**Why this is systemic, not two isolated slips.** Round 2 already
diagnosed and fixed this exact pattern at 7 sites, and its own §14.4 Pass
H/I explicitly claims to have "walked each D-plan-* entry's §10 rationale
against its §10A collapse-test" (line 6199–6210) — the same kind of sweep
claim round 2 itself found had failed to catch instances 1 and 2 in the
prior round. This round's finding is the third consecutive round in which
a fix pass's own reconciliation-sweep attestation did not catch every
site its own new content touched — the sweep mechanism itself, not any
one content fix, is the recurring point of failure. Two new sites (T18-3's
missing construction step; the AD-14 split not reaching its own test
specs) is a smaller recurrence than round 2's 7, consistent with the
project's own convergence framing (round 1: 3 collapses; round 2: 1
collapse; the underlying class keeps shrinking), but it has not yet
reached zero.

**What correct looks like.** For every T-ID or file this fix pass (or any
future one) introduces, add it to a single checklist crossing all four
surfaces it must appear on — the citing step's body, §5.1's skeleton, the
*constructing* step's own "What changes" list (not just any step that
references it), and §12's spec — and mechanically diff that checklist
against grep results before declaring the sweep complete, rather than a
prose "walked and found nothing" attestation.

No further Critical findings — verified by the full read of §7 (Steps
1–43 plus Step 2.5) and the targeted §12/§13/§15 reads above; no violation
of Critical severity (fundamentally broken by engineering standards,
causing real problems, as distinct from a planning-document cross-
reference or test-spec gap) was observed.

---

## Moderate & Minor Findings

### M1 — §2.3's coverage-reconciliation table misattributes Stop-time delivery to Step 31; it is built entirely in Step 30 (and Step 19 for the outstanding-question line)

**What the plan says.** §2.3 (line 165): "| Delivery | Step 30 (delivery
+ dedup); **Step 31** (Stop-time additionalContext + outstanding-question
line) |".

**What the cited steps actually contain.** Step 30 (Read in full, lines
2378–2422) is titled "Delivery: per-consumer dedup, session-boundary
reconciliation, **Stop-time channel**" and implements `deliverStop
(hookResponse, whisperText): places whisper via `hookSpecificOutput.
additionalContext`; if `stop_hook_active` is true, delivers nothing" —
i.e., Step 30 alone builds the Stop-time `additionalContext` channel.
Step 19 (Read in full, lines 1717–1769) adds "the Stop-time
outstanding-question line (AC-8a)." Step 31 (Read in full, lines
2425–2507) is "CLI dispatch + `init` verb" — it builds `src/cli/
dispatch.ts` and `init.ts` and has nothing to do with Stop-time delivery.
§9's own Checkpoint 3 (line 3222) independently confirms this: "After
Step 30 (delivery) — Checkpoint 3: the pipeline is complete," not Step
31. §12.5's own AC-8a mapping row (line 5741) cites `T19-3, T30-2` —
again, Steps 19/30, not 31.

**How this was verified.** Read plan lines 155–172 (§2.3, full table),
2378–2422 (Step 30, full body), 1717–1769 (Step 19, full body),
2425–2507 (Step 31, full body), 3200–3244 (§9 Checkpoints), and 5730–5758
(§12.5's AC mapping table) this session — four independent sources
(Step 30/19's own text, Step 31's own text, §9, §12.5) all agree with
each other and disagree with §2.3.

**Named standard violated.** `expert-plan` SKILL.md's output-contract
accuracy requirement (Gate C item 7, quoted in round 1's review: "file
paths and function names are confirmed against the current codebase, not
assumed") — applied here to step attribution rather than a file path, the
same class of claim.

**Why it matters.** §2.3 exists specifically as the audit surface a
reviewer or implementer consults to confirm every spec element maps to a
real step; a reader trusting this table over the steps themselves would
misdirect a change or a bug report to Step 31 (CLI/init) when the actual
mechanism lives in Steps 19/30.

**Correct implementation.** Change the Delivery row to "Step 30 (delivery
+ dedup + Stop-time `additionalContext`); Step 19 (outstanding-question
line)."

**Classification.** Moderate. **Provenance:** new (this round's Scope 2
regression scan; not attributable to the round-2 fix pass's own new
content — §2.3 was not among the sections round 2's account says it
touched — so this is a pre-existing defect surfaced by this round's wider
sweep, not a round-2 regression).

---

### M2 — Step 19's own body cites "the Step 26 done-claim recognizer"; the done-claim recognizer is built in Step 25, not Step 26

**What the plan says.** Step 19 (line 1732–1733): "Add the Stop-time
outstanding-question line (AC-8a): at `Stop`, if **the Step 26 done-claim
recognizer** fires AND `getOpenQuestions(...)` returns a non-empty set...".

**What actually builds the done-claim recognizer.** Step 25 (line
2117–2120, Read directly): "Also in this file: `src/genres/
verification.ts` **includes the done-claim recognizer** — deterministic
lexicon from `lexicon.completion_claim` against `last_assistant_message`
(Stop input, V1), conservative bias." Step 26 (line 2163–2207, Read in
full) is "Command class classifier (AD-15 supporting)" — the ternary Bash
command classifier (`classifyBashCommand`), an unrelated mechanism that
feeds the Verification genre's run-state computation, not the done-claim
recognizer.

**How this was verified.** Read plan lines 1717–1769 (Step 19, full
body), 2076–2160 (Step 25, full body, including the done-claim
recognizer's own definition), 2163–2207 (Step 26, full body) this
session. `Grep "Step 26\b"` (6 total hits, all Read in context): lines
317, 2163, 4775, 4788, 5997 all correctly refer to the command-class
classifier; only line 1732 misattributes the done-claim recognizer to
Step 26.

**Named standard violated.** Same standard as M1 — output-contract
citation accuracy.

**Why it matters.** Smaller than M1 in practical impact (Step 19's own
described behavior is unambiguous regardless of the step number cited),
but it is a factual claim about the plan's own structure that is simply
wrong, and it is the kind of small inaccuracy that compounds into
implementer confusion when cross-referencing Step 19 against "Step 26"
while building the Bash classifier and finding no done-claim recognizer
there.

**Correct implementation.** Change "the Step 26 done-claim recognizer" to
"the Step 25 done-claim recognizer" at line 1732.

**Classification.** Moderate. **Provenance:** new (pre-existing, not a
round-2 regression — Step 19's text was not among the sections round 2's
account says it touched).

---

### m1 — The Q-gap-5 clear-thought verification document preserves no script or raw transcript in the repo; its evidentiary discipline is narrative, not pasted command output

**What the artifact does.** `docs/reviews/2026-09-07-clear-thought-
verification-q-gap-5.md` reports specific protocol details (a
`serverInfo.version` of `0.0.5`, a `stdio-session-<epoch-ms>` session ID,
"18 tool calls... all returning `"status": "success"`") but the commit
that produced it (`7d17ed8`, Read via `git show --stat` this session)
touched only four Markdown files — no client script, no raw JSON-RPC log,
was committed alongside it.

**How this was verified.** `git show --stat 7d17ed8` this session:
`docs/STATUS.md`, `docs/collapse-log.md`, `docs/plans/plan-phase-a.md`,
and the verification document itself — four files, zero scripts, zero
logs. `find . -iname "*mcp*client*"` and `git log --all --oneline | grep
-i "clear.thought"` this session: no other commit or file in the repo
carries the client or a transcript.

**Named standard violated.** `middleware/context-oracle/CLAUDE.md`
dominating rule 1: "Never claim something works without having run it —
paste the actual command and its output." The verification document
narrates the outcome of running a command rather than pasting the command
and its raw output, for a claim this project's own process (Q-gap-5,
across three disposition rewrites) treats as unusually high-stakes.

**Why it matters, and why this is Minor not higher.** This review
independently reproduced the exact protocol behavior described (see Tool-
plan disclosure above) and confirmed it accurate down to an
unguessable detail — so the underlying claim is not in doubt. The defect
is that the repo does not itself preserve the evidence that would let a
*future* reader (without re-running the protocol themselves, as this
review did) verify it — the same gap this project's rules exist to close
elsewhere (pasted command output, not narrated summaries).

**Correct implementation.** Check in the minimal MCP client script this
session used (or an equivalent) under a scratch/tools path, and append
the raw `tools/call` JSON responses (or a representative sample) to the
verification document, so the claim is reproducible from the repo alone.

**Classification.** Minor.

---

No further Moderate or Minor findings beyond the Systemic pattern (2
instances), M1, M2, and m1 above — verified by the full read of §7 (Steps
1–43 and 2.5), §9, §10/§10A (including the new N1–N6 entries), §13,
§14.4, §15, §16, the targeted §12 spot-checks described in Scope and
Inventory, and the `git show`/`find`/`git log` checks on the Q-gap-5
verification commit described above.

---

## Tentative Findings

- **Whether Step 32's export/import archive format ("tar? — plan: two
  files `project.db` and `global.db` in a directory-path or a `.tar`
  archive; the simpler choice is a directory the user names" — line
  2523–2525) is a genuinely settled decision or leftover brainstorming
  language is not resolved by this review.** The text reads as an
  unresolved internal deliberation rather than a committed choice, but
  T32-2's own spec (not fully re-read this round beyond its header) may
  resolve this; flagged rather than counted as a finding because Step 32
  was not among the sections this round's targeted reads covered in
  full detail beyond its "What changes" section.
- **Whether the tool-registry non-attachment (3-for-3 sessions now) is a
  durable property of this environment or an artifact of subagent
  dispatch is still not resolved** — round 2 flagged this as tentative
  and this round's own observation (a third failed `ToolSearch`) narrows
  but does not close the question; it remains outside what any review
  session dispatched this way can test.

---

## What's Actually Good

- **The Clear-Thought verification's six decision chains are genuine
  comparative reasoning, not superficial restatement, by the standard
  the task specifically asked this round to check.** Each of the six
  (C1, N5, C3, P3, P4, T18-3) frames a real alternative the plan did not
  choose (build reordering vs. write-time cap; late vs. early wrapper
  placement; block/proceed-silent/proceed-labeled for the exit-run repo
  set; marker field vs. command-prefix; narrow vs. wide seam interface;
  runtime self-assertion vs. build-output grep), states a concrete
  consequence of the alternative, and concludes with a citable reason
  the shipped design dominates — not a restatement of "the plan already
  does X, so X is correct." **Verified by:** direct Read of all six
  chains (plan lines 6513–6544) plus independent test-reproduction of the
  underlying protocol invocation (Tool-plan disclosure section above),
  confirming the mechanism that produced this content is real. **Standard:**
  `expert-plan` SKILL.md Step 6's own bar for what Clear Thought reasoning
  must do ("choice of approach when multiple valid approaches exist,"
  "you are about to recommend an approach without having explicitly
  evaluated the alternatives").

- **The N1–N6 formal collapse-tests, added this fix pass to close round
  2's own procedural gap, each attack a genuinely harder question than
  their originating step's inline Gate-3 rationale posed, not a restated
  version of it.** N5's entry, for instance, poses "doesn't this just
  relocate the same implementer-discipline risk one level down" — a
  real objection to the wrapper-function design — and answers it by
  naming the specific CI mechanism (`T41-1d`) that changes the failure
  mode from silent to loud, rather than asserting the risk away.
  **Verified by:** Read of all six entries (plan lines 3721–3899) against
  their originating steps' own Gate-3 rationale (Steps 5, 18, 23/14, 2.5,
  15). **Standard:** `CLAUDE.md` dominating rule 2's own four-part
  collapse-test discipline ("the single hardest question a mission-
  literate skeptic would ask").

- **§13's R1 and R7 are now genuinely synced to the mechanisms they
  describe**, closing the gap round 2's own collapse-hunt found (both
  registers were unedited after their governing fixes landed). **Verified
  by:** Read of R1 (line 5822–5836, now cites `T14-3`/`T18-3` by name)
  and R7 (line 5881–5900, now states the `SINGLE-REPO` label mechanism)
  directly, cross-checked against Step 18/Step 42's own current text.
  **Standard:** the same reconciliation-sweep discipline this round's own
  Systemic finding is evaluated against — here, honored.

---

## Recommended Priority

1. **Systemic Instance 1 (Step 41 missing T18-3).** Mechanical — add one bullet to Step
   41's "What changes," fix its Dependencies and Verification fields.
   Highest priority because it is a security/correctness-relevant
   structural check the plan currently claims is built and CI-enforced
   when it is not.
2. **Systemic Instance 2 (Step 8/T8-1/T23-1 tuning-seeding contradiction).** Remove the
   seeding claim from Step 8 (seeding is Step 23's job, at `init`, per
   AD-5); update T8-1 and T23-1's Data/Fails-when fields to match Step
   23's own corrected AD-14 split. This one requires an actual design
   choice (confirm Step 23 alone seeds `tuning`, not Step 8), not only a
   text edit.
3. **Systemic pattern (both instances above).** Once both instances land, re-run
   the four-surface checklist this review used (citing step, §5.1,
   constructing step, §12) for T18-3 and for every tuning-default
   assertion, as the sweep mechanism rather than a prose attestation —
   the same recommendation round 2 made, restated because it did not
   fully hold across this round.
4. **M1, M2.** Two one-line text corrections (§2.3's Delivery row; Step
   19's "Step 26" → "Step 25"). Low effort, low urgency relative to
   both instances.
5. **m1.** Check in the MCP client script and a raw response sample
   alongside the Q-gap-5 verification document. Lowest urgency — the
   underlying claim is already independently corroborated by this review.

---

## Verdict

Verdict: NEEDS FIXES (4 findings: 1 Systemic pattern spanning 2 instances, 2 Moderate, 1 Minor)
