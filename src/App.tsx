import { HashRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { questionnairePath, routes } from './config/routes'
import { HomePage } from './pages/HomePage'
import { QuestionnairePage } from './pages/QuestionnairePage'

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
          element={
            <main className="route-placeholder">
              <p>Scenario pages will be implemented next.</p>
              <Link to={questionnairePath(3)}>Return to Questionnaire 3</Link>
            </main>
          }
        />
      </Routes>
    </HashRouter>
  )
}

export default App
