import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../styles/colors";
import { fonts } from "../styles/fonts";

interface ComparisonBarProps {
  label: string;
  savingsPercent: number;
  delay?: number;
}

export const ComparisonBar: React.FC<ComparisonBarProps> = ({
  label,
  savingsPercent,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 30, stiffness: 60, mass: 1 },
  });

  const barWidth = savingsPercent * progress;

  const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ opacity, marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            fontFamily: fonts.display,
            color: colors.textPrimary,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            fontFamily: fonts.display,
            background: "linear-gradient(135deg, #a855f7, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {Math.round(barWidth)}% savings
        </div>
      </div>

      <div
        style={{
          width: "100%",
          height: 40,
          borderRadius: 12,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: "100%",
            borderRadius: 12,
            background: "linear-gradient(90deg, #9333ea, #06b6d4)",
            boxShadow: "0 0 20px rgba(147, 51, 234, 0.3)",
          }}
        />
      </div>
    </div>
  );
};
