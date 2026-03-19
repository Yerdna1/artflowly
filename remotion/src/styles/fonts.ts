import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: outfitFamily } = loadOutfit();
const { fontFamily: jetbrainsFamily } = loadJetBrainsMono();

export const fonts = {
  display: outfitFamily,
  mono: jetbrainsFamily,
} as const;
