// The JSON the adapter (Step 28) emits (Step 24). Type-only. It has no
// updatedInput / updatedToolOutput member, so FR-B3's no-mutation clause is
// unrepresentable.
export interface HookResponse {
  hookSpecificOutput?: {
    hookEventName: string;
    permissionDecision?: 'deny';
    permissionDecisionReason?: string;
    additionalContext?: string;
  };
}
