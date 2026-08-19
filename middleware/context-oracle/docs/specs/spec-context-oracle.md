# Spec: Context Oracle (`ctxoracle`) — v1 (rebuilt 2026-08-16)

**Status:** draft for owner review. Ground-up rebuild requested by Max Cogar on
2026-08-16, replacing the prior `spec-context-oracle.md` and
`spec-context-oracle-phase0.md`. Every requirement traces to a confirmed owner
decision (`OWNER-LEDGER.md`), a named and current-verified standard, or a recorded
judgment (§12). Nothing attributed to Max Cogar appears here unless it is CONFIRMED
in `OWNER-LEDGER.md`. This revision applies all findings from the two independent
reviews of 2026-08-16 (`docs/reviews/2026-08-16-*`).

**Provenance keys.** `[OL-n]` / `[OL-Cn]` = a CONFIRMED owner decision in
`OWNER-LEDGER.md`. `[D-n]` = a judgment made while writing this spec, reasoning in
§12. Standard keys (e.g. `[ROSE]`, `[HOOKS]`) resolve in §9. Every external fact was
verified against its primary source **on 2026-08-16** unless the §9 row marks it
"prior pass; re-confirm at build" (a Gate-B obligation carried openly, §13).

**What this document is.** It defines *what* the oracle must do and the properties
it must hold. Component boundaries, storage engines, IPC, algorithms, and the exact
numeric form of any threshold are the architect's, except where a constraint is
itself a requirement (§8).

**Requirement numbering.** IDs are stable mnemonics, not a contiguous sequence;
gaps (e.g. no FR-A3) are intentional and carry no hidden requirement `[D-23]`.

---

## 1. Problem and mission

Coding agents under-read the codebase, misjudge when their context is sufficient,
and fill the gaps with plausible inventions. The knowledge that would prevent this
— which files change together, which edits have historically broken which tests,
the non-local convention, the second write-site, the landmine — is discoverable
only from history and structure the agent does not consult at the moment it
decides. Front-loaded "briefing" approaches pay their full token cost regardless of
what fraction is needed and decay in salience as the session grows
(`RETHINK.md` §2.4).

**Mission (verbatim, the anchor for every requirement):**

> Deliver the fact that would change the agent's next decision, at the moment of
> that decision, without being asked.

The Context Oracle is a passive, repository-resident intelligence. It observes a
Claude Code session through lifecycle hooks and, at decision moments, injects a
small advisory **whisper** — one fact, with a verifiable pointer — when it knows
something the agent almost certainly does not and that would change what the agent
does next. It never blocks, never mutates the repository; its worst case is a
wasted sentence `[OL-3]`.

**The mission's asymmetry (load-bearing for §5).** Because a wasted whisper costs
"a wasted sentence" `[OL-3]` while a *missed* decision-changing fact costs the
mistake the tool exists to prevent, **false silence is the more expensive error
than false speech.** The relevance machinery (§5) is built around that asymmetry,
not against it.

**For whom.** A single developer (Max Cogar) working solo across his own
repositories — many of them young, with thin history — driving agents through
Claude Code `[OL-6, OL-11]`. Not a team tool; no sharing surface in v1.

**Why it is worth building.** The scarce, valuable knowledge is exactly what an
agent cannot surface from a cold checkout with its own tools; delivering it at the
decision point, and nowhere else, is the difference between guidance that is used
and a binder that is ignored (`RETHINK.md` §2.3).

---

## 2. Scope

### 2.1 In scope (v1)

- A CLI, `ctxoracle`, and the hook shims that wire it into a Claude Code session
  `[OL-1]`.
- Passive observation of the session, and delivery of whispers as injected context,
  to the **main agent and to subagents** `[OL-8]`.
- The whisper **genres** of §4, delivered under the single relevance machinery of
  §5.
- Two persistent **stores** — per-project and per-user-global — both **outside** the
  repository tree `[OL-6]`.
- A history **miner** and structural **indexer** that populate the stores.
- **Model-in-the-loop judgment** for the genres that need it, via the host CLI's own
  model access, with a **deterministic degraded mode** when the model path is
  unavailable `[OL-2, OL-7]`.
- **Self-observability**: the oracle detects, logs, and surfaces its own failures,
  and announces correct silence so it is not mistaken for a broken tool `[OL-10]`.
- A **completion-claim** capability: the oracle speaks when an agent claims it is
  done, to catch a completion claim the work does not back `[OL-12]` (scope and its
  honest limits: §4 FR-A2g, §13).
- A **small, personal, non-primary corrective/steering feature**: awareness of Max
  Cogar's own expert dev-tool skills, so the oracle can tell when such a skill is
  active, what steps it defines, and what the agent should be doing if it were
  actually following the skill `[OL-C2]`. Explicitly *not* the tool's primary role
  and not a primary feature; one advisory input among the genres, no genre primary.

### 2.2 Out of scope (v1), each with its reason

- **Any gate, block, deny path, plan firewall, or required agent ritual** `[OL-3]`.
  Permanent exclusion.
- **Any global limit that gates operation** — no per-session or per-trigger token or
  whisper budget, no per-event whisper count cap, no whisper-rate throttle. Whether
  to speak is decided *solely* by relevance (§5). A malfunctioning oracle is caught
  by self-observability (§6), never by silencing genuine whispers `[OL-C1]`.
  Permanent exclusion.
- **Separate credentials of any kind** `[OL-7]`. Permanent exclusion.
- **Writes inside the repository tree**, except the hook-wiring `ctxoracle init`
  installs `[OL-3, D-9]`.
- **Team features** — sharing, multi-user access control, server sync `[OL-6]`.
- **Answer-drift as a built genre — DEFERRED pending owner ruling.** The ledger
  contradicts itself (OL-9 lists it in scope; OL-C2 says it "still awaits his
  ruling"); it is not built until Max resolves that (§13) `[D-24]`.

### 2.3 Explicit N/A

- **User-facing UI / web surface:** N/A — the interface is injected context plus a
  terminal CLI for the owner's own inspection.
- **Authentication / multi-tenant access control:** N/A — solo, single-user, local
  `[OL-6]`; the only trust boundaries are the security ones in §7.

---

## 3. Product principles

- **P1 — Silence is the default**, but the default yields the moment the oracle
  knows a decision-changing fact the agent lacks (`RETHINK.md` §5). Silence is a
  starting posture, never a quota.
- **P2 — Advisory by construction** `[OL-3]`. Advice known to be sometimes ignored is
  accepted; the mitigation is a loud, well-formed, *empirically* de-noised whisper
  (P7), never a gate or an a-priori suppression `[D-2]`.
- **P3 — Zero ceremony for the agent** (`RETHINK.md` §6).
- **P4 — Provenance on everything** (`RETHINK.md` §4).
- **P5 — Marginal value is the only relevance that counts.** The oracle speaks only
  about what the agent could not cheaply surface itself; a fact one `grep` returns is
  not a whisper (`RETHINK.md` §2.3).
- **P6 — Right fact, right moment.** Delivery is keyed to the decision the fact bears
  on, not to a timer, a document, or an earlier moment (`RETHINK.md` §2.4).
- **P7 — The tool learns in both directions.** Measured false-firers are demoted
  *and* demoted channels are re-explored and re-promoted on measured value; the loop
  must not converge to silence (§11, `[D-25]`; collapse-log 2026-07-22 #1).
- **P8 — The repository tree stays pristine** except explicit `init` wiring `[OL-3]`.
- **P9 — No feature is primary.** Elevating any genre (including the completion-claim
  moment or the corrective feature) is the recurring failure this project exists to
  prevent (`RETHINK.md` §12.12 correction; `[OL-C2]`).

---

## 4. What the oracle says — the whisper genres

Each genre is keyed to an observed intent signal and, per P5, is **headlined by the
fact the agent could not cheaply get itself** — never by a grep-able fact. No genre
is primary (P9). The set is grounded as a push-mode recommendation surface `[RSSE]`.

| Genre | Fires on (intent signal) | The decision-changing fact it delivers (P5) |
|---|---|---|
| **FR-A2a Orientation** | Prompt submitted | The 2–4 structural entry-point files for the task, and the one invariant that will bind. *(Task-shape landmines are NOT delivered here — they belong at the edit, FR-A2e; front-loading them at prompt-time is the binder §1 rejects, violating P6.)* `[D-26]` |
| **FR-A2b Coupling** | A file is read / searched | Co-change partners of that file, with the evidence ratio and a history pointer. |
| **FR-A2c Reuse** | A search / read for functionality | The non-obvious usage fact: "the canonical helper for this is `X`; **most call sites use it**" — the convention/frequency, not the bare existence (bare existence is often already in the agent's own search results). |
| **FR-A2d Consequence** | An edit / write is about to run | The non-obvious blast radius: **historically-coupled tests** this edit tends to break, and a generated/vendored-**zone** flag. (A raw call-site count is grep-able and is not the headline; it may accompany the non-obvious fact but never stands alone as the whisper.) |
| **FR-A2e Warning ⚠** | An edit in a landmine zone | A history- or invariant-derived hazard (editing provably-generated output; a file whose edits have broken a specific test), **flagged with its confidence** (§5). Advisory, never a denial `[OL-3]`. |
| **FR-A2f Completeness** | Edit completed / stop | "You changed the reducer but not the selector it pairs with in 9 of its last 10 changes." |
| **FR-A2g Verification / completion check** | A recognized completion-claim stop | The fact the agent lacks at "done": **that it claimed completion while the covering test for the changed region was not run** (recognized via `last_assistant_message`, `[HOOKS]`). Naming the test alone is a self-serve fact (P5) and is not the whisper; the "not-run-yet-claimed-done" condition is. **Honest limit:** this catches *unverified*, and *unfinished* only where it coincides with an unrun test (here) or a broken co-change pair (FR-A2f). The general "did not finish the task" case (OL-12) is **not** deterministically catchable; §13 records this and routes the broader case to Phase B model judgment. `[OL-12, D-27]` |
| **FR-A2h Assumption check** | Agent narration | "Your narration assumes X; the repo says Y at `file:line`." (Model-dependent — Phase B.) |
| **FR-A2i Steering** | Agent narration | "What you're describing lives in `src/…`, not where you're looking." (Model-dependent — Phase B.) |
| **FR-A2j Answer** | A repo-answerable question in narration | The repo-grounded answer with a pointer. (Model-dependent — Phase B.) |
| **FR-A2k Process conformance** | An owner expert-tool skill is active | Whether the agent's actions match the steps the active skill defines. **Small / personal / non-primary** `[OL-C2]` (§11.4). |

- **FR-A1 — The single internal question.** Per event the oracle answers, for
  itself: *given what the agent is doing right now, do I know something it almost
  certainly does not that would change what it does next?* Default: no → silence,
  but the default yields to a known decision-changing fact (P1) (`RETHINK.md` §5).
- **FR-A2 — Genre set.** The oracle produces the genres above and no genre-gating
  ritual. Model-free vs model-dependent, and therefore build phase, is fixed in §11.
- **FR-D1 — Whisper form.** Every whisper is one topic, a few sentences (an
  illustrative ~1–5, tunable, not a gate), carries the `[oracle]` prefix and its
  genre, **states its confidence whenever confidence is not high**, and carries **at
  least one verifiable pointer** `[JOHNSON, P4]`. A whisper the agent cannot check is
  a rumor and is not emitted. *The confidence flag is how the tool speaks an
  uncertain-but-important fact rather than suppressing it (§5.2).*
- **FR-D2 — Informative, never imperative** `[OL-3, P3]`.
- **FR-D3 — Warnings state their evidence** (support/confidence or call-site counts),
  never a bare assertion `[HERZIG]` (tangled commits are non-trivial, so the ratio is
  mandatory context; the exact rate is illustrative, §9).
- **FR-D4 — The ⚠ subtype may be wrong, and says so.** A ⚠ whisper is declarative,
  records that it may be a false fire, and its corrections are captured through the
  CLI to feed the learning loop (§11) — the empirical de-noiser that replaces any
  a-priori confidence suppression `[D-4]`.
- **FR-D5 — Whispers are deduplicated** per consumer against what that consumer has
  been told or has visibly incorporated (FR-A4).

---

## 5. When the oracle speaks — relevance, and the quality bar

There is one decision procedure for whether to speak. It has **two parts**, and
neither is a budget, cap, count, or throttle `[OL-C1]`.

### 5.1 Relevance comes from the moment (the trigger)

**Relevance to the agent's next decision is established by *when* a candidate
fires, not by a score.** Each genre is bound to the intent signal that reveals what
the agent is deciding right now — the file it just opened, the symbol it searched,
the edit it is about to run, the completion it just claimed (§4). This is where the
agent's intent enters the machinery. `[D-18]` answers the inherited 2026-07-22
collapse-question directly: `decision-impact` in §5.2 carries **no** intent term
*because the intent read is carried here, by the moment-keyed trigger* — not because
intent was dropped. A fact about a file the agent is not touching does not fire,
because the trigger for it did not occur.

- **FR-O1 — Observed events.** The oracle observes the session through the Claude
  Code hooks contract `[HOOKS]`. The concrete event-to-genre mapping and which of the
  (~31) hook events are wired is architecture within this requirement; the
  **delivery-capable** events are constrained by C-4/FR-O2.
- **FR-O5 — Task-boundary intervention only; no idle timers** — acting at task
  boundaries helps, interrupting active work backfires `[CHI]`.
- **FR-O6 — Per-consumer delivery**, keyed by the hook input's `agent_id`/
  `agent_type` `[HOOKS]`; a whisper goes to the consumer whose decision it bears on
  `[OL-8, D-16]`.
- **FR-A4 — Never repeat.** The oracle never re-tells a consumer what it already told
  that consumer, what the consumer visibly read, or what the consumer already acted
  on — a per-consumer **delivered-set** and **read-set**, reconciled across the
  session-boundary transitions the harness crosses without a context boundary:
  `resume`/`fork` reseed both from the audit/session logs; `compact` clears the
  read-set; `clear`/`startup` start clean `[HOOKS, D-20]`. Dedup is the read-side
  relevance filter — it stops the tool telling the agent what it can already see.

### 5.2 The quality bar — which real candidates are worth the sentence

Among candidates the trigger has already made relevant, the bar decides which are
*worth saying* — it is a **quality/marginal-value filter, not a relevance oracle and
not a rationing device** `[D-6bar]`.

- **FR-A5 — The bar (a conjunction requirement, not a fixed formula).** A candidate
  is spoken when it is **jointly** (a) backed by real evidence (**confidence**), (b)
  materially consequential to the code being touched (**decision-impact**,
  computed deterministically from per-candidate properties — edit-vs-read, blast
  radius, zone — carrying **no genre term** so the bar encodes no genre precedence
  `[D-18, P9]`), and (c) **not cheaply self-serve** (**marginal value** over the
  agent's own tools, from provenance class and what the consumer already did `[P5]`).
  None of the three may be laundered by another being high. **Every candidate that
  meets the conjunction is spoken; nothing suppresses, ranks-out, or drops a
  candidate that meets it, and there is no per-event count or budget `[OL-C1]`.** The
  exact numeric combinator and normalization are the architect's (`[D-6bar]`; two
  valid implementations may satisfy this).
- **FR-A5a — Uncertain hazards are spoken, flagged — not floored out.** Because false
  silence is the more expensive error (§1, `[OL-3]`), the warning/hazard genres do
  **not** require high confidence to fire. A real but uncertain hazard (e.g. a
  co-change signal below high confidence that an edit may break a specific test) is
  **delivered with its confidence flagged** (FR-D1), never suppressed a-priori. The
  only floor is a **noise floor**: there must be *real* evidence (above coincidence),
  not *strong* evidence. Precision is then managed **empirically** by the learning
  loop demoting measured false-firers (§11, P7), not by an a-priori high-confidence
  gate that would silence the owner's most-wanted case. This resolves the review's
  top collapse finding and is **derived from `[OL-3]` + `[OL-C1]`**; because it sets
  when the tool may stay quiet on a possible hazard, it is surfaced for the owner in
  §13, overridable by him. `[D-5, D-28]`
- **FR-A6 — Corpus (evidentiary) floor only.** Below a minimum history corpus there
  is too little signal to mine reliably, so history-derived genres stay silent rather
  than fire on noise — this is *evidentiary* (it feeds the confidence term), not a
  session-count or adoption window. **No first-N-sessions silence window exists**; a
  time/adoption-based suppression would be exactly the arbitrary limit `[OL-C1]`
  bans, and the prior draft's first-impressions window is removed `[D-7, D-8]`. The
  corpus-floor value is a tunable default measured on the exit run (§13). *On a young
  repo the history genres are correspondingly thinner; this is the owner's common
  case and is acknowledged, not hidden (§13).*
- **The bar ships high and is calibrated, never rationed.** It starts strict and is
  **adjusted in both directions against measured false-fire and value** — lowered
  when it is muting useful facts, raised when measured false-fires (via the FR-D4/
  FR-L6 CLI corrections, available from Phase A) show it is admitting junk. Raising it
  to track measured quality is calibration; raising it to hit an output quota is
  forbidden `[OL-C1, D-6bar]`. Phase A's calibration input is the human correction
  channel (FR-D4/FR-L6); automated demotion/promotion arrives in Phase C (§11).

---

## 6. The oracle must watch itself — self-observability

The owner is a non-programmer and cannot catch a silent failure, so the oracle makes
its own health legible `[OL-10]`.

- **FR-M1 — Diagnostic log** records, per event: candidates considered, the bar
  outcome each got, what was delivered, and latency.
- **FR-M2 — Self-detected failure classes**: hooks not firing, latency breaches,
  store corruption, index staleness, the model path down, and **whispers produced but
  not delivered**.
- **FR-M2a — Volume is *reported*, not capped.** The oracle reports its per-genre
  delivery volume and its measured false-fire rate (from FR-D4/FR-L6 corrections) so
  the owner can see a mis-calibration. This is a **diagnostic signal, not a control**
  and not a substitute for a cap — it never drops a genuine whisper, and it makes no
  claim about a "correct rate" (there is none — `[OL-C1]`); a genuinely busy session
  legitimately delivers a lot. It exists so a flood is *visible and fixable* (by
  calibrating the bar, §5.2), which is how a mis-calibrated Phase A is caught `[OL-C1,
  D-29]`.
- **FR-M3 — Correct silence is announced.** A session ending below the corpus floor,
  or above the bar on every candidate, says so on the human channel, so correct
  silence is not mistaken for a broken oracle `[D-22]`.
- **FR-M4 — `ctxoracle status`** — plain-language: are hooks firing, recent latency,
  store health, the session's whisper count and per-genre volume, measured
  false-fire rate, and any active suppressing condition `[OL-10]`.
- **FR-M5 — `ctxoracle log`** — the whisper audit trail (FR-X6) read back per
  session, each whisper with evidence and pointer `[OL-10, FR-X6, D-21b]`.

---

## 7. Threat model and security

The oracle reads repository history and injects text an agent acts on; that is the
attack surface. The model precedes the requirements.

### 7.1 Threats

- **T1 — Indirect prompt injection.** Repo content crafted to be read as an
  instruction when surfaced `[LLM01, OWASP-PI]`. Cost: the oracle becomes an
  injection vector.
- **T2 — Store poisoning.** A crafted history or tampered store injects false
  "facts" `[ASI06]`. Cost: confident wrong whispers.
- **T3 — Secret disclosure.** History/files contain secrets the oracle could surface
  `[LLM02, OWASP-SM]`. Cost: leak.
- **T4 — Over-privilege.** The oracle holds more access than its function needs
  `[LLM01]`. Cost: blast radius if compromised.

### 7.2 Security requirements (each tied to a threat)

- **FR-X1 — Secret redaction (T3)** before any content enters a whisper, store, or
  log.
- **FR-X2 — Repo text is data, not instruction (T1)** — surfaced by pointer by
  default; verbatim quotation only for mechanically-generated content; injected text
  framed as data `[LLM01, OWASP-PI]`.
- **FR-X3 — Injection-suspect content is pointer-only (T1)** — never quoted into a
  whisper or a model-judgment prompt.
- **FR-X4 — Trust origin preserved (T2)** — a trust label rides every fact through
  every transformation; low trust lowers confidence and cannot be laundered `[ASI06]`.
- **FR-X5 — Least privilege (T4)** — only the access needed; **no credentials of its
  own** `[OL-7]`; the only network use is the host CLI piggyback (§10); no repo-tree
  write except `init` `[OL-3]`.
- **FR-X6 — Whisper audit trail (T2, T3)** — every whisper recorded with evidence and
  pointer, readable via `ctxoracle log`.
- **FR-X7 — Locality (T3, T4)** — stores outside the repo tree; no outbound telemetry
  `[OL-6]`.
- **FR-X8 — Adversarial fixtures** carry injection payloads and planted secrets
  (§14).

---

## 8. Constraints (fixed by circumstance)

- **C-1 — Runtime: Node.js, current LTS.** `node:sqlite` is unflagged from
  **v22.13.0 / v23.4.0**, release candidate as of v25.7.0 `[NODE-SQLITE, verified
  2026-08-16]`.
- **C-2 — Full-text search is NOT in stock `node:sqlite`.** Its bundled SQLite is
  compiled **without** `SQLITE_ENABLE_FTS5` (Node 22/23/current; nodejs/node #56951
  open, 2026-08-16) `[NODE-SQLITE, verified 2026-08-16]`. **Requirement (property):**
  the index supports fast name/structure lookup and text search over indexed symbols
  within NF-1; **mechanism is the architect's** — an FTS5-enabled SQLite build
  (`--sqlite-enable-fts5`), a loaded FTS5 extension, or a library shipping FTS5 (e.g.
  `better-sqlite3`) — and the chosen mechanism must satisfy C-3.
- **C-3 — Cold-container / sandbox readiness.** Install and first index complete in a
  sandbox with no native toolchain beyond the chosen SQLite path (C-2), no
  prebuilt-binary download requirement, no network beyond the harness's `[OL-4]`.
- **C-4 — Hooks contract `[HOOKS]`, verified 2026-08-16** (`code.claude.com/docs/en/
  hooks`). Facts the design rests on:
  - **FR-O2 — Delivery-capable events and mechanism.** Model-visible context returns
    two ways: structured `hookSpecificOutput.additionalContext` (on `PreToolUse`,
    `PostToolUse`, and other decision-model events) and plain stdout (on
    `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart` only; other events'
    stdout goes to the debug log). A shim relays back **whatever whispers the service
    returned**, framed as context; there is no one-whisper-per-event cap `[OL-C1]`.
    *(The additional event names `PostToolUseFailure`/`PermissionRequest`, the
    per-handler timeout numbers, and the 10,000-char output cap below are from the
    same doc but were not individually re-fetched this pass — pin each against the
    live contract before building on it, §13.)*
  - A `PreToolUse` hook may return `additionalContext` **without** a permission
    decision (omit `permissionDecision` → normal flow), delivered before the tool
    runs — the passive-whisper affordance the tool depends on.
  - `Stop`/`SubagentStop` are continuation controls (a block keeps the turn from
    ending); both expose `last_assistant_message` (so a completion claim is
    *recognized*, not guessed) and can attach `additionalContext`.
  - Hooks fire inside subagents carrying `agent_id`/`agent_type`; context lands in the
    subagent's own context (parent propagation **unconfirmed**, not assumed — §13).
  - Output strings capped at 10,000 chars (overflow spilled to a file + preview) —
    see FR-O2a.
  - Timeouts: `command`/`http`/`mcp_tool` 600s, `prompt` 30s, `agent` 60s;
    `UserPromptSubmit` 30s; `SessionEnd` a shared **1.5s** budget by default.
- **FR-O2a — Overflow preserves the no-suppression guarantee.** If the whispers that
  meet the bar for one event would exceed the substrate's 10,000-char cap, the oracle
  must not let the harness silently truncate a bar-meeting whisper (that would be a
  hidden suppression `[OL-C1]`). It delivers what fits and **defers the remainder to
  the next delivery-capable event, recording the deferral in the diagnostic log** —
  a mechanism-imposed carryover, not a relevance decision. The exact carry mechanism
  is the architect's `[D-30]`.
- **FR-O3 — Fail open, fast.** Any shim/service error, timeout, or missing store
  yields **silence**, never an error in the agent's flow `[OL-3]`. This is a *latency*
  discipline (bounding how long the oracle may take), never an output limit (how much
  it may say) — see NF-1.
- **FR-O4 — No deny and no mutation path exists, structurally.** No code path returns
  `deny`/`block`/`ask`/`defer` or a mutation field (`updatedInput`,
  `updatedToolOutput`, `permissionDecision`) `[OL-3]`.
- **FR-O4a — One continuation per stop**, bounded by `stop_hook_active`; never
  prevents a turn from ending `[HOOKS, OL-3]`.
- **C-5 — No MCP sampling.** Deprecated (SEP-2577), never supported by Claude Code
  `[MCP-DEP, prior pass; re-confirm at build §13]`.

- **NF-1 — Latency (a recorded engineering judgment `[D-31]`).** Added latency per
  event: **p95 ≤ 1.5s, hard ceiling 3s**, after which the event resolves to silence
  and the candidate may carry to the next event. Reasoning: a hook that slows the
  agent degrades the very workflow it serves; the ceiling sits well inside the
  harness's own `UserPromptSubmit` 30s budget while keeping the oracle imperceptible.
  A model call cannot sit on the synchronous hook path (cold model spawn measured
  ~5.3s on 2026-07-17, an observation, far over ceiling), so model-using genres run
  off the synchronous path (§11). *These numbers are `[D-31]`, not attributed to the
  owner; the fail-open behavior is `[OL-3]`.*

---

## 9. Standards and evidence base

| Key | Standard / source | Governs | Verified |
|---|---|---|---|
| `[HOOKS]` | Claude Code hooks reference, `code.claude.com/docs/en/hooks` | Observation & delivery (C-4) | 2026-08-16 (core facts; some values pinned at build, §13) |
| `[NODE-SQLITE]` | Node `node:sqlite` docs + nodejs/node #56951 | Store runtime & FTS5 (C-1, C-2) | 2026-08-16 |
| `[ROSE]` | Zimmermann, Weißgerber, Diehl, Zeller, "Mining Version Histories to Guide Software Changes," IEEE TSE 31(6), 2005 | Co-change mining; evidence terms (§5, §11) | 2026-08-16 |
| `[MSR]` | Empirical mining-software-repositories practice — exclude merge commits from co-change transactions | FR-K2 merge exclusion | prior pass; re-confirm at build (§13) |
| `[HH]` | Co-change / logical-coupling mining literature (transaction horizon, recency weighting, raw-co-change imprecision) | FR-K2 horizon/recency | prior pass; re-confirm at build (§13) |
| `[LLM01]` `[LLM02]` | OWASP Top 10 for LLM Applications (2025) | T1, T3 | prior pass; re-confirm at build (§13) |
| `[OWASP-PI]` | OWASP prompt-injection guidance | T1 | prior pass; re-confirm (§13) |
| `[ASI06]` | OWASP Agentic Security Initiative — memory/store poisoning | T2 | prior pass; re-confirm (§13) |
| `[OWASP-SM]` | OWASP Secrets Management guidance | T3 | prior pass; re-confirm (§13) |
| `[RSSE]` | Recommendation systems in software engineering (push-mode restraint) | Genre set (§4) | prior pass; re-confirm (§13) |
| `[TRICORDER]` `[CACM]` | Sadowski et al., Tricorder (ICSE-SEIP 2015) & CACM 2018 | In-workflow delivery; demotion/promotion (§11, P7) | prior pass; re-confirm (§13) |
| `[HERZIG]` | Herzig & Zeller, tangled changes | Evidence-ratio mandate (FR-D3) | prior pass; re-confirm (§13) |
| `[CHI]` | Task-boundary vs idle interruption research | FR-O5 | prior pass; re-confirm (§13) |
| `[JOHNSON]` | Why developers reject/accept tool warnings | FR-D1 | prior pass; re-confirm (§13) |
| `[MCP-DEP]` | MCP SEP-2577 (sampling deprecation) | C-5 | prior pass; re-confirm (§13) |

**`[ROSE]` figures (verified 2026-08-16):** the TSE-2005 baseline is user-tunable
(support ≥ 1, confidence ≥ 0.1, ranked by confidence), reporting feedback 0.64 /
precision 0.30 / recall 0.34 at that point and >70% top-3 across eight projects. This
spec does **not** lift any fixed operating point from the paper; ROSE grounds the
*confidence computation* (support/confidence as evidence strength that FR-D1 flags),
and per FR-A5a the tool does not use a high-confidence *suppression* gate at all. The
web-circulated 26%/15%/64% figures are the ICSE-2004 version and are not cited.
Illustrative numbers elsewhere (FR-D1's ~1–5 sentences; FR-K2's ~30-entity cap;
FR-D3's tangled-commit rate) are tunable/illustrative defaults, not sourced
constants, pending §13 re-confirmation.

**"Re-confirm at build" (§13):** these standards' *concepts* are load-bearing and
unchanged in role; their exact current wording/figures were not re-fetched this
session and must be re-verified before the requirement they source is implemented —
a Gate-B obligation carried openly, not a hidden premise.

---

## 10. External interfaces

- **Hooks (consumed)** per C-4/`[HOOKS]`. The oracle is hook handlers plus a session
  service; shims carry no decision logic and relay what the service returns (FR-O2).
- **CLI (produced), `ctxoracle`** — at minimum: `init` (install hook wiring — the only
  repo-tree write), `deinit`, `index` (build/refresh index + mine history), `status`
  (FR-M4), `log` (FR-M5), and a `correct`/`note` verb to record a false-fire or a
  human statement (FR-D4, FR-L6). Full surface is the architect's.
- **Stores (produced)** — two SQLite stores outside the repo tree; schema the
  architect's within FR-K* (§11), subject to C-2.
- **Model access (consumed)** — the host CLI's own access via
  `claude -p --model … --output-format json --max-turns 1`, tools disallowed, reusing
  the session's authentication; **no separate credentials** `[OL-2, OL-7]`. The Agent
  SDK is not a substitute; the CLI piggyback is the path.

---

## 11. Stores, learning, and build order

### 11.1 Stores, index, miner

- **FR-K1 — Structural index** of symbols/definitions/locations, incrementally
  refreshable, serving §4/§5 lookups within NF-1 (subject to C-2 for text search).
- **FR-K2 — Co-change miner** over version history, excluding merge commits `[MSR]`,
  capping very large transactions (an illustrative ~30-entity cap, tunable `[ROSE]`),
  over a configurable, recency-weighted horizon `[ROSE, HH]`.
- **FR-K3–K5 — Fact schemas** (exemplar, landmine, invariant, recipe) are **pointers
  to real code with provenance**, never free-floating extracted rules `[ASI06]`.
- **FR-K6 — Provenance + trust on every record** (FR-X4).
- **FR-K7 — Staleness lowers confidence, never blocks** `[OL-3]`.
- **FR-K8 — Two stores, outside the tree** `[OL-6]`.
- **FR-K9 — Export/import round-trip** for the owner's own backup/move; no network
  sync `[OL-6]`.

### 11.2 Model judgment and degraded mode

- **FR-J1 — Two-stage selection**: deterministic candidate generation (always
  available), then model judgment for model-dependent genres; mechanical candidates
  with objective evidence bypass the model.
- **FR-J2 — Degraded mode is deterministic, mandatory, and automatic** on piggyback
  failure `[OL-2]`.
- **FR-J3 — Degraded mode is a runtime fallback, not a build stage**: a model-path
  failure must not switch off a model-free genre `[D-21]`.
- **FR-J4 — Recursion guard (property)**: the oracle's own model calls must not
  trigger observation of themselves; mechanism the architect's `[D-6]`.

### 11.3 Learning loop — de-noise in both directions

- **FR-L1 — Session log** records, per event, candidates, whisper sent, and uptake
  evidence, with no uptake *judgment* in Phase A (`[D-12]`; Phase A's calibration
  input is the human CLI correction, §5.2).
- **FR-L3 — Demotion.** A genre/source measured to false-fire (via FR-D4/FR-L6
  corrections and uptake signals) is demoted on a probation→suppression ladder
  `[TRICORDER, CACM]`. It demotes **measured false-firers**; it never silences a
  correct whisper `[OL-C1, P7]`.
- **FR-L3b — Promotion / re-exploration (the anti-ratchet).** Demotion **must** be
  balanced by a mechanism that re-tests and re-promotes a demoted genre/source on
  measured value, so the loop cannot converge to silence — the failure the
  2026-07-22 collapse-hunt caught and this rebuild must not re-spring. At minimum: a
  suppressed channel is periodically re-admitted at low volume to re-measure its
  value, and re-promoted when it earns it. The mechanism (an explore schedule /
  bandit / periodic re-admission) is the architect's; its *existence* is required
  `[D-25, P7]` (collapse-log 2026-07-22 #1).
- **FR-L6 — Human statements are first-class facts** — a correction or fact entered
  via the CLI is stored with provenance and outranks mined inference; it is the Phase
  A calibration signal (§5.2).
- **FR-L7 — Fact routing**: repository facts → project store; efficacy signals →
  global store `[OL-6]`.

### 11.4 Corrective / steering feature (small, personal, non-primary)

- **FR-C1 — Expert-tool awareness `[OL-C2]`.** The oracle is given the *structure* of
  Max Cogar's expert dev-tool skills — per skill: how activation is detectable, the
  steps it defines, the expected agent action per step — and the process-conformance
  genre (FR-A2k) emits an **advisory** whisper when the agent's actions diverge.
- **FR-C2 — Deterministic trigger, no hand-coded rule piles `[OL-C2]`.** The trigger
  is the structured skill definition (active? which step? expected action?), not a
  growing set of hand-written firing heuristics.
- **FR-C3 — Gate for nothing, primary over nothing** `[OL-3, OL-C2, P9]`. It never
  blocks, never tests the agent for permission to proceed, and is weighted as one
  ordinary candidate at the bar — no precedence.

### 11.5 Build order (phases within one spec)

- **Phase A — Deterministic core.** Model-free genres (Orientation entry-points,
  Coupling, Reuse, Consequence, Warning ⚠ with confidence flags per FR-A5a,
  Completeness, Verification/completion-check), stores/index/miner, delivery
  (incl. FR-O2a overflow), self-observability, security, and the human-correction
  calibration channel (FR-D4/FR-L6). Exits by producing measured whisper + false-fire
  data on a real repository.
- **Phase B — Model-in-the-loop genres.** Assumption-check, Steering, Answer, and the
  broader completion "unfinished" judgment (FR-A2g's honest gap) — off the
  synchronous path (NF-1), on Phase A's data + the degraded-mode contract.
- **Phase C — Automated learning loop.** The demotion **and promotion** ladder
  (FR-L3/FR-L3b), efficacy routing, and — needing the skill structures encoded plus
  A/B delivery — the corrective feature (FR-C1–C3).

Each phase follows an approved, adversarially-reviewed architecture document; Phase
B/C numbers are set from Phase A's exit data.

---

## 12. Decisions made while writing this spec

- **D-2 — Advisory-only despite the "ignored warnings" risk** `[OL-3]`; reconciled by
  loud, well-formed whispers plus *empirical* de-noising (P7), not a gate or a-priori
  suppression.
- **D-4 — ⚠ subtype is declarative, corrected via CLI** (feeds FR-L3/FR-L3b).
- **D-5 / D-28 — Uncertain hazards are spoken flagged, not floored (FR-A5a).** *Job:*
  deliver the possible-disaster fact the agent lacks. *Hardest question:* "why floor
  out the 40%-confidence 'this may break auth' when you told me a wasted sentence is
  the worst case?" *Answer:* under `[OL-3]` false silence is the costlier error, so a
  high-confidence suppression gate optimizes the wrong side; speak it flagged (FR-D1)
  and let the learning loop demote it if it proves noise. Only a *noise* floor (real
  vs coincidental evidence) remains. Because this sets when the tool may stay quiet on
  a hazard, it is surfaced for owner override (§13), though it derives from `[OL-3,
  OL-C1]`.
- **D-6 / D-6bar — Recursion guard, and the bar-as-quality-filter, are properties**;
  the numeric combinator, the "ships high" starting point, and the calibration policy
  (adjust to track measured quality, never to hit a quota) are stated as properties,
  mechanism the architect's.
- **D-7, D-8 — Only an evidentiary corpus floor, no adoption/first-sessions window**
  (FR-A6); the removed window was an arbitrary limit under `[OL-C1]`. The corpus-floor
  value is measured on the exit run.
- **D-9 — The one in-tree write is `init` wiring** (P8).
- **D-12 — Phase A logs uptake but makes no automated uptake judgment**; its
  calibration input is the human correction channel (FR-D4/FR-L6), not an automated
  loop (that is Phase C).
- **D-16 — Per-consumer subagent delivery** keyed on `agent_id`/`agent_type` `[OL-8,
  HOOKS]`.
- **D-18 — Equal genre base weight; `decision-impact` carries no intent/genre term
  because intent enters via the moment-keyed trigger (§5.1)** — the explicit answer to
  the inherited 2026-07-22 collapse-question.
- **D-20 — Session boundaries are not context boundaries** (FR-A4).
- **D-21 — Degraded mode separated from build phase** (FR-J3). **D-21b —** `log`
  readback is required (FR-M5), sourced to `[OL-10]`/FR-X6.
- **D-22 — Correct silence is announced** (FR-M3).
- **D-23 — Requirement IDs are stable mnemonics with intentional gaps.**
- **D-24 — Answer-drift is deferred pending the OL-9/OL-C2 ledger contradiction**
  (§2.2, §13) — and it is independently the thinnest mission tie (it polices a
  conversation-flow failure the human can see, when the oracle exists for failures he
  cannot; §13).
- **D-25 — Promotion/re-exploration is required, not just demotion** (FR-L3b) — the
  anti-ratchet the 2026-07-22 collapse-hunt mandated.
- **D-26 — Orientation delivers entry-points, not task-shape landmines** — landmines
  belong at the edit (FR-A2e); prompt-time landmine delivery violates P6 and is the
  binder §1 rejects.
- **D-27 — Verification catches "claimed-done-but-test-not-run"; the general
  "unfinished" case is not deterministically catchable** and is routed to Phase B, an
  honest limit on OL-12 stated on the page, not hidden.
- **D-29 — Volume is reported, not capped** (FR-M2a); the diagnostic is a signal, not
  a control, and is not sold as replacing a cap.
- **D-30 — Substrate overflow defers, never silently truncates** (FR-O2a), preserving
  `[OL-C1]`.
- **D-31 — Latency numbers (1.5s/3s) are an engineering judgment**, not an owner
  attribution; the fail-open *behavior* is `[OL-3]`. *(This corrects a review-caught
  slip in the prior draft that attributed a latency figure to the owner through
  `RETHINK.md` §5 rationale — the same poisoned channel as the rejected budget
  OL-R3.)*
- **D-15 — v1 language set** is an initial set behind a language-agnostic interface;
  **the concrete set is an owner scope call (§13)**; the interface requirement holds
  regardless.
- **The budget is gone** `[OL-C1]`. Every per-session/per-trigger token or whisper
  budget, per-event count cap, and rate throttle is removed. The two *correct*
  deletions tangled in the old budget language are preserved on their own merits: no
  "at most one whisper per event" count (OL-R1) and no "warnings get priority within
  the budget" ranking (unsourced). Volume is governed only by relevance+bar (§5) and
  observed, never capped, by self-observability (§6).

---

## 13. What is genuinely open (each resolved, scoped to architecture, or a real owner question — no silent holes)

**Owner questions (yours to settle; each carries my recommendation):**

- **Q1 — Answer-drift genre (`[D-24]`).** Your ledger contradicts itself: OL-9 lists
  it in scope, OL-C2 says it "still awaits your ruling." It is also the weakest
  mission fit (it flags a dropped question *you* can see, when the tool is for what you
  can't). *Recommendation: drop it from v1* unless you want it. It is not built until
  you say.
- **Q2 — Uncertain-hazard voice (FR-A5a, `[D-5, D-28]`).** The tool now **speaks**
  low-confidence hazards *flagged* rather than staying silent, because you said a
  wasted sentence is the worst case (OL-3) and importance alone decides (OL-C1). This
  is derived from your confirmed rulings, but it governs when the tool may go quiet on
  a possible disaster, so: *confirm you want it to speak-flagged, or tell me a
  confidence below which you'd rather it stay quiet.*
- **Q3 — v1 language set (`[D-15]`).** Which languages ship first (prior proposal:
  TS/JS/TSX + Python). A scope preference only you set; the language-agnostic
  interface holds either way.

**Architecture-owned (property stated, mechanism deferred by design — not holes):**
the C-2 full-text-search mechanism; store schemas; FR-A5's numeric combinator; the
recursion guard; the completion-claim recognizer's lexical test; the FR-O2a overflow
carry; FR-L3b's explore/promotion mechanism; which of the ~31 hook events are wired.

**Measured on the exit run (grounded tunable defaults, not TBDs):** the corpus floor;
the noise floor for FR-A5a; the demotion/promotion thresholds; the bar's starting
height — each a default with a cited basis, set in architecture and tuned on Phase A
data.

**Gate-B re-confirm before the sourcing requirement is built:** the §9 rows marked
"prior pass" (`[MSR]`, `[HH]`, `[LLM01]`, `[LLM02]`, `[OWASP-PI]`, `[ASI06]`,
`[OWASP-SM]`, `[RSSE]`, `[TRICORDER]`, `[CACM]`, `[HERZIG]`, `[CHI]`, `[JOHNSON]`,
`[MCP-DEP]`), plus the individually-unpinned `[HOOKS]` values (the
`PostToolUseFailure`/`PermissionRequest` event names, the timeout numbers, the
10,000-char cap). Concepts load-bearing; exact current wording re-fetched at build.

**Acknowledged, not a defect:** on young repositories (the owner's common case) the
history-derived genres are thinner because the corpus floor is evidentiary; the
structural, reuse, consequence-by-zone, and conformance genres still fire. The
completion-claim genre catches *unverified*, not the general *unfinished* (D-27).

**Unconfirmed harness behavior:** whether a subagent hook's `additionalContext`
propagates to the parent (C-4) — assumed **not**; a spike showing otherwise only adds
an option.

---

## 14. Acceptance criteria

Each names the requirements it verifies; all use fixture repositories and replay.
**v1 is complete when every criterion passes on a real repository and `ctxoracle
status` reports a clean session** — no unresolved failure class, no latency breach,
no whisper produced-but-undelivered (excluding FR-O2a deferrals, which are logged,
not lost).

- **AC-1 (coupling → FR-A2b, FR-D3, NF-1).** A known co-change pair: a completed read
  of one file yields a coupling whisper naming the other, with evidence ratio and a
  history pointer, within the latency budget.
- **AC-2 (no gate, structurally → FR-O4, FR-O4a, OL-3, OL-C1).** No shim/service path
  can emit `deny`/`block`/`ask`/`defer` or a mutation field; `stop_hook_active: true`
  → silence; at most one continuation per stop. A control-flow assertion, not a
  field-scan.
- **AC-3 (relevance+bar, no budget → FR-A5, OL-C1).** Two candidates meeting the bar
  at one event are **both delivered**; no configuration suppresses a bar-meeting
  whisper by count/token/rate; a long session delivers whenever the bar is met, no
  mid-session cutoff.
- **AC-3a (uncertain hazard spoken → FR-A5a, FR-D1, D-28).** A real but low-confidence
  hazard fires **with its confidence flagged**, not silence; a coincidental
  (below-noise-floor) signal does not fire.
- **AC-4 (marginal value + dedup + trigger relevance → FR-A5, FR-A4, §5.1).** A fact
  in a consumer's read-set stays silent; a not-yet-seen fact speaks; a high-quality
  fact about a file the agent is **not** touching does **not** fire (no trigger).
- **AC-5 (session boundaries → FR-A4, D-20).** `resume`/`fork` reseed dedup;
  `compact` clears the read-set and re-sends a pre-compaction-read fact;
  `clear`/`startup` clean.
- **AC-6 (corpus floor, no adoption window → FR-A6, D-7/8).** Below the corpus floor,
  history genres stay silent; at/above it they fire — **and a session with rich
  history fires regardless of how few sessions have occurred** (no first-N-sessions
  suppression).
- **AC-7 (pristine tree → P8, FR-X5, D-9).** After `init`/`index`/session/`deinit` the
  tree differs only by the removed hook wiring.
- **AC-8 (completion check → FR-A2g, OL-12, FR-O4a).** At a recognized completion-claim
  stop where the region's test was not run, the oracle delivers the "claimed done,
  covering test not run" whisper, one continuation, never preventing the stop; and it
  does **not** fire merely to name a test that *was* run (self-serve).
- **AC-9 (self-observability → FR-M1–M5, D-22, D-29).** Induced hook-not-firing,
  latency breach, and produced-but-undelivered whisper each appear in the diagnostic
  log and `status`; per-genre volume and false-fire rate are reported; a suppressing
  condition is announced; `log` reads back each whisper with evidence and pointer.
- **AC-10 (fail-open latency → FR-O3, NF-1, D-31).** Induced failure/timeout →
  silence, unimpeded flow; p95 ≤ 1.5s, none over 3s.
- **AC-11 (security → FR-X1–X8, T1–T4).** Planted secret redacted everywhere (T3);
  injection-suspect content pointer-only and never obeyed (T1); low-trust origin never
  yields a high-confidence whisper (T2); no credentials, no network beyond the model
  piggyback (T4).
- **AC-12 (degraded mode → FR-J2, FR-J3, OL-2).** Model path forced down: deterministic
  genres still fire, no model-free genre switched off.
- **AC-13 (store hygiene → FR-K2–K7).** Merge commit, >~30-entity transaction, and
  beyond-horizon history contribute no edges; append refreshes incrementally; a stale
  fact lowers confidence without blocking.
- **AC-14 (whisper well-formedness → FR-D1–D5).** Every whisper parses to form, has a
  resolving pointer, states its evidence ratio when history-derived, flags confidence
  when not high, and contains no imperative.
- **AC-15 (subagent delivery → FR-O6, D-16, OL-8).** A subagent tool event draws a
  whisper into that subagent's context, keyed by `agent_id`.
- **AC-16 (corrective feature → FR-C1–C3, OL-C2).** With a fixture skill structure
  loaded, an agent skipping a defined step draws an **advisory** conformance whisper;
  it blocks nothing and carries no precedence at the bar.
- **AC-17 (the loop does not ratchet to silence → FR-L3, FR-L3b, P7).** Over a replayed
  multi-session fixture, a genre demoted for measured false-fires is later re-explored
  and re-promoted when it earns value; **per-genre** delivery does not converge to zero
  while value remains (not merely: the total is non-zero).
- **AC-18 (exit run produced evidence → §1, FR-M4).** The exit run's `status` reports
  its whisper count; a zero-whisper run does not pass — it obligates re-setting the
  floors/bar from that run's data and re-running.
- **AC-19 (overflow defers, never truncates → FR-O2a, OL-C1).** When bar-meeting
  whispers exceed the 10,000-char substrate cap, the remainder is deferred and logged,
  and no bar-meeting whisper is silently dropped.
- **AC-20 (cold container + FTS mechanism → C-1, C-2, C-3).** Install and first index
  complete in a sandbox with no native toolchain beyond the chosen SQLite path, no
  prebuilt-binary download, no network beyond the harness's; the C-2 full-text-search
  mechanism functions under those constraints.

---

*End of spec. Written 2026-08-16 on the confirmed foundation in `OWNER-LEDGER.md`
(OL-1…OL-12, OL-C1, OL-C2) plus the mission, with all findings from the two 2026-08-16
independent reviews applied. Next: the three owner questions in §13 (Q1–Q3), then the
Phase A architecture document.*
