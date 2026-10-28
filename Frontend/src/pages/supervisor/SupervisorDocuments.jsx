import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import apiClient from '../../api/client'
import DocumentsPanel from '../../components/DocumentsPanel'

export default function SupervisorDocuments() {
  const { thesisId } = useParams()
  const [thesis, setThesis] = useState(null)

  useEffect(() => {
    apiClient.get('/theses/supervised').then(({ data }) => {
      setThesis(data.find((t) => t.id === thesisId) ?? null)
    })
  }, [thesisId])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A2E]">{thesis?.studentName ?? 'Documents'}</h1>
        {thesis?.title && <p className="text-sm text-gray-500">{thesis.title}</p>}
      </div>
      <DocumentsPanel thesisId={thesisId} allowUpload={false} />
    </div>
  )
}
