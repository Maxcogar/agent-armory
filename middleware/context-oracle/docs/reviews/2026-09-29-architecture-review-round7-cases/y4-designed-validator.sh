#!/bin/sh
# y4-designed-validator.sh <work> <copy> — R7 case Y4: the round-6 test run with a tuning
# validator whose half-life floor is AD-13's designed relation (365.25 x 5 / 1022, about
# 1.79 days at the seeded horizon) instead of HEAD's 37, as AD-24 says the
# implementation's run of the test uses. <copy> is a fresh copy of <work> whose HEAD
# build's dist/src/stores/dao/tuning.js has only that one condition changed.
set -u
W="$1"; C="$2"; R=/home/user/agent-armory/middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6
rm -rf "$C"; mkdir -p "$C"
for d in 59cc05c HEAD b229c04 oracleA oracleB oracleC repoA repoB repoC homeA homeB homeC; do cp -a "$W/$d" "$C/"; done
python3 -c "import sys;p=sys.argv[1];s=open(p).read();a='if (!(halfLife >= 37)) {';assert s.count(a)==1;open(p,'w').write(s.replace(a,'if (!(halfLife >= 365.25 * 5 / 1022)) {'))" "$C/HEAD/middleware/context-oracle/ctxoracle/dist/src/stores/dao/tuning.js"
unset GIT_DIR GIT_WORK_TREE
node --no-warnings "$R/test-rebuild.mjs" "$C"; echo "[test exit $?]"
