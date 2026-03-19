import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../styles/colors";

interface GlassCardProps {
  children: React.ReactNode;
  delay?: number;
  width?: number | string;
  style?: React.CSSProperties;
  glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  delay = 0,
  width = "auto",
  style,
  glowColor = colors.purple,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const springValue = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 25, stiffness: 100, mass: 0.8 },
  });

  const opacity = interpolate(springValue, [0, 1], [0, 1]);
  const scale = interpolate(springValue, [0, 1], [0.95, 1]);
  const y = interpolate(springValue, [0, 1], [20, 0]);

  return (
    <div
      style={{
        width,
        padding: 40,
        borderRadius: 24,
        background: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(20px) saturate(1.3)",
        border: `1px solid ${colors.border}`,
        boxShadow: `0 0 40px ${glowColor}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
        opacity,
        transform: `scale(${scale}) translateY(${y}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
