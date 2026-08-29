# Round-5 expert review — Phase A architecture (round-4 fix verification + new-defect hunt)

**Artifact:** `docs/architecture-phase-a.md` as of commit `33e0648` ("apply all
round-4 review findings"), diffed against the round-4-reviewed draft (`ee90c31`).
**Reviewer:** independent session, not the author of the document or of any prior
review. Read in full before the attack: `middleware/context-oracle/CLAUDE.md`,
`OWNER-LEDGER.md`, `docs/specs/spec-context-oracle.md`, `docs/collapse-log.md`
(including the new 2026-08-29 entry), all eight 2026-08-29 review records, the
revised architecture end to end, and the full round-4 fix diff.
**Axis per the round-5 charter:** verify every round-4 finding's fix (resolved,
swept everywhere, no new contradiction), hunt new defects inside the fixes —
attacking reviewer-prescribed repair text exactly as author text, per the
collapse-log's new 2026-08-29 lesson — hand-check the new load-bearing citations
(D-27/FR-A2m in the consumer filter; the OL rows in the reworked clause (iv)),
re-establish the external premise the fixes lean on, check the collapse-log
entry's own accuracy as a current-authority document, and re-check owner
constraints on the new mechanisms. Every check below was run in this session;
nothing is carried forward from the author's attestations or prior rounds'
claims without re-derivation. Findings were not manufactured to avoid an empty
report; the convergence bar was applied as stated — an empty findings list with
enumerated clean checks would have been a legitimate PASS, and this round is
not it.

## VERDICT: NEEDS FIXES — 0 Critical / 1 Serious / 2 Moderate / 5 Minor

Every round-4 finding is resolved in substance except one half-applied Minor
(R4-m5, charged below as m4) — none renamed, none disclosed-instead-of-fixed —
and the three swept sentences are swept clean (sweep list at the end). Where
the two round-4 reviews prescribed conflicting repairs for the same defect
(the run-and-failed whisper: the collapse-hunt prescribed composing "ran and
failed"; the expert review licensed plain subtraction per P5), the author took
the expert branch and grounded it on D-27/FR-A2m — a citation this review
hand-checked and finds supported. The Serious and the first Moderate are new
defects inside the round-4 clause-(iv) repair — the recorded
fix-forecloses-adjacent-axis shape, now in its fourth round, both living in the
new **artifact-object noun lexicon**, the one piece of round-4 repair machinery
that neither round-4 prescription fully specified. The second Moderate is the
watermark fold's scoping under multi-project use, where the round-4 prescription's
own per-project hint was dropped. Nothing reaches the deny producer's
confinement, the owner's structural constraints, or the phase boundary.

---

## Serious

### R5-S1 — "With a repo-artifact object" has no stated mechanism: the natural containment reading re-disarms deny-capability for polite info questions that mention a repo artifact — round-3 C1's own harm class, re-opened by round-4's fix for round-4 P1, and the fixture corpus cannot see it

**Location:** AD-9 intake clause (iv), second bullet (lines ~742–757: "A
communicative verb **with** a repo-artifact object noun (demo / test / script /
example / branch / file / PR-class — a second small closed lexicon) classifies
`kind='request'`") × AD-24's round-4 lexicon corpus (lines ~1640–1645) × L1.

**What is wrong.** The round-4 fix's load-bearing discriminator — communicative
verb *with* vs *without* a repo-artifact object — is a grammatical predicate
("object"), and no sentence in the document states how it is computed. The two
cheap deterministic mechanizations diverge exactly on the class the block
exists for:

- **Containment matching** (a lexicon noun appears in the sentence after the
  verb — the most literal cheap implementation of "with a repo-artifact object
  noun"): "could you tell me why the login **test** fails?" contains `test`;
  "can you tell me what this **file** does?" contains `file`; "can you explain
  why this **branch** diverged?" contains `branch`. Each classifies
  `kind='request'` — tracked, never deny-capable. These are pure information
  questions in the dominant polite phrasing, and `test`, `file`, and `branch`
  are all *in* the shipped noun lexicon — in a coding repository, most info
  questions name a repo artifact. Under this reading the round-3 C1 repair
  (communicative-verb forms stay deny-capable) is silently un-done for the
  bulk of its own class: the block disarms whenever the polite question
  mentions the thing it asks about.
- **Adjacency matching** (the lexicon noun is the verb's direct object — the
  head noun directly following verb [+ optional `me`/`us` + article]): "show me
  a **demo**" matches; "tell me why the test fails" does not (the object slot
  holds a `why`-clause). This reading preserves round-3 C1's fix and is equally
  cheap — but nothing in the document selects it.

The wrong-check trap completes the finding: AD-24's round-4 corpus
discriminates only on the noun's identity ("show me a **demo**" vs "show me
the **error**" — identical adjacency positions), never on its position, so
both implementations pass every pinned case; the one pinned
communicative-verb info question ("could you tell me why X fails?") uses an
abstract X that matches no lexicon noun. A containment implementation ships
green while the block's deny-capability for artifact-naming info questions is
gone. This is the round-4 P2 class verbatim — a class predicate asserted, a
mechanism that cannot (or need not) compute it, with the divergence unpinned —
landing this time on the block's owner objective rather than on a whisper
genre, which is why it is graded Serious. The recognizer word-lists are
implementation vocabulary (Gate A's stated scope), but the *object rule* is
structure, not vocabulary — the same round-4 batch treated the analogous
command-classification unit (per-segment splitting) as architecture and gave
it a sentence; the object rule got none.

**Fix.** One sentence in clause (iv): the repo-artifact object is matched
**positionally** — the noun phrase directly following the communicative verb
(after an optional `me`/`us` and article) must head with a lexicon noun; a
lexicon noun elsewhere in the sentence (inside a subordinate/interrogative
clause — "tell me why the test fails") does not make the ask a `request`. Add
the discriminating pair to AD-24's corpus: "could you tell me why the login
test fails?" → `info`, deny-capable (a lexicon noun in the clause, not in the
object slot); "can you show me the test?" → `request` (lexicon noun in the
object slot — the documented under-enforcement direction). The corpus then
forces the adjacency reading no matter who implements it.

---

## Moderate

### R5-M1 — "The residual wrongful-deny class has exactly one member shape" is a false universal: the noun lexicon's own incompleteness creates a second member (communicative verb + unlisted artifact noun), and the requantified rationale plus L1's ledger both exclude it

**Location:** AD-9 deny-decision rationale (lines ~848–853: "exactly one
member shape after the round-4 default fix: an action-request **phrased
outside the request frame entirely**") × clause (iv) second bullet ("**without
a repo-artifact object** classifies `kind='info'` — its fulfilment is text") ×
L1 ("**The wrongful-deny residual** is the action-request phrased outside the
request frame entirely").

**What is wrong.** The round-4 default flip closed the unlisted-*verb*
wrongful-deny path (remainder → `request`), but the artifact-object noun
lexicon it introduced is itself a small closed list (demo / test / script /
example / branch / file / PR-class), and its incompleteness fails in the
**opposite direction**: a communicative verb whose object is an artifact noun
the lexicon does not list — "can you show me a **prototype**?", "could you
show me a **benchmark**?", "can you show me a **mockup**?" — is treated as
"without a repo-artifact object" and classifies `kind='info'`, deny-capable.
The agent's `Edit` building the prototype — OL-C5's protected fulfilment
move — is then denied with "answer Max's question first": a second member
shape of the wrongful-deny residual, *inside* the request frame. Three
sentences now overclaim against it: the rationale's "exactly one member
shape"; clause (iv)'s requantified "its fulfilment is text" (true of the
verb-without-listed-noun *mechanism class* only if the noun lexicon is
complete, which a closed lexicon structurally is not — the same shape as the
round-4 P1 universal, one lexicon down); and L1's wrongful-deny residual,
which names only the outside-the-frame member. `--missed-question` inherits
the blind spot (Max reporting a dropped "can you show me a prototype?" arms a
deny against the fulfilling move, and the CLI's three-limit clause has no
category for it). The *default direction* itself is defensible — an unlisted
noun defaulting to `info` preserves enforcement for the dominant info-like
objects ("the error", "the logs", "the diff"), and flipping it would recreate
round-3 C1 for them — so the mechanism can stand; the defect is that the
design picked this lean and, in R4-M1's own words, owned nothing: harm is
bounded (escapable by one answering turn, counted on the wrongful-deny rate
when corrected), which is why this is Moderate, but the disclosure no longer
matches the class it discloses — this project's most-recorded failure.

**Fix.** Requantify to what the mechanism computes: the residual wrongful-deny
class has **two** member shapes — the action-request phrased outside the
request frame ("mind fixing X?"), and the communicative-verb ask whose doing
object the noun lexicon does not list ("can you show me a prototype?") — both
escapable, both measured on the wrongful-deny rate, the second shrunk by
tending the noun lexicon. State it in the rationale sentence and L1; drop
"exactly one member shape"; scope clause (iv)'s "its fulfilment is text" to
"the dominant use of these verbs, approximated by the noun lexicon and erring
toward deny-capable for unlisted objects". Add "can you show me a prototype?"
to AD-24's corpus with its expected (wrongful-deny-side, documented) cost.

### R5-M2 — The watermark fold under multi-project operation: a single global `whisper_stats_watermark` advanced by per-project folds silently under-counts every other project's unfolded rows, and the fold's store reach is an implementer disjunction — the per-project scoping the round-4 prescription itself flagged was dropped

**Location:** AD-5 §1, `global_meta` + `whisper_stats` WRITER comment (lines
~560–588).

**What is wrong.** The round-4 fix names the watermark's home
(`global_meta.whisper_stats_watermark` — one key, one timestamp) and the fold's
inputs ("the project stores' whisper_audit rows … AND corrections newer than
whisper_stats_watermark") and run points (`correct`, SessionEnd). But `correct`
and SessionEnd each execute in **one project's** context, while the watermark
is **global**: with two projects' sessions running concurrently (the design's
own stated world — OL-6's multi-repo scope, and the dominant post-hoc
correction timing), project A's SessionEnd fold advances the shared watermark
past project B's already-written-but-unfolded audit rows, which B's next fold
("newer than the watermark") then never picks up — `sent` and correction
counts silently under-count, per genre, in the efficacy table Phase C's
demotion/promotion consumes. The comment's plural "the project **stores'**
whisper_audit rows" admits the alternative reading (every fold walks all
project stores, which makes the single watermark coherent at an unstated
multi-store SessionEnd cost) — an unresolved disjunction whose branches differ
in system behavior, the exact class round-4 P3 flagged, recreated inside its
repair. R4-m2's prescription explicitly said "worth stating the watermark's
per-project scoping in the same breath (corrections live in project stores;
the fold writes the global store)" — the named-home half was applied and the
scoping half dropped. Bounded below Serious for R3-M2's own reasons (raw
`whisper_audit`/`corrections` rows persist per project; the aggregate is
recomputable; nothing is emitted falsely), but the degradation is silent and
lands on mainline concurrent use, not an edge.

**Fix.** Make the watermark per-project and put it where the folded rows live:
a `schema_meta` key in each **project** store (e.g. `stats_folded_through`),
read and advanced by the fold that walks that store — each fold then reads one
project store (the current one), folds its rows newer than its own watermark
into the global `whisper_stats` (keyed by `project_key` as the table already
is), and advances only that project's mark. `global_meta` keeps any genuinely
global keys; the disjunction disappears (each fold's reach is exactly the
store in hand), and concurrent projects cannot starve each other. Sync AD-5's
comment.

---

## Minor

### R5-m1 — The fold's own travel-with-the-mechanism rule is not applied to the placement the fix chose: SessionEnd is a handler event, and neither AD-6's SessionEnd row nor AD-23's inventory names the fold

**Location:** AD-5 WRITER comment ("run at exactly two points … and the
SessionEnd flush — NEVER on tool events; if a handler-event placement is ever
chosen instead, it must be added to AD-23's inventory and AD-6's row for that
event") × AD-6 SessionEnd row (line ~642: "flush/finalize session diagnostics
row") × AD-23's inventory (ends at "the `SessionStart`-only items").

The conditional's own discipline indicts the chosen branch: SessionEnd *is* a
handler event, the fold now runs there (a global-store open plus a cross-store
aggregate — two blocking calls on an event sharing V6's 1.5 s budget), AD-6's
event table is titled "Events wired, and what runs on each," and its
SessionEnd row still names only the diagnostics flush; AD-23 claims "every
blocking call on the event path, with its bound" and lists nothing for
SessionEnd. The latency substance is small (V8's ~2 ms open; the fold is
O(new rows)) — this is the m-R4/R3-m1/R4-m1 desync class, not a breach — but
the inventory's completeness is the stated basis of the fail-closed argument,
and the fix's own sentence promises exactly this sync for handler-event
placements. Two one-line edits (name the fold + its bound in AD-6's SessionEnd
row and AD-23's inventory), or an explicit statement of why the SessionEnd
flush is exempt.

### R5-m2 — "Any verb in *neither* lexicon" quantifies over a verb lexicon that no longer exists: round-4 removed the doing-verb lexicon, and two surfaces still speak as if it is there

**Location:** AD-9 clause (iv), third bullet ("The **request-frame
remainder** — any verb in *neither* lexicon"); L1 ("the request-frame
remainder with a verb in neither lexicon"); Status section ("unlisted
doing-verbs are never wrongfully denied").

After the round-4 rework, the document contains exactly one verb lexicon (the
communicative lexicon) — the second lexicon is a **noun** lexicon, which no
verb can inhabit — and the round-3 doing-verb list
(fix/add/implement/refactor/update-class) is gone, correctly made redundant by
the remainder default. "Neither lexicon" therefore has no coherent referent,
and "unlisted doing-verbs" implies a doing list an implementer will hunt for
and not find. One-phrase fix at the three locations: "any verb not in the
communicative lexicon". (The classification itself is total and consistent —
all four corpus cases re-derive correctly under it; this is wording, not
mechanism.)

### R5-m3 — Per-segment classification composes to a single command class, so a runner segment absorbs a sibling unknown segment: `npm test && make integration` re-licenses the strong "not run" clause for whatever the unknown segment ran

**Location:** AD-15 Verification row (the per-segment sentence).

The round-4 P2 fix states segment rules ("recognized-innocuous requires
**every** segment's head on the allowlist; any segment matching the runner
lexicon classifies **the command** as a run of that runner") that resolve to a
per-command class. A compound with both a runner and an unknown segment
(`cd pkg && npm test && make integration`) classifies as a run of `npm test`;
the `make integration` segment's unknown-shape then never trips the class-3
weaker-claim branch, and — in a session with no other unknown command — the
strong "not run" clause can fire over a test only the unknown segment ran.
The quoting/escaping edges of the splitter all fail safe (a distorted head
lands in class 3 → the weaker claim — checked below), and this mixed case
needs a runner and a test-running unknown on one line, so it is a corner, not
round-4 C1 back — but the composition rule is one sentence from airtight:
segment classes compose **independently** (runner segments subtract; any
non-innocuous, non-runner segment still sets the session's unknown flag;
innocuous segments contribute nothing). Add `npm test && make integration` →
weaker claim to the AC-8 set.

### R5-m4 — R4-m5 half-applied: the mixed-language case was added to AC-1b's pin, but L6 still claims *both* Reuse consequences are "measured against AC-1b's fixture" and the identifier-match false-positive class has no pinned case

**Location:** L6 (final sentence) × AD-24's AC-1b pin.

R4-m5's finding named two unpinned consequences (the identifier-match
false-positive class; the mixed-language skew) and its prescription's
parenthetical exampled only the second; the fix applied exactly the example.
The mixed-language case is now pinned (clean), but no fixture exercises the
false-positive class (a same-named symbol in comments/strings inflating
`symbol_refs`), while L6's "both stated in the whisper's evidence and
**measured against AC-1b's fixture** rather than assumed benign" still
quantifies over both. This is the charter's prescription-text lesson in
miniature: fidelity to the reviewer's example is not resolution of the
finding's substance. Either add the false-positive case (a fixture where a
comment-string collision would crown the wrong symbol, asserting the evidence
sentence and no false crown) or scope L6's sentence to "the skew measured
against AC-1b's fixture; the false-positive class stated in the whisper's
evidence and confidence-capped".

### R5-m5 — "Config-extensible" lexicons have no named config home or owner surface, and L1's mitigation now leans on "tending" them

**Location:** AD-9 clause (iv) ("a small closed, config-extensible lexicon";
the noun lexicon "a second small closed lexicon") × L1 ("shrunk by tending the
config-extensible lexicon") × AD-15 ("classes 1 and 2 are config-enumerated")
× AD-20 (`tune` writes *numbers*).

Round 4 made lexicon-tending a load-bearing mitigation (the accepted
under-enforcement loss is "shrunk by tending the config-extensible lexicon"),
but no decision names where lexicon config lives or which surface edits it:
`tune <key> <value>` is defined as "the plain-language writer for every
**number** this document marks tunable," the store rejects config files
(AD-5 §4), and the owner is a non-programmer (OL-11). "Tending" is currently
an operation no specified surface can perform — the round-2 P4 "tunable with
no tuner" class, for vocabularies. One sentence fixes it: name the home (e.g.
lexicon rows in `tuning` with list values, or a named config table seeded at
`init`) and the writer (`tune` extended to list-valued keys, or an explicit
statement that lexicon changes are build-time and the mitigation is re-scoped
accordingly).

---

## Round-4 finding resolution table

"Resolved" = fixed in substance, swept, no surviving contradicting copy,
except where a note points at a finding above. (CH = round-4 collapse-hunt;
ER = round-4 expert review; the two top findings overlap pairwise.)

| Round-4 finding | Status in `33e0648` | Where / notes |
|---|---|---|
| CH C1 = ER R4-S1 (consumer filter resurrects the run-and-failed false "not run"; AD-4/AD-6 contradiction) | **Resolved** | AD-4's filter split by what a failed action *is* per consumer (change/read: 'ok'-only; run-state — the FR-A2g subtraction, the "no recognized run" survey, **and** the class-3 unknown scan (C1's secondary leak) — either outcome; FR-L4 + diagnostics keep 'failed'). AD-15 and AD-6 synced; AD-16 read-set consistent; AC-8 fixture pins run-and-failed → neither "not run" nor "no recognized run". The two prescriptions conflicted (CH: compose "ran and failed"; ER: plain subtraction suffices per P5) — the author took the ER branch and grounded the Phase A silence on D-27/FR-A2m; hand-checked and supported (see clean checks). Every reader of `observed_actions` enumerated this session against the split — consistent (list in clean checks) |
| CH P1 = ER R4-M1 (communicative-verb universal false for medium-setting objects; neither-lexicon default wrongful-deny; residual ledgers stale) | **Resolved, new defects** | Artifact-object noun lexicon added; request-frame remainder default flipped to `request`; L1 restated in both error directions; all four corpus cases pinned and re-derived consistent this session. New: the object rule's missing mechanism (R5-S1) and the noun lexicon's own unowned residual (R5-M1) |
| CH P2 (head-matching cannot compute "cannot run tests"; `cd pkg && npm test` masquerades innocuous) | **Resolved, one composition edge** | Per-segment classification with the `sh -c`-wholesale rule; both compound fixtures added. Quoting/escaping edges fail safe (checked). Edge: mixed runner+unknown compounds (R5-m3) |
| CH P3 = ER R4-m2 (watermark homeless; aggregation placement a disjunction; `sent` writer-less; AD-23/AD-6 unsynced) | **Resolved, residuals** | `global_meta.whisper_stats_watermark` named; fold reads audit rows **and** corrections; two fixed run points, never tool events; travel-with-mechanism constraint stated. New/residual: the per-project scoping the prescription flagged was dropped (R5-M2); the chosen SessionEnd placement itself not carried into AD-6/AD-23 (R5-m1) |
| CH N1 = ER R4-m1 (AD-6's "parsed from" precondition reading) | **Resolved** | AD-6 row: `outcome='failed'` set unconditionally by the event; parse is best-effort enrichment; "parsed from" — 0 hits in the document |
| CH N2 (`detail_json` receptacle missing; render presumed a whisper entry) | **Resolved** | `session_log.detail_json NULL` in AD-4; AD-9 writes counted questions there; `ctxoracle log` defaults to the most recent session and renders **whether or not any whisper fired at that Stop**; AD-20's verb signature consistent |
| CH N3 ("counted on the wrongful-deny side" overstated for the marker-absent class) | **Resolved** | "escapable, auditable on the FR-X6 trail, and counted when corrected (the automated detectors cannot see it)" in all three homes — AD-9's intake-row validation, T2 (both passages), L11; "counted on the wrongful-deny side" — 0 hits |
| CH N4 (`--missed-question` collision output missing the kind-coverage limit) | **Resolved** | AD-18 names all three limits (intake / move / kind coverage), each in plain language |
| ER R4-m3 (class 3 cannot be config-enumerated; unmatched default unstated) | **Resolved** | "classes 1 and 2 are config-enumerated, class 3 is the default complement", with the unsafe-direction rationale stated |
| ER R4-m4 (AD-9's catch-up bound missing the marker-carrying qualifier) | **Resolved** | "if a **marker-carrying** platform-injected turn ever fires `UserPromptSubmit` … at most one catch-up"; the T2 copy carries it too |
| ER R4-m5 (L6's "measured against AC-1b's fixture" had no pinned case) | **Partially resolved** | The mixed-language dominance case is pinned in AD-24. The identifier-match false-positive class remains unpinned while L6 still says "both … measured" (R5-m4) |

## Checks run that came back clean

- **Mechanical floor:** `python3 middleware/context-oracle/tools/check_docs.py`
  → "context-oracle doc-consistency check passed" (exit 0) on the current
  tree, run this session.
- **The three swept sentences (grep + read, whole document):** "parsed from" —
  0 hits (the AD-6 unconditional-`failed` sweep). "counted on the
  wrongful-deny side" — 0 hits (the N3 precision, present in all three homes).
  The marker-carrying qualifier — present on both copies of the
  at-most-one-catch-up bound (AD-9 and T2). Also swept: "any handler event" —
  0; "fully enforced" — 0; "action-request phrased outside the request
  pattern" (the stale residual wording) — 0; the old one-rule filter text — 0;
  "the requested act is text" — survives only inside the quotation *of* the
  round-4 finding that falsified it (benign).
- **Premise re-establishment (this session, not carried forward):** the
  round-4 diff introduces **no new external premise** (verified against the
  diff: no new V row, no new contract claim — the fixes are internal design
  plus V19 already in the table). V19 nonetheless re-fetched from the current
  hooks reference (code.claude.com/docs/en/hooks via Context7): "The
  PostToolUseFailure hook runs when a tool that started executing fails … does
  not fire for tool calls rejected prior to execution, such as … permission
  denials" — confirmed; "For Bash and PowerShell tools, the error output
  generally begins with an exit code line" — confirmed verbatim (the hedge the
  unconditional-append rule leans on); the docs' example payload is a failing
  `npm test` with `error: "Exit code 1…"` — confirmed. Every V19 quotation in
  the fix text matches.
- **Citation integrity of the new text (hand-checked against spec/ledger/review
  records read in full):** **D-27/FR-A2m in the consumer filter and AD-15**
  ("the run-and-failed done-claim is FR-A2m's Phase B territory per D-27") —
  supported: D-27's text routes "the general 'unfinished' case" to Phase B,
  and FR-A2m's spec row is defined as the done-claim case "**beyond the
  unrun-test case FR-A2g catches**" — a run-and-failed covering test is
  exactly beyond it (the test *was* run); FR-A2g's own limit clause ("catches
  *unverified* … not this one") agrees, and the resulting Phase A silence is
  consistent with AC-8's letter ("does not fire merely to name a test that
  ran") and with P5 (the failure output was the agent's own tool result).
  **OL-C5 in the reworked clause (iv) and rationale** ("denying on it would
  deny exactly the move OL-C5 protects") — the CONFIRMED row's protected class
  ("actions taken to provide an answer") supports the use. **OL-C3** (the
  escalation re-ask staying deny-capable) — supported; "can you please answer
  my question?" re-derives `info` under the new rules ("answer" listed,
  "question" not an artifact noun). **FR-B5/D-41 for the flipped default**
  ("the safe, FR-B5-faithful direction") — supported jointly: FR-B5's
  answer-drift lean is err-toward-not-denying, and a remainder-verb request's
  fulfilling move is not "clearly not directed at answering", so denying it
  sits outside D-41's license. The in-document round-3/round-4 finding
  citations each match a real finding in the cited files. The Status section's
  round-4 verdict counts (0/1/1/5; 1/3/4) match both round-4 files, and its
  applied-fix enumeration was located in the document item by item.
- **Collapse-log 2026-08-29 entry accuracy (checked as a current-authority
  document against the eight review files it cites):** the trajectory
  "5 → 6 → 1 → 1" matches the four collapse-hunt verdicts; "both top findings
  entered as verbatim sentences from the round-3 reviews' own prescribed
  repairs" matches round-4 C1's and P1's own generator analyses; the
  three-deaths enumeration (no failure producer → producer wired to an event
  that cannot carry it → rows filtered back out of the justifying consumer)
  matches round-1 P4, round-2 S-R3, and round-4 C1/R4-S1; "each passing a
  fixture pinned to the adjacent axis" matches the wrong-check records in
  rounds 2 and 4; "the terminating repair … listed every reader of
  `observed_actions` … per reader" is what AD-4's split filter now does. No
  inaccuracy found.
- **The split filter's consumer enumeration (every reader of
  `observed_actions` located and checked against its stated outcome
  semantics):** edit-set/Completeness (FR-A2f) — 'ok'-only ✓; changed-regions
  (FR-A2g) — 'ok'-only, stated inline in AD-15 ✓; read-set (AD-16) —
  'ok'-only, stated inline with its rationale ✓; Coupling/Reuse triggers —
  'ok'-only ✓; run-subtraction — either outcome, stated in AD-4 and AD-15 ✓;
  the weaker claim's "no recognized run" survey — either outcome ✓ (closing
  R4-S1's poisoned-weaker-branch clause); the class-3 unknown-command scan —
  either outcome ✓ (closing C1's secondary leak: `make check` exiting 1 still
  triggers the weaker claim); FR-L4's covering-test-failed clause — receives
  'failed' rows ✓ (AD-18's producer intact); diagnostics/`deny_bypass_suspect`
  — receives 'failed' rows ✓. A failed `Edit` (no `command_class`) reaches no
  run-state consumer ✓. No reader found outside the filter's three bullets.
- **The round-4 lexicon corpus re-derived against clause (iv)'s rules:** "can
  you rename the helper?" → remainder → `request`, rename-edit not denied ✓;
  "can you show me a demo?" → communicative + listed noun → `request` ✓; "can
  you show me the error?" → communicative, no listed noun → `info` ✓; "could
  you summarize the error?" → remainder → `request`, the documented loss ✓ —
  all four consistent with the mechanism (the corpus's positional blind spot
  is R5-S1, its noun-coverage blind spot R5-M1).
- **Per-segment splitter, quoting/escaping edges:** a quote-distorted or
  env-prefixed head (`"npm" test`, `CI=1 npm test`, a `;` inside a quoted
  string) fails the allowlist and the runner lexicon and lands in class 3 →
  the weaker honest claim — the safe direction; no construction was found that
  converts a real runner invocation into recognized-innocuous (the head of the
  runner's own segment survives or degrades to class 3). `sh -c` wholesale →
  class 3 → weaker claim: honest. The one composition gap is R5-m3.
- **§8 property re-walk on the revised text:** the round-4 diff touches
  classification, schema comments, fixtures, and disclosures only — the deny
  producer (AD-10's single caller), the deny-eligibility predicate (open
  `kind='info'` + mutating file tool), reactive-only, text-never-denied,
  self-clearing, the lag clause's clear-axis scope, and per-consumer scope are
  all textually untouched and re-read consistent; the escalation re-ask and
  verbatim re-ask flows re-traced under the new clause (iv) — both still
  re-arm ✓.
- **Owner constraints on the new mechanisms:** OL-C1/OL-R1/OL-R3 — the noun
  lexicon, the per-segment splitter, and the watermark are classification/
  bookkeeping machinery; no volume/count/budget cap was introduced; the fold's
  "exactly two run points" schedules aggregation, never speech; K/N/k and
  deny-loop 3 unchanged and `tune`-writable. OL-R5 — clause (iv) remains a
  positive total classification; the remainder default is a positive branch,
  and the trigger definition remains OL-C5's owner wording. FR-B3/OL-R4 — no
  new deny producer, no `permissionDecision` on `PostToolUseFailure` (channel
  still **none**), no generated-file consumption on any deny input, no
  pre-emptive gate. `global_meta` passes AD-4's table-creation criterion (a
  Phase A writer: the fold).
- **Phase-boundary honesty:** the run-and-failed routing *defers to Phase B a
  case Phase A could partially detect* — checked deliberately: the deferral is
  the spec's own (D-27/FR-A2m predate this round; Phase A's duty is stated as
  never lying about run-state, which the split filter now delivers), no Phase
  B design was written against no data, and the skeleton labels (AD-9, L1,
  AC-12) are intact.
- **Fix-application fidelity vs. fix correctness (the charter's split):**
  every round-4 repair prescription was located in the diff; the one
  deliberate divergence (plain subtraction instead of the CH's "ran and
  failed" composition) is licensed by the ER's own text and grounded on a
  verified citation — a reasoned choice, not a dropped finding; the one
  unfinished application is R4-m5's second case (R5-m4). The two new top
  findings (R5-S1, R5-M1) live in repair machinery **neither** round-4
  prescription specified (the noun lexicon's object rule and its residual) —
  the prescription-text lesson operating exactly as the charter predicted.

---

*Round-5 review, 2026-08-29. Not the terminal round: R5-S1 is real (an
unstated object rule whose cheapest implementation silently disarms the block
for polite info questions that name repo artifacts — `test` and `file` are in
the shipped lexicon — unpinned by the corpus), and both Moderates are
accuracy-of-disclosure or silent-undercount defects inside round-4 repair
text. All are single-sentence-to-single-mechanism fixes: one positional rule
plus one discriminating corpus pair (R5-S1); a requantified residual owned in
two places (R5-M1); a per-project watermark in `schema_meta` (R5-M2); and four
one-line syncs (m1–m5 minus m5's one-sentence config home). Nothing touches
the deny confinement, the owner constraints, or the phase boundary. The
trajectory (collapse-class: 5 → 6 → 1 → 1 → 1-Serious-equivalent;
Serious-class: 4 → 4 → 0 → 1 → 1) is narrowing in blast radius — this round's
findings are all within one lexicon, one watermark, and four sentences — but a
round that finds a real Serious is not convergence. Per the discipline, the
round-6 pair attacks these fixes; the inheritance it should carry: (1) the
noun lexicon is the round-5 collapse surface — its object rule, its coverage,
and its corpus discriminators; (2) when a prescription names a scoping hint
("per-project", "both cases") and the fix applies the mechanism without the
hint, the hint is where the next defect lives.*
