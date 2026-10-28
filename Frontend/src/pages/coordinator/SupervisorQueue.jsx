import { useEffect, useState } from 'react'
import { Hourglass, PartyPopper, UserCheck, Users } from 'lucide-react'
import apiClient from '../../api/client'
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
  StatCard,
  Table,
  WaitBadge,
} from '../../components/ui'
import { apiError, daysLabel } from '../../lib/format'

function AssignControl({ thesisId, supervisors, value, onChange, onAssign, busy, stacked }) {
  return (
    <div className={stacked ? 'flex flex-col gap-2' : 'flex items-center justify-end gap-2'}>
      <Select
        value={value ?? ''}
        onChange={(e) => onChange(thesisId, e.target.value)}
        className={stacked ? '' : 'w-60'}
        aria-label="Supervisor"
      >
        <option value="">Choose a supervisor…</option>
        {supervisors.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — {s.currentStudentCount} active
          </option>
        ))}
      </Select>
      <Button onClick={() => onAssign(thesisId)} disabled={!value} loading={busy} icon={UserCheck} size="md">
        Assign
      </Button>
    </div>
  )
}

export default function SupervisorQueue() {
  const [queue, setQueue] = useState([])
  const [supervisors, setSupervisors] = useState([])
  const [selected, setSelected] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busyThesisId, setBusyThesisId] = useState(null)

  async function loadData() {
    try {
      const [queueRes, supervisorsRes] = await Promise.all([
        apiClient.get('/theses/queue/supervisor'),
        apiClient.get('/supervisors'),
      ])
      setQueue(queueRes.data)
      setSupervisors(supervisorsRes.data)
    } catch (err) {
      setError(apiError(err, 'Could not load the assignment queue'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleSelect(thesisId, supervisorId) {
    setSelected((s) => ({ ...s, [thesisId]: supervisorId }))
  }

  async function handleAssign(thesisId) {
    const supervisorId = selected[thesisId]
    if (!supervisorId) return

    setError('')
    setSuccess('')
    setBusyThesisId(thesisId)
    try {
      const { data } = await apiClient.post(`/theses/${thesisId}/assign-supervisor`, { supervisorId })
      setSuccess(`${data.supervisorName} is now supervising ${data.studentName}.`)
      await loadData()
    } catch (err) {
      setError(apiError(err, 'Could not assign supervisor'))
    } finally {
      setBusyThesisId(null)
    }
  }

  if (loading) return <LoadingState label="Loading assignment queue…" />

  const longestWait = queue.reduce((max, t) => Math.max(max, t.daysInCurrentStage), 0)
  const averageLoad = supervisors.length
    ? (supervisors.reduce((sum, s) => sum + s.currentStudentCount, 0) / supervisors.length).toFixed(1)
    : '—'

  const controlProps = (thesisId) => ({
    thesisId,
    supervisors,
    value: selected[thesisId],
    onChange: handleSelect,
    onAssign: handleAssign,
    busy: busyThesisId === thesisId,
  })

  return (
    <>
      <PageHeader
        title="Supervisor assignment"
        description="Students whose prototype has been reviewed and who are waiting for a supervisor, longest-waiting first."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Waiting for a supervisor" value={queue.length} icon={Users} />
        <StatCard
          label="Longest wait"
          value={queue.length ? daysLabel(longestWait) : '—'}
          icon={Hourglass}
          tone={longestWait >= 30 ? 'red' : 'amber'}
        />
        <StatCard label="Avg. students per supervisor" value={averageLoad} hint={`${supervisors.length} supervisors`} icon={UserCheck} tone="violet" />
      </div>

      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <Card>
          <CardHeader title="Queue" />
          {queue.length === 0 ? (
            <EmptyState icon={PartyPopper} title="Queue is clear" description="Every reviewed student has a supervisor." />
          ) : (
            <>
              {/* Cards below md: the assign control is the point of this page, so it must not scroll off-screen. */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {queue.map((thesis) => (
                  <li key={thesis.id} className="space-y-3 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={thesis.studentName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{thesis.studentName}</p>
                          <p className="truncate text-xs text-slate-500">{thesis.studentEmail}</p>
                        </div>
                      </div>
                      <WaitBadge days={thesis.daysInCurrentStage} />
                    </div>
                    <p className="text-sm text-slate-700">{thesis.title}</p>
                    <AssignControl {...controlProps(thesis.id)} stacked />
                  </li>
                ))}
              </ul>

              <div className="hidden md:block">
                <Table
                  minWidth={760}
                  columns={[
                    { label: 'Student' },
                    { label: 'Thesis' },
                    { label: 'Waiting' },
                    { label: 'Assign supervisor', align: 'right' },
                  ]}
                >
                  {queue.map((thesis) => (
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
                        <WaitBadge days={thesis.daysInCurrentStage} />
                      </td>
                      <td className="px-5 py-3">
                        <AssignControl {...controlProps(thesis.id)} />
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
