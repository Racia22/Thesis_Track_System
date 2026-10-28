import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const STUDENT_NAV = [
  { to: '/student/dashboard', label: 'Dashboard' },
  { to: '/student/book-slot', label: 'Book a Slot' },
  { to: '/student/messages', label: 'Messages' },
  { to: '/student/documents', label: 'Documents' },
  { to: '/student/notifications', label: 'Notifications' },
]

const COORDINATOR_NAV = [
  { to: '/coordinator/slots', label: 'Review Slots' },
  { to: '/coordinator/supervisor-queue', label: 'Supervisor Queue' },
]

const ADMIN_NAV = [...COORDINATOR_NAV, { to: '/admin/analytics', label: 'Analytics' }]

const SUPERVISOR_NAV = [
  { to: '/supervisor/students', label: 'My Students' },
  { to: '/supervisor/notifications', label: 'Notifications' },
]

function navForRole(role) {
  if (role === 'STUDENT') return STUDENT_NAV
  if (role === 'ADMIN') return ADMIN_NAV
  if (role === 'COORDINATOR') return COORDINATOR_NAV
  if (role === 'SUPERVISOR') return SUPERVISOR_NAV
  return [{ to: '/', label: 'Dashboard' }]
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navItems = navForRole(user?.role)

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <header className="flex items-center justify-between bg-[#1A1A2E] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="rounded-md p-2 text-white sm:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg font-semibold text-white">ThesisTrack</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/80 sm:inline">{user?.name}</span>
          <button
            onClick={logout}
            className="rounded-md bg-[#FF6B35] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#e35a28]"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="flex">
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-16 z-40 bg-black/40 sm:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={[
            'fixed inset-y-0 top-16 left-0 z-50 w-64 shrink-0 overflow-y-auto bg-[#1A1A2E] px-3 py-4',
            'transition-transform duration-200 ease-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'sm:sticky sm:top-16 sm:z-auto sm:h-[calc(100vh-4rem)] sm:translate-x-0',
          ].join(' ')}
        >
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  [
                    'rounded-md px-3 py-2 text-sm font-medium',
                    isActive ? 'bg-[#FF6B35] text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
