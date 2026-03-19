import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

interface SectionTransitionProps {
  type?: "fadeIn" | "fadeOut" | "crossFade";
  duration?: number;
}

export const SectionTransition: React.FC<SectionTransitionProps> = ({
  type = "fadeIn",
  duration = 30,
}) => {
  const frame = useCurrentFrame();

  let opacity = 1;
  if (type === "fadeIn") {
    opacity = interpolate(frame, [0, duration], [0, 1], {
      extrapolateRight: "clamp",
    });
  } else if (type === "fadeOut") {
    opacity = interpolate(frame, [0, duration], [1, 0], {
      extrapolateRight: "clamp",
    });
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0f",
        opacity: 1 - opacity,
        zIndex: 100,
      }}
    />
  );
};
