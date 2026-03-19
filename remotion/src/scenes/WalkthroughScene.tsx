import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { AnimatedText } from "../components/AnimatedText";
import { StepScene } from "./steps/StepScene";
import type { VideoText } from "../data/types";

// Title: 90 frames (3s)
// Step 1 (story):      90–630    (540 frames / 18s)
// Step 2 (characters): 630–1110  (480 frames / 16s)
// Step 3 (scenes):     1110–1590 (480 frames / 16s)
// Step 4 (images):     1590–2070 (480 frames / 16s)
// Step 5 (video):      2070–2550 (480 frames / 16s)
// Step 6 (voiceover):  2550–3030 (480 frames / 16s)
// Total: 3030 frames

export const WalkthroughScene: React.FC<{ text: VideoText["steps"] }> = ({
  text,
}) => {
  const frame = useCurrentFrame();

  const titleFadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleFadeOut = interpolate(frame, [70, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* Section title */}
      <Sequence from={0} durationInFrames={90}>
        <AbsoluteFill>
          <GradientBackground />
          <AbsoluteFill
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: titleFadeIn * titleFadeOut,
            }}
          >
            <AnimatedText
              text={text.sectionTitle}
              variant="gradient"
              animation="scaleIn"
            />
          </AbsoluteFill>
        </AbsoluteFill>
      </Sequence>

      {/* Step 1: Story */}
      <Sequence from={90} durationInFrames={540}>
        <StepScene step={text.story} stepNumber={1} />
      </Sequence>

      {/* Step 2: Characters */}
      <Sequence from={630} durationInFrames={480}>
        <StepScene step={text.characters} stepNumber={2} />
      </Sequence>

      {/* Step 3: Scenes */}
      <Sequence from={1110} durationInFrames={480}>
        <StepScene step={text.scenes} stepNumber={3} />
      </Sequence>

      {/* Step 4: Images */}
      <Sequence from={1590} durationInFrames={480}>
        <StepScene step={text.images} stepNumber={4} />
      </Sequence>

      {/* Step 5: Video */}
      <Sequence from={2070} durationInFrames={480}>
        <StepScene step={text.video} stepNumber={5} />
      </Sequence>

      {/* Step 6: Voiceover & Music */}
      <Sequence from={2550} durationInFrames={480}>
        <StepScene step={text.voiceover} stepNumber={6} />
      </Sequence>
    </AbsoluteFill>
  );
};
