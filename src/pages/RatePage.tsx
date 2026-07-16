import { type CSSProperties, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ratingItems, responseCount } from '../data/rating'
import { scenarioCount, scenarios } from '../data/scenarios'
import { questionnairePath, ratePath, routes, scenarioPath } from '../config/routes'
import {
  clearStudySession,
  getCurrentScenario,
  getUnlockedResponse,
  hasStudyAccess,
  isResearcherMode,
  readSessionJson,
  studySessionKeys,
  writeSessionJson,
} from '../services/studySession'
import './RatePage.css'

type ResponseRatingDraft = {
  ratings: Record<string, number>
  reason: string
}

type RateDrafts = Record<string, ResponseRatingDraft>

const emptyDraft = (): ResponseRatingDraft => ({ ratings: {}, reason: '' })

function draftIsComplete(draft: ResponseRatingDraft | undefined): boolean {
  return Boolean(
    draft &&
      draft.reason.trim().length > 0 &&
      ratingItems.every((item) => draft.ratings[item.id] !== undefined),
  )
}

function sessionFlagIsSet(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

function writeSessionValue(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Navigation still works if browser storage is unavailable.
  }
}

export function RatePage() {
  const navigate = useNavigate()
  const { scenarioNumber, responseNumber } = useParams()
  const requestedScenarioNumber = Number(scenarioNumber)
  const requestedResponseNumber = Number(responseNumber)
  const currentScenarioNumber = getCurrentScenario()
  const unlockedResponse = Math.min(getUnlockedResponse(), responseCount)
  const scenario = scenarios.find(
    ({ number }) => number === requestedScenarioNumber,
  )
  const [rateDrafts, setRateDrafts] = useState<RateDrafts>(() =>
    readSessionJson(studySessionKeys.rateDrafts, {}),
  )

  useEffect(() => {
    writeSessionJson(studySessionKeys.rateDrafts, rateDrafts)
  }, [rateDrafts])

  if (!hasStudyAccess()) {
    return <Navigate to={routes.home} replace />
  }

  if (!sessionFlagIsSet(studySessionKeys.questionnairesCompleted)) {
    return <Navigate to={questionnairePath(1)} replace />
  }

  if (sessionFlagIsSet(studySessionKeys.studyCompleted)) {
    return <Navigate to={routes.end} replace />
  }

  if (!scenario || requestedScenarioNumber !== currentScenarioNumber) {
    return <Navigate to={scenarioPath(currentScenarioNumber)} replace />
  }

  if (
    !Number.isInteger(requestedResponseNumber) ||
    requestedResponseNumber < 1 ||
    requestedResponseNumber > unlockedResponse
  ) {
    return (
      <Navigate
        to={ratePath(currentScenarioNumber, unlockedResponse)}
        replace
      />
    )
  }

  const response = scenario.possibleResponses[requestedResponseNumber - 1]
  const draftKey = `scenario-${scenario.number}-response-${requestedResponseNumber}`
  const draft = rateDrafts[draftKey] ?? emptyDraft()
  const isCurrentResponseComplete = draftIsComplete(draft)
  const areAllResponsesComplete = Array.from(
    { length: responseCount },
    (_, index) =>
      rateDrafts[`scenario-${scenario.number}-response-${index + 1}`],
  ).every(draftIsComplete)
  const canGoForward =
    isResearcherMode() ||
    (requestedResponseNumber === responseCount
      ? areAllResponsesComplete
      : isCurrentResponseComplete)
  const completedStepCount = 3 + scenario.number

  const updateDraft = (
    update: (currentDraft: ResponseRatingDraft) => ResponseRatingDraft,
  ) => {
    setRateDrafts((currentDrafts) => ({
      ...currentDrafts,
      [draftKey]: update(currentDrafts[draftKey] ?? emptyDraft()),
    }))
  }

  const exitStudy = () => {
    clearStudySession()
    navigate(routes.home, { replace: true })
  }

  const goBack = () => {
    if (requestedResponseNumber > 1) {
      navigate(ratePath(scenario.number, requestedResponseNumber - 1))
    }
  }

  const goForward = () => {
    if (!canGoForward) return

    if (requestedResponseNumber < responseCount) {
      const nextResponse = requestedResponseNumber + 1
      writeSessionValue(
        studySessionKeys.unlockedResponse,
        String(Math.max(unlockedResponse, nextResponse)),
      )
      navigate(ratePath(scenario.number, nextResponse))
      return
    }

    if (scenario.number < scenarioCount) {
      const nextScenario = scenario.number + 1
      writeSessionValue(studySessionKeys.currentScenario, String(nextScenario))
      writeSessionValue(studySessionKeys.unlockedResponse, '1')
      navigate(scenarioPath(nextScenario), { replace: true })
      return
    }

    writeSessionValue(studySessionKeys.studyCompleted, 'true')
    navigate(routes.end, { replace: true })
  }

  return (
    <main className="rate-page">
      <header className="rate-header">
        <div className="rate-header__bar">
          <Link className="rate-header__brand" to={routes.home} aria-label="SETH LAB home">
            <img
              className="rate-header__logo"
              src="./assets/seth-lab-logo.png"
              alt=""
              width="32"
              height="32"
            />
            <span>SETH LAB</span>
          </Link>
          <p>SCENARIO {scenario.number} OF {scenarioCount}</p>
          <button type="button" onClick={exitStudy}>Exit&nbsp; ↗</button>
        </div>
        <ol
          className="rate-study-progress"
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

      <section className="rate-subheader" aria-labelledby="rate-scenario-title">
        <div className="rate-subheader__row">
          <div>
            <p>SCENARIO {scenario.number}</p>
            <h1 id="rate-scenario-title">{scenario.title}</h1>
          </div>
          <div className="rate-response-status">
            <p>RESPONSE {requestedResponseNumber} OF {responseCount}</p>
            <ol aria-label={`Response ${requestedResponseNumber} of ${responseCount}`}>
              {Array.from({ length: responseCount }, (_, index) => {
                const dotNumber = index + 1
                const dotDraft =
                  rateDrafts[
                    `scenario-${scenario.number}-response-${dotNumber}`
                  ]
                const isCurrent = dotNumber === requestedResponseNumber
                const isRated = draftIsComplete(dotDraft)
                return (
                  <li
                    key={dotNumber}
                    className={[
                      isRated || isCurrent ? 'is-reached' : '',
                      isCurrent ? 'is-current' : '',
                    ].filter(Boolean).join(' ')}
                    aria-current={dotNumber === requestedResponseNumber ? 'step' : undefined}
                  >
                    <span className="visually-hidden">Response {dotNumber}</span>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
        <p className="rate-subheader__instruction">
          Here is a possible prompt and 5 possible responses. Please rate how each response makes you feel.
        </p>
      </section>

      <section className="rate-content">
        <article className="conversation-box" aria-label="Possible conversation">
          <header>
            <div className="conversation-box__identity">
              <span aria-hidden="true">VA</span>
              <div>
                <strong>Virtual Agent</strong>
                <small>Conversation</small>
              </div>
            </div>
            <p><span aria-hidden="true" />CONNECTED</p>
          </header>
          <div className="conversation-box__messages">
            <div className="message message--user">
              <p>{scenario.possiblePrompt}</p>
            </div>
            <div className="message message--agent">
              <span aria-hidden="true">VA</span>
              <p>{response}</p>
            </div>
          </div>
        </article>

        <section className="rating-box-rate" aria-labelledby="rate-response-heading">
          <div className="rating-box-rate__heading">
            <h2 id="rate-response-heading">RATE RESPONSE</h2>
          </div>
          <div className="rating-box-rate__anchors" aria-hidden="true">
            <span>Strongly disagree</span>
            <span>Strongly agree</span>
          </div>
          <div className="rating-box-rate__items">
            {ratingItems.map((item) => {
              const rating = draft.ratings[item.id]
              const displayedValue = rating ?? (item.min + item.max) / 2
              const progress =
                ((displayedValue - item.min) / (item.max - item.min)) * 100
              return (
                <label className="rating-slider" key={item.id}>
                  <span>{item.prompt}</span>
                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    value={displayedValue}
                    data-unanswered={rating === undefined ? 'true' : undefined}
                    style={{ '--slider-progress': `${progress}%` } as CSSProperties}
                    onChange={(event) =>
                      updateDraft((currentDraft) => ({
                        ...currentDraft,
                        ratings: {
                          ...currentDraft.ratings,
                          [item.id]: Number(event.target.value),
                        },
                      }))
                    }
                    aria-label={item.prompt}
                    required
                  />
                </label>
              )
            })}
            <label className="rating-reason">
              <span className="visually-hidden">Reason for your ratings</span>
              <input
                type="text"
                value={draft.reason}
                onChange={(event) =>
                  updateDraft((currentDraft) => ({
                    ...currentDraft,
                    reason: event.target.value,
                  }))
                }
                placeholder="Please briefly explain your ratings"
                required
              />
            </label>
          </div>
        </section>
      </section>

      <footer className={`rate-footer ${requestedResponseNumber === 1 ? 'rate-footer--first' : ''}`}>
        {requestedResponseNumber > 1 && (
          <button className="rate-button rate-button--back" type="button" onClick={goBack}>
            ←&nbsp; Previous Response
          </button>
        )}
        <button
          className="rate-button rate-button--continue"
          type="button"
          onClick={goForward}
          disabled={!canGoForward}
        >
          {requestedResponseNumber === responseCount
            ? 'Submit Ratings →'
            : 'Next Response →'}
        </button>
      </footer>
    </main>
  )
}
