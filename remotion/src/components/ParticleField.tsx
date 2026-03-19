import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  hue: number;
}

export const ParticleField: React.FC<{ count?: number }> = ({ count = 30 }) => {
  const frame = useCurrentFrame();

  const particles = useMemo<Particle[]>(() => {
    const seeded = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297) % 233280;
      return (x < 0 ? x + 233280 : x) / 233280;
    };

    return Array.from({ length: count }, (_, i) => ({
      x: seeded(i * 7 + 1) * 1920,
      y: seeded(i * 13 + 3) * 1080,
      size: seeded(i * 17 + 5) * 3 + 1,
      speed: seeded(i * 23 + 7) * 0.5 + 0.2,
      opacity: seeded(i * 29 + 11) * 0.3 + 0.1,
      hue: seeded(i * 31 + 13) > 0.5 ? 270 : 190, // purple or cyan
    }));
  }, [count]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const y = (p.y + frame * p.speed) % 1120 - 40;
        const flickerOpacity = interpolate(
          Math.sin(frame * 0.05 + i),
          [-1, 1],
          [p.opacity * 0.5, p.opacity]
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: `hsla(${p.hue}, 70%, 60%, ${flickerOpacity})`,
              boxShadow: `0 0 ${p.size * 3}px hsla(${p.hue}, 70%, 60%, ${flickerOpacity * 0.5})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
