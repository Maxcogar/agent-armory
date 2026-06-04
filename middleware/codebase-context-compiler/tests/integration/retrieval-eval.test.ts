import { describe, expect, it, afterEach } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FIXTURE } from '../helpers.js';
import { SqliteStorage } from '../../src/adapters/storage/sqlite-storage.js';
import { Indexer } from '../../src/core/services/indexer.js';
import { TreeSitterParserAdapter } from '../../src/adapters/tree-sitter/index.js';
import { SecretScanner } from '../../src/security/secret-scanner.js';
import { buildPackage } from '../../src/core/services/package-builder.js';
import { evaluateRetrieval } from '../../src/core/services/retrieval-eval.js';

let open: SqliteStorage | null = null;
afterEach(() => { open?.close(); open = null; });

describe('retrieval eval harness', () => {
  it('scores locate/understand prompts by top-N precision and noise demotion', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ctxpack-eval-locate-'));
    cpSync(FIXTURE, tmp, { recursive: true });
    mkdirSync(join(tmp, 'components'), { recursive: true });
    mkdirSync(join(tmp, 'backend/migrations'), { recursive: true });
    writeFileSync(join(tmp, 'App.tsx'), `
      export function App() {
        return 'plant collection telemetry data detail card plants';
      }
    `);
    writeFileSync(join(tmp, 'backend/migrations/seed-sensors.js'), `
      export const seedSensors = ['plant collection telemetry data detail card plants'];
    `);
    writeFileSync(join(tmp, 'components/DetailCard.tsx'), `
      export function DetailCard({ plant }) {
        const telemetryData = plant.telemetry.map((reading) => reading.sensorKind);
        return telemetryData.join(' detail card plant collection ');
      }
    `);

    const storage = new SqliteStorage(':memory:'); open = storage;
    const indexResult = await new Indexer(storage, [new TreeSitterParserAdapter()], new SecretScanner()).index(tmp, 'sample-app');
    const snapshot = storage.getSnapshot(indexResult.snapshotId)!;
    const pkg = buildPackage(storage, snapshot, 'what telemetry data can be seen in the detail cards of the plants in my collection?');
    const result = evaluateRetrieval(pkg, {
      name: 'telemetry detail card locate',
      prompt: 'what telemetry data can be seen in the detail cards of the plants in my collection?',
      expectedIntent: 'locate_understand',
      expectedDomains: ['frontend'],
      rubric: 'precision',
      mustHavePrimaryFiles: ['components/DetailCard.tsx'],
      noisyFiles: ['App.tsx', 'backend/migrations/seed-sensors.js'],
      topN: 3,
      maxInjectedContextChars: 9000,
    });

    expect(result.failures).toEqual([]);
    expect(result.score).toBeGreaterThanOrEqual(1);
    rmSync(tmp, { recursive: true, force: true });
  });

  it('scores refactor prompts by recall across dependents', async () => {
    const storage = new SqliteStorage(':memory:'); open = storage;
    const indexResult = await new Indexer(storage, [new TreeSitterParserAdapter()], new SecretScanner()).index(FIXTURE, 'sample-app');
    const snapshot = storage.getSnapshot(indexResult.snapshotId)!;
    const pkg = buildPackage(storage, snapshot, 'Refactor getPreference');
    const result = evaluateRetrieval(pkg, {
      name: 'getPreference refactor recall',
      prompt: 'Refactor getPreference',
      expectedIntent: 'refactor',
      rubric: 'recall',
      mustHavePrimaryFiles: [
        'src/state/store.ts',
        'src/components/ThemeToggle.tsx',
        'src/routes/SettingsPage.tsx',
        'tests/settings.test.ts',
      ],
      topN: 2,
    });

    expect(result.failures).toEqual([]);
    expect(result.metrics.required_recall_hits).toBe(4);
  });
});
