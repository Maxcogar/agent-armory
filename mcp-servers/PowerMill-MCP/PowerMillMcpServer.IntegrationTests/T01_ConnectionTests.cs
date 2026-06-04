using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.IntegrationTests.Fixtures;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.IntegrationTests
{
    [Collection("Live")]
    public class T01_ConnectionTests
    {
        private readonly LiveSessionFixture _f;
        public T01_ConnectionTests(LiveSessionFixture f) { _f = f; }

        [IntegrationFact]
        public async Task Connect_And_GetStatus()
        {
            // ConnectAsync ran in InitializeAsync. Just verify get_status reports connected.
            var tool = new GetStatusTool(_f.Deps);
            var result = await tool.InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError);
            Assert.Contains("\"connected\":true", result.Content[0].Text);
        }
    }
}
