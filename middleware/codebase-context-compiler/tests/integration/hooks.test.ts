import { describe, it, expect, afterEach } from 'vitest';
import { handleHook } from '../../src/cli/commands/hook.js';
import { runInit } from '../../src/cli/commands/init.js';
import { FIXTURE } from '../helpers.js';
import { SqliteStorage } from '../../src/adapters/storage/sqlite-storage.js';
import { Indexer } from '../../src/core/services/indexer.js';
import { TreeSitterParserAdapter } from '../../src/adapters/tree-sitter/index.js';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const tmps: string[] = [];

afterEach(() => {
  for (const t of tmps) rmSync(t, { recursive: true, force: true });
  tmps.length = 0;
});

function repo(git = false): string {
  const d = mkdtempSync(join(tmpdir(), 'ctxpack-hook-'));
  cpSync(FIXTURE, d, { recursive: true });
  tmps.push(d);
  if (git) execSync('git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm init', { cwd: d });
  return d;
}

async function indexed(root: string) {
  const s = new SqliteStorage(join(root, '.ctxpack.db'));
  await new Indexer(s, [new TreeSitterParserAdapter()]).index(root, 'sample-app');
  s.close();
}

async function packaged(root: string) {
  const out: any = await handleHook('user-prompt', { user_prompt: 'add a dark mode toggle to the SettingsPage', cwd: root });
  expect(injectedContext(out)).toContain('CTXPACK MANDATORY CONTEXT');
}

function injectedContext(out: any): string {
  return out.hookSpecificOutput?.additionalContext ?? '';
}

function transcript(root: string, body: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'ctxpack-transcript-'));
  tmps.push(dir);
  const path = join(dir, 'transcript.jsonl');
  writeFileSync(path, JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: body }] } }) + '\n');
  return path;
}

describe('native Claude Code hooks', () => {
  it('init de-duplicates old ctxpack hooks and installs a broad PreToolUse matcher', async () => {
    const root = repo();
    mkdirSync(join(root, '.claude'), { recursive: true });
    const oldCommand = '"node" "C:\\Users\\maxco\\AppData\\Roaming\\npm\\node_modules\\codebase-context-compiler\\dist\\cli\\main.js" hook pre-tool';
    writeFileSync(join(root, '.claude/settings.json'), JSON.stringify({
      hooks: {
        PreToolUse: [
          { matcher: 'Read|Edit', hooks: [{ type: 'command', command: oldCommand }] },
          { matcher: 'Read|Edit', hooks: [{ type: 'command', command: oldCommand }] },
          { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo keep-me' }] },
        ],
      },
    }, null, 2));

    await runInit(root);
    const settings = JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8'));
    const pre = settings.hooks.PreToolUse;
    const ctxpack = pre.filter((entry: any) => entry.hooks.some((h: any) => /hook pre-tool/.test(h.command)));

    expect(ctxpack).toHaveLength(1);
    expect(ctxpack[0].matcher).toBe('*');
    expect(pre.some((entry: any) => entry.hooks.some((h: any) => h.command === 'echo keep-me'))).toBe(true);
  });

  it('SessionStart injects standing rules for regular Claude Code', async () => {
    expect((await handleHook('session-start', {}) as any).hookSpecificOutput.additionalContext).toContain('ctxpack is active');
  });

  it('UserPromptSubmit injects the task package as additionalContext', async () => {
    const out: any = await handleHook('user-prompt', { user_prompt: 'add a dark mode toggle to the SettingsPage', cwd: repo() });
    expect(out.hookSpecificOutput.hookEventName).toBe('UserPromptSubmit');
    expect(injectedContext(out)).toContain('CTXPACK MANDATORY CONTEXT');
    expect(injectedContext(out)).toContain('<CTXPACK_PLAN>');
    expect(injectedContext(out).length).toBeLessThan(10000);
    expect(out.systemMessage).toContain('ctxpack injected Context Package');
  }, 15000);

  it('UserPromptSubmit treats explanation prompts as investigation context, not edit targets', async () => {
    const out: any = await handleHook('user-prompt', {
      user_prompt: 'How does getPreference work and what data can it use?',
      cwd: repo(),
    });
    expect(injectedContext(out)).toContain('Task types: codebase_question');
    expect(injectedContext(out)).toContain('Relevant files to inspect');
    expect(injectedContext(out)).not.toContain('Required files (in scope)');
    expect(injectedContext(out)).not.toContain('Allowed to create');
  });

  it('UserPromptSubmit keeps meta test prompts as codebase questions', async () => {
    const out: any = await handleHook('user-prompt', {
      user_prompt: "okay then jsut test this. Ill ask a question about the codebase and you see if ctxpack gave you any help. you dont have to answer the question, its just for the test - what telemetry data can be seen in the detail cards of the plants in my collection?",
      cwd: repo(),
    });
    expect(injectedContext(out)).toContain('Task types: codebase_question');
    expect(injectedContext(out)).not.toMatch(/Task types: .*test_creation/);
    expect(injectedContext(out)).toContain('Relevant files to inspect');
    expect(injectedContext(out).length).toBeLessThan(10000);
  });

  it('UserPromptSubmit also fires for symbol-heavy prompts without obvious task keywords', async () => {
    const out: any = await handleHook('user-prompt', { user_prompt: 'look at getPreference and make behavior sane', cwd: repo() });
    expect(injectedContext(out)).toContain('CTXPACK MANDATORY CONTEXT');
    expect(injectedContext(out)).toContain('getPreference');
  });

  it('UserPromptSubmit suppresses packages for non-code document and memory workflows', async () => {
    const root = repo();
    const out: any = await handleHook('user-prompt', {
      user_prompt: 'write a handoff document and append the memory file notes for this AgentBoard card',
      cwd: root,
      session_id: 'non-code-docs',
    });

    expect(out.hookSpecificOutput).toBeUndefined();
    expect(readFileSync(join(root, '.context/.mode-non-code-docs.json'), 'utf8')).toContain('non_code_workflow');
  });

  it('Non-code workflow mode allows document writes even when an older package exists', async () => {
    const root = repo();
    await handleHook('user-prompt', {
      user_prompt: 'How does getPreference work and what data can it use?',
      cwd: root,
      session_id: 'docs-after-code',
    });
    await handleHook('user-prompt', {
      user_prompt: 'write a handoff document and update memory notes for the AgentBoard task',
      cwd: root,
      session_id: 'docs-after-code',
    });

    const writeDoc: any = await handleHook('pre-tool', {
      tool_name: 'Write',
      cwd: root,
      session_id: 'docs-after-code',
      tool_input: { file_path: join(root, 'docs/HANDOFF.md'), content: 'handoff notes' },
    });
    expect(writeDoc.hookSpecificOutput.permissionDecision).toBe('allow');

    const subagent: any = await handleHook('pre-tool', {
      tool_name: 'Task',
      cwd: root,
      session_id: 'docs-after-code',
      tool_input: { description: 'Write memory file' },
    });
    expect(subagent.hookSpecificOutput.permissionDecision).toBe('allow');

    const codeEdit: any = await handleHook('pre-tool', {
      tool_name: 'Write',
      cwd: root,
      session_id: 'docs-after-code',
      tool_input: { file_path: join(root, 'src/state/store.ts'), content: 'export const x = 1;' },
    });
    expect(codeEdit.hookSpecificOutput.permissionDecision).toBe('deny');
    expect(codeEdit.systemMessage).toContain('document/memory/admin workflow');
  });

  it('Read hooks provide orientation as additionalContext without changing permissions', async () => {
    const root = repo();
    await indexed(root);
    const out: any = await handleHook('pre-tool', {
      tool_name: 'Read',
      cwd: root,
      session_id: 's1',
      tool_input: { file_path: join(root, 'src/state/store.ts') },
    });
    expect(out.hookSpecificOutput.hookEventName).toBe('PreToolUse');
    expect(injectedContext(out)).toContain('orientation for src/state/store.ts');
    expect(injectedContext(out)).toContain('Used by');
    expect(out.hookSpecificOutput.permissionDecision).toBeUndefined();
  });

  it('PreToolUse blocks subagent delegation for codebase explanation prompts', async () => {
    const root = repo();
    await handleHook('user-prompt', {
      user_prompt: 'How does getPreference work and what data can it use?',
      cwd: root,
      session_id: 'question-subagent',
    });

    const out: any = await handleHook('pre-tool', {
      tool_name: 'Task',
      cwd: root,
      session_id: 'question-subagent',
      tool_input: { description: 'Find getPreference details' },
    });
    expect(out.hookSpecificOutput.permissionDecision).toBe('deny');
    expect(out.systemMessage).toContain('Do not delegate');
  });

  it('PreToolUse blocks Claude Code Agent tool Explore subagents for codebase explanation prompts', async () => {
    const root = repo();
    await handleHook('user-prompt', {
      user_prompt: 'How does getPreference work and what data can it use?',
      cwd: root,
      session_id: 'question-agent-explore',
    });

    const out: any = await handleHook('pre-tool', {
      tool_name: 'Agent',
      cwd: root,
      session_id: 'question-agent-explore',
      tool_input: { subagent_type: 'Explore', description: 'Find getPreference details' },
    });
    expect(out.hookSpecificOutput.permissionDecision).toBe('deny');
    expect(out.systemMessage).toContain('Explore');
    expect(out.systemMessage).toContain('inspect the source directly');
  });

  it('PreToolUse blocks broad search for explanation prompts until initial leads are read', async () => {
    const root = repo();
    await handleHook('user-prompt', {
      user_prompt: 'How does getPreference work and what data can it use?',
      cwd: root,
      session_id: 'question-search',
    });

    const blocked: any = await handleHook('pre-tool', {
      tool_name: 'Grep',
      cwd: root,
      session_id: 'question-search',
      tool_input: { pattern: 'getPreference' },
    });
    expect(blocked.hookSpecificOutput.permissionDecision).toBe('deny');
    expect(blocked.systemMessage).toContain('Read 2 initial lead file');

    await handleHook('pre-tool', {
      tool_name: 'Read',
      cwd: root,
      session_id: 'question-search',
      tool_input: { file_path: join(root, 'src/state/store.ts') },
    });
    const stillBlocked: any = await handleHook('pre-tool', {
      tool_name: 'Glob',
      cwd: root,
      session_id: 'question-search',
      tool_input: { pattern: '**/*store*' },
    });
    expect(stillBlocked.hookSpecificOutput.permissionDecision).toBe('deny');

    await handleHook('pre-tool', {
      tool_name: 'Read',
      cwd: root,
      session_id: 'question-search',
      tool_input: { file_path: join(root, 'src/components/ThemeToggle.tsx') },
    });
    const allowed: any = await handleHook('pre-tool', {
      tool_name: 'Search',
      cwd: root,
      session_id: 'question-search',
      tool_input: { pattern: 'getPreference' },
    });
    expect(allowed.hookSpecificOutput).toBeUndefined();
  });

  it('PreToolUse allows subagents for non-question packages', async () => {
    const root = repo();
    await packaged(root);
    const out: any = await handleHook('pre-tool', {
      tool_name: 'Task',
      cwd: root,
      session_id: 'edit-subagent',
      tool_input: { description: 'Find dark mode files' },
    });
    expect(out.hookSpecificOutput.permissionDecision).toBe('allow');
  });

  it('Edit hooks deny regular Claude Code edits until a ctxpack plan appears in the transcript', async () => {
    const root = repo();
    await packaged(root);
    const out: any = await handleHook('pre-tool', {
      tool_name: 'Edit',
      cwd: root,
      session_id: 's2',
      transcript_path: transcript(root, 'I will edit now without the required wrapper.'),
      tool_input: { file_path: join(root, 'src/state/store.ts'), new_string: 'export function getPreference(k){return k}' },
    });
    expect(out.hookSpecificOutput.permissionDecision).toBe('deny');
    expect(out.systemMessage).toContain('edit blocked');
  });

  it('Edit hooks deny unsupported plans and allow a supported plan', async () => {
    const root = repo();
    await packaged(root);

    const bad: any = await handleHook('pre-tool', {
      tool_name: 'Edit',
      cwd: root,
      session_id: 's3',
      transcript_path: transcript(root, '<CTXPACK_PLAN>Import ThemeProvider from src/theme/ThemeProvider.tsx.</CTXPACK_PLAN>'),
      tool_input: { file_path: join(root, 'src/state/store.ts'), new_string: 'export function getPreference(k){return k}' },
    });
    expect(bad.hookSpecificOutput.permissionDecision).toBe('deny');
    expect(bad.systemMessage).toContain('assumption firewall');

    const good: any = await handleHook('pre-tool', {
      tool_name: 'Edit',
      cwd: root,
      session_id: 's4',
      transcript_path: transcript(root, '<CTXPACK_PLAN>Modify src/state/store.ts and src/routes/SettingsPage.tsx.</CTXPACK_PLAN>'),
      tool_input: { file_path: join(root, 'src/state/store.ts'), new_string: 'export function getPreference(k){return k}' },
    });
    expect(good.hookSpecificOutput.permissionDecision).toBe('allow');
    expect(injectedContext(good)).toMatch(/Dependents to account for|before changing/);
  });

  it('protects generated/build files from hand edits before plan validation', async () => {
    const out: any = await handleHook('pre-tool', {
      tool_name: 'Write',
      cwd: repo(),
      tool_input: { file_path: 'dist/app.js', content: 'x' },
    });
    expect(out.hookSpecificOutput.permissionDecision).toBe('deny');
  });

  it('Stop gives a non-blocking wrap-up of impact + what to run', async () => {
    const root = repo(true);
    await indexed(root);
    writeFileSync(join(root, 'src/state/store.ts'), 'export function getPreference(k){return k}\nexport interface Preferences { fontSize: number }');
    const out: any = await handleHook('stop', { cwd: root, stop_hook_active: false });
    expect(out.systemMessage).toContain('wrap-up');
    expect(out.systemMessage).toMatch(/used by|Run|Tests/);
    expect(out.decision).toBeUndefined();
  });

  it('Stop ignores files that were already dirty when the prompt started', async () => {
    const root = repo(true);
    writeFileSync(join(root, 'package.json'), '{ "name": "sample-app", "scripts": { "test": "vitest run", "build": "tsc" }, "dirty": true }');
    await handleHook('user-prompt', {
      user_prompt: 'How does getPreference work?',
      cwd: root,
      session_id: 'dirty-baseline',
    });

    const out: any = await handleHook('stop', { cwd: root, session_id: 'dirty-baseline', stop_hook_active: false });
    expect(out.systemMessage).toBeUndefined();
    expect(out.decision).toBeUndefined();
  });

  it('Stop blocks only when a protected file was modified', async () => {
    const root = repo(true);
    mkdirSync(join(root, 'dist'), { recursive: true });
    writeFileSync(join(root, 'dist/app.js'), 'x');
    const out: any = await handleHook('stop', { cwd: root, stop_hook_active: false });
    expect(out.decision).toBe('block');
  });
});
