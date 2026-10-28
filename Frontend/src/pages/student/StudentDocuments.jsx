import { FileX2 } from 'lucide-react'
import DocumentsPanel from '../../components/DocumentsPanel'
import useMyThesis from '../../hooks/useMyThesis'
import { Alert, Button, Card, EmptyState, LoadingState, PageHeader } from '../../components/ui'

export default function StudentDocuments() {
  const { thesis, status } = useMyThesis()

  if (status === 'loading') return <LoadingState />
  if (status === 'error') return <Alert>Something went wrong. Please refresh the page.</Alert>

  return (
    <>
      <PageHeader
        title="Documents"
        description="Upload drafts and supporting files. Uploading a file with the same name creates a new version."
      />
      {status === 'none' ? (
        <Card>
          <EmptyState
            icon={FileX2}
            title="Register your thesis first"
            description="You can upload documents once your thesis is registered."
            action={<Button to="/student/dashboard">Go to dashboard</Button>}
          />
        </Card>
      ) : (
        <DocumentsPanel thesisId={thesis.id} allowUpload />
      )}
    </>
  )
}
