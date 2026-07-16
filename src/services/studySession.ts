const sessionPrefix = 'empathetic-llms-study:'

export const studySessionKeys = {
  questionnaireAnswers: `${sessionPrefix}questionnaire-answers:session`,
  questionnairesCompleted: `${sessionPrefix}questionnaires-completed`,
  currentScenario: `${sessionPrefix}current-scenario`,
  unlockedResponse: `${sessionPrefix}unlocked-response`,
  scenarioPrompts: `${sessionPrefix}scenario-prompts`,
  rateDrafts: `${sessionPrefix}rate-drafts`,
  studyCompleted: `${sessionPrefix}study-completed`,
} as const

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
