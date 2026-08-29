# Round-3 expert review — Phase A architecture (round-2 fix verification + new-defect hunt)

**Artifact:** `docs/architecture-phase-a.md` as of commit `5c9ca7f` ("apply all
round-2 review findings"), diffed against the round-2-reviewed draft (`b54ba29`).
**Reviewer:** independent session, not the author of the document or of any prior
review. Read in full before the attack: `middleware/context-oracle/CLAUDE.md`,
`OWNER-LEDGER.md`, `docs/specs/spec-context-oracle.md`, all four 2026-08-29 review
records, the revised architecture end to end, and the full round-2 fix diff.
**Axis per the round-3 charter:** verify every round-2 finding's fix (resolved,
swept, no disclosed-instead-of-fixed, no new contradiction), hunt new defects
inside the fixes, hand-check the new citations and re-establish the premises the
fixes introduced, and re-check owner constraints on the new mechanisms. Every
check below was run in this session; nothing is carried forward from the author's
attestations or from prior rounds' claims without re-derivation.

## VERDICT: NEEDS FIXES — 0 Critical / 0 Serious / 2 Moderate / 6 Minor

Every round-2 finding is resolved in substance — none renamed, none
disclosed-instead-of-fixed — and the corrected claims are swept clean across the
document (sweep list at the end). The two Moderate findings are new defects
inside round-2 fixes (the pattern both prior rounds predict); the six Minors are
small sync survivals, two unapplied repair sub-clauses, one parsing ambiguity,
one unqualified bound, and one attestation miscount. Nothing reaches the deny
path's correctness, the owner constraints, or the phase boundary.

---

## Moderate

### R3-M1 — The `deny_despite_answer_text` deferral exclusion re-blinds the detector to the false-stoplist-match sub-case that the same sentence still claims it catches

**Location:** AD-9, lag-window-hold Detection paragraph, axis (b) *correctness*
(lines ~795–808); AD-17 §1 (the "covered on **both** of its axes" sentence,
~line 1222).

**What is wrong.** The round-2 P1 fix excludes "turns matched by the deferral
stoplist" from the detector's intervening-answer-text predicate — correct for
its aim (a rightful deny-through-deferral no longer inflates the wrongful-deny
rate). But axis (b)'s own opening sentence names **two** clear-recognizer miss
sub-cases: "a genuinely substantive but short answer under the length floor,
**or a false stoplist match**, leaves the question `open` and every subsequent
deny is wrongful. **That path is caught by an independent detector:**
`deny_despite_answer_text` … **excluding turns matched by the deferral
stoplist**." For the second sub-case, the falsely-matched real answer is — by
definition — a stoplist-matched turn, so it is excluded from the predicate; and
any *other* substantive non-stoplist text would clear all-prior and end the
episode, so the sub-case structurally cannot accumulate qualifying turns. The
false-stoplist-match wrongful-deny path is therefore self-undetected again,
while the paragraph asserts "that path is caught," and AD-17 repeats that the
FR-M2 correctness axis is "covered." This is the round-2 P1 repair (whose
option-1 wording the fix took verbatim) quietly foreclosing the adjacent
sub-case S4/round-1 named — the recorded fix-forecloses-adjacent-axis shape.
Harm is bounded: the episode self-recovers when the agent re-answers in
non-deferral words (which clears), and the `ctxoracle correct` human channel
still catches it — but the FR-M2 coverage claim is false as written, and AC-9's
induction (AD-24: "a real short answer the clear recognizer misses") exercises
only the sub-case that survived.

**Fix.** One of: (a) scope the claim — axis (b)'s detector catches the
length-floor miss; the false-stoplist-match miss is caught only by the human
channel (`correct` on the deny) and self-recovers on a re-answer — stating that
in AD-9 and AD-17; or (b) take round-2 P1's option 2 instead (split the
surfaced count: "denies despite text — includes correct-deny-after-deferral")
so no exclusion is needed and both sub-cases stay visible. Either way, stop
asserting full correctness-axis coverage.

### R3-M2 — `whisper_stats`' named writer cannot see the dominant correction timing: the SessionEnd flush runs before the owner's corrections exist

**Location:** AD-5 §1 (`whisper_stats … WRITER: the handler's SessionEnd flush
aggregates the session's audit + corrections`); AD-6 SessionEnd row; AD-18
(the `correct` verb); AC-23 mapping.

**What is wrong.** The round-2 P4 fix named a writer for `whisper_stats` — but
the named writer's timing misses the main input. `ctxoracle correct` targets
whisper/deny ids the owner reads from `status`/`log`, i.e. it typically runs
**after** the session (and its SessionEnd flush) has ended; nothing is
specified to aggregate a correction recorded post-session into the global
efficacy table — the next session's flush aggregates "the session's" (its own)
audit + corrections, and a standalone `correct` invocation has no aggregation
step. Consequences: `corrected_false`/`corrected_missed` silently under-count
in exactly the normal usage pattern; the FR-L7 efficacy-routing property ("an
efficacy signal lands in the global store") holds only for mid-session
corrections; and AC-23's efficacy clause can pass only through a fixture that
corrects mid-session — the wrong-check trap on an acceptance criterion. Bounded
below Serious because the raw `corrections` rows persist in the project store
(the aggregate is recomputable, nothing is emitted falsely, and `status`' own
false-fire rate reads `corrections` directly), but the Phase C
demotion/promotion input this table exists to accumulate is degraded as
designed.

**Fix.** Give the aggregation a watermark instead of a session scope: any
handler event or CLI verb (including `correct` itself, the cheapest point)
aggregates corrections newer than the last-aggregated timestamp into
`whisper_stats`; state it in AD-5 and pin AC-23's fixture to a
**post-session** correction reaching the global store.

---

## Minor

### R3-m1 — Round-2 fixes not synced to the summary surfaces (the m-R4 class, recurring on the new mechanisms)

Four small desyncs, all introduced or left by the round-2 fix batch:

- **Component map event list** (line ~153) still reads "UserPromptSubmit,
  PreToolUse, PostToolUse, Stop, SubagentStop, SessionStart, SessionEnd" —
  `PostToolUseFailure`, wired by AD-6 this round, is missing from the map an
  implementer reads first.
- **Component map CLI inventory** lists `correct / note`, `export / import`,
  etc., but not the new `tune` verb (AD-20).
- **AD-8's fixed pipeline order** ("guard → parse → catch-up → block check →
  …") omits the question-intake step that the component map now shows between
  the adapter and catch-up. Order between intake and catch-up is not
  correctness-critical (the open-scoped index makes double-open impossible),
  but AD-8 is the order authority and lists a stale sequence.
- **Stale V-ranges:** the Knowledge-state baseline says "everything in the
  Verified premises table **(V1–V14)**" (line 271) — the table now ends at
  V19; AD-6 §5's "V1–V6", the traceability matrix's C-4 row ("verified facts
  V1–V6 at the boundary"), and the standards table's hooks-reference row
  ("V1–V6") likewise predate V15/V16/V18/V19, all of which are hooks-reference
  facts those very surfaces now rest on (AD-6's own table cites V15/V16/V19
  inline).

**Fix:** one sweep — add `PostToolUseFailure` and `tune` to the map, insert
intake into AD-8's order, and update the four range references (or drop the
ranges in favor of "the Verified premises table").

### R3-m2 — `outcome='failed'` is written as *parsed from* the error's exit-code line, which the contract only says is "generally" present

**Location:** AD-4 `observed_actions` comment (line ~486); AD-6
`PostToolUseFailure` row (line ~586).

Both say outcome='failed' is "parsed from the `error` exit-code line", and V19
itself quotes the docs' hedge ("generally begins with an exit code line", Bash
only). The failure fact is carried by the **event itself** (PostToolUseFailure
fires only for a tool that started executing and failed — verified this round);
the exit-code parse can only enrich it. As written, an implementer can read the
parse as a precondition and skip the append when the error string has no
exit-code line (a non-Bash tool, a malformed error) — recreating, for exactly
those rows, the run-and-failed-looks-never-run defect this wiring exists to
kill. One sentence fixes it: outcome='failed' is set by the event
unconditionally; the exit-code parse is best-effort detail.

### R3-m3 — Round-2 C4's repair sub-clause "and in Limitations" not applied: the identifier-match false-positive class has no Limitations entry

The comparative Reuse fix states the false-positive class (same-named symbols,
matches in comments/strings) in the whisper's evidence (AD-15) and
confidence-caps the heuristic (AD-4/AD-12) — but C4's repair also prescribed
surfacing it in Limitations, and L1–L11 carry no entry (checked: zero
"identifier"/"false-positive" matches in the Limitations section). Under the
project's apply-all-findings rule this is an unapplied sub-clause, not a
judgment call to omit. One entry (or one sentence in an existing L) closes it.

### R3-m4 — Round-2 P2's repair sub-clause not applied: no unrecognized-runner case in AC-8's fixture

The runner-lexicon layer of the Verification lean is in AD-15 (resolved), but
P2's repair also required "add an unrecognized-runner case to AC-8's fixture
asserting no 'not run' is emitted," and AD-24 lists AC-8 with no such case
(its round-2 additions enumerate re-ask, request-form, and entry-point-shape
cases, so the omission is not covered by a general clause). The lean without
its pin is the wrong-check exposure the lean was built against. One fixture
line closes it.

### R3-m5 — The Status section's round-2 paragraph asserts a count and a completeness the cited record does not support

"…attacked the round-1 fixes, **confirmed all 24 round-1 findings resolved in
substance**" (line ~1955). Round 1 produced 28 finding rows, 25 distinct after
the three cross-duplicates the round-2 resolution table itself names (ER S3 =
CH C3, ER M3 = CH P2, ER M4 = CH N1) — "24" matches no consistent count. And
the round-2 review confirmed resolution "with the partial exceptions noted"
(CH P4 explicitly **Partially resolved** — its failure clause was dead again
until this round's S-R3 fix), so "all … resolved in substance" overstates the
record it cites. This is the verify-before-assert class `CLAUDE.md` names as
the workspace's most damaging recurring failure, in the document's own
attestation surface. Fix: state the real numbers ("25 distinct findings; all
resolved, one — CH P4 — only partially until round 2's S-R3 fix landed").

### R3-m6 — T2's exposure bound is stated unqualified; the marker-less-synthetic exception lives only in L11

T2: "if the assumption fails, an injected question survives **at most one
catch-up** — bounded exposure, not structural exposure" and "…whose exposure
the voiding guard **bounds to the lag window**." Both bounds hold only for an
injected turn that lands in the transcript with an **affirmative non-human
marker**; a marker-**absent** synthetic turn evades the voiding guard and its
row stays open indefinitely (escapable, counted, disclosed — but in L11, not
in T2's own bounding sentences). Marker-less genuine turns are proven real in
this very environment (V12's probe transcript, re-enumerated this round), so
marker-less synthetic turns are not hypothetical. Small — L11 is referenced
twice from the same paragraph — but the round-2 record's own standard (C1: a
disclosure covering only the named axis) says the bound sentence itself must
carry the qualifier. Add "for a marker-carrying turn; the marker-less residual
is L11's" to T2's bound.

---

## Round-2 finding resolution table

"Resolved" = fixed in substance, swept, no surviving contradicting copy, except
where a note points at a finding above. Duplicated findings are cross-marked.

| Round-2 finding | Status in `5c9ca7f` | Where / notes |
|---|---|---|
| CH C1 (request exclusion killed tracking/counter/AC-8a) | **Resolved** | `kind='info'/'request'` split (AD-4/AD-9); both kinds tracked, only `info` deny-capable; AC-8a line covers both kinds (OL-C5 use checked — the row draws no such distinction); counter kind-agnostic; L1 owns the blanket-cleared-request residual; AC-24 request-form fixture |
| CH C2 (`--missed-question` bypassed the intake rule; T2's "only" false) | **Resolved** | Classifier runs at every opener (intake, catch-up, AD-18 — enumeration re-derived this round: no fourth opener exists); rationale restated as the kind-invariant; T2 lists exactly three openers; CLI reports the recorded kind |
| CH C3 (intake-door premise unverified) | **Resolved, with reasoned deviation** | Voiding guard (`intake_invalidated`) + L11(b) + named build-time induction (AD-24). Deviations: voids only on *affirmative* non-human markers (justified — S-R2's own evidence shows genuine turns can lack markers; disclosed in L11), and verification deferred to build rather than performed (fixtures cannot settle it from this container — accepted). Residual: R3-m6 (T2's unqualified bound) |
| CH C4 (Reuse headline grep-equivalent; marginal-value axis undefined) | **Resolved, one sub-clause unapplied** | Comparative dominance headline with named candidate set, k tunable+stored, no-dominance→silence (AD-15); marginal-value axis defined for all three fact classes (AD-14); AC-1b pinned to the comparative form, bare count fails (AD-24). Unapplied: the Limitations entry (R3-m3) |
| CH C5 (table-global hash guard rejects the re-ask) | **Resolved** | Open-scoped partial index `q_open_dedup` (AD-4); closed-hash → fresh row (AD-9); parallel-handler idempotency preserved (re-walked: double-open impossible on live rows; re-ask turn carries a new uuid, so `UNIQUE(consumer, asked_uuid)` is untouched; first-unmatched adjacency reconciles the duplicate hash); AC-24 re-ask fixture |
| CH C6 (`outcome` had no verified producer) | **Resolved** | V19 added and **independently re-verified this round** (see clean checks); `PostToolUseFailure` wired observation-only (AD-6), emits nothing on any channel — FR-O2/FR-B3/AC-2-consistent; AD-4 comment names both producers. New: R3-m2 (parse ambiguity), R3-m1 (map event list) |
| CH P1 (detector counted correct deny-after-deferral as wrongful) | **Resolved, new contradiction** | Deferral-stoplist exclusion applied per the repair's option 1 — but it re-blinds the false-stoplist-match sub-case the same sentence still claims caught (R3-M1) |
| CH P2 (unrecognized-runner "not run" rumor) | **Resolved, fixture sub-clause unapplied** | Lean extended one layer up (any unclassified execution → run-state unknown → silence or the weaker honest claim); runner lexicon named as the `command_class` classifier, best-effort stated. Unapplied: AC-8's unrecognized-runner fixture case (R3-m4) |
| CH P3 (watchdog inventory incomplete) | **Resolved** | Compose-time re-resolution added with bounds (span±slack, cap-skip, commit pointers against the store's `commits`, never a git subprocess); SessionStart items added (bounded `.git` file read; fire-and-forget spawns) |
| CH P4 (`lessons`/`whisper_stats` writer-less; tunables with no tuner) | **Resolved, new defect** | Writers named (`note --global`; SessionEnd flush), `tune <key> <value>` with no-arg listing (AD-20). New: the named `whisper_stats` writer misses post-session corrections (R3-M2) |
| CH N1 (counter over-count unlabelled) | **Resolved** | Both error directions stated in the `status` label (AD-9) |
| CH N2 (`entry_score` vs low-in-degree entry files) | **Resolved** | AC-1a fixture covers both entry-point shapes (AD-24) |
| CH N3 (OL-R5 characterization embellished) | **Resolved** | Parenthetical rewritten; re-read against the ledger row this round — now says only what OL-R5 says (proxy trigger definition, negative-space scoping) |
| CH N4 (AC-19 comparator mismatch) | **Resolved** | = ER M-R3 |
| CH N5 (`deny_bypass_suspect` classifier unnamed) | **Resolved** | Named with the runner lexicon, config-enumerated, "both best-effort by construction" (AD-15) |
| CH N6 (key-mode switch orphans the store) | **Resolved** | `init` announces a keying-mode change and offers the export/import migration first (AD-20) |
| ER S-R1 (UNIQUE breaks "Max re-asks" + `--missed-question`) | **Resolved** | = CH C5; semantics stated in AD-9; "thrice-named recourse" claim verified against the spec (FR-B5, FR-B4, AC-2a-ii) |
| ER S-R2 (marker-universality premise; silent rebuild no-op) | **Resolved** | V12 rewritten to the two-transcript evidence with mode-dependence stated; "must survive"→"should survive" with the reach qualifier; `rebuild_recovered_nothing` fault (OL-10-loud); L11(a); marker presence a named build-time verification (AD-24). Both transcripts re-enumerated this round — claim re-established (clean checks) |
| ER S-R3 (PostToolUse success-only; failure clause dead again) | **Resolved** | = CH C6. All V19 claims confirmed against the current hooks reference this round |
| ER S-R4 (prompt-field = "the user's own" unverified; no invalidation) | **Resolved** | = CH C3; T2 restated to the three-opener structure + named assumption + voiding guard; "structurally closed" overclaim gone. Residual: R3-m6 |
| ER M-R1 (quality table "integrity check at open" survival) | **Resolved** | Reliability row restated (statement-failure on-path, scans off-path); sweep: 0 hits for "integrity check at open" |
| ER M-R2 (deferred-queue "contract functions" survivals) | **Resolved** | Unit tier rewritten; AC-25 row "Deferred — Phase B"; sweep: 0 hits for "contract functions" |
| ER M-R3 (AC-19 byte-compare wrong-check) | **Resolved** | Record-level canonical-order per-table dump diff pinned (AD-24); "byte-compare" survives only inside the pinned-nowhere disclaimer |
| ER m-R1 (V6 "unreachable" survival) | **Resolved** | V6 Result scoped to "the enumerated event-path calls (never claimed in the abstract)" |
| ER m-R2 (OL-R5 "no question predicate" unsupported) | **Resolved** | = CH N3 |
| ER m-R3 (AD-15 §5 cited V12 for hook-input facts) | **Resolved** | Now cites V19; the "tool events carry `tool_name`/`tool_input`" generalization confirmed against the fetched reference this round (PreToolUse and PostToolUse payloads both carry them) |
| ER m-R4 (map/AD-6/AD-23 not synced with fix-introduced steps) | **Resolved, class recurs** | The three named items synced (intake in the map; SessionStart row's rebuild trigger + `quick_check` child; AD-23's SessionStart items). The same round's other fixes left fresh desyncs — R3-m1 |

## Checks run that came back clean

- **Mechanical floor:** `python3 middleware/context-oracle/tools/check_docs.py`
  → "doc-consistency check passed" on the current tree (exit 0).
- **Survival sweeps (grep + read, whole document):** "integrity check at open" —
  0 hits. "contract functions" — 0. "byte-compare" — only the AC-19
  pinned-nowhere disclaimer. "unreachable" — only the V6/AD-23 scoped forms plus
  a benign git-watermark use. "no question predicate" — 0. "excludes
  request-form" / the old intake-exclusion clause — 0. "N files reference it"
  (the superseded Reuse headline) — 0. "opens the question state directly" (the
  old AD-18 bypass) — 0. "honest Phase A approximation" (the C1-flagged label) —
  0 (now "labelled"). `UNIQUE` — only `files.path`, `(consumer, asked_uuid)`,
  and the open-scoped partial index. "user's own" — only two benign uses
  (AD-19's deny-reason observation; T2's local-tampering actor).
- **Premise re-establishment (this session, not carried forward):**
  - **V19** against the current hooks reference (code.claude.com/docs/en/hooks,
    fetched via Context7 this round): "PostToolUse hooks fire after a tool has
    executed successfully" — confirmed; PostToolUseFailure "runs when a tool
    that started executing fails … does not fire for tool calls rejected prior
    to execution, such as unknown tool names, schema validation failures, or
    **permission denials**" — confirmed (grounding "a PreToolUse deny never
    generates one"); the docs' PostToolUseFailure example payload is a failing
    `npm test` with `error: "Exit code 1\n…"` — confirmed; "for Bash and
    PowerShell tools, the error output generally begins with an exit code line"
    — confirmed verbatim (the "generally" hedge is what R3-m2 turns on);
    PreToolUse and PostToolUse payloads carry `tool_name`/`tool_input` —
    confirmed (covers AD-15 §5's citation).
  - **V12's two-transcript claim:** both transcripts exist in this environment
    and were re-enumerated. Interactive transcript
    (`/root/.claude/projects/-home-user-agent-armory/…jsonl`): histogram
    (string, meta:∅, origin:human)=1, (string, meta:∅,
    origin:task-notification)=8, (string, meta:true)=2, list-content 244 —
    shapes exactly as V12 records, counts grown consistently. Probe transcript
    (`…-scratchpad/…jsonl`): 2 genuine `claude -p` prompts, both (string,
    meta:∅, origin:∅) — the marker-less-mode evidence, confirmed.
  - **L11(b)'s "undocumented":** the current UserPromptSubmit docs describe
    only "the submitted prompt string" / a user-submitted prompt — silent on
    programmatic turns; the assumption is genuinely undocumented, as claimed.
- **Citation integrity of new text (hand-checked against spec/ledger read in
  full):** OL-C5 in the AC-8a both-kinds sentence ("draws no such distinction")
  — the CONFIRMED row indeed draws none; the rewritten OL-R5 parenthetical says
  only what the ledger row says; "the spec's thrice-named recourse" — verified
  at FR-B5, FR-B4's counter rationale, AC-2a-ii; "P5's own named non-whisper" —
  verbatim in P3's spec text; the FR-B4 counter-rationale quote ("he cannot
  re-ask what he does not know was dropped") — verbatim in FR-B4; the AD-9
  kind-invariant's opener enumeration — re-derived complete (reconciliation
  backfills, never creates; SessionStart rebuild is catch-up); D-41/FR-B5/D-39
  uses unchanged and still supported; "a round-2 collapse finding" citations
  match the round-2 records.
- **§8 property re-walk on the revised mechanisms:** reactive-only holds (deny
  still requires an open `kind='info'` question **and** a deviating action);
  text answer never denied; self-clearing with no counter; lag clause
  clear-axis-only in all three statements; per-consumer scope; parallel-handler
  idempotency preserved by the open-scoped index; the re-ask, re-open, and
  `--missed-question` flows each traced end to end (open → reconcile → clear →
  re-open) with no stranding and no double-open; PostToolUseFailure emits
  nothing, so AC-2's control-flow assertion and AD-10's single-producer
  confinement are untouched.
- **Owner constraints on the new mechanisms:** no cap does gate-work — the
  Reuse dominance threshold k is part of the fact's definition (whether a
  convention exists), not a volume/count/budget limit; K and N remain
  diagnostic-counter parameters (OL-C1/OL-R1/OL-R3 clean). Deny confinement
  intact (one producer; the new event wiring and CLI opener cannot reach it).
  OL-C5's protected class intact — request rows are never deny-capable even
  when opened by the owner's own `--missed-question` (the CLI says so; honoring
  the correction as deny-capable would recreate round-2 C2's collapse, and L1
  owns request enforcement as Phase B). No rejected item reintroduced: no
  pre-emptive gate, no generated-file consumption on any deny input, no
  negative-space trigger definition (clause (iv) is now a positive
  classification), no budget.
- **Phase-boundary honesty:** unchanged clean — the skeleton is still labelled
  a skeleton (AD-9/L1/AC-12); the new mechanisms (kind split, voiding guard,
  `tune`) are all Phase A machinery with Phase A writers; no Phase B/C design
  against no data was introduced by the fixes.
- **Status-section consistency:** the round-2 paragraph's review-verdict counts
  (0/4/3/4; 6/4/6) match both round-2 files; its applied-fix enumeration
  matches the document (each item located and verified above). The one
  inaccuracy found is R3-m5's "all 24 … resolved in substance."

---

*Round-3 review, 2026-08-29. The trajectory is converging: no Critical, no
Serious, no collapse-class defect; the two Moderates are single-mechanism
fixes (a claim to scope or a counter to split; a watermark for the efficacy
aggregation), and the Minors are one-line sweeps. Per the convergence
discipline, the next round attacks these fixes.*
