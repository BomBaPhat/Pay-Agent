import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#081818",
          panel: "#161A20",
          line: "#262C34",
        },
        paper: "#EDE7D9",
        confirmed: "#4C8B67",
        pending: "#C08A3E",
        denied: "#A2493B",
        // Token theme sáng/tối cho khu vực app (xem app/globals.css) —
        // tách riêng khỏi ink/paper (cố định tối, dùng cho trang chủ).
        app: {
          bg: "var(--app-bg)",
          panel: "var(--app-panel)",
          border: "var(--app-border)",
          text: "var(--app-text)",
          muted: "var(--app-muted)",
          "muted-2": "var(--app-muted-2)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
