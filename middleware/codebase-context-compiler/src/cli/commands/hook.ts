/**
 * Native Claude Code hook bridge.
 *
 * This is the primary AIR1 path for regular Claude Code, not a custom agent
 * runner. UserPromptSubmit compiles and injects a task Context Package through
 * Claude Code hookSpecificOutput.additionalContext. PreToolUse denies edit
 * tools until the current
 * transcript contains a <CTXPACK_PLAN>...</CTXPACK_PLAN> block that passes the
 * assumption firewall for that package.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { openContext, loadPackageFile, PKG_JSON, PKG_MD } from '../app-context.js';
import { buildPackage } from '../../core/services/package-builder.js';
import { buildInjectionBlock } from '../../core/services/agent-harness.js';
import { renderPackageMarkdown } from '../../adapters/markdown/package-markdown-writer.js';
import { classifyTask } from '../../core/services/task-classifier.js';
import { buildReadCard, buildEditCard } from '../../core/services/context-card.js';
import { forbiddenBoundary } from '../../core/services/live-grounding.js';
import { TreeSitterParserAdapter } from '../../adapters/tree-sitter/index.js';
import { AuditLog } from '../../security/audit-log.js';
import { EDIT_TOOLS } from '../../core/ports/agent-injection-adapter.js';
import { AssumptionFirewall } from '../../core/services/assumption-firewall.js';
import { checkStaleness } from '../../core/services/staleness.js';
import {
  CTXPACK_PLAN_CLOSE,
  CTXPACK_PLAN_OPEN,
  extractLatestCtxpackPlan,
  transcriptText,
} from '../../core/services/plan-transcript.js';
import type { FirewallResult } from '../../core/domain/plan.js';

const READ_TOOLS = new Set(['Read', 'NotebookRead']);
const SUBAGENT_TOOLS = new Set(['Agent', 'Task', 'Explore']);
const SEARCH_TOOLS = new Set(['Grep', 'Glob', 'Search', 'LS']);

const STANDING_RULES = [
  'ctxpack is active in this Claude Code project.',
  'For coding prompts, ctxpack injects an evidence-backed Context Package before model execution.',
  `Before using edit tools, output a plan wrapped in ${CTXPACK_PLAN_OPEN} and ${CTXPACK_PLAN_CLOSE}.`,
  'Edit tools remain blocked until ctxpack validates that plan against the package.',
  'Existing code is evidence, not a standard to blindly conform to; judge it against the task and engineering standard.',
].join(' ');

function readStdin(): any {
  try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}

function looksLikeCodingTask(prompt: string): boolean {
  if (!prompt || prompt.trim().split(/\s+/).length < 3) return false;
  const c = classifyTask(prompt);
  return c.task.task_types.some((t) => t !== 'general_change') || c.mentionedPaths.length > 0 || c.mentionedSymbols.length > 0;
}

function looksLikeNonCodeWorkflowPrompt(prompt: string): boolean {
  if (!prompt || prompt.trim().split(/\s+/).length < 2) return false;
  const lower = prompt.toLowerCase();
  if (/\b(write|add|create|implement|fix|update|change|modify|refactor)\b.{0,80}\b(test|tests|specs?|unit test|integration test|e2e)\b/.test(lower)) {
    return false;
  }
  if (/\b(implement|fix|debug|refactor|patch|wire)\b.{0,80}\b(code|function|component|endpoint|route|api|schema|migration|bug|feature)\b/.test(lower)) {
    return false;
  }
  if (/\b(agentboard|workspace card|board card|artifact|memory file|memory files|observation log|skill-observations|handoff|session summary|core ingest)\b/.test(lower)) {
    return true;
  }
  if (/\b(write|create|draft|append|record|log|make|update)\b.{0,100}\b(doc|document|documentation|markdown|readme|changelog|roadmap|plan|note|notes|report|write[- ]?up|brief|proposal)\b/.test(lower)) {
    return true;
  }
  const c = classifyTask(prompt);
  const nonDocTypes = c.task.task_types.filter((t) => t !== 'documentation_only_change' && t !== 'general_change');
  return c.task.intent === 'documentation_update' && nonDocTypes.length === 0;
}

function isNonCodeArtifactPath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  const name = normalized.split('/').pop() ?? normalized;
  if (/^(readme|changelog|handoff|roadmap|todo|agents|claude|gemini|memory|notes?)\.(md|mdx|txt|rst|adoc)$/i.test(name)) return true;
  if (/\.(md|mdx|txt|rst|adoc|docx)$/i.test(normalized)) return true;
  if (/(^|\/)(docs?|documentation|plans?|notes?|reports?|handoffs?|artifacts?|memory|memories|skill-observations|agentboard)\//.test(normalized)) return true;
  if (/(^|\/)\.(claude|codex)\//.test(normalized)) return true;
  return false;
}

function relForRoot(root: string, abs: string): string {
  const normalizedAbs = abs.replace(/\\/g, '/');
  const normalizedRoot = root.replace(/\\/g, '/').replace(/\/$/, '');
  return normalizedAbs.startsWith(normalizedRoot + '/') ? normalizedAbs.slice(normalizedRoot.length + 1) : normalizedAbs;
}

function seenPath(contextDir: string, session: string): string {
  return join(contextDir, `.seen-${session.replace(/[^\w.-]/g, '_')}`);
}

function alreadySeen(file: string, key: string): boolean {
  try { return existsSync(file) && readFileSync(file, 'utf8').split('\n').includes(key); } catch { return false; }
}

function markSeen(file: string, key: string): void {
  try { appendFileSync(file, key + '\n'); } catch { /* best effort */ }
}

type SessionMode = 'ctxpack_active' | 'non_code_workflow';

function sessionModePath(contextDir: string, session: string): string {
  return join(contextDir, `.mode-${session.replace(/[^\w.-]/g, '_')}.json`);
}

function writeSessionMode(contextDir: string, session: string, mode: SessionMode, reason: string): void {
  try {
    writeFileSync(sessionModePath(contextDir, session), JSON.stringify({
      mode,
      reason,
      updated_at: new Date().toISOString(),
    }, null, 2));
  } catch { /* optional session state */ }
}

function isNonCodeWorkflowSession(contextDir: string, session: string): boolean {
  try {
    const parsed = JSON.parse(readFileSync(sessionModePath(contextDir, session), 'utf8')) as { mode?: string };
    return parsed.mode === 'non_code_workflow';
  } catch {
    return false;
  }
}

export async function runHook(event: string): Promise<number> {
  process.stdout.write(JSON.stringify(await handleHook(event, readStdin())));
  return 0;
}

export async function handleHook(event: string, input: any): Promise<Record<string, unknown>> {
  try {
    if (event === 'session-start') {
      return {
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: STANDING_RULES,
        },
      };
    }

    if (event === 'user-prompt') {
      const prompt: string = input.prompt ?? input.user_prompt ?? '';
      const root: string = input.cwd ?? process.cwd();
      const sessionId: string = input.session_id ?? 'nosession';
      if (looksLikeNonCodeWorkflowPrompt(prompt)) {
        const contextDir = join(root, '.context');
        try {
          mkdirSync(contextDir, { recursive: true });
          writeSessionMode(contextDir, sessionId, 'non_code_workflow', 'document/memory/admin workflow');
        } catch { /* optional session state */ }
        return {};
      }
      if (!looksLikeCodingTask(prompt)) return {};

      const ctx = openContext(root);
      try {
        writeSessionMode(ctx.contextDir, sessionId, 'ctxpack_active', 'codebase task');
        writeChangeBaseline(ctx.contextDir, sessionId, changedFiles(root) ?? []);
        const idx = await ctx.indexer.index(ctx.root, ctx.repoName, {
          excludes: ctx.config.excludes,
          maxBytes: ctx.config.maxBytes,
          staticAnalysis: ctx.config.staticAnalysis,
        });
        const snapshot = ctx.storage.getSnapshot(idx.snapshotId)!;
        const pkg = buildPackage(ctx.storage, snapshot, prompt, { injectionScanner: ctx.injectionScanner });
        const validation = ctx.validator.validatePackage(pkg);
        if (!validation.valid) {
          return { decision: 'block', reason: `ctxpack generated an invalid Context Package: ${validation.errors.join('; ')}` };
        }
        ctx.storage.savePackage(pkg);
        writeFileSync(join(ctx.contextDir, PKG_JSON), JSON.stringify(pkg, null, 2));
        writeFileSync(join(ctx.contextDir, PKG_MD), renderPackageMarkdown(pkg));
        new AuditLog(ctx.storage, 'hook:user-prompt').record('package', `id=${pkg.package_id} task="${prompt.slice(0, 80)}"`);
        return contextFor('UserPromptSubmit', buildInjectionBlock(pkg), {
          systemMessage: `ctxpack injected Context Package ${pkg.package_id} with ${pkg.relevant_files.length} relevant file(s).`,
        });
      } finally {
        ctx.storage.close();
      }
    }

    if (event === 'pre-tool') {
      const tool: string = input.tool_name ?? '';
      const isRead = READ_TOOLS.has(tool);
      const isEdit = EDIT_TOOLS.has(tool);
      const isSubagent = SUBAGENT_TOOLS.has(tool);
      const isSearch = SEARCH_TOOLS.has(tool);
      if (!isRead && !isEdit && !isSubagent && !isSearch) return {};

      const root: string = input.cwd ?? process.cwd();
      const toolInput = input.tool_input ?? {};
      const sessionId: string = input.session_id ?? 'nosession';
      const contextDir = join(root, '.context');
      if (isSearch) {
        if (isNonCodeWorkflowSession(contextDir, sessionId)) return {};
        const gate = validateQuestionSearchGate(root, sessionId);
        if (gate.decision === 'deny') return denyEdit(gate.message);
        return {};
      }

      if (isSubagent) {
        if (isNonCodeWorkflowSession(contextDir, sessionId)) {
          return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } };
        }
        const ctx = openContext(root);
        try {
          const pkgPath = join(ctx.contextDir, PKG_JSON);
          if (existsSync(pkgPath)) {
            const pkg = loadPackageFile(pkgPath);
            if (pkg.task.task_types.includes('codebase_question')) {
              const agent = toolInput.subagent_type ?? toolInput.agent_type ?? tool;
              return denyEdit(`ctxpack: this is an investigation/explanation request. Do not delegate the core codebase investigation to ${agent}; inspect the source directly so the details stay in this conversation.`);
            }
          }
          return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } };
        } finally {
          ctx.storage.close();
        }
      }

      const rawPath: string = toolInput.file_path ?? toolInput.path ?? toolInput.notebook_path ?? '';
      if (!rawPath) return {};
      const path = relForRoot(root, rawPath);

      if (isEdit) {
        const boundary = forbiddenBoundary(path);
        if (boundary) return denyEdit(`ctxpack: ${path} ${boundary}; it should not be hand-edited.`);
        if (isNonCodeArtifactPath(path)) {
          return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } };
        }
        if (isNonCodeWorkflowSession(contextDir, sessionId)) {
          return denyEdit(`ctxpack: current prompt is a document/memory/admin workflow, so code edit ${path} is blocked. Submit a code task first if this edit is intentional.`);
        }
      }

      const ctx = openContext(root);
      try {
        if (isEdit) {
          const gate = await validateEditGate(ctx, input.session_id ?? 'nosession', input.transcript_path);
          if (gate.decision === 'deny') return denyEdit(gate.message);
        }

        const snapshot = ctx.storage.getLatestSnapshot(ctx.root);
        if (!snapshot) return isEdit ? { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } } : {};

        const seen = seenPath(ctx.contextDir, input.session_id ?? 'nosession');
        const key = `${isEdit ? 'edit' : 'read'}:${path}`;
        if (alreadySeen(seen, key)) {
          return isEdit ? { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } } : {};
        }

        const card = isEdit
          ? await buildEditCard(ctx.storage, snapshot.snapshot_id, new TreeSitterParserAdapter(), path, toolInput.content ?? toolInput.new_string ?? '')
          : buildReadCard(ctx.storage, snapshot.snapshot_id, path);
        if (!card) return isEdit ? { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } } : {};

        markSeen(seen, key);
        if (isEdit) {
          return {
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'allow',
              additionalContext: card,
            },
          };
        }
        return contextFor('PreToolUse', card);
      } finally {
        ctx.storage.close();
      }
    }

    if (event === 'stop') {
      const root: string = input.cwd ?? process.cwd();
      const contextDir = join(root, '.context');
      const sessionId: string = input.session_id ?? 'nosession';
      const baseline = readChangeBaseline(contextDir, sessionId);
      const changed = changedFiles(root, baseline);
      if (!changed || changed.length === 0) return {};

      const forbidden = changed.filter((p) => forbiddenBoundary(p) && existsSync(join(root, p)));
      if (forbidden.length && input.stop_hook_active !== true) {
        return {
          decision: 'block',
          reason: `ctxpack: you modified files that should not be hand-edited: ${forbidden.join(', ')}. Revert these or regenerate them through their source, then finish.`,
        };
      }
      if (isNonCodeWorkflowSession(contextDir, sessionId)) return {};

      const ctx = openContext(root);
      try {
        const snapshot = ctx.storage.getLatestSnapshot(ctx.root);
        const lines: string[] = [`ctxpack wrap-up: changed ${changed.length} file(s): ${changed.slice(0, 10).join(', ')}.`];
        const tests = new Set<string>();
        if (snapshot) {
          for (const p of changed) {
            const deps = ctx.storage.incomingEdges(snapshot.snapshot_id, p, ['imports']).map((e) => e.from_path);
            for (const d of deps) if (ctx.storage.getFile(snapshot.snapshot_id, d)?.boundary === 'test') tests.add(d);
            const codeDeps = [...new Set(deps.filter((d) => ctx.storage.getFile(snapshot.snapshot_id, d)?.boundary !== 'test'))];
            if (codeDeps.length) lines.push(`${p} is used by ${codeDeps.length} file(s): ${codeDeps.slice(0, 6).join(', ')}. Verify they still work.`);
          }
        }
        const pkgJson = snapshot ? ctx.storage.getFileContent(snapshot.snapshot_id, 'package.json') : null;
        const commands: string[] = [];
        if (pkgJson) {
          try {
            const scripts = JSON.parse(pkgJson).scripts ?? {};
            if (scripts.test) commands.push('npm test');
            if (scripts.build) commands.push('npm run build');
          } catch { /* ignore invalid package.json */ }
        }
        if (tests.size) lines.push(`Tests covering your changes: ${[...tests].join(', ')}.`);
        if (commands.length) lines.push(`Run before finishing: ${commands.join(', ')}.`);
        return lines.length > 1 ? { systemMessage: lines.join('\n') } : {};
      } finally {
        ctx.storage.close();
      }
    }

    return {};
  } catch (e) {
    return { systemMessage: `ctxpack hook failed closed for safety: ${(e as Error).message}` };
  }
}

function contextFor(
  hookEventName: string,
  additionalContext: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...extra,
    hookSpecificOutput: {
      hookEventName,
      additionalContext,
    },
    suppressOutput: true,
  };
}

function validateQuestionSearchGate(root: string, sessionId: string): GateResult {
  const contextDir = join(root, '.context');
  const packagePath = join(contextDir, PKG_JSON);
  if (!existsSync(packagePath)) return { decision: 'allow' };

  const pkg = loadPackageFile(packagePath);
  if (!pkg.task.task_types.includes('codebase_question')) return { decision: 'allow' };

  const leads = primaryQuestionLeads(pkg);
  if (leads.length === 0) return { decision: 'allow' };

  const required = Math.min(2, leads.length);
  const seen = readSeenKeys(seenPath(contextDir, sessionId));
  const readLeads = leads.filter((path) => seen.has(`read:${path}`));
  if (readLeads.length >= required) return { decision: 'allow' };

  const unread = leads.filter((path) => !readLeads.includes(path)).slice(0, required - readLeads.length);
  return {
    decision: 'deny',
    message: `ctxpack: this explanation package already identified source leads. Read ${required} initial lead file(s) before broad search; next: ${unread.join(', ')}.`,
  };
}

function primaryQuestionLeads(pkg: ReturnType<typeof loadPackageFile>): string[] {
  const out: string[] = [];
  for (const f of pkg.relevant_files) {
    if (f.role === 'test' || f.role === 'doc') continue;
    const name = f.path.split('/').pop() ?? f.path;
    if (/^Lazy[A-Z]/.test(name)) continue;
    if (!out.includes(f.path)) out.push(f.path);
    if (out.length >= 4) break;
  }
  return out;
}

function readSeenKeys(file: string): Set<string> {
  try {
    return new Set(readFileSync(file, 'utf8').split('\n').filter(Boolean));
  } catch {
    return new Set<string>();
  }
}

type GateResult = { decision: 'allow' } | { decision: 'deny'; message: string };

async function validateEditGate(ctx: ReturnType<typeof openContext>, sessionId: string, transcriptPath?: string): Promise<GateResult> {
  const { root, repoName, contextDir } = ctx;
  const packagePath = join(contextDir, PKG_JSON);
  if (!existsSync(packagePath)) {
    return { decision: 'deny', message: 'ctxpack: no task Context Package exists. Submit a coding task first so ctxpack can generate and inject one.' };
  }

  let pkg = loadPackageFile(packagePath);
  const stale = checkStaleness(root, repoName, pkg);
  if (stale.stale) {
    const refreshed = await refreshStalePackage(ctx, pkg, stale.currentSnapshotId);
    if (refreshed.decision === 'deny') return refreshed;
    pkg = refreshed.pkg;
  }

  const cached = readPlanCache(contextDir, sessionId);
  if (cached?.package_id === pkg.package_id && cached.passed) return { decision: 'allow' };

  if (!transcriptPath || !existsSync(transcriptPath)) {
    return { decision: 'deny', message: `ctxpack: edit blocked until Claude Code outputs a plan wrapped in ${CTXPACK_PLAN_OPEN} and ${CTXPACK_PLAN_CLOSE}.` };
  }

  const raw = readFileSync(transcriptPath, 'utf8');
  const plan = extractLatestCtxpackPlan(transcriptText(raw)) ?? extractLatestCtxpackPlan(raw);
  if (!plan) {
    return { decision: 'deny', message: `ctxpack: edit blocked. Output a repository-grounded implementation plan wrapped in ${CTXPACK_PLAN_OPEN} and ${CTXPACK_PLAN_CLOSE}, then retry the edit.` };
  }

  const firewall = new AssumptionFirewall().check(pkg, plan);
  writePlanCache(contextDir, sessionId, pkg.package_id, plan, firewall);
  if (!firewall.passed) {
    return { decision: 'deny', message: `ctxpack: plan failed the assumption firewall.\n${formatFirewallFailures(firewall)}` };
  }
  return { decision: 'allow' };
}

type RefreshResult = { decision: 'allow'; pkg: ReturnType<typeof loadPackageFile> } | { decision: 'deny'; message: string };

async function refreshStalePackage(
  ctx: ReturnType<typeof openContext>,
  stalePkg: ReturnType<typeof loadPackageFile>,
  currentSnapshotId: string,
): Promise<RefreshResult> {
  try {
    const idx = await ctx.indexer.index(ctx.root, ctx.repoName, {
      excludes: ctx.config.excludes,
      maxBytes: ctx.config.maxBytes,
      staticAnalysis: ctx.config.staticAnalysis,
    });
    const snapshot = ctx.storage.getSnapshot(idx.snapshotId);
    if (!snapshot) {
      return { decision: 'deny', message: `ctxpack: package is stale (${stalePkg.repository.snapshot_id} != ${currentSnapshotId}) and automatic refresh failed because the new snapshot was not stored.` };
    }
    const refreshed = buildPackage(ctx.storage, snapshot, stalePkg.task.original_request || stalePkg.task.normalized_task, {
      injectionScanner: ctx.injectionScanner,
    });
    const validation = ctx.validator.validatePackage(refreshed);
    if (!validation.valid) {
      return { decision: 'deny', message: `ctxpack: package is stale and automatic refresh generated an invalid Context Package: ${validation.errors.join('; ')}` };
    }
    ctx.storage.savePackage(refreshed);
    writeFileSync(join(ctx.contextDir, PKG_JSON), JSON.stringify(refreshed, null, 2));
    writeFileSync(join(ctx.contextDir, PKG_MD), renderPackageMarkdown(refreshed));
    new AuditLog(ctx.storage, 'hook:stale-refresh').record('package-refresh', `from=${stalePkg.package_id} to=${refreshed.package_id} snapshot=${refreshed.repository.snapshot_id}`);
    return { decision: 'allow', pkg: refreshed };
  } catch (e) {
    return { decision: 'deny', message: `ctxpack: package is stale (${stalePkg.repository.snapshot_id} != ${currentSnapshotId}) and automatic refresh failed: ${(e as Error).message}` };
  }
}

function denyEdit(message: string): Record<string, unknown> {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: message,
    },
    systemMessage: message,
  };
}

interface PlanCache {
  package_id: string;
  passed: boolean;
  plan_length: number;
}

function planCachePath(contextDir: string, sessionId: string): string {
  return join(contextDir, `.plan-${sessionId.replace(/[^\w.-]/g, '_')}.json`);
}

function readPlanCache(contextDir: string, sessionId: string): PlanCache | null {
  try { return JSON.parse(readFileSync(planCachePath(contextDir, sessionId), 'utf8')) as PlanCache; } catch { return null; }
}

function writePlanCache(contextDir: string, sessionId: string, packageId: string, plan: string, firewall: FirewallResult): void {
  try {
    writeFileSync(planCachePath(contextDir, sessionId), JSON.stringify({
      package_id: packageId,
      passed: firewall.passed,
      plan_length: plan.length,
    }, null, 2));
  } catch {
    // Cache is optional; transcript validation can run again on the next edit.
  }
}

function formatFirewallFailures(firewall: FirewallResult): string {
  const failures = firewall.checks
    .filter((c) => c.verdict !== 'supported' && c.verdict !== 'allowed_creation')
    .slice(0, 6);
  if (failures.length === 0) return 'No supported plan claims were found.';
  return failures
    .map((c) => `L${c.claim.line}: ${c.verdict}${c.offending_reference ? ` ${c.offending_reference}` : ''} - ${c.reason}`)
    .join('\n');
}

function changedFiles(root: string, baseline: string[] = []): string[] | null {
  try {
    const out = execSync('git status --porcelain', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    const baselineSet = new Set(baseline);
    return out.split('\n').map((l) => l.trim()).filter(Boolean)
      .map((l) => l.replace(/^[A-Z?! ]{1,2}\s+/, '').replace(/^.*->\s*/, '').trim())
      .filter((p) => !p.startsWith('.context/') && !p.startsWith('.ctxpack.db') && p !== '.context')
      .filter((p) => !baselineSet.has(p));
  } catch {
    return null;
  }
}

function changeBaselinePath(contextDir: string, sessionId: string): string {
  return join(contextDir, `.changes-${sessionId.replace(/[^\w.-]/g, '_')}.json`);
}

function writeChangeBaseline(contextDir: string, sessionId: string, files: string[]): void {
  try { writeFileSync(changeBaselinePath(contextDir, sessionId), JSON.stringify(files)); } catch { /* optional */ }
}

function readChangeBaseline(contextDir: string, sessionId: string): string[] {
  try {
    const parsed = JSON.parse(readFileSync(changeBaselinePath(contextDir, sessionId), 'utf8'));
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
