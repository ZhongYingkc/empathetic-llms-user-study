import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { questionnaireCount, questionnaires } from '../data/questionnaires'
import { questionnairePath, routes } from '../config/routes'
import './QuestionnairePage.css'

const legacyAnswerStorageKeys = [
  'empathetic-llms-study:questionnaire-answers',
  'empathetic-llms-study:questionnaire-answers:v2',
]
const answerStorageKey = 'empathetic-llms-study:questionnaire-answers:session'
const questionnaireFlowLockKey = 'empathetic-llms-study:questionnaires-completed'

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

  useEffect(() => {
    try {
      sessionStorage.setItem(answerStorageKey, JSON.stringify(answers))
    } catch {
      // The questionnaire remains usable if browser storage is unavailable.
    }
  }, [answers])

  if (isQuestionnaireFlowLocked()) {
    return <Navigate to={routes.scenarioIntroduction} replace />
  }

  if (!questionnaire) {
    return <Navigate to={questionnairePath(1)} replace />
  }

  const scaleValues = Array.from(
    { length: questionnaire.scaleMax },
    (_, index) => index + 1,
  )
  const scaleGrid = `minmax(0, 1fr) repeat(${questionnaire.scaleMax}, 54px)`
  const isQuestionnaireComplete = questionnaire.items.every(
    (item) => answers[item.id] !== undefined,
  )

  const goBack = () => {
    navigate(
      currentNumber === 1
        ? routes.home
        : questionnairePath(currentNumber - 1),
    )
  }

  const goForward = () => {
    if (!isQuestionnaireComplete) return

    if (currentNumber === questionnaireCount) {
      try {
        sessionStorage.setItem(questionnaireFlowLockKey, 'true')
      } catch {
        // Navigation still works if browser storage is unavailable.
      }
      navigate(routes.scenarioIntroduction, { replace: true })
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

          <Link className="questionnaire-header__exit" to={routes.home}>
            Exit&nbsp; ↗
          </Link>
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
            style={{ gridTemplateColumns: scaleGrid }}
            aria-hidden="true"
          >
            <span />
            {scaleValues.map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>

          <div className="rating-box__body">
            {questionnaire.items.map((item) => (
              <div
                className="likert-item"
                style={{ gridTemplateColumns: scaleGrid }}
                key={item.id}
              >
                <p id={`${item.id}-prompt`}>{item.prompt}</p>
                <div
                  className="likert-item__scale"
                  role="radiogroup"
                  aria-labelledby={`${item.id}-prompt`}
                  style={{
                    gridTemplateColumns: `repeat(${questionnaire.scaleMax}, 54px)`,
                  }}
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
        <button className="questionnaire-button questionnaire-button--back" type="button" onClick={goBack}>
          ←&nbsp; Back
        </button>
        <button
          className="questionnaire-button questionnaire-button--continue"
          type="button"
          onClick={goForward}
          disabled={!isQuestionnaireComplete}
        >
          {currentNumber === questionnaireCount ? 'Scenario' : 'Continue'}&nbsp; →
        </button>
      </footer>
    </main>
  )
}
