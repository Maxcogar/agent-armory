# ADR-0003: .NET API is the primary path; macros are a contained fallback

- **Status:** Accepted
- **Date:** 2026-06-22

## Context
PowerMill can be driven two ways: the typed `Autodesk.ProductInterface.PowerMILL`
.NET API (structured, validated, but a partial wrapper) and the macro/parameter
language (a complete superset, but untyped strings with no validation). The system
is driven by an AI agent. An agent hand-authoring macro strings will hallucinate
syntax, has nothing validating it, and routes through the macro-injection surface.

## Decision
The **typed .NET API is the primary capability path** for all routine operations
exposed to the agent. The macro/parameter layer is a **contained fallback**: where
the .NET API lacks something the breadth requirement demands, the macro is wrapped
inside a typed, validated MCP tool — never exposed to the agent as raw macro.

## Consequences
- Agent-facing operations get schema validation and predictable contracts.
- Some capabilities require building a typed wrapper over a macro instead of a
  thin API call — more work, but it keeps the safe-rails invariant.
- The raw `run_macro` escape hatch remains for true edge cases, gated by explicit
  confirmation, but is not the mechanism the judgment layer relies on.
