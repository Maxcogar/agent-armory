# Independent collapse-hunt, round 3 — Phase A architecture (2026-08-29)

**Artifact:** `docs/architecture-phase-a.md` at commit `5c9ca7f`; the round-2
repairs read as `git diff b54ba29..5c9ca7f` in full.
**Axis:** mission-fidelity only. Reviewer is not the author. Read in full, in
order, before the attack: `docs/collapse-log.md`, `OWNER-LEDGER.md`,
`docs/specs/spec-context-oracle.md`, all four prior 2026-08-29 reviews, then
the revised architecture end to end plus the round-2 repair diff.
**Method:** per the collapse-log's standing lessons, this round attacked **the
round-2 repairs as the new collapse surface** — each repair's hardest question,
answered from the document and spec alone — then re-traced everything the
repairs touched end to end (the answer-drift block through spec §8's full
property walk, Reuse, Verification, the regret failure clause through its new
producer), hunted the between-decisions gaps the repairs may have opened
(schema ↔ mechanism ↔ fixture ↔ matrix ↔ Limitations for every new
column/index/fault/verb), and re-read every owner citation the repairs added
against its ledger row. Findings were not manufactured to fill a quota;
several repairs survived their hardest question and are recorded as such.

## Verdict: DOES NOT SURVIVE

- **Collapses: 1** (C1)
- **Partial collapses: 4** (P1–P4)
- **Survived with note: 6** (N1–N6)

The trajectory is converging (round 1: 5 collapses; round 2: 6; this round: 1),
and most of the round-2 repairs are genuinely sound: the open-scoped dedup
index survived every attack this hunt could mount (re-ask while open, rebuild
double-open, parallel handlers, voiding interplay); the
classifier-at-every-opener invariant enumerates its openers and each one
really does classify; the `PostToolUseFailure` wiring emits on no channel and
brushes no spec absolute; the deferral-excluding detector traces cleanly
through AC-9's induction; the voiding guard's mechanism is right. The one
collapse and the four partials are all of the shape the collapse-log predicts
for a round-3: **a repair's load-bearing rationale sentence that is false for
a subclass the mission cares most about** (C1), and **repairs whose product is
consumed by a surface nobody re-specified** (P1–P4 — the between-decisions
gap, four more times).

---

## Collapse

### C1 — The request-pattern classifier captures communicative-verb interrogatives, for which the kind-split's protective rationale is false — deny-capability is lost for the dominant polite phrasing of information questions, and for the OL-C3 escalation re-ask itself

**Where:** AD-9 intake clause (iv) (the round-2 C1 repair — the
`kind='info'/'request'` split) × the deny-eligibility invariant × OL-C5/OL-C3 ×
L1.

**Collapse question:** *Max asks "could you tell me why the login test
fails?" — or, after an earlier info question was blanket-cleared unanswered,
re-asks in the natural escalation form "can you please answer my question?"
Both match clause (iv)'s request pattern verbatim ("can/could/will/would/
please … you …" + an action verb: "tell", "answer"). Both are classified
`kind='request'` — tracked, never deny-capable. The agent's next move is
unrelated other work. What does the block do, and what does the design's own
rationale say should have happened?*

**Why the document's answer fails.** The block does nothing — no deny-capable
row exists. The design's rationale for that outcome is the universally
quantified sentence: *"For a request, the requested action **is** the answer
path, so denying on it would deny exactly the move `OL-C5` protects."* That
sentence is **false for the entire communicative-verb subclass**: when the
requested action is *telling, explaining, answering* — a **text** act — the
deny-eligible set (`Write`/`Edit`/`NotebookEdit`) could never deny it, because
a text turn is never a tool action (the design's own load-bearing guarantee,
FR-B2). For "can you tell me why X fails?" there is no move OL-C5 protects
that the deny could touch; classifying it `request` buys zero protection and
costs the whole Phase A enforcement for that phrasing. Three aggravations:

1. **The subclass is the dominant phrasing of information questions.** The
   round-2 repair's own justification for tracking requests is that
   request-form is "the **dominant** phrasing of Max's asks." Polite
   interrogative framing ("can/could you tell/explain/confirm…?") is the
   dominant phrasing of *info* questions in exactly the same distribution — so
   the kind split quietly re-scopes OL-C5's Phase A reach from "questions" to
   "questions phrased as bare interrogatives," a phrasing axis with no owner
   or spec grounding. D-41 licenses low *coverage* (err toward not opening
   where classification is genuinely uncertain); it does not license
   misclassifying a determinate class under a rationale that affirmatively
   does not apply to it. This is round-1 S2's failure shape — a load-bearing
   "by the rule" claim whose rule doesn't establish what the sentence says —
   recreated inside the repair for round-1 S2's repair.
2. **The cost lands on OL-C3's own named moment.** OL-C3: *"block that
   motherfucker until it stops ignoring me and actually answers."* The
   escalation re-ask is the moment that sentence describes, and its natural
   polite form ("can you please answer my question?", "could you actually
   answer what I asked?") is classified `request` → never deny-capable. Since
   the original info row was typically already blanket-cleared by the
   drifting agent's narration (the steady-state clear lean), the re-ask is
   the **only** chance to re-arm the block — and clause (iv) disarms it. The
   round-2 C5 repair (open-scoped dedup index) was built so "the verbatim
   re-ask always works"; it works only for re-asks phrased as bare
   interrogatives. ("Why haven't you answered my question?" re-arms; "can you
   please answer my question?" does not — an enforcement boundary that runs
   through the middle of one speaker's synonymous sentences.)
3. **`--missed-question` inherits the hole at its most likely use.** The
   round-2 C2 repair routes the correction through the same classifier, so
   Max reporting the dropped ask "can you tell me whether the tests pass?"
   gets a `kind='request'` row — the human channel recording a miss it then
   declines to enforce, for a question whose enforcement would deny nothing
   protected (the answer is text).

**Class:** unverified (a false universally-quantified rationale inside a
repair) + reduction (owner-confirmed enforcement reach narrowed along an
ungrounded phrasing axis), between-decisions (clause (iv) repaired against
FR-B2's text-is-never-denied guarantee without checking the interaction).

**Concrete repair.** Split the request pattern on what the *requested action*
is: a request-form interrogative whose action verb is **communicative**
(answer / tell / explain / describe / show / list / clarify / confirm — a
small closed lexicon, deterministic, unit-tested against the labeled corpus)
is an information question in request clothing and classifies `kind='info'`
(deny-capable: the requested act is text, which the deny-eligible set cannot
touch, so the protective rationale is undamaged); only a request whose action
verb is a *doing* verb (fix / add / implement / refactor / update…) classifies
`kind='request'`. Rewrite the rationale sentence to quantify over the class it
is true for ("for a request **to act on the repo**, the requested action is
the answer path…"). Add both phrasings to AD-24's fixtures: "could you tell me
why X fails?" opens `info` and a deviating `Edit` is denied; "can you please
answer my question?" after a blanket-cleared info row re-arms the block. L1's
residual class shrinks accordingly and should be restated.

---

## Partial collapses

### P1 — `observed_actions.outcome` gained a failure producer, but no consumer states its outcome filter: failed Edits and failed commands now flow into the same table that feeds the edit-set, the read-set, Completeness, and Verification

**Where:** AD-6 `PostToolUseFailure` row + AD-4 `outcome` comment (the round-2
C6/S-R3 repair) × AD-15 (Completeness: "session's edited files
(`observed_actions`)"; Verification: "changed regions … minus test runs
observed in `observed_actions`") × AD-16 (read set "from `observed_actions`").

**Collapse question:** *V19 says a failing executing tool fires
`PostToolUseFailure` — Edits included (only pre-execution rejections are
excluded). An `Edit` fails (old_string not found); the wiring appends an
`observed_actions` row. Completeness computes "session's edited files" from
that table and Verification computes "changed regions" from it. Does the
failed Edit count as an edit?*

**Why it fails.** Nothing says. The round-2 repair specified the *producer*
(append with `outcome='failed'`) and never re-specified a single *consumer*:
AD-15's Completeness and Verification queries carry no outcome predicate, so a
literal build counts a failed Edit as a change — yielding "you changed X but
not Y" where X was never changed (a checkably false Completeness whisper) and
covering-test claims for a region never touched (the FR-D1 rumor from the
done-claim genre, the exact output the round-2 Verification lean was built to
prevent). The read set has the same ambiguity one step removed: AD-16 derives
it "from `observed_actions`", and a failure-row leak there makes dedup
withhold facts about files the agent never successfully read (silent
under-fire). The repair fixed the named axis (failure outcomes producible) and
opened the adjacent one (which computations must exclude them) — the round-2
verdict's own dominant shape, one more time.

**Class:** between-decisions / decision-hiding (a schema column with
consumers whose filter is unstated).

**Concrete repair.** One rule in AD-4 or AD-15: rows with `outcome='failed'`
are consumed **only** by the FR-L4 covering-test-failed clause and
diagnostics (`deny_bypass_suspect` included); the edit-set, read-set,
Completeness, Verification-subtraction, and Coupling/Reuse trigger queries
consume `outcome='ok'` (or NULL-legacy) rows only. Add a failed-Edit case to
AC-24's fixture asserting no Completeness/Verification whisper counts it.

### P2 — T2's conclusion still claims the voiding guard bounds intake exposure "to the lag window" / "at most one catch-up" — unconditioned, while L11's marker-absent carve-out names a class the guard structurally cannot void

**Where:** Threat model T2 (*"an injected question survives at most one
catch-up — bounded exposure, not structural exposure"*; *"the unverified
intake path, whose exposure the voiding guard bounds to the lag window"*) ×
AD-9's carve-out (*"a marker-absent matching turn does not void the row"*) ×
L11 (*"a marker-absent synthetic turn class would evade the voiding guard"*).

**Collapse question:** *A platform-injected turn fires `UserPromptSubmit`
(the L11(b) unknown) and lands in the transcript with no markers — the shape
V12's own probe transcript proves exists for genuine turns. Reconciliation
matches the intake row to a marker-absent turn. Is the row voided within one
catch-up, as T2's conclusion asserts?*

**Why it fails.** No — the carve-out (correctly) refuses to void on marker
absence, so the row stays open until the blanket clear happens to close it:
the exposure is bounded by the *clear lean's accidents*, not by the guard, and
T2's "at most one catch-up" is false for exactly the synthetic class the
document's own V12 evidence makes most plausible. L11 discloses this honestly;
T2's *Experiment* and *Conclusion* sentences were not synced to the
disclosure and still state the pre-carve-out bound. This is the round-2 C2/
S-R4 shape at smaller scale — a security-conclusion absolute falsified by the
same document one section over — and the survival class (a corrected claim's
stale copy) is this project's most-recorded failure.

**Class:** unverified/overclaim (threat-model conclusion not conditioned on
the carve-out), survival.

**Concrete repair.** Two sentence edits in T2: "…an injected **marker-carrying**
question survives at most one catch-up; a marker-**absent** synthetic class is
not voidable (L11) — its rows are escapable, closed only by the ordinary clear
lean, and counted on the wrongful-deny side," and drop "bounds to the lag
window" in the conclusion in favor of "bounds the marker-carrying class to one
catch-up; the marker-absent residual is L11's, named not hidden."

### P3 — Verification's unknown-run-state lean rests on a predicate ("any command the lexicon could not classify") that is undefined over ordinary innocuous commands, and resolves the consequence with an implementer-facing disjunction — under the natural reading the strong "not run" clause is permanently dead and the fixture never notices

**Where:** AD-15 Verification row (the round-2 P2 repair) × AD-24's AC-8
fixture × Gate A's "no inline architectural calls" attestation.

**Collapse question:** *A normal session runs `ls`, `cd`, `git status`, and a
`grep` that exits 1. The runner lexicon enumerates test runners. Did the
session execute "any command the lexicon could not classify at all"? If yes —
the design's own text says the condition is "guaranteed under C-6's breadth" —
then run-state is permanently `unknown` in every real session: which branch of
"the genre stays silent **or** composes only the weaker honest claim" ships?*

**Why it fails.** The predicate has no floor: the lexicon is specified to
recognize test runners (plus `deny_bypass_suspect`'s file-writing class), so
*every other command* — the everyday majority — is literally "a command the
lexicon could not classify," and the design itself concedes the condition is
guaranteed. Under the "stays silent" branch the Verification genre dies in
every real session; under the weaker-claim branch the spec'd observation
("has not been run against this change", FR-A2g) is permanently replaced by
"no recognized test run touched T" — either way the strong clause is dead
code in production while AC-8's fixture, built from recognized commands only,
stays green: the wrong-check trap. And the "or" itself is an inline
architectural decision on exactly the axis where one branch kills a mandated
genre — the thing Gate A attests was eliminated. (The lean's *direction* is
right and spec-faithful; the defect is the undefined predicate domain plus
the unresolved disjunction.)

**Class:** reduction-by-repair (an honest-limits lean whose trigger predicate
silences the genre in the common case) + wrong-check (fixture passes while
the property dies) + decision-hiding (the disjunction).

**Concrete repair.** Make the command classifier explicitly **ternary**, all
three classes config-enumerated like the runner lexicon: (1) recognized test
runner → mapped subtraction; (2) recognized-innocuous (a conservative
allowlist of command heads that cannot run tests: `ls`, `cd`, `cat`,
`git status`-class, `grep`/`rg`, …) → no effect on run-state; (3) genuinely
unknown (anything script-, make-, or package-runner-shaped outside both
lists) → run-state unknown. Pick the branch: compose the weaker honest claim
(it satisfies AC-8's content assertion — the mapping still headlines — and
keeps the genre alive); state it. Add to AC-8's fixture a session containing
innocuous commands, asserting the strong "not run" clause still fires, and
one containing `make check`, asserting the weak form.

### P4 — The FR-M4 counter's majority class is counted but not readable: no owner surface names the question for a blanket-cleared counted done-claim, so "Max re-asks" remains session archaeology, and AD-9's "keeps the recourse counter alive" oversells what tracking delivers

**Where:** AD-9 Stop-time backstop paragraph (the round-2 C1/N1 repair) ×
AD-17 `status` / FR-M5 `log` × spec FR-B4/FR-M4 ("he cannot re-ask what he
does not know was dropped").

**Collapse question:** *`status` shows done-claims-with-outstanding-question
= 3, labelled with both error directions. Two of the three were counted via
the `generic_text_all_prior`-within-K clause — no row was `open` at the Stop,
so no AC-8a line fired and no `whisper_audit` row names any question. Max
wants to exercise the recourse. Name the surface that tells him **which
questions** to re-ask.*

**Why it fails.** None exists. `log` reads back the whisper/deny audit trail
(FR-M5); the counted-but-not-open class produces no whisper and no deny, so
its question texts live only in the `questions` table, which no specified
surface renders. The counter's mission-need — quoted by the design itself —
is that the recourse be *reachable*; a count whose majority class carries an
over-count direction ("a genuinely-answered late ask still increments") and
no question-level readback means Max must re-read sessions to find which of
the 3 (if any) actually dropped. The dual-direction label is honest — and
labelling has here quietly become the deliverable in place of the one cheap
mechanism that would make the number actionable. Relatedly, AD-9's repair
sentence — tracking "is what keeps the AC-8a outstanding-question line, the
`FR-M4` recourse counter … alive for the dominant phrasing" — overstates:
for any question (either kind) cleared before the final K turns, tracking
keeps nothing alive on any owner surface; L1 says so, the AD-9 sales sentence
doesn't.

**Class:** wrong-check (the visibility instrument stops one step short of
the need it cites) + overclaim in repair text.

**Concrete repair.** When the Stop-time counter increments, write the counted
questions (text, kind, `closed_by_kind`, closing turn) into the session's
diagnostics/`session_log` detail, and have `ctxoracle log --session <id>`
render them under the done-claim entry; `status`'s counter line points at
that (`"3 — see ctxoracle log"`). One write plus one render — the recourse
becomes one command instead of archaeology. Temper the AD-9 sentence to the
K-window reality L1 already states.

---

## Survived with note

- **N1 — The Reuse dominance headline asserts substitutability the FTS
  candidate set cannot establish.** The pinned whisper text — "of the N
  candidates **for this functionality**, X is the one M files use" — claims
  the candidates are functional alternatives; FTS matching establishes only
  lexical match. A search for "auth" can put a class, a config object, and a
  function in one "candidate" set and crown the config `canonical` by
  file-count dominance. The comparative mechanism itself is sound and its
  inputs are all produced (`symbol_refs`, FTS, `k` in `tuning`) — the repair
  answered round-2 C4's hard question — and "no dominant candidate → silence"
  is P5-faithful (no convention ⇒ nothing non-self-servable to say; the
  single-candidate case correctly fails the comparative marginal-value axis).
  Fix the *text*: "of the N symbols matching this search…", and consider
  restricting the comparison set to same-kind symbols. Secondary: symbols
  from generic-frontend languages have no `import_edges`, so their
  `symbol_refs` counts sit at/near zero — in a mixed-language repo dominance
  systematically favors tree-sitter-covered candidates; worth one sentence in
  the whisper's stated evidence or L6.
- **N2 — T2's "exactly three openers" is falsified literally by `import`.**
  `ctxoracle import` writes the `questions` table wholesale — a fourth
  creator of rows that did not pass any classifier at import time. Harmless
  under the actor model (Max at his own terminal, importing his own export —
  the same trust class as the CLI opener), but round-2 C2 burned this exact
  document once for a false "only" enumeration; add import to the enumeration
  with its trust argument, or scope the sentence to runtime openers.
- **N3 — Two sync misses of the round-2 wiring (the m-R4 class recurring
  inside the repair).** The component map's hook-event list still enumerates
  seven events — `PostToolUseFailure`, wired by AD-6, is absent — and AD-6's
  §5 premise-verification line still cites "V1–V6" though the decision now
  rests on V19 (cited inline only). Summary surfaces are what the implementer
  wires from; two one-line edits.
- **N4 — FR-L6's "outranks" is enforcement-real only for the info/intake-miss
  class, and the matrix row doesn't say so.** A `--missed-question` on an
  action-request records surface-only state (AD-18 discloses this honestly in
  its CLI-output clause — and the deny-would-deny-the-fix reason is
  mechanism-forced, correctly not routed to Max); a miss whose cause was
  *move*-class (Bash drift, L3) collides with the already-open row and the
  promised "the identical deviation is thereafter denied" is false — Bash
  stays undeniable. The traceability matrix's AC-2c row ("FR-L6 correction
  records the miss and outranks: Phase A") should carry the same
  qualification AD-18 does, and the CLI's collision output should say which
  limit (intake vs move coverage) the reported miss actually hit. (C1's
  communicative-verb repair shrinks the first gap substantially.)
- **N5 — `questions.kind` lacks `NOT NULL`.** A NULL kind passes the CHECK
  (SQLite CHECK-NULL semantics) and fails safe — a NULL row is not
  `kind='info'`, so it is not deny-capable — but the deny-eligibility
  invariant the design calls "structurally testable" deserves the one-word
  constraint rather than an accident of predicate direction.
- **N6 — The AC-8a line has a false-positive shape for silently-fulfilled
  requests.** An agent that performs a requested action without narrating,
  then stops with a sub-floor done-claim ("Done."), leaves the `request` row
  open: the line asserts Max's ask is unanswered when it was fulfilled.
  Advisory, bounded, self-explaining once Max looks — but worth a clause in
  the counter/backstop label ("an un-narrated fulfilled request can appear
  here") so the owner reads the line correctly.

---

## End-to-end traces (everything the round-2 repairs touched)

- **Answer-drift, spec §8 full property walk on the revised mechanism.**
  *Reactive-only* — holds (open question precedes deny; deny lands on the
  formed action; AD-10 confinement unchanged, `kind='info'` predicate inside
  the single producer). *Self-clearing, no counter, no held turn* — holds.
  *Text answer never denied* — holds structurally (and is precisely what
  makes C1's misclassification cost-only). *Lag clause, clear-axis only* —
  holds; the multi-event catch-up loosening and frozen-open breakage posture
  are consistent. *Multiple questions as a set, cleared independently* —
  holds to Phase A's blanket-clear disclosure (L2); the re-ask path now works
  for verbatim info re-asks (C5 repair verified: open-scoped index +
  fresh-row-on-closed-hash + first-unmatched-adjacency reconciliation are
  mutually consistent; parallel handlers idempotent; no double-open of a live
  question found; no legitimate flow blocked found). *Per-consumer scope* —
  holds (AC-2a-i split honored). *Wrongful denies visible* — holds;
  `deny_despite_answer_text` traced through AC-9's induction: a sub-floor
  real answer is a non-deferral text turn, so the detector fires as the
  criterion states; the deferral exclusion correctly keeps the
  OL-C3-targeted dodge out of the wrongful signal (round-2 P1 repair
  verified). *Recognizer-intake surface* — C1 (communicative-verb subclass);
  the every-opener invariant itself verified: intake, catch-up ("same
  recognizer"), and `--missed-question` all classify; the only literal
  fourth writer is `import` (N2).
- **Request asked → tracked → agent edits freely → done-claim — what Max
  sees, end to end:** intake opens `kind='request'`; edits run free
  (spec-licensed, L1); the first substantive narration blanket-clears the row
  (L1 disclosed); at a done-claim more than K turns later — the common case —
  no line, no count, nothing in `status` or `log`. Within K turns: a count
  with a dual-direction label and **no question text on any owner surface**
  (P4). The round-2 tracking repair is real at the state layer and stops one
  step short at the owner-visibility layer.
- **Re-ask flow:** verbatim info re-ask → fresh row → deny re-armed ✓
  (fixture-pinned). Polite-request re-ask ("can you please answer my
  question?") → `kind='request'` → block stays dead — C1.
- **`--missed-question`, both kinds:** info text → deny-capable row → next
  deviating Edit denied ✓; request text → tracked row, CLI says so ✓
  (honest); communicative-verb request text → wrongly tracked-only (C1);
  move-class miss → collision, no enforcement change (N4).
- **Marker-less mode:** intake-based enforcement unaffected ✓; catch-up opens
  nothing (skip + diagnostic) ✓; rebuild recovers nothing →
  `rebuild_recovered_nothing`, loud ✓ (L11 consistent); voiding guard
  inoperative there — disclosed in L11, but T2's bound sentence not synced
  (P2).
- **Parallel handlers:** double-open prevented by the partial index; clear
  and backfill idempotent (same data ⇒ same row via hash+adjacency);
  duplicate fault rows possible, diagnostic-only. Survives.
- **Reuse (FR-A2c) / AC-1b:** trigger → FTS candidate set → `symbol_refs`
  counts → dominance ≥ k× → comparative headline; all inputs produced; the
  single-candidate and no-dominance cases fail the bar honestly; AC-1b's
  fixture pins the comparative form and fails bare counts ✓. Residual: the
  substitutability framing (N1).
- **Verification (FR-A2g):** mapping headline computable ✓; unmapped-target
  lean sound ✓; unrecognized-runner layer added — but the predicate's domain
  is undefined and the silence/weaker disjunction unresolved (P3);
  failed-Edit rows can pollute "changed regions" (P1). AC-8's content
  assertion is satisfiable by the weaker claim (mapping still headlines) —
  the repair did not weaken the spec property; it under-specified the
  trigger.
- **Regret failure clause through its new producer:** store-held fact →
  covering test fails → `PostToolUseFailure` → `observed_actions`
  `outcome='failed'` → SessionEnd proxy counts it ✓ — the clause is live for
  lexicon-recognized runners with mappable targets; an unmapped or
  unrecognized failing run contributes noise in the direction the design
  already disclaims ("the proxy's noise is a diagnostic concern only — it
  gates nothing"), consistent with FR-L4's diagnostic-not-gate posture.
  AC-24's failure fixture now has a real producer to replay ✓.
- **PostToolUseFailure wiring vs. spec absolutes:** output channel none;
  no `permissionDecision` (FR-O2's explicit requirement honored; AC-2's
  control-flow assertion untouched — the deny type remains unconstructible
  outside `blocks/`); a mapped lifecycle event, so FR-O5/AC-22 hold; the
  oracle's own denies are pre-execution rejections and cannot pollute the
  outcome record (V19). Survives — its unstated consumer filters are P1.

**Between-decisions consistency sweep of every round-2 addition:** `kind`
column — schema ✓ / AD-9 ✓ / AD-24 fixture ✓ / L1 ✓ (rationale defect: C1).
`intake_invalidated` — schema enum ✓ / AD-9 ✓ / AD-17 fault list ✓ / T2 ✓ /
AC-11 fixture ✓ / L11 ✓ (T2 bound sentence: P2). `outcome` — schema ✓ / AD-6 ✓
/ V19 ✓ / AC-24 ✓ / consumers unspecified (P1). `q_open_dedup` — schema
comment ✓ / AD-9 ✓ / AD-24 re-ask fixture ✓. `rebuild_recovered_nothing` —
AD-9 ✓ / AD-17 ✓. `tune`, `note --global` — AD-20 ✓ / AD-5 writer comments ✓ /
no cap introduced ✓. AC-19 record-level pin — matches the spec's
"record-identical" ✓. AC-25 matrix row, AD-24 unit tier — round-2 survivals
confirmed removed ✓. Component map / AD-6 §5 — two sync misses (N3).
`check_docs.py` passes on the current tree (run this session).

## Owner-fidelity scan of the round-2 text

Every `OL-*` citation added or moved by the round-2 diff was re-read against
its ledger row at its point of use. **OL-R5 parenthetical (AD-9):** now says
exactly what the row says — the rejected item defined the trigger itself as
"writing code" with negative-space scoping — the round-2 m-R2/N3 embellishment
("no question predicate") is gone ✓. **OL-C5 at the Stop backstop** ("draws no
info/request distinction") — supported by the row ✓. **OL-C3 at the deferral
exclusion** ("the dodge OL-C3 targets") — consistent with the row's "until it
stops ignoring me and actually answers" via the spec's FR-B1 characterization
✓. **OL-10 at `rebuild_recovered_nothing`** — squarely what the row says ✓.
**The one fidelity defect is C1's use of OL-C5:** the clause-(iv) rationale
cites OL-C5's protected class for a universally-quantified sentence that is
false on the communicative-verb subclass — a resolvable key re-read for what
the row says, attached to a sentence the row does not support for that
subclass. **Negative-space check (OL-R5's directive):** the kind split is a
positive pattern with a default branch; the deny-capable class being the
*default* errs toward more deny-capability, whose residual L1 owns and the
wrongful-deny rate measures — acceptable, and the block's *definition* remains
OL-C5's positive owner wording. **Arbitrary-limit scan (OL-C1):** the new
numbers — dominance `k`, counter window `K`, detector `N` — are respectively a
bar-internal marginal-value parameter and two diagnostic-counter parameters,
all tunable-marked with a named writer (`tune`); none suppresses a
bar-clearing whisper; no volume/count/budget cap anywhere in the new text; no
rejected item (OL-R1–R5) reintroduced — no pre-emptive gate, no generated-file
block, no budget, and the deny still requires an open question plus a
deviating action through the single confined producer.

**Repairs that survived their hardest question without a finding:** the
open-scoped dedup index (AD-4/AD-9 — attacked on the still-blocks and
now-permits axes; nothing found); the classifier-at-every-opener invariant's
enumeration (C1 is about what the classifier does, not where it runs); the
voiding guard's mechanism and direction (P2 is a stale sentence about it, not
the guard); the deferral-excluding `deny_despite_answer_text` predicate; the
watchdog-inventory completion (compose-time re-resolution bounds are real:
span-capped reads, store-side commit resolution, no git subprocess);
`tune`/`note --global` (every tunable now has a tuner, both stores have
writers); the AC-19 record-level pin; AD-20's keying-mode migration offer.

---

*End of round-3 hunt. One collapse, four partials — all five inside or one
decision away from round-2 repair text, none in the round-1 substance. Per
the convergence discipline the next round attacks these fixes; the trajectory
(5 → 6 → 1 collapses) is approaching the terminal signal but this round is
not it.*
