#!/usr/bin/env node
// derive-plan-sections.mjs — generate and check a plan document's derived sections.
//
// A plan's step set (output section 7) is the single source of truth for three
// derived surfaces: the coverage reconciliation (section 2), the files-affected
// list (section 5), and the step<->test cross-references (section 12). Each step
// carries a fenced ```step-decl block; this script derives those surfaces from
// the declarations and writes them into marker-delimited regions:
//
//   <!-- generated:coverage begin -->  ...  <!-- generated:coverage end -->
//   <!-- generated:files begin -->     ...  <!-- generated:files end -->
//
// Usage:
//   node derive-plan-sections.mjs <plan.md>            regenerate regions in place
//   node derive-plan-sections.mjs --check <plan.md>    verify only; never writes;
//                                                      exit 1 if regions are stale
//                                                      or cross-references broken
//   node derive-plan-sections.mjs --self-check         validate the contract's own
//                                                      fenced examples, the checked-in
//                                                      fixture, and the embedded
//                                                      negative cases; exit 1 on any
//                                                      failure. This is the executable
//                                                      half of the contract's
//                                                      "move together" rule.
//   (flags are recognized at any argument position; unknown flags and extra
//    operands are errors, never ignored)
//
// The document also carries one fenced ```plan-elements block (in section 2)
// declaring the requested-work element vocabulary. At least one element is
// required — an empty vocabulary would disable the completeness check. Every
// element must be covered by at least one step, and every step's covers: entry
// must name a declared element.
//
// The step-decl grammar — a restricted key/inline-list grammar, NOT general
// YAML (block sequences, flow mappings, quoting, and comments are rejected).
// The example below is exactly what the parser accepts — no inline comments:
//
//   ```step-decl
//   step: S1
//   covers: [R-1, Q-3]
//   files:
//     create: [path/a.js]
//     modify: [path/b.md]
//     delete: []
//   tests: [T-1, T-2]
//   depends_on: [S0]
//   ```
//
// step: the unique step ID, S<number> optionally suffixed a-z. covers: element
// IDs from the plan-elements block. tests: test spec IDs from section 12
// verifying this step. depends_on: step IDs this step depends on.
//
// Every key is required and may appear only once; empty lists are written [].
// files: takes no inline value; all three sub-keys appear exactly once, [] when
// empty. List entries are single whitespace-free tokens and must not contain
// commas, brackets, braces, or quotes — the parser rejects them rather than
// guessing; duplicate entries within a list are rejected. A file path containing
// a comma or space therefore cannot be declared at all: the grammar forbids the
// characters rather than claiming to detect a comma-split path. No delivery-time
// check can catch a phantom path (there is no diff before implementation); the
// backstop is the contract's section-16 post-completion file-list
// reconciliation, git diff --stat vs section 5, in both directions.
//
// Fenced blocks may be indented (e.g. inside a numbered list item); the fence's
// leading whitespace is stripped from each content line, and a content line not
// carrying it is an error. The depends_on graph must be acyclic. Test specs are
// recognized by lines beginning `- **T-...` or headings `### T-...`, scanned
// only within the "Test specifications" section: the section is anchored by a
// heading whose text is exactly "Test specifications" (optionally numbered,
// e.g. "## 12. Test specifications") and ends at the next heading of the same
// or higher level that is not itself a test-spec heading.
//
// The generator is idempotent on both LF and CRLF documents: if the document
// contains any CRLF it emits regions with CRLF, otherwise LF.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function fail(msg) {
  process.stderr.write(`derive-plan-sections: ${msg}\n`);
  process.exit(1);
}

// ---------- core pipeline: parse, cross-check, derive — pure on its input ----------

function processDocument(text) {
  const errors = [];
  const eol = /\r\n/.test(text) ? '\r\n' : '\n';

  function extractBlocks(tag) {
    const re = new RegExp(`(?:^|\\r?\\n)([ \\t]*)\`\`\`${tag}[ \\t]*\\r?\\n([\\s\\S]*?)\\r?\\n[ \\t]*\`\`\``, 'g');
    const blocks = [];
    let bm;
    while ((bm = re.exec(text)) !== null) {
      const indent = bm[1];
      const line = text.slice(0, bm.index).split('\n').length;
      // J-3: every content line carries the fence's indentation; one that does
      // not is an error and is passed through as-is — since a line's
      // interpretation is keyed on its name, not its indentation (see the
      // step-decl parser), no reshaping is needed and the author gets exactly
      // one accurate error per bad line with no cascade.
      const content = bm[2]
        .split(/\r?\n/)
        .map((l) => {
          if (!indent || l.trim() === '') return l.trim() === '' ? '' : (indent && l.startsWith(indent) ? l.slice(indent.length) : l);
          if (!l.startsWith(indent)) {
            errors.push(`${tag} block at line ${line}: content line does not carry the fence's indentation: ${l.trim()}`);
            return l;
          }
          return l.slice(indent.length);
        })
        .join('\n');
      blocks.push({ raw: content, line });
    }
    return blocks;
  }

  function parseList(v, where) {
    const s = v.trim();
    if (s === '[]') return [];
    const inner = /^\[(.*)\]$/.exec(s);
    if (!inner) {
      errors.push(`${where}: value must be an inline list [a, b] or [], got: ${s}`);
      return [];
    }
    const items = inner[1].split(',').map((x) => x.trim());
    const dupSeen = new Set();
    for (const it of items) {
      if (it === '') {
        errors.push(`${where}: empty list entry (stray or trailing comma) in: ${s}`);
        return [];
      }
      if (/[\[\]{}"']/.test(it)) {
        errors.push(`${where}: entry '${it}' contains bracket/brace/quote characters — nested or quoted forms are not accepted`);
        return [];
      }
      if (/\s/.test(it)) {
        errors.push(`${where}: entry '${it}' contains whitespace — entries are single tokens`);
        return [];
      }
      if (dupSeen.has(it)) {
        errors.push(`${where}: duplicate entry '${it}' in: ${s}`);
        return [];
      }
      dupSeen.add(it);
    }
    return items;
  }

  // ----- plan-elements vocabulary -----
  const elementsBlocks = extractBlocks('plan-elements');
  if (elementsBlocks.length === 0) errors.push('no ```plan-elements block found — section 2 must declare the element vocabulary');
  if (elementsBlocks.length > 1) errors.push(`found ${elementsBlocks.length} plan-elements blocks — exactly one is allowed`);
  let elements = [];
  if (elementsBlocks.length === 1) {
    const raw = elementsBlocks[0].raw;
    const line = elementsBlocks[0].line;
    const m = /^elements:\s*(.*)$/m.exec(raw.trim());
    const extra = raw.trim().split(/\r?\n/).filter((l) => l.trim() !== '' && !/^elements:/.test(l));
    if (!m || extra.length > 0) {
      errors.push(`plan-elements block at line ${line}: must contain exactly one 'elements: [...]' line`);
    } else {
      const errsBefore = errors.length;
      elements = parseList(m[1], `plan-elements block at line ${line}`);
      if (errors.length === errsBefore && elements.length === 0) {
        errors.push(`plan-elements block at line ${line}: 'elements: []' is not allowed — a plan must declare at least one requested-work element`);
      }
    }
  }

  // ----- step declarations -----
  const decls = extractBlocks('step-decl');
  if (decls.length === 0) {
    errors.push('no ```step-decl blocks found — nothing to derive');
    return { errors, stale: [], updated: text, steps: [], elements, declaredTests: new Set() };
  }

  const steps = [];
  for (const d of decls) {
    const where = `step-decl at line ${d.line}`;
    const step = { id: null, covers: [], files: { create: [], modify: [], delete: [] }, tests: [], depends_on: [], line: d.line };
    const lines = d.raw.split(/\r?\n/);
    // N-1/N-2 class fix, ending the four-round adjacent-branch sequence
    // (J-3, K-4, L-3, N-1): a line's INTERPRETATION is decided by its key name
    // alone — create/modify/delete are reserved sub-key names, everything else
    // is top-level — and indentation is an orthogonal check that contributes
    // exactly one error per deviation without ever changing how the line is
    // parsed. Mis-indentation therefore cannot cascade into false unknown-key,
    // unparseable, or missing-key diagnostics.
    let filesInvalid = false;
    const seen = new Set();
    const seenSub = new Set();
    for (const ln of lines) {
      if (ln.trim() === '') continue;
      const t = ln.trim();
      const km = /^(\w+):\s*(.*)$/.exec(t);
      if (!km) {
        errors.push(`${where}: unparseable line: ${t}`);
        continue;
      }
      const [, key, val] = km;
      const indented = /^\s/.test(ln);
      if (key === 'create' || key === 'modify' || key === 'delete') {
        if (!seen.has('files')) errors.push(`${where}: files sub-key '${key}' appears before 'files:'`);
        if (!indented) errors.push(`${where}: files sub-key '${key}' must be indented under files:`);
        if (seenSub.has(key)) {
          errors.push(`${where}: duplicate files sub-key '${key}'`);
          continue;
        }
        seenSub.add(key);
        step.files[key] = parseList(val, where);
      } else {
        if (indented) errors.push(`${where}: key '${key}' must not be indented`);
        if (seen.has(key)) {
          errors.push(`${where}: duplicate key '${key}'`);
          continue;
        }
        seen.add(key);
        if (key === 'step') step.id = val.trim();
        else if (key === 'covers') step.covers = parseList(val, where);
        else if (key === 'tests') step.tests = parseList(val, where);
        else if (key === 'depends_on') step.depends_on = parseList(val, where);
        else if (key === 'files') {
          if (val.trim() !== '') {
            errors.push(`${where}: 'files:' takes no inline value (got '${val.trim()}') — use indented create:/modify:/delete: lines`);
            filesInvalid = true;
          } else {
            seenSub.clear();
          }
        } else errors.push(`${where}: unknown key '${key}'`);
      }
    }
    for (const req of ['step', 'covers', 'files', 'tests', 'depends_on']) {
      if (!seen.has(req)) errors.push(`${where}: missing required key '${req}'`);
    }
    if (seen.has('files') && !filesInvalid) {
      for (const sk of ['create', 'modify', 'delete']) {
        if (!seenSub.has(sk)) errors.push(`${where}: files: block missing sub-key '${sk}' (declare it explicitly, [] if empty)`);
      }
    }
    if (step.id && !/^S\d+[a-z]?$/.test(step.id)) {
      errors.push(`${where}: step ID '${step.id}' does not match S<number>[letter]`);
    }
    steps.push(step);
  }

  // ----- cross-checks -----
  const ids = new Map();
  for (const s of steps) {
    if (!s.id) continue;
    if (ids.has(s.id)) errors.push(`duplicate step ID ${s.id} (lines ${ids.get(s.id)} and ${s.line})`);
    else ids.set(s.id, s.line);
  }
  for (const s of steps) {
    for (const dep of s.depends_on) {
      if (!ids.has(dep)) errors.push(`step ${s.id} (line ${s.line}) depends on undeclared step ${dep}`);
    }
  }

  // acyclicity: iterative three-color DFS
  {
    const adj = new Map(steps.filter((s) => s.id).map((s) => [s.id, s.depends_on.filter((d) => ids.has(d))]));
    const color = new Map();
    for (const start of adj.keys()) {
      if (color.get(start)) continue;
      const stack = [[start, 0]];
      color.set(start, 1);
      while (stack.length > 0) {
        const frame = stack[stack.length - 1];
        const deps = adj.get(frame[0]);
        if (frame[1] < deps.length) {
          const next = deps[frame[1]++];
          if (color.get(next) === 1) {
            errors.push(`dependency cycle involving steps ${frame[0]} and ${next}`);
          } else if (!color.get(next)) {
            color.set(next, 1);
            stack.push([next, 0]);
          }
        } else {
          color.set(frame[0], 2);
          stack.pop();
        }
      }
    }
  }

  // element vocabulary vs coverage, both directions
  const elementSet = new Set(elements);
  const covered = new Set(steps.flatMap((s) => s.covers));
  for (const s of steps) {
    for (const el of s.covers) {
      if (elements.length > 0 && !elementSet.has(el)) errors.push(`step ${s.id} covers '${el}', which is not in the plan-elements vocabulary`);
    }
  }
  for (const el of elements) {
    if (!covered.has(el)) errors.push(`element ${el} is declared in plan-elements but no step covers it — unmapped requested work`);
  }

  // K-3: the Test specifications section is anchored by a heading whose text is
  // exactly "Test specifications" (optional leading number), not any heading
  // that merely contains the phrase.
  const secHeadRe = /^(#{1,4})\s+(?:\d+\.?\s*)?Test specifications\s*$/im;
  const secHead = secHeadRe.exec(text);
  const declaredTests = new Set();
  if (!secHead) {
    errors.push('no "Test specifications" heading found — section 12 is required for the step<->test cross-check');
  } else {
    // K-2: the section ends at the next heading of the same or higher level
    // that is NOT itself a test-spec heading (### T-...), so `### T-<id>` spec
    // headings never terminate the scan regardless of the section's own level.
    const level = secHead[1].length;
    const afterHead = secHead.index + secHead[0].length;
    const rest = text.slice(afterHead);
    const headRe = /^(#{1,4})\s+(.*)$/gm;
    let end = rest.length;
    let hm;
    while ((hm = headRe.exec(rest)) !== null) {
      if (hm[1].length <= level && !/^T-[A-Za-z0-9._-]+\b/.test(hm[2].trim())) {
        end = hm.index;
        break;
      }
    }
    const section = rest.slice(0, end);
    const testIdRe = /^(?:###\s+|\-\s+\*\*)(T-[A-Za-z0-9._-]+)/gm;
    let tm;
    while ((tm = testIdRe.exec(section)) !== null) declaredTests.add(tm[1]);
  }
  const referencedTests = new Set(steps.flatMap((s) => s.tests));
  for (const s of steps) {
    for (const t of s.tests) {
      if (!declaredTests.has(t)) errors.push(`step ${s.id} references test ${t}, which has no specification in the Test specifications section`);
    }
  }
  for (const t of declaredTests) {
    if (!referencedTests.has(t)) errors.push(`test ${t} is specified but no step references it — orphan spec or missing tests: entry`);
  }

  // ----- derive regions -----
  function deriveCoverage() {
    const byElement = new Map();
    for (const s of steps) {
      for (const el of s.covers) {
        if (!byElement.has(el)) byElement.set(el, []);
        byElement.get(el).push(s.id);
      }
    }
    const rows = [...byElement.entries()].sort(([a, ], [b, ]) => a.localeCompare(b, 'en', { numeric: true }));
    const out = ['| Requested element | Implementing step(s) |', '|---|---|'];
    for (const [el, sids] of rows) out.push(`| ${el} | ${sids.join(', ')} |`);
    return out.join(eol);
  }

  function deriveFiles() {
    const acc = { create: new Map(), modify: new Map(), delete: new Map() };
    for (const s of steps) {
      for (const kind of ['create', 'modify', 'delete']) {
        for (const p of s.files[kind]) {
          if (!acc[kind].has(p)) acc[kind].set(p, []);
          acc[kind].get(p).push(s.id);
        }
      }
    }
    const out = ['| File | Change | Step(s) |', '|---|---|---|'];
    const rows = [];
    for (const kind of ['create', 'modify', 'delete']) {
      for (const [p, sids] of acc[kind]) rows.push([p, kind, sids]);
    }
    rows.sort(([a, ], [b, ]) => a.localeCompare(b, 'en', { numeric: true }));
    for (const [p, kind, sids] of rows) out.push(`| ${p} | ${kind} | ${sids.join(', ')} |`);
    return out.join(eol);
  }

  const regions = { coverage: deriveCoverage(), files: deriveFiles() };
  let updated = text;
  const stale = [];
  for (const [name, body] of Object.entries(regions)) {
    const beginCount = updated.split(`<!-- generated:${name} begin -->`).length - 1;
    const endCount = updated.split(`<!-- generated:${name} end -->`).length - 1;
    if (beginCount === 0 || endCount === 0) {
      errors.push(`missing region markers for '${name}' (<!-- generated:${name} begin/end -->)`);
      continue;
    }
    if (beginCount > 1 || endCount > 1) {
      errors.push(`marker '${name}' occurs ${Math.max(beginCount, endCount)} times — each generated region must appear exactly once`);
      continue;
    }
    const re = new RegExp(`(<!-- generated:${name} begin -->)\\r?\\n[\\s\\S]*?(<!-- generated:${name} end -->)`);
    if (!re.test(updated)) {
      errors.push(`region '${name}': markers present but not in processable form — begin marker must end its line, end marker must follow on a later line`);
      continue;
    }
    const next = updated.replace(re, (_, a, b) => a + eol + body + eol + b);
    if (next !== updated) stale.push(name);
    updated = next;
  }

  return { errors, stale, updated, steps, elements, declaredTests };
}

// ---------- self-check: the executable half of the move-together rule ----------

function selfCheck() {
  const here = dirname(fileURLToPath(import.meta.url));
  const failures = [];
  const passes = [];

  // 1. The contract's own fenced examples, extracted verbatim and composed
  //    into a scaffold, must regenerate and check clean.
  const contractPath = join(here, '..', 'references', 'output-contract.md');
  let contract;
  try {
    contract = readFileSync(contractPath, 'utf8');
  } catch (e) {
    fail(`--self-check: cannot read the contract at ${contractPath}: ${e.message}`);
  }
  const declEx = /([ \t]*)```step-decl\r?\n([\s\S]*?)```/.exec(contract);
  const elEx = /([ \t]*)```plan-elements\r?\n([\s\S]*?)```/.exec(contract);
  if (!declEx) failures.push('contract contains no fenced step-decl example');
  if (!elEx) failures.push('contract contains no fenced plan-elements example');
  if (declEx && elEx) {
    // L-4: the scaffold's stub steps are DERIVED from the examples, never
    // hardcoded — a self-consistent rename of the contract's example IDs must
    // keep passing, and a diagnostic must never name an ID the contract does
    // not contain. Stubs are created for each depends_on target and cover
    // whatever vocabulary elements the example leaves uncovered.
    const dedent = (ind, s) => s.split(/\r?\n/).map((l) => (ind && l.startsWith(ind) ? l.slice(ind.length) : l)).join('\n');
    const exDecl = dedent(declEx[1], declEx[2]);
    const exCovers = (/^covers:\s*\[(.*)\]/m.exec(exDecl)?.[1] || '').split(',').map((x) => x.trim()).filter(Boolean);
    const exTests = (/^tests:\s*\[(.*)\]/m.exec(exDecl)?.[1] || '').split(',').map((x) => x.trim()).filter(Boolean);
    const exDeps = (/^depends_on:\s*\[(.*)\]/m.exec(exDecl)?.[1] || '').split(',').map((x) => x.trim()).filter(Boolean);
    const vocab = (/^elements:\s*\[(.*)\]/m.exec(dedent(elEx[1], elEx[2]))?.[1] || '').split(',').map((x) => x.trim()).filter(Boolean);
    const uncovered = vocab.filter((el) => !exCovers.includes(el));
    const stubTest = exTests[0] || 'T-1';
    const stubIds = exDeps.length > 0 ? exDeps : (uncovered.length > 0 ? ['S0'] : []);
    const stubs = stubIds.flatMap((id, i) => [
      '```step-decl', `step: ${id}`,
      `covers: [${(i === 0 && uncovered.length > 0 ? uncovered : [exCovers[0] || vocab[0]]).join(', ')}]`,
      'files:', '  create: []', '  modify: []', '  delete: []',
      `tests: [${stubTest}]`, 'depends_on: []', '```',
    ]);
    const allTests = [...new Set([...exTests, stubTest])];
    const scaffold = [
      '# self-check scaffold', '## 2',
      `${elEx[1]}\`\`\`plan-elements`, `${elEx[2].replace(/\r?\n$/, '')}`, `${elEx[1]}\`\`\``,
      '<!-- generated:coverage begin -->', '<!-- generated:coverage end -->',
      '## 5',
      '<!-- generated:files begin -->', '<!-- generated:files end -->',
      '## 7',
      ...stubs,
      `${declEx[1]}\`\`\`step-decl`, `${declEx[2].replace(/\r?\n$/, '')}`, `${declEx[1]}\`\`\``,
      '## 12. Test specifications',
      ...allTests.map((t) => `- **${t}** — placeholder spec for the scaffold.`), ''
    ].join('\n');
    const r1 = processDocument(scaffold);
    if (r1.errors.length > 0) failures.push(`contract examples do not parse clean: ${r1.errors[0]} (${r1.errors.length} error(s))`);
    else {
      const r2 = processDocument(r1.updated);
      if (r2.errors.length > 0 || r2.stale.length > 0) failures.push('contract-example scaffold is not a regeneration fixed point');
      else passes.push('contract examples parse, cross-check, and reach a fixed point');
    }
  }

  // 2. The checked-in fixture must check clean as committed.
  const fixturePath = join(here, 'fixtures', 'valid-plan.md');
  try {
    const fx = readFileSync(fixturePath, 'utf8');
    const r = processDocument(fx);
    if (r.errors.length > 0) failures.push(`fixture ${fixturePath}: ${r.errors[0]} (${r.errors.length} error(s))`);
    else if (r.stale.length > 0) failures.push(`fixture ${fixturePath}: generated regions are stale (${r.stale.join(', ')})`);
    else passes.push(`fixture valid-plan.md checks clean (${r.steps.length} steps, ${r.elements.length} elements, ${r.declaredTests.size} specs)`);
  } catch (e) {
    failures.push(`cannot read fixture ${fixturePath}: ${e.message}`);
  }

  // 3. Negative cases: every constraint the contract states must demonstrably
  //    reject its violating input. Each case is a mutation of a minimal valid
  //    document; the expected error substring is asserted.
  const base = (decl, elements = 'elements: [R-1]') => [
    '# t', '## 2', '```plan-elements', elements, '```',
    '<!-- generated:coverage begin -->', '<!-- generated:coverage end -->',
    '## 5', '<!-- generated:files begin -->', '<!-- generated:files end -->',
    '## 7', '```step-decl', ...decl, '```',
    '## 12. Test specifications', '- **T-1** — x.', ''
  ].join('\n');
  const VALID = ['step: S1', 'covers: [R-1]', 'files:', '  create: []', '  modify: []', '  delete: []', 'tests: [T-1]', 'depends_on: []'];
  const mut = (i, v) => { const d = [...VALID]; if (v === null) d.splice(i, 1); else d[i] = v; return d; };
  const cases = [
    ['inline files value', base(mut(2, 'files: {create: [a.js]}').filter((_, ix) => ix < 3 || ix > 5)), "'files:' takes no inline value"],
    ['duplicate key', base([...VALID, 'covers: [R-1]']), "duplicate key 'covers'"],
    ['missing sub-key', base(mut(5, null)), "missing sub-key 'delete'"],
    ['whitespace entry', base(mut(3, '  create: [a b.js]')), 'contains whitespace'],
    ['duplicate entry', base(mut(1, 'covers: [R-1, R-1]')), "duplicate entry 'R-1'"],
    ['empty vocabulary', base(VALID, 'elements: []'), "'elements: []' is not allowed"],
    ['uncovered element', base(VALID, 'elements: [R-1, R-9]'), 'no step covers it'],
    ['undeclared element', base(mut(1, 'covers: [R-1, R-8]')), 'not in the plan-elements vocabulary'],
    ['self-dependency', base(mut(7, 'depends_on: [S1]')), 'dependency cycle'],
    ['undeclared test', base(mut(6, 'tests: [T-7]')), 'has no specification'],
    ['orphan spec', base(VALID).replace('- **T-1** — x.', '- **T-1** — x.\n- **T-2** — orphan.'), 'no step references it'],
    ['marker trailing space', base(VALID).replace('<!-- generated:files begin -->', '<!-- generated:files begin --> '), 'not in processable form'],
    ['bad step id', base(mut(0, 'step: X1')), 'does not match'],
    // M-1: the fence-indentation constraint produced a defect in three
    // consecutive rounds (J-3, K-4, L-3) with no guard — an indented fence
    // with one un-indented content line must error, and with exactly one
    // error for that line (the L-3 no-cascade property).
    ['un-indented line in indented fence',
      base(VALID).replace('```step-decl\n' + VALID.join('\n') + '\n```',
        '1. item\n\n    ```step-decl\n' + VALID.map((l, i) => (i === 1 ? l : '    ' + l)).join('\n') + '\n    ```'),
      "does not carry the fence's indentation", 1],
    // N-1: the sub-key branch gets its own guards, both fence forms, each with
    // the exact-count no-cascade assertion.
    ['un-indented sub-key at column-0 fence', base(mut(5, 'delete: []')), "must be indented under files:", 1],
    ['de-indented sub-key in indented fence',
      base(VALID).replace('```step-decl\n' + VALID.join('\n') + '\n```',
        '1. item\n\n    ```step-decl\n' + VALID.map((l, i) => (i === 5 ? '   ' + l.trim() : '    ' + l)).join('\n') + '\n    ```'),
      "does not carry the fence's indentation", 1],
    // N-2: an indented top-level key errors once, without clearing files
    // context or cascading.
    ['indented top-level key', base(mut(7, '  depends_on: []')), "must not be indented", 1],
  ];
  for (const [name, doc, expect, exactCount] of cases) {
    const r = processDocument(doc);
    if (!r.errors.some((e) => e.includes(expect))) {
      failures.push(`negative case '${name}' did NOT produce the expected error ('${expect}'); got: ${r.errors[0] || 'no errors'}`);
    } else if (exactCount !== undefined && r.errors.length !== exactCount) {
      failures.push(`negative case '${name}' produced ${r.errors.length} errors, expected exactly ${exactCount} (no-cascade property): ${r.errors.join(' | ')}`);
    } else {
      passes.push(`negative: ${name} rejected`);
    }
  }

  for (const p of passes) process.stdout.write(`ok: ${p}\n`);
  for (const f of failures) process.stderr.write(`SELF-CHECK FAIL: ${f}\n`);
  if (failures.length > 0) process.exit(1);
  process.stdout.write(`self-check passed: ${passes.length} checks\n`);
}

// ---------- main ----------

let checkMode = false;
let selfCheckMode = false;
const operands = [];
for (const a of process.argv.slice(2)) {
  if (a === '--check') checkMode = true;
  else if (a === '--self-check') selfCheckMode = true;
  else if (a.startsWith('-')) fail(`unknown flag '${a}' — only --check and --self-check are accepted`);
  else operands.push(a);
}

if (selfCheckMode) {
  if (checkMode || operands.length > 0) fail('--self-check takes no other flags or operands');
  selfCheck();
} else {
  if (operands.length !== 1) fail('usage: derive-plan-sections.mjs [--check] <plan.md> | --self-check');
  const planPath = operands[0];
  let text;
  try {
    text = readFileSync(planPath, 'utf8');
  } catch (e) {
    fail(`cannot read ${planPath}: ${e.message}`);
  }
  const { errors, stale, updated, steps, elements, declaredTests } = processDocument(text);
  if (errors.length > 0) {
    for (const e of errors) process.stderr.write(`ERROR: ${e}\n`);
    process.exit(1);
  }
  if (checkMode) {
    if (stale.length > 0) {
      process.stderr.write(`STALE: regions out of date: ${stale.join(', ')} — run without --check to regenerate\n`);
      process.exit(1);
    }
    process.stdout.write(`OK: ${steps.length} steps, ${elements.length} elements, ${declaredTests.size} test specs, regions current\n`);
  } else {
    if (stale.length > 0) {
      writeFileSync(planPath, updated);
      process.stdout.write(`regenerated: ${stale.join(', ')} (${steps.length} steps)\n`);
    } else {
      process.stdout.write(`no changes: regions already current (${steps.length} steps)\n`);
    }
  }
}
