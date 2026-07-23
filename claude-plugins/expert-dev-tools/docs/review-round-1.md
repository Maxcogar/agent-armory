# Independent review — round 1 — expert-dev-tools implementation

**Verdict: NEEDS FIXES** (10 findings: 5 Serious [1 Systemic], 3 Moderate, 1 Minor, 1 Tentative).
**Reviewed:** the implementation on branch `claude/expert-dev-tools-plugin` against
`docs/plans/plan-expert-dev-tools.md` (and its spec + architecture). Performed by a neutral
general-purpose subagent under the expert-review skill, 2026-07-22.

This file is the verbatim finding set for the remediation planning session. Each finding is
stated as the reviewer reported it. Where the build agent already checked a finding against the
code, that assessment is noted as **[build-agent assessment]** — but the remediation planner
must re-derive every premise from current source; do not import these as settled.

---

## Confirmed platform facts (Context7 `/websites/code_claude`, verified 2026-07-22)

These were verified during the aborted remediation-planning attempt and are safe to rely on
(re-confirm if in doubt):

- **Plugin `.mcp.json` format:** every documented example — including the plugin-specific one
  ("Configure Plugin MCP Server in .mcp.json") — nests servers under a top-level `"mcpServers"`
  object. (The official context7/playwright plugins ship a *bare* server map without the
  wrapper; whether the bare form actually loads was **NOT** verified — do not assume it does or
  doesn't. The documented, standard-aligned form is the wrapper.)
- **Agent tool scoping:** *both* `tools` (allowlist) and `disallowedTools` (denylist) accept
  MCP server-level patterns `mcp__<server>` and `mcp__<server>__*`. If both fields are set,
  `disallowedTools` is applied first, then `tools` is resolved against the remaining pool.
  Omitting `tools` inherits all tools; a `disallowedTools`-only agent therefore retains every
  tool not explicitly denied (Agent, Task, WebFetch, all MCP tools, …).
- **`skills:` frontmatter:** documented as a YAML **sequence** (`skills:\n  - name`), not a
  scalar. (Whether a scalar value also preloads was not verified.)

Still unverified and load-bearing for the fix (the planner must resolve): the exact MCP tool
namespace a dispatched *plugin* agent sees for CodeGraph / codebase-RAG / Context7 / Clear-Thought
(bare `mcp__codegraph__*` vs plugin-namespaced `mcp__plugin_<x>_codegraph__*`), which determines
what a `tools` allowlist must name to preserve those agents' MCP access.

---

## S-1 (Serious) — `.mcp.json` uses a bare server map, not the `mcpServers` wrapper
- **Where:** `claude-plugins/expert-dev-tools/.mcp.json` (top level is `{"context7":…,"clear-thought":…}`).
- **Standard:** Claude Code plugin reference (the plan's own §3 / §11-C5 named standard).
- **Risk:** if the bare form is not recognized, the plugin ships no MCP servers → architecture D8
  and spec F-2 defeated, and preflight hard-fails on the missing MCPs.
- **Fix direction:** wrap in `{"mcpServers": { … }}`. Also fixes the M-1 masking below.
- **[build-agent assessment]** Contested severity: official plugins use the bare form and their
  servers load this session, so "won't load" is unproven — but the wrapper is the documented
  form and a safe change. **Re-derive: actually determine whether the bare form loads before
  deciding severity; do not pattern-match from the official plugins' shape.**

## S-2 (Serious, Systemic) — all nine agents scope tools with a `disallowedTools` denylist that inherits every other tool
- **Where:** all nine `agents/*.md` use `disallowedTools` and no `tools` field. Read-family
  agents deny `Write, Edit, NotebookEdit[, Bash]` + CORE-ingest; others deny only CORE-ingest.
- **Standard:** OWASP ASVS V1 least privilege / deny-by-default — the exact standard architecture
  D11 names and the plan restates in S6 ("a `tools` allowlist scoped to its phase").
- **Why it fails:** `disallowedTools` inherits all un-denied tools, so a "read-only" reviewer
  still holds Agent/Task/WebFetch and arbitrary MCP tools — not read-only by capability. D11(3)'s
  guarantee ("scoping turns 'reviewer is read-only' from instruction into capability boundary")
  is not delivered; weakens the T1 gate-gaming / reviewer-independence (IEEE 1028) control.
  Systemic: all nine production agents.
- **Fix direction:** replace with an explicit `tools:` allowlist per phase (reviewer/verifier/
  acceptance/diagnostician: read tools + `Skill` + the MCP tools their skill needs [+ `Bash`
  where they re-execute checks]; implementer: edit tools; closeout: `Bash`+edit for git). Keep
  CORE-ingest out by construction; a `disallowedTools: <CORE-ingest>` alongside the allowlist is
  a defensible belt-and-suspenders (both fields may coexist).
- **Open engineering question the planner must answer:** what exact tool names / MCP patterns the
  allowlist must list so read-only agents keep the CodeGraph/RAG/Context7 access their skills use,
  given the unresolved plugin MCP-namespace question above. (Note: the expert-review verification
  taxonomy explicitly permits Grep+Read as a fallback when structural tools are absent, so a
  reviewer allowlisted to Read/Grep/Glob/Skill is degraded-but-functional — this may bound the
  problem.)
- **[build-agent assessment]** Accepted. The build used `disallowedTools` deliberately (plan D-P6,
  MCP-namespacing robustness) but that traded away the least-privilege property the plan required.

## S-3 (Serious) — F-14 systemic-defect routing and failed-correction escalation are unimplemented (dead variable)
- **Where:** `workflows/expert-lifecycle.js` — `const feedbackEscalation = dispositions.find(d => d.verdict === 'systemic_defect' || d.verdict === 'failed_correction')` (~line 291) is never read again. `dispositions` is only surfaced as `feedback:` on the spec/closeout returns; the architecture/plan/implement/ground-truth segments compute the sweep and drop it. No segment dispatches the diagnostician in failure mode for a `systemic_defect`; no path escalates a `failed_correction`.
- **Standard:** spec F-14 / architecture D13–D15 / acceptance A-9(b).
- **Why it fails:** A-9(b) ("`failed_correction` escalates … no remediation dispatch") cannot be
  satisfied because no escalation path exists. The diagnosis layer the plugin is built around does
  not act on repeat complaints.
- **Fix direction:** on `feedbackEscalation`, route `systemic_defect` into the F-13
  diagnostician→amend path with `responsible_component` as target; return an owner escalation for
  `failed_correction` (original diagnosis + applied correction, no remediation dispatch). Surface
  `feedback` on every segment's report so the command persists markers/signatures wherever the
  segment ends.
- **[build-agent assessment]** Confirmed real (dead variable in code the build agent wrote).

## S-4 (Serious) — the `ledger_delta` omits `artifacts[]` and `escalations[]`; `artifact_index` is never populated; D9/T3 hash-integrity is inert
- **Where:** `workflows/expert-lifecycle.js` — `const delta = { phase, gate_history:[], amendments:[], budget:{…} }`; no phase adds an artifact registration or an escalation record. `commands/expert.md` step 4 is told to append `gate_history`/`amendments`/`escalations` but never to register artifacts into `artifact_index`; step 2 initializes `artifact_index: []` and nothing adds to it.
- **Standard:** the architecture's SEGMENT_REPORT protocol (`ledger_delta: {phase, artifacts[],
  gate_history[], amendments[], budget}`) + OWASP ASVS V8 data integrity (D9 hash anchoring, T3).
- **Why it fails:** with `artifact_index` permanently empty, the command's re-hash loop iterates
  nothing → amendment detection (F-8), approval invalidation on drift, and the spec-hash →
  `spec_traceable` escalation (D9) are all non-functional. Escalations are never recorded despite F-7.
- **Fix direction:** flow each phase agent's `artifact_path`+content hash into `delta.artifacts[]`
  and gate firings into `delta.escalations[]`; instruct the command to upsert `artifact_index`
  (path, sha256, approval state) and append `escalations`. Set `approved_by_owner` on the spec at
  intent approval so D9's approval-invalidation has a target.
- **[build-agent assessment]** Confirmed real.

## S-5 (Serious) — nothing advances the lifecycle past the intent gate; `spec_ready` is set and never consumed
- **Where:** `workflows/expert-lifecycle.js` — on spec PASS sets `delta.phase = 'spec'` and
  `delta.spec_ready = true` (dead), returns the intent gate. On resume, `cursor = ledger.phase ||
  'intake'` → `'spec'` → re-enters the spec block → intent gate again. `commands/expert.md`
  step 5 tells the owner to "re-invoke `/expert resume`" with no instruction to set
  `phase = 'architecture'`.
- **Standard:** spec §3.2 lifecycle progression (Run 2 begins at architecture after intent approval).
- **Why it fails:** the happy path stalls at the intent gate; acceptance A-3 cannot occur.
- **Fix direction:** on intent approval, advance `phase` to `'architecture'` — either the workflow
  sets `delta.phase = 'architecture'` on spec PASS, or an explicit command step sets it when the
  owner approves the intent gate (and records the spec approval per S-4).
- **[build-agent assessment]** Confirmed real.

## M-1 (Moderate) — the structural suite doesn't run the real workflow linter A-2 requires, and masks S-1
- **Where:** `tests/structural/check-structure.mjs` — checks the workflow with `node --check` + a
  hand-rolled banned-token regex instead of `validate-workflow.mjs`; reads `.mcp.json` as
  `mcp.mcpServers || mcp`, so `T-A2c … declares context7 + clear-thought` passes on the malformed
  (bare) file.
- **Standard:** ISO/IEC/IEEE 29119 — substituting a weaker oracle for the specified one gives
  false assurance (A-2 names "the workflow-creator linter"). The workflow does pass the real
  linter when run directly.
- **Fix direction:** invoke the real `validate-workflow.mjs`; read `.mcp.json` strictly
  (`mcp.mcpServers` only).

## M-2 (Moderate) — `maybeNonConvergence` writes `phase = 'implementation'`, not in the ledger `phase` enum
- **Where:** `workflows/expert-lifecycle.js` — `delta.phase = phaseName.toLowerCase()` yields
  `'implementation'` for the Implementation gate; `scripts/ledger.schema.json` `phase` enum has
  `implement` / `implementation_review`, not `implementation`.
- **Standard:** internal contract consistency (S3 schema vs S7 workflow); breaks §8 resumability
  / A-5 on that path (next preflight's `validate-ledger.mjs` rejects the ledger).
- **Fix direction:** emit `'implementation_review'` (or `'implement'`) — a value in the enum.

## M-3 (Moderate) — the A-4b and A-4c forced-failure fixtures named in plan S11 were not created
- **Where:** `tests/fixture/agents/` has only `forced-fail-reviewer.md` (A-4d) and
  `forced-unauthorized-implementer.md` (A-4a). A-4b (fabricated-verification variant) and A-4c
  (spec with a seeded contradiction) exist only as prose in `tests/ACCEPTANCE.md`.
- **Standard:** plan §5 / S11 deliverable completeness. A-4b requires the plant to sit at the
  sampler-selected index (`sampleIndices`, seed = revision+1) — currently left to hand-computation.
- **Fix direction:** commit the A-4b fabricating-implementer variant (plant index derived from the
  sampler) and the A-4c contradictory fixture spec.

## Mn-1 (Minor) — the feedback-sweep dispatch under-specifies script and transcript locations
- **Where:** `workflows/expert-lifecycle.js` — the sweep prompt says "via
  `scripts/extract-owner-turns.mjs`" with no `${CLAUDE_PLUGIN_ROOT}` (the workflow can't
  interpolate it) and no transcript directory (`~/.claude/projects/<sanitized-cwd>/`).
- **Standard:** first-principles — a dispatched agent given neither the absolute script path nor
  the input directory must guess both; the sweep can silently no-op, undermining A-8.
- **Fix direction:** pass the resolved plugin-root script path and the project transcript
  directory in the dispatch args (the command resolves and injects them).

## T-1 (Tentative) — `skills:` frontmatter uses a scalar, docs show a sequence
- **Where:** every `agents/*.md` uses `skills: expert-dev-tools:<name>` (scalar); the sub-agents
  doc shows `skills:` as a YAML sequence. If the scalar form does not preload, the agent runs
  frameless (the "quality premise fails silently" risk the plan flags in S1) — mitigated only by
  the system-prompt Skill-invocation fallback.
- **Verification gap that closes it:** a live plugin-load probe confirming whether `skills:
  <scalar>` preloads, or a docs statement that scalar and sequence are equivalent. Docs show the
  sequence; the safe fix is to convert all agents to the sequence form.

---

## What the reviewer confirmed is correct (do not re-do)
- **R-1 skill repairs (S1/S2 of the plan):** the five verbatim skills and two de-nested skills are
  byte-identical to source; expert-spec/expert-review unescape is provably lossless (only
  backslashes removed; zero residual escapes). Met precisely.
- **Ledger schema + validator:** correct; unit suite 16/16; validator implements exactly the
  draft-2020-12 keyword subset the schema uses; T-U1 cases forward-derived (not backward-fabricated).
- **Transcript reader:** marker semantics correct at boundaries; T-U2 6/6.

## Reviewer's recommended fix priority
1. **S-4 + S-5 together** (command↔workflow delta contract) — they block the core loop.
2. **S-1** (+ M-1's masking in the same pass).
3. **S-3** (wire the dead `feedbackEscalation`).
4. **S-2** (convert nine agents to `tools` allowlists).
5. **M-2, M-3, Mn-1, T-1.**

## Next step (per the expert-implement review-handoff discipline)
Findings route to a planning step (expert-plan) for a remediation plan, then re-run expert-implement
against that plan; fixes go through the plan, never informally. The remediation planner must
re-derive every premise from current source — including actually determining whether the bare
`.mcp.json` loads and what MCP namespace a plugin agent sees — rather than importing this file's
assessments as settled.
