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
check('T-A1 ten skills packaged', skills.length === 10);
for (const s of skills) {
  const fm = frontmatter(join(skillsDir, s, 'SKILL.md'));
  check(`T-A1 skill ${s} has parseable frontmatter + name`, !!fm && !!fm.name);
}

// ---- T-A2b: agents scoped per the hybrid partition (S-2) -------------------
// Allowlist (complete toolset nameable, no host MCP); the three that use host
// CodeGraph/RAG (reviewer/architect/planner) use denylists that retain full MCP.
const allowlist = new Set(['expert-spec-writer', 'expert-implementer', 'expert-verifier', 'expert-acceptance', 'expert-diagnostician', 'expert-closeout', 'expert-corrector']);
const readonlyAllow = new Set(['expert-verifier', 'expert-acceptance', 'expert-diagnostician']); // allowlisted + no edit tools
const CORE = 'mcp__claude_ai_CORE_Memory__memory_ingest';
const packaged = new Set(skills);
const agentsDir = join(ROOT, 'agents');
const agents = readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
check('T-A2b ten agents present', agents.length === 10);
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
    // T-3 (S2/S3): every allowlisted agent holds BOTH documentation paths the
    // skills require — the bundled Context7 grant and the fetch/search fallback.
    // expert-spec/SKILL.md:155 names two acceptable verification routes; an agent
    // holding one has an unsatisfiable instruction the moment that route fails.
    check(`T-3 ${name}: holds both documentation paths (context7 + WebFetch + WebSearch)`,
      tools.includes('mcp__plugin_expert-dev-tools_context7') && tools.includes('WebFetch') && tools.includes('WebSearch'));
    // T-5 (S5/S7): the corrector's load-bearing property. `Write` would let a
    // correction replace the artifact wholesale, discarding the sections no
    // finding touched — the measured re-authoring failure. `Edit` imposes no
    // size limit, so removing `Write` does not push toward patching. The
    // corrector is therefore in `allowlist` but NOT in `readonlyAllow`, which
    // forbids `Edit`.
    if (name === 'expert-corrector')
      check('T-5 expert-corrector: granted Edit, denied Write',
        tools.includes('Edit') && !tools.includes('Write'));
  } else { // reviewer / architect / planner — denylist retaining host MCP
    check(`T-A2b ${name}: no tools allowlist (retains host MCP)`, !fm.tools);
    check(`T-A2b ${name}: denies Agent + Task`, dis.includes('Agent') && dis.includes('Task'));
    if (name === 'expert-reviewer') check('T-A2b reviewer: independence-locked (denies Write/Edit/NotebookEdit, KEEPS Bash)', dis.includes('Write') && dis.includes('Edit') && dis.includes('NotebookEdit') && !/\bBash\b/.test(dis));
    if (name === 'expert-reviewer') check('T-A2b reviewer: denies WebFetch + WebSearch (F3)', dis.includes('WebFetch') && dis.includes('WebSearch'));
  }
}

// ---- T-2b: agent return contracts bound to the schemas the workflow reads --
// Oracle (S2b): by literal match on the workflow source — no dataflow analysis.
// It asserts against the DECLARED schema surface, which is a superset of what
// the workflow actually reads, so the check is conservative: it can demand a
// field the workflow ignores, never miss one it consumes.
const wfSrc = readFileSync(join(ROOT, 'workflows/expert-lifecycle.js'), 'utf8');

// Balanced-brace body of the object literal starting at the first `{` after `from`.
function braced(src, from) {
  const start = src.indexOf('{', from);
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(start + 1, i);
  }
  return '';
}
// Keys declared at depth 0 of an object-literal body.
function topKeys(body) {
  const keys = [];
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') depth--;
    else if (depth === 0 && /[A-Za-z_]/.test(c) && !/[A-Za-z0-9_$.]/.test(body[i - 1] || ' ')) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*:/.exec(body.slice(i));
      if (m) { keys.push(m[1]); i += m[0].length - 1; }
    }
  }
  return keys;
}
// AGENT map: key -> agent file name.
const agentMap = {};
for (const m of braced(wfSrc, wfSrc.indexOf('const AGENT =')).matchAll(/(\w+):\s*NS \+ '([^']+)'/g))
  agentMap[m[1]] = m[2];
// Each `const <NAME>_SCHEMA = {…}` -> its top-level `properties:` key names.
const schemaProps = {};
for (const m of wfSrc.matchAll(/const (\w+_SCHEMA|EVIDENCE) = \{/g)) {
  const body = braced(wfSrc, m.index + m[0].length - 1);
  let depth = 0, propsAt = -1;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') depth--;
    else if (depth === 0 && body.startsWith('properties:', i)) { propsAt = i; break; }
  }
  schemaProps[m[1]] = propsAt < 0 ? [] : topKeys(braced(body, propsAt));
}
// Every `agent(` dispatch's options object.
const dispatchRe =
  /\{\s*agentType:\s*AGENT\.(\w+),\s*schema:\s*(\w+),\s*phase:\s*'[^']*',\s*label:\s*(?:'([^']*)'|`([^`]*)`)\s*\}/g;
const perAgent = {};
for (const m of wfSrc.matchAll(dispatchRe)) {
  const file = agentMap[m[1]];
  check(`T-2b dispatch names a known AGENT key (${m[1]})`, !!file);
  if (!file) continue;
  const e = (perAgent[file] = perAgent[file] || { schemas: new Set(), labels: new Set() });
  e.schemas.add(m[2]);
  e.labels.add(m[3] !== undefined ? m[3] : m[4]);
}
check('T-2b every agent file is dispatched at least once', Object.keys(perAgent).length === agents.length);
for (const f of agents) {
  const name = f.slice(0, -3);
  const fm = frontmatter(join(agentsDir, f)) || {};
  const e = perAgent[name] || { schemas: new Set(), labels: new Set() };
  const declared = new Set(Array.isArray(fm.returns) ? fm.returns : []);
  const required = new Set();
  for (const s of e.schemas) for (const p of schemaProps[s] || []) required.add(p);
  const missing = [...required].filter((p) => !declared.has(p));
  check(`T-2b ${name}: returns: declares every field of every schema it is dispatched with`,
    declared.size > 0 && missing.length === 0);
  if (missing.length) console.log(`  (missing: ${missing.join(', ')})`);
  check(`T-2b ${name}: jobs: equals its distinct dispatch-label count (${e.labels.size})`,
    String(fm.jobs) === String(e.labels.size));
}

// ---- T-12 (S15): every `diagnose(` CALL passes three arguments -------------
// The defect's signature is a MISSING ARGUMENT — syntactically valid JavaScript,
// so invisible to both `node --check` and the linter below, which is exactly how
// the starved dispatch survived the automated tiers. Spec F-13 / architecture C3
// mandate the failure record alongside the ledger snapshot; a two-argument call
// silently drops it. The declaration is excluded; every call site is counted, so
// a site added later is covered without touching this check.
{
  let sites = 0, bad = 0;
  const re = /(?<!function\s)\bdiagnose\(/g;
  for (const m of wfSrc.matchAll(re)) {
    const args = braced_args(wfSrc, m.index + m[0].length - 1);
    if (args === null) continue;
    sites++;
    if (topLevelCommas(args) + 1 < 3) { bad++; console.log(`  (2-arg diagnose call: ${args.slice(0, 70)}…)`); }
  }
  check(`T-12 diagnose: all ${sites} call sites pass three arguments`, sites > 0 && bad === 0);
}
// Argument-list text of a call whose `(` is at `open`.
function braced_args(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')' && --depth === 0) return src.slice(open + 1, i);
  }
  return null;
}
// Commas at nesting depth 0, ignoring strings and template literals.
function topLevelCommas(s) {
  let depth = 0, n = 0, q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) n++;
  }
  return n;
}

// ---- T-A2a: workflow passes the canonical linter (M-1a) --------------------
const wf = join(ROOT, 'workflows/expert-lifecycle.js');
// The workflow is ESM-flagged (`export const meta` at :1) but also uses top-level
// `return` (:688) and top-level `await` (:459). That is legal because the harness
// runs the body inside an async function (skills/workflow-creator/SKILL.md:142-145).
// No standard goal accepts the shape: `node --check` on the .js path exits 0 for ANY
// syntax error once `export` is present, and `--input-type=module --check` rejects
// the legitimate top-level return. Compiling the body as an async function is the
// only oracle that both rejects real defects and accepts this file's correct form.
// The "use strict" directive is load-bearing: a bare `new Function` body is sloppy
// mode, which silently accepts octal literals, `with`, duplicate parameter names,
// `delete` of an unqualified identifier, assignment to `eval`, and octal escapes —
// all SyntaxErrors under ECMA-262 §11.2.2 strict code, and all six executed.
function parsesAsWorkflowBody(src) {
  try { new Function('"use strict"; return (async function(){' + src.replace(/^export /gm, '') + '\n})'); return true }
  catch { return false }
}
check('T-A2a workflow: parses as a workflow body (strict)', parsesAsWorkflowBody(readFileSync(wf, 'utf8')));
check('T-A2a-neg the parse oracle REJECTS a known-broken workflow (the gate can fail)',
  !parsesAsWorkflowBody(readFileSync(join(ROOT, 'tests/fixture/workflow/broken-syntax-workflow.js'), 'utf8')));
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

// T-A2d: schema `pattern` values must be regexes that actually match the grammar
// they encode. F-3 shipped green because nothing evaluated any pattern: written as
// a single-quoted string, `\s`/`\d`/`\S` were consumed as string escapes and the
// pattern matched no valid location. Evaluating the source expression — not a
// re-typed copy of it — is what reproduces that class.
const PATTERN_EXEMPLARS = {
  // schema const name -> { good: [...], bad: [...] }  (ISO/IEC/IEEE 29119-4 equivalence partitioning)
  LOCATION: { good: ['spec.md:271-273', 'spec.md:271', 'plan.md#s7'], bad: ['spec.md', 'a b.md:1', 'spec.md:x'] },
};
const reDecls = (wfSrc.match(/^const \w+_RE = \/.*\/[gimsuy]*$/gm) || []).join('\n');
const schemaDecls = (wfSrc.match(/^const (\w+) = \{[^\n]*pattern:[^\n]*\}$/gm) || []);
const schemaNames = schemaDecls.map((d) => /^const (\w+)/.exec(d)[1]);
check('T-A2d at least one schema pattern was found to check', schemaNames.length > 0);
const schemas = new Function([reDecls, ...schemaDecls,
  `return { ${schemaNames.join(', ')} }`].join('\n'))();
for (const name of schemaNames) {
  const ex = PATTERN_EXEMPLARS[name];
  check(`T-A2d ${name}: exemplars are declared for this pattern`, !!ex);
  if (!ex) continue;
  let re = null;
  try { re = new RegExp(schemas[name].pattern) } catch { re = null }
  check(`T-A2d ${name}: pattern constructs as a RegExp`, !!re);
  if (!re) continue;
  for (const g of ex.good) check(`T-A2d ${name}: matches known-good ${JSON.stringify(g)}`, re.test(g));
  for (const b of ex.bad) check(`T-A2d ${name}: rejects known-bad ${JSON.stringify(b)}`, !re.test(b));
}

// ---- T-A2c: manifest + MCP config -----------------------------------------
const manifest = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/plugin.json'), 'utf8'));
check('T-A2c manifest: kebab-case name', /^[a-z0-9]+(-[a-z0-9]+)*$/.test(manifest.name));
check('T-A2c manifest: has version', !!manifest.version);
check('T-A2c manifest: declares no hooks (divergence §8)', !('hooks' in manifest));
const mcp = JSON.parse(readFileSync(join(ROOT, '.mcp.json'), 'utf8'));
const servers = Object.keys(mcp.mcpServers || {}); // strict: a bare map (no mcpServers) yields none and fails (unmasks S-1)
check('T-A2c mcp: mcpServers wrapper declares context7 + clear-thought', servers.includes('context7') && servers.includes('clear-thought'));
check('T-A2c mcp: does NOT declare codegraph/codebase-rag (D8)', !servers.some((s) => /codegraph|codebase-rag/.test(s)));
// T-3 (S1/S3): DO NOT "tidy" the context7 entry back to a bare `npx` invocation.
// Claude Code deduplicates MCP servers on command/URL, not on server name. The
// bare form is byte-identical to the standalone `context7` plugin's, so the host
// skips this plugin's copy and the namespace registers zero tools. A distinct
// invocation string is the only property that restores registration; the `cmd /c`
// wrapper is the form agentboard/.mcp.json already uses. The server KEY must stay
// `context7` — line 100 above asserts it, and the key is not the dedupe key.
const c7 = (mcp.mcpServers || {}).context7 || {};
const c7args = Array.isArray(c7.args) ? c7.args : [];
check('T-3 mcp: context7 still resolves @upstash/context7-mcp', c7args.some((a) => a === '@upstash/context7-mcp' || a.startsWith('@upstash/context7-mcp@')));
check('T-3 mcp: context7 invocation is not the colliding bare-npx form',
  !(c7.command === 'npx' && c7args.length === 2 && c7args[0] === '-y' && c7args[1] === '@upstash/context7-mcp'));

// ---- command + scripts present --------------------------------------------
check('command present with frontmatter', !!frontmatter(join(ROOT, 'commands/expert.md')));
for (const s of ['ledger.schema.json', 'validate-ledger.mjs', 'extract-owner-turns.mjs'])
  check(`script ${s} present`, existsSync(join(ROOT, 'scripts', s)));

// ---- M-3: forced-failure fixtures present + parse -------------------------
check('M-3 A-4b fabricating-implementer fixture parses', !!frontmatter(join(ROOT, 'tests/fixture/agents/forced-fabricating-implementer.md')));
check('M-3 A-4c contradictory spec fixture present', existsSync(join(ROOT, 'tests/fixture/spec/spec-contradictory.md')));


// ===========================================================================
// Plan verification tier — T-1, T-6, T-8..T-11, T-13..T-20, T-22, T-23.
// Static assertions read real files; the executed cases below run the REAL
// runGate extracted from the workflow source (it is the subject and is never
// doubled) against hand-supplied reviewFn/remediateFn stubs.
// ===========================================================================
const cmd = readFileSync(join(ROOT, 'commands/expert.md'), 'utf8');
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');

// ---- T-6: the three document gates dispatch the corrector ------------------
{
  const doc = ['revise:spec', 'revise:arch', 'revise:plan'].every((l) =>
    new RegExp(`agentType: AGENT\\.corrector[^}]*label: '${l}'`).test(wfSrc));
  check('T-6 the three document gates remediate via AGENT.corrector', doc);
  check('T-6 the implementation gate still remediates via AGENT.planner',
    /agentType: AGENT\.planner[^}]*label: 'remediate:impl'/.test(wfSrc));
}

// ---- T-8 (+T-9): every review dispatch names a ruler and a contract --------
// Asserted as PRESENCE per gate, never as absence of "and named standards":
// the implementation dispatch satisfied the absence form without any edit, so
// an absence-only check cannot catch an omission at the gate that most needs it.
{
  const gates = [
    ['spec', 'RULER.spec', 'OUTPUT_CONTRACT.spec'],
    ['architecture', 'RULER.architecture', 'OUTPUT_CONTRACT.architecture'],
    ['plan', 'RULER.plan', 'OUTPUT_CONTRACT.plan'],
    ['implementation', 'RULER.implementation', null], // N/A by S9's stated scope: a diff has no output contract
  ];
  for (const [g, ruler, contract] of gates) {
    check(`T-8 ${g} review dispatch interpolates ${ruler}`, wfSrc.includes('${' + ruler + '}'));
    check(`T-9 ${g} review dispatch cites its output contract`,
      contract === null ? true : wfSrc.includes('${' + contract + '}'));
  }
  check('T-8 every review dispatch excludes the authoring skill as a ruler',
    (wfSrc.match(/\$\{NOT_THE_RULER\}/g) || []).length === 4);
}

// ---- T-9: each cited output contract actually exists -----------------------
check('T-9 spec output contract exists', /^## Output$/m.test(rd('skills/expert-spec/SKILL.md')));
check('T-9 architecture output contract exists at its cited line',
  rd('skills/expert-architecture/SKILL.md').split(/\r?\n/)[65].includes('Output contract'));
check('T-9 plan output contract document exists',
  existsSync(join(ROOT, 'skills/expert-plan/references/output-contract.md')));

// ---- T-10: one fixed artifact location; no agent contradicts it ------------
{
  const skillFiles = ['skills/expert-spec/SKILL.md', 'skills/expert-architecture/SKILL.md',
    'skills/expert-architecture-portable/SKILL.md', 'skills/expert-plan/SKILL.md'];
  const banned = ['propose a location', 'get confirmation', "if there's an established location"];
  for (const f of skillFiles) {
    const s = rd(f);
    check(`T-10 ${f}: no conditional-location escape`, !banned.some((b) => s.includes(b)));
  }
  // Scope is seven files, not four: a four-file scope cannot see the skill/agent
  // contradiction S11's paired edit removes.
  const ALLOWED = ['docs/specs/', 'docs/architectures/', 'docs/plans/'];
  for (const f of agents) {
    const s = rd(`agents/${f}`);
    const dirs = [...s.matchAll(/docs\/[a-z]+\//g)].map((m) => m[0]);
    check(`T-10 agents/${f}: names no artifact directory outside the convention`,
      dirs.every((d) => ALLOWED.includes(d)));
  }
}

// ---- T-11: diagnose() is three-parameter and labels the ledger stale -------
check('T-11 diagnose declares three parameters',
  /async function diagnose\(failureDescription, ledger, failureRecord\)/.test(wfSrc));
check('T-11 diagnose labels the ledger snapshot as stale',
  /predates this segment; does NOT contain these rounds/.test(wfSrc));
check('T-11 diagnose carries a labelled failure-record channel',
  /Failure record \(evidence from THIS segment; not yet in the ledger\)/.test(wfSrc));

// ---- T-13: the diagnostician's contract matches the caller ----------------
check('T-13 diagnostician no longer promises a run-journal excerpt',
  !/run-journal excerpt/.test(rd('agents/expert-diagnostician.md')));

// ---- T-14: the six clauses are gone from ALL packaged skills ---------------
// Scope is every skills/*/SKILL.md — the full population, so the scope is
// credibly covered. No replacement text is asserted: the owner ruled deletion.
{
  const re = /flag once|flag it once|then comply|flag the concern/i;
  const hits = skills.filter((s) => re.test(rd(`skills/${s}/SKILL.md`)));
  check(`T-14 no "flag once, then comply" clause survives in any of the ${skills.length} skills`,
    hits.length === 0);
  if (hits.length) console.log(`  (surviving in: ${hits.join(', ')})`);
}

// ---- T-15: the spec artifact registers BEFORE its gate ---------------------
check('T-15 the spec artifact push precedes runGate in source order',
  wfSrc.indexOf("delta.artifacts.push({ role: 'spec'") < wfSrc.indexOf('const gate = await runGate(') &&
  wfSrc.indexOf("delta.artifacts.push({ role: 'spec'") > 0);
check('T-15 the spec artifact is pushed exactly once',
  (wfSrc.match(/delta\.artifacts\.push\(\{ role: 'spec'/g) || []).length === 1);

// ---- T-16: stale_deployment builds an escalation ---------------------------
check('T-16 a stale_deployment branch exists alongside the other two verdicts',
  /kind: 'stale_deployment'/.test(wfSrc) && /d\.verdict === 'stale_deployment'/.test(wfSrc));

// ---- T-17: the command carries the dedupe key and the stale branch ---------
check('T-17 command: occurrences upsert on (project, session_file)',
  /upsert.*\(`?project`?, `?session_file`?\)/s.test(cmd) || cmd.includes('(project, session_file)') || cmd.includes('`(project, session_file)`'));
check('T-17 command: STATUS surfaces the stale_deployment branch',
  /stale_deployment/.test(cmd) && /plugin is behind|behind; update it/.test(cmd));
check('T-17 command: presents the plain feedback dispositions array',
  /plain `feedback` array/.test(cmd));
check('T-17 command: no `docs/` project default is supplied to the workflow',
  /Do not supply a project default under `docs\/`/.test(cmd));

// ---- T-18: the three document phases carry a scope check -------------------
check('T-18 three document phases dispatch the scope check',
  (wfSrc.match(/await documentScopeCheck\(/g) || []).length === 3);
check('T-18 the scope check is dispatched to the verifier under one label',
  /agentType: AGENT\.verifier[^}]*label: 'doc-scope'/.test(wfSrc));

// ---- T-19: the A-4c fixture describes a three-way contradiction ------------
{
  const fx = rd('tests/fixture/spec/spec-contradictory.md');
  check('T-19 the A-4c fixture frames the contradiction as three-way',
    /three-way/.test(fx) && !/deliberate, internal contradiction/.test(fx));
}

// ---- T-20: no verification mechanism is weakened ---------------------------
// The properties the correction doctrine actually protects. NOT "the files are
// untouched" — S22 edits both, deliberately, in the strengthening direction.
{
  const baseline = (p) => {
    try { return execFileSync('git', ['show', `HEAD:claude-plugins/expert-dev-tools/${p}`], { cwd: ROOT, encoding: 'utf8' }); }
    catch { return null; }
  };
  check('T-20 spot-check sampling constant is unchanged',
    wfSrc.includes('Math.min(n, Math.max(2, Math.ceil(0.1 * n)))'));
  const oldWf = baseline('workflows/expert-lifecycle.js');
  if (oldWf) {
    const oldEv = /const EVIDENCE = \{[\s\S]*?\n\}/.exec(oldWf)[0];
    const fields = [...oldEv.matchAll(/(\w+): S_STR/g)].map((m) => m[1]);
    const newEv = /const EVIDENCE = \{[\s\S]*?\n\}/.exec(wfSrc)[0];
    check(`T-20 every EVIDENCE field present at baseline survives (${fields.join(', ')})`,
      fields.every((f) => new RegExp(`\\b${f}: S_STR`).test(newEv)));
    check('T-20 the split is additive — observed and asserted added alongside',
      /observed: S_STR/.test(newEv) && /asserted: S_STR/.test(newEv));
  } else {
    check('T-20 baseline reachable from git', false);
  }
  const oldChecks = baseline('tests/structural/check-structure.mjs');
  if (oldChecks) {
    const labels = [...oldChecks.matchAll(/check\(\s*[`'"]([^`'"]{8,160})/g)].map((m) => m[1]);
    const src = readFileSync(join(ROOT, 'tests/structural/check-structure.mjs'), 'utf8');
    // A RENAMED label is not a removed check. S7 changed two labels' cardinality
    // word (nine -> ten) when the corrector skill and agent landed; the assertions
    // behind them are untouched. Normalize the cardinality word before comparing,
    // so the oracle measures "was a check deleted", not "was a label edited".
    const norm = (s) => s.replace(/\b(nine|ten|eleven|\d+)\b/g, '#');
    // A check REPLACED by a strictly stronger one is not a deleted check. That
    // difference is NOT inferable from the labels, so it is declared here, never
    // guessed by widening the normalizer. Each entry names the exact baseline label
    // and the exact label that supersedes it, with the finding that forced the swap.
    const REPLACED_BY_STRENGTHENING = [
      {
        was: 'T-24 gate-count comment matches the GATE literal (all member forms; spreads fail closed)',
        now: 'T-24 gate-count comment matches the evaluated GATE literal (fail-closed on unevaluable)',
        why: 'corrections-0.3.0 round-10 tripwire rework: two rounds of widening the source-text ' +
             'lexer each left member forms it could not see (F9-1, F10-1). The literal is now ' +
             'lifted and evaluated, so the language counts its own members; anything unevaluable ' +
             'in isolation throws and the check fails closed.',
      },
      {
        was: 'T-24 gate-count comment matches the GATE literal',
        now: 'T-24 gate-count comment matches the GATE literal (all member forms; spreads fail closed)',
        why: 'corrections-0.3.0 round-9 F9-1: the original counter recognized bare-identifier ' +
             'keys only, so a quoted-key or spread member evaded the count. The replacement ' +
             'counts every member form at depth 0 and fails closed on spreads.',
      },
      {
        was: 'T-24 gt-guard: target traceability is in the refusal predicate',
        now: 'T-24 gt-guard: refusal predicate is the extracted pure function',
        why: 'corrections-0.3.0 round-5 F5-3: the inline predicate was extracted into ' +
             'groundTruthPreconditions so T-24x can lift and EXECUTE it; the text pin now ' +
             'targets the call site, and five executed T-24x cases observe the refusals.',
      },
      {
        was: 'T-24 shared accumulator: implement gate and gt-guard read the same registered set',
        now: 'T-24 shared accumulator: the implement gate reads the registered set',
        why: 'corrections-0.3.0 round-5: the gt-guard side moved into the extracted pure ' +
             'function (executed by T-24x); the remaining text pin covers the implement gate.',
      },
      {
        was: 'T-24 gt-guard: refusal is an answerable owner gate, and no terminal failed outcome exists',
        now: 'T-24 every workflow outcome is complete or owner_gate (no terminal failed, reworded or not)',
        why: 'corrections-0.3.0 round-5 F5-4: the quote-specific assertion is replaced by a ' +
             'semantic scan over every outcome literal, immune to rewording.',
      },
      {
        was: 'T-24 scope-check: no mtime proxy remains in the exemption rules',
        now: 'T-24 scope-check: no time-based exemption in the scope rules (semantic, reword-resistant)',
        why: 'corrections-0.3.0 round-5 F5-4: mutation probe M4 showed a REWORDED mtime rule ' +
             'passed the verbatim-sentence pin; the replacement matches the concept by regex ' +
             'over the scope-check prompt region.',
      },
      {
        was: 'T-24 scope-check: same-segment earlier-phase outputs are exempt by path list',
        now: 'T-24 scope-check: each phase RECORDS its artifact hash via the verifier',
        why: 'corrections-0.3.0 round-4 F4-3: the path-list exemption (with an mtime-ordering ' +
             'condition) was replaced by uniform hash comparison - each phase\'s scope-check ' +
             'verifier records the artifact\'s SHA-256, so same-segment artifacts are checked ' +
             'exactly like prior-segment ones, both edit interleavings.',
      },
      {
        was: 'T-A2a workflow: valid JS syntax',
        now: 'T-A2a workflow: parses as a workflow body (strict)',
        why: 'implementation-round-01 F-2: `node --check` on the .js path exits 0 for ANY ' +
             'syntax error once `export` is present. The replacement parses the file under ' +
             'the goal the harness executes it in, and T-A2a-neg holds it demonstrably able to fail.',
      },
    ];
    const supersededBy = new Map(REPLACED_BY_STRENGTHENING.map((r) => [r.was, r.now]));
    // The guard's predicate, named so the T-A2f cases below exercise THIS function
    // rather than a copy of it. A copy could drift into passing while the live
    // guard rots — the defect class this whole plan exists to close.
    //
    // PRESENCE IS STRUCTURAL, NOT TEXTUAL. A label counts as present only when it
    // appears in `check(` call position — the `here` set. The obvious-looking
    // `currentSrc.includes(l)` disjunct is deliberately ABSENT: it short-circuits
    // before the allowlist is consulted, so any baseline label that appears
    // anywhere in the file AS DATA (an allowlist `was:` field, a test argument, a
    // comment) silently counts as a live check. That is not hypothetical — the
    // allowlist below writes this very label into the file, which is exactly how
    // this guard was found reporting green over a deleted check.
    const goneFrom = (baselineLabels, currentSrc) => {
      const here = new Set([...currentSrc.matchAll(/check\(\s*[`'"]([^`'"]{8,160})/g)].map((m) => norm(m[1])));
      return baselineLabels.filter((l) => {
        if (here.has(norm(l))) return false;              // structural: in check( position
        const now = supersededBy.get(l);
        return !(now && here.has(norm(now)));             // replacement must ALSO be in check( position
      });
    };
    const gone = goneFrom(labels, src);
    check('T-20 no check present at baseline was removed', gone.length === 0);
    if (gone.length) console.log(`  (removed: ${gone.join(' | ')})`);

    // T-A2f: the allowlist must not have switched the guard off. Same predicate,
    // four cases. The synthetic sources are ASSEMBLED, not written literally: a
    // literal check('… in a test argument lands in the very set `here` is built
    // from, which would reintroduce the false negative this step exists to remove.
    const asCheck = (label) => 'check(' + JSON.stringify(label) + ', z)';
    const OLD_LABEL = REPLACED_BY_STRENGTHENING[0].was;
    const NEW_LABEL = REPLACED_BY_STRENGTHENING[0].now;
    check('T-A2f a genuinely deleted check is still reported',
      goneFrom(['T-A2a workflow: meta is the first statement'], asCheck('unrelated label here')).length === 1);
    check('T-A2f an allowlisted replacement whose new label IS present is not reported',
      goneFrom([OLD_LABEL], asCheck(NEW_LABEL)).length === 0);
    check('T-A2f an allowlisted replacement whose new label is ABSENT is reported',
      goneFrom([OLD_LABEL], asCheck('unrelated label here')).length === 1);
    // The case that pins THIS step's defect: presence as data is not presence.
    check('T-A2f a baseline label appearing only as data is still reported gone',
      goneFrom(['a label that exists only as data'], "const x = 'a label that exists only as data'").length === 1);
  }
}

// ===========================================================================
// T-22 / T-23 — executed cases. runGate runs REAL: it is the subject under
// test and is never doubled. reviewFn/remediateFn are stubs (Meszaros: stub —
// canned returns supplying the inputs that drive the asserted verdict),
// justified because the real functions dispatch subagents, which is neither
// fast nor deterministic, and the subject is runGate's comparison logic.
//
// Production obligation for the doubled inputs — sections_rederived and, inside
// each item, class_sweep and status: obliged of agents/expert-corrector.md by
// its `returns:` frontmatter; of the corrector's METHOD by
// skills/expert-correct/SKILL.md's structured return contract; and declared at
// PHASE_SCHEMA.properties.sections_rederived. Drop any one of the three and
// lastRederived is [] every round — both detectors inert in production while
// these cases stay green.
// ===========================================================================
// T-A2e: T-22/T-23 execute runGate by extracting its SOURCE TEXT into new Function,
// so they pass over a workflow that cannot load at all (F-4c). Gate the extraction on
// the whole source compiling first — otherwise these cases are green on a dead module.
check('T-A2e the whole workflow compiles before runGate is extracted from it',
  parsesAsWorkflowBody(wfSrc));

function declOf(src, header) {
  const i = src.indexOf(header);
  if (i < 0) throw new Error(`not found: ${header}`);
  // Skip the PARAMETER list first: runGate destructures its argument, so the
  // first `{` after the header opens the parameter pattern, not the body.
  let p = 0, k = src.indexOf('(', i);
  for (; k < src.length; k++) {
    if (src[k] === '(') p++;
    else if (src[k] === ')' && --p === 0) break;
  }
  let depth = 0;
  for (let j = src.indexOf('{', k); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return src.slice(i, j + 1);
  }
  throw new Error(`unbalanced: ${header}`);
}
// parseLocation closes over the workflow's module-scope `const *_RE = /…/` grammar
// declarations, which declOf does not carry across. Inject them, EXTRACTED from the
// workflow rather than retyped, so the harness cannot drift from the grammar it tests.
const gateFns = new Function('parallel', [
  reDecls,                       // the workflow's own `const *_RE = /…/` lines (S3)
  'const ROUND_CAP = ' + /const ROUND_CAP = (\d+)/.exec(wfSrc)[1],
  'const LENSES = []',
  // The findings-shape guard's dependencies, EXTRACTED from the workflow rather
  // than retyped (T-RB, role-boundary correction): runGate now calls
  // findingShapeFault every round, so the lifted copy needs the real bounds.
  (wfSrc.match(/const FINDING_BOUNDS =[^\n]*/) || [''])[0],
  (wfSrc.match(/const FINDING_KEYS =[^\n]*/) || [''])[0],
  declOf(wfSrc, 'function findingShapeFault('),
  declOf(wfSrc, 'function parseLocation('),
  declOf(wfSrc, 'function detectCorrectionFailure('),
  declOf(wfSrc, 'function sweepDiscrepancy('),
  declOf(wfSrc, 'async function runGate('),
  'return { runGate, detectCorrectionFailure, parseLocation, sweepDiscrepancy, findingShapeFault }',
].join('\n'))(() => { throw new Error('multiLens not exercised'); });

// The stub sweeps carry the executable declaration the schema now requires
// (pattern/scope/sites_changed); sites_changed defaults to found, the honest
// fully-closed shape, so cases about the ROUND-LATE detectors stay about them.
const sweep = (searched, found) => ({ searched, pattern: searched, scope: 'artifact', found, sites_changed: found.slice() });
// The honest re-execution stub: the verifier reproduces exactly what each sweep
// declared. Cases that need a dishonest or broken verifier pass their own.
const echoSweeps = async (secs) => secs.map((s) => (s.class_sweep && s.class_sweep.found) || []);
// Drive runGate with a scripted sequence of reviewer verdicts and corrector returns.
async function driveGate(rounds, corrections, detect = true, sweepFn = echoSweeps) {
  let i = 0, k = 0;
  return gateFns.runGate({
    reviewFn: async () => rounds[Math.min(i++, rounds.length - 1)],
    remediateFn: async () => corrections[Math.min(k++, corrections.length - 1)],
    multiLens: false,
    detectFailedCorrection: detect,
    sweepVerifyFn: sweepFn,
  });
}
const F = (location, standard = 'ISO/IEC/IEEE 29148:2018 5.2.6') =>
  ({ verdict: 'NEEDS_FIXES', findings: [{ classification: 'Moderate', standard, location }] });

const t22 = [];
// Case 1 — fix-site regression, forward-derived from the observed A-3 R4→R5 shape:
// a finding landing INSIDE a re-derived section, at a line the original finding
// did not name. (A findings-to-findings comparison misses this: R4's finding
// located scratch-note.txt and R5's landed at spec lines 271-273.)
t22.push(await driveGate(
  [F('spec.md:271-273'), F('spec.md:273'), F('spec.md:9')],
  [{ status: 'completed', sections_rederived: [{ location: 'spec.md:265-280', class_sweep: sweep('scratch-file accounting', ['spec.md:265-280']) }] }]));
check('T-22 (a) a finding inside a re-derived range yields CORRECTION_FAILED/fix_site_regression',
  t22[0].verdict === 'CORRECTION_FAILED' && t22[0].kind === 'fix_site_regression');
check('T-22 (a) the escalation carries the offending finding and the prior section',
  !!(t22[0].detail && t22[0].detail.finding && t22[0].detail.prior));

// Case 2 — incomplete class sweep, forward-derived from the APS Fusion plan cycle:
// the named instance closes and the class is found again where the sweep looked
// and did not correct. Detector (a) would miss this — "elsewhere" is the defect.
t22.push(await driveGate(
  [F('plan.md:40'), F('plan.md:900'), F('plan.md:9')],
  [{ status: 'completed', sections_rederived: [{ location: 'plan.md:35-45', class_sweep: sweep('hand-maintained cross-reference tables', ['plan.md:35-45', 'plan.md:900', 'plan.md:1200']) }] }]));
check('T-22 (b) a finding at a swept-but-uncorrected location yields kind unclosed_class',
  t22[1].verdict === 'CORRECTION_FAILED' && t22[1].kind === 'unclosed_class');

// Case 3 — the FALSE POSITIVE the rebuild exists to prevent. Round 2 cites the
// SAME standard as round 1, at a location the sweep never found. A standard
// recurring where the sweep never looked is a NEW class, not an unclosed one;
// the rejected normalised-`standard` matching rule would have escalated here and
// stopped a converging gate.
t22.push(await driveGate(
  [F('plan.md:40'), F('plan.md:1700'), { verdict: 'PASS', findings: [] }],
  [{ status: 'completed', sections_rederived: [{ location: 'plan.md:35-45', class_sweep: sweep('hand-maintained cross-reference tables', ['plan.md:35-45', 'plan.md:900', 'plan.md:1200']) }] }]));
check('T-22 (c) a finding absent from class_sweep.found fires NEITHER detector',
  t22[2].verdict === 'PASS');

// Boundary value analysis on range overlap for detector (a).
const overlapCase = async (loc) => (await driveGate(
  [F('spec.md:271-273'), F(loc), { verdict: 'PASS', findings: [] }],
  [{ status: 'completed', sections_rederived: [{ location: 'spec.md:265-280', class_sweep: sweep('x', ['spec.md:265-280']) }] }])).verdict;
check('T-22 boundary: fully inside fires', (await overlapCase('spec.md:270-272')) === 'CORRECTION_FAILED');
check('T-22 boundary: partially overlapping fires', (await overlapCase('spec.md:278-290')) === 'CORRECTION_FAILED');
check('T-22 boundary: exactly adjacent (no overlap) does NOT fire', (await overlapCase('spec.md:281-290')) === 'PASS');
check('T-22 boundary: same range in a DIFFERENT file does NOT fire', (await overlapCase('other.md:270-272')) === 'PASS');
check('T-22 detectors are disabled at the implementation gate (D-2)',
  (await driveGate([F('spec.md:271-273'), F('spec.md:273'), { verdict: 'PASS', findings: [] }],
    [{ status: 'completed', sections_rederived: [{ location: 'spec.md:265-280', class_sweep: sweep('x', ['spec.md:265-280']) }] }],
    false)).verdict === 'PASS');

// ---- T-23: the corrector's halt reaches the owner --------------------------
// Equivalence partitioning on the returned `status`.
const halted = await driveGate([F('spec.md:10'), F('spec.md:99')],
  [{ status: 'halted', halt: { category: 'PREMISE-FALSE', detail: 'named standard not verifiable' } }]);
check('T-23 a halted correction yields verdict CORRECTOR_HALTED', halted.verdict === 'CORRECTOR_HALTED');
check('T-23 the returned object carries the corrector\'s halt payload — the owner is told WHY',
  !!(halted.halt && halted.halt.detail));
check('T-23 status "completed" does NOT produce CORRECTOR_HALTED',
  (await driveGate([F('spec.md:10'), { verdict: 'PASS', findings: [] }],
    [{ status: 'completed', sections_rederived: [] }])).verdict === 'PASS');
check('T-23 an absent status does NOT produce CORRECTOR_HALTED (malformed return, not a halt)',
  (await driveGate([F('spec.md:10'), { verdict: 'PASS', findings: [] }], [{}])).verdict === 'PASS');
// Caller wiring, statically: neither site may test the exact NON_CONVERGENCE
// string, or a new verdict falls through. At the spec gate the fall-through
// destination is the GATE.intent return — the owner told the spec passed review.
check('T-23 no caller tests the exact NON_CONVERGENCE string (fail-closed)',
  !/gate\.verdict === 'NON_CONVERGENCE'/.test(wfSrc) && !/gate\.verdict !== 'NON_CONVERGENCE'/.test(wfSrc));
check('T-23 both caller sites route non-PASS through the shared escalation builder',
  (wfSrc.match(/await gateEscalation\(/g) || []).length === 2 &&
  (wfSrc.match(/gate\.verdict !== 'PASS'/g) || []).length === 1 &&
  (wfSrc.match(/gate\.verdict === 'PASS'\) return null/g) || []).length === 1);
check('T-23 the escalation builder handles both new states',
  /gate\.verdict === 'CORRECTION_FAILED'/.test(wfSrc) && /gate\.verdict === 'CORRECTOR_HALTED'/.test(wfSrc));

// ---- T-24: ground-truth guard + scope-check are orchestrator predicates (0.3.0) ----
// Source-text assertions in the tier's established style: each names the property
// a mutation would have to remove, so deleting a predicate turns the tier red.
// They are text assertions, not refusal observations, because the workflow body
// is not importable and no execution harness for it exists; the refusal behavior
// itself was traced and mutation-probed in review (corrections-0.3.0 rounds 2-3).
check('T-24 gt-guard: spec must be owner-approved in the LEDGER index',
  /const specApproved = [^\n]*approved_by_owner === true/.test(wfSrc));
check('T-24 gt-guard: build-completeness reads the LATEST implementation verdict',
  wfSrc.includes("implGates[implGates.length - 1].verdict === 'PASS'"));
check('T-24 gt-guard: refusal predicate is the extracted pure function',
  wfSrc.includes('const gt = groundTruthPreconditions(ledger, delta, specPath)'));
check('T-24 every workflow outcome is complete or owner_gate (no terminal failed, reworded or not)',
  (() => { const outs = [...wfSrc.matchAll(/outcome:\s*'(\w+)'/g)].map((m) => m[1]); return outs.length > 0 && outs.every((o) => o === 'complete' || o === 'owner_gate'); })());
check('T-24 shared accumulator: the implement gate reads the registered set',
  wfSrc.includes('if (implementationArtifacts().length === 0) {'));
check('T-24 shared role predicate: hash pinning excludes implementation everywhere',
  wfSrc.includes("const isHashPinnedRole = (a) => a.role !== 'implementation'") && wfSrc.includes('isHashPinnedRole(a) && a.path !== artifactPath'));
check('T-24 gt-guard: implement phase PRODUCES role implementation artifacts',
  wfSrc.includes("delta.artifacts.push({ role: 'implementation', path: f })"));
check('T-24 scope-check: prior-artifact hashes are injected from the ledger index',
  wfSrc.includes('a.sha256 && isHashPinnedRole(a) && a.path !== artifactPath'));
check('T-24 scope-check: hash-mismatched upstream artifact is named a violation',
  wfSrc.includes('current hash DIFFERS from its recorded hash') && wfSrc.includes('unauthorized upstream edit'));
// T-24y: the under-coverage predicate EXECUTED (F6-1) - neutering it must turn
// this block red, which round 6's mutation MD showed the text pins alone cannot.
{
  // F7-3: verifierUnderCovered is an expression-bodied arrow on one line; declOf
  // is a brace-matching declaration extractor and over-captures past it. Extract
  // exactly the definition line instead.
  const vucLine = (wfSrc.match(/const verifierUnderCovered =[^\n]*/) || [''])[0];
  const vuc = new Function(vucLine + '\nreturn verifierUnderCovered;')();
  check('T-24y under-coverage: null return is under-covered', vuc(null, 1) === true);
  check('T-24y under-coverage: empty checks are under-covered', vuc({ checks: [] }, 1) === true);
  check('T-24y under-coverage: short return vs expected count is under-covered', vuc({ checks: [{}] }, 5) === true);
  check('T-24y under-coverage: exact expected count passes', vuc({ checks: [{}, {}, {}, {}, {}] }, 5) === false);
  check('T-24y under-coverage: expectedMin floors at 1 (0 or undefined never exempts)', vuc({ checks: [] }, 0) === true && vuc({ checks: [{}] }, undefined) === false);
}
check('T-24 scope-check: a missing artifact-sha256 entry escalates (fail-closed hash recording)',
  /if \(!hex\) \{/.test(wfSrc) && wfSrc.includes('did not return the required artifact-sha256 entry'));
// F7-1: the controls are pinned at their DEPLOYMENT, not only their definition -
// occurrence counts, the same pattern T-23 uses. Round 7's six surviving mutations
// (deleting individual call sites, reverting sample.length, flipping one
// control_fault, neutering the gt.ok branch) each turn one of these red.
check('T-24 deployment: verifierUnderCovered guards all four consumption sites',
  (wfSrc.match(/verifierUnderCovered\(/g) || []).length >= 4);
check('T-24 deployment: underCoveredVerifierGate raised at all four sites',
  (wfSrc.match(/underCoveredVerifierGate\(/g) || []).length >= 4);
check('T-24 deployment: the spot re-run expects its full sample count',
  wfSrc.includes('verifierUnderCovered(vr, sample.length)'));
check('T-24 deployment: both control gates carry GATE.control_fault',
  (wfSrc.match(/GATE\.control_fault/g) || []).length >= 2);
check('T-24 deployment: the ground-truth guard branches on the extracted predicate result',
  wfSrc.includes('if (!gt.ok) {'));
// F8-1 class closure: the comment's stated gate count must equal the GATE
// literal's member count, so the next amendment's propagation miss is a red
// test, not a review finding.
{
  // Round-10 foundational rework (tripwire-fired F9-1/F10-1 class): the pin no
  // longer lexes source text - it LIFTS the GATE literal and EVALUATES it, so
  // every member form JavaScript can express (bare/quoted/computed keys,
  // inline members, split lines, getters, methods, inline spreads) is counted
  // by the language itself, and anything that cannot evaluate in isolation
  // (an external-reference spread, a free identifier) throws -> fail closed.
  const gateBody = braced(wfSrc, wfSrc.indexOf('const GATE = {'));
  let memberCount = -1;
  try {
    const obj = new Function('"use strict"; return {' + gateBody + '};')();
    memberCount = Reflect.ownKeys(obj).length;
  } catch (e) { /* memberCount stays -1: unevaluable literal fails the check */ }
  const words = { six: 6, seven: 7, eight: 8, nine: 9 };
  const stated = /The (six|seven|eight|nine) owner-gate types/.exec(wfSrc);
  check('T-24 gate-count comment matches the evaluated GATE literal (fail-closed on unevaluable)',
    memberCount > 0 && !!stated && words[stated[1]] === memberCount);
}
check('T-24 control_fault gate type exists and the under-coverage gate uses it',
  wfSrc.includes("control_fault: 'control_fault'") && wfSrc.includes('type: GATE.control_fault'));

// T-24x: the ground-truth guard predicate EXECUTED against constructed ledger
// shapes - refusals observed, not just asserted as source text (F5-3, closed on
// its third recurrence by the same lift-and-run mechanism T-22/T-23 use).
{
  const gtp = new Function(declOf(wfSrc, 'function groundTruthPreconditions(') + '\nreturn groundTruthPreconditions;')();
  const spec = { role: 'spec', path: 'S.md', approved_by_owner: true };
  const impl = { role: 'implementation', path: 'x.js' };
  const passGate = { gate: 'implementation', verdict: 'PASS' };
  const failGate = { gate: 'implementation', verdict: 'NEEDS_FIXES' };
  const L = (arts, gates) => ({ artifact_index: arts, gate_history: gates });
  check('T-24x refuses when the spec is not owner-approved',
    gtp(L([{ ...spec, approved_by_owner: false }, impl], [passGate]), { artifacts: [], gate_history: [] }, 'S.md').ok === false);
  check('T-24x refuses when the LATEST implementation verdict is not PASS (earlier PASS does not count)',
    gtp(L([spec, impl], [passGate, failGate]), { artifacts: [], gate_history: [] }, 'S.md').ok === false);
  check('T-24x refuses when no implementation artifacts are registered',
    gtp(L([spec], [passGate]), { artifacts: [], gate_history: [] }, 'S.md').ok === false);
  check('T-24x proceeds when all three preconditions hold (same-segment artifacts count)',
    gtp(L([spec], [passGate]), { artifacts: [impl], gate_history: [] }, 'S.md').ok === true);
  check('T-24x refusal reason names the failed precondition',
    /owner-approved/.test(gtp(L([{ ...spec, approved_by_owner: false }], []), {}, 'S.md').why));
}
check('T-24 scope-check: each phase RECORDS its artifact hash via the verifier',
  wfSrc.includes("cited_claim === 'artifact-sha256'") && wfSrc.includes('mine.sha256 = hex[0]'));
check('T-24 scope-check: no time-based exemption in the scope rules (semantic, reword-resistant)',
  (() => { const i = wfSrc.indexOf('Document-phase scope check'); const region = wfSrc.slice(i, wfSrc.indexOf('`', i + 10)); return i > 0 && !/(mtime|last[- ]modified|modif\w*\s+(?:time|before|after)|timestamp)/i.test(region); })());

// ---- T-25: verbatim-request propagation (corrections-0.4.0, instruction-reinterpretation) ----
// The owner's request must exist as a schema-required, machine-propagated artifact
// (task_verbatim), be interpolated verbatim into the spec authoring AND review
// dispatches, fail closed when uncaptured, and be a reviewable section of the spec's
// output contract. Checks 1-3 pin the executable enforcement; 4-6 pin the prose
// carriers (presence — the only property a structural test can assert of prose).
{
  // (1) The schema is PARSED and its evaluated shape asserted — not lexed.
  const schema = JSON.parse(readFileSync(join(ROOT, 'scripts/ledger.schema.json'), 'utf8'));
  check('T-25 ledger schema: required includes task_verbatim',
    Array.isArray(schema.required) && schema.required.includes('task_verbatim'));
  check('T-25 ledger schema: task_verbatim is a non-empty string whose description says verbatim',
    !!(schema.properties && schema.properties.task_verbatim) &&
    schema.properties.task_verbatim.type === 'string' &&
    schema.properties.task_verbatim.minLength === 1 &&
    /verbatim/i.test(schema.properties.task_verbatim.description || ''));
  // The validator ENFORCES minLength (lift-and-run through the real exported
  // validate, same module the preflight executes): an empty capture is rejected.
  const { validate: vld } = await import('../../scripts/validate-ledger.mjs');
  const mini = { type: 'object', required: ['task_verbatim'], properties: { task_verbatim: schema.properties.task_verbatim } };
  check('T-25 validator rejects an empty task_verbatim (minLength enforced, executed)',
    vld({ task_verbatim: '' }, mini, mini, '$', []).length > 0 &&
    vld({ task_verbatim: 'x' }, mini, mini, '$', []).length === 0);
  // (2) Both spec-phase dispatches interpolate the verbatim anchor block.
  const anchorRe = /<<<OWNER_REQUEST\\n\$\{taskVerbatim\}\\nOWNER_REQUEST>>>/;
  const specAuthor = (/Write the specification for this task[^`]*/.exec(wfSrc) || [''])[0];
  const specReview = (/Review the spec at [^`]*/.exec(wfSrc) || [''])[0];
  check('T-25 spec authoring dispatch interpolates the verbatim anchor block', anchorRe.test(specAuthor));
  check('T-25 spec review dispatch interpolates the anchor and demands clause traceability',
    anchorRe.test(specReview) && /dropped, renamed, or narrowed clause is a finding/.test(specReview));
  check('T-25 intent gate presents the verbatim request to the owner',
    (() => { const i = wfSrc.indexOf('type: GATE.intent'); return i > 0 && anchorRe.test(wfSrc.slice(i, wfSrc.indexOf('} })', i))); })());
  // (3) Missing capture fails closed before the spec phase, as a control_fault.
  check('T-25 missing-verbatim intake halts via a control_fault gate (fail-closed, reachable from intake)',
    /if \(cursor === 'spec' && !taskVerbatim\)/.test(wfSrc) &&
    /GATE\.control_fault, what_happened: 'The owner\\'s request text was not captured into task_verbatim/.test(wfSrc));
  // (4) The spec output contract requires the Request traceability section.
  const specOut = rd('skills/expert-spec/SKILL.md');
  const outRegion = specOut.slice(specOut.indexOf('## Output'), specOut.indexOf('## What comes after'));
  check('T-25 expert-spec output contract requires a Request traceability section quoting the verbatim request',
    /## Request traceability/.test(outRegion) && /verbatim request in full/.test(outRegion) &&
    /dropped, renamed, or narrowed/.test(outRegion));
  // (5) The command's §0 carries the verbatim-capture step.
  const s0 = cmd.slice(cmd.indexOf('## 0.'), cmd.indexOf('## 1.'));
  check('T-25 command §0 captures the owner turn verbatim into task_verbatim',
    /task_verbatim/.test(s0) && /verbatim/.test(s0));
  check('T-25 command snapshot passes task_verbatim to the workflow',
    /task_verbatim/.test(cmd.slice(cmd.indexOf('## 3.'), cmd.indexOf('## 4.'))));
  // (6) expert-standard carries the fidelity clause and the sixth failure signal.
  const std = rd('skills/expert-standard/SKILL.md');
  check('T-25 expert-standard third shift carries the words-not-restatement fidelity clause',
    /acting on the owner's words, not on a restatement of them/.test(std));
  check('T-25 expert-standard carries the Reinterpreted requests failure signal',
    /\*\*Reinterpreted requests\.\*\*/.test(std));
}

// ---- T-26: implementation-completeness enforcement (corrections-0.4.0, premature-completion-claims) ----
// C2's predicate and C1's recorded-facts reader are lifted from the workflow
// source and EXECUTED against constructed cases (the T-24x mechanism) — the
// refusals are observed, never asserted as source text. Text pins cover only
// what cannot execute here: dispatch wording and deployment call sites.
{
  // Note: wfSrc was read before this tier's edits never touch it mid-run; re-read
  // is unnecessary. Lift the two pure predicates.
  const fns = new Function([
    declOf(wfSrc, 'function recordedPlanFacts('),
    declOf(wfSrc, 'function implementationCompleteness('),
    'return { recordedPlanFacts, implementationCompleteness }',
  ].join('\n'))();
  const { recordedPlanFacts: rpf, implementationCompleteness: icp } = fns;
  const STEPS = ['S1', 'S2', 'S3'];
  const evFor = (ids) => ids.map((s) => ({ claim_type: 'test', tool: 'Bash', citation: 'x', observed: 'y', asserted: 'z', step: s }));
  // (a) full step set + per-step evidence ⇒ pass.
  check('T-26 exec (a) full step set with per-step evidence passes',
    icp(STEPS, { status: 'completed', steps_completed: STEPS, evidence: evFor(STEPS) }).ok === true);
  // (b) one missing step ID ⇒ refuse, naming that ID.
  const b = icp(STEPS, { status: 'completed', steps_completed: ['S1', 'S3'], evidence: evFor(STEPS) });
  check('T-26 exec (b) a missing step ID refuses and names it',
    b.ok === false && b.kind === 'incomplete' && Array.isArray(b.missing_steps) && b.missing_steps.length === 1 && b.missing_steps[0] === 'S2');
  // (c) completed with empty evidence ⇒ refuse.
  const c = icp(STEPS, { status: 'completed', steps_completed: STEPS, evidence: [] });
  check('T-26 exec (c) completed with empty evidence refuses', c.ok === false && c.kind === 'incomplete');
  // (c2) a step with no evidence entry referencing it ⇒ refuse, naming it.
  const c2 = icp(STEPS, { status: 'completed', steps_completed: STEPS, evidence: evFor(['S1', 'S2']) });
  check('T-26 exec (c2) a completed step without an evidence[].step reference refuses and names it',
    c2.ok === false && c2.kind === 'incomplete' && c2.missing_steps.length === 1 && c2.missing_steps[0] === 'S3');
  // (d) halted partial return ⇒ no refusal (halts stay expressible).
  check('T-26 exec (d) a halted partial return is never refused',
    icp(STEPS, { status: 'halted', steps_completed: ['S1'], evidence: [] }).ok === true);
  // (e) no recorded step index ⇒ control_fault, never an open pass.
  const e = icp(null, { status: 'completed', steps_completed: STEPS, evidence: evFor(STEPS) });
  check('T-26 exec (e) a missing recorded step index is a control_fault (fail-closed)',
    e.ok === false && e.kind === 'control_fault');
  check('T-26 exec (e2) an EMPTY recorded step index is also a control_fault',
    icp([], { status: 'completed', evidence: [] }).kind === 'control_fault');
  // recordedPlanFacts: latest recorded plan entry wins; same-segment delta counts;
  // an index-less ledger yields null fields (the control_fault input to (e)).
  const planEntry = { role: 'plan', path: 'P.md', step_ids: STEPS, element_count: 7, files_count: 4 };
  check('T-26 exec recordedPlanFacts reads the recorded facts from the ledger index',
    rpf({ artifact_index: [planEntry] }, { artifacts: [] }, 'P.md').element_count === 7);
  check('T-26 exec recordedPlanFacts: a same-segment delta entry counts and the LATEST recorded entry wins',
    rpf({ artifact_index: [planEntry] }, { artifacts: [{ ...planEntry, element_count: 9 }] }, 'P.md').element_count === 9);
  check('T-26 exec recordedPlanFacts: no recorded index yields null step_ids (the fail-closed input)',
    rpf({ artifact_index: [{ role: 'plan', path: 'P.md' }] }, {}, 'P.md').step_ids === null);
  // C3 executed: the floor derived from a recorded element_count of 7 makes a
  // one-check verifier return under-covered (extends the T-24y vuc pins).
  const vucLine26 = (wfSrc.match(/const verifierUnderCovered =[^\n]*/) || [''])[0];
  const vuc26 = new Function(vucLine26 + '\nreturn verifierUnderCovered;')();
  const floor26 = Math.max(1, rpf({ artifact_index: [planEntry] }, {}, 'P.md').element_count | 0);
  check('T-26 exec C3 floor: one summary check against a recorded element_count of 7 is under-covered',
    floor26 === 7 && vuc26({ checks: [{}] }, floor26) === true);
  check('T-26 exec C3 floor: seven checks against the same floor pass',
    vuc26({ checks: [{}, {}, {}, {}, {}, {}, {}] }, floor26) === false);
  // Deployment pins: the gate is wired at the implement phase and both floors
  // derive from recorded facts, not the literal 1 (T-23/F7-1 pattern).
  check('T-26 deployment: the implement phase calls the completeness predicate on recorded step_ids',
    wfSrc.includes('const planFacts = recordedPlanFacts(ledger, delta, planPath)') &&
    wfSrc.includes('const compl = implementationCompleteness(planFacts.step_ids, impl)'));
  check('T-26 deployment: the completeness refusal branches carry control_fault and spec_traceable gates',
    /if \(compl\.kind === 'control_fault'\)/.test(wfSrc) && /Premature completion claim: \$\{compl\.reason\}/.test(wfSrc));
  check('T-26 deployment: diff-vs-plan floor derives from the recorded files count',
    wfSrc.includes('const filesFloor = Math.max(1, planFacts.files_count | 0)') &&
    wfSrc.includes('verifierUnderCovered(dvp, filesFloor)'));
  check('T-26 deployment: reconciliation floor derives from the recorded element count',
    wfSrc.includes('recordedPlanFacts(ledger, delta, planPath).element_count | 0') &&
    wfSrc.includes('verifierUnderCovered(recon, reconFloor)'));
  // C1 producer + consumer pins: the plan-phase scope check requests the step
  // index, records it, and fails closed when it cannot be parsed.
  check('T-26 C1: the plan-phase scope-check dispatch requests the plan-step-index record',
    wfSrc.includes('cited_claim exactly "plan-step-index"') &&
    wfSrc.includes('cited_claim exactly "plan-element-count"') &&
    wfSrc.includes('cited_claim exactly "plan-files-count"'));
  check('T-26 C1: the recorded facts land on the plan artifact entry',
    wfSrc.includes('mine.step_ids = stepIds') && wfSrc.includes('mine.element_count = elementCount') && wfSrc.includes('mine.files_count = filesCount'));
  check('T-26 C1: an unparseable plan-index record fails closed as control_fault',
    wfSrc.includes('did not return a parseable plan-step-index') &&
    (() => { const i = wfSrc.indexOf('did not return a parseable plan-step-index'); const region = wfSrc.slice(Math.max(0, i - 400), i); return /GATE\.control_fault/.test(region); })());
  // C4: the deferral scan is in the diff-vs-plan dispatch, added-lines-only,
  // with the marker alternation, and the verifier agent carries the same job.
  const dvpDispatch = (/Diff-vs-plan: compare git-changed files[^`]*/.exec(wfSrc) || [''])[0];
  check('T-26 C4: the diff-vs-plan dispatch carries the mechanical deferral scan on ADDED lines',
    /deferral scan/.test(dvpDispatch) && /ADDED lines only/.test(dvpDispatch) &&
    dvpDispatch.includes('TODO|FIXME|XXX|deferred|follow-up|later') &&
    /match is false UNLESS a step-decl/.test(dvpDispatch));
  check('T-26 C4: the verifier agent job 2 carries the deferral scan',
    (() => { const v = rd('agents/expert-verifier.md'); return /deferral scan/.test(v) && v.includes('TODO|FIXME|XXX|deferred|follow-up|later'); })());
  // C2 schema + C5 prose alignment.
  check('T-26 EVIDENCE schema carries the additive optional step field',
    /step: S_STR/.test((/const EVIDENCE = \{[\s\S]*?\n\}/.exec(wfSrc) || [''])[0]));
  check('T-26 C5: the implementer agent no longer carries the not-a-promise-to-populate caveat',
    !/not a promise to populate/.test(rd('agents/expert-implementer.md')));
  check('T-26 C5: the implementer agent states the mechanical completeness contract',
    /reconciles mechanically/.test(rd('agents/expert-implementer.md')) &&
    /premature completion claim/.test(rd('agents/expert-implementer.md')));
  check('T-26 C5: expert-implement SKILL final report notes the mechanical step reconciliation',
    /reconciled mechanically against the plan's declared step IDs/.test(rd('skills/expert-implement/SKILL.md')));
}

// ---- T-27: executable class sweep + same-round re-execution (corrections-0.4.0,
// patching-instead-of-rederivation) ----
// C1 pins the schema by LIFTING and EVALUATING the literal (never lexing source
// text); C2's predicate and runGate's same-round routing are EXECUTED via the
// T-22 lift; C3's union is executed against the lifted detectCorrectionFailure.
{
  // C1 schema pin — the evaluated PHASE_SCHEMA literal, with its real dependencies.
  const lit = (name) => `const ${name} = {` + braced(wfSrc, wfSrc.indexOf(`const ${name} = {`)) + '}';
  const PS = new Function('"use strict";\n' + [reDecls, lit('S_STR'), lit('LOCATION'), lit('EVIDENCE'), lit('PHASE_SCHEMA'), 'return PHASE_SCHEMA'].join('\n'))();
  const cs = PS.properties.sections_rederived.items.properties.class_sweep;
  check('T-27 schema: class_sweep.required includes pattern, scope, sites_changed (evaluated, not lexed)',
    Array.isArray(cs.required) && ['searched', 'found', 'pattern', 'scope', 'sites_changed'].every((f) => cs.required.includes(f)));
  check('T-27 schema: sites_changed is a string array and open_sites items require location + designation',
    cs.properties.sites_changed.type === 'array' &&
    cs.properties.open_sites.items.required.includes('location') && cs.properties.open_sites.items.required.includes('designation'));

  // T-sweep-a: a re-executed hit absent from the declared found is under-reporting.
  const sd = gateFns.sweepDiscrepancy;
  const entry = (csw) => ({ location: 'spec.md:10-20', class_sweep: csw });
  const a = sd(entry({ searched: 'x', pattern: 'x', scope: 'spec.md', found: ['spec.md:10-20'], sites_changed: ['spec.md:10-20'] }), ['spec.md:10-20', 'spec.md:400']);
  check('T-27 exec (a) a re-executed hit absent from found observes sweep_underreported naming the miss',
    !!a && a.kind === 'sweep_underreported' && a.missed.length === 1 && a.missed[0] === 'spec.md:400');
  // T-sweep-b: a found site neither changed nor designated is silently open; designated is not.
  const bCsw = { searched: 'x', pattern: 'x', scope: 'spec.md', found: ['spec.md:10-20', 'spec.md:400'], sites_changed: ['spec.md:10-20'] };
  const b = sd(entry(bCsw), ['spec.md:10-20', 'spec.md:400']);
  check('T-27 exec (b) a found site neither changed nor designated observes found_left_silently_open',
    !!b && b.kind === 'found_left_silently_open' && b.sites.length === 1 && b.sites[0] === 'spec.md:400');
  check('T-27 exec (b2) the same site with an escalation designation does not fire',
    sd(entry({ ...bCsw, open_sites: [{ location: 'spec.md:400', designation: 'escalated: hand-maintained surface' }] }), ['spec.md:10-20', 'spec.md:400']) === null);
  check('T-27 exec (b3) an EMPTY designation does not count as designated (fail-closed)',
    sd(entry({ ...bCsw, open_sites: [{ location: 'spec.md:400', designation: '  ' }] }), []).kind === 'found_left_silently_open');
  // T-sweep-c: an honest complete sweep observes no discrepancy.
  check('T-27 exec (c) an honest complete sweep observes null (no false positive)',
    sd(entry({ searched: 'x', pattern: 'x', scope: 'spec.md', found: ['spec.md:10-20'], sites_changed: ['spec.md:10-20'] }), ['spec.md:10-20']) === null);

  // T-sweep-d: lifted runGate with a verifier stub returning an extra hit fails
  // the gate in the SAME round (rounds === 1), not round + 1.
  const honest = [{ status: 'completed', sections_rederived: [{ location: 'spec.md:10-20', class_sweep: sweep('x', ['spec.md:10-20']) }] }];
  const d = await driveGate([F('spec.md:10'), F('spec.md:99')], honest,
    true, async (secs) => secs.map((s) => (s.class_sweep.found || []).concat(['spec.md:400'])));
  check('T-27 exec (d) an under-reported sweep yields CORRECTION_FAILED/sweep_underreported in the SAME round',
    d.verdict === 'CORRECTION_FAILED' && d.kind === 'sweep_underreported' && d.rounds === 1);
  check('T-27 exec (d2) the escalation detail carries the section and the independent hit set',
    !!(d.detail && d.detail.section && Array.isArray(d.detail.re_executed_hits)));
  // Honest verifier, honest sweep: the gate proceeds to the next round (no false positive).
  check('T-27 exec (c2) with an honest re-execution the gate proceeds and can PASS',
    (await driveGate([F('spec.md:10'), { verdict: 'PASS', findings: [] }], honest)).verdict === 'PASS');
  // Fail-closed: a re-execution channel that is missing or under-covered is a
  // failed control (SWEEP_UNVERIFIED), never a silently passed one.
  check('T-27 exec fail-closed: a missing re-execution channel yields SWEEP_UNVERIFIED',
    (await driveGate([F('spec.md:10'), F('spec.md:99')], honest, true, null)).verdict === 'SWEEP_UNVERIFIED');
  check('T-27 exec fail-closed: a short hit-set return yields SWEEP_UNVERIFIED',
    (await driveGate([F('spec.md:10'), F('spec.md:99')], honest, true, async () => [])).verdict === 'SWEEP_UNVERIFIED');

  // C3 executed: next-round unclosed_class membership is the UNION of the
  // declared found and the re-executed hits — a hit only the independent
  // execution saw still arms the detector.
  const c3 = gateFns.detectCorrectionFailure(
    [{ classification: 'Moderate', standard: 's', location: 'spec.md:400' }],
    [{ location: 'spec.md:10-20', class_sweep: { searched: 'x', pattern: 'x', scope: 'spec.md', found: ['spec.md:10-20'], sites_changed: ['spec.md:10-20'] }, re_executed_hits: ['spec.md:400'] }]);
  check('T-27 exec C3: a finding at a re-executed-only hit fires unclosed_class (union membership)',
    !!c3 && c3.kind === 'unclosed_class' && !!c3.detail.prior);

  // Contract-text pins: skill and agent name all five class_sweep fields.
  for (const f of ['searched', 'pattern', 'scope', 'found', 'sites_changed']) {
    check(`T-27 contract: expert-correct SKILL.md names class_sweep field ${f}`,
      new RegExp('`' + f + '`').test(rd('skills/expert-correct/SKILL.md')));
    check(`T-27 contract: expert-corrector agent names class_sweep field ${f}`,
      new RegExp('`' + f + '`').test(rd('agents/expert-corrector.md')));
  }
  // Deployment pins (the T-23/F7-1 pattern): the mechanism is wired, not just defined.
  check('T-27 deployment: all three document gates supply the re-execution channel',
    (wfSrc.match(/sweepVerifyFn: \(secs\) => reExecuteSweeps\(secs\)/g) || []).length === 3);
  check('T-27 deployment: runGate compares via the extracted pure predicate',
    wfSrc.includes('const disc = sweepDiscrepancy(rederived[i], reHits[i])'));
  check('T-27 deployment: the re-execution is dispatched to the verifier under label sweep-rerun',
    /agentType: AGENT\.verifier[^}]*label: 'sweep-rerun'/.test(wfSrc));
  check('T-27 deployment: re-executed hits ride on lastRederived for the next-round union',
    wfSrc.includes('re_executed_hits: reHits[i] || []'));
  check('T-27 deployment: both discrepancy kinds carry owner-facing escalation text',
    /sweep_underreported: /.test(wfSrc) && /found_left_silently_open: /.test(wfSrc));
  check('T-27 deployment: SWEEP_UNVERIFIED routes to a control_fault gate (fail-closed)',
    (() => { const i = wfSrc.indexOf("gate.verdict === 'SWEEP_UNVERIFIED'"); return i > 0 && /GATE\.control_fault/.test(wfSrc.slice(i, i + 700)); })());
  check('T-27 deployment: the verifier agent carries the sweep re-execution job',
    /Sweep re-execution/.test(rd('agents/expert-verifier.md')));
}

// ---- T-RB: findings-channel closure (corrections-0.4.0, role-boundary-violations) ----
// C1 is pinned by LIFTING and EVALUATING the VERDICT_SCHEMA literal (never
// lexing source text); C2's predicate is executed through the lifted runGate;
// C3's prose carriers are pinned by presence. The findings payload is the one
// channel crossing every review-loop role boundary — these checks pin it closed.
{
  const lit = (name) => `const ${name} = {` + braced(wfSrc, wfSrc.indexOf(`const ${name} = {`)) + '}';
  // T-RB1 — the evaluated schema literal, with its real dependencies.
  const rb = new Function('"use strict";\n' + [reDecls, lit('S_STR'), lit('LOCATION'), lit('FINDING_BOUNDS'), lit('VERDICT_SCHEMA'), 'return { VERDICT_SCHEMA, FINDING_BOUNDS }'].join('\n'))();
  const fi = rb.VERDICT_SCHEMA.properties.findings.items;
  const FB = rb.FINDING_BOUNDS;
  check('T-RB1 schema: findings items declare additionalProperties false (evaluated, not lexed)',
    fi.additionalProperties === false);
  const fiProps = Object.entries(fi.properties);
  check('T-RB1 schema: every findings-item property is a bounded string (maxLength on each)',
    fiProps.length > 0 && fiProps.every(([, v]) => v.type === 'string' && Number.isInteger(v.maxLength) && v.maxLength > 0));
  check('T-RB1 schema: bounds come from the shared FINDING_BOUNDS literal (one source, no drift)',
    fiProps.every(([k, v]) => v.maxLength === FB[k]) &&
    Object.keys(FB).sort().join() === fiProps.map(([k]) => k).sort().join());
  check('T-RB1 schema: location keeps its grammar pattern alongside its bound',
    typeof fi.properties.location.pattern === 'string' && new RegExp(fi.properties.location.pattern).test('spec.md:271-273'));

  // T-RB2 — the guard executed (lift-and-evaluate, the T-24x mechanism), then
  // its deployment: called in runGate BEFORE remediateFn, routed to control_fault.
  const fsf = gateFns.findingShapeFault;
  check('T-RB2 exec: a finding carrying a fix key faults (unknown_keys)',
    (fsf([{ classification: 'Moderate', standard: 's', location: 'a.md:1', fix: 'do X' }]) || {}).kind === 'unknown_keys');
  check('T-RB2 exec: an over-bound premise_evidence faults (field_over_bound)',
    (fsf([{ classification: 'Moderate', standard: 's', location: 'a.md:1', premise_evidence: 'x'.repeat(FB.premise_evidence + 1) }]) || {}).kind === 'field_over_bound');
  check('T-RB2 exec: a prescription marker inside premise_evidence faults',
    (fsf([{ classification: 'Moderate', standard: 's', location: 'a.md:1', premise_evidence: 'fix by replacing the guard with a stub' }]) || {}).kind === 'prescription_in_evidence');
  check('T-RB2 exec: a clean four-field finding passes (no false positive)',
    fsf([{ classification: 'Moderate', standard: 'ISO/IEC/IEEE 29148:2018 5.2.6', location: 'a.md:1', premise_evidence: 'verified by Read at a.md:1' }]) === null);
  check('T-RB2 exec: an empty findings array passes (a clean PASS round is not faulted)', fsf([]) === null);
  const rbGate = await driveGate(
    [{ verdict: 'NEEDS_FIXES', findings: [{ classification: 'Moderate', standard: 's', location: 'a.md:1', fix: 'patch it' }] }, F('a.md:2')],
    [{ status: 'completed', sections_rederived: [] }]);
  check('T-RB2 exec: runGate faults a contract-violating payload in the SAME round, before remediation',
    rbGate.verdict === 'FINDING_SHAPE_FAULT' && rbGate.rounds === 1 && rbGate.detail.kind === 'unknown_keys');
  const rg = declOf(wfSrc, 'async function runGate(');
  check('T-RB2 deployment: runGate calls findingShapeFault before remediateFn',
    rg.indexOf('findingShapeFault(findings)') > 0 &&
    rg.indexOf('findingShapeFault(findings)') < rg.indexOf('await remediateFn(findings, round)'));
  check('T-RB2 deployment: FINDING_SHAPE_FAULT routes to a control_fault gate (fail-closed)',
    (() => { const i = wfSrc.indexOf("gate.verdict === 'FINDING_SHAPE_FAULT'"); return i > 0 && /GATE\.control_fault/.test(wfSrc.slice(i, i + 900)); })());

  // T-RB3 — the rule stated where the roles read it. The reviewer's Write/Edit
  // denial is unchanged and already pinned by T-A2b above.
  check('T-RB3 reviewer agent: findings carry the no-prescription rule ("never the fix")',
    /never the fix/.test(rd('agents/expert-reviewer.md')));
  check('T-RB3 review skill: "what correct looks like" is scoped to the standard\'s requirement, not a patch instruction',
    /stated as the standard's requirement, never as a patch instruction/.test(rd('skills/expert-review/SKILL.md')));

  // T-RB4 — the command's persistence step tracks the schema, not a copy of it
  // (hand-maintained derived lists are the measured regression engine).
  check('T-RB4 command step 4: the hand-enumerated finding field list is gone',
    !cmd.includes('`classification`, `standard`, `location`, and `premise_evidence`'));
  check('T-RB4 command step 4: persistence references the workflow VERDICT_SCHEMA findings items',
    /every property named by the workflow's `VERDICT_SCHEMA` findings items/.test(cmd));
}

console.log(failures ? `\nSTRUCTURAL TESTS FAILED (${failures})` : '\nSTRUCTURAL TESTS PASSED');
process.exit(failures ? 1 : 0);
