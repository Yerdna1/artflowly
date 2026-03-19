import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { IntroScene } from "../scenes/IntroScene";
import { SolutionScene } from "../scenes/SolutionScene";
import { StatsScene } from "../scenes/StatsScene";
import { CostBenefitsScene } from "../scenes/CostBenefitsScene";
import { WalkthroughScene } from "../scenes/WalkthroughScene";
import { FeaturesScene } from "../scenes/FeaturesScene";
import { CTAScene } from "../scenes/CTAScene";
import type { VideoText } from "../data/types";

// Timeline (30fps):
// Scene 1: Intro       0-749       (25s)
// Scene 2: Solution    750-1349    (20s)
// Scene 3: Stats       1350-1709   (12s)
// Scene 4: Cost        1710-2609   (30s)
// Scene 5: Walkthrough 2610-5639   (101s = 3s title + 18s + 16s*5)
//   5a Story:      2700-3239
//   5b Characters: 3240-3719
//   5c Scenes:     3720-4199
//   5d Images:     4200-4679
//   5e Video:      4680-5159
//   5f Voiceover:  5160-5639
// Scene 6: Features    5640-6089   (15s)
// Scene 7: CTA         6090-6389   (10s)
// Total: 6390 frames ≈ 3:33

interface MarketingVideoProps {
  text: VideoText;
  locale: "en" | "sk";
}

// Audio narration tracks mapped to scene timings
const narrationTracks = [
  { file: "01-intro", from: 0, duration: 750 },
  { file: "02-solution", from: 750, duration: 600 },
  { file: "03-stats", from: 1350, duration: 360 },
  { file: "04-cost", from: 1710, duration: 900 },
  { file: "05a-story", from: 2700, duration: 540 },
  { file: "05b-characters", from: 3240, duration: 480 },
  { file: "05c-scenes", from: 3720, duration: 480 },
  { file: "05d-images", from: 4200, duration: 480 },
  { file: "05e-video", from: 4680, duration: 480 },
  { file: "05f-voiceover", from: 5160, duration: 480 },
  { file: "06-features", from: 5640, duration: 450 },
  { file: "07-cta", from: 6090, duration: 300 },
];

export const MarketingVideo: React.FC<MarketingVideoProps> = ({
  text,
  locale,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#13131f" }}>
      {/* Narration audio tracks */}
      {narrationTracks.map((track) => (
        <Sequence
          key={track.file}
          from={track.from}
          durationInFrames={track.duration}
          name={`Audio: ${track.file}`}
        >
          <Audio
            src={staticFile(`audio/${locale}/${track.file}.mp3`)}
            volume={1}
          />
        </Sequence>
      ))}

      {/* Visual scenes */}
      <Sequence from={0} durationInFrames={750} name="Intro">
        <IntroScene text={text.intro} />
      </Sequence>

      <Sequence from={750} durationInFrames={600} name="Solution">
        <SolutionScene text={text.solution} />
      </Sequence>

      <Sequence from={1350} durationInFrames={360} name="Stats">
        <StatsScene text={text.stats} />
      </Sequence>

      <Sequence from={1710} durationInFrames={900} name="Cost Benefits">
        <CostBenefitsScene text={text.costBenefits} />
      </Sequence>

      <Sequence from={2610} durationInFrames={3030} name="Walkthrough">
        <WalkthroughScene text={text.steps} />
      </Sequence>

      <Sequence from={5640} durationInFrames={450} name="Features">
        <FeaturesScene text={text.features} />
      </Sequence>

      <Sequence from={6090} durationInFrames={300} name="CTA">
        <CTAScene text={text.cta} />
      </Sequence>
    </AbsoluteFill>
  );
};
