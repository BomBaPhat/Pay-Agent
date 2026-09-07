export type Theme = "light" | "dark";

const STORAGE_KEY = "agentpay-theme";

export function getTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Chặn cookie/localStorage (chế độ riêng tư...) — không sao, chỉ mất nhớ theme giữa các lần tải trang.
  }
}
