export interface StepText {
  number: string;
  title: string;
  subtitle: string;
  details: string[];
}

export interface VideoText {
  intro: {
    problems: string[];
    transition: string;
    hook: string;
  };
  solution: {
    tagline: string;
    subtitle: string;
    description: string;
  };
  stats: {
    videosGenerated: { value: number; suffix: string; label: string };
    scenesCreated: { value: number; suffix: string; label: string };
    happyCreators: { value: number; suffix: string; label: string };
  };
  costBenefits: {
    headline: string;
    savingsRange: string;
    comparisons: { label: string; savingsPercent: number }[];
    advantages: string[];
  };
  steps: {
    sectionTitle: string;
    story: StepText;
    characters: StepText;
    scenes: StepText;
    images: StepText;
    video: StepText;
    voiceover: StepText;
  };
  features: {
    headline: string;
    items: { title: string; description: string }[];
  };
  cta: {
    headline: string;
    subtext: string;
    buttonText: string;
    url: string;
    closing: string;
  };
}
