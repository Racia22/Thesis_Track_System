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

function HomeRedirect() {
  const { user } = useAuth()
  if (user?.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />
  if (user?.role === 'COORDINATOR' || user?.role === 'ADMIN') return <Navigate to="/coordinator/slots" replace />
  if (user?.role === 'SUPERVISOR') return <Navigate to="/supervisor/students" replace />
  return <PlaceholderPage title={`${user?.role ?? ''} dashboard`} />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/book-slot" element={<BookSlot />} />
            <Route path="/student/messages" element={<StudentMessages />} />
            <Route path="/student/documents" element={<StudentDocuments />} />
            <Route path="/student/notifications" element={<NotificationsPage />} />
            <Route path="/coordinator/slots" element={<SlotsManagement />} />
            <Route path="/coordinator/supervisor-queue" element={<SupervisorQueue />} />
            <Route path="/supervisor/students" element={<StudentsList />} />
            <Route path="/supervisor/messages/:thesisId" element={<SupervisorMessages />} />
            <Route path="/supervisor/documents/:thesisId" element={<SupervisorDocuments />} />
            <Route path="/supervisor/notifications" element={<NotificationsPage />} />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
