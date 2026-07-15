import { z } from 'zod'

export const answerSchema = z.object({
  questionId: z.string().min(1),
  type: z.enum(['text', 'rating', 'single', 'multiple']),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
})

export const surveyResponseSchema = z.object({
  surveyId: z.string().min(1),
  participantId: z.string().optional(),
  answers: z.array(answerSchema),
  startedAt: z.iso.datetime(),
  submittedAt: z.iso.datetime().optional(),
})

export type SurveyAnswer = z.infer<typeof answerSchema>
export type SurveyResponse = z.infer<typeof surveyResponseSchema>
