// T-5-1 — Repo-key derivation: the four rules over four real fixture
// repositories, plus URL normalization as a decision/equivalence table
// (Step 5). Real `git`; no doubles. Asserts no specific hash value — only the
// mode, the identity string, and the equal/distinct relationships.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { generateFixture } from '../fixtures/generate.js';
import { resolveRepoKey, normalizeRemoteUrl } from '../../src/identity/repo_key.js';

/** Generate a fixture into a fresh temp base and run `fn` against its path. */
function withFixture<T>(name: string, fn: (dir: string) => T): T {
  const base = mkdtempSync(path.join(tmpdir(), `ctxoracle-repokey-${name}-`));
  const dir = path.join(base, name);
  try {
    generateFixture(name, dir);
    return fn(dir);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

test('T-5-1a: full history keys on a root commit, deterministically, distinct from its shallow clone', () => {
  const full = withFixture('repo-key-full', (dir) => resolveRepoKey(dir));
  assert.equal(full.mode, 'commit');
  assert.match(full.identity, /^[0-9a-f]{40}$/, 'identity is a root commit hash');
  assert.equal(full.diagnostic, undefined, 'a clean full-history key carries no diagnostic');

  // Same deterministic fixture generated again yields the same key.
  const full2 = withFixture('repo-key-full', (dir) => resolveRepoKey(dir));
  assert.equal(full2.key, full.key, 'the full-history key is stable across runs');

  // A shallow clone of the same repo must NOT key identically (it keys on URL).
  const shallow = withFixture('repo-key-shallow', (dir) => resolveRepoKey(dir));
  assert.notEqual(shallow.key, full.key, 'full and shallow clones do not collide');
});

test('T-5-1b: a shallow repo with an origin keys on the normalized URL', () => {
  const r = withFixture('repo-key-shallow', (dir) => resolveRepoKey(dir));
  assert.equal(r.mode, 'url');
  assert.equal(r.identity, 'github.com/Owner/Repo');
});

test('T-5-1c: a shallow repo with no origin falls back to path mode', () => {
  const r = withFixture('repo-key-shallow-no-origin', (dir) => resolveRepoKey(dir));
  assert.equal(r.mode, 'path');
});

test('T-5-1d: a non-git directory is path-keyed through the failure branch (exit 128)', () => {
  const r = withFixture('repo-key-nongit', (dir) => resolveRepoKey(dir));
  assert.equal(r.mode, 'path');
  assert.ok(r.diagnostic, 'a fallback carries a diagnostic');
  assert.match(r.diagnostic!.detail, /128/, 'the diagnostic names git exit 128');
});

test('T-5-1e: URL normalization — five forms collapse; port and path case stay distinct', () => {
  const oneIdentity = [
    'git@github.com:Owner/Repo.git',
    'ssh://git@github.com/Owner/Repo.git',
    'https://user@github.com/Owner/Repo/',
    'https://GITHUB.com/Owner/Repo',
    'https://github.com/Owner/Repo.git',
  ];
  for (const url of oneIdentity) {
    assert.equal(normalizeRemoteUrl(url), 'github.com/Owner/Repo', url);
  }
  // An explicit port is kept -> distinct identity.
  assert.equal(normalizeRemoteUrl('https://github.com:8443/Owner/Repo'), 'github.com:8443/Owner/Repo');
  // Path case is preserved -> distinct identity.
  assert.equal(normalizeRemoteUrl('https://github.com/owner/repo'), 'github.com/owner/repo');
  assert.notEqual(normalizeRemoteUrl('https://github.com/owner/repo'), 'github.com/Owner/Repo');
  // A bare local path / file URL is not a URL identity.
  assert.equal(normalizeRemoteUrl('/srv/git/repo.git'), null);
  assert.equal(normalizeRemoteUrl('file:///srv/git/repo.git'), null);
});
