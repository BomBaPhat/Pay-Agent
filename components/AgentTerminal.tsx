"use client";

import Link from "next/link";
import { useRef, useState } from "react";
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

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-app-border bg-app-panel">
      <div className="flex items-center justify-between border-b border-app-border px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.05em]">
          <span className="h-1.5 w-1.5 rounded-full bg-confirmed" />
          {agentName} Terminal
        </p>
        <div className="flex items-center gap-3 text-xs">
          <button type="button" onClick={() => setLog([])} className="text-confirmed hover:underline">
            Clear
          </button>
          <Link href="/policy" className="text-confirmed hover:underline">
            Settings
          </Link>
        </div>
      </div>

      {suggested.length > 0 && (
        <div className="border-b border-app-border px-4 py-3">
          <p className="text-xs uppercase tracking-[0.08em] text-app-muted-2">Suggested Prompts</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {suggested.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(`Pay $${s.priceUsdc.toFixed(2)} ${s.name} for today's data`)}
                className="rounded-lg border border-app-border px-3 py-2 text-left text-xs transition hover:border-confirmed/50 hover:bg-confirmed/5 disabled:opacity-50"
              >
                <span className="block font-medium text-app-text">
                  Pay ${s.priceUsdc.toFixed(2)} {s.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="min-h-[16rem] flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs uppercase tracking-[0.08em] text-app-muted-2">Execution Logs</p>
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
              <p key={line.id} className={TONE_CLASS[line.tone]}>
                <span className="text-app-muted-2">[{line.time}]</span> {line.text}
              </p>
            );
          })}
          <div ref={logEndRef} />
        </div>
      </div>

      <div className="border-t border-app-border p-3">
        <p className="mb-1.5 text-xs uppercase tracking-[0.08em] text-app-muted-2">Input Command</p>
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
            className="flex items-center gap-1.5 rounded-lg bg-confirmed px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
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
