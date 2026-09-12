#!/usr/bin/env bash
# Claims (Step 5, T-5-1): in a directory that is not inside any repository,
# `git rev-parse --is-inside-work-tree` does not print `false` — it fails
# (exit 128, empty stdout); `false` is printed only from inside a `.git`
# directory, and `true` from a work tree.
set -u
d=$(mktemp -d); trap 'rm -rf "$d"' EXIT
export GIT_CEILING_DIRECTORIES="$(dirname "$d")"
out=$(cd "$d" && git rev-parse --is-inside-work-tree 2>/dev/null); rc=$?
echo "non-git directory: exit $rc; stdout ${out:-<empty>}"
git -C "$d" init -q && git -C "$d" config user.email p@x && git -C "$d" config user.name p
out=$(cd "$d/.git" && git rev-parse --is-inside-work-tree 2>/dev/null); rc=$?
echo "inside .git/: exit $rc; stdout ${out:-<empty>}"
out=$(cd "$d" && git rev-parse --is-inside-work-tree 2>/dev/null); rc=$?
echo "work tree: exit $rc; stdout ${out:-<empty>}"
