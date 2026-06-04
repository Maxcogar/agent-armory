/**
 * Assumption firewall (Spec FR15, AIR2/AIR4, AC3; Architecture T3).
 *
 * Extracts factual claims from an agent's implementation plan and checks each
 * artifact reference against the Context Package. A reference to a file/symbol
 * not present in the package fails as `unsupported` UNLESS it is an allowed
 * creation point (FR9). This is the gate the harness consults before edits.
 */
import type { ContextPackage } from '../domain/context-package.js';
import type {
  ExtractedClaim, ClaimCheck, ClaimVerdict, FirewallResult,
} from '../domain/plan.js';

const CREATION_VERB = /\b(create|add|new|introduce|duplicate|build|scaffold|generate|write a|implement a)\b/i;

type RefKind = 'path' | 'call' | 'ident' | 'backtick';
interface Ref { token: string; kind: RefKind }

const PATH_RE = /\b[\w./-]*\.(?:ts|tsx|js|jsx|mjs|cjs|py|json|css|scss|md)\b|\b(?:[\w-]+\/){1,}[\w.-]+\b/;
// Multi-hump identifier: contains an internal case change, so it is code, not an
// English word. Matches ThemeProvider, SettingsPage, useGlobalTheme, getPreference.
const MULTIHUMP_RE = /^(?:[A-Z][a-z0-9]+){2,}$|^[a-z][a-z0-9]*(?:[A-Z][a-zA-Z0-9]*)+$/;
// Common verbs that can precede '(' in prose but are not code symbols.
const CALL_STOP = new Set(['call', 'use', 'add', 'create', 'update', 'remove', 'return', 'render', 'import', 'export', 'set', 'get']);

export class AssumptionFirewall {
  check(pkg: ContextPackage, planText: string): FirewallResult {
    const known = buildKnownSets(pkg);
    const lines = planText.split('\n');
    const checks: ClaimCheck[] = [];

    lines.forEach((raw, i) => {
      const line = raw.trim();
      if (!line) return;
      const refs = extractReferences(line);
      if (refs.length === 0) return;
      const claim: ExtractedClaim = { text: line, references: refs.map((r) => r.token), line: i + 1 };

      let worst: ClaimVerdict = 'supported';
      let reason = 'all references are supported by the package';
      let offending: string | null = null;
      const hasCreationVerb = CREATION_VERB.test(line);

      for (const ref of refs) {
        const v = classifyReference(ref, known, hasCreationVerb);
        if (severity(v.verdict) > severity(worst)) {
          worst = v.verdict; reason = v.reason; offending = ref.token;
        }
      }
      checks.push({ claim, verdict: worst, reason, offending_reference: offending });
    });

    const passed = !checks.some((c) =>
      c.verdict === 'unsupported' || c.verdict === 'contradicted' ||
      c.verdict === 'out_of_scope' || c.verdict === 'forbidden');

    return { package_id: pkg.package_id, checked_at: new Date().toISOString(), passed, checks };
  }
}

interface KnownSets {
  paths: Set<string>;
  basenames: Set<string>;
  symbols: Set<string>;
  forbiddenTargets: Set<string>;
  allowedKeywords: string[];
  unknownKeywords: string[];
}

function buildKnownSets(pkg: ContextPackage): KnownSets {
  const paths = new Set<string>();
  const basenames = new Set<string>();
  const symbols = new Set<string>();
  const addPath = (p: string) => { paths.add(p); const b = p.split('/').pop(); if (b) basenames.add(b); };

  for (const f of pkg.relevant_files) addPath(f.path);
  for (const c of pkg.checked_not_relevant) addPath(c.path);
  for (const f of pkg.flagged_repository_text) addPath(f.path);
  for (const f of pkg.relevant_files) for (const e of f.evidence) { if (e.path) addPath(e.path); if (e.symbol) symbols.add(e.symbol); }
  for (const s of pkg.relevant_symbols) symbols.add(s.name);
  for (const k of pkg.known_facts) for (const e of k.evidence) { if (e.symbol) symbols.add(e.symbol); if (e.path) addPath(e.path); }

  const forbiddenTargets = new Set<string>();
  for (const m of pkg.forbidden_moves) {
    for (const ref of extractReferences(m.description)) forbiddenTargets.add(ref.token);
    for (const e of m.evidence) { if (e.symbol) forbiddenTargets.add(e.symbol); if (e.path) forbiddenTargets.add(e.path); }
  }

  const allowedKeywords = pkg.context_gaps_allowed_to_create
    .flatMap((g) => g.description.toLowerCase().split(/\s+/)).filter((w) => w.length > 3);
  const unknownKeywords = pkg.unknowns
    .flatMap((u) => u.description.toLowerCase().split(/\s+/)).filter((w) => w.length > 3);

  return { paths, basenames, symbols, forbiddenTargets, allowedKeywords, unknownKeywords };
}

function extractReferences(line: string): Ref[] {
  const out = new Map<string, RefKind>();
  const setIf = (tok: string, kind: RefKind) => {
    if (tok.length <= 2) return;
    const prev = out.get(tok);
    if (!prev || rank(kind) > rank(prev)) out.set(tok, kind);
  };
  // backtick-quoted tokens: strong signal the author means a code artifact.
  for (const m of line.matchAll(/`([^`]+)`/g)) {
    const t = (m[1] ?? '').trim();
    if (!t) continue;
    setIf(t, PATH_RE.test(t) ? 'path' : 'backtick');
  }
  // file paths
  for (const m of line.matchAll(/\b[\w./-]*\.(?:ts|tsx|js|jsx|mjs|cjs|py|json|css|scss|md)\b/g)) setIf(m[0], 'path');
  for (const m of line.matchAll(/\b(?:[\w-]+\/){1,}[\w.-]+\b/g)) setIf(m[0], 'path');
  // function-call identifiers: name immediately followed by '('
  for (const m of line.matchAll(/\b([A-Za-z_]\w+)\s*\(/g)) {
    const t = m[1]!; if (!CALL_STOP.has(t.toLowerCase())) setIf(t, 'call');
  }
  // multi-hump identifiers (no parens) — components/classes/hooks named in prose
  for (const m of line.matchAll(/\b[A-Za-z_]\w+\b/g)) {
    if (MULTIHUMP_RE.test(m[0])) setIf(m[0], 'ident');
  }
  return [...out.entries()].map(([token, kind]) => ({ token, kind }));
}

function rank(k: RefKind): number { return { path: 3, call: 2, backtick: 1, ident: 0 }[k]; }

function classifyReference(ref: Ref, k: KnownSets, hasCreationVerb: boolean): { verdict: ClaimVerdict; reason: string } {
  const token = ref.token;
  const base = token.split('/').pop() ?? token;

  if (k.forbiddenTargets.has(token) && hasCreationVerb) {
    return { verdict: 'forbidden', reason: `plan proposes creating/duplicating "${token}", which is a forbidden move` };
  }
  if (k.paths.has(token) || k.basenames.has(base) || k.symbols.has(token)) {
    return { verdict: 'supported', reason: 'reference present in package' };
  }
  if (hasCreationVerb && matchesAllowedCreation(token, k.allowedKeywords)) {
    return { verdict: 'allowed_creation', reason: `"${token}" is an allowed creation point` };
  }
  // Unknown references that are concrete code artifacts are unsupported (AC3).
  if (ref.kind === 'path') {
    return { verdict: 'unsupported', reason: `file "${token}" is not in the package; it may not exist — request context expansion instead of assuming it` };
  }
  if (ref.kind === 'call' || ref.kind === 'ident' || ref.kind === 'backtick') {
    return { verdict: 'unsupported', reason: `"${token}" is not in the package; do not assume this symbol/API exists` };
  }
  return { verdict: 'supported', reason: 'not an asserted repository artifact' };
}

function matchesAllowedCreation(token: string, allowedKeywords: string[]): boolean {
  const words = token.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
  return words.some((w) => allowedKeywords.includes(w) || allowedKeywords.some((a) => w.includes(a) || a.includes(w)));
}

function severity(v: ClaimVerdict): number {
  switch (v) {
    case 'forbidden': return 5;
    case 'contradicted': return 4;
    case 'unsupported': return 3;
    case 'out_of_scope': return 2;
    case 'allowed_creation': return 1;
    case 'supported': return 0;
  }
}
