export const colors = {
  bg: "#13131f",
  bgLight: "#1a1a2e",
  bgCard: "rgba(255, 255, 255, 0.08)",

  purple: "#9333ea",
  purpleLight: "#a855f7",
  cyan: "#06b6d4",
  magenta: "#ec4899",
  orange: "#f97316",
  blue: "#3b82f6",
  green: "#22c55e",

  white: "#ffffff",
  textPrimary: "#f8fafc",
  textSecondary: "rgba(248, 250, 252, 0.85)",
  textMuted: "rgba(248, 250, 252, 0.55)",

  border: "rgba(168, 85, 247, 0.2)",
  borderLight: "rgba(255, 255, 255, 0.1)",
} as const;

export const gradients = {
  purpleCyan: "linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)",
  purpleMagenta: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
  rainbow: "linear-gradient(135deg, #a855f7 0%, #06b6d4 50%, #ec4899 100%)",
  warmGlow: "linear-gradient(135deg, #a855f7 0%, #f97316 100%)",
  darkRadial: "radial-gradient(ellipse at center, rgba(147, 51, 234, 0.25) 0%, transparent 70%)",
} as const;
