# Deployment Readiness Memory

Last updated: 2026-04-16
Active branch: `plan0-phase-b` (PR [#78](https://github.com/Maxcogar/Project-Manager/pull/78) open against `main`)
Status: Plan 0 Phase A merged. **Phase B is NOT complete** — the authoring portion is done and locally validated; B1 (manual GCS state-bucket bootstrap) and B10 (first `terraform apply` against staging + production) remain and are prerequisites for closing Phase B.

## Plan Status

| Plan | State | Merged / PR |
|------|-------|-------------|
| Plan 0 — CI/CD + Operational Readiness | Phase A merged (PR #63 + #77); Phase B NOT complete (authoring landed in PR #78, B1 bootstrap + B10 applies pending); Phase C not started | |
| Plan 1 — Foundation Hardening | Written, not implemented | — |
| Plan 1b — Database Durability | Written + corrected, not implemented | — |
| Plan 2 — API Authentication | Written + corrected, not implemented | — |
| Plan 3 — Filesystem Security | Written, not implemented | — |
| Plan 4 — Data Integrity & Runtime Reliability | Written, not implemented | — |
| Plan 5 — Input Validation | Written, not implemented | — |
| Plan 6 — Cleanup, Migration, Docs Sync | Written, not implemented | — |
| MCP Cloud Deployment | Written + corrected, not implemented | — |

Planning is complete. Implementation order is Plan 0 → 1 → 1b → 2 → 3 → 4 → 5 → 6 → MCP, per `docs/deployment-readiness/roadmap.md`.

## Plan 0 Phase Map

- **Phase A (local code + config)** — **DONE** (PR #63 + #77 merged to `main`).
  - CI workflow, Dependabot, Pino + request-context logging, structlog for MCP, OpenTelemetry (both services), runbook first drafts, activity-log archival job + unit tests.
- **Phase B (GCP IaC)** — **NOT COMPLETE.** Authoring portion landed + locally validated in PR #78 (open). The phase does NOT close until the remaining steps below run:
  - Authored (done): `terraform/` tree with 10 modules (wif, artifact-registry, cloud-run-agentboard, cloud-run-mcp, cloud-armor, load-balancer-iap, secret-manager, observability, budget, cloud-run-jobs); `terraform validate` passing; `terraform fmt -recursive -check` clean; provider pinned at `~> 5.35` (lockfile committed, realized v5.45.2).
  - **Not done — BLOCKS Phase B close (requires operator GCP access)**:
    - B1: manually bootstrap the `agentboard-tfstate-<project>` GCS bucket per `terraform/README.md`.
    - B10: first `terraform apply -var-file=environments/staging.tfvars`, then production after tfvars placeholders are replaced.
  - Until both above run cleanly, Phase B remains open and the next implementation phase must not start.
- **Phase C (pipeline wiring + verification)** — not started. Next bounded slice.

## Locked Deployment Decisions (unchanged)

- Production target: Cloud Run behind external HTTPS LB.
- Browser auth: GCP IAP.
- Service-to-service auth: Google-signed ID tokens at the production boundary.
- Database: SQLite + Litestream to GCS.
- Deployment is single-user, single-instance (`max-instances: 1` for AgentBoard; MCP scales 0–3).
- MCP is part of the deployed system (cloud-deployed, `streamable-http` over HTTPS, `--no-allow-unauthenticated`).
- Standard local MCP client access: `gcloud run services proxy` + `mcp-remote`.
- MCP calls AgentBoard's internal Cloud Run URL, not the browser-facing IAP URL.
- `X-Agent-Id` is not a production auth mechanism.

## Locked Operational Decisions (new from Plan 0)

- CI/CD is GitHub Actions, not Cloud Build.
- GitHub → GCP auth is Workload Identity Federation; zero long-lived JSON keys.
- All GCP infra (except the Terraform state bucket itself) is Terraform-managed.
- Three environments: local, staging, production — separate GCP projects, identical topology.
- Logs: Pino (server) + structlog (MCP) → Cloud Logging, required fields: `request_id`, `route`, `method`, `status`, `latency_ms`, `authenticated_principal`, `declared_attribution`.
- Tracing: OpenTelemetry → Cloud Trace. Local exporter is a no-op.
- SLOs: 99.5% availability, p95 latency < 2s non-MCP. Fast-burn alerts on the availability SLO.
- Budget: 50/80/100% threshold alerts at a default $50/mo ceiling; production tfvars default is $200.
- Retention: activity_log rows older than 180 days archived nightly to GCS (Standard → Nearline@30d → Coldline@365d → Delete@7y).
- Runbooks live in-repo: deploy, rollback, restore-from-backup, incident-response. Drafted in Phase A; dry-runs in Phase C.

## Locked Filesystem Decisions (from Plan 3, unchanged)

- `target_project_path` is untrusted input at write-time and use-time.
- Filesystem-backed config sync constrained to canonical project roots under `ALLOWED_PROJECT_BASE_DIRS`.
- Symlink escapes must be rejected in both read and write flows.

## Locked Runtime Decisions (from Plan 4, unchanged)

- `pendingReviews` in-memory `Map` is not deployment-valid.
- Waiting-for-review must be durable state, not a held HTTP response.
- `PUT /api/documents/:id/submit` becomes an immediate pending-review response.
- Document workflow needs an explicit document state machine.
- Multi-step mutations must be transactional; WS events emit only after commit.
- Graceful shutdown includes HTTP drain + readiness degradation + explicit WS close.

## Locked Validation Decisions (from Plan 5, unchanged)

- Request validation at the HTTP boundary, after auth, before handler logic.
- Zod schemas, not scattered manual checks.
- Mutating bodies strict by default; unknown fields rejected.
- Schema failures return `400 INVALID_REQUEST`; `422` reserved for state-machine violations.
- MCP route contracts cross-checked against `agentboard_mcp/server.py` but without cross-language shared schema tooling.
- Legacy JSON-text fields (e.g. `auto_transitions`) parsed and validated against known shapes before persistence.

## Next Recommended Step

**Close Phase B first** — Plan 0 §Plan step ordering puts the applies inside Phase B itself ("Phase B provisions GCP infrastructure"). Until B1 + B10 run, Phase B is not done and Phase C must not start.

To close Phase B requires a session with GCP access:

1. Operator bootstraps `agentboard-tfstate-agentboard-staging` per `terraform/README.md`.
2. `terraform init` + `terraform apply -var-file=environments/staging.tfvars` against the staging project.
3. Replace placeholders in `terraform/environments/production.tfvars` (`domain`, `operator_email`, `billing_account_id`).
4. Operator bootstraps `agentboard-tfstate-agentboard-production`.
5. `terraform apply -var-file=environments/production.tfvars`.
6. Flip checklist rows 2.1–2.5 green with the apply evidence.

Only after Phase B closes does the next bounded slice become **Phase C authoring** — CD workflows (`cd-staging.yml`, `cd-production.yml`), post-deploy smoke tests, branch protection config, secret-scanning enablement, restore + rollback dry-run procedures.

## Source of Truth

- Primary restart doc: `docs/deployment-readiness/handoffs/2026-04-16-phase-b-handoff.md`
- Top-level scope/status: `docs/deployment-readiness/master-plan.md`
- Launch gate: `docs/deployment-readiness/production-readiness-checklist.md`
- Folder map + navigation: `docs/deployment-readiness/README.md`
- Phase B artifact: `terraform/` + `terraform/README.md` (bootstrap runbook)

## Tooling Notes

- `codegraph` MCP is available in this environment. Local Python fallback also works: `python .agent/tools/codegraph/codegraph.py . --trace <file>`.
- Terraform binary is not installed by default in sessions; download from `https://releases.hashicorp.com/terraform/1.9.8/terraform_1.9.8_linux_amd64.zip` to `/tmp/` if needed for `fmt` / `validate`.
- GitHub MCP tools (`mcp__github__*`) are the only way to interact with GitHub in-session; `gh` CLI is not available.
