import { Navigate } from 'react-router-dom'
import { questionnairePath, scenarioPath } from '../config/routes'
import {
  getCurrentScenario,
  hasStudyAccess,
  studySessionKeys,
} from '../services/studySession'
import './EndPage.css'

function sessionFlagIsSet(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

export function EndPage() {
  if (!hasStudyAccess()) {
    return <Navigate to="/" replace />
  }

  if (!sessionFlagIsSet(studySessionKeys.studyCompleted)) {
    return sessionFlagIsSet(studySessionKeys.questionnairesCompleted) ? (
      <Navigate to={scenarioPath(getCurrentScenario())} replace />
    ) : (
      <Navigate to={questionnairePath(1)} replace />
    )
  }

  return (
    <main className="end-page" aria-labelledby="end-title">
      <header className="end-page__header">A SETH LAB STUDY</header>

      <section className="end-page__hero">
        <img
          className="end-page__logo"
          src="./assets/seth-lab-logo.png"
          alt="SETH LAB"
          width="100"
          height="100"
        />
        <span className="end-page__spacer" aria-hidden="true" />
        <h1 id="end-title">Thank you</h1>
        <h2>Your responses have been recorded</h2>
        <p className="end-page__message">
          You've completed every scenario in this study. Your ratings will help
          us understand how people experience empathy from AI virtual agents.
          We're grateful for your time and thoughtfulness.
        </p>
        <div className="end-page__summary" aria-label="Study completion summary">
          <span>✓&nbsp; 4 / 4 SCENARIOS</span>
          <span>✓&nbsp; 20 RESPONSES RATED</span>
        </div>
        <p className="end-page__close-note">
          You may now close this window. If a researcher is with you, please let
          them know you have finished.
        </p>
      </section>
    </main>
  )
}
