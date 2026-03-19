import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../styles/colors";
import { fonts } from "../styles/fonts";
import { gradients } from "../styles/colors";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  label: string;
  delay?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = "",
  label,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 40, stiffness: 80, mass: 1 },
  });

  const displayValue = Math.round(value * progress);

  const opacity = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 30, stiffness: 120 },
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        opacity,
      }}
    >
      <div
        style={{
          fontSize: 100,
          fontWeight: 800,
          fontFamily: fonts.display,
          background: gradients.purpleCyan,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
        }}
      >
        {displayValue.toLocaleString()}
        {suffix}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 500,
          fontFamily: fonts.display,
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
};
