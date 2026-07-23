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
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // YAML block sequence: `key:` on its own line followed by `  - item` lines.
    const seqKey = line.match(/^([A-Za-z_]+):\s*$/);
    if (seqKey && lines[i + 1] && /^\s*-\s+/.test(lines[i + 1])) {
      const arr = [];
      while (lines[i + 1] && /^\s*-\s+/.test(lines[i + 1])) arr.push(lines[++i].replace(/^\s*-\s+/, '').trim());
      fm[seqKey[1]] = arr;
      continue;
    }
    const ci = line.indexOf(':');
    if (ci > 0) fm[line.slice(0, ci).trim()] = line.slice(ci + 1).trim();
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

// ---- T-A2b: agents scoped per the hybrid partition (S-2) -------------------
// Allowlist (complete toolset nameable, no host MCP); the three that use host
// CodeGraph/RAG (reviewer/architect/planner) use denylists that retain full MCP.
const allowlist = new Set(['expert-spec-writer', 'expert-implementer', 'expert-verifier', 'expert-acceptance', 'expert-diagnostician', 'expert-closeout']);
const readonlyAllow = new Set(['expert-verifier', 'expert-acceptance', 'expert-diagnostician']); // allowlisted + no edit tools
const CORE = 'mcp__claude_ai_CORE_Memory__memory_ingest';
const packaged = new Set(skills);
const agentsDir = join(ROOT, 'agents');
const agents = readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
check('T-A2b nine agents present', agents.length === 9);
for (const f of agents) {
  const name = f.slice(0, -3);
  const fm = frontmatter(join(agentsDir, f)) || {};
  const tools = fm.tools || '';
  const dis = fm.disallowedTools || '';
  const skref = Array.isArray(fm.skills) ? (fm.skills[0] || '').split(':').pop() : '';
  check(`T-A2b ${name}: name+description`, fm.name === name && !!fm.description);
  check(`T-A2b ${name}: skills is a sequence -> packaged skill`, Array.isArray(fm.skills) && packaged.has(skref));
  check(`T-A2b ${name}: cannot CORE-ingest`, dis.includes(CORE) && !tools.includes(CORE));
  if (allowlist.has(name)) {
    check(`T-A2b ${name}: tools allowlist incl Skill`, !!fm.tools && tools.includes('Skill'));
    if (readonlyAllow.has(name)) check(`T-A2b ${name}: allowlist excludes write tools`, !tools.includes('Write') && !tools.includes('Edit'));
  } else { // reviewer / architect / planner — denylist retaining host MCP
    check(`T-A2b ${name}: no tools allowlist (retains host MCP)`, !fm.tools);
    check(`T-A2b ${name}: denies Agent + Task`, dis.includes('Agent') && dis.includes('Task'));
    if (name === 'expert-reviewer') check('T-A2b reviewer: independence-locked (denies Write/Edit/NotebookEdit, KEEPS Bash)', dis.includes('Write') && dis.includes('Edit') && dis.includes('NotebookEdit') && !/\bBash\b/.test(dis));
    if (name === 'expert-reviewer') check('T-A2b reviewer: denies WebFetch + WebSearch (F3)', dis.includes('WebFetch') && dis.includes('WebSearch'));
  }
}

// ---- T-A2a: workflow passes the canonical linter (M-1a) --------------------
const wf = join(ROOT, 'workflows/expert-lifecycle.js');
let syntaxOk = true;
try { execFileSync(process.execPath, ['--check', wf], { stdio: 'pipe' }); } catch { syntaxOk = false; }
check('T-A2a workflow: valid JS syntax', syntaxOk);
// The specified oracle is the workflow-creator linter (plan A-2), not a hand-rolled regex.
// It lives at the repo root; this structural tier runs inside the agent-armory checkout.
const linter = join(ROOT, '../../skills/workflow-creator/scripts/validate-workflow.mjs');
if (!existsSync(linter)) {
  check('T-A2a workflow: canonical linter present (validate-workflow.mjs)', false);
  console.log(`  (linter not found at ${linter} — run the structural tier from the agent-armory repo checkout)`);
} else {
  let linterOk = true;
  try { execFileSync(process.execPath, [linter, wf], { stdio: 'pipe' }); } catch { linterOk = false; }
  check('T-A2a workflow: passes the workflow-creator linter', linterOk);
}
check('T-A2a workflow: meta is the first statement', /^export const meta = \{/.test(readFileSync(wf, 'utf8')));

// ---- T-A2c: manifest + MCP config -----------------------------------------
const manifest = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/plugin.json'), 'utf8'));
check('T-A2c manifest: kebab-case name', /^[a-z0-9]+(-[a-z0-9]+)*$/.test(manifest.name));
check('T-A2c manifest: has version', !!manifest.version);
check('T-A2c manifest: declares no hooks (divergence §8)', !('hooks' in manifest));
const mcp = JSON.parse(readFileSync(join(ROOT, '.mcp.json'), 'utf8'));
const servers = Object.keys(mcp.mcpServers || {}); // strict: a bare map (no mcpServers) yields none and fails (unmasks S-1)
check('T-A2c mcp: mcpServers wrapper declares context7 + clear-thought', servers.includes('context7') && servers.includes('clear-thought'));
check('T-A2c mcp: does NOT declare codegraph/codebase-rag (D8)', !servers.some((s) => /codegraph|codebase-rag/.test(s)));

// ---- command + scripts present --------------------------------------------
check('command present with frontmatter', !!frontmatter(join(ROOT, 'commands/expert.md')));
for (const s of ['ledger.schema.json', 'validate-ledger.mjs', 'extract-owner-turns.mjs'])
  check(`script ${s} present`, existsSync(join(ROOT, 'scripts', s)));

// ---- M-3: forced-failure fixtures present + parse -------------------------
check('M-3 A-4b fabricating-implementer fixture parses', !!frontmatter(join(ROOT, 'tests/fixture/agents/forced-fabricating-implementer.md')));
check('M-3 A-4c contradictory spec fixture present', existsSync(join(ROOT, 'tests/fixture/spec/spec-contradictory.md')));

console.log(failures ? `\nSTRUCTURAL TESTS FAILED (${failures})` : '\nSTRUCTURAL TESTS PASSED');
process.exit(failures ? 1 : 0);
