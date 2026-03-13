import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, errorResult } from "../client.js";
import { ActivityEntryOutputSchema, ActivityLogOutputSchema } from "../schemas.js";
import type { ActivityEntry } from "../types.js";

function formatEntry(e: ActivityEntry): string {
  return `- [${e.timestamp}] **${e.actor}** → \`${e.action}\` on \`${e.target}\`: ${e.detail}`;
}

export function registerActivityTools(server: McpServer): void {
  // ── get_activity_log ───────────────────────────────────────────────────────
  server.registerTool(
    "agentboard_get_activity_log",
    {
      title: "Get Activity Log",
      description: `Get the activity log for a project with optional filters.

Args:
  - project_id (string): UUID of the project
  - actor (string, optional): Filter by actor (agent ID or 'system')
  - action (string, optional): Filter by action type

Action types: project_created | phase_approved | task_created | task_started |
              task_completed | task_updated | note_added | document_filled |
              document_approved | document_superseded | log_entry

Returns:
  entries: Chronological array of activity log entries
  count: Number of entries returned`,
      inputSchema: {
        project_id: z.string().uuid().describe("UUID of the project"),
        actor: z.string().optional().describe("Filter by actor ID (e.g., 'system' or an agent ID)"),
        action: z
          .enum([
            "project_created", "phase_approved", "task_created", "task_started",
            "task_completed", "task_updated", "note_added", "document_filled",
            "document_approved", "document_superseded", "log_entry",
          ])
          .optional()
          .describe("Filter by action type"),
      },
      outputSchema: ActivityLogOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ project_id, actor, action }) => {
      try {
        const params: Record<string, unknown> = {};
        if (actor) params["actor"] = actor;
        if (action) params["action"] = action;

        const entries = await apiGet<ActivityEntry[]>(`/projects/${project_id}/log`, params);
        const structuredContent = { entries, count: entries.length };

        if (!entries.length) {
          return {
            content: [{ type: "text", text: "No activity log entries found." }],
            structuredContent,
          };
        }
        const text = `# Activity Log (${entries.length} entries)\n\n${entries.map(formatEntry).join("\n")}`;
        return { content: [{ type: "text", text }], structuredContent };
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // ── add_log_entry ──────────────────────────────────────────────────────────
  server.registerTool(
    "agentboard_add_log_entry",
    {
      title: "Add Log Entry",
      description: `Add a manual entry to a project's activity log.

Args:
  - project_id (string): UUID of the project
  - action (string): Action type from the allowed enum
  - target (string): ID of the resource being acted on (task UUID, document UUID, etc.)
  - detail (string): Human-readable description of the activity

Returns: The created activity entry object.`,
      inputSchema: {
        project_id: z.string().uuid().describe("UUID of the project"),
        action: z
          .enum([
            "project_created", "phase_approved", "task_created", "task_started",
            "task_completed", "task_updated", "note_added", "document_filled",
            "document_approved", "document_superseded", "log_entry",
          ])
          .describe("Action type to log"),
        target: z.string().describe("ID of the resource being acted on"),
        detail: z.string().min(1).describe("Human-readable description of what happened"),
      },
      outputSchema: ActivityEntryOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ project_id, action, target, detail }) => {
      try {
        const entry = await apiPost<ActivityEntry>(`/projects/${project_id}/log`, { action, target, detail });
        return {
          content: [{ type: "text", text: `✅ Log entry added.\n\n${formatEntry(entry)}` }],
          structuredContent: entry,
        };
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
