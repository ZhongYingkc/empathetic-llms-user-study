import { surveyResponseSchema, type SurveyResponse } from '../domain/survey'

const draftKey = 'empathetic-llms-study:draft'

export function saveDraft(response: SurveyResponse): void {
  localStorage.setItem(draftKey, JSON.stringify(response))
}

export function loadDraft(): SurveyResponse | null {
  const storedDraft = localStorage.getItem(draftKey)
  if (!storedDraft) return null

  try {
    const result = surveyResponseSchema.safeParse(JSON.parse(storedDraft))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function clearDraft(): void {
  localStorage.removeItem(draftKey)
}
