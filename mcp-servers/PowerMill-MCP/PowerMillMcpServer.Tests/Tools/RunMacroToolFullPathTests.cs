using System.Text.Json;
using System.Threading;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tests.Fakes;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.Tests.Tools
{
    /// Validation-only tests live in RunMacroConfirmTests. These verify the
    /// full InvokeAsync path through the fake session — confirms that bad
    /// args never reach WithPowerMillAsync, and good args do.
    [Collection("EnvVar")]
    public class RunMacroToolFullPathTests
    {
        private static (RunMacroTool tool, FakePowerMillSession session) BuildTool()
        {
            var (deps, session, _, _) = TestDeps.Build();
            return (new RunMacroTool(deps), session);
        }

        private static ProgressReporter NoProgress() => ProgressReporter.NoOp;

        [Fact]
        public async System.Threading.Tasks.Task NoConfirm_DoesNotInvokeSession()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"commands\":[\"PRINT VERSION\"]}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task ConfirmFalse_DoesNotInvokeSession()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"commands\":[\"PRINT VERSION\"],\"confirm_destructive\":false}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task ConfirmTrue_InvokesSession()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"commands\":[\"PRINT VERSION\"],\"confirm_destructive\":true}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.False(result.IsError);
            Assert.Equal(1, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task EmptyCommands_DoesNotInvokeSession()
        {
            var (tool, session) = BuildTool();
            var args = JsonDocument.Parse("{\"commands\":[],\"confirm_destructive\":true}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Equal(0, session.WithPowerMillCalls);
        }
    }
}
