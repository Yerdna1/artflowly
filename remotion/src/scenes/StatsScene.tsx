import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { ParticleField } from "../components/ParticleField";
import { AnimatedCounter } from "../components/AnimatedCounter";
import type { VideoText } from "../data/types";

export const StatsScene: React.FC<{ text: VideoText["stats"] }> = ({ text }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const stats = [
    { ...text.videosGenerated, delay: 15 },
    { ...text.scenesCreated, delay: 30 },
    { ...text.happyCreators, delay: 45 },
  ];

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <GradientBackground variant="warm" />
      <ParticleField count={15} />

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 120,
            alignItems: "center",
          }}
        >
          {stats.map((stat, i) => (
            <AnimatedCounter
              key={i}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={stat.delay}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
