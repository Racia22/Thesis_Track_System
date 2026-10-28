import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/client'
import ProgressTracker from '../../components/ProgressTracker'

const QUICK_ACTIONS = [
  { to: '/student/book-slot', label: 'Book a Prototype Slot', description: 'View and reserve an available review slot' },
  { to: '/student/messages', label: 'Messages', description: 'Talk to your assigned supervisor' },
  { to: '/student/documents', label: 'Documents', description: 'Upload and manage thesis documents' },
  { to: '/student/notifications', label: 'Notifications', description: 'See your recent updates' },
]

function RegisterThesisForm({ onRegistered }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data } = await apiClient.post('/theses', { title, description })
      onRegistered(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register your thesis')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-[#1A1A2E]">Register your thesis</h2>
      <p className="mb-6 text-sm text-gray-500">
        You haven't registered a thesis yet. Do that here to start tracking your progress.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">Thesis title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#1A1A2E]">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e35a28] disabled:opacity-60"
        >
          {submitting ? 'Registering…' : 'Register thesis'}
        </button>
      </form>
    </div>
  )
}

export default function StudentDashboard() {
  const [thesis, setThesis] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    apiClient
      .get('/theses/my')
      .then(({ data }) => {
        setThesis(data)
        setStatus('found')
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setStatus('none')
        } else {
          setStatus('error')
        }
      })
  }, [])

  if (status === 'loading') {
    return <p className="text-sm text-gray-500">Loading your dashboard…</p>
  }

  if (status === 'error') {
    return <p className="text-sm text-red-600">Something went wrong loading your thesis. Please refresh.</p>
  }

  if (status === 'none') {
    return <RegisterThesisForm onRegistered={(data) => { setThesis(data); setStatus('found') }} />
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A2E]">{thesis.title}</h1>
        {thesis.description && <p className="mt-1 text-sm text-gray-500">{thesis.description}</p>}
      </div>

      <ProgressTracker status={thesis.status} daysInCurrentStage={thesis.daysInCurrentStage} />

      {thesis.supervisorName && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-[#1A1A2E]">Your supervisor</h2>
          <p className="text-sm text-gray-700">{thesis.supervisorName}</p>
          <p className="text-sm text-gray-500">{thesis.supervisorEmail}</p>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#1A1A2E]">Quick actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <p className="text-sm font-semibold text-[#1A1A2E]">{action.label}</p>
              <p className="mt-1 text-xs text-gray-500">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
