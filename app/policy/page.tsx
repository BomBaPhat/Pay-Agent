"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AppSidebar } from "@/components/AppSidebar";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const DEFAULT_FORM: PolicyForm = {
  dailyLimitUsdc: 50,
  perTxLimitUsdc: 5,
  requireApprovalAboveUsdc: 5,
  allowedRecipients: "any",
};

interface PolicyForm {
  dailyLimitUsdc: number;
  perTxLimitUsdc: number;
  requireApprovalAboveUsdc: number;
  allowedRecipients: string[] | "any";
}

function truncateAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

function isDefaultPolicy(form: PolicyForm) {
  return (
    form.dailyLimitUsdc === DEFAULT_FORM.dailyLimitUsdc &&
    form.perTxLimitUsdc === DEFAULT_FORM.perTxLimitUsdc &&
    form.requireApprovalAboveUsdc === DEFAULT_FORM.requireApprovalAboveUsdc
  );
}

export default function PolicyPage() {
  const [form, setForm] = useState<PolicyForm>(DEFAULT_FORM);
  const [spentTodayUsdc, setSpentTodayUsdc] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({ limits: true, approval: true, yield: true });

  useEffect(() => {
    fetch("/api/policy")
      .then((res) => res.json())
      .then((data) => {
        if (data.policy) {
          setForm({
            dailyLimitUsdc: data.policy.dailyLimitUsdc,
            perTxLimitUsdc: data.policy.perTxLimitUsdc,
            requireApprovalAboveUsdc: data.policy.requireApprovalAboveUsdc,
            allowedRecipients: data.policy.allowedRecipients,
          });
        }
        if (typeof data.spentTodayUsdc === "number") setSpentTodayUsdc(data.spentTodayUsdc);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    setMessage(res.ok ? "Đã lưu policy." : "Lưu thất bại, thử lại.");
  }

  function addAddress() {
    const addr = newAddress.trim();
    if (!ADDRESS_REGEX.test(addr)) {
      setAddressError("Địa chỉ không hợp lệ — cần đúng định dạng 0x + 40 ký tự hex.");
      return;
    }
    setForm((f) => {
      const current = f.allowedRecipients === "any" ? [] : f.allowedRecipients;
      if (current.includes(addr)) return f;
      return { ...f, allowedRecipients: [...current, addr] };
    });
    setNewAddress("");
    setAddressError(null);
  }

  function removeAddress(addr: string) {
    setForm((f) => {
      if (f.allowedRecipients === "any") return f;
      const next = f.allowedRecipients.filter((a) => a !== addr);
      return { ...f, allowedRecipients: next.length === 0 ? "any" : next };
    });
  }

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-app-bg text-app-text md:flex-row">
        <AppSidebar />
        <main className="mx-auto max-w-lg px-6 py-10 text-app-muted">Đang tải...</main>
      </div>
    );
  }

  const dailyPct = form.dailyLimitUsdc > 0 ? Math.min(100, (spentTodayUsdc / form.dailyLimitUsdc) * 100) : 0;
  const autoApproveEnabled = form.requireApprovalAboveUsdc > 0;
  const policyLabel = isDefaultPolicy(form) ? "Strict Policy (Default)" : "Custom Policy";
  const whitelist = form.allowedRecipients === "any" ? [] : form.allowedRecipients;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text md:flex-row">
      <AppSidebar />
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <form className="mx-auto max-w-6xl" onSubmit={handleSubmit}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="flex items-center gap-2 text-lg font-semibold uppercase tracking-[0.08em]">
              <ShieldIcon className="h-5 w-5 text-confirmed" />
              Policy Rules &amp; Security Guardrails
            </h1>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-confirmed/40 bg-confirmed/10 px-4 py-2 text-sm font-medium text-confirmed transition hover:bg-confirmed/15 disabled:opacity-50"
            >
              <SaveIcon className="h-4 w-4" />
              {saving ? "Saving..." : "Save Policy"}
            </button>
          </div>
          {message && <p className="mt-2 text-sm text-app-muted">{message}</p>}

          {/* Status bar */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-app-border bg-app-panel px-5 py-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-confirmed" />
              <span className="text-app-muted">Active Guardrails:</span>
              <span className="font-medium">{policyLabel}</span>
            </span>
            <span className="text-app-border">|</span>
            <span className="flex items-center gap-2">
              <span className="text-app-muted">Daily Spent:</span>
              <span className="font-mono font-medium">
                ${spentTodayUsdc.toFixed(2)} / ${form.dailyLimitUsdc.toFixed(2)} USDC ({dailyPct.toFixed(1)}%)
              </span>
            </span>
            <span className="text-app-border">|</span>
            <span className="flex items-center gap-2">
              <span className="text-app-muted">Auto-Approve:</span>
              <span className={`font-medium ${autoApproveEnabled ? "text-confirmed" : "text-app-muted"}`}>
                {autoApproveEnabled ? "ENABLED" : "DISABLED"}
              </span>
            </span>
          </div>

          {/* Two-column layout */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Section 1: Spending Limits */}
            <div className="rounded-2xl border border-app-border bg-app-panel p-4">
              <button
                type="button"
                onClick={() => toggleSection("limits")}
                className="flex w-full items-center justify-between"
              >
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-app-text">
                  <SlidersIcon className="h-4 w-4 text-confirmed" />
                  1. Spending Limits
                </p>
                <ChevronUpIcon className={`h-4 w-4 text-app-muted-2 transition-transform ${openSections.limits ? "" : "rotate-180"}`} />
              </button>

              {openSections.limits && (
                <div className="mt-2 divide-y divide-app-border">
                  <LimitRow
                    icon={DollarIcon}
                    label="Daily Limit (USDC)"
                    value={form.dailyLimitUsdc}
                    max={500}
                    onChange={(v) => setForm((f) => ({ ...f, dailyLimitUsdc: v }))}
                  />
                  <LimitRow
                    icon={ExchangeIcon}
                    label="Per-Transaction Limit (USDC)"
                    value={form.perTxLimitUsdc}
                    max={100}
                    onChange={(v) => setForm((f) => ({ ...f, perTxLimitUsdc: v }))}
                  />
                  <LimitRow
                    icon={ShieldSmallIcon}
                    label="Require Manual Approval Above (USDC)"
                    value={form.requireApprovalAboveUsdc}
                    max={100}
                    onChange={(v) => setForm((f) => ({ ...f, requireApprovalAboveUsdc: v }))}
                  />

                  <div className="pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium uppercase tracking-[0.05em] text-app-muted">
                        <ChartIcon className="h-3.5 w-3.5" />
                        Today&apos;s Spending Progress
                      </span>
                      <span className="font-mono text-app-muted">{dailyPct.toFixed(1)}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-app-border">
                      <div className="h-full rounded-full bg-confirmed transition-all" style={{ width: `${dailyPct}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-app-muted">
                      ${spentTodayUsdc.toFixed(2)} used of ${form.dailyLimitUsdc.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Approval Rules & Whitelist */}
            <div className="rounded-2xl border border-app-border bg-app-panel p-4">
              <button
                type="button"
                onClick={() => toggleSection("approval")}
                className="flex w-full items-center justify-between"
              >
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-app-text">
                  <BellIcon className="h-4 w-4 text-confirmed" />
                  2. Approval Rules &amp; Whitelist
                </p>
                <ChevronUpIcon className={`h-4 w-4 text-app-muted-2 transition-transform ${openSections.approval ? "" : "rotate-180"}`} />
              </button>

              {openSections.approval && (
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.05em] text-app-muted">
                      Trusted Whitelist
                      <span className="ml-1 normal-case text-app-muted-2">(để trống = cho phép mọi địa chỉ)</span>
                    </p>

                    {whitelist.length === 0 ? (
                      <p className="mt-2 text-xs text-app-muted-2">Chưa giới hạn — agent được trả cho bất kỳ địa chỉ nào.</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {whitelist.map((addr) => (
                          <li
                            key={addr}
                            className="flex items-center gap-2 rounded-lg border border-app-border px-3 py-1.5 text-xs"
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-confirmed" />
                            <span className="min-w-0 flex-1 truncate font-mono">{truncateAddress(addr)}</span>
                            <button
                              type="button"
                              onClick={() => removeAddress(addr)}
                              className="flex shrink-0 items-center gap-1 rounded border border-app-border px-2 py-1 text-app-muted transition hover:border-denied/40 hover:text-denied"
                            >
                              <TrashIcon className="h-3 w-3" />
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="0x..."
                        value={newAddress}
                        onChange={(e) => {
                          setNewAddress(e.target.value);
                          setAddressError(null);
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-dashed border-app-border bg-app-bg px-3 py-1.5 font-mono text-xs text-app-text"
                      />
                      <button
                        type="button"
                        onClick={addAddress}
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-app-border px-2.5 py-1.5 text-xs text-app-muted transition hover:border-confirmed/40 hover:text-confirmed"
                      >
                        <PlusIcon className="h-3 w-3" />
                        Add
                      </button>
                    </div>
                    {addressError && <p className="mt-1 text-xs text-denied">{addressError}</p>}
                  </div>

                  <div className="border-t border-app-border pt-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.05em] text-app-muted">
                      Multi-Channel Approval Notifications
                      <span className="rounded-full bg-app-muted-2/20 px-1.5 py-0.5 text-[10px] normal-case text-app-muted">
                        Coming soon
                      </span>
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-app-muted-2">
                      <li className="flex items-center gap-2">
                        <input type="checkbox" disabled className="accent-app-muted-2" />
                        <TelegramIcon className="h-3.5 w-3.5" />
                        Telegram Bot Notification
                      </li>
                      <li className="flex items-center gap-2">
                        <input type="checkbox" disabled className="accent-app-muted-2" />
                        <DiscordIcon className="h-3.5 w-3.5" />
                        Discord Webhook Alert
                      </li>
                      <li className="flex items-center gap-2">
                        <input type="checkbox" disabled className="accent-app-muted-2" />
                        <MailIcon className="h-3.5 w-3.5" />
                        Email Approval Link
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: DeFi Yield Automation (coming soon) */}
          <div className="mt-4 rounded-2xl border border-app-border bg-app-panel p-4 opacity-90">
            <button type="button" onClick={() => toggleSection("yield")} className="flex w-full items-center justify-between">
              <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-app-text">
                <TargetIcon className="h-4 w-4 text-confirmed" />
                3. DeFi Yield Automation
                <span className="rounded-full bg-app-muted-2/20 px-2 py-0.5 text-[10px] normal-case text-app-muted">
                  Range: Experimental / Coming soon
                </span>
              </p>
              <ChevronUpIcon className={`h-4 w-4 text-app-muted-2 transition-transform ${openSections.yield ? "" : "rotate-180"}`} />
            </button>

            {openSections.yield && (
              <div className="mt-3">
                <p className="text-sm text-app-muted">Tự động sinh lãi từ USDC nhàn rỗi trong Agent Vault.</p>
                <p className="mt-1 text-xs text-app-muted-2">
                  Số USDC chưa dùng tới hạn mức sẽ tự động tối ưu hoá lợi suất qua các giao thức DeFi uy tín.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 overflow-x-auto rounded-lg bg-app-bg px-3 py-2.5 font-mono text-xs text-app-muted">
                  <span className="rounded border border-app-border px-2 py-1">Agent Vault</span>
                  <span className="text-app-muted-2">--&gt;</span>
                  <span className="rounded border border-app-border px-2 py-1">Idle Funds</span>
                  <span className="text-app-muted-2">--&gt;</span>
                  <span className="rounded border border-app-border px-2 py-1">Aave / Curve Protocol</span>
                  <span className="text-app-muted-2">--&gt;</span>
                  <span className="rounded border border-app-border px-2 py-1">Yield</span>
                  <span className="text-app-muted-2">--&gt;</span>
                  <span className="rounded border border-confirmed/30 bg-confirmed/10 px-2 py-1 text-confirmed">
                    +4.5% APY Earned
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <label className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 text-sm text-app-muted">
                    <input type="checkbox" disabled className="peer sr-only" />
                    <span className="relative block h-6 w-11 rounded-full bg-app-border after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-app-panel after:content-['']" />
                    Enable Automated Yield Optimization
                  </label>
                  <span className="rounded-full border border-app-border px-2 py-0.5 text-[11px] text-app-muted-2">
                    Toggles: OFF
                  </span>
                </div>
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

function LimitRow({
  icon: Icon,
  label,
  value,
  max,
  onChange,
}: {
  icon: (props: { className?: string }) => JSX.Element;
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-confirmed/10 text-confirmed">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium uppercase tracking-[0.05em] text-app-muted">{label}</p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-app-border">
          <div className="h-full rounded-full bg-confirmed transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 text-sm font-mono font-medium text-app-text">
        $
        <input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 rounded bg-transparent px-1 text-right outline-none focus:ring-1 focus:ring-confirmed"
        />
      </div>
      <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-app-muted-2" />
    </div>
  );
}

function ShieldIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <path d="M12 3.5 L19 6.5 V11 C19 15.5 16 18.7 12 20.5 C8 18.7 5 15.5 5 11 V6.5 Z" strokeLinejoin="round" />
      <path d="M9 11.3 L11.2 13.5 L15.3 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SaveIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <path d="M5 4.5 H16 L19 7.5 V19.5 H5 Z" strokeLinejoin="round" />
      <path d="M8 4.5 V9.5 H15 V4.5 M8 19.5 V14 H16 V19.5" strokeLinejoin="round" />
    </svg>
  );
}

function SlidersIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <path d="M4 6 H20 M4 12 H20 M4 18 H20" strokeLinecap="round" />
      <circle cx="9" cy="6" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="10" cy="18" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DollarIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7 V17 M14.5 9.3 C14.5 8 13.4 7.3 12 7.3 C10.5 7.3 9.3 8 9.3 9.2 C9.3 10.3 10.2 10.8 12 11.2 C13.8 11.6 14.7 12.2 14.7 13.4 C14.7 14.6 13.6 15.3 12 15.3 C10.6 15.3 9.5 14.6 9.5 13.3" strokeLinecap="round" />
    </svg>
  );
}

function ExchangeIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <path d="M4 8 H17 M13.5 4.5 L17 8 L13.5 11.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16 H7 M10.5 12.5 L7 16 L10.5 19.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldSmallIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <path d="M12 3.5 L19 6.5 V11 C19 15.5 16 18.7 12 20.5 C8 18.7 5 15.5 5 11 V6.5 Z" strokeLinejoin="round" />
      <path d="M12 8.5 V12.5 M12 15.2 V15.3" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <path d="M4 20 V4 M4 20 H20" strokeLinecap="round" />
      <path d="M7 16 L11 11 L14 13.5 L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <path d="M6 10.5 A6 6 0 0 1 18 10.5 C18 15 19.5 16 19.5 16 H4.5 C4.5 16 6 15 6 10.5 Z" strokeLinejoin="round" />
      <path d="M10 19 A2 2 0 0 0 14 19" strokeLinecap="round" />
    </svg>
  );
}

function ChevronUpIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M5 15 L12 8 L19 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M9 5 L15 12 L9 19" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" className={props.className}>
      <path d="M12 5 V19 M5 12 H19" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <path d="M5 7 H19 M9 7 V4.5 H15 V7 M7 7 L8 20 H16 L17 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TelegramIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={props.className}>
      <path d="M4 12.5 L19.5 5 L16.5 19 L11 15.3 L8.5 17.5 V13.8 L16 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DiscordIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={props.className}>
      <rect x="4" y="6.5" width="16" height="11" rx="4" />
      <circle cx="9.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MailIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={props.className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4.5 7 L12 13 L19.5 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
