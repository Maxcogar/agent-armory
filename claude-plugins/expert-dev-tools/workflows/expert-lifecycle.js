export const meta = {
  name: 'expert-lifecycle',
  description:
    'Gated spec->architecture->plan->implement->review lifecycle for expert-dev-tools: dispatches typed Expert-phase agents, operates review-loop gates to a binary PASS, enforces anti-fabrication spot-checks, diagnosis-before-routing, and repeat-complaint detection, and halts at owner gates. Invoked once per segment by the /expert command; every return is a SEGMENT_REPORT.',
  phases: [
    { title: 'Feedback sweep' },
    { title: 'Spec' },
    { title: 'Architecture' },
    { title: 'Plan' },
    { title: 'Implement' },
    { title: 'Review' },
    { title: 'Verify' },
    { title: 'Ground truth' },
    { title: 'Closeout' },
  ],
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const NS = 'expert-dev-tools:'
const AGENT = {
  spec: NS + 'expert-spec-writer',
  architect: NS + 'expert-architect',
  planner: NS + 'expert-planner',
  implementer: NS + 'expert-implementer',
  reviewer: NS + 'expert-reviewer',
  verifier: NS + 'expert-verifier',
  acceptance: NS + 'expert-acceptance',
  diagnostician: NS + 'expert-diagnostician',
  closeout: NS + 'expert-closeout',
  corrector: NS + 'expert-corrector',
}
const ROUND_CAP = 5
// The standards each artifact type is judged against. The reviewer names a standard per
// finding (skills/expert-review/SKILL.md @ `names the standard it was evaluated against`);
// leaving the choice open let three of five spec
// reviewers grade against expert-spec/SKILL.md's process clauses instead — an unbounded
// ruler that varies per round. See docs/investigate.md 5a, 5b.
const RULER = {
  spec: 'ISO/IEC/IEEE 29148:2018 requirement characteristics (Complete, Consistent, ' +
        'Unambiguous, Verifiable, Traceable) and the standards the spec itself names',
  architecture: "the spec's requirements and the standards the architecture itself names",
  plan: "the spec, the architecture, and the plan's own output contract",
  implementation: 'the plan, and the named external standards each changed file is subject to',
}
// Each artifact's own output contract, cited by literal path (S9). The reviewer checks the
// artifact against this contract's required STRUCTURE — distinct from RULER, which judges
// content. The implementation gate has no entry: a diff has no output contract distinct from
// the plan authorising it, and RULER.implementation already binds that gate (Q-21).
const OUTPUT_CONTRACT = {
  spec: 'skills/expert-spec/SKILL.md, the "## Output" section',
  architecture: 'skills/expert-architecture/SKILL.md, the "Output contract" block at line 66 ' +
                '(that file carries no markdown headings, so it is cited by line)',
  plan: 'skills/expert-plan/references/output-contract.md (the whole file)',
}
// Carried in every review dispatch: the authoring skill is not the ruler.
const NOT_THE_RULER =
  "The authoring skill's process rules are not the standard — judge the artifact, not the " +
  'process that produced it.'
const LENSES = ['correctness', 'security', 'faithfulness-to-plan']
// The seven owner-gate types — exactly the spec 3.4 escalation list (amended
// 2026-08-19, owner decision F7-2: control_fault added); the script has no
// other path to the owner.
const GATE = {
  intent: 'intent',
  spec_traceable: 'spec_traceable',
  business: 'business',
  risk_override: 'risk_override',
  non_convergence: 'non_convergence',
  core_approval: 'core_approval',
  // A mechanical control could not run or returned nothing - the phase is
  // UNVERIFIED (not failed, not non-convergent); re-run is the usual answer.
  control_fault: 'control_fault',
}

// ---------------------------------------------------------------------------
// Schemas (kept to the load-bearing fields per architecture C4)
// ---------------------------------------------------------------------------
const S_STR = { type: 'string' }
// A finding's (or a re-derived section's) location. Exactly these forms parse:
// `path:start-end` (a line range; `path:line` is the one-line case) or
// `path#section`. runGate's fix-site-regression detector parses the range and its
// unclosed-class detector tests set membership, so a free-form location silently
// disables both.
const LOCATION_RE = /^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$/
const LOCATION = { type: 'string', pattern: LOCATION_RE.source }
const EVIDENCE = {
  type: 'array',
  items: {
    type: 'object',
    // `observed` and `asserted` are split out of the former single free-form
    // `result`, which is retained. A fabrication now has to sit in a named
    // field — the verbatim tool output, or the claimed outcome — rather than
    // hiding in prose that conflates the two.
    // Additive in properties: `result` is retained but is no longer required —
    // in the required set it is replaced by the two fields it was conflating.
    required: ['claim_type', 'tool', 'citation', 'observed', 'asserted'],
    properties: {
      claim_type: S_STR,
      tool: S_STR,
      citation: S_STR,
      subject: S_STR,   // what the entry is about; entries sharing it must agree
      observed: S_STR,  // VERBATIM tool output, quoted, not summarized
      asserted: S_STR,  // the outcome claimed from that output
      result: S_STR,
      // The plan step ID (S<number>) this entry verifies. Additive and optional
      // at the schema so halted partial returns stay expressible; a COMPLETED
      // implementation return is held to it by implementationCompleteness, the
      // predicate, not the schema (premature-completion correction, 0.4.0).
      step: S_STR,
    },
  },
}
const PHASE_SCHEMA = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string', enum: ['completed', 'halted'] },
    artifact_path: S_STR,
    // What a correction re-derived, and the class sweep behind each entry. The
    // corrector is obliged to emit this by skills/expert-correct/SKILL.md and by
    // agents/expert-corrector.md; runGate's two detectors are inert without it.
    sections_rederived: {
      type: 'array',
      items: {
        type: 'object',
        required: ['location', 'class_sweep'],
        properties: {
          location: LOCATION,
          source: S_STR,
          finding_addressed: S_STR,
          class_sweep: {
            type: 'object',
            required: ['searched', 'found', 'pattern', 'scope', 'sites_changed'],
            properties: {
              searched: S_STR,                        // what the sweep searched for
              // The executable half (patching-instead-of-rederivation correction
              // C1): the sweep is a reproducible computation, not an honesty
              // claim. runGate re-executes `pattern` over `scope` through the
              // verifier in the SAME round; executing it must reproduce `found`.
              pattern: S_STR,                         // the executable regex the sweep ran (Grep syntax)
              scope: S_STR,                           // the file or glob it ran over (normally the artifact)
              found: { type: 'array', items: S_STR }, // every location the search returned
              sites_changed: { type: 'array', items: S_STR }, // the found locations actually edited (subset of found)
              // A found entry outside sites_changed is either escalated (the
              // skill's hand-maintained-surface path) or explicitly open — named
              // here with its designation. Silence fails the gate (sweepDiscrepancy).
              open_sites: {
                type: 'array',
                items: { type: 'object', required: ['location', 'designation'], properties: { location: S_STR, designation: S_STR } },
              },
            },
          },
        },
      },
    },
    evidence: EVIDENCE,
    halt: {
      type: 'object',
      properties: {
        category: S_STR, // HARD-RULE-CONFLICT | PREMISE-FALSE | BLAST-RADIUS-EXCEEDS-PLAN | ENVIRONMENT-BLOCKED | SPEC-TRACEABLE | BUSINESS
        detail: S_STR,
        options: { type: 'array', items: S_STR },
        recommendation: S_STR,
      },
    },
  },
}
const IMPLEMENT_SCHEMA = {
  type: 'object',
  // skill-activation-missed C1 (0.4.0): skill_activation is REQUIRED — the one
  // observable trace prose imitation cannot produce is the Skill tool result.
  // Presence is held by the schema; authenticity by skillActivationFault.
  required: ['status', 'skill_activation'],
  properties: {
    status: { type: 'string', enum: ['completed', 'halted'] },
    // The verbatim launch line ("Launching skill" prefix) of the actual Skill
    // tool result for the packaged expert-implement skill — or, if the call
    // errored, its literal error text. Never a recitation.
    skill_activation: S_STR,
    steps_completed: { type: 'array', items: S_STR },
    files_changed: { type: 'array', items: S_STR },
    evidence: EVIDENCE,
    stop_report: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['HARD-RULE-CONFLICT', 'PREMISE-FALSE', 'BLAST-RADIUS-EXCEEDS-PLAN', 'ENVIRONMENT-BLOCKED'] },
        step: S_STR,
        asserted: S_STR,
        observed: S_STR,
        recommendation: S_STR,
      },
    },
  },
}
// skill-activation-missed C1 (0.4.0): appended to EVERY implementer dispatch
// prompt. The measured defect was activation-by-announcement — the Step-0 prose
// recited without the Skill call ever happening — so the requirement demands the
// one artifact recitation cannot fake: the tool result's own launch line.
const IMPLEMENT_ACTIVATION_REQ = 'Your FIRST action is invoking Skill(expert-dev-tools:expert-implement) — the actual tool call, not a recitation of the skill from memory. Return skill_activation carrying the "Launching skill:" line of that Skill tool result VERBATIM; if the call errored, skill_activation carries the literal error text and you halt with an ENVIRONMENT-BLOCKED stop report — never reconstruct the skill from memory or from file reads.'
// Findings-channel bounds (role-boundary correction C1). The findings payload is
// the one channel that crosses every review-loop role boundary — reviewer ->
// orchestrator -> corrector dispatch -> persisted review record — so its items
// are CLOSED: additionalProperties false and a maxLength on every string field.
// A fix prescription physically does not fit, and a `fix`/`recommendation` field
// is rejected at validation. One literal feeds both the schema below and the
// runtime guard findingShapeFault, so the two cannot drift apart.
const FINDING_BOUNDS = { classification: 40, standard: 300, premise_evidence: 700, location: 200 }
const FINDING_KEYS = Object.keys(FINDING_BOUNDS)
// Heuristic tripwire for prescriptions riding inside premise_evidence — not the
// primary control (the C1 sizing is); it catches the phrasing the measured
// defect actually used.
const PRESCRIPTION_RE = /\b(fix by|should (change|be changed)|replace .* with|instead use|recommended fix)\b/i
const VERDICT_SCHEMA = {
  type: 'object',
  required: ['verdict'],
  properties: {
    verdict: { type: 'string', enum: ['PASS', 'NEEDS_FIXES'] },
    round: { type: 'integer' },
    lens: S_STR,
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['classification', 'standard', 'location'],
        additionalProperties: false,
        properties: {
          classification: { type: 'string', maxLength: FINDING_BOUNDS.classification },
          standard: { type: 'string', maxLength: FINDING_BOUNDS.standard },
          premise_evidence: { type: 'string', maxLength: FINDING_BOUNDS.premise_evidence },
          location: Object.assign({}, LOCATION, { maxLength: FINDING_BOUNDS.location }),
        },
      },
    },
  },
}
const VERIFIER_SCHEMA = {
  type: 'object',
  required: ['checks'],
  properties: {
    checks: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['cited_claim', 'match'],
        properties: { cited_claim: S_STR, re_execution: S_STR, match: { type: 'boolean' } },
      },
    },
  },
}
const ACCEPTANCE_SCHEMA = {
  type: 'object',
  required: ['criteria'],
  properties: {
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        required: ['criterion_id', 'method', 'verdict'],
        properties: { criterion_id: S_STR, method: S_STR, action: S_STR, observed: S_STR, verdict: { type: 'string', enum: ['pass', 'fail'] }, evidence: S_STR },
      },
    },
  },
}
const DIAGNOSIS_SCHEMA = {
  type: 'object',
  required: ['diagnosis'],
  properties: {
    diagnosis: {
      type: 'object',
      required: ['problem', 'root_cause', 'classification'],
      properties: {
        problem: S_STR,
        evidence: { type: 'array', items: S_STR },
        root_cause: S_STR,
        correction_draft: {
          type: 'object',
          properties: { target_artifact: S_STR, change: S_STR, why_it_removes_root_cause: S_STR },
        },
        classification: { type: 'string', enum: ['machine_applicable', 'owner_owned'] },
        blast_radius: S_STR,
      },
    },
  },
}
const FEEDBACK_SCHEMA = {
  type: 'object',
  required: ['feedback_dispositions'],
  properties: {
    feedback_dispositions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['signature', 'occurrences', 'verdict'],
        properties: {
          signature: S_STR,
          occurrences: { type: 'integer' },
          verdict: { type: 'string', enum: ['course_correction', 'systemic_defect', 'failed_correction', 'stale_deployment'] },
          responsible_component: S_STR,
        },
      },
    },
  },
}
const CLOSEOUT_SCHEMA = {
  type: 'object',
  required: ['report_path'],
  properties: { report_path: S_STR, status_path: S_STR, commit: S_STR, pr_url: S_STR, core_draft: S_STR },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// args may arrive as a live object (current runtime) or a JSON string (older);
// normalize either way. Nothing passed => a fresh intake ledger.
function normalizeInput(a) {
  let v = a
  if (typeof a === 'string') {
    try { v = JSON.parse(a) } catch { v = {} }
  }
  return v && typeof v === 'object' ? v : {}
}

// Deterministic sample of cited-verification indices for the spot re-run
// (architecture D8). Rate = max(2, ceil(0.1*n)); stride seeded by ledger
// revision so an agent cannot predict which citations are re-run, and the
// choice is reproducible on resume. No Math.random (banned in workflows).
function sampleIndices(n, seed) {
  if (n <= 0) return []
  const count = Math.min(n, Math.max(2, Math.ceil(0.1 * n)))
  const stride = Math.max(1, (Math.abs(seed | 0) % n) + 1)
  const picked = []
  let i = Math.abs(seed | 0) % n
  const seen = new Set()
  while (picked.length < count && seen.size < n) {
    if (!seen.has(i)) { seen.add(i); picked.push(i) }
    i = (i + stride) % n
    if (seen.has(i) && seen.size < n) i = (i + 1) % n
  }
  return picked
}

// Parse a location in the LOCATION grammar. Returns {file, start, end} for a
// range form, {file, section} for a section form, or null when it parses as
// neither — an unparseable location fires no detector rather than guessing.
const LOCATION_RANGE_RE = /^([^\s:#]+):(\d+)(?:-(\d+))?$/
const LOCATION_SECTION_RE = /^([^\s:#]+)#(\S+)$/
function parseLocation(loc) {
  if (typeof loc !== 'string') return null
  if (!LOCATION_RE.test(loc)) return null
  const r = LOCATION_RANGE_RE.exec(loc)
  if (r) return { file: r[1], start: +r[2], end: r[3] === undefined ? +r[2] : +r[3] }
  const s = LOCATION_SECTION_RE.exec(loc)
  return s ? { file: s[1], section: s[2] } : null
}

// Did this round's findings show that the last round's correction failed?
// (a) fix-site regression — a finding lands inside what the last round re-derived:
//     same file AND (overlapping line ranges OR equal section identifier).
// (b) incomplete class sweep — a finding lands at a location the sweep FOUND and
//     did NOT correct. Set membership, never string similarity: a location the
//     sweep never found is a NEW class, not an unclosed one, and must not fire.
//     Membership is over the UNION of the declared `found` and the verifier's
//     independently re-executed hits (carried on each entry as re_executed_hits
//     by runGate's same-round re-execution) — so a narrow self-report cannot
//     shrink this detector's domain (patching-instead-of-rederivation C3).
// Matching on the finding's `standard` instead is wrong on its own evidence — a
// standard recurring at a new location is the normal shape of iterative review.
function detectCorrectionFailure(findings, rederived) {
  const corrected = new Set(rederived.map((s) => s && s.location).filter(Boolean))
  const sweptOpen = new Set()
  for (const s of rederived)
    for (const f of ((s && s.class_sweep && s.class_sweep.found) || []).concat((s && s.re_executed_hits) || []))
      if (!corrected.has(f)) sweptOpen.add(f)
  for (const finding of findings || []) {
    const fl = parseLocation(finding && finding.location)
    if (!fl) continue
    for (const s of rederived) {
      const sl = parseLocation(s && s.location)
      if (!sl || sl.file !== fl.file) continue
      const hit =
        sl.section !== undefined
          ? fl.section !== undefined && fl.section === sl.section
          : fl.start !== undefined && fl.start <= sl.end && sl.start <= fl.end
      if (hit) return { kind: 'fix_site_regression', detail: { finding, prior: s } }
    }
  }
  for (const finding of findings || []) {
    if (finding && sweptOpen.has(finding.location)) {
      const prior = rederived.find(
        (s) => s && ((s.class_sweep && (s.class_sweep.found || []).includes(finding.location)) ||
          (s.re_executed_hits || []).includes(finding.location))
      )
      return { kind: 'unclosed_class', detail: { finding, prior } }
    }
  }
  return null
}

// Pure discrepancy predicate for the same-round sweep re-execution (patching-
// instead-of-rederivation correction C2). `entry` is one sections_rederived
// item; `reHits` is the hit list the VERIFIER — an agent that did not perform
// the correction — produced by executing that entry's declared pattern over its
// declared scope. Extracted as a named top-level function so the structural
// tier can lift and EXECUTE it against constructed shapes (the
// groundTruthPreconditions mechanism) — refusals observed, never asserted.
// - a re-executed hit absent from the declared `found` is an under-reported
//   sweep: the self-report was narrower than its own search;
// - a `found` entry that was neither edited (sites_changed) nor given an
//   escalation/open designation (open_sites) is a class site left silently
//   open — the exact shape that resurfaces as next round's "new" finding.
function sweepDiscrepancy(entry, reHits) {
  const cs = (entry && entry.class_sweep) || {}
  const found = Array.isArray(cs.found) ? cs.found : []
  const foundSet = new Set(found)
  const missed = (Array.isArray(reHits) ? reHits : []).filter((h) => !foundSet.has(h))
  if (missed.length) return { kind: 'sweep_underreported', missed }
  const changed = new Set(Array.isArray(cs.sites_changed) ? cs.sites_changed : [])
  const designated = new Set((Array.isArray(cs.open_sites) ? cs.open_sites : [])
    .filter((o) => o && typeof o.location === 'string' && typeof o.designation === 'string' && o.designation.trim() !== '')
    .map((o) => o.location))
  const silent = found.filter((f) => !changed.has(f) && !designated.has(f))
  if (silent.length) return { kind: 'found_left_silently_open', sites: silent }
  return null
}

// Pure findings-shape predicate (role-boundary correction C2 — belt to C1's
// braces: schema validation is performed by the harness's agent() primitive,
// whose strictness is not plugin-controlled, so the workflow re-checks the
// returned shape itself). Extracted as a named top-level function so the test
// tiers can lift and EXECUTE it (the sweepDiscrepancy mechanism). Returns null
// for a clean payload, or the first fault:
// - unknown_keys: a field outside FINDING_KEYS (e.g. `fix`/`recommendation`) —
//   role-crossing content in a named field;
// - field_over_bound: a field over its FINDING_BOUNDS cap (or not a string) —
//   prose-bloat that could carry a prescription or a whole review document;
// - prescription_in_evidence: a PRESCRIPTION_RE marker inside premise_evidence —
//   the tripwire for prescriptions that fit under the caps.
function findingShapeFault(findings) {
  const list = Array.isArray(findings) ? findings : []
  for (let i = 0; i < list.length; i++) {
    const f = list[i]
    if (!f || typeof f !== 'object' || Array.isArray(f)) return { kind: 'field_over_bound', index: i, field: '(finding is not an object)' }
    const unknown = Object.keys(f).filter((k) => !FINDING_KEYS.includes(k))
    if (unknown.length) return { kind: 'unknown_keys', index: i, keys: unknown }
    for (const k of FINDING_KEYS) {
      if (f[k] !== undefined && (typeof f[k] !== 'string' || f[k].length > FINDING_BOUNDS[k]))
        return { kind: 'field_over_bound', index: i, field: k, bound: FINDING_BOUNDS[k] }
    }
    if (typeof f.premise_evidence === 'string' && PRESCRIPTION_RE.test(f.premise_evidence))
      return { kind: 'prescription_in_evidence', index: i }
  }
  return null
}

// One review gate: fresh reviewer each round; up to ROUND_CAP rounds; on
// NEEDS_FIXES the artifact is remediated and re-reviewed; a cap breach returns
// NON_CONVERGENCE (the caller escalates). `multiLens` runs the three-lens panel
// for the implementation-PASS gate — all lenses must PASS.
async function runGate({ reviewFn, remediateFn, multiLens, detectFailedCorrection, sweepVerifyFn }) {
  const history = []
  // What the previous round's correction reported re-deriving. Empty until a
  // correction returns it; the detectors are inert while it is empty.
  let lastRederived = []
  for (let round = 1; round <= ROUND_CAP; round++) {
    let verdict, findings
    if (multiLens) {
      const results = (await parallel(LENSES.map((lens) => () => reviewFn(round, lens)))).filter(Boolean)
      const allPass = results.length === LENSES.length && results.every((v) => v.verdict === 'PASS')
      findings = results.flatMap((v) => v.findings || [])
      verdict = allPass ? 'PASS' : 'NEEDS_FIXES'
    } else {
      const v = await reviewFn(round, null)
      verdict = v && v.verdict === 'PASS' ? 'PASS' : 'NEEDS_FIXES'
      findings = (v && v.findings) || []
    }
    history.push({ round, verdict, findings_count: findings.length, findings })
    // Findings-shape guard (role-boundary correction C2): checked on every
    // round's payload BEFORE it flows anywhere — into the corrector's dispatch
    // via remediateFn, or into the persisted review record via history on a
    // PASS. A fault is a failed control, never a passed one (fail-closed, the
    // F5-2 principle); the caller routes it to GATE.control_fault.
    const shapeFault = findingShapeFault(findings)
    if (shapeFault) return { verdict: 'FINDING_SHAPE_FAULT', rounds: round, history, detail: shapeFault }
    if (verdict === 'PASS') return { verdict: 'PASS', rounds: round, history }
    // Detectors run only at the three document gates (D-2 excludes the
    // implementation gate: its remediateFn dispatches the planner for amend-plan
    // per architecture D6, so no correction reports sections_rederived there, and
    // its multi-lens flattening makes per-round finding identity incomparable).
    if (detectFailedCorrection && round > 1 && lastRederived.length) {
      const failed = detectCorrectionFailure(findings, lastRederived)
      if (failed)
        return { verdict: 'CORRECTION_FAILED', kind: failed.kind, rounds: round, history, detail: failed.detail }
    }
    const out = await remediateFn(findings, round)
    // A corrector that cannot act on a finding says so (skills/expert-correct: a
    // finding whose named standard it cannot verify is reported back, never
    // guessed at). Reading only sections_rederived would discard that and burn
    // the remaining rounds in silence.
    if (detectFailedCorrection && out && out.status === 'halted')
      return { verdict: 'CORRECTOR_HALTED', rounds: round, history, halt: out.halt }
    const rederived = (out && out.sections_rederived) || []
    // Same-round sweep re-execution (patching-instead-of-rederivation C2). The
    // class sweep is a reproducible computation, not an honesty claim: every
    // declared pattern is re-executed over its declared scope by the verifier —
    // an agent that did not perform the correction — and compared against the
    // declaration by the pure predicate sweepDiscrepancy. A discrepancy fails
    // the gate in THIS round, attributably, instead of surfacing as the next
    // round's "new" findings. A re-execution that did not (fully) run is a
    // failed control, never a passed one (fail-closed, the F5-2 principle).
    let reHits = []
    if (detectFailedCorrection && rederived.length) {
      if (typeof sweepVerifyFn !== 'function')
        return { verdict: 'SWEEP_UNVERIFIED', rounds: round, history, detail: { reason: 'no sweep re-execution channel was supplied, so the declared class sweep cannot be independently reproduced' } }
      const hits = await sweepVerifyFn(rederived, round)
      if (!Array.isArray(hits) || hits.length !== rederived.length)
        return { verdict: 'SWEEP_UNVERIFIED', rounds: round, history, detail: { reason: `the sweep re-execution returned ${Array.isArray(hits) ? hits.length : 'no'} hit set(s) for ${rederived.length} declared sweep(s)` } }
      reHits = hits
      for (let i = 0; i < rederived.length; i++) {
        const disc = sweepDiscrepancy(rederived[i], reHits[i])
        if (disc)
          return { verdict: 'CORRECTION_FAILED', kind: disc.kind, rounds: round, history, detail: { section: rederived[i], discrepancy: disc, re_executed_hits: reHits[i] } }
      }
    }
    // The re-executed hits ride alongside each declaration so next round's
    // unclosed_class membership tests the UNION, not the self-report (C3).
    lastRederived = rederived.map((s, i) => Object.assign({}, s, { re_executed_hits: reHits[i] || [] }))
  }
  return { verdict: 'NON_CONVERGENCE', rounds: ROUND_CAP, history }
}

// Diagnose a non-routine failure (or run the feedback sweep). Diagnosis always
// precedes routing (architecture D13).
// The failure record carries THIS segment's evidence. The ledger cannot: the command
// applies the delta only after the segment returns, and gate_history entries carry
// findings_count, never findings. Spec F-13 and architecture C3 mandate the failure
// record alongside the ledger snapshot; without a parameter for it, evidence living in
// a structured collection was discarded at the dispatch boundary.
async function diagnose(failureDescription, ledger, failureRecord) {
  const out = await agent(
    `Failure mode. Diagnose this non-routine failure and draft a correction.\n` +
      `Failure: ${failureDescription}\n` +
      `Failure record (evidence from THIS segment; not yet in the ledger): ` +
      `${JSON.stringify(failureRecord || {})}\n` +
      `Segment-start ledger snapshot (predates this segment; does NOT contain these rounds): ` +
      `${JSON.stringify(ledger)}`,
    { agentType: AGENT.diagnostician, schema: DIAGNOSIS_SCHEMA, phase: 'Review', label: 'diagnose' }
  )
  return out && out.diagnosis ? out.diagnosis : null
}

async function feedbackSweep(ledger, readerScript, transcriptDir) {
  const out = await agent(
    `Feedback-sweep mode. Read this project's transcripts by running the transcript reader at ` +
      `"${readerScript}" over the transcript directory "${transcriptDir}", starting from the ledger's ` +
      `feedback_marker; identify owner complaints, cluster by signature against the provided stores, ` +
      `and classify each. Ledger: ${JSON.stringify(ledger)}`,
    { agentType: AGENT.diagnostician, schema: FEEDBACK_SCHEMA, phase: 'Feedback sweep', label: 'feedback-sweep' }
  )
  return (out && out.feedback_dispositions) || []
}

function report(delta, extra) {
  return Object.assign(
    { ledger_delta: delta, review_records: reviewRecords, feedback: dispositions, feedback_escalation: feedbackEsc },
    extra
  )
}

// ---------------------------------------------------------------------------
// Main — one segment: run from the ledger's phase through machine gates to the
// next owner gate or completion, then return a SEGMENT_REPORT.
// ---------------------------------------------------------------------------
const input = normalizeInput(args)
const ledger = input.ledger || { phase: 'intake', revision: 0 }
const task = input.task || ledger.task || ''
// The owner's request, verbatim (instruction-reinterpretation correction, 0.4.0):
// `task` is whatever the orchestrator composed at intake — the paraphrase point.
// `taskVerbatim` is the owner's own turn text, captured by the command at intake
// (commands/expert.md §0) and never edited, summarized, or normalized. It is the
// authoritative statement of the request; every spec-phase dispatch carries it.
const taskVerbatim = input.task_verbatim || ledger.task_verbatim || ''
// A ledger opened before 0.4.0 has no captured request turn, and no reconstruction can
// recover it — it lived in a transcript, not in the artifacts or git history. The
// documented migration (commands/expert.md step 1) backfills the sentinel below rather
// than leaving such a ledger permanently unresumable. The sentinel is NOT the owner's
// words, so the one consumer that requires the real text — the spec phase — must treat
// it as absent; every other consumer only quotes it and is honest quoting the sentinel.
const LEGACY_VERBATIM_PREFIX = '[pre-0.4.0 ledger:'
const haveOwnerWords = !!taskVerbatim && !taskVerbatim.startsWith(LEGACY_VERBATIM_PREFIX)
// Artifact locations have ONE source of truth: the path the authoring agent returns in
// PHASE_SCHEMA.artifact_path. These are resume hints only — a prior segment's registered path,
// never a default. There is deliberately no `|| 'docs/…'` fallback: the skills name artifacts
// `spec-[kebab-case-name].md` while the old fallback was `spec.md`, two conventions that can
// never agree, and every review dispatch in the A-3 run cited a path that did not exist.
// After each authoring dispatch the returned artifact_path OVERWRITES these unconditionally
// when present; if it is still null the phase escalates rather than proceeding on a guess.
let specPath = input.spec_path || (input.artifacts && input.artifacts.spec) || null
let archPath = input.arch_path || (input.artifacts && input.artifacts.architecture) || null
let planPath = input.plan_path || (input.artifacts && input.artifacts.plan) || null
// The authoring agent's returned path outranks the resume hint (owner ruling, HANDOFF:73-74).
function resolveArtifactPath(out, current) {
  return out && out.artifact_path ? out.artifact_path : current
}
function missingArtifactPath(phaseName) {
  delta.phase = phaseName
  return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: `The ${phaseName} phase produced no artifact path, and there is no default to fall back on.`, options: ['re-run the phase', 'supply the path'], recommendation: 'inspect the phase output' } })
}
const seed = (ledger.revision | 0) + 1
const readerScript = input.reader_script || 'scripts/extract-owner-turns.mjs'
const transcriptDir = input.transcript_dir || ''

const delta = { phase: ledger.phase, artifacts: [], gate_history: [], amendments: [], budget: { total_tokens: 0 } }
// Shared control expressions (round-4 re-derivation): every control reads these,
// never a local proxy. Implementation outputs are never hash-pinned (they are
// verified by tests and ground truth; the command's step-2 re-hash exempts the
// same role) - one predicate, used by every consumer.
const isHashPinnedRole = (a) => a.role !== 'implementation'
const implementationArtifacts = () => (ledger.artifact_index || []).concat(delta.artifacts || []).filter((a) => a.role === 'implementation')
// Register an implement return's outputs, idempotently. Both the amend path and the
// post-gate registration call this on the SAME return (F4: one variable now carries
// whichever implementation actually executed), so a path already registered must not
// be appended twice — a duplicated artifact_index row is state the ledger's single
// writer never produced and every later consumer would have to de-duplicate.
const registerImplementationOutputs = (res) => {
  const known = new Set(implementationArtifacts().map((a) => a.path))
  for (const f of (res && res.files_changed) || []) {
    if (known.has(f)) continue
    known.add(f)
    delta.artifacts.push({ role: 'implementation', path: f })
  }
}
// F5-2: a verifier that returns nothing verified nothing. Every consumer of a
// VERIFIER_SCHEMA return goes through this; an empty return is a failed control,
// never a passed one (fail-closed).
const verifierUnderCovered = (v, expectedMin) => !v || !Array.isArray(v.checks) || v.checks.length < Math.max(1, expectedMin || 1)
const underCoveredVerifierGate = (what, resumePhase, got, expected) => {
  delta.phase = resumePhase
  return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.control_fault, what_happened: `The ${what} verifier returned ${got} check(s) where at least ${expected} were expected - the control did not (fully) run, so its subject is unverified. Fail-closed: the phase does not pass on an under-covered control.`, options: ['re-run the phase', 'investigate the verifier dispatch'], recommendation: 're-run; an under-covered verifier return is an infrastructure or dispatch fault, not evidence of correctness' } })
}
const reviewRecords = []
function record(gate, gateResult) {
  for (const h of gateResult.history) {
    delta.gate_history.push({ gate, round: h.round, verdict: h.verdict, findings_count: h.findings_count })
    reviewRecords.push({ phase: gate, round: h.round, verdict: h.verdict, findings: h.findings || [] })
  }
}
function finish() { delta.budget.total_tokens = budget.spent ? budget.spent() : 0; return delta }

// The feedback sweep runs once at the segment boundary (never mid-phase).
phase('Feedback sweep')
const dispositions = await feedbackSweep(ledger, readerScript, transcriptDir)
// Route the feedback escalation (F-14, S-3): a failed correction escalates with NO remediation;
// a systemic defect enters the F-13 diagnose path with the responsible component as target. Both are
// owner_owned and ride the terminal report — report() threads feedback + feedback_escalation onto it.
let feedbackEsc = null
const failedCorr = dispositions.find((d) => d.verdict === 'failed_correction')
const sysDefect = dispositions.find((d) => d.verdict === 'systemic_defect')
const staleDeploy = dispositions.find((d) => d.verdict === 'stale_deployment')
if (failedCorr) {
  feedbackEsc = { kind: 'failed_correction', disposition: failedCorr, responsible_component: failedCorr.responsible_component, remediation: 'none' }
} else if (sysDefect) {
  const dg = await diagnose(`Systemic defect from repeat owner feedback: ${JSON.stringify(sysDefect)}`, ledger, { disposition: sysDefect })
  feedbackEsc = { kind: 'systemic_defect', disposition: sysDefect, diagnosis: dg, responsible_component: sysDefect.responsible_component }
} else if (staleDeploy) {
  // D15's other half: the running version PREDATES the fix, so the correction did not
  // fail — the deployment is behind. F-14 defines the verdict and A-9(c) computes it
  // correctly; without this branch it was computed and discarded, and "update the
  // plugin" is the entire action the verdict exists to produce. No remediation: the
  // machine does not modify its own deployment.
  feedbackEsc = { kind: 'stale_deployment', disposition: staleDeploy, responsible_component: staleDeploy.responsible_component, remediation: 'none' }
}

let cursor = ledger.phase || 'intake'
if (cursor === 'intake') cursor = 'spec'

// The spec phase runs only on the owner's captured words. Without them, the spec
// writer's sole view of the request would be the orchestrator's restatement —
// exactly the reinterpretation defect. A halt, not a fallback (fail-closed).
if (cursor === 'spec' && !haveOwnerWords) {
  delta.phase = 'spec'
  return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.control_fault, what_happened: `The owner's request text ${taskVerbatim ? 'is the legacy-ledger sentinel rather than the owner\'s own words' : 'was not captured into task_verbatim'}, so the spec phase would run on a restatement of the request rather than the request itself. The phase did not run.`, options: ['capture the owner\'s turn verbatim into the ledger and re-invoke', 'supply task_verbatim in the snapshot'], recommendation: 'capture the request verbatim per commands/expert.md §0 and resume; the verbatim text is the spec phase\'s authoritative input' } })
}

// ---- SPEC ---------------------------------------------------------------
if (cursor === 'spec') {
  phase('Spec')
  const specOut = await agent(
    `Write the specification for this task.\nTask: ${task}\nOwner's request, verbatim (the authoritative statement of what to build — the Task line above is a working title, not the request):\n<<<OWNER_REQUEST\n${taskVerbatim}\nOWNER_REQUEST>>>\nYou are authorized to write exactly one file: the specification artifact you create. Change nothing else in the repository.`,
    { agentType: AGENT.spec, schema: PHASE_SCHEMA, phase: 'Spec', label: 'spec' }
  )
  specPath = resolveArtifactPath(specOut, specPath)
  if (!specOut || specOut.status === 'halted') {
    const d = specOut && specOut.halt ? specOut.halt : { detail: 'spec phase produced no output' }
    delta.phase = 'spec'
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: d.detail, options: d.options || [], recommendation: d.recommendation || '' } })
  }
  if (!specPath) return missingArtifactPath('spec')
  // Register BEFORE the gate, matching architecture (:the arch phase) and plan. The push
  // used to sit after the escalation return, so a spec that failed to converge was never
  // registered — D9 hash anchoring missed the artifact exactly when the owner needed it.
  delta.artifacts.push({ role: 'spec', path: specPath })
  const gate = await runGate({
    reviewFn: (round) => agent(`Review the spec at ${specPath} against the task, judged against ${RULER.spec}. Check it against its own output contract at ${OUTPUT_CONTRACT.spec}. Owner's request, verbatim (the authoritative statement of what the spec must cover):\n<<<OWNER_REQUEST\n${taskVerbatim}\nOWNER_REQUEST>>>\nEvery clause of the verbatim request must trace to the spec per its output contract's Request-traceability section; a dropped, renamed, or narrowed clause is a finding. ${NOT_THE_RULER} Round ${round}.`, { agentType: AGENT.reviewer, schema: VERDICT_SCHEMA, phase: 'Review', label: `review:spec:r${round}` }),
    remediateFn: (findings) => agent(`Correct the spec at ${specPath} against these review findings. Re-derive each finding's section from that section's sources — do not edit the sentence the finding points at, and do not re-author the artifact; its untouched sections are correct by the prior round's review. Sweep each finding's class across the whole artifact. Correct only what the findings require. Return sections_rederived: one entry per re-derived section with its location (path:start-end or path#section), the source it was re-derived from, the finding it addresses, and class_sweep {searched, pattern, scope, found, sites_changed} — pattern is the executable regex the sweep ran (Grep syntax) and scope the file or glob it ran over (normally this artifact); found lists EVERY location the search returned, corrected or not; sites_changed lists the found locations you actually edited; every found entry outside sites_changed carries an open_sites entry {location, designation} naming its escalation or explicitly-open status. The pattern is re-executed independently against the artifact this same round: executing it over scope must reproduce found, and a found site neither changed nor designated fails the gate. A finding whose named standard you cannot verify returns status: 'halted' with the reason in halt.detail. Findings: ${JSON.stringify(findings)}`, { agentType: AGENT.corrector, schema: PHASE_SCHEMA, phase: 'Spec', label: 'revise:spec' }),
    multiLens: false,
    detectFailedCorrection: true,
    sweepVerifyFn: (secs) => reExecuteSweeps(secs),
  })
  record('spec', gate)
  if (gate.verdict !== 'PASS') {
    delta.phase = 'spec'
    return report(finish(), { outcome: 'owner_gate', gate: await gateEscalation(gate, 'Spec', 'spec', specPath, ledger) })
  }
  // Spec PASS -> the one intent gate. The command advances phase to 'architecture' on owner
  // approval (S-5); the workflow does not claim the transition here.
  const specScope = await documentScopeCheck('Spec', 'spec', specPath, ledger)
  if (specScope) return specScope
  delta.phase = 'spec'
  return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.intent, what_happened: `A specification for "${task}" passed independent review. Your request, verbatim:\n<<<OWNER_REQUEST\n${taskVerbatim}\nOWNER_REQUEST>>>\nConfirm the spec is what you meant — its Request traceability section maps each clause of that request to the requirements that cover it — before design begins.`, artifact: specPath, options: ['approve', 'request changes'], recommendation: 'read the spec against your verbatim request above and approve if it matches your intent' } })
}

// After intent approval the command re-invokes with phase='architecture'.
// The remaining phases run through to completion unless an escalation fires.

// ---- ARCHITECTURE -------------------------------------------------------
if (cursor === 'architecture') {
  phase('Architecture')
  const out = await agent(`Produce the architecture from the approved spec at ${specPath}. You are authorized to write exactly one file: the architecture artifact you create. Change nothing else in the repository. If premise verification reveals a defect in an upstream artifact, do NOT edit that file: record the discrepancy (location, verified evidence, proposed correction) in your returned evidence, or return status halted with it in halt.detail. Upstream artifacts change only through the orchestrator's amendment path.`, { agentType: AGENT.architect, schema: PHASE_SCHEMA, phase: 'Architecture', label: 'architecture' })
  archPath = resolveArtifactPath(out, archPath)
  const esc = maybeEscalate(out, 'architecture')
  if (esc) return esc
  if (!archPath) return missingArtifactPath('architecture')
  delta.artifacts.push({ role: 'architecture', path: archPath })
  const gate = await runGate({
    reviewFn: (round) => agent(`Review the architecture at ${archPath} against the spec at ${specPath}, judged against ${RULER.architecture}. Check it against its own output contract at ${OUTPUT_CONTRACT.architecture}. ${NOT_THE_RULER} Round ${round}.`, { agentType: AGENT.reviewer, schema: VERDICT_SCHEMA, phase: 'Review', label: `review:arch:r${round}` }),
    remediateFn: (findings) => agent(`Correct the architecture at ${archPath} against these review findings. Re-derive each finding's section from that section's sources — do not edit the sentence the finding points at, and do not re-author the artifact; its untouched sections are correct by the prior round's review. Sweep each finding's class across the whole artifact. Correct only what the findings require. Return sections_rederived: one entry per re-derived section with its location (path:start-end or path#section), the source it was re-derived from, the finding it addresses, and class_sweep {searched, pattern, scope, found, sites_changed} — pattern is the executable regex the sweep ran (Grep syntax) and scope the file or glob it ran over (normally this artifact); found lists EVERY location the search returned, corrected or not; sites_changed lists the found locations you actually edited; every found entry outside sites_changed carries an open_sites entry {location, designation} naming its escalation or explicitly-open status. The pattern is re-executed independently against the artifact this same round: executing it over scope must reproduce found, and a found site neither changed nor designated fails the gate. A finding whose named standard you cannot verify returns status: 'halted' with the reason in halt.detail. Findings: ${JSON.stringify(findings)}`, { agentType: AGENT.corrector, schema: PHASE_SCHEMA, phase: 'Architecture', label: 'revise:arch' }),
    multiLens: false,
    detectFailedCorrection: true,
    sweepVerifyFn: (secs) => reExecuteSweeps(secs),
  })
  record('architecture', gate)
  const nc = await maybeNonConvergence(gate, 'Architecture', 'architecture', ledger, archPath)
  if (nc) return nc
  const archScope = await documentScopeCheck('Architecture', 'architecture', archPath, ledger)
  if (archScope) return archScope
  cursor = 'plan'
}

// ---- PLAN ---------------------------------------------------------------
if (cursor === 'plan') {
  phase('Plan')
  const out = await agent(`Produce the implementation plan from the spec at ${specPath} and architecture at ${archPath}. You are authorized to write exactly one file: the plan artifact you create. Change nothing else in the repository. If premise verification reveals a defect in an upstream artifact, do NOT edit that file: record the discrepancy (location, verified evidence, proposed correction) in your returned evidence, or return status halted with it in halt.detail. Upstream artifacts change only through the orchestrator's amendment path.`, { agentType: AGENT.planner, schema: PHASE_SCHEMA, phase: 'Plan', label: 'plan' })
  planPath = resolveArtifactPath(out, planPath)
  const esc = maybeEscalate(out, 'plan')
  if (esc) return esc
  if (!planPath) return missingArtifactPath('plan')
  delta.artifacts.push({ role: 'plan', path: planPath })
  const gate = await runGate({
    reviewFn: (round) => agent(`Review the plan at ${planPath} against the spec and architecture, judged against ${RULER.plan}. Check it against its own output contract at ${OUTPUT_CONTRACT.plan}. ${NOT_THE_RULER} Round ${round}.`, { agentType: AGENT.reviewer, schema: VERDICT_SCHEMA, phase: 'Review', label: `review:plan:r${round}` }),
    remediateFn: (findings) => agent(`Correct the plan at ${planPath} against these review findings. Re-derive each finding's section from that section's sources — do not edit the sentence the finding points at, and do not re-author the artifact; its untouched sections are correct by the prior round's review. Sweep each finding's class across the whole artifact. Correct only what the findings require. Return sections_rederived: one entry per re-derived section with its location (path:start-end or path#section), the source it was re-derived from, the finding it addresses, and class_sweep {searched, pattern, scope, found, sites_changed} — pattern is the executable regex the sweep ran (Grep syntax) and scope the file or glob it ran over (normally this artifact); found lists EVERY location the search returned, corrected or not; sites_changed lists the found locations you actually edited; every found entry outside sites_changed carries an open_sites entry {location, designation} naming its escalation or explicitly-open status. The pattern is re-executed independently against the artifact this same round: executing it over scope must reproduce found, and a found site neither changed nor designated fails the gate. A finding whose named standard you cannot verify returns status: 'halted' with the reason in halt.detail. Findings: ${JSON.stringify(findings)}`, { agentType: AGENT.corrector, schema: PHASE_SCHEMA, phase: 'Plan', label: 'revise:plan' }),
    multiLens: false,
    detectFailedCorrection: true,
    sweepVerifyFn: (secs) => reExecuteSweeps(secs),
  })
  record('plan', gate)
  const nc = await maybeNonConvergence(gate, 'Plan', 'plan', ledger, planPath)
  if (nc) return nc
  const planScope = await documentScopeCheck('Plan', 'plan', planPath, ledger)
  if (planScope) return planScope
  cursor = 'implement'
}

// ---- IMPLEMENT + review + verify + ground truth -------------------------
if (cursor === 'implement') {
  phase('Implement')
  let impl = await agent(`Execute the approved plan at ${planPath} end to end. ${IMPLEMENT_ACTIVATION_REQ}`, { agentType: AGENT.implementer, schema: IMPLEMENT_SCHEMA, phase: 'Implement', label: 'implement' })

  // skill-activation-missed C1 (0.4.0): activation is demonstrated, never
  // asserted. An unverified echo earns exactly one re-dispatch with the
  // instruction made explicit; a second failure gates as a control fault. An
  // "Unknown skill" error gates immediately (environment defect) — the
  // halt-not-fallback rule forbids executing from an imitation of the skill.
  if (needsActivationRedispatch(impl))
    impl = await agent(`Execute the approved plan at ${planPath} end to end. ${IMPLEMENT_ACTIVATION_REQ} Your previous return did not verify activation: skill_activation must quote the ACTUAL Skill tool result's launch line, not restate the requirement.`, { agentType: AGENT.implementer, schema: IMPLEMENT_SCHEMA, phase: 'Implement', label: 'implement' })
  const actFault = skillActivationFault(impl)
  if (actFault) {
    delta.phase = 'implement'
    return report(finish(), { outcome: 'owner_gate', gate: skillActivationGate(actFault) })
  }

  // STOP REPORT routing (architecture D6): amend-plan is automatic; override is
  // never machine-selected; hard-rule and environment blocks escalate.
  if (impl && impl.status === 'halted' && impl.stop_report) {
    const cat = impl.stop_report.category
    const dg = await diagnose(`Implementer STOP (${cat}): ${JSON.stringify(impl.stop_report)}`, ledger, { stop_report: impl.stop_report, plan: planPath })
    if (cat === 'HARD-RULE-CONFLICT' || cat === 'ENVIRONMENT-BLOCKED') {
      delta.phase = 'implement'
      const gtype = cat === 'ENVIRONMENT-BLOCKED' ? GATE.risk_override : GATE.spec_traceable
      return report(finish(), { outcome: 'owner_gate', gate: { type: gtype, what_happened: impl.stop_report.observed || cat, diagnosis: dg, correction_draft: dg && dg.correction_draft, options: ['amend', 'override (accept risk)', 'abort'], recommendation: 'review the diagnosis' } })
    }
    // PREMISE-FALSE / BLAST-RADIUS -> auto amend-plan -> re-implement (remediation
    // goes through the planner then the implementer; reviewed like any change).
    const amended = await agent(`Amend the plan at ${planPath} per this diagnosis, then re-verify: ${JSON.stringify(dg)}`, { agentType: AGENT.planner, schema: PHASE_SCHEMA, phase: 'Plan', label: 'amend:plan' })
    // This dispatch's return used to be discarded outright (found by the F4 class
    // sweep: it was the file's only wholly unconsumed `await agent`). A halted
    // amendment means the plan was NOT rewritten, so re-implementing would run the
    // same unamended plan into the same STOP and burn a second implement budget.
    if (!amended || amended.status === 'halted') {
      delta.phase = 'implement'
      const h = (amended && amended.halt) || { detail: 'the plan-amendment dispatch returned nothing' }
      return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: `The automatic plan amendment for a ${cat} STOP did not complete: ${h.detail}. The plan at ${planPath} is unchanged, so re-implementing would repeat the same halt.`, diagnosis: dg, correction_draft: dg && dg.correction_draft, options: ['amend the plan by hand and resume', 'investigate the diagnosis'], recommendation: 'the amend-and-re-implement route is automatic only when the amendment itself succeeds; this one did not' } })
    }
    // F4: the re-implementation is bound back into `impl`, the single variable every
    // downstream control reads. Held in a block-scoped `impl2`, it was invisible to
    // the completeness gate, the evidence cross-consistency check, and the
    // anti-fabrication sample below — all of which then inspected the HALTED return
    // that opened this branch, so on this path they could not fail.
    impl = await agent(`Execute the amended plan at ${planPath}. ${IMPLEMENT_ACTIVATION_REQ}`, { agentType: AGENT.implementer, schema: IMPLEMENT_SCHEMA, phase: 'Implement', label: 're-implement' })
    // Same C1 activation verification as the primary dispatch above.
    if (needsActivationRedispatch(impl))
      impl = await agent(`Execute the amended plan at ${planPath}. ${IMPLEMENT_ACTIVATION_REQ} Your previous return did not verify activation: skill_activation must quote the ACTUAL Skill tool result's launch line, not restate the requirement.`, { agentType: AGENT.implementer, schema: IMPLEMENT_SCHEMA, phase: 'Implement', label: 're-implement' })
    const actFault2 = skillActivationFault(impl)
    if (actFault2) {
      delta.phase = 'implement'
      return report(finish(), { outcome: 'owner_gate', gate: skillActivationGate(actFault2) })
    }
    registerImplementationOutputs(impl)
  }

  // Implementation review — multi-lens panel on the PASS round.
  const gate = await runGate({
    reviewFn: (round, lens) => agent(`Review the implementation diff against the plan at ${planPath}, judged against ${RULER.implementation}${lens ? `, through the ${lens} lens` : ''}. ${NOT_THE_RULER} Round ${round}.`, { agentType: AGENT.reviewer, schema: VERDICT_SCHEMA, phase: 'Review', label: `review:impl:${lens || 'x'}:r${round}` }),
    remediateFn: (findings) => agent(`Route these implementation findings to a remediation plan, then re-implement under review: ${JSON.stringify(findings)}`, { agentType: AGENT.planner, schema: PHASE_SCHEMA, phase: 'Plan', label: 'remediate:impl' }),
    multiLens: true,
  })
  record('implementation', gate)
  const nc = await maybeNonConvergence(gate, 'Implementation', 'implement', ledger, planPath)
  if (nc) return nc

  // Register the build's outputs so ground truth has a traceable target (the
  // consumer at the ground-truth guard reads role 'implementation'; without
  // this producer that check could never hold).
  registerImplementationOutputs(impl)

  // F3-1/F4-1: files_changed is optional in IMPLEMENT_SCHEMA, so an implementer
  // that omits it would otherwise sail to the ground-truth guard and strand
  // there. The condition reads the ACCUMULATED registered implementation
  // artifacts (ledger + this segment, including the amend path's re-implement
  // registration), so it is idempotent on resume and does not fire falsely
  // after an amend cycle. Surfaced as an answerable gate.
  if (implementationArtifacts().length === 0) {
    delta.phase = 'implement'
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: 'The implementer completed without reporting any changed files, so no build output is traceable to the executed plan. Ground truth cannot target anything until this is resolved.', options: ['re-run the implement phase', 'investigate'], recommendation: 're-run the implement phase; if it genuinely changed nothing, the plan itself needs the owner\'s attention' } })
  }

  // Implementation-completeness gate (premature-completion correction C2). The
  // controls below detect FABRICATED positive claims; this one detects OMISSION —
  // a completed status that leaves recorded plan steps unaccounted for, the
  // measured premature-completion shape. It consumes the step index the plan
  // phase's scope check recorded (C1); the predicate is pure so the structural
  // tier lifts and EXECUTES it, same mechanism as groundTruthPreconditions.
  const planFacts = recordedPlanFacts(ledger, delta, planPath)
  const compl = implementationCompleteness(planFacts.step_ids, impl)
  if (!compl.ok) {
    delta.phase = 'implement'
    if (compl.kind === 'control_fault') {
      return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.control_fault, what_happened: `Implementation completeness could not be verified: ${compl.reason}. The completed claim is UNVERIFIED, not accepted.`, options: ['re-run the plan phase so its scope check records the step index', 'investigate the ledger'], recommendation: 're-run the plan phase; without the recorded step index a completed claim is unverifiable, and unverifiable fails closed' } })
    }
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: `Premature completion claim: ${compl.reason}. Unaccounted step IDs: ${(compl.missing_steps || []).join(', ')}.`, options: ['re-run the implement phase to complete the unaccounted steps', 'amend the plan if these steps should not exist'], recommendation: 'a completed status must account for every plan step with per-step evidence; review the unaccounted list' } })
  }

  // Anti-fabrication spot re-run over a deterministic sample of cited evidence.
  const cited = (impl && impl.evidence) || []
  // Cross-entry consistency, checked BEFORE re-executing anything: entries
  // describing the same subject must agree. The A-4b fabrication was
  // self-refuting — one entry's claimed value contradicted another entry's
  // accurate description of the same function — and nothing looked. This costs
  // zero re-execution and catches the observed shape independently of which
  // indices the sample happens to draw.
  const bySubject = new Map()
  for (const c of cited) {
    const k = c && (c.subject || c.citation)
    if (!k) continue
    if (!bySubject.has(k)) bySubject.set(k, [])
    bySubject.get(k).push(c)
  }
  let contradiction = null
  for (const [k, group] of bySubject) {
    for (let i = 0; i < group.length && !contradiction; i++)
      for (let j = i + 1; j < group.length; j++)
        if (group[i].asserted && group[j].asserted && group[i].asserted !== group[j].asserted) {
          contradiction = { subject: k, a: group[i], b: group[j] }
          break
        }
    if (contradiction) break
  }
  if (contradiction) {
    const dg = await diagnose(
      'Two cited verifications describing the same subject assert contradictory outcomes (self-refuting evidence).',
      ledger,
      { contradiction, cited }
    )
    delta.phase = 'implement'
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: `Two cited verifications of "${contradiction.subject}" contradict each other; at least one is fabricated.`, diagnosis: dg, options: ['re-run phase', 'investigate'], recommendation: 'review the diagnosis' } })
  }
  const idx = sampleIndices(cited.length, seed)
  if (idx.length) {
    const sample = idx.map((i) => cited[i])
    const vr = await agent(`Spot re-run: re-execute each cited verification and report match/mismatch. Cited: ${JSON.stringify(sample)}`, { agentType: AGENT.verifier, schema: VERIFIER_SCHEMA, phase: 'Verify', label: 'spot-rerun' })
    if (verifierUnderCovered(vr, sample.length)) return underCoveredVerifierGate('spot re-run', 'implement', (vr && vr.checks || []).length, sample.length)
    const fabricated = (vr.checks || []).some((c) => c.match === false)
    if (fabricated) {
      const dg = await diagnose('A cited verification did not reproduce on spot re-run (fabricated compliance).', ledger, { checks: vr.checks, sampled_indices: idx, cited: sample, seed })
      delta.phase = 'implement'
      return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: 'A cited verification could not be reproduced.', diagnosis: dg, options: ['re-run phase', 'investigate'], recommendation: 'review the diagnosis' } })
    }
  }

  // diff-vs-plan mechanical check. The coverage floor is the plan's RECORDED
  // files count (C3), not the literal 1 — an authorized-but-untouched file is a
  // violation only a per-file check can see, so a single summary check is
  // under-coverage. The deferral scan (C4) is the structural counterpart of
  // "unresolved items relocated instead of resolved": relocation now leaves a
  // detectable marker in the diff, routed through the same diagnose-then-gate.
  const filesFloor = Math.max(1, planFacts.files_count | 0)
  const dvp = await agent(`Diff-vs-plan: compare git-changed files against the plan's authorized "Files affected" at ${planPath}. Report one check per file in the authorized set (match true only when its state matches the plan), plus one check per violation in either direction — a changed file outside the set, or an authorized file left untouched. Additionally, run a mechanical deferral scan: over the diff's ADDED lines only, report one check per added line matching TODO|FIXME|XXX|deferred|follow-up|later. Such a check's match is false UNLESS a step-decl in the plan at ${planPath} explicitly authorizes creating that marker in that file; cite the file:line and matched marker in cited_claim and the authorizing plan step (or "none") in re_execution. An added unresolved-item marker is unfinished work relocated into the diff, and relocation is not resolution.`, { agentType: AGENT.verifier, schema: VERIFIER_SCHEMA, phase: 'Verify', label: 'diff-vs-plan' })
  if (verifierUnderCovered(dvp, filesFloor)) return underCoveredVerifierGate('diff-vs-plan', 'implement', (dvp && dvp.checks || []).length, filesFloor)
  if ((dvp.checks || []).some((c) => c.match === false)) {
    const dg = await diagnose('Diff-vs-plan violation: a changed file outside the plan\'s authorized set, an authorized file left untouched, or an unauthorized deferral marker (TODO/FIXME/deferred) added by the diff.', ledger, { checks: dvp.checks, plan: planPath })
    delta.phase = 'implement'
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: 'A diff-vs-plan violation was detected (out-of-plan change, untouched authorized file, or unauthorized deferral marker).', diagnosis: dg, options: ['amend plan', 'revert change'], recommendation: 'review the diagnosis' } })
  }
  cursor = 'ground_truth'
}

// ---- GROUND TRUTH + reconciliation --------------------------------------
if (cursor === 'ground_truth') {
  phase('Ground truth')
  // Sequencing + payload-coherence guard: verification may only target the build this
  // lifecycle produced, sourced from THIS ledger's spec — never a pre-existing artifact
  // or another project's criteria (acceptance run 2026-08-17: all 27 failures in one
  // dispatch were predetermined by target selection, not implementation defects).
  // Every precondition is a computed orchestrator predicate over recorded state:
  //   (a) payload coherence - the criteria source is an OWNER-APPROVED spec in this
  //       ledger's index (approval happens at the intent gate, so a same-segment
  //       spec can never satisfy this by construction);
  //   (b) target traceability - implementation artifacts are registered (produced by
  //       the implement phase's files_changed registration above);
  //   (c) build-completeness - the LATEST implementation review verdict is PASS (a
  //       PASS that predates a later re-review does not count).
  const gt = groundTruthPreconditions(ledger, delta, specPath)
  const implArts = gt.implArts
  if (!gt.ok) {
    delta.phase = 'ground_truth'
    const why = gt.why
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: `Ground-truth dispatch refused: ${why}.`, options: ['resume after the missing precondition is repaired (re-run the phase that should have produced it)', 'investigate the ledger'], recommendation: 'repair the precondition and resume; this refusal exists so verification can never target a build the lifecycle did not produce' } })
  }
  const acc = await agent(`Execute each acceptance criterion of the spec at ${specPath} — that spec's requirements ONLY; no other project's or document's criteria apply — against the running system this lifecycle's executed plan produced in the ledger task's target project${implArts.length ? ` (registered implementation artifacts: ${implArts.map((a) => a.path).join(', ')})` : ''}. Report per-criterion pass/fail with observed evidence.`, { agentType: AGENT.acceptance, schema: ACCEPTANCE_SCHEMA, phase: 'Ground truth', label: 'ground-truth' })
  // Coverage floor, the same fail-closed rule verifierUnderCovered applies to every
  // VERIFIER_SCHEMA return (F5-2): an acceptance run that reported no criterion
  // executed no criterion. `criteria` is optional-by-cardinality in ACCEPTANCE_SCHEMA,
  // so an empty array validates; filtering it for `verdict === 'fail'` then yields an
  // empty list, and "nothing failed" read as ground truth PASSED — a maximal verdict
  // over an empty set, the same shape as a preflight CURRENT with nothing compared.
  // Ground truth is the one control that tests the running system, so a vacuous pass
  // here is the most expensive one in the lifecycle.
  const criteria = (acc && Array.isArray(acc.criteria) && acc.criteria) || []
  if (criteria.length === 0) {
    delta.phase = 'ground_truth'
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.control_fault, what_happened: 'The ground-truth run returned no acceptance criteria, so no criterion of the spec was executed against the running system. Fail-closed: an empty acceptance return is a failed control, never a passed one.', options: ['re-run the ground-truth phase', 'investigate the acceptance dispatch', 'check that the spec states acceptance criteria at all'], recommendation: 're-run; if the spec genuinely states no acceptance criteria, the spec needs the owner\'s attention before anything can be called verified' } })
  }
  const failed = criteria.filter((c) => c.verdict === 'fail')
  if (failed.length) {
    const dg = await diagnose(`Ground-truth failure: ${JSON.stringify(failed)}`, ledger, { failed_criteria: failed })
    delta.phase = 'ground_truth'
    const traceable = dg && dg.classification === 'owner_owned'
    return report(finish(), { outcome: 'owner_gate', gate: { type: traceable ? GATE.spec_traceable : GATE.non_convergence, what_happened: `${failed.length} acceptance criterion(s) failed against the running system.`, diagnosis: dg, correction_draft: dg && dg.correction_draft, options: ['amend', 'investigate'], recommendation: 'review the diagnosis' } })
  }
  phase('Verify')
  // C3: the coverage floor is the plan's RECORDED element count, not the literal
  // 1 — one summary check ("all mapped", match true) cannot witness a whole-chain
  // reconciliation, and the F5-2 fail-closed principle only binds when the floor
  // derives from the artifact under test.
  const reconFloor = Math.max(1, recordedPlanFacts(ledger, delta, planPath).element_count | 0)
  const recon = await agent(`Whole-chain reconciliation: map every in-scope spec requirement to its implementing diff and verifying evidence, and every diff hunk to its authorizing plan step at ${planPath}. Report one check per in-scope requirement (match true only when it maps to both its implementing diff and its verifying evidence), plus one check per diff hunk that has no authorizing plan step. A single summary check is not a reconciliation.`, { agentType: AGENT.verifier, schema: VERIFIER_SCHEMA, phase: 'Verify', label: 'reconciliation' })
  if (verifierUnderCovered(recon, reconFloor)) return underCoveredVerifierGate('reconciliation', 'ground_truth', (recon && recon.checks || []).length, reconFloor)
  if ((recon.checks || []).some((c) => c.match === false)) {
    const dg = await diagnose('Whole-chain reconciliation found an unmapped requirement or diff hunk.', ledger, { checks: recon.checks, spec: specPath, plan: planPath })
    delta.phase = 'ground_truth'
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: 'Reconciliation found an unmapped item.', diagnosis: dg, options: ['amend', 'investigate'], recommendation: 'review the diagnosis' } })
  }
  cursor = 'closeout'
}

// ---- CLOSEOUT -----------------------------------------------------------
if (cursor === 'closeout') {
  phase('Closeout')
  const co = await agent(`Closeout: write the final report against the spec, commit the verified work and open a PR per repo conventions, and DRAFT (do not send) a CORE ingestion message. Return report path, commit, PR URL, and the CORE draft.`, { agentType: AGENT.closeout, schema: CLOSEOUT_SCHEMA, phase: 'Closeout', label: 'closeout' })
  // Closeout is inspected before completion is written, like every other dispatch in
  // this file: architecture and plan through maybeEscalate, implement and the amendment
  // path on `status === 'halted'`, ground truth on its criteria, the three verifier
  // dispatches on their coverage floors. Closeout alone advanced to 'complete'
  // unconditionally, and the `co || {}` below is this line's own acknowledgement that
  // `co` may be falsy — so an absent or empty return declared the lifecycle complete
  // and handed the owner a CORE draft for a report, a commit, and a PR that nothing
  // here has evidence exist. `report_path` is CLOSEOUT_SCHEMA's single required field
  // and so is the minimum positive evidence that the phase actually ran. Resuming at
  // 'closeout' (not 'complete') is what keeps the work recoverable: the continuation
  // gate treats that phase as in flight, by TERMINAL_PHASES in
  // hooks/continuation-gate.mjs.
  if (!co || typeof co !== 'object' || typeof co.report_path !== 'string' || co.report_path === '') {
    delta.phase = 'closeout'
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.control_fault, what_happened: 'The closeout dispatch returned no report path, so there is no evidence that the final report was written, the verified work committed, or the PR opened. Fail-closed: the lifecycle is not marked complete on an unverified closeout.', options: ['re-run the closeout phase', 'investigate the closeout dispatch'], recommendation: 're-run closeout; declaring completion from a return that carries no report path is precisely the premature-completion shape this lifecycle exists to prevent' } })
  }
  delta.phase = 'complete'
  return report(finish(), { outcome: 'complete', completion: co || {}, core_gate: { type: GATE.core_approval, what_happened: 'Work verified and closed out. A CORE ingestion message is drafted for your approval.', draft: (co && co.core_draft) || '' }, feedback: dispositions })
}

// Fallthrough (unknown phase): surface for the owner rather than guessing.
delta.phase = cursor
return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: `Unknown lifecycle phase "${cursor}"; cannot route.`, options: ['reset lifecycle'], recommendation: 'inspect the ledger' } })

// ---------------------------------------------------------------------------
// Escalation helpers (hoisted function declarations)
// ---------------------------------------------------------------------------
function maybeEscalate(out, phaseName) {
  if (out && out.status === 'halted') {
    const h = out.halt || { detail: `${phaseName} phase halted` }
    delta.phase = phaseName
    const type = h.category === 'BUSINESS' ? GATE.business : GATE.spec_traceable
    return report(finish(), { outcome: 'owner_gate', gate: { type, what_happened: h.detail, options: h.options || [], recommendation: h.recommendation || '' } })
  }
  return null
}
// How each non-PASS runGate outcome reaches the owner. Fail-safe defaults (OWASP
// secure design; the architecture names this standard for D6 STOP routing at
// docs/arch/architecture-expert-dev-tools.md @ `OWASP secure-design fail-safe defaults`):
// a new state must fail CLOSED.
// The callers below therefore test `!== 'PASS'` rather than enumerating verdicts —
// an unhandled state that fell through reached the spec gate's GATE.intent return
// and told the owner the specification passed independent review.
const CORRECTION_FAILED_TEXT = {
  fix_site_regression: 'a correction broke the section it edited',
  unclosed_class: 'a correction closed the named instance and the same standard was violated elsewhere',
  sweep_underreported: "a correction's class sweep, re-executed independently, returned sites the correction did not report",
  found_left_silently_open: 'a correction found class sites it neither changed, escalated, nor declared open',
}
function lastRoundFindings(gate) {
  return (gate.history[gate.history.length - 1] || {}).findings || []
}
async function gateEscalation(gate, phaseName, resumePhase, artifactPath, led) {
  if (gate.verdict === 'CORRECTION_FAILED') {
    const d = gate.detail || {}
    const what = `${phaseName} review stopped at round ${gate.rounds}: ${CORRECTION_FAILED_TEXT[gate.kind] || gate.kind}.`
    const dg = await diagnose(what, led, { kind: gate.kind, finding: d.finding, prior: d.prior, rounds: gate.history })
    return { type: GATE.non_convergence, what_happened: what, diagnosis: dg, detail: d, findings: lastRoundFindings(gate), options: ['amend the artifact', 'revisit upstream'], recommendation: 'review the diagnosis — the next round would start from a worse artifact' }
  }
  if (gate.verdict === 'SWEEP_UNVERIFIED') {
    // The re-execution control did not (fully) run — the declared sweep is
    // UNVERIFIED, not accepted and not failed: a control_fault, per the GATE
    // literal's own definition, mirroring the under-covered-verifier gates.
    const d = gate.detail || {}
    return { type: GATE.control_fault, what_happened: `${phaseName} correction round ${gate.rounds}: the class-sweep re-execution did not (fully) run — ${d.reason || 'no hit sets were returned'}. Fail-closed: the correction does not pass on an unexecuted control.`, options: ['re-run the phase', 'investigate the verifier dispatch'], recommendation: 're-run; an unexecuted sweep re-execution is an infrastructure or dispatch fault, not evidence the declared sweep was complete' }
  }
  if (gate.verdict === 'FINDING_SHAPE_FAULT') {
    // The reviewer return violated the findings contract — unknown keys,
    // over-bound fields, or a prescription marker (role-boundary correction
    // C2). The payload was NOT passed onward: a prescription that reaches the
    // corrector's dispatch recreates both the role-boundary violation and the
    // patching-instead-of-rederivation failure in one step. A control_fault,
    // not a review verdict: the round is UNVERIFIED, and re-run is the answer.
    const d = gate.detail || {}
    const what_field = d.field ? ` (field: ${d.field})` : d.keys ? ` (keys: ${d.keys.join(', ')})` : ''
    return { type: GATE.control_fault, what_happened: `${phaseName} review round ${gate.rounds}: the reviewer return violated the findings contract — ${d.kind || 'shape fault'}${what_field} at finding ${typeof d.index === 'number' ? d.index : '?'}. Findings state the standard, the violation, the location, and the premise evidence — never the fix; the payload was withheld from the corrector. Fail-closed: re-run the round.`, options: ['re-run the round', 'investigate the reviewer dispatch'], recommendation: 're-run the round; the corrector re-derives from sources, and a payload that can smuggle prescriptions or prose-bloat past the contract contaminates that re-derivation' }
  }
  if (gate.verdict === 'CORRECTOR_HALTED') {
    const h = gate.halt || {}
    const what = `${phaseName} correction halted at round ${gate.rounds}: ${h.detail || 'the corrector could not act on a finding'}.`
    const dg = await diagnose(what, led, { kind: 'corrector_halted', halt: h, gate: resumePhase, artifact: artifactPath, rounds: gate.history })
    return { type: GATE.non_convergence, what_happened: what, diagnosis: dg, halt: h, findings: lastRoundFindings(gate), options: ['amend the artifact', 'supply the standard the corrector could not verify'], recommendation: 'the corrector stated why it could not proceed — read halt.detail' }
  }
  // NON_CONVERGENCE, and any state not enumerated above: fail closed.
  const what = `${phaseName} review did not converge.`
  const dg = await diagnose(`${phaseName} review did not converge in ${ROUND_CAP} rounds.`, led, { gate: resumePhase, artifact: artifactPath, rounds: gate.history })
  return { type: GATE.non_convergence, what_happened: what, diagnosis: dg, findings: lastRoundFindings(gate), options: ['amend', 'revisit upstream'], recommendation: 'review the diagnosis' }
}
// Pure predicate for the ground-truth sequencing/coherence guard. Extracted as a
// named function so the structural tier can lift and EXECUTE it against constructed
// ledger shapes (same mechanism as runGate for T-22/T-23) - refusals are observed,
// not just asserted as source text.
function groundTruthPreconditions(led, dlt, specPathArg) {
  const specApproved = !!specPathArg && ((led || {}).artifact_index || []).some((a) => a.role === 'spec' && a.path === specPathArg && a.approved_by_owner === true)
  const implArts = ((led || {}).artifact_index || []).concat((dlt || {}).artifacts || []).filter((a) => a.role === 'implementation')
  const implGates = ((led || {}).gate_history || []).concat((dlt || {}).gate_history || []).filter((g) => g.gate === 'implementation')
  const implPassed = implGates.length > 0 && implGates[implGates.length - 1].verdict === 'PASS'
  const ok = specApproved && implPassed && implArts.length > 0
  const why = ok ? '' : !specApproved ? 'the criteria source is not an owner-approved spec registered in this ledger (payload-coherence check; approval happens at the intent gate, so this always spans segments)'
    : !implPassed ? 'the latest implementation review in this ledger is not a PASS, so there is no verified build'
    : 'no implementation artifacts are registered, so there is no build output traceable to the executed plan to target (target-traceability check)'
  return { ok, why, implArts }
}

// Pure predicates for the implementation-completeness gate (premature-completion
// correction, corrections-0.4.0). Extracted as named functions so the structural
// tier can lift and EXECUTE them against constructed shapes — refusals observed,
// not just asserted as source text (same mechanism as groundTruthPreconditions).
//
// recordedPlanFacts: the plan's machine-recorded ground truth (step_ids,
// element_count, files_count), written onto the plan's artifact entry by the plan
// phase's scope check (C1). Latest recorded entry for the plan path wins; a plan
// with no recorded index returns null fields, which the consumer treats as a
// control fault, never an open pass.
function recordedPlanFacts(led, dlt, planPathArg) {
  const entries = (((led || {}).artifact_index) || []).concat(((dlt || {}).artifacts) || [])
    .filter((a) => a && a.role === 'plan' && (!planPathArg || a.path === planPathArg))
  for (let i = entries.length - 1; i >= 0; i--) {
    if (Array.isArray(entries[i].step_ids) && entries[i].step_ids.length)
      return { step_ids: entries[i].step_ids, element_count: entries[i].element_count, files_count: entries[i].files_count }
  }
  return { step_ids: null, element_count: null, files_count: null }
}
// implementationCompleteness: a COMPLETED implementation return must account for
// every recorded plan step. This closes the omission axis the anti-fabrication
// net cannot see — steps never reported, evidence never given. Every refusal
// conditions on status === 'completed', so halted partial returns stay
// expressible; a missing step index is a control fault (fail-closed), because a
// completed claim that cannot be reconciled is unverified, not accepted.
function implementationCompleteness(stepIds, impl) {
  if (!impl || impl.status !== 'completed') return { ok: true }
  if (!Array.isArray(stepIds) || stepIds.length === 0)
    return { ok: false, kind: 'control_fault', reason: 'no plan step index is recorded in the ledger, so a completed claim cannot be reconciled against the plan\'s declared steps' }
  const done = new Set((impl.steps_completed || []).filter((s) => typeof s === 'string'))
  const missing = stepIds.filter((id) => !done.has(id))
  if (missing.length)
    return { ok: false, kind: 'incomplete', missing_steps: missing, reason: `${missing.length} of ${stepIds.length} plan steps are unaccounted for in steps_completed; a completed status with missing steps is a premature completion claim` }
  const ev = Array.isArray(impl.evidence) ? impl.evidence : []
  if (ev.length === 0)
    return { ok: false, kind: 'incomplete', missing_steps: stepIds.slice(), reason: 'a completed status with an empty evidence array carries no verification at all; absence of verification is refused, not passed' }
  const evidenced = new Set(ev.map((e) => e && e.step).filter((s) => typeof s === 'string'))
  const unevidenced = stepIds.filter((id) => !evidenced.has(id))
  if (unevidenced.length)
    return { ok: false, kind: 'incomplete', missing_steps: unevidenced, reason: `${unevidenced.length} of ${stepIds.length} completed plan steps have no evidence entry referencing them (evidence[].step)` }
  return { ok: true }
}

// skillActivationFault (skill-activation-missed C1): verdict on an implement
// return's activation echo. The measured defect was two back-to-back imitations
// of activation — the Step-0 announcement recited, then file reads declared to
// be "the process loaded" — with no Skill call ever made; nothing looked. This
// predicate looks, and fails closed: no echo, or an echo that is not the Skill
// tool result's own launch line, is UNVERIFIED, never accepted. An "Unknown
// skill" error takes precedence over everything (activation was impossible —
// an environment defect, not a compliance failure). An honest halt with a
// stop_report is exempt: its error routes through the STOP-REPORT path. Pure,
// so the structural tier lifts and EXECUTES it (the T-24x mechanism).
function skillActivationFault(impl) {
  const ack = (impl && typeof impl.skill_activation === 'string') ? impl.skill_activation.trim() : ''
  if (/unknown skill/i.test(ack))
    return { kind: 'unknown_skill', reason: 'the Skill call reported "Unknown skill" — expert-dev-tools:expert-implement is not activatable in this environment at all' }
  if (impl && impl.status === 'halted' && impl.stop_report) return null
  if (!ack)
    return { kind: 'unverified', reason: 'the return carries no skill_activation echo, so activation of expert-dev-tools:expert-implement is asserted at best, never demonstrated' }
  if (!/launching skill/i.test(ack))
    return { kind: 'unverified', reason: 'skill_activation does not quote the Skill tool result\'s "Launching skill:" line, so the echo does not demonstrate a real activation' }
  return null
}
// Only an unverified echo earns the single explicit re-dispatch; an "Unknown
// skill" error re-dispatches nothing — retrying an impossible activation is not
// a remedy, and imitation is not a fallback.
const needsActivationRedispatch = (impl) => { const f = skillActivationFault(impl); return !!f && f.kind === 'unverified' }
// The owner gate for each fault kind. unknown_skill is an environment defect
// (the ENVIRONMENT-BLOCKED routing convention: risk_override); a persistently
// unverified echo is a control that could not be confirmed to have run
// (control_fault, fail-closed per the GATE F5-2 principle).
function skillActivationGate(fault) {
  if (fault.kind === 'unknown_skill')
    return { type: GATE.risk_override, what_happened: `Implementer skill activation failed: ${fault.reason}. Halt-not-fallback: executing the plan from an imitation of the skill is not permitted.`, options: ['repair the plugin installation and re-run the implement phase', 'override (accept risk)', 'abort'], recommendation: 'repair the environment; an "Unknown skill" error means activation was impossible, not optional' }
  return { type: GATE.control_fault, what_happened: `Two implement dispatches returned without a verifiable skill_activation echo: ${fault.reason}. The execution is UNVERIFIED, not accepted.`, options: ['re-run the implement phase', 'investigate the implementer dispatch'], recommendation: 're-run; work not demonstrably executed under the packaged skill is unverified, and unverifiable fails closed' }
}

// Same-round sweep re-execution channel (patching-instead-of-rederivation C2).
// Mirrors documentScopeCheck's mechanism: the workflow runtime cannot execute
// searches itself, so the verifier — an agent that did not perform the
// correction — executes every declared pattern over its declared scope and the
// workflow compares the results (via sweepDiscrepancy, inside runGate). Returns
// one hit-location array per declared sweep, in declaration order; returns null
// when the control did not (fully) run — the caller fails closed on null.
async function reExecuteSweeps(rederived) {
  const sweeps = rederived.map((s) => ({
    pattern: s && s.class_sweep && s.class_sweep.pattern,
    scope: s && s.class_sweep && s.class_sweep.scope,
  }))
  const vr = await agent(
    `Sweep re-execution: for EACH declared sweep below, in order, execute its pattern (a regex, Grep syntax) over its scope (a file or glob) against the current working tree, and report exactly one check entry per sweep, in the same order: cited_claim is the pattern, re_execution lists EVERY hit as a location in the grammar path:start-end or path#section (comma-separated; the word "none" when the pattern returns no hits), match true. Execute mechanically — a grep, not judgment — and report every hit, corrected or not. You did not perform the correction these sweeps came from; your hits are the independent record it is checked against. Sweeps: ${JSON.stringify(sweeps)}`,
    { agentType: AGENT.verifier, schema: VERIFIER_SCHEMA, phase: 'Verify', label: 'sweep-rerun' }
  )
  if (verifierUnderCovered(vr, sweeps.length) || vr.checks.length !== sweeps.length) return null
  return vr.checks.map((c) => ((c && c.re_execution) || '').split(/[\s,]+/).filter((t) => LOCATION_RE.test(t)))
}

// Mechanical scope control for the three DOCUMENT phases (S20). The implementation
// phase has had diff-vs-plan since the start; a document phase had nothing, so the
// spec phase's stray scratch-note.txt was caught only because a reviewer happened to
// notice it in round 4. Least privilege applied to write scope (NIST SP 800-53 AC-6):
// a document phase is authorized to write exactly ONE path. Not the full diff-vs-plan
// job — there is no plan yet at the spec phase, so the authorized set is one path.
// A stray file escalates; it never discards the phase's work, and the plugin cannot
// sandbox an agent's writes at runtime, so detection-and-escalation is the control
// available.
// The workflow runtime cannot execute processes (no child_process/spawn - it only
// dispatches agents), so draft C's literal git-status-at-dispatch baseline is not
// implementable here. The adaptation: every document phase's scope-check verifier
// records the authorized artifact's SHA-256 into delta.artifacts, so later phases
// compare against recorded hashes uniformly - prior-segment AND same-segment, both
// edit interleavings - with implementation outputs excluded by the shared role
// predicate (they are test-verified, not hash-pinned).
async function documentScopeCheck(phaseName, resumePhase, artifactPath, led) {
  // Premature-completion correction C1 (producer): at the PLAN phase only, the
  // scope-check verifier additionally records the plan's machine-readable ground
  // truth — the step-decl ID set and the element/files counts — exactly as
  // artifact-sha256 records the hash. The implement phase's completeness gate
  // (C2) and the derived coverage floors (C3) consume these recorded facts.
  const planIndexRequest = resumePhase !== 'plan' ? '' :
    ' Additionally, because the authorized artifact is the PLAN: include three more check entries recording the plan\'s machine-readable ground truth, each with match true. (a) cited_claim exactly "plan-step-index": re_execution lists EVERY step ID (each S<number> token declared on a "step:" line) extracted mechanically from the plan\'s step-decl fenced blocks, comma-separated - a grep, not judgment. (b) cited_claim exactly "plan-element-count": re_execution is the integer count of entries in the plan\'s plan-elements block. (c) cited_claim exactly "plan-files-count": re_execution is the integer count of distinct files in the plan\'s authorized "Files affected" list.'
  const sc = await agent(
    `Document-phase scope check against recorded state. The single artifact this phase was authorized to write is "${artifactPath}". Artifacts with recorded SHA-256 hashes - from the ledger index (recorded at ledger load) and from earlier phases of THIS segment (recorded by each phase's own scope check): ${JSON.stringify((((led || {}).artifact_index || []).concat(delta.artifacts || [])).filter((a) => a.sha256 && isHashPinnedRole(a) && a.path !== artifactPath).map((a) => ({ path: a.path, sha256: a.sha256 })))}. Rules, in order: (1) a changed/untracked file that IS the authorized path - authorized; (2) a hash-listed artifact whose CURRENT hash still equals its recorded hash - unchanged residue, report as residue, not a violation; (3) a hash-listed artifact whose current hash DIFFERS from its recorded hash - an unauthorized upstream edit (prior segment or earlier this segment, either interleaving), a VIOLATION; (4) the orchestrator's .claude/expert bookkeeping files - bookkeeping, not a violation; (5) any other changed file - a VIOLATION. Compute the hashes yourself and report the comparison per file. Additionally: ALWAYS include one extra check entry whose cited_claim is exactly "artifact-sha256", whose match is true, and whose re_execution contains the current SHA-256 hex digest of the authorized artifact "${artifactPath}" - this records the artifact's hash for later phases' scope checks. The authorized set is one path - not a plan's Files-affected list.${planIndexRequest}`,
    { agentType: AGENT.verifier, schema: VERIFIER_SCHEMA, phase: 'Verify', label: 'doc-scope' }
  )
  if (verifierUnderCovered(sc, 1)) return underCoveredVerifierGate(`${phaseName} scope-check`, resumePhase, (sc && sc.checks || []).length, 1)
  const checks = sc.checks
  // Record the verifier-computed hash on this phase's artifact entry, so later
  // phases' scope checks compare against it (the workflow cannot hash; the
  // dispatched verifier can - this is the round-3 primary remedy, implemented
  // at the only point in the pipeline that can execute a hash).
  const hashEntry = checks.find((c) => c.cited_claim === 'artifact-sha256')
  const hex = hashEntry && /[0-9a-f]{64}/.exec(hashEntry.re_execution || '')
  if (!hex) {
    // F5-1: without a recorded hash, this artifact would fall to the catch-all
    // VIOLATION rule at the NEXT phase's scope check - a delayed false halt.
    // Fail closed here instead, where the cause (the verifier not returning the
    // requested hash entry) is visible and re-runnable.
    delta.phase = resumePhase
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.control_fault, what_happened: `The ${phaseName} scope-check verifier did not return the required artifact-sha256 entry for ${artifactPath}, so later phases could not distinguish this artifact from an unauthorized edit.`, options: ['re-run the phase', 'investigate the verifier dispatch'], recommendation: 're-run; the hash record is what keeps later scope checks honest' } })
  }
  const mine = (delta.artifacts || []).find((a) => a.path === artifactPath)
  if (mine && !mine.sha256) mine.sha256 = hex[0]
  // C1 (consumer side): parse the three plan-index entries into the plan's
  // artifact entry. Missing or unparseable entries fail closed as control_fault,
  // mirroring the artifact-sha256 logic above — a plan without a recorded step
  // index would make every later "completed" claim unverifiable (C2 refuses it).
  const RECORD_CLAIMS = new Set(['plan-step-index', 'plan-element-count', 'plan-files-count'])
  if (resumePhase === 'plan') {
    const rec = (name) => checks.find((c) => c.cited_claim === name)
    const stepEntry = rec('plan-step-index')
    const stepIds = stepEntry ? [...new Set((stepEntry.re_execution || '').match(/\bS\d+\b/g) || [])] : []
    const intOf = (name) => { const e = rec(name); const m = e && /\d+/.exec(e.re_execution || ''); return m ? parseInt(m[0], 10) : NaN }
    const elementCount = intOf('plan-element-count')
    const filesCount = intOf('plan-files-count')
    if (!stepIds.length || !Number.isInteger(elementCount) || elementCount < 1 || !Number.isInteger(filesCount) || filesCount < 1) {
      delta.phase = resumePhase
      return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.control_fault, what_happened: `The ${phaseName} scope-check verifier did not return a parseable plan-step-index / plan-element-count / plan-files-count record for ${artifactPath}, so the implement phase would have no recorded ground truth to reconcile a completed claim against.`, options: ['re-run the phase', 'investigate the verifier dispatch'], recommendation: 're-run; the recorded step index is what makes a later completed claim verifiable' } })
    }
    if (mine) { mine.step_ids = stepIds; mine.element_count = elementCount; mine.files_count = filesCount }
  }
  const violations = checks.filter((c) => c.match === false && c.cited_claim !== 'artifact-sha256' && !RECORD_CLAIMS.has(c.cited_claim))
  if (!violations.length) return null
  delta.phase = resumePhase
  const dg = await diagnose(
    `${phaseName} phase wrote outside its authorized artifact path (scope violation).`,
    led,
    { checks: sc.checks, phase: resumePhase, authorized: artifactPath }
  )
  return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: `The ${phaseName} phase changed a file outside the single artifact it was authorized to write (${artifactPath}).`, diagnosis: dg, findings: [], options: ['accept the extra file', 'revert the extra file'], recommendation: 'review the diagnosis' } })
}
async function maybeNonConvergence(gate, phaseName, resumePhase, led, artifactPath) {
  if (gate.verdict === 'PASS') return null
  delta.phase = resumePhase
  return report(finish(), { outcome: 'owner_gate', gate: await gateEscalation(gate, phaseName, resumePhase, artifactPath, led) })
}
