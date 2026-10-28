import { useEffect, useState } from 'react'
import {
  Bell,
  BellOff,
  CalendarCheck,
  CheckCheck,
  ClipboardCheck,
  Clock,
  MessageSquare,
  RefreshCcw,
  UserCheck,
} from 'lucide-react'
import apiClient from '../api/client'
import { NOTIFICATIONS_CHANGED } from '../lib/events'
import { Alert, Button, Card, EmptyState, LoadingState, PageHeader } from '../components/ui'
import { cx } from '../lib/cx'
import { apiError, formatDateTime, relativeTime } from '../lib/format'

const TYPE_VISUALS = {
  BOOKING_CONFIRMED: { icon: CalendarCheck, classes: 'bg-brand-50 text-brand-600' },
  REVIEW_COMPLETED: { icon: ClipboardCheck, classes: 'bg-emerald-50 text-emerald-600' },
  SUPERVISOR_ASSIGNED: { icon: UserCheck, classes: 'bg-violet-50 text-violet-600' },
  NEW_MESSAGE: { icon: MessageSquare, classes: 'bg-sky-50 text-sky-600' },
  STATUS_CHANGED: { icon: RefreshCcw, classes: 'bg-teal-50 text-teal-600' },
  SLOT_REMINDER: { icon: Clock, classes: 'bg-amber-50 text-amber-600' },
  GENERAL: { icon: Bell, classes: 'bg-slate-100 text-slate-600' },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
]

function announceChange() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  async function load() {
    try {
      const { data } = await apiClient.get('/notifications')
      setNotifications(data)
      setError('')
    } catch (err) {
      setError(apiError(err, 'Could not load notifications'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const visible = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications

  async function markOneRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    try {
      await apiClient.put(`/notifications/${id}/read`)
    } catch {
      load()
    }
    announceChange()
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      await apiClient.put('/notifications/read-all')
    } catch {
      load()
    }
    announceChange()
  }

  if (loading) return <LoadingState label="Loading notifications…" />

  return (
    <>
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `You have ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}.` : "You're all caught up."}
        actions={
          unreadCount > 0 && (
            <Button variant="secondary" size="sm" icon={CheckCheck} onClick={markAllRead}>
              Mark all as read
            </Button>
          )
        }
      />

      {error && <Alert className="mb-6">{error}</Alert>}

      <Card>
        <div className="flex gap-1 border-b border-slate-200 px-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cx(
                '-mb-px flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                filter === f.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              {f.label}
              {f.key === 'unread' && unreadCount > 0 && (
                <span className="rounded-full bg-brand-100 px-1.5 text-xs font-semibold text-brand-700">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description="Updates about bookings, reviews, supervisors and messages will appear here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((n) => {
              const { icon: Icon, classes } = TYPE_VISUALS[n.type] ?? TYPE_VISUALS.GENERAL
              return (
                <li key={n.id} className={cx('flex gap-4 px-5 py-4 transition-colors', !n.isRead && 'bg-brand-50/40')}>
                  <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', classes)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className={cx('text-sm text-slate-900', !n.isRead ? 'font-semibold' : 'font-medium')}>{n.title}</p>
                      <time dateTime={n.createdAt} title={formatDateTime(n.createdAt)} className="text-xs whitespace-nowrap text-slate-500">
                        {relativeTime(n.createdAt)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                    {!n.isRead && (
                      <button
                        onClick={() => markOneRead(n.id)}
                        className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                  {!n.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}
