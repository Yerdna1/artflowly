import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GradientBackground } from "../../components/GradientBackground";
import { GlassCard } from "../../components/GlassCard";
import { StepIndicator } from "../../components/StepIndicator";
import { colors } from "../../styles/colors";
import { fonts } from "../../styles/fonts";
import { gradients } from "../../styles/colors";
import type { StepText } from "../../data/types";

interface StepSceneProps {
  step: StepText;
  stepNumber: number;
}

export const StepScene: React.FC<StepSceneProps> = ({ step, stepNumber }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <GradientBackground variant={stepNumber % 2 === 0 ? "warm" : "default"} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "60px 120px",
          gap: 40,
        }}
      >
        {/* Step indicator bar at top */}
        <StepIndicator activeStep={stepNumber} delay={5} />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 80,
          }}
        >
          {/* Left: Step number and title */}
          <div style={{ flex: 1 }}>
            <StepNumber number={step.number} />
            <StepTitle title={step.title} />
            <StepSubtitle subtitle={step.subtitle} />

            {/* Details list */}
            <div style={{ marginTop: 40 }}>
              {step.details.map((detail, i) => (
                <DetailItem key={i} text={detail} delay={60 + i * 20} />
              ))}
            </div>
          </div>

          {/* Right: Visual card */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <GlassCard
              delay={40}
              width={600}
              glowColor={stepNumber % 2 === 0 ? colors.cyan : colors.purple}
              style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <StepVisual stepNumber={stepNumber} />
            </GlassCard>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const StepNumber: React.FC<{ number: string }> = ({ number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  return (
    <div
      style={{
        fontSize: 140,
        fontWeight: 900,
        fontFamily: fonts.display,
        background: gradients.purpleCyan,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        opacity: scale * 0.15,
        transform: `scale(${scale})`,
        lineHeight: 1,
        marginBottom: -60,
      }}
    >
      {number}
    </div>
  );
};

const StepTitle: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(Math.max(0, frame - 15), [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(Math.max(0, frame - 15), [0, 20], [25, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        fontSize: 68,
        fontWeight: 800,
        fontFamily: fonts.display,
        color: colors.textPrimary,
        opacity,
        transform: `translateY(${y}px)`,
        position: "relative",
        zIndex: 1,
      }}
    >
      {title}
    </div>
  );
};

const StepSubtitle: React.FC<{ subtitle: string }> = ({ subtitle }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(Math.max(0, frame - 30), [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        fontSize: 34,
        fontWeight: 400,
        fontFamily: fonts.display,
        color: colors.textSecondary,
        opacity,
        marginTop: 12,
      }}
    >
      {subtitle}
    </div>
  );
};

const DetailItem: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - delay);

  const opacity = interpolate(adjustedFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const x = interpolate(adjustedFrame, [0, 12], [-20, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 16,
        opacity,
        transform: `translateX(${x}px)`,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: gradients.purpleCyan,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          fontSize: 28,
          fontWeight: 500,
          fontFamily: fonts.display,
          color: colors.textSecondary,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Map step numbers to screenshot files (null = use emoji fallback)
const stepScreenshots: Record<number, string | null> = {
  1: "screenshots/story-step.png",
  2: "screenshots/characters-step.png",
  3: "screenshots/scenes-overview.png",
  4: "screenshots/scenes-overview.png",
  5: "screenshots/videos-step.png",
  6: null,
};

const StepVisual: React.FC<{ stepNumber: number }> = ({ stepNumber }) => {
  const frame = useCurrentFrame();

  const screenshot = stepScreenshots[stepNumber];
  const floatY = interpolate(frame % 120, [0, 60, 120], [0, -8, 0]);
  const opacity = interpolate(Math.max(0, frame - 50), [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  if (screenshot) {
    return (
      <div
        style={{
          opacity,
          transform: `translateY(${floatY}px)`,
          width: "100%",
        }}
      >
        <Img
          src={staticFile(screenshot)}
          style={{
            width: "100%",
            borderRadius: 12,
            boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
          }}
        />
      </div>
    );
  }

  const icons = ["📝✨", "👥🎨", "🎬📋", "🖼️🎯", "🎥⚡", "🎙️🎵"];
  const icon = icons[stepNumber - 1] || "✨";

  return (
    <div
      style={{
        fontSize: 100,
        textAlign: "center",
        opacity,
        transform: `translateY(${floatY}px)`,
      }}
    >
      {icon}
    </div>
  );
};
