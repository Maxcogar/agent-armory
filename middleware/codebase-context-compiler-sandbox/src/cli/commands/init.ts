/**
 * `ctxpack init [root]` - wire ctxpack into regular Claude Code.
 *
 * Writes/merges `<root>/.claude/settings.json` with native hooks:
 *   - SessionStart     -> standing rules
 *   - UserPromptSubmit -> compile and inject the task Context Package
 *   - PreToolUse       -> deny edit tools until a ctxpack plan passes
 *   - Stop             -> impact and verification wrap-up
 */
import { mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { resolve, relative, join, sep, isAbsolute } from 'node:path';

interface HookCmd { type: 'command'; command: string }
interface HookEntry { matcher: string; hooks: HookCmd[] }

export async function runInit(rootArg?: string): Promise<number> {
  const root = resolve(rootArg ?? process.cwd());
  const claudeDir = join(root, '.claude');
  const settingsPath = join(claudeDir, 'settings.json');
  mkdirSync(claudeDir, { recursive: true });

  const base = hookInvocation(root);
  const cmd = (event: string) => `${base} hook ${event}`;

  const settings: any = existsSync(settingsPath)
    ? safeParse(readFileSync(settingsPath, 'utf8'))
    : {};
  settings.hooks ??= {};

  addHook(settings.hooks, 'SessionStart', '*', cmd('session-start'));
  addHook(settings.hooks, 'UserPromptSubmit', '*', cmd('user-prompt'));
  addHook(settings.hooks, 'PreToolUse', '*', cmd('pre-tool'));
  addHook(settings.hooks, 'Stop', '*', cmd('stop'));

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  const ignored = ensureGitignore(root);

  console.log(`Installed ctxpack hooks into ${settingsPath}`);
  if (ignored.length) console.log(`Added to ${join(root, '.gitignore')}: ${ignored.join(', ')}`);
  console.log('Regular Claude Code is now guarded by ctxpack:');
  console.log('  - coding prompts generate and inject an evidence-backed Context Package;');
  console.log('  - Claude Code must emit a <CTXPACK_PLAN>...</CTXPACK_PLAN> block before edit tools run;');
  console.log('  - PreToolUse denies unsupported plans, stale packages, generated/vendor/build edits, and explanation-task delegation;');
  console.log('  - read/edit hooks can add orientation cards, and Stop reports impact + verification for files changed after the prompt started.');
  console.log('(Restart the Claude Code session to load the hooks.)');
  return 0;
}

/**
 * Builds a portable hook command. Unlike the local build, this avoids baking
 * this machine's absolute Node binary and CLI paths into `.claude/settings.json`
 * so the hooks still resolve in a fresh, ephemeral sandbox checkout:
 *
 *   - `node` is resolved from PATH rather than `process.execPath`.
 *   - `--disable-warning=ExperimentalWarning` keeps node:sqlite's notice out of
 *     hook stderr even before the in-process filter installs.
 *   - when the built CLI lives inside the guarded repo, it is referenced through
 *     `$CLAUDE_PROJECT_DIR` (which Claude Code expands to the project root at
 *     runtime) instead of an absolute path.
 *
 * `CTXPACK_HOOK_COMMAND` overrides the whole prefix for unusual layouts (e.g. a
 * global install or an `npx` wrapper); `hook <event>` is appended to it.
 */
function hookInvocation(root: string): string {
  const override = process.env['CTXPACK_HOOK_COMMAND']?.trim();
  if (override) return override;

  const node = 'node --disable-warning=ExperimentalWarning';
  const cli = process.argv[1];
  if (!cli) return `${node} ctxpack`;

  const rel = relative(root, cli);
  if (rel && !rel.startsWith('..') && !isAbsolute(rel)) {
    return `${node} "$CLAUDE_PROJECT_DIR/${rel.split(sep).join('/')}"`;
  }
  return `${node} "${cli}"`;
}

/**
 * Ensures the guarded repo ignores ctxpack's local artifacts so an ephemeral
 * session cannot accidentally commit the index DB or generated context into the
 * host repository. Returns the entries that were newly added.
 */
function ensureGitignore(root: string): string[] {
  const giPath = join(root, '.gitignore');
  const wanted = ['.context/', '.ctxpack.db', '.ctxpack.db-*'];
  const body = existsSync(giPath) ? readFileSync(giPath, 'utf8') : '';
  const present = new Set(body.split(/\r?\n/).map((l) => l.trim()));
  const missing = wanted.filter((e) => !present.has(e));
  if (missing.length === 0) return [];
  const prefix = body.length > 0 && !body.endsWith('\n') ? '\n' : '';
  appendFileSync(giPath, `${prefix}\n# ctxpack artifacts\n${missing.join('\n')}\n`);
  return missing;
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
