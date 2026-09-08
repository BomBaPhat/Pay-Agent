/** Icon + màu theo tên agent — dùng chung giữa danh sách Active Agents và header Terminal, để cùng 1 agent luôn hiện cùng 1 icon/màu. Không có field "category" riêng trong DB nên suy ra từ tên. */
export function agentVisual(name: string): { Icon: (p: { className?: string }) => JSX.Element; classes: string } {
  const n = name.toLowerCase();
  if (n.includes("trading") || n.includes("trade")) {
    return { Icon: ChartAgentIcon, classes: "bg-indigo-500/15 text-indigo-500" };
  }
  if (n.includes("social") || n.includes("post") || n.includes("chat")) {
    return { Icon: ChatAgentIcon, classes: "bg-violet-500/15 text-violet-500" };
  }
  if (n.includes("weather")) {
    return { Icon: CloudAgentIcon, classes: "bg-sky-500/15 text-sky-500" };
  }
  return { Icon: BotAgentIcon, classes: "bg-confirmed/15 text-confirmed" };
}

export function CloudAgentIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <path d="M7 17.5 A4 4 0 1 1 8 9.6 A5 5 0 0 1 18 11.5 A3.5 3.5 0 0 1 17.5 17.5 Z" strokeLinejoin="round" />
    </svg>
  );
}

export function ChartAgentIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={props.className}>
      <path d="M4 19 L9 12 L13 15.5 L20 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 6 H20 V11.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatAgentIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <path d="M4 5.5 H20 V15.5 H10 L6 19 V15.5 H4 Z" strokeLinejoin="round" />
      <circle cx="8.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BotAgentIcon(props: { className?: string }) {
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

/** Icon + màu theo tên dịch vụ (catalog thanh toán) — dùng cho Suggested Prompts và Chat History, không có field category riêng trong DB nên suy ra từ tên. */
export function serviceVisual(name: string): { Icon: (p: { className?: string }) => JSX.Element; classes: string } {
  const n = name.toLowerCase();
  if (n.includes("weather")) return { Icon: CloudAgentIcon, classes: "bg-sky-500/15 text-sky-500" };
  if (n.includes("swap") || n.includes("uniswap") || n.includes("dex")) {
    return { Icon: SwapServiceIcon, classes: "bg-orange-500/15 text-orange-500" };
  }
  if (n.includes("api") || n.includes("gpt") || n.includes("openai") || n.includes("ai")) {
    return { Icon: ChipServiceIcon, classes: "bg-violet-500/15 text-violet-500" };
  }
  return { Icon: BoltServiceIcon, classes: "bg-confirmed/15 text-confirmed" };
}

export function SwapServiceIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={props.className}>
      <path d="M4 8 H17 M13.5 4.5 L17 8 L13.5 11.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16 H7 M10.5 12.5 L7 16 L10.5 19.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChipServiceIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M9.5 7 V4.3 M14.5 7 V4.3 M9.5 20 V17 M14.5 20 V17 M7 9.5 H4.3 M7 14.5 H4.3 M20 9.5 H17 M20 14.5 H17" strokeLinecap="round" />
    </svg>
  );
}

export function BoltServiceIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className}>
      <path d="M13 2 L4.5 13.5 H11 L10.2 22 L19.5 9.5 H13 Z" />
    </svg>
  );
}
