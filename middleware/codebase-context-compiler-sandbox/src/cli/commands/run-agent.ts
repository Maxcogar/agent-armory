/**
 * `ctxpack run-agent` — Agent Execution Harness entrypoint (Spec §18; AIR1).
 *
 * Injects the package into the agent's active context and gates edits behind a
 * firewall-approved plan. Uses the live Claude Code adapter when credentials +
 * SDK are present; otherwise can demonstrate enforcement with a supplied plan
 * file via the deterministic dry-run adapter.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { openContext, loadPackageFile, PKG_JSON } from '../app-context.js';
import { AgentHarness } from '../../core/services/agent-harness.js';
import { ClaudeCodeAdapter } from '../../adapters/agent/claude-code-adapter.js';
import { DryRunAdapter } from '../../adapters/agent/dry-run-adapter.js';
import { checkStaleness } from '../../core/services/staleness.js';
import { AuditLog } from '../../security/audit-log.js';

export interface RunAgentOpts { root?: string; package?: string; plan?: string }

export async function runAgent(opts: RunAgentOpts): Promise<number> {
  const ctx = openContext(opts.root);
  try {
    const pkg = loadPackageFile(opts.package ?? join(ctx.contextDir, PKG_JSON));
    ctx.validator.assertPackage(pkg); // FR12: never inject an invalid package

    const stale = checkStaleness(ctx.root, ctx.repoName, pkg);
    if (stale.stale) {
      console.error(`❌ Refusing to run: package is STALE (snapshot ${pkg.repository.snapshot_id} ≠ ${stale.currentSnapshotId}). Regenerate with \`ctxpack package\`.`);
      return 1;
    }

    const harness = new AgentHarness();
    const claude = new ClaudeCodeAdapter();

    let adapter;
    if (await claude.available()) {
      adapter = claude;
      console.log('Running Claude Code with injected context and edit gate…');
    } else if (opts.plan) {
      const plan = readFileSync(opts.plan, 'utf8');
      const editAttempts = pkg.relevant_files.filter((f) => f.required).map((f) => ({ tool: 'Edit', input: { file_path: f.path } }));
      adapter = new DryRunAdapter({ plan, editAttempts });
      console.log('No live Claude Code agent available; demonstrating enforcement with the supplied plan (dry run).');
    } else {
      console.error('No live agent available. Set ANTHROPIC_API_KEY (and install @anthropic-ai/claude-agent-sdk) to run Claude Code,');
      console.error('or pass --plan <file> to demonstrate the injection + edit-gate enforcement deterministically.');
      return 2;
    }

    const outcome = await harness.run(pkg, adapter);
    new AuditLog(ctx.storage, 'cli').record('run-agent', `id=${pkg.package_id} adapter=${adapter.name} phase=${outcome.phase} denied=${outcome.denied_edits}`);

    console.log(`\nHarness outcome:`);
    console.log(`  injected: ${outcome.injected}`);
    console.log(`  phase: ${outcome.phase}`);
    console.log(`  edits denied while gate closed: ${outcome.denied_edits}`);
    if (outcome.firewall) {
      console.log(`  plan firewall: ${outcome.firewall.passed ? 'passed' : 'FAILED'}`);
      for (const c of outcome.firewall.checks.filter((x) => x.verdict !== 'supported' && x.verdict !== 'allowed_creation')) {
        console.log(`    L${c.claim.line} [${c.verdict}] ${c.offending_reference ?? ''} — ${c.reason}`);
      }
    }
    console.log(`  summary: ${outcome.summary}`);
    return outcome.injected && outcome.phase !== 'blocked' ? 0 : 1;
  } finally {
    ctx.storage.close();
  }
}
