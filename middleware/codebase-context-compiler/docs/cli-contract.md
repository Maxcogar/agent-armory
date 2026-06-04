# CLI and File Contract

`ctxpack` is a local-first CLI. It stores the repository map in `<repo>/.ctxpack.db` and writes task artifacts under `<repo>/.context/`.

## Commands

| Command | Purpose | Spec |
|---|---|---|
| `ctxpack init [root]` | Install regular Claude Code hooks. | AIR1 |
| `ctxpack index [root]` | Build/update the repository map. | FR1, FR18 |
| `ctxpack package "<task>"` | Generate `task-context.json` and `task-context.md`. | FR3-FR13, FR20-FR24 |
| `ctxpack expand <request-file>` | Add missing task-relevant context or return a reasoned denial. | FR14, AC4 |
| `ctxpack override <override-file>` | Apply an explicit human reviewer override as auditable package evidence. | Architecture human override workflow |
| `ctxpack check-plan <plan-file>` | Run the assumption firewall over a plan. | FR15, AC3 |
| `ctxpack review <diff-file>` | Review a unified diff against the package; `--sarif` emits SARIF. | FR16, FR17, PR1-PR5 |
| `ctxpack run-agent` | Secondary deterministic/live harness path. | AIR1 support path |

## Artifacts

- `task-context.json` - machine-authoritative package, JSON Schema 2020-12 validated.
- `task-context.md` - human-readable companion generated from JSON.
- `review.json` - patch-review findings.
- `review.sarif` - optional SARIF 2.1.0 export.

## Task Model

The package preserves legacy `task.task_types` labels for compatibility, but profile policy is based on composed task axes:

- `task.intent` - the cognitive mode, such as `locate_understand`, `bug_fix`, `feature`, `refactor`, `review`, `test_creation`, `documentation_update`, `dependency_maintenance`, or `audit_security`.
- `task.domains` - source-derived runtime/domain scope such as `frontend`, `backend`, `database`, `build_config`, `integration`, `docs`, or `unknown`.
- `task.modifiers` - cross-cutting policy flags such as `security_sensitive`.

Relevant files and symbols include structured inclusion metadata: `confidence`, `signals`, `corroboration_count`, and `representation`. The prose `relevance_reason` remains for human review; structured fields are the machine-readable provenance used by future profile, thread, and budget selection logic.

## Configuration

`ctxpack` reads `ctxpack.config.json` first, then `.ctxpack.json`, from the repository root:

```json
{
  "excludes": ["**/.cache/**"],
  "maxBytes": 524288,
  "tokenBudget": 12000,
  "enableTypeScriptEnrichment": true,
  "staticAnalysis": ["analysis.sarif"]
}
```

`enableTypeScriptEnrichment` controls the TypeScript language-service adapter. When enabled, indexing records semantic `references` edges and reports TypeScript diagnostics as capability gaps. `staticAnalysis` paths are SARIF 2.1.0 inputs, resolved relative to the repository root when not absolute.

## Expansion Request

`ctxpack expand` reads JSON:

```json
{
  "missing": "related test coverage",
  "why_needed": "the implementation step is blocked until the relevant tests are known",
  "blocked_claim_or_step": "decide which test file must be updated",
  "candidate_paths": ["tests/settings.test.ts"],
  "candidate_symbols": ["SettingsPage"],
  "keywords": ["settings", "test"]
}
```

`missing`, `why_needed`, and `blocked_claim_or_step` are required. Candidate arrays are optional.

## Human Override Request

`ctxpack override` reads JSON validated by `human-override.schema.json`:

```json
{
  "action": "add_known_fact",
  "statement": "Max Cogar confirmed SettingsPage remains the target screen for this task.",
  "reason": "Human reviewer supplied product intent that is not inferable from repository code.",
  "path": "src/routes/SettingsPage.tsx"
}
```

Supported actions are `add_known_fact`, `add_relevant_file`, `add_forbidden_move`, `add_allowed_creation`, `add_constraint`, and `resolve_unknown`. The command writes a new package id and records `human_override` evidence instead of mutating facts silently.

## Regular Claude Code AIR1 Path

`ctxpack init` installs hooks. On a coding prompt, `UserPromptSubmit` generates and injects the Context Package with `hookSpecificOutput.additionalContext`. Before edits, `PreToolUse` reads the transcript and denies edit tools until a `<CTXPACK_PLAN>...</CTXPACK_PLAN>` block passes the assumption firewall.

The persisted files are audit artifacts and adapter inputs. They are not, by themselves, the enforcement mechanism.
