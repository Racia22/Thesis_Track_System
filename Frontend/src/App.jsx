import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/student/StudentDashboard'
import BookSlot from './pages/student/BookSlot'
import StudentMessages from './pages/student/StudentMessages'
import StudentDocuments from './pages/student/StudentDocuments'
import SlotsManagement from './pages/coordinator/SlotsManagement'
import SupervisorQueue from './pages/coordinator/SupervisorQueue'
import StudentsList from './pages/supervisor/StudentsList'
import SupervisorMessages from './pages/supervisor/SupervisorMessages'
import SupervisorDocuments from './pages/supervisor/SupervisorDocuments'
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard'
import NotificationsPage from './pages/NotificationsPage'
import PlaceholderPage from './pages/PlaceholderPage'

const HOME_BY_ROLE = {
  STUDENT: '/student/dashboard',
  SUPERVISOR: '/supervisor/students',
  COORDINATOR: '/coordinator/slots',
  ADMIN: '/coordinator/slots',
}

function HomeRedirect() {
  const { user } = useAuth()
  const home = HOME_BY_ROLE[user?.role]
  if (home) return <Navigate to={home} replace />
  return <PlaceholderPage title="Dashboard" />
}

function GuestOnly({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : children
}

function RoleRoute({ roles, children }) {
  return <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
}

const STUDENT = ['STUDENT']
const SUPERVISOR = ['SUPERVISOR']
const COORDINATION = ['COORDINATOR', 'ADMIN']

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            <Route path="/student/dashboard" element={<RoleRoute roles={STUDENT}><StudentDashboard /></RoleRoute>} />
            <Route path="/student/book-slot" element={<RoleRoute roles={STUDENT}><BookSlot /></RoleRoute>} />
            <Route path="/student/messages" element={<RoleRoute roles={STUDENT}><StudentMessages /></RoleRoute>} />
            <Route path="/student/documents" element={<RoleRoute roles={STUDENT}><StudentDocuments /></RoleRoute>} />

            <Route path="/supervisor/students" element={<RoleRoute roles={SUPERVISOR}><StudentsList /></RoleRoute>} />
            <Route path="/supervisor/messages/:thesisId" element={<RoleRoute roles={SUPERVISOR}><SupervisorMessages /></RoleRoute>} />
            <Route path="/supervisor/documents/:thesisId" element={<RoleRoute roles={SUPERVISOR}><SupervisorDocuments /></RoleRoute>} />

            <Route path="/coordinator/slots" element={<RoleRoute roles={COORDINATION}><SlotsManagement /></RoleRoute>} />
            <Route path="/coordinator/supervisor-queue" element={<RoleRoute roles={COORDINATION}><SupervisorQueue /></RoleRoute>} />

            <Route path="/admin/analytics" element={<RoleRoute roles={['ADMIN']}><AnalyticsDashboard /></RoleRoute>} />

            {/* Old per-role notification URLs, kept so existing links still work. */}
            <Route path="/student/notifications" element={<Navigate to="/notifications" replace />} />
            <Route path="/supervisor/notifications" element={<Navigate to="/notifications" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
