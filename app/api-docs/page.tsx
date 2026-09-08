import { AppSidebar } from "@/components/AppSidebar";

interface EndpointDoc {
  method: "GET" | "POST";
  path: string;
  description: string;
  request?: string;
  response: string;
}

interface EndpointGroup {
  title: string;
  description: string;
  endpoints: EndpointDoc[];
}

const GROUPS: EndpointGroup[] = [
  {
    title: "Agent",
    description: "Gửi tin nhắn cho AI agent (DeepSeek) — agent hiểu intent thanh toán rồi tự chạy qua policy engine.",
    endpoints: [
      {
        method: "POST",
        path: "/api/agent",
        description: "Gửi 1 tin nhắn, nhận reply + kết quả policy decision (và tx hash nếu auto-approve chạy luôn).",
        request: `{
  "message": "Pay $0.50 Weather API for today's data",
  "history": []  // AgentChatMessage[], optional
}`,
        response: `{
  "reply": "Đã thanh toán Weather API.",
  "intent": { "serviceId": "uuid|null", "recipient": "0x...", "amountUsdc": 0.5, "reason": "pay_service" },
  "paymentIntentId": "uuid",
  "decision": { "decision": "auto_approve|require_approval|deny", "reason": "..." },
  "txHash": "0x... | null",
  "executionError": "string | null"
}`,
      },
    ],
  },
  {
    title: "Payments",
    description: "Đọc lịch sử payment intents, tạo payment thủ công (không qua chat), duyệt/từ chối các khoản đang pending_user_approval.",
    endpoints: [
      {
        method: "GET",
        path: "/api/payments",
        description: "Danh sách payment intents của agent hiện tại, mới nhất trước.",
        response: `{
  "payments": [
    {
      "id": "uuid",
      "recipient": "0x...",
      "amountUsdc": 0.5,
      "reason": "string | null",
      "status": "created|policy_check|approved|pending_user_approval|rejected|executing|confirmed|failed",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601",
      "txHash": "0x... | null",
      "confirmedAt": "ISO8601 | null"
    }
  ]
}`,
      },
      {
        method: "POST",
        path: "/api/payments",
        description: "Tạo payment intent thủ công (không qua AI) — vẫn chạy qua policy engine như bình thường.",
        request: `{
  "recipient": "0x...",
  "amountUsdc": 0.5,
  "reason": "string",
  "serviceId": "uuid | null"  // optional, null nếu gửi trực tiếp ngoài danh mục
}`,
        response: `{
  "ok": true,
  "paymentIntentId": "uuid",
  "decision": { "decision": "auto_approve|require_approval|deny", "reason": "..." },
  "txHash": "0x... | null",
  "executionError": "string | null"
}`,
      },
      {
        method: "POST",
        path: "/api/payments/{id}/approve",
        description: "Duyệt 1 payment đang pending_user_approval — thực thi tx ngay sau khi duyệt.",
        response: `{ "ok": true, "txHash": "0x..." }
// hoặc nếu thực thi thất bại:
{ "ok": false, "error": "string" }`,
      },
      {
        method: "POST",
        path: "/api/payments/{id}/reject",
        description: "Từ chối 1 payment đang pending_user_approval.",
        response: `{ "ok": true }`,
      },
    ],
  },
  {
    title: "Policy",
    description: "Đọc/ghi spending policy của agent — daily limit, per-tx limit, ngưỡng cần duyệt tay, whitelist địa chỉ.",
    endpoints: [
      {
        method: "GET",
        path: "/api/policy",
        description: "Policy hiện tại + tổng đã chi trong ngày hôm nay.",
        response: `{
  "policy": {
    "id": "uuid", "agentId": "uuid",
    "dailyLimitUsdc": 50, "perTxLimitUsdc": 5, "requireApprovalAboveUsdc": 5,
    "allowedToken": "USDC", "allowedNetwork": "arc",
    "allowedRecipients": "any" // hoặc string[] địa chỉ được phép
  },
  "spentTodayUsdc": 12.4
}`,
      },
      {
        method: "POST",
        path: "/api/policy",
        description: "Cập nhật policy — ghi đè toàn bộ 4 field bên dưới.",
        request: `{
  "dailyLimitUsdc": 50,
  "perTxLimitUsdc": 5,
  "requireApprovalAboveUsdc": 5,
  "allowedRecipients": "any" // hoặc ["0x...", "0x..."]
}`,
        response: `{ "ok": true, "policy": { ...cùng shape với request } }`,
      },
    ],
  },
  {
    title: "Onboarding",
    description: "Tạo users/wallet/agent/policy cho lần đăng nhập đầu bằng ví EVM (Google dùng /auth/callback riêng, redirect-based).",
    endpoints: [
      {
        method: "POST",
        path: "/api/onboarding",
        description: "Gọi ngay sau supabase.auth.signInWithWeb3() thành công.",
        request: `{ "address": "0x..." }`,
        response: `{
  "ok": true,
  "agentId": "uuid", "walletId": "uuid", "walletAddress": "0x...",
  "walletSetupError": "string | null"
}`,
      },
    ],
  },
  {
    title: "x402 Demo Resource",
    description: "Resource thật trả phí qua Circle Gateway (x402 nanopayment) trên Arc Testnet — không phải mock.",
    endpoints: [
      {
        method: "GET",
        path: "/api/x402/weather",
        description: "Chưa trả phí → HTTP 402 kèm payment requirements. Agent tự ký uỷ quyền qua Gateway rồi gọi lại mới nhận dữ liệu.",
        response: `// Chưa trả phí — HTTP 402:
{ "accepts": { "scheme": "exact", "payTo": "0x...", "price": "$0.001", "network": "..." } }

// Đã trả phí — HTTP 200:
{ "city": "Ho Chi Minh City", "temperatureC": 31, "condition": "..." }`,
      },
    ],
  },
];

export default function ApiDocsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text md:flex-row">
      <AppSidebar />
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="flex items-center gap-2 text-lg font-semibold uppercase tracking-[0.08em]">
            <ApiHeaderIcon className="h-5 w-5 text-confirmed" />
            API &amp; SDK
          </h1>

          <div className="mt-4 rounded-2xl border border-app-border bg-app-panel p-4 text-sm text-app-muted">
            <p>
              Đây là các REST endpoint mà chính giao diện AgentPay đang dùng — chưa phải API công khai có API key
              riêng. Mọi request cần <strong className="text-app-text">session cookie đăng nhập Supabase</strong>{" "}
              (gọi từ trình duyệt đã đăng nhập, hoặc server tự ký session tương ứng). Chưa có SDK/package npm riêng
              — dùng trực tiếp <code className="rounded bg-app-bg px-1 py-0.5 font-mono text-xs">fetch()</code> tới các
              endpoint bên dưới là đủ.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-app-bg px-3 py-2.5 font-mono text-xs text-app-muted">
{`fetch("/api/agent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // gửi kèm session cookie
  body: JSON.stringify({ message: "Pay $0.50 Weather API for today's data" }),
});`}
            </pre>
          </div>

          <div className="mt-4 space-y-4">
            {GROUPS.map((group) => (
              <div key={group.title} className="rounded-2xl border border-app-border bg-app-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-app-text">{group.title}</p>
                <p className="mt-1 text-xs text-app-muted">{group.description}</p>

                <div className="mt-3 divide-y divide-app-border">
                  {group.endpoints.map((ep) => (
                    <div key={`${ep.method}-${ep.path}`} className="py-3 first:pt-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                            ep.method === "GET" ? "bg-sky-500/15 text-sky-500" : "bg-confirmed/15 text-confirmed"
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="font-mono text-sm text-app-text">{ep.path}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-app-muted">{ep.description}</p>

                      {ep.request && (
                        <div className="mt-2">
                          <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-app-muted-2">Request</p>
                          <pre className="mt-1 overflow-x-auto rounded-lg bg-app-bg px-3 py-2 font-mono text-xs text-app-muted">
                            {ep.request}
                          </pre>
                        </div>
                      )}
                      <div className="mt-2">
                        <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-app-muted-2">Response</p>
                        <pre className="mt-1 overflow-x-auto rounded-lg bg-app-bg px-3 py-2 font-mono text-xs text-app-muted">
                          {ep.response}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ApiHeaderIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <path d="M9 7 L4.5 12 L9 17 M15 7 L19.5 12 L15 17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
