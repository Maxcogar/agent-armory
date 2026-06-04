using System;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Autodesk.ProductInterface.PowerMILL;
using PowerMillMcpServer.PowerMill;

namespace PowerMillMcpServer.Tests.Fakes
{
    /// Stand-in for PowerMillSession in unit tests. Captures invocations
    /// without touching real COM. Tools whose validation rejects bad input
    /// before the session is consulted can be verified by asserting
    /// WithPowerMillCalls stayed at 0.
    public sealed class FakePowerMillSession : IPowerMillSession
    {
        public int ConnectCalls { get; private set; }
        public int DisconnectCalls { get; private set; }
        public int WithPowerMillCalls { get; private set; }
        public int DescribeCalls { get; private set; }
        public bool ConnectedNow { get; set; }
        public Exception? ThrowOnWith { get; set; }
        public Exception? ThrowOnConnect { get; set; }

        /// When set, WithPowerMillAsync<T> returns this object cast to T (if
        /// compatible). Used by tests that need a happy-path return.
        public object? FixedReturnValue { get; set; }

        public bool IsConnected => ConnectedNow;

        public Task<string> ConnectAsync(bool spawnNew, bool withGui, CancellationToken ct)
        {
            ConnectCalls++;
            if (ThrowOnConnect != null) throw ThrowOnConnect;
            ConnectedNow = true;
            return Task.FromResult("{\"connected\":true,\"version\":\"fake\"}");
        }

        public Task DisconnectAsync(CancellationToken ct)
        {
            DisconnectCalls++;
            ConnectedNow = false;
            return Task.CompletedTask;
        }

        public Task<TResult> WithPowerMillAsync<TResult>(Func<PMAutomation, TResult> func, CancellationToken ct)
        {
            WithPowerMillCalls++;
            if (ThrowOnWith != null) throw ThrowOnWith;
            if (FixedReturnValue is TResult t) return Task.FromResult(t);
            // Avoid NRE when the caller dereferences a JsonObject result.
            if (typeof(TResult) == typeof(JsonObject)) return Task.FromResult((TResult)(object)new JsonObject());
            if (typeof(TResult) == typeof(string)) return Task.FromResult((TResult)(object)"");
            return Task.FromResult(default(TResult)!);
        }

        public Task WithPowerMillAsync(Action<PMAutomation> action, CancellationToken ct)
        {
            WithPowerMillCalls++;
            if (ThrowOnWith != null) throw ThrowOnWith;
            return Task.CompletedTask;
        }

        public Task<string> DescribeAsync(CancellationToken ct)
        {
            DescribeCalls++;
            return Task.FromResult(ConnectedNow ? "{\"connected\":true}" : "{\"connected\":false}");
        }
    }
}
