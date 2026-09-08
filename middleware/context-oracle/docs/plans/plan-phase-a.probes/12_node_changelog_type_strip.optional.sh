#!/usr/bin/env bash
# Claim (Step 1, §11.4): the Node 22 changelog dates 22.16.0 to 2025-05-21 and 22.18.0 (type stripping enabled by default) to 2025-07-31.
f=$(curl -sS --max-time 30 https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V22.md) || { echo "SKIPPED: network"; exit 0; }
[ -z "$f" ] && { echo "SKIPPED: network"; exit 0; }
printf '%s\n' "$f" | grep -o "## 2025-07-31, Version 22.18.0\|## 2025-05-21, Version 22.16.0\|#### Type stripping is enabled by default" | sort -u
