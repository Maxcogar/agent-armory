# Round-2 expert review — Phase A architecture (fix verification + new-defect hunt)

**Artifact:** `docs/architecture-phase-a.md` as revised 2026-08-29 (commit `b54ba29`,
"apply all round-1 review findings"), diffed against the reviewed draft (`e2bfdd5`).
**Reviewer:** independent session, not the author of the document or of either
round-1 review. Primary axis per the round-2 charter: **attack the fixes** — the
correction round is where new defects concentrate — then sweep for survivals of
each corrected claim, re-verify the load-bearing premises the fixes introduced,
and hand-check the new citations. Every check below was run in this session;
nothing is carried forward from the author's attestations or from round 1's
findings without re-derivation (round-1 claims were treated as candidates and
re-verified where load-bearing).

## VERDICT: NEEDS FIXES — 0 Critical / 4 Serious / 3 Moderate / 4 Minor

The round-1 findings are, with the partial exceptions noted in the resolution
table, genuinely fixed — not renamed or disclosed-instead-of-fixed. The findings
below are almost entirely **new defects introduced by the fixes themselves**,
plus three survivals of corrected claims in secondary locations (the project's
most-recorded failure class).

---

## Serious

### S-R1 — `UNIQUE(consumer, content_hash)` makes a once-closed question impossible to reopen: the double-open guard breaks the spec's "Max re-asks" recourse and the `--missed-question` path

**Location:** AD-4 (`questions` schema: `UNIQUE(consumer, content_hash)` —
"double-open guard"); AD-9 §1 (intake, reconciliation); AD-18 §1
(`--missed-question` "opens the question state directly").

**What is wrong.** The guard added this round (the N4 fix) is unscoped by
status: `content_hash` is unique per consumer across `open`, `answered`, *and*
`expired` rows. Two consequences the document does not design for:

1. **The re-ask collision.** The spec names "Max re-asks" as the recourse for an
   inadequate or false-cleared answer in three load-bearing places (FR-B5's
   answer-drift bullet — "if an answer is inadequate, Max re-asks"; FR-M4's
   done-claim counter rationale — "the 'Max re-asks' recourse … actually
   reachable"; AC-2a-ii — "Max re-asks if inadequate"). When Max re-asks the
   same question verbatim — the most natural form of re-asking — intake computes
   the same `content_hash`, and the INSERT collides with the existing
   `answered` row. Nothing in AD-9 specifies reopen/upsert semantics, so as
   designed the re-asked question **cannot open**, no deny-capable state exists
   for it, and the block is dead precisely on the recourse path the spec's
   whole under-fire story leans on.
2. **The `--missed-question` collision.** AD-18's human-channel under-fire
   guard (AC-2c's Phase A answer-drift clause) "opens the question state
   directly" from the dropped question's text. Where the question was
   previously opened and blanket-cleared (`generic_text_all_prior` — the exact
   miss `--missed-question` exists to correct), a row with that `content_hash`
   already exists as `answered`, and the direct open hits the same constraint.

**Evidence.** AD-4 schema read (lines 457–465: `UNIQUE(consumer,
content_hash)` with `status` unscoped); AD-9 and AD-18 read in full — no
reopen/upsert semantics anywhere; spec FR-B5, FR-M4, AC-2a-ii read at §8/§6/§14
(the three "Max re-asks" uses quoted above).

**Fix.** Scope the guard to live rows — a partial unique index
(`CREATE UNIQUE INDEX … ON questions(consumer, content_hash) WHERE
status='open'`), which preserves the idempotent-reconciliation property N4
wanted while leaving closed rows re-askable — **or** specify intake and
`--missed-question` as an upsert that reopens the existing row (status back to
`open`, `closed_by_*` cleared, event recorded). Either way, state the chosen
semantics in AD-9 and add the re-ask case to AD-24's fixtures (re-ask after a
blanket clear ⇒ next mutating move is denied again).

### S-R2 — The mandatory `origin.kind === "human"` marker rests on an unverified universality premise — refuted in this very environment for one transcript-producing mode — and the "open questions must survive resume" guarantee silently dies where the premise fails

**Location:** AD-9 §1 (human-turn discrimination; "resume/fork/compact → …
open questions must survive: state is rebuilt by classifying the transcript");
AD-11 §1; V12 (Result column: "a question-bearing turn requires `origin.kind
=== "human"`").

**What is wrong.** Round-1 S1's prescribed rule was `isMeta !== true` **and,
where present,** `origin.kind === "human"`. The revision hardened "where
present" into **required**: a user entry without `origin.kind:"human"` never
opens a question and never reconciles ("skip + diagnostic"). That is the safe
direction against injection — but it stands on the premise that every genuine
human turn carries the marker, and that premise is verified on **one human
turn in one transcript** (V12's histogram: `(string, meta:∅, origin:human)=1`).
Enumerated this session: a second transcript in this same environment — the
`claude -p`-shape probe transcript in the session scratchpad (the V9
invocation's own transcript; 2 user entries, "Reply with the single word:
ok") — shows genuine user prompts as string-content entries with **no `origin`
field at all**. So the marker is demonstrably not a universal property of
genuine user turns across transcript-producing modes of this very CLI, and
whether the owner's local interactive sessions stamp it is **unverified** (the
layout is undocumented, as V12 itself says).

The consequence where the premise fails is not neutral: mid-session
enforcement survives (intake reads the `prompt` field; intake rows stay open
and deny-capable even unreconciled), but the **rebuild path is a silent
no-op** — on `resume`/`fork`/`compact`, "state is rebuilt by classifying the
transcript from offset 0", every human turn is skipped as
`unrecognized_user_entry`, zero questions are recovered, and AD-9's
unconditional sentence "open questions must survive" is false. The document
asserts the guarantee without conditioning it on the marker premise, and no
Limitations entry owns it (L1's coverage ledger lists the `compact`
summarization loss but not this).

**Evidence.** Marker-field histogram executed this session over both
transcripts in this environment:
`/root/.claude/projects/-home-user-agent-armory/<session>.jsonl` — genuine
human turn `(string, meta:∅, origin:human)`, task-notifications 6, `isMeta` 2,
list-content 186 (matches V12's shape); scratchpad transcript
`…-scratchpad/<session>.jsonl` — **2 genuine user prompts, both `(string,
meta:∅, origin:∅)`**, i.e. skipped by the revised rule. AD-9/AD-11/V12 text;
round-1 S1's fix wording ("where present").

**Fix.** (1) Record the marker-presence premise as a premise with its scope: a
V-row stating on which transcript modes `origin.kind:"human"` was observed and
that the interactive-local layout is unverified; verify it at build time
against a transcript from the owner's actual interactive environment (a
fixture from a real local session — AD-24 already builds transcript fixtures).
(2) Disclose the consequence in AD-9 and L1: where human turns carry no
marker, rebuild recovers nothing (under-fire, diagnostic-visible). (3) Make
the failure loud at the right granularity: a rebuild that classifies a
non-empty transcript and recognizes **zero** human turns while emitting
`unrecognized_user_entry` diagnostics is a distinct fault condition (the
capability went dark — `OL-10`), not just per-entry noise. Keep the skip
direction itself — it is the right conservatism; the defect is the unstated
premise and the contradicted guarantee, not the lean.

### S-R3 — The revived FR-L4 test-failure clause names a data source that cannot carry it: PostToolUse fires only on **successful** execution, and a failing test run is the documented PostToolUseFailure case — an event AD-6 explicitly declines to wire

**Location:** AD-4 (`observed_actions.outcome … + success/failure from the
PostToolUse tool response`); AD-6 §4 ("Not `PermissionRequest`/
`PostToolUseFailure` wiring in Phase A — no Phase A genre consumes them");
AD-15 (Verification subtraction over "test runs observed in
`observed_actions`"); AD-18 (regret proxy: "whose covering test failed in an
observed test run"); AD-24 (AC-24 "the failure clause fed by
`observed_actions.outcome`").

**What is wrong.** The P4 fix added `outcome NULL CHECK(outcome IN
('ok','failed'))` sourced "from the PostToolUse tool response". Verified
against the current hooks reference this session: **PostToolUse "fires after a
tool executes successfully"** — and the docs' own PostToolUseFailure payload
example is precisely a failing test run (`tool_name: "Bash"`, `command: "npm
test"`, `error: "Exit code 1\n…"`). So under the current contract the failure
signal the clause needs arrives on **PostToolUseFailure**, which this
architecture leaves unwired with the rationale "no Phase A genre consumes
them" — a rationale the same revision made false. Three consequences:

1. `outcome='failed'` has **no producer**: the FR-L4 test-failure clause is
   dead as designed — the exact P4 defect, reintroduced by the fix one event
   over — and AC-24's failure clause can pass only through a fixture that
   fabricates rows no runtime path writes (the wrong-check trap).
2. Worse than dead: a **failed** test run fires no PostToolUse at all, so it
   is never appended to `observed_actions`. The Verification subtraction then
   treats a run-and-failed covering test as *never run* and emits "not run
   against this change" — a **checkably false claim** from the one genre whose
   value is provenance at the done-claim: the FR-D1 rumor that AD-15's new
   subtraction lean was built in this same revision to prevent.
3. The read-set update and Coupling/Reuse triggers also skip failed reads/
   greps (minor by comparison, but same boundary).

**Evidence.** Current hooks docs fetched this session (Context7,
code.claude.com/docs/en/hooks): "PostToolUse hooks fire after a tool has
executed successfully"; "The PostToolUseFailure hook runs when a tool that
started executing fails"; the PostToolUseFailure example payload quoted above
("For Bash and PowerShell tools, the error output generally begins with an
exit code line"). AD-4/AD-6/AD-15/AD-18/AD-24 text.

**Fix.** Wire `PostToolUseFailure` for **observation only** — append the
`observed_actions` row with `outcome='failed'` parsed from the `error` field's
exit-code line; emit no `permissionDecision` and no context on it (spec FR-O2
already states "the oracle emits no `permissionDecision` on any of them," so
observation wiring is spec-clean under FR-B3). Update AD-6's event map and its
"What this is NOT" sentence, add the event to AD-23's blocking-call inventory,
and add a V-row for the PostToolUse/PostToolUseFailure success/failure split
(it is now a load-bearing premise). Then AC-24's failure clause and the
Verification subtraction are fed by a real producer.

### S-R4 — The rewritten T2 claim "a question can be opened only by text that arrived as the user's own `UserPromptSubmit` prompt" assumes, unverified, that only Max's own turns fire `UserPromptSubmit` — the S1 injection surface is closed at the transcript boundary and unexamined at the intake boundary

**Location:** Threat model T2 (*Experiment/Analysis*: "…only by text that
arrived as the user's own `UserPromptSubmit` prompt or as a transcript entry
carrying the human markers … structurally outside the intake"); AD-9 §1
(question intake).

**What is wrong.** The S1 fix closed the transcript-side door with markers.
Question intake, however, now runs on the hook's `prompt` field, and the
threat model equates "arrived as a `UserPromptSubmit` prompt" with "the user's
own text" with no verification and no discriminator. The same transcripts that
motivated S1 show programmatically-injected user turns whose text is partly
authored outside the machine (task notifications; 6 in this session's
transcript). Whether such injected turns fire `UserPromptSubmit` is
**undocumented and unverified** — the docs say only "runs when the user
submits a prompt." If any programmatic user turn does fire it, a
question-shaped sentence in externally-influenceable text opens a deny-capable
question through the front door, and nothing ever voids it: reconciliation
only *matches* human turns against intake rows — an intake row whose
originating turn later appears in the transcript as `task-notification` is
not invalidated; it simply stays unreconciled and **open**. The harm profile
is S1's (wrongful denies from text Max never wrote — the FR-B5-forbidden
direction; escapable, and cleared by any substantive assistant text — but a
live injection surface into the deny path), and the threat model presents the
boundary as "structurally" closed, which is an over-claim: it is closed only
if the unverified premise holds.

**Evidence.** T2 text as revised; AD-9 intake and reconciliation (no
invalidation path); transcript enumeration this session (task-notification
user turns present); current hooks reference (UserPromptSubmit described only
as "when the user submits a prompt" — silent on programmatic turns).

**Fix.** Two independent moves, both cheap: (1) verify the premise where
possible (a hook fixture in an environment that injects task-notification
turns; or at minimum record it as an assumption in the V-table and T2, not as
established structure); (2) add the structural guard that makes the claim
true regardless: at reconciliation, when catch-up reaches the transcript turn
matching an intake row (content-hash/adjacency) and that turn does **not**
carry the human markers, the row is **voided** (a `closed_by_kind` value like
`'intake_invalidated'`, plus a fault row) — the deny exposure then shrinks to
the lag window instead of persisting indefinitely. Restate T2 to whichever
boundary is actually established.

---

## Moderate

### M-R1 — Survival: the ISO 25010 quality table still mandates "integrity check at open" — the exact C4 defect the revision removed

**Location:** "Quality characteristics addressed" table, Reliability row: "WAL
stores with integrity check at open; per-event process isolation".

**What is wrong.** AD-17 (revised) forbids exactly this: "`store_corrupt`
detected on the event path by the failure of the actual prepared statements —
**never by an integrity scan there** … integrity scanning runs **off the event
path only**"; AD-23 adds "**no O(store) statement is permitted on the event
path**". The store is opened on every event (AD-1), so "integrity check at
open" *is* the on-event-path O(store) scan — 543 ms measured on a 410 MB store
(V8) — that C4 showed lands the deny-capable event on the V6 fail-closed path.
The governing decisions are fixed; the summary table still instructs the old
design. An implementer skimming the quality table builds the defect back in.
This is the incompletely-swept-fix class the collapse-log records as the
project's signature failure.

**Evidence.** Line 249 vs AD-17 (lines 1126–1134) and AD-23 (line 1351), read
this session; `grep -n "integrity" docs/architecture-phase-a.md`.

**Fix.** One line: "WAL stores; corruption detected by statement failure on
the event path, integrity scans off-path (AD-17)".

### M-R2 — Survival: AD-24's unit tier and the AC-25 matrix row still ship Phase A "contract functions of the deferred queue," contradicting the revised AD-22

**Location:** AD-24 §1 unit tier ("…reader discrimination (V12 shapes),
contract functions of the deferred queue"); traceability matrix AC-25 row
("AD-22 (contract functions tested); full criterion Phase B").

**What is wrong.** Revised AD-22 is unambiguous: "The `deferred_queue` table
and its **routines** are created by the Phase B migration alongside their
writers … Not a Phase A table or delivery path (shipping either now would be
the dormant machinery AD-4's criterion bars)." The old design (Phase A ships
the contract functions, "tested" against nothing — round-1 N1's
testing-the-mock complaint) survives verbatim in the test architecture and
the matrix. As written, the implementer is instructed to build in Phase A the
very functions AD-22 defers, and the matrix reports AC-25 as partially
covered by tests of code that does not exist in Phase A.

**Evidence.** `grep -n "contract functions" docs/architecture-phase-a.md`
(lines 1377, 1677) vs AD-22 §1/§4 (lines 1316–1338).

**Fix.** Delete "contract functions of the deferred queue" from the unit
tier; the AC-25 row becomes "Deferred — Phase B (AD-22 fixes its semantics as
constraints)". Both edits match what AD-22 already says.

### M-R3 — AC-19 is pinned to a "byte-compare" that the newly chosen mechanism fails: a `VACUUM INTO` copy is not byte-identical to its source (demonstrated by execution)

**Location:** AD-24 §1 ("AC-19 (export/import byte-compare via `VACUUM
INTO`)"); AD-5 §1.

**What is wrong.** The C5 fix switched the export mechanism to `VACUUM INTO`
but kept the pre-existing "byte-compare" test pin. Executed this session on
this Node (v22.22.2, `node:sqlite`): a store and its `VACUUM INTO` copy are
**not byte-identical** (same size, different bytes — VACUUM rebuilds pages).
The spec's AC-19 requires the imported stores be **record-identical** to the
originals. So the pinned assertion either spuriously fails (compared against
the original store) or silently under-verifies (compared export-file-to-
imported-file, which is a copy check, not a round-trip check) — the
wrong-check trap on an acceptance criterion, introduced by not reconciling
the check with the changed mechanism.

**Evidence.** Executed: create store (FTS5 row), `VACUUM INTO`, MATCH query
on the copy succeeds (records intact); `Buffer.equals` on the two files →
`false`. Spec AC-19 text ("record-identical") read at §14.

**Fix.** Pin AC-19 at the record level: canonical-order dump of every table
compared between original and imported store (or compare `VACUUM INTO` output
of the original with `VACUUM INTO` output of the imported store). State it in
AD-24 so the implementer does not "fix" the failing byte-compare by weakening
the fixture.

---

## Minor

### m-R1 — Survival: V6's Result column still claims the watchdog makes the fail-closed hazard "unreachable"

**Location:** V-table row V6, Result column: "AD-23's internal watchdog exists
to make that unreachable."

Revised AD-23 explicitly renounces this word: avoided "for the enumerated
paths — **not declared 'unreachable' in the abstract**." The premise table —
the surface the next reviewer checks first — still carries the pre-fix
absolute. One-phrase fix: "…exists to keep that unreachable for the
enumerated event-path calls (AD-23)."

### m-R2 — AD-9's OL-R5 parenthetical attributes to the rejected proxy a property the ledger row does not state

**Location:** AD-9 §1, deny-decision rationale: "the `OL-R5`-rejected 'writing
code' trigger proxy defined *drift itself* as code-writing, **with no question
predicate** and no intake constraint."

OL-R5 (read in the ledger this session) rejects "the **answer-drift trigger**
scoped to 'writing code'" — an answer-drift trigger by definition operates
after Max's question, so "no question predicate" is not something the ledger
says about it. The distinction that actually holds — and which the same
sentence already carries — is that the rejected item *defined* the trigger as
code-writing (with negative-space padding), while this design denies a
conservative *subset* of non-answer-directed moves under D-41's license, after
intake's information-question constraint. In a project whose 2026-08-25
collapse entry is specifically about citing rows only for what they say, trim
the unsupported clause; the argument loses nothing.

### m-R3 — AD-15 §5 cites V12 for a hook-input fact V12 does not contain

**Location:** AD-15 §5: "V12 (observed_actions feedability — tool events carry
tool name and path)".

V12 is transcript-layout evidence (JSONL entry shapes); tool name/path on tool
events are hook-*input* facts (`tool_name`/`tool_input`, documented in the
hooks reference and confirmed in this session's fetches). The citation does
not cover the use — the same attestation-gap class as round-1's N2/m2. Cite
the hooks reference (or fold into a V-row alongside the S-R3 fix, which needs
one for the PostToolUse/PostToolUseFailure split anyway).

### m-R4 — The component map, AD-6's SessionStart row, and AD-23's inventory were not synced with three fix-introduced steps

**Location:** Component map (pipeline steps); AD-6 event table, `SessionStart`
row; AD-23 §1 inventory.

Three revision-introduced mechanisms are missing from the summary surfaces:
(a) prompt-field **question intake** appears nowhere in the component map's
per-event pipeline (which still reads guard → adapter → catch-up → block
check → …); (b) the detached **`quick_check` child spawned after
`SessionStart`** (AD-17) is absent from AD-6's SessionStart work list
("reconciliation; staleness check → detached reindex spawn"); (c) AD-23's
blocking-call inventory — whose completeness is now the load-bearing basis of
the fail-closed argument — omits the SessionStart-path items (the HEAD read
for the staleness check, however implemented, and the child spawns).
SessionStart is not deny-capable, so the risk is low; but the inventory
claims to enumerate "every blocking call on the event path," and the map is
the first thing an implementer reads. Sync all three.

---

## Round-1 finding resolution table

Verified in the revised text and by the sweeps below; "resolved" means fixed in
substance with no surviving contradicting copy **except** where a survival is
named (it then points at a finding above).

| Round-1 finding | Status in revision | Where / notes |
|---|---|---|
| CH C1 (Reuse headline uncomputable from `ref_edges`) | **Resolved** | `import_edges` + `symbol_refs` split (AD-4/AD-12), restated headline "N files reference it" (AD-15), AC-1b pinned to it (AD-24); `ref_edges` swept — 0 mentions remain |
| CH C2 (clear-all-prior blinds FR-M4 counter / AC-8a) | **Resolved** | `closed_by_kind` record; counter counts open **or** recently-blanket-cleared (K tunable); `status` structural-limit label; AC-8a verbose-done documented non-fire (AD-24) |
| CH C3 (init network fetch vs AD-19/T4/AC-11) | **Resolved** | AD-3: "`init` performs **no fetch of any kind**", FR-X5 cited; unshallowing pushed outside the tool; AD-19/T4/AC-11 now consistent; fetch/unshallow swept clean |
| CH C4 (cooperative watchdog; O(store) check on event path) | **Resolved with survival** | AD-23 restated cooperative + inventory; AD-17 moves integrity off-path; V8 discloses the exclusion; AC-10 large-store case added. Survivals: quality table (M-R1), V6 result phrase (m-R1) |
| CH C5 (`backup()` absent on declared floor) | **Resolved, new defect** | Floor 22.16.0 (AD-2, AD-20); `VACUUM INTO` chosen and executed (V17). New: AC-19 byte-compare wrong-check (M-R3) |
| CH P1 (entry-point factor no producer; invariants no writer) | **Resolved** | `entry_score` producer in AD-12; Orientation row conditions the invariant on a recorded row; L10; `exemplars` no longer ships (creation criterion) |
| CH P2 (intake contradictorily specified; open-axis lag) | **Resolved, new defects** | Prompt-field intake at `UserPromptSubmit` (question exists before the first move), reconciliation by content-hash + adjacency, UNIQUE guards; V5/AD-6/AD-9 agree. New: S-R1 (UNIQUE over-reach), S-R4 (intake trust premise) |
| CH P3 (request-questions deny the requested action) | **Resolved** | Intake clause (iv) excludes request-form interrogatives; rationale restated to the intake rule; residual class owned in L1 |
| CH P4 (`observed_actions` cannot feed failure clause / subtraction) | **Partially resolved** | `outcome` column + subtraction lean added — but the named source cannot carry failures under the current contract (S-R3): the failure clause is dead again as designed |
| CH N1 (dormant-machinery standard inconsistent) | **Resolved with survival** | Uniform table-creation criterion (AD-4), applied to `deferred_queue`/`exemplars`/`recipes`/`env_capabilities`; schema clean. Survivals: AD-24 unit tier + AC-25 matrix row (M-R2) |
| CH N2 (delivery-channel affordances missing from V-table) | **Resolved** | V15/V16 added; both re-verified this session against current docs |
| CH N3 (AC-2a-i listed whole as Phase A) | **Resolved** | Split in the matrix and AD-24 (allow-half Phase A / deny-half Phase B), licensed by the criterion's own "Phase-A-conservative / Phase-B-precise" |
| CH N4 (concurrent catch-up not idempotent) | **Resolved, overshoot** | UNIQUE guards added; the content-hash guard overshoots into S-R1 |
| CH N5 (deny teaches the Bash bypass; deny-loop blind) | **Resolved** | `deny_bypass_suspect` diagnostic (AD-9), L3 owns the consequence |
| CH N6 (catchup lean ambiguity; compact loss) | **Resolved** | Both halves of the incomplete-catch-up lean stated; multi-event recovery stated; compact summarization loss disclosed (AD-9, L1) |
| ER S1 (string-content = human refuted; injection into deny path) | **Resolved, new defects** | Marker-based discrimination (AD-9/AD-11), V12 re-enumerated with histogram, T2 rewritten, list-content human turns handled, fixture asserts injected entries never open questions (AD-24). New: S-R2 (marker universality premise), S-R4 (prompt-field boundary) |
| ER S2 (information-question "by construction" false; OL-R5 proxy) | **Resolved** | Clause (iv) + honest rationale ("by the intake rule") + L1 residual class; OL-R5 distinction argued (one unsupported clause — m-R2) |
| ER S3 (`git fetch --unshallow` vs FR-X5) | **Resolved** | Same as CH C3 |
| ER S4 (deny-outlives-condition "unreachable"; AC-9 induction substituted) | **Resolved with survival** | Both axes covered; `deny_despite_answer_text` (inverse-of-deny-loop) detector; AC-9 induction restored verbatim (real short answer missed ⇒ fault); "unreachable" scoped in AD-23/AD-17. Survival: V6 result (m-R1) |
| ER M1 (22.13.0 floor admits FTS5-less versions) | **Resolved** | Floor 22.16.0 everywhere (AD-2, AD-20); 22.13.0 remains only as C-1's attributed figure; per-tag `sqlite.gyp` evidence in V7 — independently re-verified this session (0 FTS5 matches at v22.15.0, 1 at v22.16.0) |
| ER M2 (ASVS 4.0 numbers under a 5.0 label) | **Resolved** | Renumbered V1/V2, V5, V13, V14, V15, V16; V6/V7/V8 N/A note. All chapter names verified this session against `OWASP/ASVS` `5.0/en` chapter files — every row correct |
| ER M3 (intake specified two contradictory ways) | **Resolved** | Same as CH P2 |
| ER M4 (dormant Phase B/C machinery) | **Resolved with survival** | Same as CH N1 (M-R2) |
| ER m1 (stale subagent-propagation premise) | **Resolved** | V18 (verbatim doc quote), knowledge-state updated, L9(b); spec §13 carries the resolution |
| ER m2 (`agent_transcript_path` overextended) | **Resolved** | V4 scoped to SubagentStop-only; AD-11 reads main-consumer transcripts only; `locate.ts` records the field unused |
| ER m3 (audit rule attributed to wrong round) | **Resolved** | AD-8 now attributes the 2026-07-22 round-1 collapse-hunt, "verified closed in round 2" |
| ER m4 (deny-loop ≥3 a bare number) | **Resolved** | "a tunable `tuning` row, like every operating number here" |
| ER m5 ("store_corrupt → whisper-only" incoherent) | **Resolved** | AD-17: store corruption is **fully silent**; "whisper-only" reserved for transcript breakage |

## Checks run that came back clean

- **Mechanical floor:** `python3 middleware/context-oracle/tools/check_docs.py`
  → "doc-consistency check passed" on the current tree.
- **Survival sweeps (grep + read):** `ref_edges` — 0 hits. `git fetch` /
  `unshallow` — only AD-3's "happens outside the tool" sentence. `22.13` —
  only as C-1's attributed figure inside V7/AD-2's floor rationale (correct).
  `stdout` — only V15/V16, AD-6's channel notes, and the "not stdout on tool
  events" exclusion (all correct post-fix). Backup-API mentions — only as the
  road-not-taken with its v22.16.0 fact (V17/AD-2/AD-5). String-content
  discrimination — rewritten at every prior location (V12, AD-9, AD-11 §4,
  T2, AD-24 fixture). Dormant tables — none in either schema listing; every
  listed table has a named Phase A writer; `genre_state` appears only as
  AD-5's exclusion; `env_capabilities`/`exemplars`/`recipes`/`deferred_queue`
  appear only as deferred-creation comments (plus the M-R2 survivals).
  "Unreachable" — scoped in AD-23; survivals only as m-R1/M-R1 name them.
- **Premises re-established this session (not carried from round 1):** FTS5
  per-tag evidence (`sqlite.gyp` fetched at v22.15.0 and v22.16.0: 0 and 1
  FTS5 matches); FTS5 executes on this Node v22.22.2; `VACUUM INTO` executes
  on `node:sqlite` and round-trips records (MATCH on the copy succeeds);
  module-level `backup` exists on v22.22.2; V15 (UserPromptSubmit stdout
  **and** `additionalContext`, both "injected as system reminders") and V16
  (PostToolUse `additionalContext` "directly enters Claude's context window";
  stdout → debug log only) confirmed against the current hooks docs; V12's
  marker histogram re-enumerated on the live transcript (shapes match; counts
  grown consistently). ASVS 5.0 chapter names verified against the OWASP/ASVS
  repository's `5.0/en` chapter files: V1 Encoding and Sanitization, V2
  Validation and Business Logic, V5 File Handling, V6 Authentication, V7
  Session Management, V8 Authorization, V13 Configuration, V14 Data
  Protection, V15 Secure Coding and Architecture, V16 Security Logging and
  Error Handling — every table row and the V6/V7/V8-N/A note correct.
- **New-citation support (hand-checked against spec/ledger read in full):**
  D-41 (phasing + lag-hold), D-39 (protected class), FR-B5 (per-direction
  leans, steady-state vs lag reversal), FR-M2 (both axes of
  deny-outlives-condition are instances of its stated class), FR-M4 (counter
  approximation honestly labelled), AC-9 (induction now matches the
  criterion), AC-8a (backstop best-effort framing preserved; non-fire case
  documented), AC-2a-i (split licensed by the criterion's own
  "Phase-A-conservative / Phase-B-precise"), FR-K3–K5 (form-fixed-now /
  table-with-writer reading is consistent with §11.1 and Phase A's genre
  needs), FR-J5/D-37 (AD-22 restates the spec's properties, adds nothing),
  OL-C3/OL-C5 (used for exactly what the CONFIRMED rows say). The one
  citation-precision slip found is m-R2 (OL-R5).
- **Owner constraints:** No pre-emptive gate — the deny still requires an open
  question *and* a deviating action; single-producer confinement (AD-10)
  untouched. No new caps — K (counter window), N (`deny_despite_answer_text`),
  and the deny-loop 3 are diagnostic-counter parameters stored in `tuning`,
  none suppresses a bar-clearing whisper (OL-C1/OL-R1/OL-R3 clean). OL-R4
  clean — zone data still feeds only advisory content and the impact axis; no
  deny path can consume it. OL-7/FR-X5 clean — the fetch is gone; no network
  operation exists in Phase A code. The request-form exclusion (intake iv) is
  consistent with OL-C5's protected class: it under-enforces (disclosed, L1),
  never denies the requested action.
- **Internal consistency (beyond findings):** V5/AD-6/AD-9 now agree on
  prompt-field intake; the lag-window text, the frozen-open breakage posture,
  and the incomplete-catch-up lean are mutually consistent
  (hold-clear-axis-only in all three); AD-17's fault-code roster matches every
  detector named in AD-9/AD-11; `status` items cover every FR-M4 signal with
  the two reserved codes labelled "not yet measured"; the traceability matrix
  rows for FR-B4/FR-B5/AC-2c match the revised AD-9/AD-18 split; the Status
  section's round-1 counts match both review files, and it correctly does not
  claim convergence.

---

*Review written 2026-08-29 by an independent round-2 session. Per the
convergence discipline, these findings concern the fixes and their seams; the
round-1 substance they repaired is confirmed repaired except where the table
says otherwise.*
