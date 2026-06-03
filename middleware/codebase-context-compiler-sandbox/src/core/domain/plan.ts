/**
 * Assumption-firewall domain types (Spec FR15, AIR2/AIR4, AC3; Architecture T3).
 *
 * The firewall extracts factual claims from an agent's implementation plan and
 * checks each against the Context Package. A claim referencing a file/symbol/
 * pattern/API not present in the package fails UNLESS it is backed by evidence
 * or explicitly proposed as an allowed creation point.
 */
export interface ExtractedClaim {
  /** Raw claim text from the plan. */
  text: string;
  /** Referenced artifacts parsed out of the claim (paths, symbols, identifiers). */
  references: string[];
  /** Line in the plan where the claim appeared (1-based). */
  line: number;
}

export type ClaimVerdict =
  | 'supported'            // matches package evidence/files/symbols
  | 'allowed_creation'     // matches an allowed creation point (FR9)
  | 'unsupported'          // no support found (AC3 failure)
  | 'contradicted'         // conflicts with package evidence
  | 'out_of_scope'         // references something outside package scope
  | 'forbidden';           // proposes a forbidden move (FR10)

export interface ClaimCheck {
  claim: ExtractedClaim;
  verdict: ClaimVerdict;
  reason: string;
  /** Reference that triggered the verdict, when applicable. */
  offending_reference: string | null;
}

export interface FirewallResult {
  package_id: string;
  checked_at: string;
  /** Passes only when no claim is unsupported/contradicted/out_of_scope/forbidden. */
  passed: boolean;
  checks: ClaimCheck[];
}
