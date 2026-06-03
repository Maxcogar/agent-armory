using System;
using Xunit;

namespace PowerMillMcpServer.IntegrationTests
{
    /// xUnit Fact that auto-skips when POWERMILL_INTEGRATION != "1".
    /// CI runs without this env var; the integration suite only runs on a
    /// developer machine with PowerMill installed and a license available.
    public sealed class IntegrationFactAttribute : FactAttribute
    {
        public IntegrationFactAttribute()
        {
            var enabled = Environment.GetEnvironmentVariable("POWERMILL_INTEGRATION");
            if (enabled != "1")
                Skip = "POWERMILL_INTEGRATION not set to 1; skipping live integration test.";
        }
    }
}
