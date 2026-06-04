/**
 * Audit log (Spec SR5; Architecture D11). Records who/what generated a package,
 * which snapshot it used, expansion requests, and overrides so a reviewer can
 * reconstruct why an agent received a specific package. Backed by storage.
 */
import type { Storage } from '../core/ports/storage.js';

export class AuditLog {
  constructor(private storage: Storage, private actor: string) {}

  record(action: string, detail: string): void {
    this.storage.appendAudit({ ts: new Date().toISOString(), actor: this.actor, action, detail });
  }

  recent(limit = 50) {
    return this.storage.listAudit(limit);
  }
}
