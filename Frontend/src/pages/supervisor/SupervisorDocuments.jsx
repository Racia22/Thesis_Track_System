import { useParams } from 'react-router-dom'
import DocumentsPanel from '../../components/DocumentsPanel'
import useSupervisedThesis from '../../hooks/useSupervisedThesis'
import { PageHeader, StageBadge } from '../../components/ui'
import { BackToStudents } from './SupervisorMessages'

export default function SupervisorDocuments() {
  const { thesisId } = useParams()
  const thesis = useSupervisedThesis(thesisId)

  return (
    <>
      <PageHeader
        eyebrow={<BackToStudents />}
        title={thesis ? `${thesis.studentName} — documents` : 'Documents'}
        description={thesis?.title}
        actions={thesis && <StageBadge status={thesis.status} />}
      />
      <DocumentsPanel thesisId={thesisId} allowUpload={false} />
    </>
  )
}
