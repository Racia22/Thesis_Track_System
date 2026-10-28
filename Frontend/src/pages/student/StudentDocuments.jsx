import { useEffect, useState } from 'react'
import apiClient from '../../api/client'
import DocumentsPanel from '../../components/DocumentsPanel'

export default function StudentDocuments() {
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
    return <p className="text-sm text-gray-500">Register a thesis first to upload documents.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[#1A1A2E]">Documents</h1>
      <DocumentsPanel thesisId={thesis.id} allowUpload />
    </div>
  )
}
