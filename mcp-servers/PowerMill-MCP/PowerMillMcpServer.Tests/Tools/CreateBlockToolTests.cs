using System.Text.Json;
using System.Threading;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tests.Fakes;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.Tests.Tools
{
    [Collection("EnvVar")]
    public class CreateBlockToolTests
    {
        private static (CreateBlockTool tool, FakePowerMillSession session) BuildTool()
        {
            var (deps, session, _, _) = TestDeps.Build();
            return (new CreateBlockTool(deps), session);
        }

        private static ProgressReporter NoProgress() => ProgressReporter.NoOp;

        [Fact]
        public async System.Threading.Tasks.Task Cylinder_OriginMissingZ_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"kind\":\"cylinder\",\"origin\":{\"x\":1.0,\"y\":2.0},\"outer_diameter_mm\":10,\"length_mm\":50}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("z", result.Content[0].Text);
            Assert.Contains("origin", result.Content[0].Text);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task Cylinder_OriginMissingX_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"kind\":\"cylinder\",\"origin\":{\"y\":2.0,\"z\":3.0},\"outer_diameter_mm\":10,\"length_mm\":50}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("x", result.Content[0].Text);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task Cylinder_NoOrigin_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"kind\":\"cylinder\",\"outer_diameter_mm\":10,\"length_mm\":50}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task Cylinder_OriginNonNumericZ_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"kind\":\"cylinder\",\"origin\":{\"x\":1.0,\"y\":2.0,\"z\":\"oops\"},\"outer_diameter_mm\":10,\"length_mm\":50}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("z", result.Content[0].Text);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task Cylinder_AllFieldsPresent_ReachesSession()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"kind\":\"cylinder\",\"origin\":{\"x\":1.0,\"y\":2.0,\"z\":3.0},\"outer_diameter_mm\":10,\"length_mm\":50}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.False(result.IsError);
            Assert.Equal(1, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task Cylinder_MissingOuterDiameter_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"kind\":\"cylinder\",\"origin\":{\"x\":1.0,\"y\":2.0,\"z\":3.0},\"length_mm\":50}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("outer_diameter_mm", result.Content[0].Text);
            Assert.Equal(0, session.WithPowerMillCalls);
        }
    }
}
