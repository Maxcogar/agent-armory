# Phase: Maintain

Evolving a system after deployment — refactoring, dependency management, technical-debt tracking, documentation currency, deprecation, cleanup, and disposal. The work is making changes to a *running* system safely, which means understanding the blast radius of every change before making it. This is also where cleanups and "what files stay or go" live — and where the verification axis earns its keep, because acting on "this is unused" without checking is the failure that turns a cleanup into an outage.

**Receives:** a running system with its full documentation chain (spec, architecture, verification report, operational procedures), plus change requests, bug reports, dependency-update notifications, and debt identified during prior phases.

**Produces:** safe, standards-compliant changes. "Safe" means the blast radius is understood, affected dependents are identified, regression is verified, and documentation is updated as part of the change.

## Governing standards

- **ISO/IEC/IEEE 14764:2022** (current; aligned to ISO 12207's maintenance process, including disposal) — the software maintenance standard. It classifies maintenance on two axes, timing × goal: **corrective** (reactive / correction), **adaptive** (reactive / enhancement — e.g., a platform change), **perfective** (proactive / enhancement — e.g., improving structure or performance), and **preventive** (proactive / correction — fixing latent faults before they surface). Naming which kind a change is keeps "while I'm in here" scope creep visible.
- **Change management** — understand impact before changing, verify after.
- **Dependency management** — semantic versioning (**SemVer 2.0.0**: MAJOR breaks compatibility, MINOR adds compatibly, PATCH fixes compatibly), active security-advisory monitoring, controlled upgrades.
- **Refactoring (Fowler)** — behavior-preserving transformations, with test coverage as the safety net. A refactor that changes behavior is not a refactor.
- **Documentation currency** — docs that reference changed code are updated as part of the change, not later.
- **The architecture document as the governing contract** — a change that violates an architectural decision is an architecture change, not maintenance, and routes back to Design.

## The two axes here

**Frame.** "Fix this bug" or "add this small feature" invites replicating existing patterns without asking whether those patterns are the source of the problem. Every maintenance change, however small, is evaluated against the standards from the original design — not against "how the rest of the code does it." When a fix reveals a systemic problem, that problem is documented even when fixing it is out of scope.

**Premise — and this is the load-bearing one for cleanup.** "This file is unused," "nothing imports this," "this dependency isn't needed," "this is dead code," "the tests still pass" — each is a factual claim, and each is routinely wrong from impression. None of them is verified by a search; a search is where verification *starts*.
- *"Does anything reference X?"* is an **absence** question, and absence is the hardest thing to establish. A grep across the repo is a starting lead, not the answer — it misses dynamic dispatch, string-keyed lookups, reflection, config and DI wiring, generated code, and callers outside the repo. The verified answer comes from reading the candidate sites and reasoning explicitly through each of those non-static paths; even then, "nothing references X" is a well-evidenced conclusion, not a proof.
- *"What breaks if I change X?"* is a **structural** question — a dependency or call graph shows *known* importers. It does not prove there are none either, so it is more evidence to combine with the reading above, not a substitute for it.
- Never delete on the strength of a search or a graph reporting "no importers." Both answer a narrower question than a safe deletion requires; the deletion needs the reading and the reasoning on top.

## Output contract — what the gate checks

Each maintenance change contains:

- Impact analysis — what files change, what depends on them, what could break.
- Traceability — which requirement, bug report, or debt item this addresses, and which of the four maintenance types it is.
- Documentation updates for every doc that references the changed code.
- Regression verification — tests confirming existing behavior is preserved where it should be.
- Divergence notes when the correct fix departs from the existing pattern, with the standard that justified departing.

## Cleanup and "what stays or goes" — the procedure

1. **Inventory against current source, not memory** — list candidates for removal with the actual evidence for each: grep and a dependency graph both come back empty (evidence, not proof — see the premise note above), the non-static reference paths have been read and reasoned through, it is absent from build and entry config, and its behavior is not covered by a test that the removal would break.
2. **Get behavior under test before removing or restructuring** — Feathers' characterization tests pin existing behavior so a removal that quietly changed it is caught. Code without tests is the riskiest to touch precisely because nothing flags a regression.
3. **Deprecate before delete where consumers exist** — mark, announce, give a migration path, then remove on a stated timeline rather than yanking it.
4. **Remove incrementally and verify after each step** — small, reversible changes; the test suite green after each, not only at the end.
5. **For retiring a whole component or system, treat it as disposal** under ISO 14764 / 12207 — data migration, consumer cutover, and documentation of what was removed and why.

## The moves

- Read the documentation chain before the change; the architecture tells you whether this is maintenance or a routed-back architecture change.
- Classify the change (corrective / adaptive / perfective / preventive) so scope stays honest.
- Run impact analysis; verify every "unused / safe to remove" claim against source.
- Make behavior-preserving changes against a test safety net; update the docs in the same change.

## Quality gate for each change

Does the change include impact analysis, traceability to a requirement or issue (and its maintenance type), documentation updates for affected docs, and regression verification? A change that can't show these isn't ready to land.
