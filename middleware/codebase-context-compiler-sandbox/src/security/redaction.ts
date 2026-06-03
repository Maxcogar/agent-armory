/** Redaction marker helpers (Spec SR2). */
export function redactionMarker(kind: string): string {
  return `[REDACTED:${kind}]`;
}
