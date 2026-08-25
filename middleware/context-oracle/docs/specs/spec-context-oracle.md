# Spec: Context Oracle (`ctxoracle`) — v1 (rebuilt 2026-08-16)

**Status:** draft for owner review. Every requirement traces to a CONFIRMED owner decision
(`OWNER-LEDGER.md`), a named and current-verified standard, or a recorded judgment (§12).
**Nothing attributed to Max Cogar appears here unless it is CONFIRMED in `OWNER-LEDGER.md`**
— an owner-attributed claim with no CONFIRMED ledger entry is a defect, not a citation.

**Provenance keys.** `[OL-n]` / `[OL-Cn]` = a CONFIRMED owner decision in
`OWNER-LEDGER.md`; `[OL-Rn]` = a REJECTED false attribution there. `[D-n]` = a
judgment made while writing this spec (reasoning in §12). Standard keys resolve in
§9. Every external source in §9 was verified against its current primary/authoritative
source; the §9 "Verified" column records the date each was confirmed (most 2026-08-25;
`[NODE-SQLITE]` and `[ROSE]` 2026-08-16).

**What this document is.** It defines *what* the oracle must do and the properties
it must hold. Component boundaries, storage engines, IPC, algorithms, and the exact
numeric form of any threshold are the architect's, except where a constraint is
itself a requirement (§8). Requirement IDs are stable mnemonics, not a contiguous
sequence; gaps carry no hidden requirement `[D-23]`.

---

## 1. Problem and mission

Coding agents under-read the codebase, misjudge when their context is sufficient,
and fill the gaps with plausible inventions. The knowledge that would prevent this —
which files change together, which edits have historically broken which tests, the
non-local convention, the second write-site, the landmine — is discoverable only
from history and structure the agent does not consult at the moment it decides.
Front-loaded "briefing" approaches pay their full token cost regardless of what
fraction is needed and decay in salience as the session grows (`RETHINK.md` §2.4).

**Mission (verbatim, the anchor for every requirement):**

> Deliver the fact that would change the agent's next decision, at the moment of
> that decision, without being asked.

The Context Oracle is a passive, repository-resident intelligence. It observes a
Claude Code session through lifecycle hooks and, at decision moments, injects a
small **whisper** — one fact, with a verifiable pointer — when it knows something
the agent almost certainly does not and that would change what it does next. It is
**advisory by default** (a whisper the agent may ignore) and **never mutates the
repository** `[D-9]` (the no-in-tree-write property; OL-3 is about blocking, not writes).

Alongside that mission — **not derived from it** — the oracle carries a **second,
owner-set objective**: it **blocks in exactly the two cases Max Cogar confirmed** (§2.1,
§4, §8): to make an agent answer a question it is ignoring `[OL-C3]`, and to stop an agent
that will not follow his expert dev-tool skills `[OL-C2]`. A block delivers no fact — it is
not the mission sentence at work, and it does not pretend to be; it is a confirmed owner
requirement that stands beside the mission and is justified in owner-objective terms, not
mission terms (§8). It never uses a *pre-emptive* gate (a "prove your plan / pass a test
before you may proceed" checkpoint), which Max rejected `[OL-C2]`.

**For whom.** A single developer (Max Cogar) working solo across his own
repositories, driving agents through Claude Code `[OL-6, OL-11]`. Not a team tool; no
sharing surface in v1. The tool must operate on repositories with **thin commit history**
(new repos, shallow clones) as a design condition — its behaviour there is bounded by the
evidentiary corpus floor `[D-7, D-8]`, not by any claim about which repositories are
typical.

**Why it is worth building.** The scarce, valuable knowledge is exactly what an agent
cannot surface from a cold checkout with its own tools; delivering it at the decision
point, and nowhere else, is the difference between guidance that is used and a binder
that is ignored (`RETHINK.md` §2.3).

---

## 2. Scope

### 2.1 In scope (v1)

- A CLI, `ctxoracle`, and the hook shims that wire it into a Claude Code session
  `[OL-1]`.
- Passive observation of the session, and delivery of whispers as injected context,
  to the **main agent and to subagents** `[OL-8]`.
- The whisper **genres** of §4, delivered under the relevance machinery of §5.
- **Blocking in the two confirmed cases**, via a reactive `PreToolUse` deny of the agent's
  deviating action (§8):
  - **Answer-drift block `[OL-C3, D-39]`:** when Max asks a question and the agent, instead of
    answering, pivots to **writing code** — a repository-mutating action (Write/Edit, or
    delegating that work to a subagent) — the oracle **denies that action** ("answer Max first")
    until the question is answered; information-gathering and running commands to *get* the answer
    run freely. OL-C3 confirms the block (*"block that motherfucker until it stops ignoring me and
    actually answers. just dont make a convoluted fucked up way that its done."*); the
    code-writing trigger and the silent-stop scope limit are spec design judgments `[D-39, D-40]`
    operationalizing it (a related owner scoping statement is recorded as OL-P3 PENDING, not built
    on here).
  - **Skill non-conformance, steer-then-block `[OL-C2]`:** the oracle knows the
    structure of Max's expert dev-tool skills; when the agent deviates it **steers**
    first, and **blocks** when the agent skips a step without a stated reason, or when
    steering is not working. (His words: *"IF THE AGENTS ARENT FOLLOWING MY SKILLS,
    THEN THAT SHIT NEEDS TO BE BLOCKED AT SOME POINT… IF THEY CANT PROVIDE A REASON
    FOR SKIPPING A STEP… OR STEERING ISNT WORKING, THEN THEY SHOULD BE FUCKING
    BLOCKED."*) This feature is **small, personal, and explicitly non-primary**
    `[OL-C2]`.
- Two persistent **stores** — per-project and per-user-global — both **outside** the
  repository tree `[OL-6]`.
- A history **miner** and structural **indexer** that populate the stores.
- **Model-in-the-loop judgment** for the genres that need it, via the host CLI's own
  model access, with a **deterministic degraded mode** when the model path is
  unavailable `[OL-2, OL-7]`.
- **Self-observability**: the oracle detects, logs, and surfaces its own failures, and
  announces correct silence so it is not mistaken for a broken tool `[OL-10]`.
- A **completion-claim** capability: the oracle speaks when an agent claims it is done,
  to catch a completion claim the work does not back `[OL-12]` (§4 FR-A2g).

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
- **Writes inside the repository tree**, except the hook-wiring `ctxoracle init`
  installs `[D-9]`.
- **Team features** — sharing, multi-user access control, server sync `[OL-6]`.

### 2.3 Explicit N/A

- **User-facing UI / web surface:** N/A — the interface is injected context plus a
  terminal CLI for the owner's own inspection.
- **Authentication / multi-tenant access control:** N/A — solo, single-user, local
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
- **P5 — Marginal value is the only relevance that counts.** The oracle speaks only
  about what the agent could not cheaply surface itself; a fact one `grep` returns is
  not a whisper (`RETHINK.md` §2.3).
- **P6 — Right fact, right moment** (`RETHINK.md` §2.4).
- **P7 — The tool learns in both directions.** Measured false-firers are demoted *and*
  demoted channels are re-explored and re-promoted on measured value; the loop must not
  converge to silence (§11, `[D-25]`).
- **P8 — The repository tree stays pristine** except explicit `init` wiring `[D-9]`.
- **P9 — No feature is primary.** Elevating any genre — the completion-claim moment or
  the corrective feature included — is the recurring failure this project exists to
  prevent (`RETHINK.md` §12.12 correction; `[OL-C2]`).

---

## 4. What the oracle says (and, in two cases, blocks)

Each genre is keyed to an observed intent signal and, per P5, is **headlined by the
fact the agent could not cheaply get itself**. No genre is primary (P9). Grounded as a
push-mode recommendation surface `[RSSE]`. Two of these escalate to a block (FR-A2k,
FR-A2l); the rest are advisory whispers.

| Genre | Fires on | The decision-changing fact / action |
|---|---|---|
| **FR-A2a Orientation** | Prompt submitted | The 2–4 structural entry-point files for the task and the one invariant that will bind. Task-shape landmines are NOT delivered here — they belong at the edit (FR-A2e) `[D-26]`. |
| **FR-A2b Coupling** | A file is read / searched | Co-change partners of that file, with the evidence ratio and a history pointer. |
| **FR-A2c Reuse** | A search / read for functionality | The non-obvious usage fact: "the canonical helper is `X`; **most call sites use it**" — the convention, not bare existence. |
| **FR-A2d Consequence** | An edit / write about to run | The non-obvious blast radius: **historically-coupled tests** this edit tends to break, and a vendored/build-**zone** flag. (A raw call-site count is grep-able and never stands alone as the whisper.) |
| **FR-A2e Warning ⚠** | An edit in a landmine zone | A history- or invariant-derived hazard (e.g. a file whose edits have broken a specific test), **flagged with its confidence** (§5). Advisory. |
| **FR-A2f Completeness** | Edit completed / stop | "You changed the reducer but not the selector it pairs with in 9 of its last 10 changes." |
| **FR-A2g Verification / completion check** | A recognized completion-claim stop | The fact the agent lacks at "done": **which test covers the changed region** — headlined by that covering-test *mapping*, with the observation that it has not been run against this change. The mapping is the non-trivial part; run-state alone is self-evident to the agent and, per P5, never stands alone as the whisper. (The completion-claim **recognizer** reads `last_assistant_message` `[HOOKS]` and classifies done-claim vs ordinary stop — a classification with false-fire/miss modes that **errs toward not firing** (P5, no ceremony); whether it is a deterministic heuristic (Phase A) or model-assisted (Phase B) is the architect's `[D-38]`.) **Honest limit:** catches *unverified* (a covering test exists and was not run); the general "did not finish" case (OL-12) is model-dependent and is a tracked Phase-B requirement (FR-A2m), not this one `[OL-12, D-27]`. |
| **FR-A2h Assumption check** | Agent narration | "Your narration assumes X; the repo says Y at `file:line`." (Model-dependent — Phase B.) |
| **FR-A2i Steering (whisper)** | Agent narration | "What you're describing lives in `src/…`, not where you're looking." (Model-dependent — Phase B.) |
| **FR-A2j Answer** | A repo-answerable question in narration | The repo-grounded answer with a pointer. (Model-dependent — Phase B.) |
| **FR-A2m Unfinished-work check** | A completion-claim stop | OL-12's concrete case — the agent claimed done but **did not finish the work**, beyond the unrun-test case FR-A2g catches. "Incomplete" is judged **relative to a named scope referent** — the user's prompt, an approved plan, or (when an expert skill is active) that skill's declared steps — never "the model decides done" with no anchor (that would be the unconstrained judge FR-C2 forbids). Where the referent is an active skill's steps, this overlaps FR-A2k (which *blocks* on a skipped step); FR-A2m is the *advisory* whisper at the done-claim, FR-A2k the enforcement mid-skill — same signal, different surface. Model-dependent — **Phase B**, acceptance authored there. A tracked requirement so OL-12's core need is not build-order prose `[OL-12, D-27]`. |
| **FR-A2k Process conformance → BLOCK** | An expert skill is active and an action deviates from its steps | Whether the agent's actions match the skill's steps. **Steers first** (advisory whisper); **escalates to a `PreToolUse` deny of the deviating action** when the agent skips a step without a stated reason, or steering isn't working `[OL-C2]` (§8, §11.4). Errs toward restraint (a wrongful mid-skill halt is disruptive), so its under-fire side carries an **automated missed-skill-block detector** that checks each step's observable post-condition directly (FR-B5, FR-C1, FR-C4) — Max cannot see a skipped step himself (OL-11). **Non-primary in *purpose*** (the design invests little in its *breadth and firing-eagerness*, per OL-C2) — but block-precision (FR-C2/FR-B5) gets full investment regardless; "non-primary" bounds its ambition, not its stakes or its precision (§11.4). |
| **FR-A2l Answer-drift → BLOCK** | A question is unanswered and the agent pivots to *writing code* — a repository-mutating action (Write/Edit, or delegating that work to a subagent) — instead of answering | **Denies that action** (`PreToolUse`) with "answer Max's question first," until answered; information-gathering and running commands to *get* the answer are **not** the trigger and run freely `[OL-C3, D-39]` (§8, FR-B1). Trigger design is `[D-39]`; silent-stop scope limit `[D-40]`; both operationalize the confirmed OL-C3 block. Answer-drift entered scope *advisory* under OL-9; **OL-C3 (2026-08-16) superseded that for this case and made it a block** — authorised by OL-C3 alone, not OL-9. |

- **FR-A1 — The single internal question.** Per event the oracle asks: *given what the
  agent is doing now, do I know something it almost certainly does not that would
  change what it does next?* Default: no → silence, yielding to a known
  decision-changing fact (P1) (`RETHINK.md` §5).
- **FR-A2 — Genre set.** The oracle produces the genres above. Model-free vs
  model-dependent, and therefore build phase, is fixed in §11.
- **FR-D1 — Whisper form.** One topic, a few sentences (illustrative ~1–5, tunable),
  the `[oracle]` prefix and its genre, **its confidence stated whenever not high**, and
  **at least one verifiable pointer** `[JOHNSON, P4]`. An uncheckable whisper is a rumor
  and is not emitted. The confidence flag is how the tool speaks an
  uncertain-but-important fact rather than suppressing it (§5.2, `[OL-C4]`).
- **FR-D2 — Whispers are informative, never imperative** `[P3]`. (Blocks, where they
  occur, are a separate mechanism — §8 — not an imperative whisper.)
- **FR-D3 — Warnings state their evidence** (support/confidence or call-site counts),
  never a bare assertion `[HERZIG]` (illustrative rate, §9).
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
deciding now — the file it opened, the symbol it searched, the edit it is about to run,
the completion it claimed (§4). This is where the agent's intent enters the machinery;
`[D-18]` answers the inherited 2026-07-22 collapse-question: `decision-impact` (§5.2)
carries no intent term *because intent is carried here, by the trigger*. A fact about a
file the agent is not touching does not fire.

- **FR-O1 — Observed events** via the Claude Code hooks contract `[HOOKS]`; the
  event-to-genre mapping and which of the ~31 hook events are wired is architecture;
  delivery-capable events are constrained by C-4/FR-O2.
- **FR-O5 — Task-boundary intervention only; no idle timers** `[CHI]`.
- **FR-O6 — Per-consumer delivery**, keyed by `agent_id`/`agent_type` `[HOOKS, OL-8,
  D-16]`.
- **FR-A4 — Never repeat.** A per-consumer **delivered-set** and **read-set**,
  reconciled across `resume`/`fork` (reseed) / `compact` (clear read-set) /
  `clear`/`startup` (clean) `[HOOKS, D-20]`.

### 5.2 The quality bar — which real candidates are worth the sentence

Among candidates the trigger has made relevant, the bar decides which are *worth
saying* — a **quality/marginal-value filter, not a relevance oracle** `[D-6bar]`.

- **FR-A5 — The bar (a conjunction, not a fixed formula).** A candidate is spoken when
  it is **jointly** (a) backed by real evidence (**confidence**), (b) materially
  consequential to the code being touched (**decision-impact**, deterministic from
  per-candidate properties — edit-vs-read, blast radius, zone — carrying **no genre
  term** `[D-18, P9]`), and (c) **not cheaply self-serve** (**marginal value** `[P5]`).
  None laundered by another being high. **No *volume, count, or budget* limit suppresses a
  candidate that clears the bar — the bar, not an arbitrary cap, is what decides worth
  `[OL-C1]`.** (Per-consumer dedup — FR-A4, FR-D5 — still applies: a candidate already
  delivered to, or visibly incorporated by, that consumer is not repeated. Dedup is not an
  arbitrary limit; it is the never-repeat property.) The numeric combinator is the
  architect's `[D-6bar]`.
- **FR-A5a — Uncertain hazards are spoken, flagged — not floored out `[OL-C4]`.** The
  warning/hazard genres do **not** require high confidence to fire. Asked to choose
  between warning only when quite sure (A) and also voicing uncertain warnings clearly
  flagged with the learning loop demoting persistent false-firers (B), **Max chose B**
  (2026-08-16). So a real but uncertain hazard is **delivered with its confidence
  flagged** (FR-D1); the only floor is a **noise floor** (real vs coincidental
  evidence, not strong-vs-weak). Precision is managed empirically by the learning loop
  (§11, P7), not by an a-priori high-confidence gate `[OL-C4, D-28]`.
- **FR-A6 — Corpus (evidentiary) floor only.** Below a minimum history corpus,
  history-derived genres stay silent (too little signal to mine) — evidentiary, feeding
  the confidence term. **No first-N-sessions / adoption window** (that would be the
  arbitrary limit `[OL-C1]` bans) `[D-7, D-8]`. On a thin-history repo the history genres
  are thinner; the structural, reuse, consequence, conformance, and answer-drift
  behaviours still operate (§13).
- **The bar ships high and is calibrated.** Adjusted against measured false-fire and
  value — the calibration input from Phase A is the human CLI correction (FR-D4/FR-L6);
  automated demotion/promotion is Phase C `[D-6bar]`.

---

## 6. The oracle must watch itself — self-observability

`[OL-10]`. The owner is a non-programmer and cannot catch a silent failure.

- **FR-M1 — Diagnostic log** per event: candidates, bar outcome, what was delivered,
  any block raised, latency.
- **FR-M2 — Self-detected failure classes**: hooks not firing, latency breaches, store
  corruption, index staleness, model path down, whispers produced-but-undelivered, **a deny that
  outlives its condition** (the oracle keeps denying an action after the agent has actually
  answered / followed the step — it must never permanently block a complying agent), and **a
  missed skill-block** (per FR-C4: a skill step was due, its **observable post-condition is
  absent**, and no deny fired — checked against store/repo state, not by re-classifying the agent's
  actions, so it catches the misclassified-as-done miss Max cannot see himself, OL-11; a step with
  no checkable post-condition is out of this detector's reach, a stated FR-C4 limit).
- **FR-M3 — Correct silence is announced — owner-facing only** `[D-22]`. The announcement
  goes to the diagnostics/log/`status` surface the owner reads (so working-silence is not
  mistaken for a broken tool, `[OL-10]`); it is **never injected into the agent's context**,
  which would re-noise the channel P1/P3 keep clean.
- **FR-M4 — `ctxoracle status`** — plain-language health, whisper count, per-genre
  volume, false-fire rate, **the regret rate — labelled "held-but-unspoken only" and paired
  with the last seeded-fact coverage result (AC-18), or "coverage not measured live"** so a
  low regret rate is never read as "nothing missed" (FR-L4), **denies issued, the wrongful-deny
  rate, and the missed-skill-block rate** (so both an over-firing and an under-firing
  block-recognizer are visible — the latter because Max cannot catch a skipped skill step, OL-11,
  FR-B5), **done-claims reached with an outstanding Max question** (so the "Max re-asks" recourse
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
  network use is the host CLI piggyback (§10); no repo-tree write except `init` `[D-9]`.
- **FR-X6 — Whisper/block audit trail (T2, T3)** — every whisper and every block
  recorded with evidence and pointer, readable via `ctxoracle log`.
- **FR-X7 — Locality (T3, T4)** — stores outside the repo tree; no outbound telemetry
  `[OL-6]`.
- **FR-X8 — Adversarial fixtures** carry injection payloads and planted secrets (§14).

---

## 8. How the oracle blocks — and what stays structurally impossible

**Why blocking is here at all (the reconciliation).** The mission — *deliver the fact that
would change the agent's next decision* — does **not** cover blocking: a block delivers no
fact, it withholds the agent's ability to stop. Blocking is therefore **not** derived from
the mission and does **not** claim to pass a mission-phrased collapse test. It is a
**separate objective Max Cogar confirmed** (`[OL-C2, OL-C3]`), standing alongside the
mission, and each block is justified in **owner-objective** terms:
- **Answer-drift block** — *job:* enforce that a question Max asks is actually answered
  before the agent stops ignoring it `[OL-C3]`. (Not "deliver a fact"; "make the agent
  respond to the owner.")
- **Skill-non-conformance block** — *job:* enforce that an agent using Max's expert skills
  either follows their steps or states why it skipped one, rather than silently drifting
  `[OL-C2]`.

Both are owner-authority enforcement, not information delivery; the spec keeps them
explicitly distinct from the advisory whisper genres so the tool's identity as a guide is
not quietly redefined. If the scope of that enforcement is ever in question, it is an
owner-scope call for Max, not a mission derivation the spec can make on its own.

**Heightened provenance bar for this category.** Declaring blocking a *beside-the-mission*
objective removes it from the mission collapse test (`CLAUDE.md`'s four-step hollow-decision
check) — for a mission-derived decision even a fabricated citation must still survive *"does it
serve the mission?"*, but an owner-objective decision's only remaining defense is *"is the cite
real and exactly resolved?"*. Fabricated or mis-resolved owner citations are this project's
**most documented failure class** — the `OWNER-LEDGER.md` REJECTED section (OL-R1/R3/R4) and the
collapse-log exist precisely to catch it.
So a decision admitted to this category carries a **heightened provenance bar**: it stands only
on a verbatim-verifiable CONFIRMED `OWNER-LEDGER.md` entry (the two here are `[OL-C2]`/`[OL-C3]`,
quoted), never on paraphrase or inference, and adding a *new* case is an owner-scope act for Max,
not something the spec may derive. This is the guardrail that keeps "beside the mission" from
becoming a hole any enforcement idea slips through by attaching an owner-shaped label.

**Owner-objective adversarial axis (a self-test that does NOT discharge the independent hunt).**
Real provenance is *necessary* but **not sufficient**: a block can be perfectly cited to OL-C2/OL-C3
and still be *hollow* — a mechanism that does not achieve the owner-objective (the citation-perfect
but mechanically-empty case `CLAUDE.md` warns the citation axis misses). "Beside the mission"
removes the *mission-phrased* collapse test, not adversarial testing. So a block is tested by its
**owner-objective** question — but with a discipline this spec learned the hard way: **an author who
writes *and* answers the hardest question tends to pick the beatable one and answer the "is the
limit disclosed?" (honesty) variant instead of the "does it meet the objective in the case that
matters?" (achievement) variant.** Therefore the author's self-test below is **not** a passing gate;
`CLAUDE.md`'s **mandatory independent collapse-hunt still governs every block decision** (a
round-3 independent hunt is what caught this very substitution). Stated on the *achievement* variant,
with the limits owned, not spun:
- **Answer-drift** — *achievement question:* "model-free, in the increment that ships first, can it
  even *recognize* an unanswered blocking question and a real answer — and does it catch the Bash
  channel agents most often write code through?" *Honest answer:* **the shipped-first increment is a
  safe skeleton, not the working block.** Its *firing* and *clearing* are comprehension judgments
  whose OL-C3-serving precision is **Phase B** (FR-B1 `[D-41]`): Phase A ships the deny plumbing +
  deterministic write-target typing with a **conservative** recognizer that rarely fires (safe from
  deadlock, low coverage). On the write channel, deterministic detection catches Write/Edit and
  *syntactically-explicit* Bash writes (a committed follow-on), but **interpreter-mediated writes
  (`python gen.py`, `python -c`) are a permanent limit** — the model that could infer intent is
  barred (NF-1). The round-2 achievement (executions/reads run free, no forced completion-lie) holds.
  Where the mechanism cannot reach — comprehension precision before Phase B, interpreter-mediated
  writes ever — is stated (FR-B1) and surfaced to Max (STATUS.md), **not** claimed as covered.
- **Skill non-conformance** — *achievement question:* "does it enforce the skill steps OL-C2 is
  *about* — including the cognitive-discipline steps (`expert-standard`'s "verify against source")
  that produce no artifact?" *Honest answer:* **it enforces action/artifact-checkable steps, not
  pure-cognitive ones — and there is a real, high-value enforceable core, named so the feature isn't
  abstract.** OL-C2 asks for conformance to a skill's *structure* — "what actions the agent should be
  taking" — and the concretely enforceable, observable steps include the **mandatory independent-
  review/collapse-hunt dispatch** (a `Task` subagent — the most-cited process failure on this very
  project, and fully observable) and **read-before-plan** (were the cited files `Read` before the
  plan — observable) `[FR-C1a]`. What it **cannot** enforce is a step whose only product is a correct
  judgment in the agent's head (not mechanically detectable by any mechanism, nor by Max — OL-11); a
  skill that is *all* such steps gets little. Both the enforceable core and the boundary are **stated
  (FR-C1/FR-C1a/FR-C4) and surfaced to Max** (STATUS.md), not answered away.
Neither answer claims "PASS." Each states what the mechanism achieves, what it does not yet or
cannot, and routes the *scope* of that shortfall to the owner — and none of it substitutes for the
independent collapse-hunt.

**The mechanism (verified against the current Claude Code hooks contract via Context7,
2026-08-25).** The situation a block handles is: the user asks a question (or a skill step is
due) and the agent, instead of answering / following it, takes a **deviating action** — for
answer-drift, *writing code* (a repository mutation, FR-B1 `[D-39]`); for skill non-conformance,
an action that skips a due step. A **`PreToolUse` hook fires after the agent
has formed that action but *before* it runs**, and may return
`hookSpecificOutput.permissionDecision: "deny"` with a reason that is handed to the agent.
That is the block: the oracle **denies the deviating action** and tells the agent what to do
to proceed. The block lands on the *action taken in violation of the condition* — **not at a
`Stop`.** When the condition clears (the agent answers / follows the step / states a reason),
its next action is simply allowed; the deny needs no counter, no held turn, no continuation.

- **FR-B1 — Reactive blocking exists in exactly the two confirmed cases** `[OL-C2, OL-C3]`,
  each realised as a `PreToolUse` **deny of the deviating action**:
  - **Answer-drift (FR-A2l) `[OL-C3, D-39, D-40]`.** OL-C3 confirms *what*: block until the agent
    answers. *How* is a spec design judgment: the trigger is **writing code — a repository-mutating
    action** (Write/Edit, or delegating that work to a subagent) — while a question is unanswered
    `[D-39]`. It is **not** "any action before a text answer" (that would deadlock research), and
    **not** topic-relatedness (an agent that turns "why does the ARM build fail?" into a fix-it
    task is on-topic yet never answers). On that `PreToolUse`, **deny the action**, reason *"answer
    Max's question first: `<the outstanding question(s)>`."*
    - **Executions and information-gathering are not the trigger `[D-39]`.** A Read/search, and a
      **command run to *get* the answer** (running the test to see if it passes, the build to see
      if it breaks), are left to run — the agent routinely *needs* to execute to answer truthfully
      (`CLAUDE.md`: never claim something works without running it). Only *writing code* — mutating
      the repository — is the pivot that gets denied. This is what keeps the block from forcing the
      agent to either deadlock or fabricate a completion claim when the honest answer requires a
      run.
    - **The firing and clearing recognizers are comprehension judgments — their real precision is
      Phase B; Phase A ships them *conservatively*, not fully `[D-41]`.** Two predicates gate the
      block: *is there an unanswered blocking question?* (a Max turn that is a question requiring an
      answer — not a directive, aside, or rhetorical/quoted "?") and *has it been substantively
      addressed?* Both are comprehension judgments, **not** deterministically decidable. So the
      honest phase split is: Phase A ships the deny **plumbing** (a `PreToolUse` deny on a
      code-write) and the deterministic **write-target typing** with a **deliberately conservative
      recognizer** that errs hard toward *not* firing (per FR-B5's fire-axis) — which makes Phase A
      **safe** (it rarely denies, so it rarely deadlocks a compliant agent) but **low-coverage** (it
      catches only the most clear-cut ignore-the-question-and-write-code case). The **OL-C3-serving
      precision** — reliably distinguishing a real blocking question from a rhetorical one, and a
      substantive answer from a content-free deferral — **is Phase B**, and it is achieved *without*
      putting the model on the synchronous deny path: the model maintains the **cached
      outstanding-question state** asynchronously (classifying each user turn as blocking-or-not and
      each assistant turn as answering-or-not, §11.5), and the `PreToolUse` deny reads that cached
      state synchronously. Phase A is not "the block working"; it is the block's safe skeleton.
    - **Detecting "answered," the lag window, and its lean `[D-41]`.** The recognizer runs at
      `PreToolUse`, which does **not** expose `last_assistant_message` (Stop/SubagentStop-only,
      FR-A2g), so it reads the cached state (§11.5). Two lags open a window where the cache is stale:
      the hooks contract warns `transcript_path` "is written asynchronously and may lag behind the
      in-memory conversation" (verified 2026-08-25), **and** — the deeper source — the async
      **classifier may not yet have run** for the newest turn, so cache staleness is about
      *classifier scheduling*, not only transcript I/O. In that window the state can be wrong either
      way: a just-answered question still marked open, or a fresh question not yet marked.
      **The lag-window lean is set here, and it is the *opposite* of the steady-state clear-axis
      lean (FR-B5), on purpose.** In steady state the clear-axis errs toward *clearing* (don't strand
      a compliant answerer). **In the lag window the block must err toward *denying / holding*, not
      clearing** — because the case it exists to catch is the agent that narrates ("let me sort that
      out") and then writes code, and agents narrate before nearly every tool call, so *"assume
      in-flight assistant text is an answer"* would systematically **miss the drifter** (the silent
      OL-C3 harm, with no recovery). The asymmetry that justifies the lean: a **wrongful** lag-window
      deny **self-recovers in one round-trip** — the reason "answer Max first" returns to the model,
      the classifier catches up, the next write is allowed, and the event is a self-detected FR-M2
      fault surfaced to Max; a **missed** block does not recover at all. So the deterministic
      deny-time re-check is *"is there assistant text newer than the last classified turn? → **hold**
      the deny pending re-classification (do **not** assume answered)"* — never *"newer text ⇒ treat
      as answered."* A text answer is never itself a tool action, so it is never *directly* denied;
      the way out exists, but the block does not *pre-clear* on the mere presence of unclassified
      text.
    - **Multiple questions** are tracked as a **set of outstanding questions**, each cleared
      independently; a partial answer (one of two) does **not** release the block for the rest
      (FR-B5).
    - **Scope: the consumer that holds the question (the main agent).** The question lives in the
      main-session transcript; per FR-O6 the block is per-consumer, so a **subagent is not subject
      to it** (it never received the question and could not answer it — blocking it would
      deadlock). Delegating the *work* is closed by the trigger: a spawn to *do the work* is a
      repository-mutating pivot, denied like a direct Write/Edit. A spawn purely to gather
      information to answer is research, allowed — so **research-framed delegation is a residual
      dodge on the same seam as Bash-channel writes** (below), monitored, not claimed closed.
    - **Bash coverage — two kinds, one committed, one permanently out `[D-40]`.** Agents write code
      through Bash, and Bash is *both* the execution channel (which must stay exempt so an
      execution-to-answer never deadlocks — D-39) *and* a code-writing channel. The distinction that
      matters is **not** "redirection present" — `pytest > out.txt` is an execution-to-answer that
      uses `>`, and "redirect ⇒ deny" would re-create the D-39 deadlock — but the **write target's
      file type** (a source file vs a scratch/output file):
      - *(a) Syntactically-explicit writes* — `sed -i`, `cat > src.py`, `tee src.py`, `dd`, in-place
        editors, where the written **source-typed target** is visible in the command — are catchable
        by a **fast deterministic heuristic** (target-type-keyed), and are a **committed follow-on**
        increment. It must be a heuristic, **not a model** (it gates a synchronous deny; a model is
        over NF-1 and would only fail open, FR-O3).
      - *(b) Interpreter-mediated writes* — `python gen.py`, `python -c "open('f','w')…"`,
        `node -e "fs.writeFileSync(…)"`, heredocs piped into an interpreter — are a **permanent limit
        of any deny-time deterministic detector**: `python gen.py`'s command string is identical
        whether it runs tests (must allow) or rewrites source (must deny), and reading `gen.py`
        cannot decide dynamic/conditional writes. The model that could infer intent is barred (NF-1).
        Chasing these with an ever-growing lexicon of write-primitives trends toward the **"piles of
        rules"** Max rejected in OL-C2 — so the spec does **not** claim them. Their backstop is
        FR-B4's outstanding-question line at the done-claim (best-effort, delivery not a block).
      So "the block denies all code-writing" is **never** achievable deterministically; (a) is a
      committed follow-on, (b) is a stated **permanent** limit. (iii) *Silent-stop* (agent ends its
      turn without answering and without writing code) is a design consequence of the code-writing
      trigger, out of the block's scope (re-asking is the recourse); FR-B4 surfaces it best-effort.
      These boundaries are stated for Max's awareness (STATUS.md) — an honest account of how much of
      OL-C3 a deny-time mechanism can serve, not a silent reduction.
  - **Skill non-conformance (FR-A2k):** an expert skill is active and the agent's action skips
    or violates a declared step. **Steer first** (an advisory whisper); if the agent takes the
    deviating action anyway **without a stated reason**, **deny that action**, reason naming
    the skipped step `[OL-C2]`. Following the step, or stating a reason, clears it.
  - Both are **reactive** — the deny lands only on an action that violates the confirmed
    condition, never before the agent has actually deviated.
- **FR-B2 — Every block is reactive, condition-scoped, and self-clearing.** A deny targets
  **only the single deviating action**, and its reason tells the agent exactly how to proceed
  (answer / follow the step / give a reason). **Two claims, kept distinct:** *(contract-verified)*
  the deny's reason is returned to the model as the tool result, and the docs state it is provided
  "so it avoids retrying" (2026-08-25); *(designed-for, measured — not a contract guarantee)*
  whether the model then **chooses** to answer in text rather than retry a variant is a
  model-behavior disposition the contract cannot promise. What the mechanism *guarantees* is only
  that a **text** answer or reason — never a tool action — is never denied, so a way out always
  exists; that the model *takes* it is expected and **measured empirically** (a deny-loop signal,
  FR-M4, catches an agent stuck retrying around a correct deny). It never denies unrelated actions,
  never requires a plan or test. **When both blocks are live at once** (a skill step is
  due *and* a question is unanswered), there is **no deadlock**: text is never a tool action, so
  neither block ever denies a text turn, so an answer (and a stated reason) is always emittable
  without a denied action — and any tool action taken while a condition stands is denied, forcing
  the agent to that text eventually. (This guarantees no mutual deadlock; it does not force an
  *order* — the agent may emit skill-step reasoning before the answer — which is fine.) No
  `stop_hook_active` counter, no `K`, no held turn
  — those described a Stop-based mechanism this tool does not use. **The "never stuck" guarantee
  holds when compliance is *correctly recognized*.** A recognizer that keeps denying after the
  agent has actually complied is the FR-M2 fault *"a deny that outlives its condition"* — a
  self-detected failure surfaced to the owner (FR-M2/FR-M4) and correctable via FR-L6, not a
  standing property the spec claims can never occur (a `PreToolUse` deny is FR-O3 fail-open on
  *error*, but a confident *misrecognition* is a real fault, so it is measured, not wished away).
- **FR-B4 — Completion-check speaks at a `Stop`, as a whisper, not a block.** The
  completion-check (FR-A2g) and Completeness (FR-A2f) fire when the agent claims done (a
  `Stop`). `Stop`/`SubagentStop` deliver context to the agent via **`hookSpecificOutput.additionalContext`**
  — a channel the current contract added for exactly this purpose: *"providing feedback to Claude
  and continuing the interaction, rather than the action being interpreted as an error"* (Claude
  Code Week 23, June 2026; verified 2026-08-25) — the cleaner form than the `decision: "block"` +
  `reason` continuation, which surfaces as an error notification. Either way the oracle injects
  the fact **once**; both forms are bounded by `stop_hook_active` (and by the harness's
  8-consecutive-continuation cap, far above the single cycle this uses). This is *delivery, not
  enforcement* — it gates on nothing, never repeats, and always releases (AC-8). It realises
  OL-12 (the oracle *speaks* at a done-claim) and is **not** one of the two blocks `[OL-12,
  HOOKS]`. The exact channel choice is the architect's; the deliver-once-and-release property is
  the requirement.
  - **Outstanding-question line at the done-claim `[D-40]`.** When the transcript shows a Max
    question still unanswered at the done-claim, this Stop-time whisper **also carries an
    outstanding-question line** ("you claimed done, but Max's question `<q>` is unanswered"). It
    **surfaces (best-effort)** the between-features case where an agent writes nothing the
    answer-drift block catches (a Bash-channel edit, a research-framed subagent) yet reaches "done"
    without answering — it does **not** *close* it: two honest limits. (a) It fires only if the
    completion-claim recognizer (FR-A2g) fires, which errs toward not-firing. (b) It uses the same
    "was it answered?" recognizer as the block's clear-axis, so it catches only **recognizably-open**
    questions, not a **false-clear** (a substantive-but-non-answer the clear-axis already accepted) —
    the guard shares the recognizer's blind spot, stated, not hidden. It is **delivery, not a
    block**. Because "Max re-asks" is the recourse for every uncaught case, and Max cannot re-ask
    what he does not know was dropped, `status`/`log` **also record done-claims reached with an
    outstanding question** (FR-M4) — an **owner-facing** signal, so the recourse is actually
    reachable, not only an agent-facing whisper the already-drifted agent may ignore.
- **FR-B5 — Block precision, calibrated per block — the two blocks have different cost
  functions and do not share one posture.** Whether a question was "answered" or a skill step
  "skipped" is a judgment that can be wrong, recorded on the audit trail (FR-X6, surfaced by
  FR-M2/FR-M4) so a mis-firing recognizer is visible and tunable. The **fire-direction** and the
  **under-fire guard** are set separately for each block, because the harms are not symmetric:
  - **Answer-drift (OL-C3) — three axes, each with its own lean; guard by the owner.** A wrongful
    answer-drift deny is *trivially escaped* (the agent answers or reasons, which it should do
    anyway — cost ≈ one recovered action), while a **missed** one is Max's question dying silently,
    the OL-C3 harm. But the three fallible predicates the block rests on lean **different** ways,
    and conflating them is how a compliant agent gets stranded:
    - **(a) Is this a blocking question?** and **(b) is this action *writing code*?** — err
      **toward not denying**: a phantom/rhetorical question, or an ambiguous action that might be
      information-gathering or an execution-to-answer, must **not** deny the agent's work, because a
      wrongful deny here can deadlock the path to a truthful answer (the worse failure). Only a
      *clear* blocking question plus a *clear* code-writing action fires.
    - **(c) Has the question been answered?** — clear the block on a **substantive** text turn that
      addresses the question, and err **toward clearing** when there is genuine substance: refusing
      to clear on a real answer strands a compliant agent, and the escape hatch ("answer in text")
      is only real if a genuine answer is *accepted*. What does **not** clear it is a **content-free
      deferral** ("I'll get to that") with no substance — that is the dodge OL-C3 targets. So the
      lean is *"accept a substantive answer; reject an empty deferral,"* not *"demand a perfect
      answer"* — an over-strict clear-axis would relabel a compliant agent as an FR-M2 "deny
      outlives its condition" fault, which is a fault, not a design goal. If a substantive answer is
      inadequate, Max's recourse is to re-ask (his stated posture), not the oracle's to perfect.
      **This is the *steady-state* lean, when the answer has been classified. It must NOT be carried
      into the lag window** (where the newest turn is not yet classified): there the lean **reverses**
      to *hold/deny, don't pre-clear on unclassified text* (FR-B1's lag clause `[D-41]`), because
      "assume in-flight text is an answer" would miss the narrate-then-write drifter — the OL-C3 harm.
      Steady-state protects the compliant answerer; the lag window protects against the drifter; the
      two are different regimes, not one lean applied twice.
      **This bar is mechanism-forced, and the boundary is surfaced for the owner's awareness.**
      OL-C3 says block until the agent *"actually answers"*; the realized bar is *"substantively
      addresses,"* not *"verified-correct."* The gap is **unavoidable**, not a chosen looseness: a
      "verified-correct" clear-axis would make the oracle the **unconstrained judge FR-C2 forbids**
      (deciding whether an answer is *right* is exactly the arbitration the tool must not do). So an
      agent *can* clear the block with on-topic text that does not truly answer, and the recourse is
      Max re-asking — reachable because done-claims with an outstanding question are surfaced to him
      (FR-M4/FR-B4). That "actually answers" is realized as "substantively addresses" is a
      **mechanism-forced limit stated for Max (STATUS.md)**, not settled as silent design — but it
      is not a choice the spec could have made differently.
    Precision on all three is managed empirically by the **wrongful-deny rate** (FR-M4). The
    **under-fire guard is the human correction channel (FR-L6)**: a missed answer-drift block is
    *visible to Max* (his own question went unanswered — the exact OL-C3 symptom), so he can flag it
    and his correction outranks the recognizer's bias. No automated missed-answer detector is needed
    here: Max sees the miss, and the detector would only re-run the recognizer that failed.
  - **Skill non-conformance (OL-C2) — lean toward restraint; guard by automation.** A wrongful
    mid-skill halt is genuinely disruptive (it stops a compliant agent inside a working process),
    so here the recognizer **errs toward not denying** an unusual-but-valid step. But the
    under-fire side **cannot** rest on Max: a skipped skill step is exactly the *subtle process
    failure a non-programmer cannot catch* (`CLAUDE.md`, OL-11) — indeed the feature exists
    *because* Max cannot track skill-step conformance himself (OL-C2). So this block **requires an
    automated under-fire detector** — but it must be built on a signal that does **not** re-run the
    same fallible action→step classifier the deviation recognizer uses, or it inherits that
    recognizer's blind spot: an action *misclassified as a valid step* would report "step done" to
    both, and the miss would be invisible to both. The independent signal is the step's **declared
    observable post-condition** (FR-C1) — the artifact or store-checkable state the step is
    supposed to *produce* — verified **directly against repo/store state**, not by classifying the
    agent's actions: "step N was due, its post-condition is **absent**, and no deny fired ⇒ a missed
    skill-block." This is *omission-of-outcome* detection (did the expected result materialize?),
    genuinely distinct from the recognizer's per-action *commission* judgment, so it catches the
    misclassified-as-done case the classifier hides. It feeds a **missed-skill-block rate** in
    FR-M2/FR-M4 as the wrongful-deny rate covers over-firing. **Honest limit:** a step with **no
    checkable post-condition** cannot be watched this way; that step's under-fire is unmonitored and
    the spec says so (FR-C4) rather than claiming blanket coverage. Without this signal the
    err-toward-restraint bias could ratchet OL-C2 enforcement silently to never-firing (the
    collapse-log's one-way-ratchet-to-silence trap).
  This is the honest asymmetry with whispers: the automated bidirectional loop (FR-L3b promotion +
  FR-L4 regret) exists there because false silence is invisible to Max; each block inherits the
  half of that discipline its own visibility demands — the human channel where Max can see the
  miss, the automated channel where he cannot. The recognizers' mechanisms (and whether
  model-assisted → Phase B/C) are the architect's, held to this posture.
- **FR-B3 — What stays structurally impossible.** No **pre-emptive gate**: the oracle never
  denies an action *before* the agent has actually deviated, and never conditions forward
  progress on passing a plan, a test, or a quality check — the rejected "prove your plan /
  take a test to proceed" checkpoint `[OL-C2]`. No **generated-file block** `[OL-R4]`. No
  **repository mutation** — the oracle never rewrites an action's input to change what it does
  (`updatedInput`/`updatedToolOutput` are never used to mutate) `[D-9]`. A `permissionDecision`
  deny is emitted **only** for the two reactive conditions of FR-B1, never as a standing gate
  on the agent's work. *(This supersedes the earlier "no `permissionDecision`, ever / never
  chain continuations" framing in `RETHINK.md` §12.12 and the phase-0 spec, which described a
  Stop-based no-deny model this rebuild replaces.)*
- **Retired requirement IDs (citation resolution) `[D-23]`.** Earlier drafts, and documents
  downstream of them (`CLAUDE.md`, `RETHINK.md`, the Phase 0 spec), cite two IDs this rebuild
  supersedes; they resolve as follows and are not live requirements under those old names:
  - **`FR-O4` — formerly "no deny path exists, structurally."** *Superseded.* Its core claim is
    now false: v1 **does** deny reactively in the two confirmed cases (FR-B1). Its surviving,
    still-true content — **no *pre-emptive* deny, no plan/test gate, no generated-file block, no
    mutation path** — is carried by **FR-B3**. A citation to "FR-O4 / no deny path" as a live v1
    property is a defect; read it as FR-B3's *no-pre-emptive-gate* guarantee.
  - **`FR-O4a` — formerly "one continuation per stop."** *Survives, renamed.* The only Stop-time
    continuation v1 emits is the completion-check/Completeness whisper, bounded to a single cycle
    by `stop_hook_active`; that bound is now **FR-B4**. It is a delivery bound, not a block bound.

- **FR-O2 — Delivery-capable events and mechanism (C-4, `[HOOKS]`, re-verified
  2026-08-25).** Model-visible context returns via structured
  `hookSpecificOutput.additionalContext` on the tool events, and via plain stdout on
  `UserPromptSubmit`, `UserPromptExpansion`, and `SessionStart` only. A `PreToolUse` hook
  may return `additionalContext` **without** any `permissionDecision`, injected before the
  tool runs and preserved even if that tool call later fails — the passive-whisper
  affordance (confirmed against the current hooks reference and the Claude Code
  `additionalContext`-on-`PreToolUse` behavior). `PostToolUse` carries `additionalContext`
  the same way. The two **enforcement blocks (FR-B1)** are a `PreToolUse`
  `permissionDecision: "deny"` with `permissionDecisionReason` — landing on the deviating
  action, not at a `Stop`. The deny's `permissionDecisionReason` is returned **to the model as the
  tool result**, and the docs state it is provided "so it avoids retrying" (verified 2026-08-25) —
  a *design intent*, not a contract guarantee of model behavior (FR-B2); the hard guarantee is only
  that a **text** answer/reason, never a tool action, is never denied. `Stop`/`SubagentStop` expose
  `last_assistant_message` (Stop-only — the `PreToolUse` answer-drift recognizer instead reads
  `transcript_path`, which the docs warn is **written asynchronously and may lag** the in-memory
  conversation, so a just-given answer can be briefly invisible; FR-B1/D-41) and deliver context
  two ways: `decision: "block"` + `reason` (a continuation, surfaced
  as an error), and — added Week 23, 2026-06 — **`hookSpecificOutput.additionalContext`**
  ("feedback… continuing the interaction, rather than… an error"). Both continue the turn and are
  bounded by `stop_hook_active` and an **8-consecutive-continuation cap**; the oracle uses this
  **only** for single-cycle Stop-time whisper delivery (FR-B4, the completion-check/Completeness
  whisper), never for the FR-B1 blocks (which are `PreToolUse` denies). Hooks fire inside
  subagents carrying `agent_id`/`agent_type`; whether a subagent hook's `additionalContext`
  propagates to the parent is **not documented and assumed not** (§13). `PostToolUseFailure` and
  `PermissionRequest` are confirmed events in the current contract (the oracle emits no
  `permissionDecision` on any of them — FR-B3).
  Timeouts (2026-08-25): `command`/`http`/`mcp_tool` 600s (lowered to 30s under
  `UserPromptSubmit`), `prompt` 30s, `agent` 60s; `SessionEnd` hooks share a **1.5s
  budget, raised to match a longer per-hook `timeout` up to 60s**.
- **FR-O3 — Fail open, fast** `[OL-3]`. Any shim/service error, timeout, or missing
  store yields silence — and, on a block path, **emits no deny, so the agent's action
  proceeds** — never an error in the agent's flow. A latency discipline (NF-1).

**Constraints fixed by circumstance:**

- **C-1 — Runtime: Node.js, current LTS (recorded judgment `[D-33]`, not a circumstance).**
  Claude Code hooks are language-agnostic shell commands, so the harness does not force the
  implementation language; Node is an **engineering choice**, chosen so the store can use an
  in-runtime SQLite (`node:sqlite`, unflagged from **v22.13.0 / v23.4.0** `[NODE-SQLITE,
  verified 2026-08-16]`) with **no native toolchain and no prebuilt-binary download**, which
  directly serves the cold-container readiness C-3 requires. Alternatives (Python, Rust) are
  not precluded by the harness; they are rejected here for weaker cold-start/no-toolchain
  store options, not by circumstance. If the architect finds a runtime that serves C-2/C-3
  better, that is an architecture decision, not a spec violation.
- **C-2 — Full-text search is NOT in stock `node:sqlite`** (compiled without
  `SQLITE_ENABLE_FTS5`; nodejs/node #56951 open, 2026-08-16) `[NODE-SQLITE, verified
  2026-08-16]`. **Requirement (property):** fast name/structure lookup and text search
  over indexed symbols within NF-1; **mechanism is the architect's** (FTS5-enabled build,
  a loaded FTS5 extension, or a library shipping FTS5 e.g. `better-sqlite3`), and it must
  satisfy C-3.
- **C-3 — Cold-container / sandbox readiness** `[OL-4]`: install + first index with no
  native toolchain beyond the chosen SQLite path, no prebuilt-binary download, no network
  beyond the harness's.
- **C-4 — Hooks contract** `[HOOKS]` — the facts above (FR-O2), verified 2026-08-25.
- **C-5 — No MCP sampling** (deprecated SEP-2577) `[MCP-DEP]`.
- **NF-1 — Latency (engineering judgment `[D-31]`):** added latency per event **p95 ≤
  1.5s, hard ceiling 3s**, then silence and carry to the next event. A model call's latency
  is on the order of seconds — far over this budget — so it cannot sit on the synchronous
  hook path; model-using genres run off it (§11). The numbers are `[D-31]`, not the owner's;
  the fail-open behaviour is `[OL-3]`.
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
| `[HOOKS]` | Claude Code hooks reference, `code.claude.com/docs/en/hooks` (event set; `PreToolUse` `permissionDecision` deny→`permissionDecisionReason` returned to the model *as the tool result*, provided "so it avoids retrying" — a design intent, **not** a behavior guarantee (FR-B2), precedence deny>defer>ask>allow, `additionalContext` optional & separate; `Stop`/`SubagentStop` **both** `decision:block`+`reason` **and** `hookSpecificOutput.additionalContext` (Week 23, 2026-06), `stop_hook_active` + 8-consecutive-continuation cap, `last_assistant_message` Stop-only; `transcript_path` on every event **but written asynchronously / may lag** (FR-B1/D-41); subagent `agent_id`/`agent_type`; timeouts) | Observation, delivery, block (C-4, §8) | 2026-08-25 |
| `[NODE-SQLITE]` | Node `node:sqlite` docs + nodejs/node #56951 | Store runtime & FTS5 (C-1, C-2) | 2026-08-16 |
| `[ROSE]` | Zimmermann, Weißgerber, Diehl, Zeller, IEEE TSE 31(6), 2005 — co-change / logical coupling, incl. recency-weighted horizon | Co-change mining; evidence terms (§5, §11); FR-K2 horizon/recency | 2026-08-16 |
| `[MSR]` | Mining-software-repositories practice — exclude merge commits (grounded by `[HERZIG]`: tangled/merge changes inject noise) | FR-K2 | 2026-08-25 (via HERZIG) |
| `[LLM01]` `[LLM02]` | OWASP Top 10 for LLM Applications 2025 (`genai.owasp.org`) — LLM01 Prompt Injection, LLM02 Sensitive Information Disclosure | T1, T3 | 2026-08-25 |
| `[OWASP-PI]` | OWASP LLM Prompt Injection Prevention Cheat Sheet (`cheatsheetseries.owasp.org`) — incl. indirect injection | T1 | 2026-08-25 |
| `[ASI06]` | OWASP Agentic Security Initiative, *Agentic AI — Threats and Mitigations* (`genai.owasp.org`) — ASI06 Memory & Context Poisoning of persistent stores | T2 | 2026-08-25 |
| `[OWASP-SM]` | OWASP Secrets Management Cheat Sheet (`cheatsheetseries.owasp.org`) — never store secrets in source; code is forked/cloned/backed up | T3 | 2026-08-25 |
| `[RSSE]` | Robillard, Maalej, Walker, Zimmermann (eds.), *Recommendation Systems in Software Engineering*, Springer 2014 — push vs pull recommenders | Genre set (§4) | 2026-08-25 |
| `[TRICORDER]` | Sadowski, van Gogh, Söderberg, Jaspan, Winter, *Tricorder: Building a Program Analysis Ecosystem*, ICSE 2015 pp. 598–608 — "NOT USEFUL" feedback, monitored false-positive rate | Delivery; demotion (§11, P7) | 2026-08-25 |
| `[CACM]` | Sadowski, Aftandilian, Eagle, Miller-Cushon, Jaspan, *Lessons from Building Static Analysis Tools at Google*, CACM 61(4) 2018 pp. 58–66 — feedback-driven, workflow-integrated | Delivery; demotion/promotion (§11, P7) | 2026-08-25 |
| `[HERZIG]` | Herzig & Zeller, *The impact of tangled code changes*, MSR '13 pp. 121–130 — tangled commits inject noise into change data | FR-D3, FR-K2 | 2026-08-25 |
| `[CHI]` | Iqbal & Bailey, *Leveraging characteristics of task structure to predict the cost of interruption*, CHI 2007 — interruption cost = resumption lag; subtask-boundary interruptions cost least | FR-O5 | 2026-08-25 |
| `[JOHNSON]` | Johnson, Song, Murphy-Hill, Bowdidge, *Why don't software developers use static analysis tools to find bugs?*, ICSE 2013 pp. 672–681 — false positives & warning presentation are the adoption barriers | FR-D1 | 2026-08-25 |
| `[MCP-DEP]` | MCP SEP-2577 (`modelcontextprotocol.io`) — Sampling deprecated (annotation-only); authors told to call the provider API directly | C-5 | 2026-08-25 |

**`[ROSE]` figures (verified 2026-08-16):** the TSE-2005 baseline is user-tunable (support ≥
1, confidence ≥ 0.1, ranked by confidence), reporting feedback 0.64 / precision 0.30 /
recall 0.34 and >70% top-3 across eight projects. This spec lifts no fixed operating
point; ROSE grounds the *confidence computation*, and per FR-A5a there is no
high-confidence suppression gate. The web-circulated 26%/15%/64% figures are the
ICSE-2004 version and are not cited. Illustrative numbers elsewhere (FR-D1's ~1–5
sentences; FR-K2's ~30-entity cap; FR-D3's rate) are tunable defaults, marked so at each
requirement — grounded by the literature above, with the operating point set on Phase A data.

---

## 10. External interfaces

- **Hooks (consumed)** per C-4/`[HOOKS]`; shims carry no decision logic and relay what
  the service returns (FR-O2), including a `PreToolUse` `permissionDecision: "deny"` on a
  block (FR-B1) and a single Stop-time continuation for the completion-check whisper (FR-B4).
- **CLI (produced), `ctxoracle`** — at minimum `init` (the only repo-tree write),
  `deinit`, `index`, `status` (FR-M4), `log` (FR-M5), and a `correct`/`note` verb (FR-D4,
  FR-L6). Full surface is the architect's.
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
  transactions (illustrative ~30, tunable `[ROSE]`), over a configurable recency-weighted
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
  cannot be simultaneous with the triggering narration. Two properties keep it honest:
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
  ledger row ranks silence against speech; D-28 records that "false silence is worse" was
  once falsely attributed to Max and must not be.)* **Scope, stated honestly:** regret
  covers **held-but-unspoken** facts only; it does **not** see a fact the store never had (a
  coupling the miner missed) — that is a *coverage* blind spot, read against AC-18's
  seeded-fact delivery, not something regret can measure. A concrete proxy exists (e.g. the
  store held a fact whose region was later re-edited/reverted, or whose covering test later
  failed, **and that churn was plausibly relevant to that fact** — not any region churn —
  while the oracle stayed silent); the exact proxy is the architect's, its **existence is
  required**, and it feeds the regret rate in FR-M4. The "plausibly relevant" test is itself a
  judgment with an error posture (like the block recognizers, FR-B5) — an imperfect proxy is
  acknowledged, and because regret is a *diagnostic* signal (not a gate), a noisy proxy degrades
  the metric, it does not misfire on the agent. Distinct from FR-L3b (which re-admits *demoted*
  channels; regret also catches a fact never demoted and never fired).
- **FR-L6 — Human statements are first-class facts** — a CLI correction/fact outranks
  mined inference and is Phase A's calibration signal (§5.2).
- **FR-L7 — Fact routing**: repo facts → project store; efficacy → global store `[OL-6]`.

### 11.4 Corrective / steering feature (non-primary in purpose — and it blocks)

**On "non-primary" vs a blocking capability (M1).** OL-C2 makes this feature *non-primary in
purpose*: it fires sparingly and holds no precedence over any genre (P9). "Non-primary"
constrains its **breadth and firing-eagerness — not its stakes, and not the precision of the
halt it raises.** The block it can raise is inherently a **high-severity mechanism** (it halts
the agent), and its precision-critical parts — the intent→step recognizer (FR-C2) and the
block-precision discipline (FR-B5) — receive **full investment regardless of the feature being
non-primary**; "the design invests little" scopes the feature's *reach and trigger-eagerness*,
never the safety of the hammer. It is the most machinery-heavy behaviour (FR-C1/C2 encode each
skill's structure, and FR-B5's automated missed-skill-block detector reads FR-C1's per-step
observable post-conditions) and is deferred to Phase C accordingly.

- **FR-C1 — Expert-tool awareness `[OL-C2]`.** The oracle is given the *structure* of
  Max's expert dev-tool skills — per skill: how activation is detectable, the steps it
  defines, the expected agent action per step, and — where one exists — each step's **observable
  post-condition** (the artifact it produces or the store-checkable state it leaves), which the
  under-fire detector (FR-C4) verifies directly without re-classifying the agent's actions.
- **FR-C1a — What this block can and cannot enforce, stated — with its positive core named
  `[OL-C2, OL-11]`.** OL-C2 asks for conformance to a skill's *structure* — "what actions the agent
  should be taking if they actually follow the skills" — which is **action-centric**, so the block
  has a **real, high-value enforceable core**, named here so the feature is concrete and its
  acceptance (AC-2b) is anchored to steps Max actually cares about, not a toy fixture:
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
  whether or not verification happened), so *no* mechanism (not FR-C2, not FR-C4, not Max — OL-11)
  can detect the skip. A skill that is *entirely* such steps gets little from this block. That is an
  **inherent limit**, not a choice the spec could have made differently; both the enforceable core
  and the boundary are **stated for Max's awareness** (STATUS.md), so how OL-C2 is realized is
  visible, not settled silently.
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
- **FR-C4 — Automated missed-skill-block detection `[OL-C2, OL-11, FR-B5]`.** Because Max
  cannot see a skipped skill step himself (OL-11), the skill block's under-fire side is not left
  to human correction. The signal must be **independent of the action→step classifier** (FR-C2)
  that the deviation recognizer uses, or it inherits that classifier's blind spot — an action
  *misclassified as a valid step* would read as "step done" to both. So FR-C4 verifies each step's
  **observable post-condition** (FR-C1) **directly against repo/store state**: a step was due, its
  post-condition is **absent**, and no deny fired ⇒ a **missed skill-block**, feeding the
  missed-skill-block rate (FR-M2/FR-M4). This *omission-of-outcome* check catches the
  misclassified-as-done case a commission-based check hides, and keeps the err-toward-restraint
  bias (FR-B5) from ratcheting OL-C2 enforcement silently to never-firing. **Two honest limits.**
  (1) A step with no checkable post-condition is not monitored this way (FR-C1a). (2) The check is
  classifier-independent, but the **"was step N due?" trigger** is only independent if "due" is
  derived by **post-condition chaining** (step N is due once step N-1's post-condition is present) —
  which requires a **post-condition-ordered** step structure. For a judgment-heavy skill (few/no
  post-conditions), "due" cannot be post-condition-derived and falls back to action-classification,
  **re-importing the very blind spot** FR-C4 exists to avoid — so FR-C4's independence is strongest
  for artifact-ordered skills and **weakest exactly where the miss matters most**. The spec states
  this rather than asserting flat independence; the "due" mechanism is the architect's, held to this
  caveat. Distinct from answer-drift, whose under-fire guard is the human channel (FR-L6) because Max
  *does* see his own unanswered question. Existence required.

### 11.5 Build order (phases within one spec)

- **Phase A — Deterministic core.** Model-free genres (Orientation entry-points,
  Coupling, Reuse, Consequence, Warning ⚠ with FR-A5a flags, Completeness,
  Verification/completion-check via the deterministic covering-test check), and the
  **answer-drift block's *safe skeleton*** — the deny **plumbing** (a `PreToolUse` deny on a
  code-write) plus deterministic **write-target typing** (Write/Edit; syntactically-explicit Bash
  writes to source-typed targets as a committed follow-on), with a **conservative recognizer that
  rarely fires** `[D-41]`. **Honest phase scope `[D-39, D-41]`:** the block's *firing* (is there an
  unanswered blocking question?) and *clearing* (substantively answered?) are **comprehension
  judgments** — so Phase A's recognizer errs hard toward not-firing (safe from the D-39 deadlock,
  but **low-coverage**: it is not "the block working," it is the skeleton), and the
  **OL-C3-serving precision is Phase B**. A **Task spawn is *not* clean by tool name** (the tool is
  `Task` either way; "work-doing" reads its prompt — a comprehension judgment, so only a *clearly*
  work-framed spawn is denied, research-framed delegation a monitored residual). **Interpreter-
  mediated Bash writes** (`python gen.py`, `python -c`) are a **permanent** deterministic-detector
  limit, never a Phase-A claim (FR-B1). Also in Phase A: the stores/index/miner, delivery,
  self-observability, security, and the human-correction calibration channel. Exits by producing
  measured whisper/block + false-fire **and regret** data on a real repo — including the honest
  finding of how little the conservative recognizer catches before Phase B.
- **Phase B — Model-in-the-loop genres.** Assumption-check, Steering, Answer, the
  **unfinished-work check (FR-A2m)**, and — crucially for the answer-drift block — the
  **model-assisted maintenance of the outstanding-question state**: classifying, on each *user*
  turn, whether it is a blocking question, and on each *assistant* turn, whether an outstanding
  question was substantively answered. This is what lifts the block from its conservative Phase-A
  precision to OL-C3 precision. All Phase-B work runs **off the synchronous path** (NF-1, FR-J5):
  the model updates the *cached* outstanding-question state between actions; the `PreToolUse` deny
  itself stays synchronous, reading that cached state — **the model never sits on the deny path.**
  This is why the two answer-drift limits resolve *differently*: the question/answer state depends
  on prior turns, so it can be model-maintained asynchronously (Phase B); the **Bash write-typing**
  depends on the *current* command, known only at the deny moment, so it must be a **synchronous
  deterministic heuristic** (keyed on the write target's file type, not on redirection presence —
  §8/FR-B1), and interpreter-mediated writes stay permanently out (a model there would only fail
  open, FR-O3).
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
  2026-08-16 `[OL-C4]`. (Corrects a prior draft that justified this by a "false silence
  is worse" claim falsely attributed to Max; the real basis is his B selection.)
- **D-6 / D-6bar — Recursion guard, and the bar-as-quality-filter, are properties**;
  combinator, "ships high", and calibration policy stated as properties.
- **D-7, D-8 — Only an evidentiary corpus floor, no adoption window** (FR-A6).
- **D-9 — The one in-tree write is `init` wiring** (P8).
- **D-12 — Phase A logs uptake but makes no automated uptake judgment**; calibration input
  is the human CLI correction.
- **D-15 / C-6 — Language coverage is broad and extensible, not a hardcoded short list.**
  *Job:* keep the tool's reach general enough to serve the mission across languages instead
  of being scoped to an arbitrary few. Grounded on the mission (language-general) and the
  anti-arbitrary-limit principle `[OL-C1]`.
- **D-16 — Per-consumer subagent delivery** `[OL-8, HOOKS]`.
- **D-18 — Equal genre base weight; decision-impact carries no intent term because intent
  enters via the trigger (§5.1).**
- **D-20 — Session boundaries are not context boundaries** (FR-A4).
- **D-21 — Degraded mode separated from build phase** (FR-J3). **D-21b —** `log` readback
  required (FR-M5).
- **D-22 — Correct silence is announced** (FR-M3).
- **D-23 — Requirement IDs are stable mnemonics with intentional gaps.**
- **D-25 — Promotion/re-exploration required, not just demotion** (FR-L3b).
- **D-26 — Orientation delivers entry-points, not task-shape landmines.**
- **D-27 — Verification catches "claimed-done-but-test-not-run"; the general "unfinished"
  case routes to Phase B**, an honest limit on OL-12.
- **D-31 — Latency numbers (1.5s/3s) are an engineering judgment**, not the owner's.
- **D-32 — The blocking model is exactly Max's two cases, realised as a `PreToolUse`
  `permissionDecision: "deny"` on the agent's deviating action, always reactive and
  self-clearing (§8, FR-B1–B3).** *Job (an
  owner-objective, not a mission derivation — see §8's reconciliation):* enforce owner
  authority in the two situations Max confirmed `[OL-C2, OL-C3]` without becoming the
  pre-emptive gate he rejected. Blocking is deliberately **not** claimed to serve the
  mission sentence; it stands beside it. What is rejected — the pre-emptive "pass a test to
  proceed" gate `[OL-C2]` and the generated-file block `[OL-R4]` — stays structurally
  impossible (FR-B3).
- **D-33 — Runtime is Node.js by engineering choice, not circumstance (C-1).** *Job:* give
  the store a cold-start-friendly, no-native-toolchain path (`node:sqlite`) that satisfies
  C-3, using the language the Claude Code tooling ecosystem already assumes. The harness is
  language-agnostic, so this is a judgment the architect could revisit, not a fixed boundary.
- **D-34 — Stop-time whisper delivery (FR-B4) is a single self-releasing injection via the
  Stop `additionalContext` channel, distinct from the FR-B1 enforcement blocks.** *Job:* let the
  oracle *speak* at a done-claim (OL-12) using the `hookSpecificOutput.additionalContext` channel
  the current contract added for `Stop`/`SubagentStop` (Week 23, 2026-06; verified 2026-08-25) —
  "feedback, continuing the interaction, not an error" — without that counting as one of the two
  confirmed enforcement blocks. Separating delivery (gates on nothing, always releases) from
  enforcement (denies until compliance) keeps FR-B1's "exactly two blocks" true and honest.
  *(Corrects an earlier claim that a `Stop` continuation was the only channel; the additionalContext
  channel is the cleaner form and both are bounded by `stop_hook_active`.)*
- **D-35 — The two blocks have different cost functions, so precision is calibrated
  per-block, not with one shared posture (FR-B5).** *Job:* keep each enforcement deny from both
  halting a *compliant* agent and decaying to never-firing, using the guard that actually
  operates for that block. **Answer-drift (OL-C3):** three fallible predicates lean different ways
  — *is-this-a-blocking-question?* and *is-this-writing-code?* err toward **not** denying (a
  wrongful deny can deadlock the path to a truthful answer), while *has-it-been-answered?* clears on
  **substance** and errs toward **clearing** (refusing a real answer strands a compliant agent);
  only a content-free deferral fails to clear. Its under-fire guard is the **human channel (FR-L6)**
  because Max *sees* his own unanswered question. **Skill non-conformance (OL-C2):** a wrongful
  mid-skill halt is disruptive so it leans toward restraint — but Max cannot see a skipped step
  (OL-11), so its under-fire guard must be **automated**, and it must not re-run the same fallible
  action→step classifier (that shares its blind spot): it verifies each step's **observable
  post-condition directly against store/repo state** (FR-C4), an *omission-of-outcome* signal that
  catches the misclassified-as-done miss. *This corrects earlier drafts* that (a) rested both blocks'
  under-fire guard on "visible to Max," (b) built the skill detector on the same expected-*action*
  classifier it was meant to backstop (it would share the blind spot — the round-2 collapse-hunt
  finding), and (c) conflated answer-drift's clear-axis (enforce) with its fire-axis (don't deadlock
  research). It is the collapse-log's one-way-ratchet-to-silence trap: the whisper loop escaped it
  (FR-L3b + FR-L4); each block inherits the half of that discipline its own visibility demands, on
  a signal genuinely independent of the recognizer it guards. Recognizer mechanisms (model-assisted
  → Phase B/C) are the architect's.
- **D-36 — The learning loop measures false silence (regret), not only false speech
  (FR-L4).** *Job:* give the loop the **mission's** up-signal — a *held* fact that would have
  changed a decision and went unspoken — so the tool cannot converge to silence and still
  read as healthy. The silence-is-costlier asymmetry is a **mission-derived judgment**, not
  an owner claim (no CONFIRMED row states it; D-28 records that attributing "false silence is
  worse" to Max is a defect). Scoped to held-but-unspoken facts (never-known facts are a
  coverage gap, not regret). Existence required; the proxy is the architect's.
- **D-37 — Off-path (model) genres carry a bounded-lateness property (FR-J5).** *Job:* keep
  "at the moment of that decision" true for the async genres — deliver at the next relevant
  decision event or drop, never a post-hoc whisper (RETHINK §3).
- **D-38 — Completion-claim recognition is a classification with error modes, not a field
  read (FR-A2g).** *Job:* stop naming the input (`last_assistant_message`) as if it were the
  recognizer; state the recognizer as a property that errs toward silence, with its
  determinism/phase (heuristic Phase A vs model-assisted Phase B) the architect's.
- **D-39 — The answer-drift trigger is *writing code* (a repository mutation), not "any work" and
  not topic-relatedness.** *Job (owner-objective, operationalizing the confirmed OL-C3 block):*
  make the agent answer without ever blocking the actions it needs *to* answer. OL-C3 confirms the
  *what* (block until answered); this is the *how* — a spec design judgment, not an owner claim.
  The earlier "work/mutation vs information-gathering" framing diverged from OL-C3's intent on
  **execution commands** (running a test to answer "did it pass?" both executes and produces the
  answer): denying those forced the agent to deadlock or fabricate a completion claim (the round-2
  collapse-hunt's central finding). Narrowing the trigger to *repository mutation* fixes this —
  reads and executions-to-answer run freely; only writing code is the denied pivot. Phase-A catches
  structurally-typed write tools (Write/Edit); **syntactically-explicit** Bash-channel writes are a
  **required follow-on deterministic write-command heuristic** (not a model — it gates a synchronous
  deny), *not* a permanent exclusion, while **interpreter-mediated** Bash writes (`python gen.py`,
  `python -c`) **are** a permanent deterministic-detector limit (§11.5, FR-B1(b)). *(A related owner
  scoping statement
  is recorded verbatim at **OL-P3 PENDING** in `OWNER-LEDGER.md`, awaiting Max's sign-off; this
  decision does not build on it — it stands on OL-C3 + engineering judgment — and the spec keeps no
  verbatim unconfirmed owner words in its body. If Max confirms OL-P3, D-39 gains direct owner
  backing.)*
- **D-40 — Answer-drift's honest limits are named, not papered over.** *Job:* keep the block's
  claims true to what the mechanism does. The code-writing trigger inherently does not catch (a) an
  agent that silently ends its turn without answering or writing code — re-asking is the recourse —
  or (b) a mutation performed through Bash in Phase A. Rather than overclaim "holds until it
  answers," the spec states these residuals, and the completion-check whisper (FR-B4) carries an
  outstanding-question line at a done-claim so the "worked-then-claimed-done-without-answering" case
  is at least *surfaced* (delivery, not a block — consistent with silent-stop being out of the
  block's scope). *(The silent-stop scope also relates to OL-P3 PENDING; stated here as a design
  consequence, not as an owner ruling.)*
- **D-41 — Answer-drift's *recognizer* limits are named, not only its *deny-target* limits, and the
  block is honestly phased.** *Job:* stop the spec from claiming the model-free increment "works"
  when the block's precision needs the model. Deciding *is there an unanswered blocking question*
  and *was it substantively answered* are comprehension judgments; a purely deterministic recognizer
  is either too eager (false-denies a rhetorical "?", re-creating the D-39 deadlock) or too loose
  (clears on any text, the deferral dodge). So: **Phase A ships the deny plumbing + deterministic
  write-target typing with a conservative recognizer that rarely fires** — safe from deadlock, but
  low-coverage and *not* "the block working"; **Phase B lifts precision to OL-C3 level by
  model-maintaining the outstanding-question state asynchronously** (never on the synchronous deny
  path — the deny reads cached state, NF-1). AC-12 is corrected to claim only the deterministic
  parts model-free; AC-2a-ii's substantive-vs-deferral discrimination is a Phase-B criterion.
  **The cache is eventually-consistent, and its lag has *two* sources — `transcript_path`'s
  documented async-write lag *and* the deeper one, *classifier scheduling* (the async model may not
  have run for the newest turn)** — both owned as an expected FR-M2 fault source. **The lag-window
  lean is set opposite to the steady-state clear-axis: hold/deny, don't pre-clear on unclassified
  text (FR-B1)** — because the wrongful deny of a just-answered agent self-recovers in one
  round-trip while a missed drifter does not, and "assume in-flight text answers" would miss the
  narrate-then-write agent the block exists to catch. D-41 also splits FR-B2's contract-verified fact
  (reason returned to the model) from the model-behavior *hope* (it answers rather than retries),
  measured by the deny-loop signal (FR-M4), not contract-guaranteed. *Job in one line:* the
  honest-limits discipline (D-40) had named which *writes* get caught but not whether the block can
  *tell it should fire at all* model-free — D-41 names that layer, its phasing, and its lag lean.

## 13. What is genuinely open

Two items are genuine external unknowns this spec cannot close by decision. Both are
stated where they bear on a requirement, and neither gates v1's design.

**One unconfirmed harness behavior.** The hooks contract was re-verified against current
source on 2026-08-25 (§9, FR-O2): the event set, the `PreToolUse` `additionalContext`
affordance, the `PreToolUse` deny returning `permissionDecisionReason` to the model *as the tool
result* (so a text answer is always reachable; the docs' "avoids retrying" is a design intent, not
a behavior guarantee — FR-B2/D-41), the `Stop`/`SubagentStop` **`additionalContext`** channel and
continuation with the `stop_hook_active` + 8-continuation bound, `transcript_path` on every event
(with the documented caveat that it is **written asynchronously and may lag** the in-memory
conversation — bearing directly on the answer-drift clear-axis, FR-B1/D-41), `last_assistant_message`
being Stop-only, the subagent `agent_id`/`agent_type` fields, and the timeouts are all confirmed —
as are `PostToolUseFailure` and `PermissionRequest` as real events. The one thing the documentation does **not** state is whether a subagent hook's
`additionalContext` propagates to the parent; the spec assumes it does **not** (C-4), and a
pre-design spike showing otherwise only adds an option, it removes nothing.

**Thin-history repositories are a known limit, not a defect.** On a thin-history repository
the history-derived genres are thinner until the evidentiary corpus grows; the structural,
reuse, consequence, conformance, and answer-drift behaviours still operate, and
completion-check catches *unverified*, not the general *unfinished* (D-27).

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
  agent could not cheaply self-serve — a coupling whisper about an obvious same-directory,
  same-name pair does **not** count as a pass.
- **AC-1a (orientation → FR-A2a, D-26).** On a prompt for a task with known structure, the
  Orientation whisper headlines the **2–4 entry-point files and the one binding invariant**;
  it does **not** deliver task-shape landmines (those belong at the edit, FR-A2e).
- **AC-1b (reuse → FR-A2c, P5).** On a search/read for functionality with a known canonical
  helper, the Reuse whisper headlines the **convention** ("the canonical helper is `X`; most
  call sites use it"), not bare existence; a whisper that only states a symbol exists fails.
- **AC-1c (consequence → FR-A2d, P5, HERZIG).** On an edit about to run in a file with known
  historically-coupled tests, the Consequence whisper headlines those **coupled tests and
  the zone flag**; a whisper whose headline is a raw grep-able call-site count fails.
- **AC-1d (completeness → FR-A2f, FR-B4).** On an edit that completes one half of a
  historically-paired change, the Completeness whisper names the **unchanged partner** with
  its co-change ratio, delivered at the stop via a single self-releasing Stop-time injection
  (FR-B4 — `additionalContext` or a one-cycle continuation), not a block.
- **AC-2 (no pre-emptive gate / no mutation, structurally → FR-B3, D-9, OL-C2, OL-R4).**
  No code path emits a `permissionDecision: "deny"` *pre-emptively* — before the agent has
  taken an action that violates one of the two confirmed conditions (FR-B1) — nor gates on a
  plan/test, nor blocks a generated-file edit; and no code path mutates the repo or an
  action's input (`updatedInput`/`updatedToolOutput` never used to change what a tool does).
  A deny is reachable **only** on the FR-B1 answer-drift and skill-non-conformance paths. A
  control-flow assertion (the deny's only call sites are the two FR-B1 recognizers), not a
  field-scan.
- **AC-2a (answer-drift *deny plumbing* — denies writing code, not reads/executions — given a
  known outstanding-question state → FR-A2l, FR-B1, FR-B2, OL-C3, D-39, D-41).** This exercises the
  Phase-A **plumbing** with the outstanding-question state **fixture-controlled** (the *recognizer's
  precision* — correctly deciding a question is open/answered — is separately AC-2a-ii, Phase B). In
  a fixture where a question is marked outstanding and the agent, instead of answering, takes a
  **repository-mutating action** (a Write/Edit, or a work-doing Task spawn), that action's
  `PreToolUse` is **denied** with a reason naming the outstanding question; **a *further* mutation still without answering is denied the
  same way**, so a persistent code-writer cannot proceed by retrying (it holds "until it actually
  answers" with no counter, no `stop_hook_active`, no held turn). **Reads and executions-to-answer
  are not denied:** in the same unanswered state, a `Read`/search **and a command run to get the
  answer** (running the test to see if it passes) are **allowed** — the agent needs them to answer
  truthfully — so the block never deadlocks the path to an answer nor forces a fabricated
  completion claim (the F-1 deadlock/forced-lie case). Once the agent **answers in text
  substantively** (never a tool action, so never itself denied) its next mutation is **allowed**.
  The deny never lands on a `Stop`; it clears the instant the question is substantively answered —
  a complying agent is never stranded *when compliance is correctly recognized* (a misrecognition
  is the FR-M2 "deny outlives its condition" fault, FR-B2). **Named limit:** a mutation performed
  through a Bash command is not denied by the Phase-A recognizer (§11.5, AC-12).
- **AC-2a-i (answer-drift is main-agent-scoped; clearly-work delegation is closed, research-framed
  is a named residual → FR-A2l, FR-B1, FR-O6).** With the main-session question outstanding: a
  **subagent's** `PreToolUse` is **not** denied for it (the subagent never received it and could
  not answer — per-consumer scope, FR-O6); and the main agent **cannot escape by delegating the
  *work*** — a spawn whose task is clearly to do the work is denied while the question is
  unanswered, like a direct Write/Edit. **Named residual (not claimed closed):** a spawn *framed as
  research* ("investigate the failing test and prepare the fix") sits on the same ambiguity seam as
  Bash-channel writes; the fixture asserts the clearly-work spawn is denied and records that
  research-framed delegation is a monitored residual, not a closed dodge.
- **AC-2a-ii (multi-question / partial answer / substantive-clear — a *Phase-B* criterion →
  FR-A2l, FR-B1, FR-B5, D-41).** Where the user asked two questions and the agent answers one then
  writes code, the block **does not release** for the still-open question; a **content-free
  deferral** ("I'll get to that") does **not** clear it; but a **substantive** answer that addresses
  the question **does** clear it even if imperfect (FR-B5 errs toward clearing on substance so a
  compliant answerer is never stranded — Max re-asks if inadequate); each outstanding question
  clears independently. **This discrimination is a comprehension judgment, so it is a Phase-B
  acceptance criterion** (the model-maintained outstanding-question state, §11.5) — Phase A's
  conservative recognizer is not expected to pass it; asserting it against the model-free skeleton
  would be the overclaim D-41 exists to prevent.
- **AC-2b (skill non-conformance steer→block → FR-A2k, FR-C3, FR-B1, FR-C1a, OL-C2).** With a
  fixture skill structure loaded **whose deviated step is one of the block's real enforceable core
  (FR-C1a) — e.g. the mandatory review/collapse-hunt dispatch, or read-before-plan — not a toy step
  with a trivial post-condition**: when the agent deviates, the oracle first steers by whisper; when
  the agent then takes an action that skips that step **without a stated reason** (or steering
  hasn't worked), that action's `PreToolUse` is **denied** with a reason naming the skipped step;
  when the agent gives a reason or performs the step, its next action is **allowed**. It never denies
  pre-emptively (before a deviation) and never as a "pass a test to proceed" gate. Anchoring the
  fixture to a real high-value step is required so a passing AC certifies enforcement Max cares
  about, not an abstract "fixture skill structure."
- **AC-2c (each block's precision is calibrated by its own cost function → FR-B5, FR-C4, FR-L6,
  FR-M2).** *Over-fire (both blocks, automated):* in a fixture where the agent **did** answer
  (reworded) and **did** follow the step (valid but unusual), **no deny fires**; and a `Read`/
  search taken while a question is unanswered is **not** denied (information-gathering, AC-2a). An
  induced wrongful deny is surfaced (FR-M2) on the **wrongful-deny rate**, and a compliant agent
  never performs ceremony to escape a deny it should not have received. *Under-fire, answer-drift
  (human channel):* in a fixture where the agent writes code (a repository mutation) with the
  question unanswered and no deny fired, a **FR-L6 human correction** records the miss and
  **outranks the recognizer**, so
  the identical deviation is thereafter denied — the guard is human because Max **sees** his own
  unanswered question. *Under-fire, skill block (automated — Max is blind here, OL-11):* in a
  fixture where a skill step was **due** and its **observable post-condition is absent** yet no deny
  fired — including the hard case where the agent took an action the deviation recognizer
  *misclassified as completing the step* — the **automated missed-skill-block detector** (FR-C4,
  verifying the post-condition **directly against store/repo state**, not via the action classifier)
  records a miss on the **missed-skill-block rate** in `status` **with no human correction in the
  fixture at all** — proving the err-toward-restraint bias cannot silently ratchet OL-C2 enforcement
  to never-firing where Max could never catch it. (A step with no checkable post-condition is out of
  this detector's reach — a stated FR-C4 limit, asserted by the fixture, not hidden.) *(The two under-fire guards differ on purpose:
  D-35/FR-B5 — human where the miss is owner-visible, automated where it is not; contrast AC-16/
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
- **AC-5 (session boundaries → FR-A4, D-20).** `resume`/`fork` reseed dedup; `compact`
  clears the read-set; `clear`/`startup` clean.
- **AC-6 (corpus floor, no adoption window → FR-A6).** Below the corpus floor history
  genres stay silent; a rich-history session fires regardless of how few sessions have
  occurred.
- **AC-7 (pristine tree → P8, FR-X5, D-9).** After `init`/`index`/session/`deinit` the tree
  differs only by the removed hook wiring.
- **AC-8 (completion check → FR-A2g, FR-B4, OL-12).** At a recognized completion-claim stop
  with the region's test not run, the whisper fires via **a single self-releasing Stop-time
  injection** (FR-B4 — `additionalContext` or a one-cycle continuation), then the stop proceeds;
  it is a whisper, not a block, and does not fire merely to name a test that ran. **Content assertion (verifies the S3 marginal-value fix):** the emitted
  whisper must **headline the covering-test → changed-region mapping** (the fact the agent
  lacks); a whisper whose headline is only the run-state ("your test was not run"), with no
  covering-test mapping, **fails** AC-8 (P5, FR-D1).
- **AC-8a (outstanding-question line at done-claim → FR-B4, D-40, D-41, OL-12).** In a fixture where
  a Max question is still unanswered at a completion-claim stop (the agent reached "done" via a path
  the answer-drift block did not catch — an interpreter-mediated Bash edit or a research-framed
  subagent), the completion whisper **also carries an outstanding-question line** naming the
  unanswered question; it is **delivery, not a block** (the stop still proceeds). Where no question
  is outstanding, no such line appears. **Asserted honestly:** this backstop chains **two**
  conservative recognizers — the done-claim recognizer (errs toward not-firing) and the
  answered-recognizer (Phase-A conservative until the Phase-B model-maintained state, D-41) — so for
  the common Phase-A case (interpreter-write, never-answered) it may **not** fire; the fixture
  verifies the line appears when both recognizers *do* fire, and records that the backstop is
  best-effort, not a guarantee that every dropped question is surfaced.
- **AC-9 (self-observability → FR-M1–M5).** Induced hook-not-firing, latency breach,
  produced-but-undelivered whisper, **a deny that outlives its condition** (the oracle keeps
  denying after the agent has answered / followed the step), **a corrupted store**, and
  **a stale index** each appear in the log and `status` as a self-detected failure class (the
  store-corruption and index-staleness inductions verify the two FR-M2 classes that FR-K7's
  "staleness lowers confidence" does *not* cover — detecting and surfacing the fault, distinct
  from down-weighting a stale fact); an induced **missed skill-block** — a skill step due with its
  **observable post-condition absent** and no deny, **including the case where the agent took an
  action the deviation recognizer misclassified as completing the step** — also appears as a
  self-detected class via the FR-C4 post-condition detector; per-genre
  volume, false-fire rate, **denies issued, the wrongful-deny rate, and the missed-skill-block
  rate**, and **any active suppressing condition** are
  reported; **the regret rate is shown labelled "held-but-unspoken only" and paired with the
  seeded-coverage result (or "coverage not measured live")** (FR-M4 / AC-18) so a low regret rate
  is never displayed as total false-silence; `log` reads back each whisper and deny.
- **AC-10 (fail-open → FR-O3, NF-1).** Induced failure/timeout → silence and, on a block
  path, no deny is emitted so the agent's action proceeds (no stuck deny); p95 ≤ 1.5s, none
  over 3s.
- **AC-11 (security → FR-X1–X8, T1–T4).** Planted secret redacted everywhere; injection-
  suspect content pointer-only and never obeyed; low-trust origin never yields a
  high-confidence whisper; no credentials, no network beyond the model piggyback.
- **AC-12 (degraded mode → FR-J2, FR-J3, OL-2, D-39, D-41).** Model path down: the deterministic
  genres and the answer-drift block's **deterministic parts** still work — the deny **plumbing** and
  **write-target typing** (Write/Edit; syntactically-explicit Bash writes once added) run with no
  model, and the block **fails safe** (its conservative recognizer denies rarely, so degraded mode
  never turns it into a deadlock). **Asserted honestly, NOT overclaimed:** the fixture verifies only
  that (a) the deterministic plumbing/typing operates model-free and (b) no model-free genre is
  switched off — it does **not** assert "the block works," because the block's OL-C3-serving
  *precision* (firing/clearing comprehension) is Phase-B model-maintained state (§11.5) and is
  degraded-mode-unavailable; and it does **not** assert Bash-interpreter-write or research-delegation
  coverage (permanent / residual limits, FR-B1). The point of the fixture is that the degraded path
  is safe and honest, not that it enforces OL-C3.
- **AC-13 (store hygiene → FR-K2–K7).** Merge commit, >~30-entity transaction, and
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
  **no network egress** occurs during export or import (FR-X7). (Closes the acceptance-coverage
  gap on FR-K9 and the AC-19 numbering gap.)
- **AC-20 (cold container + FTS mechanism → C-1, C-2, C-3).** Install + first index in a
  sandbox with no native toolchain beyond the chosen SQLite path; the C-2 full-text-search
  mechanism functions under those constraints.
- **AC-21 (recursion guard → FR-J4, D-6).** A model-using genre whose own model call emits
  hook events does **not** trigger a further oracle invocation on those events; an induced
  self-trigger terminates at the guard with **no unbounded hook→model→hook chain** and the
  event is logged (FR-M1). A safety criterion, not a latency one.
- **AC-22 (task-boundary only, no idle timers → FR-O5, CHI).** The oracle fires only on a
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

**Phase-B and Phase-C acceptance (explicit, not omitted).** The model-dependent genres
FR-A2h/FR-A2i/FR-A2j/FR-A2m (and any recognizer the honest notes in §4/FR-A2g and §11.5
routed to Phase B — the model-assisted completion-claim/answer-addressed recognizers) are
Phase B; their
behaviour-specific thresholds are set from Phase A
exit data (§11.5), so their genre-specific acceptance criteria are authored with the Phase B
architecture, **not** left undefined here. They still inherit, from day one, the
whisper-well-formedness bar (AC-14) and the marginal-value/pointer discipline (P5, FR-D1).
The Phase-C corrective feature's acceptance is **AC-2b and the skill-block (under-fire) clause of
AC-2c** (both Phase C — the FR-C1–C4 machinery). AC-2c's answer-drift clauses split by phase:
over-firing (reads/executions not denied) is Phase A, but the substantive-vs-deferral discrimination
it and AC-2a-ii rest on is **Phase B** (D-41). This is a stated scope boundary, so a reviewer does
not read the absence of A2h/i/j firing criteria — or the phase-split of the answer-drift ACs — as an
oversight.

---

*End of spec. Its foundation is `OWNER-LEDGER.md` CONFIRMED (OL-1…OL-12, OL-C1…OL-C4;
OL-R1…OL-R4 for what is rejected) plus the mission. Verification recency is per the §9
table: most external premises confirmed 2026-08-25, `[NODE-SQLITE]` and `[ROSE]` on
2026-08-16, `[MSR]` grounded via `[HERZIG]`.*
