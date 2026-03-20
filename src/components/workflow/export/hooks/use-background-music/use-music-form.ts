// Form state management for background music

import { useState, useEffect, useCallback } from 'react';
import type { MusicProvider } from '@/types/project';
import type { SunoModel, UseBackgroundMusicProps } from './types';
import { DEFAULT_VALUES } from './constants';

export interface UseMusicFormReturn {
  prompt: string;
  setPrompt: (prompt: string) => void;
  model: SunoModel;
  setModel: (model: SunoModel) => void;
  instrumental: boolean;
  setInstrumental: (instrumental: boolean) => void;
  provider: MusicProvider;
  setProvider: (provider: MusicProvider) => void;
}

export function useMusicForm({ apiKeys }: UseBackgroundMusicProps): UseMusicFormReturn {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<SunoModel>(DEFAULT_VALUES.MODEL);
  const [instrumental, setInstrumental] = useState<boolean>(DEFAULT_VALUES.INSTRUMENTAL);
  const [provider, setProvider] = useState<MusicProvider>(
    (apiKeys?.musicProvider || DEFAULT_VALUES.PROVIDER) as MusicProvider
  );

  const musicProvider = apiKeys?.musicProvider;
  const kieMusicModel = apiKeys?.kieMusicModel;

  useEffect(() => {
    if (musicProvider) {
      setProvider(musicProvider as MusicProvider);

      if (musicProvider === 'kie' && kieMusicModel) {
        setModel(kieMusicModel as SunoModel);
      } else if (musicProvider === 'piapi') {
        setModel('V4.5');
      }
    }
  }, [musicProvider, kieMusicModel]);

  return {
    prompt,
    setPrompt,
    model,
    setModel,
    instrumental,
    setInstrumental,
    provider,
    setProvider,
  };
}
