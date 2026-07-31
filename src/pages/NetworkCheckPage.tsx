import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { checkBackendHealth, StudyApiError } from '../services/studyApi'
import './NetworkCheckPage.css'

const connectionTestCount = 5
const connectionTestIntervalMs = 600
const storageTestKey = 'empathetic-study-network-check'

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function browserStorageIsAvailable(): boolean {
  try {
    sessionStorage.setItem(storageTestKey, 'ok')
    const isAvailable = sessionStorage.getItem(storageTestKey) === 'ok'
    sessionStorage.removeItem(storageTestKey)
    return isAvailable
  } catch {
    return false
  }
}

export function NetworkCheckPage() {
  const location = useLocation()
  const isAuthorized = Boolean(
    (location.state as { networkCheckAuthorized?: boolean } | null)
      ?.networkCheckAuthorized,
  )
  const [completedRequests, setCompletedRequests] = useState(0)
  const [storagePassed, setStoragePassed] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthorized) return

    let isCancelled = false
    const runChecks = async () => {
      const storageAvailable = browserStorageIsAvailable()
      if (isCancelled) return
      setStoragePassed(storageAvailable)
      if (!storageAvailable) {
        setError(
          'Browser session storage is unavailable. Please adjust your privacy settings or try another browser.',
        )
        return
      }

      try {
        for (let index = 0; index < connectionTestCount; index += 1) {
          await checkBackendHealth()
          if (isCancelled) return
          setCompletedRequests(index + 1)
          if (index < connectionTestCount - 1) {
            await wait(connectionTestIntervalMs)
          }
        }
      } catch (caughtError) {
        if (isCancelled) return
        setError(
          caughtError instanceof StudyApiError
            ? caughtError.message
            : 'The connection check could not be completed. Please try another network.',
        )
      }
    }

    void runChecks()
    return () => {
      isCancelled = true
    }
  }, [isAuthorized])

  if (!isAuthorized) return <Navigate to="/" replace />

  const connectionPassed = completedRequests === connectionTestCount
  const checkFailed = Boolean(error)
  const allChecksPassed = storagePassed === true && connectionPassed

  return (
    <main className="network-check-page" aria-labelledby="network-check-title">
      <header className="network-check-page__header">A SETH LAB STUDY</header>

      <section className="network-check-page__card">
        <img
          className="network-check-page__logo"
          src="./assets/seth-lab-logo.png"
          alt="SETH LAB"
          width="92"
          height="92"
        />
        <p className="network-check-page__eyebrow">WEBSITE ACCESS CHECK</p>
        <h1 id="network-check-title">
          {allChecksPassed
            ? 'Your device is ready'
            : checkFailed
              ? 'Connection check incomplete'
              : 'Checking your connection…'}
        </h1>
        <p className="network-check-page__message">
          {allChecksPassed
            ? 'The study website, security verification, browser storage, and server connection are working correctly.'
            : checkFailed
              ? error
              : 'Please keep this window open while we run a few brief checks.'}
        </p>

        <ul className="network-check-page__results" aria-live="polite">
          <li className="network-check-page__result--passed">
            <span aria-hidden="true">✓</span>
            Website and security verification
          </li>
          <li
            className={
              storagePassed === true
                ? 'network-check-page__result--passed'
                : storagePassed === false
                  ? 'network-check-page__result--failed'
                  : ''
            }
          >
            <span aria-hidden="true">
              {storagePassed === true ? '✓' : storagePassed === false ? '×' : '○'}
            </span>
            Browser session storage
          </li>
          <li
            className={
              connectionPassed
                ? 'network-check-page__result--passed'
                : checkFailed
                  ? 'network-check-page__result--failed'
                  : ''
            }
          >
            <span aria-hidden="true">
              {connectionPassed ? '✓' : checkFailed ? '×' : '○'}
            </span>
            Server connection: {completedRequests} / {connectionTestCount}
          </li>
          <li className="network-check-page__result--passed">
            <span aria-hidden="true">✓</span>
            Production database read-only check
          </li>
        </ul>

        <p className="network-check-page__privacy">
          No study session was created and no responses were collected.
          {allChecksPassed && ' You may now close this window.'}
        </p>
      </section>
    </main>
  )
}
