import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import MessageThread from '../../components/MessageThread'
import useSupervisedThesis from '../../hooks/useSupervisedThesis'
import { PageHeader, StageBadge } from '../../components/ui'

export function BackToStudents() {
  return (
    <Link to="/supervisor/students" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
      <ChevronLeft className="h-4 w-4" />
      My students
    </Link>
  )
}

export default function SupervisorMessages() {
  const { thesisId } = useParams()
  const thesis = useSupervisedThesis(thesisId)

  return (
    <>
      <PageHeader
        eyebrow={<BackToStudents />}
        title={thesis?.studentName ?? 'Conversation'}
        description={thesis?.title}
        actions={thesis && <StageBadge status={thesis.status} />}
      />
      <MessageThread thesisId={thesisId} title={thesis?.studentName ?? 'Student'} subtitle={thesis?.studentEmail} />
    </>
  )
}
