import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { studyAccessCodes } from '../config/access'
import { routes } from '../config/routes'
import {
  clearStudySession,
  setStudyAccessMode,
  type StudyAccessMode,
} from '../services/studySession'
import './HomePage.css'

const studyDetails = ['≈ 20–30 MINUTES', '4 SCENARIOS', 'ANONYMOUS']

export function HomePage() {
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [accessError, setAccessError] = useState('')

  const startStudy = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedCode = accessCode.trim().toUpperCase()
    let accessMode: StudyAccessMode | null = null

    if (normalizedCode === studyAccessCodes.participant) {
      accessMode = 'participant'
    } else if (normalizedCode === studyAccessCodes.researcher) {
      accessMode = 'researcher'
    }

    if (!accessMode) {
      setAccessError('Please enter a valid access code.')
      return
    }

    clearStudySession()
    setStudyAccessMode(accessMode)
    navigate(routes.questionnaire)
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
          <button className="home-page__start" type="submit" disabled={!accessCode.trim()}>
            Get started&nbsp;&nbsp;→
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
