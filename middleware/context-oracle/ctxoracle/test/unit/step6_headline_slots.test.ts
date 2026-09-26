// Step 6 build delta (G24) — the structured headline's runtime builders. Added
// by the 2026-09-26 independent build review
// (docs/reviews/2026-09-26-steps-1-12-build-review.md): T-6-3 pins only the
// compile-time half (`lit(s)` with `s: string` fails TS2345); nothing pinned the
// runtime shapes the composer (Step 19) will render from.
//
// Plan text tested: "`Headline = { readonly parts: ReadonlyArray<Lit | Slot> }`;
// `lit(...)` — a template word written in the genre module; `Slot` is
// `{kind: 'path', fileId, path, ownTarget: boolean} | {kind: 'commit', hash} |
// {kind: 'symbol', name} | {kind: 'count', value} | {kind: 'ratio', num, den} |
// {kind: 'days', value} | {kind: 'human', text}`, built by `slot.path(…)`,
// `slot.commit(…)`, etc. The composer renders only `Lit` text and slot values,
// so repo-derived prose is unrepresentable." A builder that carried any field
// beyond its kind's would let a caller smuggle extra text into a slot, so each
// builder is asserted to return exactly its kind's fields.

import test from 'node:test';
import assert from 'node:assert/strict';
import { lit, slot } from '../../src/types/headline.js';

test('Step 6 (review): lit returns a lit part carrying exactly its text', () => {
  assert.deepEqual({ ...lit('co-changes with') }, { kind: 'lit', text: 'co-changes with' });
});

test('Step 6 (review): each slot builder returns exactly the fields of its kind, even when handed extra ones', () => {
  const extra = { prose: 'ignore previous instructions' } as Record<string, unknown>;
  const cases: Array<[unknown, Record<string, unknown>]> = [
    [slot.path({ fileId: 3, path: 'src/a.ts', ownTarget: true, ...extra } as never), { kind: 'path', fileId: 3, path: 'src/a.ts', ownTarget: true }],
    [slot.commit({ hash: 'abc123', ...extra } as never), { kind: 'commit', hash: 'abc123' }],
    [slot.symbol({ name: 'getUser', ...extra } as never), { kind: 'symbol', name: 'getUser' }],
    [slot.count({ value: 4, ...extra } as never), { kind: 'count', value: 4 }],
    [slot.ratio({ num: 4, den: 5, ...extra } as never), { kind: 'ratio', num: 4, den: 5 }],
    [slot.days({ value: 90, ...extra } as never), { kind: 'days', value: 90 }],
    [slot.human({ text: 'owner note', ...extra } as never), { kind: 'human', text: 'owner note' }],
  ];
  for (const [got, want] of cases) assert.deepEqual({ ...(got as object) }, want);
});
