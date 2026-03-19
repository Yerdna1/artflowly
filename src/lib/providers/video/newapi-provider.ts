import { BaseVideoProvider } from './base-video-provider';
import {
  AsyncProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  TaskStatus,
  ProviderError,
  ProviderValidationError,
} from '../types';
import { RegisterProvider } from '../provider-factory';
import { pollTask } from '@/lib/api/generation';
import {
  submitTask,
  pollTaskStatus,
  NEW_API_DEFAULT_MODELS,
} from '../newapi/client';

@RegisterProvider('video', 'newapi', {
  description: 'New API proxy for video generation (included with subscription)',
  features: [
    'Image-to-video generation',
    'Multiple motion modes',
    'High-quality output',
    'No API key needed',
    'Included with subscription credits',
  ],
  costPerUnit: 0.5,
  isAsync: true,
})
export class NewApiVideoProvider extends BaseVideoProvider implements AsyncProvider<VideoGenerationRequest, VideoGenerationResponse> {
  name = 'newapi';
  private taskId?: string;

  async validateConfig(): Promise<void> {
    if (!this.config.apiKey) {
      throw new ProviderValidationError('New API key is required', this.name);
    }
  }

  async generateVideo(
    imageUrl: string,
    prompt: string,
    mode?: string,
    seed?: string | number
  ): Promise<{ base64?: string; externalUrl?: string; mimeType: string }> {
    await this.validateImageUrl(imageUrl);

    const request: VideoGenerationRequest = { imageUrl, prompt, mode, seed };
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
        pollingResult.error || 'Video generation failed',
        'GENERATION_ERROR',
        this.name
      );
    }

    const finalResult = await this.getResult(this.taskId);

    if (!finalResult.externalUrl && !finalResult.videoUrl) {
      throw new ProviderError('No video generated', 'NO_RESULT', this.name);
    }

    return {
      externalUrl: finalResult.externalUrl || finalResult.videoUrl,
      mimeType: 'video/mp4',
    };
  }

  async createTask(request: VideoGenerationRequest): Promise<{ taskId: string }> {
    const { imageUrl, prompt } = request;
    const model = this.config.model || NEW_API_DEFAULT_MODELS.video;

    return submitTask(this.config.apiKey, {
      model,
      prompt: prompt || '',
      image: imageUrl,
    });
  }

  async checkStatus(taskId: string): Promise<TaskStatus> {
    const result = await pollTaskStatus(this.config.apiKey, taskId);
    return {
      status: result.status,
      progress: result.progress,
    };
  }

  async getResult(taskId: string): Promise<VideoGenerationResponse> {
    const result = await pollTaskStatus(this.config.apiKey, taskId);

    if (!result.resultUrl) {
      throw new ProviderError('No video URL found in result', 'NO_RESULT', this.name, result.rawData);
    }

    return {
      status: 'complete',
      externalUrl: result.resultUrl,
    };
  }
}
