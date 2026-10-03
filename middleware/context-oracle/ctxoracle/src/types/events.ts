// Shared event types (Step 6, AD-6; reopened 2026-09-26 build delta). Declared
// here, ahead of every consumer, so no later step imports a type a still-later
// step defines. All type-only (erased at build).
//
// `EventKind` is the eight AD-6 wired events. Only the adapter (Step 28) names
// Claude Code's wire FIELD names; the rest of the codebase consumes
// `InternalEvent`, whose members are internal identifiers (`toolName`, not
// `tool_name`) — the property T-28-2 scans for.

import type { ConsumerKey } from './consumer.js';
import type { TuningReader } from './candidate.js';

export type EventKind =
  | 'UserPromptSubmit'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PostToolUseFailure'
  | 'Stop'
  | 'SubagentStop'
  | 'SessionStart'
  | 'SessionEnd';

/** `SessionStart.source` (V5). Kept as a string so a future source is tolerated;
 *  AD-16's D-20 reconciliation switches on the known values. */
export type StartSource = string;

/**
 * The adapter's output (Step 28): a hook event normalized to internal names.
 * Optional members are present only on the events that carry them (per the AD-6
 * map). The consumer key is not here — the handler builds it from `session` and
 * `agentId` (AD-4). `toolInput`/`toolResponse` are opaque: only the adapter
 * reads their fields (AD-6), and it extracts the still-unnormalized tool facts
 * below (G21).
 */
export interface InternalEvent {
  kind: EventKind;
  session: string;
  /** The wire's agent id; absent (or empty) for the main agent. */
  agentId?: string;
  toolName?: string;
  toolInput?: unknown;
  toolResponse?: unknown;
  errorText?: string;
  transcriptPath: string;
  promptText?: string;
  startSource?: StartSource;
  lastAssistantMessage?: string;
  stopHookActive?: boolean;
  workingDir: string;
  /** The file a Read/Edit/Write/NotebookEdit call names, as the wire gave it. */
  targetPathRaw?: string;
  /** A Grep/Glob call's pattern. */
  searchTerm?: string;
  /** The files a Grep/Glob call returned, as the wire gave them. */
  resultPathsRaw?: string[];
  /** How the adapter read a Grep/Glob response (collapse-hunt H3). */
  searchResultState?: 'listed' | 'mode_unsupported' | 'unrecognized';
  /** A Bash call's command. */
  bashCommand?: string;
}

/**
 * A read-only view of this session's and consumer's observed actions, read on
 * the event path (AD-4), built by the handler over the `observed_actions` DAO.
 */
export interface ObservedActionsReader {
  /** Distinct paths of `outcome='ok'` Edit/Write/NotebookEdit rows (G22 — a failed Edit is not a change). */
  okEditedPaths(): string[];
  /**
   * Bash rows of either outcome. `segments` is the parsed `segments_json`: the
   * per-segment classes Step 17 defines (`SegmentClass`), which the
   * Verification genre (Step 18) narrows; null when the row recorded none.
   */
  runs(): { commandClass: 1 | 2 | 3 | null; segments: unknown[] | null; outcome: 'ok' | 'failed' | null }[];
  /** The post-write hash of the first `ok` edit of `path` in this session. */
  firstHash(path: string): string | undefined;
  /** Post-write hashes of `ok` edits of `path`, in order. */
  hashesFor(path: string): string[];
  /** Distinct paths written by an edit tool with `seq > sinceSeq`. */
  pathWrites(sinceSeq: number): string[];
}

/** The rumor-rule drop reasons (AD-15/AD-17 `whisper_dropped_unverifiable`). */
export type DropReason = 'stale_pointer' | 'not_in_tree' | 'masked_path';

/** `InternalEvent` plus everything the handler resolves before any genre runs. */
export interface EventContext extends InternalEvent {
  consumer: ConsumerKey;
  /** Derived from the key; used only for FR-O6's main-only deny scope. */
  role: 'main' | 'subagent';
  /** The main repository root the store is bound to. */
  repoRoot: string;
  /** The event's own checkout: a worktree's root, else `repoRoot` (AD-23). */
  checkoutRoot: string;
  isWorktree: boolean;
  repoKey: string;
  /** `targetPathRaw` normalized to a repository-relative POSIX path against `checkoutRoot` (G21/N3). */
  targetPath?: string;
  /** `resultPathsRaw` normalized the same way. */
  resultPaths: string[];
  /** Set by the handler from the event, never by a genre (D-18; G18a). */
  context: 'edit' | 'read';
  /** `schema_meta.ref_ts` (G19). */
  refTs: number;
  /** `schema_meta.index_head` differs from the event checkout's `HEAD`. */
  indexStale: boolean;
  /** `schema_meta.last_mined_commit` differs from that `HEAD` (collapse-hunt H1). */
  historyStale: boolean;
  /** `corpus_floor_met = '1'` and `mining_in_progress` not `'1'` (N1, AD-13). */
  historyAvailable: boolean;
  tuning: TuningReader;
  observed: ObservedActionsReader;
  /** The sink generators and the composer report rumor-rule drops through. */
  recordDrop(genre: string, subjectKey: string, reason: DropReason): void;
}
