/**
 * Side-effecting module: silences only Node's `ExperimentalWarning` for the
 * built-in `node:sqlite` module, which this sandbox build uses as its storage
 * engine. Left visible, that warning is emitted to stderr on every CLI run and
 * every Claude Code hook invocation, where it becomes per-prompt noise.
 *
 * It MUST be imported before any module that imports `node:sqlite`, because the
 * warning is emitted when that module is first loaded. `main.ts` imports this
 * first; tests load it via vitest `setupFiles`. All other warnings pass through
 * unchanged.
 */
const originalEmitWarning = process.emitWarning.bind(process);

process.emitWarning = ((warning: string | Error, ...rest: unknown[]): void => {
  const type = typeof rest[0] === 'object' && rest[0] !== null
    ? (rest[0] as { type?: string }).type
    : (rest[0] as string | undefined);
  const text = typeof warning === 'string' ? warning : warning.message;
  if (type === 'ExperimentalWarning' && /\bSQLite\b/.test(text)) return;
  return (originalEmitWarning as (w: string | Error, ...r: unknown[]) => void)(warning, ...rest);
}) as typeof process.emitWarning;
