import Link from "next/link";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { createAgentWalletClient } from "@/lib/circle/agentWallet";
import { getCurrentAgentContext } from "@/lib/currentAgent";
import { getAuditReport } from "@/lib/payments/audit";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  created: "Creating",
  policy_check: "Checking",
  pending_user_approval: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  executing: "Executing",
  confirmed: "Executed",
  failed: "Failed",
};

const STATUS_CLASS: Record<string, string> = {
  confirmed: "bg-confirmed/15 text-confirmed",
  approved: "bg-confirmed/15 text-confirmed",
  pending_user_approval: "bg-pending/15 text-pending",
  rejected: "bg-denied/15 text-denied",
  failed: "bg-denied/15 text-denied",
};

const POLICY_CHECK_LABEL: Record<string, string> = {
  auto_approve: "Auto Passed",
  require_approval: "Pending User",
  deny: "Over Limit",
  user_approved: "User Approved",
  user_rejected: "User Rejected",
};

function truncateAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice />;

  const context = await getCurrentAgentContext();
  if (!context) redirect("/login");

  const { wallet, policy } = context;
  const walletPending = wallet.type === "circle_smart_account" && !wallet.providerWalletId;

  let balanceUsdc = 0;
  let balanceError: string | null = null;

  if (wallet.type === "circle_smart_account" && wallet.providerWalletId) {
    try {
      const circle = createAgentWalletClient();
      balanceUsdc = await circle.getBalanceUsdc(wallet.providerWalletId);
    } catch (err) {
      balanceError = err instanceof Error ? err.message : "Không lấy được số dư từ Circle.";
    }
  }

  const report = await getAuditReport(context.agentId);
  const ledgerRows = report.rows.slice(0, 8);
  const dailyLimit = policy?.dailyLimitUsdc ?? 0;
  const maxDayUsdc = Math.max(...report.byDay.map((d) => d.totalUsdc), dailyLimit, 0.01);

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text md:flex-row">
      <AppSidebar />

      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          {/* Top row: welcome + wallet chip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Welcome back, builder!</h1>
              <p className="mt-1 text-sm text-app-muted">Your agent&rsquo;s wallet, capped by the policy you set.</p>
            </div>
            <a
              href={`https://testnet.arcscan.app/address/${wallet.address}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-app-border px-3 py-1.5 font-mono text-xs text-app-muted transition hover:border-app-muted-2 hover:text-app-text"
              title={wallet.address}
            >
              {truncateAddress(wallet.address)}
            </a>
          </div>

          {walletPending && (
            <p className="mt-4 rounded-xl bg-pending/10 px-4 py-3 text-sm text-pending">
              Agent Wallet chưa được tạo thật (Circle chưa cấu hình xong CIRCLE_API_KEY / CIRCLE_ENTITY_SECRET /
              CIRCLE_WALLET_SET_ID) — xem docs/SETUP.md. Địa chỉ dưới đây chỉ là placeholder.
            </p>
          )}

          {/* Stat cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-app-border bg-app-panel p-5">
              <p className="text-xs uppercase tracking-[0.1em] text-app-muted-2">Total Vault Balance</p>
              <p className="mt-2 font-mono text-2xl font-medium">
                {balanceUsdc.toFixed(2)} <span className="text-sm font-normal text-app-muted-2">USDC</span>
              </p>
              {balanceError && <p className="mt-1 text-xs text-denied">{balanceError}</p>}
            </div>
            <div className="rounded-2xl border border-app-border bg-app-panel p-5">
              <p className="text-xs uppercase tracking-[0.1em] text-app-muted-2">Daily Spent / Limit</p>
              <p className="mt-2 font-mono text-2xl font-medium">
                {report.spentTodayUsdc.toFixed(2)}{" "}
                <span className="text-sm font-normal text-app-muted-2">/ {dailyLimit.toFixed(2)} USDC</span>
              </p>
            </div>
            <div className="rounded-2xl border border-app-border bg-app-panel p-5">
              <p className="text-xs uppercase tracking-[0.1em] text-app-muted-2">Agent Status</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-medium">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${walletPending ? "bg-pending" : "bg-confirmed"}`}
                />
                {walletPending ? "Pending" : "Active"}
              </p>
            </div>
          </div>

          {/* Analytics + quick policy */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-app-border bg-app-panel p-5">
              <p className="text-xs uppercase tracking-[0.1em] text-app-muted-2">Spending Analytics — last 7 days</p>
              <div className="mt-5 flex h-32 items-end gap-3">
                {report.byDay.map((d) => {
                  const heightPct = Math.max((d.totalUsdc / maxDayUsdc) * 100, d.totalUsdc > 0 ? 6 : 2);
                  return (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-24 w-full items-end">
                        <div
                          className={`w-full rounded-t-md ${d.totalUsdc > 0 ? "bg-confirmed" : "bg-app-border"}`}
                          style={{ height: `${heightPct}%` }}
                          title={`${d.totalUsdc.toFixed(2)} USDC`}
                        />
                      </div>
                      <span className="text-[11px] text-app-muted-2">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-app-border bg-app-panel p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.1em] text-app-muted-2">Quick Policy Guardrails</p>
                <Link href="/policy" className="text-xs text-confirmed hover:underline">
                  Edit
                </Link>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-app-muted">Max Single Tx</dt>
                  <dd className="rounded-md bg-app-bg px-2 py-0.5 font-mono text-xs">
                    {policy?.perTxLimitUsdc ?? "-"} USDC
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-app-muted">Daily Budget</dt>
                  <dd className="rounded-md bg-app-bg px-2 py-0.5 font-mono text-xs">
                    {policy?.dailyLimitUsdc ?? "-"} USDC
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-app-muted">Approval above</dt>
                  <dd className="rounded-md bg-app-bg px-2 py-0.5 font-mono text-xs">
                    {policy?.requireApprovalAboveUsdc ?? "-"} USDC
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex gap-2">
                <a
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-full bg-paper px-3 py-2 text-center text-xs font-medium text-ink transition hover:bg-[#c9ff5c]"
                >
                  Fund via faucet
                </a>
              </div>
            </div>
          </div>

          {/* Live ledger */}
          <div className="mt-4 rounded-2xl border border-app-border bg-app-panel p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.1em] text-app-muted-2">
                Payment_Intents — Live Ledger
              </p>
              <Link href="/transactions" className="text-xs text-confirmed hover:underline">
                View All Intents →
              </Link>
            </div>

            {ledgerRows.length === 0 ? (
              <p className="mt-4 text-sm text-app-muted-2">
                No payments yet — go to{" "}
                <Link href="/agent" className="text-confirmed hover:underline">
                  Agent
                </Link>{" "}
                to try one.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-app-border text-xs uppercase tracking-[0.05em] text-app-muted-2">
                      <th className="py-2 pr-3 font-normal">Time</th>
                      <th className="py-2 pr-3 font-normal">Intent / Action</th>
                      <th className="py-2 pr-3 font-normal">Amount</th>
                      <th className="py-2 pr-3 font-normal">Policy Check</th>
                      <th className="py-2 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerRows.map((row) => (
                      <tr key={row.id} className="border-b border-app-border/60">
                        <td className="whitespace-nowrap py-2.5 pr-3 font-mono text-xs text-app-muted-2">
                          {new Date(row.createdAt).toLocaleTimeString("en-US", { hour12: false })}
                        </td>
                        <td className="max-w-[14rem] truncate py-2.5 pr-3 text-app-text">
                          {row.serviceName ?? row.recipient}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-3 font-mono text-xs text-app-muted">
                          {row.amountUsdc.toFixed(2)} USDC
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-3 text-xs text-app-muted">
                          {row.policyDecision ? POLICY_CHECK_LABEL[row.policyDecision] ?? row.policyDecision : "-"}
                        </td>
                        <td className="whitespace-nowrap py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide ${
                              STATUS_CLASS[row.status] ?? "bg-app-border text-app-muted"
                            }`}
                          >
                            {STATUS_LABEL[row.status] ?? row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
