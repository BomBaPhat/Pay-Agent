import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { getCurrentAgentContext } from "@/lib/currentAgent";
import { getAuditReport } from "@/lib/payments/audit";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  created: "Đang tạo",
  policy_check: "Đang kiểm tra policy",
  pending_user_approval: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
  executing: "Đang thực thi",
  confirmed: "Thành công",
  failed: "Thất bại",
};

const POLICY_LABEL: Record<string, { text: string; className: string }> = {
  auto_approve: { text: "Tự động duyệt", className: "bg-confirmed/15 text-confirmed" },
  require_approval: { text: "Cần bạn duyệt", className: "bg-pending/15 text-pending" },
  deny: { text: "Từ chối", className: "bg-denied/15 text-denied" },
  user_approved: { text: "Bạn đã duyệt", className: "bg-confirmed/15 text-confirmed" },
  user_rejected: { text: "Bạn đã từ chối", className: "bg-denied/15 text-denied" },
};

export default async function TransactionsPage() {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice />;

  const context = await getCurrentAgentContext();
  if (!context) redirect("/login");

  const report = await getAuditReport(context.agentId);

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text md:flex-row">
      <AppSidebar />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Audit Log & Spend Report</h1>
        <p className="mt-1 text-sm text-app-muted">
          Agent đã dùng bao nhiêu tiền, cho gì, và có tuân thủ policy hay không — minh bạch từng khoản.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-app-border bg-app-panel p-4">
            <p className="text-xs text-app-muted">Tổng đã chi</p>
            <p className="mt-1 text-xl font-semibold">{report.totalSpentUsdc.toFixed(2)}</p>
            <p className="text-xs text-app-muted-2">USDC · {report.confirmedCount} giao dịch</p>
          </div>
          <div className="rounded-lg border border-app-border bg-app-panel p-4">
            <p className="text-xs text-app-muted">Tự động duyệt</p>
            <p className="mt-1 text-xl font-semibold text-confirmed">{report.autoApprovedCount}</p>
          </div>
          <div className="rounded-lg border border-app-border bg-app-panel p-4">
            <p className="text-xs text-app-muted">Cần bạn duyệt</p>
            <p className="mt-1 text-xl font-semibold text-pending">{report.requireApprovalCount}</p>
          </div>
          <div className="rounded-lg border border-app-border bg-app-panel p-4">
            <p className="text-xs text-app-muted">Bị từ chối</p>
            <p className="mt-1 text-xl font-semibold text-denied">{report.rejectedCount}</p>
          </div>
        </div>

        {report.byService.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-app-text">Chi tiêu theo dịch vụ / người nhận</h2>
            <div className="mt-3 divide-y divide-app-border rounded-lg border border-app-border bg-app-panel">
              {report.byService.map((s) => (
                <div key={s.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="max-w-[60%] truncate text-app-text" title={s.label}>
                    {s.label}
                  </span>
                  <span className="text-app-muted">
                    {s.totalUsdc.toFixed(2)} USDC · {s.count} lần
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-sm font-medium text-app-text">Toàn bộ payment intents</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-app-border text-app-muted">
                  <th className="py-2">Service / Recipient</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Trạng thái</th>
                  <th className="py-2">Policy</th>
                  <th className="py-2">Tx</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-app-muted-2">
                      Chưa có giao dịch nào.
                    </td>
                  </tr>
                )}
                {report.rows.map((row) => {
                  const policy = row.policyDecision ? POLICY_LABEL[row.policyDecision] : null;
                  return (
                    <tr key={row.id} className="border-b border-app-border align-top">
                      <td className="max-w-[10rem] truncate py-2" title={row.serviceName ?? row.recipient}>
                        {row.serviceName ?? row.recipient}
                      </td>
                      <td className="py-2">{row.amountUsdc.toFixed(2)} USDC</td>
                      <td className="py-2">{STATUS_LABEL[row.status] ?? row.status}</td>
                      <td className="py-2">
                        {policy ? (
                          <span
                            className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${policy.className}`}
                            title={row.policyReason ?? undefined}
                          >
                            {policy.text}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2">
                        {row.txHash ? (
                          <a
                            className="text-app-text underline"
                            href={`https://testnet.arcscan.app/tx/${row.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Xem
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
