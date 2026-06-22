using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Tools;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer.Mcp
{
    /// MCP protocol dispatcher.
    /// - Reads JSON-RPC frames from stdio.
    /// - Detects requests, responses, notifications and routes accordingly.
    /// - Sends server-initiated requests (e.g. roots/list) and matches replies.
    /// - Tracks per-request CancellationTokenSources for tools/call so
    ///   notifications/cancelled can interrupt long-running tools.
    /// - Enforces initialization gating and protocol version negotiation.
    public sealed class McpServer
    {
        // Versions we support, newest first. The newest is what we report when
        // the client asks for something we don't recognize.
        private static readonly string[] SupportedProtocolVersions = new[]
        {
            "2025-06-18",
            "2025-03-26",
            "2024-11-05",
        };

        private readonly StdioTransport _transport;
        private readonly ToolRegistry _tools;
        private readonly RootsRegistry _roots;
        private readonly JsonSerializerOptions _json;
        private readonly string _serverName;
        private readonly string _serverVersion;
        private readonly CancellationToken _shutdown;

        private readonly ConcurrentDictionary<string, CancellationTokenSource> _toolCallCts =
            new ConcurrentDictionary<string, CancellationTokenSource>();

        private readonly ConcurrentDictionary<long, TaskCompletionSource<JsonRpcOutboundResponse>> _pendingOutbound =
            new ConcurrentDictionary<long, TaskCompletionSource<JsonRpcOutboundResponse>>();
        private long _nextOutboundId;

        // Default timeout for server-initiated requests (e.g. roots/list). If
        // the host never responds, the awaiting code sees OperationCanceledException
        // after this duration. Tests can override via SetOutboundTimeoutForTesting.
        internal TimeSpan _outboundTimeout = TimeSpan.FromSeconds(30);
        internal void SetOutboundTimeoutForTesting(TimeSpan timeout) { _outboundTimeout = timeout; }

        private volatile bool _initialized;

        public McpServer(StdioTransport transport, ToolRegistry tools, RootsRegistry roots,
                         string serverName, string serverVersion, CancellationToken shutdown)
        {
            _transport = transport;
            _tools = tools;
            _roots = roots;
            _serverName = serverName;
            _serverVersion = serverVersion;
            _shutdown = shutdown;
            _json = new JsonSerializerOptions
            {
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
                PropertyNamingPolicy = null,
            };
            _roots.AttachRequestSender(SendRequestAsync);
        }

        public async Task RunAsync()
        {
            Logger.Info("McpServer: starting; supported protocol versions {0}", string.Join(",", SupportedProtocolVersions));
            while (!_shutdown.IsCancellationRequested)
            {
                string? line;
                try { line = await _transport.ReadMessageAsync(_shutdown).ConfigureAwait(false); }
                catch (OperationCanceledException) { break; }

                if (line == null) break;

                JsonElement parsed;
                try { parsed = JsonDocument.Parse(line).RootElement.Clone(); }
                catch (JsonException ex)
                {
                    await SendErrorAsync(null, JsonRpcError.ParseError, "Parse error: " + ex.Message).ConfigureAwait(false);
                    continue;
                }

                // Distinguish request / response / notification.
                bool hasMethod = parsed.TryGetProperty("method", out _);
                bool hasResult = parsed.TryGetProperty("result", out _);
                bool hasError = parsed.TryGetProperty("error", out _);
                bool hasId = parsed.TryGetProperty("id", out var idEl) && idEl.ValueKind != JsonValueKind.Null;

                if (!hasMethod && (hasResult || hasError) && hasId)
                {
                    // Inbound response to a server-initiated request.
                    HandleInboundResponse(idEl, hasResult, hasError, parsed);
                    continue;
                }

                if (!hasMethod)
                {
                    await SendErrorAsync(null, JsonRpcError.InvalidRequest, "Frame has neither method nor result/error").ConfigureAwait(false);
                    continue;
                }

                JsonRpcRequest? req;
                try { req = JsonSerializer.Deserialize<JsonRpcRequest>(line, _json); }
                catch (JsonException ex)
                {
                    await SendErrorAsync(null, JsonRpcError.ParseError, "Parse error: " + ex.Message).ConfigureAwait(false);
                    continue;
                }
                if (req == null) continue;

                // For tools/call, register the cancellation token source SYNCHRONOUSLY
                // here, before yielding to a Task. Otherwise a notifications/cancelled
                // arriving on the next loop iteration could parse and run before the
                // tools/call's async handler has a chance to register, and the cancel
                // would be dropped silently. By the time we read the next frame the
                // CTS entry is already in the dictionary.
                CancellationTokenSource? preBuiltCts = null;
                string? preBuiltIdKey = null;
                if (req.Method == "tools/call" && !req.IsNotification)
                {
                    preBuiltIdKey = IdKey(req.Id);
                    preBuiltCts = CancellationTokenSource.CreateLinkedTokenSource(_shutdown);
                    if (preBuiltIdKey != null) _toolCallCts[preBuiltIdKey] = preBuiltCts;
                }

                // Concurrent dispatch is required — long-running tools/call must not
                // block ping or other reads. Tool execution is serialized inside
                // ToolRegistry; only the COM-touching path needs that serialization.
                var capturedCts = preBuiltCts;
                var capturedKey = preBuiltIdKey;
                _ = HandleRequestAsync(req, capturedCts, capturedKey).ContinueWith(t =>
                {
                    if (t.IsFaulted)
                        Logger.Error(t.Exception!, "Unhandled in HandleRequestAsync (method={0})", req.Method);
                }, TaskScheduler.Default);
            }
            Logger.Info("McpServer: read loop exited");
        }

        private async Task HandleRequestAsync(JsonRpcRequest req, CancellationTokenSource? preBuiltCts = null, string? preBuiltIdKey = null)
        {
            try
            {
                // notifications/initialized has no id; we still want to handle it.
                if (req.Method == "notifications/initialized")
                {
                    _initialized = true;
                    Logger.Info("Client sent notifications/initialized");
                    // Fire-and-forget the roots refresh on the side; failure is logged but doesn't block.
                    _ = _roots.RefreshHostRootsAsync(_shutdown);
                    return;
                }

                if (req.Method == "notifications/cancelled")
                {
                    HandleCancelledNotification(req);
                    return;
                }

                if (req.Method == "notifications/roots/list_changed")
                {
                    Logger.Info("Client sent notifications/roots/list_changed");
                    _ = _roots.RefreshHostRootsAsync(_shutdown);
                    return;
                }

                if (req.IsNotification)
                {
                    // Unknown notifications are silently dropped per JSON-RPC 2.0.
                    return;
                }

                // Initialization gate: only initialize and ping run before the
                // client has sent notifications/initialized.
                if (!_initialized && req.Method != "initialize" && req.Method != "ping")
                {
                    await SendErrorAsync(req.Id, JsonRpcError.ServerNotInitialized,
                        "Server not initialized; expected 'notifications/initialized' first").ConfigureAwait(false);
                    return;
                }

                switch (req.Method)
                {
                    case "initialize":
                        await HandleInitializeAsync(req).ConfigureAwait(false);
                        break;
                    case "ping":
                        await SendResultAsync(req.Id, new JsonObject()).ConfigureAwait(false);
                        break;
                    case "tools/list":
                        await SendResultAsync(req.Id, new JsonObject { ["tools"] = _tools.DescribeAll() }).ConfigureAwait(false);
                        break;
                    case "tools/call":
                        await HandleToolCallAsync(req, preBuiltCts, preBuiltIdKey).ConfigureAwait(false);
                        break;
                    default:
                        await SendErrorAsync(req.Id, JsonRpcError.MethodNotFound, "Unknown method: " + req.Method).ConfigureAwait(false);
                        break;
                }
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "HandleRequestAsync exception (method={0})", req.Method);
                if (!req.IsNotification)
                    await SendErrorAsync(req.Id, JsonRpcError.InternalError, ex.Message).ConfigureAwait(false);
            }
        }

        private async Task HandleInitializeAsync(JsonRpcRequest req)
        {
            string negotiated = NegotiateProtocolVersion(req.Params);

            if (req.Params.HasValue && req.Params.Value.TryGetProperty("capabilities", out var caps))
                _roots.NoteHostCapabilities(caps);

            var result = new JsonObject
            {
                ["protocolVersion"] = negotiated,
                ["capabilities"] = new JsonObject
                {
                    ["tools"] = new JsonObject { ["listChanged"] = false },
                    // Note: 'logging' was advertised in v0.1.0 but never emitted.
                    // Removed per A6 — file logging in %LOCALAPPDATA% replaces it.
                },
                ["serverInfo"] = new JsonObject
                {
                    ["name"] = _serverName,
                    ["version"] = _serverVersion,
                },
                ["instructions"] = "PowerMill driver. Call connect_powermill before any project/toolpath operation. " +
                                   "Use run_macro and query_parameter for anything not covered by typed tools. " +
                                   "run_macro requires confirm_destructive: true on every call.",
            };
            await SendResultAsync(req.Id, result).ConfigureAwait(false);
        }

        internal static string NegotiateProtocolVersion(JsonElement? @params)
        {
            if (@params.HasValue && @params.Value.ValueKind == JsonValueKind.Object &&
                @params.Value.TryGetProperty("protocolVersion", out var pv) &&
                pv.ValueKind == JsonValueKind.String)
            {
                var requested = pv.GetString();
                foreach (var v in SupportedProtocolVersions)
                    if (v == requested) return v;
            }
            return SupportedProtocolVersions[0];
        }

        private async Task HandleToolCallAsync(JsonRpcRequest req, CancellationTokenSource? preBuiltCts, string? preBuiltIdKey)
        {
            string? name = null;
            JsonElement? args = null;
            JsonElement? progressToken = null;

            if (req.Params.HasValue && req.Params.Value.ValueKind == JsonValueKind.Object)
            {
                if (req.Params.Value.TryGetProperty("name", out var n)) name = n.GetString();
                if (req.Params.Value.TryGetProperty("arguments", out var a)) args = a;
                if (req.Params.Value.TryGetProperty("_meta", out var meta) &&
                    meta.ValueKind == JsonValueKind.Object &&
                    meta.TryGetProperty("progressToken", out var pt))
                    progressToken = pt;
            }

            // Use the pre-built CTS if the read loop registered one (race-free path).
            // Otherwise fall back to building one here — only happens if HandleRequestAsync
            // is called directly (e.g. from tests) without a pre-registered token.
            CancellationTokenSource? cts = preBuiltCts;
            string? idKey = preBuiltIdKey;
            bool ownsCts = false;
            if (cts == null)
            {
                cts = CancellationTokenSource.CreateLinkedTokenSource(_shutdown);
                idKey = IdKey(req.Id);
                if (idKey != null) _toolCallCts[idKey] = cts;
                ownsCts = true;
            }

            if (string.IsNullOrEmpty(name))
            {
                if (idKey != null) _toolCallCts.TryRemove(idKey, out _);
                if (ownsCts) cts.Dispose();
                await SendErrorAsync(req.Id, JsonRpcError.InvalidParams, "Missing 'name'").ConfigureAwait(false);
                return;
            }

            ToolResult result;
            try
            {
                var progress = new ProgressReporter(this, progressToken);
                result = await _tools.InvokeAsync(name!, args, progress, cts.Token).ConfigureAwait(false);
            }
            catch (UnknownToolException)
            {
                if (idKey != null) _toolCallCts.TryRemove(idKey, out _);
                if (ownsCts) cts.Dispose();
                await SendErrorAsync(req.Id, JsonRpcError.MethodNotFound, "Unknown tool: " + name).ConfigureAwait(false);
                return;
            }
            catch (OperationCanceledException)
            {
                result = ToolResult.Error("Operation cancelled by client.");
            }
            catch (Exception ex)
            {
                // Tool errors are returned as content with isError: true — that's
                // how MCP signals tool-level failure (vs protocol-level).
                Logger.Warn("Tool '{0}' threw: {1}", name, ex);
                result = ToolResult.Error(ex.Message);
            }
            finally
            {
                if (idKey != null) _toolCallCts.TryRemove(idKey, out _);
                cts.Dispose();
            }

            await SendResultAsync(req.Id, result.ToJson()).ConfigureAwait(false);
        }

        private void HandleCancelledNotification(JsonRpcRequest req)
        {
            if (!req.Params.HasValue || req.Params.Value.ValueKind != JsonValueKind.Object) return;
            if (!req.Params.Value.TryGetProperty("requestId", out var idEl)) return;
            var idKey = IdKey(idEl);
            if (idKey == null) return;
            if (_toolCallCts.TryGetValue(idKey, out var cts))
            {
                Logger.Info("Cancelling in-flight tool call id={0}", idKey);
                try { cts.Cancel(); } catch { }
            }
        }

        private static string? IdKey(JsonElement? id)
        {
            if (id == null) return null;
            return id.Value.ValueKind switch
            {
                JsonValueKind.Number => id.Value.GetRawText(),
                JsonValueKind.String => id.Value.GetString(),
                _ => null,
            };
        }

        private Task SendResultAsync(JsonElement? id, JsonNode result)
        {
            var resp = new JsonRpcResponse { Id = id, Result = result };
            return _transport.WriteMessageAsync(resp, _json, _shutdown);
        }

        private Task SendErrorAsync(JsonElement? id, int code, string message)
        {
            var resp = new JsonRpcResponse { Id = id, Error = new JsonRpcError { Code = code, Message = message } };
            return _transport.WriteMessageAsync(resp, _json, _shutdown);
        }

        internal Task SendNotificationAsync(string method, JsonNode? @params, CancellationToken ct)
        {
            var note = new JsonRpcNotification { Method = method, Params = @params };
            return _transport.WriteMessageAsync(note, _json, ct);
        }

        // --- Server-initiated requests (e.g. roots/list) ---

        public async Task<JsonNode?> SendRequestAsync(string method, JsonNode? @params, CancellationToken ct)
        {
            var id = Interlocked.Increment(ref _nextOutboundId);
            var tcs = new TaskCompletionSource<JsonRpcOutboundResponse>(TaskCreationOptions.RunContinuationsAsynchronously);
            _pendingOutbound[id] = tcs;

            var frame = new JsonObject
            {
                ["jsonrpc"] = "2.0",
                ["id"] = id,
                ["method"] = method,
            };
            if (@params != null) frame["params"] = @params;

            using var combined = CancellationTokenSource.CreateLinkedTokenSource(ct, _shutdown);
            combined.CancelAfter(_outboundTimeout);
            using (combined.Token.Register(() => tcs.TrySetCanceled(), useSynchronizationContext: false))
            {
                try
                {
                    await _transport.WriteMessageAsync(frame, _json, combined.Token).ConfigureAwait(false);
                    var resp = await tcs.Task.ConfigureAwait(false);
                    if (resp.IsError) throw new InvalidOperationException("Outbound request failed: " + resp.ErrorMessage);
                    return resp.Result;
                }
                catch (OperationCanceledException) when (!ct.IsCancellationRequested && !_shutdown.IsCancellationRequested)
                {
                    // Cancellation came from CancelAfter, not the caller or shutdown.
                    Logger.Warn("Outbound request '{0}' (id={1}) timed out after {2}s", method, id, _outboundTimeout.TotalSeconds);
                    throw;
                }
                finally
                {
                    _pendingOutbound.TryRemove(id, out _);
                }
            }
        }

        private void HandleInboundResponse(JsonElement idEl, bool hasResult, bool hasError, JsonElement parsed)
        {
            if (idEl.ValueKind != JsonValueKind.Number) return; // we only allocate numeric outbound ids
            if (!idEl.TryGetInt64(out var id)) return;
            if (!_pendingOutbound.TryGetValue(id, out var tcs)) return;

            if (hasError && parsed.TryGetProperty("error", out var errEl))
            {
                var msg = errEl.TryGetProperty("message", out var m) ? m.GetString() ?? "" : "(no message)";
                tcs.TrySetResult(new JsonRpcOutboundResponse { IsError = true, ErrorMessage = msg });
                return;
            }
            if (hasResult && parsed.TryGetProperty("result", out var resultEl))
            {
                JsonNode? node = null;
                try { node = JsonNode.Parse(resultEl.GetRawText()); } catch { }
                tcs.TrySetResult(new JsonRpcOutboundResponse { Result = node });
            }
        }

        private struct JsonRpcOutboundResponse
        {
            public JsonNode? Result;
            public bool IsError;
            public string? ErrorMessage;
        }
    }

    public sealed class ProgressReporter
    {
        private readonly McpServer? _server;
        private readonly JsonElement? _progressToken;

        /// No-op reporter used by tests and by tools when no progress token
        /// was supplied. Calling ReportAsync is a fast Task.CompletedTask.
        public static ProgressReporter NoOp { get; } = new ProgressReporter(null, null);

        internal ProgressReporter(McpServer? server, JsonElement? progressToken)
        {
            _server = server;
            _progressToken = progressToken;
        }

        public Task ReportAsync(double progress, double? total, string? message, CancellationToken ct)
        {
            if (_progressToken == null || _server == null) return Task.CompletedTask;
            var p = new JsonObject
            {
                ["progressToken"] = _progressToken.Value.ValueKind == JsonValueKind.Number
                    ? (JsonNode)_progressToken.Value.GetInt64()
                    : (JsonNode)(_progressToken.Value.GetString() ?? ""),
                ["progress"] = progress,
            };
            if (total.HasValue) p["total"] = total.Value;
            if (!string.IsNullOrEmpty(message)) p["message"] = message;
            return _server.SendNotificationAsync("notifications/progress", p, ct);
        }
    }
}
