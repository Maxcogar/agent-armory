# Round 3 — adversarial collapse-hunt (mission fidelity only)

**Target**: `docs/architecture-context-oracle.md` (2,737 lines, D1–D26, T1–T4), as of
the 2026-07-30 19:50 revision.
**Axis**: mission fidelity only. Premise/standards is a separate, concurrent pass.
**Yardstick, verbatim**: *Deliver the fact that would change the agent's next
decision, at the moment of that decision, without being asked.*
**Method**: per the round-2 structural lessons, this hunt did **not** start from
round 2's findings. It started from (a) the corrected foundation's five conditions
for "worth sending", (b) RETHINK §2.3's *"marginal value over the agent's own
abilities is the only relevance metric that matters"*, and (c) the twelve FR-A2
genres — and its **primary instrument is an end-to-end traversal per genre**
(trigger → retrieval → grounding → bar → budget → assembly → delivery → audit →
learning), not a per-decision pass.

**Verdict: the architecture does not survive.** Fifteen collapses and three
partials. **Eleven of the fifteen live between decisions**, at a joint neither
decision owns — the same structural signature round 2 recorded. Four of the
fifteen are *downstream of round 2's own fixes*: a fix named a fact class, a
table, or a multiplier and did not wire it through the joints that consume it.
One cluster (C4) is the freshest owner decision, OWNER-12, present in this
document only as absence.

**Note on the posture class.** Per the caution inherited from the 2026-07-22
collapse-log entry (item 3), the two posture findings below (C4, C5) attack
*bounding*, never existence, and neither hands the owner a "should we keep it?"
question. C4 in particular exists **because** OWNER-12 is settled: the owner
accepted a *named, bounded, audited* cost, and the architecture implements
none of the four bounds he named.

**Note on verification.** Every absence claim below was established by reading
the region where the thing would live (D6's schema block, D8's payload
enumeration, D10 step 5's bar terms, D12 Move A1's retrieval enumeration, D21's
self-check list, D24's write classes, D26's fixture list, the traceability
matrix). Search was used only to locate.

---

## Part 1 — The twelve-genre end-to-end traversal

The pipeline: **trigger → retrieval → grounding → bar → budget → assembly →
delivery → audit → learning.** For each genre, the first joint at which it
cannot survive.

### 1. Orientation (trigger: `UserPromptSubmit`)

- **Trigger** — fires. But note: at the first prompt of a session the Lane 2
  intent queue is fed by "transcript deltas, loaded-skill texts, and open
  questions" (D10 step 4) and has none of these yet, so Orientation is
  **Lane 1 only** in practice. Lane 1 orientation = "structural entry points +
  literal landmine matches" (D10 step 4).
- **Retrieval — BREAKS.** Its three content elements per FR-A2 are entry points,
  *the invariant that will matter*, and *landmines matching the task shape*.
  D18 states that in v1 the `landmines`, `invariants`, and `exemplars` tables
  have no automated writer — mining is Phase 2 — and names as v1 writers only
  `human_facts` promotion and "the literal-match landmine path for orientation",
  **without naming what that path writes from**. So two of three content
  elements retrieve from empty tables.
- **Bar — BREAKS AGAIN.** The surviving element, structural entry points, is
  single-file static structure — D10 step 5a's own **≈0.15 `self_serve_cost`**
  class ("this file imports that one").
- **Conclusion.** RETHINK §5's flagship task-start whisper has, in v1, one
  content source that is empty and one that the bar multiplies toward zero.
  Nothing in the document says so. (→ C12, C13)

### 2. Coupling (trigger: file read / symbol searched)

- **Survives end to end** for its co-change half: retrieval from
  `cochange_file_pairs` (D17), grounding by commit pointer, `self_serve_cost`
  ≈1.0 (git history), floors from FR-A5, template render with the FR-D5 ratio
  (D13), audit durable (D24), uptake detectable by subject edit (D10 9b).
  **This is the only genre that survives the whole traversal cleanly.**
- Its second half — "canonical helper for the thing searched" (FR-A2) — breaks
  twice: the `exemplars` table has no v1 writer (D18), and 5a names *"there is a
  helper at Z"* as its ≈0.15 example and as the **predicted noise failure**.

### 3. Assumption check (trigger: narration)

- **Trigger** — narration lags one boundary (measured, D14). Survivable.
- **Retrieval/grounding/bar** — survives when the contradicting evidence is a
  co-change or human fact; breaks on `self_serve_cost` when it is structural.
- **Delivery — PARTIAL BREAK.** D14's own C9 note: reading lag and delivery lag
  are different numbers and only the first is measured; the ≈10.5 s judgment
  plus queue time means the supersession re-check (D10 step 7) may drop most
  candidates, presenting as correct silence. D14 makes this a measured quantity
  and an FR-M2 check — the only genre-family where that was done. Accepted.

### 4. Steering (trigger: narration intent ≠ where the agent is looking)

- **Bar — BREAKS.** Steering's entire content per FR-A2 is *"where that concern
  actually lives"* — a location in the current tree. That is `self_serve_cost`
  ≈0.15 by 5a's own definition, for every instance of the genre. Unlike
  Consequence, Steering has no high-cost sub-content to fall back on.
- Nothing in the document reconciles a genre whose only content class the bar
  multiplies by 0.15 against a bar that "ships high". (→ C12, C13)

### 5. Consequence (trigger: pending edit, `PreToolUse`)

- **Bar — PARTIAL BREAK.** Of FR-A2's three content elements, *call-site count
  and spread* and *existing implementation to reuse* are both explicitly in 5a's
  ≈0.15 class (and the second retrieves from the empty `exemplars` table).
  Only *historical breakage* survives at ≈1.0 — and its source (revert
  chains / fix-of-a-fix) is Phase 2 mining per D18. So in v1, Consequence's
  deliverable content is co-change-with-test-files.
- Note the internal oddity nobody resolves: call-site count *raises*
  `structural_weight` (blast radius, D10 step 5) and *lowers* `self_serve_cost`
  (5a). Both are correct; the document never states the net.

### 6. Warning ⚠ (trigger: edit pending on generated/vendored zone, or landmine)

- **Retrieval** — the landmine arm is empty in v1 (D18). The zone arm works
  (D16).
- **Bar — PARTIAL BREAK, ambiguous.** FR-A5 sets warn-grade floors as
  *co-change* support ≥ 3 ∧ confidence ≥ 0.9, qualified by "History-backed
  genres additionally respect evidence floors". D10 step 5 restates the floors
  applied to "warn-grade" **without that qualifier**. A generated-file warning
  has no co-change support number. An implementer following D10 blocks AC-5, a
  Phase 0 exit. One sentence fixes it; it is currently undecided. (→ Partial P2)
- **Assembly — survives**, via D13's pointer-only render.
- **Delivery/audit/learning — survives**; false-fire clause (FR-D3) feeds the
  ladder.

### 7. Completeness (trigger: edit completed / **Stop**)

- **Delivery — BREAKS at the Stop arm.** A Completeness whisper delivered on
  `Stop` is a continuation: it costs the agent a turn. Spec §6.1 + FR-O4a bound
  this with four controls (`stop_hook_active` gate, raised Stop-grade bar,
  continuation recorded in the FR-X6 audit record, counted in `status`).
  **None of the four exists in this document.** `stop_hook_active` appears zero
  times; D8's envelope defines no `stop` payload at all; D9's shim is
  logic-free so it cannot gate; D10's bar has no stop term; `whisper_log` (D6)
  has no continuation column; D21's seven self-checks count no continuations;
  FR-O4a has no traceability-matrix row. (→ **C4**)
- **Bar — additionally exposed to C5**: the explore budget may deliver a
  *below-bar* Completeness candidate at Stop, spending a turn for telemetry.

### 8. Verification (trigger: **Stop**)

- **Bar — BREAKS.** Its content is "the verification command for the changed
  region". D16 sources `verify_commands` from `package.json` scripts per
  workspace dir and pytest/tox presence. That is one `Read` away — 5a's ≈0.15
  class — and it must additionally clear the raised Stop-grade bar the spec
  requires (which does not exist, so in practice it clears the ordinary bar
  while spending a turn: the worst of both).
- **Delivery — same C4 break as Completeness.**
- D20 nonetheless calls verification commands *"non-obvious history facts …
  cold-checkout-invisible knowledge (P5-passing)"*. They are neither history
  nor cold-checkout-invisible. (→ **C12**)

### 9. Answer (trigger: narration addresses the oracle)

- **Retrieval — honestly capped** by D12's A0 shaping sub-turn; the cap is
  stated. Good.
- **Delivery — PARTIAL BREAK.** A discovery Answer costs *two sequential model
  calls* (A0 shaping, then Move A/B) at ≈10.5 s each, on top of the one-boundary
  reading lag. FR-S3 fixes the contract as *"answered at the next injection
  opportunity, best effort."* The architecture's own numbers make the next
  opportunity structurally unreachable for the discovery case. D14's C9 note
  identifies the second model call as a lag contributor but never notices that
  it puts the design in conflict with FR-S3. (→ Partial P1)
- **Learning — BREAKS.** No uptake predicate applies (→ C15).

### 10. Unknown (trigger: task depends on something the repo doesn't determine)

- **Retrieval/grounding — survives** via round 1's negative-evidence fact
  (bounded query + empty result as the pointer). This is the one fix whose
  pointer shape is right.
- **Bar — undefined.** 5a's three `self_serve_cost` bullets are all about facts
  with a location. An *absence* has no provenance class in the sense 5a uses.
  No value is assigned; the bar cannot be computed. (→ C2)
- **Learning — BREAKS.** No uptake predicate (→ C15).

### 11. Process conformance (trigger: skill steps depart from observed activity) — **OWNER-9**

Four consecutive joint failures, all downstream of round 2's C2 fix:

- **Grounding — BREAKS.** D14 defines the session-evidence fact class as
  `prov_kind='session'`. D6's CHECK constrains `prov_kind` to
  `('repo_span','commit','human','learned','mechanical')`, and D6's entire claim
  is that a non-conforming record is *unrepresentable*. The fact class the fix
  invented cannot be inserted. (→ **C6**)
- **Grounding — BREAKS AGAIN.** The whisper's own worked example carries three
  claims; only one (*"skill X requires verification at line L"*) binds to
  `skill_expectations`. *"Completion claimed at turn T"* has no table, and
  *"no matching tool call observed"* is an **absence** claim whose pointer is
  defined as a single `transcript:<session>:<offset>` re-read. Re-reading one
  offset shows what *is* there. Round 1's Unknown fix used a bounded query and
  its empty result — the correct shape — and D14 claims to generalize it while
  dropping exactly the property that made it work. D12 Move C drops the *whole
  whisper* on one dangling `grounding_id`. (→ **C7**)
- **Retrieval — BREAKS.** D12 Move A1 enumerates the grounded fact set: "FTS +
  co-change + exemplars + landmines/invariants + open questions."
  `skill_expectations` and session-evidence facts are not in it, and Move B may
  only bind to *supplied* facts. The fix built the table and never fed it to the
  model. (→ **C8**)
- **Audit/durability — BREAKS.** D24 classifies writes as durable
  (`whisper_log`, `suppressions`) or disposable ("session_log candidate traces,
  Tier-3 flushes", droppable on contention). `skill_expectations` is
  unclassified and falls in the disposable set by D24's own enumeration — so a
  dropped bookkeeping write silently disables the owner-added genre and presents
  as correct silence. This is round 2's Collapse 4 recurring one table over,
  created by round 2's other fix. (→ **C9**)
- **Assembly — BREAKS.** AC-19 requires the whisper to *name the skipped step*.
  The step's name is untrusted skill prose, and D13 (declaring itself "the
  single authority on quotation of repo text") permits inline text **only for
  mechanically-generated non-repo content the oracle itself produced.** Whether
  an oracle-extracted command name is a repo span or oracle-generated content is
  undecided, in the one rule that was rewritten specifically to stop two rules
  governing one behaviour. (→ **C10**)
- **Learning — BREAKS.** No uptake predicate (→ C15).

### 12. Answer drift (trigger: direct user question unaddressed across turns) — **OWNER-9**

- **Trigger — BREAKS.** D14 calls this "the easy half", "fully specified", and
  "deterministic bookkeeping". D6 carries `open_questions(… resolved INTEGER)`.
  **The predicate that sets `resolved` — i.e. what "addressed" means — appears
  nowhere in the document.** Determining whether a turn addressed a question is
  the same language judgment for which D14 narrowed the Process detector to a
  mechanically decidable subset. The document narrowed the half it examined and
  certified the half it did not. (→ **C11**)
- **Grounding — same absence-pointer break as Process** ("unaddressed for 2
  turns" is an absence claim). (→ C7)
- **Mode — undecided.** If answer-drift is deterministic it should run in
  degraded mode; FR-J3's degraded genre set (which D20 enforces) excludes it.
  If it is not deterministic it is Lane 2 and D14's sentence is wrong.
- **Learning — BREAKS.** No uptake predicate (→ C15).

### Traversal summary

| Genre | First joint that breaks | Findings |
|---|---|---|
| Orientation | retrieval (empty tables), then bar | C12, C13 |
| Coupling | — (survives; helper half breaks at retrieval + bar) | C12 |
| Assumption check | delivery (measured, accepted) | — |
| Steering | bar (all content ≈0.15) | C12, C13 |
| Consequence | bar (2 of 3 contents ≈0.15) | C12 |
| Warning ⚠ | bar (floor applicability undecided) | P2 |
| Completeness | delivery (unbounded continuation) | **C4**, C5 |
| Verification | bar, then delivery | **C4**, C12 |
| Answer | delivery (FR-S3 unreachable), learning | P1, C15 |
| Unknown | bar (no self_serve_cost value), learning | C2, C15 |
| **Process** | grounding ×2, retrieval, durability, assembly, learning | **C6–C10**, C15 |
| **Answer drift** | trigger (no predicate), grounding, learning | **C11**, C7, C15 |

**One genre of twelve survives the full traversal.** The two owner-added genres
(OWNER-9) fail at five and three joints respectively — round 2 found them
undeliverable, and the fix moved the undeliverability one layer down rather than
removing it.

---

## Part 2 — Decisions attacked

Format per finding: **ID · decision(s) · the collapse question verbatim ·
verdict · class · why hollow against the mission · concrete fix.**

---

### C1 — D10 step 5a vs. D20 · the bar has two contradictory formulas, and the one governing Phase 0 is the version round 2 collapsed

**Question.** *"D10 step 5a fixes the bar as `decision-impact = materiality ×
structural_weight × self_serve_cost` and states that `self_serve_cost` is
**deterministic**. D20 states that in degraded mode `decision-impact` 'falls
back to `structural_weight` alone.' Degraded mode **is** Phase 0 — the thing the
owner runs first on a real repository, and the window in which D7 itself invokes
[COVERITY-10]'s first-impression effect as load-bearing. Point at the sentence
that says a deterministic factor is computed in the mode that has no model. If
D20 is right, the product the owner meets first ships with precisely the bar
round 2 collapsed — the one with no term for what the agent could have got
itself."*

**COLLAPSES.** Class: **reduction** (the fix's reach silently truncated) +
**wrong-check**.

**Why hollow.** RETHINK §2.3 makes marginal value *"the only relevance metric
that matters"*. Round 2's sharpest finding was that the bar had no term for it.
The fix added the term — and D20, written to state Phase 0's honest scope,
deletes it again for the only phase that will run for months. Worse, D20's own
caveat is *about* degraded mode's inability to judge materiality; it correctly
degrades `materiality` and then incorrectly degrades a factor that has nothing
to do with the model. The predicted failure 5a names — *"there is a helper for
the symbol you just grepped for"* — is exactly what Phase 0 will emit.

**Fix.** State the formula once, in D10 5a, as invariant across modes:
`decision-impact = materiality × structural_weight × self_serve_cost`, where
**only `materiality` degrades** (to the genre's base weight) when no model path
exists; `structural_weight` and `self_serve_cost` are deterministic and apply in
both modes. Rewrite D20's sentence to say that. Add: AC-16a's fixture (the
grepped-symbol case) runs in **degraded mode as well as model mode** — it is the
mode where the failure it tests actually ships.

---

### C2 — D10 step 5a · `self_serve_cost`'s named input cannot produce its named output

**Question.** *"`self_serve_cost` is 'derived from the fact's own provenance
class plus what this consumer has already done.' D6's provenance class is a
five-value enum: `repo_span | commit | human | learned | mechanical`. Name the
value that separates a cross-file invariant (**High, ≈1.0**) from the exemplar
'there is a helper at Z' (**Low, ≈0.15**) — both are `repo_span` pointers into
real code. Name the value that separates a co-change edge (**High**) from a
verify command (**Low**) — D16 records the latter `prov_kind='mechanical'` and
D17 records the former from commits, but both are oracle computations over the
repo. And name the value for an `Unknown` genre's negative-evidence fact, which
has no location at all. Who writes `self_serve_cost`, in which decision, from
what inputs?"*

**COLLAPSES.** Class: **decision-hiding** — the exact tell the collapse log
names: *a citation that lands on a schema column rather than a per-candidate
computation with named inputs.*

**Why hollow.** This is criterion 2 of the corrected foundation's five. Round 2
found it was prose; the fix gave it a formula, a range, three worked values, and
a fixture — and named as its input the one field in the schema that provably
cannot discriminate the cases the fix's own table distinguishes. `repo_span`
maps to both a High and a Low example; `mechanical` maps to a Low example and to
zone facts the document elsewhere calls non-obvious. An implementer cannot write
this function.

**Fix.** `self_serve_cost` is a property of the **fact class**, not of
provenance. Declare it explicitly:
1. Add a `self_serve_class TEXT CHECK(self_serve_class IN ('invisible','derivable','trivial'))`
   column to every knowledge table in D6, `NOT NULL`, DAO-enforced exactly as
   `prov_kind` is — so a new fact class cannot enter the store without declaring
   what it costs the agent to get itself.
2. Give D10 5a a table mapping every v1 fact source to its class with a
   one-line reason: co-change pairs → invisible; landmines → invisible;
   invariants → invisible; human_facts → invisible; **zone facts → invisible on
   the *consequence*, not the classification** (see C12); exemplars → trivial;
   `ref_edges` call-site counts → trivial; `verify_commands` → trivial;
   entry points → trivial; negative-evidence and session-evidence facts →
   invisible (an absence and a conduct conflict are not greppable).
3. Map classes to multipliers in one place (`tuning`, D23, with the defaults
   listed there — see C14).

---

### C3 — D10 step 5a vs. D8 · the "demonstrated reach" clause requires data the contract deliberately drops

**Question.** *"'Driven to ≈0 by demonstrated reach: Tier 3 records the
consumer's read set and issued search terms; **when a fact's location already
falls inside a result set this consumer has seen**, the fact is not non-obvious
to it.' D8 summarizes `tool_post` in the shim to
`{tool, input_summary: {path?, pattern?, …}, output_digest?}` and states that
'full tool payloads never cross the boundary, bounding IPC size and shrinking
the secret-bearing surface (FR-X1).' A digest is not a result set. Name the
field from which the service learns which paths a `Grep` returned."*

**COLLAPSES.** Class: **unverified** (a computation asserted against a contract
that forecloses it).

**Why hollow.** The clause is the strongest half of the non-obviousness term —
it is what makes the criterion *consumer-relative* rather than a static
constant, which is what P5 and FR-A4 both require. Half of it (matching issued
search *terms* against a fact's symbol) is computable; the half quoted is not,
and the fixture AC-16a is written against the computable half only, so the gap
would never surface.

**Fix.** Choose and state one:
- **(a)** Extend D8's `tool_post` payload with a bounded, secret-scanned
  `result_paths: string[]` (cap ~50, D19 scanned in the shim before it crosses)
  for `Read`/`Grep`/`Glob` only — and re-run the T3 analysis for it in the threat
  model, since payload minimisation is why it was excluded. Or
- **(b)** Delete the result-set sentence and state the weaker rule that is
  actually computable: *a fact whose subject path is in this consumer's read set,
  or whose subject symbol matches an issued search term, gets `self_serve_cost`
  ≈ 0.* Then AC-16a fixtures both arms.

Either is acceptable; leaving the stronger sentence with no producer is not.

---

### C4 — spec §6.1 / FR-O4a / OWNER-12 vs. D8, D9, D10, D6, D21, D26, matrix · the freshest owner decision has no mechanism anywhere in this document

**Question.** *"OWNER-12 is not 'the oracle may speak at Stop.' It is: **'a
decision to accept a named, bounded, audited cost — not a decision that
continuation is free.'** The owner named four bounds, and spec §6.1 and FR-O4a
write them down: emit at `Stop`/`SubagentStop` **only when `stop_hook_active` is
false**; hold a Stop-grade whisper to a **raised bar** because it is the only
whisper that spends a turn rather than riding an existing boundary; **record
every Stop delivery as a continuation event in the FR-X6 audit record**; and
**count it in `ctxoracle status` so the owner can see how often the oracle
extended a turn.** Point at the decision that implements any one of the four.
`stop_hook_active` occurs zero times in this document. D8's envelope enumerates
payloads for `prompt`, `tool_pre`/`tool_post`, `session_start`, and
`subagent_start` — there is **no `stop` payload at all**, so the field never
crosses the boundary. D9's shim is logic-free by FR-O2, so it cannot gate.
D10 step 5 lists every term in the bar and none of them is a stop term.
`whisper_log` (D6) has ten columns and none records a continuation. D21 runs
seven self-checks and none counts continuations. D26's AC-3 fixture is described
as 'the shim response type contains no decision fields — compile-time + runtime
scan', which is the **pre-2026-07-30 AC-3**; the widened criterion the spec added
the same day this document was last revised requires asserting silence on
`stop_hook_active: true` and no more than one continuation per stop. FR-O4a has
no row in a traceability matrix the Status section calls total over FRs. So:
which artifact stops the oracle chaining continuations, and where does the owner
see that it happened?"*

**COLLAPSES.** Class: **posture** (bounding removed — *not* the feature) +
**decision-hiding**.

**Why hollow against the mission.** P2's "worst possible outcome is a wasted
sentence" is what makes every whisper free to ignore, and that is the property
that makes the tool a guide rather than a gate. Spec §6.1 records that the
property is **false on `Stop`**: there the cost is a turn the agent was trying to
end. The owner accepted that cost *once per stop, above a raised bar, on the
record*. As shipped, the design delivers it: on an ordinary bar, with no gate on
`stop_hook_active`, with no field in the contract to gate on, with no audit
column and no counter. That is not the owner's accepted bounded cost; it is an
unbounded one. And the spec itself records the precedent: **"AC-3 passed while
the effect was live"** — continuation is the axis a deny-field enumeration
structurally cannot see, which is why the owner's bounds are mechanisms and not
policy. Two of this document's genres (Completeness, Verification) trigger
*only* at Stop; Process fires on completion claims, which is the same moment.
This is not a corner.

**Fix (all seven parts; the first three are load-bearing).**
1. **D8** — add `stop` / `subagent_stop` payload `{ stop_hook_active: boolean }`
   to the contract enumeration (and `session_end: {}` for completeness). The
   shim maps the harness field; that is field translation, not logic, so D9/FR-O2
   are untouched.
2. **D10 step 5** — the attention engine **returns silence unconditionally** on a
   stop-class event when `stop_hook_active` is true, before the bar is evaluated.
   In the service, not the shim.
3. **D10 step 5** — add `stop_bar_delta` as an explicit term applied to any
   candidate delivered on a stop-class event, a `tuning` row (D23) with its
   default and its derivation stated (see C14 — D23's default list must actually
   carry it).
4. **D6** — `whisper_log` gains `continuation INTEGER NOT NULL DEFAULT 0`, set to
   1 for stop-class deliveries; written on D24's **durable** audit append, which
   happens *before* delivery, so the count cannot diverge from reality.
5. **D21** — an eighth self-check: continuations per session, with finding code
   `continuation_budget`, rendered by `status` in plain language ("the oracle
   extended a turn N times this session"), per OWNER-12's own words.
6. **D26** — replace the AC-3 fixture description with the **widened** AC-3:
   the field/exit-code scan **plus** (a) `stop_hook_active: true` → silence, and
   (b) no oracle output can extend the loop by more than one continuation per
   stop.
7. **Traceability matrix** — add `FR-O4a` and the §6.1 continuation bounds. A
   matrix that omits the newest requirement while its own Status section claims
   totality over FRs is the certification shape finding S1 already condemned.

---

### C5 — D10 step 9(a) vs. spec §6.1 / OWNER-12 and FR-A7 · the explore budget spends the agent's turns for telemetry

**Question.** *"The explore budget deliberately delivers the top **below-bar**
candidate on ~2% of events, excluded only from warn-grade. Completeness and
Verification fire at `Stop`. Name the rule that stops the oracle from spending
the agent a turn — the cost OWNER-12 accepted only as a bounded, high-value,
audited exception — in order to collect uptake data on a fact the oracle itself
judged **not worth sending**. Then name the rule that stops explore from firing
inside the FR-A7 first-sessions window, given that D7 invokes [COVERITY-10]'s
first-impression effect as the load-bearing reason its ladder state is per-mode."*

**COLLAPSES.** Class: **posture**.

**Why hollow.** The anti-silence-ratchet is right and necessary — the loop
genuinely needs an up-signal. But its one exclusion (warn-grade) is drawn on the
axis of *evidence strength*, and the axis that matters for cost is *whether the
event carries a continuation*. An explore whisper at Stop is a turn the agent
loses to deliver a fact the system's own bar rejected. That is strictly worse
than the "wasted sentence" P2 promises, and it is imposed on purpose. Firing
explore inside the first-sessions window compounds it against the exact effect
FR-A7 exists to protect.

**Fix.** In D10 step 9(a), state two exclusions instead of one: explore never
fires (i) on warn-grade candidates, and (ii) on **stop-class events** — it rides
only `UserPromptSubmit` / `PreToolUse` / `PostToolUse`, which carry no
continuation cost. And add (iii): explore is off inside the FR-A7 first-sessions
window. Note in the same paragraph that (ii) narrows the explore sample to
non-Stop genres, so Completeness/Verification bar-calibration must come from the
below-floor near-miss log (step 9a) rather than from explore — otherwise the
exclusion silently removes the up-signal for two genres.

---

### C6 — D14 vs. D6 · the Process genre's fact class is unwritable by the schema that enforces provenance

**Question.** *"D14's session-evidence fact class sets `prov_kind='session'`.
D6 constrains it: `prov_kind TEXT CHECK(prov_kind IN
('repo_span','commit','human','learned','mechanical'))`, on STRICT tables, and
D6's stated purpose is that a non-conforming record is **unrepresentable**. Name
the migration that adds `'session'`. Then name the **table** a session-evidence
fact is inserted into — `skill_expectations` holds expectations, not the
completion-claim observation that the whisper's first claim binds to."*

**COLLAPSES.** Class: **unverified** — a fix asserted without checking it against
the one constraint the document says makes provenance real.

**Why hollow.** D6's guarantee is the floor beneath the whole judgment layer:
"provenance-less records are unrepresentable." The round-2 fix for the owner's
own genre proposes a provenance kind that guarantee rejects. Nobody re-read D6.
The genre would be built, the insert would throw, and an implementer would
either widen the CHECK inline (dissolving the guarantee) or route around the DAO
(same) — both inside a Phase 1 sprint, invisibly.

**Fix.**
1. D6: add `'session'` to the `prov_kind` CHECK with the same comment discipline
   as the others (`prov_ref` form: `transcript:<session>:<from>..<to>?predicate=…`
   — see C7).
2. D6: add the table the facts live in —
   `session_evidence(id, session, consumer, kind, subject, from_offset,
   to_offset, predicate, result, …prov)` — where `kind ∈ ('claim','activity',
   'absence')`, `result` carries the scan's outcome, and `…prov` binds
   `prov_kind='session'`.
3. D13: its assembly gate currently resolves file-hash and commit pointers;
   register the transcript-range resolver there explicitly. D14 says D13 "gains
   this resolver"; D13's own text does not mention it. Two decisions, one
   behaviour, one of them silent — the defect D13 declared itself the authority
   to prevent.

---

### C7 — D14 · the absence claim's pointer is the wrong shape; round 1's Unknown fix was named as generalized and was not

**Question.** *"Round 1 fixed `Unknown` with a negative-evidence fact whose
pointer is **the bounded query and its empty result** — 'the pointer resolves by
re-running the query, satisfying P4.' D14 says it 'generalizes the round-1
negative-evidence mechanism beyond store queries' and then defines the pointer
as `transcript:<session>:<offset>` with 'a resolver that **re-reads that
transcript offset**.' Re-reading one offset shows what **is** at that offset.
Name the offset at which *'no matching tool call was ever observed'* can be
read. The same question applies to Answer-drift's *'unaddressed for 2 turns'*."*

**COLLAPSES.** Class: **reduction** — the fix kept the easy half (a point
pointer) and dropped the property that made round 1's version work (a bounded
re-runnable scan).

**Why hollow.** P4 is *"every claim carries provenance the agent can check."* For
a positive claim, a point pointer is checkable. For a **negative** claim it is
not: checking an absence requires re-running the bounded search that found
nothing. Round 1 got this exactly right, and this is the second consecutive
round in which an absence claim was fitted with a presence pointer — the trap the
collapse log says should be inherited, re-sprung by the decision that cites it.

**Fix.** Session-evidence *absence* facts carry
`prov_ref = 'transcript:<session>:<from_offset>..<to_offset>?predicate=<signature>'`
and a resolver that **re-runs the bounded scan over that range and asserts zero
matches**. Same for FR-A9. State the general rule once, in D6 beside the
`prov_kind` CHECK, so it governs any future negative fact class: *the pointer of
a negative claim is the bounded search, never a location.* AC-19 and AC-20's
fixtures assert the pointer re-runs and reproduces the empty result.

---

### C8 — D14 vs. D12 Move A1 · the Process genre's fact never reaches the model

**Question.** *"D14 makes Process a Lane 2 genre — the model composes the
conflict. D12 Move A1 enumerates what deterministic retrieval assembles into the
grounded fact set: 'FTS + co-change + exemplars + landmines/invariants + open
questions.' `skill_expectations` and session-evidence facts are not in that
list, and Move B may bind claims **only** to supplied facts. Name the retrieval
step that puts a skill expectation in front of the model."*

**COLLAPSES.** Class: **decision-hiding**.

**Why hollow.** Round 2's fix built the table and the fact class and left the one
enumeration that decides *what the model may see* untouched. That enumeration is
the same step round 2 promoted to first-class *"because it is where the real
reach lives"* — and it is still a hand-maintained prose list that no genre is
required to appear in.

**Fix.**
1. Add session-evidence and `skill_expectations` to D12 A1's retrieval
   enumeration, keyed by consumer and registration order.
2. Structural, so this cannot recur: put a **retrieval-source table** in D10 —
   one row per genre naming its trigger event, its store table(s), its
   `self_serve_class`, and its uptake predicate (see C2, C15). A genre with a
   blank cell is a build-time error. This single table is what turns "twelve
   genres" from a list into a checkable contract, and it is the artifact whose
   absence produced C2, C8, C12, C13, and C15.

---

### C9 — D14 vs. D24 · the conduct genres' grounding facts sit in the droppable write class

**Question.** *"D24 splits writes into a durable class (`whisper_log`,
`suppressions` — 'the audit trail is not disposable') and a disposable class
('session_log candidate traces, Tier-3 flushes') that may be dropped on
contention with a diagnostic. `skill_expectations` and `open_questions` are
written by the narration reader and are the only facts a Process or
Answer-drift whisper can bind to; D12 Move C drops the **whole whisper** on one
dangling `grounding_id`. Which class are they in? By your own enumeration they
are Tier-3 flushes. So a contended write silently disables the two genres the
owner specifically asked for, and it presents as correct silence."*

**COLLAPSES.** Class: **wrong-check** — the third recurrence of "fail-open is
right for latency and wrong for the thing that must not vanish."

**Why hollow.** Round 2 found `whisper_log` in the droppable class and fixed
exactly that row. The *rule* behind the fix — fail-open applies to telemetry,
never to a control something depends on — was never written down, so the very
next round's fix added two tables that a whisper's grounding depends on and
dropped them into the disposable set by default.

**Fix.** Replace D24's two hard-coded lists with a **rule**: *any write whose
record a later whisper's grounding will resolve against is non-droppable; only
records that nothing resolves against are disposable.* Then enumerate under it:
durable = `whisper_log`, `suppressions`, `skill_expectations`, `open_questions`,
`session_evidence`, `human_facts`; disposable = `session_log` candidate traces
and Tier-3 spend/decay counters. All the newly-durable tables are small and
low-rate, so route them through the same append-only spool the audit record
uses — no WAL contention, no NF-1 exposure.

---

### C10 — D13 vs. AC-19 · pointer-only for all repo-derived spans makes "name the skipped step" unsatisfiable, and the rule's boundary is undecided exactly where the owner's genre needs it

**Question.** *"D13 declares itself 'the single authority on quotation of repo
text' and sets the rule: inline quotation is permitted **only for
mechanically-generated, non-repo content the oracle itself produced.** AC-19
requires a Process whisper **naming the skipped step**. The step's name is a
copy of untrusted skill prose that entered through the transcript, and D14 adds
that an expectation carrying `trust='untrusted_repo'` supplies no `claim_text`
to the model at all. Is an oracle-*extracted* command name a repo span or
oracle-generated content? Whichever you answer — name where this document
answers it."*

**COLLAPSES.** Class: **reduction** (an owner-mandated genre's deliverable
content quietly removed by a security default) with an undecided rule at the
seam.

**Why hollow.** Round 2 corrected D12/D13 for stating *two* rules for one
behaviour, on the grounds that "an implementer picks one, and whichever they
pick, the choice is unreviewable." The replacement rule is single but
**undecidable** for the case the owner's own genre needs, which is the same
defect in a different costume. If identifiers are repo spans, AC-19 cannot pass
and FR-A8's deliverable form has silently changed. If they are not, T1's
carrier analysis needs to say why a copied identifier is safe when a copied
sentence is not.

**Fix.** D13 states the boundary explicitly:
- **Identifier-class tokens** copied from repo/transcript text — a command
  string, tool name, file path, symbol name, line number — are permitted inline,
  because D12 Move C's token-provenance rule already constrains them to tokens
  present in the bound fact and they carry no free-form prose surface.
- **Prose spans** — any span longer than an identifier, or containing
  whitespace-separated natural language — remain pointer-only.
- D14 writes out AC-19's expected whisper **verbatim** so the fixture is
  unambiguous, e.g. `[oracle] (process) completion claimed at turn 14; loaded
  skill ctxoracle-companion line 37 requires \`npm test\`; no matching Bash
  event observed for this consumer since turn 9 (transcript 41,220..58,904).`
- T1's residual paragraph gains one sentence covering identifier-class
  inlining.

---

### C11 — D14 / FR-A9 · answer-drift is certified "the easy half, fully specified"; its deciding predicate has no producer

**Question.** *"FR-A9 fires when successive assistant turns 'fail to address' an
open question, D6 carries `open_questions(… resolved INTEGER)`, and D14 calls
this 'deterministic bookkeeping' and 'the easy half' — in the same paragraph
that narrows the Process detector to a mechanically decidable subset **because
prose is not mechanically decidable.** Name the decision, the inputs, and the
rule by which `resolved` is set. If 'addressed' is a language judgment it is
Lane 2 work and answer-drift is not deterministic — in which case it is absent
from FR-J3's degraded genre set and off in Phase 0, which nothing says. If it is
deterministic, write the predicate."*

**COLLAPSES.** Class: **decision-hiding** — a column with no producer, driving a
genre.

**Why hollow.** This is the same shape round 2 caught one paragraph away, and it
survived because the fix's own text pre-certified it. The document narrowed the
half a reviewer had contested and certified the half nobody had. "Deterministic
bookkeeping" is not an argument; tracking that a question was asked is
bookkeeping, deciding it was answered is not.

**Fix.** Give answer-drift the same treatment D14 gave Process — a stated
mechanically decidable subset, narrower than FR-A9, recorded in Limitations:
- A question is **registered** when a user turn contains an interrogative
  construction; its subject tokens (nouns, identifiers, paths) are extracted and
  stored with `asked_loc`.
- It is **resolved** when a later assistant turn contains ≥1 of its subject
  tokens *and* an answer-shaped construction, **or** when the user turn that
  follows does not restate it.
- Anything not mechanically decidable is **not registered** and produces no
  whisper. Narrower is acceptable; undesigned is not — D14's own words.
- State which lane owns it and therefore whether it runs in degraded mode.

---

### C12 — D20 vs. D10 step 5a · D20's P5 claim about the Phase 0 product is false under 5a's own table

**Question.** *"D20's honest-scope caveat says the Phase 0 / degraded product
delivers 'non-obvious **history** facts on mechanical triggers (co-change
partners, generated-file warnings, verification commands) — genuinely valuable,
**cold-checkout-invisible** knowledge (P5-passing, which is why it is not "the
linter agents don't need")'. D16 sources `verify_commands` from `package.json`
scripts and pytest/tox presence, and zone classification from head markers,
`dist/`/`build/` patterns and `.gitignore` membership. Neither is a history
fact and both are one `Read` away — 5a's own ≈0.15 class. Which of FR-J3's five
degraded genres survives the third factor of your own bar?"*

**COLLAPSES.** Class: **mechanism-not-mission** (the honest-scope paragraph
overclaims the very property it was written to bound).

**Why hollow.** D20 exists to stop Phase 0 being overclaimed. It then claims the
one property — P5 marginal value — that 5a's table denies to two of the five
genres it names. Working the traversal through: of FR-J3's five, **coupling** and
**completeness** survive (co-change, ≈1.0); **orientation** does not (empty
tables + structural entry points at ≈0.15); **verification** does not (≈0.15);
the **generated-file warning** survives, but *not for the reason D20 gives* —
the classification is derivable, the **consequence** ("a hand edit is silently
overwritten on the next build") is not. Phase 0 is two-and-a-half genres, not
five, and the document says five.

**Fix.**
1. Rewrite D20's caveat to state, per genre, what survives: coupling and
   completeness on co-change (invisible); the generated-file warning on its
   *consequence* (invisible) rather than its classification (derivable);
   orientation and verification do **not** clear the non-obviousness term as
   specified.
2. Then decide each, in writing: verification either descopes from v1 or earns a
   stated exception with its reason (a defensible one exists — the command is
   trivially findable but the *region→command mapping* is not; if that is the
   claim, `test_map` is the fact and the exception must say so). Orientation
   either descopes from v1 until D18's mining lands, or ships explicitly as a
   structural-only whisper with its low expected fire rate stated so the C13
   self-check does not flag it as broken.
3. Correct D18's sentence naming "the literal-match landmine path for
   orientation" as a v1 **writer** without naming what it writes from.

---

### C13 — D14 / D15 / D10 9a · "silent because broken vs. silent because correct" is a stated standard implemented only where a reviewer happened to look

**Question.** *"D15 states the standard plainly: **'"Silent because broke" must
be distinguishable from "silent because correct" — that distinction is D10's own
stated standard for the attention engine.'** You then implement it three times,
each time locally and each time for the case a prior reviewer had just raised:
budget denial (D15), supersession drop (D14), below-floor near-miss (D10 9a).
Name the check that catches a genre that never fires because its store table has
no writer (D18), because `self_serve_cost` zeroes its only content class (5a),
or because its retrieval source is not in Move A1's list (C8). What does
`ctxoracle status` show for a genre that has emitted nothing in twenty
sessions?"*

**COLLAPSES.** Class: **wrong-check** — three instances of a rule, and no rule.

**Why hollow.** The mission's operational shape is *silence by default plus the
ability to tell healthy silence from a dead capability*. With twelve genres and
eight pipeline joints, bespoke detectors written one per contested finding will
never cover the space; this traversal found five distinct dark-genre causes and
none of the three existing detectors sees any of them. A tool that has silently
lost nine of twelve genres reports as healthy — which is precisely the failure
D10 step 9's anti-ratchet was built to prevent, generalised from the bar to the
genre.

**Fix.** One general FR-M2 self-check in D21, replacing nothing and subsuming the
three: per genre, over a rolling window, record **candidates generated /
candidates above bar / whispers delivered**, and raise
- `genre_dark` — a genre enabled in the current mode produced **zero candidates**
  across N sessions (its retrieval source is empty or unwired);
- `genre_never_clears` — it produced candidates that **never cleared the bar**
  (its `self_serve_cost` or floors zero it);
- `genre_never_survives` — candidates cleared the bar and were dropped at
  assembly, supersession, or budget (subsumes D14's and D15's checks).

`status` renders these in plain language. Add the counters as columns on the
retrieval-source table from C8's fix, so every genre carries its own health
row by construction.

---

### C14 — D15 vs. D23 and FR-A3 · the budget fix replaced arrival order with an allocator that has no allocation rule, and silently repeals the hard cap

**Question.** *"'**Scale the session ceiling with the number of active
consumers** rather than holding a fixed pool; the default and its derivation are
stated in `tuning` (D23) so the learning loop can move it.' D23 lists its
shipped defaults and their spec sources — `[spec D-5]`, `[spec D-10]`,
`[spec D-14]`, `[spec D-17]`, the §9.2 ladder. There is no ceiling-scaling row
and no derivation. And FR-A3 requires 'a per-session injected-token budget —
**hard caps**'. A ceiling that grows with fan-out is not a cap. Which number
bounds a six-way fan-out's total injected tokens, and where does it come from?"*

**COLLAPSES.** Class: **decision-hiding** — the tell again: *a citation that
lands on a component name (`tuning`) rather than a computation with named
inputs.*

**Why hollow.** Round 2's C4 was that arrival order decided which agent got
helped. The fix names four properties (reserve, reclaim, scale, preempt) and
supplies zero numbers and one function that does not exist — while quietly
converting the spec's hard cap into an unbounded one. An implementer must invent
the allocator, which is the "hard part relocated into an unspecified
deterministic step" pattern the collapse log warns about, now in its third
consecutive round.

**Fix.** State the function and its bound in D15 and add both rows to D23's
shipped-defaults list with derivations:
`session_ceiling = min(hard_session_cap, base_alloc + per_consumer_floor × active_consumers)`
where `hard_session_cap` is FR-A3's number ([spec D-10], 2,000) and
`per_consumer_floor` is derived **from** the cap (e.g. `hard_session_cap / expected_max_consumers`),
not independently of it. AC-21a's six-consumer fixture then asserts **both** that
the hard cap holds and that every consumer with an above-bar candidate is served
— jointly satisfiable only if the floor is derived from the cap, which is the
point.

---

### C15 — D10 9b vs. FR-L7 · uptake is defined only for file-subject genres; four genres have no detector, and a requirement consumes what does not exist

**Question.** *"9b's fix names the producer — the distiller — and the rule: 'the
whisper's **subject** being subsequently edited, tested, or referenced by any
route counts.' Name the edit, test, or reference that constitutes uptake of an
`Unknown` whisper ('nothing here determines which screen this belongs on'), a
`Process` whisper, an `Answer-drift` whisper, or an `Answer`. FR-L7 requires
'conduct-genre efficacy' learned to the global store, and 9b(iii) requires
`status` to report hit rate **'with its detection method named.'** What method
is named for these four? And since §9.2's ladder consumes hit rate per genre,
what happens when four genres report a structural 0%?"*

**COLLAPSES.** Class: **decision-hiding** + **wrong-check**.

**Why hollow.** 9b's own argument is that a badly-chosen uptake proxy scores the
tool's best outcome as a failure and can retire a working genre. The fix
corrected the proxy for the genres whose subject is a file and left four genres
— including both owner-added conduct genres — with **no** proxy, feeding a
number into the ladder and into FR-L7. A structural 0% is worse than the proxy
9b replaced.

**Fix.** Define an uptake predicate per genre in the same retrieval-source table
(C8's fix):
- `Unknown` → the named gap appears in a later user turn or is recorded as a
  `human_fact`.
- `Process` → the required activity is subsequently observed for that consumer,
  or the completion claim is retracted.
- `Answer-drift` → the open question transitions to `resolved` (C11's predicate).
- `Answer` → the pointed subject is read, or the question is not re-asked.
- Where no honest predicate exists, `status` renders **"no uptake detector — hit
  rate not measured"** and the §9.2 ladder **excludes** the genre, rather than
  reading an unmeasured 0% as noise.

---

## Part 3 — Partials (real, below collapse threshold)

**P1 — D12 A0 vs. FR-S3.** A discovery Answer costs two sequential model calls
(A0 shaping, then Move A/B) at ≈10.5 s each, plus the one-boundary reading lag.
FR-S3 fixes the contract as "answered at the next injection opportunity, best
effort." D14's C9 note identifies the second call as a lag contributor and makes
delivery lag a measured quantity — good — but never notices that it puts the
design in conflict with a spec sentence. *Fix:* state the Answer genre's
delivery contract honestly ("the first opportunity after judgment completes —
typically two or more boundaries for discovery intents") and route the FR-S3
wording to the spec for amendment, or drop A0 for Answer and accept the
retrieval cap. Do not leave a spec sentence the architecture cannot meet.

**P2 — FR-A5 floor applicability (D10 step 5 vs. AC-5).** FR-A5 qualifies the
warn-grade co-change floors with "History-backed genres additionally respect
evidence floors"; D10 step 5 restates the floors against "warn-grade" without
the qualifier. The generated-file warning is warn-grade and has no co-change
support number, so an implementer following D10 blocks AC-5, a Phase 0 exit.
*Fix:* one sentence in D10 step 5 — evidence floors apply to history-backed
candidates; mechanically-evidenced warnings (zone classification) clear the
floor by objective evidence per FR-J1's mechanical-bypass clause, and are held
instead to the FR-D3 evidence-and-false-fire-clause format.

**P3 — Orientation enrichment vs. FR-A4's decay.** D10 step 4 lists
"orientation-enrichment" as a Lane 2 output, but FR-A4 decays orientation
candidates "once the agent is deep in the task" and Lane 2 costs ≈10.5 s plus
queue time from a trigger that fires at prompt submission. No decision states
whether enriched orientation can ever arrive before its own decay rule retires
it. *Fix:* state the orientation expiry in events explicitly in D10 step 7's
`expiry_events` default, and let C13's `genre_never_survives` check measure it.

---

## Pattern this session

Round 1's shape was *reduction at the model's role*; round 2's was *the hard part
relocated into an unspecified deterministic step*; round 3's was *the hard part
is a named noun with no producer.* **This round the shape moved once more: the
fixes themselves became the defect surface.** Four of the fifteen collapses
(C6, C7, C8, C9) sit **inside round 2's own repairs** — a fact class whose
`prov_kind` the schema forbids, an absence claim fitted with a presence pointer
the previous round had already got right, a table built and never added to the
one retrieval list that decides what the model sees, and two tables dropped by
default into the write class the previous round had just emptied for exactly
this reason. Three more (C1, C2, C3) sit inside round 2's *other* repair, the
`self_serve_cost` term: it was given a formula, a range, worked values and a
fixture, and its input is a five-value enum that provably cannot discriminate
its own examples, its strongest clause needs data D8 deliberately drops, and the
mode that will actually run first deletes it. **A repair is written as a local
patch and reviewed as a local patch, and every repair creates new joints —
which is precisely where the next round's collapses will be.** The countermeasure
is not more care: it is that **a fix must be traversed, not inspected.** Any
change that adds a fact class, a table, a factor, or a genre must be walked
through all nine joints (trigger → retrieval → grounding → bar → budget →
assembly → delivery → audit → learning) before it is called applied, and the
walk written down.

The second, sharper lesson is about **what never got contested.** C4 — the
freshest owner decision, OWNER-12, whose four named bounds have zero mechanisms
in this document — was written into the *spec* on 2026-07-30 and the architecture
was revised the same day, applying that round's `SessionEnd` and `StopFailure`
findings while leaving the continuation controls untouched. The document itself
diagnosed this pattern one paragraph earlier — *"the omission was selective
rather than systemic — which is why a global-deadline reading passed review
twice"* — and then repeated it on the more important half of the same event.
**A requirement that arrives between rounds inherits no reviewer.** Every future
round must begin by diffing the spec since the architecture's last revision and
traversing each new or amended requirement end to end, before attacking anything
the previous round touched.

Third, and the reason twelve of the fifteen findings exist at all: **there is no
artifact in this document where a genre's whole pipeline is visible in one
place.** The genres are a list in the spec; their triggers are prose in D10, their
retrieval sources are a prose enumeration in D12, their fact classes are prose in
5a, their write durability is two prose lists in D24, their delivery bounds are
absent, their uptake predicates are one sentence in 9b. No reviewer reading any
single decision can see that Steering has no deliverable content, that
Verification is ≈0.15, that Process's fact cannot be inserted, or that four
genres have no uptake detector — because no decision owns a genre. **The single
highest-value fix in this report is the one that appears in five of the findings:
a per-genre table in D10 with a row per genre and a column per joint** (trigger
event · store table(s) · retrieval path · `self_serve_class` · grounding pointer
shape · write durability class · delivery-cost class · uptake predicate ·
health counters). A blank cell is then a build-time error rather than a
collapse-hunt finding two rounds later.
