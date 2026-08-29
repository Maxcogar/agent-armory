# Independent collapse-hunt, round 5 — Phase A architecture (2026-08-29)

**Artifact:** `docs/architecture-phase-a.md` at commit `33e0648`; the round-4
repairs read as `git diff ee90c31..33e0648` in full.
**Axis:** mission-fidelity only. Reviewer is not the author. Read in full, in
order, before the attack: `docs/collapse-log.md` (its new 2026-08-29 entry
first, per the charter), `OWNER-LEDGER.md`, `docs/specs/spec-context-oracle.md`,
all eight prior 2026-08-29 reviews, then the revised architecture end to end
plus the round-4 repair diff.
**Charter additions honored:** (1) the round-4 fixes were largely prescribed by
the round-4 reviews themselves — reviewer repair text carries no verification of
its own and was attacked here exactly as author text; (2) for the
thrice-resurrected run-and-failed defect, the terminating repair claims a
per-reader enumeration of `observed_actions` — that enumeration was audited for
completeness by walking every reader the document names anywhere.
**Method:** each round-4 repair's hardest question, answered from the document,
spec, and ledger alone; end-to-end re-traces of everything round 4 touched (the
OL-12 mainline through every layer, the four lexicon corpus cases, the regret
clause, Verification across all command mixes including run-and-failed unknown
runners); between-decisions consistency for every round-4 addition; the
collapse-log's new entry checked claim-by-claim against the review files; and an
owner-fidelity scan of the round-4 text. Findings were not manufactured; the
repairs that survived their hardest questions are recorded by name.

## Verdict: DOES NOT SURVIVE

- **Collapses: 0**
- **Partial collapses: 4** (P1–P4)
- **Survived with note: 5** (N1–N5)

For the first time in the series, no full collapse: no round-4 mechanism is
hollow end to end, the §8 property walk holds unchanged, the split consumer
filter's stated buckets are each individually correct, and the run-and-failed
mainline no longer produces a checkably false whisper at any layer. But four
real defects live inside the round-4 repair text, and three of the four are the
collapse-log's new lesson validated again: P3 is a round-4 prescription
sub-clause silently unapplied, P4 is a round-4 prescription applied verbatim
that pins a fixture assertion the same document's mechanism cannot satisfy, and
P1 is the fourth recurrence of the false-universal-inside-a-lexicon-repair
shape (round-1 S2 → round-3 C1 → round-4 P1/M1 → this). A round with live
defects is not the terminal round; per the convergence discipline the counts
above bar the terminal call, and the trajectory (collapse-class:
5 → 6 → 1 → 1 → 0) continues to converge.

---

## Partial collapses

### P1 — The artifact-object noun lexicon's incompleteness fails in the wrongful-deny direction for build-fulfilled objects, and the repaired rationale's "exactly one member shape" residual claim is false — the fourth recurrence of a false universal inside a lexicon repair

**Where:** AD-9 clause (iv) (the round-4 R4-M1/P1 repair — the noun lexicon and
the flipped default) × the deny-rationale residual sentence ("The residual
wrongful-deny class has exactly one member shape after the round-4 default fix:
an action-request **phrased outside the request frame entirely**") × L1's
rewritten coverage ledger × FR-B5/D-41.

**Collapse question:** *Max asks "can you show me a prototype?" — or "can you
show me a benchmark of the two approaches?" Verb `show` is on the communicative
lexicon; `prototype`/`benchmark` are on neither the artifact-noun lexicon
(demo / test / script / example / branch / file / PR-class) nor anywhere else.
Which kind opens, and what does the block do to the `Write` that builds the
prototype?*

**Why the document's answer fails.** The communicative branch fires ("a
communicative-lexicon verb **without a repo-artifact object** classifies
`kind='info'`"), the row is deny-capable, and the fulfilling `Write` is denied
with "answer Max's question first" — a wrongful deny on the move that provides
the answer, FR-B5's forbidden direction, outside D-41's "clearly not directed
at answering" license. The noun lexicon's entire job is to enumerate
build-fulfilled objects, so its incompleteness — guaranteed for a closed
lexicon over an open noun class (prototype, benchmark, mockup, patch,
migration, fixture, build, reproduction, …) — lands **precisely** on the unsafe
case: an unlisted *text*-fulfilled object ("the diff", "the version number")
degrades to a harmless deny-capability the deny set cannot touch, while an
unlisted *build*-fulfilled object arms a deny against its own fulfilment. The
round-4 default flip fixed this direction for the **verb** lexicons (unlisted
verb → `request`, safe) and did not carry the check to the **noun** lexicon the
same repair introduced — whose miss direction is the opposite (unlisted noun →
`info`, unsafe).

Three sentences in current text are false or inexact because of it:

1. AD-9's residual sentence — "has **exactly one member shape** … an
   action-request phrased outside the request frame entirely" — is a false
   universal: the unlisted-build-noun ask is a second member shape, inside the
   frame, produced by clause (iv) itself.
2. L1's rewritten ledger has **no bucket for it at all**: the under-enforced
   bucket lists only *listed*-noun communicative asks ("can you show me a
   demo?"), the enforced bucket describes only "**object-free**
   communicative-verb request forms," and the wrongful-deny residual names only
   the outside-frame shape — the taxonomy is exhaustive-looking and misses the
   class the mechanism creates.
3. AD-24's round-4 lexicon corpus pins four cases that all sit on axes where
   the lexicons work (`rename` → request; `demo` → request; `error` → info;
   `summarize` → request) — **no case covers an unlisted build noun**, so the
   suite stays green while the residual claim is false: the wrong-check trap,
   again.

Note also that R4-P1's own repair text flagged the noun lexicon as "Optional
narrowing (not required — **it adds a second fallible lexicon**)"; the author
took the option and the fallibility warning was not converted into an owned
error direction anywhere. Harm is bounded exactly like the outside-frame
residual (escapable by one narrating turn, which blanket-clears; auditable on
FR-X6; counted only when corrected — the automated detectors cannot
accumulate before narration clears it), which is why this is partial, not
full.

**Class:** unverified (a false universal inside repair text — fourth recurrence
of the shape) + wrong-check (residual ledger and fixture corpus scoped to miss
the subclass the repair created).

**Concrete repair.** Do not attempt a third lexicon; own the residual the
mechanism actually has. (1) Rewrite the AD-9 residual sentence to enumerate
both member shapes: the outside-frame action-request, and the
communicative-verb ask with a build-fulfilled object the noun lexicon does not
list. (2) Give L1's ledger the missing bucket (wrongfully deny-capable:
communicative verb + unlisted build object — escapable, counted when
corrected, shrunk by tending the noun lexicon exactly as the verb lexicons).
(3) Add "can you show me a prototype?" to AD-24's labeled corpus with its
documented cost (opens `info`; the fulfilling Write is denied once; narration
clears). (4) State the noun-match rule (see N5) so the corpus is decidable.

### P2 — The terminating consumer-filter enumeration is incomplete on its first audit: the regret proxy's re-edit clause is a tenth reader of `observed_actions` with no stated outcome semantics — and the collapse-log's new entry describes the repair as having "listed every reader"

**Where:** AD-4's split CONSUMER FILTER (the round-4 R4-S1/C1 repair) × AD-18's
regret proxy ("for each store-held fact whose subject region was **re-edited or
reverted in the session** … a regret row is recorded", line ~1392) ×
`docs/collapse-log.md` 2026-08-29 entry, lesson 2 ("The terminating repair was
the one that **listed every reader** of `observed_actions` and stated, per
reader, what a failed row *is* to it") × AC-24's no-inflate clause.

**Collapse question:** *The charter's own question: walk every reader of
`observed_actions` the document names anywhere and check each has stated
outcome semantics. The readers are: the edit-set (FR-A2f), the changed-regions
query (FR-A2g), the read-set (AD-16), the Coupling/Reuse triggers, the
run-subtraction, the "no recognized run" survey, the class-3 unknown-command
scan, the FR-L4 covering-test-failed clause, the `deny_bypass_suspect`
diagnostic — and the FR-L4 **re-edit clause**, which at `SessionEnd` decides
"re-edited in the session" from the session's edit record, i.e. from
`observed_actions`. Which bucket is it in, and does a failed `Edit` count as a
re-edit?*

**Why the document's answer fails.** It is in no bucket. The filter's three
bullets name the change/read consumers ('ok' only), the run-state consumers
(either outcome), and — for 'failed' rows — "the FR-L4
**covering-test-failed** clause and diagnostics." The same proxy's *re-edit*
clause is a distinct consumer of the edit rows and appears in none of the
three, so its outcome semantics are an inline implementer decision — the exact
thing Gate A attests was eliminated. The natural wrong reading (all rows)
counts a **failed** Edit — churn that never happened — as a re-edit of a held
fact's region, recording regret for a region that was never touched: inflation
in a direction AC-24's fixture cannot see (its "does not inflate" case is
*unrelated real* churn, not *un-happened* churn). The harm is bounded — regret
is a diagnostic that gates nothing, and the correct semantics ('ok'-only for
re-edit, 'failed' for the covering-test clause, as the filter's own logic
implies) is one comment line — but the completeness of this enumeration is the
repair's whole justification per the collapse-log's own lesson ("when the same
defect returns a third time … enumerate every consumer/producer of the touched
primitive by name"), and the enumeration fails that bar on its first audit.
The collapse-log entry's sentence "listed every reader" is thereby inexact as
a description of the current text (the *lesson* it draws stands unchanged).

**Class:** wrong-check (an enumeration whose completeness is the deliverable,
audited only against the buckets round 4 named) — the round-2 P3 shape (an
inventory incomplete on first audit) inside the terminating repair.

**Concrete repair.** Add the tenth reader to the filter with its semantics:
the FR-L4 **re-edit** clause consumes `outcome='ok'` edit rows only (a failed
Edit is not a re-edit), while the covering-test-failed clause consumes
'failed' command rows as now. Add a failed-Edit-in-held-region case to AC-24's
no-inflate fixture. The collapse-log entry needs no rewrite — reviews are
written once — but the next STATUS/collapse-log touch should note the
enumeration was completed to ten readers in round 5, so the "every reader"
description becomes true.

### P3 — The `whisper_stats` watermark is one global timestamp over per-project stores: a fold in one project advances it past every other project's unfolded rows, silently losing them — the per-project scoping R4-m2 prescribed "in the same breath" was not applied

**Where:** AD-5 (the round-4 R4-m2/P3 repair: `global_meta.whisper_stats_watermark`
— one key; the fold "run at exactly two points: the `correct` verb … and the
SessionEnd flush") × R4-m2's fix text ("Worth stating the watermark's
**per-project scoping** in the same breath (corrections live in project
stores; the fold writes the global store)") × OL-6 (the owner works "solo
**across his own repositories**" — multi-project use is the ledger-confirmed
usage, not an edge) × AC-23's post-session pin.

**Collapse question:** *Max works in project X on Monday (whispers fire;
he corrects one post-session — the fold runs at `correct`, advances
`whisper_stats_watermark` to Monday night) and in project Y on Tuesday, whose
container died before `SessionEnd` ever fired. Wednesday he runs `correct` in
X again. Which fold ever aggregates Y's Monday-and-Tuesday `whisper_audit`
rows and corrections into the efficacy table?*

**Why the document's answer fails.** None. Both run points execute in a
project context (`correct` targets an id in *that* project's store; the
SessionEnd flush belongs to *that* session's project), so each fold reads one
project's rows — yet advances the single shared watermark. Every other
project's rows older than the new watermark are then permanently invisible to
"newer than `whisper_stats_watermark`": the efficacy table (`sent`,
`corrected_*` — Phase C's demotion/promotion input, FR-L7's global routing,
FR-M4's per-genre rates) systematically under-counts in exactly the
multi-repository usage OL-6 confirms. The alternative reading — the fold's
"the project stores'" (plural) means every fold opens **all** stores under
`~/.ctxoracle/projects/` — is stated nowhere, contradicts the run points'
project-scoped nature, and would put an unbounded multi-store scan behind the
`correct` verb without a word about it. This is R3-M2's defect class
(corrections not reaching the efficacy table) reintroduced one axis over
(project scope instead of timing) by the repair for its timing variant — and
the round-4 review *named the missing clause* and the apply-all-findings pass
dropped it: an unapplied prescription sub-clause, the R3-m3/R3-m4 class.
Bounded below full collapse because the raw rows persist in the project stores
(nothing is deleted; a corrected fold can rebuild `whisper_stats` wholesale),
and the mechanism is diagnostic/learning input, not agent-facing.

**Class:** wrong-check (the fold verified on the timing axis the round-3
finding named, never on the scope axis) + unapplied review sub-clause.

**Concrete repair.** Make the watermark per-project: `global_meta` keys
`whisper_stats_watermark:<project_key>` (the fold at `correct`/SessionEnd
reads exactly the project store it is already in, folds rows newer than *its
project's* watermark, advances only that key — the single-writer transaction
discipline the round-4 review verified carries over per key). State in AD-5
which store each run point reads. Extend AC-23's fixture with a two-project
case: correct in X, then fold in Y — Y's older rows still reach
`whisper_stats`.

### P4 — The mixed-language AC-1b fixture asserts "no false dominance crown" against a mechanism that must crown falsely: a generic-frontend symbol's `symbol_refs` count is structurally zero, so any covered rival dominates it at every k — a round-4 prescription applied verbatim that no mechanism in the document can satisfy

**Where:** AD-24's AC-1b pin (the round-4 R4-m5 repair: "a **mixed-language
case** where a generic-frontend symbol is the true convention, asserting no
false dominance crown for a tree-sitter-covered rival — the L6 skew measured,
not assumed") × AD-12 (`symbol_refs` = "the count of *other* files whose text
references its identifier **among the files that import its file**"; the
generic frontend produces no `import_edges`) × AD-15's Reuse dominance rule
("X is *canonical* when its count dominates the runner-up (≥ k×)") × L6.

**Collapse question:** *In that fixture, the true convention S is a
generic-frontend symbol: its language has no `import_edges`, so "files that
import S's file" is the empty set and `symbol_refs(S) = 0` by construction.
The covered rival R has count M ≥ 1. Dominance requires M ≥ k × runner-up =
k × 0, which holds for every M and every k. By what mechanism, anywhere in
this document, does the generator decline to crown R?*

**Why the document's answer fails.** There is none. AD-15's own row states the
skew as a fact ("generic-frontend languages have no `import_edges`, so
dominance **systematically favors** grammar-covered candidates — L6") — i.e.
the design *knows* R gets crowned in exactly this fixture — while the fixture
added this round asserts the crown does not happen. A faithful build fails the
fixture; the only ways to green it are to invent an unstated suppression rule
inline (the Gate-A violation) or to weaken the fixture (the wrong-check trap
AD-24's own AC-19 note warns against). The internal tension is even
word-level: "the L6 skew **measured**, not assumed" and "asserting **no**
false dominance crown" cannot both describe one fixture — measuring the skew
means observing the crown. This entered as R4-m5's option-1 prescription,
applied verbatim; the prescription contradicted AD-15/L6 as written and
carried review authority past the check — the collapse-log's new lesson, third
instance this round.

**Class:** unverified (prescription-carried: a fixture assertion with no
producing mechanism) + between-decisions (AD-24 repaired against an unrepaired
AD-15 dominance rule).

**Concrete repair.** Make the assertion true before pinning it: add the
comparability rule to AD-15's Reuse row — a dominance crown is computable only
over candidates whose reference counts are *measurable*, so when the FTS
candidate set contains any symbol from a generic-frontend language, the
dominance comparison is **not made** (silence — P5-faithful: no reliable
convention fact exists) or is made only among covered candidates **with the
exclusion named in the whisper's evidence** ("N further candidates in
uncounted languages were excluded"). Pick one (silence is the FR-D1-safer
lean: a crown over an invisible rival is a claim the evidence cannot back);
then the fixture pins that behavior, and L6's "measured against AC-1b's
fixture" becomes true. If instead the crown-with-caveat branch is chosen, the
fixture's assertion must be rewritten to match (crown appears; evidence names
the exclusion) — either way, fixture and mechanism must name the same
behavior.

---

## Survived with note

- **N1 — The D-27/FR-A2m routing of the run-and-failed done-claim is
  textually supported, with two honest notes.** Read verbatim: D-27 —
  "Verification catches 'claimed-done-but-test-not-run'; the general
  'unfinished' case routes to Phase B (a coverage limit on OL-12)"; FR-A2g's
  limit — "catches *unverified* (a covering test exists and was not run)";
  FR-A2m — "did not finish the work, **beyond the unrun-test case FR-A2g
  catches** … Model-dependent — Phase B." A run-and-failed covering test is
  not the not-run case, so it falls to "beyond the unrun-test case" = FR-A2m =
  Phase B: the citation resolves and supports the routing, and FR-A2g's own
  spec-fixed observation ("has not been run against this change") would be
  false if fired there — Phase A silence is the only FR-D1-clean Phase A
  behavior, and implementing an FR-A2m subcase early would breach the phase
  boundary the lifecycle enforces. Two notes, neither a defect the
  architecture may fix alone: (a) FR-A2m's Phase-B deferral ground is
  **model-dependence**, and this subcase is deterministically detectable (the
  `PostToolUseFailure` row plus `test_map` is the whole detection) — a
  spec-level tension between D-27's ground and its coverage, which belongs in
  the spec's court (a §13 note candidate at next spec touch), not resolved
  here; the architecture correctly does not resolve it. (b) The designed
  Phase A silence in the OL-12 mainline is itself counted by the design's own
  FR-L4 regret proxy (held fact, covering test failed, oracle silent — a
  regret row by AD-18's stated rule): that is §11.5 working as intended
  (Phase A exits by measuring "how little the conservative recognizer catches
  before Phase B"), but no `status` label says the Phase A regret rate carries
  this *expected-by-design* floor — one sentence in the regret label keeps Max
  from reading designed deferral as malfunction.
- **N2 — Per-segment classification splits on operators without a quoting
  rule, so quoted data can be classified as commands.** "Split on `&&`, `;`,
  `|`, `||`" applied textually to `echo "done && npm test next"` yields a
  segment whose head matches the runner lexicon → the echo is classified as a
  test run → subtraction ("unmappable target ⇒ subtract all") → a true "not
  run"/weak claim is suppressed at the done-claim: false **silence** (never a
  false assertion — the failure direction is the design's accepted safe one,
  which is why this is a note). A quoted file-writing fragment can likewise
  false-fire `deny_bypass_suspect` (diagnostic noise). The charter's probes
  come out safe under either reading: `bash -c "npm test"` → the wrapper rule
  (or the non-allowlisted `bash` head) → class 3 → the weaker claim, honest;
  `npm run test:ci` → not innocuous, runner-lexicon match or not → subtraction
  or class 3, no lie either way. Repair (one sentence in AD-15): segments are
  derived from a shell-quoting-aware tokenization, a quoted string is never a
  segment boundary or a segment head, and tokenization failure classifies the
  command class 3 wholesale — the same lean as the `sh -c` wrapper rule.
- **N3 — AD-5's fold-at-SessionEnd violates AD-5's own sync rule.** The same
  sentence that fixes the fold's run points states: "if a handler-event
  placement is ever chosen instead, it must be added to AD-23's inventory and
  AD-6's row for that event." SessionEnd **is** a handler event (AD-6 row,
  shared 1.5 s budget, V6), and its row still reads only "flush/finalize
  session diagnostics row" — the fold (a global-store open plus a cross-store
  aggregation) appears in neither AD-6's row nor AD-23's inventory. Not
  deny-capable, small work, but the repair carrying its own sync rule and
  breaking it for one of its two named points is the m-R4/R3-m1/R4-P3 desync
  class recurring *inside the sentence that states the rule*. Two one-line
  edits (AD-6 SessionEnd row; AD-23's SessionStart/SessionEnd items list).
- **N4 — "Shrunk by tending the config-extensible lexicon" names a remedy no
  surface performs.** L1 and clause (iv) lean on lexicon-tending as the
  shrink mechanism for the under-enforcement losses, and `--missed-question`
  is the guard that *records* them — but no verb extends a lexicon:
  `tune <key> <value>` writes scalar tuning rows (AD-20), the lexicons'
  config home is never named, and the owner is a non-programmer (OL-11) for
  whom "tend the lexicon" is not an operation. The natural closure is cheap:
  when `--missed-question` records a request-kind miss whose cause is an
  unlisted verb/noun, the CLI's plain-language output should say which word
  was unrecognized and offer the addition (`ctxoracle tune
  lexicon.communicative +summarize` or a dedicated `lexicon` verb) — making
  the tending loop real for the person the guard exists for. Until then,
  "shrunk by tending" is aspiration, not mechanism; one sentence naming the
  config home and writer closes it.
- **N5 — The noun-lexicon match unit is unspecified, and the two readings
  split on round-4's own example.** "A communicative verb **with** a
  repo-artifact object noun" — matched how? A direct-object parse is not a
  Phase A deterministic capability; token-presence anywhere in the sentence is
  decidable but coarse. R4-P1's own second motivating case — "could you
  confirm the fix works **by adding a regression test**?" — classifies
  `request` under token-presence (`test` appears) and `info` under
  direct-object reading ("the fix"), i.e. the round-4 finding's example is
  fixed under one reading and not the other. State the rule (token-presence
  over the interrogative sentence is the honest deterministic choice; its
  over-matching direction — "show me the error **in the test file**" →
  `request`, under-enforced — is the safe direction and belongs in L1's
  under-enforced bucket), and add the case to the labeled corpus.

---

## End-to-end re-traces (everything round 4 touched)

- **The OL-12 mainline (edit → test fails → done-claim), every layer.**
  `PreToolUse` Edit → Consequence/Warning fire pre-edit (coupled tests named —
  the right moment). Edit ok → `PostToolUse` ok row. `npm test` fails →
  `PostToolUseFailure` → row appended **unconditionally** (`outcome='failed'`,
  `command_class`=runner; AD-4 and AD-6 now agree — the N1/R4-m1 sweep is
  applied). Done-claim `Stop` → Verification: changed regions from ok rows →
  covering tests → minus runs **of either outcome** → the failed run
  subtracts → **neither "not run" nor "no recognized run" is emitted**: the
  thrice-resurrected rumor is dead at every layer, and AD-6's justification
  sentence is true again as written. Completeness/AC-8a unaffected. At
  `SessionEnd` the regret proxy records the held-fact/failed-test silence
  (N1(b)) — the Phase A gap measured, as §11.5 intends. Fixture: the
  run-and-failed case is pinned in AD-24 ("yields neither … nor …"). **The
  mainline holds.** Residuals: the re-edit clause's unstated filter (P2), the
  regret-label sentence (N1(b)).
- **The four lexicon corpus cases, plus the charter's probes.** "can you
  rename the helper?" → neither lexicon → `request`; the rename-edit runs
  free ✓ (the flipped default's primary aim is real, fixture-pinned). "can
  you show me a demo?" → communicative + listed noun → `request`; the
  demo-edit runs free ✓. "can you show me the error?" → communicative,
  no artifact noun → `info`, deny-capable; fulfilment is text after reads —
  deny-capability harmless ✓. "could you summarize the error?" → unlisted
  communicative verb → `request` — the documented, ledgered loss ✓. Charter
  probes: "can you show me the **diff**?" → `diff` unlisted → `info`;
  fulfilment is `git diff` (Bash, never denied) + text — safe ✓. "could you
  confirm the **version number**?" → `info`; read + text — safe ✓. The
  failing probe is the unlisted **build** noun: "can you show me a
  prototype?" → `info` → the fulfilling Write is denied — P1.
- **Regret clause through its producer and consumers.** Covering-test-failed:
  `PostToolUseFailure` → 'failed' row → FR-L4 clause (a named 'failed'
  consumer) → regret row → `status` under its label ✓ live. Re-edit clause:
  reads the session's edit rows with **no stated outcome filter** — P2.
  AC-24: failure clause has a real producer ✓; no-inflate case covers
  unrelated real churn only ✓ (failed-Edit inflation unpinned — P2's fixture
  repair).
- **Verification, all command mixes.** Innocuous-only session → strong "not
  run" fires ✓. `make check` present → class 3 → weaker claim, mapping still
  headlined ✓. Recognized run-and-passed → subtracts ✓. Recognized
  **run-and-failed** → subtracts, nothing false emitted ✓ (the round-4 fix,
  fixture-pinned). Unknown runner **run-and-failed** (`make check` exits 1) →
  `PostToolUseFailure` row, class 3 **of either outcome** per the filter's
  run-state bucket → run-state unknown → weaker claim — "no *recognized* test
  run touched T" is true ✓ (the round-4 secondary-leak fix holds). Compound
  `cd pkg && npm test` → per-segment → runner segment wins → subtracts ✓;
  `cd pkg && make check` → class 3 → weaker claim ✓ (both fixture-pinned).
  Quoted-operator text → N2. Class 3 as default complement → every unlisted
  everyday command demotes to the weaker claim — the accepted, disclosed
  design (settled rounds 3–4; nothing new found).
- **§8 property walk on the round-4 diff.** The diff touches classification,
  fixtures, and store comments only — never the deny producer: AD-10's
  single-caller confinement, reactive-only (open `kind='info'` question + a
  deviating action), text-never-denied, self-clearing/no-counter, lag clause
  clear-axis-only, per-consumer scope, and the re-ask/re-open flows all hold
  unchanged (re-walked; the flipped default *shrinks* the deny-capable set,
  which cannot create a new deny path).

## Between-decisions consistency of every round-4 addition

Split consumer filter — AD-4 ✓ / AD-6 ✓ / AD-15 Verification row ✓ / AD-16
read-set ✓ / AC-24 run-and-failed + failed-Edit fixtures ✓ / FR-L4 re-edit
clause ✗ (P2). D-27/FR-A2m routing — AD-4 ✓ / AD-15 ✓ / spec D-27, FR-A2g,
FR-A2m read verbatim ✓ (N1). Noun lexicon + flipped default — AD-9 ✓ / AD-24
corpus ✓ / AD-18 inheritance ✓ / L1 ✗ and residual sentence ✗ (P1) / match
unit unstated (N5). Per-segment classification — AD-15 ✓ / AD-24 compound
fixtures ✓ / quoting rule ✗ (N2). Watermark — `global_meta` home ✓ / audit +
corrections fold ✓ ('sent' writer restored) / two run points ✓ / AC-23
post-session pin ✓ / per-project scope ✗ (P3) / AD-6 SessionEnd row and AD-23
inventory ✗ (N3). `session_log.detail_json` — schema ✓ / AD-9
whisper-independent rendering ✓ / `log` default-session ✓. AD-6
unconditional-'failed' sweep ✓ (R4-m1 closed). Marker-carrying qualifier on
AD-9's bound ✓ (R4-m4 closed). "Counted when corrected" in T2/L11 ✓ — checked
for exactness: the automated *wrongful-deny-rate* detectors
(`deny_after_answer_lag`, `deny_despite_answer_text`) indeed cannot
accumulate before narration blanket-clears a synthetic row, and `deny_loop`
is not folded into that rate, so the sentence is exact. Third
`--missed-question` collision limit ✓ (R4-N4 closed). AC-1b mixed-language
fixture ✗ (P4). Status §"Review round 4" — verdict counts match both round-4
files ✓; the applied-fix enumeration was located item by item in the diff ✓;
convergence correctly not claimed ✓. `tools/check_docs.py` passes on the
current tree (run this session).

**The collapse-log's new 2026-08-29 entry, checked as current authority.**
"Four dual-review rounds … collapse trajectory 5 → 6 → 1 → 1" ✓ matches the
four hunt verdicts. Lesson 1's claims — both round-4 top findings entered as
verbatim round-3 prescriptions; the consumer-filter prescription flattened two
opposite semantics; the communicative-verb prescription shipped "the requested
act is text" — each verified against the round-3 repair texts and the round-4
findings ✓. Lesson 2's three deaths — no producer (round-1 P4); producer wired
to an event that cannot carry it (round-2 S-R3); rows filtered back out
(round-4 S1/C1) — ✓ accurate, "each passing a fixture pinned to the adjacent
axis" ✓. The one inexact clause is "the terminating repair … **listed every
reader** of `observed_actions`": the current filter lists nine of ten (P2).
The entry's lessons stand; the description of the repair overstates it by one
reader.

## Owner-fidelity scan of the round-4 text

Every owner/spec key the round-4 diff added or moved was re-read against its
row at its point of use. "The safe, `FR-B5`-faithful direction" (the default
flip) — FR-B5's answer-drift bullet ("errs toward not denying") supports it ✓.
"Per D-27" — resolves and structurally supports (N1's notes are about the
row's *ground*, not its content; no misattribution). L1's retained "the
owner's stated intent for the block, `OL-C3`" ✓; "the move `OL-C5` protects" ✓
(unchanged uses, still supported). No new `OL-*` key introduced; no owner
superlative manufactured; the Status paragraph's review citations match the
cited files' verdict lines ✓. **No rejected item reintroduced:** clause (iv)
remains a positive classification (OL-R5's directive — and the flipped
default moves lexicon-incompleteness *toward* the tracked side for the verb
lexicons; P1's noun-lexicon direction is a design-accuracy defect, not a
negative-space definition); the deny still requires an open `kind='info'`
question plus a deviating action through the single confined producer (no
pre-emptive gate); no generated-file consumption on any deny input.
**Arbitrary-limit scan (OL-C1):** round 4 introduced no operating number —
the noun lexicon and the segment-split rule are classification vocabulary
gating what is *asserted or denied-capable*, never how much is spoken; the
watermark is a timestamp; no volume/count/budget cap anywhere in the diff.
Clean.

## Round-4 repairs that survived their hardest question without a finding

The consumer filter's nine stated buckets (each reader's semantics checked
individually — the change/read 'ok'-only rule, the run-state either-outcome
rule, and the 'failed'-additionally rule are each correct for every reader
they name; the defect is the tenth reader, not any stated bucket). The
run-and-failed subtraction itself (attacked for a false-silence cost: the
subtraction never asserts anything false, and the deferred speak-duty is
spec-routed — N1). The flipped request-frame default's primary aim (unlisted
doing verbs are never wrongfully denied — "can you rename the helper?"
fixture-pinned; the communicative branch's polite-info and escalation re-ask
enforcement survives from round 3 intact). Class 3 as the default complement
(the classifier is total; the unsafe default-innocuous reading is gone). The
per-segment rule's primary aim (`cd pkg && npm test` can no longer masquerade
as innocuous — fixture-pinned both ways). `session_log.detail_json` with
whisper-independent `log` rendering (the recourse is one command, with no
audit-row dependency — attacked for a multiple-done-claims case and for the
no-whisper case; both hold). The AD-6 unconditional-'failed' sweep. The
marker-carrying qualifier. The "counted when corrected" precision (checked
for exactness against all three detectors). The third collision limit. The
Status section's round-4 paragraph (accurate against both review files).

---

*End of round-5 hunt. Zero full collapses — the first round in the series —
but four partial collapses, all inside or one decision away from round-4
repair text: one false universal in the fourth lexicon repair (P1), one
incomplete terminating enumeration (P2), one unapplied prescription sub-clause
with a real cross-project data loss (P3), and one prescription-carried fixture
assertion no mechanism can satisfy (P4). The collapse-log's new
prescription-text lesson is validated three more times (P3, P4, and P1's
combined-prescriptions genesis). This is not the terminal round; per the
convergence discipline the round-6 pair attacks these fixes, and the P2/P4
class suggests its charter carry one standing question: for every fixture
assertion added by a repair, name the mechanism sentence that produces the
asserted behavior before pinning it.*
