// Provenance / trust (Step 6, FR-X4). The `Trust` type mirrors the DB CHECK of
// Step 7, and `assertProvenance` is the helper every learned-record DAO entry
// point (Step 9) calls so that provenance cannot be laundered through the trust
// column. It lives here with the shared types because Step 9 consumes it and
// Step 11 (redactor, injection flagger) is built after Step 9.
//
// FR-X4 is "provenance/trust not launderable": the persisted trust must reflect
// the true provenance of the content. A repo-derived (non-human) input can never
// be written as 'human', and a genuinely human input is not silently downgraded.
// (This is the behavioral contract the plan states at its Step-9 discussion; its
// runtime gate is T-9-1, its compile-time gate T-11-5. The `inputsAreHuman`
// attestation is the caller's honest statement of the content's origin.)

export type Trust = 'untrusted_repo' | 'human' | 'mechanical';

export const TRUST_VALUES: readonly Trust[] = ['untrusted_repo', 'human', 'mechanical'];

/** True iff `v` is one of the three defined trust values (runtime guard). */
export function isTrust(v: unknown): v is Trust {
  return typeof v === 'string' && (TRUST_VALUES as readonly string[]).includes(v);
}

export interface ProvenancedWrite {
  /** The trust the caller intends to persist. */
  trust: Trust;
  /** The caller's attestation that every input to this record is human-provenance. */
  inputsAreHuman: boolean;
}

/**
 * Enforce FR-X4 on a learned-record write. Returns `row.trust` when it is
 * consistent with the attested provenance; throws otherwise. Human provenance
 * must be written as 'human' and non-human provenance must not be — neither
 * direction may launder. 'mechanical' vs 'untrusted_repo' (both non-human) is a
 * separate axis the caller owns.
 */
export function assertProvenance<T extends ProvenancedWrite>(row: T): T {
  if (!isTrust(row.trust)) {
    throw new Error(`assertProvenance: invalid trust value ${JSON.stringify(row.trust)}`);
  }
  if (row.inputsAreHuman && row.trust !== 'human') {
    throw new Error("assertProvenance: human-provenance input must be written as trust='human' (FR-X4)");
  }
  if (!row.inputsAreHuman && row.trust === 'human') {
    throw new Error("assertProvenance: non-human input cannot be written as trust='human' (FR-X4)");
  }
  return row;
}
