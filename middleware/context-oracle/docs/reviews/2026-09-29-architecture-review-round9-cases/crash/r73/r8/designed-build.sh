#!/bin/sh
# designed-build.sh <work-dir> — makes <work-dir>/HEAD-designed: a copy of the HEAD build
# whose tuning validator's half-life floor is AD-13's designed relation,
# 365.25 x miner.horizon_years / 1022 (about 1.79 days at the seeded 5 years), in place
# of HEAD's 37 days. Nothing else changes. It stands in for the build's own validator,
# which does not exist yet (R7-1; the round-7 reviewer's Y4 made the same one-condition
# change with the horizon written as 5).
set -eu
W="$(cd "$1" && pwd)"
rm -rf "$W/HEAD-designed"; cp -a "$W/HEAD" "$W/HEAD-designed"
F="$W/HEAD-designed/middleware/context-oracle/ctxoracle/dist/src/stores/dao/tuning.js"
python3 -c "import sys;p=sys.argv[1];s=open(p).read();a='if (!(halfLife >= 37)) {';assert s.count(a)==1;open(p,'w').write(s.replace(a,\"if (!(halfLife >= 365.25 * v('miner.horizon_years') / 1022)) {\"))" "$F"
diff "$W/HEAD/middleware/context-oracle/ctxoracle/dist/src/stores/dao/tuning.js" "$F" || true
