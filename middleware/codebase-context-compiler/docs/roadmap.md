# Roadmap

This roadmap tracks the remaining work for `ctxpack` as engineering gates, not dates. A gate is complete only when the behavior exists, is tested, is documented, and does not weaken the core rule: agents must use evidence-backed task context and must not silently guess.

## Current Position

`ctxpack` currently provides a local-first Context Package compiler for regular Claude Code:

- repository indexing with Tree-sitter for TypeScript, JavaScript, TSX, and Python
- TypeScript semantic reference enrichment
- task classification, recipes, relationship expansion, unknowns, forbidden moves, and allowed creation points
- JSON Schema validated package output plus Markdown review output
- context expansion request/update/denial
- explicit human override workflow
- assumption firewall for implementation plans
- patch review with optional SARIF export
- SARIF static-analysis ingestion
- regular Claude Code hook injection and edit-tool gating

Known runtime caveat: normal Claude Code edit tools are gated, but shell commands that mutate files are not yet pre-blocked with the same rigor.

## Gate 1: Strict Regular Claude Code Runtime

Goal: make regular Claude Code enforcement reliable enough that edits cannot bypass the package/plan contract through common tool paths.

Remaining work:

- Gate `Bash` / shell commands that can mutate files when a task Context Package is active.
- Distinguish safe read-only shell commands from likely mutating commands.
- Require a passing `<CTXPACK_PLAN>...</CTXPACK_PLAN>` before any mutating shell command.
- Refuse stale packages before mutating shell commands, not only edit tools.
- Add command-risk tests for redirects, heredocs, `node -e`, `python -c`, package scripts, formatters, generators, and Git operations.
- Add a live Claude Code end-to-end test checklist: prompt, package injection, read behavior, edit denial, plan failure, plan pass, edit allow, stale refusal, final review.
- Make generated/vendor/build-output protection apply consistently across edit tools and shell mutations.
- Record runtime gate decisions in the audit log with package id, tool name, path or command summary, and decision.

Exit criteria:

- No common Claude Code file-mutation path bypasses the plan gate.
- A stale package blocks all mutating actions.
- Runtime tests cover both allowed and denied shell commands.
- README clearly states what is blocked before execution and what is reviewed after execution.

## Gate 2: Context Quality

Goal: make packages more complete and more useful across realistic repositories without becoming broad repo summaries.

Remaining work:

- Improve task recipes for frontend, backend API, database/schema, refactor, bug fix, tests, documentation, build/config, and security-sensitive changes.
- Add configurable recipe extensions in `ctxpack.config.json`.
- Improve seed selection with symbol/path disambiguation and better handling of multiple plausible targets.
- Expand graph relationships for routes, API surfaces, configuration, tests, render relationships, ownership boundaries, generated-code sources, and model/schema boundaries.
- Add Python semantic enrichment through a language-service adapter when available.
- Improve checked-not-relevant records so they explain why plausible files were rejected.
- Improve token-budget behavior with deterministic truncation, overflow summaries, and package sections that preserve evidence even under budget pressure.
- Track evidence spans more precisely for file snippets and static-analysis findings.
- Improve boundary classification from project documentation and common framework conventions.
- Add deterministic reproducibility checks for equivalent packages given the same repo state, task, config, and tool versions.

Exit criteria:

- Realistic multi-file fixtures prove packages include the files needed to act safely and exclude unrelated keyword matches.
- Unknowns are specific and actionable, not generic absence statements.
- Expansion adds missing context for the stated blocked step and denies unrelated requests with checked evidence.
- Package output remains compact and schema-valid under configured budgets.

## Gate 3: Review Quality

Goal: make patch review catch whether the implementation respected the package, not just whether file paths matched.

Remaining work:

- Improve diff claim extraction from changed code and plan text.
- Detect when a final patch relies on a claim previously rejected by the assumption firewall.
- Improve duplicate-mechanism detection where existing patterns were identified as relevant evidence.
- Check that required files/symbols from the package were addressed or explicitly waived.
- Require verification status to cite commands run, failures, or waiver reasons.
- Expand SARIF output coverage and keep internal review findings richer than SARIF when needed.
- Add review awareness of context expansions and human overrides so out-of-scope changes can be justified cleanly.
- Add tests for patch scope, missing required changes, unsupported claim regressions, verification waivers, generated files, and duplicate mechanisms.

Exit criteria:

- Review findings explain what package evidence was violated or left unaddressed.
- SARIF export preserves rule id, severity, message, path, and line spans.
- Review can distinguish allowed new files from unjustified scope creep.

## Gate 4: Security, Audit, and Operations

Goal: make local artifacts and audit trails safer and clearer before adding broader integration surfaces.

Remaining work:

- Harden secret redaction tests for common token, key, and credential formats.
- Ensure errors and audit records do not leak secret values.
- Add retention/cleanup commands for `.ctxpack.db`, `.context/`, package history, reviews, and expansion history.
- Add an audit inspection command for package generation, expansion, override, gate, and review events.
- Add config validation diagnostics with actionable messages.
- Define local access-control expectations explicitly: local OS/user boundary for MVP, stronger controls required for team/cloud.
- Add version metadata for parser, TypeScript, schema, and adapter versions to support reproducibility.

Exit criteria:

- A reviewer can trace package generation, expansions, overrides, runtime gate decisions, and reviews from local artifacts.
- Secret-like values are redacted before package output and do not appear in logs.
- Operational commands exist for cleanup and audit inspection.

## Gate 5: Adapter and Language Expansion

Goal: broaden code-understanding and agent-host support without changing the core package model.

Remaining work:

- Add verified Codex adapter only after active context injection and edit/tool gating are supported cleanly.
- Add verified Gemini adapter only after equivalent injection and gating mechanisms are known.
- Add additional language adapters behind `core/ports`: Python LSP, Go, Rust, Java/Kotlin, C#, or others based on target repo demand.
- Add framework-specific adapters for route/API/model/test relationships where Tree-sitter alone is insufficient.
- Keep every adapter optional and report capability gaps when unavailable or incomplete.

Exit criteria:

- New adapters cannot bypass schema validation, evidence requirements, stale-package checks, or the assumption firewall.
- Unsupported languages still produce partial packages with explicit capability gaps.
- Adapter docs state exactly what each adapter can and cannot prove.

## Gate 6: External Surfaces

Goal: expose `ctxpack` outside the local CLI only after the local runtime contract is strict.

Remaining work:

- MCP server adapter.
- HTTP API.
- IDE extension UX.
- Cloud/team service.
- Shared repository map storage for teams or very large monorepos.
- Authentication, authorization, encryption, retention, and tenant isolation for any non-local deployment.

Exit criteria:

- External surfaces preserve mandatory context injection and edit/tool gating.
- Access control is explicit and tested.
- Cloud/team modes do not require sending an entire repository to a model.
- Local CLI behavior remains the reference implementation.

## Explicitly Deferred

These are not rejected, but they are not prerequisites for the regular Claude Code local-first gate:

- full semantic call graph for every language
- full SARIF-native review engine as the internal model
- cloud synchronization
- IDE-first workflow
- multi-user/team service
- model-provider-dependent package generation

## Decision Records To Add When Needed

Use ADRs only when a choice is expensive to reverse or affects multiple gates:

- `docs/decisions/0001-claude-code-hooks-primary.md`
- `docs/decisions/0002-shell-mutation-gating.md`
- `docs/decisions/0003-external-surface-priority.md`
- `docs/decisions/0004-team-cloud-trust-boundary.md`

Until those decisions are active, this roadmap is the source of truth for planned work.
