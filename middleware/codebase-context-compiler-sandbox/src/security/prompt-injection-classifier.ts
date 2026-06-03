/**
 * Prompt-injection classifier (Spec SR3, AC9; Architecture D11/T2). Treats
 * repository content as untrusted DATA. It LABELS instruction-like text with a
 * line span and reason; it never executes or relays it as an instruction. The
 * package surfaces these as `flagged_repository_text`.
 */
import type { PromptInjectionScanner, InjectionSpan } from '../core/ports/security.js';

const SIGNALS: Array<{ re: RegExp; reason: string }> = [
  { re: /ignore (?:all )?(?:previous|prior|above|preceding) (?:instructions|prompts?)/i, reason: 'attempts to override prior instructions' },
  { re: /disregard (?:the )?(?:above|previous|system)/i, reason: 'attempts to disregard instructions' },
  { re: /you are now\b|from now on,? you/i, reason: 'attempts to reassign the agent role' },
  { re: /(?:new|updated) system prompt|<\s*system\s*>/i, reason: 'attempts to inject a system prompt' },
  { re: /\b(?:exfiltrate|leak|send).{0,30}(?:secret|token|key|credential|password)/i, reason: 'attempts to exfiltrate secrets' },
  { re: /ignore previous instructions and (?:delete|remove|drop|edit|modify)/i, reason: 'attempts to direct destructive action' },
];

export class PromptInjectionClassifier implements PromptInjectionScanner {
  scan(_path: string, content: string): InjectionSpan[] {
    const spans: InjectionSpan[] = [];
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      for (const sig of SIGNALS) {
        if (sig.re.test(line)) {
          spans.push({ start_line: i + 1, end_line: i + 1, reason: sig.reason });
          break;
        }
      }
    });
    return spans;
  }
}
