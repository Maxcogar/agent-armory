// T-6-2 — the JSONL fault writer appends (survives a writer restart), writes at
// mode 0o600, and every line parses (Step 6). Real filesystem; no doubles.
// appendFault is stateless (each call opens the file fresh), so the third call
// is exactly the "after re-opening the writer" case.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { appendFault } from '../../src/diag/jsonl.js';

test('T-6-2: appends accumulate across re-opens; mode is 0o600; every line parses', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-jsonl-'));
  try {
    appendFault(dir, { code: 'store_busy', detail: { attempt: 2 }, session: 'sess-1' });
    appendFault(dir, { code: 'latency_breach', detail: 'ms=3000', session: 'sess-1' });
    // A fresh open — the "writer restart" case — must not truncate the prior two.
    appendFault(dir, { code: 'index_stale', detail: [1, 2, 3], session: 'sess-1' });

    const file = path.join(dir, 'sess-1.jsonl');
    const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.length > 0);
    assert.equal(lines.length, 3, 'all three appends are present');

    const parsed = lines.map((l) => JSON.parse(l) as { code: string; session: string; detail: unknown });
    assert.deepEqual(
      parsed.map((p) => p.code),
      ['store_busy', 'latency_breach', 'index_stale']
    );
    assert.deepEqual(parsed[0]!.detail, { attempt: 2 });
    assert.deepEqual(parsed[2]!.detail, [1, 2, 3]);
    for (const p of parsed) assert.equal(p.session, 'sess-1');

    assert.equal(statSync(file).mode & 0o777, 0o600, 'file mode is 0o600');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
