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
import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { openContext, loadPackageFile, PKG_JSON, PKG_MD } from '../app-context.js';
import { buildPackage } from '../../core/services/package-builder.js';
import { buildInjectionBlock } from '../../core/services/agent-harness.js';
import { renderPackageMarkdown } from '../../adapters/markdown/package-markdown-writer.js';
import { classifyTask } from '../../core/services/task-classifier.js';
import { buildReadCard, buildEditCard } from '../../core/services/context-card.js';
import { forbiddenBoundary } from '../../core/services/live-grounding.js';
import { profileForTask } from '../../core/services/task-profiles.js';
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
  const lower = prompt.toLowerCase();
  const c = classifyTask(prompt);
  return c.task.task_types.some((t) => t !== 'general_change')
    || c.task.intent !== 'general_change'
    || c.mentionedPaths.length > 0
    || c.mentionedSymbols.length > 0
    || /\b(implement|fix|debug|refactor|patch|wire|build|add|change|update|modify)\b/.test(lower)
    || /\b(do|start|continue|resume|finish|complete|work\s+on|execute)\b.{0,80}\b(card|task|ticket|issue|plan|implementation|feature|bug)\b/.test(lower);
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
  if (/\b(memory file|memory files|observation log|skill-observations|handoff|session summary|core ingest)\b/.test(lower)) {
    return true;
  }
  if (/\b(add|write|record|put|append)\b.{0,80}\b(to|in|into)\b.{0,80}\b(file|doc|document|markdown|roadmap|todo|notes?|handoff)\b/.test(lower)
    && /\b(later|defer|deferred|parking|park|backlog|remember|record|note|work on it later)\b/.test(lower)) {
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

interface PendingAction {
  kind: 'code' | 'non_code' | 'unknown';
  task: string;
  source_excerpt: string;
  created_at: string;
}

interface SessionState {
  mode?: SessionMode;
  reason?: string;
  updated_at?: string;
  active_task?: string;
  active_package_id?: string;
  pending_action?: PendingAction;
}

type PromptResolution =
  | { kind: 'direct'; prompt: string }
  | { kind: 'continuation'; prompt: string }
  | { kind: 'defer'; reason: string }
  | { kind: 'reject' }
  | { kind: 'ignore' };

function sessionModePath(contextDir: string, session: string): string {
  return join(contextDir, `.mode-${session.replace(/[^\w.-]/g, '_')}.json`);
}

function writeSessionMode(contextDir: string, session: string, mode: SessionMode, reason: string): void {
  try {
    const state = readSessionState(contextDir, session) ?? {};
    delete state.pending_action;
    writeFileSync(sessionModePath(contextDir, session), JSON.stringify({
      ...state,
      mode,
      reason,
      updated_at: new Date().toISOString(),
    }, null, 2));
  } catch { /* optional session state */ }
}

function clearSessionMode(contextDir: string, session: string): void {
  try { unlinkSync(sessionModePath(contextDir, session)); } catch { /* optional session state */ }
}

function isNonCodeWorkflowSession(contextDir: string, session: string): boolean {
  try {
    const parsed = readSessionState(contextDir, session) ?? {};
    return parsed.mode === 'non_code_workflow';
  } catch {
    return false;
  }
}

function readSessionState(contextDir: string, session: string): SessionState | null {
  try { return JSON.parse(readFileSync(sessionModePath(contextDir, session), 'utf8')) as SessionState; } catch { return null; }
}

function writePendingAction(contextDir: string, session: string, pending: PendingAction): void {
  try {
    mkdirSync(contextDir, { recursive: true });
    const state = readSessionState(contextDir, session) ?? {};
    writeFileSync(sessionModePath(contextDir, session), JSON.stringify({
      ...state,
      pending_action: pending,
      updated_at: new Date().toISOString(),
    }, null, 2));
  } catch {
    // Optional continuation state; direct prompt classification still works.
  }
}

function clearPendingAction(contextDir: string, session: string): void {
  try {
    const state = readSessionState(contextDir, session);
    if (!state?.pending_action) return;
    delete state.pending_action;
    writeFileSync(sessionModePath(contextDir, session), JSON.stringify({
      ...state,
      updated_at: new Date().toISOString(),
    }, null, 2));
  } catch {
    // Optional continuation state.
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
      const contextDir = join(root, '.context');
      const resolution = resolvePrompt(prompt, input.transcript_path, contextDir, sessionId);

      if (resolution.kind === 'reject') {
        clearSessionMode(contextDir, sessionId);
        return {};
      }

      if (resolution.kind === 'defer') {
        try {
          mkdirSync(contextDir, { recursive: true });
          writeSessionMode(contextDir, sessionId, 'non_code_workflow', resolution.reason);
        } catch { /* optional session state */ }
        return {};
      }

      if (resolution.kind === 'ignore') return {};

      const taskPrompt = resolution.prompt;

      const ctx = openContext(root);
      try {
        writeSessionMode(ctx.contextDir, sessionId, 'ctxpack_active', resolution.kind === 'continuation' ? 'conversation continuation' : 'codebase task');
        writeChangeBaseline(ctx.contextDir, sessionId, changedFiles(root) ?? []);
        let snapshot = ctx.storage.getLatestSnapshot(ctx.root);
        if (!snapshot) {
          const idx = await ctx.indexer.index(ctx.root, ctx.repoName, {
            excludes: ctx.config.excludes,
            maxBytes: ctx.config.maxBytes,
            staticAnalysis: ctx.config.staticAnalysis,
          });
          snapshot = ctx.storage.getSnapshot(idx.snapshotId)!;
        }
        const pkg = buildPackage(ctx.storage, snapshot, taskPrompt, { injectionScanner: ctx.injectionScanner });
        const validation = ctx.validator.validatePackage(pkg);
        if (!validation.valid) {
          return { decision: 'block', reason: `ctxpack generated an invalid Context Package: ${validation.errors.join('; ')}` };
        }
        ctx.storage.savePackage(pkg);
        writeFileSync(join(ctx.contextDir, PKG_JSON), JSON.stringify(pkg, null, 2));
        writeFileSync(join(ctx.contextDir, PKG_MD), renderPackageMarkdown(pkg));
        writeActivePackage(ctx.contextDir, sessionId, taskPrompt, pkg.package_id);
        new AuditLog(ctx.storage, 'hook:user-prompt').record('package', `id=${pkg.package_id} task="${taskPrompt.slice(0, 80)}"`);
        return contextFor('UserPromptSubmit', buildInjectionBlock(pkg), {
          systemMessage: resolution.kind === 'continuation'
            ? `ctxpack resolved "${prompt.slice(0, 40)}" to previous assistant proposal and injected Context Package ${pkg.package_id} with ${pkg.relevant_files.length} relevant file(s).`
            : `ctxpack injected Context Package ${pkg.package_id} with ${pkg.relevant_files.length} relevant file(s).`,
        });
      } finally {
        ctx.storage.close();
      }
    }

    if (event === 'permission-request') {
      const tool: string = input.tool_name ?? '';
      if (!isSubagentTool(tool)) return {};

      const root: string = input.cwd ?? process.cwd();
      const sessionId: string = input.session_id ?? 'nosession';
      const contextDir = join(root, '.context');
      if (isNonCodeWorkflowSession(contextDir, sessionId)) return {};

      const gate = validateSubagentGate(root, input.tool_input ?? {}, tool);
      if (gate.decision === 'deny') return denyPermission(gate.message);
      return {};
    }

    if (event === 'subagent-start') {
      const root: string = input.cwd ?? process.cwd();
      const sessionId: string = input.session_id ?? 'nosession';
      const contextDir = join(root, '.context');
      if (isNonCodeWorkflowSession(contextDir, sessionId)) return {};

      const agent = input.agent_type ?? 'subagent';
      const gate = validateSubagentGate(root, { subagent_type: agent }, agent);
      if (gate.decision === 'deny') {
        return contextFor('SubagentStart', `${gate.message}\n\nThis subagent should not perform the investigation. Return immediately and tell the parent conversation to inspect the ctxpack initial leads directly.`);
      }
      return {};
    }

    if (event === 'pre-tool') {
      const tool: string = input.tool_name ?? '';
      const isRead = READ_TOOLS.has(tool);
      const isEdit = EDIT_TOOLS.has(tool);
      const isSubagent = isSubagentTool(tool);
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
        const gate = validateSubagentGate(root, toolInput, tool);
        if (gate.decision === 'deny') return denyEdit(gate.message);
        return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } };
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
          const gate = validateEditGate(ctx.root, ctx.repoName, ctx.contextDir, input.session_id ?? 'nosession', input.transcript_path);
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
      updatePendingActionFromAssistant(contextDir, sessionId, input.last_assistant_message, input.transcript_path);
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

function resolvePrompt(prompt: string, transcriptPath: string | undefined, contextDir: string, sessionId: string): PromptResolution {
  const trimmed = prompt.trim();
  if (!trimmed) return { kind: 'ignore' };

  if (isRejectingFollowUp(trimmed)) return { kind: 'reject' };

  const pendingAction = isAffirmingFollowUp(trimmed) ? readSessionState(contextDir, sessionId)?.pending_action ?? null : null;
  if (pendingAction) {
    if (pendingAction.kind === 'non_code' || looksLikeNonCodeWorkflowPrompt(pendingAction.task)) {
      return { kind: 'defer', reason: 'conversation follow-up requested document/memory/admin workflow' };
    }
    return {
      kind: 'continuation',
      prompt: pendingAction.task,
    };
  }

  const assistantAction = isAffirmingFollowUp(trimmed) ? previousAssistantAction(transcriptPath) : null;
  if (assistantAction) {
    if (assistantAction.kind === 'non_code' || looksLikeNonCodeWorkflowPrompt(assistantAction.task)) {
      return { kind: 'defer', reason: 'conversation follow-up requested document/memory/admin workflow' };
    }
    return {
      kind: 'continuation',
      prompt: assistantAction.task,
    };
  }

  if (looksLikeNonCodeWorkflowPrompt(trimmed)) return { kind: 'defer', reason: 'document/memory/admin workflow' };
  if (looksLikeCodingTask(trimmed)) return { kind: 'direct', prompt: trimmed };

  return { kind: 'ignore' };
}

function isSubagentTool(tool: string): boolean {
  if (SUBAGENT_TOOLS.has(tool)) return true;
  return /^mcp__.*subagent.*__(subagent_)?dispatch(_parallel)?$/i.test(tool);
}

function isAffirmingFollowUp(prompt: string): boolean {
  const lower = prompt.toLowerCase().replace(/[.!?,]+$/g, '').replace(/,/g, '').trim();
  return /^(yes|yeah|yep|yup|sure|ok|okay|go ahead|do it|do that|please do|proceed|sounds good|that one|continue|carry on)(\s+please)?$/.test(lower)
    || /^(yes|yeah|yep|yup|sure|ok|okay)\s+(do that|go ahead|proceed|please)$/.test(lower);
}

function isRejectingFollowUp(prompt: string): boolean {
  const lower = prompt.toLowerCase().replace(/[.!?]+$/g, '').trim();
  return /^(no|nope|nah|not now|leave it|skip it|cancel|stop|never mind|nevermind)$/.test(lower);
}

function previousAssistantAction(transcriptPath: string | undefined): PendingAction | null {
  if (!transcriptPath || !existsSync(transcriptPath)) return null;
  const assistantText = latestAssistantText(readFileSync(transcriptPath, 'utf8'));
  if (!assistantText) return null;
  return actionableProposalFromAssistant(assistantText);
}

function updatePendingActionFromAssistant(
  contextDir: string,
  sessionId: string,
  lastAssistantMessage?: string,
  transcriptPath?: string,
): void {
  const fromMessage = typeof lastAssistantMessage === 'string' ? actionableProposalFromAssistant(lastAssistantMessage) : null;
  const pending = fromMessage ?? previousAssistantAction(transcriptPath);
  if (pending) {
    writePendingAction(contextDir, sessionId, pending);
  } else {
    clearPendingAction(contextDir, sessionId);
  }
}

function latestAssistantText(rawTranscript: string): string | null {
  let latest: string | null = null;
  for (const line of rawTranscript.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>;
      const message = obj['message'] as Record<string, unknown> | undefined;
      const role = typeof message?.['role'] === 'string' ? message['role'] : obj['type'];
      if (role !== 'assistant') continue;
      const parts: string[] = [];
      collectTranscriptText(message ?? obj, parts);
      const text = parts.join('\n').trim();
      if (text) latest = text;
    } catch {
      // Ignore non-JSON transcript noise.
    }
  }
  return latest;
}

function collectTranscriptText(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    out.push(value);
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectTranscriptText(item, out);
    return;
  }

  const obj = value as Record<string, unknown>;
  if (typeof obj['text'] === 'string') out.push(obj['text']);
  collectTranscriptText(obj['content'], out);
}

function actionableProposalFromAssistant(text: string): PendingAction | null {
  const candidates = text
    .split(/\r?\n|(?<=[.!?])\s+/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);

  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const line = candidates[i];
    if (!line) continue;
    const context = previousContextSentence(candidates, i);
    const question = line.match(/\b(?:want me to|would you like me to|do you want me to|should I|shall I)\s+(.+?)(?:\?|$)/i)?.[1];
    if (question) return pendingAction(question, context, line);

    const offer = line.match(/\b(?:I can|I could)\s+(.+?)(?:[.?]|$)/i)?.[1];
    if (offer && /\b(investigate|look|dig|fix|implement|wire|add|update|change|confirm|trace|check|write|record|append)\b/i.test(offer)) {
      return pendingAction(offer, context, line);
    }
  }
  return null;
}

function pendingAction(action: string, context: string | null, source: string): PendingAction {
  const task = normalizeAssistantAction(action, context);
  return {
    kind: classifyPendingAction(task),
    task,
    source_excerpt: source.slice(0, 500),
    created_at: new Date().toISOString(),
  };
}

function previousContextSentence(sentences: string[], actionIndex: number): string | null {
  for (let i = actionIndex - 1; i >= Math.max(0, actionIndex - 5); i -= 1) {
    const candidate = sentences[i];
    if (!candidate) continue;
    if (/\b(issue|bug|gap|problem|caveat|finding|likely|probably|not|fails?|mismatch|blocked|breaking|doesn'?t|won'?t|never|error|cause)\b/i.test(candidate)) {
      return candidate;
    }
  }
  return actionIndex > 0 ? sentences[actionIndex - 1] ?? null : null;
}

function normalizeAssistantAction(action: string, context: string | null): string {
  const cleaned = action
    .replace(/\s+/g, ' ')
    .replace(/^either\s+/i, '')
    .replace(/^also\s+/i, '')
    .trim()
    .replace(/[.!?]+$/g, '');

  if (context && /\b(that|this|it|#\d+)\b/i.test(cleaned)) {
    return `Continue previous assistant proposal about: ${context}. Requested action: ${cleaned}`;
  }
  if (/^investigate\b/i.test(cleaned)) return cleaned;
  const investigative = cleaned.match(/^(dig into|look into|look at|confirm|check|trace)\s+(.+)/i)?.[2];
  if (investigative) return `Investigate ${investigative}`;
  if (/^(fix|implement|wire|add|update|change|modify|refactor|patch|debug)\b/i.test(cleaned)) return cleaned;
  if (/^(write|record|append|put)\b/i.test(cleaned)) return cleaned;
  return `Continue previous assistant proposal: ${cleaned}`;
}

function classifyPendingAction(task: string): PendingAction['kind'] {
  if (looksLikeNonCodeWorkflowPrompt(task)) return 'non_code';
  if (looksLikeCodingTask(task)) return 'code';
  if (/\b(investigate|look into|dig into|trace|check|confirm)\b/i.test(task)) return 'code';
  if (/\b(write|record|append|put)\b.{0,80}\b(roadmap|doc|document|note|handoff|file)\b/i.test(task)) return 'non_code';
  return 'unknown';
}

function writeActivePackage(contextDir: string, sessionId: string, task: string, packageId: string): void {
  try {
    const state = readSessionState(contextDir, sessionId) ?? {};
    delete state.pending_action;
    writeFileSync(sessionModePath(contextDir, sessionId), JSON.stringify({
      ...state,
      active_task: task,
      active_package_id: packageId,
      updated_at: new Date().toISOString(),
    }, null, 2));
  } catch {
    // Optional continuation state.
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

function validateSubagentGate(root: string, toolInput: Record<string, unknown>, fallbackAgent: string): GateResult {
  const packagePath = join(root, '.context', PKG_JSON);
  if (!existsSync(packagePath)) return { decision: 'allow' };

  const pkg = loadPackageFile(packagePath);
  if (!isDirectInvestigationPackage(pkg)) return { decision: 'allow' };

  const agent = String(toolInput.subagent_type ?? toolInput.agent_type ?? toolInput.agent ?? fallbackAgent);
  return {
    decision: 'deny',
    message: `ctxpack: this is an investigation/explanation request. Do not delegate the core codebase investigation to ${agent}; inspect the source directly so the details stay in this conversation.`,
  };
}

function isDirectInvestigationPackage(pkg: ReturnType<typeof loadPackageFile>): boolean {
  return profileForTask(pkg.task).enforcement.blockSubagents;
}

function validateQuestionSearchGate(root: string, sessionId: string): GateResult {
  const contextDir = join(root, '.context');
  const packagePath = join(contextDir, PKG_JSON);
  if (!existsSync(packagePath)) return { decision: 'allow' };

  const pkg = loadPackageFile(packagePath);
  if (!profileForTask(pkg.task).enforcement.requirePrimaryReadsBeforeSearch) return { decision: 'allow' };

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

function validateEditGate(root: string, repoName: string, contextDir: string, sessionId: string, transcriptPath?: string): GateResult {
  const packagePath = join(contextDir, PKG_JSON);
  if (!existsSync(packagePath)) {
    return { decision: 'deny', message: 'ctxpack: no task Context Package exists. Submit a coding task first so ctxpack can generate and inject one.' };
  }

  const pkg = loadPackageFile(packagePath);
  const stale = checkStaleness(root, repoName, pkg);
  if (stale.stale) {
    return { decision: 'deny', message: `ctxpack: task Context Package is stale (${pkg.repository.snapshot_id} != ${stale.currentSnapshotId}). Regenerate context before editing.` };
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

function denyPermission(message: string): Record<string, unknown> {
  return {
    hookSpecificOutput: {
      hookEventName: 'PermissionRequest',
      decision: {
        behavior: 'deny',
        message,
        interrupt: false,
      },
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
