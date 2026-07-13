# Spec: Context Oracle (`ctxoracle`) — v1

**Status**: draft for owner review. Derived from `RETHINK.md` and the six
resolved decisions in its §12. Supersedes
`middleware/Gemini-context-compiler/spec-codebase-context-compiler(1).md`;
`middleware/codebase-context-compiler-sandbox/` is archived reference only.

This spec defines *what* the oracle must do. Implementation choices are
constrained only where a constraint is itself a requirement (§8).

---

## 1. Mission

> Deliver the fact that would change the agent's next decision, at the moment
> of that decision, without being asked.

The consumer is a coding agent working in a harness that exposes lifecycle
hooks (Claude Code first). The human owner must be able to audit, after the
fact, everything the oracle said and the evidence it said it from.

## 2. Product principles

Every requirement below traces to one of these. A change request that violates
a principle is a change to this spec, not an implementation detail.

- **P1 — Silence is the default.** The oracle speaks only when confidence ×
  decision-impact clears a bar. Most observed events produce nothing.
- **P2 — Advisory only, by construction.** The oracle never blocks a tool
  call, never denies an action, never mutates the repository. Its worst
  possible outcome is a wasted sentence. This is what makes it safe to run on
  real projects from day one.
- **P3 — Zero ceremony.** The agent is never required to produce any
  oracle-specific format, tag, file, or request. An oracle-unaware agent gets
  full passive value.
- **P4 — Provenance on every claim.** Every whisper carries at least one
  verifiable pointer (`file:line`, commit hash, or learned-record reference).
  A whisper the agent can't check is a rumor.
- **P5 — Marginal value only.** The oracle does not say what the agent can
  trivially discover with its own tools. Its subject matter is what a cold
  checkout can't reveal: coupling, conventions, landmines, invariants, history.
- **P6 — Right time beats right document.** Small moment-keyed notes, never
  compiled briefing artifacts, are the agent-facing interface.
- **P7 — Learn or plateau.** The oracle accumulates knowledge across sessions
  and tunes itself from measured outcomes, including its own mistakes.
- **P8 — The repo tree stays pristine.** All oracle state lives outside the
  repository. The only in-tree write, ever, is hook wiring in
  `.claude/settings.json` during an explicit `ctxoracle init`.
- **P9 — General guidance, not incident armor.** The oracle is a general
  system built on general signals. Requirements shaped as countermeasures to
  one specific remembered failure are rejected on sight.

## 3. System overview

| Component | Role | Lifetime |
|---|---|---|
| **Hook shims** | Logic-free relays: forward harness events to the session service; inject returned whispers as `additionalContext` | per event |
| **Session service** | Holds live session state (Tier 3), runs the match-and-decide loop per event | per session, warm |
| **Project store** | Tier 1 + Tier 2 knowledge for one repository | persistent, per repo |
| **Global store** | Cross-project lessons, whisper-efficacy stats, tuning | persistent, per user |
| **Judgment layer** | Decides *whether* and *what* to whisper; model-assisted with deterministic degraded mode | inside session service |
| **Distiller** | Post-session learning: regrets, noise, false fires, recipes | post-session |
| **Companion skill** | Teaches the agent to read whispers and narrate helpfully | loaded at session start |
| **CLI (`ctxoracle`)** | `init`, `index`, `status`, `export`/`import`, inspection of stores and whisper logs | on demand |

## 4. Functional requirements

### 4.1 Observation (hook shims)

- **FR-O1** — The oracle observes, at minimum: session start, user prompt
  submission, completed read/search tool calls, pending edit/write tool calls,
  completed edit/write tool calls, and session stop. It also reads the agent's
  narration from the transcript as an intent signal.
- **FR-O2** — Shims contain no decision logic. They forward the event and
  relay at most one whisper back.
- **FR-O3** — **Fail open.** Any shim or service error, timeout, or missing
  store results in silence — never an error surfaced into the agent's flow.
  Added latency: p95 ≤ 1.5 s per event; hard ceiling 3 s, after which the
  event is answered with silence (the candidate may be deferred to the next
  event).
- **FR-O4** — **No deny path exists.** Shims are structurally incapable of
  returning a blocking decision. This is asserted by test (AC-3), not policy.

### 4.2 Knowledge (stores)

- **FR-K1** — *Tier 2 structural index*: files, symbols, import/reference
  edges, directory topology, generated/vendored/build-output zones, test
  topology (which tests exercise which regions), and per-region verification
  commands. Built incrementally; language support starts with the owner's
  stacks (TypeScript/JavaScript/TSX, Python) behind a language-agnostic
  interface.
- **FR-K2** — *Co-change graph*: mined from git history at file and symbol
  granularity, recency-weighted, refreshed incrementally as history grows.
- **FR-K3** — *Exemplar registry*: canonical examples of recurring patterns
  ("how a route/migration/component is added here"), stored as pointers to
  real code, never as extracted abstract rules.
- **FR-K4** — *Landmine records*: locations with elevated historical risk —
  revert chains, fix-of-a-fix commits, flaky tests, footgun APIs,
  deprecated-but-present modules — each with the evidence that earned the
  label.
- **FR-K5** — *Invariant records*: cross-file contracts that must change
  together (enum ↔ switch, schema ↔ generated types, config key ↔ reader),
  with the participating locations.
- **FR-K6** — Every record carries provenance: `file:line` span, commit hash,
  human statement (with date), or `learned:<session>` reference. Records
  without provenance are unrepresentable in the store schema.
- **FR-K7** — Staleness never blocks and never spams. A stale index lowers
  confidence (usually to silence) and triggers background refresh.
- **FR-K8** — Store locations: project store at
  `~/.ctxoracle/projects/<repo-key>/`, global store at `~/.ctxoracle/global/`.
  Nothing is written into the repository tree (P8).
- **FR-K9** — `ctxoracle export` / `import` round-trips a project store to a
  single file, so learned knowledge can survive ephemeral containers. Export
  is user-initiated; the oracle never commits its own state anywhere.

### 4.3 Attention (when to speak)

- **FR-A1** — Per event, the oracle answers internally: *given what the agent
  is doing right now, do I know something it almost certainly doesn't that
  would change what it does next?* Default answer: no → silence.
- **FR-A2** — Whisper genres and their triggers:

  | Genre | Trigger | Content |
  |---|---|---|
  | Orientation | prompt submitted | 2–4 entry points, the invariant that will matter, landmines matching the task shape; ≤ 400 tokens |
  | Coupling | file read / symbol searched | strongest co-change partners; the canonical helper for the thing being searched |
  | Assumption check | narration states something the store contradicts | "narration assumes X; evidence says Y at `file:line`" |
  | Steering | narration intent doesn't match where the agent is looking | where that concern actually lives |
  | Consequence | edit/write pending | call-site count and spread, historical breakage, existing implementation to reuse |
  | Warning ⚠ | edit pending on generated/vendored zone, or landmine with strong evidence | see FR-D3 |
  | Completeness | edit completed / stop | the paired file not yet touched, per co-change/invariants |
  | Verification | stop | the verification command for the changed region |
  | Answer | narration addresses the oracle directly | best-effort answer or an honest "don't know" |
  | Unknown | task depends on something the repo doesn't determine | names the gap as a product/human decision |

- **FR-A3** — Budgets: at most one whisper per event; a per-session injected-
  token budget (default 2,000, configurable); orientation counts against it.
  Warnings have priority within the budget, not exemption from it.
- **FR-A4** — Dedup against Tier 3 state: never tell the agent what it has
  already read, already been told, or visibly acted on. Orientation-genre
  candidates decay out of consideration once the agent is deep in the task.
- **FR-A5** — Confidence gating: each candidate carries confidence ×
  estimated decision-impact; only the top candidate above the bar is spoken.
  The bar is configurable, ships high, and is raised further in degraded mode
  (FR-J3).

### 4.4 Delivery (whispers)

- **FR-D1** — Whisper format: `[oracle]` prefix, genre tag, confidence tag
  when below high, a claim of one to five sentences, at least one verifiable
  pointer, and optionally a one-line "so what." Example:

  > `[oracle] (coupling) src/state/store.ts changed alongside
  > src/routes/SettingsPage.tsx in 16 of its last 20 commits (git log since
  > 2025-01). If this edit adds settings state, the store likely needs a
  > matching change.`

- **FR-D2** — Tone is informative, never imperative. Whispers state facts and
  consequences; they do not issue commands to the agent.
- **FR-D3** — Warning subtype: the ⚠ marker, the mechanical evidence for the
  classification, the concrete consequence, and an explicit false-fire clause.
  Example:

  > `[oracle] ⚠ warning (generated-file): dist/schema.d.ts appears to be
  > build output of src/schema.ts (generated-header marker; written by "npm
  > run build"). Hand edits will be overwritten on the next build — the
  > editable source is src/schema.ts. If this classification is wrong,
  > proceed, and say so in your narration so the oracle learns.`

  No warning is ever a block (P2). The false-fire clause is required verbatim
  in intent: it is the feedback channel FR-L3 consumes.
- **FR-D4** — The only agent-facing channel is hook context injection.
  Human-facing notices (degraded mode, index rebuild) use the human-visible
  message channel and never consume agent context.

### 4.5 Judgment layer

- **FR-J1** — Two stages: deterministic candidate generation from the stores
  (fast, always available), then judgment selection of zero-or-one whisper.
  Purely mechanical candidates with objective evidence (e.g. generated-file
  warnings) may bypass model judgment.
- **FR-J2** — Model access ladder, tried in order:
  1. **Host-harness piggyback**: the Claude Agent SDK or headless CLI using
     the session's existing credentials, with a small fast model
     (Haiku-class). This is the primary path and works in sandboxes, because
     wherever the oracle runs the harness is already talking to a model.
  2. Explicit API key, if configured.
  3. MCP sampling (the server asks the client to run the completion), adopted
     when host support is reliable.
  4. **Deterministic degraded mode** — mandatory, automatic when 1–3 fail.
- **FR-J3** — Degraded mode raises the confidence bar (mechanical-evidence
  genres only: coupling, generated-file, verification, completeness) and
  announces itself once per session on the human channel.
- **FR-J4** — Judgment fits the FR-O3 latency budget. Candidate generation is
  precomputed or asynchronous wherever possible; the model call gets one shot
  within budget or the event resolves to silence.
- **FR-J5** — **Repo text is untrusted input.** Retrieved file content is data,
  never instruction. Whispers must not relay imperative content found in
  repository text; content flagged as injection-suspect is referenced by
  pointer and not quoted. The judgment prompt is constructed so retrieved text
  cannot alter the oracle's own behavior.

### 4.6 Companion skill

- **FR-S1** — The skill teaches the agent three things: how to read `[oracle]`
  notes (margin notes from a colleague who knows the repo's history; verify
  the pointer before relying on the claim); how to narrate to be helped
  (state intent before tool bursts, name the task's nouns early, voice
  assumptions so they can be confirmed or refuted); and that it may address
  the oracle in plain narration ("oracle: where do notification preferences
  live?") with no format or ritual.
- **FR-S2** — The skill is optional. Every oracle capability functions without
  it.
- **FR-S3** — A direct address is answered on the next injection opportunity,
  best effort; if the oracle doesn't know, it says so rather than guessing
  (mission: the agent never has to guess — neither does the oracle).

### 4.7 Learning (distiller)

- **FR-L1** — The session service logs, per event: candidates considered,
  whisper sent (if any), and subsequent evidence of uptake (pointed file
  opened, named helper used, suggested command run, warning proceeded past).
- **FR-L2** — The distiller runs post-session over that log plus the session
  diff and answers: what did the agent need that the oracle didn't say
  (regret)? what was said and ignored (noise)? which task shape used which
  region (recipe)? which warnings were false fires?
- **FR-L3** — False-fire handling: a warning that the agent proceeded past
  with a good outcome, or that narration explicitly corrected, is demoted; a
  repeatedly false specific warning is suppressed. Suppression is per-fact,
  provenance-traceable, and reversible via the CLI.
- **FR-L4** — Routing: facts about the repo (co-change, exemplars, landmines,
  invariants, recipes) go to the project store; whisper-efficacy statistics,
  confidence-bar tuning, and lessons that generalize across projects go to
  the global store.
- **FR-L5** — Learned records carry `learned` provenance and are evictable by
  source, so a bad distillation can be traced and removed without wiping the
  store.

### 4.8 Security

- **FR-X1** — Secret patterns are redacted before anything enters a store or a
  whisper.
- **FR-X2** — Injection-suspect regions of repo text are labeled at index time
  and handled per FR-J5.
- **FR-X3** — Both stores are local to the user's machine or container. No
  telemetry leaves the machine; the global store *is* the "collective
  feedback" mechanism, and it is the user's own.
- **FR-X4** — Every whisper is logged with the evidence it used, giving the
  human a reviewable audit trail (`ctxoracle status` / log inspection) and
  the distiller its raw material.

## 5. Non-goals

- No gates: no plan gate, no assumption firewall, no tool blocking, no
  delegation blocking. Grounding is achieved by supplying facts at decision
  time.
- No compiled context package as the agent interface. (A human-readable
  session summary may be rendered on demand; it is a review artifact.)
- No expansion-request or human-override rituals. The agent looks or asks in
  narration; the human's chat statements are recorded as facts with human
  provenance.
- Not a patch reviewer, not a coding agent, not a search engine, not
  on-demand RAG (the only pull interaction is the narration address, FR-S3).
- Not a collection of countermeasures to specific remembered incidents (P9).
- No team distribution in v1 (owner works solo); the store format must not
  preclude later merging (FR-K6 provenance suffices).
- No subagent whispers in v1 (decision 5); the shim contract must not
  preclude them.

## 6. Health metrics

Measured from the FR-X4 log by the distiller; inspectable via `ctxoracle
status`.

- **Hit rate** — whispers with observed uptake ÷ whispers sent.
- **Silence rate** — events with no whisper ÷ events observed (healthy: high).
- **Regret rate** — post-hoc: wrong edits the store could have prevented but
  the oracle didn't speak to.
- **False-fire rate** — warnings contradicted by outcome or narration.
- **Ceremony count** — agent actions required by the oracle. Must be 0, always.
- **Overhead** — p95 hook latency; total injected tokens per session.

## 7. Constraints

- **C1** — Cold-container ready: installs and indexes with no native
  toolchain, no prebuilt-binary download, and no network beyond what the
  harness already has. (Node ≥ 22.5 with built-in `node:sqlite` is a known
  satisfying stack; this is a constraint, not a mandate.)
- **C2** — Session state must persist warm across hook invocations with
  sub-second access (a background service with local IPC, or equivalent).
- **C3** — Harness integration is Claude Code hooks in v1, but all
  harness-specific knowledge lives in the shims; the service speaks a
  harness-neutral event contract.
- **C4** — `ctxoracle init` is explicit and minimal: wire hooks, create the
  out-of-tree store, nothing else. Uninstall (`ctxoracle deinit`) removes the
  wiring cleanly.

## 8. MVP boundary and build order

- **Phase 0 — deterministic spine.** Shims + session service + Tier 2 index +
  co-change miner. Genres: minimal orientation, coupling, generated-file
  warning, verification. Degraded mode *is* the product at this phase. Exit:
  AC-1..AC-5 pass; the owner runs it on a real project without incident.
- **Phase 1 — judgment.** Host-piggyback model layer; narration intent
  tracking; assumption-check, steering, consequence, reuse, answer genres;
  companion skill. Exit: AC-6..AC-8 pass; measured silence and hit rates
  reviewed against the bar.
- **Phase 2 — learning.** Distiller, false-fire tuning, landmine and
  invariant mining, recipes, global-store efficacy tuning, export/import.
  Exit: AC-9..AC-10 pass; a demonstrated case of the oracle getting
  measurably better between sessions on the same repo.

## 9. Acceptance criteria

- **AC-1 (coupling)** — In a fixture repo with a known co-change pair, an
  observed edit to one file yields a coupling whisper naming the other, with a
  git-history pointer, within the latency budget.
- **AC-2 (silence)** — Replaying a recorded session of routine events produces
  whispers on only a small fraction of events (threshold set with the fixture;
  the assertion is that most events are silent).
- **AC-3 (no deny)** — No shim code path can return a blocking decision;
  induced service failure and timeout both yield silence and an unimpeded
  agent (FR-O3/O4).
- **AC-4 (pristine tree)** — After `init`, index, a full session, and
  `deinit`, the repository tree's only ever-touched file is
  `.claude/settings.json`, and `deinit` restores it.
- **AC-5 (warning, not block)** — An edit to a detected generated file
  proceeds unimpeded and receives the FR-D3 warning with mechanical evidence
  and the false-fire clause.
- **AC-6 (provenance)** — Every emitted whisper parses to the FR-D1 format and
  every pointer resolves to a real location/commit in the fixture.
- **AC-7 (injection)** — With hostile imperative text planted in fixture repo
  files, no whisper relays or obeys it; suspect content appears only as a
  pointer.
- **AC-8 (zero ceremony)** — An agent with no companion skill completes a full
  task with the oracle active, producing no oracle-specific format, and
  receives whispers throughout.
- **AC-9 (false-fire learning)** — After narration marks a specific warning
  wrong, the same warning is demoted or suppressed in the next session, and
  the suppression is visible and reversible via the CLI.
- **AC-10 (degraded mode)** — With all model paths unavailable, the oracle
  still delivers mechanical-evidence genres, announces degraded mode once on
  the human channel, and injects nothing about it into agent context.

## 10. Open items

- MCP sampling support in Claude Code: track and adopt for the FR-J2 ladder
  when reliable.
- Subagent whisper delivery (deferred by decision 5): design the Tier 3 state
  as per-consumer when it lands.
- Export-file format for FR-K9 (single-file archive vs. mergeable log): decide
  in Phase 2 when the distiller's record shapes are settled.
