export const BASE_URL = process.env.AGENTBOARD_URL ?? "http://localhost:3000";
export const AGENT_ID = process.env.AGENT_ID ?? "agentboard-mcp";

export const PHASE_NAMES: Record<number, string> = {
  1: "Initialization",
  2: "Codebase Survey",
  3: "Requirements",
  4: "Constraints",
  5: "Risk Assessment",
  6: "Architecture",
  7: "Contracts",
  8: "Test Strategy",
  9: "Task Breakdown",
  10: "Implementation",
  11: "Verification",
  12: "Review",
  13: "Complete",
};

export const PHASE_DOCUMENT_REQUIRED: Record<number, string | null> = {
  1: null,
  2: "codebase_survey",
  3: "requirements",
  4: "constraints",
  5: "risk_assessment",
  6: "architecture",
  7: "contracts",
  8: "test_strategy",
  9: "task_breakdown",
  10: null,
  11: null,
  12: null,
  13: null,
};
