import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

const linkFocus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-confirmed";

const ARCHITECTURE_LAYERS = [
  { name: "User layer", text: "Google login or an EVM wallet — the two entry points into AgentPay." },
  {
    name: "Auth / identity layer",
    text: "Web2 via Supabase Auth (Google OAuth). Web3 via EIP-1193 wallet connect (wagmi/viem, RainbowKit for the picker).",
  },
  {
    name: "Smart account layer",
    text: "Google users get a Circle Developer-Controlled Wallet auto-created on first login. EVM users connect their existing wallet directly.",
  },
  {
    name: "AI orchestration layer",
    text: "The chat message goes to DeepSeek (tool-calling). It resolves intent against the service catalog and produces a payment intent — not yet executed.",
  },
  {
    name: "Policy engine",
    text: "Checks the intent against daily limit, per-transaction limit, allowed token/network, allowed recipients, and the approval threshold — then auto-approves or holds for your review.",
  },
  {
    name: "Payment execution layer",
    text: "Circle Agent Wallet API for direct transfers, or x402 nanopayments via Circle Gateway for sub-cent service calls — both settle in USDC on Arc.",
  },
  {
    name: "Data layer",
    text: "Supabase/Postgres: users, wallets, spending_policies, agents, payment_intents, transactions, services, audit_log.",
  },
];

const TECH_STACK = [
  { layer: "Frontend", choice: "Next.js 14 (App Router), TypeScript, Tailwind CSS" },
  { layer: "Web2 auth", choice: "Supabase Auth (Google provider)" },
  { layer: "Web3 wallet", choice: "wagmi + viem, RainbowKit (injected connectors)" },
  { layer: "Smart account", choice: "Circle Developer-Controlled Wallets" },
  { layer: "Blockchain", choice: "Arc (testnet) — USDC as native gas" },
  { layer: "Agent-to-service payments", choice: "x402 nanopayments via Circle Gateway" },
  { layer: "Backend", choice: "Next.js Route Handlers (Node.js runtime)" },
  { layer: "Database", choice: "Supabase / PostgreSQL" },
  { layer: "AI model", choice: "DeepSeek — chat completions, tool-calling, OpenAI-compatible" },
];

const DB_TABLES = [
  { name: "users", text: "Maps to Supabase auth.users, stores login_method (google | evm)." },
  { name: "wallets", text: "Smart account / address on Arc, type (circle_smart_account | external_evm)." },
  { name: "spending_policies", text: "Daily limit, per-tx limit, allowed token/network, approval threshold, allowed recipients." },
  { name: "agents", text: "One AI agent per user (MVP scope), linked to a wallet and a policy." },
  { name: "payment_intents", text: "Follows the state machine below — the record of record for every payment attempt." },
  { name: "transactions", text: "Confirmed on-chain transactions, linked back to a payment_intent." },
  { name: "services", text: "Catalog of things the agent can pay for (demo APIs/data feeds for now)." },
  { name: "audit_log", text: "Every policy-engine decision (approve / deny / hold) with a reason." },
];

const MVP_SHIPPED = [
  "Google login with automatic smart-account creation",
  "EVM wallet connect (RainbowKit)",
  "USDC balance on Arc testnet",
  "Spending policy configuration",
  "Chat with the AI agent",
  "Agent-created payment intents",
  "Policy engine — auto-approve or hold for review",
  "Payment approval screen",
  "USDC execution on Arc",
  "Transaction history",
  "Audit log for every policy decision",
  "Demo service catalog (a few paid endpoints)",
];

const MVP_LATER = [
  "Multi-agent marketplace",
  "Subscriptions",
  "Token swap / bridging",
  "Complex DeFi strategies",
  "Autonomous contract execution",
  "Agent-to-agent payments",
];

export default function DocsPage() {
  return (
    <div className={`${plexSans.className} tech-grid min-h-screen bg-ink text-paper`}>
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4 md:px-10">
          <Link href="/" className={`flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink ${linkFocus}`}>
            <LogoMark />
            AgentPay
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium text-ink">
            <Link
              href="/api-docs"
              className={`rounded-full border border-ink/15 px-4 py-1.5 transition hover:border-[#4f8b68] hover:bg-[#4f8b68] hover:text-paper ${linkFocus}`}
            >
              API Reference
            </Link>
            <Link
              href="/login"
              className={`rounded-full bg-ink px-4 py-1.5 text-paper transition hover:bg-[#4f8b68] ${linkFocus}`}
            >
              Launch app
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 md:px-10">
        <h1 className="text-3xl font-semibold text-paper sm:text-4xl">AgentPay docs</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-paper/60">
          AgentPay is an AI payment orchestration layer on Arc. Log in with Google (an auto-created Circle smart
          account) or an EVM wallet, set a spending policy, then chat with an AI agent that proposes USDC payments —
          checked against your policy and auto-approved, held for review, or denied before anything executes
          on-chain. The agent is never given a raw private key.
        </p>

        {/* Architecture */}
        <section className="mt-14">
          <h2 className="text-xs uppercase tracking-[0.16em] text-paper/50">Architecture</h2>
          <ol className="relative ml-3 mt-6 space-y-8 border-l border-ink-line pl-8">
            {ARCHITECTURE_LAYERS.map((layer, i) => (
              <li key={layer.name} className="relative">
                <span className="absolute -left-[2.35rem] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-ink-line bg-ink-panel">
                  <span className={`${plexMono.className} text-[9px] text-confirmed`}>{i + 1}</span>
                </span>
                <p className={`${plexMono.className} text-sm text-paper/90`}>{layer.name}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-paper/60">{layer.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Tech stack */}
        <section className="mt-14">
          <h2 className="text-xs uppercase tracking-[0.16em] text-paper/50">Tech stack</h2>
          <div className="mt-6 divide-y divide-ink-line rounded-2xl border border-ink-line">
            {TECH_STACK.map((row) => (
              <div key={row.layer} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
                <span className={`${plexMono.className} w-40 shrink-0 text-xs text-paper/50`}>{row.layer}</span>
                <span className="text-sm text-paper/90">{row.choice}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Database */}
        <section className="mt-14">
          <h2 className="text-xs uppercase tracking-[0.16em] text-paper/50">Database</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-paper/60">
            Supabase / Postgres, 8 tables. Row-level security scopes every table to its owning user.
          </p>
          <div className="mt-6 divide-y divide-ink-line rounded-2xl border border-ink-line">
            {DB_TABLES.map((t) => (
              <div key={t.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
                <span className={`${plexMono.className} w-40 shrink-0 text-xs text-confirmed`}>{t.name}</span>
                <span className="text-sm text-paper/70">{t.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* x402 */}
        <section className="mt-14">
          <h2 className="text-xs uppercase tracking-[0.16em] text-paper/50">x402 nanopayments</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-paper/60">
            Beyond direct transfers to a service&rsquo;s recipient address, the agent can pay for a resource through
            the x402 protocol via Circle Gateway — sub-cent, gasless, many off-chain-signed authorizations batched
            into one on-chain settlement. It still goes through the same policy engine as a direct payment; there is
            no path that skips the daily limit, per-transaction limit, or approval threshold.
          </p>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-paper/60">
            The agent still never holds a raw private key. It signs Gateway authorizations through Circle&rsquo;s own{" "}
            <span className={`${plexMono.className} text-paper/80`}>signTypedData</span>, using a separate EOA that
            Circle custodies purely for Gateway signing — kept apart from the smart account that actually holds the
            policy-controlled balance.
          </p>
        </section>

        {/* MVP scope */}
        <section className="mt-14">
          <h2 className="text-xs uppercase tracking-[0.16em] text-paper/50">Scope</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-confirmed">Shipped</p>
              <ul className="mt-3 space-y-2 text-sm text-paper/70">
                {MVP_SHIPPED.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-confirmed" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-paper/50">Not in this build</p>
              <ul className="mt-3 space-y-2 text-sm text-paper/50">
                {MVP_LATER.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-paper/30" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Known limitations */}
        <section className="mt-14">
          <h2 className="text-xs uppercase tracking-[0.16em] text-paper/50">Known limitations</h2>
          <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-paper/60">
            <li>
              The agent auto-sends only from a <span className={`${plexMono.className} text-paper/80`}>circle_smart_account</span>{" "}
              wallet (Google login). An EVM wallet you connect yourself can log in and hold a policy, but signing a
              payment still needs you — it&rsquo;s not automated in this build.
            </li>
            <li>The service catalog is a small demo set today, not a marketplace of real paid integrations.</li>
          </ul>
        </section>

        <div className="mt-16 flex flex-wrap items-center gap-4 border-t border-ink-line pt-10">
          <Link
            href="/api-docs"
            className={`rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition hover:bg-[#4f8b68] hover:text-paper ${linkFocus}`}
          >
            Full API reference
          </Link>
          <Link
            href="/login"
            className={`rounded-full border border-ink-line px-6 py-3 text-sm text-paper/80 transition hover:border-[#4f8b68] hover:bg-[#4f8b68] hover:text-paper ${linkFocus}`}
          >
            Launch app
          </Link>
        </div>
      </main>
    </div>
  );
}
