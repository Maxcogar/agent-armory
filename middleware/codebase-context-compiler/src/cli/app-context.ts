/**
 * Shared CLI wiring: storage location, default artifact paths, dependency
 * assembly. Local-first (SR1): the index DB lives in the target repo and is
 * owner-restricted by the storage layer.
 */
import { resolve, basename, join } from 'node:path';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { SqliteStorage } from '../adapters/storage/sqlite-storage.js';
import { TreeSitterParserAdapter } from '../adapters/tree-sitter/index.js';
import { Indexer } from '../core/services/indexer.js';
import { SecretScanner } from '../security/secret-scanner.js';
import { PromptInjectionClassifier } from '../security/prompt-injection-classifier.js';
import { SchemaValidator } from '../adapters/schema/validator.js';
import type { ContextPackage } from '../core/domain/context-package.js';
import { loadConfig, type CtxpackConfig } from '../config/config-schema.js';
import { TypeScriptLanguageServiceAdapter } from '../adapters/lsp/typescript-language-service.js';
import { SarifImporter } from '../adapters/static-analysis/sarif-importer.js';

export interface AppContext {
  root: string;
  repoName: string;
  dbPath: string;
  contextDir: string;
  storage: SqliteStorage;
  indexer: Indexer;
  injectionScanner: PromptInjectionClassifier;
  validator: SchemaValidator;
  config: CtxpackConfig;
}

export function openContext(rootArg?: string): AppContext {
  const root = resolve(rootArg ?? process.cwd());
  const repoName = basename(root);
  const config = loadConfig(root);
  const dbPath = join(root, '.ctxpack.db');
  const contextDir = join(root, '.context');
  mkdirSync(contextDir, { recursive: true });
  const storage = new SqliteStorage(dbPath);
  const languageServices = config.enableTypeScriptEnrichment ? [new TypeScriptLanguageServiceAdapter()] : [];
  const indexer = new Indexer(storage, [new TreeSitterParserAdapter()], new SecretScanner(), languageServices, [new SarifImporter()]);
  return { root, repoName, dbPath, contextDir, storage, indexer, injectionScanner: new PromptInjectionClassifier(), validator: new SchemaValidator(), config };
}

export function loadPackageFile(path: string): ContextPackage {
  if (!existsSync(path)) throw new Error(`Context package not found at ${path}. Run \`ctxpack package "<task>"\` first.`);
  return JSON.parse(readFileSync(path, 'utf8')) as ContextPackage;
}

export const PKG_JSON = 'task-context.json';
export const PKG_MD = 'task-context.md';
export const REVIEW_JSON = 'review.json';
export const REVIEW_SARIF = 'review.sarif';
