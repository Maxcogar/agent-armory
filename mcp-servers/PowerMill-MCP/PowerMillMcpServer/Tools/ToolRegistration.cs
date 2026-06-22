namespace PowerMillMcpServer.Tools
{
    /// One place to enumerate every tool the server exposes. Keeps Program.cs
    /// from growing a 40-line registration block.
    public static class ToolRegistration
    {
        public static void RegisterAll(ToolRegistry registry, ToolDeps deps)
        {
            // Connection
            registry.Register(new ConnectPowerMillTool(deps));
            registry.Register(new GetStatusTool(deps));

            // Project lifecycle
            registry.Register(new OpenProjectTool(deps));
            registry.Register(new NewProjectTool(deps));
            registry.Register(new SaveProjectTool(deps));
            registry.Register(new SaveProjectAsTool(deps));
            registry.Register(new CloseProjectTool(deps));
            registry.Register(new ImportProjectTool(deps));
            registry.Register(new ImportTemplateTool(deps));

            // Setup
            registry.Register(new ImportModelTool(deps));
            registry.Register(new CreateBlockTool(deps));
            registry.Register(new DeleteBlockTool(deps));
            registry.Register(new CreateWorkplaneTool(deps));
            registry.Register(new SetUnitsTool(deps));

            // Tooling
            registry.Register(new CreateToolTool(deps));
            registry.Register(new UpdateToolTool(deps));
            registry.Register(new ListToolsTool(deps));
            registry.Register(new GetToolDetailsTool(deps));

            // Drive geometry
            registry.Register(new CreateBoundaryTool(deps));
            registry.Register(new ListBoundariesTool(deps));
            registry.Register(new CreatePatternTool(deps));
            registry.Register(new ListPatternsTool(deps));
            registry.Register(new DeleteEntityTool(deps));

            // Toolpaths
            registry.Register(new ListToolpathsTool(deps));
            registry.Register(new CreateToolpathTool(deps));
            registry.Register(new CreateToolpathFromTemplateTool(deps));
            registry.Register(new SetToolpathLinksTool(deps));
            registry.Register(new CalculateToolpathTool(deps));
            registry.Register(new VerifyToolpathTool(deps));

            // Discovery (lists for entity types without dedicated CRUD tools)
            registry.Register(new ListModelsTool(deps));
            registry.Register(new ListWorkplanesTool(deps));
            registry.Register(new ListSetupsTool(deps));
            registry.Register(new ListStockModelsTool(deps));
            registry.Register(new ListMachineToolsTool(deps));

            // NC programs
            registry.Register(new ListNCProgramsTool(deps));
            registry.Register(new CreateNCProgramTool(deps));
            registry.Register(new AddToolpathsToNCProgramTool(deps));
            registry.Register(new ConfigureNCProgramTool(deps));
            registry.Register(new SetNCToolHandlingTool(deps));
            registry.Register(new WriteNCProgramTool(deps));
            registry.Register(new BatchPostTool(deps));
            registry.Register(new ListPostProcessorsTool(deps));

            // Escape hatches
            registry.Register(new RunMacroTool(deps));
            registry.Register(new QueryParameterTool(deps));
            registry.Register(new StartMacroRecordingTool(deps));
            registry.Register(new StopMacroRecordingTool(deps));
        }
    }
}
