import { randomUUID } from 'node:crypto';
import type { Storage } from '../ports/storage.js';
import type {
  ContextExpansionRequest,
  ContextExpansionResult,
} from '../domain/context-expansion.js';
import type {
  ContextPackage,
  ContextRequirement,
  RelevantFile,
  RelevantSymbol,
} from '../domain/context-package.js';
import type { EvidenceRef } from '../domain/evidence.js';
import type { SymbolRecord } from '../domain/repository-map.js';
import { expandContext } from './graph-expander.js';

export function expandPackageContext(
  storage: Storage,
  pkg: ContextPackage,
  request: ContextExpansionRequest,
): ContextExpansionResult {
  const snapshotId = pkg.repository.snapshot_id;
  const included = new Set(pkg.relevant_files.map((f) => f.path));
  const checkedPaths: string[] = [];
  const seedPaths = discoverExpansionSeeds(storage, snapshotId, request, checkedPaths)
    .filter((p) => !included.has(p));

  if (seedPaths.length === 0) {
    return {
      request,
      package_id: pkg.package_id,
      updated_package: null,
      added_files: [],
      added_symbols: [],
      denial: {
        reason: checkedPaths.length
          ? 'No requested context was found outside the current package scope.'
          : 'Expansion request did not identify any repository evidence to add.',
        checked_paths: checkedPaths,
      },
    };
  }

  const expansion = expandContext(storage, snapshotId, seedPaths, { maxDepth: 1, maxFiles: 20 });
  const allAddedPaths = [...new Set([...expansion.seeds, ...expansion.related.map((r) => r.path)])]
    .filter((p) => !included.has(p));

  if (allAddedPaths.length === 0) {
    return {
      request,
      package_id: pkg.package_id,
      updated_package: null,
      added_files: [],
      added_symbols: [],
      denial: {
        reason: 'Expansion found only files that are already present in the package.',
        checked_paths: checkedPaths,
      },
    };
  }

  const addedFiles = allAddedPaths.map((path) => {
    const related = expansion.related.find((r) => r.path === path);
    const file = storage.getFile(snapshotId, path)!;
    const evidence = related?.evidence.length
      ? related.evidence
      : [fileEvidence(path, 'context_expansion')];
    return {
      path,
      role: file.boundary,
      required: expansion.seeds.includes(path),
      relevance_reason: related?.reasons[0] ?? `added by context expansion: ${request.why_needed}`,
      confidence: expansion.seeds.includes(path) ? 'high' : 'medium',
      signals: [{
        source: expansion.seeds.includes(path) ? 'context_expansion_seed' : 'context_expansion_graph',
        score: expansion.seeds.includes(path) ? 8 : 4,
        reason: related?.reasons[0] ?? request.why_needed,
      }],
      corroboration_count: 1,
      representation: expansion.seeds.includes(path) ? 'excerpt' : 'pointer',
      evidence,
      key_facts: keyFacts(storage, snapshotId, path),
    } satisfies RelevantFile;
  });

  const addedSymbols = addedFiles.flatMap((f) => storage.symbolsInFile(snapshotId, f.path).map(symbolToRelevant));
  const updated = updatePackage(pkg, request, addedFiles, addedSymbols);
  return {
    request,
    package_id: updated.package_id,
    updated_package: updated,
    added_files: addedFiles,
    added_symbols: addedSymbols,
    denial: null,
  };
}

function discoverExpansionSeeds(
  storage: Storage,
  snapshotId: string,
  request: ContextExpansionRequest,
  checkedPaths: string[],
): string[] {
  const seeds = new Set<string>();
  for (const raw of request.candidate_paths ?? []) {
    const path = raw.replace(/^\.\//, '').replace(/\\/g, '/');
    checkedPaths.push(path);
    if (storage.getFile(snapshotId, path)) seeds.add(path);
  }
  for (const symbol of request.candidate_symbols ?? []) {
    for (const s of storage.findSymbolsByName(snapshotId, symbol)) {
      checkedPaths.push(s.path);
      seeds.add(s.path);
    }
  }
  const query = [
    request.missing,
    request.why_needed,
    request.blocked_claim_or_step,
    ...(request.keywords ?? []),
  ].join(' ');
  for (const path of storage.searchText(snapshotId, query, 12)) {
    checkedPaths.push(path);
    seeds.add(path);
  }
  return [...seeds];
}

function updatePackage(
  pkg: ContextPackage,
  request: ContextExpansionRequest,
  addedFiles: RelevantFile[],
  addedSymbols: RelevantSymbol[],
): ContextPackage {
  const matchingCategories = new Set(
    pkg.context_requirements
      .filter((r) => r.status === 'unresolved' && requestMentionsCategory(request, r.category))
      .map((r) => r.category),
  );

  const context_requirements: ContextRequirement[] = pkg.context_requirements.map((r) => {
    if (!matchingCategories.has(r.category)) return r;
    return {
      ...r,
      status: 'satisfied',
      reason: `satisfied by approved context expansion; added ${addedFiles.map((f) => f.path).join(', ')}`,
    };
  });

  return {
    ...pkg,
    package_id: randomUUID(),
    generated_at: new Date().toISOString(),
    context_requirements,
    relevant_files: [...pkg.relevant_files, ...addedFiles],
    relevant_symbols: [...pkg.relevant_symbols, ...addedSymbols],
    known_facts: [
      ...pkg.known_facts,
      ...addedFiles.map((f) => ({
        statement: `${f.path} was added by context expansion because ${request.why_needed}`,
        evidence: f.evidence.length ? f.evidence : [fileEvidence(f.path, 'context_expansion')],
      })),
    ],
    unknowns: pkg.unknowns.filter((u) => !requestMatchesUnknown(request, u.description)),
    checked_not_relevant: pkg.checked_not_relevant.filter((c) => !addedFiles.some((f) => f.path === c.path)),
  };
}

function requestMentionsCategory(request: ContextExpansionRequest, category: string): boolean {
  const haystack = `${request.missing} ${request.why_needed} ${request.blocked_claim_or_step}`.toLowerCase();
  return category.split('_').some((part) => part.length > 3 && haystack.includes(part));
}

function requestMatchesUnknown(request: ContextExpansionRequest, unknown: string): boolean {
  const haystack = `${request.missing} ${request.why_needed} ${request.blocked_claim_or_step}`.toLowerCase();
  return unknown.toLowerCase().split(/\s+/).filter((w) => w.length > 3).some((w) => haystack.includes(w));
}

function keyFacts(storage: Storage, snapshotId: string, path: string): string[] {
  const facts = storage.symbolsInFile(snapshotId, path).slice(0, 8)
    .map((s) => `${s.kind} ${s.name}${s.exported ? ' (exported)' : ''}`);
  const file = storage.getFile(snapshotId, path);
  if (file?.boundary === 'generated') facts.unshift('file is generated and should not be hand-edited');
  return facts;
}

function symbolToRelevant(s: SymbolRecord): RelevantSymbol {
  return {
    name: s.name,
    kind: s.kind,
    file: s.path,
    relevance_reason: `symbol added by context expansion from ${s.path}`,
    confidence: s.exported ? 'medium' : 'low',
    signals: [{
      source: 'symbol_extraction',
      score: s.exported ? 4 : 2,
      reason: `symbol ${s.name} defined in expanded file ${s.path}`,
    }],
    corroboration_count: 1,
    representation: 'signature',
    evidence: [{
      source_type: 'symbol',
      path: s.path,
      symbol: s.name,
      start_line: s.start_line,
      end_line: s.end_line,
      relationship: 'defines',
    }],
  };
}

function fileEvidence(path: string, relationship: string): EvidenceRef {
  return { source_type: 'file', path, symbol: null, start_line: null, end_line: null, relationship };
}
