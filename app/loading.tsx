import { LogoMark } from "@/components/LogoMark";

export default function Loading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-app-bg">
      <div className="loading-logo-track" aria-hidden="true">
        <LogoMark />
      </div>
      <span className="text-xs uppercase tracking-[0.16em] text-app-muted">Loading</span>
    </div>
  );
}
