import { useEffect, useRef, useState } from 'react'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatTimestamp(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MessageThread({ thesisId, title, subtitle }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  async function loadThread() {
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.get(`/messages/${thesisId}`)
      setMessages(data)
      await apiClient.put(`/messages/${thesisId}/read`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this conversation')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadThread()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thesisId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!draft.trim()) return
    setSending(true)
    setError('')
    try {
      const { data } = await apiClient.post(`/messages/${thesisId}`, { content: draft.trim() })
      setMessages((prev) => [...prev, data])
      setDraft('')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send your message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] max-h-[720px] flex-col rounded-2xl bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-[#1A1A2E]">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {loading && <p className="text-sm text-gray-500">Loading conversation…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-gray-500">No messages yet. Say hello.</p>
        )}
        {messages.map((message) => {
          const isMine = message.senderId === user?.id
          return (
            <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={[
                  'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                  isMine ? 'bg-[#FF6B35] text-white' : 'bg-[#FFF8F0] text-[#1A1A2E]',
                ].join(' ')}
              >
                {!isMine && <p className="mb-0.5 text-xs font-semibold opacity-70">{message.senderName}</p>}
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className={`mt-1 text-[11px] ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                  {formatTimestamp(message.sentAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-6 pb-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 p-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-md bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e35a28] disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
