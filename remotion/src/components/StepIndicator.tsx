import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../styles/colors";
import { fonts } from "../styles/fonts";

interface StepIndicatorProps {
  activeStep: number;
  totalSteps?: number;
  delay?: number;
}

const stepIcons = ["📝", "👥", "🎬", "🖼️", "🎥", "🎙️"];
const stepLabels = ["Story", "Characters", "Scenes", "Images", "Video", "Voice"];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  activeStep,
  totalSteps = 6,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        justifyContent: "center",
      }}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepDelay = i * 8;
        const stepFrame = Math.max(0, adjustedFrame - stepDelay);
        const isActive = i + 1 === activeStep;
        const isCompleted = i + 1 < activeStep;

        const scaleSpring = spring({
          frame: stepFrame,
          fps,
          config: { damping: 20, stiffness: 150 },
        });

        const glowOpacity = isActive
          ? interpolate(frame % 60, [0, 30, 60], [0.3, 0.8, 0.3])
          : 0;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              opacity: scaleSpring,
              transform: `scale(${interpolate(scaleSpring, [0, 1], [0.5, isActive ? 1.15 : 1])})`,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                background: isActive
                  ? "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(6,182,212,0.3))"
                  : isCompleted
                    ? "rgba(34, 197, 94, 0.15)"
                    : "rgba(255, 255, 255, 0.05)",
                border: `2px solid ${
                  isActive
                    ? colors.purple
                    : isCompleted
                      ? colors.green
                      : colors.borderLight
                }`,
                boxShadow: isActive
                  ? `0 0 20px rgba(147, 51, 234, ${glowOpacity})`
                  : "none",
              }}
            >
              {isCompleted ? "✓" : stepIcons[i]}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                fontFamily: fonts.display,
                color: isActive ? colors.textPrimary : colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {stepLabels[i]}
            </div>
          </div>
        );
      })}
    </div>
  );
};
