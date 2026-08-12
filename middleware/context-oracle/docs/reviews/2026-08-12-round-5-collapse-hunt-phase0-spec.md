# Collapse-hunt — `docs/specs/spec-context-oracle-phase0.md`, round 5 (2026-08-12, thirteenth pass)

*Independent adversarial pass, fresh subagent, never the author. Mission-fidelity
axis only. **Written once, never edited.***

**Target:** `middleware/context-oracle/docs/specs/spec-context-oracle-phase0.md`
(1,020 lines), a from-scratch rebuild claiming to apply the round-4 findings. Every
round-4 finding was re-derived from the current text; nothing was assumed applied.

**Prior pass:** `docs/reviews/2026-08-01-round-4-collapse-hunt-phase0-spec.md`
(16 findings — 5 collapse, 11 partial — + 10 minors) and the parallel round-4 expert
review (S1, S2, M1–M4, m1–m3). All are closure items here.

**Verdict: 5 findings — 2 collapse, 3 partial — plus 4 minors.**

**Of the prior round's 16 findings + 10 minors + expert-review's 8: all genuinely
closed.** This is the first round in this document's history in which the closure
ledger is clean — the attestation devices the collapse log named for four rounds
were *deleted* rather than re-asserted, the eight mis-filed §3 rows were moved or
restored, the nine wrong source pointers were replaced with stable source keys, and
the four carried-unapplied findings (Q10/Q20/Q22/Q23) were finally applied. The
rebuild did the hard thing: it stopped correcting the devices and removed them.

**The new findings are one layer out from F1's, on the axis F1 opened.** Round 4's
lesson was that the document verified what the harness *hands* a hook and not what
the harness *does with what the hook returns*. The rebuild answered that for
`additionalContext` — §4 now carries the placement list and P0-D-26 accepts post-edit
delivery. But a `PreToolUse` hook returns a whole `hookSpecificOutput` object, and
**`updatedInput` — which "replaces a tool's arguments before it runs" — is an output
field that lets the oracle silently rewrite the agent's edit, and nothing in the spec
structurally excludes it** (**N1**). The output axis was verified for one field and
inherited for the rest, which is round 4's own generalisation, one field over.

**The heaviest new finding is N2, and it is the signature generator operating inside
a single rebuild.** Round 4's F12 added *"structural weight carries no genre term"* to
close the relocated-precedence collapse. The **same rebuild** added a §7 paragraph
asserting that the *"zone term inside `structural_weight`"* is *"what a … warning
candidate rides on when it competes with consequence — the channel `[OWNER-3]`
requires carry generated-file protection."* At a `PreToolUse` edit **in** a generated
zone, the consequence candidate is also an edit in that same zone, so the zone term is
common to both and cannot privilege the warning — unless the zone term is
genre-correlated, which is the term F12 forbade. An owner-locked protection rests on a
mechanism that cannot exist alongside the guarantee the rebuild made one section
earlier.

---

## What survives, stated first so the findings read as exceptions

Each re-derived from primary source this pass, not inherited from the prior review or
from commit messages:

- **The `additionalContext` placement facts are correct in current source, and the
  contract has drifted since §4 was written.** I fetched `code.claude.com/docs/en/hooks.md`
  fresh: it is now **267,242 bytes**, not the 242,078 §4 attests to at 2026-08-01 — the
  contract added `UserPromptExpansion`, `PermissionRequest`, `PermissionDenied`,
  `TeammateIdle` and other events. The facts Phase 0 depends on all still hold verbatim:
  *"inserts it into the conversation at the point where the hook fired. Claude reads the
  reminder on the next model request"* (line 931); the placement list, *"`PreToolUse`,
  `PostToolUse`, `PostToolUseFailure`, and `PostToolBatch`: next to the tool result"*
  (line 948); *"`Stop` and `SubagentStop`: at the end of the turn. The conversation
  continues so Claude can act on the feedback"* (line 949); `additionalContext`
  *"Ignored when `permissionDecision` is `"defer"`"* (line 1701); and `"defer"` as a
  distinct value under which *"The tool doesn't execute"* (line 1740). **The drift is
  exactly what C-5 exists for**, and C-5's version-binding is thereby vindicated rather
  than broken — but see minor m3.
- **F1 is genuinely closed, and closed as capability rather than as a hedge.** §4 now
  has a two-directional split (input vs output); the output half records the placement
  list and names post-edit delivery of the three `PreToolUse` genres; §1 restates the
  whisper property honestly (*"immediately after that edit and before the agent's next
  action, which §4 shows is the earliest a non-blocking tool can deliver on an edit"*);
  P0-D-26 accepts it with a reason; AC-7 and AC-8 assert delivery *"next to that edit's
  tool result."* The moment is now stated where it lands. (N4 attacks the *"earliest"*
  claim, not the closure.)
- **F3 is closed by deletion, which is the collapse log's prescribed fix.** §3's
  "each row is unchanged" attestation is gone; the eight mis-filed rows are either in
  the narrowed table (FR-D3, FR-X5, FR-A4, NF-2, FR-X3) or restored to full v1 text so
  they are genuinely unchanged (FR-X4's whisper clause, FR-K8's *"keyed by repository
  identity"*, FR-M4's *"saying exactly what broke,"* FR-O3's carry clause, FR-O4a's
  *"never prevents a turn from ending"*). The narrowed table is 27 rows and the
  unchanged list 21; 27+21+17 = 65.
- **F4 is closed the right way.** The six study rows now read *"Carried from v1's source
  table"* — the source **key**, not the moving line number the prior pass found wrong in
  five of six. `[CACM-18]` is restored (expert-review M2).
- **F5 is closed: P0-4's decomposition is now genuinely by-suppressor** — no candidate,
  FR-A4, FR-A6 floor, FR-A7 window, FR-A3 budget, below-bar, undeliverable, each counted
  separately; FR-M2's suppressing-condition list now includes the budget; AC-33's remedy
  set now includes the bar (FR-A5) and states the exit run is outside FR-A7's window.
- **Q10/Q20/Q22/Q23 — carried unapplied for four rounds — are all applied.** §2's
  exclusion row is split (F5b); the answer-drift reason is corrected to name the real
  blocker (F13b); P0-D-4 lists the stop-grade cap (F14); AC-33 and AC-21 state the
  exit-run window (F5/Q23).
- **The output-axis lesson was partly learned.** §4 is now organised by direction and
  the header says why: *"a whisper's moment is a property of the second [axis], and
  verifying the first exhaustively is not evidence about the second."* That sentence is
  right. N1 is where it stopped short.

---

## Part 1 — closure ledger for the round-4 pass (16 findings + 10 minors) and expert-review (S1,S2,M1–M4,m1–m3)

Re-derived from the current file. "Closed" = the defect is absent from the current
text, verified at the cited section, not that a commit says so.

| # | Round-4 finding | Status | Evidence in the current file |
|---|---|---|---|
| F1 | `PreToolUse` `additionalContext` delivered post-edit; three genres mis-timed | **Closed** | §4 output split records the placement list; §7 ¶ + P0-D-26 accept post-edit; §1 restated; AC-7/AC-8 test the position. Residual **N4** attacks P0-D-26's *"earliest"* wording only. |
| F2 | Completion-claim test is the sole stop gate; inverts `[OWNER-12]` "not a ranking" | **Closed structurally; residual in the justification and the test** | §3's FR-A2 row and §2 now record the every-stop→completion-claim-stop trigger narrowing; P0-3 carries the "not a ranking" disclaimer. **N3** attacks the false AC-12 claim and the weak stated reason. |
| F3 | §3 attests it diffed unchanged rows; 8 fail | **Closed** | Attestation deleted; 8 rows moved or restored (see What Survives). |
| F4 | 5/6 source pointers resolve to the wrong source | **Closed** | Rows cite the v1 source *key* now. |
| F5 | P0-4 not a real decomposition; AC-33 remedy unchoosable | **Closed** | By-suppressor decomposition in P0-4/AC-2; bar in AC-33; budget in FR-M2. |
| F5b | Q10: §2 one reason for seven items | **Closed** | Row split three ways (measurements / mining-writer / store-format). |
| F6 | Resume restores delivered-set not read set; budget ratchets | **Closed** | FR-O1/FR-A4 reconstruct the read set from FR-L1; NF-2/P0-D-20 exempt replay from the budget so it does not ratchet; AC-26 tests both. Residual **minor m2** on the *justification*. |
| F7 | `"fork"`/`"clear"` unhandled | **Closed** | FR-O1 states all five `source` values; AC-26 adds fork. |
| F8 | Orientation marginal value untested | **Closed** | §7/P0-D-17 name it; AC-9 tests the equal-lexical-score non-entry-point case. |
| F9 | Q9: historical-breakage blocker false by its own sentence | **Closed** | Row now concedes *"a floor does exist"* and defers on causation-vs-correlation. |
| F10 | FR-A7 suppresses the owner-provenance landmine arm | **Closed structurally** | Landmine arm admitted to FR-A7; AC-13 distinguishes it from the entry-point arm; AC-22 states its window. Residual **N5** on the *ground* for admission. |
| F11 | Warning-landmine arm dropped with a circular reason | **Closed** | Row now gives F1's post-edit reason + orientation's pre-action coverage. |
| F12 | `structural_weight` sole carrier; only recorded def has a genre factor | **Closed as written; contradicted by a sibling fix** | FR-A5/P0-D-18 say "no genre term" + point at the non-inherited architecture def. **N2** is the §7 competition paragraph the same rebuild added, which needs the genre term F12 removed. |
| F13 | `prompt`/`tool_input`/tool-result inputs omitted from §4/§12 | **Closed** | §4 and §12 now name all three. |
| F13b | Q20: answer-drift reason misnames the producer | **Closed** | Reason corrected to "deciding whether a later turn addressed one requires model judgment." |
| F14 | Q22: stop-grade cap has no decision entry | **Closed** | P0-D-4 lists it; P0-D-23 gives the reason for a bound. |
| m1 | §2/P0-4 disagree on undeliverable reporting | **Closed** | §2 now: "its own labelled component of the silence decomposition." |
| m2 | FR-K8 "keyed by repository identity" | **Closed** | Restored. |
| m3 | FR-X4 whisper clause | **Closed** | Restored (*"whispers built on untrusted-origin records obey FR-X2/FR-X3"*). |
| m4 | FR-X3 model-call clause | **Closed** | In the narrowed table. |
| m5 | AC-6 drops "deinit restores" | **Closed** | AC-6 + C-4 both assert restore-to-pre-init. |
| m6 | FR-K5 in no criterion list | **Closed** | AC-30 parenthetical names FR-K5. |
| m7 | three stale AC cross-refs | **Closed** | §2 →(AC-30,AC-22); §3 →AC-21; §9 →(AC-7,AC-31). |
| m8 | `PreToolUse` competition rule stated for stop-class only | **Closed in form; the mechanism is hollow** | §7 ¶ now covers `PreToolUse` competition — but see **N2**: the resolution it gives cannot work. |
| m9 | C-3 citation scope | **Closed** | Cites `RETHINK.md §11` as a whole and marks the harness-neutral contract as this document's inference. |
| m10 | v1 §14 subagent open-question sync | **Closed (softened)** | §4 now says the evidence resolves it *"for Phase 0's purposes"* rather than claiming to settle v1. |
| carried | Q21 fallback obligation | **Closed** | C-1: *"the architecture must retain a fallback path for the day that fact changes, which AC-32 detects."* |
| carried | FR-K7/FR-D2 rationale | **Closed** | Both rationale sentences restored. |
| **Expert-review** | S1 (unchanged false), S2 (renumber cross-refs), M1 (§2 criterion), M2 (`[CACM-18]`), M3 (C-5 timeout claim), M4 (`additionalContext` independence), m1 (FR-K1 "in full"), m2 (C-3), m3 (P8 clause) | **All closed** | S1→attestation deleted; S2→refs corrected; M1→criterion restated as a disjunction; M2→row restored; M3→false C-5 sentence removed; M4→§4 states the `"defer"` dependency and FR-O4 excludes `"defer"`; m1→"in full" dropped, build restored; m2/m3→citations corrected. |

**No prior finding is unclosed.** This ledger lists closures *and* their residuals so
the next round inherits both; the residuals are the Part 2 findings below, and none is
a re-run of a prior finding — each is a new question the prior fix opened.

---

## Part 2 — new findings

### N1 — `PreToolUse` returns `updatedInput`, which "replaces a tool's arguments before it runs." FR-O4's structurally-absent set is `{deny, block, defer}` and does not exclude it. The oracle can silently rewrite the agent's edit, defeating "never mutates" and "informative, never imperative." COLLAPSES.

**Decision attacked:** FR-O4's structural-absence guarantee; §4's output-axis list;
FR-X5 (*"never mutates the repo"*); FR-D2 (*"informative, never imperative"*); T4; AC-5.

**Mission sentence available:** `[OWNER-3]` (`RETHINK.md:321–323`) — *"it never mutates
the repo and never prevents an action; its worst case is a wasted sentence."* And the
mission itself: the oracle *informs*; the agent *"stays the decision-maker."*

**The collapse question:** *§4 now verifies the output axis. A `PreToolUse` hook's
`hookSpecificOutput` carries more than `additionalContext`. Open the reference and name
the output field that acts before the tool runs — the field the oracle "cannot" reach
for a whisper but could reach to change the edit.*

Verified against current source this pass:

> `PreToolUse`: `updatedInput` directly under `hookSpecificOutput` replaces a tool's
> arguments before it runs.
> — `hooks.md` line 985

> `updatedInput` | Modifies the tool's input parameters before execution. Replaces the
> entire input object… Combine with `"allow"` to auto-approve, or `"ask"` to show the
> modified input to the user.
> — `hooks.md` line 1700

And `PostToolUse` carries `updatedToolOutput`, which *"replaces the tool's result"*
(line 987) — the model then sees oracle-authored text as if it were the tool's own
output.

Four consequences:

1. **The "never mutates" guarantee has no structural backing.** FR-X5 and `[OWNER-3]`
   promise the oracle never mutates the repository. `updatedInput` on an `Edit`/`Write`
   tool rewrites what gets written — a repo mutation *laundered through the agent*,
   which is worse than a direct write because T4's detector (*"a component writes inside
   the repository tree"*) never sees it. FR-O4 makes `{deny, block, defer}`
   structurally absent and AC-5 tests exactly those. Neither names `updatedInput` or
   `updatedToolOutput`. A builder can add `updatedInput` — to "helpfully" fix a
   generated-file edit, say — without violating FR-O4 or failing AC-5 as written.
2. **It is precisely the imperative posture the whole rethink removed.** `updatedInput`
   is not advice; it is the oracle *doing the edit for the agent*. FR-D2 forbids
   imperative *whispers*; the graver form — an imperative *action* — is not forbidden
   anywhere because the spec never contemplated the output field that enables it.
3. **This is round 4's own generalisation, one field over.** F1 verified where
   `additionalContext` lands; the rebuild treated "the output axis" as
   equal to "`additionalContext` placement + the decision values." The output object has
   three consequential fields and the spec guards one. §4's own header says the output
   axis must be verified because the first axis is not evidence about it — and then
   verifies one member of the second axis.
4. **The pre-edit channel the spec says does not exist, does — for mutation.** P0-D-26
   argues *"the only mechanism that shows anything before a tool runs is the permission
   prompt."* `updatedInput` acts *before the tool runs* (line 985). It does not *show*
   the model context, but it is a live pre-execution output channel, which the spec's
   flat "nothing acts pre-execution except the gate" framing misses. (This is why N4 is
   also a finding.)

**Class: unverified / posture** (an output-axis field with a mutating effect, verified
for delivery and not for the fields that defeat the mission's absolute guarantees).
**Fix:** add `updatedInput` and `updatedToolOutput` (and any other `hookSpecificOutput`
mutation field) to FR-O4's structurally-absent set, and state in §4's output list that
Phase 0's shims emit **only** `additionalContext` — no `decision`, `permissionDecision`,
`updatedInput`, or `updatedToolOutput`. Widen AC-5 to assert no shim path returns any
of them, and add an adversarial fixture (a shim that tries to `updatedInput` a
generated-file edit into its source) asserting the edit is unchanged. This costs zero
capability — the oracle never wanted to mutate — and closes the one hole in the
guarantee `[OWNER-3]` calls *"the failure that ends trust outright."*

### N2 — At a `PreToolUse` edit **in** a generated zone, the warning candidate and the consequence candidate share the same zone, so the zone term cannot privilege the warning. §7 and P0-D-18 claim it does, and stake `[OWNER-3]`'s generated-file protection on it — while P0-D-18 forbids the genre-correlated term the claim requires. COLLAPSES.

**Decisions attacked:** §7's competition paragraph; P0-D-18; FR-A5; `[OWNER-3]`.

**Mission sentence available:** `[OWNER-3]` (`RETHINK.md:314–323`) — *"Every
intervention, including generated-file protection, is a loud warning whisper."* The
protection is an owner-locked capability; it is only delivered if the warning candidate
actually reaches the agent.

**The collapse question:** *§7 says the zone term "is what a … warning candidate rides
on when it competes with consequence." Both candidates are at the same edit to the same
generated file. Write down each candidate's zone value, and say which is larger.*

They are equal. `structural_weight` is defined (FR-A5, P0-D-18) as *"per-candidate
properties only — edit-vs-read, blast radius, and zone — carrying no genre term."* Two
candidates arising at one `PreToolUse` edit to a generated file:

- **Warning (generated):** edit-vs-read = edit; zone = generated; blast radius = the
  warning's own.
- **Consequence:** edit-vs-read = edit; zone = **generated (same file)**; blast radius
  = call-site count *N*.

They share edit-vs-read and zone. The only differentiator left is blast radius. If
consequence's *N* is high — a generated client with many in-tree callers — consequence
outscores the warning and **the generated-file protection `[OWNER-3]` locked is
silently displaced at the very edit it is meant to fire on.** The zone term, being
common to both, cannot be *"what the warning rides on"*: it rides equally under both.

The dilemma is self-contained in P0-D-18:

- If `zone` is a property of the **edit target**, both candidates carry it, it does not
  discriminate, and §7's claim is false.
- If `zone` privileges the **warning genre** (only a zone-warning "is about" the zone),
  it discriminates — but it is then a genre term, and P0-D-18's *"the zone, not the
  genre, carries the weight … no genre term survives"* is false.

Either reading falsifies one of the two sentences the same rebuild wrote. This is F12 /
Q7 resurfacing at the term one place along, exactly as the collapse log predicted:
genre precedence was banished from `materiality` (equal base weights), disclaimed in
`structural_weight` (*"no genre term"*), and then **needed back** — because the design
has an owner-locked channel that must win a competition, and nothing genre-neutral can
make it win. m8 was "closed" by adding this paragraph; the paragraph is the finding.

Neither of the bar's other factors rescues it. `materiality` is equal across mechanical
genres (P0-D-18). Marginal value (`self_serve_cost`) is high for both a
can't-see-it's-generated warning and a can't-count-call-sites consequence. So the
warning's delivery is not guaranteed by any term.

**Class: mechanism-not-mission** (an owner-locked protection justified by a scoring
mechanism that cannot produce it without a term the same decision forbids).
**Fix (two honest directions, and one is an owner question):**
(a) *Deflationary:* delete the claim that the warning "rides on the zone term" to win,
and state that at a shared `PreToolUse` zoned edit the warning is **displaceable** by
consequence's blast radius; `[OWNER-3]`'s protection is best-effort, and P0-4's
per-genre delivered count is the monitor for a systematic shut-out (which is all §7 can
honestly promise today). (b) *If `[OWNER-3]` requires the protection be **guaranteed**
at that edit*, that requires privileging the zone-warning genre at `PreToolUse` — a
genre ranking, which the standing directive forbids **unless the owner states it**.
`[OWNER-3]` says generated-file protection *is* a whisper; it does not rank that whisper
above consequence. So this is a genuine owner question of the `[OWNER-12]` class: *at a
single edit where both a generated-file warning and a call-site consequence apply, must
the warning always be the one delivered?* Surface it with this evidence; do not resolve
it by asserting a zone term that cannot carry the ranking.

### N3 — P0-3 states that "AC-12 fixtures both the positive and the false-negative case." AC-12 fixtures the positive and two *true*-negatives. The false negative — a genuine completion the lexical test misses — silences verification and completeness at the one moment `[OWNER-12]` calls a must-have, and no criterion tests it. PARTIAL.

**Decisions attacked:** P0-3 (third/fourth bullets); AC-12; P0-D-23; the stop-gate's
stated reason.

**Mission sentence available:** `[OWNER-12]` (`RETHINK.md:374–379`) — speaking at a
completion claim is a must-have; and P0-D-17's own standard: *"a genre whose computation
is left to the architect is an unfilled requirement wearing a reference."*

**The collapse question:** *P0-3 gates verification and completeness on a lexical
completion-claim test whose pattern set it leaves to the architect. Name the criterion
that fails if the test misses a real completion.*

There is none. P0-3's last paragraph: *"A non-matching count cannot by itself separate a
correct non-match from a missed claim; AC-12 fixtures both the positive and the
false-negative case so the test's behaviour is measurable."* Read AC-12: (i) a stop
whose message states completion draws a whisper — **positive**; (ii) *"a stop whose
message does not — mid-task narration, a question to the user — draws none"* — these are
**true negatives** (correctly non-matching); (iii) the over-bound case. There is no
fixture in which the agent **has** completed but phrased it such that the test fails to
fire — the *false* negative. P0-3's claim that AC-12 fixtures it is untrue; it fixtures
a true negative and calls it the false-negative case.

Why it is load-bearing rather than pedantic:

1. **The false negative silences the `[OWNER-12]` moment itself.** The whole point of
   the completion-claim gate is that a completion claim *must* draw a whisper. A missed
   claim is the gate failing on exactly the input it exists to catch — and it fails
   silent. P0-D-23 bounds only the *false positives* (*"A lexical test still
   over-fires"*); the direction that defeats the must-have has no floor and no test.
2. **The stated reason for the gate is the weak one.** P0-3 justifies the gate as: at a
   non-completion stop, *"spending a continuation … is the every-turn-boundary cost
   round 2 removed."* But the every-turn-boundary cost was *unbounded* firing; the gate
   is not needed to bound it, because FR-O4a caps continuations at one per stop and P0-3
   caps stop-grade whispers at 3 per session. The **real** mission-need the gate serves
   is different and stronger: those 3 scarce stop-continuations must be **reserved** for
   completion claims, or a run of mid-task stops early in a session exhausts the cap and
   starves the `[OWNER-12]` must-have when it finally arrives. The spec gives the
   mechanism-cost reason (a continuation is expensive) and misses the mission reason
   (protect the must-have from budget starvation) — which matters because a future agent
   reading the weak reason, seeing the caps already bound volume, could remove the gate
   and silently reintroduce the starvation.

**Class: unverified** (a false claim about what a criterion tests) **+
mechanism-not-mission** (the gate's stated rationale is not its mission-need).
**Fix:** correct P0-3 to say AC-12 fixtures the positive and the *true*-negative; add a
genuine false-negative fixture to AC-12 (a completed-but-unrecognised stop) and require
the architect's pattern set to be reported against it, at P0-D-17's standard, so the
discriminator's miss rate is measurable rather than assumed. And replace the
"every-turn-boundary cost" sentence with the reservation reason: the gate exists so the
3-per-session stop budget is spent on completion claims, not exhausted before one
arrives.

### N4 — P0-D-26 and §1 call post-edit delivery "the earliest a non-blocking tool can deliver on an edit" and "the ceiling." It is the ceiling only for a whisper keyed to the *edit event*; consequence's fact can reach the agent genuinely pre-edit on the read that precedes the edit — the same event coupling already fires on. PARTIAL.

**Decisions attacked:** P0-D-26; §1's delivery clause; §7's consequence row.

**Mission sentence available:** the mission verbatim — *"at the moment of that
decision"* — and `RETHINK.md:166`: the pending edit is *"the golden moment, the last
cheap point to alter course."*

**The collapse question:** *Consequence delivers post-edit because it fires on
`PreToolUse`. The agent almost always **reads** the file before editing it, and coupling
already fires on that read (`PostToolUse`), pre-edit. Why can't the call-site fact ride
the same pre-edit event?*

It can. The spec's "ceiling" claim conflates two things:

- *"The earliest a non-blocking tool can deliver **on an edit**"* — true; on the
  `PreToolUse` edit event, the return lands next to the tool result, post-write.
- *"The earliest a non-blocking tool can deliver the fact"* — false; the call-site count
  of the symbol about to be edited is available the moment the agent *reads or searches*
  that symbol, and coupling already delivers a different Tier-1 fact on precisely that
  `PostToolUse` read (§7). A read-keyed consequence arm reaches the agent **before** the
  edit, non-blocking, no gate.

P0-D-26's framing — *"the only mechanism that shows anything before a tool runs is the
permission prompt"* — is scoped to the *edit* tool and treats consequence's trigger as
immovably the edit. The mission does not fix the trigger; it fixes the *moment* (the
decision to edit, and how broadly). Delivering the call-site fact at the pre-edit read
serves that moment better than post-edit, at the cost of firing when no edit follows —
which is a marginal-value question the bar (FR-A1) and dedup (FR-A4) already answer, not
a reason it cannot be done.

This is not a demand to build the read-keyed arm in Phase 0. It is that P0-D-26 closes a
question it did not fully ask: it establishes the ceiling for the *edit-event-keyed*
whisper and dresses it as the ceiling for the *fact*. The honest ceiling statement is
narrower, and if a pre-edit consequence delivery is out of Phase 0 scope it should be
deferred with a reason, not foreclosed by an overclaim.

**Class: mechanism-not-mission** (a claim about a mechanism's reach dressed as a claim
about the mission moment).
**Fix (deflationary — the direction nothing watches, so I flag it):** restate P0-D-26
and §1 as *"the earliest a whisper keyed to the edit event can deliver,"* and add a
sentence to §2 or §7 noting that consequence's fact could be delivered pre-edit on the
read/search that precedes the edit, deferring that arm with its reason (noise from
firing before an edit is confirmed) rather than asserting it impossible. The *inclusive*
form — actually adding a read-keyed consequence arm — adds capability and is the watched
direction; I do not propose it, I name it so the deferral is a decision rather than an
elision.

### N5 — FR-A7 admits orientation's landmine arm in the first 3 sessions on the ground that the *record* is the highest-trust class. `[COVERITY-10]`'s first-impression risk is about the *relevance of what fires*, not the trust of the record, and the landmine arm fires on a loose task-shape match. A high-trust fact delivered irrelevantly in session 1 is the bad first impression the ground warns of. PARTIAL.

**Decisions attacked:** FR-A7; P0-D-8; AC-13.

**Mission sentence available:** the 2026-07-17 collapse-log lesson (item 1) — *"a
true-but-irrelevant fact is worse than silence"* — and `[COVERITY-10]`'s own ground:
*"a tool's first reports set its credibility."*

**The collapse question:** *P0-D-8 admits the landmine arm because an owner-stated fact
is the highest-trust record. `[COVERITY-10]` is about what the tool **shows** being
credible. Is the trust of the stored record the same thing as the relevance of the
whisper that fires from it?*

No — and the round-4 F10 fix, which *added* this arm to the window, conflated them.
First-impression quality = record trust × firing relevance. The landmine arm fires when
a promoted record's terms literal-match *"the task shape"* (P0-1: *"a read over indexed
content and over promoted records"*) — the same loose lexical class as orientation's
entry-point arm, which FR-A7 **excludes**. So FR-A7 admits one lexically-matched arm and
excludes another, on the strength of the *record's* provenance, while the risk
`[COVERITY-10]` names lives in the *firing* — and both arms share the firing mechanism's
precision. An owner landmine fired on a tangentially-matching session-1 prompt is a
low-relevance first report even though its content is true; that is exactly the credibility
hit the ground warns of, and it is admitted with nothing watching (this is the mandatory
self-serving direction — round 4 grew Phase 0 here).

The admission may still be right — withholding the owner's own words for three sessions
is a real cost P0-D-8 correctly flags. But the *ground given* (record trust) does not
carry it; the ground that would is *firing relevance*: the landmine arm fires only on a
task-shape match, and that match's precision is what bounds the first-impression risk.

**Class: wrong-check** (admission gated on record trust where the mission metric is
relevance-at-firing).
**Fix (cheap):** in P0-D-8, condition the landmine arm's first-window admission on the
firing being relevant — the task-shape match clearing the same bar it must clear outside
the window — and state that the record's trust answers a *different* objection (is the
fact credible) than `[COVERITY-10]`'s (is the first *report* credible). Then AC-13's
landmine fixture should fire on a matching prompt and **stay silent on a
non-matching one within the window**, which is the property that makes the admission
safe rather than assumed.

---

## Minors

- **m1 — §2's warning-landmine row cites P0-D-26's post-edit reason implicitly but not
  by pointer.** The row says a warning-landmine arm *"delivers after that edit
  (`[P0-D-26]`)"* — correct and now non-circular (F11 closed). No fix needed; noted so
  the F11 closure is on record as genuine.
- **m2 — P0-D-20 exempts the replayed tokens from FR-A3's budget on a token-accounting
  argument, not on the attention purpose the budget serves.** The budget exists (RETHINK
  §2.4/§6) to bound the oracle's *attention* cost so it does not become wallpaper.
  P0-D-20 justifies not-charging replay as *"already counted when first sent"* — an
  accounting statement — and by the anti-ratchet argument. The attention concern (a long
  resume chain accumulates oracle text in the window) is handled, but by a *different*
  mechanism the decision does not cite: FR-A4 reseeds the delivered-set on resume, so no
  whisper is re-injected and the per-session net-new is capped at 2,000. State that: the
  replay is exempt because dedup guarantees it adds no *new* oracle attention, not merely
  because it was "already counted." As written, the justification serves the mission axis
  (attention) only by accident.
- **m3 — §4's byte-count attestation is now stale (242,078 → 267,242).** The contract
  drifted between 2026-08-01 and today; C-5 anticipates exactly this and the facts Phase
  0 depends on still hold, so this is not a finding against the design. But §4 presents a
  dated download as the confirmation of record, and a reader in a later session will
  re-download a different file. Note in §4 that the byte count is the 2026-08-01 snapshot
  and that C-5's re-verification, not this figure, is the standing guarantee — otherwise
  the next pass "discovers" a drift the document already accounts for.
- **m4 — P0-4 folds the marginal-value signal into the dedup bucket.** The
  by-suppressor decomposition lists *"candidates suppressed as
  already-seen/told/incorporated (FR-A4)"* as one component. But *already-seen* (the
  agent self-served — the RETHINK §2.3 metric, "marginal value over the agent's own
  abilities is the only relevance metric that matters") and *already-told* (the oracle
  repeating itself — dedup working) are structurally different signals: a high
  already-seen share is the one number that measures whether the oracle is competing with
  grep/glob, which §1 says the exit run exists to learn. Fold them and that signal is
  invisible. Split *already-seen* from *already-told/incorporated* in P0-4, on the same
  grounds F5 used to split FR-A4 out of "below the bar."

---

## Self-serving check (mandatory — the inclusive direction has nothing watching it)

Collapse log 2026-08-01 lesson 10: every safeguard here points at exclusion, so an
inclusive error has nothing watching it. This pass against itself:

- **N1 is an exclusion finding and costs zero capability.** It adds a guardrail (put
  `updatedInput`/`updatedToolOutput` in the structurally-absent set) that *removes* a
  capability the oracle must never have. Apply without argument; it is the cheapest and
  the most load-bearing, because it closes the "never mutates" hole.
- **N2's honest direction is deflationary.** The finding says §7 *overclaims* a
  guarantee. The cheap fix removes the false claim and states the warning is
  displaceable — no capability added. The *substantive* fix (guarantee the warning wins)
  would add a genre ranking — inclusive, and forbidden without the owner — so I route it
  to the owner as a question rather than proposing it. The direction nothing watches
  here is "assert the protection is delivered," which is the direction the current text
  already took; N2 pulls back from it.
- **N3 costs nothing.** Correcting a false claim about a test and adding a false-negative
  fixture adds no genre and no capability. The justification swap (reservation, not
  every-turn-cost) is one sentence.
- **N4 argues for *less*, not more.** Its fix is to narrow an overclaim. The inclusive
  form (a read-keyed consequence arm) is named and explicitly *not* proposed, so the
  watched direction is flagged rather than taken.
- **N5 pushes the round-4 growth back toward a bar.** Round 4 *added* the landmine arm to
  the first-sessions window (an inclusive move); N5 does not remove it but conditions its
  firing on relevance — the deflationary direction. The inclusive risk (the arm mis-fires
  in the trust-setting window) is the one nothing was watching, which is why N5 exists.
- **Nothing in this pass proposes a new genre, a new requirement, or a new document.**
  The two collapses both *narrow* or *guard*; the three partials all correct a claim or
  a ground.

The one finding whose *substantive* form would grow Phase 0 (N4's read-keyed arm) is the
one I priced as deferred-with-reason rather than built, per the standing rule that a
scope addition is a bar/deferral question, never a silent inclusion.

## The single most dangerous unexamined assumption

**That "verify the output axis" means "verify where `additionalContext` lands."**

Round 2 verified that quotations exist. Round 3 verified that input fields exist. Round
4 named the next layer — verify what the harness *does with what you return* — and the
rebuild learned it *for one field*. §4 now has an output subsection, and it contains the
`additionalContext` placement list and the `permissionDecision` values, and stops. But a
`PreToolUse` hook returns a `hookSpecificOutput` object with three consequential members
— `additionalContext` (delivery), `updatedInput` (pre-execution mutation of the agent's
action), `permissionDecision` (the gate) — and the spec structurally guards the third,
verified the first, and never examined the second. The same shape produced N1 (an
unguarded mutation channel) and it is *why* N2 slipped: the rebuild reasoned about the
*delivery* of the warning whisper and never about the full set of return values a
`PreToolUse` hook can emit, so it did not notice that no genre-neutral return value can
make the warning win a competition.

**The generalisation, same as every prior round:** an axis is verified only for the
member the question was asked about. Round 4 asked "where does `additionalContext` go?"
and the document answered it well and inherited the rest of the object.

**What would test it, writable today:** §4's output list is one field long where it
needs to enumerate *every* field a Phase-0-used event's hook can return, with a column
stating whether Phase 0 emits it. Require that list to name each `hookSpecificOutput`
member for `PreToolUse`, `PostToolUse` and `Stop`/`SubagentStop`, and to mark all but
`additionalContext` as structurally absent (FR-O4). A whisper's moment — and the
oracle's promise never to mutate — are both properties of that list, and today it has
one row.

---

## Method note

Premises re-derived from primary source this pass, not inherited:

- **Claude Code hooks contract** — `code.claude.com/docs/en/hooks.md` fetched
  2026-08-12, HTTP 200, **267,242 bytes** (drifted from §4's attested 242,078; the
  contract added `UserPromptExpansion`, `PermissionRequest`, `PermissionDenied`,
  `TeammateIdle` among others). String-matched the facts Phase 0 depends on: the
  `additionalContext` insertion sentence (line 931) and per-event placement list (lines
  944–949, `PreToolUse … next to the tool result`); `additionalContext` *"Ignored when
  `permissionDecision` is `"defer"`"* (1701); `"defer"` = *"The tool doesn't execute"*
  (1740); `Stop`/`SubagentStop` accept `additionalContext` for feedback that *"continues
  the conversation"* (949, 971). **Additionally read and load-bearing for N1/N4:**
  `PreToolUse: updatedInput … replaces a tool's arguments before it runs` (985);
  `updatedInput | Modifies the tool's input parameters before execution` (1700);
  `PostToolUse: updatedToolOutput replaces the tool's result` (987). All verbatim.
- **The current Phase 0 spec** (1,020 lines) read in full across two pages; every
  round-4 finding and minor located at its section and judged closed or residual against
  the current text, not against the prior ledger.
- **`RETHINK.md`** — §2.3 (marginal value), §2.4/§6 (attention budget), §5 (genres and
  their moments), §12 decisions 3 (`[OWNER-3]`), 5/8 (subagent scope), and the
  `[OWNER-12]` addendum (363–399, last sentence read) all read against current source
  and used as the mission standard for each finding.
- **`docs/collapse-log.md`** read in full; the recurring generators (attestation
  devices, relocated genre precedence, the true-but-irrelevant fact, the output-axis
  lesson, the inclusive-error blind spot) are the seed for N1, N2, N4 and N5 rather than
  the prior findings, per the standing instruction to start from the anchor documents'
  own criteria.
