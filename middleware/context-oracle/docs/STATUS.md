# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, ideas in `docs/IDEAS.md`, and everything
attributed to Max Cogar in `OWNER-LEDGER.md`.*

## The Phase A goal (the north star — read this first)

Phase A is the **honest deterministic foundation, and the measurement of its
own floor.** It stands up the genuinely-deterministic core on Max's real repos —
the stores, the index, the miner, the model-free whisper genres, the deny
plumbing, the self-observability — runs cleanly with no incident, and tells Max
the truth about what that core does and does not do. The spec (§11.5) defines
the Phase A exit as a *measurement*, not a finished feature: it "exits by
producing measured whisper/block, false-fire, and regret data on a real repo —
**including how little the conservative recognizer catches**" before Phase B.
The deliverable is honest capability plus honest measurement, with clean seams
the later phases plug into — **never fake completeness dressed to look like a
working product.** Judge every Phase A decision against this goal (`CLAUDE.md`
dominating rule 3).

## Where the project stands

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`). The
Phase A architecture (`docs/architecture-phase-a.md`) is reviewed to
convergence. `docs/plans/plan-phase-a.md` has been through **eleven rounds**
of fix-and-re-review this session:

**Round 1** fixed every finding across the four review documents that had
accumulated by 2026-09-06: the author-gates review, the meta-check, and the
two 2026-09-06 independent reviews (collapse-hunt: DOES NOT SURVIVE, 3
collapses/4 partials/6 missed decisions; expert-review: NEEDS FIXES, 10
findings).

**Round 2** dispatched a fresh independent collapse-hunt
(`docs/reviews/2026-09-07-round-2-plan-collapse-hunt.md`) and a fresh
independent expert-review (`docs/reviews/2026-09-07-round-2-plan-expert-review.md`)
against round 1's output — both came back with real findings, both were
fixed directly in the plan. Collapse-hunt: 1 collapse (a cited test ID,
`T41-1d`, was never actually specified), 3 partials (a "design-safe either
way" overclaim survived at three secondary locations after its primary fix;
the plan's risk register (section 13) entries R1/R7 weren't synced to their Step fixes; four of Step
23's six "unsourced" defaults are actually AD-14-sourced, an overclaim in the
opposite direction from round 1's original mis-framing), plus a procedural
finding that N1–N6 had inline rationale but no formal four-part collapse-test
— now added for all six, each attacked with a harder question than its
Step's inline text posed. Expert-review: 9 of
10 round-1 findings verified genuinely closed; one (S3/Q-gap-5) correctly
rejected as an overclaim — see below; a Systemic pattern (fix content not
swept to every cross-reference — a stale `D-plan-6`/`D-plan-8` collapse-test,
a stale `src/cli.ts` reference, a missing `src/proc/` skeleton entry) found
at 7 sites and fixed; 4 test IDs cited with no test specification (plan
section 12), now added
(`T2.5-1`, `T18-2`, `T21-2`, `T32-1a`).

All findings from both rounds, across all six review documents total, were
applied directly in `docs/plans/plan-phase-a.md`:

- **Collapses (C1–C3):** C1 — the build-order collapse-test's answer was
  irrelevant to the harder question; fixed with a write-time predicate cap on
  Step 14/18/23 so recognizer elaboration requires a new collapse-test, not
  just a post-hoc report flag. C2 — `node:test` cannot execute `.ts` under
  Node 22.16.0 with no compile step named; fixed with a `tsconfig.test.json`
  compiling `src/`+`test/` to `dist-test/` before tests run (Step 1), and
  Step 15/39's grep/verification scopes corrected to match. C3 — the exit-run
  repo set was `Maxcogar/agent-armory` alone (the tool's own repo, not real
  application code); fixed so a single-repo/self-referential exit-run is
  explicitly labeled non-representative in its own report rather than cited as
  Phase A's honest floor.
- **Partials (P1–P4):** all four resolved — lag-window and intake-overreach
  wrongful-deny classes now have dedicated counters
  (`deny_after_answer_lag`'s case-(b) race, new `deny_from_injected_turn`) and
  honest wording (no more "design-safe either way" overclaim); the
  `settings.json` marker (P3) now lives in the required `command` field itself
  rather than an invented field a stricter future schema could reject; the
  Phase B model-invocation seam (P4, Step 38) now carries every field the
  verified V9 command actually returns instead of an invented narrower shape.
- **New load-bearing decisions the plan's collapse-test section (10A) missed (N1–N6):** all six resolved —
  Step 5's URL normalization axes enumerated explicitly (SSH-vs-HTTPS
  unification declared out of scope, `status` now shows the full normalized
  key, not just the mode); Step 18's `deny_bypass_suspect` coverage bound
  disclosed by name; Step 23's bar defaults reworded from a false "verified
  against AD-14/AD-9" to honest "plan-seeded, calibrated by the exit-run";
  Step 14's `lengthFloor` now has a seeded default; a new **Step 2.5**
  (`oracleSpawn` wrapper) makes the `CTXORACLE_INTERNAL` recursion guard
  structural instead of implementer discipline, placed early enough that
  Step 21's indexer (which already spawns) depends on it correctly — this
  itself fixed a latent topological-order bug the same shape as S1 below;
  Step 15's grep scope is now unambiguous now that `dist/` and `dist-test/`
  are distinct compile targets.
- **Expert-review Serious/Moderate/Minor (S1–S3, M1–M5, m1–m2):** all
  resolved — S1's Step 31→32 circular dependency fixed by having `init` call
  `runIndex` (Step 21) directly; S2's missing Verification-genre acceptance
  test closed with new `T25-8`/`T25-9` (also fixes the plan's inaccurate "one
  per genre" claim, m2); M1's fixture repos now enumerated in the plan's file
  skeleton (section 5.1); M2's
  duplicated `hook_field_names_isolated.test.ts` reduced to one file at one
  path; M3's `T15-1` now covers both mutation fields; M4's Step 39
  Dependencies field now states its real scope; M5's `AC-2c` over-fire mapping
  corrected to state what `T17-1` actually covers, with the uncovered
  sub-case explicitly reduced to Phase B; m1's Step 39 verification glob now
  covers all three non-replay test tiers.
- **Meta-check H5/H6:** H5 — two decisions (the `web-tree-sitter` dependency
  floor, and the now-largely-moot D-plan-6 owner-probe workload) were
  reclassified from bin-1 to bin-2 in the plan's bin-2 register (section
  14.2), given a stated default so nothing is blocked, and flagged for Max
  Cogar's optional override — no action is required from him. H6 — the
  CodeGraph-dependent checks SKILL.md names (`codegraph_find_related_docs`,
  `codegraph_diff_surface`, the symbol tools, the foundation probes, the
  dependency-list builder) were never run against this plan; recorded
  honestly as a new gap (the plan's Q-gap-6) with bounded impact
  (the plan is greenfield, so most would return empty today) and wired into
  Step 43's post-completion doc-sync so they run for real once Phase A's code
  exists.

**Q-gap-5 (the skill halt-condition) is now fully resolved.** The original
session's disposition — asking Max Cogar to rule accept/halt/waive on
CodeGraph/Clear Thought unavailability — was wrong; `CLAUDE.md` rule 2
already answers a genuine halt condition with "halt," not "escalate." Round
1 fixed the root cause: `mcp-servers/codegraph-mcp/` (already present in
this repo) was built and registered as a local MCP server, and
`clear-thought` (already named in `middleware/context-oracle/.mcp.json`)
was registered alongside it — `claude mcp list` health-checks both as
connected. Round 1 then called Q-gap-5 "closed" on that basis — **round 2's
independent expert-review correctly rejected that as an overclaim (finding
S3):** fixing tool *availability* does not retroactively make round 1's own
judgment calls Clear-Thought-verified, since this session's own
tool-attachment layer (`ToolSearch`) never picked up the newly-registered
servers, confirmed repeatedly.

**Resolved for real, this session, by going around the attachment layer
rather than waiting for it.** The MCP stdio protocol is just JSON-RPC over
a subprocess's stdin/stdout — it doesn't require the harness's own
tool-attachment layer to work. This session wrote a minimal MCP client,
spoke the protocol directly to `npx -y @waldzellai/clear-thought-onepointfive`
(full handshake: `initialize` → `tools/list` confirmed the `clear_thought`
tool), and ran all six flagged decisions as real `sequential_thinking`
chains — 18 tool calls, one MCP session
(`stdio-session-1788762266748`), transcript in full at
`docs/reviews/2026-09-07-clear-thought-verification-q-gap-5.md`. All six
confirmed the shipped design (C1's write-time cap, N5's Step-2.5 placement,
C3's repo-set disclosure, P3's command-field marker, P4's widened
interface, T18-3's mechanization), and the pass sharpened N5's framing from
"defensible" to "required" (Step 21 already spawns, before Step 38, so the
wrapper structurally must exist by Step 2.5 or Step 21 ships an uncaught
AD-21 violation). This satisfies SKILL.md Step 6's literal mandate (invoke
the server, record the reasoning) — round 3's collapse-hunt correctly
caught this document initially overclaiming that as "independent
verification": it isn't (this session both wrote the original reasoning
and fed it through a tool that echoes rather than judges), and the
overclaim is corrected everywhere it appeared. Independent checking of
this session's work is what the separately-dispatched collapse-hunt/
expert-review rounds provide, and they did: round 3 caught the overclaim,
plus a real AD-9 compliance gap (below). This closes the plan's Q-gap-5
entry (section 15) in full — no owner ruling, no further tool-attached
re-check outstanding.

**Round 3** dispatched a fresh independent collapse-hunt and expert-review
against round 2's output. Both returned real, shrinking findings, all
fixed:

- **Collapse-hunt** (2 collapses, 2 partials): (1) the "independent check"
  overclaim above, corrected everywhere it appeared (the plan, STATUS, and
  the verification transcript) to the narrower true claim (SKILL.md Step
  6's literal mandate satisfied; independent checking comes from the
  dispatched review rounds); (2) `deny_bypass_suspect`'s bias disclosure
  (Step 18, Step 33/`T33-1`) named only the under-count direction; AD-9
  requires both directions stated in `status` — the over-count direction
  is now disclosed verbatim alongside the under-count residual; (3) a
  stale cross-reference in the plan's D-plan-1 entry (section 10) still
  pointed at Clear Thought as unresolved after Q-gap-5 (section 15)
  resolved it — fixed; (4) the sharpened N5 framing was claimed to be in
  N5's own collapse-test entry (section 10A) but wasn't — now added there.
- **Expert-review** (1 Systemic pattern spanning 2 instances, 2 Moderate,
  1 Minor): independently reproduced the Q-gap-5 MCP protocol claim from
  scratch (its own client, matched the exact server version string and
  session-ID shape) and confirmed it genuine, not asserted. Found the
  same 7-site systemic pattern round 2 fixed recurring at 2 new sites this
  fix pass itself introduced: Step 41 never actually built
  `deny_bypass_predicates_confined.test.ts` (`T18-3`) despite four other
  surfaces asserting it exists — fixed, added as Step 41's fifth
  convention file; and Step 8's migration seeded `tuning` at
  migration-apply time, contradicting AD-5's own "seeded at `init`"
  WRITER designation and duplicating Step 23 — removed the seeding claim
  from Step 8, corrected T8-1/T23-1's test specs to match Step 23's actual
  4-AD-14-sourced/2-plan-judgment split. Two Moderate citation errors
  (§2.3's Delivery row misattributing Step 31 instead of Step 30/19; Step
  19 citing "Step 26" instead of Step 25 for the done-claim recognizer)
  also fixed. One Minor finding (no checked-in script/transcript for the
  Q-gap-5 MCP evidence) resolved by committing the actual client script
  and a raw transcript sample to
  `docs/reviews/evidence-2026-09-07-clear-thought-verification-q-gap-5/`.

**Round 4** dispatched a fresh independent collapse-hunt and expert-review
against round 3's output. Both returned real, shrinking findings, all
fixed:

- **Collapse-hunt** (2 collapses, 0 partials): (1) Step 14's own body still
  said `lexicon.stoplist` is "seeded... at Step 8," a literal contradiction
  of round 3's own Step 8 correction three lines above in the same
  paragraph — fixed to "at Step 23 (invoked at `init`)"; (2) §2.3's
  coverage-reconciliation table — the same table whose Delivery row round
  3 corrected — had three further wrong step-number citations: the seven
  genres attributed to "Steps 21–28" instead of Step 25 alone, the indexer
  attributed to Step 22 instead of Step 21, and Self-observability's
  status/regret/log roles swapped across Steps 33/36/37 (with Step 37 —
  concurrency, unrelated — cited in place of Step 33 for `log`). All four
  rows rewritten to match the step bodies and §12.5's own Step→T-ID table.
- **Expert-review** (1 Systemic pattern spanning 2 instances): Step 40's
  body and §14.1's Q13 still described the owner-run L11 probe design
  that the plan's D-plan-6 entry retracted back in round 1 — files
  (`real_transcript_marker_probe.md`, `user_prompt_submit_provenance.md`)
  that never matched the plan's actual file skeleton (`l11_a_measurement.md`,
  `l11_b_disposition.md`); rewritten to match D-plan-6/Q-gap-4's
  resolved disposition (no owner action for either L11(a), already
  measured, or L11(b), resolved by design-safety analysis plus the
  `deny_from_injected_turn` runtime counter). Step 32's Verification field
  never cited `T32-1a` (added at round 2 to §12 and the mapping table, but
  never swept into Step 32's own inline prose) and misattributed `--purge`
  to `T32-1` alone, contradicting T32-1's own "NOT asserts: `--purge`"
  spec — split into separate `T32-1`/`T32-1a` citations. A related stale
  reference in §10A's "Test tier split" collapse-test (still describing
  the L11 preconditions as unexecuted manual probes) was found during this
  pass's own sweep and fixed alongside the two flagged findings. The
  sweep-record narrative (section 14.4) also got two missing entries —
  Pass J (round 3) and Pass K (round 4) — per expert-review's tentative
  finding that it had no entry for round 3's own substantial fix pass.

Four consecutive rounds have now found this same "fix landed at its
primary site, not swept to every cross-referencing surface" pattern
recurring at new sites each time (round 2: 7 sites; round 3: 2 sites;
round 4: 2 instances at 4 locations) — logged in `docs/collapse-log.md`
as a standing lesson: a reconciliation sweep's own attestation of
completeness is not verification of completeness, however many times the
same fix pass has already caught one instance of the pattern in the same
session.

**Round 5** dispatched a fresh independent collapse-hunt and expert-review
against round 4's output. Both returned real findings, all fixed:

- **Collapse-hunt** (2 collapses, at sites outside every prior round's
  targeted-read scope — section 3's Standards registry and section 5.3's
  file-modification note): (1) section 3 attributed SQLite WAL semantics
  to Step 32 (`deinit`/`index`/`hook`/`export`/`import` verbs, no WAL
  content); fixed to Step 37, the actual concurrency step; (2) section 5.3
  attributed the `init` verb's `settings.json` write to Step 30
  (Delivery, no `settings.json` logic); fixed to Step 31, the actual
  `init` step — the mirror image of a mix-up section 2.3's Delivery row
  was already corrected for at round 3. The collapse-hunt's own report
  claimed "48 such citations checked... only these two were wrong."
- **Expert-review** (1 Systemic pattern spanning 2 instances at 6
  locations, 1 Minor): independently re-verified round 4's fixes and the
  round-5 collapse-hunt's own two fixes, and found the collapse-hunt's
  "only these two were wrong" claim itself false — **four more sites**
  carrying the identical "Step 30's `init`" misattribution survived
  inside Step 2, Step 8, Step 23, and Step 29's own bodies, sections the
  collapse-hunt's own attestation claimed to have read in full. All four
  fixed (Step 23's own text is the origin the other three quote or
  parallel). A second instance: section 10A's "Test tier split"
  collapse-test had its Answer field corrected at round 4, but its
  sibling Job and Steers-toward fields — three and twenty-two lines away
  in the same four-part entry — still called the L11 files "build-time
  markdown probes," directly contradicting the entry's own corrected
  Answer; both fields rewritten to match. One Minor finding (Step 38's
  `oracleSpawn` paragraph duplicated verbatim at two locations) resolved
  by removing the second copy. A tentative finding (whether section 14.2's
  `(Step 8, ...)` parenthetical on the D-plan-6 bullet is a
  misattribution) was investigated against `expert-plan` SKILL.md
  directly this session: SKILL.md's own Step 8 is "Write the plan," and
  the register's established convention (Q-gap-1's "Step 2 — codebase
  survey," Q-gap-3's "Step 2 — premise currency") is to cite SKILL.md's
  process-step number with a free-text topic label, not the step's
  heading verbatim — under that convention, both the D-plan-6 bullet's
  "(Step 8, ...)" and Q-gap-4's "(Step 8 — L11 architecture-flagged
  verifications)" are consistent (the L11 verification question surfaced
  while writing the plan, SKILL.md Step 8). **Confirmed not a defect; no
  plan change made.**

Five consecutive rounds have now found the "fix landed at its primary
site, not swept to every cross-referencing surface" pattern recurring at
new sites each time (round 2: 7 sites; round 3: 2 sites; round 4: 2
instances/4 sites; round 5: 2 instances/6 sites, including a same-round
collapse-hunt's own completeness claim being independently falsified by
that same round's expert-review). The count has not strictly shrunk to
zero and, per `docs/collapse-log.md`'s round-5 entry, "the count is
shrinking" is explicitly not being treated as evidence the underlying
sweep mechanism now works — only a round that returns zero new findings
ends the loop.

**Round 6** dispatched a fresh independent collapse-hunt and expert-review
against round 5's output, both instructed to use search strategies
independent of round 5's own grep patterns. Both returned real findings,
all fixed:

- **Collapse-hunt** (1 collapse, at a citation number entirely outside
  the "Step 30/31/32/37" cluster every prior round's search had
  concentrated on): Step 9's DAO body cited "Step 41's ULID util" for
  the `whisper_audit` DAO's `append()` return value; Step 41 builds only
  grep-based CI convention tests with no ID-generation content, and the
  ULID generator is actually built at Step 37 (AD-26), confirmed by the
  file skeleton and Step 37's own body naming the same `whisper_audit`
  table. Fixed the citation. All of round 5's fixes were independently
  re-verified as genuinely closed.
- **Expert-review** (2 Moderate, 2 Minor — no verified multi-site
  Systemic pattern this round, a genuine break from rounds 2-5): (1) a
  library-behavior claim was checked against an actual `semver`
  evaluator for the first time in this document's six-round history —
  D-plan-2 and section 14.2 both claimed the npm caret range `^0.26.13`
  "accepts 0.27.0 anyway"; installing and running `semver` (v7.8.5)
  showed this is false (`^0.26.13` is anchored at the minor version and
  excludes `0.27.0` entirely) — a claim that had gone unverified since
  the plan's original 2026-09-06 authoring and survived two intervening
  review generations unchecked; rewrote D-plan-2's collapse-test and
  section 14.2's option (a) description around the real semver
  semantics; (2) section 3's Standards registry still called the
  web-tree-sitter version-bump question "bin 1 answered" after
  meta-check H5 reclassified it to bin-2 and section 14.1's Q1 was
  retracted — a sixth instance of the recurring sweep-failure pattern,
  fixed to cite the current register state; (3) section 14.4's
  sweep-record narrative had no "Pass L" entry for round 5's fix pass —
  added; (4) a garbled `.mcp.json`-registry reference in section 14.2 —
  fixed to "npm-registry re-check (section 11.4)." All of round 5's
  findings were independently re-verified as genuinely closed, including
  the sharpest possible test of round 5's own lesson: a fresh grep
  across the full current document for the "Step 30's `init`" defect
  class returned zero hits.

**Round 7** dispatched a fresh independent collapse-hunt and expert-review
against round 6's output, instructed to generalize round 6's "verify a
familiar-tool claim by execution" discipline to the rest of the document
rather than only re-checking the semver fix. Both returned real findings,
all fixed:

- **Expert-review** (1 Critical, 1 Moderate): (1) Step 1 specifies `npm
  ci` as the first command of both its own acceptance test (`T1-1`) and
  the CI workflow gating every PR, but no step anywhere in the plan ever
  creates a `package-lock.json` — verified by direct execution that `npm
  ci` refuses to run at all without one (`npm error code EUSAGE`),
  meaning the plan's own foundation step and every CI run would fail
  unconditionally on a fresh checkout, before a single line of code is
  type-checked. Fixed by having Step 1 run `npm install` once and commit
  the resulting `package-lock.json`, added to the file skeleton and
  `T1-1`'s spec. (2) D-plan-2's own decision heading (section 10, not the
  section 10A collapse-test round 6 fixed) still labeled `web-tree-sitter`
  "(exact)," contradicting Step 1's actual caret range and D-plan-2's own
  corrected collapse-test three sections below it — fixed, plus a
  softened secondary echo at Q1's disposition.
- **Collapse-hunt** (1 collapse, 3 Minor): Step 2 cited "Node's official
  `node:sqlite` documentation" for a `SqliteError` class that does not
  exist — verified false by direct execution against a live Node runtime
  (a statement failure throws a plain `Error` with `code:
  'ERR_SQLITE_ERROR'`, not a distinct class) and by fetching the official
  docs page, which names no such class; this claim was plan-original,
  never logged in the plan's own claims registry, and survived seven
  rounds because "SqliteError" reads as too plausible a name to check —
  the identical shape to round 6's semver finding, at a site round 6's
  semver-specific search never touched. Fixed and logged in section 11.4.
  Three Minor findings also fixed: the file skeleton's three missing
  step-attribution comments (`hash.ts`, `events.ts`, `verdict.ts`); a
  duplicate confirmation of the D-plan-2 "(exact)" mislabeling (already
  fixed by this round's expert-review pass); and a malformed four-cell
  row in section 12.5's AC→T-ID table for AC-21.

Round 7 marks the first round whose highest-severity finding (Critical)
exceeded every round since round 2 — not because the plan regressed, but
because round 6 and round 7 both generalized a new verification method
(execute a "too basic to check" claim against a real instrument) that no
prior round applied, and each application found something the previous
six rounds' methods structurally could not see.

**Round 8** dispatched a fresh independent collapse-hunt and expert-review
against round 7's output, instructed to continue generalizing the
execute-don't-assume method. Both returned real findings, all fixed:

- **Expert-review** (1 Serious, 1 Moderate): (1) Step 37 stated the
  detached reindex "takes a directory lock via `flock`(2)" — verified by
  direct execution that `node:fs` exposes no `flock` wrapper and no
  `LOCK_*`/`O_EXLOCK` constants at all, and the plan's own no-native-code,
  two-dependency constraints leave no way to invoke the real syscall.
  Fixed by replacing it with an atomic exclusive-create lock file
  (`O_CREAT | O_EXCL`), which needs no dependency. (2) Step 1 and
  D-plan-3's collapse-test both claimed, as a blanket fact across the
  plan's entire `>=22.16.0` Node floor, that `node:test` cannot execute
  `.ts` source without an experimental flag — verified false for the
  `>=22.18.0` sub-range, where TypeScript type stripping is enabled by
  default. The plan's chosen fix (a real `tsc` compile step) remains
  necessary regardless, for an unstated reason: Step 6's `const enum`
  requires transformation that even default-on stripping refuses — fixed
  both sites to state the real, version-bounded fact and the actual
  reason the compile step is needed.
- **Collapse-hunt** (2 collapses, generalizing round 7's method from
  library citations to shell-command *output-shape* claims specifically):
  (1) Step 5's repo-identity algorithm labeled two genuinely different
  `git rev-parse --is-inside-work-tree` outcomes — command succeeds and
  prints `false` (a bare repository) vs. command fails outright with a
  fatal error (no git at all, exit 128) — under one "→ false" label,
  routing both to the same next step; verified by direct execution that
  the true no-git case (exactly `T5-1`'s own fixture (d)) fails outright
  rather than printing `false`, so the plan's own routing never actually
  reaches the fallback path its own text names for that case. Fixed by
  making the algorithm explicitly distinguish "invocation failed" from
  "invocation succeeded and returned false." (2) Step 20's co-change
  miner runs `git log --numstat -M` (rename detection) but never
  accounted for `-M`'s own output syntax — a detected rename collapses
  `--numstat`'s per-file line to a single `old => new` (or
  brace-abbreviated) line, not a plain path; verified by constructing
  three rename scenarios and executing the exact command. Unlike every
  prior round's findings, this one is silent, not self-revealing: it
  would corrupt or drop coupling evidence for every renamed file in real
  commit history, feeding directly into four of the seven Phase A
  genres' data on the exit run, with no fixture catching it first. Fixed
  by adding explicit rename-parsing to Step 20 and a renamed-file
  scenario to `T20-1`'s fixture.

**Round 9** dispatched a fresh independent collapse-hunt and expert-review
against round 8's output, instructed to verify round 8's fixes by
re-execution rather than re-reading and to keep prioritizing silent
defects. Both returned real findings, all fixed:

- **Expert-review** (2 Serious): both found by re-executing round 8's own
  fix mechanisms against the exact scenarios round 8's own findings named
  — not merely re-reading the corrected prose. (1) Round 8's Step 20 fix
  claimed to "expand the brace form if present into the real old and new
  paths," but its only supplied mechanism (a single regex) does not do
  that: applied to the fix's own cited example, `src/{utils => other}/
  c.txt`, it produces two malformed strings containing stray brace
  characters, reproducing the exact silent corruption the fix was
  supposed to close. Fixed with a proper two-step detector (brace form
  first, plain form as fallback) and a cross-directory rename fixture
  added to `T20-1`. (2) Round 8's Step 37 fix replaced the nonexistent
  `flock`(2) call with a real atomic exclusive-create lock file, but
  specified no release step — `fs.closeSync` does not delete the lock
  file, unlike `flock`(2)'s kernel-mediated auto-release, so the
  detached reindex's self-refresh would succeed once per project and
  then fail `EEXIST` forever after, silently and permanently disabling
  automatic re-indexing with no diagnostic. Fixed with an explicit
  unlink-on-completion, a named staleness threshold (`reindex.
  lock_stale_ms`, a new seeded `tuning` default), and a new test (`T37-3`).
- **Collapse-hunt** (1 collapse, 2 further findings): independently
  confirmed the same Step 20 brace-expansion gap (Collapse 1) and went
  further — constructing a fourth rename scenario (a same-directory,
  same-extension rename, the single most ordinary refactor) and showing
  the brace-compaction form is not a rare edge case but the *dominant*
  shape for real renames, making the gap more consequential than round
  8's own framing suggested. Also found that round 8's own two
  collapse-hunt findings (the Step 5 git-invocation fix, the original
  Step 20 rename-detection fix) were fixed at their primary sites but
  never logged in section 11's claims registry, in the same fix pass
  that correctly logged round 8's sibling expert-review findings —
  fixed by adding both entries. A third, Minor finding (Step 37's
  staleness check being unspecified and untested) was resolved by the
  same fix as the expert-review's Serious Finding 2.

Logged in `docs/collapse-log.md`: a fix-pass annotation claiming a prior
finding is "corrected" is itself an unverified claim until the exact
scenario the original finding named is re-executed against the fix's
literal text — not merely re-read for plausibility. This is a
fix-diff-specific sharpening of the execute-don't-assume method, now
shown to apply with equal force to a round's own closure claims about
itself, not only to fresh claims about the document's older content.

**Round 10** dispatched a fresh independent collapse-hunt and expert-review
against round 9's output, instructed to re-execute round 9's own fix
mechanisms rather than trust the corrected prose. Both returned real
findings, all fixed:

- **Collapse-hunt** (1 Serious collapse, 1 missing-collapse-test finding,
  1 Minor): independently re-verified round 9's two fixes hold for every
  scenario they were built to close, then found that round 9's own new
  staleness-reclaim step introduced a race condition round 9 did not
  test for: two concurrent triggers can both pass the staleness check on
  the same abandoned lock, both reclaim, and both believe they hold
  exclusive ownership — reproduced by direct hand-interleaved execution
  of round 9's own described algorithm. Fixed with an atomic
  rename-based reclaim. Also found the new `reindex.lock_stale_ms`
  decision shipped with no section-10A collapse-test of its own, whose
  absence is plausibly why the race went unasked at write time — added
  N7, whose hardest question is exactly that race. A Minor residual
  (a filename containing literal brace characters can mis-parse the
  round-9 rename fix) was disclosed rather than fixed, as genuinely rare.
- **Expert-review** (1 Critical, 1 Moderate): after confirming round 9's
  two fixes hold under independent re-implementation, a full-document
  regression scan found that the plan's foundational dependency pin —
  `web-tree-sitter@0.26.13` paired with `tree-sitter-wasms@0.1.13`,
  inherited from architecture premise V14 and re-cited across ten
  architecture-review rounds and nine plan-review rounds — is
  functionally false: direct execution shows `Language.load()` throws
  for every grammar in `tree-sitter-wasms@0.1.13` under
  `web-tree-sitter@0.26.13` (a WASM `dylink`-vs-`dylink.0` format
  mismatch). Every prior re-check (rounds 6, 7, 9) verified only the
  semver *range's* behavior, never whether the two pinned packages
  actually work together — the first execute-don't-assume finding in
  this document's history to require executing two packages together,
  not one. Fixed by re-floor to `web-tree-sitter@^0.25.10`, verified
  this round to load and parse successfully; architecture V14 corrected
  to match; a grammar-load-failure fallback to the generic frontend
  added (the prior text specified no error handling, so a load failure
  would have aborted indexing for the whole repository); a new CI-
  enforced test (`T22-3`) added so a future version bump cannot
  reintroduce this silently. Also fixed: `reindex.lock_stale_ms`'s
  10-minute default (added round 9) was asserted as "well beyond any
  real index run's duration" with zero measurement anywhere — reworded
  to the same honest, calibration-pending framing the plan already uses
  for its sibling unsourced defaults, with a new §13 risk entry (R11).

Logged in `docs/collapse-log.md`: a claim re-verified only along the
axis a prior finding already checked (here: the semver range, checked
three times) can still harbor a false premise on a different,
uninspected axis (here: functional cross-package compatibility) — and a
claim's own "how verified" citation is worth reading for what it does
*not* say it checked, not only for what it says it did.

**Round 11** dispatched a fresh independent collapse-hunt and
expert-review against round 10's output, both instructed to independently
re-execute round 10's own two headline fix mechanisms from scratch rather
than trust the corrected prose. Round 10's dependency-floor fix
(`web-tree-sitter@^0.25.10` + `tree-sitter-wasms@0.1.13`) was re-derived
independently by both agents (expert-review sampled eight grammars, two
more than round 10, and separately re-confirmed `0.26.13` still fails
identically) and is genuinely, robustly closed. Round 10's atomic-rename
lock-reclaim fix (Step 37) was not:

- **Serious (both agents independently, one via hand-interleaved
  execution, one via a real two-OS-process reproduction).** Round 10's
  `fs.renameSync`-based reclaim prevents two reclaimers' rename calls
  from colliding only at the *same instant* against the *same,
  still-present* stale file — exactly what round 10's own `T37-3` case
  (d) and N7 collapse-test constructed and both correctly passed. It does
  not stop a reclaimer that decided "stale" early and was then delayed —
  by ordinary OS scheduling, disk contention, or a busy host, with no
  bound the algorithm enforces — from later renaming away a completely
  different, *live* lock a faster reclaimer legitimately created and is
  actively running against in the meantime: `rename(2)` moves whatever
  currently occupies the source path, with no notion of "the file I
  mean." Reproduced by direct execution both ways, including two
  genuinely separate `node` processes. Fixed with content-token identity
  verification: every lock creation now writes a fresh token into the
  lock file's own bytes; a reclaim's rename is followed by a
  byte-for-byte comparison against the token captured at the staleness
  check, and a mismatch restores the live lock to its path and skips
  silently rather than deleting it. A device+inode identity check was
  tried first and found insufficient by direct execution — `unlinkSync`
  immediately followed by `openSync(O_CREAT)` at the same path routinely
  reuses the just-freed inode number, producing false-positive matches —
  verified across three repeated real two-process runs that the content
  token does not have this failure mode. This narrows the vulnerable
  window from "the winner's entire reindex duration" to a handful of
  syscalls but, per POSIX's lack of a true rename compare-and-swap, does
  not eliminate it; the residual is now disclosed in Step 37, N7, `§13
  R11`, and architecture `AD-26` (new this round — was silent on this
  before). `T37-3` gained a new case (e) constructing the wider,
  delayed-reclaimer interleaving directly.
- **Moderate (collapse-hunt).** `§13 R11` ("not data corruption… a
  redundant reindex") directly contradicted Step 37's own "Impact if
  wrong" text ("silent index corruption") for the identical scenario,
  both added in round 10's same fix pass and never reconciled. Fixed by
  correcting R11 to match Step 37's harsher, more accurate framing:
  two concurrent `mineCochange` passes reading the same unadvanced
  watermark would double-count co-change evidence (`AD-13`'s
  accumulation logic), not merely duplicate idempotent work — reasoned
  from the miner's own stated design, not executed, since Steps 20–22
  don't exist yet, and disclosed as such.
- **Minor (collapse-hunt).** `§14.4`'s reconciliation-sweep-record
  narrative had no entry for any of rounds 6 through 10's five fix
  passes, despite the document's own rule (added at round 6) that every
  fix pass gets one. Fixed by adding Pass M through Pass Q (rounds 6–10)
  and Pass R (round 11, this pass).

Logged in `docs/collapse-log.md`: a fix's own unit test and collapse-test
are not independent verification of it when both are authored against the
same narrow scenario its author had in mind — construct the interleaving
that maximizes a race's vulnerable *duration*, not only the one that
maximizes apparent simultaneity. Also logged: a plausible-looking identity
check (a file's inode) can be wrong in a way only execution reveals —
inode reuse on a freshly recreated file defeated the first candidate fix,
caught only by directly running it.

## What to do next (agent-owned)

1. **Dispatch round 12 of independent collapse-hunt and expert-review.**
   The finding count across rounds: round 1: 3 collapses/4 partials/6
   missed decisions + 10 expert-review findings; round 2: 1 collapse/3
   partials/1 procedural gap + 9 expert-review findings incl. the
   Q-gap-5 overclaim; round 3: 2 collapses/2 partials + 4 expert-review
   findings; round 4: 2 collapses/0 partials + 1 Systemic pattern
   spanning 2 instances; round 5: 2 collapses (one incomplete) + 1
   Systemic pattern spanning 2 instances at 6 locations + 1 Minor; round
   6: 1 collapse + 2 Moderate/2 Minor; round 7: 1 Critical + 1 Moderate
   (expert-review) + 1 collapse + 3 Minor (collapse-hunt); round 8: 1
   Serious + 1 Moderate (expert-review) + 2 collapses (collapse-hunt);
   round 9: 2 Serious (expert-review) + 1 collapse + 2 findings
   (collapse-hunt); round 10: 1 Critical + 1 Moderate (expert-review) + 1
   Serious collapse + 2 findings (collapse-hunt); round 11: 1 Serious
   collapse (found independently by both agents) + 1 Moderate + 1 Minor
   (collapse-hunt). All fixed each time. This is the same
   iterate-to-convergence loop that took the architecture document nine
   rounds — dispatch the next round rather than assuming round 11's
   fixes are the last word, and instruct it to independently re-execute
   round 11's own fix mechanism (the content-token identity verification
   in Step 37's reclaim, under both the same-instant and
   delayed-reclaimer interleavings) rather than trust it, per this
   document's own now-twice-repeated lesson that a fix's own test
   coverage is not independent verification of it.
2. **Once a round comes back clean, proceed to implementation** via
   `.claude/skills/expert-implement/` against the fixed plan.
3. **Two bin-2 items are flagged for Max Cogar's awareness in the plan's
   bin-2 register (section 14.2), not blocking anything:** the
   `web-tree-sitter` dependency-floor pin (`^0.25.10` as of round 10,
   re-verified round 11 across eight grammars — the only version in this
   line confirmed by direct execution to actually load
   `tree-sitter-wasms`'s grammars; a bump beyond `0.25.x` requires
   re-running that execution check first, not merely a semver check) and
   the now-largely-resolved D-plan-6 owner-probe workload (L11(a) already
   measured this session; L11(b) has no probe path and is handled by a
   runtime counter instead). No response is needed unless he wants either
   changed.

## Open items

- Round 12 of independent review has not yet run — see "What to do next"
  item 1. Nothing else from rounds 1–11 remains open: all findings from
  all eleven rounds across both review types, plus Q-gap-5's six judgment
  calls (Clear-Thought-verified, independently reproduced by round 3's
  expert-review), are closed.
- L11(a) — human-marker presence on Max Cogar's real interactive transcript
  was resolved by direct measurement of
  `/root/.claude/projects/-home-user-agent-armory/dc9955b4-2023-5a97-b6a3-47796382cb94.jsonl`
  (11 `origin.kind:"human"` entries, markers present exactly as V12 and AD-9
  assume). The documentation PR updating architecture L11(a) from "assumption
  pending" to "measured" is a Step 43 post-completion task, not a build task.
- L11(b) — whether `UserPromptSubmit` fires for platform-injected turns
  remains empirically unresolvable inside this container (hook install
  blocked by auto-mode classifier). Design-safe against a *persistent*
  wrongful deny per AD-9's voiding guard; not design-safe against a
  *transient* one under V1's async transcript lag — the plan's new
  `deny_from_injected_turn` counter (Step 18) measures that rate on real
  transcripts. Natural resolution of which code path fires at all: the first
  real install of the tool.
