using System;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Mcp;
using Xunit;

namespace PowerMillMcpServer.Tests
{
    /// All tests that mutate POWERMILL_PROJECT_ROOTS share this collection so
    /// xUnit serializes them. Without serialization, EnvVarScope captures the
    /// wrong "original" value when a parallel test mutates the env between
    /// our SaveOriginal and our SetNew, causing intermittent failures.
    [CollectionDefinition("EnvVar", DisableParallelization = true)]
    public class EnvVarCollection { }

    [Collection("EnvVar")]
    public class RootsRegistryTests
    {
        [Fact]
        public void EnvVar_LoadsAtConstruction()
        {
            using var scope = new EnvVarScope("POWERMILL_PROJECT_ROOTS", @"C:\projects;C:\backup");
            var reg = new RootsRegistry();
            var roots = reg.AllowedRoots;
            Assert.Equal(2, roots.Count);
            Assert.Contains(@"C:\projects", roots);
            Assert.Contains(@"C:\backup", roots);
        }

        [Fact]
        public void EnvVar_DefaultsToDocuments()
        {
            using var scope = new EnvVarScope("POWERMILL_PROJECT_ROOTS", null);
            var reg = new RootsRegistry();
            Assert.Single(reg.AllowedRoots);
            // Documents path varies per machine but should be non-empty.
            Assert.False(string.IsNullOrEmpty(reg.AllowedRoots[0]));
        }

        [Fact]
        public async Task RefreshHostRoots_NoSenderAttached_NoOp()
        {
            using var scope = new EnvVarScope("POWERMILL_PROJECT_ROOTS", @"C:\envroot");
            var reg = new RootsRegistry();
            // Mark host as supporting roots, but no sender attached.
            reg.NoteHostCapabilities(JsonDocument.Parse("{\"roots\":{}}").RootElement);
            await reg.RefreshHostRootsAsync(CancellationToken.None);
            // Should not throw; only env root should remain.
            Assert.Equal(@"C:\envroot", reg.AllowedRoots.Single());
        }

        [Fact]
        public async Task RefreshHostRoots_AppendsHostRoots()
        {
            using var scope = new EnvVarScope("POWERMILL_PROJECT_ROOTS", @"C:\envroot");
            var reg = new RootsRegistry();
            reg.NoteHostCapabilities(JsonDocument.Parse("{\"roots\":{}}").RootElement);

            reg.AttachRequestSender((method, @params, ct) =>
            {
                Assert.Equal("roots/list", method);
                var resp = JsonNode.Parse("{\"roots\":[{\"uri\":\"file:///C:/host-root-a\"},{\"uri\":\"file:///C:/host-root-b\"}]}");
                return Task.FromResult<JsonNode?>(resp);
            });

            await reg.RefreshHostRootsAsync(CancellationToken.None);
            var roots = reg.AllowedRoots;
            Assert.Contains(@"C:\envroot", roots);
            // file:///C:/host-root-a turns into "C:\host-root-a" after Uri.LocalPath.
            // Use a debug-friendly assertion so any future regression names what
            // actually showed up.
            var rootsList = string.Join("|", roots);
            Assert.True(roots.Any(r => r.EndsWith("host-root-a", StringComparison.OrdinalIgnoreCase)),
                "Expected a root ending with 'host-root-a'. Got: " + rootsList);
            Assert.True(roots.Any(r => r.EndsWith("host-root-b", StringComparison.OrdinalIgnoreCase)),
                "Expected a root ending with 'host-root-b'. Got: " + rootsList);
        }

        [Fact]
        public async Task RefreshHostRoots_IgnoresNonRootsCapability()
        {
            using var scope = new EnvVarScope("POWERMILL_PROJECT_ROOTS", @"C:\envroot");
            var reg = new RootsRegistry();
            // Host doesn't advertise roots.
            reg.NoteHostCapabilities(JsonDocument.Parse("{}").RootElement);
            bool senderCalled = false;
            reg.AttachRequestSender((m, p, c) => { senderCalled = true; return Task.FromResult<JsonNode?>(null); });
            await reg.RefreshHostRootsAsync(CancellationToken.None);
            Assert.False(senderCalled);
        }

        private sealed class EnvVarScope : IDisposable
        {
            private readonly string _name;
            private readonly string? _original;
            public EnvVarScope(string name, string? value)
            {
                _name = name;
                _original = Environment.GetEnvironmentVariable(name);
                Environment.SetEnvironmentVariable(name, value);
            }
            public void Dispose() => Environment.SetEnvironmentVariable(_name, _original);
        }
    }
}
