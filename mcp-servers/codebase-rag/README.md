# Codebase RAG MCP — Setup Guide

Semantic search over whatever project you're working in, exposed to
agents via two MCP tools (`rag_search`, `rag_query_impact`). Once
installed at the user level, it works in every project automatically:

- Detects the project root by walking up from the cwd to the first
  `.git`, `package.json`, `pyproject.toml`, `Cargo.toml`, or `go.mod`.
- Builds an index in `~/.cache/codebase-rag/<hash>/` the first time you
  query a new project. Nothing is written inside the project tree.
- Runs a filesystem watcher that incrementally re-indexes any file as
  it changes — Claude edits, git pulls, format-on-save, codemod scripts,
  whatever — so search results match the current tree.

## Install

### 1. Install dependencies

```bash
pip install -r mcp-server-python/requirements.txt
```

### 2. Register the MCP server (user-level, once)

Add this to `~/.claude/settings.json` (or your global Claude Code MCP
config) so every project inherits it:

```json
{
  "mcpServers": {
    "codebase-rag": {
      "command": "python",
      "args": ["/absolute/path/to/codebase-rag/mcp-server-python/server.py"]
    }
  }
}
```

That's it. No per-project setup. Open Claude Code in any project and
the tools are available.

## Optional: Stop hook

The in-process watcher already keeps the index live while the server is
running. The Stop hook below is a belt-and-suspenders safety net for
files modified between sessions. Add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "command": "/absolute/path/to/codebase-rag/hooks/post-session.sh"
      }
    ]
  }
}
```

## Power-user overrides

| Environment variable | Effect |
|---|---|
| `RAG_PROJECT_ROOT` | Skip auto-detection; treat this path as the project root. |
| `XDG_CACHE_HOME` | Override the cache base (defaults to `~/.cache`). |

## Troubleshooting

**Server won't start, log says "Missing dependencies"**: run the
`pip install` command from step 1. The server prints the exact command
it needs in the same line.

**Stale results for one project**: each project's cache lives at
`<cache-base>/codebase-rag/<sha1[:16]>/` (Linux: `~/.cache/...`,
macOS: `~/Library/Caches/...`, Windows: `%LOCALAPPDATA%\...`). To find
the directory for a single project without leaking through every cache:

```bash
python -c "import hashlib, os; print(hashlib.sha1(os.path.abspath('PATH/TO/PROJECT').encode()).hexdigest()[:16])"
```

Delete that one subdirectory; the next query rebuilds. Nuking the whole
`codebase-rag/` directory is also safe — every project rebuilds on
demand — it's just heavier.

**First query in a project is slow**: expected. The first call builds
the index. Subsequent queries are instant.

**First-run network failure**: ChromaDB's default embedding model
(`all-MiniLM-L6-v2`) is downloaded the first time the server starts.
The server warms it up at startup and prints an actionable message if
the download fails (offline, corporate proxy, transient network). To
pre-cache it manually:

```bash
python -c "from chromadb.utils.embedding_functions import DefaultEmbeddingFunction; DefaultEmbeddingFunction()(['warmup'])"
```

## Migrating from the legacy `.rag/` layout

Older versions of this tool wrote `.rag/config.json` and a ChromaDB
collection inside each project. The current version:

1. Reads any legacy `.rag/config.json` it finds and copies it into the
   cache dir on the first call.
2. Builds a fresh ChromaDB in the cache dir (legacy collections are not
   migrated — they were stored with the old chromadb version's format
   and rebuild quickly).
3. Leaves the legacy `.rag/` directory in place.

Once your projects have been touched at least once with the new server,
you can remove the legacy directories at your leisure:

```bash
rm -rf /path/to/each/project/.rag
```

## What's in the cache dir

```
~/.cache/codebase-rag/<sha1[:16]>/
├── config.json        # project settings (paths, filters, custom sources)
└── collections/       # ChromaDB persistent collections
```

Safe to delete — everything rebuilds from the project tree.
