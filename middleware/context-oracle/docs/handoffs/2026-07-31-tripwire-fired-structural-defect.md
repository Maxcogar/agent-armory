# Handoff — the fix cycle is over; the defect is structural and upstream

**To:** the next session. **Read this before touching anything.**

**Do not start a fifth fix round on `docs/architecture-context-oracle.md`.** The
non-convergence tripwire fired at round 4, and `expert-review`'s protocol forbids
recommending another fix round over a fired tripwire. The reason is not
bureaucratic — see §2.

---

## 1. Where this actually stands

Four adversarial review rounds ran on 2026-07-30/31 (two independent passes each,
all eight outputs preserved in `docs/reviews/`). Findings by round:

| round | expert-review | collapse-hunt |
|---|---|---|
| 2 | 10 | 9 |
| 3 | 14 | 15 |
| 4 | **16** | **16** |

**Tripwire arithmetic, condition (b)** — total findings not strictly decreasing for
two consecutive post-fix rounds:

```
R3: 14 < 10 → false → holds
R4: 16 < 14 → false → holds
two consecutive → FIRED
```

Every fix batch produced new defects at roughly the rate it closed old ones. Round 3
found 3 regressions from round 2's fixes. Round 4 found 6 regressions from round 3's
fixes — **all six inside `D10a`, the artifact written in round 3 specifically to
prevent defects at the joints between decisions.** The countermeasure reproduced the
disease.

## 2. Why it kept failing — the structural diagnosis

**This was caught by Max Cogar, not by the review mechanism**, by asking one
question: *"3 phases in one spec — WHY?"* It is logged as a process failure in
`docs/collapse-log.md` (2026-07-31) because `CLAUDE.md` makes the owner never the
collapse-tester.

Spec §12 stages the build into three phases whose exits are **measurements, not
tests**:

- Phase 0 — *"the owner runs it on a real project without incident"*
- Phase 1 — *"measured silence and hit rates reviewed against the bar"*
- Phase 2 — *"a demonstrated case of the oracle measurably improving between sessions"*

Each phase's design is gated on data only the previous phase can produce by running.
But the spec specifies all three phases' requirements now, and `CLAUDE.md`'s
lifecycle (until amended this session) required **one** architecture resolving Phase
1 design questions — it named judgment-prompt construction and the recursion-guard
mechanism — before *any* implementation. So the governance mandated designing Phase 1
twice: once now against nothing, once later against measurements. Only the second can
be real.

**The evidence had been sitting in the review record the whole time.** Across all four
rounds the findings split almost perfectly along the phase boundary:

- **Phase 0 material survived every round** — store schemas, event contract, shim,
  session service, indexer, miner, security scanner, diagnostics, CLI, audit
  ordering, repo identity. Several re-derived *exactly* under adversarial
  re-execution.
- **Phase 1/2 material collapsed in every round, in the same places** — the judgment
  core, the conduct genres, the materiality half of the bar, the uptake ladder, the
  learning loop.

Neither review pass could catch this: both check the architecture against the spec,
and the defect lives in the relationship between the spec's staging and the lifecycle
consuming it — above the artifact under review, in scope for neither pass.

## 3. What was changed in response (already applied)

- **`CLAUDE.md`'s lifecycle is amended**: architecture is now **per phase**. The
  whole-scope document is retained as the record of what was tried and as input to
  Phase 1's architecture — **not as a base to edit**. Every round that edited it
  introduced defects in the sections it did not edit.
- **Spec §12 gained a reading note**: Phase 1 and 2 requirements are provisional —
  they fix scope, intent and constraints, and are not a design-ready basis until the
  measurements their exits name exist.

## 4. What to do, and why — the direction

**The strategic fact that should drive everything: nothing has ever been run.** No
code, zero measurements. And spec §12 makes Phase 1's and Phase 2's design *gated on
measurements only a running Phase 0 produces*. Four review rounds were spent
perfecting a design for Phase 1 against numbers that do not exist, which is why that
half collapsed every round and no amount of care would have saved it.

So the bottleneck is not design quality. **It is that nothing runs.** The goal for the
next several sessions is the shortest defensible path to a Phase 0 that runs on the
owner's machine and emits numbers — not a better document. Resist the pull to perfect
Phase 0's architecture too; it needs to be *sound and reviewable*, not exhaustive.

### Step 1 — derive the Phase 0 requirement set (mechanical, not a judgment call)

The spec's 57 requirements carry no phase tags (verified: every "Phase 0/1/2" mention
is in §12, §14, or the note added this session). But the boundary **is** already
specified, twice over, and the set is derivable rather than invented:

- §12 names Phase 0's components: shims, session service, Tier 2 index, co-change
  miner with FR-K2 hygiene, the diagnostic core (FR-M1, FR-M2), and the FR-J3
  degraded genre set.
- The nine Phase 0 exit ACs each name their requirements in their own headers:

  | AC | names |
  |---|---|
  | AC-1 coupling | FR-K2, FR-A5, FR-D1, FR-D5, NF-1 |
  | AC-2 silence | P1, **FR-A1** |
  | AC-3 no deny | FR-O4, FR-O4a, FR-O3 |
  | AC-4 pristine tree | P8, C-4, FR-K8 |
  | AC-5 warning not block | FR-D3, P2 |
  | AC-12 secrets | FR-X1 |
  | AC-14 least privilege | FR-X5, FR-X7 |
  | AC-17 staleness | FR-K7 |
  | AC-18 self-detection | FR-M1, FR-M2, FR-M4 |

Take the transitive closure of those requirements plus what the §12 components need,
tag each with its phase **in the spec**, and the boundary becomes a spec decision made
in the spec — where it belongs — and checkable by a reviewer rather than invented by
an architect.

### Step 2 — resolve the boundary cracks the derivation exposes

There is at least one, found while writing this handoff by reading the AC headers:

**AC-2 is a Phase 0 exit and it names FR-A1** — the model's materiality judgment,
which is Phase 1 and does not exist in Phase 0. So "whispers on at most 10% of events"
would be measured in Phase 0 against a bar that has no materiality term. Either (a)
AC-2 has a deterministic Phase 0 form — silence measured against
`structural_weight × self_serve_cost` alone, stated as such — or (b) AC-2 is not a
Phase 0 exit. **Decide it in the spec, in writing.** Expect more of these; each is the
same shape and each is cheap to settle once the derivation surfaces it.

### Step 3 — extract the Phase 0 architecture; do not rewrite it from scratch

This is the part where "foundational rework" gets over-read. The Phase 0 decisions
**survived four adversarial review rounds**, and several re-derived *exactly* under
live re-execution in round 4. Rewriting them from the spec would discard verified
work and re-introduce risk for no gain.

Carry over, re-verifying each against the derived requirement set rather than copying
the text: **D2** (process model), **D3/D4** (runtime, store engine — `node:sqlite`
capabilities verified), **D5** (repo identity — re-executed exact), **D6/D7**
(schemas), **D8** (event contract), **D9** (shim), **D13**'s mechanical/template path
only, **D16** (indexer), **D17** (miner), **D19** (security scanner), **D21**
(diagnostics), **D22** (CLI), **D23** (config), **D24** (concurrency and audit
ordering — read complete in both directions), **D26**'s Phase 0 fixtures.

Take **D10 only in its deterministic subset**: Lane 1, the candidate pool, and the bar
*without* the materiality term. That is the Phase 0 bar, and it is much simpler than
the one that kept collapsing.

**Exclude entirely** — they are Phase 1/2 and are the material that failed every
round: D10's Lane 2, D11 (model invocation), D12 (judgment core), D14 (narration and
conduct genres), D15 (subagent delivery), D18's mining, D20 (degraded state machine —
Phase 0 *is* degraded mode, so there is no transition to design), and D10a (the genre
table, which produced six regressions in one round and should be rebuilt against the
five Phase 0 genres only, if at all).

Known repairs the Phase 0 extract must carry, all found in round 4 and all still open:
`cochange_file_pairs`, `ref_edges` and `open_questions` have **no provenance block**,
so AC-1's git-history pointer and AC-6 cannot be satisfied as written — the co-change
pointer needs a shape that matches an aggregate claim (a bounded re-runnable history
query, not a single commit hash). See `docs/reviews/2026-07-30-round-4-*.md` for the
full list scoped to Phase 0.

### Step 4 — review, plan, build, and run it

Review the Phase 0 architecture with the same two independent passes, against the
derived requirement set — which is the first time a reviewer will be able to check
*completeness* rather than only correctness. Then plan, then build, then **run it on a
real repository and collect the numbers**. Phase 1 does not get designed until those
numbers exist; that is the whole lesson of this session.

## 5. Facts established by execution this session (do not re-run unless you doubt them)

All run against `claude` CLI **v2.1.220**, Node **v22.22.2**, no `ANTHROPIC_API_KEY`,
host-managed auth.

- **`--tools ""` empties the judgment child's tool set** (returns `NONE`).
  `--disallowedTools` does **not** — it left 8 tools in one run and 32 in another,
  from identical invocations. A deny-list permits everything it does not name.
- **`--bare` breaks the piggyback**: authentication error, reproduced; the identical
  command without it succeeds.
- **`--max-turns 1` + `--tools ""` succeeds 10/10** with a thin system prompt.
  Earlier claims that this configuration fails were wrong — every failing run used
  the deny-list, which the design demoted. `num_turns` is 2 regardless; the verdict
  arrives as a tool call. `--max-turns 2` is the right value as margin.
- **Latency and cost are higher than the document says.** Round 4 measured 10 runs of
  the adopted configuration: mean wall **20.05 s**, max **33.84 s**, mean cost
  **$0.0103**. The document's 10.5 s / $0.005 figures are roughly half. 2 of 10 runs
  exceeded the 30 s kill timeout.
- **`Maxcogar/agent-armory` is a shallow clone.** `git rev-list --max-parents=0 HEAD`
  returns six commits; those six are the `.git/shallow` boundary set, not roots.
  `is-shallow-repository` → true.
- **`additionalContext` on `Stop`/`SubagentStop` is a continuation control** — it
  "keeps the conversation going through the same loop protections as
  `decision: block`". This produced OWNER-12 (see §7).
- **`StopFailure`** fires instead of `Stop` on API errors, carries `error: rate_limit`,
  and its output is ignored — a clean detector for the oracle exhausting the host's
  quota.

## 6. Failure modes this project produces — inherit these, don't rediscover them

Not "distrust the record" — the record is good and the reviews are the most valuable
artifact here. These are the specific, repeated ways work went wrong, so you can watch
for them:

1. **Patching instead of traversing.** Editing at the point of a finding produced
   defects in the sections not edited, every round. A change is not applied until the
   decisions it *cites* have been read and agree with it. Round 4 found nine
   cross-references whose targets did not carry what was cited — including
   `genre_dark`, cited as a D21 self-check, which exists nowhere in D21.
2. **Grep as verification.** Search locates; reading verifies. This is an owner
   directive after a grep returned zero hits for a sentence that was verbatim present
   (it wrapped a line break) and three hits for a substring inside an unrelated word.
   Absence claims are established by reading the region.
3. **Asserting a table's or section's contents without opening it.** The single most
   common defect class across all four rounds. Every instance was found by opening the
   file the claim cited.
4. **Certifying without running.** Load-bearing empirical claims were wrong in four
   consecutive rounds, in three successive forms (summary attestation blocks, then
   inline evidence, then cross-references). When you paste evidence, paste the full
   command, the run count, and the spread — single samples produced two wrong answers
   to the owner on the same question.
5. **Handing the owner decisions that are already written.** `CLAUDE.md` now carries a
   rule for this. The test: if you can name the file and line that decides it, you
   have your answer, not a question.

## 7. Authorities, unchanged

- `RETHINK.md` §12 + both addenda — the owner's locked decisions. **OWNER-12
  (2026-07-30) is new**: the oracle speaking when an agent claims completion is a
  must-have; the owner accepted the turn it costs, bounded to one continuation, gated
  on `stop_hook_active`, audited. That is settled — its bounding is open, its
  existence is not.
- `docs/specs/spec-context-oracle.md` — the requirements.
- `middleware/context-oracle/CLAUDE.md` — working guidelines, including the amended
  lifecycle and the rule against handing the owner decisions already written.
- `docs/collapse-log.md` — cumulative; read the 2026-07-30 and 2026-07-31 entries
  before designing anything.
- `docs/reviews/` — all eight review outputs, rounds 2–4, with closure ledgers.

## 8. Still true

No code has been written. Everything broken is broken in documents, which is the
cheap place for it. The lifecycle's purpose is to stop implementation landing on an
unsound design, and it did that.
