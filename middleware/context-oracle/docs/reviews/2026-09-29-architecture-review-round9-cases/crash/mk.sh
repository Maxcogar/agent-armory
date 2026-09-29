#!/bin/sh
# mk.sh <name> <old> <new> — a copy of the round-8 evidence directory with one exact
# replacement in rebuild.mjs (the same replacement mutants.sh makes for that mutant).
set -eu
C="$(cd "$(dirname "$0")" && pwd)"; R=/home/user/agent-armory/middleware/context-oracle/docs/reviews
rm -rf "$C/$1"; mkdir -p "$C/$1"; cp -r "$R/2026-09-29-rebuild-mapping-evidence-r8" "$C/$1/r8"; ln -s "$R/2026-09-28-rebuild-mapping-evidence" "$C/$1/2026-09-28-rebuild-mapping-evidence"
python3 -c "
import sys
p=sys.argv[1]; s=open(p).read(); a,b=sys.argv[2],sys.argv[3]
assert s.count(a)==1, a
open(p,'w').write(s.replace(a,b,1))" "$C/$1/r8/rebuild.mjs" "$2" "$3"
