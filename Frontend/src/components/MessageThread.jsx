import { Fragment, useEffect, useRef, useState } from 'react'
import { MessagesSquare, SendHorizontal } from 'lucide-react'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert, Avatar, Button, Card, EmptyState, Spinner } from './ui'
import { cx } from '../lib/cx'
import { apiError } from '../lib/format'

function dayKey(value) {
  return new Date(value).toDateString()
}

function dayLabel(value) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

function timeOf(value) {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function MessageThread({ thesisId, title, subtitle }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function loadThread() {
      setLoading(true)
      setError('')
      try {
        const { data } = await apiClient.get(`/messages/${thesisId}`)
        if (cancelled) return
        setMessages(data)
        await apiClient.put(`/messages/${thesisId}/read`)
      } catch (err) {
        if (!cancelled) setError(apiError(err, 'Could not load this conversation'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadThread()
    return () => {
      cancelled = true
    }
  }, [thesisId])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  async function send() {
    const content = draft.trim()
    if (!content) return
    setSending(true)
    setError('')
    try {
      const { data } = await apiClient.post(`/messages/${thesisId}`, { content })
      setMessages((prev) => [...prev, data])
      setDraft('')
    } catch (err) {
      setError(apiError(err, 'Could not send your message'))
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    send()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <Card className="flex h-[calc(100dvh-13rem)] min-h-[420px] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5">
        <Avatar name={title} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50/60 px-4 py-5 sm:px-6">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="No messages yet"
            description="Start the conversation — introduce yourself or share an update on your progress."
            className="h-full justify-center"
          />
        ) : (
          <div className="space-y-1">
            {messages.map((message, i) => {
              const isMine = message.senderId === user?.id
              const prev = messages[i - 1]
              const newDay = !prev || dayKey(prev.sentAt) !== dayKey(message.sentAt)
              const grouped = !newDay && prev?.senderId === message.senderId

              return (
                <Fragment key={message.id}>
                  {newDay && (
                    <div className="flex items-center gap-3 py-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs font-medium text-slate-500">{dayLabel(message.sentAt)}</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                  )}
                  <div className={cx('flex gap-2.5', isMine ? 'justify-end' : 'justify-start', !grouped && 'pt-2')}>
                    {!isMine && (
                      <div className="w-8 shrink-0">{!grouped && <Avatar name={message.senderName} size="sm" />}</div>
                    )}
                    <div className={cx('flex max-w-[78%] flex-col', isMine ? 'items-end' : 'items-start')}>
                      {!grouped && (
                        <p className="mb-1 text-xs text-slate-500">
                          {!isMine && <span className="font-medium text-slate-700">{message.senderName} · </span>}
                          {timeOf(message.sentAt)}
                        </p>
                      )}
                      <div
                        className={cx(
                          'rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap shadow-xs',
                          isMine
                            ? 'rounded-tr-md bg-brand-600 text-white'
                            : 'rounded-tl-md border border-slate-200 bg-white text-slate-800',
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                </Fragment>
              )
            })}
          </div>
        )}
      </div>

      {error && <Alert className="mx-4 mb-2 sm:mx-6">{error}</Alert>}

      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-1.5 pl-3 shadow-xs focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-500/15">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Write a message…"
            aria-label="Message"
            className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <Button type="submit" size="icon" loading={sending} disabled={!draft.trim()} aria-label="Send message">
            {!sending && <SendHorizontal className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-1.5 hidden px-1 text-[11px] text-slate-400 sm:block">Enter to send · Shift + Enter for a new line</p>
      </form>
    </Card>
  )
}
