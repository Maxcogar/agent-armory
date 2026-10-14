# Spec: Context Oracle (`ctxoracle`) — v1

**Status:** spec of record for the whole tool (phases A/B/C are build order, §11.5);
**signed off by Max Cogar 2026-08-28 without a line-by-line read (`OL-C6` — "good to go")**.
The blocking model's 2026-08-25 review (`docs/reviews/2026-08-25-blocking-model-rebuild-6-rounds.md`)
covered the superseded "goes off writing code" model (`OL-R5`); the model rebuilt on `OL-C5` on
2026-08-28 was reviewed in the 2026-09-29 spec audit (`docs/reviews/2026-09-29-spec-audit-*.md`).
Every requirement traces to a CONFIRMED owner decision (`OWNER-LEDGER.md`), a named and
current-verified standard, or a recorded judgment (§12).

**Provenance keys.** `[OL-n]` / `[OL-Cn]` = a CONFIRMED owner decision in
`OWNER-LEDGER.md`; `[OL-Rn]` = a REJECTED false attribution there. `[D-n]` = a
judgment made while writing this spec (reasoning in §12). Standard keys resolve in
§9. Every external source in §9 was verified against its current primary/authoritative
source; the §9 "Verified" column records the date each was confirmed.

**What this document is.** It defines *what* the oracle must do and the properties
it must hold. Component boundaries, storage engines, IPC, algorithms, and the exact
numeric form of any threshold are the architect's, except where a constraint is
itself a requirement (§8). Requirement IDs are stable mnemonics `[D-23]`.

---

## 1. Problem and mission

Coding agents under-read the codebase, misjudge when their context is sufficient,
and fill the gaps with plausible inventions. The knowledge that would prevent this —
which files change together, which edits have historically broken which tests, the
non-local convention, the second write-site, the landmine — is discoverable only
from history and structure the agent does not consult at the moment it decides.
Front-loaded "briefing" approaches pay their full token cost regardless of what
fraction is needed and decay in salience as the session grows: a model's recall of material
in its context degrades as the context grows `[CTX-ROT]`.

**Mission (verbatim, the anchor for every requirement):**

> Deliver the fact that would change the agent's next decision, at the moment of
> that decision, without being asked.

The Context Oracle is a passive, per-repository intelligence whose stores live outside
the repository tree `[OL-6]`. It observes a
Claude Code session through lifecycle hooks and, at decision moments, injects a
small **whisper** — one fact, with a verifiable pointer — when it knows something
the agent almost certainly does not and that would change what it does next. It is
**advisory by default** (a whisper the agent may ignore) and **never mutates the
repository** except the hook wiring `ctxoracle init` installs and `deinit` removes `[D-9]`
(the no-in-tree-write property).

Alongside that mission, the oracle carries a **second, owner-set objective**: it **blocks
in exactly the two cases Max Cogar confirmed** (§2.1, §4, §8) — to make an agent answer a
question it is ignoring `[OL-C3]`, and to stop an agent that will not follow his expert
dev-tool skills `[OL-C2]`. A block delivers an **instruction** — how to get unblocked — and
stands beside the mission as a confirmed owner requirement (§8). It is always reactive, never
a *pre-emptive* gate (a "prove your plan / pass a test before you may proceed" checkpoint),
which Max rejected `[OL-C2]`.

**For whom.** A single developer (Max Cogar) working solo across his own
repositories, driving agents through Claude Code `[OL-6, OL-11]`. Not a team tool; no
sharing surface in v1. The tool must operate on repositories with **thin commit history**
(new repos, shallow clones) as a design condition — its behaviour there is bounded by the
evidentiary corpus floor `[D-7, D-8]`, not by any claim about which repositories are
typical.

**Why it is worth building.** The scarce, valuable knowledge is what the agent does not
have and does not consult at the moment it decides: co-change coupling that is
"undetectable by program analysis" `[ROSE]`, the historical landmine, the second write-site.
Delivering it inside the agent's workflow at the decision point, and nowhere else, is what
gets it used: developer tools that made users leave their workflow, or showed results too
late or too early, fell out of use `[TRICORDER]`.

---

## 2. Scope

### 2.1 In scope (v1)

- A CLI, `ctxoracle`, and the hook shims that wire it into a Claude Code session
  `[OL-1]`.
- Passive observation of the session, and delivery of whispers as injected context,
  to the **main agent and to subagents** `[OL-8]`.
- The whisper **genres** of §4, delivered under the relevance machinery of §5.
- **Blocking in the two confirmed cases**, each landing reactively on the agent's deviating
  move — a `PreToolUse` deny of a deviating tool action, or a `Stop` block of a turn that ends
  in deviation (§8):
  - **Answer-drift block `[OL-C3, OL-C5]`:** Max's rule (OL-C5): after Max asks a question, the
    agent's next move must be a **direct answer** or **an action taken to provide that answer**; if
    it is neither, the oracle blocks that move until the agent answers. A non-answer-directed tool
    action is denied at `PreToolUse` (`permissionDecision: "deny"`, reason "answer Max's question
    first: `<q>`"). A turn that ends with the question still unanswered is blocked at `Stop`: the
    stop is prevented and the turn continues with the same reason (a `Stop` continuation,
    `decision: "block"` or `hookSpecificOutput.additionalContext`, the architect's choice). The
    `Stop` block is re-evaluated at every `Stop` and re-applies while the question stays open; it
    releases as soon as the agent's text answers it. Its outer bound is the harness's
    consecutive-continuation cap, which the oracle never raises `[HOOKS]`; each repeat feeds the
    deny-loop signal (FR-M4), and a cap-hit with the question still open is a self-detected fault
    (FR-M2) shown in `status`. Whether the question is answered is judged on all assistant text
    since the question — the final message from `last_assistant_message`, earlier messages from the
    oracle's record of assistant text or the transcript (which may lag) — with FR-B5's
    clear-on-a-substantive-answer posture; text not yet visible is the lag window, where the block
    holds (FR-B1, D-41). Actions taken to provide the answer (reading, searching, running a
    test/build to get the answer) run freely. OL-C3 confirms the block (*"block that motherfucker
    until it stops ignoring me and actually answers. just dont make a convoluted fucked up way that
    its done."*); OL-C5 is its definition.
  - **Skill non-conformance, steer-then-block `[OL-C2]`:** the oracle knows the
    structure of Max's expert dev-tool skills; when the agent deviates it **steers**
    first, and **blocks** when the agent skips a step without a stated reason, or when
    steering is not working. The block lands on the deviating move the same way: a tool action
    that skips a due step is denied at `PreToolUse`, and a turn that ends with a due step skipped,
    under the same conditions, is blocked at `Stop`, re-applied and bounded as the answer-drift
    `Stop` block is. (His words: *"IF THE AGENTS ARENT FOLLOWING MY SKILLS,
    THEN THAT SHIT NEEDS TO BE BLOCKED AT SOME POINT… IF THEY CANT PROVIDE A REASON
    FOR SKIPPING A STEP… OR STEERING ISNT WORKING, THEN THEY SHOULD BE FUCKING
    BLOCKED."*) This feature is **small, personal, and explicitly non-primary**
    `[OL-C2]`.
- Two persistent **stores** — per-project and per-user-global — both **outside** the
  repository tree `[OL-6]`, and both surviving the end of the session that wrote them,
  including a Claude Code cloud session `[OL-C12]`: a cloud session runs in a fresh VM started
  from a fresh clone of the repository, and that VM is reclaimed after inactivity, so state
  kept only on the VM does not reach the next session `[CC-CLOUD]`.
- A history **miner** and structural **indexer** that populate the stores.
- **Model-in-the-loop judgment** for the genres that need it, via the host CLI's own
  model access, with a **deterministic degraded mode** when the model path is
  unavailable `[OL-2, OL-7]`.
- **Self-observability**: the oracle detects, logs, and surfaces its own failures, and
  announces correct silence so it is not mistaken for a broken tool `[OL-10]`.
- A **completion-claim** capability: the oracle speaks when an agent claims it is done,
  to catch a completion claim the work does not back `[OL-12]` (§4 FR-A2g, FR-A2m).

### 2.2 Out of scope (v1), each with its reason

- **The pre-emptive gate** — making the agent pass a test, or prove its plan is good
  enough, *before* it is allowed to proceed. Permanently out; Max rejected it
  explicitly (*"making the working agent take a goddamn tests to see if it had a good
  enough plan to proceed. literally every bit if it was terrible and didnt work"* —
  OL-C2 verbatim) `[OL-C2]`. Blocking *is* in
  scope, but only reactively in the §2.1 cases — never as a checkpoint up front.
- **The generated-file block** — blocking a hand-edit of a provably-generated /
  build-output file. Permanently out; it was an agent fixation Max never asked for and
  it was struck from `RETHINK.md` `[OL-R4]`.
- **Separate credentials of any kind** `[OL-7]`. Permanent.
- **Writes inside the repository tree**, except the hook wiring `ctxoracle init`
  installs and `deinit` removes `[D-9]`.
- **Team features** — sharing with other users, multi-user access control `[OL-6]`.

### 2.3 Explicit N/A

- **User-facing UI / web surface:** N/A — the interface is injected context plus a
  terminal CLI for the owner's own inspection.
- **Authentication / multi-tenant access control:** N/A — solo, single-user
  `[OL-6]`; the only trust boundaries are the security ones in §7.

---

## 3. Product principles

- **P1 — Silence is the default**, yielding the moment the oracle knows a
  decision-changing fact the agent lacks (`RETHINK.md` §5). A starting posture, never
  a target it has to hit.
- **P2 — Advisory by default; blocking only reactively, in the confirmed cases.** Most
  interventions are whispers the agent may ignore; ignored advice is de-noised
  empirically (P7), not gated. Blocking exists only for answer-drift and skill
  non-conformance (§2.1), and never as a *pre-emptive* gate `[OL-3, OL-C2, OL-C3, D-2]`.
- **P3 — Zero ceremony for the agent** (`RETHINK.md` §6): no required ritual, no format
  tax, no "pass a test to proceed."
- **P4 — Provenance on everything** (`RETHINK.md` §4).
- **P5 — Marginal value decides worth.** The oracle speaks a fact only when that consumer
  does not already have it — it is not in the consumer's read-set or delivered-set (FR-A4)
  and is not evident from what is in front of it (the result of its own triggering action, a
  name-evident pairing such as a same-directory, same-name file) — and it would change the
  consumer's next decision (FR-A1). Whether one search would return the fact is not the test:
  a search is cheap only for an agent that already knows what to search for.
- **P6 — Right fact, right moment** (`RETHINK.md` §2.4).
- **P7 — The tool learns in both directions.** Measured false-firers are demoted *and*
  demoted channels are re-explored and re-promoted on measured value; the loop must not
  converge to silence (§11, `[D-25]`).
- **P8 — The repository tree stays pristine** except the hook wiring an explicit `init`
  installs and `deinit` removes `[D-9]`.
- **P9 — No feature is primary:** relevance is per fact, by decision impact, not by genre
  (mission; OL-12 row). The corrective/skill feature is, in Max Cogar's words, *"JUST A SMALL
  FEATURE FOR MY OWN PERSONAL BENEFIT"* and *"NOT THE PRINARY ROLE OF THE ORACLE"*; in his
  earlier 3 or 4 attempts *"the agents kept putting way too much focus on that parts and got
  absolutely fucking obsessed with "gates""* `[OL-C2]`. What he did not want was *"the fact that when I
  state something that I would like to have in it, they then rearrange everything to make that
  the one single purpose of the entire tool"* `[OL-C9]`.

---

## 4. What the oracle says (and, in two cases, blocks)

Each **whisper** genre is keyed to an observed intent signal and, per P5, is **headlined by the
fact that consumer does not already have and that would change its next decision**. No genre is
primary (P9). The oracle pushes each whisper unrequested (mission: "without being asked"); a
whisper is a recommendation in the RSSE sense — an information item estimated to be valuable for
the task in its context — delivered so the agent can notice it, judge it and act on it `[RSSE]`.
**Two rows in this table — FR-A2k and FR-A2l — are not
whispers: they are the two enforcement *blocks* (defined in §8). They deliver an instruction, not a
fact.** They are listed here because they fire on the same observed signals; everything else in the
table is an advisory whisper.

| Genre | Fires on | The decision-changing fact / action |
|---|---|---|
| **FR-A2a Orientation** | Prompt submitted | The structural entry-point files for the task and the invariants that will bind, each clearing the bar (FR-A5). Task-shape landmines are NOT delivered here — they belong at the edit (FR-A2e) `[D-26]`. |
| **FR-A2b Coupling** | A file is read / searched | Co-change partners of that file, with the evidence ratio and a history pointer. |
| **FR-A2c Reuse** | A search / read for functionality | The non-obvious usage fact: "the canonical helper is `X`; **most call sites use it**" — the convention, not bare existence. |
| **FR-A2d Consequence** | An edit / write | The non-obvious blast radius: **historically-coupled tests** this edit tends to break, and a vendored/build-**zone** flag, reaching the agent with the edit's result, at its next decision (keep, revise, run the coupled tests) `[HOOKS, OL-C15]`; the carrying event, and the handling of a denied edit, are the architect's (FR-O1). (A raw call-site count never stands alone as the whisper: by itself it does not change the next decision (P5, FR-A1); the headline is the coupled tests.) |
| **FR-A2e Warning ⚠** | An edit in a landmine zone | A history- or invariant-derived hazard (e.g. a file whose edits have broken a specific test), **flagged with its confidence** (§5), reaching the agent with the edit's result, at its next decision, as FR-A2d `[HOOKS, OL-C15]`. Advisory. |
| **FR-A2f Completeness** | A recognized completion-claim stop (FR-B4) | "You changed the reducer but not the selector it pairs with in 9 of its last 10 changes." |
| **FR-A2g Verification / completion check** | A recognized completion-claim stop | The fact the agent lacks at "done": **which test covers the changed region** — headlined by that covering-test *mapping*, with the observation that it has not been run against this change. The mapping is the non-trivial part; the agent already holds its own run-state (whether it ran the test), so per P5 run-state alone never stands as the whisper. (The completion-claim **recognizer** reads `last_assistant_message` `[HOOKS]` and classifies done-claim vs ordinary stop — a classification with false-fire/miss modes that **errs toward firing** when a covering test exists and was not run: a false fire costs one Stop-time continuation carrying a true fact (FR-B4), while a miss lets an unverified done-claim pass, the failure OL-12 requires the oracle to catch. Its false-fire rate is recorded and reported (FR-M1, FR-M4); automated demotion is Phase C (P7). Whether it is a deterministic heuristic (Phase A) or model-assisted (Phase B) is the architect's `[D-38]`.) **Limit:** catches *unverified* (a covering test exists and was not run); the general "did not finish" case (OL-12) is model-dependent and is a tracked Phase-B requirement (FR-A2m), not this one `[OL-12, D-27]`. |
| **FR-A2h Assumption check** | Agent narration | "Your narration assumes X; the repo says Y at `file:line`." (Model-dependent — Phase B.) |
| **FR-A2i Steering (whisper)** | Agent narration | "What you're describing lives in `src/…`, not where you're looking." (Model-dependent — Phase B.) |
| **FR-A2j Answer** | A repo-answerable question in narration | The repo-grounded answer with a pointer. (Model-dependent — Phase B.) |
| **FR-A2m Unfinished-work check** | A completion-claim stop | OL-12's concrete case — the agent claimed done but **did not finish the work**, beyond the unrun-test case FR-A2g catches. "Incomplete" is judged **relative to a named scope referent** — the user's prompt, an approved plan, or (when an expert skill is active) that skill's declared steps — never "the model decides done" with no anchor (that would be the unconstrained judge FR-C2 forbids). Where the referent is an active skill's steps, this overlaps FR-A2k (which *blocks* on a skipped step); FR-A2m is the *advisory* whisper at the done-claim, FR-A2k the enforcement mid-skill — same signal, different surface. Model-dependent — **Phase B**, acceptance authored there. It realises OL-12's core need as a tracked Phase-B requirement `[OL-12, D-27]`. |
| **FR-A2k Process conformance → BLOCK** | An expert skill is active and an action deviates from its steps | Whether the agent's actions match the skill's steps. **Steers first** (advisory whisper); **escalates to a block** when the agent skips a step without a stated reason, or steering isn't working `[OL-C2]`: a deviating tool action is denied at `PreToolUse`, and a turn that ends with a due step skipped is blocked at `Stop` (§8, §11.4). Errs toward restraint (a wrongful mid-skill halt is disruptive), so its under-fire side carries an **automated missed-skill-block detector** `[OL-C9]` that checks each step directly by the evidence that step itself requires, not by re-classifying the agent's actions (FR-B5, FR-C1, FR-C4): checking whether an agent followed a skill step is verification, which OL-11 assigns to the agents, so a skipped step must be caught without relying on Max Cogar to notice it. **Non-primary** — fires sparingly and holds no precedence over any genre (OL-C2, P9); block-precision still gets full investment (FR-B5, §11.4). |
| **FR-A2l Answer-drift → BLOCK** | Max asked a question and the agent's next move is **not** a direct answer or an action taken to provide the answer `[OL-C5]` | **Blocks that move** until the agent answers: a non-answer-directed tool action is denied (`PreToolUse`), and a turn that ends with the question unanswered is blocked from stopping (a `Stop` continuation, its form the architect's), each with "answer Max's question first"; the `Stop` block re-applies while the question stays open, is bounded by the harness continuation cap, and judges all assistant text since the question (§8, FR-B1). Actions taken to provide the answer (reading, searching, running a test/build to get the answer) run freely `[OL-C3, OL-C5]` (§8, FR-B1). Entered scope *advisory* under OL-9; OL-C3 (2026-08-16) superseded that and made it a block, OL-C5 (2026-08-25) defines it — authorised by OL-C3/OL-C5, not OL-9. |

- **FR-A1 — The single internal question.** Per event the oracle asks: *given what the
  agent is doing now, do I know something it almost certainly does not that would
  change what it does next?* Default: no → silence, yielding to a known
  decision-changing fact (P1) (`RETHINK.md` §5).
- **FR-A2 — Genre set.** The oracle produces the genres above. Model-free vs
  model-dependent, and therefore build phase, is fixed in §11.
- **FR-D1 — Whisper form.** One topic, a few sentences,
  the `[oracle]` prefix and its genre, **its confidence stated whenever not high**, and
  **at least one verifiable pointer** `[JOHNSON, P4]`. An uncheckable whisper is a rumor
  and is not emitted. The confidence flag is how the tool speaks an
  uncertain-but-important fact rather than suppressing it (§5.2, `[OL-C4]`).
- **FR-D2 — Whispers are informative, never imperative** `[HOOKS]`: injected context is
  written "as factual statements rather than imperative system instructions", because text
  framed as out-of-band system commands "can trigger Claude's prompt-injection defenses".
  (Blocks, where they occur, are a separate mechanism — §8 — not an imperative whisper.)
- **FR-D3 — Warnings state their evidence** (support/confidence or call-site counts),
  never a bare assertion `[JOHNSON]`.
- **FR-D4 — The ⚠ subtype may be wrong, and says so.** Declarative; records that it may
  be a false fire; corrections captured via the CLI feed the learning loop (§11) — the
  empirical de-noiser `[D-4]`.
- **FR-D5 — Whispers are deduplicated** per consumer against what that consumer has been
  told or has visibly incorporated (FR-A4).

---

## 5. When the oracle speaks — relevance, and the quality bar

One decision procedure for whether to speak, in two parts. (The two *block* cases are
separate — §8 — and are triggered by their own conditions, not by this bar.)

### 5.1 Relevance comes from the moment (the trigger)

Relevance to the agent's next decision is established by *when* a candidate fires, not
by a score. Each genre is bound to the intent signal that reveals what the agent is
deciding now — the file it opened, the symbol it searched, the edit it has just attempted
(its whisper arrives with the edit's result `[OL-C15]`), the completion it claimed (§4). This is where the agent's intent enters the machinery:
`decision-impact` (§5.2) carries no intent term *because intent is carried here, by the
trigger* `[D-18]`. A fact about a file the agent is not touching does not fire.

- **FR-O1 — Observed events** via the Claude Code hooks contract `[HOOKS]`; the
  event-to-genre mapping and which of the hook events the current contract defines are
  wired is architecture; delivery-capable events are constrained by C-4/FR-O2.
- **FR-O5 — Task-boundary intervention only; no idle timers.** The oracle speaks only on a
  lifecycle event of the agent's own work, where a decision is being made (mission: "at the
  moment of that decision"); it never wakes an idle session, although the harness would allow
  it (`asyncRewake`) `[HOOKS]`.
- **FR-O6 — Per-consumer delivery**, keyed by `session_id` and `agent_id` (no `agent_id` ⇒
  that session's main agent); `agent_type` is descriptive only `[HOOKS, OL-8, D-16]`. FR-A4's
  `resume`/`fork` reconciliation carries a consumer's sets across session ids.
- **FR-A4 — Never repeat.** A per-consumer **delivered-set** and **read-set**,
  reconciled across `resume`/`fork` (reseed) / `compact` (both sets then hold only what
  that consumer's compacted context still carries — the compaction summary and the files
  Claude Code re-reads — so a fact the summary dropped can be delivered again) /
  `clear`/`startup` (clean) `[HOOKS, CC-CONTEXT, D-20]`.

### 5.2 The quality bar — which real candidates are worth the sentence

Among candidates the trigger has made relevant, the bar decides which are *worth
saying* — a **quality/marginal-value filter, not a relevance oracle** `[D-6bar]`.

- **FR-A5 — The bar (a conjunction, not a fixed formula).** A candidate is spoken when
  it is **jointly** (a) backed by real evidence (**confidence**), (b) materially
  consequential to the code being touched (**decision-impact**, deterministic from
  per-candidate properties — edit-vs-read, blast radius, zone — carrying **no genre
  term** `[D-18, P9]`), and (c) **not already held by that consumer or evident from what
  is in front of it** (**marginal value** `[P5]`, FR-A4).
  None laundered by another being high. **No *volume, count, or budget* limit suppresses a
  candidate that clears the bar — the bar, not an arbitrary cap, is what decides worth
  `[OL-C1]`.** (Per-consumer dedup — FR-A4, FR-D5 — still applies: a candidate already
  delivered to, or visibly incorporated by, that consumer is not repeated. Dedup enforces the
  never-repeat property.) The numeric combinator is the
  architect's `[D-6bar]`.
- **FR-A5a — Uncertain hazards are spoken, with their confidence flagged `[OL-C4]`.** The
  warning/hazard genres fire without requiring high confidence; a real but uncertain hazard
  is **delivered with its confidence flagged** (FR-D1). The only floor is a **noise floor**
  (real vs coincidental evidence). Precision is managed empirically by the learning loop
  (§11, P7) `[OL-C4, D-28]`.
- **FR-A6 — Corpus (evidentiary) floor only.** Below a minimum history corpus,
  history-derived genres stay silent (too little signal to mine) — evidentiary, feeding
  the confidence term. **No first-N-sessions / adoption window** (that would be the
  arbitrary limit `[OL-C1]` bans) `[D-7, D-8]`. On a thin-history repo the history genres
  are thinner; the structural, reuse, conformance and answer-drift behaviours, and
  Consequence's zone flag, still operate; Consequence's coupled-tests headline is
  history-derived and thins with the corpus.
- **The bar is calibrated.** It is adjusted against measured false-fire and value. Phase A's
  calibration inputs are the agents' review of the whispers logged on Phase A's runs, which run
  on Max Cogar's real projects in his real sessions `[OL-C13]`, including the real-repository
  exit run (§11.5; verification is the agents', OL-11), the seeded-fact run (AC-18) and the
  regret proxy (FR-L4); a human CLI correction (FR-D4/FR-L6) outranks them when given. The
  initial operating point is the architect's, recorded with its reason, and reset from Phase A
  data; automated demotion/promotion is Phase C `[D-6bar]`.

---

## 6. The oracle must watch itself — self-observability

`[OL-10]`. The owner is a non-programmer and cannot catch a silent failure.

- **FR-M1 — Diagnostic log** per event: candidates, bar outcome, what was delivered,
  any block raised, latency.
- **FR-M2 — Self-detected failure classes**: hooks not firing, latency breaches, store
  corruption, index staleness, model path down, whispers produced-but-undelivered, **a fail-open
  event** (FR-O3: a shim/service error, timeout or missing store silenced the oracle for an event,
  and on a block path the block was off for that event), **a deny that outlives its condition**
  (the oracle keeps denying an action, or keeps blocking the stop, after the agent has actually
  answered / followed the step, including a lag-window hold on text later classified as an answer,
  recorded with its duration as a wrongful hold, D-41 — it must never permanently block a
  complying agent), **a `Stop`
  block released by the harness's continuation cap with its condition still open** (§8, FR-B1),
  and **a missed skill-block** (per FR-C4: a skill step was due, the **evidence that step
  requires is absent**, and no block fired — checked against the oracle's own hook record and
  store/repo state, not by re-classifying the agent's actions, so it catches the
  misclassified-as-done miss without relying on Max Cogar to notice it, since verification is the
  agents' job (OL-11); a step that requires no evidence at all is a flaw in that skill, raised to
  Max Cogar for that step when the skill's structure is encoded (FR-C1)).
- **FR-M3 — Correct silence is announced — owner-facing only** `[D-22]`. The announcement
  goes to the diagnostics/log/`status` surface the owner reads (so working-silence is not
  mistaken for a broken tool, `[OL-10]`); it is **never injected into the agent's context**,
  which would re-noise the channel P1/P3 keep clean.
- **FR-M4 — `ctxoracle status`** — plain-language health, whisper count, per-genre
  volume, false-fire rate, **the regret rate — labelled "held-but-unspoken only" and paired
  with the last seeded-fact coverage result (AC-18), or "coverage not measured live"** so a
  low regret rate is never read as "nothing missed" (FR-L4), **denies issued, the wrongful-deny
  rate, and the missed-skill-block rate** (so both an over-firing and an under-firing
  block-recognizer are visible — the latter because catching a skipped skill step is
  verification, the agents' job (OL-11), not something left to Max Cogar to notice, FR-B5), **done-claims reached with an outstanding Max question** (so the "Max re-asks" recourse
  for an uncaught answer-drift case is actually reachable — FR-B4), a **deny-loop signal** (an agent
  stuck retrying variants around a correct deny rather than complying — the measured check on FR-B2's
  designed-for "the model answers instead of retrying"), and any active suppressing condition
  `[OL-10]`.
- **FR-M5 — `ctxoracle log`** — the whisper/block audit trail read back per session
  `[OL-10, FR-X6, D-21b]`.

---

## 7. Threat model and security

The oracle reads repository history and injects text an agent acts on; that is the
attack surface. The model precedes the requirements.

### 7.1 Threats

- **T1 — Indirect prompt injection.** Repo content read as an instruction when surfaced
  `[LLM01, OWASP-PI]`.
- **T2 — Store poisoning.** Crafted history / tampered store injects false facts
  `[ASI06]`.
- **T3 — Secret disclosure.** History/files contain secrets the oracle could surface
  `[LLM02, OWASP-SM]`.
- **T4 — Over-privilege.** The oracle holds more access than it needs `[LLM01]`.

### 7.2 Security requirements (each tied to a threat)

- **FR-X1 — Secret redaction (T3)** before any content enters a whisper, store, or log.
- **FR-X2 — Repo text is data, not instruction (T1)** — pointer by default; verbatim
  quotation only for mechanically-generated content `[LLM01, OWASP-PI]`.
- **FR-X3 — Injection-suspect content is pointer-only (T1)**.
- **FR-X4 — Trust origin preserved (T2)** — a trust label rides every fact; low trust
  lowers confidence and cannot be laundered `[ASI06]`.
- **FR-X5 — Least privilege (T4)** — **no credentials of its own** `[OL-7]`; the only
  network use is the host CLI piggyback (§10); no repo-tree write except the hook wiring
  `init` installs and `deinit` removes `[D-9]`.
- **FR-X6 — Whisper/block audit trail (T2, T3)** — every whisper and every block
  recorded with evidence and pointer, readable via `ctxoracle log`.
- **FR-X7 — Locality (T3, T4)** — stores outside the repo tree; no outbound telemetry
  `[OL-6]`.
- **FR-X8 — Adversarial fixtures** carry injection payloads and planted secrets (§14).

---

## 8. How the oracle blocks — and what stays structurally impossible

The oracle blocks in **exactly two cases**, both confirmed by Max Cogar: answer-drift
`[OL-C3, OL-C5]` and skill non-conformance `[OL-C2]`. Blocking is a **second owner-set objective**,
separate from the mission. The mission delivers a decision-changing *codebase fact*; a block instead
delivers an **instruction** — how to get unblocked:

- **Answer-drift block** — enforce that a question Max asks is answered before the agent moves on
  `[OL-C3, OL-C5]`.
- **Skill-non-conformance block** — enforce that an agent using Max's expert skills follows their
  steps, blocking when it skips a step without a stated reason or when steering is not working
  `[OL-C2, OL-C10]`.

Adding any third block is an owner decision for Max, not one the spec or the architect may derive.
Each block here stands on a verbatim CONFIRMED `OWNER-LEDGER.md` entry (`[OL-C2]`, `[OL-C3]`,
`[OL-C5]`), never on paraphrase or inference.

**The mechanism (verified against the Claude Code hooks reference, fetched 2026-10-14).** The
situation a block handles is: the user asks a question (or a skill step is due) and the agent,
instead of answering / following it, makes a **deviating move** — for answer-drift, a next move
that is neither a direct answer nor an action to provide the answer (OL-C5, FR-B1); for skill
non-conformance, a move that skips a due step. The block lands on that move. A deviating **tool
action** is caught by a `PreToolUse` hook, which fires after the agent has formed the action but
*before* it runs and returns `hookSpecificOutput.permissionDecision: "deny"` with a reason shown
to the agent: the oracle denies the deviating action and tells the agent what to do to proceed.
The other deviating move — **ending the turn** with Max's question unanswered, or with a due skill
step skipped (FR-B1) — is caught at `Stop`: the hook prevents the stop and continues the turn with
the same reason ("answer Max's question first: `<q>`", or the skipped step). The continuation form
(`decision: "block"` with `reason`, or `hookSpecificOutput.additionalContext`; both continue the
turn under the same loop protections) is the architect's. The `Stop` block is re-evaluated at
every `Stop` and re-applies while its condition stays open; it releases as soon as the condition
clears. `stop_hook_active` marks a repeat and feeds the deny-loop signal (FR-M4); the outer bound
is the harness's consecutive-continuation cap (8 by default), which the oracle never raises, and a
cap release with the condition still open is a self-detected fault (FR-M2). `Stop` does not run on
a user interrupt. Whether the question is answered is judged on all assistant text since the
question — the final message from `last_assistant_message`, earlier messages from the oracle's
own record of assistant text or from the transcript, which may lag — with FR-B5's posture; text
not yet visible is FR-B1's lag window, where the block holds. When the condition clears (the
agent answers / follows the step / gives a reason that clears it under FR-B1), its next move is
simply allowed; the block keeps no counter and no state beyond the open condition.

- **FR-B1 — Reactive blocking exists in exactly the two confirmed cases** `[OL-C2, OL-C3]`,
  each realised on the **deviating move** (§8) — a `PreToolUse` deny of a deviating tool action,
  or a `Stop` block of a turn that ends in deviation:
  - **Answer-drift (FR-A2l) `[OL-C3, OL-C5]`.** **The rule, in Max's confirmed words (OL-C5):**
    *after Max asks a question, the agent's next move must be a **direct answer** or **an action
    taken to provide that answer**; if it is neither, the agent is corrected.* Realised on the
    deviating move (§8): a non-answer-directed tool action gets a `PreToolUse` **deny**, reason
    *"answer Max's question first: `<the outstanding question(s)>`"*; a turn that ends with the
    question unanswered gets a `Stop` continuation with the same reason, re-applied at every `Stop`
    while the question is open and bounded by the harness's consecutive-continuation cap
    (continuation form the architect's) — until the agent answers.
    - **Actions that provide the answer run freely.** Reading, searching, running a test or build
      to *get* the answer are OL-C5's "actions to provide an answer" and are never denied — only a
      next move **not** directed at answering is (the agent going off to other work while the
      question sits). This is why the block never deadlocks the path to a truthful answer or forces
      a fabricated completion claim.
    - **The block clears when the agent answers** — a substantive text turn that addresses the
      question. A content-free deferral ("I'll get to that") does not clear it; that is the dodge
      OL-C3 targets. A text answer is never denied — a `PreToolUse` deny never touches text, and
      the `Stop` block releases on it — so the way out always exists.
    - **The lag window holds, it does not pre-clear `[D-41]`.** The clear-state is read from
      cached classification that can lag the newest turn (`transcript_path` is written
      asynchronously and may lag — verified 2026-10-14 — and the async classifier may not have
      run yet). While the newest text turn is **unclassified**, the block **holds/denies rather
      than pre-clearing** (at `Stop`, holding means continuing the turn) — the *opposite* of the
      steady-state clear lean (FR-B5) — because a wrongful hold ends once the text is classified
      and is recorded with its duration as a wrongful hold (FR-M1, FR-M2, D-41), while a missed
      drifter is not recovered. The
      hold governs the **clear-axis only**: it never widens what is denied — an answer-directed
      move (a read, search, or test/build run to get the answer) runs freely in the lag window
      exactly as in steady state, and a text answer is never a tool action, so it is never denied.
      The way out exists throughout.
    - **Multiple questions** are tracked as a set, each cleared independently.
    - **Scope:** the block belongs to the consumer that holds the question — the main agent (FR-O6);
      a subagent is not subject to a question it never received.
    - **Phasing (property, not mechanism) `[D-41]`.** Judging whether a move is answer-directed is a
      comprehension judgment. Phase A ships the block plumbing (the `PreToolUse` deny and the `Stop`
      block) plus a conservative recognizer that blocks only *clearly* non-answer-directed moves —
      safe, but low-coverage: a skeleton, not the working block. Phase B gives it OL-C5 precision.
      The recognizer's mechanism, and how the model-maintained judgment is kept off the synchronous
      block path, are the architect's (§11.5).
  - **Skill non-conformance (FR-A2k):** an expert skill is active and the agent's action skips
    or violates a declared step. **Steer first** (an advisory whisper); if the agent takes the
    deviating action anyway **without a stated reason**, or **steering is not working**, **deny
    that action**, reason naming the skipped step `[OL-C2, OL-C10]`; if the agent instead ends its
    turn with that step skipped under the same conditions, its `Stop` is blocked with the same
    reason, re-applied at every `Stop` while the condition holds and bounded by the harness's
    consecutive-continuation cap (§8). Following the step clears it; a stated reason clears it
    unless steering on that step is not working.
  - Both are **reactive** — the block lands only on a move that violates the confirmed
    condition, never before the agent has actually deviated.
- **FR-B2 — Every block is reactive, condition-scoped, and self-clearing.** A block targets only
  the single deviating move — a tool action, or the end of a turn; its reason tells the agent how
  to proceed (answer / follow the step / give a reason). It never denies an unrelated action and
  never requires a plan or test. Because a **text** answer or stated reason is never a tool action,
  it is never denied, and a `Stop` block releases on it — a way out always exists, including when
  both blocks are live at once (a skill step due *and* a question unanswered), so there is no
  deadlock. The contract shows the deny reason to Claude ("For "deny", shown to Claude", hooks
  reference fetched 2026-10-14); whether the model then answers rather than retrying a variant is
  model behavior the contract does not guarantee, so it is **measured**, not assumed (the
  deny-loop signal, FR-M4). A
  recognizer that keeps denying after the agent has complied is the FR-M2 fault *"a deny that
  outlives its condition"* — surfaced and correctable (FR-M2/FR-M4, FR-L6).
- **FR-B4 — Completion-check speaks at a `Stop`, as a whisper, not a block.** The
  completion-check (FR-A2g) and Completeness (FR-A2f) fire when the agent claims done (a
  `Stop`). `Stop`/`SubagentStop` deliver context to the agent in two forms:
  `hookSpecificOutput.additionalContext` — "Non-error feedback for Claude. The conversation
  continues so Claude can act on it, but unlike `decision: "block"` it is shown in the transcript
  as hook feedback rather than a hook error" (hooks reference, fetched 2026-10-14; added in Claude
  Code 2.1.163, June 4, 2026) — and `decision: "block"` + `reason`, which continues the turn
  labelled as a hook error. The oracle injects each fact **once** — it is never repeated to that
  consumer (FR-A4, FR-D5) — and then lets the stop proceed. `stop_hook_active` is the input that
  tells the hook the stop is already a continuation; the harness's consecutive-continuation cap
  (8 by default) is the outer bound. This is *delivery, not enforcement* — it gates on nothing,
  never repeats, and always releases (AC-8). It realises OL-12 (the oracle *speaks* at a
  done-claim) and is **not** one of the two blocks `[OL-12, HOOKS]`. The exact channel choice is
  the architect's; the deliver-once-and-release property is the requirement.
  - **An unanswered Max question at a `Stop`** is handled by the answer-drift `Stop` block
    (FR-B1, §8) at every `Stop`, not only at a recognized done-claim. `status`/`log` also record
    done-claims reached with an outstanding question (FR-M4), an owner-facing signal.
- **FR-B5 — Each block's precision is calibrated to its own cost function.** A block's judgment
  (was the question answered? was the step skipped?) can be wrong; every block is recorded on the
  audit trail (FR-X6) and its error rates surfaced (FR-M2/FR-M4) so a misfiring recognizer is
  visible and tunable. The two blocks do not share one posture, because their harms are not
  symmetric:
  - **Answer-drift.** A wrongful deny is trivially escaped (the agent answers, which it should do
    anyway); a *missed* one is Max's question dying silently. So the recognizer errs **toward not
    denying** (a rhetorical question, or a move that plausibly *is* answer-directed, is not denied)
    and **toward clearing** on a substantive answer (only an empty deferral fails to clear). That
    clear lean is the **steady-state** posture, for turns already classified; in the **lag window**
    (newest turn unclassified) the lean reverses to hold — on the clear-axis only, never widening
    what is denied — per FR-B1's lag clause `[D-41]`. It
    clears on an answer that *substantively addresses* the question, not one *verified correct* —
    deciding correctness would make the oracle the unconstrained judge FR-C2 forbids; if an answer
    is inadequate, Max re-asks. Its under-fire guard is the **human channel** (FR-L6): a missed
    answer-drift block is visible to Max — his own question went unanswered — so his correction
    outranks the recognizer.
  - **Skill non-conformance.** A wrongful mid-skill halt is disruptive, so the recognizer errs
    toward restraint. Checking whether an agent followed a skill step is verification, which OL-11
    assigns to the agents, so a *missed* skipped step must not rely on Max to notice it: its
    under-fire guard must be **automated** (FR-C4) and independent of the action→step classifier,
    or it inherits that classifier's blind spot (an action misclassified as a valid step reads as
    "done" to both). It checks each step directly by the evidence that step requires, against the
    oracle's own hook record and repo/store state — step due, evidence absent, no block fired ⇒ a
    missed skill-block (the missed-skill-block rate, FR-M2/FR-M4). A step that requires no evidence
    at all is a flaw in that skill, raised to Max for that step when the skill's structure is
    encoded (FR-C1).
  Each block thus takes the half of the whisper loop's bidirectional discipline its own visibility
  demands: the human channel where Max sees the miss (his own unanswered question), the automated
  channel where the check is verification, the agents' work (OL-11). The
  recognizers' mechanisms (and whether model-assisted → Phase B/C) are the architect's.
- **FR-B3 — What stays structurally impossible.** No **pre-emptive gate**: the oracle never
  denies an action *before* the agent has actually deviated, and never conditions forward
  progress on passing a plan, a test, or a quality check — the rejected "prove your plan /
  take a test to proceed" checkpoint `[OL-C2]`. No **generated-file block** `[OL-R4]`. No
  **repository mutation** beyond the hook wiring `init` installs and `deinit` removes — the
  oracle never rewrites an action's input to change what it does
  (`updatedInput`/`updatedToolOutput` are never used to mutate) `[D-9]`. A `PreToolUse` deny, in
  any form (`permissionDecision: "deny"` or exit code 2), is emitted **only** for the two reactive
  conditions of FR-B1; a `Stop` continuation, in any form (`decision: "block"`, exit code 2, or
  `hookSpecificOutput.additionalContext`), is emitted **only** for the two FR-B1 end-of-turn
  blocks and FR-B4's deliver-once whisper — never as a standing gate on the agent's work.
- **Retired requirement IDs (citation resolution) `[D-23]`.** Older documents (`RETHINK.md`, the
  retained 2026-07 architecture record, past reviews) cite two IDs this spec supersedes:
  **`FR-O4`** ("no deny path exists, structurally") — *superseded*; v1 **does** deny reactively in
  FR-B1's two cases, and its surviving content (no pre-emptive deny, no plan/test gate, no
  generated-file block, no mutation path) is carried by **FR-B3** — a citation to FR-O4 as a live
  no-deny property is a defect. **`FR-O4a`** ("one continuation per stop") — *survives, renamed*:
  the deliver-once Stop-time delivery bound is now **FR-B4**.
- **FR-O2 — Delivery-capable events and mechanism (C-4, `[HOOKS]`; hooks reference and Claude
  Code changelog fetched 2026-10-14).** Model-visible context returns via structured
  `hookSpecificOutput.additionalContext` on the tool events, and via plain stdout on
  `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, and `PostModelSwitch` only. A
  `PreToolUse` hook may return `additionalContext` **without** any `permissionDecision` — the
  passive-whisper affordance — and that text is preserved even if the tool call later fails
  (Claude Code changelog 2.1.110, April 15, 2026: "Fixed `PreToolUse` hook `additionalContext`
  being dropped when the tool call fails") `[OL-C15]`. The hook runs before the tool, but the text
  is "added to Claude's context alongside the tool result" and "Claude reads the reminder on the
  next model request", so the model sees it after the tool call resolves, which does not mean the
  tool ran: a permission denial also fires `PreToolUse`, and the call may fail. Validation
  rejections "happen before hooks run", so the oracle is not invoked for them. Tested on Claude
  Code 2.1.283 (headless `-p`, 2026-09-28): when a permission rule denies a Bash call, or another
  hook denies the call, the hook has run and its context reaches the model next to the denial; an
  `Edit` path deny rule is rejected before hooks run, so the oracle is not invoked (`Read` path
  rules untested). `PostToolUse` carries `additionalContext` the same way. The two **enforcement
  blocks (FR-B1)** land on the deviating move (§8): a deviating tool action gets a `PreToolUse`
  `permissionDecision: "deny"` with `permissionDecisionReason`, which is "shown to Claude" as the
  denied call's result — whether the model then answers rather than retrying is model behavior,
  measured (FR-B2, FR-M4); a turn that ends in deviation gets a `Stop` continuation.
  `Stop`/`SubagentStop` expose `last_assistant_message`, the final response's text (the
  `PreToolUse` answer-drift recognizer instead reads `transcript_path`, which the docs warn is
  **written asynchronously and may lag** the in-memory conversation, so a just-given answer can be
  briefly invisible; FR-B1/D-41), and continue the turn two ways: `decision: "block"` + `reason`
  (labelled a hook error) and `hookSpecificOutput.additionalContext` (non-error feedback; added in
  2.1.163, June 4, 2026). Both run under the same loop protections — the `stop_hook_active` input
  and an **8-consecutive-continuation cap**, after which Claude Code overrides the next block and
  ends the turn (raisable by an environment variable the oracle never sets); `Stop` does not run on
  a user interrupt. The oracle uses a `Stop` continuation **only** for FR-B4's deliver-once whisper
  and the FR-B1 end-of-turn blocks (FR-B3). Hooks fire inside subagents carrying
  `agent_id`/`agent_type`; a hook's `additionalContext` is inserted into the conversation where the
  hook fired, so a subagent's hook context reaches that subagent, and the documented way to inject
  context into the parent after a subagent returns is a `PostToolUse` hook on the `Agent` tool.
  `PostToolUseFailure` and `PermissionRequest` are confirmed events (the oracle emits no
  `permissionDecision` on any of them — FR-B3). Timeouts: `command`/`http`/`mcp_tool` 600s
  (lowered to 30s on `UserPromptSubmit`, `PreModelSwitch` and `PostModelSwitch`, and to 10s on
  `MessageDisplay`), `prompt` 30s, `agent` 60s; `SessionEnd` hooks share a **1.5s budget, raised
  to match a longer per-hook `timeout` up to 60s**.
- **FR-O3 — Fail open for the agent, visibly for the owner.** Any shim/service error, timeout,
  or missing store yields silence and, on a block path, no deny and no `Stop` continuation, so the
  agent's move proceeds: a block issued when the oracle cannot establish that the agent deviated
  would be a block before an established deviation, which FR-B3 forbids, and the harness itself
  proceeds on a hook timeout or a non-blocking exit. Every such event is recorded as a
  self-detected fault (FR-M2) naming its class and, on a block path, that the block was off for
  that event, and is counted in `status` (FR-M4). A latency discipline (NF-1).

**Constraints fixed by circumstance:**

- **C-1 — Runtime: Node.js, current LTS (engineering choice `[D-33]`).**
  Claude Code hooks are language-agnostic shell commands, so the harness does not force the
  implementation language; Node is an **engineering choice**, chosen so the store can use an
  in-runtime SQLite (`node:sqlite`, unflagged from **v22.13.0 / v23.4.0** `[NODE-SQLITE,
  verified 2026-08-16]`) with **no native toolchain and no prebuilt-binary download**, which
  directly serves the cold-container readiness C-3 requires. Python and Rust are not precluded
  by the harness; they are rejected for weaker cold-start/no-toolchain store options, and the
  architect may choose another runtime that meets C-2/C-3.
- **C-2 — Full-text search: stock `node:sqlite` now ships FTS5.** (Supersedes the
  2026-08-16 state — then compiled without `SQLITE_ENABLE_FTS5`, nodejs/node #56951
  open. Re-verified 2026-08-29: `deps/sqlite/sqlite.gyp` on the Node `v22.x` branch
  defines `SQLITE_ENABLE_FTS5`, and an FTS5 virtual table creates successfully on
  Node v22.22.2, confirmed at source and by execution.) `[NODE-SQLITE, re-verified
  2026-08-29]`. **Requirement (property, unchanged):** fast name/structure lookup and
  text search over indexed symbols within NF-1; **mechanism is the architect's**, and
  it must satisfy C-3 — which the built-in engine now does with zero dependencies.
- **C-3 — Cold-container / sandbox readiness** `[OL-4]`: install + first index with no
  native toolchain beyond the chosen SQLite path, no prebuilt-binary download, no network
  beyond the harness's.
- **C-4 — Hooks contract** `[HOOKS]` — the facts in FR-O2, verified against the hooks reference
  and the Claude Code changelog on 2026-10-14.
- **C-5 — No MCP sampling** (deprecated SEP-2577) `[MCP-DEP]`.
- **NF-1 — Latency (engineering judgment `[D-31]`):** added latency per event **p95 ≤
  1.5s, hard ceiling 3s**, then silence and carry to the next event. A model call's latency
  is on the order of seconds — far over this budget — so it cannot sit on the synchronous
  hook path; model-using genres run off it (§11). The numbers are `[D-31]`, not the owner's;
  the fail-open behaviour is FR-O3's.
- **C-6 — Language coverage is broad and extensible, not a fixed short list `[OL-C1, D-15]`.**
  The oracle reads a broad set of languages behind a **language-agnostic interface**, and
  adding a language is a configuration/extension act, not a redesign. A hardcoded short list
  is out: the mission is language-general (a decision-changing fact is not English-only), and
  a fixed cap is an arbitrary limit of the kind `[OL-C1]` bars.

---

## 9. Standards and evidence base

Every source below was confirmed against its current primary/authoritative source; the
**Verified** column gives the date each was checked. Where a citation grounds a design
number rather than a hard requirement, that is noted at the requirement, not softened here.

| Key | Standard / source (as verified) | Governs | Verified |
|---|---|---|---|
| `[HOOKS]` | Claude Code hooks reference, `code.claude.com/docs/en/hooks` (event set; `PreToolUse` `permissionDecision` deny → `permissionDecisionReason` "shown to Claude" as the tool error — whether the model then answers rather than retrying is measured, not guaranteed (FR-B2); precedence deny > defer > ask > allow; `additionalContext` optional & separate, inserted where the hook fired and read on the next model request; validation rejections happen before hooks run, permission denials fire `PreToolUse`; plain stdout as context on `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, `PostModelSwitch`; `Stop`/`SubagentStop` continue the turn by **both** `decision:block`+`reason` **and** `hookSpecificOutput.additionalContext` under the same protections — `stop_hook_active` input + 8-consecutive-continuation cap; `Stop` not run on user interrupt; `last_assistant_message` on the stop events; `transcript_path` on every event **but written asynchronously / may lag** (FR-B1/D-41); `session_id` on every event, `agent_id` for a subagent or in-process teammate, `agent_type` descriptive; parent injection via `PostToolUse` on `Agent`; `asyncRewake` can wake an idle session; injected text written "as factual statements rather than imperative system instructions"; timeouts incl. 30s on `UserPromptSubmit`/`PreModelSwitch`/`PostModelSwitch` and 10s on `MessageDisplay`) and Claude Code changelog, `code.claude.com/docs/en/changelog` (2.1.110: `PreToolUse` `additionalContext` kept when the tool call fails; 2.1.163: `Stop`/`SubagentStop` `additionalContext`); tested behaviour per FR-O2 (Claude Code 2.1.283, 2026-09-28) | Observation, delivery, block, whisper tone, consumer key, idle (C-4, §8, FR-D2, FR-O5, FR-O6) | 2026-10-14 |
| `[NODE-SQLITE]` | Node `node:sqlite` docs + nodejs/node #56951; FTS5 state per `deps/sqlite/sqlite.gyp` (v22.x) + local execution | Store runtime & FTS5 (C-1, C-2) | 2026-08-16; FTS5 re-verified 2026-08-29 |
| `[ROSE]` | Zimmermann, Weißgerber, Diehl, Zeller, IEEE TSE 31(6), 2005 — co-change / logical coupling, incl. recency-weighted horizon | Co-change mining; evidence terms (§5, §11); FR-K2 horizon/recency | 2026-08-16 |
| `[MSR]` | Mining-software-repositories practice — exclude merge commits (grounded by `[HERZIG]`: tangled/merge changes inject noise) | FR-K2 | 2026-08-25 (via HERZIG) |
| `[LLM01]` `[LLM02]` | OWASP Top 10 for LLM Applications 2025 (`genai.owasp.org`) — LLM01 Prompt Injection, LLM02 Sensitive Information Disclosure | T1, T3 | 2026-08-25 |
| `[OWASP-PI]` | OWASP LLM Prompt Injection Prevention Cheat Sheet (`cheatsheetseries.owasp.org`) — incl. indirect injection | T1 | 2026-08-25 |
| `[ASI06]` | OWASP Agentic Security Initiative, *Agentic AI — Threats and Mitigations* (`genai.owasp.org`) — ASI06 Memory & Context Poisoning of persistent stores | T2 | 2026-08-25 |
| `[OWASP-SM]` | OWASP Secrets Management Cheat Sheet (`cheatsheetseries.owasp.org`) — never store secrets in source; code is forked/cloned/backed up | T3 | 2026-08-25 |
| `[RSSE]` | Robillard, Maalej, Walker, Zimmermann (eds.), *Recommendation Systems in Software Engineering*, Springer 2014 — ch. 1 (Robillard, Walker), pp. 1–11: a recommendation system provides "information items estimated to be valuable for a software engineering task in a given context"; ch. 9, *Recommendation Delivery* (Murphy-Hill, Murphy), pp. 223–242: recommendations "must be delivered with a user interface that allows the user to become aware that recommendations are available" | The whisper as a recommendation, and its delivery (§4) | 2026-10-14 |
| `[TRICORDER]` | Sadowski, van Gogh, Söderberg, Jaspan, Winter, *Tricorder: Building a Program Analysis Ecosystem*, ICSE 2015 pp. 598–608 — "NOT USEFUL" feedback, monitored false-positive rate | Delivery; demotion (§11, P7) | 2026-08-25 |
| `[CACM]` | Sadowski, Aftandilian, Eagle, Miller-Cushon, Jaspan, *Lessons from Building Static Analysis Tools at Google*, CACM 61(4) 2018 pp. 58–66 — feedback-driven, workflow-integrated | Delivery; demotion/promotion (§11, P7) | 2026-08-25 |
| `[HERZIG]` | Herzig & Zeller, *The impact of tangled code changes*, MSR '13 pp. 121–130 — tangled commits inject noise into change data | FR-K2 (tangled commits add noise to co-change data) | 2026-08-25 |
| `[CHI]` | Iqbal & Bailey, *Leveraging characteristics of task structure to predict the cost of interruption*, CHI 2006, pp. 741–750 — human interruption cost (resumption lag) | Background only; no requirement rests on it (FR-O5 is backed by the mission and `[HOOKS]`) | 2026-10-14 |
| `[JOHNSON]` | Johnson, Song, Murphy-Hill, Bowdidge, *Why don't software developers use static analysis tools to find bugs?*, ICSE 2013 pp. 672–681 — "false positives and the way in which the warnings are presented, among other things, are barriers to use"; tools that "do not present their results in a way that gives enough information for them to assess what the problem is" | FR-D1, FR-D3 | 2026-10-14 |
| `[CTX-ROT]` | Hong, Troynikov, Huber, *Context Rot: How Increasing Input Tokens Impacts LLM Performance*, Chroma technical report, 2025-07-14 (`research.trychroma.com/context-rot`) — "models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows"; Anthropic, *Effective context engineering for AI agents* (`anthropic.com/engineering`) — "as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases" | §1 (briefing salience decays as the session grows) | 2026-10-14 |
| `[CC-CONTEXT]` | Claude Code context-window page, `code.claude.com/docs/en/context-window` — on compaction, "Context that hooks added earlier" is "Summarized with the rest of the conversation"; "Files Claude read or edited": "Claude Code re-reads up to five, most recently modified first" | FR-A4, D-20 (`compact`) | 2026-10-14 |
| `[CC-CLOUD]` | Claude Code docs, `code.claude.com/docs/en/cloud-environments` and `…/claude-code-on-the-web` — "each session gets a fresh virtual machine (VM) … with your repository cloned"; "Cloud sessions start from a fresh clone of your repository"; "Cloud sessions stop after a period of inactivity and the session's VM is reclaimed"; in an Anthropic-hosted environment "Claude Code runs hooks from the repository and from your organization's server-managed settings"; "User-level settings stay on your machine" | §2.1 (stores survive a cloud session), D-9 | 2026-10-14 |
| `[MCP-DEP]` | MCP SEP-2577 (`modelcontextprotocol.io`) — Sampling deprecated (annotation-only); authors told to call the provider API directly | C-5 | 2026-08-25 |

**`[ROSE]` figures (verified 2026-10-14):** the TSE-2005 baseline is user-tunable (support ≥
1, confidence ≥ 0.1, ranked by confidence), reporting feedback 0.64 / precision 0.30 /
recall 0.34 and >70% top-3 across eight projects. This spec lifts no fixed operating
point; ROSE grounds the *confidence computation*, and per FR-A5a there is no
high-confidence suppression gate. The one size threshold the spec names is FR-K2's
transaction-size cap: ROSE capped CVS transactions at 30 entities; the git file-level value is
set on Phase A data (FR-K2).

---

## 10. External interfaces

- **Hooks (consumed)** per C-4/`[HOOKS]`; shims carry no decision logic and relay what
  the service returns (FR-O2), including a `PreToolUse` `permissionDecision: "deny"` on a
  block (FR-B1), a `Stop` continuation for the FR-B1 end-of-turn blocks, and a Stop-time
  continuation that delivers the completion-check whisper once (FR-B4); the continuation form is
  the architect's.
- **CLI (produced), `ctxoracle`** — at minimum `init` and `deinit` (the only repo-tree writes:
  installing and removing the hook wiring), `index`, `status` (FR-M4), `log` (FR-M5), and a
  `correct`/`note` verb (FR-D4, FR-L6). Full surface is the architect's.
- **Stores (produced)** — two SQLite stores outside the repo tree; schema the architect's
  within FR-K* (§11), subject to C-2.
- **Model access (consumed)** — the **requirement** is a one-shot, tool-disallowed model
  call over the **host CLI's own access**, reusing the session's authentication, with **no
  separate credentials** `[OL-2, OL-7]`. The exact invocation is the architect's;
  illustratively a non-interactive single-turn CLI call (e.g. `claude -p --model … --max-turns
  1` with tools off) rather than the Agent SDK — but the flags are not part of the contract,
  the piggyback-with-no-credentials property is.

---

## 11. Stores, learning, and build order

### 11.1 Stores, index, miner

- **FR-K1 — Structural index** of symbols/definitions/locations, incrementally
  refreshable, serving §4/§5 within NF-1 (subject to C-2).
- **FR-K2 — Co-change miner** excluding merge commits `[MSR]`, capping very large
  transactions against tangled-change noise `[HERZIG]` (ROSE used 30 entities; the git
  file-level cap is set on Phase A data), over a configurable recency-weighted
  horizon `[ROSE]`.
- **FR-K3–K5 — Fact schemas** (exemplar, landmine, invariant, recipe) are **pointers to
  real code with provenance** `[ASI06]`.
- **FR-K6 — Provenance + trust on every record** (FR-X4).
- **FR-K7 — Staleness lowers confidence, never blocks** (staleness is not one of the
  block conditions) `[OL-C1]`.
- **FR-K8 — Two stores, outside the tree** `[OL-6]`.
- **FR-K9 — Export/import round-trip**; no network sync `[OL-6]`.

### 11.2 Model judgment and degraded mode

- **FR-J1 — Two-stage selection**: deterministic candidate generation (always
  available), then model judgment for model-dependent genres.
- **FR-J2 — Degraded mode deterministic, mandatory, automatic** on piggyback failure
  `[OL-2]`.
- **FR-J3 — Degraded mode is a runtime fallback, not a build stage** `[D-21]`.
- **FR-J4 — Recursion guard (property)** `[D-6]`.
- **FR-J5 — Off-path (model) genres: on-time AND still-true at delivery `[D-37]`.** A
  model-dependent whisper is computed off the synchronous hook path (NF-1), so its delivery
  cannot be simultaneous with the triggering narration. Two properties keep it on-time and true:
  - **Bound (relevance).** It is held **only until the next event where the candidate
    re-passes §5.1/§5.2 relevance for that consumer**, and **dropped at that consumer's
    termination (session/subagent end)** — that is the stated forward bound, not an open
    hold. A whisper that arrives after the decision it would have changed is the post-hoc
    linter posture RETHINK §3 rejects.
  - **Re-validation (truth).** Because the agent may edit the region between compute-time
    and delivery, the whisper's **pointer/evidence is re-resolved against current repo state
    at delivery**; if the evidence no longer holds (the cited `file:line` no longer says
    what the fact claims), it is **dropped, not delivered** — a late whisper whose pointer
    now resolves to different content is a checkably-false whisper, the worst output for a
    provenance tool (this is the deferred-path instance of FR-D1's rumor rule).
  Together these make §5.1's relevance-from-the-moment property, and FR-D1's no-rumor rule,
  hold for the async genres too. The mootness/relevance test and the re-resolution mechanism
  are the architect's; their **existence is required**.

### 11.3 Learning loop — de-noise in both directions

- **FR-L1 — Session log** per event: candidates, whisper/block, uptake evidence; no
  automated uptake judgment in Phase A `[D-12]`.
- **FR-L3 — Demotion** of measured false-firers `[TRICORDER, CACM]`; never silences a
  correct whisper `[OL-C1, P7]`.
- **FR-L3b — Promotion / re-exploration (the anti-ratchet)** `[D-25]`: a suppressed
  channel is periodically re-admitted to re-measure value and re-promoted when earned;
  the loop cannot converge to silence. Mechanism the architect's; existence required.
- **FR-L4 — Regret signal: measure false *silence*, not only false speech `[D-36]`.** The
  loop must estimate **regret** — a fact the store **held** that would have changed a
  decision and the oracle did **not** speak (below-bar, or never triggered) — because the
  **mission** (deliver the decision-changing fact) makes an unspoken *held* fact the
  costliest **value** failure, while FR-L3/FR-L6 measure only wrong whispers the owner can
  see. *(This is a mission-derived judgment `[D-36]`, not an owner statement — no CONFIRMED
  ledger row ranks silence against speech.)* **Scope:** regret
  covers **held-but-unspoken** facts only; it does **not** see a fact the store never had (a
  coupling the miner missed) — that is a *coverage* blind spot, read against AC-18's
  seeded-fact delivery, not something regret can measure. A concrete proxy exists (e.g. the
  store held a fact whose region was later re-edited/reverted, or whose covering test later
  failed, **and that churn was plausibly relevant to that fact** — not any region churn —
  while the oracle stayed silent); the exact proxy is the architect's, its **existence is
  required**, and it feeds the regret rate in FR-M4. The "plausibly relevant" test is itself a
  judgment with an error posture (like the block recognizers, FR-B5); because regret is a
  *diagnostic* signal (not a gate), a noisy proxy degrades the metric without misfiring on the
  agent. Distinct from FR-L3b (which re-admits *demoted*
  channels; regret also catches a fact never demoted and never fired).
- **FR-L6 — Human statements are first-class facts** — a CLI correction/fact outranks
  mined inference, and outranks Phase A's other calibration inputs when given (§5.2).
- **FR-L7 — Fact routing**: repo facts → project store; efficacy → global store `[OL-6]`.

### 11.4 Corrective / steering feature (non-primary in purpose — and it blocks)

**On "non-primary" (finding M1, `docs/reviews/2026-08-25-independent-review-spec-revision.md`).** OL-C2 makes this feature non-primary: it fires sparingly and holds
no precedence over any genre (P9). Its precision-critical parts — the intent→step recognizer
(FR-C2) and the block-precision discipline (FR-B5) — still receive full investment, because the
block it raises halts the agent and is a high-severity mechanism. It is the most machinery-heavy
behaviour (FR-C1/C2 encode each skill's structure, and FR-B5's automated missed-skill-block
detector reads FR-C1's per-step observable post-conditions) and is deferred to Phase C
accordingly.

- **FR-C1 — Expert-tool awareness `[OL-C2]`.** The oracle is given the *structure* of
  Max's expert dev-tool skills — per skill: how activation is detectable, the steps it
  defines, the expected agent action per step, and — where one exists — each step's **observable
  post-condition** (the artifact it produces or the store-checkable state it leaves), which the
  under-fire detector (FR-C4) verifies directly without re-classifying the agent's actions.
- **FR-C1a — What this block enforces, and its inherent limit `[OL-C2, OL-11]`.** OL-C2 asks for
  conformance to a skill's *structure* — "what actions the agent should be taking if they actually
  follow the skills" — which is **action-centric**, so the block has a **real, high-value
  enforceable core**:
  - **The mandatory independent review/collapse-hunt dispatch** — a `Task` subagent, whose absence
    is the single most-cited process failure on this very project (`CLAUDE.md`; collapse-log
    2026-08-01). Fully observable: did a review/hunt subagent get dispatched at the step that
    requires it?
  - **Read-before-plan / read-before-assert** — the grounding step of `expert-plan`/`expert-spec`:
    were the cited files actually `Read` in the session before the plan or claim that rests on them?
    Observable from the transcript.
  These have **checkable post-conditions or observable required actions**, and are exactly the kind
  of structural conformance OL-C2 names. What the block **cannot** enforce is a **pure
  cognitive-discipline step** — e.g. *"verify this claim against current source"* *in the agent's
  head* — because it produces **no artifact and no distinguishing action** (the claim appears
  whether or not verification happened), so no mechanism and no observer (not FR-C2, not FR-C4)
  can detect the skip. A skill composed *entirely* of such steps is not enforceable by this
  block (FR-C1/FR-C4).
- **FR-C2 — Trigger structured by the skill definition, not hand-coded rule piles `[OL-C2]`.**
  The trigger is driven by the structured skill definition (active? which step? expected
  action?), not a growing set of hand-written heuristics. **"Deterministic" here means
  *structured by the encoded skill*, not "regex-decidable":** mapping the agent's free-form
  actions onto a skill's steps is a judgment (model-assisted, consistent with Phase C), not a
  keyword match. It is neither a brittle regex nor an unconstrained judge — it is bounded by
  the skill's declared steps, and because it gates a block it is held to the block-precision
  discipline (FR-B5).
- **FR-C3 — Steer, then block — but never a pre-emptive gate `[OL-C2, OL-3]`.** On a
  deviation it **whispers to steer** first; it **escalates to a block** (FR-B1) when the
  agent skips a step without a stated reason or steering isn't working. It is **not** the
  rejected "prove your plan / take a test to proceed" checkpoint, it never blocks forward
  progress pre-emptively, and it is weighted as one ordinary input — no precedence (P9).
  Small / personal / non-primary.
- **FR-C4 — Automated missed-skill-block detection `[OL-C2, OL-11, FR-B5]`.** Because checking
  whether an agent followed a skill step is verification, which OL-11 assigns to the agents, the
  skill block's under-fire side is not left to Max to notice or correct. The signal must be **independent of the action→step classifier** (FR-C2)
  that the deviation recognizer uses, or it inherits that classifier's blind spot — an action
  *misclassified as a valid step* would read as "step done" to both. So FR-C4 verifies each step's
  **observable post-condition** (FR-C1) **directly against repo/store state**: a step was due, its
  post-condition is **absent**, and no deny fired ⇒ a **missed skill-block**, feeding the
  missed-skill-block rate (FR-M2/FR-M4). This *omission-of-outcome* check catches the
  misclassified-as-done case a commission-based check hides, and keeps the err-toward-restraint
  bias (FR-B5) from ratcheting OL-C2 enforcement silently to never-firing. **Two limits.**
  (1) A step with no checkable post-condition is not monitored this way (FR-C1a). (2) The check is
  classifier-independent, but the **"was step N due?" trigger** is only independent if "due" is
  derived by **post-condition chaining** (step N is due once step N-1's post-condition is present) —
  which requires a **post-condition-ordered** step structure. For a judgment-heavy skill (few/no
  post-conditions), "due" cannot be post-condition-derived and falls back to action-classification,
  **re-importing the very blind spot** FR-C4 exists to avoid — so FR-C4's independence is strongest
  for artifact-ordered skills and **weakest exactly where the miss matters most**. The "due"
  mechanism is the architect's, held to this caveat. Distinct from answer-drift, whose under-fire
  guard is the human channel (FR-L6) because Max *does* see his own unanswered question. Existence
  required.

### 11.5 Build order (phases within one spec)

- **Phase A — Deterministic core.** Model-free genres (Orientation entry-points,
  Coupling, Reuse, Consequence, Warning ⚠ with FR-A5a flags, Completeness,
  Verification/completion-check via the deterministic covering-test check), and the
  **answer-drift block's *safe skeleton*** — the block **plumbing** (a `PreToolUse` deny and a
  `Stop` block) plus a
  **conservative deterministic recognizer** (the architect's) that fires only on a move *clearly*
  not directed at answering `[D-41]`. **Phase scope `[OL-C5, D-41]`:** judging whether a
  move is a direct answer or an action to provide the answer (OL-C5) is a **comprehension judgment**,
  so Phase A's recognizer errs hard toward not-firing — **safe** (it rarely denies a compliant
  agent) but **low-coverage: a skeleton, not "the block working"** — and the **OL-C5-serving
  precision is Phase B**. Also in Phase A: the stores/index/miner, delivery, self-observability,
  security, and the calibration inputs of §5.2. Exits by producing measured whisper/block
  + false-fire **and regret** data on a real repo — including how little the conservative recognizer
  catches before Phase B. **Phase A is also the build's test bed.** It is run on the
  owner's real repos and Claude Code transcripts to *discover* how the honest
  deterministic mechanism actually behaves (`docs/IDEAS.md` #14, discovery-mode
  replay), and Phase B and the `AD-24` regression fixtures are **designed from that
  discovery** (the exit-data dependency below). A faked or over-built Phase A
  mechanism corrupts the very measurement the later phases read — the failure
  recorded in `docs/collapse-log.md` 2026-09-04 — so Phase A ships the honest
  minimum, and the fallible recognizers are gotten right by running it on real
  transcripts, never by reviewing an imagined-phrasing classifier into apparent
  completeness.
- **Phase B — Model-in-the-loop genres.** Assumption-check, Steering, Answer, the
  **unfinished-work check (FR-A2m)**, and — crucially for the answer-drift block — the
  **model-assisted maintenance of the question/answer state**: classifying, on each *user* turn,
  whether it is a blocking question, and, at each of the agent's moves, whether the move is a direct
  answer or an action taken to provide the answer (OL-C5). This lifts the block from its conservative
  Phase-A precision to OL-C5 precision. All Phase-B work runs **off the synchronous path** (NF-1,
  FR-J5): the model updates the *cached* state between actions; the `PreToolUse` deny and the
  `Stop` block stay synchronous, reading that cached state — **the model never sits on the block
  path.**
- **Phase C — Automated learning loop + the corrective/skill feature (FR-C1–C4, the
  skill non-conformance steer-then-block with its automated missed-block detector).** Needs the
  skill structures encoded and A/B delivery in place, plus the demotion+promotion ladder.

Each phase follows an approved, adversarially-reviewed architecture document; Phase B/C
numbers are set from Phase A's exit data.

---

## 12. Decisions made while writing this spec

- **D-2 — Advisory by default; blocking only reactively (P2).** Ignored advice is
  de-noised empirically, not gated; blocking exists only for answer-drift `[OL-C3]` and
  skill non-conformance `[OL-C2]`, never as a pre-emptive gate. *Job:* keep the tool a
  guide that can still stop a genuinely off-track agent in the two cases Max named.
- **D-4 — ⚠ subtype declarative, corrected via CLI** (feeds FR-L3/FR-L3b).
- **D-28 — Uncertain hazards are spoken flagged (FR-A5a) — Max chose option B** on
  2026-08-16 `[OL-C4]`.
- **D-6 / D-6bar — Recursion guard, and the bar-as-quality-filter, are properties.** The
  recursion guard is required because the oracle's model call goes through the host CLI (OL-2,
  §10), a headless Claude Code run in the same repository, and configured hooks fire in such a
  run, so an unguarded call would re-enter the oracle (FR-J4, AC-21). The bar's numeric
  combinator and its initial operating point are the architect's, each recorded with its reason
  and reset from Phase A data; the bar is calibrated against measured false-fire and value
  (§5.2).
- **D-7, D-8 — Only an evidentiary corpus floor, no adoption window** (FR-A6).
- **D-9 — The oracle never mutates the repository; the only write it may make in the tree is
  hook wiring by an explicit `init` (P8).** *Job:* least privilege — the oracle observes and
  injects context, which needs read access to the tree and no write. The wiring goes only where
  the environments the oracle must run in (C-3, OL-4, which includes Claude Code cloud sessions
  `[OL-C11]`) require it: a user-level or git-excluded project-local settings file leaves the
  committed tree untouched, while an Anthropic-hosted cloud session runs hooks only from the
  repository and server-managed settings, and user-level settings stay on the user's machine
  `[CC-CLOUD]`, so there the wiring must be in the repository's committed settings. `init` makes
  the smallest write those environments need, and `deinit` restores the tree to its pre-`init`
  state (AC-7).
- **D-12 — Phase A logs uptake but makes no automated uptake judgment.** Its calibration
  inputs are the agents' review of the whispers logged on Phase A's runs, which run on Max
  Cogar's real projects in his real sessions `[OL-C13]`, including the real-repository exit run
  (§11.5; verification is the agents', OL-11), the seeded-fact run (AC-18) and the regret proxy
  (FR-L4); a human CLI correction (FR-D4/FR-L6) outranks them when given.
- **D-15 / C-6 — Language coverage is broad and extensible, not a hardcoded short list.**
  *Job:* keep the tool's reach general enough to serve the mission across languages instead
  of being scoped to an arbitrary few. Grounded on the mission (language-general) and the
  anti-arbitrary-limit principle `[OL-C1]`.
- **D-16 — Per-consumer subagent delivery** `[OL-8, HOOKS]`.
- **D-18 — Equal genre base weight; decision-impact carries no intent term because intent
  enters via the trigger (§5.1).**
- **D-20 — Session boundaries are not context boundaries (FR-A4).** Dedup follows what the
  consumer's context still holds, not the session boundary. On `resume`/`fork` Claude Code
  replays the saved hook text `[HOOKS]`, so earlier whispers are still held and the sets are
  reseeded. On `compact` the context keeps a summary of earlier hook-added context and up to five
  re-read files `[CC-CONTEXT]`, so both the delivered-set and the read-set are reconciled to what
  the compacted context still carries, and a fact the summary dropped can be delivered again when
  next relevant (clearing both sets is one way to meet this; the architect records the choice).
  `clear`/`startup` start a clean context.
- **D-21 — Degraded mode separated from build phase** (FR-J3). **D-21b —** `log` readback
  required (FR-M5).
- **D-22 — Correct silence is announced** (FR-M3).
- **D-23 — Requirement IDs are stable mnemonics with intentional gaps.**
- **D-25 — Promotion/re-exploration required, not just demotion** (FR-L3b).
- **D-26 — Orientation delivers entry-points, not task-shape landmines.**
- **D-27 — Verification catches "claimed-done-but-test-not-run"; the general "unfinished"
  case routes to Phase B** (a coverage limit on OL-12).
- **D-31 — Latency numbers (1.5s/3s) are an engineering judgment**, not the owner's.
- **D-32 — The blocking model is exactly Max's two cases, each blocking the deviating move
  itself, always reactive and self-clearing (§8, FR-B1–B3).** The deviating move is a tool action
  or the end of the turn. A tool action that is not answer-directed (answer-drift) or that skips a
  due skill step without a stated reason (skill non-conformance) is denied at `PreToolUse`
  (`permissionDecision: "deny"`). A turn that ends with Max's question unanswered, or with a due
  skill step skipped and no reason stated after the steer, is blocked at `Stop`: the hook prevents
  the stop and continues the turn with the reason (`decision: "block"` or the `Stop`
  `additionalContext` continuation; the form is the architect's). A `Stop` block is re-evaluated at
  every `Stop`, re-applies while its condition holds, and releases as soon as the agent answers,
  performs the step, or states a reason that clears it (FR-B1); its outer bound is the harness's
  consecutive-continuation cap, which the oracle never raises, and a cap-hit with the condition
  still open is a self-detected fault (FR-M2) shown in `status`. *Job (an owner-objective, not a
  mission derivation — see §8's opening paragraphs):* enforce owner authority in the two
  situations Max confirmed `[OL-C2, OL-C3, OL-C5]` without becoming the pre-emptive gate he
  rejected: every block lands only after the agent has deviated, and OL-C5 makes ending the turn
  without an answer such a deviation (OL-R5 rejects scoping it out). Blocking is a second
  owner-set objective beside the mission. What is rejected — the pre-emptive "pass a test to
  proceed" gate `[OL-C2]` and the generated-file block `[OL-R4]` — stays structurally
  impossible (FR-B3).
- **D-33 — Runtime is Node.js by engineering choice, not circumstance (C-1).** *Job:* give
  the store a cold-start-friendly, no-native-toolchain path (`node:sqlite`) that satisfies
  C-3, using the language the Claude Code tooling ecosystem already assumes. The harness is
  language-agnostic, so this is a judgment the architect could revisit, not a fixed boundary.
- **D-34 — Stop-time whisper delivery (FR-B4) is a deliver-once, self-releasing injection at
  `Stop`, distinct from the FR-B1 enforcement blocks.** *Job:* let the oracle *speak* at a
  done-claim (OL-12) through a `Stop` continuation — preferably the
  `hookSpecificOutput.additionalContext` channel the contract added for `Stop`/`SubagentStop`
  (Claude Code 2.1.163, June 4, 2026: "Non-error feedback for Claude. The conversation continues
  so Claude can act on it", hooks reference fetched 2026-10-14) — without that counting as one of
  the two confirmed enforcement blocks. Separating delivery (gates on nothing, always releases)
  from enforcement (blocks until compliance) keeps FR-B1's "exactly two blocks" true.
- **D-35 — The two blocks have different cost functions, so precision is calibrated
  per-block, not with one shared posture (FR-B5).** *Job:* keep each enforcement block from both
  halting a *compliant* agent and decaying to never-firing, using the guard that actually operates
  for that block — the **human channel** for answer-drift (Max sees his own unanswered question) and
  an **automated post-condition check** for skill non-conformance (checking whether an agent
  followed a skill step is verification, which OL-11 assigns to the agents, so it must not rely on
  Max noticing a skipped step), on a signal independent of the recognizer it guards. This is the collapse-log's
  one-way-ratchet-to-silence trap the whisper loop escaped (FR-L3b + FR-L4); each block inherits the
  half of that discipline its own visibility demands. Recognizer mechanisms (model-assisted → Phase
  B/C) are the architect's.
- **D-36 — The learning loop measures false silence (regret), not only false speech
  (FR-L4).** *Job:* give the loop the **mission's** up-signal — a *held* fact that would have
  changed a decision and went unspoken — so the tool cannot converge to silence and still
  read as healthy. The silence-is-costlier asymmetry is a **mission-derived judgment**. Scoped
  to held-but-unspoken facts (never-known facts are a
  coverage gap, not regret). Existence required; the proxy is the architect's.
- **D-37 — Off-path (model) genres carry a bounded-lateness property (FR-J5).** *Job:* keep
  "at the moment of that decision" true for the async genres — deliver at the next relevant
  decision event or drop, never a post-hoc whisper (RETHINK §3).
- **D-38 — Completion-claim recognition is a classification with error modes, not a field
  read (FR-A2g).** `last_assistant_message` is an input to the recognizer, not the recognizer
  itself. The recognizer errs toward firing when a covering test for the changed region exists
  and was not run: a false fire costs one Stop-time continuation carrying a true fact (FR-B4),
  while a miss lets an unverified done-claim pass, the failure OL-12 requires the oracle to catch.
  Its false-fire rate is recorded and reported (FR-M1, FR-M4); automated demotion is Phase C (P7).
  Whether it is a heuristic (Phase A) or model-assisted (Phase B) is the architect's.
- **D-39 — The answer-drift trigger is the owner definition OL-C5.** After Max asks a question, the
  agent's next move must be a **direct answer** or **an action taken to provide that answer**; if it
  is neither, the agent is corrected (OL-C5, 2026-08-25 — a confirmed owner definition, not a design
  judgment). The one property the mechanism must preserve: **an action taken to provide the answer (a
  read, a search, a test/build run to get the answer) is answer-directed and is never denied** — this
  keeps the block from deadlocking the path to a truthful answer or forcing a fabricated completion
  claim.
- **D-41 — Recognizing "is this move answer-directed?" is a comprehension judgment, so the block is
  phased.** *Job:* keep the spec from treating the model-free increment as the working block when its
  precision needs the model. Judging whether a move is a direct answer or an action to provide the
  answer (OL-C5) is not deterministically decidable, so **Phase A** ships the block plumbing plus a
  conservative recognizer (clearly-non-answer-directed moves only — safe, low-coverage) and **Phase
  B** lifts it to OL-C5 precision by model-maintaining the question/answer state off the synchronous
  deny path (§11.5). The block reads the agent's answer text from a source verified, in every mode
  the oracle runs in (interactive and non-interactive), to hold that text before the agent's next
  `PreToolUse` (§13 spike); which source is the architect's. Text not yet visible or not yet
  classified (a source's lag, or the Phase B classifier's) is the lag window, in which the block
  holds rather than pre-clears (FR-B1's lag clause — clear-axis only, answer-directed moves still
  run freely). Every hold is recorded with its duration, and a hold on text later classified as an
  answer is recorded as a wrongful hold (FR-M1, FR-M2), so the cost of this lean is measured, not
  assumed. AC-12 claims only the deterministic plumbing model-free; the substantive-answer
  discrimination (AC-2a-ii) is a Phase-B criterion. Whether the model answers rather than retrying
  after a deny is model behavior, measured (FR-M4), not contract-guaranteed.

## 13. What is genuinely open

**One harness behaviour gates Phase A and is spiked before design-freeze.** The answer-drift
block reads the agent's answer text (FR-B1, D-41): before the agent's next `PreToolUse`, and, at
a `Stop`, for the turn's earlier messages. The hooks reference documents two candidate sources
and guarantees neither in interactive sessions: `transcript_path` "may lag the in-memory
conversation" with no stated bound, and `MessageDisplay` delivers interactive text in batches
whose timing relative to the next `PreToolUse` is not documented (and on hook failure or timeout
the text is displayed without reaching the hook). In non-interactive `claude -p` runs on Claude
Code 2.1.284 both held the text before the next `PreToolUse` in three runs (second-opinion
experiment X1, 2026-09-29). The spike establishes, for each mode the oracle runs in, which source
holds the text in time; the architect chooses from that result. The paragraph below records the
harness facts re-verified for C-4, including the subagent-propagation question resolved
2026-08-29; thin-history behaviour is stated at FR-A6, not here.

**One harness behavior, unconfirmed when first written.** The hooks contract was re-verified against current
source on 2026-10-14 (§9, FR-O2): the event set, the `PreToolUse` `additionalContext`
affordance, the `PreToolUse` deny reason "shown to Claude" as the tool result (so a text answer
is always reachable; whether the model then answers rather than retrying is measured, not
guaranteed — FR-B2/D-41), the `Stop`/`SubagentStop` **`additionalContext`** channel and
continuation with the `stop_hook_active` + 8-continuation bound, `transcript_path` on every event
(with the documented caveat that it is **written asynchronously and may lag** the in-memory
conversation — bearing directly on the answer-drift clear-axis, FR-B1/D-41), `last_assistant_message`
being Stop-only, the subagent `agent_id`/`agent_type` fields, and the timeouts are all confirmed —
as are `PostToolUseFailure` and `PermissionRequest` as real events. *(Resolved
2026-08-29: the current hooks reference now states it — a subagent hook's
context reaches the subagent, **not** the parent, and "To inject context into the parent
session after a subagent returns, use a `PostToolUse` hook on the `Agent` tool instead" (hooks
reference fetched 2026-10-14). C-4's assumption is confirmed as documented fact, and the
parent-injection option this paragraph anticipated exists; nothing in the v1
design depends on it.)*

No owner question is open: answer-drift is in scope and blocks (`[OL-C3]`), uncertain
hazards are voiced-flagged (`[OL-C4]`), and language coverage is broad and extensible (C-6).

---

## 14. Acceptance criteria

Each names the requirements it verifies; all use fixture repositories and replay. **v1 is
complete when every criterion passes on a real repository and `ctxoracle status` reports a
clean session.**

- **AC-1 (coupling → FR-A2b, FR-D3, P5, NF-1).** A known **non-obvious** co-change pair: a
  completed read of one file yields a coupling whisper naming the other, with evidence ratio
  and pointer, within latency. **Marginal-value assertion (P5):** the pair must be one the
  agent does not already have — a coupling whisper about a name-evident pair (an obvious
  same-directory, same-name pair) does **not** count as a pass.
- **AC-1a (orientation → FR-A2a, FR-A5, D-26).** On a prompt for a task with known structure,
  the Orientation whisper headlines the task's **structural entry-point files and the invariants
  that will bind**, delivering each one that clears the bar and withholding none for a count
  (FR-A5); it does **not** deliver task-shape landmines (those belong at the edit, FR-A2e).
- **AC-1b (reuse → FR-A2c, P5).** On a search/read for functionality with a known canonical
  helper, the Reuse whisper headlines the **convention** ("the canonical helper is `X`; most
  call sites use it"), not bare existence; a whisper that only states a symbol exists fails.
- **AC-1c (consequence → FR-A2d, P5, OL-C15).** On an edit attempted in a file with known
  historically-coupled tests, the Consequence whisper, reaching the agent with the edit's result,
  headlines those **coupled tests and the zone flag**; a whisper whose headline is a raw
  call-site count fails.
- **AC-1d (completeness → FR-A2f, FR-B4).** After an edit that completes one half of a
  historically-paired change, at a recognized completion-claim stop, the Completeness whisper
  names the **unchanged partner** with its co-change ratio, delivered via a self-releasing
  Stop-time continuation that delivers each fact once (FR-B4), not a block.
- **AC-2 (no pre-emptive gate / no mutation, structurally → FR-B3, D-9, OL-C2, OL-R4).**
  No code path emits a `permissionDecision: "deny"` or a `Stop` block *pre-emptively* — before
  the agent has made a move that violates one of the two confirmed conditions (FR-B1) — nor gates
  on a plan/test, nor blocks a generated-file edit; no code path other than `init`/`deinit` hook
  wiring (D-9) mutates the repo, and none mutates an action's input
  (`updatedInput`/`updatedToolOutput` never used to change what a tool does). A deny or a `Stop`
  block is reachable **only** on the FR-B1 answer-drift and skill-non-conformance paths, and a
  `Stop` continuation in either form (`decision: "block"` or `additionalContext`) only there and
  in FR-B4's deliver-once whisper delivery. A control-flow assertion (the only call sites of a
  deny or a `Stop` continuation are the two FR-B1 recognizers and FR-B4's delivery), not a
  field-scan.
- **AC-2a (answer-drift *block plumbing* — blocks a non-answer-directed move, not an
  action-to-provide-the-answer — given a known state → FR-A2l, FR-B1, FR-B2, OL-C3, OL-C5, D-41).**
  This exercises the Phase-A **plumbing** with the question/answer state **fixture-controlled** (the
  *recognizer's precision* — correctly judging answer-directedness — is separately AC-2a-ii, Phase
  B). In a fixture where a question is marked outstanding: (1) when the agent's next move is a tool
  action **clearly not directed at answering** (it goes off to unrelated work), that action's
  `PreToolUse` is **denied** with a reason naming the outstanding question, and a further
  non-answer-directed action is denied the same way, with no counter and no held turn; (2) when the
  agent **ends its turn without answering**, the `Stop` is **blocked** with a reason naming the
  question, and a further unanswered turn end is blocked again, so the block holds "until it
  actually answers"; a fixture that keeps the turn unanswered up to the harness's
  consecutive-continuation cap shows the cap-hit as a self-detected fault (FR-M2) in `status`.
  **Actions to provide the answer are not denied:** in the same state, a `Read`/search **and a
  command run to get the answer** (running the test to see if it passes) are **allowed** (OL-C5) —
  so the block never deadlocks the path to an answer nor forces a fabricated completion claim. Once
  the agent **answers in text substantively** (never a tool action, so never itself denied), its
  next tool action is **allowed** and its next stop proceeds. The block clears the instant the
  question is answered — a complying agent is never stranded *when compliance is correctly
  recognized* (a misrecognition is the FR-M2 "deny outlives its condition" fault, FR-B2).
- **AC-2a-i (answer-drift is main-agent-scoped → FR-A2l, FR-B1, FR-O6).** With the main-session
  question outstanding, a **subagent's** `PreToolUse` is **not** denied for it — the subagent never
  received the question and could not answer it (per-consumer scope, FR-O6). A spawn the main agent
  makes is judged like any other move: a spawn *to gather information toward the answer* is
  answer-directed and allowed; a spawn *to go do other work* is not answer-directed and is denied
  (the same OL-C5 judgment, Phase-A-conservative / Phase-B-precise).
- **AC-2a-ii (multi-question / partial answer / substantive-clear — a *Phase-B* criterion →
  FR-A2l, FR-B1, FR-B5, D-41).** Where the user asked two questions and the agent answers one then
  makes a non-answer-directed move, the block **does not release** for the still-open question; a
  **content-free deferral** ("I'll get to that") does **not** clear it; but a **substantive** answer
  that addresses the question **does** clear it even if imperfect (FR-B5 errs toward clearing on
  substance so a compliant answerer is never stranded — Max re-asks if inadequate); each outstanding
  question clears independently. **This discrimination is a comprehension judgment, so it is a
  Phase-B criterion** (the model-maintained state, §11.5).
- **AC-2b (skill non-conformance steer→block → FR-A2k, FR-C3, FR-B1, FR-C1a, OL-C2).** With a
  fixture skill structure loaded **whose deviated step is a declared step of one of Max's skills
  with an observable required action (FR-C1a) — e.g. `expert-implement`'s independent-review
  hand-off, or `expert-plan`'s read-before-plan — not a toy step with a trivial post-condition**:
  when the agent deviates, the oracle first steers by whisper; when the agent then takes an action
  that skips that step **without a stated reason** (or steering hasn't worked), that action's
  `PreToolUse` is **denied** with a reason naming the skipped step; when the agent instead ends its
  turn with that step skipped under the same conditions, the `Stop` is **blocked** with the same
  reason; when the agent performs the step, or gives a reason that clears it under FR-B1, its next
  action is **allowed** and its next stop proceeds. It never blocks pre-emptively (before a
  deviation) and never as a "pass a test to proceed" gate. Anchoring the fixture to a declared step
  of one of Max's skills is required so a pass certifies the enforcement OL-C2 asks for, not an
  abstract fixture skill structure.
- **AC-2c (each block's precision is calibrated by its own cost function → FR-B5, FR-C4, FR-L6,
  FR-M2).** *Over-fire (both blocks, automated):* in a fixture where the agent **did** answer
  (reworded) and **did** follow the step (valid but unusual), **no deny fires**; and a `Read`/
  search taken while a question is unanswered is **not** denied (information-gathering, AC-2a). An
  induced wrongful deny is surfaced (FR-M2) on the **wrongful-deny rate**, and a compliant agent
  never performs ceremony to escape a deny it should not have received. *Under-fire, answer-drift
  (human channel):* in a fixture where the agent makes a clearly non-answer-directed move with the
  question unanswered and no deny fired, a **FR-L6 human correction** records the miss and
  **outranks the recognizer**, so
  the identical deviation is thereafter denied — the guard is human because Max **sees** his own
  unanswered question. *Under-fire, skill block (automated — checking skill conformance is
  verification, which OL-11 assigns to the agents):* in a fixture where a skill step was **due** and
  the **evidence that step requires is absent** yet no block fired — including the hard case where
  the agent took an action the deviation recognizer *misclassified as completing the step* — the
  **automated missed-skill-block detector** (FR-C4, verifying the step's evidence **directly against
  the oracle's hook record and store/repo state**, not via the action classifier) records a miss on
  the **missed-skill-block rate** in `status` **with no human correction in the fixture at all** —
  proving the err-toward-restraint bias cannot silently ratchet OL-C2 enforcement to never-firing
  without relying on Max to catch it. (A step that requires no evidence at all is a flaw in that
  skill, raised to Max when the skill's structure is encoded (FR-C1).) *(The two under-fire guards
  differ on purpose: D-35/FR-B5 — human where the miss is owner-visible (his own unanswered
  question), automated where the check is verification, the agents' work (OL-11); contrast AC-16/
  AC-24's whisper loop, automated because false silence is always invisible to Max.)*
- **AC-3 (relevance+bar → FR-A5, OL-C1).** Two candidates meeting the bar at one event
  are both delivered; **no volume/count/budget cap** limits how much the oracle says over a
  session. (Dedup — FR-A4/FR-D5 — may still withhold an already-delivered fact; that is the
  never-repeat property, not a cap, and is covered by AC-4/AC-5.)
- **AC-3a (uncertain hazard spoken → FR-A5a, FR-D1, OL-C4).** A real but low-confidence
  hazard fires **with its confidence flagged**, not silence; a below-noise-floor
  coincidence does not fire.
- **AC-4 (marginal value + dedup + trigger relevance → FR-A5, FR-A4, §5.1).** A read-set
  fact stays silent; a not-yet-seen fact speaks; a high-quality fact about a file the
  agent is **not** touching does not fire.
- **AC-5 (session boundaries → FR-A4, D-20).** `resume`/`fork` reseed dedup; after `compact`,
  a fact delivered, or a file read, before compaction that the compacted context no longer carries
  (the fixture's compaction summary omits it and it is not among the re-read files) is delivered
  again when next relevant, while one the compacted context still carries is not repeated;
  `clear`/`startup` clean.
- **AC-6 (corpus floor, no adoption window → FR-A6).** Below the corpus floor history
  genres stay silent; a rich-history session fires regardless of how few sessions have
  occurred.
- **AC-7 (pristine tree → P8, FR-X5, D-9).** After `init`/`index`/session/`deinit`, the tree is
  identical to its pre-`init` state (no untracked or modified paths; a settings file that existed
  before `init` is byte-identical).
- **AC-8 (completion check → FR-A2g, FR-B4, OL-12).** At a recognized completion-claim stop
  with the region's test not run, the whisper fires via **a self-releasing Stop-time continuation
  that delivers each fact once** (FR-B4), then the stop proceeds;
  it is a whisper, not a block, and does not fire merely to name a test that ran. **Content assertion:** the emitted
  whisper must **headline the covering-test → changed-region mapping** (the fact the agent
  lacks); a whisper whose headline is only the run-state ("your test was not run"), with no
  covering-test mapping, **fails** AC-8 (P5, FR-D1).
- **AC-8a (unanswered question at a done-claim → FR-B1, FR-B4, FR-M4, D-41, OL-12, OL-C5).** In a
  fixture where a Max question is marked outstanding (fixture-controlled state) at a
  completion-claim stop, the `Stop` is **blocked** with a reason naming the unanswered question
  (FR-B1), the completion whisper (FR-B4) is still delivered, and `status`/`log` record a
  done-claim reached with an outstanding question (FR-M4); once the agent answers in text, its next
  stop proceeds. Where no question is outstanding, neither the block nor the record appears. In
  live use the block depends on the answered-recognizer, which is Phase-A conservative until the
  Phase-B model-maintained state (D-41): it leans toward clearing on substantive-looking text
  (FR-B5), so a reply it misjudges as an answer is not caught.
- **AC-9 (self-observability → FR-M1–M5).** Induced hook-not-firing, latency breach,
  produced-but-undelivered whisper, **a fail-open event** (FR-O3), **a deny that outlives its
  condition** (the oracle keeps denying, or keeps blocking the stop, after the agent has answered
  / followed the step), **a `Stop` block released by the continuation cap with its condition
  still open**, **a corrupted store**, and
  **a stale index** each appear in the log and `status` as a self-detected failure class (the
  store-corruption and index-staleness inductions verify the two FR-M2 classes that FR-K7's
  "staleness lowers confidence" does *not* cover — detecting and surfacing the fault, distinct
  from down-weighting a stale fact); an induced **missed skill-block** — a skill step due with the
  **evidence it requires absent** and no block, **including the case where the agent took an
  action the deviation recognizer misclassified as completing the step** — also appears as a
  self-detected class via the FR-C4 post-condition detector; per-genre
  volume, false-fire rate, **denies issued, the wrongful-deny rate, and the missed-skill-block
  rate**, and **any active suppressing condition** are
  reported; **the regret rate is shown labelled "held-but-unspoken only" and paired with the
  seeded-coverage result (or "coverage not measured live")** (FR-M4 / AC-18) so a low regret rate
  is never displayed as total false-silence; `log` reads back each whisper and deny.
- **AC-10 (fail-open → FR-O3, NF-1).** Induced failure/timeout → silence and, on a block
  path, no deny and no `Stop` continuation is emitted so the agent's move proceeds (no stuck
  block), and the event is recorded as a fail-open fault (FR-M2) counted in `status`; p95 ≤
  1.5s, none over 3s.
- **AC-11 (security → FR-X1–X8, T1–T4).** Planted secret redacted everywhere; injection-
  suspect content pointer-only and never obeyed; low-trust origin never yields a
  high-confidence whisper; no credentials, no network beyond the model piggyback.
- **AC-12 (degraded mode → FR-J2, FR-J3, OL-2, D-41).** Model path down: the deterministic
  genres and the answer-drift block's **deterministic parts** still work — the block **plumbing** and
  the **conservative recognizer** run with no model, and the block **fails safe** (it denies rarely,
  so degraded mode never turns it into a deadlock). The fixture verifies only that (a) the
  deterministic plumbing operates model-free and (b) no model-free genre is switched off — it does
  **not** assert "the block works," because the block's OL-C5-serving *precision* (judging
  answer-directedness) is Phase-B model-maintained state (§11.5) and is degraded-mode-unavailable.
- **AC-13 (store hygiene → FR-K2–K7).** Merge commit, a transaction larger than the configured
  cap (FR-K2), and
  beyond-horizon history contribute no edges; append refreshes incrementally; a stale fact
  lowers confidence without blocking.
- **AC-14 (whisper well-formedness → FR-D1–D5).** Every whisper parses to form, resolves
  its pointer, states its evidence ratio when history-derived, flags confidence when not
  high, and contains no imperative.
- **AC-15 (subagent delivery → FR-O6, OL-8).** A subagent tool event draws a whisper into
  that subagent's context, keyed by `agent_id`.
- **AC-16 (loop does not ratchet to silence → FR-L3, FR-L3b, P7).** On a fixture where a
  genre is demoted by **injected false-fires**, that genre is re-admitted for
  re-measurement within a bounded window (**N events or M sessions**, the values set from
  Phase A data); and on a companion fixture where the genre's value is **restored**, its
  delivered rate recovers **above zero** after re-admission. Pass/fail is the observed
  recovery on the restored-value fixture within the window — not an open-ended "while value
  remains."
- **AC-17 (language breadth → C-6, D-15).** The oracle indexes and mines a broad set of
  languages behind the language-agnostic interface; adding a language is configuration, not
  a redesign; nothing is hardcoded to a fixed three.
- **AC-18 (exit run delivered the seeded facts → §1, FR-M4, P5).** On a rich fixture seeded
  with **known decision-changing facts** (a planted coupling, a planted landmine), the exit
  run **delivers those specific facts** (verified by matching the seeded pointers), and
  `status` reports the run. The bar is *delivering the seeded facts*, **not** hitting a
  whisper count — a high-silence run that surfaces every seeded fact passes; padding the
  count by lowering the bar (P1) does not.
- **AC-19 (export/import round-trip → FR-K9, FR-X7).** Export both stores, re-import into an
  empty location, and assert the imported stores are **record-identical** to the originals;
  **no network egress** occurs during export or import (FR-X7).
- **AC-20 (cold container + FTS mechanism → C-1, C-2, C-3).** Install + first index in a
  sandbox with no native toolchain beyond the chosen SQLite path; the C-2 full-text-search
  mechanism functions under those constraints.
- **AC-21 (recursion guard → FR-J4, D-6).** A model-using genre whose own model call emits
  hook events does **not** trigger a further oracle invocation on those events; an induced
  self-trigger terminates at the guard with **no unbounded hook→model→hook chain** and the
  event is logged (FR-M1). A safety criterion, not a latency one.
- **AC-22 (task-boundary only, no idle timers → FR-O5).** The oracle fires only on a
  mapped lifecycle event; with **no qualifying event it produces no whisper no matter how
  much wall-clock time passes** (there is no idle/timer path). Verified by holding a session
  idle and asserting silence, then confirming a boundary event fires normally.
- **AC-23 (human correction outranks + fact routing → FR-L6, FR-L7).** A CLI
  correction/fact **outranks a conflicting mined inference** for the same target (FR-L6);
  and a repo fact lands in the **project** store while an efficacy signal lands in the
  **global** store (FR-L7), verified by inspecting the two stores after a session.
- **AC-24 (regret / held-but-unspoken false-silence is measured → FR-L4, FR-M4).** *True
  positive:* on a fixture where the store **held** a decision-changing fact the oracle did
  **not** speak, and that fact's region is then re-edited/reverted (or its covering test
  fails) **in a way plausibly relevant to that fact**, the regret proxy records the miss and
  `status` reports a **non-zero regret rate**. *Does not inflate:* on a fixture where a held
  fact's region churns for a reason **unrelated** to that fact, regret does **not** count it.
  The regret rate is read as *held-but-unspoken* only, **alongside AC-18's seeded-fact
  coverage** — a run silent because the store never had the fact is caught by AC-18, not by a
  (near-zero) regret rate.
- **AC-25 (off-path whispers stay on-time AND true → FR-J5, FR-D1, §5.1).** A model-dependent
  whisper is delivered at the **next relevant decision event** for the consumer, and
  **dropped at that consumer's termination** — not held open or delivered arbitrarily later;
  where no relevant event remains before the fact is moot it is **dropped, not delivered
  stale**; and where the agent has edited the cited region between compute-time and delivery
  so the **evidence no longer holds**, the whisper is **dropped, not delivered** (a now-false
  pointer never ships — FR-D1's rumor rule on the deferred path).

**Phase-B and Phase-C acceptance.** The model-dependent genres FR-A2h/FR-A2i/FR-A2j/FR-A2m (and the
model-assisted completion-claim/answer-addressed recognizers routed to Phase B in §4/FR-A2g and
§11.5) are Phase B; their behaviour-specific thresholds are set from Phase A exit data (§11.5), so
their genre-specific acceptance criteria are authored with the Phase B architecture. They inherit,
from day one, the whisper-well-formedness bar (AC-14) and the marginal-value/pointer discipline (P5,
FR-D1). The Phase-C corrective feature's acceptance is **AC-2b and the skill-block (under-fire)
clause of AC-2c** (both Phase C — the FR-C1–C4 machinery). AC-2c's answer-drift clauses split by
phase: over-firing (reads/executions not denied) is Phase A; the substantive-vs-deferral
discrimination it and AC-2a-ii rest on is **Phase B** (D-41).

---

*End of spec. Its foundation is `OWNER-LEDGER.md` CONFIRMED plus the mission; verification
recency is per the §9 table.*
