// Prompt-injection-suspect flagger (Step 11, FR-X3, OWASP LLM01). A heuristic
// lexicon: instruction-override phrases, role-play/jailbreak markers, and
// imperatives aimed at the assistant/AI persona. Best-effort — a true flag caps
// confidence and forces pointer-only composition downstream (AD-19); it never
// blocks. Tuned to avoid flagging ordinary prose (README/comment/commit).

const PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+|any\s+)?(?:previous|prior|above|earlier)\s+(?:instruction|prompt|message|direction|rule)/i,
  /disregard\s+(?:all\s+|any\s+)?(?:previous|prior|the\s+above|your)\b/i,
  /\b(?:pretend|act)\s+(?:that\s+)?(?:you\s+are|to\s+be)\b/i,
  /\byou\s+are\s+now\b/i,
  /\bignore\s+your\s+(?:guidelines|instructions|rules|training|system\s+prompt)\b/i,
  /\b(?:assistant|ai|model|chatbot|llm)\b[^.\n]{0,60}\b(?:ignore|disregard|reveal|leak|bypass|forget|override)\b/i,
  /\bdeveloper\s+mode\b/i,
  /\bjailbreak\b/i,
  /\bdo\s+anything\s+now\b/i,
  /\bbypass\s+(?:your\s+)?(?:restrictions|guardrails|safety|filters?|rules)\b/i,
];

/** True when `input` looks like a prompt-injection payload. */
export function isSuspect(input: string): boolean {
  return PATTERNS.some((re) => re.test(input));
}
