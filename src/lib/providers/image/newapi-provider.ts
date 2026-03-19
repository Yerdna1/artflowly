import { BaseImageProvider } from './base-image-provider';
import {
  AsyncProvider,
  ImageGenerationRequest,
  ImageGenerationResponse,
  TaskStatus,
  ProviderError,
  ProviderValidationError,
} from '../types';
import { RegisterProvider } from '../provider-factory';
import { pollTask } from '@/lib/api/generation';
import { downloadImageAsBase64 } from '@/lib/api/generation';
import {
  submitTask,
  pollTaskStatus,
  NEW_API_DEFAULT_MODELS,
} from '../newapi/client';

@RegisterProvider('image', 'newapi', {
  description: 'New API proxy for image generation (included with subscription)',
  features: [
    'Multiple model options',
    'High-quality generation',
    'No API key needed',
    'Included with subscription credits',
    'Async generation with polling',
  ],
  costPerUnit: 0.015,
  isAsync: true,
})
export class NewApiImageProvider extends BaseImageProvider implements AsyncProvider<ImageGenerationRequest, ImageGenerationResponse> {
  name = 'newapi';
  private taskId?: string;

  async validateConfig(): Promise<void> {
    if (!this.config.apiKey) {
      throw new ProviderValidationError('New API key is required', this.name);
    }
  }

  async generateImage(
    prompt: string,
    aspectRatio: string,
    resolution: string,
    referenceImages?: Array<{ name: string; imageUrl: string }>
  ): Promise<{ base64: string; mimeType: string }> {
    const request: ImageGenerationRequest = {
      prompt,
      aspectRatio,
      resolution: resolution as any,
      referenceImages: referenceImages || [],
    };

    const taskResult = await this.createTask(request);
    this.taskId = taskResult.taskId;

    const pollingResult = await pollTask({
      taskId: this.taskId,
      checkStatus: (id) => this.checkStatus(id),
      maxAttempts: 60,
      initialDelay: 2000,
      maxDelay: 10000,
    });

    if (!pollingResult.success) {
      throw new ProviderError(
        pollingResult.error || 'Image generation failed',
        'GENERATION_ERROR',
        this.name
      );
    }

    const finalResult = await this.getResult(this.taskId);

    if (!finalResult.base64 && !finalResult.externalUrl) {
      throw new ProviderError('No image generated', 'NO_RESULT', this.name);
    }

    if (!finalResult.base64 && finalResult.externalUrl) {
      const base64 = await downloadImageAsBase64(finalResult.externalUrl);
      if (!base64) {
        throw new ProviderError('Failed to download generated image', 'DOWNLOAD_ERROR', this.name);
      }
      return { base64, mimeType: 'image/png' };
    }

    return { base64: finalResult.base64!, mimeType: 'image/png' };
  }

  async createTask(request: ImageGenerationRequest): Promise<{ taskId: string }> {
    const { prompt, aspectRatio = '16:9', resolution = '2k' } = request;

    const model = this.config.model || NEW_API_DEFAULT_MODELS.image;

    // Map aspect ratio to size format
    const sizeMap: Record<string, string> = {
      '1:1': '1:1',
      '16:9': '16:9',
      '9:16': '9:16',
      '4:3': '4:3',
      '3:4': '3:4',
    };

    return submitTask(this.config.apiKey, {
      model,
      prompt: prompt || '',
      size: sizeMap[aspectRatio] || aspectRatio,
      metadata: { resolution },
    });
  }

  async checkStatus(taskId: string): Promise<TaskStatus> {
    const result = await pollTaskStatus(this.config.apiKey, taskId);
    return {
      status: result.status,
      progress: result.progress,
    };
  }

  async getResult(taskId: string): Promise<ImageGenerationResponse> {
    const result = await pollTaskStatus(this.config.apiKey, taskId);

    if (!result.resultUrl) {
      throw new ProviderError('No image URL found in result', 'NO_RESULT', this.name, result.rawData);
    }

    return {
      status: 'complete',
      externalUrl: result.resultUrl,
    };
  }
}
