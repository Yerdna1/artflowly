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
import { AnimatedText } from "../components/AnimatedText";
import { ComparisonBar } from "../components/ComparisonBar";
import { GlassCard } from "../components/GlassCard";
import { colors } from "../styles/colors";
import { fonts } from "../styles/fonts";
import type { VideoText } from "../data/types";

export const CostBenefitsScene: React.FC<{ text: VideoText["costBenefits"] }> = ({
  text,
}) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <GradientBackground />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "70px 120px",
        }}
      >
        {/* Headline */}
        <AnimatedText
          text={text.headline}
          variant="title"
          animation="slideUp"
          delay={10}
          style={{ textAlign: "center", marginBottom: 30 }}
        />

        {/* Savings badge */}
        <Sequence from={30} durationInFrames={870} layout="none">
          <SavingsBadge savingsRange={text.savingsRange} />
        </Sequence>

        {/* Savings bars */}
        <div style={{ marginTop: 20, width: "100%", maxWidth: 1200 }}>
          {text.comparisons.map((comp, i) => (
            <ComparisonBar
              key={i}
              label={comp.label}
              savingsPercent={comp.savingsPercent}
              delay={60 + i * 35}
            />
          ))}
        </div>

        {/* Advantages */}
        <Sequence from={250} durationInFrames={650} layout="none">
          <AdvantagesGrid advantages={text.advantages} />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SavingsBadge: React.FC<{ savingsRange: string }> = ({ savingsRange }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100, mass: 1 },
  });

  const pulseGlow = interpolate(frame % 60, [0, 30, 60], [0.3, 0.7, 0.3]);

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
      <div
        style={{
          display: "inline-flex",
          padding: "16px 48px",
          borderRadius: 100,
          background: "linear-gradient(135deg, rgba(147,51,234,0.2), rgba(6,182,212,0.2))",
          border: `2px solid ${colors.purple}`,
          boxShadow: `0 0 30px rgba(147,51,234,${pulseGlow})`,
          transform: `scale(${scale})`,
        }}
      >
        <span
          style={{
            fontSize: 56,
            fontWeight: 900,
            fontFamily: fonts.display,
            background: "linear-gradient(135deg, #a855f7, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {savingsRange}
        </span>
      </div>
    </div>
  );
};

const AdvantagesGrid: React.FC<{ advantages: string[] }> = ({ advantages }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 24,
        marginTop: 20,
        flexWrap: "wrap",
      }}
    >
      {advantages.map((item, i) => {
        const delay = i * 15;
        const opacity = interpolate(Math.max(0, frame - delay), [0, 15], [0, 1], {
          extrapolateRight: "clamp",
        });
        const y = interpolate(Math.max(0, frame - delay), [0, 20], [20, 0], {
          extrapolateRight: "clamp",
        });

        return (
          <GlassCard key={i} delay={delay} style={{ padding: "16px 32px" }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                fontFamily: fonts.display,
                color: colors.textPrimary,
                opacity,
                transform: `translateY(${y}px)`,
                whiteSpace: "nowrap",
              }}
            >
              {item}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};
