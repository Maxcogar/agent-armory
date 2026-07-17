# Phase: Operate

Transitioning to and running in production. The work shifts from building to sustaining, and different standards apply — a system's deployment and operational procedures should derive from its specific requirements and failure modes, not from a template or "how we deploy everything else."

**Receives:** verified build output cleared for production, plus the operational requirements from the spec (SLOs, availability targets, monitoring needs) and the operational architecture from Design (deployment topology, scaling approach, failure domains).

**Produces:** a running, observable production system — its health, performance, and correctness measurable against the spec — with monitoring, alerting, runbooks, and incident-response procedures.

## Governing standards

- **SRE principles** (Google's SRE book as the canonical reference) — SLOs derived from user needs, error budgets, toil reduction. Reliability is a measured target, not an aspiration.
- **The four golden signals** — latency, traffic, errors, and saturation. Monitoring coverage starts here and extends to the system's specific failure modes.
- **Operational readiness standards** — deployment checklists, rollback procedures, documented failure modes.
- **OWASP operational security guidance** — security carries into operations; it doesn't end at Verify.

## The two axes here

**Frame.** "Deploy it the same way we deploy everything else" is the pattern-matching trap in operations. A system with strict consistency requirements needs different deployment and rollback procedures than an eventually-consistent one. Operational decisions trace to the system's actual requirements and architecture, named — not to organizational habit.

**Premise.** Claims that drive operational decisions — "this scales horizontally," "this fails over cleanly," "this metric reflects user-visible health" — are verified against the system's actual behavior (a load test, a failover drill, a traced request) before they become the basis for an SLO or a runbook step.

## Output contract — what the gate checks

Operational artifacts contain:

- SLOs traced to spec requirements, each with its measurement method.
- Runbooks that reference the architecture for *why* a procedure exists, not just the steps.
- Monitoring coverage mapped to the system's failure modes (from the threat model and architecture), built on the four golden signals.
- Deployment procedures with rollback triggers and verification steps.

## The moves

- Derive SLOs from the spec's user-facing requirements; define how each is measured.
- Instrument the four golden signals, then extend coverage to this system's specific failure modes.
- Write runbooks that explain the why by pointing back to the architecture.
- Define deployment with explicit rollback triggers and post-deploy verification; validate failover and scaling claims by drill, not assumption.

## Quality gate to Maintain (ongoing)

Is the system observable against its SLOs? Do runbooks exist for its known failure modes, with rollback procedures that have been verified rather than assumed? Operate hands to Maintain a running system *with its full documentation chain* — spec, architecture, verification report, and operational procedures — so every later change has access to all of it, not just the code.
