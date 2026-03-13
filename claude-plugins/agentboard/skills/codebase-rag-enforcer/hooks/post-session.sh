#!/bin/bash
# Auto-index RAG after coding sessions via MCP server CLI mode

echo "Updating RAG index..."
cd "$(git rev-parse --show-toplevel)" && python "C:/Users/maxco/Documents/agent-armory/mcp-servers/codebase-rag/mcp-server-python/server.py" --index > /dev/null 2>&1 &

# Run in background, don't block
echo "RAG indexing started in background"
