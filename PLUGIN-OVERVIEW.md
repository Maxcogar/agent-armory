# AgentBoard Claude Code Plugin — Reference

This document describes the `agentboard` Claude Code plugin at
`claude-plugins/agentboard/` for the purpose of guiding changes to
the AgentBoard cloud application that backs it.

## How to read this document

The document is purely descriptive. It records what each piece of the
plugin does, what each command produces as output, and where each
output is stored today. It does **not** explain *why* the plugin is
shaped the way it is, *why* any decision was made, or what *should*
change. Those judgments belong to the team designing the app update.

Two kinds of statements appear:

- **Workflow statements** — what the plugin does. These trace to the
  source files in `claude-plugins/agentboard/`.
- **App-fit statements** — where each plugin output is stored today,
  and whether the app's data model has a native entity for it. These
  also trace to the source files (column names, artifact types, tool
  names) plus one piece of user-stated framing that is attributed
  inline where it appears.

If a statement appears as a workflow statement, the workflow needs it
and any app change must preserve it. If a statement appears as an
app-fit statement, it is a fact about the current storage location of
an output — the app team decides whether the app's data model should
gain a native entity for that output.

The document does not propose entity names, schemas, or migration
plans. It records outputs and storage locations.

Files and folders explicitly excluded from this document by user
instruction: `AGENTS.md`, `user-notes.txt`, `dev-work-resources/`,
`agents/`, `reference/`.

### A note on terminology used throughout

A **workspace card** (or just "card") is a single unit of work on a
workspace board. Every workspace card, once created in column
`backlog`, passes through **all four work waves** in this fixed order:

```
backlog → planning → review → implementation → audit → finished
```

A card is **not** assigned to a single wave. Wave 1 (Planning) plans
the card; Wave 2 (Review) validates the plan; Wave 3
(Implementation) executes it; Wave 4 (Audit) verifies the result.
The same card is the unit each wave operates on.

For this reason, the document never refers to a card as a "planning
card," "implementation card," or "audit card." All workspace cards
produced by `/architecture` (one per Card Slice) and by `/sweep`
(one per finding group) progress through every wave; no wave is
skipped for normal cards.

The one exception is the **scaffold card** that `/architecture`
creates in step 5 — that card holds the pipeline's four artifacts
and moves directly from `backlog` to `finished` in step 20. The
scaffold card is named out explicitly wherever it appears; it is the
only card the plugin produces that does not progress through the
work waves.

---

## Table of contents

1. [Plugin manifest and file map](#1-plugin-manifest-and-file-map)
2. [MCP wiring](#2-mcp-wiring)
3. [The two workflows the plugin drives](#3-the-two-workflows-the-plugin-drives)
4. [The architecture pipeline inside `/architecture`](#4-the-architecture-pipeline-inside-architecture)
5. [Commands](#5-commands)
6. [Skills](#6-skills)
7. [Hooks](#7-hooks)
8. [Companion MCP servers](#8-companion-mcp-servers)
9. [Output inventory and storage map](#9-output-inventory-and-storage-map)

---

## 1. Plugin manifest and file map

### 1.1 Manifest

`claude-plugins/agentboard/.claude-plugin/plugin.json`:

```json
{
  "name": "agentboard",
  "version": "0.3.0",
  "description": "AgentBoard AI project management toolkit — phase-based project workflow plus workspace boards (apps, boards, cards, artifacts) for ad-hoc agent orchestration, with codegraph and RAG companion tools. Cloud-hosted MCP at mcp.agent-board.app.",
  "author": { "name": "Maxcogar" },
  "hooks": "./hooks/hooks.json"
}
```

### 1.2 File map

Files inside `claude-plugins/agentboard/` that this document covers:

```
.claude-plugin/plugin.json
.mcp.json
README.md
commands/
  architecture.md
  board-status.md
  foundation.md
  kickoff.md
  orchestrate.md
  pickup.md
  status.md
  sweep.md
  wrap-up.md
hooks/
  hooks.json
  scripts/
    artifact-quality-gate.sh
    inject-quality-gate-prompt.sh
    validate-architecture-artifact.sh
    workspace-card-guidance.sh
skills/
  agentboard/SKILL.md
  codebase-rag/SKILL.md
  codebase-sweep/SKILL.md
  expert-standards/SKILL.md
  workspace-orchestration/SKILL.md
```

The `docs/` subtree exists in the plugin directory and contains plan,
handoff, and spec working files. This document does not cover its
contents.

---

## 2. MCP wiring

`claude-plugins/agentboard/.mcp.json` declares four MCP servers:

| Server | Transport | Endpoint or command |
|---|---|---|
| `agentboard` | http | `https://mcp.agent-board.app/mcp` |
| `codegraph` | stdio | local `node` invocation of `codegraph-mcp/dist/index.js` |
| `codebase-rag` | stdio | local `python` invocation of `codebase-rag/mcp-server-python/server.py` |
| `clear-thought` | stdio | `npx -y -p @waldzellai/clear-thought mcp-server-clear-thought` |

The two local stdio paths in the shipped `.mcp.json` are absolute
Windows paths and must be edited for other installations.

`README.md` documents the install procedure for the plugin and the
two local stdio servers, and lists the three servers it instructs
users to enable in `.claude/settings.local.json`. The four servers
declared in `.mcp.json` are used by the workflows the plugin drives;
they are not optional decoration.

---

## 3. The two workflows the plugin drives

`skills/agentboard/SKILL.md` §0 ("Mental model — read this first")
documents two parallel workflows on the cloud backend. They share the
auth surface, the activity log, the `agent_id` convention, and the
companion MCPs, but are otherwise independent.

### 3.1 Phase-based projects

Source: `skills/agentboard/SKILL.md` §3.1.

Each project moves through a fixed 13-phase sequence. Phases 1–9 each
have a required document; phases 10–12 are free-form implementation
phases; phase 13 is terminal.

| Phase | Name | Document |
|-------|------|----------|
| 1 | Initialization | none (auto-completed) |
| 2 | Codebase Survey | `codebase_survey` |
| 3 | Requirements | `requirements` |
| 4 | Constraints | `constraints` |
| 5 | Risk Assessment | `risk_assessment` |
| 6 | Architecture | `architecture` |
| 7 | Contracts | `contracts` |
| 8 | Test Strategy | `test_strategy` |
| 9 | Task Breakdown | `task_breakdown` |
| 10 | Implementation | none |
| 11 | Verification | none |
| 12 | Review | none |
| 13 | Complete | none |

Each milestone task is auto-created by the cloud server for phases
1–8 and linked to a phase document. Phase 9 has a document but no
milestone task; the document is submitted manually.

The skill states (§3.2) that the milestone task's status is a
reflection of document status, managed automatically by the server's
milestone-sync logic. Agents fill the document, call
`agentboard_submit_document` with content and notes; the call blocks
until a human approves or rejects through the UI.

For doc phases (2–9) the human advances the phase after document
approval; agents call `agentboard_advance_phase` only during phases
10–12.

The plugin's `/kickoff`, `/pickup`, `/wrap-up`, and `/status`
commands operate against this workflow.

### 3.2 Workspace boards

Source: `skills/agentboard/SKILL.md` §0 and §2.6.

The workspace surface models work as **apps → boards → cards →
artifacts**. Every workspace card moves through six fixed columns in
this order:

```
backlog → planning → review → implementation → audit → finished
```

Rejections from `review` send the card back to `planning`. Audit
failures send the card back to `implementation`
(per `skills/workspace-orchestration/SKILL.md` "Handle Failures").

A board has an `auto_transitions` setting `{review_blocking,
audit_blocking}` that controls whether `/orchestrate` pauses for
human confirmation at the corresponding checkpoint.

The `/orchestrate` command runs four parallel-subagent waves against
a board, where each wave's input column is the column the previous
wave's output transitioned cards into:

| Wave | Input column | Output column | Subagent type(s) |
|---|---|---|---|
| 1 — Planning | `backlog` | `review` (on submit) | `planning-research-agent` (Phase A) → `plan-compose-agent` (Phase B) |
| 2 — Review | `review` | `implementation` (accept) or `planning` (reject) | `review-agent` |
| 3 — Implementation | `implementation` | `audit` (on submit) | `implementation-agent` |
| 4 — Audit | `audit` | `finished` (PASS) or `implementation` (FAIL) | `audit-research-agent` (Phase A) → `audit-compose-agent` (Phase B) |

A single workspace card is the unit each wave operates on. The same
card is planned in Wave 1, reviewed in Wave 2, implemented in Wave
3, and audited in Wave 4. No wave is skipped.

Artifacts on a card are typed, append-only outputs. There is no edit
or delete; a `column_at_creation` field is captured on each artifact
for audit context.

The skill's §2.6 table lists eight recognized artifact types and the
hook each one triggers:

| Type | Produced by | Triggers gate |
|---|---|---|
| `plan` | `plan-compose-agent` (Wave 1 Phase B) | `artifact-quality-gate` |
| `review_note` | `review-agent` (Wave 2) | `artifact-quality-gate` |
| `implementation_note` | `implementation-agent` (Wave 3) | `artifact-quality-gate` |
| `audit_report` | `audit-compose-agent` (Wave 4 Phase B) | `artifact-quality-gate` |
| `ARCH_FACTS_BUNDLE_V2` | `architecture-research-agent` | `validate-architecture-artifact` |
| `ARCH_BUNDLE_AUDIT_V2` | `architecture-classification-auditor` | `validate-architecture-artifact` |
| `architecture_document` | `architecture-compose-l{1,2,3}` | `validate-architecture-artifact` |
| `ARCH_DESIGN_REVIEW_V1` | `architecture-design-reviewer` | `validate-architecture-artifact` |

The four `plan` / `review_note` / `implementation_note` /
`audit_report` types are produced one per card per wave by the
`/orchestrate` pipeline as a card progresses through `planning`,
`review`, `implementation`, and `audit`. The four `ARCH_*` and
`architecture_document` types are produced by the `/architecture`
pipeline before any card has been created from a Card Slice; §4
below describes how they are attached to the workspace surface.

### 3.3 Command sequence the skill names

Source: `skills/agentboard/SKILL.md` §0 ("The /-commands are the
entry points") and `commands/foundation.md` step 7 ("Hand off").

The skill names typical sequences:

- New project of substantial scope: `/foundation` → `/architecture`
  → `/orchestrate`. `/orchestrate` then runs every wave (planning →
  review → implementation → audit) on the cards `/architecture`
  produced.
- Ad-hoc cleanup: `/sweep` → `/orchestrate`. `/orchestrate` runs the
  same four waves on the cards `/sweep` produced.
- Phase-based project: `agentboard_create_project` → milestone loop
  through phases 1–9 → implementation tasks in phases 10–12.

The `/foundation` command's hand-off block at step 7 instructs the
user to start a new session and run `/architecture <spec-path>` after
the spec is approved.

The `/architecture` command's step 21 summary instructs the user to
start a new session and run `/orchestrate`.

---

## 4. The architecture pipeline inside `/architecture`

This section describes the 21-step pipeline `/architecture` runs.
Per-step details are in §5.2; this section gives the pipeline-level
shape and inventories the artifacts and identifiers it produces.

### 4.1 Pipeline phases

Source: `commands/architecture.md` "Pipeline overview".

```
/foundation produces docs/specs/<file>.md
   ↓
/architecture orchestrates:
  research wave   : architecture-research-agent          → ARCH_FACTS_BUNDLE_V2
  audit wave      : architecture-classification-auditor  → ARCH_BUNDLE_AUDIT_V2  (verified level)
  compose wave    : architecture-compose-l<N>            → architecture_document + docs/arch/<file>.md
  review wave     : architecture-design-reviewer         → ARCH_DESIGN_REVIEW_V1
  user approval   : the orchestrator displays the document and the review; the user approves, requests changes, or rejects
  commit + cards  : the orchestrator commits the architecture document and creates one workspace card per slice
   ↓
/orchestrate runs planning → review → implementation → audit on those cards
```

Note the last line: `/orchestrate` runs all four waves on the cards
this pipeline creates. The cards `/architecture` step 19 creates land
in column `backlog`; `/orchestrate` Wave 1 then picks them up for
planning, and they progress through every subsequent wave.

### 4.2 Subagents

The `/architecture` command spawns five subagent types in sequence.
Their roles, per the command file:

| Subagent | Phase of /architecture | Produces |
|---|---|---|
| `architecture-research-agent` | research wave | `ARCH_FACTS_BUNDLE_V2` |
| `architecture-classification-auditor` | audit wave | `ARCH_BUNDLE_AUDIT_V2` |
| `architecture-compose-l1` / `-l2` / `-l3` | compose wave | `architecture_document` plus the file at `docs/arch/<file>.md` |
| `architecture-design-reviewer` | review wave | `ARCH_DESIGN_REVIEW_V1` |

The level used to dispatch between `architecture-compose-l1`, `-l2`,
and `-l3` is the `verified_level` field on the audit artifact. The
classification rule names that determine that level are listed in
§4.4.

### 4.3 The scaffold card

Source: `commands/architecture.md` steps 5 and 20.

Step 5 calls `agentboard_create_workspace_card` with:

- title: `Architecture: <spec topic>`
- description: `Architecture flow scaffold. Holds research bundle,
  audit, architecture document, and design review artifacts during
  the level-aware architecture pipeline. Will be moved to finished
  after cards are created from the architecture's slices.`
- status: `backlog`

The scaffold card's `card_id` is captured as `scaffold_card_id` and
is the target of every subsequent artifact submission, card-note
write, and artifact-listing call inside the pipeline.

Step 20 moves the scaffold card to `finished` after the workspace
cards (one per Card Slice) have been created from the architecture
document.

**App-fit note.** The scaffold card sits in column `backlog` for the
entire `/architecture` run and is transitioned directly to `finished`
in step 20. It does not progress through any of the four work waves
(`planning`, `review`, `implementation`, `audit`) — the scaffold card
itself is not picked up by `/orchestrate`. (`/orchestrate` Wave 1
collects from column `backlog`, but the cards it operates on are the
ones created in `/architecture` step 19 from the architecture
document's Card Slices, not the scaffold card.) The four artifacts
attached to the scaffold card are pipeline-scoped outputs (one set
per `/architecture` run), not card-scoped outputs of a card that
progresses through the work waves. The user-stated framing for this
document records that the architecture stage has no clear place on
the kanban board the app provides; the scaffold card is the structure
the plugin uses today to attach the four pipeline artifacts to the
workspace surface.

### 4.4 Classification rules and levels

Source: `hooks/scripts/validate-architecture-artifact.sh`
`compute_level_from_classification` and its preceding comment block.

The rule set is named `rules_version: "1.0"` in the bundle and audit
artifacts. Rules:

- L3 triggers (any one of these): `R-L3-EXT`
  (`external_system_count ≥ 1`), `R-L3-MIG`
  (`migration_signals_present == true`), `R-L3-SEC`
  (`security_relevant_keyword_hits ≥ 3`), `R-L3-CONTRACTS`
  (`new_contracts_count ≥ 3`), `R-L3-CARDS`
  (`expected_card_count_band.upper ≥ 8`).
- L2 triggers (any one of these, if no L3 fired):
  `R-L2-NEW-CONTRACTS` (`new_contracts_count ≥ 1`), `R-L2-TRUST`
  (`trust_boundaries_introduced == true`), `R-L2-MOD-CONTRACTS`
  (`existing_contracts_modified_count ≥ 2`), `R-L2-COUPLING`
  (`coupling_hotspot_overlap == true`).
- Otherwise L1.

The rule is re-evaluated by the validation hook on submission (rule
R-BUNDLE-5) to confirm the bundle's declared `computed_level`
matches.

### 4.5 The four pipeline artifacts

Each of the four architecture-pipeline artifacts is submitted via
`agentboard_submit_workspace_artifact` against `scaffold_card_id`.
The PreToolUse hook tree (§7.2) validates each on submission.

#### 4.5.1 `ARCH_FACTS_BUNDLE_V2`

Source: `hooks/scripts/validate-architecture-artifact.sh` rules
R-BUNDLE-1..5; `commands/architecture.md` step 6.

- Content body begins with the literal sentinel line
  `ARCH_FACTS_BUNDLE_V2` followed by a JSON object.
- `schema_version: "2.0"`, `rules_version: "1.0"`.
- Top-level fields required: `classification_fields`, `design_fields`,
  `rule_evaluation`, `spec_path`, `spec_hash`, `agent_metadata`.
- `classification_fields` required entries, each with `value` and
  `evidence`: `new_contracts_count`,
  `existing_contracts_modified_count`, `trust_boundaries_introduced`,
  `migration_signals_present`, `external_system_count`,
  `expected_card_count_band` (with `lower`, `upper`, `evidence`),
  `coupling_hotspot_overlap`, `security_relevant_keyword_hits`.
- `design_fields` required entries: `files_relevant`,
  `dependency_edges`, `blast_radius`, `existing_patterns_hits`,
  `constraint_hits`, `external_libraries`, `open_questions`.
- `rule_evaluation.computed_level` is an integer in `{1,2,3}` and
  matches the re-evaluation of the rule set in §4.4 against the
  bundle's own `classification_fields`.

#### 4.5.2 `ARCH_BUNDLE_AUDIT_V2`

Source: rules R-AUDIT-1..4; `commands/architecture.md` steps 8–9.

- Content body begins with the literal sentinel line
  `ARCH_BUNDLE_AUDIT_V2` followed by a JSON object.
- `schema_version: "2.0"`, `rules_version: "1.0"`.
- `field_verdicts` covers all 15 required entries (8 classification +
  7 design fields). Each entry has `verdict` ∈ `{PASS, DISCREPANCY}`
  and a non-empty `method`.
- `verified_level` is an integer in `{1,2,3}`.
- `any_discrepancy` is a JSON boolean.
- If `any_discrepancy == true`: `corrected_bundle` is a JSON object
  and `recomputed_level` is an integer in `{1,2,3}`.
- The audit carries a back-reference field `audited_bundle_artifact_id`
  that identifies the bundle artifact the audit was performed against.
  Step 9 of `commands/architecture.md` documents that compose's Step 2
  and the design reviewer's Step 2(c) each fetch the audit and resolve
  the verified bundle from it: either reading `corrected_bundle`
  directly (when `any_discrepancy == true`) or fetching the original
  bundle by `audited_bundle_artifact_id` and parsing it (when
  `any_discrepancy == false`).

#### 4.5.3 `architecture_document`

Source: rules R-DOC-1..7; `commands/architecture.md` steps 11–13.

The artifact is submitted via `agentboard_submit_workspace_artifact`
with `artifact_type` `architecture_document` and the document body as
`content`. The compose agent also writes the same content to disk at
`docs/arch/architecture-<spec-basename>.md`. Step 13 of
`commands/architecture.md` verifies the file exists at the exact
computed path using `Glob`.

Structural rules per R-DOC-1..7:

- **R-DOC-1** — first-level marker present:
  `^\*\*Level:\*\* L[123]\r?$`.
- **R-DOC-2** — level-specific required heading sequence present in
  subsequence order. The required sequences are (verbatim from the
  hook):
  - L1: `# Architecture — `, `## Goal`, `## Scope`, italic
    attestation line beginning `_At L1, the slice Descriptions`,
    `## Card Slices`, `## Limitations`,
    `## Standards governing this architecture`,
    `## Status of this architecture`.
  - L2: `# Architecture — `, `## Goal`, `## Scope`,
    `## Components and structure`, `## Design decisions`,
    `## Card Slices`, `## Traceability matrix`,
    `## Limitations and trade-offs`,
    `## Standards governing this architecture`,
    `## Status of this architecture`.
  - L3: as L2 plus
    `## Quality characteristics addressed (ISO/IEC 25010:2023)`
    between Components and Design decisions.
  - L3 co-occurrence: if `## Threat model` is present, then
    `## ASVS verification mapping` must also be present.
- **R-DOC-3** — the `## Card Slices` section contains at least one
  `### ` sub-heading.
- **R-DOC-4** — every Card Slice contains all eight required field
  bullets: `Description`, `Allowed-touch list`,
  `Forbidden-touch list`, `Produces`, `Consumes`,
  `Verification scope`, `Depends on`, `Source decisions`.
- **R-DOC-5** — every `R#` and `Q#` identifier from the spec appears
  in either `## Traceability matrix` or a slice's `Source decisions`
  field. The hook consults `AGENTBOARD_SPEC_PATH` if set; otherwise
  falls back to a non-empty traceability-matrix check at L2 and L3.
- **R-DOC-6** — at L2 and L3, every `D#` referenced in a slice's
  `Source decisions` is defined in the `## Design decisions` section.
- **R-DOC-7** — no two slices declare overlapping allowed-touch file
  paths unless the substring "overlap justified" appears in the
  Description of one of the sharing slices.

#### 4.5.4 `ARCH_DESIGN_REVIEW_V1`

Source: rules R-REVIEW-1..4; `commands/architecture.md` steps 14–15.

- Content body begins with the literal sentinel line
  `ARCH_DESIGN_REVIEW_V1` followed by a JSON object.
- `findings` is an array (possibly empty). Each finding requires:
  - `id` matching `^F[1-9][0-9]*$`, unique within `findings`.
  - `severity` ∈ `{blocker, serious, minor}`.
  - `category` ∈ `{missing-decision, unjustified-slice,
    contract-mismatch, standards-decoration, decision-hiding,
    deferred-decision, other}`.
  - Non-empty strings: `summary`, `details`,
    `document_citation.section`, `document_citation.quoted_text`,
    `suggested_resolution`.
  - `document_citation.decision_id_or_slice_name` is a string or
    null.
- `summary.{blocker,serious,minor}_count` are non-negative integers
  equal to the per-severity counts in `findings`; their sum equals
  `len(findings)`; when `findings` is non-empty,
  `findings[i].id == "F" + str(i+1)` for every i.
- `audit_artifact_id` is a non-empty string. The comment in
  `validate-architecture-artifact.sh` records this as the
  design-reviewer's seam: "the reviewer resolves the verified bundle
  from this audit artifact id per the §1.6 boundary contract."

### 4.6 The correction loop

Source: `commands/architecture.md` step 17 and "Operating rules".

When the user requests substantive corrections after step 16
(document + review display), step 17 routes the correction to one of
three targets:

- `architecture-document` — re-enter the same compose agent (by
  level) in correction mode, passing `correction_request_json`,
  `prior_architecture_document_path`, and
  `prior_architecture_document_artifact_id`. Then repeat steps 12–16
  on the same `scaffold_card_id`.
- `verified-bundle` — re-run from the research wave: repeat steps
  6–16 on the same `scaffold_card_id`. On this re-run, the research
  agent is invoked with `force_remeasure: true` so its prior-bundle-
  reuse check is suppressed.
- `spec` — surface that the issue is spec-origin and hand off to the
  external spec-modification path; the in-`/architecture` correction
  loop stops.

A `correction_round_count` is maintained per run with a cap of 3.
Beyond the cap, the run hands off to an external investigator path
and writes the handoff to the scaffold card's notes and the activity
log.

Step 17 also distinguishes "minor" corrections (wording, missed
traceability row, typo, non-substantive rewording of a single
sentence) which are applied via `Edit` directly to the file at
`architecture_document_path` without re-entering compose.

A `--pause` flag (or the bare token `pause`) on the `/architecture`
command argument opts the user into a pause before each routed
substantive correction round. The pause is separate from the board's
`auto_transitions` and does not modify board settings.

**App-fit note.** The correction-round state — which routes have been
taken, the round count, per-round provenance, the cap-3 investigator
handoff — is held as orchestration state inside the `/architecture`
slash command for the duration of the run, with persistent records
written only to the scaffold card's notes (via
`agentboard_update_workspace_card`) and the activity log (via
`agentboard_add_log_entry`). The scaffold card does not change
columns during the correction loop. The `--pause` flag is local to
the `/architecture` command and is not stored on the board or the
card.

### 4.7 Artifact-id snapshot-and-diff

Source: `commands/architecture.md` "Operating rules" and the per-step
text at steps 6/7, 8/9, 11/12, and 14/15.

Before spawning each architecture-pipeline subagent, the orchestrator
calls `agentboard_list_workspace_artifacts` on the scaffold card and
captures the set of existing artifact IDs as a snapshot variable
(e.g., `pre_research_artifact_ids`). After the subagent finishes, the
orchestrator lists artifacts again and diffs against the snapshot;
the artifact IDs not present in the snapshot are the ones that
subagent produced. The orchestrator selects the new artifact by
`artifact_type` and binds it by exact ID (e.g.,
`audited_bundle_artifact_id`, `audit_artifact_id`,
`architecture_document_artifact_id`) for the rest of the round.

Step 9's text describes this discipline as "single-seam": the
`audit_artifact_id` is the only identifier the orchestrator threads
forward to both the compose agent (step 11) and the design reviewer
(step 14), and each consumer resolves the verified bundle from the
audit itself.

The "Operating rules" section records this as a hard rule:

> Bind every pipeline artifact (bundle, audit, architecture document,
> design review) by the exact ID captured via the snapshot-and-diff
> in steps 6/7, 8/9, 11/12, and 14/15 for that round. Never re-resolve
> any of them by a type-only lookup that could match a prior round's
> artifact after a step-17 re-run.

This discipline is workflow; any app change that re-shapes how
architecture-pipeline artifacts are stored must preserve the ability
to bind a specific produced artifact by an exact ID and the ability
to resolve the verified bundle by following the audit's
`audited_bundle_artifact_id` back-reference.

---

## 5. Commands

All commands assume the agentboard MCP is authenticated. The
`SessionStart` hook (§7.1) bootstraps OAuth automatically.

The descriptions below record what each command file instructs. Step
numbering follows the command files.

### 5.1 `/foundation`

File: `commands/foundation.md`.

Steps:

1. Identify the target codebase; confirm the absolute path with the
   user.
2. Load `codegraph` and `rag` tools via `ToolSearch`; run
   `codegraph_scan` on the target project.
3. Activate the `spec-writing` skill via the `Skill` tool.
4. Follow the skill's process. Architecture-shaped questions surface
   only into the spec's "What's still unresolved?" section with
   `/architecture` as the resolver; they do not enter the body.
   Output goes to `docs/specs/YYYY-MM-DD-<kebab-name>.md`.
5. Show the spec to the user; iterate until explicitly approved.
6. Commit the spec to git on the current branch.
7. Display the "Foundation Complete" hand-off block instructing the
   user to start a new session and run `/architecture <spec-path>`.

`/foundation` does not create workspace cards. The command's "Key
Principles" section states the spec is architecturally silent: no
file paths, no module names, no card slicing, no dependency ordering,
no interface design.

The `spec-writing` skill referenced in step 3 is not described in
this document (see "Files and folders explicitly excluded" in §How to
read this document).

### 5.2 `/architecture`

File: `commands/architecture.md`. 21 steps.

Argument parsing (step 3): the command argument string may contain a
spec path and/or the flag `--pause` (or bare token `pause`). If no
spec path is provided, the most recent file in `docs/specs/` is used.

Outputs the command produces (full list):

- The scaffold card on the workspace board (step 5; moved to
  `finished` in step 20).
- Four workspace artifacts attached to the scaffold card:
  `ARCH_FACTS_BUNDLE_V2` (step 6/7), `ARCH_BUNDLE_AUDIT_V2` (step
  8/9), `architecture_document` (step 11/12),
  `ARCH_DESIGN_REVIEW_V1` (step 14/15).
- One file on disk at `docs/arch/architecture-<spec-basename>.md`
  (verified by step 13; committed by step 18).
- N workspace cards on the same board, one per Card Slice in the
  architecture document (step 19). Each card lands in column
  `backlog` and will be picked up by `/orchestrate` Wave 1 in a
  later session to be planned, then reviewed, implemented, and
  audited.
- `depends_on` edges on those cards (step 19, pass 2).
- Card notes on the scaffold card and activity log entries written on
  any halt and on any correction-loop cap-3 handoff.

Halt conditions (per the command's "Halt conditions" section):

- A subagent fails to submit its required artifact (detected by the
  snapshot-and-diff in §4.7 returning no new artifact of the
  expected type).
- The audit reports a `verified_level` that is not an integer in
  `{1, 2, 3}`.
- A compose agent halts because the audit reports
  `any_discrepancy: true` but carries no `corrected_bundle`, or
  `any_discrepancy: false` but the original bundle fetched via the
  audit's `audited_bundle_artifact_id` cannot be retrieved or
  parsed.
- The architecture document is not present at the exact
  `architecture_document_path` derived in step 13.
- The user rejects the architecture document.

On any halt, the command writes a card note to the scaffold card
naming the failing step and condition, writes an activity log entry,
stops the pipeline, and reports the halt to the user. The command's
"Operating rules" state that no workspace cards are created from a
halted pipeline.

### 5.3 `/orchestrate`

File: `commands/orchestrate.md`. 3 steps.

Steps:

1. Load tools via `ToolSearch` for `agentboard`, `codegraph`, and
   `rag`. Call `agentboard_health_check`. Invoke the
   `workspace-orchestration` skill via the `Skill` tool.
2. Parse the optional `--auto` flag from the command argument. The
   flag skips checkpoints where the board's `auto_transitions`
   blocking toggle is OFF; blocking ON pauses regardless.
3. Hand control to the `workspace-orchestration` skill.

The command runs the four-wave pipeline against the workspace board
(planning → review → implementation → audit), one wave at a time,
spawning one parallel subagent per card in each wave's input column.
The command file explicitly states that wave logic, prompt templates,
checkpoint policy, retry policy, build verification, and per-wave
failure handling all live in the `workspace-orchestration` skill,
not in the command. The "See also" section names
`skills/workspace-orchestration/SKILL.md` as the authoritative
reference.

§6.2 of this document describes what the skill contains.

### 5.4 `/sweep`

File: `commands/sweep.md`. Five-step process backed by the
`codebase-sweep` skill.

Steps:

1. Setup — load the `codebase-sweep` skill; load tools; authenticate
   if needed and run `agentboard_health_check`; select or create an
   app and a workspace board; identify the target codebase.
2. Reconnaissance — `codegraph_scan`, `codegraph_get_stats`,
   `codegraph_find_entry_points`; first `rag_search` call to confirm
   the RAG index; read config files; determine reading order;
   create the findings document at
   `docs/sweep/YYYY-MM-DD-findings.md`.
3. Broad sweep — read files in the determined order, write findings
   to the findings document as they are found. Rules at this step:
   no workspace cards yet, no categorization yet, no fixes, no
   suggested fixes.
4. Triage — read the full findings document; group related findings;
   set priorities and dependencies; create one workspace card per
   group with `agentboard_create_workspace_card`, including
   `depends_on` edges. Each card lands in column `backlog` and will
   be picked up by `/orchestrate` Wave 1 in a later session to be
   planned, then reviewed, implemented, and audited.
5. Summary — display the "Sweep Complete" summary table; commit the
   findings document to git on the current branch.

Outputs:

- `docs/sweep/YYYY-MM-DD-findings.md` on disk (committed in step 5).
- N workspace cards on the chosen board, one per finding group,
  with `depends_on` edges.

`/sweep` is read-only with respect to the target codebase.

### 5.5 `/kickoff`

File: `commands/kickoff.md`. 7 steps.

Steps:

1. Load the agentboard skill; read the project's `CLAUDE.md`.
2. Authenticate if only the two auth tools are visible; then call
   `agentboard_health_check`. If post-auth health check fails, show
   the error and stop.
3. Call `agentboard_list_projects`. Either pick an existing project
   or, if none, ask the user to create one (collecting `name`,
   `project_type`, `idea`, optional `target_project_path`).
4. If creating, call `agentboard_create_project`.
5. Claim the first task by calling `agentboard_get_next_task` with
   the project ID and agent ID.
6. Show a summary (project name and phase, current task, linked
   document template for milestones, next steps).
7. Inform the user: "Setup complete. … When you need a new agent to
   continue, use `/kickoff`."

### 5.6 `/pickup`

File: `commands/pickup.md`. 10 steps.

Steps include reading the agentboard skill and `CLAUDE.md`, calling
`agentboard_health_check`, listing projects, identifying the active
project, getting project details, checking for in-progress tasks,
reading the linked document if the task is a milestone, pulling the
last 10 entries from `agentboard_get_activity_log`, displaying a
summary, and beginning work on the claimed task immediately.

The command file at step 2 includes a fallback that calls
`agentboard_start_server`. The agentboard MCP is cloud-hosted (see
`skills/agentboard/SKILL.md` §1.1 which describes the service as
fully cloud-hosted with no local installation), so this fallback is
documented here as written; it is not described as functional or
non-functional.

### 5.7 `/wrap-up`

File: `commands/wrap-up.md`. 7 steps.

Steps:

1. List in-progress tasks for the active project via
   `agentboard_list_tasks` filtered by `status=in-progress`.
2. For each in-progress task, add a progress note via
   `agentboard_update_task` containing what was done, what remains,
   blockers or decisions made, and files touched. Do not change the
   task status unless the work is actually complete.
3. If work is complete: implementation tasks move to `review`;
   milestone documents are submitted via
   `agentboard_submit_document`.
4. Add a log entry via `agentboard_add_log_entry` summarising the
   session (`action: log_entry`).
5. Get final project state via `agentboard_get_project` and
   `agentboard_list_tasks`.
6. Display the "Session Summary" hand-off block.
7. Inform the user that notes have been saved and the next agent
   can run `/pickup`.

### 5.8 `/status`

File: `commands/status.md`. 5 steps. Read-only.

Health check; list projects; for each project (or the active one)
call `agentboard_get_project` and `agentboard_list_tasks`; display
a status summary (phase N/13, target path, tasks by status, next
action). The command's last step states explicitly: "Do not start
any work. This command is purely informational."

### 5.9 `/board-status`

File: `commands/board-status.md`. 4 steps. Read-only.

Load agentboard tools; call `agentboard_health_check`; select the
board (asking the user if multiple exist); call
`agentboard_list_workspace_cards` with `limit=100` and paginate if
the result count equals 100; count cards per status column; display
a status table including the board's `review_blocking` and
`audit_blocking` settings, cards needing attention (those not in
`backlog` or `finished`), and recent activity.

---

## 6. Skills

### 6.1 `agentboard`

File: `skills/agentboard/SKILL.md`.

The skill is the agent-facing reference for both workflows. Its
sections:

- **§0 Mental model** — the two-workflow distinction; the three-actor
  separation (worker / review / human); the strict state-machine
  errors (HTTP 422 with structured fields naming `from`, `to`,
  `allowed`, `missing_fields`); HTTP 409 for state conflicts; the
  mandatory `agent_id` on every mutation; the entry-point commands.
- **§1 Setup** — cloud-service URLs (`https://agent-board.app` and
  `https://mcp.agent-board.app/mcp`); the OAuth bootstrap (§1.3);
  the agent_id convention; the session-startup checklist that
  diverges by workflow at step 4.
- **§2 MCP tools reference** — six subsections covering
  authentication and connectivity (§2.1), projects (§2.2), tasks
  (§2.3), documents (§2.4), activity log (§2.5), and workspace
  boards (§2.6). Each tool is named with its required parameters.
- **§3 The AgentBoard workflow** — the 13-phase pipeline (§3.1), the
  milestone workflow (§3.2), the task state machine (§3.3), and
  typical session shapes for phase-based and workspace work (§3.4).
- **§4 Common patterns** — code-style worked examples for the
  most-common operations.
- **§5 Error handling** — HTTP 422 and HTTP 409 patterns; a table of
  common mistakes and fixes.
- **§6 Companion MCP servers** — covers `codegraph` and
  `codebase-rag` usage by phase. §6.0 explicitly assigns
  pre-warm responsibility to the main agent driving a session.

The skill is loaded by `/kickoff` (step 1) and `/pickup` (step 1) and
referenced by `/sweep` (step 3) and `/status` (step 1). The
`SessionStart` hook refers agents to `skills/agentboard/SKILL.md`
§1.3 for the OAuth bootstrap procedure.

### 6.2 `workspace-orchestration`

File: `skills/workspace-orchestration/SKILL.md`.

The skill is named at its top as the authoritative source of truth
for the workspace-orchestration workflow. The `/orchestrate` command
file explicitly defers to it.

Sections:

- **Prerequisites** — agentboard reachable; a workspace board with
  cards in `backlog` (created via `/architecture` or `/sweep`); an
  approved architecture document at
  `docs/arch/architecture-<spec-basename>.md` whose Card Slices
  section corresponds to the cards on this board; tools loaded for
  `agentboard`, `codegraph`, `codebase-rag`.
- **Pipeline overview** — the four waves that operate on every card
  on the board:
  - Wave 1 (Planning) — parallel agents build plans per card; cards
    advance from `backlog` (selected when wave starts) → `planning`
    → `review`.
  - Wave 2 (Review) — parallel agents validate plans; cards advance
    `review` → `implementation` (accept) or back to `planning`
    (reject).
  - Wave 3 (Implementation) — parallel agents write code; build/lint
    check; cards advance `implementation` → `audit`.
  - Wave 4 (Audit) — parallel read-only agents verify; cards advance
    `audit` → `finished` (PASS) or back to `implementation` (FAIL).
- **Checkpoint logic** — table covering combinations of board
  `review_blocking` / `audit_blocking` settings and the `--auto`
  flag. Default is always pause; `--auto` skips only when blocking
  is OFF; blocking ON always pauses.
- **Running a wave** — four sub-steps: collect cards by status,
  spawn parallel subagents with `run_in_background: true`, wait for
  all agents, handle failures, checkpoint if applicable.
- **Wave-1 and Wave-4 Phase A / Phase B prompts** — explicit prompt
  shape for each phase. Phase B agents receive
  `facts_bundle_artifact_id` (Wave 1) or
  `audit_facts_bundle_artifact_id` (Wave 4) and fetch the bundle
  themselves via `agentboard_get_workspace_artifact`. Bundle JSON
  is never embedded in the prompt.
- **Build verification** — after Wave 3, before Wave 4, the
  `implementation-agent` reports build/lint status inside its
  `implementation_note` artifact; the orchestrator reads that status
  rather than running build commands itself. The skill states
  explicitly: "Build/lint commands are project-specific — do not
  hardcode `npm`, `cargo`, `pytest`, etc. into this skill."
- **Retry policy** — Review rejects a plan: 2 retries per card (the
  card returns to `planning` for re-planning). Build fails: 0
  retries (user intervenes). Audit fails: 0 retries (card stays in
  `audit`). Agent crashes / times out: 1 retry.
- **Status reporting** — between waves and at checkpoints, display a
  table of column counts and a progress fraction.
- **Agents** — table mapping each wave and phase to a subagent name
  and a model alias.

The wave agent table (model column shows the agent's `model:`
frontmatter value verbatim per the skill):

| Wave | Phase | subagent_type | model |
|------|-------|---------------|-------|
| 1 | A | `planning-research-agent` | `claude-haiku-4-5-20251001` |
| 1 | B | `plan-compose-agent` | `opus` |
| 2 | — | `review-agent` | `opus` |
| 3 | — | `implementation-agent` | `sonnet` |
| 4 | A | `audit-research-agent` | `claude-haiku-4-5-20251001` |
| 4 | B | `audit-compose-agent` | `opus` |

### 6.3 `expert-standards`

File: `skills/expert-standards/SKILL.md`.

The skill's frontmatter description states it activates whenever
Claude is making an engineering judgment of any kind. Per the
skill's body:

- Core thesis: evaluate against what experienced engineers know is
  correct, not against what the current codebase does.
- Three failure signals: unnamed approvals; silent pattern
  replication; assessment gaps (work approved during regular flow
  that a dedicated review would later flag).
- The skill changes how agents think, not what they deliver. For
  structured deep reviews with severity classifications, the skill
  refers to the `/expert-review` command (which is not part of this
  plugin).

The `/architecture` command's step 2 instructs the orchestrator to
activate this skill as its governing cognitive frame. The command
also states that subagents activate the skill independently as the
first step of their own profiles.

### 6.4 `codebase-rag`

File: `skills/codebase-rag/SKILL.md`.

The skill documents three rules for using the `codebase-rag` MCP
server (described in §8.2):

1. `rag_search("what you're about to do")` before editing unfamiliar
   code, looking for callers/callees, or when the instruction
   doesn't say which file to touch.
2. `rag_query_impact("path/to/file")` before modifying a file.
3. The first call in a never-indexed project takes a few seconds to
   build the index; subsequent calls are sub-second.

The skill is short; it documents tool usage, not workflow steps.

### 6.5 `codebase-sweep`

File: `skills/codebase-sweep/SKILL.md`. The methodology the `/sweep`
command uses.

Four steps:

1. **Map the codebase** — list top-level directories two levels deep,
   count source files, identify the project type, skim documentation.
2. **Read every source file** — with file-reading strategies for
   small (<30 files), medium (30–80), and large (80+) projects. The
   skill lists what to look for as calibration, not a sequential
   checklist: inconsistent patterns, silent failure, coupling
   hotspots, functions doing too many things, stale comments,
   uncoordinated state, pattern decay, dead code, hardcoded values,
   missing boundaries. Findings are written immediately, with file
   paths and line numbers, and severity is assigned per finding
   (critical / high / medium / low).
3. **Compile the findings document** at
   `docs/sweep/YYYY-MM-DD-findings.md`. The document has a grouped
   top section (Critical & High, Medium, Low) and a raw-by-file
   bottom section.
4. **Present to the user** — total findings, the 2–3 most important
   groups, dependency chains. Ask whether priorities look right
   before fixing anything.

The skill states: "Discovery and triage only. Do not fix anything.
Do not prescribe architecture. Do not run linters or static
analysis."

---

## 7. Hooks

`hooks/hooks.json` declares three hook events. The four scripts in
`hooks/scripts/` implement the non-inline hooks.

### 7.1 `SessionStart`

A single `prompt`-type hook with matcher `""` (matches every session
start). The prompt instructs the agent to:

1. Check whether only `agentboard_authenticate` and
   `agentboard_complete_authentication` are visible in the
   agentboard tool surface. If so, run the OAuth bootstrap per
   `skills/agentboard/SKILL.md` §1.3.
2. Treat the OAuth callback URL as a secret — do not log, echo,
   write to any artifact, or include in any commit.
3. After authenticating (or if already authenticated), call
   `agentboard_health_check`. On a healthy response, continue
   silently. On a post-auth failure, surface "AgentBoard cloud
   service is unreachable. Check your network connection or service
   status at agent-board.app."

### 7.2 `PreToolUse` on `agentboard_submit_workspace_artifact`

Three scripts fire on every artifact submission, in declared order:

1. `bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/artifact-quality-gate.sh`
   (timeout 5000ms).
2. `bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/validate-architecture-artifact.sh`
   (timeout 10000ms).
3. `bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/inject-quality-gate-prompt.sh`
   (timeout 5000ms).

#### 7.2.1 `artifact-quality-gate.sh`

The script detects the artifact type using a primary `jq` lookup on
`.tool_input.artifact_type` / `.artifact_type`, with a content-head
fallback for environments where `jq` is unavailable.

For the four architecture-pipeline artifact types
(`architecture_document`, `ARCH_FACTS_BUNDLE_V2`,
`ARCH_BUNDLE_AUDIT_V2`, `ARCH_DESIGN_REVIEW_V1`), the script exits
0 cleanly with no action.

The script also early-exits 0 if the `artifact_type` field is empty
*and* the content head matches one of the architecture sentinels or
the architecture document heading pattern. The comment immediately
above this fallback explains the empty-type case:

> Fall back to content-sentinel detection when artifact_type is empty
> (the agentboard MCP today submits architecture artifacts with type
> "general" and a leading sentinel line in the content).

For non-architecture artifacts (`plan`, `review_note`,
`implementation_note`, `audit_report` — i.e., the artifacts produced
during the four work waves), the script scans the content for any of
these patterns (case-insensitive):

```
TODO, TBD, FIXME, PLACEHOLDER,
need to investigate, need to look, needs further,
needs investigation, needs more research,
open question, not sure, look into, figure out,
to be determined, requires further, still need,
haven't determined, unknown at this time,
more research needed, awaiting clarification
```

A match causes exit 1 with a structured message naming the pattern
and instructing the agent to fix the gaps using its investigation
tools.

#### 7.2.2 `validate-architecture-artifact.sh`

The script detects which of the four architecture-pipeline artifact
types the submission is, using `artifact_type` as the primary path
with content-sentinel fallback (parenthesised per the script's
comment: `(artifact_type match) || (content sentinel hit)`). If no
architecture-pipeline type is detected, the script exits 0 and the
existing `artifact-quality-gate.sh` decides.

On a detected type, the script applies the matching rule set from
§4.5 (R-DOC-1..7 for `architecture_document`, R-BUNDLE-1..5 for
`ARCH_FACTS_BUNDLE_V2`, R-AUDIT-1..4 for `ARCH_BUNDLE_AUDIT_V2`,
R-REVIEW-1..4 for `ARCH_DESIGN_REVIEW_V1`).

On any rule failure the script writes a structured JSON error to
stderr:

```json
{ "hook": "validate-architecture-artifact",
  "artifact_type": "<detected>",
  "failed_rules": [ "<id>", ... ],
  "details": "<multi-line detail block>" }
```

and exits 2 (blocks the tool call).

The script's top-of-file comments record several implementation
notes verbatim, including:

- Sentinel normalization for sentinel-bearing artifacts (BOM strip;
  `\n` and `\r\n` both treated as line terminators).
- Cygwin / Git-Bash hardening: jq invocations consolidated to one
  per logical check; `awk` avoided.
- "This script is structural-only. Behavioral guarantees come from
  subagent frontmatter constraints, not from this hook."
- "The correction-loop remediation path uses declared correction
  inputs passed to the affected stage; it does not submit a fifth
  correction artifact type through this hook."

The script consults the environment variable `AGENTBOARD_SPEC_PATH`
in rule R-DOC-5 (R#/Q# coverage). When set and readable, the script
extracts spec IDs from that file; otherwise it falls back to a
non-empty traceability-matrix check at L2 and L3 and skips the
coverage check at L1.

#### 7.2.3 `inject-quality-gate-prompt.sh`

The script detects the artifact type (same primary-then-fallback
pattern as the other two scripts).

For the four architecture-pipeline artifact types, the script exits
0 with empty stdout — no prompt is injected. The script's comment
states: "The architecture-pipeline subagents have their own
submission discipline and do not want the workspace-pipeline gate's
'no open questions' / 'you used codegraph and codebase-rag'
guidance."

For non-architecture submissions (the artifacts produced during the
four work waves), the script writes the following text to stdout
verbatim:

```
SUBMISSION QUALITY GATE — Before submitting this artifact, verify ALL of the following:

- No open questions or unanswered items
- No TODO/TBD/FIXME/placeholder text
- No 'need to investigate' or 'look into' language
- Every step references specific files and line numbers
- You used codegraph, codebase-rag, grep, and read tools to validate your work
- The artifact is immediately actionable by another agent without further research

If ANY check fails, DO NOT submit. Go back and fix the gaps using your tools first.
```

### 7.3 `PostToolUse` on card tools

Matcher:
`mcp__agentboard__agentboard_get_next_card|mcp__agentboard__agentboard_get_card|mcp__agentboard__agentboard_update_workspace_card`.

Script:
`bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/workspace-card-guidance.sh`
(timeout 5000ms).

The script:

- For `update_workspace_card`, exits 0 immediately unless the input
  contains the substring `"assignee"` (i.e., the update is a card
  claim, not a routine note/status update).
- Extracts the `status` value from the tool output.
- For status `planning`, `review`, `implementation`, or `audit`,
  prints phase-appropriate guidance to stdout (required tools,
  completeness expectations, specificity expectations, the artifact
  type expected on submission for that wave).
- For `backlog`, `finished`, or unrecognised statuses, exits 0 with
  no output.

The guidance texts for the four work columns:

- `planning` — required tools (codegraph, codebase-rag, Grep, Read),
  completeness expectation (zero open questions, zero TODOs),
  specificity expectation (file paths, function names, line
  numbers).
- `review` — read all `plan` artifacts on this card; evaluate
  completeness and specificity; submit a `review_note` artifact if
  the plan is insufficient.
- `implementation` — read the plan and reviews; follow the plan's
  file references; run build + lint; submit `implementation_note`.
- `audit` — read plan + review notes + implementation artifacts;
  verify against the plan; run tests and lint; submit
  `audit_report`.

---

## 8. Companion MCP servers

### 8.1 `codegraph`

Local stdio server. Tools (per `skills/agentboard/SKILL.md` §6.1):

| Tool | Purpose |
|---|---|
| `codegraph_scan` | Build the dependency graph. Must be called first per session. |
| `codegraph_get_stats` | File counts; most-connected and most-depended-on files. |
| `codegraph_get_dependencies` | What does file X import? |
| `codegraph_get_dependents` | What imports file X? |
| `codegraph_get_change_impact` | Blast radius of changing file(s). |
| `codegraph_get_subgraph` | Subgraph around a file. |
| `codegraph_find_entry_points` | Entry-point files. |
| `codegraph_list_files` | All scanned files. |

The graph is in-memory only. `skills/agentboard/SKILL.md` §6.0
assigns the main agent the responsibility of running
`codegraph_scan` before spawning subagents.

### 8.2 `codebase-rag`

Local stdio server. Tools (per `skills/agentboard/SKILL.md` §6.2 and
`skills/codebase-rag/SKILL.md`):

| Tool | Purpose |
|---|---|
| `rag_search` | Semantic search. Inputs: `query`, `num_results` (1–20), `source_type` (`"all"` / `"docs"` / `"code"` / `"constraints"`). |
| `rag_query_impact` | What depends on a file: exports, importers, and semantically similar files. |

The server auto-detects the project root (`.git`, `package.json`,
`pyproject.toml`, `Cargo.toml`, `go.mod`, or `RAG_PROJECT_ROOT`),
builds the index in a per-machine cache directory on first run, and
runs a filesystem watcher.

A first call in a never-indexed project may return
`status: "indexing"`; the agentboard skill §6.0 instructs the main
agent to pre-warm RAG with a short test query and confirm real
results before spawning subagents.

### 8.3 `clear-thought`

Local stdio server invoked via `npx -y -p @waldzellai/clear-thought
mcp-server-clear-thought` per `.mcp.json`. The plugin's `agents/`
folder (excluded from this document by user instruction) holds the
profiles that declare which Clear Thought tools each architecture
subagent calls; this document does not enumerate those tools.

---

## 9. Output inventory and storage map

This section lists every output that any command in the plugin
produces, where the output is stored today, and whether the app has
a native entity for that kind of output. Entries are grouped by
storage destination.

### 9.1 Outputs stored as native app entities

These outputs have a native entity on the AgentBoard app's data
model and the plugin uses that entity directly.

| Output | App entity | Produced by |
|---|---|---|
| Project record | project | `agentboard_create_project` (typically called from `/kickoff`) |
| Phase document content | document | `agentboard_submit_document` (per milestone in phases 2–9) |
| Milestone task state | task (`task_type: 'milestone'`) | auto-created by server; advanced by `submit_document` |
| Implementation task | task (`task_type: 'implementation'`) | `agentboard_create_task` and `agentboard_update_task` |
| Activity-log entries | activity-log row | `agentboard_add_log_entry` and automatic on most mutations |
| App | app | `agentboard_create_app` |
| Workspace board | board | `agentboard_create_board` |
| Workspace card (work unit that traverses all four work waves) | card | `agentboard_create_workspace_card` in `/architecture` step 19 (one per Card Slice) and `/sweep` step 4 (one per finding group) |
| Card status / column | card.status | `agentboard_update_workspace_card` (changed by each wave agent in `/orchestrate` as the card progresses through `planning` → `review` → `implementation` → `audit` → `finished`) |
| Card notes | card.notes (append-only) | `agentboard_update_workspace_card` with a note in the update |
| Card `depends_on` edges | card.depends_on | `agentboard_create_workspace_card` (Pass 1) and `agentboard_update_workspace_card` (Pass 2) in `/architecture` step 19; also `/sweep` step 4 |
| `plan` artifact | workspace_artifact, type `plan` | `plan-compose-agent` (Wave 1 Phase B; produced while the card is in `planning`) |
| `review_note` artifact | workspace_artifact, type `review_note` | `review-agent` (Wave 2; produced while the card is in `review`) |
| `implementation_note` artifact | workspace_artifact, type `implementation_note` | `implementation-agent` (Wave 3; produced while the card is in `implementation`) |
| `audit_report` artifact | workspace_artifact, type `audit_report` | `audit-compose-agent` (Wave 4 Phase B; produced while the card is in `audit`) |

The four `plan`/`review_note`/`implementation_note`/`audit_report`
artifact types map one-to-one to the four work columns
(`planning`/`review`/`implementation`/`audit`) and are produced
in sequence as the same card passes through each wave. A single
card on a board accumulates one of each over the course of a normal
run.

### 9.2 Outputs stored in git, not in the app

These outputs are written to files inside the working tree and
committed to git on the current branch by the command that produces
them.

| Output | File path | Produced by | Committed by |
|---|---|---|---|
| Spec document | `docs/specs/YYYY-MM-DD-<kebab-name>.md` | `/foundation` step 4 | `/foundation` step 6 |
| Architecture document | `docs/arch/architecture-<spec-basename>.md` | `architecture-compose-l{1,2,3}` (invoked by `/architecture` step 11) | `/architecture` step 18 |
| Sweep findings | `docs/sweep/YYYY-MM-DD-findings.md` | `/sweep` step 3 (growing through step 4) | `/sweep` step 5 |

The app has no spec entity, no architecture-document entity, and no
sweep-findings entity. The architecture document is additionally
attached to the workspace surface as an artifact (§9.3); the spec
and sweep findings are not.

The user-stated framing for this document records that the
architecture stage has no clear place on the kanban board the app
provides; this row of the table is the storage location the plugin
uses today for the architecture document.

### 9.3 Outputs stored as workspace_artifact attached to the scaffold card

These four outputs are produced by `/architecture` subagents and
attached via `agentboard_submit_workspace_artifact` to the scaffold
card the command creates in step 5. They are pipeline-scoped (one set
per `/architecture` run) rather than card-scoped (they do not belong
to any single workspace card that passes through the four work
waves).

| Output | Artifact type | Produced by | Wire format |
|---|---|---|---|
| Facts bundle | `ARCH_FACTS_BUNDLE_V2` | `architecture-research-agent` | Sentinel line `ARCH_FACTS_BUNDLE_V2` + JSON body |
| Bundle audit | `ARCH_BUNDLE_AUDIT_V2` | `architecture-classification-auditor` | Sentinel line `ARCH_BUNDLE_AUDIT_V2` + JSON body |
| Architecture document | `architecture_document` | `architecture-compose-l{1,2,3}` | Plain markdown beginning `# Architecture —` and containing `## Card Slices` |
| Design review | `ARCH_DESIGN_REVIEW_V1` | `architecture-design-reviewer` | Sentinel line `ARCH_DESIGN_REVIEW_V1` + JSON body |

`artifact-quality-gate.sh`'s fallback comment records that "the
agentboard MCP today submits architecture artifacts with type
'general' and a leading sentinel line in the content." Three of the
four wire formats above carry an explicit sentinel line at the start
of the content body; the architecture document is detected by its
top-level markdown heading and its `## Card Slices` section.

The scaffold card itself is also stored as a native `card`, but it
is moved directly from `backlog` to `finished` (`/architecture`
steps 5 and 20) without passing through `planning`, `review`,
`implementation`, or `audit`. The scaffold card's purpose is to be
the parent record these four artifacts attach to. (Every other
workspace card on a board passes through all four work waves; the
scaffold card is the only card that does not.)

The user-stated framing for this document records that the facts
bundle, bundle audit, architecture document (and by extension the
design review) lack dedicated places on the app the way other steps
of the process do.

### 9.4 Outputs stored as card-scoped content denormalised from the architecture document

`/architecture` step 19 reads the `## Card Slices` section of the
committed architecture document and creates one workspace card per
slice. The card's `description` field is set to the full slice
content: the eight required field bullets (Description, Allowed-touch
list, Forbidden-touch list, Produces, Consumes, Verification scope,
Depends on, Source decisions) copied verbatim out of the
architecture document.

Downstream, `/orchestrate`'s Wave 1 prompt template (in
`skills/workspace-orchestration/SKILL.md`) passes the slice content
to the Wave 1 (Planning) agents as `arch_slice`. The Wave 1 Phase A
research agent and Phase B compose agent both consume the slice this
way to build the `plan` artifact. The same card then continues
through Wave 2 (Review), Wave 3 (Implementation), and Wave 4 (Audit)
on the same board.

The `workspace-orchestration` skill's Prerequisites section records:

> the architecture pipeline has a correction loop, so the document a
> card's slice came from may have been revised since the cards were
> created — if cards predate the current architecture document,
> re-create them from the current Card Slices section before running
> this skill.

The slice content thus exists in two places: the architecture
document on disk (the source) and each card's `description` field
(the copy). The two are kept in sync by re-creating the cards from
the current Card Slices section when the architecture document has
been revised after the cards were created.

### 9.5 Outputs stored as orchestration-time state, persisted to card notes and the activity log

The correction-round state inside `/architecture` step 17 is held in
the running orchestration's variables (`correction_round_count`,
`architecture_correction_pause`, `correction_request_json`,
`prior_architecture_document_path`,
`prior_architecture_document_artifact_id`, the routed origin) for
the duration of the run.

The persistent records produced by the correction loop are:

- Card notes on the scaffold card via
  `agentboard_update_workspace_card` (per the "Halt conditions"
  section: on any halt, a card note naming the failing step and
  condition; per step 17: on cap-3 handoff, a note naming the round
  cap and that an external investigator handoff is required).
- Activity log entries via `agentboard_add_log_entry` (per the same
  sections, an entry naming the step and condition).

The scaffold card does not change columns during the correction
loop.

The `--pause` flag (or bare token `pause`) on the `/architecture`
argument is captured in step 3 as
`architecture_correction_pause_flag` and persisted only as the
orchestration variable `architecture_correction_pause` for the run.
It is not recorded on the board, the card, or any artifact. Step 4
explicitly states: "The `/architecture` pause is distinct from the
AgentBoard app's blocking-gate mechanism and does not modify board
settings."

### 9.6 Auth state and tool-availability state

The OAuth tokens minted by `agentboard_complete_authentication` are
held by the MCP client and the cloud service. The plugin does not
store auth credentials in any file or artifact.

The `SessionStart` hook prompt instructs the agent to treat the
OAuth callback URL as a secret — never logged, echoed, written into
any artifact, note, file, or commit.

---

## Appendix A — Identifiers and seam contracts inside `/architecture`

Reference list of the identifiers `commands/architecture.md`
threads between steps, captured here so an app change can preserve
the seam contracts described in §4.7.

| Identifier | Captured at step | Used at steps |
|---|---|---|
| `architecture_correction_pause_flag` | 3 (argument parse) | 4 (sets `architecture_correction_pause`) |
| `architecture_correction_pause` | 4 | 17 (pause-before-route decision) |
| `scaffold_card_id` | 5 | 6, 7, 8, 9, 11, 12, 14, 15, 17, 19, 20 |
| `pre_research_artifact_ids` | 6 | 7 (diff) |
| `audited_bundle_artifact_id` | 7 (snapshot-and-diff) | 8 (passed to auditor); 9 (used to fetch original bundle if `any_discrepancy == false`) |
| `pre_audit_artifact_ids` | 8 | 9 (diff) |
| `audit_artifact_id` | 9 (snapshot-and-diff) | 11 (passed to compose); 14 (passed to design reviewer) |
| `verified_level` | 9 (from audit content) | 11 (dispatch to compose-l{1,2,3}) |
| `pre_compose_artifact_ids` | 11 | 12 (diff) |
| `architecture_document_artifact_id` | 12 (snapshot-and-diff) | 14 (passed to design reviewer); 17 (correction-mode prior document) |
| `architecture_document_path` | 13 (Glob verification) | 14 (passed to design reviewer), 16 (display), 17 (corrections), 18 (commit), 19 (re-read for slice creation) |
| `pre_review_artifact_ids` | 14 | 15 (diff) |
| (design review artifact id) | 15 (snapshot-and-diff) | 16 (fetch for display) |
| `correction_round_count` | 17 (initial 0, incremented per routed correction) | 17 (cap-3 check) |
| `correction_request_json` | 17 (per routed correction) | 17 (passed to compose in `architecture-document` route) |
| `prior_architecture_document_path` | 17 | 17 (passed to compose in `architecture-document` route) |
| `prior_architecture_document_artifact_id` | 17 | 17 (passed to compose in `architecture-document` route) |

The "Operating rules" of `commands/architecture.md` state that:

- `audit_artifact_id` is the single seam between the orchestrator
  and the downstream stages that consume the verified bundle.
- The orchestrator never serialises the bundle and never embeds
  bundle JSON in any prompt.
- Compose and the design reviewer each fetch the audit themselves
  and resolve the verified bundle by the audit's `any_discrepancy`
  branch.
- Every pipeline artifact is bound by the exact ID captured via
  snapshot-and-diff for that round; never re-resolved by a
  type-only lookup.
- The exact `architecture_document_path` from step 13 is threaded
  unchanged through steps 14, 16, 17, 18, and 19; never re-derived
  by closest-match scanning.

These seam contracts are workflow. Any app change that re-shapes
how `/architecture`'s artifacts are stored must preserve:

- The ability to bind a specific produced artifact by an exact ID
  per round.
- The audit-to-bundle back-reference (`audited_bundle_artifact_id`)
  so the verified bundle can be resolved from the audit alone.
- The ability for compose and the design reviewer to fetch the audit
  by its ID and resolve the bundle without re-running research.
- The ability for the architecture document on disk to be the
  canonical source of the Card Slices section that step 19 reads to
  create the workspace cards that subsequently traverse `planning`,
  `review`, `implementation`, and `audit`.
