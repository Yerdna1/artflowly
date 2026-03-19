import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../styles/colors";
import { fonts } from "../styles/fonts";
import { gradients } from "../styles/colors";

interface AnimatedTextProps {
  text: string;
  delay?: number;
  variant?: "title" | "subtitle" | "body" | "hero" | "gradient";
  animation?: "fadeIn" | "slideUp" | "typewriter" | "scaleIn";
  style?: React.CSSProperties;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  variant = "body",
  animation = "fadeIn",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const springValue = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 30, stiffness: 120, mass: 0.8 },
  });

  const opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  let transform = "";
  if (animation === "slideUp") {
    const y = interpolate(springValue, [0, 1], [40, 0]);
    transform = `translateY(${y}px)`;
  } else if (animation === "scaleIn") {
    const scale = interpolate(springValue, [0, 1], [0.8, 1]);
    transform = `scale(${scale})`;
  }

  const baseStyles: Record<string, React.CSSProperties> = {
    hero: {
      fontSize: 120,
      fontWeight: 800,
      fontFamily: fonts.display,
      color: colors.textPrimary,
      lineHeight: 1.1,
    },
    title: {
      fontSize: 80,
      fontWeight: 700,
      fontFamily: fonts.display,
      color: colors.textPrimary,
      lineHeight: 1.2,
    },
    subtitle: {
      fontSize: 44,
      fontWeight: 500,
      fontFamily: fonts.display,
      color: colors.textSecondary,
      lineHeight: 1.4,
    },
    body: {
      fontSize: 34,
      fontWeight: 400,
      fontFamily: fonts.display,
      color: colors.textSecondary,
      lineHeight: 1.5,
    },
    gradient: {
      fontSize: 88,
      fontWeight: 800,
      fontFamily: fonts.display,
      background: gradients.rainbow,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      lineHeight: 1.2,
    },
  };

  if (animation === "typewriter") {
    const charsToShow = Math.floor(
      interpolate(adjustedFrame, [0, text.length * 2], [0, text.length], {
        extrapolateRight: "clamp",
      })
    );
    return (
      <div
        style={{
          ...baseStyles[variant],
          opacity,
          fontFamily: fonts.mono,
          ...style,
        }}
      >
        {text.slice(0, charsToShow)}
        {charsToShow < text.length && (
          <span style={{ opacity: frame % 15 < 8 ? 1 : 0 }}>|</span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        ...baseStyles[variant],
        opacity,
        transform,
        ...style,
      }}
    >
      {text}
    </div>
  );
};
