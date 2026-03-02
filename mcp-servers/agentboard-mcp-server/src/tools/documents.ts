import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPut, errorResult } from "../client.js";
import { PHASE_NAMES } from "../constants.js";
import { DocumentOutputSchema, DocumentListOutputSchema } from "../schemas.js";
import type { Document } from "../types.js";

function formatDocument(d: Document): string {
  return [
    `## ${d.title} (${d.id})`,
    `- **Type**: ${d.document_type}`,
    `- **Phase**: ${d.phase} — ${PHASE_NAMES[d.phase] ?? "Unknown"}`,
    `- **Status**: ${d.status}`,
    d.filled_by ? `- **Filled By**: ${d.filled_by}` : null,
    `- **Updated**: ${d.updated_at}`,
    `\n### Content\n\n${d.content}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function registerDocumentTools(server: McpServer): void {
  // ── list_documents ─────────────────────────────────────────────────────────
  server.registerTool(
    "agentboard_list_documents",
    {
      title: "List Documents",
      description: `List all phase documents for a project.

Returns all 13 phase documents with their status, type, and metadata.
A document with status 'approved' unblocks phase advancement for its phase.

Args:
  - project_id (string): UUID of the project

Returns:
  documents: Array of document objects (id, phase, document_type, title, status, filled_by, content)
  count: Total number of documents

Use when: You need to find which documents need filling or which phase is blocked.`,
      inputSchema: {
        project_id: z.string().uuid().describe("UUID of the project"),
      },
      outputSchema: DocumentListOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ project_id }) => {
      try {
        const documents = await apiGet<Document[]>(`/projects/${project_id}/documents`);
        const structuredContent = { documents, count: documents.length };

        if (!documents.length) {
          return {
            content: [{ type: "text", text: "No documents found for this project." }],
            structuredContent,
          };
        }
        const summary = documents.map((d) =>
          `- **Phase ${d.phase}** (${d.document_type}): ${d.title} — \`${d.status}\` [${d.id}]`
        ).join("\n");
        return {
          content: [{ type: "text", text: `# Phase Documents\n\n${summary}` }],
          structuredContent,
        };
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // ── get_document ───────────────────────────────────────────────────────────
  server.registerTool(
    "agentboard_get_document",
    {
      title: "Get Document",
      description: `Get a single phase document by ID, including its full Markdown content.

This is the primary tool for reading a document before filling it in.
The 'content' field contains the full Markdown template or previously written content.
The 'document_type' field tells you what kind of analysis is expected.

Args:
  - document_id (string): UUID of the document (get this from agentboard_list_documents)

Returns: Full document object including content, status, phase, and metadata.`,
      inputSchema: {
        document_id: z.string().uuid().describe("UUID of the document"),
      },
      outputSchema: DocumentOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ document_id }) => {
      try {
        const doc = await apiGet<Document>(`/documents/${document_id}`);
        return {
          content: [{ type: "text", text: formatDocument(doc) }],
          structuredContent: doc,
        };
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // ── update_document ────────────────────────────────────────────────────────
  server.registerTool(
    "agentboard_update_document",
    {
      title: "Update Document",
      description: `Update a phase document's content or status.

This is the primary tool for writing architecture docs, requirement specs, risk assessments, etc.
Write the full document content as Markdown in the 'content' field.

CRITICAL: Setting status='approved' unblocks phase advancement for phases 2–9.
Document status flow: template → draft → approved → superseded

Args:
  - document_id (string): UUID of the document
  - content (string, optional): Full Markdown content for the document
  - status (string, optional): template | draft | approved | superseded
  - filled_by (string, optional): Agent ID that authored this document
  - title (string, optional): New document title

Returns: The updated document with all current field values including new content.

Example workflow:
  1. agentboard_get_document → read the template
  2. agentboard_update_document with content='...' status='draft' → save your work
  3. agentboard_update_document with status='approved' → unblock phase advancement`,
      inputSchema: {
        document_id: z.string().uuid().describe("UUID of the document"),
        content: z.string().optional().describe("Full Markdown content for the document"),
        status: z
          .enum(["template", "draft", "approved", "superseded"])
          .optional()
          .describe("New status — set 'approved' to unblock phase advancement"),
        filled_by: z.string().optional().describe("Agent ID or name that authored this document"),
        title: z.string().optional().describe("New document title"),
      },
      outputSchema: DocumentOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ document_id, content, status, filled_by, title }) => {
      try {
        const body: Record<string, unknown> = {};
        if (content !== undefined) body["content"] = content;
        if (status !== undefined) body["status"] = status;
        if (filled_by !== undefined) body["filled_by"] = filled_by;
        if (title !== undefined) body["title"] = title;

        const doc = await apiPut<Document>(`/documents/${document_id}`, body);
        const statusNote = status === "approved" ? " Phase advancement is now unblocked!" : "";
        return {
          content: [{ type: "text", text: `✅ Document updated!${statusNote}\n\n${formatDocument(doc)}` }],
          structuredContent: doc,
        };
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
