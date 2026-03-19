import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts } from "../styles/fonts";
import { gradients } from "../styles/colors";

interface LogoRevealProps {
  delay?: number;
}

export const LogoReveal: React.FC<LogoRevealProps> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const scaleSpring = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 15, stiffness: 80, mass: 1.2 },
  });

  const opacity = interpolate(adjustedFrame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const glowIntensity = interpolate(
    adjustedFrame,
    [20, 40, 60],
    [0, 1, 0.6],
    { extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        opacity,
        transform: `scale(${scaleSpring})`,
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: 900,
          fontFamily: fonts.display,
          background: gradients.rainbow,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: -2,
          filter: `drop-shadow(0 0 ${30 * glowIntensity}px rgba(147, 51, 234, 0.5))`,
        }}
      >
        ArtFlowly
      </div>
    </div>
  );
};
