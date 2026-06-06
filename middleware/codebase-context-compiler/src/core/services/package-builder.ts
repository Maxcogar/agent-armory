/**
 * Context Package builder (Spec FR6-FR13, FR20-FR24; Architecture D10/D12).
 *
 * Assembles the smallest complete package for a task: seeds from explicit
 * mentions / symbols / lexical hits, expanded by code relationships, with every
 * non-trivial fact carrying evidence. Required categories are evaluated to
 * satisfied | unresolved; unresolved categories become explicit unknowns (FR8/
 * FR24) and, where the concept may legitimately be created, allowed-creation
 * points (FR9). Existing patterns are reported as observed, not required (FR22).
 */
import { randomUUID } from 'node:crypto';
import type { Storage } from '../ports/storage.js';
import type { PromptInjectionScanner } from '../ports/security.js';
import type { EvidenceRef } from '../domain/evidence.js';
import type {
  ContextPackage, RelevantFile, RelevantSymbol, ContextRequirement, ExistingPattern,
  ForbiddenMove, KnownFact, Unknown, ContextGapAllowedToCreate, CheckedNotRelevant,
  Constraint, UnresolvedDecision, FlaggedRepositoryText, InclusionConfidence, InclusionSignal, RepresentationTier,
} from '../domain/context-package.js';
import { SCHEMA_VERSION } from '../domain/context-package.js';
import type { RepositorySnapshot, SymbolRecord } from '../domain/repository-map.js';
import type { RuntimeDomain, Task } from '../domain/task.js';
import { classifyTask, domainsForPath, type Classification } from './task-classifier.js';
import { type ContextCategory } from './recipe-engine.js';
import { profileForTask } from './task-profiles.js';
import { expandContext } from './graph-expander.js';

export interface BuildOptions {
  tokenBudget?: number;
  maxFiles?: number;
  injectionScanner?: PromptInjectionScanner;
}

/** Categories whose absence may legitimately be filled by new work (FR9). */
const CREATABLE: ReadonlySet<ContextCategory> = new Set<ContextCategory>([
  'styling_theme_system', 'tests', 'documentation', 'data_models',
  'schema_migrations', 'validation_layer', 'child_components',
]);

export function buildPackage(
  storage: Storage,
  snapshot: RepositorySnapshot,
  request: string,
  opts: BuildOptions = {},
): ContextPackage {
  const snap = snapshot.snapshot_id;
  const budget = opts.tokenBudget ?? 8000;
  const maxFiles = opts.maxFiles ?? 40;
  const cls = classifyTask(request);
  const questionMode = isCodebaseQuestion(cls);

  // --- 1. seed selection ---
  const selectedSeeds = selectSeeds(storage, snap, cls);

  // --- 2. relationship expansion ---
  const initialExpansion = expandContext(storage, snap, selectedSeeds, { maxDepth: 2, maxFiles });
  const contractSeeds = selectCrossBoundarySeeds(
    storage,
    snap,
    cls,
    [...initialExpansion.seeds, ...initialExpansion.related.map((r) => r.path)],
  );
  const contractSeedMap = new Map(contractSeeds.map((seed) => [seed.path, seed]));
  const seeds = [...selectedSeeds, ...contractSeeds.map((s) => s.path).filter((path) => !selectedSeeds.includes(path))];
  const expansion = contractSeeds.length
    ? expandContext(storage, snap, seeds, { maxDepth: 2, maxFiles })
    : initialExpansion;
  const relatedPaths = new Set(expansion.related.map((r) => r.path));
  const allPaths = new Set<string>([...expansion.seeds, ...relatedPaths]);
  const derivedTask = withSourceDerivedDomains(cls.task, [...allPaths]);
  const profile = profileForTask(derivedTask);

  // --- 3. relevant files ---
  const relevant_files: RelevantFile[] = [];
  for (const path of expansion.seeds) {
    const file = storage.getFile(snap, path)!;
    const contractSeed = contractSeedMap.get(path);
    relevant_files.push({
      path, role: file.boundary,
      required: !questionMode,
      relevance_reason: contractSeed ? contractSeedReason(contractSeed) : seedReason(path, cls),
      ...inclusionMeta(contractSeed ? contractSeedSignals(contractSeed) : seedSignals(path, cls), !questionMode ? 'full' : 'excerpt'),
      evidence: [{
        source_type: contractSeed ? 'file' : 'external_input',
        path,
        symbol: null,
        start_line: null,
        end_line: null,
        relationship: contractSeed ? 'cross_boundary_contract' : questionMode ? 'task_inquiry_target' : 'task_target',
      }],
      key_facts: keyFacts(storage, snap, path),
    });
  }
  for (const r of expansion.related) {
    relevant_files.push({
      path: r.path, role: r.boundary,
      required: !questionMode && r.depth <= 1 && r.boundary !== 'doc',
      relevance_reason: r.reasons[0] ?? 'related by code relationship',
      ...inclusionMeta([{ source: 'graph_expansion', score: Math.max(1, 5 - r.depth), reason: r.reasons[0] ?? 'related by code relationship' }], 'pointer'),
      evidence: r.evidence,
      key_facts: keyFacts(storage, snap, r.path),
    });
  }

  // --- 4. relevant symbols (seed-defined) ---
  const relevant_symbols: RelevantSymbol[] = [];
  for (const path of expansion.seeds) {
    for (const s of storage.symbolsInFile(snap, path)) {
      relevant_symbols.push({
        name: s.name, kind: s.kind, file: s.path,
        relevance_reason: questionMode ? `defined in investigation file ${s.path}` : `defined in target file ${s.path}`,
        ...inclusionMeta([{ source: 'symbol_extraction', score: s.exported ? 4 : 2, reason: `symbol ${s.name} defined in ${s.path}` }], 'signature'),
        evidence: [symEv(s)],
      });
    }
  }

  // --- 5. category completeness (FR4/NFR6) ---
  const required = profile.contextCategories;
  const context_requirements: ContextRequirement[] = [];
  const unknowns: Unknown[] = [];
  const gaps: ContextGapAllowedToCreate[] = [];
  for (const cat of required) {
    const ev = evaluateCategory(cat, storage, snap, allPaths, expansion);
    context_requirements.push({ category: cat, status: ev.satisfied ? 'satisfied' : 'unresolved', reason: ev.reason });
    if (!ev.satisfied) {
      unknowns.push({ description: `No ${cat.replace(/_/g, ' ')} found for this task`, searched_locations: ev.searched, impact: ev.impact });
      if (CREATABLE.has(cat)) {
        gaps.push({ description: `${cat.replace(/_/g, ' ')}`, reason: `Required by task type but not present; may be created as part of this task.` });
      }
    }
  }

  // --- 6. existing patterns + forbidden moves (FR22/FR10/PR3) ---
  const { patterns, forbidden_moves } = derivePatternsAndForbidden(storage, snap, relevant_files, cls);

  // --- 7. known facts (FR7) ---
  const known_facts = deriveKnownFacts(storage, snap, expansion.seeds, relevant_symbols);

  // --- 8. checked-and-rejected (FR11) ---
  const checked_not_relevant = deriveCheckedNotRelevant(storage, snap, cls, allPaths);

  // --- 9. constraints (boundaries + standards) ---
  const constraints = deriveConstraints(relevant_files);

  // --- 10. prompt-injection flags (SR3) ---
  const flagged_repository_text = opts.injectionScanner
    ? scanFlags(storage, snap, allPaths, opts.injectionScanner)
    : [];

  // --- 11. verification guidance (FR23) ---
  const verification_guidance = deriveVerification(storage, snap, relevant_files, cls);

  // --- 12. unresolved decisions ---
  const unresolved_decisions: UnresolvedDecision[] = [];
  if (expansion.seeds.length === 0) {
    unresolved_decisions.push({
      decision: 'No target file could be determined from the task description.',
      owner: 'human',
      blocks: 'context selection and implementation',
    });
  }

  // --- 13. token budget (NFR3) ---
  const estimated = estimateTokens(relevant_files, known_facts);

  const pkg: ContextPackage = {
    schema_version: SCHEMA_VERSION,
    package_id: randomUUID(),
    generated_at: new Date().toISOString(),
    repository: {
      name: snapshot.repo_name, root: snapshot.root, revision: snapshot.revision,
      dirty_state: snapshot.dirty_state, snapshot_id: snap,
    },
    task: derivedTask,
    context_requirements,
    relevant_files,
    relevant_symbols,
    existing_patterns: patterns,
    constraints,
    forbidden_moves,
    known_facts,
    unknowns,
    context_gaps_allowed_to_create: gaps,
    checked_not_relevant,
    verification_guidance,
    unresolved_decisions,
    flagged_repository_text,
    token_budget: { budget, estimated, overflow: estimated > budget },
  };
  return pkg;
}

// ---------------- helpers ----------------

function selectSeeds(storage: Storage, snap: string, cls: Classification): string[] {
  const seeds = new Set<string>();
  const files = storage.listFiles(snap);
  const addFile = (path: string) => {
    const exact = path.replace(/^\.\//, '').replace(/\\/g, '/');
    if (storage.getFile(snap, exact)) {
      seeds.add(exact);
      return true;
    }
    const bySuffix = files.find((f) => f.path.endsWith('/' + exact) || f.path.split('/').pop() === exact);
    if (bySuffix) {
      seeds.add(bySuffix.path);
      return true;
    }
    return false;
  };

  for (const p of cls.mentionedPaths) {
    addFile(p);
  }
  for (const sym of cls.mentionedSymbols) {
    for (const s of storage.findSymbolsByName(snap, sym)) seeds.add(s.path);
    if (![...seeds].some((p) => storage.symbolsInFile(snap, p).some((s) => s.name === sym))) {
      for (const f of files) {
        if (storage.symbolsInFile(snap, f.path).some((s) => s.name.toLowerCase() === sym.toLowerCase())) {
          seeds.add(f.path);
        }
      }
    }
  }
  if (seeds.size === 0) {
    for (const p of rankedKeywordSeeds(storage, snap, cls).slice(0, 5)) seeds.add(p);
  }
  return [...seeds];
}

interface ContractSeed {
  path: string;
  endpoints: string[];
  score: number;
  sourcePaths: string[];
}

function selectCrossBoundarySeeds(
  storage: Storage,
  snap: string,
  cls: Classification,
  sourcePaths: string[],
): ContractSeed[] {
  const uniqueSourcePaths = [...new Set(sourcePaths)];
  const endpointSources = new Map<string, Set<string>>();
  for (const path of uniqueSourcePaths) {
    const content = storage.getFileContent(snap, path);
    if (!content) continue;
    for (const endpoint of endpointHints(content)) {
      if (!endpointSources.has(endpoint)) endpointSources.set(endpoint, new Set<string>());
      endpointSources.get(endpoint)!.add(path);
    }
  }
  if (endpointSources.size === 0) return [];

  const activeEndpointSources = focusEndpointSources(endpointSources, cls);
  const taskTerms = new Set(expandedKeywordTerms(cls.keywords));
  const scored: ContractSeed[] = [];

  for (const file of storage.listFiles(snap)) {
    if (!isRouteLikeFile(file.path, file.boundary)) continue;
    const content = storage.getFileContent(snap, file.path);
    if (!content) continue;

    const lowerPath = file.path.toLowerCase();
    const lowerContent = content.toLowerCase();
    const endpoints: string[] = [];
    let score = 0;

    for (const [endpoint, sources] of activeEndpointSources.entries()) {
      const externalSources = [...sources].filter((source) => source !== file.path);
      if (externalSources.length === 0) continue;
      const lowerEndpoint = endpoint.toLowerCase();
      const segments = endpointSegments(endpoint);
      const strongSegments = segments.filter((s) => !['api', 'v1', 'v2'].includes(s));
      const segmentHits = strongSegments.filter((segment) => lowerPath.includes(segment) || lowerContent.includes(segment));
      const exact = lowerContent.includes(lowerEndpoint);
      if (exact) {
        score += 12;
        endpoints.push(endpoint);
      } else if (segmentHits.length >= Math.min(2, strongSegments.length)) {
        score += 4 + segmentHits.length;
        endpoints.push(endpoint);
      }

      for (const source of externalSources) {
        const sourceName = source.split('/').pop()?.toLowerCase() ?? '';
        if (sourceName.includes('api') || sourceName.includes('client')) score += 1;
      }
    }

    for (const term of taskTerms) {
      if (lowerPath.includes(term) || lowerContent.includes(term)) score += 1;
    }

    const uniqueEndpoints = [...new Set(endpoints)];
    if (score >= 8 && uniqueEndpoints.length > 0) {
      const matchedSources = uniqueEndpoints.flatMap((endpoint) =>
        [...activeEndpointSources.get(endpoint)!].filter((source) => source !== file.path)
      );
      scored.push({ path: file.path, endpoints: uniqueEndpoints, score, sourcePaths: [...new Set(matchedSources)] });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, 6);
}

function focusEndpointSources(endpointSources: Map<string, Set<string>>, cls: Classification): Map<string, Set<string>> {
  const terms = expandedKeywordTerms(cls.keywords);
  const scored = [...endpointSources.entries()].map(([endpoint, sources]) => ({
    endpoint,
    sources,
    score: endpointTaskScore(endpoint, terms),
  }));
  const maxScore = Math.max(0, ...scored.map((x) => x.score));
  if (maxScore < 2) return endpointSources;
  return new Map(scored
    .filter((x) => x.score >= 2)
    .map((x) => [x.endpoint, x.sources]));
}

function endpointTaskScore(endpoint: string, terms: string[]): number {
  const lower = endpoint.toLowerCase();
  const matched = new Set<string>();
  for (const term of terms) {
    const key = term.endsWith('s') && term.length > 3 ? term.slice(0, -1) : term;
    if (lower.includes(term)) matched.add(key);
    else if (term.startsWith('diagnos') && lower.includes('diagnos')) matched.add('diagnos');
  }
  return matched.size;
}

function endpointHints(content: string): string[] {
  const out = new Set<string>();
  const re = /["'`](\/api\/[A-Za-z0-9_./:${}?=&%-]+)["'`]/g;
  for (const match of content.matchAll(re)) {
    const endpoint = normalizeEndpoint(match[1] ?? '');
    if (endpointSegments(endpoint).length >= 2) out.add(endpoint);
  }
  return [...out];
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint
    .replace(/\$\{[^}]+\}/g, ':param')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '');
}

function endpointSegments(endpoint: string): string[] {
  return endpoint
    .toLowerCase()
    .split('/')
    .map((segment) => segment.replace(/^:/, '').replace(/[^a-z0-9_-]/g, ''))
    .filter((segment) => segment.length > 1);
}

function isRouteLikeFile(path: string, boundary: string): boolean {
  const lower = path.toLowerCase();
  if (!['source', 'config'].includes(boundary)) return false;
  return /(^|\/)(backend\/(routes?|controllers?)|api|routes?|controllers?|server)\//.test(lower)
    || /(^|\/)server\.(ts|tsx|js|jsx)$/.test(lower)
    || /(^|\/)backend\/server\.(ts|tsx|js|jsx)$/.test(lower);
}

function contractSeedReason(seed: ContractSeed): string {
  return `matched API contract endpoint(s) ${seed.endpoints.slice(0, 3).join(', ')} from ${seed.sourcePaths.slice(0, 3).join(', ')}`;
}

function contractSeedSignals(seed: ContractSeed): InclusionSignal[] {
  return [{
    source: 'cross_boundary_contract',
    score: Math.min(12, seed.score),
    reason: contractSeedReason(seed),
  }];
}

function seedReason(path: string, cls: Classification): string {
  if (cls.mentionedPaths.some((p) => p.replace(/^\.\//, '') === path)) return 'named explicitly in the task';
  if (isCodebaseQuestion(cls)) return 'matched the explanation question by symbol, path, or repository text';
  return 'matched the task by symbol or keyword and is a target for the change';
}

function keyFacts(storage: Storage, snap: string, path: string): string[] {
  const syms = storage.symbolsInFile(snap, path).slice(0, 8);
  const facts = syms.map((s) => `${s.kind} ${s.name}${s.exported ? ' (exported)' : ''}`);
  for (const f of storage.staticFindingsForFile(snap, path).slice(0, 4)) {
    facts.push(`static-analysis ${f.severity}: ${f.rule_id} - ${f.message}`);
  }
  const file = storage.getFile(snap, path);
  if (file?.boundary === 'generated') facts.unshift('file is GENERATED — likely should not be hand-edited');
  return facts;
}

function symEv(s: SymbolRecord): EvidenceRef {
  return { source_type: 'symbol', path: s.path, symbol: s.name, start_line: s.start_line, end_line: s.end_line, relationship: 'defines' };
}

function withSourceDerivedDomains(task: Task, paths: string[]): Task {
  const domains = new Set<RuntimeDomain>(task.domains);
  for (const path of paths) {
    for (const domain of domainsForPath(path)) domains.add(domain);
  }
  if (domains.size > 1) domains.delete('unknown');
  return { ...task, domains: domains.size ? [...domains] : ['unknown'] };
}

function inclusionMeta(signals: InclusionSignal[], representation: RepresentationTier): {
  confidence: InclusionConfidence;
  signals: InclusionSignal[];
  corroboration_count: number;
  representation: RepresentationTier;
} {
  const sources = new Set(signals.map((s) => s.source));
  const corroboration_count = Math.max(1, sources.size);
  const score = signals.reduce((sum, s) => sum + s.score, 0);
  const confidence: InclusionConfidence = corroboration_count >= 2 || score >= 8
    ? 'high'
    : score >= 4
      ? 'medium'
      : 'low';
  return { confidence, signals, corroboration_count, representation };
}

function seedSignals(path: string, cls: Classification): InclusionSignal[] {
  const signals: InclusionSignal[] = [];
  if (cls.mentionedPaths.some((p) => p.replace(/^\.\//, '').replace(/\\/g, '/') === path)) {
    signals.push({ source: 'explicit_path', score: 10, reason: 'path was named explicitly in the task' });
  }
  const symbols = cls.mentionedSymbols.filter((sym) => sym.length > 2);
  if (symbols.length) {
    signals.push({ source: 'symbol_hint', score: 6, reason: `task mentioned symbol-like term(s): ${symbols.slice(0, 4).join(', ')}` });
  }
  const pathWords = wordsForPath(path);
  const matchedKeywords = cls.keywords.filter((k) => pathWords.has(k.toLowerCase()) || path.toLowerCase().includes(k.toLowerCase()));
  if (matchedKeywords.length) {
    signals.push({ source: 'path_keyword', score: Math.min(6, matchedKeywords.length * 2), reason: `path matched task keyword(s): ${matchedKeywords.slice(0, 4).join(', ')}` });
  }
  if (signals.length === 0) {
    signals.push({ source: 'text_search', score: 3, reason: 'repository text matched task keywords' });
  }
  return signals;
}

interface CatEval { satisfied: boolean; reason: string; searched: string[]; impact: string }

function evaluateCategory(cat: ContextCategory, storage: Storage, snap: string, paths: Set<string>, expansion: { seeds: string[]; related: { path: string; boundary: string }[] }): CatEval {
  const all = [...paths];
  const has = (re: RegExp) => all.filter((p) => re.test(p));
  const boundaries = all.map((p) => ({ p, b: storage.getFile(snap, p)?.boundary }));
  const ok = (reason: string): CatEval => ({ satisfied: true, reason, searched: [], impact: '' });
  const no = (impact: string, searched: string[] = all.slice(0, 6)): CatEval => ({ satisfied: false, reason: 'not found in selected context', searched, impact });

  switch (cat) {
    case 'investigation_targets': return expansion.seeds.length ? ok(`${expansion.seeds.length} likely investigation target(s) identified`) : no('No likely file or symbol was found for this question');
    case 'target_files': return expansion.seeds.length ? ok(`${expansion.seeds.length} target file(s) identified`) : no('No file to change is known; agent must not guess a target');
    case 'parent_route': { const m = has(/route|page|pages?\//i); return m.length ? ok(`route/page file(s): ${m.slice(0,3).join(', ')}`) : no('Owning route/page unknown'); }
    case 'child_components': { const m = boundaries.filter(b => /component|\.tsx$/i.test(b.p)); return m.length ? ok(`component file(s): ${m.slice(0,3).map(x=>x.p).join(', ')}`) : no('No child components found'); }
    case 'state_management': { const m = has(/store|state|context|redux|zustand|reducer/i); return m.length ? ok(`state file(s): ${m.slice(0,2).join(', ')}`) : no('No state-management module found'); }
    case 'styling_theme_system': { const m = has(/theme|style|css|scss|tailwind|tokens/i); return m.length ? ok(`styling file(s): ${m.slice(0,2).join(', ')}`) : no('No theme/styling system found'); }
    case 'existing_similar_implementation': { const hits = storage.searchText(snap, 'theme dark mode toggle preference', 5).filter(p => !paths.has(p)); return hits.length ? ok(`similar code: ${hits.slice(0,2).join(', ')}`) : no('No existing similar implementation found'); }
    case 'api_surface': { const m = has(/route|api|controller|handler|server/i); return m.length ? ok(`api file(s): ${m.slice(0,2).join(', ')}`) : no('No API surface found'); }
    case 'callers': { const callers = expansion.related.filter(r => r.boundary !== 'test'); return callers.length ? ok(`${callers.length} caller/dependent file(s)`) : no('No callers/dependents found; blast radius unclear'); }
    case 'data_models': { const m = has(/model|schema|entity|types?\//i); return m.length ? ok(`model file(s): ${m.slice(0,2).join(', ')}`) : no('No data models found'); }
    case 'schema_migrations': { const m = has(/migration|migrate/i); return m.length ? ok(`migration file(s): ${m.slice(0,2).join(', ')}`) : no('No migrations found'); }
    case 'validation_layer': { const m = has(/valid|zod|joi|yup|schema/i); return m.length ? ok('validation present') : no('No validation layer found'); }
    case 'auth_security_boundary': { const m = has(/auth|security|login|session|permission/i); return m.length ? ok('auth/security boundary present') : no('No auth/security boundary found'); }
    case 'tests': { const m = expansion.related.filter(r => r.boundary === 'test'); return m.length ? ok(`${m.length} related test file(s)`) : no('No related tests found'); }
    case 'build_commands': { const pj = storage.getFileContent(snap, 'package.json'); return pj && /"scripts"/.test(pj) ? ok('package.json scripts present') : no('No build/test commands found', ['package.json']); }
    case 'config': { const m = boundaries.filter(b => b.b === 'config'); return m.length ? ok(`config file(s): ${m.slice(0,2).map(x=>x.p).join(', ')}`) : no('No config files in scope'); }
    case 'documentation': { const m = boundaries.filter(b => b.b === 'doc'); return m.length ? ok('documentation present') : no('No documentation in scope'); }
    default: return no('unknown category');
  }
}

function derivePatternsAndForbidden(storage: Storage, snap: string, files: RelevantFile[], cls: Classification): { patterns: ExistingPattern[]; forbidden_moves: ForbiddenMove[] } {
  const patterns: ExistingPattern[] = [];
  const forbidden_moves: ForbiddenMove[] = [];

  // Shared-symbol pattern: a symbol imported by >=2 distinct files (PR3 material).
  for (const f of files) {
    const incoming = storage.incomingEdges(snap, f.path, ['imports']).filter((e) => e.symbol);
    const bySym = new Map<string, Set<string>>();
    for (const e of incoming) {
      if (!e.symbol) continue;
      if (!bySym.has(e.symbol)) bySym.set(e.symbol, new Set());
      bySym.get(e.symbol)!.add(e.from_path);
    }
    for (const [sym, users] of bySym) {
      if (users.size >= 2) {
        const ev: EvidenceRef = { source_type: 'symbol', path: f.path, symbol: sym, start_line: null, end_line: null, relationship: 'shared_export' };
        patterns.push({ description: `${sym} (exported from ${f.path}) is the shared mechanism used by ${users.size} modules`, required_to_follow: false, evidence: [ev] });
        forbidden_moves.push({ description: `An export named ${sym} already exists in ${f.path} (used by ${users.size} modules); adding a second definition would fork behaviour. Decide reuse vs. replace deliberately and update dependents — its existence is not evidence it is correct.`, reason: `awareness, not a mandate to conform (spec D3)`, evidence: [ev] });
      }
    }
  }

  // Boundary-based forbidden moves (FR21/FR10).
  for (const f of files) {
    const ev: EvidenceRef = { source_type: 'file', path: f.path, symbol: null, start_line: null, end_line: null, relationship: 'boundary' };
    if (f.role === 'generated') forbidden_moves.push({ description: `Do not modify generated file ${f.path}`, reason: 'file is generated; edits will be overwritten', evidence: [ev] });
    if (f.role === 'vendor') forbidden_moves.push({ description: `Do not modify vendor file ${f.path}`, reason: 'file is third-party/vendored', evidence: [ev] });
  }

  // Task-shape forbidden moves.
  const isSecurity = cls.task.task_types.includes('security_sensitive_change');
  const authFile = files.find((f) => /auth|security|login|session|permission/i.test(f.path));
  if (authFile && !isSecurity) {
    forbidden_moves.push({ description: `An auth/security boundary exists in ${authFile.path}; changing or bypassing it is a security-relevant decision — make it deliberately, not by accident.`, reason: 'awareness; task is not a security change', evidence: [{ source_type: 'file', path: authFile.path, symbol: null, start_line: null, end_line: null, relationship: 'security_boundary' }] });
  }
  const stateFile = files.find((f) => /store|state|context|redux|zustand/i.test(f.path));
  if (stateFile && cls.task.task_types.includes('frontend_ui_change')) {
    forbidden_moves.push({ description: `${stateFile.path} already provides state management; a parallel mechanism would fork state. Decide reuse vs. replace deliberately — existing state code is not automatically the right pattern.`, reason: 'awareness, not a mandate to conform (spec D3)', evidence: [{ source_type: 'file', path: stateFile.path, symbol: null, start_line: null, end_line: null, relationship: 'state_management' }] });
  }

  return { patterns, forbidden_moves };
}

function deriveKnownFacts(storage: Storage, snap: string, seeds: string[], symbols: RelevantSymbol[]): KnownFact[] {
  const facts: KnownFact[] = [];
  for (const s of symbols.slice(0, 12)) {
    facts.push({ statement: `${s.kind} ${s.name} is defined in ${s.file}`, evidence: s.evidence });
  }
  if (facts.length === 0 && seeds.length) {
    const p = seeds[0]!;
    facts.push({ statement: `${p} is in scope for this task`, evidence: [{ source_type: 'external_input', path: p, symbol: null, start_line: null, end_line: null, relationship: 'task_target' }] });
  }
  for (const p of seeds) {
    for (const f of storage.staticFindingsForFile(snap, p).slice(0, 6)) {
      facts.push({
        statement: `Static analysis reports ${f.severity} ${f.rule_id} in ${p}: ${f.message}`,
        evidence: [{
          source_type: 'static_analysis',
          path: p,
          symbol: null,
          start_line: f.start_line,
          end_line: f.end_line,
          relationship: f.rule_id,
        }],
      });
    }
  }
  return facts;
}

function deriveCheckedNotRelevant(storage: Storage, snap: string, cls: Classification, included: Set<string>): CheckedNotRelevant[] {
  const out: CheckedNotRelevant[] = [];
  const hits = storage.searchText(snap, cls.keywords.join(' '), 20);
  for (const p of hits) {
    if (included.has(p)) continue;
    const f = storage.getFile(snap, p);
    if (!f || f.boundary === 'doc') continue;
    out.push({ path: p, reason: 'matched task keywords lexically but has no code relationship to the target(s)' });
    if (out.length >= 8) break;
  }
  return out;
}

function deriveConstraints(files: RelevantFile[]): Constraint[] {
  const out: Constraint[] = [];
  out.push({ description: 'Use only facts present in this package; request context expansion for anything missing rather than guessing.', source: 'user_need', evidence: [] });
  if (files.some((f) => f.role === 'generated')) {
    out.push({ description: 'Generated files are present in scope; treat them as read-only boundaries.', source: 'repository_evidence', evidence: [] });
  }
  return out;
}

function scanFlags(storage: Storage, snap: string, paths: Set<string>, scanner: PromptInjectionScanner): FlaggedRepositoryText[] {
  const out: FlaggedRepositoryText[] = [];
  for (const p of paths) {
    const content = storage.getFileContent(snap, p);
    if (!content) continue;
    for (const span of scanner.scan(p, content)) {
      out.push({ path: p, start_line: span.start_line, end_line: span.end_line, reason: span.reason });
    }
  }
  return out;
}

function deriveVerification(storage: Storage, snap: string, files: RelevantFile[], cls: Classification) {
  if (isCodebaseQuestion(cls)) return { commands: [], manual_checks: [], affected_tests: [] };
  const commands: string[] = [];
  const pj = storage.getFileContent(snap, 'package.json');
  if (pj) {
    try {
      const scripts = (JSON.parse(pj).scripts ?? {}) as Record<string, string>;
      if (scripts['build']) commands.push('npm run build');
      if (scripts['test']) commands.push('npm test');
      if (scripts['lint']) commands.push('npm run lint');
    } catch { /* ignore */ }
  }
  const affected_tests = files.filter((f) => f.role === 'test').map((f) => f.path);
  const manual_checks: string[] = [];
  if (cls.task.task_types.includes('frontend_ui_change')) manual_checks.push('Visually verify the affected UI in all relevant states.');
  if (affected_tests.length === 0) manual_checks.push('No related tests were found; add or identify tests covering the change.');
  if (commands.length === 0) manual_checks.push('No project build/test command was discovered; confirm how this project is validated.');
  return { commands, manual_checks, affected_tests };
}

function estimateTokens(files: RelevantFile[], facts: KnownFact[]): number {
  let chars = 0;
  for (const f of files) chars += f.path.length + f.relevance_reason.length + f.key_facts.join('').length;
  for (const f of facts) chars += f.statement.length;
  return Math.ceil(chars / 4) + files.length * 20;
}

function isCodebaseQuestion(cls: Classification): boolean {
  return cls.task.intent === 'locate_understand';
}

interface ScoredPath { path: string; score: number }

function rankedKeywordSeeds(storage: Storage, snap: string, cls: Classification): string[] {
  const keywords = expandedKeywordTerms(cls.keywords);
  if (keywords.length === 0) return [];
  const keySet = new Set(keywords);
  const scored = new Map<string, number>();
  const add = (path: string, score: number) => {
    const f = storage.getFile(snap, path);
    if (!f || !['source', 'config', 'test'].includes(f.boundary)) return;
    if (looksLikeDumpOrArtifact(path)) {
      if (isCodebaseQuestion(cls)) return;
      score -= 8;
    }
    if (isCodebaseQuestion(cls)) score += questionFileShapeScore(path, f.boundary);
    if (f.boundary === 'source') score += 1;
    if (f.boundary === 'test') score -= 1;
    if (isCodebaseQuestion(cls) && looksLikeWeakQuestionSeed(path) && score < 4) return;
    scored.set(path, (scored.get(path) ?? 0) + score);
  };

  for (const f of storage.listFiles(snap)) {
    const words = wordsForPath(f.path);
    let score = 0;
    for (const k of keySet) {
      if (words.has(k)) score += 4;
      else if (f.path.toLowerCase().includes(k)) score += 1;
    }
    const symbolWords = wordsForSymbols(storage.symbolsInFile(snap, f.path));
    for (const k of keySet) {
      if (symbolWords.has(k)) score += 3;
    }
    const pathPhrase = [...words].join(' ');
    const compactPath = f.path.replace(/[^a-z0-9]/gi, '').toLowerCase();
    for (let i = 0; i < keywords.length - 1; i++) {
      const a = keywords[i]!;
      const b = keywords[i + 1]!;
      if (pathPhrase.includes(`${a} ${b}`)) score += 4;
      if (compactPath.includes(`${a}${b}`)) score += 3;
    }
    if (score > 0) add(f.path, score);
  }

  for (const path of storage.searchText(snap, keywords.join(' '), 80)) {
    const content = storage.getFileContent(snap, path) ?? '';
    add(path, contentKeywordScore(content, keywords));
  }

  return [...scored.entries()]
    .map(([path, score]): ScoredPath => ({ path, score }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .map((x) => x.path);
}

function expandedKeywordTerms(raw: string[]): string[] {
  const out: string[] = [];
  for (const k of raw.map((x) => x.toLowerCase()).filter((x) => x.length > 2)) {
    out.push(k);
    if (k.endsWith('ies') && k.length > 4) out.push(`${k.slice(0, -3)}y`);
    else if (k.endsWith('es') && k.length > 4) out.push(k.slice(0, -2));
    else if (k.endsWith('s') && k.length > 3) out.push(k.slice(0, -1));
  }
  return [...new Set(out)];
}

function wordsForSymbols(symbols: SymbolRecord[]): Set<string> {
  const all = symbols.flatMap((s) => [...wordsForPath(s.name)]);
  return new Set(all);
}

function contentKeywordScore(content: string, keywords: string[]): number {
  const text = content.toLowerCase();
  let score = 0;
  let matched = 0;
  for (const k of keywords) {
    const occurrences = text.split(k).length - 1;
    if (occurrences > 0) {
      matched++;
      score += Math.min(2, occurrences);
    }
  }
  for (let i = 0; i < keywords.length - 1; i++) {
    const phrase = `${keywords[i]} ${keywords[i + 1]}`;
    if (text.includes(phrase)) score += 3;
  }
  if (matched >= 2) score += Math.min(4, matched);
  return Math.min(score, 14);
}

function questionFileShapeScore(path: string, boundary: string): number {
  const lower = path.toLowerCase();
  let score = 0;
  if (/\/components?\//.test(lower) || lower.startsWith('components/')) score += 5;
  if (/(^|\/)(backend\/routes?|routes?|api)\//.test(lower)) score += 4;
  if (/(^|\/)lib\/api\//.test(lower)) score += 3;
  if (/\.(tsx|jsx)$/.test(lower)) score += 3;
  if (/\/(app|index|main)\.(tsx|jsx|ts|js)$/.test(lower) || /^(app|index|main)\.(tsx|jsx|ts|js)$/.test(lower)) score -= 15;
  if (/\/(migrations?|seeds?|fixtures?|__tests__|tests?)\//.test(lower) || /(^|\/)seed[-_.]/.test(lower)) score -= 20;
  if (/\/db\/queries\//.test(lower)) score -= 4;
  if (boundary === 'test') score -= 4;
  return score;
}

function wordsForPath(path: string): Set<string> {
  const expanded = path
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase();
  return new Set(expanded.match(/[a-z0-9_]+/g) ?? []);
}

function looksLikeDumpOrArtifact(path: string): boolean {
  return /(^|\/|\\)(_?recycle_?bin|temp|tmp|logs?|backup|backups?|report|reports?|coverage|fixture|fixtures?)(_|-|\/|\\|\.)/i.test(path)
    || /(^|\/)(api-endpoint-report|.*logs?\.json)$/i.test(path)
    || /(^|\/)(auto[_-]?fill[_-]?system[_-]?map|.*source[_-]?trace|test[_-]?vite|test[_-]?loadenv|test[_-]?env[_-]?inheritance)\.[cm]?[jt]s$/i.test(path);
}

function looksLikeWeakQuestionSeed(path: string): boolean {
  const lower = path.toLowerCase();
  return /\/(app|index|main)\.(tsx|jsx|ts|js)$/.test(lower)
    || /^(app|index|main)\.(tsx|jsx|ts|js)$/.test(lower)
    || /\/(migrations?|seeds?|fixtures?|__tests__|tests?)\//.test(lower)
    || /(^|\/)seed[-_.]/.test(lower);
}
