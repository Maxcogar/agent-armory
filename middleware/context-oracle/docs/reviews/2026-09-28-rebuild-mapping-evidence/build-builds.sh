#!/bin/sh
# build-builds.sh <work-dir> <repo-root>
# Extracts and compiles the ctxoracle builds the evidence uses, each at
# <work-dir>/<commit>/middleware/context-oracle/ctxoracle/:
#   b229c04 — the build that introduced the one migration set HEAD still ships;
#   59cc05c — the last build on the 4dd0f00/4e070ce migration set, and the first
#             that registers `tune`, `correct` and `note`;
#   HEAD    — this checkout's commit (its init, and the tuning module the
#             prototype validates and reads with).
# node_modules is symlinked from <repo-root>'s checkout (never installed).
set -eu
W="$1"; REPO="$2"
NM="$REPO/middleware/context-oracle/ctxoracle/node_modules"
test -d "$NM" || { echo "no $NM" >&2; exit 2; }
mkdir -p "$W"
for c in b229c04 59cc05c HEAD; do
  d="$W/$c"; rm -rf "$d"; mkdir -p "$d"
  git -C "$REPO" archive "$c" middleware/context-oracle/ctxoracle | tar -x -C "$d"
  ln -s "$NM" "$d/middleware/context-oracle/ctxoracle/node_modules"
  echo "== $c: $(git -C "$REPO" rev-parse "$c")"
  (cd "$d/middleware/context-oracle/ctxoracle" && npm run build >/dev/null 2>&1; echo "npm run build exit $?")
done
