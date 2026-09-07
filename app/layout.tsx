import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "AgentPay",
  description: "Give your agent a budget, not the keys. AI agent payments on Arc, capped by policy.",
  openGraph: {
    title: "AgentPay",
    description: "Give your agent a budget, not the keys. AI agent payments on Arc, capped by policy.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentPay",
    description: "Give your agent a budget, not the keys. AI agent payments on Arc, capped by policy.",
  },
};

// Đặt data-theme trên <html> TRƯỚC khi React hydrate, để tránh nháy sai theme
// (đọc localStorage — không đọc được ở server nên phải chạy inline, sớm nhất
// có thể). Chỉ ảnh hưởng khu vực "app" (xem app/globals.css); trang chủ
// marketing dùng ink/paper cố định, không đọc theme này.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("agentpay-theme");
    var theme = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
