# Code Review Swarm

Multi-agent parallel code review using Claude Code, Gemini CLI, and Codex CLI — each reviewing different domains based on their actual model strengths, running in isolated git worktrees.

## Why Multiple Agents?

Each model has genuinely different strengths:

| Agent | Strength | Assigned Domains | Default Model |
|-------|----------|------------------|---------------|
| **Claude Code** | Deep reasoning, tracing complex logic, security analysis | Architecture, Security, Backend, Synthesis | CLI default |
| **Gemini CLI** | 1M+ token context, cross-file pattern detection, Gemini 3 reasoning | IoT/Embedded, Data Flow, Performance | gemini-3-flash (CLI) / gemini-2.5-pro (API) |
| **Codex CLI** | Built-in `/review`, structured analysis, gpt-5.3-codex | Frontend, Database, Type Safety | gpt-5.3-codex |

Running them in parallel on different aspects — then cross-referencing their findings — produces higher-confidence results than any single model.

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (review.sh)              │
│                                                         │
│  1. Classify codebase (frontend/backend/iot/realtime)   │
│  2. Build review plan (domain → agent assignment)       │
│  3. Create git worktrees for isolation                  │
│  4. Dispatch agents in parallel                         │
│  5. Collect findings                                    │
│  6. Cross-reference & synthesize final report           │
└────────┬──────────────┬──────────────┬──────────────────┘
         │              │              │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │  Claude  │    │  Gemini │    │  Codex  │
    │ worktree │    │ worktree│    │ worktree│
    │          │    │         │    │         │
    │ arch.md  │    │ iot.md  │    │ front.md│
    │ sec.md   │    │ flow.md │    │ db.md   │
    │ back.md  │    │ perf.md │    │         │
    └────┬─────┘    └────┬────┘    └────┬────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
                  ┌─────▼─────┐
                  │ SYNTHESIS  │
                  │ (Claude)   │
                  │            │
                  │ Cross-ref  │
                  │ Dedup      │
                  │ Prioritize │
                  └─────┬──────┘
                        │
                  REVIEW_REPORT.md
```

## Quick Start

```bash
# 1. Clone or copy to your tools directory
git clone <this-repo> ~/tools/code-review-swarm
cd ~/tools/code-review-swarm

# 2. Check dependencies
./setup.sh

# 3. Review a project
./review.sh /path/to/your/project
```

## Usage

### Full Codebase Review
```bash
./review.sh /path/to/project
```
Classifies the codebase automatically and dispatches all relevant domain reviews.

### Feature/Refactor Review (Changes Only)
```bash
./review.sh /path/to/project --diff main
# or
./review.sh /path/to/project --diff abc1234
```
Only reviews files changed since the specified branch or commit.

### IoT Project Review
```bash
./review.sh /path/to/project --mode iot
```
Enables all IoT-specific checks: ESP32/Arduino code, MQTT protocols, Pi hub code, sensor safety, device-to-cloud data pipeline.

### Select Specific Agents
```bash
./review.sh /path/to/project --agents claude,gemini
```

### Dry Run (See Plan Without Executing)
```bash
./review.sh /path/to/project --dry-run
```

### All Options
```
./review.sh [target-dir] [options]

Options:
  --mode        full|feature|iot     (default: auto-detect)
  --diff        branch-or-sha        (review only changes since ref)
  --agents      claude,gemini,codex  (comma-separated, default: all)
  --parallel    max-parallel-agents   (default: 3)
  --output      output-directory      (default: .code-review/)
  --config      path-to-config.yaml
  --no-worktree skip worktree isolation
  --verbose     show agent output in real-time
  --dry-run     show plan without running
```

## Output Structure

```
.code-review/
├── REVIEW_REPORT.md          ← Final synthesized report
├── reports/
│   ├── architecture_claude.md
│   ├── security_claude.md
│   ├── frontend_codex.md
│   ├── backend_claude.md
│   ├── iot-embedded_gemini.md
│   ├── realtime-dataflow_gemini.md
│   ├── database_codex.md
│   └── performance_gemini.md
├── findings/
│   ├── file_manifest.json
│   ├── changed_files.txt      (if --diff used)
│   ├── review_plan.txt
│   └── all_files.txt
└── logs/
    └── review_20250211_143022.log
```

## The Synthesis Step

The most valuable part. After all agents complete, their reports are fed into a synthesis agent that:

1. **Cross-references**: Issue found by 2+ agents = higher confidence
2. **Deduplicates**: Same root cause described differently by different agents
3. **Resolves conflicts**: When agents disagree, explains which is more likely correct
4. **Prioritizes**: P0 (fix now) through P3 (backlog) based on actual impact
5. **Generates action items**: Each P0/P1 gets a specific, implementable fix description

## IoT-Specific Capabilities

The swarm understands full IoT stacks:

**Microcontroller Layer** (ESP32/ESP8266/Arduino)
- Memory management (heap fragmentation, String abuse)
- WiFi reconnection state machines
- MQTT QoS level appropriateness
- Sensor validation and fail-safe actuator states
- Watchdog timers and blocking call detection
- OTA update security

**Hub Layer** (Raspberry Pi)
- Process management (systemd integration)
- SD card write optimization
- Serial/I2C/SPI error handling
- Thread safety for concurrent device communication
- Offline buffering when cloud is unreachable

**Cloud Layer**
- Device provisioning security
- Telemetry ingestion performance
- Real-time dashboard state synchronization
- End-to-end data pipeline tracing

## Configuration

Place `.review-swarm.yaml` in your project root:

```yaml
agents:
  preferred_order: [claude, gemini, codex]
  overrides:
    security: [codex, claude]  # Override domain assignment

scope:
  exclude:
    - "legacy/"
    - "generated/"
  max_files_per_agent: 50

iot:
  platforms: [esp32, raspberry-pi]
  mqtt_topic_pattern: "{device_type}/{device_id}/{channel}"

output:
  history: 5
  keep_agent_reports: true

execution:
  max_parallel: 3
  agent_timeout: 300
```

## Requirements

**Required:**
- `git` (for worktrees)
- `jq` (for JSON processing)

**At least one agent (CLI or API key):**
- `claude` CLI — `npm i -g @anthropic-ai/claude-code`
- `gemini` CLI — `npm i -g @google/gemini-cli` (has Gemini 3 Flash/Pro)
- `codex` CLI — `npm i -g @openai/codex` (defaults to gpt-5.3-codex)
- Or set API keys: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`

**Model configuration:**
CLI tools use their own configured defaults (recommended). API fallback models are configurable via `.review-swarm.yaml` or env vars (`CLAUDE_API_MODEL`, `OPENAI_API_MODEL`, `GEMINI_API_MODEL`).

**Agent fallback chain:** If a preferred agent isn't available, the system falls back to the next available agent. Even with just one agent, you still get domain-specific reviews — just serial instead of parallel.

## Single-Agent Mode

Works fine with just one agent. The domain-specific prompts still provide specialized reviews — you just lose the cross-validation between models. The synthesis step still deduplicates and prioritizes.

## Integration Ideas

**Pre-merge CI check:**
```yaml
# .github/workflows/review.yml
on:
  pull_request:
    branches: [main]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: ./tools/code-review-swarm/review.sh . --diff origin/main --agents claude
      - uses: actions/upload-artifact@v4
        with:
          name: code-review
          path: .code-review/REVIEW_REPORT.md
```

**Git hook (pre-push):**
```bash
#!/bin/bash
# .git/hooks/pre-push
~/tools/code-review-swarm/review.sh . --diff main --no-worktree --agents claude
```

**Cron for full reviews:**
```bash
# Weekly full review
0 9 * * 1 cd /path/to/project && ~/tools/code-review-swarm/review.sh . 2>&1 | mail -s "Weekly Code Review" team@company.com
```

## Architecture Decisions

**Why git worktrees?** Each agent gets its own checkout. No file locking, no read conflicts, agents can navigate freely without stepping on each other.

**Why model-specific domain assignment?** Claude's deep reasoning catches architectural issues others miss. Gemini 3's context window can hold an entire IoT stack end-to-end. Codex's gpt-5.3-codex model with built-in `/review` catches type mismatches and N+1 queries efficiently.

**Why not hardcode models?** Models change fast. The CLI tools (claude, codex, gemini) manage their own default models and stay current automatically. The script only specifies models for API-key curl fallbacks, and even those are configurable via `.review-swarm.yaml` or environment variables so nothing goes stale.

**Why a synthesis step?** The same bug described three different ways by three agents creates noise. Synthesis deduplicates, cross-validates (multi-agent agreement = high confidence), and produces a single prioritized action list.

**Why bash orchestrator?** Runs anywhere, no dependencies beyond git and jq. The agents themselves handle the AI — the orchestrator just manages parallelism and file routing.
