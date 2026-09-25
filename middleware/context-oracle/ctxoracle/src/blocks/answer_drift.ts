// The answer-drift block (Steps 25, 27; AD-9, AD-10, OL-C3, OL-C5, D-41, D-plan-27).
// Phase A's only verdict caller. WALKING SKELETON.
import type { Store } from '../stores/adapter.js';
import type { TuningReader } from '../types/candidate.js';
import { TranscriptReader, TranscriptLayoutChanged } from '../transcript/reader.js';
import { recognizeQuestions, recognizeClearing, recognizeMove } from '../qa/classify.js';
import {
  openQuestion,
  getOpenQuestions,
  answerQuestions,
  advanceBookmark,
  getBookmark,
  expireOnStartup,
} from '../qa/state.js';
import { questionsDao } from '../stores/dao/questions.js';
import { classifiedTurnsDao } from '../stores/dao/classified_turns.js';
import { whisperAuditDao } from '../stores/dao/whisper_audit.js';
import { recordFault } from '../diag/fault_writer.js';
import { makeDenyVerdict, type DenyVerdict } from './verdict.js';

export function intakeFromPrompt(store: Store, consumer: string, promptText: string, t: TuningReader): number {
  let opened = 0;
  for (const q of recognizeQuestions(promptText, t.list('lexicon.stoplist'))) {
    if (openQuestion(store, { consumer, questionText: q.questionText, contentHash: q.contentHash }) !== 'already_open') opened += 1;
  }
  return opened;
}

export interface CatchUpResult {
  humanTurns: number;
  assistantTurns: number;
  cleared: number;
  unrecognized: number;
  newTurns: { uuid: string; ts: number; clears: boolean }[];
  layoutChanged: boolean;
}

export function catchUpTranscript(
  store: Store,
  diagnosticsDir: string,
  consumer: string,
  transcriptPath: string,
  t: TuningReader,
  deadline: { expired(): boolean }
): CatchUpResult {
  const res: CatchUpResult = { humanTurns: 0, assistantTurns: 0, cleared: 0, unrecognized: 0, newTurns: [], layoutChanged: false };
  const bm = getBookmark(store, consumer);
  let read;
  try {
    read = TranscriptReader.readFrom(transcriptPath, bm?.offset ?? 0);
  } catch (e) {
    if (e instanceof TranscriptLayoutChanged) {
      // Frozen open, never frozen cleared (AD-11): open questions keep holding.
      recordFault(store, diagnosticsDir, { code: 'transcript_layout_changed', detail: { message: e.message } });
      res.layoutChanged = true;
      return res;
    }
    throw e;
  }
  const qdao = questionsDao(store);
  const turns = classifiedTurnsDao(store);
  const stoplist = t.list('lexicon.stoplist');
  let lastOffset = bm?.offset ?? 0;
  let lastUuid = bm?.uuid ?? null;
  for (const { entry, endOffset } of read.entries) {
    if (deadline.expired()) {
      recordFault(store, diagnosticsDir, { code: 'catchup_incomplete', detail: { offset: lastOffset } });
      break;
    }
    const d = TranscriptReader.discriminateEntry(entry);
    const ts = 'timestamp' in d ? Date.parse(d.timestamp) || Date.now() : Date.now();
    if (d.kind === 'human') {
      res.humanTurns += 1;
      const open = qdao.openFor(consumer);
      if (!open.some((q) => q.asked_uuid === d.uuid)) {
        for (const q of recognizeQuestions(d.text, stoplist)) {
          const intake = open.find((o) => o.content_hash === q.contentHash && o.asked_uuid === null);
          if (intake !== undefined) qdao.backfill(intake.id, d.uuid, endOffset);
          else openQuestion(store, { consumer, questionText: q.questionText, contentHash: q.contentHash, askedUuid: d.uuid, askedOffset: endOffset });
        }
      }
    } else if (d.kind === 'assistant_text') {
      res.assistantTurns += 1;
      const r = recognizeClearing(
        d.text,
        t.list('lexicon.deferral_stoplist'),
        t.list('lexicon.deferral_filler'),
        Number(t.get('qa.clear_length_floor_chars') ?? '2')
      );
      turns.record(consumer, d.uuid, ts, r.clears, r.reason ?? null);
      res.newTurns.push({ uuid: d.uuid, ts, clears: r.clears });
      if (r.clears) res.cleared += answerQuestions(store, consumer, d.uuid, 'generic_text_all_prior', endOffset, ts);
    } else if (d.reason === 'unknown_shape') {
      res.unrecognized += 1;
      recordFault(store, diagnosticsDir, { code: 'unrecognized_user_entry', detail: { offset: endOffset } });
    }
    lastOffset = endOffset;
    if ('uuid' in d) lastUuid = d.uuid;
  }
  advanceBookmark(store, consumer, lastOffset, lastUuid);
  return res;
}

/** SKELETON: G27 — the plan's `decideDeny(store, consumer, toolName, toolInput)`
 *  must append a `whisper_audit` row, which requires a session the signature
 *  does not carry. SKELETON: G21 — the target path comes from the adapter's
 *  `targetPath`, not from naming `toolInput.file_path` here. */
export function decideDeny(
  store: Store,
  session: string,
  consumer: string,
  toolName: string,
  targetPath: string | undefined
): DenyVerdict | null {
  if (consumer !== 'main' || !recognizeMove(toolName)) return null;
  const open = getOpenQuestions(store, consumer);
  if (open.length === 0) return null;
  const reason = `answer Max's question first: ${open.map((q) => `"${q.question_text}"`).join('; ')}`;
  const id = whisperAuditDao(store).append({
    session,
    consumer,
    kind: 'deny',
    ts: Date.now(),
    text: reason,
    evidence_json: JSON.stringify({ tool: toolName, target: targetPath ?? null, questions: open.map((q) => q.id) }),
  });
  return makeDenyVerdict(reason, id);
}

export function handleSessionStart(store: Store, consumer: string, source: string): void {
  if (source === 'startup' || source === 'clear') {
    expireOnStartup(store, consumer);
    advanceBookmark(store, consumer, 0, null);
  } else {
    // resume / fork / compact: rebuild from the transcript's start.
    // SKELETON: G28 — the plan says "startup/clear → bookmark reset to null" but
    // the bookmark column is NOT NULL DEFAULT 0; both branches reset to 0 here.
    advanceBookmark(store, consumer, 0, null);
  }
}

export function outstandingQuestionLine(store: Store, consumer: string, doneClaimFired: boolean): string | null {
  if (!doneClaimFired) return null;
  const open = getOpenQuestions(store, consumer);
  if (open.length === 0) return null;
  return `[oracle] still unanswered: ${open.map((q) => `"${q.question_text}"`).join('; ')}`;
}
