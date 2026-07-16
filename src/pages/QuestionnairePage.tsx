import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { questionnaireCount, questionnaires } from '../data/questionnaires'
import { questionnairePath, routes, scenarioPath } from '../config/routes'
import {
  clearStudySession,
  hasStudyAccess,
  isResearcherMode,
  studySessionKeys,
} from '../services/studySession'
import {
  abandonStudy,
  saveQuestionnaire,
  StudyApiError,
} from '../services/studyApi'
import './QuestionnairePage.css'

const legacyAnswerStorageKeys = [
  'empathetic-llms-study:questionnaire-answers',
  'empathetic-llms-study:questionnaire-answers:v2',
]
const answerStorageKey = studySessionKeys.questionnaireAnswers
const questionnaireFlowLockKey = studySessionKeys.questionnairesCompleted

type QuestionnaireAnswers = Record<string, number>

function loadAnswers(): QuestionnaireAnswers {
  try {
    legacyAnswerStorageKeys.forEach((key) => localStorage.removeItem(key))
    const storedAnswers = sessionStorage.getItem(answerStorageKey)
    if (!storedAnswers) return {}

    const parsedAnswers: unknown = JSON.parse(storedAnswers)
    return parsedAnswers && typeof parsedAnswers === 'object'
      ? (parsedAnswers as QuestionnaireAnswers)
      : {}
  } catch {
    return {}
  }
}

function isQuestionnaireFlowLocked(): boolean {
  try {
    return sessionStorage.getItem(questionnaireFlowLockKey) === 'true'
  } catch {
    return false
  }
}

export function QuestionnairePage() {
  const navigate = useNavigate()
  const { questionnaireNumber } = useParams()
  const currentNumber = Number(questionnaireNumber)
  const questionnaire = questionnaires.find(
    ({ number }) => number === currentNumber,
  )
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(loadAnswers)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    try {
      sessionStorage.setItem(answerStorageKey, JSON.stringify(answers))
    } catch {
      // The questionnaire remains usable if browser storage is unavailable.
    }
  }, [answers])

  if (!hasStudyAccess()) {
    return <Navigate to={routes.home} replace />
  }

  if (isQuestionnaireFlowLocked()) {
    return <Navigate to={scenarioPath(1)} replace />
  }

  if (!questionnaire) {
    return <Navigate to={questionnairePath(1)} replace />
  }

  const scaleValues = Array.from(
    { length: questionnaire.scaleMax },
    (_, index) => index + 1,
  )
  const scaleGrid = `repeat(${questionnaire.scaleMax}, 54px)`
  const isQuestionnaireComplete =
    isResearcherMode() ||
    questionnaire.items.every((item) => answers[item.id] !== undefined)

  const currentAnswers = Object.fromEntries(
    questionnaire.items.flatMap((item) =>
      answers[item.id] === undefined ? [] : [[item.id, answers[item.id]]],
    ),
  )

  const saveCurrentQuestionnaire = async () => {
    setIsSaving(true)
    setSaveError('')
    try {
      await saveQuestionnaire(`questionnaire-${currentNumber}`, currentAnswers)
      return true
    } catch (error) {
      setSaveError(
        error instanceof StudyApiError
          ? error.message
          : 'Unable to save your answers. Please try again.',
      )
      return false
    } finally {
      setIsSaving(false)
    }
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

  const goBack = async () => {
    if (currentNumber === 1) {
      await exitStudy()
      return
    }
    if (isQuestionnaireComplete && (await saveCurrentQuestionnaire())) {
      navigate(questionnairePath(currentNumber - 1))
    }
  }

  const goForward = async () => {
    if (!isQuestionnaireComplete) return
    if (!(await saveCurrentQuestionnaire())) return

    if (currentNumber === questionnaireCount) {
      try {
        sessionStorage.setItem(questionnaireFlowLockKey, 'true')
        sessionStorage.setItem(studySessionKeys.currentScenario, '1')
      } catch {
        // Navigation still works if browser storage is unavailable.
      }
      navigate(scenarioPath(1), { replace: true })
      return
    }

    navigate(
      questionnairePath(currentNumber + 1),
    )
  }

  return (
    <main className="questionnaire-page">
      <header className="questionnaire-header">
        <div className="questionnaire-header__bar">
          <Link
            className="questionnaire-header__brand"
            to={routes.home}
            aria-label="SETH LAB home"
          >
            <img
              className="questionnaire-header__logo"
              src="./assets/seth-lab-logo.png"
              alt=""
              width="32"
              height="32"
            />
            <span>SETH LAB</span>
          </Link>

          <p className="questionnaire-header__position">
            Questionnaire {currentNumber} OF {questionnaireCount}
          </p>

          <button className="questionnaire-header__exit" type="button" onClick={exitStudy}>
            Exit&nbsp; ↗
          </button>
        </div>

        <ol
          className="questionnaire-progress"
          aria-label={`Study progress: step ${currentNumber} of 7`}
        >
          {Array.from({ length: 7 }, (_, index) => (
            <li
              key={index}
              className={index < currentNumber ? 'is-reached' : undefined}
              aria-current={index + 1 === currentNumber ? 'step' : undefined}
            >
              <span className="visually-hidden">Step {index + 1}</span>
            </li>
          ))}
        </ol>
      </header>

      <section className="questionnaire-content" aria-labelledby="questionnaire-title">
        <p className="questionnaire-content__eyebrow">{questionnaire.eyebrow}</p>

        <div className="rating-box">
          <div className="rating-box__section-heading">
            <h1 id="questionnaire-title">{questionnaire.title}</h1>
            <p>
              1 = Strongly disagree&nbsp;&nbsp; · &nbsp;&nbsp;
              {questionnaire.scaleMax} = Strongly agree
            </p>
          </div>

          <div
            className="rating-box__scale-header"
            aria-hidden="true"
          >
            <span className="rating-box__scale-spacer" />
            <div
              className="rating-box__scale-numbers"
              style={{ gridTemplateColumns: scaleGrid }}
            >
              {scaleValues.map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
          </div>

          <div className="rating-box__body">
            {questionnaire.items.map((item) => (
              <div
                className="likert-item"
                key={item.id}
              >
                <p id={`${item.id}-prompt`}>{item.prompt}</p>
                <div
                  className="likert-item__scale"
                  role="radiogroup"
                  aria-labelledby={`${item.id}-prompt`}
                  style={{ gridTemplateColumns: scaleGrid }}
                >
                  {scaleValues.map((value) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name={item.id}
                        value={value}
                        checked={answers[item.id] === value}
                        onChange={() =>
                          setAnswers((currentAnswers) => ({
                            ...currentAnswers,
                            [item.id]: value,
                          }))
                        }
                      />
                      <span className="visually-hidden">
                        {value} out of {questionnaire.scaleMax}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="questionnaire-footer">
        {saveError && <p className="questionnaire-save-error" role="alert">{saveError}</p>}
        <button className="questionnaire-button questionnaire-button--back" type="button" onClick={goBack} disabled={isSaving}>
          ←&nbsp; Back
        </button>
        <button
          className="questionnaire-button questionnaire-button--continue"
          type="button"
          onClick={goForward}
          disabled={!isQuestionnaireComplete || isSaving}
        >
          {isSaving
            ? 'Saving…'
            : `${currentNumber === questionnaireCount ? 'Scenario' : 'Continue'}  →`}
        </button>
      </footer>
    </main>
  )
}
