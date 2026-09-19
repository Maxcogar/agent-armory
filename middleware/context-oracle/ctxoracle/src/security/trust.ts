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

/** Provenance kinds — mirrors the DB CHECK on every knowledge table's PROV block. */
export type ProvKind = 'repo_span' | 'commit' | 'human' | 'mechanical' | 'session';

/** The provenance block a knowledge-record write must carry (Step 9). Required
 *  at the type level so a write without it fails to compile (T-9-2), and
 *  validated at runtime by `provCreateValues` (T-9-1's laundering case). */
export interface Provenance {
  prov_kind: ProvKind;
  prov_ref: string;
  trust: Trust;
  injection_suspect?: boolean;
}

/**
 * Validate a knowledge write's provenance (FR-X4) and expand it to the six PROV
 * column values in schema order (prov_kind, prov_ref, trust, injection_suspect,
 * created_at, updated_at). The human-provenance attestation is derived from
 * prov_kind, so a human-labeled trust on non-human provenance — or vice versa —
 * is rejected before any row is written.
 */
export function provCreateValues(
  p: Provenance,
  createdAt: number,
  updatedAt: number
): [ProvKind, string, Trust, number, number, number] {
  assertProvenance({ trust: p.trust, inputsAreHuman: p.prov_kind === 'human' });
  return [p.prov_kind, p.prov_ref, p.trust, p.injection_suspect === true ? 1 : 0, createdAt, updatedAt];
}
