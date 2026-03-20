import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { unstable_cache } from 'next/cache';
// Valid model types
const VALID_MODEL_TYPES = ['image', 'video', 'tts', 'music', 'llm'] as const;
type ModelType = typeof VALID_MODEL_TYPES[number];

// Cache models for 5 minutes
const getCachedModels = unstable_cache(
  async (type: ModelType, providerId?: string) => {
    const models: Record<string, unknown>[] = [];

    // For KIE provider, use existing KIE-specific tables
    if (!providerId || providerId === 'kie') {
      switch (type) {
        case 'image':
          const kieImageModels = await prisma.kieImageModel.findMany({
            where: { isActive: true },
          });
          models.push(...kieImageModels.map(m => ({
            ...m,
            providerId: 'kie',
            displayName: m.name,
            apiModelId: m.apiModelId || m.modelId,
          })));
          break;
        case 'video':
          const kieVideoModels = await prisma.kieVideoModel.findMany({
            where: { isActive: true },
          });
          models.push(...kieVideoModels.map(m => ({
            ...m,
            providerId: 'kie',
            displayName: m.name,
            apiModelId: m.apiModelId || m.modelId,
          })));
          break;
        case 'tts':
          const kieTtsModels = await prisma.kieTtsModel.findMany({
            where: { isActive: true },
          });
          models.push(...kieTtsModels.map(m => ({
            ...m,
            providerId: 'kie',
            displayName: m.name,
            apiModelId: m.apiModelId || m.modelId,
          })));
          break;
        case 'music':
          const kieMusicModels = await prisma.kieMusicModel.findMany({
            where: { isActive: true },
          });
          models.push(...kieMusicModels.map(m => ({
            ...m,
            providerId: 'kie',
            displayName: m.name,
            apiModelId: m.apiModelId || m.modelId,
          })));
          break;
        case 'llm':
          const kieLlmModels = await prisma.kieLlmModel.findMany({
            where: { isActive: true },
          });
          models.push(...kieLlmModels.map(m => ({
            ...m,
            providerId: 'kie',
            displayName: m.name,
            apiModelId: m.apiModelId || m.modelId,
          })));
          break;
      }
    }

    // For non-KIE providers, use new generalized tables
    if (!providerId || providerId !== 'kie') {
      const nonKieWhere = providerId && providerId !== 'kie'
        ? { isActive: true, providerId }
        : { isActive: true, providerId: { not: 'kie' } };

      switch (type) {
        case 'image':
          const imageModels = await prisma.imageModel.findMany({
            where: nonKieWhere,
            include: { provider: true },
          });
          models.push(...imageModels);
          break;
        case 'video':
          const videoModels = await prisma.videoModel.findMany({
            where: nonKieWhere,
            include: { provider: true },
          });
          models.push(...videoModels);
          break;
        case 'tts':
          const ttsModels = await prisma.ttsModel.findMany({
            where: nonKieWhere,
            include: { provider: true },
          });
          models.push(...ttsModels);
          break;
        case 'music':
          const musicModels = await prisma.musicModel.findMany({
            where: nonKieWhere,
            include: { provider: true },
          });
          models.push(...musicModels);
          break;
        case 'llm':
          const llmModels = await prisma.llmModel.findMany({
            where: nonKieWhere,
            include: { provider: true },
          });
          models.push(...llmModels);
          break;
      }
    }

    return models;
  },
  ['models'],
  {
    revalidate: 1, // 1 second
    tags: ['models'],
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    // Get session to ensure user is authenticated
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await params;
    const modelType = type as ModelType;

    // Validate model type
    if (!VALID_MODEL_TYPES.includes(modelType)) {
      return NextResponse.json(
        { error: `Invalid model type. Must be one of: ${VALID_MODEL_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Get providerId from query params
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId') || undefined;

    // Get models from database
    const models = await getCachedModels(modelType, providerId);

    // Transform models to consistent format
    const transformedModels = models.map((model: Record<string, unknown>) => {
      const baseModel = {
        id: model.id,
        modelId: model.modelId,
        name: model.name,
        displayName: model.displayName || model.name,
        providerId: model.providerId || (model.provider as Record<string, unknown>)?.providerId || '',
        providerName: (model.provider as Record<string, unknown>)?.displayName || undefined,
        description: model.description,
        apiModelId: model.apiModelId || model.modelId,
        cost: model.cost,
        credits: model.credits || undefined,
      };

      // Type-safe field access with proper type guards
      if (modelType === 'image') {
        return {
          ...baseModel,
          qualityOptions: (model as Record<string, unknown>).qualityOptions,
          supportedAspectRatios: (model as Record<string, unknown>).supportedAspectRatios,
          supportedResolutions: (model as Record<string, unknown>).supportedResolutions,
          maxPromptLength: (model as Record<string, unknown>).maxPromptLength,
          maxImages: (model as Record<string, unknown>).maxImages,
        };
      }

      if (modelType === 'video') {
        return {
          ...baseModel,
          supportedResolutions: (model as Record<string, unknown>).supportedResolutions,
          supportedDurations: (model as Record<string, unknown>).supportedDurations,
          supportedAspectRatios: (model as Record<string, unknown>).supportedAspectRatios,
          defaultResolution: (model as Record<string, unknown>).defaultResolution,
          defaultDuration: (model as Record<string, unknown>).defaultDuration,
          defaultAspectRatio: (model as Record<string, unknown>).defaultAspectRatio,
        };
      }

      if (modelType === 'tts') {
        return {
          ...baseModel,
          supportedLanguages: 'languageList' in model ? (model as Record<string, unknown>).languageList : (model as Record<string, unknown>).supportedLanguages,
          voiceOptions: (model as Record<string, unknown>).voiceOptions,
          maxTextLength: (model as Record<string, unknown>).maxTextLength,
        };
      }

      if (modelType === 'music') {
        return {
          ...baseModel,
          durationOptions: (model as Record<string, unknown>).durationOptions,
          genreSupport: (model as Record<string, unknown>).genreSupport,
          maxDuration: (model as Record<string, unknown>).maxDuration,
        };
      }

      if (modelType === 'llm') {
        return {
          ...baseModel,
          contextWindow: (model as Record<string, unknown>).contextWindow,
          maxOutputTokens: (model as Record<string, unknown>).maxOutputTokens,
          capabilities: (model as Record<string, unknown>).capabilities,
        };
      }

      return baseModel;
    });

    return NextResponse.json(
      { models: transformedModels },
      {
        headers: {
          'Cache-Control': 'public, max-age=1, stale-while-revalidate=2',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}