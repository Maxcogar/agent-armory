// Structural tests: skills load-clean, agents scoped correctly, workflow is valid
// and deterministic, manifest and MCP config are well-formed. No agents dispatched,
// no tokens spent (plan T-A1 / T-A2, structural tier). Run: node tests/structural/check-structure.mjs

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
let failures = 0;
const check = (label, cond) => { if (!cond) failures++; console.log(`${cond ? 'ok  ' : 'FAIL'}  ${label}`); };

function frontmatter(path) {
  const t = readFileSync(path, 'utf8');
  const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return fm;
}

// ---- T-A1: nine skills load-clean -----------------------------------------
const skillsDir = join(ROOT, 'skills');
const skills = readdirSync(skillsDir);
check('T-A1 nine skills packaged', skills.length === 9);
for (const s of skills) {
  const fm = frontmatter(join(skillsDir, s, 'SKILL.md'));
  check(`T-A1 skill ${s} has parseable frontmatter + name`, !!fm && !!fm.name);
}

// ---- T-A2b: nine agents scoped correctly ----------------------------------
const readonly = new Set(['expert-reviewer', 'expert-verifier', 'expert-acceptance', 'expert-diagnostician']);
const CORE = 'mcp__claude_ai_CORE_Memory__memory_ingest';
const packaged = new Set(skills);
const agentsDir = join(ROOT, 'agents');
const agents = readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
check('T-A2b nine agents present', agents.length === 9);
for (const f of agents) {
  const name = f.slice(0, -3);
  const fm = frontmatter(join(agentsDir, f)) || {};
  const dis = fm.disallowedTools || '';
  const skref = (fm.skills || '').split(':').pop();
  check(`T-A2b ${name}: name+description`, fm.name === name && !!fm.description);
  check(`T-A2b ${name}: skills -> packaged skill`, packaged.has(skref));
  check(`T-A2b ${name}: disallows CORE ingest`, dis.includes(CORE));
  if (readonly.has(name)) check(`T-A2b ${name}: read-only (no Write/Edit)`, dis.includes('Write') && dis.includes('Edit'));
  if (name === 'expert-reviewer') check('T-A2b reviewer: pure read-only (no Bash)', dis.includes('Bash'));
}

// ---- T-A2a: workflow valid syntax + deterministic -------------------------
const wf = join(ROOT, 'workflows/expert-lifecycle.js');
let syntaxOk = true;
try { execFileSync(process.execPath, ['--check', wf], { stdio: 'pipe' }); } catch { syntaxOk = false; }
check('T-A2a workflow: valid JS syntax', syntaxOk);
const wfsrc = readFileSync(wf, 'utf8');
const banned = /Date\.now\s*\(|Math\.random\s*\(|new Date\(\s*\)|\brequire\s*\(|\bimport\b[^\n]*\bfrom\b/;
// strip line comments so the "No Math.random" note doesn't trip the guard
const codeOnly = wfsrc.split(/\r?\n/).map((l) => l.replace(/\/\/.*$/, '')).join('\n');
check('T-A2a workflow: no banned non-deterministic / import calls', !banned.test(codeOnly));
check('T-A2a workflow: meta is the first statement', /^export const meta = \{/.test(wfsrc));

// ---- T-A2c: manifest + MCP config -----------------------------------------
const manifest = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/plugin.json'), 'utf8'));
check('T-A2c manifest: kebab-case name', /^[a-z0-9]+(-[a-z0-9]+)*$/.test(manifest.name));
check('T-A2c manifest: has version', !!manifest.version);
check('T-A2c manifest: declares no hooks (divergence §8)', !('hooks' in manifest));
const mcp = JSON.parse(readFileSync(join(ROOT, '.mcp.json'), 'utf8'));
const servers = Object.keys(mcp.mcpServers || mcp);
check('T-A2c mcp: declares context7 + clear-thought', servers.includes('context7') && servers.includes('clear-thought'));
check('T-A2c mcp: does NOT declare codegraph/codebase-rag (D8)', !servers.some((s) => /codegraph|codebase-rag/.test(s)));

// ---- command + scripts present --------------------------------------------
check('command present with frontmatter', !!frontmatter(join(ROOT, 'commands/expert.md')));
for (const s of ['ledger.schema.json', 'validate-ledger.mjs', 'extract-owner-turns.mjs'])
  check(`script ${s} present`, existsSync(join(ROOT, 'scripts', s)));

console.log(failures ? `\nSTRUCTURAL TESTS FAILED (${failures})` : '\nSTRUCTURAL TESTS PASSED');
process.exit(failures ? 1 : 0);
