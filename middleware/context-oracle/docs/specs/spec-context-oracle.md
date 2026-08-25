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
before you may proceed" checkpoint), which Max rejected `[OL-C2, OL-R4]`.

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
- **Blocking in the two confirmed cases**, via the harness Stop-continuation (§8):
  - **Answer-drift block `[OL-C3]`:** when Max asks a question and the agent ignores
    it, hold the agent until it answers. (His words: *"the oracle should block that
    motherfucker until it stops ignoring me and actually answers. just dont make a
    convoluted fucked up way that its done."*)
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
  enough plan to proceed. […] literally every bit if it was terrible and didnt work"* —
  OL-C2 verbatim, elision marked) `[OL-C2]`. Blocking *is* in
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
| **FR-A2g Verification / completion check** | A recognized completion-claim stop | The fact the agent lacks at "done": **which test covers the changed region** — headlined by that covering-test *mapping*, with the observation that it has not been run against this change. The mapping is the non-trivial part; run-state alone is self-evident to the agent and, per P5, never stands alone as the whisper. (Completion claim recognized via `last_assistant_message`, `[HOOKS]`.) **Honest limit:** catches *unverified* (a covering test exists and was not run); *unfinished* only where it coincides with that or a broken co-change pair (FR-A2f). The general "did not finish" case (OL-12) is not deterministically catchable and routes to Phase B `[OL-12, D-27]`. |
| **FR-A2h Assumption check** | Agent narration | "Your narration assumes X; the repo says Y at `file:line`." (Model-dependent — Phase B.) |
| **FR-A2i Steering (whisper)** | Agent narration | "What you're describing lives in `src/…`, not where you're looking." (Model-dependent — Phase B.) |
| **FR-A2j Answer** | A repo-answerable question in narration | The repo-grounded answer with a pointer. (Model-dependent — Phase B.) |
| **FR-A2k Process conformance → BLOCK** | An owner expert-tool skill is active | Whether the agent's actions match the skill's steps. **Steers first; escalates to a BLOCK** when the agent skips a step without a stated reason, or steering isn't working `[OL-C2]` (§8, §11.4). **Non-primary in *purpose*** (per OL-C2 the design invests little here and it fires sparingly); the block itself is a **high-severity mechanism** — "non-primary" bounds its ambition and firing eagerness, not its stakes (M1, §11.4). |
| **FR-A2l Answer-drift → BLOCK** | A question the user asked goes unaddressed | Holds the agent (blocks the turn from ending) until it answers the user's question `[OL-C3]` (§8). Answer-drift entered scope *advisory* under OL-9; **OL-C3 (2026-08-16) superseded that for this case and made it a block** — so the block is authorised by OL-C3 alone, not OL-9. Simple mechanism, no ceremony. |

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
  corruption, index staleness, model path down, whispers produced-but-undelivered, and
  **a block that failed to lift** (a block that outlives its condition is itself a
  failure to surface — it must never strand the agent).
- **FR-M3 — Correct silence is announced** `[D-22]`.
- **FR-M4 — `ctxoracle status`** — plain-language health, whisper count, per-genre
  volume, false-fire rate, blocks raised/lifted, active suppressing condition `[OL-10]`.
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

The oracle uses the harness **Stop-continuation** primitive `[HOOKS]` — a `Stop`/
`SubagentStop` hook can keep the turn from ending — in **two distinct ways the spec keeps
separate**: (1) **enforcement blocks** that hold the turn *until a condition clears* (the
two confirmed cases, FR-B1), and (2) a **single self-releasing continuation** used only to
*deliver* a Stop-time whisper (FR-B4). Both avoid any deny path on a tool call and never
touch the repo.

- **FR-B1 — Enforcement blocking exists in exactly the two confirmed cases** `[OL-C2,
  OL-C3]`. An enforcement block holds the turn *until its condition clears*:
  - **Answer-drift (FR-A2l):** on a `Stop` where a question the user asked is still
    unaddressed, hold the turn (continue) until the agent answers.
  - **Skill non-conformance (FR-A2k):** while an expert skill is active and the agent
    deviates, steer by whisper first; on a `Stop` (or the skill's step boundary), block
    when the agent skipped a step without a stated reason, or steering has not worked.
  - Both are **reactive** — they trigger on a real deviation, never as a pre-emptive
    checkpoint.
- **FR-B2 — Every enforcement block is escapable and self-limiting (`FR-O4a`, the
  one-continuation bound).** A block holds only until its condition clears (question
  answered; step followed or a reason given) and is bounded by `stop_hook_active` so it
  cannot chain into a wall `[HOOKS]`; the agent is never permanently stranded, and FR-M2
  surfaces any block that fails to lift. Keep the mechanism simple `[OL-C3]`.
- **FR-B4 — Stop-time whisper delivery is a single self-releasing continuation, NOT a
  block.** The completion-check (FR-A2g) and Completeness (FR-A2f) genres fire *at a
  `Stop`*, and the only Stop-time channel that reaches the agent is a continuation — so
  delivering their whisper means continuing **once** to inject the fact, after which the
  agent proceeds or re-stops. It gates on **no condition** and never holds beyond that one
  cycle (bounded by `stop_hook_active`, `FR-O4a`). This realises OL-12 (the oracle *speaks*
  at a done-claim) and is deliberately distinct from the FR-B1 enforcement blocks — it is
  *delivery, not enforcement*; AC-8 verifies it releases after a single cycle `[OL-12,
  HOOKS]`.
- **FR-B3 — What stays structurally impossible (`FR-O4`, the no-deny-path guarantee).** No
  code path performs a **pre-emptive gate** (blocking a tool call / requiring the agent to
  pass a test or prove a plan before proceeding) `[OL-C2]`, a **generated-file block**
  `[OL-R4]`, a **repository mutation** (`updatedInput`, `updatedToolOutput`) `[D-9]`, or a
  **tool-call deny/ask/defer** (`permissionDecision`). Forward progress is never *held*
  beyond the single self-releasing whisper-continuation of FR-B4 except on the two reactive
  enforcement conditions of FR-B1. *(The `FR-O4`/`FR-O4a` labels are retained here for the
  no-deny-path and one-continuation-bound properties that `CLAUDE.md`, `RETHINK.md`, and the
  Phase 0 spec cite by those IDs; the properties are realised by FR-B2/FR-B3/FR-O3.)*

- **FR-O2 — Delivery-capable events and mechanism (C-4, `[HOOKS]`, re-verified
  2026-08-25).** Model-visible context returns via structured
  `hookSpecificOutput.additionalContext` on the tool events, and via plain stdout on
  `UserPromptSubmit`, `UserPromptExpansion`, and `SessionStart` only. A `PreToolUse` hook
  may return `additionalContext` **without** any `permissionDecision`, injected before the
  tool runs and preserved even if that tool call later fails — the passive-whisper
  affordance (confirmed against the current hooks reference and the Claude Code
  `additionalContext`-on-`PreToolUse` behavior). `PostToolUse` carries `additionalContext`
  the same way. `Stop`/`SubagentStop` expose `last_assistant_message` and can continue
  (hold) the turn — used both for enforcement blocks (FR-B1) and for single-cycle
  Stop-time whisper delivery (FR-B4). Hooks fire inside subagents carrying
  `agent_id`/`agent_type`; whether a subagent hook's `additionalContext` propagates to the
  parent is **not documented and assumed not** (§13). `PostToolUseFailure` and
  `PermissionRequest` are confirmed events in the current contract (the oracle emits no
  `permissionDecision` on any of them — FR-B3).
  Timeouts (2026-08-25): `command`/`http`/`mcp_tool` 600s (lowered to 30s under
  `UserPromptSubmit`), `prompt` 30s, `agent` 60s; `SessionEnd` hooks share a **1.5s
  budget, raised to match a longer per-hook `timeout` up to 60s**.
- **FR-O3 — Fail open, fast** `[OL-3]`. Any shim/service error, timeout, or missing
  store yields silence (and, for a block, lets the turn end) — never an error in the
  agent's flow. A latency discipline (NF-1).

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
  1.5s, hard ceiling 3s**, then silence and carry to the next event. A model call cannot
  sit on the synchronous hook path — cold model-spawn cost is **assumed to be several
  seconds and is validated by the Phase-0 model-piggyback spike CLAUDE.md already mandates**
  (not yet a recorded measurement) — so model-using genres run off it (§11). The numbers are
  `[D-31]`, not the owner's; the fail-open behaviour is `[OL-3]`.
- **C-6 — Language coverage is broad and extensible, not a fixed short list `[D-15]`.**
  A hardcoded N-language list is an anti-feature: the mission is language-general (a
  decision-changing fact is not English-only, nor tied to three languages), and a fixed
  cap is an **arbitrary limit of exactly the kind `[OL-C1]` disfavours**. So the oracle
  reads a broad set of languages behind a **language-agnostic interface**, and adding a
  language is a configuration/extension act, not a redesign. The concrete initial set is
  the architect's to maximise within the interface. *(This is an architect judgment
  `[D-15]`, not an owner decision — see the PENDING language-coverage item in
  `OWNER-LEDGER.md` for Max's own words on the subject, which are not yet CONFIRMED.)*

---

## 9. Standards and evidence base

Every source below was confirmed against its current primary/authoritative source; the
**Verified** column gives the date each was checked. Where a citation grounds a design
number rather than a hard requirement, that is noted at the requirement, not softened here.

| Key | Standard / source (as verified) | Governs | Verified |
|---|---|---|---|
| `[HOOKS]` | Claude Code hooks reference, `code.claude.com/docs/en/hooks` (event set; `PreToolUse` `additionalContext` optional & separate from `permissionDecision`; `Stop`/`SubagentStop` continuation + `last_assistant_message`; subagent `agent_id`/`agent_type`; timeouts) | Observation, delivery, block (C-4, §8) | 2026-08-25 |
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
  the service returns (FR-O2), including a continuation on a block (FR-B1).
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

### 11.3 Learning loop — de-noise in both directions

- **FR-L1 — Session log** per event: candidates, whisper/block, uptake evidence; no
  automated uptake judgment in Phase A `[D-12]`.
- **FR-L3 — Demotion** of measured false-firers `[TRICORDER, CACM]`; never silences a
  correct whisper `[OL-C1, P7]`.
- **FR-L3b — Promotion / re-exploration (the anti-ratchet)** `[D-25]`: a suppressed
  channel is periodically re-admitted to re-measure value and re-promoted when earned;
  the loop cannot converge to silence. Mechanism the architect's; existence required.
- **FR-L6 — Human statements are first-class facts** — a CLI correction/fact outranks
  mined inference and is Phase A's calibration signal (§5.2).
- **FR-L7 — Fact routing**: repo facts → project store; efficacy → global store `[OL-6]`.

### 11.4 Corrective / steering feature (non-primary in purpose — and it blocks)

**On "non-primary" vs a blocking capability (M1).** OL-C2 makes this feature *non-primary in
purpose*: the design invests little in it, it fires sparingly, and it holds no precedence
over any genre (P9). That constrains its **ambition and firing eagerness — not its stakes**.
The block it can raise is inherently a **high-severity mechanism** (it halts the agent); the
feature being non-primary does not make its block low-stakes, and the spec does not treat the
two as the same axis. It is also the most machinery-heavy behaviour (FR-C1/C2 encode each
skill's structure) and is deferred to Phase C accordingly.

- **FR-C1 — Expert-tool awareness `[OL-C2]`.** The oracle is given the *structure* of
  Max's expert dev-tool skills — per skill: how activation is detectable, the steps it
  defines, the expected agent action per step.
- **FR-C2 — Deterministic trigger, no hand-coded rule piles `[OL-C2]`.** The trigger is
  the structured skill definition (active? which step? expected action?), not a growing
  set of hand-written heuristics.
- **FR-C3 — Steer, then block — but never a pre-emptive gate `[OL-C2, OL-3]`.** On a
  deviation it **whispers to steer** first; it **escalates to a block** (FR-B1) when the
  agent skips a step without a stated reason or steering isn't working. It is **not** the
  rejected "prove your plan / take a test to proceed" checkpoint, it never blocks forward
  progress pre-emptively, and it is weighted as one ordinary input — no precedence (P9).
  Small / personal / non-primary.

### 11.5 Build order (phases within one spec)

- **Phase A — Deterministic core.** Model-free genres (Orientation entry-points,
  Coupling, Reuse, Consequence, Warning ⚠ with FR-A5a flags, Completeness,
  Verification/completion-check), the **answer-drift block** (deterministic — detect an
  unaddressed user question, hold via continuation), the stores/index/miner, delivery,
  self-observability, security, and the human-correction calibration channel. Exits by producing measured whisper/block + false-fire data on a real repo.
- **Phase B — Model-in-the-loop genres.** Assumption-check, Steering, Answer, and the
  broader completion "unfinished" judgment — off the synchronous path (NF-1).
- **Phase C — Automated learning loop + the corrective/skill feature (FR-C1–C3, the
  skill non-conformance steer-then-block).** Needs the skill structures encoded and A/B
  delivery in place, plus the demotion+promotion ladder.

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
  anti-arbitrary-limit principle `[OL-C1]`; a fixed short list is an architect-rejected
  anti-feature, not an owner decision. Max's own words on the subject are recorded PENDING
  in `OWNER-LEDGER.md` (not CONFIRMED); the spec does not attribute this choice to him.
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
- **D-32 — The blocking model is exactly Max's two cases, realised via the harness
  Stop-continuation, always reactive and self-lifting (§8, FR-B1–B3).** *Job (an
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
- **D-34 — Stop-time whisper delivery (FR-B4) is a single self-releasing continuation,
  distinct from the FR-B1 enforcement blocks.** *Job:* let the oracle *speak* at a done-claim
  (OL-12) using the only Stop-time channel — a one-cycle continuation — without that counting
  as one of the two confirmed enforcement blocks. Separating delivery from enforcement keeps
  FR-B1's "exactly two blocks" true and honest.

## 13. What is genuinely open

Two items are genuine external unknowns this spec cannot close by decision. Both are
stated where they bear on a requirement, and neither gates v1's design.

**One unconfirmed harness behavior.** The hooks contract was re-verified against current
source on 2026-08-25 (§9, FR-O2): the event set, the `PreToolUse` `additionalContext`
affordance, the `Stop`/`SubagentStop` continuation, the subagent `agent_id`/`agent_type`
fields, and the timeouts are all confirmed — as are `PostToolUseFailure` and
`PermissionRequest` as real events. The one thing the documentation does **not** state is
whether a subagent hook's `additionalContext` propagates to the parent; the spec assumes it
does **not** (C-4), and a pre-design spike showing otherwise only adds an option, it removes
nothing.

**Thin-history repositories are a known limit, not a defect.** On a thin-history repository
the history-derived genres are thinner until the evidentiary corpus grows; the structural,
reuse, consequence, conformance, and answer-drift behaviours still operate, and
completion-check catches *unverified*, not the general *unfinished* (D-27).

No CONFIRMED owner question is open: answer-drift is in scope and blocks (`[OL-C3]`),
uncertain hazards are voiced-flagged (`[OL-C4]`). **One owner item is PENDING, not open in
the spec:** Max's own words on language coverage are recorded PENDING in `OWNER-LEDGER.md`
awaiting his sign-off; the spec does not depend on them — C-6 stands on architect judgment
`[D-15]` and `[OL-C1]` regardless of how that ballot resolves.

---

## 14. Acceptance criteria

Each names the requirements it verifies; all use fixture repositories and replay. **v1 is
complete when every criterion passes on a real repository and `ctxoracle status` reports a
clean session.**

- **AC-1 (coupling → FR-A2b, FR-D3, NF-1).** A known co-change pair: a completed read of
  one file yields a coupling whisper naming the other, with evidence ratio and pointer,
  within latency.
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
  its co-change ratio, delivered at the stop via a single self-releasing continuation (FR-B4).
- **AC-2 (no pre-emptive gate / no mutation, structurally → FR-B3, D-9, OL-C2, OL-R4).**
  No code path blocks a tool call pre-emptively, gates on a plan/test, blocks a
  generated-file edit, or mutates the repo (`updatedInput`/`updatedToolOutput`/
  `permissionDecision` never emitted). A control-flow assertion, not a field-scan.
- **AC-2a (answer-drift block → FR-A2l, FR-B1, FR-B2, OL-C3).** In a fixture where the
  user asked a question and the agent tries to stop without addressing it, the oracle
  holds the turn (continues) until the agent answers; once answered (or a reason given),
  the block lifts; it is bounded by `stop_hook_active` and never strands the agent.
- **AC-2b (skill non-conformance steer→block → FR-A2k, FR-C3, FR-B1, OL-C2).** With a
  fixture skill structure loaded: when the agent deviates, the oracle first steers by
  whisper; when the agent skips a step **without a stated reason** (or steering hasn't
  worked), it blocks; when the agent gives a reason or resumes the step, the block lifts.
  It never blocks pre-emptively (before a deviation) and never as a "pass a test to
  proceed" gate.
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
  with the region's test not run, the whisper fires via **one self-releasing continuation,
  then the stop proceeds** (FR-B4 — a whisper, not a block); it does not fire merely to name
  a test that ran. **Content assertion (verifies the S3 marginal-value fix):** the emitted
  whisper must **headline the covering-test → changed-region mapping** (the fact the agent
  lacks); a whisper whose headline is only the run-state ("your test was not run"), with no
  covering-test mapping, **fails** AC-8 (P5, FR-D1).
- **AC-9 (self-observability → FR-M1–M5).** Induced hook-not-firing, latency breach,
  produced-but-undelivered whisper, and **a block that fails to lift** each appear in the
  log and `status`; per-genre volume, false-fire rate, and blocks raised/lifted are
  reported; `log` reads back each whisper and block.
- **AC-10 (fail-open → FR-O3, NF-1).** Induced failure/timeout → silence and the turn
  ends (no stuck block); p95 ≤ 1.5s, none over 3s.
- **AC-11 (security → FR-X1–X8, T1–T4).** Planted secret redacted everywhere; injection-
  suspect content pointer-only and never obeyed; low-trust origin never yields a
  high-confidence whisper; no credentials, no network beyond the model piggyback.
- **AC-12 (degraded mode → FR-J2, FR-J3, OL-2).** Model path down: deterministic genres and
  the answer-drift block still work; no model-free genre switched off.
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
- **AC-18 (exit run produced evidence → §1, FR-M4).** The exit run's `status` reports its
  whisper/block count; a zero-result run does not pass.
- **AC-20 (cold container + FTS mechanism → C-1, C-2, C-3).** Install + first index in a
  sandbox with no native toolchain beyond the chosen SQLite path; the C-2 full-text-search
  mechanism functions under those constraints.

---

*End of spec. Its foundation is `OWNER-LEDGER.md` CONFIRMED (OL-1…OL-12, OL-C1…OL-C4;
OL-R1…OL-R4 for what is rejected) plus the mission. Verification recency is per the §9
table: most external premises confirmed 2026-08-25, `[NODE-SQLITE]` and `[ROSE]` on
2026-08-16, `[MSR]` grounded via `[HERZIG]`.*
