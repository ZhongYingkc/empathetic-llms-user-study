import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { routes } from './config/routes'
import { HomePage } from './pages/HomePage'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path={routes.home} element={<HomePage />} />
        <Route
          path={routes.questionnaire}
          element={
            <main className="route-placeholder">
              <p>Questionnaire page will be implemented next.</p>
              <Link to={routes.home}>Return home</Link>
            </main>
          }
        />
      </Routes>
    </HashRouter>
  )
}

export default App
