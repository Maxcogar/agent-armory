using System.Text.Json;
using System.Threading;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tests.Fakes;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.Tests.Tools
{
    [Collection("EnvVar")]
    public class DeleteEntityToolTests
    {
        private static (DeleteEntityTool tool, FakePowerMillSession session) BuildTool()
        {
            var (deps, session, _, _) = TestDeps.Build();
            return (new DeleteEntityTool(deps), session);
        }

        private static ProgressReporter NoProgress() => ProgressReporter.NoOp;

        [Fact]
        public async System.Threading.Tasks.Task NoConfirm_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"entity_type\":\"toolpath\",\"name\":\"op1\",\"confirm\":false}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("confirm", result.Content[0].Text);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task ConfirmMissing_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"entity_type\":\"toolpath\",\"name\":\"op1\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task ConfirmTrueButMissingType_RejectsWithoutSessionCall()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"name\":\"op1\",\"confirm\":true}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task ConfirmTrueAllArgs_ReachesSession()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"entity_type\":\"toolpath\",\"name\":\"op1\",\"confirm\":true}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.False(result.IsError);
            Assert.Equal(1, session.WithPowerMillCalls);
        }
    }
}
