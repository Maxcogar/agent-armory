# Changelog

All notable changes to the PowerMill MCP program. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning: [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project foundation: program `README`, `ROADMAP` (living source of truth),
  `CONVENTIONS`, decision log (ADRs), and session-handoff continuity artifacts.
- Define-phase program requirements spec (`docs/specs/2026-06-22-powermill-program-requirements.md`).
- Full coverage audit of the seed capability core against the
  `Autodesk.ProductInterface.PowerMILL` API (`PowerMillMcpServer/docs/COVERAGE-AUDIT.md`).
- Seed capability core (subsystem A): the v0.3.0 .NET MCP server source brought
  under version control in this repo.
- Define-phase gate cleared: owner answers OQ-1/2/3 recorded (shop profile §3.1,
  human-approved learning R-LEARN-3, plan/output checkpoints §6.12), with ADR-0005
  (machining envelope: positional multi-axis, no continuous 5-axis) and ADR-0006
  (operating model: plan-approval + verified-output checkpoints).

### Changed
- Seed server docs corrected to v0.3.0 / 46 tools (were stale at v0.2.0 / 38).
