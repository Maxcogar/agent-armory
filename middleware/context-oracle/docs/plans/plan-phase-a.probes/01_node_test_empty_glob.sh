#!/usr/bin/env bash
# Claim (Step 1, D-plan-3): `node --test` with a pattern matching no file exits 0 with zero tests.
cd "$PROBE_LAYOUT"; mkdir -p dist/test/one; printf 'import test from "node:test"; test("x", () => {});\n' > dist/test/one/a.test.js
out=$(node --test 'dist/test/nomatch/**/*.test.js' 2>&1); code=$?
echo "empty-glob: exit=$code tests=$(printf '%s' "$out" | grep -o '^# tests [0-9]*' | awk '{print $3}')"
out=$(node --test 'dist/test/one/**/*.test.js' 2>&1); code=$?
echo "matching-glob: exit=$code tests=$(printf '%s' "$out" | grep -o '^# tests [0-9]*' | awk '{print $3}')"
