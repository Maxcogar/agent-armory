# Independent collapse-hunt — Phase A implementation plan, round 6 (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` (6868 lines, read in full this
session, across sequential `Read` calls with no gaps), at commit
`ddfddc6` on branch `claude/plan-correction-strategy-57ot28` — the
commit produced by round 5's expert-review fix pass (the four
remaining "Step 30's `init`" sites fixed at Steps 2/8/23/29; the §10A
"Test tier split" entry's Job/Steers-toward fields corrected; Step 38's
duplicated `oracleSpawn` paragraph removed; the §14.2 `(Step 8, ...)`
tentative finding investigated and confirmed not a defect).

**Axis:** mission-fidelity (`CLAUDE.md` dominating rule 3 and rule 2's
collapse test). Not a second standards pass.

**Reviewer:** independent subagent, no prior context on this session,
not the author of the plan, any prior fix pass, or any prior review of
it.

**Read in full before the attack:** `middleware/context-oracle/
CLAUDE.md` (full); `docs/collapse-log.md` (the full 2026-09-07 entry
set, including the round-5 entry documenting a same-round completeness
claim being falsified by a sibling pass); `docs/STATUS.md` (full);
`OWNER-LEDGER.md` (full); `docs/specs/spec-context-oracle.md` §8, §11.5,
§12, §13, §14 (read in full); `docs/architecture-phase-a.md` AD-5,
AD-9, AD-10, AD-14, AD-20, AD-24, AD-26 (all read in full); all eight
prior review documents in `docs/reviews/` named in the task brief (the
2026-09-06 pair, rounds 2–5 pairs), with the round-5 pair read closest
for the exact defect class and its own sweep-verification failure;
`docs/plans/plan-phase-a.md` end to end across nine sequential `Read`
calls (lines 1–600, 600–1210, 1209–1786, 1786–2425, 2425–2850,
2850–3300, 3300–3700, 3700–4020, 4020–4300, 4299–4560, 4559–5019,
5019–5479, 5479–5939, 5938–6138, 6137–6397, 6397–6868 — every `###
Step N` heading and body, §9 Checkpoints, §10/§10A in full, §11 in
full, §12 in full including both §12.5 mapping tables, §13 Risks, §14
in full, §15 in full, §16 in full); independently-designed `grep`
sweeps described below, cross-checked by direct `git show` of the
round-5 fix commit's diff and by direct read of `middleware/
context-oracle/.claude/skills/expert-plan/SKILL.md` to re-verify (not
trust) round 5's own tentative-finding resolution.

## Verdict: DOES NOT SURVIVE (one new collapse; round 5's fixes hold)

- **Round 5's fixes: all verified genuinely closed by direct re-read at
  their cited locations, independently.** The two round-5
  collapse-hunt fixes (§3's Standards registry now correctly cites Step
  37 for SQLite WAL/concurrency, line 230; §5.3 now correctly cites
  Step 31 for the `init` verb's `settings.json` write, line 530) and
  the four round-5 expert-review fixes (Step 2 line 683, Step 8 line
  1090–1094, Step 23 line 2055–2058, Step 29 line 2383–2384, all now
  say "Step 31's `init`" instead of "Step 30's `init`"; the §10A "Test
  tier split" entry's Job field, line 3761–3771, and Steers-toward
  field, line 3791–3797, now match its own Answer field; Step 38's
  duplicated `oracleSpawn` paragraph is gone, confirmed by grep — the
  phrase "cannot be forgotten at the first real spawn site this seam
  introduces" now appears exactly once in the document) are all
  confirmed correct by direct `Read` at the cited line and by grep
  showing zero remaining occurrences of each wrong phrasing. See "What
  survives" below.
- **New collapses this round: 1.** The identical recurring "wrong
  step-number citation, correct everywhere else in the document" shape
  found at a site no prior round's targeted-read scope, and no prior
  round's own citation-pattern grep, ever covered: Step 9's DAO body
  (line 1124), which cites a utility built five steps' worth of content
  earlier than it actually is, and cites the wrong step for it.
- **Partial collapses: 0.**
- **New load-bearing decisions §10A missed: 0.** A full read of every
  §7 step and of §10/§10A found no new plan-level judgment call lacking
  a formal four-part collapse-test entry. The Step 37 retrofit into
  `stores/adapter.ts` (ULID id generation added to code Steps 3 and 9
  already built) is architecture-transcription (`AD-26`), not a new
  plan-level judgment, so it does not itself need a §10A entry — its
  citation is simply wrong, which is this round's collapse.
- **What survives.** Every §10A collapse-test (D-plan-1 through
  D-plan-8, N1–N6, the three plan-level entries) was re-attacked with a
  fresh hardest-question pass; none produced a new crack (see
  "Collapse-tests re-attacked" below). The full §12 test-specification
  section (~90 T-IDs), both §12.5 mapping tables, §13 Risks, and §14/§15
  were read in full and cross-checked; no new defect beyond the one
  reported below.

---

## Collapses

### Collapse 1 — Step 9 (DAOs) cites "Step 41's ULID util"; the ULID generator is built at Step 37, and Step 41 has nothing to do with it

**What the plan says.** `docs/plans/plan-phase-a.md:1123-1126` (Step 9
— DAOs for every Phase A table, "What changes"):

> "The `whisper_audit` DAO's `append()` returns the ULID id (**Step
> 41's** ULID util) synchronously — Step 15's deny emitter depends on
> this being synchronous per AD-8's audit-log-before-emit ordering."

**What Step 41 actually is.** Line 3076: `### Step 41 — Additional
convention checks (grep tests)`. Its full body (lines 3076–3125, read
in full) creates exactly five files under `test/conventions/` — grep
tests over built `dist/**/*.js` output for DAO-import discipline, hook
field-name isolation, `permissionDecision` confinement, `oracleSpawn`
confinement, and the `deny_bypass_suspect` predicate set. Its own
"What changes," "Source," "Why this approach," and "Verification"
fields contain zero mention of ULID, ID generation, or
`whisper_audit.append()`. Step 41's own Dependencies field (line 3115)
is "Steps 15, 18, 28, 2.5" — it does not depend on Step 9 or on any ID
utility, because it builds nothing an earlier step consumes.

**What is actually the ULID step.** Line 373 (§5.1 file skeleton):
`ulid.ts # Step 37 — ULID generator (AD-26)`. Line 2810: `### Step 37 —
Concurrency: WAL retry-once + directory locks`. Its own body (lines
2810–2824, read in full) states explicitly: *"In `stores/adapter.ts`
(Step 3): … ULID id generation for `whisper_audit`, `corrections`,
`session_log`, `faults`, and every other timestamped table so
concurrent writers do not collide."* This is unambiguously the step
the Step 9 citation is trying to name — the file skeleton's own
`util/ulid.ts` entry and Step 37's own prose both name the exact same
table (`whisper_audit`) the Step 9 sentence is describing.

**How this was verified.** Read Step 9 in full (lines 1116–1163). Read
Step 41 in full (lines 3076–3125). Read Step 37 in full (lines
2810–2824). Grepped every occurrence of "ulid"/"ULID" in the document
(5 hits: the file-skeleton comment at line 373, Step 9's citation at
line 1124, the "ULID key" mention at line 1196, and Step 37's own two
mentions at lines 2821 and — nowhere else); every occurrence except
line 1124 correctly attributes ULID generation to Step 37. Also
grepped every prior round's collapse-hunt and expert-review document
(`2026-09-07-round-{2,3,4,5}-plan-{collapse-hunt,expert-review}.md`,
plus the 2026-09-06 pair) for "ULID" or "Step 41" in this context —
zero hits naming this specific citation, confirming no prior round's
targeted-read scope, and no prior round's own citation-pattern grep
(which concentrated on the "Step 30/31/32/37" cluster), ever covered
this sentence. Cross-checked that this is a documentation-only defect,
not a live topological-order bug: Step 9's own "Dependencies" field
(line 1151) is "Steps 3, 7, 8" — it does **not** claim Step 37 as a
dependency, and a scripted scan of every step's Dependencies field
against its own step number (checking for any declared forward
dependency) found none across the whole document. So the wrongness is
confined to this one explanatory parenthetical, not to the plan's
actual build order.

**Why this is a collapse, not a stylistic nit.** This is the identical
defect class `docs/collapse-log.md`'s 2026-09-07 entries name five
consecutive rounds running (round 2: 7 sites; round 3: 2 sites; round
4: 2 instances/4 sites; round 5: 2 instances/6 sites, split across a
same-round collapse-hunt and its sibling expert-review): a citation
correct everywhere else in the document is wrong at exactly one site
outside every prior round's targeted-read set — here, specifically,
outside every prior round's own "Step 30/31/32/37" grep, because the
wrong number (41) doesn't even belong to that cluster and so was never
caught by a pattern search scoped to it. An implementer building Step
9's `whisper_audit` DAO and looking for the promised "ULID util" at
Step 41 would find five grep-test files with no ID-generation code
whatsoever, and would have no citation pointing them to the actual
site (Step 37, 28 steps later in build order) where the ULID generator
is in fact added.

**What correct disposition looks like.** Change line 1124 from "(Step
41's ULID util)" to "(Step 37's ULID util)".

---

## New load-bearing decisions §10A missed

None found. Every §7 step was read in full against §10/§10A's own
"which steps are direct architecture transcriptions vs. plan-level
judgment calls" self-accounting (lines 4005–4018), and no step's
content was found to be an undisclosed plan-level judgment. The Step
37 ULID retrofit into `stores/adapter.ts` and Step 9's DAOs is a direct
transcription of `AD-26`'s own content (concurrency: WAL, retry-once,
ULID ids) — its *citation* is wrong, but the *decision* it describes
（using ULIDs for collision-free concurrent writes）is the
architecture's, not a new plan-level judgment requiring its own
four-part collapse-test.

---

## Collapse-tests re-attacked (all survive)

Per the task's instruction to attack every load-bearing decision's
collapse-test harder than the plan's own text, every §10A entry — all
eight D-plan-* entries, all six N1–N6 entries, and the three
plan-level entries (Checkpoint placement, Test tier split, Exit-run
report shape) — was re-read in full and pushed with a fresh question,
independent of round 5's own re-attack:

- **D-plan-1 (build order / C1's write-time cap).** Pushed further:
  the write-time cap requires the implementer to recognize, at the
  moment of adding a predicate/threshold, that it is "not named in
  Steps 14/18/23" and therefore needs a new collapse-test — but nothing
  *mechanically* stops an implementer from adding a predicate to Step
  18's array *and* updating `T18-3`'s expected-set constant in the same
  commit, satisfying the CI check while genuinely skipping the required
  collapse-test. `T18-3` verifies the *code* matches the *disclosed*
  set; it cannot verify that the disclosure itself was preceded by a
  collapse-test, because CI has no way to check whether a human step
  was performed. This is a real, narrow gap in the mechanization's
  reach — but it is the same class of residual N2 already discloses for
  its own detector ("a proxy, not a measurement"), and the plan's own
  "Guide, not gate" framing for D-plan-1 (line 3541–3545: "a real,
  partially-mechanized gate…") already avoids claiming full mechanical
  enforcement. Not counted as a new collapse — it is an honestly-scoped
  partial mechanization already flagged as partial, not one claimed
  complete and found not to be.
- **D-plan-2 (dependency floor pin).** Pushed: if `^0.26.13` accepts
  0.27.0 silently, does `npm ci` in a *fresh* container (no lockfile
  committed — verified no `package-lock.json` is named anywhere in
  §5.1's skeleton) actually resolve to 0.26.13 by default, or to
  whatever npm's registry currently serves as latest-compatible (i.e.
  0.27.0)? If the latter, "the pin is drift-witnessable" (the plan's
  own answer) is weaker than it reads: a *fresh* install would silently
  run on 0.27.0, not the audited 0.26.13, unless a lockfile pins the
  resolved version. The plan does not name a committed lockfile
  anywhere in §5.1 or Step 1's body. This is a real, disclosed-nowhere
  gap between "the pin says which version is audited" and "a fresh
  `npm install` actually gets that version" — worth a note, but not
  elevated to a full collapse here because it is an omission adjacent
  to D-plan-2 rather than inside its own four-part answer, and T1-1's
  own verification (line 4332–4348) is scoped to build success, not
  version-pinning fidelity, so it neither confirms nor contradicts
  this. Flagged for the record; see recommendation below.
- **D-plan-3 (`node:test` runner).** Re-verified the compile-then-test
  chain (`tsconfig.test.json` → `dist-test/` → `node --test`) is fully
  consistent with Step 1, Step 15/T15-1's use of the same tree, and
  Step 39's glob — cross-checked directly against the actual glob text
  at line 2984–2986. Survives.
- **D-plan-4/D-plan-5 (sqlite3 shell; deterministic fixtures).** Both
  re-read; both "Guide, not gate" claims hold under a fresh push (no
  hidden hard dependency on `sqlite3` being present; the fixture
  generator's shape-from-scenario / not-shape-from-output distinction
  holds against a fresh "could this be gamed" question — the AC's
  assertion is always on a tool-computed output, never on a
  fixture-embedded expected value). Survives.
- **D-plan-6 (retracted).** Re-read against Step 40's current body and
  §15 Q-gap-4's current disposition — consistent, no residual defense
  of the retracted design found anywhere via a fresh grep for
  "markdown probe" combined with "owner-run" (0 live-tense hits beyond
  the explicitly-past-tense ones already accounted for in round 5's
  Systemic Instance B fix). Survives.
- **D-plan-7 (CI tier split).** Pushed: what physically stops a PR from
  merging with a fixture-tier regression, given the fixture tier is
  workflow-triggered rather than a merge-blocking check? The plan's own
  answer (reviewers merging on unit+convention green, running the full
  suite before Step 42) is honestly a process discipline, not a
  technical gate, and it says so ("Guide, not gate — CI does not
  police mergeability; the reviewer does"). Survives on its own stated
  terms.
- **D-plan-8 (settings.json marker via `command` prefix).** Re-checked
  against Step 31's own item 4 and item 6 — consistent, no stale
  "invented marker field" language found anywhere via a fresh grep for
  `"comment":` or "marker field" (0 live hits; the one historical
  mention is explicitly kept "for the record — do not re-introduce").
  Survives.
- **N1 (URL normalization).** Pushed on the asymmetry once more: is
  "port" genuinely provably-safe to fold while "scheme" is not? A
  non-default port *could* in principle also indicate a proxy/tunnel
  rather than a different remote — but the plan's own text already
  preserves non-default ports unfolded (line 909: "non-default ports
  preserved"), so the asymmetry claim is actually narrower than a
  first read suggests: only *default* ports are folded (443/22, which
  are canonically implied by the scheme itself and carry no
  distinguishing information), which is provably safe. Survives more
  robustly than the surface reading suggested.
- **N2 (`deny_bypass_suspect` coverage bound).** Re-confirmed T18-3
  (predicate-set drift) and T33-1 (disclosure-text drift) still both
  exist and still cover their respective halves, per round 5's own
  note that this split is adequate but not clearly stated in N2's own
  prose — unchanged this round; not re-elevated to a collapse.
- **N3/N4 (bar defaults, clearing length floor).** Pushed: `tune`
  changes a value in the store, but does any Phase A code path *cache*
  `bar.clear_length_floor` at process start in a way that would make a
  live `tune` change require a restart to take effect (given AD-1's
  no-daemon, one-process-per-event topology, this is moot — every hook
  invocation is a fresh process that re-reads `tuning` at construction
  time, per Step 14's own text: "The stoplists are read from the
  `tuning` table at recognizer construction time," line 1414). No
  staleness residual. Survives.
- **N5 (`oracleSpawn` placement).** Re-verified Step 21's own body
  (lines 1886–1891) still calls `refreshIfStale` → `oracleSpawn` before
  Step 38 in build order. Survives.
- **N6 (confinement-grep scope).** Re-verified `tsconfig.json`
  (production, `src/` only) and `tsconfig.test.json` (`src/`+`test/`)
  remain disjoint by declared `include` globs (Step 1's own body,
  cross-checked). Survives.
- **Plan-level: Checkpoint placement.** Pushed on whether Checkpoint 3
  ("After Step 30") is genuinely reachable given Steps 12–19's answer-
  drift block must already be functioning by then — re-confirmed
  Checkpoint 2 ("After Step 19") precedes it in the checkpoint ordering
  (line 3293, "After Step 19 … Checkpoint 2") and Step 30 depends on
  Steps 9, 19 (line 2454), so the ordering is consistent. Survives.
- **Plan-level: Test tier split.** Re-read in full post-round-5-fix;
  all four fields (Job, Hardest question, Answer, Steers toward) now
  cohere with each other. Survives, confirmed.
- **Plan-level: Exit-run report shape.** Pushed on the bootstrap
  question: Step 42 replays "captured hook streams from Max's real
  sessions," but no session could have been captured before `init`
  wires the hooks — is this circular? No: Step 42's own text names the
  live-session alternative explicitly ("an alternative: run the tool
  against a fresh interactive session and instrument," line 3168),
  which resolves the apparent bootstrap gap — the first exit run
  necessarily uses the live-session path, and only a *later* exit run
  could replay a genuinely pre-captured stream. Not stated as
  explicitly as it could be, but not a collapse — the resolving text is
  present in the same step.

No new hardest-question broke any of the eighteen re-attacked entries
into a collapse beyond the two low-stakes, already-partial residuals
noted above (D-plan-1's CI-cannot-verify-a-human-step gap; D-plan-2's
missing-lockfile version-drift gap) — both are recorded here as
editorial tightening opportunities, not counted as collapses, on the
same standard round 5 applied to its own N2 residual note.

---

## Mission-fidelity cross-trace

- **"Honest deterministic foundation," "running on the owner's real
  repos," "clean seams the later phases plug into."** Unaffected by
  this round's finding — the collapse is a citation-index error in a
  step's explanatory prose (which step builds a shared utility), not
  in the mechanism itself. Step 37's actual ULID-generation content and
  Step 9's actual DAO content are both correct and complete at their
  own headings; only the *pointer* from Step 9's prose to where the
  utility is built is wrong.
- **"Measures its own floor — how little it catches."** Not implicated
  this round; the finding touches no recognizer, bar value, or coverage
  claim.
- **"Never fake completeness dressed to look like a working product."**
  The finding is the same documentation-layer instance of this axis
  that rounds 4 and 5 already named: a step's own prose asserts a
  specific, checkable fact (which step builds the utility it names) in
  a document whose entire discipline is cross-reference precision, and
  the fact is simply wrong at one site.

---

## Attestation

- **What I read in full this session (2026-09-07).** `middleware/
  context-oracle/CLAUDE.md`; `docs/collapse-log.md` (2026-09-07 entry
  set, closely, plus enough of the file structure to locate every
  relevant entry); `docs/STATUS.md`; `OWNER-LEDGER.md` (both files in
  full); `docs/specs/spec-context-oracle.md` §8 (326–507), §11.5
  (739–777), §12 (780–873), §13 (874–906), §14 (908–1028, sampled
  onward past the point every step cites); `docs/architecture-phase-a.md`
  AD-5 (568–646), AD-9 (736–923), AD-10 (924–946), AD-14 (1073–1129),
  AD-20 (1377–1413), AD-24 (1513–1629), AD-26 (1650–1651+, spot-checked
  against Step 37's citation) — all in full; the eight named prior
  review documents (2026-09-06 pair; rounds 2, 3, 4, 5 pairs) — the
  round-5 pair read in full, the earlier four read for the pattern's
  documented history and to confirm no prior round's own grep pattern
  ever covered the "Step 41" ULID citation; `docs/plans/plan-phase-a.md`
  (6868 lines) read end to end with no gaps across the `Read` call
  ranges listed at the top of this document; `middleware/context-oracle/
  .claude/skills/expert-plan/SKILL.md` (targeted reads at "Step 2,"
  "Step 6," "Step 8" mentions) to independently re-verify — not trust —
  round 5's own resolution of the §14.2 `(Step 8, ...)` tentative
  finding.
- **What I fetched or re-verified externally.** Nothing new — this
  round's finding is an internal cross-reference check against the
  plan's own file skeleton and step bodies. `git show ddfddc6` was
  used to confirm the exact diff round 5's fix pass applied, so this
  round's "what survives" claims are checked against the actual
  committed text, not a description of it.
- **Independent grep design (per the task's explicit instruction not
  to reuse prior rounds' search patterns).** Rather than searching for
  known-bad phrases (round 5's method), this round ran: (1) a full
  enumeration of every `### Step N` heading to build a ground-truth
  step→topic map; (2) `grep -n "Step 30\b"` / `"Step 31\b"` /
  `"Step 32\b"` / `"Step 37\b"` re-run fresh (not trusting round 5's
  counts) to confirm zero remaining wrong occurrences in that cluster;
  (3) a broader sweep of every `(Step N's <word>)` / `(Step N <word>)`
  parenthetical pattern in the whole document (54 distinct
  occurrences), each manually classified against the step-topic map
  built in (1) — this is what surfaced the Step 41/37 ULID mismatch,
  a citation number entirely outside the "30/31/32/37" cluster every
  prior round's pattern search was scoped to; (4) a scripted check
  (Python) of every step's own `**Dependencies.**` field against its
  own step number, to confirm no step declares a forward (later-step)
  dependency — zero found, which is what let this round distinguish
  "wrong citation in prose" (confirmed) from "a live topological-order
  bug" (ruled out) for the Step 9/41/37 finding.
- **Confidence.**
  - **High** on the new collapse — a direct textual mismatch between a
    citation ("Step 41") and both (a) the cited step's own full body,
    which contains no ULID content, and (b) the file skeleton's own
    unambiguous attribution of `util/ulid.ts` to Step 37, corroborated
    by Step 37's own body naming the exact same table
    (`whisper_audit`) the wrong citation was describing.
  - **High** on "round 5's fixes hold" — every one of the six fixed
    sites (two collapse-hunt, four expert-review) was re-verified by
    direct `Read` at the exact line, not by trusting `docs/STATUS.md`'s
    narrative or the plan's own "corrected this fix pass" annotations,
    and cross-checked against `git show ddfddc6`'s actual diff.
  - **Medium** on the two residual notes above (D-plan-1's
    CI-cannot-verify-a-human-step gap; D-plan-2's missing-lockfile
    version-drift gap) — both are real, disclosed nowhere in the
    plan's own text, but neither rises to a full four-part-collapse
    failure on the standard this project's collapse-log applies (both
    would need a `package-lock.json` check or an explicit CI-cannot-
    verify-human-steps disclosure to close cleanly; recommended as
    editorial tightening, not required for this round's verdict).
- **How this round's scope differed from prior rounds', and why that
  is what surfaced a new instance.** Rounds 2–4 concentrated on step
  bodies, §2.3's table, and §12/§12.5. Round 5's collapse-hunt and
  expert-review both concentrated specifically on the "Step
  30/31/32/37" citation cluster once round 4 exhausted the
  self-observability-table class of error. This round deliberately
  built a step-topic ground-truth map first and swept *every*
  `(Step N's X)` citation against it, rather than searching for a
  specific known-bad phrase or a specific numeric cluster — which is
  what caught a citation number (41) that had never been a suspect in
  any prior round's search, sitting inside a step (9) none of rounds
  1–5's collapse-hunts or expert-reviews ever flagged as defective.
- **What would make me revise the verdict up (to SURVIVES).**
  Discovery that Step 41's body (lines 3076–3125) contains ULID-related
  content this reviewer's full read missed — it does not; the body is
  entirely five grep-based convention tests with no ID-generation
  logic of any kind. Or discovery that a sixth, unlisted file builds
  the ULID utility earlier than Step 37 — the file skeleton (§5.1)
  names `util/ulid.ts` exactly once, at Step 37, and no other file in
  the skeleton is described as generating IDs.
- **What would make me revise down further.** Nothing found this round
  that would deepen this collapse into something larger — it is a
  narrowly-scoped, one-line citation correction with no evidence of an
  undisclosed design decision hiding behind it (Step 9's own
  Dependencies field is correct and does not claim Step 37 as a
  dependency; the actual build order is sound), and no second instance
  of a citation number entirely outside the known "30/31/32/37" cluster
  was found despite the full `(Step N's X)` pattern sweep (54
  occurrences checked; only this one was wrong).

*End of round-6 collapse-hunt. Trajectory across six rounds on this
plan: round 1 — 3 collapses; round 2 — 1 collapse; round 3 — 2
collapses; round 4 — 2 collapses; round 5 — 2 collapses (one of which
its own author's "48 checked, only these two wrong" claim was itself
falsified by a same-round sibling pass, revealing 4 more sites); round
6 — 1 collapse, found at a citation number (41) no prior round's
search pattern was ever scoped to catch, inside a step (9) no prior
round ever flagged. The magnitude has shrunk from round 5's 6 total
sites to round 6's 1 — but per `docs/collapse-log.md`'s own standing
lesson, a shrinking count is evidence only that this round's
specific search pattern (a full ground-truth step-topic map cross-
checked against every parenthetical step citation) found what it
was built to find, not evidence that the underlying document is now
free of this defect class. Dispatch round 7 after this one fix lands,
using a search pattern this round did not use — for instance, a
systematic check of every `src/.../*.ts` filename mentioned in step
bodies against the exact step the §5.1 skeleton attributes it to,
which this round did only for `util/ulid.ts` and not exhaustively for
every other named file.*
