# Collapse-hunt — `docs/specs/spec-context-oracle-phase0.md`, second rebuild (2026-08-01, eleventh pass)

*Independent adversarial pass, fresh subagent, never the author. Mission-fidelity
axis only. **Written once, never edited.***

**Target:** `middleware/context-oracle/docs/specs/spec-context-oracle-phase0.md`
at commit `93de2c2`, governing Phase 0 over `spec-context-oracle.md` wherever both
address the same subject.

**Prior pass:** `docs/reviews/2026-08-01-collapse-hunt-phase0-spec-rebuild.md`
(21 findings + 5 minors, at `332406c`). Its findings are closure items here and
**every one was re-derived from the current file**, not assumed applied. The
changes since are `332406c..93de2c2`: the round-2 expert review and collapse hunt
(`10a6cfc`) and the rebuild against them (`93de2c2`).

**Verdict: 23 findings — 10 collapse, 13 partial — plus 6 minors.**

**Of the prior 21: all 21 are closed as stated.** Six leave residuals that are new
findings this round (N1→Q1, N2→Q2, N4→Q3, N5→Q9 and Q10, N20→Q7, N21→Q21), and in
three of those the *class* the finding named reopened elsewhere in the document
while its named instances were fixed. **Of the prior 5 minors: 3 closed, 1 partially
closed (M5), 1 open for the third pass running (M2 → Q16).** The prior pass's
carried-forward item (F10, three passes old) is still neither applied nor
adjudicated (Q18).

The prior round's rebuild was the most successful in this project's history on the
axis it was aimed at: nineteen of twenty-one findings are genuinely gone, every
ROSE quotation now verifies verbatim *with correct attribution*, every hook-contract
quotation resolves in current source, and the two structural devices that failed
last round (§3's partition, §4's source table) are arithmetically and
bibliographically exact for the things they list.

**The dominant class this pass is the direct consequence of that.** Three of the
four heaviest findings are facts that live inside the 242,078 bytes §4 attests to
having downloaded and string-matched, and that the document does not contain —
because string-matching a quotation confirms the quotation and can never confirm
the *enumeration*. `Stop` and `SubagentStop` hand the hook `last_assistant_message`,
the text of the agent's final response (Q1). A resumed session replays past
injected text without re-running the hook (Q4). Tool hooks fire inside subagents
and carry `agent_id` (Q5). Each falsifies a load-bearing Phase 0 premise; each was
one grep away from the file the document says it downloaded.

The second class is the collapse log's own standing lesson, alive: **the fix for
a finding was applied to the finding's named instances rather than to its class.**
N2 named ten mis-filed rows in §3; the ten moved and eleven others were never
re-derived (Q2). N4 named two dropped sources; those two returned and six others
are still gone (Q3). N5 named one table giving one reason for five items; that
table was split and the table beneath it still gives one reason for seven (Q10).

The single heaviest finding is **Q1**. `[OWNER-12]` ruled on the moment an agent
claims completion. P0-3 states — as the fix for last round's N1 — that Phase 0
cannot recognise that moment because narration reading is Phase 1. The current
hooks contract puts the agent's final response text on the `Stop` hook's own input
and tells hooks to use it *instead of* the transcript. The discrimination the owner's
ruling was about is available in Phase 0, and the requirement written to be honest
about lacking it is honest about the wrong thing.

---

## What survives, stated first so the findings read as exceptions

Each re-derived from primary source in this pass, not inherited:

- **Every ROSE quotation is verbatim and every attribution is now correct.** I
  fetched the TSE 2005 PDF, extracted the text locally, and matched all eleven
  quoted strings in §4, FR-K2, P0-5 and P0-D-8. All eleven are exact. More
  importantly, P0-5's cost paragraph — last round's N11 — now carries the
  *"However, for those cases where ROSE issues a warning, it predicts 75 percent of
  the items that are actually missing"* clause, names the cost as **coverage rather
  than quality**, and correctly separates the §7.5 Prevention evaluation (precision
  > 66%) from the §7.6 Closure evaluation (2% false alarms). I checked the
  surrounding paragraphs of each, not only the strings. This is the cleanest
  source handling this project has produced.
- **§4's hook-contract quotations all resolve in current source.** I downloaded
  `code.claude.com/docs/en/hooks.md` — **242,078 bytes, byte-for-byte the figure
  §4 attests to** — and `hooks-guide.md`, and string-matched every quotation in §4.
  All present. The `PreToolUse` exit-0 sentence and *"staying silent doesn't approve
  it"* are both on `hooks.md` (line 154), so last round's M3 is closed rather than
  merely moved. The per-handler timeout defaults (600/30/60), the `UserPromptSubmit`
  lowering, and the `SessionEnd` 1.5-second budget with its raise-to-60 s clause are
  all verbatim in the `timeout` field row.
- **§3's partition is arithmetically exact and its namespace rule now holds.** I
  re-enumerated the v1 identifier set independently: 7 FR-O + 9 FR-K + 9 FR-A +
  5 FR-D + 5 FR-J + 3 FR-S + 7 FR-L + 4 FR-M + 8 FR-X + 3 NF + 5 C = 65. The three
  sets are 38 + 10 + 17 = 65 and cover each identifier exactly once. I extracted
  every identifier token in the document: **no new `FR-*`, `NF-*` or `C-*` is
  minted anywhere.** Last round's N3 is fully closed — `FR-A5a`/`FR-A5b` are now
  `P0-5`/`P0-6`.
- **Every `RETHINK.md` line citation resolves.** All twenty-four cited ranges were
  read against current source, including `:321–323` at FR-X5, which last round's
  N16 caught overreaching and which now carries only the read-only-repository claim
  with the network and tool-authority clauses correctly re-sourced to `[LLM01]` and
  flagged in P0-D-11.
- **The `[OWNER-12]` volume bound landed.** P0-3's delta defaults to zero with a
  reason, the per-session count is bounded, both halves of the suppression record
  exist, and AC-30 tests the delta-attribution rather than merely "something was
  suppressed." N10 and N14 are closed without residue.
- **Orientation's landmine arm, FR-L6's reader, the vendored warning's own content
  shape, and the five constraint criteria** (AC-31, AC-32, and the inspection list)
  all landed. N6, N7, N19 and N21 are closed.

---

## Part 1 — closure ledger for the prior pass's 21 findings and 5 minors

Re-derived from the current file. "Closed" means the defect is absent from the
current text, not that a commit says it was fixed.

| # | Prior finding | Status | Evidence in the current file |
|---|---|---|---|
| N1 | `Stop` fires at every turn end; `[OWNER-12]`'s cost spent unbounded | **Closed in form; its replacement premise is false** | §4 records *"`Stop` fires 'When Claude finishes responding'"*; P0-3 states it plainly; the per-session bound is 3 with AC-30. But P0-3's new sentence — *"Detecting an actual completion claim requires narration reading, which is Phase 1"* — is falsified by the same contract (**Q1**). |
| N2 | §3's "unchanged" false in ten rows | **Closed for those ten, reopened in eleven others** | FR-O1, FR-O6, FR-A2, FR-A5, FR-K3/K4/K5, FR-M2, FR-X5, C-1 are now in the narrowed table; FR-A4, FR-K1, FR-K2 and NF-3 had their v1 clauses genuinely restored. Eleven other "unchanged" rows are not unchanged (**Q2**). |
| N3 | `FR-A5a`/`FR-A5b` minted in a closed namespace | **Closed** | Renamed `P0-5`/`P0-6`; identifier extraction over the whole file finds no minted `FR-*`/`NF-*`/`C-*`. |
| N4 | §4's closed source table dropped `[MSR-04]` and `[HH-04]`; AC tested a missing requirement | **Closed for those two, reopened for six** | FR-K2 states five mining rules again, `[MSR-04]` and `[HH-04]` are in §4, AC-25 has its requirement. Six other v1 source keys are still absent while the requirements resting on them are filed in force (**Q3**). |
| N5 | §2 gave one reason for five narrowed arms | **Closed for the arm table; the same defect sits in the table above it** | §2's arm table now gives six arms six distinct reasons, and the historical-breakage row explicitly says it is *"not a record-type gap."* The exclusion table's last row still gives one reason for seven items (**Q10**), and the historical-breakage reason names evidence Phase 0 does not collect (**Q9**). |
| N6 | Orientation's landmine arm deleted with a mechanism left behind | **Closed** | §7's Orientation content cell reads *"plus any landmine matching the task shape"*; §2 states the arm is **not** narrowed; AC-9 and AC-21 test it. |
| N7 | FR-L6 wrote records no genre could read | **Closed** | P0-D-2 states the reader; AC-21 tests write-then-read end to end. |
| N8 | Three requirements compound to near-silence on the exit run | **Closed in form** | §14 now states *"The exit run must also have produced something"* and AC-33 makes a zero-whisper run a failing exit. Residual: the exit run's relation to FR-A7's window is unstated and AC-33's remedy assumes one answer (**Q23**). |
| N9 | P0-D-4 certified stated values FR-A7 did not carry | **Closed** | FR-A7 carries 3, FR-A6 carries 200/20, and P0-D-16 states in writing that the bar's scalar is the architect's. |
| N10 | Stop-bar delta "defaults to its top decile" | **Closed** | Defaults to zero, P0-D-9 gives the reason, AC-30 tests delta attribution. |
| N11 | P0-5's cost sentence stopped one clause short of the source | **Closed** | The "However…" clause is quoted, the 75% recall figure is kept, and the cost is named as coverage, not recall. Verified verbatim against the PDF this pass. |
| N12 | §3 said P1–P9 unchanged while P0-3 falsifies P2 | **Closed** | §3: *"except P2, whose worst-outcome clause … is qualified for stop-delivered whispers by `[OWNER-12]`."* |
| N13 | §4 omitted `Stop`'s `additionalContext` and the `SessionEnd` budget | **Closed** | Both are in §4, both verified verbatim this pass; C-2 carries the `init` timeout and AC-6's settings accounting includes it. |
| N14 | FR-A6 stated at three granularities | **Closed** | Two floors, both with values, P0-D-7 explains why both, AC-4 tests both. |
| N15 | AC-10 required two stop whispers at one stop | **Closed** | AC-10 and AC-11 are each scoped to a stop where the other genre has no candidate; §7 adds *"Stop-class genres compete."* |
| N16 | FR-X5's no-network clause cited a RETHINK range that lacks it | **Closed** | Re-sourced to `[LLM01]`; P0-D-11 rewritten so the chain terminates. |
| N17 | A fifth measurement required with no recorder | **Closed** | P0-4 enumerates six, P0-D-12 says six, FR-M1 and FR-X6 both record the token count. |
| N18 | FR-L1 had no criterion | **Closed** | AC-29, scoped to presence and readability per P0-D-12. |
| N19 | The vendored warning arm had no content shape or floor disposition | **Closed** | Its own §7 row with its own consequence; P0-6 covers *"Both warning arms"*; AC-7 tests both. |
| N20 | FR-A3's warning priority restored without adjudication and hard-coded by a criterion | **Closed in form** | P0-D-15 records the two commits' disagreement; AC-28 reduced to the budget-hard half. Residual: P0-D-15's resolution — *"FR-A5's, per candidate, at runtime"* — is not a resolution in Phase 0 (**Q7**). |
| N21 | C-1, C-3, C-5, FR-D4 and P0-2 had no criterion | **Closed** | AC-31, AC-32, and the "verified by inspection" block. Residual: C-1's re-verification instruction points at documentation its own source says does not carry the fact (**Q21**). |
| M1 | §2's header falsified by its Unknown row | **Closed** | *"or the reason its phase is unresolved upstream."* |
| M2 | §2's subagent-delivery Reason cell contains no reason | **Open, third pass** | The cell still restates the behaviour (**Q16**). |
| M3 | §4 named the reference page and quoted the guide page | **Closed** | Both quotations are on `hooks.md`, the page §4 names. Verified this pass. |
| M4 | The bar's third term had two names | **Closed** | FR-A5 names `self_serve_cost` and states the rename. |
| M5 | P0-D-1 downgraded FR-O5's grounding | **Partially closed** | P0-D-1 now scopes the judgment to *stating* FR-O5 rather than to the requirement. But §3 files FR-O5 as unchanged, which carries v1's `[CHI-25]`, and `[CHI-25]` is not in §4 (**Q3**). |
| F10 (carried) | No push announcement when the oracle self-suppresses | **Neither applied nor adjudicated, third pass** | See **Q18**. |

---

## Part 2 — new findings

### Q1 — `Stop` and `SubagentStop` hand the hook the agent's final response text. P0-3 defers completion-claim detection to a reader it does not need, and the requirement written to be honest about Phase 0's blindness is honest about the wrong thing. COLLAPSES.

**Decisions attacked:** P0-3's second sentence; §2's *"Narration reading and intent
tracking | Phase 1 | Requires the transcript reader"*; §4's contract-fact list.

**Mission sentence available:** P0-3's own — the capability exists to speak at the
moment an agent claims completion, `[OWNER-12]`.

**The collapse question:** *P0-3 says recognising a completion claim needs the
transcript reader. Open the 242,078-byte reference §4 says it downloaded and find
the field that carries the agent's final response.*

It is there, on the two events in question, twice:

> In addition to the common input fields, **Stop hooks receive `stop_hook_active`,
> `last_assistant_message`, `background_tasks`, and `session_crons`.** … The
> `last_assistant_message` field contains the text content of Claude's final
> response, **so hooks can access it without parsing the transcript file.** For
> hooks that act on the just-completed turn … use this field rather than reading
> `transcript_path`.
> — `code.claude.com/docs/en/hooks.md`, Stop input

> In addition to the common input fields, **SubagentStop hooks receive
> `stop_hook_active`, `agent_id`, `agent_type`, `agent_transcript_path`, and
> `last_assistant_message`.**
> — same source, SubagentStop input

And the common-input table's `transcript_path` row directs hooks away from the
transcript for exactly this purpose: *"Hooks that need the final assistant text of
the current turn should use `last_assistant_message` on Stop and SubagentStop
instead of reading the transcript."*

So P0-3's premise is false as stated. What Phase 0 lacks is a *transcript reader*;
what recognising a completion claim needs is *the last assistant message*, and the
harness supplies it as a plain string field on the event that fires. A literal or
lexical test over that string is the same class of mechanism P0-1 already specifies
and ships — *"literal-match landmine detection is a read over indexed content and
over promoted records"* — and FR-J3 in the v1 spec already establishes that
literal matching is the model-free half of a genre.

Three consequences, all inside the owner's ruling:

1. **The volume bound is now the wrong instrument.** P0-3 bounds stop-grade
   whispers to 3 per session *because* it cannot tell which stop is the one. With
   the field available, the honest design speaks at the moment and needs no
   arbitrary cap — or states why literal matching over `last_assistant_message` is
   insufficient and keeps the cap with that reason. The current text gives neither.
2. **`[OWNER-12]` is being under-served, not over-served.** The ruling is that the
   capability stays. Phase 0 implements a different, blunter capability and
   attributes it to the ruling. `RETHINK.md:379`: the ruling *"is **not** a ranking
   of this moment against the others."* Spending it at every turn boundary while
   capping the total at 3 is a ranking made by the cap.
3. **§2's deferral row is false for this case.** Narration *tracking across turns*
   needs the transcript; the *final message of the turn that just ended* does not.
   The row's single reason covers both.

The collapse log carries this exact entry from last round: *"When an owner ruling
names a moment, record the mechanism that recognises that moment — and if the phase
has none, say so in the requirement rather than letting the nearest event stand in
for it."* The phase does have one. The requirement says it does not.

**Class: unverified.**
**Fix:** add `last_assistant_message` (both events, and `StopFailure`'s different
meaning for the same field name — there it holds the API error string) to §4's
contract-fact list. Then either state in P0-3 that Phase 0 recognises a completion
claim by a deterministic test over that field, with a criterion; or state that it
deliberately does not and why, and keep the cap on that stated reason. What may not
stand is a requirement whose stated blindness is contradicted by the contract the
document attests to having read.

### Q2 — §3's "in force in Phase 0, unchanged (38)" is false in eleven rows, and this document's own decision entries record the change §3 denies. The N2 fix was applied to N2's named rows, not to N2's class. COLLAPSES.

**Decision attacked:** §3 — *"Each has exactly one Phase 0 disposition below, so a
reader can tell a deliberate exclusion from an omission without diffing the two
documents."*

**The collapse question:** *§3 exists so a builder need not diff. Take the eleven
"unchanged" rows that have a `[P0-D-n]` entry and diff those.*

| Row, filed "unchanged" | What v1 says | What this document says | Where the change is recorded |
|---|---|---|---|
| FR-A6 | *"below a configurable minimum of mined history **per region**"* — one floor, no value | **two** floors, corpus 200 and region 20, both with values | `[P0-D-7]`, `[P0-D-4]` |
| FR-A7 | *"only highest-confidence **genres** speak"*, count configurable | first **3** sessions; an enumerated candidate set; coupling **at the warn-grade floor**, not coupling | `[P0-D-8]`, `[P0-D-4]` |
| FR-L6 | *"Human statements **in chat**"* | entry channel is **the CLI** | `[P0-D-2]` |
| FR-L1 | logs uptake evidence | + *"Phase 0 … makes no uptake judgment"* | `[P0-D-12]` |
| FR-X2 | repo-derived strings appear *"only as clearly delimited quotations **or** pointers"* | **pointer-only is the default**; quotation only for mechanically-generated content | inherited from the architecture; nowhere in §3 |
| FR-X6 | *"logged with the evidence it used"* | + *"and its injected-token count"* | the N17 fix; nowhere in §3 |
| FR-X7 | *"local to the user's machine or container; no telemetry leaves the machine"* | *"outside the repository tree and … no outbound traffic at all"* | `[P0-D-11]` |
| FR-M1 | includes model-call attempts and degraded-mode transitions | those removed; per-whisper token counts added | the N17 fix; nowhere in §3 |
| C-2 | warm state, sub-second, cold-start cannot meet NF-1 | + teardown on `SessionEnd` + `init` writes an explicit timeout | the N13 fix; nowhere in §3 |
| C-3 | shims hold harness knowledge **and the service speaks a harness-neutral event contract** | first clause only | nowhere |
| C-4 | *"wire hooks, create the out-of-tree store, nothing else"* | + writes C-2's `SessionEnd` timeout; reframed as *"its only tree-touching act"* | the N13 fix; nowhere in §3 |

Two of these are substantive losses rather than bookkeeping. **C-3** dropped the
harness-neutral event contract — the clause v1 says *"is also what keeps subagent
and other-harness support open"*, in a phase whose §2 defers subagent delivery to
the next one; and §14's inspection item for C-3 tests only the negative half
(*"no harness-specific identifier outside the shim modules"*), so the property that
was dropped is also the one nothing checks. **FR-X2** was tightened past v1 on the
strength of a harness argument that does not hold (**Q19**), and the tightening is
invisible to anyone reading §3.

Nine of the eleven carry a `[P0-D-n]` entry stating the very change §3 denies. A
builder who trusts §3 — which is what §3 asks in its opening sentence — and a
reviewer who uses §3 as next round's closure inventory both inherit a baseline that
this document contradicts internally.

The generator is named in the collapse log, written the day this document was
rebuilt: *"Treat any newly-added summary, table, partition or namespace rule as the
first thing the next round verifies, not the settled part."* The rebuild verified
the ten rows N2 listed. It did not re-verify the section.

**Class: unverified.**
**Fix:** move all eleven into the narrowed table with their narrowing and where it
is stated — the mechanical part. Then restore C-3's harness-neutral-contract clause
or record its removal as a decision, because that one is a capability, not a
citation.

### Q3 — §4's closed source table is closed by dropping six source keys whose requirements are still in force, four of them filed "unchanged." N4's mechanism, one round on. COLLAPSES.

**Decision attacked:** §4 — *"No source outside this table is cited, and no
requirement depends on one."*

**The collapse question:** *FR-A7 says only the highest-confidence candidates speak
in a project's first sessions. Name the evidence that a project's first sessions
are special.*

There is none in this document. `[P0-D-8]` states the ground without attributing
it — *"early reports set the tool's credibility"* — which is `[COVERITY-10]`'s
first-impression finding, the source v1 cites at FR-A7 and which §4 does not carry.
Five more:

| Requirement | Its v1 source | Status here |
|---|---|---|
| FR-A7 — first impressions | `[COVERITY-10]` (first ~3 reports set credibility) | filed **unchanged**; source absent, ground paraphrased in `[P0-D-8]` |
| FR-D5 — always state the evidence ratio | `[HERZIG-13]` (up to 15% of fixes are tangled; co-change edges are never certainties) | filed **unchanged**; source absent, and the *reason* the ratio is mandatory is gone with it |
| FR-O5 — event boundaries only, no timers | `[CHI-25]` (task-boundary intervention effective; idle-time triggering backfires) | filed **unchanged**; source absent; `[P0-D-1]` re-grounds it on a judgment instead |
| FR-D1 — a claim with a verifiable pointer | `[JOHNSON-13]` (guidance must carry enough to assess what and why) | filed **unchanged**; source absent |
| FR-X1 — secret detection before any store, log or whisper | `[OWASP-SM]` §8, `[LLM02]` | filed **unchanged**; both absent |
| FR-K6's trust label, FR-X4, threat T2 | `[ASI-26]` (ASI06 Memory & Context Poisoning) | filed **unchanged**; absent. FR-K6 defers its justification to *"T2 in §10, where its justification lives"* — and §10's T2 paragraph cites nothing at all |

That last chain is the sharpest. FR-K6 points at T2 for its justification; T2 is the
only threat in §10 with no source; T2's cost claim (*"a poisoned fact outlives its
session and is delivered with unearned authority"*) is `[ASI-26]`'s, uncited. The
derivation chain that P0-D-11 was written to make terminate on something that holds
terminates, one requirement over, on nothing.

FR-O5's case is worse than a missing citation. `[CHI-25]` is a *measured* result
about proactive-assistance timing. `[P0-D-1]` replaces it with *"the grounding is a
judgment"* — so the requirement is now weaker-sourced in Phase 0 than in v1 while
§3 says it is unchanged, and `CLAUDE.md`'s standard is that external facts are
verified against primary sources, not downgraded to judgments when the source list
is being trimmed.

The prior pass diagnosed the mechanism at N4 — *"the document's source list decided
its requirement set, rather than the other way round"* — and named it in the
collapse log as a device *"closed to two entries … by deleting the requirements
needing the others."* The rebuild restored the two requirements N4 named. It did not
ask which other requirements the closed table had orphaned.

**Class: reduction.**
**Fix:** add the six keys to §4 with their v1 confirmation status carried honestly
(*"Carried from v1 `:n`"* is the pattern already in use and it is the right one), or
record each affected requirement in §3's narrowed table with "source not carried
into Phase 0" as the narrowing. What may not stand is an attestation that no
requirement depends on an uncited source when at least eight do.

### Q4 — A resumed session replays every past whisper into the agent's context without running the oracle, and a compaction discards the context FR-A4's dedup assumes is still there. The requirement carrying the mission's marginal-value clause rests on an equation the contract falsifies twice. COLLAPSES.

**Decisions attacked:** FR-A4; C-2's teardown at `SessionEnd`; FR-A3's per-session
budget; NF-2 and P0-4's token-overhead measurement; AC-3.

**Mission sentence available:** `RETHINK.md:59–61` — *"Marginal value over the
agent's own abilities is the only relevance metric that matters"* — of which FR-A4
is the implementation, and AC-3 the criterion the prior pass called the first test
the mission's load-bearing clause has ever had.

**The collapse question:** *FR-A4 says never tell the agent what it has already
seen. The oracle's record of what it has seen is torn down at `SessionEnd` (C-2).
What happens on `claude --resume`?*

Verified against current source this pass:

> Claude Code saves the injected text in the session transcript. For mid-session
> events like `PostToolUse` or `UserPromptSubmit`, **when you resume with
> `--continue` or `--resume`, Claude Code replays the saved text rather than
> re-running the hook for past turns**, so values like timestamps or commit SHAs
> become stale.
> — `code.claude.com/docs/en/hooks.md`, "Add context for Claude"

> `source` — How the session started: `"startup"` for new sessions, **`"resume"`**
> for resumed sessions, `"clear"` after `/clear`, **`"compact"` after compaction**,
> or `"fork"` for a new session forked from an existing one.
> — same source, SessionStart input

Two independent breaks, neither recorded anywhere in the document:

1. **Resume double-delivers and the oracle cannot see it.** Every whisper the
   oracle sent in the prior session is re-injected by the harness. The oracle's
   Tier 3 state was destroyed at `SessionEnd`, so it starts blind and may send the
   same whisper again — the precise thing FR-A4 forbids, arriving alongside the
   harness's own copy. The FR-X6 audit log records one delivery for two receipts.
   FR-A3's 2,000-token session budget and NF-2's *"session token overhead"* are both
   computed from what the oracle sent, not what the agent received, so on a resumed
   session the one number the owner is shown for injected-token cost is
   systematically low by the whole of the prior session's spend. AC-19 checks that
   `status` reports the quantity; nothing checks that the quantity is the agent's.
2. **Compaction inverts the dedup test.** FR-A4's premise is that a fact the agent
   has read is a fact the agent has. After a compaction the agent's context is a
   summary; the file it read may be gone from it. The oracle's read set is
   monotonic and has no compaction signal, so post-compaction it suppresses exactly
   the facts most worth re-delivering. `SessionStart` fires with `source:
   "compact"` — the signal exists and FR-O1 makes `SessionStart` observation-only
   without saying what it is observed *for*.

This is the shape the collapse log names as *"a stated limitation is a bound only
when independent of the decision it feeds."* FR-A4's suppression is treated as free
because a suppressed whisper costs nothing; on resume the suppression is not the
oracle's, and on compaction the suppression is wrong.

**Class: unverified.**
**Fix:** record both facts in §4. Then give `SessionStart`'s `source` a job in
FR-O1 (it is already observed): on `"resume"`, either seed the session's
delivered-set from the audit log so FR-A4 and the token budget account for the
replay, or state that Phase 0 does not and that the token measurement excludes
resumed sessions — and say which in P0-4, because that number is one of the six
Phase 1 is tuned from. On `"compact"`, state whether the read set survives it. A
criterion on the resume path belongs with AC-3, which is the criterion this
falsifies.

### Q5 — Tool hooks fire inside subagents and carry `agent_id`. Phase 0 observes those events and can never speak on them, and the silence rate — the measurement Phase 0 exists to produce — mixes structural non-delivery with below-bar silence. COLLAPSES.

**Decisions attacked:** FR-O6; P0-4's silence rate; AC-2; §1's *"running it is the
only way to obtain evidence about how often the oracle should speak."*

**Mission sentence available:** §1's, above.

**The collapse question:** *`RETHINK.md:342–344` says the owner's real work fans out
to subagents and that a main-agent-only oracle "misses most of the decisions that
matter." Phase 0 is main-agent-only. What fraction of the events its silence rate is
computed over could ever have produced a whisper?*

The contract settles that the events arrive:

> Hooks from settings files, managed policy settings, and plugins **also run inside
> subagents**. When a subagent calls a tool, tool events such as `PreToolUse` and
> `PostToolUse` **fire the same configured hooks as in the main conversation**, and
> the input carries the `agent_id` and `agent_type` common input fields that
> identify the subagent.
> — `code.claude.com/docs/en/hooks.md`

FR-O1 observes every completed read/search and every pending and completed
edit/write. FR-O6 keys them per consumer and *"delivers nothing against"* the
non-main ones. So on any fan-out session, a structurally undeliverable class of
events enters the denominator of:

- **P0-4's silence rate**, reported to the owner as one number;
- **AC-2's ≤ 10% ceiling**, which gets easier to pass the more the agent delegates;
- **§14's exit run**, whose whole purpose is to produce the evidence Phase 1's bar
  is tuned from.

`RETHINK.md:273–275` says a silence rate is interpretable only against a hit rate,
and `[P0-D-12]` correctly declines a hit rate in Phase 0. A silence rate that also
mixes two structurally different causes of silence is not one number short of
interpretable; it is not a measurement of the bar at all.

This is not an argument to build subagent delivery — §2 places it in Phase 1 and
this pass does not contest that. It is that the phase justified by measurement
reports a measurement whose denominator the document never defines, on the one axis
the owner has stated is where most of his decisions happen.

**Class: wrong-check.**
**Fix:** state in FR-O6 or P0-4 that the silence rate is decomposed — events with no
candidate, events with a candidate below the bar, and events on a consumer Phase 0
does not deliver to — and scope AC-2's ceiling to deliverable events. Record the
contract fact in §4, because it also settles v1 §14's *"whether tool hooks fire
inside subagent contexts"*, which is currently listed as unverified upstream while
the answer sits in the file §4 downloaded.

### Q6 — Orientation's primary content is "2–4 entry points **for the task**", and no Phase 0 mechanism produces the "for the task" part. v1's own model-free formulation is *"structural entry points … no model intent inference"*. COLLAPSES.

**Decision attacked:** §7's Orientation row; AC-9.

**Mission sentence available:** orientation is the only Phase 0 whisper that reaches
the agent before it has done anything — the mission's *"at the moment of that
decision"* at its earliest point.

**The collapse question:** *P0-1 states the mechanism for the landmine arm —
literal match over indexed content and promoted records. State the mechanism for the
entry-point arm.*

The document does not. §7 promises entry points *for the task*; AC-9 tests *"a
submitted prompt whose entry points are in the index"*, which presupposes a mapping
from prompt to entry points and names nothing that performs it. §2 defers *"intent
tracking"* to Phase 1. And v1 already recorded what model-free orientation is,
in FR-J3's enumeration of the genres that survive without a model:

> minimal orientation (**structural entry points and literal-match landmines, no
> model intent inference**)

So the v1 spec's own text says the model-free orientation whisper is *structural*
entry points — the repository's entry points, not the task's — and this document
states the stronger form without the mechanism and without recording the difference.
§3 files FR-A2 as narrowed and lists the narrowing as *"Six are built; six are
deferred; six built arms are narrowed per §2's arm table"* — orientation's
entry-point arm is not among them.

This is the collapse log's named tell: *"a citation that lands on a design intent,
a schema column, or a component name rather than on a per-candidate computation with
named inputs is an unfilled requirement wearing a reference."* Here the reference is
to the index, and the computation — prompt text to a ranked set of entry points —
is the whole genre.

**Class: reduction** (an owner-approved genre narrowed to whatever the architect
happens to implement, defended by the existence of the index between prompt and
answer).
**Fix:** state the mechanism, in the class P0-1 already uses — a lexical match of
the prompt's nouns against indexed symbol, file and directory names, ranked by
structural weight — and give AC-9 a negative case (a prompt matching nothing yields
silence, not the repository's default entry points). Or adopt v1 FR-J3's formulation
verbatim, drop "for the task" from the entry-point arm, and record it in §2's arm
table with the condition that fills it.

### Q7 — In Phase 0 `materiality` is a per-genre constant for every genre, so FR-A5's bar contains a fixed genre precedence. §7 says there is none, and P0-D-15's resolution of the warning-priority question depends on there being none. COLLAPSES.

**Decisions attacked:** FR-A5; §7's *"there is no genre precedence"*; `[P0-D-15]`;
`[P0-D-16]`.

**The collapse question:** *FR-A5 says `materiality` "falls back to the genre's base
weight for mechanical genres." Name a Phase 0 genre that is not mechanical.*

There is none — §2 excludes the model client, and §2's own reason for excluding it
is that *"every genre in §7 is reachable without one."* So for every candidate
Phase 0 can ever score, `materiality` = the genre's base weight, and

> decision-impact = base_weight(genre) × structural_weight(candidate)

Two candidates with equal confidence, equal marginal value and equal structural
weight are therefore ordered **entirely by which genre they belong to**. That is a
genre precedence, fixed at build time, in the term the score was decomposed into.

Three things break on it:

1. **§7 states the opposite, in the paragraph written to close N15.** *"They are
   ordered by FR-A5's score like any other candidates; **there is no genre
   precedence.**"* The sentence is true of the ordering *rule* and false of the
   ordering *outcome*, and it is the sentence a reader uses to conclude that
   verification's exposure at the stop is a scoring accident rather than a constant.
2. **`[P0-D-15]` resolves the warning-priority question by pointing here.**
   *"Whether a warning outranks a coupling whisper under budget pressure is FR-A5's,
   per candidate, at runtime."* In Phase 0 that comparison reduces to
   base_weight(warning) vs base_weight(coupling) — a constant chosen by the
   architect. So the decision entry written to avoid converting an unsourced genre
   ranking into a build-time invariant resolves it into a build-time invariant one
   layer down, and says so in the language of runtime.
3. **`[P0-D-16]` assigns it to the architect as an internal.** *"The bar's shipping
   scalar and the score scheme's internals are the architect's."* A genre ranking is
   not an internal. The collapse log's standing directive, from this same day: *"no
   ranking claim about this tool's purposes, genres, triggers or moments enters any
   document unless the owner stated it in those words, quoted and attributed."*
   Handing it to an architect with no statement at all is not compliance with that
   directive; it is the directive routed around.

**Class: mechanism-not-mission.**
**Fix:** state in FR-A5 or a `[P0-D-n]` that in Phase 0 `materiality` is constant
per genre and that the base weights therefore constitute the only genre ordering the
tool has; correct §7's sentence to say what is true (no genre *bypasses* the bar);
and either state the base weights with the same discipline `[P0-D-4]` applies to
FR-A3's budget, or state that they ship equal so the ordering is carried entirely by
`structural_weight` and confidence. AC-11's per-genre delivered counts are the right
detector for whichever is chosen.

### Q8 — FR-X6's audit trail has no reader. §1 makes the owner's after-the-fact audit a consumer requirement; §12 says `status` is his only view and P0-4 says `status` reports six aggregates. COLLAPSES.

**Decisions attacked:** §12's *"Provided"* list and its *"Nothing else"*; P0-4;
FR-X6.

**Mission sentence available:** §1's second consumer — *"The owner must be able to
audit afterwards everything the oracle said and the evidence behind it, and is a
non-programmer by design."*

**The collapse question:** *The owner wants to see what the oracle said last
session. Name the command.*

There is none. §12 lists `init`, `index`, `status`, `deinit` and the FR-L6 entry
command, then says *"Nothing else."* `status` is scoped by the same sentence to
*"the oracle's health and measurements"*, and P0-4 enumerates exactly what it
computes: silence rate, latency distribution, continuation count, suppression count,
session token total, delivered count per genre. Six aggregates. Not one whisper.

v1's §6.3 lists *"inspection of stores and whisper logs (FR-X6)"* in the CLI
surface. §3 files FR-X6 as **in force, unchanged**. So the requirement that
*"gives the owner a reviewable audit trail"* is in force, its writer is specified,
its contents are tested by AC-16 — and the surface by which the owner reviews it was
dropped without record.

Why this is a collapse and not a CLI omission:

- FR-X6 is named in §10 as the **oversight control** for T1 and T2. `[LLM01]`'s
  human-oversight mitigation is a person reading the channel no human sees live. A
  log written to disk with no command that prints it is not oversight by a
  non-programmer; it is oversight by whoever can open a store file, which
  `RETHINK.md:355–359` says the owner is not.
- The 2026-07-22 collapse-hunt already killed one version of this: *"a dropped audit
  write is an un-auditable whisper, invisible to the owner"*, fixed by making the
  whisper log non-droppable. The write survived; the read was removed a document
  later.
- AC-16 checks that every whisper *is in* the log. It is executed by a test harness,
  not by the consumer §1 names.

**Class: reduction** (a consumer requirement narrowed to the half that a test can
assert).
**Fix:** add whisper-log inspection to §12's provided list and to `ctxoracle
status` or a sibling command, and extend AC-16 with a clause that the owner-facing
command prints the delivered whispers with their evidence and token counts in
language `RETHINK.md:355–359`'s reader can use. Or record in §13 that Phase 0
deliberately ships the audit trail unreadable and name the phase that reads it —
which is the honest cheaper form and should be visible as a choice.

### Q9 — Consequence's historical-breakage arm is deferred pending "the false-fire evidence Phase 0 is built to collect." Phase 0 collects no false-fire evidence. COLLAPSES.

**Decision attacked:** §2's arm table, the historical-breakage row — *"It is
deferred only because ranking a breakage claim needs the false-fire evidence Phase 0
is built to collect | Returns: Phase 1, on Phase 0's measurements."*

**The collapse question:** *Name the Phase 0 requirement that records a false fire.*

There is none.

- **FR-L3** (false-fire handling) is in §3's deferred-whole list, owned by Phase 2.
- §2's exclusion table defers *"the false-fire ladder"* to Phase 2.
- **P0-4** enumerates the six quantities `status` computes. False-fire rate is not
  among them, and `[P0-D-12]` states that six is the whole measurement obligation.
- **FR-L1** records *"subsequent evidence that the agent acted on it"* — uptake, not
  correction — and `[P0-D-12]` explicitly declines to turn it into a judgment.
- **FR-D3**'s false-fire clause invites correction *in the agent's narration*, and
  narration reading is Phase 1 (**Q14**).

So the arm's stated blocker is a Phase 2 output, and its stated return is *"Phase 1,
on Phase 0's measurements"* — measurements Phase 0 does not take. The row is
internally inconsistent in one line.

The row is otherwise the best in the table: it is the one arm that correctly refuses
the record-type excuse and says so in bold — *"**Not a record-type gap.** It joins
the co-change graph (FR-K2) against test topology (FR-K1), both of which Phase 0
builds and populates."* Having established that both stores exist, the reason given
for not building it is the one reason that does not exist either.

And the ranking machinery it supposedly lacks is already specified and shipped:
P0-5's evidence floors govern every history-derived claim, and warn-grade requires
support ≥ 3 and confidence ≥ 0.9. Coupling and completeness ship on exactly that
machinery with exactly that much false-fire evidence — none.

**Class: mechanism-not-mission.**
**Fix:** build the arm (both stores exist, the floors exist, and `RETHINK.md:166`
gives the whisper verbatim: *"Edits here historically break
`tests/settings.test.ts`"*), or state the real blocker. If the real blocker is that
a breakage claim asserts causation where coupling asserts correlation, that is a
defensible reason and it is the one to write. What may not stand is a deferral
whose condition no phase before Phase 2 can satisfy and whose return is scheduled
for Phase 1.

### Q10 — §2's exclusion table gives one reason for seven deferred items and it is false for at least two. N5 reproduced one table above. COLLAPSES.

**Decision attacked:** §2's last exclusion row — *"Distiller, learning loop,
false-fire ladder, automated landmine/invariant/recipe mining, self-report,
export/import | Phase 2 | **Each consumes measurements Phase 0 produces**."*

**The collapse question:** *Name the measurement `ctxoracle export` consumes.*

None. FR-K9 round-trips a project store to a file *"so learned knowledge survives
ephemeral containers"*; it consumes a store, not a measurement. The same is true of
**automated landmine/invariant/recipe mining**, which consumes git history — and
§2's own arm table says so four rows earlier, giving those gaps the reason *"no
automated writer"*, not "consumes measurements." One table contradicts the other on
the same items.

Export/import is worth a second look on its own merits, because the reason is not
merely wrong, it is hiding a question. `[OWNER-4]` requires sandbox compatibility;
this project's own containers are ephemeral; and Phase 0's store is built from an
index and a mining run that NF-3 says can be redone with no network. So the honest
reason is *"the store is rebuildable, so surviving a container is not yet worth a
format decision"* — which is a real reason, and which also explains why v1 §14
routes the export format to a Phase 2 owner decision. None of that is in the cell.

The prior pass's N5 was this exact defect one table below: *"§2 gives one reason for
all five narrowed genre arms."* The fix gave the arm table six reasons for six arms
and left the row above it unexamined. Same section, same round, same class.

**Class: unverified.**
**Fix:** split the row. Distiller, learning loop, false-fire ladder and self-report
do consume Phase 0 measurements — keep them together. Automated mining consumes
history and is blocked on nothing Phase 0 measures; give it the arm table's reason.
Export/import gets its own reason and a pointer to v1 §14's open format decision.

### Q11 — P0-5's suggestion-grade floor drops v1's confidence conjunct, so the loosest evidence the tool can speak is bounded by support alone. ROSE's own conclusion is that both dimensions are required. PARTIAL.

**Decision attacked:** P0-5's last sentence — *"Suggestion-grade coupling may run
looser, never below support ≥ 2."*

v1 FR-A5: *"suggestion-grade coupling may run looser but never below pruned-
heuristic levels (**support ≥ 2 plus a confidence threshold**)."*

The conjunct is gone and §3 does not record it: FR-A5 is in the narrowed table, and
its stated narrowing is *"Three terms per v1 §12's 'Phase 0's bar'; no degraded-mode
rise (P0-2); the evidence floors are elaborated as P0-5 and P0-6."* Elaborated, not
reduced.

The consequence is concrete. A file that changes with forty different files, two of
them alongside `Y`, clears "support ≥ 2" with a confidence around 0.05. That is the
raw, unpruned association `[HH-04]` measures at ~6% precision, which is the very
figure P0-5 cites one clause earlier as the reason a floor exists. And the ROSE
measurement P0-5 quotes for the neighbourhood is an operating point on *both* axes —
*"for a support count of 1 **and a confidence of 0.1**"* — from a paper whose
conclusion on the matter I read in full this pass:

> Furthermore, Fig. 6 shows that **high support count and confidence thresholds are
> required for a high precision.** … In practice, a graph such as the one in Fig. 6
> is thus necessary to select the "best" support count and confidence values for a
> specific project.

Suggestion-grade coupling is not a marginal channel here: `[P0-D-8]` makes
warn-grade coupling the only coupling a project hears in its first three sessions
precisely so that the loosest evidence is not the first impression — an argument
that assumes the loose grade is loose but bounded. As written it is bounded on one
axis.

**Class: reduction.**
**Fix:** restore the confidence conjunct with a stated default of `[P0-D-4]`'s
class, and add the negative case to AC-4 (a pair at support 2 with confidence below
the suggestion threshold yields silence). AC-12 already fixtures a support-2
candidate and can carry it.

### Q12 — `[P0-D-8]` attributes ROSE's precision of 0.30 to support ≥ 2. It was measured at support 1 and confidence 0.1, and the paper states that raising support raises precision. PARTIAL.

**Decision attacked:** `[P0-D-8]` — *"admitting suggestion-grade coupling — which
P0-5 permits down to support ≥ 2, **where `[ROSE-05]` measured precision 0.30** —
would make the loosest evidence in the system the first thing a project ever
hears."*

P0-5 itself gets this right: *"`[ROSE-05]` measured 'a feedback of 0.64 and a
precision of 0.30' at support 1 and confidence 0.1."* The compression in P0-D-8
moves the figure one operating point over, and the paper says the move matters:

> In Fig. 6, ROSE achieves for a support count of 1 and a confidence of 0.1 a
> feedback of 0.64 and a precision of 0.30 … **Fig. 6 also shows that increasing the
> support count threshold also increases the precision**, but decreases the feedback
> as ROSE gets more cautious.

So the decision that restricts FR-A7's first-sessions set — one of the three
requirements N8 showed compounding toward a silent exit run — rests on a figure
attributed to the wrong threshold, in the direction that makes the restriction look
more necessary than the source supports. The restriction may still be right; the
number quoted for it is not the number at that point.

**Class: unverified.**
**Fix:** one clause — *"where `[ROSE-05]` measured precision 0.30 at the adjacent
support-1 point, rising with support"* — or drop the figure from P0-D-8 and leave
P0-5's correct statement to carry it.

### Q13 — FR-D3 mandates a false-fire clause; AC-26 forbids any imperative construction in any emitted whisper; and the harness's own guidance names imperative framing as a non-delivery risk. The three cannot all hold. PARTIAL.

**Decisions attacked:** FR-D3; FR-D2; AC-26; AC-7.

**The collapse question:** *Write the false-fire clause AC-26 permits.*

FR-D3 requires *"an explicit false-fire clause inviting correction."* An invitation
is a directive act; v1's own worked example is *"If this classification is wrong,
proceed, and say so in your narration so the oracle learns"* — two imperatives.
AC-26 requires that **no emitted whisper in any fixture run** contains an imperative
construction, and AC-7 requires both warning arms, in the same fixture set, to carry
the false-fire clause. The two criteria run over the same output.

The harness makes it sharper rather than resolving it. §4 already records that
*"text framed as out-of-band system commands can trigger Claude's prompt-injection
defenses, which causes Claude to surface the text to you instead of treating it as
context"*, and the same passage opens with the instruction the spec did not quote:

> **Write the text as factual statements rather than imperative system
> instructions.** Phrasing such as "The deployment target is production" or "This
> repo uses `bun test`" reads as project information.

So the one whisper class the owner personally ruled must exist and be loud —
`[OWNER-3]`'s *"loud warning whisper"* — carries a mandatory clause in the exact
register the harness says can cause the whisper to be shown to the user instead of
the agent. That is the silent non-delivery FR-X2 already worries about, arriving
through the format requirement rather than through quotation.

**Class: wrong-check.**
**Fix:** state the false-fire clause in declarative form in FR-D3 — *"This
classification is mechanical and can be wrong; the edit is not blocked"* — which
carries the same information, satisfies FR-D2 and AC-26, and matches the harness's
guidance. Then AC-7 and AC-26 are jointly satisfiable and can stay as written.

### Q14 — FR-D3's false-fire clause invites correction through a channel Phase 0 cannot read, and its consumer is Phase 2. PARTIAL.

FR-D3 is filed in §3 as **in force, unchanged**. Its v1 text says the clause invites
correction *in narration* and that *"the false-fire clause is the feedback channel
FR-L3 consumes."* In Phase 0, narration reading is deferred (§2) and FR-L3 is
deferred whole to Phase 2 (§3). So Phase 0 ships an invitation with no listener and
no consumer, in the genre whose credibility `[P0-D-8]` says the first sessions
decide.

This is N7's shape — a producer with no consumer — surviving in the direction the
N7 fix did not look. N7 asked what reads what FR-L6 writes; nothing asked what reads
what FR-D3 solicits.

It is not necessarily wrong to ship the clause early: it is also an honesty marker
to the agent, and it costs tokens the budget already accounts for. What is wrong is
that §3 calls FR-D3 unchanged while two of the three things v1's FR-D3 says about
the clause are untrue in this phase.

**Class: mechanism-not-mission.**
**Fix:** one clause in FR-D3 or a `[P0-D-n]` — the false-fire clause ships in
Phase 0 as an honesty marker; the channel that receives it (narration) and the
component that consumes it (FR-L3) arrive in Phase 1 and Phase 2 respectively. Then
§3's "unchanged" becomes a narrowing with a stated reason, per **Q2**.

### Q15 — FR-X5 says read-only repository access and AC-14 says no writes inside the tree; C-4 requires `init` to write the settings file. P8's carve-out is cited by neither. PARTIAL.

- **FR-X5:** *"Least privilege: read-only repository access (`RETHINK.md:321–323`)…"*
- **AC-14:** *"An instrumented run shows **no writes inside the repository tree** and
  no outbound traffic at all."*
- **C-4:** *"its only tree-touching act is writing the harness settings file,
  including C-2's `SessionEnd` timeout."*
- **AC-6:** *"the only ever-touched file in the tree is the harness settings file."*

Read literally, AC-14 and AC-6 cannot both pass on a run that includes `init`, and
FR-X5 forbids what C-4 requires. The reconciliation exists — v1's **P8**: *"The only
in-tree write, ever, is hook wiring in `.claude/settings.json` during an explicit
`ctxoracle init`"* — and §3 puts P1–P9 in force. But neither FR-X5 nor AC-14 names
it, so the exception lives in a principle the requirement contradicts on its face.

It matters more than a wording nit because T4 is *"the failure that ends trust
outright"* and FR-X5 is its control. A control stated absolutely and violated by
design, with the exception recorded elsewhere, is exactly how the exception widens.

**Class: unverified.**
**Fix:** FR-X5 gains *"except the single hook-wiring write C-4 permits on explicit
`init` (v1 P8)"*, and AC-14 gains *"other than the settings write AC-6 accounts
for."*

### Q16 — §2's subagent-delivery row still contains no reason, and the fact that would settle it is in §4's own source. PARTIAL — third pass.

The Reason cell reads *"Phase 0 records a per-consumer key where an event carries one
(FR-O6) and delivers to the main agent only"* — a restatement of the behaviour, in a
column headed "Reason", for the third pass running. F9 raised it, the prior pass's
M2 raised it again, the cell changed twice and the defect did not.

There is now a further reason to fix it: the uncertainty that justified the deferral
upstream is resolved. v1 §14 lists *"whether tool hooks fire inside subagent
contexts"* as unverified and gates FR-O6 on it. The reference §4 downloaded answers
it — hooks fire, and carry `agent_id`/`agent_type` (**Q5**) — and adds the delivery
detail: *"To inject context into the parent session after a subagent returns, use a
`PostToolUse` hook on the `Agent` tool instead."* So the deferral is a scope call,
not a blocked one, and a document that leaves the cell empty leaves the next reader
to rediscover a resolved question.

**Class: unverified.**
**Fix:** write the reason — subagent delivery is deferred as scope, not capability;
the contract fact is recorded in §4 and v1 §14's item is closed by it.

### Q17 — No criterion asserts that every emitted whisper parses to FR-D1's format and that every pointer resolves. P4 governs unchanged; v1's AC-6 is not carried. PARTIAL.

v1 **AC-6**: *"Every emitted whisper parses to the FR-D1 format and every pointer
resolves to a real location/commit in the fixture."* Nothing in this document's §14
does that. AC-1 checks one coupling whisper's pointer; AC-8 checks one consequence
whisper's content; AC-15 checks that repo-derived spans are pointers rather than
quotations — which is a different property (that the span is a pointer, not that the
pointer resolves). AC-16 checks that *records* carry provenance, not that whispers
carry resolvable ones.

So **P4 — "Provenance on every claim"** — which §3 puts in force unchanged, and
which `RETHINK.md:187–188` states as *"A whisper the agent can't check is a rumor"*,
has no criterion. The prior pass noticed this as F5 item (iii) and routed it to a
finding number (N21) whose body covers different requirements, so it fell out of the
ledger between rounds rather than being rejected.

**Class: wrong-check.**
**Fix:** carry v1's AC-6 across as a universal criterion over every whisper emitted
in every fixture run. It costs one criterion and it is the only check that the
mission's verifiability property holds for whispers the specific genre criteria do
not happen to exercise.

### Q18 — F10 is neither applied nor adjudicated, three passes on. PARTIAL.

No requirement announces a self-detected suppressing condition on the human channel.
FR-M2 detects *failure* classes; being below FR-A6's corpus floor, inside FR-A7's
first-sessions window, or above the bar on every candidate are not failures — they
are correct behaviour that is indistinguishable, to the owner, from a broken oracle.
`ctxoracle status` is pull; `[OWNER-10]`'s standard is *"without depending on the
owner noticing anything"*, and a pull surface depends on him thinking to look.

§13 records no decision rejecting it. `CLAUDE.md`: *"When a review surfaces findings,
apply **all** of them. Do not propose a prioritized subset."* Three passes of silence
is not adjudication.

AC-33 partially covers the exit run — a run that produced nothing fails loudly. That
is the right shape and it exists only at the exit, once.

**Class: wrong-check.**
**Fix:** either a clause in FR-M2 or P0-4 (a session that ends with a suppressing
condition active reports it on the human channel per FR-D4, never into agent
context), or a `[P0-D-n]` recording the rejection with its reason. Either closes it;
neither has been done.

### Q19 — FR-X2's harness-mechanical justification is not what the cited sentence says. PARTIAL.

**FR-X2:** *"**Pointer-only is the default for every repository-derived span.**
Inline quotation is permitted only for mechanically-generated content, **because a
delimited quotation of hostile imperative text is the shape the harness's own
injection defences screen for (§4)** — which would convert the whisper into a
user-facing notice, a silent non-delivery."*

§4's fact, verified verbatim this pass, is about the *hook's own framing*:

> Write the text as factual statements rather than imperative system instructions.
> … **Text framed as out-of-band system commands** can trigger Claude's
> prompt-injection defenses, which causes Claude to surface the text to you instead
> of treating it as context.

The source says nothing about delimited quotations, and a delimited quotation
explicitly labelled as data is the opposite framing from an out-of-band system
command. The requirement is right — pointer-only came from the 2026-07-22
collapse-hunt and `[LLM01]`, both sound — but the *mechanical* reason attached to it
is an inference presented as a contract consequence, in the one section of this
document that attests to string-matching its claims.

Note the direction: the same sentence supports **FR-D2** exactly (informative, never
imperative), where the document uses it correctly. It was then reused one requirement
over, where it does not fit.

**Class: unverified.**
**Fix:** keep the requirement; attribute it to `[LLM01]` and the architecture's prior
finding, and delete or re-scope the harness clause. If the harness argument is wanted,
it belongs at FR-D2, where it already is.

### Q20 — §2's reason for deferring answer drift misidentifies its producer. PARTIAL.

**The cell:** *"Process conformance requires model judgment; **answer drift's open
questions are written by the narration reader**."*

v1 FR-A9: *"**Direct user questions** are tracked as open items in Tier 3. If
successive assistant turns … fail to address an open question, the oracle whispers
the question back — verbatim, with its location."*

A direct user question arrives in the user's prompt. Phase 0 observes
`UserPromptSubmit` (FR-O1) and the harness supplies the `prompt` field. The open
questions are therefore written by an event Phase 0 already handles, not by the
narration reader. What genuinely needs judgment is the *addressing* test — deciding
whether a turn answered it — and, with `last_assistant_message` available (**Q1**),
even the assistant-side text is in hand.

The deferral is almost certainly right; the reason given is false, and it is false in
the way N5 was false — a stated cause that does not apply to the item it is attached
to. Recording the wrong blocker is how a genre gets re-deferred in Phase 1 for a
reason that was never true.

**Class: unverified.**
**Fix:** *"answer drift's open questions are observable in Phase 0, but deciding
whether a turn addressed one requires model judgment."*

### Q21 — C-1 instructs re-confirming its witness stack's capabilities "against that stack's current documentation", and v1's own source note says the load-bearing capability is not documented. PARTIAL.

**C-1:** *"A satisfying stack exists as a witness, not a mandate: Node ≥ 22.13.0 with
built-in `node:sqlite`, FTS5 compiled in on both LTS lines `[NODE]`. Any runtime and
storage engine meeting the three properties is acceptable, and the capabilities
relied on are confirmed **against that stack's current documentation** before they are
relied on."*

v1 C-1 and §3's `[NODE]` row both say the opposite about the FTS5 half:

> FTS5 presence is a **build-config fact of official Node builds, not a documented
> API promise** — the architecture must not be unable to fall back if it moves.

So C-1's re-verification instruction points at a source its own key says does not
carry the fact, and the fallback caveat — the falsifiable half, and the one that
tells an architect what to do when the fact moves — is gone. §3 files C-1 as
narrowed and states the narrowing as *"v1's named satisfying stack is retained as a
witness rather than a mandate; three testable runtime properties are added."* The
dropped caveat is not in it.

AC-31 tests installation and first index in a cold container, which would catch the
absence of FTS5 on the day it moved — after the architecture had been built on it.

**Class: reduction** (the falsifiable clause dropped from the constraint that
decides whether Phase 0 is buildable).
**Fix:** restore the caveat and the fallback obligation verbatim from v1, and change
"current documentation" to "current documentation and, where the capability is a
build-config fact rather than a documented promise, against the built artifact."

### Q22 — P0-3's per-session bound of 3 is a stated number with no decision entry and outside `[P0-D-4]`'s enumerated set. PARTIAL.

P0-3: *"At most **3 stop-grade whispers per session** (configurable), which is the
per-session bound `RETHINK.md:393–399` leaves unstated while bounding the per-stop
cost to one."*

`[P0-D-9]` justifies the *delta* (zero, with a reason) and asserts that *"the
per-session count is bounded"* without saying why three. `[P0-D-4]` names the
quantities carrying stated judgment values — *"FR-A3's budget, FR-A6's floors and
FR-A7's session count"* — and does not include this one. `[P0-D-16]` explicitly
carves out only the bar's scalar. So a number governing the capability the owner
personally ruled on sits in neither the sourced set, the stated-judgment set, nor
the architect's set.

`CLAUDE.md`: *"Numbers without sources don't go in."* The remedy is small: three is
defensible as a judgment of P0-D-4's class, and the entry is the point.

**Class: unverified.**
**Fix:** add the count to `[P0-D-4]`'s enumeration, or give it its own entry stating
it is a judgment expected to move on §14's exit-run data — which is what AC-33
already obligates for the other two quantities.

### Q23 — §14's exit run has no stated relation to FR-A7's first-sessions window, and AC-33's remedy assumes one answer while AC-20's fixture is defined by the other. PARTIAL.

**AC-33:** *"A run that produced none does not pass: it obligates re-setting FR-A7's
session count or FR-A6's floors from that run's data and re-running."*

**AC-20:** *"The fixture runs **outside** FR-A7's first-sessions window."*

**§14's opening:** *"a run on a real project produces a clean `ctxoracle status`."*

Re-setting FR-A7's session count is only a remedy if the exit run happens inside
FR-A7's window — otherwise FR-A7 suppressed nothing and changing its count changes
nothing. AC-20 shows the document knows the distinction matters and states it for its
own fixture. §14's exit run, the one that certifies the phase and produces every
number Phase 1 is tuned from, does not say which side it is on.

The two readings give materially different exits. Inside the window, only the two
warnings and warn-grade coupling can speak, and ROSE's 3% feedback bounds the latter
— which is the compounding N8 identified, now correctly *reported* by AC-33 but still
undefined as to whether it applies. Outside the window, all six genres are live and a
zero-whisper run means something else entirely, for which re-setting FR-A7 is not the
indicated fix.

**Class: wrong-check.**
**Fix:** one sentence in §14 stating whether the exit run is the owner's first
sessions on a real project or a later one, and matching AC-33's remedy set to it.

---

## Minors

- **M1 — AC-33 requires a quantity P0-4 does not enumerate.** *"The exit run's
  `ctxoracle status` reports its whisper count."* P0-4's six are silence rate,
  latency, continuations, suppressions, token total, and delivered count per genre.
  The whisper count is the sum of the last, so it is derivable — but N17's whole
  lesson was that a criterion requiring a quantity the enumerating requirement omits
  is how a recorder goes missing. One word in P0-4.
- **M2 — FR-A3 dropped v1's "orientation counts against it."** Implied by *"a
  per-session injected-token budget"*, and orientation is the whisper most likely to
  be argued exempt because it arrives before the session has a budget history. The
  clause costs nothing to keep.
- **M3 — FR-X1 and FR-M1 lost their model-call clauses without record while FR-X5
  and FR-M2 kept theirs.** FR-X5's model-call removal is in §3's narrowed table and
  FR-M2's is stated in its own text; FR-X1's *"or a model-call prompt"* and FR-M1's
  *"model-call attempts and results"* and *"degraded-mode transitions"* simply
  vanish from rows filed unchanged. The removals are correct; the inconsistency of
  treatment is what makes §3 unreliable (**Q2**).
- **M4 — §14's inspection item for FR-D4 is stricter than FR-D4.** *"Inspection
  confirms the human-notice path shares no code with the context-injection path."*
  FR-D4 requires that human notices never consume agent context; two paths can share
  a formatter and satisfy it. A criterion that fails a compliant implementation is a
  criterion that will be argued with rather than run.
- **M5 — FR-O1 observes `SubagentStop` but not `SubagentStart`**, while §4's own
  lifecycle bullet names both and FR-O6 needs the consumer key. The key is
  recoverable from `agent_id` on the subagent's tool events, so nothing breaks — but
  the asymmetry is unexplained in a requirement that lists its events exhaustively.
- **M6 — C-2's `SessionEnd` timeout has a plugin caveat the contract states and §4
  omits.** *"Timeouts set on plugin-provided hooks don't raise the budget."* C-4
  writes the settings file, so Phase 0 is safe as designed — but C-5 makes the
  contract re-verified at implementation, and the caveat is the kind that turns a
  packaging decision into a silent teardown failure.

---

## Self-serving check (mandatory — the inclusive direction has nothing watching it)

Collapse log 2026-08-01, lesson 10: *"after a run of kills the authoring instinct
learns that inclusive proposals survive — every safeguard here points at exclusion,
so an inclusive error has nothing watching for it."* This pass against itself:

- **Q2, Q3, Q10, Q12, Q16, Q19, Q20, Q21, Q22, Q23 and all six minors cost nothing
  but accuracy.** Each says the document states something about itself, its sources
  or its terms that is not so. None adds capability. Apply without argument.
- **Q7, Q14, Q15 are statements, not builds.** Each asks the document to say what is
  already true of it — that materiality is constant in Phase 0, that FR-D3's clause
  has no Phase 0 receiver, that FR-X5 has an exception. Free.
- **Q11 restores a conjunct the governing parent already contains.** Free in the
  direction of the precedence rule.
- **Q1 is the one finding that could enlarge Phase 0**, and I have priced both forms:
  using `last_assistant_message` is *more* capability, while recording the fact and
  keeping the cap on a stated reason is *no* capability and closes the finding
  equally. The second is the honest minimum. I flag this explicitly because the
  finding runs in the direction nothing watches, and because `[OWNER-12]` must not be
  reopened either way — the capability stays; what is at issue is which mechanism
  Phase 0 claims to have.
- **Q4, Q5, Q8, Q17, Q18 add measurement, criteria or a CLI surface to things already
  required.** These cost implementation work and are the ones to argue about. Each
  names a requirement in force whose measurement, verification or consumer surface is
  missing; none proposes a new requirement. Q8's cheaper honest form is to record in
  §13 that Phase 0 ships the audit trail unreadable — which shrinks the phase and
  should be visible as a choice rather than as an omission.
- **Q6 and Q9 each have a cheaper form that makes Phase 0 smaller**, and I state
  them as the alternatives rather than burying them: adopt v1 FR-J3's *structural*
  entry points and drop "for the task" (Q6); keep historical breakage deferred on the
  real blocker (Q9). Both run against this pass's own direction.
- **Q13 is the one finding that argues for less** — a declarative false-fire clause
  is weaker than an imperative one. Priced here so it is visible as the exception.
- **Nothing in this pass proposes a new requirement or a new genre.** The prior
  pass's F10 remains the only genuinely additive item on the table and is carried
  forward unchanged (Q18) rather than re-argued.

---

## The single most dangerous unexamined assumption

**That downloading the contract and string-matching every quotation verifies the
contract.**

§4 is the strongest source-handling section this project has produced. Its byte count
is exact, every quotation resolves, and the method it names — *"Downloaded raw …
and string-matched, rather than queried for snippets"* — is the right correction to
the failure the collapse log records from the round before, where a sentence carried
from a sibling document was re-attributed to a primary source.

And it cannot see what it did not look for. String-matching confirms that a claimed
quotation exists. It confirms nothing about the claims the document makes about what
the contract *does not* provide, and Phase 0 makes three of those, all load-bearing,
all false, all answerable from the same 242,078 bytes:

- P0-3 says recognising a completion claim needs the transcript reader. The field is
  on the event (**Q1**).
- FR-A4 and C-2 assume the oracle's session state is the record of what the agent has
  seen. Resume replays past injections without the oracle, and compaction discards
  what it read (**Q4**).
- FR-O6 treats subagent events as a case the oracle merely keys. They are a class of
  observed events that can never produce a whisper, and they land in the denominator
  of the measurement the phase exists to produce (**Q5**).

The prior pass's most dangerous assumption was that the devices installed to stop the
document lying about itself were not themselves claims. That assumption is now
*checked* — §3's arithmetic, §4's quotations, the namespace rule and the ROSE
attributions were the first things this pass verified, and they hold. What replaced
it is one layer out: **a positive claim about a source was verified, and every
negative claim about the same source was inherited.** An enumeration is a claim about
absence, and absence is established by reading the region, not by matching a string
— which is the collapse log's own lesson from 2026-07-30, written about grep, and
applicable unchanged to a 242 KB download.

**What would test it, and is writable today:** §4's method line currently attests to
how the source was fetched. Add what it was fetched *for* — a short list of the
questions asked of it, including the ones whose answer is "the contract does not
provide this." A negative contract claim with no recorded search behind it is the
next round's first finding, in whichever requirement happens to rest on it.

---

## Method note

Premises re-derived from primary source in this pass, not inherited from the prior
review, the round-2 review, or commit messages:

- **Claude Code hooks contract** — `code.claude.com/docs/en/hooks.md` fetched
  2026-08-01, HTTP 200, **242,078 bytes** (byte-identical to §4's attested figure),
  plus `hooks-guide.md` (62,452 bytes). Every quotation in §4 string-matched: the
  `Stop` and `StopFailure` descriptions, `Stop`/`SubagentStop` `additionalContext`
  for *"non-error feedback that continues the conversation"*, the `PreToolUse` exit-0
  sentence and *"staying silent doesn't approve it"* (**both on `hooks.md` line 154**,
  contrary to the prior pass's location note), `PostToolUse`'s *"String added to
  Claude's context alongside the tool result"*, the per-handler timeout defaults
  (600/30/60 with `UserPromptSubmit`'s lowering), the `SessionEnd` 1.5-second budget
  with its raise-to-60 s clause, and the prompt-injection-defence sentence. All
  verbatim. **Additionally read and not in the document**: `last_assistant_message`
  on `Stop`/`SubagentStop`/`StopFailure` (Q1); the resume-replay and `SessionStart`
  `source` semantics (Q4); subagent hook firing with `agent_id`/`agent_type` (Q5,
  Q16); the 10,000-character `additionalContext` cap; *"Timeouts set on
  plugin-provided hooks don't raise the budget"* (M6).
- **ROSE (TSE 31(6), 2005)** — PDF fetched from the author's copy (1,948,399 bytes),
  text extracted locally with `pypdf`, all eleven quoted strings matched verbatim and
  each read in its surrounding paragraph to check attribution. The §7.5 Prevention /
  §7.6 Closure split is correctly drawn in P0-5. Two sentences the document does not
  quote were read and bear on findings: *"high support count and confidence
  thresholds are required for a high precision"* and *"Fig. 6 also shows that
  increasing the support count threshold also increases the precision"* (Q11, Q12).
- **v1 identifier set** — enumerated by reading §7.1–§7.8, §9 and §10 of
  `spec-context-oracle.md` directly: 65 confirmed, and §3's three sets (38 + 10 + 17)
  confirmed to partition it exactly with no double-listing. Every "unchanged" row was
  then compared clause by clause against its v1 text (Q2).
- **v1 source keys** — §3's table read in full; the six keys absent from the Phase 0
  §4 (`[COVERITY-10]`, `[HERZIG-13]`, `[CHI-25]`, `[JOHNSON-13]`, `[OWASP-SM]`/
  `[LLM02]`, `[ASI-26]`) confirmed absent by full-text extraction of every source-key
  token in the Phase 0 spec (Q3).
- **Identifier minting** — every `FR-*`/`NF-*`/`C-*`/`P0-*`/`AC-*` token in the
  Phase 0 spec extracted programmatically; no `FR-*`, `NF-*` or `C-*` is minted.
  N3 confirmed closed by enumeration rather than by inspection.
- **`RETHINK.md` citations** — all twenty-four line ranges cited by the Phase 0 spec
  read against current source (399 lines). All resolve to text supporting their claim,
  including `:321–323` at FR-X5, which the prior pass found overreaching and which is
  now correctly scoped.
