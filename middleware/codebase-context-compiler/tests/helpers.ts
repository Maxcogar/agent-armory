import { resolve } from 'node:path';
import { SqliteStorage } from '../src/adapters/storage/sqlite-storage.js';
import { Indexer } from '../src/core/services/indexer.js';
import { TreeSitterParserAdapter } from '../src/adapters/tree-sitter/index.js';
import { SecretScanner } from '../src/security/secret-scanner.js';
import { PromptInjectionClassifier } from '../src/security/prompt-injection-classifier.js';
import { buildPackage } from '../src/core/services/package-builder.js';
import type { ContextPackage } from '../src/core/domain/context-package.js';

export const FIXTURE = resolve(__dirname, 'fixtures/sample-app');

export async function indexedFixture() {
  const storage = new SqliteStorage(':memory:');
  const indexer = new Indexer(storage, [new TreeSitterParserAdapter()], new SecretScanner());
  const r = await indexer.index(FIXTURE, 'sample-app');
  const snapshot = storage.getSnapshot(r.snapshotId)!;
  return { storage, snapshot, indexResult: r };
}

export async function fixturePackage(task = 'Add a dark mode toggle to the SettingsPage'): Promise<{ pkg: ContextPackage; storage: SqliteStorage }> {
  const { storage, snapshot } = await indexedFixture();
  const pkg = buildPackage(storage, snapshot, task, { injectionScanner: new PromptInjectionClassifier() });
  return { pkg, storage };
}
