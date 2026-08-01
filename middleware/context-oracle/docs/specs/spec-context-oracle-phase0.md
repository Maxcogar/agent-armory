# Spec: Context Oracle Phase 0 — the deterministic oracle

Governs the first buildable phase of the Context Oracle (`ctxoracle`).

**Relationship to `spec-context-oracle.md`.** That document specifies v1 across
three phases; this specifies Phase 0. Where both address the same subject, this
governs Phase 0. v1 §12's Phase 0 exit is superseded by §14 here.

**Identifier namespaces.** `FR-*`, `NF-*`, `C-*` and `P1`–`P9` are the v1 spec's;
this document does not mint new ones in those namespaces. §3 states every v1
requirement's Phase 0 disposition — in force, narrowed, or deferred — and where a
requirement is narrowed the narrowing is stated there rather than left implicit.
`AC-*` and `P0-*` are this document's own: `AC-n` here does not denote the v1
spec's `AC-n`, and where a v1 criterion is meant it is written `v1 AC-n`.

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
only way to obtain evidence about how often the oracle should speak. §14 states
what a run must have *produced* for that reason: a phase justified by measurement
cannot exit on a run that measured nothing.

## 2. Scope

**In scope**: hook shims; the session service; the structural index; the
co-change miner; the six genres in §7; whisper delivery; the security controls in
§10; the diagnostic core; the CLI.

**Out of scope**, each with the phase that owns it, or the reason its phase is
unresolved upstream:

| Excluded | Owned by | Reason |
|---|---|---|
| Model access and the recursion guard | Phase 1 | The model client does not exist until Phase 1, and every genre in §7 is reachable without one |
| Degraded mode | Phase 1 | The runtime fallback for an unreachable model path cannot precede that path |
| Narration reading and intent tracking | Phase 1 | Requires the transcript reader |
| Assumption-check, steering, answer genres | Phase 1 | Each requires model judgment over narration |
| Process conformance and answer drift | Phase 1 | Process conformance requires model judgment; answer drift's open questions are written by the narration reader |
| Unknown genre | Unresolved upstream | v1 §14: *"The Unknown genre has no phase"*; this document neither settles it nor treats it as dropped from v1 |
| Delivery to subagents | Phase 1 | Phase 0 records a per-consumer key where an event carries one (FR-O6) and delivers to the main agent only |
| Companion skill | Phase 1 | Teaches an agent to read whispers the judgment layer produces |
| Distiller, learning loop, false-fire ladder, automated landmine/invariant/recipe mining, self-report, export/import | Phase 2 | Each consumes measurements Phase 0 produces |

**Genre arms narrower here than in v1 FR-A2, each with its own reason.** One
reason does not cover them; the arms fail for different causes.

| Arm | Why it is narrower in Phase 0 | Returns when |
|---|---|---|
| Orientation's invariant arm | Invariant records (FR-K5) have no *automated* writer in Phase 0; FR-L6 promotion can fill them, but a session cannot rely on the owner having typed one | Phase 2 mining, or an owner-entered invariant |
| Coupling's canonical-helper arm | Requires the exemplar registry (FR-K3), which has no automated writer | Phase 2 mining |
| Consequence's reuse arm | Same: requires FR-K3 exemplars | Phase 2 mining |
| Consequence's historical-breakage arm | **Not a record-type gap.** It joins the co-change graph (FR-K2) against test topology (FR-K1), both of which Phase 0 builds and populates. It is deferred only because ranking a breakage claim needs the false-fire evidence Phase 0 is built to collect | Phase 1, on Phase 0's measurements |
| Completeness's invariant arm | Invariant records, as above | Phase 2 mining, or an owner-entered invariant |
| Warning's landmine arm | Landmine records (FR-K4) have no automated writer, and v1 §14 leaves this arm's phase unresolved | Phase 2 mining, or an owner-entered landmine |

Orientation's landmine arm is **not** narrowed — see §7 and P0-1. Orientation's
v1 token cap is **retained**, not dropped: a cap is a bound, not a record type,
and removing it would loosen the genre rather than narrow it (`RETHINK.md:163`,
*"~150–400 tokens. Not a binder."*).

## 3. Disposition of every v1 requirement

The v1 spec carries 65 `FR-*`/`NF-*`/`C-*` requirements. Each has exactly one
Phase 0 disposition below, so a reader can tell a deliberate exclusion from an
omission without diffing the two documents.

**In force in Phase 0, unchanged (38).** FR-O2, FR-O3, FR-O4, FR-O4a, FR-O5
(§5); FR-K1, FR-K2, FR-K6, FR-K7, FR-K8 (§6); FR-A1, FR-A3, FR-A4, FR-A6, FR-A7
(§8); FR-D1, FR-D2, FR-D3, FR-D4, FR-D5 (§9); FR-X1, FR-X2, FR-X3, FR-X4, FR-X6,
FR-X7, FR-X8 (§10); FR-M1, FR-M4, FR-L1, FR-L6 (§6, §11); NF-1, NF-2, NF-3 (§11);
C-2, C-3, C-4, C-5 (§11).

**In force but narrowed here (10).**

| v1 requirement | Narrowing | Where stated |
|---|---|---|
| FR-O1 — observation set | Narration reading is deferred to Phase 1 (no transcript reader); `SubagentStop`, `StopFailure` and `SessionEnd` are added as observed events | §5 |
| FR-O6 — per-consumer delivery | Phase 0 keys session state per consumer but delivers only to the main agent | §5, P0-D-10 |
| FR-A2 — twelve whisper genres | Six are built; six are deferred by §2's table; six built arms are narrowed per §2's arm table | §7 |
| FR-A5 — the bar | Three terms per v1 §12's "Phase 0's bar"; no degraded-mode rise (P0-2); the evidence floors are elaborated as P0-5 and P0-6 | §8, P0-D-6 |
| FR-K3 — exemplar registry | Schema exists; no Phase 0 writer | P0-1 |
| FR-K4 — landmine records | Schema exists; FR-L6 promotion is the only Phase 0 writer | P0-1 |
| FR-K5 — invariant records | Schema exists; FR-L6 promotion is the only Phase 0 writer | P0-1 |
| FR-M2 — self-detected failure classes | The model-path-failure class is absent; Phase 0 has no model path | §11 |
| FR-X5 — least privilege | v1 permits network for the §6.2 model call; Phase 0 makes none, so the allowance is removed and the constraint tightens to no network at all | §10, P0-D-11 |
| C-1 — sandbox/cold-container readiness | v1's named satisfying stack is retained as a witness rather than a mandate; three testable runtime properties are added | §11, P0-D-13 |

**Deferred whole, with the phase that owns each (17).** Phase 1 — FR-A8 and
FR-A9 (process conformance, answer drift); FR-J1–FR-J5 (judgment and model
access); FR-S1–FR-S3 (companion skill). Phase 2 — FR-K9 (export/import); FR-L2,
FR-L3, FR-L4, FR-L5, FR-L7 (distiller, false-fire ladder, store routing, learned
provenance, interaction-failure learning); FR-M3 (the distiller consuming
diagnostics). Each is the subject of a §2 row; none is dropped from v1.

**Principles.** v1's P1–P9 govern Phase 0 unchanged, **except P2**, whose
worst-outcome clause (*"its worst possible outcome is a wasted sentence"*) is
qualified for stop-delivered whispers by `[OWNER-12]`: such a whisper costs the
agent a turn it was trying to end. P0-3 is the requirement that implements it.
P3 (zero ceremony) is carried as AC-20.

## 4. Sources, and how each was confirmed

| Source | Governs | Confirmation |
|---|---|---|
| `RETHINK.md` — §1, §2.3, §4, §5, §6, §12 and its addenda (303–399) | The mission; the relevance metric; the knowledge tiers; the attention and delivery posture; the owner's locked decisions | Read 2026-08-01; every cited range re-verified against current source the same day |
| `spec-context-oracle.md` (v1) | The requirement identifiers and their meanings; principles P1–P9; v1 §12's "Phase 0's bar" (`:895–901`) | Read 2026-08-01. §3's disposition was built by enumerating the v1 identifier set directly from the file |
| Claude Code hooks documentation (`code.claude.com/docs/en/hooks`) | The observation and delivery interface | **Downloaded raw** 2026-08-01 (242,078 bytes) and string-matched, rather than queried for snippets. Confirmed facts in the rows below |
| Zimmermann, Weißgerber, Diehl, Zeller, *Mining Version Histories to Guide Software Changes*, IEEE TSE 31(6), 2005 `[ROSE-05]` | The co-change evidence floor and part of the mining hygiene | PDF fetched, text extracted, every quotation and figure below string-matched verbatim 2026-08-01 |
| Zimmermann & Weißgerber, *Preprocessing CVS Data for Fine-Grained Analysis*, MSR 2004 `[MSR-04]` | Merge- and bulk-commit exclusion as co-change hygiene | Carried from v1 `:105`, where it grounds FR-K2's merge-exclusion rule |
| Hassan & Holt, *Predicting Change Propagation in Software Systems*, ICSM 2004 `[HH-04]` | That raw co-change association is unusable without pruning (precision 0.06), which grounds the suggestion-grade support floor | Carried from v1 `:104` |
| OWASP Top 10 for LLM Applications 2025, LLM01:2025 Prompt Injection `[LLM01]` | Least privilege and segregation of external content | Carried from v1 `:108`, where it grounds FR-X5 |
| Node.js API docs + nodejs/node source `[NODE]` | `node:sqlite` availability as C-1's witness stack | Carried from v1 `:113` |

**Hook contract facts this document depends on**, each string-matched against the
downloaded reference:

- **Lifecycle.** Once per session: `SessionStart`, `SessionEnd`. Once per turn:
  `UserPromptSubmit`, `Stop`, `StopFailure`. Per tool call: `PreToolUse`,
  `PostToolUse`. Subagent lifecycle: `SubagentStart`, `SubagentStop`.
- **`Stop` fires "When Claude finishes responding"** — every turn end, not only a
  completion claim. `StopFailure` fires "When the turn ends due to an API error.
  Output and exit code are ignored." This is the fact P0-3 turns on.
- **`Stop` and `SubagentStop` accept `hookSpecificOutput.additionalContext`** for
  *"non-error feedback that continues the conversation."* This is the delivery
  path for the completeness and verification genres.
- **`PreToolUse` may inject context without a permission decision.** The
  reference states that exit code 0 with no output *"means the hook has no
  decision to report, so the tool call continues through the normal permission
  flow"*, and that *"the hook can deny the call, but staying silent doesn't
  approve it"*; `additionalContext` is a field of the `PreToolUse`
  `hookSpecificOutput` object independent of `permissionDecision`.
- **`PostToolUse` accepts `additionalContext`** — *"String added to Claude's
  context alongside the tool result."*
- **`UserPromptSubmit` accepts `additionalContext`.**
- **Timeouts are per handler type, not a single default**: 600 s for `command`,
  `http` and `mcp_tool`; 30 s for `prompt`; 60 s for `agent`. `UserPromptSubmit`
  lowers the first group to 30 s.
- **`SessionEnd` hooks share a 1.5-second budget**; *"if your settings set a
  longer per-hook `timeout`, Claude Code raises the budget to match, up to 60
  seconds."* This is below FR-O3's 3 s ceiling, so C-2 requires `init` to write
  an explicit `SessionEnd` timeout.
- **The harness screens injected text.** *"Text framed as out-of-band system
  commands can trigger Claude's prompt-injection defenses, which causes Claude to
  surface the text to you instead of treating it as context."* This constrains
  FR-X2 and gives FR-D2 a mechanical grounding.

No source outside this table is cited, and no requirement depends on one.

## 5. Observation

- **FR-O1** — The oracle observes: `SessionStart`; `UserPromptSubmit`; completed
  read and search tool calls; pending edit and write tool calls; completed edit
  and write tool calls; `Stop`; `SubagentStop`; `StopFailure`; and `SessionEnd`.
  `SessionStart`, `StopFailure` and `SessionEnd` are observation-only — recorded,
  never delivered on. `SubagentStop` is observed so FR-O4a's continuation bound
  and FR-O6's per-consumer key hold on that path from the first implementation;
  Phase 0 delivers nothing on it. v1's narration-reading clause is deferred to
  Phase 1 with the transcript reader (§3).
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
- **FR-O4a** — **Continuation is bounded to one per stop.** The oracle emits on
  `Stop` only when `stop_hook_active` is false, extending a turn at most once per
  stop and never chaining; the same rule governs `SubagentStop`, on which Phase 0
  emits nothing. `RETHINK.md:363–379` and `:393–399`, decision 12. Independent of
  the harness's cap value. The per-*session* bound is P0-3's.
- **FR-O5** — The oracle speaks only in response to an observed harness event. No
  timer, no idle detector, no polling loop. `[P0-D-1]`
- **FR-O6** — Session state is keyed per consumer from the first implementation.
  Where an event carries a consumer identity distinct from the main agent's,
  Phase 0 records it and delivers nothing against it. `[P0-D-10]`

## 6. Knowledge

- **FR-K1** — A structural index: files, symbols, import and reference edges,
  directory topology, generated/vendored/build-output zones, test topology, and
  per-region verification commands. Incremental. Language scope is TS/JS/TSX and
  Python behind a language-agnostic interface (v1 `[D-15]`). `RETHINK.md:130–134`.
- **FR-K2** — A co-change graph mined from git history at file and symbol
  granularity, refreshed incrementally as history grows. Five mining rules are
  requirements, not options:
  1. **Exclude merge commits** — they duplicate and falsely relate changes
     `[MSR-04]`. Git records merges explicitly, so this is a direct test rather
     than a proxy.
  2. **Exclude transactions above a size cap**, default 30 changed entities.
     `[ROSE-05]`: *"In order to detect coupling within transactions, one must
     avoid the large merge transactions. ROSE does so by ignoring all changes
     that affect more than 30 entities."* In a CVS archive this served as the
     merge proxy; here it is the bulk/bookkeeping-commit filter `[HH-04]`.
  3. **A configurable history horizon** caps how old a transaction may be and
     still teach — `[ROSE-05]`: *"ROSE has much outdated knowledge—which suggests
     that ROSE should not learn from too old transactions."*
  4. **Record counts, ratios and recency**; recency *weighting* in ranking is a
     per-project tunable, not hardwired `[HH-04]`.
  5. **Refresh incrementally** as history grows.
- **FR-K6** — Every record carries provenance — a `file:line` span, a commit hash,
  a dated human statement, or a learned-record reference — and a trust label
  separating repository-derived text from human-stated origin. Records without
  provenance are unrepresentable. `RETHINK.md:77–78` requires the provenance; the
  trust label is required by T2 in §10, where its justification lives.
- **FR-K7** — Staleness never blocks and never spams: a stale index lowers
  confidence, usually to silence, and triggers background refresh.
- **FR-K8** — Stores are per-repository and per-user, both outside the repository
  tree, and team sharing is out of scope. `RETHINK.md:330–334`, decision 6.
- **FR-L1** — The session service logs, per event, the candidates considered, the
  whisper sent if any, and subsequent evidence that the agent acted on it. This
  log is Phase 1's input for a hit rate; Phase 0 records the evidence and makes no
  uptake judgment (`[P0-D-12]`). Verified by AC-29.
- **FR-L6** — Human statements are recorded as facts with human provenance, with
  no override ritual. Their Phase 0 entry channel is the CLI (§12), and
  orientation's landmine arm is the Phase 0 genre that reads what they write
  (§7). `[P0-D-2]`
- **P0-1** — The FR-K3 exemplar, FR-K4 landmine and FR-K5 invariant schemas, and
  the recipe record FR-L2 produces, exist in Phase 0 with their provenance
  constraints. Phase 0's only writer for them is FR-L6 promotion; there is no
  automated miner until Phase 2. Literal-match landmine detection is a read over
  indexed content and over promoted records, which is what orientation's landmine
  arm uses. A schema with no automated writer ships empty rather than becoming a
  later migration. `[P0-D-3]`

## 7. What Phase 0 says

Six of the twelve genres FR-A2 defines.

| Genre | Fires on | Channel | Content | Evidence |
|---|---|---|---|---|
| **Orientation** | prompt submitted | `UserPromptSubmit` | 2–4 entry points for the task, plus any landmine matching the task shape; ≤ 400 tokens | index entry points; promoted landmine records |
| **Coupling** | file read / symbol searched | `PostToolUse` | strongest co-change partners with the evidence ratio | co-change graph |
| **Consequence** | edit or write pending | `PreToolUse` | call-site count and spread for the thing being changed | reference edges |
| **Warning ⚠ (generated)** | edit pending in a generated zone | `PreToolUse` | that the file is build output, the evidence, what overwrites it, where the editable source is | zone classification and its captured evidence |
| **Warning ⚠ (vendored)** | edit pending in a vendored zone | `PreToolUse` | that the file is vendored third-party code, the evidence, and that the edit is lost at the next dependency update — there is no editable source in-tree | zone classification and its captured evidence |
| **Completeness** | edit completed, or stop | `PostToolUse` / `Stop` | the co-change partner not yet touched | co-change graph |
| **Verification** | stop | `Stop` | the verification command for the changed region | per-region verification commands |

Consequence and both warning arms fire on a pending edit, which requires
injecting context without issuing a permission decision; §4 records the contract
facts that make this available. FR-O4's property is that no code path *can* issue
a permission decision.

**Stop-class genres compete.** Completeness and verification can both have a
candidate at the same stop, and FR-A3 permits one whisper per event. They are
ordered by FR-A5's score like any other candidates; there is no genre precedence.
Completeness also has a `PostToolUse` arm, so verification is the genre most
exposed to losing the stop — P0-4 reports each genre's delivered count so a
systematic shut-out is visible rather than silent.

## 8. When Phase 0 speaks

- **FR-A1** — Per event the oracle answers internally: given what the agent is
  doing now, do I know something it almost certainly does not that would change
  what it does next? Default answer no → silence. `RETHINK.md:169–171`.
- **FR-A3** — At most one whisper per event, within a per-session injected-token
  budget of 2,000 tokens by default, configurable. Warnings take priority within
  that budget, never exemption from it. `RETHINK.md:175–176` grounds the hard
  caps; the priority clause is inherited from v1 and unsourced — see `[P0-D-15]`.
  `[P0-D-4]`
- **FR-A4** — Never tell the agent what it has already seen (`RETHINK.md:138`),
  been told, or visibly incorporated (`:177–178`); orientation candidates decay
  out of consideration once the agent is deep in the task (`:175–176`).
- **FR-A5** — Each candidate carries **confidence × decision-impact × marginal
  value**, and only the top candidate above the bar is spoken. All three terms are
  computable without a model, per v1 §12's "Phase 0's bar"
  (`spec-context-oracle.md:895–901`): decision-impact decomposes into
  `materiality`, which falls back to the genre's base weight for mechanical
  genres, and `structural_weight`, which is deterministic; marginal value is v1's
  `self_serve_cost`, which *"derives from provenance class and what the consumer
  has already done"*, renamed here to match `RETHINK.md:59–61` (*"Marginal value
  over the agent's own abilities is the only relevance metric that matters"*).
  The bar ships high (`RETHINK.md:198–199`) and is configurable. `[P0-D-6]`
  `[P0-D-16]`
- **P0-5** — **Warn-grade evidence floor.** A ⚠ whisper on history-derived
  evidence requires co-change support ≥ 3 and confidence ≥ 0.9. `[ROSE-05]` sets
  that operating point: *"ROSE is set up to issue warnings only if the high
  confidence threshold of 0.9 is exceeded. Still, we wanted to get as many missing
  items as possible, resulting in a support count threshold of 3."* Its benefits
  there are precision — *"The average precision is above 66 percent"* — and, in a
  separate evaluation over complete transactions, *"Only 2 percent of all
  transactions cause a false alarm."* **Its cost is coverage, not quality**: at
  the same operating point *"The feedback is 3 percent and the average recall is
  about 75 percent,"* meaning one warning per 33 missing items, so *"the
  percentage of missed alarms is on average 97 percent"* — while *"for those cases
  where ROSE issues a warning, it predicts 75 percent of the items that are
  actually missing."* A warn-grade channel at this floor fires rarely and is
  thorough when it fires. That bounds Phase 0's warn-grade evidence yield, which
  §14's exit measures rather than assumes. Suggestion-grade coupling may run
  looser, never below support ≥ 2, because raw co-change association is ~6%
  precise without pruning `[HH-04]`; `[ROSE-05]` measured *"a feedback of 0.64 and
  a precision of 0.30"* at support 1 and confidence 0.1.
- **P0-6** — Both warning arms in §7 are exempt from P0-5's floors. Their evidence
  is a zone marker, not history, and a zone marker generates no co-change support
  at all. `[P0-D-5]`
- **FR-A6** — **Evidence-corpus floors.** Two, because a thin corpus and a thin
  region silence for different reasons and either alone leaves a gap:
  corpus-level, history-backed genres stay silent below 200 mined transactions;
  region-level, they stay silent for a region below 20 mined transactions
  touching it. Both configurable. These are separate from P0-5, which is computed
  per pair and cannot express thinness. `[P0-D-7]` `[P0-D-16]`
- **FR-A7** — **First impressions.** In a project's first 3 sessions
  (configurable), only the highest-confidence candidates speak: the generated and
  vendored warnings, whose evidence is a zone marker, and coupling **at the P0-5
  warn-grade floor** rather than the looser suggestion grade. `[P0-D-4]`
  `[P0-D-8]`
- **P0-2** — Phase 0 ships the bar with no degraded-mode delta and issues no
  degraded-mode notice. v1 §12 states the reason: the raised-bar delta belongs to
  degraded mode, *"which compensates for a lost intent signal; Phase 0 has not
  lost one."*
- **P0-3** — **Stop-grade whispers, and what Phase 0 can recognise at a stop.**
  `Stop` fires whenever Claude finishes responding (§4), not only when an agent
  claims completion. Detecting an actual completion claim requires narration
  reading, which is Phase 1. Phase 0 therefore holds `[OWNER-12]`'s accepted turn
  cost without the discrimination that ruling was about, and this document states
  that plainly rather than writing as though the event were the moment. The
  capability stays, per the owner's ruling; what is bounded is its volume:
  - A stop-grade whisper must clear the ordinary bar plus a configured delta,
    **defaulting to zero** — no raised bar until measurement licenses one.
  - At most **3 stop-grade whispers per session** (configurable), which is the
    per-session bound `RETHINK.md:393–399` leaves unstated while bounding the
    per-stop cost to one.
  - Each delivery is recorded as a continuation event, and each candidate a
    non-zero delta suppresses is recorded, so the owner sees both what the
    capability cost and what it withheld. `[P0-D-9]`

## 9. Delivery

- **FR-D1** — Whisper format: `[oracle]` prefix (`RETHINK.md:195`), a claim of one
  to five sentences with at least one verifiable pointer (`:187–188`), a
  confidence tag when confidence is not high (`:196–197`), a genre tag, and
  optionally a one-line "so what".
- **FR-D2** — Informative, never imperative: facts and consequences, never
  commands. `RETHINK.md:190`. The harness supplies a mechanical reason as well:
  text framed as out-of-band system commands can trigger its prompt-injection
  defences and be surfaced to the user instead of delivered as context (§4).
- **FR-D3** — Warning subtype: ⚠ marker, the mechanical evidence, the concrete
  consequence for that zone type (§7), and an explicit false-fire clause inviting
  correction. Never a block. `RETHINK.md:314–323`.
- **FR-D4** — The only agent-facing channel is hook context injection. Human
  notices use the human-visible channel and never consume agent context.
- **FR-D5** — Co-change claims always state their evidence ratio, never as
  certainty.

## 10. Threat model and security

Phase 0 reads repository text and git history, persists them, and injects derived
text into an autonomous agent's context. That is its entire attack surface. It
makes no model call, so threats concerning model-call prompts and credential
handling do not arise here; they return with Phase 1.

**T1 — Indirect prompt injection through repository text.** *Attacker*: anyone who
can land text in the repository or its history. *Target*: the agent's behaviour.
*Path*: imperative text in a comment, commit message, filename or generated-file
header is mined and injected, where it reads as instruction. *Cost*: the agent
acts on an instruction the owner never gave, with the oracle's credibility behind
it. `[LLM01]`

**T2 — Store poisoning.** *Attacker*: the T1 population, plus anything able to
write the store path. *Target*: the persisted knowledge. *Path*:
repository-derived text is stored without a trust label and later treated as
though a human asserted it. *Cost*: a poisoned fact outlives its session and is
delivered with unearned authority. This is what FR-K6's trust label prevents.

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
  are produced from a fixed schema validated by deterministic code. **Pointer-only
  is the default for every repository-derived span.** Inline quotation is
  permitted only for mechanically-generated content, because a delimited quotation
  of hostile imperative text is the shape the harness's own injection defences
  screen for (§4) — which would convert the whisper into a user-facing notice, a
  silent non-delivery. `[LLM01]`
- **FR-X3** (T1) — Content flagged injection-suspect at index time is referenced
  by pointer only, never quoted.
- **FR-X4** (T2) — Records preserve trust origin through every pipeline stage.
- **FR-X5** (T4) — Least privilege: read-only repository access
  (`RETHINK.md:321–323`), no tool-invocation authority in the agent's session, and
  — Phase 0 having no model call — no network access at all. The latter two
  clauses are grounded in `[LLM01]`'s least-privilege control, not in
  `RETHINK.md`. `[P0-D-11]`
- **FR-X6** (T1, T2, oversight) — Every whisper is logged with the evidence it
  used and its injected-token count, giving the owner a reviewable audit trail.
- **FR-X7** (T3) — Both stores live outside the repository tree and the oracle
  emits no outbound traffic. `RETHINK.md:330–334` establishes the location and the
  solo scope; the no-traffic property is this document's, derived from FR-X5.
  `[P0-D-11]`
- **FR-X8** (T1, T2) — The test suite includes adversarial fixtures: injection
  payloads in code comments, commit messages and file content, asserting no
  whisper relays or obeys them.

## 11. Self-observability, qualities, constraints

The owner cannot be the failure detector. `RETHINK.md:350–354`, decision 10: *"it
could fail a hundred ways in front of me and I wouldn't know."*

- **FR-M1** — Every component emits structured diagnostic events to a local
  diagnostic log, separate from the whisper audit log: hook invocations with
  latency and outcome, store read/write failures, index refresh runs, delivery
  results, and per-whisper injected-token counts.
- **FR-M2** — The oracle detects its own failure classes from that log without
  human observation: hooks not firing, latency breaches, store corruption, index
  staleness, and whispers produced but not delivered. v1's model-path-failure
  class does not apply — Phase 0 has no model path. `ctxoracle status` surfaces
  health and recent anomalies in language a non-programmer can read.
- **FR-M4** — Diagnostics never touch agent context and never leave the machine.
- **P0-4** — `ctxoracle status` computes and reports, from those logs: the silence
  rate; the added-latency distribution against FR-O3; the continuation count; the
  count of candidates a non-zero stop-bar delta suppressed; the session
  injected-token total against FR-A3's budget; and the delivered count per genre.
  `[P0-D-12]`

- **NF-1** — Hook-added latency per FR-O3: p95 ≤ 1.5 s, ceiling 3 s, then silence.
- **NF-2** — Session token overhead stays within FR-A3's budget, is recorded per
  FR-M1 and FR-X6, and is reported by `ctxoracle status`.
- **NF-3** — Indexing is incremental after first build, and first build on a
  mid-size repository requires no network access beyond what the harness already
  has.

- **C-1** — **Cold-container ready.** Installation requires no native toolchain
  and no prebuilt-binary download, and uses no network beyond the harness's. The
  running oracle — indexing included — opens no connection at all (FR-X5). A
  satisfying stack exists as a witness, not a mandate: Node ≥ 22.13.0 with
  built-in `node:sqlite`, FTS5 compiled in on both LTS lines `[NODE]`. Any
  runtime and storage engine meeting the three properties is acceptable, and the
  capabilities relied on are confirmed against that stack's current documentation
  before they are relied on. `[P0-D-13]`
- **C-2** — Session state persists warm across hook invocations with sub-second
  access, and is torn down on `SessionEnd`; cold-starting per event cannot meet
  NF-1. Because `SessionEnd` hooks share a 1.5-second budget by default (§4),
  below FR-O3's ceiling, `ctxoracle init` writes an explicit `SessionEnd`
  `timeout` into the harness settings file.
- **C-3** — Harness-specific knowledge lives in the shims. `RETHINK.md:291`.
- **C-4** — `ctxoracle init` is explicit and minimal — its only tree-touching act
  is writing the harness settings file, including C-2's `SessionEnd` timeout;
  `deinit` removes the wiring cleanly. Passive auto-bootstrap into a project tree
  is prohibited.
- **C-5** — The hooks contract is version-bound. Implementation re-verifies it,
  and shims degrade to silence on any drift they detect. No requirement here
  depends on a harness timeout value or on the numeric continuation cap.

## 12. External interfaces

**Consumed**: the Claude Code hooks interface — the events in FR-O1, the inputs
identifying the session and the tool call, and the output discipline in FR-O4.

**Provided**: `ctxoracle init`, `index`, `status`, `deinit`, and the command by
which a human statement becomes a fact (FR-L6). `status` is the owner's only view
of the oracle's health and measurements.

**Nothing else.** Phase 0 opens no network connection (FR-X5).

## 13. Decisions made in this spec

- **P0-D-1 — FR-O5 is stated rather than inferred from FR-O1's list.** Three of
  FR-O1's events are observation-only, so the list does not by itself forbid a
  timer, and Phase 0 is the first phase with a warm background service. The
  grounding is a judgment: an unbidden whisper on a timer is an interaction
  channel the owner has never approved, and every trigger the attention model
  admits (`RETHINK.md` §5, lines 153–182) is a response to something the agent did.
- **P0-D-2 — Human facts enter Phase 0 through the CLI.** FR-L6's v1 input is a
  statement made in the session, and the session reader is Phase 1. FR-L6 stays in
  force in Phase 0 because orientation's landmine arm reads what it writes; a
  writer with no reader would be a CLI command whose output nothing consumes.
- **P0-D-3 — Schemas Phase 0 cannot populate automatically are created in
  Phase 0**, so Phase 0's store is not a throwaway and Phase 2 mining lands
  without a migration.
- **P0-D-4 — FR-A3's budget, FR-A6's floors and FR-A7's session count carry stated
  values**, without which NF-2 is unfalsifiable and FR-A6 and FR-A7 are untestable.
  All are judgments of the same class as AC-2's rate and are expected to move once
  Phase 0 has run and §14's exit run has reported its yield.
- **P0-D-5 — Both warning arms are exempt from the co-change floors**, which are
  the operating point of a study of history-derived rules. A zone classification is
  evidenced by a marker and generates no co-change support, so under P0-5 it could
  never clear warn-grade — the exemption is what makes the genre speakable at all.
- **P0-D-6 — FR-A5's three-term product is v1's, not this document's.** v1 FR-A5
  states two terms, but v1 §12's "Phase 0's bar" (`spec-context-oracle.md:895–901`)
  already binds Phase 0 to three and names each one's model-free computation. This
  document adopts that decomposition and renames `self_serve_cost` to marginal
  value to match `RETHINK.md:59–61`. §3 records FR-A5 as narrowed accordingly.
- **P0-D-7 — The corpus floors are separate from the evidence floor, and there are
  two of them.** P0-5 is evaluated per pair, and a thin corpus produces pairs with
  high support and perfect confidence. Corpus-level and region-level thinness are
  different conditions — a mature repository with one new directory fails the
  region test and passes the corpus test — so both are stated with values rather
  than one granularity standing in for the other.
- **P0-D-8 — FR-A7's Phase 0 set is coupling at the warn-grade floor, not coupling
  generally.** v1 FR-A7 admits only the highest-confidence genres, on the ground
  that early reports set the tool's credibility; admitting suggestion-grade
  coupling — which P0-5 permits down to support ≥ 2, where `[ROSE-05]` measured
  precision 0.30 — would make the loosest evidence in the system the first thing a
  project ever hears. AC-33 exists because this restriction, P0-5's 3% feedback and
  FR-A6's floors compound toward silence on exactly the run that certifies Phase 0.
- **P0-D-9 — The stop-bar delta defaults to zero and the per-session count is
  bounded.** `[OWNER-12]` accepted a cost bounded to one extra turn *per stop*, and
  a session has as many stops as the agent has turns; nothing upstream bounds the
  session total. A distribution-relative default (a decile) is uncomputable on the
  first run, which is the run Phase 0 exists to perform, so the delta ships at zero
  and moves on measurement. Neither choice re-opens the owner's ruling: the
  capability stays and its cost is now countable.
- **P0-D-10 — Per-consumer keying is adopted in Phase 0 although delivery is
  not.** Decision 8 (`RETHINK.md:342–344`) puts subagent delivery in v1 scope
  without saying when state must become per-consumer; keying it from the first
  implementation is this document's, because session state is the one structure a
  later phase cannot re-key without rewriting every reader.
- **P0-D-11 — FR-X5's network and tool-authority clauses, and FR-X7's
  no-outbound-traffic property, are grounded in `[LLM01]`, not in `RETHINK.md`.**
  `RETHINK.md:321–323` supports read-only repository access and nothing about the
  network; `RETHINK.md:330–334` fixes where the stores live and does not address
  telemetry. Stating this keeps the derivation chain terminating on something that
  holds.
- **P0-D-12 — Phase 0's measurement obligation is the six quantities it can
  compute from its own logs**, enumerated in P0-4. A hit rate additionally requires
  resolving uptake evidence into an uptake judgment; FR-L1 fixes only that the
  evidence is recorded, and AC-29 checks that it is.
- **P0-D-13 — C-1's three cold-container properties are this document's; the
  witness stack is v1's.** Decision 4 requires sandbox compatibility and names no
  runtime property. No-native-toolchain, no-prebuilt-download and no-extra-network
  are what make "runs in a cold container" testable (AC-31). v1's named stack is
  retained so the constraint is not an existence claim with no witness.
- **P0-D-14 — AC-2's 10% ceiling is a judgment.** No published figure maps to
  per-event whisper rates for an agent consumer.
- **P0-D-15 — FR-A3's warning-priority clause is inherited from v1 and is
  unsourced there.** It was removed in one commit of this document's history as an
  unsourced genre ranking and restored in the next for identifier fidelity; this
  entry resolves that disagreement in writing rather than leaving it in commit
  messages. The clause is kept for v1 fidelity, and it is **not** converted into a
  build-time invariant: AC-28 tests only the half that follows from the budget
  being hard — that once the budget is spent nothing further is delivered,
  including a warning. Whether a warning outranks a coupling whisper under budget
  pressure is FR-A5's, per candidate, at runtime.
- **P0-D-16 — The bar's shipping scalar and the score scheme's internals are the
  architect's.** FR-A5 fixes the three factors, their model-free computability and
  that the bar ships high and is configurable; it does not fix the numeric
  threshold, because that value is meaningless until the scoring scheme that
  produces the scores exists. P0-D-4's stated-value discipline covers the
  quantities that are independent of that scheme (budget, floors, session count);
  this one is not.

## 14. Acceptance criteria

Phase 0 is complete when every criterion below passes, and when a run on a real
project produces a clean `ctxoracle status` — no unresolved failure class, no
latency breach, no undelivered whisper. The owner runs it; the diagnostics, not
the owner, are what report whether it behaved.

**The exit run must also have produced something.** A run in which the oracle
never spoke is not a passing exit; it is a result. AC-33 states what that
obligates.

- **AC-1 (coupling → FR-K2, P0-5, FR-D1, FR-D5, NF-1)** — In a fixture with a
  known co-change pair, a completed read of one file yields a coupling whisper
  naming the other, with its evidence ratio and a git-history pointer, inside the
  latency budget.
- **AC-2 (silence → FR-A1, FR-A3)** — Replaying a recorded session of routine
  events produces whispers on at most 10% of events. `[P0-D-14]`
- **AC-3 (marginal value → FR-A5, FR-A4)** — Two replays of the same event over
  the same store: where the fact is already in the consumer's read set the oracle
  stays silent; where it is not, it speaks. Separately, an orientation candidate
  that would fire early does not fire once the agent is deep in the task.
- **AC-4 (evidence and corpus floors → P0-5, FR-A6)** — A pair below support 3
  produces no ⚠ whisper; a pair at support 3 and confidence ≥ 0.9 does; a fixture
  below the 200-transaction corpus floor produces neither; and a fixture above the
  corpus floor with a region below the 20-transaction region floor stays silent
  for that region while speaking elsewhere.
- **AC-5 (no deny → FR-O4, FR-O4a, FR-O3)** — No shim path can return a blocking
  decision; induced failure and induced timeout each yield silence and an
  unimpeded agent; `stop_hook_active: true` produces silence; and no output
  extends the loop by more than one continuation per stop.
- **AC-6 (pristine tree → C-4, FR-K8)** — After `init`, index, a full session and
  `deinit`, the only ever-touched file in the tree is the harness settings file,
  whose written content is the hook wiring and the `SessionEnd` timeout and
  nothing else.
- **AC-7 (warnings, not blocks → FR-D3, P0-6)** — An edit to a detected generated
  file and an edit to a detected vendored file each proceed unimpeded and each
  receive the FR-D3 warning with the mechanical evidence, that zone's own
  consequence, and a false-fire clause — with no co-change support present for
  either.
- **AC-8 (consequence → FR-A2 §7, FR-D1)** — A pending edit to a symbol with known
  callers yields a consequence whisper stating call-site count and spread.
- **AC-9 (orientation → FR-A2 §7, FR-K1, FR-K4, NF-1)** — A submitted prompt whose
  entry points are in the index yields an orientation whisper naming them within
  NF-1's budget and within 400 tokens; and where a promoted landmine record matches
  the task shape, the whisper names it too.
- **AC-10 (completeness at stop → FR-A2 §7, FR-O4a)** — At a stop with an untouched
  co-change partner and no verification candidate, a completeness whisper is
  delivered and recorded as a continuation event.
- **AC-11 (verification at stop → FR-A2 §7, P0-4)** — At a stop with a changed
  region carrying a verification command and no completeness candidate, a
  verification whisper is delivered and recorded as a continuation event. Across a
  multi-stop fixture in which both genres have candidates, `ctxoracle status`
  reports a non-zero delivered count for each.
- **AC-12 (first sessions → FR-A7, P0-D-8)** — In a project's first 3 sessions, an
  event that would otherwise draw orientation, consequence, completeness or
  verification draws none; a suggestion-grade coupling candidate at support 2 also
  draws none; and both warning arms and a coupling candidate at the warn-grade
  floor fire.
- **AC-13 (secrets → FR-X1)** — Fixture secrets in tracked files and git history
  never appear in plaintext in any store file, whisper, or log.
- **AC-14 (least privilege → FR-X5, FR-X7)** — An instrumented run shows no writes
  inside the repository tree and no outbound traffic at all.
- **AC-15 (injection → FR-X2, FR-X3, FR-X8)** — With hostile imperative text in
  file content, comments and commit messages, no whisper relays or obeys it, and
  every repository-derived span in every emitted whisper is a pointer rather than
  an inline quotation.
- **AC-16 (provenance and trust origin → FR-K6, FR-X4, FR-X6)** — Every record
  written carries provenance and a trust label; no repository-derived record
  acquires human provenance; every whisper is in the audit log with its evidence
  and its injected-token count.
- **AC-17 (staleness → FR-K7)** — With a stale index, events yield silence or
  reduced-confidence whispers, never errors or spam, and a refresh is triggered.
- **AC-18 (self-detection → FR-M1, FR-M2, FR-M4)** — Induced failures — broken
  hook wiring, corrupted store, service killed mid-session — are each recorded and
  surfaced by `ctxoracle status` in plain language, with zero added output in the
  agent's session.
- **AC-19 (measurements → P0-4, NF-2)** — After a fixture session, `ctxoracle
  status` reports all six P0-4 quantities: silence rate, latency distribution
  against NF-1, continuation count, suppressed-at-stop-bar count, session token
  overhead against FR-A3's budget, and delivered count per genre.
- **AC-20 (zero ceremony → v1 P3, NF-2)** — An oracle-unaware agent completes a
  task with it active, produces no oracle-specific output, and receives whispers
  throughout; the count of actions the oracle requires of the agent is zero
  (`RETHINK.md:278–279`). The fixture runs outside FR-A7's first-sessions window.
- **AC-21 (human facts, written and read → FR-L6, FR-K6, FR-K4)** — A landmine
  statement entered through the CLI becomes a retrievable record carrying human
  provenance, and a subsequent prompt matching its task shape draws an orientation
  whisper naming it.
- **AC-22 (per-consumer state → FR-O6)** — Where an event carries a consumer
  identity distinct from the main agent's, the oracle records the key and delivers
  nothing against it; a `SubagentStop` is recorded with no delivery attempted.
- **AC-23 (shim discipline → FR-O2, FR-O5)** — Static inspection shows no decision
  logic in any shim and no timer, idle detector or polling loop anywhere in the
  service; an idle session produces no whisper.
- **AC-24 (lifecycle → FR-O1, C-2)** — `SessionEnd` tears the service down within
  the budget the settings file establishes; a subsequent event cold-starts cleanly;
  `StopFailure` and `SessionStart` are recorded with no delivery attempted.
- **AC-25 (mining hygiene → FR-K2, NF-3)** — A fixture history containing a merge
  commit, a transaction touching more than 30 entities, and a transaction older
  than the horizon yields a graph in which none of the three contributed an edge;
  appending new history refreshes the graph incrementally without a full rebuild.
- **AC-26 (informative, never imperative → FR-D2)** — No emitted whisper in any
  fixture run contains an imperative construction; each states a fact or a
  consequence.
- **AC-27 (empty-by-design schemas → P0-1, FR-K3, FR-K4, FR-K5)** — The exemplar,
  landmine, invariant and recipe schemas exist and validate; after a full session
  with no CLI-entered statement they hold no records.
- **AC-28 (hard budget → FR-A3, P0-D-15)** — Once the session token budget is
  spent, no further whisper is delivered, including a warning.
- **AC-29 (uptake evidence → FR-L1)** — After a fixture session containing a
  delivered whisper and a subsequent agent action on its pointer, the FR-L1 record
  for that event contains the candidate set, the whisper sent, and the uptake
  evidence, and is readable. Presence and readability only; no hit-rate judgment
  (`[P0-D-12]`).
- **AC-30 (stop-grade bound → P0-3)** — In a fixture session with more stop-grade
  candidates than the per-session bound, at most 3 stop-grade whispers are
  delivered and the remainder are recorded as suppressed; with a non-zero
  configured delta, the candidates the delta suppresses are the ones recorded.
- **AC-31 (cold container → C-1)** — Installation and first index complete in a
  container with no native toolchain, no prebuilt-binary download and no network
  beyond the harness's.
- **AC-32 (contract drift → C-5)** — A fixture presenting a drifted hooks contract
  yields silence, not an error, and the drift is recorded per FR-M1.
- **AC-33 (the exit run produced evidence → §1, P0-D-8)** — The exit run's
  `ctxoracle status` reports its whisper count. A run that produced none does not
  pass: it obligates re-setting FR-A7's session count or FR-A6's floors from that
  run's data and re-running. This criterion fails loudly rather than passing
  quietly, because Phase 0's justification is the evidence it produces.

**Verified by inspection rather than execution.** `C-3` — inspection of the
service confirms no harness-specific identifier outside the shim modules.
`FR-D4` — inspection confirms the human-notice path shares no code with the
context-injection path. `P0-2` — inspection confirms no degraded-mode delta and no
degraded-mode notice exist in the codebase.
