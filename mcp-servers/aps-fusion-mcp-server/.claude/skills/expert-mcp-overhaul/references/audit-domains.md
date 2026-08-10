# Audit Domains and Criteria

This file is read at Phase 2 (Standards grounding) and worked at Phase 3 (Audit). It enumerates what a production-grade MCP server must satisfy, organized into seven domains. The domain frame maps onto ISO/IEC 25010's quality characteristics — functional suitability, security, reliability, maintainability, performance efficiency, compatibility, portability — applied to the specific shape of an MCP server.

## How to use this file

**Instantiate, then work.** At Phase 2, mark which items apply to this server's transports, language, and dependency surface, and record why the skipped ones do not apply. An item silently skipped is an unverified absence claim.

**Evidence per item.** Every item is answered with evidence, in both directions. A violation is a finding with file:line, the cited standard, and the verification method. A satisfaction is also recorded — "audited, no findings" against an item means the item was actually checked, and the coverage table says with what (Read range or grep).

**The [CURRENT-SPEC] flag.** Items carrying this flag state requirements whose authority is the MCP specification itself. The protocol revises frequently — the requirements below were verified against the live spec revision **2025-11-25** on **2026-07-16** (this skill's authoring date), and the protocol maintainers had already announced a further major revision in release-candidate form at that time. Before citing any [CURRENT-SPEC] item in a finding, re-verify its wording against the revision you fetched in Phase 2. If the current revision has changed the requirement, the fetched spec wins and this file needs an update — report that upstream. This file orients; the spec governs.

**Discovery entry point:** `https://modelcontextprotocol.io/llms.txt` is the site's documentation index; use it to locate the current revision's pages rather than constructing URLs from memory.

---

## Domain A — Protocol and lifecycle conformance

*Quality characteristics: functional suitability, compatibility. Authority: the fetched MCP specification.*

- **A1. Initialization.** [CURRENT-SPEC] The server completes the initialize exchange correctly: protocol version negotiation handled, declared capabilities match what is actually implemented. A capability declared but not implemented, or implemented but not declared, is a finding either way.
- **A2. Transport conformance — stdio.** [CURRENT-SPEC] For stdio servers, verified against spec revision 2025-11-25: the server MUST NOT write anything to stdout that is not a valid MCP message; messages are newline-delimited JSON-RPC with no embedded newlines; logging goes to stderr (or a file), never stdout. A single stray `print()`/`console.log` on the protocol channel corrupts the stream — audit for every path that can reach stdout, including dependencies that print.
- **A3. Transport conformance — Streamable HTTP.** [CURRENT-SPEC] For HTTP servers, verified against spec revision 2025-11-25: a single MCP endpoint supporting POST and GET; correct content-type negotiation (`application/json` and `text/event-stream`); the `MCP-Protocol-Version` header handled on requests; session management via `MCP-Session-Id` if the server is stateful (cryptographically secure IDs, 404 on terminated sessions). The Origin/DNS-rebinding and binding requirements are audited under Domain C.
- **A4. Deprecated protocol generation.** [CURRENT-SPEC] The HTTP+SSE transport (protocol revision 2024-11-05) is deprecated in favor of Streamable HTTP. A server built on the deprecated transport, or on a pre-1.0 SDK idiom the current SDK has replaced, is a generation-mismatch finding — and a strong rebuild indicator (see verdict-criteria.md).
- **A5. JSON-RPC correctness.** [CURRENT-SPEC] Request/response id handling is correct; error responses use proper JSON-RPC error objects; notifications are not answered. UTF-8 encoding throughout.
- **A6. Tool result semantics.** [CURRENT-SPEC] The server distinguishes protocol errors (JSON-RPC error responses) from tool execution errors (reported inside the tool result so the model can see and react to them). Verify the exact mechanism against the fetched revision's tools page — this is a detail SDKs handle differently across versions, so check what the installed SDK actually emits, not what its README implies.
- **A7. Resources, prompts, notifications.** [CURRENT-SPEC] If the server exposes resources or prompts: URI handling, listing, and pagination per the fetched spec. If capabilities claim list-changed notifications, they actually fire.
- **A8. Capability truthfulness.** Everything the server advertises works, and nothing that works is hidden behind an undeclared capability. Verified in Phase 8 by diffing `tools/list` (and resource/prompt listings) against the Phase-1 inventory.

## Domain B — Tool design quality

*Quality characteristics: functional suitability, usability (for the model as the consumer). Authority: the fetched spec's tool guidance; the SDK's documented practices; the mcp-builder companion's conventions where present.*

- **B1. Naming.** Tools use consistent, action-oriented, collision-resistant names (service-prefixed snake_case is the prevailing convention — e.g. `erp_create_invoice`, not `create`). Stable identifiers; no duplicates.
- **B2. Descriptions written for the consumer.** Each tool's description tells the model what the tool does, when to use it, its constraints, and its side effects — precisely matching actual behavior. A description that promises more or less than the handler does is a finding: the description is the interface.
- **B3. Input schemas.** Precise types; required vs optional explicit; constraints encoded (enums, ranges, patterns) rather than enforced only in prose; parameter descriptions present. A bare `object` input schema is a finding — the schema is the validation contract.
- **B4. Output discipline.** Responses are structured and consistent; unbounded data is paginated or truncated with an indicator; output sized for a context window, not a database dump. Where the SDK supports structured output/output schemas, their absence on data-returning tools is at least a Low finding.
- **B5. Error messages are actionable.** Failures tell the model what went wrong and what to do next — without leaking stack traces, internal paths, or secrets (the leak itself is Domain C).
- **B6. Side-effect safety.** Destructive or irreversible operations are identifiable as such — via the spec's tool annotations (readOnlyHint, destructiveHint, idempotentHint, openWorldHint) where the SDK supports them [CURRENT-SPEC], and via description language regardless.
- **B7. Granularity.** Tools map to coherent operations. Sixty near-identical endpoint mirrors with no composability, or one mega-tool with a `mode` parameter doing twelve things, are both design findings.

## Domain C — Security

*Quality characteristic: security. Authorities: the fetched spec's security best-practices page (MCP-specific threat classes), OWASP guidance for the general classes (injection, validation, dependency, logging), and the transport requirements of the fetched spec.*

- **C1. Input validation at the trust boundary.** Every tool argument is validated before use — types, ranges, formats — at the boundary, not deep in the call stack. The model is an untrusted input source: it can be prompted into sending anything.
- **C2. Injection.** No string-built shell commands from tool arguments (use argument arrays / no-shell exec); parameterized queries only; template injection considered where applicable. This class is not hypothetical for MCP — a critical command-injection CVE shipped in a widely-used MCP OAuth proxy.
- **C3. Path traversal.** File-path arguments are canonicalized and checked against an allowlisted root before use. `../` escaping the intended directory is a Critical finding.
- **C4. SSRF.** URL-taking tools enforce scheme and host constraints; internal address ranges are unreachable unless explicitly intended and documented.
- **C5. Secrets handling.** No hardcoded credentials; secrets loaded from environment or a secret store; never logged, never echoed into error messages or tool results; not committed (check history-visible files like `.env` against the ignore rules).
- **C6. Transport security — HTTP.** [CURRENT-SPEC] Verified against spec revision 2025-11-25: the server validates the `Origin` header on incoming connections (403 on invalid) to prevent DNS-rebinding; locally-run servers bind to localhost, not 0.0.0.0; authentication implemented for non-local exposure. TLS for anything crossing a network boundary.
- **C7. Authorization — remote servers.** [CURRENT-SPEC] The 2025-11-25 revision formalizes OAuth 2.1-based authorization for remote servers. Verify the server's auth model against the fetched authorization pages: token audience validation (reject tokens not issued for this server), no **token passthrough** (forwarding client-supplied tokens to downstream APIs is explicitly forbidden by the spec's security best practices), session IDs cryptographically secure and bound to user identity. For stdio servers, the trust model is the OS process boundary — state it explicitly in the findings so the absence of in-band auth is a documented model, not an oversight.
- **C8. Confused deputy exposure.** [CURRENT-SPEC] If the server proxies a third-party API under its own credential, per-client consent controls per the spec's security best-practices page. More generally: does the server grant capability based on who is asking, or does one credential serve all callers?
- **C9. Prompt-injection surface.** Tool descriptions and tool outputs enter the model's context. Outputs that relay untrusted external content (web pages, user documents, third-party API text) are an injection channel — the audit notes where untrusted content flows into results and whether the server marks or constrains it.
- **C10. Least privilege.** Filesystem scope, database grants, and API-key scopes are no broader than the tools require.
- **C11. Dependency and supply chain.** Run the ecosystem's vulnerability audit (`npm audit`, `pip-audit`, or equivalent) and record the output; versions pinned with a lockfile present; no abandoned or unmaintained packages in critical paths. The MCP ecosystem inherits the npm/PyPI supply-chain risk profile in full — a malicious MCP package exfiltrating data has already occurred in the wild.
- **C12. Sensitive data in logs and results.** PII and credentials do not flow into logs or into tool results beyond what the tool's purpose requires.

## Domain D — Reliability

*Quality characteristic: reliability. Authorities: the language's error-handling discipline; SDK-documented patterns; the target spec's failure requirements.*

- **D1. No swallowed failures.** No bare `except:`/empty `catch` that discards errors; failures surface as structured tool errors, not silent nulls or fabricated defaults.
- **D2. Timeouts on every external call.** Network, database, and subprocess calls all carry explicit timeouts. An unbounded await is a hang the client cannot distinguish from work.
- **D3. Bounded retries.** Where retries exist: bounded, backed off, and idempotent-only. Where they do not exist on flaky dependencies: a finding with the failure behavior stated.
- **D4. Resource lifecycle.** Connections, file handles, and subprocesses are released on all paths, including error paths. Verified in Phase 8 with the repeated-invocation pass.
- **D5. Concurrency safety.** Shared state is safe under concurrent tool calls; in async servers, blocking calls do not stall the event loop; per-request state is not accidentally global.
- **D6. Input-size safety.** Oversized payloads are bounded before they become memory or downstream-API incidents.
- **D7. Crash discipline.** Startup validates configuration and fails loud with a clear message; recoverable runtime errors do not kill the process; unrecoverable states exit cleanly rather than limping.

## Domain E — Operability

*Quality characteristics: reliability (recoverability), maintainability. Authorities: the fetched spec's transport rules (log destinations), the deployment host's service conventions.*

- **E1. Logging destination.** [CURRENT-SPEC] For stdio: stderr or a file, never stdout (see A2 — this is both a protocol and an operability item). For HTTP: a sane, configurable destination.
- **E2. Logging content.** Enough to diagnose a failed tool call after the fact — tool name, sanitized argument summary, error, timing — at controllable levels, with no secret leakage (C12).
- **E3. Configuration.** Every knob documented; validated at startup with actionable errors; sane defaults; configuration read at startup, not rediscovered per call.
- **E4. Versioning.** The server declares a version; dependencies are pinned and locked; a change to the server is visible as a version change.
- **E5. Deployment repeatability.** A documented run procedure that works on the actual host OS from a clean checkout — including service persistence (surviving reboot without an interactive login) if the server is meant to be always-on. Commands in the docs are the commands that were actually run in Phase 8, on that OS.
- **E6. Health and diagnostics.** A way to know the server is up and correct, appropriate to the transport — for stdio, a documented smoke invocation; for HTTP, a checkable endpoint or documented probe.
- **E7. Documentation.** A README covering what the server is, its tools, how to run and configure it, and its trust model.

## Domain F — Code and dependency health

*Quality characteristic: maintainability. Authorities: the language's authoritative style and idiom guides; the SDK's current documented API.*

- **F1. Current SDK usage.** The server uses the installed SDK's documented current API — no deprecated calls, no patterns the SDK's current docs have replaced. Verified against the SDK docs fetched in Phase 2, at the version actually installed.
- **F2. Language discipline.** Typing where the codebase claims it (strict TS actually strict; Python hints actually checked); the language's standard idioms for the constructs used.
- **F3. Dead weight.** Dead code, duplicated handlers, and stale TODO/FIXME markers inventoried. Duplication that guarantees divergence (two copies of the auth check) is Medium, not Low.
- **F4. Build reproducibility.** A clean clone builds and runs with the documented steps. If it takes undocumented tribal knowledge to build, that knowledge is a finding to extract into E7.

## Domain G — Testing and verifiability

*Quality characteristic: maintainability (testability). Authority: the target spec's verification requirements; this skill's Phase 8 bar.*

- **G1. Existing tests run.** Run them; record the actual results. Tests that fail on a clean checkout are a finding about the tests.
- **G2. Coverage of behavior.** Do the tests exercise the tool handlers' contracts, or only utilities around them? Absence of tests is itself a finding whose severity feeds the verdict — an untested server cannot demonstrate its own correctness.
- **G3. Testable structure.** Handlers separable from transport for unit testing; external dependencies injectable or fake-able. A structure that can only be tested end-to-end makes every future change expensive to verify — a maintainability finding.

---

## A note on what this file is not

This file is not the spec, not the SDK docs, and not a substitute for reading the server. It is the map of what to check. The territory — the fetched spec revision, the fetched SDK docs, and the code as Read this session — is where every finding's authority and evidence actually live.
