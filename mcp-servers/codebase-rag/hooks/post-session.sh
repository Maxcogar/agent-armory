#!/bin/bash
# Auto-index RAG after coding sessions

echo "📦 Updating RAG index..."
cd rag/scripts
python index_codebase.py > /dev/null 2>&1 &

# Run in background, don't block
echo "✅ RAG indexing started in background"