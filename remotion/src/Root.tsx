import React from "react";
import { Composition, registerRoot } from "remotion";
import { MarketingVideo } from "./compositions/MarketingVideo";
import { textEn } from "./data/text-en";
import { textSk } from "./data/text-sk";

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MarketingVideoEN"
        component={MarketingVideo as never}
        durationInFrames={6390}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ text: textEn, locale: "en" }}
      />
      <Composition
        id="MarketingVideoSK"
        component={MarketingVideo as never}
        durationInFrames={6390}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ text: textSk, locale: "sk" }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
