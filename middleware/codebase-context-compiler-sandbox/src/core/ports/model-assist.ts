/**
 * Optional model-assist port (Spec U3, Architecture L4 — deferred).
 *
 * The MVP performs deterministic analysis only. This port exists so an LLM can
 * later assist classification/summarisation WITHOUT the core depending on a
 * provider. No default implementation calls a remote model.
 */
export interface ModelAssist {
  readonly name: string;
  available(): boolean;
}
