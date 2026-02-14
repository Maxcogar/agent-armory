# Codegraph Middleware — Setup Guide

## What This Does

Every time an agent makes an LLM API call through the proxy, the middleware:

1. Grabs the user's prompt
2. Extracts keywords from it (RAKE algorithm, no LLM)
3. Runs `codegraph.py --trace` for each keyword against your project
4. Gets back: relevant files, endpoints, cross-language bridges, broken connections
5. Formats that into a structured context block with explicit constraints
6. Optionally sends the prompt to Gemini Flash to clean it up
7. Injects context + cleaned prompt, forwards to the target model

The agent receives the enriched prompt and has no choice but to see the existing
code, the connections, and the constraints. It never gets a chance to skip the reading.

## Files

```
codegraph_middleware.py   — The LiteLLM middleware (this is the new piece)
codegraph.py              — Your existing codegraph script (no changes needed)
config.yaml               — LiteLLM proxy config that loads the middleware
```

## Install

```bash
# LiteLLM proxy
pip install litellm[proxy]

# Keyword extraction (recommended, has a fallback if missing)
pip install rake-nltk

# That's it. codegraph.py has zero dependencies.
```

## Configure

Set these environment variables before starting the proxy:

```bash
# Required: where your project lives
export CODEGRAPH_PROJECT_ROOT="/path/to/your/monorepo"

# Required: where codegraph.py is
export CODEGRAPH_SCRIPT_PATH="/path/to/codegraph.py"

# Required: your API keys
export ANTHROPIC_API_KEY="sk-..."
export GEMINI_API_KEY="..."

# Optional: model for prompt cleanup (set to empty string to disable)
export CODEGRAPH_OPTIMIZER_MODEL="gemini/gemini-2.0-flash"

# Optional: cache settings
export CODEGRAPH_CACHE_PATH="/tmp/codegraph_cache.json"
export CODEGRAPH_CACHE_TTL="300"          # seconds before cache expires
export CODEGRAPH_MAX_TRACE_NODES="40"     # cap on injected nodes

# Optional: protect proxy with a key
export LITELLM_MASTER_KEY="your-secret-key"
```

## Run

```bash
# Make sure codegraph_middleware.py is in your working directory
# (LiteLLM needs to import it)
cd /directory/containing/codegraph_middleware.py

# Start the proxy
litellm --config config.yaml

# Proxy runs on http://localhost:4000 by default
```

## Point Your Agents At The Proxy

Instead of calling the Anthropic API directly, point agents at the proxy:

```bash
# Example: Claude Code with proxy
export ANTHROPIC_BASE_URL="http://localhost:4000"

# Or in any API call, change the base URL:
# https://api.anthropic.com → http://localhost:4000
```

Every request through the proxy gets the codegraph enrichment automatically.

## What The Agent Sees

When you send a prompt like "add battery level indicator to the sensor dashboard",
the agent receives:

```
═══ CODEGRAPH CONTEXT (auto-injected — DO NOT IGNORE) ═══
The following was retrieved from a scan of the actual codebase.
These files, endpoints, and connections are REAL and CURRENT.
You MUST account for every item listed here before making changes.
Do NOT create new files or endpoints that duplicate what already exists.
Do NOT change function signatures or return shapes without updating all consumers.

RELEVANT FILES IN CODEBASE:
  - src/components/SensorCard.jsx (js)
  - src/components/SensorDashboard.jsx (js)
  - src/services/sensorService.js (js)
  - src/routes/api/sensors.js (js)
  - firmware/sensor_node.ino (arduino)

API ENDPOINTS RELATED TO THIS TASK:
  - GET /api/sensors (defined in src/routes/api/sensors.js)
  - POST /api/sensors/config (defined in src/routes/api/sensors.js)

CROSS-LANGUAGE CONNECTIONS (changes here affect multiple languages):
  [MQTT] sensors/battery
    PRODUCES: firmware/sensor_node.ino:147 (arduino)
    CONSUMES: src/services/sensorService.js:89 (js)

  [WEBSOCKET] sensor-update
    PRODUCES: src/routes/api/sensors.js:34 (js)
    CONSUMES: src/components/SensorDashboard.jsx:22 (js)
═══ END CODEGRAPH CONTEXT ═══

Add a battery level indicator to the sensor dashboard.
```

## Disable Prompt Optimization

If you don't want the Flash call cleaning up your prompt:

```bash
export CODEGRAPH_OPTIMIZER_MODEL=""
```

The middleware will still do keyword extraction and codegraph traces.
Only the rewriting step gets skipped.

## Cache Behavior

The full codegraph JSON is cached to /tmp/codegraph_cache.json for 5 minutes
by default. Individual --trace calls are NOT cached (they're fast enough).

To force a fresh scan, delete the cache file:
```bash
rm /tmp/codegraph_cache.json
```

Or set TTL to 0 to never cache:
```bash
export CODEGRAPH_CACHE_TTL="0"
```

## Logs

The middleware logs to stderr with the `[codegraph]` prefix:

```
14:23:01 [codegraph] INFO: Intercepted prompt (247 chars)
14:23:01 [codegraph] INFO: Keywords: ['sensor', 'dashboard', 'battery', 'indicator']
14:23:02 [codegraph] INFO: Codegraph found: 12 nodes, 3 bridges, 1 broken connections
14:23:02 [codegraph] INFO: Prompt optimized: 247 chars → 89 chars
14:23:02 [codegraph] INFO: Enriched prompt: 247 → 1432 chars
14:23:05 [codegraph] INFO: Agent call completed successfully
```

## Limitations

- Keyword extraction may not catch every relevant term. If a keyword doesn't
  match any codegraph node, that trace returns nothing. The more specific
  your prompt, the better the context retrieval.
- codegraph uses regex pattern matching, not AST parsing. Dynamically
  constructed URLs, indirect references, and metaprogramming won't be caught.
- The prompt optimizer is an LLM call, which adds latency and can occasionally
  lose nuance. Disable it if your prompts are already clear.
- The cache doesn't auto-invalidate when files change. If you just modified
  code and want the middleware to see the changes, wait for TTL or delete cache.
