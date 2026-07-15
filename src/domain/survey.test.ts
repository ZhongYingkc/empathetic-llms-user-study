import { describe, expect, it } from 'vitest'
import { surveyResponseSchema } from './survey'

describe('surveyResponseSchema', () => {
  it('accepts a valid draft response', () => {
    const result = surveyResponseSchema.safeParse({
      surveyId: 'pre-study',
      answers: [{ questionId: 'q1', type: 'rating', value: 5 }],
      startedAt: '2026-07-15T20:00:00.000Z',
    })

    expect(result.success).toBe(true)
  })
})
