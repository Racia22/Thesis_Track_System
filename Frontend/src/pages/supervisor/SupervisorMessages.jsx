import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import apiClient from '../../api/client'
import MessageThread from '../../components/MessageThread'

export default function SupervisorMessages() {
  const { thesisId } = useParams()
  const [thesis, setThesis] = useState(null)

  useEffect(() => {
    apiClient.get('/theses/supervised').then(({ data }) => {
      setThesis(data.find((t) => t.id === thesisId) ?? null)
    })
  }, [thesisId])

  return (
    <MessageThread
      thesisId={thesisId}
      title={thesis?.studentName ?? 'Conversation'}
      subtitle={thesis?.title}
    />
  )
}
