# Handoff — Project plan & next work (2026-06-07)

**Owner:** Max Cogar. **Repo:** `Maxcogar/agent-armory`. **Plugin:** `claude-plugins/agentboard/`.
**Branch:** `session/2026-06-03-agentboard-consistency-audit-subagent`. **Open PR:** #38.

This is the **forward plan** for the next agent. (For the correction-loop thread specifically, see
`docs/handoffs/2026-06-06-correction-loop-skill-shipped.md`.)

## The goal

Build a **remediation project type** for AgentBoard: a forensic, post-completion process-audit of
work that was marked "complete" but wasn't — defects sitting behind unverified or fabricated
gate-passes. Spec: **`docs/specs/spec-remediation-project-type.md`** (expert-spec grade, complete).
Eight phases, inverted-reliability evidence model, dual mandate (fix the issues *and* fix the gates),
tiered transcript fan-out for scale.

## Dependency chain — what gates what

The remediation type is the deliverable; it rests on three enablers:

1. **Transcript-capture hook** — spec **COMPLETE** (`docs/specs/spec-transcript-capture-hook.md`,
   status "draft for review"). **No upstream dependencies. Build-ready now.** It is the *insurance
   mechanism* that turns the remediation type's evidence layer from "best-effort, time-boxed,
   same-host" into "guaranteed." **← THIS IS THE NEXT BUILD. It is NOT built yet.**
2. **Correction-loop skill** — **DONE** this session (`skills/correction-loop/SKILL.md`, committed,
   owner-approved, in PR #38).
3. **Remediation project type** itself — spec done, but **blocked** on (1) the hook, (2) the
   correction-loop, and (3) **AgentBoard server support for custom per-type phases** (server/owner
   side, foundational — not a plugin change).

So the order is: **build the hook → (correction-loop already done) → then the remediation type once
server-side custom-phase support exists.**

## NEXT WORK — build the transcript-capture hook

**What it is:** `SubagentStop` + `SessionEnd` hooks plus supporting script(s) that, for AgentBoard
orchestration runs, durably capture the orchestrator transcript and every card-agent transcript, and
maintain a manifest linking each transcript to its `board_id` / `card_id` / agent-type / ordering.
Extends the existing `hooks/hooks.json` (plugin wrapper schema).

**Current state (verified 2026-06-07):** NOT built. `hooks/` contains only the existing
architecture-pipeline hooks (`validate-architecture-artifact.sh`, `artifact-quality-gate.sh`,
`inject-quality-gate-prompt.sh`, `workspace-card-guidance.sh`) + `hooks.json` + the test harness.
No transcript-capture script exists yet.

**Requirements:** R1–R11 in spec §5 — capture-at-source on `SubagentStop`; orchestrator + manifest
finalize on `SessionEnd`; durable + off-host storage (R4); secret-scrub the OAuth callback URL before
storage (R5); non-blocking always-succeed side-effect (R6); incremental per-subagent capture (R7);
robust to the unconfirmed payload shape (R8); idempotent (R9); gated to AgentBoard runs only (R10);
record coverage/gaps in the manifest (R11). Read §5–§9 before writing anything.

**Must verify empirically at build (spec §11):** the exact `SubagentStop` payload — is
`transcript_path` the *subagent's own* transcript, and is a discrete agent id present? Inspect a real
payload (`claude --debug`) or locate subagent transcripts via the on-disk session `subagents/`
directory. R8 is designed so the hook is correct either way — confirm which path applies.

**Architecture decisions to make (spec §11) — design BEFORE building:**
- **Durable-store backend** satisfying R4 (survives local retention + retrievable off-host) within the
  ~500k-char AgentBoard artifact-size limit (transcripts are multi-MB): cloud/blob upload,
  compression, etc. Must also satisfy R5 (no secrets) and R6 (non-blocking on store failure).
- **Manifest format** — the on-disk/stored card↔transcript↔work index. This is the **contract with
  the remediation read-side**; it must carry `board_id`, `card_id`, agent-type, ordering, and
  coverage. Get this right; it is load-bearing for thread (3).

**Method:** the spec is grounded in the `plugin-dev:hook-development` skill (events, stdin-JSON
payloads, the wrapper schema) — use that skill for the hook mechanics. The spec is
architecturally-silent (what/why, not how): decide the durable store + manifest format first, get
owner sign-off on the "draft for review" spec, then build, then test (there is an existing hook test
harness under `hooks/tests/`).

## Standing rules (carry forward)

- Design before implementation; never invent design inside implementation.
- Ground the hook in `plugin-dev:hook-development` + the empirical payload check — do not assume
  payload fields that aren't confirmed (R8 / §6).
- Non-blocking is non-negotiable: the hook must never block, deny, or delay a tool call or the
  session, and must never persist a secret.
- Commit nothing without explicit owner instruction; nothing is "deferred/out of scope" unless he
  agrees.
- **Do not touch** `middleware/codebase-context-compiler/` — separate project, the owner's, currently
  staged-but-uncommitted in the working tree.

## Pointers

- **Next build:** `docs/specs/spec-transcript-capture-hook.md`
- **The goal it serves:** `docs/specs/spec-remediation-project-type.md`
- **Enabler shipped this session:** `skills/correction-loop/SKILL.md` +
  `docs/handoffs/2026-06-06-correction-loop-skill-shipped.md`
- **Hook mechanics reference:** the `plugin-dev:hook-development` skill
