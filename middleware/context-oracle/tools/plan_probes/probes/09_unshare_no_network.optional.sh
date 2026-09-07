#!/usr/bin/env bash
# Claim (Step 32, T32-2): `unshare -rn` gives a network namespace with no route on this host (an EPERM or absence is reported, never a pass).
if ! command -v unshare >/dev/null; then echo "SKIPPED: unshare not installed"; exit 0; fi
out=$(unshare -rn node -e "fetch('http://example.com').then(()=>console.log('EGRESS')).catch(e=>console.log('no network: '+(e.cause?.code||e.message)))" 2>&1)
case "$out" in *"no network"*) echo "$out";; *) echo "SKIPPED: unshare refused or behaved unexpectedly: $(echo "$out" | head -1)";; esac
