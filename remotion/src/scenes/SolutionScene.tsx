import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { ParticleField } from "../components/ParticleField";
import { LogoReveal } from "../components/LogoReveal";
import { AnimatedText } from "../components/AnimatedText";
import type { VideoText } from "../data/types";

export const SolutionScene: React.FC<{ text: VideoText["solution"] }> = ({
  text,
}) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <GradientBackground />
      <ParticleField count={25} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        <LogoReveal delay={15} />

        <AnimatedText
          text={text.subtitle}
          variant="subtitle"
          animation="slideUp"
          delay={50}
          style={{ textAlign: "center" }}
        />

        <AnimatedText
          text={text.description}
          variant="body"
          animation="fadeIn"
          delay={80}
          style={{ textAlign: "center", maxWidth: 900, padding: "0 40px" }}
        />

        {/* Step icons lighting up */}
        <Sequence from={120} durationInFrames={480}>
          <div style={{ marginTop: 40 }}>
            <StepIconsReveal />
          </div>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const StepIconsReveal: React.FC = () => {
  const frame = useCurrentFrame();

  const steps = ["📝", "👥", "🎬", "🖼️", "🎥", "🎙️"];

  return (
    <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
      {steps.map((icon, i) => {
        const stepDelay = i * 25;
        const adjustedFrame = Math.max(0, frame - stepDelay);
        const opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
          extrapolateRight: "clamp",
        });
        const scale = interpolate(adjustedFrame, [0, 15, 20], [0.3, 1.2, 1], {
          extrapolateRight: "clamp",
        });
        const glowOpacity = interpolate(
          adjustedFrame,
          [10, 25, 40],
          [0, 0.8, 0.3],
          { extrapolateRight: "clamp" }
        );

        return (
          <div
            key={i}
            style={{
              fontSize: 48,
              opacity,
              transform: `scale(${scale})`,
              filter: `drop-shadow(0 0 ${12 * glowOpacity}px rgba(147, 51, 234, 0.8))`,
            }}
          >
            {icon}
          </div>
        );
      })}
    </div>
  );
};
