import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createMcpHost } from '@genkit-ai/mcp';
import { startFlowServer } from '@genkit-ai/express';
import * as dotenv from 'dotenv';

dotenv.config();

// --- COMPLIANCE SCHEMAS ---

const DecisionSchema = z.object({
  decision: z.string(),
  authoritativeStandard: z.string(),
  standardJustification: z.string(),
  alternativesRejected: z.string(),
});

const ComplianceGateSchema = z.object({
  gate1_preWork: z.object({
    documentsRead: z.array(z.string()),
    lockedDecisions: z.array(z.string()),
  }),
  gate2_scope: z.object({
    deliverable: z.string(),
    outOfScope: z.array(z.string()),
  }),
  gate3_decisions: z.array(DecisionSchema),
  gate5_security: z.object({
    threatModel: z.string(),
    verificationOfPrimitives: z.array(z.string()),
  }),
});

export const InputSchema = z.object({
  requirements: z.string().describe('The implementation requirements or bug report.'),
  targetPath: z.string().describe('The absolute path to the project codebase to analyze.'),
});

export const ImplementationPlanSchema = z.object({
  title: z.string(),
  complianceReport: ComplianceGateSchema,
  planSteps: z.array(z.object({
    step: z.string(),
    file: z.string(),
    lineNumbers: z.string().optional(),
    description: z.string(),
  })),
  completionCriteria: z.object({
    definitionOfDone: z.string(),
    verificationEvidence: z.string(),
  }),
});

export const AuditReportSchema = z.object({
  overallStatus: z.enum(['PASS', 'FAIL', 'NEEDS_REVISION']),
  auditFindings: z.array(z.object({
    gate: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    issue: z.string(),
    remediation: z.string(),
  })),
});

// --- GENKIT SETUP ---

const apiKey = process.env.GEMINI_API_KEY;
const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: googleAI.model('gemini-3.1-pro-preview-customtools'), 
});

// --- THE CORE AGENT FLOW ---

export const generatePlanFlow = ai.defineFlow(
  {
    name: 'generateImplementationPlanWithAudit',
    inputSchema: InputSchema,
    outputSchema: z.object({ plan: ImplementationPlanSchema, audit: AuditReportSchema }),
  },
  async (input) => {
    const mcpHost = createMcpHost({
      name: 'specialized-coding-agent-host',
      mcpServers: {
        'codebase-rag': {
          command: 'python',
          args: ['C:\\Users\\maxco\\Documents\\agent-armory\\mcp-servers\\codebase-rag\\mcp-server-python\\server.py'],
          // The research tool is launched from the target directory to ensure it indexes the correct code.
          spawnOptions: { cwd: input.targetPath },
        },
        'codegraph': {
          command: 'node',
          args: ['C:\\Users\\maxco\\Documents\\agent-armory\\mcp-servers\\codegraph-mcp\\dist\\index.js'],
          spawnOptions: { cwd: input.targetPath },
        },
        'sequential-thinking': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        },
      },
    });

    const rawTools = await mcpHost.getActiveTools(ai);

    // SANITIZATION LAYER: Reconcile fuzzy LLM outputs with rigid tool schemas.
    // This handles the case where the model sends 'revisesThought: 0' (illegal) instead of omitting it.
    const tools = rawTools.map(tool => {
      if (tool.name.includes('sequentialthinking')) {
        return ai.defineTool(
          {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema,
          },
          async (input) => {
            if ((input as any).revisesThought === 0) {
              delete (input as any).revisesThought;
            }
            return tool(input);
          }
        );
      }
      return tool;
    });

    const discoveryResponse = await ai.generate({
      model: googleAI.model('gemini-3.1-pro-preview-customtools'),
      system: `You are the lead ARCHITECT in the DISCOVERY PHASE. 
      The target codebase is located at: ${input.targetPath}
      
      TOOLSET CONSTRAINTS:
      - You ONLY have access to the provided tools: [codebase-rag, codegraph, sequentialthinking].
      - You DO NOT have a terminal. NEVER attempt to use 'execute_command', 'cat', 'ls', or any shell commands.
      - To read or search code, you MUST use 'rag_check_constraints' or 'rag_query_impact'.
      - To understand structure, you MUST use 'codegraph' tools.
      
      PHASE GOAL:
      Map the technical landscape and identify every 'Non-Trivial Decision'. 
      Provide a comprehensive Research Report that the PLANNER can use to write the final Implementation Plan.`,
      prompt: input.requirements,
      tools: tools,
      maxTurns: 100,
    });

    const researchReport = discoveryResponse.text;

    const planningResponse = await ai.generate({
      model: googleAI.model('gemini-3.1-pro-preview-customtools'),
      system: `You are the PLANNER. Transform research into a compliant Implementation Plan.
      CITE STANDARDS (RFC, OWASP).`,
      prompt: `Requirements: ${input.requirements}\n\nResearch: ${researchReport}`,
      output: { schema: ImplementationPlanSchema },
    });

    const draftPlan = planningResponse.output;
    if (!draftPlan) throw new Error('Planning Failed.');

    const auditResponse = await ai.generate({
      model: googleAI.model('gemini-3.1-pro-preview-customtools'),
      system: `You are the AUDITOR. Reject plans that fail the compliance checklist.`,
      prompt: `Plan: ${JSON.stringify(draftPlan)}`,
      output: { schema: AuditReportSchema },
    });

    const auditReport = auditResponse.output;
    if (!auditReport) throw new Error('Audit Failed.');

    await mcpHost.close();

    return { plan: draftPlan, audit: auditReport };
  }
);

// CRITICAL FIX: This keeps the server alive so the Genkit UI can connect to it.
if (process.argv.includes('--serve')) {
  startFlowServer({
    flows: [generatePlanFlow],
    port: 3400,
  });
}
