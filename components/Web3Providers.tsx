"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { connectorsForWallets, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import "@rainbow-me/rainbowkit/styles.css";
import { createConfig, http, WagmiProvider } from "wagmi";
import { arcTestnet } from "@/lib/arc/chain";

/**
 * Chỉ dùng ví "injected" (MetaMask, Coinbase Wallet extension, Rabby...) qua
 * RainbowKit — không cấu hình WalletConnect (cần Project ID riêng của user
 * tại cloud.reown.com, chưa có), nên chưa hỗ trợ quét QR ví mobile.
 *
 * Phải dùng connectorsForWallets() + injectedWallet (thay vì gọi thẳng
 * wagmi injected()) thì RainbowKit mới hiện đúng ví trong modal "Connect a
 * Wallet" — connector trần không qua wallet list riêng của RainbowKit sẽ bị
 * modal bỏ qua, hiện màn hình "chưa có ví nào" trống trơn.
 */
const connectors = connectorsForWallets(
  [{ groupName: "Trình duyệt", wallets: [injectedWallet] }],
  { appName: "AgentPay", projectId: "agentpay-injected-only" }
);

const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors,
  transports: { [arcTestnet.id]: http() },
  ssr: true,
});

const queryClient = new QueryClient();

export function Web3Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#4C8B67", borderRadius: "medium" })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
