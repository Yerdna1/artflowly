import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../styles/colors";

interface MockupFrameProps {
  children: React.ReactNode;
  delay?: number;
  title?: string;
}

export const MockupFrame: React.FC<MockupFrameProps> = ({
  children,
  delay = 0,
  title = "ArtFlowly",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const scale = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 20, stiffness: 80, mass: 1 },
  });

  const opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${interpolate(scale, [0, 1], [0.9, 1])})`,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
        boxShadow: `0 25px 50px rgba(0,0,0,0.5), 0 0 40px ${colors.purple}10`,
        background: colors.bgLight,
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          height: 40,
          background: "rgba(255,255,255,0.03)",
          borderBottom: `1px solid ${colors.borderLight}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ef4444" }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#f59e0b" }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#22c55e" }} />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 13,
            color: colors.textMuted,
            fontFamily: "system-ui",
          }}
        >
          {title}
        </div>
      </div>
      {/* Content */}
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
};
