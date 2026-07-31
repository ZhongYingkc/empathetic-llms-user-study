import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStudySession, StudyApiError } from './studyApi'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('study API request timeout', () => {
  it('stops a stalled request and returns a retryable error', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        }),
      ),
    )

    const request = createStudySession('EAI', 'turnstile-token')
    const assertion = expect(request).rejects.toMatchObject({
      name: 'StudyApiError',
      status: 0,
      message:
        'The server did not respond in time. Check your connection and try again.',
    } satisfies Partial<StudyApiError>)

    await vi.advanceTimersByTimeAsync(15_000)
    await assertion
  })
})
