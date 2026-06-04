/**
 * Context Package — the central artifact (Spec §6, §10; Architecture D9/D10).
 *
 * This is the machine contract between the compiler and the coding agent. Each
 * record type is separate and typed (Architecture D10) so facts, unknowns,
 * assumptions, allowed-creation-points, and forbidden moves never blur into a
 * single prose summary. The JSON is the authority; the Markdown companion
 * (FR13) is generated from it.
 */
import type { EvidenceRef } from './evidence.js';
import type { Task } from './task.js';

export const SCHEMA_VERSION = '1.0.0';

export type ContextRequirementStatus = 'satisfied' | 'unresolved' | 'not_applicable';

export interface ContextRequirement {
  category: string;
  status: ContextRequirementStatus;
  reason: string;
}

export type InclusionConfidence = 'low' | 'medium' | 'high';
export type RepresentationTier = 'full' | 'excerpt' | 'signature' | 'pointer';

export interface InclusionSignal {
  source: string;
  score: number;
  reason: string;
}

export interface RelevantFile {
  path: string;
  role: string;
  required: boolean;
  /** FR20: no file may appear without a relevance reason. */
  relevance_reason: string;
  confidence: InclusionConfidence;
  signals: InclusionSignal[];
  corroboration_count: number;
  representation: RepresentationTier;
  evidence: EvidenceRef[];
  key_facts: string[];
}

export interface RelevantSymbol {
  name: string;
  kind: string;
  file: string;
  relevance_reason: string;
  confidence: InclusionConfidence;
  signals: InclusionSignal[];
  corroboration_count: number;
  representation: RepresentationTier;
  evidence: EvidenceRef[];
}

export interface ExistingPattern {
  description: string;
  /** FR22: distinguish "observed" from "must follow". */
  required_to_follow: boolean;
  evidence: EvidenceRef[];
}

export type ConstraintSource =
  | 'standard'
  | 'user_need'
  | 'project_decision'
  | 'repository_evidence'
  | 'security_threat'
  | 'human_override';

export interface Constraint {
  description: string;
  source: ConstraintSource;
  evidence: EvidenceRef[];
}

export interface ForbiddenMove {
  description: string;
  reason: string;
  evidence: EvidenceRef[];
}

export interface KnownFact {
  statement: string;
  evidence: EvidenceRef[];
}

export interface Unknown {
  description: string;
  searched_locations: string[];
  impact: string;
}

export interface ContextGapAllowedToCreate {
  description: string;
  reason: string;
}

export interface CheckedNotRelevant {
  path: string;
  reason: string;
}

export interface VerificationGuidance {
  commands: string[];
  manual_checks: string[];
  affected_tests: string[];
}

export interface UnresolvedDecision {
  decision: string;
  owner: 'human' | 'architect' | 'implementer';
  blocks: string;
}

/**
 * Repository-text excerpt flagged as containing instruction-like content
 * (Spec SR3, Architecture T2). Surfaced as DATA, never as an instruction.
 */
export interface FlaggedRepositoryText {
  path: string;
  start_line: number | null;
  end_line: number | null;
  reason: string;
}

export interface TokenBudget {
  /** Configured budget in approximate tokens (NFR3). */
  budget: number;
  estimated: number;
  /** True when the minimum complete package exceeds the budget. */
  overflow: boolean;
}

export interface PackageRepository {
  name: string;
  root: string;
  revision: string | null;
  dirty_state: boolean;
  snapshot_id: string;
}

export interface ContextPackage {
  schema_version: string;
  package_id: string;
  generated_at: string;
  repository: PackageRepository;
  task: Task;
  context_requirements: ContextRequirement[];
  relevant_files: RelevantFile[];
  relevant_symbols: RelevantSymbol[];
  existing_patterns: ExistingPattern[];
  constraints: Constraint[];
  forbidden_moves: ForbiddenMove[];
  known_facts: KnownFact[];
  unknowns: Unknown[];
  context_gaps_allowed_to_create: ContextGapAllowedToCreate[];
  checked_not_relevant: CheckedNotRelevant[];
  verification_guidance: VerificationGuidance;
  unresolved_decisions: UnresolvedDecision[];
  /** Spec SR3 / Architecture T2 — untrusted instruction-like repo text, as data. */
  flagged_repository_text: FlaggedRepositoryText[];
  token_budget: TokenBudget;
}
