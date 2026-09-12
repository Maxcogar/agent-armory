#!/usr/bin/env bash
# Claims (Step 13, T-13-1): `git log --numstat -M` prints a renamed file's
# path field as `old => new`, and a rename inside a directory as the brace
# form `prefix{old => new}suffix`, with an empty side when a file moves into
# a new directory — three shapes the miner must expand into both identities.
set -u
d=$(mktemp -d); trap 'rm -rf "$d"' EXIT
cd "$d" && git init -q && git config user.email p@x && git config user.name p
mkdir -p src/utils && echo one > a.txt && echo two > src/utils/c.txt && echo three > d.txt
git add -A && git commit -q -m seed
git mv a.txt b.txt && mkdir -p src/other && git mv src/utils/c.txt src/other/c.txt && mkdir -p dir && git mv d.txt dir/d.txt
git commit -q -m renames
git log --no-merges --numstat -M --format=%H%x00%at%x00 -1 | awk -F'\t' 'NF==3 {print "numstat path field: " $3}' | sort
