#!/usr/bin/env bash
# Prepares the probe layout: the Step 1 package skeleton's manifest, lockfile,
# and tsconfig installed with `npm ci` into the directory run-plan-probes.mjs
# passes as $1. Every probe runs with that directory as its cwd.
set -euo pipefail
dest="$1"
here="$(cd "$(dirname "$0")" && pwd)"
cp "$here/package.json" "$here/package-lock.json" "$here/tsconfig.json" "$dest/"
mkdir -p "$dest/src" "$dest/test"
cd "$dest" && npm ci --loglevel error
