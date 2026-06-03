/**
 * Security ports (Spec SR2/SR3; Architecture D11). The indexer and package
 * builder depend on these so the security layer is part of the pipeline, not
 * an afterthought.
 */
export interface SecretRedactor {
  /** Replace likely secret values with a redaction marker, preserving structure (SR2). */
  redact(path: string, content: string): string;
}

export interface InjectionSpan {
  start_line: number;
  end_line: number;
  reason: string;
}

export interface PromptInjectionScanner {
  /** Identify instruction-like text in repository content. Returns spans as DATA (SR3). */
  scan(path: string, content: string): InjectionSpan[];
}
