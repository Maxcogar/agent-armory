using System.IO;
using System.Text.Json;
using System.Threading;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tests.Fakes;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.Tests.Tools
{
    [Collection("EnvVar")]
    public class OpenProjectToolTests
    {
        private static (OpenProjectTool tool, FakePowerMillSession session, string tempRoot) BuildTool()
        {
            var (deps, session, _, tempRoot) = TestDeps.Build();
            return (new OpenProjectTool(deps), session, tempRoot);
        }

        private static ProgressReporter NoProgress() => ProgressReporter.NoOp;

        [Fact]
        public async System.Threading.Tasks.Task MissingPath_RejectsWithoutSessionCall()
        {
            var (tool, session, _) = BuildTool();
            var args = JsonDocument.Parse("{}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("path", result.Content[0].Text);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task PathOutsideRoots_RejectsWithoutSessionCall()
        {
            var (tool, session, _) = BuildTool();
            var args = JsonDocument.Parse("{\"path\":\"C:\\\\Windows\\\\System32\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task PathTraversalEscape_RejectsWithoutSessionCall()
        {
            var (tool, session, tempRoot) = BuildTool();
            var escape = Path.Combine(tempRoot, "..", "..", "Windows");
            var args = JsonDocument.Parse("{\"path\":\"" + escape.Replace("\\", "\\\\") + "\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task PathDoesNotExist_RejectsWithoutSessionCall()
        {
            var (tool, session, tempRoot) = BuildTool();
            var nonExistent = Path.Combine(tempRoot, "does-not-exist-" + System.Guid.NewGuid().ToString("N"));
            var args = JsonDocument.Parse("{\"path\":\"" + nonExistent.Replace("\\", "\\\\") + "\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            Assert.True(result.IsError);
            Assert.Contains("does not exist", result.Content[0].Text);
            Assert.Equal(0, session.WithPowerMillCalls);
        }

        [Fact]
        public async System.Threading.Tasks.Task ValidPathUnderRoot_ReachesSession()
        {
            var (tool, session, tempRoot) = BuildTool();
            var projectDir = Path.Combine(tempRoot, "project");
            Directory.CreateDirectory(projectDir);
            var args = JsonDocument.Parse("{\"path\":\"" + projectDir.Replace("\\", "\\\\") + "\"}").RootElement;
            var result = await tool.InvokeAsync(args, NoProgress(), CancellationToken.None);
            // We can't assert success without a real PMAutomation, but the
            // session call is what proves validation passed.
            Assert.Equal(1, session.WithPowerMillCalls);
        }
    }
}
