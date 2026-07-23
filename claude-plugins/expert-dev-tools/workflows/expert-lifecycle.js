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
}
const ROUND_CAP = 5
const LENSES = ['correctness', 'security', 'faithfulness-to-plan']
// The six owner-gate types — exactly the spec 3.4 escalation list; the script
// has no other path to the owner.
const GATE = {
  intent: 'intent',
  spec_traceable: 'spec_traceable',
  business: 'business',
  risk_override: 'risk_override',
  non_convergence: 'non_convergence',
  core_approval: 'core_approval',
}

// ---------------------------------------------------------------------------
// Schemas (kept to the load-bearing fields per architecture C4)
// ---------------------------------------------------------------------------
const S_STR = { type: 'string' }
const EVIDENCE = {
  type: 'array',
  items: {
    type: 'object',
    required: ['claim_type', 'tool', 'citation', 'result'],
    properties: { claim_type: S_STR, tool: S_STR, citation: S_STR, result: S_STR },
  },
}
const PHASE_SCHEMA = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string', enum: ['completed', 'halted'] },
    artifact_path: S_STR,
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
  required: ['status'],
  properties: {
    status: { type: 'string', enum: ['completed', 'halted'] },
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
        required: ['classification', 'standard'],
        properties: { classification: S_STR, standard: S_STR, premise_evidence: S_STR, location: S_STR },
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

// One review gate: fresh reviewer each round; up to ROUND_CAP rounds; on
// NEEDS_FIXES the artifact is remediated and re-reviewed; a cap breach returns
// NON_CONVERGENCE (the caller escalates). `multiLens` runs the three-lens panel
// for the implementation-PASS gate — all lenses must PASS.
async function runGate({ reviewFn, remediateFn, multiLens }) {
  const history = []
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
    if (verdict === 'PASS') return { verdict: 'PASS', rounds: round, history }
    await remediateFn(findings, round)
  }
  return { verdict: 'NON_CONVERGENCE', rounds: ROUND_CAP, history }
}

// Diagnose a non-routine failure (or run the feedback sweep). Diagnosis always
// precedes routing (architecture D13).
async function diagnose(failureDescription, ledger) {
  const out = await agent(
    `Failure mode. Diagnose this non-routine failure and draft a correction.\n` +
      `Failure: ${failureDescription}\nLedger snapshot: ${JSON.stringify(ledger)}`,
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
const specPath = input.spec_path || (input.artifacts && input.artifacts.spec) || 'docs/specs/spec.md'
const archPath = input.arch_path || (input.artifacts && input.artifacts.architecture) || 'docs/arch/architecture.md'
const planPath = input.plan_path || (input.artifacts && input.artifacts.plan) || 'docs/plans/plan.md'
const seed = (ledger.revision | 0) + 1
const readerScript = input.reader_script || 'scripts/extract-owner-turns.mjs'
const transcriptDir = input.transcript_dir || ''

const delta = { phase: ledger.phase, artifacts: [], gate_history: [], amendments: [], budget: { total_tokens: 0 } }
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
if (failedCorr) {
  feedbackEsc = { kind: 'failed_correction', disposition: failedCorr, responsible_component: failedCorr.responsible_component, remediation: 'none' }
} else if (sysDefect) {
  const dg = await diagnose(`Systemic defect from repeat owner feedback: ${JSON.stringify(sysDefect)}`, ledger)
  feedbackEsc = { kind: 'systemic_defect', disposition: sysDefect, diagnosis: dg, responsible_component: sysDefect.responsible_component }
}

let cursor = ledger.phase || 'intake'
if (cursor === 'intake') cursor = 'spec'

// ---- SPEC ---------------------------------------------------------------
if (cursor === 'spec') {
  phase('Spec')
  const specOut = await agent(
    `Write the specification for this task.\nTask: ${task}`,
    { agentType: AGENT.spec, schema: PHASE_SCHEMA, phase: 'Spec', label: 'spec' }
  )
  if (!specOut || specOut.status === 'halted') {
    const d = specOut && specOut.halt ? specOut.halt : { detail: 'spec phase produced no output' }
    delta.phase = 'spec'
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: d.detail, options: d.options || [], recommendation: d.recommendation || '' } })
  }
  const gate = await runGate({
    reviewFn: (round) => agent(`Review the spec at ${specPath} against the task and named standards. Round ${round}.`, { agentType: AGENT.reviewer, schema: VERDICT_SCHEMA, phase: 'Review', label: `review:spec:r${round}` }),
    remediateFn: (findings) => agent(`Revise the spec at ${specPath} to resolve these findings, then re-verify: ${JSON.stringify(findings)}`, { agentType: AGENT.spec, schema: PHASE_SCHEMA, phase: 'Spec', label: 'revise:spec' }),
    multiLens: false,
  })
  record('spec', gate)
  if (gate.verdict === 'NON_CONVERGENCE') {
    const dg = await diagnose(`Spec review did not converge in ${ROUND_CAP} rounds.`, ledger)
    delta.phase = 'spec'
    const lastFindings = (gate.history[gate.history.length - 1] || {}).findings || []
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.non_convergence, what_happened: 'Spec review did not converge.', diagnosis: dg, findings: lastFindings, options: ['amend spec', 'revisit task'], recommendation: 'review the diagnosis' } })
  }
  // Spec PASS -> the one intent gate. The command advances phase to 'architecture' on owner
  // approval (S-5); the workflow does not claim the transition here.
  delta.phase = 'spec'
  delta.artifacts.push({ role: 'spec', path: specPath })
  return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.intent, what_happened: `A specification for "${task}" passed independent review. Confirm it is what you meant before design begins.`, artifact: specPath, options: ['approve', 'request changes'], recommendation: 'read the spec and approve if it matches your intent' } })
}

// After intent approval the command re-invokes with phase='architecture'.
// The remaining phases run through to completion unless an escalation fires.

// ---- ARCHITECTURE -------------------------------------------------------
if (cursor === 'architecture') {
  phase('Architecture')
  const out = await agent(`Produce the architecture from the approved spec at ${specPath}.`, { agentType: AGENT.architect, schema: PHASE_SCHEMA, phase: 'Architecture', label: 'architecture' })
  const esc = maybeEscalate(out, 'architecture')
  if (esc) return esc
  delta.artifacts.push({ role: 'architecture', path: archPath })
  const gate = await runGate({
    reviewFn: (round) => agent(`Review the architecture at ${archPath} against the spec at ${specPath} and named standards. Round ${round}.`, { agentType: AGENT.reviewer, schema: VERDICT_SCHEMA, phase: 'Review', label: `review:arch:r${round}` }),
    remediateFn: (findings) => agent(`Revise the architecture at ${archPath} to resolve these findings: ${JSON.stringify(findings)}`, { agentType: AGENT.architect, schema: PHASE_SCHEMA, phase: 'Architecture', label: 'revise:arch' }),
    multiLens: false,
  })
  record('architecture', gate)
  const nc = await maybeNonConvergence(gate, 'Architecture', 'architecture', ledger)
  if (nc) return nc
  cursor = 'plan'
}

// ---- PLAN ---------------------------------------------------------------
if (cursor === 'plan') {
  phase('Plan')
  const out = await agent(`Produce the implementation plan from the spec at ${specPath} and architecture at ${archPath}.`, { agentType: AGENT.planner, schema: PHASE_SCHEMA, phase: 'Plan', label: 'plan' })
  const esc = maybeEscalate(out, 'plan')
  if (esc) return esc
  delta.artifacts.push({ role: 'plan', path: planPath })
  const gate = await runGate({
    reviewFn: (round) => agent(`Review the plan at ${planPath} against the spec and architecture and named standards. Round ${round}.`, { agentType: AGENT.reviewer, schema: VERDICT_SCHEMA, phase: 'Review', label: `review:plan:r${round}` }),
    remediateFn: (findings) => agent(`Revise the plan at ${planPath} to resolve these findings: ${JSON.stringify(findings)}`, { agentType: AGENT.planner, schema: PHASE_SCHEMA, phase: 'Plan', label: 'revise:plan' }),
    multiLens: false,
  })
  record('plan', gate)
  const nc = await maybeNonConvergence(gate, 'Plan', 'plan', ledger)
  if (nc) return nc
  cursor = 'implement'
}

// ---- IMPLEMENT + review + verify + ground truth -------------------------
if (cursor === 'implement') {
  phase('Implement')
  const impl = await agent(`Execute the approved plan at ${planPath} end to end.`, { agentType: AGENT.implementer, schema: IMPLEMENT_SCHEMA, phase: 'Implement', label: 'implement' })

  // STOP REPORT routing (architecture D6): amend-plan is automatic; override is
  // never machine-selected; hard-rule and environment blocks escalate.
  if (impl && impl.status === 'halted' && impl.stop_report) {
    const cat = impl.stop_report.category
    const dg = await diagnose(`Implementer STOP (${cat}): ${JSON.stringify(impl.stop_report)}`, ledger)
    if (cat === 'HARD-RULE-CONFLICT' || cat === 'ENVIRONMENT-BLOCKED') {
      delta.phase = 'implement'
      const gtype = cat === 'ENVIRONMENT-BLOCKED' ? GATE.risk_override : GATE.spec_traceable
      return report(finish(), { outcome: 'owner_gate', gate: { type: gtype, what_happened: impl.stop_report.observed || cat, diagnosis: dg, correction_draft: dg && dg.correction_draft, options: ['amend', 'override (accept risk)', 'abort'], recommendation: 'review the diagnosis' } })
    }
    // PREMISE-FALSE / BLAST-RADIUS -> auto amend-plan -> re-implement (remediation
    // goes through the planner then the implementer; reviewed like any change).
    await agent(`Amend the plan at ${planPath} per this diagnosis, then re-verify: ${JSON.stringify(dg)}`, { agentType: AGENT.planner, schema: PHASE_SCHEMA, phase: 'Plan', label: 'amend:plan' })
    await agent(`Execute the amended plan at ${planPath}.`, { agentType: AGENT.implementer, schema: IMPLEMENT_SCHEMA, phase: 'Implement', label: 're-implement' })
  }

  // Implementation review — multi-lens panel on the PASS round.
  const gate = await runGate({
    reviewFn: (round, lens) => agent(`Review the implementation diff against the plan at ${planPath}${lens ? ` through the ${lens} lens` : ''}. Round ${round}.`, { agentType: AGENT.reviewer, schema: VERDICT_SCHEMA, phase: 'Review', label: `review:impl:${lens || 'x'}:r${round}` }),
    remediateFn: (findings) => agent(`Route these implementation findings to a remediation plan, then re-implement under review: ${JSON.stringify(findings)}`, { agentType: AGENT.planner, schema: PHASE_SCHEMA, phase: 'Plan', label: 'remediate:impl' }),
    multiLens: true,
  })
  record('implementation', gate)
  const nc = await maybeNonConvergence(gate, 'Implementation', 'implement', ledger)
  if (nc) return nc

  // Anti-fabrication spot re-run over a deterministic sample of cited evidence.
  const cited = (impl && impl.evidence) || []
  const idx = sampleIndices(cited.length, seed)
  if (idx.length) {
    const sample = idx.map((i) => cited[i])
    const vr = await agent(`Spot re-run: re-execute each cited verification and report match/mismatch. Cited: ${JSON.stringify(sample)}`, { agentType: AGENT.verifier, schema: VERIFIER_SCHEMA, phase: 'Verify', label: 'spot-rerun' })
    const fabricated = vr && (vr.checks || []).some((c) => c.match === false)
    if (fabricated) {
      const dg = await diagnose('A cited verification did not reproduce on spot re-run (fabricated compliance).', ledger)
      delta.phase = 'implement'
      return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: 'A cited verification could not be reproduced.', diagnosis: dg, options: ['re-run phase', 'investigate'], recommendation: 'review the diagnosis' } })
    }
  }

  // diff-vs-plan mechanical check
  const dvp = await agent(`Diff-vs-plan: compare git-changed files against the plan's authorized "Files affected" at ${planPath}. Report violations in either direction.`, { agentType: AGENT.verifier, schema: VERIFIER_SCHEMA, phase: 'Verify', label: 'diff-vs-plan' })
  if (dvp && (dvp.checks || []).some((c) => c.match === false)) {
    const dg = await diagnose('A changed file is outside the plan\'s authorized set (scope violation).', ledger)
    delta.phase = 'implement'
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: 'An out-of-plan file change was detected.', diagnosis: dg, options: ['amend plan', 'revert change'], recommendation: 'review the diagnosis' } })
  }
  cursor = 'ground_truth'
}

// ---- GROUND TRUTH + reconciliation --------------------------------------
if (cursor === 'ground_truth') {
  phase('Ground truth')
  const acc = await agent(`Execute each of the spec's acceptance criteria against the running system and report per-criterion pass/fail with observed evidence.`, { agentType: AGENT.acceptance, schema: ACCEPTANCE_SCHEMA, phase: 'Ground truth', label: 'ground-truth' })
  const failed = acc && (acc.criteria || []).filter((c) => c.verdict === 'fail')
  if (failed && failed.length) {
    const dg = await diagnose(`Ground-truth failure: ${JSON.stringify(failed)}`, ledger)
    delta.phase = 'ground_truth'
    const traceable = dg && dg.classification === 'owner_owned'
    return report(finish(), { outcome: 'owner_gate', gate: { type: traceable ? GATE.spec_traceable : GATE.non_convergence, what_happened: `${failed.length} acceptance criterion(s) failed against the running system.`, diagnosis: dg, correction_draft: dg && dg.correction_draft, options: ['amend', 'investigate'], recommendation: 'review the diagnosis' } })
  }
  phase('Verify')
  const recon = await agent(`Whole-chain reconciliation: map every in-scope spec requirement to its implementing diff and verifying evidence, and every diff hunk to its authorizing plan step at ${planPath}. Report anything unmapped in either direction.`, { agentType: AGENT.verifier, schema: VERIFIER_SCHEMA, phase: 'Verify', label: 'reconciliation' })
  if (recon && (recon.checks || []).some((c) => c.match === false)) {
    const dg = await diagnose('Whole-chain reconciliation found an unmapped requirement or diff hunk.', ledger)
    delta.phase = 'ground_truth'
    return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.spec_traceable, what_happened: 'Reconciliation found an unmapped item.', diagnosis: dg, options: ['amend', 'investigate'], recommendation: 'review the diagnosis' } })
  }
  cursor = 'closeout'
}

// ---- CLOSEOUT -----------------------------------------------------------
if (cursor === 'closeout') {
  phase('Closeout')
  const co = await agent(`Closeout: write the final report against the spec, commit the verified work and open a PR per repo conventions, and DRAFT (do not send) a CORE ingestion message. Return report path, commit, PR URL, and the CORE draft.`, { agentType: AGENT.closeout, schema: CLOSEOUT_SCHEMA, phase: 'Closeout', label: 'closeout' })
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
async function maybeNonConvergence(gate, phaseName, resumePhase, led) {
  if (gate.verdict !== 'NON_CONVERGENCE') return null
  delta.phase = resumePhase
  const dg = await diagnose(`${phaseName} review did not converge in ${ROUND_CAP} rounds.`, led)
  const lastFindings = (gate.history[gate.history.length - 1] || {}).findings || []
  return report(finish(), { outcome: 'owner_gate', gate: { type: GATE.non_convergence, what_happened: `${phaseName} review did not converge.`, diagnosis: dg, findings: lastFindings, options: ['amend', 'revisit upstream'], recommendation: 'review the diagnosis' } })
}
