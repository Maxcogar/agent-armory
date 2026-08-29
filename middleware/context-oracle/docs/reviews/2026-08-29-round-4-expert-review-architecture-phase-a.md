# Round-4 expert review — Phase A architecture (round-3 fix verification + new-defect hunt)

**Artifact:** `docs/architecture-phase-a.md` as of commit `562f063` ("apply all
round-3 review findings"), diffed against the round-3-reviewed draft (`5c9ca7f`).
**Reviewer:** independent session, not the author of the document or of any prior
review. Read in full before the attack: `middleware/context-oracle/CLAUDE.md`,
`OWNER-LEDGER.md`, `docs/specs/spec-context-oracle.md`, all six 2026-08-29 review
records, the revised architecture end to end, and the full round-3 fix diff.
**Axis per the round-4 charter:** verify every round-3 finding's fix (resolved,
swept, no disclosed-instead-of-fixed, no new contradiction), hunt new defects
inside the fixes, hand-check the new citations, re-establish the premise the
fixes lean on, and re-check owner constraints on the new mechanisms. Every check
below was run in this session; nothing is carried forward from the author's
attestations or from prior rounds' claims without re-derivation. Findings were
not manufactured to reach a count; the convergence bar was applied as stated
(an empty report would have been a legitimate PASS).

## VERDICT: NEEDS FIXES — 0 Critical / 1 Serious / 1 Moderate / 5 Minor

Every round-3 finding is resolved in substance — none renamed, none
disclosed-instead-of-fixed — and the corrected claims are swept clean except at
the two locations named in m1 and m4. The Serious and the Moderate are new
defects inside round-3 fixes (the recorded fix-forecloses-adjacent-axis shape,
recurring for the third round); notably, both live inside repair text that was
applied **verbatim from the round-3 reviews' own prescribed fixes** — the
prescription itself carried the defect, which is why fix-application fidelity
(clean here) and fix *correctness* are different checks. The five Minors are
two incomplete sweeps, one writer-comment regression, one enumeration-claim
ambiguity, and one fixture-coverage assertion with no pinned case. Nothing
reaches the deny producer's confinement, the owner's structural constraints, or
the phase boundary.

---

## Serious

### R4-S1 — The `outcome` consumer filter over-reaches into the Verification run-subtraction: a covering test that ran and FAILED is invisible to the subtraction again, so the strong "not run" clause emits a checkably false whisper — the exact defect the `PostToolUseFailure` wiring was built to kill, and AD-6's stated rationale for that wiring now contradicts AD-4's rule

**Location:** AD-4 `observed_actions` CONSUMER FILTER comment (lines ~493–500:
"the changed-regions and **run-subtraction queries (FR-A2g)** … consume 'ok'
rows only") × AD-6 `PostToolUseFailure` row (line ~606: "without this wiring a
run-and-failed test looks *never run*, and Verification would emit the
checkably-false 'not run' (`FR-D1`)") × AD-15 Verification row × AD-24's AC-8
fixture set.

**What is wrong.** The round-3 P1 fix (applied verbatim from that review's
prescribed one-rule, run-subtraction included) makes `outcome='failed'` rows
consumable only by the FR-L4 clause and diagnostics. Trace the mainline OL-12
scenario: the agent edits a file (ok row), runs `npm test`, the test **fails**
(`PostToolUseFailure` → row with `command_class` = recognized runner,
`outcome='failed'`), and claims done. At the Stop, Verification computes changed
regions from ok rows (the edit), maps covering tests, and subtracts observed
runs — **from ok rows only**, per the rule. The failed run does not subtract.
The ternary classifier does not save it: the failing `npm test` is class 1
(recognized runner), not class 3, so with no genuinely-unknown command in the
session run-state is "known" and the **strong clause fires: "T has not been run
against this change" — checkably false** (the transcript shows the run and its
failure). The FR-D1 rumor, from the one genre whose value is provenance at the
done-claim, in the case closest to OL-12's core concern (ran the test, watched
it fail, claimed done anyway). The weaker branch is also poisoned: in a session
that additionally contains a class-3 command, "no *recognized* test run touched
T" is equally false — a recognized run touched T and failed.

This is the third life of the same defect: round-1 P4 (no failure source at
all), round-2 S-R3 (the source named an event that cannot carry it), and now
round-3 P1's repair filtering the finally-real producer's rows back out of the
one consumer the wiring was justified by. AD-6's row still states that
justification verbatim — "without this wiring a run-and-failed test looks
never run, and Verification would emit the checkably-false 'not run'" — so the
document now contradicts itself: AD-6 says the wiring exists so Verification
sees the failed run; AD-4's rule makes Verification blind to it. The
failed-**Edit** rationale on the rule ("a failed Edit is not a change") is
correct for the edit-set and read-set; it does not transfer to the
run-subtraction, because a failed *run* **is** a run. AD-24's new "failed
actions don't count" fixture pins only the failed-Edit case; no fixture
exercises run-and-failed against the "not run" clause, so the criterion stays
green while the property fails — the wrong-check trap, on the axis adjacent to
the one the fixture pins.

**Fix.** Scope the rule by what a failed action *is* per consumer: the
run-subtraction (and the weaker claim's "no recognized run" survey) consumes
recognized-runner rows of **either** outcome — a failed run is a run, so "not
run" is never asserted over it (whether the whisper additionally composes the
honest "ran and failed" observation is a design choice; per P5 the run-state
the agent just watched is self-evident, so plain subtraction suffices); the
edit-set, changed-regions, read-set, and Coupling/Reuse triggers keep 'ok'-only.
Reconcile AD-4's rule text and AD-15's Verification row, and add the
run-and-failed done-claim case to AC-8's fixture (asserting no "not run" and no
"no recognized run" is emitted). AD-6's rationale sentence then becomes true
again as written.

---

## Moderate

### R4-M1 — The communicative-verb split's default branch makes a request-frame interrogative with an unrecognized verb deny-capable: the wrongful-deny direction FR-B5 forbids, unowned by L1's residual description

**Location:** AD-9 clause (iv) ("Everything else is `kind='info'`", lines
~705–719) × the deny-decision rationale's residual sentence (~line 798: "an
action-request phrased **outside the request pattern**, which the classifier
therefore marked `info`") × L1 (same phrasing).

**What is wrong.** The round-3 C1 fix narrowed `kind='request'` to the request
frame **plus a *doing* verb** (fix/add/implement/refactor/update-class) and
routed communicative verbs (a small **closed** lexicon) to `info`. Both
lexicons are finite; repo-action verbs are an open class. A request-frame ask
whose verb is in **neither** lexicon — "can you **rename** the helper?",
"could you **delete** that file?", "can you **bump** the version?" — now falls
to the default branch and opens **`kind='info'` = deny-capable**. The agent's
`Edit` performing the requested act — OL-C5's "action taken to provide the
answer", verbatim the protected class — is then denied with "answer Max's
question first". Under round-2's clause (iv), the same ask (frame + "an action
verb") classified `request` and was tracked-only; the round-3 fix silently
flipped the default direction for unlisted verbs from the safe side
(under-enforce, tracked) to the harmful side (wrongful deny), in the very
paragraph that claims the recognizer "errs toward not denying — here, toward
not *opening*" (`FR-B5`). The round-3 hunt's acceptance of the info-default
("errs toward more deny-capability … acceptable") was rendered for the
round-2 classifier, where every frame-matching action request was `request`;
it does not carry to the narrowed pattern.

The asymmetry is structural, not a lexicon-tending problem: an unlisted
*communicative* verb defaulting to `info` is correct (the requested act is
text, undeniable — "can you summarize the error?" lands safely), while an
unlisted *doing* verb defaulting to `info` denies the requested act itself; a
wholesale default flip to `request` would therefore recreate round-3 C1 for
unlisted communicative verbs. The design must pick a default and own its cost —
it picked `info` and owns nothing: the rationale's residual sentence and L1
both describe the wrongful-deny residual as "an action-request phrased
**outside the request pattern**", which no longer bounds the class — a
frame-matching, unlisted-doing-verb ask is *inside* the frame and still lands
`info`. Harm is bounded (the deny is escapable by one answering turn, counted
on the wrongful-deny rate, and FR-B5 itself calls this the trivially-escaped
direction), which is why this is Moderate and not Serious — but the stated
lean is contradicted by the mechanism's default, and the disclosure no longer
matches the class it discloses: the accuracy-of-disclosure failure this
project records most.

**Fix.** State the default as a decision with its direction and cost: either
(a) keep default-`info` and rewrite the residual sentences (AD-9 ×2, L1) to
name both sub-classes ("an action-request phrased outside the request frame,
**or inside it with a verb the doing lexicon does not list**"), accepting the
FR-B5 tension explicitly as the price of not losing unlisted communicative
verbs; or (b) default the *request-frame* remainder to `request` (tracked-only,
FR-B5-faithful) and accept the enforcement loss for unlisted communicative
verbs, guarded — like every under-fire miss — by `--missed-question`. Either
way, add a neither-lexicon case ("can you rename the helper?") to AD-24's
fixtures pinning whichever behavior is chosen.

---

## Minor

### R4-m1 — R3-m2's fix landed at only one of its two named locations: AD-6's `PostToolUseFailure` row still states `outcome='failed'` as "parsed from the `error` exit-code line"

**Location:** AD-6 event table, `PostToolUseFailure` row (line ~606).

R3-m2 named both AD-4's comment and AD-6's row. AD-4 now says outcome='failed'
is set by the event **unconditionally** (parse = best-effort enrichment); AD-6
— the summary surface the implementer wires from — still reads "append with
`outcome='failed'` parsed from the `error` exit-code line (V19)", the exact
phrasing the finding said an implementer can read as a precondition (skipping
the append when a non-Bash error string has no exit-code line, recreating
run-and-failed-looks-never-run for those rows). Under the apply-all-findings
rule this is an incomplete sweep, not a judgment call. One phrase syncs it to
AD-4's corrected form.

### R4-m2 — The `whisper_stats` watermark rewrite dropped the writer's other half: nothing now names what aggregates `sent` (the session's audit counts) into the efficacy table

**Location:** AD-5 §1, `whisper_stats` WRITER comment (lines ~546–556).

The pre-fix writer was "the handler's SessionEnd flush aggregates the session's
**audit + corrections**". The R3-M2 fix replaced the whole WRITER clause with
"watermarked aggregation — any handler event or CLI verb … folds in
**corrections** newer than the last-aggregated timestamp" — corrections only.
`whisper_stats(genre, project_key, **sent**, corrected_false, corrected_missed,
…)`: the `sent` column's writer is now unstated — the writer-less-efficacy-table
defect (round-2 P4's class) reintroduced by the fix for its timing variant
(R3-M2). Recoverable (whisper_audit rows persist; `status`'s false-fire rate
reads `corrections` directly), and the fix is one clause: the watermarked fold
aggregates **audit rows and corrections** newer than the watermark. Worth
stating the watermark's per-project scoping in the same breath (corrections
live in project stores; the fold writes the global store).

### R4-m3 — "All three classes config-enumerated" cannot be true of the ternary classifier's class 3, and the unmatched-command default is unstated

**Location:** AD-15 Verification row (the ternary `command_class` classifier).

Classes 1 and 2 are genuine enumerations (runner lexicon; innocuous allowlist).
Class 3 is described as "*genuinely unknown* (script-, make-, or
package-runner-shaped outside both lists)". If class 3 is itself an enumeration
(as "all three classes config-enumerated" states), the classifier is partial:
an everyday command outside all three enumerations (`sed -i`, `awk`, `curl`,
`docker …`) has no class and no stated run-state effect — round-3 P3's
undefined-domain gap recreated one level down, and the strong clause's domain
(the thing the new fixture pins) depends on an unwritten default whose unsafe
direction (default-innocuous) re-admits the false "not run". If instead class 3
is the complement/default — the conservative reading class 2's "cannot run
tests" allowlist implies — the classifier is total and safe, but the
"all three classes config-enumerated" sentence is false for it. One clause
fixes either way: classes 1 and 2 are config-enumerated; class 3 is the default
complement (anything outside both lists ⇒ run-state unknown).

### R4-m4 — A survival no round swept: AD-9's intake-row-validation bound ("its question row survives at most one catch-up") lacks the marker-carrying qualifier that round 3 added to T2's two sibling sentences

**Location:** AD-9, Intake-row validation (line ~756).

The sentence quantifies over "a platform-injected turn" unconditioned; the
bound is true only for the marker-**carrying** class, as the immediately
following carve-out sentence and the fixed T2 both state. The correction being
adjacent bounds the confusion, but the project's own standard for this exact
claim (round-3 P2 / R3-m6: "the bound sentence itself must carry the
qualifier") was applied to two of the three copies and missed this one. Two
words fix it ("a **marker-carrying** platform-injected turn").

### R4-m5 — L6 asserts the two Reuse consequences are "measured against AC-1b's fixture"; AD-24 pins no such fixture case

**Location:** L6 (final sentence) × AD-24's AC-1b pin.

The round-3 N1 fix added the identifier-match false-positive class and the
mixed-language dominance skew to L6, ending "both stated in the whisper's
evidence and **measured against AC-1b's fixture** rather than assumed benign."
AD-24's AC-1b pin covers only the comparative-headline / bare-count assertion —
no mixed-language case, no false-positive case, appears in the fixture
enumeration. An asserted fixture measurement with no pinned case is the same
unapplied-sub-clause class as R3-m3/R3-m4. Either add the case(s) to AD-24's
AC-1b pin (a mixed-language fixture where a generic-frontend symbol is the true
convention, asserting no false dominance crown) or soften L6 to "stated in the
whisper's evidence" only.

---

## Round-3 finding resolution table

"Resolved" = fixed in substance, swept, no surviving contradicting copy, except
where a note points at a finding above.

| Round-3 finding | Status in `562f063` | Where / notes |
|---|---|---|
| CH C1 (communicative-verb interrogatives lost deny-capability; escalation re-ask disarmed) | **Resolved, new defect** | Clause (iv) split on the requested action: communicative lexicon → `info` (deny-capable), doing verbs → `request`; rationale re-quantified ("For a request **to act on the repo**…"); both phrasings pinned in AD-24 ("could you tell me why X fails?" denied on deviation; "can you please answer my question?" re-arms after a blanket clear); `--missed-question` inherits via the shared classifier; L1 restated. New: the default branch for neither-lexicon verbs (R4-M1) |
| CH P1 (failed rows flowed into edit-set/read-set/Completeness/Verification) | **Resolved, new defect** | The one-rule CONSUMER FILTER in AD-4; AD-15 changed-regions and AD-16 read-set carry the 'ok'-only predicate; failed-Edit fixture case in AD-24. New: the rule's run-subtraction clause resurrects the run-and-failed false "not run" and contradicts AD-6 (R4-S1) |
| CH P2 (T2's exposure bound unconditioned vs the marker-absent carve-out) | **Resolved, one sibling copy unswept** | T2's Experiment and Conclusion both conditioned (marker-carrying → one catch-up; marker-absent → L11 residual, clear-lean-closed, wrongful-deny-counted; "both residuals are stated, not hidden"). Survival: AD-9's own bound sentence (R4-m4) |
| CH P3 (binary runner lexicon made run-state permanently unknown; disjunction unresolved) | **Resolved, residual ambiguity** | Ternary classifier; the shipped branch is the weaker honest claim (stated, with the AC-8 content-assertion argument); both fixture cases added (innocuous-only session fires strong; `make check` composes weak). Residual: class-3 enumeration claim / unmatched default (R4-m3) |
| CH P4 (counter countable but not readable; AD-9 "keeps alive" oversold) | **Resolved** | Each increment writes the counted questions (text, kind, `closed_by_kind`, closing turn) to `session_log` detail; `ctxoracle log --session <id>` renders them under the done-claim entry; `status`'s line points there; the AD-9 sentence tempered to the K-window extent with L1 named |
| CH N1 (Reuse headline claims substitutability; mixed-language skew) | **Resolved, sub-clause gap** | Headline now "of the N **symbols matching this search**…"; set named as lexical, same-kind-restricted; substitutability explicitly disclaimed; mixed-language caveat in the whisper's evidence and L6. Gap: L6's "measured against AC-1b's fixture" has no pinned case (R4-m5) |
| CH N2 (T2's "exactly three openers" falsified by `import`) | **Resolved** | "created **at runtime** by exactly three openers" + the import parenthetical (archival writer, CLI trust class) |
| CH N3 (component map missing `PostToolUseFailure`; AD-6 §5 cites V1–V6 only) | **Resolved** | Map's event list carries `PostToolUseFailure`; AD-6 §5 cites "V1–V6 and V15/V16/V19" |
| CH N4 (FR-L6 "outranks" enforcement-real only for info/intake-miss; matrix row silent; CLI collision output vague) | **Resolved** | Matrix AC-2c row carries the qualification (enforcement-real for intake-missed info; request-/move-class recorded-not-enforced, CLI says which); AD-18's collision output states which limit (intake vs move coverage) was hit |
| CH N5 (`questions.kind` lacked NOT NULL) | **Resolved** | `kind TEXT NOT NULL CHECK(…)` with the CHECK-passes-NULL rationale in the comment |
| CH N6 (AC-8a false-positive for silently-fulfilled requests unlabelled) | **Resolved** | Counter label: "an un-narrated *fulfilled* request can appear here too: doing without saying leaves its row open" |
| ER R3-M1 (deferral exclusion re-blinds false-stoplist-match while claiming both sub-cases caught) | **Resolved** | Option (a) taken: AD-9's "Coverage stated exactly" names the length-floor catch and the human-channel-only false-stoplist-match gap with its self-recovery; AD-17 restated to "covered per axis, with the one named gap stated"; sweep of "both of its axes" — 0 hits |
| ER R3-M2 (`whisper_stats` writer misses post-session corrections) | **Resolved, new defect** | Watermarked aggregation (any handler event or CLI verb; `correct` the cheapest point); AC-23 pinned to a post-session correction reaching the global store (AD-24). New: the rewrite names corrections only — `sent` writer-less (R4-m2) |
| ER R3-m1 (map event list; map CLI `tune`; AD-8 order; stale V-ranges ×4) | **Resolved** | All four: map events + `tune` verb; AD-8 order carries question intake; baseline "V1–V19"; AD-6 §5, matrix C-4 row, standards-table hooks row all updated to the V15/V16/V18/V19 set |
| ER R3-m2 (outcome='failed' written as parsed-from, contract hedges "generally") | **Partially resolved** | AD-4: unconditional-set + best-effort-parse, exactly as prescribed. AD-6's row — the finding's second named location — unchanged (R4-m1) |
| ER R3-m3 (identifier-match false-positive class absent from Limitations) | **Resolved** | L6 owns both Reuse-facing consequences |
| ER R3-m4 (no unrecognized-runner case in AC-8's fixture) | **Resolved** | "run-state honesty both ways" fixture cases (strong fires on innocuous-only; `make check` ⇒ weak claim only) |
| ER R3-m5 (Status section's "all 24 round-1 findings" miscount/overclaim) | **Resolved** | "28 rows, 25 distinct after the three cross-duplicates its own resolution table names … one, the failure-outcome producer, only partially until this round's fix landed" — arithmetic re-derived this session (round-1: 15 CH + 13 ER = 28; duplicates ER S3=CH C3, ER M3=CH P2, ER M4=CH N1 ⇒ 25) |
| ER R3-m6 (T2 bound unqualified; exception only in L11) | **Resolved** | = CH P2; both T2 sentences conditioned |

## Checks run that came back clean

- **Mechanical floor:** `python3 middleware/context-oracle/tools/check_docs.py`
  → "doc-consistency check passed" (exit 0) on the current tree, run this
  session.
- **Survival sweeps (grep + read, whole document):** "for this functionality" —
  0 hits (Reuse restatement swept). "an action verb" (round-2 clause-iv
  wording) — 0. "all 24" — 0. "bounds to the lag window" — 0. "both of its
  axes" — 0. "could not classify at all" (the binary-lexicon predicate) — 0.
  "honest Phase A approximation" — 0. "N files reference" — 0. "dominant" —
  only benign uses (the round-3-finding citation, the dominance mechanism, the
  Status narrative, the watermark-timing comment). "flush" — only the SessionEnd
  diagnostics row (the old `whisper_stats` SessionEnd-flush writer is gone; its
  replacement's gap is R4-m2). "at most one catch-up" — T2 conditioned; the AD-9
  copy is R4-m4. "parsed from" — only AD-6's row (R4-m1).
- **Premise re-establishment (this session, not carried forward):** V19
  re-fetched from the current hooks reference (code.claude.com/docs/en/hooks via
  Context7): "PostToolUse hooks fire after a tool has executed successfully" —
  confirmed; "The PostToolUseFailure hook runs when a tool that started
  executing fails … does not fire for tool calls rejected prior to execution,
  such as … permission denials" — confirmed (grounds both "the event firing IS
  the failure fact" and "a PreToolUse deny never generates one"); "For Bash and
  PowerShell tools, the error output generally begins with an exit code line" —
  confirmed verbatim (the "generally" hedge the R3-m2 fix leans on); the docs'
  PostToolUseFailure example payload is a failing `npm test` with
  `error: "Exit code 1…"` — confirmed. The round-3 fixes introduced **no other
  new external premise** (communicative lexicon, consumer filter, ternary
  classifier, log rendering, watermark are all internal design; no new V row was
  needed and none was added).
- **Citation integrity of the new text (hand-checked against spec/ledger/review
  records read in full):** the four "round-3 finding" citations each match a
  real round-3 finding (C1, P1→consumer filter, P3→ternary, P4→readable
  counter, R3-M2→watermark); "OL-C3's own named moment" for the escalation
  re-ask — supported by the CONFIRMED row's "until it stops ignoring me and
  actually answers"; the round-2-collapse citation inside clause (iv) matches
  round-2 C1; "the spec's thrice-named recourse" re-verified at FR-B5, FR-B4,
  AC-2a-ii; the Status section's round-3 verdict counts (0/0/2/6; 1/4/6) match
  both round-3 files, its applied-fix enumeration matches the diff item by
  item, its round-2 paragraph's corrected count is right (see the R3-m5 row),
  and convergence is correctly not claimed. `D-41`/`D-39`/`FR-B5`/`OL-C5` uses
  in the revised clause (iv) and deny rationale still say what the cited rows
  say — except the residual-class description flagged in R4-M1.
- **§8 property re-walk on the revised mechanisms:** reactive-only holds (a
  deny still requires an open `kind='info'` question **and** a deviating
  action; the round-3 fixes touch classification, never the deny producer —
  AD-10's single-caller confinement and AC-2's control-flow assertion are
  untouched by the diff); text answer never denied; self-clearing, no counter,
  no held turn; lag clause clear-axis-only in all statements; per-consumer
  scope (AC-2a-i split intact); the communicative re-ask flow traced end to
  end (info row blanket-cleared → "can you please answer my question?" →
  communicative verb → fresh `info` row via the open-scoped index → next
  deviating `Edit` denied); `--missed-question` with communicative text traced
  (→ `info`, deny-capable — round-3 C1's aggravation 3 closed); the verbatim
  re-ask fixture still pinned.
- **Owner constraints on the new mechanisms:** OL-C1/OL-R1/OL-R3 clean — the
  innocuous allowlist and the two verb lexicons are fact-definition/
  classification machinery, not volume/count/budget caps; no new operating
  number was introduced (K, N, k, deny-loop 3 unchanged, all tunable-marked
  with `tune` as writer); no cap suppresses a bar-clearing whisper. FR-B3/OL-R4
  clean — no new deny producer, no `permissionDecision` on `PostToolUseFailure`
  (its output channel is **none**), no generated-file consumption on any deny
  input, no pre-emptive gate. OL-R5's directive — clause (iv) remains a
  positive classification; the trigger's definition remains OL-C5's owner
  wording (the default branch's *direction* is R4-M1, a lean question, not a
  negative-space trigger definition). OL-C5's protected class: intact for every
  listed verb on both sides; the neither-lexicon residual is R4-M1.
- **Watermark aggregation reachability:** the fold is serializable under AD-26's
  stated discipline (global-store single-writer transaction around
  read-watermark → fold → advance-watermark prevents double-counting between
  parallel handlers), and since `ctxoracle correct` is the sole creator of
  `corrections` rows, folding at `correct` alone reaches every correction —
  the AC-23 post-session pin is satisfiable exactly as written. (The `sent`
  half is R4-m2.)
- **Ternary-classifier / AC-8 interaction:** the weaker honest claim satisfies
  AC-8's content assertion (the covering-test mapping still headlines; run-state
  never stands alone) — the round-3 P3 fix's claim verified against the spec's
  AC-8 text; the strong clause remains reachable (innocuous-only sessions), and
  the shipped-branch decision removes the round-3-flagged inline disjunction.
- **Readable-counter flow:** increment → `session_log` detail → `log --session`
  render → `status` pointer traced; `log [--session <id>]` exists in AD-20's
  verb list and the component map; question text passes the AD-19 redaction
  ingress like every stored string; multiple done-claims per session each carry
  their own entry. The recourse is one command, as the round-3 P4 repair
  required.
- **Phase-boundary honesty:** unchanged clean — the skeleton is still labelled
  a skeleton (AD-9/L1/AC-12); every round-3 fix is Phase A machinery with a
  Phase A writer; no Phase B/C design against no data was introduced.
- **Fix-application fidelity:** every round-3 repair prescription was located
  in the diff and matches (several verbatim); the two prescriptions that were
  themselves defective (P1's run-subtraction clause; R3-M2's corrections-only
  aggregation wording) were applied faithfully — the resulting defects are
  R4-S1 and R4-m2, charged to this round, not to application fidelity.

---

*Round-4 review, 2026-08-29. Not the terminal round: R4-S1 is real (a checkably
false whisper in the mainline run-and-failed done-claim, plus an AD-4/AD-6
contradiction) and R4-M1 is a direction-of-lean contradiction with a stale
disclosure. Both are single-mechanism fixes (scope one clause of the consumer
filter; pick and disclose one default), the Minors are one-line sweeps, and
nothing touches the deny confinement, the owner constraints, or the phase
boundary. Per the convergence discipline, the next round attacks these fixes;
the trajectory (collapse-class: 5 → 6 → 1 → 0; Serious-class: 4 → 4 → 0 → 1)
is close but this round found real defects, so convergence is not yet claimed.*
