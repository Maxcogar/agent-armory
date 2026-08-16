# Spec: Context Oracle (`ctxoracle`) — v1 (rebuilt 2026-08-16)

**Status:** draft for owner review. This is a **ground-up rebuild** requested by
Max Cogar on 2026-08-16, replacing the prior `spec-context-oracle.md` and
`spec-context-oracle-phase0.md`. It is written on a *confirmed* foundation: every
requirement traces to a confirmed owner decision (`OWNER-LEDGER.md`), a named and
current-verified standard, or a recorded judgment (§12). Nothing attributed to Max
Cogar appears here unless it is CONFIRMED in `OWNER-LEDGER.md`.

**Provenance keys.** `[OL-n]` / `[OL-Cn]` = a CONFIRMED owner decision in
`OWNER-LEDGER.md`. `[D-n]` = a judgment made while writing this spec, with its
reasoning in §12. Standard keys (e.g. `[ROSE]`, `[HOOKS]`) resolve in §9. Every
external fact was verified against its primary source **on 2026-08-16** (§9 records
the source and date); a fact not yet verifiable at that depth is marked inline and
routed to §13.

**What this document is.** It defines *what* the oracle must do and the properties
it must hold. Component boundaries, storage engines, IPC, and algorithms are the
architect's, except where a constraint is itself a requirement (§8).

---

## 1. Problem and mission

Coding agents under-read the codebase, misjudge when their context is sufficient,
and fill the gaps with plausible inventions. The knowledge that would prevent this
— which files change together, which edits have historically broken which tests,
the non-local convention, the second write-site, the landmine — is discoverable
only from history and structure the agent does not consult at the moment it
decides. Existing "briefing" approaches front-load a document that pays its full
token cost regardless of what fraction is needed and decays in salience as the
session grows (`RETHINK.md` §2.4).

**Mission (verbatim, the anchor for every requirement):**

> Deliver the fact that would change the agent's next decision, at the moment of
> that decision, without being asked.

The Context Oracle is a passive, repository-resident intelligence. It observes a
Claude Code session through lifecycle hooks and, at decision moments, injects a
small advisory **whisper** — one fact, with a verifiable pointer — when it knows
something the agent almost certainly does not and that would change what the agent
does next. It never blocks, never mutates the repository, and its worst case is a
wasted sentence `[OL-3]`.

**For whom.** A single developer (Max Cogar) working solo across his own
repositories, driving agents through Claude Code `[OL-6, OL-11]`. Not a team tool;
no sharing surface in v1.

**Why it is worth building.** The scarce, valuable knowledge is exactly what an
agent cannot surface from a cold checkout with its own tools; delivering it at the
decision point, and nowhere else, is the difference between guidance that is used
and a binder that is ignored (`RETHINK.md` §2.3).

---

## 2. Scope

### 2.1 In scope (v1)

- A CLI, `ctxoracle`, and the hook shims that wire it into a Claude Code session
  `[OL-1]`.
- Passive observation of the session via the Claude Code hooks contract, and
  delivery of whispers as injected context — to the **main agent and to
  subagents** `[OL-8]`.
- The whisper **genres** of §4, delivered under the single relevance test of §5.
- Two persistent **stores** — one per-project, one per-user-global — both located
  **outside** the repository tree `[OL-6]`.
- A history **miner** and structural **indexer** that populate the stores.
- **Model-in-the-loop judgment** for the genres that need it, obtained through the
  host CLI's own model access, with a **deterministic degraded mode** when the
  model path is unavailable `[OL-2, OL-7]`.
- **Self-observability**: the oracle detects, logs, and surfaces its own failures,
  and announces correct silence so it is not mistaken for a broken tool `[OL-10]`.
- A **completion-claim** whisper capability: the oracle speaks when an agent claims
  it is done, to catch a completion claim the work does not back `[OL-12]`.
- A **small, personal, non-primary corrective/steering feature**: awareness of Max
  Cogar's own expert dev-tool skills, so the oracle can tell when such a skill is
  active, what steps it defines, and what the agent should be doing if it were
  actually following the skill `[OL-C2]`. This is explicitly *not* the tool's
  primary role and is not a primary feature; it is one advisory input among the
  genres, and no genre is primary.

### 2.2 Out of scope (v1), each with its reason

- **Any gate, block, deny path, plan firewall, or required agent ritual.** The
  oracle cannot prevent an action or demand the agent do anything `[OL-3]`. This is
  a permanent exclusion, not a deferral.
- **Any global limit that gates operation** — no per-session or per-trigger token
  or whisper budget, no per-event whisper count cap, no whisper-rate throttle.
  Whether to speak is decided *solely* by relevance (§5). A malfunctioning oracle
  is caught by self-observability (§6), never by silencing genuine whispers
  `[OL-C1]`. Permanent exclusion.
- **Separate credentials of any kind.** The oracle never requires, requests, or
  stores an API key of its own `[OL-7]`. Permanent exclusion.
- **Writes inside the repository tree**, except the hook-wiring the user installs
  by running `ctxoracle init` `[OL-3, D-9]`.
- **Team features** — sharing stores, multi-user access control, server sync
  `[OL-6]`. Solo scope.
- **Languages beyond an initial set** are not *excluded* but are gated behind a
  language-agnostic interface; the concrete v1 language coverage is a judgment in
  §12 (`[D-15]`), pending owner confirmation of the set.

### 2.3 Explicit N/A

- **User-facing UI / web surface:** N/A — the oracle's entire interface is injected
  context plus a terminal CLI for the owner's own inspection.
- **Authentication / multi-tenant access control:** N/A — solo, single-user, local
  `[OL-6]`; the only trust boundaries are the security ones in §7.

---

## 3. Product principles

These shape every requirement; a requirement that violates one is wrong.

- **P1 — Silence is the default.** Per event the oracle asks one question and, if
  the answer is not a confident yes, says nothing (`RETHINK.md` §5).
- **P2 — Advisory by construction.** Every intervention is a whisper; there is no
  code path that blocks, defers, or mutates `[OL-3]`. Advice known to be sometimes
  ignored is accepted; the mitigation is a loud, well-formed, low-false-fire
  whisper, never a gate (`[D-2]`).
- **P3 — Zero ceremony for the agent.** Whispers require no agent action and no
  ritual; the agent stays the decision-maker (`RETHINK.md` §6).
- **P4 — Provenance on everything.** Every whisper carries a verifiable pointer;
  every stored fact carries where it came from and a trust label (`RETHINK.md` §4).
- **P5 — Marginal value is the only relevance that counts.** The oracle speaks only
  about what the agent could not cheaply surface itself (`RETHINK.md` §2.3).
- **P6 — Right fact, right moment.** Delivery is keyed to the decision, not to a
  timer or a document (`RETHINK.md` §2.4).
- **P7 — The tool learns.** Measured false-firers are demoted; measured value is
  reinforced (`RETHINK.md` §8). Learning demotes noise; it never silences a
  correct whisper.
- **P8 — The repository tree stays pristine** except explicit `init` wiring
  `[OL-3]`.
- **P9 — No feature is primary.** The genres are a flat set serving the one
  mission; elevating any one of them (including the completion-claim moment or the
  corrective feature) is the recurring failure this project exists to prevent
  (`RETHINK.md` §12.12 correction; `[OL-C2]`).

---

## 4. What the oracle says — the whisper genres

The oracle produces whispers in the genres below. Each is keyed to an observed
intent signal (§5.1). **No genre is primary** (P9). The set is grounded as a
push-mode recommendation surface for software engineering `[RSSE]`, each item
delivered only when it clears the single relevance test of §5.

| Genre | Fires on (intent signal) | What it delivers |
|---|---|---|
| **FR-A2a Orientation** | Prompt submitted | Structural entry-point files for the task, the one invariant that will matter, landmines matching the task shape. A small note, not a binder. |
| **FR-A2b Coupling** | A file is read / searched | Co-change partners of that file, with the evidence ratio and a history pointer. |
| **FR-A2c Reuse** | A search / read for functionality | "A canonical helper for this exists at `X`; most call sites use it." |
| **FR-A2d Consequence** | An edit / write is about to run | Blast radius: call-site count and where, generated/vendored-zone flag, historically-coupled tests. |
| **FR-A2e Warning ⚠** | An edit in a landmine zone | A history- or invariant-derived hazard (e.g. editing provably-generated output, or a file whose edits have broken a specific test). Advisory, never a denial `[OL-3]`. |
| **FR-A2f Completeness** | Edit completed / stop | "You changed the reducer but not the selector it pairs with in 9 of its last 10 changes." |
| **FR-A2g Verification** | Completion-claim stop | The test/command that covers the region just changed. |
| **FR-A2h Assumption check** | Agent narration | "Your narration assumes X; the repo says Y at `file:line`." (Model-dependent — Phase B.) |
| **FR-A2i Steering** | Agent narration | "What you're describing lives in `src/…`, not where you're looking." (Model-dependent — Phase B.) |
| **FR-A2j Answer** | A direct question in narration the repo can answer | The repo-grounded answer with a pointer. (Model-dependent — Phase B.) |
| **FR-A2k Process conformance** | A skill/workflow is active | Whether the agent's actions match the steps the active skill defines. **Small / personal / non-primary** `[OL-C2]`. |
| **FR-A2l Answer drift** | User's question goes unanswered across turns | "The user asked X two turns ago; it has not been addressed." Advisory `[OL-9]`. |

- **FR-A1 — The single internal question.** Per event the oracle answers, for
  itself: *given what the agent is doing right now, do I know something it almost
  certainly does not that would change what it does next?* Default answer: no →
  silence (`RETHINK.md` §5) `[P1]`.
- **FR-A2 — Genre set.** The oracle produces the genres above and no genre-gating
  ritual. Which genres are model-free versus model-dependent, and therefore their
  build phase, is fixed in §11.
- **FR-D1 — Whisper form.** Every whisper is one topic, one to five sentences,
  carries the `[oracle]` prefix and its genre, states its confidence when
  confidence is not high, and carries **at least one verifiable pointer**
  (`file:line`, commit) `[JOHNSON, P4]`. A whisper the agent cannot check is a
  rumor and must not be emitted.
- **FR-D2 — Informative, never imperative.** "This function has 14 call sites,"
  not "review all call sites." The agent stays the decision-maker `[OL-3, P3]`.
- **FR-D3 — Warnings state their evidence.** A co-change or history-derived whisper
  always states its evidence ratio (support/confidence or call-site counts), never
  a bare assertion `[HERZIG]` (tangled commits reach ~15%, so the ratio is
  mandatory context).
- **FR-D4 — The warning subtype may be wrong, and says so.** A ⚠ whisper is
  declarative and records that it may be a false fire; corrections are captured
  through the CLI to feed the demotion ladder (§6, Phase C) — never an imperative
  invitation that the harness could screen `[D-4]`.
- **FR-D5 — Whispers to a consumer are deduplicated** against what that consumer
  has already been told or has visibly incorporated (FR-A5).

---

## 5. When the oracle speaks — the bar is the sole decider

There is **one** decision procedure for whether to speak, and it is relevance.
There is no budget, cap, count, or throttle anywhere in it `[OL-C1]`.

### 5.1 The observation model

- **FR-O1 — Observed events.** The oracle observes the session through the Claude
  Code hooks contract `[HOOKS]`: the prompt submitted, tool calls (reads,
  searches, edits/writes) in the main agent and in subagents, completion stops, and
  session-lifecycle transitions. The concrete event-to-genre mapping and which of
  the (currently ~31) hook events are wired is an architecture decision within this
  observation requirement; the **delivery-capable** events are constrained by
  FR-O2.
- **FR-O5 — Task-boundary intervention only; no idle timers.** The oracle acts on
  task-boundary signals (a tool call, an edit, a stop), never on an idle timer.
  Interrupting at task boundaries helps; interrupting during active work backfires
  `[CHI]`.
- **FR-O6 — Per-consumer delivery.** Session state is keyed per consumer (main
  agent and each subagent, identified by the hook input's `agent_id` / `agent_type`
  `[HOOKS]`), and a whisper is delivered to the consumer whose decision it bears on
  `[OL-8, D-16]`.

### 5.2 The relevance test (the bar)

- **FR-A5 — The bar.** Each candidate whisper carries a score = **confidence ×
  decision-impact × marginal-value**, computed without a model wherever possible.
  **Every candidate that clears the bar is spoken.** Nothing suppresses, defers,
  ranks-out, or drops a candidate that has cleared the bar; there is no per-event
  count and no budget `[OL-C1]`.
  - *confidence* — evidence strength (co-change support/confidence, call-site
    certainty).
  - *decision-impact* — `structural_weight`, deterministic from per-candidate
    properties only (edit-vs-read, blast radius, zone); it carries **no genre
    term**, so the bar encodes no genre precedence `[D-18, P9]`.
  - *marginal-value* — value over what the agent could surface itself, from
    provenance class and what the consumer has already done (`RETHINK.md` §2.3)
    `[P5]`.
  - The bar **ships high** and is configurable; it is lowered against measured hit
    rate, never raised to ration output (`RETHINK.md` §5) `[D-6-bar]`.
- **FR-A4 — Never repeat.** The oracle never tells a consumer what it has already
  told that consumer, what the consumer has visibly read, or what the consumer has
  already acted on. This rests on a **delivered-set** (what was told) and a
  **read-set** (what was read), both maintained per consumer and both reconciled
  across the session-boundary transitions the harness crosses without a context
  boundary (FR-O1, §5.3) `[D-20]`.
- **FR-A6 — Warm-up floors.** Below a minimum corpus (too little history to mine)
  or within a first-few-sessions window, history-derived genres stay silent rather
  than fire on noise; the specific counts are tunable defaults grounded in
  first-impressions and warm-up evidence, to be measured on the exit run (§11,
  `[D-7, D-8]`).
- **P5-floor — Warn-grade evidence floor.** A ⚠ whisper on history-derived
  evidence requires a co-change operating point strong enough that the warning
  channel is precise at the cost of coverage. ROSE demonstrates the precision/
  coverage trade-off this floor rides `[ROSE]`; the concrete support/confidence
  values are tunable defaults (§11, `[D-5]`), not fixed constants — the exit run
  measures them for this agent consumer.

### 5.3 Session boundaries are not context boundaries

- **FR-A4-boundary.** On `SessionStart`, the `source` value governs dedup state
  `[HOOKS]`: `resume` and `fork` reseed the delivered-set from the audit log and
  reconstruct the read-set from the session log (the harness replays prior injected
  context / inherits the parent transcript without re-running past hooks); `compact`
  clears the read-set (the agent no longer holds what it read); `clear` and
  `startup` start clean `[D-20]`. This prevents a resume chain from dedup-ing away
  exactly the facts most worth re-delivering.

---

## 6. The oracle must watch itself — self-observability

Because the owner is a non-programmer and cannot catch a silent failure, the oracle
must make its own health legible `[OL-10]`.

- **FR-M1 — Diagnostic log.** A structured diagnostic log, separate from the
  whisper audit trail, records per event: candidates considered, the score each
  received, what was delivered, and latency.
- **FR-M2 — Self-detected failure classes.** The oracle detects and records:
  hooks not firing, latency-budget breaches, store corruption, index staleness, the
  model path being down, and **whispers produced but not delivered**.
- **FR-M2a — A malfunction is surfaced, never silencing.** An oracle emitting far
  more than its own history warrants is a *fault to detect and surface* through
  this layer — it is the mechanism that replaces any output cap `[OL-C1]`. It never
  responds by dropping genuine whispers.
- **FR-M3 — Correct silence is announced.** Being below a corpus floor, inside the
  first-sessions window, or above the bar on every candidate are not failures, but
  are indistinguishable to the owner from a broken oracle. A session that ends with
  a suppressing condition active says so on the human channel `[D-22]`.
- **FR-M4 — `ctxoracle status`.** A plain-language pull surface reports, for a
  non-programmer: whether hooks are firing, recent latency, store health, the
  session's whisper count decomposed by why the oracle stayed silent, and any active
  suppressing condition `[OL-10]`.
- **FR-M5 — `ctxoracle log`.** The whisper audit trail (§7, FR-X6) is readable back
  per session, each whisper with its evidence and pointer `[D-21]`.

---

## 7. Threat model and security

The oracle reads repository history and injects text an agent will act on; that is
the attack surface. The threat model precedes the requirements.

### 7.1 Threats

- **T1 — Indirect prompt injection.** Repository content (a comment, a commit
  message, a file the miner reads) contains text crafted to be interpreted as an
  instruction when the oracle surfaces it `[LLM01, OWASP-PI]`. Cost: the oracle
  becomes an injection vector into the agent.
- **T2 — Store poisoning.** A crafted history or a tampered store injects false
  "facts" the oracle will later assert `[ASI06]`. Cost: confident wrong whispers.
- **T3 — Secret disclosure.** History or files contain secrets the oracle could
  surface in a whisper or log `[LLM02, OWASP-SM]`. Cost: leak.
- **T4 — Over-privilege.** The oracle holds more access (network, filesystem,
  credentials) than its function needs `[LLM01]`. Cost: blast radius if compromised.

### 7.2 Security requirements (each tied to a threat)

- **FR-X1 — Secret redaction (T3).** The oracle scans for and redacts secrets
  before any content enters a whisper, a store record, or a log.
- **FR-X2 — Repo text is data, not instruction (T1).** Repository-derived text is
  surfaced **by pointer** by default; verbatim quotation is permitted only for
  mechanically-generated content, and injected text is framed as data, not as a
  system directive `[LLM01, OWASP-PI]`.
- **FR-X3 — Injection-suspect content is pointer-only (T1).** Content flagged as
  injection-suspect is never quoted into a whisper or any model-judgment prompt;
  only its location is surfaced.
- **FR-X4 — Trust origin is preserved (T2).** Every stored fact carries a trust
  label through every transformation; a low-trust origin lowers confidence and can
  never be laundered into a high-confidence whisper `[ASI06]`.
- **FR-X5 — Least privilege (T4).** The oracle requests only the access it needs.
  It holds **no credentials of its own** `[OL-7]`; its only network use is the host
  CLI model piggyback (§11), and it never writes inside the repo tree except `init`
  wiring `[OL-3]`.
- **FR-X6 — Whisper audit trail (T2, T3).** Every whisper is recorded with the
  evidence used and its pointer, readable via `ctxoracle log` (FR-M5).
- **FR-X7 — Locality (T3, T4).** Stores live outside the repo tree; no outbound
  telemetry `[OL-6]`.
- **FR-X8 — Adversarial fixtures.** Security requirements are verified against
  fixtures that carry injection payloads and planted secrets (§14).

---

## 8. Constraints (fixed by circumstance)

- **C-1 — Runtime: Node.js, current LTS.** `node:sqlite` is available unflagged
  from Node **v22.13.0 / v23.4.0** and is a release candidate as of v25.7.0
  `[NODE-SQLITE, verified 2026-08-16]`.
- **C-2 — Full-text search is NOT available through stock `node:sqlite`.** The
  SQLite bundled into `node:sqlite` is compiled **without** `SQLITE_ENABLE_FTS5`
  (confirmed across Node 22/23/current; nodejs/node #56951 open, unresolved as of
  2026-08-16) `[NODE-SQLITE, verified 2026-08-16]`. **Requirement (property):** the
  index must support fast name/structure lookup and text search over indexed
  symbols within the latency budget (NF-1); **the mechanism is the architect's** —
  an FTS5-enabled SQLite build (`--sqlite-enable-fts5`), a loaded FTS5 extension, or
  a library that ships FTS5 (e.g. `better-sqlite3`). This constraint corrects a
  false premise in the prior spec and must be resolved in architecture, not
  discovered in build.
- **C-3 — Cold-container / sandbox readiness.** Installation and first index must
  complete in a sandbox with no native toolchain assumptions beyond the chosen
  SQLite path (C-2), no prebuilt-binary download requirement, and no network beyond
  the harness's `[OL-4]`. The C-2 mechanism must itself satisfy this (a build-time
  or extension dependency that cannot install in the sandbox fails C-3).
- **C-4 — Hooks contract, verified 2026-08-16.** The delivery substrate is the
  Claude Code hooks contract at `code.claude.com/docs/en/hooks` `[HOOKS]`. Facts
  the design rests on, all verified 2026-08-16:
  - **FR-O2 — Delivery-capable events and mechanism.** Model-visible context is
    returned two ways: structured `hookSpecificOutput.additionalContext` (on
    `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`,
    `UserPromptSubmit`/`UserPromptExpansion`), and plain stdout (on
    `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart` only — for other
    events stdout goes to the debug log). A shim relays back **whatever whispers the
    service returned** for the event, framed as context; there is no
    one-whisper-per-event cap `[OL-C1]`.
  - A `PreToolUse` hook can return `additionalContext` **without** a permission
    decision (`permissionDecision` omitted → normal permission flow), delivered
    before the tool runs — the passive-whisper affordance the tool depends on.
  - `Stop` / `SubagentStop` are continuation controls: a block there keeps the turn
    from ending; both expose `last_assistant_message` (so a completion claim is
    *recognized*, not guessed) and can attach `additionalContext`.
  - Hooks fire inside subagents and carry `agent_id` / `agent_type`; injected
    context lands in the subagent's own context (parent propagation is
    **unconfirmed** and must not be assumed — §13).
  - Output strings are capped at 10,000 characters (overflow spilled to a file +
    preview).
  - Timeouts: `command`/`http`/`mcp_tool` 600s, `prompt` 30s, `agent` 60s;
    `UserPromptSubmit` 30s; `SessionEnd` a shared **1.5s** budget by default.
- **FR-O3 — Fail open, fast.** Any shim/service error, timeout, or missing store
  yields **silence**, never an error in the agent's flow `[OL-3]`. This is a
  *latency* discipline, not an output budget: the owner's own rule is "~1–2s or stay
  silent this round" (`RETHINK.md` §5) `[OL, RETHINK §5]`; see NF-1. (Distinct from
  the rejected budgets — this bounds *latency*, never *how much* the oracle may say
  when it is relevant.)
- **FR-O4 — No deny and no mutation path exists, structurally.** No shim/service
  code path returns a blocking or deferring decision (`deny`, `block`, `ask`,
  `defer`) or a harness mutation field (`updatedInput`, `updatedToolOutput`,
  `permissionDecision`). "The oracle never blocks or mutates" rests on the absence
  of the mechanism, not a promise `[OL-3]`.
- **FR-O4a — One continuation per stop.** When the oracle speaks at a completion
  stop it uses the single continuation the harness allows and never chains, bounded
  by `stop_hook_active` `[HOOKS]`; it never prevents a turn from ending `[OL-3]`.
- **C-5 — No MCP sampling.** MCP sampling is deprecated (SEP-2577) and was never
  supported by Claude Code; it is not a model-access path `[MCP-DEP]`.

**NF-1 — Latency.** Added latency per event: p95 ≤ 1.5s, hard ceiling 3s, after
which the event resolves to silence and the candidate may carry to the next event
`[RETHINK §5, OL-3]`. A model call cannot sit on the synchronous hook path (cold
model spawn measured ~5.3s in the 2026-07-17 spike, far over ceiling); model-using
genres run off the synchronous path (§11).

---

## 9. Standards and evidence base (each verified against current source)

| Key | Standard / source | Governs | Verified |
|---|---|---|---|
| `[HOOKS]` | Claude Code hooks reference, `code.claude.com/docs/en/hooks` | Observation & delivery substrate (C-4) | 2026-08-16 |
| `[NODE-SQLITE]` | Node.js `node:sqlite` docs (`nodejs.org/api/sqlite.html`) + nodejs/node #56951 | Store runtime & FTS5 constraint (C-1, C-2) | 2026-08-16 |
| `[ROSE]` | Zimmermann, Weißgerber, Diehl, Zeller, "Mining Version Histories to Guide Software Changes," IEEE TSE 31(6), 2005 | Co-change mining; warn-grade floor (§5, §11) | 2026-08-16 |
| `[LLM01]` `[LLM02]` | OWASP Top 10 for LLM Applications (2025) — Prompt Injection, Sensitive Information Disclosure | T1, T3 (§7) | prior pass; re-confirm at build (§13) |
| `[OWASP-PI]` | OWASP prompt-injection guidance | T1 (§7) | prior pass; re-confirm at build (§13) |
| `[ASI06]` | OWASP Agentic Security Initiative — memory/store poisoning | T2 (§7) | prior pass; re-confirm at build (§13) |
| `[OWASP-SM]` | OWASP Secrets Management guidance | T3 (§7) | prior pass; re-confirm at build (§13) |
| `[RSSE]` | Recommendation systems in software engineering (push-mode restraint) | Genre set as a push surface (§4) | prior pass; re-confirm at build (§13) |
| `[TRICORDER]` `[CACM]` | Sadowski et al., Tricorder (ICSE-SEIP 2015) & "Lessons from Building Static Analysis Tools at Google" (CACM 2018) | In-workflow delivery; false-fire demotion (§6, P7) | prior pass; re-confirm at build (§13) |
| `[HERZIG]` | Herzig & Zeller, tangled changes | Evidence-ratio mandate (FR-D3) | prior pass; re-confirm at build (§13) |
| `[CHI]` | Task-boundary vs idle interruption research | FR-O5 | prior pass; re-confirm at build (§13) |
| `[JOHNSON]` | Why developers reject/accept tool warnings | FR-D1 (what + why) | prior pass; re-confirm at build (§13) |
| `[MCP-DEP]` | MCP SEP-2577 (sampling deprecation) | C-5 | prior pass; re-confirm at build (§13) |

**Note on `[ROSE]` figures (verified 2026-08-16):** the TSE-2005 paper's baseline
operating point is user-tunable (support ≥ 1, confidence ≥ 0.1, ranked by
confidence), reporting feedback 0.64 / precision 0.30 / recall 0.34 at that point
and >70% top-3 likelihood across eight projects. The specific "support ≥ 3,
confidence ≥ 0.9" warn-grade point used as this spec's floor is a **tunable default
grounded in ROSE's demonstrated precision-for-coverage trade-off**, not a fixed
constant lifted from the paper; its exact values are set in §11 and measured on the
exit run. (The 26%/15%/64% figures circulating on the web are the ICSE-2004
conference version and are **not** cited here.)

**Standards marked "re-confirm at build" (§13):** their *concepts* are load-bearing
and unchanged in role; their exact current wording was not re-fetched this session
and must be re-verified before the requirement they source is implemented. This is
recorded, not hidden — a Gate-B obligation carried openly, not a silent premise.

---

## 10. External interfaces

- **The hooks interface (consumed).** Per C-4 / `[HOOKS]`. The oracle is a set of
  hook handlers plus a session service; the shims contain no decision logic and
  relay whatever the service returns (FR-O2).
- **The CLI (produced), `ctxoracle`.** Verbs, at minimum: `init` (install hook
  wiring — the only repo-tree write), `deinit` (cleanly remove it), `index`
  (build/refresh the structural index and mine history), `status` (FR-M4), `log`
  (FR-M5), and a correction verb to record a false-fire / a human statement (FR-D4,
  FR-L6). The full surface is the architect's within these requirements.
- **The stores (produced).** Two SQLite stores outside the repo tree (per-project,
  per-user-global); schema is the architect's within FR-K* (§11), subject to C-2.
- **Model access (consumed).** The host CLI's own model access via
  `claude -p --model … --output-format json --max-turns 1`, tools disallowed,
  reusing the session's existing authentication; **no separate credentials**
  `[OL-2, OL-7]`. The Claude Agent SDK is not a substitute (it does not ride the
  interactive plan's auth the same way); the CLI piggyback is the path.

---

## 11. Requirements that populate the stores, learn, and phase the build

### 11.1 Stores, index, miner

- **FR-K1 — Structural index.** A per-project index of symbols, definitions, and
  their locations, refreshable incrementally, supporting the lookups §4/§5 need
  within NF-1 (subject to C-2 for text search).
- **FR-K2 — Co-change miner.** Mines version history for co-change relationships,
  excluding merge commits `[MSR]`, capping transactions above ~30 touched entities
  `[ROSE]`, over a configurable, recency-weighted history horizon `[ROSE, HH]`.
- **FR-K3–K5 — Fact schemas.** Exemplar, landmine, invariant, and recipe records
  are **pointers to real code with provenance**, never extracted free-floating
  rules `[ASI06]` — the poisoning surface is smaller when a fact is a citation.
- **FR-K6 — Provenance + trust on every record** (FR-X4).
- **FR-K7 — Staleness lowers confidence, never blocks.** A stale fact loses
  confidence; it is never a gate `[OL-3]`.
- **FR-K8 — Two stores, outside the tree** `[OL-6]`.
- **FR-K9 — Export / import round-trip** for the owner's own backup/move; no
  network sync `[OL-6]`.

### 11.2 Model judgment and degraded mode

- **FR-J1 — Two-stage selection.** Deterministic candidate generation from the
  stores (always available), then, for model-dependent genres, model judgment.
  Purely-mechanical candidates with objective evidence bypass the model.
- **FR-J2 — Degraded mode is deterministic and mandatory.** When the model path is
  unavailable (air-gap, failure), the oracle runs a deterministic subset and stays
  useful; degraded mode is automatic on piggyback failure `[OL-2]`.
- **FR-J3 — Degraded mode is a runtime fallback, not a build stage.** A model-path
  failure must not switch off a genre that needs no model `[D-21]`.
- **FR-J4 — Recursion guard (property).** The oracle's own model calls must not
  trigger observation of themselves; the mechanism is the architect's `[D-6]`.

### 11.3 Learning loop

- **FR-L1 — Session log** records, per event, candidates, whisper sent, and uptake
  evidence, with no uptake *judgment* in v1-phase-A (`[D-12]`).
- **FR-L3 — False-fire demotion ladder.** A whisper genre/source measured to
  false-fire is demoted on a probation→suppression ladder `[TRICORDER, CACM]`. It
  demotes **measured false-firers**; it never silences a correct whisper `[OL-C1,
  P7]`.
- **FR-L6 — Human statements are first-class facts.** A correction or fact the
  owner enters via the CLI is stored with provenance and outranks mined inference.
- **FR-L7 — Fact routing.** Repository facts route to the project store; efficacy
  signals to the global store `[OL-6]`.

### 11.4 The corrective / steering feature (small, personal, non-primary)

- **FR-C1 — Expert-tool awareness `[OL-C2]`.** The oracle is given the structure of
  Max Cogar's own expert dev-tool skills — for each: how its activation is
  detectable, the steps it defines, and what the agent should be doing at each step
  if it were actually following the skill. From this, the process-conformance genre
  (FR-A2k) produces an **advisory** whisper when the agent's actions diverge from
  the active skill's steps.
- **FR-C2 — Deterministic trigger, no hand-coded rule piles `[OL-C2]`.** The
  trigger is the *structured* skill definition (skill active? which step? expected
  action?), not a growing set of hand-written heuristics for when to fire.
- **FR-C3 — It is a gate for nothing and primary over nothing** `[OL-3, OL-C2,
  P9]`. It never blocks, never tests the agent for permission to proceed, and is
  weighted as one ordinary candidate at the bar (§5) — no precedence.

### 11.5 Build order (phases — one document, not separate specs)

Phasing is build order, not scope partition; the whole of this spec is v1.

- **Phase A — Deterministic core.** The model-free genres (Orientation entry-points,
  Coupling, Reuse, Consequence, Warning ⚠, Completeness, Verification), the stores/
  index/miner, delivery, self-observability, security, and the completion-claim
  capability (FR-A2g fires model-free at a recognized completion stop via
  `last_assistant_message`). Exits by producing measured whisper data on a real
  repository.
- **Phase B — Model-in-the-loop genres.** Assumption-check, Steering, Answer, and
  the narration-driven refinements — built on Phase A's data and the degraded-mode
  contract, off the synchronous path (NF-1).
- **Phase C — Learning loop + corrective feature.** The demotion ladder, efficacy
  routing, and the expert-tool-awareness feature (FR-C1–C3), which needs the skill
  structures encoded and Phase A/B delivery in place.

Each phase is built only after an approved, adversarially-reviewed **architecture**
document for it (project lifecycle); Phase B/C numbers are set from Phase A's exit
data, not guessed ahead of it.

---

## 12. Decisions made while writing this spec

- **D-2 — Advisory-only stands despite the "ignored warnings" risk.** Evidence
  shows non-blocking warnings are sometimes ignored; the owner's ruling is no gates
  `[OL-3]`. Reconciled by a loud, well-formed, low-false-fire whisper plus the
  demotion ladder — not by adding a gate. *Job:* keep the tool a guide. *Hardest
  question:* "if it can be ignored, why build it?" *Answer:* marginal-value delivery
  at the decision point is used far more than a binder (`RETHINK.md` §2.3), and the
  learning loop removes the noise that earns dismissal.
- **D-4 — The ⚠ subtype is declarative, corrected via CLI.** An imperative
  "confirm this" invitation risks harness screening and violates FR-D2; corrections
  feed FR-L3 through the CLI.
- **D-5 — Warn-grade floor is a tunable default, not a constant.** Grounded in
  ROSE's precision-for-coverage trade-off `[ROSE]`; exact values measured on the
  exit run. *Why not a fixed number:* the ROSE figures are human-history figures on
  ROSE's projects; applying them to this agent consumer is a calibrated start, not a
  measured result (`[D-8]`).
- **D-6 — Recursion guard and the high bar are stated as properties**, mechanism to
  the architect.
- **D-7, D-8 — Warm-up and first-impressions floors are tunable defaults**, values
  set from exit-run data; concepts grounded in warm-up and first-impressions
  evidence.
- **D-9 — The one in-tree write is `init` hook wiring.** Everything else honors P8;
  shaping `init`/`deinit` as a clean reversible pair is spec judgment.
- **D-12 — v1-phase-A logs uptake evidence but makes no uptake judgment** — the
  judgment needs data the exit run produces.
- **D-15 — v1 language scope** — an initial set (TS/JS/TSX + Python were the prior
  proposal) behind a language-agnostic interface. **The concrete set is a scope call
  for the owner (§13);** the interface requirement holds regardless.
- **D-16 — Per-consumer subagent delivery** keyed on `agent_id`/`agent_type`
  `[OL-8, HOOKS]`.
- **D-18 — All genres carry equal base weight; structural weight carries no genre
  term** — so the bar encodes no genre precedence (P9).
- **D-20 — Session boundaries are not context boundaries** (FR-A4-boundary).
- **D-21 — Degraded mode is separated from the build phase** (FR-J3).
- **D-22 — Correct silence is announced** (FR-M3).
- **The budget is gone.** Every per-session/per-trigger token or whisper budget,
  every per-event count cap, and every whisper-rate throttle from the prior spec is
  removed `[OL-C1]`. The two *correct* deletions tangled in the old budget language
  are preserved on their own merits: there is **no** "at most one whisper per event"
  count (it was never the owner's — `OWNER-LEDGER.md` OL-R1), and there is **no**
  "warnings get priority within the budget" ranking (it was unsourced). Volume is
  governed only by the bar (§5) and observed by self-observability (§6).

---

## 13. What is genuinely open (resolved, scoped, or a real owner question — no silent holes)

- **Owner scope call — language set (`[D-15]`).** Which languages v1 covers first.
  A scope preference only Max Cogar can set; the language-agnostic interface holds
  either way. *This is the one open item that needs the owner.*
- **Architecture-owned (not open holes — property stated, mechanism deferred by
  design):** the C-2 full-text-search mechanism (FTS5 build vs extension vs
  `better-sqlite3`); store schemas; the score's exact numeric form; the recursion
  guard; the completion-claim recognizer's lexical test; which of the ~31 hook
  events are wired.
- **Measured on the exit run (grounded defaults, not TBDs):** the warn-grade
  support/confidence floor `[D-5]`, warm-up/first-impressions counts `[D-7, D-8]`,
  and the demotion-ladder thresholds — each a tunable default with a cited basis,
  set to a starting value in architecture and tuned on Phase A data.
- **Gate-B re-confirmation before the sourcing requirement is built:** the standards
  in §9 marked "re-confirm at build" (`[LLM01]`, `[LLM02]`, `[OWASP-PI]`, `[ASI06]`,
  `[OWASP-SM]`, `[RSSE]`, `[TRICORDER]`, `[CACM]`, `[HERZIG]`, `[CHI]`, `[JOHNSON]`,
  `[MCP-DEP]`) — concepts are load-bearing; exact current wording re-fetched at
  build. Openly carried, not a hidden premise.
- **Unconfirmed harness behavior:** whether a subagent hook's `additionalContext`
  propagates to the parent (C-4). The design assumes **it does not**; if a spike
  shows otherwise it only adds an option, it does not break a requirement.

---

## 14. Acceptance criteria

Each criterion names the requirements it verifies; all use fixture repositories and
replay. **v1 is complete when every criterion passes on a real repository and
`ctxoracle status` reports a clean session** — no unresolved failure class, no
latency breach, no whisper produced-but-undelivered.

- **AC-1 (coupling → FR-A2b, FR-D3, NF-1).** In a fixture with a known co-change
  pair, a completed read of one file yields a coupling whisper naming the other,
  with its evidence ratio and a history pointer, within the latency budget.
- **AC-2 (no gate, structurally → FR-O4, FR-O4a, OL-3, OL-C1).** A fixture asserts
  no shim/service path can emit `deny`/`block`/`ask`/`defer` or a mutation field;
  that `stop_hook_active: true` yields silence; and that at most one continuation
  fires per stop. Widened from a field-scan to a control-flow assertion because a
  field-scan once missed Stop-delivery extending a turn.
- **AC-3 (the bar is the sole decider, no budget → FR-A5, OL-C1).** At a single
  event where **two** candidates each clear the bar, **both are delivered**; there
  is no configuration in which a token/whisper/count budget suppresses a
  bar-clearing whisper; a long session delivers whenever relevance clears the bar,
  with no mid-session cutoff.
- **AC-4 (marginal value + dedup → FR-A5, FR-A4).** Where a fact is already in a
  consumer's read-set the oracle stays silent; where it is not, it speaks. Replayed
  twice over the same store, the second replay is silent.
- **AC-5 (session boundaries → FR-A4-boundary, D-20).** `resume`/`fork` reseed
  dedup state; `compact` clears the read-set and re-sends a fact the pre-compaction
  agent had read; `clear`/`startup` start clean.
- **AC-6 (warm-up + evidence floors → FR-A6, P5-floor).** Below the corpus floor and
  inside the first-sessions window, history-derived genres stay silent; at/above the
  floor and operating point they fire.
- **AC-7 (pristine tree → P8, FR-X5, D-9).** After `init`, `index`, a full session,
  and `deinit`, the repo tree differs only by the (removed) hook wiring; no store,
  log, or model-prompt artifact is written inside it.
- **AC-8 (completion claim → FR-A2g, OL-12, FR-O4a).** At a recognized
  completion-claim stop over a fixture where the region's test was not run, the
  oracle delivers the verification whisper naming the covering test, using one
  continuation, never preventing the stop.
- **AC-9 (self-observability → FR-M1–M5, D-22).** An induced hook-not-firing, a
  latency breach, and a produced-but-undelivered whisper each appear in the
  diagnostic log and in `status`; a session ending under a suppressing condition
  announces it; `log` reads back each whisper with evidence and pointer.
- **AC-10 (fail-open latency → FR-O3, NF-1).** Induced service failure/timeout
  yields silence and an unimpeded agent flow; p95 added latency ≤ 1.5s, none over
  3s, across a replayed session.
- **AC-11 (security → FR-X1–X8, T1–T4).** Adversarial fixtures: a planted secret is
  redacted from every whisper/store/log (T3); injection-suspect content appears
  only as a pointer and is never obeyed (T1); a low-trust origin never yields a
  high-confidence whisper (T2); the process holds no credentials and opens no
  network beyond the model piggyback (T4).
- **AC-12 (degraded mode → FR-J2, FR-J3, OL-2).** With the model path forced
  unavailable, the deterministic genres still fire (no error, no spam), and no
  model-free genre is switched off by the model-path failure.
- **AC-13 (store hygiene → FR-K2–K7).** A fixture history with a merge commit, a
  >30-entity transaction, and history beyond the horizon yields a graph none of the
  three contributed to; appending history refreshes incrementally; a stale fact
  lowers confidence without blocking.
- **AC-14 (whisper well-formedness → FR-D1–D5).** Every whisper parses to FR-D1's
  form, carries a resolving pointer, states its evidence ratio when history-derived,
  and contains no imperative construction.
- **AC-15 (subagent delivery → FR-O6, D-16, OL-8).** A subagent's tool event draws a
  whisper into that subagent's own context, keyed by `agent_id`.
- **AC-16 (corrective feature → FR-C1–C3, OL-C2).** With a fixture skill structure
  loaded, a session where the agent skips a defined step draws an **advisory**
  process-conformance whisper; the feature blocks nothing, and its candidate is
  weighted with no precedence over any other genre at the bar.
- **AC-17 (the exit run produced evidence → §1, FR-M4).** The exit run's `status`
  reports its whisper count; a zero-whisper run does not pass — it obligates
  re-setting the floors/bar from that run's data and re-running.
- **AC-18 (cold container + FTS mechanism → C-1, C-2, C-3).** Install and first
  index complete in a sandbox with no native toolchain beyond the chosen SQLite
  path, no prebuilt-binary download, and no network beyond the harness's; the
  full-text-search mechanism chosen for C-2 is present and functioning under those
  constraints.

---

*End of spec. Written 2026-08-16 on the confirmed foundation in `OWNER-LEDGER.md`
(OL-1…OL-12, OL-C1, OL-C2) plus the mission. Next in the lifecycle: an
adversarial review of this spec (all findings applied), then the Phase A
architecture document.*
