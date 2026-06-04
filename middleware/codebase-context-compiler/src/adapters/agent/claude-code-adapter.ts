/**
 * Claude Code injection adapter (Spec AIR1; Architecture D2 — first per-agent
 * adapter). Drives Claude Code via the Claude Agent SDK using the mechanisms
 * verified against the official SDK docs:
 *
 *   • INJECTION: `systemPrompt: { type:'preset', preset:'claude_code', append }`
 *     places the mandatory context block into the agent's ACTIVE system context
 *     before it plans or edits (NOT a file it must choose to read — AIR1).
 *   • EDIT GATE: the `canUseTool` callback is awaited by the SDK before every
 *     tool call and returns { behavior:'allow'|'deny' }. The harness keeps it
 *     denying Edit/Write until the plan passes the assumption firewall.
 *   • DEFENCE IN DEPTH: a PreToolUse hook also denies edits while the gate is
 *     closed.
 *
 * The SDK is an optional dependency, dynamically imported, so the core product
 * builds and runs without it. `available()` is false when the SDK or
 * credentials are absent; callers then fall back to a non-live path.
 */
import type {
  AgentInjectionAdapter, HarnessController, AgentRunResult,
} from '../../core/ports/agent-injection-adapter.js';
import { CTXPACK_PLAN_CLOSE, CTXPACK_PLAN_OPEN } from '../../core/services/plan-transcript.js';

const PLAN_PROTOCOL = `
Before using any file-editing tool you MUST first output your implementation plan
wrapped exactly as:
${CTXPACK_PLAN_OPEN}
...one step per line...
${CTXPACK_PLAN_CLOSE}
You will be blocked from editing until that plan is approved. If the plan is
rejected, revise it and emit a new ${CTXPACK_PLAN_OPEN}...${CTXPACK_PLAN_CLOSE} block.`;

export class ClaudeCodeAdapter implements AgentInjectionAdapter {
  readonly name = 'claude-code';

  async available(): Promise<boolean> {
    if (!process.env['ANTHROPIC_API_KEY'] && !process.env['CLAUDE_CODE_OAUTH_TOKEN']) return false;
    try {
      await import('@anthropic-ai/claude-agent-sdk' as string);
      return true;
    } catch {
      return false;
    }
  }

  async run(controller: HarnessController): Promise<AgentRunResult> {
    const notes: string[] = [];
    let sdk: any;
    try {
      sdk = await import('@anthropic-ai/claude-agent-sdk' as string);
    } catch {
      return { injected: false, plan: null, deniedEdits: 0, completed: false, notes: ['Claude Agent SDK not installed'] };
    }

    let planText: string | null = null;
    let buffer = '';
    const submitIfPlan = () => {
      const m = buffer.match(/<CTXPACK_PLAN>([\s\S]*?)<\/CTXPACK_PLAN>/);
      if (m && m[1] && planText === null) {
        planText = m[1].trim();
        const fw = controller.submitPlan(planText);
        notes.push(`plan captured; firewall ${fw.passed ? 'passed' : 'failed'}`);
      }
    };

    // EDIT GATE via canUseTool (verified mechanism).
    const canUseTool = async (toolName: string, input: unknown) => {
      const d = controller.gate(toolName, input);
      return d.behavior === 'allow'
        ? { behavior: 'allow', updatedInput: input }
        : { behavior: 'deny', message: d.message };
    };

    // Defence in depth: PreToolUse hook also denies edits while gate is closed.
    const preToolUse = async (hookInput: any) => {
      const decision = controller.gate(hookInput.tool_name, hookInput.tool_input);
      if (decision.behavior === 'deny') {
        return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: decision.message } };
      }
      return {};
    };

    const prompt = `${controller.taskPrompt}\n${PLAN_PROTOCOL}`;
    const options: any = {
      cwd: controller.root,
      systemPrompt: { type: 'preset', preset: 'claude_code', append: `${controller.injectionBlock}\n${PLAN_PROTOCOL}` },
      canUseTool,
      hooks: { PreToolUse: [{ matcher: 'Edit|Write|MultiEdit|NotebookEdit', hooks: [preToolUse] }] },
    };

    try {
      for await (const message of sdk.query({ prompt, options })) {
        if (message?.type === 'assistant') {
          const text = extractText(message);
          if (text) { buffer += text; submitIfPlan(); }
        }
      }
    } catch (e) {
      notes.push(`agent run error: ${(e as Error).message}`);
    }

    return { injected: true, plan: planText, deniedEdits: 0, completed: true, notes };
  }
}

function extractText(message: any): string {
  const content = message?.message?.content ?? message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.filter((b: any) => b?.type === 'text').map((b: any) => b.text).join('');
  return '';
}
