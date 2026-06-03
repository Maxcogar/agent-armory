# Architecture — Codebase Context Compiler

## Goal — what this architecture serves

This architecture defines a greenfield implementation of the Codebase Context Compiler: a local-first tool that builds a persistent, evidence-backed repository map and turns a user's current coding task into the smallest complete context package a coding agent needs before editing. Correctness means the implementation prevents unsupported agent assumptions by making repository facts, unknowns, relevance reasons, forbidden moves, and patch-review findings explicit and auditable. The local-optimum trap is building "chat with repo" or generic semantic search because that looks useful while failing the spec's core need: handing the agent task-scoped, verified context rather than letting it decide it has read enough. Source: `/mnt/data/spec-codebase-context-compiler.md:3-13`.

## Scope

### In scope

- A greenfield CLI-first product with a local repository index, context package generator, assumption firewall, patch reviewer, and file-based agent integration surface.
- A project/module structure suitable for implementation from an empty repository.
- The architecture style, technology stack, storage model, schemas, interfaces, data flow, security controls, and build order.
- MVP support for TypeScript/JavaScript and Python repositories, with a language-adapter boundary that allows later expansion.

### Deferred

- IDE extension UX. Reason: the spec requires human-readable and machine-readable packages, not an IDE-first workflow (`/mnt/data/spec-codebase-context-compiler.md:272-298`).
- MCP server adapter. Reason: the spec leaves integration protocol unresolved, and the CLI/file contract satisfies the MVP while keeping MCP as an adapter later (`/mnt/data/spec-codebase-context-compiler.md:772-778`).
- Cloud/team service. Reason: the security and trust-boundary decision is unresolved in the spec (`/mnt/data/spec-codebase-context-compiler.md:820-826`).
- Model-provider integration. Reason: the spec explicitly leaves model usage unresolved (`/mnt/data/spec-codebase-context-compiler.md:788-794`).

### Out of scope

- A general coding agent.
- A generic vector-search/RAG product.
- Automated code modification.
- Guaranteeing semantic correctness of generated code.
- Sending entire repositories to an LLM.

Source: `/mnt/data/spec-codebase-context-compiler.md:15-43`, `/mnt/data/spec-codebase-context-compiler.md:668-676`.

## Architectural drivers

### Stakeholders and concerns

| Stakeholder | Concern |
|---|---|
| Human developer | Must audit why each fact, file, unknown, and constraint was included. |
| Coding agent | Must receive enough task-scoped context to act without guessing. |
| Agent orchestrator | Needs stable machine-readable packages and failure states. |
| Security reviewer | Needs assurance that secrets, private code, and prompt-injection content are not leaked or obeyed. |
| Implementer | Needs a buildable module structure and settled architectural boundaries. |

### Architecturally significant requirements

The requirements that shape the architecture are FR1-FR24, NFR1-NFR7, SR1-SR5, AIR1-AIR4, and PR1-PR5. Load-bearing highlights:

- Persistent repository map with files, symbols, imports, references, routes, APIs, data models, tests, configuration, and patterns: FR1, FR18 (`/mnt/data/spec-codebase-context-compiler.md:132-137`, `/mnt/data/spec-codebase-context-compiler.md:337-349`).
- Multi-source code understanding using AST parsing, LSP-compatible language services, static analysis, and text search: FR2 (`/mnt/data/spec-codebase-context-compiler.md:139-145`).
- Task classification and recipe-driven context selection: FR3-FR4 (`/mnt/data/spec-codebase-context-compiler.md:147-176`).
- Dependency/relationship-based context expansion: FR5 (`/mnt/data/spec-codebase-context-compiler.md:177-197`).
- Minimum complete context, evidence-backed facts, known/unknown separation, allowed creation points, forbidden moves, checked-and-rejected files: FR6-FR11 (`/mnt/data/spec-codebase-context-compiler.md:198-271`).
- JSON-schema-validated context package and human-readable companion: FR12-FR13 (`/mnt/data/spec-codebase-context-compiler.md:272-285`).
- Assumption firewall and patch review: FR15-FR16, PR1-PR5 (`/mnt/data/spec-codebase-context-compiler.md:299-329`, `/mnt/data/spec-codebase-context-compiler.md:638-668`).
- Security controls for source confidentiality, secrets, prompt injection, access control, and audit trail: SR1-SR5 (`/mnt/data/spec-codebase-context-compiler.md:456-516`).

### Prioritized quality attributes

| Priority | ISO/IEC 25010 characteristic | Spec basis | Architectural consequence |
|---:|---|---|---|
| 1 | Security | SR1-SR5 | Local-first storage, secret redaction, no default remote model calls, prompt-injection isolation. |
| 2 | Functional suitability / accuracy | FR1-FR24 | Structured graph + evidence store, not embeddings alone. |
| 3 | Maintainability | NFR4, NFR5 | Modular core with pluggable language adapters and incremental index updates. |
| 4 | Usability / operability | FR13, NFR1, NFR7 | Markdown package, override mechanism, readable audit trails. |
| 5 | Performance efficiency | NFR3, NFR5 | Incremental indexing, token-budget-aware pack assembly, local SQLite persistence. |
| 6 | Compatibility / portability | FR17, FR12 | JSON Schema and optional SARIF adapter. |

### Constraints and readiness assumptions

- Greenfield project; no existing implementation or project structure was provided (`/mnt/data/spec-codebase-context-compiler.md:74-90`).
- The system must support repositories larger than one model context and must not require sending an entire repo to a model (`/mnt/data/spec-codebase-context-compiler.md:668-671`).
- Assumption A1: MVP is single-user local CLI. Basis: the spec's trust boundary and human review workflow are unresolved, while the constraints emphasize avoiding full-repo remote model transmission.
- Assumption A2: MVP repository size target is "typical non-trivial single repo," not monorepo fleet scale. Basis: the spec requires incremental updates and large-context avoidance, but gives no numeric scale.
- Assumption A3: Supported MVP languages are TypeScript/JavaScript and Python. Basis: the spec leaves supported languages unresolved, and these provide high-value coverage while validating the adapter boundary.

## Technology and architectural style

Chosen style: **local-first modular CLI with a pipeline core and adapter ports**. The implementation is one deployable CLI package with internally separated modules for indexing, graph storage, task analysis, package assembly, assumption checking, patch review, and output adapters. Justification: D2.

Chosen stack:

- **TypeScript on current LTS Node.js** for the CLI and orchestration layer. Justification: D3.
- **SQLite with FTS5** for local persistent index, graph tables, package history, and searchable text/evidence. Justification: D4.
- **Tree-sitter** for syntax-tree parsing and language-neutral symbol/import extraction. Justification: D5.
- **LSP-compatible adapters** for definitions/references/diagnostics when language servers are available. Justification: D6.
- **JSON Schema Draft 2020-12** with AJV for context-package validation. Justification: D7.
- **SARIF 2.1.0-compatible review export adapter** for patch findings. Justification: D8.
- **File-system CLI contract plus mandatory agent harness** producing `.context/task-context.json`, `.context/task-context.md`, `.context/review.json`, optional `.context/review.sarif`, and a runtime path that injects mandatory package sections into the agent's active context before planning or editing. Justification: D9.

## Components and structure

### Runtime components

```text
ctxpack CLI
  -> Config Loader
  -> Repo Snapshotter
  -> Index Pipeline
       -> File Scanner
       -> Tree-sitter Parse Adapters
       -> LSP Adapter Host
       -> Static Analysis Importer
       -> Evidence Extractor
       -> Repository Graph Store
  -> Task Intake
       -> Task Classifier
       -> Context Recipe Engine
       -> Graph Expansion Engine
       -> Relevance Scorer
       -> Completeness Evaluator
  -> Context Package Builder
       -> JSON Package Writer
       -> Markdown Package Writer
       -> JSON Schema Validator
  -> Agent Execution Harness
       -> Package Loader
       -> Mandatory Context Selector
       -> Agent Context Injector
       -> Edit Gate
  -> Assumption Firewall
       -> Plan Claim Extractor
       -> Package Claim Checker
  -> Patch Reviewer
       -> Diff Reader
       -> Scope Checker
       -> Impact Checker
       -> SARIF Adapter
  -> Audit Log
```

### Data flow

1. `ctxpack index <repo>` snapshots repository state, applies exclude rules, parses supported files, queries language services when available, and writes the repository map.
2. `ctxpack package "<task>"` classifies the task, selects a context recipe, expands related files/symbols through the graph, extracts evidence spans, validates package completeness, then emits JSON and Markdown.
3. `ctxpack run-agent --task <task-package> -- <agent command>` loads the validated JSON package, selects the mandatory context sections, injects them into the agent's active runtime context, requires an agent plan, and keeps the edit gate closed until the plan passes assumption-firewall validation.
4. `ctxpack check-plan <plan-file>` extracts factual claims from an agent plan and checks them against the package's facts, unknowns, allowed creation points, and forbidden moves. This command is also used internally by `run-agent`.
5. `ctxpack review <diff>` compares modified files and claims against the package and emits JSON review findings plus optional SARIF.

### Project structure

```text
codebase-context-compiler/
  package.json
  tsconfig.json
  src/
    cli/
      main.ts
      commands/
        index.ts
        package.ts
        check-plan.ts
        review.ts
    core/
      domain/
        repository-map.ts
        context-package.ts
        task.ts
        evidence.ts
        review-finding.ts
      ports/
        parser-adapter.ts
        language-service-adapter.ts
        storage.ts
        static-analysis-importer.ts
        model-assist.ts
      services/
        indexer.ts
        task-classifier.ts
        recipe-engine.ts
        graph-expander.ts
        package-builder.ts
        assumption-firewall.ts
        patch-reviewer.ts
    adapters/
      tree-sitter/
        index.ts
        languages/
          typescript.ts
          javascript.ts
          python.ts
      lsp/
        lsp-host.ts
        typescript-language-service.ts
        pylsp-adapter.ts
      storage/
        sqlite-storage.ts
        migrations/
      schema/
        context-package.schema.json
        review.schema.json
      sarif/
        sarif-writer.ts
      markdown/
        package-markdown-writer.ts
    security/
      secret-scanner.ts
      prompt-injection-classifier.ts
      redaction.ts
      audit-log.ts
    config/
      default-excludes.ts
      config-schema.ts
  tests/
    fixtures/
    unit/
    integration/
    acceptance/
  docs/
    package-format.md
    cli-contract.md
```

### Core conventions

- `core/` must not import from `adapters/`; adapters depend inward on core ports.
- Repository facts are immutable per repository snapshot.
- Any fact exposed to an agent must carry an evidence reference or be explicitly marked as an assumption/unknown.
- Generated package files are build artifacts and live under `.context/` in the target repository unless configured otherwise.
- Language adapters may be incomplete, but they must report capability gaps explicitly.
- All output schemas are versioned.

## Quality characteristics addressed (ISO/IEC 25010)

| Characteristic | How advanced | Decisions |
|---|---|---|
| Functional suitability | Graph-backed context compilation, task recipes, evidence spans, unknown separation, assumption firewall, patch review. | D1, D2, D5, D6, D9, D10 |
| Security | Local-first mode, secret redaction, prompt-injection isolation, audit logging, no default remote repo transmission. | D3, D10, D11 |
| Maintainability | Ports/adapters, modular pipeline, versioned schemas, language adapters. | D1, D5, D6, D7 |
| Performance efficiency | Incremental parsing, snapshot-based indexing, SQLite/FTS5 local storage, token budgeting. | D4, D5 |
| Compatibility | JSON Schema package validation, SARIF-compatible review export, file-based CLI output. | D7, D8, D9 |
| Usability | Markdown companion package and explicit relevance/unknown/forbidden sections. | D9, D10 |

## Design decisions

### Knowledge-state baseline

- Verified facts from the spec: the product must build a repository map, generate task-scoped context packages, ground facts in evidence, separate knowns/unknowns, block unsupported claims, and review patches. Sources: `/mnt/data/spec-codebase-context-compiler.md:92-128`, `/mnt/data/spec-codebase-context-compiler.md:130-405`, `/mnt/data/spec-codebase-context-compiler.md:606-668`.
- Verified standards named by the spec: LSP 3.17, Tree-sitter, JSON Schema Draft 2020-12, SARIF 2.1.0, OWASP guidance. Source: `/mnt/data/spec-codebase-context-compiler.md:44-72`.
- Inference: a local-first CLI is the safest MVP because cloud trust boundary and model usage are unresolved.
- Speculation/assumption: TypeScript/JavaScript and Python are the MVP language targets; numeric repo-scale limits are not specified.
- Default-stack reflex to guard against: building a web app with vector search and a chat UI. Rejected because the spec asks for context packaging and assumption control, not conversational search.

### D1 — Use a modular pipeline with ports/adapters

1. **Decision.** The system is a modular pipeline in one deployable CLI, with core domain services behind ports and implementation adapters for parsing, LSP, storage, schema validation, Markdown output, and SARIF export.
2. **Authoritative standard.** SOLID dependency inversion and ISO/IEC/IEEE 42010 decision rationale discipline.
3. **Why this applies.** The spec requires language-agnostic core behavior, multiple code-understanding sources, and unresolved future integration protocols; ports/adapters prevent those concerns from collapsing into one implementation knot.
4. **What this is NOT — and why.** Not a microservice system: the spec has no multi-tenant/cloud requirement and security favors local-first. Not a monolithic script: FR1-FR24 require distinct responsibilities. Not a plugin free-for-all: adapters must satisfy stable core ports.
5. **Premise verification.** Spec lines verified: FR1-FR2 and NFR4 require repository mapping, multi-source understanding, and language-agnostic core (`/mnt/data/spec-codebase-context-compiler.md:132-145`, `/mnt/data/spec-codebase-context-compiler.md:428-434`). No external library premise.

Addresses: FR1-FR5, FR12-FR17, NFR4, U1-U5.

### D2 — Choose local-first modular CLI with mandatory agent execution harness

1. **Decision.** The MVP is a local CLI that persists JSON/Markdown package artifacts and provides an agent execution harness. The harness is the supported path for agent execution: it loads the validated Context Package, injects mandatory package sections into the agent's active context before planning, requires an agent plan, runs the assumption firewall, and keeps the edit gate closed until the plan passes. File artifacts are audit records and adapter inputs; they are not the enforcement mechanism by themselves.
2. **Authoritative standard.** First-principles anchor: goal is to provide reliable task context before edits; local-optimum shortcut is writing a package file and trusting an unreliable agent to find/read it; chosen path makes context a concrete artifact plus a runtime-controlled injection step that the agent cannot skip.
3. **Why this applies.** The spec's core product is a Context Package and AIR1 requires the agent runtime to inject the package before the agent can plan or edit.
4. **What this is NOT — and why.** It is not “write `.context/task-context.md` and tell the agent to read it,” because that depends on the exact agent behavior the product exists to correct. It is not MCP-first or IDE-first, because those narrow the first implementation to one host environment. It is not a general web service, because the spec does not require multi-tenant operation and local-first operation reduces trust boundaries.

Weighted decision matrix:

| Option | Security 0.30 | Auditability 0.25 | Integration enforcement 0.20 | Maintainability 0.15 | Future adaptability 0.10 | Score |
|---|---:|---:|---:|---:|---:|---:|
| Local CLI + mandatory harness | 5: no server by default | 5: artifacts and gate results are inspectable | 5: package injection and edit gating are runtime-controlled | 4: simple deployable with clear adapters | 4: MCP/HTTP/IDE adapters can wrap it | 4.80 |
| Passive local file contract | 5: no server by default | 5: artifacts are inspectable | 1: relies on the agent choosing to read files | 4: simple deployable | 4: adapters can wrap it | 3.80 |
| MCP-first server | 3: local possible but server surface exists | 4: tool calls can be logged | 4: agent-native tool path can enforce reads | 4: clean protocol | 5: agent-native | 3.85 |
| HTTP web service | 2: larger trust boundary | 4: API logs possible | 4: server can gate workflow | 3: ops burden | 4: broad | 3.25 |
| IDE extension first | 4: local | 3: UX-heavy artifacts can drift | 4: IDE can inject context | 2: extension complexity | 3: narrow | 3.35 |

5. **Premise verification.** Spec lines verified: Context Package is core artifact, AIR1 requires runtime injection rather than passive file reading, and integration details remain open beyond the required harness (`/mnt/data/spec-codebase-context-compiler.md:680-686`, `/mnt/data/spec-codebase-context-compiler.md:608-616`, `/mnt/data/spec-codebase-context-compiler.md:772-778`). No library premise.

Addresses: FR12-FR15, AIR1-AIR4, NFR1, NFR7, U1.

### D3 — Use TypeScript on Node.js for CLI and orchestration

1. **Decision.** Implement the CLI and core orchestration in TypeScript targeting current LTS Node.js.
2. **Authoritative standard.** First-principles anchor: goal is a tool that can define machine-readable contracts precisely while integrating with language tooling; shortcut is choosing Python only because it is fast for scripting.
3. **Why this applies.** TypeScript gives typed package schemas and CLI contracts while staying close to LSP's TypeScript-defined protocol surfaces and JavaScript tooling ecosystems.
4. **What this is NOT — and why.** Not Python-only: strong for scripting but weaker fit for TypeScript/LSP protocol typing. Not Rust-first: good performance but increases implementation friction before product boundaries are proven. Not a browser app: not aligned with local indexing and patch review.
5. **Premise verification.** Official LSP 3.17 docs state the protocol uses TypeScript definitions for base structures and supports JSON-RPC messages with capability negotiation. Verified at `https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/`, accessed 2026-06-02. Spec leaves language stack open (`/mnt/data/spec-codebase-context-compiler.md:9`).

Addresses: FR2, FR12, AIR1-AIR4, U5.

### D4 — Use SQLite with FTS5 as local persistence

1. **Decision.** Store repository snapshots, files, symbols, edges, evidence spans, packages, and review findings in SQLite; use FTS5 for searchable file/evidence text.
2. **Authoritative standard.** First-principles anchor: goal is durable, local, queryable repository intelligence without introducing a server.
3. **Why this applies.** The spec requires persistence, incremental updates, searchability, and auditability but does not require distributed storage.
4. **What this is NOT — and why.** Not a vector DB as the primary store: embeddings cannot be the source of truth for evidence. Not PostgreSQL: unnecessary server dependency for local-first MVP. Not flat JSON only: inefficient for relationship traversal and incremental updates.
5. **Premise verification.** SQLite FTS5 official documentation describes the FTS5 extension and external/contentless storage options for full-text indexing. Verified at `https://sqlite.org/fts5.html`, accessed 2026-06-02. Spec constraints require large-repo context avoidance and enough evidence for review (`/mnt/data/spec-codebase-context-compiler.md:668-676`).

Addresses: FR1, FR6-FR7, FR18-FR20, NFR1, NFR3, NFR5.

### D5 — Use Tree-sitter as the baseline parser adapter

1. **Decision.** Use Tree-sitter adapters for syntax-tree parsing, import/export extraction, symbol candidates, and evidence spans for supported languages.
2. **Authoritative standard.** Tree-sitter documentation.
3. **Why this applies.** FR2 names Tree-sitter as a source for syntax-aware parsing, and language-agnostic parsing supports the adapter model.
4. **What this is NOT — and why.** Not regex-based extraction: too brittle for evidence-backed facts. Not LSP-only: language servers vary and may not be available. Not compiler-specific only: too hard to generalize across languages.
5. **Premise verification.** Official Tree-sitter docs describe Tree-sitter as a parser generator tool and incremental parsing library that builds concrete syntax trees and can update them efficiently. Verified at `https://tree-sitter.github.io/tree-sitter/`, accessed 2026-06-02. Spec lines verified: FR2 and NFR5 (`/mnt/data/spec-codebase-context-compiler.md:139-145`, `/mnt/data/spec-codebase-context-compiler.md:435-441`).

Addresses: FR1, FR2, FR5, FR7, FR18-FR19, NFR4-NFR5.

### D6 — Use LSP-compatible adapters for semantic references and diagnostics

1. **Decision.** Add optional LSP adapters that can enrich the graph with definitions, references, workspace symbols, and diagnostics when a language server is configured.
2. **Authoritative standard.** Language Server Protocol 3.17.
3. **Why this applies.** The spec names LSP 3.17 for symbol/navigation concepts and diagnostics ingestion.
4. **What this is NOT — and why.** Not a hard dependency for indexing: unsupported languages must still produce partial packages. Not an editor extension: LSP concepts are consumed by the local indexer.
5. **Premise verification.** LSP 3.17 official spec defines versioned protocol behavior, JSON-RPC messaging, capability negotiation, and language features such as workspace symbols and diagnostics. Verified at `https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/`, accessed 2026-06-02. Spec source: `/mnt/data/spec-codebase-context-compiler.md:48-51`, `/mnt/data/spec-codebase-context-compiler.md:139-145`.

Addresses: FR1-FR2, FR5, FR17, NFR4.

### D7 — Validate package files with JSON Schema Draft 2020-12 and AJV

1. **Decision.** Define `context-package.schema.json` and `review.schema.json` using JSON Schema Draft 2020-12 and validate them with AJV.
2. **Authoritative standard.** JSON Schema Draft 2020-12.
3. **Why this applies.** FR12 requires a standard or standard-equivalent schema mechanism, and the spec's decision D6 requires JSON Schema.
4. **What this is NOT — and why.** Not TypeScript types alone: compile-time types do not validate files consumed by external agents. Not ad hoc runtime checks: they are harder to audit and version.
5. **Premise verification.** JSON Schema Draft 2020-12 official page identifies the draft and validation vocabulary; the validation spec states JSON Schema is used for JSON instance validation and assertions about valid document shape. Verified at `https://json-schema.org/draft/2020-12` and `https://json-schema.org/draft/2020-12/json-schema-validation`, accessed 2026-06-02. AJV official docs state support for JSON Schema draft 2020-12. Verified at `https://ajv.js.org/json-schema.html`, accessed 2026-06-02. Spec lines: `/mnt/data/spec-codebase-context-compiler.md:272-277`, `/mnt/data/spec-codebase-context-compiler.md:700-706`.

Addresses: FR12, AC10, NFR2.

### D8 — Emit SARIF-compatible patch findings

1. **Decision.** Patch-review findings use an internal `ReviewFinding` model and support export to SARIF 2.1.0.
2. **Authoritative standard.** SARIF 2.1.0 OASIS Standard.
3. **Why this applies.** FR17 requires SARIF support or an adapter path without losing file location, rule ID, message, or severity.
4. **What this is NOT — and why.** Not SARIF as the internal domain model: the product has domain-specific findings that may not map one-to-one. Not no-SARIF: that would violate FR17's preferred interchange path.
5. **Premise verification.** OASIS SARIF 2.1.0 official standard defines a format for static analysis tool output. Verified at `https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html`, accessed 2026-06-02. Spec source: `/mnt/data/spec-codebase-context-compiler.md:330-335`, `/mnt/data/spec-codebase-context-compiler.md:704-706`.

Addresses: FR17, PR1-PR5.

### D9 — Use a two-artifact context package: JSON authority + Markdown review copy

1. **Decision.** The canonical package is JSON validated by schema; Markdown is generated from JSON and is non-authoritative.
2. **Authoritative standard.** JSON Schema Draft 2020-12 plus first-principles anchor: machines need strict validation; humans need readable audit.
3. **Why this applies.** The spec requires both machine-readable and human-readable context packages.
4. **What this is NOT — and why.** Not Markdown-only: agents and validators need structure. Not JSON-only: human review is a required stakeholder concern.
5. **Premise verification.** Spec lines verified: FR12-FR13 and schema fields (`/mnt/data/spec-codebase-context-compiler.md:272-285`, `/mnt/data/spec-codebase-context-compiler.md:516-605`).

Addresses: FR12-FR13, NFR1, NFR7, AC1-AC2.

### D10 — Model context as evidence-bearing typed records

1. **Decision.** Repository facts, task facts, unknowns, assumptions, allowed creation points, forbidden moves, and checked-rejected files are separate typed records in the package schema.
2. **Authoritative standard.** First-principles anchor: the goal is preventing unsupported assumptions; the shortcut is summarizing context in prose, which makes facts and assumptions blur together.
3. **Why this applies.** FR7-FR11 and FR24 require fact grounding, known/unknown separation, allowed creation points, forbidden moves, and no silent guessing.
4. **What this is NOT — and why.** Not a single summary field: too lossy. Not confidence-only scoring: a confidence number without evidence does not satisfy auditability.
5. **Premise verification.** Spec lines verified: FR7-FR11, FR24, NFR1, schema requirements (`/mnt/data/spec-codebase-context-compiler.md:205-271`, `/mnt/data/spec-codebase-context-compiler.md:398-412`, `/mnt/data/spec-codebase-context-compiler.md:516-605`).

Addresses: FR6-FR13, FR20, FR24, NFR1-NFR2.

### D11 — Security controls are built into indexing and output, not added later

1. **Decision.** The indexer includes secret detection/redaction, prompt-injection classification of repository text, local audit logging, and an output policy that prevents hidden repository text from being treated as instructions.
2. **Authoritative standard.** OWASP ASVS for access/control logging principles and OWASP prompt-injection guidance as a threat class for LLM systems; spec SR1-SR5.
3. **Why this applies.** The tool handles proprietary source code, credentials in repositories, and repository text that may contain malicious instructions.
4. **What this is NOT — and why.** Not "trust the repo text": prompt injection is explicitly in scope. Not cloud-first secret scanning: secrets should be detected before remote exposure. Not access control deferred to later: source confidentiality is a spec security requirement.
5. **Premise verification.** Spec threat model and SR1-SR5 verified at `/mnt/data/spec-codebase-context-compiler.md:456-516`. OWASP ASVS is used as a control taxonomy; prompt-injection premise is directly in the spec, so no external behavior premise is needed.

Addresses: SR1-SR5, FR24, NFR1.

### D12 — Numbered reasoning chain for the package-generation path

1. Task package correctness depends on selecting enough context without dumping the repo.
2. Keyword search alone can find matching files but cannot prove material relationship.
3. Pure dependency traversal can include too much code because dependency graphs fan out quickly.
4. Therefore package generation must start with a task recipe that defines required context categories.
5. Step 4 revises step 2: keyword search becomes one evidence source, not the selection driver.
6. Graph expansion then pulls only relationships that satisfy the recipe: imports, callers, route ownership, tests, config, patterns, and impact links.
7. Completeness is checked by unmet recipe slots and explicit unknowns, not by an agent saying it read enough.
8. Package use is enforced by the execution harness injecting mandatory package sections into active agent context; it is not enforced by expecting the agent to discover or read files.
8. The package is valid only after JSON Schema validation and audit fields exist for every non-trivial fact.

Addresses: FR3-FR14, FR20, FR24.

### D13 — Pre-delivery multi-perspective review

- **Implementer/planner question:** Can a planner produce file-level steps without making architectural decisions inline? Answer: yes; project structure, components, storage, schema, language adapters, CLI contracts, and build order are defined.
- **Reviewer question:** Can a reviewer verify the build against decisions and contracts? Answer: yes; each non-trivial decision has sources, alternatives, premise verification, and traceability.
- **Stakeholder question:** Can a stakeholder see how the spec is satisfied and where it can break? Answer: yes; the architecture records local-first assumptions, deferred cloud/MCP/IDE work, threat model, and limitations.
- **Synthesis:** No perspective-specific gap remained after adding explicit adapter boundaries, project structure, and build order.

## Threat model

Security is in scope because the tool processes proprietary source code, secrets, private architecture, external integrations, and prompt text.

### T1 — Stored index leaks proprietary source code

- **Observation:** Repository map stores file paths, symbols, snippets, evidence spans, and package history.
- **Question:** Can an attacker with filesystem access reconstruct private code or architecture?
- **Hypothesis:** If storage is local, access-controlled by OS permissions, and secret/content redaction is applied before package output, blast radius is reduced to the user's machine/account.
- **Experiment/control:** Store index under user-local config/cache path with restrictive permissions; scan package output for secrets and redact matching values. If control works, generated packages do not expose detected secrets; if it fails, secrets appear in package artifacts.
- **Analysis:** Local-first does not eliminate local compromise risk, but avoids adding a network trust boundary in the MVP.
- **Conclusion:** Use local storage, redaction, and audit logs. Controls: D3, D4, D11.

### T2 — Prompt injection in repository text manipulates the coding agent

- **Observation:** Source files and docs may contain instructions such as "ignore previous instructions."
- **Question:** Can repo text become agent instructions instead of evidence?
- **Hypothesis:** If package fields distinguish evidence content from instructions and flag prompt-injection-like text, the agent workflow can treat repository text as data.
- **Experiment/control:** Include malicious fixture text in a repository. Expected success: package quotes it only as evidence, labels it as repository content, and does not place it in instruction sections. Expected failure: malicious text appears as an instruction.
- **Analysis:** The package format must be defensive, not just the agent prompt.
- **Conclusion:** Separate fact/evidence/instruction fields and classify suspicious text. Control: D10, D11.

### T3 — Unsupported agent plan claim causes unsafe or wrong edits

- **Observation:** Agents invent components/files and treat unknowns as facts.
- **Question:** Can unsupported factual claims be detected before editing?
- **Hypothesis:** If implementation plans are checked against package facts, unknowns, and allowed creation points, unsupported claims can be blocked.
- **Experiment/control:** Feed a plan claiming a nonexistent component exists. Expected success: assumption firewall flags unsupported claim. Expected failure: plan passes.
- **Analysis:** This is the product's central safety mechanism.
- **Conclusion:** Assumption firewall is mandatory before edits. Control: D10.

### T4 — Malicious or accidental modifications outside scoped context

- **Observation:** Patches can touch files unrelated to the package.
- **Question:** Can the review step detect out-of-scope modifications?
- **Hypothesis:** If patch review compares diff paths and changed symbols to package allowed files/creation points, out-of-scope edits are detectable.
- **Experiment/control:** Modify an unrelated file after package generation. Expected success: review flags diff-scope violation. Expected failure: unrelated file passes silently.
- **Analysis:** Patch review closes the loop after generation.
- **Conclusion:** Diff scope review and impact review are required. Control: D8, D10.

## ASVS verification mapping

| ASVS/control area | Applicability | Architecture decision |
|---|---|---|
| Access control | Local single-user MVP; OS/user account is the boundary. Team/cloud access deferred. | D2, D11; limitation L1 |
| Secrets and sensitive data protection | Applicable because repositories may contain credentials. | D11 |
| Logging and audit trail | Applicable for package/review actions and overrides. | D11 |
| Input validation | Applicable to CLI inputs, config, package JSON, review JSON. | D7, D9 |
| Error handling | Applicable; errors must not leak secrets into packages/logs. | D11 |
| Authentication/session management | Not applicable to local CLI MVP; required if cloud/team service is added. | Deferred; limitation L1 |

## Foundation and build order

### Foundational skeleton

1. Create package scaffolding, TypeScript config, CLI entrypoint, test harness, and core domain types.
2. Define JSON schemas for context package and review findings.
3. Build SQLite storage migrations and repository snapshot model.
4. Implement file scanner, exclude handling, and evidence-span model.
5. Add Tree-sitter parser adapters for TypeScript/JavaScript and Python.
6. Implement graph tables and graph expansion service.
7. Implement task classifier and context recipe engine.
8. Implement package builder, schema validator, and Markdown writer.
9. Implement agent execution harness: package loader, mandatory context selector, agent context injector, and edit gate.
10. Implement assumption firewall and connect it to the harness plan gate.
11. Implement patch reviewer and SARIF adapter.
12. Add security layer: secret redaction, prompt-injection labels, audit log.
13. Add acceptance fixtures and end-to-end CLI tests.

### Dependency order

Core domain types must precede adapters. Schemas must precede package output. Storage must precede indexing. Parser adapters must precede graph expansion. Task recipes must precede package assembly. Package assembly must precede the agent execution harness. The harness must precede assumption-firewall integration because the harness owns the edit gate. Assumption firewall and package data must precede patch review. Security redaction must be active before any package writer is considered complete.

## Traceability matrix

| Spec item | Architecture coverage |
|---|---|
| FR1 Repository Indexing | D1, D4, D5, D6 |
| FR2 Multi-Source Understanding | D1, D5, D6 |
| FR3 Task Classification | D12, components: Task Classifier |
| FR4 Context Requirement Recipe | D12, components: Recipe Engine |
| FR5 Relationship Expansion | D1, D4, D12 |
| FR6 Minimum Complete Context | D10, D12 |
| FR7 Evidence-Backed Facts | D4, D10 |
| FR8 Known/Unknown Separation | D10 |
| FR9 Allowed Creation Points | D10 |
| FR10 Forbidden Moves | D10 |
| FR11 Checked-and-Rejected Files | D10 |
| FR12 Machine-Readable Package | D7, D9 |
| FR13 Human-Readable Package | D9 |
| FR14 Context Expansion Requests | D2, D9 |
| AIR1 Runtime Package Injection | D2, components: Agent Execution Harness |
| FR15 Assumption Firewall | D2, D10, components: Assumption Firewall |
| FR16 Patch Review | D8, D10 |
| FR17 Static Analysis Interchange | D8 |
| FR18 Versioned Repository Map | D4 |
| FR19 Staleness Detection | D4, foundation build order |
| FR20 Relevance Explanation | D10 |
| FR21 Boundary Detection | D5, D6, task recipes |
| FR22 Existing Pattern Discovery | D5, D6, D10 |
| FR23 Completion Criteria Generation | D12; package builder |
| FR24 No Silent Guessing | D10, D11 |
| NFR1 Auditable Output | D9, D10, D13 |
| NFR2 Deterministic Enough | D7, D10 |
| NFR3 Token Budget Awareness | D12 |
| NFR4 Language-Agnostic Core | D1, D5, D6 |
| NFR5 Incremental Updates | D4, D5 |
| NFR6 Confidence/Completeness | D10, D12 |
| NFR7 Human Override | D9, D11 audit log |
| SR1 Source Code Confidentiality | D2, D4, D11, T1 |
| SR2 Secret Handling | D11, T1 |
| SR3 Prompt-Injection Resistance | D10, D11, T2 |
| SR4 Access Control | D2, D11, ASVS mapping |
| SR5 Audit Trail | D11 |
| AIR1-AIR4 | D2, D9, D10 |
| PR1-PR5 | D8, D10 |
| AC1-AC10 | Covered by D1-D12 and build order; validated in acceptance tests |

## Limitations and trade-offs

- **L1 — Local single-user assumption.** The MVP uses local OS/user-account boundaries. Cloud/team deployment requires a separate architecture for authentication, authorization, multi-tenancy, encryption, and retention.
- **L2 — Language coverage.** TypeScript/JavaScript and Python are selected for MVP; other languages require adapters.
- **L3 — Semantic completeness.** Tree-sitter provides syntax trees, not full semantic understanding. LSP enrichment improves semantic references when configured, but capability gaps must be reported.
- **L4 — No model-provider decision.** The architecture does not require an LLM for MVP classification. If models are added, privacy and prompt-injection controls must be revisited.
- **L5 — SQLite scale ceiling.** SQLite is correct for local MVP and many non-trivial repos; very large monorepos or team-scale shared indexing may require a different storage architecture.
- **L6 — Official standard access.** Premises were verified through public official documentation accessed on 2026-06-02. Future implementation should pin dependency versions and re-check docs at build time.

## Standards governing this architecture

| Standard/source | What it governs |
|---|---|
| `/mnt/data/spec-codebase-context-compiler.md` | Product requirements, scope, security model, unresolved decisions. |
| ISO/IEC/IEEE 42010 | Architecture description discipline: stakeholders, concerns, decisions, rationale, traceability. |
| ISO/IEC 25010 | Quality-characteristic mapping. |
| SOLID / dependency inversion | Core ports/adapters module boundary. |
| Language Server Protocol 3.17 | Symbol/reference/diagnostics concepts and optional LSP adapter behavior. |
| Tree-sitter documentation | Syntax-aware incremental parsing baseline. |
| JSON Schema Draft 2020-12 | Context package and review package validation. |
| AJV documentation | Runtime validation support for JSON Schema 2020-12. |
| SARIF 2.1.0 OASIS Standard | Patch-review finding export format. |
| SQLite FTS5 documentation | Local full-text search storage behavior. |
| OWASP ASVS / OWASP threat-modeling principles | Security control taxonomy and threats-before-controls discipline. |

## Status of this architecture

This architecture passes the Design → Build quality gate for a greenfield MVP: every non-trivial design decision names an anchor, rejected alternatives are stated, premise verification is recorded or scoped, security threats are mapped to controls, traceability accounts for all spec requirements, and the foundation/build order is established. The next step is a build plan that consumes this architecture plus `/mnt/data/spec-codebase-context-compiler.md` and turns the foundation order into file-level implementation steps.
