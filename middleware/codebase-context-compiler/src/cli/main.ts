#!/usr/bin/env node
/**
 * ctxpack CLI (Architecture: File-system CLI contract + agent harness).
 * Commands: init, index, package, expand, override, check-plan, review, run-agent.
 */
import { Command } from 'commander';
import { runIndex } from './commands/index.js';
import { runPackage } from './commands/package.js';
import { runCheckPlan } from './commands/check-plan.js';
import { runReview } from './commands/review.js';
import { runAgent } from './commands/run-agent.js';
import { runInit } from './commands/init.js';
import { runHook } from './commands/hook.js';
import { runExpand } from './commands/expand.js';
import { runOverride } from './commands/override.js';
import type { VerificationStatus } from '../core/domain/review-finding.js';

const program = new Command();
program.name('ctxpack')
  .description('Compiles task-scoped, evidence-backed context packages for coding agents and enforces them via an injection + edit-gate harness.')
  .version('0.1.0');

program.command('index')
  .description('Build or update the repository map.')
  .argument('[root]', 'repository root (default: cwd)')
  .action(async (root) => { process.exit(await runIndex(root)); });

program.command('package')
  .alias('generate')
  .description('Generate a Context Package (JSON + Markdown) for a task.')
  .argument('<task>', 'the coding task, e.g. "add dark mode to settings page"')
  .option('-r, --root <root>', 'repository root (default: cwd)')
  .option('-b, --budget <tokens>', 'token budget', (v) => parseInt(v, 10))
  .action(async (task, o) => { process.exit(await runPackage(task, o)); });

program.command('check-plan')
  .description('Run the assumption firewall over an agent implementation plan.')
  .argument('<plan-file>', 'path to the plan text file')
  .option('-r, --root <root>', 'repository root (default: cwd)')
  .option('-p, --package <file>', 'package JSON (default: .context/task-context.json)')
  .action(async (plan, o) => { process.exit(await runCheckPlan(plan, o)); });

program.command('expand')
  .description('Request additional task-relevant context, updating the package or returning a denial.')
  .argument('<request-file>', 'JSON request with missing, why_needed, and blocked_claim_or_step')
  .option('-r, --root <root>', 'repository root (default: cwd)')
  .option('-p, --package <file>', 'package JSON (default: .context/task-context.json)')
  .action(async (request, o) => { process.exit(await runExpand(request, o)); });

program.command('override')
  .description('Apply an explicit human reviewer override to the Context Package.')
  .argument('<override-file>', 'JSON override request')
  .option('-r, --root <root>', 'repository root (default: cwd)')
  .option('-p, --package <file>', 'package JSON (default: .context/task-context.json)')
  .action(async (request, o) => { process.exit(await runOverride(request, o)); });

program.command('review')
  .description('Review a patch (unified diff) against the Context Package.')
  .argument('<diff-file>', 'path to a unified diff, or "-" for stdin')
  .option('-r, --root <root>', 'repository root (default: cwd)')
  .option('-p, --package <file>', 'package JSON (default: .context/task-context.json)')
  .option('--sarif', 'also emit .context/review.sarif')
  .option('--verification <status>', 'run_passed | run_failed | not_run | unknown | waived', 'unknown')
  .action(async (diff, o) => { process.exit(await runReview(diff, { ...o, verification: o.verification as VerificationStatus })); });

program.command('run-agent')
  .description('Inject the package into an agent and gate edits behind a firewall-approved plan.')
  .option('-r, --root <root>', 'repository root (default: cwd)')
  .option('-p, --package <file>', 'package JSON (default: .context/task-context.json)')
  .option('--plan <file>', 'plan file to demonstrate enforcement when no live agent is available')
  .action(async (o) => { process.exit(await runAgent(o)); });

program.command('init')
  .description('Install Claude Code hooks so ctxpack fires automatically (no manual commands).')
  .argument('[root]', 'repository root (default: cwd)')
  .action(async (root) => { process.exit(await runInit(root)); });

program.command('hook')
  .description('Internal: Claude Code hook bridge (reads stdin, writes hook JSON).')
  .argument('<event>', 'session-start | user-prompt | pre-tool | permission-request | subagent-start | stop')
  .action(async (event) => { process.exit(await runHook(event)); });

program.parseAsync(process.argv).catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
