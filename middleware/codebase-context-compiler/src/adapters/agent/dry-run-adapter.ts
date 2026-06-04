/**
 * Deterministic injection adapter for offline/testing. Simulates an agent that
 * receives the injected context, submits a (scripted) plan, then attempts a set
 * of edits. Proves the harness enforces the gate without a live model or
 * credentials. Real model behaviour is covered by the Claude Code adapter.
 */
import type {
  AgentInjectionAdapter, HarnessController, AgentRunResult,
} from '../../core/ports/agent-injection-adapter.js';

export interface ScriptedRun {
  plan: string | null;
  /** Edit attempts the simulated agent makes (tool name + input). */
  editAttempts: Array<{ tool: string; input: unknown }>;
}

export class DryRunAdapter implements AgentInjectionAdapter {
  readonly name = 'dry-run';
  constructor(private script: ScriptedRun) {}
  async available(): Promise<boolean> { return true; }

  async run(controller: HarnessController): Promise<AgentRunResult> {
    const notes: string[] = [];
    notes.push(`injected ${controller.injectionBlock.length} chars of mandatory context`);

    if (this.script.plan !== null) {
      const fw = controller.submitPlan(this.script.plan);
      notes.push(`plan submitted; firewall ${fw.passed ? 'passed' : 'failed'}`);
    } else {
      notes.push('no plan submitted');
    }

    let denied = 0;
    for (const attempt of this.script.editAttempts) {
      const d = controller.gate(attempt.tool, attempt.input);
      if (d.behavior === 'deny') denied++;
    }
    return { injected: true, plan: this.script.plan, deniedEdits: denied, completed: true, notes };
  }
}
