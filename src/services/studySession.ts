const sessionPrefix = 'empathetic-llms-study:'

export const studySessionKeys = {
  accessMode: `${sessionPrefix}access-mode`,
  backendSessionId: `${sessionPrefix}backend-session-id`,
  sessionToken: `${sessionPrefix}session-token`,
  studyVersion: `${sessionPrefix}study-version`,
  scenarioOrder: `${sessionPrefix}scenario-order`,
  responseOrders: `${sessionPrefix}response-orders`,
  questionnaireAnswers: `${sessionPrefix}questionnaire-answers:session`,
  questionnairesCompleted: `${sessionPrefix}questionnaires-completed`,
  currentScenario: `${sessionPrefix}current-scenario`,
  unlockedResponse: `${sessionPrefix}unlocked-response`,
  scenarioPrompts: `${sessionPrefix}scenario-prompts`,
  rateDrafts: `${sessionPrefix}rate-drafts`,
  studyCompleted: `${sessionPrefix}study-completed`,
} as const

export type StudyAccessMode = 'participant' | 'researcher'

export type StudySessionBootstrap = {
  sessionId: string
  sessionToken: string
  accessMode: StudyAccessMode
  studyVersion: string
  scenarioOrder: string[]
  responseOrders: Record<string, string[]>
}

export function setStudyAccessMode(mode: StudyAccessMode): void {
  try {
    sessionStorage.setItem(studySessionKeys.accessMode, mode)
  } catch {
    // Access cannot persist if browser storage is unavailable.
  }
}

export function initializeStudySession(session: StudySessionBootstrap): void {
  clearStudySession()
  setStudyAccessMode(session.accessMode)
  try {
    sessionStorage.setItem(studySessionKeys.backendSessionId, session.sessionId)
    sessionStorage.setItem(studySessionKeys.sessionToken, session.sessionToken)
    sessionStorage.setItem(studySessionKeys.studyVersion, session.studyVersion)
    sessionStorage.setItem(
      studySessionKeys.scenarioOrder,
      JSON.stringify(session.scenarioOrder),
    )
    sessionStorage.setItem(
      studySessionKeys.responseOrders,
      JSON.stringify(session.responseOrders),
    )
  } catch {
    // The route guard will return to the home page if storage is unavailable.
  }
}

export function hasStudyAccess(): boolean {
  try {
    const accessMode = sessionStorage.getItem(studySessionKeys.accessMode)
    return (
      (accessMode === 'participant' || accessMode === 'researcher') &&
      Boolean(sessionStorage.getItem(studySessionKeys.backendSessionId)) &&
      Boolean(sessionStorage.getItem(studySessionKeys.sessionToken))
    )
  } catch {
    return false
  }
}

export function getBackendSession(): {
  sessionId: string
  sessionToken: string
} | null {
  try {
    const sessionId = sessionStorage.getItem(studySessionKeys.backendSessionId)
    const sessionToken = sessionStorage.getItem(studySessionKeys.sessionToken)
    return sessionId && sessionToken ? { sessionId, sessionToken } : null
  } catch {
    return null
  }
}

export function getScenarioOrder(): string[] {
  return readSessionJson<string[]>(studySessionKeys.scenarioOrder, [])
}

export function getResponseOrders(): Record<string, string[]> {
  return readSessionJson<Record<string, string[]>>(
    studySessionKeys.responseOrders,
    {},
  )
}

export function isResearcherMode(): boolean {
  try {
    return sessionStorage.getItem(studySessionKeys.accessMode) === 'researcher'
  } catch {
    return false
  }
}

export function readSessionJson<T>(key: string, fallback: T): T {
  try {
    const storedValue = sessionStorage.getItem(key)
    return storedValue ? (JSON.parse(storedValue) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeSessionJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // The study remains usable if browser storage is unavailable.
  }
}

export function getCurrentScenario(): number {
  try {
    const storedScenario = Number(
      sessionStorage.getItem(studySessionKeys.currentScenario),
    )
    return Number.isInteger(storedScenario) && storedScenario >= 1
      ? storedScenario
      : 1
  } catch {
    return 1
  }
}

export function getUnlockedResponse(): number {
  try {
    const storedResponse = Number(
      sessionStorage.getItem(studySessionKeys.unlockedResponse),
    )
    return Number.isInteger(storedResponse) && storedResponse >= 1
      ? storedResponse
      : 1
  } catch {
    return 1
  }
}

export function clearStudySession(): void {
  try {
    Object.values(studySessionKeys).forEach((key) =>
      sessionStorage.removeItem(key),
    )
  } catch {
    // There is nothing else to clear if browser storage is unavailable.
  }
}
