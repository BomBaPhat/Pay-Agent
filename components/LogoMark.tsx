/**
 * Logo AgentPay: huy hiệu tròn màu confirmed (tách khỏi nền, luôn nổi bật dù
 * header sáng hay nền tối) chứa mũi tên đẩy 1 đồng coin — agent tự gửi
 * thanh toán. Hover vào, mũi tên và coin trượt tới trước.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  const iconSize = Math.round(size * 0.5625);
  return (
    <span
      className="group flex shrink-0 items-center justify-center rounded-full bg-confirmed shadow-sm shadow-confirmed/30"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" className="overflow-visible text-paper" style={{ width: iconSize, height: iconSize }}>
        <path
          d="M7 6 L13 12 L7 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-300 ease-out group-hover:translate-x-0.5"
        />
        <circle
          cx="18"
          cy="12"
          r="2.4"
          fill="currentColor"
          className="transition-transform delay-75 duration-300 ease-out group-hover:translate-x-1.5"
        />
      </svg>
    </span>
  );
}
