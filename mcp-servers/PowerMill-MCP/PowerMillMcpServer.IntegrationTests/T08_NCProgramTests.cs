using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.IntegrationTests.Fixtures;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.IntegrationTests
{
    [Collection("Live")]
    public class T08_NCProgramTests
    {
        private readonly LiveSessionFixture _f;
        public T08_NCProgramTests(LiveSessionFixture f) { _f = f; }

        [IntegrationFact]
        public async Task Create_NCProgram_Shell()
        {
            var tool = new CreateNCProgramTool(_f.Deps);
            var args = JsonDocument.Parse("{\"name\":\"NC_T08\"}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError, result.Content[0].Text);
        }

        [IntegrationFact]
        public async Task ListPostProcessors_DefaultPath_Works()
        {
            // Without folder arg, the tool should infer from the PowerMill install
            // and auto-allowlist the system folder for read-only listing.
            var tool = new ListPostProcessorsTool(_f.Deps);
            var result = await tool.InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            // Either returns files or errors with a clear message about
            // POWERMILL_POST_PROCESSORS — both are valid; failure mode of
            // "Path not under any allowed root" is what #3 fixed.
            if (result.IsError)
                Assert.DoesNotContain("not under any allowed root", result.Content[0].Text);
        }

        [IntegrationFact]
        public async Task SetNCToolHandling_Enums()
        {
            var create = new CreateNCProgramTool(_f.Deps);
            await create.InvokeAsync(JsonDocument.Parse("{\"name\":\"NC_T08_handling\"}").RootElement, ProgressReporter.NoOp, CancellationToken.None);

            var tool = new SetNCToolHandlingTool(_f.Deps);
            var args = JsonDocument.Parse("{\"name\":\"NC_T08_handling\",\"tool_change\":\"Always\",\"tool_value\":\"Tip\"}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError, result.Content[0].Text);
        }
    }
}
