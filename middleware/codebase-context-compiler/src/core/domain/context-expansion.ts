import type { ContextPackage, RelevantFile, RelevantSymbol } from './context-package.js';

export interface ContextExpansionRequest {
  missing: string;
  why_needed: string;
  blocked_claim_or_step: string;
  candidate_paths?: string[];
  candidate_symbols?: string[];
  keywords?: string[];
}

export interface ContextExpansionDenial {
  reason: string;
  checked_paths: string[];
}

export interface ContextExpansionResult {
  request: ContextExpansionRequest;
  package_id: string;
  updated_package: ContextPackage | null;
  added_files: RelevantFile[];
  added_symbols: RelevantSymbol[];
  denial: ContextExpansionDenial | null;
}
