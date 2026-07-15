import { Link } from 'react-router-dom'
import { routes } from '../config/routes'
import './HomePage.css'

const studyDetails = ['≈ 20–30 MINUTES', '4 SCENARIOS', 'ANONYMOUS']

export function HomePage() {
  return (
    <main className="home-page" aria-labelledby="home-title">
      <p className="home-page__study-label">A SETH LAB STUDY</p>

      <section className="home-page__content">
        <img
          className="home-page__logo"
          src="./assets/seth-lab-logo.png"
          alt="SETH LAB"
          width="104"
          height="104"
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

        <Link className="home-page__start" to={routes.questionnaire}>
          Get started&nbsp;&nbsp;→
        </Link>
      </section>

      <p className="home-page__privacy-note">
        Your responses are confidential and used only for research. You can
        take a break or stop at any time.
      </p>
    </main>
  )
}
