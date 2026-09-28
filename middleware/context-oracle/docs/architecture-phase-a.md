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

**Branch-audit correction pass (2026-09-28).** Every decision changed by the audit of
the branch since `de66831` cites, where the change is made, the register item it
implements and the ruling that settles it, as `(R-n; <file>)`. The files, all in
`docs/reviews/`: *register* = `2026-09-28-branch-audit-correction-register.md`;
*settlements* = `2026-09-28-branch-audit-gap-settlements.md` **as corrected by**
`2026-09-28-branch-audit-gap-settlements-review.md` (each settlement applies with the
review's "Change required"; "Flaw 1–3" are the review's three raised flaws); *CR§1* /
*CR§2* = `2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md` §1/§2,
§1 **as corrected by** *store-recovery* =
`2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md`; *DE* =
`2026-09-28-branch-audit-hook-context-on-denied-edit.md`; *PD* =
`2026-09-28-branch-audit-hook-context-permission-denial.md`; *Bn verification* /
*Bnx E-k* = `2026-09-26-branch-audit-Bn-verification.md` / that part's adjudication
entry. **Correction review (2026-09-28).** A decision changed by the independent
review of that correction cites its finding as `(F-n; <source>)` or, where it also
implements a register item, `(R-n / F-n; <source>)`; *F-n* and *settlement (a)–(d)*
are the findings and settlements of
`docs/reviews/2026-09-28-architecture-correction-review.md`, each applied as checked
against its source, and a *coordinator ruling* is the coordinator's instruction for
that finding, recorded with the reason that backs it where it is applied. Where this document restates `PreToolUse` timing it follows the documented and
tested behaviour (hooks reference fetched 2026-09-28; DE, PD, Claude Code 2.1.283),
which the spec's FR-O2, C-4, FR-A2d, §5.1 and AC-1c do not yet say: those lines are
**pending spec sign-off R-1…R-5** (Max Cogar, under M38), and each restatement is
marked so.

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
| V6 | Hook timeouts: 600 s default for command hooks (30 s under `UserPromptSubmit`); SessionEnd hooks share a 1.5 s budget, raised up to 60 s to match a configured per-hook timeout; a timed-out hook's output is discarded, "so on most events a timed-out hook renders no decision", and "on `PreToolUse`, by contrast, a timed-out command hook lets the tool call continue" | `hooks-guide` Limitations + `env-vars` + agent-sdk hooks page, fetched 2026-08-29; the timeout clause re-read in the hooks reference 2026-09-07 (plan §4, §11.4) | A timed-out handler **fails open**: its output is discarded, so nothing the handler emitted survives, a deny included; whether the harness shows a notice for a timed-out `PreToolUse` hook the reference does not state (it documents one for `UserPromptSubmit`). *(Corrected 2026-09-28: this said the handler "fails open silently … with no trace", which reaches past the reference's own scope — R-7; B5a E-1, hooks reference fetched 2026-09-28.)* AD-23's cooperative deadline and blocking-call inventory therefore exist so a slow event ends inside the deadline and writes its `latency_breach` diagnostic (`NF-1`, `FR-O3`, `OL-10`) **for the enumerated event-path calls** (never claimed in the abstract). *(Corrected 2026-09-26: this row said a timed-out `PreToolUse` hook prevents the tool from running — fail-closed — which the 2026-09-07 hooks reference contradicts; raised in `docs/plans/plan-phase-a.md` sections 4 and 16.)* |
| V7 | Stock `node:sqlite` ships FTS5 **from v22.16.0** | Executed here: `CREATE VIRTUAL TABLE … fts5` succeeds on Node v22.22.2 (LTS 'Jod', `process.release.sourceUrl` = nodejs.org v22.22.2); `PRAGMA compile_options` lists `ENABLE_FTS5`; `deps/sqlite/sqlite.gyp` fetched per tag 2026-08-29: **0** FTS5 matches at v22.15.0, **1** at v22.16.0 ("sqlite: enable common flags", nodejs/node#57621, in the 22.16.0 changelog) | **The spec's C-2 factual note (2026-08-16: FTS5 absent, nodejs/node #56951 open) is superseded.** The C-2 *requirement* is met by the built-in engine with zero dependencies — on Node ≥ 22.16.0, which is why AD-2's floor is 22.16.0, not C-1's unflagged-since figure (22.13.0, still true, still recorded in the spec). |
| V8 | Cold-spawn cost of the whole per-event handler shape: Node process start + store open + WAL + STRICT DDL + FTS5 virtual table + insert + query | Executed here 5×: 45–54 ms full process wall time; in-process store work 1.8 ms. **Excludes `PRAGMA integrity_check`**, which the collapse-hunt measured at 543 ms (`quick_check` 189 ms) on a 410 MB store as one uninterruptible synchronous statement (review record 2026-08-29) — which is why AD-17 keeps integrity checks **off** the event path | NF-1 (p95 ≤ 1.5 s) has ~30× headroom over a spawn-per-event process model whose event path is bounded lookups only (AD-23's inventory). AD-1 rests on this. |
| V9 | The host-CLI piggyback works in this environment with no separate credentials, as the design would ship it | Executed here: `claude -p --model claude-haiku-4-5 --tools "" --max-turns 1 --output-format json` → `is_error:false`, `num_turns:1`, result `"ok"`; wall 4.4 s (API 2.05 s) | Confirms `OL-2`/`OL-7` path and re-confirms NF-1's corollary: a model call can never sit on the synchronous hook path. Phase A makes no model calls; this pins the Phase B seam's latency class. |
| V10 | `--bare` still severs the piggyback | `claude --help` 2026-08-29: "--bare … Anthropic auth is strictly ANTHROPIC_API_KEY or apiKeyHelper via --settings (OAuth and keychain never read)" | `--bare` remains banned on the piggyback path (AD-21), as the 2026-07-22 review first established. |
| V11 | `--tools ""` disables all built-in tools | `claude --help` 2026-08-29: `--tools <tools...>` — "Use \"\" to disable all tools" | The tool-disallowed invocation (spec §10) has a current implementing flag. |
| V12 | Transcript JSONL structure: entries typed `user` / `assistant` / `attachment` / others; assistant entries carry content blocks typed `thinking`/`text`/`tool_use`, plus `uuid`/`parentUuid`/`timestamp`. **String content does NOT imply a human turn**: enumerating a live transcript containing injected turns shows string-content `type:"user"` entries of three kinds — the genuine human turn (`origin.kind:"human"`, `isMeta` absent), task notifications (`origin.kind:"task-notification"` — text partly authored outside the machine), and Stop-hook feedback (`isMeta:true`) — beside list-content tool results | Enumerated **two** transcripts in this environment (2026-08-29): the interactive-session transcript — (string, meta:∅, origin:human)=1, (string, meta:∅, origin:task-notification)=5, (string, meta:true)=2, (list, no markers)=106 — and a `claude -p` probe transcript whose **genuine user prompts carry no `origin` and no `isMeta` at all** (2 of 2) | AD-11's discrimination keys on the **markers**, never on content shape: a question-bearing transcript turn requires `origin.kind === "human"` and not `isMeta`; anything else — including marker-absent string entries — never opens a question from the transcript (skip + diagnostic). **Marker presence is mode-dependent** (the probe transcript proves genuine turns can lack them), so: mid-session enforcement never depends on the markers (intake reads the `prompt` field), the transcript-rebuild path's dependence on them is disclosed (AD-9, L11), and marker presence on the owner's actual interactive transcripts is a named build-time verification (AD-24). The layout is **undocumented** → adapter + version guard + FR-M2 finding on parse failure. |
| V13 | Repository identity hazards: on this very clone, `git rev-list --max-parents=0 HEAD` returns **4** commits, `--is-shallow-repository` is true, `.git/shallow` has 8 entries | Executed here 2026-08-29 | A shallow clone's "roots" are boundary commits and vary per clone depth (the 2026-07 record measured 6 on a different clone of the same repo). AD-3's rule — never key a store off a shallow history — is re-grounded on fresh evidence. |
| V14 | `web-tree-sitter` (0.26.13) and `tree-sitter-wasms` (0.1.13) are current, pure-WASM (no native toolchain), with no install scripts in the published manifest | npm registry metadata fetched 2026-08-29 | C-3-compatible parser runtime exists. The exact grammar inventory of `tree-sitter-wasms` is a build-time verification (Limitations L6). *(Qualified 2026-09-26: executed 2026-09-11, `web-tree-sitter` 0.26.13 and 0.27.0 load none of the 36 grammars `tree-sitter-wasms` 0.1.13 ships — from 0.26.0 the loader reads only a `dylink.0` section and every shipped grammar carries the legacy `dylink` — so the plan pins 0.25.10, the last 0.25.x; the version is a plan-owned pin, AD-25 decides packages only. Plan §4, probes 20 and 21.)* |
| V15 | `UserPromptSubmit` hooks inject context via plain stdout **or** `hookSpecificOutput.additionalContext` — both "injected as system reminders for Claude" | Current hooks reference + hooks-guide, fetched 2026-08-29 | The Orientation delivery channel (AD-6) is documented; the design uses `hookSpecificOutput.additionalContext` for uniformity with the other events. |
| V16 | `PostToolUse` hooks inject context via `hookSpecificOutput.additionalContext` ("directly enters Claude's context window"); plain stdout from a successful PostToolUse hook goes **only to the debug log** | Current hooks reference + context-window page, fetched 2026-08-29 | Coupling/Reuse delivery channel (AD-6) documented; stdout is not a delivery channel on tool events. |
| V17 | `VACUUM INTO '<file>'` executes on `node:sqlite` and round-trips data (SQLite 3.51.2 bundled); the module-level `backup()` API was **added in Node v22.16.0** (official v22.x API docs) | `VACUUM INTO` executed here 2026-08-29 (source→dest copy verified by query); `backup()` version per the v22.x API docs as recorded in the 2026-08-29 expert-review record | Export (AD-5) uses `VACUUM INTO` — engine-level, version-immune. Import (AD-5) uses `backup()`, which exists only from v22.16.0, so AD-2's 22.16.0 floor is load-bearing for import. *(Corrected 2026-09-26: this row said import also used `VACUUM INTO` and did not depend on the floor, after AD-5 had moved import to `backup()` — review record 2026-09-26, CH R1 / ER M13.)* |
| V18 | A subagent hook's context does **not** reach the parent, and the documented parent channel exists: "To inject context back into the parent session rather than the subagent, a PostToolUse hook on the Agent tool should be used instead" | Current hooks reference (SubagentStop section), fetched 2026-08-29, quoted verbatim | The spec-§13 open item is no longer an unknown: C-4's assumption ("does not propagate") is now documented fact, and the parent-injection option the spec anticipated exists. Nothing in Phase A changes; recorded as premise maintenance (Limitations L9). |
| V19 | `PostToolUse` "fires after a tool executes successfully" and carries `tool_name`/`tool_input`/`tool_response`; **a failing executing tool fires `PostToolUseFailure` instead**, whose `error` string "generally begins with an exit code line" for Bash (the docs' own example payload is a failing `npm test`); `PostToolUseFailure` does **not** fire for pre-execution rejections — permission denials included | Current hooks reference (PostToolUse + PostToolUseFailure sections and payload examples), fetched 2026-08-29 | Failure outcomes (`observed_actions.outcome='failed'`) are producible **only** from `PostToolUseFailure`, so AD-6 wires it observation-only; a `PreToolUse` deny never generates one (the oracle's own denies cannot pollute the outcome record); `tool_name`/`tool_input` on tool events are the documented inputs AD-15's generators read. |
| V20 | **When the model reads `PreToolUse` `additionalContext`.** The `PreToolUse` decision-control table: `additionalContext` is "String added to Claude's context alongside the tool result." The "Add context for Claude" section: for `PreToolUse` (and `PostToolUse`/`PostToolUseFailure`) the reminder appears "next to the tool result", and "Claude reads the reminder on the next model request" | Current hooks reference, `code.claude.com/docs/en/hooks.md`, fetched 2026-09-26; both sentences quoted verbatim from the fetched page (review record `docs/reviews/2026-09-25-skeleton-gap-list-review.md`, "Unverified item — whispers on `PreToolUse`"). Re-fetched 2026-09-28 (CR§2: the same two quotes and "Permission denials fire `PreToolUse`"), and the denial cases tested on Claude Code 2.1.283, `claude -p`, in throwaway `/tmp` directories with a marker-file hook (DE cases A–C; PD: Bash allowed ×2, Bash deny rule ×4, `Edit(./f.txt)` deny rule ×3, another hook's deny ×1) | The hook runs before the tool, but the model first reads a `PreToolUse` whisper **next to the tool result, on the next model request** — whether the call ran, failed, or was denied. When another hook denies the call (DE case B) or a permission rule denies a Bash call (PD), the hook runs and the text reaches the model next to the denial. An `Edit` **path deny rule** (tested; a `Read` rule not tested — F-18) is rejected before hooks run, with the validation result shape (`tool_use_error`), so the oracle is **not invoked** and has nothing to deliver (PD; DE case C; inferred from the result shape plus the marker file — the reference does not name the stage that enforces it). Limits: one Claude Code version, headless `-p` only, the Bash and Edit tools, one path-rule form (PD). A Warning or Consequence on `PreToolUse` Edit/Write therefore informs the move *after* the call (revise, proceed, or retry), never the decision to edit, and is worded about the file the edit targets, never as an edit that happened (AD-15 headline wording; L12). *(Corrected 2026-09-28: this row said "the text is kept if the call fails (FR-O2)"; that clause is on no page of the hooks reference (CR§2: `webquote.py` exit 1) — R-8; CR§2, DE, PD. The spec's FR-O2 still carries it: **pending spec sign-off R-1…R-5**.)* |
| V21 | "Stderr from a hook that exits 0 goes to the debug log only, never the transcript, and Claude never sees it." | Current hooks reference, `code.claude.com/docs/en/hooks.md`, fetched 2026-09-26, quoted verbatim (review record 2026-09-25, G10). Observed in the same review on Node 22.22.2: the built handler's stderr was empty on `SessionStart`/`PostToolUse`/`status` with `NODE_NO_WARNINGS` unset — an observation on one Node version, not a guarantee | The handler always exits 0 (AD-7), so anything on its stderr — including `node:sqlite`'s `ExperimentalWarning` — never reaches the model's context. **No warning-suppression mechanism is built**; the hazard does not exist on this contract. |
| V22 | **`SessionStart` input does not name a parent session**, and injected context is saved in the transcript. The documented `SessionStart` input is the common fields (`session_id`, `transcript_path`, `cwd`, …) plus `source`, `model`, `agent_type`, `session_title`, and — on `resume`/`fork` — four resume-cost fields; `fork` is "A new session forked from an existing one". Separately: "Claude Code saves the injected text in the session transcript." | Current hooks reference, `code.claude.com/docs/en/hooks.md` ("SessionStart input" table and "Add context for Claude"), fetched 2026-09-26; re-fetched 2026-09-28 with the Agent SDK TypeScript reference (`code.claude.com/docs/en/agent-sdk/typescript.md`): `SessionStartHookInput` = `BaseHookInput` (`session_id`, `transcript_path`, `cwd`, `prompt_id?`, `permission_mode?`, `effort?`, `agent_id?`, `agent_type?`) plus `source: "startup" \| "resume" \| "clear" \| "compact" \| "fork"` — no parent-session field in either type, and the SessionStart input section never mentions a parent (G-11; settlements). This is the documented field list, **not an observed fork payload**: no forked session exists locally to observe, so what the fork's transcript file holds (the SDK: a fork "starts with a copy of the original's history") and which `sessionId` its copied entries carry are not observed | Closes the review's open premise (G23/G29): a forked session arrives under a **new** `session_id` with no parent pointer, so AD-16's fork reseed reads the forked transcript itself — questions by AD-9's offset-0 rebuild, the delivered set from the oracle-injected text the transcript carries — reading **every** entry whatever its `sessionId` field, so the unobserved copy cannot be silently filtered out (AD-16). The plan's optional fork probe (`claude -p --output-format json`, then `--resume <id> --fork-session`, both `SessionStart` inputs captured by a hook) settles the unobserved part for the `--fork-session` route only; `/fork` and `/branch` are documented as the same `source` and are not observed. This row keeps "not an observed fork payload" until the probe has run, then cites its output (R-139's premise, G-11; settlements). |
| V23 | **Transcript tool results mark failure, not success.** Across 24 local transcripts: `is_error: false` appears only on Bash results (845); no successful Read (373), Edit (89), or Write (12) result carries an `is_error` field; the one failed Read carries `is_error: true` | Executed 2026-09-26 in the plan-pass collapse-hunt (`docs/reviews/2026-09-26-plan-pass-collapse-hunt.md`), Claude Code 2.1.283. An observation of one version's undocumented layout (V12), not a contract | AD-16's reseed classifies a result as successful unless it carries `is_error: true`; AD-11's layout-change detector is the guard if this changes. |
| V24 | **A hook's `additionalContext` is capped at 10,000 characters.** "A hook's `additionalContext`, `systemMessage`, and `initialUserMessage` strings, and its plain stdout, are capped at 10,000 characters"; each string "on its own, even when several hooks run for the same event"; over it, Claude Code "saves the output to a file in the session directory and replaces it with the file path and a preview of up to the first 2,000 characters", with "no setting or environment variable to raise it", and "doesn't ask Claude to read the file" | Current hooks reference, `code.claude.com/docs/en/hooks.md`, fetched 2026-09-28 with `curl` (the lines quoted; the review's copy of the same day reads identically) | AD-16's composer rule keeps a response within the cap and orders whispers by rank; what happens when the cleared whispers do not fit is pending owner decision (`OL-C1`); R-20's name bound waits on that decision (AD-12) (F-22; settlement (a)). |

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
ctxoracle export-human /        ← the human rows out and back around a
          import-human            rebuild (AD-4's schema check)

Stores (outside the repo tree, AD-3):
  ~/.ctxoracle/projects/<repo-key>/store.db     (project store, AD-4)
  ~/.ctxoracle/projects/<repo-key>/reindex.lock (the reindex claim's lock
                                                 database, AD-26)
  ~/.ctxoracle/global/global.db                 (global store, AD-5)
  ~/.ctxoracle/projects/<repo-key>/diagnostics/ (JSONL fault channel, AD-17)
  ~/.ctxoracle/diagnostics/                     (home-level JSONL fault channel for
                                                 faults before a repository is
                                                 known, AD-17)
```

There is **no long-running process**. Warm state that the 2026-07 record kept in a
daemon's memory (files seen, whispers sent, open questions) lives in the project
store, which is both simpler and required anyway by `FR-A4`'s cross-session dedup
reconciliation (`D-20`).

### Data flow — one `PreToolUse` event, happy path

1. Claude Code runs the wired command `ctxoracle hook pre-tool-use` with the hook
   JSON on stdin (timeout configured 5 s; internal watchdog 2.5 s).
2. Guard: `CTXORACLE_INTERNAL` unset → proceed. Parse stdin; derive consumer key
   `(session_id, agent_id | "main")` (AD-4).
3. Resolve the repository by the bounded upward walk and the `init`-recorded
   path→key binding, read from the global store opened **read-only** (AD-23; no
   `git` subprocess; a worktree resolves to its main repository); a miss — no
   binding, or no global store at all — → not initialized, exit 0 silent, nothing
   written except the once-per-session `repo_not_bound` fault on the home-level
   channel (AD-17). Open the project store (WAL; ~2 ms, V8) and check its schema
   (AD-4: a store whose applied migrations differ from the ones its `fts_state`
   selects is refused, and one with a migration still to apply is pending — either
   way the event is silent, a fault goes to the JSONL channel, and nothing is
   written to the store; on `SessionStart` and `UserPromptSubmit` a pending store
   still gets the detached `ctxoracle index` child, whose CLI open migrates it —
   F-1, F-3). Build the
   tuning reader (AD-14: any invalid stored row silences the whole event, F-2). Run the transcript catch-up: read
   `transcript_path` from the per-consumer bookmark offset to EOF; classify each
   completed entry (new user questions opened, assistant text turns cleared
   against open questions); advance the bookmark (AD-9/AD-11).
4. Block check (main consumer only): open questions present? If yes and the tool
   is in the deny-eligible class and the move is clearly non-answer-directed,
   write the deny to the audit log, then return
   `permissionDecision:"deny"` + reason naming the outstanding question(s). If
   the audit write fails, no deny is emitted (fail-open, AD-19). Otherwise:
5. Candidate generation for the genres this event triggers (Consequence, Warning
   on Edit/Write; Coupling/Reuse fire on PostToolUse). Store queries only. The
   model reads a `PreToolUse` whisper next to the tool result, on the next model
   request, whether the call ran, failed or was denied (V20; pending spec
   sign-off R-1…R-5), so these are written as facts about the file the edit
   targets, never as an edit that happened (AD-15).
6. Bar (AD-14), dedup (AD-16), compose (pointer-carrying, non-imperative,
   `[oracle]`-prefixed — `FR-D1`/`FR-D2`; whole whispers in rank order within
   the harness's 10,000-character `additionalContext` cap, withholding when they
   do not all fit pending owner decision (`OL-C1`), AD-16), audit-log-then-emit: the whisper is
   written to `whisper_audit` first; only a logged whisper is returned as
   `additionalContext` (AD-19).
7. Diagnostics row (event, candidates, outcome, latency). Exit 0.

On any error or watchdog firing anywhere in 2–7: exit 0 with no output — no deny,
no whisper, a best-effort direct-to-file diagnostic. This is `FR-O3` as the spec
states it: "Any shim/service error, timeout, or missing store yields silence —
and, on a block path, **emits no deny, so the agent's action proceeds** — never
an error in the agent's flow" (spec L508–L510). An invalid stored tuning row is
one such error and is not contained more narrowly: it silences the whole event —
no whisper and no deny — and is recorded as `tuning_invalid` (AD-14; F-2; spec
FR-O3, coordinator ruling).

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
| Security | Threat-mapped controls: redaction at every ingress, pointer-only composition, trust labels lowering confidence (a dampener, plus a cap on injection-suspect facts — AD-14), non-droppable audit, least privilege (no credentials, no network, 0700 stores) | AD-19, AD-4, threat model |
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

**Fact (verified this session):** everything in the Verified premises table (V1–V19;
V20–V22 added 2026-09-26).
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
   failure path, search falls back to token-prefix queries over indexes that can
   serve them — a `symbol_tokens(token, symbol_id)` table and a
   `path_tokens(token, file_id)` table of the path's in-house tokens, one row per
   token, each with a plain index on the token (a name such as `Foo::Bar` is two
   tokens, so a prefix query for `bar` needs a row per token, not one column; a
   path segment such as `foo-bar.ts` is three tokens, so a table of segments would
   miss `src/foo-bar.ts` for `bar`) — behind the same interface, and
   `status` says so plainly. The store's search state is recorded once
   (`schema_meta.fts_state`, `'fts5'` or `'fallback'`) and never retried, and the
   fallback tables are **written only under `fts_state = 'fallback'`** (migration
   001 creates them in both states, empty under `'fts5'`, so one DDL serves both):
   no requirement, test or state transition reads them in an `'fts5'` store. If a
   later pass finds a reason to write them in both states, it is recorded here with
   its source first. **Both paths use one tokenizer, in the oracle's own
   code:** NFKD-normalize, drop combining marks, **then** split on every
   non-letter/non-digit (Unicode), then lowercase. **Invariant:** every token is
   letters and digits only, lower-case. Normalizing first is what makes the
   invariant hold: split first, a kept `\p{N}` codepoint can NFKD-expand into
   separators (`x⑴y` became the token `x(1)y`, which both FTS5 tokenizers
   re-split), and the fallback would then store a token the FTS path does not
   (B5a E-18, executed). Under the corrected order `x⑴y` → `x`, `1`, `y`; `x¼y` →
   `x1`, `4y`; `İstanbul` → `istanbul`; every output letters and digits (executed
   2026-09-28, Node 22.22.2). The FTS path indexes those tokens joined by spaces
   under the named FTS5 tokenizer **`ascii`**, which passes a lower-case
   letter/digit token through unchanged (it splits only on ASCII
   non-alphanumerics and folds only ASCII case, so it is a pass-through exactly
   because of the invariant — `unicode61`'s own case folding and diacritic removal
   would be a second folding by design), and the query is tokenized the same way;
   the fallback stores the same tokens. So paths **and** symbols agree by
   construction — symbols through `symbol_tokens`, a folded key of the same
   tokens, not a `NOCASE` column that folds ASCII only — including `CAFÉ`/`café`,
   `Über`, `foo-bar`, `my.method`, and `Foo::Bar`. **`_` and `$` are separators**,
   like every other non-letter/non-digit: keeping them as token characters would
   break the letters-and-digits invariant the `ascii` pass-through rests on (it
   would need a `tokenchars` option on one path and a special case on the other),
   and a snake_case identifier's parts are then searchable exactly as `foo-bar`'s
   are (`name` finds `user_name`); what it costs is that `user_name` no longer
   matches as one token, and a camelCase name stays one token (`getusername`).
   *(Corrected 2026-09-28: the order was split-then-normalize, the path table was
   "a table of path segments", AD-4 kept both fallback tables "in both search
   states" with no reason on record, and no FTS5 tokenizer was named — R-10; B5
   verification ruling 3, B5a E-18, B5c E-1, E-2, B4 p1 E-13.)*
   *(Corrected 2026-09-26, second time: a
   `COLLATE NOCASE` index folds ASCII only, and FTS5's own tokenizer and a `LIKE`
   fallback disagreed on non-ASCII case and on punctuation — executed in both
   plan-pass reviews, collapse-hunt H4 / expert M3.)*
   *(Corrected 2026-09-26: this said "indexed `LIKE`/token-prefix"; executed in
   the plan pass, a plain index on `symbols(name)` is not used by `LIKE` — a
   full scan, O(store), which AD-23 forbids on the event path — and no `LIKE`
   over `files.path` can match a middle segment with an index. Plan D-plan-36.)*
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
     projects/<repo-key>/reindex.lock      # the reindex claim's lock database (AD-26)
     projects/<repo-key>/diagnostics/<session-short>.jsonl
     diagnostics/<session-short>.jsonl     # home-level fault channel (AD-17)
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

   schema_meta(key TEXT PRIMARY KEY, value TEXT) -- schema_version, the per-migration
                                                 -- checksums (the schema check below),
                                                 -- fts_state (AD-2; it selects the
                                                 -- migration set, below),
                                                 -- history_reset_pending (1 while
                                                 -- 003's chunked reset has rows left
                                                 -- to delete; below and AD-13),
                                                 -- reweight_pending (AD-13's
                                                 -- re-weight marker: 'all' or a
                                                 -- floor time),
                                                 -- head_unresolved_since (AD-23),
                                                 -- repo_key, keying_mode,
                                                 -- last_mined_commit (the watermark:
                                                 -- the HEAD the last completed pass
                                                 -- mined to) and last_mined_ref (the
                                                 -- ref it was mined on, or the
                                                 -- detached marker; AD-13),
                                                 -- weight_epoch, ref_ts, index_head,
                                                 -- fold_watermark_audit,
                                                 -- fold_watermark_corrections
                                                 -- (AD-5's fold watermarks, over
                                                 -- whisper_audit.seq and
                                                 -- corrections.seq; they live
                                                 -- beside the rows they index),
                                                 -- mining_in_progress (1 while a
                                                 -- mining pass whose re-weight,
                                                 -- evictions and additions take
                                                 -- more than one write transaction
                                                 -- runs, or 003's reset is
                                                 -- unfinished; AD-13, AD-26),
                                                 -- mined_half_life_days (AD-13),
                                                 -- reindex_owner_pid and
                                                 -- reindex_started_at (information
                                                 -- for status and the refusal
                                                 -- message only; the claim itself
                                                 -- is the lock, AD-26),
                                                 -- the tuning_invalid marker (AD-14)
   files(id, path UNIQUE, lang, zone CHECK(zone IN
         ('source','generated','vendored','build_output','unknown')),
         zone_evidence, zone_evidence_suspect INTEGER DEFAULT 0,
         entry_score INTEGER DEFAULT 0,   -- AD-12: in-degree + path markers
         in_tree INTEGER NOT NULL CHECK(in_tree IN (0,1)),
                                          -- 1 = listed by the current index walk
                                          -- AND the indexer's stat of it
                                          -- succeeded (the walk lists tracked
                                          -- files deleted from the working
                                          -- tree, AD-12);
                                          -- 0 = history-only (miner-created, or
                                          -- deleted from the tree since). No
                                          -- whisper points at an in_tree=0
                                          -- file (AD-15). A
                                          -- deleted file's row is KEPT while
                                          -- mined history references it: the
                                          -- indexer deletes its symbols/
                                          -- import_edges/FTS rows and sets 0,
                                          -- never cascading away its pairs or
                                          -- landmines. Miner-created rows get
                                          -- in_tree=0, zone='unknown'.
         change_count INTEGER NOT NULL DEFAULT 0,
                                          -- frequency(file), ROSE's term: the
                                          -- contributing commits touching the
                                          -- file (AD-13); "support" is kept
                                          -- for pair_count only
         change_weight REAL NOT NULL DEFAULT 0,
                                          -- the same commits, each weighted
                                          -- 2^((ts − E)/h), E =
                                          -- schema_meta.weight_epoch (AD-13's
                                          -- recency weighting; F-15)
         unresolved_imports INTEGER NOT NULL DEFAULT 0,
                                          -- captured import specifiers the
                                          -- frontend classified unresolved
                                          -- (AD-12); feeds the per-language
                                          -- unresolved share (Reuse, AD-15)
         content_hash, mtime, …prov)
   symbols(id, file_id→files, name, kind, span_start, span_end, …prov)
   import_edges(src_file→files, dst_file→files, kind)      -- file-level imports
   symbol_refs(symbol_id→symbols, src_file→files, ref_count) -- identifier-match
                    -- heuristic (AD-12); feeds the Reuse headline (AD-15) and
                    -- entry-point in-degree; confidence-capped as a heuristic
   test_map(test_file→files, region_glob, source, …prov)   -- FR-A2g mapping
   commits(hash PRIMARY KEY, ts, entity_count, excluded INTEGER, exclude_reason,
           weight REAL NULL)
                  -- one row per commit of the pass's target set T(HEAD) only
                  -- (AD-13), size-excluded ones included so their labels and
                  -- reasons stay; a commit beyond either horizon has no row;
                  -- weight: the recency term the commit added to every sum it
                  -- contributed to (NULL when it contributes nothing),
                  -- recomputed with the sums by AD-13's re-weight when
                  -- refTs, the epoch or h changes (added by 003 as a
                  -- column with no constraint)
   commit_touches(commit_hash TEXT NOT NULL REFERENCES commits(hash),
                  file_id INTEGER NOT NULL REFERENCES files(id),
                  PRIMARY KEY (commit_hash, file_id)) STRICT, WITHOUT ROWID
                  -- + INDEX (file_id, commit_hash); the file ids each
                  -- contributing commit added to change_count and the pair
                  -- counts, so an eviction recomputes the sums from what the
                  -- miner itself recorded (AD-13). Bounded by the horizon:
                  -- miner.horizon_commits × miner.max_transaction_entities
                  -- = 10,000 × 30 = 300,000 rows at the seeds; created by
                  -- 003_phase_a_project.sql
   cochange_pairs(a→files, b→files, pair_count, pair_weight, last_ts, last_commit,
                  PRIMARY KEY(a,b))                        -- last_commit: the
                  -- included commit touching both with the greatest ts, ties
                  -- broken by the greater hash — one rule for the mine's upsert
                  -- and the eviction's recompute (AD-13); the commit pointer
                  -- AD-15's pair headlines carry (no git subprocess at compose,
                  -- AD-23)                        -- a<b canonical; FR-K2;
                  -- no per-file counters here: frequency(a) is
                  -- files.change_count
   landmines(id, kind CHECK(kind IN ('revert_chain','fix_chatter','human_stated')),
             file_id→files, evidence NOT NULL, support INTEGER, …prov)  -- FR-K3..K5
             -- miner kinds (revert_chain, fix_chatter): at most ONE row per
             -- (kind, file_id), support = the count, rebuilt from
             -- labelled_touches at the end of every mining pass (AD-15);
             -- human_stated rows are never rebuilt or deduplicated this way
   labelled_touches(file_id→files, commit_hash, label CHECK(label IN
             ('revert','fix')), ts, PRIMARY KEY(file_id, commit_hash, label))
             -- written only for labelled commits (AD-15); the landmine
             -- derivation's source. Not a per-commit transaction list: it
             -- holds the labelled subset only and serves only landmines
   invariants(id, description, …prov); invariant_members(invariant_id, file_id, span)
   -- exemplars / recipes: their FORM is fixed here per FR-K3–K5 (pointers to
   -- real code, full provenance block, trust label) but the TABLES are created
   -- by the migration of the phase that first writes them (Phase B/C), per the
   -- creation criterion below. No dormant tables ship in Phase A.
   human_facts(id, statement, target_kind, target_ref, stated_at, …prov) -- FR-L6
   corrections(seq INTEGER PRIMARY KEY, id UNIQUE, whisper_id NULL, deny_id NULL,
               verdict CHECK(verdict IN ('false_fire','missed','confirm')),
               genre NULL,                            -- the --genre of a
                                                      -- whisper-less `missed`
                                                      -- (AD-18), or
                                                      -- 'answer_drift' for
                                                      -- --missed-question
               note, ts)                              -- FR-D4/FR-L6/AC-2c;
               -- at most one of whisper_id / deny_id; both NULL only for a
               -- `missed` verdict (the whisper-less report AD-5 folds by
               -- genre, `unattributed` when genre is NULL);
               -- seq = the AD-5 fold watermark key (see whisper_audit);
               -- append-only like whisper_audit: no code path deletes or
               -- updates a corrections row, which is what keeps seq
               -- monotonic for the fold (AD-5). A purge or import replaces
               -- the whole store, rows and fold watermarks together.
   stats_folds(seq INTEGER PRIMARY KEY, genre, sent, corrected_false,
               corrected_missed, audit_from, audit_to,
               corrections_from, corrections_to, ts)
               -- AD-5's fold ledger: one row per (genre, fold); each
               -- from/to pair is the previous and new value of its
               -- watermark. WRITER: the fold, in the same transaction that
               -- advances the two schema_meta watermarks. Append-only.
   -- CONSUMER KEY (every `consumer` column below — questions, classify_state,
   -- consumer_state, observed_actions, whisper_audit, session_log): one string
   -- encoding (session_id, agent_id | 'main'). A consumer is one agent in one
   -- session, never a role: two sessions on one repository, or two subagents
   -- in one session, never share a row. The role (main | subagent) is derived
   -- from the key and used only for FR-O6's main-only deny scope (AD-9).
   questions(id, consumer, question_text, content_hash,
             asked_uuid NULL, asked_offset NULL,   -- backfilled at reconciliation
             status CHECK(status IN ('open','answered','expired')),
             closed_by_uuid NULL,
             closed_by_kind NULL CHECK(closed_by_kind IN
               ('generic_text_all_prior','expired',
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
                                   -- questions (AD-9)
   observed_actions(session, consumer, seq, tool, path NULL, command_class NULL,
                    outcome NULL CHECK(outcome IN ('ok','failed')),
                    content_hash NULL,  -- the edited file's hash after an ok
                                        -- Edit/Write (AD-23's post-write read);
                                        -- NULL above the AD-12 cap; FR-L4 input
                    ts)
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
                    --    revert clause (AD-18) — consume 'ok' rows only, and
                    --    read the Edit/Write/Read tool rows only (NOT the Bash
                    --    path-write rows below): a Bash-written file carries no
                    --    region granularity and is not a Phase A change-set
                    --    member — the safe under-detection direction. A failed
                    --    Edit is not a change, a failed Read is not a read, and
                    --    a failed Edit is not a re-edit (counting it would
                    --    inflate regret).
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
                    --    `path`; it fires only when that `path` matches the
                    --    denied action's target file_path, which the deny
                    --    handler recorded in the kind='deny' row's
                    --    evidence_json (a denied Edit runs no PostToolUse, so
                    --    its target has no observed_actions row — AD-9). An
                    --    uncorrelated write, incl. a redirected test run, does
                    --    not fire; distinct from the run-state command_class.
   whisper_audit(seq INTEGER PRIMARY KEY, id UNIQUE, session, consumer,
                 kind CHECK(kind IN ('whisper','deny')),
                 genre, ts, text, evidence_json, confidence, channel,
                 subject_key NULL,  -- the whisper's AD-16 subject key (NULL on
                                    -- deny rows); the fork reseed maps a
                                    -- transcript's injected text back to it
                 continuation INTEGER DEFAULT 0)            -- FR-X6, non-droppable
                 -- seq: an explicit INTEGER PRIMARY KEY (a rowid alias), the
                 -- AD-5 fold watermark key. Explicit, not the implicit rowid,
                 -- because SQLite documents that VACUUM "may change the ROWIDs
                 -- of entries in any tables that do not have an explicit
                 -- INTEGER PRIMARY KEY", and export is VACUUM INTO (AD-5);
                 -- id stays the ULID other tables reference (AD-26)
   faults(id, ts, code, detail_json, session NULL)          -- FR-M2
   fts_symbols / fts_paths (FTS5, tokenize='ascii') -- over AD-2's in-house tokens
   symbol_tokens(token, symbol_id→symbols)       -- AD-2's fallback: one row per
                                                 -- normalized name token
   path_tokens(token, file_id→files)             -- one row per path token;
                                                 -- both fallback tables written
                                                 -- only under fts_state =
                                                 -- 'fallback' (created empty by
                                                 -- 001 otherwise; AD-2)
   -- Created by 003_phase_a_project.sql (with commit_touches and
   -- commits.weight above; F-7):
   resolution_probes(importer_file_id INTEGER NOT NULL REFERENCES files(id),
                     probe_kind TEXT NOT NULL CHECK(probe_kind IN
                       ('path','manifest','name')),
                     probe_key TEXT NOT NULL,   -- a repo-relative path (a probed
                                                -- candidate or the manifest read),
                                                -- or a top-level name queried;
                                                -- never a specifier (AD-19)
                     present INTEGER NULL CHECK(present IN (0,1)),
                                                -- path/name: the answer given
                     manifest_hash TEXT NULL,   -- manifest: the content hash read
                     PRIMARY KEY (importer_file_id, probe_kind, probe_key))
                     STRICT, WITHOUT ROWID
                     -- + INDEX (probe_kind, probe_key): a path that appears or
                     -- disappears, or a manifest whose hash changes, finds its
                     -- importers (AD-12's dependency tracking, R-19). Deleted
                     -- with the importer's symbols and import_edges.
   lang_capabilities(lang TEXT PRIMARY KEY,
                     frontend TEXT NOT NULL CHECK(frontend IN ('tree_sitter','generic')),
                     frontend_digest TEXT NOT NULL,  -- R-19's per-language
                                                     -- fingerprint: content digest
                                                     -- of grammar WASM, query,
                                                     -- frontend and resolver code
                     symbols INTEGER NOT NULL CHECK(symbols IN (0,1)),
                     imports INTEGER NOT NULL CHECK(imports IN (0,1)),
                     test_map TEXT NOT NULL CHECK(test_map IN
                       ('import_edges','same_dir','none')),
                     exclusion_cause TEXT NULL)      -- a grammar still excluded
                     STRICT                          -- and why (AD-12, R-14)
   file_parse(file_id INTEGER PRIMARY KEY REFERENCES files(id),
              outcome TEXT NOT NULL CHECK(outcome IN ('error_tree','parse_failed')),
              content_hash TEXT NOT NULL) STRICT
              -- a row only for a file whose last parse was not clean: an
              -- ERROR-tree parse (counted per language in status by a GROUP BY
              -- over this table, so no count is stored twice) or a parse that
              -- threw and fell to the generic frontend (R-20's re-parse mark:
              -- the next pass in which the grammar is enabled re-parses a
              -- parse_failed file even if content_hash is unchanged)
   ```

   All writes go through DAOs; the learned-record entry point accepts only
   `trust='untrusted_repo'` unless every input is human-provenance (`FR-X4` —
   trust is never laundered). The `trust` CHECK's third value `'mechanical'` is
   present for forward-compatibility with later-phase mechanically-generated
   content (`FR-X2`, which permits verbatim quotation only for such content);
   no Phase A writer emits it — Phase A has no model composing content — and the
   `prov_ref` format list above intentionally gives it no Phase A form. The
   runtime gate (`assertProvenance`, `T-9-1`) rejects a Phase A learned-record
   write that attempts `'mechanical'`, so the schema is a forward-compatible
   superset while the Phase A policy is the two-value rule above.

   **Table-creation criterion (applied uniformly):** a table exists in a
   phase's store only if that phase has a writer for it. Where the spec fixes a
   schema's *form* (FR-K3–K5), the form is designed here; the table itself
   arrives with the migration of the phase that first writes it (a new migration
   file, never an edit of an applied one — the schema check below). This is the same ground
   on which AD-5 declines the Phase C `genre_state` ladder — one criterion,
   no exceptions: `exemplars`/`recipes` (Phase B/C writers), the FR-J5
   `deferred_queue` (Phase B, AD-22), and the piggyback probe cache
   (`env_capabilities`, Phase B, AD-21) are all created by their writing
   phase's migration, not shipped dormant.

   **The store schema check — migrations are fixed once applied (both stores;
   AD-5 for the global one).** A changed schema is a new migration; an applied
   one is never edited. When a migration runs, a checksum of that migration
   file's content is stored in `schema_meta` (`global_meta` for the global
   store). **The migrations a store must hold are the ones its own state
   selects** (F-1; `src/stores/migration_runner.ts`, which applies
   `001b_phase_a_fts.sql` only when `fts_state = 'fts5'`): for a project store,
   `001_phase_a_project.sql`, then `001b_phase_a_fts.sql` only under
   `fts_state = 'fts5'`, then `003_phase_a_project.sql` and every later project
   migration; for the global store, `002_phase_a_global.sql` and every later
   global one. In a `'fallback'` store 001b is neither applied nor pending, so a
   fallback store opens clean on the hook path and on a CLI open and never has
   FTS5 DDL applied on the build that lacks FTS5 (AD-2: the search state is
   recorded once and never retried); a test pins it — a `'fallback'` store
   opens clean on the hook path and on a CLI open (AD-24). On **every** open — each CLI verb, the hook
   path, `import` — the stored checksums are compared with the shipped files of
   that selected set: the migrations the store has applied must match them byte
   for byte, and those of the set it has not yet applied are pending. A store
   built before checksums existed records `schema_version` `'1'` and no
   checksums; the open then computes a **fingerprint of the store's own DDL**
   (`sqlite_master.sql`, normalised) and compares it with the fingerprints of the
   current migration set and of every earlier set committed on the branch (the
   migration files at `4dd0f00` and at each later commit that changed them), each
   computed for both `fts_state` values and compared with the one the store's
   own `schema_meta.fts_state` names. The list is **a committed source file**
   (`src/stores/migration_fingerprints.ts`), generated once by a script from
   `git log` and pinned by a test that recomputes the current set's fingerprints
   from the shipped files: the build is `tsc` only (AD-25) and an installed
   package has no git history, so nothing reads `git log` at build or run time
   (F-17). Outcomes:
   - *checksums match* → open; a pending migration is applied by a CLI open
     (`init`, `index` and the other verbs), inside one transaction that re-reads
     the applied set after `BEGIN IMMEDIATE`, so two CLI opens racing to migrate
     apply it once. The step is recorded as `store_migrated`
     (`{from, applied: [file…]}`).
   - *a known older fingerprint* → its forward migration, written and tested per
     old schema, is applied the same way and recorded as `store_migrated`; it
     carries **every human-provenance row** across (`prov_kind = 'human'` or
     `trust = 'human'`, and the `human_stated` landmines). Whether every such row
     has a target column is checked, read-only, before its first write: where a
     column has no equivalent, the migration fails and changes nothing — it
     never drops the row.
   - *a checksum mismatch, or an unknown fingerprint* → the open is refused,
     nothing is written, and `store_schema_refused`
     (`{reason: 'checksum_mismatch'|'unknown_fingerprint', migration}`) is
     recorded on the JSONL channel. The CLI says in plain language that the store was built
     by another build, offers `ctxoracle export-human <file>` (every row whose
     provenance or trust is `human`, read by column name, written to a JSON
     file, reporting any row it could not read), and explains that rebuilding
     (`deinit --purge`, then `init`) deletes those rows unless they were
     exported, and that `import-human <file>` restores them after `init`.
   - *the hook path* writes nothing to the store in every case: a store that is
     refused, or that is pending (a migration of its set not yet applied, or a
     known older fingerprint), makes the event silent (the agent is not blocked,
     `FR-O3`) and records `store_schema_refused` or `store_migration_pending`
     (`{pending: [file…]}` or `{fingerprint}`) on the JSONL channel (AD-7's
     direct file write). **A pending store is migrated without waiting for the
     owner** (F-3): on `SessionStart` and on `UserPromptSubmit` — the latter so
     a session already running when the build is upgraded is not silent until
     its next `SessionStart` — the handler still spawns the detached
     `ctxoracle index` child (fire-and-forget, `CTXORACLE_INTERNAL=1`, AD-23's
     inventory; only while the store is pending, which ends when the first
     child's migration commits, and a second child finding the reindex lock
     held exits with `reindex_locked`), run at the bound repository root — for a worktree event, the
     main repository's root the binding names, so it never indexes the
     worktree's tree (AD-23's worktree rule) — and that child's CLI open applies
     the migration. A refused store is not spawned for: its fix is the owner's
     (above). `status` lists a refused schema, a pending migration and a pending
     data step (below) among the active suppressing conditions, each with the
     command that resolves it (AD-17).
   **Every migration transaction is bounded like every other writer's** (F-4;
   AD-26's rule: below 150 ms). It holds only steps whose cost does not grow
   with the stored rows — `CREATE TABLE`, `CREATE INDEX` on a table the same
   migration creates, and `ALTER TABLE … ADD COLUMN` with no constraint ("No
   changes are made to table content for renames or column addition without
   constraints. Because of this, the execution time of such ALTER TABLE commands
   is independent of the amount of data in the table", `sqlite.org/lang_altertable.html`,
   fetched 2026-09-28; the same page says a column added with a `CHECK` is
   tested against every existing row, which is why 003 adds `commits.weight`
   with none and keeps `file_parse` as a new table instead of a checked
   column) — plus a fixed number of `schema_meta` rows. A step whose cost grows
   with the stored rows never runs in the migration's transaction:
   - *deleting derived rows* (rows an index or mining pass rebuilds, such as
     003's history reset, AD-13) is recorded by the migration as a pending
     **data step** (`schema_meta.history_reset_pending = 1`, set together with
     `mining_in_progress = 1` so no reader sees the migrated schema over
     un-reset counts), and the next index pass — the spawned child's own, above
     — executes it in bounded, yielded chunks (AD-26), each an idempotent
     delete, clearing the marker in the last chunk's transaction, so a crash
     leaves the marker set and the next pass resumes. The store serves at once;
     only the history genres wait, under `mining_in_progress` (AD-13);
   - *moving rows into a rebuilt table* (only a forward migration can need it;
     003 does not) runs in the migrating CLI open itself, in bounded, yielded
     chunks — each copies a key range with `INSERT OR IGNORE` and deletes it from
     the old table — before the emptied old table is dropped; the migration's
     checksum is recorded in the last chunk's transaction, so the store stays
     pending, and the event path silent, until then, and a crash resumes at the
     next CLI open.
   *Why (F-1, F-3, F-4):* a check that called every shipped file pending made
   001b permanently pending in every `'fallback'` store; a pending migration
   silenced every event until the owner happened to run a verb, and this
   correction ships one (003) that every existing store — Max Cogar's included
   (CR§1) — would have waited on; and a migration that deleted every mined row in
   one transaction contradicted AD-26's bound (the one measured write of that
   size held the lock 414 ms, AD-26). The spawn is off the event path, so NF-1
   is untouched; the silence it ends lasts from the upgrade until the first
   `SessionStart` or `UserPromptSubmit` after it has spawned a child and that
   child's migration has committed, a transaction bounded as above.
   There is **no automatic purge and no silent re-migrate**, and nothing deletes
   a human-provenance row: `deinit --purge` refuses while the store holds
   human-provenance rows that were not exported, unless `--discard-human` is
   passed, and says how many rows would be lost (AD-20). *Why (R-35; CR§1,
   store-recovery):* the runner recorded `schema_version` `'1'` for every schema
   it ever built and returned early on `≥ 1`, while the migration files were
   edited in place after `4dd0f00` (125 insertions, 40 deletions since
   `de66831`), so a store built by any earlier build — Max Cogar's included; he
   has run `init` ("yes i used that before", recorded in CR§1) — opened as
   current and ran code against tables that were not there. Flyway's `validate`
   is the standard: "Validate works by storing a checksum (CRC32 for SQL
   migrations) when a migration is executed." A checksum, not a hand-bumped
   number, catches an edit nobody remembered to bump; the fingerprint identifies
   the stores that predate checksums; and a refusal must not destroy data
   (fail-fast, Shore, IEEE Software 2004), so recovery exports what no rebuild
   can recreate before anything is deleted. The earlier "no store has shipped"
   premise is withdrawn: it was never verified, and the check does not depend on
   it.
2. **Standard.** `FR-K6` governing; database-normalization practice (3NF: a
   fact that depends only on the file — its change count — is stored once, with
   the file, and never duplicated into pair rows; no in-band sentinel stands for
   a missing attribute, so "not in the tree" is `in_tree = 0`, never an empty
   `content_hash`); Zimmermann et al., IEEE TSE 31(6) 2005 (the "(occurrence)
   frequency of a set x in a set of transactions D" — the number of transactions
   containing A, the denominator AD-13 needs; ROSE keeps "support count" for "the
   number of transactions the rule has been derived from", which is
   `pair_count` — R-40; B3a E-7); Flyway `validate` for the schema check; SQLite's `ALTER TABLE` cost rule for the migration bound; OWASP
   ASI06 (memory/context poisoning) drives the trust-and-suspect columns.
   **Superseded 2026-09-26** (review record 2026-09-25, G2/G3/G5/G23): the
   earlier `cochange_pairs.a_count`/`b_count` counters — declared then as a
   read-speed trade-off — could not be maintained correctly: a commit touching
   only `a` has no pair row to increment, and a pair row created later cannot
   learn `a`'s earlier total, so the built counters equalled `pair_count` and
   every confidence read 1.0 (executed: `a.txt` changed 7 times, 4 with `b.txt`,
   stored `a_count 4`; true confidence 4/7 = 0.57, below the 0.6 floor). The
   earlier cascade-on-delete rule destroyed a deleted file's pairs and
   landmines, while a never-indexed deleted path kept them — the same history
   fact kept or lost by accident; `in_tree` replaces both behaviours with one
   rule. Landmine rows keyed on a pass-specific evidence string duplicated per
   mining pass (executed: two `fix_chatter` rows, support 4 and 3, for one
   file); `labelled_touches` plus the per-pass rebuild replaces that.
   **Changed 2026-09-26, second pass** (review record 2026-09-26): `in_tree = 1`
   now also requires a successful stat, because `git ls-files --cached` lists a
   tracked file deleted from the working tree (executed, ER M3); `corrections`
   is stated append-only, because AD-5's `seq` monotonicity premise cited a
   non-deletion rule AD-4 stated only for `whisper_audit` (CH H8 / ER M6);
   `whisper_audit.subject_key` exists because the fork reseed had no way from
   rendered text to a subject key (CH H2 / ER M8); `files.unresolved_imports`
   serves AD-15's Reuse comparability (CH H4); `stats_folds` and the two
   `schema_meta` fold watermarks make AD-5's fold idempotent under store
   replacement (CH H8 / ER M6, and the applier's finding on the first fix,
   below in AD-5); `schema_meta.mining_in_progress` serves AD-26's chunked
   passes (ER S2 / CH H9).
3. **Why here.** The schema is where four requirements become structural instead
   of policy: provenance (`FR-K6`), trust preservation (`FR-X4`), the audit trail
   (`FR-X6`), and the never-repeat state (`FR-A4`).
4. **What this is NOT.** Not a generic `facts(kind, json)` table — that makes
   provenance a convention, the exact thing `FR-K6` forbids. Not JSONL logs for
   whispers/denies — `status`, `log`, and the regret proxy query them
   relationally. Not symbol-level co-change in Phase A: file-level pairs carry
   every Phase A genre; symbol-level edges are additive later (the table design
   does not preclude them) — claiming them now would be unmeasured machinery.
   Not a role-keyed consumer (`main`/`subagent` as the key): executed in the
   review of 2026-09-25 (G23), a role key let a question asked in one session
   deny an Edit in another, silenced a Coupling whisper in a second session and
   for a second subagent after the first had received it; and, **by code
   reading** in the same review (not executed), a role key let one session's
   catch-up start from another session's byte offset and one session's
   `SessionStart startup` clear every other live session's dedup sets.
   `OL-C5` binds "their next move" — the agent that was asked — so the key is
   the agent in its session. *(Corrected 2026-09-28: all four were called
   executed; the review marks the last two "By code reading" — R-39; B3a E-9.)*
5. **Premise verification.** STRICT/CHECK/FTS5 execute on this Node (V7, V8);
   `FR-K1`–`FR-K9`, `FR-L1`, `FR-L6`, `FR-X4`, `FR-X6`, `FR-A4` read at spec
   §11.1, §11.3, §7.2, §5.1. The `in_tree`, `change_count`, `labelled_touches`,
   consumer-key, and `seq` changes follow the review record
   `docs/reviews/2026-09-25-skeleton-gap-list-review.md` (G2, G3, G5, G23/G29,
   G33/N11), whose defects were executed on the built skeleton except N11 and
   G23's byte-offset and `startup` items, which the review reasoned from code
   (R-39; B3a E-9, E-12); the `seq`
   rationale is the SQLite VACUUM documentation (`sqlite.org/lang_vacuum.html`,
   fetched 2026-09-26); the second-pass changes follow
   `docs/reviews/2026-09-26-architecture-pass-collapse-hunt.md` (H2, H4, H8, H9)
   and `docs/reviews/2026-09-26-architecture-pass-expert-review.md` (M3 executed
   there on git 2.43.0; M6, M8, S2); the 2026-09-28 correction review's
   changes — the state-selected migration set (F-1, read in
   `src/stores/migration_runner.ts`), the pending-store spawn (F-3), the
   migration bound (F-4, `sqlite.org/lang_altertable.html` fetched 2026-09-28),
   the committed fingerprint list (F-17), the fault codes (F-8) and the R-19/R-20
   storage (F-7). Addresses: those, plus `FR-M1`/`FR-M2` (the
   `session_log`/`faults` surface) and AC-13.

### AD-5 — Global-store schema and fact routing

1. **Decision.**

   ```sql
   global_meta(key TEXT PRIMARY KEY, value TEXT)
                                             -- repository bindings (AD-20) and
                                             -- other home-level keys; holds NO
                                             -- fold watermark (AD-5: the
                                             -- watermarks live in each project
                                             -- store's schema_meta)
   whisper_stats(genre, project_key, sent, corrected_false, corrected_missed,
                 published_at, PRIMARY KEY(genre, project_key))
                                             -- efficacy; a REPLICA, never a
                                             -- running sum: WRITER is the
                                             -- fold's publish step, which
                                             -- REPLACES each (genre,
                                             -- project_key) row with SUM over
                                             -- that project store's
                                             -- stats_folds (AD-4). Replacing
                                             -- is idempotent: publishing twice,
                                             -- or after an import or a purge,
                                             -- can never count a row twice.
                                             -- The fold itself (project store,
                                             -- one BEGIN IMMEDIATE): aggregate
                                             -- whisper_audit rows (the `sent`
                                             -- counts) with seq above
                                             -- fold_watermark_audit and
                                             -- corrections with seq above
                                             -- fold_watermark_corrections,
                                             -- append one stats_folds row per
                                             -- genre, advance both watermarks.
                                             -- Both
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
                                             -- reaches the efficacy table.
                                             -- TREND: status reads stats_folds
                                             -- in the project store; the
                                             -- global row is the total.
                                             -- WATERMARK: whisper_audit.seq and
                                             -- corrections.seq (AD-4) — never
                                             -- wall-clock ts. A correction is
                                             -- attributed through
                                             -- corrections.whisper_id →
                                             -- whisper_audit.genre (a `missed`
                                             -- verdict against a whisper id
                                             -- goes to that whisper's genre);
                                             -- a whisper-less `missed` goes to
                                             -- the genre named by its
                                             -- `--genre` argument, to
                                             -- answer_drift when it carries
                                             -- --missed-question, and otherwise
                                             -- to the genre value
                                             -- `unattributed` — never to
                                             -- answer_drift by default (AD-18)
   tuning(key, project_key NULL, value, source, updated_at)
                                             -- scalar tunables (bar floors,
                                             -- thresholds) = one row per key;
                                             -- list-valued lexicon keys
                                             -- (`lexicon.*`) = one member per
                                             -- row, so a lexicon is the set of
                                             -- rows sharing its key and `tune`
                                             -- adds/removes a row;
                                             -- WRITER: seeded at init, changed
                                             -- via `ctxoracle tune` (AD-20);
                                             -- every stored row is validated
                                             -- when the reader is built (AD-14)
                                             -- and by `import` before it writes
                                             -- (below)
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
   **Why `seq`, not `ts`, is the fold watermark (review record 2026-09-25, N11).**
   The fold selected rows with `ts > watermark AND ts <= now` and advanced to
   `now`; a concurrent handler that stamped `ts` before `now` but committed after
   the fold's read was never folded, because `ts` is another process's wall clock
   and commits are not ordered by it. `seq` is assigned at insert while the
   inserting transaction holds SQLite's single write lock, so rows become visible
   in `seq` order, and it is monotonic within one store because `whisper_audit`
   and `corrections` rows are never deleted (AD-4 states both as append-only). It
   is an explicit `INTEGER PRIMARY KEY` so the `VACUUM INTO` export cannot
   renumber it (AD-4).
   **Why the watermarks live in the project store and the global row is a
   replica (review record 2026-09-26, CH H8 / ER M6, ER M7; superseding the
   first fix of the same day).** `seq` restarts per project store. With the
   watermark in the global store, after `deinit --purge` and `init`, an `import`,
   or a corrupt store replaced by a new one, new rows got `seq` values at or
   below the surviving watermark and were never folded. The first fix bound the
   watermark to a random store generation and reset it on a mismatch; the
   applier of that fix found it double-counts: importing an older export resets
   the watermark, and the rows the surviving global totals already counted are
   folded again. Keeping the watermarks and the per-fold ledger (`stats_folds`)
   in the project store, advanced in the same transaction as the ledger rows,
   makes rows, watermarks, and folded counts one consistent unit that export,
   import, and purge carry or remove together; the global row is then a
   replaceable copy of that unit's totals, so no replacement can inflate or
   strand a count. What it costs: `deinit --purge` removes that project's
   efficacy history with the rest of its data, which is what a purge means —
   and it **deletes that project's `whisper_stats` rows** in the global store in
   the same verb, because a replica is by definition a copy of a store's totals
   and a purged store has none; keeping them would count data no store holds
   (R-34 (a); B3b E-8: AD-5 and AD-20 disagreed on what a purge did to the
   replica). The purge refuses while the store holds unexported human rows
   unless `--discard-human` is passed (AD-4's schema check; store-recovery), and
   it deletes the project directory only while holding the reindex lock (AD-26).
   The
   earlier text also named one watermark key per project in one comment and
   two in another; there are now exactly two, both in `schema_meta`.
   `export` (`FR-K9`) writes each store to a single file via **`VACUUM INTO`**
   (engine-level, executed and round-trip-verified — V17). **`import` never
   overwrites a database file, opens its source files read-only, and validates
   everything before it writes either live store**, in three phases:
   (1) *validate both* — for each export file, `backup()` it into a temporary
   `<live path>.import-tmp` database beside the store and, on that temporary
   copy, run `PRAGMA quick_check`, AD-4's schema check (matching migration
   checksums, or a known fingerprint that migrates; an unknown fingerprint or a
   checksum mismatch is refused), the `repo_key` check (the project copy's
   `schema_meta.repo_key` must equal the destination's; a copy whose
   `keying_mode` differs — a path-keyed store restored after a re-clone — is
   refused unless the owner passes an explicit override), and AD-14's tuning
   validator over the incoming `tuning` rows (a row it refuses is named); on any
   failure, delete every temporary file, write the fault `import_rejected`
   (AD-17), leave both live stores untouched, and exit non-zero with a
   plain-language message naming the file and the check;
   (2) *prepare* — merge this machine's live bindings into the validated
   temporary global copy (below), so the `backup()` of phase 3 preserves them;
   (3) *write* — `backup()` the temporary project copy into the live project
   store, then the temporary global copy into the live global store, then run
   the fold's publish step (above) so the global replica matches the imported
   store, then delete the temporary files. A live store holding
   human-provenance rows is never replaced until they have been exported
   (`export-human`, AD-4), whatever the import's flags. `backup(sourceDb,
   destinationPath)` from `node:sqlite` (available from the 22.16.0 floor, V17)
   takes the engine's locks and is WAL-correct; if the live store stays busy past
   AD-26's retry, import refuses with `store_busy` and changes nothing. There is
   no transaction across two database files, so one residual remains: a failure
   between the two live writes leaves the new project store beside the old
   global one. A failure the process survives (a `store_busy` on the second
   write) records `import_rejected` with `check: 'partial_write'`, names the
   store written, and names the recovery — re-run the same `import`, which
   re-validates and rewrites both. A **crash** records nothing; it is detected at
   the next `import` or `status`, which report any `.import-tmp` file surviving
   beside a live store. *Why this order:* checking after the overwrite destroys
   the store the check exists to protect (review record 2026-09-26, ER M12), so
   both files are validated first; project before global because a failure
   between them then leaves a new project store beside an unchanged global —
   no binding points anywhere new and the publish simply has not run — whereas
   global-first would leave merged bindings naming an imported project key
   whose store was never written; and a crash is made visible at the next run,
   because the process that caused it cannot record it (R-34 (b), (c); B3b E-10,
   B5a E-23, B5b H2 E-18, E-19, CR§1, store-recovery).
   **Importing a global store merges repository bindings; it never drops this
   machine's.** Bindings are paths (AD-20), and paths differ between machines.
   A global import keeps every binding this machine had, adds the imported ones
   (on the same path, this machine's binding wins), and lists, in plain
   language, every imported binding whose root does not exist here; `init` in a
   checkout re-records it. Because the merge keeps every live binding, no live
   binding is removed, so the list of removed live bindings R-34 (d) asks the
   report to carry is empty by construction (B5a E-5: that list was the
   alternative to merging; B5a E-23 keeps the merge).
   *(Plan-pass collapse-hunt H7: replacing silently
   dropped this machine's bindings the export lacked, and every session in
   those checkouts went silent.)*
   **A foreign project store is imported into a separate home**
   (`CTXORACLE_HOME`), never into a home that already holds a store for the
   same repository key: two checkouts of one repository share one key (AD-3),
   so importing Max Cogar's exported store into the home where the exit run's
   own store of that repository lives would overwrite it. Restoring one's own
   export into one's own home is the ordinary use (AC-19's round-trip) and is
   unchanged. *(Added 2026-09-26: the import
   procedure was written for "the live store" only; raised by the plan pass,
   plan D-plan-43.)* An imported store in such a home has no live binding on
   this machine (its bindings name the exporter's paths), so `status` and `log`
   take a **key- or home-addressed read form** that names the store by repo key
   within `CTXORACLE_HOME` (for example `status --key <key>`), read-only, and
   refuse with a plain message when the key names no store there. `init` is never
   the way to read it: `init` runs the first index into the store of that key,
   overwriting the imported index tables (R-34 (e); B4 p3 E-4).
   *Why:* copying a file over a live store corrupts it — executed in the review
   of 2026-09-25 (G34): a store held open by a second process with 200
   uncheckpointed WAL frames, overwritten with `copyFileSync`, reopened with a
   table present only in the stale WAL and `PRAGMA integrity_check` failing
   `database disk image is malformed`; the same probe through `backup()`, with
   the holder still open, gave `integrity_check: ok` and only the imported
   rows. A concurrent hook process keeps the WAL alive, so closing the import
   verb's own handles is not enough. No network path exists in the code.
2. **Standard.** `OL-6` store split; `FR-L7` governing the routing; `FR-K9` the
   round-trip; SQLite "How To Corrupt An SQLite Database File" (§1 "File
   overwrite by a rogue thread or process", §1.4 "Mispairing database files and
   hot journals"; fetched 2026-09-26) and the SQLite
   Online Backup API for import; `FR-L4`/`FR-M1` (efficacy counts must not drop
   rows) for the watermark.
3. **Why here.** Tuning and efficacy must survive projects being re-cloned;
   repo facts must travel with the repo's own store.
4. **What this is NOT.** Not a single combined store (couples project export to
   global stats — `FR-L7` violation). Not config files for tuning (two sources of
   truth; the store is already the queryable place, and `status` renders it).
   Not the 2026-07 `genre_state` probation ladder — that is `FR-L3` machinery,
   Phase C, excluded by AD-4's uniform table-creation criterion (no table
   without a same-phase writer), which also moves `env_capabilities`,
   `exemplars`, `recipes`, and the `deferred_queue` to their writing phases.
   Not a file copy for import (the corruption above). Not a wall-clock
   watermark (the skipped-row race above). Not a watermark in the global store
   over a project store's `seq` (the replaced-store skip above), and not a
   generation-reset watermark added into a running global sum (the
   double-count above): the global row is replaced, never incremented.
5. **Premise verification.** `FR-L7`, `FR-K9` read at spec §11.3/§11.1;
   `VACUUM INTO` executed and round-trip-verified (V17); the
   `backup()`-since-v22.16.0 fact per the official v22.x API docs (V17), and
   `typeof require('node:sqlite').backup === 'function'` checked on Node 22.22.2
   2026-09-26; the copy-vs-backup corruption probe executed in the review record
   `docs/reviews/2026-09-25-skeleton-gap-list-review.md` (G34); the watermark
   race reasoned from code there (N11, not executed); VACUUM's rowid rule read at
   `sqlite.org/lang_vacuum.html`, fetched 2026-09-26 (on SQLite 3.51.x a
   `VACUUM INTO` of a TEXT-keyed table with a deleted row kept the implicit
   rowids in one local test — an observation, not the documented guarantee, which
   is why `seq` is explicit); the project-store watermarks with the replaced
   global replica (the double-count in the generation form found by the
   2026-09-26 applier pass, reasoned from the text), the two-row
   watermark, the `unattributed` booking, and the validate-then-write import
   order from `docs/reviews/2026-09-26-architecture-pass-collapse-hunt.md` (H8,
   C4) and `docs/reviews/2026-09-26-architecture-pass-expert-review.md` (M6, M7,
   M12), reasoned from the document's own text, not executed; the 2026-09-28
   corrections — the purge's replica deletion, the three-phase import with its
   checks, write order and crash detection, the key-addressed read form, and the
   human-row guard — from the register (R-34, R-35), B3b E-8, E-10, B4 p3 E-4, B5a
   E-5, E-23, B5b H2 E-18, E-19, CR§1 and store-recovery, each reasoned from the
   text those records quote. Addresses: `FR-L7`, `FR-K9`, `OL-6`.

### AD-6 — Hook wiring and the event map

1. **Decision.** `ctxoracle init` writes hook entries into the repository's
   `.claude/settings.json` (the one sanctioned in-tree write, `D-9`); `deinit`
   removes exactly what `init` wrote, by marker. Events wired, and what runs on
   each:

   | Hook event | Phase A work | Output channel |
   |---|---|---|
   | `UserPromptSubmit` | **question intake from the `prompt` input field** (AD-9 — the question exists before the agent's first move); Orientation candidate (`FR-A2a`); when the schema check finds the store pending, the detached index child only (AD-4, F-3) | `hookSpecificOutput.additionalContext` (V15; plain stdout is the documented alternative) |
   | `PreToolUse` (matcher `*`) | catch-up; block check (`FR-B1`); Consequence/Warning candidates (`FR-A2d`/`FR-A2e`) | `permissionDecision` deny (blocks only) / `additionalContext` (whispers — read by the model next to the tool result on the next model request, whether the call ran, failed or was denied; an `Edit` path deny rule (tested; a `Read` rule not tested — F-18) rejects the call before hooks run, so this event does not fire for it — R-8; V20, CR§2, DE, PD; pending spec sign-off R-1…R-5) |
   | `PostToolUse` (matcher `*`) | read-set update; `observed_actions` append (`outcome='ok'` — the event is success-only, V19); Coupling/Reuse candidates (`FR-A2b`/`FR-A2c`) | `additionalContext` |
   | `PostToolUseFailure` (matcher `*`) | **observation only**: `observed_actions` append with `outcome='failed'` set **unconditionally by the event itself** (the `error` exit-code parse is best-effort enrichment of `command_class`/detail, never a precondition — V19's "generally begins" is a hedge, and a non-Bash failure must still append) — without this wiring a run-and-failed test looks *never run*, and Verification would emit the checkably-false "not run" (`FR-D1`) while the `FR-L4` failure clause starves; the run-state consumers therefore read these rows (AD-4's split filter) | **none** — no `permissionDecision` (spec `FR-O2`/`FR-B3` require none be emitted here) and no context channel used |
   | `Stop` | done-claim check; Completeness + Verification whisper; outstanding-question line (`FR-B4`, AC-8a) | `hookSpecificOutput.additionalContext`, once, honoring `stop_hook_active` |
   | `SubagentStop` | same as Stop for the subagent consumer (whispers only — no answer-drift state exists for it, `FR-O6`) | same |
   | `SessionStart` | `D-20` reconciliation by `source` (AD-16); qa-state rebuild trigger per `source` (AD-9); staleness check → detached reindex spawn, also spawned when the schema check finds the store pending (AD-4, F-3) or a mining pass or data step unfinished (AD-13); detached `quick_check` integrity child (AD-17) | none (stdout unused in Phase A) |
   | `SessionEnd` | flush/finalize session diagnostics row; the `whisper_stats` watermarked fold (AD-5 — audit rows + corrections, the project store's two `seq` watermarks and the replace-publish of its totals; bounded: rows since each watermark by primary key, off every deny-capable path) | none; work bounded ≪ 1.5 s budget (V6), fold included |

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
   failure outcomes exist nowhere else (V19),
   and it emits nothing on any channel. Not stdout injection on tool events (the contract routes
   tool-event context via `hookSpecificOutput`, V2).
5. **Premise verification.** V1–V6, V15/V16/V19 and V20 (channels, fields, timeouts,
   the success/failure event split, when a `PreToolUse` whisper is read); `D-9` read at
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
   owner channel is diagnostics + `status`). Not stderr warning suppression:
   stderr from a hook that exits 0 never reaches the model (V21), so the
   `node:sqlite` `ExperimentalWarning` is not a hazard to engineer around.
5. **Premise verification.** V2 (exit-2 routing), V6 (timeout semantics), V21 (exit-0 stderr);
   `FR-O3` read at spec §8. Addresses: `FR-O3`, NF-1, `FR-M2`.

### AD-8 — The per-event pipeline order (and why order is load-bearing)

1. **Decision.** Fixed order inside the handler: guard → parse → **question
   intake** (`UserPromptSubmit` only, AD-9) → **catch-up** → **block check** →
   candidates → bar → dedup → compose → **audit-log-then-emit** → diagnostics. Two orderings are requirements, not style: (a) catch-up runs
   *before* the block check, so the deny decision is made on the freshest state
   the transcript can provide (the residual lag is then only the file-write lag
   the contract documents, V1 — the irreducible lag window of `FR-B1`); (b) the
   audit write precedes emission for both whispers and denies — an unlogged
   whisper/deny is not emitted (`FR-X6` made true by construction; fail-open must
   not apply to the audit control, per `FR-X6`'s wording "every whisper and every
   block recorded").
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

### AD-9 — The answer-drift block: state, recognizers, and the Phase B seam

1. **Decision.**

   **State (project store, AD-4):** `questions` rows per consumer with status
   `open`/`answered`/`expired`; `classify_state` holds the per-consumer bookmark
   (byte offset + last entry uuid) up to which the transcript has been
   classified. The consumer is AD-4's `(session_id, agent_id | 'main')` key, so
   a question, and the bookmark into the transcript that grounds it, belong to
   one session: a question asked in session A never denies a move in session B,
   and session B's catch-up never starts from session A's byte offset. *Why:*
   `OL-C5` binds "their next move" — the agent that was asked; the role-keyed
   form denied another session's Edit when executed (review record 2026-09-25,
   G23/G29). A row carries the question text and a `content_hash`. **Nothing
   classifies a question into a type** — Phase A tracks *that* a question is open,
   never *what kind* of answer it wants.

   **Question intake (`UserPromptSubmit`, from the `prompt` input field — V5).**
   Intake runs on the hook's own `prompt` string, so the row exists **before the
   agent's first move** — the moment `OL-C5` names — independent of the
   transcript-write lag (V1). The **question recognizer** opens a row for a
   sentence that (i) ends with `?`, (ii) is outside code fences and quoted
   blocks, and (iii) is not matched by a small rhetorical/idiom stoplist
   (`lexicon.stoplist`, tunable). It opens on the interrogative and nothing more;
   it does not judge whether the ask wants text or an action. Multiple questions
   in one turn open multiple rows (`FR-B1`: a tracked set), each with its
   `content_hash`; a hash matching only a **closed** row opens a fresh row — the
   open-scoped dedup index (AD-4) keeps the verbatim re-ask, the spec's recourse,
   always working. What intake misses — indirect questions, "tell me whether…",
   any ask without a `?` — is Phase A's documented low coverage (L1), **measured
   at exit** (§11.5), never classified around.

   **Transcript catch-up (per event, resumable — AD-11).** The handler reads the
   transcript from the bookmark to EOF and, per completed entry:
   - *Human turn* — discriminated by the **markers**, never by content shape
     (V12): `origin.kind === "human"` and not `isMeta`. Hook feedback
     (`isMeta:true`), task notifications (`origin.kind:"task-notification"`), and
     tool-result pseudo-user entries never open questions; a marker-absent
     string-content user entry is skipped with an `unrecognized_user_entry`
     diagnostic. Human turns are reconciled against intake rows by `content_hash`
     (backfilling `asked_uuid`/`asked_offset`); the open-scoped dedup index makes
     reconciliation idempotent under parallel handlers (AD-26). A matching turn
     carrying an **affirmatively non-human** marker voids the row
     (`closed_by_kind='intake_invalidated'`, fault recorded); a **marker-absent**
     matching turn does not void it (V12 proves genuine turns can lack markers, so
     voiding on absence would erase real questions). A human question that reached
     the transcript with no matching intake row (e.g. state rebuilt after
     `resume`) is opened here, same recognizer.
   - *Assistant text turn* (an `assistant` entry containing a `text` block): the
     **clear recognizer** marks **all** currently-open questions `answered`
     (`closed_by_kind='generic_text_all_prior'`) when the text carries substance
     (length above a small floor after stripping tool noise) and is not a
     recognized content-free deferral ("I'll get to that"-class). Clearing
     all-prior errs **toward clearing** — the safe steady-state direction
     (`FR-B5`). Whether a given turn *substantively addresses* a *specific*
     question is a comprehension judgment routed to Phase B (`AC-2a-ii`, `D-41`);
     Phase A does not attempt it.
   - Bookmark advances only over completed lines (a partial trailing line is left
     for the next event).

   **The deny decision (`PreToolUse`, main consumer only — `FR-O6`, `AC-2a-i`).**
   "Main" is the role derived from the consumer key (AD-4); the deny reads only
   the questions of the event's own consumer, `(session_id, 'main')`.
   After catch-up, if the consumer has **at least one `open` question**, the
   pending move is judged by the **move recognizer**, which denies only a move
   *clearly not directed at answering* (`D-41`): the deny-eligible set is exactly
   the repo-mutating file tools (`Write`, `Edit`, `NotebookEdit`). Every other
   move — `Read`, `Grep`, `Glob`, `Bash` (it may be running a test or build to get
   the answer — `D-39`'s protected class), `Task` spawns (spawn intent is not
   judgeable model-free; `AC-2a-i`'s deny half is Phase B), MCP tools, web tools —
   is **allowed**. Being model-free, the move recognizer cannot tell a mutation
   that *is* the answer to a request ("can you rename `foo`?") from one that ignores the
   question: it denies **every** repo mutation while any question is open. That
   over-enforcement is the accepted, **measured** cost of a model-free recognizer
   (the wrongful-deny residual, L1), escapable by one answering — or plan-stating
   — turn (`OL-C3`); Phase B distinguishes the answer-directed edit from the drift
   edit.

   **Deny emission.** Audit-log first (AD-8), then `permissionDecision:"deny"`,
   `permissionDecisionReason` = *"answer Max's question first: `<the open
   question text(s)>`."* A subsequent non-answer-directed move is denied the same
   way — no counter, no held turn (`FR-B2`). A text answer is never a tool action,
   so the way out always exists; the block never lands at a `Stop`.

   **The lag-window hold (`FR-B1`'s lag clause, `D-41`).** The clear-state is
   whatever the classified transcript shows. When the newest assistant text has
   not reached the file yet (V1's documented lag), the state still says `open` and
   a deny-eligible move is denied — the block **holds rather than pre-clears**, on
   the **clear-axis only**: nothing in the lag window widens the deny-eligible
   set, and answer-directed moves (a read, search, or test/build run) run freely
   exactly as in steady state. A wrongful lag-hold self-recovers as soon as
   catch-up reaches the answer. **Detection (`FR-M2`):** (a) `deny_after_answer_lag`
   — a catch-up classifies an answer whose transcript timestamp precedes an
   already-emitted deny; (b) `deny_despite_answer_text` — ≥ N denies (tunable)
   accumulate for a consumer with ≥ 1 intervening assistant text turn since the
   newest question opened, **excluding deferral-stoplist turns**, catching a
   question the clear recognizer wrongly held open (the length-floor miss; the
   deferral-false-match miss is caught only by the human channel,
   `ctxoracle correct`).

   **Stop-time backstop (`AC-8a`).** At a `Stop` where the done-claim recognizer
   (AD-15) fires and `open` questions exist, the Stop-time whisper carries an
   outstanding-question line naming them — **delivery, not a block** (the stop
   proceeds). Because "Max re-asks" is the recourse for every uncaught case and he
   cannot re-ask what he does not know was dropped, the `FR-M4` counter also
   records done-claims reached with a question still `open`, or closed only by
   `generic_text_all_prior` within the final K assistant turns (K tunable) — a
   labelled Phase A approximation, both error directions stated in `status`, its
   counted questions written to `session_log.detail_json` and rendered by
   `ctxoracle log`. It chains two conservative recognizers (done-claim + clear),
   so for the common Phase A case it may not fire; it is best-effort, not a
   guarantee.

   **Deny-loop signal (`FR-M4`).** ≥ 3 consecutive denies for one consumer with
   no intervening assistant text → `deny_loop` fault. A companion diagnostic,
   `deny_bypass_suspect`, records post-hoc when a deny is followed in the same
   turn by a successful (`'ok'`) file-writing `Bash` row whose written path
   matches the denied action's target — the target `file_path`/`notebook_path`
   recorded in the `kind='deny'` `whisper_audit` row's `evidence_json` (a denied
   file tool runs no `PostToolUse`, V19). A proxy, not a measurement — it
   over-counts an unrelated same-file shell rewrite and under-counts a bypass to a
   different path; both directions stated in `status`. Owner-facing, feeding Phase
   B's precision case (L3).

   **Question lifetime across session boundaries.** qa-state is scoped to the
   conversation the transcript embodies. `SessionStart` reconciliation acts only
   on the rows of the event's own consumer — never on another session's rows, which
   may belong to a live concurrent session on the same repository. On
   `SessionStart` by `source` (V5):
   `startup`/`clear` → fresh state (this consumer's prior `open` rows, if any,
   are marked `expired`; a new `session_id` simply has none); `resume`/`fork`/`compact` → the
   conversation continues, so state is rebuilt by classifying the transcript from
   offset 0 under a fresh bookmark. A `fork` arrives under a **new** `session_id`
   and its input names no parent session (V22), so its rebuild reads the forked
   transcript itself under the new consumer key; a `resume` whose `session_id`
   has no rows is rebuilt the same way — recovery reaching exactly as far as the
   marker premise does (V12): in a marker-less transcript mode rebuild recovers
   nothing (under-fire, safe), and when it scans a non-empty transcript,
   recognizes zero human turns, and emitted `unrecognized_user_entry` diagnostics,
   it raises `rebuild_recovered_nothing` (surfaced per `OL-10`; L11 owns the
   limit; the same code, with `detail_json.set = "questions"`, also covers
   AD-16's delivered-set and read-set reseeds as `"delivered"` and `"read"`).
   The fork rebuild reads every entry of the forked transcript whatever its
   `sessionId` field — it never filters by `sessionId`, since which id the copied
   pre-fork entries carry is not observed (V22; G-11, settlements). Catch-up is resumable — the bookmark persists per event, so a
   transcript too large for one watchdog pass converges over later events with a
   `catchup_incomplete` diagnostic (questions not yet discovered cannot deny;
   questions already open keep holding). Nothing expires at `SessionEnd`. On
   `compact`, a question the compaction summarized away vanishes silently —
   under-fire, safe, recorded in L1.

   **The Phase B seam.** The deny path reads **only** `questions`/`classify_state`
   through `qa/state.ts`. Phase B replaces the *writer* — the deterministic
   recognizers behind `classify.ts` (each takes a transcript entry and returns a
   typed verdict) — with the model-maintained updater running **off** the
   synchronous path (§11.5: the model updates the cached state between actions; the
   `PreToolUse` deny stays synchronous, reading that cached state — the model never
   sits on the deny path). The swap is a module replacement, not a redesign: the
   tables, the deny mechanism (AD-10), the hook wiring, the audit, and the
   `qa/state.ts` read interface are unchanged. The `expired` status, the
   `closed_by_kind` record, and the fault codes are part of the seam, inherited
   unchanged.

2. **Standard.** `OL-C5` (the owner definition — the rule enforced), `OL-C3` (the
   block's existence), `FR-B1`/`FR-B2`/`FR-B5` (mechanism properties), `D-39` (the
   protected answer-directed class — reads/searches/test runs are never denied),
   `D-41` (the block is phased because judging answer-directedness is a
   comprehension judgment: Phase A ships the plumbing plus a conservative
   recognizer, precision is Phase B).

3. **Why here.** This is the one Phase A mechanism that can halt an agent, so its
   every bound is stated and every error direction has a named detector: over-fire
   → the wrongful-deny rate via `corrections` (`FR-L6`/`AC-2c`) and
   `deny_after_answer_lag`/`deny_despite_answer_text`; under-fire → the human
   channel (Max sees his own unanswered question, `FR-B5`) plus the `AC-8a` line.
   Phase A ships the honest floor — a recognizer that fires only on the
   clearly-non-answer-directed move class — and **measures** how little it catches
   on real repos; that measurement is what Phase B and the `AD-24` regression
   fixtures are designed from (§11.5). The recognizer is deliberately **not**
   reasoned toward completeness here: a model-free recognizer cannot reach it, and
   asserting it is the failure that returned this block to the architecture layer
   (`docs/collapse-log.md` 2026-09-04).

4. **What this is NOT.** Not a question classifier — Phase A does not decide
   model-free whether a question wants a text answer or a repo action (a
   comprehension judgment: Phase B, `AC-2a-ii`); it tracks that a question is open
   and denies the mutating-edit move class while it is. Not a Stop-based hold
   (`FR-B1`: the deny lands on the deviating action; a text turn is never denied).
   Not a `Bash`-command classifier that denies "obviously unrelated" commands —
   distinguishing a test run from other work is intent judgment, and a wrong
   `Bash` deny would strand legitimate answer-gathering (`D-39` is load-bearing);
   the coverage loss is owned in L3. Not a per-question clear matcher
   (comprehension — Phase B, `AC-2a-ii`). Not question persistence across sessions
   beyond transcript-grounded rebuild (a deny must be self-clearing within the
   conversation that grounds it, `FR-B2`).

5. **Premise verification.** V1 (transcript lag is real and documented — the hold
   clause rests on it), V5 (`UserPromptSubmit.prompt`, `SessionStart.source`
   values), V12 (human-turn marker discrimination, observed on a real transcript
   containing injected turns), V2 (the `PreToolUse` deny channel) — all
   fetched/observed 2026-08-29; V22 (no parent session in `SessionStart` input,
   fetched 2026-09-26) for the fork rebuild source. `OL-C5`, `OL-C3` read in `OWNER-LEDGER.md`
   (CONFIRMED); `FR-B1`/`FR-B2`/`FR-B5`, `D-39`, `D-41` read at spec §8/§12;
   `AC-2a`/`AC-2a-i`/`AC-2a-ii`/`AC-8a`/`AC-12` at spec §14. Addresses: `FR-A2l`,
   `FR-B1`, `FR-B2`, `FR-B5`, `FR-O6`, `D-39`, `D-41`, `AC-2a`, `AC-2a-i`,
   `AC-2c` (answer-drift over-fire), `AC-8a`, `AC-12` (deterministic parts).

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
   staleness, holding AD-26's reindex lock and with `CTXORACLE_INTERNAL=1`
   in its environment) builds: `files` (with zone classification — below),
   `symbols`, **`import_edges`**
   (file→file, what import extraction actually yields), **`symbol_refs`**
   (per exported symbol: the count of *other* files whose text references its
   identifier among the files that import its file — a deterministic
   identifier-match heuristic, recorded as such and confidence-capped; this is
   the producer of the Reuse genre's reference counts, AD-15), **`entry_score`
   per file** (import in-degree from `import_edges` + path-convention markers:
   `main`/`index`/`cli`/`app` — the producer of
   Orientation's entry-point ranking factor, AD-15), `test_map`, FTS5 tables.

   **The file walk.** In a git work tree the indexer lists files with
   `git ls-files -z --cached --others --exclude-standard` — git's own
   implementation of gitignore(5) (negation, nested ignore files,
   `core.excludesFile`, `info/exclude`), which a re-implementation would get
   subtly wrong. In a non-git directory (AD-3 rule 3, path-keyed mode, which must
   index) it walks with `readdir`, with a fixed exclusion of `.git/` and
   `node_modules/` disclosed in `status`. *Why:* the skeleton's git-only walk
   threw `fatal: not a git repository` on a plain directory (review record
   2026-09-25, G11/N7). **Non-regular entries are skipped, and the skip is
   disclosed** in `status`: a submodule gitlink (mode 160000, whose path is a
   directory) and any other listed entry that is not a regular file is not
   indexed. The `readdir` branch **does not follow symbolic links**, so a link
   cycle cannot make the walk unbounded (R-18; B3a E-13: the walk listed a
   gitlink and stated no rule, and the `readdir` branch had no link rule).

   **Zone classification, in precedence order.** (1) A **marker comment** in the
   head 2 KB: a comment line, with each mapped language's own comment leader (a
   per-language table beside `index.ext_to_grammar`, not a fixed leader list),
   matching Go's published convention `^// Code generated .* DO NOT EDIT\.$`
   (`pkg.go.dev/cmd/go`) under its position rule — "This line must appear before
   the first non-comment, non-blank text in the file" → `generated`. No
   `@generated` tag is matched: no primary source for that convention was found
   (GitHub Linguist's `generated.rb` has no such rule, B8b E-8), and an unsourced
   marker does not go in. (2) `vendor/`, `vendors/` and `node_modules/` as a
   directory segment **at any depth** → `vendored`, and (3) `dist/` at any depth,
   or `build/` **at the repository root**, or a lockfile → `build_output`. The
   any-depth rule is GitHub Linguist's `vendor.yml` (`(^|/)dist/`,
   `(^|/)node_modules/`, `(^|/)vendors?/`, fetched in B8a E-21) and gitignore's
   reading of a slash-terminated name; no source backs an any-depth `build/`
   (Linguist has no general `build/` rule), and executed at `HEAD`
   `src/build/plan.ts` was classed `build_output` and so dropped from
   Orientation and Reuse — so `build/` is anchored at the root, an unsourced
   heuristic whose miss class (a nested package's `packages/a/build/` reads as
   `source`) is stated here. **The lockfiles are those of the named managers
   below, and no more is claimed:** (i) every lockfile name GitHub Linguist's
   `generated.rb` detects (fetched 2026-09-28, `main` at `d0921d1`) —
   `composer.lock`, `Cargo.lock`, `deno.lock`, `flake.lock`, `MODULE.bazel.lock`,
   `Gopkg.lock`, `glide.lock`, `Package.resolved`, `poetry.lock`, `pdm.lock`,
   `uv.lock`, `pixi.lock`, `esy.lock`, `npm-shrinkwrap.json`, `package-lock.json`,
   `pnpm-lock.yaml`, `bun.lock`, `bun.lockb`, `.terraform.lock.hcl`,
   `Pipfile.lock` and `mise.lock` (with its `mise.<env>.lock` form); and (ii)
   the lockfiles of managers Linguist does not list, each named by B8a E-24:
   `yarn.lock` (Yarn), `Gemfile.lock` (Bundler), `go.sum` (Go modules),
   `mix.lock` (Mix) and `pubspec.lock` (pub). The miss class, stated: a lockfile
   of a manager in neither list is classed `source`, so its path can be ranked
   by Orientation and its tokens searched, until its name is added to the list
   (F-9; the rationale "every package manager whose ecosystem the default
   grammar table covers" omitted `Pipfile.lock`, `uv.lock` and `bun.lock`, of
   covered ecosystems, and no source enumerates every manager). (4) Otherwise `source`. The zone evidence is the matched
   marker line, path rule, or ignore pattern; it is bounded by the 2 KB head read
   and the path, so it takes no separate length cut (the former 200-character cut
   had no source). *Why (R-17; B3b E-12, B8 verification item 7, B8a E-9, E-21,
   E-24, B8b E-8):* the order put the ignore match first and made it a source of
   `generated` on no source, and `build/` matched at any depth on none.

   **The `.gitignore` signal: a tracked file that matches an ignore
   pattern.** At index time (off the event path) the indexer pipes the walked
   tracked paths through `git check-ignore --no-index -v --stdin -z`, and
   records a printed path's evidence as what it is — "tracked file matching
   ignore pattern `<pattern>` (`.gitignore:<line>`)". **It never sets
   `generated` on its own:** beside a marker or path signal it is added to that
   signal's evidence as corroboration, and alone it sets the zone to `unknown`
   with the evidence shown. Ignored untracked files are never walked, and git
   applies ignore rules only to untracked files ("Files already tracked by Git
   are not affected", gitignore(5)), so a tracked file that matches is only that:
   reproduced in B3b E-12, a force-added `.vscode/settings.json` and a
   `logs/.gitkeep` under ignored directories are both reported and neither is
   generated, while `generated` feeds decision-impact and the Consequence
   headline's zone flag, where a false one is FR-D1's checkably false claim.
   *(Corrected 2026-09-28: this said a printed path "is a `generated` zone
   signal" because "a committed file the project also ignores is commonly a
   generated one", which no source supports — R-17; B3b E-12.)*
   *Why the signal exists (review record 2026-09-26, ER M4):* the first 2026-09-26 pass dropped
   this signal as one that "could never fire as defined", while its own check
   showed `--cached` listing a force-added `dist/a.js` under an ignored `dist/`.
   The reviewer executed `git check-ignore --no-index -z --stdin` over
   `dist/a.js`, `src/api.gen.ts`, and `src/k.ts` with `.gitignore` =
   `dist/` and `*.gen.ts`: it printed `dist/a.js` and `src/api.gen.ts`. The
   second is a tracked generated file that the `dist/`/`build/` path patterns
   miss. Outside git (the `readdir` walk) there is no ignore file to consult and
   the signal is absent, disclosed in `status` with the fixed exclusions.

   **`test_map` conventions (review record 2026-09-25, N13).** A file is a test
   file when its path matches a member of the `lexicon.test_path_patterns`
   tuning list (AD-5; seeded with `**/*.test.*`, `**/*.spec.*`, `**/test_*.py`,
   `**/*_test.go`, `**/__tests__/**`, `test/**`, `tests/**` — common test-runner
   file-naming conventions, the review's seed; a seed, not a claim of
   completeness), tunable via `ctxoracle tune`. **Pattern dialect:** an
   in-house matcher over the repo-relative POSIX path, anchored at the
   repository root — `*` matches any characters within one path segment, `**`
   matches any number of whole segments (including none), `?` matches one
   character within a segment; there are no braces, character classes, or
   negation. *Why (review record 2026-09-26, ER m3):* the dialect was unstated
   (is `test/**` root-anchored?), and Node's `path.matchesGlob` is experimental
   in Node 22, so the matcher takes no dependency on it and the seed is
   testable against a stated rule. A
   test file's `import_edges` targets are the files it covers. For a language
   in the `lexicon.test_same_dir_languages` tuning list (AD-5; seeded `go`), a
   test file instead maps to every non-test file of the same language in the
   same directory. *Why (review record 2026-09-26, ER M5):* Go test files are
   compiled with the package in their own directory (`go help test`,
   pkg.go.dev/cmd/go, fetched by the reviewer 2026-09-26), and an in-package
   test imports nothing, so import-edge mapping could never map a Go test and
   Consequence and Verification would be silent for Go by construction. **Each
   language declares a `test_map` capability, shown in `status`**: whether its
   test files can produce mappings at all — Go by the same-directory rule, a
   language whose tests import their subjects by resolvable edges by import
   mapping, and `none` for any seeded language whose tests produce no edges (for
   example Python tests that import absolutely, where the resolver yields no
   edge for a bare module name that is not in the repository), so the exit data
   do not read structural silence as a low floor (R-18; B3a E-13, B3b E-16). `region_glob` is
   the covered file's path: Phase A regions are whole files, and `status` says
   so. Route-registration patterns are **not** an `entry_score` input in Phase
   A. No such pattern was ever listed, and a heuristic nobody wrote down cannot
   be built. A per-language pattern would have to be written as a named list
   before it is added.

   Parsing goes
   through a `LanguageFrontend` interface (`FR-K1`'s language-agnostic seam,
   C-6): the tree-sitter frontend covers every language whose grammar the
   pinned runtime can load and that is **usable**, mapped by a **configurable**
   extension→grammar table with defaults, and the loader takes each grammar's
   WASM **path from that table** (a `tree-sitter-wasms` file, or a vendored file
   under AD-25's rule). **A grammar is usable when its scanner initialises its
   state in `create` and resets it in `deserialize` at length 0 (read from the
   packaged `src/scanner.c`), and its samples parse error-free.** The cause of
   the two grammars the rule catches, read from the packaged sources: the
   `tree-sitter-lua` 2.1.3 scanner's `create` returns
   `malloc(sizeof(struct ScannerState))` and never initialises it (a `malloc`
   block's value "is indeterminate", C11 §7.22.3), and the `tree-sitter-swift`
   0.4.3 scanner's `create` returns `calloc(0, sizeof(struct ScannerState))` and
   then writes a 4-byte state into it (a zero-size allocation "shall not be used
   to access an object", the same clause); the 0.25.10 runtime creates the
   scanner at every parse, so every parse reads a state no one set. Executed in
   isolation (B9 E-1): Lua 19 of 24 parses err as shipped, 0 of 24 with the
   block zeroed, 20 of 24 with it filled with `0xff`; Swift 15, 0 and 16 of 24;
   and at `HEAD` the Swift frontend returned `ok: true` with a raw-string file's
   symbols lost (`[]` instead of `["f","P","g"]`). So Lua is taken from
   `@tree-sitter-grammars/tree-sitter-lua` 0.4.1's shipped WASM (ABI 15, loads
   under 0.25.10, clean on 24 of 24 repeated parses), and Swift 0.4.3 is rebuilt
   with `calloc(1, sizeof(struct ScannerState))` and a reset when `length < 4`,
   both vendored (AD-25). The other exclusions are the 2026-09-11 execution's
   (plan §4): `elm` and `ql` are below the runtime's minimum ABI, and `yaml`'s and
   `bash`'s scanners import symbols the runtime does not export. **A grammar
   still excluded keeps its table row and takes the generic frontend, and its
   exclusion and cause are recorded per language in `lang_capabilities`
   (`exclusion_cause`, AD-4) and shown in `status`** — never recorded as
   `unknown`. At run time a parse whose tree carries an ERROR node is flagged
   for that file (a `file_parse` row, `outcome = 'error_tree'`, AD-4) and
   counted per language in `status`, so a grammar that degrades on real source is visible rather than
   returning `ok` with symbols missing. *(Corrected 2026-09-28: this recorded
   the symptom — "`lua` loads but, after its first parse in a process, returns
   ERROR trees" — excluded Lua as a patch with no visible trace, kept Swift with
   the same defect class, and defined usability as parsing "correctly on
   repeated parses", which a sample without a raw string passed — R-14; B9
   verification item 1, B9 E-1, E-2, E-3, E-18, E-21.)* A **generic frontend**
   (line-based definition heuristics + path/word tokens into FTS) covers every
   other *source* file, so no language is invisible. It extracts symbols only
   from text files that are code: a file with a NUL byte in its first **8000
   bytes** is binary and gets path tokens only (git's own binary test reads that
   many: `#define FIRST_FEW_BYTES 8000`, `xdiff-interface.c`; the former "8 KB"
   had no source), and prose and data formats get path tokens only. The
   prose/data list is the tuning row `index.generic_no_symbol_exts` (matched as a
   case-insensitive file-name suffix, so `.json.example` is a member), **seeded
   by one rule from GitHub Linguist at a pinned commit** (`main` at `d0921d1`,
   `languages.yml` and `heuristics.yml`, fetched 2026-09-28): (i) every extension
   Linguist gives to a language of `type: prose` or `type: data` that no language
   of `type: programming` or `type: markup` also claims — 385 of the 441
   extensions those 202 languages carry (counted 2026-09-28); and (ii) of the 56
   extensions such a language shares with a programming or markup language, the
   ones whose `heuristics.yml` disambiguation ends in a pattern-less rule — the
   language Linguist itself assigns when no content pattern matches — naming a
   prose or data language: `.bst`, `.fr`, `.md` (Markdown; GCC Machine
   Description needs `^(;;|\(define_)`), `.pkl`, `.sql`, `.tl` and `.typ`. Every
   other shared extension (`.ts`, `.rs`, `.pm`, `.inc` and the rest) is left off,
   so a code language keeps its generic symbols (C-6). 392 extensions in all; the
   seed is a committed source file generated once by a script from the two
   pinned files and pinned by a test that re-derives the count (F-10; the former
   seed was 16 of the 441 from 12 hand-picked languages, with no selection rule).
   The cost this rule accepts, stated: a data language whose files do declare
   named things — SQL, GraphQL and Protocol Buffer are all `type: data` in
   Linguist — gets path tokens only from the generic frontend (a grammar-covered
   one is unaffected, since the row applies to the generic frontend alone) until
   its extension is removed from the row. **A deny-list,
   not an allow-list of code extensions**, because C-6 requires that no
   language be invisible: an unlisted code language (`.ps1`, say) still gets
   generic symbols, where an allow-list would silently drop every code language
   nobody listed. The cost runs the other way and is stated here: an unlisted
   prose or markup format still yields false symbols until it is added to the
   row. *Why (Step 15 build review M3, 2026-09-26, executed on this
   repository):* 317 of the generic frontend's 424 symbols came from `.md` files
   and 4 from a binary `.bin` file — false symbols that Reuse and Orientation
   would present as code (P4). *(Corrected 2026-09-28: the list was "and
   similar", with no contents and no comparison with an allow-list, and the byte
   count had no source — R-20; B9 E-38.)* **A file of an `imports: true` language
   that falls to the generic frontend** (its parse threw) is counted in that
   language's unresolved-import share as `parse_failed`, beside `resolved` and
   `unresolved`, and its content hash is marked (a `file_parse` row,
   `outcome = 'parse_failed'`, AD-4) so the next pass in which its
   grammar is enabled re-parses it, even if the file has not changed (R-20; B9
   E-6, E-16: a fallback file was missing from its language's share and never
   retried; the storage is F-7's). Adding a language is adding a grammar file or a config row, never a
   redesign (C-6). **Every frontend declares its capabilities**
   per language — `{ symbols: boolean, imports: boolean }` — recorded per
   language (`lang_capabilities`, AD-4) and shown in `status`, so coverage is measured, not claimed. A
   grammar with no written imports query declares `imports: false`, and so does
   the generic frontend. Queries are written per grammar as build work. A grammar
   with no written query at all takes the generic frontend. **Unresolved
   imports are counted.** A frontend's resolver classifies every captured import
   specifier as *resolved* (it yields an `import_edges` row), *external*, or
   *unresolved* (anything else, e.g. a `tsconfig` path alias such as `@/util`).
   **External** means a platform builtin, or a package the repository declares as
   a dependency and does not itself contain:
   - A specifier whose package resolves **inside the repository** — an
     npm/pnpm/yarn workspace member, or a `workspace:`, `file:` or `link:`
     dependency — is **never external**: it resolves to its in-repo target or is
     counted unresolved. npm "symlinked to the node_modules folder" a workspace
     package, and pnpm links one "if bar has \"foo\": \"^1.0.0\" in its
     dependencies", so a nearest-`package.json` rule read it as external: no
     edge, not counted unresolved (B3b E-15).
   - **Python:** an absolute name is external only when its top-level name is in
     a vendored, version-stated `sys.stdlib_module_names` list (it holds 303, 305,
     300 and 290 names in 3.10–3.13, B9 verification item 3) or is a
     distribution the repository declares (`pyproject.toml`, `requirements*.txt`,
     `setup.cfg`); otherwise it is unresolved. The directories searched for an
     in-repository module are a disclosed heuristic (the importer's ancestors),
     never called Python's `sys.path[0]` rule, which they are not (B9 E-29).
   - **TypeScript/JavaScript:** for a written `.js`/`.jsx`/`.mjs`/`.cjs`, the
     implementation (`.ts`/`.tsx`/`.mts`/`.cts`) and declaration
     (`.d.ts`/`.d.mts`/`.d.cts`) files are tried first, in the TypeScript
     handbook's order, then the written path (`tsc` 5.9.3 `--traceResolution`,
     B9 E-7, E-23). For a relative specifier with any other written extension,
     the **written path is tried first** when the repository holds it (Node's
     `LOAD_AS_FILE` step 1, "If X is a file, load X as its file extension
     format"), then the appended extensions, then `/index.*`; so a present
     `./styles.css`, `./logo.svg` or `./data.json` resolves (Flaw 2; G-9,
     settlements). For an extensionless relative specifier, and for `/index`,
     the appended extensions are `.ts`, `.tsx`, `.js`, `.jsx`, with **`.json`
     last** (Node CommonJS `LOAD_AS_FILE` step 3, "If X.json is a file, load
     X.json to a JavaScript Object"; Vite's default `resolve.extensions` ends in
     `.json`), so `./data` with only `data.json` present resolves to it and with
     `data.ts` beside it resolves to `data.ts`. `tsconfig.json` is not read. This
     models a CommonJS/bundler resolver, the run-time dependency graph Reuse
     counts, and is not `tsc`'s NodeNext mode (which rejects an extensionless
     relative import, TS2835) (G-9 as corrected, settlements).
   Each resolver's remaining external rule is written with the resolver as build
   work. The count of unresolved specifiers is stored per file
   (`files.unresolved_imports`, AD-4), and `status` shows the unresolved share
   per language (unresolved ÷ (resolved + unresolved), with `parse_failed` files
   shown beside it). AD-15's Reuse treats a
   language whose share exceeds `reuse.max_unresolved_import_share` (AD-5; seed
   0.05, illustrative) like an `imports: false` language. *Why (review record
   2026-09-26, CH H4):* path aliases resolve to no edge while the language still
   declares `imports: true`, so a helper imported mostly through aliases read as
   observed-zero and could lose the crown to a relative-import rival — the L6
   failure one level below the capability boolean. *(Corrected 2026-09-28: a
   workspace package read as external, an undeclared Python name as external
   unless the repository held the name, TypeScript tried the written `.js` before
   source with no declaration files, and a present non-code file was never
   resolved — R-16; B4 verification item 5, B4 p2 E-3, B4 p3 E-22, B3b E-15, B9
   verification items 3–4, B9 E-29; G-9 and Flaw 2, settlements.)* *Why:* a grammar can have an ext→grammar table entry and
   still produce 0 `import_edges` by construction (the skeleton ships queries
   for four grammars), so table membership does not tell "observed zero" from
   "never counted" (review record 2026-09-25, G13); AD-15's Reuse
   discriminator keys on this declaration. Zone evidence is secret-scanned and
   injection-flagged at capture (`zone_evidence_suspect`, AD-19). Incremental:
   content-hash per file; a file gone from the walk, or listed by the walk but
   absent on disk (the indexer's stat fails — `git ls-files --cached` lists a
   tracked file deleted from the working tree, executed in review record
   2026-09-26, ER M3), has its `symbols`,
   `import_edges`, and FTS rows deleted and `files.in_tree` set to 0, and its
   `files` row is kept while mined history references it (AD-4 — pruning
   deletes evidence, AD-13); files > 1 MB or > 20k lines are
   indexed path-only with a diagnostic.
   **Symbol names are stored in full, and R-20's name-length bound stays
   unset** (settlement (a); F-20). Storage is already bounded by that ingestion
   cap, and no language standard bounds an identifier (ECMAScript, Java and
   Python set no maximum). The one primary-source bound on what a name costs
   downstream is the harness's 10,000-character cap on an `additionalContext`
   string (AD-16's composer rule), and a per-name bound follows from it only once
   the composer's rule for whispers that do not fit is decided: a whisper made
   longer than the cap by a long name is one such case, and whether such
   whispers may be withheld is pending Max Cogar's decision (OL-C1; AD-16). The
   bound is derived from that rule when it is made, not chosen now. **A file's derived rows depend on more
   than its own bytes, so re-resolution is driven by dependency tracking:** for
   each importer the indexer stores every resolution query its resolver made
   (`resolution_probes`, AD-4; F-7) —
   each candidate path probed and whether it was present; the path and content
   hash of the `package.json` (or other manifest) the dependency lookup read;
   each top-level name queried and its answer — as paths, never as specifiers
   (AD-19), and re-resolves an importer on a later pass when any stored answer
   would now differ (a probed path appears or disappears, a read manifest's hash
   changes). The frontend fingerprint is **per language**
   (`lang_capabilities.frontend_digest`, AD-4), so a changed frontend re-parses only that language's files,
   and each entry's `version` is a **content digest** of the grammar WASM, the
   query, and the frontend and resolver code, so a changed file changes the
   digest whether or not anyone bumped a number. A language with no
   `lang_capabilities` row and an importer with no `resolution_probes` rows —
   every store's state on its first pass after 003 — are re-parsed and
   re-resolved, so the new state is filled by that pass (F-7). *Why (Step 14 build review S1,
   S2, 2026-09-26, both executed):* indexing
   with no frontends and then with real ones wrote nothing (every store would
   have kept its empty symbols and edges at Step 15, observed zero read as
   never counted — the G13 failure); and switching to a branch without a file
   and back lost its import edges, test mapping, and entry score for good,
   with `index_head` still equal to `HEAD`, so nothing reported it. *(Corrected
   2026-09-28: this said "unchanged" covers every input with a whole-tree
   fingerprint and re-parsed only files with `unresolved_imports > 0` when a file
   appeared, which misses a resolution that changes when a probed path, a
   manifest, or a resolver input changes, and re-parsed every language when one
   frontend changed — R-19; B8 verification item 4, B8b E-3, E-4, E-25, B9 E-19.)*
   `schema_meta.index_head` records the
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
   pointers — P4; the generic frontend is a fallback: its structural facts take
   their genre's stated confidence like any other (AD-14), because a
   per-extraction-path confidence would need measured precision Phase A does
   not have (G-3, settlements, option 4 rejected), and FTS path/word coverage
   keeps its languages searchable). Not a fixed language list (C-6 bars it; the 2026-07 record's
   four-grammar scope is explicitly not cloned). Not a hand-rolled gitignore
   matcher (git's own listing is the reference implementation). Not a list of
   unwritten conventions (`test_map` and `entry_score` use only listed, tunable
   patterns).
5. **Premise verification.** V14 (both packages current, WASM, no install
   scripts); grammar inventory deferred to build with an explicit check
   (Limitations L6); the walk, capability, and convention decisions from the
   review record `docs/reviews/2026-09-25-skeleton-gap-list-review.md` (G11,
   G13, N7, N13; the non-git failure executed there); the tracked-vs-ignored
   `ls-files` behaviour executed here 2026-09-26 on git 2.43.0 and the
   gitignore(5) sentence read at `git-scm.com/docs/gitignore` the same day; the
   `check-ignore` signal, the deleted-but-listed file, and the Go test layout
   executed or fetched in review record
   `docs/reviews/2026-09-26-architecture-pass-expert-review.md` (M3, M4, M5);
   `FR-K1`, `FR-K7`, C-6 read at spec §11.1/§8; the 2026-09-28 corrections —
   zones, the walk's non-regular entries, `test_map` capability, grammar
   usability and its cause, the generic frontend's scope and share, resolver
   classes, dependency tracking — from the register (R-14, R-16–R-20) and the
   batch files each cites there (the scanner sources, the isolation runs and the
   `tsc` traces executed in B9; Linguist's `vendor.yml` and the zone runs in
   B8a; the Linguist `languages.yml` membership above fetched and counted
   2026-09-28), and G-9 with Flaw 2 (Node's `modules` page and the `tsc` traces
   executed in the settlements and their review). Addresses:
   `FR-K1`, `FR-K7`, C-3, C-6, NF-1, AC-17, AC-20.

### AD-13 — Co-change miner

1. **Decision.** Mining runs in `ctxoracle index` (and the detached reindex),
   never on the event path. Every `git` call uses the pinned flags and
   `--encoding=UTF-8` (Step 13).

   **The pass's inputs are resolved once and validated before any write.**
   `git rev-parse --verify -q HEAD`: exit 0 → the pass's `HEAD`; exit 1 → an
   unborn `HEAD`, nothing to mine, recorded in the pass result, nothing written;
   any other status → `git_failed` (below), and the pass fails visibly (R-23; B2
   E-1 (a)). The **ref key**: `git symbolic-ref -q HEAD` exit 0 → the ref name;
   exit 1 → the detached marker; any other status → `git_failed`
   (`subcommand: 'symbolic-ref'`), no reconcile, nothing written (C-2 as
   corrected, settlements: executed, exit 0 on a branch, 1 detached, 128 outside
   a repository). **`refTs`** = the `%ct` of `HEAD`, which must match
   `/^[0-9]+$/`, be ≤ `Number.MAX_SAFE_INTEGER`, and be no later than the wall
   clock plus `REF_TS_FUTURE_TOLERANCE_S` = 864,000 s (ten days; a named constant
   in `src/miner/cochange.ts`, not a tuning row: it guards an input and is not a
   calibration point of the bar). The miner takes `nowMs` (default `Date.now()`),
   so tests fix the clock; `refTs` itself stays `%ct`, deterministic, and the
   wall clock serves only this guard. On any failure the pass records one fault
   `miner_ref_ts_invalid`
   (`{commit, ct, reason: 'empty'|'non_decimal'|'unsafe_integer'|'future', nowS, toleranceS}`)
   and writes **nothing else** — no `commits` row, no `ref_ts`, no weights, no
   landmine rebuild, the watermark unchanged — and returns
   `{refused: 'ref_ts_invalid'}`; the `index` verb still runs the indexer pass,
   whose data do not depend on `refTs`, and exits non-zero through its error
   channel either way. *Why (R-24; G-8 as corrected, settlements; B7b E-6):* a
   tip committed at 40000000000 horizon-excluded every commit and left an empty
   store with no fault (executed), and git records such a date without complaint
   (executed, git 2.43.0), so the miner is the only place that can refuse it.
   The constant's comment states its standing exactly: git's date parser
   (v2.43.0 `date.c` L536–L541, `set_date`) uses ten days to reject an
   implausibly future reading of an ambiguous date, and git bounds no stored
   timestamp; the size is adopted as a plausibility bound, and its cost is
   derived — a tip ten days ahead moves the horizon's lower edge by
   10 / 1826.25 = 0.55 % of the window, the 90-day fix-chatter window by
   10 / 90 = 11.1 %, and leaves commits up to ten days ahead uncapped (a weight
   factor of at most 2^(10/365) ≈ 1.019 at the seeded half-life), each in the
   under-firing direction; a larger skew is refused visibly (fail-fast, Shore).
   Zero tolerance would turn a slightly fast clock into an outage of all
   mining; a clock-skew figure from authentication practice is a number made for
   a different threat.

   **Hygiene** as hard filters: merge commits are never streamed
   (`--no-merges`; `FR-K2`, MSR/HERZIG grounding is the spec's); transactions
   > 30 entities (`miner.max_transaction_entities`, illustrative, tunable —
   `FR-K2`) are size-excluded, each recorded in `commits` with its reason;
   history horizon default 5 years or 10,000 commits, whichever first (tunable,
   `FR-K2` "configurable recency-weighted horizon"), **enforced on every pass,
   full or incremental**, by the target set below, and stated by `status`
   (`N` commits / `Y` years), since a commit beyond it has no row to show
   (F-14; G-1, settlements); recency weights each
   commit's contribution to the counts (below), and `last_ts` is recorded per
   pair for display.
   Aggregation: canonical-ordered file-pair counts, plus a per-file change count
   stored once on the file (`files.change_count`, AD-4) — the **frequency** of
   the file in ROSE's sense, "the (occurrence) frequency of a set x in a set of
   transactions D" — incremented for every *contributing* commit (in the target
   set and not size-excluded) that touches the file, single-file commits
   included, so it counts the same population as the pair counts;
   `confidence(a→b) = pair_weight / change_weight(a)`; `support = pair_count`,
   ROSE's "support count", "the number of transactions the rule has been derived
   from" (R-40; B3a E-7: "support" had named both counts).

   **The target set and the reconcile — one rule for every pass.** `T(H)` = the
   commits printed by `git log --no-merges --max-count=<miner.horizon_commits>
   --format=%H%x00%at <H>` whose `min(%at, refTs)` is at least
   `refTs − miner.horizon_years × 365.25 × 86400`, where `H` is the pass's `HEAD`.
   It is the set a fresh mine of `H` includes, stated as a function of `H` alone.
   `S` = the hashes in `commits`. Each pass **re-weights** the stored commits
   whose term has changed (below), then **evicts** `D = S \ T`, then **mines**
   `A = T \ S`. *(Symbols, F-15: the evicted set was also called `E`, the name
   of the weight epoch, and the pass's `HEAD` was `h`, the name of the half-life;
   here `D` is the evicted set, `H` the pass's `HEAD`, `E` the epoch and `h` the
   half-life, throughout AD-13.)*
   - *Re-weight* (chunked, bounded and yielded per AD-26; settlement (d), F-5,
     F-6). A stored term depends on the commit's author time and on three
     quantities of the store: `refTs` (the cap), the epoch `E` and the half-life
     `h`. After `refTs` is validated (G-8) and before the evict step, let `R0`,
     `E0` and `h0` be the stored `ref_ts`, `weight_epoch` and
     `mined_half_life_days`, and `E1` the epoch rule's value for this pass's
     `refTs` and `h` (below). The **re-weight set** `W` is: every commit with a
     non-NULL `weight` when `h0 ≠ h`, when `E0 ≠ E1`, or when any of the three is
     absent; otherwise, when `R0 ≠ refTs`, the commits with a non-NULL `weight`
     and `ts > min(R0, refTs)` — exactly those whose `min(ts, ·)` differs
     between the two instants, since for `ts ≤ min(R0, refTs)` both minima are
     `ts` — which covers `refTs` moving either way (a commit capped at `R1` also
     changes when `refTs` rises to `R2` with `R1 < R2 < ts`, F-5); otherwise
     `W = ∅`. For each commit of `W`, `commits.weight` is **recomputed**,
     `2^((min(ts, refTs) − E1)/h)`, and every file and pair it touches is
     recomputed from `commit_touches` joined to `commits.weight` with the
     evict step's recompute. Recomputing, never multiplying, is what makes the
     step repeatable: applying it twice writes the same values. *Crash rule:* when
     this pass's `refTs`, `E1` or `h` differs from the stored value, or one is
     absent — whether or not `W` is empty, because the pass's own newly mined
     commits carry terms computed at those inputs — the pass's first
     transaction writes `schema_meta.reweight_pending` — `'all'` for the
     whole-set case, else the time `min(R0, refTs)`, lowered to the smaller of
     that and any floor already pending — and sets `mining_in_progress = 1`; the final transaction writes `ref_ts`,
     `weight_epoch` and `mined_half_life_days` and deletes the marker. A pass that
     finds the marker unions its own `W` with the marker's set (`'all'`, or every
     weighted commit with `ts` above the pending floor), so a commit a crashed
     pass re-weighted at another `refTs` or `h` is re-weighted again whatever
     the next pass's inputs are: the review's rule "re-applying step 2 writes the
     same value" holds only when the retry sees the same `refTs` and `h`, and the
     marker removes that condition. *Cost:* `W` is normally empty — its
     `refTs` case is the commits whose author time is later than a tip's
     committer time, the ones `miner_ts_capped` counts (below) — and is the
     whole horizon only when `h` changes or the epoch moves, which the epoch
     rule makes once per half-life; one query over at most
     `miner.horizon_commits` rows finds it, off the event path.
   - *Evict* (chunked, bounded and yielded per AD-26): per commit, read its
     `commit_touches` file ids; delete its `commit_touches`, `labelled_touches`
     and `commits` rows; then **recompute**, from `commit_touches` joined to
     `commits.weight`, every affected file's `change_count` and `change_weight`
     and every affected pair's `pair_count`, `pair_weight`, `last_ts` and
     `last_commit` (AD-4's tie rule: greatest `ts`, then greater hash — the same
     rule the mine's upsert uses), deleting a pair whose count is 0. Recomputing,
     not subtracting, leaves no cancellation residue. Each affected `files` row
     whose `prov_kind = 'commit'` names an evicted commit is re-pointed to its
     remaining commit with the smallest `ts` (ties: smallest hash) in
     `commit_touches` or `labelled_touches`; a fresh mine sets `prov_ref` by the
     same rule.
   - *Mine* `A`: stream `git log --no-walk=unsorted --stdin` with `A`'s hashes
     fed oldest first, the pinned flags, `-M -z --numstat` and the settled
     format; each commit is classified, labelled and counted as below, and a
     contributing commit also writes its `commit_touches` rows and
     `commits.weight`, computed with `E1`, `h` and this pass's `refTs`.
   - If the re-weight, `D` and `A` together take more than one write
     transaction, the first sets `mining_in_progress = 1`. The **final
     transaction** writes the watermark, `last_mined_ref`, `ref_ts`,
     `weight_epoch` and `mined_half_life_days`, deletes `reweight_pending`,
     records `history_rewritten` or `branch_changed` if either applies (below),
     rebuilds the miner landmines, and clears the flag.
   - A **full mine is this pass with `S = ∅`**.
   - *Crash:* every re-weight, evict or mine transaction updates rows and sums
     together, so a crash leaves `S` consistent with the sums; the next pass
     recomputes `W` (with the pending marker), `D` and `A` from `S` and finishes
     the work, a full pass exactly like an incremental one. No recorded range is
     needed. *Why one rule (C-3 as
     corrected, settlements):* if a pass that needs `C` chunk transactions is
     interrupted after `j ≥ 1` of them, resuming keeps the `j` and completes
     within `C` passes, while purging and restarting need never complete under
     repeated interruption (a reboot, a manual kill, the out-of-memory killer),
     leaving the history genres silent under `mining_in_progress`.
   - *Equality:* after any completed pass every count equals a fresh mine of `H`
     exactly (both are functions of `T` and each commit's touched set), and every
     stored term equals a fresh mine's at the same `refTs`: the re-weight makes
     each term `2^((min(ts, refTs) − E)/h)`, the function of the commit and the
     current `refTs` a fresh mine computes, and the epoch rule gives both stores
     the same `E` for the same `refTs` and `h`. Every weight therefore equals a
     fresh mine's to within summation rounding (the same positive terms in
     another order: relative error at most `(n − 1) · 2^−53` per sum,
     `n ≤ 10,000`, so ≤ 1.2 × 10^−12; tests use relative tolerance
     2.3 × 10^−12, twice that bound), with **no exception**, whichever way
     `refTs` has moved. *(Corrected 2026-09-28 by settlement (d), F-5, F-16:
     this clause carried an exception — a stored term capped at an earlier
     pass's `refTs` differed from a fresh mine's "if `refTs` later moves below
     that commit's author time" until the commit was evicted — which was a
     patch over a term that depended on the pass that mined it, and missed the
     rising case; and it rescaled by "the exact power of two
     `2^((E_inc − E_fresh)/h)`", which is a power of two only when the two
     epochs lie on one half-life grid, which nothing fixed.)*
   *Why (R-22, R-23; G-1 as corrected, settlements):* both horizons are
   enforced on incremental passes too (B4 verification item 1), and at `HEAD`
   the incremental store exceeded a cap of 3 by two commits and differed from a
   fresh mine (B7a E-10, executed on repository `hz`). `--max-count` gives the
   same set as the last `N` positions of the reversed stream (executed equal for
   `N` = 10, 250, 491, 1000 on a clone of this repository, 10,000 on a
   20,000-commit history, and 1–6 on a date-skewed history with a merge), costs
   0.2 s at 10,000 commits (executed), and the `--no-walk --stdin` stream is
   byte-identical to a walk over the same commits (executed, equal `sha1sum`).
   The rejected alternatives: subtracting aged-out commits by re-deriving their
   touched sets from git needs git to reproduce months later exactly what a pass
   computed, and needs objects that a rewrite or branch switch removed; starting
   a full mine whenever a pass crosses a horizon makes almost every pass on a
   mature repository a full mine (each new commit moves the oldest in-horizon
   one out), silencing the history genres each time, the opposite of AC-13's
   "append refreshes incrementally"; slack past the horizon lets beyond-horizon
   commits contribute edges, which AC-13 forbids.

   **The watermark** (B5 verification ruling 1, kept for its readers).
   `schema_meta.last_mined_commit` is the `HEAD` resolved once when the pass
   starts, merge or not, keyed to `last_mined_ref` (the ref key above), and
   written **only in the pass's final transaction**, and only when the pass
   mined every commit of `A` (the stream delivered each fed hash); chunk
   transactions write nothing to it, and an incomplete pass leaves the previous
   tip and records the shortfall as `miner_stream_incomplete`
   (`{head, fed, mined, firstMissing}`; F-8), so an incomplete read is never
   recorded as a complete one (Step 13 build review M2: a stream the miner could
   not parse mined nothing and still advanced the watermark). Its readers are the
   history staleness rule (`historyStale` = mined tip ≠ `HEAD`, AD-14) and the
   ref and rewrite diagnostics below; **it no longer bounds the work**: the next
   pass's work is `W`, `D` and `A`, so G-1 replaces ruling 1's range rule
   (`<tip>..<new HEAD>`, or `HEAD --not <tips>`) and its "a crashed pass re-runs
   its recorded range and skips hashes already in `commits`" rule, and the
   merge-at-boundary and skewed-parent cases ruling 1 added stay as equality
   tests. *Why a pass-start `HEAD` (ruling 1; B5b "The watermark rule"):* the
   stream excludes merges, so a watermark taken from the stream's last commit
   can never equal a merge `HEAD` and every history fact would read stale
   forever on a merge-PR repository; and a clock-skewed side branch's commits
   can be streamed after a later commit without being its ancestors (the
   executed merge and clock-skew cases, B5 verification). *(Corrected
   2026-09-28: this said each chunk advanced the watermark to its own last
   commit, an incomplete pass kept the last chunk's watermark, and the next pass
   mined `watermark..HEAD` — R-22; ruling 1, then G-1.)*

   **A ref change or a history rewrite is a diagnostic, never a purge.** If the
   ref key differs from `last_mined_ref`, the pass records `branch_changed`
   (`{oldRef, newRef, oldWatermark, newHead, evicted, added}`) in its final
   transaction. On the same ref: `git cat-file -e <watermark>`; exit 0 →
   `git merge-base --is-ancestor <watermark> HEAD`; exit 0 → an ordinary pass;
   `--is-ancestor` exit 1, or `cat-file -e` exit 1 → `history_rewritten`
   (`{oldWatermark, newHead, evicted, added}`) in the final transaction; any
   status outside {0, 1} → `git_failed`, nothing written ("Errors are signaled by
   a non-zero status that is not 1", git-merge-base(1)). In every case the work
   is the same reconcile against `T(H)`, which evicts the commits the new
   `HEAD` does not have from their stored touches without needing their objects.
   *Why (R-23; C-2 and Flaw 3 as corrected, settlements; B4 verification item
   1):* batch 4 kept the checked-out `HEAD`'s history as the store's meaning and
   chose a purge only because aggregate storage could not drop a commit
   (B4 p2 E-1: "under the aggregate storage model … still needs a purge and
   re-mine"); G-1's stored touches remove that reason. Keeping the union of every
   mined tip instead counts a rebased change twice (executed: pair `a`–`b`
   support 3 in the union against 2 on `main`), and mining one fixed ref answers
   questions about a line the agent is not working on. An ordinary `git commit
   --amend` is a same-ref rewrite (executed: `--is-ancestor` exit 1, `cat-file`
   exit 0), so a purge there re-mined the whole history, with the history genres
   silenced, on every amend, rebase or force-push. What the reconcile costs: a
   switch between two long divergent lines evicts and mines up to `2N` commits,
   with the history genres silenced while it runs. *(Corrected 2026-09-28: a
   rewrite or an unreachable watermark ran "one purge transaction" and a full
   re-mine, and `merge-base` exit 128 was read as a rewrite — R-23; RC-2.)*
   **`git_failed`** (C-4 as corrected, settlements) is one fault code for any git
   subprocess failure on an off-path pass: the git helpers throw a typed
   `GitFailed` carrying `{writer: 'miner'|'indexer', subcommand, status, signal,
   stderrTail}` — `stderrTail` the **last 4,096 bytes** of the subprocess's
   stderr, taken before escaping, because that is the most one git report can
   be: git writes every `fatal:`/`error:`/`warning:` line through `vreportf`,
   which formats into `char msg[4096]` and writes at most that many bytes,
   newline included (`usage.c` at v2.43.0, fetched 2026-09-28), and a git that
   dies exits right after its `fatal:` report (`die_builtin`: the report, then
   `exit(128)`), so the tail holds that whole final report (F-13; the former "at most 2 KB" had no source) — for `rev-parse` or
   `symbolic-ref` statuses other than 0/1, `merge-base`/`cat-file` statuses
   outside {0, 1}, a non-zero `git log`/`rev-list` exit or a spawn error in the
   miner, and `ls-files`, `check-ignore` statuses other than 0/1 or `rev-parse`
   in the indexer's walk — and the `index` verb's catch records it and exits
   non-zero. A `GitFailed` never purges and never advances a watermark or
   `index_head`. A throw from the miner's own parser inside the stream is not a
   `GitFailed`. `history_rewritten` and `branch_changed` stay separate codes:
   they are outcomes of a git call that worked.

   **Existing stores are reset once: the schema by migration, the rows by the
   next index pass.** The migration that adds `commit_touches` and
   `commits.weight` is `003_phase_a_project.sql`, a new file after
   `002_phase_a_global.sql` (AD-4's schema check: never an edit of 001). Its one
   transaction holds only row-count-independent steps (AD-4's migration bound):
   the new tables, the column, deleting `last_mined_commit`, `last_mined_ref`,
   `ref_ts` and `weight_epoch`, and setting `history_reset_pending = 1` and
   `mining_in_progress = 1`. The **reset** is the data step that marker names,
   run by the next index pass before its reconcile, in bounded, yielded chunks
   (AD-26), each an idempotent delete: it deletes the miner-derived rows —
   `commits`, `cochange_pairs`, `labelled_touches`, the miner-kind `landmines`
   (`human_stated` kept) — and zeroes `files.change_count` and `change_weight`,
   then clears `history_reset_pending` in its last chunk's transaction; the
   pass then mines with `S = ∅`, and its final transaction clears
   `mining_in_progress`. A crash leaves whichever marker is still set, and the
   next pass resumes from it; `status` says the history is being re-mined. The
   pass that runs it is the detached child the first `SessionStart` after the
   upgrade spawns (AD-4), or any `index`. None of those rows is
   human-provenance, so this is not the purge CR§1 and store-recovery forbid,
   and it is the only way `S` becomes consistent with `commit_touches`: a store
   migrated with `commits` rows and an empty `commit_touches` could never evict
   its earlier commits, and the equality above would never hold (G-1 as
   corrected, review change (b)). *(Corrected 2026-09-28, F-3, F-4: the
   migration itself deleted every mined row inside its one transaction, against
   AD-26's 150 ms bound, and nothing but the owner's own CLI use would have run
   it.)*

   **Recency weights the evidence, never the result.** Each contributing commit
   at time `ts` adds `2^((ts − E)/h)` to `cochange_pairs.pair_weight` of every
   pair it touches, to `files.change_weight` of every file it touches, and as its
   own `commits.weight`, where `E` is the store's weight epoch
   (`schema_meta.weight_epoch`), `h` is `bar.recency_half_life_days`, and `ts` is
   the commit's author time capped at `refTs`, taken in days, the unit of `h`.
   **The epoch is a function of `refTs` and `h` alone:** `E = h × ⌊refTs / h⌋`,
   `refTs` in days since the Unix epoch — the latest whole multiple of `h`
   days at or before `refTs`, so `refTs − h < E ≤ refTs` and every store's epoch
   lies on one grid whose origin is fixed (F-16: the earlier rule fixed only that
   band, so two stores' epochs, a fresh mine's and an incremental one's, need not
   lie on one half-life grid). The epoch moves only when `refTs` crosses a grid
   line, in whole half-lives either way (`refTs` can move back — a checkout of an
   older tip); the move makes the re-weight set every weighted commit (above),
   which recomputes every term and sum at the new epoch in chunked, yielded,
   resumable transactions under `mining_in_progress` — never one transaction
   multiplying every row by `2^(−k)`, which at the horizon's seeds rewrites
   every pair row in one hold — the one measured write of that order, 349,905
   pair upserts for 10,000 commits, held the lock 414 ms (AD-26), beyond its
   150 ms bound — and which could not be resumed after a crash because a
   multiplication applied twice is not the same as once. Every term shares the
   epoch, so no ratio changes and **no git read is needed to re-base**.
   **The only floor is
   underflow:** an in-horizon term's exponent lies in `[−365.25·Y/h, 1)`, and the
   weights are read as a ratio, so a weight must stay a *normal* double (a
   subnormal loses relative precision: `2^−1073.5 / 2^−1073` evaluates to 0.5,
   the true ratio 0.707 — executed, B7b E-6), which holds exactly when
   `bar.recency_half_life_days ≥ 365.25 × miner.horizon_years / 1022` (about
   1.79 days at the seeded 5 years); `tune` refuses a write to either key that
   breaks it. **Read rule:** a zero or non-finite `change_weight` or pair ratio
   is read as *no recency evidence* — the candidate fails the confidence axis
   with that reason recorded in its bar outcome — and is never compared as `NaN`
   (`NaN ≥ x` is false, which would drop the pair silently). `ts` is capped at
   `refTs` because the author date (`%at`) is settable by anyone; the capped
   commits are counted in the fault `miner_ts_capped` (`{count, firstHash}`,
   once per pass that caps any; F-8).
   The miner records the half-life it mined with
   (`schema_meta.mined_half_life_days`); **when `h` has changed, the next pass
   re-weights every stored commit from the store** — the re-weight above, with
   `W` the whole set, recomputing each `commits.weight` from `commits.ts`, this
   pass's `refTs` and the new `h` at the new epoch, then every sum from
   `commit_touches`, chunked and yielded under `mining_in_progress` — so a ratio
   never mixes two decay rates, and a store missing any of `ref_ts`,
   `weight_epoch` and `mined_half_life_days` while it holds weighted commits is
   re-weighted the same way; `tune` says so when `h` is written. The miner has
   no purge; the only bulk deletion of mined rows is 003's reset above.
   *Why (R-24 / F-6; B5
   verification ruling 2, B5c E-3, E-4, B7b E-6, B6 verification item 3):* the
   earlier rule set a full mine's epoch to `refTs − 500·h`, made a commit whose
   exponent exceeded 1000 a purged full re-mine, and refused `h` below 37 days;
   ruling 2 re-bases exactly instead, 37 had no derivation, and the floor is the
   relation above because `tune` accepted `miner.horizon_years` = 200 at `h` = 37
   and an in-horizon commit then stored weight 0 and a 0/0 pair with no fault
   (executed). B6 verification item 3's substance — a ratio never mixes two
   decay rates ("changing h forces a re-mine") — is kept by the re-weight; the
   re-mine itself was kept only because aggregate sums could not be re-derived
   without git, and `commits.ts`, `commit_touches` and `ref_ts` now hold
   everything the recompute needs, the reason Flaw 3 already applied to rewrites
   (F-6; the settlements' review named this consequence and left it unapplied).
   *(Corrected 2026-09-28: a changed `h` was "a purged full re-mine",
   automatically, which cleared every history table and silenced the history
   genres for a whole re-mine with git reads; the epoch re-base was one
   multiplying transaction.)*
   ROSE is cited only for weighting the mined changes — FR-K2 asks
   for a recency-weighted horizon, and ROSE weights and windows the transactions
   it mines; the exponential half-life form and the ratio-against-floor
   comparison are the agents' derivation (B5a E-19). *Why weighting at all
   (review record 2026-09-26, plan-pass collapse-hunt H1):* the earlier rule
   multiplied the finished confidence by `0.5^(age/h)`; with the 0.9 trust
   factor, a perfect pairing last changed together more than about 213 days
   before `HEAD` fell below the 0.6 floor (0.9 × 2^(−213/365) = 0.60), so the
   oracle went silent on exactly the stable couplings. A pairing that has always
   held stays at its ratio however old it is; a pairing whose files have since
   changed apart loses weight to the recent solo changes.
   (**Superseded 2026-09-26:** `pair_count / a_count` over a counter kept on the
   pair row, which could not see commits touching `a` alone and so equalled
   `pair_count` — every confidence 1.0, the floor never filtering; review
   record 2026-09-25, G3.)

   **Renames are not followed in Phase A.** A rename entry contributes both paths,
   as at `HEAD`. Each pass records, in its result and in `status`, the rename
   entries in **every** commit of `T` (size-excluded ones included) and, as
   "history a follower would carry", the contributing commits in `T` on each
   renamed old path. *Why (G-4 as corrected, settlements):* following at mining
   time would make a commit's contribution depend on a later rename commit,
   which breaks the order-independence the reconcile rests on; a read-time rename
   map would not, and is not built in Phase A because the measured stake is small
   — four contributing commits of 491 in `Maxcogar/agent-armory` — and the pass
   now measures it on every repository, so the Phase A exit data decide whether
   Phase B builds it (L14). git's detector is a 50 % similarity heuristic by
   default, so following at that setting could also merge two different files.

   **Unreferenced history-only rows.** A `files` row with `in_tree = 0` that no
   `commit_touches`, `labelled_touches`, `cochange_pairs` or `landmines` row and
   no human-provenance record references is deleted by the mining pass whose
   eviction left it unreferenced, in that eviction's transaction; one the indexer
   marks `in_tree = 0` when no such row references it is deleted by the indexer
   in the same pass (R-40; B3a E-7: no rule said who removes such a row, or
   when).
   While `mining_in_progress = 1`, the history genres —
   Coupling, Consequence, Warning (from miner-kind landmines; a `human_stated`
   row is not history-derived and still fires), Completeness — produce no
   candidates, because their counts are partial; for the same reason
   Orientation ranks without its co-change hub-degree factor while the flag is
   set (match strength × `entry_score` only; its headline never states hub
   degree, so no text changes) — the partial pair counts are not evidence for
   a rank any more than for a whisper (a reader of `cochange_pairs` the
   suppression list omitted, found while applying F-3/F-4); the pass's final transaction
   clears it, and `status` lists it among the active suppressing conditions
   (AD-17). *Why the flag and the reset set (review record 2026-09-26, CH H1 /
   ER M1; ER S2 / CH H9):* "full re-mine"
   named no purge set, so rows for rewritten-away commits survived in
   `labelled_touches` and every landmine rebuild re-created the `revert_chain`
   citation of a commit that no longer exists (N5 again, through the new table),
   and a re-mine over un-reset counts doubled every `change_count` (halving every
   confidence); readers seeing a half-finished pass would read partial counts
   as evidence. Corpus floor
   (`FR-A6`): history genres return no candidates until the mined corpus ≥ a
   tunable floor (default: 30 non-excluded commits — evidentiary, feeding
   confidence; no session/adoption window exists anywhere).
2. **Standard.** `FR-K2` governing (its hygiene items are spec-stated with their
   own sources); `FR-A6` for the floor; Zimmermann et al., IEEE TSE 31(6) 2005
   for the confidence denominator (the frequency of A, the number of
   transactions containing A); git-rev-list(1) options (`--max-count`,
   `--reverse`, `--no-walk`, `--stdin`, v2.43.0) and git-merge-base(1) for the
   target set and the exit statuses; fail-fast (Shore, IEEE Software 2004) for
   the input validation and `git_failed`.
3. **Why here.** Pair counts + per-file change counts is the minimal storage
   from which every bar term (support, confidence, recency) and every whisper's
   evidence ratio renders without walking history at event time;
   `commit_touches` is what lets a pass drop a commit exactly.
4. **What this is NOT.** Not per-commit transaction lists as the *query* model:
   the event path reads only the aggregates, and `commit_touches` is bounded by
   the horizon it enforces (300,000 rows at the seeds), evicted with its
   commits, and read only off the event path — so the unbounded growth and
   lookup-time aggregation this rule excludes do not arise. Not
   association-rule mining at query time (hook-path budget). Not recency
   *pruning* (the spec chose horizon-cap + recorded recency; pruning deletes
   evidence). Not a recency multiplier on the finished confidence (it silenced
   stable couplings by age — H1 above). Not a purge on a rewrite, a branch
   switch or a changed half-life, not the union of mined tips, and not a fixed
   mined ref (above). Not an equality exception for a moved `refTs` (the
   re-weight removes its cause, settlement (d)), and not an epoch re-base in one
   multiplying transaction (above).
5. **Premise verification.** `git log --no-merges --numstat` exercised on this
   repo this session (V13's commands ran against the same git); `FR-K2`, `FR-A6`
   read at spec §11.1/§5.2; the counter defect executed in the review record
   `docs/reviews/2026-09-25-skeleton-gap-list-review.md` (G3); the purge set
   and the chunked, flagged pass from review records
   `docs/reviews/2026-09-26-architecture-pass-collapse-hunt.md` (H1, H9) and
   `docs/reviews/2026-09-26-architecture-pass-expert-review.md` (M1, S2 — S2's
   414 ms single-transaction write phase for 10,000 synthetic commits executed
   there on Node 22.22.2); the target-set equalities, the stream equality, the
   rebase union, the amend statuses, the `symbolic-ref` statuses, the far-future
   `%ct` and git's acceptance of it, and the rename counts executed in the
   settlements and re-run in their review (git 2.43.0, Node 22.22.2); the weight
   floor, the 0/0 case and the subnormal ratio executed in B7b E-6; the
   re-weight's set and recompute from settlement (d) (the cap at `refTs` read
   in `src/miner/cochange.ts` there), with its crash marker derived above; the
   fixed-origin epoch, the store-side half-life re-weight and the chunked reset
   from F-16, F-6, F-3 and F-4; git's 4,096-byte report buffer read in `usage.c`
   at v2.43.0 (fetched 2026-09-28). Addresses:
   `FR-K2`, `FR-A6`, AC-1, AC-6, AC-13.

### AD-14 — The relevance bar: a conjunction of floors, no caps, calibrated by the human channel

1. **Decision.** A candidate is spoken iff **all three** axes clear their own
   floor (`FR-A5`'s conjunction — no multiplication, so no axis launders
   another):
   - **Confidence** `c`: evidence-derived, defined for **three** fact classes.
     *History* facts: `support` and the recency-weighted `confidence` from
     `cochange_pairs` (AD-13), dampened by staleness (`FR-K7`) and trust
     (`FR-X4`: low trust lowers confidence). *Human* facts: high by construction
     (`FR-L6`). *Structural* facts — Orientation's entry points, Reuse's
     dominance claim, Verification's covering-test mapping — have an evidence
     confidence `s_g`, one tuning row per genre (`bar.orientation_confidence`,
     `bar.reuse_confidence`, `bar.verification_mapping_confidence`), each seeded
     **0.75**, illustrative and marked so in `tuning_seeds.ts`, refused by `tune`
     outside (0, 1], then dampened (index staleness, trust) and capped (the
     heuristic cap for Reuse, the suspect cap) by the composition below. A
     structural fact has **no `support` and no `ratio`**: the bar reads
     `statedConfidence`, which the candidate's own generator sets from its
     genre's row (a discriminated union on `factClass`, so a structural candidate
     carrying `support`/`ratio` is a type error), and the combinator itself still
     carries no genre term; each structural genre keeps its own evidence rule
     (Reuse's k× dominance, Orientation's match, Verification's mapping). The
     seed is chosen inside the band the bar's own seeds define: a structural fact
     is always `untrusted_repo` and may be index-stale, so its confidence is
     `0.9 s` fresh and `0.81 s` stale; clearing the 0.6 floor when stale needs
     `s ≥ 0.741` and staying below the 0.8 high tier with no dampener needs
     `s < 0.8`, so the band is [0.741, 0.8) (executed:
     `0.6/(0.9*0.9)` = 0.7407; `0.75 × 0.9` = 0.675 fresh, `0.75 × 0.81` = 0.6075
     stale). At the seeds no dampener silences a genre, and every structural
     whisper is flagged `[confidence: uncertain]` until Phase A data justify
     tuning a genre up; the stored-set relation
     `bar.<g>_confidence × bar.untrusted_trust_factor × bar.stale_factor ≥
     bar.confidence_floor` (and `bar.<g>_confidence ≤ 1`) keeps a tuning write
     from doing so — `tune` refuses a write to any key it names, naming the genre
     that would be silenced when stale. *Why (R-26; G-3 as corrected,
     settlements; B2 E-5 (b)):* AD-14 defined confidence for history and human
     facts only, and the bar read `c.ratio ?? 0`, so a structural candidate with
     no ratio failed by construction, and Orientation's `support: 3, ratio: 1`
     constants were silent certainty. Treating an index fact as certain presents
     conventions (an import taken as coverage, a ranking taken as "entry point",
     an identifier match taken as a reference) as sure; a per-extraction-path
     confidence needs measured precision nobody has. **Staleness is judged per
     fact class, against the data the fact came from:** a history fact is
     stale when the mined tip `schema_meta.last_mined_commit` ≠ `HEAD` (AD-13's
     watermark, ruling 1); an index-derived (structural) fact when
     `index_head` ≠ `HEAD`. Either multiplies by `bar.stale_factor` (seed 0.9, an
     architect's seed, marked so). *Why (plan-pass
     collapse-hunt H1):* index staleness says nothing about mined history, and
     applying it to history facts flagged every mined whisper uncertain
     whenever the index lagged.
     **The high-confidence tier, the trust dampener, and the caps are tuning
     rows (AD-5).** `bar.high_confidence_min` (seed 0.8, the skeleton
     composer's literal it replaces) is the threshold at or above which a fact
     is presented as high-confidence; below it the composer flags the whisper
     `[confidence: uncertain]`. For an `untrusted_repo` fact, confidence =
     evidence ratio × `bar.untrusted_trust_factor` (seed 0.9, in (0, 1]), so a
     strong-evidence repo fact can still reach the high tier and a weaker one
     cannot. `bar.suspect_confidence_cap` (seed 0.7) applies to
     `injection_suspect` facts (AD-19 requires suspect content to cap
     confidence) and sits in [`bar.confidence_floor`, `bar.high_confidence_min`),
     so a suspect fact that clears the floor is always delivered flagged, never
     silently dropped and never presented as sure. The identifier-match
     heuristic cap on `symbol_refs`-derived Reuse facts (AD-12, L6;
     `bar.heuristic_confidence_cap`, seed 0.7) is a cap with the same placement.
     **Composition:** dampen first (staleness, trust), then take the min() over
     every applicable cap. **The tier invariant:** a fact with perfect evidence
     must be able to reach the high tier under every dampener at once, so
     `bar.untrusted_trust_factor × bar.stale_factor ≥ bar.high_confidence_min`
     (seeds 0.9 × 0.9 = 0.81 ≥ 0.8); otherwise a dampener becomes a universal
     cap and the flag stops separating strong evidence from weak — AD-14's C2
     defect by another route (plan-pass collapse-hunt H1, H2). **Display:** the headline always shows the
     raw evidence ("17 of its last 20 changes"); the confidence value itself is
     never printed — it decides only whether the `[confidence: uncertain]` flag
     is shown, so no whisper states a number that contradicts its own
     evidence. `tune` (AD-20) rejects any write that breaks
     `bar.confidence_floor` ≤ each cap < `bar.high_confidence_min`, breaks the
     tier invariant above, puts the trust or stale factor outside (0, 1], breaks
     AD-13's half-life relation, or breaks the structural relation above. The cap seeds (0.7) are illustrative
     architect defaults like the floors below, chosen strictly inside
     [0.6, 0.8) so neither sits on a boundary of the interval the ordering
     requires. **The seeds' status, stated per row:** the 0.9
     `bar.untrusted_trust_factor` is an architect's illustrative default with
     **no literature grounding** (spec §9's convention is that tunables are
     "grounded by the literature above", and nothing grounds this one);
     `bar.stale_factor` (0.9) and `bar.hazard_full_support` (3, below) are
     architect's seeds of the same kind; the three structural rows are
     illustrative (above); all of them are calibrated on Phase A data
     (`D-6bar`) (R-28; B3b E-13, B5 verification item 13, B5a E-20, E-22).
     **Every stored set is validated when the tuning reader is built, not only
     each write.** `tuningReader(...)` validates every row it would serve (global
     rows and the repository's overrides) with the per-key rules `tune` applies to
     a write — a finite number for a numeric seed, a list key held as list rows, a
     known key — and the stored-set relations: the ordering and tier relations
     above, AD-13's half-life relation, and the structural relation. The
     validation is bounded by the key registry, not by store size. A failure
     throws `TuningInvalid` (`{key, value, rule, scope: 'global'|'project'}`),
     **never a seed substitution**. **Any `TuningInvalid` silences the whole
     event — no whisper and no deny** (F-2; spec FR-O3, coordinator ruling):
     the reader is built once per event, before the block check and the
     candidates (data flow step 3), and a throw there is an error of the kind
     FR-O3 names, "Any shim/service error, timeout, or missing store yields
     silence — and, on a block path, **emits no deny, so the agent's action
     proceeds** — never an error in the agent's flow" (spec L508–L510). The
     event's handler records `tuning_invalid` (detail as above, with `value`
     in full after AD-19's redaction and its length; settlement (b), F-11) once
     per distinct `(key, value)`, keyed by a `schema_meta` marker cleared when
     the reader next builds cleanly (as `index_stale` is recorded on the
     transition only), and records any other handler error as
     `handler_exception` (`{name, message}`; G-6 item 2, settlements; F-8),
     instead of the former `store_corrupt` catch-all. `status` runs the
     validator in report mode (it collects every failure and never throws) and
     lists an active `tuning_invalid` first, in plain language: the key, the
     stored value, the rule it breaks, that every hook event is silent — the
     answer-drift deny included — until it is fixed, and the fixing command
     (`ctxoracle tune <key> <valid value>`). `tune`,
     `status`, `deinit` and `export-human` never build the validating reader, so
     the fix and the report always run; `index`, `init` and `import` refuse with
     the same message and a non-zero exit. The write routes are closed: `tune`
     refuses an invalid value, `import` validates incoming tuning rows with the
     same validator before writing (AD-5), and every seed passes it. *Why (R-28 /
     F-2; G-6, settlements; B3b E-13, B4 p1 E-17, B6 verification item
     2, B6a E-24):* the ordering was enforced on write only, so a stored set that
     broke it was served; a stored non-numeric `deny.loop_threshold` was recorded
     as `store_corrupt` and the deny stopped (executed: `node exit=0`, 0 bytes of
     output). Serving the seed instead is the failing-slowly pattern Shore names
     ("return null or a default value … everything will seem fine"); failing at
     the reader with a named error keeps the owner's stored value from being
     silently replaced. The whole event is silenced, not only the group of
     outputs that reads the bad key, because the spec requires it: FR-O3's
     first clause covers any error, not only one on the block path. Because
     `tune` refuses an invalid write and `import` validates before writing, a
     stored invalid value arises only from corruption or from a store written
     by an older build, and the silence it causes is visible — recorded, and
     listed first by `status` with the command that ends it. *(Corrected
     2026-09-28, F-2: the value was contained in two groups — an invalid row in
     the whisper group silenced the whispers and left the deny running, one in
     the block group the reverse — and FR-O3 was restated here as asking "for
     silence on an error on the block path", on the settlements' review's
     reading that an unrelated bad key leaves the block-path clause
     unengaged; that reading answers only FR-O3's second clause, and the
     bulkhead case for containment does not change what the first clause
     says; `value` was also cut to 200 characters with no source.)*
     *Why the value is recorded in full (settlement (b)):* the project rule is
     "Numbers without sources don't go in" (`CLAUDE.md`); AD-17 requires each
     fault to carry detail sufficient to reproduce the diagnosis; the
     once-per-distinct-`(key, value)` rule already bounds how often a long value
     is written, beside the stored row that already holds it; and every string
     entering a diagnostic is redacted (AD-19).
     This replaces "on a violating stored set, record a fault and
     serve the seeds".
     *Why:* "can never yield high-confidence" named a tier that nothing defined.
     A cap placed below the 0.6 floor would silence every history genre. A cap
     above the high tier would cap nothing (review record 2026-09-25, G20).
     **Superseded 2026-09-26, second pass:** a universal
     `bar.untrusted_confidence_cap` below the high tier. Every Phase A mined fact
     is `untrusted_repo`, so that cap flagged every mined whisper uncertain: a
     19-of-20 and a 13-of-20 pairing carried the same flag, the flag carried no
     per-fact information, OL-C4's uncertain-versus-sure distinction was erased
     for the whole phase, and exit data could not compare false-fire rates
     between tiers. `FR-X4` says low trust "lowers" confidence; it does not
     require every repo fact below high, and nothing said why the weaker reading
     failed it. The suspect cap's position against the floor, the display value,
     and the cap composition were also unstated, and the ordering had no
     enforcement point (review record 2026-09-26, CH C2 / ER M9).
   - **Decision-impact** `i`: deterministic ordinal from per-candidate
     properties only — edit-context vs read-context, blast-radius band (count of
     coupled files/tests), zone criticality (`generated`/`build_output`
     touched). **No genre term, no intent term** (`D-18`: intent entered via the
     trigger).
   - **Marginal value** `m`, defined for **all three** Phase A fact classes
     (no fact class is left undefined):
     *single-file current-state* facts fail — the agent's own tools surface
     them in one call (AC-1's obviousness clause: a same-directory/same-stem
     pair is suppressed); *history-derived* facts pass. A **single-file** history
     fact — a Warning's revert or fix history — passes on `FR-A5a`: the hazard
     path's only floor is the noise floor, and the spec requires a hazard to be
     spoken with its confidence, which a marginal axis that failed it would
     forbid; the aggregation argument is not used for it, since a file's revert
     count is one `git log` call away. A **cross-file** history fact passes
     because it aggregates over commits the agent has not enumerated (the same
     aggregation clause that admits a Reuse dominance claim). *(Corrected
     2026-09-28: single-file counts were admitted by the aggregation clause —
     R-29; B5a E-6, E-21, B5b H1 E-10.)* Human-stated facts pass too, as facts
     the agent has no channel to; *cross-file current-state* facts (the Reuse
     class) pass **only when comparative or aggregative over a set the agent
     has not enumerated** — a dominance claim over candidates passes, a bare
     count one grep returns fails (P5's own named non-whisper). Dedup is
     separate (AD-16) and is never a cap.
   - **Hazard path (`FR-A5a`):** Warning-genre candidates skip the confidence
     floor; they require only the **noise floor** (real vs coincidental
     evidence: `support ≥ 2`, counting only the labels AD-15's settled order
     admits — a revert label from any commit in the target set, size-excluded or
     not, and a fix label from contributing commits only; merges and commits
     beyond either horizon never label, since they are never streamed or have no
     row) and are delivered with confidence stated (`FR-D1`). *(Changed
     2026-09-28: the clause said "not sourced solely from an excluded-commit
     class", while the settled order deliberately lets a size-excluded revert
     source a `revert_chain` — a revert of a large commit is git-generated, not
     tangled evidence — so the clause is changed to the rule built, not the
     other way round — R-27; B4 p2 E-4, B2 E-1 (c), E-5 (g), B3 verification.)* A miner
     landmine's evidence ratio is `min(1, support / bar.hazard_full_support)`
     (its own tuning row, seed 3, so re-tuning the pair floor `bar.support_min`
     does not re-tier every Warning — plan-pass collapse-hunt H10); a
     support-2 landmine is delivered flagged uncertain; a `human_stated`
     landmine is high by construction (`FR-L6`). The ratio has no base-rate
     term — three reverts among a file's 500 changes read as strong as three
     among four; Phase A records each Warning's `change_count` beside its
     support on the audit row so the exit data can measure whether a base rate
     is needed (Limitations L13).
     *(Added 2026-09-26: a hazard had no ratio, so its stated confidence had no
     definition, and the class list above omitted the single-file history
     fact; raised by the plan pass, plan D-plan-34, D-plan-41.)*
   - **No volume/count/budget term exists in the code path** (`OL-C1`; AC-3).
     Two candidates clearing the bar at one event are both delivered.
   - **Ship-high defaults, all tunable rows in `tuning` (AD-5), all marked
     illustrative:** non-hazard `c` floor 0.6, with `support ≥ 3` for history
     facts only (support is a count of co-change transactions; a structural
     fact has none — above); high tier 0.8; untrusted trust factor 0.9; stale
     factor 0.9; structural confidences 0.75; suspect and heuristic caps 0.7;
     `bar.hazard_full_support` 3; impact floor:
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
   `OL-C4` in the ledger; ROSE figures note read at spec §9; `FR-X4` ("low trust
   lowers confidence and cannot be laundered") read at spec §7.2 for the trust
   dampener; the tier/cap decision from the review record
   `docs/reviews/2026-09-25-skeleton-gap-list-review.md` (G20), revised by
   `docs/reviews/2026-09-26-architecture-pass-collapse-hunt.md` (C2) and
   `docs/reviews/2026-09-26-architecture-pass-expert-review.md` (M9); the
   2026-09-28 corrections — structural confidence and its band (derived above,
   the arithmetic executed in the settlements and re-run in their review), the
   stored-set validation (Shore's fail-fast paper, as quoted in the settlements)
   and its whole-event silence (spec FR-O3, L508–L510; F-2), the full recorded
   value (settlement (b)), the seeds' status,
   the noise floor and the single-file case — from the register (R-26–R-29) and
   G-3 and G-6 as corrected. No environmental
   premises — design choice over verified spec content. Addresses: `FR-A5`,
   `FR-A5a`, `FR-A6` (floor feeds `c`), `OL-C1`, AC-3, AC-3a, AC-4.

### AD-15 — Genre candidate generators (the seven Phase A genres)

1. **Decision.** One module per genre; each generator states its trigger, its
   store query, its headline fact, and its marginal-value guarantee. Common
   properties: every candidate carries ≥ 1 verifiable pointer (`FR-D1` — a
   candidate whose pointer fails re-resolution at compose time is dropped:
   the rumor rule); **a file pointer is verifiable only when its `files` row has
   `in_tree = 1`**, and **a masked path (AD-19) is not a verifiable pointer**.
   A **partner** that is not in the tree or is masked (other than the agent's
   own tool target, which is never masked) is removed **from the fact itself** —
   its name, its ratio and its pointer — not only from the pointers, and a
   candidate left with no partner is dropped; a history fact whose only pointer
   is a not-in-tree or masked target is not emitted (*why:* a pointer the agent
   cannot open is unverifiable, and `in_tree` had no reader — review record
   2026-09-26, ER M2a; a partner is the fact's content, so dropping it only from
   the pointers still named, on its commit hash, a co-change the agent could not
   open, while dropping the whole candidate for one bad partner would silence
   its live, verifiable partners, which FR-D1 does not require — R-30 (b); B3b
   E-11); a whisper left with no verifiable pointer — no unmasked path and no
   commit hash — is dropped under the rumor rule; every drop under this rule is counted
   as `whisper_dropped_unverifiable` (AD-17) with its reason (`stale_pointer`,
   `not_in_tree`, `masked_path`); text is informative, never imperative (`FR-D2`); evidence
   ratios stated for history facts (`FR-D3`); ⚠ subtype declares fallibility and
   the `ctxoracle correct` path (`FR-D4`).

   | Genre | Trigger | Query / mechanism | Headline (the non-self-servable fact) |
   |---|---|---|---|
   | Orientation `FR-A2a` | `UserPromptSubmit` | prompt tokens → FTS5 over symbols/paths; rank by (match strength × co-change hub degree × `entry_score`, all produced — AD-12/AD-13); join `invariant_members` for one binding invariant **where a matching row exists** — in Phase A `invariants` is written only by the human channel (`note`), so on an un-annotated repo Orientation delivers entry points alone (disclosed, L10; invariant count shown in `status`) | 2–4 entry-point files (+ the binding invariant when one is recorded); **no task-shape landmines** (`D-26` — those fire at the edit) |
   | Coupling `FR-A2b` | `PostToolUse` Read/Grep/Glob | `cochange_pairs` partners of the touched file above bar | partner file(s) with **both** directional ratios — `pair_count / change_count(touched)` and `pair_count / change_count(partner)` ("17 of its last 20 changes; 17 of the partner's last 200") — + commit pointer, so the pair's one canonical key (AD-16) suppresses nothing the agent was not told (R-30 (a); B3b E-17) |
   | Reuse `FR-A2c` | `PostToolUse` Grep/Glob (a functionality search) | searched term → symbols FTS gives the **candidate set**; `symbol_refs` gives each candidate's referencing-file count; X is *canonical* when its count **dominates the runner-up** (≥ k×, tunable, stored) — **and only when every candidate in the set is evidence-comparable**: a candidate whose `symbol_refs` support is structurally absent (a language whose frontend declares `imports: false` — its count sits at 0 by construction, not by observation) marks the set incomparable and **no dominance crown is claimed** (silence — the safe direction, since dominance arithmetic alone cannot separate a structurally-uncountable true convention from a covered rival). **The discriminator is the candidate language's declared `imports` capability (AD-12), not its stored count and not ext→grammar table membership**: a candidate whose language declares `imports: false` (the generic frontend, or a grammar with no written imports query) is structurally uncounted → incomparable; so is a candidate whose language's repo-wide unresolved-import share exceeds `reuse.max_unresolved_import_share` (AD-12; its counts miss the imports that never resolved, e.g. `tsconfig` path aliases — review record 2026-09-26, CH H4); a symbol in an `imports: true` language whose count is 0 is *observed*-0 and stays comparable, so an unimported symbol is never over-silenced. (*Superseded 2026-09-26:* keying on table membership would read a tabled grammar with no imports query — 0 edges by construction — as observed zero and crown a rival, the failure this rule exists to prevent; review record 2026-09-25, G13) | The **comparative** convention fact: "of the N **symbols matching this search**, X is the one M files use; the runner-up has m" — the set is named for what it is (a lexical match set, restricted to same-kind symbols; FTS cannot certify functional substitutability, so the text never claims it), and the identifier-match heuristic's false-positive class (same-named symbols, matches in comments/strings) is stated in the whisper's evidence, as is the mixed-language caveat (`imports: false` languages have no `import_edges`, so dominance systematically favors `imports: true` candidates — L6). A bare reference count is one grep and never ships (P5); dominance over an un-enumerated alternative set is what the agent cannot cheaply self-serve. No dominant candidate → silence |
   | Consequence `FR-A2d` | `PreToolUse` Edit/Write | coupled **test files** of the target (pairs where partner ∈ `test_map`); zone flag of target | historically-coupled tests + zone flag; never a raw call-site count alone — worded as a fact about **the file this edit targets** ("`x.ts`, the file this edit targets, has historically changed with `x.test.ts` in 7 of its last 9 changes: …"), never "just edited" — the model reads it next to the tool result, on the next model request, whether the call ran, failed or was denied (V20; pending spec sign-off R-1…R-5) |
   | Warning ⚠ `FR-A2e` | `PreToolUse` Edit/Write | `landmines` rows for target (revert_chain, fix_chatter, human_stated) | the hazard with its evidence and **flagged confidence** (`FR-A5a`), worded as a fact about **the file this edit targets** ("⚠ `x.ts`, the file this edit targets, was reverted in 2 commits: …"), never "just edited", so the move it informs is the next one — revise, proceed, or retry (V20; L12; pending spec sign-off R-1…R-5) |
   | Completeness `FR-A2f` | `Stop` / `SubagentStop` | the session's edited files, all consumers; trigger set per the event (below) → un-edited partners above ratio floor | "you changed X but not Y, paired in 9 of its last 10 changes"; a trigger file edited only by a subagent is worded as changed "in this session by a subagent", never "you changed" |
   | Verification `FR-A2g` | `Stop` with done-claim | changed regions (from `outcome='ok'` rows — AD-4's split filter) → `test_map` covering tests, minus test runs observed in `observed_actions` **of either outcome** (a failed run *is* a run — AD-4; a run-and-failed covering test at a done-claim is `FR-A2m`'s Phase B case per `D-27`, and Phase A's duty is only never to assert "not run" over it). The `command_class` classifier is **ternary; classes 1 and 2 are config-enumerated (in `tuning`, AD-5 — tended via `ctxoracle tune`), class 3 is the default complement** (anything outside both lists — a partial classifier would leave everyday commands with no class and an unstated default, whose unsafe direction re-admits the false "not run"): (1) *recognized test runner* → mapped subtraction (unmappable target ⇒ subtract all); (2) *recognized-innocuous* (a conservative allowlist of command heads that cannot run tests: `ls`, `cd`, `cat`, `git status`-class, `grep`/`rg`, …) → no effect on run-state; (3) everything else → run-state unknown, and **the shipped branch is the weaker honest claim** ("no *recognized* test run touched T; recognized runners: …" — it keeps the genre alive and still headlines the mapping, satisfying AC-8's content assertion), never the strong "not run". **Classification is per pipeline segment**: the command line is split on `&&`, `;`, `\|`, `\|\|`, `&` and a newline — every bash list and pipeline separator (executed on GNU bash 5.2.21: a newline and `&` each start a new command; R-31, B2 E-5 (h)) — **quote-aware** (operators inside quotes are not split points; quoting the splitter cannot parse → class 3 wholesale; subshell / `sh -c` wrappers → class 3 wholesale; a heredoc → class 3 wholesale, because its body is input to a command, not a command the splitter can classify); recognized-innocuous requires **every** segment's head on the allowlist; **segments contribute independently** — each runner segment subtracts its run, and any unknown segment still sets run-state unknown (so a runner+unknown compound both subtracts and composes the weak claim); head-matching a compound (`cd pkg && npm test`) as innocuous would re-manufacture the false "not run" | the covering-test **mapping** for the changed region, with the honest run-state clause; run-state never stands alone (AC-8) |

   **Completeness: whose edits count (G-10 as corrected, settlements; R-32).**
   The **changed set** — a partner in it is never named as unchanged — is every
   `ok` Edit/Write/NotebookEdit path in `observed_actions` for the event's
   `session`, any consumer. The **trigger set** — the files whose partners are
   checked — is, at `Stop` (consumer `(session, 'main')`), every `ok` edit path of
   the session, any consumer, and at `SubagentStop` (consumer
   `(session, agent_id)`), that subagent's own `ok` edit paths. Other sessions
   never count (a different `session_id` is another conversation, B3a E-9's
   key). The reader gains `sessionOkEdits(): {path, consumer}[]`, read as
   `SELECT path, consumer FROM observed_actions WHERE session = ? AND outcome =
   'ok' AND path IS NOT NULL AND tool IN (EDIT_TOOLS) GROUP BY path, consumer
   ORDER BY min(seq)`, the same first-edit order the per-consumer reader keeps,
   because the headline order depends on it. Delivery stays per consumer
   (`FR-O6`). *Why:* read per consumer, the main agent's "but not Y" is false
   when a subagent of the same session did change Y — a checkably false
   statement about the tree, "the worst output for a provenance tool" (spec) —
   and a half-finished pair a subagent left is hidden from the main agent's
   done-claim, the case `OL-12` wants caught; read per session for both sets, a
   subagent is told "you changed X" about work it did not do. The main agent
   owns what it delegated, so its trigger set includes its subagents' edits; a
   subagent's hook output does not reach the parent (V18), which is why the
   main agent must be told itself.

   **Consequence and Warning: why `PreToolUse`, and why "the file this edit
   targets".** Both stay on `PreToolUse` Edit/Write, and both headlines name the
   target file, never an edit that happened. The model reads the text next to
   the tool result, on the next model request, whether the call ran, failed or
   was denied, and an `Edit` path deny rule (tested; a `Read` rule not tested —
   F-18) rejects the call before hooks
   run, so the oracle is not invoked for it at all (V20; CR§2, DE, PD). *Why
   (review record 2026-09-26, CH C3 / ER S1; CR§2):* "Permission denials fire
   `PreToolUse` but not [`PostToolUseFailure`]" (hooks reference, quoted in the
   collapse-hunt), and the text reaches the model beside a denial (DE case B,
   PD), so the earlier "`x.ts`, just edited, …" was checkably false whenever Max
   denied the permission prompt or the Edit failed — FR-D1's worst output. The
   target wording is true whether or not the edit ran. Once the edit has run,
   the agent's next decision is whether to keep it, revise it, or run the coupled
   tests, and the text arrives at that decision (CR§2's check against the
   mission); delivery before the edit would need a deny, the pre-emptive gate
   Max Cogar rejected (`OL-R4`), and delivery at read time is FR-A2e / D-26's
   job. `PreToolUse` is kept over `PostToolUse` because a denied or failed edit
   is usually retried, and the hazard is exactly as relevant to the retry;
   `PostToolUse` is success-only (V19) and would stay silent on it. The spec's
   FR-A2d ("an edit / write about to run"), §5.1 ("the edit it is about to run")
   and AC-1c ("on an edit about to run") state a timing the harness does not
   give; their rewording to "delivered with the edit's result", with FR-O2's
   unsourced "preserved even if the tool call later fails" dropped, is **pending
   spec sign-off R-1…R-5**; the trigger and the genres do not change. *(Corrected
   2026-09-28: this rested on "FR-O2 keeps a `PreToolUse` text even if the tool
   call fails", which no page of the hooks reference says, and claimed the
   trigger left FR-A2d/FR-A2e unchanged with "no spec change", which R-3 makes
   false — R-8; B3a E-1, E-2, B3b E-1, CR§2, PD.)*

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

   **The labels.** *Revert-labelled* = a commit git itself generated as a revert:
   the body trailer `This reverts commit <hash>.` with a 40- or 64-hex object
   name (SHA-1 or SHA-256 repositories — Step 13 build review M1), git-revert(1)'s default
   message, with the subject prefixes `Revert "` / `Reapply "` as the fallback
   for a message without the trailer (executed 2026-09-26 on git 2.43.0:
   `git revert --no-edit HEAD` wrote subject `Revert "both"` and body
   `This reverts commit <hash>.`; git-revert(1) documents the `Reapply "…"`
   subject for reverting a revert). git's **reference format** is a revert line
   too: a body line matching `^This reverts commit [0-9a-f]{4,64} \(.+\)\.$`
   (multi-line match), which `git revert --reference` writes — and
   `revert.reference` makes the default — with an abbreviated hash and a subject
   line the author is told to replace (executed in B7a E-17 on git 2.43.0:
   subject `# *** SAY WHY WE ARE REVERTING ON THE TITLE LINE ***`, body
   `This reverts commit f936044 (change a, 2024-01-01).`, which the built
   predicate did not label; R-25 (a)). The trailer rule is execution-backed:
   git-revert(1) documents only the `Reapply` subject, not the body line. *Fix-labelled* = a subject containing a
   member of the `lexicon.fix_keywords` tuning list (AD-5; seeded `fix, fixes,
   fixed, fixing, bug, bugfix, hotfix`, shown in `status` with every other seed)
   as a **whole token, case-insensitively**: the subject is split on
   non-alphanumeric characters and a token must equal a lexicon member, so
   `Fix: …` and `bug-fix` match and `fixture`, `prefix`, `suffix` do not. The
   seven words are **an architect's tunable seed**, calibrated by the human
   channel on Phase A data; SZZ (Śliwerski, Zimmermann, Zeller, MSR 2005) is
   credited for the **method** only — matching keywords as words — not for the
   vocabulary, since its regex is `fix(e[ds])?|bugs?|defects?|patch`, which does
   not produce this seed (B3b E-14). Neither vocabulary has been measured on
   the owner's repositories, so the seed is kept, marked unsourced, and Phase
   A's correction data decide it (R-25 (b)). The miner
   reads the subject and the revert trailer only and never stores message text.
   The evidence stays commit hashes (AD-19 pointer-only). **Revert detection**
   runs over every commit of the target set (AD-13) **before** the transaction-size
   exclusion: that filter exists to keep refactor sweeps out of *pair* counts
   (AD-13), and a revert of a large commit is still a revert, git-generated
   rather than tangled evidence. **Fix-keyword detection** runs only on
   *included* commits, after the exclusion. *Why (review record 2026-09-26, CH
   C1 / ER M10):* the "still a revert" reason covers reverts only; HERZIG, which
   FR-K2 and FR-D3 cite, is the evidence that tangled commits inject noise
   ("such tangled changes will make all changes to all modules appear related,
   possibly compromising the resulting analyses through noise and bias") and
   that large commits are mostly perfective, so a 200-file "fix lint" sweep
   would have labelled 200 files as fix-chatter and inflated Warning false fires
   in the exit data; and substring matching labelled "fixture", "prefix", and
   "suffix". *(Corrected 2026-09-28: the HERZIG reason said "large and tangled
   commits inject noise", attributing to size what the paper says of tangling —
   R-25 (c); B3b E-14, E-25.)*

   **Derivation.** Labelled commits are written to `labelled_touches` (AD-4) in
   the same chunk transaction as the commit's other rows (AD-26). At the end of
   every pass, in one short final transaction, the miner-kind landmine rows are
   deleted and rebuilt from it:
   `revert_chain` over the horizon, `fix_chatter` over the trailing window
   measured from the reference instant — `HEAD`'s committer time, so a
   fixture and a real repository are judged the same way on any day — so
   aged-out rows disappear. The key is
   `(kind, file_id)`, and support is the count. *Why:* both classes are
   functions of history, not of a pass. Keying rows on a pass-specific evidence
   string produced one row per pass, and the Warning genre spoke once per row
   (executed: two `fix_chatter` rows, support 4 and 3, for one file). A row also
   kept citing a commit that history rewriting had removed (review record
   2026-09-25, G1/G5/N5).
2. **Standard.** `FR-A2a`–`FR-A2g` and `FR-D1`–`FR-D5` governing; P5 (marginal
   value) is each generator's stated guarantee column.
3. **Why here.** Genre-per-module keeps each generator's marginal-value claim
   testable in isolation (AC-1 through AC-1d each pin one genre's headline).
4. **What this is NOT.** Not a shared "interesting facts" scorer that genres
   filter (blurs each genre's P5 guarantee; the per-genre headline is the
   requirement). Not narration-triggered genres (`FR-A2h`–`FR-A2j` are Phase B).
   Not landmine mining via ML or commit-message sentiment — the deterministic
   classes are checkable and carry their evidence; anything subtler is Phase B/C
   territory. The revert trailer and the fix-keyword class are lexical
   classification of the subject line and a git-generated trailer. That is not
   sentiment analysis. Not a Warning or Consequence worded as advice *before* the
   edit: the model cannot read it before the edit runs (V20). Not one worded as
   an edit that happened ("just edited"): the call it is read beside may have
   been denied or failed. Not moved to `PostToolUse`: that is silent on the
   retry of a denied or failed edit (above).
5. **Premise verification.** V1 (`last_assistant_message` Stop-only), V19
   (tool events carry `tool_name`/`tool_input`; the success/failure event
   split that `observed_actions.outcome` rests on), V20 (a `PreToolUse` whisper
   is read next to the tool result, whether the call ran, failed or was denied,
   fetched 2026-09-26 and 2026-09-28; the denial cases tested in DE and PD on
   Claude Code 2.1.283); hooks reference line 2103
   ("Permission denials fire `PreToolUse` but not this event") as fetched and
   quoted in `docs/reviews/2026-09-26-architecture-pass-collapse-hunt.md` (C3);
   the label, derivation, and
   discriminator decisions from the review record
   `docs/reviews/2026-09-25-skeleton-gap-list-review.md` (G1, G5, G13, and the
   `PreToolUse` item), revised by the 2026-09-26 review records (CH C1, C3, H4;
   ER S1, M2, M10); the 2026-09-28 corrections — the reference-format revert
   line, the seed's status and HERZIG's wording, the partner-level drop and the
   two ratios, the bash separators (executed on GNU bash 5.2.21 in B2 E-5 (h)),
   the Completeness sets, and the hooks timing — from the register (R-8,
   R-25, R-30–R-32) and G-10 as corrected; `FR-A2a`–`FR-A2g`, `D-26`,
   `D-38` read at spec §4/§12. Addresses: those plus AC-1, AC-1a–AC-1d, AC-8.

### AD-16 — Delivery, dedup, session-boundary reconciliation, Stop-time injection

1. **Decision.** Delivery is per consumer (`FR-O6`): a whisper computed for a
   consumer's event returns on that event's response and nowhere else.
   **Dedup (`FR-A4`, `FR-D5`):** `consumer_state` holds a `delivered` set
   (subject keys of whispers sent) and a `read` set (files/symbols the consumer
   has visibly touched, from `observed_actions` — `outcome='ok'` rows only,
   per AD-4's consumer filter: a failed Read is not a read, and leaking
   failure rows into the read set would silently withhold facts about files
   the agent never saw). The consumer is AD-4's `(session_id, agent_id |
   'main')` key: a whisper one session (or one subagent) received never
   silences it for another.
   **Incorporation is defined per fact (`FR-D5` "visibly incorporated").** Each
   candidate carries its subject key and the list of read-set keys
   (`incorporatedBy`) that would make it self-served. An Orientation entry-point
   pointer to file X → `path:X`. A Reuse dominance claim → none, since the agent
   cannot self-serve the comparison. Every history-derived fact (Coupling,
   Consequence, Warning, Completeness) → none. Reading file B does not reveal
   that A and B co-change: the fact is invisible from a cold checkout (AD-14's
   marginal-value classes). A candidate is withheld when its subject key is in
   the `delivered` set, or when one of its `incorporatedBy` keys is in the `read`
   set — the never-repeat property, never a cap. *Why:* the read set held
   `path:<file>` keys while candidates carried `coupling:<target>:<partner>`, so
   the two never matched. The obvious repair, letting a read of the partner
   suppress the coupling fact, would withhold a fact reading cannot reveal
   (review record 2026-09-25, G25).
   **Subject keys of history facts.** A Coupling key is canonical over the
   pair: `coupling:<min file_id>:<max file_id>`, the same order
   `cochange_pairs` stores, so a Read of A that delivers the A–B fact and a later
   Read of B produce one key and B's Read does not repeat it. A Completeness key
   stays directional, `completeness:<edited file_id>:<missing file_id>`, because
   that fact is about which file is missing from this change set, and "you
   changed A but not B" and "you changed B but not A" are different facts.
   *Why (review record 2026-09-26, CH H3; R-30 (a), B3b E-17):* the two
   directions share the pair and the commit pointer but **not** the ratio — read
   from A the agent learns "B is in 17 of A's last 20 changes", read from B "A is
   in 17 of B's last 200", a different conditional, which ROSE defines per
   antecedent ("the relative amount of the given consequences across all
   alternatives for a given antecedent") — so the one Coupling whisper renders
   **both** ratios (AD-15), and the canonical key then suppresses nothing the
   agent was not told; FR-A4 says never repeat, and nobody had decided the
   direction. *(Corrected 2026-09-28: the reason said the two directions were
   "the same co-change claim (only the confidence denominator differs)".)*
   Pinned by the `coupling-key-symmetry` fixture (AD-24).
   **Session boundaries (`D-20`), keyed by `SessionStart.source` (V5), exactly
   as `FR-A4` states them, acting only on the event's own consumer's sets**
   (never another session's; by code reading, the role-keyed form let one
   session's `startup` clear every live session's sets — review record
   2026-09-25, G23, a code-read item, not an executed one — R-39; B3a E-9):
   `startup`/`clear` → both sets cleaned; `resume`/
   `fork` → both sets reseeded (kept); `compact` → the `read` set is cleared
   (the agent's context lost what it had read) and the `delivered` set is kept.
   **The fork reseed source is the forked transcript.** A `fork` is a new
   `session_id` whose `SessionStart` input names no parent (V22), so there are
   no parent rows to copy. The `delivered` set is rebuilt from the
   oracle-injected text the transcript carries, since Claude Code saves injected
   text in the transcript (V22): each oracle-injected block in the forked
   transcript — every entry, whatever its `sessionId` field, since which id the
   copied pre-fork entries carry is not observed (V22; G-11, settlements) — is
   matched by **exact text** against `whisper_audit.text` in this
   project store (the audit row exists before emit, AD-8), and the matched row's
   `subject_key` (AD-4) is admitted. Unmatched text is skipped. The safe
   direction is under-seeding: a fact may repeat, none is withheld. A fork or
   resume rebuild over a transcript that carries oracle text but recovers zero
   keys writes `rebuild_recovered_nothing` with `detail_json.set = "delivered"`
   (AD-9's code, extended; AD-17). *Why (review record 2026-09-26, CH H2 / ER
   M8):* rendered text had no mapping back to a subject key, and a silent
   recovery failure would inflate the exit run's delivery counts with repeats. The `read` set is rebuilt from the transcript's
   Read/Grep/Glob and Edit/Write tool results through AD-11's reader, admitting
   only results the reader can classify as successful (the `'ok'` classes AD-4's
   filter admits). A tool result is successful unless it carries
   `is_error: true` (V23: successful Read, Edit, and Write results carry no
   `is_error` field at all, and the one failed Read observed carried `true`, so
   requiring `is_error: false` admitted nothing and the reseeded read set was
   always empty — plan-pass collapse-hunt, D-plan-39 collapse). If the layout
   changes, AD-11's `transcript_layout_changed` fires. A result whose outcome
   the reader cannot establish at all is not admitted: an unpaired `tool_use`
   (no `tool_result` follows it) and a `tool_result` whose `tool_use_id` matches
   no `tool_use`. That under-seeds
   the `read` set, and a fork or resume rebuild that finds file-tool results
   and admits none writes `rebuild_recovered_nothing` with
   `detail_json.set = "read"`, so an empty reseed is reported, not silent (R-33;
   B4 verification item 3, B5 verification item 8, B5a E-17: the fault covered
   only the delivered set). The cost is that the oracle may speak a fact the agent had
   already read for itself. It never withholds a fact about a file the agent did
   not read. Questions
   are rebuilt by AD-9's offset-0 classification. A `resume` whose `session_id` has no rows is reseeded the
   same way.
   **Stop-time (`FR-B4`):** Completeness/Verification whispers are delivered at
   `Stop`/`SubagentStop` via `hookSpecificOutput.additionalContext` — once:
   when `stop_hook_active` is true the handler emits nothing on that channel
   (V3), making the single-cycle bound structural. The deny path is never
   wired to Stop events (AD-10's caller set).
   **The response cap and the order of whispers (F-22; settlement (a)).** The
   harness caps what one response can deliver: "A hook's additionalContext,
   systemMessage, and initialUserMessage strings, and its plain stdout, are
   capped at 10,000 characters"; over the cap it "saves the output to a file in
   the session directory and replaces it with the file path and a preview of up
   to the first 2,000 characters", and it "doesn't ask Claude to read the file,
   so keep anything Claude must always see within the cap" (hooks reference,
   `code.claude.com/docs/en/hooks.md`, fetched 2026-09-28). A whisper beyond the
   cap would reach the model only as a file it is not asked to open, so the
   composer's rule is: **the response's one `additionalContext` string is built
   from whole whispers — never a cut whisper, since a cut pointer or ratio is
   FR-D1's unverifiable claim — in rank order, highest first, and is kept within
   10,000 characters**. The rank is the bar's own axes, with no
   genre term (P9; `D-18`): decision-impact `i` descending, then confidence `c`
   descending (a hazard's stated confidence, AD-14), then the generator's own
   order (Orientation's entry-point rank, Completeness's first-edit order,
   AD-15), then subject key. At `Stop` the outstanding-question line
   (`FR-B4`, AC-8a) is placed before every whisper: it is not a bar candidate,
   and it is the delivery of the owner-confirmed block's backstop (`OL-C3`).
   The rank orders the response; it never decides whether a whisper speaks
   (the bar does, AD-14; `OL-C1`). When the cleared whispers fit, which is
   every case the rule can decide alone, the response is all of them in that
   order. **When the whispers that clear the bar at
   one event do not all fit, withholding is pending owner decision (`OL-C1`):**
   meeting the cap then needs some cleared whisper not to be delivered in that
   response, which is a limit influencing whether the oracle speaks, and
   `OL-C1` ("at no point should an arbitrary limit influence how that
   operates") makes that Max Cogar's call, not this document's. No volume term
   exists to keep a response under the cap (AD-14), and no measurement of
   response length exists yet. Whatever that decision, every response records its
   composed length in `session_log.detail_json`, and a response whose cleared
   whispers do not all fit records `response_over_cap`
   (`{event, whispers, chars}`, AD-17), so the exit data show how often the case
   arises. *(Added 2026-09-28, F-22: no decision said how a response that could
   exceed the cap is kept within it; the review found the cap while settling
   (a), and neither this document nor the spec named it.)*
2. **Standard.** `FR-A4`, `FR-D5`, `FR-O6`, `FR-B4`, `D-20` governing; V3/V5 are
   the verified channel facts.
3. **Why here.** Dedup state is exactly the state that must survive process
   boundaries (AD-1), and the reconciliation table is the difference between
   "never repeat" and "never speak again" across a compaction.
4. **What this is NOT.** Not a session-wide shared dedup set (starves subagents
   of facts the main agent heard — `FR-O6`'s per-consumer property). Not a
   response cut at 10,000 characters mid-whisper, and not a top-k (the rank
   orders, the bar decides — `OL-C1`). Not
   `decision:"block"` at Stop for delivery (surfaced as an error — V3; the
   spec chose `additionalContext`, `FR-B4`). Not re-delivery suppression by
   time window (a cap in disguise; the bar and the sets are the only filters).
5. **Premise verification.** V3, V5, V22 (no parent session in `SessionStart`
   input; injected text saved in the transcript — the documented field list,
   fetched 2026-09-26, not an observed fork payload); the consumer-key,
   incorporation, and fork decisions from the review record
   `docs/reviews/2026-09-25-skeleton-gap-list-review.md` (G23/G29's
   cross-session deny and cross-session/cross-subagent silencing executed on
   the real binary; its byte-offset and `startup`-clearing items reasoned from
   code, R-39; G25); the unestablishable read-set cases and the `"read"` report
   from the register (R-33) and B5a E-17; the sessionId-blind fork read from
   G-11 as corrected; the two-ratio reason from B3b E-17 (ROSE quoted there);
   the subject-key direction and the delivered-set
   recovery from `docs/reviews/2026-09-26-architecture-pass-collapse-hunt.md`
   (H2, H3) and `docs/reviews/2026-09-26-architecture-pass-expert-review.md`
   (M8); the 10,000-character cap read in the hooks reference, fetched
   2026-09-28 (F-22), with the canonical Coupling key verified at build by the
   `coupling-key-symmetry` fixture (AD-24: Read of A, then Read of B, delivers
   the A–B Coupling fact once, with both ratios); `FR-A4`, `FR-B4`, `D-20` read at spec
   §5.1/§8/§12. Addresses: `FR-A4`, `FR-D5`, `FR-O6`, `FR-B4`, AC-4, AC-5,
   AC-8, AC-15.

### AD-17 — Self-observability: the diagnostic spine

1. **Decision.** Three surfaces, one source of truth:
   - **`session_log` + `whisper_audit` (store):** per event: candidates
     considered, bar outcomes, delivered/withheld reasons, denies, latency
     (`FR-M1`, `FR-X6`).
   - **Two JSONL channels.** The per-project channel
     (`projects/<repo-key>/diagnostics/`) takes faults once the repository is
     known. The **home-level channel** (`<home>/diagnostics/`, created 0700 as
     part of the home layout, AD-3) takes every fault raised before the
     repository is known (unparseable stdin is the executed case), and is the
     only thing the handler may write after a binding miss (AD-23): the
     `repo_not_bound` fault, once per `session_id`. The once-per-session bound is
     kept by a home-level marker file keyed by `session_id`, and **the marker's
     lifetime is its session's**: the same session's `SessionEnd` event, which
     misses the binding the same way and may write only to the home-level
     channel, deletes it, so the markers do not accumulate one per unbound
     session for the life of the install. What it costs: a session that ends
     without delivering `SessionEnd` leaves its marker behind, and a resumed
     session whose marker was deleted writes the fault once more (R-12 (a); B3b
     E-5: no rule said the markers were ever removed). `status` reads both
     channels, and lists home-level faults wherever it is run. *Why:* executed in the
     review of 2026-09-25 (G35), `{not json` on stdin left zero faults
     anywhere. The fallback appended into a directory that did not exist, and the
     handler swallowed the error, so a whole failure class was invisible —
     exactly what `OL-10` forbids ("it could fail a hundred ways in front of me
     and I wouldn't know").
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
     — with the fault appended to the JSONL channel and `status` flagging it;
     a busy lock is not corruption: a `StoreBusy` from a write group is recorded
     as `store_busy`, below, never as `store_corrupt`),
     `index_stale` (`index_head` ≠ `HEAD`), `produced_but_undelivered` (audit
     row exists, emission failed), `deny_after_answer_lag`,
     `deny_despite_answer_text`, `deny_loop`, `deny_bypass_suspect`,
     `catchup_incomplete`, `intake_invalidated`, `rebuild_recovered_nothing`
     (all AD-9; its `detail_json.set` is `questions` for AD-9's rebuild, and
     `delivered` and `read` for AD-16's delivered-set and read-set reseeds),
     `transcript_layout_changed` and
     `unrecognized_user_entry` (AD-11), `repo_not_bound` (a wired hook fired at
     a root with no `init`-recorded binding; home-level channel, once per
     `session_id` — AD-23), `whisper_dropped_unverifiable` (a candidate dropped
     under the rumor rule — `stale_pointer`, `not_in_tree`, or `masked_path`,
     AD-15/AD-19; a count, not a failure, surfaced so masked or deleted pointers
     silencing a genre are visible), `import_rejected` (an export failed
     `quick_check` or another of import's checks before touching a live store,
     or the process survived a failure between its two live writes,
     `check: 'partial_write'` — AD-5), `store_busy` (a write transaction that
     still raised `StoreBusy` after its retry: `{writer: 'handler'|'miner'|
     'indexer', phase}` with the event kind for the handler — AD-26),
     `history_rewritten` and `branch_changed` (a same-ref rewrite or a ref
     change, each `{…, evicted, added}`, recorded by the reconciling pass —
     AD-13), `git_failed` (any git subprocess failure on an off-path pass,
     `{writer, subcommand, status, signal, stderrTail}` — AD-13),
     `miner_ref_ts_invalid` (a `refTs` the miner refused — AD-13),
     `write_hold_exceeded` (at most one per pass: the longest write-lock hold
     over 150 ms and the count of such holds — AD-26), `reindex_locked` (a
     reindex refused while another holds the lock, with the holder's pid and
     start time — AD-26), `tuning_invalid` (an invalid stored tuning row,
     recorded once per distinct `(key, value)`, with the value in full; the
     whole event is silent — AD-14), `handler_exception` (any other error the
     handler's top-level catch receives, `{name, message}` — AD-14),
     `store_schema_refused` and `store_migration_pending` (the schema check's
     refusal, and a pending store on the hook path — AD-4), `store_migrated`
     (a record, not a failure: a migration applied — AD-4), `miner_ts_capped`
     (commits whose author time the pass capped at `refTs`, `{count, firstHash}`
     — AD-13), `miner_stream_incomplete` (a pass that did not mine every commit
     it fed, so the watermark stayed — AD-13), `head_unresolved` (a `HEAD` that
     resolves through neither a loose ref nor `packed-refs`, recorded on the
     transition — AD-23), `response_over_cap` (a response whose cleared whispers
     do not all fit the harness's 10,000-character cap — AD-16) (F-8, F-19, F-22),
     and two reserved codes whose detectors
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
     layout changed, FTS fallback, an active `tuning_invalid` — every event
     silent until it is fixed, with the fixing command, AD-14 — a refused store
     schema, a pending migration or data step with the command that finishes
     it (AD-4, F-3), and `mining_in_progress` — whose
     suppressed events are counted), and correct-silence announcements (`FR-M3`:
     "observed N events, spoke at M — the silence was the bar working", rendered
     **only** here, never into the agent's context, `D-22`), from which the
     events suppressed under `mining_in_progress` are excluded, since that
     silence was the flag, not the bar (R-36 (f); B3b E-7). `status` also shows
     each pass's longest write-lock hold (AD-26), the reindex lock's state
     (AD-26), the per-language capabilities, exclusions and `test_map` capability
     (AD-12), the miner's rename counts (AD-13), and the history horizon in
     force (`N` commits / `Y` years, AD-13; F-14).
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
   `OL-10` in the ledger; the lost pre-repository fault executed in the review
   record `docs/reviews/2026-09-25-skeleton-gap-list-review.md` (G35); the
   `repo_not_bound`, `whisper_dropped_unverifiable`, `import_rejected` codes and
   the widened `rebuild_recovered_nothing` from the 2026-09-26 review records
   (CH H2, H6, H7; ER M8, M11, M12, M14); the 2026-09-28 additions — the marker
   lifetime (R-12 (a)), the `read` set (R-33), `mining_in_progress` in `status`
   (R-36 (f)), and the codes that come with AD-4, AD-13, AD-14 and AD-26's
   corrections (C-4, G-2, G-5, G-6, G-7, G-8 and Flaw 1 as corrected, and C-2
   and Flaw 3 for the two reconcile outcomes); the codes F-8 found unnamed or
   dropped, `head_unresolved` (F-19; RC-27), `response_over_cap` (F-22), the
   pending-store condition (F-3) and the horizon (F-14) from the correction
   review.
   Addresses: `FR-M1`–`FR-M5`, `FR-X6`, AC-9.

### AD-18 — The Phase A regret proxy and the human channel

1. **Decision.** **Human channel (`FR-L6`, `FR-D4`):** `ctxoracle correct`
   records a verdict against a whisper or deny id (`false_fire` / `missed` /
   `confirm`) with an optional note. A `missed` verdict against a whisper id is
   attributed to that whisper's genre. A `missed` report with no whisper takes an
   optional `--genre <genre>` (`ctxoracle correct missed --genre coupling`),
   which names the genre that should have spoken; without it, and without
   `--missed-question`, the fold books it as `unattributed`, never as
   answer-drift (AD-5). *Why (review record 2026-09-26, CH C4):* the fold
   attributed a whisper-less miss to "the genre its verb names", but no verb
   names a genre, so every missed Coupling or Warning Max reported would have
   been booked as an answer-drift miss and corrupted the per-genre efficacy
   data. `ctxoracle note "<fact>" [--file <path>]`
   records a human-stated fact (landmine/invariant/target correction) with
   human provenance — immediately outranking conflicting mined inference at
   query time (the DAO resolves conflicts human-first, AC-23). A `missed`
   verdict on answer-drift may carry the dropped question's text
   (`ctxoracle correct --missed-question "<q>"`); the text is routed **through
   the same question recognizer as every other opener** (minus the `?`
   requirement — Max may paraphrase), so it opens a question row in one
   session's main consumer, and the identical deviation is thereafter denied in
   that session. **Which session:** the one named by `--session`; without it,
   the CLI reads the open sessions (those with no recorded `SessionEnd`) —
   exactly one → it arms that one; several → it arms none, lists them in plain
   language (each one's last activity time and working directory, never a bare
   id) and asks for `--session`; none → it arms nothing and says so. The CLI
   always prints the session it armed. *(Corrected 2026-09-28: it armed "the
   session with the most recent event", which picks one of several live
   sessions by timing the owner cannot see — R-13; B4 p2 E-19, B5 verification
   item 7, B5a E-24.)* *(Plan-pass collapse-hunt H5: the newest liveness row is
   the most recently started session, which may have ended.)* *(Why,
   2026-09-26: the consumer key is per session (AD-4), so "thereafter denied"
   needs a session; arming every session is the executed G23 defect, and a
   non-programmer owner does not know session ids. Plan D-plan-37.)* On a hash collision with an
   already-`open` row the CLI says, in plain language, which limit the reported
   miss actually hit — intake coverage: the row already exists and is armed,
   nothing to change; move coverage: a Bash-drift miss stays un-deniable per
   L3 — instead of implying enforcement changed. The
   human channel outranks the recognizer without bypassing the deny mechanism
   (`FR-L6`, `FR-B5`'s under-fire guard for this block, AC-2c's answer-drift
   under-fire clause). Routing per `FR-L7` (AD-5). **Regret proxy (`FR-L4`, Phase A form):** at `SessionEnd`
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
   spec §11.3/§12; the `--genre` attribution from
   `docs/reviews/2026-09-26-architecture-pass-collapse-hunt.md` (C4); the
   single-open-session arming rule from the register (R-13; B4 p2 E-19, adopted
   by B4 p3's adjudication and B5). Addresses:
   those, AC-2c (answer-drift under-fire), AC-23, AC-24.

### AD-19 — Security controls (mapped to the threat model below)

1. **Decision.**
   - **Redaction at every ingress (`FR-X1`, T3):** one `security/redact.ts`
     applied to any string entering a store, log, whisper, or diagnostic:
     pattern rules for known secret shapes (keys, tokens, PEM blocks,
     `KEY=value` credential forms) plus a high-entropy-token heuristic;
     redactions are replacements with a stable marker, counted in diagnostics.
     **An identifier is not free text:** a symbol name any frontend (tree-sitter
     or generic) records as a declaration name gets the pattern rules only, never
     the entropy heuristic, and the indexer applies the rule for both frontends,
     with the tuned `security.entropy_*` values wherever the entropy heuristic
     runs. *(Corrected 2026-09-28: the rule named only a name "the parser
     captured", and the generic frontend's `T11_DiscoveryWorkflowTests` was still
     redacted — R-21; B9 verification item 5, B9 E-39.)* *Why (Step 15 build review
     M4, 2026-09-26, executed on this repository):* the entropy rule stripped
     70 real declaration names (61 of 789 C# symbols, e.g.
     `T11_DiscoveryWorkflowTests`), silencing facts about real code; a
     high-entropy identifier is a code name, while a secret still matches the
     pattern rules or appears in a string or comment, where the full rule set
     applies. The residual risk — a secret used as a declaration name — is
     added to L5.
   - **Pointer-only composition (`FR-X2`/`FR-X3`, T1):** Phase A whispers carry
     **no verbatim repo-derived text at all** — pointers (`path:line-span`,
     commit hashes), numbers, and names only. This is stricter than the spec's
     minimum (verbatim allowed for mechanically-generated content) and is chosen
     because Phase A has no model in the loop to need quoted context; the
     relaxation, if ever needed, is a Phase B decision. The injection-suspect
     flagger (heuristic lexicon over ingested spans) sets `injection_suspect`;
     suspect content is pointer-only *and* its facts carry `untrusted_repo`
     trust (dampened) plus `bar.suspect_confidence_cap`, so they are always
     flagged uncertain (`FR-X4`, T2; the dampener and caps are AD-14's).
     **Filenames are repo-derived text.** A path is a name the repository's
     author chose, so every path is run through the injection flagger when its
     `files` row is created, by either writer — the indexer's walk or the
     miner's history-only rows (AD-4). A whisper renders a flagged path as
     `path#<file_id>` and never as the name itself, **except the agent's own tool
     target**, which is never masked: its name is already in the agent's context,
     so masking it protects nothing. A masked path is not a verifiable pointer
     (the agent cannot resolve a `file_id`), so a whisper left with no
     verifiable pointer after masking is dropped and counted (AD-15's rumor rule,
     `whisper_dropped_unverifiable`). *Why:* pointer-only composition leaves names as the one
     repo-authored text a whisper carries, and a pointer is useless if the name
     inside it can carry an instruction (review record 2026-09-25, G24; OWASP
     LLM01, prompt injection via data). *Why the exceptions (review record
     2026-09-26, CH H7 / ER M14, ER M2b):* FR-D1 requires a verifiable pointer
     and `path#<file_id>` is not one; masking the agent's own target hid nothing;
     and miner-created rows were never walked by the indexer, so their names
     escaped the flagger yet could be rendered.
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
   to the agent that already has it — no new injection surface). The filename
   rule is from the review record
   `docs/reviews/2026-09-25-skeleton-gap-list-review.md` (G24), revised by
   `docs/reviews/2026-09-26-architecture-pass-collapse-hunt.md` (H7) and
   `docs/reviews/2026-09-26-architecture-pass-expert-review.md` (M2, M14). Addresses:
   `FR-X1`–`FR-X8`, T1–T4, AC-11.

### AD-20 — CLI surface and `init`/`deinit`

1. **Decision.** Verbs: `init` (environment checks: Node ≥ 22.16, git presence,
   FTS5 probe; store creation; repo-key derivation with mode display — and when
   re-running `init` would **change** an existing store's keying mode (e.g.
   after the owner unshallowed a clone outside the tool), it says so in plain
   language and offers the `export`/`import` migration before switching, so
   following the documented unshallow path never silently orphans the
   accumulated store; **records the path→key binding** — `global_meta` key
   `repo_path:<realpath of the repository root>` → repo key (run inside a git
   worktree, the root recorded is the main repository's, the same root AD-23's
   lookup resolves a worktree to) — which is the only
   way the handler finds the store (AD-23), shown in `status`, and re-recorded
   by re-running `init` after a checkout moves; hook wiring into `.claude/settings.json` with a
   `"ctxoracle"` marker on each entry; first index; plain-language summary),
   `deinit` (remove marked entries; `--purge` deletes the project store and
   its `whisper_stats` replica rows (AD-5), refuses while the store holds
   human-provenance rows that were not exported unless `--discard-human` is
   passed, saying how many rows would be lost, and deletes the project directory
   only while holding the reindex lock — refused with the holder named when a
   pass holds it, AD-26), `export-human <file>` / `import-human <file>` (every
   human-provenance row, read by column name, out to a JSON file and back after
   `init` — AD-4's recovery path; store-recovery),
   `index [--full]`, `status` and `log [--session <id>]` (each also in a key- or
   home-addressed read form for a store with no live binding, AD-5), `correct`, `note`
   (`--global` writes a cross-project lesson to the global store; plain `note`
   routes to the project store per `FR-L7`), **`tune <key> <value>`** (the
   plain-language writer for every tunable this document marks: **numbers**
   (`tune <key> <n>`) and **list-valued keys** — the command-classification and
   completion-claim lexicons, the rhetorical/idiom stoplist (`lexicon.stoplist`),
   and the deferral stoplist — edited with add/remove element semantics
   (`tune lexicon.stoplist +"why is ci always so flaky"`), the surface the owner
   uses to shrink the coverage losses L1 and L3 name and the over-enforcement
   stoplist misses the deny residual names; every tunable this document marks
   has a writer here. `tune` with no arguments lists the keys, their current values
   (list keys show their members), and their defaults. `tune` refuses, in plain
   language and changing nothing, a write that breaks AD-14's ordering —
   `bar.confidence_floor` ≤ `bar.suspect_confidence_cap` and
   `bar.heuristic_confidence_cap` < `bar.high_confidence_min` — or its tier
   invariant, AD-13's half-life relation (`bar.recency_half_life_days ≥ 365.25 ×
   miner.horizon_years / 1022`, checked on a write to either key), AD-14's
   structural relation, sets `bar.untrusted_trust_factor` or
   `bar.stale_factor` outside (0, 1], or sets `miner.chunk_gap_ms` below its
   25 ms floor (AD-26; settlement (c)) — the same validator the tuning reader runs
   over the stored set (AD-14), so a value `tune` accepts is one the reader
   serves; *why (review record
   2026-09-26, ER M9):* the ordering is an invariant, and an invariant needs an
   enforcement point, or `tune` silently breaks the tier), `export <file>`
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
   2026-08-29); the `tune` ordering check from
   `docs/reviews/2026-09-26-architecture-pass-expert-review.md` (M9); the
   2026-09-28 verbs and refusals from the register (R-24, R-34, R-35), CR§1,
   store-recovery, and G-2, G-3 and G-6 as corrected. Addresses:
   spec §10, `D-9`, AC-7.

### AD-21 — Degraded mode, recursion guard, and the piggyback seam (Phase A posture)

1. **Decision.** Phase A contains **no model call**; every Phase A behaviour is
   the degraded mode's behaviour, so `FR-J2`/`FR-J3` are satisfied by
   construction and AC-12's Phase A assertions (deterministic genres and deny
   plumbing run model-free; nothing model-free is switched off) are the system's
   only mode. The **piggyback seam** is fixed now for Phase B: a single
   `model/invoke.ts` interface whose implementing command is the V9-verified
   invocation (`claude -p --model <small> --tools "" --max-turns 1
   --output-format json`), run with `CTXORACLE_INTERNAL=1` in env, cwd outside
   the repo, and a scrubbed environment — the session-identity variables that
   make a `claude -p` child attach to the parent's session (`CLAUDECODE`,
   `CLAUDE_CODE_SESSION_ID`, `CLAUDE_CODE_REMOTE_SESSION_ID`,
   `CLAUDE_CODE_CHILD_SESSION`, `CLAUDE_PID`, `CLAUDE_CODE_ENTRYPOINT`,
   executed 2026-09-07, plan §11.4) removed, not every `CLAUDE_*` variable,
   since host auth must survive; the list is the 2026-09-07 observation on one
   Claude Code version and is a **first-line scrub, never the guarantee**. The
   Phase B seam **verifies non-attachment on every invocation**: the returned
   `session_id` must differ from the parent session's, and on a match the seam
   enters the visible degraded mode (`FR-J2`/`FR-J3`) instead of using the
   result. *(Corrected 2026-09-28: this said Phase B re-derives the list by
   execution against the version it ships on — a one-time check that a later
   Claude Code version can invalidate silently, while the 2026-09-26 container
   already exported five further session-related variables whose effect on a
   child session was not executed (plan-pass collapse-hunt H15) — R-9; B5
   verification item 6, B5a E-25.)* `--bare` is banned (V10 — it severs
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
   (shipping either now would be the dormant machinery AD-4's criterion bars).
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
   one retry, AD-26 — a bound that holds only while every writer's lock hold is
   short and the lock is released between them, so the handler's write
   transactions span only its writes, every off-path pass commits in chunks of
   about `miner.chunk_ms` (seed 50 ms) of writing, with elapsed time checked
   before each write, and **releases the write lock between write
   transactions** for `miner.chunk_gap_ms` (floor 25 ms, seed 30 ms, AD-26;
   settlement (c)), and every other writer's
   transaction is bounded below 150 ms, AD-26; **no O(store) statement is permitted on the event path**
   — integrity scans run off-path, AD-17); transcript reads (bounded slices,
   resumable bookmark, AD-9); stdin (bounded by the hook payload);
   **compose-time pointer re-resolution** (AD-15's rumor-rule check — span
   reads are seek-and-read of the cited span ± slack, never whole-file, and
   skipped entirely for files over the AD-12 ingestion cap; commit-hash
   pointers re-resolve against the store's own `commits` table, **never a
   `git` subprocess on the event path**); **repository resolution** — a
   bounded upward walk from the realpath of the event's `cwd` (at most one `stat` per path
   component) to the first directory containing `.git` (a directory or a
   worktree's `.git` file). **A worktree** (`.git` is a file) resolves to its
   main repository: the `.git` file's `gitdir:` pointer names the worktree's
   git directory, whose `commondir` file names the main repository's `.git`,
   and the root looked up is that `.git`'s parent — two bounded file reads, no
   `git` subprocess (a `.git` file whose git directory has no `commondir`, such
   as a submodule's, keeps the directory holding the `.git` file as its root).
   **A worktree event shares the store but not the checkout.** History facts
   (commits, pairs, landmines) are the same repository's and are shared. The
   index describes the main checkout at `index_head`, so for an event from a
   worktree: span pointers re-resolve against the event's own worktree root (a
   span that does not hold there is dropped by the rumor rule, AD-15); the
   staleness check compares `index_head` with the worktree's own `HEAD`, and a
   mismatch marks that
   event index-stale (`FR-K7`: confidence lowered); and a worktree event never
   spawns a reindex on its own staleness, because indexing a different tree
   would overwrite the main checkout's index. The one spawn a worktree
   `SessionStart` makes is AD-4's pending-store child, run at the main
   repository's root, so it migrates the shared store and indexes the main
   checkout, never the worktree's tree (F-3). *Why (the 2026-09-26 applier pass, raised on the
   worktree fix above):* binding a worktree to the main store would otherwise
   point the agent at spans from a tree it is not editing.
   **Resolving a `HEAD`.** A worktree's `HEAD` file (in its git directory) holds
   a symbolic ref (`ref: refs/heads/wt`, reproduced on git 2.43.0 in B3b E-6),
   so the comparison reads it and resolves the ref through the **common**
   directory's refs: the loose ref file under `refs/heads/`, else its line in
   `packed-refs` — a bounded set of file reads, no `git` subprocess. The main
   checkout's `SessionStart` staleness read is the same resolution through its
   own `.git` (R-12 (b); B3b E-6: "one more bounded read" understated it, the
   bound holds). **When neither exists** — no loose ref file and no
   `packed-refs` line for it, as in a reftable repository — the `HEAD` is
   unresolved: both staleness flags are set true (the index-stale and the
   history-stale dampening of AD-14, with an unresolved-`HEAD` reason in the bar
   outcome), never read as fresh, and the fault `head_unresolved` is recorded on
   the transition only (`schema_meta.head_unresolved_since`, cleared when a later
   resolution succeeds; not `index_stale`) (F-19; RC-27: B5 verification item
   10, B8b E-14).
   Then one indexed `global_meta` lookup of that
   root's `init`-recorded binding (AD-20), in the global store **opened
   read-only**: `node:sqlite` opened read-write creates a missing file, and its
   `readOnly` option is documented to fail instead ("If the database does not
   exist, opening it will fail"), so on a machine where `init` never ran a hook
   event creates no `global.db` and reads the missing store as a miss (R-12 (c);
   B3a E-6, executed on Node 22.22.2); when the walk finds no `.git` (a
   path-keyed repository, AD-3 rule 3), one indexed lookup per visited
   ancestor, nearest first, bounded by the same component count. A miss means
   not initialized: the handler fails open silent and creates nothing — no store
   layout, no project directory — except the fault `repo_not_bound` on the
   home-level channel (AD-17), written once per `session_id` (deduplicated by a
   home-level marker keyed by `session_id`), which `status` shows wherever it is
   run; per-repository state exists only after `init` (AD-20). So a moved
   checkout, or a fresh clone carrying a committed `.claude/settings.json`,
   misses until `init` is re-run there, and the miss is visible. *Why (review
   record 2026-09-26, CH H6 / ER M11):* "visibly" had no fault behind it, and a
   worktree has its own root, so an owner session in a worktree or a moved
   checkout produced zero whispers that the exit data would read as a low
   floor; **the post-write content
   hash** — on `PostToolUse` for Edit/Write/NotebookEdit with outcome
   `ok`, one read of the target file to hash it for `observed_actions`'
   post-write hash (the `FR-L4` regret proxy's input, AD-18), bounded by the
   AD-12 ingestion cap: the byte cap is checked by `stat` before any read (above
   it, NULL is stored and no read is made), and the line cap is applied during
   the bounded read (it stops at 20k lines and stores NULL, the path-only
   outcome) — a line count cannot be known without reading (review record
   2026-09-26, ER m1); and the `SessionStart`-only items
   (the staleness check's `HEAD` read — the bounded file reads above, not a
   subprocess — and the detached reindex/`quick_check` spawns,
   fire-and-forget, never awaited; the reindex is spawned when `index_head` or
   the mined tip differs from `HEAD`, when `mining_in_progress`,
   `history_reset_pending` or `reweight_pending` is set, and when the schema
   check finds the store pending (AD-4), so an unfinished pass or an upgrade
   never waits for the owner's own CLI use — F-3; the pending-store spawn is
   also made on `UserPromptSubmit`, the one spawn outside `SessionStart`,
   fire-and-forget in the same way; a pass that cannot finish,
   such as a refused `refTs`, records its fault again on each such pass, so the
   condition stays visible); and the `SessionEnd`-only fold (AD-5's
   `whisper_stats` aggregation — indexed rows since each of the project's two
   watermarks,
   never on a deny-capable event). Under that
   inventory the deadline fires between slices well inside the wired
   `"timeout": 5`, so a slow event records its `latency_breach` before the
   harness's timeout discards its output (V6: a timed-out `PreToolUse` hook lets
   the tool continue, and its output — a deny it would have emitted included —
   is discarded, so nothing it emitted survives; whether the harness shows a
   notice for it the reference does not state) — **for the enumerated
   paths** — not declared "unreachable" in the abstract; an unenumerated
   blocking call is exactly what AC-10's large-store fixture exists to catch.
   A deadline fire writes `latency_breach` to the JSONL channel.
2. **Standard.** NF-1 (`D-31` numbers) and `FR-O3` governing; V6 the verified
   hazard.
3. **Why here.** The hook timeout is fail-open on `PreToolUse`, so the hazard
   the watchdog exists for is not an accidental block: it is losing the
   `latency_breach` record and any deny the handler would have emitted, which a
   harness timeout discards. The watchdog ends a slow event inside its own
   deadline, so the event records what happened.
4. **What this is NOT.** Not harness-timeout reliance (that path is fail-open
   on `PreToolUse` and discards the handler's output, V6, so relying on it loses
   the record). Not a lower wired timeout (1–2 s) — the harness kill
   racing the watchdog reintroduces the hazard the margin removes. *(Corrected
   2026-09-28: item 3 said the timeout could make the oracle "block by
   accident" and item 4 that the path was "fail-closed", while item 1 and V6
   already said a timed-out `PreToolUse` hook lets the tool continue — R-7; B5
   verification item 5, B5a E-1.)*
   **Why repository resolution is a lookup (review record 2026-09-25,
   G30/N15).** The skeleton derived the repo key per event with `git rev-parse
   --is-inside-work-tree`, `rev-parse --is-shallow-repository`, and `rev-list
   --max-parents=0 HEAD`. The last walks the whole history, so it is unbounded
   on a large repository, and this inventory forbids a `git` subprocess on the
   event path. The skeleton also created `projects/<key>/` for every
   repository a hook fired in, `init`-ed or not (executed: two never-`init`-ed
   directories each gained a project directory). The repo key is computed where
   that is safe, at `init` (AD-3), and the event path only looks it up. The
   non-git branch of the walk is this document's addition to the review's
   decision: AD-3 rule 3 supports path-keyed repositories, and a `.git`-only
   walk would never find them.
5. **Premise verification.** V6 (timeout semantics, fetched 2026-08-29); V8 (the
   normal path is ~50 ms, so the watchdog is a tail-risk device, not a working
   regime); the per-event `git` cost and the layout creation executed in the
   review record `docs/reviews/2026-09-25-skeleton-gap-list-review.md` (G30,
   N15), and the missing post-write read identified there (G32); the binding
   fault, the worktree rule, the lock-hold bound, and the cap wording from
   `docs/reviews/2026-09-26-architecture-pass-collapse-hunt.md` (H6, H9) and
   `docs/reviews/2026-09-26-architecture-pass-expert-review.md` (M11, S2, m1);
   the worktree layout executed here 2026-09-26 on git 2.43.0 (`git worktree
   add` wrote a `.git` file `gitdir: <main>/.git/worktrees/wt`, whose `commondir`
   file read `../..`, a path relative to that directory, so the resolver joins a
   relative `commondir` to the worktree's git directory); the 2026-09-28
   corrections — the timeout wording (R-7, B5a E-1, the hooks reference fetched
   2026-09-28), the `HEAD` resolution and the read-only global open (R-12, B3a
   E-6, B3b E-6, both executed there), and the yield and writer bounds in the
   inventory (R-36, B3b E-7; G-5 and G-7 as corrected). Addresses: NF-1, `FR-O3`, AC-10.

### AD-24 — Test and fixture architecture (the Phase A acceptance criteria made mechanical)

1. **Decision.** `node:test` suites in three tiers:
   - **Unit:** recognizers (the question recognizer's `?`/fence/stoplist rule,
     the clear recognizer's substance/deferral rule, the move recognizer's
     deny-eligible tool set, and the done-claim lexicon), bar arithmetic,
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
     no false crown; an **unimported-grammar case** where an `imports: true`
     symbol with an *observed* count of 0 is in the set, and the dominance
     comparison is still made among the comparable candidates so it is not
     over-silenced; and a **same-name false-positive case** where a
     comment/string collision fires **with the false-positive caveat in the
     whisper's evidence and its confidence capped** — `symbol_refs` counts such
     matches, so the fixture pins honest disclosure, not exclusion), AC-2
     (structural deny confinement — AD-10's import-graph test + built-output
     grep), AC-2a and AC-2a-i's allow-half (deny plumbing with
     fixture-controlled state), AC-3/3a/4/5/6 (bar, hazard, dedup — including
     the **`coupling-key-symmetry`** fixture: a Read of A that delivers the A–B
     Coupling fact, with both ratios, then a Read of B, delivers it once,
     pinning AD-16's canonical key — boundaries, corpus floor), AC-7 (init/deinit tree diff), AC-8, AC-8a (including the
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
     source, demonstrated by execution), AC-20
     (cold-container install+index in a clean container), AC-22 (idle
     silence), AC-23 (human-correction precedence, including
     `--missed-question` routed through the classifier), AC-24 (regret
     true-positive and no-inflate, the failure clause fed by
     `observed_actions.outcome` via the `PostToolUseFailure` wiring, V19).
     **Answer-drift cases** (the deny path with the question/answer state
     fixture-controlled, AC-2a): **off-to-unrelated** (a question open, the
     next move a mutating `Edit` → denied; a `Read`/search and a test/build run
     in the same state → allowed, D-39); **re-ask after a blanket clear**
     (asked → narration-cleared → re-asked verbatim → the next mutating move is
     denied again — the open-scoped dedup index at work); **substantive clear**
     (a reworded but substantive text turn clears all open questions, so the
     next `Edit` is allowed — AC-2c over-fire); **the wrongful-deny residual**
     (a request whose answer is itself an edit — "can you rename the helper?" —
     has its rename-`Edit` denied once while the question is open, escaped by
     one answering or plan-stating text turn, and counted on the wrongful-deny
     rate; the model-free move recognizer cannot tell this edit from drift, the
     accepted Phase A cost, L1); **under-fire human channel** (a clearly
     non-answer-directed move with the question unanswered and no deny fired →
     `ctxoracle correct --missed-question` records the miss and the identical
     deviation is thereafter denied — AC-2c under-fire, FR-L6);
     **failed actions, change/read consumers, and the bypass diagnostic** (a
     failed `Edit` appears in no Completeness/Verification changed-regions
     computation and records no re-edit regret row — AD-4's split filter,
     `'ok'`-only for both; a successful (`'ok'`) file-writing Bash command
     **writing the denied action's own target** (matched via the target
     `file_path` the deny recorded in its `whisper_audit.evidence_json`, AD-9)
     in the same turn as a deny raises `deny_bypass_suspect`; a failed write,
     and a redirected test run `npm test > out.log` writing an *unrelated*
     path, do **not**); **run-state honesty and compound composition** (a session of
     innocuous commands still fires the strong "not run" clause; a session
     containing `make check` composes only the weaker recognized-runners claim;
     a covering test **run-and-failed** (`PostToolUseFailure` row) at a
     done-claim yields **neither** "not run" **nor** "no recognized run" — the
     run subtracts, either outcome; the compound `cd pkg && npm test` subtracts
     while `cd pkg && make check` composes the weak claim; and `npm test &&
     make integration` **both** subtracts npm's covering tests **and** composes
     the weaker "no recognized run" claim for `make` — segments contribute
     independently); AC-23's efficacy clause is pinned to a
     **post-session** correction reaching the global store (the project-store
     fold and its replace-publish, AD-5) and to an import of an older export
     leaving the global counts equal to the imported store's own totals;
     **store upgrade and re-weight cases** (the correction review's fixes,
     F-1–F-6, F-16, F-22): a `'fallback'` store opens clean on the hook path and
     on a CLI open; a pending store's `SessionStart` spawns the index child,
     whose migration transaction holds the lock below 150 ms on a store at the
     horizon's seeds and whose chunked reset resumes after a kill; an invalid
     stored tuning row makes a `PreToolUse` with an open question emit neither a
     deny nor a whisper and records `tuning_invalid` (AC-10); after a pass whose
     `refTs` rose past a capped commit's cap, and after one that changed `h`,
     every weight equals a fresh mine's within the stated tolerance, including
     when the pass was killed mid-re-weight and the retry ran at another
     `refTs`; a response whose cleared whispers fit is at most 10,000 characters
     with its whispers in rank order, and one whose cleared whispers exceed it
     records `response_over_cap` (its delivery pending `OL-C1`, AD-16); AC-1a's fixture covers **both entry-point shapes**
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
   Build: `tsc` only. Migrations are forward-only and fixed once applied, each
   recorded by checksum and checked on every open (AD-4's schema check); the
   pre-checksum fingerprints and the generic frontend's prose/data seed are
   committed source files generated once by a script and pinned by tests, so
   the build reads no `git log` and fetches nothing (AD-4, AD-12; F-17, F-10).
   **Vendored grammar WASMs are allowed, under provenance and checksum rules**,
   because two shipped grammars are unusable (AD-12) and neither replacement
   can be an npm dependency: `@tree-sitter-grammars/tree-sitter-lua` 0.4.1
   brings an `install` script (`node-gyp-build`), two native-build dependencies
   and six prebuilt `.node` binaries, all three of which this decision forbids
   (B9 E-1). So:
   - **Lua** — the package's shipped `tree-sitter-lua.wasm`, vendored as a file
     with its package name, version and tarball integrity, a sha256 **checked at
     load**, and the package's MIT notice.
   - **Swift** — `tree-sitter-swift` 0.4.3 rebuilt **once, at vendoring time**,
     with `calloc(1, sizeof(struct ScannerState))` and a reset when
     `length < 4`, vendored with the patch, the build command, its sha256
     (checked at load) and the MIT notice, and the defect reported upstream.
   The runtime dependencies stay exactly the two above, the package build stays
   `tsc` only, and neither grammar is an npm dependency; the loader takes each
   grammar's WASM path from the extension→grammar table (AD-12). *(Changed
   2026-09-28: "exactly two runtime deps" had no room for a grammar outside
   `tree-sitter-wasms`, so Lua was excluded as a patch — R-15; B9 verification
   item 1, B9 E-1.)*
2. **Standard.** C-3 governing; ASVS 5.0 V15 (Secure Coding and Architecture)
   dependency hygiene (the no-postinstall rule; provenance and a checked
   digest for every vendored binary).
3. **Why here.** Install ceremony is the first thing a sandbox breaks; the
   dependency surface is the supply-chain surface (T4-adjacent).
4. **What this is NOT.** Not a published registry package in Phase A (nothing
   external consumes it; publishing is a later owner-visible step). Not a
   bundler pipeline (tsc output is sufficient; fewer moving parts).
5. **Premise verification.** V14 (registry metadata: no install scripts, no
   deps); C-3 read at spec §8; the Lua package's install script, native
   dependencies and prebuilt binaries, its WASM's ABI 15 load under 0.25.10 and
   24-of-24 clean parses, executed in B9 E-1. Addresses: C-1, C-3, AC-20.

### AD-26 — Concurrency

1. **Decision.** Hooks can run in parallel (multiple matching hooks; overlapping
   events), so multiple handler processes may touch one store concurrently:
   WAL + `busy_timeout=100ms` + short write transactions (below) + retry-once
   on `SQLITE_BUSY`; on second failure the event completes whisper-less
   (fail-open) with a `store_busy` diagnostic (`{writer: 'handler', phase}` with
   the event kind) — never recorded as `store_corrupt`, which a busy lock is not
   (Flaw 1, settlements' review).
   **Every connection waits the same way, the off-path writers included.** The
   miner, the indexer and every CLI verb open both stores with the adapter
   default — `busy_timeout` 100 ms and one retry, about 200 ms in all.
   *Derivation (G-7 as corrected, settlements):* SQLite's default busy handler
   sleeps and retries with no queue; under a 100 ms `busy_timeout` its lock
   attempts fall at 0, 1, 3, 8, 18, 33, 53, 78 and 100 ms (SQLite 3.51.2,
   `src/main.c`, `delays[]`/`totals[]` with the clip at the timeout — the version
   Node 22.22.2 bundles), and a waiter using `Store.transaction` gets two such
   tries. With every other writer's transaction bounded below that window (the
   rule below) and the lock released between them, an off-path waiter fails
   only if every attempt lands inside a hold; measured, an off-path writer at the
   default did not fail once in 1,437 chunk transactions against 8 and then 16
   agents firing hook events back to back on four cores, several times any one
   session's load (one agent measured 5.4 events/s, each handler write about
   1 ms). A chunk transaction that still raises `StoreBusy` fails the pass
   visibly: the verb's error channel records `store_busy`
   (`{writer: 'miner'|'indexer', phase}`) and exits non-zero, and the next pass
   resumes (AD-13). *(Corrected 2026-09-28: off-path writers used
   `busy_timeout` 5,000 ms "because … a background pass that gave up after
   200 ms would abort whenever a live session's handler held the lock for one
   short write group". That reason is false — one short write group cannot
   outlast a 100 ms waiter with its retry; a 5,000 ms wait outlasts a burst and
   does not answer starvation (a 2,000 ms waiter against a 4 s no-gap burst was
   starved for its full wait, B7b E-21); the value was never derived, it is
   about 10 s in effect under the retry, a stuck holder went unreported that
   long, and its last remaining reason, a purge on an aborted pass, is gone now
   that a stopped pass is resumed — R-36 (c), (d); B7b E-21, B7c E-5.)*
   **Every writer that can run beside a pass is bounded** — the requirement the
   derivation rests on: every write transaction of every such writer — each
   handler write group (the `SessionStart` reseed and rebuild and the
   `SessionEnd` fold included), every CLI verb, `import`, and every migration
   (whichever CLI open applies it; AD-4's migration bound keeps its transaction
   to row-count-independent steps and moves row work into chunks, F-4) — is
   bounded **below 150 ms** by the before-write rule below,
   chunking with the settled yield where its size can grow, and each records its
   longest hold as the passes do (G-7 as corrected: the measurement covered the
   skeleton handler's single-statement writes only, so the bound on the rest is
   stated as a requirement, not assumed).
   **What the handler waits on.** Every handler write waits on the write lock up
   to the busy bound above (100 ms + one retry); it never waits on the reindex
   claim, so a pass in progress delays an event by no more than that bound, and
   staleness merely lowers confidence meanwhile (`FR-K7`). *(Corrected
   2026-09-28: this said "The handler never waits on it", which the busy bound
   contradicts — R-36 (e); B5 verification ruling 4.)*
   **The reindex claim is a lock the operating system releases.**
   `reindex.lock` is a SQLite database in the project directory
   (`projects/<repo-key>/`, AD-3), left in the default rollback-journal mode,
   because `EXCLUSIVE` excludes other connections' reads only outside WAL
   ("EXCLUSIVE and IMMEDIATE are the same in WAL mode", `sqlite.org`). Its
   holders are `runIndex`, the miner run by the `index` verb, and the detached
   reindex spawned from `SessionStart`: each stats the path (`dev`, `ino`),
   opens it with the stores' `busy_timeout` 100 ms, runs `BEGIN EXCLUSIVE`, and
   keeps that transaction open, writing nothing, until the pass ends; a
   `finally` runs `ROLLBACK` and closes it, and `SQLITE_BUSY` from `BEGIN
   EXCLUSIVE` is the refusal. *Why 100 ms (F-12):* the only hold a claimant
   should outlast is `status`'s probe, which runs `BEGIN EXCLUSIVE` and
   `ROLLBACK` and writes nothing, so it holds the lock only between two
   consecutive statements, while the default busy handler's schedule makes nine
   lock attempts inside 100 ms (0, 1, 3, 8, 18, 33, 53, 78 and 100 ms, above);
   every other hold is a pass or a purge, which a claimant is meant to be
   refused by, not to wait out. The former 1,000 ms had no derivation and
   contradicted item 4 ("Not a long `busy_timeout` anywhere").
   **Right after acquiring, the holder checks that it holds the file the path
   names** (F-23): it stats the path again and proceeds only when it still names
   the same `(dev, ino)` as before the open, and then opens the project store
   with `mustExist`; if either fails it runs `ROLLBACK`, closes, and refuses
   (`{refused: 'reindex_lock_replaced'}`, recorded as `reindex_locked` with that
   reason). *Why:* `deinit --purge` deletes the directory, `reindex.lock` included, while
   holding the lock, and a claimant already waiting in `BEGIN EXCLUSIVE` holds an open
   descriptor to the file being unlinked; once `deinit` exits that claimant
   acquires the lock on the deleted file while a later claimant creates and
   locks a new one — two holders, the case "talking to different database files
   with the same name" (`sqlite.org/howtocorrupt.html`). The comparison is
   before-open against after-acquire because `node:sqlite` exposes no
   descriptor to `fstat` (`DatabaseSync`'s methods on Node 22.22.2: `open`,
   `close`, `prepare`, `exec`, `function`, `location`, `aggregate`,
   `createSession`, `applyChangeset`, `enableLoadExtension`, `loadExtension` —
   executed 2026-09-28). The file a waiter holds open cannot have its inode
   number reused while it is open, so a replacement always differs from it; the
   residual is a replacement between the claimant's first stat and its open
   that later reuses that stat's inode number, which needs two unlink-and-create
   cycles inside that window, each made only by a `deinit` holding the lock.
   Immediately after the check, the holder commits
   `schema_meta.reindex_owner_pid` and `reindex_started_at` in the project store
   (one transaction) and deletes both in its `finally` before releasing the
   lock; these rows are information for `status` and the refusal message only,
   and nothing reads them to decide who holds the claim. A refusal is
   `{refused: 'reindex_locked', ownerPid, startedAt}`, both read from the project
   store in **one read transaction** right after the refused `BEGIN EXCLUSIVE`
   (null when the holder has not recorded itself yet, and the message says so),
   and the `reindex_locked` fault carries the same values. `status` probes the
   lock with `busy_timeout` 0: `SQLITE_BUSY` → "reindex running since
   `<startedAt>` (pid `<ownerPid>`)"; acquired → an immediate `ROLLBACK`, and if
   the rows are present the holder died without its `finally`: "last reindex
   (pid, started) did not finish". The probe holds the lock for one
   `BEGIN`/`ROLLBACK`, between two of a claimant's nine attempts (above), so it
   does not cause a refusal. **No code opens `reindex.lock` except through `node:sqlite`** (a
   non-SQLite `open`/`close` of the file in the holder's process releases the
   lock — executed, while a second SQLite connection there does not), and **no
   code unlinks or renames it while a pass may hold it**: `deinit --purge` first
   takes the lock with `BEGIN EXCLUSIVE` (`busy_timeout` 100 ms, with the same
   identity check; refused → `deinit` refuses, naming the holder) and deletes
   the directory while holding it,
   because a process that unlinks and recreates a database file another process
   still holds leaves the two "talking to different database files with the same
   name" (`sqlite.org/howtocorrupt.html`). The pid-liveness takeover (`alive()`,
   and `EPERM` counted as alive) is removed. *Why (R-37; G-2 as corrected,
   settlements; B5 verification ruling 4, B8 verification item 11):* the lock's
   lifetime is the holder process's own — "All process-owned locks associated
   with a file for a given process shall be removed when any file descriptor for
   that file is closed by that process" (POSIX `fcntl`), process exit closes
   every descriptor, and a fatal signal terminates "as if by a call to
   `_exit()`" — and executed, a `SIGKILL`ed holder's lock was acquired at once by
   the next claimant; so there is no stale state to judge. `kill(pid, 0)`
   answers "does some process have this pid", not "is the holder alive": with a
   stored pid of 1 standing for a dead holder whose pid now belongs to an
   unrelated live process, the claim was refused for as long as that process
   lived (executed), and `EPERM` reads another user's process as the holder;
   both fail toward stopping reindexing indefinitely. A lease needs the holder
   to renew inside long synchronous work and an expiry with no source, and a
   merely slow holder loses its claim to a second pass — the double writer the
   claim exists to prevent. Acquisition stays one atomic step under SQLite's
   single writer, as the claim row made it (D-plan-32: a lock file with liveness
   reclaim let two reclaimers of a stale lock both win in 29 of 200 races; the
   single writer, 200 of 200 with exactly one winner). What it costs: one extra
   file per project and one open connection during a pass; advisory locks on a
   network file system are only as reliable as its lock support.
   Audit-before-emit ordering (AD-8) holds per
   process; ids are ULIDs so concurrent writers never collide. The
   `whisper_stats` fold (AD-5) reads its project store's two watermarks,
   aggregates the rows newer than each, appends the `stats_folds` rows, and
   advances both inside a **single `BEGIN IMMEDIATE` transaction on the project
   store**, so two concurrent same-project folds cannot both read the old marks
   and double-count the same `sent` rows — the second serializes behind the
   first and sees the advanced watermarks. The publish to the global store is a
   separate, idempotent replace; a crash between the two leaves the replica one
   fold behind until the next publish, never wrong by a double count.
   **Transactions nest, and the caller owns them.** Transaction demarcation
   belongs to the unit of work, meaning a mining or index chunk, or one of the
   handler's write groups (below), and never to a DAO. `Store.transaction` is re-entrant. At
   depth 0 it issues `BEGIN IMMEDIATE` with the busy-retry above. At depth > 0
   it issues `SAVEPOINT` / `RELEASE` / `ROLLBACK TO`, with no retry, because the
   write lock is already held. DAO methods keep their own atomicity through the
   same call, so a DAO used alone is still atomic, and a caller can make a
   multi-DAO write atomic.
   **The write lock is held only while writing.** SQLite has one writer, and
   every waiter waits about 200 ms for it (100 ms `busy_timeout` + one retry,
   above), so every unit of work is bounded:
   - *The handler's event.* Its write transactions span only its writes, and
     **each write group is one `Store.transaction` call**: the intake's question
     rows (`UserPromptSubmit`) in one, the catch-up's question and bookmark
     updates in one, the `observed_actions` append in one, and each
     audit-then-emit write (the `whisper_audit` row with its `delivered`-set
     insert, committed before the text is emitted, or the deny row) in one, so a
     failure between the audit insert and the delivered insert leaves neither
     row. The transcript read, candidate generation, the bar, dedup reads, and
     compose run outside any write transaction. The ~200 ms window above holds
     only for a write group inside `Store.transaction`: a bare autocommit
     statement gets one 100 ms try and no retry (executed: a single autocommit
     insert failed once the other writer's hold passed about 100 ms, where a
     `Store.transaction` write group held until about 200 ms), and the skeleton
     handler's writes are such statements, so the plan's Step 28 puts each group
     in `Store.transaction` as written here (Flaw 1, settlements' review).
   - *A mining or index pass.* It commits in bounded chunks. `git log` is
     streamed and aggregated outside any transaction; each chunk is one
     transaction that writes its rows — for the miner, its evictions or its
     commits with their `commit_touches` and weights, `change_count`
     increments, pairs, and `labelled_touches` (AD-13) — and nothing to the
     watermark, which only the final transaction writes. **Elapsed time is
     checked before each write**, and a chunk commits once it has spent
     `miner.chunk_ms` (tuning, AD-5; seed 50 ms, illustrative) writing, so a
     chunk's writing time stays within `miner.chunk_ms` plus one write — below
     the waiter's roughly 100 ms first-try window — and so does every other write
     transaction of a pass, chunked or not. **Between two write transactions the
     pass releases the write lock for `miner.chunk_gap_ms`** (tuning, AD-5;
     floor 25 ms, which `tune` refuses to go below; **seed 30 ms**, the floor
     plus a 5 ms margin derived from measurement below — settlement (c), F-21);
     the index pass does the same. The miner's and the indexer's pass
     connections run `PRAGMA synchronous = NORMAL` (an `openStore` option,
     off-path only), so a commit holds the write lock without a WAL fsync; every
     other connection keeps SQLite's WAL default, `FULL`. Each pass records its
     **longest write-lock hold** — the adapter's time from `BEGIN IMMEDIATE`
     returning to `COMMIT` returning — in its result and in `status`, and at most
     one `write_hold_exceeded` fault per pass carrying the longest hold and the
     count of holds over 150 ms (`{writer, holdMs, phase, count}`). The landmine
     rebuild (AD-15) is one short final transaction. An index pass writes
     `schema_meta.index_head` only in its final transaction, so a crashed pass
     leaves the old `index_head` and the staleness check re-triggers it.
   - *A mining pass whose evictions and additions take more than one write
     transaction* runs with `schema_meta.mining_in_progress = 1`, set in its
     first transaction (for a re-weight, the one that writes
     `reweight_pending`; for 003's reset, the migration's own, AD-13) and
     cleared in its final one; the history genres produce no candidates while
     it is set (AD-13), so no reader sees partial counts, and `status` lists the
     condition (AD-17).

   *Why the lock bound (review record 2026-09-26, ER S2 / CH H9):* the first
   2026-09-26 pass made the whole mining or index pass, and the handler's whole
   event, one transaction. The reviewer measured 414 ms for the write phase
   alone of a 10,000-commit pass (349,905 pair upserts, one transaction, Node
   22.22.2, before any `git` read). A refresh that `SessionStart` spawns holds
   the lock that long while the session's first events run, their audit writes
   fail, and a failed audit means no deny (AD-8) — `OL-C3`'s block silently off
   for the refresh, with only `store_busy` as a trace.
   *Why the yield (R-36 (a), (c); B3b E-7, B8a E-17):* chunk length does not
   bound a waiter's wait — the gap between chunks does. SQLite's handler sleeps
   and retries with no queue ("The presence of a busy handler does not guarantee
   that it will be invoked when there is lock contention"), so a writer that
   takes the lock back within microseconds of releasing it can make every
   attempt miss, while one short write group cannot. The longest nominal
   interval between attempts within 100 ms is 25 ms (78 − 53), so a free window
   of at least 25 ms contains one **on the nominal schedule only**: the interval
   is 25 ms plus the overshoot of the handler's own 25 ms sleep, which SQLite's
   unix VFS takes with `nanosleep` (`os_unix.c` at version 3.51.2, `unixSleep`),
   so the scheduler decides it. Measured in settlement (c) (Node 22.22.2, 4
   cores): the 25 ms sleep's overshoot, untraced in C, had p99 1.833, 2.599 and
   3.711 ms under 0, 3 and 8 CPU spinners, and a maximum of 34.313 ms once in
   2,000 idle sleeps, so no finite margin guarantees capture; the margin is set
   to cover the 99th percentile under every measured load — max(1.833, 2.599,
   3.711) = 3.711 ms, so at least 4 ms — and 5 ms is the smallest margin
   measured directly. Against a writer holding 60 ms per transaction, a one-try
   waiter (`busy_timeout` 100, no retry) through the adapter missed 15 of 2,613
   times at a 25 ms gap and 0 of 2,729 at 30 ms under 3 spinners (180 s runs),
   and 13 of 1,653 against 1 of 1,802 under 8 spinners on 4 cores (120 s runs).
   **The measured residual is stated: even 30 ms is not a guarantee** (1 miss in
   1,802 one-try attempts under 8 spinners), and what bounds a miss is the
   handler's retry — its two tries span about 200 ms, which contains a full gap
   whenever each hold stays within `miner.chunk_ms` plus one write — with any
   miss past both recorded as `store_busy` and every long hold as
   `write_hold_exceeded` (F-21). Executed earlier: a conforming pass of 50 ms
   chunks with no gap let the handler's audit write succeed in 1 of 15 runs,
   and with a 25 ms gap in 15 of 15. The rule is pinned by a concurrency
   fixture in which a handler audit write made during a synthetic pass must
   succeed. It costs pass time, from the recorded benchmark (B8 verification
   item 6): the 25 ms yield took a pass from 98.2 s to 148.4 s, 50.2 s for about
   2,008 gaps; 5 ms more per gap adds about 10.0 s, so at the 30 ms seed the pass
   takes about 158.4 s, **+61 %** over no yield against +51 % at 25 ms
   (settlement (c)). Step 12 writes the seed and cites this derivation; it has no
   further information to set it from. *(Corrected 2026-09-28: the chunk seed's rationale
   was "half the `busy_timeout`", which bears on nothing the waiter sees, and no
   gap was stated — R-36 (a), (g).)*
   *Why the before-write bound, `synchronous = NORMAL`, and the hold record
   (R-36 (b), R-68; G-5 as corrected, settlements):* with the yield in place a
   waiter with one retry fails only when a single hold outlasts its two tries,
   about 200 ms (executed sweep: 0 failures at a 190 ms hold, failures from
   about 205–210 ms), and a pass's holds were not bounded by `chunk_ms`, because
   the chunk loop checked time after each write and the commit's WAL fsync
   under `synchronous = FULL` came on top — holds reached 180–188 ms under disk
   contention, against 149.8 ms with `NORMAL` (executed). "Transactions are
   consistent with or without the extra syncs provided by synchronous=FULL"
   (`sqlite.org/pragma.html`); what a power loss can take is the pass's last
   commits, which the next pass re-mines or re-indexes (AD-13's reconcile;
   `index_head`), and the faults and the reindex holder rows the pass connection
   wrote since the last checkpoint — the faults are also in the diagnostics
   JSONL, and the holder rows are informational. No handler or CLI row goes
   through a `NORMAL` connection. The residual 3 `StoreBusy` of 2,310 recorded in
   batch 8 did not recur (0 of 21,011 appends in ten runs, B8a's own build
   included), and that run logged no hold timeline, so their cause cannot be
   re-attributed; one hold past about 200 ms is the only mechanism consistent
   with the measurements, and the hold record turns any future residual into a
   recorded hold size instead of an unexplained count. The contention test keeps
   its criterion, 0 `StoreBusy`, and prints the longest hold.
   *Why nesting:* executed in the review of 2026-09-25 (G9),
   `ps.transaction(() => ps.transaction(() => 1))` threw `cannot start a
   transaction within a transaction`, and ten DAO methods open their own
   transaction. No caller could make a multi-DAO write atomic, so the miner
   committed its watermark before its landmines, and a crash between the two
   left the watermark advanced without them. (The watermark now commits only in
   the pass's final transaction, together with the landmine rebuild, AD-13, so a
   crash before it leaves the previous tip and the next pass's reconcile
   finishes the work.)
2. **Standard.** SQLite WAL semantics (readers don't block the writer; one
   writer at a time) — engine-documented behaviour exercised by the V8 probe;
   SQLite's default busy handler (`src/main.c`, `sqliteDefaultBusyCallback`, and
   `sqlite.org/c3ref/busy_timeout.html`: "The handler will sleep multiple times
   until at least "ms" milliseconds of sleeping have accumulated") for the wait
   and the yield; SQLite `PRAGMA synchronous` for the pass connections; SQLite
   `SAVEPOINT` documentation (savepoints "are named and may be nested",
   and work inside a `BEGIN…COMMIT`); POSIX `fcntl`, `_Exit` and signal
   termination for the reindex lock; Fowler, *Patterns of Enterprise
   Application Architecture*, Unit of Work; `FR-O3` for the give-up path.
3. **Why here.** The no-daemon model (AD-1) moves contention to the store; WAL
   is the mechanism that makes that safe, and the give-up path keeps NF-1.
4. **What this is NOT.** Not a global write queue (a daemon in disguise). Not a
   long `busy_timeout` anywhere: on the event path it spends NF-1, and off it it
   outlasts bursts without answering starvation and hides a stuck holder
   (above). Not DAO-owned
   transactions, which cannot compose into one atomic unit of work. Not one
   transaction per pass or per event (the lock-hold bound above). Not a larger
   yield for a long hold (a yield does nothing for one hold past the window) and
   not a longer event-path wait to cover the pass's durability I/O (G-5). Not
   pid-liveness reclaim, and not a lease (above).
5. **Premise verification.** WAL enabled and exercised in V8; `FR-K7`, `FR-O3`
   read at spec §11.1/§8; nesting executed here 2026-09-26 on Node 22.22.2
   `node:sqlite` (`BEGIN IMMEDIATE` → `SAVEPOINT a` → insert → `SAVEPOINT b` →
   insert → `ROLLBACK TO b` → `RELEASE b` → `RELEASE a` → `COMMIT` left exactly
   the first row); `sqlite.org/lang_savepoint.html` read the same day; the
   non-nesting defect executed in the review record
   `docs/reviews/2026-09-25-skeleton-gap-list-review.md` (G9); the lock-hold
   benchmark executed in `docs/reviews/2026-09-26-architecture-pass-expert-review.md`
   (S2; synthetic shape, cited for its order of magnitude); the busy schedule,
   the gap runs and the pass-time cost executed in B3b E-7 and B8a E-17; the
   25 ms sleep's overshoot and the one-try sweeps at 20–35 ms gaps executed in
   settlement (c) (Node 22.22.2, 4 cores; F-21); `DatabaseSync`'s method list
   executed 2026-09-28 (F-23); the hold
   sweep, the `synchronous` runs and the per-connection setting, the load runs
   at the default timeout, the autocommit window, the reindex lock's `SIGKILL`
   release, the pid-1 refusal and the non-SQLite close executed in the
   settlements and re-run in their review (Node 22.22.2, its SQLite 3.51.2).
   Addresses: NF-1, `FR-O3`, `FR-K7`, `OL-C3` (the deny stays live during a
   refresh).

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
  (AD-9 names them and their bias direction; the exact words are
  implementation vocabulary, not architecture), bar defaults (numbers given,
  marked tunable, storage named), schema (given), event wiring (given), fixture
  set (enumerated). No inline architectural calls found remaining.
- **Reviewer:** "Could I verify a build against this?" — Each decision names its
  addressed requirements; the traceability matrix below is the checklist; AC-2's
  structural test and AD-24's per-criterion pins make the two owner objectives
  mechanically checkable.
- **Stakeholder:** "Do I know what was chosen and what it costs?" — The costs
  are stated where they live: Phase A's answer-drift coverage is deliberately
  low (AD-9, Limitations L1); the generic language frontend is weaker than a
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
malicious *filename* quoted in a pointer) — closed by AD-19's filename rule:
every path is injection-flagged when its `files` row is created (by the indexer
or the miner), and a flagged path is rendered as `path#<file_id>`, never as the
name — except the agent's own tool target, whose name the agent already has;
a whisper left with no verifiable pointer after masking is dropped (AD-19). *Conclusion:* T1 is controlled by construction
in Phase A; the control is re-examined when Phase B introduces model prompts
(the seam notes it).

**T2 — Store poisoning.**
*Observation:* stores persist derived facts; history is attacker-writable in
principle (a cloned repo's history is input). *Question:* can crafted history
plant false high-confidence facts or wrongful denies? *Hypothesis:* poisoning
matters only if low-trust input can reach high-confidence output or the deny
path (variables: trust labels, the trust dampener and caps, deny inputs; assumption: the
deny path consumes only transcript-derived state, never repo content).
*Experiment (control):* `FR-X4` trust labels enforced by DAO CHECK constraints
(AD-4) and lowering confidence through AD-14's trust dampener, with
injection-suspect facts capped below the high tier; the deny path's inputs are structurally limited to `questions`/
`classify_state`, whose rows are created at runtime by exactly **three** openers, each
running the same question recognizer: the `UserPromptSubmit` `prompt`
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
| C-4 | AD-6, AD-7, AD-16 (verified facts V1–V6, V15/V16, V18/V19, V20–V22, V24 at the boundary) |
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
| AC-2c — answer-drift clauses | Over-fire (reads/executions not denied): Phase A, AD-24/AD-9. Under-fire (FR-L6 correction records the miss and outranks): Phase A, AD-18 — enforcement-real when the missed deviation is a mutating edit (reopening the question via `--missed-question` re-arms the mutating-edit deny); a non-mutating / Bash-drift miss is recorded and disclosed (the CLI names which limit was hit) but changes no enforcement, per L3/AD-18. Substantive-vs-deferral discrimination: Phase B per spec §14 |
| AC-3, AC-3a, AC-4, AC-5, AC-6, AC-7, AC-8, AC-8a, AC-9, AC-10, AC-11, AC-13, AC-14, AC-15, AC-17, AC-18, AC-19, AC-20, AC-22, AC-23, AC-24 | AD-24 (each pinned; mechanisms in the named decisions) |
| AC-12 | AD-9/AD-21/AD-24 (Phase A scope: deterministic plumbing model-free; precision clauses Phase B per the criterion's own text) |
| AC-16 | Deferred — Phase C (`FR-L3b` machinery) |
| AC-21 | AD-21 (guard ships and is unit-tested); full induced-self-trigger criterion Phase B |
| AC-25 | Deferred — Phase B (AD-22 fixes its semantics as constraints; nothing of it is built or tested in Phase A) |

## Limitations and trade-offs

- **L1 — Phase A answer-drift coverage is deliberately low, and its coverage is
  a measured exit number, not a claim.** Intake opens a question only on an
  explicit interrogative (`?`, outside code/quotes, off the rhetorical
  stoplist); indirect asks ("tell me whether…") and any ask without a `?` are
  not opened — the safe under-fire direction, its size **measured at exit**
  (§11.5), not classified around. The move recognizer denies only mutating file
  tools; the clear recognizer clears all-prior on any substantive text turn (so
  a blanket-clear can close a question the agent did not truly answer — a
  false-clear, under-fire); a question `compact` summarized away vanishes
  (AD-9). Each lean is the spec's own Phase A posture (`D-41`, `FR-B5`). The
  under-fire guard is the human channel (`FR-L6`, including `--missed-question`)
  plus the AC-8a line. **The wrongful-deny residual** is one class: a repo
  mutation that is itself the answer to an open question (the ask's fulfilment
  *is* the edit — "can you rename `foo`?" — or a real action co-asked with the question)
  is denied while the question is open, because a model-free recognizer cannot
  tell that edit from drift. Every such deny is escapable by one answering — or
  plan-stating — turn (`OL-C3`) and measured on the wrongful-deny rate; Phase B
  distinguishes it. This is the accepted cost of the honest floor, not a gap to
  close with more rules.
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
  and for Phase B's precision case. A second consequence of the same model-free
  line: a file changed only through `Bash` (`echo > f.py`, `sed -i`) carries no
  region granularity and is **not** a member of the Completeness/Verification
  change-set (AD-4 reads `Edit`/`Write`/`Read` rows only), so a coupling or
  coverage gap in a Bash-authored change goes unflagged — safe under-detection
  (never a false claim). Phase B's judgment narrows both honestly.
- **L4 — Repo-identity residual.** A repository that merges an unrelated
  history after `init` changes its root set and thus its key; `status` shows
  the key and mode so the change is visible; export/import is the recovery.
- **L5 — Redaction is pattern+entropy, not perfect.** A secret written as a
  declaration name gets only the pattern rules (AD-19: identifiers are not
  free text). A low-entropy,
  unpatterned secret can pass. Pointer-only composition keeps it out of
  whispers; stores remain local under 0700. Residual risk accepted and stated.
- **L6 — Grammar inventory unverified at architecture time; two Reuse-facing
  consequences owned.** V14 verifies the WASM packages exist, are current, and
  are install-script-free; which languages `tree-sitter-wasms` covers is
  checked at build (`npm pack --dry-run` + a loaded-grammar smoke test), with
  the generic frontend as the floor for anything missing. *(Executed
  2026-09-11: every grammar the pinned runtime loads and parses — 32 of 36;
  the other four (`elm`, `ql`, `yaml`, `bash`) fall to the generic frontend.
  Plan §4. Corrected 2026-09-28: the cause-level rule of AD-12 replaces the
  2026-09-26 "parses correctly on repeated parses" rule and its 31-of-36
  figure — the packaged `tree-sitter-lua` 2.1.3 scanner reads a `malloc` block
  it never initialised and the packaged `tree-sitter-swift` 0.4.3 scanner
  writes into a zero-byte `calloc`, the 0.25.10 runtime creating the scanner at
  every parse; both are replaced by vendored WASMs under AD-25, and every
  grammar still excluded is recorded per language with its cause — R-14; B9
  E-1.)* If coverage proves
  materially narrower than expected, the loader takes a per-grammar WASM path
  from the ext→grammar table, so a vendored grammar WASM is added under AD-25's
  provenance and checksum rules without redesign (C-6). Two consequences
  for the Reuse genre: `symbol_refs` is an **identifier-match heuristic**
  whose false-positive class (same-named symbols, matches in comments and
  strings) is stated in every whisper's evidence and capped in confidence
  (`bar.heuristic_confidence_cap`, held in [`bar.confidence_floor`,
  `bar.high_confidence_min`) by AD-14's ordering, so a
  same-name-inflated candidate still *fires*, flagged, with the caveat rather
  than being silently dropped below the floor);
  and in a mixed-language repo, symbols from languages whose frontend declares
  `imports: false` (AD-12) have no `import_edges`, so a dominance comparison
  would systematically favor `imports: true` candidates — which is why AD-15 claims no crown over an
  incomparable set (silence). The same holds one level down: a language that
  declares `imports: true` but resolves only some of its import forms (a
  `tsconfig` path alias such as `@/util` resolves to no edge) under-counts its
  symbols, so the indexer counts unresolved specifiers and Reuse treats a
  language whose unresolved share exceeds `reuse.max_unresolved_import_share`
  as incomparable too (AD-12, AD-15; review record 2026-09-26, CH H4). What
  counts as *external* rather than unresolved is each resolver's written rule;
  a resolver whose rule is narrow over-counts unresolved and silences Reuse for
  its language — the safe direction, visible in `status`'s per-language share.
  A resolver whose external rule is **over-broad** fails the other way: a
  specifier it calls external yields no edge and is not counted unresolved, so
  the language under-counts **silently** — the unsafe direction, since Reuse can
  then crown a rival over an uncounted true convention — and the unresolved
  share does not detect it; this is why a workspace or `file:`/`link:` package
  is never external and Python's external class is bounded by a stated standard
  library list and the declared distributions (AD-12; R-16 (d); B3b E-15). Both are stated in the whisper's evidence;
  AC-1b's fixture pins the mixed-language case as **asserted silence** (no
  false crown), the unimported-grammar case as **still comparable** (a
  symbol in an `imports: true` language whose observed count is 0 is not
  over-silenced), and
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
- **L12 — No fact can be attached to the Edit/Write event itself before the
  tool runs.** A `PreToolUse` whisper is read next to the tool result, on the
  next model request (V20), so a Warning or Consequence on an Edit/Write reaches
  the agent right after the tool call — which may have run, failed, or been
  denied at the permission prompt or by another hook, the text then arriving
  next to the denial — never before it; and when an `Edit` path deny rule (tested; a `Read` rule not tested — F-18)
  rejects the call, the hook does not run at all and nothing is delivered, which
  loses nothing, since the edit did not happen (DE, PD; Claude Code 2.1.283,
  tested; pending spec sign-off R-1…R-5). AD-15 therefore words them
  about the file the edit targets, never as an edit that happened, and the
  decision they inform is the next move: revise, proceed, or retry. The trigger
  stays `PreToolUse` because the retry of a denied or failed edit needs the
  hazard as much as the first attempt did, and `PostToolUse` (success-only, V19)
  would be silent there (AD-15). The only `PreToolUse` output the model reads
  *instead of* the tool running is a deny. A deny that does not follow a
  deviation is the pre-emptive gate the owner rejected (`OL-R4`, `OL-C2`;
  `CLAUDE.md` "No pre-emptive gate"), so the oracle does not use one to put a
  fact first.
  **A pre-edit channel exists and is not adopted in Phase A: a Warning at the
  Read that precedes an edit.** The tools reference requires the read before an
  edit for "Claude Opus 4.6, Claude Haiku 4.5, and older models", and lets newer
  models skip it only "when reading it wouldn't need a permission prompt" (as
  quoted in review record 2026-09-26, CH D14), and Coupling already fires on it, so a Warning there
  would reach the agent before the edit decision. It is rejected for Phase A
  because FR-A2e and `D-26` bind Warning to an edit in a landmine zone: a Read
  is not an intent to edit, so firing Warning on every Read of a landmine file
  speaks the hazard where no edit follows, and Phase A's floor is measured at
  the spec-defined trigger. Adopting it is a spec revision, not an architecture
  choice; it is recorded as an idea with this evidence (`docs/IDEAS.md` #16).
  *Why this row was narrowed (review record 2026-09-26, CH H5, C3 / ER S1):* it
  said "no fact reaches the model before an edit runs", which asserted that no
  pre-edit channel exists instead of rejecting the one that does with a reason.
  Owner-visible, in plain language: warnings about an edit reach the agent right
  after it tries the edit, not before (review record 2026-09-25, "Unverified
  item — whispers on `PreToolUse`"). *(2026-09-28: the row stays scoped to the Edit
  event, and the Read-time alternative's rejection above is also the coordinator
  ruling's — "Delivery at read time is FR-A2e / D-26's job", CR§2 — R-8; B3a
  E-2.)*
- **L13 — A landmine's confidence has no base rate.** A Warning's evidence
  ratio is its support against a fixed full-support count (AD-14), so three
  reverts among a file's 500 changes read as strong as three among four. Phase A
  records each Warning's `change_count` beside its support on the audit row, and
  the exit report compares false-fire rates across that ratio, which decides
  whether Phase B adds a base-rate term. Owner-visible, in plain language: a
  warning about a file that changes constantly may overstate how risky it is
  (plan-pass collapse-hunt, D-plan-34).
- **L14 — Renamed files start with no history under their new name.** Phase A
  does not follow renames (AD-13): a rename entry contributes both paths, so a
  renamed file's earlier coupling and landmines stay on the old path and the
  new name is silent until it gathers its own history — under-firing, the safe
  direction. Each pass counts the rename entries in its target set and the
  history a follower would carry, and the Phase A exit data decide whether Phase
  B builds following, then designed as a read-time rename map so each commit's
  contribution stays independent of later commits (G-4 as corrected,
  settlements). Owner-visible, in plain language: after a file is renamed, the
  oracle forgets what it knew about it until the file has changed a few more
  times; `status` shows how often that happens.

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
| Claude Code hooks reference (`code.claude.com/docs/en/hooks.md`), fetched 2026-09-26 and re-fetched 2026-09-28 (CR§2; and for the 10,000-character cap, V24), with the Agent SDK TypeScript reference and the permissions page; the denial cases executed on Claude Code 2.1.283 (DE, PD) | V6, V20–V22, V24 | when a `PreToolUse` whisper is read, that permission denials fire `PreToolUse` and path deny rules run before hooks, the timeout's scope, exit-0 stderr, `SessionStart` fork input; AD-6, AD-7, AD-9, AD-15, AD-16, AD-23, L12 |
| Zimmermann et al., IEEE TSE 31(6) 2005 (ROSE) — via spec §9 | AD-4, AD-13, AD-14, AD-16 | mining shape and the confidence computation's grounding (operating point architect-tunable per the spec's note); the frequency of A as the per-file denominator and the support count as `pair_count`; confidence defined per antecedent (the two Coupling ratios) |
| Śliwerski, Zimmermann, Zeller, MSR 2005 (SZZ keyword heuristic) | AD-15 | the method of the fix label — keywords matched as whole words; not the seed vocabulary, which is the architect's (SZZ's regex is `fix(e[ds])?\|bugs?\|defects?\|patch`) — R-38 |
| `go help test` (`pkg.go.dev/cmd/go`, "Test packages"; fetched 2026-09-26 in the expert review) | AD-12 | same-directory `test_map` mapping for Go |
| git-revert(1), gitignore(5) (`git-scm.com/docs`, read 2026-09-26) + execution on git 2.43.0; git-merge-base(1), git-rev-list(1) options, `date.c`, `xdiff-interface.c` and `usage.c` at v2.43.0 | AD-12, AD-13, AD-15, AD-23 | the revert label — the body trailer and the reference-format line are **execution-backed** (git-revert(1) documents only the `Reapply` subject), the manual's `--reference`/`revert.reference` naming the second — R-38; the file walk and the `.gitignore` signal (a tracked file matching an ignore pattern, never `generated` alone); the worktree resolution; the target set and exit statuses; the ten-day plausibility size; the 8000-byte binary test; the 4,096-byte `stderrTail` (`vreportf`'s buffer) |
| SQLite WAL documentation (engine behaviour, exercised V8); SQLite 3.51.2 `src/main.c` default busy handler and `src/os_unix.c` `unixSleep`, `busy_timeout`, `PRAGMA synchronous`, `BEGIN EXCLUSIVE` (`sqlite.org`) | AD-26 | concurrency model; the shared wait, the yield (floor 25 ms, seed 30 ms from settlement (c)'s measured sleep overshoot), the pass connections' `NORMAL`, the reindex lock and its 100 ms wait |
| SQLite `ALTER TABLE` (`sqlite.org/lang_altertable.html`, fetched 2026-09-28) | AD-4, AD-13 | the migration bound: which schema steps run in time independent of the stored rows |
| SQLite `SAVEPOINT`, `VACUUM`, Online Backup API, and "How To Corrupt An SQLite Database File" (`sqlite.org`, read 2026-09-26) | AD-4, AD-5, AD-26 | nested transactions; the explicit `seq` watermark key; import by backup, never by file copy |
| Fowler, *Patterns of Enterprise Application Architecture* (Unit of Work) | AD-26 | caller-owned transaction demarcation |
| POSIX.1-2024 `fcntl`, `_Exit` and signal termination (`pubs.opengroup.org`) | AD-26 | the reindex lock released with its holder process |
| Flyway `validate` (`documentation/command/validate.md`) | AD-4, AD-5 | per-migration checksums checked on every open |
| Shore, "Fail Fast", IEEE Software 2004 | AD-4, AD-13, AD-14 | refusal without data loss; input validation before any write; no seed substitution for an invalid stored value |
| GitHub Linguist `vendor.yml`, `languages.yml`, `heuristics.yml` and `generated.rb` (fetched 2026-09-28, `main` at `d0921d1`, and in B8a) | AD-12 | any-depth `dist/`/`vendor(s)/`/`node_modules/`; the prose/data deny-list seed and its rule for shared extensions; the lockfile names |
| Node.js v22 `modules` (CommonJS `LOAD_AS_FILE`) and Vite `resolve.extensions`; TypeScript 5.9.3 `--traceResolution` | AD-12 | the TS/JS resolver's written-path-first rule, `.json` last, source before the written `.js` |
| C11 (N1570) §7.22.3 and the tree-sitter external-scanner contract | AD-12, AD-25 | the grammar usability rule and the Lua/Swift cause |

Every standard above drives at least one named decision; none is decorative.

## Status of this architecture

All non-trivial decisions carry the five-part format with named anchors and
premise verification; the traceability matrix accounts for every spec key
including explicit phase deferrals; the trap audit (codebase-mirroring,
pattern-cloning, decision-hiding, standards-decoration, deferred-decision) was
run — the one deliberate near-trap is the documented divergence *from* the
historical record (AD-1), which is the opposite of cloning, and the deferred
items are phase-gated by the spec itself, not ambiguity left to an implementer.

The answer-drift block (AD-9) is the Phase A **safe skeleton** the spec mandates
(`D-41`, §11.5): the deny plumbing plus a conservative recognizer that fires only
on a clearly-non-answer-directed move, its precision deferred to Phase B and its
coverage **measured at exit**, not asserted.
