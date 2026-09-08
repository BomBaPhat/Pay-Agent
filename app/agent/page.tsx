import { redirect } from "next/navigation";
import { AgentTerminal } from "@/components/AgentTerminal";
import { AppSidebar } from "@/components/AppSidebar";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { listServices } from "@/lib/agent/services";
import { agentVisual, serviceVisual } from "@/lib/agent/visual";
import { createAgentWalletClient } from "@/lib/circle/agentWallet";
import { getCurrentAgentContext } from "@/lib/currentAgent";
import { getAuditReport } from "@/lib/payments/audit";
import { isSupabaseConfigured } from "@/lib/supabase/server";

/** 2 slot minh hoạ multi-agent sắp ra mắt — không phải agent thật, chỉ hiện để xem trước layout (giống "+ New"), luôn Idle và không bấm được. */
const UPCOMING_AGENT_SLOTS = [
  { name: "Trading Bot", limitLabel: "$20.00 Limit" },
  { name: "Social Auto-Post", limitLabel: "$2.00 Limit" },
];

function truncateAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function AgentPage() {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice />;

  const context = await getCurrentAgentContext();
  if (!context) redirect("/login");

  const { wallet, policy, agentName } = context;
  const walletPending = wallet.type === "circle_smart_account" && !wallet.providerWalletId;

  let balanceUsdc = 0;
  if (wallet.type === "circle_smart_account" && wallet.providerWalletId) {
    try {
      const circle = createAgentWalletClient();
      balanceUsdc = await circle.getBalanceUsdc(wallet.providerWalletId);
    } catch {
      // Không chặn trang — thanh trạng thái vẫn hiện, chỉ số dư hiện 0.
    }
  }

  const [services, report] = await Promise.all([listServices(), getAuditReport(context.agentId)]);
  const history = report.rows.slice(0, 6).map((row) => ({
    id: row.id,
    label: row.serviceName ?? row.recipient,
    amountUsdc: row.amountUsdc,
    timeAgo: timeAgo(row.createdAt),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text md:flex-row">
      <AppSidebar />

      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-lg font-semibold uppercase tracking-[0.08em]">Agents Playground &amp; Executor</h1>

          {/* Status bar */}
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 rounded-2xl border border-app-border bg-app-panel px-5 py-3 text-sm">
            <span className="flex items-center gap-2">
              <VaultIcon className="h-4 w-4 text-app-muted" />
              <span className="text-app-muted">Vault Balance:</span>
              <span className="font-mono font-medium">{balanceUsdc.toFixed(2)} USDC</span>
            </span>
            <span className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-app-muted" />
              <span className="text-app-muted">Daily Limit:</span>
              <span className="font-mono font-medium">{(policy?.dailyLimitUsdc ?? 0).toFixed(2)} USDC</span>
            </span>
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${walletPending ? "bg-pending" : "bg-confirmed"}`} />
              <span className="text-app-muted">Status:</span>
              <span className="font-medium">{walletPending ? "Pending" : "Active"}</span>
            </span>
            <span className="flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-app-muted" />
              <span className="text-app-muted">Wallet:</span>
              <span className="font-mono font-medium">{truncateAddress(wallet.address)}</span>
            </span>
          </div>

          {/* Two-column layout */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
            {/* Left: agent card + history */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-app-border bg-app-panel p-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-app-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-confirmed" />
                    Active Agents
                  </p>
                  <span
                    className="flex cursor-not-allowed items-center gap-1 rounded-full bg-confirmed/15 px-2.5 py-1 text-[11px] font-medium text-confirmed"
                    title="Multi-agent — coming soon"
                  >
                    <PlusIcon className="h-2.5 w-2.5" />
                    New
                  </span>
                </div>

                <div className="mt-1 divide-y divide-app-border">
                  {(() => {
                    const { Icon, classes } = agentVisual(agentName);
                    return (
                      <div className="flex items-center gap-3 rounded-lg bg-sky-500/[0.06] px-2 py-3">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                            walletPending ? "border-pending" : "border-confirmed bg-confirmed"
                          }`}
                        />
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${classes}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{agentName}</p>
                          <p className="text-xs text-app-muted">${(policy?.perTxLimitUsdc ?? 0).toFixed(2)} Limit</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            walletPending ? "bg-pending/15 text-pending" : "bg-confirmed/15 text-confirmed"
                          }`}
                        >
                          {walletPending ? "Idle" : "Active"}
                        </span>
                        <ChevronIcon className="h-3.5 w-3.5 shrink-0 text-app-muted-2" />
                      </div>
                    );
                  })()}

                  {UPCOMING_AGENT_SLOTS.map((slot) => {
                    const { Icon, classes } = agentVisual(slot.name);
                    return (
                      <div
                        key={slot.name}
                        className="flex cursor-not-allowed items-center gap-3 px-2 py-3 opacity-70"
                        title="Multi-agent — coming soon"
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-app-border" />
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${classes}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{slot.name}</p>
                          <p className="text-xs text-app-muted">{slot.limitLabel}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-app-muted-2/20 px-2 py-0.5 text-[11px] font-medium text-app-muted">
                          Idle
                        </span>
                        <ChevronIcon className="h-3.5 w-3.5 shrink-0 text-app-muted-2" />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-app-border bg-app-panel p-4">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-app-muted">
                  <HistoryIcon className="h-3.5 w-3.5" />
                  Chat History
                </p>
                {history.length === 0 ? (
                  <p className="mt-3 text-sm text-app-muted-2">No activity yet.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-app-border">
                    {history.map((h) => {
                      const { Icon, classes } = serviceVisual(h.label);
                      return (
                        <li key={h.id} className="flex items-center gap-2.5 py-2 text-sm">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${classes}`}>
                            <Icon className="h-3 w-3" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-app-text">{h.label}</span>
                          <span className="shrink-0 text-xs text-app-muted-2">{h.timeAgo}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Right: terminal */}
            <AgentTerminal agentName={agentName} services={services} />
          </div>
        </div>
      </main>
    </div>
  );
}

function VaultIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

function ClockIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5 V12 L15 14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WalletIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <rect x="2.5" y="6" width="19" height="13" rx="3" />
      <path d="M2.5 10 H21.5" strokeLinecap="round" />
      <circle cx="17" cy="14.2" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HistoryIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5 V12 L14.5 13.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={props.className}>
      <path d="M12 5 V19 M5 12 H19" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M9 5 L15 12 L9 19" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
