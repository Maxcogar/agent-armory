#!/bin/bash
# run.sh <mode> <rows> <runs> [chunkMs] [gapMs] — each run on a fresh copy of base.db
cd "$(dirname "$0")"
export NODE_NO_WARNINGS=1
for i in $(seq 1 "$3"); do
  cp base.db b.db; rm -f b.db-wal b.db-shm
  node rescale_bench.mjs "$1" b.db "$2" "${4:-50}" "${5:-30}"
done
