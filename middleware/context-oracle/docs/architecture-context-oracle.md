# Architecture: Context Oracle (`ctxoracle`) — v1

**Status**: draft for adversarial review, 2026-07-16. Derived from
`docs/specs/spec-context-oracle.md` (the v1 spec) under the decisions locked
in `RETHINK.md` §12 + addendum. This document resolves the design questions
the spec assigns to the architect (spec preamble, §11 D-13/D-16, §14) and
nothing the spec already fixes: no deny paths, no separate credentials,
stores outside the repo tree, Claude Code hooks in v1, the FR-O3 latency
budget.

Architecture decisions made here are numbered `[A-n]` with rationale.
Evidence keys: `[S1]`/`[S2]` are the validation spikes in §1 (run
2026-07-16 in a Claude Code remote managed environment, CLI 2.1.211, Node
v22.22.2); `[M-n]` are the §1.3 measurements; `[HOOKS-0716]` is the Claude
Code hooks reference re-fetched 2026-07-16 (code.claude.com/docs/en/hooks.md);
spec keys (`FR-*`, `C-*`, `AC-*`, `D-*`, `OWNER-*`) resolve in the spec.

---

## 1. Validation spikes — results the design stands on

The spec routed two gating assumptions to pre-design validation (§14). Both
were executed as throwaway scripts on 2026-07-16; no spike code enters the
repo. Verbatim evidence is embedded below; the full outputs live in the
session log for PR review.

### 1.1 Spike 1 — piggyback credential inheritance: **PASS (this environment)**

Question (spec §6.2, §14): does a spawned
`claude -p … --model claude-haiku-4-5 --output-format json --max-turns 1`
complete from a non-interactive process using only the host installation's
existing authentication, with no `ANTHROPIC_API_KEY`?

Environment auth mode, checked before concluding: **no `ANTHROPIC_API_KEY`
present**; no Anthropic account credential on disk (`~/.claude/.credentials.json`
holds only MCP OAuth entries); auth is host-managed OAuth delivered to the
harness by file descriptor (`CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR`)
behind an `ANTHROPIC_BASE_URL` proxy. This is a **remote managed
environment**, not a subscription login.

Command and result (trimmed to the decisive fields):

```
$ claude -p "Reply with exactly the word ORACLE_SPIKE1_OK and nothing else." \
    --model claude-haiku-4-5 --output-format json --max-turns 1
exit=0   real 0m6.349s
{"type":"result","subtype":"success","is_error":false,
 "result":"ORACLE_SPIKE1_OK","num_turns":1, ...}
```

A second run with `--system-prompt "You are a ranking function…"` and
`--disallowedTools "*"` also succeeded: 182 input tokens, $0.0013/call,
wall time 7.3 s (vs 25,684 cache-creation tokens and $0.052 with the default
system prompt).

**Verdict**: the piggyback works here with zero separate credentials.
**Honest scope limit**: this proves inheritance where auth is host-managed;
it does *not* prove subscription-login inheritance on the owner's local
machines. That stays a per-environment Phase 1 check exactly as spec §14
already requires; any environment that fails runs degraded (FR-J3) — no
credential fallback exists (OWNER-7).

**Design consequence**: total wall time was 6.3–7.3 s per call — the CLI
spawn plus one Haiku turn can never fit the FR-O3 budget (p95 ≤ 1.5 s,
ceiling 3 s) synchronously. The judgment layer is therefore asynchronous by
construction (§6, A-8).

### 1.2 Spike 2 — subagent hook firing and context injection: **PASS**

Question (FR-O6, D-16, AC-21, spec §14): do PreToolUse/PostToolUse hooks
fire for a *subagent's* tool calls, and does
`hookSpecificOutput.additionalContext` returned by such a hook reach the
*subagent's* context?

Method: scratch project whose `.claude/settings.json` wires PreToolUse and
PostToolUse (matcher `Read`) to a script that logs its full stdin and
injects a marker carrying a per-invocation random nonce plus the
instruction "include `SEEN:<nonce>` in your final response". A `claude -p`
session was told to spawn a general-purpose subagent that Reads `data.txt`;
the main agent was told not to Read.

Results, all three checks:

1. **Hooks fire for subagent tool calls.** The hook log contains exactly two
   entries — PreToolUse and PostToolUse for the subagent's `Read` of
   `data.txt` — each carrying `agent_id: a4f43a06bb40ab8de`,
   `agent_type: general-purpose`.
2. **Injection reaches the subagent's context.** The subagent's reply
   contained `SEEN:eb305c66` and `SEEN:0daaa876` — the exact nonces the hook
   generated for its Read call, which existed nowhere else. Independently,
   the injected marker appears as a user-role message in the subagent's own
   transcript (`agent-a4f43a06bb40ab8de.jsonl`, `isSidechain: true`).
3. **Injection is consumer-local.** The main transcript contains the marker
   only inside the task prompt, the task-notification relay, and the final
   reply quoting the subagent — never as an injected message. Delivery went
   only to the consumer whose event fired, which is precisely the D-16
   model.

Two load-bearing contract details observed (both version-bound, C-5):

- `session_id` in a subagent's hook input is the **main session's id**; the
  distinguishing field is `agent_id` (documented in `[HOOKS-0716]` as
  present "only when the hook fires inside a subagent call"). Per-consumer
  state must key on `(session_id, agent_id)`, not on `session_id`.
- `transcript_path` in a subagent's hook input points at the **main**
  transcript. The subagent's own transcript lives at
  `<projects-dir>/<encoded-cwd>/<session_id>/agent-<agent_id>.jsonl` and
  must be derived from `agent_id`.

**Verdict**: FR-O6 and AC-21 are implementable as specified; D-16 is
**confirmed**, no fallback needed.

### 1.3 Supporting measurements and re-verified contract facts

- `[M-1]` Node process startup on the reference container: ~25–35 ms warm,
  ~170 ms cold — a Node shim fits the budget.
- `[M-2]` Unix-domain-socket round-trip (NDJSON echo): ~0.04 ms — IPC cost
  is negligible; the synchronous path is dominated by process startup and
  store queries, not transport.
- `[M-3]` `claude -p` single-turn wall time: 6.3–7.3 s (S1) — the model call
  is the only component that cannot run synchronously.
- `[M-4]` `--input-format stream-json` exists in CLI 2.1.211 (print mode,
  realtime streaming input) — a persistent judgment worker is a real
  option, kept as a Phase 1 optimization (§6.3).
- `[HOOKS-0716]` facts newer than the spec's 2026-07-13 verification:
  command hooks accept a per-hook `timeout` (seconds); command hooks may
  run `async: true` (background, non-blocking, but then cannot inject
  context for that event); output strings are capped at 10,000 characters;
  `transcript_path` "is written asynchronously and may lag the in-memory
  conversation"; `last_assistant_message` is the documented way to read the
  final assistant text on Stop/SubagentStop; `SubagentStart` supports
  `additionalContext` injected at the start of the subagent's conversation.
  The transcript-lag statement resolves the spec-§14 "transcript freshness"
  unknown in the direction "lags by design — architect for it" (§7.4).

---

## 2. Runtime and packaging

**[A-1] Node ≥ 22.13.0, zero runtime dependencies, plain compiled JS.**
The satisfying stack named by C-1 is adopted: Node built-in `node:sqlite`
(unflagged from 22.13.0, FTS5 compiled into official builds), no native
toolchain, no binary downloads, no network at install beyond what the
harness has. Source is TypeScript compiled to JS at publish time; the
installed artifact runs with nothing but Node built-ins. Rationale: C-1 is
a hard constraint; every added dependency is an install-time network risk
in a cold container.

**FTS5 fallback (C-1's "must not be unable to fall back")**: at store open,
FTS5 presence is feature-detected; if absent, text search degrades to
`LIKE`-based matching, the condition is recorded in the store `meta` table,
and `ctxoracle status` reports it in plain language. All call sites go
through one search interface so the fallback is a swap, not a fork.

**Platform scope**: v1 targets POSIX (Linux and macOS — the owner's actual
environments). The IPC layer isolates the socket-path logic so a Windows
named-pipe variant is additive. Recorded as an explicit non-goal rather
than silently assumed.

## 3. Process model and component boundaries

Five processes, one per responsibility. No component reaches across a
boundary except through the interfaces named here.

```
Claude Code (main agent + subagents)
   │  hook events (stdin JSON)                    ▲ additionalContext
   ▼                                              │ (stdout JSON, exit 0)
┌──────────── hook shim (per event, ~30 ms) ────────────┐
│ normalize → forward over UDS → wait ≤ deadline → relay │
└───────────────────────┬────────────────────────────────┘
                        │ NDJSON over Unix domain socket
                        ▼
┌──────────── session service (per session, warm) ───────────────┐
│ Tier 3 state · attention pipeline · candidate generation        │
│ judgment dispatch · whisper render · audit + diagnostics        │
│   ├─ worker thread: index/miner refresh (never blocks events)   │
│   └─ child process: claude -p (judgment call, async, guarded)   │
└───────┬──────────────────────────────┬──────────────────────────┘
        ▼                              ▼
  project store (SQLite)         global store (SQLite)
  ~/.ctxoracle/projects/<key>/   ~/.ctxoracle/global/

ctxoracle CLI (on demand): init/deinit · index · status · export/import ·
inspection — talks to the stores directly; to a live service only via its
socket for health queries.
Distiller: runs inside the service process after SessionEnd (§10).
```

### 3.1 Hook shim

One Node script, wired by `ctxoracle init` for the six consumed events
(`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`,
`SessionEnd`; plus `SubagentStart`/`SubagentStop` — §8). Behavior, in
order:

1. **Recursion check first**: if `CTXORACLE_JUDGMENT=1` is in the
   environment, exit 0 with no output and no forwarding (§6.5).
2. Read stdin JSON; normalize to the neutral event contract (§5).
3. Connect to the session socket. If absent and the event is
   `SessionStart`, spawn the service detached and wait for the socket up to
   the deadline; for any other event, a missing socket is one respawn
   attempt, then silence.
4. Send the event; wait for the reply with a **shim-owned deadline** —
   1,200 ms default, giving margin inside the FR-O3 p95 target of 1.5 s.
   On timeout/error: exit 0, no output (FR-O3 fail-open), and the service
   logs the timeout when it eventually finishes (FR-M1).
5. If the reply contains a whisper: print
   `{"hookSpecificOutput": {"hookEventName": <event>, "additionalContext": <text>}, "suppressOutput": true}`
   and exit 0.

**[A-2] Shims are synchronous, with a self-imposed deadline; the hooks-level
`async` capability is not used in v1.** Rationale: measured shim cost is
process startup (~30 ms `[M-1]`) plus IPC (~0.04 ms `[M-2]`) plus service
decision time — comfortably inside budget — and an async hook cannot inject
context for its own event `[HOOKS-0716]`, which would forfeit the delivery
point. Every consumed event is a potential delivery point (FR-A2), so
synchronous-with-deadline dominates. Revisit only if measured p95 breaches
FR-O3.

Belt-and-braces: each wired hook also sets the harness-level
`timeout` field (5 s) so even a pathologically hung shim is killed by the
harness well before the 600 s default `[HOOKS-0716]`.

**Structural no-deny (FR-O4, AC-3)**: the shim's output path can emit only
the object literal above or nothing. No code path constructs
`permissionDecision`, `decision`, or a non-zero exit for the harness to
see. Asserted by test, per AC-3.

### 3.2 Session service

**[A-3] One service process per session, spawned lazily by the first shim
event, holding all warm state (C-2).** Keyed by `session_id`; socket at
`$CTXORACLE_HOME/run/<session_id>.sock` (0700 directory, 0600 socket).
Subagent events carry the parent `session_id` (S2), so all consumers of one
session share one service and one Tier 3 store — which is what per-consumer
budgets rolling up into a session total (FR-A3/FR-O6) require.

- **Concurrency model**: single Node event loop for event handling;
  `node:sqlite` is synchronous, so all store queries on the event path must
  be index-served point queries (§4); heavy work (index refresh, mining,
  distillation) runs in a `worker_threads` worker with its own SQLite
  connection (WAL allows the concurrent reader/writer pair).
- **Lifecycle**: starts on first event; `SessionEnd` triggers the distiller
  then exit. Orphan guard: no events and no socket connections for 30 min →
  self-exit after flushing diagnostics. Multiple concurrent sessions on the
  same repo run one service each, sharing the project store under WAL.
- **Crash recovery**: Tier 3 lives in memory for speed, but two slices are
  write-through to the audit store precisely because they must survive a
  service restart — whispers already sent (dedup, FR-A4) and per-consumer
  budget spend (FR-A3). A respawned service reloads both for the session
  and continues; the lost remainder (intent hypothesis, files-seen set)
  rebuilds from subsequent events, degrading whisper quality briefly but
  never correctness. Restart is visible in diagnostics (FR-M2).

### 3.3 Judgment worker

A short-lived child process per judgment call (`claude -p`, §6), spawned
with the recursion sentinel and a neutral cwd (§6.5). Not a persistent
worker in v1 baseline — see A-9 for the recorded alternative.

### 3.4 CLI

`init`/`deinit` (C-4: wire/unwire hooks in the repo's
`.claude/settings.json`, create the out-of-tree store — the only in-tree
write, ever), `index` (build/refresh Tier 2 + miner), `status` (§9.3),
`export`/`import` (FR-K9; format is a Phase 2 decision per spec §14),
`inspect` (stores, whisper audit log, suppressions — FR-X6, FR-L3
reversibility).

## 4. Store design

**[A-4] SQLite via `node:sqlite`, WAL mode, one database file per concern.**
Per project: `project.db` (knowledge), `audit.db` (whisper/event audit —
grows fast, vacuums independently, and FR-X6 wants it inspectable in
isolation). Global: `global.db`. Diagnostics are NDJSON files, not SQLite
(§9.1) — they must stay writable even when SQLite itself is the failing
component.

**[A-5] D-13 confirmed with two revisions.** Default layout
`~/.ctxoracle/projects/<repo-key>/` and `~/.ctxoracle/global/` stands.
Revisions: (1) `CTXORACLE_HOME` environment variable overrides the root —
ephemeral containers need to point state at a mounted volume without a
config file; (2) `<repo-key>` is defined precisely: SHA-256 (first 16 hex
chars) of the normalized first `git remote` URL (scheme/credentials/`.git`
suffix stripped, host lowercased), falling back to the SHA-256 of the
repository root's absolute real path when no remote exists. The un-hashed
identity string is stored in `project.db meta` so `status` and humans can
audit which repo a store belongs to and collisions are diagnosable.

### 4.1 `project.db` — knowledge (Tier 1 + Tier 2)

Schema sketch (types elided; all timestamps ISO-8601 UTC):

```
meta(key PRIMARY KEY, value)             -- schema_version, repo_key,
                                         -- repo_identity, fts5_available, …
files(id, path UNIQUE, lang, zone,       -- zone: source|generated|vendored|
      mtime, content_hash, deleted)      --       build_output   (FR-K1)
symbols(id, file_id→files, name, kind, span_start, span_end)
import_edges(src_file_id, dst_file_id, kind)          -- (FR-K1)
verification_commands(id, region_glob, command, prov_*)  -- (FR-K1)

cochange_file_edges(file_a, file_b,      -- a<b canonical order
      together, total_a, total_b,        -- directed confidence computed
      first_at, last_at)                 -- at query time   (FR-K2)
cochange_symbol_edges(sym_a, sym_b, together, total_a, total_b, last_at)
mining_state(watermark_commit, horizon_days, last_run_at,
      commits_mined, skipped_merges, skipped_oversize)

exemplars(id, title, file_id, span, why, prov_*, trust, origin_session)
landmines(id, kind, summary, evidence, prov_*, trust, origin_session)
invariants(id, description, prov_*, trust, origin_session)
invariant_members(invariant_id, file_id, detail)
recipes(id, task_shape, region_json, prov_*, trust, origin_session)
suppressions(id, record_kind, record_id, reason, ts, reversible=1) -- FR-L3
```

**Provenance is structural (FR-K6)**: every Tier 1 table carries
`prov_kind NOT NULL CHECK (prov_kind IN ('span','commit','human','learned'))`
plus per-kind CHECKed payload columns (`prov_file`+`prov_span`,
`prov_commit`, `prov_note`+`prov_date`, `prov_session`). A record without a
resolvable pointer violates a constraint — unrepresentable, as the spec
demands.

**Trust is a column, not a convention (FR-X4)**:
`trust NOT NULL CHECK (trust IN ('repo','human','mechanical'))`. The
distiller writes learned records with the *minimum* trust of their inputs;
code review plus AC-13 enforce that no path upgrades `repo` to anything
else. `origin_session` (nullable) makes learned records evictable by source
(FR-L5): `DELETE … WHERE origin_session = ?`.

**FTS5 tables** (`fts_symbols`, `fts_landmines`, `fts_exemplars`) serve
narration matching; §2's fallback applies.

### 4.2 `audit.db` — per-event and per-whisper record (FR-L1, FR-X6)

```
events(id, ts, session_id, consumer, event_kind, decision,   -- silence|
       latency_ms, candidates_considered)                    -- whisper|timeout|error
whispers(id, event_id→events, ts, session_id, consumer, genre,
         text, confidence, evidence_json, tokens, delivered_ack)
uptake(whisper_id→whispers, kind, observed_at)   -- opened|used|ran|proceeded-past|corrected
session_state(session_id, consumer, key, value)  -- write-through Tier 3 slice:
                                                 -- dedup keys, budget spend (§3.2)
```

`delivered_ack` records that the shim printed the whisper (the closest
delivery proxy the hooks contract offers — there is no harness-side
delivery receipt; recorded honestly as a proxy, used by FR-M2's
"produced but not delivered" check).

### 4.3 `global.db` — efficacy and tuning (FR-L4, FR-L7)

```
genre_stats(genre, repo_key, window_start, sent, acted, false_fires)
thresholds(name PRIMARY KEY, value, updated_at, reason)   -- bar, budgets,
                                                          -- ladder states (§9.2 of spec)
lessons(id, text, prov_*, trust, origin_session)
interaction_patterns(id, kind, evidence_json, repo_key, ts)  -- FR-L7
```

## 5. Harness-neutral event contract (C-3)

**[A-6] One versioned NDJSON message shape over the socket; all Claude Code
knowledge lives in the shim's normalization table.** The service never sees
harness field names.

Request (shim → service):

```json
{"v": 1,
 "event": "session_start|prompt|tool_pre|tool_post|agent_start|agent_stop|stop|session_end",
 "ts": "…",
 "consumer": {"session": "<id>", "agent": "<agent_id or 'main'>", "agent_type": "…"},
 "repo": {"cwd": "…"},
 "deadline_ms": 1200,
 "payload": { }}
```

`payload` per event: `prompt` → `{text}`; `tool_pre`/`tool_post` →
`{tool, args_digest: {file_path?, pattern?, …}, outcome?}`; `stop` →
`{last_assistant_message?}`; others empty. The shim sends a *digest* of
tool args (the fields the oracle uses), not the raw harness object — the
normalization table is the single place new harness versions are absorbed
(C-5).

Response (service → shim):

```json
{"v": 1, "whisper": null}
{"v": 1, "whisper": {"text": "[oracle] (coupling) …", "genre": "coupling",
                     "confidence": 0.93, "audit_id": 4711}}
```

Mapping table (Claude Code v1 shims): `SessionStart→session_start`,
`UserPromptSubmit→prompt`, `PreToolUse→tool_pre`, `PostToolUse→tool_post`,
`SubagentStart→agent_start`, `SubagentStop→agent_stop`, `Stop|SubagentStop→stop`
(SubagentStop maps to both `agent_stop` and a consumer-scoped `stop`),
`SessionEnd→session_end`. Unknown or newly-added harness events are
forwarded as `{"event":"unknown"}` and ignored by the service with a
diagnostic count — drift shows up in FR-M2 instead of breaking (C-5).

## 6. Judgment layer

### 6.1 Two lanes

**[A-7] The judgment layer is two lanes with one gate.** Candidate
generation (FR-J1 stage 1) is deterministic, in-process, and synchronous:
point queries against `project.db` keyed by the event (co-change partners
of the file just read, zone of the file about to be edited, invariant
membership, verification command for the changed region). Target ≤ 50 ms.

- **Lane D (deterministic)**: candidates whose evidence is mechanical and
  whose genre is in the FR-J3 degraded set (coupling, generated-file
  warning, verification, completeness, minimal orientation) may be
  rendered and delivered synchronously within the event's deadline — this
  lane *is* degraded mode when the model path is down.
- **Lane M (model-assisted)**: intent tracking, ranking when candidates
  compete, drafting for the narration genres (assumption check, steering,
  answer, process, answer drift). Always asynchronous (A-8).

### 6.2 Asynchrony — the consequence of [M-3]

**[A-8] Model judgment never runs inside an event's deadline; it starts at
event *N* and its accepted output is delivered at the next
whisper-eligible event for that consumer.** Measured floor for one
piggyback call is 6.3–7.3 s `[M-3]` against a 3 s hard ceiling (FR-O3) —
synchronous model judgment is physically impossible, and FR-O3/FR-J4
explicitly permit the carry ("the candidate may carry to the next event").
Before delivery the service re-gates the carried whisper against current
Tier 3 state: dropped if the agent has visibly moved on (file no longer in
focus, whisper deduped, budget exhausted, confidence now stale — FR-A4).
At most one in-flight judgment call per consumer; a newer event of the
same consumer supersedes the pending call's delivery eligibility, and the
superseded result is logged as a `late_judgment` diagnostic rather than
delivered.

Genre fit: this matches how the narration genres actually work — an
assumption-check on narration read at event *N* lands beside the result of
event *N+1*, one tool call later, still ahead of the edit it exists to
inform. Orientation (UserPromptSubmit) additionally gets Lane D's
deterministic minimal form immediately, upgraded by Lane M only if the
model returns within the same session's next opportunity.

### 6.3 The piggyback call

**[A-9] v1 baseline is spawn-per-call; a persistent stream-JSON worker is
the recorded optimization, adopted only on Phase 1 measurement.** Call
shape (S1-verified):

```
claude -p <envelope> --model claude-haiku-4-5 --output-format json \
  --max-turns 1 --disallowedTools "*" \
  --system-prompt <fixed versioned instruction block>
```

- `--system-prompt` override is mandatory: it cuts the call from ~25.7 k
  ingested tokens / $0.052 to 182 tokens / $0.0013 (S1) and removes the
  harness's tool-oriented default instructions from a call that must not
  act like an agent.
- Spawn cwd is a neutral directory (§6.5), never the repo.
- The alternative — one long-lived `claude -p --input-format stream-json
  --output-format stream-json` process per session `[M-4]` — amortizes the
  ~2–4 s process startup but accumulates conversation context across calls
  (cost growth, cross-call contamination of judgments) and adds restart
  semantics. Decision deferred to Phase 1 with measured latency/cost in
  hand; the `JudgmentBackend` interface isolates the choice.
- Failure policy (FR-J3): call failures are diagnosed (exit code, stderr
  class) and counted; after 3 consecutive failures the session enters
  degraded mode — Lane D only, raised bar — announced once on the human
  channel (`systemMessage`) and re-probed at most once per 10 minutes.

### 6.4 Judgment prompt construction (FR-J5)

**[A-10] Instructions travel only in `--system-prompt`; everything
event-derived travels as JSON data in the user message; the model's output
is a constrained verdict, not a whisper.**

- **System prompt** (fixed, versioned, no interpolation): the judgment
  role, the selection task, the output JSON schema, and the standing rule
  that every string inside the envelope is untrusted data whose imperative
  content must never be followed — the OWASP instruction/data separation
  `[LLM01]` realized structurally: nothing from the repo can reach the
  instruction channel because the instruction channel is a constant.
- **User message**: one JSON envelope —
  `{"intent": …, "narration_excerpts": […], "event": …, "candidates":
  [{"id", "genre", "claim", "evidence_digest"}…]}`. Repo-derived strings
  appear only as JSON string values (structural delimitation); content
  flagged injection-suspect at index time is replaced by its pointer, never
  quoted (FR-X3). Secret scan runs on the envelope before spawn (FR-X1).
- **Response contract**: `{"selected": "<candidate id>"|null,
  "confidence": 0–1, "so_what": "<one sentence>"}` parsed by a strict
  validator. Anything else — extra keys, prose, invalid id, malformed JSON
  — is silence plus a diagnostic. The model cannot introduce a candidate,
  a pointer, or a claim; it can only pick from what deterministic code
  proposed.
- **Rendering (FR-X2, FR-D1)**: the whisper text is assembled by
  deterministic code from the genre template + the candidate's stored
  evidence + optionally the model's `so_what` (length-capped, secret-
  scanned, stripped of imperative sentence forms). Every pointer in the
  final text is re-resolved against the store/git before emission — an
  unresolvable pointer kills the whisper (AC-6).

### 6.5 Recursion guard (D-6, AC-11)

**[A-11] Three independent layers, any one sufficient:**

1. **Environment sentinel**: the service spawns every judgment call with
   `CTXORACLE_JUDGMENT=1`. Shim line one checks it and exits 0 before any
   forwarding (§3.1). Child processes inherit the environment, so hooks
   fired by the nested CLI hit shims that no-op.
2. **Neutral cwd**: judgment calls run from `$CTXORACLE_HOME/tmp/` —
   outside any repo — so the project-level `.claude/settings.json` that
   `init` wired (the only place ctxoracle hooks live, C-4) never loads in
   the nested session. User-level hooks not owned by ctxoracle may still
   run there; they are the user's own configuration, and layer 1 keeps
   *oracle* shims inert regardless.
3. **Service-side back-stop**: the service tags in-flight judgment child
   PIDs; an inbound socket event whose payload identifies a judgment
   session (sentinel echoed in the neutral contract by the shim — a field
   the shim sets when it *does* forward despite the sentinel, which only a
   bug would produce) is dropped and counted as a `recursion_blocked`
   diagnostic.

AC-11's instrumentation counter is layer 3's diagnostic plus an
end-to-end fixture asserting zero oracle hook activity during an induced
judgment call.

## 7. Attention pipeline and Tier 3

### 7.1 Per-event pipeline (inside the service)

```
normalize-in → Tier3 update → gates (budget, dedup, cold-start FR-A6,
first-sessions FR-A7, staleness FR-K7) → Lane D candidates →
[deliver best above bar within deadline] → Lane M dispatch (async) →
audit write → diagnostics write
```

The gates run before candidate generation where they can (budget
exhausted → skip work), after where they must (dedup is per-candidate).
One whisper max per event (FR-A3): if Lane D delivers, any carried Lane M
result waits for the next opportunity.

### 7.2 Tier 3 state (per consumer)

Keyed by `(session_id, agent_id|'main')` (S2). In memory: files/symbols
seen (from `tool_post` digests), narration cursor (§7.4), intent
hypothesis (Lane M output, carried), open user questions (FR-A9), loaded
skill/workflow expectations (FR-A8), pending Lane M call, orientation
decay flag. Write-through to `audit.db session_state`: dedup keys and
budget spend (crash tolerance, §3.2). Consumer records are created lazily
on first event (`agent_start` or first tool event with a new `agent_id`)
and finalized at `agent_stop`.

### 7.3 Budgets and dedup

Session token budget (FR-A3, default 2,000 `[D-10]`) is a counter over
rendered whisper tokens across all consumers; per-consumer spend is
tracked so one chatty subagent cannot starve the main agent — per-consumer
soft cap defaults to 50% of the remaining session budget at that
consumer's first event. Dedup keys are `(consumer, fact-identity)` where
fact-identity is the candidate's stable id (e.g. co-change edge id +
direction), so the same fact may reach the main agent and a subagent once
each — AC-21's exact requirement — and never twice to either.

### 7.4 Narration reading under documented transcript lag

`transcript_path` may lag the live conversation `[HOOKS-0716]`, so:

- Each consumer's transcript is read incrementally from a byte cursor at
  each event, parsing only appended lines; for subagents the path is
  *derived* (`<dir>/<session_id>/agent-<agent_id>.jsonl`, S2) because the
  hook input's `transcript_path` points at the parent (S2).
- Narration genres treat the transcript as *eventually-current*: a lag
  means an assumption-check fires one event later, which A-8's carry
  semantics already absorb. No genre depends on seeing the current turn's
  in-flight text.
- `stop` events use the harness-provided `last_assistant_message` payload
  field instead of the transcript `[HOOKS-0716]` — the documented
  mechanism for exactly this gap.
- If a consumer's transcript file is missing or unparsable, narration
  genres go silent for that consumer (FR-O3) and a diagnostic is written;
  mechanical genres continue.

This is the architecture's resolution of spec §14 "transcript freshness":
the contract documents the lag; the design never assumes freshness; the
Phase 1 verification shrinks to measuring *typical* lag to tune the
narration cursor, not to a ship/no-ship gate.

## 8. Subagent delivery (FR-O6, D-16 — confirmed by S2)

- **Wiring**: the same shim handles subagent events; no extra hooks beyond
  adding `SubagentStart`/`SubagentStop` to the six main events.
- **Identity**: consumer = `(session_id, agent_id|'main')`; `agent_type`
  recorded for the recipes/learning loop.
- **Orientation for subagents**: `SubagentStart` supports
  `additionalContext` at the subagent's conversation start `[HOOKS-0716]`;
  the oracle injects a compact orientation whisper there when the store has
  task-shape-relevant facts — the subagent analog of the prompt-time
  orientation, subject to the same budget and decay rules.
- **Delivery**: a whisper is returned only on the consumer's own event
  (S2 confirmed injection is consumer-local); per-consumer dedup and
  budgets per §7.3.
- **Version-bound facts** (C-5): `agent_id` presence, main-session
  `session_id` aliasing, and the derived transcript path are re-asserted by
  a cheap self-check at `SessionStart` (field presence probe recorded to
  diagnostics); if the contract drifts, subagent genres go silent and
  FR-M2 surfaces it, instead of misdelivering.

## 9. Self-observability (FR-M1/M2/M3/M4, D-19)

### 9.1 Diagnostic log format

**[A-12] NDJSON, one file per day per project:
`$CTXORACLE_HOME/projects/<key>/diag/YYYY-MM-DD.ndjson`; never SQLite.**
Rationale: the diagnostic channel must keep working when the store layer
is the thing that is broken; appending a line to a file has no schema,
lock, or corruption dependency. Retention: 14 days, pruned at service
start.

Event shape:

```json
{"ts": "…", "v": 1, "session": "…", "consumer": "main|<agent_id>|-",
 "component": "shim|service|judgment|store|miner|distiller|cli",
 "kind": "event_handled|whisper_sent|timeout|model_call|model_fail|
          store_error|index_refresh|degraded_enter|degraded_exit|
          recursion_blocked|late_judgment|contract_drift|…",
 "severity": "info|warn|error",
 "latency_ms": 0, "data": { }}
```

Secrets (FR-X1) and locality (FR-X7) rules apply: the secret scanner runs
on `data` payloads before write; the log never leaves the machine.

### 9.2 Self-checks (FR-M2) — detection method per failure class

| Failure class | Detection |
|---|---|
| Hooks not firing at all | Honestly not detectable live (nothing runs). Detected retrospectively: `ctxoracle status` compares hook wiring present in `.claude/settings.json` against diagnostic evidence of recent sessions (harness activity visible in `~/.claude/projects/<repo>` mtimes vs. absent `event_handled` entries) and reports the gap. |
| One event type missing | Service-side expectation map: a session with `tool_post` events but zero `tool_pre` (or `prompt` without `session_start`) increments `contract_drift`; surfaced by `status`. |
| Latency breach | Every event logs `latency_ms`; service tracks rolling p95 per event type; breach of FR-O3 targets logs `warn` and `status` reports it. |
| Model path dead | `model_fail` streak (§6.3) → `degraded_enter` with cause; `status` shows current mode + last probe. |
| Store corruption | `PRAGMA integrity_check` at open and after any SQLite error; failure → Lane D minimal (structural queries that still work) or full silence + `store_error`. |
| Index staleness | `mining_state.last_run_at` + repo HEAD distance beyond FR-K7 bounds → confidence demotion (already required) + `status` line. |
| Whisper produced, not delivered | `whispers.delivered_ack` false (shim never confirmed printing) — the honest proxy for a channel with no delivery receipt (§4.2). |
| Service crash | Respawn detected at next event (socket was dead); previous session's unflushed state absence is logged as `service_restart`. |

### 9.3 `ctxoracle status`

Plain language, non-programmer readable (FR-M2): current mode
(full/degraded + why), store health, index freshness, last session's
whisper/silence/hit counts, active suppressions, anomalies from §9.2, and
the FR-M3 self-report location. No dashboards; one command.

### 9.4 Self-report (FR-M3)

The distiller appends recurring-failure findings to
`$CTXORACLE_HOME/projects/<key>/self-report.md` (rolling, newest first,
plain language). "Present for reading at next session start" (AC-22) is
satisfied by the companion skill mentioning it and `status` printing its
path — the report is *for* working agents and the owner, and never enters
whisper context (FR-M4).

## 10. Distiller, learning, miner

### 10.1 Co-change miner (FR-K2)

- **Extraction**: `git log --no-merges --name-status
  --find-renames -z <watermark>..HEAD`, streamed; per commit: skip if
  changed-entity count > 30 (recorded in `skipped_oversize`); rename-aware
  path canonicalization; commits older than the horizon (default 36
  months, per-project tunable) are excluded from mining entirely.
- **Storage**: pair counts into `cochange_file_edges` (canonical a<b
  order; directed confidence `together/total_source` computed at query
  time — both directions from one row). Symbol edges only for files whose
  Tier 2 span maps exist at mining time: hunk line-ranges from
  `git log -p` map to symbol spans; v1 populates symbol edges lazily for
  hot files (those appearing in coupling candidates) rather than
  repo-wide, keeping first index cheap. File-level edges are the always-on
  substrate; symbol-level refines when present.
- **Refresh**: incremental from `watermark_commit` at `SessionStart`
  (worker thread, never blocks events) and on `ctxoracle index`. History
  rewrites (watermark unreachable from HEAD) trigger a clean re-mine, and
  the event is logged — never an error into the session.
- **Recency**: `first_at`/`last_at` recorded per edge; ranking weight is a
  per-project tunable defaulting to *off* (D-3).

### 10.2 Distiller (FR-L1..L7)

Runs in the service process after `session_end` (before exit), reading
`audit.db` (events, whispers, uptake) plus `git diff` of the session span:
regrets (edited files whose known partners went unmentioned and broke —
cross-checked against verification outcomes when visible), noise (whispers
with no uptake), false fires (warnings contradicted by outcome or
narration — feeding the §9.2-spec ladder state in `global.db thresholds`),
recipes (task shape → regions), and FR-L7 interaction patterns. All writes
carry `learned` provenance + `origin_session` (evictable, FR-L5) and
minimum-input trust (FR-X4). Human chat statements observed in the
transcript are recorded with `human` provenance (FR-L6). Sessions where
the service died before `session_end` are distilled lazily at the next
`SessionStart` for that repo (audit rows carry everything needed).

## 11. Security architecture (spec §8 mapping)

| Threat | Architectural control |
|---|---|
| T1 injection at whisper time | Constant instruction channel + JSON-data-only envelope (§6.4); model output restricted to verdict schema; deterministic rendering with re-resolved pointers; suspect content pointer-only (FR-X3); adversarial fixtures in CI (FR-X8/AC-7). |
| T2 store poisoning | Structural trust column, minimum-trust propagation in the distiller (§4.1); learned records evictable by session (FR-L5); provenance NOT NULL (FR-K6). |
| T3 secret disclosure | One scanner module (bundled regex signature set, gitleaks-class patterns, no network) at all four boundaries: store ingest, whisper render, diagnostic write, judgment envelope (§6.4, §9.1); AC-12 fixtures. |
| T4 over-privilege | Service opens the repo read-only; only child process is the judgment call; only network path is that call's own (inherited harness proxy); shims cannot deny (FR-O4); stores chmod 0700/0600. AC-14 instruments all of it. |

## 12. Companion skill and human channel

Skills load from repo scope or user scope, and P8/AC-4 forbid the repo
tree; therefore `init --skill` (opt-in) writes the companion skill to the
**user-level** skill directory, never the repo. The skill is optional by
spec (FR-S2); content per FR-S1. Human-facing notices (degraded mode,
index rebuild) use hook `systemMessage` (visible to the human, not the
model) or CLI output only (FR-D4).

## 13. Decisions ledger (this document)

| ID | Decision | Anchor |
|---|---|---|
| A-1 | Node ≥ 22.13, zero-dep, compiled-JS packaging; FTS5 feature-detect + LIKE fallback; POSIX-only v1 | §2 |
| A-2 | Synchronous shims with shim-owned 1.2 s deadline; hooks-level async unused in v1; per-hook harness timeout 5 s | §3.1 |
| A-3 | One warm service per session, lazy spawn, UDS at `$CTXORACLE_HOME/run/<session>.sock`, worker thread for heavy work, orphan self-exit, write-through dedup/budget | §3.2 |
| A-4 | SQLite per concern: `project.db`, `audit.db`, `global.db`; diagnostics NDJSON not SQLite | §4, §9.1 |
| A-5 | D-13 confirmed + `CTXORACLE_HOME` override + precise repo-key definition | §4 |
| A-6 | Versioned neutral NDJSON event contract; digest payloads; unknown events counted, ignored | §5 |
| A-7 | Two-lane judgment: deterministic sync lane (= degraded mode), model lane async | §6.1 |
| A-8 | Model judgment always async; deliver at next eligible event after re-gating; one in-flight call per consumer | §6.2 |
| A-9 | Spawn-per-call baseline with `--system-prompt` override; stream-JSON persistent worker deferred to Phase 1 measurement | §6.3 |
| A-10 | Constant system prompt; JSON data envelope; verdict-only model output; deterministic rendering with pointer re-resolution | §6.4 |
| A-11 | Recursion guard: env sentinel + neutral cwd + service back-stop | §6.5 |
| A-12 | Diagnostics as daily NDJSON files, 14-day retention, independent of SQLite health | §9.1 |

## 14. Requirement traceability

| Spec item | Where satisfied |
|---|---|
| FR-O1..O6 | §3.1, §5, §7.4, §8 |
| FR-K1..K9 | §4.1, §10.1, §2 (fallback), §3.4 (export) |
| FR-A1..A9 | §7.1–§7.4, §6.1 (genre lanes) |
| FR-D1..D5 | §6.4 rendering, §12 human channel |
| FR-J1..J5 | §6 |
| FR-S1..S3 | §12 |
| FR-L1..L7 | §4.2, §10.2 |
| FR-M1..M4 | §9 |
| FR-X1..X8 | §11 (+ anchors therein) |
| NF-1..NF-3 | §3.1 deadlines, §7.3 budgets, §10.1 incremental |
| C-1..C-5 | §2, §3.2, §5, §3.4, §5+§8 (drift handling) |
| D-6, D-13, D-16 | §6.5, §4 (A-5), §8 |
| AC-3/4/6/7/11/12/13/14/21/22 | §3.1, §12, §6.4, §11, §6.5, §11, §4.1, §11, §7.3/§8, §9.4 |

## 15. Risks and open items for the plan phase

1. **Subscription-login piggyback remains unverified** on the owner's local
   environments (S1 covers host-managed auth only). Phase 1 first task, per
   spec §14; failure means degraded-only there (OWNER-7), a finding for the
   owner, never a workaround.
2. **Typical transcript lag is unmeasured** (documented as possible
   `[HOOKS-0716]`; design absorbs it, §7.4). Phase 1 measures typical lag
   to tune narration cursors; not a ship/no-ship gate anymore.
3. **`agent_id`-related contract details are version-bound** (S2 observed,
   partially documented). §8's SessionStart self-check turns drift into a
   visible diagnostic rather than misbehavior.
4. **Judgment backend choice** (spawn-per-call vs stream-JSON worker) is
   deliberately deferred to Phase 1 measurement behind an interface (A-9).
5. **Export format** (FR-K9) deferred to Phase 2 by the spec; nothing here
   constrains it beyond single-file round-trip.
6. **`node:sqlite` API stability** across Node minors: pinned-floor testing
   in CI fixtures (C-1); LIKE fallback covers FTS5 absence but not sqlite
   module absence — the version floor is the guard there.
