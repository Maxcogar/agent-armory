# Expert review (round 5, re-review) — `docs/plans/plan-phase-a.md`

**Date:** 2026-09-07
**Reviewer:** fresh independent `/expert-review` pass; not the plan-writer,
not the author of any of the eight prior review documents on this artifact,
no prior context on this session.
**Artifact:** `/home/user/agent-armory/middleware/context-oracle/docs/plans/plan-phase-a.md`
at its current state on branch `claude/plan-correction-strategy-57ot28` —
commit `c67cf8c` (6855 lines), read in full across sequential `Read` calls
with no gaps. **Note on timing:** this task was dispatched against commit
`19619f3` (round 4's fix pass). While this review was in progress, a
separately-dispatched round-5 collapse-hunt (per the project's standard
practice of dispatching collapse-hunt and expert-review together each
round) found two defects, fixed them, and landed commit `c67cf8c`
("context-oracle: fix round-5 collapse-hunt findings"), publishing
`docs/reviews/2026-09-07-round-5-plan-collapse-hunt.md`. Per this task's
own instruction to read the file fresh and not assume cached content,
this review is against `c67cf8c` — the artifact's true current state —
and explicitly re-verifies the round-5 collapse-hunt's own closure claims
rather than trusting them, per the same discipline applied to every prior
round's attestations.
**Round:** 5 (re-review of round 4's fix pass plus the concurrent round-5
collapse-hunt's fix pass, per the Re-Review Protocol in
`middleware/context-oracle/.claude/commands/expert-review.md` — the
project-scoped copy, since `/home/user/agent-armory/.claude/commands/
expert-review.md` does not exist in this repo). Round 1: 10 findings, all
fixed. Round 2: 9 findings (1 Systemic × 7 instances, 2 Serious, 1
Moderate, plus the Q-gap-5 overclaim), all fixed. Round 3: NEEDS FIXES (1
Systemic × 2 instances, 2 Moderate, 1 Minor), all fixed; companion
collapse-hunt found 2 collapses + 2 partials, also fixed. Round 4: NEEDS
FIXES (1 Systemic pattern spanning 2 instances), all fixed; companion
collapse-hunt found 2 collapses, also fixed. Round 5's own collapse-hunt
(concurrent with this review): 2 collapses found and fixed (§3's Standards
registry misattributing SQLite WAL semantics to Step 32 instead of Step
37; §5.3 misattributing the `init` verb to Step 30 instead of Step 31) —
**this review independently re-verifies both as genuinely closed, and
separately finds the collapse-hunt's own "48 citations checked, only these
two were wrong" completeness claim to be false** (see Systemic Instance A,
below): four more instances of the identical defect the collapse-hunt was
specifically hunting for survive elsewhere in the document, in sections
its own attestation claims to have fully read.

---

## Scope and Inventory

### Tool-plan disclosure

`ToolSearch` for CodeGraph/Clear Thought was not re-invoked this round —
this round's task is scoped to verifying textual/structural claims about a
Markdown planning document (literal-content and absence claims, per Step 5
of the process document), the same disposition every prior round recorded,
and round 3 already independently reproduced the Q-gap-5 MCP protocol
claim by direct stdio invocation. This round's verification method for
every claim below is Read (file:line) or Grep (query + result count) —
never memory, never trust in a prior review's or collapse-hunt's narrative
or completeness attestation, including this round's own concurrent
collapse-hunt.

### Scope 1 — Round 4's finding-groups, plus the concurrent round-5 collapse-hunt's fixes, as closure items

- [x] **Round-4 Instance A (Step 40's body and §14.1's Q13 described the
  retracted owner-run L11 probe design).** Read Step 40 in full (current
  lines 2994–3070): "What changes" lists `test/build_time/
  l11_a_measurement.md` and `l11_b_disposition.md`, matching §5.1's
  skeleton (lines 505–512, Read). §14.1 Q13 (lines 6164–6183, Read) is
  headed "SUPERSEDED BY §14.3'S Q-GAP-4" and points to Q-gap-4 rather than
  restating the retracted design. Grep-confirmed
  `real_transcript_marker_probe|user_prompt_submit_provenance`: 1 hit, and
  it is inside Q13's own self-correcting explanation of the *prior* wrong
  text, not a live restatement. **Closed.**
- [x] **Round-4 Instance B (Step 32's Verification field never cited
  `T32-1a`).** Read Step 32's Verification field (current lines
  2592–2603): now cites `T32-1`, `T32-1a`, and `T32-2` separately, matching
  T32-1's own "NOT asserts: `--purge` behavior (T32-1a)" (line 5586,
  Read) and §12.5's Step→T-ID table (line 5937, Read: "32 | T32-1, T32-1a
  (round-2 fix), T32-2"). **Closed.**
- [x] **Round-4 collapse 1 (Step 14's `lexicon.stoplist` → Step 8).** Read
  Step 14 (current lines 1388–1391): "seeded... at Step 23, invoked at
  `init`." **Closed.**
- [x] **Round-4 collapse 2 (§2.3's coverage table — four wrong step-number
  rows).** Read §2.3 (current lines 160–170) against each cited step's own
  heading (Step 25 line 2111, Step 21 line 1858, Step 22 line 1922, Step
  36 line 2757, Step 33 line 2608, Step 38 line 2842 — all Read). All four
  rows now match. **Closed.**
- [x] **§10A "Test tier split" Answer field (fixed by round 4).** Read
  lines 3765–3780 (current): "both L11 preconditions are now resolved, not
  scheduled as manual probes... there is no manual step left for anyone to
  skip." **Closed as to the Answer field specifically — but see Systemic
  Instance B below**, which finds the same entry's Job (line 3760) and
  Steers-toward (line 3782) fields, never touched by round 4's edit, still
  contradict this corrected Answer.
- [x] **§14.4 Pass J / Pass K entries.** Read lines 6364–6403 (current):
  both present and accurate. **Closed.**
- [x] **Round-5 collapse-hunt Collapse 1 (§3's Standards registry cited
  Step 32 for SQLite WAL/concurrency; concurrency is Step 37).** Read line
  230 (current): "Governs Step 37 (concurrency) — corrected this fix pass,
  round 5..." Cross-checked against Step 37's own heading (`### Step 37 —
  Concurrency: WAL retry-once + directory locks`, line 2802, Read) and body
  (WAL/`busy_timeout`/retry-once/ULID content, Read). Grep-confirmed
  `Governs Step 32` / `Step 32 (concurrency)` — 0 remaining hits. **Closed,
  genuinely** — the collapse-hunt's fix is accurate and complete for this
  specific citation.
- [x] **Round-5 collapse-hunt Collapse 2 (§5.3 attributed the `init` verb
  to Step 30 instead of Step 31).** Read lines 530–536 (current): "it is
  the runtime effect of Step 31 (the `init` verb)... corrected this fix
  pass, round 5." Cross-checked against Step 31's own heading (line 2460)
  and body (items 1–6, building `init`, Read). **Closed at this one site
  — but this collapse-hunt's own completeness claim about the pattern is
  false**, per Systemic Instance A below: it fixed only 1 of 5 sites
  carrying the identical "Step 30's `init`" defect, and its attestation
  ("48 such citations checked... only these two were wrong," "every §7
  step body, Steps 1–43... in full") is contradicted by four sites
  sitting inside exactly the step bodies it claims to have fully read
  (Steps 2, 8, 23, 29).

**Scope 1 result: every finding from round 4's expert-review and
collapse-hunt is genuinely closed. Of the round-5 collapse-hunt's own two
fixes, one (Step 32→37) is fully accurate and complete; the other (the
`init`-verb misattribution) fixed a real instance but left four siblings
of the identical defect standing in sections the collapse-hunt's own
attestation claims to have read in full — this is itself a new instance
of the recurring "a sweep's own attestation of completeness is not
verification of completeness" lesson `docs/collapse-log.md` already
carries, now demonstrated inside a round-5 collapse-hunt whose entire
subject was that exact lesson.**

### Scope 2 — Full-document regression scan (mandatory full read, not sampled)

- [x] Front matter + §1 Goal + §2.1/2.2 Scope (lines 1–154) — Read in
  full. No defect.
- [x] §2.3 Coverage reconciliation table (lines 155–172) — Read in full;
  cross-checked against every cited step's own heading. No defect.
- [x] §2.4–§4 (lines 173–249), including §3's Standards registry — Read
  in full; every `Governs Step N` line cross-checked against the named
  step's own heading and Source citation. Only the now-fixed WAL/Step 37
  line was ever wrong; all other entries (Steps 11/22/30/34 for security,
  24/20 for ROSE, etc.) correctly match their steps. No new defect.
- [x] §5/§5.1–§5.5 file skeleton (lines 251–559) — Read in full, including
  every `# Step N` comment against the constructing step's own heading.
  §5.3's `init`/Step 31 citation confirmed fixed (Scope 1, above). No new
  defect in this section.
- [x] §6, §8 (lines 561–580, 3258–3274) — Read in full. No defect.
- [x] §7 Steps 1–43 + Step 2.5, every step body in full (lines 582–3256,
  across nine sequential `Read` calls with no gaps) — cross-checked every
  `Step N` cross-reference inside each step's own prose against the step's
  own construction target. **New findings: lines 683 (Step 2), 1088 (Step
  8), 2051 (Step 23), 2376 (Step 29) all still misattribute the `init`
  verb to "Step 30" instead of Step 31 — the four sibling sites of the
  round-5 collapse-hunt's own Collapse 2, un-fixed (Systemic Instance A).
  Line 2876 duplicated verbatim at line 2929 inside Step 38 (Minor
  finding, below).**
- [x] §9 Checkpoints (lines 3276–3320) — Read in full; Checkpoint 3's
  "After Step 30 (delivery)" is correct. No defect.
- [x] §10 Decisions D-plan-1..8 (lines 3322–3465) — Read in full. No new
  defect.
- [x] §10A collapse-tests, every D-plan-* and N1–N6 entry in full (lines
  3466–4015) — Read in full. **New finding: the "Test tier split" entry's
  Job (line 3760) and Steers-toward (line 3782) fields still read
  "build-time markdown probes" / "build-time probes," contradicting the
  same entry's own round-4-corrected Answer field, lines 3765–3780
  (Systemic Instance B).** No other stale field found in any other §10A
  entry.
- [x] §11.1–§11.6 (lines 4017–4294) — Read in full. Spot-verified the
  architecture quotes directly against `docs/architecture-phase-a.md`:
  AD-2 ("the only file allowed to import `node:sqlite`," lines 336–337,
  confirmed verbatim), AD-4 (line 540, confirmed verbatim), AD-19 (lines
  1337–1338, confirmed verbatim). No defect.
- [x] §12.1 Unit tier, T1-1 through T43-1 (lines 4296–5010) — Read in
  full, cross-checked each `Verifies` field against the step it names. No
  defect.
- [x] §12.2–§12.4, T16-1 through T40-6 (lines 5011–5849) — Read in full.
  No defect.
- [x] §12.5 Coverage attestation, both mapping tables (lines 5850–5960) —
  Read in full; every AC→T-ID row and every Step→T-ID row cross-checked.
  No defect.
- [x] §13 Risks R1–R10 (lines 5962–6075) — Read in full; each
  "Mitigation" step citation cross-checked against the named step's
  actual content. No defect.
- [x] §14.1 Bin 1 (lines 6083–6183), §14.2 Bin 2 (lines 6185–6229), §14.3
  Bin 3 (lines 6231–6281), §14.4 Reconciliation sweep (lines 6283–6419) —
  all Read in full. Investigated the `(Step 8, already-run this session)`
  parenthetical on the D-plan-6 bullet (line 6202) against Step 40 (the
  actual owner of the L11 workload) — **resolved as not a confirmed
  defect**: the Q-gap register's own `(Step N)` convention (Q-gap-1 `Step
  2`, Q-gap-2 `Step 6`, both confirmed by their own disposition text to
  cite `expert-plan` SKILL.md's own process-step numbering, not this
  plan's build steps) makes it plausible this bullet mirrors Q-gap-4's own
  SKILL.md-step citation for consistency. See Tentative Findings.
- [x] §15 Gaps acknowledged, Q-gap-1 through Q-gap-5 in full (lines
  6422–6785) — Read in full. No new defect.
- [x] §16 Post-completion (lines 6795–6855, end of document) — Read in
  full. No defect.
- [x] `docs/reviews/2026-09-07-round-5-plan-collapse-hunt.md` (356 lines,
  the concurrent round-5 collapse-hunt) — Read in full; both its findings
  independently re-verified (Scope 1, above); its completeness claim
  independently tested by grep and found false (Systemic Instance A).
- [x] `docs/reviews/2026-09-07-round-4-plan-collapse-hunt.md` (432 lines)
  and `2026-09-07-round-4-plan-expert-review.md` (197 lines) — both Read
  in full.
- [x] `docs/reviews/2026-09-07-round-3-plan-collapse-hunt.md`,
  `-round-3-plan-expert-review.md`, `-round-2-plan-collapse-hunt.md`,
  `-round-2-plan-expert-review.md`, `2026-09-06-plan-collapse-hunt.md`,
  `2026-09-06-plan-expert-review.md` — consulted for historical trajectory
  context; not re-litigated as this round's own findings since rounds 3–5
  already re-verified them closed.
- [x] `docs/specs/spec-context-oracle.md` §14 (lines 908–1138) — Read in
  full.
- [x] `docs/architecture-phase-a.md` AD-5 (568–646), AD-9 (736–923), AD-10
  (924–946), AD-14 (1073–1129), AD-24 (1513–1629) — Read in full,
  spot-checked directly against the plan's current citations.
- [x] `docs/STATUS.md` (282 lines) — Read in full.
- [x] `OWNER-LEDGER.md` (81 lines) — Read in full.
- [x] `docs/collapse-log.md` — all 2026-09-07 entries (lines 1–345) Read
  in full.
- [x] `middleware/context-oracle/CLAUDE.md` — Read in full.
- [x] `middleware/context-oracle/.claude/commands/expert-review.md` (226
  lines) — Read in full, first.

**Rigor waivers:** none. **Instrument unavailability:** CodeGraph/Clear
Thought were not re-invoked this round; disclosed, non-gating, per every
prior round's disposition.

---

## Summary

**This review returns NEEDS FIXES.** Every finding from round 4's
expert-review and collapse-hunt is genuinely closed against current
source. Of the two fixes the concurrently-dispatched round-5 collapse-hunt
landed (commit `c67cf8c`) while this review was in progress, one (§3's
SQLite-WAL Standards-registry citation, Step 32 → Step 37) is fully
accurate and complete on independent re-verification. The other (§5.3's
`init`-verb citation, Step 30 → Step 31) fixed a genuine instance of the
recurring "wrong step-number citation" defect but is not, contrary to its
own attestation ("48 such citations checked... only these two were
wrong"), the complete fix: this review's own full-document read and
mechanical grep found **four more sites carrying the identical defect**
— inside Step 2, Step 8, Step 23, and Step 29's own bodies, sections the
collapse-hunt's attestation explicitly claims to have read in full — all
still misattributing the `init` verb to "Step 30's `init`" instead of the
correct Step 31. This is itself the sharpest demonstration yet of this
document's own standing lesson (`docs/collapse-log.md`, 2026-09-07
entries): a sweep's attestation of completeness is not verification of
completeness, and this round shows it holding true even for a sweep whose
entire stated purpose, this same round, was to catch exactly this defect
class. A second, independent instance of the pattern survives inside the
§10A "Test tier split" collapse-test entry: round 4 correctly rewrote the
entry's Answer field to retire the "owner-run markdown probe" framing for
Step 40's two L11 files, but the same entry's Job and Steers-toward
fields — three and twenty-two lines away, inside the identical four-part
block — still call those files "build-time markdown probes" and
"build-time probes," directly contradicting the entry's own corrected
Answer. A third, Minor finding (a verbatim-duplicated paragraph inside
Step 38) is also new this round. Per the skill's own rule, a re-review
derives its own verdict from its own finding set — it does not inherit
PASS from round 4's or the concurrent collapse-hunt's closure claims — and
the Systemic pattern above makes this round's verdict NEEDS FIXES even
though every finding this review was specifically dispatched to re-check
is closed.

---

## Upstream Contract Verification

**Spec §14 acceptance criteria.** No new AC mapping was touched by round
4's fix pass, the round-5 collapse-hunt's fixes, or this round's own
findings (all are citation-text fixes, not AC-scope changes). Re-confirmed
AC-9 (line 5875: `T18-1, T33-1, T10-1`) and AC-2 (line 5857: `T15-2`) are
unaffected and consistent. No regression in the AC↔T-ID mapping table.

**Architecture design decisions this round's own findings turn on:**

| AD | What it decides | Verification method | Verdict |
|---|---|---|---|
| AD-20 | `init` is specified by name and content at one step, the CLI/init step | Read `docs/architecture-phase-a.md` AD-20 against the plan's `### Step 31 — CLI dispatch + `init` verb` heading (line 2460) and body (items 1–6, lines 2471–2498) | **Step 31 is unambiguously where `init` is built** — the four remaining "Step 30's `init`" misattributions (Systemic Instance A) are a plan-internal citation defect, not an architecture-fidelity gap |
| AD-26 | Concurrency (WAL, retry-once, BEGIN IMMEDIATE) is Step 37's job | Read `docs/architecture-phase-a.md` AD-26 against Step 37's own heading (line 2802) and body | **Honored** — the round-5 collapse-hunt's Step 32→37 fix (§3) is accurate and complete |
| AD-24 | Build-time verifications for L11(a)/L11(b) are resolved records, not owner-run probes | Read `docs/architecture-phase-a.md` AD-24 (1513–1629) against the §10A "Test tier split" entry's Answer field (current, correct) and Job/Steers-toward fields (current, stale) | **Answer field honored; Job/Steers-toward fields contradict it** — an in-document inconsistency, not an architecture violation |
| AD-5 | `tuning`'s WRITER is "seeded at init, changed via `tune`" | Re-read `docs/architecture-phase-a.md:604–613`; compared against Step 8, Step 23, T8-1, T23-1 | **Honored** — round 3/4's fix holds |
| AD-9 | `deny_bypass_suspect` bias disclosed in both directions in `status` | Re-read `docs/architecture-phase-a.md:841–850`; compared against Step 18, Step 33, T33-1 | **Honored**, with test coverage |
| AD-10 | Structural confinement via built-output grep | Re-read Step 15, Step 41, T18-3 | **Delivered** — no regression |
| AD-14 | Bar defaults architect-illustrative, 4-of-6 sourced | Re-read `docs/architecture-phase-a.md:1104–1110`; compared against Step 23, T23-1 | **Honored** |

---

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or
Grep-verified per Compliance Gate B, and no violation of Critical or
Serious classification was observed. The new defects this round found
share the identical signature as rounds 2's, 3's, 4's, and this round's
own concurrent collapse-hunt's already-diagnosed Systemic pattern, and are
reported together as that pattern's next instances, below — not
double-counted here as standalone findings.

---

## Systemic Patterns

### Fix/decision content still not swept to every cross-referencing surface — the pattern rounds 2 (7 sites), 3 (2 sites), 4 (2 instances/4 sites), and this round's own concurrent collapse-hunt (2 sites, 1 accurate + 1 incomplete) already named, recurring in 2 more instances (6 sites total, this review) this round

**The proactive scan.** After finding the first remaining site (line 683,
Step 2), this reviewer suspected the round-5 collapse-hunt's own
"only these two were wrong" claim was itself incomplete and ran the
following scans across the full current document (post-`c67cf8c`) before
classifying:

- `grep -n "Step 30's \`init\`\|Step 30 (the \`init\`"` — 4 matching
  lines, every one Read in context: line 683 (Step 2's "Why this
  approach"), line 1088 (Step 8's round-3 correction text, quoting Step
  23), line 2051 (Step 23's own "Why this approach" — the origin), line
  2376 (Step 29's "What changes"). §5.3's own occurrence (previously the
  fifth site) is confirmed fixed by the concurrent collapse-hunt and no
  longer matches this pattern.
- `grep -n "Step 30\\b"` (broader) — 15 matching lines; 11 correctly refer
  to Step 30 (Delivery — `### Step 30 — Delivery: per-consumer dedup,
  session-boundary reconciliation, Stop-time channel`, line 2413); the 4
  above remain wrong.
- `grep -n "Step 31\\b"` — 17 matching lines; every one that discusses
  `init` (including §5.3's now-fixed line 530, the file skeleton at lines
  280–281, Step 31's own heading at line 2460, its body items 1–6 at
  lines 2471–2498, T31-1/T31-2/T31-3's own §12 specs, §14.1's Q12
  "post-Step 31 (init works)") correctly attributes it there.
- `grep -n "markdown probe\|build-time probe"` (case-insensitive) — 4
  hits: lines 3760 and 3782 (the "Test tier split" entry's Job and
  Steers-toward fields, live present-tense claims), plus lines 3390 and
  3429 (§10's own D-plan-6 entry, explicitly past-tense — "*Prior wording
  proposed two owner-run markdown probes*" — describing the *retracted*
  design, not a live claim).

**Instances enumerated (2, at 6 total locations — 4 for Instance A, 2 for
Instance B):**

#### Instance A — the `init` verb is misattributed to "Step 30" at four remaining sites; the fifth (§5.3) was fixed by the concurrent round-5 collapse-hunt, whose own "48 citations checked, only these two were wrong" attestation is therefore false

**What the plan says at the construction site (correct, unchanged).** Step
31's own heading (line 2460): `### Step 31 — CLI dispatch + `init` verb`.
Its own body (lines 2471–2498, Read in full) implements `init` end to
end: runtime/FTS5 checks, repo-key resolution, store creation and
migration, `.claude/settings.json` hook wiring, and the first `runIndex`
call. Its own Source line cites `AD-20` ("init spec: environment checks,
key derivation, ..., hook wiring, first index"). Step 30's own heading
(line 2413) is Delivery; its own body (lines 2415–2427) builds
`perConsumerDedup`, `handleSessionStart` (for *delivery* dedup, not
`init`), `updateReadSet`, and `deliverStop` — none of which is the `init`
verb.

**What four remaining locations say instead.**
- Step 2 (line 683, current text): "Both are called from **Step 30's**
  `init` verb; Step 2 delivers the functions and their unit tests, not
  the wiring." (Referring to `assertRuntime()`/`probeFts5`, which Step
  31's own body item 1 actually calls.)
- Step 8's round-3 correction (line 1088, current text), quoting Step 23:
  "the actual seeding mechanism per its own Gate-3 rationale (\"the
  alternative, seeding nothing, blocks **Step 30's** `init` entirely\")."
- Step 23's own "Why this approach" (line 2051, current text, the
  original source of the error, unfixed since the plan's original
  authoring): "so `init` has values to seed at all — the alternative,
  seeding nothing, blocks **Step 30's** `init` entirely."
- Step 29 (line 2376, current text): "Update the wired hook commands
  (via **Step 30's** `init`) to set `"timeout": 5` (seconds)..."

**How this was verified.** Read Step 30 (2413–2451) and Step 31
(2460–2540) in full at their own headings; grep-confirmed every remaining
"Step 30's `init`"/"Step 30 (the `init`" occurrence (4 hits) and every
"Step 30\b"/"Step 31\b" occurrence (15 + 17 hits) in the current document,
categorizing each by context; cross-checked Step 31's own Source citation
(`AD-20`) against `docs/architecture-phase-a.md` to confirm `init` is
architecturally a single, named step's job. Separately, read
`docs/reviews/2026-09-07-round-5-plan-collapse-hunt.md`'s own attestation
in full (lines 316–325): it states "a full read of both, plus a full
grep-based cross-check of every 'Step 30/31/32/37' occurrence in the
document, is what surfaced both collapses this round" and "48 such
citations checked; only these two were wrong" (line 339). Both claims are
contradicted by the four sites this review found sitting inside Step 2,
Step 8, Step 23, and Step 29's own bodies — sections that same document's
attestation separately claims to have read "in full" (its own line
288–289: "582–3268 (every §7 step body, Steps 1–43 plus 2.5)").

**Named standard violated.** The same standard rounds 2, 3, 4, and the
concurrent round-5 collapse-hunt itself all cite: `expert-plan` SKILL.md's
reconciliation-sweep discipline, and `CLAUDE.md`'s "Verify before you
assert" rule — which that same rule states applies with special force to
"no label fits"/"nothing remains" style claims. "48 citations checked,
only these two were wrong" is exactly such a claim, and it is false. Line
1088 is also a fresh instance of round 3's specific failure mode (a fix
pass quotes an adjacent sentence without checking the sentence itself is
correct): round 3 rewrote Step 8's body to fix the AD-5 seeding
contradiction and, in doing so, quoted Step 23's rationale verbatim
(including its wrong "Step 30's `init`" phrase) without noticing the
quoted text itself was already citing the wrong step.

**Why it matters.** An implementer reading Step 2, Step 8, Step 23, or
Step 29 in isolation — which is exactly how a topologically-sorted,
step-by-step plan is meant to be read and built — is told the `init` verb
lives at Step 30, a step that in fact builds unrelated delivery-dedup
machinery. Beyond the direct navigational cost, this finding also means
the round-5 collapse-hunt's own closure claim cannot be trusted at face
value by whoever reads `docs/STATUS.md`'s next rewrite if it reports this
pattern as resolved — which is the precise failure this entire five-round
review lineage exists to prevent from reaching Max Cogar uncaught.

**Correct implementation.** Change "Step 30's `init`" to "Step 31's
`init`" at all four remaining sites: line 683, line 1088 (both the quoted
parenthetical and any surrounding prose that repeats it), line 2051 (the
origin — correcting this also fixes the quoted copy at line 1088 if
re-derived from the corrected source), and line 2376.

**Provenance:** three of four remaining sites (lines 683, 2051, 2376) are
pre-existing since the plan's original 2026-09-06 authoring, never caught
by rounds 1–4's or this round's concurrent collapse-hunt's targeted-read
scopes despite the collapse-hunt's own claim to have read these exact
step bodies in full; the fourth (line 1088) was freshly propagated by
round 3's own fix pass, which quoted line 2051's already-wrong text into
Step 8 without independently verifying the quoted claim.

---

#### Instance B — the §10A "Test tier split" collapse-test's Job and Steers-toward fields still call the L11 files "probes," unswept against the same entry's own round-4-corrected Answer field

**What the entry's Answer field says (corrected by round 4, current and
accurate).** Lines 3765–3780, Read in full: "**Answer (corrected this fix
pass, round 4 ...): both L11 preconditions are now resolved, not
scheduled as manual probes.**... there is no manual step left for anyone
to skip."

**What the same entry's Job field says (never touched by round 4's
edit).** Line 3760 (part of lines 3757–3761, Read in full): "**Job.**
Distribute verification across the Test Pyramid so each defect class has
a fast, cheap tier that catches it — unit for recognizer correctness,
fixture-replay for orchestrated AC behavior, **build-time markdown probes
for the two owner-environment premises the tool cannot probe from inside
its own process.**"

**What the same entry's Steers-toward field says (also never touched).**
Line 3782 (part of lines 3781–3784, Read in full): "**Steers toward.** An
implementer running unit + convention on every commit; fixture-replay on
demand; **build-time probes as one-shot pre-exit tasks.** **Guide, not
gate**..."

**How this was verified.** Read the full "Test tier split" entry (lines
3755–3784) in one pass; grep-confirmed `"markdown probe"` and `"build-time
probe"` (case-insensitive) across the full current document — 4 total
hits, 2 of which (D-plan-6 itself, §10, lines 3390/3429) are explicitly
past-tense describing the retracted design, and 2 of which (this entry's
Job and Steers-toward fields) are live, present-tense claims about what
the current build-time tier *is*.

**Named standard violated.** The identical standard as Instance A: content
corrected at one site (this entry's own Answer field, by round 4) was not
swept to two sibling fields of the *same four-part collapse-test entry* —
not even a different step or section, but three and twenty-two lines
below the fix inside one continuous block round 4's own fix pass was
editing.

**Why it matters.** The `expert-plan` skill's four-part collapse-test
format (Job / Hardest question / Answer / Steers toward) exists so a
reader verifies a decision's *current* justification holds together as
one unit. Here the unit no longer coheres: Job tells the reader the
build-time tier *is* "markdown probes for... premises the tool cannot
probe," while five lines later Answer tells the reader those same files
are *not* probes and there is nothing to run. A reader who reads Job
first (as its position invites) forms the same wrong mental model —
"these are owner-run investigative steps" — round 4's own Instance A
finding (Step 40's body) already diagnosed as actively harmful, since it
reintroduces the appearance of an owner workload D-plan-6 specifically
retracted to avoid over-asking a non-programmer owner (`OL-11`).

**Correct implementation.** Rewrite the Job field's final clause to:
"...build-time static records for the two owner-environment premises the
tool cannot verify from inside its own process at build time (L11(a)
already measured; L11(b) resolved by design-safety analysis plus a
runtime counter — neither is an owner-run probe, per D-plan-6/§15
Q-gap-4)." Rewrite the Steers-toward field's middle clause to: "...the two
L11 static records referenced as resolved evidence, not run as pre-exit
tasks."

**Provenance:** introduced by omission at round 4's own fix pass — round 4
correctly rewrote this entry's Answer field but its sweep, by its own
account, found and fixed only the staleness it was specifically looking
for and did not re-diff the entry's other three fields for the same
now-retired vocabulary.

---

**Why this is Systemic, not two isolated slips.** This is the fifth
consecutive round-level pass (round 2, round 3, round 4, this round's own
concurrent collapse-hunt, and this expert-review) in which a fresh,
targeted sweep finds the identical defect shape — content corrected or
added at its primary site, not propagated to every place that cites or
should cite it — recurring at new locations no prior pass's targeted
reads happened to cover, or (this round, uniquely) locations a
same-round sibling pass explicitly claimed to have covered and had not.
The count held roughly steady rather than shrinking to zero (round 2: 7
sites; round 3: 2 sites; round 4: 2 instances/4 sites; round 5's
collapse-hunt: 2 sites, one of which its own fix left 4 siblings
unfixed; this expert-review: 2 instances/6 sites), which is itself
evidence against treating "the count is shrinking" as proof the
underlying sweep mechanism now works — exactly the caution
`docs/collapse-log.md`'s round-3 entry already raised.

**What correct looks like.** Unchanged from every prior round's
recommendation, restated because it still has not held across five
rounds: for every fact corrected or retracted, mechanically diff a
checklist of every surface that names it — including, as this round's
findings show, *every field within the same structured collapse-test
entry* and *every occurrence of the exact search string*, not a sampled
or claimed-complete grep — against the actual document, rather than
relying on a prose attestation ("48 citations checked") that the sweep
was performed and was exhaustive.

No further Systemic patterns — verified by the full read of §1–§16, the
grep scans above, and a re-run of round 4's own T32-1a/L11-pattern grep
scans (all now clean except the two items reported above).

---

## Moderate & Minor Findings

### Minor — Step 38's `oracleSpawn` paragraph is duplicated verbatim

**What the plan does.** Step 38 (line 2876, Read) states: "Every process
this interface's real (Phase B) implementation spawns MUST go through the
`oracleSpawn` wrapper (Step 2.5) so the recursion guard
(`CTXORACLE_INTERNAL`) cannot be forgotten at the first real spawn site
this seam introduces..." The same claim, with near-identical wording,
reappears at line 2929: "Every process this interface's real (Phase B)
implementation spawns MUST go through the `oracleSpawn` wrapper (**Step
2.5**, placed early because Step 20/21's indexer already needs it — see
Step 2.5) so the recursion guard cannot be forgotten at the first real
spawn site this seam introduces."

**How this was verified.** Read Step 38 in full (lines 2842–2934);
grep-confirmed the phrase "cannot be forgotten at the first real spawn
site this seam introduces" appears exactly twice, both within Step 38's
own body, separated by the step's Source/Why-this-approach/Dependencies/
Verification/Impact-if-wrong fields.

**Named standard violated.** No correctness standard is violated (both
copies say the same true thing, and cite Step 2.5 consistently) — this is
a documentation-hygiene issue under general technical-writing practice
(DRY applied to prose): a duplicated paragraph is a maintenance hazard,
since a future correction to one copy is likely to be applied to only the
first occurrence found, silently leaving the second stale — precisely the
mechanism behind every Systemic finding in this document's history.

**Why it matters.** Low impact today (both copies currently agree), but
it is exactly the kind of latent duplicate this document's own recurring
Systemic pattern feeds on.

**Correct implementation.** Delete the second occurrence (lines
2920–2934, the paragraph specifically) or replace it with a one-line
pointer back to the first.

No other Moderate or Minor findings — verified by the full read of
§1–§16, the T-ID cross-checks in §12.1–12.5, and the targeted grep scans
described in Scope and Inventory.

---

## Tentative Findings

- **§14.2's `D-plan-6's L11 verification workload (Step 8, already-run
  this session)` parenthetical (line 6210) may or may not be a
  plan-step misattribution.** If `(Step 8)` here is meant as this plan's
  own build-step number, it is wrong — the L11 build-time verification
  workload is Step 40's job, not Step 8's (SQL migrations for the global
  store, wholly unrelated to L11). However, a plausible alternative
  reading exists: the Q-gap register's own `(Step N)` convention (Q-gap-1
  `Step 2`, Q-gap-2 `Step 6`, both confirmed by their own disposition
  text to cite `expert-plan` SKILL.md's own process-step numbering, not
  this plan's build steps) may extend to this D-plan-6 bullet, its direct
  Q-gap-4 counterpart (line 6252, headed `Q-gap-4 (Step 8 — L11
  architecture-flagged verifications)`), for cross-reference consistency.
  **The verification gap:** reading `middleware/context-oracle/.claude/
  skills/expert-plan/SKILL.md` (not read this round — out of this
  review's stated scope) to confirm whether that skill's own Step 8 is in
  fact about "architecture-flagged verifications," which would settle the
  reading. Delivered as tentative because a plausible non-defect reading
  exists and this reviewer's scope did not include the one document that
  would resolve it either way.

No other tentative findings — every other candidate finding's premise was
verified per Compliance Gate B.

---

## What's Actually Good

- **The `init`/Step 31 confusion, despite recurring at four remaining
  citation sites, never once propagated into a test specification or an
  AC mapping.** Every `init`-related T-ID (T31-1, T31-2, T31-3) correctly
  cites Step 31 in both its own §12 spec and the Step→T-ID table (line
  5936: `31 | T31-1, T31-2, T31-3`) — the citation defect is confined to
  explanatory prose in four step bodies, never reaching the
  mechanically-checked test surface. **Verified by:** direct Read of
  T31-1/T31-2/T31-3's specs and the Step→T-ID table, cross-checked
  against Step 31's own body. **Standard:** the construction-vs-reference
  distinction `docs/collapse-log.md`'s round-3 entry names as the harder
  of the two checks a sweep must run — here, the harder check (is the
  *test* built by the right step) holds even where the easier check
  (does *prose* cite the right step) repeatedly does not.
- **Every T-ID's `Level`/`Real-doubles`/`Data`/`NOT asserts`/`Fails when`
  five-field discipline (plus `File`) holds without exception across all
  ~90 T-IDs read this round.** By the standard the plan's own §12 intro
  sets (`references/testing-standards.md`), every T-ID entry read this
  round carries all six fields with a specific, falsifiable failure
  condition. **Verified by:** direct Read of every T-ID entry in
  §12.1–12.4 this session. **Standard:** Meszaros xUnit Test Patterns and
  SWE-at-Google Unit Testing, both named in the plan's own §3 and honored
  at the T-ID level throughout.
- **The round-5 collapse-hunt's own Step 32→37 fix (§3) is fully accurate
  on independent re-verification** — a genuinely closed instance, distinct
  from the incomplete Step 30→31 fix reported above. **Verified by:**
  direct Read of Step 37's body and grep confirming zero remaining
  "Governs Step 32" occurrences. **Standard:** the same premise-
  verification discipline this review applies to every closure claim.

---

## Recommended Priority

1. **Systemic Instance A (the `init`-verb "Step 30" misattribution, 4
   remaining sites).** Highest priority: it spans four separate step
   bodies and directly misdirects an implementer trying to locate
   `init`'s own construction. Also flag to whoever next updates
   `docs/STATUS.md` that the round-5 collapse-hunt's "only these two
   were wrong" line must not be carried into STATUS.md as a completeness
   claim. One-line fix at each site (Step 2 line 683; Step 8 line 1088;
   Step 23 line 2051; Step 29 line 2376): "Step 30" → "Step 31."
2. **Systemic Instance B (the "Test tier split" entry's stale "probes"
   language, 2 sites within one entry).** Rewrite the Job and
   Steers-toward fields to match the entry's own already-corrected Answer
   field (lines 3757–3784).
3. **Minor: Step 38's duplicated paragraph.** Delete or collapse the
   second occurrence (lines 2920–2934).
4. **Tentative: the §14.2 `(Step 8)` ambiguity.** Low urgency — read
   `expert-plan`'s SKILL.md to settle the reading; does not block delivery
   on its own.

---

## Verdict

Verdict: NEEDS FIXES (3 findings: 1 Systemic pattern spanning 2 instances at 6 locations, 1 Minor)
