#!/usr/bin/env bash
# Claims (Step 13, T-13-1): git's `core.quotePath` (default ON) C-quotes a
# `--numstat` path field containing a byte >= 0x80 (accented Latin, CJK,
# Cyrillic, emoji), wrapping it in double quotes and octal-escaping the bytes,
# so the field no longer equals the raw filesystem path. `-c core.quotePath=false`
# emits that field as raw UTF-8, but still C-quotes a path containing a literal
# double-quote, backslash, tab, or newline (a field that then begins with `"`).
# The miner must run its `git log` with `core.quotePath=false` and route any
# still-quoted field to `miner_unparsed_numstat`, never storing it as a literal.
set -u
d=$(mktemp -d); trap 'rm -rf "$d"' EXIT
cd "$d" && git init -q && git config user.email p@x && git config user.name p && git config commit.gpgsign false
printf x > plain.txt
printf x > 'café.txt'
printf x > 'a\b.txt'
git add -A && git commit -q -m seed
echo "core.quotePath: $(git config --get core.quotePath || echo '(unset = default ON)')"
echo "-- default (ON): numstat path fields --"
git log --no-merges --numstat --format= -1 | awk -F'\t' 'NF==3 {print $3}' | LC_ALL=C sort
echo "-- core.quotePath=false: numstat path fields --"
git -c core.quotePath=false log --no-merges --numstat --format= -1 | awk -F'\t' 'NF==3 {print $3}' | LC_ALL=C sort
