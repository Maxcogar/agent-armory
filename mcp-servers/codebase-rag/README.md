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
files modified between sessions. While a server owns the project's index
the hook exits without doing anything (see "One writer per index" below).
Add to `~/.claude/settings.json`:

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
| `RAG_WATCHER_DEBOUNCE_MS` | Watcher debounce window (default `500`; min `50`). Increase on high-latency network FS. |
| `RAG_MAX_FILE_BYTES` | Skip files larger than this (default `1048576` = 1 MB). |
| `RAG_MAX_MEMORY_GB` | Hard memory cap per server/reindex process (default `4`; `0` disables). Enforced on Windows (Job Object, committed memory) and Linux (`RLIMIT_DATA`); not enforced on macOS. |
| `RAG_LOG_LEVEL` | `DEBUG` / `INFO` / `WARNING` / `ERROR` (default `INFO`). |
| `XDG_CACHE_HOME` | Override the Linux cache base. macOS uses `~/Library/Caches`; Windows uses `%LOCALAPPDATA%`. |

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

**Corrupt index**: every persisted index is checked before it is opened —
each HNSW segment's `header.bin` against the invariants of the on-disk
format, then a probe query on every collection. A corrupt index is deleted
and rebuilt from the project tree automatically; the log says
`discarding and rebuilding index for ...: <reason>`. Corruption comes from
a process being killed (or the machine crashing) while ChromaDB is writing
segment files, which it does in place. Unchecked, a corrupt header makes
chroma-hnswlib allocate memory sized from garbage fields — tens of GB from
a few-MB index. `RAG_MAX_MEMORY_GB` is the backstop: an allocation past the
cap fails inside the process instead of exhausting the machine.

**One writer per index**: ChromaDB does not support several processes
writing one index directory. The first server (or Stop-hook reindex) to
start on a project takes `writer.lock` in the project's cache dir and is
the only process that builds, rebuilds, or watches. Other servers on the
same project answer queries read-only from what has been persisted (they
do not see the owner's later updates until they restart or take over) and
take ownership when the owner exits. The OS releases the lock when the
owning process exits for any reason, including a crash.

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
2. Best-effort copies the legacy `.rag/collections/` directory into the
   cache dir alongside it. If the copy fails (different ChromaDB on-disk
   format, partial write, etc.) the server logs a clear warning and the
   index is rebuilt on the next query.
3. Leaves the legacy `.rag/` directory in place — nothing is deleted.

Once your projects have been touched at least once with the new server,
you can remove the legacy directories at your leisure:

```bash
rm -rf /path/to/each/project/.rag
```

## What's in the cache dir

```
~/.cache/codebase-rag/<sha1[:16]>/
├── config.json        # project settings (paths, filters, custom sources)
├── writer.lock        # held by the process that owns this index
└── collections/       # ChromaDB persistent collections
```

Safe to delete — everything rebuilds from the project tree.
