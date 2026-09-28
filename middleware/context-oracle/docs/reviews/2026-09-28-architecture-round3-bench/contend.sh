#!/bin/bash
# contend.sh <mode> <rows> [chunkMs] [gapMs] — a fresh store; the waiter runs
# for the whole pass (started 300 ms before it); prints both results.
cd "$(dirname "$0")"
export NODE_NO_WARNINGS=1
cp base.db b.db; rm -f b.db-wal b.db-shm
node waiter.mjs b.db ${WAITMS:-4000} > waiter.out &
W=$!
sleep 0.3
node rescale_bench.mjs "$1" b.db "$2" "${3:-0}" "${4:-30}"
wait $W; echo "waiter $(cat waiter.out)"
