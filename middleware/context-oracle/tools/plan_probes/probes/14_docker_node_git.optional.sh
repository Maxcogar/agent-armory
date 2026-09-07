#!/usr/bin/env bash
# Claim (Step 38, T38-25): node:22-bookworm derives from buildpack-deps:bookworm, whose scm layer installs git; node:22-bookworm-slim installs no git.
g(){ curl -sS --max-time 30 "$1" || { echo "SKIPPED: network"; exit 0; }; }
a=$(g https://raw.githubusercontent.com/nodejs/docker-node/main/22/bookworm/Dockerfile); [ -z "$a" ] && { echo "SKIPPED: network"; exit 0; }
echo "node:22-bookworm FROM: $(printf '%s' "$a" | grep -m1 '^FROM')"
b=$(g https://raw.githubusercontent.com/docker-library/buildpack-deps/master/debian/bookworm/Dockerfile); echo "buildpack-deps:bookworm FROM: $(printf '%s' "$b" | grep -m1 '^FROM')"
c=$(g https://raw.githubusercontent.com/docker-library/buildpack-deps/master/debian/bookworm/scm/Dockerfile); echo "buildpack-deps:bookworm-scm installs git: $(printf '%s' "$c" | grep -q '^\s*git' && echo yes || echo no)"
d=$(g https://raw.githubusercontent.com/nodejs/docker-node/main/22/bookworm-slim/Dockerfile); echo "node:22-bookworm-slim installs git: $(printf '%s' "$d" | grep -qE '^[[:space:]]*git([[:space:]]|\\)' && echo yes || echo no)"
