"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoMark } from "@/components/LogoMark";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview", shortLabel: "Home", icon: HomeIcon },
  { href: "/agent", label: "Agents", shortLabel: "Agents", icon: AgentIcon },
  { href: "/policy", label: "Policy Rules", shortLabel: "Policy", icon: ShieldIcon },
  { href: "/transactions", label: "Intents Ledger", shortLabel: "Ledger", icon: LedgerIcon },
];

const DOCS_LINK = "https://github.com/longbds0108/Pay-Agent/blob/main/docs/TECHNICAL_SPEC_v0.1.md";

/**
 * Điều hướng dùng chung cho các trang sau đăng nhập — sidebar dọc bên trái
 * trên desktop (md trở lên), thu gọn thành thanh ngang trên mobile (sidebar
 * dọc cố định 224px quá rộng trên màn hình nhỏ).
 */
export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Desktop: sidebar dọc */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink-line bg-ink-panel md:flex">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5 text-sm font-semibold text-paper">
          <LogoMark />
          AgentPay
          <span className="ml-auto rounded-full border border-ink-line px-2 py-0.5 font-mono text-[10px] font-normal text-paper/40">
            Arc
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-confirmed/15 text-confirmed" : "text-paper/55 hover:text-paper"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
          <a
            href={DOCS_LINK}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-paper/55 transition hover:text-paper"
          >
            <ApiIcon className="h-4 w-4 shrink-0" />
            API &amp; SDK
          </a>
        </nav>

        <div className="border-t border-ink-line p-3">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-denied/80 transition hover:bg-denied/10 hover:text-denied"
            title="Coming soon — chưa hoạt động"
          >
            <StopIcon className="h-4 w-4 shrink-0" />
            Emergency Stop
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-paper/40 transition hover:text-paper/70"
          >
            <SignOutIcon className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile: thanh ngang gọn */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-ink-line bg-ink-panel px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 text-sm font-semibold text-paper">
          <LogoMark />
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-between gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs transition ${
                  active ? "bg-confirmed/15 text-confirmed" : "text-paper/55"
                }`}
              >
                {link.shortLabel}
              </Link>
            );
          })}
        </nav>
        <button type="button" onClick={handleSignOut} className="shrink-0 text-xs text-paper/40">
          Sign out
        </button>
      </header>
    </>
  );
}

function HomeIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <path d="M4 11 L12 4 L20 11 V20 H4 Z" strokeLinejoin="round" />
      <path d="M9.5 20 V13.5 H14.5 V20" strokeLinejoin="round" />
    </svg>
  );
}

function AgentIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 8 V4.5" strokeLinecap="round" />
      <circle cx="12" cy="3" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
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

function LedgerIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M8 8.5 H16 M8 12.5 H16 M8 16.5 H12.5" strokeLinecap="round" />
    </svg>
  );
}

function ApiIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <path d="M9 7 L4.5 12 L9 17 M15 7 L19.5 12 L15 17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StopIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <circle cx="12" cy="12" r="8.5" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SignOutIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={props.className}>
      <path d="M9 4 H6 a2 2 0 0 0 -2 2 V18 a2 2 0 0 0 2 2 H9" strokeLinecap="round" />
      <path d="M16 16 L20 12 L16 8 M9 12 H20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
