#!/usr/bin/env bash
# Claims (Step 1, T-1-1, §11.4): `npm ci` refuses to run when no
# package-lock.json is present — before resolving anything — so a checkout
# without a committed lockfile fails every `npm ci` step unconditionally.
set -u
d=$(mktemp -d); trap 'rm -rf "$d"' EXIT
cp "$PROBE_LAYOUT/package.json" "$d/"
( cd "$d" && npm ci --no-audit --no-fund >"$d/out" 2>&1 ); rc=$?
echo "npm ci with package.json and no package-lock.json: exit $rc; EUSAGE: $(grep -q 'EUSAGE' "$d/out" && echo true || echo false); message names package-lock.json: $(grep -q 'package-lock.json' "$d/out" && echo true || echo false)"
