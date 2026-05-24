# Spec — AgentBoard App Support for the Architecture Pipeline

**Date:** 2026-05-12
**Status:** Draft. Authored alongside `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md`. The plan implements the architecture-pipeline rework in the `agentboard` plugin against the AgentBoard application's current public contract. This spec identifies application-side changes that would let the app support that pipeline as first-class behavior instead of through conventions layered on top of generic primitives.

---

## What problem does this spec solve, and for whom?

AgentBoard is a cloud-hosted project-management application that exposes its functionality to AI agents through an MCP server. The reworked architecture pipeline (`/architecture` orchestrator plus six subagents) uses AgentBoard's workspace-card surface — cards, notes, artifacts, activity log — as the persistence and coordination layer. The pipeline works against the current contract by treating cards and artifacts as generic containers and encoding pipeline-specific meaning in artifact-type strings, card-title conventions, and orchestrator-side parsing of card descriptions.

The pipeline working is not the same as the application supporting the pipeline. Encoding pipeline meaning in conventions leaves no surface the application can validate, expose, or enforce: a malformed scaffold-card workflow produces no application-side error; a fabricated artifact-type string is indistinguishable from a real one; the verified level is unreadable on the board without fetching and parsing raw artifact JSON. Every consumer of the pipeline state — the orchestrator, the user reading the board UI, future automation, future audits — pays the cost of re-deriving meaning that the application could carry.

This spec is for the people implementing the AgentBoard application. It identifies what the application would need to do to make the architecture pipeline's structure visible and enforceable inside the application, rather than as a convention agents follow externally.

The spec is architecturally silent. It says what the application must do; the architecture phase chooses where the behavior lives (server endpoints, database tables, UI components, MCP tool shape) and which technologies implement it.

---

## What's in scope and what's out?

**In scope.** Application support for the four artifact types the pipeline produces, the architecture-stage lifecycle as a first-class concept in the application, level transparency on the board UI, the scaffold-card-to-finished transition as a recognized lifecycle, and structured handoff of per-card slice content from architecture to card creation. The threat model for trusting artifact-type assertions and slice contents that the application would surface to other agents.

**Out of scope.** Implementation of the changes (architecture and engineering work). Changes to the pipeline subagents, orchestrator command, or hook scripts — those are the rework plan's scope. Changes to AgentBoard's authentication model, project surface, document surface, task surface, board surface beyond the workspace-card / workspace-artifact / activity-log surfaces named below. Performance, scale, or cost requirements — those depend on usage data the application has and this spec does not. Backward compatibility strategy for existing artifacts that used sentinel-prefixed strings — that is a migration question the architecture phase resolves.

---

## What must the application do?

Requirements are numbered. Each requirement carries its source — the named standard, confirmed need, or genuine constraint it derives from. Requirements describe properties the application must hold; they do not name endpoint paths, table names, or implementation mechanisms.

### Artifact-type recognition

**R1. The application recognizes four architecture-pipeline artifact types as named, first-class types: `ARCH_FACTS_BUNDLE_V2`, `ARCH_BUNDLE_AUDIT_V2`, `architecture_document`, `ARCH_DESIGN_REVIEW_V1`.** A submission asserting one of these types either conforms to that type's contract or is rejected with a structured error identifying the failed condition. A submission asserting a string that resembles one of these types but is not exactly one of them (e.g., `arch_facts_bundle`, `ARCH_FACTS_BUNDLE_V1`, `ARCH_FACTS_BUNDLE_V3`) is rejected, not silently accepted as a generic artifact. The correction loop adds no fifth submitted artifact type — substantive correction work travels to the affected stage as a declared stage input (`correction_request_json`) per the short-spec correction path, not as a submitted artifact.
   *Source: Confirmed need — the rework plan's validation hook (`hooks/scripts/validate-architecture-artifact.sh`) enforces these four type strings client-side. The plan documents both halves of the existing artifact-quality-gate hook becoming type-aware. Without server-side recognition, the type name is an unverified assertion the application has no way to act on, and every consumer (orchestrator, UI, audit reader) must re-validate the assertion independently.*

**R2. Each artifact-type submission's content conforms to that type's documented schema before the submission is accepted.** The schema names the required fields, their types, and the cross-field invariants that distinguish a well-formed instance from a malformed one. A submission whose content does not conform fails with a structured error naming the rule that failed and the location in the content that triggered the failure.
   *Source: Confirmed need — the rework's validation hook performs this check client-side today. The downstream pipeline (compose reading bundles, orchestrator reading audits, design reviewer reading bundles) treats artifact contents as authoritative. An artifact persisted with malformed contents corrupts every consumer that reads it after persistence, and the failure surfaces far from its cause.*

**R3. The application makes the artifact type and its conformance state queryable without fetching and parsing the artifact's content body.** Consumers — the orchestrator listing artifacts on a scaffold card, the board UI rendering the card, an audit reader scanning a board's history — can determine an artifact's type and whether it conformed at submission time from a metadata surface, not by fetching and parsing raw content.
   *Source: Confirmed need — the orchestrator command (`commands/architecture.md` steps 7, 9, 12, 15) currently lists artifacts and matches on `artifact_type`, falling back to scanning the content for sentinel strings when `artifact_type` is unset. Conformance state is not exposed at all; the orchestrator relies on the hook having run client-side. A reader that arrives later (debugging, audit) has no way to distinguish artifacts that passed validation from artifacts that were submitted before validation existed.*

### Architecture-stage lifecycle

**R4. The application recognizes an architecture-stage lifecycle on a board, distinct from the workspace pipeline's planning, review, implementation, and audit stages.** The architecture stage runs once per spec (the rework's `/architecture` orchestration); it produces the cards the workspace pipeline subsequently runs against. The application's lifecycle model represents this ordering — cards on a board that have not yet had their architecture produced are distinguishable from cards that are mid-architecture from cards that completed architecture and are ready for the workspace pipeline.
   *Source: Confirmed need — the agentboard skill (`skills/agentboard/SKILL.md`) documents the workspace pipeline's auto-transition settings (`review_blocking`, `audit_blocking`) as recognized lifecycle concepts. The architecture stage has no equivalent representation; it exists only as a scaffold-card convention layered over generic primitives. Without recognition, the application cannot prevent `/orchestrate` from running against a board whose cards predate any approved architecture, and the board UI cannot communicate "this board is mid-architecture" or "this board has no architecture yet."*

**R5. The application surfaces the scaffold-card-to-finished transition as a first-class lifecycle event, not as a generic status update.** A scaffold card moving to `finished` carries the four pipeline artifacts as its audit trail; the application treats the transition as a recognized completion of the architecture stage on that board, with the verified level and the count of cards produced as readable metadata on the transition.
   *Source: Confirmed need — the orchestrator command's step 20 moves the scaffold card to `finished` via a generic `agentboard_update_workspace_card` call. The card's role as "the architecture stage's audit trail" exists only in the orchestrator's documentation, not in the application's record of the transition. An auditor scanning the board's history cannot distinguish the scaffold-card transition from any other card moving to `finished`.*

### Level transparency

**R6. The board UI exposes the verified level of each board's architecture without requiring the viewer to fetch and parse raw artifact JSON.** The verified level (`L1`, `L2`, or `L3`), the bundle's classification field summary, the audit's PASS/DISCREPANCY tallies, and the design review's blocker/serious/minor counts are visible on the board UI as discrete fields. A viewer can answer "what level was this architecture computed at and did the audit find any discrepancies?" from the UI alone.
   *Source: Confirmed need — the orchestrator's transparency display (command step 10) and approval display (command step 16) render this data to the user inside the agent's chat session; once the session ends, the rendered display is gone. A board viewer arriving later (a different agent, the user reviewing past work, an external auditor) can recover the data only by listing artifacts and parsing JSON. The contract requires "level transparency on the board UI"; the requirement here is the UI surface that satisfies it.*

**R7. The level representation surfaced on the UI uses the human-readable `L1` / `L2` / `L3` form; machine-readable interfaces use the numeric `1` / `2` / `3` form.** The two forms map deterministically to each other; the application converts between them at the boundary between UI and persistence so consumers on each side see the form appropriate to their context.
   *Source: Confirmed need — the rework's contract pins the level-representation split: bundles, audits, and orchestrator-side dispatch use numeric integers; the architecture document's Status section and chat-display transparency use `L#`. The validation hook parses the `L#` marker out of the document and the numeric form out of the JSON. The application supporting both forms at their respective boundaries removes the conversion burden from every consumer.*

### Slice handoff

**R8. The application supports structured per-card slice handoff during card creation, not text-blob handoff.** When a card is created from a slice in the architecture document, the slice's eight schema fields (Description, Allowed-touch list, Forbidden-touch list, Produces, Consumes, Verification scope, Depends on, Source decisions) are addressable as structured data on the card. A downstream consumer (a planning subagent reading the `arch_slice`, a reviewer verifying the allowed-touch list, the board UI rendering a slice summary) reads each field by name; it does not parse free-form markdown.
   *Source: Confirmed need — the orchestrator's step 19 reads the `## Card Slices` section of the architecture document and copies each slice's eight fields verbatim into the card description as markdown. Every downstream consumer re-parses that markdown. The `workspace-orchestration` skill (`skills/workspace-orchestration/SKILL.md`) and the `/orchestrate` command pass the slice as `{{arch_slice}}` to planning agents that re-parse the eight fields. Each parse is a chance for the structure to drift; structured fields would let the application carry the structure across handoffs.*

**R9. The application validates that slice content conforms to the eight-field schema at card-creation time when the card declares it carries an `arch_slice`.** A card whose declared `arch_slice` is missing one of the eight fields, has duplicate fields, or has a field whose contents violate that field's per-field rules (e.g., a Source decisions field at L1 missing the L1-form attribution, an Allowed-touch list overlapping another slice's Allowed-touch list without an overlap-justification clause) is rejected with a structured error.
   *Source: Confirmed need — the rework's validation hook validates these properties on the architecture document at submission; the validation does not survive into the cards the orchestrator creates from the document. A planning subagent reading a malformed `arch_slice` later receives the malformed content as truth.*

### Activity log addressability

**R10. The application's activity log captures the pipeline's stage transitions as recognized event types, not as free-form log entries.** The events that follow are addressable by type when the activity log is queried: scaffold-card-created, research-bundle-submitted, audit-submitted, compose-dispatched-to-level-N, architecture-document-submitted, design-review-submitted, architecture-document-approved-by-user, architecture-document-rejected-by-user, scaffold-card-finished. Each event carries the structured data the rest of this spec requires for the relevant artifact type (e.g., the verified level on compose-dispatched-to-level-N).
   *Source: Confirmed need — the orchestrator command writes activity log entries on halts via `agentboard_add_log_entry` with the free-form `action` field. The pipeline's transitions are not addressable by event type; an auditor cannot answer "how many `/architecture` runs halted at the audit stage in the last 30 days" without scanning every log entry as text. The `agentboard_add_log_entry` schema (per `skills/agentboard/SKILL.md`) accepts a fixed set of `action` values plus `log_entry` as the generic fallback — the architecture pipeline's stage transitions are currently all `log_entry`. Recognized event types let the application's log queries answer questions about the pipeline's behavior.*

---

## What qualities must the application have?

### Security

**Threat model.** The architecture pipeline's artifacts carry agent-asserted facts about the codebase and the design that derives from those facts. Downstream consumers — the compose subagents, the design reviewer, the user reading the transparency display, the planning subagents reading slices — treat these facts as authoritative. Three classes of compromise have material cost:

- **Forged artifact type.** A submission asserts an architecture-pipeline artifact type while carrying content that does not conform. A downstream consumer reading the type label trusts the content shape; a malformed bundle routed into compose as a valid bundle poisons every decision compose makes from it. A malformed architecture document routed into the design reviewer as a valid document produces a review against a defective premise.
- **Forged slice content.** A card asserts it carries an `arch_slice` whose Allowed-touch list grants access to files the source architecture document never allowed. A planning subagent reading that slice treats the Allowed-touch list as the authoritative boundary; the implementation subagent that runs against the resulting plan modifies files outside the architecture's intended scope.
- **Lifecycle skip.** A board acquires cards without the architecture stage having run, or before the user approved the architecture document. The workspace pipeline runs against cards whose boundaries the user never sanctioned. The cost is implementation work the user did not authorize against design they did not see.

**Attackers.** A confused or malfunctioning subagent (the dominant case — a research agent emitting a malformed bundle because of a tool failure, a compose agent submitting before its document is well-formed). A prompt-injected subagent (a subagent whose context contained an instruction to ignore the schema). A different application client (a future MCP client or web UI that knows the artifact-type strings but does not run the validation hook). The application cannot assume every client runs the hook; the hook runs in the calling agent's environment.

**Security requirements.**

**R11. The application validates artifact-type conformance server-side, not exclusively client-side via the validation hook.** A submission that bypassed the hook (a client that did not install it, a client that disabled it, a client whose environment did not invoke it) cannot persist a non-conformant artifact under a recognized type label.
   *Source: NIST SP 800-218 SSDF practice PW.8 (verify third-party software complies with security requirements) by analogy: any client of the MCP server is third-party to the server. Threat model class 1 (forged artifact type) — client-side validation is necessary but insufficient.*

**R12. The application validates slice content conformance server-side at card creation when the card declares it carries an `arch_slice`.** A card created with malformed slice content cannot persist; the rejection identifies the failed field and the failed rule.
   *Source: Same SSDF practice PW.8 by analogy. Threat model class 2 (forged slice content).*

**R13. The application refuses lifecycle skips: a board cannot acquire cards in `backlog` from a scaffold card whose architecture-stage lifecycle did not complete (R5).** "Acquire cards in `backlog`" here means the card-creation event whose source is `/architecture` step 19; it does not refuse cards added by other paths the application already supports. The refusal carries a structured error identifying the missing precondition.
   *Source: Threat model class 3 (lifecycle skip). The architecture document approval is the user's explicit authorization point per the rework contract; circumventing it bypasses the user's design authorization.*

**R14. Server-side validation errors do not leak internal application state (database structure, file paths, secrets) in their error messages.** Errors name the rule that failed and the location in the submitted content; they do not name how the application stores the content or where the content is persisted.
   *Source: OWASP ASVS 4.0.3 V7.4 (error handling): error messages are minimal and do not reveal sensitive information. Confirmed risk pattern from any web-facing application.*

### Reliability

**R15. The application's artifact-type validation produces deterministic results: the same content submitted against the same artifact type produces the same accept/reject verdict and, on rejection, the same error.** Determinism applies across submissions, across application restarts, and across server instances within a single deployed version. Determinism does not require stability across application versions — a version bump that changes the schema may change the verdict.
   *Source: ISO/IEC 25010:2023 reliability characteristic (specifically "maturity" — the degree to which a system meets needs for reliability under normal operation). Non-deterministic validation makes downstream behavior non-reproducible and turns every reported failure into a "could not reproduce."*

**R16. Concurrent submissions to the same scaffold card produce a consistent ordering of the persisted artifacts.** A research bundle and an audit submitted in flight for the same card persist in an order that respects causality (the audit references the bundle's artifact ID; if the audit persists, the bundle it references is queryable). The application does not need to serialize all submissions, but it must not persist an audit whose referenced bundle does not exist on the same card.
   *Source: Confirmed need — the rework's classification auditor passes the audit's input as `audited_bundle_artifact_id`; the design reviewer passes `audit_artifact_id`, then resolves the verified bundle from that audit artifact. A reader resolving these IDs after persistence assumes the referenced artifact exists on the same card. Causal consistency across the four submissions on a scaffold card is the property that makes those reads safe.*

---

## What's fixed by circumstance?

**C1. The MCP protocol is the integration surface.** Subagents and the orchestrator communicate with the application exclusively through MCP tools (per `skills/agentboard/SKILL.md`). New behaviors the application adds in support of this spec become new tools or new fields on existing tools; the integration surface is not direct database access, REST endpoints exposed to the agent runtime, or any other channel.

**C2. The four artifact-type strings (`ARCH_FACTS_BUNDLE_V2`, `ARCH_BUNDLE_AUDIT_V2`, `architecture_document`, `ARCH_DESIGN_REVIEW_V1`) are fixed by the rework plan.** The application uses these exact strings; the rework plan owns when they change (a rules-version or schema-version bump in the plan triggers a coordinated string change).

**C3. The eight-field slice schema (Description, Allowed-touch list, Forbidden-touch list, Produces, Consumes, Verification scope, Depends on, Source decisions) is fixed by the rework plan.** Adding, removing, or renaming a field requires coordinated changes in the plan and in the architecture documents the pipeline produces.

**C4. The numeric/`L#` level representation split is fixed by the rework plan's contract.** The application converts between forms (R7); it does not introduce a third form.

**C5. The agentboard skill at `skills/agentboard/SKILL.md` documents the current MCP-tool surface.** New tools or new fields the application adds in support of this spec must remain consistent with the skill's documentation conventions (tool table format, parameter table format, response-format parameter conventions).

---

## Which standards govern this spec?

- **NIST SP 800-218 (Secure Software Development Framework).** Practice PW.8 (verify all third-party software complies with security requirements) — informs R11, R12.
- **OWASP ASVS 4.0.3.** V7.4 (error handling) — informs R14.
- **ISO/IEC 25010:2023.** Reliability quality characteristic (maturity, fault tolerance) — informs R15, R16.
- **The architecture-pipeline rework contract** at `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md` is the source of the artifact-type strings, the level representation rule, the slice schema, and the scope statement for this spec.
- **The agentboard skill** at `skills/agentboard/SKILL.md` is the source of the MCP-tool surface conventions this spec is constrained to.

---

## What does this connect to?

The application's existing surfaces this spec touches:
- The workspace-card surface (cards, notes, status transitions).
- The workspace-artifact surface (artifact submission and listing).
- The activity-log surface (event recording and retrieval).
- The board surface (boards, auto-transitions settings).

Surfaces the spec does not touch:
- The project / phase / document / task surfaces (the non-workspace half of the application).
- The authentication surface.

---

## What's still unresolved?

These decisions must be made before the application implements the spec; they cannot be resolved at the spec level because each is an architecture choice within the constraint the requirements set.

- **U1. Where artifact-type schemas are defined and versioned.** R1, R2, and R15 require the application to know the four schemas. Whether the schemas are inlined in application code, registered through a schema-registration tool, fetched from the plugin's `docs/schemas/` directory at deployment time, or some other mechanism — that is the application architecture's call. The requirements above bind only the behavior; the location and lifecycle of the schemas are the architect's decision.

- **U2. Migration of artifacts created before this spec lands.** Boards and cards persisted under the current `0.2.1` contract may carry workspace artifacts that asserted architecture-pipeline meaning through sentinel-prefixed strings rather than the four exact type strings R1 requires. The migration strategy — re-classify in place, leave as-is and treat as untyped, require manual re-submission, support a compatibility window — is an architecture decision the rework's plan flagged as out of its own scope.

- **U3. UI surface for level transparency (R6).** Whether the level and review summary appear inline on each board card, on a board-level summary panel, in a dedicated architecture view, or through a combination — the architecture phase decides based on the existing UI's conventions.

- **U4. Server-side validation cost and latency.** R11 and R12 require server-side validation on the submission and card-creation paths. The cost (CPU, blocking time, additional database load) depends on the schemas' complexity and the chosen validation mechanism. The architecture phase profiles the chosen mechanism against R15's determinism requirement and any latency budget the application's existing tools commit to.

- **U5. Backward compatibility of the activity-log event types (R10).** Existing log readers query the activity log against the current `action` enumeration. Adding the new event types this spec names is either an additive change (existing readers see the new types as unknown but the response still parses) or a breaking change (existing readers reject unknown types). The architecture phase decides; the spec is silent on which compatibility strategy applies.

---

## What was decided during this spec, and why?

- **The spec is scoped to the application, not to the rework plan's changes.** The contract's "Agentboard app spec" section lists scope items that read as "app changes that would better support the reworked pipeline." Some of those items could have been read as plan additions; this spec restricts itself to behavior the application surface presents and lets the rework plan keep ownership of pipeline-internal changes.

- **The threat model is included even though the rework plan does not require one.** The contract names "tighter scaffold-card-to-finished transition as a first-class lifecycle, not a convention" and "structured arch_slice handoff into card creation" — both of these have security-relevant consequences (lifecycle skips, slice content forgery). Threat-model-first per the spec-writing skill (`skills/spec-writing/SKILL.md` step 5, "What qualities must it have? — For security specifically...") governs whenever the work touches trust boundaries or multi-agent coordination; this spec qualifies.

- **The spec uses numeric R-IDs without category prefixes (R1–R16) rather than category prefixes like R-ART, R-LIFE.** Downstream architecture and review consume these IDs; a flat numeric scheme keeps citation simple and matches the convention the rework plan itself uses for its acceptance criteria.

- **The unresolved items (U1–U5) are explicitly named as architecture-phase resolvers rather than left implicit.** Per the spec-writing skill's "What's still unresolved?" section, architecture-shaped questions surface in this section with `/architecture` as the named resolver. The spec is architecturally silent on the resolutions.

---

## How is "done" verified?

The application implementing this spec is "done" when an independent reader, given only this spec and the application's behavior, can answer YES to each:

- **A1.** Submitting a content body that does not conform to the asserted artifact type's schema is rejected with a structured error identifying the failed rule. Tested per artifact type with at least one valid and one invalid synthetic submission. *Verifies R1, R2, R11.*
- **A2.** Listing artifacts on a scaffold card returns the artifact type and the conformance state without the content body. *Verifies R3.*
- **A3.** A board carrying cards whose architecture stage did not complete (no scaffold card in `finished` with the four required artifacts) cannot acquire workspace pipeline cards through the `/architecture` step 19 creation path. *Verifies R4, R5, R13.*
- **A4.** The board UI displays, for any board whose architecture stage completed, the verified level (in `L#` form), the bundle's classification field summary, the audit's PASS/DISCREPANCY tallies, and the design review's blocker/serious/minor counts, without the viewer needing to fetch and parse artifact content. *Verifies R6, R7.*
- **A5.** A card created from a slice in an architecture document exposes the eight slice fields as queryable structured data, not only as a markdown blob in the description. *Verifies R8.*
- **A6.** Creating a card whose declared `arch_slice` violates a per-field rule is rejected with a structured error. Tested per per-field rule with at least one negative test. *Verifies R9, R12.*
- **A7.** Querying the activity log by event type returns the architecture-pipeline stage transitions; querying for a transition that did not occur returns an empty result, not an error. *Verifies R10.*
- **A8.** Error messages from R11, R12, R13 rejections do not include database structure, file paths, secrets, or other internal application state. Tested via a structured inspection of each error response on each failure path. *Verifies R14.*
- **A9.** Submitting the same content body to the same artifact type twice produces the same accept/reject verdict and, on reject, byte-identical error content. *Verifies R15.*
- **A10.** Submitting an audit that references a `bundle_artifact_id` that does not exist on the same scaffold card is rejected. Submitting a research bundle and an audit concurrently against the same scaffold card persists in an order where, if the audit persists, the referenced bundle is queryable on the same card. *Verifies R16.*

Each acceptance check is independent of the others; passing them all establishes the application implements the spec.
