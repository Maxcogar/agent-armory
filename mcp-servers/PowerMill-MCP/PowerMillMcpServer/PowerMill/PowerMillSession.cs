using System;
using System.Threading;
using System.Threading.Tasks;
using Autodesk.ProductInterface;
using Autodesk.ProductInterface.PowerMILL;
using PowerMillMcpServer.Com;

namespace PowerMillMcpServer.PowerMill
{
    /// Owns the live PMAutomation handle. Exposes a controlled async surface
    /// over the StaWorker so callers never touch COM threads directly.
    public sealed class PowerMillSession : IPowerMillSession, IDisposable
    {
        private readonly StaWorker _sta;
        private PMAutomation? _powerMill;
        private bool _disposed;

        public PowerMillSession(StaWorker sta)
        {
            _sta = sta;
        }

        public bool IsConnected => _powerMill != null;

        /// Connect to a running PowerMill or spawn one. Default attaches to an
        /// existing instance with GUI; if none is running PMAutomation will
        /// raise the dialog flow.
        public Task<string> ConnectAsync(bool spawnNew, bool withGui, CancellationToken ct)
        {
            return _sta.RunAsync(() =>
            {
                if (_powerMill != null) return DescribeUnsafe();

                var reuse = spawnNew ? InstanceReuse.CreateNewInstance : InstanceReuse.UseExistingInstance;
                var mode = withGui ? Modes.WithGui : Modes.WithoutGui;

                // CreateNewInstance + WithGui is rejected by PMAutomation. If the
                // caller asked for both, downgrade to UseExisting which spawns one
                // anyway when none is running.
                if (spawnNew && withGui) reuse = InstanceReuse.UseExistingInstance;

                _powerMill = new PMAutomation(reuse, mode);
                _powerMill.DialogsOff();
                return DescribeUnsafe();
            }, ct);
        }

        public Task DisconnectAsync(CancellationToken ct)
        {
            return _sta.RunAsync(() =>
            {
                if (_powerMill == null) return;
                try { _powerMill.Dispose(); }
                finally { _powerMill = null; }
            }, ct);
        }

        public Task<TResult> WithPowerMillAsync<TResult>(Func<PMAutomation, TResult> func, CancellationToken ct)
        {
            return _sta.RunAsync(() =>
            {
                var pm = _powerMill ?? throw new InvalidOperationException("Not connected to PowerMill. Call connect_powermill first.");
                return func(pm);
            }, ct);
        }

        public Task WithPowerMillAsync(Action<PMAutomation> action, CancellationToken ct)
        {
            return WithPowerMillAsync<object?>(pm => { action(pm); return null; }, ct);
        }

        public Task<string> DescribeAsync(CancellationToken ct)
        {
            return _sta.RunAsync(() =>
            {
                if (_powerMill == null) return "{\"connected\":false}";
                return DescribeUnsafe();
            }, ct);
        }

        // Must be called on the STA thread.
        private string DescribeUnsafe()
        {
            var pm = _powerMill!;
            var version = pm.Version?.ToString() ?? "unknown";
            var busy = SafeBool(() => pm.IsBusy);
            var visible = SafeBool(() => pm.IsVisible);
            var units = SafeString(() => pm.Units.ToString());
            // PMProject has no Name; use the parameter tree to get the project pathname
            // and fall back to empty string if no project is open.
            var project = SafeString(() => pm.GetPowerMillParameter("project_pathname(false)").Trim());
            return $"{{\"connected\":true,\"version\":\"{version}\",\"busy\":{busy.ToString().ToLowerInvariant()},\"visible\":{visible.ToString().ToLowerInvariant()},\"units\":\"{units}\",\"active_project\":\"{Escape(project)}\"}}";
        }

        private static bool SafeBool(Func<bool> f) { try { return f(); } catch { return false; } }
        private static string SafeString(Func<string> f) { try { return f(); } catch { return ""; } }
        private static string Escape(string s) => s.Replace("\\", "\\\\").Replace("\"", "\\\"");

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            try { DisconnectAsync(CancellationToken.None).Wait(TimeSpan.FromSeconds(5)); } catch { }
        }
    }
}
