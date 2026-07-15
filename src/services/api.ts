import { surveyResponseSchema, type SurveyResponse } from '../domain/survey'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export async function submitSurvey(response: SurveyResponse): Promise<void> {
  const payload = surveyResponseSchema.parse(response)

  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }

  const result = await fetch(`${apiBaseUrl}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!result.ok) {
    throw new Error(`Survey submission failed with status ${result.status}`)
  }
}
