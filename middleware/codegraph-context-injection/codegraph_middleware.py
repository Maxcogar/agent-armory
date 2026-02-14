"""
codegraph_middleware — LiteLLM proxy middleware that intercepts agent prompts,
runs codegraph to pull relevant codebase context, and injects structured
constraints before the prompt reaches the model.

Setup:
    1. Place codegraph.py in your project (or a known path)
    2. Configure CODEGRAPH_PROJECT_ROOT and CODEGRAPH_SCRIPT_PATH below
    3. Add this middleware to your LiteLLM proxy config

LiteLLM proxy config (config.yaml):
    model_list:
      - model_name: claude-sonnet
        litellm_params:
          model: anthropic/claude-sonnet-4-20250514
          api_key: os.environ/ANTHROPIC_API_KEY

    litellm_settings:
      callbacks: ["codegraph_middleware.proxy_handler"]

Start proxy:
    litellm --config config.yaml

Dependencies:
    - litellm (pip install litellm)
    - rake-nltk (pip install rake-nltk) — for keyword extraction
    - codegraph.py (your script, no deps)
"""

import os
import re
import sys
import json
import subprocess
import logging
from pathlib import Path
from typing import Optional

import litellm
from litellm.integrations.custom_logger import CustomLogger

# ════════════════════════════════════════════════════════════════════════════
# Configuration
# ════════════════════════════════════════════════════════════════════════════

# Path to your project root (codegraph scans this)
CODEGRAPH_PROJECT_ROOT = os.environ.get(
    "CODEGRAPH_PROJECT_ROOT",
    "/path/to/your/project"
)

# Path to codegraph.py script
CODEGRAPH_SCRIPT_PATH = os.environ.get(
    "CODEGRAPH_SCRIPT_PATH",
    "/path/to/codegraph.py"
)

# Model used for prompt cleanup (set to None to skip prompt optimization)
OPTIMIZER_MODEL = os.environ.get("CODEGRAPH_OPTIMIZER_MODEL", "gemini/gemini-2.0-flash")

# Cache the full graph JSON so we don't rebuild every call
GRAPH_CACHE_PATH = os.environ.get(
    "CODEGRAPH_CACHE_PATH",
    "/tmp/codegraph_cache.json"
)

# How old the cache can be before we rebuild (seconds)
GRAPH_CACHE_TTL = int(os.environ.get("CODEGRAPH_CACHE_TTL", "300"))

# Maximum number of trace results to inject (prevents prompt bloat)
MAX_TRACE_NODES = int(os.environ.get("CODEGRAPH_MAX_TRACE_NODES", "40"))

# ════════════════════════════════════════════════════════════════════════════
# Logging
# ════════════════════════════════════════════════════════════════════════════

logger = logging.getLogger("codegraph_middleware")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter(
        "%(asctime)s [codegraph] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S"
    ))
    logger.addHandler(handler)


# ════════════════════════════════════════════════════════════════════════════
# Keyword Extraction
# ════════════════════════════════════════════════════════════════════════════

def extract_keywords_rake(text: str, top_n: int = 10) -> list[str]:
    """Extract keywords using RAKE (Rapid Automatic Keyword Extraction).

    Falls back to simple extraction if rake-nltk is not installed.
    """
    try:
        from rake_nltk import Rake
        rake = Rake(
            min_length=1,
            max_length=3,
            include_repeated_phrases=False
        )
        rake.extract_keywords_from_text(text)
        ranked = rake.get_ranked_phrases()
        return ranked[:top_n]
    except ImportError:
        logger.warning("rake-nltk not installed, using fallback keyword extraction")
        return extract_keywords_simple(text)


def extract_keywords_simple(text: str, top_n: int = 10) -> list[str]:
    """Fallback keyword extraction using basic heuristics. No dependencies.

    Strips common English stopwords and short words, returns the most
    frequently occurring meaningful terms.
    """
    stopwords = {
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
        'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
        'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
        'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
        'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
        'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and',
        'or', 'if', 'while', 'about', 'up', 'that', 'this', 'it', 'its',
        'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they',
        'them', 'what', 'which', 'who', 'whom', 'these', 'those', 'am',
        'make', 'made', 'get', 'got', 'want', 'need', 'use', 'used', 'also',
        'like', 'know', 'think', 'see', 'look', 'find', 'give', 'tell',
        'work', 'call', 'try', 'ask', 'put', 'keep', 'let', 'begin', 'show',
        'help', 'add', 'change', 'move', 'please', 'thanks', 'thank',
    }

    # Tokenize: split on non-alphanumeric, keep underscores and hyphens
    words = re.findall(r'[a-zA-Z_][\w-]*', text.lower())

    # Filter
    meaningful = [w for w in words if w not in stopwords and len(w) > 2]

    # Count frequency
    freq = {}
    for w in meaningful:
        freq[w] = freq.get(w, 0) + 1

    # Sort by frequency, return top N
    sorted_words = sorted(freq.keys(), key=lambda w: freq[w], reverse=True)
    return sorted_words[:top_n]


# ════════════════════════════════════════════════════════════════════════════
# Codegraph Runner
# ════════════════════════════════════════════════════════════════════════════

def run_codegraph(args: list[str], timeout: int = 30) -> Optional[str]:
    """Run codegraph.py with given arguments and return stdout.

    Returns None if the script fails or times out.
    """
    cmd = [sys.executable, CODEGRAPH_SCRIPT_PATH] + args

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=CODEGRAPH_PROJECT_ROOT
        )
        if result.returncode != 0:
            logger.error(f"codegraph failed: {result.stderr.strip()}")
            return None
        return result.stdout
    except subprocess.TimeoutExpired:
        logger.error(f"codegraph timed out after {timeout}s")
        return None
    except FileNotFoundError:
        logger.error(f"codegraph.py not found at {CODEGRAPH_SCRIPT_PATH}")
        return None


def get_full_graph() -> Optional[dict]:
    """Get the full graph JSON, using cache if fresh enough."""
    cache = Path(GRAPH_CACHE_PATH)

    # Check cache freshness
    if cache.exists():
        import time
        age = time.time() - cache.stat().st_mtime
        if age < GRAPH_CACHE_TTL:
            try:
                return json.loads(cache.read_text())
            except (json.JSONDecodeError, IOError):
                pass

    # Rebuild
    logger.info("Building fresh codegraph...")
    output = run_codegraph([CODEGRAPH_PROJECT_ROOT, "--format", "json", "--quiet"])
    if output:
        try:
            graph = json.loads(output)
            cache.write_text(output)
            return graph
        except json.JSONDecodeError:
            logger.error("codegraph returned invalid JSON")
    return None


def trace_keywords(keywords: list[str]) -> dict:
    """Run codegraph --trace for each keyword and merge results.

    Returns a combined context dict with:
        - traced_nodes: relevant files and their connections
        - bridges: cross-language bridges touching those files
        - broken: unmatched endpoints, undefined env vars
    """
    all_nodes = {}
    all_bridges = []
    all_broken = []
    traced_terms = []

    for keyword in keywords:
        output = run_codegraph([
            CODEGRAPH_PROJECT_ROOT,
            "--trace", keyword,
            "--format", "json",
            "--quiet"
        ])
        if not output:
            continue

        try:
            subgraph = json.loads(output)
        except json.JSONDecodeError:
            continue

        nodes = subgraph.get("nodes", {})
        if not nodes:
            continue

        traced_terms.append(keyword)
        for nid, node in nodes.items():
            if len(all_nodes) >= MAX_TRACE_NODES:
                break
            all_nodes[nid] = node

        for bridge in subgraph.get("bridges", []):
            key = bridge.get("key", "")
            if key.startswith("UNMATCHED:") or key.startswith("UNDEFINED:"):
                all_broken.append(bridge)
            else:
                all_bridges.append(bridge)

    return {
        "traced_terms": traced_terms,
        "nodes": all_nodes,
        "bridges": all_bridges,
        "broken": all_broken,
    }


def get_bridges_only() -> list[dict]:
    """Get just the cross-language bridges."""
    output = run_codegraph([
        CODEGRAPH_PROJECT_ROOT,
        "--bridges-only",
        "--quiet"
    ])
    if output:
        try:
            return json.loads(output)
        except json.JSONDecodeError:
            pass
    return []


# ════════════════════════════════════════════════════════════════════════════
# Context Formatter
# ════════════════════════════════════════════════════════════════════════════

def format_context_block(trace_result: dict) -> str:
    """Format codegraph results into a structured context block for injection.

    This is what the agent actually sees prepended to the prompt.
    """
    sections = []

    # ── Relevant Files ───────────────────────────────────────────────────
    file_nodes = {
        nid: node for nid, node in trace_result["nodes"].items()
        if node.get("node_type") == "file" and node.get("file")
    }

    if file_nodes:
        sections.append("RELEVANT FILES IN CODEBASE:")
        for nid, node in sorted(file_nodes.items(), key=lambda x: x[1]["file"]):
            lang = node.get("language", "unknown")
            sections.append(f"  - {node['file']} ({lang})")

    # ── Endpoints ────────────────────────────────────────────────────────
    endpoints = {
        nid: node for nid, node in trace_result["nodes"].items()
        if node.get("node_type") == "endpoint"
    }

    if endpoints:
        sections.append("")
        sections.append("API ENDPOINTS RELATED TO THIS TASK:")
        for nid, node in endpoints.items():
            defined_in = node.get("file", "unknown")
            sections.append(f"  - {node['name']} (defined in {defined_in})")

    # ── Cross-Language Bridges ───────────────────────────────────────────
    if trace_result["bridges"]:
        sections.append("")
        sections.append("CROSS-LANGUAGE CONNECTIONS (changes here affect multiple languages):")
        for bridge in trace_result["bridges"]:
            btype = bridge.get("bridge_type", "unknown")
            key = bridge.get("key", "unknown")
            producers = bridge.get("producers", [])
            consumers = bridge.get("consumers", [])

            sections.append(f"  [{btype.upper()}] {key}")
            for p in producers:
                sections.append(f"    PRODUCES: {p['file']}:{p['line']} ({p['language']})")
            for c in consumers:
                sections.append(f"    CONSUMES: {c['file']}:{c['line']} ({c['language']})")

    # ── Broken Connections ───────────────────────────────────────────────
    if trace_result["broken"]:
        sections.append("")
        sections.append("⚠ BROKEN CONNECTIONS DETECTED:")
        for broken in trace_result["broken"]:
            key = broken.get("key", "")
            consumers = broken.get("consumers", [])
            if key.startswith("UNMATCHED:"):
                endpoint = key.replace("UNMATCHED:", "")
                sections.append(f"  ENDPOINT CALLED BUT NOT DEFINED: {endpoint}")
                for c in consumers:
                    sections.append(f"    Called from: {c['file']}:{c['line']} ({c['language']})")
            elif key.startswith("UNDEFINED:"):
                var = key.replace("UNDEFINED:", "")
                sections.append(f"  ENV VAR USED BUT NOT DEFINED: {var}")
                for c in consumers:
                    sections.append(f"    Used in: {c['file']}:{c['line']} ({c['language']})")

    if not sections:
        return ""

    # ── Wrap in a clear delimiter ────────────────────────────────────────
    header = (
        "═══ CODEGRAPH CONTEXT (auto-injected — DO NOT IGNORE) ═══\n"
        "The following was retrieved from a scan of the actual codebase.\n"
        "These files, endpoints, and connections are REAL and CURRENT.\n"
        "You MUST account for every item listed here before making changes.\n"
        "Do NOT create new files or endpoints that duplicate what already exists.\n"
        "Do NOT change function signatures or return shapes without updating all consumers.\n"
    )
    footer = "═══ END CODEGRAPH CONTEXT ═══"

    return header + "\n".join(sections) + "\n" + footer


# ════════════════════════════════════════════════════════════════════════════
# Prompt Optimizer
# ════════════════════════════════════════════════════════════════════════════

async def optimize_prompt(original_prompt: str, context_block: str) -> str:
    """Use a fast model to clean up the user's prompt.

    Takes the original (potentially rambling) prompt, and rewrites it
    to be clear and concise while preserving all intent. The context block
    is passed so the optimizer knows what's available but it does NOT
    rewrite the context block — only the user's prompt.

    Returns the cleaned prompt. If the optimizer call fails, returns
    the original prompt unchanged.
    """
    if not OPTIMIZER_MODEL:
        return original_prompt

    optimizer_instruction = (
        "You are a prompt optimizer for a coding agent. Your ONLY job is to "
        "rewrite the user's prompt to be clearer and more concise.\n\n"
        "Rules:\n"
        "- Preserve ALL intent from the original prompt. Do not add or remove tasks.\n"
        "- Remove redundancy, filler words, and unclear phrasing.\n"
        "- If the user mentions files or features, keep those references exact.\n"
        "- Output ONLY the rewritten prompt. No commentary, no explanation.\n"
        "- Keep it as short as possible while remaining unambiguous.\n"
        "- Do NOT rewrite or modify the context block — only the user's request.\n"
    )

    try:
        response = await litellm.acompletion(
            model=OPTIMIZER_MODEL,
            messages=[
                {"role": "system", "content": optimizer_instruction},
                {"role": "user", "content": f"Original prompt:\n{original_prompt}"}
            ],
            max_tokens=1000,
            temperature=0.1,  # Low temp for faithful rewriting
        )
        optimized = response.choices[0].message.content.strip()

        if optimized and len(optimized) > 10:
            logger.info(
                f"Prompt optimized: {len(original_prompt)} chars → {len(optimized)} chars"
            )
            return optimized
        else:
            logger.warning("Optimizer returned empty/short result, using original")
            return original_prompt

    except Exception as e:
        logger.error(f"Prompt optimization failed: {e}")
        return original_prompt


# ════════════════════════════════════════════════════════════════════════════
# The Middleware
# ════════════════════════════════════════════════════════════════════════════

class CodeGraphMiddleware(CustomLogger):
    """LiteLLM middleware that enriches every prompt with codegraph context.

    Pipeline:
        1. Extract the user's latest message from the request
        2. Pull keywords from it (RAKE or fallback)
        3. Run codegraph --trace for each keyword
        4. Format results into a structured context block
        5. Optionally optimize the user's prompt via a fast model
        6. Inject context block + cleaned prompt back into the request
        7. Forward to the target model
    """

    async def async_pre_call_hook(
        self,
        user_api_key_dict: dict,
        cache,
        data: dict,
        call_type: str
    ):
        messages = data.get("messages", [])
        if not messages:
            return data

        # Find the last user message
        user_msg_index = None
        user_content = None
        for i in range(len(messages) - 1, -1, -1):
            if messages[i].get("role") == "user":
                user_msg_index = i
                user_content = messages[i].get("content", "")
                break

        if not user_content or not isinstance(user_content, str):
            return data

        logger.info(f"Intercepted prompt ({len(user_content)} chars)")

        # ── Step 1: Extract keywords ─────────────────────────────────────
        keywords = extract_keywords_rake(user_content, top_n=8)
        if not keywords:
            logger.info("No meaningful keywords extracted, passing through")
            return data

        logger.info(f"Keywords: {keywords}")

        # ── Step 2: Run codegraph traces ─────────────────────────────────
        trace_result = trace_keywords(keywords)

        if not trace_result["nodes"]:
            logger.info("No codegraph results for keywords, passing through")
            return data

        logger.info(
            f"Codegraph found: {len(trace_result['nodes'])} nodes, "
            f"{len(trace_result['bridges'])} bridges, "
            f"{len(trace_result['broken'])} broken connections"
        )

        # ── Step 3: Format context block ─────────────────────────────────
        context_block = format_context_block(trace_result)

        # ── Step 4: Optimize prompt (optional) ───────────────────────────
        optimized_prompt = await optimize_prompt(user_content, context_block)

        # ── Step 5: Assemble and inject ──────────────────────────────────
        enriched_content = f"{context_block}\n\n{optimized_prompt}"

        data["messages"][user_msg_index]["content"] = enriched_content

        logger.info(
            f"Enriched prompt: {len(user_content)} → {len(enriched_content)} chars"
        )

        return data

    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time):
        """Post-call hook. Currently just logs completion.

        This is where you'd add response validation if you want it later —
        checking if the response references files that exist, or if it
        creates duplicates of things codegraph already found.
        """
        logger.info("Agent call completed successfully")

    async def async_log_failure_event(self, kwargs, response_obj, start_time, end_time):
        """Log failed calls."""
        logger.error(f"Agent call failed: {response_obj}")


# ════════════════════════════════════════════════════════════════════════════
# Register
# ════════════════════════════════════════════════════════════════════════════

proxy_handler = CodeGraphMiddleware()
