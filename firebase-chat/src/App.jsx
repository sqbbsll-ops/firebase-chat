import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ExperimentAuthProvider, useExperimentAuth } from './contexts/ExperimentAuthContext'
import ParticipantPage from './pages/ParticipantPage'
import AdminPage from './pages/AdminPage'
import './App.css'

function AppRoutes() {
  const { ready, error } = useExperimentAuth()

  if (error) {
    return (
      <div className="appShell">
        <div className="loading">Could not connect: {error.message}</div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="appShell">
        <div className="loading">Loading…</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/participant/:id/:group" element={<ParticipantPage />} />
      <Route path="/" element={<Navigate to="/participant/A/group1" replace />} />
      <Route path="*" element={<Navigate to="/participant/A/group1" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ExperimentAuthProvider>
      <BrowserRouter>
        <div className="appShell">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </ExperimentAuthProvider>
  )
}
