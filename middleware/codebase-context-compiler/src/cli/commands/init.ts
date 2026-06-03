/**
 * `ctxpack init [root]` - wire ctxpack into regular Claude Code.
 *
 * Writes/merges `<root>/.claude/settings.json` with native hooks:
 *   - SessionStart     -> standing rules
 *   - UserPromptSubmit -> compile and inject the task Context Package
 *   - PreToolUse       -> deny edit tools until a ctxpack plan passes
 *   - Stop             -> impact and verification wrap-up
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

interface HookCmd { type: 'command'; command: string }
interface HookEntry { matcher: string; hooks: HookCmd[] }

export async function runInit(rootArg?: string): Promise<number> {
  const root = resolve(rootArg ?? process.cwd());
  const claudeDir = join(root, '.claude');
  const settingsPath = join(claudeDir, 'settings.json');
  mkdirSync(claudeDir, { recursive: true });

  const node = process.execPath;
  const cli = process.argv[1] ?? 'ctxpack';
  const cmd = (event: string) => `"${node}" "${cli}" hook ${event}`;

  const settings: any = existsSync(settingsPath)
    ? safeParse(readFileSync(settingsPath, 'utf8'))
    : {};
  settings.hooks ??= {};

  addHook(settings.hooks, 'SessionStart', '*', cmd('session-start'));
  addHook(settings.hooks, 'UserPromptSubmit', '*', cmd('user-prompt'));
  addHook(settings.hooks, 'PreToolUse', '*', cmd('pre-tool'));
  addHook(settings.hooks, 'Stop', '*', cmd('stop'));

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  console.log(`Installed ctxpack hooks into ${settingsPath}`);
  console.log('Regular Claude Code is now guarded by ctxpack:');
  console.log('  - coding prompts generate and inject an evidence-backed Context Package;');
  console.log('  - Claude Code must emit a <CTXPACK_PLAN>...</CTXPACK_PLAN> block before edit tools run;');
  console.log('  - PreToolUse denies unsupported plans, stale packages, generated/vendor/build edits, and explanation-task delegation;');
  console.log('  - read/edit hooks can add orientation cards, and Stop reports impact + verification for files changed after the prompt started.');
  console.log('(Restart the Claude Code session to load the hooks.)');
  return 0;
}

function addHook(hooks: Record<string, HookEntry[]>, event: string, matcher: string, command: string): void {
  hooks[event] ??= [];
  const hookName = command.split('hook ')[1] ?? '';
  hooks[event] = hooks[event]
    .map((entry) => ({ ...entry, hooks: (entry.hooks ?? []).filter((h) => !isCtxpackHook(h.command, hookName)) }))
    .filter((entry) => entry.hooks.length > 0);
  hooks[event].push({ matcher, hooks: [{ type: 'command', command }] });
}

function isCtxpackHook(command: string | undefined, hookName: string): boolean {
  if (!command) return false;
  return command.includes(`hook ${hookName}`) && /ctxpack|codebase-context-compiler/i.test(command);
}

function safeParse(s: string): any {
  try { return JSON.parse(s); } catch { return {}; }
}
