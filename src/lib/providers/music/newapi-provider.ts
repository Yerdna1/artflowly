import { BaseMusicProvider } from './base-music-provider';
import {
  AsyncProvider,
  MusicGenerationRequest,
  MusicGenerationResponse,
  TaskStatus,
  ProviderError,
  ProviderValidationError,
} from '../types';
import { RegisterProvider } from '../provider-factory';
import { pollTask, downloadAudioAsBase64 } from '@/lib/api/generation';
import {
  submitTask,
  pollTaskStatus,
  NEW_API_DEFAULT_MODELS,
} from '../newapi/client';

@RegisterProvider('music', 'newapi', {
  description: 'New API proxy for music generation (included with subscription)',
  features: [
    'Multiple music models',
    'High-quality generation',
    'No API key needed',
    'Included with subscription credits',
    'Custom duration support',
  ],
  costPerUnit: 0.15,
  isAsync: true,
})
export class NewApiMusicProvider extends BaseMusicProvider implements AsyncProvider<MusicGenerationRequest, MusicGenerationResponse> {
  name = 'newapi';
  private taskId?: string;

  async validateConfig(): Promise<void> {
    if (!this.config.apiKey) {
      throw new ProviderValidationError('New API key is required', this.name);
    }
  }

  async generateMusic(
    prompt: string,
    description?: string,
    duration: number = 30,
    style?: string,
    instruments?: string[]
  ): Promise<{ audio: Buffer; format: string; tags?: string[]; externalUrl?: string }> {
    const request: MusicGenerationRequest = {
      prompt,
      description: description || prompt,
      duration,
      style,
      instruments,
    };

    const taskResult = await this.createTask(request);
    this.taskId = taskResult.taskId;

    const pollingResult = await pollTask({
      taskId: this.taskId,
      checkStatus: (id) => this.checkStatus(id),
      maxAttempts: 120,
      initialDelay: 3000,
      maxDelay: 15000,
      timeout: 600000,
    });

    if (!pollingResult.success) {
      throw new ProviderError(
        pollingResult.error || 'Music generation failed',
        'GENERATION_ERROR',
        this.name
      );
    }

    const finalResult = await this.getResult(this.taskId);

    if (!finalResult.externalUrl && !finalResult.base64) {
      throw new ProviderError('No music generated', 'NO_RESULT', this.name);
    }

    let audioBuffer: Buffer;
    if (finalResult.base64) {
      audioBuffer = Buffer.from(finalResult.base64, 'base64');
    } else {
      const url = finalResult.externalUrl || finalResult.musicUrl!;
      const base64 = await downloadAudioAsBase64(url);
      if (!base64) {
        throw new ProviderError('Failed to download generated music', 'DOWNLOAD_ERROR', this.name);
      }
      audioBuffer = Buffer.from(base64, 'base64');
    }

    return {
      audio: audioBuffer,
      format: 'mp3',
      tags: finalResult.tags || [],
      externalUrl: finalResult.externalUrl || finalResult.musicUrl,
    };
  }

  async createTask(request: MusicGenerationRequest): Promise<{ taskId: string }> {
    const { prompt, description, duration = 30, style } = request;
    const model = this.config.model || NEW_API_DEFAULT_MODELS.music;

    let finalPrompt = description || prompt || '';
    if (style) {
      finalPrompt = `${style} style: ${finalPrompt}`;
    }

    return submitTask(this.config.apiKey, {
      model,
      prompt: finalPrompt,
      duration,
      metadata: { style },
    });
  }

  async checkStatus(taskId: string): Promise<TaskStatus> {
    const result = await pollTaskStatus(this.config.apiKey, taskId);
    return {
      status: result.status,
      progress: result.progress,
    };
  }

  async getResult(taskId: string): Promise<MusicGenerationResponse> {
    const result = await pollTaskStatus(this.config.apiKey, taskId);

    if (!result.resultUrl) {
      throw new ProviderError('No music URL found in result', 'NO_RESULT', this.name, result.rawData);
    }

    return {
      status: 'complete',
      externalUrl: result.resultUrl,
      tags: [],
    };
  }
}
