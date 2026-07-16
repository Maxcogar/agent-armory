# Handoff — Context Oracle architecture phase

**Date**: 2026-07-16. **From**: the session that produced the merged rethink,
spec, and governance (pull requests #42, #43). **To**: a fresh-session agent.

You are starting the **architecture phase** of the Context Oracle. Nothing is
built yet, and that is correct — the lifecycle is binding (spec →
architecture → plan → build; see `middleware/context-oracle/CLAUDE.md`,
"Lifecycle — no shortcuts"). Your job this session: **two validation spikes,
then the architecture document. No implementation code.**

## 1. Read these first, in this order

1. `middleware/context-oracle/CLAUDE.md` — how this project runs: agent-led,
   the owner Max Cogar is a non-programmer by design, the honest-reporting
   rule (never claim success without pasted output — the owner cannot catch
   your mistakes), the binding lifecycle, the session protocol.
2. `middleware/context-oracle/docs/STATUS.md` — current state, plain
   language.
3. `middleware/context-oracle/RETHINK.md` §12 **and its addendum** — the
   owner's locked decisions. Nothing overrides them except Max Cogar.
4. `middleware/context-oracle/docs/specs/spec-context-oracle.md` — what you
   are architecting against. Pay closest attention to: the preamble (which
   decisions belong to you as architect), §5 (system overview), §6 (external
   interfaces: hooks contract, model access), §10 (constraints C-1..C-5),
   §11 (judgment records D-1..D-20 — especially D-13 store layout and D-16
   subagent mechanics, which you confirm or revise), and §14 (unresolved —
   two entries are your spikes).
5. Root `CLAUDE.md` — repo standing rules and the **CORE Memory ingestion
   protocol** (mandatory; follow it exactly at session end).

## 2. Session start (required)

- CORE Memory: `initialize_conversation_session` (new: true); then
  `memory_search` with: "What is the current state of the Context Oracle
  project in Maxcogar/agent-armory and what decisions govern the
  architecture phase?"
- Git: work on branch `claude/context-compiler-rethink-9ybsac`. First check
  whether pull request https://github.com/Maxcogar/agent-armory/pull/44 is
  merged. If merged: `git fetch origin main && git checkout -B
  claude/context-compiler-rethink-9ybsac origin/main`. If still open:
  continue on the branch as it stands — do not reset it (you would destroy
  the unmerged commits).

## 3. Task A — the two validation spikes (before any design freeze)

Both spikes are throwaway experiments: script them in the session scratchpad,
never commit spike code into the repo tree. Record every result with the
actual command and its pasted output. A design built on an unverified
assumption is a guess with diagrams — that is why these come first.

**Spike 1 — piggyback credential inheritance** (gates the whole judgment
layer; spec §6.2 and §14). Question: does a spawned
`claude -p "<prompt>" --model claude-haiku-4-5 --output-format json
--max-turns 1` complete successfully from a non-interactive process using
only the host installation's existing authentication — specifically a
subscription login, with no `ANTHROPIC_API_KEY` in the environment? Test in
the environment you are running in; note which auth mode that environment
actually has (check env vars before concluding). Success: valid JSON
completion with no separate credential. Failure or partial coverage: that
environment runs degraded-only — surface the finding to Max Cogar in plain
language; there is NO credential fallback and you must not invent one
(RETHINK §12 addendum decision 7).

**Spike 2 — subagent context injection** (gates FR-O6 / AC-21; spec §14).
Question: in Claude Code, do PreToolUse/PostToolUse hooks fire for a
*subagent's* tool calls, and does `hookSpecificOutput.additionalContext`
returned by such a hook reach the *subagent's* context (not the main
agent's)? Method sketch: scratch project with a hook that logs its input
(session id, tool name) and injects a marker string; spawn a subagent that
performs a tool call; inspect the hook log and the subagent transcript for
the marker. Success: marker demonstrably in the subagent's context. Failure:
propose the closest fallback in the architecture document and flag the
decision to Max Cogar — accept fallback or descope subagent delivery (spec
§14).

## 4. Task B — the architecture document

Write `middleware/context-oracle/docs/architecture-context-oracle.md`,
derived from the spec, resolving at minimum: component boundaries and
process model (session service lifetime, how shims reach it, C-2 warm-state
requirement); store schemas for both stores and the default layout (confirm
or revise D-13); the harness-neutral event contract (C-3); judgment-prompt
construction satisfying FR-J5's instruction/data separation; the recursion
guard mechanism (D-6, AC-11); the diagnostic log format and self-check
mechanics (FR-M1/FR-M2); subagent delivery mechanics informed by Spike 2
(D-16); and the co-change miner's storage/refresh design (FR-K2). Do not
re-decide anything the spec fixes: no deny paths, no separate credentials,
stores outside the repo tree, Claude Code hooks in v1, the FR-O3 latency
budget.

Then run an **adversarial review** of the document with a fresh subagent
(against the spec, RETHINK §12 + addendum, and established architecture
practice), apply **all** findings — never a subset — and only then present
the result to Max Cogar.

## 5. Hard rules (violations have ended sessions badly)

- No implementation or Phase 0 code this session.
- Never reintroduce: tool-call gates or deny paths, separate API
  credentials, oracle state inside the repo tree, compiled context packages.
- The three `ctxpack` directories (`middleware/codebase-context-compiler/`,
  `middleware/codebase-context-compiler-sandbox/`,
  `middleware/Gemini-context-compiler/`) are ARCHIVED — never cite them as
  current; cherry-pick code only where it fits the oracle model.
- Answer Max Cogar's questions first, fully, before making changes.
- Never report untested work as working; paste real output.

## 6. Definition of done for this session

- Both spikes executed, with pasted evidence and a clear verdict each.
- `middleware/context-oracle/docs/architecture-context-oracle.md` written,
  adversarially reviewed, all findings applied.
- `middleware/context-oracle/docs/STATUS.md` updated in plain language.
- Everything committed and pushed on `claude/context-compiler-rethink-9ybsac`
  with a draft pull request open for Max Cogar.
- CORE Memory ingestion done per the root `CLAUDE.md` protocol (exact text
  shown to Max Cogar for explicit approval before `memory_ingest`).
