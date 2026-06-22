using System;
using System.Threading;
using System.Threading.Tasks;
using Autodesk.ProductInterface.PowerMILL;

namespace PowerMillMcpServer.PowerMill
{
    /// Surface tools depend on. Allows tests to substitute a fake without
    /// touching real COM. Tools that require live PowerMill obviously can't
    /// be tested through this interface — those tests are end-to-end (Part G).
    /// But validation logic before WithPowerMillAsync is reached is testable
    /// by giving the fake a "do not invoke the func" semantic.
    public interface IPowerMillSession
    {
        bool IsConnected { get; }
        Task<string> ConnectAsync(bool spawnNew, bool withGui, CancellationToken ct);
        Task DisconnectAsync(CancellationToken ct);
        Task<TResult> WithPowerMillAsync<TResult>(Func<PMAutomation, TResult> func, CancellationToken ct);
        Task WithPowerMillAsync(Action<PMAutomation> action, CancellationToken ct);
        Task<string> DescribeAsync(CancellationToken ct);
    }
}
