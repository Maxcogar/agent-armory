#!/bin/sh
# mkrepo.sh <dir> — a small throwaway git repository with co-changing files and
# fixed dates, so every run builds the same history.
set -eu
D="$1"; rm -rf "$D"; mkdir -p "$D"; cd "$D"
git init -q -b main .
git config user.email t@example.invalid; git config user.name T; git config commit.gpgsign false
mkdir -p src test
commit() { GIT_AUTHOR_DATE="2026-09-0${1}T12:00:00Z" GIT_COMMITTER_DATE="2026-09-0${1}T12:00:00Z" git commit -q -m "$2"; }
printf 'export const a = 1;\n' > src/a.ts; printf 'export const b = 2;\n' > src/b.ts
printf 'import { a } from "../src/a";\n' > test/a.test.ts
git add .; commit 1 "initial"
for n in 2 3 4 5; do
  printf "export const a = $n;\n" > src/a.ts; printf "export const b = $n;\n" > src/b.ts
  git add .; commit $n "change a and b $n"
done
printf 'export const c = 1;\n' > src/c.ts; git add .; commit 6 "fix: add c"
printf 'export const c = 2;\n' > src/c.ts; git add .; commit 7 "fix c again"
git log --oneline | cat
