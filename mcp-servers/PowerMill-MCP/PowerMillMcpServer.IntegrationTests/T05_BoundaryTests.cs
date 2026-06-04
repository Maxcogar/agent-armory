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
    public class T05_BoundaryTests
    {
        private readonly LiveSessionFixture _f;
        public T05_BoundaryTests(LiveSessionFixture f) { _f = f; }

        [IntegrationFact]
        public async Task Create_EmptyBoundary()
        {
            var tool = new CreateBoundaryTool(_f.Deps);
            var args = JsonDocument.Parse("{\"kind\":\"empty\",\"name\":\"b_empty\"}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError, result.Content[0].Text);
        }

        [IntegrationFact]
        public async Task ListBoundaries()
        {
            var tool = new ListBoundariesTool(_f.Deps);
            var result = await tool.InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError);
        }
    }
}
