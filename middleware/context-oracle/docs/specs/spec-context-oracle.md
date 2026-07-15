# Spec: Context Oracle (`ctxoracle`) — v1

**Status**: draft for owner review. Derived from `../../RETHINK.md` and the six
owner decisions in its §12. Supersedes
`middleware/Gemini-context-compiler/spec-codebase-context-compiler(1).md`;
`middleware/codebase-context-compiler-sandbox/` is archived reference only.

Every external fact this spec relies on — the hooks contract, model access,
protocol status, runtime capabilities, and the published research behind the
guidance thresholds — was verified against the primary source on 2026-07-13.
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

**In scope (v1)**: observation of a single main-agent Claude Code session via
hooks; per-repository and per-user knowledge stores; whisper delivery via hook
context injection; a model-assisted judgment layer with a mandatory
deterministic degraded mode; post-session learning; a companion skill; a CLI
for init/index/status/export/inspection.

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
- **Subagent whispers** — deferred until whisper quality is measured on the
  main agent; the event contract must not preclude them. `[OWNER-5]`
- **Countermeasures to specific remembered incidents** — requirements shaped
  as armor against one past failure are rejected on sight (P9). `[OWNER-3]`

## 3. Standards and evidence base

| Key | Source | What it governs here |
|---|---|---|
| `[HOOKS]` | Claude Code hooks guide & reference, code.claude.com/docs/en/hooks-guide.md and /hooks.md (fetched 2026-07-13) | The observation/injection interface: events, I/O schemas, exit codes, timeouts, parallelism (§6.1) |
| `[CLI]` | Claude Code CLI reference, code.claude.com/docs/en/cli-reference.md | Headless model access: `claude -p`, `--model`, `--output-format json`, `--max-turns`, tool restriction flags (§6.2) |
| `[SDK]` | Claude Agent SDK docs, code.claude.com/docs/en/agent-sdk/ | Secondary model access; credential model (API key / Bedrock / Vertex env; claude.ai OAuth explicitly disallowed for programmatic use) (§6.2) |
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
| `[OWNER-1..6]` | RETHINK §12, resolved 2026-07-13 | Name; model-in-the-loop via host piggyback; no hard blocks anywhere; sandbox compatibility; main agent only; two stores, solo scope |

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
  `.claude/settings.json` during an explicit `ctxoracle init`. `[OWNER-4]`
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
(PostToolUse). `[HOOKS]`

**Output discipline**: shims emit exit code 0 with either no output or a JSON
body containing only `hookSpecificOutput.additionalContext` (and
`suppressOutput`). They never emit `permissionDecision`, `decision`, or exit
code 2 — those are the deny paths, and their absence is structural (FR-O4),
not policy. `[HOOKS]` `[OWNER-3]`

**Contract facts that bound the design** `[HOOKS]`:
- Hooks run in parallel and the turn waits for them: shim latency is
  agent-visible latency, which is why FR-O3's budget exists.
- Harness-side timeouts: 10 min default for command hooks, but **30 s for
  `UserPromptSubmit`** — the orientation whisper must fit well inside that;
  FR-O3's 3 s ceiling already does.
- `additionalContext` from multiple hooks on one event is concatenated in
  non-deterministic order; the oracle therefore registers a single hook per
  event and emits at most one whisper per event (FR-A3).
- Injected text arrives to the model as a system-reminder-style plain-text
  block; the `[oracle]` prefix (FR-D1) is what keeps it attributable.

### 6.2 Model access (judgment layer)

Ladder, tried in order per session `[OWNER-2]` `[D-1]`:

1. **Host-harness piggyback** (primary): invoke the installed Claude Code CLI
   in print mode — `claude -p` with `--model` (Haiku-class, currently
   `claude-haiku-4-5`), `--output-format json`, `--max-turns 1`, and tools
   disallowed — which reuses whatever credentials the host installation
   already has (subscription login or API key/Bedrock/Vertex env). All flags
   verified against `[CLI]`. This is what makes the judgment layer work in
   sandboxes where no separate key exists.
2. **Explicit API credentials**, if configured: direct API or Agent SDK,
   which reads `ANTHROPIC_API_KEY` / Bedrock / Vertex env vars. Note the SDK
   explicitly does **not** ride claude.ai OAuth logins — Anthropic disallows
   third-party products using claude.ai login. `[SDK]`
3. **Deterministic degraded mode** — mandatory, automatic when 1–2 fail
   (FR-J3). `[OWNER-2]`

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
  motivated by hooks being turn-blocking `[HOOKS]`; values are owner-set
  targets `[RETHINK §5]`.
- **FR-O4** — **No deny path exists, structurally.** Shims are incapable of
  returning a blocking decision (§6.1 output discipline); asserted by test
  (AC-3), not policy. `[OWNER-3]`
- **FR-O5** — Whisper opportunities are harness event boundaries only —
  never timers or idle detection. Task-boundary intervention is the measured
  sweet spot for proactive assistance; idle-time triggering interrupts
  thinking, not waiting. `[CHI-25]`

### 7.2 Knowledge

- **FR-K1** — *Tier 2 structural index*: files, symbols, import/reference
  edges, directory topology, generated/vendored/build-output zones, test
  topology, per-region verification commands. Incremental; languages start
  with the owner's stacks (TS/JS/TSX, Python) behind a language-agnostic
  interface. `[RETHINK §4 T2]`
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
- **FR-K8** — Store locations: project store `~/.ctxoracle/projects/<repo-key>/`,
  global store `~/.ctxoracle/global/`. Nothing is written into the repository
  tree (P8). `[OWNER-6]`
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

  `[RETHINK §5]`
- **FR-A3** — Budgets: at most one whisper per event (§6.1); a per-session
  injected-token budget (default 2,000, configurable `[RETHINK §5]`);
  orientation counts against it; warnings get priority within the budget,
  not exemption from it.
- **FR-A4** — Dedup against Tier 3 state: never tell the agent what it has
  already read, been told, or visibly acted on; orientation-genre candidates
  decay out of consideration once the agent is deep in the task.
  `[RETHINK §5]`
- **FR-A5** — Confidence gating: each candidate carries confidence ×
  estimated decision-impact; only the top candidate above the bar is spoken.
  The bar is configurable, ships high, and rises further in degraded mode
  (FR-J3). History-backed genres additionally respect evidence floors:
  warn-grade claims (Warning, Completeness-as-warning) require co-change
  support ≥ 3 and confidence ≥ 0.9 by default — the operating point at which
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
- **FR-J2** — Model access follows the §6.2 ladder; the judgment call uses a
  small fast model (Haiku-class) for intent tracking, ranking, and drafting.
  `[OWNER-2]` `[CLI]`
- **FR-J3** — Degraded mode (no model path available): mechanical-evidence
  genres only (coupling, generated-file warning, verification, completeness),
  raised confidence bar, announced once per session on the human channel and
  never into agent context. `[OWNER-2]` `[RETHINK §11]`
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

## 8. Security

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

Measured from the FR-X6 log by the distiller; inspectable via
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
  Passive auto-bootstrap writing files into a project tree is prohibited.
  `[OWNER-4]` `[CLAUDE.md standing rule]`
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
  Code never supported it. `[MCP-DEP]` The ladder is now piggyback → explicit
  key → degraded.
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

## 12. MVP boundary and build order

- **Phase 0 — deterministic spine.** Shims + session service + Tier 2 index +
  co-change miner (with FR-K2 hygiene). Genres: minimal orientation,
  coupling, generated-file warning, verification. Degraded mode *is* the
  product at this phase. Exit: AC-1..AC-5 pass; the owner runs it on a real
  project without incident.
- **Phase 1 — judgment.** §6.2 model ladder incl. recursion guard; narration
  intent tracking; assumption-check, steering, consequence, reuse, answer
  genres; companion skill. Exit: AC-6..AC-8 and AC-11 pass; measured silence
  and hit rates reviewed against the bar.
- **Phase 2 — learning.** Distiller, false-fire ladder, landmine and
  invariant mining, recipes, global-store tuning, export/import. Exit:
  AC-9..AC-10 pass; a demonstrated case of the oracle measurably improving
  between sessions on the same repo.

## 13. Acceptance criteria

Each criterion names the requirements it verifies.

- **AC-1 (coupling → FR-K2, FR-A5, FR-D1, FR-D5, NF-1)** — In a fixture repo
  with a known co-change pair, an observed edit to one file yields a coupling
  whisper naming the other, stating its evidence ratio, with a git-history
  pointer, within the latency budget.
- **AC-2 (silence → P1, FR-A1)** — Replaying a recorded session of routine
  events produces whispers on only a small fraction of events (threshold set
  with the fixture; the assertion is that most events are silent).
- **AC-3 (no deny → FR-O4, FR-O3)** — No shim code path can return a blocking
  decision (no `permissionDecision`/`decision` fields, no exit 2); induced
  service failure and timeout both yield silence and an unimpeded agent.
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

## 14. Unresolved

- **Export-file format** (FR-K9): single-file archive vs mergeable log —
  decide in Phase 2 when the distiller's record shapes are settled. Blocked
  decision: none until Phase 2.
- **Piggyback credential coverage** (§6.2): verify during Phase 1, per
  environment, that `claude -p` inherits the host session's auth in
  subscription-login sandboxes (documented for API-key/Bedrock/Vertex env;
  subscription-login inheritance is observed behavior, not a documented
  contract). Owner decides fallback posture if an environment fails.
- **Subagent whisper delivery** (deferred, `[OWNER-5]`): when it lands,
  Tier 3 state becomes per-consumer; the event contract already carries
  `session_id` to key on.
- **`additionalContext` merge order** (§6.1): concatenation order across
  multiple hooks on one event is documented as non-deterministic; moot while
  the oracle registers a single hook per event, revisit if that changes.
