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
    public class T06_PatternTests
    {
        private readonly LiveSessionFixture _f;
        public T06_PatternTests(LiveSessionFixture f) { _f = f; }

        [IntegrationFact]
        public async Task Create_EmptyPattern_And_List()
        {
            var create = new CreatePatternTool(_f.Deps);
            var args = JsonDocument.Parse("{\"kind\":\"empty\",\"name\":\"pat_empty\"}").RootElement;
            var result = await create.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError);

            var list = new ListPatternsTool(_f.Deps);
            var listResult = await list.InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(listResult.IsError);
        }
    }
}
