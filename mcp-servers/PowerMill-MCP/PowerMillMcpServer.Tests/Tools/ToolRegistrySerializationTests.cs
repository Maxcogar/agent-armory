using System;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.Tests.Tools
{
    /// Verifies that ToolRegistry serializes tool execution via its internal
    /// SemaphoreSlim — concurrent InvokeAsync calls run one at a time, never
    /// interleaved.
    public class ToolRegistrySerializationTests
    {
        private sealed class TrackingTool : Tool
        {
            private int _inFlight;
            public int MaxConcurrent { get; private set; }
            private readonly TaskCompletionSource<bool> _release;
            public override string Name { get; }
            public override string Description => "test";
            public override JsonObject InputSchema => new JsonObject();

            public TrackingTool(string name, TaskCompletionSource<bool> release)
            { Name = name; _release = release; }

            public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
            {
                var n = Interlocked.Increment(ref _inFlight);
                if (n > MaxConcurrent) MaxConcurrent = n;
                await _release.Task.ConfigureAwait(false);
                Interlocked.Decrement(ref _inFlight);
                return ToolResult.Text("ok");
            }
        }

        [Fact]
        public async Task ConcurrentInvocations_RunSerially()
        {
            var release = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            var tool = new TrackingTool("track", release);
            var registry = new ToolRegistry();
            registry.Register(tool);

            var t1 = registry.InvokeAsync("track", null, ProgressReporter.NoOp, CancellationToken.None);
            var t2 = registry.InvokeAsync("track", null, ProgressReporter.NoOp, CancellationToken.None);
            // Give the tasks a moment to attempt entry.
            await Task.Delay(50);
            release.TrySetResult(true);
            await Task.WhenAll(t1, t2);

            Assert.Equal(1, tool.MaxConcurrent);
        }

        [Fact]
        public async Task UnknownTool_ThrowsUnknownToolException()
        {
            var registry = new ToolRegistry();
            await Assert.ThrowsAsync<UnknownToolException>(
                () => registry.InvokeAsync("not_registered", null, ProgressReporter.NoOp, CancellationToken.None));
        }
    }
}
