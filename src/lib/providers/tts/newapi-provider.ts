import { BaseTTSProvider } from './base-tts-provider';
import {
  AsyncProvider,
  TTSGenerationRequest,
  TTSGenerationResponse,
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

@RegisterProvider('tts', 'newapi', {
  description: 'New API proxy for TTS generation (included with subscription)',
  features: [
    'Multiple voice models',
    'High-quality synthesis',
    'No API key needed',
    'Included with subscription credits',
    'Multiple languages',
  ],
  costPerUnit: 0.00005,
  isAsync: true,
})
export class NewApiTTSProvider extends BaseTTSProvider implements AsyncProvider<TTSGenerationRequest, TTSGenerationResponse> {
  name = 'newapi';
  private taskId?: string;

  async validateConfig(): Promise<void> {
    if (!this.config.apiKey) {
      throw new ProviderValidationError('New API key is required', this.name);
    }
  }

  async generateSpeech(
    text: string,
    voice?: string,
    voiceSettings?: TTSGenerationRequest['voiceSettings'],
    format?: 'mp3' | 'wav' | 'opus' | 'aac',
    languageCode?: string
  ): Promise<{ audio: Buffer; format: string }> {
    const request: TTSGenerationRequest = { text, voice, voiceSettings, format, languageCode };
    const taskResult = await this.createTask(request);
    this.taskId = taskResult.taskId;

    const pollingResult = await pollTask({
      taskId: this.taskId,
      checkStatus: (id) => this.checkStatus(id),
      maxAttempts: 60,
      initialDelay: 1000,
      maxDelay: 5000,
    });

    if (!pollingResult.success) {
      throw new ProviderError(
        pollingResult.error || 'TTS generation failed',
        'GENERATION_ERROR',
        this.name
      );
    }

    const finalResult = await this.getResult(this.taskId);

    if (!finalResult.base64 && !finalResult.externalUrl) {
      throw new ProviderError('No audio generated', 'NO_RESULT', this.name);
    }

    if (!finalResult.base64 && finalResult.externalUrl) {
      const base64 = await downloadAudioAsBase64(finalResult.externalUrl, finalResult.format as 'mp3' | 'wav' | 'opus' | 'aac');
      if (!base64) {
        throw new ProviderError('Failed to download generated audio', 'DOWNLOAD_ERROR', this.name);
      }
      return { audio: Buffer.from(base64, 'base64'), format: finalResult.format || 'mp3' };
    }

    return { audio: Buffer.from(finalResult.base64!, 'base64'), format: finalResult.format || 'mp3' };
  }

  async createTask(request: TTSGenerationRequest): Promise<{ taskId: string }> {
    const { text, voice, voiceSettings, format = 'mp3', languageCode = 'en-US' } = request;
    const model = this.config.model || NEW_API_DEFAULT_MODELS.tts;

    const metadata: Record<string, unknown> = {
      voice: voice || 'adam',
      language: languageCode,
      output_format: format,
    };

    if (voiceSettings) {
      metadata.voice_settings = {
        stability: voiceSettings.stability || 0.5,
        similarity_boost: voiceSettings.similarityBoost || 0.75,
        speaking_rate: voiceSettings.speed || 1.0,
        pitch: voiceSettings.pitch || 0,
      };
    }

    return submitTask(this.config.apiKey, {
      model,
      prompt: text,
      metadata,
    });
  }

  async checkStatus(taskId: string): Promise<TaskStatus> {
    const result = await pollTaskStatus(this.config.apiKey, taskId);
    return {
      status: result.status,
      progress: result.progress,
    };
  }

  async getResult(taskId: string): Promise<TTSGenerationResponse> {
    const result = await pollTaskStatus(this.config.apiKey, taskId);

    if (!result.resultUrl) {
      throw new ProviderError('No audio URL found in result', 'NO_RESULT', this.name, result.rawData);
    }

    return {
      status: 'complete',
      externalUrl: result.resultUrl,
      format: 'mp3',
    };
  }
}
