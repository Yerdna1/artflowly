import { describe, it, expect } from 'vitest'
import { prisma } from '@/test/setup'
import { createTestUser } from '@/test/factories/user'
import { createTestCredits } from '@/test/factories/credits'
import { createTestProject } from '@/test/factories/project'
import { createTestScenes } from '@/test/factories/scene'
import {
  spendCredits,
  checkBalance,
  COSTS
} from '@/lib/services/credits'

describe('Scene Generation Cost Tests', () => {
  describe('Credit Costs', () => {
    it('scene generation costs 2 credits per scene', () => {
      expect(COSTS.SCENE_GENERATION).toBe(2)
    })

    it('character generation costs 2 credits', () => {
      expect(COSTS.CHARACTER_GENERATION).toBe(2)
    })
  })

  describe('Scene Generation - spendCredits', () => {
    it('deducts 2 credits for single scene generation', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      const result = await spendCredits(
        user.id,
        COSTS.SCENE_GENERATION,
        'scene',
        'Scene generation',
        project.id,
        'openrouter',
        undefined,
        0.01 // ~$0.01 for LLM call
      )

      expect(result.success).toBe(true)
      expect(result.balance).toBe(98)

      // Verify transaction was created
      const transaction = await prisma.creditTransaction.findFirst({
        where: {
          credits: { userId: user.id },
          type: 'scene'
        }
      })
      expect(transaction).toBeDefined()
      expect(transaction?.amount).toBe(-2)
      expect(transaction?.provider).toBe('openrouter')
    })

    it('deducts credits for claude-sdk provider (free tier)', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      const result = await spendCredits(
        user.id,
        COSTS.SCENE_GENERATION,
        'scene',
        'Scene generation (Claude SDK)',
        project.id,
        'claude-sdk',
        undefined,
        0 // Free with Claude Pro/Max
      )

      expect(result.success).toBe(true)
      expect(result.balance).toBe(98)

      const transaction = await prisma.creditTransaction.findFirst({
        where: { type: 'scene' }
      })
      expect(transaction?.provider).toBe('claude-sdk')
      expect(transaction?.realCost).toBe(0)
    })

    it('deducts credits for gemini provider', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      const result = await spendCredits(
        user.id,
        COSTS.SCENE_GENERATION,
        'scene',
        'Scene generation (Gemini)',
        project.id,
        'gemini',
        undefined,
        0.005
      )

      expect(result.success).toBe(true)
      expect(result.balance).toBe(98)

      const transaction = await prisma.creditTransaction.findFirst({
        where: { type: 'scene' }
      })
      expect(transaction?.provider).toBe('gemini')
    })

    it('returns error for insufficient credits', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 1 })

      const result = await spendCredits(
        user.id,
        COSTS.SCENE_GENERATION,
        'scene',
        'Scene gen'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient credits')
    })

    it('associates transaction with project', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      await spendCredits(
        user.id,
        COSTS.SCENE_GENERATION,
        'scene',
        'Scene for project',
        project.id,
        'openrouter'
      )

      const transaction = await prisma.creditTransaction.findFirst({
        where: { projectId: project.id, type: 'scene' }
      })
      expect(transaction).toBeDefined()
      expect(transaction?.projectId).toBe(project.id)
    })
  })

  describe('Batch Scene Generation', () => {
    it('deducts correct total for batch of 30 scenes', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      // Simulate batch generation (30 scenes = 60 credits)
      const sceneCount = 30
      const totalCost = COSTS.SCENE_GENERATION * sceneCount

      const result = await spendCredits(
        user.id,
        totalCost,
        'scene',
        `Batch scene generation (${sceneCount} scenes)`,
        project.id,
        'openrouter'
      )

      expect(result.success).toBe(true)
      expect(result.balance).toBe(100 - 60) // 40
    })

    it('creates individual transactions for each scene in batch', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      // Simulate individual scene deductions
      for (let i = 0; i < 5; i++) {
        await spendCredits(
          user.id,
          COSTS.SCENE_GENERATION,
          'scene',
          `Scene ${i + 1}`,
          project.id,
          'openrouter'
        )
      }

      const transactions = await prisma.creditTransaction.count({
        where: {
          credits: { userId: user.id },
          type: 'scene'
        }
      })
      expect(transactions).toBe(5)

      const credits = await prisma.credits.findFirst({ where: { userId: user.id } })
      expect(credits?.balance).toBe(90) // 100 - 10
    })

    it('handles partial batch success when credits run out', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 7 }) // Only enough for 3 scenes
      const project = await createTestProject(user.id)

      let successCount = 0
      for (let i = 0; i < 5; i++) {
        const result = await spendCredits(
          user.id,
          COSTS.SCENE_GENERATION,
          'scene',
          `Scene ${i + 1}`,
          project.id,
          'openrouter'
        )
        if (result.success) successCount++
      }

      expect(successCount).toBe(3)

      const credits = await prisma.credits.findFirst({ where: { userId: user.id } })
      expect(credits?.balance).toBe(1) // 7 - 6
    })
  })

  describe('Character Generation', () => {
    it('deducts 2 credits for character generation', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      const result = await spendCredits(
        user.id,
        COSTS.CHARACTER_GENERATION,
        'character',
        'Character generation',
        project.id,
        'openrouter'
      )

      expect(result.success).toBe(true)
      expect(result.balance).toBe(98)

      const transaction = await prisma.creditTransaction.findFirst({
        where: { type: 'character' }
      })
      expect(transaction).toBeDefined()
      expect(transaction?.amount).toBe(-2)
    })

    it('deducts credits for multiple characters', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      // Generate 4 characters
      for (let i = 0; i < 4; i++) {
        await spendCredits(
          user.id,
          COSTS.CHARACTER_GENERATION,
          'character',
          `Character ${i + 1}`,
          project.id,
          'openrouter'
        )
      }

      const credits = await prisma.credits.findFirst({ where: { userId: user.id } })
      expect(credits?.balance).toBe(92) // 100 - 8
    })
  })

  describe('Scene Regeneration', () => {
    it('marks regeneration in metadata', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)
      const scenes = await createTestScenes(project.id, 1)

      await spendCredits(
        user.id,
        COSTS.SCENE_GENERATION,
        'scene',
        'Scene regeneration',
        project.id,
        'openrouter',
        { isRegeneration: true, sceneId: scenes[0].id }
      )

      const transaction = await prisma.creditTransaction.findFirst({
        where: { type: 'scene' }
      })
      expect(transaction?.metadata).toEqual(expect.objectContaining({
        isRegeneration: true,
        sceneId: scenes[0].id
      }))
    })
  })

  describe('checkBalance - Pre-generation Validation', () => {
    it('validates balance for single scene', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 5 })

      const result = await checkBalance(user.id, COSTS.SCENE_GENERATION)

      expect(result.hasEnough).toBe(true)
      expect(result.balance).toBe(5)
      expect(result.required).toBe(2)
    })

    it('validates balance for batch generation', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 50 })

      const batchCost = COSTS.SCENE_GENERATION * 30 // 60 credits for 30 scenes

      const result = await checkBalance(user.id, batchCost)

      expect(result.hasEnough).toBe(false)
      expect(result.balance).toBe(50)
      expect(result.required).toBe(60)
    })
  })

  describe('Transaction Type Validation', () => {
    it('transaction type is scene for scene generation', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      await spendCredits(
        user.id,
        COSTS.SCENE_GENERATION,
        'scene',
        'Test',
        project.id,
        'openrouter'
      )

      const transaction = await prisma.creditTransaction.findFirst({
        where: { credits: { userId: user.id } }
      })
      expect(transaction?.type).toBe('scene')
    })

    it('transaction type is character for character generation', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      await spendCredits(
        user.id,
        COSTS.CHARACTER_GENERATION,
        'character',
        'Test',
        project.id,
        'openrouter'
      )

      const transaction = await prisma.creditTransaction.findFirst({
        where: { credits: { userId: user.id } }
      })
      expect(transaction?.type).toBe('character')
    })
  })

  describe('Prompt Generation', () => {
    it('tracks prompt generation separately', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      // Prompt generation is also a scene-type operation
      await spendCredits(
        user.id,
        COSTS.SCENE_GENERATION,
        'scene',
        'Prompt generation',
        project.id,
        'openrouter',
        { isPromptGeneration: true }
      )

      const transaction = await prisma.creditTransaction.findFirst({
        where: { type: 'scene' }
      })
      expect(transaction?.metadata).toEqual(expect.objectContaining({ isPromptGeneration: true }))
    })
  })

  describe('Music Generation Costs', () => {
    it('music generation costs 10 credits', () => {
      expect(COSTS.MUSIC_GENERATION).toBe(10)
    })

    it('deducts 10 credits for music generation', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      const result = await spendCredits(
        user.id,
        COSTS.MUSIC_GENERATION,
        'music',
        'Music generation',
        project.id,
        'piapi',
        undefined,
        0.05
      )

      expect(result.success).toBe(true)
      expect(result.balance).toBe(90)

      const transaction = await prisma.creditTransaction.findFirst({
        where: { type: 'music', credits: { userId: user.id } }
      })
      expect(transaction).toBeDefined()
      expect(transaction?.amount).toBe(-10)
      expect(transaction?.provider).toBe('piapi')
    })

    it('fails when insufficient credits for music', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 5 })

      const result = await spendCredits(
        user.id,
        COSTS.MUSIC_GENERATION,
        'music',
        'Music generation'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient')
    })
  })

  describe('Video Composition Costs', () => {
    it('video composition base costs 5 credits per scene', () => {
      expect(COSTS.VIDEO_COMPOSITION_BASE).toBe(5)
    })

    it('video composition music overlay costs 2 credits', () => {
      expect(COSTS.VIDEO_COMPOSITION_MUSIC).toBe(2)
    })

    it('video composition caption costs 1 credit per 10 captions', () => {
      expect(COSTS.VIDEO_COMPOSITION_CAPTION).toBe(1)
    })

    it('transition suggestion costs 1 credit', () => {
      expect(COSTS.TRANSITION_SUGGESTION).toBe(1)
    })

    it('calculates total composition cost for multi-scene project', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 200 })
      const project = await createTestProject(user.id)

      // Simulate 10-scene composition with music and captions
      const sceneCount = 10
      const captionGroups = 3 // 30 captions / 10 per group
      const totalCost = (COSTS.VIDEO_COMPOSITION_BASE * sceneCount) +
        COSTS.VIDEO_COMPOSITION_MUSIC +
        (COSTS.VIDEO_COMPOSITION_CAPTION * captionGroups) +
        COSTS.TRANSITION_SUGGESTION

      const result = await spendCredits(
        user.id,
        totalCost,
        'video',
        `Video composition (${sceneCount} scenes)`,
        project.id
      )

      expect(result.success).toBe(true)
      expect(totalCost).toBe(56) // 50 + 2 + 3 + 1
      expect(result.balance).toBe(200 - 56)
    })
  })

  describe('Image Resolution Costs', () => {
    it('1K and 2K images cost 27 credits', () => {
      expect(COSTS.IMAGE_GENERATION_1K).toBe(27)
      expect(COSTS.IMAGE_GENERATION_2K).toBe(27)
      expect(COSTS.IMAGE_GENERATION).toBe(27) // default
    })

    it('4K images cost 48 credits', () => {
      expect(COSTS.IMAGE_GENERATION_4K).toBe(48)
    })

    it('deducts correct cost for 4K image generation', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })
      const project = await createTestProject(user.id)

      const result = await spendCredits(
        user.id,
        COSTS.IMAGE_GENERATION_4K,
        'image',
        '4K image generation',
        project.id,
        'gemini'
      )

      expect(result.success).toBe(true)
      expect(result.balance).toBe(52) // 100 - 48
    })
  })

  describe('Provider Tracking', () => {
    it('tracks openrouter provider', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })

      await spendCredits(
        user.id,
        COSTS.SCENE_GENERATION,
        'scene',
        'OpenRouter scene',
        undefined,
        'openrouter',
        undefined,
        0.01
      )

      const transaction = await prisma.creditTransaction.findFirst({
        where: { type: 'scene' }
      })
      expect(transaction?.provider).toBe('openrouter')
    })

    it('tracks claude-sdk provider (free)', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })

      await spendCredits(
        user.id,
        COSTS.SCENE_GENERATION,
        'scene',
        'Claude SDK scene (free)',
        undefined,
        'claude-sdk',
        undefined,
        0
      )

      const transaction = await prisma.creditTransaction.findFirst({
        where: { type: 'scene' }
      })
      expect(transaction?.provider).toBe('claude-sdk')
      expect(transaction?.realCost).toBe(0)
    })

    it('tracks gemini provider', async () => {
      const user = await createTestUser()
      await createTestCredits(user.id, { balance: 100 })

      await spendCredits(
        user.id,
        COSTS.SCENE_GENERATION,
        'scene',
        'Gemini scene',
        undefined,
        'gemini',
        undefined,
        0.005
      )

      const transaction = await prisma.creditTransaction.findFirst({
        where: { type: 'scene' }
      })
      expect(transaction?.provider).toBe('gemini')
    })
  })
})
