#!/usr/bin/env bash
# Fixture probe: the executed claim the fixture's section 11 rests on. It runs
# in the layout directory with PROBE_DIR and PROBE_LAYOUT set.
set -euo pipefail
test -n "$PROBE_DIR" && test -d "$PROBE_LAYOUT"
node -e 'const cfg = {threshold: 100}; console.log("threshold:", cfg.threshold)'
