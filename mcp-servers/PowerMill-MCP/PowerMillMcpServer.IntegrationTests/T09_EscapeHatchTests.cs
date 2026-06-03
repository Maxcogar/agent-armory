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
    public class T09_EscapeHatchTests
    {
        private readonly LiveSessionFixture _f;
        public T09_EscapeHatchTests(LiveSessionFixture f) { _f = f; }

        [IntegrationFact]
        public async Task RunMacro_PrintVersion_ReturnsResponse()
        {
            var tool = new RunMacroTool(_f.Deps);
            var args = JsonDocument.Parse("{\"commands\":[\"PRINT VERSION\"],\"confirm_destructive\":true}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError, result.Content[0].Text);
            Assert.Contains("\"executed\":1", result.Content[0].Text);
        }

        [IntegrationFact]
        public async Task RunMacro_NoConfirm_RejectedBeforePowerMill()
        {
            var tool = new RunMacroTool(_f.Deps);
            var args = JsonDocument.Parse("{\"commands\":[\"PRINT VERSION\"]}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("confirm_destructive", result.Content[0].Text);
        }

        [IntegrationFact]
        public async Task QueryParameter_ProjectPath()
        {
            var tool = new QueryParameterTool(_f.Deps);
            var args = JsonDocument.Parse("{\"path\":\"project_pathname(false)\"}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError);
        }
    }
}
