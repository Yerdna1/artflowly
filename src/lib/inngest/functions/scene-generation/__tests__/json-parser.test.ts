import { describe, it, expect } from 'vitest'
import { parseLLMResponse, validateScenes } from '../json-parser'

describe('JSON Parser - parseLLMResponse', () => {
  const validScenes = [
    { number: 1, title: 'Opening', textToImagePrompt: 'A dark forest', dialogue: [] },
    { number: 2, title: 'Climax', textToImagePrompt: 'A bright sky', dialogue: [] }
  ]

  it('parses clean JSON array', () => {
    const input = JSON.stringify(validScenes)
    const result = parseLLMResponse(input, 0)

    expect(result).toHaveLength(2)
    expect(result[0].number).toBe(1)
    expect(result[1].title).toBe('Climax')
  })

  it('strips markdown ```json code blocks', () => {
    const input = '```json\n' + JSON.stringify(validScenes) + '\n```'
    const result = parseLLMResponse(input, 0)

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Opening')
  })

  it('strips plain ``` code blocks', () => {
    const input = '```\n' + JSON.stringify(validScenes) + '\n```'
    const result = parseLLMResponse(input, 0)

    expect(result).toHaveLength(2)
  })

  it('extracts JSON array from surrounding text', () => {
    const input = 'Here are the scenes:\n' + JSON.stringify(validScenes) + '\nHope this helps!'
    const result = parseLLMResponse(input, 0)

    expect(result).toHaveLength(2)
  })

  it('fixes trailing commas in objects', () => {
    const input = '[{"number": 1, "title": "Scene 1",}, {"number": 2, "title": "Scene 2",}]'
    const result = parseLLMResponse(input, 0)

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Scene 1')
  })

  it('fixes trailing commas in arrays embedded in text', () => {
    // Trailing comma at array level only triggers Strategy 3 when embedded in surrounding text
    // (Strategy 1 direct parse fails, Strategy 2 regex match finds it, Strategy 2 parse fails, Strategy 3 fixes it)
    const input = 'Here are scenes: [{"number": 1, "title": "Scene 1",}, {"number": 2, "title": "Scene 2",}] done'
    const result = parseLLMResponse(input, 0)

    expect(result).toHaveLength(2)
  })

  it('handles whitespace around JSON', () => {
    const input = '  \n  ' + JSON.stringify(validScenes) + '  \n  '
    const result = parseLLMResponse(input, 0)

    expect(result).toHaveLength(2)
  })

  it('throws on completely invalid input', () => {
    expect(() => parseLLMResponse('not json at all', 0)).toThrow('No JSON array found')
  })

  it('throws on empty input', () => {
    expect(() => parseLLMResponse('', 0)).toThrow()
  })

  it('includes batch index in error message', () => {
    expect(() => parseLLMResponse('invalid', 2)).toThrow('batch 3')
  })

  it('parses scenes with dialogue arrays', () => {
    const scenes = [{
      number: 1,
      title: 'Dialogue Scene',
      dialogue: [
        { characterName: 'Alice', text: 'Hello!' },
        { characterName: 'Bob', text: 'Hi there!' }
      ]
    }]
    const result = parseLLMResponse(JSON.stringify(scenes), 0)

    expect(result[0].dialogue).toHaveLength(2)
    expect(result[0].dialogue![0].characterName).toBe('Alice')
    expect(result[0].dialogue![1].text).toBe('Hi there!')
  })

  it('handles control characters in response', () => {
    // Simulate LLM response with control chars embedded
    const jsonStr = JSON.stringify(validScenes)
    const withControlChars = 'Some preamble\x00\x01\n' + jsonStr + '\nDone'
    const result = parseLLMResponse(withControlChars, 0)

    expect(result).toHaveLength(2)
  })
})

describe('JSON Parser - validateScenes', () => {
  it('validates correct scene array', () => {
    const scenes = [
      { number: 1, title: 'Scene 1' },
      { number: 2, title: 'Scene 2' }
    ]

    expect(validateScenes(scenes, 2, 0)).toBe(true)
  })

  it('throws on non-array input', () => {
    expect(() => validateScenes('not an array', 2, 0)).toThrow('non-array')
  })

  it('throws on null input', () => {
    expect(() => validateScenes(null, 2, 0)).toThrow('non-array')
  })

  it('throws on object input', () => {
    expect(() => validateScenes({ scene: 1 }, 2, 0)).toThrow('non-array')
  })

  it('throws when fewer scenes than expected', () => {
    const scenes = [{ number: 1, title: 'Scene 1' }]

    expect(() => validateScenes(scenes, 3, 0)).toThrow('only 1 of 3')
  })

  it('passes when scenes match batch size', () => {
    const scenes = [
      { number: 1 },
      { number: 2 },
      { number: 3 }
    ]

    expect(validateScenes(scenes, 3, 0)).toBe(true)
  })

  it('passes when more scenes than expected', () => {
    const scenes = [
      { number: 1 },
      { number: 2 },
      { number: 3 },
      { number: 4 }
    ]

    expect(validateScenes(scenes, 3, 0)).toBe(true)
  })

  it('includes batch index in error messages', () => {
    expect(() => validateScenes('bad', 2, 4)).toThrow('Batch 5')
  })
})
