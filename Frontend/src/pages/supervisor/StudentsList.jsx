import { useEffect, useMemo, useState } from 'react'
import { FileText, GraduationCap, MessageSquare, Search, UserRoundX, Users, Hourglass } from 'lucide-react'
import apiClient from '../../api/client'
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  StageBadge,
  StatCard,
  Table,
} from '../../components/ui'
import { apiError, daysLabel } from '../../lib/format'

function ActionLinks({ thesisId }) {
  return (
    <div className="flex justify-end gap-2">
      <Button to={`/supervisor/messages/${thesisId}`} size="sm" variant="secondary" icon={MessageSquare}>
        Message
      </Button>
      <Button to={`/supervisor/documents/${thesisId}`} size="sm" variant="secondary" icon={FileText}>
        Documents
      </Button>
    </div>
  )
}

export default function StudentsList() {
  const [theses, setTheses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    apiClient
      .get('/theses/supervised')
      .then(({ data }) => setTheses(data))
      .catch((err) => setError(apiError(err, 'Could not load your students')))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return theses
    return theses.filter((t) => [t.studentName, t.studentEmail, t.title].some((v) => v?.toLowerCase().includes(q)))
  }, [theses, query])

  if (loading) return <LoadingState label="Loading your students…" />

  const active = theses.filter((t) => t.status !== 'COMPLETED')
  const readyForDefense = theses.filter((t) => t.status === 'READY_FOR_DEFENSE').length
  const longestInStage = active.reduce((max, t) => Math.max(max, t.daysInCurrentStage), 0)

  return (
    <>
      <PageHeader title="My students" description="Theses you are supervising and where each one stands." />

      {error && <Alert className="mb-6">{error}</Alert>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active students" value={active.length} hint={`${theses.length} total`} icon={Users} />
        <StatCard label="Ready for defense" value={readyForDefense} icon={GraduationCap} tone="green" />
        <StatCard
          label="Longest time in one stage"
          value={active.length ? daysLabel(longestInStage) : '—'}
          icon={Hourglass}
          tone="amber"
        />
      </div>

      <Card>
        <CardHeader
          title="Students"
          actions={
            theses.length > 0 && (
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search students or titles"
                  className="w-64 max-w-full pl-9"
                  aria-label="Search students"
                />
              </div>
            )
          }
        />

        {theses.length === 0 ? (
          <EmptyState
            icon={UserRoundX}
            title="No students assigned yet"
            description="When a coordinator assigns a student to you, they'll appear here and you'll get a notification."
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No matches" description={`Nothing matches “${query}”.`} />
        ) : (
          <>
            <ul className="divide-y divide-slate-100 md:hidden">
              {filtered.map((thesis) => (
                <li key={thesis.id} className="space-y-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={thesis.studentName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{thesis.studentName}</p>
                      <p className="truncate text-xs text-slate-500">{thesis.studentEmail}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">{thesis.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <StageBadge status={thesis.status} short />
                    <span className="text-xs text-slate-500">{daysLabel(thesis.daysInCurrentStage)} in stage</span>
                  </div>
                  <ActionLinks thesisId={thesis.id} />
                </li>
              ))}
            </ul>

            <div className="hidden md:block">
              <Table
                minWidth={820}
                columns={[
                  { label: 'Student' },
                  { label: 'Thesis' },
                  { label: 'Stage' },
                  { label: 'In stage' },
                  { label: <span className="sr-only">Actions</span>, key: 'actions', align: 'right' },
                ]}
              >
                {filtered.map((thesis) => (
                  <tr key={thesis.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={thesis.studentName} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{thesis.studentName}</p>
                          <p className="text-xs text-slate-500">{thesis.studentEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs px-5 py-3 text-slate-700">
                      <p className="line-clamp-2">{thesis.title}</p>
                    </td>
                    <td className="px-5 py-3">
                      <StageBadge status={thesis.status} short />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600 tabular-nums">
                      {daysLabel(thesis.daysInCurrentStage)}
                    </td>
                    <td className="px-5 py-3">
                      <ActionLinks thesisId={thesis.id} />
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          </>
        )}
      </Card>
    </>
  )
}
