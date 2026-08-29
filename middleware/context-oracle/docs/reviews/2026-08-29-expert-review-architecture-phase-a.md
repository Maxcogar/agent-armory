# Expert review — Phase A architecture (premises and standards axis)

**Artifact:** `docs/architecture-phase-a.md` (written 2026-08-29)
**Reviewer:** independent session, not the author. Axis: citation resolution *and*
support, premise re-establishment, spec coverage, standards discipline, owner
constraints, internal consistency. Every check below was run in this review
session; nothing is carried forward from the author's own attestations.

## VERDICT: NEEDS FIXES — 0 Critical / 4 Serious / 4 Moderate / 5 Minor

---

## Serious

### S1 — The transcript "real user turn" discrimination is refuted by a live transcript: system-injected text becomes Max's question and can drive wrongful denies

**Location:** AD-11 §1 ("a *real user turn* is `type:"user"` with string
`message.content`"), AD-9 §1 (question recognizer keyed on that rule), V12,
threat model T2 ("qa-state poisoning would require writing the user's own
turns").

**What is wrong.** V12 records "real user turns have `message.content` as a
string" and AD-11 uses the converse as the discrimination rule: string content ⇒
real user turn. The converse is false on the very evidence class V12 cites.
Enumerating a live transcript in this environment
(`~/.claude/projects/-home-user-agent-armory/<session>.jsonl`, 438 entries)
shows string-content `type:"user"` entries of three distinct kinds:

- a real human turn (`origin.kind: "human"`);
- **Stop-hook feedback** (`isMeta: true`, text beginning `"Stop hook feedback:
  [~/.claude/stop-hook-git-check.sh]: …"`) — arbitrary hook-script output;
- **task notifications** (`origin.kind: "task-notification"`, quoting GitHub
  activity) — text partly authored outside the machine.

Under AD-9, every such entry is classified as Max's turn and scanned for
interrogatives. A hook script or a task notification containing a
question-shaped sentence opens a `questions` row and the block then denies
`Write`/`Edit` "until Max's question is answered" — a wrongful deny triggered by
text Max never wrote, in the error direction FR-B5 explicitly forbids
("errs toward not denying"). It also falsifies the T2 analysis's load-bearing
sentence: poisoning the qa-state does **not** require writing the user's own
turns; it requires only that any hook or notification emit a "?" — and task
notifications carry externally-influenceable text, so this is an injection
surface into the deny path (T1×T2), not just noise. Secondary defect in the
same rule: a genuine user turn with pasted images arrives as list content in
the API message format, so the string-only rule silently classifies a
real multimodal question as a pseudo-user entry (an undetectable under-fire the
document nowhere discloses).

**Evidence.** Transcript enumeration this session: line 2 `origin.kind=human`
(string); line 373 `isMeta=true` "Stop hook feedback…" (string); lines 404/430
`origin.kind=task-notification` (string); one `isMeta=true` list-content skill
injection. AD-9/AD-11 text; ledger FR-B5 lean; threat model T2 paragraph.

**Fix.** Discriminate real user turns on the markers the transcript actually
carries — `isMeta !== true` and, where present, `origin.kind === "human"` — with
unknown/absent markers handled conservatively (skip + diagnostic, never
open-a-question); re-verify V12 against a transcript containing injected turns
(this session's qualifies); rewrite the T2 analysis to the corrected boundary;
either handle list-content real turns (text blocks concatenated) or record the
multimodal miss as an explicit limitation.

### S2 — "A Phase-A-recognized question is an information question by construction" is false; the deny set's justification collapses to the OL-R5-rejected proxy

**Location:** AD-9 §1 (deny decision, "Rationale:" sentence), Limitations L1.

**What is wrong.** The question recognizer opens any sentence that (i) ends with
`?`, (ii) is outside code fences, (iii) is not on a rhetorical/idiom stoplist.
That set includes **request-form questions** — "can you fix the bug?", "could
you add a test?" — which are requests to act, not information questions. For
them, `Write`/`Edit` is precisely the "action taken to provide the answer"
(OL-C5's protected class), and denying it is denying a plausibly answer-directed
move: the opposite of FR-B5's mandated lean and outside D-41's Phase-A license,
which covers denying only moves "*clearly* not directed at answering." The
document's defense — "a Phase-A-recognized question is an information question
by construction of the question recognizer" — is factually false: nothing in
criteria (i)–(iii) excludes request questions. With that premise removed, the
deny-eligible set (exactly the mutating file tools) is materially the "writing
code" proxy the ledger REJECTED as OL-R5, standing with no surviving
justification. L1 discloses only the *mixed*-prompt case ("which is better? fix
it"), not the pure request-question case, which is a far more common prompt
form. Practical harm is bounded (any substantive narration clears all-prior;
text is never denied) — but that safety comes from agents' narration habits,
not from the construction the document asserts, and the same "true by
construction" pattern is what the 2026-07-30 round-2 review found twice at
Critical.

**Evidence.** AD-9 §1 verbatim; OWNER-LEDGER OL-C5, OL-R5; spec FR-B5
(answer-drift bullet), D-41; L1 text.

**Fix.** Make the recognizer's actual property true: either exclude
request-form interrogatives at intake (a deny-capable question is opened only
for information-seeking interrogatives; err toward not opening, per FR-B5), or
condition the deny so a lone open request-question cannot deny the requested
mutation. Replace the false rationale sentence with the real property, and
extend L1 to own whatever residual wrongful-deny class remains.

### S3 — `init`'s `git fetch --unshallow` is a network operation the architecture itself says does not exist (FR-X5 violation; contradicts AD-19, T4, and the AC-11 mapping)

**Location:** AD-3 §1 rule 2; vs AD-19 §1 ("the only network use in the whole
tool is the Phase B piggyback (absent in Phase A code)"), threat model T4
(*hypothesis:* "no network (Phase A)"), AD-19 §1/threat model T4 (*experiment:*
"AC-11 asserts no network egress during any operation").

**What is wrong.** Spec FR-X5: "the only network use is the host CLI piggyback
(§10)." A `git fetch --unshallow` at `init` is outbound network use — with the
user's ambient git credentials, against a possibly huge remote history — on a
path the spec's security requirement excludes and that three other places in
this same document assert cannot happen. As designed, AC-11 ("no network beyond
the model piggyback") fails on any shallow clone with a configured remote. This
is both a spec §7.2 violation and an internal contradiction; the document
cannot be simultaneously right in AD-3 and in AD-19/T4.

**Evidence.** AD-3 §1 verbatim ("`init` may attempt `git fetch --unshallow`
only when a remote is already configured and the fetch succeeds without
prompting"); spec FR-X5, FR-X7, AC-11; AD-19 §1; threat model T4.

**Fix.** Remove the auto-unshallow: on a shallow clone, key by normalized
origin URL (the branch AD-3 already defines), report the keying mode, and let
the owner/agent unshallow outside the tool if they want commit-keyed identity.
If the architect believes the fetch is worth it, that is a spec question
(FR-X5 would need an explicit carve-out) — not an architecture-local override.
Either way, reconcile AD-19, T4, and the AC-11 mapping with whatever is chosen.

### S4 — "The general 'deny outlives its condition' fault … is unreachable by construction in Phase A" is an over-claim; a reachable, undetected instance exists, and AC-9's required induction is substituted away

**Location:** AD-17 §1 (faults bullet, final sentences); AD-9 §1 (clear
recognizer, detectors).

**What is wrong.** The construction argument covers only the state-*freshness*
axis (deny reads state after same-process catch-up). It does not cover the
state-*correctness* axis: the clear recognizer judges substance by "length
above a small floor after stripping tool noise" plus a deferral stoplist. A
genuine answer that is short ("Yes — 4.", "use the second one") or falsely
stoplist-matched leaves the question `open`; every subsequent `Write`/`Edit` is
then denied **after the agent has actually answered** — verbatim FR-M2's class
("the oracle keeps denying an action after the agent has actually answered").
Neither named detector fires: `deny_after_answer_lag` requires catch-up to
eventually classify the answer as an answer (a misclassified answer never is),
and `deny_loop` requires "no intervening assistant text turn" (there is one —
the answer). So the class is reachable and self-undetected, while the document
declares it unreachable. Downstream, spec AC-9 requires an **induced**
deny-outlives-condition to "appear in the log and `status` as a self-detected
failure class"; AD-17 replaces that induction with a different one (reader
breakage → `transcript_layout_changed`), i.e. the criterion is quietly
weakened to fit the design. This is the same "true by construction" failure
shape the 2026-07-30 round-2 review flagged at Critical and the collapse-log
records as a signature.

**Evidence.** AD-17 §1 verbatim; AD-9 clear-recognizer and detector
definitions; spec FR-M2, AC-9.

**Fix.** Add a detector independent of the clear recognizer — e.g. a fault
(`deny_despite_answer_text`) when N denies accumulate for a consumer with ≥1
intervening assistant text turn since the newest question opened (the inverse
of `deny_loop`), surfaced on the wrongful-deny side of `status` — and restore
AC-9's induction as the spec states it (induce a real answer the recognizer
misses; assert the fault class appears). Delete or scope the "unreachable by
construction" sentence to the freshness axis it actually establishes.

---

## Moderate

### M1 — Runtime floor Node 22.13.0 admits versions with no FTS5; the "now unexpected" fallback is guaranteed on 22.13–22.15

**Location:** AD-2 §1 ("runtime floor Node 22.13.0"), §3, V7, L9.

**What is wrong.** FTS5 landed in `node:sqlite` in **v22.16.0** ("sqlite:
enable common flags", nodejs/node#57621). Verified this session:
`deps/sqlite/sqlite.gyp` has zero `FTS5` matches at tags v22.13.0 and v22.15.0
and one at v22.16.0; the enabling commit sits in the 22.16.0 changelog
section. AD-2's floor (22.13.0, from C-1's unflagged-`node:sqlite` date)
therefore admits three minor-version ranges where the FTS5 probe *must* fail,
while AD-2 describes that path as "now unexpected" and V7/L9 treat the stock
engine as unconditionally FTS5-capable. A user on 22.13–22.15 passes `init`'s
version check and silently lands on the degraded `LIKE` fallback.

**Fix.** Raise the floor to 22.16.0 (and route the C-1 note's 22.13.0 figure
through the same premise-maintenance path L9 used for C-2), or re-describe the
`LIKE` fallback as the expected behavior for 22.13–22.15 in AD-2 and `status`.

### M2 — The ASVS mapping claims 5.0 but four of five chapter numbers are 4.0's

**Location:** "ASVS verification mapping (ASVS 5.0)" table; AD-7 §2 ("ASVS
V7"), AD-12 §2 ("ASVS V5-class"), AD-25 §2 ("ASVS V15-class").

**What is wrong.** Verified against the OWASP/ASVS repository (`5.0/en`
chapter files): in ASVS 5.0, **V5 = File Handling**, **V7 = Session
Management**, **V8 = Authorization**, **V14 = Data Protection**, **V15 =
Secure Coding and Architecture**. The table's rows "Input validation
(V5-class)", "Error handling & logging (V7-class)", "Data protection
(V8-class)", and "Configuration (V14-class)" use ASVS **4.0** numbering under
a 5.0 label; only V15 is correct for 5.0. A reviewer following the cited
anchors lands on the wrong (mostly N/A) chapters — a standards mapping that
does not resolve is decoration with wrong addresses.

**Fix.** Renumber to 5.0 (input validation → V1/V2 Encoding-and-Sanitization /
Validation-and-Business-Logic; error handling & logging → V16; data protection
→ V14; configuration → V13; secure coding → V15), or pin the table explicitly
to ASVS 4.0.3. Fix AD-7/AD-12's inline anchors to match.

### M3 — The question-intake mechanism is specified in two contradictory ways (V5/AD-6 vs AD-9)

**Location:** V5 Result column ("AD-9's question intake … read exactly these
fields", i.e. `UserPromptSubmit.prompt`); AD-6 event map ("`UserPromptSubmit` |
question intake (AD-9)"); AD-9 §1 (state writer defined solely as transcript
catch-up over real user turns).

**What is wrong.** V5 and AD-6 say intake reads the `prompt` hook field; AD-9's
mechanism reads only the transcript. These are different designs with
different failure modes: prompt-field intake avoids V1's write lag at the
intake moment but needs dedup against the same turn later appearing in
catch-up (`asked_uuid` cannot be set from the hook input — the entry has no
uuid yet); transcript-only intake makes AD-6's row and V5's Result claim wrong
and inherits the lag at `UserPromptSubmit` (benign only because the deny check
re-runs catch-up at `PreToolUse`). An implementer must make an architectural
call inline — the exact thing Gate A attests was eliminated ("No inline
architectural calls found remaining").

**Fix.** Specify the intake source explicitly. If prompt-field: define the
reconciliation with catch-up (match on content+offset when the turn lands in
the file; never double-open). If transcript-only: correct V5's Result and
AD-6's row, and state the intake-lag consequence.

### M4 — Dormant Phase B/C machinery is shipped under a justification the document itself rejects one decision earlier

**Location:** AD-22 (`deferred_queue` + expiry/re-validation semantics, "no
Phase A genre writes to it"); AD-4 (`recipes … -- schema now; Phase B/C
writer`); AD-5/AD-21 (`env_capabilities` — Phase A has no model path, so
nothing writes it); vs AD-5 §4 (rejecting the `genre_state` ladder because
"shipping its table now would be dormant machinery asserting a capability
Phase A does not have") and the per-phase lifecycle (`CLAUDE.md`; Phase B/C
mechanisms are designed against Phase A exit data).

**What is wrong.** Three dormant structures ship in Phase A with no Phase A
writer, while a fourth is rejected on exactly the dormancy ground. The stated
justification for `deferred_queue` — "the queue's schema is store surface (a
Phase A artifact)" — is nullified by AD-25's own forward-only
`schema_version` migrations: Phase B can add tables. What Phase A genuinely
must fix is the *seam property* ("the model never sits on the deny path";
delivery re-validation exists as a contract), not the concrete schema and
semantics of mechanisms whose consumers are designed next phase against data
that does not yet exist.

**Fix.** Apply one criterion consistently: either (a) move `deferred_queue`'s
schema/semantics, `recipes`, and `env_capabilities` to the phases that write
them, keeping only the named interface seams (AD-9's reader contract, the
`model/invoke.ts` interface), or (b) state the criterion that admits these
three but excludes `genre_state`, in the document, and show each passes it.

---

## Minor

### m1 — The "subagent `additionalContext` propagation is undocumented" premise is stale

**Location:** Knowledge-state baseline ("assumed not, per spec §13/C-4");
echoed in STATUS.md.

The current hooks reference (fetched this session) states it: SubagentStop
feedback/context goes **to the subagent**, and "to inject context back into the
parent session … a PostToolUse hook on the Agent tool should be used instead."
The assumption ("not") is confirmed — nothing in the design breaks — but the
open item is no longer an unknown, and the documented parent-injection channel
is exactly the "option added" the spec §13 paragraph anticipated. Premise
maintenance (same class as L9), including spec §13.

### m2 — `agent_transcript_path` is a SubagentStop payload fact used as an every-event fact

**Location:** AD-11 §1 ("subagent consumer: `agent_transcript_path` **from the
event input** (V4 — documented field; no path derivation)").

V4 verifies the field on **SubagentStop** input only. Whether a subagent's
`PreToolUse`/`PostToolUse` input carries it is unverified, and AD-11's catch-up
runs "on every event." Nothing load-bearing rests on it (qa-state is
main-consumer-only), but the citation does not cover the use. Verify the field
on subagent tool events, or scope transcript catch-up to the events where the
path is verified present.

### m3 — The audit-not-droppable rule is attributed to the wrong review round

**Location:** AD-8 §1 ("the 2026-07 round-2 finding that fail-open must not
apply to the audit control").

The finding originates in the 2026-07-22 round-1 collapse-hunt (collapse-log
2026-07-22 entry, item 4: "The FR-X6 audit log was put in the droppable
'bookkeeping' class"; review file CH-4) and was verified **closed** in round 2.
In a project whose 2026-08-25 collapse entry is specifically about citation
precision, the round attribution should be exact.

### m4 — The deny-loop threshold "≥3 consecutive denies" is a bare number

**Location:** AD-9 §1 (deny-loop signal).

Every other operating number in the document is marked illustrative/tunable
with its storage named (AD-13, AD-14); this one is not, and carries no source.
It is diagnostic-only, so the risk is low — but mark it tunable in `tuning`
like its peers, per the project's numbers-with-sources rule.

### m5 — "store_corrupt → whisper-only silent mode" is incoherent

**Location:** AD-17 §1 (faults bullet).

With a corrupt store, candidate generation (store queries) and
audit-before-emit (a store write) are both unavailable, so no whisper can be
emitted either; "whisper-only" cannot describe this state. AD-11 uses
"whisper-only" in a different sense (denies disabled, whispers continue) —
correct there, where the store is healthy and only the transcript reader is
broken. Name the store-corrupt posture what it is (fully silent + JSONL fault
+ `status` flag) and reserve "whisper-only" for the deny-disabled mode.

---

## Checks run that came back clean

**Citation resolution (exhaustive).** Every spec/ledger key cited in the
document was enumerated by pattern extraction (≈160 distinct keys) and each
resolves against the spec/ledger as read in full this session; no retired ID
(`FR-O4`, `FR-O4a`) is cited as live; `tools/check_docs.py` passes on the
current tree. Historical citations resolve **and support**: the old-spec
constraint AD-1 quotes ("a background service with local IPC, or equivalent")
found verbatim in the pre-revision spec (git `894ae7a^`, line 719); F5
(2026-07-30 round-2 review) says what AD-3 uses it for; the `--bare` finding
originates 2026-07-22 as AD-21 states; collapse-log 2026-08-25 lesson 5
supports AD-10's use; the 2026-08-16 "wrong-check" entry supports AD-14's.

**Citation support (load-bearing spot-set, all clean except as found above).**
AD-16's boundary table matches FR-A4 case-by-case (`startup`/`clear` clean,
`resume`/`fork` reseed, `compact` clears read-set only); AD-14 implements
FR-A5's conjunction with no cap (OL-C1/AC-3) and FR-A5a's noise-floor-only
hazard path with OL-C4's chosen posture; AD-9's steady-state/lag-window leans
match FR-B5/D-41 clause-for-clause; AD-10 matches FR-B3/AC-2's control-flow
assertion; FR-B4's single-cycle Stop delivery honors `stop_hook_active`;
AD-17's `status` covers every FR-M4 item, with "not yet measured" (not 0) for
Phase B/C signals; AD-20 covers every §10 CLI verb; FR-X2-stricter
(pointer-only) is a permitted tightening.

**Premise re-establishment (independent, this session).** V1 confirmed
verbatim from the current hooks reference; V2 (deny/reason/additionalContext
separate; precedence deny > defer > ask > allow; exit 2 routes as deny); V3
(both Stop channels, `stop_hook_active`, 8-consecutive-continuation cap); V4
(SubagentStop payload fields, verbatim example); V5 (`prompt`; `source ∈
{startup, resume, clear, compact, fork}`); V6 (600 s default, 30 s
UserPromptSubmit, SessionEnd 1.5 s budget raised to 60 s, and — verbatim —
"Timed-out PreToolUse hooks prevent the tool from running", the fail-closed
hazard AD-23 exists for); hook-config `timeout` confirmed to be seconds. V7
executed here (FTS5 virtual table + MATCH on v22.22.2; `ENABLE_FTS5` in
`PRAGMA compile_options`; `sqlite.gyp` on `v22.x` defines it). V8 re-measured:
44–50 ms over 5 runs (doc: 45–54 ms). V9 executed with the exact designed
command: `is_error:false`, `num_turns:1`, result `"ok"`, 4.1 s wall. V10/V11
confirmed from `claude --help` verbatim. V13 re-executed on this clone: 4 root
commits, `--is-shallow-repository` true, 8 entries in `.git/shallow` — exact
match. V14 confirmed from the npm registry (0.26.13 / 0.1.13, no
install-phase scripts). V12's *entry-type enumeration* confirmed; its
discrimination rule is S1.

**Spec coverage.** The traceability matrix was walked against the spec key by
key (§4 genres, §5, §6, §7.2, §8 incl. C-1–C-6/NF-1, §10, §11.1–11.5, §12
D-keys, §14): every key is mapped or explicitly phase-deferred, and each
deferral matches the spec's own phasing (§11.5; §14's "Phase-B and Phase-C
acceptance" paragraph — AC-2a-ii, AC-2b, AC-2c's skill clause, AC-16, AC-21
full, AC-25 full). No Phase A requirement is quietly deferred; the FR-C4
deferral against STATUS.md's earlier listing is correctly resolved in favor of
the standing per-phase rule, and current STATUS corroborates.

**Owner constraints.** No pre-emptive gate: the deny is reachable only after
an open question *and* a deviating action, structurally confined to one caller
(AD-10). No separate credentials anywhere (V9 runs on host auth; S3 is a
network finding, not a credentials finding). No volume/count/budget caps:
AD-14 carries no cap term, dedup is the never-repeat property, deny-loop and
the watchdog are diagnostics/latency devices, not speech limits (OL-C1 /
OL-R1 / OL-R3 clean). OL-R4 clean: zone data exists only as advisory whisper
content; no deny path can consume it (AD-10 confinement, T2's structural
argument). OL-R2 clean: no manufactured owner superlatives found.

**Standards discipline.** All 26 ADs carry the five-part format with real
content in each part (including honest "no factual premises — pure design
choice" where true); "Phase 8 trigger" and "Gate A" are the governing skill's
own terms (verified in the skill file); the numbered reasoning chain and the
stated no-matrix justification comply with the skill's trigger rules; every
row of the "Standards governing this architecture" table drives at least one
named decision (the ASVS row's *numbering* is M2; the mapping's substance —
which controls exist — is real).

**Internal consistency (beyond findings).** Watchdog arithmetic (2.5 s <
NF-1's 3 s ceiling < wired 5 s < harness defaults) checks out; AD-8's ordering
is consistently applied in the data flow, AD-19, and AD-26; the component map,
event table, and genre table agree on trigger wiring; the Limitations section
matches the capability claims elsewhere except where S2/S4 note over-claims.
