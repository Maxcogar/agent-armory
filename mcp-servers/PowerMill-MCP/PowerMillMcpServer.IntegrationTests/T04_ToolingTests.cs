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
    public class T04_ToolingTests
    {
        private readonly LiveSessionFixture _f;
        public T04_ToolingTests(LiveSessionFixture f) { _f = f; }

        [IntegrationFact]
        public async Task Create_EndMill_And_List()
        {
            var create = new CreateToolTool(_f.Deps);
            var args = JsonDocument.Parse("{\"tool_type\":\"end_mill\",\"name\":\"em10\",\"diameter_mm\":10,\"length_mm\":50}").RootElement;
            var result = await create.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError, result.Content[0].Text);

            var list = new ListToolsTool(_f.Deps);
            var listResult = await list.InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            Assert.Contains("em10", listResult.Content[0].Text);
        }

        [IntegrationFact]
        public async Task Create_TipRadiused_With_TipRadius()
        {
            var create = new CreateToolTool(_f.Deps);
            var args = JsonDocument.Parse("{\"tool_type\":\"tip_radiused\",\"name\":\"tr8\",\"diameter_mm\":8,\"tip_radius_mm\":1.5}").RootElement;
            var result = await create.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError, result.Content[0].Text);
        }

        [IntegrationFact]
        public async Task UpdateTool_TipRadius_On_NonTipRadiused_ErrorsClearly()
        {
            // Create a plain end_mill, then try to set tip_radius_mm on it.
            var create = new CreateToolTool(_f.Deps);
            var createArgs = JsonDocument.Parse("{\"tool_type\":\"end_mill\",\"name\":\"plainEm\",\"diameter_mm\":6}").RootElement;
            await create.InvokeAsync(createArgs, ProgressReporter.NoOp, CancellationToken.None);

            // The error originates in WithPowerMillAsync's func (running on the
            // STA worker) and bubbles out of UpdateToolTool.InvokeAsync. McpServer
            // converts it into ToolResult.Error with IsError=true at the protocol
            // layer; tests calling InvokeAsync directly observe the raw throw.
            var update = new UpdateToolTool(_f.Deps);
            var args = JsonDocument.Parse("{\"name\":\"plainEm\",\"tip_radius_mm\":0.5}").RootElement;
            var ex = await Assert.ThrowsAsync<System.InvalidOperationException>(
                () => update.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None));
            Assert.Contains("tip_radius_mm", ex.Message);
            Assert.Contains("tip_radiused", ex.Message);
            Assert.Contains("plainEm", ex.Message);
        }

        [IntegrationFact]
        public async Task GetToolDetails_AfterCreate()
        {
            var create = new CreateToolTool(_f.Deps);
            await create.InvokeAsync(JsonDocument.Parse("{\"tool_type\":\"drill\",\"name\":\"dr5\",\"diameter_mm\":5}").RootElement, ProgressReporter.NoOp, CancellationToken.None);

            var details = new GetToolDetailsTool(_f.Deps);
            var result = await details.InvokeAsync(JsonDocument.Parse("{\"name\":\"dr5\"}").RootElement, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError);
            Assert.Contains("dr5", result.Content[0].Text);
        }
    }
}
