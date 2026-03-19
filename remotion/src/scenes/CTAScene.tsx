import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { ParticleField } from "../components/ParticleField";
import { colors } from "../styles/colors";
import { fonts } from "../styles/fonts";
import { gradients } from "../styles/colors";
import type { VideoText } from "../data/types";

export const CTAScene: React.FC<{ text: VideoText["cta"] }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  const headlineSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 15, stiffness: 80, mass: 1.2 },
  });

  const buttonSpring = spring({
    frame: Math.max(0, frame - 60),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const pulseGlow = interpolate(frame % 90, [0, 45, 90], [0.3, 0.8, 0.3]);

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <GradientBackground />
      <ParticleField count={40} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        {/* Headline */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            fontFamily: fonts.display,
            background: gradients.rainbow,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center",
            transform: `scale(${headlineSpring})`,
            lineHeight: 1.2,
          }}
        >
          {text.headline}
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: 40,
            fontWeight: 400,
            fontFamily: fonts.display,
            color: colors.textSecondary,
            textAlign: "center",
            opacity: interpolate(Math.max(0, frame - 30), [0, 20], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          {text.subtext}
        </div>

        {/* CTA Button */}
        <div
          style={{
            marginTop: 20,
            padding: "24px 64px",
            borderRadius: 100,
            background: gradients.purpleCyan,
            boxShadow: `0 0 40px rgba(147, 51, 234, ${pulseGlow}), 0 0 80px rgba(6, 182, 212, ${pulseGlow * 0.5})`,
            transform: `scale(${buttonSpring})`,
          }}
        >
          <span
            style={{
              fontSize: 40,
              fontWeight: 800,
              fontFamily: fonts.display,
              color: colors.white,
            }}
          >
            {text.buttonText}
          </span>
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            fontFamily: fonts.mono,
            color: colors.textMuted,
            opacity: interpolate(Math.max(0, frame - 90), [0, 20], [0, 1], {
              extrapolateRight: "clamp",
            }),
            letterSpacing: 2,
          }}
        >
          {text.url}
        </div>

        {/* Closing tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            fontFamily: fonts.display,
            fontStyle: "italic",
            color: colors.textSecondary,
            opacity: interpolate(Math.max(0, frame - 120), [0, 30], [0, 1], {
              extrapolateRight: "clamp",
            }),
            marginTop: 10,
          }}
        >
          {text.closing}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
