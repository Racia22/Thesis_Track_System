import { useEffect, useState } from 'react'
import apiClient from '../../api/client'
import MessageThread from '../../components/MessageThread'

export default function StudentMessages() {
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
        setStatus(err.response?.status === 404 ? 'none' : 'error')
      })
  }, [])

  if (status === 'loading') {
    return <p className="text-sm text-gray-500">Loading…</p>
  }

  if (status === 'error') {
    return <p className="text-sm text-red-600">Something went wrong. Please refresh.</p>
  }

  if (status === 'none') {
    return <p className="text-sm text-gray-500">Register a thesis first to start messaging your supervisor.</p>
  }

  if (!thesis.supervisorId) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">Messages</h1>
        <p className="mt-2 text-sm text-gray-500">
          You don't have a supervisor assigned yet. Once a coordinator assigns you one, you'll be able to message
          them here.
        </p>
      </div>
    )
  }

  return (
    <MessageThread
      thesisId={thesis.id}
      title={thesis.supervisorName}
      subtitle={thesis.supervisorEmail}
    />
  )
}
