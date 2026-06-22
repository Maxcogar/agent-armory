using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer.Mcp
{
    /// Single source of truth for "which paths can tools read or write."
    /// Loads from POWERMILL_PROJECT_ROOTS at startup, then merges roots
    /// reported by the host via roots/list once initialized. Refreshes on
    /// notifications/roots/list_changed.
    public sealed class RootsRegistry
    {
        private readonly object _lock = new object();
        private List<string> _envRoots;
        private List<string> _hostRoots = new List<string>();
        // System roots are read-only well-known directories (e.g. PowerMill's
        // post_processors install folder) that auto-register when the server
        // infers them. They must never be mixed with AllowedRoots — write-path
        // tools must not be tricked into writing to Program Files.
        private List<string> _systemRoots = new List<string>();
        private bool _hostSupportsRoots;

        // Injected by McpServer so RootsRegistry can send requests without
        // taking a hard dependency on McpServer.
        public delegate Task<JsonNode?> RequestSender(string method, JsonNode? @params, CancellationToken ct);
        private RequestSender? _send;

        public RootsRegistry()
        {
            _envRoots = LoadEnvRoots();
        }

        public IReadOnlyList<string> AllowedRoots
        {
            get
            {
                lock (_lock)
                {
                    var list = new List<string>(_envRoots.Count + _hostRoots.Count);
                    list.AddRange(_envRoots);
                    list.AddRange(_hostRoots);
                    return list;
                }
            }
        }

        /// Read-only roots — tools may scan/list these but never write.
        /// SafePath.ResolveReadOnly accepts paths under either AllowedRoots or
        /// these system roots. SafePath.Resolve (write path) only accepts AllowedRoots.
        public IReadOnlyList<string> ReadOnlySystemRoots
        {
            get { lock (_lock) { return new List<string>(_systemRoots); } }
        }

        /// Register a directory (e.g. an inferred PowerMill install folder) as a
        /// read-only system root. Idempotent — duplicate adds are ignored.
        public void AddSystemRoot(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) return;
            string full;
            try { full = System.IO.Path.GetFullPath(path); }
            catch { return; }
            lock (_lock)
            {
                foreach (var existing in _systemRoots)
                    if (string.Equals(existing, full, StringComparison.OrdinalIgnoreCase)) return;
                _systemRoots.Add(full);
            }
        }

        public void AttachRequestSender(RequestSender send) => _send = send;

        public void NoteHostCapabilities(JsonElement clientCapabilities)
        {
            _hostSupportsRoots =
                clientCapabilities.ValueKind == JsonValueKind.Object &&
                clientCapabilities.TryGetProperty("roots", out _);
        }

        public async Task RefreshHostRootsAsync(CancellationToken ct)
        {
            if (!_hostSupportsRoots || _send == null) return;
            try
            {
                var resp = await _send("roots/list", null, ct).ConfigureAwait(false);
                var newRoots = ExtractRoots(resp);
                lock (_lock) { _hostRoots = newRoots; }
                Logger.Info("RootsRegistry: refreshed host roots, {0} entries", newRoots.Count);
            }
            catch (Exception ex)
            {
                Logger.Warn("RootsRegistry: roots/list failed: {0}", ex.Message);
            }
        }

        private static List<string> ExtractRoots(JsonNode? response)
        {
            var result = new List<string>();
            if (response is not JsonObject obj) return result;
            if (obj["roots"] is not JsonArray arr) return result;
            foreach (var entry in arr)
            {
                if (entry is not JsonObject root) continue;
                var uri = root["uri"]?.GetValue<string>();
                if (string.IsNullOrEmpty(uri)) continue;
                if (TryUriToPath(uri!, out var path)) result.Add(path);
            }
            return result;
        }

        private static bool TryUriToPath(string uri, out string path)
        {
            path = "";
            if (uri.StartsWith("file://", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var u = new Uri(uri);
                    path = u.LocalPath;
                    return !string.IsNullOrEmpty(path);
                }
                catch { return false; }
            }
            // Some hosts pass plain absolute paths instead of file:// URIs.
            if (Path.IsPathRooted(uri)) { path = uri; return true; }
            return false;
        }

        private static List<string> LoadEnvRoots()
        {
            var raw = Environment.GetEnvironmentVariable("POWERMILL_PROJECT_ROOTS");
            if (string.IsNullOrWhiteSpace(raw))
            {
                var docs = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
                return new List<string> { docs };
            }
            return raw.Split(';')
                .Select(s => s.Trim())
                .Where(s => s.Length > 0)
                .ToList();
        }
    }
}
