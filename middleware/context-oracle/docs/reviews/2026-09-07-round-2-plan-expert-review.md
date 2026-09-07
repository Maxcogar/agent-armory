# Expert review (round 2, re-review) — `docs/plans/plan-phase-a.md`

**Date:** 2026-09-07
**Reviewer:** fresh independent `/expert-review` pass; not the plan-writer,
not the author of any of the four 2026-09-06 review documents.
**Artifact:** `/home/user/agent-armory/middleware/context-oracle/docs/plans/plan-phase-a.md`
(6097 lines, read in full this session across nine sequential Read calls
covering lines 1–6097 with no gaps).
**Round:** 2 (re-review of the fix pass applied against round 1's four
review documents). Per the Re-Review Protocol in `.claude/commands/expert-
review.md`, this pass has two mandatory scopes: (1) verify each of the
prior expert-review's 10 findings is actually closed against current
source; (2) a full regression scan of everything the fix pass touched —
by `docs/STATUS.md`'s own account, that is the 10 expert-review findings
plus 3 collapses / 4 partials / 6 new-decisions from the collapse-hunt
plus the meta-check's H5/H6 items, i.e. effectively the whole document.

---

## Scope and Inventory

### Tool-plan disclosure (checked, not assumed)

Per the task's instruction, `codegraph` and `clear-thought` availability
was checked directly rather than assumed unavailable:

- `ToolSearch(query="select:mcp__codegraph__codegraph_scan")` → no
  matching deferred tools.
- `ToolSearch(query="codegraph", max_results=10)` → no matching deferred
  tools.
- `ToolSearch(query="clear-thought", max_results=10)` → no matching
  deferred tools.
- `ToolSearch(query="sequential thinking mental model reasoning",
  max_results=10)` → returned only `WebFetch` (unrelated).
- `Bash: claude mcp list` → **both servers ARE registered and
  health-checked as Connected** at the CLI-config level:
  `codegraph: node .../mcp-servers/codegraph-mcp/dist/index.js - √ Connected`;
  `clear-thought: npx -y @waldzellai/clear-thought-onepointfive - √ Connected`.

**Disposition.** Neither tool is loadable as a callable tool in this
review session, despite both being registered and reachable at the CLI
level — reproducing exactly the disconnect the fix-pass session itself
reported in Q-gap-1/Q-gap-2 ("this session's own tool registry ... does
not attach to it without a session reconnect"). This is disclosed
tentatively, not asserted as a permanent unavailability: it is possible a
genuinely fresh top-level session (not a subagent dispatch inside an
ongoing session) would attach differently. What is confirmed, not
tentative, is the narrower fact this review needed: **the specific claim
underlying Q-gap-5's closure — that "the next fresh session… runs with
CodeGraph and Clear Thought genuinely available" — has now been tested
once (this session, the one `docs/STATUS.md`'s own "what to do next"
item 1 designated for exactly this test) and did not hold.** See Finding
S3 below.

For the review's own substantive work: this artifact is a planning
document, not a codebase. Per the skill's own "structural-vs-existence
distinction" (CodeGraph answers "what imports what," not "does this
string appear at this line"), every claim this review makes about the
plan's own text is a literal-content or absence claim over a Markdown
document — the correct tool per the skill is Read/Grep, not CodeGraph,
matching round 1's own tool-plan disposition. No finding in this review
was blocked on CodeGraph or Clear Thought unavailability; both checks
above are recorded for completeness and because Q-gap-5 makes tool
availability itself part of what this round has to evaluate.

### Scope 1 — Prior findings as closure items (`2026-09-06-plan-expert-review.md`)

- [x] **S1** (Step 31→32 topological violation) — Read plan lines
  2381–2461 (Step 31 body + Dependencies field, current source). Closed:
  Dependencies now cite "Step 21 (`runIndex`, called directly — not Step
  32's CLI verb)"; Step 31 item 5 explicitly explains the direct-import
  fix; Step 32's `index` verb calls the same `runIndex` function. No
  forward reference remains.
- [x] **S2** (missing Verification-genre acceptance test for AC-8) — Read
  plan lines 4851–4894 (T25-8, T25-9 full specs) and line 5358 (§12.5
  AC-8 mapping row). Closed: T25-8 asserts the actual AC-8 content
  requirement (headline is the covering-test→changed-region mapping, not
  run-state alone); T25-9 covers the Warning genre. Both have complete
  six-field specs.
- [ ] **S3** (plan non-deliverable, Q-gap-5 open) — Read plan lines
  5969–6019 (Q-gap-5 disposition) and 5789–5858 (Q-gap-1/Q-gap-2).
  **NOT closed** — see Finding S3 below; the closure's own text concedes
  the premise that keeps it open.
- [x] **M1** (fixture repos not enumerated in §5.1) — Read plan lines
  468–493. Closed: every named fixture repo is now listed with its
  owning T-ID.
- [x] **M2** (`hook_field_names_isolated.test.ts` duplicated) — Read plan
  lines 414–419, 4941–4946. Closed: single file, single location, with
  an explanatory comment; T28-2 and T41-1b both point at the same path.
- [x] **M3** (T15-1 covers only one of two mutation fields) — Read plan
  lines 4322–4339. Closed: two fixtures, (a) `updatedInput`, (b)
  `updatedToolOutput`, each independently asserted.
- [x] **M4** (Step 39 Dependencies under-specified) — Read plan lines
  2867–2878. Closed: field now states the real dependency set (every
  step in §5.1's `test/unit/` listing, "currently Steps 1–15, 20, 21, 22,
  23, 24, 26, 27, 28, 37, 38, 2.5").
- [x] **M5** (AC-2c over-fire mapping partial) — Read plan lines
  5348–5349 (§12.5). Closed: two rows now exist — the lag-window
  sub-case (T17-1/T17-2) and the substantive-answer-not-recognized
  sub-case (explicitly reduced to Phase B's AC-2a-ii with a stated
  reason).
- [x] **m1** (Step 39 verification glob misses `test/build`/`test/
  conventions`) — Read plan lines 2880–2887. Closed: glob now covers all
  three non-replay tiers.
- [x] **m2** (Step 25 "one per genre" claim inaccurate) — Read plan lines
  2102–2112. Closed: corrected to state five per-genre + four
  cross-cutting + two new (T25-8/T25-9), matching §12.3's actual
  enumeration.

**Scope 1 result: 9 of 10 closed by Read-verification against current
source; S3 is not closed.**

### Scope 2 — Fix-diff files/sections, Read- or Grep-verified

The fix pass touched essentially the entire document (per `docs/
STATUS.md`'s own account: all 10 expert-review findings, 3 collapses +
4 partials + 6 new-decisions from the collapse-hunt, plus the
author-gates and meta-check findings already applied in an earlier
batch). The inventory below is every section of the plan, each marked
by how it was verified this round:

- [x] §1–§4 (goal, scope, coverage reconciliation, spec issues) — Read
  lines 1–250.
- [x] §5 / §5.1–§5.5 (files affected, new-file skeleton) — Read lines
  251–548. Grep-verified: `oracle_spawn`, `proc/`, `cli\.ts` (3 hits,
  cross-checked against Step 2.5 and Step 31 bodies).
- [x] §6, §8 (foundation corrections, divergences) — Read lines 550–568,
  3126–3141.
- [x] §7 Steps 1–43 (including new Step 2.5) — Read lines 601–3125 in
  full (five sequential Read calls, no gaps).
- [x] §9 (checkpoints) — Read lines 3144–3188.
- [x] §10 / §10A (decisions + collapse-tests) — Read lines 3190–3634.
  Grep-verified: `D-plan-6` (6 hits), `D-plan-8`/`Q-plan-marker` (4 hits),
  `RETRACTED` (3 hits) — cross-checked each occurrence's context.
- [x] §11.1–§11.6 (verification of factual claims) — Read lines
  3637–3913. Spot-checked 6 architecture citations against
  `docs/architecture-phase-a.md` directly (AD-2:325–364, AD-10:924–946,
  AD-19:1329–1375, AD-4 table-creation criterion:540–549, V-table
  rows V1/V5/V7/V12/V17/V19:122–144) and one spec citation
  (§11.5:739–777) — all seven resolve verbatim as cited.
- [x] §12.1–§12.5 (test specifications + coverage attestation) — Read
  lines 3916–5432 in full. Grep-verified: every `T<n>-<n>` token in the
  document (96 distinct mentions) diffed against every `**T<n>-<n>` §12
  heading (88 distinct headings) — 8 tokens referenced with no
  corresponding heading (`T2.5-1`, `T18-2`, `T21-2`, `T32-1a`, plus the
  `T41-1a/b/c/d` sub-labels, the last of which is not enumerated in
  T41-1's own Data field).
- [x] §13 (risks) — Read lines 5434–5528.
- [x] §14.1–§14.4 (question register + reconciliation sweep) — Read
  lines 5531–5781.
- [x] §15 (gaps, Q-gap-1 through Q-gap-6) — Read lines 5784–6026.
- [x] §16 (post-completion) — Read lines 6029–6097.
- [x] `docs/reviews/2026-09-06-author-gates-review.md` — Read in full
  (386 lines), required reading per task.
- [x] `docs/reviews/2026-09-06-meta-check-skipped-steps.md` — Read in
  full (564 lines), required reading per task.
- [x] `docs/reviews/2026-09-06-plan-collapse-hunt.md` — Read in full
  (822 lines).
- [x] `docs/reviews/2026-09-06-plan-expert-review.md` — Read in full
  (843 lines) — this round's own Scope-1 baseline.
- [x] `docs/specs/spec-context-oracle.md` §14 — Read lines 900–1138 in
  full (Acceptance criteria).
- [x] `docs/architecture-phase-a.md` — spot-checked as above; not read
  end-to-end (2058 lines) — the required task scope was citation
  spot-checks, which was done at 7 sampled locations, all verified
  accurate.
- [x] `docs/STATUS.md` — Read in full (150 lines).
- [x] `OWNER-LEDGER.md` — Read in full (80 lines).
- [x] `middleware/context-oracle/CLAUDE.md` — present in system context;
  read in full.

**Rigor waivers:** none.

---

## Summary

**This review returns NEEDS FIXES.** The fix pass genuinely closed 9 of
the prior round's 10 findings — S1, S2, M1–M5, m1–m2 all verify closed
against current source, with substantive (not cosmetic) fixes in the two
highest-value cases (S1's topological reordering; S2's two new
acceptance tests that actually assert AC-8's content requirement rather
than its supporting mechanisms). The collapse-hunt's C2 fix (the
`tsconfig.test.json`/`dist-test/` compile step) is real and closes what
was probably the most build-blocking defect in the prior round: without
it, every test in the plan would have silently not run. The plan's
overall engineering is careful, and its citation discipline holds up
under spot-check — seven architecture/spec citations sampled this round
all resolve verbatim to the lines cited.

But this re-review's Scope 2 regression scan surfaces a systemic pattern
in the fix pass's own work: **content the fix pass added or changed in
one place was not propagated to the plan's other cross-referencing
surfaces** — the same "assertion without check" / "fabricated
reconciliation sweep" failure class this project's `CLAUDE.md` names as
its most damaging recurring failure, and the same failure class the
author-gates review's C2 finding already caught once in the original
draft. It recurred in the fix pass itself, in at least seven verified
locations, including two (D-plan-6, D-plan-8) where a §10/§10A
rationale section now describes and defends a mechanism the plan's own
§7 body has explicitly replaced. Separately, S3 (the prior round's
finding that the plan is non-deliverable under `expert-plan` SKILL.md's
own binding rule) is not actually closed: the "Disposition: closed" text
in Q-gap-5 substitutes a claim about environment-level tool
*registration* for the actual compliance question SKILL.md asks (were
this pass's own load-bearing judgment calls made using the mandated
tools), which the plan's own Q-gap-1/Q-gap-2 text answers "no." This
review — the specific next round `docs/STATUS.md` designated to benefit
from the registration — also could not attach to either tool, which is
the first empirical test of the closure's forward-looking claim, and it
failed.

---

## Critical & Serious Findings

### Serious — S3 is not closed: Q-gap-5's "resolved" disposition does not satisfy the standard it claims to satisfy, and its own forward-looking premise has now been tested and failed

**What the plan says.** §15 Q-gap-5 (lines 5969–6019): "**RESOLVED**...
CodeGraph and Clear Thought are no longer unavailable in this
environment... This closes Q-gap-1/Q-gap-2's premise for any future
fresh `/expert-plan` authoring pass in this environment... **Disposition:
closed. No further owner ruling is requested on this entry.**"

But the same section, two paragraphs earlier, states about this fix
pass's own work: "*this pass's own judgment calls (the write-time
restraint mechanism, the wrapper placement, the repo-set disclosure, the
interface widening) are disclosed as manual reasoning in the plan's own
Decisions sections, not run through Clear Thought.*" And Q-gap-2 (lines
5825–5858) states: "*this fix pass's own new judgment calls (C1's
write-time restraint mechanism, N5's wrapper placement, C3's repo-set
disclosure, P4's interface widening) are reasoned the same way — in the
document, in the open... disclosed as manual reasoning rather than as a
Clear-Thought trace.*"

**How this was verified.** Read plan §15 Q-gap-1, Q-gap-2, Q-gap-5 lines
5789–6019 in full this session. Ran `ToolSearch(query=
"select:mcp__codegraph__codegraph_scan")`, `ToolSearch(query=
"codegraph")`, `ToolSearch(query="clear-thought")`, and `ToolSearch
(query="sequential thinking mental model reasoning")` — all four
returned no matching deferred tools this session. Ran `Bash: claude mcp
list` — both `codegraph` and `clear-thought` show `√ Connected` at the
CLI-config level, confirming the registration itself is real and not
the failure point.

**Named standard violated.** `expert-plan` SKILL.md's own binding rules,
quoted verbatim in the plan itself and in the meta-check review: Step 2a
("If `codegraph_scan` errors or returns nothing, stop and report. Do
not substitute manual file walking."); Step 6 ("Clear Thought is
mandatory for every plan... not conditional... A plan produced without
a Clear Thought trace has not satisfied this step and is
non-compliant."); and the delivery-semantics line ("A plan with any open
register entry is not deliverable"). None of these three rules carries
an exception for "a correction pass that applies already-diagnosed
findings rather than authoring net-new architecture" — that carve-out
is the fix pass's own argument, not a clause in the cited standard.

**Why the closure fails on its own evidence.** The original S3 finding's
premise was: this pass's load-bearing judgment calls were made without
the mandated tools, in violation of a rule with "no fallbacks." Fixing
the *environment* (registering the MCP servers) does not retroactively
make the judgment calls that were already made — Step 2.5's placement,
the C1 write-time-restraint mechanism, C3's repo-set disclosure, P4's
interface widening, all genuinely load-bearing decisions this same fix
pass introduced — compliant. The plan's own text concedes this in the
same breath it declares the entry closed. "Disposition: closed" is
therefore not a closure of the cited standard; it is a closure of a
different, easier claim ("the tools are now reachable from the CLI")
substituted for the one SKILL.md actually asks. This is the same
reasoning-pattern the skill's own "no fallbacks" section forecloses by
name: substituting an adjacent, easier-to-satisfy claim for the
mandated one.

Separately, the closure's own forward-looking claim — "any future
session that opens fresh in this environment has both tools available"
— was, for the first time, actually put to the test by this review
round (the round `docs/STATUS.md`'s "what to do next" item 1 explicitly
designated to run "with CodeGraph and Clear Thought genuinely available
in this environment"). It did not hold: this session's `ToolSearch`
found neither tool, exactly reproducing the fix-pass session's own
finding. Whether this is a property of the environment in general or an
artifact of how this particular review session was dispatched is
genuinely unclear and is disclosed as such above — but at minimum, the
claim "the next session has the tools" is currently 0-for-2 across the
two sessions that have tested it, which is not evidence a "closed" status
should rest on without qualification.

**What correct disposition looks like.** Either (a) restore the original
three-way escalation to Max Cogar (accept the skill-non-compliant plan
with the substitutes named / halt until the tools are demonstrated
callable inside an authoring or review session / waive SKILL.md Steps
2 and 6 for this plan with the waiver logged in `docs/collapse-log.md`)
— this is what the prior round's S3 finding actually asked for, and
registering the servers at the CLI level does not discharge it; or (b)
before declaring Q-gap-5 closed, demonstrate — in a session transcript,
not by assertion — that CodeGraph and Clear Thought are actually
callable, and re-run this fix pass's own load-bearing judgment calls
(Step 2.5's placement, C1, C3, P4 at minimum) through them, updating
§10A with the resulting traces. Either path is honest; declaring closure
on the strength of `claude mcp list` output while the plan's own text
admits the compliance gap persists is not.

**Classification.** Serious. **Recurring** (Provenance: this is prior
finding S3, re-derived against current source and found not closed —
not a new finding).

---

### Serious — T2.5-1, T18-2, and T21-2 are cited as this fix pass's own verification evidence but have no §12 test specification anywhere in the document

**What the plan says.** Step 2.5's Verification field (line 754):
"`T2.5-1` (`oracleSpawn` sets `CTXORACLE_INTERNAL=1` on the child's env;
a child process reading `process.env` sees it)." Step 18's Verification
field (line 1686): "`T18-2` (`checkDenyFromInjectedTurn` induced...)."
Step 21's Verification field (line 1857): "`T21-2` (`refreshIfStale`'s
spawn call is `oracleSpawn`, not `child_process.spawn` directly —
compile-time/structural, paired with `T41-1d`)." §5.1 also names a
fixture repo for one of them: line 477, "`injected-turn/` # T18-2
(deny_from_injected_turn)."

**What §12 actually contains.** Grep of every `**T<n>-<n>` heading in
§12 (this session) produced 88 distinct test-specification headings.
Grep of every `T<n>(.n)?-<n>` token anywhere in the document produced 96
distinct mentions. Diffing the two: `T2.5-1`, `T18-2`, and `T21-2` are
referenced as verification evidence but have **zero** matching `**T…`
heading anywhere in §12.1–§12.4. No File/Verifies/Level/Real-doubles/
Data/NOT-asserts sextet exists for any of the three.

**How this was verified.** `Bash` extraction: `grep -oE
'T[0-9]+(\.[0-9]+)?-[0-9]+[a-z]?' docs/plans/plan-phase-a.md | sort -u`
(96 lines) vs. `grep -oE '^\*\*T[0-9]+(\.[0-9]+)?-[0-9]+[a-z]?'
docs/plans/plan-phase-a.md | sed 's/^\*\*//' | sort -u` (88 lines);
`comm -23` of the two sorted lists returned `T18-2`, `T2.5-1`, `T21-2`,
`T32-1a`, `T41-1a`, `T41-1b`, `T41-1c`, `T41-1d`. Read T41-1's own §12
entry (lines 4528–4544) confirms its Data field enumerates only three
sub-files (`no_direct_dao_from_handler.test.ts`,
`hook_field_names_isolated.test.ts`, `permission_decision_confined.
test.ts`), explaining the `a/b/c` sub-labels as references into that
one shared spec — but `T41-1d` (`oracle_spawn_confined.test.ts`, listed
in §5.1 line 421 and cited in Step 2.5's own Verification field, line
758, as "added to Step 41's existing convention suite alongside
`T41-1a`–`T41-1c`") is not named anywhere in T41-1's Data field, so the
fourth sub-file this fix pass added to the shared convention-test spec
was never actually folded into that spec.

**Named standard violated.** `expert-plan` SKILL.md Step 9 (the same
standard S2 was found to violate in round 1): "Every test the plan
requires — new tests, modified tests, and the tests behind any step's
Verification field — gets a specification." §12's own intro (line
3918): "Every test the plan requires, per the output-contract §12 rule."
This is not a subtle reading; it is the identical failure mode already
named and fixed once this session (S2), now reproduced for three of the
tests this same fix pass introduced to close two of the collapse-hunt's
own findings (N5's `oracleSpawn` enforcement; P2's transient
wrongful-deny counter).

**Why it matters.** N5 and P2 were both genuine, substantive findings
from the collapse-hunt — N5 about the recursion guard having no
structural enforcement, P2 about a wrongful-deny class the prior text
had overclaimed away. The fix pass's mechanism-level response to both
(the `oracleSpawn` wrapper; the `deny_from_injected_turn` counter) is
sound and well-reasoned in the step bodies. But an implementer following
the plan has no test specification telling them what T2.5-1, T18-2, or
T21-2 must actually assert, what data fixtures they need, what level
they run at, or what their failure condition is — the exact
"coverage theater" gap this plan's own Step 39 Impact-if-wrong field
warns against ("Every fixture that could detect the failure the test
does not is a missing coverage entry"). The two collapse-hunt fixes this
pass is proudest of (N5, P2) are the ones left unspecified.

**Correct implementation.** Add three §12 entries — `T2.5-1` under
§12.1 (unit tier, alongside the other Step-N unit tests), `T18-2` under
§12.2 (it already has a Verifies clause and a fixture repo named — just
needs the full six-field sextet built out from that), `T21-2` under
§12.1 — each with File/Verifies/Level/Real-doubles/Data/NOT-asserts
fields per the same standard §12's other ~85 entries meet. Also extend
T41-1's Data field to name the fourth sub-file (`oracle_spawn_confined.
test.ts`) explicitly, matching what Step 2.5's own text already claims
was done ("added to Step 41's existing convention suite").

**Classification.** Serious. **New** — introduced by this fix pass's own
Step 2.5/N5/P2 additions; not present in round 1 (Step 2.5 did not
exist then). **Provenance:** new (Scope 2 regression).

---

No further Critical findings — verified by the full read of §7 (Steps
1–43 plus Step 2.5) and §12 this session; no violation of Critical
severity (a defect that would be fundamentally broken by engineering
standards and cause real problems in production, as distinct from a
planning-document coverage or cross-reference gap) was observed.

---

## Systemic Patterns

### Fix-pass content not propagated to the plan's own cross-referencing and rationale surfaces

**The proactive scan.** After finding the D-plan-6 staleness (below),
this reviewer suspected a pattern and ran the following scans across
the full §7/§10/§10A/§5.1/§12/§12.5 inventory before classifying:

- `Grep "RETRACTED|retracted|Retracted"` → 3 hits (D-plan-2 framing note,
  D-plan-6's own retraction header, and the §14.1 Q1 disposition that
  references it). Each hit's context was read.
- `Grep "D-plan-6"` → 6 hits; `Grep "D-plan-8|Q-plan-marker"` → 4 hits.
  Each hit's context was read and cross-checked against the mechanism
  each decision currently describes in §7.
- `Grep "oracle_spawn|proc/|cli\.ts"` → 4 hits, cross-checked against
  §5.1's file skeleton.
- The T-ID diff described in the Serious finding above (96 mentions vs.
  88 headings) — a full-document scan, not a sample.
- `Grep "^\| 25 \|"` in §12.5's Step→T-ID table — 1 hit, checked against
  Step 25's own Verification field.

**Instances enumerated (7):**

1. **D-plan-6 (§10A, lines 3467–3490) contradicts D-plan-6's own
   retraction (§10, lines 3251–3283).** §10 states, in this same fix
   pass: "**D-plan-6 — RETRACTED**... This retraction removes the
   owner-run-probe step from the build altogether." But §10A's
   collapse-test entry titled "D-plan-6 (L11 verifications as owner-run
   markdown probes)" was not updated: it still poses "Job. Preserve the
   credential-free property... no automated verification... can run
   inside the tool's process" and answers "Each probe is a
   copy-and-paste one-liner... **Steers toward.** Max running two short
   probes and pasting a two-line result into a follow-up PR." A reader
   consulting §10A for "what does the plan currently ask of Max Cogar
   for L11" gets the retracted answer, not the current one (no probes
   at all, per §10's own text two sections earlier).

2. **D-plan-8 (§10, lines 3294–3303, and §10A, lines 3516–3536) both
   describe and defend a mechanism Step 31 has already replaced.** Both
   sections state: "the writer adds `\"comment\": \"installed by
   ctxoracle\"` (or a similar recognized field) to each hook entry
   block" and "**Steers toward.** Implementer implementing `deinit` by
   marker-match, not by exact-command-string match." But Step 31 item 4
   (lines 2399–2409) and its own "**Q-plan-marker (resolved)**" note
   (lines 2418–2427) explicitly replace this: "The marker is the
   entry's own `\"command\": \"ctxoracle hook <event>\"` string, not a
   separate comment or marker field... the open hole is closed by
   removing the surface it would have opened on." Grep confirms
   "Q-plan-marker" appears only inside Step 31's own text (lines 2403,
   2418) and is never cross-referenced from either D-plan-8 entry. This
   is the same shape as instance 1: the redesign that fixed collapse-hunt
   P3 landed in §7 but never propagated to the two decision-rationale
   sections that exist specifically to explain and defend it.

3. **`src/proc/oracle_spawn.ts`** (created by Step 2.5, line 714) **is
   absent from §5.1's file skeleton**, which states of itself (line
   267): "Every source file named below is created by exactly one §7
   step... Cross-checked mechanically at plan-write time." §5.1's
   `src/` tree (lines 278–366) has no `proc/` directory at all.

4. **T2.5-1, T18-2, T21-2 missing from §12** — detailed as its own
   Serious finding above; also an instance of this pattern (new content
   this pass introduced was not carried into the plan's test-spec
   surface).

5. **T41-1's own Data field (§12, lines 4528–4544) was not extended for
   the fourth sub-file `T41-1d`** that Step 2.5's own text (line 758)
   says was "added to Step 41's existing convention suite alongside
   T41-1a–T41-1c" — T41-1's Data field still names only three files.

6. **§12.5's Step→T-ID mapping table (line 5406) omits T25-8 and
   T25-9** for Step 25, even though these are the two tests this exact
   fix pass added to close S2, and Step 25's own Verification field
   (§7, lines 2102–2112) cites them by name. The AC→T-ID table two
   sections earlier (line 5358) *was* updated for the same tests
   (AC-8's row correctly points at T25-8) — only the Step→T-ID table
   was missed, meaning the fix pass updated one of the two required
   reconciliation surfaces and not the other.

7. **Step 31's own body (line 2383, "Create `src/cli.ts` — verb
   dispatcher") is stale against §5.1's renamed file** (line 280,
   `dispatch.ts # Step 31 — verb dispatcher (previously src/cli.ts)`).
   §5.1 records that the dispatcher was renamed from `src/cli.ts` to
   `src/cli/dispatch.ts` (resolving the author-gates review's C5 "cli/
   vs monolithic cli.ts" ambiguity) — but Step 31's own prose, which an
   implementer reads to know what to build, was never updated to match.

**Named standard.** `expert-plan` SKILL.md's reconciliation-sweep
discipline (§14 "the sweep is complete only when an entire pass adds
zero new register entries," and Gate C item 8, "the sweep pass count is
recorded and the final pass added zero entries") and, at the project
level, `CLAUDE.md`'s "Verify before you assert — this workspace's most
damaging recurring failure": "'Applied all findings' requires
re-checking that none were dropped." Both apply across all seven
instances — each is a place where new or changed content was not
carried to every surface a mechanical reconciliation pass would have
touched.

**Why this is systemic, not isolated.** This is not one missed
cross-reference; it recurs across four structurally distinct surfaces
of the plan (§10/§10A decision-rationale pairs, §5.1's file skeleton,
§12's test-specification section, §12.5's reconciliation tables), and
in two cases (instances 1 and 2) the staleness is not cosmetic — it
means the plan currently contains two directly contradictory
descriptions of what the settings.json marker mechanism and the L11(b)
verification workload actually are. This is precisely the failure this
project's own C2 finding (author-gates review, "the reconciliation-sweep
attestation is fabricated") already caught once on the original draft —
and §14.4's own Pass C for this fix pass explicitly claims to have
checked exactly this ("walked each D-plan-* entry's §10 rationale
against its §10A collapse-test... **Zero other drift found**," line
5751) and did not catch instances 1 or 2. The sweep attestation that
exists specifically to prevent this pattern did not prevent it,
recurring in the very pass whose job was to fix the first occurrence.

**What correct looks like.** Re-run Pass C of §14.4 for real — walk every
D-plan-* entry's §10 rationale against its §10A collapse-test and
against what §7 actually implements, not against what was true at
authoring time — and update the two stale D-plan-6/D-plan-8 sections to
match their current mechanisms. Add `src/proc/oracle_spawn.ts` to §5.1.
Add the three missing §12 test specifications and extend T41-1's Data
field. Add T25-8/T25-9 to §12.5's Step→T-ID row for Step 25. Fix Step
31's `src/cli.ts` reference to `src/cli/dispatch.ts`. Then re-run the
same grep-based checks this review used (T-ID diff, `D-plan-*`
occurrence walk, file-skeleton cross-check) as the sweep's own mechanism
rather than a prose attestation, so the next round can verify the sweep
happened rather than re-discover that it didn't.

**Classification.** Systemic.

---

## Moderate & Minor Findings

### Moderate — T32-1a is cited as an existing test but is not defined anywhere in the plan

**What the plan says.** T32-1's own "NOT asserts" field (line 5089):
"Not `--purge` behavior (`T32-1a`)."

**How this was verified.** The same T-ID diff used for the Serious
finding above (`comm -23` of all T-ID mentions against all §12
headings) includes `T32-1a` in the unmatched set. Grep of `T32-1a`
specifically in the full document returns exactly one hit — this same
line. Step 32's own Verification field (§7, line 2510) cites only
`T32-1` and `T32-2`; §5.1 and §12.5 have no `T32-1a` entry either.

**Named standard violated.** The same SKILL.md Step 9 standard as the
finding above: `--purge`'s behavior (Step 32's body: "on `--purge`,
delete the project store and its diagnostics directory") is described
as tested by a T-ID that does not exist, which is functionally
equivalent to it being untested — an implementer or a future audit
sees "T32-1a" in T32-1's own spec and reasonably assumes coverage exists
elsewhere in the document; it does not.

**Correct implementation.** Either add a real `T32-1a` spec (fixture:
run `deinit --purge`, assert the project store and diagnostics
directory are removed) or change T32-1's "NOT asserts" line to state
honestly that `--purge` is currently untested and needs a new test ID.

**Classification.** Moderate. Unlike the seven systemic-pattern
instances above, this reference is not obviously attributable to this
specific fix pass's new content (Step 32 was not itself rewritten this
pass) — it is reported standalone rather than folded into the systemic
count.

---

No further Moderate or Minor findings beyond the one above and the
seven enumerated under the Systemic Pattern — verified by the full
line-by-line read of §7 (Steps 1–43 and 2.5), §12 (all subsections), the
T-ID cross-diff (96 mentions vs. 88 headings, all eight unmatched tokens
accounted for above), and the architecture/spec citation spot-checks
(seven sampled, zero mismatches).

---

## Tentative Findings

- **Whether the tool-registry non-attachment observed this session
  (Q-gap-5's core disclosure) is a durable property of this environment
  or an artifact specific to how this review session was dispatched (a
  subagent inside an ongoing session, rather than a brand-new top-level
  Claude Code session) is not resolved by this review.** What is
  confirmed is the narrower, sufficient fact used in the S3 finding
  above (two consecutive sessions, including the one designated to test
  it, found neither tool attached). A definitive answer would require
  observing a genuinely fresh top-level session's `ToolSearch` result in
  this same environment — outside what this review could arrange.
- **Whether collapse-hunt fixes C1 (the write-time predicate cap on
  Step 14/18/23) and C3 (the exit-run repo-set disclosure) will actually
  hold under build-time pressure is not verifiable from the plan text
  alone** — both are process commitments whose enforcement is
  implementer discipline plus the Checkpoint 2/5 review gates, not a
  structural test the way S1/AD-10's confinement grep is. This is not a
  finding against the plan (the collapse-hunt itself accepted this kind
  of mitigation for C1), but it is flagged as a premise this review
  could not test empirically, only read.

---

## What's Actually Good

- **S1's fix is structurally sound, not just textually corrected.** Step
  31 now depends on Step 21 (`runIndex`) directly rather than Step 32's
  CLI verb, and the reasoning is stated in the step body itself, not
  only in a changelog-style note. **Verified by:** Read of Step 31 lines
  2381–2461 and Step 21's `runIndex` export (line 1813) this session —
  the function Step 31 calls actually exists at Step 21, strictly
  earlier in the build order. **Standard:** the plan's own §7
  topological-sort guarantee, now actually satisfied for this pair.

- **S2's two new tests (T25-8, T25-9) test the actual content
  requirement, not a proxy for it.** T25-8's "Fails when" clause names
  exactly the failure AC-8 exists to prevent: "the emitted whisper's
  headline names only run-state... without naming the covering-test →
  changed-region mapping." This is a materially different (and harder)
  test than the T26-1/T26-2 classifier tests the mapping table pointed
  at before. **Verified by:** Read of T25-8 lines 4851–4874, T25-9 lines
  4876–4894, and spec AC-8's content assertion at spec lines 1020–1023
  — the fixture's failure condition and the AC's own wording match.
  **Standard:** `expert-plan` SKILL.md Step 9 ("what behavior is
  verified — the specific observable behavior, traced to the spec
  requirement").

- **The `tsconfig.test.json`/`dist-test/` fix (C2) closes what was
  probably the single most consequential defect in round 1's silent
  scope — a plan whose entire test suite would not have executed.**
  Step 1 now compiles `src/`+`test/` together to `dist-test/` before
  `node --test` runs, and Step 15's confinement grep is explicitly
  re-scoped to `dist/` (production only) so it cannot be confused with
  `dist-test/`'s deliberately-failing T15-1 fixtures. **Verified by:**
  Read of Step 1 lines 601–653, Step 15 lines 1422–1492, and T15-2's
  own "Fails when" clause (lines 4340–4360) explicitly distinguishing
  the two compile targets. **Standard:** the collapse-hunt's own C2
  finding, closed against its own stated failure mode (a `.ts` test
  file that `node --test` silently fails to load, reporting "0 tests
  found" as a false green).

---

## Recommended Priority

1. **The Systemic Pattern (D-plan-6/D-plan-8 staleness first).** Fix the
   two decision-rationale contradictions before anything else — they are
   the two instances where the plan currently gives a reader two
   different, incompatible answers about a live mechanism (the
   settings.json marker; the L11(b) workload). Then work through the
   remaining five instances (the file-skeleton gap, the two §12 gaps,
   the mapping-table gap, the stale `cli.ts` reference) as a single
   mechanical pass, re-running the grep checks this review used to
   confirm the pass actually closed them (not just asserting it did —
   the exact discipline whose absence caused this pattern in the first
   place).

2. **T2.5-1 / T18-2 / T21-2 test specifications.** These back the fix
   pass's two most substantive collapse-hunt closures (N5, P2); without
   specs, those closures are unverifiable as written. Mechanical to add
   — the step bodies already describe what each test needs to assert.

3. **S3 / Q-gap-5.** This is not a plan-writer text fix. Either escalate
   to Max Cogar per the original three-way framing (accept / halt /
   waive), or demonstrate — with an actual tool-call transcript — that
   CodeGraph and Clear Thought are callable inside an authoring or
   review session in this environment, and re-run this fix pass's own
   load-bearing judgment calls through them before declaring the entry
   closed.

4. **T32-1a.** Add the missing `--purge` test or correct the phantom
   reference. Low effort, low urgency relative to the above.

---

## Verdict

Verdict: NEEDS FIXES (9 findings: 1 Systemic pattern spanning 7 instances, 2 Serious, 1 Moderate)
