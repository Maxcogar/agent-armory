# Spec: Context Oracle (`ctxoracle`) — v1

**Status**: draft for owner review. Derived from `../../RETHINK.md` and the
owner decisions in its §12 and §12 addendum. Supersedes the retired `ctxpack`
design everywhere it lives — `middleware/Gemini-context-compiler/` (old spec
and architecture), `middleware/codebase-context-compiler/` (local build), and
`middleware/codebase-context-compiler-sandbox/` (sandbox build) — all
archived read-only reference, each carrying an ARCHIVED banner pointing back
here.

Every external fact this spec relies on — the hooks contract, model access,
protocol status, runtime capabilities, and the published research behind the
guidance thresholds — was verified against the primary source on 2026-07-13,
except where a fact is explicitly marked unverified where it appears and
routed to §14.
Source keys like `[TRICORDER-15]` resolve in §3. Requirements sourced from an
owner decision cite `[OWNER-n]` (decision *n* in RETHINK §12); requirements
that rest on a judgment call made while writing this spec cite `[D-n]` and are
explained in §11.

This spec defines *what* the oracle must do and the properties it must hold.
Component boundaries, storage layouts, IPC mechanisms, and algorithms are the
architect's decisions except where a constraint is itself a requirement (§10).

---

## 1. Problem and mission

Coding agents under-read the codebase, don't know when their context is
sufficient, and fill gaps with plausible inventions. The knowledge that
prevents this — invisible coupling, non-local conventions, historical
landmines, the second write-site — is exactly what a cold checkout cannot
reveal and what the agent's own tools cannot surface. `[RETHINK §1]`

> **Mission: deliver the fact that would change the agent's next decision, at
> the moment of that decision, without being asked.** `[RETHINK §3]`

The oracle is a recommendation system in the established sense — "a software
application that provides information items estimated to be valuable for a
software engineering task in a given context" `[RSSE-10]` — operating in push
mode, which that literature warns lives or dies on restraint: "The challenge
is to avoid giving so many 'helpful' hints that the developer finally ignores
them all." `[RSSE-10]` The delivery point (inside the working session, at the
moment of the decision) is the load-bearing choice: the same analysis with the
same accuracy went from a near-zero fix rate to over 70% when Facebook moved
it from batch reports to diff-time comments `[INFER-19]`, and Google found
that "when developers have to navigate to a dashboard or run a standalone
command line tool, analysis usage drops off." `[TRICORDER-15]`

The consumer is a coding agent working in a harness that exposes lifecycle
hooks (Claude Code first, `[C-3]`). The human owner must be able to audit,
after the fact, everything the oracle said and the evidence it said it from.

## 2. Scope

**In scope (v1)**: observation of a Claude Code session *including its
subagents* via hooks `[OWNER-8]`; per-repository and per-user knowledge
stores; whisper delivery via hook context injection; a model-assisted
judgment layer with a mandatory deterministic degraded mode; session-conduct
genres (process conformance, answer drift) `[OWNER-9]`; a self-observability
layer that detects and surfaces the oracle's own failures `[OWNER-10]`;
post-session learning; a companion skill; a CLI for
init/index/status/export/inspection.

**Out of scope, with reasons**:

- **Gates of any kind** — no plan gate, no assumption firewall, no tool or
  delegation blocking. The owner's explicit position: the gatekeeper design
  blocked legitimate work while solving nothing; grounding is achieved by
  supplying facts at decision time. `[OWNER-3]`
- **A compiled context package as the agent interface** — front-loaded
  briefings are built at the moment of maximum ignorance and decay in
  salience; the whisper stream replaces them. `[RETHINK §2.1, §2.4]` (A
  human-readable summary may be rendered on demand as a review artifact.)
- **Expansion-request / human-override rituals** — the agent looks or asks in
  narration; the human's chat statements are recorded as facts with human
  provenance. `[RETHINK §9]`
- **Patch review, code search, on-demand RAG** — different products; the only
  pull interaction is the narration address (FR-S3). `[RETHINK §9]`
- **Team distribution** — the owner works solo; the store format must not
  preclude later merging (FR-K6 provenance suffices). `[OWNER-6]`
- ~~Subagent whispers~~ — originally deferred `[OWNER-5]`; moved into v1
  scope by the owner on 2026-07-15 `[OWNER-8]` (see FR-O6). Listed here so
  the reversal is visible rather than silent.
- **Countermeasures to specific remembered incidents** — requirements shaped
  as armor against one past failure are rejected on sight (P9). `[OWNER-3]`

## 3. Standards and evidence base

| Key | Source | What it governs here |
|---|---|---|
| `[HOOKS]` | Claude Code hooks guide & reference, code.claude.com/docs/en/hooks-guide.md and /hooks.md (fetched 2026-07-13) | The observation/injection interface: events, I/O schemas, exit codes, timeouts, parallelism (§6.1) |
| `[CLI]` | Claude Code CLI reference, code.claude.com/docs/en/cli-reference.md | Headless model access: `claude -p`, `--model`, `--output-format json`, `--max-turns`, tool restriction flags (§6.2) |
| `[SDK]` | Claude Agent SDK docs, code.claude.com/docs/en/agent-sdk/ | Why the piggyback is the installed CLI and not the SDK: the SDK reads only API-key/Bedrock/Vertex env vars, and claude.ai OAuth is explicitly disallowed for programmatic use (§6.2) |
| `[MCP-DEP]` | MCP specification, sampling (draft) + SEP-2577, modelcontextprotocol.io | Sampling is deprecated as of protocol 2026-07-28 and unsupported by Claude Code (anthropics/claude-code#1785) — removed from the design `[D-1]` |
| `[RSSE-10]` | Robillard, Walker, Zimmermann, "Recommendation Systems for Software Engineering," IEEE Software 27(4), 2010 | Product category; push-mode restraint |
| `[TRICORDER-15]` | Sadowski et al., "Tricorder: Building a Program Analysis Ecosystem," ICSE 2015 | Effective-false-positive definition; the not-useful-rate feedback ladder; in-workflow delivery; timeliness |
| `[CACM-18]` | Sadowski et al., "Lessons from Building Static Analysis Tools at Google," CACM 61(4), 2018 | Feedback-channel design (not-useful → routed bug); workflow-integration lesson; candor that the 10% threshold is a convention |
| `[JOHNSON-13]` | Johnson et al., "Why Don't Software Developers Use Static Analysis Tools to Find Bugs?", ICSE 2013 | Why guidance gets ignored: false positives, poor presentation, workflow disruption, missing rationale |
| `[INFER-19]` | Distefano et al., "Scaling Static Analyses at Facebook," CACM 62(8), 2019 | Delivery point dominates accuracy (batch ≈0% vs diff-time >70% fix rate); timeliness bound |
| `[CB-16]` | Christakis & Bird, "What Developers Want and Need from Program Analysis," ASE 2016 | False-positive tolerance ceiling (aim ≤15–20%; 90% of developers accept ≤5%) |
| `[COVERITY-10]` | Bessey et al., "A Few Billion Lines of Code Later," CACM 53(2), 2010 | Trust spiral above ~30% FP; first-impression effect (first ~3 reports set tool credibility) |
| `[ROSE-05]` | Zimmermann, Weißgerber, Diehl, Zeller, "Mining Version Histories to Guide Software Changes," IEEE TSE 31(6), 2005 (ICSE 2004 extended) | Co-change mining viability and limits: top-3 hit likelihood >70%; warn-grade thresholds (support ≥3, confidence ≥0.9 → precision >66%, 2% false alarms); >30-entity transaction cap; stale-history decay; cold-start behavior |
| `[HH-04]` | Hassan & Holt, "Predicting Change Propagation in Software Systems," ICSM 2004 | History beats static structure (recall 0.87 vs 0.42); raw co-change precision is unusable (0.06) without pruning; recency-pruning null result; bulk/bookkeeping-commit exclusion |
| `[MSR-04]` | Zimmermann & Weißgerber, "Preprocessing CVS Data for Fine-Grained Analysis," MSR 2004 | Merge/bulk commits are structural noise for co-change graphs |
| `[HERZIG-13]` | Herzig & Zeller, "The Impact of Tangled Code Changes," MSR 2013 | Up to 15% of fixes are tangled — commit atomicity cannot be assumed; co-change edges are never certainties |
| `[CHI-25]` | Pu et al., "Assistance or Disruption? … Proactive AI Programming Support," CHI 2025 | Proactive help timing: task-boundary intervention most effective; idle-time triggering backfires |
| `[LLM01]` | OWASP Top 10 for LLM Applications 2025 — LLM01:2025 Prompt Injection, genai.owasp.org | Indirect injection threat + mitigations: segregate external content, validated output formats, least privilege, human oversight, adversarial testing |
| `[LLM02]` | OWASP LLM02:2025 Sensitive Information Disclosure | Secret/PII leakage through model I/O; detect-and-redact before processing |
| `[ASI-26]` | OWASP Top 10 for Agentic Applications 2026 — ASI01 Agent Goal Hijack, ASI06 Memory & Context Poisoning | Threats specific to persisted context/memory feeding an autonomous agent |
| `[OWASP-PI]` | OWASP LLM Prompt Injection Prevention Cheat Sheet | Repo text (code comments, commit messages) as indirect-injection surface; instruction/data separation |
| `[OWASP-SM]` | OWASP Secrets Management Cheat Sheet §8 | Scanner-grade secret detection; never log/store plaintext secrets |
| `[NODE]` | nodejs.org API docs + nodejs/node source (v22.x/v24.x heads) | `node:sqlite` availability: unflagged since v22.13.0/v23.4.0; release candidate on v24 LTS; FTS5 compiled in on both LTS lines (build-config fact, not a documented API contract) |
| `[OWNER-1..6]` | RETHINK §12, resolved 2026-07-13 | Name; model-in-the-loop via host piggyback; no hard blocks anywhere; sandbox compatibility; main agent only (revised by OWNER-8); two stores, solo scope |
| `[OWNER-7..11]` | RETHINK §12 addendum, resolved 2026-07-15 | No separate credentials ever; subagent delivery in v1; session-conduct genres; mandatory self-observability; agent-led project governance |

The numeric thresholds adopted from `[TRICORDER-15]`/`[CACM-18]`/`[CB-16]`/
`[COVERITY-10]`/`[ROSE-05]` were measured on human developers and human code
review; their application to an agent consumer is a calibrated starting point,
tunable by the learning loop (§7.7), not a measured result for agents. `[D-8]`

## 4. Product principles

Every requirement traces to one of these. A change request that violates a
principle is a change to this spec, not an implementation detail.

- **P1 — Silence is the default.** The oracle speaks only when confidence ×
  decision-impact clears a bar; most observed events produce nothing.
  Over-delivery is the documented death of push-mode guidance: developers
  ignore tools that waste their attention `[RSSE-10]` `[JOHNSON-13]`
  `[CB-16]`, and trust, once lost to noise, spirals `[COVERITY-10]`.
- **P2 — Advisory only, by construction.** The oracle never blocks a tool
  call, never denies an action, never mutates the repository. Its worst
  possible outcome is a wasted sentence. `[OWNER-3]` (See §11 D-2 for the
  evidence weighed on both sides of this decision.)
- **P3 — Zero ceremony.** The agent is never required to produce any
  oracle-specific format, tag, file, or request. An oracle-unaware agent gets
  full passive value. `[RETHINK §2.5, §7]`
- **P4 — Provenance on every claim.** Every whisper carries at least one
  verifiable pointer (`file:line`, commit hash, or learned-record reference).
  Guidance without rationale and evidence is what developers report ignoring
  `[JOHNSON-13]`; provenance is also the poisoning defense (§8).
- **P5 — Marginal value only.** The oracle does not say what the agent can
  trivially discover with its own tools; its subject matter is what a cold
  checkout can't reveal. `[RETHINK §2.3]`
- **P6 — Right time beats right document.** Small moment-keyed notes at the
  point of decision, never compiled briefing artifacts. `[INFER-19]`
  `[RETHINK §2.1]`
- **P7 — Learn or plateau.** The oracle accumulates knowledge across sessions
  and tunes itself from measured outcomes, including its own mistakes — the
  feedback-ladder model that kept Tricorder's analyzers honest.
  `[TRICORDER-15]` `[CACM-18]`
- **P8 — The repo tree stays pristine.** All oracle state lives outside the
  repository. The only in-tree write, ever, is hook wiring in
  `.claude/settings.json` during an explicit `ctxoracle init`. `[OWNER-3]`
  ("it never mutates the repo") `[OWNER-6]` (stores live outside the tree)
  `[CLAUDE.md standing rule]`
- **P9 — General guidance, not incident armor.** Requirements shaped as
  countermeasures to one specific remembered failure are rejected on sight.
  `[OWNER-3]`

## 5. System overview

| Component | Role | Lifetime |
|---|---|---|
| **Hook shims** | Logic-free relays: forward harness events to the session service; inject returned whispers as `additionalContext` | per event |
| **Session service** | Holds live session state (Tier 3), runs the match-and-decide loop per event | per session, warm |
| **Project store** | Tier 1 + Tier 2 knowledge for one repository | persistent, per repo |
| **Global store** | Cross-project lessons, whisper-efficacy stats, tuning | persistent, per user |
| **Judgment layer** | Decides *whether* and *what* to whisper; model-assisted with deterministic degraded mode | inside session service |
| **Distiller** | Post-session learning: regrets, noise, false fires, recipes | post-session |
| **Companion skill** | Teaches the agent to read whispers and narrate helpfully | loaded at session start |
| **CLI (`ctxoracle`)** | `init`, `index`, `status`, `export`/`import`, store and whisper-log inspection | on demand |

## 6. External interfaces

### 6.1 Claude Code hooks (observation and voice)

All facts in this section were verified against `[HOOKS]` on 2026-07-13; the
contract is whatever the current docs say — re-verify at implementation time.

**Events consumed (v1)**: `SessionStart`, `UserPromptSubmit`, `PreToolUse`,
`PostToolUse`, `Stop` (whisper opportunities), plus `SessionEnd` for service
teardown. All exist in the current contract, and each of the five whisper
events supports injecting model-visible text via
`hookSpecificOutput.additionalContext` — including `PreToolUse` *without*
issuing any permission decision (exit 0 "doesn't approve the tool call: the
normal permission flow still applies"). This is what makes the consequence
whisper — advice alongside an unimpeded pending edit — expressible. `[HOOKS]`

**Inputs relied on**: `session_id`, `cwd`, `transcript_path` (present on all
events — the narration-reading channel FR-O1 needs), `prompt_text`
(UserPromptSubmit), `tool_name`/`tool_input` (PreToolUse), plus tool output
(PostToolUse). `[HOOKS]` Whether the transcript file is current as of the
firing event is not documented — an assumption the narration genres depend
on, routed to §14.

**Output discipline**: shims emit exit code 0 with either no output or a JSON
body containing only `hookSpecificOutput.additionalContext` (and
`suppressOutput`). They never emit `permissionDecision`, `decision`, or exit
code 2 — those are the deny paths, and their absence is structural (FR-O4),
not policy. `[HOOKS]` `[OWNER-3]`

**Continuation is a second axis, and the deny-path enumeration above does not
cover it** (corrected 2026-07-30; the earlier text treated `additionalContext`
as inert on every event). On `Stop` and `SubagentStop`, `additionalContext` is
a **continuation control**: per `[HOOKS]`, it *"keeps the conversation going
through the same loop protections as `decision: \"block\"`, namely the
`stop_hook_active` input and the 8-consecutive-continuation cap"* — the
difference from `block` is the transcript label and the absence of a hook-error
notification, not the control-flow effect. So a whisper delivered at `Stop`
does not cost "a wasted sentence" (P2); it costs the agent a turn it was trying
to end.

**The owner ruled on this** `[OWNER-12]`: speaking at the moment an agent claims
completion is a **must-have** — a completion claim is one of the moments where an
unregistered conflict (FR-A8/A9) becomes actionable. The capability stays. What
changes is that the effect is named and bounded rather than denied:
*(Ranking language — "the highest-value moment the oracle has" — was removed
2026-08-01 on the owner's instruction; no FR-A2 genre or trigger moment outranks
another. See RETHINK §12 decision 12 and `docs/collapse-log.md`.)*

- The oracle emits at `Stop`/`SubagentStop` **only when `stop_hook_active` is
  `false`**. `[HOOKS]` defines that field as true "when Claude Code is already
  continuing as a result of a stop hook," so this bounds the oracle's total
  contribution to **exactly one continuation per stop**, never a chain, and
  keeps it structurally incapable of approaching the 8-continuation cap.
- `decision: "block"` remains structurally absent on every event (FR-O4). The
  oracle continues a turn at most once; it never prevents one.
- A Stop-grade whisper must clear a **raised bar** — it is the only whisper that
  spends a turn rather than riding an existing boundary, and is held to that
  cost (FR-A3, §9.2).
- Every Stop delivery is recorded as a continuation event in the FR-X6 audit
  record and counted in `ctxoracle status`, so the owner can see how often the
  oracle extended a turn. `[OWNER-10]`

**Contract facts that bound the design** `[HOOKS]`:
- Hooks run in parallel and the turn waits for them: shim latency is
  agent-visible latency, which is why FR-O3's budget exists.
- Harness-side timeouts: 10 min default for command hooks, but **30 s for
  `UserPromptSubmit`** — the orientation whisper must fit well inside that;
  FR-O3's 3 s ceiling already does.
- `additionalContext` from multiple hooks on one event is concatenated, with
  merge order unspecified in the docs; the oracle therefore registers a
  single hook per event and emits at most one whisper per event (FR-A3).
- Injected text arrives to the model as a system-reminder-style plain-text
  block; the `[oracle]` prefix (FR-D1) is what keeps it attributable.
- **`SessionEnd` hooks share a 1.5 s budget**, not the 10 min command-hook
  default: *"if your settings set a longer per-hook `timeout`, Claude Code
  raises the budget to match, up to 60 seconds."* Service teardown and
  distiller spawn hang off `SessionEnd`, so a single global shim deadline
  derived from FR-O3's 3 s does **not** hold on that event — deadlines are
  per-event, and `init` writes an explicit `timeout` for the `SessionEnd`
  entry if teardown needs one (which AC-4's settings accounting must then
  include). *(Added 2026-07-30; the fact was missed by the 2026-07-13
  verification pass.)*
- **`StopFailure` fires instead of `Stop` when the turn ends on an API error**,
  carries an `error` field whose values include `rate_limit`,
  `authentication_failed`, and `billing_error`, and its *"output and exit code
  are ignored"* — so it is a pure observation event with no continuation risk.
  This is the detector for the failure mode where the oracle's own model calls
  have consumed the host quota the agent needs (FR-M2, §6.2). *(Added
  2026-07-30.)*

### 6.2 Model access (judgment layer)

Two modes, tried in order per session `[OWNER-2]` `[D-1]`:

1. **Host-harness piggyback** (the only model path): invoke the installed
   Claude Code CLI in print mode — `claude -p` with `--model` (Haiku-class,
   currently `claude-haiku-4-5`), `--output-format json`, `--max-turns 1`,
   and tools disallowed — reusing whatever authentication the host
   installation already carries, subscription login or environment-provided
   keys alike. The flag surface is verified against `[CLI]`; that a spawned
   print-mode process inherits a *subscription login* (as opposed to
   API-key/Bedrock/Vertex env vars, which the CLI reads directly) is
   **unverified** and is Phase 1's first validation task (§14). The
   piggyback is the installed CLI and not the Agent SDK because the SDK
   reads only API-key/Bedrock/Vertex env vars and explicitly does **not**
   ride claude.ai OAuth logins `[SDK]` — the CLI is the only component that
   can carry the host's subscription auth.
2. **Deterministic degraded mode** — mandatory, automatic whenever the
   piggyback fails (FR-J3). `[OWNER-2]`

The oracle never requires, requests, or stores API credentials of its own:
if the host's model access isn't usable, the answer is degraded mode, not a
second credential. `[OWNER-2]` `[D-1]`

MCP sampling — the RETHINK's conditional third path — is removed: the MCP
spec deprecated sampling as of protocol 2026-07-28 (SEP-2577, "new
implementations SHOULD NOT adopt it") and Claude Code never implemented
client-side sampling (anthropics/claude-code#1785 remains open). `[MCP-DEP]`
`[D-1]`

**Recursion property**: an oracle-initiated model call must never trigger the
oracle's own hooks or spawn further oracle-initiated calls. The docs neither
promise nor forbid hook inheritance in nested invocations, so the guard must
be the oracle's own (mechanism is the architect's choice; verified by AC-11).
`[D-6]`

### 6.3 CLI surface

`ctxoracle init` (wire hooks + create out-of-tree store, nothing else),
`deinit` (remove wiring cleanly), `index`, `status` (health metrics §9.2,
degraded-mode state, store stats), `export`/`import` (FR-K9), and inspection
of stores and whisper logs (FR-X6). Init/deinit contract is C-4.

## 7. Functional requirements

### 7.1 Observation

- **FR-O1** — The oracle observes, at minimum: session start, user prompt
  submission, completed read/search tool calls, pending edit/write tool
  calls, completed edit/write tool calls, and session stop; it reads agent
  narration from the transcript (`transcript_path`, §6.1) as its primary
  intent signal. `[RETHINK §5]` `[HOOKS]`
- **FR-O2** — Shims contain no decision logic; they forward the event and
  relay at most one whisper back. `[RETHINK §11]`
- **FR-O3** — **Fail open, fast.** Any shim or service error, timeout, or
  missing store yields silence — never an error in the agent's flow. Added
  latency: p95 ≤ 1.5 s per event, hard ceiling 3 s, after which the event
  resolves to silence (the candidate may carry to the next event). Budget
  motivated by hooks being turn-blocking `[HOOKS]`; the p95 target
  implements the owner's "~1–2 s or stay silent" bound `[RETHINK §5]`; the
  3 s ceiling is a spec judgment `[D-11]`.
- **FR-O4** — **No deny path exists, structurally.** Shims are incapable of
  returning a blocking decision (§6.1 output discipline); asserted by test
  (AC-3), not policy. `[OWNER-3]`
- **FR-O4a** — **Continuation is bounded to one.** Delivering a whisper at
  `Stop`/`SubagentStop` continues the agent's turn (§6.1) — the oracle
  therefore emits on those events **only when `stop_hook_active` is `false`**,
  extending a turn at most once per stop and never chaining. It never prevents
  a turn from ending. Asserted by test (AC-3), not policy. `[OWNER-12]`
  *(Added 2026-07-30. FR-O4 alone was insufficient: it enumerates the deny
  fields, and continuation is a distinct control-flow axis that carries none of
  them — which is why AC-3 passed while the effect was live.)*
- **FR-O5** — Whisper opportunities are harness event boundaries only —
  never timers or idle detection. Task-boundary intervention is the measured
  sweet spot for proactive assistance; idle-time triggering interrupts
  thinking, not waiting. `[CHI-25]`
- **FR-O6** — **Subagents are consumers too.** `[OWNER-8]` The oracle
  observes subagent lifecycle and tool events (`SubagentStart`/`SubagentStop`
  exist in the verified event list `[HOOKS]`); Tier 3 state (files seen,
  whispers sent, dedup, budgets) is kept per consumer, keyed by the event's
  session/agent identity; a whisper is delivered to the consumer whose event
  fired. Per-consumer budgets roll up into the session total (FR-A3).
  Whether tool hooks fire inside subagent contexts and whether
  `additionalContext` reaches the *subagent's* context is **unverified** —
  routed to §14 with AC-21 contingent on the answer. `[D-16]`

### 7.2 Knowledge

- **FR-K1** — *Tier 2 structural index*: files, symbols, import/reference
  edges, directory topology, generated/vendored/build-output zones, test
  topology, per-region verification commands. Incremental; index content per
  `[RETHINK §4 T2]`; v1 language scope is TS/JS/TSX and Python behind a
  language-agnostic interface `[D-15]`.
- **FR-K2** — *Co-change graph*, mined from git history at file and symbol
  granularity `[ROSE-05]`, with mining hygiene as requirements, not options:
  - exclude merge commits (they duplicate and falsely relate changes)
    `[MSR-04]`;
  - exclude transactions above a size cap (default 30 changed entities — the
    ROSE bound; bulk/bookkeeping commits are noise) `[ROSE-05]` `[HH-04]`;
  - record co-change counts, ratios, and recency; recency *weighting* in
    ranking is a per-project tunable, not hardwired — it helped on
    frequently-restructured projects and did nothing on stable ones, and one
    study found recency pruning outright disappointing `[ROSE-05]` `[HH-04]`
    `[D-3]`;
  - a configurable history horizon caps how old a transaction may be and
    still teach ("ROSE should not learn from too old transactions")
    `[ROSE-05]`;
  - refresh incrementally as history grows.
- **FR-K3** — *Exemplar registry*: canonical examples of recurring patterns
  stored as pointers to real code, never as extracted abstract rules.
  Existing behavior is evidence of convention, not automatically a
  requirement. `[RETHINK §4 T1]`
- **FR-K4** — *Landmine records*: revert chains, fix-of-a-fix commits, flaky
  tests, footgun APIs, deprecated-but-present modules — each with the
  evidence that earned the label. `[RETHINK §4 T1]`
- **FR-K5** — *Invariant records*: cross-file contracts that must change
  together (enum ↔ switch, schema ↔ generated types, config key ↔ reader),
  with participating locations. `[RETHINK §4 T1]`
- **FR-K6** — Every record carries provenance — `file:line` span, commit
  hash, human statement (with date), or `learned:<session>` reference — and a
  trust label distinguishing repo-derived (untrusted text) from
  human-stated origins. Records without provenance are unrepresentable in
  the store schema. `[RETHINK §4]` `[ASI-26]` (§8 threat T2)
- **FR-K7** — Staleness never blocks and never spams: a stale index lowers
  confidence (usually to silence) and triggers background refresh. Predictive
  power measurably decays on outdated history. `[ROSE-05]`
- **FR-K8** — Stores are per-repository (keyed by repository identity) and
  per-user (global), both outside the repository tree (P8). `[OWNER-6]`
  Default layout `~/.ctxoracle/projects/<repo-key>/` and
  `~/.ctxoracle/global/` is a discoverability default, not a requirement
  `[D-13]`.
- **FR-K9** — `ctxoracle export`/`import` round-trips a project store to a
  single file so learned knowledge survives ephemeral containers; export is
  user-initiated and the oracle never commits its own state anywhere.
  `[OWNER-4]` `[P8]`

### 7.3 Attention (when to speak)

- **FR-A1** — Per event the oracle answers internally: *given what the agent
  is doing right now, do I know something it almost certainly doesn't that
  would change what it does next?* Default answer: no → silence (P1).
  `[RETHINK §5]`
- **FR-A2** — Whisper genres and triggers:

  | Genre | Trigger (hook) | Content |
  |---|---|---|
  | Orientation | prompt submitted | 2–4 entry points, the invariant that will matter, landmines matching the task shape; ≤ 400 tokens |
  | Coupling | file read / symbol searched | strongest co-change partners; canonical helper for the thing searched |
  | Assumption check | narration states something the store contradicts | "narration assumes X; evidence says Y at `file:line`" |
  | Steering | narration intent doesn't match where the agent is looking | where that concern actually lives |
  | Consequence | edit/write pending (PreToolUse) | call-site count and spread, historical breakage, existing implementation to reuse |
  | Warning ⚠ | edit pending on generated/vendored zone, or landmine with strong evidence | FR-D3 |
  | Completeness | edit completed / stop | the paired file not yet touched, per co-change/invariants |
  | Verification | stop | the verification command for the changed region |
  | Answer | narration addresses the oracle | best-effort answer or an honest "don't know" |
  | Unknown | task depends on something the repo doesn't determine | names the gap as a product/human decision |
  | Process | a loaded skill/workflow's stated steps depart from observed activity | the departed-from step, with a pointer to the governing skill/workflow line |
  | Answer drift | a direct user question goes unaddressed across successive turns | names the open question and where it was asked |

  `[RETHINK §5]` (Process and Answer drift: `[OWNER-9]`, FR-A8/FR-A9)
- **FR-A3** — Budgets: at most one whisper per event (§6.1); a per-session
  injected-token budget — hard caps per `[RETHINK §5]`, with the 2,000-token
  default a spec judgment `[D-10]`, configurable; orientation counts against
  it; warnings get priority within the budget, not exemption from it.
- **FR-A4** — Dedup against Tier 3 state: never tell the agent what it has
  already read, been told, or visibly acted on; orientation-genre candidates
  decay out of consideration once the agent is deep in the task.
  `[RETHINK §5]`
- **FR-A5** — Confidence gating: each candidate carries confidence ×
  estimated decision-impact; only the top candidate above the bar is spoken.
  The bar is configurable, ships high, and rises further in degraded mode
  (FR-J3). History-backed genres additionally respect evidence floors:
  warn-grade claims — any whisper delivered in the FR-D3 ⚠ format, i.e. the
  Warning genre and completeness whispers escalated to warnings — require
  co-change support ≥ 3 and confidence ≥ 0.9 by default — the operating point at which
  history-mined warnings showed >66% precision with a 2% false-alarm rate —
  while suggestion-grade coupling may run looser but never below pruned-
  heuristic levels (support ≥ 2 plus a confidence threshold), because raw
  co-change association is ~6% precise. `[ROSE-05]` `[HH-04]` `[D-5]`
- **FR-A6** — Cold start: below a configurable minimum of mined history per
  region, history-backed genres stay silent rather than guess — history
  heuristics need a warm-up corpus. `[ROSE-05]` `[HH-04]`
- **FR-A7** — First impressions: in a project's first sessions (configurable
  count), only highest-confidence genres speak. The first few reports set the
  tool's credibility disproportionately. `[COVERITY-10]`
- **FR-A8** — **Process conformance.** `[OWNER-9]` When a skill or workflow
  is loaded (its text is visible in the transcript, §6.1), its stated steps
  become session-scoped expectations in Tier 3. Observed departures — a
  skipped required step, a completion claim with no verification activity, a
  fabricated-looking output for a step whose tool calls never ran — produce
  an advisory Process whisper naming the specific step, with a pointer to
  the governing line. Never a block (P2); detection is judgment-layer work
  (model path required — not in the FR-J3 degraded set), and the genre lives
  under the §9.2 enforcement ladder like every warning-adjacent channel.
- **FR-A9** — **Answer drift.** `[OWNER-9]` Direct user questions are
  tracked as open items in Tier 3. If successive assistant turns (default 2,
  tunable `[D-17]`) fail to address an open question, the oracle whispers
  the question back — verbatim, with its location — so the agent can answer
  it or say why it can't. Adopted without published grounding as an
  owner-directed innovation with the §9.2 kill-switch as the safety net
  `[D-18]`.

### 7.4 Delivery (whispers)

- **FR-D1** — Whisper format: `[oracle]` prefix, genre tag, confidence tag
  when below high, a claim of one to five sentences, at least one verifiable
  pointer, optionally a one-line "so what." Guidance must carry enough for
  the reader to assess what the problem is and why `[JOHNSON-13]`. Example:

  > `[oracle] (coupling) src/state/store.ts changed alongside
  > src/routes/SettingsPage.tsx in 16 of its last 20 commits (git log since
  > 2025-01). If this edit adds settings state, the store likely needs a
  > matching change.`

- **FR-D2** — Tone is informative, never imperative: whispers state facts and
  consequences, never commands. This keeps the agent the decision-maker and
  is part of the injection defense (§8): the channel's own convention is
  that it carries data, not instructions. `[RETHINK §6]` `[LLM01]`
- **FR-D3** — Warning subtype: ⚠ marker, the mechanical evidence for the
  classification, the concrete consequence, and an explicit false-fire
  clause inviting correction in narration. Example:

  > `[oracle] ⚠ warning (generated-file): dist/schema.d.ts appears to be
  > build output of src/schema.ts (generated-header marker; written by "npm
  > run build"). Hand edits will be overwritten on the next build — the
  > editable source is src/schema.ts. If this classification is wrong,
  > proceed, and say so in your narration so the oracle learns.`

  No warning is ever a block (P2). The false-fire clause is the feedback
  channel FR-L3 consumes — the analog of Tricorder's "Not useful" click,
  which files a routed, owner-visible correction. `[CACM-18]` `[OWNER-3]`
- **FR-D4** — The only agent-facing channel is hook context injection.
  Human-facing notices (degraded mode, index rebuild) use the human-visible
  channel (`systemMessage` or CLI) and never consume agent context.
  `[HOOKS]` `[RETHINK §6]`
- **FR-D5** — Co-change claims always state their evidence ratio (e.g. "16 of
  the last 20 commits"), never as certainty: tangled commits mean even clean
  histories encode spurious edges. `[HERZIG-13]`

### 7.5 Judgment layer

- **FR-J1** — Two stages: deterministic candidate generation from the stores
  (fast, always available), then judgment selection of zero-or-one whisper.
  Purely mechanical candidates with objective evidence (e.g. generated-file
  warnings) may bypass model judgment. `[RETHINK §11]`
- **FR-J2** — Model access follows §6.2: host piggyback, else degraded mode;
  the judgment call uses a small fast model (Haiku-class) for intent
  tracking, ranking, and drafting. `[OWNER-2]` `[CLI]`
- **FR-J3** — Degraded mode (no model path available): deterministic genres
  only — minimal orientation (structural entry points and literal-match
  landmines, no model intent inference), coupling, generated-file warning,
  verification, completeness — with a raised confidence bar, announced once
  per session on the human channel and never into agent context. `[OWNER-2]`
  `[RETHINK §11]`
- **FR-J4** — Judgment fits the FR-O3 latency budget: candidates precomputed
  or asynchronous wherever possible; the model call gets one shot within
  budget or the event resolves to silence. `[RETHINK §5]`
- **FR-J5** — The judgment prompt is constructed so retrieved repo text
  cannot alter the oracle's behavior: instructions and data are structurally
  separated, and repo-derived strings enter the prompt only inside clearly
  delimited data fields. (Threats T1/T2, §8.) `[LLM01]` `[OWASP-PI]`

### 7.6 Companion skill

- **FR-S1** — The skill teaches the agent three things: how to read
  `[oracle]` notes (margin notes from a colleague who knows the repo's
  history — verify the pointer before relying on the claim); how to narrate
  to be helped (state intent before tool bursts, name the task's nouns early,
  voice assumptions); and that it may address the oracle in plain narration
  with no format or ritual. `[RETHINK §7]`
- **FR-S2** — The skill is optional; every oracle capability functions
  without it (P3).
- **FR-S3** — A direct address is answered at the next injection opportunity,
  best effort; if the oracle doesn't know, it says so rather than guessing.
  `[RETHINK §7]`

### 7.7 Learning (distiller)

- **FR-L1** — The session service logs, per event: candidates considered,
  whisper sent (if any), and subsequent evidence of uptake (pointed file
  opened, named helper used, suggested command run, warning proceeded past).
  `[RETHINK §8]`
- **FR-L2** — The distiller runs post-session over that log plus the session
  diff and answers: what did the agent need that the oracle didn't say
  (regret)? what was said and ignored (noise)? which task shape used which
  region (recipe)? which warnings were false fires? `[RETHINK §8]`
- **FR-L3** — False-fire handling: a warning the agent proceeded past with a
  good outcome, or that narration explicitly corrected, is demoted; a
  repeatedly false specific warning is suppressed. Suppression is per-fact,
  provenance-traceable, and reversible via the CLI. This implements the
  probation/disable ladder that kept analyzer quality honest at scale.
  `[TRICORDER-15]` `[CACM-18]` `[OWNER-3]`
- **FR-L4** — Routing: repo facts (co-change, exemplars, landmines,
  invariants, recipes) → project store; whisper-efficacy statistics,
  bar tuning, cross-project lessons → global store. `[OWNER-6]`
- **FR-L5** — Learned records carry `learned` provenance and are evictable by
  source, so a bad distillation is traceable and removable without wiping
  the store. `[RETHINK §8]` (Also the recovery path for T2, §8.)
- **FR-L6** — Human statements in chat are recorded as facts with human
  provenance — no override ritual; the user saying it is the authority.
  `[RETHINK §8]`
- **FR-L7** — Interaction-failure patterns (answer-drift instances, process
  departures, conduct-genre efficacy) are learned to the global store, so
  recurring failure shapes raise the matching genre's priority across
  projects. `[OWNER-9]` `[OWNER-6]`

### 7.8 Self-observability (diagnostics)

The owner cannot be the failure detector: the project's operating model is
lights-out, agent-led work, and "it could fail a hundred ways in front of me
and I wouldn't know." `[OWNER-10]` The whisper channel stays in-workflow; the
diagnostic channel exists for the tool's own maintainers — the same split
Google found (in-workflow results for consumers, dashboards useful precisely
and only for the people improving the analyzers). `[TRICORDER-15]`

- **FR-M1** — Every component emits structured diagnostic events to a local
  diagnostic log, separate from the whisper audit log (FR-X6): hook
  invocations with latency and outcome (whisper/silence/timeout/error),
  model-call attempts and results, store read/write failures, index refresh
  runs, degraded-mode transitions, and delivery results. Secrets rules
  (FR-X1) and locality rules (FR-X7) apply to this log in full.
- **FR-M2** — The oracle detects its own failure classes from that log
  without human observation: hooks not firing (expected-event gaps), latency
  budget breaches, persistent model-path failure, store corruption, index
  staleness beyond FR-K7 bounds, and whispers produced but not delivered.
  `ctxoracle status` surfaces current health and recent anomalies in plain
  language readable by a non-programmer. `[OWNER-10]`
- **FR-M3** — The distiller consumes diagnostics: detected failures become
  findings alongside regrets and false fires, and recurring failures
  generate an actionable self-report that the next working agent (or the
  owner) reads at session start — the mechanism by which improvement stops
  depending on what the human notices. `[OWNER-10]`
- **FR-M4** — Diagnostics never touch agent context and never leave the
  machine; a broken oracle degrades to silence in the agent's session (FR-O3)
  while saying exactly what broke on its own channel.

### 8.1 Threat model

The oracle reads untrusted repository text and writes into the context window
of an agent that holds real permissions. That combination — retrieval plus
persistent memory plus a privileged consumer — is precisely the surface the
current OWASP guidance names. Attackers and stakes:

- **T1 — Indirect prompt injection at whisper time** `[LLM01]` `[OWASP-PI]`.
  Attacker: the author of any text the oracle ingests — dependencies,
  vendored code, contributed commits, code comments, commit messages (the
  cheat sheet's own examples of injection carriers). Goal: get instructions
  smuggled through a whisper into the working agent's context. Cost of
  compromise: the agent acts with the user's permissions — arbitrary code
  and tool actions (goal hijack, `[ASI-26]` ASI01).
- **T2 — Knowledge-store poisoning** `[ASI-26]` (ASI06 Memory & Context
  Poisoning). Same attacker, longer game: plant text that the indexer or
  distiller records as a durable "fact," replayed with the oracle's implicit
  authority across future sessions. Cost: persistent influence over an
  agent's reasoning that outlives the planted text itself.
- **T3 — Sensitive-data disclosure** `[LLM02]`. Not an attacker but a flow:
  secrets present in repo files or git history get copied into stores,
  whisper logs, or whispers — surviving even after the repo itself is
  scrubbed, and potentially leaving the machine via a model call. Cost:
  credential compromise.
- **T4 — The oracle as an over-privileged component** `[LLM01]` (least
  privilege). If the oracle can write to the repo, invoke tools, or reach
  the network beyond its model call, every compromise above escalates.

### 8.2 Security requirements

Each requirement names the threat it controls.

- **FR-X1** (T3) — Secret detection runs on all text before it enters a
  store, a whisper, a log, or a model-call prompt; matches are redacted or
  masked, never stored or emitted in plaintext. Scanner-grade signature
  matching per `[OWASP-SM]` §8; detect-and-redact before processing per
  `[LLM02]`.
- **FR-X2** (T1) — All repo-derived text is data, never instruction:
  whispers are produced from a fixed schema validated by deterministic code,
  and repo-derived strings appear in a whisper only as clearly delimited
  quotations or pointers — "segregate and identify external content" and
  "define and validate output formats." `[LLM01]` `[OWASP-PI]`
- **FR-X3** (T1) — Content flagged injection-suspect at index time is never
  quoted into a whisper or a judgment prompt; it is referenced by pointer
  only. `[LLM01]`
- **FR-X4** (T2) — Store records preserve their trust origin (FR-K6):
  repo-derived records remain labeled untrusted through every pipeline
  stage, distillation included — a learned record derived from repo text
  cannot acquire human or mechanical provenance. Whispers built on untrusted-
  origin records obey FR-X2/X3 exactly as live text does. `[ASI-26]`
- **FR-X5** (T4) — Least privilege: the oracle holds read-only access to the
  repository, no tool-invocation authority in the agent's session, and no
  network access beyond the §6.2 model call. It never mutates the repo (P2,
  P8). `[LLM01]`
- **FR-X6** (T1, T2, oversight) — Every whisper is logged with the evidence
  it used, giving the human a reviewable audit trail (`ctxoracle status` /
  log inspection) and the distiller its raw material — the human-oversight
  mitigation for a channel no human sees live. `[LLM01]` `[RETHINK §10]`
- **FR-X7** (T3, privacy) — Both stores are local to the user's machine or
  container; no telemetry leaves the machine. The global store is the only
  "collective feedback" mechanism and it is the user's own. `[OWNER-6]`
- **FR-X8** (T1, T2) — The test suite includes adversarial fixtures:
  injection payloads planted in code comments, commit messages, and file
  content, asserting no whisper relays or obeys them (AC-7) — "conduct
  adversarial testing" `[LLM01]` with the cheat sheet's own carrier examples
  `[OWASP-PI]`.

## 9. Non-functional requirements

### 9.1 Performance

- **NF-1** — Hook-added latency per FR-O3: p95 ≤ 1.5 s, ceiling 3 s, then
  silence. (Hooks block the turn `[HOOKS]`; a slow oracle is a gate by
  another name `[RETHINK §5]`.)
- **NF-2** — Session token overhead: total injected tokens per session within
  the FR-A3 budget; measured and reported by `ctxoracle status`.
- **NF-3** — Indexing is incremental after first build; first build on a
  mid-size repo must not require network access beyond what the harness
  already has (C-1).

### 9.2 Health metrics and thresholds

**Who records, who computes, who learns** *(corrected 2026-08-01; this read
"Measured from the FR-X6 log by the distiller", which contradicted §6.3 and NF-2
and put every metric behind a Phase 2 component)*:

- **Recorded** as the session runs: hook invocations with latency and outcome
  (**FR-M1**); the whisper and the evidence it used (**FR-X6**); and the
  subsequent evidence of uptake (**FR-L1** — *"pointed file opened, named helper
  used, suggested command run, warning proceeded past"*). FR-L1 names the session
  service as its writer; FR-M1 names every component; **FR-X6 names no writer** —
  that the session service writes the whisper log is a derivation from its being
  the component that emits whispers, not something this spec states.
- **Computed and reported** by `ctxoracle status` from those logs (§6.3, *"health
  metrics §9.2"*; NF-2, overhead *"measured and reported by `ctxoracle status`"*).
- **Consumed** by the distiller (FR-L2–L5, L7), which learns from the metrics and
  tunes the bar.

The distinction is load-bearing for the build order: a metric is available in the
phase that records and computes it, not in the phase that learns from it. Note
that the enforcement ladder below is itself Phase 2 (§12), as is the distiller —
so the *use* of these metrics is later than their availability. Inspectable via
`ctxoracle status`. The effectiveness vocabulary follows the Tricorder
definition — an *effective false positive* is any report the consumer chooses
not to act on, regardless of technical correctness `[TRICORDER-15]`
`[CACM-18]`:

- **Hit rate** — whispers with observed uptake ÷ whispers sent.
- **Silence rate** — events with no whisper ÷ events observed (healthy:
  high; falling silence with flat hit rate means it's getting chatty).
- **Regret rate** — post-hoc: wrong edits the store could have prevented but
  the oracle didn't speak to.
- **False-fire rate** — warnings contradicted by outcome or narration.
- **Ceremony count** — agent actions required by the oracle. Must be 0,
  always. `[RETHINK §10]`
- **Overhead** — NF-1/NF-2.

Enforcement ladder for the warning genre (the trust-critical channel),
adapted from Tricorder's analyzer discipline `[TRICORDER-15]` `[D-4]`: a
warning subtype whose false-fire rate reaches 10% goes on probation (bar
raised, flagged in `status`); at 25% it is auto-suppressed pending owner
review. The 10% figure is an established convention, not a derived constant —
its own authors say it was chosen "somewhat arbitrarily" but proved a
durable sweet spot `[CACM-18]`; survey ceilings sit at 15–20% `[CB-16]` and
trust collapses above ~30% `[COVERITY-10]`.

## 10. Constraints

- **C-1** — Cold-container ready: installs and indexes with no native
  toolchain, no prebuilt-binary download, no network beyond what the harness
  already has. Known satisfying stack: Node ≥ 22.13.0, where built-in
  `node:sqlite` needs no flag and ships FTS5 on both current LTS lines
  (v22 maintenance, v24 active/release-candidate stability). FTS5 presence
  is a build-config fact of official Node builds, not a documented API
  promise — the architecture must not be unable to fall back if it moves.
  `[NODE]` `[D-7]` This names a satisfying stack, not a mandate.
- **C-2** — Session state persists warm across hook invocations with
  sub-second access (a background service with local IPC, or equivalent) —
  cold-starting per event cannot meet NF-1. `[RETHINK §5]`
- **C-3** — Harness integration is Claude Code hooks in v1; all
  harness-specific knowledge lives in the shims, and the service speaks a
  harness-neutral event contract (this is also what keeps subagent and
  other-harness support open, §2). `[RETHINK §11]`
- **C-4** — `ctxoracle init` is explicit and minimal: wire hooks, create the
  out-of-tree store, nothing else; `deinit` removes the wiring cleanly.
  Passive auto-bootstrap writing files into a project tree is prohibited
  `[CLAUDE.md standing rule]`; the explicit init/deinit contract shape is a
  spec judgment `[D-12]`.
- **C-5** — The hooks contract facts in §6.1 are version-bound (verified
  2026-07-13); implementation re-verifies against current docs, and shims
  degrade to silence on any contract drift they detect (FR-O3). `[HOOKS]`

## 11. Decisions made in this spec

Where writing this spec required judgment beyond direct derivation, the
decision and reasoning are recorded here.

- **D-1 — MCP sampling removed from the model-access ladder.** RETHINK §12.2
  kept it conditionally ("if/when host support is solid"). The condition is
  now resolved by evidence: the MCP spec deprecated sampling (SEP-2577,
  protocol 2026-07-28; "new implementations SHOULD NOT adopt it") and Claude
  Code never supported it. `[MCP-DEP]` Model access is now piggyback →
  degraded, nothing else: an explicit-API-key middle rung that appeared in
  the superseded SPEC.md draft was rejected by the owner on 2026-07-15 —
  the oracle never holds credentials of its own.
- **D-2 — Advisory-only stands despite evidence that non-blocking warnings
  get ignored.** The literature cuts both ways: Google found build warnings
  "often ignored" and made Clang diagnostics errors `[CACM-18]`, but blocking
  channels demand near-zero false positives `[TRICORDER-15]` — a bar a
  heuristic, history-mined system cannot honestly meet — and the owner's
  measured experience is that gates blocked legitimate work `[OWNER-3]`.
  Resolution: no blocks (owner decision), with the ignored-warning risk
  managed by the loud-warning format (FR-D3), false-fire accounting
  (FR-L3), and the §9.2 enforcement ladder.
- **D-3 — Recency weighting demoted from hardwired to tunable.** RETHINK §4
  described the graph as recency-aware; the evidence is split — linear
  recency weighting improved precision/recall on a frequently-restructured
  project and did nothing on a stable one `[ROSE-05]`, and recency pruning
  performed "disappointing[ly]" elsewhere `[HH-04]`. Recency is recorded
  always; its use in ranking is per-project configuration.
- **D-4 — The 10%/25% enforcement ladder adopted as convention.** No agent-
  specific threshold exists; 10% is the strictest published convention with
  long production use, and its provenance (chosen "somewhat arbitrarily,"
  validated by a decade of practice `[CACM-18]`) is cited rather than
  laundered into a derived constant. Tunable via the global store.
- **D-5 — Warn-grade evidence floor set to support ≥ 3, confidence ≥ 0.9.**
  Taken directly from the operating point ROSE validated for its
  error-prevention (warn) mode — precision > 66%, false alarms 2%
  `[ROSE-05]` — because that is the published point where history-mined
  warnings stop being noise. Defaults, not ceilings; the learning loop tunes
  per project.
- **D-6 — Recursion guard stated as a property, not a mechanism.** Whether
  nested `claude -p` calls inherit hook configuration is undocumented; the
  spec requires the property (no oracle-triggered oracle activity) and
  leaves the mechanism to the architect, with AC-11 as the check.
- **D-7 — Node floor raised from 22.5 to 22.13.** v22.5.0 introduced
  `node:sqlite` behind a flag; the flag requirement ended at v22.13.0 /
  v23.4.0 `[NODE]`. A constraint that requires users to pass an experimental
  flag is not "cold-container ready."
- **D-8 — Human-tooling numbers applied to an agent consumer.** All adopted
  thresholds (§3 note, §9.2, FR-A5) come from studies of human developers;
  the mapping is a calibrated starting point and every such number is
  runtime-tunable so the learning loop can move it once agent-specific data
  exists.
- **D-9 — Spec relocated and renamed.** `SPEC.md` (repo-style ad-hoc
  location) is replaced by this document at `docs/specs/spec-context-oracle.md`,
  the project's default spec location and naming convention.
- **D-10 — Session token budget defaulted to 2,000.** RETHINK §5 requires
  hard per-session caps but sets no number; 2,000 ≈ five orientation-size
  whispers at the owner's ~400-token orientation bound. Configurable; the
  learning loop tunes it.
- **D-11 — 3 s hard latency ceiling.** The owner set "~1–2 s or stay
  silent" (the p95 ≤ 1.5 s target implements it); the 3 s kill-switch is a
  spec judgment giving slow events a bounded grace well inside the
  harness's own 30 s UserPromptSubmit cap `[HOOKS]`.
- **D-12 — Explicit init/deinit contract shape.** The no-auto-bootstrap
  rule is the CLAUDE.md standing rule; shaping it as a minimal, cleanly
  reversible `init`/`deinit` pair is spec judgment.
- **D-13 — Default store layout is a CLI default, not a requirement.**
  OWNER-6 fixes the properties (per-repo and per-user stores, outside the
  repo tree); the `~/.ctxoracle/` layout is a discoverability default the
  architect may revise.
- **D-14 — AC-2 whisper-rate threshold defaulted to ≤ 10% of events.** No
  published figure maps to per-event whisper rates for agent sessions; 10%
  operationalizes "most events are silent" and is tunable with fixture
  experience.
- **D-15 — v1 language scope: TS/JS/TSX and Python.** Chosen from the
  owner's active stacks; a scope judgment pending owner confirmation,
  isolated behind FR-K1's language-agnostic interface so widening it later
  is additive.
- **D-16 — Subagent delivery mechanics.** OWNER-8 puts subagents in scope
  but not how; the spec chooses per-consumer Tier 3 state with delivery to
  the consumer whose event fired, because whisper relevance is
  consumer-local (a coupling fact matters to whoever holds the editing
  context). Contingent on the unverified subagent hook contract (§14); if
  the harness can't inject into subagent contexts, the architect proposes a
  fallback and the owner accepts or descopes.
- **D-17 — Answer-drift threshold defaults to 2 unresponsive turns.** One
  turn is legitimate re-framing; waiting longer than two multiplies the
  owner's cost of being ignored. No published figure exists; tunable.
- **D-18 — Conduct genres adopted without published grounding.** No
  peer-reviewed evidence exists that advisory whispers correct process
  departures or answer drift in agents; the genres are owner-directed
  innovation `[OWNER-9]` shipped under the §9.2 enforcement ladder, so if
  they misfire they demote themselves like any other warning channel.
- **D-19 — Diagnostic layer shape.** OWNER-10 fixes the property (failures
  detected and surfaced without human observation); the split into a
  structured diagnostic log, self-checks, plain-language `status`, and a
  distiller self-report is spec judgment, patterned on the consumer/author
  channel split `[TRICORDER-15]`.
- **D-20 — Governance doc lives at `middleware/context-oracle/CLAUDE.md`.**
  OWNER-11 requires written agent guidelines; placing them in the
  directory's CLAUDE.md makes them load automatically for any agent working
  the project, rather than relying on agents finding a doc.

## 12. MVP boundary and build order

**How to read this section (added 2026-07-31).** The phase exits below are
**measurements, not tests** — each phase is gated on evidence only the previous
phase can produce by actually running. It follows that the requirements for
Phase 1 and Phase 2 stated elsewhere in this spec are **provisional**: they fix
scope, intent and constraints, and they are *not* a design-ready basis until the
measurements their exits name exist. Requirements whose values or mechanisms
depend on those measurements are listed in §14 as gated, not settled. Architect
and build one phase at a time; do not treat a Phase 1 requirement as
architecturally resolvable before Phase 0 has run.

*(This paragraph exists because four adversarial review rounds on 2026-07-30/31
collapsed the Phase 1 and Phase 2 architecture in every round while the Phase 0
material survived every round. The split ran exactly along this boundary. See
`docs/collapse-log.md`, 2026-07-31.)*

**What decides Phase 0's contents — OPEN, and blocking (2026-08-01).** §12 lists
each phase's components, genres and exits, and states the phase *dependency*
(above: each phase is gated on evidence only the previous phase can produce by
running). It has never stated a rule that decides what belongs in a phase. A rule
was drafted here on 2026-08-01 — "a genre, mechanism or store table belongs in
Phase 0 if running it produces a measurement Phase 1 or 2 needs" — and was
removed the same day after an independent collapse-hunt returned seventeen
findings against it (`docs/reviews/2026-08-01-collapse-hunt-phase0-purpose.md`).
It is recorded as removed, not as pending: it asserted an unattributed
exclusive-purpose claim, was undecidable on its own materials, and supplied a
build-plan-level exclusion lever of exactly the form the preceding hunt had spent
fourteen findings removing.

**Which measurements Phase 0 emits — partly settled 2026-08-01, one row still
open.** §9.2 attributed its metrics to the Phase 2 distiller while §6.3 and NF-2
attribute them to `ctxoracle status`, a Phase 0 CLI. That is an over-broad
attribution in §9.2, corrected there: **recording, computing and learning are
three jobs.** FR-L1 assigns the per-event log — *"candidates considered, whisper
sent (if any), and subsequent evidence of uptake"* — to the **session service**,
which §12 places in Phase 0; FR-L2 gives the distiller the post-session analysis
of that record.

| Measurement | Recorded by | Store row | Computed by | What it unblocks |
|---|---|---|---|---|
| Silence rate | FR-M1 (outcome per event) | `session_log.outcome` | `status` (§6.3) | Phase 1 exit; the FR-A5 bar's operating point |
| Hit rate | FR-L1 (uptake evidence) — **but see the open item below** | `whisper_log.uptake` | `status` (§6.3) | Phase 1 exit; per-genre admission |
| Latency (NF-1) | FR-M1 (latency per event) | `session_log.latency_ms` | `status` (§6.3) | Phase 1's model-call budget |
| Token overhead (NF-2) | FR-A3 budget accounting *(no requirement names a recorder — gap, §14)* | — | `status` (NF-2, explicit) | The FR-A3 per-session budget |
| False-fire rate — **outcome arm only** | FR-L1 (warning proceeded past) | `whisper_log.false_fire` | `status` (§6.3) | Warn-grade floors; the §9.2 ladder (Phase 2) |
| Continuation count | §6.1 (every Stop delivery recorded in FR-X6) | `whisper_log.continuation` | `status` (§6.1, explicit) | OWNER-12's accepted cost |

Scope of this table, stated rather than implied: it covers the metrics Phase 1's
exit names plus those §6.1 and NF-2 assign to `status`. It does **not** cover
§9.2's **regret rate** or **ceremony count**, and nothing here addresses Phase 2's
exit (*"a demonstrated case of the oracle measurably improving between
sessions"*), which no single metric expresses. Those remain unassigned.

**The open item this table does not close.** FR-L1 says the session service logs
*evidence* of uptake; the architecture says *"uptake detection … owned by the
distiller"*, and the store column is nullable — the shape of a deferred writer.
Recording a later tool event is Phase 0; deciding that the event *constitutes*
uptake of a particular whisper is a join, and the two documents assign it to
different phases. **Hit rate is therefore not established as a Phase 0 metric.**
Until that is settled, silence rate, latency and continuation count are the
measurements Phase 0 is known to emit.

**Two further gaps this table surfaced:** the false-fire rate's second arm
(§9.2: warnings contradicted by *"outcome or narration"*) needs a narration
reader, which §12 places in Phase 1 — so Phase 0 measures the outcome arm only;
and no requirement names a recorder for token counts (FR-X6 logs evidence, not
tokens; FR-A3 states a budget and assigns no recorder).

*(This paragraph stated the opposite twice before it was checked, and then
overstated the fix a third time. The corrections are kept visible because the
same reading error produced all three: reading one section and not the ones that
answer it. All open items above are carried in §14.)*

- **Phase 0 — deterministic spine.** Shims + session service + Tier 2 index +
  co-change miner (with FR-K2 hygiene) + the diagnostic core (FR-M1, FR-M2).
  Genres: the FR-J3 degraded set (deterministic minimal orientation,
  coupling, generated-file warning, verification, completeness). Degraded
  mode *is* the product at this phase. Exit: AC-1..AC-5, AC-12, AC-14,
  AC-17, AC-18 pass; the owner runs it on a real project without incident.
- **Phase 1 — judgment.** §6.2 model access incl. recursion guard; narration
  intent tracking; assumption-check, steering, consequence, answer genres;
  conduct genres (FR-A8, FR-A9); subagent delivery (FR-O6); companion skill;
  the §14 Phase 1 verifications (piggyback credential coverage, transcript
  freshness, subagent hook contract). Exit: AC-6..AC-8, AC-11, AC-16,
  AC-19, AC-20 pass (AC-21 contingent per §14); measured silence and hit
  rates reviewed against the bar.
- **Phase 2 — learning.** Distiller, false-fire ladder, landmine and
  invariant mining, recipes, interaction-pattern learning (FR-L7),
  diagnostics self-report (FR-M3), global-store tuning, export/import.
  Exit: AC-9..AC-10, AC-13, AC-15, AC-22 pass; a demonstrated case of the
  oracle measurably improving between sessions on the same repo.

## 13. Acceptance criteria

Each criterion names the requirements it verifies.

- **AC-1 (coupling → FR-K2, FR-A5, FR-D1, FR-D5, NF-1)** — In a fixture repo
  with a known co-change pair, an observed edit to one file yields a coupling
  whisper naming the other, stating its evidence ratio, with a git-history
  pointer, within the latency budget.
- **AC-2 (silence → P1, FR-A1)** — Replaying a recorded session of routine
  events produces whispers on at most 10% of events (default threshold,
  tunable with fixture experience `[D-14]`).
- **AC-3 (no deny → FR-O4, FR-O4a, FR-O3)** — No shim code path can return a
  blocking decision (no `permissionDecision`/`decision` fields, no exit 2);
  induced service failure and timeout both yield silence and an unimpeded
  agent. **Widened 2026-07-30 to cover control flow, not only decision
  fields**, because the field scan passed while `Stop` delivery was extending
  turns: the fixture additionally asserts (a) that a `Stop`/`SubagentStop`
  event carrying `stop_hook_active: true` produces **silence**, and (b) that no
  oracle output can extend the agentic loop by more than a single continuation
  per stop. A criterion that scans only for the deny fields cannot see the
  continuation axis — that gap is what this widening closes.
- **AC-4 (pristine tree → P8, C-4, FR-K8)** — After `init`, index, a full
  session, and `deinit`, the repository tree's only ever-touched file is
  `.claude/settings.json`, and `deinit` restores it.
- **AC-5 (warning, not block → FR-D3, P2)** — An edit to a detected generated
  file proceeds unimpeded and receives the FR-D3 warning with mechanical
  evidence and the false-fire clause.
- **AC-6 (provenance → P4, FR-D1, FR-K6)** — Every emitted whisper parses to
  the FR-D1 format and every pointer resolves to a real location/commit in
  the fixture.
- **AC-7 (injection → FR-X2, FR-X3, FR-X8, FR-J5)** — With hostile imperative
  text planted in fixture file content, code comments, and commit messages,
  no whisper relays or obeys it; suspect content appears only as a pointer.
- **AC-8 (zero ceremony → P3, FR-S2)** — An agent with no companion skill
  completes a full task with the oracle active, producing no oracle-specific
  format, and receives whispers throughout.
- **AC-9 (false-fire learning → FR-L3, FR-D3, §9.2 ladder)** — After
  narration marks a specific warning wrong, the same warning is demoted or
  suppressed in the next session, and the suppression is visible and
  reversible via the CLI.
- **AC-10 (degraded mode → FR-J3, FR-D4)** — With all model paths
  unavailable, the oracle still delivers mechanical-evidence genres,
  announces degraded mode once on the human channel, and injects nothing
  about it into agent context.
- **AC-11 (recursion guard → §6.2 property, D-6)** — With the oracle active,
  an oracle-initiated model call produces no oracle hook activity and no
  nested model calls (asserted by instrumentation counter in the fixture
  harness).
- **AC-12 (secrets → FR-X1)** — Fixture secrets (API-key-shaped strings in
  tracked files and git history) never appear in plaintext in any store
  file, whisper, log, or captured model-call prompt.
- **AC-13 (trust origin → FR-X4, FR-K6)** — After distillation over a
  session that ingested repo-derived text, every resulting learned record
  still carries its untrusted/repo origin label; no pipeline stage yields a
  repo-derived record bearing human or mechanical provenance.
- **AC-14 (least privilege & locality → FR-X5, FR-X7)** — An instrumented
  fixture run shows oracle processes perform no writes inside the repository
  tree, open no network connections other than the §6.2 model call, and emit
  no outbound traffic at all when the model path is disabled.
- **AC-15 (export round-trip → FR-K9)** — `export` → store wipe → `import`
  yields a store that produces equivalent whispers on session replay.
- **AC-16 (attention discipline → FR-A4, FR-A6, FR-A7)** — Session replay
  asserts: no whisper repeats after its content is visibly incorporated;
  history-backed genres stay silent below the FR-A6 history floor; only
  highest-confidence genres fire within the FR-A7 first-sessions window.
- **AC-17 (staleness → FR-K7)** — With a deliberately stale index, events
  yield silence or reduced-confidence whispers (never errors or spam), and a
  background refresh is triggered.
- **AC-18 (self-detection → FR-M1, FR-M2, FR-M4)** — Induced failures —
  broken hook wiring, blocked model path, corrupted store, service killed
  mid-session — are each recorded in the diagnostic log and surfaced by
  `ctxoracle status` in plain language, with zero errors or added output in
  the agent's session.
- **AC-19 (process conformance → FR-A8)** — In a fixture session that loads
  a skill requiring a verification step, an agent completion claim with no
  verification activity draws a Process whisper naming the skipped step with
  a pointer to the governing skill line; the claimed action itself proceeds
  unimpeded.
- **AC-20 (answer drift → FR-A9)** — In a fixture transcript where a direct
  user question is followed by two non-responsive turns, the oracle whispers
  the open question verbatim with its location.
- **AC-21 (subagent delivery → FR-O6; contingent per §14)** — An edit event
  inside a subagent receives a coupling whisper in that subagent's context,
  and dedup is per-consumer: the same fact may reach the main agent and that
  subagent once each, and never twice to either.
- **AC-22 (self-report → FR-M3)** — After sessions containing an induced
  recurring failure, the distiller's self-report names the failure class and
  its frequency, and the report is present for reading at next session
  start.

## 14. Unresolved

- **Export-file format** (FR-K9): single-file archive vs mergeable log —
  the architect proposes in Phase 2 when the distiller's record shapes are
  settled; the owner approves. Blocks nothing until Phase 2.
- **Piggyback credential coverage** (§6.2): verify during Phase 1, per
  environment, that `claude -p` inherits the host session's auth in
  subscription-login sandboxes (documented for API-key/Bedrock/Vertex env;
  subscription-login inheritance is assumed and unverified — nothing in the
  evidence base confirms it). If an environment fails, that environment runs
  degraded (FR-J3) — no credential fallback exists; the owner decides
  whether degraded-only is acceptable there.
- **Transcript freshness** (§6.1, FR-O1): whether `transcript_path` content
  is current at hook-execution time is undocumented; verify in Phase 1. If
  the transcript lags the live turn, the narration genres (assumption check,
  steering, answer) would fire on stale text — the architect proposes a
  mitigation and the owner decides whether those genres ship enabled.
- **Subagent hook contract** (FR-O6, AC-21): whether tool hooks fire inside
  subagent contexts and whether `additionalContext` reaches the *subagent's*
  context is unverified. Verify in Phase 1; if the harness doesn't support
  injection there, the architect proposes the closest fallback and the owner
  accepts it or descopes subagent delivery.
- **Conduct-genre detection quality** (FR-A8, FR-A9): no published base
  rates exist for false fires on process/answer-drift detection. They ship
  under the §9.2 enforcement ladder; the owner reviews measured rates after
  the first instrumented sessions and decides whether they stay enabled by
  default.
- **`additionalContext` merge order** (§6.1): concatenation order across
  multiple hooks on one event is unspecified in the docs; moot while the
  oracle registers a single hook per event, revisit if that changes.

*The entries below were added 2026-08-01, surfaced by reading §9.2, §6.3, NF-2,
FR-L1, §12 and §13 against each other. Each blocks something named.*

- **Uptake detection's phase** (FR-L1, §9.2, §12): FR-L1 gives the session
  service the per-event log *"including subsequent evidence of uptake"*, and the
  architecture assigns uptake *detection* to the distiller. Recording an event and
  deciding it constitutes uptake of a given whisper are different acts, and the
  two documents place them in different phases. **Blocks hit rate**, which is
  named in Phase 1's exit — so it blocks that exit's meaning.
- **FR-J3 has no phase** (§12): neither Phase 0, 1 nor 2 names it, while
  `[OWNER-2]` and RETHINK §12 decision 2 (*"a deterministic-only degraded mode
  remains mandatory for true air-gap"*) make it a v1 obligation. Compounding it,
  Phase 0's genre set is defined *by reference to* FR-J3's degraded set — so an
  unphased requirement currently defines a phase's contents. Blocks the Phase 0
  genre set.
- **The Unknown genre has no phase** (FR-A2, §12): FR-A2 lists twelve genres;
  §12's phase bullets account for eleven. Unknown appears in none. Also unphased:
  the Warning genre's landmine arm (FR-A2 gives Warning *"generated/vendored
  zone, or landmine with strong evidence"*; Phase 0 admits only the generated-file
  half).
- **Consequence and answer drift are contested** (§12 vs the architecture): §12
  places both in Phase 1; the architecture's genre table places answer drift in
  Phase 0 and gives consequence a Lane 1, zero-cost path. Blocks the Phase 0
  genre set.
- **Per-consumer state's phase** (FR-O6, `[OWNER-8]`): §12 places subagent
  delivery in Phase 1, but keying Tier 3 state per consumer is foundational
  rather than additive. Blocks the Phase 0 architecture's state model.
- **The acceptance criteria do not cover the requirement set** (§13): §13's
  preamble says *"Each criterion names the requirements it verifies"*, and
  checking the reverse direction shows requirements with no criterion at all —
  among them FR-O1, FR-O2, FR-O5, FR-K1, FR-D2, FR-L1, FR-X6, NF-2, NF-3 and
  four of the five constraints. FR-L1 and FR-X6 matter most: both are recorders
  in §12's measurement table, and neither is proven by any criterion. **This is a
  gap in the AC set, not in the requirements** — a requirement is not optional
  because nothing checks it, but Phase 0 exits on criteria, so anything it holds
  that no criterion covers exits on the owner's eye alone, which `CLAUDE.md`
  forbids as a verification strategy.
- **No metric expresses Phase 2's exit** (§9.2, §12): Phase 2 exits on *"a
  demonstrated case of the oracle measurably improving between sessions on the
  same repo."* §9.2's regret rate and ceremony count are also unassigned to any
  recorder. Blocks nothing before Phase 2, recorded so it is not rediscovered.
