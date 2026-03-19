import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { ParticleField } from "../components/ParticleField";
import { fonts } from "../styles/fonts";
import { colors } from "../styles/colors";
import type { VideoText } from "../data/types";

export const IntroScene: React.FC<{ text: VideoText["intro"] }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <GradientBackground variant="subtle" />
      <ParticleField count={20} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Problem words */}
        {text.problems.map((word, i) => {
          const wordDelay = i * 45;
          const adjustedFrame = Math.max(0, frame - wordDelay);

          const scaleSpring = spring({
            frame: adjustedFrame,
            fps,
            config: { damping: 12, stiffness: 100, mass: 1.5 },
          });

          const exitOpacity = interpolate(
            frame,
            [180, 210],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                fontSize: 140,
                fontWeight: 900,
                fontFamily: fonts.display,
                color: colors.textPrimary,
                opacity: scaleSpring * exitOpacity,
                transform: `scale(${scaleSpring})`,
                marginBottom: 10,
                textShadow: `0 0 40px ${colors.purple}40`,
              }}
            >
              {word}
            </div>
          );
        })}

        {/* Transition text */}
        <Sequence from={220} durationInFrames={280}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 200px",
            }}
          >
            <TransitionText text={text.transition} />
          </AbsoluteFill>
        </Sequence>

        {/* Hook text */}
        <Sequence from={400} durationInFrames={350}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 150px",
            }}
          >
            <HookText text={text.hook} />
          </AbsoluteFill>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const TransitionText: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const exitOpacity = interpolate(frame, [140, 170], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const y = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 100 },
  });

  return (
    <div
      style={{
        fontSize: 60,
        fontWeight: 600,
        fontFamily: fonts.display,
        color: colors.textSecondary,
        textAlign: "center",
        opacity: opacity * exitOpacity,
        transform: `translateY(${interpolate(y, [0, 1], [30, 0])}px)`,
      }}
    >
      {text}
    </div>
  );
};

const HookText: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });

  const scale = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 80, mass: 1.2 },
  });

  return (
    <div
      style={{
        fontSize: 76,
        fontWeight: 800,
        fontFamily: fonts.display,
        background: "linear-gradient(135deg, #a855f7 0%, #06b6d4 50%, #ec4899 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textAlign: "center",
        opacity,
        transform: `scale(${interpolate(scale, [0, 1], [0.9, 1])})`,
        lineHeight: 1.3,
      }}
    >
      {text}
    </div>
  );
};
