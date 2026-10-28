import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  CalendarClock,
  CalendarPlus,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Users,
  X,
} from 'lucide-react'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/ui'
import { cx } from '../lib/cx'
import { roleLabel } from '../lib/format'
import { NOTIFICATIONS_CHANGED } from '../lib/events'

const NOTIFICATIONS_ITEM = { to: '/notifications', label: 'Notifications', icon: Bell, showUnread: true }

const NAV_BY_ROLE = {
  STUDENT: [
    {
      section: 'My thesis',
      items: [
        { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/student/book-slot', label: 'Prototype review', icon: CalendarPlus },
        { to: '/student/documents', label: 'Documents', icon: FileText },
        { to: '/student/messages', label: 'Messages', icon: MessageSquare },
      ],
    },
    { section: 'Account', items: [NOTIFICATIONS_ITEM] },
  ],
  SUPERVISOR: [
    {
      section: 'Supervision',
      items: [{ to: '/supervisor/students', label: 'My students', icon: Users }],
    },
    { section: 'Account', items: [NOTIFICATIONS_ITEM] },
  ],
  COORDINATOR: [
    {
      section: 'Coordination',
      items: [
        { to: '/coordinator/slots', label: 'Review slots', icon: CalendarClock },
        { to: '/coordinator/supervisor-queue', label: 'Assignment queue', icon: ListChecks },
      ],
    },
    { section: 'Account', items: [NOTIFICATIONS_ITEM] },
  ],
  ADMIN: [
    {
      section: 'Coordination',
      items: [
        { to: '/coordinator/slots', label: 'Review slots', icon: CalendarClock },
        { to: '/coordinator/supervisor-queue', label: 'Assignment queue', icon: ListChecks },
      ],
    },
    {
      section: 'Insights',
      items: [{ to: '/admin/analytics', label: 'Analytics', icon: BarChart3 }],
    },
    { section: 'Account', items: [NOTIFICATIONS_ITEM] },
  ],
}

function useUnreadCount() {
  const [count, setCount] = useState(0)
  const location = useLocation()

  const refresh = useCallback(() => {
    apiClient
      .get('/notifications')
      .then(({ data }) => setCount(data.filter((n) => !n.isRead).length))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh, location.pathname])

  useEffect(() => {
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh)
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, refresh)
  }, [refresh])

  return count
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-slate-900">ThesisTrack</span>
        <span className="block text-xs text-slate-500">AUCA Thesis Office</span>
      </span>
    </Link>
  )
}

function Sidebar({ sections, unreadCount, user, onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Brand />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
        {sections.map((section) => (
          <div key={section.section}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {section.section}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cx(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cx(
                            'h-[18px] w-[18px] shrink-0',
                            isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-500',
                          )}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.showUnread && unreadCount > 0 && (
                          <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] leading-none font-semibold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={user?.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{roleLabel(user?.role)}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const unreadCount = useUnreadCount()
  const sections = NAV_BY_ROLE[user?.role] ?? []

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const sidebarProps = {
    sections,
    unreadCount,
    user,
    onLogout: logout,
  }

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <Sidebar {...sidebarProps} />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-3 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar {...sidebarProps} onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            className="-ml-1 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Brand />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/notifications"
              className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </Link>
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />
            <div className="hidden items-center gap-2.5 sm:flex">
              <Avatar name={user?.name} size="sm" />
              <div className="leading-tight">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{roleLabel(user?.role)}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
