import { describe, it, expect, afterEach } from 'vitest';
import { fixturePackage, indexedFixture, FIXTURE } from '../helpers.js';
import { SchemaValidator } from '../../src/adapters/schema/validator.js';
import { AssumptionFirewall } from '../../src/core/services/assumption-firewall.js';
import { PatchReviewer } from '../../src/core/services/patch-reviewer.js';
import { AgentHarness } from '../../src/core/services/agent-harness.js';
import { DryRunAdapter } from '../../src/adapters/agent/dry-run-adapter.js';
import { checkStaleness } from '../../src/core/services/staleness.js';
import { SqliteStorage } from '../../src/adapters/storage/sqlite-storage.js';
import { Indexer } from '../../src/core/services/indexer.js';
import { TreeSitterParserAdapter } from '../../src/adapters/tree-sitter/index.js';
import { SecretScanner } from '../../src/security/secret-scanner.js';
import { expandPackageContext } from '../../src/core/services/context-expansion.js';
import { writeFileSync, rmSync, cpSync, appendFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let open: SqliteStorage | null = null;
afterEach(() => { open?.close(); open = null; });

describe('Acceptance criteria', () => {
  it('AC1 - generates a package with all mandated sections', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    for (const k of ['task', 'context_requirements', 'relevant_files', 'known_facts', 'unknowns', 'forbidden_moves', 'verification_guidance'] as const) {
      expect(pkg[k]).toBeDefined();
    }
    expect(pkg.task.task_types).toContain('frontend_ui_change');
  });

  it('AC2 - every relevant file carries a relevance reason and evidence', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    for (const f of pkg.relevant_files) {
      expect(f.relevance_reason.length).toBeGreaterThan(0);
      expect(f.evidence.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(f.confidence);
      expect(f.signals.length).toBeGreaterThan(0);
      expect(f.corroboration_count).toBeGreaterThan(0);
      expect(['full', 'excerpt', 'signature', 'pointer']).toContain(f.representation);
    }
    for (const k of pkg.known_facts) expect(k.evidence.length).toBeGreaterThan(0);
  });

  it('AC3 - assumption firewall flags invented components, APIs, and files', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    const fw = new AssumptionFirewall();
    const bad = fw.check(pkg, 'Import ThemeProvider from src/theme/ThemeProvider.tsx and call useGlobalTheme().');
    expect(bad.passed).toBe(false);
    const good = fw.check(pkg, 'Modify src/routes/SettingsPage.tsx and reuse getPreference from src/state/store.ts.');
    expect(good.passed).toBe(true);
  });

  it('AC4 - context expansion updates the package or returns a reasoned denial', async () => {
    const { storage, snapshot } = await indexedFixture(); open = storage;
    const { buildPackage } = await import('../../src/core/services/package-builder.js');
    const pkg = buildPackage(storage, snapshot, 'update package.json scripts');

    const expanded = expandPackageContext(storage, pkg, {
      missing: 'related test coverage',
      why_needed: 'the implementation step is blocked until the relevant tests are known',
      blocked_claim_or_step: 'decide which test file must be updated',
      candidate_paths: ['tests/settings.test.ts'],
    });
    expect(expanded.denial).toBeNull();
    expect(expanded.updated_package?.package_id).not.toBe(pkg.package_id);
    expect(expanded.added_files.some((f) => f.path === 'tests/settings.test.ts')).toBe(true);

    const denied = expandPackageContext(storage, pkg, {
      missing: 'nonexistent payment gateway context',
      why_needed: 'the plan claimed a payment gateway exists',
      blocked_claim_or_step: 'modify PaymentGateway',
      candidate_paths: ['src/payments/PaymentGateway.ts'],
    });
    expect(denied.updated_package).toBeNull();
    expect(denied.denial?.reason).toContain('No requested context');
  });

  it('AC5 - patch review flags out-of-scope modifications', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    const diff = 'diff --git a/src/unrelated/x.ts b/src/unrelated/x.ts\n--- a/src/unrelated/x.ts\n+++ b/src/unrelated/x.ts\n+const a=1;';
    const r = new PatchReviewer(storage).review({ pkg, diff });
    expect(r.findings.some((f) => f.rule_id === 'diff_scope' && f.path === 'src/unrelated/x.ts')).toBe(true);
  });

  it('AC6 - review flags a required file that was not addressed', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    const diff = 'diff --git a/README.md b/README.md\n--- a/README.md\n+++ b/README.md\n+x';
    const r = new PatchReviewer(storage).review({ pkg, diff });
    expect(r.findings.some((f) => f.rule_id === 'required_impact' && f.path === 'src/routes/SettingsPage.tsx')).toBe(true);
  });

  it('AC7 - unmet categories become unknowns, never facts', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    const unresolved = pkg.context_requirements.filter((c) => c.status === 'unresolved');
    expect(unresolved.length).toBeGreaterThan(0);
    for (const u of unresolved) {
      expect(pkg.unknowns.some((x) => x.description.toLowerCase().includes(u.category.replace(/_/g, ' ')))).toBe(true);
    }
  });

  it('AC8 - staleness is detected after a relevant file changes', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ctxpack-ac8-'));
    cpSync(FIXTURE, tmp, { recursive: true });
    const storage = new SqliteStorage(':memory:'); open = storage;
    const indexResult = await new Indexer(storage, [new TreeSitterParserAdapter()], new SecretScanner()).index(tmp, 'sample-app');
    const snapshot = storage.getSnapshot(indexResult.snapshotId)!;
    const { buildPackage } = await import('../../src/core/services/package-builder.js');
    const pkg = buildPackage(storage, snapshot, 'dark mode toggle for SettingsPage');
    expect(checkStaleness(tmp, 'sample-app', pkg).stale).toBe(false);
    appendFileSync(join(tmp, 'src/state/store.ts'), '\n// drift\n');
    expect(checkStaleness(tmp, 'sample-app', pkg).stale).toBe(true);
    rmSync(tmp, { recursive: true, force: true });
  });

  it('AC9 - prompt injection in repo text is surfaced as data, not obeyed', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    expect(pkg.flagged_repository_text.length).toBeGreaterThan(0);
    expect(pkg.flagged_repository_text[0]!.path).toBe('src/routes/SettingsPage.tsx');
    expect(pkg.forbidden_moves.some((m) => /ignore previous/i.test(m.description))).toBe(false);
  });

  it('AC10 - a malformed package is rejected before use', async () => {
    const v = new SchemaValidator();
    expect(v.validatePackage({ schema_version: '1.0.0' }).valid).toBe(false);
  });

  it('AIR1 - harness denies edits until a plan passes the firewall', async () => {
    const { pkg, storage } = await fixturePackage(); open = storage;
    const harness = new AgentHarness();
    const edits = [{ tool: 'Edit', input: { file_path: 'src/routes/SettingsPage.tsx' } }];

    const blocked = await harness.run(pkg, new DryRunAdapter({
      plan: 'Import ThemeProvider from src/theme/ThemeProvider.tsx', editAttempts: edits,
    }));
    expect(blocked.phase).toBe('blocked');
    expect(blocked.denied_edits).toBe(1);

    const allowed = await harness.run(pkg, new DryRunAdapter({
      plan: 'Modify src/routes/SettingsPage.tsx and reuse getPreference from src/state/store.ts', editAttempts: edits,
    }));
    expect(allowed.phase).toBe('edits_allowed');
    expect(allowed.denied_edits).toBe(0);

    const noPlan = await harness.run(pkg, new DryRunAdapter({ plan: null, editAttempts: edits }));
    expect(noPlan.phase).toBe('awaiting_plan');
    expect(noPlan.denied_edits).toBe(1);
  });
});
