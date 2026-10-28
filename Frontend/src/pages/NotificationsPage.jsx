import { useEffect, useState } from 'react'
import apiClient from '../api/client'

function formatTimestamp(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await apiClient.get('/notifications')
    setNotifications(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  async function markOneRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    try {
      await apiClient.put(`/notifications/${id}/read`)
    } catch {
      load()
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      await apiClient.put('/notifications/read-all')
    } catch {
      load()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#1A1A2E]">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-[#1A1A2E] hover:bg-gray-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">You're all caught up — no notifications yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start justify-between gap-4 px-6 py-4 ${!n.isRead ? 'bg-[#FFF8F0]' : ''}`}
              >
                <div>
                  <p className="text-sm font-medium text-[#1A1A2E]">{n.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatTimestamp(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markOneRead(n.id)}
                    className="shrink-0 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-[#1A1A2E] hover:bg-gray-50"
                  >
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
