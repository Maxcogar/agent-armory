import { describe, it, expect, afterEach } from 'vitest';
import { indexedFixture, fixturePackage, FIXTURE } from '../helpers.js';
import { expandContext } from '../../src/core/services/graph-expander.js';
import { SchemaValidator } from '../../src/adapters/schema/validator.js';
import { SqliteStorage } from '../../src/adapters/storage/sqlite-storage.js';
import { Indexer } from '../../src/core/services/indexer.js';
import { TreeSitterParserAdapter } from '../../src/adapters/tree-sitter/index.js';
import { SecretScanner } from '../../src/security/secret-scanner.js';
import { TypeScriptLanguageServiceAdapter } from '../../src/adapters/lsp/typescript-language-service.js';
import { SarifImporter } from '../../src/adapters/static-analysis/sarif-importer.js';
import { buildPackage } from '../../src/core/services/package-builder.js';
import { applyHumanOverride } from '../../src/core/services/human-override.js';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let open: SqliteStorage | null = null;
afterEach(() => { open?.close(); open = null; });

describe('index + expand pipeline (FR1, FR5)', () => {
  it('indexes the fixture and resolves import relationships', async () => {
    const { storage, indexResult } = await indexedFixture(); open = storage;
    expect(indexResult.fileCount).toBeGreaterThanOrEqual(5);
    expect(indexResult.symbolCount).toBeGreaterThan(0);
    const exp = expandContext(storage, indexResult.snapshotId, ['src/routes/SettingsPage.tsx'], { maxDepth: 2 });
    const paths = exp.related.map((r) => r.path);
    expect(paths).toContain('src/components/ThemeToggle.tsx');
    expect(paths).toContain('src/state/store.ts');
    expect(paths).toContain('tests/settings.test.ts'); // test relationship
    expect(paths).not.toContain('src/routes/SettingsPage.tsx'); // seed excluded from related
  });

  it('builds a schema-valid package with required structure (FR12)', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    expect(new SchemaValidator().validatePackage(pkg).valid).toBe(true);
    expect(pkg.relevant_files.length).toBeGreaterThan(0);
    expect(pkg.context_requirements.length).toBeGreaterThan(0);
  });

  it('adds TypeScript semantic reference edges when the language service is enabled', async () => {
    const storage = new SqliteStorage(':memory:'); open = storage;
    const indexer = new Indexer(
      storage,
      [new TreeSitterParserAdapter()],
      new SecretScanner(),
      [new TypeScriptLanguageServiceAdapter()],
    );

    const indexResult = await indexer.index(FIXTURE, 'sample-app');
    const refs = storage.incomingEdges(indexResult.snapshotId, 'src/state/store.ts', ['references']);

    expect(refs.some((e) => e.from_path === 'src/components/ThemeToggle.tsx' && e.symbol === 'getPreference')).toBe(true);
  }, 15000);

  it('imports SARIF findings and exposes them as package evidence', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ctxpack-sarif-'));
    cpSync(FIXTURE, tmp, { recursive: true });
    const sarifPath = join(tmp, 'analysis.sarif');
    writeFileSync(sarifPath, JSON.stringify({
      version: '2.1.0',
      runs: [{
        tool: { driver: { name: 'fixture-analyzer' } },
        results: [{
          ruleId: 'fixture/no-hardcoded-default',
          level: 'warning',
          message: { text: 'Default font size needs a named constant.' },
          locations: [{
            physicalLocation: {
              artifactLocation: { uri: 'src/state/store.ts' },
              region: { startLine: 3, endLine: 3 },
            },
          }],
        }],
      }],
    }));

    const storage = new SqliteStorage(':memory:'); open = storage;
    const indexer = new Indexer(storage, [new TreeSitterParserAdapter()], new SecretScanner(), [], [new SarifImporter()]);
    const indexResult = await indexer.index(tmp, 'sample-app', { staticAnalysis: ['analysis.sarif'] });
    await indexer.index(tmp, 'sample-app', { staticAnalysis: ['analysis.sarif'] });

    const findings = storage.staticFindingsForFile(indexResult.snapshotId, 'src/state/store.ts');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule_id).toBe('fixture/no-hardcoded-default');

    const snapshot = storage.getSnapshot(indexResult.snapshotId)!;
    const pkg = buildPackage(storage, snapshot, 'Fix src/state/store.ts getPreference defaults');
    expect(pkg.known_facts.some((f) =>
      f.statement.includes('fixture/no-hardcoded-default') &&
      f.evidence.some((e) => e.source_type === 'static_analysis')
    )).toBe(true);

    rmSync(tmp, { recursive: true, force: true });
  });

  it('applies explicit human overrides as auditable package evidence', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    const updated = applyHumanOverride(storage, pkg, {
      action: 'add_known_fact',
      statement: 'Max Cogar confirmed the SettingsPage should remain the target screen for this task.',
      reason: 'Human reviewer supplied product intent that is not inferable from repository code.',
      path: 'src/routes/SettingsPage.tsx',
    });

    expect(updated.package_id).not.toBe(pkg.package_id);
    expect(new SchemaValidator().validatePackage(updated).valid).toBe(true);
    expect(updated.known_facts.some((f) =>
      f.statement.includes('SettingsPage should remain the target screen') &&
      f.evidence.some((e) => e.source_type === 'human_override')
    )).toBe(true);
  });

  it('ranks specific codebase-question leads before app shells and seed scripts', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ctxpack-question-rank-'));
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
    const indexer = new Indexer(storage, [new TreeSitterParserAdapter()], new SecretScanner());
    const indexResult = await indexer.index(tmp, 'sample-app');
    const snapshot = storage.getSnapshot(indexResult.snapshotId)!;
    const pkg = buildPackage(storage, snapshot, 'what telemetry data can be seen in the detail cards of the plants in my collection?');

    expect(pkg.task.task_types).toContain('codebase_question');
    expect(pkg.relevant_files[0]?.path).toBe('components/DetailCard.tsx');
    expect(pkg.relevant_files.findIndex((f) => f.path === 'App.tsx')).not.toBe(0);
    expect(pkg.relevant_files.findIndex((f) => f.path === 'backend/migrations/seed-sensors.js')).not.toBe(0);

    rmSync(tmp, { recursive: true, force: true });
  });

  it('keeps unwired-code investigation prompts focused on feature nouns instead of artifact noise', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ctxpack-unwired-rank-'));
    mkdirSync(join(tmp, '_recycle_bin'), { recursive: true });
    mkdirSync(join(tmp, 'components'), { recursive: true });
    mkdirSync(join(tmp, 'backend/routes'), { recursive: true });
    writeFileSync(join(tmp, '_recycle_bin/test-vite-source-trace.cjs'), `
      module.exports = 'files functions supposed wired never plant doctor telemetry journal entries';
    `);
    writeFileSync(join(tmp, 'auto_fill_system_map.js'), `
      export const map = 'files functions supposed wired never plant doctor telemetry journal entries';
    `);
    writeFileSync(join(tmp, 'components/PlantDoctor.tsx'), `
      export function PlantDoctor({ plant }) {
        return plant.journalEntries?.slice(0, 3).map((entry) => entry.content).join(' plant doctor diagnosis ');
      }
    `);
    writeFileSync(join(tmp, 'components/TelemetryDetailCards.tsx'), `
      export function TelemetryDetailCards({ plant }) {
        return plant.telemetry.map((reading) => reading.sensorKind).join(' telemetry plants collection ');
      }
    `);
    writeFileSync(join(tmp, 'components/JournalEntries.tsx'), `
      export function JournalEntries({ plant }) {
        return plant.journalEntries.map((entry) => entry.content).join(' journal entries ');
      }
    `);
    writeFileSync(join(tmp, 'backend/routes/plant-doctor.js'), `
      const express = require('express');
      const router = express.Router();
      router.post('/diagnose', async (req, res) => res.json({ diagnosis: 'ok' }));
      module.exports = router;
    `);

    const storage = new SqliteStorage(':memory:'); open = storage;
    const indexer = new Indexer(storage, [new TreeSitterParserAdapter()], new SecretScanner());
    const indexResult = await indexer.index(tmp, 'sample-app');
    const snapshot = storage.getSnapshot(indexResult.snapshotId)!;
    const indexedPaths = storage.listFiles(snapshot.snapshot_id).map((f) => f.path);
    const pkg = buildPackage(storage, snapshot, 'There are some files/functions in this app that are supposed to be wired in but never were. Particularly im interested in one related to the plant doctor, the telemetry for the plants in my collection, and the journal entries');
    const topPaths = pkg.relevant_files.slice(0, 5).map((f) => f.path);

    expect(indexedPaths).not.toContain('_recycle_bin/test-vite-source-trace.cjs');
    expect(topPaths).toEqual(expect.arrayContaining([
      'components/PlantDoctor.tsx',
      'components/TelemetryDetailCards.tsx',
      'components/JournalEntries.tsx',
    ]));
    expect(topPaths).not.toContain('auto_fill_system_map.js');

    rmSync(tmp, { recursive: true, force: true });
  });

  it('pulls matching backend routes across API client contracts for explanation tasks', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ctxpack-api-contract-'));
    mkdirSync(join(tmp, 'components'), { recursive: true });
    mkdirSync(join(tmp, 'lib/api'), { recursive: true });
    mkdirSync(join(tmp, 'backend/routes'), { recursive: true });
    writeFileSync(join(tmp, 'components/PlantDoctor.tsx'), `
      import { apiClient } from '../lib/api/client';
      export function PlantDoctor({ plant }) {
        return apiClient.diagnosePlant({ plantId: plant.id, problem: plant.problem });
      }
    `);
    writeFileSync(join(tmp, 'lib/api/client.ts'), `
      export const apiClient = {
        recognizePlant(photo) {
          return makeRequest('/api/plant-doctor/recognize-plant', { method: 'POST', body: photo });
        },
        diagnosePlant(data) {
          return makeRequest('/api/plant-doctor/diagnose', { method: 'POST', body: JSON.stringify(data) });
        },
        messagePlantDoctor(data) {
          return makeRequest('/api/plant-doctor/message', { method: 'POST', body: JSON.stringify(data) });
        },
      };
      function makeRequest(path, init) { return fetch(path, init); }
    `);
    writeFileSync(join(tmp, 'backend/routes/plant-doctor.js'), `
      const express = require('express');
      const router = express.Router();

      // POST /api/plant-doctor/diagnose
      router.post('/diagnose', async (req, res) => res.json({ diagnosis: 'ok' }));
      // POST /api/plant-doctor/recognize-plant
      router.post('/recognize-plant', async (req, res) => res.json({ confidence: 0.9 }));
      // POST /api/plant-doctor/message
      router.post('/message', async (req, res) => res.json({ reply: 'ok' }));
      module.exports = router;
    `);

    const storage = new SqliteStorage(':memory:'); open = storage;
    const indexer = new Indexer(storage, [new TreeSitterParserAdapter()], new SecretScanner());
    const indexResult = await indexer.index(tmp, 'sample-app');
    const snapshot = storage.getSnapshot(indexResult.snapshotId)!;
    const pkg = buildPackage(storage, snapshot, 'How does the plant doctor diagnosis work and what data can it use?');
    const routeRank = pkg.relevant_files.findIndex((f) => f.path === 'backend/routes/plant-doctor.js');
    const route = pkg.relevant_files[routeRank];

    expect(routeRank).toBeGreaterThanOrEqual(0);
    expect(routeRank).toBeLessThan(8);
    expect(route?.signals.some((s) => s.source === 'cross_boundary_contract')).toBe(true);
    expect(route?.relevance_reason).toContain('/api/plant-doctor/diagnose');

    rmSync(tmp, { recursive: true, force: true });
  });
});
