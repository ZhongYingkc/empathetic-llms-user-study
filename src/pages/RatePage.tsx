import { type CSSProperties, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ratingItems, responseCount } from '../data/rating'
import { scenarioCount, scenarios } from '../data/scenarios'
import { questionnairePath, ratePath, routes, scenarioPath } from '../config/routes'
import {
  clearStudySession,
  getCurrentScenario,
  getResponseOrders,
  getScenarioOrder,
  getUnlockedResponse,
  hasStudyAccess,
  isResearcherMode,
  readSessionJson,
  studySessionKeys,
  writeSessionJson,
} from '../services/studySession'
import {
  abandonStudy,
  completeStudy,
  saveResponseRating,
  StudyApiError,
} from '../services/studyApi'
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
  const orderedScenarios = getScenarioOrder()
    .map((scenarioId) => scenarios.find(({ id }) => id === scenarioId))
    .filter((value) => value !== undefined)
  const scenario = orderedScenarios[requestedScenarioNumber - 1]
  const [rateDrafts, setRateDrafts] = useState<RateDrafts>(() =>
    readSessionJson(studySessionKeys.rateDrafts, {}),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

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

  if (orderedScenarios.length !== scenarioCount) {
    return <Navigate to={routes.home} replace />
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

  const responseOrder = getResponseOrders()[scenario.id] ?? []
  const orderedResponses = responseOrder
    .map((responseId) =>
      scenario.possibleResponses.find(({ id }) => id === responseId),
    )
    .filter((value) => value !== undefined)
  const response = orderedResponses[requestedResponseNumber - 1]
  if (!response || orderedResponses.length !== responseCount) {
    return <Navigate to={routes.home} replace />
  }

  const draftKey = `${scenario.id}:${response.id}`
  const draft = rateDrafts[draftKey] ?? emptyDraft()
  const isCurrentResponseComplete = draftIsComplete(draft)
  const areAllResponsesComplete = Array.from(
    { length: responseCount },
    (_, index) =>
      rateDrafts[
        `${scenario.id}:${orderedResponses[index]?.id ?? `missing-${index + 1}`}`
      ],
  ).every(draftIsComplete)
  const canGoForward =
    isResearcherMode() ||
    (requestedResponseNumber === responseCount
      ? areAllResponsesComplete
      : isCurrentResponseComplete)
  const canLeaveCurrentResponse =
    isResearcherMode() || isCurrentResponseComplete
  const completedStepCount = 3 + requestedScenarioNumber

  const updateDraft = (
    update: (currentDraft: ResponseRatingDraft) => ResponseRatingDraft,
  ) => {
    setRateDrafts((currentDrafts) => ({
      ...currentDrafts,
      [draftKey]: update(currentDrafts[draftKey] ?? emptyDraft()),
    }))
  }

  const exitStudy = async () => {
    try {
      await abandonStudy()
    } catch {
      // Returning home must remain possible if the network is unavailable.
    } finally {
      clearStudySession()
      navigate(routes.home, { replace: true })
    }
  }

  const goBack = () => {
    void saveAndNavigateBack()
  }

  const persistCurrentRating = async () => {
    setIsSaving(true)
    setSaveError('')
    try {
      await saveResponseRating({
        scenarioId: scenario.id,
        responseId: response.id,
        scenarioDisplayPosition: requestedScenarioNumber,
        responseDisplayPosition: requestedResponseNumber,
        contentVersion: response.contentVersion,
        ratings: draft.ratings,
        reason: draft.reason,
      })
      return true
    } catch (error) {
      setSaveError(
        error instanceof StudyApiError
          ? error.message
          : 'Unable to save your ratings. Please try again.',
      )
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function saveAndNavigateBack() {
    if (requestedResponseNumber <= 1 || !canLeaveCurrentResponse) return
    if (await persistCurrentRating()) {
      navigate(ratePath(requestedScenarioNumber, requestedResponseNumber - 1))
    }
  }

  const goForward = async () => {
    if (!canGoForward) return
    if (!(await persistCurrentRating())) return

    if (requestedResponseNumber < responseCount) {
      const nextResponse = requestedResponseNumber + 1
      writeSessionValue(
        studySessionKeys.unlockedResponse,
        String(Math.max(unlockedResponse, nextResponse)),
      )
      navigate(ratePath(requestedScenarioNumber, nextResponse))
      return
    }

    if (requestedScenarioNumber < scenarioCount) {
      const nextScenario = requestedScenarioNumber + 1
      writeSessionValue(studySessionKeys.currentScenario, String(nextScenario))
      writeSessionValue(studySessionKeys.unlockedResponse, '1')
      navigate(scenarioPath(nextScenario), { replace: true })
      return
    }

    setIsSaving(true)
    try {
      await completeStudy()
      writeSessionValue(studySessionKeys.studyCompleted, 'true')
      navigate(routes.end, { replace: true })
    } catch (error) {
      setSaveError(
        error instanceof StudyApiError
          ? error.message
          : 'Unable to submit the study. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
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
          <p>SCENARIO {requestedScenarioNumber} OF {scenarioCount}</p>
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
            <p>SCENARIO {requestedScenarioNumber}</p>
            <h1 id="rate-scenario-title">{scenario.title}</h1>
          </div>
          <div className="rate-response-status">
            <p>RESPONSE {requestedResponseNumber} OF {responseCount}</p>
            <ol aria-label={`Response ${requestedResponseNumber} of ${responseCount}`}>
              {Array.from({ length: responseCount }, (_, index) => {
                const dotNumber = index + 1
                const dotDraft =
                  rateDrafts[
                    `${scenario.id}:${orderedResponses[dotNumber - 1]?.id ?? `missing-${dotNumber}`}`
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
              <p>{response.text}</p>
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
        {saveError && <p className="rate-save-error" role="alert">{saveError}</p>}
        {requestedResponseNumber > 1 && (
          <button className="rate-button rate-button--back" type="button" onClick={goBack} disabled={!canLeaveCurrentResponse || isSaving}>
            ←&nbsp; Previous Response
          </button>
        )}
        <button
          className="rate-button rate-button--continue"
          type="button"
          onClick={goForward}
          disabled={!canGoForward || isSaving}
        >
          {isSaving
            ? 'Saving…'
            : requestedResponseNumber === responseCount
              ? 'Submit Ratings →'
              : 'Next Response →'}
        </button>
      </footer>
    </main>
  )
}
