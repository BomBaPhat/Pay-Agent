"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { agentVisual, serviceVisual } from "@/lib/agent/visual";
import type { Service } from "@/types";

interface AgentTerminalProps {
  agentName: string;
  services: Service[];
}

type LogTone = "info" | "ok" | "warn" | "error" | "muted";

interface LogLine {
  id: string;
  time: string;
  tone: LogTone;
  text: string;
}

const TONE_CLASS: Record<LogTone, string> = {
  info: "text-app-muted",
  ok: "text-confirmed",
  warn: "text-pending",
  error: "text-denied",
  muted: "text-app-muted-2",
};

function nowLabel() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Icon nhỏ trước mỗi dòng log — suy ra từ nội dung bước (parse/policy/exec/done) và tone, để giống terminal có step-by-step thật thay vì text thuần. */
function LineIcon({ line }: { line: LogLine }) {
  const cls = `h-3 w-3 shrink-0 ${TONE_CLASS[line.tone]}`;
  if (line.text.startsWith("> User:")) return <UserLineIcon className={cls} />;
  if (line.text.includes("Executed!") || line.text.includes("Approved but")) {
    return <DoneLineIcon className="h-3.5 w-3.5 shrink-0 text-confirmed" />;
  }
  if (line.text.includes("Checking Policy")) return <CheckLineIcon className={cls} />;
  if (line.text.includes("Executing Tx")) return <GearLineIcon className={cls} />;
  if (line.text.includes("Held —")) return <ClockLineIcon className={cls} />;
  if (line.tone === "error") return <XLineIcon className={cls} />;
  return <InfoLineIcon className={cls} />;
}

function UserLineIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20 C5.5 15.8 8.3 13.5 12 13.5 C15.7 13.5 18.5 15.8 18.5 20" strokeLinecap="round" />
    </svg>
  );
}

function InfoLineIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11 V16.5" strokeLinecap="round" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckLineIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={props.className}>
      <path d="M4.5 12.5 L9.5 17.5 L19.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Badge check đặc (khác CheckLineIcon viền mảnh) — dành riêng cho bước cuối "Executed!", nổi bật hơn để đánh dấu hoàn tất. */
function DoneLineIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={props.className}>
      <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
      <path
        d="M7.5 12.5 L10.5 15.5 L16.5 8.5"
        fill="none"
        stroke="white"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GearLineIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5 V6 M12 18 V20.5 M20.5 12 H18 M6 12 H3.5 M17.7 6.3 L16 8 M8 16 L6.3 17.7 M17.7 17.7 L16 16 M8 8 L6.3 6.3" strokeLinecap="round" />
    </svg>
  );
}

function ClockLineIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5 V12 L15 14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XLineIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={props.className}>
      <path d="M6 6 L18 18 M18 6 L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function AgentTerminal({ agentName, services }: AgentTerminalProps) {
  const [log, setLog] = useState<LogLine[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const logEndRef = useRef<HTMLDivElement>(null);

  function appendLines(lines: Omit<LogLine, "id">[]) {
    setLog((prev) => [...prev, ...lines.map((l) => ({ ...l, id: newId() }))]);
    requestAnimationFrame(() => logEndRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    appendLines([{ time: nowLabel(), tone: "muted", text: `> User: ${text}` }]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: [] }),
      });
      const data = await res.json();

      if (!res.ok) {
        appendLines([{ time: nowLabel(), tone: "error", text: `[!] ${data.error ?? "Có lỗi xảy ra."}` }]);
        return;
      }

      const intent = data.intent as { serviceId?: string; amountUsdc?: number; reason?: string } | null;
      const decision = data.decision?.decision as string | undefined;
      const decisionReason = data.decision?.reason as string | undefined;

      if (!intent) {
        appendLines([
          { time: nowLabel(), tone: "info", text: "[1/1] No payment action — reply only" },
          { time: nowLabel(), tone: "muted", text: `< Agent: ${data.reply}` },
        ]);
        return;
      }

      const amount = (intent.amountUsdc ?? 0).toFixed(2);
      appendLines([{ time: nowLabel(), tone: "info", text: `[1/4] Parsing Intent... -> Action: ${intent.reason ?? "pay_service"}` }]);

      if (decision === "deny") {
        appendLines([
          { time: nowLabel(), tone: "error", text: `[2/4] Checking Policy... -> $${amount} (REJECTED)` },
          { time: nowLabel(), tone: "error", text: `[!] ${decisionReason ?? "Vượt hạn mức."}` },
        ]);
      } else if (decision === "require_approval" || decision === "pending_user_approval") {
        appendLines([
          { time: nowLabel(), tone: "warn", text: `[2/4] Checking Policy... -> $${amount} (PENDING USER)` },
          {
            time: nowLabel(),
            tone: "warn",
            text: `[3/4] Held — waiting for your approval (payment_intent ${String(data.paymentIntentId).slice(0, 8)}...)`,
          },
        ]);
        setResolvedIds((prev) => {
          const next = new Set(prev);
          next.delete(data.paymentIntentId);
          return next;
        });
        appendLines([{ time: nowLabel(), tone: "muted", text: `__approve__:${data.paymentIntentId}` }]);
      } else {
        appendLines([{ time: nowLabel(), tone: "ok", text: `[2/4] Checking Policy... -> $${amount} <= limit (PASSED)` }]);
        appendLines([{ time: nowLabel(), tone: "info", text: "[3/4] Executing Tx via Arc Protocol..." }]);
        if (data.txHash) {
          appendLines([{ time: nowLabel(), tone: "ok", text: `[4/4] Executed! Tx Hash: ${data.txHash}` }]);
        } else if (data.executionError) {
          appendLines([{ time: nowLabel(), tone: "error", text: `[4/4] Failed: ${data.executionError}` }]);
        }
      }
    } finally {
      setSending(false);
    }
  }

  async function respondToPayment(paymentIntentId: string, action: "approve" | "reject") {
    const res = await fetch(`/api/payments/${paymentIntentId}/${action}`, { method: "POST" });
    const data = await res.json();
    setResolvedIds((prev) => new Set(prev).add(paymentIntentId));

    appendLines([
      {
        time: nowLabel(),
        tone: action === "approve" ? "ok" : "error",
        text:
          action === "approve"
            ? data.ok
              ? `[4/4] Executed! Tx Hash: ${data.txHash}`
              : `[4/4] Approved but execution failed: ${data.error}`
            : "[4/4] Rejected by user.",
      },
    ]);
  }

  const suggested = services.slice(0, 3);
  const { Icon: AgentIcon, classes: agentIconClasses } = agentVisual(agentName);

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-app-border bg-app-panel">
      <div className="flex items-center justify-between border-b border-app-border px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.05em]">
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${agentIconClasses}`}>
            <AgentIcon className="h-3 w-3" />
          </span>
          {agentName} Terminal
        </p>
        <div className="flex items-center gap-3 text-xs">
          <button type="button" onClick={() => setLog([])} className="text-confirmed hover:underline">
            [Clear]
          </button>
          <Link href="/policy" className="text-confirmed hover:underline">
            [Settings]
          </Link>
        </div>
      </div>

      {suggested.length > 0 && (
        <div className="border-b border-app-border px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-app-muted">Suggested Prompts:</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {suggested.map((s) => {
              const { Icon, classes } = serviceVisual(s.name);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={sending}
                  onClick={() => sendMessage(`Pay $${s.priceUsdc.toFixed(2)} ${s.name} for today's data`)}
                  className="flex items-start gap-2.5 rounded-lg border border-app-border px-3 py-2.5 text-left text-xs transition hover:border-confirmed/50 hover:bg-confirmed/5 disabled:opacity-50"
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${classes}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-medium leading-snug text-app-text">
                    Pay ${s.priceUsdc.toFixed(2)} {s.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="min-h-[16rem] flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-app-muted">Execution Logs:</p>
        <div className="mt-2 space-y-1 font-mono text-[12.5px] leading-relaxed">
          {log.length === 0 && <p className="text-app-muted-2">Chưa có hoạt động — thử một suggested prompt bên trên.</p>}
          {log.map((line) => {
            if (line.text.startsWith("__approve__:")) {
              const paymentIntentId = line.text.split(":")[1];
              if (resolvedIds.has(paymentIntentId)) return null;
              return (
                <div key={line.id} className="flex gap-2 pl-4">
                  <button
                    className="rounded bg-confirmed px-2 py-0.5 text-[11px] text-white transition hover:opacity-90"
                    onClick={() => respondToPayment(paymentIntentId, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded border border-app-border px-2 py-0.5 text-[11px] transition hover:bg-app-bg"
                    onClick={() => respondToPayment(paymentIntentId, "reject")}
                  >
                    Reject
                  </button>
                </div>
              );
            }
            return (
              <p key={line.id} className={`flex items-start gap-1.5 ${TONE_CLASS[line.tone]}`}>
                <span className="text-app-muted-2">[{line.time}]</span>
                <LineIcon line={line} />
                <span className="min-w-0 break-words">{line.text}</span>
              </p>
            );
          })}
          <div ref={logEndRef} />
        </div>
      </div>

      <div className="border-t border-app-border p-3">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.08em] text-app-muted">Input Command:</p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            placeholder="Pay the weather API $0.50 for today's data"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={sending}
          />
          <button
            onClick={() => sendMessage()}
            disabled={sending}
            className="flex items-center gap-1.5 rounded-lg bg-app-text px-4 py-2 text-sm font-medium text-app-bg transition hover:opacity-90 disabled:opacity-50"
          >
            <SendIcon className="h-3.5 w-3.5" />
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SendIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className}>
      <path d="M3 11 L21 3 L13 21 L11 13 Z" />
    </svg>
  );
}
