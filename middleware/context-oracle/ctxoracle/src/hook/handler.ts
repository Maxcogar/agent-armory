// Per-event pipeline (Step 28, AD-7, AD-8's fixed order). Exit 0 always; any
// error or watchdog fire yields empty output plus a JSONL fault — never a deny,
// never a whisper.
//
// WALKING SKELETON (2026-09-25). Provisional choices are marked `SKELETON: G<n>`
// and listed in docs/implementation-log.md.
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EventKind, EventContext } from '../types/events.js';
import type { Candidate } from '../types/candidate.js';
import { openStore, type Store } from '../stores/adapter.js';
import { ctxoracleHome } from '../identity/home.js';
import { ensureLayout } from '../identity/layout.js';
import { resolveRepoKey } from '../identity/repo_key.js';
import { isInternal } from './guard.js';
import { createDeadline, DeadlineExceeded } from './watchdog.js';
import { toInternalEvent, toHookResponse, bashCommandOf, type InternalResponse } from './adapter.js';
import { recordFault } from '../diag/fault_writer.js';
import { appendFault } from '../diag/jsonl.js';
import { writeSessionEvent } from '../diag/session_writer.js';
import { tuningReader } from '../stores/dao/tuning.js';
import { schemaMetaDao } from '../stores/dao/schema_meta.js';
import { observedActionsDao } from '../stores/dao/observed_actions.js';
import { whisperAuditDao } from '../stores/dao/whisper_audit.js';
import { refreshIfStale } from '../index/indexer.js';
import { reconcileDedupOnSessionStart, updateReadSet, perConsumerDedup, recordDelivered, deliverStop } from './delivery.js';
import { compose } from './compose.js';
import { passesBar, confidenceOf } from '../bar/combinator.js';
import { classifyBashCommand } from '../genres/command_class.js';
import { intakeFromPrompt, catchUpTranscript, decideDeny, handleSessionStart, outstandingQuestionLine } from '../blocks/answer_drift.js';
import { checkDenyAfterAnswerLag, checkDenyLoop, checkDenyBypassSuspect, pathWriteTarget } from '../blocks/health.js';
import { orientationGenerator } from '../genres/orientation.js';
import { couplingGenerator } from '../genres/coupling.js';
import { reuseGenerator } from '../genres/reuse.js';
import { consequenceGenerator } from '../genres/consequence.js';
import { warningGenerator } from '../genres/warning.js';
import { completenessGenerator } from '../genres/completeness.js';
import { verificationGenerator, recognizeDoneClaim } from '../genres/verification.js';
import { oracleSpawn } from '../util/spawn.js';
import { foldWhisperStats } from '../diag/whisper_stats_fold.js';
import type { ObservedActionsReader } from '../types/events.js';
import { consumerKey, consumerRole } from '../types/consumer.js';

const GENERATORS = [
  orientationGenerator,
  couplingGenerator,
  reuseGenerator,
  consequenceGenerator,
  warningGenerator,
  completenessGenerator,
  verificationGenerator,
];

export interface HandlerResult {
  stdout: string;
}

function repoRoot(cwd: string): string {
  // SKELETON: G30 — finding the repository from `cwd`. The resolver below runs
  // git subprocesses, which AD-23's event-path inventory does not allow; the
  // hook command `init` writes carries no repo key.
  let dir = cwd;
  for (;;) {
    if (existsSync(path.join(dir, '.git'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return cwd;
    dir = up;
  }
}

export function runHandler(stdin: string, kindArg: EventKind, opts: { deadlineMs?: number } = {}): HandlerResult {
  if (isInternal()) return { stdout: '' };
  const deadline = createDeadline(opts.deadlineMs !== undefined ? { ms: opts.deadlineMs } : {});
  const home = ctxoracleHome();
  let store: Store | null = null;
  let global: Store | null = null;
  let diagnosticsDir = path.join(home, 'diagnostics-orphan');
  const started = Date.now();
  let ev: ReturnType<typeof toInternalEvent> | null = null;
  try {
    ev = toInternalEvent(JSON.parse(stdin) as Record<string, unknown>, kindArg);
    const repoPath = repoRoot(ev.workingDir);
    const key = resolveRepoKey(repoPath).key;
    const layout = ensureLayout(home, key);
    diagnosticsDir = layout.diagnostics;
    if (!existsSync(layout.project) || !existsSync(layout.global)) return { stdout: '' }; // not initialized: fail open
    store = openStore(layout.project);
    global = openStore(layout.global);
    const projectStore = store;
    const t = tuningReader(global, key, (k) =>
      recordFault(projectStore, diagnosticsDir, { code: 'tuning_missing', detail: { key: k } })
    );
    const meta = schemaMetaDao(store);
    // SKELETON: 1R — Step 6's consumer key (one agent in one session, AD-4) and
    // the role derived from it for FR-O6's main-only scope; retired by Step 28
    const consumer = consumerKey(ev.session, ev.agentId);
    const role = consumerRole(consumer);
    const oa = observedActionsDao(store);
    // SKELETON: 1R — stands in for the session's observed-actions reader (Step
    // 6's reshaped ObservedActionsReader); nothing reads it while every
    // generator returns []; retired by Step 28
    const reader: ObservedActionsReader = {
      okEditedPaths: () => [],
      runs: () => [],
      firstHash: () => undefined,
      hashesFor: () => [],
      pathWrites: () => [],
    };
    const rawTarget = ev.targetPathRaw;
    const ctx: EventContext = {
      ...ev,
      consumer,
      role,
      // SKELETON: 1R — EventContext's new members with the §9 stand-ins:
      // repoRoot = checkoutRoot = the skeleton's repository path, isWorktree
      // false, historyAvailable false, indexStale and historyStale false, refTs =
      // the stored ref_ts or 0, tuning = Step 12's tuningReader; targetPath is
      // the skeleton's cwd-relative normalization (N3 unfixed), resultPaths []
      // and context 'read', and recordDrop records Step 6's
      // whisper_dropped_unverifiable (all unread while every generator returns
      // []); retired by Step 28
      repoRoot: repoPath,
      checkoutRoot: repoPath,
      isWorktree: false,
      repoKey: key,
      targetPath:
        rawTarget === undefined ? undefined : path.isAbsolute(rawTarget) ? path.relative(ev.workingDir, rawTarget) : rawTarget,
      resultPaths: [],
      context: 'read',
      refTs: Number(meta.get('ref_ts') ?? 0),
      indexStale: false,
      historyStale: false,
      historyAvailable: false,
      tuning: t,
      observed: reader,
      recordDrop: (genre, subjectKey, reason) =>
        recordFault(projectStore, diagnosticsDir, {
          code: 'whisper_dropped_unverifiable',
          detail: { genre, subjectKey, reason },
        }),
    };
    let response: InternalResponse = {};

    // 4. SessionStart
    if (ev.kind === 'SessionStart') {
      let bytes = 0;
      try {
        bytes = statSync(ev.transcriptPath).size;
      } catch {
        // transcript not written yet
      }
      writeSessionEvent(store, {
        session: ev.session,
        consumer,
        event_type: 'liveness',
        ts: Date.now(),
        detail_json: JSON.stringify({ transcriptPath: ev.transcriptPath, transcriptBytes: bytes }),
      });
      reconcileDedupOnSessionStart(store, consumer, ev.startSource ?? 'startup');
      handleSessionStart(store, consumer, ev.startSource ?? 'startup');
      if (refreshIfStale(store, repoPath, diagnosticsDir).stale) {
        const dispatch = fileURLToPath(new URL('../cli/dispatch.js', import.meta.url));
        oracleSpawn(process.execPath, [dispatch, 'index'], { cwd: repoPath, detached: true }).unref();
      }
    }
    deadline.check();

    // 5. Question intake
    if (ev.kind === 'UserPromptSubmit' && role === 'main' && ev.promptText !== undefined) {
      intakeFromPrompt(store, consumer, ev.promptText, t);
    }

    // 6. Transcript catch-up + health (main consumer only, AD-11)
    if (role === 'main' && ev.transcriptPath !== '' && existsSync(ev.transcriptPath)) {
      const cu = catchUpTranscript(store, diagnosticsDir, consumer, ev.transcriptPath, t, {
        expired: () => {
          try {
            deadline.check();
            return false;
          } catch {
            return true;
          }
        },
      });
      checkDenyAfterAnswerLag(store, diagnosticsDir, consumer, cu.newTurns);
      checkDenyLoop(store, diagnosticsDir, consumer, t);
    }
    deadline.check();

    // 7. Block check
    if (ev.kind === 'PreToolUse' && ev.toolName !== undefined) {
      const v = decideDeny(store, ev.session, consumer, ev.toolName, ctx.targetPath);
      if (v !== null) response = { deny: v };
    }

    // 8. PostToolUse bookkeeping
    if (ev.kind === 'PostToolUse' || ev.kind === 'PostToolUseFailure') {
      const cmd = ev.toolName === 'Bash' ? bashCommandOf(ev.toolInput) : undefined;
      const cls =
        cmd === undefined
          ? null
          : classifyBashCommand(cmd, t.list('lexicon.command_class_test_runners'), t.list('lexicon.command_class_innocuous')).class;
      oa.append({
        session: ev.session,
        consumer,
        tool: ev.toolName ?? 'unknown',
        path: cmd !== undefined ? pathWriteTarget(cmd) : (ctx.targetPath ?? null),
        command_class: cls,
        outcome: ev.kind === 'PostToolUse' ? 'ok' : 'failed',
        ts: Date.now(),
      });
      if (ev.kind === 'PostToolUse') updateReadSet(store, consumer, ev.toolName ?? '', ctx.targetPath);
      if (cmd !== undefined && ev.kind === 'PostToolUse') checkDenyBypassSuspect(store, diagnosticsDir, consumer, cmd);
    }
    deadline.check();

    // 9. Candidates → bar → dedup → compose → audit-then-emit
    if (!('deny' in response)) {
      const cands: Candidate[] = GENERATORS.filter((g) => g.triggerEvents.includes(ev!.kind)).flatMap((g) => g.candidates(ctx, store!, t));
      const texts: { text: string; c: Candidate; conf: number }[] = [];
      for (const c of cands) {
        deadline.check();
        if (!passesBar(c, t, { indexStale: ctx.indexStale, historyStale: ctx.historyStale }).passes) continue;
        if (!perConsumerDedup(store, consumer, c)) continue;
        const conf = confidenceOf(c, t, { indexStale: ctx.indexStale, historyStale: ctx.historyStale });
        const out = compose(c, repoPath, store, conf);
        if ('dropped' in out) {
          // SKELETON: 1R — the removed whisper_dropped_stale is recorded as
          // whisper_dropped_unverifiable with the compose drop reason; retired by
          // Step 28
          recordFault(store, diagnosticsDir, {
            code: 'whisper_dropped_unverifiable',
            detail: { genre: c.genre, subjectKey: c.subjectKey, reason: out.dropped },
          });
          continue;
        }
        texts.push({ text: out.text, c, conf });
      }
      let body = texts.map((x) => x.text).join('\n');
      if (ev.kind === 'Stop' || ev.kind === 'SubagentStop') {
        const done = recognizeDoneClaim(ev.lastAssistantMessage ?? '', t.list('lexicon.completion_claim'));
        const line = outstandingQuestionLine(store, consumer, done);
        if (line !== null) body = body.length > 0 ? `${body}\n${line}` : line;
        const sd = deliverStop(body, ev.stopHookActive === true);
        response = sd === null ? {} : { context: sd.context };
      } else if (body.length > 0 && ev.kind !== 'SessionStart') {
        response = { context: body };
      }
      if ('context' in response) {
        // Audit-log-then-emit: the audit row must exist before anything is emitted.
        const audit = whisperAuditDao(store);
        for (const x of texts)
          audit.append({ session: ev.session, consumer, kind: 'whisper', genre: x.c.genre, ts: Date.now(), text: x.text, evidence_json: x.c.evidenceJson, confidence: x.conf });
        for (const x of texts) recordDelivered(store, consumer, x.c.subjectKey);
      }
    }

    // 10. SessionEnd: the whisper_stats fold (Step 30).
    // SKELETON: G32 — the regret proxy is not built: it needs a post-write
    // content_hash per edit, which nothing on the event path records.
    if (ev.kind === 'SessionEnd') foldWhisperStats(global, store, key);

    // 11. Diagnostics row
    writeSessionEvent(store, {
      session: ev.session,
      consumer,
      event_type: ev.kind,
      ts: Date.now(),
      latency_ms: Date.now() - started,
      outcome: 'deny' in response ? 'deny' : 'context' in response ? 'whisper' : 'silent',
    });
    const out = toHookResponse(response, ev.kind);
    return { stdout: Object.keys(out).length === 0 ? '' : JSON.stringify(out) };
  } catch (e) {
    const code = e instanceof DeadlineExceeded ? 'latency_breach' : 'store_corrupt';
    // SKELETON: G31 — no fault code exists for "the handler threw"; any error is
    // recorded under store_corrupt unless it was the watchdog.
    try {
      if (store !== null) recordFault(store, diagnosticsDir, { code, detail: { error: String(e) }, session: ev?.session });
      else appendFault(diagnosticsDir, { code, detail: { error: String(e) }, session: ev?.session });
    } catch {
      // nothing more to do on the event path
    }
    return { stdout: '' };
  } finally {
    store?.close();
    global?.close();
  }
}
