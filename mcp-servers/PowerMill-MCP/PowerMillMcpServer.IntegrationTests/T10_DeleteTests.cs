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
    public class T10_DeleteTests
    {
        private readonly LiveSessionFixture _f;
        public T10_DeleteTests(LiveSessionFixture f) { _f = f; }

        [IntegrationFact]
        public async Task DeleteEntity_NoConfirm_Rejected()
        {
            var tool = new DeleteEntityTool(_f.Deps);
            var args = JsonDocument.Parse("{\"entity_type\":\"toolpath\",\"name\":\"x\",\"confirm\":false}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("confirm", result.Content[0].Text);
        }

        [IntegrationFact]
        public async Task DeleteEntity_Tool_Created_Earlier()
        {
            // Best-effort: a plain end_mill 'em10' was created in T04. If it's
            // still around, delete it. If not, the lookup fails — both acceptable.
            var tool = new DeleteEntityTool(_f.Deps);
            var args = JsonDocument.Parse("{\"entity_type\":\"tool\",\"name\":\"em10\",\"confirm\":true}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            // Either deleted (false IsError) or "not found" (true IsError) — both okay.
            if (result.IsError) Assert.Contains("not found", result.Content[0].Text);
        }
    }
}
