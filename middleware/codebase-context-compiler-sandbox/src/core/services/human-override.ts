import { randomUUID } from 'node:crypto';
import type { Storage } from '../ports/storage.js';
import type { ContextPackage, RelevantFile } from '../domain/context-package.js';
import type { HumanOverrideRequest } from '../domain/human-override.js';
import type { EvidenceRef } from '../domain/evidence.js';

export function applyHumanOverride(storage: Storage, pkg: ContextPackage, request: HumanOverrideRequest): ContextPackage {
  const evidence = overrideEvidence(request);
  const next: ContextPackage = {
    ...pkg,
    package_id: randomUUID(),
    generated_at: new Date().toISOString(),
    relevant_files: [...pkg.relevant_files],
    known_facts: [...pkg.known_facts],
    forbidden_moves: [...pkg.forbidden_moves],
    context_gaps_allowed_to_create: [...pkg.context_gaps_allowed_to_create],
    constraints: [...pkg.constraints],
    unknowns: [...pkg.unknowns],
    context_requirements: [...pkg.context_requirements],
  };

  switch (request.action) {
    case 'add_known_fact':
      requireField(request.statement, 'statement');
      next.known_facts.push({ statement: request.statement!, evidence: [evidence] });
      break;
    case 'add_relevant_file':
      requireField(request.path, 'path');
      next.relevant_files.push(relevantFileFromOverride(storage, pkg, request, evidence));
      break;
    case 'add_forbidden_move':
      requireField(request.description, 'description');
      next.forbidden_moves.push({ description: request.description!, reason: request.reason, evidence: [evidence] });
      break;
    case 'add_allowed_creation':
      requireField(request.description, 'description');
      next.context_gaps_allowed_to_create.push({ description: request.description!, reason: request.reason });
      break;
    case 'add_constraint':
      requireField(request.description, 'description');
      next.constraints.push({ description: request.description!, source: 'human_override', evidence: [evidence] });
      break;
    case 'resolve_unknown':
      requireField(request.description ?? request.category, 'description or category');
      next.unknowns = next.unknowns.filter((u) => !matches(request.description ?? request.category!, u.description));
      if (request.category) {
        next.context_requirements = next.context_requirements.map((r) => r.category === request.category
          ? { ...r, status: 'satisfied', reason: `resolved by human override: ${request.reason}` }
          : r);
      }
      next.known_facts.push({ statement: `Human override resolved: ${request.description ?? request.category}. Reason: ${request.reason}`, evidence: [evidence] });
      break;
  }
  return next;
}

function relevantFileFromOverride(storage: Storage, pkg: ContextPackage, request: HumanOverrideRequest, evidence: EvidenceRef): RelevantFile {
  const file = storage.getFile(pkg.repository.snapshot_id, request.path!);
  return {
    path: request.path!,
    role: file?.boundary ?? 'unknown',
    required: true,
    relevance_reason: request.reason,
    evidence: [evidence],
    key_facts: storage.symbolsInFile(pkg.repository.snapshot_id, request.path!).slice(0, 8)
      .map((s) => `${s.kind} ${s.name}${s.exported ? ' (exported)' : ''}`),
  };
}

function overrideEvidence(request: HumanOverrideRequest): EvidenceRef {
  return {
    source_type: 'human_override',
    path: request.path ?? '<human-override>',
    symbol: null,
    start_line: null,
    end_line: null,
    relationship: request.action,
  };
}

function requireField(value: unknown, name: string): void {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`Human override action requires ${name}.`);
}

function matches(needle: string, haystack: string): boolean {
  const words = needle.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
  const text = haystack.toLowerCase();
  return words.some((w) => w.length > 3 && text.includes(w));
}
