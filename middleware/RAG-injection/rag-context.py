#!/usr/bin/env python3
"""UserPromptSubmit hook — injects codebase-rag search results as context.

Reads the user's prompt from stdin JSON, queries the existing codebase-rag
ChromaDB collections, and outputs formatted results to stdout.
"""

import json
import os
import sys

# ── Encoding fix for Windows ─────────────────────────────────
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── Config ──────────────────────────────────────────────────
MIN_PROMPT_LENGTH = 10
NUM_RESULTS = 3
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAG_SERVER_PATH = os.path.join(
    os.path.expanduser("~"),
    "Documents", "agent-armory", "mcp-servers", "codebase-rag", "mcp-server-python"
)


def main():
    # Read prompt from stdin JSON
    try:
        data = json.load(sys.stdin)
        prompt = data.get("prompt", "")
    except (json.JSONDecodeError, KeyError):
        return

    # Skip short/trivial prompts
    if len(prompt.strip()) < MIN_PROMPT_LENGTH:
        return

    # Add RAG server to path so we can import its modules
    if RAG_SERVER_PATH not in sys.path:
        sys.path.insert(0, RAG_SERVER_PATH)

    try:
        from config import restore_context
        from query import check_constraints
    except ImportError:
        return

    # Restore project context from .rag/config.json
    ctx = restore_context(PROJECT_ROOT)
    if ctx is None:
        return

    # Query all collections
    try:
        results = check_constraints(ctx, prompt, NUM_RESULTS)
    except Exception:
        return

    constraints = results.get("constraints", [])
    patterns = results.get("patterns", [])
    examples = results.get("examples", [])

    if not constraints and not patterns and not examples:
        return

    # Format output
    lines = [
        f"[RAG CONTEXT] {results.get('summary', '')}",
        "",
    ]

    if constraints:
        lines.append("CONSTRAINTS:")
        for c in constraints:
            path = c.get("filePath", "unknown")
            relevance = c.get("relevance", 0)
            content = c.get("content", "").replace("\n", " ")[:200]
            lines.append(f"- [{path}] {content} (relevance: {relevance})")
        lines.append("")

    if patterns:
        lines.append("PATTERNS:")
        for p in patterns:
            path = p.get("filePath", "unknown")
            relevance = p.get("relevance", 0)
            content = p.get("content", "").replace("\n", " ")[:200]
            lines.append(f"- [{path}] {content} (relevance: {relevance})")
        lines.append("")

    if examples:
        lines.append("CODE:")
        for e in examples:
            path = e.get("filePath", "unknown")
            relevance = e.get("relevance", 0)
            content = e.get("content", "").replace("\n", " ")[:150]
            lines.append(f"- [{path}] {content} (relevance: {relevance})")
        lines.append("")

    print("\n".join(lines))


if __name__ == "__main__":
    main()
