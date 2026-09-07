# Independent collapse-hunt — Phase A implementation plan, round 4 (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` (6770 lines), read in full this
session, at the commit produced by round 3's fix pass (Step 8/T8-1/T23-1
tuning-seeding correction, Step 41/T18-3 fifth convention file, the
`deny_bypass_suspect` two-directional disclosure, the Q-gap-5 "genuine
independent check" overclaim correction, M1/M2 citation fixes, and the
checked-in Clear-Thought evidence directory).

**Axis:** mission-fidelity only (`CLAUDE.md` dominating rule 3 and rule 2's
collapse test). Not a second standards pass — that is `/expert-review`'s job.

**Reviewer:** independent subagent, no prior context on this session, not
the author of the plan, any prior fix pass, or any prior review of it.

**Read in full before the attack:** `docs/collapse-log.md` (all 1435
lines, two `Read` calls, all 2026-09-07 entries specifically); `OWNER-
LEDGER.md` (all 81 lines); `middleware/context-oracle/CLAUDE.md` (in
full, via system context); `docs/specs/spec-context-oracle.md` §8, §11.5,
§12, §13, §14 (all read in full); `docs/architecture-phase-a.md` AD-5,
AD-9, AD-10, AD-14, AD-15, AD-18, AD-21, AD-24 (all read in full, plus
AD-6/AD-16/AD-17 for adjacent context); `docs/reviews/2026-09-06-plan-
collapse-hunt.md`, `docs/reviews/2026-09-06-plan-expert-review.md`,
`docs/reviews/2026-09-07-round-2-plan-collapse-hunt.md`,
`docs/reviews/2026-09-07-round-2-plan-expert-review.md`,
`docs/reviews/2026-09-07-clear-thought-verification-q-gap-5.md`,
`docs/reviews/2026-09-07-round-3-plan-collapse-hunt.md`,
`docs/reviews/2026-09-07-round-3-plan-expert-review.md` — all in full;
`docs/STATUS.md` (237 lines, full); the evidence directory
`docs/reviews/evidence-2026-09-07-clear-thought-verification-q-gap-5/`
(all three files: `mcp_client.py`, `raw_mcp_handshake_sample.txt`,
`run_decisions.py`); `docs/plans/plan-phase-a.md` end-to-end across
multiple `Read`/`Grep` calls: full file skeleton and §2.3 coverage table
(lines 1–465); every step body named by a round-3 finding, read in full
(Steps 8, 14, 18, 19, 21, 22, 23, 25, 30, 31, 33, 36, 37, 38, 39, 41, 42);
§9 Checkpoints; §10/§10A in full (D-plan-1, D-plan-6, D-plan-8, N1–N6);
§12 test specs for T8-1, T18-3, T23-1, T25-*, T33-1, T36-1, T41-1; §12.5's
both mapping tables in full; §13 Risks; §15 Q-gap-5 and adjoining
disposition text; §16.

## Verdict: DOES NOT SURVIVE (converging, not yet terminal)

- **Collapses: 2.** (1) Step 14's own body still asserts
  `lexicon.stoplist` is "seeded with rhetorical/idiom phrases **at Step
  8**" — a literal, word-for-word contradiction of this same fix pass's
  own correction to Step 8 ("no rows inserted by the migration itself...
  Step 23's `seedDefaults`... is the only inserter"), missed one paragraph
  away from a *correctly* Step-23-attributed sibling clause in the exact
  same sentence's neighborhood. (2) §2.3's coverage-reconciliation table —
  the same table whose Delivery row this fix pass corrected (line 165,
  M1) — has three further rows citing the wrong step numbers for the
  functionality they describe: the Self-observability row swaps Steps
  33/36/37's actual roles (status↔regret↔log all misassigned), the "two
  seams" row cites Step 39 for the model-invocation stub that Step 38
  actually builds, and the "Stores/index/miner" row labels Step 22
  "(indexer)" while omitting Step 21, which is the step that actually
  builds `indexer.ts`/`runIndex`. This is the identical defect class this
  round's own predecessor (round 3's M1) found and fixed one row above,
  surviving undetected in the same table, in the same fix-pass session
  that edited it.
- **Partial collapses: 0.**
- **New load-bearing decisions §10A missed: 0.** No new undisclosed
  judgment call was found; both collapses are fidelity defects in already-
  disclosed content, not unexamined decisions.
- **What survives.** Every round-3 finding this task's brief specifically
  named was verified closed by direct re-read: Step 41 now lists all five
  convention test files (including `deny_bypass_predicates_confined.
  test.ts`/T18-3) with Dependencies extended to include Step 18 and
  Verification updated to "five"; Step 8 no longer seeds `tuning` (the
  migration creates the table schema-only); T8-1 asserts the table is
  empty post-migration; T23-1 asserts the real 4-AD-14-sourced/2-plan-
  judgment split; the `deny_bypass_suspect` over-count direction is now
  disclosed verbatim in Step 18, Step 33, and T33-1, exactly matching
  AD-9's wording; the "genuine independent check" overclaim is corrected
  everywhere it appeared (plan §15, the standalone verification document);
  D-plan-1's §10 entry and N5's §10A entry both now correctly reflect the
  Clear-Thought pass's outcome; M2's "Step 26" → "Step 25" citation fix
  holds; the evidence directory exists and its contents (a real,
  runnable MCP stdio client and a raw JSON-RPC response sample) are
  genuine, not placeholders.

---

## Collapses

### Collapse 1 — Step 14's own body still claims `lexicon.stoplist` is seeded "at Step 8," directly contradicting this same fix pass's Step 8/AD-5 correction

**What the plan says.** Step 14 (line 1373–1382, `recognizeQuestion`):
*"it is not matched by the `lexicon.stoplist` (tunable, **seeded with
rhetorical/idiom phrases at Step 8**). Multiple questions in one turn
produce multiple recognizer results."*

**What this same fix pass's own correction says, two sections earlier.**
Step 8 (line 1066–1082): *"Create `src/stores/migrations/
002_phase_a_global.sql` with `global_meta`, `whisper_stats`, `tuning`,
`lessons`... schema only, **no rows inserted by the migration itself.**
... **Corrected this fix pass (round-3 expert-review Systemic finding):**
the prior text had this migration seed `tuning` with AD-14's defaults —
that contradicts AD-14's own schema comment... `tuning` ships empty from
this migration; Step 23's `seedDefaults` (invoked from `init`, Step 31
item 3) is the only inserter."* T8-1's own §12 spec (line 4468–4487)
independently re-asserts the same fact: *"`tuning` is **empty** immediately
after migration 002 alone."*

**How this was verified.** Read Step 14 in full (lines 1373–1442), Step
8 in full (lines 1066–1102), T8-1's full spec (lines 4468–4487), and
T23-1's full spec (lines 4823–4847) this session. Grepped the whole
document for every occurrence of "Step 8" (9 hits) and every occurrence
of "seed"/"Seed" near "Step 8" or "migration" (11 hits) — line 1381 is
the **only** remaining place in the document that attributes any seeding
to Step 8; every other occurrence (lines 1074, 1077, 1081, 1086, 1094,
1098, T8-1, T23-1) correctly states seeding happens at `init` via Step
23's `seedDefaults`. Note also that Step 14's very next sentence, in the
same paragraph, correctly attributes a *different* tuning key to the
right step: *"`lengthFloor` is read from `bar.clear_length_floor` (Step
23's seeded default, 40 characters...)"* — the fix pass's own hand
touched this exact paragraph's neighboring clause and corrected it, while
leaving the `lexicon.stoplist` clause three lines above unswept.

**Why this is a collapse, not a stylistic nit.** This is precisely the
class of defect the task brief named as the thing to specifically check
for — "nothing else in the document... still assumes Step 8 seeds
tuning" — and it is precisely what survived. `docs/collapse-log.md`'s
own round-2 and round-3 entries (2026-09-07) both diagnose this exact
shape: *"content the fix pass added or changed in one place was not
propagated to the plan's other cross-referencing surfaces."* Round 3
fixed the primary decision site (Step 8), the direct dependent test specs
(T8-1, T23-1), and Step 23's own prose — but a fourth site, a recognizer
module's own inline documentation of where its tunable inputs come from,
was never checked, despite sitting in the same file, roughly 300 lines
from the fix, and despite the very next clause in the same sentence
receiving a correct citation. An implementer building Step 14 from this
text alone would look for `lexicon.stoplist`'s seed values inside the
Step 8 migration file and not find them — a live discrepancy between
what the plan tells the implementer and what the plan's own corrected
Step 8/Step 23 actually build.

**What correct disposition looks like.** Change line 1381 to read
"seeded with rhetorical/idiom phrases at Step 23 (invoked at `init`)" —
matching the phrasing already used one clause later in the same
paragraph for `bar.clear_length_floor`.

### Collapse 2 — §2.3's coverage-reconciliation table has three further wrong step-number citations, the identical defect class this fix pass's own M1 fixed one row above

**What the plan says (§2.3, lines 160–171, the table this fix pass
itself edited at line 165 to fix M1's Delivery-row misattribution):**

- Line 162: *"Deterministic core: seven model-free genres | **Steps
  21–28** (Orientation, Coupling, Reuse, Consequence, Warning,
  Completeness, Verification/completion-check)"*
- Line 164: *"Stores / index / miner | Steps 3–9 (packaging, adapter,
  schemas, identity, dirs); Steps 20 (miner), **22 (indexer)**"*
- Line 166: *"Self-observability (correct silence, denies, wrongful-deny,
  missed skill-block reserved) | Steps 10 (diagnostic writer), **33
  (regret at SessionEnd), 36 (status), 37 (log)**"*
- Line 169: *"The two seams (Phase B, Phase C) | Step 13 (qa/state.ts
  interface + module-replace test); Step 15 (deny confinement structural
  test — second caller point for Phase C); **Step 39** (`model/invoke.ts`
  interface stub committed but not called)"*

**What the cited steps actually are, read directly.**

| Citation in §2.3 | What §2.3 claims it is | What the step's own `###` heading and body actually say |
|---|---|---|
| Step 22 (line 164) | "(indexer)" | Line 1911: `### Step 22 — tree-sitter frontend + generic fallback` — a `LanguageFrontend` **implementation**, not the indexer. Line 1847: `### Step 21 — Structural indexer skeleton and LanguageFrontend interface` builds `src/index/indexer.ts` and `runIndex` — **this** is "the indexer," and it is omitted from the row entirely. |
| Step 33 (line 166) | "(regret at SessionEnd)" | Line 2591: `### Step 33 — status, log, tune verbs`. Step 33's own body (lines 2591–2653) is the `status`/`log`/`tune` CLI renderer — not regret. |
| Step 36 (line 166) | "(status)" | Line 2740: `### Step 36 — Regret proxy at SessionEnd + index refresh`. Step 36's own body (lines 2740–2782) creates `src/human/regret.ts` — regret, not status. |
| Step 37 (line 166) | "(log)" | Line 2785: `### Step 37 — Concurrency: WAL retry-once + directory locks`. Step 37's own body (lines 2785–2824) is `BEGIN IMMEDIATE`/WAL/`busy_timeout` retry logic and a ULID generator — nothing about `log` rendering, which is part of Step 33. |
| Step 39 (line 169) | "(`model/invoke.ts` interface stub committed but not called)" | Line 2919: `### Step 39 — Unit test suites for every recognizer, bar, redactor, repo-key, reader`. `model/invoke.ts` is built at line 2825: `### Step 38 — Model invocation seam stub (never called in Phase A)`, whose own body (line 2827) reads "Create `src/model/invoke.ts`..." — Step 38, not 39. |
| Steps 21–28 (line 162) | "(Orientation, Coupling, Reuse, Consequence, Warning, Completeness, Verification/completion-check)" | Line 2100: `### Step 25 — Genre modules (the seven Phase A generators)` is the single step whose body (lines 2100–2184) creates all seven named generator files (`orientation.ts`, `coupling.ts`, `reuse.ts`, `consequence.ts`, `warning.ts`, `completeness.ts`, `verification.ts`). Steps 21–24 and 26–28 build the indexer, frontend, tuning DAO, bar, command classifier, compose/audit, and handler pipeline respectively — none of them creates a genre-generator module. |

**Independent cross-check that these are genuinely wrong, not just a
looser summary style.** §12.5's own "Step → T-ID(s)" mapping table (lines
5864–5911), built and verified by round 3's own expert-review this same
session, gets every one of these right: `33 | T33-1, T33-2, T33-3`
(status/log/tune's own tests), `36 | T36-1` (regret's own test), `37 |
T37-1, T37-2` (concurrency's own tests), `38 | T38-1` (the model-seam
test), `25 | T25-1..T25-7, ...` (all seven genre tests). §2.3 is the one
table in the document that disagrees with the step bodies themselves and
with the document's own independently-verified §12.5 table — it was not
touched by round 3's Scope-2 sweep beyond the single Delivery-row line it
was editing for M1.

**How this was verified.** Read §2.3 in full (lines 155–172); read Steps
10, 21, 22, 25, 33, 36, 37, 38, 39 in full at their own headings (listed
above); grepped the whole document for every "Step 33\b", "Step 36\b",
"Step 37\b", "Step 38\b", "Step 39\b" occurrence (36 hits total across
all five — line 169's "Step 39" is one of them; line 166's "33"/"36"/"37"
tokens are not literal "Step N" strings, since the row elides the word
"Step" after the first number, so they fall outside this specific grep
and were instead confirmed by direct read of the row) and confirmed
every occurrence **outside §2.3** correctly attributes status/log/tune to
33, regret to 36, concurrency to 37, and the model seam to 38 — §2.3
(lines 166 and 169) is the sole outlier for all four step numbers.

**Why this is a collapse, not a cosmetic slip.** §2.3 exists, by its own
stated purpose (line 157–158), to prove *"every element of the Phase A
build named in spec §11.5... maps to at least one plan step"* — it is
this document's own self-audit of its own completeness, the textual
instrument for exactly the "measures its own floor" half of `CLAUDE.md`
dominating rule 3. A self-audit table that misattributes the very
category most tied to that rule — **Self-observability** — to the wrong
three steps is not a peripheral defect; it is the self-audit failing at
its own job, in the same table and the same session that had just fixed
an adjacent instance of precisely this failure (M1). This is the
`docs/collapse-log.md` 2026-08-29 lesson ("a reviewer's concrete repair
prescription carries no verification of its own") and the round-2/round-3
"fix landed at its primary site, not swept to every cross-referencing
surface" lesson recurring a fourth time on this document, this time
inside the very artifact — a reconciliation table — whose job is to
catch exactly this kind of gap.

**What correct disposition looks like.** Rewrite the four affected §2.3
rows against the step bodies and §12.5's own table:
- Line 162: `Step 25 (Orientation, Coupling, Reuse, Consequence, Warning, Completeness, Verification — all seven generator modules); Steps 21–24, 26–28 (indexer, frontend, tuning DAO, bar, command classifier, compose/audit, handler pipeline — the supporting substrate)`.
- Line 164: `Steps 21 (indexer), 22 (frontend)` in place of `22 (indexer)` alone.
- Line 166: `Steps 10 (diagnostic writer), 36 (regret at SessionEnd), 33 (status, log)` in place of `33 (regret at SessionEnd), 36 (status), 37 (log)` — and drop Step 37 from this row entirely (it is concurrency, unrelated to self-observability).
- Line 169: `Step 38 (`model/invoke.ts` interface stub committed but not called)` in place of `Step 39`.

**Confidence note on a related, weaker fifth candidate not counted
above.** Line 163's row — `Steps 12–15 (deny confinement, qa state,
recognizers, block wiring)` — orders its four parenthetical phrases in a
way that does not positionally match 12→13→14→15 (Step 12 is the
transcript reader, not "deny confinement"; Step 15 — deny verdict — is
the better match for "deny confinement"). This reads as an unordered
enumeration of what the four-step range collectively contains rather
than a per-step claim, so it is **not** counted as a fifth instance of
Collapse 2 above — but it shares the same surface-level sloppiness and is
worth a look in any future sweep of this table.

---

## New load-bearing decisions §10A missed

None found. Every plan-level judgment this session located during its
full read of §7 and §10/§10A has an existing §10 (D-plan-*) or §10A
(D-plan-*/N1–N6) entry.

---

## Attacks that hit nothing / survive with note

- **Step 41 / T18-3's fifth convention file.** Attacked at all four
  required surfaces independently: Step 41's own "What changes" (line
  3064–3073, fifth bullet present), Dependencies (line 3081, now "Steps
  15, 18, 28, 2.5" — includes 18), Verification (line 3083–3085, now
  "all five convention tests"); §5.1's skeleton (line 426); §12's T18-3
  spec (lines 5113–5131); T41-1's own spec (lines 4936–4959, "five
  sub-files," all five named with their T-IDs). **Survives**, confirmed
  fixed at every surface named by round 3.
- **Step 8 / T8-1 / T23-1's tuning-seeding contradiction (the primary
  claim).** Attacked by reading Step 8 (empty migration, no seeding),
  T8-1 (asserts empty post-migration), Step 23 (the 4-AD-14/2-plan-
  judgment split, unchanged from round 3's fix), and T23-1 (asserts the
  real split, no longer "every seeded key from AD-14"). **Survives** at
  all four primary sites — the one surviving gap is Collapse 1 above (a
  fifth site, Step 14, that none of the four primary-fix locations
  reference or sweep).
- **`deny_bypass_suspect`'s two-directional disclosure.** Attacked by
  checking Step 18 (both directions now stated verbatim, line
  1656–1678), Step 33 (both directions rendered in `status`, line
  2600–2610), and T33-1 (asserts both directions present, line
  5601–5607), plus a full-document grep for "over-counts"/"under-counts"
  confirming no other location needs the same disclosure. **Survives**,
  confirmed fixed.
- **The "genuine independent check" overclaim.** Attacked by re-reading
  §15's Q-gap-5 disposition (lines 6650–6679) and the standalone
  verification document's Outcome section (lines 236–256) — both now
  state the narrower, accurate claim (SKILL.md's literal mandate
  satisfied; independent checking comes from the separately-dispatched
  review rounds) and explicitly name the self-administered-check risk by
  citing the collapse-log's own 2026-08-25 entry. **Survives**, confirmed
  fixed in both places.
- **D-plan-1's §10 cross-reference to Clear Thought.** Re-read in full
  (lines 3300–3320) — now states the decision was "subsequently run
  through the actual Clear Thought MCP server via direct protocol
  invocation and confirmed," with an explicit note that the sentence
  previously pointed to §15 as still-open. **Survives**, confirmed fixed.
- **N5's "sharpened... required, not merely defensible" framing.**
  Re-read N5's full §10A entry (lines 3879–3916) — the "Sharpened by the
  Clear-Thought pass" paragraph (lines 3906–3916) is now present at
  exactly the location §15/STATUS claim it is. **Survives**, confirmed
  fixed.
- **M2's "Step 26" → "Step 25" citation.** Re-read Step 19 (lines
  1737–1761) — now correctly cites "the Step 25 done-claim recognizer"
  with an explanatory correction note. Grepped all six remaining "Step
  26" occurrences in the document; all six correctly refer to the
  command-class classifier. **Survives**, confirmed fixed.
- **m1's evidence directory.** Read all three files in
  `docs/reviews/evidence-2026-09-07-clear-thought-verification-q-gap-5/`
  — `mcp_client.py` (118 lines) is a genuine, runnable MCP stdio JSON-RPC
  client (not a stub); `run_decisions.py` (79 lines) genuinely drives it
  through the `sequential_thinking` operation; `raw_mcp_handshake_sample.
  txt` contains a real `initialize` response, a `tools/list` response,
  and one full raw `tools/call` response matching the C1 chain's first
  thought verbatim. **Survives**, confirmed genuine, not placeholder
  content.
- **N1–N6 collapse-tests, pushed harder this round.** N2 (line
  3812–3849) was pushed on the over-count-disclosure axis (already
  sharpened by round 3) — the harder question ("does the disclosure
  actually reach `status`'s real implementation, not just this planning
  document's promise about it") is unanswerable by any planning-stage
  document by construction; the plan is the correct artifact to hold
  this claim, and it now holds it correctly (see above). N6 (line
  3918–3947) was pushed on whether C2's `dist-test/` compile target
  could reopen the same seam gap the T41-1 fifth-file fix touches
  (`dist/blocks/health.js` grepped by the new T18-3) — no: `T15-2`'s and
  `T18-3`'s grep scopes both target `dist/` exclusively, disjoint from
  `dist-test/`'s `tsconfig.test.json` `include` globs, checked at Step
  1's `T1-1`. **Both survive.**

---

## Mission-fidelity cross-trace

Reading `docs/plans/plan-phase-a.md` against `CLAUDE.md` dominating rule
3 and spec §11.5's own words, as rounds 1–3 did:

- **"Honest deterministic foundation."** Unaffected this round at the
  mechanism layer — the deterministic core, deny plumbing, and their
  round-3 fixes hold on direct re-read.
- **"Running on the owner's real repos."** Unaffected.
- **"Measures its own floor — how little it catches."** This is exactly
  where both this round's collapses land, and in a sharper sense than
  round 3's: Collapse 2 is a defect *inside the specific instrument*
  (§2.3) whose entire job is measuring/proving the plan's own coverage
  floor against spec §11.5 — the self-audit misreports which step does
  what for the Self-observability category by name. Collapse 1 is
  smaller in scope but the same failure at the level of a single
  recognizer's own documented inputs: the plan tells an implementer the
  wrong place to look for a tunable value's origin.
- **"Clean seams the later phases plug into."** Unaffected — the Phase B
  seam citations (Step 13, Step 15, Step 38) are correct in every
  location except the one §2.3 row named in Collapse 2, which cites the
  right *seam steps* (13, 15) but the wrong *third* step number (39
  instead of 38).
- **"Never fake completeness dressed to look like a working product."**
  Both collapses are instances of this axis at the documentation layer,
  the same category `CLAUDE.md` dominating rule 1 names for code applied
  to a planning document: §2.3 asserts, in writing, that "nothing is
  unmapped, nothing is silently deferred" (line 172) directly beneath
  three rows that are themselves mismapped — a completeness claim sitting
  on top of the very inaccuracy it claims not to have.

---

## Attestation

- **What I read in full this session (2026-09-07).** `docs/collapse-
  log.md` (1435 lines, two `Read` calls); `OWNER-LEDGER.md` (81 lines);
  `middleware/context-oracle/CLAUDE.md` (full, via system context);
  `docs/specs/spec-context-oracle.md` §8 (326–543), §11.5 (739–778), §12
  (780–873), §13 (874–907), §14 (908–1138), all read in full;
  `docs/architecture-phase-a.md` AD-5 (568–646), AD-9 (736–923), AD-10
  (924–1072 region, adjacent AD-11–13 skimmed), AD-14 (1073–1129), AD-15
  (1130–1178), AD-16–17 (1179–1281, adjacent), AD-18 (1282–1413 region),
  AD-21 (1414–1512 region), AD-24 (1513–1600 region); `docs/STATUS.md`
  (237 lines, full); all seven named prior review documents in full;
  the evidence directory's three files in full; `docs/plans/plan-
  phase-a.md` (6770 lines) across multiple `Read`/`Grep` calls covering:
  lines 1–470 (front matter, §2.3 table, full file skeleton), 612–3244
  (every §7 step body, Steps 1–43 plus 2.5, read across five sequential
  Read calls with no gaps), 3246–3460 (§9 Checkpoints, §10 D-plan-1/2),
  3453–3960 (§10A in full: D-plan-1, D-plan-6, D-plan-8, N1–N6), 4460–
  4500 and 4820–4870 (T8-1, T23-1 full specs), 4930–4975 (T41-1 full
  spec), 5110–5135 (T18-3 full spec), 5590–5640 (T33-1/T33-2/T33-3),
  5760–5920 (§12.5 both mapping tables, §13 Risks in full), 6140–6250
  (§14.4 sweep narrative, §15 Q-gap-4/5 in full), 6570–6690 (§15 Q-gap-5
  disposition and its Clear-Thought sub-section, in full).
- **What I fetched or re-verified externally.** Nothing — this round's
  findings are internal-consistency and cross-reference checks,
  established entirely by direct reads of the plan against itself, the
  architecture, and the prior review record, per the task's own method
  ("search locates, reads verify").
- **Confidence.**
  - **High** on Collapse 1 — a direct textual contradiction between two
    fully-read passages (Step 8's corrected text and Step 14's uncorrected
    clause), three lines apart from a correctly-fixed sibling clause in
    the same sentence.
  - **High** on Collapse 2's four listed rows (Steps 22/33/36/37/39
    misattributions) — each cross-checked against both the cited step's
    own `###` heading/body and the document's own independently-verified
    §12.5 Step→T-ID table, which agrees with the step bodies and
    disagrees with §2.3 in every case.
  - **Low** on the line-163 fifth candidate noted under Collapse 2 — flagged
    but not counted, since an unordered-list reading is plausible and the
    positional mismatch is weaker evidence than the four counted rows.
- **How long.** Full end-to-end read of the plan (6770 lines, up from
  6644 at round 3 — the round-3 fix pass added roughly 126 lines), all
  seven prior review documents, the named spec sections, the named
  architecture decisions, the full collapse-log, the ledger, and the
  evidence directory; every claim in round 3's two review documents
  cross-checked against its cited location before writing any new
  finding, and every round-3 "closed" claim re-verified independently
  rather than trusted.
- **What would make me revise the verdict up (to SURVIVES).** For
  Collapse 1: discovery that line 1381's "at Step 8" is intentional —
  e.g., that `lexicon.stoplist`'s *initial values* really are meant to be
  hardcoded in the migration file while `lexicon.completion_claim` and
  the bar thresholds are seeded via Step 23 — but nothing in Step 8's own
  corrected text or AD-5's WRITER designation supports a table-by-table
  split of this kind; Step 8 states plainly "no rows inserted by the
  migration itself," full stop, for all of `tuning`. For Collapse 2:
  discovery that §2.3 is deliberately describing a different, coarser
  grouping than "which step's body builds this" (e.g., grouping by
  subsystem rather than by literal step number) — but the table's own
  header ("Requested Phase A element | Plan step(s)") and its own
  worked example one row above (the now-correctly-fixed Delivery row,
  which is precise about exact steps) both establish that this table's
  claimed precision is per-step, not per-subsystem.
- **What would make me revise down further.** Nothing found this round
  that would deepen either collapse — both are narrowly-scoped textual
  corrections (one clause, four table cells) with no evidence of a
  further undisclosed design decision hiding behind them.

*End of round-4 collapse-hunt. Trajectory across four rounds on this
plan: round 1 — 3 collapses, 4 partials, 6 missed decisions, DOES NOT
SURVIVE; round 2 — 1 collapse, 3 partials, 1 new defect, 1 procedural
gap, DOES NOT SURVIVE; round 3 — 2 collapses, 2 partials, 0 new missed
decisions, DOES NOT SURVIVE; round 4 — 2 collapses, 0 partials, 0 new
missed decisions, DOES NOT SURVIVE. Both of this round's collapses are,
once again, the identical systemic shape `docs/collapse-log.md`'s round-2
and round-3 entries (2026-09-07) already name: a fix that lands at its
primary/decision site (Step 8; §2.3's Delivery row) without sweeping
every cross-referencing surface (a recognizer's own inline documentation;
three sibling rows of the very table just edited). Four consecutive
rounds have now found this exact pattern recurring at new sites each
time, which is itself the standing lesson: a reconciliation-sweep's own
attestation of completeness is not verification of completeness, no
matter how many times the same fix pass has already caught one instance
of the pattern in the same session. Not yet the zero-collapse round
`docs/collapse-log.md`'s 2026-08-25 entry defines as terminal.*
