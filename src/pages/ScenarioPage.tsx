import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { scenarioCount, scenarios } from '../data/scenarios'
import { questionnairePath, ratePath, routes, scenarioPath } from '../config/routes'
import {
  clearStudySession,
  getCurrentScenario,
  readSessionJson,
  studySessionKeys,
  writeSessionJson,
} from '../services/studySession'
import './ScenarioPage.css'

type ScenarioPrompts = Record<string, string>

function questionnairesAreComplete(): boolean {
  try {
    return (
      sessionStorage.getItem(studySessionKeys.questionnairesCompleted) ===
      'true'
    )
  } catch {
    return false
  }
}

export function ScenarioPage() {
  const navigate = useNavigate()
  const { scenarioNumber } = useParams()
  const requestedScenarioNumber = Number(scenarioNumber)
  const currentScenarioNumber = getCurrentScenario()
  const scenario = scenarios.find(
    ({ number }) => number === requestedScenarioNumber,
  )
  const [prompts, setPrompts] = useState<ScenarioPrompts>(() =>
    readSessionJson(studySessionKeys.scenarioPrompts, {}),
  )

  useEffect(() => {
    writeSessionJson(studySessionKeys.scenarioPrompts, prompts)
  }, [prompts])

  if (!questionnairesAreComplete()) {
    return <Navigate to={questionnairePath(1)} replace />
  }

  if (!scenario || requestedScenarioNumber !== currentScenarioNumber) {
    return <Navigate to={scenarioPath(currentScenarioNumber)} replace />
  }

  const promptKey = `scenario-${scenario.number}`
  const prompt = prompts[promptKey] ?? ''
  const canContinue = prompt.trim().length > 0
  const completedStepCount = 3 + scenario.number

  const exitStudy = () => {
    clearStudySession()
    navigate(routes.home, { replace: true })
  }

  const continueToResponses = () => {
    if (!canContinue) return
    try {
      sessionStorage.setItem(studySessionKeys.unlockedResponse, '1')
    } catch {
      // Navigation still works if browser storage is unavailable.
    }
    navigate(ratePath(scenario.number, 1), { replace: true })
  }

  return (
    <main className="scenario-page">
      <header className="scenario-header">
        <div className="scenario-header__bar">
          <Link
            className="scenario-header__brand"
            to={routes.home}
            aria-label="SETH LAB home"
          >
            <img
              className="scenario-header__logo"
              src="./assets/seth-lab-logo.png"
              alt=""
              width="32"
              height="32"
            />
            <span>SETH LAB</span>
          </Link>

          <p className="scenario-header__position">
            SCENARIO {scenario.number} OF {scenarioCount}
          </p>

          <button className="scenario-header__exit" type="button" onClick={exitStudy}>
            Exit&nbsp; ↗
          </button>
        </div>

        <ol
          className="scenario-progress"
          aria-label={`Study progress: step ${completedStepCount} of 7`}
        >
          {Array.from({ length: 7 }, (_, index) => (
            <li
              key={index}
              className={index < completedStepCount ? 'is-reached' : undefined}
              aria-current={index + 1 === completedStepCount ? 'step' : undefined}
            >
              <span className="visually-hidden">Step {index + 1}</span>
            </li>
          ))}
        </ol>
      </header>

      <section className="scenario-content" aria-labelledby="scenario-title">
        <p className="scenario-content__eyebrow">
          SCENARIO {scenario.number} OF {scenarioCount}
        </p>
        <h1 id="scenario-title">{scenario.title}</h1>
        <p className="scenario-content__instruction">
          Read the scenario below and imagine yourself in this situation.
        </p>
        <div className="scenario-card">
          <p>{scenario.content}</p>
        </div>
      </section>

      <section className="scenario-prompt" aria-labelledby="scenario-prompt-instruction">
        <p id="scenario-prompt-instruction">
          Please write the prompt as you normally would.
        </p>
        <div className="scenario-prompt__bar">
          <input
            type="text"
            value={prompt}
            onChange={(event) =>
              setPrompts((currentPrompts) => ({
                ...currentPrompts,
                [promptKey]: event.target.value,
              }))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') continueToResponses()
            }}
            placeholder="Message the virtual agent…"
            aria-label={`Your message for scenario ${scenario.number}`}
          />
          <button
            type="button"
            onClick={continueToResponses}
            disabled={!canContinue}
            aria-label="Continue to response rating"
          >
            ↑
          </button>
        </div>
      </section>

      <footer className="scenario-footer">
        <button
          className="scenario-response-button"
          type="button"
          onClick={continueToResponses}
          disabled={!canContinue}
        >
          Response&nbsp; →
        </button>
      </footer>
    </main>
  )
}
