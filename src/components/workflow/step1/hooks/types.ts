import type { Project, VoiceProvider, ImageProvider, ProjectSettings } from '@/types/project';
import type { Dispatch, SetStateAction } from 'react';

export type Setter<T> = Dispatch<SetStateAction<T>>;

export interface Step1State {
  // Project
  project: Project;
  store: {
    updateStory: (id: string, story: Partial<Project['story']>) => void;
    setMasterPrompt: (id: string, prompt: string) => void;
    updateSettings: (id: string, settings: Partial<ProjectSettings>) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    updateUserConstants: (constants: Record<string, unknown>) => void;
    nextStep: (id: string) => void;
  };
  userConstants: Record<string, unknown> | null;

  // Subscription
  isPremiumUser: boolean;
  effectiveIsPremium: boolean;
  isAdmin: boolean;

  // Form state
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  editedPrompt: string;
  setEditedPrompt: (value: string) => void;
  selectedPresetId: string | null;
  setSelectedPresetId: (value: string | null) => void;
  generatingModel?: string;
  setGeneratingModel: (value: string | undefined) => void;
  generatingProvider?: string;
  setGeneratingProvider: (value: string | undefined) => void;

  // Settings
  aspectRatio: '16:9' | '21:9' | '4:3' | '1:1' | '9:16' | '3:4';
  setAspectRatio: (value: '16:9' | '21:9' | '4:3' | '1:1' | '9:16' | '3:4') => void;
  videoLanguage: string;
  setVideoLanguage: Dispatch<SetStateAction<string>>;
  storyModel: 'gpt-4' | 'claude-sonnet-4.5' | 'gemini-3-pro';
  setStoryModel: (value: 'gpt-4' | 'claude-sonnet-4.5' | 'gemini-3-pro') => void;
  voiceProvider: VoiceProvider;
  setVoiceProvider: (value: VoiceProvider) => void;
  imageProvider: ImageProvider;
  setImageProvider: (value: ImageProvider) => void;

  // Constants
  videoLanguages: readonly string[];
}
