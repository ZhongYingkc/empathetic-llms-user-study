import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from '../config/routes'
import { createStudySession, StudyApiError } from '../services/studyApi'
import { initializeStudySession } from '../services/studySession'
import './HomePage.css'

const studyDetails = ['≈ 20–30 MINUTES', '4 SCENARIOS', 'ANONYMOUS']
const turnstileSiteKey =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '0x4AAAAAAD3XDROrQZpCr3BD'

export function HomePage() {
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [accessError, setAccessError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const turnstileContainerRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    const renderWidget = () => {
      if (
        isCancelled ||
        !window.turnstile ||
        !turnstileContainerRef.current ||
        turnstileWidgetIdRef.current
      ) {
        return
      }
      turnstileWidgetIdRef.current = window.turnstile.render(
        turnstileContainerRef.current,
        {
          sitekey: turnstileSiteKey,
          theme: 'light',
          callback: setTurnstileToken,
          'expired-callback': () => setTurnstileToken(''),
          'error-callback': () => {
            setTurnstileToken('')
            setAccessError('Verification could not load. Please refresh and try again.')
          },
        },
      )
    }

    let script = document.querySelector<HTMLScriptElement>(
      'script[data-empathetic-study-turnstile]',
    )
    if (!script) {
      script = document.createElement('script')
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.empatheticStudyTurnstile = 'true'
      document.head.append(script)
    }
    script.addEventListener('load', renderWidget)
    renderWidget()

    return () => {
      isCancelled = true
      script?.removeEventListener('load', renderWidget)
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current)
        turnstileWidgetIdRef.current = null
      }
    }
  }, [])

  const startStudy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!turnstileToken) {
      setAccessError('Please complete the verification.')
      return
    }

    setIsStarting(true)
    setAccessError('')
    try {
      const session = await createStudySession(accessCode, turnstileToken)
      initializeStudySession(session)
      navigate(routes.questionnaire)
    } catch (error) {
      setAccessError(
        error instanceof StudyApiError
          ? error.message
          : 'Unable to start the study. Please try again.',
      )
      setTurnstileToken('')
      if (turnstileWidgetIdRef.current) {
        window.turnstile?.reset(turnstileWidgetIdRef.current)
      }
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <main className="home-page" aria-labelledby="home-title">
      <p className="home-page__study-label">A SETH LAB STUDY</p>

      <section className="home-page__content">
        <img
          className="home-page__logo"
          src="./assets/seth-lab-logo.png"
          alt="SETH LAB"
          width="104"
          height="97"
        />

        <h1 id="home-title">Welcome</h1>
        <h2>Sharing &amp; rating empathetic AI responses</h2>

        <p className="home-page__introduction">
          In this session you'll read a few everyday emotional situations, talk
          with an AI virtual agent, and rate how it responds. There are no right
          or wrong answers — we're interested in your honest experience.
        </p>

        <ul className="home-page__details" aria-label="Study details">
          {studyDetails.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>

        <form className="home-page__access" onSubmit={startStudy} noValidate>
          <label htmlFor="study-access-code">ACCESS CODE</label>
          <input
            id="study-access-code"
            type="text"
            value={accessCode}
            onChange={(event) => {
              setAccessCode(event.target.value)
              if (accessError) setAccessError('')
            }}
            placeholder="Enter your code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck="false"
            aria-describedby="study-access-error"
            aria-invalid={Boolean(accessError)}
          />
          <p id="study-access-error" className="home-page__access-error" role="alert">
            {accessError}
          </p>
          <div
            className="home-page__turnstile"
            ref={turnstileContainerRef}
            aria-label="Security verification"
          />
          <button
            className="home-page__start"
            type="submit"
            disabled={!accessCode.trim() || !turnstileToken || isStarting}
          >
            {isStarting ? 'Starting…' : 'Get started  →'}
          </button>
        </form>
      </section>

      <p className="home-page__privacy-note">
        Your responses are confidential and used only for research. You can
        take a break or stop at any time.
      </p>
    </main>
  )
}
