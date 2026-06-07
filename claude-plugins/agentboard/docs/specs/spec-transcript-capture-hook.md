# Specification — Transcript-Capture Hook

- **Audience:** the agentboard plugin team.
- **Altitude:** architecturally-silent — defines *what* and *why*; does not prescribe the script implementation, the durable-store backend, or the manifest file format.
- **Grounding honesty:** the Claude Code hooks mechanism here is verified against the authoritative `plugin-dev:hook-development` skill (events, stdin-JSON delivery, common payload fields, the plugin wrapper schema), **not** the live official docs. One detail the skill does not pin down — whether `SubagentStop`'s `transcript_path` is the subagent's own transcript and whether the payload carries a discrete agent id — is marked for empirical confirmation at build time (§11) and designed around (R8) so the spec holds either way. The on-disk transcript layout it relies on is grounded in direct inspection of real files (recorded in the remediation-type spec §7).
- **Status:** draft for review.

---

## 1. The real need

**One sentence:** preserve each AgentBoard orchestration run's execution records (the orchestrator transcript and every card-agent's transcript), linked to the cards they worked, in durable storage at the moment they are produced — so that process-forensics evidence is **guaranteed** rather than best-effort.

The stated request is "capture transcripts." The underlying need is to remove the two limits that make the B-layer (execution records) unreliable for a later audit: **retention** (local transcripts are pruned on a finite schedule) and **machine-locality** (local transcripts exist only on the host that ran the session). Without this hook, the remediation type can only retrieve transcripts best-effort, time-boxed, and same-host. With it, any future process audit has a complete, durable, card-linked evidence set.

This is the **insurance mechanism**: it converts the remediation type's B-layer from "best-effort, time-boxed" to "guaranteed," and it is independently valuable to any workflow that later needs to verify what agents actually did.

## 2. Scope

**IN:** a capture mechanism, delivered as plugin hooks + supporting script(s), that — for AgentBoard orchestration runs — durably stores the orchestrator and per-card-agent transcripts and maintains a manifest linking each captured transcript to its board, card, and the work it represents.

**OUT (with reasoning):**
- The **read/analysis side** (Tier-0 signal extraction, triage, deep-read) — owned by the remediation-type spec; this hook only *writes and preserves*.
- **Legacy-run retrieval** — runs that predate this hook's installation have no captured output; the remediation type's best-effort disk-grep path covers them. Out because the hook cannot retroactively capture sessions that already ran (hooks load at session start).

**FUTURE:** precomputing Tier-0 transcript **signal profiles** at capture time (so the remediation read-side skips the parse). Deliberately excluded from v1; when added, the profile format becomes a second contract with the remediation type.

## 3. Mechanism & governing standards

**Claude Code hooks (verified via `plugin-dev:hook-development`):**
- Plugin hooks are declared in `hooks/hooks.json` using the wrapper schema `{ "hooks": { "<Event>": [ { "matcher", "hooks": [ { "type": "command", "command", "timeout" } ] } ] } }`. This hook extends the agentboard plugin's existing `hooks/hooks.json`.
- **Command hooks receive their payload as JSON on stdin** with common fields `session_id`, `transcript_path`, `cwd`, `hook_event_name`. `SubagentStop` additionally carries `reason`.
- **`SubagentStop`** fires when a Task subagent finishes; **`SessionEnd`** fires once when the session ends.
- Scripts use `${CLAUDE_PLUGIN_ROOT}` for portable paths. Hooks load at session start (no hot-swap) and run in parallel.

**Evidence-handling standard:** ISO/IEC 27037 (identification, acquisition, preservation, chain of custody) governs the framing — capture evidence **at the source, at the time it is produced**, preserved intact and attributable. This is why per-subagent capture happens on `SubagentStop` rather than being deferred.

**Secret-handling rule (the plugin's own):** the AgentBoard `SessionStart` bootstrap declares the OAuth callback URL a secret that must never be logged, echoed, written to any artifact, or committed. A transcript from a session where authentication occurred may contain it; durable storage of transcripts must honor this rule.

## 4. Risk model

The hook's risk surface is small but specific. Stating it makes the integrity requirements controls rather than nice-to-haves.

- **Secret leakage** — a captured transcript may contain the OAuth callback URL (or other secrets) and durable storage would persist it. *Asset: credentials. Control: R5.*
- **Interference / availability** — a capture hook that blocks, errors, or materially delays would degrade the very orchestration it observes. *Asset: the workflow. Control: R6.*
- **Evidence integrity** — captured evidence that is incomplete, mis-attributed, or silently lossy is worse than none, because the audit would draw conclusions from a corrupted record. *Asset: the audit's soundness. Controls: R3, R7, R9, R11.*

## 5. Requirements

Each carries its source. "Confirmed need" = §1; "mechanism" = the verified hook facts in §3; "constraint" = fixed by circumstance.

- **R1** On `SubagentStop`, durably capture the finishing subagent's transcript. *(Mechanism; ISO 27037 capture-at-source.)*
- **R2** On `SessionEnd`, durably capture the orchestrator (main-session) transcript and finalize the run's manifest; capture as a backstop any subagent transcript not already captured. *(Mechanism; confirmed need.)*
- **R3** Maintain a per-run **manifest** linking each captured transcript to its AgentBoard `board_id` and `card_id` (extracted from the identifiers the orchestrator embeds in agent prompts), the agent type it represents, and ordering, so the manifest resolves `card → ordered list of (wave/agent-type, transcript reference)`. *(Confirmed need — this is the card↔transcript↔work join the remediation read-side depends on.)*
- **R4** Store captured transcripts and the manifest in storage that **survives the local retention horizon and is retrievable independent of the originating host** (i.e., not solely a path inside the pruned local transcript tree). *(Confirmed need — kills both B preconditions, retention and machine-locality.)*
- **R5** Before durable storage, **scrub secrets** from captured transcripts — at minimum the AgentBoard OAuth callback URL — and never persist a secret to durable storage. *(Plugin secret-handling rule.)*
- **R6** Operate as a **non-interfering side-effect**: never block, deny, or materially delay any tool call or the session; always terminate as success from the harness's perspective; capture failures are logged, not propagated. *(Availability risk.)*
- **R7** Capture **incrementally** — each subagent transcript is captured when that subagent finishes, not deferred to session end — so subagent evidence survives even if the session later terminates before `SessionEnd`. *(Evidence integrity; resilience.)*
- **R8** Be **robust to the unconfirmed payload shape**: locate each subagent's transcript via the known on-disk layout (the session's subagent transcript directory) rather than depending on an unverified payload field; if the payload supplies the subagent transcript path/id directly, use it. *(Mechanism — the one unconfirmed detail; constraint.)*
- **R9** Be **idempotent**: repeated or overlapping events do not duplicate, truncate, or corrupt captured transcripts or manifest entries. *(Evidence integrity; hooks run in parallel.)*
- **R10** **Gate to AgentBoard orchestration runs**: capture only when the session is an AgentBoard orchestration (detectable via AgentBoard tool usage / an embedded `board_id`); other sessions are a no-op. *(Confirmed need — avoid capturing unrelated sessions.)*
- **R11** Record **coverage** in the manifest: which subagents were captured, and any gaps (e.g., orchestrator transcript missing because `SessionEnd` did not fire), so the remediation read-side can tell whether B is complete for a run. *(Evidence integrity — honest gaps over silent loss.)*

## 6. Negative requirements

The hook must NOT: block, deny, or fail any tool call or the session; persist any secret (notably the OAuth callback URL) to durable storage; depend on payload fields not confirmed to exist; capture non-AgentBoard sessions; assume `SessionEnd` always fires (subagent capture must not depend on it); store transcripts in a way bounded by the AgentBoard artifact size limit when transcripts exceed it.

## 7. Edge cases and error handling

- **`SubagentStop` `transcript_path` is the parent's, or no agent id is provided:** locate the subagent transcript via the on-disk layout (R8); do not fail.
- **Session terminates before `SessionEnd`:** per-subagent captures are already durable (R7); the orchestrator transcript is absent — record the gap in the manifest (R11), do not error.
- **Transcript exceeds the AgentBoard artifact size limit (~500k chars):** use the durable store that handles large objects, not the standard artifact path. (Transcripts can be multiple MB.)
- **A secret appears in the transcript:** scrub before storage (R5); if scrubbing cannot be performed safely, skip durable storage of that transcript and record the omission rather than risk leakage.
- **Non-AgentBoard session:** no-op (R10).
- **Durable store unreachable at capture time:** log, fall back to a durable local copy if possible, mark the manifest entry degraded; never block (R6).
- **Hook not yet installed when a run executed (legacy run):** out of scope — the remediation type's best-effort path covers it; the boundary is explicit (§2).
- **Duplicate/parallel events for the same transcript:** idempotent (R9).

## 8. Constraints

- **Hook delivery:** command hooks receive stdin JSON with `session_id`, `transcript_path`, `cwd`, `hook_event_name`; `SubagentStop` adds `reason`. (The subagent-transcript-path semantics and any agent-id field are unconfirmed — see §11.)
- **Integration point:** extends the agentboard plugin's existing `hooks/hooks.json` (wrapper schema) with `SubagentStop` and `SessionEnd` entries; scripts under `${CLAUDE_PLUGIN_ROOT}/hooks/scripts/`.
- **Load timing:** hooks load at session start and cannot hot-swap — capture covers only sessions started after installation.
- **AgentBoard artifact size limit (~500k chars):** raw transcripts (multi-MB) cannot be stored as standard artifacts; the durable store must be a different mechanism.
- **Parallel, independent execution:** hooks do not see each other's output and have non-deterministic ordering.

## 9. Acceptance criteria

- For an AgentBoard orchestration run, after it completes, every card-agent's transcript and the orchestrator transcript are present in durable storage, and the manifest resolves each card to its ordered list of (agent-type, transcript) entries.
- The durable copies are retrievable after the local retention horizon would have pruned the originals, and from a host other than the one that ran the session.
- No captured transcript in durable storage contains the OAuth callback URL or other scrubbed secrets.
- Killing the session mid-run leaves all already-finished subagents' transcripts durably captured, with the missing orchestrator transcript recorded as a gap in the manifest.
- The hook never causes a tool call or session to block or fail, even when the durable store is unreachable.
- A non-AgentBoard session produces no captures.
- Running the same orchestration twice does not corrupt or cross-contaminate the two runs' captured sets.

## 10. Decisions made (with reasoning)

- **`SubagentStop` for per-subagent capture; `SessionEnd` for the orchestrator transcript + manifest finalization.** Subagent transcripts are the highest-value, most retention-sensitive evidence; capturing each the moment it exists (rather than at session end) makes capture resilient to a later crash. The orchestrator transcript is only complete at session end, so it is captured there.
- **Non-blocking side-effect (always succeed).** Evidence preservation must never degrade the workflow it observes; a capture failure is logged, never propagated.
- **Robustness over the unconfirmed payload field.** The subagent-transcript-path semantics are not doc-confirmed, but the on-disk layout is empirically known; locating via the layout makes the hook correct regardless of the payload's exact shape.
- **Scrub secrets before durable storage.** The plugin already treats the OAuth callback URL as a secret; persisting transcripts without scrubbing would be a leak path the plugin otherwise forbids.

## 11. Unresolved (decide at implementation)

- **Exact `SubagentStop` payload** — confirm empirically (inspect a real payload via `claude --debug`) whether `transcript_path` is the subagent's own and whether an agent id is present. *Decider: implementer.* Resolves how R1/R8 read the subagent transcript (directly vs via layout).
- **Durable-store target** — the concrete backend satisfying R4 (survives retention + machine-locality) within the artifact-size constraint: AgentBoard cloud upload, another remote/blob store, compression, etc. *Decider: architecture.* Must also satisfy R5 (no secrets) and R6 (non-blocking on store failure).
- **Manifest format** — the on-disk/stored shape of the card↔transcript↔work index. *Decider: architecture*, but it is the **contract with the remediation read-side** and must carry board_id, card_id, agent-type, ordering, and coverage (R3, R11).
- **Tier-0 precompute (FUTURE)** — whether to compute transcript signal profiles at capture time; if pursued, coordinate the profile format with the remediation-type read-side.

## 12. Dependencies & relationships

- **Consumed by the remediation project type** (separate spec) as its *guaranteed* B-layer retrieval path; the **manifest format (R3) is the contract** between the two. Without this hook, that type falls back to its best-effort disk-grep path (bounded by retention/locality).
- **No upstream dependencies** — this hook is buildable now, independently, and is the recommended first deliverable because it begins protecting every future run immediately.
