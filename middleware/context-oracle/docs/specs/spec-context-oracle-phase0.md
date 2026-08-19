# Spec: Context Oracle Phase 0 — the deterministic oracle

Governs the first buildable phase of the Context Oracle (`ctxoracle`).

**Relationship to `spec-context-oracle.md`.** That document specifies v1 across
three phases; this specifies Phase 0. Where both address the same subject, this
governs Phase 0. v1 §12's Phase 0 exit is superseded by §14 here.

**Identifier namespaces.** `FR-*`, `NF-*`, `C-*` and `P1`–`P9` are the v1 spec's;
this document does not mint new ones in those namespaces. §3 gives every v1
requirement exactly one Phase 0 disposition — in force unchanged, narrowed, or
deferred — and states each narrowing where the narrowed requirement is defined.
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
almost certainly does not already have. Every whisper carries a pointer and blocks
nothing. It reaches the agent at the decision it bears on — or, for the three
genres that fire on a pending edit, immediately after that edit and before the
agent's next action, which §4 shows is the earliest a whisper *keyed to the edit
event* can deliver, and which §7 and `[P0-D-26]` justify.

**Mission**, `RETHINK.md:15–24`: the tool exists because *"agents under-read the
codebase, don't know when their context is sufficient, and fill the gaps with
plausible inventions,"* and it is *"a repository-resident intelligence that hands
a working agent the knowledge it wouldn't find on its own, so the agent never has
to guess."*

**Consumers.** The coding agent receives whispers. The owner must be able to
audit afterwards everything the oracle said and the evidence behind it — §12 gives
him the surface that makes that possible — and is a non-programmer by design
(`RETHINK.md:355–359`).

**Why this phase first.** It is buildable without a model, and running it is the
only way to obtain evidence about how often the oracle should speak. §14 states
what a run must have *produced* for that reason: a phase justified by measurement
cannot exit on a run that measured nothing.

## 2. Scope

**In scope**: hook shims; the session service; the structural index; the
co-change miner; the six genres in §7; whisper delivery; the security controls in
§10; the diagnostic core; the CLI.

**Out of scope**, each with the phase that owns it and its own reason:

| Excluded | Owned by | Reason |
|---|---|---|
| Model access and the recursion guard | Phase 1 | The model client does not exist until Phase 1, and every genre in §7 is reachable without one |
| Degraded mode | Phase 1 | The runtime fallback for an unreachable model path cannot precede that path |
| Narration reading across turns, and intent tracking | Phase 1 | Requires the transcript reader. It does **not** cover the final message of the turn that just ended: the harness supplies that as a field (§4), and P0-3 uses it |
| Assumption-check and steering genres | Phase 1 | Each compares the agent's stated reasoning mid-turn against the store, which needs narration between tool calls, not an end-of-turn message |
| Answer genre | Phase 1 | Requires recognising that narration addresses the oracle, and composing a reply |
| Process conformance (FR-A8) | Phase 1 | Requires model judgment over a loaded skill's stated steps versus observed activity |
| Answer drift (FR-A9) | Phase 1 | v1 FR-A9 tracks a direct user question across turns. Its open questions are observable in Phase 0 — a direct question arrives in `UserPromptSubmit`'s `prompt` field (§4), which Phase 0 already handles — but deciding whether a later turn *addressed* one requires model judgment |
| Unknown genre | Unresolved upstream | v1 §14: *"The Unknown genre has no phase"*; this document neither settles it nor treats it as dropped from v1 |
| Delivery to subagents | Phase 1 | Tool hooks **do** fire inside subagents, carrying `agent_id` (§4), so the events arrive and Phase 0 observes them. What Phase 1 adds is the per-consumer budget and injection path. Phase 0 keys the state and delivers only to the main agent (FR-O6), and P0-4 reports the undeliverable-event share as its own labelled component of the silence decomposition (FR-O6) |
| Companion skill | Phase 1 | Teaches an agent to read whispers the judgment layer produces |
| Distiller, learning loop, false-fire ladder, self-report | Phase 2 | Each consumes measurements Phase 0 produces |
| Automated landmine / invariant / recipe mining | Phase 2 | Consumes git history and needs a writer Phase 0 does not have — FR-L6 promotion is Phase 0's only writer of these records (§6, P0-1) |
| `export` / `import` (FR-K9) | Phase 2 | Round-trips a store to a file; the store-serialisation format is v1 §14's open decision and no Phase 0 requirement needs it |

**Genre arms narrower here than in v1 FR-A2.** An arm is listed below when §7's
content column **drops it** or **narrows its formulation**, and each row's reason
column gives that row's own reason; the table lists every arm that is narrower for
any reason.

| Arm | Why it is narrower in Phase 0 | Returns when |
|---|---|---|
| Orientation's entry-point arm | Formulation narrowed to v1's own model-free version — *structural* entry points, not entry points inferred for the task. `[P0-D-17]` | Phase 1, with intent inference |
| Orientation's invariant arm | Dropped from §7's content: an invariant is a cross-file contract whose participating locations only mean something once something has been changed, and orientation fires before the agent has acted | Phase 1, once intent inference can select one |
| Coupling's canonical-helper arm | Dropped from §7's content: requires the exemplar registry (FR-K3), which has no Phase 0 writer at all — not even FR-L6 promotion, which writes landmines and invariants only | Phase 2 mining |
| Consequence's reuse arm | Same: requires FR-K3 exemplars | Phase 2 mining |
| Consequence's historical-breakage arm | Dropped from §7's content. It joins the co-change graph (FR-K2) against test topology (FR-K1), both of which Phase 0 builds — and P0-5's floor applies to the source-to-test edge, which is itself a co-change pair, so a floor does exist. It is deferred because a breakage claim asserts **causation** (editing here *breaks* that test) where the co-change graph supplies only **correlation** (the two change together); separating the two needs the false-fire evidence FR-L3's ladder collects | Phase 2, with FR-L3's false-fire ladder |
| Completeness's invariant arm | Dropped from §7's content: requires invariant records, whose only Phase 0 writer is FR-L6 promotion | Phase 2 mining, or an owner-entered invariant |
| Warning's landmine arm | Dropped from §7's content. Orientation's landmine arm already delivers owner-entered FR-K4 records at prompt time, genuinely pre-action (§7). A warning-landmine arm fires on the pending edit via `PreToolUse` and so delivers *after* that edit (`[P0-D-26]`); a landmine's value is heaviest **before** the edit, so a post-edit warning arm adds little over the orientation arm's pre-action delivery of the same records | Phase 2 mining |

Orientation's **landmine arm is retained** in §7 and is therefore not in the table
above, though it reads the same owner-written FR-K4 records that warning's landmine
arm would. It is the only arm surviving on owner-entered records, and it **ships
silent until the owner enters one** (AC-30, AC-22).

Orientation's v1 token cap is **retained**, not dropped: a cap is a bound, not a
record type, and removing it would loosen the genre rather than narrow it
(`RETHINK.md:163`, *"~150–400 tokens. Not a binder."*).

The stop-class genres' **trigger** is narrower than v1's: v1 fires completeness and
verification at every stop, Phase 0 only at a completion-claim stop (P0-3). This is
a trigger narrowing recorded in §3's FR-A2 row, not a dropped arm.

## 3. Disposition of every v1 requirement

The v1 spec carries 65 `FR-*`/`NF-*`/`C-*` requirements. Each is disposed exactly
once below, into one of three sets: in force unchanged, in force but narrowed, or
deferred. That the three sets partition v1's 65 exactly once — coverage, no minted
identifier, and the unchanged and narrowed sets disjoint — is checked mechanically
by `docs/specs/check-phase0-spec.py`.

A requirement is in the **unchanged** list only when its Phase 0 text preserves
v1's meaning; any Phase 0 difference — a clause dropped, added, or tightened — puts
it in the **narrowed** table, whose third column points to where the difference is
stated in force. There is no separate attestation that the unchanged rows equal
v1: the narrowed table carries every recorded difference, and each requirement's
own definition is the single place its Phase 0 form is stated. (`docs/collapse-log.md`,
2026-08-01 round 4: a whole-document "each row is unchanged" claim has been false in
three consecutive rounds; the fix is to delete the claim and state each fact where it
cannot drift, not to re-assert it.)

**In force in Phase 0, unchanged (19).** FR-O3, FR-O5 (§5); FR-K1,
FR-K2, FR-K6, FR-K7, FR-K8 (§6); FR-A1 (§8); FR-D1, FR-D2, FR-D4, FR-D5 (§9);
FR-X4, FR-X8 (§10); FR-M4 (§11); NF-1, NF-3 (§11); C-3, C-5 (§11).

**In force but narrowed here (29).**

| v1 requirement | Narrowing | Where stated |
|---|---|---|
| FR-O2 — shims relay whispers | v1 relays *"at most one whisper back"*; Phase 0 relays every whisper the service returned for the event, because P0-D-27 replaces v1's unsourced one-whisper count with FR-A3's token budget and more than one whisper may fire at an event | §5, P0-D-27 |
| FR-O1 — observation set | Narration reading across turns is deferred to Phase 1; `SubagentStop`, `StopFailure` and `SessionEnd` are added; `SessionStart`'s `source` field is given a job for all five of its values | §5, P0-D-20 |
| FR-O4 — no deny path | v1 makes a blocking decision structurally absent; Phase 0 additionally makes the harness's pre/post-execution mutation output fields structurally absent (`updatedInput`, `updatedToolOutput`) and the `"defer"` decision, none of which v1's "no blocking decision" enumerated | §5, §4 |
| FR-O4a — continuation bound | Phase 0 delivers only on `Stop`; `SubagentStop` is observed for the bound and FR-O6's key but Phase 0 emits nothing on it; v1's one-continuation-per-stop bound and *"never prevents a turn from ending"* are retained | §5 |
| FR-O6 — per-consumer delivery | Phase 0 keys session state per consumer and delivers only to the main agent | §5, P0-D-10 |
| FR-A2 — twelve whisper genres | Six are built; six deferred per §2's table; six arms narrowed and one retained per §2's arm table; and the stop-class genres' trigger narrows from v1's every-stop to a completion-claim stop | §7, P0-3 |
| FR-A3 — budgets | v1's unsourced *"warnings get priority within the budget"* clause is deliberately not carried; v1's unsourced *"at most one whisper per event"* count is corrected — the owner set *"per-trigger and per-session whisper budgets, hard caps"* and rejected the count-of-one, so more than one whisper may fire at an event within budget; the token denomination and the per-trigger default (= the session cap in Phase 0) are this document's judgment, `[P0-D-28]`; the 2,000-token per-session default and the orientation-counts-against-it clause are v1's and retained | §8, P0-D-15, P0-D-27, P0-D-28 |
| FR-A4 — dedup | v1's two sets — what the agent was told, and what it read — are restored across the resume/fork/compact session boundaries the harness crosses without a context boundary | §8, P0-D-20 |
| FR-A5 — the bar | Three terms per v1 §12's "Phase 0's bar"; no degraded-mode rise (P0-2); evidence floors elaborated as P0-5/P0-6; all mechanical genres carry equal base weight so no genre precedence arises | §8, P0-D-6, P0-D-18 |
| FR-A6 — cold-start floor | v1 states one per-region floor with no value; Phase 0 states two, corpus (200 transactions) and region (20), both with values | §8, P0-D-7 |
| FR-A7 — first impressions | v1 leaves the admitted genre set open and the count configurable; Phase 0 fixes 3 sessions and enumerates the admitted set, which includes orientation's owner-provenance landmine arm | §8, P0-D-8 |
| FR-K3 — exemplar registry | Schema exists; no Phase 0 writer of any kind | §6, P0-1 |
| FR-K4 — landmine records | Schema exists; FR-L6 promotion is the only Phase 0 writer | §6, P0-1 |
| FR-K5 — invariant records | Schema exists; FR-L6 promotion is the only Phase 0 writer | §6, P0-1 |
| FR-L1 — session log | v1 logs uptake evidence; Phase 0 records it and explicitly makes no uptake judgment | §6, P0-D-12 |
| FR-L6 — human statements | v1's input is a statement made in chat; Phase 0's entry channel is the CLI | §6, §12, P0-D-2 |
| FR-M1 — diagnostic events | v1's model-call attempts and degraded-mode transitions are removed (no model path); per-whisper injected-token counts are added | §11 |
| FR-M2 — self-detected failures | v1's persistent-model-path-failure class is removed; a suppressing-condition notice is added | §11, P0-D-22 |
| FR-X1 — secret detection | v1 also scans model-call prompts; Phase 0 makes none, so that clause is removed | §10 |
| FR-X2 — repo text is data | v1 permits delimited quotation **or** pointer; Phase 0 makes pointer-only the default and permits quotation only for mechanically-generated content | §10, P0-D-19 |
| FR-X3 — injection-suspect quoting | v1 also bars quoting injection-suspect content into a model-call/judgment prompt; Phase 0 makes no such prompt, so that clause is removed — the same removal §3 records for FR-X1 | §10 |
| FR-X5 — least privilege | v1 permits network for the §6.2 model call and states the oracle never mutates the repo; Phase 0 makes no model call, so network tightens to none at all, and `init`'s settings-file write is the single in-tree write exception (v1 P8) | §10, P0-D-11 |
| FR-X6 — whisper audit trail | v1 logs the evidence used; Phase 0 adds the injected-token count and a read surface | §10, §12, P0-D-21 |
| FR-X7 — store location | v1 says local, no telemetry; Phase 0 states outside the repository tree and no outbound traffic at all | §10, P0-D-11 |
| FR-D3 — warning subtype | v1's narration-invited correction becomes a declarative clause recorded through the CLI; the FR-L3 ladder that consumes it is Phase 2 | §9, §12, P0-D-24 |
| NF-2 — token overhead | On a resumed session the harness's replay of prior injections is reported separately and is not debited against FR-A3's budget for new whispers | §11, P0-D-20 |
| C-1 — cold-container readiness | v1's named satisfying stack is retained as a witness rather than a mandate; three testable runtime properties are added, and the fallback obligation for the day the build-configuration fact changes is retained | §11, P0-D-13 |
| C-2 — warm session state | Teardown on `SessionEnd` is added, with `init` writing an explicit `SessionEnd` timeout because the harness budget is below FR-O3's ceiling | §11 |
| C-4 — explicit init | `init` additionally writes C-2's `SessionEnd` timeout; the settings file is stated as its only tree-touching act | §11 |

**Deferred whole, with the phase that owns each (17).** Phase 1 — FR-A8, FR-A9;
FR-J1–FR-J5; FR-S1–FR-S3. Phase 2 — FR-K9; FR-L2, FR-L3, FR-L4, FR-L5, FR-L7;
FR-M3. Each is the subject of a §2 row; none is dropped from v1.

**Principles.** v1's P1–P9 govern Phase 0 unchanged, **except P2**, whose
worst-outcome clause (*"its worst possible outcome is a wasted sentence"*) is
qualified for stop-delivered whispers by `[OWNER-12]`: such a whisper costs the
agent a turn it was trying to end. P0-3 implements it. P3 (zero ceremony) is
carried as AC-21; P8's in-tree-write exception for `.claude/settings.json` is what
permits C-4's settings write against FR-X5's read-only posture.

## 4. Sources, and how each was confirmed

`RETHINK.md`, the v1 spec and the Claude Code hooks documentation are the primary
sources; the study citations below are inherited from v1 by **source key**, which is
this table's stable pointer into v1's own source table (a v1 line number is not,
because it moves whenever the sibling document is edited).

| Source | Governs | Confirmation |
|---|---|---|
| `RETHINK.md` — §1, §2.3, §4, §5, §6, §11, §12 and addenda (303–399) | The mission; the relevance metric; the knowledge tiers; the attention and delivery posture; the store/daemon/shim split; the owner's locked decisions | Read 2026-08-01; every cited range re-verified against current source |
| `spec-context-oracle.md` (v1) | Requirement identifiers and meanings; principles P1–P9; v1 §12's "Phase 0's bar" (`:895–901`) | Read 2026-08-01 |
| Claude Code hooks documentation (`code.claude.com/docs/en/hooks`) | The observation and delivery interface | String-matched against the raw download; facts below, split by direction. The 242,078-byte figure is the 2026-08-01 snapshot — the contract is versioned and grows, so C-5's re-verification at implementation, not this byte count, is the standing guarantee against drift |
| Zimmermann, Weißgerber, Diehl, Zeller, IEEE TSE 31(6), 2005 `[ROSE-05]` | The co-change evidence floors and part of the mining hygiene | PDF fetched (17 pages), text extracted with two independent engines because one interleaves the two-column layout mid-sentence; every quotation string-matched verbatim |
| Zimmermann & Weißgerber, MSR 2004 `[MSR-04]` | Merge- and bulk-commit exclusion | Carried from v1's source table |
| Hassan & Holt, ICSM 2004 `[HH-04]` | Raw co-change precision 0.06 without pruning; the suggestion-grade floor | Carried from v1's source table |
| Coverity field study `[COVERITY-10]` | That a tool's first reports set its credibility — FR-A7's ground | Carried from v1's source table |
| Herzig & Zeller, tangled changes `[HERZIG-13]` | That co-change edges are never certainties — why FR-D5's ratio is mandatory | Carried from v1's source table |
| Proactive-assistance timing `[CHI-25]` | Task-boundary intervention works; idle-time triggering backfires — FR-O5's ground | Carried from v1's source table |
| Johnson et al., static-analysis adoption `[JOHNSON-13]` | Guidance must carry enough to assess what and why — FR-D1's ground | Carried from v1's source table |
| Sadowski et al., CACM 2018 `[CACM-18]` | Feedback-channel design — a routed, owner-visible correction — grounds FR-D3's false-fire clause | Carried from v1's source table |
| OWASP Top 10 for LLM Applications 2025 — `[LLM01]`, `[LLM02]`, `[OWASP-PI]`, `[OWASP-SM]` | Prompt injection, sensitive-information disclosure, secrets management; least privilege — FR-X1, FR-X2, FR-X5, FR-X8 | Carried from v1's source table |
| Agentic security taxonomy `[ASI-26]` | Memory & context poisoning — FR-K6's trust label, FR-X4, threat T2 | Carried from v1's source table |
| Node.js API docs + nodejs/node source `[NODE]` | `node:sqlite` availability as C-1's witness stack | Carried from v1's source table |

**Hook contract facts this document depends on**, string-matched against the
downloaded reference and **organised by direction** — what the harness hands a
hook, and what the harness does with what a hook returns — because a whisper's
*moment* is a property of the second, and verifying the first exhaustively is not
evidence about the second (`docs/collapse-log.md`, 2026-08-01 round 4).

*What the harness hands a hook (input):*

- **Lifecycle.** Once per session: `SessionStart`, `SessionEnd`. Once per turn:
  `UserPromptSubmit`, `Stop`, `StopFailure`. Per tool call: `PreToolUse`,
  `PostToolUse`. Subagent lifecycle: `SubagentStart`, `SubagentStop`.
- **`Stop` fires "When Claude finishes responding"** — every turn end. `StopFailure`
  fires *"When the turn ends due to an API error. Output and exit code are ignored."*
- **`Stop` and `SubagentStop` carry `last_assistant_message`**, which *"contains the
  text content of Claude's final response, so hooks can access it without parsing the
  transcript file."* The common-input table directs hooks to it explicitly: *"Hooks
  that need the final assistant text of the current turn should use
  `last_assistant_message` on Stop and SubagentStop instead of reading the
  transcript."* This is what lets Phase 0 recognise a completion claim without the
  transcript reader (P0-3). On `StopFailure` the same field name carries the API
  error string, not an assistant message.
- **`UserPromptSubmit` carries the `prompt` field** — *"In addition to the common
  input fields, `UserPromptSubmit` hooks receive the `prompt` field containing the
  text the user submitted."* This is the only harness input orientation reads.
- **`PreToolUse` carries `tool_input`** and **`PostToolUse` the tool result** — the
  pending and completed tool call the consequence and both warning genres read.
- **Hooks run inside subagents.** *"When a subagent calls a tool, tool events such as
  `PreToolUse` and `PostToolUse` fire the same configured hooks as in the main
  conversation,"* with `agent_id` and `agent_type` identifying the subagent. The
  hook contract thus confirms tool hooks fire inside subagents; v1 §14 lists this as
  an open question, which this evidence resolves for Phase 0's purposes.
- **`SessionStart` carries `source`**, one of `"startup"`, `"resume"`, `"clear"`,
  `"compact"` (after compaction), or `"fork"`. The contract pairs two of them:
  *"`SessionStart` hooks run again on resume with `source` set to `"resume"`, or
  `"fork"` if you added `--fork-session`."* Its `SessionEnd` budget *"applies to
  session exit, `/clear`, and switching sessions via interactive `/resume`."*

*What the harness does with what a hook returns (output):*

- **A returned `additionalContext` string is read on the next model request, and
  its position depends on the event.** *"Claude Code wraps the string in a system
  reminder and inserts it into the conversation at the point where the hook fired.
  Claude reads the reminder on the next model request."* Where: for `PreToolUse`,
  `PostToolUse`, `PostToolUseFailure` and `PostToolBatch`, **"next to the tool
  result"**; for `UserPromptSubmit`, "alongside the submitted prompt"; for `Stop` and
  `SubagentStop`, "at the end of the turn." A `PreToolUse` hook *fires* before the
  tool runs — which is what lets the oracle compute against pre-edit state and the
  proposed `tool_input` — but the string it returns is read after the tool has run.
  This is why the three `PreToolUse` genres in §7 deliver post-edit (`[P0-D-26]`).
- **`PreToolUse` may inject context without issuing a permission decision.** Exit
  code 0 with no output *"means the hook has no decision to report, so the tool call
  continues through the normal permission flow"*; *"the hook can deny the call, but
  staying silent doesn't approve it."*
- **`additionalContext` is discarded on a `"defer"` permission decision** — the
  field table: *"Ignored when `permissionDecision` is `"defer"`."* `"defer"` is a
  distinct decision value under which *"The tool doesn't execute."* Phase 0 never
  returns it (FR-O4), so `additionalContext` is always delivered.
- **`Stop` and `SubagentStop` accept `additionalContext`** for *"non-error feedback
  that continues the conversation"* — the continuation cost `[OWNER-12]` ruled on.
- **A hook's `hookSpecificOutput` object carries more than `additionalContext`, and
  the other members act on the agent, not just alongside it.** `PreToolUse` accepts
  `updatedInput`, which *"replaces a tool's arguments before it runs"* / *"Modifies the
  tool's input parameters before execution … Replaces the entire input object"*;
  `PostToolUse` accepts `updatedToolOutput`, which *"replaces the tool's result"* so the
  model reads oracle-authored text as the tool's own output; and both carry
  `permissionDecision`. Phase 0 emits **only** `additionalContext` on every event; every
  other member — `updatedInput`, `updatedToolOutput`, `permissionDecision`, `decision` —
  is structurally absent (FR-O4), because `updatedInput`/`updatedToolOutput` are the
  channels through which the oracle could mutate the agent's action, which the mission
  forbids absolutely.
- **The harness screens injected text.** *"Text framed as out-of-band system commands
  can trigger Claude's prompt-injection defenses, which causes Claude to surface the
  text to you instead of treating it as context."*

*Timeouts (input to the shims' own budget):*

- **Timeouts are per handler type**: 600 s for `command`, `http`, `mcp_tool`; 30 s
  for `prompt`; 60 s for `agent`. `UserPromptSubmit` lowers the first group to 30 s.
- **`SessionEnd` hooks share a 1.5-second budget**; a longer per-hook `timeout`
  raises it up to 60 s — but *"timeouts set on plugin-provided hooks don't raise the
  budget,"* which is why C-4 writes the settings file rather than shipping a plugin.

## 5. Observation

- **FR-O1** — The oracle observes: `SessionStart`; `UserPromptSubmit`; completed read
  and search tool calls; pending edit and write tool calls; completed edit and write
  tool calls; `Stop`; `SubagentStop`; `StopFailure`; and `SessionEnd`. `StopFailure`
  and `SessionEnd` are observation-only. `SessionStart` is observation-only for
  delivery, but its `source` field is load-bearing and Phase 0 handles all five of
  its values: `"startup"` — nothing; `"resume"` and `"fork"` — the delivered-set is
  reseeded from the FR-X6 audit log and the read set reconstructed from the FR-L1
  session log, because the harness replays the prior transcript on resume and a fork
  inherits it, in both cases without re-running the hook for past turns; `"compact"`
  — the read set is cleared, because compaction discards what the agent read;
  `"clear"` — nothing, because C-2's `SessionEnd` teardown has already fired (the
  harness applies its `SessionEnd` budget to `/clear`, §4) so the next session starts
  clean. `[P0-D-20]` `SubagentStop` is observed so FR-O4a's bound and FR-O6's key
  hold on that path; Phase 0 delivers nothing on it. `SessionEnd` is the session
  service's termination signal (C-2). `SubagentStart` is not observed: the consumer
  key is recoverable from `agent_id` on the subagent's own tool events, which FR-O6
  already keys.
- **FR-O2** — Shims contain no decision logic. They forward the event and relay back
  **every** whisper the service returned for that event — one or more — in the order
  the service returned them; the budget is the service's to enforce (FR-A3), not the
  shim's. `[P0-D-27]`
- **FR-O3** — **Fail open, fast.** Any shim or service error, timeout, or missing
  store yields silence, never an error in the agent's flow. The oracle enforces its
  own budget rather than the harness's: added latency p95 ≤ 1.5 s per event, ceiling
  3 s, after which the event resolves to silence and the candidate may carry to the
  next event. `RETHINK.md:179–181`: *"A hook that slows the agent is a gate by
  another name. Answer within ~1–2s or stay silent this round."*
- **FR-O4** — **No deny path and no mutation path exist, structurally.** No shim code
  path can return a blocking or deferring decision — `deny`, `block`, or `"defer"` — nor
  a harness output field that changes the agent's action: not `PreToolUse`'s
  `updatedInput` (which "replaces a tool's arguments before it runs", §4) and not
  `PostToolUse`'s `updatedToolOutput` (which replaces the tool's result). The shims emit
  **only** `additionalContext`; every other `hookSpecificOutput` member is structurally
  absent (§4's output list). `RETHINK.md:314–323`, decision 3; the corollary at
  `:393–399` bars gates in every form. This is what gives FR-X5's *"never mutates the
  repo"* and FR-D2's *"informative, never imperative"* a structural backing rather than a
  promise: the pre-execution channel that could rewrite the agent's edit is closed by
  construction, so T4's mutation cannot be laundered through the agent. Excluding
  `"defer"` also keeps `additionalContext` deliverable, which the harness discards under
  that decision (§4).
- **FR-O4a** — **Continuation is bounded to one per stop.** The oracle emits on `Stop`
  only when `stop_hook_active` is false, extending a turn at most once per stop and
  never chaining, and it never prevents a turn from ending. The same one-per-stop rule
  governs `SubagentStop`, on which Phase 0 emits nothing. `RETHINK.md:363–379` and
  `:393–399`. Independent of the harness's cap value.
- **FR-O5** — The oracle speaks only in response to an observed harness event. No
  timer, no idle detector, no polling loop. `[CHI-25]` measures the reason:
  task-boundary intervention is effective where idle-time triggering backfires. `[P0-D-1]`
- **FR-O6** — Session state is keyed per consumer from the first implementation.
  Where an event carries a consumer identity distinct from the main agent's — which
  tool events inside subagents do, via `agent_id` (§4) — Phase 0 records it and
  delivers nothing against it. Those events are counted separately by P0-4 rather
  than folded into the silence rate. `[P0-D-10]`

## 6. Knowledge

- **FR-K1** — A structural index carrying `RETHINK.md` §4's Tier 2 list (`:130–134`):
  files, symbols, import and reference edges, directory topology, ownership
  boundaries, generated/vendored/build-output zones, entry points, test topology, and
  **build and verification commands per region**. Incremental. Language scope is
  TS/JS/TSX and Python behind a language-agnostic interface (v1 `[D-15]`).
- **FR-K2** — A co-change graph mined from git history at file and symbol
  granularity, refreshed incrementally as history grows. Five mining rules are
  requirements, not options:
  1. **Exclude merge commits** — they duplicate and falsely relate changes
     `[MSR-04]`. Git records merges explicitly, so this is a direct test rather than
     a proxy.
  2. **Exclude transactions above a size cap**, default 30 changed entities.
     `[ROSE-05]`: *"In order to detect coupling within transactions, one must avoid
     the large merge transactions. ROSE does so by ignoring all changes that affect
     more than 30 entities."* In a CVS archive this served as the merge proxy; here
     it is the bulk/bookkeeping-commit filter `[HH-04]`.
  3. **A configurable history horizon** — `[ROSE-05]`: *"ROSE has much outdated
     knowledge—which suggests that ROSE should not learn from too old transactions."*
  4. **Record counts, ratios and recency**; recency *weighting* in ranking is a
     per-project tunable, not hardwired `[HH-04]`.
  5. **Refresh incrementally** as history grows.
- **FR-K3** — *Exemplar registry*: canonical examples of recurring patterns stored as
  pointers to real code, never as extracted abstract rules. The schema exists in
  Phase 0 with its provenance constraints; it has **no Phase 0 writer of any kind** —
  not even FR-L6 promotion — and so ships empty (P0-1). `[RETHINK §4 T1]`
- **FR-K4** — *Landmine records*: revert chains, fix-of-a-fix commits, flaky tests,
  footgun APIs, deprecated-but-present modules, each with the evidence that earned the
  label. The schema exists in Phase 0; its only Phase 0 writer is FR-L6 promotion of
  an owner statement (P0-1), and orientation's landmine arm is the Phase 0 genre that
  reads it (§7). `[RETHINK §4 T1]`
- **FR-K5** — *Invariant records*: cross-file contracts that must change together
  (enum ↔ switch, schema ↔ generated types, config key ↔ reader), with participating
  locations. The schema exists in Phase 0; its only Phase 0 writer is FR-L6 promotion
  of an owner statement (P0-1); no Phase 0 genre reads it, so it ships empty until
  Phase 2 mining populates it. `[RETHINK §4 T1]`
- **FR-K6** — Every record carries provenance — a `file:line` span, a commit hash, a
  dated human statement, or a learned-record reference — and a trust label separating
  repository-derived text from human-stated origin. Records without provenance are
  unrepresentable. `RETHINK.md:77–78` requires the provenance; the trust label
  answers threat T2 (§10), whose mechanism is `[ASI-26]`'s memory-and-context
  poisoning.
- **FR-K7** — Staleness never blocks and never spams: a stale index lowers confidence,
  usually to silence, and triggers background refresh. Predictive power measurably
  decays on outdated history `[ROSE-05]`.
- **FR-K8** — Stores are per-repository (keyed by repository identity) and per-user,
  both outside the repository tree, and team sharing is out of scope.
  `RETHINK.md:330–334`, decision 6.
- **FR-L1** — The session service logs, per event, the candidates considered, the
  whisper sent if any, and subsequent evidence that the agent acted on it. Phase 0
  records the evidence and makes no uptake judgment (`[P0-D-12]`); AC-29 checks the
  record exists and is readable.
- **FR-L6** — Human statements are recorded as facts with human provenance, with no
  override ritual. Their Phase 0 entry channel is the CLI (§12), and orientation's
  landmine arm is the Phase 0 genre that reads what they write (§7). `[P0-D-2]`
- **P0-1** — The FR-K3 exemplar, FR-K4 landmine and FR-K5 invariant schemas, and the
  recipe record FR-L2 produces, exist in Phase 0 with their provenance constraints.
  FR-L6 promotion is Phase 0's only writer, and it writes landmines and invariants
  only — FR-K3 exemplars have no Phase 0 writer at all. Literal-match landmine
  detection is a read over indexed content and over promoted records, which is what
  orientation's landmine arm uses. A schema with no writer ships empty rather than
  becoming a later migration. `[P0-D-3]`

## 7. What Phase 0 says

- **FR-A2** — Six of the twelve genres v1 FR-A2 defines are built in Phase 0 (the
  table below). Six are deferred and several arms narrowed per §2; the stop-class
  genres' trigger is narrowed from v1's every-stop to a completion-claim stop (P0-3).

| Genre | Fires on | Channel | Content | Evidence |
|---|---|---|---|---|
| **Orientation** | prompt submitted | `UserPromptSubmit` | 2–4 **structural** entry points whose indexed names lexically match the prompt, plus any promoted landmine matching the task shape; ≤ 400 tokens | index entry points; promoted FR-K4 records |
| **Coupling** | file read / symbol searched | `PostToolUse` | strongest co-change partners with the evidence ratio | co-change graph |
| **Consequence** | edit or write pending | `PreToolUse` | call-site count and spread for the thing being changed | reference edges |
| **Warning ⚠ (generated)** | edit pending in a generated zone | `PreToolUse` | that the file is build output, the evidence, what overwrites it, where the editable source is | zone classification and its captured evidence |
| **Warning ⚠ (vendored)** | edit pending in a vendored zone | `PreToolUse` | that the file is vendored third-party code, the evidence, and that the edit is lost at the next dependency update — there is no editable source in-tree | zone classification and its captured evidence |
| **Completeness** | edit completed, or completion-claim stop | `PostToolUse` / `Stop` | the co-change partner not yet touched | co-change graph |
| **Verification** | completion-claim stop | `Stop` | the verification command for the changed region | per-region verification commands |

Orientation's entry-point arm is v1 FR-J3's model-free formulation — *"structural
entry points … no model intent inference"* — realised as a lexical match of the
prompt's terms against indexed symbol, file and directory names, ranked by structural
weight. Its **marginal value over the agent's own `Glob`/`Grep` (`RETHINK.md:53–60`)
is the entry-point classification and the structural ranking, not the name match**:
the index knows which of the matched names are entry points and how they rank
structurally, which a cold name-match does not produce. A prompt matching nothing
yields silence, not the repository's default entry points (AC-9).
`[P0-D-17]`

**Consequence and both warning arms fire on a pending edit** (`PreToolUse`), which
lets the oracle compute against pre-edit state and the proposed `tool_input`, and
requires injecting context without issuing a permission decision (FR-O4). The string
they return is read on the next model request, next to the tool result (§4) —
**after the edit has run**. Phase 0 accepts this delivery position because none of
the three guards against anything irreversible: an edit to build output or vendored
code is futile rather than destructive, and consequence reports call sites rather
than damage. The whisper still reaches the agent before its *next* action, so it lets
the agent undo the one edit it triggered on and stops the waste from compounding; and
the only mechanism that shows anything *before* a tool runs is the permission prompt,
the gate `[OWNER-3]` rules out. This is the ceiling of what a non-blocking tool can do
on an edit. `[P0-D-26]`

**More than one genre can fire at a single event.** At a stop, completeness and
verification can both have a candidate; at a `PreToolUse` edit in a generated or
vendored zone, a warning candidate and a consequence candidate can both arise. FR-A3's
per-event limit is a token budget, not a count (`[P0-D-27]`), so when each independently
clears the bar and both fit the session budget **both are delivered** — a
generated-file warning and a call-site consequence at the same edit go together, and no
genre has to be sacrificed to the other. The `[OWNER-3]` generated-file protection is
therefore not displaced by a competing consequence; nothing has to be ranked above
anything. In Phase 0 the per-trigger cap defaults to the session cap (`[P0-D-28]`), so
the case where a per-event cap cannot hold everything that cleared the bar does not
arise, and the score-ordering that would resolve it is deferred to Phase 1; P0-4's
per-genre delivered count is what will tell Phase 1 whether any channel is being crowded
out and whether a tighter per-trigger cap is warranted. Verification fires only at a
completion-claim stop, so its larger exposure is not competition but every stop the
completion-claim test does not match (P0-3), which P0-4 counts.

## 8. When Phase 0 speaks

- **FR-A1** — Per event the oracle answers internally: given what the agent is doing
  now, do I know something it almost certainly does not that would change what it does
  next? Default answer no → silence. `RETHINK.md:169–171`.
- **FR-A3** — **Per-trigger and per-session injected-token budgets, both hard caps.**
  The owner's decision is `RETHINK.md:175–176`, *"Per-trigger and per-session whisper
  budgets. Hard caps."* — that both budgets exist and are hard caps; the token
  denomination is this document's, derived in `[P0-D-28]`. The per-session default is
  2,000 tokens, configurable, and orientation counts against it; the 2,000 is v1
  `[D-10]`, derived there as roughly five orientation-size whispers at the owner's
  ~400-token orientation bound — so changing the orientation cap changes this number's
  meaning. **The per-event limit is a token budget, not a count of one**: every whisper
  that independently clears the bar at a single event and fits the budget is delivered
  (`[P0-D-27]`). Phase 0 sets **no separate per-trigger number** — the per-trigger cap
  defaults to the session cap (`[P0-D-28]`), so within a session only the 2,000-token
  cap binds; a tighter per-trigger cap is deferred to Phase 1, and the value it would
  take is precisely what the Phase 0 exit-run data (P0-4's per-genre delivered counts)
  exists to inform. In practice the high bar (FR-A5) and dedup (FR-A4) leave at most one
  whisper at most events; the multiple-whisper case is the genuinely material collision
  — e.g. a generated-file warning and a call-site consequence at the same edit, both
  delivered. v1's warning-priority clause is deliberately not carried.
  `[P0-D-4]` `[P0-D-15]`
- **FR-A4** — Never tell the agent what it has already seen (`RETHINK.md:138`), been
  told, or visibly incorporated (`:177–178`); orientation candidates decay out of
  consideration once the agent is deep in the task (`:175–176`). This rests on two
  sets — the **delivered-set** (what the agent was told) and the **read set** (what it
  has read) — and both are restored across a session boundary the harness crosses
  without a context boundary: on `"resume"`/`"fork"` the delivered-set is reseeded from
  the audit log and the read set reconstructed from the FR-L1 log, and on `"compact"`
  the read set is cleared because the agent's context no longer holds what it read (§4,
  FR-O1). `[P0-D-20]`
- **FR-A5** — Each candidate carries **confidence × decision-impact × marginal
  value**, and that score decides whether the candidate clears the bar. **Every
  candidate that clears the bar is spoken**, bounded only by FR-A3's session token
  budget (`[P0-D-27]`); v1's *"only the top candidate above the bar is spoken"* was the
  unsourced single-whisper rule and is not carried. Ranking above-bar candidates
  against one another would matter only if a per-trigger cap could not hold them all —
  which does not arise in Phase 0, where the per-trigger cap defaults to the session
  budget (FR-A3, `[P0-D-28]`), so that ordering is deferred to Phase 1 with the rest of
  per-event budget tuning. All three terms are computable without a model, per v1 §12's
  "Phase 0's bar"
  (`spec-context-oracle.md:895–901`): decision-impact decomposes into `materiality`,
  which falls back to the genre's base weight for mechanical genres, and
  `structural_weight`, which is deterministic and computed from **per-candidate
  properties only — edit-vs-read, blast radius, and zone — carrying no genre term**;
  marginal value is v1's `self_serve_cost`, which *"derives from provenance class and
  what the consumer has already done"*, renamed here to match `RETHINK.md:59–61`.
  Every Phase 0 genre is mechanical, so **all base weights are equal and
  decision-impact reduces to structural weight** — and because structural weight
  carries no genre term either, the bar encodes no genre precedence anywhere.
  `[P0-D-18]` The bar ships high (`RETHINK.md:198–199`) and is configurable.
  `[P0-D-6]` `[P0-D-16]`
- **P0-5** — **Warn-grade evidence floor.** A ⚠ whisper on history-derived evidence
  requires co-change support ≥ 3 **and** confidence ≥ 0.9. `[ROSE-05]` sets that
  operating point: *"ROSE is set up to issue warnings only if the high confidence
  threshold of 0.9 is exceeded. Still, we wanted to get as many missing items as
  possible, resulting in a support count threshold of 3."* Its benefits there are
  precision — *"The average precision is above 66 percent"* — and, in a separate
  evaluation over complete transactions, *"Only 2 percent of all transactions cause a
  false alarm."* **Its cost is coverage, not quality**: at the same operating point
  *"The feedback is 3 percent and the average recall is about 75 percent,"* meaning
  one warning per 33 missing items, so *"the percentage of missed alarms is on average
  97 percent"* — while *"for those cases where ROSE issues a warning, it predicts 75
  percent of the items that are actually missing."* The channel fires rarely and is
  thorough when it fires; §14's exit measures that yield rather than assuming it.
  Suggestion-grade coupling may run looser but never below **support ≥ 2 together
  with a configured confidence threshold** — both dimensions, because raw co-change
  association is ~6% precise without pruning `[HH-04]` and `[ROSE-05]` measured
  *"a feedback of 0.64 and a precision of 0.30"* at support 1 **and confidence 0.1**,
  which bounds that pair jointly and not support alone.
- **P0-6** — Both warning arms in §7 are exempt from P0-5's floors. Their evidence is
  a zone marker, not history, and a zone marker generates no co-change support at all.
  `[P0-D-5]`
- **FR-A6** — **Evidence-corpus floors.** Two, because a thin corpus and a thin region
  silence for different reasons: history-backed genres stay silent below 200 mined
  transactions corpus-wide, and stay silent for a region below 20 mined transactions
  touching it. Both configurable. Separate from P0-5, which is computed per pair and
  cannot express thinness. `[P0-D-7]`
- **FR-A7** — **First impressions.** In a project's first 3 sessions (configurable),
  only the highest-confidence candidates speak: the generated and vendored warnings,
  whose evidence is a zone marker; coupling **at the P0-5 warn-grade floor** rather
  than the looser suggestion grade; and **orientation's landmine arm, whose evidence
  is an owner statement** and which fires only on an explicit task-shape match the owner
  authored. `[COVERITY-10]` is the ground — a tool's first reports set its credibility —
  and that risk lives in the *relevance of what fires*, so what admits the landmine arm
  is that it fires only when a promoted owner record matches the task shape: a relevant
  first report by construction, not a loose guess. (The record's high trust answers a
  different objection — is the fact credible — not `[COVERITY-10]`'s, which is whether the
  first *report* is.) Orientation's *entry-point* arm — a lexical match of the same class
  but without the owner's authored task binding — and the other genres stay silent in the
  window. `[P0-D-4]` `[P0-D-8]`
- **P0-2** — Phase 0 ships the bar with no degraded-mode delta and issues no
  degraded-mode notice. v1 §12 states the reason: the raised-bar delta belongs to
  degraded mode, *"which compensates for a lost intent signal; Phase 0 has not lost
  one."*
- **P0-3** — **Stop-grade whispers, and the moment Phase 0 speaks at.** `Stop` fires
  whenever Claude finishes responding (§4), not only when an agent claims completion —
  but the harness hands the hook `last_assistant_message`, the text of that response,
  *"without parsing the transcript file."* Phase 0 therefore recognises a completion
  claim: a literal/lexical test over that field against a configured set of
  completion-indicating patterns — the same class of mechanism P0-1 ships for
  landmines. The specific pattern set is the architect's, bounded below by
  `[P0-D-23]`'s false-positive cap; stating the mechanism's class here, rather than
  leaving the whole test to the architect, is what keeps it from being an unfilled
  requirement wearing a reference (the P0-D-17 standard). `[OWNER-12]`'s capability is
  implemented at the moment the owner ruled on, not at every turn boundary.
  - A stop-grade whisper — completeness or verification — fires only at a stop whose
    `last_assistant_message` matches the completion-claim test. This gates *stop*
    delivery on the claim, and is the FR-A2 trigger narrowing §3 records: it is a
    discriminator for a real stopping point, not a ranking of this moment above the
    others (`[OWNER-12]` is explicit that it is *not* such a ranking). The mission-need
    the gate serves is **reservation**: the 3 scarce stop-continuations below must be
    spent on completion claims, not exhausted by a run of mid-task stops early in a
    session that would starve the `[OWNER-12]` must-have when it finally arrives. (The
    per-stop and per-session caps already bound *volume*; the gate is what protects the
    must-have from *starvation*, which the caps alone do not.)
  - It must clear the ordinary bar plus a configured delta, **defaulting to zero** —
    no raised bar until measurement licenses one.
  - At most **3 stop-grade whispers per session** (configurable). This bounds the
    lexical test's false positives, not recognition itself. `[P0-D-9]` `[P0-D-23]`
  - Each delivery is recorded as a continuation event; each candidate a non-zero delta
    suppresses is recorded; and each stop where the test did not match is counted, so
    the owner sees what the capability cost, what it withheld, and how often it
    declined to fire. A non-matching count cannot by itself separate a correct
    non-match from a **missed** claim — a genuine completion the pattern set failed to
    recognise, which silences the `[OWNER-12]` moment. AC-12 fixtures the positive case
    and the *true*-negative case (a stop that is genuinely not a completion), and
    requires the exit run to report the pattern set's miss rate against a labelled
    corpus of completion phrasings, so the false-negative rate is measured rather than
    assumed (the P0-D-17 standard for a test whose pattern set is the architect's).

## 9. Delivery

- **FR-D1** — Whisper format: `[oracle]` prefix (`RETHINK.md:195`), a claim of one to
  five sentences with at least one verifiable pointer (`:187–188`), a confidence tag
  when confidence is not high (`:196–197`), a genre tag, and optionally a one-line "so
  what". The claim must carry enough for the reader to assess what the problem is and
  why `[JOHNSON-13]`. Every emitted whisper parses to this format and every pointer
  resolves (AC-31).
- **FR-D2** — Informative, never imperative: facts and consequences, never commands.
  This keeps the agent the decision-maker (`RETHINK.md:190`). The harness supplies a
  mechanical reason as well: text framed as out-of-band system commands can trigger
  its prompt-injection defences and be surfaced to the user instead of delivered as
  context (§4). `[LLM01]`
- **FR-D3** — Warning subtype: ⚠ marker, the mechanical evidence, the concrete
  consequence for that zone type (§7), and a **declarative** false-fire clause — a
  statement that the warning may be wrong and that `ctxoracle` records corrections,
  not an instruction to the agent, so FR-D2 holds (AC-7, AC-31). Its receiver in
  Phase 0 is the CLI (§12); the automated demotion ladder that consumes corrections is
  FR-L3, Phase 2. `[CACM-18]` `[P0-D-24]` Never a block. `RETHINK.md:314–323`.
- **FR-D4** — The only agent-facing channel is hook context injection. Human notices
  use the human-visible channel and never consume agent context.
- **FR-D5** — Co-change claims always state their evidence ratio, never as certainty:
  up to 15% of fixes are tangled, so a co-change edge is never a certainty
  `[HERZIG-13]`.

## 10. Threat model and security

Phase 0 reads repository text and git history, persists them, and injects derived
text into an autonomous agent's context. That is its entire attack surface. It makes
no model call, so threats concerning model-call prompts and credential handling do not
arise here; they return with Phase 1.

**T1 — Indirect prompt injection through repository text.** *Attacker*: anyone who can
land text in the repository or its history. *Target*: the agent's behaviour. *Path*:
imperative text in a comment, commit message, filename or generated-file header is
mined and injected, where it reads as instruction. *Cost*: the agent acts on an
instruction the owner never gave, with the oracle's credibility behind it.
`[LLM01]` `[OWASP-PI]`

**T2 — Store poisoning.** *Attacker*: the T1 population, plus anything able to write
the store path. *Target*: the persisted knowledge. *Path*: repository-derived text is
stored without a trust label and later treated as though a human asserted it. *Cost*:
a poisoned fact outlives its session and is delivered with unearned authority — the
memory-and-context-poisoning class `[ASI-26]`. FR-K6's trust label is the control.

**T3 — Secret capture.** No attacker required. *Target*: credentials in tracked files
or git history. *Path*: the indexer or miner ingests a key, which lands in a store, a
log, or a whisper. *Cost*: a secret is copied into a store the owner does not think of
as sensitive. `[LLM02]` `[OWASP-SM]`

**T4 — Overreach by the oracle's own process.** No attacker required. *Target*: the
repository and the network. *Path*: a component writes inside the repository tree or
opens a connection. *Cost*: the tool that promised it never mutates the repository does
so — the failure that ends trust outright. `RETHINK.md:321–323`.

- **FR-X1** (T3) — Secret detection runs on all text before it enters a store, a log,
  or a whisper; matches are redacted or masked, never stored or emitted in plaintext.
  `[OWASP-SM]` `[LLM02]`
- **FR-X2** (T1) — Repository-derived text is data, never instruction: whispers are
  produced from a fixed schema validated by deterministic code. **Pointer-only is the
  default for every repository-derived span**, with inline quotation permitted only
  for mechanically-generated content. The ground is `[OWASP-PI]`'s segregation of
  external content; the harness's own screening is a second, independent reason to
  prefer pointers — it warns that text framed as out-of-band *system commands* is
  surfaced to the user rather than delivered, which is a risk for relayed imperative
  text specifically, not for quotation as such. `[P0-D-19]`
- **FR-X3** (T1) — Content flagged injection-suspect at index time is referenced by
  pointer only, never quoted. `[LLM01]`
- **FR-X4** (T2) — Records preserve trust origin through every pipeline stage: a
  learned record derived from repository text cannot acquire human or mechanical
  provenance, and whispers built on untrusted-origin records obey FR-X2/FR-X3 exactly
  as live repository text does. `[ASI-26]`
- **FR-X5** (T4) — Least privilege `[LLM01]`: read-only repository access
  (`RETHINK.md:321–323`), no tool-invocation authority in the agent's session, and —
  Phase 0 having no model call — no network access at all. The single write exception
  is `init`'s harness settings file, which v1 P8's explicit in-tree-write exception for
  `.claude/settings.json` permits and C-4 bounds. `[P0-D-11]`
- **FR-X6** (T1, T2, oversight) — Every whisper is logged with the evidence it used
  and its injected-token count, and the log has a read surface (§12) so the owner's
  after-the-fact audit is something he can actually perform. `[P0-D-21]`
- **FR-X7** (T3) — Both stores live outside the repository tree and the oracle emits
  no outbound traffic. `RETHINK.md:330–334` establishes the location and the solo
  scope; the no-traffic property is this document's. `[P0-D-11]`
- **FR-X8** (T1, T2) — The test suite includes adversarial fixtures: injection payloads
  in code comments, commit messages and file content, asserting no whisper relays or
  obeys them. `[OWASP-PI]`

## 11. Self-observability, qualities, constraints

The owner cannot be the failure detector. `RETHINK.md:350–354`, decision 10: *"it
could fail a hundred ways in front of me and I wouldn't know."*

- **FR-M1** — Every component emits structured diagnostic events to a local diagnostic
  log, separate from the whisper audit log: hook invocations with latency and outcome,
  store read/write failures, index refresh runs, delivery results, and per-whisper
  injected-token counts.
- **FR-M2** — The oracle detects its own failure classes from that log without human
  observation: hooks not firing, latency breaches, store corruption, index staleness,
  and whispers produced but not delivered. v1's model-path-failure class does not apply.
  Separately, a session that ends with a **suppressing condition** active — below
  FR-A6's corpus or region floor, inside FR-A7's first-sessions window, the session's
  FR-A3 budget spent, or every candidate below the bar — reports that on the human
  channel per FR-D4, because correct silence and a broken oracle are indistinguishable
  to the owner otherwise and `[OWNER-10]` requires detection *"without depending on the
  owner noticing anything."* `[P0-D-22]` `ctxoracle status` surfaces health and
  anomalies in language a non-programmer can read.
- **FR-M4** — Diagnostics never touch agent context and never leave the machine; a
  broken oracle degrades to silence in the agent's session (FR-O3) while saying exactly
  what broke on its own channel.
- **P0-4** — `ctxoracle status` computes and reports, from those logs: the **whisper
  count**; the silence rate, **decomposed by suppressor** — events with no candidate,
  candidates the agent could self-serve because it had **already seen** the fact (FR-A4;
  the `RETHINK.md:53–60` marginal-value signal that measures whether the oracle competes
  with the agent's own grep/glob, which §1 says the run exists to learn), candidates
  suppressed as **already told or visibly incorporated** (FR-A4 dedup — a distinct
  signal), candidates below FR-A6's corpus or region floor, candidates inside FR-A7's
  first-sessions window, candidates suppressed because FR-A3's budget was spent,
  candidates below the bar, and events on a consumer Phase 0 does not deliver to (FR-O6);
  the added-latency
  distribution against FR-O3; the continuation count and the count of stops where the
  completion-claim test did not match; the count of candidates a non-zero stop-bar
  delta suppressed; the session injected-token total against FR-A3's budget; and the
  delivered count per genre. `[P0-D-12]`

- **NF-1** — Hook-added latency per FR-O3: p95 ≤ 1.5 s, ceiling 3 s, then silence.
- **NF-2** — Session token overhead stays within FR-A3's budget for whispers newly
  injected this session, is recorded per FR-M1 and FR-X6, and is reported by `ctxoracle
  status`. On a resumed session `status` additionally reports the harness's replay of
  prior injections as a separate figure; the replay is context the agent already
  carries, already counted when first sent, and is **not** debited against FR-A3's
  budget for new whispers (FR-O1, `[P0-D-20]`), so successive resumes do not ratchet
  the budget toward permanent silence.
- **NF-3** — Indexing is incremental after first build, and first build on a mid-size
  repository requires no network access beyond what the harness already has.

- **C-1** — **Cold-container ready.** Installation requires no native toolchain and no
  prebuilt-binary download, and uses no network beyond the harness's. The running
  oracle — indexing included — opens no connection at all (FR-X5). A satisfying stack
  exists as a witness, not a mandate: Node ≥ 22.13.0 with built-in `node:sqlite`
  `[NODE]`. v1 records that FTS5's presence on both LTS lines is a build-configuration
  fact rather than a documented API contract, so implementation **verifies it by
  execution** on the target runtime rather than by reading documentation that does not
  state it — and the architecture must retain a fallback path for the day that fact
  changes, which AC-32 detects. `[P0-D-13]` `[P0-D-25]`
- **C-2** — Session state persists warm across hook invocations with sub-second access,
  and is torn down on `SessionEnd`; cold-starting per event cannot meet NF-1. Because
  `SessionEnd` hooks share a 1.5-second budget by default (§4), below FR-O3's ceiling,
  `ctxoracle init` writes an explicit `SessionEnd` `timeout` into the harness settings
  file — as a settings-file hook, not a plugin hook, because plugin timeouts do not
  raise the budget.
- **C-3** — Harness-specific knowledge lives in the shims, and the service speaks a
  harness-neutral event contract — the property that keeps subagent and other-harness
  support open. `RETHINK.md §11` (the store/daemon/shim sketch as a whole; the
  harness-neutral event contract is this document's inference from it, not a line it
  states).
- **C-4** — `ctxoracle init` is explicit and minimal: it wires the hooks, writes C-2's
  `SessionEnd` timeout, and creates the out-of-tree store, and nothing else. The
  harness settings file is its only tree-touching act (v1 P8). `deinit` removes the
  wiring cleanly and restores the settings file to its pre-init state. Passive
  auto-bootstrap into a project tree is prohibited.
- **C-5** — The hooks contract is version-bound. Implementation re-verifies it, and
  shims degrade to silence on any drift they detect.

## 12. External interfaces

**Consumed**: the Claude Code hooks interface — the events in FR-O1; the inputs
identifying the session and the consumer; `UserPromptSubmit`'s `prompt` field (which
orientation reads), `PreToolUse`'s `tool_input` and `PostToolUse`'s tool result (which
consequence and the warnings read); `last_assistant_message` on the stop events;
`SessionStart`'s `source`; and the output discipline in FR-O4.

**Provided**: `ctxoracle init`, `index`, `status`, `deinit`; the command by which a
human statement becomes a fact (FR-L6); the command by which a false fire is recorded
against a delivered whisper (FR-D3); and `ctxoracle log`, which reads back the FR-X6
audit trail — every whisper with its evidence, its pointer and its token count — so
the owner's audit in §1 has a surface. `status` reports aggregates; `log` shows the
individual whispers.

**Nothing else.** Phase 0 opens no network connection (FR-X5).

## 13. Decisions made in this spec

- **P0-D-1 — FR-O5 is stated rather than inferred from FR-O1's list.** Some of FR-O1's
  events are observation-only, so the list does not by itself forbid a timer, and
  Phase 0 is the first phase with a warm background service. The substantive ground is
  `[CHI-25]`'s measured result that task-boundary intervention works where idle-time
  triggering backfires; `RETHINK.md` §5's attention model admits only triggers that
  respond to something the agent did.
- **P0-D-2 — Human facts enter Phase 0 through the CLI.** FR-L6's v1 input is a
  statement made in chat, and the chat reader is Phase 1. FR-L6 stays in force because
  orientation's landmine arm reads what it writes; a writer with no reader would be a
  CLI command whose output nothing consumes.
- **P0-D-3 — Schemas Phase 0 cannot populate automatically are created in Phase 0**, so
  the store is not a throwaway and Phase 2 mining lands without a migration.
- **P0-D-4 — Which stated values are v1's and which are this document's.** Carried from
  v1 unchanged: FR-A3's 2,000-token budget is **v1 `[D-10]`**, with its derivation
  (2,000 ≈ five orientation-size whispers at the ~400-token orientation bound, so the
  two numbers move together); AC-2's 10% ceiling is a v1 convention (`[P0-D-14]`);
  FR-K2's 30-entity cap and P0-5's support-3/confidence-0.9 pair are `[ROSE-05]`'s.
  **This document's own** judgments, of the same class — stated because without values
  the corresponding requirement is untestable, and expected to move once §14's exit run
  reports its yield — are FR-A6's two floors, FR-A7's 3-session count, and **P0-3's
  3-per-session stop-grade cap** (`[P0-D-23]`).
- **P0-D-5 — Both warning arms are exempt from the co-change floors**, which are the
  operating point of a study of history-derived rules. A zone classification is
  evidenced by a marker and generates no co-change support, so under P0-5 it could never
  clear warn-grade — the exemption is what makes the genre speakable at all.
- **P0-D-6 — FR-A5's three-term product is v1's, not this document's.** v1 FR-A5 states
  two terms, but v1 §12's "Phase 0's bar" (`spec-context-oracle.md:895–901`) already
  binds Phase 0 to three and names each term's model-free computation. This document
  adopts that decomposition and renames `self_serve_cost` to marginal value to match
  `RETHINK.md:59–61`.
- **P0-D-7 — Two corpus floors, separate from the evidence floor.** P0-5 is evaluated
  per pair, and a thin corpus produces pairs with high support and perfect confidence.
  Corpus-level and region-level thinness are different conditions — a mature repository
  with one new directory fails the region test and passes the corpus test — so both are
  stated with values.
- **P0-D-8 — FR-A7's Phase 0 set is coupling at the warn-grade floor, plus the marker-
  and owner-evidenced arms — not coupling generally.** v1 FR-A7 admits only the
  highest-confidence genres on `[COVERITY-10]`'s ground that early reports set
  credibility. Admitting suggestion-grade coupling would make the loosest evidence in
  the system the first thing a project hears, which the ground forbids. That same ground
  is about loose evidence, so it does **not** exclude the two zone warnings (marker
  evidence). It also does not exclude orientation's landmine arm — but the ground for
  admitting that arm is **firing relevance, not record trust**. `[COVERITY-10]`'s risk is
  that the first *reports* be credible, which is a property of what fires, not of what is
  stored; the landmine arm earns admission because it fires only on an explicit task-shape
  match the owner authored, so when it fires early it is relevant by construction rather
  than a loose guess. (The record's high trust is real but answers the different question
  of whether the fact is credible; conflating the two — as an earlier draft did — would
  admit a high-trust fact that could still fire irrelevantly in session 1, the exact
  first-impression hit the ground warns of.) Withholding an owner's own *relevant* words
  for three sessions would be the opposite of a good first impression, which is why the
  relevance-gated arm is admitted rather than withheld. AC-13 tests the gate: the arm
  fires on a matching prompt and stays silent on a non-matching one within the window.
  AC-33 exists because P0-5's 3% feedback and FR-A6's floors compound toward silence on
  exactly the run that certifies Phase 0.
- **P0-D-9 — The stop-bar delta defaults to zero.** A distribution-relative default is
  uncomputable on the first run, which is the run Phase 0 exists to perform, so the delta
  ships at zero and moves on measurement.
- **P0-D-10 — Per-consumer keying is adopted in Phase 0 although delivery is not.**
  Decision 8 (`RETHINK.md:342–344`) puts subagent delivery in v1 scope without saying
  when state must become per-consumer; keying it now is this document's, because session
  state is the one structure a later phase cannot re-key without rewriting every reader.
- **P0-D-11 — FR-X5's network and tool-authority clauses and FR-X7's no-outbound-traffic
  property are grounded in `[LLM01]`, not in `RETHINK.md`.** `RETHINK.md:321–323`
  supports read-only repository access only; `:330–334` fixes where stores live and does
  not address telemetry.
- **P0-D-12 — Phase 0's measurement obligation is what P0-4 enumerates**, computed from
  its own logs. A hit rate additionally requires resolving uptake evidence into an uptake
  judgment; FR-L1 fixes only that the evidence is recorded, and AC-29 checks it.
- **P0-D-13 — C-1's three cold-container properties are this document's; the witness
  stack is v1's.** Decision 4 requires sandbox compatibility and names no runtime
  property. The three properties are what make "runs in a cold container" testable
  (AC-32); v1's named stack is retained so the constraint is not an existence claim with
  no witness.
- **P0-D-14 — AC-2's 10% ceiling is a judgment.** No published figure maps to per-event
  whisper rates for an agent consumer.
- **P0-D-15 — FR-A3's v1 warning-priority clause is deleted, not annotated.** v1 carries
  *"warnings get priority within the budget"* with no source; `RETHINK.md` contains no
  ranking of genres against each other, and the standing directive is that no ranking
  claim enters any document unless the owner stated it in those words. A prior round
  kept the clause and disclosed it, which left a requirement asserting a precedence that
  §7 and this entry both deny — and an implementer builds to the requirement. The ranking
  function is FR-A5's three-term score, per candidate, at runtime. AC-28 tests the half
  that does follow from the budget being hard: once it is spent, nothing further is
  delivered, including a warning.
- **P0-D-16 — The bar's shipping scalar and the score scheme's internals are the
  architect's.** FR-A5 fixes the three factors, their model-free computability, that the
  bar ships high and is configurable, and that structural weight carries no genre term;
  the numeric threshold is meaningless until the scoring scheme exists.
- **P0-D-17 — Orientation's entry-point arm is v1 FR-J3's structural formulation.** v1
  records the model-free orientation whisper as *"structural entry points … no model
  intent inference"*. Entry points selected *for the task* would require intent
  inference, which §2 defers. The Phase 0 mechanism is a lexical match of the prompt's
  terms against indexed names ranked by structural weight — the same class of mechanism
  P0-1 specifies for landmines — and it is stated because a genre whose computation is
  left to the architect is an unfilled requirement wearing a reference to the index. Its
  marginal value over the agent's own tools is the entry-point classification and the
  structural ranking, not the name match, which is why AC-9 tests that a non-entry-point
  name of equal lexical score does not displace an entry point.
- **P0-D-18 — All Phase 0 genres carry equal base weight, and structural weight carries
  no genre term.** v1's `materiality` falls back to a genre base weight for mechanical
  genres, and every Phase 0 genre is mechanical, so unequal base weights would install a
  fixed genre precedence inside the bar — precisely what §7 and P0-D-15 say does not
  exist. Equal weights make decision-impact reduce to structural weight; and structural
  weight is computed from per-candidate properties only — edit-vs-read, blast radius,
  zone — so no genre term survives one term over either. (The retained 2026-07-22
  architecture, kept as input to Phase 1, defines `structural_weight` with a genre
  factor; that definition is **not** inherited here — `docs/collapse-log.md`,
  2026-07-22.) No genre term is needed to protect the `[OWNER-3]` generated-file warning
  at a contested edit, because FR-A3's per-event limit is a token budget, not a count
  (`[P0-D-27]`): the warning and a competing consequence are both delivered when both
  clear the bar and fit the budget, so nothing has to be ranked above anything. Score
  ordering among above-bar candidates would matter only under a tight per-trigger cap,
  which Phase 0 does not have (`[P0-D-28]`); P0-4's per-genre delivered count monitors
  whether any channel is being crowded out — the data Phase 1 needs to decide that cap.
- **P0-D-19 — Pointer-only is FR-X2's default on `[OWASP-PI]`'s ground, not the
  harness's.** The harness warns that text framed as out-of-band *system commands* is
  surfaced to the user rather than delivered; that is a hazard for relayed imperative
  text, not for delimited quotation as such. The tightening past v1 stands on external-
  content segregation, with the harness behaviour as a second reason to prefer pointers.
- **P0-D-20 — Session boundaries are not context boundaries, and FR-A4 accounts for
  both of its sets across all five `source` values.** The harness replays past injected
  text on `--resume` and a `--fork-session` inherits the parent transcript, in both
  cases without re-running the hook, so a session that starts with `source: "resume"` or
  `"fork"` begins with the prior session's whispers already in the agent's context and
  its earlier reads in the restored transcript; the delivered-set is therefore reseeded
  from the audit log and the read set reconstructed from the FR-L1 log. A `"compact"`
  discards what the agent read, so the read set is cleared — otherwise the dedup
  suppresses exactly the facts most worth re-delivering. `"clear"` needs nothing because
  C-2's `SessionEnd` teardown has already fired (the harness applies its `SessionEnd`
  budget to `/clear`), and `"startup"` starts clean. The replayed tokens are reported in
  NF-2 for observability but are not charged against FR-A3's new-whisper budget. The
  budget exists to bound the oracle's *attention* cost (`RETHINK.md` §5), and the replay
  adds no *new* oracle attention: because the delivered-set is reseeded on resume, dedup
  guarantees no whisper is re-injected, so the per-session net-new stays capped at the
  2,000-token budget. Charging the replay too would double-count context the agent
  already carries and ratchet a long resume chain into permanent silence while measuring
  as healthy — the 2026-07-22 collapse the log records.
- **P0-D-21 — The audit trail gets a read surface.** §1 makes the owner's after-the-fact
  audit a consumer requirement; `status` reports aggregates only, so without `ctxoracle
  log` the trail exists and nothing can read it. Phase 0 shipping an unreadable audit
  trail would be a choice, and it is not the one taken.
- **P0-D-22 — Correct silence is announced.** FR-M2 detects failures; being below a
  corpus floor, inside the first-sessions window, out of budget, or above the bar on
  every candidate are not failures, but they are indistinguishable to the owner from a
  broken oracle, and `status` is a pull surface that depends on him thinking to look. A
  session ending with a suppressing condition active says so on the human channel.
- **P0-D-23 — The per-session cap on stop-grade whispers bounds a lexical test's false
  positives.** With `last_assistant_message` available, Phase 0 recognises completion
  claims rather than guessing, so the cap is no longer a stand-in for recognition. A
  lexical test still over-fires, and `[OWNER-12]`'s accepted cost is per stop while a
  session has as many stops as turns, so a session-level bound remains — now on a stated
  reason rather than on blindness. The value 3 is a judgment of this document's class
  (P0-D-4), expected to move on §14's exit-run data.
- **P0-D-24 — FR-D3's false-fire clause is declarative and its Phase 0 receiver is the
  CLI.** An imperative invitation would violate FR-D2 and risk the harness's screening;
  and the automated demotion ladder that consumes corrections is FR-L3, Phase 2. Phase 0
  therefore states that the warning may be wrong and records corrections through the CLI,
  so the evidence Phase 2's ladder needs starts accumulating now.
- **P0-D-25 — C-1's witness stack is verified by execution, not by documentation.** v1's
  own source note records that FTS5's presence on both LTS lines is a build-configuration
  fact and not a documented API contract, so instructing implementation to re-confirm it
  against current documentation would send it to a document that does not carry it.
- **P0-D-26 — The three `PreToolUse` genres deliver after the edit, and that is the
  ceiling.** The harness reads a `PreToolUse` hook's returned `additionalContext` on the
  next model request, positioned next to the tool result — after the edit has run (§4).
  Consequence and both warning arms therefore reach the agent post-edit. This is
  accepted rather than worked around: none of the three guards against anything
  irreversible (a futile edit to build output or vendored code, or a call-site count —
  never damage), the whisper still lands before the agent's next action so it can undo
  the edit and stop the waste compounding, and the only channel that shows anything
  before a tool runs is the permission prompt, the gate `[OWNER-3]` rules out. This is
  the ceiling for a whisper **keyed to the edit event**; the same fact could reach the
  agent genuinely pre-edit if keyed to the read or search that precedes the edit (where
  coupling already fires) — that read-keyed consequence arm is out of Phase 0 scope, not
  impossible, and is deferred with its reason (it fires before an edit is confirmed, so
  its marginal value is lower and its false-fire rate higher; the read-set dedup and the
  bar would have to absorb that). §7 and the genre table's `Fires on` column name the
  triggering event, not the delivery moment.

- **P0-D-27 — The per-event limit is a budget, not a count of one.** v1 FR-A3
  reads *"at most one whisper per event"*, but that count has no `[OWNER-n]`/`[D-n]`
  source. The owner's written decision is `RETHINK.md:175–176`, *"Per-trigger and
  per-session whisper budgets. Hard caps."*, and Max Cogar confirmed on 2026-08-12 that
  a one-whisper-per-event cap was never intended (OWNER-LEDGER OL-R1). Phase 0 therefore
  delivers every whisper that independently clears the bar and fits the budget at an
  event. The high bar and dedup leave at most one at most events, but a genuinely
  material collision — a generated-file warning and a call-site consequence at one edit —
  delivers both rather than forcing a contest the invented cap created. This is why there
  is no `[OWNER-3]`-vs-no-precedence tension: nothing has to "win" when both can be said.
  What the budget is denominated in, and how per-event contention would be resolved if it
  ever arose, are settled in `[P0-D-28]` — not here, and not attributed to the owner.
  (The same unsourced count is in v1 FR-A3; correcting v1's own wording is the owner's
  call and is flagged in `docs/STATUS.md`.)

- **P0-D-28 — The budget is token-denominated, and Phase 0 sets no per-trigger number.**
  The owner named that per-trigger and per-session budgets exist and are hard caps
  (`RETHINK.md:175–176`) but gave neither a denomination nor a value. This document reads
  both as **token**-denominated, and that reading is derived, not the owner's word: the
  per-session budget is already tokens (2,000, v1 `[D-10]`); `RETHINK.md` §5 frames the
  oracle's whole cost as the agent's attention/overhead, which is token-measured; and a
  per-trigger cap in a different currency than the per-session cap it nests inside would
  be incoherent — the owner's rejection of the count-of-one (OL-R1) is against a count
  denomination, not for one. **Phase 0 fixes no separate per-trigger value.** The
  per-trigger cap defaults to the session cap, so within a session only the 2,000-token
  hard cap binds and the oracle can never flood the session regardless of per-event
  volume. A tighter per-trigger cap — and the score-ordering that would decide which
  above-bar candidates ride a tight cap — are **deferred to Phase 1**, for the reason
  Phase 0 exists: the value cannot be set without data on how many whispers actually clear
  the bar at a single event, which is exactly what P0-4's per-genre delivered counts
  produce on the exit run. Inventing a per-trigger number now would be a tuning guess in
  the phase built to replace guesses with measurement. This is this document's judgment,
  not the owner's.

## 14. Acceptance criteria

Phase 0 is complete when every criterion below passes, and when a run on a real
project produces a clean `ctxoracle status` — no unresolved failure class, no latency
breach, no undelivered whisper. The owner runs it; the diagnostics, not the owner, are
what report whether it behaved.

**The exit run must also have produced something.** A run in which the oracle never
spoke is not a passing exit; it is a result. AC-33 states what that obligates.

- **AC-1 (coupling → FR-K2, P0-5, FR-D1, FR-D5, NF-1)** — In a fixture with a known
  co-change pair, a completed read of one file yields a coupling whisper naming the
  other, with its evidence ratio and a git-history pointer, inside the latency budget.
- **AC-2 (silence → FR-A1, FR-A3, P0-4)** — Replaying a recorded session of routine
  events produces whispers on at most 10% of **deliverable** events — those on a
  consumer Phase 0 delivers to — and `status` reports the silence rate decomposed by
  suppressor (no candidate, already-seen and already-told reported separately per FR-A4,
  FR-A6, FR-A7, FR-A3, below-bar, undeliverable), each counted separately. `[P0-D-14]`
- **AC-3 (marginal value → FR-A5, FR-A4)** — Two replays of the same event over the
  same store: where the fact is already in the consumer's read set the oracle stays
  silent; where it is not, it speaks. An orientation candidate that would fire early
  does not fire once the agent is deep in the task.
- **AC-4 (evidence and corpus floors → P0-5, FR-A6)** — A pair below support 3 produces
  no ⚠ whisper; a pair at support 3 and confidence ≥ 0.9 does; a suggestion-grade pair
  at support 2 but below the confidence threshold produces nothing; a fixture below the
  200-transaction corpus floor produces neither; and a fixture above it with a region
  below the 20-transaction region floor stays silent for that region while speaking
  elsewhere.
- **AC-5 (no deny, no mutation → FR-O4, FR-O4a, FR-O3)** — No shim path can return a
  blocking or deferring decision (`deny`, `block`, `"defer"`) or a mutation field
  (`updatedInput`, `updatedToolOutput`) — static inspection plus an adversarial fixture
  in which a shim attempts to `updatedInput` a generated-file edit into its source
  confirms the edit reaches the tool unchanged; induced failure and induced timeout each
  yield silence and an unimpeded agent; `stop_hook_active: true` produces silence; and no
  output extends the loop by more than one continuation per stop.
- **AC-6 (pristine tree → C-4, FR-K8, FR-X5)** — After `init`, index, a full session and
  `deinit`, the only ever-touched file in the tree is the harness settings file, whose
  written content is the hook wiring and the `SessionEnd` timeout and nothing else, and
  after `deinit` that file is restored to its pre-init state.
- **AC-7 (warnings, not blocks → FR-D3, P0-6, FR-D2, P0-D-26)** — An edit to a detected
  generated file and an edit to a detected vendored file each proceed unimpeded and each
  receive the FR-D3 warning — with the mechanical evidence, that zone's own consequence,
  and a declarative false-fire clause containing no imperative construction — delivered
  next to that edit's tool result, with no co-change support present for either.
- **AC-8 (consequence → FR-A2 §7, FR-D1, P0-D-26)** — A pending edit to a symbol with
  known callers yields a consequence whisper stating call-site count and spread,
  delivered next to that edit's tool result.
- **AC-9 (orientation → FR-A2 §7, FR-K1, FR-K4, P0-D-17, NF-1)** — A submitted prompt
  whose terms lexically match indexed entry-point names yields an orientation whisper
  naming 2–4 of them within NF-1's budget and within 400 tokens; where a promoted
  landmine record matches the task shape the whisper names it too; a prompt term that
  matches a non-entry-point indexed name of equal lexical score to an entry point does
  not displace the entry point; and **a prompt matching no indexed name yields silence,
  not the repository's default entry points.**
- **AC-10 (completeness at stop → FR-A2 §7, FR-O4a)** — At a completion-claim stop with
  an untouched co-change partner and no verification candidate, a completeness whisper
  is delivered and recorded as a continuation event.
- **AC-11 (verification at stop → FR-A2 §7, P0-4)** — At a completion-claim stop with a
  changed region carrying a verification command and no completeness candidate, a
  verification whisper is delivered and recorded as a continuation event. Across a
  multi-stop fixture in which both genres have candidates, `status` reports a non-zero
  delivered count for each.
- **AC-12 (completion-claim recognition → P0-3, FR-O1)** — A stop whose
  `last_assistant_message` states completion draws a stop-grade whisper (positive); a
  stop that is genuinely not a completion — mid-task narration, a question to the user —
  draws none and is counted by `status` as a non-matching stop (true negative); over a
  labelled corpus of completion-phrased messages, `status` reports the pattern set's
  **miss rate** — completions the test failed to recognise — so the false-negative that
  silences the `[OWNER-12]` moment is measured, not assumed; and in a session with more
  matching stops than the bound, at most 3 stop-grade whispers are delivered with the
  remainder recorded as suppressed.
- **AC-13 (first sessions → FR-A7, P0-D-8)** — In a project's first 3 sessions, an event
  that would otherwise draw orientation's **entry-point** arm, consequence, completeness
  or verification draws none, and a suggestion-grade coupling candidate also draws none;
  while both warning arms and a coupling candidate at the warn-grade floor fire. For
  orientation's **landmine** arm, a prompt matching an owner-entered record's task shape
  fires within the window, and a prompt that does **not** match it stays silent within the
  window — the relevance gate P0-D-8 admits the arm on.
- **AC-14 (secrets → FR-X1)** — Fixture secrets in tracked files and git history never
  appear in plaintext in any store file, whisper, or log.
- **AC-15 (least privilege → FR-X5, FR-X7)** — An instrumented run shows no writes
  inside the repository tree beyond the settings file and no outbound traffic at all.
- **AC-16 (injection → FR-X2, FR-X3, FR-X8)** — With hostile imperative text in file
  content, comments and commit messages, no whisper relays or obeys it, and every
  repository-derived span in every emitted whisper is a pointer rather than an inline
  quotation.
- **AC-17 (provenance and trust origin → FR-K6, FR-X4, FR-X6)** — Every record written
  carries provenance and a trust label; no repository-derived record acquires human
  provenance, through distillation or any other stage; every whisper is in the audit log
  with its evidence and token count.
- **AC-18 (staleness → FR-K7)** — With a stale index, events yield silence or
  reduced-confidence whispers, never errors or spam, and a refresh is triggered.
- **AC-19 (self-detection → FR-M1, FR-M2, FR-M4)** — Induced failures — broken hook
  wiring, corrupted store, service killed mid-session — are each recorded and surfaced by
  `status` in plain language, with zero added output in the agent's session.
- **AC-20 (measurements → P0-4, NF-2)** — After a fixture session, `status` reports every
  P0-4 quantity: whisper count, the by-suppressor silence decomposition, latency against
  NF-1, continuation count and non-matching-stop count, suppressed count, token total
  against FR-A3's budget, and delivered count per genre.
- **AC-21 (zero ceremony → v1 P3, NF-2)** — An oracle-unaware agent completes a task with
  it active, produces no oracle-specific output, and receives whispers throughout; the
  count of actions the oracle requires of the agent is zero (`RETHINK.md:278–279`). The
  fixture runs outside FR-A7's first-sessions window and above FR-A6's floors, per AC-33.
- **AC-22 (human facts, written and read → FR-L6, FR-K6, FR-K4)** — A landmine statement
  entered through the CLI becomes a retrievable record carrying human provenance, and a
  subsequent prompt matching its task shape draws an orientation whisper naming it. The
  fixture runs a session past FR-A7's first-sessions window so the landmine arm is not
  suppressed by first-impressions, unless the arm is exercised within the window, where
  FR-A7 admits it (AC-13).
- **AC-23 (per-consumer state → FR-O6, P0-4)** — A tool event fired inside a subagent
  carries `agent_id`, is recorded against that key, draws no delivery, and is counted in
  the undeliverable component of the silence decomposition rather than a below-bar one.
- **AC-24 (shim discipline → FR-O2, FR-O5, C-3)** — Static inspection shows no decision
  logic in any shim, no harness-specific identifier outside the shim modules, and no
  timer, idle detector or polling loop anywhere in the service; an idle session produces
  no whisper.
- **AC-25 (lifecycle → FR-O1, C-2)** — `SessionEnd` tears the service down within the
  budget the settings file establishes; a subsequent event cold-starts cleanly;
  `StopFailure` and `SessionStart` are recorded with no delivery attempted.
- **AC-26 (resume, fork and compaction → FR-O1, FR-A4, NF-2, P0-D-20)** — A session
  started with `source: "resume"` seeds its delivered-set from the audit log,
  reconstructs its read set from the FR-L1 log, and does not re-send a whisper the prior
  session sent or a fact the agent already read, and its reported token total lists the
  replayed injections separately from the new-whisper budget; a session started with
  `source: "fork"` behaves the same; and a session started with `source: "compact"`
  clears the read set and will re-send a fact the pre-compaction agent had read.
- **AC-27 (mining hygiene → FR-K2, NF-3)** — A fixture history containing a merge commit,
  a transaction touching more than 30 entities, and a transaction older than the horizon
  yields a graph in which none of the three contributed an edge; appending new history
  refreshes the graph incrementally without a full rebuild.
- **AC-28 (budgets, not a count → FR-A3, P0-D-15, P0-D-27, P0-D-28)** — At a single edit
  where a generated-file warning and a call-site consequence each clear the bar and both
  fit the session budget (Phase 0 sets no tighter per-trigger cap, `[P0-D-28]`), **both
  are delivered** (the per-event limit is a token budget, not a count of one); once the
  session token budget is spent, no further whisper is delivered, including a warning;
  and no requirement grants a warning budget precedence (`[P0-D-15]`).
- **AC-29 (uptake evidence → FR-L1)** — After a fixture session containing a delivered
  whisper and a subsequent agent action on its pointer, the FR-L1 record for that event
  contains the candidate set, the whisper sent, and the uptake evidence, and is readable.
  Presence and readability only; no hit-rate judgment (`[P0-D-12]`).
- **AC-30 (empty-by-design schemas and the audit surface → P0-1, FR-K3, FR-K4, FR-K5,
  FR-X6, P0-D-21)** — The exemplar, landmine, invariant and recipe schemas exist and
  validate, and after a full session with no CLI-entered statement they hold no records;
  `ctxoracle log` reads back every whisper of that session with its evidence, pointer and
  token count.
- **AC-31 (whisper well-formedness → FR-D1, FR-D2)** — Every whisper emitted in every
  fixture run parses to FR-D1's format, every pointer it carries resolves to an existing
  location, and none contains an imperative construction in its claim.
- **AC-32 (cold container and contract drift → C-1, C-5)** — Installation and first index
  complete in a container with no native toolchain, no prebuilt-binary download and no
  network beyond the harness's, with the witness stack's storage capabilities confirmed
  by execution; and a fixture presenting a drifted hooks contract yields silence, not an
  error, with the drift recorded per FR-M1.
- **AC-33 (the exit run produced evidence → §1, P0-D-8, P0-D-22)** — The exit run's
  `status` reports its whisper count. A run that produced none does not pass: it
  obligates re-setting FR-A7's session count, FR-A6's floors, or FR-A5's bar from that
  run's data and re-running. The exit-run fixture runs outside FR-A7's first-sessions
  window (per AC-21) so a zero-whisper result is not merely the first-impressions gate.
  A run that ends with a suppressing condition active says so on the human channel.

**Verified by inspection rather than execution.** `FR-D4` — inspection confirms no
human-notice path writes to the context-injection channel. `P0-2` — inspection confirms
no degraded-mode delta and no degraded-mode notice exist in the codebase.
