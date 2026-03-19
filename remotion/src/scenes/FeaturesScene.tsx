import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { AnimatedText } from "../components/AnimatedText";
import { GlassCard } from "../components/GlassCard";
import { ParticleField } from "../components/ParticleField";
import { colors } from "../styles/colors";
import { fonts } from "../styles/fonts";
import type { VideoText } from "../data/types";

const featureIcons = ["👥", "🌍", "🏢", "🔗"];

export const FeaturesScene: React.FC<{ text: VideoText["features"] }> = ({
  text,
}) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <GradientBackground variant="warm" />
      <ParticleField count={15} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 120px",
          gap: 60,
        }}
      >
        <AnimatedText
          text={text.headline}
          variant="title"
          animation="slideUp"
          delay={10}
          style={{ textAlign: "center" }}
        />

        <div style={{ display: "flex", gap: 40 }}>
          {text.items.map((item, i) => (
            <FeatureCard
              key={i}
              icon={featureIcons[i]}
              title={item.title}
              description={item.description}
              delay={40 + i * 30}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const FeatureCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  delay: number;
}> = ({ icon, title, description, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const cardSpring = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  return (
    <GlassCard
      delay={delay}
      width={480}
      glowColor={colors.cyan}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 20,
        padding: "48px 36px",
      }}
    >
      <div
        style={{
          fontSize: 72,
          transform: `scale(${cardSpring})`,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 700,
          fontFamily: fonts.display,
          color: colors.textPrimary,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 400,
          fontFamily: fonts.display,
          color: colors.textSecondary,
          lineHeight: 1.5,
        }}
      >
        {description}
      </div>
    </GlassCard>
  );
};
