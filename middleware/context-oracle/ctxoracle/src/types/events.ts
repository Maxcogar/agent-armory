// Shared event types (Step 6, AD-6). Declared here, ahead of every consumer, so
// no later step imports a type a still-later step defines. All type-only
// (erased at build).
//
// `EventKind` is the eight AD-6 wired events. Only the adapter (Step 28) names
// Claude Code's wire FIELD names; the rest of the codebase consumes
// `InternalEvent`, whose members are internal identifiers (`toolName`, not
// `tool_name`) — the property T-28-2 scans for.

export type EventKind =
  | 'UserPromptSubmit'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PostToolUseFailure'
  | 'Stop'
  | 'SubagentStop'
  | 'SessionStart'
  | 'SessionEnd';

/** Which agent the event belongs to (FR-O6: only the main consumer denies). */
export type Consumer = 'main' | 'subagent';

/** `SessionStart.source` (V5). Kept as a string so a future source is tolerated;
 *  AD-16's D-20 reconciliation switches on the known values. */
export type StartSource = string;

/**
 * The adapter's output: a hook event normalized to internal names. Optional
 * members are present only on the events that carry them (per the AD-6 map).
 */
export interface InternalEvent {
  kind: EventKind;
  session: string;
  consumer: Consumer;
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
  // SKELETON: G21 — genres need the file a tool call targets and the term a
  // search used, but only the adapter may name tool-input fields (AD-6); these
  // carry the adapter's extraction. Repo-relative path.
  targetPath?: string;
  searchTerm?: string;
}

/**
 * A read-only view of this session's observed actions, read on the event path
 * (AD-4). The concrete reader is built at Step 10 over the `observed_actions`
 * DAO; this interface is the shape the handler and genres depend on and may be
 * extended by a consuming step as it needs more accessors.
 */
export interface ObservedActionsReader {
  okEdits(): number;
  okReads(): number;
  runs(): number;
  pathWrites(path: string): number;
  firstHash(): string | undefined;
  writtenSince(ts: number): number;
}

/** `InternalEvent` plus the resolved repo context and the observed-actions reader. */
export interface EventContext extends InternalEvent {
  repoPath: string;
  repoKey: string;
  /** Step 14's staleness flag, read by the handler to decide a detached reindex. */
  indexStale: boolean;
  observedActions: ObservedActionsReader;
}
