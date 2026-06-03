import { describe, it, expect, afterEach } from 'vitest';
import { fixturePackage } from '../helpers.js';
import { buildInjectionBlock } from '../../src/core/services/agent-harness.js';
import { renderPackageMarkdown } from '../../src/adapters/markdown/package-markdown-writer.js';
import { buildReadCard, buildEditCard } from '../../src/core/services/context-card.js';
import { TreeSitterParserAdapter } from '../../src/adapters/tree-sitter/index.js';
import type { SqliteStorage } from '../../src/adapters/storage/sqlite-storage.js';

let open: SqliteStorage | null = null;
afterEach(() => { open?.close(); open = null; });

// Conformance-pressure phrases that must NOT appear (Expert Standard / spec D3).
const BANNED = /reuse it instead|keep (their|the) contracts? intact|prefer reusing|conform to (the|this)|follow the existing pattern|respect the (existing|dependents)|must follow the existing/i;

describe('methodology alignment — existing code is evidence, not a mandate (spec D3 / Expert Standard)', () => {
  it('the injected briefing contains no conformance directives', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    const block = buildInjectionBlock(pkg);
    expect(block).not.toMatch(BANNED);
    expect(block).toMatch(/evidence/i); // it frames things as evidence
  });

  it('the markdown package contains no conformance directives', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    expect(renderPackageMarkdown(pkg)).not.toMatch(BANNED);
  });

  it('existing patterns are marked not-required-to-follow', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    for (const p of pkg.existing_patterns) expect(p.required_to_follow).toBe(false);
  });

  it('read and edit cards present dependents as evidence, not "keep intact"', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    const snap = pkg.repository.snapshot_id;
    const read = buildReadCard(storage, snap, 'src/state/store.ts') ?? '';
    const edit = (await buildEditCard(storage, snap, new TreeSitterParserAdapter(), 'src/state/store.ts', 'export function getPreference(k){return k}')) ?? '';
    expect(read + edit).not.toMatch(BANNED);
    expect(edit).toMatch(/replace|deliberately|account for/i);
  });
});
