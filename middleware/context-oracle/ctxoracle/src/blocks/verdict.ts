// The ONLY module that constructs a deny (Step 24, AD-10, AC-2). The verdict is an
// internal value and names no hook field; the adapter maps it to the wire.
declare const denyBrand: unique symbol;

export type DenyVerdict = {
  readonly kind: 'deny';
  readonly reason: string;
  readonly audit_id: string;
  readonly [denyBrand]: true;
};

export function makeDenyVerdict(reason: string, auditId: string): DenyVerdict {
  return { kind: 'deny', reason, audit_id: auditId } as DenyVerdict;
}
