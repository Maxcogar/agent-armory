/**
 * Indexer service (Architecture build steps 3-6). Orchestrates scan -> parse ->
 * store, resolving import specifiers to repo paths and applying the security
 * redaction pass before any content is persisted (D11 / SR2).
 */
import { extname, isAbsolute, join } from 'node:path';
import type { Storage } from '../ports/storage.js';
import type { ParserAdapter } from '../ports/parser-adapter.js';
import type { LanguageServiceAdapter } from '../ports/language-service-adapter.js';
import type { StaticAnalysisImporter } from '../ports/static-analysis-importer.js';
import type { CapabilityGap, EdgeRecord, SymbolRecord } from '../domain/repository-map.js';
import { scanRepository, type ScanOptions } from './file-scanner.js';
import { resolveImport } from './import-resolver.js';
import type { SecretRedactor } from '../ports/security.js';
import type { StaticAnalysisFinding } from '../domain/static-analysis.js';

export interface IndexResult {
  snapshotId: string;
  fileCount: number;
  symbolCount: number;
  edgeCount: number;
  gaps: CapabilityGap[];
}

export class Indexer {
  constructor(
    private storage: Storage,
    private parsers: ParserAdapter[],
    private redactor?: SecretRedactor,
    private languageServices: LanguageServiceAdapter[] = [],
    private staticImporters: StaticAnalysisImporter[] = [],
  ) {}

  private parserFor(path: string): ParserAdapter | null {
    const ext = extname(path);
    return this.parsers.find((p) => p.extensions.includes(ext)) ?? null;
  }

  async index(root: string, repoName: string, opts: ScanOptions = {}): Promise<IndexResult> {
    const scan = scanRepository(root, repoName, opts);
    const snapshotId = scan.snapshot.snapshot_id;

    if (this.storage.getSnapshot(snapshotId)) {
      // Identical snapshot already indexed (NFR5 incremental no-op).
      const existing = this.storage.listFiles(snapshotId);
      const gaps: CapabilityGap[] = [];
      await this.importStaticAnalysis(snapshotId, root, opts.staticAnalysis ?? [], gaps);
      return { snapshotId, fileCount: existing.length, symbolCount: 0, edgeCount: 0, gaps };
    }

    this.storage.createSnapshot(scan.snapshot);

    const fileSet = new Set(scan.files.map((f) => f.record.path));
    const files = scan.files.map((f) => ({ ...f.record, snapshot_id: snapshotId }));
    this.storage.putFiles(files);

    // Persist (redacted) content for FTS + evidence spans.
    for (const f of scan.files) {
      const content = this.redactor ? this.redactor.redact(f.record.path, f.content) : f.content;
      this.storage.putFileContent(snapshotId, f.record.path, content);
    }

    const allSymbols: SymbolRecord[] = [];
    const allEdges: EdgeRecord[] = [];
    const gaps: CapabilityGap[] = [];

    for (const f of scan.files) {
      const parser = this.parserFor(f.record.path);
      if (!parser) continue;
      const out = await parser.parse({ snapshotId, path: f.record.path, content: f.content });
      for (const s of out.symbols) allSymbols.push({ ...s, snapshot_id: snapshotId });
      for (const e of out.edges) {
        const resolved = e.kind === 'imports'
          ? resolveImport(e.from_path, e.to_path, fileSet)
          : (fileSet.has(e.to_path) ? e.to_path : null);
        allEdges.push({ ...e, snapshot_id: snapshotId, to_path: resolved ?? e.to_path });
      }
      for (const g of out.gaps) gaps.push({ ...g, adapter: parser.name });
    }

    for (const service of this.languageServices) {
      try {
        if (!(await service.available())) {
          gaps.push({ adapter: service.name, path: '<workspace>', reason: 'language service unavailable' });
          continue;
        }
        const enriched = await service.enrich(snapshotId, root);
        for (const e of enriched.edges) allEdges.push({ ...e, snapshot_id: snapshotId });
        for (const g of enriched.gaps) gaps.push({ ...g, adapter: service.name });
      } catch (e) {
        gaps.push({ adapter: service.name, path: '<workspace>', reason: `language service failed: ${(e as Error).message}` });
      }
    }

    const uniqueEdges = dedupeEdges(allEdges);
    if (allSymbols.length) this.storage.putSymbols(allSymbols);
    if (uniqueEdges.length) this.storage.putEdges(uniqueEdges);

    const staticFindings = await this.importStaticAnalysis(snapshotId, root, opts.staticAnalysis ?? [], gaps);

    this.storage.appendAudit({
      ts: new Date().toISOString(), actor: 'indexer', action: 'index',
      detail: `snapshot=${snapshotId} files=${files.length} symbols=${allSymbols.length} edges=${uniqueEdges.length} static_findings=${staticFindings.length}`,
    });

    return {
      snapshotId, fileCount: files.length, symbolCount: allSymbols.length,
      edgeCount: uniqueEdges.length, gaps,
    };
  }

  private async importStaticAnalysis(
    snapshotId: string,
    root: string,
    sources: string[],
    gaps: CapabilityGap[],
  ): Promise<StaticAnalysisFinding[]> {
    const staticFindings: StaticAnalysisFinding[] = [];
    for (const source of sources) {
      const resolvedSource = isAbsolute(source) ? source : join(root, source);
      for (const importer of this.staticImporters) {
        try {
          const findings = await importer.importFindings(resolvedSource);
          staticFindings.push(...findings.map((f) => ({ ...f, snapshot_id: snapshotId, source: resolvedSource })));
        } catch (e) {
          gaps.push({ adapter: importer.name, path: source, reason: `static-analysis import failed: ${(e as Error).message}` });
        }
      }
    }
    if (staticFindings.length) this.storage.putStaticFindings(staticFindings);
    return staticFindings;
  }
}

function dedupeEdges(edges: EdgeRecord[]): EdgeRecord[] {
  const seen = new Set<string>();
  const out: EdgeRecord[] = [];
  for (const edge of edges) {
    const key = `${edge.snapshot_id}:${edge.from_path}:${edge.to_path}:${edge.kind}:${edge.symbol ?? ''}:${edge.from_line ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(edge);
  }
  return out;
}
