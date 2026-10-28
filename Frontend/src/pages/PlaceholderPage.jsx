import { Construction } from 'lucide-react'
import { Card, EmptyState, PageHeader } from '../components/ui'

export default function PlaceholderPage({ title }) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <EmptyState icon={Construction} title="Coming soon" description="This page is coming in a later phase." />
      </Card>
    </>
  )
}
