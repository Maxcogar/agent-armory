# agent-armory — Project Lifecycle Coverage Map

> **Start here.** This answers: *"For a full project lifecycle, what slots do I need to
> fill, which tools in this repo fill them, which one do I grab, where do I have
> overlapping reinforcement, and what's missing that I'll have to build or find
> elsewhere?"*
>
> For the full per-tool detail (every skill/command/agent/hook/server described), see
> **[INVENTORY.md](./INVENTORY.md)** — section refs like `INV §4e` point into it.

---

## How to read this

**Two kinds of asset.** Setting up a project means populating a `.claude/` folder (or
equivalent) **and** standing up some infrastructure:

| Type | What | Where it goes |
|---|---|---|
| 🧩 **grab-and-drop** | skills, commands, agents, hooks | copy into `.claude/skills/`, `.claude/commands/`, `.claude/agents/`, + wire hooks in `.claude/settings.json` |
| ⚙️ **install-and-run** | MCP servers, middleware, the role harness | build/install once, reference from `.mcp.json` or run as a proxy/CLI |

**Coverage legend:** ✅ strong (grab it, ready to use) · 🟡 partial (works but project-specific, thin, or WIP — adapt before use) · 🔴 gap (nothing reusable here — build or source elsewhere) · 🧱 built-in (already in the Claude Code harness — don't grab, just use).

**Reinforcement.** Some concerns are enforced at several layers (frame → command → hook →
role → per-agent). Stacking them buys higher assurance. Those stacks are called out per slot
and collected in **§ Reinforcement stacks**.

---

## The lifecycle at a glance

```
SETUP ──▶ DEFINE ──▶ DESIGN ──▶ PLAN ──▶ BUILD ──▶ VERIFY ──▶ OPERATE ──▶ MAINTAIN
  │         (spec)    (arch)            (code)   (review)   (deploy)    (evolve)
  └────────────── cross-cutting: STANDARDS · GROUNDING · ORCHESTRATION · MEMORY · TRACKING ──────────────┘
```

This repo is **very strong** on the front half (setup → verify), the rigor/standards
cross-cutting layer, multi-agent orchestration, and codebase grounding. It is **thin-to-empty**
on **Operate** (deploy/observability beyond GCP-IoT) and on release/CI-CD/IaC/security-scanning
tooling. Details below.

---

## Master coverage table

| Lifecycle slot | Coverage | Grab this first | Alternatives / variants here | Reinforcement available |
|---|---|---|---|---|
| **Standards frame** (judge vs named standards) | ✅ | `expert-standard(s)` skill `INV §4a` | `/expert-review` cmd, `frontend-standards`, `Agent-Compliance-checklist` | 🔥 skill + command + hook + role + per-agent (see stacks) |
| **Codebase grounding** (know before you edit) | ✅ | codebase-rag MCP ⚙️ + codegraph MCP ⚙️ `INV §1A` | `codebase-recon`, `project-contractor`, `codebase-context-compiler` ⚙️ | 🔥 MCP×2 + skill + 3 hooks + middleware + pre-edit gate |
| **Project bootstrap / scaffold** | 🟡 | `Project-Template` (eng/R&D) `INV §4b` | `project-initializer`/BMAD (Windows, incomplete), AgentBoard `kickoff` | 🧱 `/init` (CLAUDE.md) |
| **DEFINE — spec / requirements** | ✅ | `/expert-spec` cmd `INV §5` or `spec-writing` skill | `ideation`, `backend-spec-builder`, `brainstorming`, AgentBoard `foundation`; `spec-rescue` for broken specs | — |
| **DESIGN — architecture** | ✅ | `/expert-architecture` (brownfield) `INV §5` | `-greenfield`, `-greenfield-portable` (offline), AgentBoard `/architecture` pipeline, lightweight `Spec-and-Architecture-Flow/architecture`, `project-lifecycle` phase-design | — |
| **PLAN — implementation plan** | ✅ | `/expert-plan` cmd/skill `INV §5/§4b` | `plan-architect` (opus), `implementation-plan-architect`, PM `writing-plans`, AgentBoard plan agents | plan-quality hooks (🔴 broken) + `Agent-Compliance-checklist` |
| **BUILD — execute the plan** | ✅ | `expert-implement(er)` `INV §6` | PM `executing-plans`, `subagent-driven-development`, AgentBoard `implementation-agent` | `auto-lint.sh` hook |
| **BUILD — test-first** | ✅ | `test-driven-development` skill (PM) `INV §3.6` | `testing-setup` (scaffold pytest/vitest/jest) `INV §4e` | — |
| **BUILD — domain code** | 🟡 | `arduino-development` (ESP32), `genkit-architect`, gcp-iot, CAM MCPs `INV §1B/§3.7/§4g` | — | — |
| **VERIFY — code review** | ✅ | `/expert-review` (binary gate) `INV §5` | `/code-review` (diff), `code-review-swarm` workflow (multi-model), `requesting`/`receiving-code-review`, AgentBoard `review-agent` | 🔥 command + workflow + agent + roles |
| **VERIFY — production/security audit** | ✅ | `audit-swarm` (7 auditors) `INV §4c` | `production-code-auditor` (agent+cmd), AgentBoard `audit-agent`, `/security-review` 🧱 | — |
| **VERIFY — done-ness honesty** | ✅ | `verification-before-completion` skill `INV §4e` | built into audit/review agents | — |
| **VERIFY — contract/doc drift** | ✅ | `verify-alignment` (check) + `source-of-truth-sync` (fix) `INV §4e` | `contract-drift-detector`, `state-machine-validator` agents | 🔥 skill×2 + edit-hook + stop-hook + 2 agents |
| **VERIFY — runtime/browser** | 🟡 | `web-error-inspector` agent `INV §6` | `chrome-devtools` skills 🧱, `verify`/`run` 🧱 | — |
| **DEBUG** | ✅ | `systematic-debugging` skill `INV §4e` | techniques: root-cause-tracing, defense-in-depth, condition-based-waiting; `claude-systematic-debug` submodule (uninit) | — |
| **OPERATE — deploy** | 🟡 | gcp-iot `/gcp:deploy` (GCP only) `INV §3.7` | aps-fusion Dockerfile (example) | gcp-iot deploy-safety hook |
| **OPERATE — monitor/diagnose** | 🟡 | gcp-iot `/gcp:status|diagnose|trace|logs`, `gcp-architect` (GCP only) | `project-lifecycle` phase-operate (guidance only) | — |
| **OPERATE — CI/CD · IaC · secrets · observability (general)** | 🔴 | **— nothing reusable —** | (only described in PM deployment-readiness *memory*, not a tool) | — |
| **MAINTAIN — cleanup / dead code** | ✅ | `codebase-cleanup` (React/Vite) `INV §4c` | `project-lifecycle` phase-maintain, codegraph orphan/impact tools | — |
| **MAINTAIN — docs** | ✅ | `codebase-documentation` workflow (contracts) `INV §9` | `app-user-docs` (user manual), `claudemd-maintainer` (CLAUDE.md), `mermaid-flow-visualizer` | `precommit-doc-check` git hook |
| **MAINTAIN — adopt existing/brownfield** | ✅ | `project-lifecycle/adopting-on-an-existing-repo` `INV §4b` | `project-contractor`, `codebase-recon` | — |
| **MAINTAIN — release / versioning / changelog** | 🔴 | **— nothing reusable —** | (`project-lifecycle` cites Conventional Commits/SemVer/Keep-a-Changelog as *standards*, ships no tool) | — |

*(Cross-cutting slots — orchestration, memory, tracking, and the meta "build-the-tooling"
slots — are below, since they span all phases.)*

---

## Cross-cutting capabilities (span every phase)

| Capability | Coverage | What you have | Notes / gap |
|---|---|---|---|
| **Multi-agent orchestration** | ✅ | **AgentBoard** (full spec→arch→plan→review→impl→audit pipeline + kanban) ⚙️🧩 `INV §3`; `dispatching-parallel-agents`, `subagent-driven-development`, `SOLUTIONS-ARCHITECT` skills; `agents` MCP (dispatch to Codex/Gemini) ⚙️; `programmatic-claude-profiles` roles ⚙️; `orchestration-strategy`/`agent-quick-guide` docs | This is the repo's strongest cross-cutting asset. AgentBoard needs its backend + cloud MCP running. |
| **Memory / continuity** | ✅ | CORE-Memory agents (`memory-ingest`/`-search`) 🧩; `/session-start` + `/session-end` (CORE ingest protocol); `task-observer` (skill-improvement capture) ⚙️🧩; AgentBoard activity log; `feedback-improvement` skill; `kickoff`/`pickup`/`wrap-up` | CORE Memory is an external MCP; agents hardcode a project label + a tool prefix that differs from this environment. |
| **Project tracking / status** | ✅ | AgentBoard boards + 13-phase projects; `status`/`board-status` skills; PM legacy `Planning/STATUS.md` quartet | Tracking is AgentBoard-centric. |
| **Standards / rigor enforcement** | ✅🔥 | Expert Standard stack (see below) | The most-reinforced concern in the repo. |
| **Build the tooling itself** | ✅ | `mcp-builder` (MCP servers) `INV §4f`, `AGENT-CREATION` (agents), `SOLUTIONS-ARCHITECT` (orchestrations); 🧱 `mcp-server-dev`, `plugin-dev`, `skill-creator` plugins | Strong meta-tooling. |

---

## The second axis: trigger & cadence (the tools that don't live in one phase)

Some of the most useful tools here get **forgotten because they have no phase home** — they're
not "Design tools" or "Build tools," they're triggered by an **event** or run on a **cadence**.
File them by *when they fire*, not by *where you are*, and they stop disappearing.

### Cadence calendar — what runs when

| Cadence | Fire it… | Tools | Set-and-forget? |
|---|---|---|---|
| **Ambient** | every turn / judgment / claim | `expert-standard`, `verification-before-completion`, codebase-rag grounding (+`block-first-search`/`rag-context` hooks), `auto-lint` | ✅ wire once in `settings.json`, then ignore |
| **Per edit** | on each Edit/Write | `source-of-truth-sync` (via `contract-edit-guard` hook), `auto-lint` | ✅ hook |
| **Per commit** | `git commit` | `precommit-doc-check` | ✅ git hook |
| **Per session** | open / close | open: `/session-start`, `kickoff`, `pickup`, `memory-search` · close: `/session-end`, `wrap-up`, `memory-ingest` | partly (rituals you invoke) |
| **Weekly / milestone** | on a clock or before a release | `task-observer` (**weekly review** built in), `audit-swarm` / `production-code-auditor` (pre-deploy), `codebase-cleanup` (pre-release) | ⏰ scheduled / deliberate |
| **On entry / when stale** | starting or returning to a codebase; ground truth gone stale | `project-contractor` (→ `SOURCE-OF-TRUTH.md`, **7-day staleness check**), `codebase-recon` (fast), `codebase-documentation`/init-contracts (generate), `project-lifecycle`/adopting (brownfield) | 🔁 refresh when stale |
| **On event** | a specific thing happened | bug/test failure → `systematic-debugging`; you report a failure → `feedback-improvement`; contract file changed → `verify-alignment` / `contract-drift-detector` / `state-machine-validator`; structural change → `claudemd-maintainer`; caught pattern-matching → `/workflow-violation` | reactive |
| **As-needed campaign** | deliberate occasional pass | `codebase-cleanup`, `audit-swarm`, `app-user-docs` (before handoff) | manual |
| **Reference (don't "run")** | when deciding how to work | `project-lifecycle` (the methodology map), `orchestration-strategy`, `agent-quick-guide`, `Agent-Compliance-checklist` | consult |

### Your forgotten tools, placed

- **`project-contractor`** — *Entry / when-stale.* Run when you start (or return after context loss) on an unfamiliar codebase, or before a multi-system refactor. Produces a user-validated `SOURCE-OF-TRUTH.md`; its `verify-survey.sh` flags it stale after **7 days** → that's your re-run cadence. The heavyweight "establish ground truth" tool.
- **`verify-alignment`** — *On-event (read).* After significant changes, or auto-fired by the `session-end-drift-check` hook when contract-paired files changed. **Reports** drift (tests + lint + codegraph + contract comparison); does **not** fix. 🔧 *re-point the contract map + test/lint commands (backlog #1).*
- **`source-of-truth-sync`** — *Per-edit (write).* The fixer half of the pair: after a contract-paired edit (auto via `contract-edit-guard`), rewrite the docs to match code. Use *with* verify-alignment, not instead of. 🔧 *re-point the contract map + test/lint commands (backlog #1).*
- **`codebase-cleanup`** — *As-needed campaign (Maintain phase).* A deliberate occasional pass to remove dead code/dupes in a React/Vite app, with approval gates. Run when cruft accumulates or before a release — not continuously.
- **`feedback-improvement`** — *On-event (meta).* Fires when *you* report that Claude did something wrong ("you keep doing X", "remember this"). Converts the failure into a durable memory edit or a skill-fix proposal. No phase; it's a self-correction loop.
- **`project-lifecycle`** — *Reference / framing.* This one isn't a point tool at all — it's the **methodology map** (the 6 phases + cross-cutting). Open the matching phase reference *as you enter that phase*; it's the umbrella the Expert pipeline commands operationalize.

### Overlap — the clusters where these collide

**1. Contract / doc-sync (4 tools, heavy overlap — split by read-vs-write and scope):**
- `source-of-truth-sync` = **WRITE** (updates docs after an edit).
- `verify-alignment` = **READ**, full suite (tests + lint + codegraph + all contract pairs) → drift report.
- `contract-drift-detector` = **READ**, 11 contract pairs, findings only (no tests).
- `state-machine-validator` = **READ**, *one* invariant (the task state machine) but **runs the tests**.
→ Normal loop: edit → `source-of-truth-sync`; periodic/session-end → `verify-alignment`. The two agents are deeper, narrower checks for that one app. 🔧 **All four are wired to an AgentBoard-style `server/src ↔ docs/contracts` map and `npm … --prefix server/client` commands — re-point the map + commands before reuse (see § Generalization backlog, bucket 1).**

**2. "Understand the codebase" (depth ladder):**
`codebase-rag`/`codegraph` (always-on retrieval) → `codebase-recon` (fast, ephemeral, 5-read cap) → `project-contractor` (deep 5-agent survey, **persisted + user-validated** SOURCE-OF-TRUTH.md) → `codebase-context-compiler` (per-*task* grounded package, hook-enforced). `project-lifecycle/adopting` is the brownfield methodology wrapper over all of these.

**3. Self-improvement (two triggers):**
`feedback-improvement` = *reactive* (you flag a failure) vs `task-observer` = *ambient* (auto-notices improvement opportunities every session + weekly review). Both feed durable memory/skills; different entry points.

**4. Maintain-phase hygiene:**
`audit-swarm`/`production-code-auditor` = **find** problems · `codebase-cleanup` = **remove** cruft · `verify-alignment` = **confirm** docs still match · `project-lifecycle/phase-maintain` = the **method** tying them together.

---

## Reinforcement stacks (overlapping enforcement — stack for higher assurance)

These are the concerns you can enforce at **multiple layers** at once. Grab one layer for a
light touch, or stack several when the concern is load-bearing. (This is the "expert standard
hook" pattern you mentioned — here are all of them.)

### 1. Expert Standard — "judge against named standards, not against the existing code"
Strongest stack in the repo. Layers, lightest → hardest:
- **Frame (ambient):** `expert-standard(s)` skill — drop in `.claude/skills/`. *(Pick one copy; they fork into a 59-line and 47-line variant — `INV §10.2`.)*
- **Structured review:** `/expert-review` command — binary PASS/NEEDS-FIXES gate.
- **Domain specialization:** `frontend-standards` skill (UI), `Agent-Compliance-checklist` (the 8-gate rubric).
- **Mid-session correction:** `/workflow-violation` command — hard "re-invoke the standard now" kick.
- **Hook enforcement:** `skill-enforcer.sh` + `expert-standard-inject.sh` (Project-Manager `hooks/`) — inject the frame on `UserPromptSubmit`.
- **Role-level:** `programmatic-claude-profiles` injects `{{EXPERT_STANDARD}}` into a role's `CLAUDE.md` (so a sandboxed agent *can't not* have it).
- **Per-agent:** every AgentBoard sub-agent activates `expert-standards` as step 0.

### 2. Codebase grounding — "consult real code/graph before acting"
- **Retrieval engines:** `codebase-rag` MCP (semantic) + `codegraph` MCP (structural) — install both.
- **Skills:** `codebase-rag` skill, `codebase-recon` (script-first), `project-contractor` (survey→SOURCE-OF-TRUTH.md).
- **Force-it hook:** `block-first-search.sh` + `reset-search-blocks.sh` — *deny the first grep/glob each turn* so the agent must use RAG first.
- **Auto-inject hooks:** `rag-context.py` (UserPromptSubmit injects top-3 hits) — or the `RAG-injection` / `codegraph-context-injection` (LiteLLM proxy) middleware to do it provider-wide.
- **Pre-edit gate:** `codebase-context-compiler` (ctxpack) — *blocks edits* until a repo-grounded plan passes its assumption firewall.
- **Role lockdown:** `codebase-auditor` role denies Bash so grep/find are impossible — only RAG/codegraph discovery.

### 3. Contract / doc drift — "code and its docs stay in sync"
- **Skills:** `source-of-truth-sync` (updates docs after a contract edit) + `verify-alignment` (read-only drift report).
- **Edit-time hook:** `contract-edit-guard.sh` (PostToolUse — demands a sync after a paired edit).
- **Stop-time hook:** `session-end-drift-check.sh` (flags drift before the session ends).
- **Agents:** `contract-drift-detector`, `state-machine-validator`.
- **Generate from scratch:** `codebase-documentation` workflow (`init-contracts`).
- *(All hardcode an AgentBoard-style `server/src` ↔ `docs/contracts` map — re-point it for your repo.)*

### 4. Plan quality — "no implementer-discretion left in the plan"
- **Author:** `/expert-plan` (zero-on-the-fly-decisions contract) + `Agent-Compliance-checklist`.
- **Hooks (🔴 currently broken — missing `_hooklib`):** `plan-delivery-gate.py` (blocks vague plans), `pre-planning-advisory.py` (primes planners). Fix or rewrite before relying on them.

### 5. Artifact completeness — "no TODO/placeholder/unfinished work submitted"
- **Hooks:** `artifact-quality-gate.sh|.py` + `inject-quality-gate-prompt.sh` (AgentBoard) — block submissions containing TODO/TBD/FIXME/"open question".

### 6. Verification honesty — "no success claim without fresh evidence"
- **Skill:** `verification-before-completion` (run the proving command *this message*).
- **Built into:** every review/audit agent and `expert-implementer` preflight.

### 7. Memory / continuity
- **Capture:** CORE `memory-ingest` agent + `/session-end` ingest protocol + `task-observer` Stop hook.
- **Recall:** CORE `memory-search` agent + `/session-start` + `pickup`.

---

## Coverage gaps — build these or source elsewhere 🔴

A "full project lifecycle" needs these, and **this repo has no reusable tool** for them today
(some are *described* in docs/skills as standards, but ship nothing you can grab):

| Missing slot | Why you'll hit it | Closest thing here (not enough) |
|---|---|---|
| **CI/CD pipelines** (reusable GitHub Actions / GitLab templates) | every project that ships | only narrated in PM `memory/deployment-readiness.md`; no template |
| **Infrastructure-as-Code** (Terraform/Pulumi modules) | any cloud deploy | referenced in PM memory; not provided |
| **Containerization scaffold** (Dockerfile/compose skill) | most deploys | one example Dockerfile in `aps-fusion-mcp-server`; no skill |
| **Secrets / env management** | every real app | mentioned in standards; no tool |
| **Dependency & supply-chain scanning** (SCA, SBOM, CVE) | security posture | `audit-swarm` security auditor *reasons* about it; runs no scanner |
| **Observability setup** (logging/metrics/tracing/alerts) beyond GCP-IoT | OPERATE phase | gcp-iot is GCP-IoT-specific; `project-lifecycle` phase-operate is guidance only |
| **Release management** (SemVer bump, changelog, release notes) | every release | cited as standards; no automation |
| **Performance / load testing** | scale-sensitive work | `performance-auditor` reviews code; no benchmark/load tool |
| **DB migration tooling** (general) | schema evolution | only internal to `codebase-context-compiler`; no reusable skill |
| **API / contract testing** (runtime) | integrations | `api-endpoint-mapper` is *static* only |
| **Automated a11y testing** (axe/pa11y runner) | UI compliance | `frontend-standards` is a *frame*; `chrome-devtools` a11y skill 🧱 is manual |
| **Incident response / runbooks / on-call** | OPERATE | phase-operate describes; ships nothing |

**Don't re-build these — they're already in the harness (🧱):** `/security-review`, `/init`,
`verify`, `run`, `code-review` (built-in), `deep-research`, the `chrome-devtools-mcp` skills,
and the `plugin-dev` / `mcp-server-dev` / `skill-creator` skills. Use them instead of grabbing
repo tools for those jobs.

---

## Quick-start grab lists (populate a `.claude/` for a new project)

**Always grab (the rigor + grounding baseline, any project):**
- 🧩 `expert-standard(s)` skill → `.claude/skills/`
- 🧩 `verification-before-completion`, `systematic-debugging` skills
- ⚙️ `codebase-rag` MCP + `codegraph` MCP → build, add to `.claude/.mcp.json`
- 🧩 `codebase-rag` skill + (optional) `block-first-search.sh`/`reset-search-blocks.sh` + `rag-context.py` hooks for forced grounding
- 🧩 the Expert pipeline commands: `/expert-spec`, `/expert-architecture*`, `/expert-plan`, `/expert-implement`, `/expert-review` → `.claude/commands/`

**Greenfield web/app project:** baseline **+** `ideation` or `/expert-spec` → `/expert-architecture-greenfield` → `frontend-standards` + `Design-Thinking` → `testing-setup` + `test-driven-development` → `/expert-review` + `audit-swarm`.

**Brownfield / inherited codebase:** baseline **+** `project-lifecycle/adopting-on-an-existing-repo` + `project-contractor` + `codebase-recon` → `codebase-documentation` (init-contracts) + `source-of-truth-sync` + drift hooks → `codebase-cleanup`.

**Heavy multi-agent delivery:** install **AgentBoard** (backend + cloud MCP + `codegraph`/`codebase-rag`/`clear-thought`) and use `foundation → architecture → orchestrate`; or the `agents` MCP to fan work out to Codex/Gemini; or `programmatic-claude-profiles` for sandboxed role-scoped runs.

**IoT / embedded (GCP):** the whole `gcp-iot` plugin + `arduino-development` skill.

**CAM/CAD automation (Windows):** the relevant Autodesk MCP (`PowerMill` ⚠️, `FeatureCAM`, `aps-fusion`, `PowerInspect` 📦) — see `INV §1B` for build/status caveats.

**"Just give me maximum rigor, sandboxed":** `programmatic-claude-profiles` → `codebase-auditor` / `code-reviewer` roles (Bash denied, RAG+codegraph only).

---

## Setup mechanics — where each thing goes

- **Skills** → `.claude/skills/<name>/SKILL.md` (+ its `references/`, `scripts/`).
- **Commands** → `.claude/commands/<name>.md` (Gemini uses `.toml`).
- **Agents** → `.claude/agents/<name>.md`.
- **Hooks** → put the script anywhere (e.g. `.claude/hooks/`) and register the event in `.claude/settings.json` (`UserPromptSubmit` / `PreToolUse` / `PostToolUse` / `Stop` / `SessionStart`). The Project-Manager `settings.local.json` is a working example wiring the whole stack.
- **MCP servers** → build first (`npm run build` / `pip install -r requirements.txt`), then declare in `.claude/.mcp.json` (the AgentBoard plugin `.mcp.json` is a 4-server template). ⚠️ Most `.mcp.json` here hardcode absolute `C:\Users\maxco\…` paths — fix those.
- **Middleware** (`codebase-context-compiler` ctxpack, `codegraph-context-injection`) → not a `.claude` artifact; `ctxpack init` installs its own hooks; the LiteLLM proxy runs separately and you point `ANTHROPIC_BASE_URL` at it.
- **Role harness** (`programmatic-claude-profiles`) → separate PowerShell install to `~/claude-roles/`; invoked per-run, not per-project.

> **Watch-outs when grabbing** (full list: `INV §11`): pick *one* copy of the many duplicated
> skills (the ports diverge — `INV §10`); the plan-quality hooks are broken; PowerMill's server
> source isn't committed; many configs hardcode machine-specific paths; the `agents/` fleet and
> the contract-drift tools are wired to *other* specific projects and need re-pointing.

---

## Generalization backlog — re-point these before broad reuse 🔧

The good news: **most skills + the entire Expert pipeline are already project-agnostic** (see
the ✅ list at the bottom). The hardcoding that causes "this only works on *that* repo" confusion
is concentrated in **5 buckets**. Work them in order — bucket 2 (paths) is the quick win; bucket
3 (the CNC agents) is the heavy one.

### Bucket 1 — Contract/doc-sync map (medium effort, mechanical)
| Tool | What's hardcoded | Re-point to |
|---|---|---|
| `source-of-truth-sync` (skill ×3 copies) | the source↔doc↔CLAUDE.md-section map (`taskStateMachine.js`, `db/schema.js`, `routes/*.js`, `ws.js`, `events.js`, `milestoneSync.js`, `PhaseBar.jsx`…); commands `npm test --prefix server` / `npm run lint --prefix client` | your repo's source-file→doc pairs; your test/lint commands; your CLAUDE.md section names |
| `verify-alignment` (skill) | same map + CLAUDE.md section names (`STATE_MACHINE`, `DB_SCHEMA`, `API_ENDPOINTS`…) + `CODEGRAPH_ANALYSIS.stats_as_of` | same; update the section names + the codegraph stats baseline |
| `contract-drift-detector` (agent) | 11 hardcoded contract pairs / file paths | your contract pairs |
| `state-machine-validator` (agent) | AgentBoard file list + `npm test --prefix server` | your state-machine files + test cmd |
| `contract-edit-guard.sh`, `session-end-drift-check.sh` (hooks ×2 each) | the ~14-file contract list | your paired-file list |
| `codebase-documentation`/init-contracts + its `source-of-truth-sync` | ships a **sample** AgentBoard contract map *meant to be replaced* | your map (this one's designed for it) |
> **Do this once as a single "contract map" definition and reuse it across all of the above** — they all encode the *same* table.

### Bucket 2 — Absolute machine paths (low effort, per-machine)
| Tool | What's hardcoded | Re-point to |
|---|---|---|
| every `.mcp.json` (agentboard claude/codex/gemini; `codebase-rag-enforcer`; `profiles/codebase-auditor`) | absolute `C:\Users\maxco\…` paths to `codegraph`/`codebase-rag` builds | `${CLAUDE_PLUGIN_ROOT}`/relative paths or env vars |
| `codegraph-windows-config.json` | points at a **different checkout** (`claude-code-ultimate/…`), not agent-armory | your built `dist/index.js` |
| `rag-context.py` (hook ×3 copies) | `~/Documents/agent-armory/mcp-servers/codebase-rag/mcp-server-python` | wherever you install the RAG server |
| `project-initializer` scripts | OneDrive path `C:/Users/maxco/OneDrive/…/project-initializer` | install location |
| `implementation-plan-agent` | absolute paths to sibling MCP servers + a speculative `gemini-3.1-pro-preview` model id | real paths + a real model id |
| `migration-prompt.txt` (codebase-rag) | references a stale OneDrive repo path | current repo location |

### Bucket 3 — CNC Syndicate Dashboard agent fleet (`agents/`) (high effort, or cherry-pick)
| What's hardcoded (across the fleet) | Re-point to |
|---|---|
| The CNC Dashboard stack (React 19.2/Vite, voice-command refs+state, dual viewers) and file paths in `api-integration-specialist`, `backend-architect`, `backend-engineer`, `react-component-architect`, `implementation-plan-architect`, `plan-architect`, `claudemd-maintainer` | your stack/paths — or strip the CNC framing (several, e.g. `backend-architect`, `production-code-auditor`, `mermaid-flow-visualizer`, are *largely general* once it's removed) |
| CORE Memory project label `cmigiw82s000vp11magtk5nef` (`memory-ingest`, `memory-search`, `backend-research`, `plan-architect`) | your CORE label, or remove |
| Tool prefixes `mcp__core-memory__`, `mcp__upstash_context7__` | this env's `mcp__claude_ai_CORE_Memory__`, `mcp__claude_ai_Context7__` |
| References to a missing `MANDATORY-VERIFICATION-PROTOCOL.md` (several) + a missing `feature-architect` agent (`orchestration-strategy`) | add the file/agent or drop the references |
| `web-error-inspector` says "plant health dashboard" + depends on many uncertain MCP servers | your app + trim MCP deps |

### Bucket 4 — Project-Manager deployment-readiness coupling (medium effort)
| Tool | What's hardcoded | Re-point to |
|---|---|---|
| `/session-start`, `/session-end` (top-level + PM copies) | the `docs/deployment-readiness/` tree (handoffs, `review.md` "29 findings", `master-plan.md`, plan files), the locked-decisions list, an auto-memory root path | your project's docs tree + decisions; keep the CORE-ingest *protocol*, drop the specifics |
| `/team-review` (×2) | agentboard `project_id` `bc4e7717-8232-4084-bc26-60e1bf324d24` | parameterize/remove the project id |

### Bucket 5 — Stack assumptions (scope, not paths — generalize or apply only on match)
| Tool | Assumes | Action |
|---|---|---|
| `codebase-cleanup` | React/Vite layout | generalize the structure refs, or use only on React/Vite |
| `auto-lint.sh` | `client/` dir + `npx eslint` | swap for your lint command/path |
| `arduino-development`, `gcp-iot`, `genkit-architect`, CAM MCPs | ESP32 / GCP / Genkit / Windows-COM | inherently domain tools — leave domain-scoped |

### ✅ Already portable — leave these alone
The **Expert pipeline** (`/expert-spec`, `/expert-architecture*`, `/expert-plan`,
`/expert-implement` + `expert-implementer`, `/expert-review`, `Agent-Compliance-checklist`); the
**standards/discipline skills** (`expert-standard`, `frontend-standards`,
`verification-before-completion`, `systematic-debugging`, `test-driven-development`,
`testing-setup` — auto-detects stack); **spec/plan skills** (`ideation`, `backend-spec-builder`,
`brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`,
`dispatching-parallel-agents`, `finishing-a-development-branch`, `project-lifecycle` + refs);
**`project-contractor`**, **`codebase-recon`**, **`app-user-docs`**, **`audit-swarm`**,
**`feedback-improvement`**, **`mcp-builder`**, **`AGENT-CREATION`**, **`SOLUTIONS-ARCHITECT`**;
and the **`codebase-rag` / `codegraph` MCP servers** (auto-detect project root — only need build
+ a correct `.mcp.json` path, i.e. just bucket 2). These take a target/spec as input and carry no
project-specific assumptions.
