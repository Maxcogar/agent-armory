# Implementation Plan — APS Fusion MCP Server

**Status:** Delivered for review
**Author:** plan phase, expert-plan
**Date:** 2026-07-30
**Inputs:** `docs/specs/spec-aps-fusion-mcp-server.md` (60 requirements, 8-attacker threat model,
27 acceptance criteria); `docs/architectures/architecture-aps-fusion-mcp-server.md` (28 decisions
D1–D28, 37-tool inventory, traceability matrix). Both accepted by owner direction on 2026-07-30
per `HANDOFF.md`; neither carries an open review round.

---

## 1. Goal

Build, from an empty `src/` tree, the single-process TypeScript MCP server the architecture
specifies: 37 tools over four APS gateways (MFG GraphQL, Data Management, Model Derivative,
Design Automation), with every security and reliability property enforced structurally — at a
typed chokepoint, a single registration wrapper, or a startup assertion — rather than by
per-handler convention. Success is the 27 acceptance criteria passing against a running server
driven by a real MCP client, with the two load-bearing unverified premises (Limitation 8(b),
8(c)) closed by live probe before the code that depends on them is written.

## 2. Scope

**In scope.** Deletion of the predecessor tree; dependency pinning and test-harness creation;
all modules in the architecture's layout (`config`, `logging`, `state-store`, `token-manager`,
`aps-http`, `spend-guard`, `output-guard`, four gateways, seven tool modules, four HTTP routes,
middleware, composition root); the 37 tools; the acceptance-critical test suite; the README
rewrite and the Windows run/trust-model documentation; the live acceptance pass.

**Out of scope.** Nothing requested has been excluded. No exclusions were proposed to the owner
and none were approved — see Question register Q-8. Items the *spec* places out of scope
(§2.2: Fusion Operations, multi-user identity, AEC/Vault/Tandem, viewer UI) and the *architecture*
defers (individual Fusion Automation job programs, per spec D-9/R-AUTO-4) remain out; those are
inherited boundaries, not this plan's narrowing.

**Where this plan ends.** At AC-1..AC-27 demonstrated green against the owner's live account.
Registering an actual Fusion Automation Activity, and authoring its TypeScript job program, come
after and are separate deliverables (R-AUTO-4).

### Coverage reconciliation

Every spec requirement mapped to the step(s) whose **Source annotation declares it**. This table
is **generated from those annotations**, not maintained by hand — the same derivation §5 uses for
the created-file list. A requirement mapping to nothing, or a step declaring a requirement absent
here, is therefore impossible by construction rather than by inspection.

| Requirement | Step(s) | | Requirement | Step(s) |
|---|---|---|---|---|
| R-DISC-1 | S13, S16 | | R-PROTO-3 | S10 |
| R-DISC-2 | S13, S16 | | R-PROTO-4 | S12, S16, S17, S18, S19, S20, S21 |
| R-DISC-3 | S13, S16 | | R-PROTO-5 | S12, S16, S17, S18, S19, S20, S21 |
| R-DISC-4 | S7, S13, S16, S17, S19, S20, S21 | | R-PROTO-6 | S12, S16, S17, S18, S19, S20, S21 |
| R-READ-1 | S13, S17 | | R-REL-1 | S8 |
| R-READ-2 | S13, S17 | | R-REL-2 | S6, S10 |
| R-READ-3 | S13, S17 | | R-REL-3 | S6 |
| R-READ-4 | S13, S17 | | R-REL-4 | S8 |
| R-READ-5 | S13, S17 | | R-REL-5 | S7 |
| R-READ-6 | S13, S17 | | R-REL-6 | S3, S10, S22 |
| R-WRITE-1 | S13, S18 | | R-REL-7 | S5, S6 |
| R-WRITE-2 | S13, S18 | | R-OPS-1 | S4 |
| R-WRITE-3 | S13, S14, S18 | | R-OPS-2 | S3 |
| R-WRITE-4 | S12, S18 | | R-OPS-3 | S2, S3, S22, S24 |
| R-EXPORT-1 | S13, S19 | | R-OPS-4 | S24, S25 |
| R-EXPORT-2 | S13, S19 | | R-OPS-5 | S22, S24 |
| R-EXPORT-3 | S15, S19 | | S-1 | S9, S22 |
| R-EXPORT-4 | S14, S15, S18, S19 | | S-2 | S9 |
| R-EXPORT-5 | S19 | | S-3 | S6 |
| R-AUTO-1 | S20 | | S-4 | S9, S22 |
| R-AUTO-2 | S20 | | S-5 | S4, S5 |
| R-AUTO-3 | S20 | | S-6 | S23 |
| R-AUTO-4 | S20 | | S-7 | S13 |
| R-AUTO-5 | S20 | | S-8 | S12 |
| R-NOTIFY-1 | S21, S23 | | S-9 | S8, S12 |
| R-NOTIFY-2 | S14, S21 | | S-10 | S8, S15 |
| R-NOTIFY-3 | S21, S23 | | S-11 | S8 |
| R-AUTH-1 | S6, S14, S16 | | S-12 | S9, S22 |
| R-PROTO-1 | S22 | | S-13 | S7 |
| R-PROTO-2 | S4, S22 | | S-14 | S22 |

## 3. Standards that govern this plan

Inherited whole from the spec's §3 table and the architecture's "Standards governing this
architecture" table; every step's **Source** points into one of these or into a D-number.
Restated here only where this plan adds a standard the upstream documents did not carry:

| Standard | Governs in this plan |
|---|---|
| [MCP-TOOLS] / [MCP-TRANSPORT] / [MCP-LIFECYCLE] / [MCP-AUTHZ] / [MCP-SEC] (MCP 2025-11-25) | Steps S9, S11, S12, S22, S23 — as bound by D2, D3, D13, D14, D19 |
| [SDK] `@modelcontextprotocol/sdk` v1.29.0 | S12, S16–S22 — `registerTool` config shape, annotation defaults, `isError`, `outputSchema` |
| [APS-SCHEMA] `docs/aps-mfg-schema.json` (209 types) | S13, S16–S19 — every MFG field/mutation shape |
| [APS-DATAMGMT] / [APS-MODELDERIVATIVE] / [APS-DA] / [APS-WEBHOOK] / [APS-OAUTH] | S14, S15, S20, S21, S23 |
| [OWASP-SSRF] / [OWASP-INJECTION] / [OWASP-SECRETS] / ASVS 4.0.3 V12 | S8, S13, S5, S7 |
| Crash-Only Software (Candea & Fox, HotOS IX 2003) | S6 — journal-then-act, atomic rename, recover-on-restart |
| Google SRE Book ch. 22 (Beyer et al., 2016) | S8 — bounded exponential backoff with jitter |
| RFC 9110 §9.2.2 | S8 — retry only where the operation contract makes it safe |
| The Twelve-Factor App §III | S3 — config in the environment, validated at startup |
| **ISO/IEC/IEEE 29119-4:2021** *(added by this plan)* | S12 — test-case design techniques; every test specification in §12 names its technique |
| **Software Engineering at Google, Unit Testing + Test Doubles** *(added by this plan)* | §12 — test behaviors not methods; state not interactions; real implementations by default |
| **xUnit Test Patterns (Meszaros, 2007)** *(added by this plan)* | §12 — the double taxonomy every specified double is named against |
| **Vitest 4.x** *(added by this plan — the runner D26 left plan-level confirmable)* | S2 — test runner and config |

## 4. Spec issues

**No spec issues.** Planning surfaced no contradiction between the spec and reality, and none
between the spec and any named standard in §3. Every requirement in §6–§8 was implementable as
written against the architecture's design; nothing required an interpretation the spec did not
already fix.

*Observation, not an issue:* `docs/specs/spec-aps-fusion-mcp-server.md:3` reads
`**Status:** Draft for review`, while `HANDOFF.md` records the spec as passed (five blinded
rounds, zero findings) with the R-REL-7/AC-25 amendment accepted by owner direction on
2026-07-30. The architecture flagged the same discrepancy at its header and declined to resolve
it. It is governance metadata: no plan step reads the line, no build behavior turns on it, and
the spec's *content* — which both documents agree on — is what this plan is written against.
Noted so the discrepancy is not silently inherited; it requires no action for this plan to
proceed and creates no step.

## 5. Files affected

**Deleted** (7 code files + build output): `src/index.ts`, `src/constants.ts`,
`src/services/aps-auth.ts`, `src/services/aps-client.ts`, `src/tools/data-management.ts`,
`src/tools/mfg-data-model.ts`, `src/tools/model-derivative.ts`, and `dist/`.
Dependents: none outside this set — `codegraph_get_dependents` shows `src/index.ts` with 0
dependents (it is the sole entry point) and every other file's dependents lie inside the deleted
set, so the deletion is self-contained.

**Created.** Derived from the step set — every row names the step that creates it, and every
step that creates a file appears here. 26 source files plus one config file (27 rows):

| File | Created by |
|---|---|
| `src/config.ts` | S3 |
| `src/logging.ts` | S4 |
| `src/services/state-store.ts` | S5 |
| `src/services/token-manager.ts` | S6 |
| `src/services/output-guard.ts` | S7 |
| `src/services/aps-http.ts` | S8 |
| `src/services/spend-guard.ts` | S8 |
| `src/http/middleware.ts` | S9 |
| `src/services/errors.ts` | S10 |
| `src/index.ts` | S11 (the `registerGuardedTool` wrapper) and S22 (the composition root) |
| `src/tools/tool-defs.ts` | S12 |
| `src/gateways/mfg-gateway.ts` | S13 |
| `src/gateways/dm-gateway.ts` | S14 |
| `src/gateways/md-gateway.ts` | S15 |
| `src/gateways/da-gateway.ts` | S20 |
| `src/tools/auth-tools.ts` | S16 |
| `src/tools/discovery-tools.ts` | S16 |
| `src/tools/read-tools.ts` | S17 |
| `src/tools/write-tools.ts` | S18 |
| `src/tools/export-tools.ts` | S19 |
| `src/tools/automation-tools.ts` | S20 |
| `src/tools/notify-tools.ts` | S21 |
| `src/http/mcp-route.ts` | S22 |
| `src/http/auth-routes.ts` | S22 |
| `src/http/health-route.ts` | S22 |
| `src/http/webhook-route.ts` | S23 |
| `vitest.config.ts` | S2 |

Plus the test tree under `test/`, created incrementally by the step that owns each module's
tests (S3 onward — see §12).

**Modified:** `package.json` (exact pins, vitest, test script), `tsconfig.json` (verify strict),
`README.md` (full rewrite — see below), and `.env.example` (rewritten by S25 — it already exists,
so it is a modification, not a creation).

**Documentation.** `codegraph_find_related_docs` over the eight changed files returned 18 docs.
They partition into three classes, and the plan treats them differently — blanket-updating all 18
would corrupt a historical record:

- **Rewrite (1):** `README.md`. It documents the predecessor's Cloud Run deployment including
  `--allow-unauthenticated` (README.md:53) and an in-memory token model (README.md:162), both of
  which the new architecture reverses. **It was *not* among the 18** — it references no `src/`
  path, so the path-matching tool could not see it. Caught by direct read; step S25 covers it.
- **Update (2):** `INVENTORY.md`, `CRITERIA.md` — live working surfaces describing the current
  tree. Step S25.
- **Do not touch (16):** `docs/reviews/round-12..19-architecture-review.md` (8),
  `prior-session-artifacts/*` (6), plus `docs/specs/…` and `docs/architectures/…` themselves.
  Review rounds and prior-session artifacts are dated point-in-time records; spec M-4 states the
  prior-session prose is "historical record, not requirements." Editing them to match new code
  would destroy their evidentiary value. Recorded as Decision D-P4.

## 6. Foundation corrections

The build starts on a cleared tree (spec M-1/M-2), so there is no foundation to inherit or
repair — the architecture reaches the same conclusion and records it in its conditional-tool
attestation. Two items nonetheless precede feature work and are ordered first:

- **F-1. The predecessor tree is deleted, not edited around.** Standard violated by leaving it:
  spec M-1 ("replaced, not extended") and M-2 (the working tree and `dist/` "are not a
  baseline"). Cannot be deferred: leaving the old modules importable invites the new composition
  root to reach one, which is precisely the pattern-replication the architecture's local-optimum
  audit exists to prevent. Step S1.
- **F-2. No test infrastructure exists.** Verified: no `test` script and no framework in
  `package.json`, and zero `*.test.ts` / `*.spec.ts` / `*_test.ts` files anywhere outside
  `node_modules`. Standard violated: the spec's acceptance criteria AC-11, AC-19, AC-20, AC-21,
  AC-23, AC-24, AC-25 and AC-26 are behavioural and cannot be demonstrated without a harness
  (AC-11, AC-19, AC-21, AC-23 and AC-25 additionally require the D26 seams — see §12). Cannot be deferred past S6, because
  D26's injected seams are only cheap if written into the modules from the start. Step S2.

## 7. Plan

Ordered. Dependencies point backward only. Steps are grouped by phase; every step names its
Source, and every non-trivial step carries the four-part format.

---

### Phase 0 — Preserve, then clear the tree

**S0. Commit the predecessor's uncommitted working tree before anything is deleted.**

*What changes.* No source changes. **This step is COMPLETE — executed 2026-07-30 as commit
`6e5f00b` on branch `claude/aps-fusion-spec`.** It committed 257 insertions and 93 deletions
across five files that existed nowhere in git history: `package.json`, `src/constants.ts`,
`src/index.ts`, `src/services/aps-auth.ts`, `src/tools/mfg-data-model.ts`. There was no stash.
If this plan is executed on a tree where that commit is absent, the step must be performed before
S1.

*Source.* Spec M-2 (the working tree "is not a baseline") — which governs what the *build* may
draw on, not whether the bytes may be destroyed; and the general rule that an irreversible
deletion is gated on a recoverable copy existing first.

*Why this approach.* **Decision:** commit rather than stash, and do it as its own step ahead of
S1. **Standard:** first-principles — an operation whose failure mode is unrecoverable data loss
must be preceded by the creation of a recovery path; there is no engineering standard that
sanctions deleting the only copy of anything. **Why this standard applies here:** the uncommitted
delta is not incidental — HEAD's `aps-auth.ts` is 80 lines and contains no `clearTokens`, while
the working copy is 147 lines and contains it; `HUB_LIMIT` is likewise absent from HEAD. Most of
the predecessor evidence §11 cites exists **only** in the working tree, so deleting it destroys
both the owner's work and this plan's own evidentiary basis. **What this is NOT — and why:**
*Not* `git stash` — a stash is easy to drop and is not pushed, so it is a weaker guarantee than a
commit for something irreplaceable. *Not* skipping preservation on the reasoning that spec M-2
calls the tree "not a baseline" — M-2 governs what the rebuild may *inherit*, and says nothing
about destroying bytes; reading it as deletion authority is a category error. *Not* leaving the
decision to the implementer — the failure is silent and total.

*Dependencies.* None. **Blocks S1.**

*Verification.* Pinned to content, not to `HEAD` — `HEAD` moves as later work commits, and a
verification that drifts is worse than none. From the repository root (`agent-armory`, **not** the
server directory — the paths below are repo-relative and fail otherwise):
`git show --stat 6e5f00b` lists exactly the five files at 257 insertions / 93 deletions;
`git show 6e5f00b:./mcp-servers/aps-fusion-mcp-server/src/services/aps-auth.ts | grep -c 'function clearTokens'`
returns **1** (the declaration; a bare-symbol count returns 2 — declaration at `:38`, call site at
`:119` — so the declaration form is used, being unambiguous if a call site is later added or
removed);
`git show 6e5f00b:./mcp-servers/aps-fusion-mcp-server/src/tools/mfg-data-model.ts | grep -c HUB_LIMIT`
returns **2** (declaration at `:127`, use at `:143`). All three values were observed by running
the commands, not derived. Both symbols are absent from the commit's parent, which is what makes
the preservation load-bearing.

*Impact if wrong.* If skipped, 257 lines of the owner's uncommitted work are destroyed with no
recovery path, and ~9 of §11's verification entries lose the source they cite. This is the only
irreversible data-loss risk in the plan.

**S1. Delete the predecessor source tree and build output.**

*What changes.* Delete `src/index.ts`, `src/constants.ts`, `src/services/aps-auth.ts`,
`src/services/aps-client.ts`, `src/tools/data-management.ts`, `src/tools/mfg-data-model.ts`,
`src/tools/model-derivative.ts`, and the `dist/` directory. Leave `.env` (git-ignored, holds live
credentials), `docs/`, `prior-session-artifacts/`, `README.md`, `INVENTORY.md`, `CRITERIA.md`,
`package.json`, `tsconfig.json`, `.gitignore`, `.dockerignore`, `Dockerfile`.

*Source.* Spec M-1, M-2.

*Why this approach.* **Decision:** remove the predecessor wholesale before writing any new module,
rather than migrating file-by-file. **Standard:** spec M-1/M-2, which state the existing server is
a "broken predecessor, not a baseline" whose "behavior is evidence of what was built, never a
source of requirements." **Why this standard applies here:** the architecture's stated primary
local-optimum trap is mirroring the predecessor's layout because "it is the most available
reference and it compiles"; deleting it removes the reference before it can be consulted, which
is the only mechanical form of that control. **What this is NOT — and why:** *Not* incremental
migration keeping modules alive until replaced — that guarantees a window in which a new module
can import an old one, and the old `apsGet(url)` (arbitrary-URL, no allowlist, no timeout) is
exactly the shape D8/D18/D22 exist to forbid. *Not* leaving `dist/` — it is the compiled
predecessor and `package.json:6` names `dist/index.js` as `main`, so a stale `dist/` is a runnable
wrong server.

*Dependencies.* **S0 — this step MUST NOT run until S0's preservation commit exists and is
verified.** Unblocks every subsequent step.

*Verification.* `git status` shows the seven files deleted, and `git log --oneline -1 6e5f00b`
confirms the preservation commit is an ancestor of HEAD (`git merge-base --is-ancestor 6e5f00b
HEAD` exits 0). `ls src/` reports no `.ts` files and `ls dist/` reports the directory absent.
(A CodeGraph rescan is a useful cross-check but is an MCP tool call with a `force` parameter, not
a shell command — it is not part of this step's verification for that reason.)

*Impact if wrong.* Recoverable **only because S0 ran** — the files are in git history from that
commit forward and from nowhere else. Run without S0, this step destroys 257 lines of
uncommitted work permanently. Deleting beyond the enumerated set (e.g. `.env`) is the other
hazard: it destroys the live credential, which no commit protects because the file is
git-ignored. The step enumerates retained paths explicitly for both reasons.

**S2. Pin dependencies exactly; add the test harness.**

*What changes.* In `package.json`: convert `@modelcontextprotocol/sdk`, `express`, `zod` from
caret ranges to exact versions; add exact-pinned `pino`; add dev-dependencies `vitest` and
`@vitest/coverage-v8` exact-pinned; add `"test": "vitest run"` and `"test:watch": "vitest"`
scripts. Commit `package-lock.json`. Create `vitest.config.ts` (node environment, globals off,
`test/**/*.test.ts` include). Verify `tsconfig.json` has `strict: true`.

*Source.* R-OPS-3 ("dependencies SHALL be pinned and locked"); D21 ("dependencies are pinned exact
in `package.json` with the lockfile committed"); D26 (runner "recorded as a dev-tooling default
the plan may confirm").

*Why this approach.* **Decision:** vitest 4.x as the runner, pinned exact, with no other test
framework. **Standard:** D26 explicitly delegates the runner choice to this plan; the testing
standards reference (SWE-at-Google, Test Doubles) requires a runner supporting constructor
injection without module-level monkey-patching. **Why this standard applies here:** D26's seams
are constructor-injected `fetch`, clock, and fs hooks — a runner is needed only to execute and
assert, not to intercept modules, so the selection criterion is native ESM + TypeScript support on
Windows (C7) rather than mocking power. Vitest resolves cleanly (Context7 `/vitest-dev/vitest`,
v4.1.6) and runs ESM/TS natively, which matches `package.json:5` `"type": "module"`.
**What this is NOT — and why:** *Not* Jest — it needs additional ESM configuration for a
`"type": "module"` package and its module-mocking strength is the capability D26 explicitly
declines ("not module-level monkey-patching as the primary seam"). *Not* `node:test` — workable,
but it has no coverage integration and D26's induced-failure suite benefits from vitest's
`vi.useFakeTimers` for the AC-19 backoff-spacing assertions. *Not* leaving caret ranges — R-OPS-3
requires pinning, and the predecessor's `^1.29.0`/`^5.2.1`/`^4.3.6` (verified at
`package.json:16–18`) are what let a minor bump change behavior under a passing lockfile.

*Dependencies.* S1. Unblocks S3 onward.

*Verification.* `npm ci` succeeds from the committed lockfile; `npm test` exits 0 with zero tests;
`node -e "…"` confirms no dependency spec in `package.json` contains `^` or `~`.

*Impact if wrong.* Contained. A wrong pin surfaces at `npm ci` or first import, before any
behavior depends on it.

**CHECKPOINT F — the foundation corrections are complete and verified.**
Trigger: the boundary between this plan's two foundation corrections (F-1, F-2) and the work that
depends on them. Verify: S0's preservation commit `6e5f00b` exists and its content checks return
the values S0 states; `src/` is empty and `dist/` is gone; `npm ci` succeeds from the committed
lockfile; `npm test` runs and exits 0 with zero tests; no dependency spec in `package.json`
retains a `^` or `~`. **The tree cannot be un-deleted after S1 without the S0 commit, so this is
the last point at which the preservation is verifiable rather than assumed.**

---

### Phase 1 — Foundation (no in-project dependencies)

**S3. `src/config.ts` — the full configuration schema, zod-validated once at startup.**

*What changes.* Create `src/config.ts` exporting a typed, frozen config object built by parsing
`process.env` through a `z.discriminatedUnion("MCP_SERVING_MODE", [...])` over the three-valued
discriminant `stdio | hosted | both`, with the exact per-branch requiredness, optional feature
keys, and documented defaults D21 enumerates — including `MFG_MAX_PAGES` (20),
`MFG_SEARCH_MAX_PROJECTS` (50), `MFG_SEARCH_ROW_LIMIT` (25), `UPLOAD_MAX_BYTES` (100 MB),
`HTTP_MAX_BODY_BYTES` (default `ceil(UPLOAD_MAX_BYTES × 4/3) + 1 MB`), `DM_POLL_MAX_FOLDERS`
(200), `TOKEN_LOCK_STALE_MS` (45 000), `TOKEN_RENEWAL_THRESHOLD_MS` (300 000),
`AUTH_VERIFIER_TTL` (10 min), the three spend caps, the dedupe TTL, and `EGRESS_ALLOW_HOSTS`
(extends, never replaces, the built-in set). Implement the four cross-key startup assertions:
(i) `HTTP_MAX_BODY_BYTES` ≥ the derived minimum; (ii) `TOKEN_RENEWAL_THRESHOLD_MS` ≥ D18's
worst-case retried exchange (attempts × (timeout + 10 s wait ceiling) = 120 s at defaults);
(iii) `TAILNET_BASE_URL` and `WEBHOOK_PUBLIC_URL` do not resolve to the same host:port;
(iv) when `APS_CALLBACK_URL` is present in hosted mode it agrees with the derived
`TAILNET_BASE_URL + /auth/callback`. Failures exit non-zero naming the offending key and expected
form. Nothing else in the tree reads `process.env`.

*Source.* D21; R-OPS-2, R-REL-6, R-OPS-3.

*Why this approach.* **Decision:** requiredness is enforced by a zod discriminated union on the
serving mode, not by imperative checks. **Standard:** The Twelve-Factor App §III (config in the
environment, strict separation from code); R-OPS-2's read-once rule. **Why this standard applies
here:** the same build runs in two modes on one host, so mode is the only thing that can decide
which keys are mandatory — and encoding that in the validator means the "hosted branch requires
`MCP_AUTH_TOKEN`" pairing is structural, closing the configuration path that would otherwise
let an ungated `/mcp` exist (the predecessor's headline defect). **What this is NOT — and why:**
*Not* per-site `process.env` reads with fallbacks — the predecessor's `env()` helper threw at
call time mid-tool (`src/services/aps-auth.ts:45–49`), converting misconfiguration into a runtime
surprise instead of a boot failure. *Not* a flat schema with `.optional()` everywhere plus
`.refine()` checks — that expresses requiredness as an afterthought and cannot make the
mode↔token pairing unrepresentable.

*Dependencies.* S2. Unblocks all.

*Verification.* Test specs T-1 (valid per-mode parses), T-2 (each assertion fires) — §12.

*Impact if wrong.* Cascading but loud: a wrong requiredness rule either refuses a valid start
(caught immediately) or admits a hosted start without `MCP_AUTH_TOKEN`, which is a security
regression to the predecessor's defect. T-2 asserts the latter specifically.

**S4. `src/logging.ts` — pino, destination per transport, redaction plus allowlisted summaries.**

*What changes.* Create `src/logging.ts` exporting a configured pino instance: in stdio mode
`pino.destination(2)` (stderr only); in HTTP mode a file destination plus stderr. Level from
config. Configure `redact.paths` covering authorization headers, every token field, and the
webhook secret. Export a `logToolInvocation(name, argSummary, outcome, durationMs)` helper whose
argument summary is built from an explicit **allowlist** of id and enum fields — never free text,
never values.

*Source.* D20; R-OPS-1, R-PROTO-2, S-5.

*Why this approach.* **Decision:** allowlist first, `redact` as the backstop — not redact alone.
**Standard:** [OWASP-SECRETS] (no secrets in logs); R-OPS-1's "sanitized argument summary."
**Why this standard applies here:** T6 names logs as a leak channel, and this server's tool
arguments carry design names and custom-property values that are themselves untrusted external
content — a denylist of known-secret paths cannot anticipate a secret pasted into a property
value, whereas an allowlist of ids and enums cannot emit one. **What this is NOT — and why:**
*Not* a hand-rolled logger — redaction is safety-critical and pino's is verified
(`redact.paths/censor/remove`, Context7 `/pinojs/pino`). *Not* log-everything-then-redact — that
inverts the burden and leaks on the first unanticipated field.

*Dependencies.* S3. Unblocks all.

*Verification.* Test spec T-3 (stdout purity under stdio; no secret in a logged line) — §12.

*Impact if wrong.* Wrong destination in stdio mode corrupts the protocol stream (R-PROTO-2
violation, breaks every tool call). Wrong redaction leaks credentials into a file. Both are
covered by T-3 and by AC-12/AC-14 at acceptance.

**S5. `src/services/state-store.ts` — atomic JSON state directory.**

*What changes.* Create `state-store.ts` managing `<credential-dir>/state/` with a typed accessor
per artifact in D24's inventory — `spend-counters.json`, `webhook-dedupe.json`,
`webhook-secrets.json`, `poll-markers.json`, `refresh-journal.json`, `auth-state.json`,
`pkce-verifiers.json`, `da-workitems.json`, `events.ndjson`. Every write is
temp-file + `fsync` + atomic `rename`. Directory creation applies the D10 ACL (Windows: `icacls`
reset + owner-only grant; POSIX: 0700/0600) and a startup verification that refuses to serve if
the restriction is absent. Expose an injectable fs hook (D26) for the crash tests.

*Source.* D24, D10; S-5, R-REL-7.

*Why this approach.* **Decision:** flat atomic JSON files, no embedded database. **Standard:**
the architecture's recorded first-principles articulation at D24, plus [OWASP-SECRETS]
least-privilege at rest. **Why this standard applies here:** every durable datum here exists to
make a security or reliability control survive restart, so the correctness bar is the atomic-write
discipline D8 already mandates and the threat model is D10's directory ACL — a database would add
a dependency, a file format, and migration surface to both without serving either. **What this is
NOT — and why:** *Not* SQLite — justified only if state outgrows single-file atomic rewrites,
recorded as the named growth path. *Not* in-memory — spend counters and replay dedupe must
survive restart or AC-24's human-out-of-the-loop clause and AC-9's replay defence both fail.
*Not* a mode bit alone on Windows — spec S-5 explicitly requires "real OS-level restriction, not
a mode bit that is inert on the host FS," and the predecessor's `{ mode: 0o600 }`
(`src/services/aps-auth.ts:31`) is precisely that inert bit on NTFS.

*Dependencies.* S3. Unblocks S6, S8, S21.

*Verification.* Test specs T-4 (atomicity under induced mid-write failure), T-5 (ACL verified at
startup; refusal when absent) — §12.

*Impact if wrong.* Cascading and potentially destructive: a non-atomic write here can corrupt the
refresh journal, which is the mechanism AC-25 depends on. T-4 targets exactly this.

---

### Phase 2 — Credential core

**S6. `src/services/token-manager.ts` — the sole owner of the credential file.**

*What changes.* Create `token-manager.ts` implementing D8 in full: (a) failure **classification** —
transient (network/429/5xx) leaves the credential untouched and returns retryable; `invalid_scope`
leaves it untouched and records `reauth-required(scope-change)`; `invalid_grant` records
`reauth-required(revoked)`; **no code path deletes or nulls the file**. (b) **Atomicity** —
refreshes are demand-driven (only within `TOKEN_RENEWAL_THRESHOLD_MS` of expiry, never
opportunistic); a `rotation-in-flight` journal entry is written before the refresh POST; on
response the **raw bytes are durably written (temp + fsync) before any parsing**, then the parsed
credential is promoted by atomic rename and the journal cleared; on startup a live journal entry
plus a failing stored token yields `reauth-required(rotation-lost)`. (c) **Concurrency** —
in-process single-flight mutex plus a cross-process `O_EXCL` advisory lock with
`TOKEN_LOCK_STALE_MS` staleness; after acquiring, re-read and **adopt** a sibling's newer rotation
rather than refreshing. (d) refresh always sends the same granted scope set (C3). Constructor
takes injectable clock and fs hooks (D26).

*Source.* D8; R-REL-2, R-REL-3, R-REL-7, R-AUTH-1, S-3; C1/C2/C3.

*Why this approach.* **Decision:** journal-then-act with write-bytes-before-parse, and error
handling that never destroys the credential. **Standard:** Crash-Only Software (Candea & Fox,
HotOS IX 2003) — journal-then-act, atomic rename, recover-on-restart. **Why this standard applies
here:** C2 means Autodesk kills the prior refresh token the instant it issues the replacement, so
every crash inside the refresh window is a potential unrecoverable brick — the crash-only frame,
which treats AC-25's crash test as normal operation rather than an edge case, is the only stance
that fits an asset that cannot be reconstructed without a human at a browser. **What this is NOT
— and why:** *Not* clear-on-error. The predecessor's `refreshToken()` calls `clearTokens()` on
*any* `!res.ok` when no sibling rotation is detected (`src/services/aps-auth.ts:110–121`), and
`clearTokens()` writes the literal `null` over the file (`:38–41`) — which is why
`~/.aps-fusion-mcp/tokens.json` contains `null` today. A transient 429 destroys the credential
under that design. *Not* parse-then-write — it leaves serialization work inside the unrecoverable
window for no benefit. *Not* process-global mutable token state without file authority — stale
the moment a sibling rotates, and C2 makes the on-disk file the only source of truth.
*Not* refresh-on-401-retry loops — unbounded, and non-idempotent against rotating tokens.

*Dependencies.* S3, S4, S5. Unblocks S8, S16, S23, S24.

*Verification.* Test specs T-6 (transient survives), T-7 (`invalid_scope` / `invalid_grant`
classification), T-8 (AC-25 crash between rotation and persist), T-9 (AC-25 concurrent-refresh
race), T-10 (demand-driven, not opportunistic) — §12.

*Impact if wrong.* **The most destructive step in the plan.** A defect here can destroy the
owner's credential and force a browser re-auth — the exact failure this rebuild exists to
eliminate. Not silently recoverable. It carries the densest test coverage for that reason, and
Checkpoint C gates it immediately below.

**CHECKPOINT C — the credential lifecycle is correct before anything depends on it.**
Trigger: **a step that is hard to reverse if it goes wrong** — one of Step 10's four checkpoint
triggers, and S6 is this plan's clearest instance: it declares itself "the most destructive step
in the plan," a defect there destroys the owner's credential, and every later step needs a token.
Verify: T-6 through T-10 green, including AC-25's crash test at both trip points; no code path in
`token-manager.ts` deletes or truncates the credential file (static check: zero `unlink`,
`rm`, or write-of-empty against the credential path); the cross-process lock releases on the
stale timeout; and a manual smoke — kill the process mid-refresh and confirm restart reports
`reauth-required(rotation-lost)` with the file intact. **Nothing in Phase 3 may begin until this
passes**, because a token-manager defect discovered after the gateways exist is diagnosed through
every call path instead of one.

---

### Phase 3 — The outbound chokepoint

**S7. `src/services/output-guard.ts` — bounding and neutralization.** *(ordered here because S8's
error paths render through it)*

*What changes.* Create `output-guard.ts` exporting (a) a **single** bounding implementation —
structured lists truncated by item count with `truncated: true` + cursor; text renderings by one
configured character limit with an explicit marker; and (b) **neutralization** of
external-content string fields (design/file/folder names, custom-property values, foreign-CAD
metadata): control characters stripped, length-capped, carried as structured data values never
concatenated into instruction-like prose, and marked as untrusted spans in the text rendering.
Also export the shared completeness-envelope zod fragment (`truncated`, optional `cursor`,
untrusted-content marking) that every data tool's `outputSchema` composes via `.extend()` or
shape spread.

*Source.* D19; R-REL-5, S-13, R-DISC-4.

*Why this approach.* **Decision:** one guard, and its mutations are schema-legal by construction
via a shared envelope fragment. **Standard:** [MCP-TOOLS] Security Considerations ("servers MUST
sanitize tool outputs"); spec S-13. **Why this standard applies here:** the SDK validates
`structuredContent` against the declared `outputSchema`, so a guard that writes `truncated` into
a result whose schema does not declare it produces a validation failure at the worst moment —
composing the fragment into every data schema is what makes the guard's writes always legal.
**What this is NOT — and why:** *Not* per-tool truncation helpers — the predecessor shipped two
divergent implementations (`truncateIfNeeded` at `src/tools/mfg-data-model.ts:30` and `truncate`
at `src/tools/model-derivative.ts:9`), which is R-REL-5's literal origin. *Not* `.merge()` for
fragment composition — the zod **v4** API reference documents `.extend()` and object shape-spread
as the composition forms (§11 claim 24, verified directly), and `.merge()` is not among them.
(A stronger-sounding argument is available — that `.merge()` lets the result inherit the second
schema's `unknownKeys` policy, which would be the wrong foundation for a
schema-legal-by-construction guarantee — but that semantics statement is documented in zod's
**v3** reference, and this project pins `^4.3.6`; it is recorded as gap G-4 rather than relied
on here.) *Not* HTML escaping — the consumer is an agent context, not a
browser; the threat is instruction-shaped text, addressed by structural separation and marking.

*Dependencies.* S3. Unblocks S8, S12.

*Verification.* Test specs T-11 (single mechanism, both output kinds), T-12 (AC-26 neutralization)
— §12.

*Impact if wrong.* Contained per call but broad in reach — every tool's output passes here. A
neutralization gap is a prompt-injection channel into the consuming agent (T8).

**S8. `src/services/aps-http.ts` and `src/services/spend-guard.ts` — the only outbound path.**

*What changes.* Create `aps-http.ts` wrapping global `fetch` as the **single** egress point, with
a request API whose type makes both tags **required**: `cost: 'none' | 'md-translate' |
'mfg-generate' | 'da-workitem'` and `safe: boolean`, **jointly constrained so `safe: true`
requires `cost: 'none'`** (a billable-and-retryable request is unconstructible). Implement:
`AbortSignal.timeout` on every request (default 30 s, config); the D22 egress allowlist —
`https:` only, exact-host by default with explicit leading-dot suffix rules matching on whole DNS
labels, literal-IP hosts refused, loopback/link-local/private refused, `redirect: 'manual'` with
re-validation of every hop; bounded retry on 429/5xx/network for `safe` requests only — max 3
attempts, exponential backoff with jitter, honoring `Retry-After`, with a 10 s per-attempt wait
ceiling; and a call to `spendGuard.authorize(tag)` before dispatching any request whose tag is not
`none`. Constructor takes the injectable fetch (D26). Create `spend-guard.ts`: persisted
per-UTC-day counters per category in the state store, configured caps, optional
`SPEND_REQUIRE_CONFIRM` categories, refusal returning a `budget`-class error naming the cap, the
current count, and the config key — with no APS request made. **SpendGuard authorizes once per
tool invocation, not per attempt.**

*Source.* D13, D18, D22; R-REL-1, R-REL-4, S-10, S-11, S-9.

*Why this approach.* **Decision:** retry eligibility is a declared property of the operation
carried in the request type, not a function of the HTTP method — and it is type-coupled to cost.
**Standard:** RFC 9110 §9.2.2 (retries only where the operation contract makes them safe); Google
SRE Book ch. 22 (bounded exponential backoff with jitter). **Why this standard applies here:**
Autodesk exposes the *billable* derivative generation as a field on a **Query** type
(`ComponentVersion.derivatives(derivativeInput:{generate:true})`), so GraphQL's query/mutation
split is a schema-authoring convention rather than a safety guarantee — a method-based or
kind-based retry test would classify a metered job as safe and could spend 3× its authorized cap,
defeating S-11. **What this is NOT — and why:** *Not* method-based retry eligibility — besides
the generate-on-a-Query case, it would exclude the entire MFG read surface from retry protection
on the very API whose 429s are routine. *Not* blanket retry-on-failure — retrying a mutation
duplicates writes and retrying the refresh POST double-rotates, the exact C2 hazard. *Not*
axios/got — `fetch` is built in on Node ≥18 (C9), and one fewer dependency inside the security
chokepoint is the point. *Not* in-memory spend counters — a crashing runaway resets its own
budget.

*Dependencies.* S3, S4, S5, S6, S7. Unblocks every gateway.

*Verification.* Test specs T-13 (AC-11 timeout), T-14 (AC-19 bounded backoff, observed count and
spacing), T-15 (non-safe never retried), T-16 (AC-23 SSRF refusals incl. redirect hop and
label-boundary suffix cases), T-17 (AC-24 cap refusal with no request issued), T-18
(compile-time: `safe:true` + billable cost does not typecheck) — §12.

*Impact if wrong.* Cascading and expensive. A retry-eligibility defect spends real money; an
allowlist defect is an SSRF hole; a missing timeout hangs a tool call indefinitely. This is the
step where three separate threat controls converge, which is why a checkpoint follows it.

**CHECKPOINT A — the OUTBOUND chokepoint is complete, before anything calls out.**
Scope note: this gate covers the outbound path only. The registration chokepoint
(`registerGuardedTool`) is built at S11 and is gated separately at Checkpoint D — the two are
split because gateways (Phase 5) call out before any tool registers, so the outbound path must be
proven first.
Verify: `aps-http` is the only module in the tree that calls global `fetch` (grep: zero `fetch(`
outside `src/services/aps-http.ts`); the request type rejects `safe:true` with a billable cost at
compile time; SpendGuard counters survive a process restart; T-13..T-18 green. **No gateway may
be written until this passes** — a gateway written before the chokepoint exists is a call site
that never acquired the cost and safe tags.

---

### Phase 4 — Tool registration wrapper

**S9. `src/http/middleware.ts` — bearer gate, Origin validation, loopback assertion.**

*What changes.* Create `middleware.ts` exporting: a bearer gate comparing `MCP_AUTH_TOKEN` via
`crypto.timingSafeEqual` over fixed-length digests, failing 401 with `WWW-Authenticate`; an Origin
validator allowlisting only the `TAILNET_BASE_URL` origin, 403 on a present-but-disallowed Origin,
**permitting absent or empty Origin**; and a startup assertion that every listener the process
starts is bound to 127.0.0.1.

*Source.* D2, D3, D1; S-1, S-2, S-4, S-12.

*Why this approach.* **Decision:** a static high-entropy bearer secret checked per request, and
absent-Origin permitted. **Standard:** [MCP-AUTHZ] (OAuth is SHOULD for HTTP servers — spec D-12
explicitly preserved the simpler-gate option); [MCP-TRANSPORT] Origin validation. **Why this
standard applies here:** exactly one principal exists (spec §2.2 excludes multi-user), so
per-request secret validation delivers S-1's full property with no issuance infrastructure to
defend; and on the Origin rule, T7's attacker is a browser, which *cannot* omit Origin on the
cross-origin requests the control exists to stop — while non-browser MCP clients routinely omit
it, so rejecting absent-Origin would break legitimate clients while conceding nothing to the
threat. **What this is NOT — and why:** *Not* an OAuth 2.1 resource server — an authorization
server guarding one user is new attackable surface addressing no threat in the model; named as the
growth path if multi-user ever enters scope. *Not* mTLS — per-connection rather than per-request,
and client certificates do not survive tailscaled's TLS termination. *Not* the SDK's built-in
`allowedOrigins`/`enableDnsRebindingProtection` — deprecated in v1.29.0 in favour of external
middleware. *Not* session-derived authority — S-12 forbids it and D3's stateless transport issues
no session IDs at all.

*Dependencies.* S3. Unblocks S22.

*Verification.* Test specs T-19 (401 on wrong/absent secret; constant-time path), T-20 (403 on
disallowed Origin; 200 on absent Origin) — §12.

*Impact if wrong.* Severe and silent — a broken gate reproduces the predecessor's headline defect
(`src/index.ts:71` mounts `POST /mcp` with no auth middleware anywhere in the file). AC-13 is the
acceptance backstop.

**S10. `src/services/errors.ts` — the five-class taxonomy.**

*What changes.* Create the error module: `validation` | `auth` | `transient` | `permanent` |
`budget`, each rendered into a uniform shape (class, actionable message, retryable flag, and for
auth the re-auth path), surfaced as `isError: true` tool results with text plus structured error
content. Include the top-level wrapper that converts unexpected throws into `isError` results and
logs them, so no exception escapes a handler and no recoverable error kills the process.

*Source.* D16; R-PROTO-3, R-REL-2, R-REL-6.

*Why this approach.* **Decision:** all failures reach the model as `isError` results; protocol
errors stay reserved for unknown-tool/malformed-request. **Standard:** [SDK] `CallToolResult`
semantics / [MCP-TOOLS] Error Handling — errors the model can see and self-correct from. **Why
this standard applies here:** the consumer is an autonomous agent whose only recovery mechanism is
reading the error and adjusting the next call, and the dominant failure sources here (Autodesk
429s, auth-state transitions, spend refusals) are exactly the recoverable classes — a protocol
error at any of them dead-ends an unattended scheduled run. **What this is NOT — and why:** *Not*
thrown exceptions as the error path — they become protocol errors invisible to the model (spec
D-6). *Not* free-text-only errors — agents branch on structure, so the class and retryable flag
must be machine-readable.

*Dependencies.* S3, S4. Unblocks S12.

*Verification.* Test spec T-21 (each class renders correctly; a thrown error becomes `isError`,
not a protocol error) — §12.

*Impact if wrong.* Broad but non-destructive; degrades agent recovery rather than corrupting data.

**S11. `registerGuardedTool` — the single registration path.**

*What changes.* In `src/index.ts` (composition root), implement
`registerGuardedTool(server, def, handler)`: it calls `server.registerTool` with the def, wraps
the handler so every returned `CallToolResult` passes through OutputGuard, and applies the S10
throw-to-`isError` wrapper. Direct `server.registerTool` calls are prohibited everywhere else.

*Source.* D19, D16.

*Why this approach.* **Decision:** guard application is structural — one wrapper in the
composition root, not a call each handler makes. **Standard:** [MCP-TOOLS] "servers MUST sanitize
tool outputs," realized as a chokepoint. **Why this standard applies here:** the architecture's
entire thesis is that the predecessor's defects were convention failures; a guard each of 37
handlers must remember to invoke reproduces that class exactly, whereas a single registration path
makes an unguarded tool a composition-level defect visible in one file at review. **What this is
NOT — and why:** *Not* per-handler `outputGuard(...)` calls — one omission is a silent
S-13 hole. *Not* a lint rule instead of a wrapper — it catches the shape, not the semantics, and
depends on lint being run.

*Dependencies.* S7, S10. Unblocks S16–S21.

*Verification.* Test spec T-22 (a tool registered through the wrapper has its output guarded;
grep asserts zero direct `server.registerTool` outside the composition root) — §12.

*Impact if wrong.* Every tool's output loses its guard — an S-13 and R-REL-5 regression at once.

**S12. Tool-definition conventions module — `src/tools/tool-defs.ts`.**

*What changes.* Create `src/tools/tool-defs.ts` holding the shared tool-definition helpers: the annotation truth matrix from D14
applied as typed constants per effect class (R: `readOnlyHint:true`; W: `readOnlyHint:false` plus
explicit `destructiveHint` and `idempotentHint` per D14's per-tool pinning; `$`:
`readOnlyHint:false, destructiveHint:false, idempotentHint:false` with cost stated in contract
text); `openWorldHint:true` set explicitly on all classes. Establish the **`registerTool` input
form**: `inputSchema: z.object({ ... })`, and likewise `outputSchema: z.object({ ... })` —
never the raw shape `{ a: z.string() }`.

*Source.* D14, D15, D17; R-PROTO-4, R-PROTO-5, R-PROTO-6, R-WRITE-4, S-8, S-9, AC-16.

*Why this approach.* **Decision:** fix the `registerTool` schema form to `z.object({...})` for
all 37 tools. **Standard:** [SDK] v1.29.0 type signature — the primary generic overload is
`registerTool<OutputArgs extends StandardSchemaWithJSON, InputArgs extends StandardSchemaWithJSON
| undefined>(name, config, cb: ToolCallback<InputArgs>)`, and `ToolCallback` resolves handler args
to `StandardSchemaWithJSON.InferOutput<Args>`. **Why this standard applies here:** both forms
work — the implementation signature accepts `StandardSchemaWithJSON | ZodRawShape` — but they are
not equivalent in typing. A raw shape is routed through `normalizeRawShapeSchema` and pairs with
`LegacyToolCallback<ZodRawShape>`; `z.object` is the primary path and is what infers handler
argument types from the schema. Across 37 handlers whose entire safety story is boundary
validation (S-8), typed args on the primary path is the material difference. **What this is NOT —
and why:** *Not* the raw shape (`inputSchema: { a: z.string() }`) — it is the SDK's legacy
compatibility path; it appears in the v1.29.0-tagged `docs/server.md`, but a form appearing in
prose examples is not evidence that it is the maintained one, and the signature says it is not.
*Not* a per-handler choice — 37 tools is 37 chances to diverge, and Gate C forbids deferring it.
*Not* relying on `destructiveHint`'s default — `ToolAnnotationsSchema` documents that default as
**true**, so an additive write omitting it is annotated destructive, violating R-PROTO-4.

*Dependencies.* S11. Unblocks S16–S21.

*Verification.* Test spec T-23 (the AC-16 annotation diff: every tool's emitted annotations equal
the matrix) — §12.

*Impact if wrong.* Annotation untruthfulness is the predecessor's exact production defect
(`readOnlyHint:true` at `src/tools/mfg-data-model.ts:480` over a `generate:true` call at `:497`)
and the only cost signal a scheduled run reads before spending money.

---

**CHECKPOINT D — the REGISTRATION chokepoint is complete, before any tool exists.**
Trigger: the boundary between cross-cutting enforcement and the code that must not bypass it —
the second half of what Checkpoint A covers for egress. Verify: `registerGuardedTool` exists in
the composition root and applies both OutputGuard and the throw-to-`isError` wrapper; the
annotation constants and the `z.object` schema convention are in `src/tools/tool-defs.ts`;
T-21 and T-22 green. **No tool module may be written until this passes** — a tool registered
before the wrapper exists is a tool whose output was never guarded, which is the per-handler
convention failure this rebuild exists to eliminate.

---

### Phase 5 — Gateways

**S13. `src/gateways/mfg-gateway.ts` — all MFG GraphQL, variables only.**

*What changes.* Create `mfg-gateway.ts` holding a **static operation catalog** of constant GraphQL
documents with typed variables — zero string interpolation into document text. Implement the
discovery, read, and write operations backing **every MFG-backed tool — 2 through 22, and 35**
(tool 21 is the `generate:true` derivative operation, tool 22 its `generate:false` counterpart as
a distinct catalog entry per D14, and tool 35 the `itemVersions` query), plus D7's cursor-following
aggregation for `getAssemblyStructure` (page `allOccurrences` at ≤50 per request, follow cursors
to exhaustion or the clamped `min(max_pages, MFG_MAX_PAGES)` cap, aggregate occurrences into
parent→child edges and per-componentVersion quantities, return `truncated` + resume `cursor` and
state which bound bit) and D7's search extension for tool 6 (hubs → projects →
`itemsByProject(name filter)` under `MFG_SEARCH_MAX_PROJECTS`, with a resume cursor). Tools receive
domain-typed results; no tool sees GraphQL. Gateway responses are **parsed** with zod at the trust
boundary, never cast.

*Source.* D5, D6, D7, D17; R-DISC-1, R-DISC-2, R-DISC-3, R-DISC-4, R-READ-1, R-READ-2, R-READ-3,
R-READ-4, R-READ-5, R-READ-6, R-WRITE-1, R-WRITE-2, R-WRITE-3, R-EXPORT-1, R-EXPORT-2, S-7.

*Why this approach.* **Decision:** every operation is a constant document with typed variables,
and all GraphQL is confined to this one module. **Standard:** [OWASP-INJECTION] — parameterized
queries; GraphQL variables are the parameterized form. **Why this standard applies here:** the
predecessor string-built every query — 25 interpolation sites in
`src/tools/mfg-data-model.ts` — and most escaped via `JSON.stringify` while
`aps_get_component_thumbnail` interpolated with bare quotes
(`componentVersionId: "${component_version_id}"`, `:590`), which is direct proof that
convention-based escaping diverges across handlers. Variables make the safe path the only path,
auditable by grepping one module for `${` inside document strings. **What this is NOT — and why:**
*Not* `JSON.stringify`-escaping into document text — it works until one handler forgets, which is
the observed failure. *Not* a sanitization or denylist layer — encoding beats filtering per OWASP.
*Not* a GraphQL client library (apollo/urql) — one consumer, static documents, no cache semantics;
plain fetch through `aps-http` keeps the egress chokepoint intact. *Not* client-side pagination
for the BOM — each window's derived quantities require that window's full occurrence set
server-side, so pushing the page loop onto the agent guarantees wrong quantities.

*Dependencies.* S8, S7. Unblocks S16–S19.

*Verification.* Test specs T-24 (zero `${` inside catalog document strings — static assertion),
T-25 (AC-15: a metacharacter-bearing argument does not alter query structure), T-26 (D7 window
quantities sum exactly across a resumed scan) — §12.

*Impact if wrong.* An injection hole (S-7) or silently wrong BOM quantities. The latter is the
"plausible but wrong" class the owner has explicitly named as the correctness bar.

**S14. `src/gateways/dm-gateway.ts` — Data Management browse, storage pipeline, rollup polling.**

*What changes.* Create `dm-gateway.ts` implementing: the auth probe `GET /project/v1/hubs`
(tagged `cost:'none', safe:true`) backing D8's validity check; the storage + signed-S3 upload +
complete + first-version item-creation pipeline (D23); and D12's rollup-descent polling —
prune folders whose `lastModifiedTimeRollup` < marker, list un-pruned folder contents filtered by
modification time ≥ marker, cap folder visits at `DM_POLL_MAX_FOLDERS`, return changed items plus
a **data-derived** marker (the maximum Autodesk-stamped time actually observed), a
`resume_position` when truncated, and dedupe against the prior poll's reported (itemId, versionId)
set held in `poll-markers.json`.

*Source.* D12, D23, D8(a); R-NOTIFY-2, R-WRITE-3, R-EXPORT-4, R-AUTH-1.

*Why this approach.* **Decision:** markers are data-derived, never clock-derived. **Standard:**
[APS-DATAMGMT]; spec D-10 (change detection must not depend on the callback path). **Why this
standard applies here:** a clock-derived marker that leads Autodesk's clock prunes every change
stamped inside the skew — permanently and invisibly — whereas deriving the marker from observed
Autodesk timestamps puts both sides of every future comparison in the same clock domain. **What
this is NOT — and why:** *Not* MFG-GraphQL polling — `ItemFilterInput` carries only `name` and
`itemType` (no date filter), so MFG-side polling would enumerate everything on every poll and burn
query points. *Not* webhook-only change detection — hostage to the public callback path, which spec
D-10 forbids. *Not* an exclusive `>` boundary — the inclusive `≥` plus reported-set dedupe costs
internal redundancy but can never lose a change stamped exactly at the marker.

*Dependencies.* S8. Unblocks S16, S18, S20, S21.

*Verification.* Test specs T-27 (marker advances only over fully scanned ground), T-28 (truncated
poll resumes without loss or duplication) — §12.

*Impact if wrong.* Silent change loss — the failure mode that looks like success. Contained to the
notify surface.

**S15. Probe gate for Limitations 8(b) and 8(c), then `src/gateways/md-gateway.ts`.**

*What changes.* **Two probes first, in order, using `docs/apsq.mjs` and a direct request after the
M-3 re-auth:**
- **8(b):** run `itemVersions(hubId:, itemId:)` requesting `results { id versionNumber }` and
  inspect the returned `id` for the `fs.file:vf.…?version=` grammar. If it matches, D27 stands as
  written. **If it does not**, insert the pre-specified derivation step: `md-gateway` maps MFG
  `ItemVersion.id` → DM version id before base64url-encoding, and tool 35's contract documents
  which id form it returns.
- **8(c):** issue the `…/manifest/:derivativeUrn/signedcookies` request for a real derivative with
  `derivative_urn` percent-encoded as a whole value. If it 400s, re-issue in the literal-slash
  form, adopt the observed form in the gateway's path composition, and record the observation.

Then create `md-gateway.ts`: `version_id` validated by a zod pattern on the DM version-URN
grammar and base64url-encoded internally; `derivative_urn` validated against the anchored
`urn:adsk.viewing:fs.file:<source>/<segment>…` grammar with `..`, `?`, `#`, `\`, and control
characters rejected, **and bound to `version_id` by recompute-and-match on the `<source>`
segment**; translate (billable, tagged `md-translate`), manifest, object tree with
`objectid`/`level` narrowing, `properties:query` with native `pagination{offset,limit}`, and the
signedcookies retrieval whose URL the **caller** fetches — the server's only outbound call being
the signedcookies request itself.

*Source.* D27, D15, D22, Limitation 8(b)/8(c); R-EXPORT-3, R-EXPORT-4, S-10.

*Why this approach.* **Decision:** the probes are plan steps gating the module, with the failure
branch pre-specified, rather than assumptions carried into code. **Standard:** the Expert
Standard's premise-correctness axis — a factual claim about external behavior is verified by
observation, not asserted from a document. **Why this standard applies here:** the architecture
names these the only two places the built server can diverge from the design "with no document
defect visible" — every other error surfaces as a contradiction someone can read, while these
surface only as a runtime 400 or a wrong id threaded through six tools. **What this is NOT — and
why:** *Not* building `md-gateway` first and probing at acceptance — the id form is threaded
through tools 23–26, 35 and 37 — six in all — so a late discovery is a six-tool rework rather than a
one-function insertion. *Not* accepting caller-supplied opaque base64 URNs — unvalidatable at the
boundary, an S-10 hole, and no other tool emits one. *Not* blocking the whole build on the probes
— they gate only this module, which is why Phases 1–4 and S13/S14 precede them.

*Dependencies.* S8; **and the M-3 owner re-authentication** (see Risks R-1). Unblocks S19.

*Verification.* The probes are self-verifying (the observed grammar / the observed HTTP status is
the result, recorded in the step's output). Test specs T-29 (URN grammar rejects traversal and
control characters), T-30 (recompute-and-match rejects a mismatched `<source>`) — §12.

*Impact if wrong.* If 8(b) resolves false and the derivation step is skipped, the five **consumer**
tools (23, 24, 25, 26, 37) fail at runtime against real data while passing any test built on the
same wrong assumption — the worst class. The sixth tool in the blast radius, 35, does not fail:
it is the **producer** of the id, and what it needs is its contract corrected to state which form
it returns. Five break loudly, one lies quietly. The probe exists to make both impossible.

---

### Phase 6 — Tool modules

**S16–S21. The seven tool modules.** *(Six steps. Each carries its own Source, dependencies,
verification, and impact. They share one four-part justification, stated once below and governing
all six, because the decision is identical for each: implement the assigned inventory rows
verbatim.)*

All tools register through `registerGuardedTool` (S11), use the S12 annotation constants and the
`z.object({...})` schema form, declare an `outputSchema` composing the S7 completeness
envelope, call only their gateway, and never construct GraphQL, URLs, or HTTP requests.

Effect classes: **R** = read-only and free (`readOnlyHint:true`); **W** = write
(`readOnlyHint:false`, with `destructiveHint`/`idempotentHint` per the row); **$** = metered,
SpendGuard-gated, cost stated in the contract text. `openWorldHint:true` on every tool.

**S16 — `auth-tools.ts` (tool 1) + `discovery-tools.ts` (tools 2–6, 35).**

*Source.* D15 (inventory rows 1–6, 35), D14 (annotations), D17 (schemas); R-AUTH-1, R-DISC-1, R-DISC-2, R-DISC-3, R-DISC-4, R-PROTO-4, R-PROTO-5, R-PROTO-6.

| # | Tool | Class | Inputs | Returns | Req |
|---|---|---|---|---|---|
| 1 | `aps_auth_status` | R | — | validity-checked auth state via the S14 DM probe (`GET /project/v1/hubs`, never MFG); login URL when unauthenticated | R-AUTH-1 |
| 2 | `aps_list_hubs` | R | `cursor?` | `hubs[]` + `pageInfo{hasMore,cursor}` | R-DISC-1 |
| 3 | `aps_list_projects` | R | `hub_id`, `cursor?` | `projects[]` + pageInfo | R-DISC-1 |
| 4 | `aps_list_folders` | R | `project_id`, `hub_id` (required when `parent_folder_id` given), `parent_folder_id?`, `cursor?` | `folders[]` via `foldersByProject(projectId!)` (no-parent branch) or `foldersByFolderInHub(hubId!, folderId!)` (by-parent branch) + pageInfo | R-DISC-1/3 |
| 5 | `aps_list_folder_items` | R | `hub_id`, `folder_id`, `cursor?` — backing `itemsByFolder(hubId!, folderId!)` takes exactly these; no project id is accepted | `items[]` + pageInfo. Interface fields (id, name, extensionType, createdOn/By, lastModifiedOn/By) plus `__typename`; `tipVersion{id, versionNumber, lastModifiedOn}` via inline fragments on all four concrete types (BasicItem, DesignItem, ConfiguredDesignItem, DrawingItem) | R-DISC-1/3 |
| 6 | `aps_find_design` | R | hub/project/design name filters, `cursor?` | typed matches + completeness fact; server-side fan-out capped at `MFG_SEARCH_MAX_PROJECTS`, cursor resumes the scan. `DesignItem` matches carry `tipRootComponentVersion.id`; `ConfiguredDesignItem` matches carry `tipVersion.id`, `configured:true`, and `configurationRows[]{rowId,rowName,rootComponentVersionId}` bounded at `MFG_SEARCH_ROW_LIMIT` with `truncated:true` + guidance to tool 7; Basic/Drawing return typed hub/project/item ids only | R-DISC-2 |
| 35 | `aps_list_item_versions` | R | `hub_id`, `item_id`, `cursor?` | `versions[]` (id, versionNumber, createdOn, lastModifiedOn — all `ItemVersion`-interface fields) + pageInfo, via `itemVersions` | R-DISC-1 |

**S17 — `read-tools.ts` (tools 7–12).**

*Source.* D15 (inventory rows 7–12), D5, D7; R-READ-1, R-READ-2, R-READ-3, R-READ-4, R-READ-5, R-READ-6, R-DISC-4, R-PROTO-4, R-PROTO-5, R-PROTO-6.

| # | Tool | Class | Inputs | Returns | Req |
|---|---|---|---|---|---|
| 7 | `aps_get_design_metadata` | R | discriminated union: `{item_id, hub_id, composition?}` (WORKING/RELEASED/AS_SAVED/LATEST via `Query.item(composition:)`) **or** `{component_version_id}` (composition not accepted); optional `configuration_row_id` | **item branch:** interface fields directly; `... on DesignItem` → `tipRootComponentVersion` supplies partNumber/partDescription/materialName/isMilestone, `tipVersion` supplies versionNumber/createdOn; `... on ConfiguredDesignItem` → `tipVersion` supplies versionNumber, part-level fields come per configuration row via `tipConfigurationTable.rows[].rootConfigurationMember` (with `configuration_row_id`, that row's root; without it, the bounded row list to select from); Basic/Drawing → interface + tipVersion only. **componentVersion branch:** part fields directly on `ComponentVersion`; versionNumber/createdOn via `designItemVersion`, falling back to `configuredDesignItemVersion`; absent-with-reason when neither resolves | R-READ-1/6 |
| 8 | `aps_get_assembly_structure` | R | `component_version_id`, `max_pages?` (clamped to `min(max_pages, MFG_MAX_PAGES)`), `cursor?` | per-node id/name/partNumber/material/quantity; `truncated` + resume `cursor`, stating which bound bit (operator cap vs caller request). Quantity = count of occurrence instances per componentVersion under the queried root | R-READ-2 |
| 9 | `aps_get_physical_properties` | R | `component_version_id` | mass/volume/density/area/boundingBox, each with units from `definition.units.name` | R-READ-3 |
| 10 | `aps_where_used` | R | `component_version_id`, `cursor?` | containing assemblies + pageInfo | R-READ-4 |
| 11 | `aps_get_custom_properties` | R | `component_version_id`, `cursor?` | custom properties + their definitions; pageInfo via `Properties{results, pagination}` | R-READ-5 |
| 12 | `aps_get_design_assets` | R | discriminated union (same partition as tool 7): `{item_id, hub_id}` **or** `{component_version_id}`; `cursor?` | drawings list (cursor-paged) + pageInfo; thumbnail signed URL + expiry; Fusion web URL resolved via `designItemVersion → item → DesignItem.fusionWebUrl`, falling back to `configuredDesignItemVersion → item → ConfiguredDesignItem.fusionWebUrl`; absent only when neither resolves | R-READ-5 |

**S18 — `write-tools.ts` (tools 13–20, 36).**

*Source.* D15 (inventory rows 13–20, 36), D23, D28; R-WRITE-1, R-WRITE-2, R-WRITE-3, R-WRITE-4, R-EXPORT-4, R-PROTO-4, R-PROTO-5, R-PROTO-6.

| # | Tool | Class | Inputs | Returns | Req |
|---|---|---|---|---|---|
| 13 | `aps_set_custom_properties` | W destructive, idempotent | `component_version_id`, `{definitionId,value}[]` | applied properties (re-readable); bounded by the caller's own input array | R-WRITE-1 |
| 14 | `aps_create_property_definition` | W additive, non-idempotent | `collection_id?`, `name`, `type`, `behavior` | created definition (+ collection create/link when needed) | R-WRITE-1 |
| 15 | `aps_create_folder` | W additive, non-idempotent | `project_id`, `parent_folder_id`, `name` | created folder | R-WRITE-2 |
| 16 | `aps_rename_folder` | W destructive, idempotent | `folder_id`, `new_name` | updated folder | R-WRITE-2 |
| 17 | `aps_move_folder` | W destructive, idempotent | `folder_id`, `target_parent_id` | moved folder | R-WRITE-2 |
| 18 | `aps_copy_folder` | W additive, non-idempotent | `folder_id`, `target_parent_id` | copied folder | R-WRITE-2 |
| 19 | `aps_delete_folder` | W destructive, idempotent | `folder_id` | deletion confirmation | R-WRITE-2/4 |
| 20 | `aps_create_design_from_file` | W additive, non-idempotent | `project_id`, `target_folder_id`, `name`, **base64 `content` bounded by `UPLOAD_MAX_BYTES` — no filesystem path** | created design item, via DM storage + signed-S3 upload → MFG `createDesignFromFile` | R-WRITE-3 |
| 36 | `aps_upload_file` | W additive, non-idempotent | `project_id`, `target_folder_id`, `name`, **base64 `content` bounded — no path** | uploaded file as a new DM item + version ids (any file type; the foreign-CAD ingestion path whose `version_id` feeds tools 23–26 and 37) | R-EXPORT-4 |

**S19 — `export-tools.ts` (tools 21–26, 37).**

*Source.* D15 (inventory rows 21–26, 37), D14, D27; R-EXPORT-1, R-EXPORT-2, R-EXPORT-3, R-EXPORT-4, R-EXPORT-5, R-DISC-4, R-PROTO-4, R-PROTO-5, R-PROTO-6.

| # | Tool | Class | Inputs | Returns | Req |
|---|---|---|---|---|---|
| 21 | `aps_export_generate` | **$** `mfg-generate` | `component_version_id`, `format ∈ {STEP,STL,OBJ}` | derivative job handle + status; cost stated | R-EXPORT-1/5 |
| 22 | `aps_export_status` | R | `component_version_id`, `format` | status + signed URL + expiry when ready. Uses a **distinct catalog operation with `generate:false`** — cannot bill by construction | R-EXPORT-2/5 |
| 23 | `aps_md_translate` | **$** `md-translate` | `version_id` (URN-grammar-validated), `format ∈ {IGES,DWG,FBX,IFC,SVF2,…}` | translation job accepted; cost stated | R-EXPORT-3/4 |
| 24 | `aps_md_get_manifest` | R | `version_id` | translation status + derivative list (bounded: one version's manifest) | R-EXPORT-3/5 |
| 25 | `aps_md_get_object_tree` | R | `version_id`, `guid`, `object_id?`, `level?` | object tree (foreign CAD included); bounded by the endpoint's `objectid`/`level` narrowing (API enforces a 20 MB ceiling requiring `forceget`); truncation carries narrowing guidance | R-EXPORT-4 |
| 26 | `aps_md_get_object_properties` | R | `version_id`, `guid`, `object_ids?` (narrowing filter, not the paging contract), `cursor?` | per-object properties, cursor-paged via `properties:query` native `pagination{offset,limit}` (limit 1–1000), `totalResults` feeding the completeness fact | R-EXPORT-4 |
| 37 | `aps_md_get_derivative` | R | `version_id`, `derivative_urn` (grammar-validated **and** bound to `version_id` by recompute-and-match on its `<source>` segment) | signed download URL, the signed cookies required to use it, size, content type, expiry — for one derivative, via `…/manifest/:derivativeUrn/signedcookies`. **The URL is fetched by the caller, not the server**, so the download host never enters the egress path | R-EXPORT-3/5 |

**S20 — `src/gateways/da-gateway.ts` + `automation-tools.ts` (tools 27–30).**

*Source.* D15 (inventory rows 27–30), D23, D28; R-AUTO-1, R-AUTO-2, R-AUTO-3, R-AUTO-4, R-AUTO-5, R-DISC-4, R-PROTO-4, R-PROTO-5, R-PROTO-6.

*This step creates the Design Automation gateway as well as its tools*, because no earlier step
does and the tools cannot exist without it. `da-gateway.ts` implements: activity enumeration
(DA `paginationToken` paging); WorkItem submission whose `url`/`verb`/`headers` argument fields
are **minted by the gateway from Data Management ids**, never accepted from the caller (D28) —
inputs get signed `get` URLs, outputs signed `put` URLs targeting storage in
`DA_OUTPUT_FOLDER_ID` via S14's pipeline (D23); status polling; and output resolution from the
`da-workitems.json` submission record. Requests are tagged `cost:'da-workitem'` on submit and
`cost:'none', safe:true` on the reads.

| # | Tool | Class | Inputs | Returns | Req |
|---|---|---|---|---|---|
| 27 | `aps_da_list_activities` | R | `cursor?` | activities available to the app: name + declared inputs; pageInfo via DA `paginationToken` | R-AUTO-5 |
| 28 | `aps_da_submit_workitem` | **$** `da-workitem` | `activity_name`, declared-input argument **values** (never `url`/`verb`/`headers` — the gateway mints every WorkItem URL from DM ids), `output_folder_id?` | WorkItem id + initial status; cost stated. Records `{activityId, submittedAt, outputObjects[], targetFolderId}` to `da-workitems.json` | R-AUTO-1/3 |
| 29 | `aps_da_get_status` | R | `workitem_id` | status enum + report URL | R-AUTO-2 |
| 30 | `aps_da_get_outputs` | R | `workitem_id` | output items / signed URLs, resolved from the submission record (bounded: the output set recorded at submission) | R-AUTO-2 |

**S21 — `notify-tools.ts` (tools 31–34).**

*Source.* D15 (inventory rows 31–34), D11, D12; R-NOTIFY-1, R-NOTIFY-2, R-NOTIFY-3, R-DISC-4, R-PROTO-4, R-PROTO-5, R-PROTO-6.

| # | Tool | Class | Inputs | Returns | Req |
|---|---|---|---|---|---|
| 31 | `aps_notify_register_webhook` | W additive, non-idempotent | `event_types[]`, scope (folder/project) | registered hook ids — **one hook per event type, each with its own freshly generated 256-bit secret** persisted to `webhook-secrets.json`; callback = `WEBHOOK_PUBLIC_URL/webhooks/aps`; actionable error naming the config key when unconfigured | R-NOTIFY-1 |
| 32 | `aps_notify_list_webhooks` | R | `cursor?` | registered hooks; pageInfo via Webhooks `pageState`/`next` | R-NOTIFY-1 |
| 33 | `aps_notify_delete_webhook` | W destructive, idempotent | `hook_id` | deletion confirmation; removes the hook's `webhook-secrets.json` entry | R-NOTIFY-1 |
| 34 | `aps_notify_changes_since` | R | `marker?`, `since_sequence?`, `resume_position?`, `scope?` | changes from the event journal (selected by sequence) merged with the DM rollup poll, de-duplicated on (itemId, versionId). Returns three **named** fields: `marker` (Autodesk-clock, advances only over fully scanned ground), `sequence` (highest journal entry emitted), and `resume_position` when `truncated:true`. Non-version-family journal entries are reported with `identity: unresolved` — by design, not degradation | R-NOTIFY-2 |

*Source (all).* D15 (inventory), D14 (annotations), D17 (schemas), plus the per-tool spec
requirement in the table's Spec column.

*Why this approach (all).* **Decision:** implement the inventory table verbatim; carve nothing
anew. **Standard:** D15's recorded first-principles carving — one tool = one user-meaningful
operation, cost/effect class boundaries are tool boundaries, async lifecycles split
submit/status/retrieve. **Why this standard applies here:** the consuming agent is the only user
and there is no UI to compensate for a confusing surface, so carving quality *is* usability —
and the carving was already derived from the spec's capability groups, so re-deriving it at
plan time would be re-litigating a settled architecture decision. **What this is NOT — and why:**
*Not* re-carving the tool set — that is architecture's output, and changing it here would break
the traceability matrix that accounts for all 60 requirements. *Not* mode-parameters on shared
tools — one annotation set cannot truthfully cover a free read and a billable write, which is the
defect R-EXPORT-2 exists to kill.

*Dependencies.* S16: S13, S14. S17: S13. S18: S13, S14. S19: S13, S15. S20: S14. S21: S14, S5.

*Verification.* Test spec T-31 (per module: every tool in `tools/list` with schema and annotations
matching the inventory row) plus the acceptance criteria named per group — §12.

*Impact if wrong.* Contained per tool; a wrong schema or annotation is visible in `tools/list`.

---

### Phase 7 — Routes, transports, composition

**S22. HTTP routes and the composition root.**

*What changes.* Create `http/mcp-route.ts` (POST `/mcp`: per-request `McpServer` + Streamable HTTP
transport with `sessionIdGenerator: undefined` and `enableJsonResponse: true`, mounted **after**
the bearer gate and Origin check, with `express.json({ limit: HTTP_MAX_BODY_BYTES })` ahead of the
transport); `http/auth-routes.ts` (D9's PKCE S256 login and callback, **outside** the bearer gate);
`http/health-route.ts` (D25's `/healthz`, outside the gate, liveness + protocol revision + version
+ auth-state class, no secrets). Wire `src/index.ts`: config → logger → services → gateways →
tools → routes → transports, mounting middleware in the fixed order bearer → origin → body parser
→ transport, selecting the listener set per the three-valued serving mode. **In `stdio` mode the
process starts exactly one auxiliary loopback listener whose route set is exactly `GET
/auth/login` and `GET /auth/callback` and nothing else — mounting `/mcp` on it is PROHIBITED**
(D1). It binds 127.0.0.1 on the port of `APS_CALLBACK_URL`, is never published via Tailscale
Serve or Funnel, and runs for the process lifetime. This is what makes S-1's
no-unauthenticated-MCP-surface property hold in stdio mode **by route-set construction** rather
than by gate placement, and it is the direct counter to the predecessor's headline defect, which
was an `/mcp` route mounted on exactly such an auxiliary listener (`src/index.ts:71` beside the
unconditional `app.listen` at `:83`). In `both` mode the aux listener is suppressed as redundant,
the main listener already serving `/auth/*`. Each per-request `McpServer` is constructed with the
version read from `package.json`, so `serverInfo` carries it in **both** transports (R-OPS-3 —
the stdio path has no `/healthz` and needs this). Declare **`tools` capability only**, `listChanged: false`.

*Source.* D3, D2, D9, D21, D25, D1; R-PROTO-1, R-PROTO-2, R-OPS-3, R-OPS-5, R-REL-6, S-1, S-4, S-12, S-14 (the PKCE S256 authorization-code flow lives in `auth-routes.ts`, created here).

*Why this approach.* **Decision:** stateless Streamable HTTP with a fresh server+transport per
request, and the body parser behind the auth gates. **Standard:** [MCP-TRANSPORT] / [MCP-LIFECYCLE]
2025-11-25; [MCP-SEC] session rules. **Why this standard applies here:** stateless mode suits a
single-owner server where every request is independently authenticated and long work is modeled as
async jobs, and it eliminates the session store and the session-hijacking surface entirely, so
S-12's clauses hold vacuously; ordering the parser behind the gate means an unauthenticated
request is 401'd before a single body byte is buffered, so the `HTTP_MAX_BODY_BYTES` memory
ceiling is reachable only by an authenticated caller. **What this is NOT — and why:** *Not*
stateful SSE sessions — adds an eventStore and resumability machinery the spec never requires and
creates the surface S-12 polices. *Not* the Express default 100 kB body limit — verified as the
default, it would reject any upload above ~75 kB of content once base64 expansion applies,
silently breaking tools 20 and 36. *Not* mounting `/auth/*` behind the bearer gate — a browser
navigation cannot carry an `Authorization` header, so gating it makes the M-3 first-run login
impossible.

*Dependencies.* S9, S12, S16–S21. Unblocks S23, S26.

*Verification.* Test specs T-32 (middleware order: unauthenticated + bad Origin ⇒ 401, not 403),
T-33 (over-limit body ⇒ 413 before any handler), T-34 (`serverInfo` version present in both
transports) — §12.

*Impact if wrong.* Ordering errors here are security-relevant (an unauthenticated `/mcp`) or
availability-relevant (uploads broken). AC-13 and AC-10 are the acceptance backstops.

**S23. `http/webhook-route.ts` — the dedicated webhook listener.**

*What changes.* Create the webhook route on its **own** loopback listener serving only
`POST /webhooks/aps`: `express.raw({type:'application/json', limit:'1mb'})`; HMAC-SHA1 over the
raw bytes keyed by each active per-hook secret, constant-time trial across the secret set,
compared against `x-adsk-signature` (`sha1hash=<hexdigest>`), 403 on no match; SHA-256
content-hash replay dedupe against `webhook-dedupe.json` (TTL default 24 h) returning 200 with no
action on a hit; otherwise append `{sequence, receivedAt, deliveryId, eventType, resourceUrn,
payload}` to `events.ndjson` and return 200. Listener starts only when `WEBHOOK_PUBLIC_URL` is
set.

*Source.* D11, D1; S-6, R-NOTIFY-1, R-NOTIFY-3, AC-9.

*Why this approach.* **Decision:** raw bytes in, HMAC before anything else, content-hash dedupe,
journal rather than act. **Standard:** [APS-WEBHOOK] signature scheme (spec §13 Q-1, verified);
spec S-6's explicit replay clause; RFC 9110 status semantics. **Why this standard applies here:**
HMAC over parsed-then-restringified JSON breaks on key ordering and whitespace, so raw bytes are
the only correct input; and content-hash dedupe defeats byte-identical replay without depending on
payload field names that are not yet trustworthy at that point in the pipeline. **What this is NOT
— and why:** *Not* `express.json({verify})` — workable, but parse errors should not 400 before the
signature check. *Not* acting on events directly — webhook-triggered side effects make replays
dangerous; the journal decouples receipt from action. *Not* skipping replay defence on
"signatures are enough" — S-6 names replay explicitly. *Not* sharing the main listener — the
webhook route is the only publicly funnelled surface and must serve nothing else.

*Dependencies.* S5, S21, S22.

*Verification.* Test specs T-35 (valid signature accepted; invalid and absent rejected 403),
T-36 (AC-9 byte-identical replay produces no repeated action) — §12.

*Impact if wrong.* A forged-callback hole (T4) or a replay that drives duplicate action.

**CHECKPOINT B — before documentation and live acceptance.** Verify: `npm test` fully green;
`tools/list` returns exactly 37 tools; the annotation matrix diff (T-23) is empty; no listener
binds anything but 127.0.0.1; **the stdio-mode auxiliary listener's route table contains exactly
`GET /auth/login` and `GET /auth/callback` and no `/mcp` route** (D1, and the predecessor's
headline defect); grep confirms zero direct `server.registerTool` outside the
composition root and zero `fetch(` outside `aps-http.ts`.

---

### Phase 8 — Documentation and acceptance

**S24. Health, version, and the stdio smoke invocation.**

*What changes.* Wire `/healthz` to report liveness, protocol revision, the `package.json` version,
and the auth-state class (the three D8 classes only — `ok` / `reauth-required` / `unknown
(transient)`, never token material). Write the documented one-line `initialize`+`tools/list`
stdio smoke command for Windows.

*Source.* D25; R-OPS-3, R-OPS-5, R-OPS-4.

*Why this approach.* **Decision:** `/healthz` sits outside the bearer gate and returns a minimal
payload. **Standard:** D25's recorded first-principles articulation — an operator or probe must be
able to tell the server is alive, which version runs, and whether auth needs attention, without
the health check becoming an information leak or an auth-bootstrapping dependency. **Why this
standard applies here:** this deployment is monitored by dumb probes (an uptime check against the
tailnet hostname) rather than an ops platform, and the auth-state class is the owner's only
passive signal that an M-3-style re-auth condition has recurred — so the endpoint must answer
without credentials while carrying no data. **What this is NOT — and why:** *Not* bearer-gated —
it breaks uptime probes and creates a bootstrap problem exactly when the gate itself is
misconfigured. *Not* rich diagnostics — that turns liveness into reconnaissance. S-1's
no-ambient-authority rule scopes to the **MCP** surface; `/healthz` carries no authority and no
data, so it is not an exception to S-1 but outside its scope.

*Dependencies.* S6, S22.

*Verification.* AC-12's health clause; the smoke command runs from a clean checkout on Windows 11.

*Impact if wrong.* Contained. A leaky health payload is an information disclosure; a gated one
breaks monitoring. Neither corrupts data.

**S25. Documentation rewrite.**

*What changes.* **Rewrite `README.md` entirely** — it currently documents Cloud Run deployment
with `--allow-unauthenticated` (`README.md:53`) and an in-memory token model
(`README.md:162`), both reversed by this architecture. New content: the Tailscale Serve/Funnel
topology with the pinned port allocation (Serve on ts.net 443, Funnel on 8443, never the same
port), the bearer-secret generation command, the Windows 11 clean-checkout run/configure/monitor
procedure, every config key with its default, and **both trust models stated explicitly** (hosted:
tailnet reachability + per-request bearer + the single funnelled HMAC-authenticated route; stdio:
local child process trusting its parent, no network surface beyond the loopback aux listener).
Rewrite `.env.example` to enumerate **every configuration key `src/config.ts` validates** (S3),
grouped by the three serving modes, each documented key showing its default where one exists, and
each secret-valued key (`APS_CLIENT_SECRET`, `MCP_AUTH_TOKEN`) left empty with the generation
command as a comment. It is the file a first-time operator copies to `.env` before the M-3 login,
so its completeness is load-bearing for first run. Update `INVENTORY.md` and `CRITERIA.md` to the
new tree. **Do not modify** the eight
`docs/reviews/round-*.md`, the six `prior-session-artifacts/*`, the spec, or the architecture.

*Source.* R-OPS-4, D25; spec M-4 (prior-session prose is historical record).

*Why this approach.* **Decision:** partition the 18 docs `find_related_docs` returned into
rewrite / update / do-not-touch rather than updating all of them. **Standard:** spec M-4 plus the
general principle that dated point-in-time records are evidence, not living documentation. **Why
this standard applies here:** the eight review rounds are the audit trail of how this design was
verified — editing them to match new code would destroy exactly the property that makes them
worth keeping. **What this is NOT — and why:** *Not* updating all 18 — that corrupts the review
record. *Not* trusting the tool's list as complete — `README.md`, the most user-facing document
in the repo, was **absent** from it because it references no `src/` path, and was caught only by
direct read.

*Dependencies.* S22, S23, S24.

*Verification.* `codegraph_verify_doc` on `README.md`, `INVENTORY.md`, `CRITERIA.md` reports no
invented or dead symbol references; grep confirms `--allow-unauthenticated` appears nowhere in
`README.md`.

*Impact if wrong.* A stale README is how the predecessor's `--allow-unauthenticated` advice
became a deployed reality.

**S26. Live acceptance pass — AC-1 through AC-27.**

*What changes.* No source changes. Execute all 27 acceptance criteria per the §12 acceptance
suite specification, recording observed evidence per criterion (never "reviewed"). Twenty-two run
live against the owner's account; five (AC-11, AC-19, AC-21, AC-23, AC-25) run against the D26
seams, each with its double named and justified in §12's table. **AC-24 runs live:** seed the
spend counter at its cap through the state store's own accessor, then invoke the billable tool
through a real MCP client. A refused call spends nothing — refusal is the guard's defining
behavior — so no money is at risk, and only a live run verifies that SpendGuard actually sits in
the request path rather than that its logic is correct in isolation. Spec AC-24 requires the limit
to hold "for an automated, human-out-of-the-loop invocation path," which a seam cannot
demonstrate; spec AC-6 establishes the observable (confirm at Autodesk that no job was created).

*Source.* Spec §12; the ground-truth bar the owner has stated ("works ≠ correct").

*Why this approach.* **Decision:** acceptance is executed against the running system, and a
criterion whose only evidence is a document is recorded as failed. **Standard:**
ISO/IEC/IEEE 29148's testable-and-traceable requirement carried to execution, and the
testing-standards reference's acceptance rule — criteria verified one-to-one, in the spec's
observable terms. **Why this standard applies here:** the predecessor passed every check anyone
ran on it while returning incomplete find results, null physical properties labelled success, and
a thumbnail failure reported as a successful text result — so "the tool returned something" has
already been demonstrated on this exact codebase to be indistinguishable from correct. Only
observation against ground truth separates them. **What this is NOT — and why:** *Not* a
document review of the criteria — that is the check the predecessor passed. *Not* a sampled
subset: spec §12 says behavioural-correctness criteria are checked by construction **and**
sampled at runtime, "a passing sample is necessary, not sufficient," so every criterion is
executed. *Not* live execution of AC-24 — verifying a spend cap by exceeding it spends the money
the cap exists to protect, which is why it is the one seam-run criterion justified by cost rather
than by inducibility.

*Dependencies.* All prior steps; the M-3 re-auth.

*Verification.* A per-criterion pass/fail record carrying the observed evidence for each — the
27-row trace in §12 is the reconciliation surface.

*Impact if wrong.* A false pass here ships a server that returns plausible-but-wrong answers —
the exact failure class this rebuild exists to eliminate, and the one the predecessor
demonstrated is invisible to every check short of ground truth.

## 8. Divergences from existing patterns

The build is greenfield, so every structural choice diverges from the predecessor by design.
The four load-bearing divergences, each with the standard that justifies it and the step that
introduces it:

| Divergence | Predecessor | Standard | Step |
|---|---|---|---|
| Single typed outbound chokepoint with mandatory cost/safe tags | `apsGet(url)` / `apsPost(url)` take an arbitrary URL with no allowlist, no timeout (`src/services/aps-client.ts:3–19`) | [OWASP-SSRF]; RFC 9110 §9.2.2; D13/D18/D22 | S8 |
| Credential never destroyed by error handling | `clearTokens()` writes `null` over the file on any `!res.ok` (`src/services/aps-auth.ts:38–41`, `:110–121`) | Crash-Only Software; R-REL-2 | S6 |
| Variables-only GraphQL in one module | 25 interpolation sites across `src/tools/mfg-data-model.ts`, one with bare quotes (`:590`) | [OWASP-INJECTION] | S13 |
| One truncation mechanism behind one registration wrapper | two divergent implementations (`mfg-data-model.ts:30`, `model-derivative.ts:9`) | [MCP-TOOLS] output sanitization; R-REL-5 | S7, S11 |

## 9. Checkpoints

**Checkpoint F** — after S2, before any new module is written. Trigger: **the boundary between
the two foundation corrections (F-1, F-2) and the work that depends on them** — Step 10 places a
checkpoint after every foundation correction, and F-1/F-2 are this plan's only two. Verify: S0's
preservation commit exists and contains all five modified files; `src/` is empty and `dist/` is
gone; `npm ci` succeeds from the committed lockfile; `npm test` runs and exits 0 with zero tests;
no dependency spec in `package.json` retains a `^` or `~`. **The tree cannot be un-deleted after
this point without the S0 commit, so this checkpoint is the last place the preservation is
verifiable rather than assumed.**

**Checkpoint C** — after S6, before Phase 3. Trigger: **a step that is hard to reverse if it goes
wrong** — S6 declares itself the most destructive step in the plan, and a defect there destroys
the owner's credential. Contents specified at S6 above.

**Checkpoint A** — after S8, before any gateway. Trigger: the boundary between cross-cutting
enforcement and the code that must not bypass it, egress half. Contents specified at S8 above.

**Checkpoint D** — after S12, before any tool module. Trigger: the same boundary, registration
half. Split from A because gateways call out before any tool registers, so the outbound path must
be proven first. Contents specified at S12 above.

**Checkpoint B** — after S23, before documentation and live acceptance. Trigger: the integration
point where separately-built modules first run as an assembled server. Contents specified above.

**Probe gate** — S15's two probes, before `md-gateway` exists. Trigger: an irreversible-if-wrong
premise (a rework across the six tools that produce or consume the id — 23, 24, 25, 26, 35, 37 —
if discovered late).

**The four triggers, swept.** Step 10 names four conditions requiring a checkpoint; this is the
enumeration rather than an assurance, so a reader can check the class instead of trusting it:

| Trigger | Instances in this plan | Gate |
|---|---|---|
| A foundation correction, before new feature work | F-1 (S1), F-2 (S2) | Checkpoint F |
| A step hard to reverse if it goes wrong | S1 (irreversible deletion — gated by S0 as a hard dependency and re-verified at Checkpoint F); S6 (credential destruction); S15's probes (late discovery = six-tool rework) | Checkpoint F, Checkpoint C, Probe gate |
| An integration point where separately-implemented pieces connect | S22–S23 (modules first run as an assembled server) | Checkpoint B |
| The boundary between structural and behavioral changes | S8→S13 (egress enforcement complete, before any gateway); S12→S16 (registration enforcement complete, before any tool) | Checkpoint A, Checkpoint D |

No trigger instance is ungated.

## 10. Decisions made during planning

- **D-P1. Build order is enforcement-points-first, inverting the vertical-slice instinct.**
  The cost tag (D13), the safe/cost joint constraint (D18), the egress allowlist (D22), and
  `registerGuardedTool` (D19) are all *type-level* or *composition-level* constraints. A tool
  written before its constraint exists compiles without the tag, and retrofitting is a change to
  every call site — the "every handler must remember X" state the architecture exists to prevent.
  Hence Phases 3–4 strictly precede any tool, gated in two halves: Checkpoint A after S8 (egress
  enforcement, before any gateway calls out) and Checkpoint D after S12 (registration enforcement,
  before any tool registers). They are separate gates because gateways call out before any tool
  exists, so the outbound path has to be proven earlier than the registration path.
- **D-P2. The 8(b)/8(c) probes gate only `md-gateway`, not the whole build.** They are blocked on
  an owner action (M-3) with no date. Sequencing everything behind them stalls the plan on an
  owner gate; sequencing them last risks a six-tool rework. Splitting by actual dependency —
  they touch only the MD URN derivation and tool 35's id contract — lets Phases 1–4, S13 and S14
  proceed unblocked while still closing the risk before the dependent code exists. The failure
  branch is pre-specified so a failed probe is a branch the plan already contains, not a stop.
- **D-P3. The test harness lands at S2 and each failure-class module carries its acceptance tests
  in the same step that builds it.** D26's seams (injected fetch, clock, fs) are only cheap if
  written in from the start; a seam retrofitted to satisfy a later test is shaped by the
  implementation rather than by the criterion. AC-25's crash test is the sharpest case — it needs
  an fs hook inside TokenManager, which is why S6 builds the hook and the test together.
- **D-P4. The 18 related docs are partitioned, not uniformly updated.** Eight review rounds and
  six prior-session artifacts are dated point-in-time evidence (spec M-4); editing them to match
  new code destroys their evidentiary value. The live surfaces are `README.md` (rewritten),
  `INVENTORY.md` and `CRITERIA.md` (updated), plus `.env.example` (rewritten — config rather than
  documentation, so it sits in §5's Modified list, not in this 18-doc partition). `README.md` is
  itself outside the 18: the path-matching tool never saw it (D-P7), so the partition covers the
  18 the tool returned, and README is a nineteenth found by reading.
- **D-P5. `registerTool` takes `z.object({...})`, not a raw zod shape.** Both forms are accepted
  — the implementation signature takes `StandardSchemaWithJSON | ZodRawShape` — but they are not
  equivalent. `z.object` is the primary generic overload (`InputArgs extends
  StandardSchemaWithJSON`, `cb: ToolCallback<InputArgs>`) and infers handler argument types from
  the schema; a raw shape is routed through `normalizeRawShapeSchema` and pairs with
  `LegacyToolCallback<ZodRawShape>`. The SDK documents the raw-shape overload as **deprecated**,
  directing users to pass a complete schema object. Across 37 handlers whose safety story is
  boundary validation (S-8), typed args on the maintained path is the material difference. The
  raw shape does appear in the v1.29.0-tagged `docs/protocol.md`, but a form appearing in a prose
  example is not evidence it is the maintained one. Fixed at S12 because 37 tools is 37 chances
  to diverge.
- **D-P6. Vitest is confirmed as the runner** (D26 left it "plan-level confirmable"). Criterion
  was native ESM + TypeScript on Windows against a `"type": "module"` package — not mocking power,
  since D26's seams are constructor-injected and explicitly *not* module-level monkey-patching.
- **D-P7. `README.md` is added to the doc-sync set despite being absent from
  `find_related_docs`' output.** The tool matches on code-file path references; README names no
  `src/` path, so it was invisible to the query while being the most user-facing document in the
  repo and the one carrying the `--allow-unauthenticated` advice. Caught by direct read.

## 11. Verification of factual claims

Every claim this plan depends on, with read-level evidence. Search results are cited only as
locators.

1. **The predecessor tree is exactly seven TypeScript files under `src/`.** Steps S1, S5.
   *Structural trace:* `codegraph_scan` (force, 2026-07-30T22:14:46Z) + `codegraph_list_files` —
   9 code files total: the 7 under `src/`, plus `docs/apsq.mjs` and `package.json`. 0 parse errors.
2. **`src/index.ts` mounts `POST /mcp` with no authentication.** Steps S1, S9, S22.
   *File read:* `src/index.ts:1–109` (whole file). Route at `:71`; the only middleware is
   `app.use(express.json())` at `:45`; no bearer, token, or auth check appears anywhere in the
   file. *Content absence, scope: the entire file, read in full.*
3. **The predecessor binds all interfaces and runs its HTTP listener in stdio mode too.**
   Steps S9, S22. *File read:* `src/index.ts:83` — `app.listen(port, …)` with no host argument,
   executed unconditionally; the `if (stdioMode)` branch is at `:101`, after it.
4. **`package.json` uses caret ranges and declares no test script or framework.** Steps S2, F-2.
   *File read:* `package.json:15–24` — `"^1.29.0"`, `"^5.2.1"`, `"^4.3.6"`; `scripts` at `:7–11`
   contains only `build`, `start`, `dev`.
5. **No test files exist anywhere in the repo.** Step S2, F-2. *Content absence:* `find` over the
   repo excluding `node_modules` for `*.test.ts`, `*.spec.ts`, `*_test.ts` → zero results;
   `grep` of `package.json` for `test`/`vitest`/`jest`/`mocha` → no match. *Scope: whole repo
   minus `node_modules`.*
6. **`clearTokens()` writes the literal `null` over the credential file, and the refresh path
   calls it on any non-OK response absent a sibling rotation.** Step S6. *File read:*
   `src/services/aps-auth.ts:38–41` (`writeFileSync(TOKEN_FILE, JSON.stringify(null), …)`) and
   `:110–121` (`if (!res.ok) { … clearTokens(); throw … }`).
7. **The stored credential currently contains `null`.** Risks R-1, step S15.
   *File read:* `~/.aps-fusion-mcp/tokens.json` — contents are the four characters `null`.
   This is the observed consequence of claim 6.
8. **`isAuthenticated()` reports token presence, not validity.** Step S6, tool 1.
   *File read:* `src/services/aps-auth.ts:145–147` — `return currentTokens() !== null`.
9. **The predecessor's authorization request carries neither PKCE nor `state`.** Step S22 (D9).
   *File read:* `src/services/aps-auth.ts:51–59` — params are exactly `response_type`,
   `client_id`, `redirect_uri`, `scope`.
10. **No outbound call in the predecessor carries a timeout.** Step S8.
    *File read:* `src/services/aps-auth.ts:69–73`, `:105–109`; `src/services/aps-client.ts:5`,
    `:12–18`, `:27–31` — five `fetch` calls, none passing `signal` or any timeout option.
    *Content absence, scope: all five call sites, each read.*
11. **`aps-client.ts` accepts an arbitrary URL with no allowlist and casts responses.** Step S8,
    S13. *File read:* `src/services/aps-client.ts:3–19` (`url: string` used directly) and `:33`
    (`as { data?: unknown; errors?: unknown[] }`).
12. **Two divergent truncation implementations exist.** Step S7.
    *File read:* `src/tools/mfg-data-model.ts:30–33` (`truncateIfNeeded`) and
    `src/tools/model-derivative.ts:9–11` (`truncate`), both over `CHARACTER_LIMIT` from
    `src/constants.ts:28`.
13. **One GraphQL handler interpolates with bare quotes; 25 interpolation sites exist in that
    file.** Step S13. *File read:* `src/tools/mfg-data-model.ts:590` —
    `componentVersion(componentVersionId: "${component_version_id}")`. *Locator:* `grep -c '\${'`
    on the same file → 25.
14. **A `readOnlyHint: true` tool issues `generate: true`.** Step S12.
    *File read:* `src/tools/mfg-data-model.ts:480` (`readOnlyHint: true`) and `:497`
    (`derivatives(derivativeInput: { outputFormat: STEP, generate: true })`) — same tool
    registration.
15. **`src/constants.ts` records the MFG v2 deprecation, the v3 path, and `ComponentVersion`
    removal.** Step S13 (D5). *File read:* `src/constants.ts:6–12`.
16. **`urnToBase64` implements the base64url derivation.** Step S15 (D27).
    *File read:* `src/services/aps-client.ts:38–40`.
17. **`README.md` documents `--allow-unauthenticated` and an in-memory token model.** Step S25.
    *File read:* `README.md:53` and `README.md:162`.
18. **`README.md` is absent from `find_related_docs`' output.** Decision D-P7, step S25.
    *Structural trace:* `codegraph_find_related_docs` over the eight changed files returned 18
    docs (`totalDocsToReview: 18`); `README.md` is not among them. Cross-checked by reading
    `README.md` directly.
19. **18 docs reference the changed code files; 8 are review rounds and 6 are prior-session
    artifacts.** Step S25, decision D-P4. *Structural trace:* the same
    `codegraph_find_related_docs` result, enumerated.
20. **`src/index.ts` has zero dependents; the deletion set is self-contained.** Step S1.
    *Structural trace:* `codegraph_get_stats` `mostDependedOn` — `src/index.ts` count 0; every
    other listed file's dependents lie within the seven-file set.
21. **The SDK's `registerTool` config accepts `inputSchema`, `outputSchema`, `annotations`.**
    Steps S11, S12. *Documentation read:* Context7 `/modelcontextprotocol/typescript-sdk/v1.29.0`,
    `packages/server/src/server/mcp.ts` signature block, 2026-07-30.
22. **`registerTool` accepts both a `z.object` schema and a raw zod shape, but they are not
    equivalent: the primary generic overload takes `InputArgs extends StandardSchemaWithJSON`
    with `cb: ToolCallback<InputArgs>` (handler args inferred via
    `StandardSchemaWithJSON.InferOutput`), while a raw shape is normalized by
    `normalizeRawShapeSchema` and pairs with `LegacyToolCallback<ZodRawShape>`.**
    Decision D-P5, step S12, and the S16–S21 schema convention. *Documentation read:* Context7
    `/modelcontextprotocol/typescript-sdk/v1.29.0`, `packages/server/src/server/mcp.ts` — the
    primary overload, the implementation signature (`inputSchema?: StandardSchemaWithJSON |
    ZodRawShape`; `cb: ToolCallback<…> | LegacyToolCallback<ZodRawShape>`), and the
    `ToolCallback`/`BaseToolCallback` type definitions, 2026-07-30. The raw shape also appears in
    the tagged `docs/server.md`; that is a prose example, not the maintained-path signal.
23. **`destructiveHint` defaults to `true`; `idempotentHint` to `false`; `openWorldHint` to
    `true`; `readOnlyHint` to `false`.** Step S12. *Documentation read:* Context7 same library,
    `packages/core/src/schemas.ts` `ToolAnnotationsSchema` with per-field documented defaults,
    2026-07-30.
24. **zod v4 documents `.extend()` and object shape-spread for composition, and
    `z.discriminatedUnion(key, [branches])`.** Steps S3, S7. *Documentation read:* Context7
    `/colinhacks/zod` — `packages/docs/content/api.mdx` for both composition forms;
    `discriminatedUnion` signature per the same library's reference. 2026-07-30.
25. **pino supports `pino.destination(2)` for stderr, a file-path destination, and
    `redact` with `paths`/`censor`/`remove`.** Step S4. *Documentation read:* Context7
    `/pinojs/pino` — `docs/api.md` destination section and `docs/redaction.md`, 2026-07-30.
26. **Vitest runs a `node` environment by default, takes `include` patterns for the test tree, and
    provides fake-timer control adequate for the AC-19 backoff-spacing assertions.** Step S2,
    decision D-P6, and test specs T-10/T-13/T-14 which depend on timer control.
    *Documentation read:* Context7 `/vitest-dev/vitest` — `docs/guide/cli-generated.md`
    (`--environment … (Default: node)`; `--testTimeout`, `--retry.count`, `--sequence.*`),
    `docs/config/include.md` (per-project `include` patterns), and `docs/api/vi.md`
    (`vi.setTimerTickMode(mode)`, available from Vitest 4.1.0), 2026-07-30. Library resolved to
    `/vitest-dev/vitest` (versions `v3_2_4`, `v4.0.7`, `v4.1.6`) — the resolution located the
    library; the pages above are the evidence.
27. **The project has no `docs/plans/` directory prior to this plan.** *File read:* `ls -d
    docs/plans` → absent; this document creates it.
28. **The external dependency set in source is SDK, zod, express plus node builtins.** Step S2.
    *Structural trace:* `codegraph_list_external_dependencies` — 9 entries, of which
    `fs`/`node:fs`, `os`/`node:os`, `path`/`node:path` are builtin pairs.
29. **`express.json()`'s `limit` option defaults to `'100kb'`, and `express.raw()` yields a
    Buffer body.** Step S22 (the `HTTP_MAX_BODY_BYTES` derivation) and step S23 (the raw-body
    HMAC input). *Documentation read:* Context7 `/expressjs/express` —
    `_autodocs/06-types-and-configuration.md` (`limit … Default: '100kb'`) and
    `_autodocs/07-middleware-and-routing.md` (`express.raw()` → `req.body` is a Buffer),
    2026-07-30.

30. **`package.json:6` names `dist/index.js` as `main`.** Step S1 — why a stale `dist/` is a
    runnable wrong server. *File read:* `package.json:6`.
31. **`package.json:5` declares `"type": "module"`.** Step S2 — the ESM constraint behind the
    runner choice. *File read:* `package.json:5`.
32. **The predecessor's `env()` helper throws at call time, mid-tool, rather than at startup.**
    Step S3 — the failure mode config validation replaces. *File read:*
    `src/services/aps-auth.ts:45–49`.
33. **The predecessor writes the credential file with `{ mode: 0o600 }`.** Step S5 — the inert
    mode bit spec S-5 names. *File read:* `src/services/aps-auth.ts:31` (the `persistTokens`
    write; an identical literal appears at `:40` inside `clearTokens`).

**External API facts asserted by the tool contracts.** Each verified against the introspected
schema on disk (`docs/aps-mfg-schema.json`, the spec's [APS-SCHEMA] authority) by parsing the
introspection and reading the named type, 2026-07-30.

34. **`ItemFilterInput` exposes exactly two fields, `name` and `itemType` — no date filter.**
    Steps S13 (tool 6's name-filter search) and S14 (why polling is DM-side, not MFG-side).
    *Schema read:* `ItemFilterInput.inputFields` → `['name', 'itemType']`.
35. **`itemsByFolder` takes `hubId` and `folderId` and accepts no project id.** Step S16, tool 5's
    input contract. *Schema read:* `Query.itemsByFolder.args` →
    `['hubId', 'folderId', 'filter', 'pagination']`.
36. **Tool 4's two branches match real queries:** `foldersByProject(projectId, …)` and
    `foldersByFolderInHub(hubId, folderId, …)` — the by-parent branch genuinely requires the hub
    id, which is why the input carries it. Step S16. *Schema read:* `Query.foldersByProject.args`
    → `['projectId', 'filter', 'pagination']`; `Query.foldersByFolderInHub.args` →
    `['hubId', 'folderId', 'filter', 'pagination']`.
37. **`itemVersions(hubId, itemId, pagination)` exists and backs tool 35.** Step S16.
    *Schema read:* `Query.itemVersions.args` → `['hubId', 'itemId', 'pagination']`.
38. **`Query.item` accepts a `composition` argument, and takes `hubId` (not `projectId`).**
    Step S17, tool 7's composition selection (R-READ-6) and its `{item_id, hub_id}` branch.
    *Schema read:* `Query.item.args` →
    `['hubId', 'itemId', 'time', 'composition', 'resolution']`. Note: the schema is the spec's
    authority over documentation prose ([APS-SCHEMA], spec §9.2), and it says `hubId`.
39. **The `Item` interface carries exactly twelve fields** — `createdBy, createdOn,
    extensionType, hub, id, lastModifiedBy, lastModifiedOn, mimeType, name, parentFolder,
    project, size` — which bounds what tool 5 may return at interface level. Step S16.
    *Schema read:* `Item.fields`.
40. **`Item` has exactly four concrete types — `BasicItem`, `ConfiguredDesignItem`, `DesignItem`,
    `DrawingItem` — all four carry `tipVersion`, and only `DesignItem` carries
    `tipRootComponentVersion`.** Steps S16 (tool 5's inline fragments on all four; tool 6's
    per-type match typing) and S17 (tool 7's branch structure). *Schema read:*
    `Item.possibleTypes`, then each type's `fields`.
41. **`ComponentVersion` carries `partNumber` but neither `versionNumber` nor `createdOn`.**
    Step S17 — this is why tool 7's componentVersion branch reaches version data via
    `designItemVersion`, falling back to `configuredDesignItemVersion`. *Schema read:*
    `ComponentVersion.fields`.

## 12. Test specifications

Every test names its behavior, level, real/double boundary, data source, and failure condition.
Doubles are named by Meszaros kind. Techniques per ISO/IEC/IEEE 29119-4:2021.

**T-1 — config parses each serving mode.** *Behavior:* a valid env set for `stdio`, `hosted`, and
`both` each yields a typed config with that branch's keys (S3, R-OPS-2). *Level:* unit — pure
function of an env map. *Real/double:* config module real; the env map is an ordinary object
parameter, no double. *Data:* three hand-written env fixtures representing realistic deployments.
*Must NOT assert:* that zod was called. *Fails when:* a branch accepts a config missing a
required key, or rejects a valid one. *Technique:* equivalence partitioning over the three modes.

**T-2 — each cross-key startup assertion fires.** *Behavior:* the four D21 assertions each reject
their violating config with a message naming the key (S3, R-REL-6). *Level:* unit. *Real/double:*
none. *Data:* four minimal violating configs, one per assertion, derived forward from the
assertion definitions — notably a `hosted` config with `MCP_AUTH_TOKEN` absent, which must refuse
to start. *Must NOT assert:* exact message text. *Fails when:* any violating config is accepted.
*Technique:* boundary value analysis (each assertion tested at and just past its boundary).

**T-3 — stdio stdout purity and log redaction.** *Behavior:* in stdio mode no diagnostic reaches
stdout, and no logged line contains a token or the webhook secret (S4, R-PROTO-2, R-OPS-1, S-5).
*Level:* unit. *Real/double:* pino real, writing to a captured stream — the stream is a **fake**
(a working in-memory writable implementing the same contract), justified because asserting on
process stdout would couple the test to the runner's own output. *Data:* a log record containing
a synthetic token-shaped value in each redacted path. *Must NOT assert:* that `redact` was
configured (that is interaction testing) — assert the emitted bytes. *Fails when:* a secret
appears in output, or any byte reaches stdout under stdio mode. *Technique:* equivalence partitioning over destination modes (stdio vs HTTP) crossed with redacted vs non-redacted fields.

**T-4 — state writes are atomic under induced mid-write failure.** *Behavior:* a failure injected
between temp-write and rename leaves the prior file intact and uncorrupted (S5, R-REL-7).
*Level:* integration — the real filesystem is the boundary under test. *Real/double:* real fs on
a temp directory; the failure is induced through the D26 fs hook (a **spy** that throws on the
nth call), justified because the crash point cannot otherwise be placed deterministically.
*Data:* a realistic state file written through the module's own accessor, then a second write
interrupted. *Must NOT assert:* that rename was called. *Fails when:* the prior file is truncated,
absent, or partially written. *Technique:* state-transition testing over write phases.

**T-5 — credential directory ACL is verified at startup.** *Behavior:* startup refuses to serve
with an actionable message when the directory lacks owner-only restriction (S5, S-5, AC-14).
*Level:* integration — real OS ACL semantics are the subject. *Real/double:* real filesystem and
real `icacls`/chmod; no double (doubling the ACL would double the subject). *Data:* a temp
directory created with and without the restriction. *Must NOT assert:* the icacls command string.
*Fails when:* an unrestricted directory is accepted. *Technique:* decision table over (platform, restriction present/absent) — the two OS branches are separate rules, not one.

**T-6 — a transient refresh failure leaves the credential intact.** *Behavior:* network error,
429, and 5xx each leave the stored credential byte-identical and return a retryable error (S6,
R-REL-2, AC-11). *Level:* unit with real fs. *Real/double:* TokenManager real; `fetch` is a
**stub** returning each failure class, justified as a true network boundary; real temp-dir fs.
*Data:* a realistic stored credential fixture. *Must NOT assert:* that fetch was called — assert
the file's bytes before and after. *Fails when:* the credential changes or the error is
non-retryable. *Technique:* equivalence partitioning over failure classes.

**T-7 — `invalid_scope` and `invalid_grant` classify distinctly and destroy nothing.**
*Behavior:* each yields its specific `reauth-required` state with the credential file intact (S6,
R-REL-3). *Level:* unit. *Real/double:* as T-6. *Data:* the two documented APS error bodies.
*Must NOT assert:* internal branch taken. *Fails when:* either deletes or nulls the file, or the
two states are indistinguishable. *Technique:* decision table over (status, error code).

**T-8 — AC-25 crash between rotation and durable persist.** *Behavior:* a crash induced after the
refresh response is received but before the atomic rename yields, on restart, an explicit
`reauth-required(rotation-lost)` naming rotation loss, with the credential file intact and the
re-auth path reported by both the auth-state tool and the health signal (S6, R-REL-7).
*Level:* integration. *Real/double:* real fs on a temp dir; `fetch` a **stub** returning a valid
rotated pair; the crash induced via the fs **spy** at the rename boundary. *Data:* a realistic
pre-rotation credential plus a realistic rotation response.

**Two trip points, because AC-25 asserts two distinct properties.** *Trip point 1 — after the
atomic rename:* the ordinary crash case above. *Trip point 2 — after the durable byte-write but
BEFORE the parse:* this is the observation for AC-25's "writes the response bytes durably before
parsing" limb, which no other test covers. At restart, the raw response bytes are present on disk
and the live credential file is byte-unchanged from before the refresh. Both are **post-crash
filesystem state**, not journal internals — a journal internal would be a field this test reaches
into the module to read, whereas these are files any observer can stat — so this sits inside this
test's own Must-NOT-assert constraint rather than violating it.

*Must NOT assert:* journal internals; or the ordering directly (no instrumentation of the refresh
function's control flow) — the ordering is established by what survives the crash, not by watching
it happen. *Fails when:* restart reports `ok`; reports an ambiguous state; the credential file is
missing or nulled; **or, at trip point 2, no durable raw-response bytes exist on disk — which is
exactly what a parse-then-write implementation leaves behind, and is therefore the falsifying
observation for the write-before-parse limb.** *Technique:* state-transition over the rotation
phases, with the two trip points as the transitions under test.

**T-9 — AC-25 concurrent refresh race.** *Behavior:* two refreshes racing on the shared credential
leave a usable credential; at most one rotation wins and the loser adopts rather than bricking
(S6, R-REL-7). *Level:* integration. *Real/double:* two real TokenManager instances over one real
temp-dir credential file (the cross-process lock is the subject and must not be doubled);
`fetch` a **stub** that rotates once and returns `invalid_grant` to the second caller — the
observed live behavior. *Data:* one realistic credential. *Must NOT assert:* lock-file internals.
*Fails when:* the file ends unusable or both callers rotate. *Technique:* state-transition testing over the rotation race — the two callers' interleavings are the transitions under test.

**T-10 — refreshes are demand-driven, not opportunistic.** *Behavior:* with an access token
outside `TOKEN_RENEWAL_THRESHOLD_MS` of expiry, no refresh request is issued (S6, R-REL-7,
AC-25). *Level:* unit. *Real/double:* injected **stub** clock; `fetch` a **spy** asserting zero
calls — this is the narrow interaction-is-the-behavior case, since "no request was made" has no
state to observe. *Data:* credentials at, just inside, and just outside the threshold.
*Must NOT assert:* anything else about fetch. *Fails when:* a refresh is issued outside the
window. *Technique:* boundary value analysis on the threshold.

**T-11 — one bounding mechanism, both output kinds.** *Behavior:* an oversized structured list and
an oversized text rendering are each bounded, each carrying an explicit truncation indicator
(S7, R-REL-5, AC-20). *Level:* unit. *Real/double:* none. *Data:* generated payloads just over
each limit. *Must NOT assert:* internal helper identity. *Fails when:* either output exceeds its
bound or omits the indicator. *Technique:* boundary value analysis.

**T-12 — AC-26 external content is neutralized.** *Behavior:* a design name, custom-property
value, and foreign-CAD field each carrying injection-shaped text are returned such that the
content cannot act as an instruction — carried as data, control characters stripped, marked
untrusted (S7, S-13). *Level:* unit. *Real/double:* none. *Data:* injection-shaped strings
(instruction-like prose, embedded control characters, delimiter-breaking sequences) written
forward from the threat, not backward from the assertion. *Must NOT assert:* an exact escaped
string. *Fails when:* returned text places external content where an agent would read it as
instruction. *Technique:* error guessing over known injection shapes, plus equivalence
partitioning across the three field sources.

**T-13 — AC-11 outbound timeout.** *Behavior:* a request to a non-responding endpoint aborts at
the configured timeout and returns a `transient` error rather than awaiting indefinitely (S8,
R-REL-1). *Level:* unit. *Real/double:* injected **fake** fetch that never settles; injected
clock. *Data:* the configured default timeout. *Must NOT assert:* AbortSignal internals.
*Fails when:* the call outlives the timeout. *Technique:* boundary value analysis on the timeout — just under, at, and past the configured bound.

**T-14 — AC-19 bounded backoff with observed spacing.** *Behavior:* a `safe` request against
repeated 429/5xx retries at most 3 attempts with exponential backoff plus jitter, honoring
`Retry-After`, each wait capped at 10 s (S8, R-REL-4). *Level:* unit. *Real/double:* injected
**stub** fetch returning failures; fake timers. *Data:* failure sequences with and without
`Retry-After`. *Must NOT assert:* exact jittered values — assert attempt count and that each
wait lies within its bound. *Fails when:* attempts exceed 3 or any wait exceeds the ceiling.
*Technique:* boundary value analysis on attempt count and wait ceiling.

**T-15 — non-safe operations are never retried.** *Behavior:* a request tagged `safe: false`
failing with 429 is not retried (S8, R-REL-4, C2 hazard). *Level:* unit. *Real/double:*
**spy** fetch counting calls — interaction-is-the-behavior, as "was not re-sent" has no state.
*Data:* one mutation-shaped request, one refresh-shaped request. *Must NOT assert:* anything
beyond the call count. *Fails when:* call count exceeds 1. *Technique:* equivalence partitioning over the unsafe operation classes (GraphQL mutation, REST POST/PATCH/DELETE, token-refresh POST, billable generate-on-a-Query).

**T-16 — AC-23 egress allowlist.** *Behavior:* requests to loopback, link-local, private-range,
literal-IP, non-https, and label-boundary-violating suffix hosts are refused **before** any
outbound call; a redirect hop to such a host is refused at the hop (S8, S-10). *Level:* unit.
*Real/double:* **spy** fetch asserting zero dispatch for refused cases; a **stub** returning a
307 to a disallowed host for the redirect case. *Data:* a table of hosts including
`evil-s3.amazonaws.com.attacker.net` and `notreallys3.amazonaws.com` against a
`.s3.amazonaws.com` suffix rule. *Must NOT assert:* allowlist internals. *Fails when:* any
refused case dispatches. *Technique:* decision table over (scheme, host form, redirect depth).

**T-17 — AC-24 spend cap refuses without spending.** *Behavior:* a call exceeding the configured
per-category daily cap is refused with a `budget` error naming cap, count, and config key, and
**no APS request is issued**; the counter survives a restart (S8, S-11). *Level:* integration —
counter persistence is part of the behavior. *Real/double:* real state store on a temp dir;
**spy** fetch asserting zero dispatch. *Data:* counters seeded at the cap via the store's own
accessor. *Must NOT assert:* counter file format. *Fails when:* a request dispatches or the
counter resets across restart. *Technique:* boundary value analysis at cap−1, cap, cap+1.

**T-18 — a billable retryable request does not typecheck.** *Behavior:* `{ safe: true,
cost: 'md-translate' }` is a compile error (S8, D18). *Level:* unit (type-level). *Real/double:*
none — this is a `tsc` assertion via an expect-error fixture. *Data:* the four cost values × two
safe values. *Must NOT assert:* runtime behavior. *Fails when:* the combination compiles.
*Technique:* decision table over the tag pair.

**T-19 / T-20 — bearer gate and Origin rule.** *Behavior:* absent, malformed, and wrong secrets
each 401 with `WWW-Authenticate`; a correct secret passes (T-19). A present disallowed Origin
403s; an absent or empty Origin passes; the allowlisted Origin passes (T-20) (S9, S-1, S-4,
AC-13). *Level:* integration — the Express middleware chain is the subject. *Real/double:* real
Express app with the real middleware; no double. *Data:* a generated 256-bit secret and a table of
Origin header states. *Must NOT assert:* `timingSafeEqual` was called. *Fails when:* any
unauthenticated request reaches the transport, or an absent Origin is rejected. *Technique:*
equivalence partitioning over header states.

**T-21 — error taxonomy.** *Behavior:* each of the five classes renders with class, actionable
message, and retryable flag as an `isError` result; an unexpected throw becomes an `isError`
result rather than a protocol error (S10, R-PROTO-3, AC-10). *Level:* unit. *Real/double:* none.
*Data:* one representative failure per class. *Must NOT assert:* message wording. *Fails when:*
any class escapes as a thrown/protocol error. *Technique:* equivalence partitioning over classes.

**T-22 — the registration wrapper is the only registration path.** *Behavior:* a tool registered
through `registerGuardedTool` has its output guarded; and no direct `server.registerTool` call
exists outside the composition root (S11, D19). *Level:* unit plus a static assertion. *Real/
double:* real guard, real McpServer. *Data:* a tool returning oversized unguarded content.
*Must NOT assert:* wrapper internals. *Fails when:* output arrives unguarded or a direct
registration exists elsewhere. *Technique:* error guessing over registration bypass routes (direct `registerTool`, a handler returning unguarded content), supplemented by a static sweep for the direct-call pattern.

**T-23 — AC-16 annotation matrix diff.** *Behavior:* every tool's emitted annotations equal D14's
matrix for its effect class, with `destructiveHint` and `idempotentHint` set explicitly on all 11
W-class tools (S12, R-PROTO-4). *Level:* integration — asserts against real `tools/list` output.
*Real/double:* real server, real registration; no double. *Data:* the matrix as an independent
table written from D14, not read from the code. *Must NOT assert:* by re-reading the same
constants the code uses (that would be a logic mirror). *Fails when:* any tool's annotations
differ from the independent table. *Technique:* decision table, one column per tool.

**T-24 / T-25 / T-26 — MFG gateway.** T-24: zero `${` inside catalog document strings (static
assertion over the module source). T-25: AC-15 — an argument containing a quote, brace, or
newline produces the same request structure as a benign argument and no error divergence across
handlers. T-26: D7 window quantities from successive resumed calls sum exactly to the
single-pass total. *Level:* T-24 static; T-25 unit with a **spy** fetch capturing the emitted
body — justified because the assertion is about the bytes leaving the process, which no state
inside it exposes; T-26 unit with a **fake** paginated occurrence source implementing the cursor contract —
justified because the behavior under test is the gateway's window aggregation, and a live account
cannot be made to hold a deterministic multi-page occurrence set.
*Data:* T-24 the catalog module's own source text; T-25 a metacharacter table; T-26 a realistic
multi-page occurrence set with repeated component versions.
*Must NOT assert:* T-24 must not assert on any runtime behavior — it is a static property of the
source, and asserting a query executes correctly would not establish absence of interpolation;
T-25 must not assert on escaping internals — assert the emitted document is byte-identical and
the value travels in `variables`; T-26 must not assert on the fake's internals — assert the summed
per-line quantities against the single-pass total.
*Fails when:* T-24 any `${` occurs inside a catalog document string; T-25 structure differs
between the metacharacter and benign arguments, or handlers diverge; T-26 sums diverge.
*Technique:* T-24 exhaustive static enumeration over every document string in the catalog module
(the population is finite and fully enumerable, so sampling would be the wrong instrument);
T-25 error guessing over metacharacters; T-26 equivalence partitioning over page boundaries.

**T-27 / T-28 — polling.** T-27: the returned marker equals the maximum observed
Autodesk-stamped time and never the local clock. T-28: a poll truncated at
`DM_POLL_MAX_FOLDERS` returns a resume position that, when passed back, yields the remaining
changes with no loss and no duplicate report. *Level:* unit with a **fake** DM source implementing
the rollup and listing contracts — justified because the marker boundary requires items stamped
at exact, controlled times, which the live account cannot be made to produce on demand. *Data:* a folder tree with known modification stamps including
one exactly at the marker. *Must NOT assert:* fake internals. *Fails when:* the marker is
clock-derived, or a change is lost or double-reported across the resume. *Technique:* boundary
value analysis at the inclusive marker boundary.

**T-29 / T-30 — MD URN contract.** T-29: the `version_id` and `derivative_urn` grammars reject
`..` segments, `?`, `#`, `\`, and control characters. T-30: a `derivative_urn` whose `<source>`
segment does not equal the gateway's independently recomputed value from `version_id` is
rejected. *Level:* unit. *Real/double:* none. *Data:* a table of malformed URNs written forward
from the grammar. *Must NOT assert:* regex text. *Fails when:* any malformed value is accepted.
*Technique:* boundary value analysis plus error guessing.

**T-31 — per-module tool contract conformance.** *Behavior:* for each of the seven modules, every
tool appears in `tools/list` with the input schema, output schema, and annotations the inventory
row specifies (S16–S21, R-PROTO-5/6). *Level:* integration against real `tools/list`.
*Real/double:* real server; gateways replaced by **fakes** implementing the same domain-typed
interfaces, justified because the contract under test is the tool surface, not Autodesk.
*Data:* the inventory table transcribed independently. *Must NOT assert:* handler internals.
*Fails when:* count ≠ 37 or any contract differs. *Technique:* decision table, one column per tool.

**T-32 / T-33 / T-34 — transport wiring.** T-32: an unauthenticated request with an invalid
Origin receives 401, not 403 (the stated precedence). T-33: a body over
`HTTP_MAX_BODY_BYTES` receives 413 before any handler or SpendGuard work. T-34: `serverInfo`
carries the `package.json` version in both stdio and HTTP transports. *Level:* integration, real
Express + real transport. *Data:* a body just over the limit; a version fixture.
*Must NOT assert:* middleware identity. *Fails when:* precedence inverts, an oversized body
reaches a handler, or either transport omits the version. *Technique:* decision table over
(authenticated, Origin valid/invalid/absent, body under/over limit) — one case per rule column.

**T-35 / T-36 — webhook route.** T-35: a correctly signed callback is accepted; invalid and
absent signatures are 403'd; a callback matching no active secret is 403'd. T-36: AC-9 — a
byte-identical replay of a previously accepted callback produces no repeated action. *Level:*
integration — the raw-body path and HMAC are the subject and are not doubled. *Real/double:* real
Express with `express.raw`, real crypto, real state store on a temp dir. *Data:* payload bytes
plus a signature computed independently of the verification code (an independent HMAC in the
test, not the module's own function — otherwise it is a logic mirror). *Must NOT assert:* that
`timingSafeEqual` was called. *Fails when:* an unsigned or wrongly-signed callback is accepted, or
a replay appends a second journal entry. *Technique:* equivalence partitioning over signature
states (valid / wrong-secret / malformed / absent / matching-no-active-secret), plus
state-transition testing for the first-delivery→replay sequence.

### Acceptance suite — AC-1..AC-27 (executed at S26)

The 27 acceptance tests share four of the five fields, stated once here because they are
genuinely common to the suite; the fifth (behavior verified / failure condition) is per
criterion and is the spec's own AC text, which is already written in observable terms.

- **Behavior verified.** One acceptance test per spec §12 criterion, one-to-one. Each verifies
  the criterion **as the spec words it**, in the spec's observable terms (inputs, outputs, state)
  — not in implementation terms. The trace is criterion ID ↔ test ID, recorded in the table below,
  so coverage is auditable as a reconciliation rather than an impression *(ISO/IEC/IEEE 29148
  testable-and-traceable; testing-standards §Acceptance Tests)*.
- **Test level.** Acceptance, against the fully assembled server driven by a real MCP client —
  real transport, real gateways, real Autodesk, real credential store.
- **The real/double boundary.** **Real by default, and the subject is never doubled.** Twenty-two
  criteria run entirely real against the owner's live account. Five cannot be triggered on demand
  against a live third party and run against the **D26 injected seams** — this is the plan's one
  systematic double in the acceptance suite and it is justified per criterion, not blanket:

  | Criterion | Double | Kind | Why the real dependency is infeasible |
  |---|---|---|---|
  | AC-11 (timeout, transient survival) | injected `fetch` | stub | Autodesk cannot be made to emit a 429/5xx or hang on demand |
  | AC-19 (bounded backoff, observed spacing) | injected `fetch` + fake timers | stub | requires induced repeated failure and measurable wait spacing |
  | AC-21 (recoverable error does not kill the process) | injected `fetch` | stub | requires an induced tool-call failure |
  | AC-23 (SSRF refusals) | injected `fetch` as call-counter | spy | the assertion is that **no** request is dispatched — there is no state to observe |
  | AC-25 (crash between rotation and persist) | injected fs hook | spy | the crash point cannot be placed deterministically any other way |

  Autodesk itself is **never** doubled for the twenty-two live criteria; doubling it there would
  verify the double, not the server.
- **The data.** The owner's real account: real hubs, projects, folders, designs, and a known
  test design with a shared sub-component (for AC-4's where-used). Fixtures for the five seam-run
  criteria are written forward from the failure being induced — an actual APS `invalid_scope`
  body, an actual 429 with `Retry-After` — never shaped backward from the assertion.
- **What the suite must NOT assert.** That a call "returned data" or "200 OK"; that a double was
  invoked (except AC-23, where non-dispatch *is* the contracted behavior and no
  state exists; AC-24 runs live and observes absence at Autodesk per spec AC-6); or any criterion by re-reading the plan or the code rather than observing the running
  system. **A criterion is failed, not passed, when its evidence is a document.**

| AC | Verifies | Runs | Fails when |
|---|---|---|---|
| AC-1 | hubs→projects→folders→items→versions list correctly and paginate; folder traversal uses the schema's navigation fields | live | any level returns wrong or silently truncated results |
| AC-2 | a known design is found by name with usable hub/project/item and root-component ids | live | the design is missed, or ids are unusable downstream |
| AC-3 | metadata incl. part number/material/revision; full assembly with per-line ids/part-numbers/materials/quantities; physical properties with units; composition returns released ≠ working | live | any line lacks its data, or composition does not distinguish revisions |
| AC-4 | where-used returns containing assemblies; custom properties, drawings, thumbnail, Fusion URL return where present | live | a known container is missing |
| AC-5 | custom property visible on re-read; folder create/rename/move/**copy**/delete round-trips; design-from-file is found on re-read; write tools annotated non-read-only and destructive where they overwrite | live | any leg fails, or an annotation misdescribes effect |
| AC-6 | STEP/STL/OBJ retrieval yields a downloadable artifact; **a status-only read creates no derivative job**; submit/status/retrieve are distinct | live | a status read causes a job to appear |
| AC-7 | translation to an additional MD format completes and is retrievable; a non-Fusion file translates and its object tree / per-object properties are retrievable | live | either path fails end-to-end |
| AC-8 | activities enumerate with declared inputs; a WorkItem against a discovered activity runs, reports status, returns outputs; no activity definition is embedded; submit is annotated cost-incurring | live | discovery, run, or output retrieval fails |
| AC-9 | webhook registers and deletes; valid signature accepted, invalid/absent rejected; **byte-identical replay causes no repeated action**; polling reports an out-of-band change | live | a replay acts twice, or polling misses the change |
| AC-10 | `tools/list` matches the implemented set; initialize negotiates 2025-11-25; a forced failure returns `isError:true`; annotations match behavior; a sampled input schema declares types/enums/required; data tools return conforming `structuredContent` | live | any mismatch |
| AC-11 | outbound call bounded by its timeout; transient failure leaves the credential intact and returns retryable; scope-subset surfaces re-auth without wiping | seam | the credential changes, or the call outlives its timeout |
| AC-12 | stdio stdout carries only protocol; per-call log with name/args/outcome/timing and no secret; config read once at startup; documented Windows procedure works from a clean checkout; health signal responds | live | a diagnostic reaches stdout, or a secret appears in a log |
| AC-13 | unauthenticated or session-only-authenticated request rejected **on every request**; invalid Origin 403s; no unauthenticated MCP surface in any mode | live | any request reaches the transport ungated |
| AC-14 | no tool result or log contains tokens or the webhook secret; no caller path obtains the Autodesk credential; the store carries real host-level restriction | live | any leak, or an unrestricted store |
| AC-15 | a metacharacter-bearing argument does not alter request structure and does not diverge across handlers; malformed arguments rejected at the boundary | live | structure changes, or handlers differ |
| AC-16 | every metered tool is identifiable as cost-incurring from contract and annotations alone | live | a billable tool reads as free |
| AC-17 | a listing exceeding one page says so explicitly | live | truncation is silent |
| AC-18 | auth state reports "authenticated" only when the credential is actually usable, confirmed by a live probe | live | a stored-but-dead token reads as authenticated |
| AC-19 | retries bounded and backed off with observed count and spacing; non-idempotent operations not retried | seam | attempts exceed the bound, or a mutation is re-sent |
| AC-20 | two different large-output tools truncate by the same mechanism, each with an explicit indicator | live | mechanisms differ, or an indicator is absent |
| AC-21 | invalid config exits with an actionable message; an induced recoverable error does not terminate the process | seam | the process dies on a tool-call failure |
| AC-22 | version reported over the protocol; dependencies pinned and lockfile present | live | version absent, or a range remains |
| AC-23 | a loopback/link-local/private-range/literal-IP target is refused **before any outbound request**; only expected schemes and hosts reachable | seam | any refused case dispatches |
| AC-24 | exceeding the configured bound is refused and **no billable job is submitted**; the limit holds on an automated path | **live** | a request is dispatched, the cap resets, or a derivative job appears at Autodesk |
| AC-25 | concurrent refreshes leave a usable credential; an induced crash between rotation and persistence yields `reauth-required` naming rotation loss, credential file intact, path reported by both the auth tool and health; refresh writes bytes before parsing (T-8 trip point 2) and only near expiry (T-10) | seam | the credential ends unusable; the state is ambiguous; **no durable raw-response bytes exist at trip point 2**; or a refresh is issued outside the renewal threshold |
| AC-26 | injection-shaped content in a name, property value, or imported-CAD field is returned neutralized | live | returned content can act as an instruction |
| AC-27 | the authorization request carries a PKCE S256 `code_challenge` and the exchange the matching verifier; a code without the correct verifier is rejected | live | a code exchanges without the verifier |

*Technique.* The suite as a whole is specification-based: each criterion is one rule of a decision
table whose completeness is checked by the spec's own §12 enumeration — 27 criteria, 27 tests,
no criterion without a test and no test without a criterion.

## 13. Risks

- **R-1 (blocking, owner-owned). The M-3 re-authentication is outstanding.** The stored credential
  contains the literal `null` (verified). Until the owner completes the browser login, no live APS
  call is possible: S15's probes cannot run and S26 cannot run. Phases 0–4, S13 and S14 are
  unaffected, which is why the plan is sequenced to put the maximum work ahead of this gate.
- **R-2. Limitation 8(b) may resolve false.** If MFG `ItemVersion.id` is not the DM version-URN
  form, `md-gateway` needs the id-derivation step the architecture does not currently specify.
  The plan pre-specifies the branch at S15, so the cost is one inserted function rather than a
  redesign — but it is real, and it is discovered only at the probe.
- **R-3. The hardest step is S6 (TokenManager).** It carries the only irreversible failure mode in
  the build: a defect can destroy the credential. Its blast radius is every tool, since every call
  needs a token. It is also the step whose acceptance criterion (AC-25) is hardest to stage,
  requiring an injected crash between two specific operations.
- **R-4. Coupling hotspots this plan touches.** From `codegraph_get_stats` on the predecessor,
  `aps-auth.ts` was the most-depended-on module (4 dependents) — its replacement, `token-manager`,
  inherits that centrality, and `aps-http` becomes a second hub since every gateway routes through
  it. A defect in either propagates everywhere, which is why each sits behind its own gate:
  `token-manager` behind Checkpoint C, `aps-http` behind Checkpoint A.
- **R-5. Assumption that may not hold: the tailnet topology is deployable as designed.** D1 pins
  Serve on ts.net 443 and Funnel on 8443 and forbids sharing a port. Validate early — at S25's
  documentation step, not at S26 — by running both commands on the target host and confirming the
  main surface stays tailnet-only.
- **R-6. Recoverability.** Every step before S26 is recoverable from git. The two genuinely
  irreversible actions in the whole plan are outside the code: the M-3 browser re-auth (recoverable
  only by repeating it) and any billable APS call made during S26 acceptance (money spent).
  AC-24's cap is configured before S26 runs for exactly that reason.

## 14. Question register

| # | Question | Arose | Bin | Disposition |
|---|---|---|---|---|
| Q-1 | The spec's `Status:` line reads "Draft for review" while HANDOFF records owner acceptance. | Step 1 | 1 (engineering) | **Closed.** No plan step reads the line and no build behavior turns on it; the plan is written against the spec's content, which both documents agree on. Recorded as an observation in §4. No plan step. |
| Q-2 | Which `registerTool` schema form should all 37 tools use — raw shape or `z.object`? | Step 4 | 1 (engineering) | **Closed: `z.object({...})`.** Both are accepted, but the raw shape is the SDK's deprecated compatibility path (`normalizeRawShapeSchema` → `LegacyToolCallback`), while `z.object` is the primary overload that infers handler arg types. Answered at Decision D-P5; evidence at §11 claim 22. |
| Q-3 | Which test runner, given D26 left it "plan-level confirmable"? | Step 4 | 1 | **Closed.** Vitest 4.x. Decision D-P6; evidence at §11 claim 26. |
| Q-4 | Do the 8(b)/8(c) probes block the whole build or only part of it? | Step 6 | 1 | **Closed.** Only `md-gateway`. Decision D-P2; sequencing at S15. |
| Q-5 | Should all 18 docs from `find_related_docs` be updated? | Step 8 | 1 | **Closed.** No — partitioned into rewrite/update/do-not-touch. Decision D-P4; spec M-4 is the standard. |
| Q-6 | Is `find_related_docs`' output complete for doc sync? | Step 8 | 1 | **Closed.** No — `README.md` was absent because it references no `src/` path. Caught by direct read. Decision D-P7; evidence at §11 claim 18. |
| Q-7 | Where do the acceptance-critical tests sit relative to the modules they constrain? | Step 9 | 1 | **Closed.** In the same step that builds the module, because D26's seams must be written in rather than retrofitted. Decision D-P3. |
| Q-8 | Should any requested scope be excluded, deferred, or phased? | Step 10 | 2 | **Closed — nothing proposed.** The full spec scope is planned; no exclusion was proposed to the owner and none is claimed. §2 states this. |
| Q-9 | Does deleting `src/` risk anything outside the seven files? | Step 2 | 1 | **Closed.** No — `src/index.ts` has zero dependents and all other dependents are inside the set. Evidence at §11 claim 20. S1 enumerates retained paths explicitly. |
| Q-10 | Is `destructiveHint` safe to leave unset on additive writes? | Step 4 | 1 | **Closed.** No — it defaults to `true`, so an unset additive write is annotated destructive, violating R-PROTO-4. Must be set explicitly. Evidence at §11 claim 23. |
| Q-11 | Which of Step 10's four checkpoint triggers have instances in this plan, and is each gated? | Sweep 5 | 1 | **Closed.** All four have instances; two were ungated — S6 (hard-to-reverse) and the registration half of the structural/behavioral boundary. Checkpoints C and D added. The full enumeration is in §9 so the class is checkable rather than asserted. |
| Q-12 | Does every one of the 37 tools have a gateway step that implements its backing operation? | Sweep 5 | 1 | **Closed.** Now yes. S13's scope said "tools 2–20 and 22", omitting tool 21 (`generate:true` derivative) and tool 35 (`itemVersions`) — both MFG-backed. Corrected to 2–22 and 35; a scripted check confirms zero uncovered tools. |
| Q-13 | Is `.env.example` created or modified, and who specifies its contents? | Sweep 5 | 1 | **Closed.** Modified — the file already exists (133 bytes). Moved out of §5's Created table; S25 now specifies that it must enumerate every key `config.ts` validates, grouped by serving mode, secrets empty with a generation hint. |
| Q-14 | Is Checkpoint A correctly scoped when it claims "chokepoints complete" but `registerGuardedTool` is built after it? | Sweep 5 | 1 | **Closed.** No. Split into Checkpoint A (egress, before any gateway calls out) and Checkpoint D (registration, before any tool registers), because gateways call out before tools register. |

**Reconciliation sweep.** Six passes. Passes 1–4 ran over the document as it stood before the
review rounds: pass 1 raised Q-6, Q-9, Q-10; pass 2 raised Q-7; passes 3 and 4 added nothing.

**Passes 5 and 6 were run after the review-driven changes**, because the earlier passes had
covered a document that no longer existed — three fix rounds and a full read had altered most
sections, and a sweep attesting to superseded content is not a completeness proof. Pass 5 was a
line-by-line read rather than a scan, on the finding that scans only surface what the reader
already suspects; it raised Q-11 through Q-14, every one of which was a real defect. Pass 6
re-ran the mechanical reconciliations — coverage table against step Sources, §5 against the step
set, §12 fields per test id, §9 gates against §7, tool-to-gateway coverage, and table integrity
across the document — and added zero entries.

**Zero entries are open.** Thirteen bin-1 entries carry answers with evidence pointers. The one
bin-2 entry (Q-8, scope) is closed by there being nothing to approve — no exclusion was proposed
and none is claimed.

## 15. Gaps acknowledged

- **G-1. Limitation 8(b) — MFG `ItemVersion.id` form — remains unverified at plan time.**
  *Attempted:* read the introspected schema (`docs/aps-mfg-schema.json`), which types the field
  only as `ID!` with no format information; read the architecture's Premise slot for D27 and its
  Limitation 8(b) text; confirmed the live client `docs/apsq.mjs` cannot run because
  `~/.aps-fusion-mcp/tokens.json` contains `null` (§11 claim 7). *Why outside reach:* it requires
  an authenticated live call, gated on the owner's M-3 re-auth. *What would resolve it:* the
  probe specified at S15, which is a plan step rather than a deferral.
- **G-2. Limitation 8(c) — whether `signedcookies` accepts a whole-value percent-encoded
  `derivative_urn` — remains unverified at plan time.** *Attempted:* the architecture's Context7
  reading of the MD v2 reference is recorded as two-sided (normative parameter definition says
  URL-encoded; worked invocations embed literal `/` and `:`); no further documentation resolves
  the ambiguity. *Why outside reach:* same credential gate. *What would resolve it:* the S15
  probe, with the fallback branch pre-specified.
- **G-3. The exact Autodesk signed-URL host patterns for the egress allowlist are not pinned.**
  *Attempted:* the architecture records them as pin-at-implementation from observed responses
  (Limitation 8(a)); no authoritative enumeration exists in the documentation read.
  *Why outside reach:* the hosts appear only in live signed-URL responses. *Mitigation, not
  deferral:* `EGRESS_ALLOW_HOSTS` makes this configuration rather than code, and S8's
  label-boundary suffix rule bounds what a widened entry can match.
- **G-4. Six external API/library facts are consumed from the architecture's citations rather
  than verified at plan time.** They are: Data Management `lastModifiedTimeRollup` semantics and
  the storage/signed-S3 pipeline (S14, from D12/D23); Model Derivative `properties:query`
  pagination, object-tree `objectid`/`level` narrowing, and the `signedcookies` response shape
  (S15, S19, from D15/D27); Design Automation `paginationToken` and the WorkItem argument model
  (S20, from D23 and spec §13 Q-3); Webhooks `pageState`/`next` paging and the callback
  envelope's top-level `resourceUrn` (S21, S23, from D11/D12); the SDK's deprecation of
  `allowedOrigins`/`enableDnsRebindingProtection` (S9, from D3); and zod's `.merge()`
  `unknownKeys` inheritance (S7, from D19).
  *Attempted:* each carries a dated Context7 citation in the architecture, which was read; the
  plan verified other SDK, zod, pino, express and vitest facts by direct Context7 read in the
  same session, so these were reachable and were not blocked — they were not re-derived.
  *Why this is a gap rather than a verified premise:* the expert-standard prior-artifact rule
  makes a claim in an upstream document a candidate, not a finding, and §11's evidence bar is a
  documentation read with library ID, section, version and date. A second-hand citation does not
  meet it. *What would resolve it:* a direct Context7 read per fact, promoted into §11.
  *Demonstrated consequence:* the zod item was checked and is weak — the `.merge()`
  `unknownKeys`-inheritance description appears in `packages/docs-v3/home.md`, the **v3**
  reference, while `package.json` pins zod `^4.3.6`. S7's conclusion stands on independent v4
  grounds (§11 claim 24 verified `.extend()` and shape-spread directly against the v4 API
  reference), so this is a weak premise under a sound decision — but it is exactly what this
  gap entry exists to surface.

Every other decision in this plan is grounded in a named standard from §3, and every factual
claim carries an entry in §11.

## 16. Post-completion

- Run the full acceptance record (S26) and file it as the ground-truth evidence per criterion.
- **Exported-surface check.** Run `codegraph_diff_surface` against the pre-implementation baseline
  (the empty `src/` tree after S1). Every added exported symbol must correspond to a module this
  plan specifies; any export the plan did not call for is an unplanned surface-change candidate to
  investigate, not to wave through.
- Re-run `codegraph_find_related_docs` over the final changed-file set and confirm the doc
  partition still holds — and re-check `README.md` by hand, since the tool cannot see it.
- **Follow-up work this plan creates, not in scope here:** authoring and registering the first
  Fusion Automation Activity and its TypeScript job program (R-AUTO-4, spec D-9); tuning the
  spend caps against Autodesk's published token pricing once MFG becomes priced on 2026-08-17
  (C4, Limitation 11); and revisiting encryption-at-rest for the credential store if a maintained,
  verifiable Node keychain binding appears (Limitation 1).
