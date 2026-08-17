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
  declOf(wfSrc, 'function parseLocation('),
  declOf(wfSrc, 'function detectCorrectionFailure('),
  declOf(wfSrc, 'async function runGate('),
  'return { runGate, detectCorrectionFailure, parseLocation }',
].join('\n'))(() => { throw new Error('multiLens not exercised'); });

const sweep = (searched, found) => ({ searched, found });
// Drive runGate with a scripted sequence of reviewer verdicts and corrector returns.
async function driveGate(rounds, corrections, detect = true) {
  let i = 0, k = 0;
  return gateFns.runGate({
    reviewFn: async () => rounds[Math.min(i++, rounds.length - 1)],
    remediateFn: async () => corrections[Math.min(k++, corrections.length - 1)],
    multiLens: false,
    detectFailedCorrection: detect,
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
  const vuc = new Function('const Math_ = Math;' + declOf(wfSrc, 'const verifierUnderCovered =').replace('Math.max', 'Math_.max') + '\nreturn verifierUnderCovered;')();
  check('T-24y under-coverage: null return is under-covered', vuc(null, 1) === true);
  check('T-24y under-coverage: empty checks are under-covered', vuc({ checks: [] }, 1) === true);
  check('T-24y under-coverage: short return vs expected count is under-covered', vuc({ checks: [{}] }, 5) === true);
  check('T-24y under-coverage: exact expected count passes', vuc({ checks: [{}, {}, {}, {}, {}] }, 5) === false);
  check('T-24y under-coverage: expectedMin floors at 1 (0 or undefined never exempts)', vuc({ checks: [] }, 0) === true && vuc({ checks: [{}] }, undefined) === false);
}
check('T-24 scope-check: a missing artifact-sha256 entry escalates (fail-closed hash recording)',
  /if \(!hex\) \{/.test(wfSrc) && wfSrc.includes('did not return the required artifact-sha256 entry'));
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

console.log(failures ? `\nSTRUCTURAL TESTS FAILED (${failures})` : '\nSTRUCTURAL TESTS PASSED');
process.exit(failures ? 1 : 0);
