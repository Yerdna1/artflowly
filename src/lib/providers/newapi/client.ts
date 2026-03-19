/**
 * Shared New API client for all generation types.
 * Routes through the New API proxy at NEW_API_URL (proxies to kie.ai with margin pricing).
 */

import { GenerationStatus, ProviderError } from '../types';

/** Read env at call time, not module load time (Next.js SSR compatibility) */
function getNewApiUrl(): string {
  return process.env.NEW_API_URL || 'http://72.61.178.169:3001';
}

function getNewApiKey(): string {
  return process.env.NEW_API_KEY || '';
}

function getPostHeaders(apiKey?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey || getNewApiKey()}`,
  };
}

function getGetHeaders(apiKey?: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey || getNewApiKey()}`,
    'Accept': 'application/json',
  };
}

/**
 * Submit a media task (image/video/tts/music) via POST /v1/video/generations
 */
export async function submitTask(
  apiKey: string,
  body: {
    model: string;
    prompt: string;
    image?: string;
    size?: string;
    duration?: number;
    metadata?: Record<string, any>;
  }
): Promise<{ taskId: string }> {
  const url = `${getNewApiUrl()}/v1/video/generations`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getPostHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ProviderError(
      error.message || error.error?.message || `New API submit failed (${response.status})`,
      'API_ERROR',
      'newapi',
      { status: response.status, error }
    );
  }

  const result = await response.json();

  // Response format: {id, task_id, object, model, status, progress, created_at}
  const taskId = result.task_id || result.id;
  if (!taskId) {
    throw new ProviderError(
      'No task ID returned from New API',
      'INVALID_RESPONSE',
      'newapi',
      result
    );
  }

  return { taskId };
}

/**
 * Poll task status via GET /v1/video/generations/:task_id
 * Response format: {code, data: {status, result_url, progress, ...}}
 */
export async function pollTaskStatus(
  apiKey: string,
  taskId: string
): Promise<{ status: GenerationStatus; progress: number; resultUrl?: string; rawData?: any }> {
  const url = `${getNewApiUrl()}/v1/video/generations/${encodeURIComponent(taskId)}`;

  const response = await fetch(url, {
    headers: getGetHeaders(apiKey),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ProviderError(
      `New API poll failed (${response.status}): ${error.message || 'Unknown error'}`,
      'API_ERROR',
      'newapi',
      { status: response.status, error }
    );
  }

  const result = await response.json().catch(() => null);
  if (!result) {
    throw new ProviderError(
      'Invalid JSON response from New API poll',
      'INVALID_RESPONSE',
      'newapi'
    );
  }

  const data = result.data || result;

  const status = mapNewApiStatus(data.status);
  const progress = data.progress || (status === 'complete' ? 100 : 0);

  return {
    status,
    progress,
    resultUrl: data.result_url || data.resultUrl,
    rawData: data,
  };
}

/**
 * Get the result URL for a completed task
 */
export async function getTaskResult(
  apiKey: string,
  taskId: string
): Promise<string> {
  const pollResult = await pollTaskStatus(apiKey, taskId);

  if (pollResult.status !== 'complete') {
    throw new ProviderError(
      `Task not complete (status: ${pollResult.status})`,
      'TASK_NOT_COMPLETE',
      'newapi'
    );
  }

  if (!pollResult.resultUrl) {
    throw new ProviderError(
      'No result URL in completed task',
      'NO_RESULT',
      'newapi',
      pollResult.rawData
    );
  }

  return pollResult.resultUrl;
}

/**
 * Make an LLM chat completion request (synchronous)
 */
export async function chatCompletion(
  apiKey: string,
  body: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    [key: string]: any;
  }
): Promise<any> {
  const url = `${getNewApiUrl()}/v1/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getPostHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ProviderError(
      error.message || error.error?.message || `New API chat failed (${response.status})`,
      'API_ERROR',
      'newapi',
      { status: response.status, error }
    );
  }

  return response.json();
}

/**
 * Map New API status strings to Artflowly's GenerationStatus
 */
function mapNewApiStatus(status: string): GenerationStatus {
  if (!status) return 'pending';

  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'SUCCESS':
    case 'COMPLETED':
    case 'COMPLETE':
      return 'complete';
    case 'IN_PROGRESS':
    case 'PROCESSING':
    case 'GENERATING':
      return 'processing';
    case 'FAILURE':
    case 'FAILED':
    case 'ERROR':
      return 'error';
    case 'QUEUED':
    case 'PENDING':
    case 'WAITING':
      return 'pending';
    case 'CANCELLED':
    case 'CANCELED':
      return 'cancelled';
    default:
      return 'processing';
  }
}

/**
 * Default models for each generation type when using New API
 */
export const NEW_API_DEFAULT_MODELS: Record<string, string> = {
  llm: 'gemini-2.5-pro',
  image: 'gpt-4o-image',
  video: 'veo3_fast',
  tts: 'elevenlabs-tts',
  music: 'suno-v4.5',
};
