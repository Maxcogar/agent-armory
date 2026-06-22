using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

namespace PowerMillMcpServer.Com
{
    /// PowerMill's COM interface is single-threaded apartment. ALL calls to the
    /// PMAutomation object and any objects it returns must happen on a thread
    /// initialized with ApartmentState.STA. Calling from a thread-pool worker
    /// will produce RPC_E_WRONG_THREAD or silent hangs.
    ///
    /// This class owns one such thread and marshals work onto it via a queue.
    public sealed class StaWorker : IDisposable
    {
        private readonly Thread _thread;
        private readonly BlockingCollection<Action> _queue = new BlockingCollection<Action>();
        private readonly CancellationTokenSource _shutdown = new CancellationTokenSource();
        private bool _disposed;

        public StaWorker()
        {
            _thread = new Thread(WorkerLoop)
            {
                Name = "PowerMillStaWorker",
                IsBackground = true,
            };
            _thread.SetApartmentState(ApartmentState.STA);
            _thread.Start();
        }

        public Task<T> RunAsync<T>(Func<T> func, CancellationToken ct = default)
        {
            ThrowIfDisposed();
            var tcs = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
            using (ct.Register(() => tcs.TrySetCanceled(ct), useSynchronizationContext: false))
            {
                _queue.Add(() =>
                {
                    if (ct.IsCancellationRequested) { tcs.TrySetCanceled(ct); return; }
                    try { tcs.TrySetResult(func()); }
                    catch (Exception ex) { tcs.TrySetException(ex); }
                });
            }
            return tcs.Task;
        }

        public Task RunAsync(Action action, CancellationToken ct = default)
        {
            return RunAsync<object?>(() => { action(); return null; }, ct);
        }

        private void WorkerLoop()
        {
            try
            {
                foreach (var work in _queue.GetConsumingEnumerable(_shutdown.Token))
                {
                    try { work(); }
                    catch
                    {
                        // Exceptions are surfaced through the TaskCompletionSource;
                        // a swallow here only catches programmer error in the queue
                        // wrapper itself.
                    }
                }
            }
            catch (OperationCanceledException) { /* shutdown */ }
        }

        private void ThrowIfDisposed()
        {
            if (_disposed) throw new ObjectDisposedException(nameof(StaWorker));
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _queue.CompleteAdding();
            _shutdown.Cancel();
            try { _thread.Join(TimeSpan.FromSeconds(5)); } catch { }
            _queue.Dispose();
            _shutdown.Dispose();
        }
    }
}
