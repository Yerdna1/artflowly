import type { VideoText } from "./types";

export const textEn: VideoText = {
  intro: {
    problems: ["Expensive.", "Slow.", "Complex."],
    transition: "Traditional video production doesn't scale.",
    hook: "What if your team could produce studio-quality content in hours, not weeks?",
  },
  solution: {
    tagline: "ArtFlowly",
    subtitle: "AI-Powered Video Production Platform",
    description: "The end-to-end solution for businesses that need scalable, high-quality video content.",
  },
  stats: {
    videosGenerated: { value: 590, suffix: "+", label: "Videos Produced" },
    scenesCreated: { value: 7400, suffix: "+", label: "Scenes Generated" },
    happyCreators: { value: 160, suffix: "+", label: "Business Users" },
  },
  costBenefits: {
    headline: "Dramatically Reduce Production Costs",
    savingsRange: "30–60%",
    comparisons: [
      { label: "Animated Explainer Videos", savingsPercent: 55 },
      { label: "Marketing & Ad Content", savingsPercent: 45 },
      { label: "Training & Onboarding Videos", savingsPercent: 60 },
      { label: "Voiceover & Localization", savingsPercent: 50 },
    ],
    advantages: [
      "17+ AI Image Models",
      "15+ AI Video Models",
      "Scales with Your Business",
      "White-Label Ready",
    ],
  },
  steps: {
    sectionTitle: "6 Steps to Your Video",
    story: {
      number: "01",
      title: "Story & Settings",
      subtitle: "Define your narrative and visual style",
      details: ["Choose genre, tone, and target audience", "AI-assisted story structuring", "Configure visual style presets"],
    },
    characters: {
      number: "02",
      title: "Characters",
      subtitle: "AI-generated character design",
      details: ["Text description to portrait in seconds", "Consistent character identity across scenes", "Voice profile assignment"],
    },
    scenes: {
      number: "03",
      title: "Scene Generation",
      subtitle: "AI writes production-ready scene briefs",
      details: ["Batch processing — 10 scenes per call", "Full creative control to edit and reorder", "Auto-generated dialogue and camera direction"],
    },
    images: {
      number: "04",
      title: "Image Generation",
      subtitle: "17+ models for any visual style",
      details: ["Switch providers without re-prompting", "Regenerate until every frame is on-brand", "Consistent style across entire production"],
    },
    video: {
      number: "05",
      title: "Video Generation",
      subtitle: "Bring images to life with motion",
      details: ["15+ video generation models", "Parallel processing for fast turnaround", "Multiple duration and resolution options"],
    },
    voiceover: {
      number: "06",
      title: "Voiceover & Music",
      subtitle: "Complete your production with audio",
      details: ["AI text-to-speech in multiple languages", "Background music generation", "Export-ready final output"],
    },
  },
  features: {
    headline: "Built for Business",
    items: [
      { title: "Team Collaboration", description: "Role-based access control for your entire production team" },
      { title: "Multi-Language Output", description: "Produce content in any language — reach global markets instantly" },
      { title: "Self-Hosted Deployment", description: "Full control on your infrastructure. Your data stays yours." },
      { title: "API Integration", description: "Embed video generation into your existing workflows and products" },
    ],
  },
  cta: {
    headline: "Ready to Transform Your Video Production?",
    subtext: "Join leading businesses already producing with ArtFlowly.",
    buttonText: "Request a Demo",
    url: "artflowly.com",
    closing: "ArtFlowly — where AI meets production.",
  },
};
