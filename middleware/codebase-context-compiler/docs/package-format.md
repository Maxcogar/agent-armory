# Context Package Format

The canonical Context Package is JSON validated by `src/adapters/schema/context-package.schema.json`. The Markdown companion is generated from JSON and is not authoritative.

Required sections:

- `repository` - repository name, root, revision, dirty state, and snapshot id.
- `task` - original request, normalized task, task types, and scope summary.
- `context_requirements` - per-category completeness: `satisfied`, `unresolved`, or `not_applicable`.
- `relevant_files` - included files with role, required flag, relevance reason, evidence, and key facts.
- `relevant_symbols` - included symbols with file, kind, relevance reason, and evidence.
- `existing_patterns` - observed patterns, explicitly separated from requirements to follow.
- `constraints` - task/package constraints and their source.
- `forbidden_moves` - unsafe or duplicative moves with reasons and evidence.
- `known_facts` - evidence-backed repository facts.
- `unknowns` - searched-for but unresolved facts; unknowns must not be converted into facts.
- `context_gaps_allowed_to_create` - missing concepts the agent may create as part of the task.
- `checked_not_relevant` - plausible files checked and rejected.
- `verification_guidance` - commands, manual checks, and affected tests.
- `unresolved_decisions` - decisions still requiring a human, architect, or implementer.
- `flagged_repository_text` - instruction-like repository text surfaced as data only.
- `token_budget` - configured budget, estimate, and overflow flag.

Every non-trivial repository claim should trace to an `EvidenceRef` with source type, path, optional symbol, line span, and relationship. Supported evidence source types are:

- `file` - file-level repository evidence.
- `symbol` - symbol-level repository evidence.
- `static_analysis` - imported SARIF/static-analysis evidence.
- `external_input` - direct task input evidence.
- `human_override` - explicit reviewer override evidence.

## Expansion Request Format

`ctxpack expand` accepts JSON validated by `expansion-request.schema.json`:

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

If expansion succeeds, ctxpack writes a new Context Package with a new `package_id`. If it fails, ctxpack records a denial reason and the paths it checked.

## Human Override Format

`ctxpack override` accepts JSON validated by `human-override.schema.json`. Overrides are the only supported way to add reviewer-confirmed facts that do not come from repository evidence:

```json
{
  "action": "add_allowed_creation",
  "description": "new ThemeProvider component",
  "reason": "Max Cogar confirmed the project should add a provider because no theme system exists."
}
```

Override actions create a new package id and add either `human_override` evidence or an explicit allowed creation point. They do not rewrite existing evidence.

## Static Analysis Evidence

SARIF findings configured through `staticAnalysis` are stored with the snapshot and surfaced in:

- `relevant_files[].key_facts` for files with findings.
- `known_facts[]` when a finding belongs to a seed file.

Those facts use `source_type: "static_analysis"` and preserve the SARIF rule id, severity, message, path, and line span where available.
