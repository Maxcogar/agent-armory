# Architecture — Context Oracle, Phase A (deterministic core)

**Status:** Phase A architecture, derived from `docs/specs/spec-context-oracle.md`
(spec of record, signed off `OL-C6` 2026-08-28). Written 2026-08-29. This is the
per-phase architecture the lifecycle requires before any Phase A implementation
(`CLAUDE.md` — Lifecycle). It consumes the spec and the verified premises recorded
below; it will be consumed by the Phase A plan.

**Decision IDs here are `AD-n`** (architecture decision), distinct from the spec's
`D-n` judgment keys. Spec requirement keys (`FR-…`, `AC-…`, `C-…`, `NF-1`, `P1`–`P9`,
`D-n`) and ledger keys (`OL-…`) are cited only where the cited row actually says what
the sentence uses it for — the discipline the collapse-log's 2026-08-25 entry exists
to enforce.

**Relationship to the 2026-07 whole-scope architecture record.**
`docs/architecture-context-oracle.md` is a banner-marked historical record that
predates the blocking rebuild (`CLAUDE.md`: never a base to edit). It is treated
here as **reference material, not precedent**: nothing is inherited by copy. Where a
mechanism from it survives here (repo identity, provenance-mandatory schema,
fail-open shim posture), it is re-derived against the current spec and re-verified
in this session where the premise is environmental; where this architecture
diverges (process model, indexer scope, no per-session daemon), the divergence and
its reason are stated in the decision. The skill's "Inheritance from existing
precedents" section is deliberately omitted: the family criterion requires a prior
architecture that is currently authoritative, and the project rule marks that
record historical.

---

## Goal — what this architecture serves

Deliver a buildable design for the spec's Phase A (§11.5): the deterministic
whisper genres, the answer-drift block's safe skeleton, the stores/index/miner,
delivery with per-consumer dedup, self-observability, security, and the
human-correction calibration channel — such that an implementer can build it
without making architectural decisions inline, and such that Phase B's
model-in-the-loop machinery plugs into named seams instead of forcing a redesign.
The architecture is correct when every mechanism it specifies traces to a spec
requirement, every factual premise it rests on was verified against current source
this session (or is explicitly marked otherwise), and nothing in it re-introduces
what the owner rejected (`FR-B3`). The local-optimum trap that threatens it most
directly is inherited shape: re-adopting the 2026-07 record's warm-daemon topology
(built for a constraint the current spec no longer contains) or its old-spec
requirement numbering, instead of re-deriving from the spec as it is now.

## Scope

**In scope (everything the spec's §11.5 Phase A names, plus the seams later
phases need):**

- The seven model-free whisper genres: Orientation (`FR-A2a`), Coupling
  (`FR-A2b`), Reuse (`FR-A2c`), Consequence (`FR-A2d`), Warning ⚠ (`FR-A2e` with
  `FR-A5a` confidence flags), Completeness (`FR-A2f`), Verification /
  completion-check (`FR-A2g`, deterministic covering-test check, `D-38`).
- The answer-drift block's **safe skeleton** (`FR-A2l`, `FR-B1`, `D-41`): the
  `PreToolUse` deny plumbing, the conservative deterministic recognizers, the
  question/answer cached state and its lag-window hold — plus the **seam contract**
  by which Phase B's model-maintained state replaces the Phase A state writer
  without touching the deny path (AD-9, AD-10).
- Stores, structural index, co-change miner (`FR-K1`–`FR-K9`, §11.1).
- Delivery: per-consumer whispers and dedup (`FR-O2`, `FR-O6`, `FR-A4`,
  `FR-D1`–`FR-D5`), the single self-releasing Stop-time injection (`FR-B4`), and
  the done-claim outstanding-question line (`FR-B4`, AC-8a).
- Self-observability (`FR-M1`–`FR-M5`), including the Phase A regret proxy
  (`FR-L4`) and the deny health signals (`FR-M2`/`FR-M4`).
- Security controls mapped to T1–T4 (`FR-X1`–`FR-X8`).
- The learning loop's Phase A slice: session log (`FR-L1`), human corrections as
  first-class facts (`FR-L6`), fact routing (`FR-L7`). No automated
  demotion/promotion (`FR-L3`/`FR-L3b` are Phase C; Phase A records the data they
  will consume).
- CLI surface (`init`/`deinit`/`index`/`status`/`log`/`correct`/`note`/
  `export`/`import`), packaging, test/fixture architecture for the Phase A
  acceptance criteria.
- The recursion guard (`FR-J4`) and the degraded-mode posture (`FR-J2`/`FR-J3`) as
  they exist in a phase with no model-using genre.

**Deferred (with reasoning):**

- **Everything model-in-the-loop** — the `FR-A2h`/`FR-A2i`/`FR-A2j`/`FR-A2m`
  genres, the model-maintained question/answer state, the model-assisted
  done-claim recognizer — to **Phase B** per §11.5. This architecture fixes the
  seams they plug into (AD-9 §"Phase B seam", AD-21, AD-22) and nothing more:
  Phase B's architecture is written against Phase A's exit data (`CLAUDE.md`
  lifecycle; the 2026-07-31 collapse-log entry is the standing evidence that
  architecting a later phase against nothing produces designs that fail every
  review).
- **The skill non-conformance feature** (`FR-C1`–`FR-C4`, `FR-A2k`) — to **Phase
  C** per §11.5 ("needs the skill structures encoded and A/B delivery in place").
  `docs/STATUS.md` (2026-08-28) listed "the skill block's post-condition chaining
  (FR-C4)" among this document's subjects; that listing conflicts with the
  per-phase lifecycle rule, and the standing rule wins (`CLAUDE.md`: architecture
  is per phase, written only when the prior phase has produced the data it needs —
  and only `STATUS.md` states *what to do next*, not *what governs*). What this
  document does fix now is the part Phase A must lay down for FR-C4 to be
  buildable later: the deny plumbing is condition-generic (AD-10), and the audit
  trail records deny/no-deny per event (AD-17), which is the "no deny fired"
  signal FR-C4's detector will consume. The chaining mechanism itself is the
  Phase C architecture's to design.
- **Automated demotion/promotion** (`FR-L3`, `FR-L3b`) — Phase C per §11.5. Phase
  A ships the measurement substrate (per-genre volume, false-fire from human
  corrections, regret) those mechanisms need.
- **`FR-J5` implementation** (bounded-lateness delivery for off-path genres) —
  the *semantics* are fixed now as constraints on Phase B (AD-22), because they
  are spec properties, not Phase B freedoms; the queue table and routines are
  built by Phase B with their writers (AD-4's table-creation criterion). No
  Phase A genre defers delivery — every Phase A candidate is computed
  synchronously within NF-1.

**Out of scope (permanently, restated from the spec so no reader mistakes
deferral for postponed intent):** the pre-emptive gate, the generated-file block,
separate credentials, repo-tree writes beyond `init` wiring, team features
(`§2.2`, `FR-B3`, `OL-C2`, `OL-R4`, `OL-7`, `OL-6`).

---

## Verified premises (all verified this session, 2026-08-29, unless dated otherwise)

Every load-bearing external premise below was re-established against current
primary source or by direct execution in this environment. Where a premise was
measured by a prior session, that is said, with the date; nothing is carried
forward as "prior pass."

| # | Premise | How verified (this session) | Result |
|---|---|---|---|
| V1 | `transcript_path` is written asynchronously and may lag the in-memory conversation; hooks needing the current turn's final assistant text should use `last_assistant_message` on `Stop`/`SubagentStop` | Current hooks reference, `code.claude.com/docs/en/hooks` ("Common input fields"), fetched 2026-08-29 via Context7 | Confirmed verbatim. `FR-B1`'s lag-window clause and AD-9's hold design rest on this. |
| V2 | `PreToolUse` may return `hookSpecificOutput.permissionDecision: "deny"` with `permissionDecisionReason`, and separately `additionalContext`; precedence deny > defer > ask > allow; exit code 2 routes as deny | Same reference + `hooks-guide`, fetched 2026-08-29 | Confirmed. The deny reason is handed to Claude; `additionalContext` is a separate optional field. |
| V3 | `Stop`/`SubagentStop` deliver context two ways — `decision: "block"`+`reason` (surfaced as an error) and `hookSpecificOutput.additionalContext` ("without displaying a hook error notification") — both bounded by `stop_hook_active` and an 8-consecutive-continuation cap | Same reference, fetched 2026-08-29 | Confirmed. `FR-B4` uses `additionalContext`, once, honoring `stop_hook_active`. |
| V4 | `SubagentStop` input carries `agent_id`, `agent_type`, `agent_transcript_path`, `last_assistant_message`; subagent hooks are keyed per consumer | Same reference (SubagentStop payload example; SDK type), fetched 2026-08-29 | Confirmed — **for `SubagentStop` input only**; whether subagent tool events carry `agent_transcript_path` is unverified, and nothing in Phase A depends on it (AD-11 reads transcripts for the main consumer only). `FR-O6` delivery keys exist. |
| V5 | `UserPromptSubmit` input carries `prompt`; `SessionStart.source ∈ {startup, resume, clear, compact, fork}` | Same reference (payload examples; SDK type), fetched 2026-08-29 | Confirmed. AD-9's question intake and AD-16's `D-20` reconciliation read exactly these fields. |
| V6 | Hook timeouts: 600 s default for command hooks (30 s under `UserPromptSubmit`); SessionEnd hooks share a 1.5 s budget, raised up to 60 s to match a configured per-hook timeout; **a timed-out `PreToolUse` hook prevents the tool from running** | `hooks-guide` Limitations + `env-vars` + agent-sdk hooks page, fetched 2026-08-29 | Confirmed. The last clause makes a hung handler **fail-closed** — AD-23's cooperative deadline plus its blocking-call inventory exist to keep that unreachable **for the enumerated event-path calls** (never claimed in the abstract). |
| V7 | Stock `node:sqlite` ships FTS5 **from v22.16.0** | Executed here: `CREATE VIRTUAL TABLE … fts5` succeeds on Node v22.22.2 (LTS 'Jod', `process.release.sourceUrl` = nodejs.org v22.22.2); `PRAGMA compile_options` lists `ENABLE_FTS5`; `deps/sqlite/sqlite.gyp` fetched per tag 2026-08-29: **0** FTS5 matches at v22.15.0, **1** at v22.16.0 ("sqlite: enable common flags", nodejs/node#57621, in the 22.16.0 changelog) | **The spec's C-2 factual note (2026-08-16: FTS5 absent, nodejs/node #56951 open) is superseded.** The C-2 *requirement* is met by the built-in engine with zero dependencies — on Node ≥ 22.16.0, which is why AD-2's floor is 22.16.0, not C-1's unflagged-since figure (22.13.0, still true, still recorded in the spec). |
| V8 | Cold-spawn cost of the whole per-event handler shape: Node process start + store open + WAL + STRICT DDL + FTS5 virtual table + insert + query | Executed here 5×: 45–54 ms full process wall time; in-process store work 1.8 ms. **Excludes `PRAGMA integrity_check`**, which the collapse-hunt measured at 543 ms (`quick_check` 189 ms) on a 410 MB store as one uninterruptible synchronous statement (review record 2026-08-29) — which is why AD-17 keeps integrity checks **off** the event path | NF-1 (p95 ≤ 1.5 s) has ~30× headroom over a spawn-per-event process model whose event path is bounded lookups only (AD-23's inventory). AD-1 rests on this. |
| V9 | The host-CLI piggyback works in this environment with no separate credentials, as the design would ship it | Executed here: `claude -p --model claude-haiku-4-5 --tools "" --max-turns 1 --output-format json` → `is_error:false`, `num_turns:1`, result `"ok"`; wall 4.4 s (API 2.05 s) | Confirms `OL-2`/`OL-7` path and re-confirms NF-1's corollary: a model call can never sit on the synchronous hook path. Phase A makes no model calls; this pins the Phase B seam's latency class. |
| V10 | `--bare` still severs the piggyback | `claude --help` 2026-08-29: "--bare … Anthropic auth is strictly ANTHROPIC_API_KEY or apiKeyHelper via --settings (OAuth and keychain never read)" | `--bare` remains banned on the piggyback path (AD-21), as the 2026-07-22 review first established. |
| V11 | `--tools ""` disables all built-in tools | `claude --help` 2026-08-29: `--tools <tools...>` — "Use \"\" to disable all tools" | The tool-disallowed invocation (spec §10) has a current implementing flag. |
| V12 | Transcript JSONL structure: entries typed `user` / `assistant` / `attachment` / others; assistant entries carry content blocks typed `thinking`/`text`/`tool_use`, plus `uuid`/`parentUuid`/`timestamp`. **String content does NOT imply a human turn**: enumerating a live transcript containing injected turns shows string-content `type:"user"` entries of three kinds — the genuine human turn (`origin.kind:"human"`, `isMeta` absent), task notifications (`origin.kind:"task-notification"` — text partly authored outside the machine), and Stop-hook feedback (`isMeta:true`) — beside list-content tool results | Enumerated **two** transcripts in this environment (2026-08-29): the interactive-session transcript — (string, meta:∅, origin:human)=1, (string, meta:∅, origin:task-notification)=5, (string, meta:true)=2, (list, no markers)=106 — and a `claude -p` probe transcript whose **genuine user prompts carry no `origin` and no `isMeta` at all** (2 of 2) | AD-11's discrimination keys on the **markers**, never on content shape: a question-bearing transcript turn requires `origin.kind === "human"` and not `isMeta`; anything else — including marker-absent string entries — never opens a question from the transcript (skip + diagnostic). **Marker presence is mode-dependent** (the probe transcript proves genuine turns can lack them), so: mid-session enforcement never depends on the markers (intake reads the `prompt` field), the transcript-rebuild path's dependence on them is disclosed (AD-9, L11), and marker presence on the owner's actual interactive transcripts is a named build-time verification (AD-24). The layout is **undocumented** → adapter + version guard + FR-M2 finding on parse failure. |
| V13 | Repository identity hazards: on this very clone, `git rev-list --max-parents=0 HEAD` returns **4** commits, `--is-shallow-repository` is true, `.git/shallow` has 8 entries | Executed here 2026-08-29 | A shallow clone's "roots" are boundary commits and vary per clone depth (the 2026-07 record measured 6 on a different clone of the same repo). AD-3's rule — never key a store off a shallow history — is re-grounded on fresh evidence. |
| V14 | `web-tree-sitter` (0.26.13) and `tree-sitter-wasms` (0.1.13) are current, pure-WASM (no native toolchain), with no install scripts in the published manifest | npm registry metadata fetched 2026-08-29 | C-3-compatible parser runtime exists. The exact grammar inventory of `tree-sitter-wasms` is a build-time verification (Limitations L6). |
| V15 | `UserPromptSubmit` hooks inject context via plain stdout **or** `hookSpecificOutput.additionalContext` — both "injected as system reminders for Claude" | Current hooks reference + hooks-guide, fetched 2026-08-29 | The Orientation delivery channel (AD-6) is documented; the design uses `hookSpecificOutput.additionalContext` for uniformity with the other events. |
| V16 | `PostToolUse` hooks inject context via `hookSpecificOutput.additionalContext` ("directly enters Claude's context window"); plain stdout from a successful PostToolUse hook goes **only to the debug log** | Current hooks reference + context-window page, fetched 2026-08-29 | Coupling/Reuse delivery channel (AD-6) documented; stdout is not a delivery channel on tool events. |
| V17 | `VACUUM INTO '<file>'` executes on `node:sqlite` and round-trips data (SQLite 3.51.2 bundled); the module-level `backup()` API was **added in Node v22.16.0** (official v22.x API docs) | `VACUUM INTO` executed here 2026-08-29 (source→dest copy verified by query); `backup()` version per the v22.x API docs as recorded in the 2026-08-29 expert-review record | Export/import (AD-5) uses `VACUUM INTO` — engine-level, version-immune; with AD-2's floor at 22.16.0 either mechanism is available, and the chosen one does not depend on the floor. |
| V18 | A subagent hook's context does **not** reach the parent, and the documented parent channel exists: "To inject context back into the parent session rather than the subagent, a PostToolUse hook on the Agent tool should be used instead" | Current hooks reference (SubagentStop section), fetched 2026-08-29, quoted verbatim | The spec-§13 open item is no longer an unknown: C-4's assumption ("does not propagate") is now documented fact, and the parent-injection option the spec anticipated exists. Nothing in Phase A changes; recorded as premise maintenance (Limitations L9). |
| V19 | `PostToolUse` "fires after a tool executes successfully" and carries `tool_name`/`tool_input`/`tool_response`; **a failing executing tool fires `PostToolUseFailure` instead**, whose `error` string "generally begins with an exit code line" for Bash (the docs' own example payload is a failing `npm test`); `PostToolUseFailure` does **not** fire for pre-execution rejections — permission denials included | Current hooks reference (PostToolUse + PostToolUseFailure sections and payload examples), fetched 2026-08-29 | Failure outcomes (`observed_actions.outcome='failed'`) are producible **only** from `PostToolUseFailure`, so AD-6 wires it observation-only; a `PreToolUse` deny never generates one (the oracle's own denies cannot pollute the outcome record); `tool_name`/`tool_input` on tool events are the documented inputs AD-15's generators read. |

---

## Components and structure

### Component map

```
Claude Code session
  │  (hook events: UserPromptSubmit, PreToolUse, PostToolUse,
  │   PostToolUseFailure, Stop, SubagentStop, SessionStart, SessionEnd)
  ▼
ctxoracle hook <event>          ← one short-lived process per event (AD-1)
  ├─ guard: CTXORACLE_INTERNAL set → exit 0        (recursion guard, AD-21)
  ├─ watchdog: cooperative 2500 ms deadline, empty output  (AD-23)
  ├─ input adapter: hook JSON → internal event     (AD-6)
  ├─ question intake (UserPromptSubmit only): prompt-field
  │    recognizer → qa_state                       (AD-9)
  ├─ transcript catch-up: classify new turns → qa_state   (AD-9, AD-11)
  ├─ block check (PreToolUse only): qa_state → deny?      (AD-9, AD-10)
  ├─ candidate generation: per-genre store queries        (AD-15)
  ├─ bar: confidence ∧ impact ∧ marginal value            (AD-14)
  ├─ dedup: per-consumer delivered/read sets              (AD-16)
  ├─ compose + audit-log-then-emit                        (AD-16, AD-19)
  └─ diagnostics: event record, latency, faults           (AD-17)

ctxoracle index                 ← indexer + miner, off the event path (AD-12, AD-13)
ctxoracle init / deinit         ← hook wiring (the one in-tree write), stores,
                                   environment checks (AD-20)
ctxoracle status / log          ← FR-M4 / FR-M5 owner surface (AD-17)
ctxoracle correct / note / tune ← FR-D4 / FR-L6 human channel; tunables (AD-18, AD-20)
ctxoracle export / import       ← FR-K9 (AD-5)

Stores (outside the repo tree, AD-3):
  ~/.ctxoracle/projects/<repo-key>/store.db     (project store, AD-4)
  ~/.ctxoracle/global/global.db                 (global store, AD-5)
  ~/.ctxoracle/projects/<repo-key>/diagnostics/ (JSONL fault channel, AD-17)
```

There is **no long-running process**. Warm state that the 2026-07 record kept in a
daemon's memory (files seen, whispers sent, open questions) lives in the project
store, which is both simpler and required anyway by `FR-A4`'s cross-session dedup
reconciliation (`D-20`).

### Data flow — one `PreToolUse` event, happy path

1. Claude Code runs the wired command `ctxoracle hook pre-tool-use` with the hook
   JSON on stdin (timeout configured 5 s; internal watchdog 2.5 s).
2. Guard: `CTXORACLE_INTERNAL` unset → proceed. Parse stdin; derive consumer key
   `(session_id, agent_id | "main")`.
3. Open the project store (WAL; ~2 ms, V8). Run the transcript catch-up: read
   `transcript_path` from the per-consumer bookmark offset to EOF; classify each
   completed entry (new user questions opened, assistant text turns cleared
   against open questions); advance the bookmark (AD-9/AD-11).
4. Block check (main consumer only): open questions present? If yes and the tool
   is in the deny-eligible class and the move is clearly non-answer-directed,
   write the deny to the audit log, then return
   `permissionDecision:"deny"` + reason naming the outstanding question(s). If
   the audit write fails, no deny is emitted (fail-open, AD-19). Otherwise:
5. Candidate generation for the genres this event triggers (Consequence, Warning
   on Edit/Write; Coupling/Reuse fire on PostToolUse). Store queries only.
6. Bar (AD-14), dedup (AD-16), compose (pointer-carrying, non-imperative,
   `[oracle]`-prefixed — `FR-D1`/`FR-D2`), audit-log-then-emit: the whisper is
   written to `whisper_audit` first; only a logged whisper is returned as
   `additionalContext` (AD-19).
7. Diagnostics row (event, candidates, outcome, latency). Exit 0.

On any error or watchdog firing anywhere in 2–7: exit 0 with no output — no deny,
no whisper, a best-effort direct-to-file diagnostic (`FR-O3`).

### Project structure (the skeleton the implementer builds inside)

```
middleware/context-oracle/ctxoracle/
  package.json          # bin: ctxoracle; deps: web-tree-sitter, tree-sitter-wasms only
  src/
    cli.ts              # verb dispatch (init, hook, index, status, …)
    hook/
      adapter.ts        # hook JSON ↔ internal event (the only file naming CC fields)
      handler.ts        # the per-event pipeline (steps 2–7 above)
      watchdog.ts
    blocks/
      answer_drift.ts   # the ONLY producer of a deny verdict in Phase A (AD-10)
      verdict.ts        # the deny-verdict type + the single emit path
    qa/
      classify.ts       # deterministic question/clear recognizers (AD-9)
      state.ts          # qa_state DAO
    transcript/
      reader.ts         # JSONL tail, bookmarks, entry discrimination (AD-11)
      locate.ts         # transcript/agent-transcript path adapter (undocumented layout)
    genres/             # one module per Phase A genre (AD-15)
    bar/combinator.ts   # AD-14
    stores/
      adapter.ts        # the only importer of node:sqlite (AD-2)
      project_schema.sql, global_schema.sql, dao/*.ts
    index/              # LanguageFrontend + tree-sitter frontends + generic fallback (AD-12)
    miner/              # co-change miner (AD-13)
    security/           # redactor, injection-suspect flagger, trust (AD-19)
    diag/               # FR-M1 log, FR-M2 detectors, status/log rendering (AD-17)
  test/                 # node:test suites + fixture repos + replay harness (AD-24)
```

---

## Quality characteristics addressed (ISO/IEC 25010:2023)

| Characteristic | How this architecture advances it | Decisions |
|---|---|---|
| Reliability (fault tolerance, recoverability) | Fail-open everywhere: cooperative deadline under the harness timeout; no-deny on any failure; WAL stores with corruption detected by statement failure on the event path and integrity scans off-path (AD-17); per-event process isolation (a crash affects one event) | AD-1, AD-17, AD-19, AD-23 |
| Performance efficiency | Spawn-per-event measured at 45–54 ms against a 1.5 s p95 budget; all event-path work is store lookups; index/mining off-path | AD-1, AD-12, AD-13, AD-23 |
| Security | Threat-mapped controls: redaction at every ingress, pointer-only composition, trust labels capping confidence, non-droppable audit, least privilege (no credentials, no network, 0700 stores) | AD-19, AD-4, threat model |
| Maintainability (modularity, analysability) | Single-writer seams: one file imports `node:sqlite`; one file names Claude Code hook fields; one module can produce a deny; TypeScript strict so provenance-less records fail to compile | AD-2, AD-6, AD-10 |
| Compatibility / portability | Zero native dependencies, no postinstall, WASM grammars, built-in SQLite — installs and first-indexes in a cold sandbox | AD-2, AD-12, AD-25 |
| Functional suitability (correctness of the two owner objectives) | The deny path is structurally confined to the two confirmed conditions; whispers carry provenance and confidence; acceptance criteria made mechanical | AD-9, AD-10, AD-24 |
| Interaction capability (owner's observability) | `status`/`log` surface every FR-M4 signal in plain language, including deny health and labelled regret | AD-17 |

Characteristics not advanced, with reasoning: **flexibility/scalability** beyond
the solo, local scope — the spec scopes v1 to one user and two local stores
(`OL-6`); designing for team scale would be unrequested machinery (P9-adjacent
scope discipline).

---

## Design decisions

### Knowledge-state baseline (written before design, per the skill's discipline)

**Fact (verified this session):** everything in the Verified premises table (V1–V19).
**Inference:** the per-event handler's total latency envelope (~100–200 ms with
catch-up and candidate queries) is derived from V8 plus the observation that every
event-path operation is a prepared-statement lookup; it is not yet a measurement
of the built system — NF-1 instrumentation (AD-17) will measure it, and AC-10
gates on it.
**Speculation, named as such:** how little the Phase A conservative answer-drift
recognizer will catch (the spec itself makes measuring this a Phase A exit
deliverable, §11.5); whether `tree-sitter-wasms` covers every language the owner's
repos use (build-time check, Limitations L6).
**Biases operating:** (a) the 2026-07 record's shapes (daemon, four-language
indexer) exert pull — each divergence below names its evidence; (b) the training
default toward warm services and toward "the model will fix it" — Phase A is
deterministic by spec, so every recognizer here must state its deterministic
bound honestly rather than gesture at judgment.
**Known unknowns the design must absorb:** subagent transcript layout (V12 shows
the main layout only; Phase A reads transcripts for the main consumer alone, so
nothing rests on it — AD-11). The spec-§13 subagent-`additionalContext` item is
no longer an unknown: the current docs state it does **not** reach the parent
and name the parent-injection channel (V18) — C-4's assumption is confirmed,
and nothing here depends on the new channel.

### AD-1 — Process model: one short-lived process per hook event; no daemon

1. **Decision.** Every wired hook runs `ctxoracle hook <event>` as a fresh
   process that opens the store, does the event's work, prints at most one JSON
   response, and exits. Indexing and mining never run in this process (AD-12,
   AD-13). There is no service, no socket, no lockfile, no orphan reaping.
2. **Standard.** First-principles (no formal standard governs process topology
   here): the goal is delivering a whisper/deny within NF-1 from a cold sandbox
   with the fewest failure classes the owner cannot see; the local-optimum
   shortcut is the warm daemon the 2026-07 record chose — familiar, and required
   *then* by an old-spec constraint ("a background service with local IPC, or
   equivalent") that the current spec deliberately dropped (component boundaries
   are the architect's, spec preamble); the chosen path serves the goal because
   the measured cold cost (V8: 45–54 ms) is 3% of the p95 budget, and every
   daemon mechanism deleted (socket liveness, stale-socket cleanup, spawn races,
   orphan reap, cross-event shared-state corruption) is an FR-M2 failure class
   that no longer exists.
3. **Why here.** NF-1 is the governing number and V8 is its measurement; `OL-4`
   (sandbox) and C-3 (cold container) both favor a topology with nothing
   persistent to manage; `FR-A4`/`D-20` force per-consumer state into the store
   anyway, which removes the daemon's one real payoff (warm Tier-3 memory).
4. **What this is NOT.** Not the per-session warm service (2026-07 D2): its
   weighted case rested on a hard constraint that no longer exists and on Tier-3
   state being in-memory, which `D-20` reconciliation already contradicts;
   re-adopting it would be the pattern-cloning trap. Not a per-user daemon
   (cross-session blast radius, lifecycle management in ephemeral containers).
   Not a hybrid lazy-daemon ("spawn on first event, reuse after"): it re-imports
   every deleted failure class to save ~50 ms against a 1500 ms budget.
5. **Premise verification.** V8 (executed 5×, this machine, pasted in the session
   record); NF-1 read at spec §8 ("Constraints fixed by circumstance"); `FR-O3`
   fail-open read at spec §8. Addresses: NF-1, `FR-O3`, C-3, `OL-4`.

### AD-2 — Runtime and store engine: Node ≥ 22 LTS, TypeScript strict, `node:sqlite` with FTS5

1. **Decision.** TypeScript (strict, ESM), compiled by `tsc`; runtime floor
   **Node 22.16.0**, checked at `init` and `status` with a plain-language error.
   The floor is 22.16.0 — not C-1's unflagged-since figure of 22.13.0 — because
   FTS5 entered `node:sqlite` in v22.16.0 (V7: zero `FTS5` matches in
   `sqlite.gyp` at v22.15.0, one at v22.16.0; nodejs/node#57621), and the
   module-level `backup()` also arrived there (V17); a 22.13–22.15 runtime would
   pass a 22.13 check and silently land on degraded search. Both stores are
   SQLite opened via `node:sqlite` (`DatabaseSync`), `journal_mode=WAL`,
   `foreign_keys=ON`, STRICT tables, `busy_timeout` 100 ms. All engine access
   goes through `stores/adapter.ts` — the only file allowed to import
   `node:sqlite`, quarantining its Experimental status. FTS5 is still probed at
   `init` (create a temp `fts5` virtual table) as defense-in-depth against
   non-standard builds (a distro Node compiled with different flags); on that
   failure path, search falls back to indexed `LIKE`/token-prefix queries behind
   the same interface, and `status` says so plainly.
2. **Standard.** C-1 (Node as the engineering choice, revisitable) and C-2/C-3 as
   the governing constraints; ISO/IEC 25010 analysability for the
   TypeScript-strict choice (provenance-less records become compile-time errors,
   AD-4).
3. **Why here.** V7 changes the C-2 landscape: the built-in engine now provides
   FTS5, so the **zero-dependency** store path exists — no FTS5-shipping library
   (`better-sqlite3` — native prebuilds, C-3's named exclusion), no loadable
   extension (a platform `.so`, same exclusion), no WASM engine (slower, an extra
   dependency). The spec's C-2 text records the 2026-08-16 state and is
   factually superseded; the requirement it states (fast name/structure lookup
   and text search within NF-1, mechanism satisfying C-3) is met by stock
   `node:sqlite`.
4. **What this is NOT.** Not `better-sqlite3` (C-3 exclusion; V14's packages are
   the only runtime deps precisely to keep the no-native invariant); not JSONL +
   in-memory search (full scans for co-change joins; no integrity guarantees; the
   2026-07 record scored this and it lost on latency, and nothing has changed
   that); not Python or a compiled binary (C-1's reasoning stands: Node is the
   harness's own runtime, `node:sqlite` is built in, and a compiled toolchain
   raises the diagnosis bar in a project whose owner is a non-programmer,
   `OL-11`).
5. **Premise verification.** V7 (executed here: FTS5 virtual table + compile
   options + upstream `sqlite.gyp` on `v22.x`); V8 (WAL/STRICT/FTS5 timing); C-1,
   C-2, C-3 read at spec §8. Addresses: C-1, C-2, C-3, `FR-K1`, NF-1.

### AD-3 — Store layout and repository identity

1. **Decision.** Root `~/.ctxoracle/` (override: `CTXORACLE_HOME`), directories
   mode 0700:

   ```
   ~/.ctxoracle/
     global/global.db
     projects/<repo-key>/store.db
     projects/<repo-key>/diagnostics/<session-short>.jsonl
   ```

   `<repo-key>` = first 12 hex of SHA-256 over the identity string, chosen by one
   deterministic rule:
   1. Full (non-shallow) git history present → identity = the **lexicographically
      smallest root-commit hash** from `git rev-list --max-parents=0 HEAD`.
      Traversal order is never used — it is not a specified property of git
      output.
   2. `git rev-parse --is-shallow-repository` → true: **a commit key is never
      derived from a shallow history** (V13: a shallow clone's max-parents=0 set
      is the shallow boundary, and it varies per clone — 4 commits on this clone,
      6 on the 2026-07 clone of the same repo). The key is then the
      **normalized origin URL** when a remote exists, else the realpath, with
      the keying mode recorded in `schema_meta`. `init` performs **no fetch of
      any kind**: `FR-X5` permits network use only on the host-CLI piggyback,
      so unshallowing — if the owner ever wants commit-keyed identity on a
      shallow clone — happens outside the tool, after which re-running `init`
      picks up rule 1. (`status` shows the mode, so the difference is visible.)
   3. No git → SHA-256 of the realpath, mode `path-keyed`.

   `status` displays the key and its mode, so an identity change is visible.
2. **Standard.** `OL-6` (two stores, outside the tree) and `FR-K8` govern
   placement; `FR-K9` (export/import round-trip across container rebuilds)
   drives commit-keyed identity — a path key breaks on every rebuild, which is
   the case FR-K9 exists for. First-principles for the shallow branch: a key
   that silently differs between a full and a shallow clone of the same repo
   splits one repository's knowledge across two stores invisibly; a URL key is
   mutable but *visibly* recorded, and only used where history cannot be trusted.
3. **Why here.** Identity is the one thing export/import, dedup state, and
   learning data all hang off; getting it wrong is unrecoverable-by-merge later.
4. **What this is NOT.** Not origin-URL-primary (mutable, often absent in
   sandboxes; only the shallow fallback uses it, visibly). Not "first line of
   rev-list" (underspecified — the 2026-07 F5 finding, re-demonstrated by V13).
   Not store-in-repo (P8). Not XDG triple-split (no payoff at this scale;
   discoverability cost for a non-programmer owner).
5. **Premise verification.** V13 executed on this clone (4 boundary commits,
   shallow=true, 8 entries in `.git/shallow`); `FR-K8`/`FR-K9` read at spec
   §11.1; P8 read at spec §3. Residual risk (a repo that merges an unrelated
   history after `init` changes its root set) recorded in Limitations L4.
   Addresses: `FR-K8`, `FR-K9`, P8, `FR-X7`.

### AD-4 — Project-store schema: provenance-mandatory, STRICT

1. **Decision.** STRICT tables; every knowledge-bearing table carries a NOT NULL
   provenance block and trust label enforced by CHECK constraints, so a
   provenance-less or trust-less record is *unrepresentable* (`FR-K6`, `FR-X4`).
   Load-bearing schema (abridged to columns that carry requirements):

   ```sql
   -- provenance block on every knowledge table:
   --   prov_kind TEXT NOT NULL CHECK(prov_kind IN
   --     ('repo_span','commit','human','mechanical','session')),
   --   prov_ref  TEXT NOT NULL,  -- 'path:from-to' | commit hash | 'chat:<date>'
   --                             -- | 'transcript:<session>:<from>..<to>'
   --   trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
   --   injection_suspect INTEGER NOT NULL DEFAULT 0,      -- FR-X3
   --   created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL

   schema_meta(key TEXT PRIMARY KEY, value TEXT) -- schema_version, repo_key, keying_mode,
                                                 -- last_mined_commit, index_head
   files(id, path UNIQUE, lang, zone CHECK(zone IN
         ('source','generated','vendored','build_output','unknown')),
         zone_evidence, zone_evidence_suspect INTEGER DEFAULT 0,
         entry_score INTEGER DEFAULT 0,   -- AD-12: in-degree + path markers
         content_hash, mtime, …prov)
   symbols(id, file_id→files, name, kind, span_start, span_end, …prov)
   import_edges(src_file→files, dst_file→files, kind)      -- file-level imports
   symbol_refs(symbol_id→symbols, src_file→files, ref_count) -- identifier-match
                    -- heuristic (AD-12); feeds the Reuse headline (AD-15) and
                    -- entry-point in-degree; confidence-capped as a heuristic
   test_map(test_file→files, region_glob, source, …prov)   -- FR-A2g mapping
   commits(hash PRIMARY KEY, ts, entity_count, excluded INTEGER, exclude_reason)
   cochange_pairs(a→files, b→files, pair_count, a_count, b_count, last_ts,
                  PRIMARY KEY(a,b))                        -- a<b canonical; FR-K2
   landmines(id, kind CHECK(kind IN ('revert_chain','fix_chatter','human_stated')),
             file_id→files, evidence NOT NULL, support INTEGER, …prov)  -- FR-K3..K5
   invariants(id, description, …prov); invariant_members(invariant_id, file_id, span)
   -- exemplars / recipes: their FORM is fixed here per FR-K3–K5 (pointers to
   -- real code, full provenance block, trust label) but the TABLES are created
   -- by the migration of the phase that first writes them (Phase B/C), per the
   -- creation criterion below. No dormant tables ship in Phase A.
   human_facts(id, statement, target_kind, target_ref, stated_at, …prov) -- FR-L6
   corrections(id, whisper_id NULL, deny_id NULL, verdict CHECK(verdict IN
               ('false_fire','missed','confirm')), note, ts) -- FR-D4/FR-L6/AC-2c
   questions(id, consumer, question_text, content_hash,
             kind TEXT NOT NULL CHECK(kind IN ('info','request')),
                                          -- AD-9: only 'info' rows are
                                          -- deny-capable (NOT NULL, so the
                                          -- invariant never rests on SQLite's
                                          -- CHECK-passes-NULL accident)
             asked_uuid NULL, asked_offset NULL,   -- backfilled at reconciliation
             status CHECK(status IN ('open','answered','expired')),
             closed_by_uuid NULL,
             closed_by_kind NULL CHECK(closed_by_kind IN
               ('direct_recognized','generic_text_all_prior','expired',
                'intake_invalidated')),            -- AD-9: voided intake rows
             opened_at, closed_at,
             UNIQUE(consumer, asked_uuid))
   -- double-open guard, scoped to LIVE rows only so the spec's "Max re-asks"
   -- recourse and AD-18's --missed-question can always reopen a closed
   -- question (a table-global hash constraint would reject the verbatim
   -- re-ask — the recourse path — as a duplicate):
   --   CREATE UNIQUE INDEX q_open_dedup ON questions(consumer, content_hash)
   --   WHERE status='open';
   classify_state(consumer PRIMARY KEY, bookmark_offset, bookmark_uuid, updated_at)
   consumer_state(consumer, kind CHECK(kind IN ('delivered','read')),
                  subject_key, ts, PRIMARY KEY(consumer,kind,subject_key)) -- FR-A4
   session_log(session, consumer, seq, event_type, ts, latency_ms,
               candidates_json, outcome,
               detail_json NULL)   -- FR-L1/FR-M1; detail_json carries e.g.
                                   -- the done-claim counter's counted
                                   -- questions (AD-9 — a receptacle the
                                   -- round-4 review found missing)
   observed_actions(session, consumer, seq, tool, path NULL, command_class NULL,
                    outcome NULL CHECK(outcome IN ('ok','failed')), ts)
                    -- edited files, test runs. outcome='ok' from PostToolUse
                    -- (success-only, V19); outcome='failed' is set by the
                    -- PostToolUseFailure event UNCONDITIONALLY (the event
                    -- firing IS the failure fact; the error string's
                    -- exit-code line is best-effort enrichment only — the
                    -- docs hedge it with "generally", V19).
                    -- CONSUMER FILTER — the complete enumeration of every
                    -- reader of observed_actions with the outcome bucket it
                    -- consumes, split by what a failed action IS per consumer:
                    --  * CHANGE/READ consumers — the edit-set (FR-A2f), the
                    --    changed-regions query (FR-A2g), the read-set (AD-16),
                    --    the Coupling/Reuse triggers, and the FR-L4 re-edit/
                    --    revert clause (AD-18) — consume 'ok' rows only: a
                    --    failed Edit is not a change, a failed Read is not a
                    --    read, and a failed Edit is not a re-edit (counting it
                    --    would inflate regret).
                    --  * RUN-STATE consumers — the FR-A2g run-subtraction, the
                    --    weaker claim's "no recognized run" survey, and the
                    --    class-3 unknown-command scan (AD-15) — consume
                    --    command_class rows of EITHER outcome: a failed run IS
                    --    a run, and "not run" must never be asserted over it
                    --    (the run-and-failed done-claim is FR-A2m's Phase B
                    --    territory per D-27; Phase A's duty is only never to
                    --    lie about run-state).
                    --  * The FR-L4 covering-test-failed clause consumes
                    --    'failed' command rows (a covering test that ran and
                    --    failed).
                    --  * The deny_bypass_suspect diagnostic (AD-9) consumes
                    --    'ok' file-writing Bash rows only — a failed write is
                    --    no bypass. A file-writing shell command is identified
                    --    by a path-write predicate on the Bash tool_input
                    --    (redirection > / >>, tee, in-place edit sed -i /
                    --    perl -i, copy/move/install to a path), which sets
                    --    `path`, distinct from the run-state command_class.
   whisper_audit(id, session, consumer, kind CHECK(kind IN ('whisper','deny')),
                 genre, ts, text, evidence_json, confidence, channel,
                 continuation INTEGER DEFAULT 0)            -- FR-X6, non-droppable
   faults(id, ts, code, detail_json, session NULL)          -- FR-M2
   fts_symbols / fts_paths (FTS5)
   ```

   All writes go through DAOs; the learned-record entry point accepts only
   `trust='untrusted_repo'` unless every input is human-provenance (`FR-X4` —
   trust is never laundered).

   **Table-creation criterion (applied uniformly):** a table exists in a
   phase's store only if that phase has a writer for it. Where the spec fixes a
   schema's *form* (FR-K3–K5), the form is designed here; the table itself
   arrives with the migration of the phase that first writes it (AD-25's
   forward-only `schema_version` makes that trivial). This is the same ground
   on which AD-5 declines the Phase C `genre_state` ladder — one criterion,
   no exceptions: `exemplars`/`recipes` (Phase B/C writers), the FR-J5
   `deferred_queue` (Phase B, AD-22), and the piggyback probe cache
   (`env_capabilities`, Phase B, AD-21) are all created by their writing
   phase's migration, not shipped dormant.
2. **Standard.** `FR-K6` governing; database-normalization practice (3NF
   entities; the pair table's denormalized counters are a named read-speed
   trade-off); OWASP ASI06 (memory/context poisoning) drives the
   trust-and-suspect columns.
3. **Why here.** The schema is where four requirements become structural instead
   of policy: provenance (`FR-K6`), trust preservation (`FR-X4`), the audit trail
   (`FR-X6`), and the never-repeat state (`FR-A4`).
4. **What this is NOT.** Not a generic `facts(kind, json)` table — that makes
   provenance a convention, the exact thing `FR-K6` forbids. Not JSONL logs for
   whispers/denies — `status`, `log`, and the regret proxy query them
   relationally. Not symbol-level co-change in Phase A: file-level pairs carry
   every Phase A genre; symbol-level edges are additive later (the table design
   does not preclude them) — claiming them now would be unmeasured machinery.
5. **Premise verification.** STRICT/CHECK/FTS5 execute on this Node (V7, V8);
   `FR-K1`–`FR-K9`, `FR-L1`, `FR-L6`, `FR-X4`, `FR-X6`, `FR-A4` read at spec
   §11.1, §11.3, §7.2, §5.1. Addresses: those, plus `FR-M1`/`FR-M2` (the
   `session_log`/`faults` surface) and AC-13.

### AD-5 — Global-store schema and fact routing

1. **Decision.**

   ```sql
   global_meta(key TEXT PRIMARY KEY, value TEXT)
                                             -- includes the fold watermarks,
                                             -- ONE PER PROJECT
                                             -- (whisper_stats_watermark:<key>):
                                             -- each fold reads and advances
                                             -- only the watermark of the
                                             -- project it folds, so one
                                             -- project's fold never strands
                                             -- another project's unfolded rows
   whisper_stats(genre, project_key, sent, corrected_false, corrected_missed,
                 window_start, window_end)   -- efficacy; WRITER: watermarked
                                             -- aggregation folding the current
                                             -- project store's whisper_audit
                                             -- rows (the `sent` counts) AND
                                             -- corrections newer than that
                                             -- project's
                                             -- whisper_stats_watermark:<key>,
                                             -- advancing only that key. Both
                                             -- run points execute in one
                                             -- project's context and read that
                                             -- project's store: the `correct`
                                             -- verb and the SessionEnd flush —
                                             -- NEVER on tool events; if a
                                             -- handler-event placement is ever
                                             -- chosen instead, it must be added
                                             -- to AD-23's inventory and AD-6's
                                             -- row for that event. A correction
                                             -- made AFTER a session ends (the
                                             -- dominant timing: Max reads
                                             -- status/log post-hoc) still
                                             -- reaches the efficacy table
   tuning(key, project_key NULL, value, source, updated_at)
                                             -- scalar tunables (bar floors,
                                             -- thresholds) = one row per key;
                                             -- list-valued lexicon keys
                                             -- (`lexicon.*`) = one member per
                                             -- row, so a lexicon is the set of
                                             -- rows sharing its key and `tune`
                                             -- adds/removes a row;
                                             -- WRITER: seeded at init, changed
                                             -- via `ctxoracle tune` (AD-20)
   lessons(id, statement, evidence_json, …prov)
                                             -- cross-project, human channel;
                                             -- WRITER: `ctxoracle note --global`
                                             -- (AD-20; plain `note` routes to
                                             -- the project store per FR-L7)
   -- env_capabilities (the piggyback probe cache): created by the Phase B
   -- migration alongside its writer (AD-21), per AD-4's creation criterion.
   ```

   Routing (`FR-L7`): facts *about a repository* (landmines, invariants,
   corrections targeting a whisper's content) → project store; *efficacy* signals
   (per-genre sent/corrected counts) → global store.
   `export`/`import` (`FR-K9`) round-trips each store to a single file via
   **`VACUUM INTO`** (engine-level, executed and round-trip-verified this
   session — V17; chosen over the `backup()` API, which only exists from
   v22.16.0, so the export mechanism does not hang on the runtime floor); no
   network path exists in the code.
2. **Standard.** `OL-6` store split; `FR-L7` governing the routing; `FR-K9` the
   round-trip.
3. **Why here.** Tuning and efficacy must survive projects being re-cloned;
   repo facts must travel with the repo's own store.
4. **What this is NOT.** Not a single combined store (couples project export to
   global stats — `FR-L7` violation). Not config files for tuning (two sources of
   truth; the store is already the queryable place, and `status` renders it).
   Not the 2026-07 `genre_state` probation ladder — that is `FR-L3` machinery,
   Phase C, excluded by AD-4's uniform table-creation criterion (no table
   without a same-phase writer), which also moves `env_capabilities`,
   `exemplars`, `recipes`, and the `deferred_queue` to their writing phases.
5. **Premise verification.** `FR-L7`, `FR-K9` read at spec §11.3/§11.1;
   `VACUUM INTO` executed and round-trip-verified this session (V17); the
   `backup()`-since-v22.16.0 fact per the official v22.x API docs (V17).
   Addresses: `FR-L7`, `FR-K9`, `OL-6`.

### AD-6 — Hook wiring and the event map

1. **Decision.** `ctxoracle init` writes hook entries into the repository's
   `.claude/settings.json` (the one sanctioned in-tree write, `D-9`); `deinit`
   removes exactly what `init` wrote, by marker. Events wired, and what runs on
   each:

   | Hook event | Phase A work | Output channel |
   |---|---|---|
   | `UserPromptSubmit` | **question intake from the `prompt` input field** (AD-9 — the question exists before the agent's first move); Orientation candidate (`FR-A2a`) | `hookSpecificOutput.additionalContext` (V15; plain stdout is the documented alternative) |
   | `PreToolUse` (matcher `*`) | catch-up; block check (`FR-B1`); Consequence/Warning candidates (`FR-A2d`/`FR-A2e`) | `permissionDecision` deny (blocks only) / `additionalContext` (whispers) |
   | `PostToolUse` (matcher `*`) | read-set update; `observed_actions` append (`outcome='ok'` — the event is success-only, V19); Coupling/Reuse candidates (`FR-A2b`/`FR-A2c`) | `additionalContext` |
   | `PostToolUseFailure` (matcher `*`) | **observation only**: `observed_actions` append with `outcome='failed'` set **unconditionally by the event itself** (the `error` exit-code parse is best-effort enrichment of `command_class`/detail, never a precondition — V19's "generally begins" is a hedge, and a non-Bash failure must still append) — without this wiring a run-and-failed test looks *never run*, and Verification would emit the checkably-false "not run" (`FR-D1`) while the `FR-L4` failure clause starves; the run-state consumers therefore read these rows (AD-4's split filter) | **none** — no `permissionDecision` (spec `FR-O2`/`FR-B3` require none be emitted here) and no context channel used |
   | `Stop` | done-claim check; Completeness + Verification whisper; outstanding-question line (`FR-B4`, AC-8a) | `hookSpecificOutput.additionalContext`, once, honoring `stop_hook_active` |
   | `SubagentStop` | same as Stop for the subagent consumer (whispers only — no answer-drift state exists for it, `FR-O6`) | same |
   | `SessionStart` | `D-20` reconciliation by `source` (AD-16); qa-state rebuild trigger per `source` (AD-9); staleness check → detached reindex spawn; detached `quick_check` integrity child (AD-17) | none (stdout unused in Phase A) |
   | `SessionEnd` | flush/finalize session diagnostics row; the `whisper_stats` watermarked fold (AD-5 — audit rows + corrections, per-project watermark; bounded: indexed rows since the watermark, off every deny-capable path) | none; work bounded ≪ 1.5 s budget (V6), fold included |

   The wired command entries set `"timeout": 5` (seconds) so the harness never
   kills the handler before its own 2.5 s watchdog fires (AD-23, V6).
   The adapter (`hook/adapter.ts`) is the only code that names Claude Code's
   field names; everything after it consumes the internal event type.
2. **Standard.** `FR-O1`/`FR-O2` govern which events may deliver and how (V1–V5
   are the verified channel facts); `FR-O5` (no idle timers — every firing above
   is a mapped lifecycle event; nothing polls); CHI-grounded task-boundary
   discipline is inherited from the spec's `FR-O5`, not re-derived.
3. **Why here.** The event map is where §5.1's "relevance comes from the moment"
   becomes wiring: each genre fires only on the event that reveals the decision
   it serves (`D-18` — intent enters via the trigger).
4. **What this is NOT.** Not a `SubagentStart` orientation branch (the 2026-07
   record's Caveat-7 case): at subagent start there is no task signal in Phase A
   (narration reading is Phase B), so firing there would be the front-loaded
   briefing RETHINK §2.1 rejects. Not `PermissionRequest`
   wiring — nothing in Phase A consumes it, and the spec requires no
   `permissionDecision` be emitted on it ever (`FR-B3`, AC-2's control-flow
   assertion); `PostToolUseFailure` **is** wired, observation-only, because
   the round-2 review established failure outcomes exist nowhere else (V19),
   and it emits nothing on any channel. Not stdout injection on tool events (the contract routes
   tool-event context via `hookSpecificOutput`, V2).
5. **Premise verification.** V1–V6 and V15/V16/V19 (channels, fields, timeouts,
   the success/failure event split); `D-9` read at
   spec §12; `FR-O5` at §5.1. The `.claude/settings.json` hooks format is the
   documented settings surface (hooks reference, fetched 2026-08-29). Addresses:
   `FR-O1`, `FR-O2`, `FR-O5`, `FR-O6`, `D-9`, `FR-B4`.

### AD-7 — Handler I/O discipline: logic-free edges, fail-open, exit 0 always

1. **Decision.** The handler always exits 0. It prints either nothing, or exactly
   one JSON object of the shapes the contract defines (V2, V3). Every failure
   path — parse error, store missing, store corrupt, watchdog — produces empty
   output plus a best-effort append to the diagnostics JSONL (direct file write,
   not through the store, because a dead store cannot log its own death —
   `FR-M2`). The deny fields exist only in the block-verdict type produced by
   `blocks/` (AD-10); no other module's return type can carry them.
2. **Standard.** `FR-O3` (fail open, fast) governing; ASVS 5.0 V16 (security
   logging and error handling that never leaks an error into the agent's flow).
3. **Why here.** The hook boundary is the one place where an oracle bug becomes
   an agent-visible failure; making the failure shape structurally silent is what
   "worst case is a wasted sentence" means in code.
4. **What this is NOT.** Not exit-code-2 signaling (routes as deny, V2 — the
   opposite of fail-open). Not error JSON to stderr for the agent (noise; the
   owner channel is diagnostics + `status`).
5. **Premise verification.** V2 (exit-2 routing), V6 (timeout semantics);
   `FR-O3` read at spec §8. Addresses: `FR-O3`, NF-1, `FR-M2`.

### AD-8 — The per-event pipeline order (and why order is load-bearing)

1. **Decision.** Fixed order inside the handler: guard → parse → **question
   intake** (`UserPromptSubmit` only, AD-9) → **catch-up** → **block check** →
   candidates → bar → dedup → compose → **audit-log-then-emit** → diagnostics. Two orderings are requirements, not style: (a) catch-up runs
   *before* the block check, so the deny decision is made on the freshest state
   the transcript can provide (the residual lag is then only the file-write lag
   the contract documents, V1 — the irreducible lag window of `FR-B1`); (b) the
   audit write precedes emission for both whispers and denies — an unlogged
   whisper/deny is not emitted (`FR-X6` made true by construction; the
   2026-07-22 round-1 collapse-hunt finding that fail-open must not apply to
   the audit control — verified closed in round 2 — carried forward as a rule,
   re-derived from `FR-X6`'s wording "every whisper and every block recorded").
2. **Standard.** `FR-X6` and `FR-B1` governing; first-principles for ordering:
   the goal is that every emitted intervention is auditable and every deny is
   grounded in the freshest checkable state; the shortcut is "emit, then log
   async" (faster, and loses the audit guarantee exactly when the process
   crashes mid-event).
3. **Why here.** Order is the only thing standing between "the deny reads stale
   state when fresh state was available" and correctness; it costs nothing (V8).
4. **What this is NOT.** Not parallel candidate generation (needless complexity
   at 2 ms store cost); not async audit writes (loses `FR-X6`'s guarantee).
5. **Premise verification.** V1 (lag), V8 (cost headroom); `FR-X6` at spec §7.2.
   Addresses: `FR-X6`, `FR-B1`, NF-1.

### AD-9 — The answer-drift block: state, recognizers, lag-window hold, and the Phase B seam

This is the mechanism `docs/STATUS.md` names first, designed to the spec's phased
contract: Phase A ships deny plumbing plus conservative recognizers — safe,
low-coverage, a skeleton (`D-41`); the OL-C5-serving precision is Phase B.

1. **Decision.**

   **State (project store, AD-4):** `questions` rows per consumer with status
   `open`/`answered`/`expired`; `classify_state` holds the per-consumer bookmark
   (byte offset + last entry uuid) up to which the transcript has been
   classified.

   **Question intake (at `UserPromptSubmit`, from the `prompt` input field —
   V5).** Intake runs on the hook's own `prompt` string, so the question row
   exists **before the agent's first move** — the moment `OL-C5` names —
   independent of the transcript-write lag (which V1 documents only for the
   file). The **question recognizer** is conservative by construction (`FR-B5`:
   err toward not denying — here, toward not *opening*). It opens a question
   for a sentence that (i) ends with `?`, (ii) is outside code fences and
   quoted blocks, and (iii) is not matched by a small rhetorical/idiom
   stoplist. Clause (iv) then **classifies, positively, every opened row**,
   and its rules and defaults are stated with their error directions, because
   this classification is where the block's soundness lives — a
   mis-classification either disarms the recourse or wrongfully denies a
   fulfilling move:
   - A **non-request-frame** interrogative ("why does X fail?", "did you run
     the tests?") classifies `kind='info'` — deny-capable.
   - A **request-frame** interrogative ("can/could/will/would/please … you …"
     + verb) classifies by its verb, and — for communicative verbs — by the
     verb's **direct object**. The object is the head noun of the noun phrase
     **immediately following the verb** (skipping an optional "me/us"); a
     **wh-complement** ("why…", "how…", "whether…") takes precedence over any
     noun inside it, so an artifact noun sitting inside a wh-clause ("tell me
     why the login *test* fails?") does not flip an information question to a
     request. For a *communicative-lexicon* verb (answer / tell / explain /
     describe / show / list / clarify / confirm — closed, config-enumerated in
     `tuning`, tended via `ctxoracle tune`): a wh-complement, or an object
     whose head is on the **information-object lexicon** (error / output / log
     / diff / result / value / version / status-class — plus **question /
     answer**, the object of a meta-answer ask), classifies `kind='info'` —
     fulfilment is text, which the deny-eligible set can never touch — so
     "could you tell me why X fails?", "can you show me the error?", and the
     `OL-C3` escalation re-ask "can you please answer my question?" (object
     head "question") stay deny-capable. An object whose head is on the
     **artifact-object lexicon** (demo / test / script / example / branch /
     file / PR-class) classifies `kind='request'` — "can you show me a
     **demo**?" is fulfilled by a build, not text. In Phase A this lexicon is
     **inert**: the unlisted-object default also yields `request`, so the
     artifact list changes no Phase A classification; it is retained as the
     explicit enumeration of the build-fulfilled object class, ready to
     discriminate if the default is ever tightened. **Any other object — an
     unlisted head noun ("show me a prototype?") — defaults to
     `kind='request'`:** lexicon incompleteness must fail toward
     under-enforcement, never toward denying a fulfilling move. The lone
     object direction that must fail the other way — "question"/"answer",
     whose correct kind is `info` to preserve the `OL-C3` recourse — is
     carried by the information-object lexicon above, not by this default.
   - The **request-frame remainder** — any non-communicative verb ("can you
     **rename** the helper?", "can you **fix** X?") — is `kind='request'`:
     the safe, `FR-B5`-faithful direction (a wrongful deny on the requested
     act is the forbidden error; an under-enforced unlisted communicative
     verb — "could you **summarize** the error?" — or unlisted information
     noun is the accepted loss, guarded like every under-fire miss by
     `--missed-question` and shrunk by tending the communicative-verb and
     information-object lexicons). **Both kinds are tracked; only
   `kind='info'` is deny-capable.** For a request **to act on the repo**, the
   requested action *is* the answer path, so denying on it would deny exactly
   the move `OL-C5` protects — but the *tracking* costs nothing and is what
   keeps the AC-8a outstanding-question line, the `FR-M4` recourse counter (to
   the K-window extent L1 states — a row cleared before the final K turns
   leaves no owner-visible trace), the Phase A exit measurement, and Phase B's
   inherited state alive for that phrasing (a round-2 collapse finding:
   excluding requests from intake entirely blinded the recourse machinery
   exactly where the recourse is most needed). Multiple questions in one turn open multiple rows
   (`FR-B1`: tracked as a set), each with its `content_hash`; a hash matching
   only a **closed** row opens a fresh row — the open-scoped dedup index
   (AD-4) exists precisely so the verbatim re-ask, the spec's thrice-named
   recourse, always works. What intake deliberately misses (indirect
   questions, "tell me whether…") is Phase A's documented low coverage,
   measured at exit (§11.5) and owned in Limitations L1.

   **Transcript catch-up (per event, resumable — AD-11).** The handler reads
   the transcript from the bookmark to EOF and, per completed entry:
   - *Human turn* — discriminated by the **markers**, never by content shape
     (V12, re-verified against a transcript containing injected turns):
     `origin.kind === "human"` and not `isMeta`. Hook feedback (`isMeta:true`),
     task notifications (`origin.kind:"task-notification"` — text partly
     authored outside the machine), and tool-result pseudo-user entries
     **never open questions**; a string-content user entry with *no* markers is
     skipped with an `unrecognized_user_entry` diagnostic (conservative: skip,
     never open). A human turn with **list content** (e.g. pasted images) has
     its text blocks concatenated and processed normally. Human turns are
     **reconciled** against intake rows: match by `content_hash` (and
     first-unmatched adjacency) backfills `asked_uuid`/`asked_offset`; the
     open-scoped dedup index makes reconciliation idempotent under parallel
     handlers (AD-26) — no double-open of a live question, ever, while a
     closed question stays re-askable. **Intake-row validation:** when the
     transcript turn matching an intake row arrives and carries an
     **affirmatively non-human** marker (`origin.kind` present and not
     `"human"` — e.g. `task-notification` — or `isMeta:true`), the row is
     **voided** (`closed_by_kind='intake_invalidated'`, fault recorded): if a
     **marker-carrying** platform-injected turn ever fires `UserPromptSubmit`
     (an unverified contract behavior — L11), its question row survives at
     most one catch-up. A **marker-absent** matching turn does *not* void the
     row — V12's probe transcript proves genuine turns can lack markers, so
     voiding on absence would erase real questions in marker-less modes; the
     residual (an unknown marker-less synthetic class staying open) is
     escapable, auditable on the FR-X6 trail, and **counted when corrected**
     (the automated detectors cannot see it — ordinary narration blanket-
     clears it first), named in L11. A human question that reached the
     transcript without a matching intake row (e.g. state rebuilt after
     `resume`) is opened here, same recognizer, same conservatism.
   - *Assistant text turn* (an `assistant` entry containing a `text` block): the
     **clear recognizer** — conservative toward clearing in steady state
     (`FR-B5`): a text block that carries substance (length above a small floor
     after stripping tool noise) and is not a recognized content-free deferral
     ("I'll get to that" -class stoplist) marks **all** questions opened before
     it `answered`, recording `closed_by_kind = 'generic_text_all_prior'` (a
     Phase A exact-match path may record `'direct_recognized'` when the answer
     names the question's own terms; per-question *substantive* matching is a
     comprehension judgment and is exactly what the spec routes to Phase B —
     AC-2a-ii is a Phase-B criterion). Clearing all-prior errs toward clearing,
     the safe steady-state direction; **the `closed_by_kind` record is what
     keeps that lean honest downstream** (the FR-B4 counter, below).
   - Bookmark advances only over completed lines (partial trailing line left for
     the next event).

   **The deny decision (PreToolUse, main consumer only — `FR-O6`, AC-2a-i):**
   after catch-up, with at least one `open` question of **`kind='info'`** (the
   single deny-eligibility predicate, structurally testable under AD-10's
   confinement; `kind='request'` rows are tracked state only):
   - The move is judged by the **Phase A move recognizer**, which denies only
     moves *clearly not directed at answering* (`D-41`): the deny-eligible set is
     exactly the repo-mutating file tools (`Write`, `Edit`, `NotebookEdit`).
     Everything else — `Read`, `Grep`, `Glob`, `Bash` (it may be running a
     test/build to get the answer — `D-39`'s protected class), `Task` spawns
     (Phase A cannot judge spawn intent model-free; AC-2a-i's deny half is
     Phase-B-precise), MCP tools, web tools — is **allowed**. Rationale: the
     invariant that makes the deny sound is **"a deny-capable (`kind='info'`)
     row is created only by the info/request classifier"** — and that
     classifier runs at *every* opener: prompt-field intake, transcript
     catch-up, and the `--missed-question` correction path (AD-18), which
     routes through the same recognizer rather than bypassing it. So an open
     deny-capable question is information-seeking wherever it came from;
     mutating the repository does not produce an answer to it, while every
     allowed class contains plausible answer-directed members, and `FR-B5`
     errs toward not denying. The residual wrongful-deny class has **two
     member shapes**, both opened by intake's clause (i)–(iii) and classified
     `info` by clause (iv) for want of a request frame: (1) an action-request
     **phrased outside the request frame entirely** ("mind fixing X?"); and
     (2) a **rhetorical or idiomatic interrogative** that escapes clause
     (iii)'s deliberately *small* stoplist ("ugh, why is CI always so
     flaky??") — a non-request-frame interrogative that opens a deny-capable
     row against a fulfilling move it never meant to block, often co-prompted
     with a correctly-framed real request in the same turn. The stoplist is
     fallible by construction, so this shape is owned, not eliminated. Both are
     owned in L1, escapable by one answering turn, and measured on the
     wrongful-deny rate. (This set is a
     move-classification *mechanism* under `D-41`'s "clearly not
     answer-directed" license, applied only after a question exists — not a
     redefinition of the trigger, which remains `OL-C5`'s owner definition;
     the `OL-R5`-rejected item *defined the answer-drift trigger itself* as
     "writing code" with negative-space scoping, which the ledger row rejects
     as a proxy for the definition.)
   - Deny emission: audit-log first (AD-8), then
     `permissionDecision:"deny"`, `permissionDecisionReason` = "answer Max's
     question first: <the open question text(s)>". Subsequent non-answer-directed
     moves are denied the same way — no counter, no held turn (`FR-B2`). A text
     answer is never a tool action, so the way out always exists.

   **The lag-window hold (`FR-B1`'s lag clause, `D-41`).** The clear-state is
   whatever the classified transcript shows. When the newest assistant text has
   not reached the file yet (V1's documented lag), the state still says `open`,
   and a deny-eligible move is denied — the block **holds rather than
   pre-clears**, on the clear-axis only: nothing in the lag window widens the
   deny-eligible set, and answer-directed moves run freely exactly as in steady
   state. A wrongful lag-hold self-recovers as soon as catch-up reaches the
   answer — normally the next event; when catch-up itself is running resumably
   across events (`catchup_incomplete`), recovery takes as many events as the
   backlog needs, and the hold persists meanwhile (still clear-axis-only).
   **Detection, on both axes of "deny outlives its condition" (`FR-M2`):**
   (a) *freshness* — when a catch-up classifies an answer whose transcript
   timestamp precedes an already-emitted deny's timestamp, the handler writes
   fault `deny_after_answer_lag`; (b) *correctness* — the clear recognizer can
   simply be wrong (a genuinely substantive but short answer under the length
   floor, or a false stoplist match, leaves the question `open` and every
   subsequent deny is wrongful). That path is caught by an independent
   detector: fault **`deny_despite_answer_text`** when ≥ N denies (tunable)
   accumulate for a consumer with ≥ 1 intervening assistant text turn since
   the newest question opened, **excluding turns matched by the deferral
   stoplist** — a correct deny-through-deferral ("I'll get to that", the
   dodge `OL-C3` targets) must not inflate the wrongful-deny signal, and
   sharing only the stoplist's deferral half keeps the detector independent
   of the substance judgment it guards. **Coverage stated exactly** (the
   exclusion forecloses one sub-case, and saying so beats claiming both): the
   detector catches the *length-floor* miss (a real short answer is a
   non-deferral text turn, so it accumulates); the *false-stoplist-match*
   miss — a genuine answer the deferral list wrongly matches — is excluded by
   construction and is caught only by the human channel (`ctxoracle correct`
   on the deny), self-recovering when the agent re-answers in non-deferral
   words. The inverse of the deny-loop condition; surfaced on the
   wrongful-deny side of `status`; inducible for AC-9 exactly as the
   criterion states (a real short answer the recognizer misses).

   **Stop-time backstop (AC-8a) — and what its counter can honestly count.**
   At a `Stop` where the done-claim recognizer (AD-15) fires and `open`
   questions exist, the Stop-time whisper carries the outstanding-question
   line — and the line covers **both kinds**: an unanswered `info` question
   and an un-actioned, un-answered `request` row alike (OL-C5 draws no such
   distinction; the kind split exists for deny-eligibility, not tracking).
   The `FR-M4` owner-recourse counter must not be blinded by the
   clear-all-prior lean (a narrating agent clears everything before `Stop` can
   look), so it counts done-claims where **either** a question is still `open`
   **or** a question was closed only by `closed_by_kind =
   'generic_text_all_prior'` within the final K assistant turns (K tunable) —
   a labelled Phase A approximation of "plausibly died unanswered." `status`
   states the label's **both** error directions in so many words:
   under-count (blanket-cleared earlier in the session is not counted) and
   over-count (a genuinely-answered late question is normally recorded
   `generic_text_all_prior`, since the exact-match `direct_recognized` path is
   rare by construction, so an honestly-answered late ask still increments the
   counter — and an un-narrated *fulfilled* request can appear here too: doing
   without saying leaves its row open). **The count is readable, not just
   countable** (a round-3 finding: a number whose questions Max cannot see
   makes the recourse session archaeology): each increment writes the counted
   questions (text, kind, `closed_by_kind`, closing turn) into the session's
   `session_log.detail_json` (the column exists for this — AD-4);
   `ctxoracle log` (defaulting to the most recent session; `--session <id>`
   for another) renders them under the done-claim entry **whether or not any
   whisper fired at that Stop** — a done-claim can increment the counter with
   nothing above the bar, and the rendering must not presume a
   `whisper_audit` entry to hang off — and `status`'s counter line points
   there ("3 — see ctxoracle log"). Phase B's per-question state measures this properly; the
   label discipline is the same as `model_path_down`'s — absence of
   measurement is never displayed as health, and a proxy is never displayed as
   a measurement.

   **Deny-loop signal (`FR-M4`):** ≥ 3 consecutive denies (a tunable `tuning`
   row, like every operating number here) for one consumer with no intervening
   assistant text turn → `deny_loop` fault row; surfaced by `status`. The
   signal is structurally blind to the one-deny-then-bypass case — a denied
   `Edit` retried as a file-writing `Bash` command sails through (L3) — so a
   companion diagnostic, **`deny_bypass_suspect`**, is recorded post-hoc when a
   deny is followed in the same turn by a successful (`'ok'`) file-writing Bash
   row in `observed_actions` — the write identified by a path-write predicate
   on the Bash `tool_input` (redirection, `tee`, in-place edit, copy/move to a
   path), distinct from the run-state `command_class`; a failed write is no
   bypass. Owner-facing only, feeding the Phase B precision case.

   **Question lifetime across session boundaries:** qa-state is scoped to the
   conversation, which the transcript embodies. On `SessionStart` by `source`
   (V5): `startup`/`clear` → fresh empty state for the session's consumers (any
   prior `open` rows for a superseded conversation on the same consumer key are
   marked `expired` — bookkeeping, not a deny basis); `resume`/`fork`/`compact`
   → the conversation continues, so open questions should survive: state is
   rebuilt by classifying the transcript from offset 0 under a fresh bookmark
   — **a recovery whose reach is exactly the marker premise's reach** (V12): in
   a transcript mode whose human turns carry no markers, rebuild recovers
   nothing (under-fire, the safe direction, but a capability going dark — so a
   rebuild that scans a non-empty transcript, recognizes zero human turns, and
   emitted `unrecognized_user_entry` diagnostics raises the distinct fault
   **`rebuild_recovered_nothing`**, surfaced loudly per `OL-10`; L11 owns the
   limit, and marker presence on the owner's interactive transcripts is a
   build-time verification, AD-24).
   The catch-up is **resumable**: the bookmark persists per event, so a
   transcript too large to classify inside one watchdog window converges over
   the next events, with a `catchup_incomplete` diagnostic making the window
   visible. The lean while incomplete is stated precisely, because its two
   halves point opposite ways: questions **not yet discovered** cannot deny
   (under-fire, the safe direction), while questions **already open** keep
   holding on the clear-axis exactly as in the lag window — the backlog never
   pre-clears them. Nothing expires at `SessionEnd`: expiring there would drop
   a legitimately outstanding question across a resume. One disclosed loss: on
   `compact`, state is rebuilt from the compacted transcript, so a question
   the compaction summarized away vanishes silently — under-fire, safe
   direction, and invisible to any Phase A mechanism; recorded in L1's
   coverage ledger rather than hidden.

   **The Phase B seam (the contract this architecture fixes now):** the deny
   path reads **only** `questions`/`classify_state` through `qa/state.ts`. Phase
   B replaces the *writer* (the deterministic classifiers) with the
   model-maintained updater running off-path (`§11.5`: the model updates cached
   state between actions; the deny path keeps reading the same tables
   synchronously). The recognizer interfaces (`classify.ts`) take a transcript
   entry and return typed verdicts, so the swap is a module replacement, not a
   redesign. The `expired` status, the `closed_by_kind` record, and the fault
   codes are part of the seam: Phase B inherits them unchanged.

2. **Standard.** `OL-C5` (the owner definition — the rule enforced), `OL-C3`
   (the block's existence), `FR-B1`/`FR-B2`/`FR-B5` (mechanism properties),
   `D-39`/`D-41` (the protected answer-directed class; the phasing). The
   conservative leans implement `FR-B5`'s stated cost function per error
   direction.
3. **Why here.** This is the one Phase A mechanism that can halt an agent, so
   every recognizer bound is stated and every error direction has a named
   detector: over-fire → wrongful-deny visibility via `corrections`
   (`FR-L6`/AC-2c) and `deny_after_answer_lag`; under-fire → the human channel
   (Max sees his own unanswered question, `FR-B5`) plus the AC-8a backstop line.
4. **What this is NOT.** Not a Stop-based hold (`FR-B1`: the deny lands on the
   deviating action; a text turn is never denied). Not a Bash-command classifier
   that denies "obviously unrelated" commands — distinguishing `pytest` from
   other work is intent judgment, and a wrong Bash deny would strand legitimate
   answer-gathering (`D-39`'s protected class is load-bearing); Phase A's
   coverage loss is the documented trade. Not a per-question clear matcher in
   Phase A (comprehension judgment — Phase B, AC-2a-ii). Not question persistence
   across sessions (a deny must be self-clearing within the conversation that
   grounds it, `FR-B2`; expiry is the conservative reading and the miss is
   visible in `status`).
5. **Premise verification.** V1 (lag is real and documented — the hold clause has
   a live premise); V12 (the entry discrimination the recognizers key on,
   observed on a real transcript); V2 (deny channel); `OL-C5` read in
   `OWNER-LEDGER.md` (CONFIRMED, 2026-08-25); `FR-B1`/`FR-B2`/`FR-B5`, `D-39`,
   `D-41` read at spec §8/§12. Addresses: `FR-A2l`, `FR-B1`, `FR-B2`, `FR-B5`,
   `FR-O6`, `D-39`, `D-41`, AC-2a, AC-2a-i, AC-8a, AC-12 (deterministic parts).

### AD-10 — Deny confinement: one producer, structurally

1. **Decision.** A single module (`blocks/verdict.ts`) defines the deny-verdict
   type and the only function that can place `permissionDecision` into a hook
   response. In Phase A exactly one caller exists: `blocks/answer_drift.ts`.
   The Phase C skill block becomes the second caller of the same interface. A
   structural test (AD-24) asserts, by import graph and by grep over the built
   output, that no other call site constructs the field — AC-2's control-flow
   assertion made mechanical. `updatedInput`/`updatedToolOutput` do not exist in
   any response type (`FR-B3`'s no-mutation clause, unrepresentable).
2. **Standard.** `FR-B3` governing ("a `permissionDecision` deny is emitted only
   for the two reactive conditions of FR-B1"); ISO 25010 analysability (the
   reviewer can verify the property from one import graph).
3. **Why here.** "Exactly two blocks" is an absolute over a mechanism; the
   collapse-log's 2026-08-25 lesson (an absolute silently broken by a second use
   of the primitive) says: enumerate and confine the primitive structurally, not
   by convention.
4. **What this is NOT.** Not a runtime flag check scattered per genre (convention,
   not structure); not a lint rule alone (the structural test also runs against
   built output, catching what source lint misses).
5. **Premise verification.** `FR-B3` and AC-2 read at spec §8/§14; no external
   premises — pure design choice. Addresses: `FR-B3`, AC-2.

### AD-11 — Transcript reader: bookmarked JSONL tail behind a version-guarded adapter

1. **Decision.** `transcript/reader.ts` reads from a byte offset, tolerates a
   partial trailing line, and yields typed entries; `transcript/locate.ts` is
   the only file that knows where transcripts live. **Phase A reads transcripts
   for the main consumer only** (`transcript_path` from every event's input):
   the only Phase A mechanism that consumes narration is the main-scoped
   qa-state (AD-9), so no subagent transcript is opened at all (V4 verifies
   `agent_transcript_path` on `SubagentStop` input only; whether subagent tool
   events carry it is unverified, and `locate.ts` records the field for later
   phases rather than using it). Entry discrimination is **by markers, never
   by content shape** (V12, enumerated on a transcript containing injected
   turns): a *human turn* requires `origin.kind === "human"` and not `isMeta`
   — hook feedback (`isMeta:true`), task notifications
   (`origin.kind:"task-notification"`), and list-content tool results are never
   human turns, and a marker-absent string entry is skipped with an
   `unrecognized_user_entry` diagnostic rather than guessed. A human turn's
   content may be a string or a list (pasted images); list content has its
   text blocks concatenated. An *assistant text turn* is `type:"assistant"`
   whose content includes a `text` block (`thinking`/`tool_use`-only turns are
   not answers). Unknown entry types are skipped. If parsing fails
   structurally (unknown shape where a known one is required), the reader
   raises fault `transcript_layout_changed` (`FR-M2`) and the handler proceeds
   whisper-only with the qa-state frozen — frozen-open, never frozen-cleared:
   an unreadable transcript must not silently clear a question (the hold
   direction of `FR-B1`'s lag clause, applied to breakage). `status` states it
   in plain language.
2. **Standard.** `FR-O1` (observation), `FR-B1` (the clear-axis reads this),
   `OL-10` (a capability going dark must be announced). The transcript layout is
   undocumented, so the C-4 posture (verified facts only at the boundary)
   demands the adapter.
3. **Why here.** The reader is the block's sensory organ; its failure mode
   decides whether breakage produces wrongful denies (unacceptable —
   fail toward *holding open questions but continuing to deny only on state
   already classified*; new questions cannot be detected, which is under-fire,
   the direction whose guard is the human channel).
4. **What this is NOT.** Not `last_assistant_message`-only (Stop-only field, V1;
   the PreToolUse clear-axis needs the file). Not a live-tail watcher process
   (no daemon, AD-1; `FR-O5` forbids timer paths). Not a content-shape
   discriminator ("string content = human") — refuted by V12's enumeration:
   hook output and externally-influenced notification text arrive as
   string-content user entries, and treating them as Max's turns would let a
   hook script or a notification open a "question" and drive a wrongful deny
   (the T2 injection surface the threat model now closes at this boundary).
   Not deriving subagent paths from directory conventions (nothing in Phase A
   reads them; the documented field is recorded for later phases).
5. **Premise verification.** V1, V4, V12 (all fetched/observed 2026-08-29);
   `FR-O1` at spec §5.1; `OL-10` in the ledger. Addresses: `FR-O1`, `FR-B1`,
   `FR-M2`, `OL-10`.

### AD-12 — Structural indexer: language-agnostic frontends, WASM grammars, generic fallback

1. **Decision.** `ctxoracle index` (and a detached refresh the handler spawns on
   staleness, with a lock file in the store directory and `CTXORACLE_INTERNAL=1`
   in its environment) builds: `files` (with zone classification: marker
   comments in the head 2 KB, `dist/`/`build/`/lockfile patterns, `.gitignore`
   membership, `vendor/`/`node_modules/`), `symbols`, **`import_edges`**
   (file→file, what import extraction actually yields), **`symbol_refs`**
   (per exported symbol: the count of *other* files whose text references its
   identifier among the files that import its file — a deterministic
   identifier-match heuristic, recorded as such and confidence-capped; this is
   the producer of the Reuse genre's reference counts, AD-15), **`entry_score`
   per file** (import in-degree from `import_edges` + path-convention markers:
   `main`/`index`/`cli`/`app`/route-registration patterns — the producer of
   Orientation's entry-point ranking factor, AD-15), `test_map` (path
   conventions + import edges from test files), FTS5 tables. Parsing goes
   through a `LanguageFrontend` interface (`FR-K1`'s language-agnostic seam,
   C-6): the tree-sitter frontend covers every language for which
   `tree-sitter-wasms` ships a grammar, mapped by a **configurable**
   extension→grammar table with defaults; a **generic frontend** (line-based
   definition heuristics + path/word tokens into FTS) covers everything else, so
   no language is invisible (C-6: adding a language = adding a grammar file or a
   config row, never a redesign). Zone evidence is secret-scanned and
   injection-flagged at capture (`zone_evidence_suspect`, AD-19). Incremental:
   content-hash per file; deletions cascade; files > 1 MB or > 20k lines are
   indexed path-only with a diagnostic. `schema_meta.index_head` records the
   indexed commit; the handler's staleness check compares it to `HEAD` and
   spawns the refresh when they diverge (`FR-K7`: staleness lowers confidence
   meanwhile, never blocks).
2. **Standard.** `FR-K1` and C-6 governing; C-3 (the WASM constraint — no native
   grammars); ASVS 5.0 V5 (File Handling) for the ingestion size caps.
3. **Why here.** Everything the event path serves (entry points, zones, symbol
   spans, coupling partners' names) is precomputed here so hook-path work is
   lookups only (NF-1).
4. **What this is NOT.** Not native per-language grammar packages (C-3's named
   exclusion). Not the TypeScript compiler API (single-language, heavy). Not
   regex-only symbol extraction as the *primary* frontend (false symbols poison
   pointers — P4; the generic frontend is a fallback whose facts carry lower
   confidence by construction, and FTS path/word coverage keeps its languages
   searchable). Not a fixed language list (C-6 bars it; the 2026-07 record's
   four-grammar scope is explicitly not cloned).
5. **Premise verification.** V14 (both packages current, WASM, no install
   scripts); grammar inventory deferred to build with an explicit check
   (Limitations L6); `FR-K1`, `FR-K7`, C-6 read at spec §11.1/§8. Addresses:
   `FR-K1`, `FR-K7`, C-3, C-6, NF-1, AC-17, AC-20.

### AD-13 — Co-change miner

1. **Decision.** `git log --no-merges --numstat --format=… -M` streamed
   commit-by-commit (in `ctxoracle index`, never on the event path). Hygiene as
   hard filters, each exclusion recorded in `commits` with its reason: merge
   commits excluded (`FR-K2`, MSR/HERZIG grounding is the spec's); transactions
   > 30 entities excluded (illustrative cap, tunable — `FR-K2`); history horizon
   default 5 years or 10,000 commits, whichever first (tunable, `FR-K2`
   "configurable recency-weighted horizon"); recency recorded per pair
   (`last_ts`) and used as a confidence dampener (recency weighting), tunable.
   Aggregation: canonical-ordered file-pair counts with per-file totals;
   `confidence(a→b) = pair_count / a_count`; `support = pair_count`. Refresh:
   `last_mined_commit` watermark; mine only `watermark..HEAD`; history rewrite
   detected (watermark unreachable) → full re-mine + diagnostic. Corpus floor
   (`FR-A6`): history genres return no candidates until the mined corpus ≥ a
   tunable floor (default: 30 non-excluded commits — evidentiary, feeding
   confidence; no session/adoption window exists anywhere).
2. **Standard.** `FR-K2` governing (its hygiene items are spec-stated with their
   own sources); `FR-A6` for the floor.
3. **Why here.** Pair counts + totals is the minimal storage from which every
   bar term (support, confidence, recency) and every whisper's evidence ratio
   renders without walking history at event time.
4. **What this is NOT.** Not per-commit transaction lists as the query model
   (unbounded growth, aggregation at lookup time). Not association-rule mining
   at query time (hook-path budget). Not recency *pruning* (the spec chose
   horizon-cap + recorded recency; pruning deletes evidence).
5. **Premise verification.** `git log --no-merges --numstat` exercised on this
   repo this session (V13's commands ran against the same git); `FR-K2`, `FR-A6`
   read at spec §11.1/§5.2. Addresses: `FR-K2`, `FR-A6`, AC-1, AC-6, AC-13.

### AD-14 — The relevance bar: a conjunction of floors, no caps, calibrated by the human channel

1. **Decision.** A candidate is spoken iff **all three** axes clear their own
   floor (`FR-A5`'s conjunction — no multiplication, so no axis launders
   another):
   - **Confidence** `c`: evidence-derived. History facts: `support` and
     `confidence` from `cochange_pairs`, dampened by staleness (`FR-K7`) and
     recency; capped by trust (`untrusted_repo` provenance can never yield
     high-confidence — `FR-X4`). Human facts: high by construction (`FR-L6`).
   - **Decision-impact** `i`: deterministic ordinal from per-candidate
     properties only — edit-context vs read-context, blast-radius band (count of
     coupled files/tests), zone criticality (`generated`/`build_output`
     touched). **No genre term, no intent term** (`D-18`: intent entered via the
     trigger).
   - **Marginal value** `m`, defined for **all three** Phase A fact classes
     (leaving a genre's own class undefined was a round-2 collapse finding):
     *single-file current-state* facts fail — the agent's own tools surface
     them in one call (AC-1's obviousness clause: a same-directory/same-stem
     pair is suppressed); *cross-file history-derived* facts pass by
     construction (invisible from a cold checkout), as do human-stated facts
     the agent has no channel to; *cross-file current-state* facts (the Reuse
     class) pass **only when comparative or aggregative over a set the agent
     has not enumerated** — a dominance claim over candidates passes, a bare
     count one grep returns fails (P5's own named non-whisper). Dedup is
     separate (AD-16) and is never a cap.
   - **Hazard path (`FR-A5a`):** Warning-genre candidates skip the confidence
     floor; they require only the **noise floor** (real vs coincidental
     evidence: `support ≥ 2` and not sourced solely from an excluded-commit
     class) and are delivered with confidence stated (`FR-D1`).
   - **No volume/count/budget term exists in the code path** (`OL-C1`; AC-3).
     Two candidates clearing the bar at one event are both delivered.
   - **Ship-high defaults, all tunable rows in `tuning` (AD-5), all marked
     illustrative:** non-hazard `c` floor 0.6 with `support ≥ 3`; impact floor:
     speak on edit-context always when other axes pass, on read-context require
     blast-radius band ≥ 2 coupled files; noise floor `support ≥ 2`. Sources:
     the spec's §9 ROSE note (the TSE-2005 operating point is user-tunable;
     the spec lifts no fixed point — these are architect defaults to be
     calibrated on Phase A data, `D-6bar`). Phase A calibration input is the
     human correction channel (`FR-L6`, `FR-D4`); automated adjustment is
     Phase C.
2. **Standard.** `FR-A5`, `FR-A5a`, `OL-C1`, `D-18`, `D-6bar` governing; the
   ROSE grounding for the confidence computation is inherited from spec §9.
3. **Why here.** The bar is where the mission's "would change the decision"
   becomes arithmetic; the conjunction shape is the spec's own (a filter, not a
   relevance oracle), and the hazard bypass is the owner's chosen posture
   (`OL-C4`).
4. **What this is NOT.** Not a multiplicative score (an 0.9-confidence triviality
   would launder past a low impact floor — the exact wrong-check the 2026-08-16
   collapse entry records). Not a precision floor on hazards (suppresses the
   uncertain-but-real warning `OL-C4` chose to voice). Not a top-k selector
   (`OL-C1`). Not a learned bar in Phase A (no automated uptake judgment,
   `D-12`).
5. **Premise verification.** `FR-A5`/`FR-A5a` read at spec §5.2; `OL-C1`,
   `OL-C4` in the ledger; ROSE figures note read at spec §9. No environmental
   premises — design choice over verified spec content. Addresses: `FR-A5`,
   `FR-A5a`, `FR-A6` (floor feeds `c`), `OL-C1`, AC-3, AC-3a, AC-4.

### AD-15 — Genre candidate generators (the seven Phase A genres)

1. **Decision.** One module per genre; each generator states its trigger, its
   store query, its headline fact, and its marginal-value guarantee. Common
   properties: every candidate carries ≥ 1 verifiable pointer (`FR-D1` — a
   candidate whose pointer fails re-resolution at compose time is dropped:
   the rumor rule); text is informative, never imperative (`FR-D2`); evidence
   ratios stated for history facts (`FR-D3`); ⚠ subtype declares fallibility and
   the `ctxoracle correct` path (`FR-D4`).

   | Genre | Trigger | Query / mechanism | Headline (the non-self-servable fact) |
   |---|---|---|---|
   | Orientation `FR-A2a` | `UserPromptSubmit` | prompt tokens → FTS5 over symbols/paths; rank by (match strength × co-change hub degree × `entry_score`, all produced — AD-12/AD-13); join `invariant_members` for one binding invariant **where a matching row exists** — in Phase A `invariants` is written only by the human channel (`note`), so on an un-annotated repo Orientation delivers entry points alone (disclosed, L10; invariant count shown in `status`) | 2–4 entry-point files (+ the binding invariant when one is recorded); **no task-shape landmines** (`D-26` — those fire at the edit) |
   | Coupling `FR-A2b` | `PostToolUse` Read/Grep/Glob | `cochange_pairs` partners of the touched file above bar | partner file(s) with ratio ("17 of its last 20 changes") + commit pointer |
   | Reuse `FR-A2c` | `PostToolUse` Grep/Glob (a functionality search) | searched term → symbols FTS gives the **candidate set**; `symbol_refs` gives each candidate's referencing-file count; X is *canonical* when its count **dominates the runner-up** (≥ k×, tunable, stored) — **and only when every candidate in the set is evidence-comparable**: a candidate whose `symbol_refs` support is structurally absent (a generic-frontend language with no `import_edges` — its count sits at 0 by construction, not by observation) marks the set incomparable and **no dominance crown is claimed** (silence — the safe direction, since dominance arithmetic alone cannot separate a structurally-uncountable true convention from a covered rival). **The discriminator is the candidate's language, not its stored count**: a candidate whose `lang` is not grammar-covered (generic-frontend — AD-12's ext→grammar table produces no `import_edges` for it) is structurally uncounted → incomparable; a grammar-covered symbol whose count is 0 is *observed*-0 and stays comparable, so an unimported grammar symbol is never over-silenced | The **comparative** convention fact: "of the N **symbols matching this search**, X is the one M files use; the runner-up has m" — the set is named for what it is (a lexical match set, restricted to same-kind symbols; FTS cannot certify functional substitutability, so the text never claims it), and the identifier-match heuristic's false-positive class (same-named symbols, matches in comments/strings) is stated in the whisper's evidence, as is the mixed-language caveat (generic-frontend languages have no `import_edges`, so dominance systematically favors grammar-covered candidates — L6). A bare reference count is one grep and never ships (P5); dominance over an un-enumerated alternative set is what the agent cannot cheaply self-serve. No dominant candidate → silence |
   | Consequence `FR-A2d` | `PreToolUse` Edit/Write | coupled **test files** of the target (pairs where partner ∈ `test_map`); zone flag of target | historically-coupled tests + zone flag; never a raw call-site count alone |
   | Warning ⚠ `FR-A2e` | `PreToolUse` Edit/Write | `landmines` rows for target (revert_chain, fix_chatter, human_stated) | the hazard with its evidence and **flagged confidence** (`FR-A5a`) |
   | Completeness `FR-A2f` | `Stop` | session's edited files (`observed_actions`) → un-edited partners above ratio floor | "you changed X but not Y, paired in 9 of its last 10 changes" |
   | Verification `FR-A2g` | `Stop` with done-claim | changed regions (from `outcome='ok'` rows — AD-4's split filter) → `test_map` covering tests, minus test runs observed in `observed_actions` **of either outcome** (a failed run *is* a run — AD-4; a run-and-failed covering test at a done-claim is `FR-A2m`'s Phase B case per `D-27`, and Phase A's duty is only never to assert "not run" over it). The `command_class` classifier is **ternary; classes 1 and 2 are config-enumerated (in `tuning`, AD-5 — tended via `ctxoracle tune`, like every lexicon in this document), class 3 is the default complement** (anything outside both lists — a partial classifier would leave everyday commands with no class and an unstated default, whose unsafe direction re-admits the false "not run"): (1) *recognized test runner* → mapped subtraction (unmappable target ⇒ subtract all); (2) *recognized-innocuous* (a conservative allowlist of command heads that cannot run tests: `ls`, `cd`, `cat`, `git status`-class, `grep`/`rg`, …) → no effect on run-state; (3) everything else → run-state unknown, and **the shipped branch is the weaker honest claim** ("no *recognized* test run touched T; recognized runners: …" — it keeps the genre alive and still headlines the mapping, satisfying AC-8's content assertion), never the strong "not run". **Classification is per pipeline segment**: the command line is split on `&&`, `;`, `\|`, `\|\|` **quote-aware** (operators inside quotes are not split points; quoting the splitter cannot parse → class 3 wholesale; subshell / `sh -c` wrappers → class 3 wholesale); recognized-innocuous requires **every** segment's head on the allowlist; **segments contribute independently** — each runner segment subtracts its run, and any unknown segment still sets run-state unknown (so a runner+unknown compound both subtracts and composes the weak claim); head-matching a compound (`cd pkg && npm test`) as innocuous would re-manufacture the false "not run" (a round-4 finding) | the covering-test **mapping** for the changed region, with the honest run-state clause; run-state never stands alone (AC-8) |

   **The done-claim recognizer (`D-38`):** deterministic in Phase A, reading
   `last_assistant_message` (Stop input, V1): a completion-claim lexicon
   (done/complete/implemented/fixed/finished-class phrases in a concluding
   position) with a conservative bias — no match → ordinary stop, no whisper.
   Its false-fire/miss rates are per-genre diagnostics (`FR-M1`), and it also
   gates the AC-8a outstanding-question line (AD-9). Model-assisted precision is
   Phase B (`D-38`).

   **Landmine sources (Phase A):** deterministic history mining in `ctxoracle
   index`: `revert_chain` (a file appearing in ≥ 2 revert-labeled commits within
   the horizon), `fix_chatter` (≥ k fix-labeled commits touching the file in a
   trailing window, k tunable), plus `human_stated` rows from `ctxoracle note`
   (`FR-L6`). Each row carries evidence and support; the Warning genre states
   them (`FR-D3`).
2. **Standard.** `FR-A2a`–`FR-A2g` and `FR-D1`–`FR-D5` governing; P5 (marginal
   value) is each generator's stated guarantee column.
3. **Why here.** Genre-per-module keeps each generator's marginal-value claim
   testable in isolation (AC-1 through AC-1d each pin one genre's headline).
4. **What this is NOT.** Not a shared "interesting facts" scorer that genres
   filter (blurs each genre's P5 guarantee; the per-genre headline is the
   requirement). Not narration-triggered genres (`FR-A2h`–`FR-A2j` are Phase B).
   Not landmine mining via ML or commit-message sentiment — the deterministic
   classes are checkable and carry their evidence; anything subtler is Phase B/C
   territory.
5. **Premise verification.** V1 (`last_assistant_message` Stop-only), V19
   (tool events carry `tool_name`/`tool_input`; the success/failure event
   split that `observed_actions.outcome` rests on); `FR-A2a`–`FR-A2g`, `D-26`,
   `D-38` read at spec §4/§12. Addresses: those plus AC-1, AC-1a–AC-1d, AC-8.

### AD-16 — Delivery, dedup, session-boundary reconciliation, Stop-time injection

1. **Decision.** Delivery is per consumer (`FR-O6`): a whisper computed for a
   consumer's event returns on that event's response and nowhere else.
   **Dedup (`FR-A4`, `FR-D5`):** `consumer_state` holds a `delivered` set
   (subject keys of whispers sent) and a `read` set (files/symbols the consumer
   has visibly touched, from `observed_actions` — `outcome='ok'` rows only,
   per AD-4's consumer filter: a failed Read is not a read, and leaking
   failure rows into the read set would silently withhold facts about files
   the agent never saw); a candidate whose subject is
   in either set is withheld — the never-repeat property, never a cap.
   **Session boundaries (`D-20`), keyed by `SessionStart.source` (V5), exactly
   as `FR-A4` states them:** `startup`/`clear` → both sets cleaned; `resume`/
   `fork` → both sets reseeded (kept); `compact` → the `read` set is cleared
   (the agent's context lost what it had read) and the `delivered` set is kept.
   **Stop-time (`FR-B4`):** Completeness/Verification whispers are delivered at
   `Stop`/`SubagentStop` via `hookSpecificOutput.additionalContext` — once:
   when `stop_hook_active` is true the handler emits nothing on that channel
   (V3), making the single-cycle bound structural. The deny path is never
   wired to Stop events (AD-10's caller set).
2. **Standard.** `FR-A4`, `FR-D5`, `FR-O6`, `FR-B4`, `D-20` governing; V3/V5 are
   the verified channel facts.
3. **Why here.** Dedup state is exactly the state that must survive process
   boundaries (AD-1), and the reconciliation table is the difference between
   "never repeat" and "never speak again" across a compaction.
4. **What this is NOT.** Not a session-wide shared dedup set (starves subagents
   of facts the main agent heard — `FR-O6`'s per-consumer property). Not
   `decision:"block"` at Stop for delivery (surfaced as an error — V3; the
   spec chose `additionalContext`, `FR-B4`). Not re-delivery suppression by
   time window (a cap in disguise; the bar and the sets are the only filters).
5. **Premise verification.** V3, V5; `FR-A4`, `FR-B4`, `D-20` read at spec
   §5.1/§8/§12. Addresses: `FR-A4`, `FR-D5`, `FR-O6`, `FR-B4`, AC-4, AC-5,
   AC-8, AC-15.

### AD-17 — Self-observability: the diagnostic spine

1. **Decision.** Three surfaces, one source of truth:
   - **`session_log` + `whisper_audit` (store):** per event: candidates
     considered, bar outcomes, delivered/withheld reasons, denies, latency
     (`FR-M1`, `FR-X6`).
   - **`faults` (store) + diagnostics JSONL (file):** self-detected failure
     classes (`FR-M2`), each with a stable code and a detector this
     architecture names: `hooks_not_firing` (SessionStart writes a liveness
     row; `status` flags a session whose events stop arriving while the
     transcript grows — detected at the next invocation, not by a timer),
     `latency_breach` (per-event self-measure > NF-1 numbers),
     `store_corrupt` (**detected on the event path by the failure of the
     actual prepared statements** — never by an integrity scan there: `PRAGMA
     integrity_check` is a single uninterruptible synchronous statement whose
     cost is O(store) — 543 ms measured on a 410 MB store, V8 — so integrity
     scanning runs **off the event path only**: `quick_check` at `init`/`index`
     and in a detached child spawned after `SessionStart`; on event-path
     statement failure the handler goes **fully silent** for that event — no
     whisper either, since candidates and the audit write are store operations
     — with the fault appended to the JSONL channel and `status` flagging it),
     `index_stale` (`index_head` ≠ `HEAD`), `produced_but_undelivered` (audit
     row exists, emission failed), `deny_after_answer_lag`,
     `deny_despite_answer_text`, `deny_loop`, `deny_bypass_suspect`,
     `catchup_incomplete`, `intake_invalidated`, `rebuild_recovered_nothing`
     (all AD-9), `transcript_layout_changed` and
     `unrecognized_user_entry` (AD-11), and two reserved codes whose detectors
     belong to later phases — `model_path_down` (Phase B; Phase A has no model
     path and `status` says so) and `missed_skill_block` (Phase C, `FR-C4`) —
     for which `status` reports "not yet measured (Phase B/C)" rather than 0,
     so absence of measurement is never displayed as health. The `FR-M2` "deny
     outlives its condition" class is covered per axis, with the one named
     gap stated: freshness (state read after same-process catch-up; residual
     lag caught by `deny_after_answer_lag`), and correctness's length-floor
     sub-case (the independent `deny_despite_answer_text` detector, AD-9 —
     the AC-9 induction is exactly that case: a real short answer the
     recognizer misses, asserted to surface as a self-detected fault), while
     correctness's false-stoplist-match sub-case is human-channel-caught and
     self-recovering (AD-9's coverage statement — the deferral exclusion
     forecloses automated detection there, and the claim is scoped to match). "Whisper-only"
     describes precisely one mode: transcript breakage (AD-11 — store healthy,
     denies disabled, whispers continue); store corruption is fully silent.
   - **`ctxoracle status` (`FR-M4`):** plain language: per-genre volume,
     false-fire rate (from `corrections`), **regret rate labelled
     "held-but-unspoken only" and paired with the last seeded-coverage result or
     "coverage not measured live"** (AD-18, AC-18), denies issued, wrongful-deny
     rate (corrections with `verdict='false_fire'` on denies +
     `deny_after_answer_lag` + `deny_despite_answer_text` counts),
     done-claims-with-outstanding-question (per AD-9's counter definition,
     displayed **with its Phase A structural-limit label**), deny-loop and
     bypass-suspect signals, active suppressing conditions (store corrupt,
     layout changed, FTS fallback), and correct-silence announcements (`FR-M3`:
     "observed N events, spoke at M — the silence was the bar working", rendered
     **only** here, never into the agent's context, `D-22`).
   - **`ctxoracle log` (`FR-M5`):** the whisper/deny audit trail per session,
     with evidence and pointers.
2. **Standard.** `OL-10` (the owner cannot catch silent failures) governing;
   `FR-M1`–`FR-M5` are the requirement set; the "never display absence of
   measurement as health" rule generalizes `FR-M4`'s regret-labelling clause.
3. **Why here.** Every fallible mechanism this document introduces (recognizers,
   holds, fallbacks) is paired here with the signal that makes its failure
   visible to a non-programmer.
4. **What this is NOT.** Not outbound telemetry (`FR-X7`). Not agent-visible
   health chatter (`FR-M3` is owner-facing only, `D-22`). Not a fault system
   that only counts (each fault carries detail_json sufficient to reproduce the
   diagnosis — `FR-M5`'s readback intent).
5. **Premise verification.** `FR-M1`–`FR-M5`, `D-22` read at spec §6/§12;
   `OL-10` in the ledger. Addresses: `FR-M1`–`FR-M5`, `FR-X6`, AC-9.

### AD-18 — The Phase A regret proxy and the human channel

1. **Decision.** **Human channel (`FR-L6`, `FR-D4`):** `ctxoracle correct`
   records a verdict against a whisper or deny id (`false_fire` / `missed` /
   `confirm`) with an optional note; `ctxoracle note "<fact>" [--file <path>]`
   records a human-stated fact (landmine/invariant/target correction) with
   human provenance — immediately outranking conflicting mined inference at
   query time (the DAO resolves conflicts human-first, AC-23). A `missed`
   verdict on answer-drift may carry the dropped question's text
   (`ctxoracle correct --missed-question "<q>"`); the text is routed **through
   the same info/request classifier as every other opener** (minus the `?`
   requirement — Max may paraphrase), so it opens `kind='info'` (deny-capable:
   the identical deviation is thereafter denied) or `kind='request'` (tracked:
   it feeds the AC-8a line and the counter, and Phase B's precision inherits
   it), and the CLI's output tells Max which was recorded and what it will do
   — including, on a hash collision with an already-`open` row, **which of
   the three limits the reported miss actually hit** (intake coverage:
   nothing to change, the row exists and is deny-capable; move coverage: a
   Bash-drift miss stays un-deniable per L3; **kind coverage**: the open row
   is `kind='request'`, tracked but not enforced in Phase A per L1 — the CLI
   says which, in plain language, instead of implying enforcement changed). The
   human channel outranks the recognizer without ever bypassing the one
   deny-eligibility invariant (`FR-L6`, `FR-B5`'s under-fire guard for this
   block, AC-2c's answer-drift under-fire clause; a bypassing opener was a
   round-2 collapse finding). Routing per `FR-L7` (AD-5). **Regret proxy (`FR-L4`, Phase A form):** at `SessionEnd`
   (and at `index` refresh), for each store-held fact whose subject region was
   re-edited or reverted in the session (or whose covering test failed in an
   observed test run) while the oracle stayed silent on it, *and* the churn is
   plausibly relevant to the fact — Phase A's deterministic relevance test: the
   churned file is the fact's own subject or its direct pair partner — a regret
   row is recorded. **Outcome semantics of its two `observed_actions` reads
   (both enumerated in AD-4's consumer filter):** the *re-edit* clause consumes
   `outcome='ok'` rows only (a failed Edit is not a re-edit — counting it would
   inflate regret); the *covering-test-failed* clause reads `'failed'` rows, as
   AD-4 states. `status` reports the
   rate under its mandated label, which also notes that the **designed
   silence at a run-and-failed done-claim (the D-27/FR-A2m routing) is
   self-counted here** — so the regret rate carries an expected non-zero
   floor from that subcase and is never misread as pure miss. The proxy's
   noise is a diagnostic concern only (it gates nothing — `FR-L4`).
2. **Standard.** `FR-L4` (existence required; proxy the architect's), `FR-L6`,
   `FR-L7`, `D-36` governing.
3. **Why here.** Phase A's exit requires measured false-fire **and regret** data
   (§11.5); this is the minimal honest proxy that cannot silently gate.
4. **What this is NOT.** Not an uptake judge (`D-12`: Phase A logs uptake
   evidence, judges nothing). Not a coverage measure (a fact the store never
   held is AC-18's seeded-coverage concern — `status` pairs the two so the
   distinction is visible). Not automated demotion input (Phase C).
5. **Premise verification.** `FR-L4`, `FR-L6`, `FR-L7`, `D-36`, `D-12` read at
   spec §11.3/§12. Addresses: those, AC-23, AC-24.

### AD-19 — Security controls (mapped to the threat model below)

1. **Decision.**
   - **Redaction at every ingress (`FR-X1`, T3):** one `security/redact.ts`
     applied to any string entering a store, log, whisper, or diagnostic:
     pattern rules for known secret shapes (keys, tokens, PEM blocks,
     `KEY=value` credential forms) plus a high-entropy-token heuristic;
     redactions are replacements with a stable marker, counted in diagnostics.
   - **Pointer-only composition (`FR-X2`/`FR-X3`, T1):** Phase A whispers carry
     **no verbatim repo-derived text at all** — pointers (`path:line-span`,
     commit hashes), numbers, and names only. This is stricter than the spec's
     minimum (verbatim allowed for mechanically-generated content) and is chosen
     because Phase A has no model in the loop to need quoted context; the
     relaxation, if ever needed, is a Phase B decision. The injection-suspect
     flagger (heuristic lexicon over ingested spans) sets `injection_suspect`;
     suspect content is pointer-only *and* its facts carry `untrusted_repo`
     trust, capping confidence (`FR-X4`, T2).
   - **Audit-before-emit (`FR-X6`, T2/T3):** AD-8's ordering; an unlogged
     intervention does not exist.
   - **Least privilege (`FR-X5`, T4):** no credentials anywhere; the only
     network use in the whole tool is the Phase B piggyback (absent in Phase A
     code); stores and diagnostics 0700; the handler reads the repo and the
     transcript read-only; the only in-tree write is `init`'s settings entry
     (`D-9`).
   - **Adversarial fixtures (`FR-X8`):** AC-11's fixture repo plants secrets
     (in history and in zone evidence) and injection payloads (in file content,
     commit messages, and a question text — the deny reason quotes the user's
     question, so the fixture asserts the reason is emitted as the user wrote
     it and never treated as oracle instruction).
2. **Standard.** OWASP LLM01/LLM02 2025, the OWASP prompt-injection cheat sheet
   (pointer-by-default), ASI06 (trust labels on persistent memory), the secrets
   cheat sheet (never store secrets — redaction before persistence): all
   inherited from spec §9 with the spec's own verification dates; ASVS
   chapters mapped below.
3. **Why here.** The oracle's attack surface is precisely "reads history,
   injects text agents act on" (spec §7); every control lands on one of the
   four named threats.
4. **What this is NOT.** Not a deny-lexicon output filter as the *primary* T1
   control (evasion surface; pointer-only composition removes the quoted-text
   channel entirely in Phase A). Not encryption-at-rest (single-user local
   stores under 0700; threat model has no local-attacker actor in scope —
   §2.3). Not network egress "for updates" (none exists).
5. **Premise verification.** Spec §7 and §9 rows read; `FR-X1`–`FR-X8` at §7.2.
   The deny-reason-quotes-user-text observation is from AD-9's design (the only
   verbatim text a response ever carries is the user's own question, quoted back
   to the agent that already has it — no new injection surface). Addresses:
   `FR-X1`–`FR-X8`, T1–T4, AC-11.

### AD-20 — CLI surface and `init`/`deinit`

1. **Decision.** Verbs: `init` (environment checks: Node ≥ 22.16, git presence,
   FTS5 probe; store creation; repo-key derivation with mode display — and when
   re-running `init` would **change** an existing store's keying mode (e.g.
   after the owner unshallowed a clone outside the tool), it says so in plain
   language and offers the `export`/`import` migration before switching, so
   following the documented unshallow path never silently orphans the
   accumulated store; hook wiring into `.claude/settings.json` with a
   `"ctxoracle"` marker on each entry; first index; plain-language summary),
   `deinit` (remove marked entries; `--purge` deletes the project store),
   `index [--full]`, `status`, `log [--session <id>]`, `correct`, `note`
   (`--global` writes a cross-project lesson to the global store; plain `note`
   routes to the project store per `FR-L7`), **`tune <key> <value>`** (the
   plain-language writer for every tunable this document marks: **numbers**
   (`tune <key> <n>`) and **list-valued lexicon keys** — the communicative-verb,
   information-object, and command-classification lexicons — edited with
   add/remove element semantics (`tune lexicon.communicative +summarize` /
   `-summarize`), the surface the owner uses to shrink the under-enforcement
   losses clause (iv) and L1 name; every tunable this document marks has a
   writer here. `tune` with no arguments lists the keys, their current values
   (list keys show their members), and their defaults), `export <file>`
   / `import <file>`, `hook <event>` (the internal entry; undocumented in
   help). `init` is idempotent; re-running repairs wiring. All output is plain
   language (`OL-11`: the reader is a non-programmer).
2. **Standard.** Spec §10 (the CLI contract names exactly these verbs as the
   minimum); `D-9` (init's write); `OL-11` (plain language).
3. **Why here.** The CLI is the owner's entire interactive surface; everything
   else is ambient.
4. **What this is NOT.** Not a config-file editor (tuning lives in the store,
   AD-5). Not an uninstaller that leaves wiring behind (deinit must restore the
   pristine tree — AC-7 diffs it).
5. **Premise verification.** Spec §10 read; `.claude/settings.json` as the
   project-settings hooks location per the current settings docs (fetched
   2026-08-29). Addresses: spec §10, `D-9`, AC-7.

### AD-21 — Degraded mode, recursion guard, and the piggyback seam (Phase A posture)

1. **Decision.** Phase A contains **no model call**; every Phase A behaviour is
   the degraded mode's behaviour, so `FR-J2`/`FR-J3` are satisfied by
   construction and AC-12's Phase A assertions (deterministic genres and deny
   plumbing run model-free; nothing model-free is switched off) are the system's
   only mode. The **piggyback seam** is fixed now for Phase B: a single
   `model/invoke.ts` interface whose implementing command is the V9-verified
   invocation (`claude -p --model <small> --tools "" --max-turns 1
   --output-format json`), run with `CTXORACLE_INTERNAL=1` in env, cwd outside
   the repo, and a scrubbed environment; `--bare` is banned (V10 — it severs
   host auth). The per-environment probe cache (`env_capabilities` —
   `ok`/`failed`/`untested`, so degraded mode is entered deterministically and
   announced, `FR-J2`/`FR-M4`) is **specified here and created by the Phase B
   migration alongside its writer**, per AD-4's table-creation criterion —
   Phase A performs no probe because it makes no model call. **Recursion guard (`FR-J4`):** every process
   the oracle spawns (reindex, future model calls) carries
   `CTXORACLE_INTERNAL=1`; the handler's first act is to exit 0 when it is set
   (AD-7); cwd isolation keeps a future model call's own hooks from resolving
   this repo's wiring. AC-21's full exercise (a model call emitting hook events)
   is Phase B; the guard mechanism ships and is unit-tested in Phase A.
2. **Standard.** `OL-2`/`OL-7` (piggyback, no credentials), `FR-J2`–`FR-J4`,
   `D-6` (guard as property), NF-1 (V9's 4.4 s pins the model call off-path).
3. **Why here.** Fixing the seam now is what makes Phase B additive; leaving it
   to Phase B would invite the redesign §11.5 forbids ("the model never sits on
   the deny path" must be structurally true from day one).
4. **What this is NOT.** Not a degraded-mode *build stage* (`FR-J3` — it is a
   runtime posture; Phase A happens to live entirely inside it). Not an API-key
   fallback (rejected, `OL-7`). Not `--bare` (V10).
5. **Premise verification.** V9, V10, V11 executed this session; `FR-J2`–`FR-J4`
   read at spec §11.2; `OL-2`/`OL-7` in the ledger. Addresses: `FR-J2`, `FR-J3`,
   `FR-J4`, `OL-2`, `OL-7`, AC-12, AC-21 (mechanism).

### AD-22 — The deferred-delivery contract (`FR-J5`) — semantics fixed now, built in Phase B

1. **Decision.** The `FR-J5` semantics are fixed here as **constraints on the
   Phase B design**, so they are never re-litigated per genre later: a
   computed-but-undelivered candidate is held with its consumer, its
   computed-at event, and its evidence snapshot; it is delivered only at the
   **next event where it re-passes §5.1/§5.2 relevance for that consumer**;
   it is dropped at that consumer's termination; and **every pointer is
   re-resolved at delivery time** — evidence no longer holding → drop, counted
   as `dropped_stale` in diagnostics (`FR-D1`'s rumor rule on the deferred
   path). The `deferred_queue` table and its routines are **created by the
   Phase B migration alongside their writers**, per AD-4's table-creation
   criterion — no Phase A genre defers delivery (every Phase A candidate is
   computed and delivered inside its own event), so nothing ships dormant.
2. **Standard.** `FR-J5`, `D-37` governing (both state properties whose
   existence is required; neither requires a Phase A implementation).
3. **Why here.** These are spec properties, not Phase B design freedoms; fixing
   them now is what keeps Phase B's async genres from re-opening the post-hoc
   whisper posture RETHINK §3 rejects.
4. **What this is NOT.** Not an open-ended hold (the bound is the next relevant
   event or termination — `FR-J5`). Not a Phase A table or delivery path
   (shipping either now would be the dormant machinery AD-4's criterion bars —
   the inconsistency the round-1 reviews flagged and this revision removed).
5. **Premise verification.** `FR-J5`, `D-37` read at spec §11.2/§12. Addresses:
   `FR-J5`, AC-25 (a Phase-B criterion; the constraints above are its bar).

### AD-23 — Latency discipline and the watchdog

1. **Decision.** Every handler run self-measures wall time; the diagnostics row
   records it; `status` reports p50/p95/max per event type against NF-1 (p95 ≤
   1.5 s, ceiling 3 s). The watchdog is **cooperative, and stated as such** — a
   timer cannot preempt a blocked Node event loop, so "hard self-exit at
   2500 ms" is implemented as deadline checks between bounded work slices, and
   its guarantee is only as strong as the bound on the longest single
   synchronous call. That inventory is therefore part of this decision —
   every blocking call on the event path, with its bound: store statements
   (indexed lookups and single-row writes, bounded by `busy_timeout` 100 ms +
   one retry, AD-26; **no O(store) statement is permitted on the event path**
   — integrity scans run off-path, AD-17); transcript reads (bounded slices,
   resumable bookmark, AD-9); stdin (bounded by the hook payload);
   **compose-time pointer re-resolution** (AD-15's rumor-rule check — span
   reads are seek-and-read of the cited span ± slack, never whole-file, and
   skipped entirely for files over the AD-12 ingestion cap; commit-hash
   pointers re-resolve against the store's own `commits` table, **never a
   `git` subprocess on the event path**); and the `SessionStart`-only items
   (the staleness check's `HEAD` read — a bounded `.git` file read, not a
   subprocess — and the detached reindex/`quick_check` spawns,
   fire-and-forget, never awaited); and the `SessionEnd`-only fold (AD-5's
   `whisper_stats` aggregation — indexed rows since the per-project watermark,
   never on a deny-capable event). Under that
   inventory the deadline fires between slices well inside the wired
   `"timeout": 5`, and the V6 fail-closed hazard (a timed-out `PreToolUse`
   hook prevents the tool from running) is avoided **for the enumerated
   paths** — not declared "unreachable" in the abstract; an unenumerated
   blocking call is exactly what AC-10's large-store fixture exists to catch.
   A deadline fire writes `latency_breach` to the JSONL channel.
2. **Standard.** NF-1 (`D-31` numbers) and `FR-O3` governing; V6 the verified
   hazard.
3. **Why here.** The one contract behaviour that could make the oracle *block by
   accident* is the hook timeout; the watchdog converts it to silence.
4. **What this is NOT.** Not harness-timeout reliance (that path is fail-closed
   on PreToolUse, V6). Not a lower wired timeout (1–2 s) — the harness kill
   racing the watchdog reintroduces the hazard the margin removes.
5. **Premise verification.** V6 (timeout semantics, fetched 2026-08-29); V8 (the
   normal path is ~50 ms, so the watchdog is a tail-risk device, not a working
   regime). Addresses: NF-1, `FR-O3`, AC-10.

### AD-24 — Test and fixture architecture (the Phase A acceptance criteria made mechanical)

1. **Decision.** `node:test` suites in three tiers:
   - **Unit:** recognizers (question/clear/move/done-claim lexicons and the
     info/request classifier against a labeled corpus), bar arithmetic,
     redactor, repo-key rule (full vs shallow fixtures — V13's scenario
     reproduced in a purpose-built pair), reader discrimination (V12 shapes,
     including the marker-absent probe-mode shape).
   - **Fixture repos + replay:** generated git repositories with planted
     history (a non-obvious coupling pair, an obvious same-dir pair, revert
     chains, a >30-entity commit, a merge commit, beyond-horizon commits, a
     planted secret, an injection payload — including question-shaped text in a
     hook-feedback and a task-notification transcript entry, asserted never to
     open a question, per V12/S1 — and **one over-threshold (>1 MB) file
     carrying a seeded fact**, so the AD-12 ingestion cap's blind spot is
     measured rather than assumed benign) plus recorded hook-event streams
     replayed through the real handler binary. Each Phase A criterion pins its
     assertion: AC-1/1a–1d (per-genre headlines — AC-1b pinned to the
     **comparative** Reuse headline: dominance over the named candidate set,
     from `symbol_refs`; a bare reference count fails the fixture; a
     **mixed-language case** where a generic-frontend symbol is the true
     convention makes the set incomparable, so the fixture asserts **silence**,
     no false crown; an **unimported-grammar case** where a grammar-covered
     symbol with an *observed* count of 0 is in the set, and the dominance
     comparison is still made among the comparable candidates so it is not
     over-silenced; and a **same-name false-positive case** where a
     comment/string collision fires **with the false-positive caveat in the
     whisper's evidence and its confidence capped** — `symbol_refs` counts such
     matches, so the fixture pins honest disclosure, not exclusion), AC-2
     (structural deny confinement — AD-10's import-graph test + built-output
     grep), AC-2a and AC-2a-i's allow-half (deny plumbing with
     fixture-controlled state), AC-3/3a/4/5/6 (bar, hazard, dedup, boundaries,
     corpus floor), AC-7 (init/deinit tree diff), AC-8, AC-8a (including the
     **verbose-done documented non-fire** — the clear-all-prior lean means a
     narrating finisher does not trip the line; the counter's
     `generic_text_all_prior` clause is asserted instead), AC-9 (each fault
     class induced — the deny-outlives-condition induction is a **real short
     answer the clear recognizer misses**, asserted to surface as
     `deny_despite_answer_text`), AC-10 (induced failure + latency, **including
     a large-store case** against AD-23's inventory), AC-11 (planted
     secret/injection), AC-13, AC-14 (whisper form validator), AC-15
     (subagent event keyed delivery), AC-17 (config-added language), AC-18
     (seeded-fact coverage run), AC-19 (**record-level** round-trip: a
     canonical-order per-table dump of the original store diffed against the
     imported store — the spec's "record-identical"; a byte-compare is pinned
     nowhere, because a `VACUUM INTO` copy is *not* byte-identical to its
     source, demonstrated by execution in the round-2 review), AC-20
     (cold-container install+index in a clean container), AC-22 (idle
     silence), AC-23 (human-correction precedence, including
     `--missed-question` routed through the classifier), AC-24 (regret
     true-positive and no-inflate, the failure clause fed by
     `observed_actions.outcome` via the `PostToolUseFailure` wiring, V19).
     **Answer-drift cases:** **re-ask after a blanket
     clear** (asked → narration-cleared → re-asked verbatim → the next
     mutating move is denied again — the open-scoped dedup index at work);
     **request-form tracked-not-denied** (a "can you fix X?" opens
     `kind='request'`, the fix-edit is *not* denied, the row still feeds the
     AC-8a line and counter); **communicative-verb request forms stay
     deny-capable** ("could you tell me why X fails?" opens `kind='info'` and
     a deviating `Edit` is denied; the `OL-C3` escalation re-ask "can you
     please answer my question?" opens `kind='info'` via the information-object
     lexicon (object head "question") and re-arms the block after a blanket
     clear — classifying it `request` **fails** this fixture); **the
     rhetorical-lead-in wrongful-deny** ("ugh, why is CI always so flaky??
     anyway please add the null check to `parser.js`" — the rhetorical opens
     `kind='info'` because clause (iii)'s small stoplist does not catch it, so
     the requested edit is **wrongfully denied once** until a narrating turn
     clears it — the second wrongful-deny residual member, owned in L1 and
     counted on the wrongful-deny rate); **the object-classification corpus**
     ("can you rename the helper?" → `request`, the rename-edit not denied;
     "can you show me a demo?" → `request` (via the artifact-object lexicon and,
     equivalently in Phase A, the unlisted-object default), the demo-edit not
     denied; "can you show me the error?" → `info`, deny-capable; "could you
     summarize the error?" → `request`, the documented under-enforcement loss;
     "can you show me a **prototype**?" → `request` (unlisted object noun fails
     safe); "could you tell me why the login **test** fails?" → `info` (the
     wh-complement takes precedence over the artifact noun inside it); "could
     you confirm the version number?" → `info` (information-lexicon object));
     **failed actions, change/read consumers, and the bypass diagnostic** (a
     failed `Edit` appears in no Completeness/Verification changed-regions
     computation and records no re-edit regret row — AD-4's split filter,
     `'ok'`-only for both; a successful (`'ok'`) file-writing Bash command in
     the same turn as a deny raises `deny_bypass_suspect`, a failed one does
     not); **run-state honesty and compound composition** (a session of
     innocuous commands still fires the strong "not run" clause; a session
     containing `make check` composes only the weaker recognized-runners claim;
     a covering test **run-and-failed** (`PostToolUseFailure` row) at a
     done-claim yields **neither** "not run" **nor** "no recognized run" — the
     run subtracts, either outcome; the compound `cd pkg && npm test` subtracts
     while `cd pkg && make check` composes the weak claim; and `npm test &&
     make integration` **both** subtracts npm's covering tests **and** composes
     the weaker "no recognized run" claim for `make` — segments contribute
     independently); AC-23's efficacy clause is pinned to a
     **post-session** correction reaching the global store (the watermark
     aggregation, AD-5); AC-1a's fixture covers **both entry-point shapes**
     (a low-in-degree `main`/`cli` file carried by path markers, and a
     high-in-degree hub). Two **build-time verifications** are named here
     because fixtures cannot settle them from inside this container: marker
     presence (`origin.kind:"human"`) on a transcript from the owner's actual
     interactive environment, and whether platform-injected turns (task
     notifications, scheduled wakes) fire `UserPromptSubmit` (L11) — each
     resolved with a real captured transcript/session before the block's
     fixtures are trusted.
   - **Deferred criteria stated:** AC-2a-ii, AC-2b, AC-2c's skill-block
     under-fire clause, AC-16, AC-21 (full), AC-25 (full) are Phase B/C per the
     spec's own phasing (§14 "Phase-B and Phase-C acceptance"); **AC-2a-i is
     split like AC-2c** — its allow-half (a subagent is not denied; reads and
     spawns run freely) is Phase A, its deny-half (a spawn *to go do other
     work* is denied) is Phase B, since `Task` is never deny-eligible in Phase
     A (AD-9); AC-2c's answer-drift clauses (over-fire, and the FR-L6
     under-fire correction path) are Phase A here (AD-9, AD-18). The
     traceability matrix carries each with its phase.
2. **Standard.** Spec §14 governing (fixture-and-replay is its stated method);
   the "induce each fault class" discipline is `FR-M2`'s test shape.
3. **Why here.** The exit of Phase A is measured data on a real repo plus these
   criteria passing; a criterion without a pinned mechanical assertion is the
   wrong-check trap.
4. **What this is NOT.** Not live-session e2e as the primary tier
   (non-deterministic; replay is reproducible). Not mocks of the store (the
   real engine is 2 ms — V8; mocking it would test the mock).
5. **Premise verification.** Spec §14 read in full; V8, V12, V13 ground the
   fixture designs. Addresses: §14's Phase A set, `FR-X8`.

### AD-25 — Packaging and install

1. **Decision.** One npm package (private to this repo in Phase A;
   `middleware/context-oracle/ctxoracle/`), `bin: {ctxoracle}`, runtime deps
   exactly `web-tree-sitter` + `tree-sitter-wasms`, **no postinstall scripts,
   no native code, no prebuilt-binary downloads** (C-3; V14 confirms both deps
   comply). Install paths: `npm install -g <path/tarball>` or `npx` from the
   repo — both work in a cold container over the harness's own network access.
   Build: `tsc` only. Versioned `schema_version` with forward-only migrations
   applied at open.
2. **Standard.** C-3 governing; ASVS 5.0 V15 (Secure Coding and Architecture)
   dependency hygiene (the no-postinstall rule).
3. **Why here.** Install ceremony is the first thing a sandbox breaks; the
   dependency surface is the supply-chain surface (T4-adjacent).
4. **What this is NOT.** Not a published registry package in Phase A (nothing
   external consumes it; publishing is a later owner-visible step). Not a
   bundler pipeline (tsc output is sufficient; fewer moving parts).
5. **Premise verification.** V14 (registry metadata: no install scripts, no
   deps); C-3 read at spec §8. Addresses: C-1, C-3, AC-20.

### AD-26 — Concurrency

1. **Decision.** Hooks can run in parallel (multiple matching hooks; overlapping
   events), so multiple handler processes may touch one store concurrently:
   WAL + `busy_timeout=100ms` + single-transaction writes per event + retry-once
   on `SQLITE_BUSY`; on second failure the event completes whisper-less
   (fail-open) with a `store_busy` diagnostic. The detached reindex takes a
   directory lock; the handler never waits on it (staleness merely lowers
   confidence meanwhile, `FR-K7`). Audit-before-emit ordering (AD-8) holds per
   process; ids are ULIDs so concurrent writers never collide.
2. **Standard.** SQLite WAL semantics (readers don't block the writer; one
   writer at a time) — engine-documented behaviour exercised by the V8 probe;
   `FR-O3` for the give-up path.
3. **Why here.** The no-daemon model (AD-1) moves contention to the store; WAL
   is the mechanism that makes that safe, and the give-up path keeps NF-1.
4. **What this is NOT.** Not a global write queue (a daemon in disguise). Not
   long `busy_timeout` (blocks the event path — NF-1).
5. **Premise verification.** WAL enabled and exercised in V8; `FR-K7`, `FR-O3`
   read at spec §11.1/§8. Addresses: NF-1, `FR-O3`, `FR-K7`.

### Numbered reasoning chain — the decisions that met the Phase 8 trigger

The one decision where multiple valid approaches compete and a wrong choice
means rework across components is the **process model** (AD-1) joint with
**where qa-state lives** (AD-9); they were reasoned as one chain:

1. NF-1 gives 1.5 s p95; a deny decision must be synchronous inside it.
2. The deny decision needs question/answer state; the state needs transcript
   classification; classification cost is proportional to the *delta* since the
   last look, so someone must hold a bookmark.
3. A daemon can hold the bookmark in memory — but then state dies with the
   daemon, and `FR-A4`/`D-20` already force per-consumer state into the store
   for dedup, so the store must hold bookmarks anyway.
4. If the store holds all state, the daemon's remaining value is amortizing
   process start; V8 measures that at ~50 ms against 1500 ms — noise.
5. Therefore (revising the 2026-07 record's D2, whose governing constraint no
   longer exists): no daemon; every event is a fresh process against the store.
6. Consequence check: catch-up work per event is the transcript delta — bounded
   by what the agent produced since the last event, typically a few KB; parse
   cost is linear and local. Worst case (a giant paste) is bounded by the
   watchdog (AD-23) → silence, never an error. The chain survives.

No other decision met the trigger (three-plus interacting alternatives with
cross-component rework risk); the weighted-matrix candidates (store engine,
runtime) each had a constraint-decisive axis recorded in their decision entries,
which is why no separate matrix appears for them: C-3 eliminates every
native-code option before weighting begins, and presenting a matrix whose
outcome a hard constraint predetermines would be decoration.

### Pre-delivery multi-perspective review (Gate A)

- **Planner:** "Where would I have to make an architectural call inline?" — The
  places a planner most plausibly stalls were checked: recognizer stoplists
  (AD-9 names the classes and their biases; the exact word lists are
  implementation vocabulary, not architecture), bar defaults (numbers given,
  marked tunable, storage named), schema (given), event wiring (given), fixture
  set (enumerated). No inline architectural calls found remaining.
- **Reviewer:** "Could I verify a build against this?" — Each decision names its
  addressed requirements; the traceability matrix below is the checklist; AC-2's
  structural test and AD-24's per-criterion pins make the two owner objectives
  mechanically checkable.
- **Stakeholder:** "Do I know what was chosen and what it costs?" — The costs
  are stated where they live: Phase A's answer-drift coverage is deliberately
  low (AD-9 §4, Limitations L1); the generic language frontend is weaker than a
  grammar (L6); the regret proxy is noisy by design (AD-18). Synthesis: no
  perspective-specific gaps requiring document changes were found beyond those
  now recorded in Limitations.

---

## Threat model

In scope per spec §7 (the four named threats; solo-local scope excludes
multi-user actors, §2.3). Each in the hypothesis-driven shape.

**T1 — Indirect prompt injection.**
*Observation:* repo content (file text, commit messages, zone evidence) flows
into whispers an agent acts on. *Question:* can crafted repo content become an
instruction to the agent? *Hypothesis:* injection requires a verbatim-text
channel from repo to whisper; if whispers carry only pointers, names, and
numbers, the channel is severed (variables: composition rules; assumption: the
agent treats numbers/paths as data). *Experiment (control):* AD-19's
pointer-only composition + suspect flagging; AC-11 fixture plants payloads in
file content, commit messages, and zone evidence, asserting no payload text
appears in any whisper and no payload alters oracle behaviour. *Analysis:* with
no verbatim channel in Phase A, residual surface is names themselves (a
malicious *filename* quoted in a pointer) — bounded by path-syntax
normalization in the composer. *Conclusion:* T1 is controlled by construction
in Phase A; the control is re-examined when Phase B introduces model prompts
(the seam notes it).

**T2 — Store poisoning.**
*Observation:* stores persist derived facts; history is attacker-writable in
principle (a cloned repo's history is input). *Question:* can crafted history
plant false high-confidence facts or wrongful denies? *Hypothesis:* poisoning
matters only if low-trust input can reach high-confidence output or the deny
path (variables: trust labels, confidence caps, deny inputs; assumption: the
deny path consumes only transcript-derived state, never repo content).
*Experiment (control):* `FR-X4` trust caps enforced by DAO CHECK constraints
(AD-4); the deny path's inputs are structurally limited to `questions`/
`classify_state`, whose rows are created at runtime by exactly **three** openers, each
running the same info/request classifier: the `UserPromptSubmit` `prompt`
field (intake), transcript entries carrying the human markers
(`origin.kind:"human"`, not `isMeta` — AD-9/AD-11), and the owner's own CLI
correction (AD-18 — Max at his own terminal, inside the trust boundary).
(`ctxoracle import` restores previously-classified rows wholesale — an
archival writer, not a runtime opener, in the same trust class as the CLI:
Max importing his own export at his own terminal.) Repo
content, hook-script output, and task-notification **transcript** text — the
last partly authored outside the machine — are structurally outside all three
(the V12 enumeration is what closed the transcript door; treating "string
content" as "the user" would have made any hook or notification an injection
channel into the deny path). The intake door carries one **assumption, named
as such**: whether platform-injected turns can fire `UserPromptSubmit` is
undocumented (L11 — a build-time verification). The design does not rest on
it: at reconciliation, an intake row whose matching transcript turn carries
an affirmatively non-human marker is **voided**
(`closed_by_kind='intake_invalidated'` + fault), so if the assumption fails,
an injected **marker-carrying** question survives at most one catch-up; a
**marker-absent** synthetic class is not voidable — voiding on absence would
erase real questions in marker-less modes, so those rows are closed only by
the ordinary clear lean: escapable, auditable on the FR-X6 trail, and
**counted when corrected** — the automated wrongful-deny detectors cannot
see this class, since narration blanket-clears it before they accumulate
(the L11 residual — bounded for the marker-carrying class, named-not-hidden
for the marker-less one). AC-11's fixture plants question-shaped text in a
hook-feedback and a task-notification entry, asserting no question opens and
that a synthetically-matched intake row voids. *Analysis:* the worst
repo-content attack degrades whisper quality (visible in corrections), not
agent liberty; qa-state poisoning requires forging human markers on the
user's own transcript — local-file tampering, outside this threat model's
actors (§2.3) — or the unverified intake path, where the voiding guard
bounds the marker-carrying class to one catch-up and the marker-absent
residual is L11's (escapable, clear-lean-closed, auditable and correctable —
counted when corrected).
*Conclusion:* controlled — by structure at the transcript and CLI doors, and
by the voiding guard plus a named build-time verification at the intake
door; both residuals are stated, not hidden.

**T3 — Secret disclosure.**
*Observation:* history and files contain secrets; whispers/logs/stores persist
derived text. *Question:* can a secret reach a whisper, store, log, or export?
*Hypothesis:* only strings that cross an ingress can leak; one redaction
choke-point at every ingress bounds the surface (variables: ingress
enumeration; assumption: the enumeration is complete — file content, commit
messages, zone evidence, transcript text, CLI note input). *Experiment
(control):* AD-19's redactor at all five ingresses; AC-11 plants secrets in
history and zone evidence and asserts absence everywhere including export
files. *Analysis:* residual: a secret shaped like none of the patterns and
low-entropy — accepted as residual risk (Limitations L5); pointer-only
composition means the whisper channel cannot quote it even unredacted.
*Conclusion:* controlled to the stated residual.

**T4 — Over-privilege.**
*Observation:* the oracle runs inside the user's session with the user's file
access. *Question:* what could a compromised oracle do? *Hypothesis:* its
blast radius is its own privileges: no credentials, no network (Phase A), repo
read-only + one wiring write, stores under `~/.ctxoracle` (variables: process
env, spawn set; assumption: dependency count stays at two WASM packages).
*Experiment (control):* `FR-X5`/AD-25 (no credentials, no postinstall, two
deps); AC-11 asserts no network egress during any operation including
export/import; the spawn set is enumerated (git, reindex-self) and carries the
internal guard. *Analysis:* the deny path adds a new *availability* privilege —
the power to wrongly halt an agent's action; its abuse case is covered under
T2's analysis and bounded by fail-open (no deny on any failure) and by
wrongful-deny visibility (`FR-M4`). *Conclusion:* least privilege holds;
availability abuse is measurable and self-clearing.

## ASVS verification mapping (ASVS 5.0, applicable subset)

Security is in scope; the applicable ASVS areas for a local, single-user,
no-auth CLI (authentication, session management, and access-control chapters are
N/A per spec §2.3 — no multi-user surface) map as:

| ASVS 5.0 chapter | Decision | How |
|---|---|---|
| V1 Encoding and Sanitization / V2 Validation and Business Logic | AD-11, AD-19 | marker-based entry discrimination (never content-shape); injection-suspect flagging at every ingress; pointer-only composition |
| V5 File Handling | AD-12 | size caps on file ingestion (>1 MB / >20k lines path-only, with diagnostic) |
| V16 Security Logging and Error Handling | AD-7, AD-17 | fail-open silent edges; non-droppable audit; fault classes with stable codes |
| V14 Data Protection | AD-3, AD-19 | 0700 stores; redaction before persistence; no telemetry |
| V15 Secure Coding and Architecture | AD-2, AD-25 | two WASM-only deps, no postinstall, no native code; single-writer seams for the dangerous primitives |
| V13 Configuration | AD-5, AD-20 | tuning in-store with provenance; idempotent init; deinit restores pristine tree |

(Chapter names per ASVS 5.0's own chapter files; the authentication, session
management, and authorization chapters — V6/V7/V8 in 5.0 — are N/A per spec
§2.3: no multi-user surface exists.)

## Traceability matrix

Every spec requirement key, mapped to decisions or explicitly deferred with its
phase. (ACs are mapped to the test architecture; "AD-24" alone means the
criterion is pinned there and its mechanism lives in the named decisions.)

| Spec key | Where addressed |
|---|---|
| FR-A1 | AD-14, AD-15 (the bar + triggers are the Phase A computation of the single question) |
| FR-A2 (genre set) | AD-15 (Phase A genres); model-dependent genres and FR-A2k phase-deferred per §11.5 (rows below) |
| FR-A2a–FR-A2g | AD-15 |
| FR-A2h, FR-A2i, FR-A2j, FR-A2m | Deferred — Phase B (§11.5); seams: AD-21, AD-22 |
| FR-A2k | Deferred — Phase C (§11.5); Phase A lays deny plumbing (AD-10) and audit signal (AD-17) |
| FR-A2l | AD-9 |
| FR-A4 | AD-16 |
| FR-A5, FR-A5a | AD-14 |
| FR-A6 | AD-13 (floor), AD-14 (feeds confidence) |
| FR-B1, FR-B2 | AD-9 |
| FR-B3 | AD-10 |
| FR-B4 | AD-16 (delivery), AD-9 (outstanding-question line) |
| FR-B5 | AD-9 (leans per error direction), AD-17/AD-18 (visibility) |
| FR-C1, FR-C1a, FR-C2, FR-C3, FR-C4 | Deferred — Phase C (§11.5, and the Scope reconciliation) |
| FR-D1–FR-D5 | AD-15 (form, pointers, evidence), AD-16 (dedup), AD-18 (FR-D4 correction path) |
| FR-J1 | AD-15 (deterministic candidate generation is the always-available first stage; model stage Phase B) |
| FR-J2, FR-J3 | AD-21 |
| FR-J4 | AD-21 (mechanism), AD-7 (guard check) |
| FR-J5 | AD-22 (contract now, exercised Phase B) |
| FR-K1 | AD-12 |
| FR-K2 | AD-13 |
| FR-K3–K5 (the spec's range form for the fact schemas) | AD-4 (schemas), AD-15 (Phase A writers: landmine mining, human channel) |
| FR-K6 | AD-4 |
| FR-K7 | AD-12 (staleness detection), AD-14 (confidence dampening) |
| FR-K8 | AD-3 |
| FR-K9 | AD-5 |
| FR-L1 | AD-4, AD-17 |
| FR-L3, FR-L3b | Deferred — Phase C (§11.5); Phase A records their input data (AD-17, AD-18) |
| FR-L4 | AD-18 |
| FR-L6, FR-L7 | AD-18, AD-5 |
| FR-M1–FR-M5 | AD-17 |
| FR-O1 | AD-6, AD-11 |
| FR-O2 | AD-6, AD-7 (channels per V2/V3/V5) |
| FR-O3 | AD-7, AD-23, AD-26 |
| FR-O5 | AD-6 (no timer path exists; every firing is a mapped event) |
| FR-O6 | AD-9 (block scope), AD-16 (delivery scope) |
| FR-X1–FR-X8 | AD-19 (X8 fixtures in AD-24) |
| C-1 | AD-2, AD-25 |
| C-2 | AD-2 (premise superseded per V7; requirement met by stock engine) |
| C-3 | AD-2, AD-12, AD-25 |
| C-4 | AD-6, AD-7 (verified facts V1–V6, V15/V16, V18/V19 at the boundary) |
| C-5 | No MCP sampling anywhere in the design (nothing to map; stated for completeness) |
| C-6 | AD-12 |
| NF-1 | AD-1, AD-23, AD-26 |
| P1–P9 | P1/P5/P6: AD-14, AD-15; P2: AD-9/AD-10 (blocks confined) + whispers advisory throughout; P3: no agent ceremony anywhere (AD-6's channels are ambient); P4: AD-4 (provenance structural); P7: Phase A substrate AD-17/AD-18 (loop closes Phase C); P8: AD-3, AD-20; P9: AD-14 (`i` carries no genre term), AD-15 (genre modules peer, none privileged) |
| D-2…D-41 (all spec-§12 judgments) | Honored where each binds: D-2/D-32→AD-9/AD-10 (blocking model); D-4→AD-18 (⚠ corrected via CLI); D-6→AD-21 (recursion guard as property), D-6bar→AD-14 (combinator); D-7/D-8→AD-13 (corpus floor only, no adoption window); D-9→AD-20/AD-6; D-12→AD-14/AD-18 (no automated uptake judgment; human channel is the calibration input); D-15→AD-12 (with C-6); D-16→AD-16; D-18→AD-14; D-20→AD-16; D-21→AD-21 (degraded mode is runtime posture, not a build stage), D-21b→AD-17 (`log` readback); D-22→AD-17; D-23→ this document's citation discipline (retired IDs never cited as live); D-25→ deferred with FR-L3b (Phase C); D-26→AD-15; D-27→AD-15 (FR-A2g catches *unverified*; general *unfinished* is Phase B's FR-A2m); D-28→AD-14 (hazard path); D-31→AD-23; D-33→AD-2 (revisited and re-affirmed with V7/V8); D-34→AD-16; D-35→AD-9/AD-18; D-36→AD-18; D-37→AD-22; D-38→AD-15; D-39/D-41→AD-9 |
| AC-1, AC-1a–1d | AD-24 (mechanisms: AD-13, AD-15) |
| AC-2 | AD-24 (mechanism: AD-10) |
| AC-2a | AD-24 (mechanism: AD-9) |
| AC-2a-i | Split by phase (AD-24): allow-half (subagent not denied; reads/spawns free) Phase A, AD-9; deny-half (a spawn to do other work is denied) Phase B — `Task` is never deny-eligible in Phase A |
| AC-2a-ii | Deferred — Phase B (spec §14 phasing) |
| AC-2b; AC-2c's skill-block under-fire clause | Deferred — Phase C (spec §14: "AC-2b and the skill-block (under-fire) clause of AC-2c") |
| AC-2c — answer-drift clauses | Over-fire (reads/executions not denied): Phase A, AD-24/AD-9. Under-fire (FR-L6 correction records the miss and outranks): Phase A, AD-18 — enforcement-real for intake-missed *info* questions; a request-class or move-class (Bash-drift, L3) miss is recorded and disclosed but changes no enforcement, and the CLI says which limit was hit. Substantive-vs-deferral discrimination: Phase B per spec §14 |
| AC-3, AC-3a, AC-4, AC-5, AC-6, AC-7, AC-8, AC-8a, AC-9, AC-10, AC-11, AC-13, AC-14, AC-15, AC-17, AC-18, AC-19, AC-20, AC-22, AC-23, AC-24 | AD-24 (each pinned; mechanisms in the named decisions) |
| AC-12 | AD-21/AD-24 (Phase A scope: deterministic plumbing model-free; precision clauses Phase B per the criterion's own text) |
| AC-16 | Deferred — Phase C (`FR-L3b` machinery) |
| AC-21 | AD-21 (guard ships and is unit-tested); full induced-self-trigger criterion Phase B |
| AC-25 | Deferred — Phase B (AD-22 fixes its semantics as constraints; nothing of it is built or tested in Phase A) |

## Limitations and trade-offs

- **L1 — Phase A answer-drift coverage is deliberately low, and its coverage
  ledger is explicit — in both error directions.** Intake recognizes explicit
  interrogatives only. **Under-enforced (tracked, never deny-eligible —
  `kind='request'`, feeding the AC-8a line, the counter, and Phase B's
  state):** repo-action request asks ("can you fix X?"), communicative-verb
  asks with an artifact-lexicon or **unlisted** object noun ("can you show me
  a demo?", "…a prototype?"), and the request-frame remainder with a
  non-communicative verb — including unlisted *communicative* verbs ("could
  you summarize the error?") and unlisted information nouns: the
  object-classification lexicons' incompleteness fails toward this side by
  design, the accepted loss of the safe default, guarded by `--missed-question`
  and shrunk by tending the communicative-verb and information-object lexicons
  (`tuning`, via `tune`; the artifact-object lexicon is inert in Phase A, and
  the rhetorical/idiom stoplist is the one list whose incompleteness fails the
  *other* way — see the residual below). **Enforced
  (`kind='info'`):** bare interrogatives, and communicative-verb request
  forms with a wh-complement or an information-lexicon object ("could you
  tell me why…?", "can you show me the error?"), including the meta-answer
  escalation re-ask "can you please answer my question?" (object head
  "question" is an information object, so the `OL-C3` recourse re-arms). The
  move recognizer denies only mutating file tools; the clear
  recognizer clears all-prior on any substantive text — request rows
  included, so a blanket-cleared request leaves the counter's recency clause
  as its only trace; a question summarized away by `compact` vanishes (AD-9);
  the FR-B4 done-claim counter is a labelled proxy with both error directions
  stated (AD-9). Each lean is the spec's own Phase A posture (`D-41`,
  `FR-B5`), and how little the skeleton catches is a Phase A exit
  *measurement*, not a surprise. The under-fire guard is the human channel
  (`FR-L6`, including `--missed-question`, which classifies like every
  opener) plus the AC-8a line. **The wrongful-deny residual has two member
  shapes**, both classified `info` for want of a request frame, both escapable
  by answering first (the owner's stated intent for the block, `OL-C3`) and
  measured on the wrongful-deny rate: (1) the action-request phrased outside
  the request frame entirely ("mind fixing X?"); and (2) a rhetorical or
  idiomatic interrogative that escapes clause (iii)'s small stoplist ("ugh,
  why is CI always so flaky??"), which opens a deny-capable row against a
  fulfilling move — often a real request co-prompted in the same turn. The
  stoplist is fallible by construction, so the second shape is owned and
  shrunk by tending the stoplist, not eliminated.
- **L2 — The clear recognizer cannot do per-question clearing.** Two questions,
  one answered substantively → both clear in Phase A. AC-2a-ii is a Phase-B
  criterion for exactly this; the Phase A behaviour errs toward clearing
  (never strands a compliant answerer) and is documented in `status`'s
  methodology note.
- **L3 — Bash is never denied in Phase A.** A drifting agent that "goes off to
  other work" purely through shell commands is not caught. Deliberate: the
  protected class (a test/build run to get the answer) is indistinguishable
  model-free, and `D-39` makes never-denying it load-bearing. A specific
  consequence is owned: a denied `Edit` retried as a file-writing `Bash`
  command sails through — **the deny itself can teach the bypass** — and the
  deny-loop signal cannot see the one-deny-then-bypass shape, so the
  `deny_bypass_suspect` diagnostic (AD-9) records it post-hoc for the owner
  and for Phase B's precision case. Phase B's judgment narrows this honestly.
- **L4 — Repo-identity residual.** A repository that merges an unrelated
  history after `init` changes its root set and thus its key; `status` shows
  the key and mode so the change is visible; export/import is the recovery.
- **L5 — Redaction is pattern+entropy, not perfect.** A low-entropy,
  unpatterned secret can pass. Pointer-only composition keeps it out of
  whispers; stores remain local under 0700. Residual risk accepted and stated.
- **L6 — Grammar inventory unverified at architecture time; two Reuse-facing
  consequences owned.** V14 verifies the WASM packages exist, are current, and
  are install-script-free; which languages `tree-sitter-wasms` covers is
  checked at build (`npm pack --dry-run` + a loaded-grammar smoke test), with
  the generic frontend as the floor for anything missing. If coverage proves
  materially narrower than expected, the ext→grammar config absorbs
  individually-shipped grammar WASMs without redesign (C-6). Two consequences
  for the Reuse genre: `symbol_refs` is an **identifier-match heuristic**
  whose false-positive class (same-named symbols, matches in comments and
  strings) is stated in every whisper's evidence and capped in confidence;
  and in a mixed-language repo, symbols from generic-frontend languages have
  no `import_edges`, so a dominance comparison would systematically favor
  grammar-covered candidates — which is why AD-15 claims no crown over an
  incomparable set (silence). Both are stated in the whisper's evidence;
  AC-1b's fixture pins the mixed-language case as **asserted silence** (no
  false crown), the unimported-grammar case as **still comparable** (a
  grammar-covered symbol whose observed count is 0 is not over-silenced), and
  the same-name false-positive case as **fired with the false-positive caveat
  in evidence and its confidence capped** — a count-dominant comment/string
  collision is crowned with that caveat, not excluded, since `symbol_refs`
  counts such matches.
- **L7 — `hooks_not_firing` detection is next-invocation, not real-time.** With
  no daemon and no timers (`FR-O5`), a totally-dead wiring is detected at the
  next CLI use or session with a working event (liveness rows go stale) —
  surfaced in `status`, never live. Accepted: the alternative is a watchdog
  process the topology deliberately lacks.
- **L8 — Blast-radius bounds of this document's codebase claims.** This
  architecture introduces a new component tree; it modifies no existing code.
  The only repo files it touches at runtime are `.claude/settings.json`
  (init/deinit). No transitive-dependency tracing was therefore performed —
  there are no existing dependents to trace. (Stated so the absence of a
  structural survey is a recorded fact, not an omission: the semantic survey
  examined the project's own prior artifacts — spec, ledger, historical
  architecture, check tooling — which are the "codebase" this document builds
  on.)
- **L9 — Two spec factual notes were stale and are synced this session
  (premise maintenance; requirement text unchanged, disclosed in STATUS.md and
  the PR).** (a) C-2: "FTS5 NOT in stock node:sqlite" (2026-08-16) is
  superseded — FTS5 ships from v22.16.0 (V7). (b) The §13 open item on
  subagent `additionalContext`: the current docs now state it does not reach
  the parent and name the parent-injection channel (V18) — C-4's assumption is
  confirmed fact, no longer an unknown.
- **L10 — Orientation's invariant headline is empty until the owner teaches
  one.** `invariants` has exactly one Phase A writer — `ctxoracle note` — so on
  a repo with no recorded invariant the FR-A2a whisper delivers entry points
  alone (AD-15); `status` shows the invariant count so the empty state is
  visible rather than mistaken for the genre working. Deterministic invariant
  *mining* is deliberately absent from Phase A (nothing in the spec's Phase A
  scope produces it; inventing one now would be unmeasured machinery).

- **L11 — Two transcript/hook-contract premises are assumptions until a named
  build-time verification, and the design is shaped so neither is
  load-bearing.** (a) *Human-marker presence*: `origin.kind:"human"` was
  observed on the interactive-session transcript but is **absent from a
  `claude -p` probe transcript's genuine prompts** (V12) — so the qa-state
  rebuild path (the only mechanism that depends on markers) may recover
  nothing in marker-less modes; that failure is loud
  (`rebuild_recovered_nothing`, `OL-10`), mid-session enforcement is
  unaffected (intake reads the `prompt` field), and marker presence on the
  owner's real interactive transcripts is verified at build (AD-24). (b)
  *`UserPromptSubmit` provenance*: whether platform-injected turns (task
  notifications, scheduled wakes) can fire the event is undocumented; the
  reconciliation voiding guard bounds the exposure to one catch-up if they
  can (AD-9, T2), and the question is settled by a live induction at build
  (AD-24). A marker-**absent** synthetic turn class would evade the voiding
  guard (voiding requires an affirmative non-human marker, because voiding on
  absence would erase real questions in marker-less modes) — that residual is
  escapable, auditable on the FR-X6 trail and counted when corrected (the
  automated detectors cannot see it — narration blanket-clears it first), and
  is exactly what (a)'s and (b)'s build-time verifications exist to shrink.
## Standards governing this architecture

| Standard / source | Where | What it governed |
|---|---|---|
| Spec `docs/specs/spec-context-oracle.md` (OL-C6-signed) | this repo | every requirement cited throughout; the phasing (§11.5); the acceptance set (§14) |
| `OWNER-LEDGER.md` CONFIRMED rows | this repo | every owner-attributed claim (OL-2, OL-4, OL-6, OL-7, OL-10, OL-11, OL-C1, OL-C3, OL-C4, OL-C5 cited at their uses) |
| Claude Code hooks reference (code.claude.com/docs/en/hooks, + hooks-guide, env-vars, agent-sdk pages), fetched 2026-08-29 | V1–V6, V15/V16, V18/V19 | channels, fields, timeouts, lag, the success/failure event split, subagent context scope; AD-6, AD-7, AD-9, AD-11, AD-15, AD-16, AD-23 |
| Node.js v22.x source (`deps/sqlite/sqlite.gyp`) + local execution | V7, V8 | AD-2's engine choice; the C-2 premise supersession |
| npm registry metadata (web-tree-sitter 0.26.13, tree-sitter-wasms 0.1.13), fetched 2026-08-29 | V14 | AD-12, AD-25 dependency hygiene |
| OWASP LLM Top-10 2025 (LLM01, LLM02), Prompt-Injection Cheat Sheet, ASI06, Secrets Cheat Sheet (verification inherited from spec §9, 2026-08-25) | spec §9 | AD-19's controls; threat model |
| OWASP ASVS 5.0 (applicable subset) | mapping table | input validation, error handling, data protection, dependency hygiene areas |
| ISO/IEC 25010:2023 | quality table | the characteristic mapping and the analysability arguments (AD-2, AD-10) |
| Zimmermann et al., IEEE TSE 31(6) 2005 (ROSE) — via spec §9 | AD-13, AD-14 | mining shape and the confidence computation's grounding (operating point architect-tunable per the spec's note) |
| SQLite WAL documentation (engine behaviour, exercised V8) | AD-26 | concurrency model |

Every standard above drives at least one named decision; none is decorative.

## Status of this architecture

All non-trivial decisions carry the five-part format with named anchors and
premise verification; the traceability matrix accounts for every spec key
including explicit phase deferrals; the trap audit (codebase-mirroring,
pattern-cloning, decision-hiding, standards-decoration, deferred-decision) was
run — the one deliberate near-trap is the documented divergence *from* the
historical record (AD-1), which is the opposite of cloning, and the deferred
items are phase-gated by the spec itself, not ambiguity left to an implementer.
**Review round 1 (2026-08-29) is applied in full.** The mandatory independent
passes — `docs/reviews/2026-08-29-expert-review-architecture-phase-a.md`
(NEEDS FIXES: 0 Critical / 4 Serious / 4 Moderate / 5 Minor) and
`docs/reviews/2026-08-29-collapse-hunt-architecture-phase-a.md` (DOES NOT
SURVIVE: 5 collapses / 4 partial / 6 notes) — were dispatched blind to each
other against the first draft; every finding from both was applied (the
marker-based human-turn discrimination and prompt-field intake; the
request-form intake exclusion replacing the false "by construction" rationale;
the no-fetch identity rule; the `symbol_refs` producer and restated Reuse
headline; the 22.16.0 floor and `VACUUM INTO` export; the cooperative-watchdog
restatement with the blocking-call inventory and off-path integrity checks;
the `closed_by_kind` record and honestly-labelled done-claim counter; the
`deny_despite_answer_text` detector and restored AC-9 induction; the uniform
table-creation criterion; the ASVS 5.0 renumbering; and the disclosure set
L1/L3/L9/L10).

**Review round 2 (2026-08-29) is applied in full.** The second independent
pair — `docs/reviews/2026-08-29-round-2-expert-review-architecture-phase-a.md`
(NEEDS FIXES: 0 Critical / 4 Serious / 3 Moderate / 4 Minor) and
`docs/reviews/2026-08-29-round-2-collapse-hunt-architecture-phase-a.md` (DOES
NOT SURVIVE: 6 collapses / 4 partial / 6 notes) — attacked the round-1 fixes
and confirmed the round-1 findings (28 rows, 25 distinct after the three
cross-duplicates its own resolution table names) resolved in substance — one,
the failure-outcome producer, only partially until this round's fix landed —
and found the new defects concentrated in the repairs, all applied: the `kind='info'/'request'`
split (requests tracked, never deny-eligible — the recourse machinery no
longer blind to the dominant ask form); `--missed-question` routed through
the same classifier (no bypassing opener); the open-scoped dedup index (the
verbatim re-ask always works); the `PostToolUseFailure` observation wiring
(failure outcomes now have a real producer — V19); the marker-premise
scoping with `rebuild_recovered_nothing` and the intake voiding guard (T2
restated to bounded, not structural, exposure at the intake door — L11); the
comparative Reuse headline with the marginal-value axis defined for its fact
class; the deferral-excluding `deny_despite_answer_text` predicate; the
runner-lexicon layer of the Verification lean; the watchdog inventory
completed (compose-time re-resolution, SessionStart items); `tune`/`note
--global` writers for every tunable and the global tables; the AC-19
record-level pin; and the survival sweep (quality table, AC-25 row, V6
phrasing, OL-R5 characterization).

**Review round 3 (2026-08-29) is applied in full.** The third independent
pair — `docs/reviews/2026-08-29-round-3-expert-review-architecture-phase-a.md`
(NEEDS FIXES: 0 Critical / 0 Serious / 2 Moderate / 6 Minor) and
`docs/reviews/2026-08-29-round-3-collapse-hunt-architecture-phase-a.md` (DOES
NOT SURVIVE: 1 collapse / 4 partial / 6 notes) — verified every round-2 fix
resolved and converged sharply (collapse trajectory 5 → 6 → 1; no Serious
finding on the premise/standards axis). Applied: the communicative-verb split
(polite information questions — "could you tell me…?" — and the OL-C3
escalation re-ask stay deny-capable; only repo-action requests are
tracked-only); the `outcome='failed'` consumer filter (failed actions feed
only the FR-L4 clause and diagnostics — never the edit-set, read-set, or
whisper computations); the ternary command classifier with the
weaker-honest-claim branch shipped (Verification stays alive in real
sessions); the readable recourse counter (`log --session` renders the counted
questions; `status` points there); the detector-coverage statement scoped to
what the deferral exclusion actually permits; the `whisper_stats` watermark
aggregation (post-session corrections reach the efficacy table); T2's bounds
conditioned on the marker-carrying class; and the sync sweep (component map,
AD-8 order, V-ranges, fixture pins, matrix qualifiers, L1/L6 restatements,
the Status count corrected to 25-distinct).

**Review round 4 (2026-08-29) is applied in full.** The fourth independent
pair — `docs/reviews/2026-08-29-round-4-expert-review-architecture-phase-a.md`
(NEEDS FIXES: 0 Critical / 1 Serious / 1 Moderate / 5 Minor) and
`docs/reviews/2026-08-29-round-4-collapse-hunt-architecture-phase-a.md` (DOES
NOT SURVIVE: 1 collapse / 3 partial / 4 notes) — confirmed every round-3
finding resolved and found the new defects concentrated in round-3's own
*prescribed repair text* (both top findings entered as verbatim reviewer
prescriptions — the durable lesson now in the collapse-log's 2026-08-29
entry). Applied: the consumer filter split by what a failed action *is* per
consumer (a failed run IS a run — the run-subtraction and unknown-scan read
either outcome, so "not run" is never asserted over a run-and-failed test;
the run-and-failed done-claim itself is FR-A2m's Phase B case per D-27); the
request-frame default flipped to `request` with the artifact-object noun
lexicon (unlisted doing-verbs are never wrongfully denied; the
under-enforcement losses are owned in L1 both ways); per-segment command
classification (compound `cd x && npm test` can no longer masquerade as
innocuous); class 3 restated as the default complement; the watermark's named
home (`global_meta.whisper_stats_watermark`), its audit+corrections fold, and
its two fixed run points (`correct`, SessionEnd — never tool events);
`session_log.detail_json` as the counter's receptacle with whisper-independent
`log` rendering; the AD-6 unconditional-`failed` sweep; the marker-carrying
qualifier on AD-9's bound sentence; "counted when corrected" precision in
T2/L11; the third `--missed-question` collision limit named; and the AC-8/
AC-1b fixture set extended (run-and-failed, compound commands, the round-4
lexicon corpus, the mixed-language dominance case).

**Review round 5 (2026-08-29) is applied in full — the final round of this
session's series, by the owner's direction.** The fifth independent pair —
`docs/reviews/2026-08-29-round-5-expert-review-architecture-phase-a.md`
(NEEDS FIXES: 0 Critical / 1 Serious / 2 Moderate / 5 Minor) and
`docs/reviews/2026-08-29-round-5-collapse-hunt-architecture-phase-a.md`
(DOES NOT SURVIVE: **0 collapses** / 4 partial / 5 notes — the series' first
zero-collapse round; trajectory 5 → 6 → 1 → 1 → 0) — confirmed every round-4
finding resolved, hand-verified the D-27/FR-A2m routing and the collapse-log
entry, and audited the consumer enumeration per that entry's own corollary
(finding the tenth reader). Applied: the object-mechanism made precise
(direct-object head noun, wh-complement precedence — a bag-of-words scan
would have disarmed "tell me why the login *test* fails"); the
information-object lexicon with **request as the safe default for every
unlisted object** (unlisted-object incompleteness fails toward
under-enforcement — the safe direction); the regret proxy's outcome semantics
(the tenth reader) and the
designed-silence regret-floor label; per-project fold watermarks;
comparability-gated dominance (no crown over an incomparable mixed-language
set — the round-5 fixture asserts silence, which the mechanism can pass);
quote-aware, independently-contributing segment classification; the
SessionEnd fold synced into AD-6 and AD-23; and the extended fixture corpus.
**Convergence has not been formally reached** — the round-5 fixes are
themselves unattacked, and the terminal definition (a round that finds
nothing real) is unmet; the owner ended the loop here for this session, so
the next action on this document is a round-6 pair attacking the round-5
fixes, then (on a clean round) approval and the Phase A implementation plan.

**Review round 6 (2026-09-03) is applied in full.** The sixth independent
pair — `docs/reviews/2026-09-03-round-6-expert-review-architecture-phase-a.md`
(NEEDS FIXES: 0 Critical / 1 Serious / 1 Moderate / 3 Minor) and
`docs/reviews/2026-09-03-round-6-collapse-hunt-architecture-phase-a.md` (DOES
NOT SURVIVE: **0 collapses** / 4 partial / 5 notes — the second consecutive
zero-collapse round; trajectory 5 → 6 → 1 → 1 → 0 → 0) — attacked the round-5
fixes as author text, re-established the hooks premises against current source,
and re-audited the `observed_actions` consumer enumeration. Applied: the
`OL-C3` escalation re-ask "can you please answer my question?" restored to
`kind='info'` by seeding "question"/"answer" into the information-object
lexicon (the round-5 unlisted-object default had swept it to `request`,
disarming the recourse); the wrongful-deny residual re-opened to its two member
shapes (outside-frame action-request; rhetorical-lead-in interrogative) in the
deny rationale and L1, with the lexicon count corrected and the artifact-object
lexicon marked inert in Phase A; the FR-L4 re-edit clause and the re-bucketed
`deny_bypass_suspect` (an `'ok'` file-writing Bash row identified by a
path-write predicate) added to AD-4's canonical consumer enumeration; the
`whisper_stats` WRITER comment synced to the per-project watermark; `tune`
extended to list-valued lexicon keys with add/remove semantics so the lexicons
are actually tunable; the comparability gate's language discriminator stated
(AD-15); and the AC-1b same-name fixture corrected to honest disclosure with
the unimported-grammar and `npm test && make integration` fixtures added.
**Convergence has not been formally reached** — round 6 found a real Serious
and four partials, so the terminal definition (a round that finds nothing
real) is unmet, and the round-6 fixes are themselves unattacked. The next
action on this document is a round-7 pair attacking the round-6 fixes, then (on
a clean round) approval and the Phase A implementation plan.
