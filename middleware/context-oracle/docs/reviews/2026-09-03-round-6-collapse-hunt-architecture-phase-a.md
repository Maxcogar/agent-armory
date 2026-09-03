# Independent collapse-hunt, round 6 — Phase A architecture (2026-09-03)

**Artifact:** `docs/architecture-phase-a.md` at current HEAD (`40a215c`); the
round-5 repairs are commit `2a63f9a` ("apply all round-5 review findings"),
read as `git show 2a63f9a -- middleware/context-oracle/docs/architecture-phase-a.md`
in full.
**Axis:** mission-fidelity only. Reviewer is not the author of the document or
of any prior review. Read in full, in order, before the attack:
`docs/collapse-log.md` (its 2026-08-29 entry first, per the charter, then the
rest — esp. 2026-08-25's terminal-state definition), `OWNER-LEDGER.md`,
`middleware/context-oracle/CLAUDE.md`, `docs/specs/spec-context-oracle.md`
(§8, §11.5, §12, §13, §14), both round-5 review files, then the architecture
end to end plus the round-5 apply diff.
**Charter additions honored:** (1) the round-5 fixes were largely prescribed by
the round-5 reviews themselves — reviewer repair text carries no verification of
its own and was attacked here exactly as author text (collapse-log 2026-08-29
lesson 1). (2) The `observed_actions` reader enumeration and the object-
classification lexicon/corpus enumerations were re-audited for completeness over
the classes the mechanism itself creates (lesson 2 corollary). (3) For every
fixture assertion added by a round-5 repair, the mechanism sentence that
produces the asserted behavior was named before the fixture was accepted (the
round-5 hunt's standing question) — applied hard to AC-1b's mixed-language
"asserted silence" and the same-name false-positive fixture.
**Method:** each round-5 repair's hardest question, answered from the document,
spec, and ledger alone; the required end-to-end re-traces (OL-12 mainline; the
full object-classification corpus including the round-5 additions and adversarial
cases; the Reuse dominance path in a mixed-language repo; Verification across all
command mixes; the §8 deny-confinement walk on the round-5 text; an owner-fidelity
scan); between-decisions consistency of every round-5 addition. Findings were not
manufactured to avoid an empty report; the repairs that survived their hardest
question are recorded by name.

## Verdict: DOES NOT SURVIVE

- **Collapses: 0**
- **Partial collapses: 4** (P1–P4)
- **Survived with note: 5** (N1–N5)

For the second round running, no full collapse: no round-5 mechanism is hollow
end to end, the §8 property walk holds unchanged (the round-5 diff only *shrinks*
the deny-capable set and touches classification/bookkeeping/fixtures, never the
deny producer), the OL-12 mainline is clean at every layer, and the
quote-aware/independently-contributing segment classification holds end to end.
But four real defects live inside the round-5 repair text, and every one is the
collapse-log's own recurring lesson validated again: **P4** is the round-5-P4
shape verbatim — a repair-added fixture (the same-name false-positive case)
asserting a behavior no mechanism in the document produces; **P1** is the
false-universal-inside-a-lexicon-repair shape (round-1 S2 → round-3 C1 →
round-4 P1 → round-5 P1 → this), the "exactly one member shape" claim still
false, now via the fallible rhetorical/idiom stoplist the round-5 default flip
never touched; **P3** is a round-5 prescription sub-clause (per-project
watermark) applied to one comment and dropped from its operative sibling, which
re-encodes the exact stranding bug R5-M2 fixed; **P2** is the round-5
tenth-reader repair applied one decision away from the canonical enumeration it
was found missing from, plus a mis-bucketed eleventh reader. A round with live
partials is not the terminal round; per the convergence discipline the counts
bar the terminal call, and the collapse-class trajectory
(5 → 6 → 1 → 1 → 0 → 0) continues to converge while the partial count holds at 4.

---

## Partial collapses

### P1 — "The residual wrongful-deny class has exactly one member shape" is still a false universal: the fallible rhetorical/idiom stoplist (clause iii) produces a second wrongful-deny shape — a spurious `info` question from a rhetorical interrogative — which the round-5 default flip did not touch and which AD-9, L1, and the Status paragraph all exclude

**Where:** AD-9 deny-decision rationale ("The residual wrongful-deny class has
**exactly one member shape** after the round-4 default fix: an action-request
**phrased outside the request frame entirely**") × the clause-(iii) opener ("is
not matched by a **small** rhetorical/idiom stoplist") × L1 ("**The
wrongful-deny residual** is the action-request phrased outside the request frame
entirely") × the Status paragraph and commit message ("lexicon incompleteness
now fails toward under-enforcement in **all four lexicons**, restoring L1's
single-member wrongful-deny residual as **true**").

**Collapse question:** *Max's prompt is "ugh, why is CI always so flaky?? anyway,
please add the null check to `parser.js`." Intake (clause i–iii) opens "why is CI
always so flaky?" — it ends with `?`, is outside a fence, and is not on a
**small** stoplist that cannot enumerate open-ended rhetoricals. Clause (iv)
classifies it a non-request-frame interrogative → `kind='info'` → deny-capable.
The agent then does exactly what the same prompt asked — an `Edit` adding the
null check — and it is **denied** ("answer Max's question first: why is CI always
so flaky?"). Which of L1's "exactly one member shape" is that? By what mechanism
is the rhetorical interrogative kept out of the deny-capable set?*

**Why the document's answer fails.** There is none. A wrongful deny occurs
whenever a deny-capable (`kind='info'`) row is not a genuine unanswered question
the agent is ignoring. The round-5 default flip (unlisted object → `request`)
genuinely closed the *round-5-P1 in-frame* second shape (communicative verb +
unlisted build noun → `info` → deny), and the object-mechanism re-trace below
confirms that closure. But "exactly one member shape" is a claim over the
**whole** residual, and it rests on clause (iii)'s stoplist perfectly excluding
rhetorical interrogatives — the document itself calls that stoplist "**small**,"
and rhetorical/idiom phrasing is open-ended, so the stoplist is incomplete **by
construction** (the same class as every fallible recognizer the collapse-log
warns about). A rhetorical interrogative that escapes it is opened by clause
(i)–(iii), classified `info` by clause (iv) (it is a non-request-frame
interrogative, exactly like "did you run the tests?"), and arms a deny against a
fulfilling move — a wrongful deny that is **not** "an action-request phrased
outside the request frame": it is a *non-action* rhetorical, frequently
co-occurring in one prompt with a separately, correctly-framed real request
(which classifies `request`, non-deny-capable, and would otherwise run free).
The rhetorical lead-in blocks the very task Max asked for in the same breath —
realistic developer phrasing, and actively counterproductive.

Three surfaces overclaim against it, exactly as round 5's P1/R5-M1 charged of
the prior wording:

1. AD-9's rationale — "**exactly one member shape**" — is a false universal:
   the rhetorical-escape `info` row is a second member shape, produced by the
   fallible stoplist the sentence's own "clause (i)–(iii) opened" acknowledges.
2. L1's ledger names only "the action-request phrased outside the request frame
   entirely," so its wrongful-deny bucket has no entry for the rhetorical-escape
   class.
3. The Status paragraph's "lexicon incompleteness now fails toward
   under-enforcement in **all four lexicons**" has a direct counterexample: the
   rhetorical/idiom **stoplist** is a curated matching list whose incompleteness
   fails toward **over**-enforcement (a missed rhetorical opens a deny-capable
   row), the opposite direction — and separately, "all four lexicons" (line
   ~2234) contradicts clause (iv)'s own "the **two** config-enumerated lexicons"
   (line ~777) over a classifier that actually names three (communicative-verb,
   information-object, artifact-object): a live count drift inside the repair's
   own summary.

**Additional hollow-mechanism observation in the same clause (recorded here, not
as a separate partial).** After the round-5 flip, the **artifact-object lexicon
is vestigial in Phase A**: an object head on the artifact lexicon → `request`,
and an unlisted object head → `request` — *identical output*. The only
discriminating lexicon left is the information-object lexicon (→ `info`);
everything else resolves to `request` by default. The document still presents the
artifact-object lexicon as load-bearing ("An object whose head is on the
artifact-object lexicon … classifies `kind='request'` — 'can you show me a demo?'
is fulfilled by a build"), and AC-24 pins "'can you show me a demo?' → request
**via the artifact-object noun**" — but that input is `request` via the default
too, so deleting the entire artifact-object lexicon leaves the fixture green.
A mechanism whose removal breaks no test and changes no classification is hollow
by the collapse test's own standard; here it is hollow in the *safe* direction,
which is why it is a note within P1 rather than its own partial.

**Class:** unverified (a false universal inside repair text — fifth recurrence of
the shape) + wrong-check (L1's ledger and AD-24's corpus scoped to miss the
rhetorical-escape wrongful-deny class the fallible stoplist creates; the
artifact-object fixture cannot fail if the lexicon it purports to test is
deleted).

**Concrete repair.** Own the residual the mechanism actually has. (1) Rewrite
AD-9's rationale and L1 to enumerate **two** member shapes of the wrongful-deny
residual: the action-request phrased outside the request frame ("mind fixing
X?"), *and* the rhetorical/idiom interrogative that escapes the stoplist and is
classified `info` for want of a frame — both escapable by one answering turn,
both measured on the wrongful-deny rate, the second shrunk by tending the
stoplist. (2) Reword the Status paragraph's "all four lexicons fail toward
under-enforcement": name the actual list, and state the stoplist as the one
curated list whose incompleteness fails the *other* way (a missed rhetorical is a
wrongful deny, not an under-enforcement). (3) Reconcile "two config-enumerated
lexicons" (clause iv) with the summary's "four." (4) Add a rhetorical-lead-in
case to AD-24's corpus ("why is CI always so flaky? … please add the null check"
→ the rhetorical opens `info`, the requested edit is wrongfully denied once,
narration clears — the documented cost). (5) Either state the artifact-object
lexicon is retained only for a future re-tightened default and is inert in Phase
A, or drop it and let the default carry "show me a demo" → `request`; if retained,
give AD-24 a case that would fail were the lexicon removed, or the fixture pins
nothing.

### P2 — The round-5 tenth-reader fix landed in AD-18, not in AD-4's canonical CONSUMER FILTER, so the enumeration whose completeness the collapse-log corollary makes the deliverable STILL omits the re-edit clause — and the same filter mis-buckets `deny_bypass_suspect` (fed `'failed'` rows, needs `'ok'`) while its "file-writing `command_class`" target is a class the ternary classifier never creates

**Where:** AD-4's `observed_actions` CONSUMER FILTER (lines ~497–515 — the round-4
R4-S1/C1 repair; **untouched by the round-5 diff**, confirmed:
`git show 2a63f9a` has no hunk in that range) × AD-18's regret proxy ("Outcome
semantics of its two `observed_actions` reads, stated because round 5 found this
reader missing from AD-4's enumeration") × AD-9's `deny_bypass_suspect` ("recorded
post-hoc when a deny is followed in the same turn by a **file-writing
`command_class` row** in `observed_actions`") × AD-15's ternary `command_class`
(runner / innocuous / everything-else) × `docs/collapse-log.md` 2026-08-29 lesson
2 corollary ("an enumeration offered as a terminating repair is itself the first
thing the next round verifies for completeness").

**Collapse question:** *The corollary's own audit: read AD-4's CONSUMER FILTER —
the canonical "list every reader of `observed_actions` with its outcome
semantics" — and check it lists every reader with the right bucket. Where in
AD-4's three bullets is the FR-L4 re-edit clause (the round-5 "tenth reader")?
And which bucket holds `deny_bypass_suspect`, whose job is to catch a **successful**
('ok') file-writing bypass of a deny?*

**Why the document's answer fails.** The re-edit clause is **not in AD-4's filter
at all.** Round 5's P2 finding located the defect precisely in AD-4's enumeration
("a distinct consumer … appears in none of the three [bullets]") and its
prescription said, verbatim, "Add the tenth reader **to the filter** with its
semantics." The applied fix added the outcome semantics to **AD-18** (the regret
proxy's own decision) and left AD-4's filter — the enumeration whose completeness
the collapse-log makes the deliverable — listing exactly the nine readers it
listed before. A round-6 auditor reading AD-4's filter to answer "what reads
`observed_actions`" is handed the identical incomplete list round 5 flagged; the
tenth reader's semantics live one decision away, disconnected from the canonical
enumeration. This is the R3-m3/R4-P3 "unapplied prescription sub-clause" class:
the *semantics* were documented, the *enumeration* was not repaired.

Worse, the filter's tenth entry — `deny_bypass_suspect`, named in the "'failed'
rows additionally feed … diagnostics (`deny_bypass_suspect` included)" bullet —
is in the **wrong outcome bucket**. The bypass it exists to catch is a denied
`Edit` retried as a file-writing `Bash` command that **sails through** (L3) — a
*successful* write, `outcome='ok'`. A `'failed'` file-write never wrote anything
and is not a bypass. So the diagnostic needs `'ok'` (or either-outcome) rows, and
the filter routes it `'failed'` rows only — the `'ok'` file-writing rows go to
the change/read consumers, of which `deny_bypass_suspect` is not one. Read
strictly, the enumeration feeds the bypass detector precisely the rows that are
*not* bypasses and withholds the rows that are. And compounding it: a "file-writing
`command_class` row" is not identifiable at all — AD-15's classifier is ternary
(recognized-runner / recognized-innocuous / class-3 default), created for
*test-run* detection; there is no "file-writing" class, so `echo x > f.py` lands
in class 3 (unknown) indistinguishable from any other non-runner. The detector's
target rows are unspecifiable in the vocabulary the mechanism creates.

Harm is bounded — `deny_bypass_suspect` is owner-facing, gates nothing, and both
defects make it *under*-detect (a missing diagnostic, the safe direction); the
re-edit semantics do exist in the document (AD-18), just not in the canonical
enumeration — which is why this is partial, not a collapse. But the completeness
of AD-4's enumeration is the round-5 repair's whole justification, and it fails
that bar on its first audit: nine readers listed, the tenth (re-edit) still
absent, the enumerated eleventh (`deny_bypass_suspect`) mis-bucketed and reading a
class that does not exist.

**Class:** wrong-check (an enumeration whose completeness is the deliverable,
repaired one decision away from where the finding located it, and an existing
reader's bucket left wrong) — the round-2-P3 shape (an inventory incomplete on
first audit) inside the terminating repair, second occurrence.

**Concrete repair.** (1) Add the FR-L4 **re-edit** clause to AD-4's CONSUMER
FILTER as a change-consuming reader (`'ok'` rows only), so the canonical
enumeration is complete and AD-18's semantics have a home in the filter. (2)
Re-bucket `deny_bypass_suspect`: it consumes file-writing rows of `'ok'` (a
failed write is no bypass) — and name the mechanism that identifies a
file-writing shell command, since `command_class`'s three values do not include
one (a fourth `command_class` value, or a separate path-write predicate on the
`Bash` `tool_input`, must exist or the detector is inert). (3) Extend AC-24's
regret/no-inflate fixtures with a failed-Edit-in-held-region case (already
prescribed by round-5 P2 and still unpinned) and a successful-bypass case for
`deny_bypass_suspect`.

### P3 — The per-project watermark fix updated the `global_meta` comment but not its operative sibling: the `whisper_stats` WRITER comment still reads "the project stores'" (the all-stores reading R5-M2 flagged) and "newer than `whisper_stats_watermark`" (the bare global key) — an implementer building from the WRITER comment reinstates the exact stranding bug R5-M2 fixed

**Where:** AD-5 §1, the `global_meta` comment (round-5 R5-M2/P3 repair:
"the fold watermarks, **ONE PER PROJECT**: `whisper_stats_watermark:<key>` … the
fold reads and advances only the watermark(s) of the project(s) it folds") × the
adjacent `whisper_stats` **WRITER** comment (lines ~572–593, *not* rewritten by
the round-5 diff: "watermarked aggregation folding BOTH **the project stores'**
whisper_audit rows … AND corrections newer than **`whisper_stats_watermark`**")
× OL-6 (the owner works "solo **across his own repositories**" — multi-project is
ledger-confirmed mainline) × round-5 R5-M2's own fix text ("Make the watermark
per-project … **Sync AD-5's comment**").

**Collapse question:** *An implementer builds the fold from the sentence that
describes the fold — the `whisper_stats` WRITER comment. It says the fold folds
"the project stores'" (plural) whisper_audit rows and corrections "newer than
`whisper_stats_watermark`" (a bare, un-keyed, single global timestamp). Which
fold does that implementer build — the per-project one the `global_meta` comment
five lines up now describes, or the single-global-timestamp one this comment
still describes? And if the latter, what did R5-M2 fix?*

**Why the document's answer fails.** The two comments now **contradict**. The
`global_meta` comment (rewritten) says the watermark is per-project and each fold
advances only its project's key. The `whisper_stats` WRITER comment (unchanged)
says the fold reads "the project stores'" rows (the plural R5-M2 explicitly named
as "the alternative reading — every fold walks **all** stores") and advances
"`whisper_stats_watermark`" with no `:<key>` suffix — i.e., the single global
timestamp. Read literally, the operative WRITER comment re-encodes **R5-M2's
exact bug**: one bare watermark advanced by a per-project (or all-stores) fold,
stranding every other project's rows older than the new mark. R5-M2's
prescription named this — "Sync AD-5's comment" — and the apply-all-findings pass
updated the *definition* comment and dropped the *operative* comment: the
round-5 P3/R5-M2 fix half-applied, the fix-one-copy-leave-the-defective-rule-
standing pattern (collapse-log 2026-08-13), inside the repair for the timing
variant of the same defect. AD-6's SessionEnd row and AD-23's inventory *were*
synced to "per-project watermark" (round-5 N3/m1 applied — see N-list), which
makes the un-synced WRITER comment the lone survivor and the contradiction sharp.

Bounded below full collapse for R3-M2's own reasons: the raw `whisper_audit`/
`corrections` rows persist per project (nothing is deleted; a corrected fold can
rebuild `whisper_stats` wholesale), and the table is Phase-C demotion/promotion
input, never agent-facing. But the degradation is silent, lands on OL-6's
mainline concurrent multi-repo use, and — because the fix updated the definition
and not the description — is *more* likely to reach a build than the pre-fix
version was, since a careful implementer reads the WRITER comment as the
authority on the writer.

**Class:** wrong-check (the fix verified against the `global_meta` definition it
rewrote, never against the sibling WRITER comment it left standing) + unapplied
review sub-clause ("Sync AD-5's comment" dropped).

**Concrete repair.** Rewrite the `whisper_stats` WRITER comment to match the
`global_meta` definition: "watermarked aggregation folding **the current
project's** `whisper_audit` rows AND corrections newer than
`whisper_stats_watermark:<project_key>`, advancing only that project's key." State
which store each run point reads (both `correct` and SessionEnd execute in one
project's context and read that project's store). The single-writer transaction
discipline carries over per key. Then no reading of AD-5 reinstates the stranding.

### P4 — The same-name false-positive AC-1b fixture asserts "a comment/string match does not inflate a candidate's count past a true rival" against a mechanism that COUNTS comment/string matches and only confidence-caps them — no mechanism prevents the crown, so the fixture is unpassable exactly as round-5 P4's mixed-language fixture was; and the mixed-language comparability gate's structural-0-vs-observed-0 discriminator is unstated

**Where:** AD-24's AC-1b pin (round-5 R5-m4/P4 repair: "a **mixed-language case**
… the set is incomparable, so the fixture asserts **silence** … and a
**same-name false-positive case** (comment/string matches do not crown a false
rival)") × L6 ("`symbol_refs` is an **identifier-match heuristic** whose
false-positive class (same-named symbols, matches in comments and strings) is
stated in every whisper's evidence and **capped in confidence** … AC-1b's fixture
pins … the same-name false-positive case (a comment/string match does not inflate
a candidate's count past a true rival)") × AD-12 (`symbol_refs` = "the count of
other files whose **text** references its identifier **among the files that
import its file** — a deterministic identifier-match heuristic") × AD-15's Reuse
dominance rule ("X is *canonical* when its count **dominates** the runner-up
(≥ k×)").

**Collapse question:** *The charter's standing question, on the fixture round 5
added: name the mechanism sentence that produces "a comment/string match does not
inflate a candidate's count past a true rival." `symbol_refs` is a **text**
identifier-match (AD-12) that counts every occurrence of the identifier — comments
and strings included — in files that import the symbol's file. The crown is
decided by **count** dominance (≥ k×), an axis independent of confidence. So if a
false rival's identifier appears in enough comments/strings of importing files to
push its count past k× the true convention, it is crowned. What mechanism
declines to crown it?*

**Why the document's answer fails.** There is none. The only mitigation the
document states for the comment/string false-positive class is **confidence-cap +
evidence-disclosure** (L6: "stated in every whisper's evidence and capped in
confidence") — and a confidence cap changes the whisper's *stated confidence*,
never *which symbol is crowned canonical*, which the dominance rule decides by
raw count. So a comment/string-inflated rival that dominates by count **is**
crowned (with capped confidence), and the fixture asserts it is **not**. The two
sentences in L6 are in open tension with each other: one says the false-positive
class exists and is merely capped (i.e., comment/string matches **do** inflate),
the other says the fixture shows a comment/string match does **not** inflate past
a true rival (i.e., prevention). The only way to pass the fixture is to place the
comment/string match in a **non-importing** file — excluded by AD-12's "among the
files that import its file" scope — in which case the fixture tests the
importing-files scope, not comment/string exclusion, and its description
("comment/string matches do not crown a false rival") overclaims a general
prevention the mechanism does not have. This is **round-5 P4's exact shape** — a
repair-added fixture asserting behavior no mechanism produces (there it was
"no false crown" over a mixed-language set; here it is "no false crown" from a
comment/string collision) — recurring in the *companion* fixture the same round-5
repair added, applied verbatim from R5-m4's prescription without the mechanism
check the charter now mandates.

The **mixed-language** half of the same repair (the primary P4/R5-m4 fix) does
better but is not clean either: the comparability gate ("a candidate whose
`symbol_refs` support is **structurally absent** … a generic-frontend language
with no `import_edges` — its count sits at 0 **by construction, not by
observation** — marks the set incomparable → silence") **does** produce the
asserted silence, so it is a genuine improvement over round 5's unpassable
version. But its load-bearing discriminator — telling "0 by construction
(generic-frontend, no `import_edges`)" from "0 by observation (a grammar-covered
symbol nothing imports)" — is **unstated**. Both cases store `symbol_refs = 0`;
they are distinguishable only by the candidate's *language/frontend*
(grammar-covered ⇒ import-edge-capable), a `files.lang`→grammar-config join no
sentence names. The cheap reading ("`symbol_refs = 0` ⇒ incomparable") marks an
unimported grammar symbol's whole set incomparable → over-silence — and both the
correct and cheap readings produce silence for the fixture, so the fixture
**cannot discriminate them** (the wrong-check trap). Over-silence is P5-safe,
which is why the mixed-language half is a note (N2), not a partial; the same-name
half asserting unproducible prevention is the partial.

**Class:** unverified (prescription-carried: a fixture assertion with no
producing mechanism — round-5 P4 recurrence, third instance of the
prescription-text lesson this round) + between-decisions (AC-1b/L6's same-name
assertion pinned against AD-12's unrepaired text-identifier-match, which counts
exactly what the fixture asserts is excluded).

**Concrete repair.** Make the assertion true before pinning it, or scope it to
what the mechanism does. Two honest options for the same-name case: (a) **drop the
prevention claim** — the comment/string false-positive class is real, capped in
confidence and disclosed in evidence (L6's first sentence), so AC-1b should pin
*that* ("a same-name comment/string collision fires with the false-positive
caveat in evidence and confidence capped," not "does not crown a false rival"),
and L6's fixture sentence rewritten to match; or (b) **add a real preventive
mechanism** — e.g. exclude comment/string spans from the identifier-match at index
time (an AST/lexer-scoped `symbol_refs` rather than raw text match), which would
change AD-12's definition and let the fixture assert prevention truthfully. For
the mixed-language half, state the discriminator in AD-15's Reuse row: a
candidate is incomparable when its **language is not grammar-covered** (no
import-edge frontend), not merely when its stored count is 0 — and add a fixture
case where an *unimported grammar symbol* (observed-0) is in the set to prove the
gate does **not** over-silence it. Either way, fixture and mechanism must name the
same behavior.

---

## Survived with note

- **N1 — The quote-aware, independently-contributing segment classification
  (round-5 N2/m3 fix) holds end to end.** Re-traced across every command mix:
  `echo "done && npm test"` → the `&&` inside quotes is not a split point → one
  segment, head `echo`, not a runner → no false subtraction, no false "not run"
  (N2's quoted-operator poisoning closed); `npm test && make integration` → `npm
  test` subtracts its mapped target **and** `make integration` (class 3) sets
  run-state unknown → weak claim over the unknown-run target (m3's runner-absorbs-
  unknown gap closed — "segments contribute independently" is the operative
  clause and it does its stated job); `sh -c "npm test"` and a quote-parse
  failure → class 3 wholesale → weak claim (the safe lean). No construction was
  found that converts a real runner invocation into recognized-innocuous or a
  quoted string into a false subtraction. This repair survives its hardest
  question.
- **N2 — The mixed-language comparability gate PRODUCES the asserted silence, but
  its discriminator is unstated and the cheap implementation over-silences
  (safe).** Unlike round-5 P4's unpassable "no false crown" assertion, the round-5
  fix's "incomparable → silence" is a behavior a mechanism can produce (detect a
  structurally-support-absent candidate, decline the crown). The note: "structurally
  absent (0 by construction, not observation)" needs a per-candidate language/
  frontend check the Reuse row does not name; the obvious `symbol_refs = 0` reading
  over-silences unimported grammar symbols; both fail P5-safe. One sentence naming
  the discriminator (language-not-grammar-covered) and one fixture case (an
  unimported grammar symbol not over-silenced) close it. (The same-name half of the
  same fixture is P4, not a note.)
- **N3 — The SessionEnd fold's travel-with-the-mechanism sync (round-5 N3/m1) is
  applied and consistent.** AD-6's SessionEnd row now names "the `whisper_stats`
  watermarked fold (AD-5 … per-project watermark … off every deny-capable path)";
  AD-23's inventory now names "the `SessionEnd`-only fold (AD-5's `whisper_stats`
  aggregation — indexed rows since the per-project watermark, never on a
  deny-capable event)." The desync round-5 N3/m1 flagged is closed at both
  locations. (The residual is the *WRITER-comment* desync in AD-5 itself — P3 —
  which is a different sentence than the AD-6/AD-23 rows this note covers.)
- **N4 — The regret proxy's designed-silence floor label (round-5 N1(b)) is
  applied.** AD-18 now states "the **designed silence at a run-and-failed
  done-claim (the D-27/FR-A2m routing) is self-counted here** … so the regret rate
  carries an expected non-zero floor from that subcase and is never misread as
  pure miss." This is the one sentence round-5 N1(b) asked for; a non-programmer
  reading a non-zero Phase A regret rate is told part of it is expected-by-design,
  not malfunction. Survives.
- **N5 — "Tended via `ctxoracle tune`" (the round-5 N4/m5 lexicon-config-home
  fix) is not backed by AD-20, which still defines `tune` as a number-writer.**
  Clause (iv) and L1 now say the config-enumerated lexicons are "config-enumerated
  in `tuning`, **tended via `ctxoracle tune`**," naming the home round-5 m5 asked
  for. But AD-20 still defines `tune <key> <value>` as "the plain-language writer
  for every **number** this document marks tunable" — a lexicon is a list, not a
  number, so `tune lexicon.communicative +summarize` is an operation AD-20 does not
  authorize. Round-5 m5 asked to "name the writer (`tune` extended to list-valued
  keys, or an explicit statement that lexicon changes are build-time)"; the home
  was named and the writer's capability left contradicting AD-20. Bounded (the
  lexicon-tending mitigation shrinks an *under-enforcement* loss, already the safe
  direction — if tending is inoperable the loss merely persists, safely). One
  sentence in AD-20 (extend `tune` to list-valued keys) or one in clause (iv)
  (lexicon changes are build-time) closes it.

---

## End-to-end re-traces

- **The OL-12 mainline (edit → covering test fails → done-claim), every layer,
  under the round-5 text.** `PreToolUse` Edit → Consequence/Warning fire pre-edit
  (coupled tests named — the right moment). Edit ok → `PostToolUse` `'ok'` row.
  `npm test` fails → `PostToolUseFailure` → `observed_actions` `'failed'` row
  (`command_class`=runner, set unconditionally, AD-6). Done-claim `Stop` →
  Verification: changed regions from `'ok'` rows → covering tests → minus runs
  **of either outcome** → the failed run subtracts → **neither "not run" nor "no
  recognized run" emitted**: Phase A stays silent, the run-and-failed done-claim
  routed to FR-A2m/Phase B per D-27 — the thrice-buried rumor stays dead under the
  round-5 text (the AD-4 filter's run-state bucket and AD-6's unconditional-failed
  wiring both hold). At `SessionEnd` the regret proxy records the held-fact/
  failed-covering-test silence via its 'failed' clause, and `status` labels it with
  the round-5 designed-silence floor (N4). **The mainline holds.** Residual on this
  path: the re-edit clause's absence from AD-4's filter (P2) and `deny_bypass_suspect`'s
  bucket (P2) touch the *diagnostic* layer, not the mainline whisper decision.
- **The full object-classification corpus, including round-5 additions and
  adversarial cases.** "can you rename the helper?" → non-communicative verb →
  request-frame remainder → `request`, rename-edit free ✓. "can you show me a
  demo?" → communicative + `demo` → `request` (via artifact-lexicon *or* default —
  indistinguishable, P1 note) ✓. "can you show me the error?" → communicative +
  `error` (info-object) → `info`, deny-capable, fulfilment text/Read ✓. "could you
  summarize the error?" → `summarize` not communicative → remainder → `request`,
  the documented loss ✓. **Round-5 additions:** "can you show me a **prototype**?"
  → unlisted object → default `request`, prototype-build free ✓ (round-5 P1 flip
  works). "could you tell me why the login **test** fails?" → wh-complement "why…"
  precedence over `test` → `info`, deny-capable ✓ (round-5 S1 bag-of-words disarm
  prevented). "could you confirm the **version** number?" → communicative +
  `version` (info-object) → `info` ✓. **Adversarial cases:** *build-fulfilled
  unlisted noun* — "can you show me a mockup/benchmark/migration?" → unlisted →
  `request`, build free ✓ (round-5 flip holds for the whole open noun class).
  *wh-complement hiding an artifact noun* — "could you tell me how the demo is
  built?" → wh-complement precedence → `info`, fulfilment text ✓. *action-request
  outside the frame* — "any chance you could add a test?" (you-then-modal, not the
  modal-then-you frame) → non-request-frame → `info` → the fulfilling build is
  **wrongfully denied**: L1's disclosed single member shape, and a large one
  (every polite/indirect action-request phrasing lands here) — disclosed, bounded,
  escapable ✓. *rhetorical interrogative* — "why is CI always so flaky?" (escapes
  the small stoplist) → `info` → a subsequent/co-prompted edit **wrongfully
  denied**, and this is **not** "an action-request outside the frame" → **P1**.
  *compound-noun head* — "can you show me the **test results**?" head is `results`
  (info) but a first-noun implementation reads `test` (artifact/default →
  `request`); "head noun" is unspecified for attributive compounds (`test results`,
  `error log`, `demo script`) — safe either way (both readings bounded), recorded
  as a minor under-specification one level below round-5 S1's object rule.
- **The Reuse dominance path in a mixed-language repo.** Candidate set =
  {generic-frontend symbol S (true convention, `symbol_refs`=0 by construction),
  grammar-covered rival R (count M ≥ 1)}. The comparability gate detects S's
  structurally-absent support → set incomparable → **silence**. The fixture
  asserts silence; the mechanism produces it ✓ — but by a discriminator the row
  does not name, and one that the fixture cannot distinguish from the over-
  silencing `symbol_refs = 0` reading (N2). The **same-name** fixture on the same
  row asserts "a comment/string match does not crown a false rival," which the
  text-identifier-match `symbol_refs` (counting comment/string occurrences in
  importing files) does **not** produce — confidence-cap does not un-crown a
  count-dominant rival → **P4**.
- **Verification across command mixes ("segments contribute independently" end to
  end).** Innocuous-only → strong "not run" fires ✓ (honest — no runner ran).
  Recognized runner pass/fail → subtracts, either outcome ✓. Unknown runner
  (`make check`) → class 3 → run-state unknown → weak claim ✓. Quote-embedded
  operators → quote-aware split, no false segment head ✓ (N1). Runner+unknown
  compound (`npm test && make integration`) → `npm test` subtracts its target AND
  `make integration` composes the weak claim ✓ (m3 closed). `cd pkg && npm test` →
  runner segment subtracts; `cd pkg && make check` → class 3 weak claim ✓ (both
  fixture-pinned). "Segments contribute independently" holds; no mix produces a
  false "not run" or a false subtraction.
- **§8 deny-confinement property walk on the round-5 text.** The round-5 diff
  touches AD-5/AD-6/AD-23 (the SessionEnd fold — no deny channel), AD-9 clause
  (iv) (classification only — and it *shrinks* the deny-capable set: unlisted
  objects now → `request`, removing them from `info`), AD-15 (whisper genres),
  AD-18 (diagnostic), AD-24/L1/L6/Status (fixtures and disclosures). It never
  reaches AD-10's single deny producer (`blocks/verdict.ts` ← `blocks/
  answer_drift.ts`), the deny-eligibility predicate (open `kind='info'` question +
  mutating file tool), reactive-only, text-never-denied, self-clearing/no-counter,
  the lag clause's clear-axis-only scope, or per-consumer scope. The one place the
  round-5 change *adds* deny-capability — the wh-complement rule sending "why the
  test fails?" to `info` — is a **restoration** of round-3 C1's correct
  deny-capability that round-4's bag-of-words reading had erroneously removed, not
  a new call site. **No new deny path; the confinement holds unchanged.**

## Between-decisions consistency of every round-5 addition

Object mechanism (direct-object head + wh-complement precedence + info/artifact
object lexicons + unlisted→`request`) — AD-9 clause (iv) ✓ / AD-24 corpus
(prototype, login-test, version) ✓ / L1 restated ✓ / AD-9 rationale "exactly one
member shape" ✗ (P1 — rhetorical-escape shape) / Status "all four lexicons" vs
clause (iv) "two config-enumerated lexicons" ✗ (P1 — count drift) / artifact-object
lexicon vestigial, AC-24 cannot fail without it ✗ (P1 note). Regret outcome
semantics — AD-18 ✓ / AD-4 CONSUMER FILTER ✗ (P2 — re-edit clause never added to
the canonical enumeration) / `deny_bypass_suspect` bucket ✗ (P2). Per-project
watermark — `global_meta` comment ✓ / AD-6 SessionEnd row ✓ (N3) / AD-23 inventory
✓ (N3) / `whisper_stats` WRITER comment ✗ (P3 — "the project stores'" + bare
`whisper_stats_watermark`). Comparability-gated dominance — AD-15 Reuse row ✓
(produces silence) / discriminator unstated ✗ (N2) / L6 ✓-ish / AC-1b mixed-language
silence ✓ / AC-1b same-name "no false crown" ✗ (P4). Quote-aware segment
classification — AD-15 ✓ / AD-24 compound + quoted fixtures ✓ (N1). Lexicon config
home — clause (iv)/L1 "tended via `tune`" ✓ / AD-20 `tune` = number-writer ✗ (N5).
SessionEnd fold in AD-6/AD-23 latency inventory ✓ (V6 budget, off deny-capable
path). Status §"Review round 5" — verdict counts (0 Critical/1 Serious/2 Moderate/
5 Minor; 0 collapses/4 partial/5 notes) match both round-5 files ✓; the
applied-fix enumeration located item by item in the diff ✓; convergence
explicitly **not** claimed ✓ ("the round-5 fixes are themselves unattacked … the
next action … is a round-6 pair"). `tools/check_docs.py` — run this session,
passes on the current tree (see below).

## Owner-fidelity scan of the round-5 text

Every owner/spec key the round-5 diff added or moved was re-read against its row
at its point of use. **No rejected item reintroduced.** Clause (iv) remains a
positive total classification (OL-R5's directive — define positively, never by
exclusion — is honored; the round-5 default flip moves lexicon-incompleteness
*toward* the tracked side for the verb/object lexicons; P1's rhetorical-stoplist
direction is a disclosure-accuracy defect, not a negative-space definition). The
deny still requires an open `kind='info'` question plus a mutating file move
through AD-10's single confined producer — **no pre-emptive gate** (OL-C2/OL-R4):
the round-5 changes are all reactive classification. **No generated-file
consumption** on any deny input. **Arbitrary-limit scan (OL-C1/OL-R1/OL-R3):**
round 5 introduced no operating number — the info-object and artifact-object
lexicons and the wh-complement rule are classification vocabulary gating what is
*asserted or deny-capable*, never how much is spoken; the comparability gate adds
no numeric cap (the `k×` dominance ratio is pre-existing and tunable, not new);
the per-project watermark is a timestamp; the SessionEnd fold "schedules
aggregation, never speech." No volume/count/budget cap anywhere in the diff.
**No separate credentials, no repo-tree write** introduced (the fold writes the
global store, outside the tree). **No new `OL-*` key manufactured, no owner
superlative introduced;** the OL-C3/OL-C5 uses in clause (iv) and L1 are unchanged
from round 5 and still supported by their CONFIRMED rows ("actions taken to
provide an answer" is the protected class the request-frame handling honors). The
Status paragraph's review citations match both round-5 files' verdict lines.
Clean, with the one caveat that "all four lexicons fail toward under-enforcement"
(Status) is a *false* universal (P1), but it is a fidelity-to-the-mechanism defect,
not an owner-attribution defect.

## Round-5 repairs that survived their hardest question without a finding

The quote-aware, independently-contributing segment classification (N1 — traced
across every command mix; no false "not run", no false subtraction, quote-parse
and `sh -c` failures fail safe to class 3). The SessionEnd fold's sync into AD-6
and AD-23 (N3 — both the event row and the latency inventory name the fold and its
per-project-watermark bound, off every deny-capable path, within V6). The regret
proxy's designed-silence floor label (N4 — the one sentence that keeps a
non-programmer from reading the D-27/FR-A2m Phase-A gap as malfunction). The
regret re-edit clause's **outcome semantics themselves** (AD-18: `'ok'`-only for
re-edit, `'failed'` for covering-test — the semantics are correct; the defect is
that they live outside AD-4's canonical enumeration, P2, not that they are wrong).
The mixed-language comparability gate's **silence production** (the primary P4
fix — it produces the asserted silence, unlike round-5's unpassable version; the
residual discriminator and the same-name companion are N2/P4). The §8 deny
confinement (walked above — untouched, and the diff only shrinks the deny-capable
set). `tools/check_docs.py` passes on the current tree, run this session.

---

*End of round-6 hunt. Zero full collapses — the second consecutive zero-collapse
round — but four partial collapses, every one inside round-5 repair text and
every one a named collapse-log lesson recurring: a false universal still standing
in a lexicon repair via a different fallible list (P1, fifth recurrence of the
round-1-S2 → round-5-P1 shape); a terminating enumeration repaired one decision
away from the canonical location it was found missing from, with a mis-bucketed
reader beside it (P2, the round-2-P3 incomplete-inventory shape, second
occurrence); a per-project scoping sub-clause applied to the definition comment
and dropped from the operative one, re-encoding the exact bug it fixed (P3, the
fix-one-copy pattern); and a prescription-carried fixture asserting behavior no
mechanism produces (P4, round-5-P4's exact shape in the companion fixture the same
repair added). The collapse-log's prescription-text lesson (a reviewer's repair
carries no verification of its own) is validated three more times this round (P2,
P3, P4 each entered as a verbatim or half-applied round-5 prescription). This is
**not** the terminal round: the counts bar the terminal call, and the convergence
definition (a round that finds nothing real) is unmet. The inheritance for round 7:
(1) **P1's rhetorical-stoplist shape and P4's same-name fixture are both the "does
a mechanism produce the asserted behavior?" question answered NO** — carry it as
the standing charter question, now proven to catch defects two rounds running.
(2) **When a fix names a location ("add to the filter", "sync AD-5's comment",
"per-project"), verify the fix landed in that exact location, not one decision
away** — P2 and P3 are both fixes applied adjacent to, not at, the sentence the
finding named. (3) **Re-audit AD-4's CONSUMER FILTER as the canonical
`observed_actions` enumeration** — it is the enumeration the collapse-log corollary
governs, and after round 5 it is still missing the tenth reader and mis-buckets an
eleventh.*
