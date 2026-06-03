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
    public class T07_ToolpathTests
    {
        private readonly LiveSessionFixture _f;
        public T07_ToolpathTests(LiveSessionFixture f) { _f = f; }

        [IntegrationFact]
        public async Task ListToolpaths_Returns_Empty_Or_Existing()
        {
            var tool = new ListToolpathsTool(_f.Deps);
            var result = await tool.InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError);
            Assert.Contains("\"toolpaths\"", result.Content[0].Text);
        }

        [IntegrationFact]
        public async Task CreateToolpath_AllowlistedStrategy_Succeeds()
        {
            var tool = new CreateToolpathTool(_f.Deps);
            var args = JsonDocument.Parse("{\"strategy\":\"raster\"}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            // Even without a tool/boundary assigned, the CREATE TOOLPATH macro
            // succeeds; the resulting toolpath is just unparameterized.
            Assert.False(result.IsError, result.Content[0].Text);
        }

        [IntegrationFact]
        public async Task CreateToolpath_UnknownStrategy_RejectedBeforePowerMill()
        {
            var tool = new CreateToolpathTool(_f.Deps);
            var args = JsonDocument.Parse("{\"strategy\":\"definitely_not_real\"}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("Unknown strategy", result.Content[0].Text);
        }

        [IntegrationFact]
        public async Task CreateToolpath_NewlineInjection_Rejected()
        {
            var tool = new CreateToolpathTool(_f.Deps);
            var args = JsonDocument.Parse("{\"strategy\":\"raster\\nDELETE TOOLPATH ALL\"}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("invalid character", result.Content[0].Text);
        }
    }
}
