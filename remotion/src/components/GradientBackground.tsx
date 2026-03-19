import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../styles/colors";

export const GradientBackground: React.FC<{
  variant?: "default" | "warm" | "subtle";
}> = ({ variant = "default" }) => {
  const frame = useCurrentFrame();

  const glowX = interpolate(frame % 300, [0, 150, 300], [30, 70, 30]);
  const glowY = interpolate(frame % 400, [0, 200, 400], [20, 80, 20]);

  const glowColor =
    variant === "warm"
      ? colors.orange
      : variant === "subtle"
        ? colors.purple
        : colors.purpleLight;

  const secondaryColor = variant === "warm" ? colors.magenta : colors.cyan;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <div
        style={{
          position: "absolute",
          width: "60%",
          height: "60%",
          left: `${glowX}%`,
          top: `${glowY}%`,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(ellipse, ${glowColor}40 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "40%",
          height: "40%",
          right: `${100 - glowX}%`,
          bottom: `${100 - glowY}%`,
          transform: "translate(50%, 50%)",
          background: `radial-gradient(ellipse, ${secondaryColor}30 0%, transparent 70%)`,
          filter: "blur(50px)",
        }}
      />
    </AbsoluteFill>
  );
};
