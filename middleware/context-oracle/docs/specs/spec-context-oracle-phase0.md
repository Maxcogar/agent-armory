# Spec: Context Oracle Phase 0 — the deterministic oracle

Governs the first buildable phase of the Context Oracle (`ctxoracle`).

**Relationship to `spec-context-oracle.md`.** That document specifies v1 across
three phases. This specifies Phase 0. Where both address the same subject, this
governs Phase 0. Requirement identifiers are shared so downstream artifacts need
no translation; `P0-` identifiers originate here.

**Above this document**: `RETHINK.md` §12 and its addenda are the owner's locked
decisions, cited by line and not re-derived.

**Grounding rule used throughout.** Every requirement below is grounded in one
of three things, and nothing else: an owner decision read from `RETHINK.md` at
the cited lines; the Claude Code hooks contract as queried on 2026-08-01; or
Zimmermann et al. 2005, read from the primary PDF on 2026-08-01. Where the v1
spec cites a paper for rationale but no requirement value depends on it, the
requirement is grounded in the decision that actually determines it and the
paper is not cited. Where the v1 spec states a number this session could not
confirm against source, the number does not appear here.

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
almost certainly does not know. Every whisper carries a pointer, arrives at a
decision moment, and blocks nothing.

**Mission**, from `RETHINK.md:15–24`: the tool exists because *"agents under-read
the codebase, don't know when their context is sufficient, and fill the gaps with
plausible inventions,"* and its job is *"a repository-resident intelligence that
hands a working agent the knowledge it wouldn't find on its own, so the agent
never has to guess."*

**Consumers.** The coding agent receives whispers. The owner must be able to
audit afterwards everything the oracle said and the evidence behind it, and is a
non-programmer by design (`RETHINK.md:355–359`).

**Why this phase first.** It is buildable without a model, and running it is the
only way to obtain evidence about how often the oracle should speak — evidence
the judgment layer's design depends on.

## 2. Scope

**In scope**: hook shims; the session service; the structural index; the
co-change miner; the six genres in §5; whisper delivery; the security controls in
§8; the diagnostic core; the CLI.

**Out of scope.** Every exclusion names the phase that owns it. Nothing is
dropped from v1.

| Excluded | Owned by | Reason |
|---|---|---|
| Model access and the recursion guard | Phase 1 | The model client does not exist until Phase 1, and every genre in §5 is reachable without one |
| Degraded mode | Phase 1 | It is the runtime fallback for an unreachable model path and cannot precede that path |
| Narration reading and intent tracking | Phase 1 | Requires the transcript reader |
| Assumption-check, steering, answer genres | Phase 1 | Each requires model judgment over narration |
| Process conformance and answer drift | Phase 1 | Process conformance requires model judgment; answer drift's open questions are written by the narration reader |
| Unknown genre | Unassigned in v1 | Its trigger is a determining query returning empty — neither a store lookup nor a model call |
| Subagent delivery | Phase 1 | P0-3 fixes the Phase 0 obligation this creates |
| Companion skill | Phase 1 | Teaches an agent to read whispers the judgment layer produces |
| Distiller, learning loop, false-fire ladder, landmine/invariant/recipe mining, self-report, export/import | Phase 2 | Each consumes measurements Phase 0 produces |

## 3. Sources, and how each was confirmed

| Source | Governs | Confirmation |
|---|---|---|
| `RETHINK.md` §12 + addenda, the owner's locked decisions | The tool's posture: no blocks, two stores outside the tree, no credentials of its own, subagent delivery in v1, self-observability, agent-led governance, speaking at a completion claim | Read 2026-08-01 at `RETHINK.md:303–392`; each requirement below cites the decision number and line range |
| `RETHINK.md` §1, §4, §5, §6 | Mission; the knowledge tiers; the attention and delivery posture | Read 2026-08-01; cited by line at point of use |
| Claude Code hooks documentation (code.claude.com/docs/en/hooks, /hooks-guide) | The observation and delivery interface | Queried 2026-08-01 via Context7 `/websites/code_claude` and `/llmstxt/code_claude_llms_txt`. Confirmed: the event lifecycle including `StopFailure`; `stop_hook_active` and the existence of a continuation cap; `UserPromptSubmit` supports `hookSpecificOutput.additionalContext`; `PreToolUseHookSpecificOutput` declares `permissionDecision` and `additionalContext` both not-required; default hook timeout 10 minutes, reduced to 30 s for `UserPromptSubmit`; per-hook `timeout` configurable in seconds; command hooks support `"async": true` |
| Zimmermann, Weißgerber, Diehl, Zeller, *Mining Version Histories to Guide Software Changes*, IEEE TSE 31(6), 2005 | The co-change evidence floor and the mining hygiene that makes co-change usable | PDF fetched from the author's copy at thomas-zimmermann.com and text extracted 2026-08-01. Quotations at point of use in FR-K2 and FR-A5 |

No other external source is cited, because no requirement below depends on one.

## 4. Observation and knowledge

- **FR-O1** — The oracle observes session start, user prompt submission,
  completed read and search tool calls, pending edit and write tool calls,
  completed edit and write tool calls, and session stop. Hooks contract: these
  events are documented, and the lifecycle groups them as once-per-session,
  once-per-turn, and per-tool-call.
- **FR-O2** — Shims contain no decision logic. They forward the event and relay
  at most one whisper back.
- **FR-O3** — **Fail open, fast.** Any shim or service error, timeout, or missing
  store yields silence, never an error in the agent's flow. The oracle enforces
  its own budget rather than inheriting the harness's: added latency p95 ≤ 1.5 s
  per event, hard ceiling 3 s, then silence. Grounded in `RETHINK.md:179–181`:
  *"A hook that slows the agent is a gate by another name. Answer within ~1–2s or
  stay silent this round."* The harness default is 10 minutes, reduced to 30 s
  for `UserPromptSubmit`, so the oracle's budget is tighter on every event.
- **FR-O4** — **No deny path exists, structurally.** No shim code path can return
  a blocking decision. `RETHINK.md:314–323`, decision 3: *"No hard blocks. None,
  anywhere… its worst case is a wasted sentence."*
- **FR-O4a** — **Continuation is bounded to one.** The oracle emits on
  `Stop`/`SubagentStop` only when `stop_hook_active` is false, extending a turn at
  most once per stop and never chaining. `RETHINK.md:363–379`, decision 12, keeps
  the capability and accepts its turn cost. The hooks contract confirms
  `stop_hook_active` exists and that a continuation cap exists; this requirement
  bounds the oracle to one and does not depend on the cap's value.
- **FR-O5** — Whisper opportunities are harness event boundaries only, never
  timers or idle detection. `RETHINK.md:183–186`.
- **P0-1** — `StopFailure` is observation-only: recorded, never delivered on. The
  hooks lifecycle lists it as a once-per-turn event alongside `Stop`.
- **P0-2** — Session state is keyed per consumer from the first implementation,
  though Phase 0 delivers only to the consumer whose event fired.
  `RETHINK.md:342–344`, decision 8, moves subagent delivery into v1; a state
  model built for one consumer cannot acquire a second without being rebuilt.
- **FR-K1** — A structural index: files, symbols, import and reference edges,
  directory topology, generated/vendored/build-output zones, test topology, and
  per-region verification commands. Incremental. `RETHINK.md` §4 Tier 2.
- **FR-K2** — A co-change graph mined from git history at file and symbol
  granularity. Two mining rules are requirements, not options, both from
  Zimmermann et al. 2005: transactions affecting more than 30 entities are
  ignored — *"In order to detect coupling within transactions, one must avoid the
  large merge transactions. ROSE does so by ignoring all changes that affect more
  than 30 entities"* — and a configurable history horizon caps how old a
  transaction may be and still teach — *"ROSE has much outdated knowledge which
  suggests that ROSE should not learn from too old transactions."* Counts, ratios
  and recency are recorded; recency weighting is a per-project tunable.
- **FR-K6** — Every record carries provenance — a `file:line` span, a commit
  hash, a dated human statement, or a learned-record reference — and a trust
  label separating repository-derived text from human-stated origin. Records
  without provenance are unrepresentable. `RETHINK.md` §4.
- **FR-K7** — Staleness never blocks and never spams: a stale index lowers
  confidence, usually to silence, and triggers background refresh.
- **FR-K8** — Stores are per-repository and per-user, both outside the repository
  tree. `RETHINK.md:330–334`, decision 6.
- **FR-L6** — Human statements are recorded as facts with human provenance, no
  override ritual. In force in Phase 0 because it is one of the two writers for
  the records orientation reads.
- **P0-3** — The landmine, invariant, exemplar and recipe schemas exist in
  Phase 0 with provenance constraints, with exactly two Phase 0 writers: FR-L6
  promotion, and literal-match landmine detection for orientation. A schema with
  no Phase 0 writer stays empty rather than becoming a later migration. `[P0-D-2]`

## 5. What Phase 0 says

Six genres.

| Genre | Fires on | Content | Evidence |
|---|---|---|---|
| **Orientation** | prompt submitted | entry points for the task; landmines whose literal terms match it | index entry points; landmine records |
| **Coupling** | file read / symbol searched | strongest co-change partners with the evidence ratio | co-change graph |
| **Consequence** | edit or write pending | call-site count and spread for the thing being changed | reference edges |
| **Warning ⚠** | edit pending in a generated or vendored zone | that the file is build output, the evidence, what overwrites it, where the editable source is | zone classification and its captured evidence |
| **Completeness** | edit completed, or stop | the co-change partner not yet touched | co-change graph |
| **Verification** | stop | the verification command for the changed region | per-region verification commands |

Consequence and warning fire on a pending edit, which requires injecting context
without issuing a permission decision. The hooks contract makes this structurally
available: `PreToolUseHookSpecificOutput` declares `permissionDecision` and
`additionalContext` as independently optional. FR-O4's property is that no code
path *can* issue a permission decision.

- **FR-A1** — Per event the oracle answers internally: given what the agent is
  doing now, do I know something it almost certainly does not that would change
  what it does next? Default answer no → silence. Answered deterministically in
  Phase 0. `RETHINK.md` §5.
- **FR-A2** — At most one whisper per event, within a per-session injected-token
  budget. Warnings get priority within the budget, never exemption from it.
  `RETHINK.md:175–176`.
- **FR-A3** — Never tell the agent what it has already read, been told, or
  visibly acted on. `RETHINK.md:177–178`.
- **FR-A4** — Each candidate carries confidence × decision-impact; only the top
  candidate above the bar is spoken, and the bar ships high.
  `RETHINK.md:198–199`: *"Ship with the bar set high and lower it against
  measured hit rate."*
- **FR-A5** — **Warn-grade evidence floor.** A whisper delivered in the ⚠ warning
  format on history-derived evidence requires co-change support ≥ 3 and
  confidence ≥ 0.9. Zimmermann et al. 2005 set exactly this operating point and
  report its cost and benefit: *"As too many false warnings might undermine
  ROSE's credibility, ROSE is set up to issue warnings only if the high
  confidence threshold of 0.9 is exceeded. Still, we wanted to get as many
  missing items as possible, resulting in a support count threshold of 3."* At
  that point, *"The average precision is above 66 percent"* and *"Only 2 percent
  of all transactions cause a false alarm."* Suggestion-grade coupling may run
  looser but never below support ≥ 2: at support 1 and confidence 0.1 the same
  study measured precision of 0.30.
- **P0-4** — The generated-file warning is **not** subject to FR-A5's floors. Its
  evidence is a zone marker, not history, and a co-change floor applied to it
  would make the genre unable to fire while AC-5 requires that it does. `[P0-D-3]`
- **FR-A6** — Below a configurable minimum of mined history per region,
  history-backed genres stay silent rather than guess.
- **FR-D1** — Whisper format: `[oracle]` prefix, genre tag, confidence tag when
  below high, a claim of one to five sentences, at least one verifiable pointer,
  optionally a one-line "so what". `RETHINK.md` §6.
- **FR-D2** — Informative, never imperative: facts and consequences, never
  commands. `RETHINK.md` §6.
- **FR-D3** — Warning subtype: ⚠ marker, the mechanical evidence, the concrete
  consequence, and an explicit false-fire clause inviting correction. Never a
  block. `RETHINK.md:314–323`, decision 3: *"Every intervention, including
  generated-file protection, is a loud warning whisper. False fires are tracked."*
- **FR-D4** — The only agent-facing channel is hook context injection. Human
  notices use the human-visible channel and never consume agent context.
- **FR-D5** — Co-change claims always state their evidence ratio, never as
  certainty. Grounded in the same study's own framing of confidence as a
  likelihood, not a guarantee.
- **P0-5** — A stop-grade whisper clears a raised bar, because it is the only
  whisper that spends a turn rather than riding an existing boundary, and each
  such delivery is recorded as a continuation event so the owner can see how
  often a turn was extended. `RETHINK.md:363–379`, decision 12.

## 6. Self-observability

The owner cannot be the failure detector. `RETHINK.md:350–354`, decision 10:
*"it could fail a hundred ways in front of me and I wouldn't know."*

- **FR-M1** — Every component emits structured diagnostic events to a local
  diagnostic log, separate from the whisper audit log: hook invocations with
  latency and outcome, store read/write failures, index refresh runs, delivery
  results.
- **FR-M2** — The oracle detects its own failure classes from that log without
  human observation: hooks not firing, latency breaches, store corruption, index
  staleness, and whispers produced but not delivered. `ctxoracle status` surfaces
  health and recent anomalies in language a non-programmer can read.
- **FR-M3** — Diagnostics never touch agent context and never leave the machine.
- **FR-L1** — The session service logs, per event, the candidates considered, the
  whisper sent if any, and subsequent evidence that the agent acted on it.
- **P0-6** — `ctxoracle status` computes and reports, from those logs: the silence
  rate (events with no whisper ÷ events observed), the added-latency distribution
  against FR-O3, and the continuation count. `[P0-D-1]`

## 7. Threat model

Phase 0 reads repository text and git history, persists them, and injects derived
text into an autonomous agent's context. That is its entire attack surface.

**T1 — Indirect prompt injection through repository text.** *Attacker*: anyone
who can land text in the repository or its history. *Target*: the agent's
behaviour. *Path*: imperative text in a comment, commit message, filename or
generated-file header is mined and injected, where it reads as instruction.
*Cost*: the agent acts on an instruction the owner never gave, with the oracle's
credibility behind it.

**T2 — Store poisoning.** *Attacker*: the T1 population, plus anything able to
write the store path. *Target*: the persisted knowledge. *Path*:
repository-derived text is stored without a trust label and later treated as
though a human asserted it. *Cost*: a poisoned fact outlives its session and is
delivered with unearned authority.

**T3 — Secret capture.** No attacker required. *Target*: credentials in tracked
files or git history. *Path*: the indexer or miner ingests a key, which lands in
a store, a log, or a whisper. *Cost*: a secret is copied into a store the owner
does not think of as sensitive.

**T4 — Overreach by the oracle's own process.** No attacker required. *Target*:
the repository and the network. *Path*: a component writes inside the repository
tree or opens a connection. *Cost*: the tool that promised it never mutates the
repository does so — the failure that ends trust outright. `RETHINK.md:321–323`.

Phase 0 makes no model call, so threats concerning model-call prompts and
credential handling do not arise here. They return with Phase 1.

## 8. Security requirements

- **FR-X1** (T3) — Secret detection runs on all text before it enters a store, a
  log, or a whisper; matches are redacted or masked, never stored or emitted in
  plaintext.
- **FR-X2** (T1) — Repository-derived text is data, never instruction: whispers
  are produced from a fixed schema validated by deterministic code, and
  repository strings appear only as clearly delimited quotations or pointers.
- **FR-X3** (T1) — Content flagged injection-suspect at index time is referenced
  by pointer only, never quoted.
- **FR-X4** (T2) — Records preserve trust origin through every pipeline stage; a
  repository-derived record cannot acquire human or mechanical provenance.
- **FR-X5** (T4) — Least privilege: read-only repository access, no
  tool-invocation authority in the agent's session, and — Phase 0 having no model
  call — no network access at all. `RETHINK.md:321–323`, decision 3; `:330–334`,
  decision 6.
- **FR-X6** (T1, T2, oversight) — Every whisper is logged with the evidence it
  used, giving the owner a reviewable audit trail.
- **FR-X7** (T3) — Both stores are local; no telemetry leaves the machine.
  `RETHINK.md:330–334`, decision 6.
- **FR-X8** (T1, T2) — The test suite includes adversarial fixtures: injection
  payloads in code comments, commit messages and file content, asserting no
  whisper relays or obeys them.

## 9. Qualities and constraints

- **NF-1** — Hook-added latency per FR-O3: p95 ≤ 1.5 s, ceiling 3 s, then silence.
- **NF-2** — Session token overhead stays within the FR-A2 budget and is reported
  by `ctxoracle status`.
- **NF-3** — Indexing is incremental after first build.
- **P0-7** — Ceremony count is zero: the agent is never required to produce any
  oracle-specific format, tag, file or request, and an oracle-unaware agent gets
  full value. `RETHINK.md` §2.5, §7.
- **C-1** — Cold-container ready: installs and indexes with no native toolchain
  and no prebuilt-binary download. `RETHINK.md:324–327`, decision 4, requires
  sandbox compatibility. The runtime and storage engine that satisfy this are the
  architect's choice; the requirement is the property, and the architect verifies
  the chosen stack's capabilities against its own current documentation.
- **C-2** — Session state persists warm across hook invocations with sub-second
  access; cold-starting per event cannot meet NF-1.
- **C-3** — Harness-specific knowledge lives in the shims; the service speaks a
  harness-neutral event contract. `RETHINK.md` §11.
- **C-4** — `ctxoracle init` is explicit and minimal — wire hooks, create the
  out-of-tree store, nothing else — and `deinit` removes the wiring cleanly.
  Passive auto-bootstrap into a project tree is prohibited.
- **C-5** — The hooks contract is version-bound. Implementation re-verifies it
  against current documentation, and shims degrade to silence on any drift they
  detect. This is why no requirement above depends on a specific harness timeout
  value or on the numeric continuation cap.

## 10. External interfaces

**Consumed** — the Claude Code hooks interface: the events in FR-O1, the inputs
identifying the session and the tool call, and the output discipline in FR-O4.

**Provided** — `ctxoracle init`, `index`, `status`, `deinit`. `status` is the
owner's only view of the oracle's health and measurements; FR-M2 fixes its
register as plain language readable by a non-programmer.

**Nothing else.** Phase 0 opens no network connection (FR-X5) and has no model
path.

## 11. Decisions made in this spec

- **P0-D-1 — Phase 0's measurement obligation is the three metrics it can compute
  from its own logs.** A hit rate additionally requires deciding which component
  turns uptake evidence into an uptake judgment — a component boundary, which
  §12 leaves to the architect. Obliging a metric Phase 0 may be unable to produce
  would put a false claim in a contract.
- **P0-D-2 — Schemas Phase 0 cannot populate are created in Phase 0.** Deferring
  the schemas as well as the mining would make Phase 0's store a throwaway and
  force a migration when mining lands. The cost is empty tables, which is visible
  and harmless.
- **P0-D-3 — The generated-file warning is exempt from FR-A5's floors.** Those
  floors are the operating point of a study of *history-derived* rules. A zone
  classification is evidenced by a marker; applying a co-change floor to it would
  make the genre unable to fire while AC-5 requires that it does.
- **P0-D-4 — No requirement depends on a harness timeout value or on the numeric
  continuation cap.** Both are version-bound facts about someone else's product,
  and C-5 already requires re-verification at implementation. FR-O3 states the
  oracle's own budget; FR-O4a bounds the oracle to one continuation regardless of
  what the cap permits.

## 12. Left to the architect

These are properties the requirements above fix, whose mechanisms the
architecture decides. They are not open questions in this spec.

- **Which component turns FR-L1's uptake evidence into an uptake judgment.**
  FR-L1 fixes that the evidence is recorded per event; who resolves it is a
  component boundary.
- **How per-region verification commands are derived.** FR-K1 fixes the property:
  the command returned for a region is the one that exercises that region.
- **What constitutes a literal-match landmine, and against what.** P0-3 fixes
  that literal-match detection is one of Phase 0's two writers for landmine
  records.
- **The runtime, storage engine and process model.** C-1, C-2 and NF-1 fix the
  properties; the architect chooses the stack and verifies its capabilities.

## 13. Acceptance criteria

Phase 0 is complete when all of the following pass and the owner has run it on a
real project without incident.

- **AC-1 (coupling → FR-K2, FR-A5, FR-D1, FR-D5, NF-1)** — In a fixture with a
  known co-change pair, an observed edit to one file yields a coupling whisper
  naming the other, with its evidence ratio and a git-history pointer, inside the
  latency budget.
- **AC-2 (silence → FR-A1, FR-A2)** — Replaying a recorded session of routine
  events produces whispers on at most 10% of events.
- **AC-3 (no deny → FR-O4, FR-O4a, FR-O3)** — No shim code path can return a
  blocking decision; induced service failure and induced timeout each yield
  silence and an unimpeded agent; a `Stop` carrying `stop_hook_active: true`
  produces silence; and no oracle output extends the loop by more than one
  continuation per stop.
- **AC-4 (pristine tree → C-4, FR-K8)** — After `init`, index, a full session and
  `deinit`, the only ever-touched file in the tree is the harness settings file,
  and `deinit` restores it.
- **AC-5 (warning, not block → FR-D3, P0-4)** — An edit to a detected generated
  file proceeds unimpeded and receives the FR-D3 warning with its mechanical
  evidence and false-fire clause.
- **AC-6 (consequence → §5 consequence row, FR-D1)** — A pending edit to a symbol
  with known callers yields a consequence whisper stating call-site count and
  spread, with a pointer that resolves.
- **AC-7 (orientation → §5 orientation row, FR-K1)** — A submitted prompt naming a
  task whose entry points are in the index yields an orientation whisper naming
  them, within the harness's `UserPromptSubmit` budget.
- **AC-8 (completeness and verification → §5, FR-O4a, P0-5)** — At stop, with a
  co-change partner untouched, a completeness whisper names it; with a changed
  region having a verification command, a verification whisper names it; and each
  is recorded as a continuation event.
- **AC-9 (secrets → FR-X1)** — Fixture secrets, in tracked files and in git
  history, never appear in plaintext in any store file, whisper, or log.
- **AC-10 (least privilege → FR-X5, FR-X7)** — An instrumented run shows no
  writes inside the repository tree and no network connections at all.
- **AC-11 (injection → FR-X2, FR-X3, FR-X8)** — With hostile imperative text
  planted in file content, code comments and commit messages, no whisper relays
  or obeys it; suspect content appears only as a pointer.
- **AC-12 (staleness → FR-K7)** — With a deliberately stale index, events yield
  silence or reduced-confidence whispers, never errors or spam, and a background
  refresh is triggered.
- **AC-13 (self-detection → FR-M1, FR-M2, FR-M3)** — Induced failures — broken
  hook wiring, corrupted store, service killed mid-session — are each recorded in
  the diagnostic log and surfaced by `ctxoracle status` in plain language, with
  zero errors and zero added output in the agent's session.
- **AC-14 (measurements → P0-6)** — After a fixture session, `ctxoracle status`
  reports the silence rate, the added-latency distribution against NF-1, and the
  continuation count.
- **AC-15 (zero ceremony → P0-7)** — An agent with no knowledge of the oracle
  completes a task with it active, produces no oracle-specific output, and
  receives whispers throughout.

---

**Status.** Written 2026-08-01. Not yet independently reviewed; per `CLAUDE.md`'s
lifecycle it is not a basis for architecture work until an adversarial review has
run against it and every finding is applied.
