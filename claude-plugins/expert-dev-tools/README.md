# expert-dev-tools

A Claude Code plugin packaging the Expert Standard lifecycle: a gated
spec → architecture → plan → implement → review → ground-truth → closeout flow,
driven by `/expert` and `workflows/expert-lifecycle.js`, with typed phase agents
under `agents/` and the disciplines they follow under `skills/`.

## Layout

| Path | What lives there |
|---|---|
| `commands/expert.md` | the command tier — owner-facing language and the sole ledger writer |
| `workflows/expert-lifecycle.js` | all lifecycle routing and gating |
| `agents/` | ten typed phase agents; each file is a **contract**, not configuration |
| `skills/` | ten disciplines the agents invoke |
| `scripts/` | ledger schema, ledger validator, transcript reader |
| `tests/structural/` | the structural tier — dispatches no agents, spends no tokens |
| `tests/unit/` | the unit tier — ledger schema and transcript reader |

Run the automated tiers from the `agent-armory` checkout, so the workflow-creator
linter resolves:

```
node tests/structural/check-structure.mjs
node tests/unit/run-unit-tests.mjs
```

## `.mcp.json` — why `context7` is invoked through `cmd /c`

**Do not "tidy" the `context7` entry back to a bare `npx` invocation.** The
unusual form is load-bearing, and reverting it silently disables documentation
access for six agents.

Claude Code **deduplicates MCP servers on command/URL, not on server name**.
Reproduced 2026-07-31, the host reports:

```
MCP server "context7" skipped — same command/URL as server provided by plugin "context7"
```

This plugin's declaration was byte-identical to the standalone `context7`
plugin's, so whenever a user had that plugin installed the host skipped this
plugin's copy and the `mcp__plugin_expert-dev-tools_context7__*` namespace
registered **zero tools**. Corroborated by the natural experiment on the same
machine: three `clear-thought` servers with *different* command strings all
register, while two `context7` servers with *identical* strings produce one skip.

Since the dedupe key is the command string, making that string distinct is the
only property that restores registration. The `cmd /c` wrapper is the form
`claude-plugins/agentboard/.mcp.json` already uses for its own servers.

Three things this is **not**, and why:

- **Not a rename of the server key.** The key is not the dedupe key, so renaming
  changes nothing — and `tests/structural/check-structure.mjs` asserts the
  declared server set contains `context7`.
- **Not removal in favour of the host's copy.** A distributed plugin cannot
  depend on what a user happens to have installed; that coupling *is* the defect.
- **Not `@upstash/context7-mcp@latest`.** A floating version tag changes
  resolution semantics to obtain a string difference, coupling an unrelated
  behaviour to a workaround.

The structural tier guards both halves: that the entry still resolves
`@upstash/context7-mcp`, and that it is not the colliding bare-`npx` form.

After changing `.mcp.json`, run `/reload-plugins` and confirm
`mcp__plugin_expert-dev-tools_context7__resolve-library-id` resolves. That check
is owner-run — a reload is not scriptable from inside a session.

## Artifact locations

One convention, stated once and derived everywhere else. Each authoring skill
writes to a fixed directory and returns the path it wrote:

- specs → `docs/specs/spec-[kebab-case-name].md`
- architectures → `docs/architectures/architecture-[kebab-case-name].md`
- plans → `docs/plans/plan-[kebab-case-name].md`

The workflow **consumes** the agent's returned `PHASE_SCHEMA.artifact_path` and
carries no path defaults of its own; neither does `commands/expert.md`. A default
supplied at the command always wins on a fresh run, because the ledger's
`artifact_index` is empty then — which is how every review dispatch in one full
run came to cite a path that did not exist. If a phase returns no path, it
escalates rather than proceeding on a guess.
