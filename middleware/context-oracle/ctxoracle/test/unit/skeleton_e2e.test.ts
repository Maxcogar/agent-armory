// Walking-skeleton end-to-end test (2026-09-25). One hook stream through the real
// built binary on a real git repository: init → question intake → a denied edit →
// the answer lands in the transcript → the edit is allowed → a coupling whisper on
// a read → dedup on the repeat read → a silent stop. It proves the steps connect;
// the per-step §12 tests replace its detail as each step is fully built.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, appendFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dispatch = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/cli/dispatch.js');

test('skeleton: a hook stream flows init → deny → answer → allow → whisper → dedup', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'ctxo-e2e-'));
  try {
    const repo = path.join(root, 'repo');
    const home = path.join(root, 'home');
    mkdirSync(repo);
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_SYSTEM: '/dev/null',
      CTXORACLE_HOME: home,
      NODE_NO_WARNINGS: '1',
    };
    delete env.CTXORACLE_INTERNAL;
    const git = (...a: string[]): void => {
      execFileSync('git', a, { cwd: repo, env });
    };
    git('init', '-q', '-b', 'main');
    git('config', 'user.email', 'f@x');
    git('config', 'user.name', 'f');
    git('config', 'commit.gpgsign', 'false');
    mkdirSync(path.join(repo, 'src/api'), { recursive: true });
    mkdirSync(path.join(repo, 'src/db'), { recursive: true });
    for (let i = 0; i < 4; i++) {
      writeFileSync(path.join(repo, 'src/api/handler.ts'), `export const v${i} = ${i};\n`);
      writeFileSync(path.join(repo, 'src/db/schema.ts'), `export const s${i} = ${i};\n`);
      git('add', '-A');
      git('commit', '-qm', `change ${i}`);
    }

    const init = execFileSync(process.execPath, [dispatch, 'init'], { cwd: repo, env }).toString();
    assert.match(init, /ctxoracle initialized/);

    const transcript = path.join(root, 't.jsonl');
    writeFileSync(transcript, '');
    const hook = (event: string, payload: Record<string, unknown>): string =>
      execFileSync(process.execPath, [dispatch, 'hook', event], {
        cwd: repo,
        env,
        input: JSON.stringify({ hook_event_name: event, session_id: 's1', transcript_path: transcript, cwd: repo, ...payload }),
      }).toString();
    const edit = { tool_name: 'Edit', tool_input: { file_path: path.join(repo, 'src/api/handler.ts') } };
    const read = { tool_name: 'Read', tool_input: { file_path: path.join(repo, 'src/api/handler.ts') }, tool_response: {} };

    assert.equal(hook('SessionStart', { source: 'startup' }), '');
    hook('UserPromptSubmit', { prompt: 'where do we store the schema version?' });
    appendFileSync(
      transcript,
      `${JSON.stringify({ type: 'user', uuid: 'u1', timestamp: new Date().toISOString(), origin: { kind: 'human' }, message: { role: 'user', content: 'where do we store the schema version?' } })}\n`
    );

    const denied = JSON.parse(hook('PreToolUse', edit)) as { hookSpecificOutput: { permissionDecision: string; permissionDecisionReason: string } };
    assert.equal(denied.hookSpecificOutput.permissionDecision, 'deny');
    assert.match(denied.hookSpecificOutput.permissionDecisionReason, /where do we store the schema version\?/);
    assert.equal(hook('PreToolUse', { ...read, tool_response: undefined }), '', 'a read is never denied');

    appendFileSync(
      transcript,
      `${JSON.stringify({ type: 'assistant', uuid: 'a1', timestamp: new Date().toISOString(), message: { role: 'assistant', content: [{ type: 'text', text: 'It lives in src/db/schema.ts as the exported constant.' }] } })}\n`
    );
    assert.equal(hook('PreToolUse', edit), '', 'the edit is allowed once the answer is in the transcript');

    const whisper = JSON.parse(hook('PostToolUse', read)) as { hookSpecificOutput: { additionalContext: string } };
    assert.match(whisper.hookSpecificOutput.additionalContext, /^\[oracle\] coupling: src\/db\/schema\.ts/);
    assert.equal(hook('PostToolUse', read), '', 'the same whisper is not repeated to the same consumer');
    assert.equal(hook('Stop', { last_assistant_message: 'All done.', stop_hook_active: false }), '');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
