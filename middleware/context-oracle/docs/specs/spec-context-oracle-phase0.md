# Spec: Context Oracle Phase 0 — the deterministic oracle

Governs the first buildable phase of the Context Oracle (`ctxoracle`).

**Relationship to `spec-context-oracle.md`.** That document specifies v1 across
three phases; this specifies Phase 0. Where both address the same subject, this
governs Phase 0. Requirement identifiers (`FR-*`, `NF-*`, `C-*`) are the v1
spec's and carry the same meaning in both. **Acceptance-criterion identifiers are
this document's own** — `AC-n` here does not denote the v1 spec's `AC-n`, and
where a v1 criterion is meant it is written `v1 AC-n`.

**Above this document**: `RETHINK.md` §12 and its addenda (lines 303–399) are the
owner's locked decisions.

---

## 1. The problem, and who has it

Coding agents under-read the repository they work in, do not know when their
context is sufficient, and fill the gaps with plausible inventions. The knowledge
that prevents this — which files change together, which files are generated and
will be overwritten, where a symbol's callers are, which paired file an edit left
behind — is invisible from a cold checkout and is not what the agent's own tools
surface at the moment it matters.

Phase 0 supplies those facts without a model. It observes a session through
harness hooks, holds facts mined from the repository and its git history, and
speaks when a lookup keyed by what the agent just did finds something the agent
almost certainly does not already have. Every whisper carries a pointer, arrives
at a decision moment, and blocks nothing.

**Mission**, `RETHINK.md:15–24`: the tool exists because *"agents under-read the
codebase, don't know when their context is sufficient, and fill the gaps with
plausible inventions,"* and it is *"a repository-resident intelligence that hands
a working agent the knowledge it wouldn't find on its own, so the agent never has
to guess."*

**Consumers.** The coding agent receives whispers. The owner must be able to
audit afterwards everything the oracle said and the evidence behind it, and is a
non-programmer by design (`RETHINK.md:355–359`).

**Why this phase first.** It is buildable without a model, and running it is the
only way to obtain evidence about how often the oracle should speak.

## 2. Scope

**In scope**: hook shims; the session service; the structural index; the
co-change miner; the six genres in §6; whisper delivery; the security controls in
§9; the diagnostic core; the CLI.

**Out of scope**, each with the phase that owns it:

| Excluded | Owned by | Reason |
|---|---|---|
| Model access and the recursion guard | Phase 1 | The model client does not exist until Phase 1, and every genre in §6 is reachable without one |
| Degraded mode | Phase 1 | The runtime fallback for an unreachable model path cannot precede that path |
| Narration reading and intent tracking | Phase 1 | Requires the transcript reader |
| Assumption-check, steering, answer genres | Phase 1 | Each requires model judgment over narration |
| Process conformance and answer drift | Phase 1 | Process conformance requires model judgment; answer drift's open questions are written by the narration reader |
| Unknown genre | Held open in the v1 spec §14 | Its phase is undecided upstream; this document neither settles it nor treats it as dropped from v1 |
| Delivery to subagents | Phase 1 | Phase 0 records a per-consumer key where an event carries one (FR-O6) and delivers to the main agent only |
| Companion skill | Phase 1 | Teaches an agent to read whispers the judgment layer produces |
| Distiller, learning loop, false-fire ladder, landmine/invariant/recipe mining, self-report, export/import | Phase 2 | Each consumes measurements Phase 0 produces |

Five genre arms are narrower here than in the v1 definitions because the record
type each reads has no Phase 0 writer (P0-1): orientation's invariant arm and its
token cap; coupling's canonical-helper arm; consequence's historical-breakage and
reuse arms; warning's landmine arm, whose phase the v1 spec §14 holds open;
completeness's invariant arm. Each returns when its writer lands.

## 3. Sources, and how each was confirmed

| Source | Governs | Confirmation |
|---|---|---|
| `RETHINK.md` — §1, §2.3, §4, §5, §6, §12 and its addenda (303–399) | The mission; the relevance metric; the knowledge tiers; the attention and delivery posture; the owner's locked decisions | Read 2026-08-01. Each requirement cites the line range carrying its claim |
| Claude Code hooks documentation (code.claude.com/docs/en/hooks) | The observation and delivery interface | Queried 2026-08-01 via Context7 `/websites/code_claude` and `/llmstxt/code_claude_llms_txt`. Confirmed: the lifecycle — once-per-session (`SessionStart`, `SessionEnd`), once-per-turn (`UserPromptSubmit`, `Stop`, `StopFailure`), per-tool-call (`PreToolUse`, `PostToolUse`); `stop_hook_active` and a continuation cap; `PreToolUse` may return `additionalContext` without a permission decision; `PostToolUse` accepts `additionalContext`, *"a string added to Claude's context alongside the tool result"*, with input carrying `tool_name`, `tool_input`, `tool_response`, `duration_ms`; `UserPromptSubmit` accepts `additionalContext`; default timeout 10 minutes, 30 s for `UserPromptSubmit`; per-hook `timeout` configurable |
| Zimmermann, Weißgerber, Diehl, Zeller, *Mining Version Histories to Guide Software Changes*, IEEE TSE 31(6), 2005 | The co-change evidence floor and the mining hygiene that makes co-change usable | PDF fetched from the author's copy, text extracted, quotations confirmed verbatim 2026-08-01 |

No other external source is cited, because no requirement depends on one.

## 4. Observation

- **FR-O1** — The oracle observes: `SessionStart`; `UserPromptSubmit`; completed
  read and search tool calls; pending edit and write tool calls; completed edit
  and write tool calls; `Stop`; `StopFailure`; and `SessionEnd`. `SessionStart`,
  `StopFailure` and `SessionEnd` are observation-only — recorded, never delivered
  on. `SessionEnd` is the session service's termination signal (C-2).
- **FR-O2** — Shims contain no decision logic. They forward the event and relay
  at most one whisper back.
- **FR-O3** — **Fail open, fast.** Any shim or service error, timeout, or missing
  store yields silence, never an error in the agent's flow. The oracle enforces
  its own budget rather than the harness's: added latency p95 ≤ 1.5 s per event,
  ceiling 3 s, then silence. `RETHINK.md:179–181`: *"A hook that slows the agent
  is a gate by another name. Answer within ~1–2s or stay silent this round."*
- **FR-O4** — **No deny path exists, structurally.** No shim code path can return
  a blocking decision on any event. `RETHINK.md:314–323`, decision 3; the
  corollary at `:393–399` bars gates in every form.
- **FR-O4a** — **Continuation is bounded to one.** The oracle emits on
  `Stop`/`SubagentStop` only when `stop_hook_active` is false, extending a turn at
  most once per stop and never chaining. `RETHINK.md:363–379` and `:393–399`,
  decision 12. Independent of the harness's cap value.
- **FR-O5** — The oracle speaks only in response to an observed harness event. No
  timer, no idle detector, no polling loop. `[P0-D-1]`
- **FR-O6** — Session state is keyed per consumer from the first implementation.
  Where an event carries a consumer identity distinct from the main agent's,
  Phase 0 records it and delivers nothing against it. `RETHINK.md:342–344`,
  decision 8.

## 5. Knowledge

- **FR-K1** — A structural index: files, symbols, import and reference edges,
  directory topology, generated/vendored/build-output zones, test topology, and
  per-region verification commands. Incremental. `RETHINK.md:130–134`.
- **FR-K2** — A co-change graph mined from git history at file and symbol
  granularity. Two mining rules are requirements, both from Zimmermann et al.:
  transactions affecting more than 30 entities are ignored — *"In order to detect
  coupling within transactions, one must avoid the large merge transactions. ROSE
  does so by ignoring all changes that affect more than 30 entities"* — and a
  configurable history horizon caps how old a transaction may be and still teach —
  *"ROSE has much outdated knowledge which suggests that ROSE should not learn
  from too old transactions."* Counts, ratios and recency recorded; recency
  weighting a per-project tunable.
- **FR-K6** — Every record carries provenance — a `file:line` span, a commit hash,
  a dated human statement, or a learned-record reference — and a trust label
  separating repository-derived text from human-stated origin. Records without
  provenance are unrepresentable. `RETHINK.md:77–78`.
- **FR-K7** — Staleness never blocks and never spams: a stale index lowers
  confidence, usually to silence, and triggers background refresh.
- **FR-K8** — Stores are per-repository and per-user, both outside the repository
  tree, and team sharing is out of scope. `RETHINK.md:330–334`, decision 6.
- **FR-L6** — Human statements are recorded as facts with human provenance, with
  no override ritual. Their Phase 0 entry channel is the CLI (§11). `[P0-D-2]`
- **P0-1** — The landmine, invariant, exemplar and recipe schemas exist in Phase 0
  with provenance constraints. Phase 0's only writer for them is FR-L6 promotion;
  literal-match landmine detection is a read over indexed content, not a writer. A
  schema with no Phase 0 writer stays empty rather than becoming a later
  migration. `[P0-D-3]`

## 6. What Phase 0 says

Six of the twelve genres FR-A2 defines.

| Genre | Fires on | Channel | Content | Evidence |
|---|---|---|---|---|
| **Orientation** | prompt submitted | `UserPromptSubmit` | entry points for the task | index entry points |
| **Coupling** | file read / symbol searched | `PostToolUse` | strongest co-change partners with the evidence ratio | co-change graph |
| **Consequence** | edit or write pending | `PreToolUse` | call-site count and spread for the thing being changed | reference edges |
| **Warning ⚠** | edit pending in a generated or vendored zone | `PreToolUse` | that the file is build output, the evidence, what overwrites it, where the editable source is | zone classification and its captured evidence |
| **Completeness** | edit completed, or stop | `PostToolUse` / `Stop` | the co-change partner not yet touched | co-change graph |
| **Verification** | stop | `Stop` | the verification command for the changed region | per-region verification commands |

Consequence and warning fire on a pending edit, which requires injecting context
without issuing a permission decision. The hooks documentation states that a
`PreToolUse` hook exiting 0 *"doesn't approve the tool call: the normal
permission flow still applies"*, and that `additionalContext` may be returned on
that event. FR-O4's property is that no code path *can* issue a permission
decision.

## 7. When Phase 0 speaks

- **FR-A1** — Per event the oracle answers internally: given what the agent is
  doing now, do I know something it almost certainly does not that would change
  what it does next? Default answer no → silence. `RETHINK.md:170`.
- **FR-A3** — At most one whisper per event, within a per-session injected-token
  budget of 2,000 tokens by default, configurable. `RETHINK.md:175–176`.
  `[P0-D-4]`
- **FR-A4** — Never tell the agent what it has already seen (`RETHINK.md:138`),
  been told, or visibly incorporated (`:177–178`).
- **FR-A5** — Each candidate carries **confidence × decision-impact × marginal
  value**; only the top candidate above the bar is spoken, and the bar ships high.
  All three terms are computable without a model: marginal value derives from the
  fact's provenance class and from what this consumer has already read or searched
  this session. `RETHINK.md:59–61`: *"Marginal value over the agent's own
  abilities is the only relevance metric that matters."* `:198–199`: *"Ship with
  the bar set high and lower it against measured hit rate."*
- **FR-A5a** — **Warn-grade evidence floor.** A ⚠ whisper on history-derived
  evidence requires co-change support ≥ 3 and confidence ≥ 0.9. Zimmermann et al.
  set that operating point: *"ROSE is set up to issue warnings only if the high
  confidence threshold of 0.9 is exceeded. Still, we wanted to get as many missing
  items as possible, resulting in a support count threshold of 3."* Its benefit
  there is precision — *"The average precision is above 66 percent"* — and *"Only
  2 percent of all transactions cause a false alarm."* **Its cost is recall**: the
  same evaluation reports feedback of 3 percent, and *"the percentage of missed
  alarms is on average 97 percent."* A warn-grade channel at this floor speaks
  rarely by design, which is accepted and is the same posture as silence-by-
  default — but it bounds how much warn-grade evidence Phase 0 can produce.
  Suggestion-grade coupling may run looser, never below support ≥ 2; the same
  study measured precision 0.30 at support 1 and confidence 0.1.
- **FR-A5b** — The generated-file warning is not subject to FR-A5a's floors. Its
  evidence is a zone marker, not history. `[P0-D-5]`
- **FR-A6** — **Corpus floor.** Below a configured minimum of mined history for a
  region, history-backed genres stay silent regardless of any pair's support and
  confidence, because FR-A5a is computed per pair and cannot express corpus
  thinness. `[P0-D-6]`
- **FR-A7** — **First impressions.** In a project's first configured number of
  sessions, only coupling and the generated-file warning speak. `[P0-D-4]`
- **P0-2** — Phase 0 ships the bar with no degraded-mode delta and issues no
  degraded-mode notice: that delta compensates for a lost intent signal, and
  Phase 0 has not lost one.
- **P0-3** — A stop-grade whisper clears a raised bar — the ordinary bar plus a
  configured delta, defaulting to its top decile — being the only whisper that
  spends a turn rather than riding a boundary. Each delivery is recorded as a
  continuation event, and each candidate the raised bar suppresses is recorded, so
  the owner sees both what the capability cost and what it withheld.
  `RETHINK.md:363–379`. `[P0-D-7]`

## 8. Delivery

- **FR-D1** — Whisper format: `[oracle]` prefix (`RETHINK.md:195`), a claim of one
  to five sentences with at least one verifiable pointer (`:187–188`), a
  confidence tag when confidence is not high (`:196–197`), a genre tag, and
  optionally a one-line "so what".
- **FR-D2** — Informative, never imperative: facts and consequences, never
  commands. `RETHINK.md:190`.
- **FR-D3** — Warning subtype: ⚠ marker, the mechanical evidence, the concrete
  consequence, and an explicit false-fire clause inviting correction. Never a
  block. `RETHINK.md:314–323`.
- **FR-D4** — The only agent-facing channel is hook context injection. Human
  notices use the human-visible channel and never consume agent context.
- **FR-D5** — Co-change claims always state their evidence ratio, never as
  certainty.

## 9. Threat model and security

Phase 0 reads repository text and git history, persists them, and injects derived
text into an autonomous agent's context. That is its entire attack surface. It
makes no model call, so threats concerning model-call prompts and credential
handling do not arise here; they return with Phase 1.

**T1 — Indirect prompt injection through repository text.** *Attacker*: anyone who
can land text in the repository or its history. *Target*: the agent's behaviour.
*Path*: imperative text in a comment, commit message, filename or generated-file
header is mined and injected, where it reads as instruction. *Cost*: the agent
acts on an instruction the owner never gave, with the oracle's credibility behind
it.

**T2 — Store poisoning.** *Attacker*: the T1 population, plus anything able to
write the store path. *Target*: the persisted knowledge. *Path*:
repository-derived text is stored without a trust label and later treated as
though a human asserted it. *Cost*: a poisoned fact outlives its session and is
delivered with unearned authority.

**T3 — Secret capture.** No attacker required. *Target*: credentials in tracked
files or git history. *Path*: the indexer or miner ingests a key, which lands in a
store, a log, or a whisper. *Cost*: a secret is copied into a store the owner does
not think of as sensitive.

**T4 — Overreach by the oracle's own process.** No attacker required. *Target*:
the repository and the network. *Path*: a component writes inside the repository
tree or opens a connection. *Cost*: the tool that promised it never mutates the
repository does so — the failure that ends trust outright. `RETHINK.md:321–323`.

- **FR-X1** (T3) — Secret detection runs on all text before it enters a store, a
  log, or a whisper; matches are redacted or masked, never stored or emitted in
  plaintext.
- **FR-X2** (T1) — Repository-derived text is data, never instruction: whispers
  are produced from a fixed schema validated by deterministic code, and repository
  strings appear only as clearly delimited quotations or pointers.
- **FR-X3** (T1) — Content flagged injection-suspect at index time is referenced
  by pointer only, never quoted.
- **FR-X4** (T2) — Records preserve trust origin through every pipeline stage.
- **FR-X5** (T4) — Least privilege: read-only repository access, no
  tool-invocation authority in the agent's session, and — Phase 0 having no model
  call — no network access at all. `RETHINK.md:321–323`.
- **FR-X6** (T1, T2, oversight) — Every whisper is logged with the evidence it
  used, giving the owner a reviewable audit trail.
- **FR-X7** (T3) — Both stores live outside the repository tree and the oracle
  emits no outbound traffic. `RETHINK.md:330–334` establishes the location and
  the solo scope; the no-traffic property is this document's, derived from FR-X5.
  `[P0-D-8]`
- **FR-X8** (T1, T2) — The test suite includes adversarial fixtures: injection
  payloads in code comments, commit messages and file content, asserting no
  whisper relays or obeys them.

## 10. Self-observability, qualities, constraints

The owner cannot be the failure detector. `RETHINK.md:350–354`, decision 10: *"it
could fail a hundred ways in front of me and I wouldn't know."*

- **FR-M1** — Every component emits structured diagnostic events to a local
  diagnostic log, separate from the whisper audit log: hook invocations with
  latency and outcome, store read/write failures, index refresh runs, delivery
  results.
- **FR-M2** — The oracle detects its own failure classes from that log without
  human observation: hooks not firing, latency breaches, store corruption, index
  staleness, and whispers produced but not delivered. `ctxoracle status` surfaces
  health and recent anomalies in language a non-programmer can read.
- **FR-M4** — Diagnostics never touch agent context and never leave the machine.
- **FR-L1** — The session service logs, per event, the candidates considered, the
  whisper sent if any, and subsequent evidence that the agent acted on it.
- **P0-4** — `ctxoracle status` computes and reports, from those logs: the silence
  rate; the added-latency distribution against FR-O3; the continuation count; and
  the count of candidates the raised stop bar suppressed. `[P0-D-9]`

- **NF-1** — Hook-added latency per FR-O3: p95 ≤ 1.5 s, ceiling 3 s, then silence.
- **NF-2** — Session token overhead stays within FR-A3's budget and is reported by
  `ctxoracle status`.
- **NF-3** — Indexing is incremental after first build.
- **NF-4** — Ceremony count is zero. `RETHINK.md:227–229`.

- **C-1** — Cold-container ready: installs and indexes with no native toolchain,
  no prebuilt-binary download, and no network beyond the harness's.
  `RETHINK.md:324–327`, decision 4. Any satisfying runtime and storage engine are
  acceptable, and the capabilities relied on are confirmed against that stack's
  current documentation before they are relied on.
- **C-2** — Session state persists warm across hook invocations with sub-second
  access, and is torn down on `SessionEnd`; cold-starting per event cannot meet
  NF-1.
- **C-3** — Harness-specific knowledge lives in the shims. `RETHINK.md:291`.
- **C-4** — `ctxoracle init` is explicit and minimal; `deinit` removes the wiring
  cleanly. Passive auto-bootstrap into a project tree is prohibited.
- **C-5** — The hooks contract is version-bound. Implementation re-verifies it,
  and shims degrade to silence on any drift they detect. No requirement here
  depends on a harness timeout value or on the numeric continuation cap.

## 11. External interfaces

**Consumed**: the Claude Code hooks interface — the events in FR-O1, the inputs
identifying the session and the tool call, and the output discipline in FR-O4.

**Provided**: `ctxoracle init`, `index`, `status`, `deinit`, and the command by
which a human statement becomes a fact (FR-L6). `status` is the owner's only view
of the oracle's health and measurements.

**Nothing else.** Phase 0 opens no network connection (FR-X5).

## 12. Decisions made in this spec

- **P0-D-1 — FR-O5 is stated rather than inferred from FR-O1's list.** Three of
  FR-O1's events are observation-only, so the list does not by itself forbid a
  timer, and Phase 0 is the first phase with a warm background service. The
  grounding is a judgment: an unbidden whisper on a timer is an interaction
  channel the owner has never approved, and every approved channel in
  `RETHINK.md` §6 is a response to something the agent did.
- **P0-D-2 — Human facts enter Phase 0 through the CLI.** FR-L6 is in force
  because the landmine and invariant records exist here, but its v1 input is a
  statement made in the session, and the session reader is Phase 1.
- **P0-D-3 — Schemas Phase 0 cannot populate are created in Phase 0**, so
  Phase 0's store is not a throwaway and mining lands without a migration.
- **P0-D-4 — FR-A3's budget and FR-A7's restriction carry stated values**, without
  which NF-2 is unfalsifiable and FR-A7 untestable. Both are judgments of the same
  class as AC-2's rate and are expected to move once Phase 0 has run.
- **P0-D-5 — The generated-file warning is exempt from the co-change floors**,
  which are the operating point of a study of history-derived rules; a zone
  classification is evidenced by a marker.
- **P0-D-6 — The corpus floor is separate from the evidence floors.** FR-A5a is
  evaluated per pair, and a thin corpus produces pairs with high support and
  perfect confidence.
- **P0-D-7 — The stop-bar delta has a stated default and its effect is reported,
  not only its cost.** Reporting turns spent without the suppression count would
  show what decision 12 cost and never what it bought.
- **P0-D-8 — FR-X7's no-outbound-traffic property is this document's, not
  `RETHINK.md`'s.** Decision 6 fixes where the stores live and that sharing is out
  of scope; it does not address telemetry. The property is derived from FR-X5's
  least-privilege posture and is stated here so the reader is not told a source
  says more than it does.
- **P0-D-9 — Phase 0's measurement obligation is the four quantities it can
  compute from its own logs.** A hit rate additionally requires resolving uptake
  evidence into an uptake judgment; FR-L1 fixes only that the evidence is
  recorded.
- **P0-D-10 — AC-2's 10% ceiling is a judgment.** No published figure maps to
  per-event whisper rates for an agent consumer.

## 13. Acceptance criteria

Phase 0 is complete when every criterion below passes, and when a run on a real
project produces a clean `ctxoracle status` — no unresolved failure class, no
latency breach, no undelivered whisper. The owner runs it; the diagnostics, not
the owner, are what report whether it behaved.

- **AC-1 (coupling → FR-K2, FR-A5a, FR-D1, FR-D5, NF-1)** — In a fixture with a
  known co-change pair, a completed read of one file yields a coupling whisper
  naming the other, with its evidence ratio and a git-history pointer, inside the
  latency budget.
- **AC-2 (silence → FR-A1, FR-A3)** — Replaying a recorded session of routine
  events produces whispers on at most 10% of events. `[P0-D-10]`
- **AC-3 (marginal value → FR-A5, FR-A4)** — Two replays of the same event over
  the same store: where the fact is already in the consumer's read set the oracle
  stays silent; where it is not, it speaks. This tests the mission's own clause
  rather than that a genre fires.
- **AC-4 (evidence and corpus floors → FR-A5a, FR-A6)** — A pair below support 3
  produces no ⚠ whisper; a pair at support 3 and confidence ≥ 0.9 does; and in a
  fixture whose total mined history is below the corpus floor, neither fires.
- **AC-5 (no deny → FR-O4, FR-O4a, FR-O3)** — No shim path can return a blocking
  decision; induced failure and induced timeout each yield silence and an
  unimpeded agent; `stop_hook_active: true` produces silence; and no output
  extends the loop by more than one continuation per stop.
- **AC-6 (pristine tree → C-4, FR-K8)** — After `init`, index, a full session and
  `deinit`, the only ever-touched file in the tree is the harness settings file.
- **AC-7 (warning, not block → FR-D3, FR-A5b)** — An edit to a detected generated
  file proceeds unimpeded and receives the FR-D3 warning with its mechanical
  evidence and false-fire clause, with no co-change support present.
- **AC-8 (consequence → §6, FR-D1)** — A pending edit to a symbol with known
  callers yields a consequence whisper stating call-site count and spread.
- **AC-9 (orientation → §6, FR-K1, NF-1)** — A submitted prompt whose entry points
  are in the index yields an orientation whisper naming them, within NF-1's
  budget, not the harness's larger allowance.
- **AC-10 (stop-class genres → §6, FR-O4a, P0-3)** — At stop, an untouched
  co-change partner draws a completeness whisper and a changed region with a
  verification command draws a verification whisper; each is recorded as a
  continuation event; and a candidate below the raised bar is recorded as
  suppressed.
- **AC-11 (first sessions → FR-A7)** — In a project's first configured sessions,
  an event that would otherwise draw orientation, consequence, completeness or
  verification draws none, while coupling and the generated-file warning fire.
- **AC-12 (secrets → FR-X1)** — Fixture secrets in tracked files and git history
  never appear in plaintext in any store file, whisper, or log.
- **AC-13 (least privilege → FR-X5, FR-X7)** — An instrumented run shows no writes
  inside the repository tree and no outbound traffic at all.
- **AC-14 (injection → FR-X2, FR-X3, FR-X8)** — With hostile imperative text in
  file content, comments and commit messages, no whisper relays or obeys it;
  suspect content appears only as a pointer.
- **AC-15 (provenance and trust origin → FR-K6, FR-X4, FR-X6)** — Every record
  written carries provenance and a trust label; no repository-derived record
  acquires human provenance; every whisper is in the audit log with its evidence.
- **AC-16 (staleness → FR-K7)** — With a stale index, events yield silence or
  reduced-confidence whispers, never errors or spam, and a refresh is triggered.
- **AC-17 (self-detection → FR-M1, FR-M2, FR-M4)** — Induced failures — broken
  hook wiring, corrupted store, service killed mid-session — are each recorded and
  surfaced by `ctxoracle status` in plain language, with zero added output in the
  agent's session.
- **AC-18 (measurements → P0-4, NF-2)** — After a fixture session, `ctxoracle
  status` reports the silence rate, the latency distribution against NF-1, the
  continuation count, the suppressed-at-stop-bar count, and session token overhead
  against FR-A3's budget.
- **AC-19 (zero ceremony → NF-4)** — An oracle-unaware agent completes a task with
  it active, produces no oracle-specific output, and receives whispers throughout.
- **AC-20 (human facts → FR-L6, FR-K6)** — A statement entered through the CLI
  becomes a retrievable record carrying human provenance.
- **AC-21 (per-consumer state → FR-O6)** — Where an event carries a consumer
  identity distinct from the main agent's, the oracle records the key and delivers
  nothing against it.
- **AC-22 (shim discipline → FR-O2, FR-O5)** — Static inspection shows no decision
  logic in any shim and no timer, idle detector or polling loop anywhere in the
  service; an idle session produces no whisper.
- **AC-23 (lifecycle → FR-O1, C-2)** — `SessionEnd` tears the service down; a
  subsequent event cold-starts cleanly; `StopFailure` and `SessionStart` are
  recorded with no delivery attempted.
- **AC-24 (mining hygiene → FR-K2)** — A fixture history containing a merge
  commit, a transaction touching more than 30 entities, and a transaction older
  than the horizon yields a graph in which none of the three contributed an edge.
- **AC-25 (informative, never imperative → FR-D2)** — No emitted whisper in any
  fixture run contains an imperative construction; each states a fact or a
  consequence.
