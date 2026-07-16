import { HashRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { questionnairePath, routes, scenarioPath } from './config/routes'
import { HomePage } from './pages/HomePage'
import { QuestionnairePage } from './pages/QuestionnairePage'
import { RatePage } from './pages/RatePage'
import { ScenarioPage } from './pages/ScenarioPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path={routes.home} element={<HomePage />} />
        <Route
          path={routes.questionnaire}
          element={<Navigate to={questionnairePath(1)} replace />}
        />
        <Route
          path={`${routes.questionnaire}/:questionnaireNumber`}
          element={<QuestionnairePage />}
        />
        <Route
          path={routes.scenarioIntroduction}
          element={<Navigate to={scenarioPath(1)} replace />}
        />
        <Route
          path={routes.scenario}
          element={<Navigate to={scenarioPath(1)} replace />}
        />
        <Route
          path={`${routes.scenario}/:scenarioNumber`}
          element={<ScenarioPage />}
        />
        <Route
          path={`${routes.rate}/:scenarioNumber/:responseNumber`}
          element={<RatePage />}
        />
        <Route
          path={routes.end}
          element={
            <main className="route-placeholder">
              <p>Thank you. You have completed the study.</p>
              <Link to={routes.home}>Return home</Link>
            </main>
          }
        />
      </Routes>
    </HashRouter>
  )
}

export default App
