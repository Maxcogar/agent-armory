// test_map DAO (Step 9). Maps test files to the source regions they cover (a
// glob), replaced per test file. Provenance required (a knowledge table).
import type { Store } from '../adapter.js';
import { provCreateValues, type Provenance } from '../../security/trust.js';

export interface TestMapInput {
  regionGlob: string;
  source: string;
}

export interface TestMapDao {
  replaceForFile(testFileId: number, rows: TestMapInput[], prov: Provenance): void;
  /** Test file ids whose region glob matches `path`. */
  coveringTests(path: string): number[];
}

export function testMapDao(store: Store): TestMapDao {
  return {
    replaceForFile(testFileId, rows, prov) {
      const now = Date.now();
      const p = provCreateValues(prov, now, now);
      store.transaction(() => {
        store.prepare('DELETE FROM test_map WHERE test_file = ?').run(testFileId);
        const ins = store.prepare(
          `INSERT INTO test_map(test_file, region_glob, source,
             prov_kind, prov_ref, trust, injection_suspect, created_at, updated_at)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        for (const r of rows) ins.run(testFileId, r.regionGlob, r.source, ...p);
      });
    },
    coveringTests(path) {
      return (
        store
          .prepare('SELECT DISTINCT test_file FROM test_map WHERE ? GLOB region_glob ORDER BY test_file')
          .all(path) as { test_file: number }[]
      ).map((r) => r.test_file);
    },
  };
}
