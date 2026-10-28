import { MessageSquareDashed } from 'lucide-react'
import MessageThread from '../../components/MessageThread'
import useMyThesis from '../../hooks/useMyThesis'
import { Alert, Button, Card, EmptyState, LoadingState, PageHeader } from '../../components/ui'

export default function StudentMessages() {
  const { thesis, status } = useMyThesis()

  if (status === 'loading') return <LoadingState />
  if (status === 'error') return <Alert>Something went wrong. Please refresh the page.</Alert>

  const header = <PageHeader title="Messages" description="Your private thread with your thesis supervisor." />

  if (status === 'none' || !thesis.supervisorId) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={MessageSquareDashed}
            title={status === 'none' ? 'Register your thesis first' : 'No supervisor yet'}
            description={
              status === 'none'
                ? 'Once your thesis is registered and a supervisor is assigned, you can message them here.'
                : "Once a coordinator assigns your supervisor, you'll be able to message them here."
            }
            action={status === 'none' && <Button to="/student/dashboard">Go to dashboard</Button>}
          />
        </Card>
      </>
    )
  }

  return (
    <>
      {header}
      <MessageThread thesisId={thesis.id} title={thesis.supervisorName} subtitle={thesis.supervisorEmail} />
    </>
  )
}
