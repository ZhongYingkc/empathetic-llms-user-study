import type { StudySessionBootstrap } from './studySession'
import { getBackendSession } from './studySession'

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ??
  'https://empathetic-study-api.zhongyingkc.workers.dev'
).replace(/\/$/u, '')

const requestTimeoutMs = 15_000

type ApiErrorBody = {
  error?: string
}

export class StudyApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'StudyApiError'
    this.status = status
  }
}

async function apiRequest<T>(
  path: string,
  init: RequestInit,
  authenticated = true,
): Promise<T> {
  const session = authenticated ? getBackendSession() : null
  if (authenticated && !session) {
    throw new StudyApiError('Your study session has expired.', 401)
  }

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), requestTimeoutMs)

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      signal: abortController.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(session
          ? { Authorization: `Bearer ${session.sessionToken}` }
          : {}),
        ...init.headers,
      },
    })

    const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody
    if (!response.ok) {
      throw new StudyApiError(
        body.error ?? 'Unable to save your response. Please try again.',
        response.status,
      )
    }
    return body
  } catch (error) {
    if (error instanceof StudyApiError) throw error
    if (abortController.signal.aborted) {
      throw new StudyApiError(
        'The server did not respond in time. Check your connection and try again.',
        0,
      )
    }
    throw new StudyApiError(
      'Unable to reach the server. Check your connection and try again.',
      0,
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

export function createStudySession(
  accessCode: string,
  turnstileToken: string,
): Promise<StudySessionBootstrap> {
  return apiRequest<StudySessionBootstrap>(
    '/api/session',
    {
      method: 'POST',
      body: JSON.stringify({ accessCode, turnstileToken }),
    },
    false,
  )
}

export function saveQuestionnaire(
  questionnaireId: string,
  answers: Record<string, number>,
): Promise<{ saved: true }> {
  const session = getBackendSession()
  return apiRequest(`/api/sessions/${session?.sessionId}/questionnaires/${questionnaireId}`, {
    method: 'PUT',
    body: JSON.stringify({ answers }),
  })
}

export function saveScenarioPrompt(input: {
  scenarioId: string
  displayPosition: number
  prompt: string
}): Promise<{ saved: true }> {
  const session = getBackendSession()
  return apiRequest(
    `/api/sessions/${session?.sessionId}/scenarios/${input.scenarioId}/prompt`,
    {
      method: 'PUT',
      body: JSON.stringify({
        displayPosition: input.displayPosition,
        prompt: input.prompt,
      }),
    },
  )
}

export function saveResponseRating(input: {
  scenarioId: string
  responseId: string
  scenarioDisplayPosition: number
  responseDisplayPosition: number
  contentVersion: number
  ratings: Record<string, number>
  reason: string
}): Promise<{ saved: true }> {
  const session = getBackendSession()
  return apiRequest(
    `/api/sessions/${session?.sessionId}/scenarios/${input.scenarioId}/responses/${input.responseId}/rating`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )
}

export function completeStudy(): Promise<{ completed: true }> {
  const session = getBackendSession()
  return apiRequest(`/api/sessions/${session?.sessionId}/complete`, {
    method: 'POST',
  })
}

export function abandonStudy(): Promise<{ abandoned: true }> {
  const session = getBackendSession()
  return apiRequest(`/api/sessions/${session?.sessionId}`, {
    method: 'DELETE',
  })
}
